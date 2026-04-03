// lifecycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Shared lifecycle constants for the 12-stage Delivery Cycle model (D-108, ARCH-12).
// Imported by advance_cycle_stage, record_gate_decision, create_delivery_cycle.

'use strict';

// Sequential stage order — CANCELLED and ON_HOLD are not in this list (terminal/pause states).
const STAGE_SEQUENCE = [
  'BRIEF',
  'DESIGN',
  'SPEC',
  'BUILD',
  'VALIDATE',
  'PILOT',
  'UAT',
  'RELEASE',
  'OUTCOME',
  'COMPLETE'
];

// Gates that must be approved before entering a given stage.
// Key = target stage, value = gate_name that must be in status='approved'.
const GATE_REQUIRED_TO_ENTER = {
  DESIGN:   'brief_review',
  BUILD:    'go_to_build',
  PILOT:    'go_to_deploy',
  RELEASE:  'go_to_release',
  COMPLETE: 'close_review'
};

// Gate → milestone label mapping (used when seeding milestone rows on cycle creation).
const GATE_MILESTONE_LABELS = {
  brief_review:  'Brief Review Complete',
  go_to_build:   'Build Start',
  go_to_deploy:  'Pilot Start',
  go_to_release: 'Release Start',
  close_review:  'Close Review Complete'
};

// All five gate names in lifecycle order.
const ALL_GATES = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];

// Terminal stages — advance_cycle_stage rejects calls when already in one of these.
const TERMINAL_STAGES = ['COMPLETE', 'CANCELLED'];

/**
 * Returns the next stage in STAGE_SEQUENCE after current_stage.
 * Returns null if current_stage is the last sequential stage or a terminal state.
 */
function nextStage(current_stage) {
  const idx = STAGE_SEQUENCE.indexOf(current_stage);
  if (idx === -1 || idx === STAGE_SEQUENCE.length - 1) return null;
  return STAGE_SEQUENCE[idx + 1];
}

module.exports = {
  STAGE_SEQUENCE,
  GATE_REQUIRED_TO_ENTER,
  GATE_MILESTONE_LABELS,
  ALL_GATES,
  TERMINAL_STAGES,
  nextStage
};
