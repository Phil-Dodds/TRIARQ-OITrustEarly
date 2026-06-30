// clear_division_status_config.js
// Pathways OI Trust — Contract 32 (Initiative Status Updates)
// Deletes the LOCAL cadence config for one Division. Admin-only.
// Governing decisions: D-480, D-481 (parent configs unaffected), D-183 (two-step
// confirmation handled in the UI; this tool executes the committed delete).
//
// Hard delete is intentional and correct here: division_status_config is a
// mutable settings row (one per Division, not a historical record). "Clearing"
// the cycle means there is no local config — the row must be absent so D-481
// inheritance falls through to the parent. Soft-delete (Arch-6) governs
// historical/business records; a transient settings row is not one. Recorded
// as CC-32 deviation.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.division_id
 * @param {string} caller_user_id
 */
async function clear_division_status_config(params, caller_user_id) {
  const { division_id } = params;

  if (!division_id) {
    return { success: false, error: 'division_id is required.' };
  }

  // ── Admin gate (matches update_division.js) ───────────────────────────────
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (caller.is_active !== true) {
    return { success: false, error: 'Your account is inactive.' };
  }
  if (caller.is_admin !== true) {
    return {
      success: false,
      error: 'Clearing an Initiative update cycle requires Admin role. Your current role does not have this permission.'
    };
  }

  // ── Delete the local row only (parent configs untouched) ──────────────────
  const { data: deleted, error: delErr } = await supabase
    .from('division_status_config')
    .delete()
    .eq('division_id', division_id)
    .select();

  if (delErr) {
    return { success: false, error: `Failed to clear update cycle: ${delErr.message}` };
  }
  if (!deleted || deleted.length === 0) {
    return { success: false, error: 'No local update cycle configuration exists for this Division.' };
  }

  return { success: true, data: { division_id, cleared: true } };
}

module.exports = { clear_division_status_config };
