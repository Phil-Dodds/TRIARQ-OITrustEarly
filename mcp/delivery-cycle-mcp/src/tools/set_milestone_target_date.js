// set_milestone_target_date.js
// Pathways OI Trust — delivery-cycle-mcp
// Sets target_date on a cycle_milestone_dates row. User-set — not system-controlled.
// Source: build-c-spec Section 4.1, Session 2026-03-24-A

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} params.gate_name
 * @param {string} params.target_date  — ISO date string YYYY-MM-DD
 * @param {string} caller_user_id - from JWT
 */
async function set_milestone_target_date(params, caller_user_id) {
  const { delivery_cycle_id, gate_name, target_date } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!gate_name) {
    return { success: false, error: 'gate_name is required.' };
  }
  if (!target_date) {
    return { success: false, error: 'target_date is required (YYYY-MM-DD).' };
  }

  // Basic date format validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(target_date)) {
    return { success: false, error: 'target_date must be in YYYY-MM-DD format.' };
  }

  const VALID_GATES = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];
  if (!VALID_GATES.includes(gate_name)) {
    return {
      success: false,
      error: `gate_name '${gate_name}' is not valid. Must be one of: ${VALID_GATES.join(', ')}.`
    };
  }

  // Verify cycle exists
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, current_lifecycle_stage')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // Fetch and update the milestone
  const { data: milestone, error: fetchErr } = await supabase
    .from('cycle_milestone_dates')
    .select('milestone_id, date_status, actual_date')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_name', gate_name)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !milestone) {
    return { success: false, error: `Milestone for gate '${gate_name}' not found on this cycle.` };
  }

  // Derive new date_status from context (date state model Session 2026-03-24-A)
  // When actual_date is already set, target_date update doesn't change date_status.
  // When actual_date is null and status was not_started, move to on_track.
  let new_date_status = milestone.date_status;
  if (!milestone.actual_date && milestone.date_status === 'not_started') {
    new_date_status = 'on_track';
  }

  const { data: updated, error: updateErr } = await supabase
    .from('cycle_milestone_dates')
    .update({
      target_date,
      date_status: new_date_status
    })
    .eq('milestone_id', milestone.milestone_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to set target date: ${updateErr.message}` };
  }

  return { success: true, data: updated };
}

module.exports = { set_milestone_target_date };
