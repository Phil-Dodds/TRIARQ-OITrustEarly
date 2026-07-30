// set_maintenance_mode.js
// Admin-only tool to enable or disable maintenance mode.
// JWT required — Admin role only.
//
// Params:
//   enabled:  boolean (required)
//   message?: string  (optional — shown on maintenance screen when enabled)
//
// Updates: maintenance_mode, maintenance_message, updated_at, updated_by (user_id)

'use strict';

const { supabase } = require('../db');

/**
 * @param {{ enabled: boolean, message?: string }} params
 * @param {string} caller_user_id
 */
async function set_maintenance_mode(params, caller_user_id) {
  const { enabled, message } = params;

  if (typeof enabled !== 'boolean') {
    return { success: false, error: 'enabled (boolean) is required.' };
  }

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
