// list_delivery_workstreams.js
// Pathways OI Trust — delivery-cycle-mcp
// Returns Workstreams visible to the authenticated user.
//
// Scope model (CC-002 Workstream Picker Design Session 2026-04-04):
//   scope_type = 'division_tree'  — Workstreams homed in the specified division and its descendants
//   scope_type = 'trust'          — All Workstreams under the Trust (division_level = 1)
//   scope_type = 'user_divisions' — Workstreams homed in any Division the caller is a member of
//   scope_type = 'all'            — All Workstreams regardless of Division (admin/Phil only)
//   (omitted)                     — Falls through to legacy home_division_id / active_status behaviour
//
// Division name and lead display name are always included when available.
// active_cycle_count is a subquery count of non-deleted, non-cancelled, non-complete cycles.
//
// Inactive Workstreams are excluded by default unless include_inactive = true.
// Home Division ID filter (legacy param) is still supported when scope params are absent.
//
// Source: CC-002, D-165, ARCH-23

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string}  [params.scope_type]        — 'division_tree' | 'trust' | 'user_divisions' | 'all'
 * @param {string}  [params.scope_division_id] — Required when scope_type = 'division_tree'
 * @param {boolean} [params.include_inactive]  — When true, includes inactive Workstreams (CC-002: off by default)
 * @param {string}  [params.home_division_id]  — Legacy filter; used when scope params absent
 * @param {boolean} [params.active_status]     — Legacy active filter; used when scope params absent
 * @param {string} caller_user_id - from JWT
 */
async function list_delivery_workstreams(params, caller_user_id) {
  const {
    scope_type,
    scope_division_id,
    include_inactive,
    home_division_id,
    active_status
  } = params;

  // ── Resolve caller role (needed for 'all' scope guard) ────────────────────
  const { data: caller } = await supabase
    .from('users')
    .select('system_role')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  const isPrivileged = caller && ['admin', 'phil'].includes(caller.system_role);

  // ── Resolve which Division IDs to filter on ───────────────────────────────
  let divisionIdFilter = null; // null = no division filter applied

  if (scope_type) {
    switch (scope_type) {

      case 'division_tree': {
        if (!scope_division_id) {
          return { success: false, error: 'scope_division_id is required when scope_type is division_tree.' };
        }
        const ids = new Set([scope_division_id]);
        await collectDescendants([scope_division_id], ids);
        divisionIdFilter = Array.from(ids);
        break;
      }

      case 'trust': {
        // Trust = all Divisions under a Trust node (division_level = 1).
        // Fetch all division IDs (the Trust itself + all descendants).
        const { data: trustNodes } = await supabase
          .from('divisions')
          .select('id')
          .eq('division_level', 1)
          .is('deleted_at', null);

        if (!trustNodes || trustNodes.length === 0) {
          return { success: true, data: [] };
        }

        const trustRootIds = trustNodes.map(n => n.id);
        const allIds = new Set(trustRootIds);
        await collectDescendants(trustRootIds, allIds);
        divisionIdFilter = Array.from(allIds);
        break;
      }

      case 'user_divisions': {
        const { data: memberships, error: memberErr } = await supabase
          .from('division_memberships')
          .select('division_id')
          .eq('user_id', caller_user_id)
          .is('revoked_at', null)
          .is('deleted_at', null);

        if (memberErr) {
          return { success: false, error: `Failed to resolve user Division memberships: ${memberErr.message}` };
        }

        divisionIdFilter = (memberships || []).map(m => m.division_id);
        if (divisionIdFilter.length === 0) {
          return { success: true, data: [] };
        }
        break;
      }

      case 'all': {
        if (!isPrivileged) {
          return {
            success: false,
            error: 'Scope "all" requires Admin or Phil role. Use scope_type "trust" or "user_divisions" instead.'
          };
        }
        // divisionIdFilter stays null — no filter applied
        break;
      }

      default:
        return { success: false, error: `Unknown scope_type: ${scope_type}. Valid values: division_tree, trust, user_divisions, all.` };
    }
  } else if (home_division_id) {
    // Legacy single-division filter
    divisionIdFilter = [home_division_id];
  }

  // ── Build query ───────────────────────────────────────────────────────────
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

  if (divisionIdFilter !== null) {
    query = query.in('home_division_id', divisionIdFilter);
  }

  // Active status filter:
  // Scope mode: exclude inactive by default unless include_inactive = true
  // Legacy mode: honour explicit active_status boolean param
  if (scope_type) {
    if (!include_inactive) {
      query = query.eq('active_status', true);
    }
    // If include_inactive = true, no active_status filter — return all
  } else if (typeof active_status === 'boolean') {
    query = query.eq('active_status', active_status);
  }

  const { data: workstreams, error } = await query;

  if (error) {
    return { success: false, error: `Failed to list Workstreams: ${error.message}` };
  }

  if (!workstreams || workstreams.length === 0) {
    return { success: true, data: [] };
  }

  // ── Resolve division names ────────────────────────────────────────────────
  const divisionIdSet = new Set(workstreams.map(w => w.home_division_id).filter(Boolean));
  const divisionMap = {};

  if (divisionIdSet.size > 0) {
    const { data: divRows } = await supabase
      .from('divisions')
      .select('id, division_name')
      .in('id', Array.from(divisionIdSet))
      .is('deleted_at', null);

    if (divRows) {
      divRows.forEach(d => { divisionMap[d.id] = d.division_name; });
    }
  }

  // ── Resolve lead display names ─────────────────────────────────────────────
  const leadIdSet = new Set(workstreams.map(w => w.workstream_lead_user_id).filter(Boolean));
  const leadMap = {};

  if (leadIdSet.size > 0) {
    const { data: userRows } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', Array.from(leadIdSet))
      .is('deleted_at', null);

    if (userRows) {
      userRows.forEach(u => { leadMap[u.id] = u.display_name; });
    }
  }

  // ── Resolve active cycle counts ───────────────────────────────────────────
  // Count non-deleted cycles that are not in terminal stages (COMPLETE, CANCELLED).
  const workstreamIds = workstreams.map(w => w.workstream_id);
  const cycleCountMap = {};

  if (workstreamIds.length > 0) {
    const { data: cycleCounts } = await supabase
      .from('delivery_cycles')
      .select('workstream_id')
      .in('workstream_id', workstreamIds)
      .not('current_lifecycle_stage', 'in', '("COMPLETE","CANCELLED")')
      .is('deleted_at', null);

    if (cycleCounts) {
      cycleCounts.forEach(c => {
        cycleCountMap[c.workstream_id] = (cycleCountMap[c.workstream_id] || 0) + 1;
      });
    }
  }

  // ── Enrich and return ─────────────────────────────────────────────────────
  const enriched = workstreams.map(w => ({
    ...w,
    home_division_name:  divisionMap[w.home_division_id] ?? null,
    lead_display_name:   w.workstream_lead_user_id ? (leadMap[w.workstream_lead_user_id] ?? null) : null,
    active_cycle_count:  cycleCountMap[w.workstream_id] ?? 0
  }));

  return { success: true, data: enriched };
}

/**
 * Recursively collects all descendant Division IDs into the accumulator set.
 * Mirrors the pattern in list_delivery_cycles.js (D-166).
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

module.exports = { list_delivery_workstreams };
