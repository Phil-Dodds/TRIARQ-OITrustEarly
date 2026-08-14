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
// Phil override on the deploy-skip block — mirrors submit_gate_for_approval.
const { isPhil } = require('./helpers/phil');

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

  // ── D-450: go_to_deploy is never skippable — EXCEPT under Phil override ───
  // Fix 2026-08-04 (CC-0804-10). submit_gate_for_approval has relaxed this
  // block for Phil since 2026-07-24, and says so in terms: "Phil override: the
  // deploy-skip block relaxes to the normal skip confirmation — Phil may skip
  // any gate, Deploy included." This delegate never honoured it, so the two
  // halves of a two-call flow disagreed: submit offered the skip interstitial,
  // the user accepted, and the call that performs the skip refused. A dead end
  // with no way through and nothing explaining why.
  //
  // phil_override was already being forwarded here correctly (Rule 45 / D-596)
  // — it was simply ignored by this one check. The caller is re-verified as
  // Phil rather than trusted from the parameter, exactly as submit does.
  const philSkipOverride =
    params.phil_override === true && (await isPhil(caller_user_id));

  if (gates_to_skip.includes('go_to_deploy') && !philSkipOverride) {
    return {
      success: false,
      error: 'DEPLOY_GATE_SKIP_BLOCKED',
      data: {
        code: 'DEPLOY_GATE_SKIP_BLOCKED',
        message:
          'The Deploy gate cannot be skipped. Complete or backdate it first — ' +
          'backdating records the real date for work done outside OI Trust.'
      }
    };
  }

  // ── Fetch cycle for the authority check ──────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  // ── Fetch caller: display name for event_description, is_admin for authority
  // (query order unchanged — cycle then caller — so FIFO fixtures are unmoved,
  // Rule 40. Only the authority check moved below it, and the select widened.)
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin, display_name')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  const callerDisplayName = caller?.display_name ?? 'A user';

  // ── Authority: Admin, or the Initiative's assigned DCS / EPO / DOL ────────
  //
  // CC-0813-01. This was trio-only, attributed in a comment to "D-447 — TRIO
  // only". D-447 says no such thing: it defines the `skipped` gate state, its
  // diamond, and the backdate reversal. The Contract 28 spec that specced it
  // mentions neither Admins nor acting on behalf. Both the restriction and the
  // asserted sentence denying Admins this action were invented here in bee65b6,
  // from a descriptive line about when the interstitial fires, then carried a
  // D-number and read as locked.
  //
  // The governing rule is D-369: any Admin may act on behalf of an Initiative,
  // which submit_gate_for_approval already implements (see its line 129). So a
  // trio-only delegate did not enforce D-447 — it contradicted D-369, and made
  // the skip path unreachable for the very callers submit had just let through.
  // record_gate_decision had the identical over-restriction and already dropped
  // it. Level makes this worse, not better: a designated L2/L3 approver can
  // approve the gate outright yet could not confirm a skip on it.
  const isAdmin       = caller?.is_admin === true;
  const isAssignedDcs = cycle.assigned_dcs_user_id === caller_user_id;
  const isAssignedEpo = cycle.assigned_epo_user_id === caller_user_id;
  const isAssignedDol = cycle.assigned_dol_user_id === caller_user_id;

  if (!isAdmin && !isAssignedDcs && !isAssignedEpo && !isAssignedDol) {
    return {
      success: false,
      error:
        'Only an Admin or the assigned Domain Capability Strategist, Engineering ' +
        'Product Owner, or Domain Outcome Lead can confirm a gate skip on this ' +
        'Initiative. Ask one of them to confirm the skip.'
    };
  }

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
  // Phil override (2026-07-24): carry the flag through so an override
  // submission that routed via the skip interstitial stays an override.
  // submit_gate_for_approval itself re-verifies the caller is Phil.
  // Contract 40 WS1 (D-596): EVERY submit-time param accepted by
  // submit_gate_for_approval must ride the skip delegate. Enumerated set:
  // submission_note (D-489), phil_override, assessment (GA-1/D-579),
  // cast_confirmed (D-584), outcome_verdict/outcome_actual/outcome_evidence
  // (D-585). submission_note was the dropped param this WS restores.
  const submissionResult = await submit_gate_for_approval(
    { delivery_cycle_id, gate_name: submitted_gate,
      // D-489 (Contract 40 WS1): submission note — previously dropped on the
      // skip path, so a skip-routed submission lost its opening thread message.
      ...(typeof params.submission_note === 'string' ? { submission_note: params.submission_note } : {}),
      ...(params.phil_override === true ? { phil_override: true } : {}),
      // GA-1: the submitter assessment rides through the skip interstitial.
      ...(Array.isArray(params.assessment) ? { assessment: params.assessment } : {}),
      // Contract 39: cast confirmation (D-584) and the Close Review outcome
      // verdict block (D-585) ride through the skip interstitial the same way.
      ...(params.cast_confirmed === true ? { cast_confirmed: true } : {}),
      ...(typeof params.outcome_verdict  === 'string' ? { outcome_verdict:  params.outcome_verdict }  : {}),
      ...(typeof params.outcome_actual   === 'string' ? { outcome_actual:   params.outcome_actual }   : {}),
      ...(typeof params.outcome_evidence === 'string' ? { outcome_evidence: params.outcome_evidence } : {}) },
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
