// save_initiative_status_update.js — Contract 32 (WS2)
// Trio member (DOL/DCS/EPO) saves a status update for an Initiative.
// Governing: D-476 (immutable row), D-477 (confidence → gate status write-through),
// D-479 (applicability), D-482 (clears overdue on save).
//
// CC-32 (single-transaction note): spec §2.1 says "single transaction". The
// supabase-js client does not expose multi-statement transactions across
// separate .from() calls; the existing tools (e.g. create_delivery_cycle) use
// sequential writes. This tool follows that pattern. The immutable
// initiative_status_updates row is the source of truth; the gate-status mirror
// (D-477) is written via the existing update_milestone_status code path, with a
// best-effort cycle_event_log entry. Recorded as a CC-decision.

'use strict';

const { supabase } = require('../db');
const { update_milestone_status } = require('./update_milestone_status');

const VALID_CONFIDENCE = ['not_started', 'on_track', 'at_risk', 'behind', 'complete'];

// Linear lifecycle order (mirrors NEXT_GATE_BY_STAGE in the Angular detail view
// and lifecycle.js). "go_to_deploy reached" = stage at or past PILOT (D-479).
const LIFECYCLE_ORDER = [
  'BRIEF', 'DESIGN', 'SPEC', 'BUILD', 'VALIDATE',
  'PILOT', 'UAT', 'RELEASE', 'OUTCOME', 'COMPLETE'
];
const PILOT_INDEX = LIFECYCLE_ORDER.indexOf('PILOT');

function goToDeployReached(stage) {
  const idx = LIFECYCLE_ORDER.indexOf(stage);
  return idx >= 0 && idx >= PILOT_INDEX;
}

const CONFIDENCE_GATE_LABEL = {
  go_to_deploy: 'Pilot Start Date',
  close_review: 'Close Review'
};

/**
 * @param {object} params
 * @param {string} params.initiative_id
 * @param {string} [params.accomplished_last_cycle]
 * @param {string} [params.plan_next_cycle]
 * @param {string} [params.blockers]
 * @param {boolean} params.escalation_needed
 * @param {string} [params.pilot_confidence]   one of VALID_CONFIDENCE
 * @param {string} [params.close_confidence]   one of VALID_CONFIDENCE
 * @param {string} caller_user_id - from JWT
 */
async function save_initiative_status_update(params, caller_user_id) {
  const {
    initiative_id, accomplished_last_cycle, plan_next_cycle, blockers,
    escalation_needed, pilot_confidence, close_confidence
  } = params;

  if (!initiative_id) {
    return { success: false, error: 'initiative_id is required.' };
  }
  if (escalation_needed !== undefined && typeof escalation_needed !== 'boolean') {
    return { success: false, error: 'escalation_needed must be a boolean.' };
  }
  for (const [label, val] of [['pilot_confidence', pilot_confidence], ['close_confidence', close_confidence]]) {
    if (val !== undefined && val !== null && !VALID_CONFIDENCE.includes(val)) {
      return { success: false, error: `${label} must be one of: ${VALID_CONFIDENCE.join(', ')}.` };
    }
  }

  // ── Fetch Initiative + trio assignment ────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, current_lifecycle_stage, assigned_dol_user_id, assigned_dcs_user_id, assigned_epo_user_id')
    .eq('delivery_cycle_id', initiative_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  // ── Auth: caller must be DOL, DCS, or EPO on this Initiative (D-478) ───────
  const trio = [cycle.assigned_dol_user_id, cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id];
  if (!trio.includes(caller_user_id)) {
    return {
      success: false,
      error: 'Only the DOL, DCS, or EPO assigned to this Initiative can save a status update.'
    };
  }

  // ── Compute confidence applicability (D-479) ──────────────────────────────
  const { data: milestones } = await supabase
    .from('cycle_milestone_dates')
    .select('gate_name, date_status')
    .eq('delivery_cycle_id', initiative_id)
    .in('gate_name', ['go_to_deploy', 'close_review'])
    .is('deleted_at', null);

  const statusByGate = {};
  for (const m of (milestones || [])) { statusByGate[m.gate_name] = m.date_status; }
  const bothComplete =
    statusByGate.go_to_deploy === 'complete' && statusByGate.close_review === 'complete';
  const reached = goToDeployReached(cycle.current_lifecycle_stage);

  const pilotApplicable = !bothComplete && !reached;
  const closeApplicable = !bothComplete && reached;

  // ── Insert the immutable status update row (D-476) ────────────────────────
  const insertRow = {
    initiative_id,
    accomplished_last_cycle: accomplished_last_cycle || null,
    plan_next_cycle:         plan_next_cycle || null,
    blockers:                blockers || null,
    escalation_needed:       escalation_needed === true,
    pilot_confidence:        pilotApplicable ? (pilot_confidence || null) : null,
    close_confidence:        closeApplicable ? (close_confidence || null) : null,
    pilot_confidence_applicable: pilotApplicable,
    close_confidence_applicable: closeApplicable,
    saved_by:                caller_user_id
  };

  const { data: saved, error: saveErr } = await supabase
    .from('initiative_status_updates')
    .insert(insertRow)
    .select('id, saved_at')
    .single();

  if (saveErr || !saved) {
    return { success: false, error: `Failed to save status update: ${saveErr?.message || 'unknown error'}` };
  }

  // ── Point the Initiative at the new latest update; clear overdue (D-482) ──
  const { error: cycleUpdateErr } = await supabase
    .from('delivery_cycles')
    .update({ latest_status_update_id: saved.id, status_overdue: false })
    .eq('delivery_cycle_id', initiative_id);

  if (cycleUpdateErr) {
    return { success: false, error: `Status saved but Initiative link failed: ${cycleUpdateErr.message}` };
  }

  // ── Confidence write-through to gate status (D-477) ───────────────────────
  // Reuses the existing update_milestone_status code path (no new SQL path).
  // Best-effort: applicability guarantees a non-complete gate, so the revert
  // gate in update_milestone_status is not tripped.
  await writeConfidenceThrough(pilotApplicable, pilot_confidence, 'go_to_deploy', initiative_id, caller_user_id);
  await writeConfidenceThrough(closeApplicable, close_confidence, 'close_review', initiative_id, caller_user_id);

  return { success: true, data: { status_update_id: saved.id, saved_at: saved.saved_at } };
}

async function writeConfidenceThrough(applicable, value, gate_name, initiative_id, caller_user_id) {
  if (!applicable || !value) { return; }

  const res = await update_milestone_status(
    { delivery_cycle_id: initiative_id, gate_name, date_status: value },
    caller_user_id
  );
  if (!res.success) { return; } // non-fatal — status row already persisted

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id: initiative_id,
    event_type:        'status_confidence_updated',
    event_description: `${CONFIDENCE_GATE_LABEL[gate_name]} confidence set to ${value} via Initiative Status Update`,
    actor_user_id:     caller_user_id,
    event_metadata:    { gate_name, date_status: value, source: 'status_update' }
  });
}

module.exports = { save_initiative_status_update };
