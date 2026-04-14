// get_user_invite_statuses.js
// Returns invite status for all users by querying the Supabase Auth admin API.
// Admin-only. Used by the User Admin screen to display Invited / Active / Expired badges.
//
// Status logic (D-248):
//   active  — email_confirmed_at is set (user has set password and logged in)
//   invited — invited_at is set, email_confirmed_at is null, invite < 24h old
//   expired — invited_at is set, email_confirmed_at is null, invite >= 24h old

'use strict';

const { supabase } = require('../db');

// Supabase default invite token expiry: 24 hours.
const INVITE_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {object} params - (no parameters required)
 * @param {string} caller_user_id
 * @returns {{ success: boolean, data?: Array<{ user_id: string, invite_status: string }> }}
 */
async function get_user_invite_statuses(params, caller_user_id) {
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
    return {
      success: false,
      error: 'Viewing invite statuses requires Admin role.'
    };
  }

  try {
    // Fetch all auth users (paginated — default page size is 50; increase for large installs).
    const { data: authUsers, error: listErr } = await supabase.auth.admin.listUsers({
      perPage: 1000,
      page:    1
    });

    if (listErr) {
      return { success: false, error: `Failed to fetch auth users: ${listErr.message}` };
    }

    const now = Date.now();

    const statuses = (authUsers?.users ?? []).map(authUser => {
      let invite_status = 'invited'; // default

      if (authUser.email_confirmed_at) {
        invite_status = 'active';
      } else if (authUser.invited_at) {
        const invitedAt = new Date(authUser.invited_at).getTime();
        invite_status = (now - invitedAt) >= INVITE_EXPIRY_MS ? 'expired' : 'invited';
      }

      return {
        user_id:       authUser.id,
        invite_status: invite_status
      };
    });

    return { success: true, data: statuses };
  } catch (err) {
    return { success: false, error: 'Failed to retrieve invite statuses.' };
  }
}

module.exports = { get_user_invite_statuses };
