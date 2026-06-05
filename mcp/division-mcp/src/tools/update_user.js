// update_user.js
// Updates mutable user fields. Admin-only.
// allow_both_admin_and_functional_roles can only be set to true by a super-admin (D-139, CC-19-06).
//
// Phase 2 (Contract 19 follow-up, migration 034): system_role removed. Role updates go
// through the boolean flags only. is_super_admin is intentionally NOT mutable here —
// bootstrap via direct DB assignment.

'use strict';

const { supabase } = require('../db');

// Boolean role flags accepted as updates. is_super_admin is excluded by design.
const ROLE_FLAGS = ['is_admin', 'is_dcs', 'is_epo', 'is_dol', 'is_ce'];
const MUTABLE_FIELDS = [
  'display_name', 'is_active', 'allow_both_admin_and_functional_roles',
  ...ROLE_FLAGS
];

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

  // Verify caller — Contract 19 (D-394): boolean predicate.
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin, is_super_admin, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (caller.is_admin !== true) {
    return {
      success: false,
      error: 'Updating users requires Admin role. Your current role does not have this permission.'
    };
  }

  // D-139: allow_both_admin_and_functional_roles is a HITRUST separation-of-duties exception.
  // CC-19-06 option B: super-admin gate replaces the legacy 'phil'-only check.
  // is_super_admin is bootstrapped by direct DB assignment, not via this MCP, so the override
  // cannot be self-granted or escalated through Admin Users.
  if (updates.allow_both_admin_and_functional_roles === true && caller.is_super_admin !== true) {
    return {
      success: false,
      error: 'Setting allow_both_admin_and_functional_roles requires super-admin authority. '
           + 'This override is a HITRUST separation-of-duties exception and cannot be granted by Division Admins.'
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

  // Build safe update payload from whitelisted fields.
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
