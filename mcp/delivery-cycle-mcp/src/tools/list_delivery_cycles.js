// list_delivery_cycles.js
// Pathways OI Trust — delivery-cycle-mcp
// Returns Delivery Cycles visible to the authenticated user, filtered by Division access.
//
// Optional filters:
//   division_id             — filter to a specific Division
//   include_child_divisions — when true + division_id set, expand to include child Divisions (D-166)
//   lifecycle_stage         — filter by current stage
//   workstream_id           — filter by specific workstream
//   filter_no_workstream    — when true, return only cycles with no workstream assigned (D-167)
//   tier_classification     — filter by tier
//
// D-165: workstream_id may be null on cycles created without a workstream assignment.
// D-166: division filter supports child division inheritance via include_child_divisions flag.
// D-167: filter_no_workstream surfaces cycles awaiting workstream assignment.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string}  [params.division_id]
 * @param {boolean} [params.include_child_divisions]
 * @param {string}  [params.lifecycle_stage]
 * @param {string}  [params.workstream_id]
 * @param {boolean} [params.filter_no_workstream]
 * @param {string}  [params.tier_classification]
 * @param {string} caller_user_id - from JWT
 */
async function list_delivery_cycles(params, caller_user_id) {
  const {
    division_id,
    include_child_divisions,
    lifecycle_stage,
    workstream_id,
    filter_no_workstream,
    tier_classification
  } = params;

  // ── Resolve accessible division IDs for this user ─────────────────────────
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
      assigned_ds_user_id,
      assigned_cb_user_id,
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

  // Apply division_id filter (D-166)
  if (division_id) {
    if (include_child_divisions) {
      // Expand to include child divisions of the selected division
      const divisionIds = new Set([division_id]);
      await collectDescendants([division_id], divisionIds);
      query = query.in('division_id', Array.from(divisionIds));
    } else {
      query = query.eq('division_id', division_id);
    }
  }

  // Apply lifecycle stage filter
  if (lifecycle_stage) {
    query = query.eq('current_lifecycle_stage', lifecycle_stage);
  }

  // Apply workstream filters (D-165, D-167)
  // filter_no_workstream takes precedence over workstream_id
  if (filter_no_workstream) {
    query = query.is('workstream_id', null);
  } else if (workstream_id) {
    query = query.eq('workstream_id', workstream_id);
  }

  // Apply tier filter
  if (tier_classification) {
    query = query.eq('tier_classification', tier_classification);
  }

  const { data: cycles, error } = await query;

  if (error) {
    return { success: false, error: `Failed to list Delivery Cycles: ${error.message}` };
  }

  if (!cycles || cycles.length === 0) {
    return { success: true, data: [] };
  }

  // ── Resolve DS / CB display names (migration 024 columns) ────────────────
  // Collect all unique user IDs that need display names (DS + CB across all cycles).
  const userIdSet = new Set();
  cycles.forEach(c => {
    if (c.assigned_ds_user_id) { userIdSet.add(c.assigned_ds_user_id); }
    if (c.assigned_cb_user_id) { userIdSet.add(c.assigned_cb_user_id); }
  });

  let userMap = {};
  if (userIdSet.size > 0) {
    const { data: userRows } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', Array.from(userIdSet))
      .is('deleted_at', null);
    if (userRows) {
      userRows.forEach(u => { userMap[u.id] = u.display_name; });
    }
  }

  const enriched = cycles.map(c => ({
    ...c,
    assigned_ds_display_name: c.assigned_ds_user_id ? (userMap[c.assigned_ds_user_id] ?? null) : null,
    assigned_cb_display_name: c.assigned_cb_user_id ? (userMap[c.assigned_cb_user_id] ?? null) : null
  }));

  return { success: true, data: enriched };
}

/**
 * Recursively collects all descendant Division IDs into the accumulator set.
 * Mirrors the pattern in division-mcp get_user_divisions (D-135).
 */
async function collectDescendants(parentIds, accumulator) {
  if (parentIds.length === 0) return;

  const { data: children } = await supabase
    .from('divisions')
    .select('id')
    .in('parent_division_id', parentIds)
    .is('deleted_at', null);

  if (!children || children.length === 0) return;

  const newIds = children.map(c => c.id).filter(id => !accumulator.has(id));
  newIds.forEach(id => accumulator.add(id));

  await collectDescendants(newIds, accumulator);
}

module.exports = { list_delivery_cycles };
