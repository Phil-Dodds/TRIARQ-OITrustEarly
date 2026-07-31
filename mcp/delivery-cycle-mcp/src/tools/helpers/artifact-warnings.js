// artifact-warnings.js
// Pathways OI Trust — delivery-cycle-mcp shared helper (D-438, Contract 25).
//
// Shared computation for the D-200 Pattern 2 "missing artifact" warnings
// surfaced by submit_gate_for_approval and record_gate_decision. Replaces the
// duplicated computeArtifactSuggestionWarnings helpers that previously lived
// in each tool file (CC-24-07 follow-up — Contract 24 CodeClose §3).
//
// Warning logic per D-438:
//   gate_warning_behavior='none'                  — never warn
//   gate_warning_behavior='primary_only'          — warn only when current gate sequence = primary_gate sequence
//   gate_warning_behavior='primary_and_subsequent' — warn when current gate sequence >= primary_gate sequence
//
// Contract 40 follow-on (Phil 2026-07-30, migration 096): gate_warning_through
// puts an optional UPPER bound on 'primary_and_subsequent' — warn from
// primary_gate through that gate, then stop. NULL = unbounded (prior
// behaviour). Lets a Brief-stage artifact stay loud through Go to Deploy
// without nagging at Close Review.
//
// Inactive types and types already attached to the Initiative are excluded.

'use strict';

const { supabase } = require('../../db');

/**
 * Gate sequence position used to compare current gate vs. primary gate
 * for the 'primary_and_subsequent' behavior. D-438.
 */
const GATE_SEQUENCE = {
  brief_review:  1,
  go_to_build:   2,
  go_to_deploy:  3,
  go_to_release: 4,
  close_review:  5
};

/**
 * Pure computation: given the artifact-type rows, the set of artifact_type_ids
 * already attached to the Initiative, and the current gate name, return the
 * list of warning entries.
 *
 * Exported separately from the DB-fetching wrapper so unit tests can exercise
 * the rule without a Supabase client.
 *
 * @param {Array<{artifact_type_id:string, artifact_type_name:string, primary_gate:string|null, gate_warning_behavior:string, gate_warning_on_open:boolean, active_status:boolean}>} artifactTypes
 * @param {Set<string>} attachedTypeIds
 * @param {string} currentGateName
 * @param {{onOpenOnly?:boolean}} [options] onOpenOnly restricts the result to
 *        types flagged gate_warning_on_open (migration 097 / D-616). Default
 *        false preserves the D-438 submit/decision-response behaviour exactly.
 * @returns {Array<{artifact_type_id:string, artifact_type_name:string}>}
 */
function computeWarnings(artifactTypes, attachedTypeIds, currentGateName, options) {
  const currentSeq = GATE_SEQUENCE[currentGateName];
  if (currentSeq === undefined) { return []; }
  const onOpenOnly = options?.onOpenOnly === true;

  return (artifactTypes || [])
    .filter(t => t && t.active_status !== false)
    .filter(t => t.gate_warning_behavior && t.gate_warning_behavior !== 'none')
    // Contract 41 (D-616): the modal-open panel carries only the loud types.
    // Missing/undefined reads as false — a type is never loud by accident.
    .filter(t => !onOpenOnly || t.gate_warning_on_open === true)
    .filter(t => !attachedTypeIds.has(t.artifact_type_id))
    .filter(t => {
      const primarySeq = GATE_SEQUENCE[t.primary_gate];
      if (primarySeq === undefined) { return false; }
      if (t.gate_warning_behavior === 'primary_only') {
        return currentSeq === primarySeq;
      }
      if (t.gate_warning_behavior === 'primary_and_subsequent') {
        if (currentSeq < primarySeq) { return false; }
        // Contract 40 follow-on: optional upper bound. An unrecognised value
        // is treated as unbounded rather than silencing the warning — failing
        // loud is correct for an advisory signal.
        const throughSeq = GATE_SEQUENCE[t.gate_warning_through];
        if (throughSeq !== undefined && currentSeq > throughSeq) { return false; }
        return true;
      }
      return false;
    })
    .map(t => ({
      artifact_type_id:   t.artifact_type_id,
      artifact_type_name: t.artifact_type_name
    }));
}

/**
 * DB-fetching wrapper used by submit_gate_for_approval and
 * record_gate_decision. Returns the same shape as computeWarnings.
 *
 * Returns an empty array when no candidates exist or on any internal error
 * (warnings are non-blocking — surfacing nothing is safer than aborting the
 * caller's flow).
 *
 * @param {string} delivery_cycle_id
 * @param {string} currentGateName  brief_review | go_to_build | ...
 * @returns {Promise<Array<{artifact_type_id:string, artifact_type_name:string}>>}
 */
async function computeArtifactSuggestionWarnings(delivery_cycle_id, currentGateName) {
  if (GATE_SEQUENCE[currentGateName] === undefined) { return []; }

  const { data: types, error: typesErr } = await supabase
    .from('cycle_artifact_types')
    .select('artifact_type_id, artifact_type_name, primary_gate, gate_warning_behavior, gate_warning_through, active_status')
    .eq('active_status', true)
    .neq('gate_warning_behavior', 'none');
  if (typesErr || !types || types.length === 0) {
    return [];
  }

  const candidateIds = types.map(t => t.artifact_type_id);
  const { data: attached, error: attachedErr } = await supabase
    .from('cycle_artifacts')
    .select('artifact_type_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .in('artifact_type_id', candidateIds)
    .is('deleted_at', null);
  if (attachedErr) {
    return [];
  }

  const attachedTypeIds = new Set((attached || []).map(a => a.artifact_type_id));
  return computeWarnings(types, attachedTypeIds, currentGateName);
}

/**
 * Contract 40 follow-on (Phil 2026-07-30): compute the missing-artifact
 * warnings for ALL FIVE gates in one pair of queries, for the READ path.
 *
 * The submitter has always seen these in the submit response, and the approver
 * in the decision response — both AFTER acting. Phil's ruling is that both
 * parties should see omissions while the gate is still open, so the gate modal
 * needs them on load. Computing per-gate would be five round trips; this
 * fetches once and evaluates the shared rule five times.
 *
 * Contract 41 (Phil 2026-07-31, migration 097): scoped to types flagged
 * gate_warning_on_open. The first cut of this function inherited the full
 * D-438 set — twelve bullets at Go to Build — because most artifact types have
 * carried gate_warning_behavior='primary_and_subsequent' since Contract 25 and
 * nothing had ever surfaced them before an action. D-616 intended exactly two:
 * Context Brief and Scenario Journeys. Those types keep contributing to the
 * submit and decision responses via computeArtifactSuggestionWarnings.
 *
 * @param {string} delivery_cycle_id
 * @returns {Promise<Record<string, string[]>>} gate_name → artifact_type_name[]
 */
async function computeArtifactWarningsByGate(delivery_cycle_id) {
  const empty = {
    brief_review: [], go_to_build: [], go_to_deploy: [],
    go_to_release: [], close_review: []
  };

  const { data: types, error: typesErr } = await supabase
    .from('cycle_artifact_types')
    .select('artifact_type_id, artifact_type_name, primary_gate, gate_warning_behavior, gate_warning_through, gate_warning_on_open, active_status')
    .eq('active_status', true)
    .neq('gate_warning_behavior', 'none')
    .eq('gate_warning_on_open', true);
  if (typesErr || !types || types.length === 0) { return empty; }

  const { data: attached, error: attachedErr } = await supabase
    .from('cycle_artifacts')
    .select('artifact_type_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .in('artifact_type_id', types.map(t => t.artifact_type_id))
    .is('deleted_at', null);
  if (attachedErr) { return empty; }

  const attachedTypeIds = new Set((attached || []).map(a => a.artifact_type_id));
  const out = {};
  for (const gate of Object.keys(empty)) {
    // onOpenOnly is belt-and-braces alongside the .eq() above: the FIFO test
    // mock ignores column names on .eq(), so the query filter alone is not
    // something a unit test can prove (CLAUDE.md Standing Note 2).
    out[gate] = computeWarnings(types, attachedTypeIds, gate, { onOpenOnly: true })
      .map(w => w.artifact_type_name);
  }
  return out;
}

module.exports = {
  GATE_SEQUENCE,
  computeWarnings,
  computeArtifactSuggestionWarnings,
  computeArtifactWarningsByGate
};
