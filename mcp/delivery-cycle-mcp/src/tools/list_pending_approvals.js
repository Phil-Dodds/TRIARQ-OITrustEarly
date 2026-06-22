// list_pending_approvals.js
// Pathways OI Trust — delivery-cycle-mcp
// Returns gate_records currently awaiting approval where the caller is the
// designated approver. Powers the Action Queue (D-187/D-199) and the
// pending-approvals sidebar badge.
//
// Returns empty array when there are no pending approvals.
// No pagination — Build C scale.
//
// Build C: Phil is the default approver when approver_user_id is null.
// RACI-configured approvers honoured when set.
//
// Source: D-345, gate-submission-flow-spec-2026-04-19 §3.4, §8.

'use strict';

const { supabase } = require('../db');

const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

/**
 * @param {object} _params - (unused; scoped to JWT identity)
 * @param {string} caller_user_id - from JWT
 */
async function list_pending_approvals(_params, caller_user_id) {
  // ── Caller role for Admin-fallback approver behaviour ────────────────────
  // Contract 19 (D-394, CC-19-01): boolean predicate; 'phil' collapsed into is_admin.
  // Admins see any pending approval where the approver slot is unassigned, in addition
  // to ones they are the explicit approver for.
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  const isAdmin = caller?.is_admin === true;

  // ── Accountable items: pending gate records the caller approves ──────────
  let gateQuery = supabase
    .from('gate_records')
    .select('gate_record_id, delivery_cycle_id, gate_name, gate_status, submitted_at, submitted_by_user_id, approver_user_id, approver_decision_at, created_at')
    .eq('gate_status', 'awaiting_approval')
    .is('deleted_at', null);

  if (isAdmin) {
    gateQuery = gateQuery.or(`approver_user_id.eq.${caller_user_id},approver_user_id.is.null`);
  } else {
    gateQuery = gateQuery.eq('approver_user_id', caller_user_id);
  }

  const { data: accountableGates, error: gateErr } = await gateQuery;
  if (gateErr) {
    return { success: false, error: `Failed to list pending approvals: ${gateErr.message}` };
  }

  // ── Consulted items (WS2, D-462/D-468): gates where the caller has a ──────
  // pending consultation. Includes awaiting_approval (actionable), approved, and
  // returned (Contract 30 follow-up) gates — Angular shows the approver's decision
  // ("Approved by…" / "Returned by…") and drops the action for non-awaiting gates.
  const { data: myPendingConsults, error: consultErr } = await supabase
    .from('gate_consultations')
    .select('gate_record_id')
    .eq('consulted_user_id', caller_user_id)
    .eq('response', 'pending');
  if (consultErr) {
    return { success: false, error: `Failed to list consulted items: ${consultErr.message}` };
  }

  const accountableIds = new Set((accountableGates || []).map(g => g.gate_record_id));
  const consultGateIds = [...new Set(
    (myPendingConsults || [])
      .map(c => c.gate_record_id)
      .filter(id => id && !accountableIds.has(id)) // accountable wins if both
  )];

  let consultedGates = [];
  if (consultGateIds.length > 0) {
    const { data: cg, error: cgErr } = await supabase
      .from('gate_records')
      .select('gate_record_id, delivery_cycle_id, gate_name, gate_status, submitted_at, submitted_by_user_id, approver_user_id, approver_decision_at, created_at')
      .in('gate_record_id', consultGateIds)
      .in('gate_status', ['awaiting_approval', 'approved', 'returned'])
      .is('deleted_at', null);
    if (cgErr) {
      return { success: false, error: `Failed to load consulted gates: ${cgErr.message}` };
    }
    consultedGates = cg || [];
  }

  // Tag with item_type before enrichment (D-468 — Angular reads item_type + gate_status).
  const gates = [
    ...(accountableGates || []).map(g => ({ ...g, item_type: 'accountable' })),
    ...consultedGates.map(g => ({ ...g, item_type: 'consulted' }))
  ];

  if (gates.length === 0) {
    return { success: true, data: [] };
  }

  // ── WS1.2 (D-468): per-gate Consulted summary for the status indicator ────
  // {pending_count, declined_count} from gate_consultations, keyed by
  // gate_record_id. Omitted from the item entirely when both counts are zero.
  const gateRecordIds = [...new Set(gates.map(g => g.gate_record_id))];
  const consultSummaryMap = {};
  {
    const { data: consultRows, error: csErr } = await supabase
      .from('gate_consultations')
      .select('gate_record_id, response')
      .in('gate_record_id', gateRecordIds);
    if (csErr) {
      return { success: false, error: `Failed to load Consulted summary: ${csErr.message}` };
    }
    (consultRows || []).forEach(r => {
      const s = consultSummaryMap[r.gate_record_id] || { pending_count: 0, declined_count: 0 };
      if (r.response === 'pending')  { s.pending_count++; }
      if (r.response === 'declined') { s.declined_count++; }
      consultSummaryMap[r.gate_record_id] = s;
    });
  }

  // ── WS1.3: gate milestone target dates for the My Actions "Due" column ────
  // Keyed by `${delivery_cycle_id}|${gate_name}`. Null when no milestone row.
  const milestoneTargetMap = {};
  {
    const { data: msRows } = await supabase
      .from('cycle_milestone_dates')
      .select('delivery_cycle_id, gate_name, target_date')
      .in('delivery_cycle_id', [...new Set(gates.map(g => g.delivery_cycle_id))])
      .is('deleted_at', null);
    (msRows || []).forEach(m => {
      milestoneTargetMap[`${m.delivery_cycle_id}|${m.gate_name}`] = m.target_date || null;
    });
  }

  // ── Resolve cycles, divisions, workstreams, submitters in parallel ──────
  const cycleIds     = [...new Set(gates.map(g => g.delivery_cycle_id))];
  // Resolve submitter + approver display names from one users lookup.
  const userIds = [...new Set([
    ...gates.map(g => g.submitted_by_user_id),
    ...gates.map(g => g.approver_user_id)
  ].filter(Boolean))];

  const { data: cycles } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, tier_classification, division_id, workstream_id')
    .in('delivery_cycle_id', cycleIds)
    .is('deleted_at', null);

  const cycleMap = {};
  (cycles || []).forEach(c => { cycleMap[c.delivery_cycle_id] = c; });

  const divisionIds   = [...new Set((cycles || []).map(c => c.division_id).filter(Boolean))];
  const workstreamIds = [...new Set((cycles || []).map(c => c.workstream_id).filter(Boolean))];

  const [{ data: divisions }, { data: workstreams }, { data: submitters }] = await Promise.all([
    divisionIds.length
      ? supabase.from('divisions')
          .select('id, division_name, display_name_short')
          .in('id', divisionIds)
          .is('deleted_at', null)
      : Promise.resolve({ data: [] }),
    workstreamIds.length
      ? supabase.from('delivery_workstreams')
          .select('workstream_id, workstream_name, display_name_short')
          .in('workstream_id', workstreamIds)
          .is('deleted_at', null)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase.from('users')
          .select('id, display_name')
          .in('id', userIds)
          .is('deleted_at', null)
      : Promise.resolve({ data: [] })
  ]);

  const divisionMap   = {};
  const workstreamMap = {};
  const userNameMap   = {};
  (divisions   || []).forEach(d => { divisionMap[d.id] = d; });
  (workstreams || []).forEach(w => { workstreamMap[w.workstream_id] = w; });
  (submitters  || []).forEach(u => { userNameMap[u.id] = u.display_name; });

  // ── Assemble response items ──────────────────────────────────────────────
  // Drop gates whose cycle is missing (soft-deleted initiative). cycleMap is
  // built from delivery_cycles filtered to deleted_at IS NULL, so a missing
  // entry means the initiative was soft-deleted — otherwise a pending
  // consultation on a deleted initiative would surface a blank, un-navigable
  // ghost row in the Action Queue (Contract 29 review #5).
  const items = gates.filter(g => cycleMap[g.delivery_cycle_id]).map(g => {
    const c  = cycleMap[g.delivery_cycle_id]      || {};
    const d  = divisionMap[c.division_id]         || {};
    const w  = workstreamMap[c.workstream_id]     || {};
    const cs = consultSummaryMap[g.gate_record_id];
    return {
      gate_record_id:                g.gate_record_id,
      delivery_cycle_id:             g.delivery_cycle_id,
      cycle_title:                   c.cycle_title || '',
      division_display_name_short:   d.display_name_short || d.division_name || '',
      workstream_display_name_short: w.display_name_short || w.workstream_name || '',
      gate_name:                     g.gate_name,
      gate_name_display:             GATE_NAME_DISPLAY[g.gate_name] || g.gate_name,
      gate_status:                   g.gate_status,   // 'awaiting_approval' | 'approved' | 'returned'
      item_type:                     g.item_type,     // 'accountable' | 'consulted'
      submitted_at:                  g.submitted_at,
      submitted_by_display_name:     userNameMap[g.submitted_by_user_id] || 'Unknown',
      tier_classification:           c.tier_classification,
      // Contract 30 follow-up: approver decision attribution for consulted rows
      // ("Approved by …" / "Returned by …"). Null until the approver decides.
      approver_display_name:         g.approver_user_id ? (userNameMap[g.approver_user_id] || null) : null,
      approver_decision_at:          g.approver_decision_at ?? null,
      // WS1.2/WS1.3 (D-472): created_at for the 21-day filter; gate_target_date for the Due column.
      created_at:                    g.created_at,
      gate_target_date:              milestoneTargetMap[`${g.delivery_cycle_id}|${g.gate_name}`] ?? null,
      // WS1.2 (D-468): Consulted summary — omitted when both counts are zero.
      ...(cs && (cs.pending_count > 0 || cs.declined_count > 0) ? { consulted_summary: cs } : {})
    };
  });

  // Newest-submitted first.
  items.sort((a, b) => {
    const ta = a.submitted_at ? Date.parse(a.submitted_at) : 0;
    const tb = b.submitted_at ? Date.parse(b.submitted_at) : 0;
    return tb - ta;
  });

  return { success: true, data: items };
}

module.exports = { list_pending_approvals };
