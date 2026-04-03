// create_delivery_workstream.js
// Pathways OI Trust — delivery-cycle-mcp
// Admin-only. Creates a new Delivery Workstream.
// Source: ARCH-23, build-c-spec Section 4.1

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.workstream_name
 * @param {string} params.home_division_id
 * @param {string} params.workstream_lead_user_id
 * @param {string} caller_user_id - from JWT
 */
async function create_delivery_workstream(params, caller_user_id) {
  const { workstream_name, home_division_id, workstream_lead_user_id } = params;

  if (!workstream_name || !workstream_name.trim()) {
    return { success: false, error: 'workstream_name is required.' };
  }
  if (!home_division_id) {
    return { success: false, error: 'home_division_id is required.' };
  }
  if (!workstream_lead_user_id) {
    return { success: false, error: 'workstream_lead_user_id is required.' };
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
      error: 'Creating Delivery Workstreams requires Admin role. Your current role does not have this permission. Contact your System Admin to request access.'
    };
  }

  // Verify home_division_id exists
  const { data: division, error: divErr } = await supabase
    .from('divisions')
    .select('id')
    .eq('id', home_division_id)
    .is('deleted_at', null)
    .single();

  if (divErr || !division) {
    return { success: false, error: 'home_division_id not found or has been deleted.' };
  }

  // Verify lead user exists
  const { data: leadUser, error: leadErr } = await supabase
    .from('users')
    .select('id, is_active')
    .eq('id', workstream_lead_user_id)
    .is('deleted_at', null)
    .single();

  if (leadErr || !leadUser) {
    return { success: false, error: 'workstream_lead_user_id not found or has been deleted.' };
  }
  if (!leadUser.is_active) {
    return { success: false, error: 'The designated Workstream lead account is inactive. Assign an active user as lead.' };
  }

  const { data: workstream, error: insertErr } = await supabase
    .from('delivery_workstreams')
    .insert({
      workstream_name:         workstream_name.trim(),
      home_division_id,
      workstream_lead_user_id,
      active_status:           true
    })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: `Failed to create Workstream: ${insertErr.message}` };
  }

  return { success: true, data: workstream };
}

module.exports = { create_delivery_workstream };
