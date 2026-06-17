// attach_cycle_artifact.js
// Pathways OI Trust — delivery-cycle-mcp
// Attaches an artifact record to a Delivery Cycle.
// Accepts: delivery_cycle_id, artifact_type_id (nullable for ad hoc),
//          gate_affinity (nullable; required for ad-hoc to render in Zone 6),
//          display_name, external_url or oi_library_artifact_id, pointer_status.
// Appends event log entry.
// Source: ARCH-24, Session 2026-03-25-G, build-c-spec Section 4.1.
//
// Contract 25 Part 2 follow-on (2026-06-16):
//   * `gate_affinity` column added on cycle_artifacts via Migration 042.
//     Carried through inserts so Zone 6 can render ad-hocs in their group.
//   * Sentinel `'__adhoc__<gate>'` from the Angular ad-hoc attach button is
//     parsed here: artifact_type_id → null, gate_affinity → <gate>.
//   * Stale / unknown artifact_type_id no longer hard-rejects — the attach
//     degrades to ad-hoc (type=null, gate_affinity=null) so the user's
//     display_name + external_url still record. Removes the
//     "artifact_type_id not found in cycle_artifact_types." failure mode.

'use strict';

const { supabase } = require('../db');

const VALID_GATE_AFFINITIES = new Set([
  'brief_review',
  'go_to_build',
  'go_to_deploy',
  'go_to_release',
  'close_review',
  'unscheduled'
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @param {object} params
 * @param {string}  params.delivery_cycle_id
 * @param {string}  [params.artifact_type_id]      — null for ad hoc; '__adhoc__<gate>' sentinel also accepted
 * @param {string}  [params.gate_affinity]         — gate group key for ad-hoc rendering
 * @param {string}  params.display_name
 * @param {string}  [params.external_url]
 * @param {string}  [params.oi_library_artifact_id]
 * @param {string}  [params.pointer_status]
 * @param {string}  caller_user_id - from JWT
 */
async function attach_cycle_artifact(params, caller_user_id) {
  const {
    delivery_cycle_id,
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

  // ── Resolve artifact_type_id + gate_affinity ──────────────────────────
  // Three input shapes:
  //   (a) artifact_type_id is a UUID                  → slot attach
  //   (b) artifact_type_id starts with '__adhoc__'    → ad-hoc; parse gate from suffix
  //   (c) artifact_type_id is null/undefined          → ad-hoc; gate_affinity from explicit param
  let resolvedTypeId = null;
  let resolvedAffinity = null;

  const rawTypeId = params.artifact_type_id;

  if (typeof rawTypeId === 'string' && rawTypeId.startsWith('__adhoc__')) {
    // (b) sentinel — parse gate name from suffix.
    const suffix = rawTypeId.slice('__adhoc__'.length);
    if (VALID_GATE_AFFINITIES.has(suffix)) {
      resolvedAffinity = suffix;
    }
    resolvedTypeId = null;
  } else if (typeof rawTypeId === 'string' && rawTypeId.length > 0) {
    // (a) candidate UUID — verify it exists. If lookup fails (stale id,
    // non-UUID format, removed type), degrade to ad-hoc rather than reject.
    if (UUID_RE.test(rawTypeId)) {
      const { data: artType } = await supabase
        .from('cycle_artifact_types')
        .select('artifact_type_id')
        .eq('artifact_type_id', rawTypeId)
        .maybeSingle();
      resolvedTypeId = artType ? rawTypeId : null;
    } else {
      resolvedTypeId = null;
    }
  }

  // Explicit gate_affinity param takes precedence when the sentinel path
  // didn't fire, so callers can be explicit instead of using the suffix encoding.
  if (typeof params.gate_affinity === 'string') {
    if (VALID_GATE_AFFINITIES.has(params.gate_affinity)) {
      resolvedAffinity = params.gate_affinity;
    } else {
      return { success: false, error: 'gate_affinity is invalid.' };
    }
  }

  // If we landed on a real type, clear any inferred affinity — type-bound
  // attachments render via cycle_artifact_types.primary_gate, not affinity.
  if (resolvedTypeId !== null) {
    resolvedAffinity = null;
  }

  // ── Verify cycle exists ───────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, current_lifecycle_stage')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // ── Insert artifact record ────────────────────────────────────────────
  const { data: artifact, error: insertErr } = await supabase
    .from('cycle_artifacts')
    .insert({
      delivery_cycle_id,
      artifact_type_id:       resolvedTypeId,
      gate_affinity:          resolvedAffinity,
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

  // ── Append event log entry ────────────────────────────────────────────
  const event_description = resolvedTypeId
    ? `Artifact attached: "${display_name.trim()}".`
    : `Ad-hoc artifact attached${resolvedAffinity ? ` to ${resolvedAffinity}` : ''}: "${display_name.trim()}".`;

  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'artifact_attached',
      event_description,
      actor_user_id:     caller_user_id,
      event_metadata: {
        cycle_artifact_id:      artifact.cycle_artifact_id,
        artifact_type_id:       resolvedTypeId,
        gate_affinity:          resolvedAffinity,
        display_name:           display_name.trim(),
        pointer_status,
        has_external_url:       !!external_url,
        has_oi_library_pointer: !!oi_library_artifact_id
      }
    });

  return { success: true, data: artifact };
}

module.exports = { attach_cycle_artifact };
