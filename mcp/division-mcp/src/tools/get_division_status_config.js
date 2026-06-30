// get_division_status_config.js
// Pathways OI Trust — Contract 32 (Initiative Status Updates)
// Resolves the cadence config for a Division WITH inheritance (D-481).
// Any authenticated user. Read-only.
//
// Reuses the SQL function public.resolve_division_status_config(uuid) — the
// same upward parent-chain walk the scheduled function uses (migration 054).
// Single source of truth for the D-481 inheritance rule.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.division_id
 * @param {string} caller_user_id  (JWT-validated upstream; division access via RLS/MCP)
 * @returns {object} { success, data: { config, inherited, source_division_id, source_division_name } }
 *                   config is null + inherited false when no config exists in the chain.
 */
async function get_division_status_config(params, caller_user_id) {
  const { division_id } = params;

  if (!division_id) {
    return { success: false, error: 'division_id is required.' };
  }

  // Resolve via the shared upward-walk SQL function (D-481).
  const { data, error } = await supabase
    .rpc('resolve_division_status_config', { p_division_id: division_id });

  if (error) {
    return { success: false, error: `Failed to resolve update cycle: ${error.message}` };
  }

  // A non-SETOF composite function returns null (or an all-null row) when no
  // config exists anywhere in the chain.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.id) {
    return { success: true, data: { config: null, inherited: false } };
  }

  // Resolve the source Division name for the inheritance banner.
  const { data: sourceDiv } = await supabase
    .from('divisions')
    .select('id, division_name')
    .eq('id', row.division_id)
    .is('deleted_at', null)
    .single();

  return {
    success: true,
    data: {
      config:               row,
      inherited:            row.division_id !== division_id,
      source_division_id:   row.division_id,
      source_division_name: sourceDiv ? sourceDiv.division_name : null
    }
  };
}

module.exports = { get_division_status_config };
