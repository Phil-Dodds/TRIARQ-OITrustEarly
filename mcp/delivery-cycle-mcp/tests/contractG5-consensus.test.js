// contractG5-consensus.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract G5, D-557 L1 consensus).
// Trio + consulted approval collection, submitter auto-approval semantics,
// any-return-returns-all clearing (Checkpoint ruling 1), assignment floor,
// S-A1–S-A4 mechanics. FIFO-queue mock per contract32/G1–G4 technique.
// Full submit-path S-A1 (queue creation + emails) is UAT-verified end to end;
// the pieces (floor, auto-approval helper, collection state) are unit-covered.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

let queue = [];
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }
const chain = {
  from:   () => chain,
  select: () => chain,
  insert: () => chain,
  update: () => chain,
  upsert: () => chain,
  delete: () => chain,
  eq:     () => chain,
  neq:    () => chain,
  is:     () => chain,
  in:     () => chain,
  not:    () => chain,
  or:     () => chain,
  order:  () => chain,
  limit:  () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};
chain.functions = { invoke: async () => ({ data: null, error: null }) };

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain }
};

const l1 = require('../src/tools/helpers/l1-consensus');
const { record_gate_decision } = require('../src/tools/record_gate_decision');
const { record_consultation_response } = require('../src/tools/record_consultation_response');
// GA-1: trio + consulted approvals carry an assessment.
const { requiredItemKeys } = require('../src/lib/gate-assessment-registry');
const ga1Assessment = (gate, role) => requiredItemKeys(gate, role).map(k => ({ item_key: k, grade: 'B' }));
const { submit_gate_for_approval } = require('../src/tools/submit_gate_for_approval');

const DCS = 'dcs-uuid', EPO = 'epo-uuid', DOL = 'dol-uuid', CONS = 'consulted-uuid', OUT = 'outsider-uuid';
const CYC = 'c1', GATE = 'g1';

const l1Cycle = (over = {}) => ({
  delivery_cycle_id: CYC, cycle_title: 'T', current_lifecycle_stage: 'BRIEF',
  workstream_id: null, division_id: 'div',
  assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO, assigned_dol_user_id: DOL,
  baseline_level: 1, set_level: null, oversight_user_id: null,
  ...over
});

beforeEach(() => { queue = []; });

describe('l1-consensus helpers (D-557)', () => {
  test('isL1ConsensusGate: L1 + NULL approver only', () => {
    assert.equal(l1.isL1ConsensusGate(l1Cycle(), { approver_user_id: null }), true);
    assert.equal(l1.isL1ConsensusGate(l1Cycle(), { approver_user_id: 'x' }), false);
    assert.equal(l1.isL1ConsensusGate(l1Cycle({ baseline_level: 2 }), { approver_user_id: null }), false);
    assert.equal(l1.isL1ConsensusGate(l1Cycle({ baseline_level: null }), { approver_user_id: null }), false);
  });

  test('getL1CollectedState: pending consulted blocks passage (S-A3)', async () => {
    queue = [
      { data: [
          { approver_user_id: DCS, approval_type: 'trio_member' },
          { approver_user_id: EPO, approval_type: 'trio_member' },
          { approver_user_id: DOL, approval_type: 'trio_member' }
        ], error: null },
      { data: [ { consulted_user_id: CONS, response: 'pending' } ], error: null }
    ];
    const s = await l1.getL1CollectedState(GATE, l1Cycle());
    assert.equal(s.allCollected, false);
    assert.deepEqual(s.pendingConsultedIds, [CONS]);
    assert.deepEqual(s.pendingTrioIds, []);
  });

  test('getL1CollectedState: trio consultation rows never double-count', async () => {
    queue = [
      { data: [ { approver_user_id: DCS, approval_type: 'trio_member' } ], error: null },
      { data: [
          { consulted_user_id: DCS, response: 'pending' },   // trio member — ignored
          { consulted_user_id: CONS, response: 'approved' }
        ], error: null }
    ];
    const s = await l1.getL1CollectedState(GATE, l1Cycle());
    assert.deepEqual(s.pendingTrioIds, [EPO, DOL]);
    assert.deepEqual(s.pendingConsultedIds, []);
    assert.equal(s.allCollected, false);
  });

  test('recordTrioApproval: uncleared duplicate guarded', async () => {
    queue = [ { data: { approval_id: 'a1' }, error: null } ];
    const r = await l1.recordTrioApproval(GATE, DCS);
    assert.equal(r.duplicate, true);
  });
});

describe('record_gate_decision — L1 consensus route (G5)', () => {
  const gateRow = { gate_record_id: GATE, gate_status: 'awaiting_approval', approver_user_id: null };

  test('non-trio non-admin cannot act on an L1 gate', async () => {
    queue = [
      { data: gateRow, error: null },                                      // gate
      { data: l1Cycle(), error: null },                                    // cycle
      { data: { is_admin: false, is_super_admin: false, display_name: 'Out' }, error: null } // caller
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'brief_review', decision: 'approved' }, OUT);
    assert.equal(r.success, false);
    assert.match(r.error, /trio member or an Admin/);
  });

  test('trio return returns entirely and clears approvals (S-A2, ruling 1)', async () => {
    queue = [
      { data: gateRow, error: null },
      { data: l1Cycle(), error: null },
      { data: { is_admin: false, is_super_admin: false, display_name: 'DOL Person' }, error: null },
      { data: { ...gateRow, gate_status: 'returned' }, error: null },      // gate update
      { data: { event_id: 'ev1' }, error: null },                          // gate_returned event
      { data: null, error: null },                                         // clearGateApprovals update
      { data: [], error: null }                                            // trio user lookup (no emails)
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'brief_review', decision: 'returned', approver_notes: 'rework' }, DOL);
    assert.equal(r.success, true);
    assert.equal(r.data.l1_consensus, true);
    assert.equal(r.data.gate_record.gate_status, 'returned');
    assert.equal(queue.length, 0, 'clearing + notify queries consumed');
  });

  test('partial trio approval leaves the gate pending with the waiting list (S-A1)', async () => {
    queue = [
      { data: gateRow, error: null },
      { data: l1Cycle(), error: null },
      { data: { is_admin: false, is_super_admin: false, display_name: 'EPO Person' }, error: null },
      { data: null, error: null },                                         // dup check — none
      { data: null, error: null },                                         // approval insert
      { data: null, error: null },                                         // gate_trio_approved event
      { data: null, error: null },                                         // GA-1 assessment self-supersede clear
      { data: null, error: null },                                         // GA-1 assessment insert
      { data: [
          { approver_user_id: DCS, approval_type: 'trio_member' },
          { approver_user_id: EPO, approval_type: 'trio_member' }
        ], error: null },                                                  // approvals state
      { data: [], error: null }                                            // consultations state
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'brief_review', decision: 'approved',
        assessment: ga1Assessment('brief_review', 'trio_member') }, EPO);
    assert.equal(r.success, true);
    assert.equal(r.data.l1_consensus, true);
    assert.deepEqual(r.data.l1_pending.pending_trio_user_ids, [DOL]);
    assert.equal(r.data.gate_record.gate_status, 'awaiting_approval');
  });

  test('duplicate trio approval rejected', async () => {
    queue = [
      { data: gateRow, error: null },
      { data: l1Cycle(), error: null },
      { data: { is_admin: false, is_super_admin: false, display_name: 'EPO Person' }, error: null },
      { data: { approval_id: 'a1' }, error: null }                         // dup found
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'brief_review', decision: 'approved',
        assessment: ga1Assessment('brief_review', 'trio_member') }, EPO);
    assert.equal(r.success, false);
    assert.match(r.error, /already approved/);
  });

  test('last collected approval passes the gate instantly (AC #6)', async () => {
    queue = [
      { data: gateRow, error: null },
      { data: l1Cycle(), error: null },
      { data: { is_admin: false, is_super_admin: false, display_name: 'DOL Person' }, error: null },
      { data: null, error: null },                                         // dup check
      { data: null, error: null },                                         // approval insert
      { data: null, error: null },                                         // gate_trio_approved event
      { data: null, error: null },                                         // GA-1 assessment self-supersede clear
      { data: null, error: null },                                         // GA-1 assessment insert
      { data: [
          { approver_user_id: DCS, approval_type: 'trio_member' },
          { approver_user_id: EPO, approval_type: 'trio_member' },
          { approver_user_id: DOL, approval_type: 'trio_member' }
        ], error: null },                                                  // approvals — complete
      { data: [], error: null },                                           // consultations — none pending
      { data: [], error: null },                                           // open conditions (G6) — none
      // ── applyGateApprovalTransition ──
      { data: { ...gateRow, gate_status: 'approved', approver_user_id: null }, error: null }, // gate update
      { data: null, error: null },                                         // milestone update
      { data: null, error: null },                                         // stage advance update
      { data: null, error: null },                                         // gate_approved event
      { data: null, error: null },                                         // stage_advanced event
      { data: [], error: null },                                           // informed stakes (none)
      { data: [], error: null },                                           // artifact types (suggestions)
      { data: [], error: null }                                            // attached artifacts
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'brief_review', decision: 'approved',
        assessment: ga1Assessment('brief_review', 'trio_member') }, DOL);
    assert.equal(r.success, true);
    assert.equal(r.data.l1_completed, true);
    assert.equal(r.data.gate_record.gate_status, 'approved');
    assert.equal(r.data.gate_record.approver_user_id, null, 'L1 keeps approver NULL (D-570a retired)');
    assert.equal(r.data.stage_advanced, true);
  });
});

describe('record_consultation_response — L1 force (S-A3/S-A4)', () => {
  const awaitingGate = {
    gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'brief_review',
    gate_status: 'awaiting_approval', approver_user_id: null, approver_decision_at: null
  };

  test('consulted decline returns the gate entirely (S-A4)', async () => {
    queue = [
      { data: { id: 'cons1', gate_record_id: GATE, consulted_user_id: CONS, response: 'pending' }, error: null },
      { data: awaitingGate, error: null },
      { data: { id: 'cons1', response: 'declined' }, error: null },        // consultation update
      { data: l1Cycle(), error: null },                                    // cycle
      { data: { display_name: 'Consulted Person' }, error: null },         // responder
      { data: null, error: null },                                         // gate update → returned
      { data: { event_id: 'ev2' }, error: null },                          // gate_returned event
      { data: null, error: null },                                         // clear approvals
      { data: [], error: null }                                            // trio lookup (no emails)
    ];
    const r = await record_consultation_response(
      { gate_record_id: GATE, response: 'declined', notes: 'concerns' }, CONS);
    assert.equal(r.success, true);
    assert.equal(r.data.l1_gate_returned, true);
    assert.equal(queue.length, 0);
  });

  test('last consulted approval passes the gate (S-A3 completion)', async () => {
    queue = [
      { data: { id: 'cons1', gate_record_id: GATE, consulted_user_id: CONS, response: 'pending' }, error: null },
      { data: awaitingGate, error: null },
      { data: { id: 'cons1', response: 'approved' }, error: null },        // consultation update
      { data: null, error: null },                                         // GA-1 assessment self-supersede clear
      { data: null, error: null },                                         // GA-1 assessment insert
      { data: null, error: null },                                         // G6 condition auto-resolve
      { data: l1Cycle(), error: null },                                    // cycle
      { data: { display_name: 'Consulted Person' }, error: null },         // responder
      { data: [
          { approver_user_id: DCS, approval_type: 'trio_member' },
          { approver_user_id: EPO, approval_type: 'trio_member' },
          { approver_user_id: DOL, approval_type: 'trio_member' }
        ], error: null },                                                  // approvals
      { data: [ { consulted_user_id: CONS, response: 'approved' } ], error: null }, // consultations
      { data: [], error: null },                                           // open conditions (G6) — none
      // transition
      { data: { ...awaitingGate, gate_status: 'approved' }, error: null },
      { data: null, error: null },                                         // milestone
      { data: null, error: null },                                         // stage advance
      { data: null, error: null },                                         // gate_approved event
      { data: null, error: null },                                         // stage_advanced event
      { data: [], error: null },                                           // informed stakes
      { data: [], error: null },                                           // artifact types
      { data: [], error: null }                                            // attached artifacts
    ];
    const r = await record_consultation_response(
      { gate_record_id: GATE, response: 'approved',
        assessment: ga1Assessment('brief_review', 'consulted') }, CONS);
    assert.equal(r.success, true);
    assert.equal(r.data.l1_gate_approved, true);
  });

  test('non-L1 gates keep the plain response behavior (regression)', async () => {
    queue = [
      { data: { id: 'cons1', gate_record_id: GATE, consulted_user_id: CONS, response: 'pending' }, error: null },
      { data: { ...awaitingGate, approver_user_id: 'approver-x' }, error: null }, // approver set → not L1
      { data: { id: 'cons1', response: 'approved' }, error: null },
      { data: null, error: null },                                         // GA-1 assessment self-supersede clear
      { data: null, error: null },                                         // GA-1 assessment insert
      { data: l1Cycle(), error: null }                                     // cycle fetched, isL1 false → done
    ];
    const r = await record_consultation_response(
      { gate_record_id: GATE, response: 'approved',
        assessment: ga1Assessment('brief_review', 'consulted') }, CONS);
    assert.equal(r.success, true);
    assert.equal(r.data.l1_gate_approved, undefined);
  });
});

describe('submit_gate_for_approval — L1 assignment floor (G5 AC #5)', () => {
  test('L1 Brief Review without DOL blocked with the named role — even when the Division exempts DOL', async () => {
    queue = [
      { data: l1Cycle({ assigned_dol_user_id: null, ai_functionality: 'no' }), error: null }, // cycle
      { data: { is_admin: true, display_name: 'Phil' }, error: null },     // caller
      { data: { delivery_cycle_id: CYC }, error: null },                   // sizing row (G3)
      { data: { dol_required: false }, error: null },                      // D-424 exemption — L1 floor still applies
      { data: null, error: null }                                          // gate_blocked event
    ];
    const r = await submit_gate_for_approval(
      { delivery_cycle_id: CYC, gate_name: 'brief_review',
        assessment: ga1Assessment('brief_review', 'submitter') }, DCS);
    assert.equal(r.success, false);
    assert.match(r.error, /Domain Outcome Lead/);
    assert.match(r.error, /Level 1/);
  });
});
