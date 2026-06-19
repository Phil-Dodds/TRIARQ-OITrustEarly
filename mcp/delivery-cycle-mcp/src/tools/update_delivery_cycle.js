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
//
// Contract 29 / D-458 (WS1): other_consulted_user_ids and other_informed_user_ids
//   added as optional uuid[] params. Both are full-array replace (not append):
//   pass [] to clear. Each UUID is validated against users before write. These
//   columns are NOT NULL DEFAULT '{}' (migration 045) — never written as null.

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
  jira_epic_key:           'Jira Epic Link',
  other_consulted_user_ids: 'Other Consulted',
  other_informed_user_ids:  'Other Informed'
};

// D-458: uuid[] fields. Handled distinctly from scalar fields — full-array
// replace, never null, JSON change-detection, per-element user validation.
const ARRAY_USER_FIELDS = new Set([
  'other_consulted_user_ids',
  'other_informed_user_ids'
]);

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
 * @param {string[]} [params.other_consulted_user_ids] — Optional (D-458); full-array replace, [] clears
 * @param {string[]} [params.other_informed_user_ids]  — Optional (D-458); full-array replace, [] clears
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

  // ── D-458: validate uuid[] participant fields (must be arrays of valid users) ─
  for (const arrField of ARRAY_USER_FIELDS) {
    if (fields[arrField] === undefined) { continue; }
    const arr = fields[arrField];
    if (!Array.isArray(arr)) {
      return { success: false, error: `${MUTABLE_FIELD_LABELS[arrField]} must be an array of user ids.` };
    }
    // Deduplicate while preserving first-seen order; reject non-string entries.
    const seen = new Set();
    const cleaned = [];
    for (const id of arr) {
      if (typeof id !== 'string' || !id.trim()) {
        return { success: false, error: `${MUTABLE_FIELD_LABELS[arrField]} contains an invalid user id.` };
      }
      if (!seen.has(id)) { seen.add(id); cleaned.push(id); }
    }
    if (cleaned.length > 0) {
      const { data: foundUsers, error: usersErr } = await supabase
        .from('users')
        .select('id')
        .in('id', cleaned)
        .is('deleted_at', null);
      if (usersErr) {
        return { success: false, error: `Failed to validate ${MUTABLE_FIELD_LABELS[arrField]}: ${usersErr.message}` };
      }
      const foundIds = new Set((foundUsers ?? []).map(u => u.id));
      const missing = cleaned.filter(id => !foundIds.has(id));
      if (missing.length > 0) {
        return {
          success: false,
          error: `${MUTABLE_FIELD_LABELS[arrField]} contains user id(s) that do not exist: ${missing.join(', ')}.`
        };
      }
    }
    // Replace the supplied value with the cleaned (deduped) array.
    fields[arrField] = cleaned;
  }

  // ── Fetch current Initiative record ────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, cycle_status, division_id, workstream_id, tier_classification, outcome_statement, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id, jira_epic_key, other_consulted_user_ids, other_informed_user_ids')
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
    if (ARRAY_USER_FIELDS.has(field)) {
      // NOT NULL uuid[] columns — write the cleaned array, never null. [] clears.
      updatePayload[field] = Array.isArray(fields[field]) ? fields[field] : [];
    } else {
      // Allow explicit null to clear nullable scalar fields
      updatePayload[field] = fields[field] ?? null;
    }
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
    if (ARRAY_USER_FIELDS.has(field)) {
      // Compare as ordered JSON. cycle[field] is the prior uuid[] (defaults to []).
      const oldArr = Array.isArray(cycle[field]) ? cycle[field] : [];
      const newArr = Array.isArray(updatePayload[field]) ? updatePayload[field] : [];
      return JSON.stringify(oldArr) !== JSON.stringify(newArr);
    }
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
