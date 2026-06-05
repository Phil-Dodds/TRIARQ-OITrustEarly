// set_milestone_actual_date.js
// Pathways OI Trust — delivery-cycle-mcp
// Records the actual date a gate milestone was cleared. Direct-call corrections by
// DS/CB on the cycle (or Phil/Admin). record_gate_decision sets the same fields on
// approval via a direct write (not via this tool — see Contract 16 CC-decisions).
//
// Contract 16 (build-c-contract16-spec.md §2) — MODIFICATION of the prior
// Session 2026-03-24-A implementation which derived achieved/overdue/complete
// from target vs actual. Those values were never in the cycle_milestone_dates
// date_status CHECK constraint (latent bug). This version sets date_status to
// 'complete' on direct call per D-205, adds DS/CB/Phil/Admin authorization,
// override_reason handling on revert, and an event log entry.
//
// Authorization pattern matches submit_gate_for_approval (Phil + assigned DS +
// assigned CB) extended with Admin per spec §2.
//
// Source: build-c-spec.md §4.1, build-c-contract16-spec.md §2,
//   D-205 (user-controlled milestone status), Arch-5 (JWT — middleware).

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
 * @param {string} params.actual_date         — ISO date string YYYY-MM-DD
 * @param {string} [params.override_reason]   — required when reverting an existing actual_date after prior date_status='complete'
 * @param {string} caller_user_id             — from JWT (middleware)
 */
async function set_milestone_actual_date(params, caller_user_id) {
  const { delivery_cycle_id, gate_name, actual_date, override_reason } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!gate_name) {
    return { success: false, error: 'gate_name is required.' };
  }
  if (!actual_date) {
    return { success: false, error: 'actual_date is required (YYYY-MM-DD).' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(actual_date)) {
    return { success: false, error: 'actual_date must be in YYYY-MM-DD format.' };
  }
  if (!VALID_GATES.includes(gate_name)) {
    return {
      success: false,
      error: `gate_name must be one of: ${VALID_GATES.join(', ')}.`
    };
  }

  // ── Fetch cycle (for assignment + authorization) ───────────────────────────
  // Contract 19 (CC-19-05): column names updated to post-migration-032 form
  // (assigned_dcs_user_id, assigned_epo_user_id). Was referencing the renamed
  // assigned_ds_user_id / assigned_cb_user_id columns — pre-existing bug.
  // assigned_dol_user_id added so DOL can also correct milestone dates.
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  // ── Authorization: Admin or assigned DCS/EPO/DOL on this Initiative ──────
  // Contract 19 (D-394, CC-19-01): boolean predicate; phil collapsed into is_admin.
  // CC-19-05: column names updated to post-migration-032 form; DOL added.
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin, display_name')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  const callerDisplayName = caller?.display_name ?? 'A user';
  const isAdmin       = caller?.is_admin === true;
  const isAssignedDcs = cycle.assigned_dcs_user_id === caller_user_id;
  const isAssignedEpo = cycle.assigned_epo_user_id === caller_user_id;
  const isAssignedDol = cycle.assigned_dol_user_id === caller_user_id;

  if (!isAdmin && !isAssignedDcs && !isAssignedEpo && !isAssignedDol) {
    return {
      success: false,
      error: 'You do not have authority to set the actual date for this milestone. ' +
             'Only the assigned Domain Capability Strategist, Engineering Product Owner, ' +
             'Domain Outcome Lead, or an Admin can record actual dates.'
    };
  }

  // ── Fetch milestone (capture prior values for revert check + event log) ────
  const { data: milestone, error: fetchErr } = await supabase
    .from('cycle_milestone_dates')
    .select('milestone_id, actual_date, date_status')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_name', gate_name)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !milestone) {
    return { success: false, error: `Milestone for gate '${gate_name}' not found on this cycle.` };
  }

  const prior_actual_date = milestone.actual_date;
  const isRevert = prior_actual_date && milestone.date_status === 'complete';

  // TODO: re-enable when UI surfaces override_reason input — Contract 16 known gap.
  // The detail panel has no override_reason field; without it, completed actual
  // dates are uncorrectable through the UI. The block stays in code as a future
  // guard. isRevert is still computed for the event log entry below.
  //
  // if (isRevert && !override_reason) {
  //   return {
  //     success: false,
  //     error: 'A reason is required to change this milestone\'s actual date after it was marked complete. ' +
  //            'Provide override_reason describing why the date is being changed.'
  //   };
  // }

  // ── Write actual_date + date_status='complete' (+ optional override) ──────
  const update = {
    actual_date,
    date_status: 'complete'
  };
  if (override_reason) {
    update.status_override_reason = override_reason;
  }

  const { data: updated, error: updateErr } = await supabase
    .from('cycle_milestone_dates')
    .update(update)
    .eq('milestone_id', milestone.milestone_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to set actual date: ${updateErr.message}` };
  }

  // ── Append event log ──────────────────────────────────────────────────────
  const gateNameDisplay = GATE_NAME_DISPLAY[gate_name] ?? gate_name;
  const eventDescription = isRevert
    ? `${callerDisplayName} changed ${gateNameDisplay} actual date from ${prior_actual_date} to ${actual_date}.`
    : `${callerDisplayName} set ${gateNameDisplay} actual date to ${actual_date}.`;

  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'milestone_actual_date_set',
      event_description: eventDescription,
      actor_user_id:     caller_user_id,
      event_metadata:    {
        gate_name,
        prior_actual_date: prior_actual_date ?? null,
        new_actual_date:   actual_date,
        override_reason:   override_reason ?? null
      }
    });

  return { success: true, data: updated };
}

module.exports = { set_milestone_actual_date };
