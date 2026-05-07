// update_user_email.js
// Updates a user's email address in both Supabase Auth and public.users (D-354 §5).
// Admin-only. Email change is admin-only by D-169 (no self-service email edit).
//
// Two-step write:
//   1. supabase.auth.admin.updateUserById(user_id, { email: new_email })
//   2. UPDATE public.users SET email = new_email WHERE id = user_id
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

  // Update Supabase Auth first — single source of truth for credentials.
  const { error: authErr } = await supabase.auth.admin.updateUserById(user_id, {
    email: normalizedEmail
  });

  if (authErr) {
    const msg = authErr.message ?? '';
    if (/already.*registered/i.test(msg) || /email.*exist/i.test(msg) || /duplicate/i.test(msg)) {
      return { success: false, error: 'That email address is already in use.' };
    }
    return { success: false, error: `Could not update email: ${msg}` };
  }

  // Mirror into public.users so the rest of the app sees the new email.
  const { data: updated, error: updateErr } = await supabase
    .from('users')
    .update({ email: normalizedEmail })
    .eq('id', user_id)
    .select()
    .single();

  if (updateErr) {
    // Auth has been updated but public.users failed — surface the error so the
    // admin can retry. Auth-side update is idempotent on retry.
    return {
      success: false,
      error: `Email updated in Auth but failed to sync to user record: ${updateErr.message}`
    };
  }

  return { success: true, data: updated };
}

module.exports = { update_user_email };
