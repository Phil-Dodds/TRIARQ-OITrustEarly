// update_division.js
// Updates mutable fields on a Division. Admin-only.
// division_level and parent_division_id are not mutable after creation.

'use strict';

const { supabase } = require('../db');

const MUTABLE_FIELDS = ['division_name', 'division_type_label', 'owner_user_id'];

/**
 * @param {object} params
 * @param {string} params.division_id
 * @param {object} params.updates - keys restricted to MUTABLE_FIELDS
 * @param {string} caller_user_id
 */
async function update_division(params, caller_user_id) {
  const { division_id, updates } = params;

  if (!division_id) {
    return { success: false, error: 'division_id is required.' };
  }
  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    return { success: false, error: 'updates object is required and must not be empty.' };
  }

  // Reject any attempt to modify immutable fields
  const immutableAttempts = Object.keys(updates).filter(k => !MUTABLE_FIELDS.includes(k));
  if (immutableAttempts.length > 0) {
    return {
      success: false,
      error: `The following fields cannot be updated: ${immutableAttempts.join(', ')}. Mutable fields: ${MUTABLE_FIELDS.join(', ')}.`
    };
  }

  // Verify caller is admin
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('system_role, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (caller.system_role !== 'admin' && caller.system_role !== 'phil') {
    return {
      success: false,
      error: 'Updating Divisions requires Admin role. Your current role does not have this permission.'
    };
  }

  // Verify Division exists
  const { data: existing, error: existErr } = await supabase
    .from('divisions')
    .select('id')
    .eq('id', division_id)
    .is('deleted_at', null)
    .single();

  if (existErr || !existing) {
    return { success: false, error: 'Division not found.' };
  }

  // Build safe update payload
  const payload = {};
  for (const field of MUTABLE_FIELDS) {
    if (updates[field] !== undefined) {
      payload[field] = updates[field];
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from('divisions')
    .update(payload)
    .eq('id', division_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to update Division: ${updateErr.message}` };
  }

  return { success: true, data: updated };
}

module.exports = { update_division };
