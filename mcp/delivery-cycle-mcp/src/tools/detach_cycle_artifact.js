// detach_cycle_artifact.js
// Pathways OI Trust — delivery-cycle-mcp
// Soft-deletes a cycle_artifacts row (Arch-6: never hard delete).
// Used by the Initiative Detail Zone 6 "Remove" action.
//
// Authority: caller must be DCS / EPO / DOL assigned on the Initiative, OR
// be an admin user. Matches update_cycle_artifact.
//
// Source: Contract 25 Part 2 follow-on (2026-06-16), edit/remove user request.

'use strict';

const { supabase } = require('../db');

async function detach_cycle_artifact(params, caller_user_id) {
  const cycle_artifact_id = typeof params?.cycle_artifact_id === 'string'
    ? params.cycle_artifact_id
    : '';
  if (!cycle_artifact_id) {
    return { success: false, error: 'cycle_artifact_id is required.' };
  }

  // ── Load artifact + Initiative for authority check ─────────────────────
  const { data: artifact, error: loadErr } = await supabase
    .from('cycle_artifacts')
    .select('cycle_artifact_id, delivery_cycle_id, display_name, deleted_at')
    .eq('cycle_artifact_id', cycle_artifact_id)
    .single();
  if (loadErr || !artifact) {
    return { success: false, error: 'Cycle artifact not found.' };
  }
  if (artifact.deleted_at) {
    return { success: false, error: 'Artifact already removed.' };
  }

  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id')
    .eq('delivery_cycle_id', artifact.delivery_cycle_id)
    .is('deleted_at', null)
    .single();
  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  const callerIsAdmin = caller?.is_admin === true;
  const callerHasRole =
    cycle.assigned_dcs_user_id === caller_user_id ||
    cycle.assigned_epo_user_id === caller_user_id ||
    cycle.assigned_dol_user_id === caller_user_id;

  if (!callerIsAdmin && !callerHasRole) {
    return {
      success: false,
      error: 'Only the DCS, EPO, DOL or an Admin can remove artifacts on this Initiative.'
    };
  }

  // ── Soft delete (Arch-6) ────────────────────────────────────────────────
  const nowIso = new Date().toISOString();
  const { data: removed, error: removeErr } = await supabase
    .from('cycle_artifacts')
    .update({ deleted_at: nowIso })
    .eq('cycle_artifact_id', cycle_artifact_id)
    .select()
    .single();
  if (removeErr) {
    return { success: false, error: `Failed to remove artifact: ${removeErr.message}` };
  }

  // ── Event log ───────────────────────────────────────────────────────────
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id: artifact.delivery_cycle_id,
      event_type:        'artifact_detached',
      event_description: `Artifact "${artifact.display_name}" removed.`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        cycle_artifact_id,
        display_name: artifact.display_name,
        detached_at:  nowIso
      }
    });

  return { success: true, data: removed };
}

module.exports = { detach_cycle_artifact };
