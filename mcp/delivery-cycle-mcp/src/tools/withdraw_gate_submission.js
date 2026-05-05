// withdraw_gate_submission.js
// Pathways OI Trust — delivery-cycle-mcp
// Withdraws a submitted gate that is still awaiting approver decision.
// Allowed only when gate_status = 'awaiting_approval'.
// Resets gate to 'not_started'; clears submitted_at and submitted_by_user_id.
// Build C: any authenticated user may withdraw — role-restriction deferred (D-245).
// Source: D-345, gate-submission-flow-spec-2026-04-19 §3.3.

'use strict';

const { supabase } = require('../db');

const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

const VALID_GATES = Object.keys(GATE_NAME_DISPLAY);

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} params.gate_name
 * @param {string} caller_user_id - from JWT
 */
async function withdraw_gate_submission(params, caller_user_id) {
  const { delivery_cycle_id, gate_name } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!gate_name) {
    return { success: false, error: 'gate_name is required.' };
  }
  if (!VALID_GATES.includes(gate_name)) {
    return {
      success: false,
      error: `gate_name must be one of: ${VALID_GATES.join(', ')}.`
    };
  }

  // ── Fetch gate record ─────────────────────────────────────────────────────
  const { data: gate_record, error: gateErr } = await supabase
    .from('gate_records')
    .select('gate_record_id, gate_status')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_name', gate_name)
    .is('deleted_at', null)
    .single();

  if (gateErr || !gate_record) {
    return {
      success: false,
      error: `Gate record for '${gate_name}' not found on this cycle.`
    };
  }

  // ── Spec §3.3: must be awaiting_approval to withdraw ─────────────────────
  if (gate_record.gate_status !== 'awaiting_approval') {
    return { success: false, error: 'Gate is not awaiting approval.' };
  }

  // ── Caller display name for event log ────────────────────────────────────
  const { data: caller } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  const callerDisplayName = caller?.display_name ?? 'A user';
  const gateNameDisplay   = GATE_NAME_DISPLAY[gate_name];

  // ── Reset gate ────────────────────────────────────────────────────────────
  const { data: updated_gate, error: updateErr } = await supabase
    .from('gate_records')
    .update({
      gate_status:          'not_started',
      submitted_at:         null,
      submitted_by_user_id: null
    })
    .eq('gate_record_id', gate_record.gate_record_id)
    .select()
    .single();

  if (updateErr) {
    return {
      success: false,
      error: `Failed to withdraw gate submission: ${updateErr.message}`
    };
  }

  // ── Append event log entry ───────────────────────────────────────────────
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'gate_withdrawn',
      event_description: `${callerDisplayName} withdrew ${gateNameDisplay} submission.`,
      actor_user_id:     caller_user_id,
      event_metadata:    { gate_name }
    });

  return {
    success: true,
    data: {
      gate_record_id: updated_gate.gate_record_id,
      gate_status:    'not_started'
    }
  };
}

module.exports = { withdraw_gate_submission };
