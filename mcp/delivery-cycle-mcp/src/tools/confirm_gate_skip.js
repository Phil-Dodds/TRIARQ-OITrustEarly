// confirm_gate_skip.js
// Pathways OI Trust — delivery-cycle-mcp
// Contract 28 / D-447 / D-448 / D-449 / D-450
//
// Marks one or more predecessor gates as 'skipped' and then submits a follow-on
// gate for approval. Invoked by Angular after the user confirms the skip
// interstitial returned by submit_gate_for_approval.
//
// Constraints:
//   - 'go_to_deploy' is never permitted in gates_to_skip (D-450 — backend
//     enforcement; not UI-only).
//   - Caller must be assigned DCS, EPO, or DOL on the Initiative. Admins
//     cannot confirm a skip on behalf of others (D-447 — system-level state
//     change tied to TRIO accountability).
//   - 'skipped' is a system-only status — no other tool writes it.
//
// Side effects per gate in gates_to_skip:
//   gate_records.gate_status               → 'skipped'
//   cycle_milestone_dates.date_status      → 'skipped'
//   cycle_event_log                        → 'gate_skipped' row
//
// After all skip rows are written, the tool delegates to
// submit_gate_for_approval for the original submitted_gate. The combined
// response includes the skip confirmations and the submission result.
//
// Atomicity: Supabase JS has no multi-table transaction primitive in this
// codebase. Operations run sequentially. On a mid-sequence failure the
// already-applied rows are preserved (no rollback). The Initiative will
// re-surface the skip interstitial on next submit if any predecessor
// remains unresolved.

'use strict';

const { supabase } = require('../db');
const { submit_gate_for_approval } = require('./submit_gate_for_approval');

const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

const VALID_GATES = new Set(Object.keys(GATE_NAME_DISPLAY));

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string[]} params.gates_to_skip
 * @param {string} params.submitted_gate
 * @param {string} caller_user_id - from JWT
 */
async function confirm_gate_skip(params, caller_user_id) {
  const { delivery_cycle_id, gates_to_skip, submitted_gate } = params;

  // ── Parameter validation ─────────────────────────────────────────────────
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!Array.isArray(gates_to_skip) || gates_to_skip.length === 0) {
    return { success: false, error: 'gates_to_skip must be a non-empty array.' };
  }
  if (!submitted_gate) {
    return { success: false, error: 'submitted_gate is required.' };
  }

  for (const g of gates_to_skip) {
    if (!VALID_GATES.has(g)) {
      return {
        success: false,
        error: `Invalid gate '${g}' in gates_to_skip. Valid gates: ${[...VALID_GATES].join(', ')}.`
      };
    }
  }
  if (!VALID_GATES.has(submitted_gate)) {
    return {
      success: false,
      error: `Invalid submitted_gate '${submitted_gate}'. Valid gates: ${[...VALID_GATES].join(', ')}.`
    };
  }

  // ── D-450: go_to_deploy is never skippable (backend enforcement) ─────────
  if (gates_to_skip.includes('go_to_deploy')) {
    return {
      success: false,
      error: 'DEPLOY_GATE_SKIP_BLOCKED',
      data: {
        code: 'DEPLOY_GATE_SKIP_BLOCKED',
        message:
          'The Deploy gate cannot be skipped. confirm_gate_skip rejects any ' +
          'gates_to_skip array that includes go_to_deploy.'
      }
    };
  }

  // ── Fetch cycle for authority check (D-447 — TRIO only) ──────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  const isAssignedDcs = cycle.assigned_dcs_user_id === caller_user_id;
  const isAssignedEpo = cycle.assigned_epo_user_id === caller_user_id;
  const isAssignedDol = cycle.assigned_dol_user_id === caller_user_id;

  if (!isAssignedDcs && !isAssignedEpo && !isAssignedDol) {
    return {
      success: false,
      error:
        'Only the assigned Domain Capability Strategist, Engineering Product Owner, ' +
        'or Domain Outcome Lead can confirm a gate skip on this Initiative. ' +
        'Admins cannot confirm skips on behalf of the TRIO.'
    };
  }

  // ── Fetch caller display name for event_description ──────────────────────
  const { data: caller } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  const callerDisplayName = caller?.display_name ?? 'A user';

  // ── Apply skip transitions, in gates_to_skip order ───────────────────────
  const skipped_gates = [];
  const skipped_at = new Date().toISOString();

  for (const gate_name of gates_to_skip) {
    const gateDisplay = GATE_NAME_DISPLAY[gate_name];

    // gate_records — update existing row (rows are seeded on cycle creation)
    const { data: gateRow, error: gateErr } = await supabase
      .from('gate_records')
      .update({ gate_status: 'skipped' })
      .eq('delivery_cycle_id', delivery_cycle_id)
      .eq('gate_name', gate_name)
      .is('deleted_at', null)
      .select()
      .single();

    if (gateErr || !gateRow) {
      return {
        success: false,
        error: `Failed to set gate_records.gate_status='skipped' for ${gateDisplay}: ${gateErr?.message ?? 'no row updated'}.`
      };
    }

    // cycle_milestone_dates — paired update
    const { error: dateErr } = await supabase
      .from('cycle_milestone_dates')
      .update({ date_status: 'skipped' })
      .eq('delivery_cycle_id', delivery_cycle_id)
      .eq('gate_name', gate_name)
      .is('deleted_at', null);

    if (dateErr) {
      return {
        success: false,
        error: `Failed to set cycle_milestone_dates.date_status='skipped' for ${gateDisplay}: ${dateErr.message}.`
      };
    }

    // Event log
    await supabase
      .from('cycle_event_log')
      .insert({
        delivery_cycle_id,
        event_type:        'gate_skipped',
        event_description: `${callerDisplayName} skipped ${gateDisplay} — initiative entered system past this gate.`,
        actor_user_id:     caller_user_id,
        event_metadata:    { gate_name, skipped_at }
      });

    skipped_gates.push({ gate_name, gate_status: 'skipped', skipped_at });
  }

  // ── Delegate to submit_gate_for_approval for submitted_gate ──────────────
  // After the skip writes above, the predecessor pre-check inside
  // submit_gate_for_approval will see all earlier gates as 'skipped' or
  // 'approved' and fall through to normal submission.
  const submissionResult = await submit_gate_for_approval(
    { delivery_cycle_id, gate_name: submitted_gate },
    caller_user_id
  );

  return {
    success: submissionResult.success,
    data: {
      skipped_gates,
      submission: submissionResult
    },
    ...(submissionResult.success ? {} : { error: submissionResult.error })
  };
}

module.exports = { confirm_gate_skip };
