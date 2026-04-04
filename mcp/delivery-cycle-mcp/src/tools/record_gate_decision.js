// record_gate_decision.js
// Pathways OI Trust — delivery-cycle-mcp
// Records an approver decision (approved or returned) on a gate_record.
// On approval:
//   - Sets gate_status = 'approved'
//   - Sets actual_date on the corresponding cycle_milestone_dates row to today
//   - Sets date_status = 'complete' on that milestone
//   - Advances the cycle to the next stage (same logic as advance_cycle_stage)
//   - Appends event log entry
// On return:
//   - Sets gate_status = 'returned'
//   - Requires approver_notes
//   - Appends event log entry
// Build C: approver defaults to Phil's user_id (see spec Section 4.2). RACI-configured
// approver assignment is Build B.
// Supplement Section 1: caller must be Phil or the gate's designated approver_user_id.
// Source: D-154, ARCH-12, build-c-spec Section 4.1, supplement Section 1

'use strict';

const { supabase }  = require('../db');
const { GATE_REQUIRED_TO_ENTER, nextStage } = require('../lifecycle');

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
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, current_lifecycle_stage, workstream_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // ── Supplement Section 1: caller must be Phil or the gate's designated approver ──
  // Build C: approver_user_id is null → Phil approves. Build B wires RACI-configured approvers.
  const { data: caller } = await supabase
    .from('users')
    .select('system_role')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  const isPhil              = caller?.system_role === 'phil';
  const isDesignatedApprover = gate_record.approver_user_id === caller_user_id;
  // When no approver configured, Phil is the fallback (Build C default)
  const approverUnconfigured = !gate_record.approver_user_id;

  if (!isPhil && !isDesignatedApprover) {
    const reason = approverUnconfigured
      ? 'No approver has been configured for this gate — Phil is the default approver.'
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
  if (decision === 'returned') {
    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'gate_returned',
        event_description: `Gate '${gate_name}' returned by approver. Reason: ${approver_notes.trim()}`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, approver_notes }
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

  // ── Append approval event ─────────────────────────────────────────────────
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'gate_approved',
      event_description: `Gate '${gate_name}' approved.${stage_advanced ? ` Cycle advanced to ${new_stage}.` : ''}`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        gate_name,
        actual_date:   today,
        stage_advanced,
        prior_stage:   cycle.current_lifecycle_stage,
        new_stage
      }
    });

  return {
    success: true,
    data: {
      gate_record:    updated_gate,
      stage_advanced,
      new_stage
    }
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
