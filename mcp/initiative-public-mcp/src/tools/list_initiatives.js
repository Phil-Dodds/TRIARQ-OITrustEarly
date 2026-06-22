// list_initiatives.js
// Pathways OI Trust — initiative-public-mcp (Contract 31, D-473).
//
// Returns all Initiatives the caller can see. Phase 1: all Divisions (scope_type
// 'all'). Batched-resolve pattern (mirrors delivery-cycle-mcp list_delivery_cycles):
// fetch delivery_cycles, then resolve names/relations via separate .in() queries.
// Output is explicitly shaped — NO raw UUIDs, emails, or security fields leak
// (Pre-Plan Instruction 5). Every field is whitelisted below.

'use strict';

const { stageLabel, deriveNextGate } = require('../helpers/format-helpers');

/**
 * @param {object} supabase - service-role client
 * @param {object} [filters]
 * @param {string} [filters.division_name]   - partial, case-insensitive
 * @param {string} [filters.workstream_name] - partial, case-insensitive
 * @param {string|string[]} [filters.lifecycle_stage] - exact on current_lifecycle_stage
 * @param {string} [filters.tier]            - tier_1 | tier_2 | tier_3
 * @param {string} [filters.gate_status]     - filters on next gate's status
 * @param {string} [filters.next_gate]       - raw gate name the Initiative is waiting on
 * @param {object} [scope] - { scope_type, division_ids } from api-key auth
 * @returns {Promise<Array<object>>}
 */
async function listInitiatives(supabase, filters = {}, scope = { scope_type: 'all', division_ids: [] }) {
  let query = supabase
    .from('delivery_cycles')
    .select(`
      delivery_cycle_id, cycle_title, division_id, workstream_id,
      tier_classification, current_lifecycle_stage, outcome_statement,
      assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id,
      jira_epic_key, created_at
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Phase 2 hook: Division-scoped keys. Phase 1 keys are scope_type 'all'.
  if (scope?.scope_type === 'divisions' && Array.isArray(scope.division_ids) && scope.division_ids.length) {
    query = query.in('division_id', scope.division_ids);
  }

  // Cheap exact filters pushed to SQL.
  if (filters.tier) { query = query.eq('tier_classification', filters.tier); }
  if (filters.lifecycle_stage) {
    query = Array.isArray(filters.lifecycle_stage)
      ? query.in('current_lifecycle_stage', filters.lifecycle_stage)
      : query.eq('current_lifecycle_stage', filters.lifecycle_stage);
  }

  const { data: cycles, error } = await query;
  if (error) { throw new Error(`Failed to list Initiatives: ${error.message}`); }
  if (!cycles || cycles.length === 0) { return []; }

  const cycleIds = cycles.map(c => c.delivery_cycle_id);

  // ── Batch-resolve relations ──────────────────────────────────────────────
  const userIds = new Set();
  const divisionIds = new Set();
  const workstreamIds = new Set();
  for (const c of cycles) {
    if (c.assigned_dcs_user_id) { userIds.add(c.assigned_dcs_user_id); }
    if (c.assigned_epo_user_id) { userIds.add(c.assigned_epo_user_id); }
    if (c.assigned_dol_user_id) { userIds.add(c.assigned_dol_user_id); }
    if (c.division_id)   { divisionIds.add(c.division_id); }
    if (c.workstream_id) { workstreamIds.add(c.workstream_id); }
  }

  const userMap = new Map();
  if (userIds.size) {
    const { data } = await supabase.from('users')
      .select('id, display_name').in('id', [...userIds]).is('deleted_at', null);
    (data || []).forEach(u => userMap.set(u.id, u.display_name));
  }

  const divisionMap = new Map();
  if (divisionIds.size) {
    const { data } = await supabase.from('divisions')
      .select('id, division_name, display_name_short').in('id', [...divisionIds]).is('deleted_at', null);
    (data || []).forEach(d => divisionMap.set(d.id, d));
  }

  const workstreamMap = new Map();
  if (workstreamIds.size) {
    const { data } = await supabase.from('delivery_workstreams')
      .select('workstream_id, workstream_name, display_name_short').in('workstream_id', [...workstreamIds]).is('deleted_at', null);
    (data || []).forEach(w => workstreamMap.set(w.workstream_id, w));
  }

  const milestoneMap = new Map();
  {
    const { data } = await supabase.from('cycle_milestone_dates')
      .select('delivery_cycle_id, gate_name, target_date').in('delivery_cycle_id', cycleIds).is('deleted_at', null);
    (data || []).forEach(m => {
      const b = milestoneMap.get(m.delivery_cycle_id) || []; b.push(m); milestoneMap.set(m.delivery_cycle_id, b);
    });
  }

  const gateMap = new Map();
  {
    const { data } = await supabase.from('gate_records')
      .select('delivery_cycle_id, gate_name, gate_status').in('delivery_cycle_id', cycleIds).is('deleted_at', null);
    (data || []).forEach(g => {
      const b = gateMap.get(g.delivery_cycle_id) || []; b.push(g); gateMap.set(g.delivery_cycle_id, b);
    });
  }

  // ── Shape (whitelist only) + derive next gate ─────────────────────────────
  let shaped = cycles.map(c => {
    const div = divisionMap.get(c.division_id);
    const ws  = c.workstream_id ? workstreamMap.get(c.workstream_id) : null;
    const next = deriveNextGate(gateMap.get(c.delivery_cycle_id), milestoneMap.get(c.delivery_cycle_id));
    return {
      initiative_id:          c.delivery_cycle_id,
      initiative_title:       c.cycle_title,
      division_name:          div?.division_name ?? null,
      division_short_name:    div?.display_name_short ?? null,
      workstream_name:        ws?.workstream_name ?? null,
      workstream_short_name:  ws?.display_name_short ?? null,
      tier:                   c.tier_classification,
      current_stage:          stageLabel(c.current_lifecycle_stage),
      outcome_statement:      c.outcome_statement ?? null,
      dcs_name:               c.assigned_dcs_user_id ? (userMap.get(c.assigned_dcs_user_id) ?? null) : null,
      epo_name:               c.assigned_epo_user_id ? (userMap.get(c.assigned_epo_user_id) ?? null) : null,
      dol_name:               c.assigned_dol_user_id ? (userMap.get(c.assigned_dol_user_id) ?? null) : null,
      jira_epic_key:          c.jira_epic_key ?? null,
      next_gate_name:         next?.label ?? null,
      next_gate_target_date:  next?.target_date ?? null,
      next_gate_status:       next?.status ?? null,
      created_at:             c.created_at,
      // internal-only — used for the JS filters below, stripped before return
      _next_gate_raw:         next?.name ?? null
    };
  });

  // ── JS filters (name partial-match + next-gate filters) ───────────────────
  const ci = (hay, needle) => (hay || '').toLowerCase().includes(needle.toLowerCase());
  if (filters.division_name)   { shaped = shaped.filter(r => ci(r.division_name, filters.division_name) || ci(r.division_short_name, filters.division_name)); }
  if (filters.workstream_name) { shaped = shaped.filter(r => ci(r.workstream_name, filters.workstream_name) || ci(r.workstream_short_name, filters.workstream_name)); }
  if (filters.next_gate)       { shaped = shaped.filter(r => r._next_gate_raw === filters.next_gate); }
  if (filters.gate_status)     { shaped = shaped.filter(r => r.next_gate_status === filters.gate_status); }

  return shaped.map(({ _next_gate_raw, ...rest }) => rest);
}

module.exports = { listInitiatives };
