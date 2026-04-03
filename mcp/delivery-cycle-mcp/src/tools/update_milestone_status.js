// update_milestone_status.js
// Pathways OI Trust — delivery-cycle-mcp
// Updates date_status on a cycle_milestone_dates row.
// Requires status_override_reason when reverting from 'complete' to any other status.
// Source: build-c-spec Section 4.1, Session 2026-03-24-A

'use strict';

const { supabase } = require('../db');

const VALID_STATUSES = ['not_started', 'on_track', 'at_risk', 'behind', 'complete'];

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} params.gate_name
 * @param {string} params.date_status          — one of the five valid values
 * @param {string} [params.status_override_reason] — required when reverting from 'complete'
 * @param {string} caller_user_id - from JWT
 */
async function update_milestone_status(params, caller_user_id) {
  const { delivery_cycle_id, gate_name, date_status, status_override_reason } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!gate_name) {
    return { success: false, error: 'gate_name is required.' };
  }
  if (!date_status) {
    return { success: false, error: 'date_status is required.' };
  }
  if (!VALID_STATUSES.includes(date_status)) {
    return {
      success: false,
      error: `date_status must be one of: ${VALID_STATUSES.join(', ')}.`
    };
  }

  // Verify cycle exists
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // Fetch current milestone
  const { data: milestone, error: fetchErr } = await supabase
    .from('cycle_milestone_dates')
    .select('milestone_id, date_status')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_name', gate_name)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !milestone) {
    return { success: false, error: `Milestone for gate '${gate_name}' not found on this cycle.` };
  }

  // Require override reason when reverting from complete
  if (milestone.date_status === 'complete' && date_status !== 'complete') {
    if (!status_override_reason || !status_override_reason.trim()) {
      return {
        success: false,
        error: 'status_override_reason is required when reverting a milestone from complete status. Provide the reason the actual date is being reversed.'
      };
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from('cycle_milestone_dates')
    .update({
      date_status,
      status_override_reason: status_override_reason || null
    })
    .eq('milestone_id', milestone.milestone_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to update milestone status: ${updateErr.message}` };
  }

  return { success: true, data: updated };
}

module.exports = { update_milestone_status };
