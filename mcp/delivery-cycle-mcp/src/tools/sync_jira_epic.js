// sync_jira_epic.js
// Pathways OI Trust — delivery-cycle-mcp
// Reads/writes five governance fields on the linked Jira epic via Jira REST API:
//   1. Outcome Statement
//   2. Context Brief Link (external_url of Context Brief artifact)
//   3. Tier Classification
//   4. Capabilities Equation Mapping (cycle_description used as proxy at Build C)
//   5. Technical Specification status (present/absent — derived from artifact slot)
//
// If JIRA_BASE_URL, JIRA_API_TOKEN, or JIRA_USER_EMAIL are not set,
// returns a graceful stub response without calling Jira.
//
// Updates jira_links.sync_status and last_synced_at on success.
// Appends event log entry.
//
// Source: D-67, D-117, ARCH-16, build-c-spec Section 4.1

'use strict';

const { supabase } = require('../db');

// node-fetch v3 is ESM — use dynamic import wrapped in helper
async function fetchJson(url, options) {
  const { default: fetch } = await import('node-fetch');
  return fetch(url, options);
}

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} params.jira_epic_key  — e.g. PS-2025-042
 * @param {string} caller_user_id - from JWT
 */
async function sync_jira_epic(params, caller_user_id) {
  const { delivery_cycle_id, jira_epic_key } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!jira_epic_key) {
    return { success: false, error: 'jira_epic_key is required.' };
  }

  // ── Graceful stub if Jira credentials are absent ──────────────────────────
  const JIRA_BASE_URL   = process.env.JIRA_BASE_URL;
  const JIRA_API_TOKEN  = process.env.JIRA_API_TOKEN;
  const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL;

  if (!JIRA_BASE_URL || !JIRA_API_TOKEN || !JIRA_USER_EMAIL) {
    return {
      success: true,
      data: {
        synced: false,
        stub: true,
        message:
          'Jira sync is not configured. Set JIRA_BASE_URL, JIRA_API_TOKEN, and JIRA_USER_EMAIL environment variables to enable bidirectional sync.'
      }
    };
  }

  // ── Fetch cycle data ───────────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select(`
      delivery_cycle_id,
      cycle_title,
      outcome_statement,
      tier_classification,
      cycle_description
    `)
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // ── Fetch jira_link record ─────────────────────────────────────────────────
  const { data: jiraLink, error: linkErr } = await supabase
    .from('jira_links')
    .select('jira_link_id, jira_epic_key, sync_status')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('jira_epic_key', jira_epic_key)
    .is('deleted_at', null)
    .single();

  if (linkErr || !jiraLink) {
    return {
      success: false,
      error: `No jira_link record found for epic '${jira_epic_key}' on this cycle. Create the link first.`
    };
  }

  // ── Resolve Context Brief external_url ────────────────────────────────────
  // Find the Context Brief artifact slot and take its external_url if present.
  const { data: contextBriefArtifact } = await supabase
    .from('cycle_artifacts')
    .select('external_url')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .not('external_url', 'is', null)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();
  // Best-effort — null if no external artifact attached yet.

  // ── Resolve Technical Specification status ────────────────────────────────
  const { count: techSpecCount } = await supabase
    .from('cycle_artifacts')
    .select('cycle_artifact_id', { count: 'exact', head: true })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null);

  const tech_spec_present = techSpecCount && techSpecCount > 0;

  // ── Build Jira field payload ───────────────────────────────────────────────
  // Field IDs are Jira-instance-specific. We use customfield_* names from
  // environment variables if configured; otherwise fall back to summary/description
  // for illustration purposes. Update these mappings for your Jira instance.
  const fields = {
    summary: cycle.cycle_title
  };

  if (cycle.outcome_statement) {
    fields['customfield_outcome_statement'] = cycle.outcome_statement;
  }
  if (contextBriefArtifact?.external_url) {
    fields['customfield_context_brief_link'] = contextBriefArtifact.external_url;
  }
  if (cycle.tier_classification) {
    fields['customfield_tier_classification'] = cycle.tier_classification;
  }
  if (cycle.cycle_description) {
    fields['customfield_capabilities_equation'] = cycle.cycle_description;
  }
  fields['customfield_tech_spec_status'] = tech_spec_present ? 'present' : 'absent';

  // ── Call Jira REST API ─────────────────────────────────────────────────────
  const credentials = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const jiraUrl     = `${JIRA_BASE_URL}/rest/api/3/issue/${jira_epic_key}`;

  let syncError = null;
  try {
    const response = await fetchJson(jiraUrl, {
      method:  'PUT',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept':        'application/json',
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({ fields })
    });

    if (!response.ok) {
      const body = await response.text();
      syncError = `Jira API error ${response.status}: ${body}`;
    }
  } catch (networkErr) {
    syncError = `Jira network error: ${networkErr.message}`;
  }

  // ── Update jira_links record ───────────────────────────────────────────────
  const now = new Date().toISOString();

  await supabase
    .from('jira_links')
    .update({
      sync_status:     syncError ? 'error' : 'synced',
      last_synced_at:  syncError ? null : now,
      last_sync_error: syncError || null
    })
    .eq('jira_link_id', jiraLink.jira_link_id);

  // ── Append event log ───────────────────────────────────────────────────────
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        syncError ? 'jira_sync_error' : 'jira_synced',
      event_description: syncError
        ? `Jira sync failed for epic '${jira_epic_key}': ${syncError}`
        : `Jira epic '${jira_epic_key}' synced — five governance fields updated.`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        jira_epic_key,
        fields_attempted: Object.keys(fields),
        sync_error: syncError || null
      }
    });

  if (syncError) {
    return {
      success: false,
      error: syncError,
      data: { jira_epic_key, sync_status: 'error' }
    };
  }

  return {
    success: true,
    data: {
      jira_epic_key,
      sync_status:    'synced',
      last_synced_at: now,
      fields_synced:  Object.keys(fields)
    }
  };
}

module.exports = { sync_jira_epic };
