// contract40-reassign.test.js — Contract 40 follow-on (CC-40-O / CC-40-P)
// Approver reassignment (oversight re-routes in-flight gates) + All Pending
// Gates Division-Leader scope. FIFO-mocked happy path for the reroute; source
// assertions for the invariants (the full multi-query flows are UAT-verified).

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

let queue = [];
const writes = [];
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }
const chain = {
  from: (t) => { chain._t = t; return chain; },
  select: () => chain, insert: (r) => { writes.push({ table: chain._t, op: 'insert', row: r }); return chain; },
  update: (r) => { writes.push({ table: chain._t, op: 'update', row: r }); return chain; },
  eq: () => chain, is: () => chain, in: () => chain, not: () => chain, or: () => chain, order: () => chain, limit: () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};
const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const gov = require('../src/tools/governance_level');

const CYC = 'c1', DL = 'dl-uuid', KARLY = 'karly-uuid', SABRINA = 'sabrina-uuid', GATE = 'g-await';

beforeEach(() => { queue = []; writes.length = 0; });

describe('CC-40-O: set_oversight re-routes the in-flight gate', () => {
  test('reassigning to Karly updates the awaiting gate approver + posts to the thread', async () => {
    queue = [
      // loadCycleWithLeadershipCheck: cycle, caller, division(owner=DL)
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', division_id: 'd1', baseline_level: 2, set_level: null, oversight_user_id: null, oversight_set_by_user_id: null }, error: null },
      { data: { id: DL, is_active: true, is_super_admin: false, is_initiative_executive: false }, error: null },
      { data: { id: 'd1', owner_user_id: DL }, error: null },
      // overseer (Karly)
      { data: { id: KARLY, display_name: 'Karly Marnell', is_active: true }, error: null },
      // update oversight
      { data: { delivery_cycle_id: CYC, oversight_user_id: KARLY, oversight_set_via: 'manual', oversight_set_by_user_id: DL }, error: null },
      // oversight_set event insert
      { data: null, error: null },
      // rerouteAwaitingGates: awaiting gates (one, currently Sabrina)
      { data: [{ gate_record_id: GATE, gate_name: 'go_to_build', approver_user_id: SABRINA }], error: null }
      // subsequent update/insert/insert fall through to the empty fallback
    ];
    const r = await gov.set_oversight({ delivery_cycle_id: CYC, user_id: KARLY, set_via: 'manual' }, DL);
    assert.equal(r.success, true);
    assert.equal(r.data.rerouted_gate_count, 1);
    // The awaiting gate's approver_user_id was rewritten to Karly.
    const gateUpdate = writes.find(w => w.table === 'gate_records' && w.op === 'update' && w.row.approver_user_id === KARLY);
    assert.ok(gateUpdate, 'gate_records.approver_user_id updated to the new approver');
    // A gate-thread post so the trio + displaced approver learn (in-app).
    const threadPost = writes.find(w => w.table === 'gate_thread_messages');
    assert.ok(threadPost, 'gate-thread post created');
    assert.match(threadPost.row.message_text, /Karly Marnell/);
  });
});

describe('CC-40-P: All Pending Gates Division-Leader scope (source)', () => {
  const src = fs.readFileSync(require.resolve('../src/tools/initiative_executive.js'), 'utf8');
  test('DL sees their owned divisions; IE/Admin/Phil see all', () => {
    assert.match(src, /owner_user_id.*caller_user_id|eq\('owner_user_id', caller_user_id\)/);
    assert.match(src, /isWide \|\| ownedDivisionIds\.has/);
    assert.match(src, /is_initiative_executive === true \|\| caller\.is_super_admin === true \|\| caller\.is_admin === true/);
  });
});
