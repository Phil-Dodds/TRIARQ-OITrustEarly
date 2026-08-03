// governance_level.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G1 (D-559, D-561, D-562)
// Leadership level controls: set_effective_level, clear_effective_level,
// set_oversight, clear_oversight, set_trusted_dcs.
// Effective level = COALESCE(set_level, baseline_level).
// CC-G1: the Initiative Executive role has no storage until G8 — leadership
// checks in G1 accept the Division Leader (divisions.owner_user_id) and Phil
// (is_super_admin). IE is added to these checks in G8.

'use strict';

const { supabase } = require('../db');
const { recomputeBaselineForCycle } = require('../lib/governance-derivation');
// Contract G3 (D-562/AC#6): displaced-approver notification on level-lowering set.
const { enqueueNotifications } = require('./helpers/notification-queue');
// CC-40-O: re-route in-flight gate approvals on an oversight change.
const { GATE_LABELS } = require('../lib/gate-resolution');
const { resolveGateApproverV2 } = require('./helpers/approver');

/**
 * CC-40-O (Phil 2026-07-28): re-route every in-flight (awaiting_approval) gate on
 * a cycle to `toUserId`, so a reassignment lands in the new approver's queue
 * immediately and leaves the displaced approver's. Only single-approver gates
 * (L2/L3 — approver_user_id set) are re-routed; L1 trio-consensus gates
 * (approver_user_id null) are left untouched. In-app only: the new approver
 * gets it via their queue; the trio + displaced approver learn via a gate-thread
 * post + activity event. (Email is a future-design item per Phil.)
 * @param {string} toUserId — the new approver (already validated active)
 * @param {string} toDisplayName
 */
async function rerouteAwaitingGates(delivery_cycle_id, toUserId, toDisplayName, caller_user_id) {
  const { data: awaiting } = await supabase
    .from('gate_records')
    .select('gate_record_id, gate_name, approver_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_status', 'awaiting_approval')
    .not('approver_user_id', 'is', null)
    .is('deleted_at', null);
  for (const g of (awaiting || [])) {
    if (g.approver_user_id === toUserId) { continue; }   // already the approver
    await supabase.from('gate_records')
      .update({ approver_user_id: toUserId })
      .eq('gate_record_id', g.gate_record_id);
    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id,
      event_type:        'gate_approver_reassigned',
      event_description: `${GATE_LABELS[g.gate_name] || g.gate_name} approver reassigned to ${toDisplayName}.`,
      actor_user_id:     caller_user_id,
      event_metadata:    { gate_record_id: g.gate_record_id, gate_name: g.gate_name, from_user_id: g.approver_user_id, to_user_id: toUserId }
    });
    // Gate-thread post so the trio + displaced approver see it in-app (D-565).
    const { error: threadErr } = await supabase.from('gate_thread_messages').insert({
      gate_record_id: g.gate_record_id, user_id: caller_user_id,
      message_text:   `Approver reassigned to ${toDisplayName}.`
    });
    if (threadErr) {
      console.error(JSON.stringify({ tool_name: 'rerouteAwaitingGates', step: 'thread', gate_record_id: g.gate_record_id, error: threadErr.message }));
    }
  }
  return (awaiting || []).length;
}

/** Load cycle + resolve whether caller is DL of its Division or Phil. */
async function loadCycleWithLeadershipCheck(delivery_cycle_id, caller_user_id) {
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, division_id, baseline_level, set_level, oversight_user_id, oversight_set_by_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { failure: { success: false, error: 'Initiative not found or has been deleted.' } };
  }

  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('id, display_name, is_super_admin, is_initiative_executive, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller || !caller.is_active) {
    return { failure: { success: false, error: 'Caller user record not found or inactive.' } };
  }

  let isDivisionLeader = false;
  if (cycle.division_id) {
    const { data: division } = await supabase
      .from('divisions')
      .select('id, owner_user_id')
      .eq('id', cycle.division_id)
      .is('deleted_at', null)
      .maybeSingle();
    isDivisionLeader = division?.owner_user_id === caller_user_id;
  }

  return {
    cycle,
    caller,
    // G8 (D-560): Initiative Executives join the leadership checks
    // (set/clear level, oversight — completes CC-G1-08/-09).
    isLeadership: isDivisionLeader || caller.is_super_admin === true ||
                  caller.is_initiative_executive === true
  };
}

/**
 * Leadership sets the effective governance level (D-562). Reason required.
 * @param {string} params.delivery_cycle_id
 * @param {number} params.level — 1 | 2 | 3
 * @param {string} params.reason
 */
async function set_effective_level(params, caller_user_id) {
  const { delivery_cycle_id, level, reason } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (![1, 2, 3].includes(level)) {
    return { success: false, error: 'level must be 1, 2, or 3.' };
  }
  if (!reason || !String(reason).trim()) {
    return { success: false, error: 'A reason is required when setting the governance level (D-562).' };
  }

  const ctx = await loadCycleWithLeadershipCheck(delivery_cycle_id, caller_user_id);
  if (ctx.failure) { return ctx.failure; }
  if (!ctx.isLeadership) {
    return {
      success: false,
      error: 'Setting the governance level requires leadership — the Division Leader of this Initiative\'s Division, or Phil.'
    };
  }

  const set_level_at = new Date().toISOString();
  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update({
      set_level: level,
      set_level_by_user_id: caller_user_id,
      set_level_reason: String(reason).trim(),
      set_level_at
    })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select('delivery_cycle_id, baseline_level, set_level, set_level_reason, set_level_at')
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to set governance level: ${updateErr.message}` };
  }

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id,
    event_type:        'governance_level_set',
    event_description: `Governance level set to ${level} by leadership. Reason: ${String(reason).trim()}`,
    actor_user_id:     caller_user_id,
    event_metadata:    { set_level: level, baseline_level: ctx.cycle.baseline_level ?? null }
  });

  // ── Contract G3 (D-562, S-C6/AC#6): a level-lowering set displaces the
  // approver of any gate currently awaiting approval — notify them.
  const priorEffective = ctx.cycle.set_level ?? ctx.cycle.baseline_level ?? null;
  if (priorEffective !== null && level < priorEffective) {
    const { data: awaiting } = await supabase
      .from('gate_records')
      .select('gate_record_id, gate_name, approver_user_id')
      .eq('delivery_cycle_id', delivery_cycle_id)
      .eq('gate_status', 'awaiting_approval')
      .is('deleted_at', null);
    const approverIds = [...new Set((awaiting || []).map(g => g.approver_user_id).filter(Boolean))];
    if (approverIds.length > 0) {
      const { data: approverRows } = await supabase
        .from('users')
        .select('id, display_name, email')
        .in('id', approverIds)
        .is('deleted_at', null);
      // Contract 45 (D-642): queued. This is one of the four LOUD exceptions
      // (D-562) — the helper forces it immediate and blocks the manager
      // fan-out from its own list, so the class here is not load-bearing.
      const recipients = (approverRows || []).filter(u => u.email)
        .map(u => ({ user_id: u.id, email: u.email, display_name: u.display_name,
                     delivery_class: 'immediate' }));
      if (recipients.length > 0) {
        await enqueueNotifications({
          event_type:      'governance_level_lowered',
          recipients,
          subject:         `${ctx.cycle.cycle_title} — governance level lowered`,
          initiativeName:  ctx.cycle.cycle_title,
          gateNameDisplay: 'Governance level',
          headline:        `Leadership set the governance level on ${ctx.cycle.cycle_title} to Level ${level} (previously effective Level ${priorEffective}).`,
          detail:          'You are notified as the approver of a gate currently awaiting approval.',
          initiative_id:   delivery_cycle_id,
          actor_user_id:   caller_user_id
        });
      }
    }
  }

  return {
    success: true,
    data: {
      ...updated,
      effective_level: updated.set_level ?? updated.baseline_level
    }
  };
}

/**
 * Clear the leadership-set level — effective level falls back to baseline.
 * @param {string} params.delivery_cycle_id
 * @param {string} params.reason
 */
async function clear_effective_level(params, caller_user_id) {
  const { delivery_cycle_id, reason } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!reason || !String(reason).trim()) {
    return { success: false, error: 'A reason is required when clearing the set governance level (D-562).' };
  }

  const ctx = await loadCycleWithLeadershipCheck(delivery_cycle_id, caller_user_id);
  if (ctx.failure) { return ctx.failure; }
  if (!ctx.isLeadership) {
    return {
      success: false,
      error: 'Clearing the governance level requires leadership — the Division Leader of this Initiative\'s Division, or Phil.'
    };
  }
  if (ctx.cycle.set_level === null || ctx.cycle.set_level === undefined) {
    return { success: false, error: 'No set governance level exists on this Initiative — nothing to clear.' };
  }

  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update({
      set_level: null,
      set_level_by_user_id: null,
      set_level_reason: null,
      set_level_at: null
    })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select('delivery_cycle_id, baseline_level, set_level')
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to clear governance level: ${updateErr.message}` };
  }

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id,
    event_type:        'governance_level_cleared',
    event_description: `Set governance level cleared — effective level falls back to baseline. Reason: ${String(reason).trim()}`,
    actor_user_id:     caller_user_id,
    event_metadata:    { prior_set_level: ctx.cycle.set_level, baseline_level: updated.baseline_level ?? null }
  });

  return {
    success: true,
    data: { ...updated, effective_level: updated.baseline_level ?? null }
  };
}

/**
 * Set the per-Initiative oversight approver override (D-561).
 * CC-G1: setter posture mirrors set_effective_level (DL/Phil) — spec is silent.
 * @param {string} params.delivery_cycle_id
 * @param {string} params.user_id — the oversight approver
 * @param {string} params.set_via — 'default' | 'manual'
 */
async function set_oversight(params, caller_user_id) {
  const { delivery_cycle_id, user_id, set_via } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!user_id) {
    return { success: false, error: 'user_id (the oversight approver) is required.' };
  }
  if (!['default', 'manual'].includes(set_via)) {
    return { success: false, error: "set_via must be 'default' or 'manual'." };
  }

  const ctx = await loadCycleWithLeadershipCheck(delivery_cycle_id, caller_user_id);
  if (ctx.failure) { return ctx.failure; }
  if (!ctx.isLeadership) {
    return {
      success: false,
      error: 'Setting oversight requires leadership — the Division Leader of this Initiative\'s Division, or Phil.'
    };
  }

  const { data: overseer, error: overseerErr } = await supabase
    .from('users')
    .select('id, display_name, is_active')
    .eq('id', user_id)
    .is('deleted_at', null)
    .single();

  if (overseerErr || !overseer) {
    return { success: false, error: 'Oversight user not found. Select a valid user.' };
  }
  if (!overseer.is_active) {
    return { success: false, error: `${overseer.display_name} is inactive and cannot be set as oversight approver.` };
  }

  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update({
      oversight_user_id: user_id,
      oversight_set_via: set_via,
      oversight_set_by_user_id: caller_user_id
    })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select('delivery_cycle_id, oversight_user_id, oversight_set_via, oversight_set_by_user_id')
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to set oversight: ${updateErr.message}` };
  }

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id,
    event_type:        'oversight_set',
    event_description: `Oversight approver set to ${overseer.display_name} (${set_via}).`,
    actor_user_id:     caller_user_id,
    event_metadata:    { oversight_user_id: user_id, set_via }
  });

  // CC-40-O: re-route any in-flight gate to the new approver immediately.
  const rerouted = await rerouteAwaitingGates(delivery_cycle_id, user_id, overseer.display_name, caller_user_id);

  return { success: true, data: { ...updated, rerouted_gate_count: rerouted } };
}

/**
 * Clear the oversight field (D-561). Note required; setter notification is G5
 * wiring — the note is event-logged now.
 * @param {string} params.delivery_cycle_id
 * @param {string} params.note
 */
async function clear_oversight(params, caller_user_id) {
  const { delivery_cycle_id, note } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!note || !String(note).trim()) {
    return { success: false, error: 'A note is required when clearing oversight (D-561).' };
  }

  const ctx = await loadCycleWithLeadershipCheck(delivery_cycle_id, caller_user_id);
  if (ctx.failure) { return ctx.failure; }
  if (!ctx.isLeadership) {
    return {
      success: false,
      error: 'Clearing oversight requires leadership — the Division Leader of this Initiative\'s Division, or Phil.'
    };
  }
  if (!ctx.cycle.oversight_user_id) {
    return { success: false, error: 'No oversight approver is set on this Initiative — nothing to clear.' };
  }

  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update({
      oversight_user_id: null,
      oversight_set_via: null,
      oversight_set_by_user_id: null
    })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select('delivery_cycle_id, oversight_user_id')
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to clear oversight: ${updateErr.message}` };
  }

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id,
    event_type:        'oversight_cleared',
    event_description: `Oversight approver cleared. Note: ${String(note).trim()}`,
    actor_user_id:     caller_user_id,
    event_metadata:    {
      prior_oversight_user_id: ctx.cycle.oversight_user_id,
      prior_set_by_user_id:    ctx.cycle.oversight_set_by_user_id,
      clear_note:              String(note).trim()
    }
  });

  // CC-40-O: re-route in-flight gates back to the D-557 default approver now
  // that oversight is cleared. Resolve per gate (division/config/DL/IE/Phil).
  const clearedCycle = {
    delivery_cycle_id,
    division_id:       ctx.cycle.division_id,
    baseline_level:    ctx.cycle.baseline_level,
    set_level:         ctx.cycle.set_level,
    oversight_user_id: null
  };
  const { data: awaitingC } = await supabase
    .from('gate_records')
    .select('gate_record_id, gate_name, approver_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_status', 'awaiting_approval')
    .not('approver_user_id', 'is', null)
    .is('deleted_at', null);
  for (const g of (awaitingC || [])) {
    const res = await resolveGateApproverV2({ cycle: clearedCycle, gate_name: g.gate_name });
    const defaultApprover = res?.approver_user_id ?? null;
    if (defaultApprover === g.approver_user_id) { continue; }
    await supabase.from('gate_records')
      .update({ approver_user_id: defaultApprover })
      .eq('gate_record_id', g.gate_record_id);
    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id,
      event_type:        'gate_approver_reassigned',
      event_description: `${GATE_LABELS[g.gate_name] || g.gate_name} approver reset to the default routing (oversight cleared).`,
      actor_user_id:     caller_user_id,
      event_metadata:    { gate_record_id: g.gate_record_id, gate_name: g.gate_name, from_user_id: g.approver_user_id, to_user_id: defaultApprover, reason: 'oversight_cleared' }
    });
  }

  return { success: true, data: updated };
}

/**
 * Set or revoke the per-user global trusted_dcs flag (D-559). Admin/Phil JWT.
 * Recomputes cached baseline_level on every live Initiative where the user is
 * the assigned DCS (CC-G1: keeps the cache consistent with the derivation).
 * @param {string}  params.user_id
 * @param {boolean} params.trusted
 * @param {string}  [params.note]
 */
async function set_trusted_dcs(params, caller_user_id) {
  const { user_id, trusted, note } = params;
  if (!user_id) {
    return { success: false, error: 'user_id is required.' };
  }
  if (typeof trusted !== 'boolean') {
    return { success: false, error: 'trusted must be true or false.' };
  }

  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('id, is_admin, is_super_admin, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller || !caller.is_active) {
    return { success: false, error: 'Caller user record not found or inactive.' };
  }
  if (caller.is_admin !== true && caller.is_super_admin !== true) {
    return { success: false, error: 'Setting the trusted DCS flag requires an Admin role.' };
  }

  const { data: target, error: targetErr } = await supabase
    .from('users')
    .select('id, display_name, trusted_dcs')
    .eq('id', user_id)
    .is('deleted_at', null)
    .single();

  if (targetErr || !target) {
    return { success: false, error: 'Target user not found.' };
  }

  const { error: updateErr } = await supabase
    .from('users')
    .update({ trusted_dcs: trusted })
    .eq('id', user_id);

  if (updateErr) {
    return { success: false, error: `Failed to update trusted DCS flag: ${updateErr.message}` };
  }

  // Recompute cached baselines on live Initiatives where this user is assigned DCS.
  const { data: affectedCycles } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id')
    .eq('assigned_dcs_user_id', user_id)
    .is('deleted_at', null);

  const recomputed = [];
  for (const row of affectedCycles || []) {
    const result = await recomputeBaselineForCycle(supabase, row.delivery_cycle_id);
    if (!result.error) {
      recomputed.push({ delivery_cycle_id: row.delivery_cycle_id, baseline_level: result.baseline_level });
      // Activity log (D-559) — cycle_event_log is the audit surface; one row
      // per affected Initiative.
      await supabase.from('cycle_event_log').insert({
        delivery_cycle_id: row.delivery_cycle_id,
        event_type:        'trusted_dcs_changed',
        event_description: `Trusted DCS flag for ${target.display_name} set to ${trusted} — baseline governance level recomputed.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { target_user_id: user_id, trusted, note: note || null, baseline_level: result.baseline_level }
      });
    }
  }

  // Structured server log for the user-level change itself (no user-level
  // audit table exists — CC-G1).
  console.log(JSON.stringify({
    event: 'trusted_dcs_changed',
    target_user_id: user_id,
    trusted,
    note: note || null,
    actor_user_id: caller_user_id,
    affected_cycles: recomputed.length,
    timestamp: new Date().toISOString()
  }));

  return {
    success: true,
    data: {
      user_id,
      display_name: target.display_name,
      trusted_dcs: trusted,
      recomputed_cycles: recomputed
    }
  };
}

module.exports = {
  set_effective_level,
  clear_effective_level,
  set_oversight,
  clear_oversight,
  set_trusted_dcs
};
