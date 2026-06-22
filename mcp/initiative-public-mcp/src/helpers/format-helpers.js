// format-helpers.js
// Pathways OI Trust — initiative-public-mcp (Contract 31, D-473).
//
// Shared label maps + derivations for the three read tools. Keeps the
// human-readable mapping in one place (reused by list_initiatives and
// get_initiative). No DB access here — pure functions.

'use strict';

// current_lifecycle_stage → human-readable (spec §WS3.3).
const STAGE_LABELS = {
  BRIEF: 'Brief', DESIGN: 'Design', SPEC: 'Spec',
  BUILD: 'Build', VALIDATE: 'Validate', UAT: 'UAT',
  PILOT: 'Pilot', RELEASE: 'Release', OUTCOME: 'Outcome',
  COMPLETE: 'Complete', CANCELLED: 'Cancelled', ON_HOLD: 'On Hold'
};

// gate_name → human-readable (spec §WS3.4).
const GATE_LABELS = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

// Gate order for next-gate derivation.
const GATE_SEQUENCE = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];

// raw event_type → human-readable (spec §WS3.5). Unknown types pass through raw.
const EVENT_LABELS = {
  cycle_created: 'Initiative created',
  cycle_updated: 'Initiative updated',
  stage_advanced: 'Stage advanced',
  gate_submitted: 'Gate submitted for approval',
  gate_approved: 'Gate approved',
  gate_returned: 'Gate returned',
  gate_skipped: 'Gate skipped',
  gate_backdated: 'Gate backdated',
  milestone_target_date_changed: 'Milestone date set',
  milestone_actual_date_set: 'Milestone completed',
  milestone_status_reverted: 'Milestone status reverted',
  artifact_attached: 'Artifact attached',
  artifact_updated: 'Artifact updated',
  artifact_detached: 'Artifact detached',
  approver_overridden: 'Approver overridden by Phil',
  consultation_responded: 'Consultation response recorded'
};

// Event types filtered OUT of get_initiative_history (spec §WS3.5).
const EXCLUDED_EVENT_TYPES = new Set(['email_sent']);

function stageLabel(stage) {
  return STAGE_LABELS[stage] || stage || null;
}

function gateLabel(gate) {
  return GATE_LABELS[gate] || gate || null;
}

function eventLabel(type) {
  return EVENT_LABELS[type] || type;
}

/**
 * Map the raw gate_records.gate_status to the public surface vocabulary.
 * CC-31 deviation: spec §WS3.4 lists 'not_submitted' but the real column uses
 * 'not_started' (and legacy 'pending') for "not yet submitted". Both map to
 * 'not_submitted'. awaiting_approval / approved / returned / skipped / blocked
 * pass through unchanged.
 */
function publicGateStatus(raw) {
  if (raw === 'not_started' || raw === 'pending') { return 'not_submitted'; }
  return raw || 'not_submitted';
}

/**
 * Derive the next gate for an Initiative — the first gate in sequence whose
 * record is neither approved nor skipped (spec §WS3.3).
 * @param {Array<{gate_name:string,gate_status:string}>} gateRecords
 * @param {Array<{gate_name:string,target_date:string|null}>} milestones
 * @returns {{name:string,label:string,status:string,target_date:string|null}|null}
 */
function deriveNextGate(gateRecords, milestones) {
  const recByGate  = new Map((gateRecords || []).map(g => [g.gate_name, g]));
  const dateByGate = new Map((milestones  || []).map(m => [m.gate_name, m.target_date ?? null]));
  for (const name of GATE_SEQUENCE) {
    const rec = recByGate.get(name);
    const status = rec?.gate_status;
    if (status !== 'approved' && status !== 'skipped') {
      return {
        name,
        label:       gateLabel(name),
        status:      publicGateStatus(status),
        target_date: dateByGate.get(name) ?? null
      };
    }
  }
  return null;  // all gates approved or skipped
}

module.exports = {
  STAGE_LABELS, GATE_LABELS, GATE_SEQUENCE, EVENT_LABELS, EXCLUDED_EVENT_TYPES,
  stageLabel, gateLabel, eventLabel, publicGateStatus, deriveNextGate
};
