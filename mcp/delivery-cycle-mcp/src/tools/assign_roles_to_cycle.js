// assign_roles_to_cycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Sets DCS / EPO / DOL on an Initiative. Any subset may be provided in a single call.
// Caller must be phil, admin, dcs, epo, dol, or ce.
// Appends one event log entry per call summarising assignment changes.
// Governing decisions: D-389, D-390, D-391, D-393. Migration 024 + 032.

'use strict';

const { supabase } = require('../db');

const VALID_ASSIGNER_ROLES = ['phil', 'admin', 'dcs', 'epo', 'dol', 'ce'];

/**
 * @param {object} params
 * @param {string}  params.delivery_cycle_id
 * @param {string}  [params.assigned_dcs_user_id]  — null to clear
 * @param {string}  [params.assigned_epo_user_id]  — null to clear
 * @param {string}  [params.assigned_dol_user_id]  — null to clear
 * @param {string}  caller_user_id - from JWT
 */
async function assign_roles_to_cycle(params, caller_user_id) {
  const {
    delivery_cycle_id,
    assigned_dcs_user_id,
    assigned_epo_user_id,
    assigned_dol_user_id
  } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  if (
    assigned_dcs_user_id === undefined &&
    assigned_epo_user_id === undefined &&
    assigned_dol_user_id === undefined
  ) {
    return {
      success: false,
      error: 'At least one of assigned_dcs_user_id, assigned_epo_user_id, or assigned_dol_user_id is required.'
    };
  }

  // ── Caller role check ─────────────────────────────────────────────────────
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('system_role, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (!caller.is_active) {
    return { success: false, error: 'Your account is inactive.' };
  }
  if (!VALID_ASSIGNER_ROLES.includes(caller.system_role)) {
    return {
      success: false,
      error: 'Assigning a Domain Capability Strategist, Engineering Product Owner, or Domain Outcome Lead requires DCS, EPO, DOL, CE, Admin, or Phil role.'
    };
  }

  // ── Fetch current cycle ───────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id, current_lifecycle_stage')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  // ── Validate per-role user candidate ──────────────────────────────────────
  async function validateAssigneeOrFail(userId, roleLabel) {
    if (!userId) { return null; }
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, display_name, system_role, is_active')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();
    if (userErr || !user) {
      return { success: false, error: `Assigned ${roleLabel} user not found. Select a valid user.` };
    }
    if (!user.is_active) {
      return { success: false, error: `${user.display_name} is inactive and cannot be assigned as ${roleLabel}.` };
    }
    return null;
  }

  const validations = await Promise.all([
    validateAssigneeOrFail(assigned_dcs_user_id, 'Domain Capability Strategist'),
    validateAssigneeOrFail(assigned_epo_user_id, 'Engineering Product Owner'),
    validateAssigneeOrFail(assigned_dol_user_id, 'Domain Outcome Lead')
  ]);
  const validationFailure = validations.find(v => v);
  if (validationFailure) {
    return validationFailure;
  }

  // ── Build update payload + event description ──────────────────────────────
  const updates = {};
  const eventParts = [];

  function trackAssignment(paramValue, columnName, roleLabel) {
    if (paramValue === undefined) { return; }
    updates[columnName] = paramValue || null;
    eventParts.push(paramValue
      ? `${roleLabel} assigned (user ${paramValue})`
      : `${roleLabel} cleared`);
  }

  trackAssignment(assigned_dcs_user_id, 'assigned_dcs_user_id', 'Domain Capability Strategist');
  trackAssignment(assigned_epo_user_id, 'assigned_epo_user_id', 'Engineering Product Owner');
  trackAssignment(assigned_dol_user_id, 'assigned_dol_user_id', 'Domain Outcome Lead');

  // ── Apply update ──────────────────────────────────────────────────────────
  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update(updates)
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to update assignments: ${updateErr.message}` };
  }

  // ── Append event log ──────────────────────────────────────────────────────
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'assignment_updated',
      event_description: eventParts.join('. ') + '.',
      actor_user_id:     caller_user_id,
      event_metadata:    updates
    });

  return { success: true, data: updated };
}

module.exports = { assign_roles_to_cycle };
