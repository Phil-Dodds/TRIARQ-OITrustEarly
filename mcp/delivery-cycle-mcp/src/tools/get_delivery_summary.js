// get_delivery_summary.js — Pathways OI Trust
// Delivery Cycle Tracking hub summary tool (D-171–D-176).
//
// Returns pre-aggregated summary data for four dashboard views:
//   workstream_summaries — WIP zone counts + gate counts per workstream (D-190)
//   epo_summaries        — WIP zone counts + alerts per EPO (D-397, Contract 20)
//   gate_summaries       — upcoming/overdue counts per gate type (D-189)
//   division_summaries   — active cycle counts per division (D-176)
//
// Contract 20 (D-400, CC-20-04): per-workstream WIP exceeded flags removed.
// WIP discipline is now EPO-scoped via epo_wip_limits — Workstream Summary
// view shows zone counts only, no over-limit alerts. epo_summaries carries
// the over-limit flags now, using each EPO's row from epo_wip_limits or
// 3/3/3 default when no row exists.
//
// Removed from workstream_summaries:
//   wip_pre_build_limit, wip_build_limit, wip_post_deploy_limit
//   wip_pre_build_exceeded, wip_build_exceeded, wip_post_deploy_exceeded
// Preserved in workstream_summaries: wip_pre_build, wip_build, wip_post_deploy.
//
// Added (Contract 20 Session 2): epo_summaries array — one row per EPO with
//   at least one active Initiative in scope, with three zone counts + limits
//   + exceeded flags + total_active_cycles. Drives EpoSummaryComponent.
//
// Optional param: division_ids (string[]) — filter to specific divisions.
// Access control: phil/admin see all divisions; others restricted to their memberships.
// JWT validation fires in middleware before this tool runs (D-93, D-144).

'use strict';

const { supabase } = require('../db');
const {
  NEXT_GATE_BY_STAGE,
  WIP_CATEGORY_BY_STAGE,
  WIP_LIMIT_PRE_BUILD,
  WIP_LIMIT_BUILD,
  WIP_LIMIT_POST_DEPLOY,
  ALL_GATES
} = require('../lifecycle');

async function get_delivery_summary(params, caller_id) {
  const { division_ids: requested_division_ids } = params;

  // ── Resolve caller (Admin bypass — Contract 19 D-394, CC-19-01) ────────────
  const { data: callerData, error: callerError } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single();

  if (callerError || !callerData) {
    return { success: false, error: 'Could not verify caller role.' };
  }

  const isPrivileged = callerData.is_admin === true;

  // ── Resolve accessible division IDs ────────────────────────────────────────
  // null = all accessible (no filter). Array = restricted set.
  let accessibleDivisionIds = null;

  if (!isPrivileged) {
    const { data: memberships, error: memberError } = await supabase
      .from('division_memberships')
      .select('division_id')
      .eq('user_id', caller_id)
      .is('revoked_at', null)
      .is('deleted_at', null);

    if (memberError) {
      return { success: false, error: 'Could not load division memberships.' };
    }
    accessibleDivisionIds = (memberships ?? []).map(m => m.division_id);
  }

  // Intersect optional client filter with accessible set
  let effectiveDivisionIds = null;
  if (requested_division_ids && Array.isArray(requested_division_ids) && requested_division_ids.length > 0) {
    effectiveDivisionIds = accessibleDivisionIds
      ? requested_division_ids.filter(id => accessibleDivisionIds.includes(id))
      : requested_division_ids;
  } else {
    effectiveDivisionIds = accessibleDivisionIds; // null if privileged (all), or member list
  }

  // ── Load active delivery cycles ─────────────────────────────────────────────
  // Active = not COMPLETE, not CANCELLED, not soft-deleted (D-190: ON_HOLD is included)
  // Contract 20 Session 2: assigned_epo_user_id added for epo_summaries.
  let cycleQuery = supabase
    .from('delivery_cycles')
    .select(`
      delivery_cycle_id,
      division_id,
      workstream_id,
      assigned_epo_user_id,
      current_lifecycle_stage,
      milestone_dates:cycle_milestone_dates(gate_name, target_date, actual_date)
    `)
    .not('current_lifecycle_stage', 'in', '("COMPLETE","CANCELLED")')
    .is('deleted_at', null);

  if (effectiveDivisionIds !== null) {
    if (effectiveDivisionIds.length === 0) {
      // No accessible divisions — return empty summary
      return {
        success: true,
        data: {
          workstream_summaries: [],
          epo_summaries:        [],
          gate_summaries:       buildEmptyGateSummary(),
          division_summaries:   []
        }
      };
    }
    cycleQuery = cycleQuery.in('division_id', effectiveDivisionIds);
  }

  const { data: cycles, error: cycleError } = await cycleQuery;
  if (cycleError) {
    return { success: false, error: 'Could not load delivery cycles.' };
  }

  // ── Load workstreams ────────────────────────────────────────────────────────
  const { data: workstreams, error: wsError } = await supabase
    .from('delivery_workstreams')
    .select(`
      workstream_id,
      workstream_name,
      home_division_id,
      active_status,
      home_division:divisions!home_division_id(division_name)
    `)
    .is('deleted_at', null);

  if (wsError) {
    return { success: false, error: 'Could not load workstreams.' };
  }

  // ── Load divisions ──────────────────────────────────────────────────────────
  let divQuery = supabase
    .from('divisions')
    .select('id, division_name, division_level, parent_division_id')
    .is('deleted_at', null)
    .order('division_level', { ascending: true })
    .order('division_name', { ascending: true });

  if (effectiveDivisionIds !== null) {
    divQuery = divQuery.in('id', effectiveDivisionIds);
  }

  const { data: divisions, error: divError } = await divQuery;
  if (divError) {
    return { success: false, error: 'Could not load divisions.' };
  }

  // ── Date constants for upcoming/overdue classification ────────────────────
  const today   = new Date().toISOString().slice(0, 10);
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  // ── Build workstream summary ──────────────────────────────────────────────
  const UNASSIGNED_KEY = '__none__';
  const workstreamMap  = new Map();

  function newWorkstreamRow(ws) {
    return {
      workstream_id:           ws?.workstream_id ?? null,
      workstream_name:         ws?.workstream_name ?? '(No workstream assigned)',
      home_division_id:        ws?.home_division_id ?? null,
      home_division_name:      ws?.home_division?.division_name ?? '',
      active_status:           ws ? ws.active_status : true,
      total_active_cycles:     0,
      // D-400 / CC-20-04: zone counts only. Limits and exceeded flags moved
      // to EPO scope via epo_wip_limits — no per-workstream alerts.
      wip_pre_build:           0,
      wip_build:               0,
      wip_post_deploy:         0,
      cycles_by_next_gate:     buildEmptyGateCountMap()
    };
  }

  for (const ws of (workstreams ?? [])) {
    workstreamMap.set(ws.workstream_id, newWorkstreamRow(ws));
  }

  // Bucket for cycles with no workstream assigned (D-165: optional at creation).
  workstreamMap.set(UNASSIGNED_KEY, newWorkstreamRow(null));

  for (const cycle of (cycles ?? [])) {
    const wsKey = cycle.workstream_id ?? UNASSIGNED_KEY;
    const entry = workstreamMap.get(wsKey);
    if (!entry) { continue; } // unknown workstream — skip

    entry.total_active_cycles++;

    const wipCat = WIP_CATEGORY_BY_STAGE[cycle.current_lifecycle_stage];
    if (wipCat === 'pre_build')   { entry.wip_pre_build++;   }
    if (wipCat === 'build')       { entry.wip_build++;       }
    if (wipCat === 'post_deploy') { entry.wip_post_deploy++; }

    const nextGate = NEXT_GATE_BY_STAGE[cycle.current_lifecycle_stage] ?? 'none';
    if (nextGate in entry.cycles_by_next_gate) {
      entry.cycles_by_next_gate[nextGate]++;
    }
  }

  // D-400 / CC-20-04: per-workstream "exceeded" calculation removed. WIP
  // discipline lives on the EPO, not the Workstream. Workstream Summary view
  // shows zone counts only.
  const workstream_summaries = [];
  for (const [key, entry] of workstreamMap) {
    // Include real workstreams always; include unassigned bucket only when it has cycles
    if (key !== UNASSIGNED_KEY || entry.total_active_cycles > 0) {
      workstream_summaries.push(entry);
    }
  }

  // Sort: most active cycles first, then alphabetical by name
  workstream_summaries.sort((a, b) =>
    b.total_active_cycles - a.total_active_cycles ||
    a.workstream_name.localeCompare(b.workstream_name)
  );

  // ── Build gate summary (D-189) ────────────────────────────────────────────
  const gateSummaryMap = {};
  for (const gate of ALL_GATES) {
    gateSummaryMap[gate] = {
      gate_name:           gate,
      total_pending_count: 0,
      upcoming_count:      0,
      overdue_count:       0
    };
  }

  for (const cycle of (cycles ?? [])) {
    const nextGate = NEXT_GATE_BY_STAGE[cycle.current_lifecycle_stage];
    if (!nextGate) { continue; }

    gateSummaryMap[nextGate].total_pending_count++;

    // Check milestone target date for upcoming/overdue classification
    const milestone = (cycle.milestone_dates ?? []).find(m => m.gate_name === nextGate);
    if (!milestone?.target_date || milestone.actual_date) { continue; }

    if (milestone.target_date < today) {
      gateSummaryMap[nextGate].overdue_count++;
    } else if (milestone.target_date <= in7Days) {
      gateSummaryMap[nextGate].upcoming_count++;
    }
  }

  const gate_summaries = ALL_GATES.map(g => gateSummaryMap[g]);

  // ── Build division summary (D-176) ───────────────────────────────────────
  const divisionCycleCounts = new Map();
  for (const cycle of (cycles ?? [])) {
    const divId = cycle.division_id;
    divisionCycleCounts.set(divId, (divisionCycleCounts.get(divId) ?? 0) + 1);
  }

  const division_summaries = (divisions ?? []).map(div => ({
    division_id:         div.id,
    division_name:       div.division_name,
    division_level:      div.division_level,
    parent_division_id:  div.parent_division_id,
    active_cycle_count:  divisionCycleCounts.get(div.id) ?? 0
  }));

  // ── Build EPO summary (D-397, Contract 20 Session 2) ────────────────────
  // Group active cycles by assigned_epo_user_id and aggregate per-zone counts.
  // Each summary row includes the EPO's WIP limits (from epo_wip_limits, with
  // 3/3/3 default for missing rows) and the boolean exceeded flag per zone.
  // Cycles with assigned_epo_user_id = null are excluded — they appear only in
  // the workstream_summaries 'No EPO assigned' lens (not built this contract).
  const epo_summaries = await buildEpoSummaries(cycles ?? []);

  return {
    success: true,
    data: {
      workstream_summaries,
      epo_summaries,
      gate_summaries,
      division_summaries
    }
  };
}

/**
 * Aggregate active cycles by EPO and join to epo_wip_limits for limit data.
 * Returns an array of { user_id, display_name, total_active_cycles,
 *   wip_pre_build, wip_build, wip_post_deploy,
 *   wip_pre_build_limit, wip_build_limit, wip_post_deploy_limit,
 *   wip_pre_build_exceeded, wip_build_exceeded, wip_post_deploy_exceeded }
 * sorted by total_active_cycles desc, then display_name asc.
 */
async function buildEpoSummaries(cycles) {
  const epoMap = new Map();

  for (const cycle of cycles) {
    const epoId = cycle.assigned_epo_user_id;
    if (!epoId) { continue; }

    let entry = epoMap.get(epoId);
    if (!entry) {
      entry = {
        user_id:                  epoId,
        display_name:             '',
        total_active_cycles:      0,
        wip_pre_build:            0,
        wip_build:                0,
        wip_post_deploy:          0,
        wip_pre_build_limit:      WIP_LIMIT_PRE_BUILD,
        wip_build_limit:          WIP_LIMIT_BUILD,
        wip_post_deploy_limit:    WIP_LIMIT_POST_DEPLOY,
        wip_pre_build_exceeded:   false,
        wip_build_exceeded:       false,
        wip_post_deploy_exceeded: false
      };
      epoMap.set(epoId, entry);
    }

    entry.total_active_cycles++;
    const zone = WIP_CATEGORY_BY_STAGE[cycle.current_lifecycle_stage];
    if (zone === 'pre_build')   { entry.wip_pre_build++;   }
    if (zone === 'build')       { entry.wip_build++;       }
    if (zone === 'post_deploy') { entry.wip_post_deploy++; }
  }

  if (epoMap.size === 0) {
    return [];
  }

  // Resolve display names + WIP limits.
  const epoIds = Array.from(epoMap.keys());

  const { data: epoUsers } = await supabase
    .from('users')
    .select('id, display_name')
    .in('id', epoIds)
    .is('deleted_at', null);

  for (const u of (epoUsers || [])) {
    const entry = epoMap.get(u.id);
    if (entry) { entry.display_name = u.display_name; }
  }

  const { data: limitRows } = await supabase
    .from('epo_wip_limits')
    .select('user_id, pre_build_limit, build_limit, post_deploy_limit')
    .in('user_id', epoIds);

  for (const row of (limitRows || [])) {
    const entry = epoMap.get(row.user_id);
    if (entry) {
      entry.wip_pre_build_limit   = row.pre_build_limit;
      entry.wip_build_limit       = row.build_limit;
      entry.wip_post_deploy_limit = row.post_deploy_limit;
    }
  }

  // Compute exceeded flags after limits resolved (count >= limit).
  for (const entry of epoMap.values()) {
    entry.wip_pre_build_exceeded   = entry.wip_pre_build   >= entry.wip_pre_build_limit;
    entry.wip_build_exceeded       = entry.wip_build       >= entry.wip_build_limit;
    entry.wip_post_deploy_exceeded = entry.wip_post_deploy >= entry.wip_post_deploy_limit;
  }

  const result = Array.from(epoMap.values());
  result.sort((a, b) =>
    b.total_active_cycles - a.total_active_cycles ||
    (a.display_name || '').localeCompare(b.display_name || '')
  );
  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildEmptyGateSummary() {
  return ALL_GATES.map(g => ({
    gate_name:           g,
    total_pending_count: 0,
    upcoming_count:      0,
    overdue_count:       0
  }));
}

function buildEmptyGateCountMap() {
  const map = { none: 0 };
  for (const gate of ALL_GATES) { map[gate] = 0; }
  return map;
}

module.exports = { get_delivery_summary };
