// resume_cycle_from_hold.js
// Pathways OI Trust — delivery-cycle-mcp
// Returns a Delivery Cycle from ON_HOLD to the stage it was in before being held.
//
// Reads pre_hold_lifecycle_stage (set by set_cycle_on_hold) and restores it as
// current_lifecycle_stage, then clears pre_hold_lifecycle_stage to null.
//
// Cannot be called if cycle is not currently ON_HOLD.
// Source: D-108, migration 024 (pre_hold_lifecycle_stage column)

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string}  params.delivery_cycle_id
 * @param {string}  caller_user_id - from JWT
 */
async function resume_cycle_from_hold(params, caller_user_id) {
  const { delivery_cycle_id } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  // ── Fetch cycle ───────────────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, current_lifecycle_stage, pre_hold_lifecycle_stage')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  const { current_lifecycle_stage, pre_hold_lifecycle_stage } = cycle;

  // ── Guard: must be ON_HOLD ────────────────────────────────────────────────
  if (current_lifecycle_stage !== 'ON_HOLD') {
    return {
      success: false,
      error: `"${cycle.cycle_title}" is not ON_HOLD (current stage: ${current_lifecycle_stage}). Only ON_HOLD cycles can be resumed.`
    };
  }

  // ── Guard: pre_hold_lifecycle_stage must be populated ─────────────────────
  if (!pre_hold_lifecycle_stage) {
    return {
      success: false,
      error: `"${cycle.cycle_title}" is ON_HOLD but has no recorded prior stage. This cycle may have been placed ON_HOLD before migration 024. A Division Admin must manually set the lifecycle stage using the update_cycle_stage tool.`
    };
  }

  // ── Restore prior stage ───────────────────────────────────────────────────
  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update({
      current_lifecycle_stage:  pre_hold_lifecycle_stage,
      pre_hold_lifecycle_stage: null
    })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to resume cycle from hold: ${updateErr.message}` };
  }

  // ── Append event log ──────────────────────────────────────────────────────
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'cycle_resumed_from_hold',
      event_description: `Cycle resumed from ON_HOLD, returning to ${pre_hold_lifecycle_stage}.`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        resumed_to_stage: pre_hold_lifecycle_stage
      }
    });

  return {
    success: true,
    data: {
      prior_stage:             'ON_HOLD',
      current_lifecycle_stage: pre_hold_lifecycle_stage,
      cycle:                   updated
    }
  };
}

module.exports = { resume_cycle_from_hold };
