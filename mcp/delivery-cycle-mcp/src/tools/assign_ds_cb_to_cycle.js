// assign_ds_cb_to_cycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Sets the Delivery Specialist (DS) and/or Capability Builder (CB) on a cycle.
// Either or both fields may be provided in a single call.
// Caller must be phil, admin, ds, cb, or ce.
// Appends event log entry for each assignment change.
// Source: delivery-cycle-dashboard-spec.md Section 1.2, migration 024

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string}  params.delivery_cycle_id
 * @param {string}  [params.assigned_ds_user_id]  — null to clear
 * @param {string}  [params.assigned_cb_user_id]  — null to clear
 * @param {string}  caller_user_id - from JWT
 */
async function assign_ds_cb_to_cycle(params, caller_user_id) {
  const { delivery_cycle_id, assigned_ds_user_id, assigned_cb_user_id } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  // At least one assignment must be provided
  if (assigned_ds_user_id === undefined && assigned_cb_user_id === undefined) {
    return { success: false, error: 'At least one of assigned_ds_user_id or assigned_cb_user_id is required.' };
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
  if (!['phil', 'admin', 'ds', 'cb', 'ce'].includes(caller.system_role)) {
    return {
      success: false,
      error: 'Assigning a Delivery Specialist or Capability Builder requires DS, CB, CE, Admin, or Phil role.'
    };
  }

  // ── Fetch current cycle ───────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, assigned_ds_user_id, assigned_cb_user_id, current_lifecycle_stage')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // ── Validate DS user if provided ──────────────────────────────────────────
  if (assigned_ds_user_id) {
    const { data: dsUser, error: dsErr } = await supabase
      .from('users')
      .select('id, display_name, system_role, is_active')
      .eq('id', assigned_ds_user_id)
      .is('deleted_at', null)
      .single();

    if (dsErr || !dsUser) {
      return { success: false, error: 'assigned_ds_user_id not found. Select a valid user.' };
    }
    if (!dsUser.is_active) {
      return { success: false, error: `${dsUser.display_name} is inactive and cannot be assigned as Delivery Specialist.` };
    }
  }

  // ── Validate CB user if provided ──────────────────────────────────────────
  if (assigned_cb_user_id) {
    const { data: cbUser, error: cbErr } = await supabase
      .from('users')
      .select('id, display_name, system_role, is_active')
      .eq('id', assigned_cb_user_id)
      .is('deleted_at', null)
      .single();

    if (cbErr || !cbUser) {
      return { success: false, error: 'assigned_cb_user_id not found. Select a valid user.' };
    }
    if (!cbUser.is_active) {
      return { success: false, error: `${cbUser.display_name} is inactive and cannot be assigned as Capability Builder.` };
    }
  }

  // ── Build update payload ──────────────────────────────────────────────────
  const updates = {};
  const eventParts = [];

  if (assigned_ds_user_id !== undefined) {
    updates.assigned_ds_user_id = assigned_ds_user_id || null;
    eventParts.push(assigned_ds_user_id
      ? `Delivery Specialist assigned (user ${assigned_ds_user_id})`
      : 'Delivery Specialist cleared');
  }
  if (assigned_cb_user_id !== undefined) {
    updates.assigned_cb_user_id = assigned_cb_user_id || null;
    eventParts.push(assigned_cb_user_id
      ? `Capability Builder assigned (user ${assigned_cb_user_id})`
      : 'Capability Builder cleared');
  }

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

module.exports = { assign_ds_cb_to_cycle };
