// contract40-advance-epo.test.js — Contract 40 follow-on (CC-40-I)
// Stage advance: the former hard workstream-presence requirement is replaced by
// an EPO floor. A null Workstream no longer blocks (D-165/Part 3b alignment);
// an assigned EPO is required to enter Build or any later stage (Phil 2026-07-28).

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

let queue = [];
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }
const chain = {
  from: () => chain, select: () => chain, insert: () => chain, update: () => chain,
  eq: () => chain, is: () => chain, in: () => chain, order: () => chain, limit: () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};
const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const { advance_cycle_stage } = require('../src/tools/advance_cycle_stage');
const CYC = 'c1', ME = 'me-uuid';

beforeEach(() => { queue = []; });

describe('CC-40-I: stage advance EPO floor + null-workstream unblock', () => {

  test('null Workstream no longer blocks a pre-Build advance (DESIGN→SPEC)', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', current_lifecycle_stage: 'DESIGN',
                workstream_id: null, assigned_epo_user_id: null }, error: null },   // cycle
      { data: { delivery_cycle_id: CYC, current_lifecycle_stage: 'SPEC' }, error: null } // update
    ];
    const r = await advance_cycle_stage({ delivery_cycle_id: CYC }, ME);
    assert.equal(r.success, true);
    assert.equal(r.data.current_lifecycle_stage, 'SPEC');
  });

  test('advancing into Build with no EPO is blocked (SPEC→BUILD)', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', current_lifecycle_stage: 'SPEC',
                workstream_id: null, assigned_epo_user_id: null }, error: null }   // cycle
    ];
    const r = await advance_cycle_stage({ delivery_cycle_id: CYC }, ME);
    assert.equal(r.success, false);
    assert.match(r.error, /Engineering Product Owner/);
    assert.match(r.error, /enters BUILD/);
  });

  test('advancing into Build with an EPO + approved gate succeeds', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', current_lifecycle_stage: 'SPEC',
                workstream_id: null, assigned_epo_user_id: 'epo-1' }, error: null }, // cycle
      { data: { gate_status: 'approved' }, error: null },                            // go_to_build gate
      { data: { delivery_cycle_id: CYC, current_lifecycle_stage: 'BUILD' }, error: null } // update
    ];
    const r = await advance_cycle_stage({ delivery_cycle_id: CYC }, ME);
    assert.equal(r.success, true);
    assert.equal(r.data.current_lifecycle_stage, 'BUILD');
  });

  test('assigned but inactive Workstream still blocks (ARCH-23 retained)', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', current_lifecycle_stage: 'DESIGN',
                workstream_id: 'ws-1', assigned_epo_user_id: null }, error: null },  // cycle (SPEC target, no EPO needed)
      { data: { workstream_name: 'Payments', active_status: false }, error: null }   // workstream inactive
    ];
    const r = await advance_cycle_stage({ delivery_cycle_id: CYC }, ME);
    assert.equal(r.success, false);
    assert.match(r.error, /workstream is inactive/);
  });
});
