// get_delivery_cycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Returns the full cycle record including current stage, milestone dates,
// gate records, Workstream details.
//
// Supplement Section 1: each gate_record in the response includes
// current_user_gate_authority: { can_submit, can_approve } so the Angular
// client can render action buttons without re-deriving permissions.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} caller_user_id - from JWT
 */
async function get_delivery_cycle(params, caller_user_id) {
  const { delivery_cycle_id } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  // ── Fetch cycle ───────────────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  // ── Fetch milestone dates ─────────────────────────────────────────────────
  const { data: milestone_dates } = await supabase
    .from('cycle_milestone_dates')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // ── Fetch gate records ────────────────────────────────────────────────────
  const { data: gate_records } = await supabase
    .from('gate_records')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // ── Fetch workstream details ──────────────────────────────────────────────
  const { data: workstream } = await supabase
    .from('delivery_workstreams')
    .select('workstream_id, workstream_name, active_status, home_division_id, workstream_lead_user_id')
    .eq('workstream_id', cycle.workstream_id)
    .is('deleted_at', null)
    .single();

  // ── Resolve workstream home division name (Section 2.5 — Division field inheritance) ──
  let home_division_name = null;
  if (workstream?.home_division_id) {
    const { data: divRow } = await supabase
      .from('divisions')
      .select('division_name')
      .eq('id', workstream.home_division_id)
      .is('deleted_at', null)
      .single();
    if (divRow) { home_division_name = divRow.division_name; }
  }

  // ── Resolve cycle's own division name (Contract 16 UAT fix, CC-017) ───────
  // The DeliveryCycle type defines division_name as an optional joined field
  // (database.ts:230). list_delivery_cycles enriches it; get_delivery_cycle did
  // not — detail panel rendered "Division: Not set" even when division_id was
  // populated. Mirror the list_delivery_cycles pattern (B-28 fix, Contract 9).
  let cycle_division_name = null;
  let cycle_division_display_name_short = null;
  if (cycle.division_id) {
    const { data: cycleDivRow } = await supabase
      .from('divisions')
      .select('division_name, display_name_short')
      .eq('id', cycle.division_id)
      .is('deleted_at', null)
      .single();
    if (cycleDivRow) {
      cycle_division_name = cycleDivRow.division_name;
      cycle_division_display_name_short = cycleDivRow.display_name_short;
    }
  }

  // ── Fetch Jira links ──────────────────────────────────────────────────────
  const { data: jira_links } = await supabase
    .from('jira_links')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // ── Fetch cycle artifacts ─────────────────────────────────────────────────
  const { data: artifacts } = await supabase
    .from('cycle_artifacts')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .order('attached_at', { ascending: true });

  // ── Fetch seeded artifact types (26 + ad hoc) ─────────────────────────────
  // Build C §3.7 + §5.10 + AC #20: every Initiative renders one slot per type
  // organized by lifecycle stage. Phil 2026-06-15: no future-stage gating —
  // every slot is active in every Initiative state.
  const { data: artifact_types } = await supabase
    .from('cycle_artifact_types')
    .select('*')
    .order('sort_order', { ascending: true });

  // ── Resolve DCS / EPO / DOL display names + caller role ───────────────────
  // CC-28-3: also resolve attached_by_user_id for every artifact so the
  // joined attached_by_display_name is populated in the response. Prior to
  // this the field was specced on the Angular type but never returned —
  // every "Attached by" chip rendered as Unknown.
  const artifactAttacherIds = (artifacts || [])
    .map(a => a.attached_by_user_id)
    .filter(Boolean);
  // D-458 (WS1): resolve display names for the Other Consulted / Other Informed
  // participant arrays. Columns are uuid[] NOT NULL DEFAULT '{}' (migration 045).
  const otherConsultedIds = Array.isArray(cycle.other_consulted_user_ids) ? cycle.other_consulted_user_ids : [];
  const otherInformedIds  = Array.isArray(cycle.other_informed_user_ids)  ? cycle.other_informed_user_ids  : [];
  const userIdsToResolve = [
    cycle.assigned_dcs_user_id,
    cycle.assigned_epo_user_id,
    cycle.assigned_dol_user_id,
    caller_user_id,
    ...artifactAttacherIds,
    ...otherConsultedIds,
    ...otherInformedIds
  ].filter(Boolean);

  let userMap = {};
  let callerIsAdmin = false;
  if (userIdsToResolve.length > 0) {
    const { data: userRows } = await supabase
      .from('users')
      .select('id, display_name, is_admin')
      .in('id', [...new Set(userIdsToResolve)])
      .is('deleted_at', null);
    if (userRows) {
      userRows.forEach(u => {
        userMap[u.id] = u.display_name;
        if (u.id === caller_user_id) { callerIsAdmin = u.is_admin === true; }
      });
    }
  }

  // ── CC-28-3: enrich artifacts with joined artifact_type_name + attached_by_display_name ──
  // The Angular CycleArtifact type declares both as optional "Joined" fields.
  // The Angular checklist matcher in delivery-cycle-detail.component.ts
  // (gateChecklist) reads a.artifact_type_name to detect specific attachments
  // (e.g. "uat sign"). Without this enrichment every checklist item silently
  // returned met:false regardless of actual attachments.
  const artifactTypeNameMap = {};
  (artifact_types || []).forEach(t => {
    artifactTypeNameMap[t.artifact_type_id] = t.artifact_type_name;
  });
  const enrichedArtifacts = (artifacts || []).map(a => ({
    ...a,
    artifact_type_name: a.artifact_type_id
      ? (artifactTypeNameMap[a.artifact_type_id] ?? null)
      : null,
    attached_by_display_name: a.attached_by_user_id
      ? (userMap[a.attached_by_user_id] ?? null)
      : null
  }));

  // ── Compute gate authority per gate for the caller (D-389/D-390/D-391) ────
  // Contract 19 (D-394, CC-19-01): is_admin replaces the 'phil' single-role check.
  const isAssignedDcs = cycle.assigned_dcs_user_id === caller_user_id;
  const isAssignedEpo = cycle.assigned_epo_user_id === caller_user_id;
  const isAssignedDol = cycle.assigned_dol_user_id === caller_user_id;
  // Caller can submit if they are an Admin, or the assigned DCS, EPO, or DOL on this Initiative.
  const callerCanSubmitAny = callerIsAdmin || isAssignedDcs || isAssignedEpo || isAssignedDol;

  // Resolve submitter display names for gate records that have submitted_by_user_id (D-345).
  const submitterIds = (gate_records || [])
    .map(gr => gr.submitted_by_user_id)
    .filter(Boolean);
  const submitterMap = {};
  if (submitterIds.length > 0) {
    const { data: submitterRows } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', submitterIds)
      .is('deleted_at', null);
    (submitterRows || []).forEach(u => { submitterMap[u.id] = u.display_name; });
  }

  const enrichedGateRecords = (gate_records || []).map(gr => ({
    ...gr,
    submitted_by_display_name: gr.submitted_by_user_id
      ? (submitterMap[gr.submitted_by_user_id] ?? null)
      : null,
    current_user_gate_authority: {
      // can_submit: caller has submit authority AND gate is not in a terminal
      // or in-flight state. 'skipped' is terminal per D-447 — backdate via
      // set_milestone_actual_date is the only path off skipped.
      can_submit: callerCanSubmitAny &&
        gr.gate_status !== 'approved' &&
        gr.gate_status !== 'awaiting_approval' &&
        gr.gate_status !== 'skipped',
      // can_approve: caller is Phil, or caller is the designated approver_user_id, AND gate is awaiting
      // When approver_user_id is null (Build C default), Phil is the fallback approver
      can_approve: gr.gate_status === 'awaiting_approval' &&
        (callerIsAdmin || gr.approver_user_id === caller_user_id),
      // can_withdraw: caller has submit authority and gate is awaiting_approval (D-345 §4)
      can_withdraw: callerCanSubmitAny && gr.gate_status === 'awaiting_approval'
    }
  }));

  return {
    success: true,
    data: {
      ...cycle,
      // Contract 17 UAT Bug 2 fix: include division_name + display_name_short.
      division_name:             cycle_division_name,
      display_name_short:        cycle_division_display_name_short,
      // D-389/D-390/D-391: DCS / EPO / DOL display names from joined user map.
      assigned_dcs_display_name: cycle.assigned_dcs_user_id ? (userMap[cycle.assigned_dcs_user_id] ?? null) : null,
      assigned_epo_display_name: cycle.assigned_epo_user_id ? (userMap[cycle.assigned_epo_user_id] ?? null) : null,
      assigned_dol_display_name: cycle.assigned_dol_user_id ? (userMap[cycle.assigned_dol_user_id] ?? null) : null,
      // D-458 (WS1): resolved participant lists, order preserved. display_name
      // is null for any soft-deleted user still referenced in the array.
      other_consulted_users: otherConsultedIds.map(id => ({ id, display_name: userMap[id] ?? null })),
      other_informed_users:  otherInformedIds.map(id => ({ id, display_name: userMap[id] ?? null })),
      milestone_dates:  milestone_dates       || [],
      gate_records:     enrichedGateRecords,
      workstream:       workstream ? { ...workstream, home_division_name } : null,
      jira_links:       jira_links            || [],
      // CC-28-3: artifacts now carry joined artifact_type_name and
      // attached_by_display_name — pre-existing gap that made the gate
      // checklist matcher silently false-negative and the "Attached by"
      // chip render as Unknown for every attachment.
      artifacts:        enrichedArtifacts,
      // AC #20: seeded slot definitions for the detail panel's Artifacts zone.
      artifact_types:   artifact_types        || []
    }
  };
}

module.exports = { get_delivery_cycle };
