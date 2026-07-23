// participation.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G1 (D-563, D-564)
// Initiative-level C/I participation records: add_participation,
// remove_participation, list_participation, list_my_participation.
// G1 creates the records layer only — per-gate gate_consultations wiring,
// Division-default auto-attach, and notification flows land in G4/G5.

'use strict';

const { supabase } = require('../db');

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

  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
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
