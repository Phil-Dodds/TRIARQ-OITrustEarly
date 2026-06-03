// update_delivery_cycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Updates mutable fields on an existing Initiative (D-392).
// All supplied fields are written; omitted fields are not changed.
// Logs a field_edit event per D-229 for every changed field.
//
// The individual-field tools (set_outcome_statement, assign_roles_to_cycle)
// remain for their specific use cases; this tool is the Edit surface save path.
//
// Source: D-229, D-389, D-390, D-391, D-393.

'use strict';

const { supabase } = require('../db');

const VALID_TIERS = ['tier_1', 'tier_2', 'tier_3'];

// Mutable fields accepted by this tool and their display labels for event log.
const MUTABLE_FIELD_LABELS = {
  cycle_title:             'Initiative Title',
  division_id:             'Division',
  outcome_statement:       'Outcome Statement',
  workstream_id:           'Delivery Workstream',
  tier_classification:     'Tier Classification',
  assigned_dcs_user_id:    'Assigned Domain Capability Strategist',
  assigned_epo_user_id:    'Assigned Engineering Product Owner',
  assigned_dol_user_id:    'Assigned Domain Outcome Lead',
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
 * @param {string|null} [params.assigned_dcs_user_id] — Optional; null clears (D-389)
 * @param {string|null} [params.assigned_epo_user_id] — Optional; null clears (D-390)
 * @param {string|null} [params.assigned_dol_user_id] — Optional; null clears (D-391)
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
    if (!VALID_TIERS.includes(fields.tier_classification)) {
      return { success: false, error: 'tier_classification must be one of: tier_1, tier_2, tier_3.' };
    }
  }

  // ── Fetch current Initiative record ────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, cycle_status, division_id, workstream_id, tier_classification, outcome_statement, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id, jira_epic_key')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  if (cycle.cycle_status === 'cancelled') {
    return { success: false, error: 'This Initiative is cancelled. Un-cancel it before making edits.' };
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

  async function verifyAssignedUserOrFail(userId, paramName) {
    if (!userId) { return null; }
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();
    if (userErr || !user) {
      return { success: false, error: `${paramName} not found or has been deleted.` };
    }
    return null;
  }

  const assigneeFailure = (
    await verifyAssignedUserOrFail(fields.assigned_dcs_user_id, 'assigned_dcs_user_id') ||
    await verifyAssignedUserOrFail(fields.assigned_epo_user_id, 'assigned_epo_user_id') ||
    await verifyAssignedUserOrFail(fields.assigned_dol_user_id, 'assigned_dol_user_id')
  );
  if (assigneeFailure) {
    return assigneeFailure;
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
    return { success: false, error: `Failed to update Initiative: ${updateErr.message}` };
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
