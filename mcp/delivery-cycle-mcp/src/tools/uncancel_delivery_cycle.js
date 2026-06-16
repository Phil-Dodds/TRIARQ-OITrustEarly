// uncancel_delivery_cycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Restores a CANCELLED Initiative to its pre-cancel lifecycle stage.
// Reads the preserved stage from pre_hold_lifecycle_stage (shared column —
// see cancel_delivery_cycle for rationale). Falls back to 'BRIEF' if the
// preserved value is missing.
//
// Guards:
//   - Cannot uncancel a cycle that is not CANCELLED.
//
// Source: D-108 lifecycle stages; S-009 cancelled-item visibility.

'use strict';

const { supabase } = require('../db');

async function uncancel_delivery_cycle(params, caller_user_id) {
  const { delivery_cycle_id } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, current_lifecycle_stage, pre_hold_lifecycle_stage')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  if (cycle.current_lifecycle_stage !== 'CANCELLED') {
    return {
      success: false,
      error: `"${cycle.cycle_title}" is not CANCELLED — nothing to restore.`
    };
  }

  const restoreStage = cycle.pre_hold_lifecycle_stage || 'BRIEF';

  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update({
      current_lifecycle_stage:  restoreStage,
      pre_hold_lifecycle_stage: null
    })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to restore Initiative: ${updateErr.message}` };
  }

  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'cycle_uncancelled',
      event_description: `Initiative restored from CANCELLED to ${restoreStage}.`,
      actor_user_id:     caller_user_id,
      event_metadata:    { restored_to: restoreStage }
    });

  return { success: true, data: updated };
}

module.exports = { uncancel_delivery_cycle };
