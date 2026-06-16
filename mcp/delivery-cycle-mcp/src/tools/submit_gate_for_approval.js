// submit_gate_for_approval.js
// Pathways OI Trust — delivery-cycle-mcp
// Submits a gate for approval. Validates DCS, DOL (brief_review), and EPO (go_to_build)
// assignments. Workstream is recommended, not gate-required (Contract 19 Part 3b).
//
// Contract 19 (Part 3b): Workstream null check removed. Workstream is recommended.
//   When Workstream IS assigned: active_status check still gates submission (ARCH-23).
//   When Workstream is null: submission proceeds; workstream_active_at_clearance = null.
//
// D-389/D-390/D-391:
//   brief_review gate: assigned_dcs_user_id AND assigned_dol_user_id must both be non-null.
//     DCS is accountable for the Initiative through delivery; DOL is accountable for the outcome.
//   go_to_build gate: assigned_epo_user_id must be non-null. EPO is accountable for the build phase.
//
// ARCH-23 (when Workstream assigned): inactive → gate_status = 'blocked',
//   workstream_active_at_clearance = false recorded. Active → 'awaiting_approval' (D-345).
//   submitted_at = now() and submitted_by_user_id = JWT identity recorded.
// Appends event log entry in all cases.
// Source: D-140, D-345, ARCH-23, D-389, D-390, D-391, Contract 19 Part 3b,
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
  // D-424 / Contract 23 Item 3.6: division_id added — used to look up dol_required.
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, workstream_id, division_id, current_lifecycle_stage, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  // ── Submission authority: Admin, DCS, EPO, or DOL on this Initiative (D-389/D-390/D-391) ──
  // Any Admin can submit on behalf of an Initiative (D-369).
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin, display_name')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  const callerDisplayName  = caller?.display_name ?? 'A user';
  const gateNameDisplay    = GATE_NAME_DISPLAY[gate_name] ?? gate_name;
  const isAdmin       = caller?.is_admin === true;
  const isAssignedDcs = cycle.assigned_dcs_user_id === caller_user_id;
  const isAssignedEpo = cycle.assigned_epo_user_id === caller_user_id;
  const isAssignedDol = cycle.assigned_dol_user_id === caller_user_id;

  if (!isAdmin && !isAssignedDcs && !isAssignedEpo && !isAssignedDol) {
    return {
      success: false,
      error: 'You do not have authority to submit this gate for approval. ' +
             'Only the assigned Domain Capability Strategist, Engineering Product Owner, Domain Outcome Lead, or an Admin can submit gates.'
    };
  }

  // ── Contract 19 Part 3b: Workstream null check removed. Workstream recommended, not gate-required.
  //   When Workstream IS assigned, active_status still gates submission (ARCH-23) — see below.
  //   When Workstream is null, submission proceeds; the workstream-active branch is skipped.

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

  // ── D-391 + D-424: DOL required before brief_review gate (Division-conditional) ─
  // Contract 23 Item 3.6: if the cycle's Division has dol_required = false,
  // skip the DOL null check entirely. DCS and Workstream pre-checks are unchanged.
  if (gate_name === 'brief_review' && !cycle.assigned_dol_user_id) {
    let dolRequired = true;
    if (cycle.division_id) {
      const { data: divRow } = await supabase
        .from('divisions')
        .select('dol_required')
        .eq('id', cycle.division_id)
        .is('deleted_at', null)
        .single();
      if (divRow && divRow.dol_required === false) { dolRequired = false; }
    }

    if (dolRequired) {
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
    // dolRequired === false: fall through; submission proceeds with no DOL.
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

  // ── Fetch workstream (only when assigned — Contract 19 Part 3b) ────────────
  let workstream = null;
  if (cycle.workstream_id) {
    const { data: wsRow, error: wsErr } = await supabase
      .from('delivery_workstreams')
      .select('workstream_name, active_status')
      .eq('workstream_id', cycle.workstream_id)
      .is('deleted_at', null)
      .single();

    if (wsErr || !wsRow) {
      return { success: false, error: 'Assigned Workstream not found. Contact an Admin to reassign a valid Workstream.' };
    }
    workstream = wsRow;
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

  // ── Workstream active check (ARCH-23) — only when Workstream assigned ────
  if (workstream && !workstream.active_status) {
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

  // ── Submission path — Workstream active OR Workstream not assigned ───────
  //   workstream_active_at_clearance:
  //     true   — Workstream assigned + active
  //     null   — no Workstream assigned (Contract 19 Part 3b)
  const workstream_clearance = workstream ? true : null;

  const { data: updated_gate, error: updateErr } = await supabase
    .from('gate_records')
    .update({
      gate_status:                    'awaiting_approval',
      submitted_at:                   new Date().toISOString(),
      submitted_by_user_id:           caller_user_id,
      workstream_active_at_clearance: workstream_clearance
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

  // ── D-437 (Contract 24): non-blocking artifact suggestion warnings ─────────
  // Compute artifact gaps AFTER submission succeeds. Returns an array of
  // missing artifact type names — the Angular submit modal renders them as a
  // D-200 Pattern 2 amber warning. Submission status is unchanged regardless.
  const suggestion_warnings = await computeArtifactSuggestionWarnings(
    delivery_cycle_id, gate_name
  );

  return { success: true, data: updated_gate, suggestion_warnings };
}

/**
 * D-437: list of artifact type names expected for this gate but not yet
 * attached to the Initiative. Includes both gate-specific suggestions and
 * required_at_gate='all' types. Non-blocking — purely informational.
 */
async function computeArtifactSuggestionWarnings(delivery_cycle_id, gate_name) {
  const { data: types } = await supabase
    .from('cycle_artifact_types')
    .select('artifact_type_id, artifact_type_name, required_at_gate, active_status')
    .or(`required_at_gate.eq.${gate_name},required_at_gate.eq.all`)
    .eq('active_status', true);
  const candidates = (types || []).filter(t => t.active_status !== false);
  if (candidates.length === 0) { return []; }

  const candidateIds = candidates.map(t => t.artifact_type_id);
  const { data: attached } = await supabase
    .from('cycle_artifacts')
    .select('artifact_type_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .in('artifact_type_id', candidateIds)
    .is('deleted_at', null);
  const attachedIds = new Set((attached || []).map(a => a.artifact_type_id));

  return candidates
    .filter(t => !attachedIds.has(t.artifact_type_id))
    .map(t => t.artifact_type_name);
}

module.exports = { submit_gate_for_approval };
