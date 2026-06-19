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
const { upsertDisplacedApproverConsultation } = require('./helpers/consultations');
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
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, current_lifecycle_stage, workstream_id, assigned_epo_user_id')
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
    .select('is_admin, is_super_admin, display_name')
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

  if (!isAdmin && !isDesignatedApprover) {
    const reason = approverUnconfigured
      ? 'No approver has been configured for this gate — an Admin is the default approver.'
      : 'You are not the designated approver for this gate.';
    return {
      success: false,
      error: `You do not have authority to approve or return this gate. ${reason}`
    };
  }

  // ── Record the gate decision ──────────────────────────────────────────────
  const { data: updated_gate, error: updateErr } = await supabase
    .from('gate_records')
    .update({
      gate_status:          decision,
      approver_user_id:     caller_user_id,
      approver_decision_at: new Date().toISOString(),
      approver_notes:       approver_notes || null
    })
    .eq('gate_record_id', gate_record.gate_record_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to record gate decision: ${updateErr.message}` };
  }

  // ── On return: append event and exit ─────────────────────────────────────
  // D-345 §3.2: approver_notes lives on gate_record only — never duplicated into event log.
  if (decision === 'returned') {
    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'gate_returned',
        event_description: `${callerDisplayName} returned ${gateNameDisplay} for revision.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, approver_user_id: caller_user_id }
      });

    return { success: true, data: { gate_record: updated_gate, stage_advanced: false } };
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
  let suggestion_warnings = [];
  if (decision === 'approve') {
    const warningEntries = await computeArtifactSuggestionWarnings(delivery_cycle_id, gate_name);
    suggestion_warnings = warningEntries.map(w => w.artifact_type_name);
  }

  return {
    success: true,
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

module.exports = { record_gate_decision };
