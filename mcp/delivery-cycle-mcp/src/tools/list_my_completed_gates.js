// list_my_completed_gates.js
// Pathways OI Trust — delivery-cycle-mcp
// Powers the My Completed Gates home card (D-430, Contract 24).
//
// Returns approved gate_records within an N-day window where the caller is
// assigned DCS, EPO, or DOL on the Initiative. JWT-scoped to caller.
//
// Params:
//   limit?:     number — max rows to return. Default 5.
//   days_back?: number — window size in days. Default 28.
//
// Response shape:
//   { data: { items, total_count } }
//   items: { gate_name, gate_name_display, initiative_name, delivery_cycle_id,
//            division_short_name, approver_decision_at }
//   total_count: total rows matching the filter (used by "View all [N] →" link).
//
// Source: D-430, OITrust-Contract24-Spec-2026-06-15.md §Workstream 6.

'use strict';

const { supabase } = require('../db');

const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

const DEFAULT_LIMIT     = 5;
const DEFAULT_DAYS_BACK = 28;

async function list_my_completed_gates(params, caller_user_id) {
  const limit = Number.isFinite(params?.limit) && params.limit > 0
    ? Math.min(50, Math.floor(params.limit))
    : DEFAULT_LIMIT;
  const days_back = Number.isFinite(params?.days_back) && params.days_back > 0
    ? Math.min(365, Math.floor(params.days_back))
    : DEFAULT_DAYS_BACK;

  const cutoff = new Date(Date.now() - (days_back * 24 * 60 * 60 * 1000)).toISOString();

  // ── Initiatives where caller is assigned DCS, EPO, or DOL ────────────────
  const { data: cycles, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, division_id, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id')
    .or(`assigned_dcs_user_id.eq.${caller_user_id},assigned_epo_user_id.eq.${caller_user_id},assigned_dol_user_id.eq.${caller_user_id}`)
    .is('deleted_at', null);
  if (cycleErr) {
    return { success: false, error: `Failed to load assigned Initiatives: ${cycleErr.message}` };
  }
  if (!cycles || cycles.length === 0) {
    return { success: true, data: { items: [], total_count: 0 } };
  }

  const cycleIds = cycles.map(c => c.delivery_cycle_id);
  const cycleMap = new Map();
  for (const c of cycles) { cycleMap.set(c.delivery_cycle_id, c); }

  // ── Approved gate_records on those Initiatives within the window ─────────
  const { data: gates, error: gateErr } = await supabase
    .from('gate_records')
    .select('gate_record_id, delivery_cycle_id, gate_name, approver_decision_at')
    .in('delivery_cycle_id', cycleIds)
    .eq('gate_status', 'approved')
    .gte('approver_decision_at', cutoff)
    .is('deleted_at', null);
  if (gateErr) {
    return { success: false, error: `Failed to load completed gates: ${gateErr.message}` };
  }
  if (!gates || gates.length === 0) {
    return { success: true, data: { items: [], total_count: 0 } };
  }

  const divisionIds = [...new Set(cycles.map(c => c.division_id).filter(Boolean))];
  const { data: divisions } = divisionIds.length
    ? await supabase.from('divisions')
        .select('id, division_name, display_name_short')
        .in('id', divisionIds)
        .is('deleted_at', null)
    : { data: [] };
  const divisionMap = new Map();
  for (const d of (divisions || [])) { divisionMap.set(d.id, d); }

  // Sort desc by approver_decision_at, then slice.
  const sorted = [...gates].sort((a, b) => {
    const ta = a.approver_decision_at ? Date.parse(a.approver_decision_at) : 0;
    const tb = b.approver_decision_at ? Date.parse(b.approver_decision_at) : 0;
    return tb - ta;
  });

  const items = sorted.slice(0, limit).map(g => {
    const c = cycleMap.get(g.delivery_cycle_id) || {};
    const d = divisionMap.get(c.division_id) || {};
    return {
      gate_name:            g.gate_name,
      gate_name_display:    GATE_NAME_DISPLAY[g.gate_name] || g.gate_name,
      initiative_name:      c.cycle_title || '',
      delivery_cycle_id:    g.delivery_cycle_id,
      division_short_name:  d.display_name_short || d.division_name || '',
      approver_decision_at: g.approver_decision_at
    };
  });

  return {
    success: true,
    data: { items, total_count: sorted.length }
  };
}

module.exports = { list_my_completed_gates };
