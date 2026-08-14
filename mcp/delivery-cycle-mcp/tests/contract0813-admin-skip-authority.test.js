// contract0813-admin-skip-authority.test.js
// Pathways OI Trust — delivery-cycle-mcp (CC-0813-01, 2026-08-13).
//
// confirm_gate_skip refused any caller who was not the Initiative's assigned
// DCS/EPO/DOL, under a comment claiming "D-447 — TRIO only". D-447 defines the
// skipped gate state, not who may confirm one, and the Contract 28 spec never
// mentions Admins. The governing rule is D-369 — any Admin may act on behalf of
// an Initiative — which submit_gate_for_approval implements. So submit let an
// Admin through and the delegate refused: another dead end of the CC-0804-10
// shape.
//
// Pinned here: an Admin passes, a genuine trio member still passes, and a
// caller who is neither is still refused. The last one matters most — this is a
// widening, and the boundary has to stay somewhere.

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

const philPath = require.resolve('../src/tools/helpers/phil');
require.cache[philPath] = {
  id: philPath, filename: philPath, loaded: true,
  exports: { isPhil: async () => false, getPhil: async () => null }
};

// Stub the submit delegate — reaching it at all is the pass condition.
let submitCalled = false;
const submitPath = require.resolve('../src/tools/submit_gate_for_approval');
require.cache[submitPath] = {
  id: submitPath, filename: submitPath, loaded: true,
  exports: {
    submit_gate_for_approval: async () => {
      submitCalled = true;
      return { success: true, data: { gate_status: 'awaiting_approval' } };
    }
  }
};

const { confirm_gate_skip } = require('../src/tools/confirm_gate_skip');

const CYC = 'cycle-uuid', ADMIN = 'admin-u', DCS = 'dcs-u', STRANGER = 'nobody-u';

// FIFO order inside the tool: cycle, then caller. Unchanged by CC-0813-01.
const cycleRow  = { data: { delivery_cycle_id: CYC, cycle_title: 'Patient Portal',
                            assigned_dcs_user_id: DCS, assigned_epo_user_id: null,
                            assigned_dol_user_id: null }, error: null };
const callerRow = (is_admin, name) => ({ data: { is_admin, display_name: name }, error: null });

// brief_review only — go_to_deploy would trip the separate D-450 block first.
const params = { delivery_cycle_id: CYC, gates_to_skip: ['brief_review'], submitted_gate: 'go_to_build' };

beforeEach(() => { queue = []; submitCalled = false; });

describe('confirm_gate_skip authority (CC-0813-01 / D-369)', () => {

  // These two assert the authority branch only. Per Rule 37 the shallow mock
  // cannot sequence the gate-update queries that follow, so "did it pass the
  // authority check" is the honest assertion — not "did the whole skip run".
  test('an Admin who is NOT trio passes the authority check — D-369 on-behalf', async () => {
    queue = [cycleRow, callerRow(true, 'Phil Dodds')];
    const r = await confirm_gate_skip(params, ADMIN);

    assert.ok(!/Only an Admin or the assigned/.test(String(r.error ?? '')),
      'the authority check must not refuse an Admin');
  });

  test('a genuine trio member still passes — nothing removed', async () => {
    queue = [cycleRow, callerRow(false, 'Assigned DCS')];
    const r = await confirm_gate_skip(params, DCS);

    assert.ok(!/Only an Admin or the assigned/.test(String(r.error ?? '')));
  });

  test('neither Admin nor trio is STILL refused — the boundary holds', async () => {
    queue = [cycleRow, callerRow(false, 'Some Consulted Party')];
    const r = await confirm_gate_skip(params, STRANGER);

    assert.equal(r.success, false);
    assert.match(r.error, /Only an Admin or the assigned/);
    assert.equal(submitCalled, false, 'never reaches the submit delegate');
  });

  test('the refusal names the way through (D-140) and drops the invented rule', async () => {
    queue = [cycleRow, callerRow(false, 'Some Consulted Party')];
    const r = await confirm_gate_skip(params, STRANGER);

    assert.match(r.error, /Ask one of them to confirm/,
      'a blocked action states what would unblock it');
    assert.ok(!/cannot confirm skips on behalf/.test(r.error),
      'the sentence asserting a rule no decision contains must be gone');
  });
});
