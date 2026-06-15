// link_jira_epic.js
// Pathways OI Trust — delivery-cycle-mcp
// Creates (or updates) a jira_links record for a Delivery Cycle and mirrors the
// epic key onto delivery_cycles.jira_epic_key. Idempotent — re-linking the same
// key is a no-op; a different key replaces the prior link in place.
//
// Phil 2026-06-15 bug fix: prior to this tool, the Angular "+ Link Jira Epic"
// button called sync_jira_epic directly. That tool REQUIRES a pre-existing
// jira_links row and returns a stub success when Jira creds are absent — so
// the link never persisted and the UI silently dropped the input.
//
// Source: D-67, D-117, ARCH-16, build-c-spec Section 3.9.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} params.jira_epic_key  — e.g. "PS-2025-042"
 * @param {string} caller_user_id - from JWT
 */
async function link_jira_epic(params, caller_user_id) {
  const { delivery_cycle_id, jira_epic_key } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!jira_epic_key || !String(jira_epic_key).trim()) {
    return { success: false, error: 'jira_epic_key is required.' };
  }

  const trimmedKey = String(jira_epic_key).trim();

  // Derive jira_project_key from the epic key prefix (e.g. "PS-2025-042" → "PS").
  // When the key contains no dash, the full key serves as the project.
  const dashIdx = trimmedKey.indexOf('-');
  const jira_project_key = dashIdx > 0 ? trimmedKey.slice(0, dashIdx) : trimmedKey;

  // Verify cycle exists and isn't deleted.
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  // Look up any existing active link for this cycle. Build C: one link per cycle.
  const { data: existing } = await supabase
    .from('jira_links')
    .select('jira_link_id, jira_epic_key')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .maybeSingle();

  let linkRow;

  if (existing && existing.jira_epic_key === trimmedKey) {
    // No change — idempotent re-link returns the existing row.
    linkRow = existing;
  } else if (existing) {
    // Different key — update the existing link row in place.
    const { data: updated, error: updErr } = await supabase
      .from('jira_links')
      .update({
        jira_epic_key:   trimmedKey,
        jira_project_key,
        sync_status:     'unsynced',
        last_synced_at:  null,
        last_sync_error: null
      })
      .eq('jira_link_id', existing.jira_link_id)
      .select()
      .single();
    if (updErr) {
      return { success: false, error: `Failed to update Jira link: ${updErr.message}` };
    }
    linkRow = updated;
  } else {
    // First link for this cycle — insert.
    const { data: inserted, error: insErr } = await supabase
      .from('jira_links')
      .insert({
        delivery_cycle_id,
        jira_epic_key:   trimmedKey,
        jira_project_key,
        sync_status:     'unsynced'
      })
      .select()
      .single();
    if (insErr) {
      return { success: false, error: `Failed to create Jira link: ${insErr.message}` };
    }
    linkRow = inserted;
  }

  // Mirror to delivery_cycles.jira_epic_key so the legacy field stays consistent.
  await supabase
    .from('delivery_cycles')
    .update({ jira_epic_key: trimmedKey })
    .eq('delivery_cycle_id', delivery_cycle_id);

  // Append event log entry. Skip when the link was already at this key (no change).
  if (!existing || existing.jira_epic_key !== trimmedKey) {
    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        existing ? 'jira_epic_relinked' : 'jira_epic_linked',
        event_description: existing
          ? `Jira epic changed from '${existing.jira_epic_key}' to '${trimmedKey}'.`
          : `Jira epic '${trimmedKey}' linked to this Initiative.`,
        actor_user_id:     caller_user_id,
        event_metadata: {
          jira_epic_key:        trimmedKey,
          jira_project_key,
          prior_jira_epic_key:  existing?.jira_epic_key ?? null
        }
      });
  }

  return { success: true, data: linkRow };
}

module.exports = { link_jira_epic };
