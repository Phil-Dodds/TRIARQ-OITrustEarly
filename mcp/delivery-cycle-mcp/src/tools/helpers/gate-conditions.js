// gate-conditions.js
// Pathways OI Trust — delivery-cycle-mcp shared helper — Contract G6 (D-565)
// Condition force at decision points:
//   - open conditions hold a gate: approval is blocked until every condition
//     resolves (resolving never auto-approves — CC-G6 lean, AC #3).
//   - a return clears open conditions with the approvals (AC #5 lean —
//     "conditions survive nothing"): marked resolved with a clearing note,
//     never deleted.

'use strict';

const { supabase } = require('../../db');

/** Count open conditions on a gate. Returns { count, error }. */
async function countOpenConditions(gate_record_id) {
  const { data, error } = await supabase
    .from('gate_conditions')
    .select('condition_id')
    .eq('gate_record_id', gate_record_id)
    .eq('condition_status', 'open');
  if (error) { return { count: 0, error: error.message }; }
  return { count: (data || []).length, error: null };
}

/** A return clears open conditions (resolved w/ clearing note — never deleted). */
async function clearOpenConditionsOnReturn(gate_record_id, actor_user_id) {
  const { error } = await supabase
    .from('gate_conditions')
    .update({
      condition_status:    'resolved',
      resolved_at:         new Date().toISOString(),
      resolved_by_user_id: actor_user_id,
      resolution_note:     'Cleared by gate return — conditions do not survive a return (G6).'
    })
    .eq('gate_record_id', gate_record_id)
    .eq('condition_status', 'open');
  return { error: error ? error.message : null };
}

module.exports = { countOpenConditions, clearOpenConditionsOnReturn };
