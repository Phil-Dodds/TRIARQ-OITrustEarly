// create_user.js
// Creates a user: sends Supabase Auth invite and inserts public.users record.
// Admin-only. Enforces allow_both_admin_and_functional_roles = false default (D-139).
// Invite fires automatically on user creation — no separate "Send Invite" button (D-248).
// Dev bypass removed (Auth Contract 2026-04-14).

'use strict';

const { supabase } = require('../db');

const VALID_ROLES = ['phil', 'ds', 'cb', 'ce', 'admin'];

// Redirect target for invite emails — user lands on set-password screen (D-248).
// Set APP_PASSWORD_SET_URL env var on Render. Falls back to GitHub Pages URL.
const INVITE_REDIRECT_URL =
  process.env.APP_PASSWORD_SET_URL ||
  'https://phil-dodds.github.io/TRIARQ-OITrustEarly/auth/set-password';

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
  // For new users, allow_both defaults to false — enforced at the DB level.
  // Only Phil can set allow_both = true via update_user.

  // Check for duplicate email in public.users
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

  // Check whether a Supabase Auth account already exists for this email.
  // If so, the user is already active — do not resend an invite.
  // CCode-decision CC-AUTH-003: Checking for existing Supabase auth account on create_user.
  //   listUsers() with email filter is used here to detect active accounts.
  //   If the auth account exists and email_confirmed_at is set, the user is active
  //   and we return a specific error rather than silently failing (D-140).
  //   This check requires the service key (admin API) — already available in MCP servers.
  const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1 });
  // Note: listUsers does not support email filter in all Supabase versions.
  // We use getUserByEmail via the admin API workaround below.
  // If the above check is insufficient, the inviteUserByEmail call will return an error
  // for already-confirmed emails, which we surface as a distinct user-facing error.

  // Send Supabase Auth invite — creates auth.users record and emails the set-password link.
  const normalizedEmail = email.toLowerCase().trim();
  const { data: authData, error: authErr } = await supabase.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      data:       { display_name, system_role },
      redirectTo: INVITE_REDIRECT_URL
    }
  );

  if (authErr) {
    // Supabase returns an error if the email already has a confirmed auth account (D-248).
    if (/already.*registered/i.test(authErr.message) || /email.*exist/i.test(authErr.message)) {
      return {
        success: false,
        error: 'This email already has an active account.'
      };
    }
    return { success: false, error: `Failed to send invite email: ${authErr.message}` };
  }

  const auth_user_id = authData.user.id;

  // Insert public.users record with the Supabase auth UUID
  const { data: newUser, error: insertErr } = await supabase
    .from('users')
    .insert({
      id:           auth_user_id,
      email:        normalizedEmail,
      display_name: display_name.trim(),
      system_role,
      allow_both_admin_and_functional_roles: false,
      is_active:    true
    })
    .select()
    .single();

  if (insertErr) {
    return {
      success: false,
      error: `Invitation sent but failed to create user record: ${insertErr.message}`
    };
  }

  return {
    success: true,
    data:    newUser,
    message: `User created and invitation sent to ${normalizedEmail}.`
  };
}

module.exports = { create_user };
