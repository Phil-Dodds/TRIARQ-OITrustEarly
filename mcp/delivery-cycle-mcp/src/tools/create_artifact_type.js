// create_artifact_type.js
// Pathways OI Trust — delivery-cycle-mcp
// Creates a new artifact type (D-437 origin, D-438 Contract 25 schema). Admin only.
//
// Params:
//   artifact_type_name:     required string
//   lifecycle_stage:        required — one of BRIEF/DESIGN/SPEC/BUILD/VALIDATE/UAT/PILOT/RELEASE/OUTCOME/ANY
//   guidance_text:          required string
//   sort_order:             required integer
//   primary_gate?:          null | brief_review/go_to_build/go_to_deploy/go_to_release/close_review
//   gate_warning_behavior?: 'none' | 'primary_only' | 'primary_and_subsequent' (default 'none')

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

async function create_artifact_type(params, caller_user_id) {
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  if (caller?.is_admin !== true) {
    return { success: false, error: 'Admin role required to create artifact types.' };
  }

  const name      = typeof params?.artifact_type_name === 'string' ? params.artifact_type_name.trim() : '';
  const stage     = params?.lifecycle_stage;
  const guidance  = typeof params?.guidance_text === 'string' ? params.guidance_text.trim() : '';
  const sortOrder = Number.isFinite(params?.sort_order) ? Math.floor(params.sort_order) : null;
  const primaryGate    = params?.primary_gate ?? null;
  const warningBehavior = params?.gate_warning_behavior ?? 'none';

  if (!name)                       { return { success: false, error: 'artifact_type_name is required.' }; }
  if (!VALID_STAGES.has(stage))    { return { success: false, error: 'lifecycle_stage is invalid.' }; }
  if (!guidance)                   { return { success: false, error: 'guidance_text is required.' }; }
  if (sortOrder === null)          { return { success: false, error: 'sort_order is required.' }; }
  if (primaryGate !== null && !VALID_PRIMARY_GATES.has(primaryGate)) {
    return { success: false, error: 'primary_gate is invalid.' };
  }
  if (!VALID_WARNING_BEHAVIORS.has(warningBehavior)) {
    return { success: false, error: 'gate_warning_behavior is invalid.' };
  }

  const { data, error } = await supabase
    .from('cycle_artifact_types')
    .insert({
      artifact_type_name:    name,
      lifecycle_stage:       stage,
      guidance_text:         guidance,
      sort_order:            sortOrder,
      primary_gate:          primaryGate,
      gate_warning_behavior: warningBehavior,
      gate_required:         false,
      active_status:         true
    })
    .select()
    .single();
  if (error) {
    return { success: false, error: `Failed to create artifact type: ${error.message}` };
  }
  return { success: true, data };
}

module.exports = { create_artifact_type };
