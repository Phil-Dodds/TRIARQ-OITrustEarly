// get_initiative_status_dashboard.js — Contract 32 (WS4), amended Contract 36
// (D-510 columns, D-511 person filters, D-507 chain-root age, D-506 authorship).
// Org-wide Initiative status grid, division-scoped to the caller (D-485).
// Per Initiative: latest (chain-head) status fields + Needs Review reasons.
// Read-only. Mirrors list_delivery_cycles access model.

'use strict';

const { supabase } = require('../db');
const { computeNeedsReviewReasons } = require('../lib/needs-review');
const { resolveNextGate } = require('../lib/gate-resolution');
const { resolveChainRoots } = require('../lib/status-chain');

/**
 * @param {object} params
 * @param {string[]} [params.division_ids] - defaults to caller's divisions
 * @param {boolean}  [params.needs_review_only] - default false
 * @param {string} caller_user_id - from JWT
 */
async function get_initiative_status_dashboard(params, caller_user_id) {
  const needsReviewOnly = params?.needs_review_only === true;

  // ── Resolve access (mirror list_delivery_cycles: direct memberships; admin all) ──
  const { data: caller } = await supabase
    .from('users').select('is_admin').eq('id', caller_user_id).is('deleted_at', null).single();
  const isPrivileged = caller?.is_admin === true;

  let accessibleIds = null; // null = unrestricted (admin)
  if (!isPrivileged) {
    const { data: memberships } = await supabase
      .from('division_memberships')
      .select('division_id')
      .eq('user_id', caller_user_id)
      .is('revoked_at', null)
      .is('deleted_at', null);
    accessibleIds = [...new Set((memberships || []).map(m => m.division_id))];
    if (accessibleIds.length === 0) { return { success: true, data: [] }; }
  }

  // Apply explicit division filter, intersected with access.
  let scopeIds = null;
  const requested = Array.isArray(params?.division_ids) ? params.division_ids.filter(Boolean) : null;
  if (requested && requested.length) {
    scopeIds = accessibleIds ? requested.filter(id => accessibleIds.includes(id)) : requested;
    if (scopeIds.length === 0) { return { success: true, data: [] }; }
  } else {
    scopeIds = accessibleIds; // null for admin = all
  }

  let query = supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, division_id, current_lifecycle_stage, status_overdue, latest_status_update_id, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id')
    .is('deleted_at', null)
    .not('current_lifecycle_stage', 'in', '(COMPLETE,CANCELLED)');
  if (scopeIds) { query = query.in('division_id', scopeIds); }

  const { data: cycles, error } = await query;
  if (error) {
    return { success: false, error: `Failed to load Initiative Status Dashboard: ${error.message}` };
  }
  if (!cycles || cycles.length === 0) {
    return { success: true, data: [] };
  }

  // ── Batch resolve division names + short names (D-510) ────────────────────
  const divisionIds = [...new Set(cycles.map(c => c.division_id).filter(Boolean))];
  const divisionById = {};
  if (divisionIds.length) {
    const { data: divs } = await supabase
      .from('divisions').select('id, division_name, display_name_short').in('id', divisionIds);
    for (const d of (divs || [])) { divisionById[d.id] = d; }
  }

  // ── Batch resolve latest (chain-head) updates + chain roots (D-507) ───────
  const updateIds = cycles.map(c => c.latest_status_update_id).filter(Boolean);
  const updateById = {};
  if (updateIds.length) {
    const { data: ups } = await supabase
      .from('initiative_status_updates').select('*').in('id', updateIds);
    for (const u of (ups || [])) { updateById[u.id] = u; }
  }
  const rootMap = await resolveChainRoots(updateIds);

  // Author + Team display names in one lookup.
  const nameIds = new Set();
  for (const u of Object.values(updateById)) { if (u.saved_by) nameIds.add(u.saved_by); }
  for (const c of cycles) {
    if (c.assigned_dcs_user_id) nameIds.add(c.assigned_dcs_user_id);
    if (c.assigned_epo_user_id) nameIds.add(c.assigned_epo_user_id);
    if (c.assigned_dol_user_id) nameIds.add(c.assigned_dol_user_id);
  }
  const userName = {};
  if (nameIds.size) {
    const { data: users } = await supabase
      .from('users').select('id, display_name').in('id', Array.from(nameIds));
    for (const u of (users || [])) { userName[u.id] = u.display_name; }
  }

  // ── Per-Initiative milestones (Needs Review + Next Gate, D-510) ────────────
  // milestone_label + target_date added for the shared Next Gate resolution.
  const { data: allMilestones } = await supabase
    .from('cycle_milestone_dates')
    .select('delivery_cycle_id, gate_name, date_status, milestone_label, target_date, actual_date')
    .in('delivery_cycle_id', cycles.map(c => c.delivery_cycle_id))
    .is('deleted_at', null);
  const milestonesByCycle = {};
  for (const m of (allMilestones || [])) {
    (milestonesByCycle[m.delivery_cycle_id] = milestonesByCycle[m.delivery_cycle_id] || []).push(m);
  }

  // ── Contract 36 UAT: "Pending Approval" qualifier — gate_records status for
  // the next gate (awaiting_approval → chip on the dashboard).
  const { data: gateRows } = await supabase
    .from('gate_records')
    .select('delivery_cycle_id, gate_name, gate_status')
    .in('delivery_cycle_id', cycles.map(c => c.delivery_cycle_id))
    .is('deleted_at', null);
  const gateStatusByCycle = {};
  for (const g of (gateRows || [])) {
    (gateStatusByCycle[g.delivery_cycle_id] = gateStatusByCycle[g.delivery_cycle_id] || {})[g.gate_name] = g.gate_status;
  }

  // ── Build rows + Needs Review reasons (D-485, D-509 lifecycle in lib) ──────
  const rows = [];
  for (const c of cycles) {
    const latest = c.latest_status_update_id ? (updateById[c.latest_status_update_id] || null) : null;
    // D-507: age keys off the chain ROOT, never an edit.
    const root = latest ? rootMap.get(latest.id) : null;
    const reasons = await computeNeedsReviewReasons(
      supabase, c, latest, milestonesByCycle[c.delivery_cycle_id] || []
    );
    if (needsReviewOnly && reasons.length === 0) { continue; }

    // D-506/D-510 Updated By: trio-member author → initials treatment client-side;
    // non-trio author → full name (emphasizes external authorship).
    const trio = [c.assigned_dol_user_id, c.assigned_dcs_user_id, c.assigned_epo_user_id];
    const isTrioAuthor = latest ? trio.includes(latest.saved_by) : null;

    const div = divisionById[c.division_id] || {};
    const nextGate = resolveNextGate(milestonesByCycle[c.delivery_cycle_id] || []);

    rows.push({
      initiative_id:           c.delivery_cycle_id,
      cycle_title:             c.cycle_title,
      division_id:             c.division_id,
      division_name:           div.division_name || null,
      division_display_name_short: div.display_name_short || div.division_name || null,
      current_lifecycle_stage: c.current_lifecycle_stage,
      status_overdue:          c.status_overdue,
      // D-510: Next Gate + Target Date columns (shared resolution, no 4th walkback copy)
      next_gate_label:         nextGate?.label ?? null,
      next_gate_name:          nextGate?.gate_name ?? null,
      next_gate_target_date:   nextGate?.target_date ?? null,
      // Contract 36 UAT: next gate's submission is awaiting approval → chip.
      next_gate_pending_approval: nextGate
        ? (gateStatusByCycle[c.delivery_cycle_id]?.[nextGate.gate_name] === 'awaiting_approval')
        : false,
      // D-510: Team column — same fields the Initiatives Grid renders
      assigned_dcs_user_id:    c.assigned_dcs_user_id,
      assigned_epo_user_id:    c.assigned_epo_user_id,
      assigned_dol_user_id:    c.assigned_dol_user_id,
      assigned_dcs_display_name: c.assigned_dcs_user_id ? (userName[c.assigned_dcs_user_id] ?? null) : null,
      assigned_epo_display_name: c.assigned_epo_user_id ? (userName[c.assigned_epo_user_id] ?? null) : null,
      assigned_dol_display_name: c.assigned_dol_user_id ? (userName[c.assigned_dol_user_id] ?? null) : null,
      // D-510 merged Updated By + D-507 chain-root age
      saved_by_name:           latest ? (userName[latest.saved_by] || null) : null,
      is_trio_author:          isTrioAuthor,
      saved_at:                latest ? latest.saved_at : null,
      root_saved_at:           root ? root.root_saved_at : null,
      status_update_id:        latest ? latest.id : null,
      escalation_needed:       latest ? latest.escalation_needed : false,
      pilot_confidence:        latest ? latest.pilot_confidence : null,
      close_confidence:        latest ? latest.close_confidence : null,
      needs_review_reasons:    reasons
    });
  }

  return { success: true, data: rows };
}

module.exports = { get_initiative_status_dashboard };
