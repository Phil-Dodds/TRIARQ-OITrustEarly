// create_user.js
// Creates a user: sends Supabase Auth invite and inserts public.users record.
// Admin-only. Enforces allow_both_admin_and_functional_roles = false default (D-139).
// Invite fires automatically on user creation — no separate "Send Invite" button (D-248).
//
// D-354: invite email contains a 6-digit OTP, not a magic link. The Supabase
// email template uses {{ .Token }} (configured in Auth dashboard). User goes to
// /login, enters their email, then enters the OTP at /auth/verify-otp. The
// redirectTo URL is unused by the OTP-only template but Supabase requires it —
// we point it at the app root.
//
// Phase 2 (Contract 19 follow-up, migration 034): system_role removed. Role input
// is exclusively boolean flags (is_admin, is_dcs, is_epo, is_dol, is_ce).
// is_super_admin is intentionally NOT a settable parameter — bootstrap by direct DB.

'use strict';

const { supabase } = require('../db');

// Boolean role flags accepted as input. is_super_admin is excluded by design.
const ROLE_FLAGS = ['is_admin', 'is_dcs', 'is_epo', 'is_dol', 'is_ce'];

// Inert redirect URL — see header comment. Override with APP_INVITE_REDIRECT_URL
// if a Supabase template variant ever needs it.
const INVITE_REDIRECT_URL =
  process.env.APP_INVITE_REDIRECT_URL ||
  process.env.APP_PASSWORD_SET_URL ||
  'https://phil-dodds.github.io/TRIARQ-OITrustEarly/login';

/**
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.display_name
 * @param {boolean} [params.is_admin]
 * @param {boolean} [params.is_dcs]
 * @param {boolean} [params.is_epo]
 * @param {boolean} [params.is_dol]
 * @param {boolean} [params.is_ce]
 * @param {string} caller_user_id
 */
async function create_user(params, caller_user_id) {
  const { email, display_name } = params;

  if (!email)        return { success: false, error: 'email is required.' };
  if (!display_name) return { success: false, error: 'display_name is required.' };

  // Resolve role flag inputs. At least one must be set.
  const flagInput = {};
  let anyFlagSet = false;
  for (const flag of ROLE_FLAGS) {
    if (params[flag] === true) {
      flagInput[flag] = true;
      anyFlagSet = true;
    } else {
      flagInput[flag] = false;
    }
  }

  if (!anyFlagSet) {
    return {
      success: false,
      error: 'At least one role flag (is_admin, is_dcs, is_epo, is_dol, is_ce) is required.'
    };
  }

  // Verify caller is Admin — Contract 19 (D-394): boolean predicate.
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin, is_active, allow_both_admin_and_functional_roles')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (caller.is_admin !== true) {
    return {
      success: false,
      error: 'Creating users requires Admin role. Your current role does not have this permission.'
    };
  }

  // D-139: admin + functional role separation
  // For new users, allow_both defaults to false — enforced at the DB level.
  // Only a super-admin can set allow_both = true via update_user (CC-19-06).

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

  // Send Supabase Auth invite — creates auth.users record and emails the OTP (D-354).
  const normalizedEmail = email.toLowerCase().trim();
  const { data: authData, error: authErr } = await supabase.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      data:       { display_name },
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

  // Insert public.users record with the Supabase auth UUID and the chosen role flags.
  const { data: newUser, error: insertErr } = await supabase
    .from('users')
    .insert({
      id:           auth_user_id,
      email:        normalizedEmail,
      display_name: display_name.trim(),
      is_admin:     flagInput.is_admin,
      is_dcs:       flagInput.is_dcs,
      is_epo:       flagInput.is_epo,
      is_dol:       flagInput.is_dol,
      is_ce:        flagInput.is_ce,
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
