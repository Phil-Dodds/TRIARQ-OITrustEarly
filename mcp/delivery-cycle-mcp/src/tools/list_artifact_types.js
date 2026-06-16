// list_artifact_types.js
// Pathways OI Trust — delivery-cycle-mcp
// Lists all artifact types, including inactive ones, for the Artifact Type
// admin screen (D-437, Contract 24).
//
// Caller must be admin. Returns rows sorted by (lifecycle_stage, sort_order).

'use strict';

const { supabase } = require('../db');

async function list_artifact_types(_params, caller_user_id) {
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  if (caller?.is_admin !== true) {
    return { success: false, error: 'Admin role required to list artifact types.' };
  }

  const { data, error } = await supabase
    .from('cycle_artifact_types')
    .select('artifact_type_id, artifact_type_name, lifecycle_stage, required_at_gate, guidance_text, sort_order, active_status, created_at, updated_at')
    .order('lifecycle_stage', { ascending: true })
    .order('sort_order',      { ascending: true });
  if (error) {
    return { success: false, error: `Failed to list artifact types: ${error.message}` };
  }
  return { success: true, data: data || [] };
}

module.exports = { list_artifact_types };
