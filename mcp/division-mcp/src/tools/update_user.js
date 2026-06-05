// update_user.js
// Updates mutable user fields. Admin-only.
// allow_both_admin_and_functional_roles can only be set to true by the 'phil' role (D-139).

'use strict';

const { supabase } = require('../db');

const VALID_ROLES  = ['phil', 'dcs', 'epo', 'dol', 'ce', 'admin'];

// Contract 19 (D-394): boolean role flags joined to MUTABLE_FIELDS so the Admin UI can
// toggle them via update_user. Phase 1 dual-write per CC-19-04 — system_role stays
// in sync until migration 034 drops it.
const ROLE_FLAGS = ['is_admin', 'is_dcs', 'is_epo', 'is_dol', 'is_ce'];
const MUTABLE_FIELDS = [
  'display_name', 'system_role', 'is_active', 'allow_both_admin_and_functional_roles',
  ...ROLE_FLAGS
];

// Derives a legacy system_role value from the boolean flags. Priority: admin > dcs > epo > dol > ce.
function deriveSystemRole(flags) {
  if (flags.is_admin) return 'admin';
  if (flags.is_dcs)   return 'dcs';
  if (flags.is_epo)   return 'epo';
  if (flags.is_dol)   return 'dol';
  if (flags.is_ce)    return 'ce';
  return null;
}

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

  // Build safe update payload.
  const payload = {};
  for (const field of MUTABLE_FIELDS) {
    if (updates[field] !== undefined) {
      payload[field] = updates[field];
    }
  }

  // Contract 19 dual-write: if any boolean flag was updated, derive an updated system_role too
  //   to keep the legacy column in sync. The caller may omit system_role explicitly — we still
  //   keep it aligned with whichever flag is the user's "primary" role under the legacy mapping.
  const anyFlagInUpdate = ROLE_FLAGS.some(f => updates[f] !== undefined);
  if (anyFlagInUpdate && updates.system_role === undefined) {
    // Read existing user row to merge unchanged flags into the derivation.
    const { data: existingFlags } = await supabase
      .from('users')
      .select('is_admin, is_dcs, is_epo, is_dol, is_ce')
      .eq('id', user_id)
      .single();
    const merged = { ...(existingFlags ?? {}) };
    for (const f of ROLE_FLAGS) {
      if (updates[f] !== undefined) { merged[f] = updates[f]; }
    }
    const derived = deriveSystemRole(merged);
    if (derived) { payload.system_role = derived; }
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
