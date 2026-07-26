// record_gate_decision.js
// Pathways OI Trust — delivery-cycle-mcp
// Records an approver decision (approved or returned) on a gate_record.
// On approval:
//   - Sets gate_status = 'approved' and approver_decision_at
//   - Sets actual_date on the corresponding cycle_milestone_dates row to today
//   - Sets date_status = 'complete' on that milestone
//   - Advances the cycle to the next stage (same logic as advance_cycle_stage)
//   - Appends TWO event log entries (D-345 §3.2):
//       1. 'gate_approved' with approver as actor
//       2. 'stage_advanced' with actor null (system) — only when stage actually advanced
//   - Contract 20 / D-400: when the approved gate is go_to_build or go_to_deploy
//     and the cycle has an assigned_epo_user_id, attaches a wip_warning to the
//     response when the EPO's count in the entered zone is at or over the
//     EPO's configured limit. Warning is advisory — approval still succeeds.
//     Per CC-20-02: workstream-scope WIP check never existed in this tool;
//     EPO WIP check is net-new.
// On return:
//   - Sets gate_status = 'returned'
//   - Requires approver_notes — stored on gate_record only, never in event log metadata (D-345)
//   - Appends one 'gate_returned' event log entry — description does NOT include note text
// Build C: approver defaults to Phil's user_id (see spec Section 4.2). RACI-configured
// approver assignment is Build B.
// Supplement Section 1: caller must be Phil or the gate's designated approver_user_id.
// Source: D-154, D-345, D-400, D-200 Pattern 2, ARCH-12, build-c-spec Section 4.1,
//   gate-submission-flow-spec-2026-04-19 §3.2, supplement Section 1, Contract 20.

'use strict';

const { supabase }  = require('../db');
const {
  GATE_REQUIRED_TO_ENTER,
  WIP_CATEGORY_BY_STAGE,
  getCycleWipZone,
  WIP_LIMIT_PRE_BUILD,
  WIP_LIMIT_BUILD,
  WIP_LIMIT_POST_DEPLOY,
  nextStage
} = require('../lifecycle');
const { computeArtifactSuggestionWarnings } = require('./helpers/artifact-warnings');
// Contract 29 WS3 (D-465): Phil super-approver override side-effects.
const { getPhil } = require('./helpers/phil');
const { upsertDisplacedApproverConsultation, deriveInformedUserIds } = require('./helpers/consultations');
// Contract G5 (D-557): Level 1 consensus mechanics.
const {
  isL1ConsensusGate, trioIdsOf, getL1CollectedState,
  recordTrioApproval, clearGateApprovals
} = require('./helpers/l1-consensus');
// Contract G6 (D-565): open conditions hold approvals; returns clear them.
const { countOpenConditions, clearOpenConditionsOnReturn } = require('./helpers/gate-conditions');
// Contract GA-1 (D-579): gate assessments — collection + attempt clearing.
const { validateOrError: validateAssessmentOrError, saveAssessment, clearActiveAssessments } = require('./helpers/gate-assessments');
// Contract G8 (D-560): board gates are untouchable by the IE override.
const { isBoardTriggeredGate } = require('./helpers/board-trigger');
const { sendGateNotificationEmail } = require('./helpers/notification-email');

// D-400: gates whose approval transitions a cycle INTO a counted WIP zone.
// brief_review transitions BRIEF → DESIGN (pre_build), but Contract 20 spec §2.3
// names only go_to_build and go_to_deploy as zone-trigger gates. Honor spec.
const WIP_TRIGGER_GATES = new Set(['go_to_build', 'go_to_deploy']);

// Default WIP limits — applied when an EPO has no row in epo_wip_limits.
// Per D-400: "No row = 3/3/3 default — never unlimited".
const WIP_LIMIT_DEFAULTS = {
  pre_build:   WIP_LIMIT_PRE_BUILD,
  build:       WIP_LIMIT_BUILD,
  post_deploy: WIP_LIMIT_POST_DEPLOY
};

// Stages that count against WIP — every stage whose WIP_CATEGORY_BY_STAGE is
// non-null. Used in the count query against delivery_cycles.
const WIP_COUNTED_STAGES = Object.entries(WIP_CATEGORY_BY_STAGE)
  .filter(([, zone]) => zone !== null)
  .map(([stage]) => stage);

// Display strings for event_description (D-345 §3.1, §3.2).
const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

const STAGE_DISPLAY = {
  BRIEF:    'Brief',
  DESIGN:   'Design',
  SPEC:     'Spec',
  BUILD:    'Build',
  VALIDATE: 'Validate',
  UAT:      'UAT',
  PILOT:    'Pilot',
  RELEASE:  'Release',
  OUTCOME:  'Outcome',
  COMPLETE: 'Complete'
};

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} params.gate_name
 * @param {string} params.decision          — 'approved' | 'returned'
 * @param {string} [params.approver_notes]  — required when decision = 'returned'
 * @param {string} caller_user_id - from JWT (must be the approver)
 */
async function record_gate_decision(params, caller_user_id) {
  const { delivery_cycle_id, gate_name, decision, approver_notes } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!gate_name) {
    return { success: false, error: 'gate_name is required.' };
  }
  if (!decision) {
    return { success: false, error: 'decision is required.' };
  }
  if (!['approved', 'returned'].includes(decision)) {
    return { success: false, error: "decision must be 'approved' or 'returned'." };
  }
  if (decision === 'returned' && (!approver_notes || !approver_notes.trim())) {
    return {
      success: false,
      error: 'approver_notes are required when returning a gate. Provide the reason so the team can act on it.'
    };
  }

  // ── Fetch gate record (includes approver_user_id for permission check) ────
  const { data: gate_record, error: gateErr } = await supabase
    .from('gate_records')
    .select('gate_record_id, gate_status, approver_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_name', gate_name)
    .is('deleted_at', null)
    .single();

  if (gateErr || !gate_record) {
    return { success: false, error: `Gate record for '${gate_name}' not found on this cycle.` };
  }

  if (gate_record.gate_status === 'approved') {
    return {
      success: false,
      error: `The ${gate_name} gate has already been approved. No change made.`
    };
  }

  // ── Fetch cycle ───────────────────────────────────────────────────────────
  // assigned_epo_user_id added Contract 20 for EPO WIP check (D-400).
  // G5: trio + governance level columns for L1 consensus routing (D-557).
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, current_lifecycle_stage, workstream_id, division_id, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id, baseline_level, set_level, ai_functionality, ai_delivery_form, ai_audience')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // ── Supplement Section 1: caller must be an Admin or the gate's designated approver ──
  // Contract 19 (D-394, CC-19-01): boolean predicate; 'phil' collapsed into is_admin.
  // Build C: approver_user_id is null → Admin fallback approves.
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin, is_super_admin, is_initiative_executive, display_name')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  const isAdmin              = caller?.is_admin === true;
  // Contract 29 WS3 (D-465, CC-29-5): Phil = the super-admin. Only Phil triggers
  // the displaced-approver override — not every admin.
  const isPhil               = caller?.is_super_admin === true;
  const isDesignatedApprover = gate_record.approver_user_id === caller_user_id;
  // Captured BEFORE the gate update overwrites approver_user_id with the caller.
  const original_approver_user_id = gate_record.approver_user_id;
  const callerDisplayName    = caller?.display_name ?? 'Approver';
  const gateNameDisplay      = GATE_NAME_DISPLAY[gate_name] ?? gate_name;
  // When no approver configured, any Admin can approve (Build C default).
  const approverUnconfigured = !gate_record.approver_user_id;

  // ── Phil override (Phil 2026-07-24): data-cleanup / testing lever ─────────
  // phil_override: true routes an approval straight through the single-approver
  // transition — bypassing L1 consensus collection, open-condition holds, and
  // the over-returned-consultation reason requirement. Phil-only; the UI
  // confirms before sending; every use is event-logged.
  const philOverride = params.phil_override === true;
  if (philOverride) {
    if (!isPhil) {
      return { success: false, error: 'phil_override is available to Phil only.' };
    }
    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id,
      event_type:        'phil_override',
      event_description: `Phil override: '${gate_name}' ${decision} bypassing approval rules.`,
      actor_user_id:     caller_user_id,
      event_metadata:    { gate_name, action: 'decision_override', decision }
    });
  }

  // ── Contract G5 (D-557): Level 1 consensus route ───────────────────────────
  // L1 gates awaiting approval collect trio + consulted approvals instead of a
  // single approver decision. D-570a is retired — approver_user_id NULL is the
  // real L1 state; any single return by any collected party returns the gate
  // entirely (Checkpoint ruling 1 clearing semantics).
  if (gate_record.gate_status === 'awaiting_approval' && !philOverride && isL1ConsensusGate(cycle, gate_record)) {
    const trioIds      = trioIdsOf(cycle);
    const isTrioMember = trioIds.includes(caller_user_id);
    if (!isTrioMember && !isAdmin) {
      return {
        success: false,
        error: 'This Level 1 gate collects approvals from the Initiative trio (Domain Capability ' +
               'Strategist, Engineering Product Owner, Domain Outcome Lead) and its consulted ' +
               'parties. Only a trio member or an Admin can act on it.'
      };
    }

    if (decision === 'returned') {
      const { data: returnedGate, error: returnErr } = await supabase
        .from('gate_records')
        .update({
          gate_status:          'returned',
          approver_decision_at: new Date().toISOString(),
          approver_notes:       approver_notes || null
          // approver_user_id stays NULL — L1 has no single approver.
        })
        .eq('gate_record_id', gate_record.gate_record_id)
        .select()
        .single();
      if (returnErr) {
        return { success: false, error: `Failed to return gate: ${returnErr.message}` };
      }

      const { data: returnEvent } = await supabase
        .from('cycle_event_log')
        .insert({
          delivery_cycle_id,
          event_type:        'gate_returned',
          event_description: `${callerDisplayName} returned ${gateNameDisplay} — Level 1 return clears all collected approvals (S-A2).`,
          actor_user_id:     caller_user_id,
          event_metadata:    { gate_name, l1_consensus: true }
        })
        .select('event_id')
        .single();

      const cleared = await clearGateApprovals(gate_record.gate_record_id, returnEvent?.event_id ?? null);
      if (cleared.error) {
        console.error(JSON.stringify({
          tool_name: 'record_gate_decision', step: 'l1_clear_approvals',
          gate_record_id: gate_record.gate_record_id, error: cleared.error
        }));
      }
      // G6 (AC #5): a return clears open conditions with the approvals.
      await clearOpenConditionsOnReturn(gate_record.gate_record_id, caller_user_id);
      // GA-1 §5: a return stamps the attempt's assessments (retained, attempt-marked).
      await clearActiveAssessments(delivery_cycle_id, gate_name, returnEvent?.event_id ?? null);

      // S-A2: trio notified (the returner excluded).
      const notifyIds = trioIds.filter(id => id !== caller_user_id);
      if (notifyIds.length > 0) {
        const { data: trioRows } = await supabase
          .from('users')
          .select('id, display_name, email')
          .in('id', notifyIds)
          .is('deleted_at', null);
        const recipients = (trioRows || []).filter(u => u.email)
          .map(u => ({ email: u.email, display_name: u.display_name }));
        if (recipients.length > 0) {
          await sendGateNotificationEmail({
            recipients,
            subject:          `${cycle.cycle_title} — ${gateNameDisplay} returned`,
            initiativeName:   cycle.cycle_title,
            gateNameDisplay,
            contextParagraph: `${callerDisplayName} returned ${gateNameDisplay} for ${cycle.cycle_title}. ` +
                              `All collected approvals were cleared — the gate restarts on re-submission. ` +
                              `Return note: ${approver_notes?.trim() ?? '(none)'}`,
            delivery_cycle_id,
            email_type:       'l1_gate_returned'
          });
        }
      }

      return { success: true, data: { gate_record: returnedGate, stage_advanced: false, l1_consensus: true } };
    }

    // ── Contract GA-1 (D-579): trio-member self-assessment rides with the
    // trio approval. Required from genuine trio members; an Admin acting on
    // an L1 gate they are not trio on is on-behalf — skipped (CC-G5-02).
    let l1AssessmentItems = null;
    if (isTrioMember) {
      const v = validateAssessmentOrError(gate_name, 'trio_member', params.assessment ?? []);
      if (!v.ok) {
        return { success: false, error: `Cannot approve ${gateNameDisplay} — ${v.error}` };
      }
      l1AssessmentItems = v.items;
    }

    // decision === 'approved': record this trio-member approval; finalize only
    // when the collection completes (AC #6).
    const rec = await recordTrioApproval(gate_record.gate_record_id, caller_user_id);
    if (rec.error) {
      return { success: false, error: `Failed to record approval: ${rec.error}` };
    }
    if (rec.duplicate) {
      return { success: false, error: 'You have already approved this gate — waiting on the remaining collected parties.' };
    }

    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id,
      event_type:        'gate_trio_approved',
      event_description: `${callerDisplayName} approved ${gateNameDisplay} (Level 1 trio approval).`,
      actor_user_id:     caller_user_id,
      event_metadata:    { gate_name, l1_consensus: true }
    });

    // GA-1: persist the trio-member assessment (non-fatal after the approval).
    if (l1AssessmentItems) {
      const saved = await saveAssessment({
        delivery_cycle_id, gate_key: gate_name,
        respondent_user_id: caller_user_id, respondent_role: 'trio_member',
        items: l1AssessmentItems
      });
      if (saved.error) {
        console.error(JSON.stringify({
          tool_name: 'record_gate_decision', step: 'save_trio_assessment',
          delivery_cycle_id, gate_name, error: saved.error
        }));
      }
    }

    const state = await getL1CollectedState(gate_record.gate_record_id, cycle);
    if (state.error) {
      return { success: false, error: state.error };
    }

    // G6 (D-565): open conditions hold the gate even when the collection is
    // otherwise complete — the last approval waits until they resolve.
    const openConditions = await countOpenConditions(gate_record.gate_record_id);

    if (!state.allCollected || openConditions.count > 0) {
      return {
        success: true,
        data: {
          gate_record:   { ...gate_record, gate_status: 'awaiting_approval' },
          stage_advanced: false,
          l1_consensus:  true,
          l1_pending: {
            pending_trio_user_ids:      state.pendingTrioIds,
            pending_consulted_user_ids: state.pendingConsultedIds,
            open_conditions_count:      openConditions.count
          }
        }
      };
    }

    const transition = await applyGateApprovalTransition({
      delivery_cycle_id, gate_name, gate_record, cycle,
      actor_user_id: caller_user_id,
      actorDisplayName: callerDisplayName,
      approver_user_id_for_record: null,   // L1: no single approver (D-570a retired)
      approver_notes: null
    });
    if (transition.error) {
      return { success: false, error: transition.error };
    }
    return { success: true, data: { ...transition.data, l1_consensus: true, l1_completed: true } };
  }

  // ── Contract G8 (D-560): Initiative Executive loud override ────────────────
  // An IE (or Phil) may approve any non-board gate at any time as a release
  // valve. Maximally loud: distinct approval type, one-line reason required,
  // assigned approver notified, activity event, countable.
  const isIE       = caller?.is_initiative_executive === true;
  const ieOverride = params.ie_override === true;
  if (ieOverride) {
    if (!isIE && !isPhil) {
      return { success: false, error: 'The Initiative Executive override requires the Initiative Executive role or Phil.' };
    }
    if (decision !== 'approved') {
      return { success: false, error: 'The Initiative Executive override is an approval action — use Return for pushback.' };
    }
    if (!params.override_reason || !String(params.override_reason).trim()) {
      return { success: false, error: 'A one-line reason is required for an Initiative Executive override (D-560).' };
    }
    if (isBoardTriggeredGate(cycle, gate_name)) {
      return {
        success: false,
        error: 'This gate carries the AI Production Board requirement — board gates cannot be overridden (D-560, untouchable).'
      };
    }
  }

  if (!isAdmin && !isDesignatedApprover && !ieOverride) {
    const reason = approverUnconfigured
      ? 'No approver has been configured for this gate — an Admin is the default approver.'
      : 'You are not the designated approver for this gate.';
    return {
      success: false,
      error: `You do not have authority to approve or return this gate. ${reason}`
    };
  }

  // ── Contract G8 (D-569): approving over a returned consultation ────────────
  // Any approver may — but the act is maximally loud: mandatory reason,
  // distinct marker, returning party notified with the reasoning, DL
  // auto-notified on content-triggered cases (Q4-Security; Compliance
  // pre-deploy). Applies to normal approvals and IE overrides alike.
  let returnedConsultations = [];
  if (decision === 'approved') {
    const { data: declinedRows } = await supabase
      .from('gate_consultations')
      .select('id, consulted_user_id, response, notes')
      .eq('gate_record_id', gate_record.gate_record_id)
      .eq('response', 'declined');
    returnedConsultations = declinedRows || [];
    const overReturnedReason = (params.over_returned_reason ?? params.override_reason ?? '').trim();
    if (returnedConsultations.length > 0 && !overReturnedReason && !philOverride) {
      return {
        success: false,
        error: 'RETURNED_CONSULTATION_REQUIRES_REASON',
        data: {
          code: 'RETURNED_CONSULTATION_REQUIRES_REASON',
          returned_consultation_user_ids: returnedConsultations.map(r => r.consulted_user_id),
          message: 'A consulted party returned this gate. Approving over a returned consultation ' +
                   'requires your reasoning — it is recorded on the gate face and the returning ' +
                   'party is notified (D-569).'
        }
      };
    }
  }

  // ── On return: record, append event, clear collected approvals, exit ──────
  // D-345 §3.2: approver_notes lives on gate_record only — never duplicated
  // into event log. G5 (Checkpoint ruling 1): a return clears the gate's
  // collected gate_approvals rows (the G2 'assigned' dual-writes) — cleared,
  // never deleted.
  if (decision === 'returned') {
    const { data: returned_gate, error: returnErr } = await supabase
      .from('gate_records')
      .update({
        gate_status:          'returned',
        approver_user_id:     caller_user_id,
        approver_decision_at: new Date().toISOString(),
        approver_notes:       approver_notes || null
      })
      .eq('gate_record_id', gate_record.gate_record_id)
      .select()
      .single();
    if (returnErr) {
      return { success: false, error: `Failed to record gate decision: ${returnErr.message}` };
    }

    const { data: returnEvent } = await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'gate_returned',
        event_description: `${callerDisplayName} returned ${gateNameDisplay} for revision.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, approver_user_id: caller_user_id }
      })
      .select('event_id')
      .single();

    const cleared = await clearGateApprovals(gate_record.gate_record_id, returnEvent?.event_id ?? null);
    if (cleared.error) {
      console.error(JSON.stringify({
        tool_name: 'record_gate_decision', step: 'clear_approvals_on_return',
        gate_record_id: gate_record.gate_record_id, error: cleared.error
      }));
    }
    // G6 (AC #5): a return clears open conditions with the approvals.
    await clearOpenConditionsOnReturn(gate_record.gate_record_id, caller_user_id);
    // GA-1 §5: a return stamps the attempt's assessments (retained, attempt-marked).
    await clearActiveAssessments(delivery_cycle_id, gate_name, returnEvent?.event_id ?? null);

    return { success: true, data: { gate_record: returned_gate, stage_advanced: false } };
  }

  // ── G6 (D-565): open conditions hold the approval — "nearly there — fix
  // these" must be satisfied (or resolved by the approver) before approving.
  if (!philOverride) {
    const openConditions = await countOpenConditions(gate_record.gate_record_id);
    if (openConditions.count > 0) {
      return {
        success: false,
        error: `This gate has ${openConditions.count} open condition${openConditions.count === 1 ? '' : 's'}. ` +
               'Resolve the conditions (the gate panel lists them), then approve — or return the gate instead.'
      };
    }
  }

  // ── Contract GA-1 (D-579): approver self-assessment (single-approver route).
  // Required from the DESIGNATED approver; skipped for IE-override,
  // phil_override, and an Admin approving via the fallback (on-behalf —
  // CC-GA1 lean). Validated before the transition; saved after it succeeds.
  let approverAssessmentItems = null;
  if (isDesignatedApprover && !ieOverride && !philOverride) {
    const v = validateAssessmentOrError(gate_name, 'approver', params.assessment ?? []);
    if (!v.ok) {
      return { success: false, error: `Cannot approve ${gateNameDisplay} — ${v.error}` };
    }
    approverAssessmentItems = v.items;
  } else if (Array.isArray(params.assessment) && params.assessment.length > 0 && !ieOverride && !philOverride) {
    const v = validateAssessmentOrError(gate_name, 'approver', params.assessment);
    if (!v.ok) { return { success: false, error: v.error }; }
    approverAssessmentItems = v.items;
  }

  // ── Approved: shared approval transition (G5 extraction — also used by the
  // L1 consensus route above and record_consultation_response's L1 last-piece).
  const transition = await applyGateApprovalTransition({
    delivery_cycle_id, gate_name, gate_record, cycle,
    actor_user_id: caller_user_id,
    actorDisplayName: callerDisplayName,
    approver_user_id_for_record: caller_user_id,
    approver_notes: approver_notes || null,
    isPhil,
    original_approver_user_id
  });
  if (transition.error) {
    return { success: false, error: transition.error };
  }

  // GA-1: persist the approver assessment (non-fatal after the transition).
  if (approverAssessmentItems) {
    const savedAssessment = await saveAssessment({
      delivery_cycle_id, gate_key: gate_name,
      respondent_user_id: caller_user_id, respondent_role: 'approver',
      items: approverAssessmentItems
    });
    if (savedAssessment.error) {
      console.error(JSON.stringify({
        tool_name: 'record_gate_decision', step: 'save_approver_assessment',
        delivery_cycle_id, gate_name, error: savedAssessment.error
      }));
    }
  }

  // ── Contract G8 loud-override + D-569 marker side effects ──────────────────
  const overReturned = returnedConsultations.length > 0;
  if (ieOverride || overReturned) {
    const reasonNote = String(params.override_reason ?? params.over_returned_reason ?? '').trim() || null;
    await supabase.from('gate_approvals').insert({
      gate_record_id:             gate_record.gate_record_id,
      approver_user_id:           caller_user_id,
      approval_type:              ieOverride ? 'ie_override' : 'assigned',
      over_returned_consultation: overReturned,
      reason_note:                reasonNote
    });
  }

  if (ieOverride) {
    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id,
      event_type:        'gate_ie_override',
      event_description: `${callerDisplayName} approved ${gateNameDisplay} as Initiative Executive override. Reason: ${String(params.override_reason).trim()}`,
      actor_user_id:     caller_user_id,
      event_metadata:    { gate_name, original_approver_user_id, override_reason: String(params.override_reason).trim() }
    });
    if (original_approver_user_id && original_approver_user_id !== caller_user_id) {
      const { data: displaced } = await supabase
        .from('users')
        .select('display_name, email')
        .eq('id', original_approver_user_id)
        .is('deleted_at', null)
        .maybeSingle();
      if (displaced?.email) {
        await sendGateNotificationEmail({
          recipients:       [{ email: displaced.email, display_name: displaced.display_name }],
          subject:          `${cycle.cycle_title} — ${gateNameDisplay} approved by Initiative Executive override`,
          initiativeName:   cycle.cycle_title,
          gateNameDisplay,
          contextParagraph: `${callerDisplayName} approved ${gateNameDisplay} for ${cycle.cycle_title} ` +
                            `as an Initiative Executive override. You were the assigned approver. ` +
                            `Reason: ${String(params.override_reason).trim()}`,
          delivery_cycle_id,
          email_type:       'ie_override'
        });
      }
    }
  }

  if (overReturned) {
    const overReason = String(params.over_returned_reason ?? params.override_reason ?? '').trim();
    const returningIds = returnedConsultations.map(r => r.consulted_user_id);
    const { data: returningRows } = await supabase
      .from('users')
      .select('id, display_name, email')
      .in('id', returningIds)
      .is('deleted_at', null);
    const returningNames = (returningRows || []).map(u => u.display_name).join(', ');

    // D-569 (1): the distinct visible marker — gate face, feed, panel all read
    // from the event + approval row written above.
    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id,
      event_type:        'approved_over_returned_consultation',
      event_description: `Approved over returned consultation — ${returningNames || 'a consulted party'} (${gateNameDisplay}). Reason: ${overReason}`,
      actor_user_id:     caller_user_id,
      event_metadata:    { gate_name, returning_user_ids: returningIds, reason: overReason }
    });

    // D-569 (3): returning parties notified with the approver's reasoning.
    const recipients = (returningRows || []).filter(u => u.email)
      .map(u => ({ email: u.email, display_name: u.display_name }));
    if (recipients.length > 0) {
      await sendGateNotificationEmail({
        recipients,
        subject:          `${cycle.cycle_title} — ${gateNameDisplay} approved over your returned consultation`,
        initiativeName:   cycle.cycle_title,
        gateNameDisplay,
        contextParagraph: `${callerDisplayName} approved ${gateNameDisplay} for ${cycle.cycle_title} over your ` +
                          `returned consultation. Reasoning: ${overReason}. You may escalate to the Division ` +
                          `Leader or an Initiative Executive, or seek consultation-required standing on the next gate.`,
        delivery_cycle_id,
        email_type:       'approved_over_returned_consultation'
      });
    }

    // D-569 (5): content-triggered cases auto-notify the Division Leader
    // (Security on Q4-triggered work; Compliance pre-deploy — CC-G8 lean on
    // membership-based detection until G9 suggestion provenance exists).
    const triggered = await hasContentTriggeredReturn(delivery_cycle_id, gate_name, returningIds);
    if (triggered && cycle.division_id) {
      const { data: division } = await supabase
        .from('divisions')
        .select('owner_user_id')
        .eq('id', cycle.division_id)
        .is('deleted_at', null)
        .maybeSingle();
      if (division?.owner_user_id) {
        const { data: dl } = await supabase
          .from('users')
          .select('display_name, email')
          .eq('id', division.owner_user_id)
          .is('deleted_at', null)
          .maybeSingle();
        if (dl?.email) {
          await sendGateNotificationEmail({
            recipients:       [{ email: dl.email, display_name: dl.display_name }],
            subject:          `${cycle.cycle_title} — content-triggered consultation overridden at ${gateNameDisplay}`,
            initiativeName:   cycle.cycle_title,
            gateNameDisplay,
            contextParagraph: `${callerDisplayName} approved ${gateNameDisplay} for ${cycle.cycle_title} over a ` +
                              `returned content-triggered consultation (${returningNames}). You are notified as ` +
                              `Division Leader (D-569 clause 5). Reasoning: ${overReason}`,
            delivery_cycle_id,
            email_type:       'dl_override_notification'
          });
        }
      }
    }
  }

  return { success: true, data: { ...transition.data, ...(ieOverride ? { ie_override: true } : {}), ...(overReturned ? { approved_over_returned_consultation: true } : {}) } };
}

/**
 * G8 (D-569 clause 5): does any returning party represent a content trigger —
 * Security membership on Q4-flagged work, or Compliance membership at the
 * pre-deploy gate?
 */
async function hasContentTriggeredReturn(delivery_cycle_id, gate_name, returningIds) {
  if (!returningIds || returningIds.length === 0) { return false; }
  const { data: sizing } = await supabase
    .from('initiative_sizing')
    .select('q4_security_impact')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .maybeSingle();
  const { data: groups } = await supabase
    .from('specialty_groups')
    .select('group_id, group_name')
    .in('group_name', ['Security', 'Compliance']);
  if (!groups || groups.length === 0) { return false; }
  const { data: memberships } = await supabase
    .from('specialty_group_members')
    .select('group_id, user_id')
    .in('group_id', groups.map(g => g.group_id))
    .in('user_id', returningIds)
    .is('deleted_at', null);
  const groupNameById = {};
  groups.forEach(g => { groupNameById[g.group_id] = g.group_name; });
  for (const m of memberships || []) {
    const name = groupNameById[m.group_id];
    if (name === 'Security' && sizing?.q4_security_impact === true) { return true; }
    if (name === 'Compliance' && gate_name === 'go_to_deploy') { return true; }
  }
  return false;
}

/**
 * Contract G5 — the gate approval transition, extracted so the L1 consensus
 * route (this tool) and record_consultation_response's L1 last-piece can run
 * the identical machinery: gate update, milestone actual date, stage advance,
 * events, Phil displaced-approver override (D-465), Informed notifications
 * (G4), EPO WIP warning (D-400), artifact suggestion warnings (D-438).
 * approver_user_id_for_record is NULL at L1 (D-570a retired).
 * Returns { data } or { error }.
 */
async function applyGateApprovalTransition({
  delivery_cycle_id, gate_name, gate_record, cycle,
  actor_user_id, actorDisplayName,
  approver_user_id_for_record, approver_notes,
  isPhil = false, original_approver_user_id = null
}) {
  const caller_user_id    = actor_user_id;
  const callerDisplayName = actorDisplayName;
  const gateNameDisplay   = GATE_NAME_DISPLAY[gate_name] ?? gate_name;

  const { data: updated_gate, error: updateErr } = await supabase
    .from('gate_records')
    .update({
      gate_status:          'approved',
      approver_user_id:     approver_user_id_for_record,
      approver_decision_at: new Date().toISOString(),
      approver_notes:       approver_notes || null
    })
    .eq('gate_record_id', gate_record.gate_record_id)
    .select()
    .single();

  if (updateErr) {
    return { error: `Failed to record gate decision: ${updateErr.message}` };
  }

  // ── On approval: record actual_date on milestone and advance stage ────────
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { error: milestoneErr } = await supabase
    .from('cycle_milestone_dates')
    .update({
      actual_date: today,
      date_status: 'complete'
    })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_name', gate_name)
    .is('deleted_at', null);

  if (milestoneErr) {
    // Non-fatal — gate is approved, log the issue
    console.error(JSON.stringify({
      tool_name:         'record_gate_decision',
      delivery_cycle_id,
      gate_name,
      error:             `Milestone date update failed: ${milestoneErr.message}`
    }));
  }

  // ── Advance stage if this gate is a gating transition ─────────────────────
  // Find which stage this gate unlocks (value in GATE_REQUIRED_TO_ENTER)
  const target_stage = Object.entries(GATE_REQUIRED_TO_ENTER)
    .find(([, g]) => g === gate_name)?.[0];

  let stage_advanced = false;
  let new_stage      = cycle.current_lifecycle_stage;

  if (target_stage && cycle.current_lifecycle_stage === prevStageOf(target_stage)) {
    const { error: advanceErr } = await supabase
      .from('delivery_cycles')
      .update({ current_lifecycle_stage: target_stage })
      .eq('delivery_cycle_id', delivery_cycle_id);

    if (!advanceErr) {
      stage_advanced = true;
      new_stage      = target_stage;
    }
  }

  // ── Append approval event(s) — D-345 §3.2: two entries on approval ───────
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'gate_approved',
      event_description: `${callerDisplayName} approved ${gateNameDisplay}.`,
      actor_user_id:     caller_user_id,
      event_metadata:    { gate_name, approver_user_id: caller_user_id }
    });

  if (stage_advanced) {
    const newStageDisplay = STAGE_DISPLAY[new_stage] ?? new_stage;
    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'stage_advanced',
        event_description: `Delivery Cycle advanced to ${newStageDisplay}.`,
        actor_user_id:     null, // system entry
        event_metadata:    {
          prior_stage: cycle.current_lifecycle_stage,
          new_stage,
          gate_name
        }
      });
  }

  // ── WS3 (D-465): Phil super-approver override ─────────────────────────────
  // When Phil approves a gate whose stored approver was someone else, convert
  // the displaced approver to a Consulted party (pending response), log the
  // override, and email them. The gate update above already set
  // approver_user_id = Phil. Scoped to the approval path per spec ("Before
  // executing approval"). original_approver_user_id was captured pre-update.
  if (isPhil && original_approver_user_id && original_approver_user_id !== caller_user_id) {
    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'approver_overridden',
        event_description: `${callerDisplayName} overrode the assigned approver for ${gateNameDisplay}.`,
        actor_user_id:     caller_user_id,
        event_metadata:    {
          gate_name,
          original_approver_user_id,
          overridden_by: caller_user_id
        }
      });

    // Convert displaced approver to Consulted (leaves any existing response as-is).
    await upsertDisplacedApproverConsultation({
      gate_record_id:    gate_record.gate_record_id,
      consulted_user_id: original_approver_user_id
    });

    // WS4: notify the displaced approver that they are now a consulted party.
    const { data: displaced } = await supabase
      .from('users')
      .select('display_name, email')
      .eq('id', original_approver_user_id)
      .is('deleted_at', null)
      .maybeSingle();
    if (displaced?.email) {
      await sendGateNotificationEmail({
        recipients:       [{ email: displaced.email, display_name: displaced.display_name }],
        subject:          `${cycle.cycle_title} — ${gateNameDisplay} approved by ${callerDisplayName}`,
        initiativeName:   cycle.cycle_title,
        gateNameDisplay,
        contextParagraph: `${callerDisplayName} approved ${gateNameDisplay} for ${cycle.cycle_title}. ` +
                          `You were the assigned approver and have been added as a consulted party — your review is still welcome.`,
        delivery_cycle_id,
        email_type:       'approver_override'
      });
    }
  }

  // ── Contract G4 (D-564): Informed parties receive gate decisions via the
  // existing notification channel. Awareness only — never in waiting-on. The
  // decision-maker is excluded; failures are non-fatal (decision already stands).
  try {
    const informedIds = (await deriveInformedUserIds(delivery_cycle_id))
      .filter(id => id !== caller_user_id);
    if (informedIds.length > 0) {
      const { data: informedRows } = await supabase
        .from('users')
        .select('id, display_name, email')
        .in('id', informedIds)
        .is('deleted_at', null);
      const informedRecipients = (informedRows || []).filter(u => u.email && u.is_active !== false)
        .map(u => ({ email: u.email, display_name: u.display_name }));
      if (informedRecipients.length > 0) {
        // Inside the approval transition the decision is always 'approved'
        // (returns exit before this function — G5 refactor).
        const decisionWord = 'approved';
        await sendGateNotificationEmail({
          recipients:       informedRecipients,
          subject:          `${cycle.cycle_title} — ${gateNameDisplay} ${decisionWord}`,
          initiativeName:   cycle.cycle_title,
          gateNameDisplay,
          contextParagraph: `${callerDisplayName} ${decisionWord} ${gateNameDisplay} for ${cycle.cycle_title}. ` +
                            `You are receiving this as an Informed party on the Initiative.`,
          delivery_cycle_id,
          email_type:       'informed_gate_decision'
        });
      }
    }
  } catch (informedErr) {
    console.error(JSON.stringify({
      tool_name: 'record_gate_decision', step: 'informed_notification',
      delivery_cycle_id, error: informedErr?.message ?? String(informedErr)
    }));
  }

  // ── EPO WIP check (D-400, Contract 20) ────────────────────────────────────
  // Net-new behavior per CC-20-02 / CC-20-04: no workstream WIP check ever
  // existed in this tool. Fires only when:
  //   1. gate is go_to_build or go_to_deploy (zone-trigger gates per spec §2.3)
  //   2. stage actually advanced (skip if already at target stage)
  //   3. cycle has assigned_epo_user_id (null → skip per spec)
  // Warning is advisory — gate approval still succeeds. Angular surfaces
  // D-200 Pattern 2 (amber) using this payload.
  let wip_warning = null;

  if (stage_advanced
      && WIP_TRIGGER_GATES.has(gate_name)
      && cycle.assigned_epo_user_id) {
    wip_warning = await computeEpoWipWarning({
      epo_user_id: cycle.assigned_epo_user_id,
      new_stage,
      this_cycle_id: delivery_cycle_id
    });
  }

  // ── D-438 (Contract 25): artifact suggestion warnings on approval ─────────
  // Shared computation lives in helpers/artifact-warnings (CC-24-07 follow-up).
  // Wire shape is artifact_type_name[] — preserves the Angular gate-record
  // modal contract. Approval status is unchanged regardless.
  // Run 2 F-1 fix (Checkpoint 2026-07-23 ruling 2): the old `=== 'approve'`
  // comparison never matched the 'approved'|'returned' domain, so
  // suggestion_warnings silently never computed on approval. Inside this
  // transition the decision is always 'approved' — compute unconditionally.
  const warningEntries = await computeArtifactSuggestionWarnings(delivery_cycle_id, gate_name);
  const suggestion_warnings = warningEntries.map(w => w.artifact_type_name);

  return {
    data: {
      gate_record:    updated_gate,
      stage_advanced,
      new_stage,
      wip_warning,            // null when no warning applies; object when at/over limit
      suggestion_warnings     // [] when no gaps; ['Artifact Type Name', ...] otherwise
    }
  };
}

/**
 * Compute the WIP warning payload for the EPO who owns the just-advanced cycle.
 * Returns null if the EPO's count in the new stage's zone is below limit.
 * Returns { zone, count, limit, epo_user_id, epo_display_name, message }
 * when count >= limit (D-200 Pattern 2 trigger).
 *
 * @param {object} args
 * @param {string} args.epo_user_id    — owner EPO from delivery_cycles
 * @param {string} args.new_stage      — lifecycle stage the cycle just entered
 * @param {string} args.this_cycle_id  — the just-advanced cycle (included in count)
 */
async function computeEpoWipWarning({ epo_user_id, new_stage, this_cycle_id }) {
  const zone = WIP_CATEGORY_BY_STAGE[new_stage];
  if (!zone) {
    // Stage is not in any counted zone — should not happen for trigger gates,
    // but guard anyway. No warning.
    return null;
  }

  // Resolve the EPO's limit. Missing row → 3/3/3 default per D-400.
  const { data: limitRow } = await supabase
    .from('epo_wip_limits')
    .select('pre_build_limit, build_limit, post_deploy_limit')
    .eq('user_id', epo_user_id)
    .maybeSingle();

  const limit =
    zone === 'pre_build'   ? (limitRow?.pre_build_limit   ?? WIP_LIMIT_DEFAULTS.pre_build)   :
    zone === 'build'       ? (limitRow?.build_limit       ?? WIP_LIMIT_DEFAULTS.build)       :
    zone === 'post_deploy' ? (limitRow?.post_deploy_limit ?? WIP_LIMIT_DEFAULTS.post_deploy) :
    null;

  if (limit === null) {
    return null;
  }

  // Count Initiatives assigned to this EPO that resolve to this WIP zone.
  // D-WIPLimit amendment 2026-06-15: getCycleWipZone resolves BRIEF →
  // pre_build and resolves ON_HOLD via pre_hold_lifecycle_stage. We fetch
  // the EPO's active cycles and filter in JS rather than issuing a complex
  // SQL OR to keep the zone logic in one place (lifecycle.getCycleWipZone).
  const { data: epoCycles, error: countErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, current_lifecycle_stage, pre_hold_lifecycle_stage')
    .eq('assigned_epo_user_id', epo_user_id)
    .not('current_lifecycle_stage', 'in', '("COMPLETE","CANCELLED")')
    .is('deleted_at', null);

  const count = (epoCycles ?? []).filter(c => getCycleWipZone(c) === zone).length;

  if (countErr) {
    // Non-fatal — log and skip warning rather than break gate approval.
    console.error(JSON.stringify({
      tool_name: 'record_gate_decision',
      step:      'computeEpoWipWarning',
      epo_user_id,
      zone,
      error:     countErr.message
    }));
    return null;
  }

  if ((count ?? 0) < limit) {
    return null;
  }

  // At or over limit — build advisory warning. Look up display name for UI.
  const { data: epo } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', epo_user_id)
    .is('deleted_at', null)
    .maybeSingle();

  const zoneDisplay =
    zone === 'pre_build'   ? 'Pre-Build'   :
    zone === 'build'       ? 'Build'       :
    zone === 'post_deploy' ? 'Post-Deploy' :
    zone;

  return {
    zone,
    zone_display: zoneDisplay,
    count: count ?? 0,
    limit,
    epo_user_id,
    epo_display_name: epo?.display_name ?? 'EPO',
    message: `${epo?.display_name ?? 'This EPO'} now has ${count} Initiatives in the ${zoneDisplay} zone — at or over the limit of ${limit}.`
  };
}

/**
 * Returns the stage that immediately precedes target_stage in GATE_REQUIRED_TO_ENTER map.
 * Used to verify the cycle is in the right position before advancing.
 */
function prevStageOf(target_stage) {
  const { STAGE_SEQUENCE } = require('../lifecycle');
  const idx = STAGE_SEQUENCE.indexOf(target_stage);
  if (idx <= 0) return null;
  return STAGE_SEQUENCE[idx - 1];
}

module.exports = { record_gate_decision, applyGateApprovalTransition };
