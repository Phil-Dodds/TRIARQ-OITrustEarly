// contractG7-waiting-on.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract G7, D-565 items 3–4).
// THE single waiting-on computation: state priority (conditions → L1 trio →
// L1 consultation → approver-with-days), identical strings for every surface.
// FIFO-queue mock per the established technique.

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
const dbPath = require.resolve('../src/db');
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain }
};

const { computeWaitingOnBatch } = require('../src/lib/waiting-on');

const CYC = 'c1', GATE = 'g1';
const APPROVER = 'appr-uuid', DCS = 'dcs-uuid', EPO = 'epo-uuid', DOL = 'dol-uuid', CONS = 'cons-uuid';
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

const l2Cycle = {
  delivery_cycle_id: CYC, assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO,
  assigned_dol_user_id: DOL, baseline_level: 2, set_level: null
};
const l1Cycle = { ...l2Cycle, baseline_level: 1 };

beforeEach(() => { queue = []; });

describe('computeWaitingOnBatch (G7 AC #1/#2)', () => {
  test('non-awaiting gates produce nothing', async () => {
    const r = await computeWaitingOnBatch(
      [{ gate_record_id: GATE, delivery_cycle_id: CYC, gate_status: 'approved' }],
      { [CYC]: l2Cycle });
    assert.deepEqual(r, {});
  });

  test('approver pending with days (L2)', async () => {
    queue = [
      { data: [], error: null },                                           // conditions
      { data: [], error: null },                                           // consultations
      { data: [], error: null },                                           // approvals
      { data: [{ id: APPROVER, display_name: 'Jane Approver' },
               { id: DCS, display_name: 'D' }, { id: EPO, display_name: 'E' }, { id: DOL, display_name: 'L' }], error: null }
    ];
    const r = await computeWaitingOnBatch(
      [{ gate_record_id: GATE, delivery_cycle_id: CYC, gate_status: 'awaiting_approval',
         approver_user_id: APPROVER, submitted_at: daysAgo(3) }],
      { [CYC]: l2Cycle });
    assert.equal(r[GATE].state, 'approver_pending');
    assert.equal(r[GATE].line, 'Waiting on: approver — Jane Approver (3 days)');
    assert.equal(r[GATE].days_waiting, 3);
  });

  test('open consultation_required condition names the target party (S-B5)', async () => {
    queue = [
      { data: [{ gate_record_id: GATE, condition_type: 'consultation_required',
                 condition_status: 'open', target_consultation_id: 'cons-row' }], error: null },
      { data: [{ id: 'cons-row', gate_record_id: GATE, consulted_user_id: CONS, response: 'pending' }], error: null },
      { data: [], error: null },
      { data: [{ id: CONS, display_name: 'Security Sam' },
               { id: APPROVER, display_name: 'Jane' },
               { id: DCS, display_name: 'D' }, { id: EPO, display_name: 'E' }, { id: DOL, display_name: 'L' }], error: null }
    ];
    const r = await computeWaitingOnBatch(
      [{ gate_record_id: GATE, delivery_cycle_id: CYC, gate_status: 'awaiting_approval',
         approver_user_id: APPROVER, submitted_at: daysAgo(1) }],
      { [CYC]: l2Cycle });
    assert.equal(r[GATE].state, 'condition_open');
    assert.equal(r[GATE].line, 'Waiting on: consultation (condition) — Security Sam');
  });

  test('generic open conditions dominate with a count', async () => {
    queue = [
      { data: [
          { gate_record_id: GATE, condition_type: 'general', condition_status: 'open', target_consultation_id: null },
          { gate_record_id: GATE, condition_type: 'general', condition_status: 'open', target_consultation_id: null }
        ], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [{ id: APPROVER, display_name: 'Jane' },
               { id: DCS, display_name: 'D' }, { id: EPO, display_name: 'E' }, { id: DOL, display_name: 'L' }], error: null }
    ];
    const r = await computeWaitingOnBatch(
      [{ gate_record_id: GATE, delivery_cycle_id: CYC, gate_status: 'awaiting_approval',
         approver_user_id: APPROVER, submitted_at: daysAgo(0) }],
      { [CYC]: l2Cycle });
    assert.equal(r[GATE].line, 'Waiting on: 2 open conditions');
  });

  test('L1: pending trio names, then consultation party (S-A1/S-A3)', async () => {
    queue = [
      { data: [], error: null },                                           // conditions
      { data: [{ id: 'x', gate_record_id: GATE, consulted_user_id: CONS, response: 'pending' }], error: null },
      { data: [
          { gate_record_id: GATE, approver_user_id: DCS, approval_type: 'trio_member' }
        ], error: null },                                                  // approvals
      { data: [
          { id: DCS, display_name: 'Dana' }, { id: EPO, display_name: 'Evan' },
          { id: DOL, display_name: 'Lee' }, { id: CONS, display_name: 'Security Sam' }
        ], error: null }
    ];
    const r = await computeWaitingOnBatch(
      [{ gate_record_id: GATE, delivery_cycle_id: CYC, gate_status: 'awaiting_approval',
         approver_user_id: null, submitted_at: daysAgo(1) }],
      { [CYC]: l1Cycle });
    assert.equal(r[GATE].state, 'trio_pending');
    assert.equal(r[GATE].line, 'Waiting on: trio — Evan, Lee');
  });

  test('L1: all trio approved → consultation pending names the party (S-A3)', async () => {
    queue = [
      { data: [], error: null },
      { data: [{ id: 'x', gate_record_id: GATE, consulted_user_id: CONS, response: 'pending' }], error: null },
      { data: [
          { gate_record_id: GATE, approver_user_id: DCS, approval_type: 'trio_member' },
          { gate_record_id: GATE, approver_user_id: EPO, approval_type: 'trio_member' },
          { gate_record_id: GATE, approver_user_id: DOL, approval_type: 'trio_member' }
        ], error: null },
      { data: [
          { id: DCS, display_name: 'Dana' }, { id: EPO, display_name: 'Evan' },
          { id: DOL, display_name: 'Lee' }, { id: CONS, display_name: 'Security Sam' }
        ], error: null }
    ];
    const r = await computeWaitingOnBatch(
      [{ gate_record_id: GATE, delivery_cycle_id: CYC, gate_status: 'awaiting_approval',
         approver_user_id: null, submitted_at: daysAgo(2) }],
      { [CYC]: l1Cycle });
    assert.equal(r[GATE].state, 'consultation_pending');
    assert.equal(r[GATE].line, 'Waiting on: consultation — Security Sam');
  });
});
