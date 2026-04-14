// resend_invite.js
// Resends a Supabase Auth invite to a user whose invite is Invited or Expired.
// Supabase invalidates the prior invite link and issues a new one.
// Admin-only (D-248).

'use strict';

const { supabase } = require('../db');

const INVITE_REDIRECT_URL =
  process.env.APP_PASSWORD_SET_URL ||
  'https://phil-dodds.github.io/TRIARQ-OITrustEarly/auth/set-password';

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

  // Check the auth account status — do not resend to already-confirmed users
  const { data: authUser, error: authLookupErr } = await supabase.auth.admin.getUserById(user_id);

  if (authLookupErr || !authUser?.user) {
    return { success: false, error: 'Could not retrieve auth account. Please try again.' };
  }

  if (authUser.user.email_confirmed_at) {
    return {
      success: false,
      error: 'This user has already confirmed their email and set a password. Invite cannot be resent.'
    };
  }

  // Resend invite — Supabase invalidates the prior link and issues a new one.
  const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
    targetUser.email,
    { redirectTo: INVITE_REDIRECT_URL }
  );

  if (inviteErr) {
    return { success: false, error: `Could not send invitation. Please try again.` };
  }

  return {
    success: true,
    message: `Invitation resent to ${targetUser.email}.`
  };
}

module.exports = { resend_invite };
