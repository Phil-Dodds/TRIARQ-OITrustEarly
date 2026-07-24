// contractG6-thread-conditions.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract G6, D-565).
// Conditions hold approvals; returns clear them; consultation_required
// auto-resolves on the target's approval (S-B5); resolver auth extends to the
// gate's approver. FIFO-queue mock per the established technique.
// Thread message #1 (submission note) is asserted at source level — the full
// submit path is UAT-verified.

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

const { record_gate_decision } = require('../src/tools/record_gate_decision');
const { record_consultation_response } = require('../src/tools/record_consultation_response');
const conditionTools = require('../src/tools/gate_conditions');

const APPROVER = 'approver-uuid', OTHER = 'other-uuid', CONS = 'cons-uuid';
const CYC = 'c1', GATE = 'g1';

const l2Cycle = {
  delivery_cycle_id: CYC, cycle_title: 'T', current_lifecycle_stage: 'BRIEF',
  workstream_id: null, assigned_dcs_user_id: OTHER, assigned_epo_user_id: OTHER,
  assigned_dol_user_id: OTHER, baseline_level: 2, set_level: null
};

beforeEach(() => { queue = []; });

describe('G6 — open conditions hold approvals (AC #3)', () => {
  test('approve blocked while a condition is open', async () => {
    queue = [
      { data: { gate_record_id: GATE, gate_status: 'awaiting_approval', approver_user_id: APPROVER }, error: null },
      { data: l2Cycle, error: null },
      { data: { is_admin: false, is_super_admin: false, display_name: 'Approver' }, error: null },
      { data: [], error: null },                                          // declined consultations (G8) — none
      { data: [{ condition_id: 'cond1' }], error: null }                  // one open condition
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'go_to_build', decision: 'approved' }, APPROVER);
    assert.equal(r.success, false);
    assert.match(r.error, /open condition/);
  });

  test('return clears open conditions with the approvals (AC #5)', async () => {
    queue = [
      { data: { gate_record_id: GATE, gate_status: 'awaiting_approval', approver_user_id: APPROVER }, error: null },
      { data: l2Cycle, error: null },
      { data: { is_admin: false, is_super_admin: false, display_name: 'Approver' }, error: null },
      { data: { gate_record_id: GATE, gate_status: 'returned' }, error: null }, // gate update
      { data: { event_id: 'ev1' }, error: null },                          // gate_returned event
      { data: null, error: null },                                         // clear approvals
      { data: null, error: null }                                          // clear conditions
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'go_to_build', decision: 'returned', approver_notes: 'rework' }, APPROVER);
    assert.equal(r.success, true);
    assert.equal(queue.length, 0, 'condition clearing consumed');
  });
});

describe('G6 — consultation_required auto-resolve (S-B5)', () => {
  test('approving the targeted consultation auto-resolves its condition', async () => {
    queue = [
      { data: { id: 'cons-row', gate_record_id: GATE, consulted_user_id: CONS, response: 'pending' }, error: null },
      { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'go_to_build', gate_status: 'awaiting_approval', approver_user_id: APPROVER, approver_decision_at: null }, error: null },
      { data: { id: 'cons-row', response: 'approved' }, error: null },     // consultation update
      { data: null, error: null },                                         // condition auto-resolve update
      { data: l2Cycle, error: null }                                       // G5 hook cycle fetch (not L1 → done)
    ];
    const r = await record_consultation_response(
      { gate_record_id: GATE, response: 'approved' }, CONS);
    assert.equal(r.success, true);
    assert.equal(queue.length, 0, 'auto-resolve query consumed');
  });
});

describe('G6 — condition auth', () => {
  test('non-approver non-trio non-admin cannot set a condition', async () => {
    queue = [
      { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'go_to_build', approver_user_id: APPROVER }, error: null },
      { data: { assigned_dcs_user_id: OTHER, assigned_epo_user_id: OTHER, assigned_dol_user_id: OTHER }, error: null },
      { data: { is_admin: false, is_super_admin: false }, error: null }
    ];
    const r = await conditionTools.add_gate_condition(
      { gate_record_id: GATE, type: 'general', text: 'Fix the rollback plan' }, 'stranger-uuid');
    assert.equal(r.success, false);
    assert.match(r.error, /approver|trio|Admin/);
  });

  test("the gate's approver can set a condition directly", async () => {
    queue = [
      { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'go_to_build', approver_user_id: APPROVER }, error: null },
      { data: { condition_id: 'cond1', gate_record_id: GATE, condition_type: 'general', condition_status: 'open' }, error: null },
      { data: null, error: null }                                          // event log
    ];
    const r = await conditionTools.add_gate_condition(
      { gate_record_id: GATE, type: 'general', text: 'Nearly there — fix these' }, APPROVER);
    assert.equal(r.success, true);
  });

  test("the gate's approver can resolve another setter's condition (G6 extension)", async () => {
    queue = [
      { data: { condition_id: 'cond1', gate_record_id: GATE, condition_type: 'general', condition_text: 'x', condition_status: 'open', set_by_user_id: OTHER }, error: null },
      { data: { approver_user_id: APPROVER }, error: null },               // gate approver check
      { data: { condition_id: 'cond1', condition_status: 'resolved' }, error: null }, // resolve update
      { data: { delivery_cycle_id: CYC, gate_name: 'go_to_build' }, error: null },    // gate for event
      { data: null, error: null }                                          // event
    ];
    const r = await conditionTools.resolve_gate_condition({ condition_id: 'cond1', note: 'done' }, APPROVER);
    assert.equal(r.success, true);
    assert.equal(r.data.condition_status, 'resolved');
  });
});

describe('G6 — submission note opens the thread (source assertion)', () => {
  test('submit tool writes gate_thread_messages when a note is present', () => {
    const fs = require('node:fs');
    const src = fs.readFileSync(require.resolve('../src/tools/submit_gate_for_approval.js'), 'utf8');
    assert.match(src, /gate_thread_messages/);
    assert.match(src, /submission_note/);
  });
});
