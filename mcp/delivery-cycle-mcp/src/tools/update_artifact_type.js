// update_artifact_type.js
// Pathways OI Trust — delivery-cycle-mcp
// Update an artifact type (D-437 origin, D-438 Contract 25 schema). Admin only.
//
// Params:
//   artifact_type_id:   required string
//   Any of: artifact_type_name, lifecycle_stage, guidance_text, sort_order,
//           primary_gate, gate_warning_behavior, active
//
// Deactivation (active:false) is blocked when cycle_artifacts rows reference
// this artifact type. Caller receives a structured block message.

'use strict';

const { supabase } = require('../db');

const VALID_STAGES = new Set([
  'BRIEF','DESIGN','SPEC','BUILD','VALIDATE','UAT','PILOT','RELEASE','OUTCOME','ANY'
]);
const VALID_PRIMARY_GATES = new Set([
  'brief_review','go_to_build','go_to_deploy','go_to_release','close_review'
]);
const VALID_WARNING_BEHAVIORS = new Set([
  'none','primary_only','primary_and_subsequent'
]);

async function update_artifact_type(params, caller_user_id) {
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  if (caller?.is_admin !== true) {
    return { success: false, error: 'Admin role required to update artifact types.' };
  }

  const id = typeof params?.artifact_type_id === 'string' ? params.artifact_type_id : '';
  if (!id) {
    return { success: false, error: 'artifact_type_id is required.' };
  }

  const updates = {};
  if (typeof params.artifact_type_name === 'string') {
    const name = params.artifact_type_name.trim();
    if (!name) { return { success: false, error: 'artifact_type_name cannot be empty.' }; }
    updates.artifact_type_name = name;
  }
  if (typeof params.lifecycle_stage === 'string') {
    if (!VALID_STAGES.has(params.lifecycle_stage)) {
      return { success: false, error: 'lifecycle_stage is invalid.' };
    }
    updates.lifecycle_stage = params.lifecycle_stage;
  }
  if (typeof params.guidance_text === 'string') {
    const guide = params.guidance_text.trim();
    if (!guide) { return { success: false, error: 'guidance_text cannot be empty.' }; }
    updates.guidance_text = guide;
  }
  if (Number.isFinite(params.sort_order)) {
    updates.sort_order = Math.floor(params.sort_order);
  }
  if (Object.prototype.hasOwnProperty.call(params, 'primary_gate')) {
    const p = params.primary_gate;
    if (p !== null && !VALID_PRIMARY_GATES.has(p)) {
      return { success: false, error: 'primary_gate is invalid.' };
    }
    updates.primary_gate = p;
  }
  if (Object.prototype.hasOwnProperty.call(params, 'gate_warning_behavior')) {
    const w = params.gate_warning_behavior;
    if (!VALID_WARNING_BEHAVIORS.has(w)) {
      return { success: false, error: 'gate_warning_behavior is invalid.' };
    }
    updates.gate_warning_behavior = w;
  }
  if (Object.prototype.hasOwnProperty.call(params, 'active')) {
    const next = params.active === true || params.active === false ? params.active : null;
    if (next === null) {
      return { success: false, error: 'active must be boolean.' };
    }
    // Block deactivation when references exist.
    if (next === false) {
      const { count, error: refErr } = await supabase
        .from('cycle_artifacts')
        .select('artifact_id', { count: 'exact', head: true })
        .eq('artifact_type_id', id)
        .is('deleted_at', null);
      if (refErr) {
        return { success: false, error: `Failed to verify references: ${refErr.message}` };
      }
      if ((count ?? 0) > 0) {
        return {
          success: false,
          error: `${count} initiatives have this artifact attached. Remove references before deactivating.`
        };
      }
    }
    updates.active_status = next;
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'No updates supplied.' };
  }

  const { data, error } = await supabase
    .from('cycle_artifact_types')
    .update(updates)
    .eq('artifact_type_id', id)
    .select()
    .single();
  if (error) {
    return { success: false, error: `Failed to update artifact type: ${error.message}` };
  }
  return { success: true, data };
}

module.exports = { update_artifact_type };
