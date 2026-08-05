// contract0804-deploy-skip-override.test.js
// Pathways OI Trust — delivery-cycle-mcp (CC-0804-10, 2026-08-04).
//
// D-450 makes the Deploy gate unskippable. submit_gate_for_approval has relaxed
// that for Phil since 2026-07-24 and says so explicitly; confirm_gate_skip —
// the call that actually performs the skip — never honoured it. The result was
// a dead end: submit offered the skip interstitial, the user accepted, and the
// delegate refused with nothing explaining the contradiction.
//
// The existing coverage in tools.test.js is source-text only (it greps for the
// error string), so it passed throughout and could never have caught this. These
// are behavioural.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

let queue = [];
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }
const chain = {
  from: () => chain, select: () => chain, insert: () => chain, update: () => chain,
  upsert: () => chain, delete: () => chain, eq: () => chain, neq: () => chain,
  is: () => chain, in: () => chain, not: () => chain, or: () => chain,
  gte: () => chain, order: () => chain, limit: () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};
chain.functions = { invoke: async () => ({ data: null, error: null }) };

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

// isPhil is the authority check the fix relies on — stubbed so the test controls
// who the caller is, rather than depending on a seeded Phil row.
let callerIsPhil = false;
const philPath = require.resolve('../src/tools/helpers/phil');
require.cache[philPath] = {
  id: philPath, filename: philPath, loaded: true,
  exports: {
    isPhil:  async () => callerIsPhil,
    getPhil: async () => (callerIsPhil ? { id: 'phil-uuid' } : null)
  }
};

// Stub the submit delegate: confirm_gate_skip re-invokes it after skipping, and
// this test is about whether it gets that far at all.
let submitCalledWith = null;
const submitPath = require.resolve('../src/tools/submit_gate_for_approval');
require.cache[submitPath] = {
  id: submitPath, filename: submitPath, loaded: true,
  exports: {
    submit_gate_for_approval: async (params, caller) => {
      submitCalledWith = { params, caller };
      return { success: true, data: { gate_status: 'awaiting_approval' } };
    }
  }
};

const { confirm_gate_skip } = require('../src/tools/confirm_gate_skip');

const CYC = 'cycle-uuid', PHIL = 'phil-uuid', TRIO = 'dcs-u';

beforeEach(() => { queue = []; callerIsPhil = false; submitCalledWith = null; });

describe('D-450 deploy-skip block in confirm_gate_skip (CC-0804-10)', () => {

  test('a NON-Phil caller is still refused — D-450 holds by default', async () => {
    const r = await confirm_gate_skip({
      delivery_cycle_id: CYC,
      gates_to_skip:     ['brief_review', 'go_to_build', 'go_to_deploy'],
      submitted_gate:    'close_review'
    }, TRIO);

    assert.equal(r.success, false);
    assert.equal(r.error, 'DEPLOY_GATE_SKIP_BLOCKED');
    assert.equal(submitCalledWith, null, 'never reaches the submit delegate');
  });

  test('phil_override WITHOUT actually being Phil is refused', async () => {
    // The parameter is not trusted — the caller is re-verified, exactly as
    // submit_gate_for_approval does. A forged flag must not open the block.
    callerIsPhil = false;
    const r = await confirm_gate_skip({
      delivery_cycle_id: CYC,
      gates_to_skip:     ['go_to_deploy'],
      submitted_gate:    'close_review',
      phil_override:     true
    }, TRIO);

    assert.equal(r.success, false);
    assert.equal(r.error, 'DEPLOY_GATE_SKIP_BLOCKED');
  });

  test('Phil WITH the override passes the deploy block', async () => {
    callerIsPhil = true;
    queue = [
      // cycle fetch for the authority check
      { data: { delivery_cycle_id: CYC, cycle_title: 'EVBV Revalidation',
                assigned_dcs_user_id: TRIO, assigned_epo_user_id: null,
                assigned_dol_user_id: null }, error: null }
    ];

    const r = await confirm_gate_skip({
      delivery_cycle_id: CYC,
      gates_to_skip:     ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release'],
      submitted_gate:    'close_review',
      phil_override:     true
    }, PHIL);

    assert.notEqual(r.error, 'DEPLOY_GATE_SKIP_BLOCKED',
      'the block must not fire for Phil — submit_gate_for_approval already relaxes it');
  });

  test('Phil without the override flag is still blocked', async () => {
    // Being Phil is not enough; the override must be deliberately armed, so an
    // ordinary Phil skip still meets D-450.
    callerIsPhil = true;
    const r = await confirm_gate_skip({
      delivery_cycle_id: CYC,
      gates_to_skip:     ['go_to_deploy'],
      submitted_gate:    'close_review'
    }, PHIL);

    assert.equal(r.success, false);
    assert.equal(r.error, 'DEPLOY_GATE_SKIP_BLOCKED');
  });

  test('the refusal message names the way through (D-140)', async () => {
    const r = await confirm_gate_skip({
      delivery_cycle_id: CYC,
      gates_to_skip:     ['go_to_deploy'],
      submitted_gate:    'close_review'
    }, TRIO);

    assert.match(r.data.message, /backdat/i,
      'a blocked action states what would unblock it, not just that it is blocked');
  });
});
