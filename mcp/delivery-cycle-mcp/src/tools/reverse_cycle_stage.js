// reverse_cycle_stage.js
// Pathways OI Trust — delivery-cycle-mcp
// Regresses a Delivery Cycle one stage backward in the 12-stage lifecycle.
//
// Two-call confirmation pattern (D-179):
//   Call 1 — no confirmed param → returns warning data: target stage, gates that will
//             be reset to 'pending'. Caller must surface this to the user before committing.
//   Call 2 — confirmed: true → executes regression and gate resets.
//
// Gate reset rule (D-179): any gate that guards entry to a stage between the target
// and the current stage (inclusive on current, exclusive on target) is reset to 'pending'.
// This allows the gate workflow to be re-run after the stage returns to that position.
//
// Cannot regress from BRIEF (nothing before it), CANCELLED, or ON_HOLD.
// Source: D-108, D-179, ARCH-12

'use strict';

const { supabase } = require('../db');
const {
  TERMINAL_STAGES,
  prevStage,
  gatesResetOnRegressionTo
} = require('../lifecycle');

/**
 * @param {object} params
 * @param {string}  params.delivery_cycle_id
 * @param {boolean} [params.confirmed]          - omit for preview; true to execute
 * @param {string}  caller_user_id              - from JWT
 */
async function reverse_cycle_stage(params, caller_user_id) {
  const { delivery_cycle_id, confirmed = false } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  // ── Fetch cycle ───────────────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, current_lifecycle_stage')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  const { current_lifecycle_stage } = cycle;

  // ── Guard: cannot regress from terminal or pause states ───────────────────
  if (TERMINAL_STAGES.includes(current_lifecycle_stage)) {
    return {
      success: false,
      error: `This cycle is ${current_lifecycle_stage} and cannot be regressed.`
    };
  }

  if (current_lifecycle_stage === 'ON_HOLD') {
    return {
      success: false,
      error: 'This cycle is ON_HOLD. Use resume_cycle_from_hold to return it to active progression before regressing.'
    };
  }

  // ── Determine target stage ────────────────────────────────────────────────
  const target_stage = prevStage(current_lifecycle_stage);

  if (!target_stage) {
    return {
      success: false,
      error: `This cycle is already at ${current_lifecycle_stage} — the first stage in the lifecycle. There is no earlier stage to regress to.`
    };
  }

  // ── Identify gates that will be reset ────────────────────────────────────
  const gates_to_reset = gatesResetOnRegressionTo(target_stage, current_lifecycle_stage);

  // ── Preview (no confirmed) — return warning data, do not execute ──────────
  if (!confirmed) {
    const gate_warning = gates_to_reset.length > 0
      ? `The following gate(s) will be reset to Pending so they can be re-run: ${gates_to_reset.join(', ')}.`
      : 'No gate records will be affected by this regression.';

    return {
      success: true,
      data: {
        requires_confirmation: true,
        current_lifecycle_stage,
        target_stage,
        gates_to_reset,
        warning: `Regressing "${cycle.cycle_title}" from ${current_lifecycle_stage} to ${target_stage}. ${gate_warning} This action cannot be undone automatically — confirm to proceed.`
      }
    };
  }

  // ── Execute regression ────────────────────────────────────────────────────
  // 1. Update stage
  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update({ current_lifecycle_stage: target_stage })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to regress stage: ${updateErr.message}` };
  }

  // 2. Reset affected gate records to 'pending'
  if (gates_to_reset.length > 0) {
    const { error: gateResetErr } = await supabase
      .from('gate_records')
      .update({
        gate_status:   'pending',
        actual_date:   null,
        approved_by:   null,
        approver_notes: null,
        workstream_active_at_clearance: null
      })
      .eq('delivery_cycle_id', delivery_cycle_id)
      .in('gate_name', gates_to_reset)
      .is('deleted_at', null);

    if (gateResetErr) {
      // Stage was already updated — log the gate reset failure but do not reverse the stage.
      // Surface the partial failure so the operator can manually correct gate records.
      console.error(JSON.stringify({
        tool_name:         'reverse_cycle_stage',
        delivery_cycle_id,
        error:             `Gate reset partial failure: ${gateResetErr.message}`,
        gates_to_reset
      }));
      return {
        success: false,
        error: `Stage was regressed to ${target_stage} but gate record reset failed: ${gateResetErr.message}. Review gate records for: ${gates_to_reset.join(', ')}.`
      };
    }
  }

  // 3. Append event log
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'stage_regressed',
      event_description: `Cycle regressed from ${current_lifecycle_stage} to ${target_stage}.${gates_to_reset.length > 0 ? ` Gate(s) reset to Pending: ${gates_to_reset.join(', ')}.` : ''}`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        prior_stage:    current_lifecycle_stage,
        new_stage:      target_stage,
        gates_reset:    gates_to_reset
      }
    });

  return {
    success: true,
    data: {
      prior_stage:             current_lifecycle_stage,
      current_lifecycle_stage: target_stage,
      gates_reset:             gates_to_reset,
      cycle:                   updated
    }
  };
}

module.exports = { reverse_cycle_stage };
