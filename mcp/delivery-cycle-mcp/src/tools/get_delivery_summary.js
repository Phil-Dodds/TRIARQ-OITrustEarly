// get_delivery_summary.js — Pathways OI Trust
// Delivery Cycle Tracking hub summary tool (D-171–D-176).
//
// Returns pre-aggregated summary data for three dashboard views:
//   workstream_summaries — WIP counts, exceeded flags, gate counts per workstream (D-174)
//   gate_summaries       — upcoming/overdue counts per gate type (D-173)
//   division_summaries   — active cycle counts per division (D-176)
//
// Optional param: division_ids (string[]) — filter to specific divisions.
// Access control: phil/admin see all divisions; others restricted to their memberships.
// JWT validation fires in middleware before this tool runs (D-93, D-144).

'use strict';

const { supabase } = require('../db');
const {
  NEXT_GATE_BY_STAGE,
  WIP_CATEGORY_BY_STAGE,
  WIP_LIMIT,
  ALL_GATES
} = require('../lifecycle');

async function get_delivery_summary(params, caller_id) {
  const { division_ids: requested_division_ids } = params;

  // ── Resolve caller role ─────────────────────────────────────────────────────
  const { data: callerData, error: callerError } = await supabase
    .from('users')
    .select('system_role')
    .eq('id', caller_id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single();

  if (callerError || !callerData) {
    return { success: false, error: 'Could not verify caller role.' };
  }

  const isPrivileged =
    callerData.system_role === 'phil' || callerData.system_role === 'admin';

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
  // Active = not COMPLETE, not CANCELLED, not soft-deleted (D-174: ON_HOLD is included)
  let cycleQuery = supabase
    .from('delivery_cycles')
    .select(`
      delivery_cycle_id,
      division_id,
      workstream_id,
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
        data: { workstream_summaries: [], gate_summaries: buildEmptyGateSummary(), division_summaries: [] }
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

  for (const ws of (workstreams ?? [])) {
    const homeDivName = ws.home_division?.division_name ?? '';
    workstreamMap.set(ws.workstream_id, {
      workstream_id:          ws.workstream_id,
      workstream_name:        ws.workstream_name,
      home_division_id:       ws.home_division_id,
      home_division_name:     homeDivName,
      active_status:          ws.active_status,
      total_active_cycles:    0,
      wip_prep:               0,
      wip_build:              0,
      wip_outcome:            0,
      wip_prep_exceeded:      false,
      wip_build_exceeded:     false,
      wip_outcome_exceeded:   false,
      cycles_by_next_gate:    buildEmptyGateCountMap()
    });
  }

  // Bucket for cycles with no workstream assigned (D-165: optional at creation)
  workstreamMap.set(UNASSIGNED_KEY, {
    workstream_id:          null,
    workstream_name:        '(No workstream assigned)',
    home_division_id:       null,
    home_division_name:     '',
    active_status:          true,
    total_active_cycles:    0,
    wip_prep:               0,
    wip_build:              0,
    wip_outcome:            0,
    wip_prep_exceeded:      false,
    wip_build_exceeded:     false,
    wip_outcome_exceeded:   false,
    cycles_by_next_gate:    buildEmptyGateCountMap()
  });

  for (const cycle of (cycles ?? [])) {
    const wsKey = cycle.workstream_id ?? UNASSIGNED_KEY;
    const entry = workstreamMap.get(wsKey);
    if (!entry) { continue; } // unknown workstream — skip

    entry.total_active_cycles++;

    const wipCat  = WIP_CATEGORY_BY_STAGE[cycle.current_lifecycle_stage];
    if (wipCat === 'prep')    { entry.wip_prep++;    }
    if (wipCat === 'build')   { entry.wip_build++;   }
    if (wipCat === 'outcome') { entry.wip_outcome++; }

    const nextGate = NEXT_GATE_BY_STAGE[cycle.current_lifecycle_stage] ?? 'none';
    if (nextGate in entry.cycles_by_next_gate) {
      entry.cycles_by_next_gate[nextGate]++;
    }
  }

  // Mark exceeded flags; convert map to array (only entries with cycles or real workstreams)
  const workstream_summaries = [];
  for (const [key, entry] of workstreamMap) {
    entry.wip_prep_exceeded    = entry.wip_prep    > WIP_LIMIT;
    entry.wip_build_exceeded   = entry.wip_build   > WIP_LIMIT;
    entry.wip_outcome_exceeded = entry.wip_outcome > WIP_LIMIT;

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

  // ── Build gate summary (D-173) ────────────────────────────────────────────
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

  return {
    success: true,
    data: {
      workstream_summaries,
      gate_summaries,
      division_summaries
    }
  };
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
