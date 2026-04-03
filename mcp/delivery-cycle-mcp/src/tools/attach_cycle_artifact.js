// attach_cycle_artifact.js
// Pathways OI Trust — delivery-cycle-mcp
// Attaches an artifact record to a Delivery Cycle.
// Accepts: delivery_cycle_id, artifact_type_id (nullable for ad hoc),
//          display_name, external_url or oi_library_artifact_id, pointer_status.
// Appends event log entry.
// Source: ARCH-24, Session 2026-03-25-G, build-c-spec Section 4.1

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string}  params.delivery_cycle_id
 * @param {string}  [params.artifact_type_id]      — null for ad hoc
 * @param {string}  params.display_name
 * @param {string}  [params.external_url]           — MSO365 or other link
 * @param {string}  [params.oi_library_artifact_id] — OI Library pointer
 * @param {string}  [params.pointer_status]         — 'external_only' | 'promoted' | 'oi_only'; defaults to 'external_only'
 * @param {string}  caller_user_id - from JWT
 */
async function attach_cycle_artifact(params, caller_user_id) {
  const {
    delivery_cycle_id,
    artifact_type_id,
    display_name,
    external_url,
    oi_library_artifact_id,
    pointer_status = 'external_only'
  } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!display_name || !display_name.trim()) {
    return { success: false, error: 'display_name is required and cannot be empty.' };
  }
  if (!external_url && !oi_library_artifact_id) {
    return {
      success: false,
      error: 'At least one of external_url or oi_library_artifact_id is required.'
    };
  }
  if (!['external_only', 'promoted', 'oi_only'].includes(pointer_status)) {
    return {
      success: false,
      error: "pointer_status must be 'external_only', 'promoted', or 'oi_only'."
    };
  }

  // Verify cycle exists
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, current_lifecycle_stage')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // If artifact_type_id provided, verify it exists
  if (artifact_type_id) {
    const { data: artType, error: artTypeErr } = await supabase
      .from('cycle_artifact_types')
      .select('artifact_type_id, artifact_type_name, lifecycle_stage')
      .eq('artifact_type_id', artifact_type_id)
      .single();

    if (artTypeErr || !artType) {
      return { success: false, error: 'artifact_type_id not found in cycle_artifact_types.' };
    }
  }

  // Insert artifact record
  const { data: artifact, error: insertErr } = await supabase
    .from('cycle_artifacts')
    .insert({
      delivery_cycle_id,
      artifact_type_id:       artifact_type_id || null,
      display_name:           display_name.trim(),
      external_url:           external_url || null,
      oi_library_artifact_id: oi_library_artifact_id || null,
      pointer_status,
      attached_by_user_id:    caller_user_id,
      attached_at:            new Date().toISOString()
    })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: `Failed to attach artifact: ${insertErr.message}` };
  }

  // Append event log
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'artifact_attached',
      event_description: `Artifact attached: "${display_name.trim()}".`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        cycle_artifact_id:      artifact.cycle_artifact_id,
        artifact_type_id:       artifact_type_id || null,
        display_name:           display_name.trim(),
        pointer_status,
        has_external_url:       !!external_url,
        has_oi_library_pointer: !!oi_library_artifact_id
      }
    });

  return { success: true, data: artifact };
}

module.exports = { attach_cycle_artifact };
