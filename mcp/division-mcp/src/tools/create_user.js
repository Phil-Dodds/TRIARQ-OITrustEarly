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
 * @param {object}    params
 * @param {string}    params.email
 * @param {string}    params.display_name
 * @param {boolean}  [params.is_admin]
 * @param {boolean}  [params.is_dcs]
 * @param {boolean}  [params.is_epo]
 * @param {boolean}  [params.is_dol]
 * @param {boolean}  [params.is_ce]
 * @param {string[]} [params.division_ids]  - Optional initial Division assignments (Contract 21).
 *                                            Inactive Divisions are skipped silently (S-032);
 *                                            their IDs come back in `skipped_division_ids`.
 * @param {string} caller_user_id
 */
async function create_user(params, caller_user_id) {
  const { email, display_name, division_ids } = params;

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

  // Check for an existing public.users row — INCLUDING soft-deleted rows.
  // A soft-deleted row (Arch-6) or an orphaned auth account (invite sent but
  // the users insert failed) previously stranded the email: invisible in
  // User Management yet rejected as "already has an active account".
  const normalizedEmail = email.toLowerCase().trim();
  const { data: existingRows } = await supabase
    .from('users')
    .select('id, deleted_at')
    .eq('email', normalizedEmail)
    .limit(1);
  const existing = existingRows?.[0] ?? null;

  if (existing && !existing.deleted_at) {
    return {
      success: false,
      error: `A user with email ${email} already exists.`
    };
  }

  let auth_user_id;
  let newUser;
  let recovery = null; // 'restored' | 'relinked' | null

  if (existing && existing.deleted_at) {
    // ── Restore path: soft-deleted row → reactivate in place. The auth account
    // still exists, so no invite is sent — the user signs in as before.
    const { data: restored, error: restoreErr } = await supabase
      .from('users')
      .update({
        deleted_at:   null,
        is_active:    true,
        display_name: display_name.trim(),
        is_admin:     flagInput.is_admin,
        is_dcs:       flagInput.is_dcs,
        is_epo:       flagInput.is_epo,
        is_dol:       flagInput.is_dol,
        is_ce:        flagInput.is_ce
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (restoreErr || !restored) {
      return { success: false, error: `Failed to restore the existing account: ${restoreErr?.message || 'unknown error'}` };
    }
    auth_user_id = existing.id;
    newUser  = restored;
    recovery = 'restored';
  } else {
    // ── Fresh path: send Supabase Auth invite (creates auth.users, emails OTP — D-354).
    const { data: authData, error: authErr } = await supabase.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        data:       { display_name },
        redirectTo: INVITE_REDIRECT_URL
      }
    );

    if (authErr && (/already.*registered/i.test(authErr.message) || /email.*exist/i.test(authErr.message))) {
      // Orphaned auth account: exists in auth.users with NO public.users row.
      // Relink — find the auth id and create the missing row. No invite email
      // fires (the account is already confirmed); the user signs in normally.
      const { data: authList, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const authUser = (authList?.users || []).find(u => (u.email || '').toLowerCase() === normalizedEmail);
      if (listErr || !authUser) {
        return {
          success: false,
          error: 'This email already has an auth account, but it could not be located to relink. Contact support.'
        };
      }
      auth_user_id = authUser.id;
      recovery = 'relinked';
    } else if (authErr) {
      return { success: false, error: `Failed to send invite email: ${authErr.message}` };
    } else {
      auth_user_id = authData.user.id;
    }

    // Insert public.users record with the Supabase auth UUID and the chosen role flags.
    const { data: inserted, error: insertErr } = await supabase
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
    newUser = inserted;
  }

  // Contract 21: optional Division assignments. Skip inactive Divisions
  // silently per S-032; surface the skipped IDs so the UI can render a
  // single combined toast if needed.
  let assigned_division_ids = [];
  let skipped_division_ids  = [];

  if (Array.isArray(division_ids) && division_ids.length > 0) {
    const { data: divisions, error: divErr } = await supabase
      .from('divisions')
      .select('id, active_status')
      .in('id', division_ids)
      .is('deleted_at', null);

    if (!divErr && divisions) {
      const activeIds = divisions
        .filter(d => d.active_status === true)
        .map(d => d.id);
      skipped_division_ids = division_ids.filter(id => !activeIds.includes(id));

      if (activeIds.length > 0) {
        const rows = activeIds.map(division_id => ({
          user_id:     auth_user_id,
          division_id,
          assigned_by: caller_user_id
        }));
        const { error: assignErr } = await supabase
          .from('division_memberships')
          .insert(rows);

        // Membership assignment is best-effort — user record already exists.
        // A failure here is logged via the response shape but does not roll back the user.
        if (!assignErr) {
          assigned_division_ids = activeIds;
        }
      }
    }
  }

  const message =
    recovery === 'restored'
      ? `Existing account for ${normalizedEmail} restored — no new invitation sent; they sign in as before.`
      : recovery === 'relinked'
        ? `Existing sign-in for ${normalizedEmail} relinked to a new user record — no new invitation sent.`
        : `User created and invitation sent to ${normalizedEmail}.`;

  return {
    success: true,
    data:    newUser,
    assigned_division_ids,
    skipped_division_ids,
    recovery,
    message
  };
}

module.exports = { create_user };
