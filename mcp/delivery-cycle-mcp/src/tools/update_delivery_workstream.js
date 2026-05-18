// update_delivery_workstream.js
// Pathways OI Trust — delivery-cycle-mcp
//
// Admin-only. Updates a Delivery Workstream's editable fields and/or its
// active_status. Replaces update_workstream_active_status for the Contract 17
// Workstream Admin redesign (§9): the Edit panel can change workstream_name,
// display_name_short, home_division_id, workstream_lead_user_id; the View
// panel can flip active_status. One tool covers both flows so the panel does
// not need to choose between two write paths.
//
// Source: ARCH-23, Contract 17 §9, D-203.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object}  params
 * @param {string}  params.workstream_id
 * @param {string}  [params.workstream_name]
 * @param {string}  [params.display_name_short]    - D-203, max 20 chars
 * @param {string}  [params.home_division_id]
 * @param {string}  [params.workstream_lead_user_id]
 * @param {boolean} [params.active_status]
 * @param {string}  caller_user_id - from JWT
 */
async function update_delivery_workstream(params, caller_user_id) {
  const {
    workstream_id,
    workstream_name,
    display_name_short,
    home_division_id,
    workstream_lead_user_id,
    active_status
  } = params || {};

  if (!workstream_id) {
    return { success: false, error: 'workstream_id is required.' };
  }

  const updates = {};

  if (workstream_name !== undefined) {
    if (typeof workstream_name !== 'string' || !workstream_name.trim()) {
      return { success: false, error: 'workstream_name must be a non-empty string.' };
    }
    updates.workstream_name = workstream_name.trim();
  }
  if (display_name_short !== undefined) {
    if (display_name_short !== null && typeof display_name_short !== 'string') {
      return { success: false, error: 'display_name_short must be a string.' };
    }
    if (typeof display_name_short === 'string' && display_name_short.length > 20) {
      return { success: false, error: 'display_name_short must be 20 characters or fewer.' };
    }
    updates.display_name_short = (typeof display_name_short === 'string')
      ? display_name_short.trim() || null
      : null;
  }
  if (home_division_id !== undefined) {
    if (!home_division_id) {
      return { success: false, error: 'home_division_id must not be empty.' };
    }
    updates.home_division_id = home_division_id;
  }
  if (workstream_lead_user_id !== undefined) {
    if (!workstream_lead_user_id) {
      return { success: false, error: 'workstream_lead_user_id must not be empty.' };
    }
    updates.workstream_lead_user_id = workstream_lead_user_id;
  }
  if (active_status !== undefined) {
    if (typeof active_status !== 'boolean') {
      return { success: false, error: 'active_status must be a boolean.' };
    }
    updates.active_status = active_status;
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'No editable fields supplied.' };
  }

  // ── Verify caller is admin or phil ───────────────────────────────────────
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('id, system_role, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (!caller.is_active) {
    return { success: false, error: 'Your account is inactive.' };
  }
  if (caller.system_role !== 'admin' && caller.system_role !== 'phil') {
    return {
      success: false,
      error: 'Updating Delivery Workstreams requires Admin role. Your current role does not have this permission. Contact your System Admin to request access.'
    };
  }

  // ── Verify workstream exists ─────────────────────────────────────────────
  const { data: existing, error: existingErr } = await supabase
    .from('delivery_workstreams')
    .select('workstream_id')
    .eq('workstream_id', workstream_id)
    .is('deleted_at', null)
    .single();

  if (existingErr || !existing) {
    return { success: false, error: 'Delivery Workstream not found or has been deleted.' };
  }

  // ── Verify referenced Division if changing ───────────────────────────────
  if (updates.home_division_id) {
    const { data: division, error: divErr } = await supabase
      .from('divisions')
      .select('id')
      .eq('id', updates.home_division_id)
      .is('deleted_at', null)
      .single();
    if (divErr || !division) {
      return { success: false, error: 'home_division_id not found or has been deleted.' };
    }
  }

  // ── Verify referenced lead user if changing ──────────────────────────────
  if (updates.workstream_lead_user_id) {
    const { data: leadUser, error: leadErr } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('id', updates.workstream_lead_user_id)
      .is('deleted_at', null)
      .single();
    if (leadErr || !leadUser) {
      return { success: false, error: 'workstream_lead_user_id not found or has been deleted.' };
    }
    if (!leadUser.is_active) {
      return { success: false, error: 'The designated Workstream lead account is inactive. Assign an active user as lead.' };
    }
  }

  // ── Apply update ─────────────────────────────────────────────────────────
  const { data: workstream, error: updateErr } = await supabase
    .from('delivery_workstreams')
    .update(updates)
    .eq('workstream_id', workstream_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to update Workstream: ${updateErr.message}` };
  }

  return { success: true, data: workstream };
}

module.exports = { update_delivery_workstream };
