// helpers/gate-assessments.js — Contract GA-1 (D-579)
// Store / clear / fetch gate assessment rows. D-578 posture: never delete —
// a return, withdraw, or self-supersede stamps cleared_by_return_at.

'use strict';

const { supabase } = require('../../db');
const { validateAssessment } = require('../../lib/gate-assessment-registry');

/**
 * Persist a respondent's assessment for the ACTIVE attempt.
 * Any prior active rows by the same respondent on this gate are stamped
 * cleared first (self-supersede — CC-GA1 lean; keeps the active-attempt
 * partial unique index satisfied without ever deleting).
 * Non-fatal by design: callers log failures but never roll back the gate
 * action that already succeeded.
 */
async function saveAssessment({ delivery_cycle_id, gate_key, respondent_user_id, respondent_role, items }) {
  const now = new Date().toISOString();
  const { error: clearErr } = await supabase
    .from('gate_assessments')
    .update({ cleared_by_return_at: now, updated_at: now })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_key', gate_key)
    .eq('respondent_user_id', respondent_user_id)
    .is('cleared_by_return_at', null)
    .is('deleted_at', null);
  if (clearErr) { return { error: clearErr.message }; }

  const rows = items.map(it => ({
    delivery_cycle_id,
    gate_key,
    respondent_user_id,
    respondent_role,
    item_key: it.item_key,
    grade:    it.grade,
    comment:  it.comment ?? null
  }));
  const { error: insErr } = await supabase.from('gate_assessments').insert(rows);
  if (insErr) { return { error: insErr.message }; }
  return { ok: true };
}

/**
 * Validate-or-reject wrapper used by the collection points (twin enforcement,
 * GA-1 AC #1/#8). Returns { ok, items } or { ok:false, error }.
 */
function validateOrError(gate_key, respondent_role, items) {
  return validateAssessment(gate_key, respondent_role, items);
}

/**
 * Stamp every active assessment row on a gate as cleared (return/withdraw —
 * GA-1 §5). Rows stay readable per attempt via cleared_by_event_id.
 */
async function clearActiveAssessments(delivery_cycle_id, gate_key, event_id) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('gate_assessments')
    .update({ cleared_by_return_at: now, cleared_by_event_id: event_id ?? null, updated_at: now })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_key', gate_key)
    .is('cleared_by_return_at', null)
    .is('deleted_at', null);
  return error ? { error: error.message } : { ok: true };
}

/** All assessment rows for a gate (active + cleared attempts), oldest first. */
async function fetchAssessments(delivery_cycle_id, gate_key) {
  const { data, error } = await supabase
    .from('gate_assessments')
    .select('id, respondent_user_id, respondent_role, item_key, grade, comment, cleared_by_return_at, cleared_by_event_id, created_at')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('gate_key', gate_key)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) { return { error: error.message }; }
  return { ok: true, rows: data ?? [] };
}

/**
 * Blind-until-decision visibility (GA-1 §4):
 * - decided gate (approved/returned): everyone sees all rows.
 * - undecided + viewer is the approver-in-decision: all rows.
 * - otherwise: viewer's own rows only.
 */
function filterForViewer(rows, { viewer_user_id, gate_status, viewerIsApprover }) {
  const decided = gate_status === 'approved' || gate_status === 'returned';
  if (decided || viewerIsApprover) { return rows; }
  return rows.filter(r => r.respondent_user_id === viewer_user_id);
}

const ROSTER_ROLE_LABELS = {
  submitter: 'Submitter', trio_member: 'Trio member', consulted: 'Consulted', approver: 'Approver'
};

/**
 * GA-1 scope addition (Design 2026-07-25): compact text roster for the Close
 * Review decision notification. Active-attempt rows only; one line per
 * respondent: "Name (Role): item A · item B — “comment”".
 * @param {Array} rows       — gate_assessments rows
 * @param {Object} nameById  — user_id → display_name
 * @returns {string} multi-line roster ('' when nothing collected)
 */
function buildAssessmentRosterText(rows, nameById) {
  const active = (rows || []).filter(r => !r.cleared_by_return_at);
  const byUser = new Map();
  for (const r of active) {
    const key = r.respondent_user_id + '|' + r.respondent_role;
    if (!byUser.has(key)) {
      byUser.set(key, {
        name: nameById[r.respondent_user_id] || 'Participant',
        role: ROSTER_ROLE_LABELS[r.respondent_role] || r.respondent_role,
        parts: []
      });
    }
    const grade = r.grade === 'NA' ? 'N/A' : r.grade;
    byUser.get(key).parts.push(
      `${r.item_key} ${grade}${r.comment ? ` (“${r.comment}”)` : ''}`
    );
  }
  return [...byUser.values()]
    .map(g => `${g.name} (${g.role}): ${g.parts.join(' · ')}`)
    .join('\n');
}

module.exports = { saveAssessment, validateOrError, clearActiveAssessments, fetchAssessments, filterForViewer, buildAssessmentRosterText };
