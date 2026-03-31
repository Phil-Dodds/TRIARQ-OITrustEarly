// create_user.js
// Creates a user: sends Supabase Auth invite and inserts public.users record.
// Admin-only. Enforces allow_both_admin_and_functional_roles = false default (D-139).

'use strict';

const { supabase } = require('../db');

const VALID_ROLES = ['phil', 'ds', 'cb', 'ce', 'admin'];

/**
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.display_name
 * @param {string} params.system_role - one of: phil, ds, cb, ce, admin
 * @param {string} caller_user_id
 */
async function create_user(params, caller_user_id) {
  const { email, display_name, system_role } = params;

  if (!email)        return { success: false, error: 'email is required.' };
  if (!display_name) return { success: false, error: 'display_name is required.' };
  if (!system_role)  return { success: false, error: 'system_role is required.' };

  if (!VALID_ROLES.includes(system_role)) {
    return {
      success: false,
      error: `system_role must be one of: ${VALID_ROLES.join(', ')}. Received: ${system_role}.`
    };
  }

  // Verify caller is admin
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('system_role, is_active, allow_both_admin_and_functional_roles')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (caller.system_role !== 'admin' && caller.system_role !== 'phil') {
    return {
      success: false,
      error: 'Creating users requires Admin role. Your current role does not have this permission.'
    };
  }

  // D-139: admin + functional role separation
  // 'admin' role cannot be combined with functional roles (ds, cb, ce, phil) unless
  // allow_both_admin_and_functional_roles = true. This is set per-user, not per-caller.
  // For new users, allow_both defaults to false — this is enforced at the DB level.
  // The caller cannot grant allow_both to a new user; only Phil can do that via update_user.

  // Check for duplicate email
  const { data: existingEmail } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .is('deleted_at', null)
    .limit(1);

  if (existingEmail && existingEmail.length > 0) {
    return {
      success: false,
      error: `A user with email ${email} already exists.`
    };
  }

  // Send Supabase Auth invite — this creates the auth.users record and sends the magic link email
  const { data: authData, error: authErr } = await supabase.auth.admin.inviteUserByEmail(
    email.toLowerCase().trim(),
    { data: { display_name, system_role } }
  );

  if (authErr) {
    return { success: false, error: `Failed to send invite email: ${authErr.message}` };
  }

  const auth_user_id = authData.user.id;

  // Insert public.users record with the auth UUID
  const { data: newUser, error: insertErr } = await supabase
    .from('users')
    .insert({
      id:           auth_user_id,
      email:        email.toLowerCase().trim(),
      display_name: display_name.trim(),
      system_role,
      allow_both_admin_and_functional_roles: false,
      is_active:    true
    })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: `Auth invite sent but failed to create user record: ${insertErr.message}` };
  }

  return { success: true, data: newUser };
}

module.exports = { create_user };
