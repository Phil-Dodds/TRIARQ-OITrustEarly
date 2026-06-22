// list_completed_actions.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 30 follow-up).
//
// Returns actions the CALLER personally took — the history behind the My Actions
// "Completed" tab. Two sources, JWT-scoped to the caller:
//   - Approver decisions: gate_records the caller decided (approver_user_id = caller),
//     gate_status 'approved' or 'returned' → decision "Approved" / "Returned".
//   - Consulted responses: gate_consultations the caller answered
//     (consulted_user_id = caller, response not pending) → "Approved" / "Declined" /
//     "Declined (post-approval)".
// Accountable wins when the caller is both approver and consulted on one gate.
// (Other action types may be added later — keep the assembly list-driven.)
//
// No pagination — Build C scale. Newest action first.

'use strict';

const { supabase } = require('../db');

const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

const CONSULT_DECISION_LABEL = {
  approved:                'Approved',
  declined:                'Declined',
  declined_post_approval:  'Declined (post-approval)'
};

/**
 * @param {object} _params - unused; scoped to JWT identity
 * @param {string} caller_user_id - from JWT
 */
async function list_completed_actions(_params, caller_user_id) {
  // ── Approver decisions the caller made ────────────────────────────────────
  const { data: approverGates, error: agErr } = await supabase
    .from('gate_records')
    .select('gate_record_id, delivery_cycle_id, gate_name, gate_status, approver_decision_at')
    .eq('approver_user_id', caller_user_id)
    .in('gate_status', ['approved', 'returned'])
    .not('approver_decision_at', 'is', null)
    .is('deleted_at', null);
  if (agErr) {
    return { success: false, error: `Failed to load approver decisions: ${agErr.message}` };
  }

  // ── Consultation responses the caller recorded ────────────────────────────
  const { data: myConsults, error: cErr } = await supabase
    .from('gate_consultations')
    .select('gate_record_id, response, responded_at')
    .eq('consulted_user_id', caller_user_id)
    .in('response', ['approved', 'declined', 'declined_post_approval']);
  if (cErr) {
    return { success: false, error: `Failed to load consultation responses: ${cErr.message}` };
  }

  const approverIds = new Set((approverGates || []).map(g => g.gate_record_id));
  const consultRows = (myConsults || []).filter(c => c.gate_record_id && !approverIds.has(c.gate_record_id));

  // Resolve gate records for the consulted rows (cycle + gate name).
  const consultGateIds = [...new Set(consultRows.map(c => c.gate_record_id))];
  let consultGateMap = {};
  if (consultGateIds.length > 0) {
    const { data: cg } = await supabase
      .from('gate_records')
      .select('gate_record_id, delivery_cycle_id, gate_name')
      .in('gate_record_id', consultGateIds)
      .is('deleted_at', null);
    (cg || []).forEach(g => { consultGateMap[g.gate_record_id] = g; });
  }

  // ── Assemble raw actions ──────────────────────────────────────────────────
  const actions = [];
  for (const g of (approverGates || [])) {
    actions.push({
      gate_record_id:    g.gate_record_id,
      delivery_cycle_id: g.delivery_cycle_id,
      gate_name:         g.gate_name,
      item_type:         'accountable',
      decision:          g.gate_status === 'returned' ? 'Returned' : 'Approved',
      acted_at:          g.approver_decision_at
    });
  }
  for (const c of consultRows) {
    const g = consultGateMap[c.gate_record_id];
    if (!g) { continue; }
    actions.push({
      gate_record_id:    c.gate_record_id,
      delivery_cycle_id: g.delivery_cycle_id,
      gate_name:         g.gate_name,
      item_type:         'consulted',
      decision:          CONSULT_DECISION_LABEL[c.response] || c.response,
      acted_at:          c.responded_at
    });
  }

  if (actions.length === 0) {
    return { success: true, data: [] };
  }

  // ── Enrich with initiative title + division short name ────────────────────
  const cycleIds = [...new Set(actions.map(a => a.delivery_cycle_id))];
  const { data: cycles } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, division_id')
    .in('delivery_cycle_id', cycleIds)
    .is('deleted_at', null);
  const cycleMap = {};
  (cycles || []).forEach(c => { cycleMap[c.delivery_cycle_id] = c; });

  const divisionIds = [...new Set((cycles || []).map(c => c.division_id).filter(Boolean))];
  let divisionMap = {};
  if (divisionIds.length > 0) {
    const { data: divisions } = await supabase
      .from('divisions')
      .select('id, division_name, display_name_short')
      .in('id', divisionIds)
      .is('deleted_at', null);
    (divisions || []).forEach(d => { divisionMap[d.id] = d; });
  }

  // Drop actions whose initiative was soft-deleted (no cycleMap entry).
  const items = actions.filter(a => cycleMap[a.delivery_cycle_id]).map(a => {
    const c = cycleMap[a.delivery_cycle_id] || {};
    const d = divisionMap[c.division_id]    || {};
    return {
      gate_record_id:              a.gate_record_id,
      delivery_cycle_id:           a.delivery_cycle_id,
      cycle_title:                 c.cycle_title || '',
      division_display_name_short: d.display_name_short || d.division_name || '',
      gate_name:                   a.gate_name,
      gate_name_display:           GATE_NAME_DISPLAY[a.gate_name] || a.gate_name,
      item_type:                   a.item_type,   // 'accountable' | 'consulted'
      decision:                    a.decision,    // 'Approved' | 'Returned' | 'Declined' | 'Declined (post-approval)'
      acted_at:                    a.acted_at
    };
  });

  // Newest action first.
  items.sort((x, y) => {
    const tx = x.acted_at ? Date.parse(x.acted_at) : 0;
    const ty = y.acted_at ? Date.parse(y.acted_at) : 0;
    return ty - tx;
  });

  return { success: true, data: items };
}

module.exports = { list_completed_actions };
