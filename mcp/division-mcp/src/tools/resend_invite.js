// resend_invite.js
// Resends a Supabase Auth invite to a user whose invite is Invited or Expired.
// Supabase invalidates the prior invite link and issues a new one.
// Admin-only (D-248).

'use strict';

const { supabase } = require('../db');

// D-354: invite email contains a 6-digit OTP, not a magic link. redirectTo is
// unused by the OTP template but Supabase requires it — point at the app root.
const INVITE_REDIRECT_URL =
  process.env.APP_INVITE_REDIRECT_URL ||
  process.env.APP_PASSWORD_SET_URL ||
  'https://phil-dodds.github.io/TRIARQ-OITrustEarly/login';

/**
 * @param {object} params
 * @param {string} params.user_id - public.users.id (= Supabase auth UUID)
 * @param {string} caller_user_id
 */
async function resend_invite(params, caller_user_id) {
  const { user_id } = params;

  if (!user_id) return { success: false, error: 'user_id is required.' };

  // Verify caller is admin
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('system_role')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (caller.system_role !== 'admin' && caller.system_role !== 'phil') {
    return { success: false, error: 'Resending invites requires Admin role.' };
  }

  // Look up the target user
  const { data: targetUser, error: userErr } = await supabase
    .from('users')
    .select('id, email, is_active')
    .eq('id', user_id)
    .is('deleted_at', null)
    .single();

  if (userErr || !targetUser) {
    return { success: false, error: 'User not found.' };
  }
  if (!targetUser.is_active) {
    return { success: false, error: 'Cannot resend invite to an inactive user.' };
  }

  // B-91 (Contract 14 + 15): no auth-account pre-check. inviteUserByEmail
  // creates auth.users for seeded users and reissues the invite for existing
  // accounts. Wrapped in try/catch — supabase-js throws on certain admin
  // failures rather than returning {error}.
  let inviteErr = null;
  try {
    const result = await supabase.auth.admin.inviteUserByEmail(
      targetUser.email,
      { redirectTo: INVITE_REDIRECT_URL }
    );
    inviteErr = result?.error ?? null;
  } catch (e) {
    inviteErr = e;
  }

  if (inviteErr) {
    const msg = inviteErr.message ?? String(inviteErr);
    // Rate limit — friendlier message per Contract 15 §1.1.
    if (/rate.*limit/i.test(msg) || /too.*many/i.test(msg)) {
      return {
        success: false,
        error: 'Invite rate limit reached — please try again shortly.'
      };
    }
    // "User already registered" can fire when an auth row already exists with
    // the email but under a different UUID — treat as already-active.
    if (/already.*registered/i.test(msg) || /already.*confirmed/i.test(msg)) {
      return {
        success: false,
        error: 'This email is already registered. Ask the user to sign in instead.'
      };
    }
    return { success: false, error: 'Could not send invitation. Please try again.' };
  }

  return {
    success: true,
    message: `Invitation sent to ${targetUser.email}.`
  };
}

module.exports = { resend_invite };
