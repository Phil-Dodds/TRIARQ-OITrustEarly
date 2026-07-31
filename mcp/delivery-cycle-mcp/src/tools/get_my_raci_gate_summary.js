// get_my_raci_gate_summary.js — Pathways OI Trust — delivery-cycle-mcp
// Contract 41 (Phil 2026-07-31): the Home card for people who hold Responsible,
// Consulted, or Informed on an Initiative.
//
// Why this is not get_my_raci: that tool answers "which letters do I hold on
// THESE cycle ids", and every caller feeds it a list it already has (the
// Initiative grid, My Initiative Status). A Home card has no list to start
// from — it has to DISCOVER the caller's initiatives. Same letter semantics,
// opposite direction, so it is a separate read rather than a parameter on the
// existing one.
//
// Letters recognised here (A is deliberately absent — being the approver is a
// push obligation and already lives in My Actions; this card is the pull view):
//
//   R — caller is a trio member (DCS / EPO / DOL) on the Initiative.
//   C — caller holds an active Consulted stake, direct or via an active
//       Specialty Group membership.
//   I — caller holds an active Informed stake.
//
// Returns two lists over the same Initiative set:
//   pending_gates    — gates awaiting approval right now.
//   completed_gates  — gates approved inside the recent window.
//
// Rule 39: read-only gate query, cannot reach a gate decision or submission
// path, so assessment collection posture is implicitly skip.
//
// Soft-delete note: participation_records has NO deleted_at. Removal is
// removed_at / removed_by_user_id (migration 082) — that IS its Arch-6 pattern.

'use strict';

const { supabase } = require('../db');
const { GATE_NAME_DISPLAY, GATE_SEQUENCE } = require('./helpers/gates');

/**
 * How far back "recently completed" reaches. Matches the Home card's stated
 * window; a constant rather than a parameter because the card is the only
 * caller and a user-tunable window is not a thing anyone asked for.
 */
const RACI_RECENT_COMPLETED_DAYS = 14;

/** Terminal stage excluded outright per S-009. COMPLETE is NOT excluded — a
 *  just-approved Close Review is exactly what "recently completed" means. */
const EXCLUDED_STAGES = ['CANCELLED'];

/**
 * @param {object} _params  none
 * @param {string} caller_user_id  from JWT
 */
async function get_my_raci_gate_summary(_params, caller_user_id) {
  if (!caller_user_id) {
    return { success: false, error: 'Caller identity missing from the request.' };
  }

  // ── 1. Caller's active Specialty Group memberships ────────────────────────
  const { data: myGroups, error: groupsErr } = await supabase
    .from('specialty_group_members')
    .select('group_id')
    .eq('user_id', caller_user_id)
    .is('deleted_at', null);
  if (groupsErr) {
    return { success: false, error: `Failed to load your group memberships: ${groupsErr.message}` };
  }
  const myGroupIds = (myGroups || []).map(m => m.group_id).filter(Boolean);

  // ── 2. C and I stakes — direct or via group ───────────────────────────────
  const orFilter = myGroupIds.length
    ? `holder_user_id.eq.${caller_user_id},holder_group_id.in.(${myGroupIds.join(',')})`
    : `holder_user_id.eq.${caller_user_id}`;
  const { data: myStakes, error: stakesErr } = await supabase
    .from('participation_records')
    .select('delivery_cycle_id, letter')
    .or(orFilter)
    .is('removed_at', null);
  if (stakesErr) {
    return { success: false, error: `Failed to load your participation stakes: ${stakesErr.message}` };
  }

  const lettersByCycle = {};
  const noteLetter = (cycleId, key) => {
    const bucket = lettersByCycle[cycleId] || { r: false, c: false, i: false };
    bucket[key] = true;
    lettersByCycle[cycleId] = bucket;
  };
  for (const s of (myStakes || [])) {
    if (s.letter === 'C') { noteLetter(s.delivery_cycle_id, 'c'); }
    if (s.letter === 'I') { noteLetter(s.delivery_cycle_id, 'i'); }
  }

  // ── 3. R — trio membership on any Initiative ──────────────────────────────
  const { data: trioCycles, error: trioErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id')
    .or(`assigned_dcs_user_id.eq.${caller_user_id},assigned_epo_user_id.eq.${caller_user_id},assigned_dol_user_id.eq.${caller_user_id}`)
    .is('deleted_at', null);
  if (trioErr) {
    return { success: false, error: `Failed to load your Initiatives: ${trioErr.message}` };
  }
  for (const c of (trioCycles || [])) { noteLetter(c.delivery_cycle_id, 'r'); }

  const cycleIds = Object.keys(lettersByCycle);
  if (cycleIds.length === 0) {
    return {
      success: true,
      data: {
        pending_gates: [], completed_gates: [],
        recent_window_days: RACI_RECENT_COMPLETED_DAYS
      }
    };
  }

  // ── 4. The Initiatives themselves ─────────────────────────────────────────
  // Standing Note 1: the primary key is delivery_cycle_id, not id.
  const { data: cycles, error: cyclesErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, division_id, current_lifecycle_stage')
    .in('delivery_cycle_id', cycleIds)
    .is('deleted_at', null);
  if (cyclesErr) {
    return { success: false, error: `Failed to load Initiative details: ${cyclesErr.message}` };
  }

  const cyclesById = {};
  for (const c of (cycles || [])) {
    if (EXCLUDED_STAGES.includes(c.current_lifecycle_stage)) { continue; }
    cyclesById[c.delivery_cycle_id] = c;
  }
  const visibleCycleIds = Object.keys(cyclesById);
  if (visibleCycleIds.length === 0) {
    return {
      success: true,
      data: {
        pending_gates: [], completed_gates: [],
        recent_window_days: RACI_RECENT_COMPLETED_DAYS
      }
    };
  }

  // ── 5. Gates: awaiting now, or approved inside the window ─────────────────
  const cutoffIso = new Date(Date.now() - RACI_RECENT_COMPLETED_DAYS * 86400000).toISOString();
  const { data: gates, error: gatesErr } = await supabase
    .from('gate_records')
    .select('gate_record_id, delivery_cycle_id, gate_name, gate_status, approver_user_id, approver_decision_at, submitted_at, submitted_by_user_id')
    .in('delivery_cycle_id', visibleCycleIds)
    .is('deleted_at', null);
  if (gatesErr) {
    return { success: false, error: `Failed to load gate records: ${gatesErr.message}` };
  }

  const awaiting = [];
  const completed = [];
  for (const g of (gates || [])) {
    if (g.gate_status === 'awaiting_approval') {
      awaiting.push(g);
    } else if (g.gate_status === 'approved' && g.approver_decision_at && g.approver_decision_at >= cutoffIso) {
      completed.push(g);
    }
  }

  // ── 6. Names: divisions + the people on the rows ──────────────────────────
  const divisionIds = [...new Set(
    [...awaiting, ...completed]
      .map(g => cyclesById[g.delivery_cycle_id]?.division_id)
      .filter(Boolean)
  )];
  const personIds = [...new Set(
    [...awaiting, ...completed]
      .flatMap(g => [g.approver_user_id, g.submitted_by_user_id])
      .filter(Boolean)
  )];

  const [{ data: divisions }, { data: people }] = await Promise.all([
    divisionIds.length
      ? supabase.from('divisions').select('id, division_name, display_name_short').in('id', divisionIds).is('deleted_at', null)
      : Promise.resolve({ data: [] }),
    personIds.length
      ? supabase.from('users').select('id, display_name').in('id', personIds).is('deleted_at', null)
      : Promise.resolve({ data: [] })
  ]);
  const divisionMap = {};
  (divisions || []).forEach(d => { divisionMap[d.id] = d; });
  const personMap = {};
  (people || []).forEach(u => { personMap[u.id] = u.display_name; });

  // ── 7. Shape the rows ─────────────────────────────────────────────────────
  const nowMs = Date.now();
  const shape = (g) => {
    const c = cyclesById[g.delivery_cycle_id];
    const d = c.division_id ? (divisionMap[c.division_id] || {}) : {};
    const letters = lettersByCycle[g.delivery_cycle_id] || { r: false, c: false, i: false };
    return {
      gate_record_id:              g.gate_record_id,
      delivery_cycle_id:           g.delivery_cycle_id,
      cycle_title:                 c.cycle_title,
      current_lifecycle_stage:     c.current_lifecycle_stage,
      gate_name:                   g.gate_name,
      // Rule 36: labels come from the canonical map, never milestone_label.
      gate_name_display:           GATE_NAME_DISPLAY[g.gate_name] ?? g.gate_name,
      division_id:                 c.division_id ?? null,
      division_display_name_short: d.display_name_short || d.division_name || '',
      approver_user_id:            g.approver_user_id ?? null,
      approver_display_name:       g.approver_user_id ? (personMap[g.approver_user_id] ?? null) : null,
      submitted_by_display_name:   g.submitted_by_user_id ? (personMap[g.submitted_by_user_id] ?? null) : null,
      submitted_at:                g.submitted_at ?? null,
      approver_decision_at:        g.approver_decision_at ?? null,
      // The caller's own letters on this Initiative — drives the row glyphs.
      my_letters:                  { r: letters.r, c: letters.c, i: letters.i }
    };
  };

  const daysSince = (iso) =>
    iso ? Math.floor((nowMs - new Date(iso).getTime()) / 86400000) : 0;

  const pending_gates = awaiting
    .map(g => ({ ...shape(g), days_waiting: daysSince(g.submitted_at) }))
    // Oldest first — the same urgency ordering as All Pending Gates.
    .sort((a, b) => b.days_waiting - a.days_waiting ||
                    (GATE_SEQUENCE[a.gate_name] ?? 0) - (GATE_SEQUENCE[b.gate_name] ?? 0));

  const completed_gates = completed
    .map(g => ({ ...shape(g), days_since_approval: daysSince(g.approver_decision_at) }))
    // Most recent first.
    .sort((a, b) => a.days_since_approval - b.days_since_approval ||
                    (GATE_SEQUENCE[b.gate_name] ?? 0) - (GATE_SEQUENCE[a.gate_name] ?? 0));

  return {
    success: true,
    data: {
      pending_gates,
      completed_gates,
      recent_window_days: RACI_RECENT_COMPLETED_DAYS
    }
  };
}

module.exports = {
  get_my_raci_gate_summary,
  RACI_RECENT_COMPLETED_DAYS
};
