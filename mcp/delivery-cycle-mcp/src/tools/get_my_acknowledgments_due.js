// get_my_acknowledgments_due.js — Contract 32 (WS3), amended Contract 36 (D-506/D-508)
// Active Initiatives where the caller is a trio member and the latest update:
//   - was authored by a NON-trio user (D-506 — the only case generating
//     acknowledgment invitations; trio-authored updates generate none),
//   - has a chain ROOT saved within STATUS_RECENT_DAYS calendar days (D-508,
//     replaces the 5-day filter; age from the root, never an edit — D-507),
//   - has no acknowledgment by the caller on the CURRENT head row.
// Read-only, scoped to caller via JWT.

'use strict';

const { supabase } = require('../db');
const { isWithinRecentCalendarDays, resolveChainRoots } = require('../lib/status-chain');

/**
 * @param {object} _params - none (uses JWT)
 * @param {string} caller_user_id - from JWT
 */
async function get_my_acknowledgments_due(_params, caller_user_id) {
  const { data: cycles, error } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, division_id, latest_status_update_id, assigned_dol_user_id, assigned_dcs_user_id, assigned_epo_user_id')
    .is('deleted_at', null)
    .not('current_lifecycle_stage', 'in', '(COMPLETE,CANCELLED)')
    .not('latest_status_update_id', 'is', null)
    .or(`assigned_dol_user_id.eq.${caller_user_id},assigned_dcs_user_id.eq.${caller_user_id},assigned_epo_user_id.eq.${caller_user_id}`);

  if (error) {
    return { success: false, error: `Failed to load Needs Acknowledgment: ${error.message}` };
  }
  if (!cycles || cycles.length === 0) {
    return { success: true, data: [] };
  }

  // Latest (head) updates: saved_by + saved_at.
  const updateIds = cycles.map(c => c.latest_status_update_id).filter(Boolean);
  const { data: updates } = await supabase
    .from('initiative_status_updates')
    .select('id, saved_by, saved_at, supersedes_update_id')
    .in('id', updateIds);
  const updateById = {};
  for (const u of (updates || [])) { updateById[u.id] = u; }

  // Chain roots — the root's saved_at drives the recency window (D-507/D-508).
  const rootMap = await resolveChainRoots(updateIds);

  // Acks already made by the caller on the HEAD rows.
  const { data: acks } = await supabase
    .from('initiative_status_acknowledgments')
    .select('status_update_id')
    .in('status_update_id', updateIds)
    .eq('acknowledged_by', caller_user_id);
  const ackedUpdateIds = new Set((acks || []).map(a => a.status_update_id));

  // Filter: NON-trio author (D-506), root within window (D-508), not yet acked.
  const eligible = cycles.filter(c => {
    const u = updateById[c.latest_status_update_id];
    if (!u) { return false; }
    const trio = [c.assigned_dol_user_id, c.assigned_dcs_user_id, c.assigned_epo_user_id];
    if (trio.includes(u.saved_by)) { return false; }   // trio-authored → no invitations
    const root = rootMap.get(u.id);
    if (!root || !isWithinRecentCalendarDays(root.root_saved_at)) { return false; }
    if (ackedUpdateIds.has(u.id)) { return false; }
    return true;
  });

  if (eligible.length === 0) {
    return { success: true, data: [] };
  }

  // Division names + saved_by display names.
  const divisionIds = [...new Set(eligible.map(c => c.division_id).filter(Boolean))];
  const divisionName = {};
  if (divisionIds.length) {
    const { data: divs } = await supabase
      .from('divisions').select('id, division_name').in('id', divisionIds);
    for (const d of (divs || [])) { divisionName[d.id] = d.division_name; }
  }

  const saverIds = [...new Set(eligible.map(c => updateById[c.latest_status_update_id].saved_by))];
  const saverName = {};
  if (saverIds.length) {
    const { data: users } = await supabase
      .from('users').select('id, display_name').in('id', saverIds);
    for (const u of (users || [])) { saverName[u.id] = u.display_name; }
  }

  const data = eligible.map(c => {
    const u = updateById[c.latest_status_update_id];
    return {
      initiative_id:    c.delivery_cycle_id,
      cycle_title:      c.cycle_title,
      division_name:    divisionName[c.division_id] || null,
      saved_by_name:    saverName[u.saved_by] || 'Unknown',
      saved_at:         u.saved_at,
      status_update_id: u.id
    };
  });

  return { success: true, data };
}

module.exports = { get_my_acknowledgments_due };
