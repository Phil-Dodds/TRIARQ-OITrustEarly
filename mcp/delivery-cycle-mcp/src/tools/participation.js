// participation.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G1 (D-563, D-564)
// Initiative-level C/I participation records: add_participation,
// remove_participation, list_participation, list_my_participation.
// G1 creates the records layer only — per-gate gate_consultations wiring,
// Division-default auto-attach, and notification flows land in G4/G5.

'use strict';

const { supabase } = require('../db');
// Contract 39 (D-584): post-Go-to-Build Consulted removal takes the heavy path.
const { sendGateNotificationEmail } = require('./helpers/notification-email');

const VALID_LETTERS = ['C', 'I'];
const VALID_SET_VIA = ['trio', 'self', 'rule', 'division_default', 'approver', 'leadership'];

/**
 * Add a C or I stake to an Initiative (D-564).
 * Holder is exactly one of holder_user_id / holder_group_id.
 * set_via='self' requires the holder to be the caller (one-tap Informed claim).
 * @param {string} params.delivery_cycle_id
 * @param {string} params.letter — 'C' | 'I'
 * @param {string} [params.holder_user_id]
 * @param {string} [params.holder_group_id]
 * @param {string} params.set_via
 */
async function add_participation(params, caller_user_id) {
  const { delivery_cycle_id, letter, holder_user_id, holder_group_id, set_via } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!VALID_LETTERS.includes(letter)) {
    return { success: false, error: "letter must be 'C' (Consulted) or 'I' (Informed)." };
  }
  if (!VALID_SET_VIA.includes(set_via)) {
    return { success: false, error: `set_via must be one of: ${VALID_SET_VIA.join(', ')}.` };
  }
  const hasUser  = !!holder_user_id;
  const hasGroup = !!holder_group_id;
  if (hasUser === hasGroup) {
    return { success: false, error: 'Exactly one of holder_user_id or holder_group_id is required.' };
  }
  if (set_via === 'self' && holder_user_id !== caller_user_id) {
    return { success: false, error: "set_via 'self' requires the holder to be the calling user." };
  }
  // Contract G4 (D-564): 'self' is the one-tap Informed claim only — Consulted
  // stakes attach via trio/approver/DL/IE roles.
  if (set_via === 'self' && letter !== 'I') {
    return { success: false, error: "set_via 'self' is the one-tap Informed claim — Consulted stakes are attached by the trio, the gate approver, or leadership." };
  }

  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, division_id, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  // ── Contract G4 role-scoped attach auth (supersedes CC-G1-19's open posture) ──
  if (set_via !== 'self') {
    const { data: callerRow } = await supabase
      .from('users')
      .select('id, is_admin, is_super_admin, is_active')
      .eq('id', caller_user_id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!callerRow || !callerRow.is_active) {
      return { success: false, error: 'Caller user record not found or inactive.' };
    }
    const isAdminCaller = callerRow.is_admin === true || callerRow.is_super_admin === true;

    let authorized = isAdminCaller;
    if (!authorized && set_via === 'trio') {
      authorized = [cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id, cycle.assigned_dol_user_id]
        .includes(caller_user_id);
    } else if (!authorized && set_via === 'approver') {
      const { data: awaiting } = await supabase
        .from('gate_records')
        .select('gate_record_id')
        .eq('delivery_cycle_id', delivery_cycle_id)
        .eq('gate_status', 'awaiting_approval')
        .eq('approver_user_id', caller_user_id)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle();
      authorized = !!awaiting;
    } else if (!authorized && set_via === 'leadership') {
      if (cycle.division_id) {
        const { data: division } = await supabase
          .from('divisions')
          .select('owner_user_id')
          .eq('id', cycle.division_id)
          .is('deleted_at', null)
          .maybeSingle();
        authorized = division?.owner_user_id === caller_user_id;
      }
    }
    // 'rule' and 'division_default' are server-side attach paths — external
    // callers need an Admin role (CC-G4 lean).

    if (!authorized) {
      return {
        success: false,
        error: 'Attaching this participation stake requires the Initiative trio, the awaiting gate approver, the Division Leader, or an Admin.'
      };
    }
  }

  let holderLabel;
  if (hasUser) {
    const { data: holder, error: holderErr } = await supabase
      .from('users')
      .select('id, display_name, is_active')
      .eq('id', holder_user_id)
      .is('deleted_at', null)
      .single();
    if (holderErr || !holder) {
      return { success: false, error: 'Holder user not found.' };
    }
    if (!holder.is_active) {
      return { success: false, error: `${holder.display_name} is inactive and cannot hold a participation stake.` };
    }
    holderLabel = holder.display_name;
  } else {
    const { data: group, error: groupErr } = await supabase
      .from('specialty_groups')
      .select('group_id, group_name, active_status')
      .eq('group_id', holder_group_id)
      .single();
    if (groupErr || !group) {
      return { success: false, error: 'Holder Specialty Group not found.' };
    }
    if (!group.active_status) {
      return { success: false, error: `Specialty Group ${group.group_name} is inactive and cannot hold a participation stake.` };
    }
    holderLabel = group.group_name;
  }

  // Duplicate active stake guard — same holder, same letter, same Initiative.
  const dupQuery = supabase
    .from('participation_records')
    .select('record_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('letter', letter)
    .is('removed_at', null);
  const { data: dup } = hasUser
    ? await dupQuery.eq('holder_user_id', holder_user_id).maybeSingle()
    : await dupQuery.eq('holder_group_id', holder_group_id).maybeSingle();

  if (dup) {
    return { success: false, error: `${holderLabel} already holds an active '${letter}' stake on this Initiative.` };
  }

  const { data: record, error: insertErr } = await supabase
    .from('participation_records')
    .insert({
      delivery_cycle_id,
      letter,
      holder_user_id:  holder_user_id || null,
      holder_group_id: holder_group_id || null,
      set_via,
      set_by_user_id:  caller_user_id
    })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: `Failed to add participation: ${insertErr.message}` };
  }

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id,
    event_type:        'participation_added',
    event_description: `${holderLabel} added as ${letter === 'C' ? 'Consulted' : 'Informed'} (via ${set_via}).`,
    actor_user_id:     caller_user_id,
    event_metadata:    { record_id: record.record_id, letter, set_via }
  });

  return { success: true, data: record };
}

/**
 * Remove a participation stake (soft — sets removed_at). Removal of another's
 * stake requires a note (D-564). For group-held stakes, a caller who is an
 * active member of the group counts as the holder.
 * @param {string} params.record_id
 * @param {string} [params.note]
 */
async function remove_participation(params, caller_user_id) {
  const { record_id, note } = params;
  if (!record_id) {
    return { success: false, error: 'record_id is required.' };
  }

  const { data: record, error: recordErr } = await supabase
    .from('participation_records')
    .select('record_id, delivery_cycle_id, letter, holder_user_id, holder_group_id, removed_at')
    .eq('record_id', record_id)
    .single();

  if (recordErr || !record) {
    return { success: false, error: 'Participation record not found.' };
  }
  if (record.removed_at) {
    return { success: false, error: 'This participation stake has already been removed.' };
  }

  // ── Contract 39 (D-584): is this Initiative past Go to Build? ─────────────
  // After Go to Build the cast is committed — removing a Consulted stake is
  // loud (required note, party notified, gate-thread activity event). Before
  // and at Brief Review the existing light ceremony is unchanged (AC #9).
  // Rule 40 note: this query precedes the existing removal queries — FIFO
  // fixture slot documented in the CC-decision.
  let postGoToBuild = false;
  if (record.letter === 'C') {
    const { data: gtbGate } = await supabase
      .from('gate_records')
      .select('gate_status')
      .eq('delivery_cycle_id', record.delivery_cycle_id)
      .eq('gate_name', 'go_to_build')
      .is('deleted_at', null)
      .maybeSingle();
    postGoToBuild = gtbGate?.gate_status === 'approved' || gtbGate?.gate_status === 'skipped';
  }

  let callerIsHolder = false;
  if (record.holder_user_id) {
    callerIsHolder = record.holder_user_id === caller_user_id;
  } else if (record.holder_group_id) {
    const { data: membership } = await supabase
      .from('specialty_group_members')
      .select('user_id')
      .eq('group_id', record.holder_group_id)
      .eq('user_id', caller_user_id)
      .is('deleted_at', null)
      .maybeSingle();
    callerIsHolder = !!membership;
  }

  if (!callerIsHolder && (!note || !String(note).trim())) {
    return {
      success: false,
      error: "A note is required when removing another party's participation stake (D-564)."
    };
  }

  // Contract 39 (D-584): after Go to Build the note is required even from the
  // holder — the committed cast changes loudly in the sensitive direction.
  if (postGoToBuild && (!note || !String(note).trim())) {
    return {
      success: false,
      error: 'This Initiative is past Go to Build — the consultation cast is committed. ' +
             'A note explaining the removal is required; the removed party and the current ' +
             'gate approver will see it (D-584).'
    };
  }

  const { data: removed, error: removeErr } = await supabase
    .from('participation_records')
    .update({
      removed_at:         new Date().toISOString(),
      removed_by_user_id: caller_user_id,
      removal_note:       note ? String(note).trim() : null
    })
    .eq('record_id', record_id)
    .select()
    .single();

  if (removeErr) {
    return { success: false, error: `Failed to remove participation: ${removeErr.message}` };
  }

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id: record.delivery_cycle_id,
    event_type:        'participation_removed',
    event_description: `${record.letter === 'C' ? 'Consulted' : 'Informed'} stake removed${callerIsHolder ? ' by holder' : ''}${note ? `. Note: ${String(note).trim()}` : '.'}`,
    actor_user_id:     caller_user_id,
    event_metadata:    { record_id, letter: record.letter, removed_by_holder: callerIsHolder }
  });

  // ── Contract 39 (D-584): post-Go-to-Build heavy path — notify + surface ────
  // All steps non-fatal after the removal itself (queries appended last —
  // Rule 40). Adds stay light; only removal/downgrade is the loud direction.
  if (postGoToBuild) {
    const trimmedNote = note ? String(note).trim() : '';

    // Resolve caller + cycle context for messages.
    const { data: removerRow } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', caller_user_id)
      .maybeSingle();
    const removerName = removerRow?.display_name ?? 'A user';

    const { data: cycleRow } = await supabase
      .from('delivery_cycles')
      .select('cycle_title')
      .eq('delivery_cycle_id', record.delivery_cycle_id)
      .maybeSingle();
    const cycleTitle = cycleRow?.cycle_title ?? 'an Initiative';

    // Notify the removed party (user-held → holder; group-held → active members).
    let holderLabel = 'Consulted party';
    const recipients = [];
    if (record.holder_user_id && record.holder_user_id !== caller_user_id) {
      const { data: holderRow } = await supabase
        .from('users')
        .select('display_name, email')
        .eq('id', record.holder_user_id)
        .maybeSingle();
      if (holderRow) {
        holderLabel = holderRow.display_name;
        if (holderRow.email) {
          recipients.push({ email: holderRow.email, display_name: holderRow.display_name });
        }
      }
    } else if (record.holder_group_id) {
      const { data: groupRow } = await supabase
        .from('specialty_groups')
        .select('group_name')
        .eq('group_id', record.holder_group_id)
        .maybeSingle();
      holderLabel = groupRow?.group_name ?? holderLabel;
      const { data: members } = await supabase
        .from('specialty_group_members')
        .select('user_id')
        .eq('group_id', record.holder_group_id)
        .is('deleted_at', null);
      const memberIds = (members ?? []).map(m => m.user_id).filter(id => id !== caller_user_id);
      if (memberIds.length > 0) {
        const { data: memberRows } = await supabase
          .from('users')
          .select('display_name, email')
          .in('id', memberIds)
          .is('deleted_at', null);
        for (const m of memberRows ?? []) {
          if (m.email) { recipients.push({ email: m.email, display_name: m.display_name }); }
        }
      }
    }

    if (recipients.length > 0) {
      await sendGateNotificationEmail({
        recipients,
        subject:          `${cycleTitle} — Consulted participation removed`,
        initiativeName:   cycleTitle,
        gateNameDisplay:  'Consultation cast',
        contextParagraph: `${removerName} removed ${holderLabel} as a Consulted party on ${cycleTitle} ` +
                          `after Go to Build.${trimmedNote ? ` Note: ${trimmedNote}` : ''}`,
        delivery_cycle_id: record.delivery_cycle_id,
        email_type:       'consulted_removed'
      });
    }

    // Surface the change to the current gate approver: activity event on the
    // gate thread of the gate currently awaiting approval (no new approval
    // requirement — D-584). Skipped when no gate is in flight.
    const { data: awaitingGate } = await supabase
      .from('gate_records')
      .select('gate_record_id')
      .eq('delivery_cycle_id', record.delivery_cycle_id)
      .eq('gate_status', 'awaiting_approval')
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();
    if (awaitingGate) {
      const { error: threadErr } = await supabase
        .from('gate_thread_messages')
        .insert({
          gate_record_id: awaitingGate.gate_record_id,
          user_id:        caller_user_id,
          message_text:   `Consulted party removed after Go to Build: ${holderLabel}.` +
                          `${trimmedNote ? ` Note: ${trimmedNote}` : ''}`
        });
      if (threadErr) {
        console.error(JSON.stringify({
          tool_name: 'remove_participation', step: 'gate_thread_activity',
          record_id, error: threadErr.message
        }));
      }
    }
  }

  return { success: true, data: removed };
}

/**
 * List active participation stakes on an Initiative, holders resolved.
 * @param {string} params.delivery_cycle_id
 * @param {boolean} [params.include_removed] — default false
 */
async function list_participation(params, caller_user_id) {
  const { delivery_cycle_id, include_removed } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  let query = supabase
    .from('participation_records')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .order('created_at', { ascending: true });

  if (!include_removed) {
    query = query.is('removed_at', null);
  }

  const { data: records, error: recordsErr } = await query;
  if (recordsErr) {
    return { success: false, error: `Failed to list participation: ${recordsErr.message}` };
  }

  const resolved = await resolveHolderLabels(records || []);
  return { success: true, data: { participation_records: resolved } };
}

/**
 * List the caller's (or a named user's) active stakes across Initiatives —
 * the data source for "Initiatives I'm following" (G4 UI).
 * Includes stakes held via active Specialty Group membership.
 * @param {string} [params.user_id] — defaults to caller
 */
async function list_my_participation(params, caller_user_id) {
  const user_id = params.user_id || caller_user_id;

  const { data: memberships, error: memberErr } = await supabase
    .from('specialty_group_members')
    .select('group_id')
    .eq('user_id', user_id)
    .is('deleted_at', null);

  if (memberErr) {
    return { success: false, error: `Failed to read group memberships: ${memberErr.message}` };
  }

  const groupIds = (memberships || []).map(m => m.group_id);
  const orFilter = groupIds.length
    ? `holder_user_id.eq.${user_id},holder_group_id.in.(${groupIds.join(',')})`
    : `holder_user_id.eq.${user_id}`;

  const { data: records, error: recordsErr } = await supabase
    .from('participation_records')
    .select('*')
    .or(orFilter)
    .is('removed_at', null)
    .order('created_at', { ascending: false });

  if (recordsErr) {
    return { success: false, error: `Failed to list participation: ${recordsErr.message}` };
  }

  const resolved = await resolveHolderLabels(records || []);

  // Contract G4: join Initiative context for "Initiatives I'm following".
  const cycleIds = [...new Set(resolved.map(r => r.delivery_cycle_id))];
  if (cycleIds.length > 0) {
    const { data: cycles } = await supabase
      .from('delivery_cycles')
      .select('delivery_cycle_id, cycle_title, current_lifecycle_stage, division_id, baseline_level, set_level')
      .in('delivery_cycle_id', cycleIds)
      .is('deleted_at', null);
    const cycleById = {};
    for (const c of cycles || []) { cycleById[c.delivery_cycle_id] = c; }
    for (const r of resolved) {
      const c = cycleById[r.delivery_cycle_id];
      r.cycle_title             = c?.cycle_title ?? null;
      r.current_lifecycle_stage = c?.current_lifecycle_stage ?? null;
      r.division_id             = c?.division_id ?? null;
      r.effective_level         = c ? (c.set_level ?? c.baseline_level ?? null) : null;
    }
  }

  return { success: true, data: { participation_records: resolved } };
}

/** Attach holder_display_name / holder_group_name to raw records. */
async function resolveHolderLabels(records) {
  const userIds  = [...new Set(records.map(r => r.holder_user_id).filter(Boolean))];
  const groupIds = [...new Set(records.map(r => r.holder_group_id).filter(Boolean))];

  const userMap = {};
  if (userIds.length) {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', userIds);
    for (const u of users || []) { userMap[u.id] = u.display_name; }
  }

  const groupMap = {};
  if (groupIds.length) {
    const { data: groups } = await supabase
      .from('specialty_groups')
      .select('group_id, group_name')
      .in('group_id', groupIds);
    for (const g of groups || []) { groupMap[g.group_id] = g.group_name; }
  }

  return records.map(r => ({
    ...r,
    holder_display_name: r.holder_user_id ? (userMap[r.holder_user_id] || null) : null,
    holder_group_name:   r.holder_group_id ? (groupMap[r.holder_group_id] || null) : null
  }));
}

module.exports = {
  add_participation,
  remove_participation,
  list_participation,
  list_my_participation
};
