// update_delivery_cycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Updates mutable fields on an existing Delivery Cycle.
// All supplied fields are written; omitted fields are not changed.
// Logs a field_edit event per D-229 for every changed field.
//
// CC-Decision-2026-04-10-D: Net-new tool built in Contract 2 (2026-04-10) —
//   not a correction to an existing tool. Required for the Edit Cycle surface.
//   The individual-field tools (set_outcome_statement, assign_ds_cb_to_cycle)
//   remain for their specific use cases; this tool is the Edit surface save path.
//
// Source: build-c-spec Section 4 (update_delivery_cycle contract), D-229, Contract 2 2026-04-10

'use strict';

const { supabase } = require('../db');

// Mutable fields accepted by this tool and their display labels for event log.
// Source: delivery-cycle-detail-panel-spec-2026-04-09.md Section 2.3
const MUTABLE_FIELD_LABELS = {
  cycle_title:             'Delivery Cycle Title',
  division_id:             'Division',
  outcome_statement:       'Outcome Statement',
  workstream_id:           'Delivery Workstream',
  tier_classification:     'Tier Classification',
  assigned_ds_user_id:     'Assigned Domain Strategist',
  assigned_cb_user_id:     'Assigned Capability Builder',
  jira_epic_key:           'Jira Epic Link'
};

/**
 * @param {object} params
 * @param {string}  params.delivery_cycle_id          — Required
 * @param {string}  [params.cycle_title]              — Optional; max 120 chars
 * @param {string}  [params.division_id]              — Optional
 * @param {string|null} [params.outcome_statement]    — Optional; null clears the field
 * @param {string|null} [params.workstream_id]        — Optional; null clears the field (D-165)
 * @param {string}  [params.tier_classification]      — Optional; 'tier_1'|'tier_2'|'tier_3'
 * @param {string|null} [params.assigned_ds_user_id]  — Optional; null clears (D-174)
 * @param {string|null} [params.assigned_cb_user_id]  — Optional; null clears (D-174)
 * @param {string|null} [params.jira_epic_key]        — Optional; null clears the field
 * @param {string} caller_user_id - from JWT
 */
async function update_delivery_cycle(params, caller_user_id) {
  const { delivery_cycle_id, ...fields } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  // ── Validate that at least one mutable field was supplied ─────────────────
  const suppliedFields = Object.keys(fields).filter(k => k in MUTABLE_FIELD_LABELS);
  if (suppliedFields.length === 0) {
    return { success: false, error: 'No mutable fields supplied. Provide at least one field to update.' };
  }

  // ── Validate individual field values ──────────────────────────────────────
  if (fields.cycle_title !== undefined) {
    if (!fields.cycle_title || !String(fields.cycle_title).trim()) {
      return { success: false, error: 'cycle_title cannot be empty.' };
    }
    if (String(fields.cycle_title).length > 120) {
      return { success: false, error: 'cycle_title must be 120 characters or fewer.' };
    }
  }

  if (fields.tier_classification !== undefined) {
    if (!['tier_1', 'tier_2', 'tier_3'].includes(fields.tier_classification)) {
      return { success: false, error: 'tier_classification must be one of: tier_1, tier_2, tier_3.' };
    }
  }

  // ── Fetch current cycle record ─────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, cycle_status, division_id, workstream_id, tier_classification, outcome_statement, assigned_ds_user_id, assigned_cb_user_id, jira_epic_key')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  if (cycle.cycle_status === 'cancelled') {
    return { success: false, error: 'This Delivery Cycle is cancelled. Un-cancel it before making edits.' };
  }

  // ── Verify foreign key references (if supplied) ────────────────────────────
  if (fields.division_id) {
    const { data: div, error: divErr } = await supabase
      .from('divisions')
      .select('id')
      .eq('id', fields.division_id)
      .is('deleted_at', null)
      .single();
    if (divErr || !div) {
      return { success: false, error: 'division_id not found or has been deleted.' };
    }
  }

  if (fields.workstream_id) {
    const { data: ws, error: wsErr } = await supabase
      .from('delivery_workstreams')
      .select('workstream_id')
      .eq('workstream_id', fields.workstream_id)
      .is('deleted_at', null)
      .single();
    if (wsErr || !ws) {
      return { success: false, error: 'workstream_id not found or has been deleted.' };
    }
  }

  if (fields.assigned_ds_user_id) {
    const { data: ds, error: dsErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', fields.assigned_ds_user_id)
      .is('deleted_at', null)
      .single();
    if (dsErr || !ds) {
      return { success: false, error: 'assigned_ds_user_id not found or has been deleted.' };
    }
  }

  if (fields.assigned_cb_user_id) {
    const { data: cb, error: cbErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', fields.assigned_cb_user_id)
      .is('deleted_at', null)
      .single();
    if (cbErr || !cb) {
      return { success: false, error: 'assigned_cb_user_id not found or has been deleted.' };
    }
  }

  // ── Build update payload — only supplied mutable fields ───────────────────
  const updatePayload = {};
  for (const field of suppliedFields) {
    // Allow explicit null to clear nullable fields
    updatePayload[field] = fields[field] ?? null;
  }
  if (updatePayload.cycle_title) {
    updatePayload.cycle_title = String(updatePayload.cycle_title).trim();
  }
  if (updatePayload.outcome_statement) {
    updatePayload.outcome_statement = String(updatePayload.outcome_statement).trim() || null;
  }
  if (updatePayload.jira_epic_key) {
    updatePayload.jira_epic_key = String(updatePayload.jira_epic_key).trim() || null;
  }

  // ── Perform update ─────────────────────────────────────────────────────────
  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update(updatePayload)
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to update Delivery Cycle: ${updateErr.message}` };
  }

  // ── Log field_edit event per D-229 ────────────────────────────────────────
  // One event entry per changed field.
  const changedFields = suppliedFields.filter(field => {
    const oldVal = cycle[field] ?? null;
    const newVal = updatePayload[field] ?? null;
    return String(oldVal) !== String(newVal);
  });

  if (changedFields.length > 0) {
    const eventRows = changedFields.map(field => ({
      delivery_cycle_id,
      event_type:        'field_edit',
      event_description: `${MUTABLE_FIELD_LABELS[field]} updated.`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        field_name: field,
        old_value:  cycle[field] ?? null,
        new_value:  updatePayload[field] ?? null
      }
    }));

    await supabase
      .from('cycle_event_log')
      .insert(eventRows);
  }

  return { success: true, data: updated };
}

module.exports = { update_delivery_cycle };
