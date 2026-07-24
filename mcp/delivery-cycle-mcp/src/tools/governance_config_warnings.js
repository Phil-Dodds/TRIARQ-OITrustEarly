// governance_config_warnings.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G3 (D-557, D-570c)
// Admin → Divisions warning data: gate_approver_configs rows naming
// non-leadership people in Divisions that have live Level-3-effective
// initiatives. Level 3 ignores such configs at resolution (G2); this tool
// feeds the admin-screen banner that explains why. Admin JWT (CC-G3 lean —
// admin surface data).

'use strict';

const { supabase } = require('../db');

/**
 * @returns {{ success: boolean, data?: { config_warnings: Array<{
 *   division_id, division_name, gate_name, approver_user_id,
 *   approver_display_name, l3_initiative_count }> }, error?: string }}
 */
async function get_governance_config_warnings(params, caller_user_id) {
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin, is_super_admin, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller || !caller.is_active) {
    return { success: false, error: 'Caller user record not found or inactive.' };
  }
  if (caller.is_admin !== true && caller.is_super_admin !== true) {
    return { success: false, error: 'Governance configuration warnings require an Admin role.' };
  }

  // Live Level-3-effective initiatives per Division (set_level wins; NULL
  // set_level falls back to baseline — D-562 COALESCE).
  const { data: l3Cycles, error: l3Err } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, division_id, set_level, baseline_level')
    .or('set_level.eq.3,and(set_level.is.null,baseline_level.eq.3)')
    .is('deleted_at', null);
  if (l3Err) {
    return { success: false, error: `Failed to query Level 3 Initiatives: ${l3Err.message}` };
  }

  const l3CountByDivision = {};
  for (const c of l3Cycles || []) {
    if (!c.division_id) { continue; }
    l3CountByDivision[c.division_id] = (l3CountByDivision[c.division_id] || 0) + 1;
  }
  const l3DivisionIds = Object.keys(l3CountByDivision);
  if (l3DivisionIds.length === 0) {
    return { success: true, data: { config_warnings: [] } };
  }

  const { data: configs, error: configErr } = await supabase
    .from('gate_approver_configs')
    .select('division_id, gate_name, approver_user_id')
    .in('division_id', l3DivisionIds);
  if (configErr) {
    return { success: false, error: `Failed to query approver configs: ${configErr.message}` };
  }
  if (!configs || configs.length === 0) {
    return { success: true, data: { config_warnings: [] } };
  }

  // Leadership set: Phil (is_super_admin) + owners of any live Division.
  const approverIds = [...new Set(configs.map(c => c.approver_user_id).filter(Boolean))];
  const { data: approverRows } = await supabase
    .from('users')
    .select('id, display_name, is_super_admin')
    .in('id', approverIds)
    .is('deleted_at', null);
  const approverById = {};
  for (const u of approverRows || []) { approverById[u.id] = u; }

  const { data: allDivisions } = await supabase
    .from('divisions')
    .select('id, division_name, owner_user_id')
    .is('deleted_at', null);
  const ownerIds = new Set((allDivisions || []).map(d => d.owner_user_id).filter(Boolean));
  const divisionNameById = {};
  for (const d of allDivisions || []) { divisionNameById[d.id] = d.division_name; }

  const config_warnings = configs
    .filter(c => {
      const approver = approverById[c.approver_user_id];
      if (!approver) { return true; }                 // deleted approver — flag it too
      if (approver.is_super_admin === true) { return false; }
      return !ownerIds.has(c.approver_user_id);       // non-leadership
    })
    .map(c => ({
      division_id:           c.division_id,
      division_name:         divisionNameById[c.division_id] || null,
      gate_name:             c.gate_name,
      approver_user_id:      c.approver_user_id,
      approver_display_name: approverById[c.approver_user_id]?.display_name || null,
      l3_initiative_count:   l3CountByDivision[c.division_id] || 0
    }));

  return { success: true, data: { config_warnings } };
}

module.exports = { get_governance_config_warnings };
