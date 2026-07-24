// contractG10-cancellation.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract G10, D-566/D-568).
// Severity-based cancel authority, request-cancel (reason required),
// quarter deploy-goal math. FIFO-queue mock per the established technique.

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
  gte:    () => chain,
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

const { resolveCancelAuthority } = require('../src/tools/helpers/cancel-authority');
const { cancel_delivery_cycle } = require('../src/tools/cancel_delivery_cycle');
const { request_cancel } = require('../src/tools/cancel_requests');
const { quarterBounds, computeGoal } = require('../src/tools/quarter_deploy_goal');

const DCS = 'dcs-uuid', APPROVER = 'appr-uuid', OUT = 'out-uuid', CYC = 'c1';
const cycleRow = (over = {}) => ({
  delivery_cycle_id: CYC, cycle_title: 'T', current_lifecycle_stage: 'BUILD',
  pre_hold_lifecycle_stage: null, division_id: 'div',
  assigned_dcs_user_id: DCS, assigned_epo_user_id: null, assigned_dol_user_id: null,
  baseline_level: 2, set_level: null, oversight_user_id: null,
  ...over
});

beforeEach(() => { queue = []; });

describe('resolveCancelAuthority (D-566)', () => {
  test('pre-Brief-Review → trio authority regardless of level', async () => {
    queue = [
      { data: [{ gate_record_id: 'g1', gate_name: 'brief_review', gate_status: 'pending', approver_user_id: null }], error: null }
    ];
    const a = await resolveCancelAuthority(cycleRow({ baseline_level: 3 }));
    assert.equal(a.mode, 'trio');
  });

  test('post-Brief-Review L1 → trio authority', async () => {
    queue = [
      { data: [{ gate_record_id: 'g1', gate_name: 'brief_review', gate_status: 'approved', approver_user_id: null }], error: null }
    ];
    const a = await resolveCancelAuthority(cycleRow({ baseline_level: 1 }));
    assert.equal(a.mode, 'trio');
  });

  test('post-Brief-Review L2 with awaiting gate → the stamped approver (AC #1)', async () => {
    queue = [
      { data: [
          { gate_record_id: 'g1', gate_name: 'brief_review', gate_status: 'approved', approver_user_id: 'x' },
          { gate_record_id: 'g2', gate_name: 'go_to_build', gate_status: 'awaiting_approval', approver_user_id: APPROVER }
        ], error: null }
    ];
    const a = await resolveCancelAuthority(cycleRow());
    assert.equal(a.mode, 'approver');
    assert.equal(a.authority_user_id, APPROVER);
  });
});

describe('cancel_delivery_cycle — authority enforcement (D-566)', () => {
  test('trio member blocked at L2 post-Brief-Review; pointed to Request Cancel (AC #1)', async () => {
    queue = [
      { data: cycleRow(), error: null },                                    // cycle
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: false }, error: null }, // caller
      { data: [
          { gate_record_id: 'g1', gate_name: 'brief_review', gate_status: 'approved', approver_user_id: 'x' },
          { gate_record_id: 'g2', gate_name: 'go_to_build', gate_status: 'awaiting_approval', approver_user_id: APPROVER }
        ], error: null }                                                    // gates (authority)
    ];
    const r = await cancel_delivery_cycle({ delivery_cycle_id: CYC }, DCS);
    assert.equal(r.success, false);
    assert.match(r.error, /Request Cancel/);
  });

  test('the resolved approver executes at L2 post-Brief-Review (AC #1)', async () => {
    queue = [
      { data: cycleRow(), error: null },
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: false }, error: null },
      { data: [
          { gate_record_id: 'g1', gate_name: 'brief_review', gate_status: 'approved', approver_user_id: 'x' },
          { gate_record_id: 'g2', gate_name: 'go_to_build', gate_status: 'awaiting_approval', approver_user_id: APPROVER }
        ], error: null },
      { data: { ...cycleRow(), current_lifecycle_stage: 'CANCELLED' }, error: null }, // cycle update
      { data: null, error: null },                                          // event
      { data: null, error: null },                                          // close open requests
      { data: [], error: null }                                             // participation holders (none)
    ];
    const r = await cancel_delivery_cycle({ delivery_cycle_id: CYC }, APPROVER);
    assert.equal(r.success, true);
    assert.equal(r.data.current_lifecycle_stage, 'CANCELLED');
  });
});

describe('request_cancel (D-566, AC #2)', () => {
  test('reason required', async () => {
    const r = await request_cancel({ delivery_cycle_id: CYC }, DCS);
    assert.equal(r.success, false);
    assert.match(r.error, /reason/i);
  });

  test('non-trio cannot request', async () => {
    queue = [ { data: cycleRow(), error: null } ];
    const r = await request_cancel({ delivery_cycle_id: CYC, reason: 'dead work' }, OUT);
    assert.equal(r.success, false);
    assert.match(r.error, /trio action/);
  });

  test('trio request routes to the resolved approver', async () => {
    queue = [
      { data: cycleRow(), error: null },                                    // cycle
      { data: null, error: null },                                          // no open request
      { data: [
          { gate_record_id: 'g1', gate_name: 'brief_review', gate_status: 'approved', approver_user_id: 'x' },
          { gate_record_id: 'g2', gate_name: 'go_to_build', gate_status: 'awaiting_approval', approver_user_id: APPROVER }
        ], error: null },                                                   // authority gates
      { data: { request_id: 'req1', delivery_cycle_id: CYC, authority_user_id: APPROVER, reason: 'dead work' }, error: null }, // insert
      { data: null, error: null },                                          // event
      { data: [], error: null }                                             // recipients (no emails)
    ];
    const r = await request_cancel({ delivery_cycle_id: CYC, reason: 'dead work' }, DCS);
    assert.equal(r.success, true);
    assert.equal(r.data.authority_user_id, APPROVER);
    assert.equal(queue.length, 0);
  });
});

describe('quarter deploy-goal math (D-568 family C)', () => {
  test('quarterBounds names the quarter and bounds it', () => {
    const b = quarterBounds(new Date(Date.UTC(2026, 6, 23))); // 2026-07-23
    assert.equal(b.label, 'Q3 2026');
    assert.equal(b.startIso, '2026-07-01');
    assert.equal(b.endIso, '2026-10-01');
    assert.ok(b.weeksRemaining >= 1);
  });

  test('computeGoal: done/remaining over the deploy chain; off-quarter targets excluded', async () => {
    const bounds = quarterBounds(new Date(Date.UTC(2026, 6, 23)));
    queue = [
      { data: [
          { delivery_cycle_id: 'a', gate_name: 'go_to_deploy', target_date: '2026-08-15' },  // in quarter
          { delivery_cycle_id: 'b', gate_name: 'go_to_deploy', target_date: '2026-11-01' }   // next quarter
        ], error: null },
      { data: [
          { delivery_cycle_id: 'a', gate_name: 'brief_review', gate_status: 'approved', approver_decision_at: new Date().toISOString() },
          { delivery_cycle_id: 'a', gate_name: 'go_to_build',  gate_status: 'awaiting_approval', approver_decision_at: null },
          { delivery_cycle_id: 'a', gate_name: 'go_to_deploy', gate_status: 'not_started', approver_decision_at: null }
        ], error: null },
      { data: [], error: null }                                             // target-change events
    ];
    const g = await computeGoal(['a', 'b'], bounds);
    assert.equal(g.initiative_count, 1, 'only the in-quarter target counts');
    assert.equal(g.gates_done, 1);
    assert.equal(g.gates_remaining, 2);
    assert.ok(g.weekly_pace > 0);
    assert.ok(g.needed_pace > 0);
  });
});
