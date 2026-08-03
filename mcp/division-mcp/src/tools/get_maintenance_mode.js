// get_maintenance_mode.js
// Returns the current maintenance mode flag and optional message.
//
// AUTH: JWT REQUIRED, ADMIN ONLY (D-635).
//
// The rescued Build C version of this file claimed "NO JWT REQUIRED" and
// described a public GET /maintenance-mode endpoint. That was corrected, not
// accommodated, in Contract 42. Reasoning: the one consumer that must work
// unauthenticated during a deploy is the Angular bootstrap, and it reads
// system_config directly from Supabase under the authorized Arch-1 exception.
// It does not call this tool. A public endpoint would therefore widen the
// attack surface without enabling anything. /health and /tools remain the only
// no-JWT exceptions in division-mcp.
//
// This tool exists so an admin (or Code, at a terminal, during the
// build-c-spec.md §9 deployment sequence) can confirm the current flag state
// without reading the database directly.
//
// Returns: { maintenance_mode: boolean, maintenance_message: string | null }

'use strict';

const { supabase } = require('../db');

/**
 * Read the current maintenance mode state.
 * @param {object} _params — none
 * @param {string} caller_user_id
 */
async function get_maintenance_mode(_params, caller_user_id) {
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
      error: 'Reading maintenance mode requires Admin role. Your current role does not have this permission.'
    };
  }

  const { data, error } = await supabase
    .from('system_config')
    .select('maintenance_mode, maintenance_message')
    .limit(1)
    .single();

  if (error) {
    return { success: false, error: `Failed to read system_config: ${error.message}` };
  }

  return {
    success: true,
    data: {
      maintenance_mode:    data.maintenance_mode,
      maintenance_message: data.maintenance_message ?? null
    }
  };
}

module.exports = { get_maintenance_mode };
