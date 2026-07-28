// advance_cycle_stage.js
// Pathways OI Trust — delivery-cycle-mcp
// Advances current_lifecycle_stage to the next stage in the 12-stage sequence.
// Validates: gate cleared if a gate precedes the target stage; workstream is active.
// Appends event log entry.
// Source: D-108, ARCH-12, build-c-spec Section 4.1–4.2

'use strict';

const { supabase } = require('../db');
const { GATE_REQUIRED_TO_ENTER, TERMINAL_STAGES, nextStage, STAGE_SEQUENCE } = require('../lifecycle');

// Contract 40 follow-on (CC-40-I): an assigned EPO is required to advance INTO
// Build or any later stage (Phil 2026-07-28). The EPO is accountable for the
// build phase (D-390 already requires an EPO to submit the Go to Build gate);
// this extends the same floor to the stage advance itself. Earlier advances
// (Brief→Design→Spec) do not require an EPO.
const EPO_REQUIRED_FROM_STAGE = 'BUILD';

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} caller_user_id - from JWT
 */
async function advance_cycle_stage(params, caller_user_id) {
  const { delivery_cycle_id } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  // ── Fetch cycle ───────────────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, current_lifecycle_stage, workstream_id, assigned_epo_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  if (TERMINAL_STAGES.includes(cycle.current_lifecycle_stage)) {
    return {
      success: false,
      error: `This cycle is ${cycle.current_lifecycle_stage} and cannot be advanced further.`
    };
  }

  const target_stage = nextStage(cycle.current_lifecycle_stage);

  if (!target_stage) {
    return {
      success: false,
      error: `Cannot advance from ${cycle.current_lifecycle_stage} — no next stage in sequence.`
    };
  }

  // ── EPO floor (CC-40-I) — required to enter Build or any later stage ───────
  // Replaces the former hard workstream-presence requirement. D-140 message
  // names the block and how to clear it.
  const targetIdx = STAGE_SEQUENCE.indexOf(target_stage);
  const epoFloorIdx = STAGE_SEQUENCE.indexOf(EPO_REQUIRED_FROM_STAGE);
  if (targetIdx >= epoFloorIdx && !cycle.assigned_epo_user_id) {
    return {
      success: false,
      error: `Cannot advance to ${target_stage} — no Engineering Product Owner is assigned. ` +
             `An EPO must be named before this Initiative enters ${EPO_REQUIRED_FROM_STAGE}. ` +
             `An Admin or the trio can assign an EPO in the Initiative edit panel.`
    };
  }

  // ── Workstream active check — only when a Workstream is assigned ──────────
  // D-165 / Contract 19 Part 3b: Workstream is optional. A null Workstream no
  // longer blocks advancement (this was the stale ARCH-12 requirement). When
  // one IS assigned, ARCH-23 still blocks advance on an inactive Workstream.
  if (cycle.workstream_id) {
    const { data: workstream, error: wsErr } = await supabase
      .from('delivery_workstreams')
      .select('workstream_name, active_status')
      .eq('workstream_id', cycle.workstream_id)
      .is('deleted_at', null)
      .single();

    if (wsErr || !workstream) {
      return { success: false, error: 'Assigned Workstream not found or has been deleted. Reassign a valid Workstream or clear it, then advance.' };
    }

    if (!workstream.active_status) {
      return {
        success: false,
        error: `Stage advance blocked: the ${workstream.workstream_name} workstream is inactive. A Division Admin must reactivate it before this cycle can advance.`
      };
    }
  }

  // ── Gate check — if target stage requires a gate, verify it is approved ───
  const required_gate = GATE_REQUIRED_TO_ENTER[target_stage];

  if (required_gate) {
    const { data: gate_record, error: gateErr } = await supabase
      .from('gate_records')
      .select('gate_status')
      .eq('delivery_cycle_id', delivery_cycle_id)
      .eq('gate_name', required_gate)
      .is('deleted_at', null)
      .single();

    if (gateErr || !gate_record) {
      return {
        success: false,
        error: `Gate record for '${required_gate}' not found on this cycle.`
      };
    }

    if (gate_record.gate_status !== 'approved') {
      return {
        success: false,
        error: `Advance to ${target_stage} blocked: the ${required_gate} gate has not been approved (current status: ${gate_record.gate_status}). The gate must be cleared before advancing.`
      };
    }
  }

  // ── Advance the stage ─────────────────────────────────────────────────────
  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update({ current_lifecycle_stage: target_stage })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to advance stage: ${updateErr.message}` };
  }

  // ── Append event log ──────────────────────────────────────────────────────
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'stage_advanced',
      event_description: `Cycle advanced from ${cycle.current_lifecycle_stage} to ${target_stage}.`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        prior_stage: cycle.current_lifecycle_stage,
        new_stage:   target_stage,
        gate_used:   required_gate || null
      }
    });

  return {
    success: true,
    data: {
      prior_stage:             cycle.current_lifecycle_stage,
      current_lifecycle_stage: target_stage,
      cycle:                   updated
    }
  };
}

module.exports = { advance_cycle_stage };
