// trigger_status_refresh.js — Contract 32 (WS3)
// On-demand invocation of the overdue-refresh scheduled function (D-482).
// Any authenticated user. Returns the last-run timestamp + count processed.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} _params - none
 * @param {string} caller_user_id - from JWT
 */
async function trigger_status_refresh(_params, caller_user_id) {
  const { data, error } = await supabase.rpc('refresh_initiative_status_overdue');
  if (error) {
    return { success: false, error: `Status refresh failed: ${error.message}` };
  }

  // system_config is a single-row table; read back the timestamp the function set.
  const { data: cfg } = await supabase
    .from('system_config')
    .select('status_refresh_last_run')
    .limit(1)
    .single();

  const processed = typeof data === 'number' ? data : (Number(data) || 0);
  return {
    success: true,
    data: {
      last_run: cfg?.status_refresh_last_run ?? null,
      initiatives_processed: processed
    }
  };
}

module.exports = { trigger_status_refresh };
