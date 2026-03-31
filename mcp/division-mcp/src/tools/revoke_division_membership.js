// revoke_division_membership.js
// Soft-revokes a division membership by setting revoked_at. Admin-only.
// Never deletes the record — keeps audit trail.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.user_id
 * @param {string} params.division_id
 * @param {string} caller_user_id
 */
async function revoke_division_membership(params, caller_user_id) {
  const { user_id, division_id } = params;

  if (!user_id)     return { success: false, error: 'user_id is required.' };
  if (!division_id) return { success: false, error: 'division_id is required.' };

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
      error: 'Revoking Division memberships requires Admin role. Your current role does not have this permission.'
    };
  }

  // Find the active membership
  const { data: membership, error: findErr } = await supabase
    .from('division_memberships')
    .select('id')
    .eq('user_id', user_id)
    .eq('division_id', division_id)
    .is('revoked_at', null)
    .is('deleted_at', null)
    .single();

  if (findErr || !membership) {
    return {
      success: false,
      error: 'No active membership found for this user in this Division.'
    };
  }

  const { data: revoked, error: updateErr } = await supabase
    .from('division_memberships')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', membership.id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to revoke membership: ${updateErr.message}` };
  }

  return { success: true, data: revoked };
}

module.exports = { revoke_division_membership };
