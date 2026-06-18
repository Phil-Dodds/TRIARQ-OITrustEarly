// update_milestone_status.js
// Pathways OI Trust — delivery-cycle-mcp
// Updates date_status on a cycle_milestone_dates row.
//
// Contract 28 / D-451 — Revert trigger fix:
//   Previous trigger:
//     date_status === 'complete' AND new date_status !== 'complete'
//   New trigger:
//     milestone.actual_date IS NOT NULL  → caller must send
//       status_override_reason === 'confirmed-revert' (fixed system string).
//       MCP rejects any other value, including free text.
//       Missing → response { success:false, error:'REVERT_CONFIRMATION_REQUIRED' }
//   Milestones with actual_date IS NULL: save proceeds silently, no requirement.
//   On successful revert save, the tool appends a 'milestone_status_reverted'
//   event so the activity feed can narrate the change.
//
// Contract 28 / D-447 — 'skipped' is system-only:
//   This tool rejects date_status === 'skipped' as an input. confirm_gate_skip
//   is the only writer of the skipped state. It also rejects mutation of a
//   milestone whose current date_status is 'skipped' — backdate via
//   set_milestone_actual_date is the only off-ramp.
//
// Source: build-c-spec Section 4.1, Session 2026-03-24-A, D-447, D-451.

'use strict';

const { supabase } = require('../db');

const VALID_STATUSES = ['not_started', 'on_track', 'at_risk', 'behind', 'complete'];

const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

const REVERT_CONFIRMATION_TOKEN = 'confirmed-revert';

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} params.gate_name
 * @param {string} params.date_status                — one of VALID_STATUSES
 * @param {string} [params.status_override_reason]   — must equal 'confirmed-revert' for complete-revert path
 * @param {string} caller_user_id - from JWT
 */
async function update_milestone_status(params, caller_user_id) {
  const { delivery_cycle_id, gate_name, date_status, status_override_reason } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!gate_name) {
    return { success: false, error: 'gate_name is required.' };
  }
  if (!date_status) {
    return { success: false, error: 'date_status is required.' };
  }
  if (!VALID_STATUSES.includes(date_status)) {
    return {
      success: false,
      error: `date_status must be one of: ${VALID_STATUSES.join(', ')}.`
    };
  }

  // ── Verify cycle exists ────────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // ── Fetch current milestone (capture prior values for trigger + event) ────
  const { data: milestone, error: fetchErr } = await supabase
    .from('cycle_milestone_dates')
    .select('milestone_id, date_status, actual_date')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_name', gate_name)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !milestone) {
    return { success: false, error: `Milestone for gate '${gate_name}' not found on this cycle.` };
  }

  // ── D-447: 'skipped' is system-only ───────────────────────────────────────
  // Block mutation of a skipped milestone — only set_milestone_actual_date
  // can transition the gate via the backdate path.
  if (milestone.date_status === 'skipped') {
    return {
      success: false,
      error:
        'This gate is in Skipped state. Record an actual completion date to ' +
        'change it — status cannot be edited directly.'
    };
  }

  // ── D-451: revert trigger — actual_date IS NOT NULL on the milestone ─────
  const isRevertPath = milestone.actual_date !== null && milestone.actual_date !== undefined;

  if (isRevertPath) {
    if (status_override_reason !== REVERT_CONFIRMATION_TOKEN) {
      return {
        success: false,
        error: 'REVERT_CONFIRMATION_REQUIRED',
        data: {
          code:    'REVERT_CONFIRMATION_REQUIRED',
          message:
            'This milestone has an actual completion date. Reverting its ' +
            'status requires explicit confirmation. The Angular client opens ' +
            'an inline confirmation dialog before re-sending the request with ' +
            `status_override_reason = '${REVERT_CONFIRMATION_TOKEN}'.`
        }
      };
    }
  }

  // ── Apply update ──────────────────────────────────────────────────────────
  // Fixed-string semantics — only persist the system token, never user text.
  const updatePayload = {
    date_status,
    status_override_reason: isRevertPath ? REVERT_CONFIRMATION_TOKEN : null
  };

  const { data: updated, error: updateErr } = await supabase
    .from('cycle_milestone_dates')
    .update(updatePayload)
    .eq('milestone_id', milestone.milestone_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to update milestone status: ${updateErr.message}` };
  }

  // ── D-451: event log on successful complete-revert save ──────────────────
  if (isRevertPath) {
    const { data: caller } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', caller_user_id)
      .is('deleted_at', null)
      .single();
    const callerDisplayName = caller?.display_name ?? 'A user';
    const gateDisplay = GATE_NAME_DISPLAY[gate_name] ?? gate_name;

    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'milestone_status_reverted',
        event_description:
          `${callerDisplayName} reverted ${gateDisplay} from Complete to ${date_status}.`,
        actor_user_id:     caller_user_id,
        event_metadata:    {
          gate_name,
          previous_status:      milestone.date_status,
          new_status:           date_status,
          previous_actual_date: milestone.actual_date
        }
      });
  }

  return { success: true, data: updated };
}

module.exports = { update_milestone_status };
