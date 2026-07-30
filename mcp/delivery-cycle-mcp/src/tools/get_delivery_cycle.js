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
// Contract G7 (D-565): single waiting-on computation source.
const { computeWaitingOnBatch } = require('../lib/waiting-on');
// Contract GA-1 (D-579): blind-until-decision assessment filtering.
const { filterForViewer: filterAssessmentsForViewer } = require('./helpers/gate-assessments');

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
  let cycle_division_owner_user_id = null;   // CC-40-N: DL authority for governance controls
  if (cycle.division_id) {
    const { data: cycleDivRow } = await supabase
      .from('divisions')
      .select('division_name, display_name_short, owner_user_id')
      .eq('id', cycle.division_id)
      .is('deleted_at', null)
      .single();
    if (cycleDivRow) {
      cycle_division_name = cycleDivRow.division_name;
      cycle_division_display_name_short = cycleDivRow.display_name_short;
      cycle_division_owner_user_id = cycleDivRow.owner_user_id ?? null;
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
  // Contract G4 (D-564): the D-458 arrays are retired (migration 084) — this
  // tool no longer reads or resolves them. Participation is served by
  // list_participation over participation_records.
  const userIdsToResolve = [
    cycle.assigned_dcs_user_id,
    cycle.assigned_epo_user_id,
    cycle.assigned_dol_user_id,
    cycle.oversight_user_id,               // CC-40-N: named approver (oversight, D-561)
    caller_user_id,
    ...artifactAttacherIds
  ].filter(Boolean);

  let userMap = {};
  let callerIsAdmin = false;
  let callerIsSuperAdmin = false;
  let callerIsIE = false;
  if (userIdsToResolve.length > 0) {
    const { data: userRows } = await supabase
      .from('users')
      .select('id, display_name, is_admin, is_super_admin, is_initiative_executive')
      .in('id', [...new Set(userIdsToResolve)])
      .is('deleted_at', null);
    if (userRows) {
      userRows.forEach(u => {
        userMap[u.id] = u.display_name;
        if (u.id === caller_user_id) {
          callerIsAdmin      = u.is_admin === true;
          callerIsSuperAdmin = u.is_super_admin === true;
          callerIsIE         = u.is_initiative_executive === true;
        }
      });
    }
  }
  // CC-40-N: who may set the governance Level (set_effective_level) and the
  // approver (set_oversight) on this Initiative — the Division Leader, an IE,
  // or Phil. Mirrors governance_level.js loadCycleWithLeadershipCheck; the
  // tools re-verify server-side regardless.
  const caller_can_set_governance =
    callerIsSuperAdmin || callerIsIE ||
    (cycle_division_owner_user_id != null && cycle_division_owner_user_id === caller_user_id);

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

  // Resolve submitter + approver display names for gate records (D-345). The
  // approver name is resolved server-side so the modal never has to look it up in
  // a client list that may omit the approver (Phil/admins) — that caused the
  // "Unknown user" Accountable label.
  // ── Contract GA-1 (D-579): gate assessments + link config ─────────────────
  // Blind-until-decision: filtered per gate below (own rows only pre-decision;
  // the approver-in-decision sees all; everyone sees all post-decision).
  const [{ data: assessmentRows }, { data: coachingLinkRows }] = await Promise.all([
    supabase.from('gate_assessments')
      .select('id, gate_key, respondent_user_id, respondent_role, item_key, grade, comment, cleared_by_return_at, created_at')
      .eq('delivery_cycle_id', delivery_cycle_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
    supabase.from('gate_coaching_links').select('gate_key, url')
  ]);
  const gateCoachingLinks = {};
  (coachingLinkRows || []).forEach(r => { gateCoachingLinks[r.gate_key] = r.url ?? null; });

  const gateUserIds = [...new Set(
    [
      ...(gate_records || [])
        .flatMap(gr => [gr.submitted_by_user_id, gr.approver_user_id]),
      ...(assessmentRows || []).map(a => a.respondent_user_id)
    ].filter(Boolean)
  )];
  const gateUserMap = {};
  if (gateUserIds.length > 0) {
    const { data: gateUserRows } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', gateUserIds)
      .is('deleted_at', null);
    (gateUserRows || []).forEach(u => { gateUserMap[u.id] = u.display_name; });
  }

  // ── Contract G5 (D-557): L1 consensus gate flags + waiting-on interim ──────
  // An awaiting L1 gate (effective level 1, NULL approver) collects trio +
  // consulted approvals: trio members get can_approve; the gate panel shows a
  // plain "Waiting on: [names]" list until G7's rolled-up line.
  const effectiveLevel = cycle.set_level ?? cycle.baseline_level ?? null;
  const trioIds = [cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id, cycle.assigned_dol_user_id]
    .filter(Boolean);
  const isTrioMemberCaller = trioIds.includes(caller_user_id);
  const l1AwaitingGateIds = (gate_records || [])
    .filter(gr => effectiveLevel === 1 && !gr.approver_user_id && gr.gate_status === 'awaiting_approval')
    .map(gr => gr.gate_record_id);

  const l1WaitingByGate = {};
  if (l1AwaitingGateIds.length > 0) {
    const [{ data: approvalRows }, { data: consultRows }, { data: trioUsers }] = await Promise.all([
      supabase.from('gate_approvals')
        .select('gate_record_id, approver_user_id, approval_type')
        .in('gate_record_id', l1AwaitingGateIds)
        .is('cleared_by_return_at', null),
      supabase.from('gate_consultations')
        .select('gate_record_id, consulted_user_id, response')
        .in('gate_record_id', l1AwaitingGateIds),
      trioIds.length
        ? supabase.from('users').select('id, display_name').in('id', trioIds)
        : Promise.resolve({ data: [] })
    ]);
    const trioNameMap = {};
    (trioUsers || []).forEach(u => { trioNameMap[u.id] = u.display_name; });

    for (const gid of l1AwaitingGateIds) {
      const approvedSet = new Set(
        (approvalRows || [])
          .filter(a => a.gate_record_id === gid &&
            (a.approval_type === 'trio_member' || a.approval_type === 'ie_override'))
          .map(a => a.approver_user_id)
      );
      const pendingTrio = trioIds.filter(id => !approvedSet.has(id));
      const approvedTrio = trioIds.filter(id => approvedSet.has(id));
      const pendingConsulted = (consultRows || [])
        .filter(c => c.gate_record_id === gid &&
          !trioIds.includes(c.consulted_user_id) && c.response === 'pending');
      l1WaitingByGate[gid] = {
        pending_trio_user_ids:       pendingTrio,
        pending_trio_display_names:  pendingTrio.map(id => trioNameMap[id] || 'Unknown'),
        // G7 (AC #3): approved side of the trio roster.
        approved_trio_display_names: approvedTrio.map(id => trioNameMap[id] || 'Unknown'),
        pending_consulted_count:     pendingConsulted.length,
        caller_has_approved:         approvedSet.has(caller_user_id)
      };
    }
  }

  const enrichedGateRecords = (gate_records || []).map(gr => {
    const isL1Gate = effectiveLevel === 1 && !gr.approver_user_id &&
      (gr.gate_status === 'awaiting_approval' || gr.gate_status === 'pending' || gr.gate_status === 'returned' || gr.gate_status === 'not_started');
    const l1Waiting = l1WaitingByGate[gr.gate_record_id] ?? null;
    return {
      ...gr,
      submitted_by_display_name: gr.submitted_by_user_id
        ? (gateUserMap[gr.submitted_by_user_id] ?? null)
        : null,
      // Server-resolved Accountable approver name (fixes "Unknown user").
      approver_display_name: gr.approver_user_id
        ? (gateUserMap[gr.approver_user_id] ?? null)
        : null,
      // G5: L1 consensus metadata for the gate panel.
      ...(isL1Gate ? { l1_consensus: true } : {}),
      ...(l1Waiting ? { l1_waiting_on: l1Waiting } : {}),
      // GA-1 (D-579): visibility-filtered assessment rows for this gate.
      assessments: filterAssessmentsForViewer(
        (assessmentRows || []).filter(a => a.gate_key === gr.gate_name),
        {
          viewer_user_id: caller_user_id,
          gate_status:    gr.gate_status,
          // The approver-in-decision sees all collected answers (GA-1 §4):
          // the designated approver, or an Admin acting as the fallback
          // approver on an unconfigured single-approver gate.
          viewerIsApprover: gr.gate_status === 'awaiting_approval' &&
            (gr.approver_user_id === caller_user_id ||
             (callerIsAdmin && !gr.approver_user_id && !l1Waiting))
        }
      ).map(a => ({ ...a, respondent_display_name: gateUserMap[a.respondent_user_id] ?? null })),
      current_user_gate_authority: {
        // can_submit: caller has submit authority AND gate is not in a terminal
        // or in-flight state. 'skipped' is terminal per D-447 — backdate via
        // set_milestone_actual_date is the only path off skipped.
        can_submit: callerCanSubmitAny &&
          gr.gate_status !== 'approved' &&
          gr.gate_status !== 'awaiting_approval' &&
          gr.gate_status !== 'skipped',
        // can_approve: awaiting AND (admin, the designated approver, or — G5 —
        // a trio member on an L1 consensus gate who hasn't approved yet).
        can_approve: gr.gate_status === 'awaiting_approval' &&
          (callerIsAdmin || gr.approver_user_id === caller_user_id ||
           (!!l1Waiting && isTrioMemberCaller && !l1Waiting.caller_has_approved)),
        // can_withdraw: caller has submit authority and gate is awaiting_approval (D-345 §4)
        can_withdraw: callerCanSubmitAny && gr.gate_status === 'awaiting_approval'
      }
    };
  });

  // ── Contract G7 (D-565 item 4): the single waiting-on line per awaiting gate.
  const waitingOnByGate = await computeWaitingOnBatch(
    enrichedGateRecords,
    { [cycle.delivery_cycle_id]: cycle }
  );
  for (const gr of enrichedGateRecords) {
    if (waitingOnByGate[gr.gate_record_id]) {
      gr.waiting_on = waitingOnByGate[gr.gate_record_id];
    }
  }

  // D-487: resolve Roadmap Theme name (nullable tag).
  let roadmap_theme_name = null;
  if (cycle.roadmap_theme_id) {
    const { data: themeRow } = await supabase
      .from('roadmap_themes')
      .select('name')
      .eq('id', cycle.roadmap_theme_id)
      .maybeSingle();
    roadmap_theme_name = themeRow?.name ?? null;
  }

  return {
    success: true,
    data: {
      ...cycle,
      // Contract 17 UAT Bug 2 fix: include division_name + display_name_short.
      division_name:             cycle_division_name,
      display_name_short:        cycle_division_display_name_short,
      // D-487: joined Theme name for the detail + Edit panels.
      roadmap_theme_name,
      // D-389/D-390/D-391: DCS / EPO / DOL display names from joined user map.
      assigned_dcs_display_name: cycle.assigned_dcs_user_id ? (userMap[cycle.assigned_dcs_user_id] ?? null) : null,
      assigned_epo_display_name: cycle.assigned_epo_user_id ? (userMap[cycle.assigned_epo_user_id] ?? null) : null,
      assigned_dol_display_name: cycle.assigned_dol_user_id ? (userMap[cycle.assigned_dol_user_id] ?? null) : null,
      // CC-40-N: named approver (oversight, D-561) + DL/IE/Phil authority flag.
      oversight_display_name:    cycle.oversight_user_id ? (userMap[cycle.oversight_user_id] ?? null) : null,
      caller_can_set_governance,
      // Contract G4: D-458 resolved participant lists removed — participation
      // is served by list_participation (participation_records).
      milestone_dates:  milestone_dates       || [],
      gate_records:     enrichedGateRecords,
      // GA-1: per-gate "Full best practices" link config (null/blank = hidden).
      gate_coaching_links: gateCoachingLinks,
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
