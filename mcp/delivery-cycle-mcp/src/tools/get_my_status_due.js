// get_my_status_due.js — Contract 32 (WS3)
// Active Initiatives where the caller is DOL/DCS/EPO and status_overdue = true
// (D-484 Updates Due tab). Read-only, scoped to the caller via JWT.

'use strict';

const { supabase } = require('../db');

const CADENCE_LABEL = { weekly: 'Weekly', triweekly: 'Triweekly', monthly: 'Monthly' };

/**
 * @param {object} _params - none (uses JWT)
 * @param {string} caller_user_id - from JWT
 */
async function get_my_status_due(_params, caller_user_id) {
  const { data: cycles, error } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, division_id, status_due_at, latest_status_update_id')
    .is('deleted_at', null)
    .eq('status_overdue', true)
    .not('current_lifecycle_stage', 'in', '(COMPLETE,CANCELLED)')
    .or(`assigned_dol_user_id.eq.${caller_user_id},assigned_dcs_user_id.eq.${caller_user_id},assigned_epo_user_id.eq.${caller_user_id}`);

  if (error) {
    return { success: false, error: `Failed to load Updates Due: ${error.message}` };
  }
  if (!cycles || cycles.length === 0) {
    return { success: true, data: [] };
  }

  // Division names.
  const divisionIds = [...new Set(cycles.map(c => c.division_id).filter(Boolean))];
  const divisionName = {};
  if (divisionIds.length) {
    const { data: divs } = await supabase
      .from('divisions').select('id, division_name').in('id', divisionIds);
    for (const d of (divs || [])) { divisionName[d.id] = d.division_name; }
  }

  // Cadence per distinct division (resolved via the shared upward walk, D-481).
  const cadenceByDivision = {};
  for (const divId of divisionIds) {
    const { data: cfg } = await supabase.rpc('resolve_division_status_config', { p_division_id: divId });
    const row = Array.isArray(cfg) ? cfg[0] : cfg;
    cadenceByDivision[divId] = row && row.cadence ? CADENCE_LABEL[row.cadence] : null;
  }

  // Latest saved_at per Initiative.
  const updateIds = cycles.map(c => c.latest_status_update_id).filter(Boolean);
  const savedAtById = {};
  if (updateIds.length) {
    const { data: ups } = await supabase
      .from('initiative_status_updates').select('id, saved_at').in('id', updateIds);
    for (const u of (ups || [])) { savedAtById[u.id] = u.saved_at; }
  }

  const data = cycles.map(c => ({
    initiative_id:  c.delivery_cycle_id,
    cycle_title:    c.cycle_title,
    division_name:  divisionName[c.division_id] || null,
    last_saved_at:  c.latest_status_update_id ? (savedAtById[c.latest_status_update_id] || null) : null,
    cadence:        cadenceByDivision[c.division_id] || null,
    status_due_at:  c.status_due_at
  }));

  return { success: true, data };
}

module.exports = { get_my_status_due };
