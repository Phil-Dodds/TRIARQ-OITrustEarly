// assign_user_to_division.js
// Creates an active division_memberships record. Admin-only.
// Enforces: no duplicate active membership (unique index handles this at DB level too).

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.user_id
 * @param {string} params.division_id
 * @param {string} caller_user_id
 */
async function assign_user_to_division(params, caller_user_id) {
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
      error: 'Assigning users to Divisions requires Admin role. Your current role does not have this permission.'
    };
  }

  // Verify target user exists
  const { data: targetUser, error: userErr } = await supabase
    .from('users')
    .select('id, display_name, system_role, allow_both_admin_and_functional_roles')
    .eq('id', user_id)
    .is('deleted_at', null)
    .single();

  if (userErr || !targetUser) {
    return { success: false, error: 'Target user not found.' };
  }

  // Verify Division exists
  const { data: division, error: divErr } = await supabase
    .from('divisions')
    .select('id, division_name')
    .eq('id', division_id)
    .is('deleted_at', null)
    .single();

  if (divErr || !division) {
    return { success: false, error: 'Division not found.' };
  }

  // Check for existing active membership
  const { data: existing } = await supabase
    .from('division_memberships')
    .select('id')
    .eq('user_id', user_id)
    .eq('division_id', division_id)
    .is('revoked_at', null)
    .is('deleted_at', null)
    .limit(1);

  if (existing && existing.length > 0) {
    return {
      success: false,
      error: `${targetUser.display_name} already has an active membership in ${division.division_name}.`
    };
  }

  const { data: membership, error: insertErr } = await supabase
    .from('division_memberships')
    .insert({
      user_id,
      division_id,
      assigned_by: caller_user_id
    })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: `Failed to assign user: ${insertErr.message}` };
  }

  return { success: true, data: membership };
}

module.exports = { assign_user_to_division };
