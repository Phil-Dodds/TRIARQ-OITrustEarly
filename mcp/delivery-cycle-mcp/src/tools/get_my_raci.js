// get_my_raci.js — Pathways OI Trust — delivery-cycle-mcp
// Contract 40 WS5 (D-599): per-initiative RACI letters the CALLER holds, for
// the participation glyphs on the Initiative grid, My Initiative Status rows,
// and the followed card. Read-only companion — keeps list_delivery_cycles
// untouched while carrying the accepted per-card approver-resolution cost.
//
//   R — Responsible: caller is a trio member (DCS/EPO/DOL).
//   A — Accountable: caller is the resolved approver of the NEXT gate.
//        submitted next gate → stored approver_user_id (free);
//        pre-submission     → live D-557 resolution (resolveGateApproverV2).
//        Absent for Level 1 (no external approver), closed (no next gate), or
//        unsized/indeterminate. No fallback to a prior gate's approver.
//   C — Consulted: caller holds an active Consulted participation stake
//        (direct or via Specialty Group). Provisional (D-593) until the
//        Go to Build cast is committed.
//   I — Informed: caller holds an active Informed self-stake.
//
// Returns cycle_id → { r, a, c, i, c_provisional, a_gate_name }. Cycles the
// caller cannot see are simply absent from the map.

'use strict';

const { supabase } = require('../db');
const { ALL_GATES } = require('../lifecycle');
const { resolveGateApproverV2 } = require('./helpers/approver');

/**
 * @param {object} params
 * @param {string[]} params.cycle_ids
 * @param {string} caller_user_id - from JWT
 */
async function get_my_raci(params, caller_user_id) {
  const cycleIds = Array.isArray(params?.cycle_ids) ? params.cycle_ids.filter(Boolean) : [];
  if (cycleIds.length === 0) { return { success: true, data: {} }; }

  // ── Cycles in scope (level + trio + stage for R/A) ────────────────────────
  const { data: cycles, error: cyclesErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, division_id, current_lifecycle_stage, baseline_level, set_level, oversight_user_id, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id')
    .in('delivery_cycle_id', cycleIds)
    .is('deleted_at', null);
  if (cyclesErr) {
    return { success: false, error: `Failed to load Initiatives for RACI: ${cyclesErr.message}` };
  }
  if (!cycles || cycles.length === 0) { return { success: true, data: {} }; }

  // ── Gate records (next-gate detection + stored approver + GtB cast state) ──
  const { data: gateRows } = await supabase
    .from('gate_records')
    .select('delivery_cycle_id, gate_name, gate_status, approver_user_id, cast_confirmed_at')
    .in('delivery_cycle_id', cycleIds)
    .is('deleted_at', null);
  const gatesByCycle = {};
  for (const g of (gateRows || [])) {
    (gatesByCycle[g.delivery_cycle_id] = gatesByCycle[g.delivery_cycle_id] || {})[g.gate_name] = g;
  }

  // ── Caller's participation stakes: direct + via active group membership ───
  const { data: myGroups } = await supabase
    .from('specialty_group_members')
    .select('group_id')
    .eq('user_id', caller_user_id)
    .is('deleted_at', null);
  const myGroupIds = (myGroups || []).map(m => m.group_id);

  const orFilter = myGroupIds.length
    ? `holder_user_id.eq.${caller_user_id},holder_group_id.in.(${myGroupIds.join(',')})`
    : `holder_user_id.eq.${caller_user_id}`;
  const { data: myStakes } = await supabase
    .from('participation_records')
    .select('delivery_cycle_id, letter')
    .or(orFilter)
    .is('removed_at', null)
    .in('delivery_cycle_id', cycleIds);
  const stakeByCycle = {};
  for (const s of (myStakes || [])) {
    const b = stakeByCycle[s.delivery_cycle_id] || { c: false, i: false };
    if (s.letter === 'C') { b.c = true; }
    if (s.letter === 'I') { b.i = true; }
    stakeByCycle[s.delivery_cycle_id] = b;
  }

  // ── Assemble per-cycle RACI ───────────────────────────────────────────────
  const result = {};
  for (const c of cycles) {
    const gates = gatesByCycle[c.delivery_cycle_id] || {};
    const stake = stakeByCycle[c.delivery_cycle_id] || { c: false, i: false };

    // R — trio membership.
    const r = [c.assigned_dcs_user_id, c.assigned_epo_user_id, c.assigned_dol_user_id]
      .includes(caller_user_id);

    // Next gate = first not approved/skipped. None → closed.
    const nextGateName = ALL_GATES.find(gn => {
      const g = gates[gn];
      return !g || (g.gate_status !== 'approved' && g.gate_status !== 'skipped');
    }) || null;

    // A — accountable for the next gate. CC-40-Q: capture the resolved approver
    // identity (not just whether it's the caller) so the Initiative grid can
    // show who the approver is + reassign from there.
    let a = false;
    let aGateName = null;
    let approverId = null;
    const effectiveLevel = c.set_level ?? c.baseline_level ?? null;
    const closed = c.current_lifecycle_stage === 'COMPLETE' || c.current_lifecycle_stage === 'CANCELLED';
    const l1SelfGov = effectiveLevel === 1 && !c.oversight_user_id;
    // A is absent for Level 1 (no external approver), closed, unsized (null level).
    if (nextGateName && !closed && !l1SelfGov && effectiveLevel != null) {
      const g = gates[nextGateName];
      approverId = g?.approver_user_id ?? null;
      if (!approverId) {
        // Pre-submission: run the D-557 chain live (accepted cost, D-599).
        const res = await resolveGateApproverV2({ cycle: c, gate_name: nextGateName });
        approverId = res?.approver_user_id ?? null;
      }
      aGateName = nextGateName;
      if (approverId && approverId === caller_user_id) { a = true; }
    }

    // C — consulted; provisional until the Go to Build cast is committed (D-593).
    const gtb = gates['go_to_build'];
    const castCommitted = !!gtb && (!!gtb.cast_confirmed_at ||
      gtb.gate_status === 'approved' || gtb.gate_status === 'skipped');

    result[c.delivery_cycle_id] = {
      r,
      a,
      c: stake.c,
      i: stake.i,
      c_provisional: stake.c && !castCommitted,
      a_gate_name: a ? aGateName : null,   // glyph tap target only when the caller is A
      a_approver_user_id: approverId       // resolved approver (any person); name filled below
    };
  }

  // CC-40-Q: resolve approver display names in one lookup.
  const approverIds = [...new Set(Object.values(result).map(r => r.a_approver_user_id).filter(Boolean))];
  if (approverIds.length > 0) {
    const { data: appUsers } = await supabase
      .from('users').select('id, display_name').in('id', approverIds).is('deleted_at', null);
    const nameById = {};
    (appUsers || []).forEach(u => { nameById[u.id] = u.display_name; });
    for (const entry of Object.values(result)) {
      entry.a_approver_display_name = entry.a_approver_user_id ? (nameById[entry.a_approver_user_id] ?? null) : null;
    }
  } else {
    for (const entry of Object.values(result)) { entry.a_approver_display_name = null; }
  }

  return { success: true, data: result };
}

module.exports = { get_my_raci };
