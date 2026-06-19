// consultations.js
// Pathways OI Trust — delivery-cycle-mcp shared helper (Contract 29 WS2).
//
// Gate consultation setup (D-459, D-460). The Consulted set is derived at
// submission time from the non-null DCS/EPO/DOL trio plus the Initiative's
// other_consulted_user_ids (D-458), deduplicated. The submitter is auto-approved
// (D-460) and never receives an inbox/email notification for their own submission.
//
// CC-decision (CC-29-8): consultation setup is idempotent on re-submission.
//   A returned gate can be re-submitted; setup upserts with ignoreDuplicates so
//   existing consultation responses are preserved (the response window is open
//   indefinitely per D-460 — a re-submit must not wipe a response already given).
//   Newly-added Consulted users get fresh pending rows. The CURRENT submitter's
//   row is always (re)set to approved/auto, covering the case where a different
//   trio member re-submits a previously-returned gate.

'use strict';

const { supabase } = require('../../db');

/**
 * Derive the deduplicated Consulted user-id set for a gate submission.
 * @param {object} cycle - must include assigned_dcs_user_id, assigned_epo_user_id,
 *   assigned_dol_user_id, other_consulted_user_ids (uuid[]).
 * @returns {string[]} ordered, deduplicated, non-null user ids
 */
function deriveConsultedUserIds(cycle) {
  const trio = [
    cycle.assigned_dcs_user_id,
    cycle.assigned_epo_user_id,
    cycle.assigned_dol_user_id
  ];
  const others = Array.isArray(cycle.other_consulted_user_ids)
    ? cycle.other_consulted_user_ids
    : [];

  const seen = new Set();
  const result = [];
  for (const id of [...trio, ...others]) {
    if (id && !seen.has(id)) { seen.add(id); result.push(id); }
  }
  return result;
}

/**
 * Create/refresh gate_consultations rows for a gate submission (D-459/D-460).
 * Never throws — failures are logged and surfaced via the returned error;
 * the gate is already submitted by the time this runs.
 *
 * @param {object} args
 * @param {string}   args.gate_record_id
 * @param {string}   args.submitted_by_user_id
 * @param {string[]} args.consultedUserIds - from deriveConsultedUserIds()
 * @returns {Promise<{ consultedUserIds: string[],
 *                     nonSubmitterConsultedUserIds: string[],
 *                     error: string|null }>}
 */
async function setupGateConsultations({ gate_record_id, submitted_by_user_id, consultedUserIds }) {
  const nonSubmitterConsultedUserIds =
    consultedUserIds.filter(id => id !== submitted_by_user_id);

  if (consultedUserIds.length === 0) {
    return { consultedUserIds, nonSubmitterConsultedUserIds, error: null };
  }

  const nowIso = new Date().toISOString();
  const rows = consultedUserIds.map(uid => {
    const isSubmitter = uid === submitted_by_user_id;
    return {
      gate_record_id,
      consulted_user_id: uid,
      response:          isSubmitter ? 'approved' : 'pending',
      responded_at:      isSubmitter ? nowIso : null,
      is_auto_approved:  isSubmitter
    };
  });

  let error = null;

  // Idempotent insert — preserve any existing response (CC-29-8).
  const { error: upsertErr } = await supabase
    .from('gate_consultations')
    .upsert(rows, { onConflict: 'gate_record_id,consulted_user_id', ignoreDuplicates: true });
  if (upsertErr) {
    error = upsertErr.message;
    console.error(JSON.stringify({
      helper: 'setupGateConsultations', step: 'upsert', gate_record_id, error
    }));
  }

  // Always (re)assert the current submitter's auto-approval, even if their row
  // pre-existed as pending from an earlier submission round.
  if (consultedUserIds.includes(submitted_by_user_id)) {
    const { error: subErr } = await supabase
      .from('gate_consultations')
      .update({ response: 'approved', responded_at: nowIso, is_auto_approved: true })
      .eq('gate_record_id', gate_record_id)
      .eq('consulted_user_id', submitted_by_user_id);
    if (subErr && !error) { error = subErr.message; }
  }

  return { consultedUserIds, nonSubmitterConsultedUserIds, error };
}

/**
 * Upsert a single consultation row for a displaced approver converted to
 * Consulted by Phil's override (D-465). If a row already exists it is left
 * as-is (the approver may already have responded). Never throws.
 *
 * @param {object} args
 * @param {string} args.gate_record_id
 * @param {string} args.consulted_user_id - the displaced approver
 * @returns {Promise<{ inserted: boolean, error: string|null }>}
 */
async function upsertDisplacedApproverConsultation({ gate_record_id, consulted_user_id }) {
  // Does a row already exist?
  const { data: existing, error: selErr } = await supabase
    .from('gate_consultations')
    .select('id')
    .eq('gate_record_id', gate_record_id)
    .eq('consulted_user_id', consulted_user_id)
    .maybeSingle();

  if (selErr) {
    return { inserted: false, error: selErr.message };
  }
  if (existing) {
    return { inserted: false, error: null }; // leave existing response untouched
  }

  const { error: insErr } = await supabase
    .from('gate_consultations')
    .insert({
      gate_record_id,
      consulted_user_id,
      response:         'pending',
      is_auto_approved: false
    });

  return { inserted: !insErr, error: insErr ? insErr.message : null };
}

module.exports = {
  deriveConsultedUserIds,
  setupGateConsultations,
  upsertDisplacedApproverConsultation
};
