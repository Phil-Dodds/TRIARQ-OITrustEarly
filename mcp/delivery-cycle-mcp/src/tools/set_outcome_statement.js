// set_outcome_statement.js
// Pathways OI Trust — delivery-cycle-mcp
// Sets outcome_statement on a delivery_cycle record.
// Records outcome_set_by_user_id and outcome_set_at.
// Appends event log entry.
// Source: Session 2026-03-25-A, build-c-spec Section 4.1

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} params.outcome_statement
 * @param {string} caller_user_id - from JWT
 */
async function set_outcome_statement(params, caller_user_id) {
  const { delivery_cycle_id, outcome_statement } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!outcome_statement || !outcome_statement.trim()) {
    return { success: false, error: 'outcome_statement is required and cannot be empty.' };
  }

  // Verify cycle exists
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, outcome_statement')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  const was_null = cycle.outcome_statement === null;

  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update({
      outcome_statement:      outcome_statement.trim(),
      outcome_set_by_user_id: caller_user_id,
      outcome_set_at:         new Date().toISOString()
    })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to set outcome statement: ${updateErr.message}` };
  }

  // Append event log
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'outcome_set',
      event_description: `Outcome statement ${was_null ? 'set' : 'updated'}.`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        prior_value_was_null: was_null
      }
    });

  return { success: true, data: updated };
}

module.exports = { set_outcome_statement };
