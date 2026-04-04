// get_delivery_cycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Returns the full cycle record including current stage, milestone dates,
// gate records, Workstream details.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} caller_user_id - from JWT
 */
async function get_delivery_cycle(params, caller_user_id) {
  const { delivery_cycle_id } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  // ── Fetch cycle ───────────────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // ── Fetch milestone dates ─────────────────────────────────────────────────
  const { data: milestone_dates } = await supabase
    .from('cycle_milestone_dates')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // ── Fetch gate records ────────────────────────────────────────────────────
  const { data: gate_records } = await supabase
    .from('gate_records')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // ── Fetch workstream details ──────────────────────────────────────────────
  const { data: workstream } = await supabase
    .from('delivery_workstreams')
    .select('workstream_id, workstream_name, active_status, home_division_id, workstream_lead_user_id')
    .eq('workstream_id', cycle.workstream_id)
    .is('deleted_at', null)
    .single();

  // ── Fetch Jira links ──────────────────────────────────────────────────────
  const { data: jira_links } = await supabase
    .from('jira_links')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // ── Fetch cycle artifacts ─────────────────────────────────────────────────
  const { data: artifacts } = await supabase
    .from('cycle_artifacts')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .order('attached_at', { ascending: true });

  // ── Resolve DS / CB display names (migration 024 columns) ────────────────
  const userIdsToResolve = [
    cycle.assigned_ds_user_id,
    cycle.assigned_cb_user_id,
    cycle.cycle_owner_user_id
  ].filter(Boolean);

  let userMap = {};
  if (userIdsToResolve.length > 0) {
    const { data: userRows } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', userIdsToResolve)
      .is('deleted_at', null);
    if (userRows) {
      userRows.forEach(u => { userMap[u.id] = u.display_name; });
    }
  }

  return {
    success: true,
    data: {
      ...cycle,
      assigned_ds_display_name: cycle.assigned_ds_user_id ? (userMap[cycle.assigned_ds_user_id] ?? null) : null,
      assigned_cb_display_name: cycle.assigned_cb_user_id ? (userMap[cycle.assigned_cb_user_id] ?? null) : null,
      owner_display_name:       cycle.cycle_owner_user_id ? (userMap[cycle.cycle_owner_user_id] ?? null) : null,
      milestone_dates:  milestone_dates || [],
      gate_records:     gate_records    || [],
      workstream:       workstream      || null,
      jira_links:       jira_links      || [],
      artifacts:        artifacts       || []
    }
  };
}

module.exports = { get_delivery_cycle };
