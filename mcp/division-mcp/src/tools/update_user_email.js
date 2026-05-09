// update_user_email.js
// Updates a user's email address.
// Admin-only. Email change is admin-only by D-169 (no self-service email edit).
//
// B-92 (Contract 14 + 15): public.users update is fully independent of the
// auth-account update. The auth path is best-effort — any failure is logged
// to the console and the public.users update still runs.
//   1. Attempt auth.users update if a Supabase Auth row exists for user_id
//      (errors here are logged, not surfaced — except duplicate-email which
//      is a hard failure)
//   2. Always run public.users update — this is the source of truth for the UI
//
// Duplicate handling: surfaces a normalized error so the UI can render
// "That email address is already in use." (D-200 Pattern 3).

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.user_id   - public.users.id (= Supabase auth UUID)
 * @param {string} params.new_email - new email to set
 * @param {string} caller_user_id
 */
async function update_user_email(params, caller_user_id) {
  const { user_id, new_email } = params;

  if (!user_id)   return { success: false, error: 'user_id is required.' };
  if (!new_email) return { success: false, error: 'new_email is required.' };

  const normalizedEmail = String(new_email).trim().toLowerCase();
  // Minimal email shape check — Supabase will reject malformed addresses too.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: 'Enter a valid email address.' };
  }

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
      error: 'Updating user email requires Admin role. Your current role does not have this permission.'
    };
  }

  // Verify target user exists
  const { data: target, error: targetErr } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', user_id)
    .is('deleted_at', null)
    .single();

  if (targetErr || !target) {
    return { success: false, error: 'User not found.' };
  }

  // No-op short-circuit
  if (target.email === normalizedEmail) {
    return { success: true, data: target };
  }

  // Pre-check public.users for a duplicate. Saves a Supabase Auth round-trip
  // when the duplicate is in our own user table.
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .is('deleted_at', null)
    .neq('id', user_id)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: 'That email address is already in use.' };
  }

  // B-92 (Contract 15): the auth lookup + update is best-effort and fully
  // isolated from the public.users update below. Any throw or error here is
  // swallowed — the only hard failure surfaced is the duplicate-email case.
  // Seeded users with no auth row OR with a mismatched UUID still succeed.
  let authUpdateAttempted = false;
  try {
    const { data: authLookup, error: lookupErr } =
      await supabase.auth.admin.getUserById(user_id);
    const hasAuthAccount = !lookupErr && !!authLookup?.user;

    if (hasAuthAccount) {
      authUpdateAttempted = true;
      const { error: authErr } = await supabase.auth.admin.updateUserById(user_id, {
        email: normalizedEmail
      });

      if (authErr) {
        const msg = authErr.message ?? '';
        if (/already.*registered/i.test(msg) || /email.*exist/i.test(msg) || /duplicate/i.test(msg)) {
          return { success: false, error: 'That email address is already in use.' };
        }
        // Non-duplicate auth error — log and continue to public.users update.
        console.warn(`[update_user_email] auth update failed for ${user_id}: ${msg}`);
      }
    }
  } catch (e) {
    // Auth API threw (network, SDK shape change, or seeded-user lookup edge).
    // public.users update below still runs.
    console.warn(`[update_user_email] auth lookup/update threw for ${user_id}:`, e?.message || e);
  }

  // Always run public.users update — source of truth for the UI.
  const { data: updated, error: updateErr } = await supabase
    .from('users')
    .update({ email: normalizedEmail })
    .eq('id', user_id)
    .select()
    .single();

  if (updateErr) {
    // PostgREST surfaces "JSON object requested, multiple (or no) rows" when
    // RLS or a wrong UUID returns zero rows — translate to a user-readable
    // message instead of leaking the raw PostgREST string.
    const raw = updateErr.message || '';
    if (/multiple.*rows/i.test(raw) || /no.*rows/i.test(raw) || /0 rows/i.test(raw)) {
      return { success: false, error: 'User record could not be updated.' };
    }
    return { success: false, error: `Could not update user record: ${raw}` };
  }

  // Suppress unused-warning on authUpdateAttempted — kept for future telemetry.
  void authUpdateAttempted;

  return { success: true, data: updated };
}

module.exports = { update_user_email };
