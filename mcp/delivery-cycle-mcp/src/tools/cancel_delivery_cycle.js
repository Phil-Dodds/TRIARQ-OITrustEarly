// cancel_delivery_cycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Marks an Initiative as CANCELLED. Preserves the current lifecycle stage
// in pre_hold_lifecycle_stage so uncancel_delivery_cycle can restore it.
// Uses pre_hold_lifecycle_stage as a shared "preserved prior stage" column —
// a cycle cannot simultaneously be ON_HOLD and CANCELLED, so reuse is safe.
//
// Guards:
//   - Cannot cancel a cycle that is already CANCELLED.
//   - Cannot cancel a cycle that is COMPLETE (terminal).
//
// Returns the updated cycle row. Detail panel re-queries via get_delivery_cycle
// after this call (loadCycle pattern) so the full enriched cycle is rebuilt.
//
// Source: D-108 lifecycle stages; S-009 cancelled-item visibility.

'use strict';

const { supabase } = require('../db');

async function cancel_delivery_cycle(params, caller_user_id) {
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

  if (cycle.current_lifecycle_stage === 'CANCELLED') {
    return {
      success: false,
      error: `"${cycle.cycle_title}" is already CANCELLED. Use Un-cancel to restore it.`
    };
  }
  if (cycle.current_lifecycle_stage === 'COMPLETE') {
    return {
      success: false,
      error: `"${cycle.cycle_title}" is COMPLETE and cannot be cancelled.`
    };
  }

  const priorStage = cycle.current_lifecycle_stage;

  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update({
      pre_hold_lifecycle_stage: priorStage,
      current_lifecycle_stage:  'CANCELLED'
    })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to cancel Initiative: ${updateErr.message}` };
  }

  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'cycle_cancelled',
      event_description: `Initiative cancelled from ${priorStage}.`,
      actor_user_id:     caller_user_id,
      event_metadata:    { prior_stage: priorStage }
    });

  return { success: true, data: updated };
}

module.exports = { cancel_delivery_cycle };
