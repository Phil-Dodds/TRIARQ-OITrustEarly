// list_delivery_cycles.js
// Pathways OI Trust — delivery-cycle-mcp
// Returns Delivery Cycles visible to the authenticated user, filtered by Division access.
// Optional filters: division_id, lifecycle_stage, workstream_id, tier_classification.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} [params.division_id]
 * @param {string} [params.lifecycle_stage]
 * @param {string} [params.workstream_id]
 * @param {string} [params.tier_classification]
 * @param {string} caller_user_id - from JWT
 */
async function list_delivery_cycles(params, caller_user_id) {
  const { division_id, lifecycle_stage, workstream_id, tier_classification } = params;

  // ── Resolve accessible division IDs for this user ─────────────────────────
  // User can see cycles in Divisions where they have an active membership.
  const { data: memberships, error: memberErr } = await supabase
    .from('division_memberships')
    .select('division_id')
    .eq('user_id', caller_user_id)
    .is('revoked_at', null)
    .is('deleted_at', null);

  if (memberErr) {
    return { success: false, error: `Failed to resolve Division access: ${memberErr.message}` };
  }

  // Admin and Phil have access to all cycles regardless of direct membership.
  const { data: caller } = await supabase
    .from('users')
    .select('system_role')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  const isPrivileged = caller && ['admin', 'phil'].includes(caller.system_role);

  let query = supabase
    .from('delivery_cycles')
    .select(`
      delivery_cycle_id,
      cycle_title,
      division_id,
      workstream_id,
      tier_classification,
      current_lifecycle_stage,
      outcome_statement,
      cycle_owner_user_id,
      jira_epic_key,
      created_at,
      updated_at
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Apply Division access filter unless privileged role
  if (!isPrivileged) {
    const accessible_ids = (memberships || []).map(m => m.division_id);
    if (accessible_ids.length === 0) {
      return { success: true, data: [] };
    }
    query = query.in('division_id', accessible_ids);
  }

  // Apply optional filters
  if (division_id) {
    query = query.eq('division_id', division_id);
  }
  if (lifecycle_stage) {
    query = query.eq('current_lifecycle_stage', lifecycle_stage);
  }
  if (workstream_id) {
    query = query.eq('workstream_id', workstream_id);
  }
  if (tier_classification) {
    query = query.eq('tier_classification', tier_classification);
  }

  const { data: cycles, error } = await query;

  if (error) {
    return { success: false, error: `Failed to list Delivery Cycles: ${error.message}` };
  }

  return { success: true, data: cycles || [] };
}

module.exports = { list_delivery_cycles };
