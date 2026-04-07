// promote_artifact_to_oi_library.js
// Pathways OI Trust — delivery-cycle-mcp
// Updates a cycle_artifact to point at an OI Library artifact.
// Sets oi_library_artifact_id, transitions pointer_status to 'promoted',
// preserves external_url if present.
//
// STUB — Build C: OI Library submission workflow is wired in Build B.
// This tool validates the input and records the pointer but does NOT
// execute the OI Library ingestion. The returned data includes
// a stub_message field to surface in the UI.
//
// Source: ARCH-24, Session 2026-03-25-G, build-c-spec Section 4.1

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.cycle_artifact_id
 * @param {string} params.oi_library_artifact_id — UUID of the target OI Library artifact
 * @param {string} caller_user_id - from JWT
 */
async function promote_artifact_to_oi_library(params, caller_user_id) {
  const { cycle_artifact_id, oi_library_artifact_id } = params;

  if (!cycle_artifact_id) {
    return { success: false, error: 'cycle_artifact_id is required.' };
  }
  if (!oi_library_artifact_id) {
    return { success: false, error: 'oi_library_artifact_id is required.' };
  }

  // Fetch the cycle artifact
  const { data: artifact, error: fetchErr } = await supabase
    .from('cycle_artifacts')
    .select('cycle_artifact_id, delivery_cycle_id, display_name, pointer_status, external_url')
    .eq('cycle_artifact_id', cycle_artifact_id)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !artifact) {
    return { success: false, error: 'Cycle artifact not found or has been deleted.' };
  }

  if (artifact.pointer_status === 'promoted' || artifact.pointer_status === 'oi_only') {
    return {
      success: false,
      error: `Artifact has already been promoted (pointer_status = '${artifact.pointer_status}'). No change made.`
    };
  }

  // Update the artifact record
  const { data: updated, error: updateErr } = await supabase
    .from('cycle_artifacts')
    .update({
      oi_library_artifact_id,
      pointer_status: 'promoted'
      // external_url is preserved — no overwrite
    })
    .eq('cycle_artifact_id', cycle_artifact_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to promote artifact: ${updateErr.message}` };
  }

  // Append event log
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id: artifact.delivery_cycle_id,
      event_type:        'artifact_promoted',
      event_description: `Artifact "${artifact.display_name}" promoted to OI Library (stub).`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        cycle_artifact_id,
        oi_library_artifact_id,
        prior_pointer_status: artifact.pointer_status,
        external_url_preserved: !!artifact.external_url
      }
    });

  return {
    success: true,
    data: updated,
    stub_message: 'OI Library submission will be available in Build B.'
  };
}

module.exports = { promote_artifact_to_oi_library };
