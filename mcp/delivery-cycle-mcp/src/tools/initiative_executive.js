// initiative_executive.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G8 (D-560)
// Initiative Executive tools:
//   set_initiative_executive — Phil-only grant/revoke (D-464 posture),
//     activity-logged (structured server log; user-level, no cycle context).
//   list_all_pending_gates — the IE monitoring view: every awaiting gate
//     company-wide, pull-only, default-sorted by age, aging highlight past
//     ARCH-33-APG-AGING (system constant, initially code-level — CC-G8).
//     Push (Action Queue) and pull (this view) are never merged (D-560).

'use strict';

const { supabase } = require('../db');
const { computeWaitingOnBatch } = require('../lib/waiting-on');
const { GATE_NAME_DISPLAY } = require('./helpers/gates');

// ARCH-33 (named/valued at implementation per spec — CC-G8): gates awaiting
// approval longer than this many days get the aging highlight.
const ARCH33_APG_AGING_DAYS = 7;

/**
 * Grant or revoke the Initiative Executive role. Phil only (D-464 posture).
 * @param {string}  params.user_id
 * @param {boolean} params.granted
 * @param {string}  [params.note]
 */
async function set_initiative_executive(params, caller_user_id) {
  const { user_id, granted, note } = params;
  if (!user_id) {
    return { success: false, error: 'user_id is required.' };
  }
  if (typeof granted !== 'boolean') {
    return { success: false, error: 'granted must be true or false.' };
  }

  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('id, is_super_admin, is_active, display_name')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller || !caller.is_active) {
    return { success: false, error: 'Caller user record not found or inactive.' };
  }
  if (caller.is_super_admin !== true) {
    return { success: false, error: 'Granting the Initiative Executive role is reserved to Phil (D-560/D-464).' };
  }

  const { data: target, error: targetErr } = await supabase
    .from('users')
    .select('id, display_name, is_initiative_executive')
    .eq('id', user_id)
    .is('deleted_at', null)
    .single();

  if (targetErr || !target) {
    return { success: false, error: 'Target user not found.' };
  }

  const { error: updateErr } = await supabase
    .from('users')
    .update({ is_initiative_executive: granted })
    .eq('id', user_id);

  if (updateErr) {
    return { success: false, error: `Failed to update the Initiative Executive role: ${updateErr.message}` };
  }

  // Activity log — user-level change; structured server log (CC-G1-12 pattern).
  console.log(JSON.stringify({
    event: 'initiative_executive_changed',
    target_user_id: user_id,
    granted,
    note: note || null,
    actor_user_id: caller_user_id,
    timestamp: new Date().toISOString()
  }));

  return {
    success: true,
    data: { user_id, display_name: target.display_name, is_initiative_executive: granted }
  };
}

/**
 * All Pending Gates — every gate awaiting approval, company-wide, with gate,
 * initiative, Division, assigned approver, days waiting, the G7 waiting-on
 * line, and the aging highlight. Pull-only; default-sorted by age (oldest
 * first). Auth: IE, Phil, or Admin (CC-G8 lean — admins run the system).
 */
async function list_all_pending_gates(_params, caller_user_id) {
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_initiative_executive, is_super_admin, is_admin, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller || !caller.is_active) {
    return { success: false, error: 'Caller user record not found or inactive.' };
  }
  // CC-40-P: widest scope the caller is allowed. IE / Admin / Phil → all
  // divisions. A Division Leader (owns ≥1 division) → their own division(s).
  // Everyone else → their personal My Actions queue, not this view.
  const isWide = caller.is_initiative_executive === true || caller.is_super_admin === true || caller.is_admin === true;
  let ownedDivisionIds = null;
  if (!isWide) {
    const { data: owned } = await supabase
      .from('divisions')
      .select('id')
      .eq('owner_user_id', caller_user_id)
      .is('deleted_at', null);
    ownedDivisionIds = new Set((owned || []).map(d => d.id));
    if (ownedDivisionIds.size === 0) {
      return {
        success: false,
        error: 'The All Pending Gates view is for Initiative Executives, Admins, and Division Leaders. ' +
               'Your personal obligations live in My Actions.'
      };
    }
  }

  const { data: gates, error: gatesErr } = await supabase
    .from('gate_records')
    .select('gate_record_id, delivery_cycle_id, gate_name, gate_status, approver_user_id, submitted_at, submitted_by_user_id')
    .eq('gate_status', 'awaiting_approval')
    .is('deleted_at', null);
  if (gatesErr) {
    return { success: false, error: `Failed to list pending gates: ${gatesErr.message}` };
  }
  if (!gates || gates.length === 0) {
    return { success: true, data: { pending_gates: [], aging_threshold_days: ARCH33_APG_AGING_DAYS } };
  }

  const cycleIds = [...new Set(gates.map(g => g.delivery_cycle_id))];
  const { data: cycles } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, division_id, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id, baseline_level, set_level')
    .in('delivery_cycle_id', cycleIds)
    .is('deleted_at', null);
  const cyclesById = {};
  (cycles || []).forEach(c => { cyclesById[c.delivery_cycle_id] = c; });

  const divisionIds = [...new Set((cycles || []).map(c => c.division_id).filter(Boolean))];
  const approverIds = [...new Set(gates.map(g => g.approver_user_id).filter(Boolean))];

  const [{ data: divisions }, { data: approvers }] = await Promise.all([
    divisionIds.length
      ? supabase.from('divisions').select('id, division_name, display_name_short').in('id', divisionIds).is('deleted_at', null)
      : Promise.resolve({ data: [] }),
    approverIds.length
      ? supabase.from('users').select('id, display_name').in('id', approverIds).is('deleted_at', null)
      : Promise.resolve({ data: [] })
  ]);
  const divisionMap = {};
  (divisions || []).forEach(d => { divisionMap[d.id] = d; });
  const approverMap = {};
  (approvers || []).forEach(u => { approverMap[u.id] = u.display_name; });

  const waitingOnByGate = await computeWaitingOnBatch(gates, cyclesById);

  const pending_gates = gates
    .filter(g => cyclesById[g.delivery_cycle_id])   // drop soft-deleted initiatives
    // CC-40-P: Division-Leader scope — only their own division(s).
    .filter(g => isWide || ownedDivisionIds.has(cyclesById[g.delivery_cycle_id].division_id))
    .map(g => {
      const c = cyclesById[g.delivery_cycle_id];
      const d = c.division_id ? (divisionMap[c.division_id] || {}) : {};
      const waiting = waitingOnByGate[g.gate_record_id] || null;
      const days = waiting ? waiting.days_waiting : 0;
      return {
        gate_record_id:              g.gate_record_id,
        delivery_cycle_id:           g.delivery_cycle_id,
        cycle_title:                 c.cycle_title,
        gate_name:                   g.gate_name,
        gate_name_display:           GATE_NAME_DISPLAY[g.gate_name] ?? g.gate_name,
        division_id:                 c.division_id ?? null,
        division_display_name_short: d.display_name_short || d.division_name || '',
        effective_level:             c.set_level ?? c.baseline_level ?? null,
        approver_user_id:            g.approver_user_id ?? null,
        approver_display_name:       g.approver_user_id ? (approverMap[g.approver_user_id] ?? null) : null,
        submitted_at:                g.submitted_at,
        days_waiting:                days,
        aging:                       days > ARCH33_APG_AGING_DAYS,
        waiting_on:                  waiting
      };
    })
    .sort((a, b) => b.days_waiting - a.days_waiting);

  return { success: true, data: { pending_gates, aging_threshold_days: ARCH33_APG_AGING_DAYS } };
}

module.exports = { set_initiative_executive, list_all_pending_gates, ARCH33_APG_AGING_DAYS };
