// contract40-eligible-approvers.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 40 follow-on).
// list_eligible_approvers: candidate pool for the manual approver picker.
// Supabase singleton mocked via require.cache injection (FIFO response queue).

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
  eq:     () => chain,
  is:     () => chain,
  in:     () => chain,
  not:    () => chain,
  order:  () => chain,
  limit:  () => chain,
  rpc:    async () => nextResp({ data: null, error: null }),
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const { list_eligible_approvers } = require('../src/tools/list_eligible_approvers');

const CALLER = 'caller-uuid';
const CYCLE  = 'cycle-uuid';
const DIV    = 'div-uuid';

beforeEach(() => { queue = []; });

describe('list_eligible_approvers', () => {
  test('error — missing delivery_cycle_id (no DB call)', async () => {
    const r = await list_eligible_approvers({}, CALLER);
    assert.equal(r.success, false);
  });

  test('error — initiative not found', async () => {
    queue = [{ data: null, error: null }];   // cycle maybeSingle -> none
    const r = await list_eligible_approvers({ delivery_cycle_id: CYCLE }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /not found/);
  });

  test('error — caller not leadership for the cycle', async () => {
    queue = [
      { data: { id: CYCLE, division_id: DIV }, error: null },  // cycle
      { data: { id: CALLER, is_super_admin: false, is_initiative_executive: false }, error: null }, // leadership user row
      { data: { id: DIV, owner_user_id: 'someone-else', parent_division_id: null }, error: null }   // division walk (not caller)
    ];
    const r = await list_eligible_approvers({ delivery_cycle_id: CYCLE }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /permission/);
  });

  test('happy path — pool = division leader + approver + IE, deduped and sorted', async () => {
    queue = [
      { data: { id: CYCLE, division_id: DIV }, error: null },  // cycle lookup
      // isLeadershipForCycle: super_admin -> true immediately (no walk here)
      { data: { id: CALLER, is_super_admin: true, is_initiative_executive: false }, error: null },
      // division walk depth 0
      { data: { id: DIV, owner_user_id: 'leader-1', parent_division_id: null }, error: null },
      // division_approvers rows
      { data: [{ user_id: 'appr-1' }], error: null },
      // IE rows
      { data: [{ id: 'ie-1' }], error: null },
      // users batch resolve
      { data: [
        { id: 'leader-1', display_name: 'Bianca', is_active: true },
        { id: 'appr-1',   display_name: 'Amir',   is_active: true },
        { id: 'ie-1',     display_name: 'Zoe',    is_active: true }
      ], error: null }
    ];
    const r = await list_eligible_approvers({ delivery_cycle_id: CYCLE }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.length, 3);
    // sorted by display_name
    assert.deepEqual(r.data.map(u => u.display_name), ['Amir', 'Bianca', 'Zoe']);
    const leader = r.data.find(u => u.user_id === 'leader-1');
    assert.ok(leader.sources.includes('division_leader'));
    const ie = r.data.find(u => u.user_id === 'ie-1');
    assert.ok(ie.sources.includes('initiative_executive'));
  });
});
