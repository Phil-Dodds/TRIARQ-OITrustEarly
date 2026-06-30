// get_status_refresh_last_run.js — Contract 32 (WS3)
// Returns system_config.status_refresh_last_run for the My Initiative Status
// header ("Status last calculated: …"), read on load WITHOUT re-running the
// heavy refresh function (D-484).
//
// CC-32: not in the spec's tool list, but D-484 requires displaying the
// timestamp on load and Angular cannot read system_config directly (D-93; the
// maintenance_mode direct-read exception does not extend here). A lightweight
// read tool is the MCP-compliant way to surface it. Recorded as a CC-decision.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} _params - none
 * @param {string} caller_user_id - from JWT
 */
async function get_status_refresh_last_run(_params, caller_user_id) {
  const { data, error } = await supabase
    .from('system_config')
    .select('status_refresh_last_run')
    .limit(1)
    .single();

  if (error) {
    return { success: false, error: `Failed to read last refresh time: ${error.message}` };
  }
  return { success: true, data: { last_run: data?.status_refresh_last_run ?? null } };
}

module.exports = { get_status_refresh_last_run };
