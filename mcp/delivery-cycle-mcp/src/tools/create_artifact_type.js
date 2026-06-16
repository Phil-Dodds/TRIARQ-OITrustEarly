// create_artifact_type.js
// Pathways OI Trust — delivery-cycle-mcp
// Creates a new artifact type (D-437, Contract 24). Admin only.
//
// Params:
//   artifact_type_name: required string
//   lifecycle_stage:    required — one of BRIEF/DESIGN/SPEC/BUILD/VALIDATE/UAT/PILOT/RELEASE/OUTCOME/ANY
//   guidance_text:      required string
//   sort_order:         required integer
//   required_at_gate?:  null | one of brief_review/go_to_build/go_to_deploy/go_to_release/close_review/all

'use strict';

const { supabase } = require('../db');

const VALID_STAGES = new Set([
  'BRIEF','DESIGN','SPEC','BUILD','VALIDATE','UAT','PILOT','RELEASE','OUTCOME','ANY'
]);
const VALID_GATES = new Set([
  'brief_review','go_to_build','go_to_deploy','go_to_release','close_review','all'
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
  const requiredAt = params?.required_at_gate ?? null;

  if (!name)                       { return { success: false, error: 'artifact_type_name is required.' }; }
  if (!VALID_STAGES.has(stage))    { return { success: false, error: 'lifecycle_stage is invalid.' }; }
  if (!guidance)                   { return { success: false, error: 'guidance_text is required.' }; }
  if (sortOrder === null)          { return { success: false, error: 'sort_order is required.' }; }
  if (requiredAt !== null && !VALID_GATES.has(requiredAt)) {
    return { success: false, error: 'required_at_gate is invalid.' };
  }

  const { data, error } = await supabase
    .from('cycle_artifact_types')
    .insert({
      artifact_type_name: name,
      lifecycle_stage:    stage,
      guidance_text:      guidance,
      sort_order:         sortOrder,
      required_at_gate:   requiredAt,
      gate_required:      false,
      active_status:      true
    })
    .select()
    .single();
  if (error) {
    return { success: false, error: `Failed to create artifact type: ${error.message}` };
  }
  return { success: true, data };
}

module.exports = { create_artifact_type };
