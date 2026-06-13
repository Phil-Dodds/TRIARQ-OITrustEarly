// set_milestone_target_date.js
// Pathways OI Trust — delivery-cycle-mcp
// Sets target_date on a cycle_milestone_dates row. User-set — not system-controlled.
//
// Contract 23 / D-427 §4.1: appends one cycle_event_log entry per call with the
// caller as actor. event_type = 'milestone_target_date_changed'. Captures old and
// new target_date in event_metadata. Actor null tolerated when JWT resolution
// fails upstream — never throws.
//
// Source: build-c-spec Section 4.1, Session 2026-03-24-A,
//   D-427 (Contract 23 Item 4.1), D-345 §3.1 (actor-prefix event description style).

'use strict';

const { supabase } = require('../db');

const VALID_GATES = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];

const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} params.gate_name
 * @param {string} params.target_date  — ISO date string YYYY-MM-DD
 * @param {string} caller_user_id - from JWT (middleware); may be null on JWT failure
 */
async function set_milestone_target_date(params, caller_user_id) {
  const { delivery_cycle_id, gate_name, target_date } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!gate_name) {
    return { success: false, error: 'gate_name is required.' };
  }
  if (!target_date) {
    return { success: false, error: 'target_date is required (YYYY-MM-DD).' };
  }

  // Basic date format validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(target_date)) {
    return { success: false, error: 'target_date must be in YYYY-MM-DD format.' };
  }

  if (!VALID_GATES.includes(gate_name)) {
    return {
      success: false,
      error: `gate_name '${gate_name}' is not valid. Must be one of: ${VALID_GATES.join(', ')}.`
    };
  }

  // Verify cycle exists
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, current_lifecycle_stage')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // Fetch milestone — also captures prior target_date for D-427 event log entry.
  const { data: milestone, error: fetchErr } = await supabase
    .from('cycle_milestone_dates')
    .select('milestone_id, date_status, actual_date, target_date')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_name', gate_name)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !milestone) {
    return { success: false, error: `Milestone for gate '${gate_name}' not found on this cycle.` };
  }

  const prior_target_date = milestone.target_date ?? null;

  // B-16 fix: Session 2026-03-24-O — status must remain 'not_started' when target date is set.
  // Human must affirmatively set 'on_track'. System must never auto-advance status to on_track.
  // Previous logic auto-set on_track when not_started + date set — removed.
  // When actual_date is already set, target_date update doesn't change date_status.
  const new_date_status = milestone.date_status;

  const { data: updated, error: updateErr } = await supabase
    .from('cycle_milestone_dates')
    .update({
      target_date,
      date_status: new_date_status
    })
    .eq('milestone_id', milestone.milestone_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to set target date: ${updateErr.message}` };
  }

  // ── D-427 §4.1: append milestone_target_date_changed event ──────────────
  // Description follows D-345 §3.1 actor-prefix convention (matches Contract 16
  // milestone_actual_date_set entries). Metadata keys (old_target_date /
  // new_target_date) match the literal spec keys.
  let callerDisplayName = 'A user';
  if (caller_user_id) {
    const { data: caller } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', caller_user_id)
      .is('deleted_at', null)
      .maybeSingle();
    callerDisplayName = caller?.display_name ?? callerDisplayName;
  }
  const gateNameDisplay = GATE_NAME_DISPLAY[gate_name] ?? gate_name;
  const eventDescription = `${callerDisplayName} set ${gateNameDisplay} target date to ${target_date}.`;

  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'milestone_target_date_changed',
      event_description: eventDescription,
      actor_user_id:     caller_user_id || null,
      event_metadata:    {
        gate_name,
        old_target_date: prior_target_date,
        new_target_date: target_date,
        milestone_id:    milestone.milestone_id
      }
    });

  return { success: true, data: updated };
}

module.exports = { set_milestone_target_date };
