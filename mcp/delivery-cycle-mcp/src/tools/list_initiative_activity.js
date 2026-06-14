// list_initiative_activity.js
// Pathways OI Trust — delivery-cycle-mcp
// Returns cycle_event_log entries visible to the caller, filtered by Division access.
// Powers /initiatives/activity (D-428), the My Activity home card (D-429),
// and the Initiative Activity zone on the User View panel (D-429, Admin only).
//
// Division scope mirrors list_delivery_cycles — Admin sees all, others see own
// Divisions only. When division_ids is supplied, MCP intersects it with viewer
// scope so callers cannot widen access via params.
//
// `count_only: true` returns { total_count } only — used by the hub card 8
// async headline ("N events in the last 7 days") so the headline does not pay
// the cost of fetching rows it will not render.
//
// Pagination is cursor-based: pass `before_cursor` set to the oldest loaded
// row's created_at to load the next page. has_more derived by fetching limit+1
// and slicing.
//
// Source: D-428, D-429, Contract 23 Section H Items 5 + 6.

'use strict';

const { supabase } = require('../db');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT     = 100;

/**
 * @param {object} params
 * @param {string[]} [params.division_ids]   — filter to specific divisions; null/empty = viewer's scope
 * @param {string}   [params.actor_user_id]  — filter to a specific actor
 * @param {string[]} [params.event_types]    — filter to specific event_type values
 * @param {string}   [params.after]          — timestamptz; lower bound inclusive
 * @param {string}   [params.before_cursor]  — timestamptz; upper bound exclusive (pagination)
 * @param {number}   [params.limit]          — default 50, max 100
 * @param {boolean}  [params.count_only]     — when true, returns { total_count } only
 * @param {string}   caller_user_id          — from JWT (middleware)
 */
async function list_initiative_activity(params, caller_user_id) {
  const {
    division_ids,
    actor_user_id,
    event_types,
    after,
    before_cursor,
    limit = DEFAULT_LIMIT,
    count_only = false
  } = params || {};

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  // ── Resolve caller's privilege ────────────────────────────────────────────
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .maybeSingle();

  const isPrivileged = caller?.is_admin === true;

  // ── Resolve viewer's accessible Division IDs ─────────────────────────────
  let viewerScope = null; // null = unrestricted (admin)
  if (!isPrivileged) {
    const { data: memberships, error: memberErr } = await supabase
      .from('division_memberships')
      .select('division_id')
      .eq('user_id', caller_user_id)
      .is('revoked_at', null)
      .is('deleted_at', null);
    if (memberErr) {
      return { success: false, error: `Failed to resolve Division access: ${memberErr.message}` };
    }
    viewerScope = (memberships || []).map(m => m.division_id);
  }

  // Combine viewer scope with optional division_ids filter
  let effectiveDivisionIds = null; // null = no restriction (admin without filter)
  if (Array.isArray(division_ids) && division_ids.length > 0) {
    if (viewerScope === null) {
      effectiveDivisionIds = division_ids.slice();
    } else {
      effectiveDivisionIds = division_ids.filter(id => viewerScope.includes(id));
    }
  } else if (viewerScope !== null) {
    effectiveDivisionIds = viewerScope.slice();
  }

  // Zero accessible divisions → empty result, short-circuit.
  if (effectiveDivisionIds !== null && effectiveDivisionIds.length === 0) {
    return count_only
      ? { success: true, data: { total_count: 0 } }
      : { success: true, data: { events: [], total_count: 0, has_more: false } };
  }

  // ── Resolve cycle IDs in the effective Division scope ────────────────────
  // cycle_event_log carries delivery_cycle_id; restricting on cycle_id is the
  // simplest way to enforce Division access through Supabase JS without raw SQL
  // joins. Same batched pattern used by list_delivery_cycles.
  let cycleIds = null; // null = all cycles (admin without filter)
  if (effectiveDivisionIds !== null) {
    const { data: cycleRows, error: cycleErr } = await supabase
      .from('delivery_cycles')
      .select('delivery_cycle_id')
      .in('division_id', effectiveDivisionIds)
      .is('deleted_at', null);
    if (cycleErr) {
      return { success: false, error: `Failed to resolve scope cycles: ${cycleErr.message}` };
    }
    cycleIds = (cycleRows || []).map(c => c.delivery_cycle_id);
    if (cycleIds.length === 0) {
      return count_only
        ? { success: true, data: { total_count: 0 } }
        : { success: true, data: { events: [], total_count: 0, has_more: false } };
    }
  }

  // ── Filter chain — applied identically to count and row queries ──────────
  function applyFilters(q) {
    if (cycleIds !== null) {
      q = q.in('delivery_cycle_id', cycleIds);
    }
    if (actor_user_id) {
      q = q.eq('actor_user_id', actor_user_id);
    }
    if (Array.isArray(event_types) && event_types.length > 0) {
      q = q.in('event_type', event_types);
    }
    if (after) {
      q = q.gte('created_at', after);
    }
    if (before_cursor) {
      q = q.lt('created_at', before_cursor);
    }
    return q;
  }

  // ── Count query ──────────────────────────────────────────────────────────
  const { count, error: countErr } = await applyFilters(
    supabase.from('cycle_event_log').select('event_id', { count: 'exact', head: true })
  );
  if (countErr) {
    return { success: false, error: `Failed to count activity: ${countErr.message}` };
  }

  if (count_only) {
    return { success: true, data: { total_count: count ?? 0 } };
  }

  // ── Data query (limit + 1 to detect has_more) ────────────────────────────
  const { data: rows, error: rowsErr } = await applyFilters(
    supabase.from('cycle_event_log').select('*').order('created_at', { ascending: false }).limit(safeLimit + 1)
  );
  if (rowsErr) {
    return { success: false, error: `Failed to list activity: ${rowsErr.message}` };
  }

  const has_more = (rows || []).length > safeLimit;
  const visible  = (rows || []).slice(0, safeLimit);

  if (visible.length === 0) {
    return { success: true, data: { events: [], total_count: count ?? 0, has_more: false } };
  }

  // ── Enrich with display names (batched, same pattern as list_delivery_cycles) ─
  const actorIds   = new Set();
  const cycleIdSet = new Set();
  visible.forEach(e => {
    if (e.actor_user_id)     { actorIds.add(e.actor_user_id); }
    if (e.delivery_cycle_id) { cycleIdSet.add(e.delivery_cycle_id); }
  });

  const userMap = {};
  if (actorIds.size > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', Array.from(actorIds))
      .is('deleted_at', null);
    (users || []).forEach(u => { userMap[u.id] = u.display_name; });
  }

  const cycleMap        = {};
  const divisionShortMap = {};
  if (cycleIdSet.size > 0) {
    // Phil 2026-06-14 follow-on: every activity row must display its Initiative
    // name. Drop the deleted_at filter on the enrichment lookup so soft-deleted
    // Initiative titles still resolve. Division access scope was already
    // enforced upstream via the cycleIds resolution (which DOES exclude deleted
    // cycles for non-admin), so this only widens enrichment, not visibility.
    const { data: cycles } = await supabase
      .from('delivery_cycles')
      .select('delivery_cycle_id, cycle_title, division_id')
      .in('delivery_cycle_id', Array.from(cycleIdSet));
    (cycles || []).forEach(c => { cycleMap[c.delivery_cycle_id] = c; });

    const divIds = new Set();
    Object.values(cycleMap).forEach(c => { if (c.division_id) { divIds.add(c.division_id); } });
    if (divIds.size > 0) {
      const { data: divisions } = await supabase
        .from('divisions')
        .select('id, display_name_short, division_name')
        .in('id', Array.from(divIds))
        .is('deleted_at', null);
      (divisions || []).forEach(d => {
        divisionShortMap[d.id] = d.display_name_short || d.division_name;
      });
    }
  }

  const events = visible.map(e => {
    const cycle = cycleMap[e.delivery_cycle_id] || null;
    return {
      event_id:            e.event_id,
      event_type:          e.event_type,
      event_description:   e.event_description,
      created_at:          e.created_at,
      actor_user_id:       e.actor_user_id || null,
      actor_display_name:  e.actor_user_id ? (userMap[e.actor_user_id] ?? null) : null,
      delivery_cycle_id:   e.delivery_cycle_id,
      initiative_title:    cycle ? cycle.cycle_title : null,
      division_id:         cycle ? cycle.division_id : null,
      division_short_name: cycle && cycle.division_id ? (divisionShortMap[cycle.division_id] ?? null) : null
    };
  });

  return {
    success: true,
    data: {
      events,
      total_count: count ?? 0,
      has_more
    }
  };
}

module.exports = { list_initiative_activity };
