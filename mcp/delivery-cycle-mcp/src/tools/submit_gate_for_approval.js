// submit_gate_for_approval.js
// Pathways OI Trust — delivery-cycle-mcp
// Submits a gate for approval. Validates workstream assignment, active_status,
// DCS assignment, DOL assignment (brief_review), and EPO assignment (go_to_build).
//
// D-165: Workstream must be assigned before any gate can be submitted.
//   At brief_review: cycle has no workstream → blocked with assignment instruction.
//   At all subsequent gates: workstream must also be assigned.
//
// D-389/D-390/D-391:
//   brief_review gate: assigned_dcs_user_id AND assigned_dol_user_id must both be non-null.
//     DCS is accountable for the Initiative through delivery; DOL is accountable for the outcome.
//   go_to_build gate: assigned_epo_user_id must be non-null. EPO is accountable for the build phase.
//
// ARCH-23: If workstream inactive at gate time: gate_status = 'blocked',
//   workstream_active_at_clearance = false recorded.
// If workstream active: gate transitions to 'awaiting_approval' (D-345).
//   submitted_at = now() and submitted_by_user_id = JWT identity recorded.
//   workstream_active_at_clearance = true recorded.
// Appends event log entry in all cases.
// Source: D-140, D-165, D-345, ARCH-23, D-389, D-390, D-391,
//   gate-submission-flow-spec-2026-04-19 §3.1.

'use strict';

const { supabase } = require('../db');

// Gate-name display strings — used in event_description and surfaced to UI text.
// Source: gate-submission-flow-spec-2026-04-19 §3.1.
const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

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

  // ── Fetch Initiative ──────────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, workstream_id, current_lifecycle_stage, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  // ── Submission authority: Phil, DCS, EPO, or DOL on this Initiative (D-389/D-390/D-391) ──
  const { data: caller } = await supabase
    .from('users')
    .select('system_role, display_name')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  const callerRole         = caller?.system_role ?? '';
  const callerDisplayName  = caller?.display_name ?? 'A user';
  const gateNameDisplay    = GATE_NAME_DISPLAY[gate_name] ?? gate_name;
  const isPhil        = callerRole === 'phil';
  const isAssignedDcs = cycle.assigned_dcs_user_id === caller_user_id;
  const isAssignedEpo = cycle.assigned_epo_user_id === caller_user_id;
  const isAssignedDol = cycle.assigned_dol_user_id === caller_user_id;

  if (!isPhil && !isAssignedDcs && !isAssignedEpo && !isAssignedDol) {
    return {
      success: false,
      error: 'You do not have authority to submit this gate for approval. ' +
             'Only the assigned Domain Capability Strategist, Engineering Product Owner, Domain Outcome Lead, or Phil can submit gates.'
    };
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
        event_description: `Gate '${gate_name}' blocked: no Workstream is assigned to this Initiative.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, reason: 'no_workstream_assigned' }
      });

    return {
      success: false,
      error: `Cannot submit ${gateLabel} gate — this Initiative has no Workstream assigned. ` +
             `Assign a Workstream before submitting for approval. ` +
             `An Admin or DCS can update the Initiative's Workstream.`
    };
  }

  // ── D-389: DCS required before brief_review gate ──────────────────────────
  if (gate_name === 'brief_review' && !cycle.assigned_dcs_user_id) {
    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'gate_blocked',
        event_description: `Gate 'brief_review' blocked: no Domain Capability Strategist is assigned to this Initiative.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, reason: 'no_dcs_assigned' }
      });

    return {
      success: false,
      error: `Cannot submit Brief Review gate — no Domain Capability Strategist is assigned to this Initiative. ` +
             `A DCS must be named before Brief Review can proceed. ` +
             `An Admin or Phil can assign a DCS using the Initiative's edit panel.`
    };
  }

  // ── D-391: DOL required before brief_review gate ──────────────────────────
  if (gate_name === 'brief_review' && !cycle.assigned_dol_user_id) {
    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'gate_blocked',
        event_description: `Gate 'brief_review' blocked: no Domain Outcome Lead is assigned to this Initiative.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, reason: 'no_dol_assigned' }
      });

    return {
      success: false,
      error: `Cannot submit Brief Review gate — no Domain Outcome Lead is assigned to this Initiative. ` +
             `A DOL must be named before Brief Review can proceed. ` +
             `An Admin or Phil can assign a DOL using the Initiative's edit panel.`
    };
  }

  // ── D-390: EPO required before go_to_build gate ───────────────────────────
  if (gate_name === 'go_to_build' && !cycle.assigned_epo_user_id) {
    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'gate_blocked',
        event_description: `Gate 'go_to_build' blocked: no Engineering Product Owner is assigned to this Initiative.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, reason: 'no_epo_assigned' }
      });

    return {
      success: false,
      error: `Cannot submit Go to Build gate — no Engineering Product Owner is assigned to this Initiative. ` +
             `An EPO must be named before this Initiative enters the BUILD phase. ` +
             `An Admin or Phil can assign an EPO using the Initiative's edit panel.`
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

  // ── Workstream active — gate transitions to awaiting_approval (D-345) ────
  const { data: updated_gate, error: updateErr } = await supabase
    .from('gate_records')
    .update({
      gate_status:                    'awaiting_approval',
      submitted_at:                   new Date().toISOString(),
      submitted_by_user_id:           caller_user_id,
      workstream_active_at_clearance: true
    })
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
      event_description: `${callerDisplayName} submitted ${gateNameDisplay} for approval.`,
      actor_user_id:     caller_user_id,
      event_metadata:    { gate_name }
    });

  return { success: true, data: updated_gate };
}

module.exports = { submit_gate_for_approval };
