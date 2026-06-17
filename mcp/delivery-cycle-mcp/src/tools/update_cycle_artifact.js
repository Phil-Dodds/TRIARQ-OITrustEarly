// update_cycle_artifact.js
// Pathways OI Trust — delivery-cycle-mcp
// Updates display_name and/or external_url on an existing cycle_artifacts row.
// Allows correcting a typo, swapping the link, or renaming an ad-hoc.
//
// Authority: caller must be DCS / EPO / DOL assigned on the Initiative that
// owns the artifact, OR be an admin user (is_admin = true). Matches the
// gate-submission authority model so anyone who can move the Initiative
// forward can also curate its artifacts.
//
// Source: Contract 25 Part 2 follow-on (2026-06-16), edit/remove user request.

'use strict';

const { supabase } = require('../db');

async function update_cycle_artifact(params, caller_user_id) {
  const cycle_artifact_id = typeof params?.cycle_artifact_id === 'string'
    ? params.cycle_artifact_id
    : '';
  if (!cycle_artifact_id) {
    return { success: false, error: 'cycle_artifact_id is required.' };
  }

  // ── Build update payload ────────────────────────────────────────────────
  const updates = {};
  if (typeof params.display_name === 'string') {
    const name = params.display_name.trim();
    if (!name) { return { success: false, error: 'display_name cannot be empty.' }; }
    updates.display_name = name;
  }
  if (typeof params.external_url === 'string') {
    const url = params.external_url.trim();
    if (!url) { return { success: false, error: 'external_url cannot be empty.' }; }
    updates.external_url = url;
  }
  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'No updates supplied.' };
  }

  // ── Load artifact + its Initiative for authority check ─────────────────
  const { data: artifact, error: loadErr } = await supabase
    .from('cycle_artifacts')
    .select('cycle_artifact_id, delivery_cycle_id, deleted_at')
    .eq('cycle_artifact_id', cycle_artifact_id)
    .single();
  if (loadErr || !artifact) {
    return { success: false, error: 'Cycle artifact not found.' };
  }
  if (artifact.deleted_at) {
    return { success: false, error: 'Cannot update a removed artifact.' };
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
      error: 'Only the DCS, EPO, DOL or an Admin can edit artifacts on this Initiative.'
    };
  }

  // ── Apply update ────────────────────────────────────────────────────────
  const { data: updated, error: updateErr } = await supabase
    .from('cycle_artifacts')
    .update(updates)
    .eq('cycle_artifact_id', cycle_artifact_id)
    .select()
    .single();
  if (updateErr) {
    return { success: false, error: `Failed to update artifact: ${updateErr.message}` };
  }

  // ── Event log ───────────────────────────────────────────────────────────
  const changed = Object.keys(updates).join(', ');
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id: artifact.delivery_cycle_id,
      event_type:        'artifact_updated',
      event_description: `Artifact "${updated.display_name}" updated (${changed}).`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        cycle_artifact_id,
        updated_fields: Object.keys(updates),
        display_name:   updated.display_name,
        external_url:   updated.external_url
      }
    });

  return { success: true, data: updated };
}

module.exports = { update_cycle_artifact };
