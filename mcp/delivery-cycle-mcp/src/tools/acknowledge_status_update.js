// acknowledge_status_update.js — Contract 32 (WS2)
// A non-save trio member (DOL/DCS/EPO) acknowledges a status update.
// Single button press, no comment. Save user cannot acknowledge own update.
// Governing: D-483.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.status_update_id
 * @param {string} caller_user_id - from JWT
 */
async function acknowledge_status_update(params, caller_user_id) {
  const { status_update_id } = params;
  if (!status_update_id) {
    return { success: false, error: 'status_update_id is required.' };
  }

  // Resolve the update and its parent Initiative.
  const { data: update, error: updErr } = await supabase
    .from('initiative_status_updates')
    .select('id, initiative_id, saved_by')
    .eq('id', status_update_id)
    .single();

  if (updErr || !update) {
    return { success: false, error: 'Status update not found.' };
  }

  // Save user never acknowledges their own update (D-483).
  if (update.saved_by === caller_user_id) {
    return { success: false, error: 'You cannot acknowledge a status update you authored.' };
  }

  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('assigned_dol_user_id, assigned_dcs_user_id, assigned_epo_user_id')
    .eq('delivery_cycle_id', update.initiative_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  // Caller must be DOL/DCS/EPO on the Initiative (D-483).
  const trio = [cycle.assigned_dol_user_id, cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id];
  if (!trio.includes(caller_user_id)) {
    return {
      success: false,
      error: 'Only the DOL, DCS, or EPO assigned to this Initiative can acknowledge its status updates.'
    };
  }

  // Already acknowledged? (UNIQUE(status_update_id, acknowledged_by)) → 409 semantics.
  const { data: existing } = await supabase
    .from('initiative_status_acknowledgments')
    .select('id')
    .eq('status_update_id', status_update_id)
    .eq('acknowledged_by', caller_user_id)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: 'You have already acknowledged this status update.' };
  }

  const { data: ack, error: ackErr } = await supabase
    .from('initiative_status_acknowledgments')
    .insert({ status_update_id, acknowledged_by: caller_user_id })
    .select('id, acknowledged_at')
    .single();

  if (ackErr || !ack) {
    return { success: false, error: `Failed to record acknowledgment: ${ackErr?.message || 'unknown error'}` };
  }

  return { success: true, data: { acknowledgment_id: ack.id, acknowledged_at: ack.acknowledged_at } };
}

module.exports = { acknowledge_status_update };
