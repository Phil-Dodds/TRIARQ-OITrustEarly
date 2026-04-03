// get_cycle_event_log.js
// Pathways OI Trust — delivery-cycle-mcp
// Returns the append-only event log for a Delivery Cycle,
// ordered by created_at ascending (chronological).
// Source: D-125, build-c-spec Section 4.1

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} caller_user_id - from JWT
 */
async function get_cycle_event_log(params, caller_user_id) {
  const { delivery_cycle_id } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  // Verify cycle exists and caller has access
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, division_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // Verify caller has division access (admin/phil bypass)
  const { data: caller } = await supabase
    .from('users')
    .select('system_role')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  const isPrivileged = caller && ['admin', 'phil'].includes(caller.system_role);

  if (!isPrivileged) {
    const { data: membership } = await supabase
      .from('division_memberships')
      .select('division_id')
      .eq('user_id', caller_user_id)
      .eq('division_id', cycle.division_id)
      .is('revoked_at', null)
      .is('deleted_at', null)
      .single();

    if (!membership) {
      return {
        success: false,
        error: 'Access denied: you do not have access to this cycle\'s Division.'
      };
    }
  }

  // Fetch event log — append-only table, no deleted_at filter needed
  const { data: events, error: logErr } = await supabase
    .from('cycle_event_log')
    .select(`
      event_id,
      delivery_cycle_id,
      event_type,
      event_description,
      actor_user_id,
      event_metadata,
      created_at
    `)
    .eq('delivery_cycle_id', delivery_cycle_id)
    .order('created_at', { ascending: true });

  if (logErr) {
    return { success: false, error: `Failed to retrieve event log: ${logErr.message}` };
  }

  return { success: true, data: events || [] };
}

module.exports = { get_cycle_event_log };
