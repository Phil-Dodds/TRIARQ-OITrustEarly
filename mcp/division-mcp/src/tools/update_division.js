// update_division.js
// Updates mutable fields on a Division. Admin-only.
// division_level and parent_division_id are not mutable after creation.
// display_name_short added Migration 030 + Contract 10 §6 B-48 / Contract 11 §B-48.
// active_status added Migration 036 + Contract 21 / D-414 / S-032 (soft-block deactivation).

'use strict';

const { supabase } = require('../db');

// D-424 / Contract 23 Item 3.2: dol_required is admin-mutable governance setting on a Division.
const MUTABLE_FIELDS = ['division_name', 'display_name_short', 'division_type_label', 'owner_user_id', 'active_status', 'dol_required'];

// Contract 10 §6 B-48: max 10 chars on display_name_short.
const DISPLAY_NAME_SHORT_MAX = 10;

/**
 * @param {object} params
 * @param {string} params.division_id
 * @param {object} params.updates - keys restricted to MUTABLE_FIELDS
 * @param {string} caller_user_id
 */
async function update_division(params, caller_user_id) {
  const { division_id, updates } = params;

  if (!division_id) {
    return { success: false, error: 'division_id is required.' };
  }
  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    return { success: false, error: 'updates object is required and must not be empty.' };
  }

  // Reject any attempt to modify immutable fields
  const immutableAttempts = Object.keys(updates).filter(k => !MUTABLE_FIELDS.includes(k));
  if (immutableAttempts.length > 0) {
    return {
      success: false,
      error: `The following fields cannot be updated: ${immutableAttempts.join(', ')}. Mutable fields: ${MUTABLE_FIELDS.join(', ')}.`
    };
  }

  // Validate active_status — must be boolean (Contract 21 / S-032).
  if (updates.active_status !== undefined && typeof updates.active_status !== 'boolean') {
    return { success: false, error: 'active_status must be a boolean.' };
  }

  // D-424 / Contract 23 Item 3.2: dol_required must be boolean when provided.
  if (updates.dol_required !== undefined && typeof updates.dol_required !== 'boolean') {
    return { success: false, error: 'dol_required must be a boolean.' };
  }

  // Validate division_name — non-empty string when provided.
  if (updates.division_name !== undefined) {
    if (typeof updates.division_name !== 'string' || updates.division_name.trim().length === 0) {
      return { success: false, error: 'Division Name is required and cannot be empty.' };
    }
    updates.division_name = updates.division_name.trim();
  }

  // Validate display_name_short — non-empty string ≤ 10 chars (Contract 10 §6 B-48).
  if (updates.display_name_short !== undefined && updates.display_name_short !== null) {
    if (typeof updates.display_name_short !== 'string') {
      return { success: false, error: 'display_name_short must be a string.' };
    }
    const trimmed = updates.display_name_short.trim();
    if (trimmed.length === 0) {
      return { success: false, error: 'Short Name is required and cannot be empty.' };
    }
    if (trimmed.length > DISPLAY_NAME_SHORT_MAX) {
      return {
        success: false,
        error: `Short Name must be ${DISPLAY_NAME_SHORT_MAX} characters or fewer.`
      };
    }
    updates.display_name_short = trimmed;
  }

  // Verify caller is Admin — Contract 19 (D-394, CC-19-01).
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (caller.is_admin !== true) {
    return {
      success: false,
      error: 'Updating Divisions requires Admin role. Your current role does not have this permission.'
    };
  }

  // Verify Division exists
  const { data: existing, error: existErr } = await supabase
    .from('divisions')
    .select('id')
    .eq('id', division_id)
    .is('deleted_at', null)
    .single();

  if (existErr || !existing) {
    return { success: false, error: 'Division not found.' };
  }

  // Build safe update payload
  const payload = {};
  for (const field of MUTABLE_FIELDS) {
    if (updates[field] !== undefined) {
      payload[field] = updates[field];
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from('divisions')
    .update(payload)
    .eq('id', division_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to update Division: ${updateErr.message}` };
  }

  return { success: true, data: updated };
}

module.exports = { update_division };
