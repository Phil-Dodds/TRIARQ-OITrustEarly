// list_delivery_workstreams.js
// Pathways OI Trust — delivery-cycle-mcp
// Returns Workstreams visible to the authenticated user.
// Optional filters: home_division_id, active_status.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} [params.home_division_id]
 * @param {boolean} [params.active_status]
 * @param {string} caller_user_id - from JWT
 */
async function list_delivery_workstreams(params, caller_user_id) {
  const { home_division_id, active_status } = params;

  let query = supabase
    .from('delivery_workstreams')
    .select(`
      workstream_id,
      workstream_name,
      home_division_id,
      workstream_lead_user_id,
      active_status,
      created_at,
      updated_at
    `)
    .is('deleted_at', null)
    .order('workstream_name', { ascending: true });

  if (home_division_id) {
    query = query.eq('home_division_id', home_division_id);
  }

  if (typeof active_status === 'boolean') {
    query = query.eq('active_status', active_status);
  }

  const { data: workstreams, error } = await query;

  if (error) {
    return { success: false, error: `Failed to list Workstreams: ${error.message}` };
  }

  return { success: true, data: workstreams || [] };
}

module.exports = { list_delivery_workstreams };
