// get_maintenance_mode.js
// Returns the current maintenance mode flag and optional message.
//
// NO JWT REQUIRED — Angular reads system_config directly from Supabase on bootstrap
// (D-MaintenanceMode; the one deliberate exception to D-93).
// This MCP tool is registered as a public GET endpoint (/maintenance-mode) in index.js
// so it can also be polled without auth if needed during deployment.
//
// Returns: { maintenance_mode: boolean, maintenance_message: string | null }

'use strict';

const { supabase } = require('../db');

async function get_maintenance_mode() {
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
