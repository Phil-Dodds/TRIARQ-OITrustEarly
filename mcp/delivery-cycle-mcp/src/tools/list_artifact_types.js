// list_artifact_types.js
// Pathways OI Trust — delivery-cycle-mcp
// Lists all artifact types (active + inactive) for the Initiative Artifact
// Types admin screen (D-437 origin, D-438 + Amendment 1 schema).
//
// D-438 Amendment 1 (Contract 25 Part 2): `cycle_artifact_types.lifecycle_stage`
// is dropped — gate is the single organizing concept. Rows are returned ordered
// by (primary_gate sequence ASC, sort_order ASC); NULL primary_gate rows
// (Unscheduled) come last.
//
// Caller must be admin.

'use strict';

const { supabase } = require('../db');

// Gate sequence map for sort ordering. Mirrors helpers/artifact-warnings.js
// GATE_SEQUENCE. Keep in sync if a sixth gate is ever added.
const GATE_SORT_INDEX = {
  brief_review:  1,
  go_to_build:   2,
  go_to_deploy:  3,
  go_to_release: 4,
  close_review:  5
};

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
    .select('artifact_type_id, artifact_type_name, primary_gate, gate_warning_behavior, guidance_text, sort_order, active_status, created_at, updated_at')
    .order('sort_order', { ascending: true });
  if (error) {
    return { success: false, error: `Failed to list artifact types: ${error.message}` };
  }

  // Stable client-friendly order: primary_gate sequence (NULL last), then sort_order.
  const ordered = (data || []).slice().sort((a, b) => {
    const ai = a.primary_gate ? (GATE_SORT_INDEX[a.primary_gate] ?? 98) : 99;
    const bi = b.primary_gate ? (GATE_SORT_INDEX[b.primary_gate] ?? 98) : 99;
    if (ai !== bi) { return ai - bi; }
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  return { success: true, data: ordered };
}

module.exports = { list_artifact_types };
