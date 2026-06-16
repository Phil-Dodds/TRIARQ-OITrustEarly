// list_approved_gates.js
// Pathways OI Trust — delivery-cycle-mcp
// Powers the Recently Approved Gates view (D-431, hub card 9, Contract 24).
//
// Returns approved gate_records within an N-day window across all Initiatives
// the caller has Division-scoped visibility to. Includes approver display name,
// initiative name, division short name. Filter params optional.
//
// JWT-scoped via Division access from `get_user_divisions` semantics — caller
// is restricted to gates on Initiatives in their accessible Divisions, except
// when explicit `division_ids` are passed which intersect with accessible.
//
// Params:
//   division_ids?:     string[] — restrict to these Divisions (must be a subset
//                                  of caller's accessible Divisions; ids outside
//                                  the access set are silently dropped).
//   gate_names?:       string[] — filter by gate name (brief_review, etc.).
//   approver_user_id?: string   — filter by approver (any approver visible).
//   days_back?:        number   — window size in days. Default 28.
//
// Response item shape:
//   { gate_record_id, gate_name, gate_name_display, initiative_name,
//     delivery_cycle_id, division_id, division_short_name,
//     approver_user_id, approver_display_name, approver_decision_at }
//
// Sorted: approver_decision_at descending.
// Source: D-431, OITrust-Contract24-Spec-2026-06-15.md §Workstream 7.

'use strict';

const { supabase } = require('../db');

const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};
const GATE_NAMES_SET = new Set(Object.keys(GATE_NAME_DISPLAY));

/** Default 4-week window per D-431. */
const DEFAULT_DAYS_BACK = 28;

async function list_approved_gates(params, caller_user_id) {
  const days_back = Number.isFinite(params?.days_back) && params.days_back > 0
    ? Math.min(365, Math.floor(params.days_back))
    : DEFAULT_DAYS_BACK;

  // ── Caller's accessible Divisions (D-135 inherited access) ───────────────
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  const isAdmin = caller?.is_admin === true;

  let accessibleDivisionIds = null; // null = unrestricted (Admin)
  if (!isAdmin) {
    const { data: memberships } = await supabase
      .from('user_division_memberships')
      .select('division_id')
      .eq('user_id', caller_user_id)
      .is('deleted_at', null);
    const directIds = (memberships || []).map(m => m.division_id);
    if (directIds.length === 0) {
      return { success: true, data: [] };
    }
    // D-135: expand to all descendants of each directly-assigned Division.
    const accessible = new Set(directIds);
    const { data: allDivisions } = await supabase
      .from('divisions')
      .select('id, parent_division_id')
      .is('deleted_at', null);
    const children = new Map();
    for (const d of allDivisions || []) {
      if (!d.parent_division_id) { continue; }
      const list = children.get(d.parent_division_id) || [];
      list.push(d.id);
      children.set(d.parent_division_id, list);
    }
    const stack = [...directIds];
    while (stack.length > 0) {
      const id = stack.pop();
      for (const childId of (children.get(id) || [])) {
        if (!accessible.has(childId)) { accessible.add(childId); stack.push(childId); }
      }
    }
    accessibleDivisionIds = [...accessible];
  }

  // ── Resolve effective division_ids filter ────────────────────────────────
  let effectiveDivisionIds = null;
  if (Array.isArray(params?.division_ids) && params.division_ids.length > 0) {
    const requested = params.division_ids.filter(id => typeof id === 'string');
    if (accessibleDivisionIds !== null) {
      const accessSet = new Set(accessibleDivisionIds);
      effectiveDivisionIds = requested.filter(id => accessSet.has(id));
      if (effectiveDivisionIds.length === 0) {
        return { success: true, data: [] };
      }
    } else {
      effectiveDivisionIds = requested;
    }
  } else if (accessibleDivisionIds !== null) {
    effectiveDivisionIds = accessibleDivisionIds;
  }

  // ── Window cutoff ────────────────────────────────────────────────────────
  const cutoff = new Date(Date.now() - (days_back * 24 * 60 * 60 * 1000)).toISOString();

  // ── Query approved gate_records ──────────────────────────────────────────
  let gateQuery = supabase
    .from('gate_records')
    .select('gate_record_id, delivery_cycle_id, gate_name, approver_user_id, approver_decision_at')
    .eq('gate_status', 'approved')
    .gte('approver_decision_at', cutoff)
    .is('deleted_at', null);

  if (Array.isArray(params?.gate_names) && params.gate_names.length > 0) {
    const valid = params.gate_names.filter(g => GATE_NAMES_SET.has(g));
    if (valid.length === 0) { return { success: true, data: [] }; }
    gateQuery = gateQuery.in('gate_name', valid);
  }
  if (typeof params?.approver_user_id === 'string') {
    gateQuery = gateQuery.eq('approver_user_id', params.approver_user_id);
  }

  const { data: gates, error: gateErr } = await gateQuery;
  if (gateErr) {
    return { success: false, error: `Failed to list approved gates: ${gateErr.message}` };
  }
  if (!gates || gates.length === 0) {
    return { success: true, data: [] };
  }

  const cycleIds    = [...new Set(gates.map(g => g.delivery_cycle_id))];
  const approverIds = [...new Set(gates.map(g => g.approver_user_id).filter(Boolean))];

  let cycleQuery = supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, division_id')
    .in('delivery_cycle_id', cycleIds)
    .is('deleted_at', null);
  if (effectiveDivisionIds !== null) {
    cycleQuery = cycleQuery.in('division_id', effectiveDivisionIds);
  }
  const { data: cycles, error: cycleErr } = await cycleQuery;
  if (cycleErr) {
    return { success: false, error: `Failed to load Initiatives: ${cycleErr.message}` };
  }

  const cycleMap = new Map();
  for (const c of (cycles || [])) { cycleMap.set(c.delivery_cycle_id, c); }

  const visibleCycleIds = [...cycleMap.keys()];
  const divisionIds     = [...new Set((cycles || []).map(c => c.division_id).filter(Boolean))];

  const [{ data: divisions }, { data: approvers }] = await Promise.all([
    divisionIds.length
      ? supabase.from('divisions')
          .select('id, division_name, display_name_short')
          .in('id', divisionIds)
          .is('deleted_at', null)
      : Promise.resolve({ data: [] }),
    approverIds.length
      ? supabase.from('users')
          .select('id, display_name')
          .in('id', approverIds)
          .is('deleted_at', null)
      : Promise.resolve({ data: [] })
  ]);

  const divisionMap = new Map();
  const approverMap = new Map();
  for (const d of (divisions || [])) { divisionMap.set(d.id, d); }
  for (const u of (approvers || [])) { approverMap.set(u.id, u.display_name); }

  const items = gates
    .filter(g => cycleMap.has(g.delivery_cycle_id)) // Drop gates filtered out by Division access.
    .map(g => {
      const c = cycleMap.get(g.delivery_cycle_id) || {};
      const d = divisionMap.get(c.division_id) || {};
      return {
        gate_record_id:        g.gate_record_id,
        gate_name:             g.gate_name,
        gate_name_display:     GATE_NAME_DISPLAY[g.gate_name] || g.gate_name,
        initiative_name:       c.cycle_title || '',
        delivery_cycle_id:     g.delivery_cycle_id,
        division_id:           c.division_id,
        division_short_name:   d.display_name_short || d.division_name || '',
        approver_user_id:      g.approver_user_id,
        approver_display_name: approverMap.get(g.approver_user_id) || 'Unknown',
        approver_decision_at:  g.approver_decision_at
      };
    });

  items.sort((a, b) => {
    const ta = a.approver_decision_at ? Date.parse(a.approver_decision_at) : 0;
    const tb = b.approver_decision_at ? Date.parse(b.approver_decision_at) : 0;
    return tb - ta;
  });

  // Mark visibleCycleIds reserved for future use without TS warn.
  void visibleCycleIds;

  return { success: true, data: items };
}

module.exports = { list_approved_gates };
