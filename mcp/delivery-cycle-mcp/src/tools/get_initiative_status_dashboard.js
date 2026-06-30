// get_initiative_status_dashboard.js — Contract 32 (WS4)
// Org-wide Initiative status grid, division-scoped to the caller (D-485).
// Per Initiative: latest status fields + Needs Review reasons (shared lib).
// Read-only. Mirrors list_delivery_cycles access model (direct memberships;
// admin sees all).

'use strict';

const { supabase } = require('../db');
const { computeNeedsReviewReasons } = require('../lib/needs-review');

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
    .select('delivery_cycle_id, cycle_title, division_id, current_lifecycle_stage, status_overdue, latest_status_update_id')
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

  // ── Batch resolve division names ──────────────────────────────────────────
  const divisionIds = [...new Set(cycles.map(c => c.division_id).filter(Boolean))];
  const divisionName = {};
  if (divisionIds.length) {
    const { data: divs } = await supabase
      .from('divisions').select('id, division_name').in('id', divisionIds);
    for (const d of (divs || [])) { divisionName[d.id] = d.division_name; }
  }

  // ── Batch resolve latest updates ────────────────────────────────────────────
  const updateIds = cycles.map(c => c.latest_status_update_id).filter(Boolean);
  const updateById = {};
  if (updateIds.length) {
    const { data: ups } = await supabase
      .from('initiative_status_updates').select('*').in('id', updateIds);
    for (const u of (ups || [])) { updateById[u.id] = u; }
  }

  // saved_by display names.
  const saverIds = [...new Set(Object.values(updateById).map(u => u.saved_by).filter(Boolean))];
  const saverName = {};
  if (saverIds.length) {
    const { data: users } = await supabase
      .from('users').select('id, display_name').in('id', saverIds);
    for (const u of (users || [])) { saverName[u.id] = u.display_name; }
  }

  // ── Per-Initiative milestones (for Needs Review at-risk eval) ──────────────
  const { data: allMilestones } = await supabase
    .from('cycle_milestone_dates')
    .select('delivery_cycle_id, gate_name, date_status')
    .in('delivery_cycle_id', cycles.map(c => c.delivery_cycle_id))
    .is('deleted_at', null);
  const milestonesByCycle = {};
  for (const m of (allMilestones || [])) {
    (milestonesByCycle[m.delivery_cycle_id] = milestonesByCycle[m.delivery_cycle_id] || []).push(m);
  }

  // ── Build rows + Needs Review reasons (D-485) ──────────────────────────────
  const rows = [];
  for (const c of cycles) {
    const latest = c.latest_status_update_id ? (updateById[c.latest_status_update_id] || null) : null;
    const reasons = await computeNeedsReviewReasons(
      supabase, c, latest, milestonesByCycle[c.delivery_cycle_id] || []
    );
    if (needsReviewOnly && reasons.length === 0) { continue; }

    rows.push({
      initiative_id:           c.delivery_cycle_id,
      cycle_title:             c.cycle_title,
      division_id:             c.division_id,
      division_name:           divisionName[c.division_id] || null,
      current_lifecycle_stage: c.current_lifecycle_stage,
      status_overdue:          c.status_overdue,
      saved_by_name:           latest ? (saverName[latest.saved_by] || null) : null,
      saved_at:                latest ? latest.saved_at : null,
      escalation_needed:       latest ? latest.escalation_needed : false,
      pilot_confidence:        latest ? latest.pilot_confidence : null,
      close_confidence:        latest ? latest.close_confidence : null,
      needs_review_reasons:    reasons
    });
  }

  return { success: true, data: rows };
}

module.exports = { get_initiative_status_dashboard };
