// set_maintenance_mode.js
// Admin-only tool to enable or disable maintenance mode (D-MaintenanceMode, AC-29).
//
// Rescued 2026-07-30 from an orphaned Build C worktree; completed in Contract 42.
// The rescued file claimed "Admin role only" in its header but carried no admin
// check — the gate below was added here, matching the pattern in
// clear_division_status_config.js / update_division.js.
//
// Auth: division-mcp applies validateJwt globally (src/index.js), so a valid JWT
// is guaranteed before this runs. Admin is enforced per-tool.
//
// Operator note (D-636): there is deliberately NO admin UI for this toggle.
// Maintenance mode suppresses routing and attempts no auth, so an in-app control
// could enable the state and could never clear it. The operator in
// build-c-spec.md §9 is Code or Phil at a terminal.
//
// Params:
//   enabled:  boolean (required)
//   message?: string  (optional — shown on the maintenance screen when enabled)
//
// Updates: maintenance_mode, maintenance_message, updated_at, updated_by

'use strict';

const { supabase } = require('../db');

/**
 * Enable or disable maintenance mode.
 * @param {{ enabled: boolean, message?: string }} params
 * @param {string} caller_user_id
 */
async function set_maintenance_mode(params, caller_user_id) {
  const { enabled, message } = params;

  if (typeof enabled !== 'boolean') {
    return { success: false, error: 'enabled (boolean) is required.' };
  }

  // ── Admin gate (D-635) ────────────────────────────────────────────────────
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
      error: 'Setting maintenance mode requires Admin role. Your current role does not have this permission.'
    };
  }

  // ── Update the single config row ──────────────────────────────────────────
  // system_config holds exactly one row (migration 095 seeds it guarded). The
  // update is unfiltered by design — there is no id to key on and a second row
  // would already have made the flag nondeterministic on read.
  const { data, error } = await supabase
    .from('system_config')
    .update({
      maintenance_mode:    enabled,
      maintenance_message: message ?? null,
      updated_at:          new Date().toISOString(),
      updated_by:          caller_user_id
    })
    .select('maintenance_mode, maintenance_message, updated_at, updated_by');

  if (error) {
    return { success: false, error: `Failed to update system_config: ${error.message}` };
  }
  if (!data || data.length === 0) {
    return {
      success: false,
      error: 'No system_config row found. Maintenance mode cannot be set until the config row exists.'
    };
  }

  return {
    success: true,
    data: {
      maintenance_mode:    data[0].maintenance_mode,
      maintenance_message: data[0].maintenance_message,
      updated_at:          data[0].updated_at,
      updated_by:          data[0].updated_by
    }
  };
}

module.exports = { set_maintenance_mode };
