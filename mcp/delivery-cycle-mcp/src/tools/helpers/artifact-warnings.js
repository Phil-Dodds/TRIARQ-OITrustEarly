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
 * @param {Array<{artifact_type_id:string, artifact_type_name:string, primary_gate:string|null, gate_warning_behavior:string, active_status:boolean}>} artifactTypes
 * @param {Set<string>} attachedTypeIds
 * @param {string} currentGateName
 * @returns {Array<{artifact_type_id:string, artifact_type_name:string}>}
 */
function computeWarnings(artifactTypes, attachedTypeIds, currentGateName) {
  const currentSeq = GATE_SEQUENCE[currentGateName];
  if (currentSeq === undefined) { return []; }

  return (artifactTypes || [])
    .filter(t => t && t.active_status !== false)
    .filter(t => t.gate_warning_behavior && t.gate_warning_behavior !== 'none')
    .filter(t => !attachedTypeIds.has(t.artifact_type_id))
    .filter(t => {
      const primarySeq = GATE_SEQUENCE[t.primary_gate];
      if (primarySeq === undefined) { return false; }
      if (t.gate_warning_behavior === 'primary_only') {
        return currentSeq === primarySeq;
      }
      if (t.gate_warning_behavior === 'primary_and_subsequent') {
        return currentSeq >= primarySeq;
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
    .select('artifact_type_id, artifact_type_name, primary_gate, gate_warning_behavior, active_status')
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

module.exports = {
  GATE_SEQUENCE,
  computeWarnings,
  computeArtifactSuggestionWarnings
};
