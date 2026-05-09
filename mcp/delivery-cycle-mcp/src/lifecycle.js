// lifecycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Shared lifecycle constants for the 12-stage Delivery Cycle model (D-108, ARCH-12).
// Imported by advance_cycle_stage, record_gate_decision, create_delivery_cycle.

'use strict';

// Sequential stage order — CANCELLED and ON_HOLD are not in this list (terminal/pause states).
// Canonical order: VALIDATE → UAT → PILOT → RELEASE. UAT is user acceptance (pre-deploy);
// PILOT is limited rollout (post-deploy).
const STAGE_SEQUENCE = [
  'BRIEF',
  'DESIGN',
  'SPEC',
  'BUILD',
  'VALIDATE',
  'UAT',
  'PILOT',
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

/**
 * Returns the previous stage in STAGE_SEQUENCE before current_stage.
 * Returns null if current_stage is BRIEF (nothing before it) or not in the sequence.
 */
function prevStage(current_stage) {
  const idx = STAGE_SEQUENCE.indexOf(current_stage);
  if (idx <= 0) return null;
  return STAGE_SEQUENCE[idx - 1];
}

/**
 * Returns the gate_name values that must be reset to 'pending' when a cycle
 * regresses from current_stage to target_stage (D-179).
 *
 * Logic: any gate that guards entry to a stage whose index is strictly between
 * target_stage and current_stage (i.e. from target_stage+1 to current_stage,
 * inclusive on the current end) is reset.
 *
 * Example: regress BUILD → SPEC
 *   Stages at indices toIdx+1…fromIdx: BUILD → guarded by 'go_to_build' → reset.
 *
 * Example: regress VALIDATE → BUILD
 *   Stages at indices toIdx+1…fromIdx: VALIDATE → no gate guards VALIDATE → [].
 *
 * @param {string} target_stage - the stage the cycle is being moved TO
 * @param {string} current_stage - the stage the cycle is currently in
 * @returns {string[]} gate_names to reset, in lifecycle order
 */
function gatesResetOnRegressionTo(target_stage, current_stage) {
  const fromIdx = STAGE_SEQUENCE.indexOf(current_stage);
  const toIdx   = STAGE_SEQUENCE.indexOf(target_stage);
  if (fromIdx === -1 || toIdx === -1 || toIdx >= fromIdx) return [];
  const gates = [];
  for (let i = toIdx + 1; i <= fromIdx; i++) {
    const gate = GATE_REQUIRED_TO_ENTER[STAGE_SEQUENCE[i]];
    if (gate) gates.push(gate);
  }
  return gates;
}

// Next gate that must be cleared from each current stage (D-189).
// Used for summary views and filter labelling.
// Returns null for terminal/pause stages.
// Canonical order: VALIDATE → UAT → go_to_deploy → PILOT → go_to_release → RELEASE.
const NEXT_GATE_BY_STAGE = {
  BRIEF:    'brief_review',
  DESIGN:   'go_to_build',
  SPEC:     'go_to_build',
  BUILD:    'go_to_deploy',
  VALIDATE: 'go_to_deploy',
  UAT:      'go_to_deploy',
  PILOT:    'go_to_release',
  RELEASE:  'close_review',
  OUTCOME:  'close_review',
  COMPLETE:  null,
  CANCELLED: null,
  ON_HOLD:   null
};

// WIP category for each lifecycle stage (D-WIPLimit-2026-04-06, supersedes D-190).
//   pre_build  = DESIGN, SPEC                (BRIEF excluded — pre-design)
//   build      = BUILD, VALIDATE, UAT
//   post_deploy = PILOT, RELEASE, OUTCOME
// COMPLETE, CANCELLED, ON_HOLD, BRIEF excluded from WIP counting (null).
const WIP_CATEGORY_BY_STAGE = {
  BRIEF:     null,
  DESIGN:    'pre_build',
  SPEC:      'pre_build',
  BUILD:     'build',
  VALIDATE:  'build',
  UAT:       'build',
  PILOT:     'post_deploy',
  RELEASE:   'post_deploy',
  OUTCOME:   'post_deploy',
  COMPLETE:  null,
  CANCELLED: null,
  ON_HOLD:   null
};

// WIP limit per zone per workstream — default 3/3/3 (D-WIPLimit-2026-04-06).
// Per-workstream override via wip_limit_* columns is a future enhancement;
// no migration in Contract 13 — defaults applied at MCP layer.
const WIP_LIMIT_PRE_BUILD  = 3;
const WIP_LIMIT_BUILD      = 3;
const WIP_LIMIT_POST_DEPLOY = 3;
// Legacy alias retained for compatibility with any caller still importing WIP_LIMIT.
const WIP_LIMIT = 3;

module.exports = {
  STAGE_SEQUENCE,
  GATE_REQUIRED_TO_ENTER,
  GATE_MILESTONE_LABELS,
  ALL_GATES,
  TERMINAL_STAGES,
  NEXT_GATE_BY_STAGE,
  WIP_CATEGORY_BY_STAGE,
  WIP_LIMIT,
  WIP_LIMIT_PRE_BUILD,
  WIP_LIMIT_BUILD,
  WIP_LIMIT_POST_DEPLOY,
  nextStage,
  prevStage,
  gatesResetOnRegressionTo
};
