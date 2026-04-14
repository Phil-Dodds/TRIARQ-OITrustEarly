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
        // B-21 fix: Trust scope should return all workstreams under the Trust ancestor
        // of the cycle's division. The previous implementation fetched ALL divisions
        // with division_level=1 across the system — if division_level is not consistently
        // populated, this returned empty. New approach: if scope_division_id is provided,
        // walk UP the hierarchy to find the root division (parent_division_id IS NULL),
        // then return all workstreams under that root. If no scope_division_id provided,
        // fall back to all root-level divisions. Source: D-206, Contract 9.
        let trustRootIds;

        if (scope_division_id) {
          // Walk up from the cycle's division to find the hierarchy root.
          const rootId = await findHierarchyRoot(scope_division_id);
          trustRootIds = rootId ? [rootId] : [scope_division_id];
        } else {
          // No division context — return workstreams from all root divisions (no parent).
          const { data: rootNodes } = await supabase
            .from('divisions')
            .select('id')
            .is('parent_division_id', null)
            .is('deleted_at', null);
          trustRootIds = (rootNodes || []).map(n => n.id);
        }

        if (trustRootIds.length === 0) {
          return { success: true, data: [] };
        }

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
      display_name_short,
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
    display_name_short:  w.display_name_short ?? null, // D-203: null = fallback to workstream_name in UI
    home_division_name:  divisionMap[w.home_division_id] ?? null,
    lead_display_name:   w.workstream_lead_user_id ? (leadMap[w.workstream_lead_user_id] ?? null) : null,
    active_cycle_count:  cycleCountMap[w.workstream_id] ?? 0
  }));

  return { success: true, data: enriched };
}

/**
 * B-21 fix: Walk up the division hierarchy from startId to find the root
 * (first division with parent_division_id IS NULL). Returns the root ID.
 * Guards against cycles (max 20 levels). Source: Contract 9.
 */
async function findHierarchyRoot(startId) {
  let currentId = startId;
  for (let depth = 0; depth < 20; depth++) {
    const { data: div } = await supabase
      .from('divisions')
      .select('id, parent_division_id')
      .eq('id', currentId)
      .is('deleted_at', null)
      .single();
    if (!div) { return currentId; } // not found — return what we have
    if (!div.parent_division_id) { return div.id; } // this IS the root
    currentId = div.parent_division_id;
  }
  return currentId; // safety fallback
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
