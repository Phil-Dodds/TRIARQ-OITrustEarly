// update_user.js
// Updates mutable user fields. Admin-only.
// allow_both_admin_and_functional_roles can only be set to true by the 'phil' role (D-139).

'use strict';

const { supabase } = require('../db');

const VALID_ROLES  = ['phil', 'ds', 'cb', 'ce', 'admin'];
const MUTABLE_FIELDS = ['display_name', 'system_role', 'is_active', 'allow_both_admin_and_functional_roles'];

/**
 * @param {object} params
 * @param {string} params.user_id
 * @param {object} params.updates
 * @param {string} caller_user_id
 */
async function update_user(params, caller_user_id) {
  const { user_id, updates } = params;

  if (!user_id) return { success: false, error: 'user_id is required.' };
  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    return { success: false, error: 'updates object is required and must not be empty.' };
  }

  const immutableAttempts = Object.keys(updates).filter(k => !MUTABLE_FIELDS.includes(k));
  if (immutableAttempts.length > 0) {
    return {
      success: false,
      error: `The following fields cannot be updated: ${immutableAttempts.join(', ')}.`
    };
  }

  // Verify caller
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
      error: 'Updating users requires Admin role. Your current role does not have this permission.'
    };
  }

  // D-139: only 'phil' role can set allow_both_admin_and_functional_roles = true
  if (updates.allow_both_admin_and_functional_roles === true && caller.system_role !== 'phil') {
    return {
      success: false,
      error: 'Setting allow_both_admin_and_functional_roles requires Phil (EVP P&G) authority. '
           + 'This override is a HITRUST separation-of-duties exception and cannot be granted by Division Admins.'
    };
  }

  // Validate system_role if being updated
  if (updates.system_role && !VALID_ROLES.includes(updates.system_role)) {
    return {
      success: false,
      error: `system_role must be one of: ${VALID_ROLES.join(', ')}.`
    };
  }

  // Verify target user exists
  const { data: existing, error: existErr } = await supabase
    .from('users')
    .select('id')
    .eq('id', user_id)
    .is('deleted_at', null)
    .single();

  if (existErr || !existing) {
    return { success: false, error: 'User not found.' };
  }

  // Build safe update payload
  const payload = {};
  for (const field of MUTABLE_FIELDS) {
    if (updates[field] !== undefined) {
      payload[field] = updates[field];
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from('users')
    .update(payload)
    .eq('id', user_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to update user: ${updateErr.message}` };
  }

  return { success: true, data: updated };
}

module.exports = { update_user };
