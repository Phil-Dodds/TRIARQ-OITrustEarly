// waiting-on.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G7 (D-565 items 3–4)
// THE single computation source for the waiting-on line (AC #1): every
// surface — gate panel, initiative lists, queues, Division dashboards, the
// G8 All Pending Gates view — renders the same string for the same gate.
//
// States (AC #2), priority order (CC-G7 lean — the dominant blocker wins):
//   condition_open        — open conditions (consultation_required names the
//                           target party: "consultation (condition) — X")
//   trio_pending          — L1: named trio members yet to approve
//   consultation_pending  — L1: consulted parties yet to approve
//   approver_pending      — single approver, with days waiting
// 'meeting requested' is in the D-565 state list but has no mechanism —
// meetings are ordinary thread messages (G6); the state is unreachable and
// flagged in the GEnd CodeClose rather than fabricated.

'use strict';

const { supabase } = require('../db');

function daysSince(iso) {
  if (!iso) { return 0; }
  return Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 86400000));
}

/**
 * Batch-compute waiting-on for awaiting gate records.
 * @param {Array} gateRecords — rows with gate_record_id, delivery_cycle_id,
 *   gate_name, gate_status, approver_user_id, submitted_at
 * @param {Object} cyclesById — delivery_cycle_id → row with trio ids +
 *   baseline_level/set_level
 * @returns {Promise<Object>} gate_record_id → { state, line, days_waiting }
 */
async function computeWaitingOnBatch(gateRecords, cyclesById) {
  const awaiting = (gateRecords || []).filter(g => g.gate_status === 'awaiting_approval');
  if (awaiting.length === 0) { return {}; }
  const gateIds = awaiting.map(g => g.gate_record_id);

  const [{ data: conditionRows }, { data: consultRows }, { data: approvalRows }] = await Promise.all([
    supabase.from('gate_conditions')
      .select('gate_record_id, condition_type, condition_status, target_consultation_id')
      .in('gate_record_id', gateIds)
      .eq('condition_status', 'open'),
    supabase.from('gate_consultations')
      .select('id, gate_record_id, consulted_user_id, response')
      .in('gate_record_id', gateIds),
    supabase.from('gate_approvals')
      .select('gate_record_id, approver_user_id, approval_type')
      .in('gate_record_id', gateIds)
      .is('cleared_by_return_at', null)
  ]);

  // Resolve every display name we might print in one lookup.
  const nameIds = new Set();
  for (const g of awaiting) {
    if (g.approver_user_id) { nameIds.add(g.approver_user_id); }
    const c = cyclesById[g.delivery_cycle_id];
    if (c) {
      [c.assigned_dcs_user_id, c.assigned_epo_user_id, c.assigned_dol_user_id]
        .filter(Boolean).forEach(id => nameIds.add(id));
    }
  }
  (consultRows || []).forEach(r => nameIds.add(r.consulted_user_id));
  const nameMap = {};
  if (nameIds.size > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', [...nameIds]);
    (users || []).forEach(u => { nameMap[u.id] = u.display_name; });
  }
  const consultById = {};
  (consultRows || []).forEach(r => { consultById[r.id] = r; });

  const result = {};
  for (const g of awaiting) {
    const cycle = cyclesById[g.delivery_cycle_id] || {};
    const days  = daysSince(g.submitted_at);
    const openConditions = (conditionRows || []).filter(c => c.gate_record_id === g.gate_record_id);

    // 1. Open conditions dominate (S-B5).
    if (openConditions.length > 0) {
      const consultCondition = openConditions.find(c =>
        c.condition_type === 'consultation_required' && c.target_consultation_id);
      if (consultCondition) {
        const target = consultById[consultCondition.target_consultation_id];
        const who = target ? (nameMap[target.consulted_user_id] || 'a consulted party') : 'a consulted party';
        result[g.gate_record_id] = {
          state: 'condition_open',
          line:  `Waiting on: consultation (condition) — ${who}`,
          days_waiting: days
        };
      } else {
        result[g.gate_record_id] = {
          state: 'condition_open',
          line:  `Waiting on: ${openConditions.length} open condition${openConditions.length === 1 ? '' : 's'}`,
          days_waiting: days
        };
      }
      continue;
    }

    // 2. L1 consensus: trio, then consultation.
    const effectiveLevel = cycle.set_level ?? cycle.baseline_level ?? null;
    if (effectiveLevel === 1 && !g.approver_user_id) {
      const trioIds = [cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id, cycle.assigned_dol_user_id]
        .filter(Boolean);
      const approvedSet = new Set(
        (approvalRows || [])
          .filter(a => a.gate_record_id === g.gate_record_id &&
            (a.approval_type === 'trio_member' || a.approval_type === 'ie_override'))
          .map(a => a.approver_user_id)
      );
      const pendingTrio = trioIds.filter(id => !approvedSet.has(id));
      const pendingConsulted = (consultRows || []).filter(r =>
        r.gate_record_id === g.gate_record_id &&
        !trioIds.includes(r.consulted_user_id) && r.response === 'pending');

      if (pendingTrio.length > 0) {
        result[g.gate_record_id] = {
          state: 'trio_pending',
          line:  `Waiting on: trio — ${pendingTrio.map(id => nameMap[id] || 'Unknown').join(', ')}`,
          days_waiting: days
        };
        continue;
      }
      if (pendingConsulted.length > 0) {
        const names = pendingConsulted.map(r => nameMap[r.consulted_user_id] || 'Unknown');
        result[g.gate_record_id] = {
          state: 'consultation_pending',
          line:  `Waiting on: consultation — ${names.join(', ')}`,
          days_waiting: days
        };
        continue;
      }
      result[g.gate_record_id] = {
        state: 'trio_pending',
        line:  'Waiting on: final collection',
        days_waiting: days
      };
      continue;
    }

    // 3. Single approver (with days).
    const approverName = g.approver_user_id ? (nameMap[g.approver_user_id] || 'approver') : 'an Admin (unassigned)';
    result[g.gate_record_id] = {
      state: 'approver_pending',
      line:  `Waiting on: approver — ${approverName} (${days} day${days === 1 ? '' : 's'})`,
      days_waiting: days
    };
  }

  return result;
}

module.exports = { computeWaitingOnBatch, daysSince };
