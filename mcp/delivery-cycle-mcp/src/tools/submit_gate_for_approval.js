// submit_gate_for_approval.js
// Pathways OI Trust — delivery-cycle-mcp
// Submits a gate for approval. Validates DCS, DOL (brief_review), and EPO (go_to_build)
// assignments. Workstream is recommended, not gate-required (Contract 19 Part 3b).
//
// Contract 19 (Part 3b): Workstream null check removed. Workstream is recommended.
//   When Workstream IS assigned: active_status check still gates submission (ARCH-23).
//   When Workstream is null: submission proceeds; workstream_active_at_clearance = null.
//
// D-389/D-390/D-391:
//   brief_review gate: assigned_dcs_user_id AND assigned_dol_user_id must both be non-null.
//     DCS is accountable for the Initiative through delivery; DOL is accountable for the outcome.
//   go_to_build gate: assigned_epo_user_id must be non-null. EPO is accountable for the build phase.
//
// ARCH-23 (when Workstream assigned): inactive → gate_status = 'blocked',
//   workstream_active_at_clearance = false recorded. Active → 'awaiting_approval' (D-345).
//   submitted_at = now() and submitted_by_user_id = JWT identity recorded.
// Appends event log entry in all cases.
// Source: D-140, D-345, ARCH-23, D-389, D-390, D-391, Contract 19 Part 3b,
//   gate-submission-flow-spec-2026-04-19 §3.1.
//
// Contract 28 / D-447 / D-448 / D-450 — Skip pre-check:
//   Before the existing enforcement checks, query predecessor gates. If any
//   predecessor is neither 'approved' nor 'skipped' the tool short-circuits
//   with one of two non-mutating responses:
//     - 'go_to_deploy' submitted → success:false, error:'DEPLOY_GATE_SKIP_BLOCKED'
//       (Deploy gate cannot be skipped; backend-enforced).
//     - any other gate          → success:true, status:'REQUIRES_SKIP_CONFIRMATION'
//       (Angular renders the interstitial; user then calls confirm_gate_skip
//       which writes the 'skipped' rows and re-invokes this tool to submit
//       the original gate).
//   Skip pre-check does NOT mutate state — only confirm_gate_skip transitions
//   gates to 'skipped'.

'use strict';

const { supabase } = require('../db');
const { computeArtifactSuggestionWarnings } = require('./helpers/artifact-warnings');
// Contract 29: WS3 approver resolution, WS2 consultation setup, WS4 email.
// Contract G2: effective-level-aware resolution (D-557/D-570) + shared
// board-trigger helper (CC-G1-18 executed).
const { resolveGateApproverV2, recordAssignedDualWrite } = require('./helpers/approver');
// Contract G5 (S-A1): submitter auto-approval on L1 consensus gates.
const { recordTrioApproval } = require('./helpers/l1-consensus');
const { isBoardTriggeredGate } = require('./helpers/board-trigger');
const { isPhil } = require('./helpers/phil');
const { validateOrError, saveAssessment } = require('./helpers/gate-assessments');
// Contract G4 (D-564): Consulted set now derives from participation_records
// (trio + C stakes with group expansion) — the D-458 array is retired.
const { deriveConsultedUserIdsV2, setupGateConsultations } = require('./helpers/consultations');
const { enqueueNotifications } = require('./helpers/notification-queue');

// Gate-name display strings — used in event_description and surfaced to UI text.
// Source: gate-submission-flow-spec-2026-04-19 §3.1.
const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

// Gate sequence — used by the D-447/D-448/D-450 skip pre-check to identify
// predecessor gates. Order matches gate-submission-flow-spec-2026-04-19 §3.1.
const GATE_ORDER = [
  'brief_review',
  'go_to_build',
  'go_to_deploy',
  'go_to_release',
  'close_review'
];

// Predecessor statuses that block skip-free submission. A predecessor is
// "resolved" when it is 'approved' (completed in OI Trust) or 'skipped'
// (D-447, recorded outside OI Trust).
const RESOLVED_PREDECESSOR_STATUSES = new Set(['approved', 'skipped']);

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} params.gate_name
 * @param {string} [params.submission_note] - D-489: optional "Why is this gate
 *   ready?" free text. Stored on gate_records.submission_note at submission;
 *   not editable afterward (a re-submission is a new submission and overwrites).
 * @param {boolean} [params.cast_confirmed] - D-584 (Contract 39): go_to_build only.
 *   Must be true — the submitter confirms the consultation set at submission.
 *   Recorded as cast_confirmed_at/by on the gate record (migration 091).
 * @param {string} [params.outcome_verdict] - D-585 (Contract 39): close_review only.
 *   'met' | 'not_met'. Required with outcome_actual and outcome_evidence.
 * @param {string} [params.outcome_actual] - D-585: actual result text (required at close_review).
 * @param {string} [params.outcome_evidence] - D-585: evidence (met) or explanation (not_met).
 * @param {string} caller_user_id - from JWT
 */
async function submit_gate_for_approval(params, caller_user_id) {
  const { delivery_cycle_id, gate_name } = params;
  // D-489: trim to null — empty notes are stored as NULL, never ''.
  const submission_note = (typeof params.submission_note === 'string' && params.submission_note.trim())
    ? params.submission_note.trim()
    : null;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!gate_name) {
    return { success: false, error: 'gate_name is required.' };
  }

  if (!GATE_ORDER.includes(gate_name)) {
    return {
      success: false,
      error: `gate_name must be one of: ${GATE_ORDER.join(', ')}.`
    };
  }

  // ── Fetch Initiative ──────────────────────────────────────────────────────
  // D-424 / Contract 23 Item 3.6: division_id added — used to look up dol_required.
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, workstream_id, division_id, current_lifecycle_stage, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id, jira_epic_key, ai_functionality, ai_delivery_form, ai_audience, ai_board_approved, baseline_level, set_level, oversight_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  // ── Submission authority: Admin, DCS, EPO, or DOL on this Initiative (D-389/D-390/D-391) ──
  // Any Admin can submit on behalf of an Initiative (D-369).
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin, display_name')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  const callerDisplayName  = caller?.display_name ?? 'A user';
  const gateNameDisplay    = GATE_NAME_DISPLAY[gate_name] ?? gate_name;
  const isAdmin       = caller?.is_admin === true;
  const isAssignedDcs = cycle.assigned_dcs_user_id === caller_user_id;
  const isAssignedEpo = cycle.assigned_epo_user_id === caller_user_id;
  const isAssignedDol = cycle.assigned_dol_user_id === caller_user_id;

  if (!isAdmin && !isAssignedDcs && !isAssignedEpo && !isAssignedDol) {
    return {
      success: false,
      error: 'You do not have authority to submit this gate for approval. ' +
             'Only the assigned Domain Capability Strategist, Engineering Product Owner, Domain Outcome Lead, or an Admin can submit gates.'
    };
  }

  // ── Phil override (Phil 2026-07-24): data-cleanup / testing lever ─────────
  // phil_override: true bypasses every submission rule below (sizing
  // interstitial, role floors, artifact/Jira/AI hard stops, deploy-skip
  // block, inactive-workstream block). Phil-only; UI confirms before sending.
  // Every override submission is event-logged with the flag.
  let philOverride = false;
  if (params.phil_override === true) {
    if (!(await isPhil(caller_user_id))) {
      return { success: false, error: 'phil_override is available to Phil only.' };
    }
    philOverride = true;
    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id,
      event_type:        'phil_override',
      event_description: `Phil override: '${gate_name}' submitted bypassing submission rules.`,
      actor_user_id:     caller_user_id,
      event_metadata:    { gate_name, action: 'submit_override' }
    });
  }

  // ── Contract GA-1 (D-579): submitter self-assessment ──────────────────────
  // Required from genuine participants (assigned trio roles); skipped for
  // phil_override and for an Admin submitting on behalf (not a collected
  // party — CC-G5-02 posture). Validated here, before ANY submission work
  // (twin enforcement, AC #1/#8); saved only after the gate transitions.
  // Skip-interstitial round-trips re-send the same payload via confirm_gate_skip.
  const assessmentRequired = !philOverride && (isAssignedDcs || isAssignedEpo || isAssignedDol);
  let assessmentItems = null;
  if (assessmentRequired) {
    const v = validateOrError(gate_name, 'submitter', params.assessment ?? []);
    if (!v.ok) {
      return { success: false, error: `Cannot submit ${gateNameDisplay} — ${v.error}` };
    }
    assessmentItems = v.items;
  } else if (Array.isArray(params.assessment) && params.assessment.length > 0 && !philOverride) {
    // Volunteered by a non-required caller (e.g. Admin) — still validated.
    const v = validateOrError(gate_name, 'submitter', params.assessment);
    if (!v.ok) { return { success: false, error: v.error }; }
    assessmentItems = v.items;
  }

  // ── Contract G3 (D-567): sizing required at the next gate ─────────────────
  // Any initiative without a sizing row must complete sizing before any gate
  // submission proceeds. Non-mutating interstitial mirroring the skip
  // pre-check: Angular interposes the sizing form, then re-submits. Runs
  // before the skip pre-check so a legacy initiative sizes once, first.
  if (!philOverride) {
    const { data: sizingRow, error: sizingErr } = await supabase
      .from('initiative_sizing')
      .select('delivery_cycle_id')
      .eq('delivery_cycle_id', delivery_cycle_id)
      .maybeSingle();
    if (sizingErr) {
      return { success: false, error: `Failed to check sizing state: ${sizingErr.message}` };
    }
    if (!sizingRow) {
      return {
        success: true,
        status: 'REQUIRES_SIZING',
        data: {
          code:           'REQUIRES_SIZING',
          submitted_gate: gate_name,
          message:
            'Sizing is required before this gate can be submitted. Answer the five sizing ' +
            'questions — the gate submission will continue once sizing is saved (D-567).'
        }
      };
    }
  }

  // ── D-447 / D-448 / D-450: Skip pre-check ─────────────────────────────────
  // Identify predecessor gates whose state is neither 'approved' nor 'skipped'.
  // brief_review has no predecessors → always falls through.
  //   - All resolved → fall through to normal submission flow below.
  //   - Unresolved + submitted gate is go_to_deploy → DEPLOY_GATE_SKIP_BLOCKED
  //     (D-450 — Deploy gate cannot be skipped; backend enforcement).
  //   - Unresolved + any other gate → REQUIRES_SKIP_CONFIRMATION (D-448 —
  //     Angular handles the interstitial; user then calls confirm_gate_skip).
  // The actual transition to gate_status='skipped' happens only in
  // confirm_gate_skip — this tool is read-only at this point.
  const submittedIdx     = GATE_ORDER.indexOf(gate_name);
  const predecessorGates = GATE_ORDER.slice(0, submittedIdx);

  if (predecessorGates.length > 0) {
    const { data: predecessorRecords, error: predErr } = await supabase
      .from('gate_records')
      .select('gate_name, gate_status')
      .eq('delivery_cycle_id', delivery_cycle_id)
      .in('gate_name', predecessorGates)
      .is('deleted_at', null);

    if (predErr) {
      return { success: false, error: `Failed to query predecessor gates: ${predErr.message}` };
    }

    const statusByGate = new Map(
      (predecessorRecords ?? []).map(r => [r.gate_name, r.gate_status])
    );
    const unresolvedPredecessors = predecessorGates.filter(g => {
      const s = statusByGate.get(g);
      return !RESOLVED_PREDECESSOR_STATUSES.has(s);
    });

    if (unresolvedPredecessors.length > 0) {
      const unresolvedLabels = unresolvedPredecessors.map(
        g => GATE_NAME_DISPLAY[g] ?? g
      );

      // Phil override: the deploy-skip block relaxes to the normal skip
      // confirmation — Phil may skip any gate, Deploy included.
      if (gate_name === 'go_to_deploy' && !philOverride) {
        return {
          success: false,
          error: 'DEPLOY_GATE_SKIP_BLOCKED',
          data: {
            code: 'DEPLOY_GATE_SKIP_BLOCKED',
            message:
              'The Deploy gate cannot be skipped. To submit Go to Deploy for approval, ' +
              `the following gates must be completed or backdated first: ${unresolvedLabels.join(', ')}. ` +
              'You can backdate gates that were completed outside OI Trust.',
            gates_requiring_action: unresolvedPredecessors
          }
        };
      }

      return {
        success: true,
        status: 'REQUIRES_SKIP_CONFIRMATION',
        data: {
          status:         'REQUIRES_SKIP_CONFIRMATION',
          gates_to_skip:  unresolvedPredecessors,
          submitted_gate: gate_name,
          message:
            'The following gates will be marked as skipped: ' +
            `${unresolvedLabels.join(', ')}. ` +
            `Continue to submit ${gateNameDisplay} for approval?`
        }
      };
    }
  }

  // ── Contract 19 Part 3b: Workstream null check removed. Workstream recommended, not gate-required.
  //   When Workstream IS assigned, active_status still gates submission (ARCH-23) — see below.
  //   When Workstream is null, submission proceeds; the workstream-active branch is skipped.

  // ── D-389: DCS required before brief_review gate ──────────────────────────
  if (gate_name === 'brief_review' && !cycle.assigned_dcs_user_id && !philOverride) {
    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'gate_blocked',
        event_description: `Gate 'brief_review' blocked: no Domain Capability Strategist is assigned to this Initiative.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, reason: 'no_dcs_assigned' }
      });

    return {
      success: false,
      error: `Cannot submit Brief Review gate — no Domain Capability Strategist is assigned to this Initiative. ` +
             `A DCS must be named before Brief Review can proceed. ` +
             `An Admin or Phil can assign a DCS using the Initiative's edit panel.`
    };
  }

  // ── D-391 + D-424: DOL required before brief_review gate (Division-conditional) ─
  // Contract 23 Item 3.6: if the cycle's Division has dol_required = false,
  // skip the DOL null check entirely. DCS and Workstream pre-checks are unchanged.
  if (gate_name === 'brief_review' && !cycle.assigned_dol_user_id && !philOverride) {
    let dolRequired = true;
    if (cycle.division_id) {
      const { data: divRow } = await supabase
        .from('divisions')
        .select('dol_required')
        .eq('id', cycle.division_id)
        .is('deleted_at', null)
        .single();
      if (divRow && divRow.dol_required === false) { dolRequired = false; }
    }

    if (dolRequired) {
      await supabase
        .from('cycle_event_log')
        .insert({
          delivery_cycle_id,
          event_type:        'gate_blocked',
          event_description: `Gate 'brief_review' blocked: no Domain Outcome Lead is assigned to this Initiative.`,
          actor_user_id:     caller_user_id,
          event_metadata:    { gate_name, reason: 'no_dol_assigned' }
        });

      return {
        success: false,
        error: `Cannot submit Brief Review gate — no Domain Outcome Lead is assigned to this Initiative. ` +
               `A DOL must be named before Brief Review can proceed. ` +
               `An Admin or Phil can assign a DOL using the Initiative's edit panel.`
      };
    }
    // dolRequired === false: fall through; submission proceeds with no DOL.
  }

  // ── D-390: EPO required before go_to_build gate ───────────────────────────
  if (gate_name === 'go_to_build' && !cycle.assigned_epo_user_id && !philOverride) {
    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'gate_blocked',
        event_description: `Gate 'go_to_build' blocked: no Engineering Product Owner is assigned to this Initiative.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, reason: 'no_epo_assigned' }
      });

    return {
      success: false,
      error: `Cannot submit Go to Build gate — no Engineering Product Owner is assigned to this Initiative. ` +
             `An EPO must be named before this Initiative enters the BUILD phase. ` +
             `An Admin or Phil can assign an EPO using the Initiative's edit panel.`
    };
  }

  // ── Contract 39 (D-584): cast confirmation at Go to Build submission ──────
  // The "last cheap moment" (D-567 pattern): the submitter confirms the
  // consultation set as part of submission. One-tap in the UI; the server
  // blocks until confirmed. Level 1 initiatives record identically (AC #13).
  const castConfirmed = params.cast_confirmed === true;
  if (gate_name === 'go_to_build' && !philOverride && !castConfirmed) {
    return {
      success: false,
      error: 'Cannot submit Go to Build — the consultation cast has not been confirmed. ' +
             'Review the Consulted parties shown on the submission screen and confirm the ' +
             'cast to proceed (D-584).'
    };
  }

  // ── Contract 39 (D-585): Close Review outcome verdict block ───────────────
  // Close Review verifies the declared outcome. Submission requires: actual
  // result, verdict (met|not_met — both passing states, D-573), and evidence
  // or explanation. Works with null outcome_statement — the actual-result
  // text states the outcome retrospectively; the gate never passes with the
  // question unconfronted.
  let outcomeVerdictFields = null;
  if (gate_name === 'close_review' && !philOverride) {
    const outcome_verdict  = params.outcome_verdict;
    const outcome_actual   = (typeof params.outcome_actual === 'string' && params.outcome_actual.trim())
      ? params.outcome_actual.trim() : null;
    const outcome_evidence = (typeof params.outcome_evidence === 'string' && params.outcome_evidence.trim())
      ? params.outcome_evidence.trim() : null;
    const missing = [];
    if (outcome_verdict !== 'met' && outcome_verdict !== 'not_met') { missing.push('verdict (met or not_met)'); }
    if (!outcome_actual)   { missing.push('actual result'); }
    if (!outcome_evidence) { missing.push(outcome_verdict === 'not_met' ? 'explanation of what happened' : 'evidence of where the result is demonstrated'); }
    if (missing.length > 0) {
      return {
        success: false,
        error: `Cannot submit Close Review — the outcome verdict block is incomplete: ` +
               `${missing.join(', ')} required. Close Review verifies whether the Initiative met ` +
               'the outcome it declared; complete the verdict block to proceed (D-585).'
      };
    }
    outcomeVerdictFields = { outcome_verdict, outcome_actual, outcome_evidence };
  }

  // ── Contract 38 follow-on 13: hard-stop ladder (server-side twin of the UI
  // enforcement — MCP requests that skip the UI still hit these rules).
  // Shared blocker: logs a gate_blocked event and returns the D-140 message.
  const blockGate = async (reason, message) => {
    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'gate_blocked',
        event_description: `Gate '${gate_name}' blocked: ${reason}.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, reason }
      });
    return { success: false, error: message };
  };

  // ── Contract G5 (D-557): Level 1 assignment floor ──────────────────────────
  // L1-consensus gates (effective level 1, no oversight promotion) collect
  // trio approvals — the trio must exist. Brief Review requires DCS + DOL
  // (absolute at L1 — the Division dol_required exemption applies to the
  // single-approver routes only, CC-G5 lean); Go to Build onward requires the
  // full trio. D-140 message names the missing role.
  {
    const l1Consensus = ((cycle.set_level ?? cycle.baseline_level) === 1) && !cycle.oversight_user_id;
    if (l1Consensus && !philOverride) {
      const missing = [];
      if (!cycle.assigned_dcs_user_id) { missing.push('Domain Capability Strategist'); }
      if (!cycle.assigned_dol_user_id) { missing.push('Domain Outcome Lead'); }
      if (gate_name !== 'brief_review' && !cycle.assigned_epo_user_id) {
        missing.push('Engineering Product Owner');
      }
      if (missing.length > 0) {
        return blockGate('l1_assignment_floor',
          `Cannot submit ${gateNameDisplay} — this Level 1 gate collects approvals from the ` +
          `Initiative trio, and the following role${missing.length === 1 ? ' is' : 's are'} ` +
          `unassigned: ${missing.join(', ')}. Assign the missing role${missing.length === 1 ? '' : 's'} ` +
          'in the Initiative edit panel, then submit again.');
      }
    }
  }

  if (gate_name === 'go_to_build' && !philOverride) {
    // Context Brief hard stop REMOVED (Phil 2026-07-30). It blocked Go to Build
    // from 2026-07-17. Now a loud advisory warning across Brief Review → Go to
    // Deploy, driven by cycle_artifact_types (migration 096) and surfaced to
    // BOTH submitter and approver via the shared artifact-warnings helper.
    // Scenario Journeys gets the same treatment from Go to Build. Do not
    // reintroduce a per-artifact hard stop here — configure the warning window
    // in the artifact type instead.

    // Jira epic linked — hard stop unless the Division is configured with
    // jira_epic_required = false (migration 074).
    if (!cycle.jira_epic_key) {
      let jiraRequired = true;
      if (cycle.division_id) {
        const { data: divRow } = await supabase
          .from('divisions')
          .select('jira_epic_required')
          .eq('id', cycle.division_id)
          .is('deleted_at', null)
          .single();
        if (divRow && divRow.jira_epic_required === false) { jiraRequired = false; }
      }
      if (jiraRequired) {
        return blockGate('no_jira_epic',
          'Cannot submit Go to Build — no Jira epic is linked to this Initiative. ' +
          'Link the Jira epic in the Initiative edit panel.');
      }
    }

    // AI question answered (any of Yes / No / I do not know) — hard stop.
    if (!cycle.ai_functionality) {
      return blockGate('ai_functionality_unanswered',
        'Cannot submit Go to Build — the "Includes AI functionality" question has not been ' +
        'answered. Set it in the Initiative edit panel (Yes, No, or I do not know) before this gate.');
    }
  }

  if (gate_name === 'go_to_deploy' && !philOverride) {
    // AI question must be resolved to Yes or No by Go to Deploy.
    if (cycle.ai_functionality !== 'yes' && cycle.ai_functionality !== 'no') {
      return blockGate('ai_functionality_unresolved',
        'Cannot submit Go to Deploy — the "Includes AI functionality" question must be resolved ' +
        'to Yes or No before deployment. Update it in the Initiative edit panel.');
    }
    if (cycle.ai_functionality === 'yes') {
      if (!cycle.ai_delivery_form || !cycle.ai_audience) {
        return blockGate('ai_profile_incomplete',
          'Cannot submit Go to Deploy — this Initiative includes AI but the AI profile is ' +
          'incomplete. Set the delivery form (product-embedded or analytics outputs) and the ' +
          'audience (external or internal) in the Initiative edit panel.');
      }
      // Embedded + external → AI Production Board approval before pilot.
      // G2 (CC-G1-18): board detection sourced from the shared helper.
      if (isBoardTriggeredGate(cycle, gate_name) &&
          cycle.ai_board_approved !== true) {
        return blockGate('ai_prod_board_approval_missing',
          'Cannot submit Go to Deploy — external user-facing AI requires AI Production Board ' +
          'approval before pilot. Obtain AI Prod Board approval and record it on the Initiative, ' +
          'then submit again.');
      }
    }
  }

  // G2 (CC-G1-18): board detection sourced from the shared helper.
  if (gate_name === 'go_to_release' && !philOverride &&
      isBoardTriggeredGate(cycle, gate_name) &&
      cycle.ai_board_approved !== true) {
    // Internal AI (embedded or analytics) → Board approval before release.
    return blockGate('ai_prod_board_approval_missing',
      'Cannot submit Go to Release — internal AI functionality requires AI Production Board ' +
      'approval before production release. Obtain AI Prod Board approval and record it on the ' +
      'Initiative, then submit again.');
  }

  // ── Fetch workstream (only when assigned — Contract 19 Part 3b) ────────────
  let workstream = null;
  if (cycle.workstream_id) {
    const { data: wsRow, error: wsErr } = await supabase
      .from('delivery_workstreams')
      .select('workstream_name, active_status')
      .eq('workstream_id', cycle.workstream_id)
      .is('deleted_at', null)
      .single();

    if (wsErr || !wsRow) {
      return { success: false, error: 'Assigned Workstream not found. Contact an Admin to reassign a valid Workstream.' };
    }
    workstream = wsRow;
  }

  // ── Fetch gate record ─────────────────────────────────────────────────────
  const { data: gate_record, error: gateErr } = await supabase
    .from('gate_records')
    .select('gate_record_id, gate_status')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_name', gate_name)
    .is('deleted_at', null)
    .single();

  if (gateErr || !gate_record) {
    return {
      success: false,
      error: `Gate record for '${gate_name}' not found on this cycle. Ensure the cycle was created correctly.`
    };
  }

  if (gate_record.gate_status === 'approved') {
    return {
      success: false,
      error: `The ${gate_name} gate has already been approved for this cycle.`
    };
  }

  // ── Conditions loop (Phil ruling 2026-07-26): open conditions block
  // resubmission — resolve them (or the approver withdraws them) first.
  // Phil override bypasses. D-140: the message names every open item.
  if (!philOverride) {
    const { data: openCondRows } = await supabase
      .from('gate_conditions')
      .select('condition_text')
      .eq('gate_record_id', gate_record.gate_record_id)
      .eq('condition_status', 'open');
    if ((openCondRows ?? []).length > 0) {
      return blockGate('open_conditions',
        `Cannot submit ${gateNameDisplay} — ${openCondRows.length} condition${openCondRows.length === 1 ? '' : 's'} from the approver ` +
        `must be resolved first: ${openCondRows.map(c => `"${c.condition_text}"`).join('; ')}. ` +
        'Resolve each condition on the gate record, then submit again.');
    }
  }

  // ── Workstream active check (ARCH-23) — only when Workstream assigned ────
  if (workstream && !workstream.active_status && !philOverride) {
    const { data: blocked_gate, error: blockErr } = await supabase
      .from('gate_records')
      .update({
        gate_status:                    'blocked',
        workstream_active_at_clearance: false
      })
      .eq('gate_record_id', gate_record.gate_record_id)
      .select()
      .single();

    if (blockErr) {
      return { success: false, error: `Failed to record gate block: ${blockErr.message}` };
    }

    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'gate_blocked',
        event_description: `Gate '${gate_name}' blocked: the ${workstream.workstream_name} workstream is inactive.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, workstream_active_at_clearance: false }
      });

    return {
      success: false,
      error: `Gate blocked: the ${workstream.workstream_name} workstream is inactive. A Division Admin must reactivate it before this gate can proceed.`,
      data: blocked_gate
    };
  }

  // ── WS3 (D-463) + Contract G2: effective-level-aware approver resolution ──
  // D-557 chain via resolveGateApproverV2: unsized → legacy (D-570b);
  // L1 → legacy w/ dual-write (D-570a), oversight promotes to L2 (S-C4);
  // L2 → oversight → config → DL → Phil; L3 → leadership only + warnings
  // (D-570c). Stored on gate_records.approver_user_id (D-463 retained).
  const resolution = await resolveGateApproverV2({ cycle, gate_name });
  const resolvedApproverId = resolution.approver_user_id;

  // ── Submission path — Workstream active OR Workstream not assigned ───────
  //   workstream_active_at_clearance:
  //     true   — Workstream assigned + active
  //     null   — no Workstream assigned (Contract 19 Part 3b)
  const workstream_clearance = workstream ? true : null;

  const { data: updated_gate, error: updateErr } = await supabase
    .from('gate_records')
    .update({
      gate_status:                    'awaiting_approval',
      submitted_at:                   new Date().toISOString(),
      submitted_by_user_id:           caller_user_id,
      approver_user_id:               resolvedApproverId,
      workstream_active_at_clearance: workstream_clearance,
      submission_note,                                       // D-489
      // Contract 39 (D-584): cast confirmation stamps — go_to_build only.
      ...(gate_name === 'go_to_build' && castConfirmed
        ? { cast_confirmed_at: new Date().toISOString(), cast_confirmed_by: caller_user_id }
        : {}),
      // Contract 39 (D-585): outcome verdict block — close_review only.
      ...(outcomeVerdictFields ?? {})
    })
    .eq('gate_record_id', gate_record.gate_record_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to update gate record: ${updateErr.message}` };
  }

  // ── Contract G2 dual-write (D-570a / spec §2 step 3–4): record the resolved
  // assignment in gate_approvals as 'assigned' for sized initiatives, so the
  // G5 transition has a truthful history. Unsized cycles write nothing (AC #1).
  // Dup guard (CC-G2 lean): one 'assigned' row per (gate, approver) — a
  // resubmission resolving the same person adds no duplicate; a different
  // resolution is a new history row.
  if (resolution.dual_write && resolvedApproverId) {
    const dualWrite = await recordAssignedDualWrite(gate_record.gate_record_id, resolvedApproverId);
    if (dualWrite.error) {
      // Non-fatal: the gate is already submitted; log for the server.
      console.error(JSON.stringify({
        tool_name: 'submit_gate_for_approval', step: 'gate_approvals_dual_write',
        delivery_cycle_id, gate_record_id: gate_record.gate_record_id,
        error: dualWrite.error
      }));
    }
  }

  // ── Contract G5 (S-A1): L1 consensus — submitter approval auto-recorded ────
  // Only when the submitter is a trio member (an Admin submitting on behalf is
  // not a collected party — CC-G5 lean). Uncleared-dup-guarded, so a
  // re-submission after return restarts collection cleanly.
  if (resolution.source === 'l1_consensus') {
    const trioIds = [cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id, cycle.assigned_dol_user_id]
      .filter(Boolean);
    if (trioIds.includes(caller_user_id)) {
      const auto = await recordTrioApproval(gate_record.gate_record_id, caller_user_id);
      if (auto.recorded) {
        await supabase.from('cycle_event_log').insert({
          delivery_cycle_id,
          event_type:        'gate_trio_approved',
          event_description: `${callerDisplayName} submitted ${gateNameDisplay} — submitter approval auto-recorded (Level 1).`,
          actor_user_id:     caller_user_id,
          event_metadata:    { gate_name, l1_consensus: true, auto_recorded: true }
        });
      }
    }
  }

  // GA-1: persist the submitter assessment (non-fatal after the transition).
  if (assessmentItems) {
    const saved = await saveAssessment({
      delivery_cycle_id, gate_key: gate_name,
      respondent_user_id: caller_user_id, respondent_role: 'submitter',
      items: assessmentItems
    });
    if (saved.error) {
      console.error(JSON.stringify({
        tool_name: 'submit_gate_for_approval', step: 'save_assessment',
        delivery_cycle_id, gate_name, error: saved.error
      }));
    }
  }

  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'gate_submitted',
      event_description: `${callerDisplayName} submitted ${gateNameDisplay} for approval.`,
      actor_user_id:     caller_user_id,
      event_metadata:    { gate_name }
    });

  // ── Contract G6 (D-565): the submission note opens the gate thread ─────────
  // Message #1 on every submission that carries a note (AC #1). Non-fatal.
  if (submission_note) {
    const { error: threadErr } = await supabase
      .from('gate_thread_messages')
      .insert({
        gate_record_id: gate_record.gate_record_id,
        user_id:        caller_user_id,
        message_text:   submission_note
      });
    if (threadErr) {
      console.error(JSON.stringify({
        tool_name: 'submit_gate_for_approval', step: 'thread_opening_message',
        gate_record_id: gate_record.gate_record_id, error: threadErr.message
      }));
    }
  }

  // ── WS2 (D-459/D-460) + G4 (D-564): derive Consulted set and create
  // consultation rows. Set = non-null trio + active participation C stakes
  // (groups expanded to members), deduplicated. Submitter row auto-approved
  // (no inbox/email). Idempotent on re-submit.
  const consultedUserIds = await deriveConsultedUserIdsV2(cycle);
  const { nonSubmitterConsultedUserIds, error: consultationError } = await setupGateConsultations({
    gate_record_id:       gate_record.gate_record_id,
    submitted_by_user_id: caller_user_id,
    consultedUserIds
  });
  if (consultationError) {
    // Non-fatal: the gate is already submitted. Surface the failure in the
    // server log rather than swallowing it — consultation rows may be missing
    // even though submission reported success.
    console.error(JSON.stringify({
      tool_name:         'submit_gate_for_approval',
      step:              'setupGateConsultations',
      delivery_cycle_id,
      gate_record_id:    gate_record.gate_record_id,
      error:             consultationError
    }));
  }

  // ── Resolve approver + Consulted display names/emails in one lookup ────────
  //
  // Contract 44 (D-646/D-557) verification note — deliberately NOT changed:
  // at Level 1 resolvedApproverId is null (no single approver), so this list
  // looks as though it omits the trio. It does not. deriveConsultedUserIdsV2
  // pushes the non-null trio into the Consulted set before any C stakes, so
  // nonSubmitterConsultedUserIds already carries every remaining collected
  // party — trio and Consulted — minus the submitter. Adding the trio again
  // here would be dead code that the helper's dedupe silently absorbs.
  const lookupIds = [...new Set(
    [resolvedApproverId, ...nonSubmitterConsultedUserIds].filter(Boolean)
  )];
  let assigned_approver = resolvedApproverId
    ? { id: resolvedApproverId, display_name: null }
    : null;

  if (lookupIds.length > 0) {
    const { data: recipientRows } = await supabase
      .from('users')
      .select('id, display_name, email')
      .in('id', lookupIds)
      .is('deleted_at', null);
    const byId = {};
    (recipientRows || []).forEach(u => { byId[u.id] = u; });

    if (assigned_approver && byId[resolvedApproverId]) {
      assigned_approver.display_name = byId[resolvedApproverId].display_name;
    }

    // ── WS4 (D-467): gate submission email — approver + non-submitter consulted ──
    // Submitter excluded (they submitted it, AC #43). Same body for both roles.
    // Contract 45 (D-642): queued. Every recipient here is IMMEDIATE — the
    // gate is waiting on each of them, which is exactly the D-641 test.
    const emailRecipients = [];
    if (resolvedApproverId && byId[resolvedApproverId]?.email) {
      emailRecipients.push({
        user_id:        resolvedApproverId,
        email:          byId[resolvedApproverId].email,
        display_name:   byId[resolvedApproverId].display_name,
        delivery_class: 'immediate'
      });
    }
    for (const id of nonSubmitterConsultedUserIds) {
      if (byId[id]?.email) {
        emailRecipients.push({
          user_id:        id,
          email:          byId[id].email,
          display_name:   byId[id].display_name,
          delivery_class: 'immediate'
        });
      }
    }
    if (emailRecipients.length > 0) {
      await enqueueNotifications({
        event_type:      'gate_submission',
        recipients:      emailRecipients,
        subject:         `${cycle.cycle_title} — ${gateNameDisplay} submitted for approval`,
        initiativeName:  cycle.cycle_title,
        gateNameDisplay,
        headline:        `${callerDisplayName} has submitted ${gateNameDisplay} for ${cycle.cycle_title}.`,
        detail:          resolvedApproverId
                           ? 'You have been notified as an approver or a consulted party.'
                           : 'This gate passes when every collected party approves — your approval is one of them.',
        initiative_id:   delivery_cycle_id,
        gate_record_id:  gate_record.gate_record_id,
        actor_user_id:   caller_user_id
      });
    }
  }

  // ── D-438 (Contract 25): non-blocking artifact suggestion warnings ────────
  // Compute artifact gaps AFTER submission succeeds, using the shared
  // primary_gate / gate_warning_behavior rule from helpers/artifact-warnings.
  // Wire shape is artifact_type_name[] to preserve the Angular contract; the
  // helper returns {artifact_type_id, artifact_type_name} objects, which we
  // flatten here. Submission status is unchanged regardless.
  const warningEntries = await computeArtifactSuggestionWarnings(
    delivery_cycle_id, gate_name
  );
  const suggestion_warnings = warningEntries.map(w => w.artifact_type_name);

  // assigned_approver (WS3 D-463): Angular shows "Submitted for approval by [chip]".
  // G2: resolution metadata — effective_level, approver_source, and
  // warnings[] (e.g. 'level3_sub_leadership_config_ignored', D-570c).
  return {
    success: true,
    data: updated_gate,
    suggestion_warnings,
    assigned_approver,
    effective_level: resolution.effective_level,
    approver_source: resolution.source,
    warnings: resolution.warnings
  };
}

module.exports = { submit_gate_for_approval };
