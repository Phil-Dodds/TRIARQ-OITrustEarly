// set_cycle_on_hold.js
// Pathways OI Trust — delivery-cycle-mcp
// Places a Delivery Cycle ON_HOLD, preserving the current stage for resumption.
//
// Stores the current lifecycle stage in pre_hold_lifecycle_stage before setting
// current_lifecycle_stage to ON_HOLD. resume_cycle_from_hold reads this field
// to return the cycle to the correct stage.
//
// Cannot be called if cycle is already ON_HOLD, CANCELLED, or COMPLETE.
// Source: D-108, migration 024 (pre_hold_lifecycle_stage column)

'use strict';

const { supabase } = require('../db');
const { TERMINAL_STAGES } = require('../lifecycle');

/**
 * @param {object} params
 * @param {string}  params.delivery_cycle_id
 * @param {string}  [params.hold_reason]    - optional free-text reason, captured in event log
 * @param {string}  caller_user_id          - from JWT
 */
async function set_cycle_on_hold(params, caller_user_id) {
  const { delivery_cycle_id, hold_reason } = params;

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

  const { current_lifecycle_stage } = cycle;

  // ── Guard: already on hold ────────────────────────────────────────────────
  if (current_lifecycle_stage === 'ON_HOLD') {
    return {
      success: false,
      error: `"${cycle.cycle_title}" is already ON_HOLD. Use resume_cycle_from_hold to return it to active progression.`
    };
  }

  // ── Guard: terminal stages cannot be held ─────────────────────────────────
  if (TERMINAL_STAGES.includes(current_lifecycle_stage)) {
    return {
      success: false,
      error: `This cycle is ${current_lifecycle_stage} and cannot be placed ON_HOLD.`
    };
  }

  // ── Store current stage and set ON_HOLD ───────────────────────────────────
  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update({
      pre_hold_lifecycle_stage: current_lifecycle_stage,
      current_lifecycle_stage:  'ON_HOLD'
    })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to place cycle ON_HOLD: ${updateErr.message}` };
  }

  // ── Append event log ──────────────────────────────────────────────────────
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'cycle_placed_on_hold',
      event_description: `Cycle placed ON_HOLD from ${current_lifecycle_stage}.${hold_reason ? ` Reason: ${hold_reason}` : ''}`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        prior_stage: current_lifecycle_stage,
        hold_reason: hold_reason || null
      }
    });

  return {
    success: true,
    data: {
      prior_stage:             current_lifecycle_stage,
      current_lifecycle_stage: 'ON_HOLD',
      pre_hold_lifecycle_stage: current_lifecycle_stage,
      cycle:                   updated
    }
  };
}

module.exports = { set_cycle_on_hold };
