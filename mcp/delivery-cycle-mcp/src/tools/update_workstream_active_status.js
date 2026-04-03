// update_workstream_active_status.js
// Pathways OI Trust — delivery-cycle-mcp
// Admin-only. Toggles active_status on a Delivery Workstream.
// Returns a warning (not a block) if deactivating a Workstream that has open cycles.
// Source: ARCH-23, build-c-spec Section 4.1

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.workstream_id
 * @param {boolean} params.active_status  — the new desired state
 * @param {string} caller_user_id - from JWT
 */
async function update_workstream_active_status(params, caller_user_id) {
  const { workstream_id, active_status } = params;

  if (!workstream_id) {
    return { success: false, error: 'workstream_id is required.' };
  }
  if (typeof active_status !== 'boolean') {
    return { success: false, error: 'active_status is required and must be a boolean.' };
  }

  // Verify caller is admin or phil
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('id, system_role, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (!caller.is_active) {
    return { success: false, error: 'Your account is inactive.' };
  }
  if (caller.system_role !== 'admin' && caller.system_role !== 'phil') {
    return {
      success: false,
      error: 'Changing Workstream active status requires Admin role. Contact your System Admin to request access.'
    };
  }

  // Fetch workstream
  const { data: workstream, error: wsErr } = await supabase
    .from('delivery_workstreams')
    .select('workstream_id, workstream_name, active_status')
    .eq('workstream_id', workstream_id)
    .is('deleted_at', null)
    .single();

  if (wsErr || !workstream) {
    return { success: false, error: 'Workstream not found or has been deleted.' };
  }

  if (workstream.active_status === active_status) {
    return {
      success: false,
      error: `Workstream is already ${active_status ? 'active' : 'inactive'}. No change made.`
    };
  }

  // If deactivating, check for open cycles — return warning but do not block
  let open_cycles_warning = null;
  if (!active_status) {
    const { count } = await supabase
      .from('delivery_cycles')
      .select('delivery_cycle_id', { count: 'exact', head: true })
      .eq('workstream_id', workstream_id)
      .not('current_lifecycle_stage', 'in', '("COMPLETE","CANCELLED")')
      .is('deleted_at', null);

    if (count && count > 0) {
      open_cycles_warning = `Warning: ${count} open cycle(s) are assigned to this Workstream. Gate clearance will be blocked on those cycles until the Workstream is reactivated.`;
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from('delivery_workstreams')
    .update({ active_status })
    .eq('workstream_id', workstream_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to update Workstream: ${updateErr.message}` };
  }

  return {
    success: true,
    data: updated,
    ...(open_cycles_warning ? { warning: open_cycles_warning } : {})
  };
}

module.exports = { update_workstream_active_status };
