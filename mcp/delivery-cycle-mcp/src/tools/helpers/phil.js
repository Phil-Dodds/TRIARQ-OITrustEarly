// phil.js
// Pathways OI Trust — delivery-cycle-mcp shared helper (Contract 29).
//
// Phil identification. Contract 29 WS3/WS4 need to resolve "Phil" as the
// gate super-approver (D-465) and the always-on recipient of post-approval
// decline emails (D-466). The spec mandates: do NOT hardcode a UUID — resolve
// Phil at runtime.
//
// CC-decision (CC-29-5): Phil = the single row in public.users where
//   is_super_admin = true. Migration 033 (CC-19-06 option B) set is_super_admin
//   = true on Phil's row only ("1× is_super_admin = true (phil's row only)")
//   and migration 034 dropped the legacy system_role column. is_super_admin is
//   therefore the canonical, non-hardcoded Phil identifier. is_admin is NOT
//   sufficient — multiple users may be admins; only Phil is super-admin.

'use strict';

const { supabase } = require('../../db');

/**
 * Resolve Phil's user record (the super-admin). Returns { id, display_name,
 * email } or null if no super-admin row exists (defensive — should never
 * happen in a seeded environment).
 *
 * @returns {Promise<{id: string, display_name: string, email: string}|null>}
 */
async function getPhil() {
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, email')
    .eq('is_super_admin', true)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (error || !data) { return null; }
  return data;
}

/**
 * Convenience — Phil's user_id only, or null.
 * @returns {Promise<string|null>}
 */
async function getPhilUserId() {
  const phil = await getPhil();
  return phil ? phil.id : null;
}

/**
 * True iff the caller is Phil (the super-admin). Used by the Phil-only gate
 * approver config tools to avoid duplicating the is_super_admin check.
 * @param {string} caller_user_id
 * @returns {Promise<boolean>}
 */
async function isPhil(caller_user_id) {
  const { data: caller } = await supabase
    .from('users')
    .select('is_super_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  return caller?.is_super_admin === true;
}

module.exports = { getPhil, getPhilUserId, isPhil };
