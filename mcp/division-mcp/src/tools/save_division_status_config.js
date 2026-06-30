// save_division_status_config.js
// Pathways OI Trust — Contract 32 (Initiative Status Updates)
// Upserts the initiative-status cadence config for a Division. Admin-only.
// Governing decisions: D-480 (config model), D-353 (RLS — service role writes).
//
// Cadence shape (D-480), normalized before write to satisfy the DB CHECK set:
//   weekly:    day_of_week only            (anchor_date null, month_occurrence null)
//   triweekly: day_of_week + anchor_date   (month_occurrence null)
//   monthly:   day_of_week + month_occurrence (anchor_date null)

'use strict';

const { supabase } = require('../db');

const VALID_CADENCE     = ['weekly', 'triweekly', 'monthly'];
const VALID_OCCURRENCE  = ['first', 'second', 'third', 'fourth', 'last'];

/**
 * @param {object} params
 * @param {string} params.division_id
 * @param {string} params.cadence            - weekly | triweekly | monthly
 * @param {number} params.day_of_week        - 0 (Sunday) .. 6 (Saturday)
 * @param {string} [params.anchor_date]      - ISO date; required for triweekly
 * @param {string} [params.month_occurrence] - first|second|third|fourth|last; required for monthly
 * @param {string} caller_user_id
 */
async function save_division_status_config(params, caller_user_id) {
  const { division_id, cadence, day_of_week, anchor_date, month_occurrence } = params;

  // ── Validation (D-480) ──────────────────────────────────────────────────
  if (!division_id) {
    return { success: false, error: 'division_id is required.' };
  }
  if (!cadence || !VALID_CADENCE.includes(cadence)) {
    return { success: false, error: 'cadence must be one of: weekly, triweekly, monthly.' };
  }
  if (day_of_week === undefined || day_of_week === null) {
    return { success: false, error: 'Meeting Day is required.' };
  }
  if (!Number.isInteger(day_of_week) || day_of_week < 0 || day_of_week > 6) {
    return { success: false, error: 'day_of_week must be an integer from 0 (Sunday) to 6 (Saturday).' };
  }
  if (cadence === 'triweekly' && !anchor_date) {
    return { success: false, error: 'Starting From date is required for a triweekly cadence.' };
  }
  if (cadence === 'monthly' && !month_occurrence) {
    return { success: false, error: 'Occurrence is required for a monthly cadence.' };
  }
  if (month_occurrence !== undefined && month_occurrence !== null &&
      !VALID_OCCURRENCE.includes(month_occurrence)) {
    return { success: false, error: 'month_occurrence must be one of: first, second, third, fourth, last.' };
  }

  // ── Admin gate (matches update_division.js — Contract 19 / D-394) ─────────
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (caller.is_active !== true) {
    return { success: false, error: 'Your account is inactive.' };
  }
  if (caller.is_admin !== true) {
    return {
      success: false,
      error: 'Configuring an Initiative update cycle requires Admin role. Your current role does not have this permission.'
    };
  }

  // ── Verify Division exists ────────────────────────────────────────────────
  const { data: division, error: divErr } = await supabase
    .from('divisions')
    .select('id, division_name')
    .eq('id', division_id)
    .is('deleted_at', null)
    .single();

  if (divErr || !division) {
    return { success: false, error: 'Division not found.' };
  }

  // ── Normalize per cadence so the DB CHECK constraints hold ────────────────
  const payload = {
    division_id,
    cadence,
    day_of_week,
    anchor_date:      cadence === 'triweekly' ? anchor_date : null,
    month_occurrence: cadence === 'monthly'   ? month_occurrence : null,
    updated_by:       caller_user_id,
    updated_at:       new Date().toISOString()
  };

  // Upsert on the UNIQUE division_id (one config row per Division).
  const { data: saved, error: saveErr } = await supabase
    .from('division_status_config')
    .upsert(payload, { onConflict: 'division_id' })
    .select()
    .single();

  if (saveErr) {
    return { success: false, error: `Failed to save update cycle: ${saveErr.message}` };
  }

  return { success: true, data: saved };
}

module.exports = { save_division_status_config };
