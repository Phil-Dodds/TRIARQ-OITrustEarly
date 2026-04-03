// submit_gate_for_approval.js
// Pathways OI Trust — delivery-cycle-mcp
// Submits a gate for approval. Validates workstream assignment and active_status.
//
// D-165: Workstream must be assigned before any gate can be submitted.
//   At brief_review: cycle has no workstream → blocked with assignment instruction.
//   At all subsequent gates: workstream must also be assigned (invariant after brief_review clears).
//
// ARCH-23: If workstream inactive at gate time: gate_status = 'blocked',
//   workstream_active_at_clearance = false recorded.
// If workstream active: workstream_active_at_clearance = true, gate stays 'pending'
//   until record_gate_decision is called.
// Appends event log entry in all cases.
// Source: D-140, D-165, ARCH-23, build-c-spec Section 4.1–4.2

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} params.gate_name
 * @param {string} caller_user_id - from JWT
 */
async function submit_gate_for_approval(params, caller_user_id) {
  const { delivery_cycle_id, gate_name } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!gate_name) {
    return { success: false, error: 'gate_name is required.' };
  }

  const VALID_GATES = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];
  if (!VALID_GATES.includes(gate_name)) {
    return {
      success: false,
      error: `gate_name must be one of: ${VALID_GATES.join(', ')}.`
    };
  }

  // ── Fetch cycle ────────────────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, workstream_id, current_lifecycle_stage')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // ── D-165: Workstream must be assigned before any gate can be submitted ───
  if (!cycle.workstream_id) {
    const gateLabel = gate_name === 'brief_review'
      ? 'Brief Review'
      : `the ${gate_name.replace(/_/g, ' ')}`;

    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'gate_blocked',
        event_description: `Gate '${gate_name}' blocked: no Workstream is assigned to this cycle.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, reason: 'no_workstream_assigned' }
      });

    return {
      success: false,
      error: `Cannot submit ${gateLabel} gate — this cycle has no Workstream assigned. ` +
             `Assign a Workstream before submitting for approval. ` +
             `An Admin or DS user can update the cycle's Workstream.`
    };
  }

  // ── Fetch workstream ───────────────────────────────────────────────────────
  const { data: workstream, error: wsErr } = await supabase
    .from('delivery_workstreams')
    .select('workstream_name, active_status')
    .eq('workstream_id', cycle.workstream_id)
    .is('deleted_at', null)
    .single();

  if (wsErr || !workstream) {
    return { success: false, error: 'Assigned Workstream not found. Contact an Admin to reassign a valid Workstream.' };
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
      error: `Gate record for '${gate_name}' not found on this cycle. Ensure the cycle was created correctly.`
    };
  }

  if (gate_record.gate_status === 'approved') {
    return {
      success: false,
      error: `The ${gate_name} gate has already been approved for this cycle.`
    };
  }

  // ── Workstream active check (ARCH-23, Session 2026-03-24-Q) ─────────────
  const workstream_active = workstream.active_status;

  if (!workstream_active) {
    const { data: blocked_gate, error: blockErr } = await supabase
      .from('gate_records')
      .update({
        gate_status:                    'blocked',
        workstream_active_at_clearance: false
      })
      .eq('gate_record_id', gate_record.gate_record_id)
      .select()
      .single();

    if (blockErr) {
      return { success: false, error: `Failed to record gate block: ${blockErr.message}` };
    }

    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'gate_blocked',
        event_description: `Gate '${gate_name}' blocked: the ${workstream.workstream_name} workstream is inactive.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, workstream_active_at_clearance: false }
      });

    return {
      success: false,
      error: `Gate blocked: the ${workstream.workstream_name} workstream is inactive. A Division Admin must reactivate it before this gate can proceed.`,
      data: blocked_gate
    };
  }

  // ── Workstream active — record the check, gate remains pending ───────────
  const { data: updated_gate, error: updateErr } = await supabase
    .from('gate_records')
    .update({ workstream_active_at_clearance: true })
    .eq('gate_record_id', gate_record.gate_record_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to update gate record: ${updateErr.message}` };
  }

  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'gate_submitted',
      event_description: `Gate '${gate_name}' submitted for approval. Workstream active at submission.`,
      actor_user_id:     caller_user_id,
      event_metadata:    { gate_name, workstream_active_at_clearance: true }
    });

  return { success: true, data: updated_gate };
}

module.exports = { submit_gate_for_approval };
