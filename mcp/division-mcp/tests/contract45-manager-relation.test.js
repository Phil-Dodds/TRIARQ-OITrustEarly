// contract45-manager-relation.test.js
// Pathways OI Trust — division-mcp (Contract 45, D-638).
//
// The manager relation is a self-referencing FK, which Postgres will happily
// let you close into a loop (A→B→A). Every consumer of the relation walks the
// chain, so a loop is not a cosmetic data problem — it is a hang. The guard is
// application-layer by necessity, which makes it worth testing properly.
//
// Supabase singleton mocked via require.cache injection; FIFO response queue.

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
  order:  () => chain,
  limit:  () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const { update_user } = require('../src/tools/update_user');

const ADMIN = 'admin-uuid';
const ALICE = 'alice-uuid';   // the user being edited
const BOB   = 'bob-uuid';
const CAROL = 'carol-uuid';

const adminOk  = { data: { is_admin: true,  is_super_admin: false, is_active: true }, error: null };
const notAdmin = { data: { is_admin: false, is_super_admin: false, is_active: true }, error: null };
const aliceExists = { data: { id: ALICE }, error: null };

/** A live user row as the manager-validation lookup sees it. */
const managerRow = (id, active = true) => ({ data: { id, is_active: active }, error: null });
/** A node in the upward chain walk. */
const chainNode = (id, managerId, name) =>
  ({ data: { id, manager_user_id: managerId, display_name: name }, error: null });

beforeEach(() => { queue = []; });

describe('update_user — manager assignment (D-638)', () => {

  test('happy path — Alice reports to Bob, who reports to nobody', async () => {
    queue = [
      adminOk,
      aliceExists,
      managerRow(BOB),                       // proposed manager is live and active
      chainNode(BOB, null, 'Bob'),           // walk: Bob has no manager — chain ends
      { data: { id: ALICE, manager_user_id: BOB }, error: null }   // the update
    ];

    const r = await update_user(
      { user_id: ALICE, updates: { manager_user_id: BOB } }, ADMIN
    );

    assert.equal(r.success, true, r.error);
    assert.equal(r.data.manager_user_id, BOB);
  });

  test('happy path — clearing the manager passes an explicit null and skips validation', async () => {
    queue = [
      adminOk,
      aliceExists,
      { data: { id: ALICE, manager_user_id: null }, error: null }
    ];

    const r = await update_user(
      { user_id: ALICE, updates: { manager_user_id: null } }, ADMIN
    );

    assert.equal(r.success, true, r.error);
    assert.equal(r.data.manager_user_id, null);
  });

  test('rejects self-assignment', async () => {
    queue = [adminOk, aliceExists, managerRow(ALICE)];

    const r = await update_user(
      { user_id: ALICE, updates: { manager_user_id: ALICE } }, ADMIN
    );

    assert.equal(r.success, false);
    assert.match(r.error, /cannot be their own manager/);
  });

  test('rejects a direct two-person loop — Bob already reports to Alice', async () => {
    queue = [
      adminOk,
      aliceExists,
      managerRow(BOB),
      chainNode(BOB, ALICE, 'Bob')           // Bob's manager IS Alice → loop
    ];

    const r = await update_user(
      { user_id: ALICE, updates: { manager_user_id: BOB } }, ADMIN
    );

    assert.equal(r.success, false);
    assert.match(r.error, /reporting loop/);
    assert.match(r.error, /Bob/, 'names the person in the way, per D-140');
  });

  test('rejects an indirect loop further up the chain', async () => {
    // Alice → Bob → Carol → Alice. The loop is two hops up, so only a real
    // walk catches it; a parent-only check would let this through.
    queue = [
      adminOk,
      aliceExists,
      managerRow(BOB),
      chainNode(BOB,   CAROL, 'Bob'),
      chainNode(CAROL, ALICE, 'Carol')       // Carol reports to Alice → loop
    ];

    const r = await update_user(
      { user_id: ALICE, updates: { manager_user_id: BOB } }, ADMIN
    );

    assert.equal(r.success, false);
    assert.match(r.error, /reporting loop/);
    assert.match(r.error, /Carol/);
  });

  test('rejects an inactive manager', async () => {
    queue = [adminOk, aliceExists, managerRow(BOB, false)];

    const r = await update_user(
      { user_id: ALICE, updates: { manager_user_id: BOB } }, ADMIN
    );

    assert.equal(r.success, false);
    assert.match(r.error, /inactive/);
  });

  test('rejects a manager who does not exist', async () => {
    queue = [adminOk, aliceExists, { data: null, error: null }];

    const r = await update_user(
      { user_id: ALICE, updates: { manager_user_id: 'ghost-uuid' } }, ADMIN
    );

    assert.equal(r.success, false);
    assert.match(r.error, /Manager not found/);
  });

  test('a non-admin cannot set a manager at all', async () => {
    queue = [notAdmin];

    const r = await update_user(
      { user_id: ALICE, updates: { manager_user_id: BOB } }, 'someone-uuid'
    );

    assert.equal(r.success, false);
    assert.match(r.error, /requires Admin role/);
  });
});
