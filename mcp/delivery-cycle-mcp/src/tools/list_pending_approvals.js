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
  // ── Caller role for Phil-fallback approver behaviour ─────────────────────
  const { data: caller } = await supabase
    .from('users')
    .select('system_role')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  const isPhil = caller?.system_role === 'phil';

  // ── Pending gate records the caller is the approver for ──────────────────
  let gateQuery = supabase
    .from('gate_records')
    .select('gate_record_id, delivery_cycle_id, gate_name, submitted_at, submitted_by_user_id, approver_user_id')
    .eq('gate_status', 'awaiting_approval')
    .is('deleted_at', null);

  if (isPhil) {
    gateQuery = gateQuery.or(`approver_user_id.eq.${caller_user_id},approver_user_id.is.null`);
  } else {
    gateQuery = gateQuery.eq('approver_user_id', caller_user_id);
  }

  const { data: gates, error: gateErr } = await gateQuery;
  if (gateErr) {
    return { success: false, error: `Failed to list pending approvals: ${gateErr.message}` };
  }
  if (!gates || gates.length === 0) {
    return { success: true, data: [] };
  }

  // ── Resolve cycles, divisions, workstreams, submitters in parallel ──────
  const cycleIds     = [...new Set(gates.map(g => g.delivery_cycle_id))];
  const submitterIds = [...new Set(gates.map(g => g.submitted_by_user_id).filter(Boolean))];

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
    submitterIds.length
      ? supabase.from('users')
          .select('id, display_name')
          .in('id', submitterIds)
          .is('deleted_at', null)
      : Promise.resolve({ data: [] })
  ]);

  const divisionMap   = {};
  const workstreamMap = {};
  const submitterMap  = {};
  (divisions   || []).forEach(d => { divisionMap[d.id] = d; });
  (workstreams || []).forEach(w => { workstreamMap[w.workstream_id] = w; });
  (submitters  || []).forEach(u => { submitterMap[u.id] = u.display_name; });

  // ── Assemble response items ──────────────────────────────────────────────
  const items = gates.map(g => {
    const c  = cycleMap[g.delivery_cycle_id]      || {};
    const d  = divisionMap[c.division_id]         || {};
    const w  = workstreamMap[c.workstream_id]     || {};
    return {
      gate_record_id:                g.gate_record_id,
      delivery_cycle_id:             g.delivery_cycle_id,
      cycle_title:                   c.cycle_title || '',
      division_display_name_short:   d.display_name_short || d.division_name || '',
      workstream_display_name_short: w.display_name_short || w.workstream_name || '',
      gate_name:                     g.gate_name,
      gate_name_display:             GATE_NAME_DISPLAY[g.gate_name] || g.gate_name,
      submitted_at:                  g.submitted_at,
      submitted_by_display_name:     submitterMap[g.submitted_by_user_id] || 'Unknown',
      tier_classification:           c.tier_classification
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
