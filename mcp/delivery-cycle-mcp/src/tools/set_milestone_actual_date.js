// set_milestone_actual_date.js
// Pathways OI Trust — delivery-cycle-mcp
// Records the actual date a gate milestone was cleared.
// System-set on gate decision; also callable directly for corrections.
// Derives date_status after actual_date is set per Session 2026-03-24-A date state model.
//
// Date state model (Session 2026-03-24-A):
//   achieved — actual_date set, actual_date <= target_date (on or before target)
//   complete  — actual_date set, target_date null (no target was set)
//   overdue   — actual_date set, actual_date > target_date
//
// Source: build-c-spec Section 4.1, Session 2026-03-24-A, START-HERE 2026-04-06

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} params.gate_name          — 'brief_review' | 'go_to_build' | 'go_to_deploy' | 'go_to_release' | 'close_review'
 * @param {string} params.actual_date        — ISO date string YYYY-MM-DD
 * @param {string} caller_user_id - from JWT
 */
async function set_milestone_actual_date(params, caller_user_id) {
  const { delivery_cycle_id, gate_name, actual_date } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!gate_name) {
    return { success: false, error: 'gate_name is required.' };
  }
  if (!actual_date) {
    return { success: false, error: 'actual_date is required (YYYY-MM-DD).' };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(actual_date)) {
    return { success: false, error: 'actual_date must be in YYYY-MM-DD format.' };
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

  // Fetch the milestone
  const { data: milestone, error: fetchErr } = await supabase
    .from('cycle_milestone_dates')
    .select('milestone_id, target_date, date_status')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_name', gate_name)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !milestone) {
    return { success: false, error: `Milestone for gate '${gate_name}' not found on this cycle.` };
  }

  // Derive date_status from actual vs target (Session 2026-03-24-A)
  let new_date_status;
  if (!milestone.target_date) {
    // No target was set — actual date recorded, status = complete
    new_date_status = 'complete';
  } else if (actual_date <= milestone.target_date) {
    // Cleared on or before target — status = achieved
    new_date_status = 'achieved';
  } else {
    // Cleared after target — status = overdue (recorded after the fact)
    new_date_status = 'overdue';
  }

  // manually_entered: true — this tool is called directly by a user (correction path).
  // Gate approval path calls update directly, not through this tool.
  const { data: updated, error: updateErr } = await supabase
    .from('cycle_milestone_dates')
    .update({
      actual_date,
      date_status:      new_date_status,
      manually_entered: true
    })
    .eq('milestone_id', milestone.milestone_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to set actual date: ${updateErr.message}` };
  }

  // Append event log — manual entry flagged for audit trail
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id:  delivery_cycle_id,
      event_type:         'milestone_actual_date_set_manually',
      event_description:  `Actual date for gate '${gate_name}' set manually to ${actual_date} (status: ${new_date_status}).`,
      actor_user_id:      caller_user_id,
      event_metadata: {
        gate_name,
        actual_date,
        date_status:      new_date_status,
        manually_entered: true
      }
    });

  return { success: true, data: updated };
}

module.exports = { set_milestone_actual_date };
