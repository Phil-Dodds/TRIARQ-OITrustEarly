// contract0806-regress-complete.test.js
// Pathways OI Trust — delivery-cycle-mcp (CC-0806-01, 2026-08-06).
//
// COMPLETE was unregressable because the guard tested TERMINAL_STAGES —
// ['COMPLETE','CANCELLED'] — a list that exists to describe WIP exclusion, not
// reversibility. Once an Initiative closed, nothing in the application could
// reopen it, and Force-Close made that state reachable in two clicks.
//
// CANCELLED must STAY blocked: it has its own exit (uncancel_delivery_cycle)
// which restores the pre-cancel stage. Regressing it one step would instead
// drop it at an unrelated lifecycle position. That asymmetry is the point of
// this change, so both halves are pinned.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

let queue = [];
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }
const chain = {
  from: () => chain, select: () => chain, insert: () => chain, update: () => chain,
  delete: () => chain, eq: () => chain, neq: () => chain, is: () => chain,
  in: () => chain, not: () => chain, or: () => chain, gte: () => chain,
  order: () => chain, limit: () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};
const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const { reverse_cycle_stage } = require('../src/tools/reverse_cycle_stage');
const { prevStage, gatesResetOnRegressionTo } = require('../src/lifecycle');

const CYC = 'cycle-uuid', USER = 'user-uuid';
const cycleAt = (stage) => ({
  data: { delivery_cycle_id: CYC, cycle_title: 'EVBV Revalidation',
          current_lifecycle_stage: stage }, error: null });

beforeEach(() => { queue = []; });

describe('lifecycle arithmetic for COMPLETE (CC-0806-01)', () => {

  test('the stage before COMPLETE is OUTCOME — the target is well-defined', () => {
    assert.equal(prevStage('COMPLETE'), 'OUTCOME');
  });

  test('regressing COMPLETE → OUTCOME resets close_review, and only that', () => {
    // Un-completing means the Close Review gate returns to pending. Nothing
    // earlier should be disturbed.
    assert.deepEqual(gatesResetOnRegressionTo('OUTCOME', 'COMPLETE'), ['close_review']);
  });
});

describe('reverse_cycle_stage guards (CC-0806-01)', () => {

  test('COMPLETE is regressable — previews OUTCOME rather than refusing', async () => {
    queue = [cycleAt('COMPLETE')];
    const r = await reverse_cycle_stage({ delivery_cycle_id: CYC }, USER);

    // Assert the specific old refusal is gone, rather than merely "not that
    // string" — the guard must not catch COMPLETE at all.
    assert.ok(!/cannot be regressed/.test(String(r.error ?? '')),
      'the TERMINAL_STAGES guard must no longer catch COMPLETE');
    assert.ok(!/CANCELLED/.test(String(r.error ?? '')),
      'and it must not fall into the CANCELLED branch either');
  });

  test('CANCELLED is STILL blocked, and points at Un-cancel', async () => {
    queue = [cycleAt('CANCELLED')];
    const r = await reverse_cycle_stage({ delivery_cycle_id: CYC }, USER);

    assert.equal(r.success, false);
    assert.match(r.error, /CANCELLED/);
    assert.match(r.error, /Un-cancel/,
      'a blocked action names the way through (D-140)');
  });

  test('ON_HOLD is still blocked, and points at resume', async () => {
    queue = [cycleAt('ON_HOLD')];
    const r = await reverse_cycle_stage({ delivery_cycle_id: CYC }, USER);

    assert.equal(r.success, false);
    assert.match(r.error, /resume_cycle_from_hold/);
  });

  test('BRIEF is still blocked — nothing precedes it', async () => {
    queue = [cycleAt('BRIEF')];
    const r = await reverse_cycle_stage({ delivery_cycle_id: CYC }, USER);

    assert.equal(r.success, false);
  });
});
