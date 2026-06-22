// get_initiative.js
// Pathways OI Trust — initiative-public-mcp (Contract 31, D-473).
//
// Full record for a single Initiative: all list_initiatives fields plus
// updated_at, participant counts, milestones (5), gates (5, with consultation
// summary), and artifacts. Output is explicitly whitelisted — enforced
// exclusions per spec §WS3.4: no consulted_user_id, no approver_user_id UUID,
// no other_consulted_user_ids array, no deleted_at / created_by / assigned_*_user_id.

'use strict';

const {
  stageLabel, gateLabel, publicGateStatus, deriveNextGate, GATE_SEQUENCE
} = require('../helpers/format-helpers');

const bySequence = (a, b) => GATE_SEQUENCE.indexOf(a.gate_name) - GATE_SEQUENCE.indexOf(b.gate_name);

/**
 * @param {object} supabase - service-role client
 * @param {string} initiative_id - delivery_cycles.delivery_cycle_id
 * @param {object} [scope]
 * @returns {Promise<object|null>} null when not found / deleted (→ 404 at transport)
 */
async function getInitiative(supabase, initiative_id, _scope = { scope_type: 'all' }) {
  if (!initiative_id) { throw new Error('initiative_id is required'); }

  const { data: c, error } = await supabase
    .from('delivery_cycles')
    .select(`
      delivery_cycle_id, cycle_title, division_id, workstream_id,
      tier_classification, current_lifecycle_stage, outcome_statement,
      assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id,
      jira_epic_key, other_consulted_user_ids, other_informed_user_ids,
      created_at, updated_at
    `)
    .eq('delivery_cycle_id', initiative_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) { throw new Error(`Failed to fetch Initiative: ${error.message}`); }
  if (!c) { return null; }

  // ── Relations ─────────────────────────────────────────────────────────────
  const userIds = [c.assigned_dcs_user_id, c.assigned_epo_user_id, c.assigned_dol_user_id].filter(Boolean);

  const [divRes, wsRes, milestoneRes, gateRes, artRes] = await Promise.all([
    c.division_id
      ? supabase.from('divisions').select('division_name, display_name_short').eq('id', c.division_id).is('deleted_at', null).maybeSingle()
      : Promise.resolve({ data: null }),
    c.workstream_id
      ? supabase.from('delivery_workstreams').select('workstream_name, display_name_short').eq('workstream_id', c.workstream_id).is('deleted_at', null).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('cycle_milestone_dates').select('gate_name, target_date, actual_date, date_status').eq('delivery_cycle_id', initiative_id).is('deleted_at', null),
    supabase.from('gate_records').select('gate_record_id, gate_name, gate_status, approver_user_id, submitted_at, approver_decision_at, approver_notes').eq('delivery_cycle_id', initiative_id).is('deleted_at', null),
    supabase.from('cycle_artifacts').select('artifact_type_id, display_name, external_url, gate_affinity, pointer_status').eq('delivery_cycle_id', initiative_id).is('deleted_at', null)
  ]);

  const div = divRes.data;
  const ws  = wsRes.data;
  const milestones = milestoneRes.data || [];
  const gateRecords = gateRes.data || [];
  const artifacts = artRes.data || [];

  // Resolve approver display names (no UUIDs in output).
  const approverIds = [...new Set(gateRecords.map(g => g.approver_user_id).filter(Boolean))];
  const approverMap = new Map();
  if (approverIds.length) {
    const { data } = await supabase.from('users').select('id, display_name').in('id', approverIds).is('deleted_at', null);
    (data || []).forEach(u => approverMap.set(u.id, u.display_name));
  }

  // Resolve assigned trio display names.
  const userMap = new Map();
  if (userIds.length) {
    const { data } = await supabase.from('users').select('id, display_name').in('id', [...new Set(userIds)]).is('deleted_at', null);
    (data || []).forEach(u => userMap.set(u.id, u.display_name));
  }

  // Artifact type labels.
  const typeIds = [...new Set(artifacts.map(a => a.artifact_type_id).filter(Boolean))];
  const typeMap = new Map();
  if (typeIds.length) {
    const { data } = await supabase.from('cycle_artifact_types').select('artifact_type_id, artifact_type_name').in('artifact_type_id', typeIds);
    (data || []).forEach(t => typeMap.set(t.artifact_type_id, t.artifact_type_name));
  }

  // Consultation summary per gate_record (counts only — no individual identities).
  const gateRecordIds = gateRecords.map(g => g.gate_record_id);
  const consultByGate = new Map();
  if (gateRecordIds.length) {
    const { data: cons } = await supabase
      .from('gate_consultations')
      .select('gate_record_id, response')
      .in('gate_record_id', gateRecordIds);
    for (const row of (cons || [])) {
      const s = consultByGate.get(row.gate_record_id) ||
        { consulted_count: 0, responded_count: 0, approved_count: 0, declined_count: 0 };
      s.consulted_count += 1;
      if (row.response && row.response !== 'pending') { s.responded_count += 1; }
      if (row.response === 'approved') { s.approved_count += 1; }
      if (row.response === 'declined' || row.response === 'declined_post_approval') { s.declined_count += 1; }
      consultByGate.set(row.gate_record_id, s);
    }
  }

  const next = deriveNextGate(gateRecords, milestones);

  const milestonesOut = [...milestones].sort(bySequence).map(m => ({
    gate_name:   m.gate_name,
    gate_label:  gateLabel(m.gate_name),
    target_date: m.target_date ?? null,
    actual_date: m.actual_date ?? null,
    date_status: m.date_status
  }));

  const gatesOut = [...gateRecords].sort(bySequence).map(g => {
    const status = publicGateStatus(g.gate_status);
    return {
      gate_name:             g.gate_name,
      gate_status:           status,
      approver_display_name: g.approver_user_id ? (approverMap.get(g.approver_user_id) ?? null) : null,
      submitted_at:          g.submitted_at ?? null,
      decided_at:            g.approver_decision_at ?? null,
      // Return notes only — include only when the gate was returned (spec §WS3.4).
      approver_notes:        g.gate_status === 'returned' ? (g.approver_notes ?? null) : null,
      consultation_summary:  consultByGate.get(g.gate_record_id) ||
        { consulted_count: 0, responded_count: 0, approved_count: 0, declined_count: 0 }
    };
  });

  const artifactsOut = artifacts.map(a => ({
    type_label:     a.artifact_type_id ? (typeMap.get(a.artifact_type_id) ?? 'Ad hoc') : 'Ad hoc',
    display_name:   a.display_name,
    external_url:   a.external_url ?? null,
    gate_affinity:  a.gate_affinity ?? null,
    pointer_status: a.pointer_status
  }));

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
    updated_at:             c.updated_at,
    other_consulted_count:  Array.isArray(c.other_consulted_user_ids) ? c.other_consulted_user_ids.length : 0,
    other_informed_count:   Array.isArray(c.other_informed_user_ids)  ? c.other_informed_user_ids.length  : 0,
    milestones:             milestonesOut,
    gates:                  gatesOut,
    artifacts:              artifactsOut
  };
}

module.exports = { getInitiative };
