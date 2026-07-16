// easter-eggs.test.js
// Pathways OI Trust — division-mcp Easter Egg Hunt tools (spec §6, §11).
// FIFO-queue Supabase mock (same technique as contract31.test.js), extended
// with a functions.invoke stub (congrats email) and insert payload capture.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.EASTER_EGG_CELEBRATION_CC = 'mike@triarqhealth.com, sabrina@triarqhealth.com';

let queue = [];
let inserts = [];
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }
const chain = {
  from:   () => chain,
  select: () => chain,
  insert: (p) => { inserts.push(p); return chain; },
  update: () => chain,
  eq:     () => chain,
  is:     () => chain,
  in:     () => chain,
  not:    () => chain,
  order:  () => chain,
  limit:  () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve),
  functions: { invoke: async () => ({ data: null, error: null }) }
};
chain.functions = { invoke: async () => ({ data: null, error: null }) };

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const ee = require('../src/tools/easter_eggs');

const USER = 'user-uuid';
const ADMIN_OK = { data: { is_admin: true }, error: null };
const ADMIN_NO = { data: { is_admin: false }, error: null };
const EGG = { id: 'egg-uuid', egg_name: 'Home', asset_ref: 'egg-01', placement_key: 'home.landing.footer' };

beforeEach(() => { queue = []; inserts = []; });

describe('find_egg', () => {
  test('requires placement_key', async () => {
    const r = await ee.find_egg({}, USER);
    assert.equal(r.success, false);
  });

  test('requires a signed-in caller', async () => {
    const r = await ee.find_egg({ placement_key: 'home.landing.footer' }, null);
    assert.equal(r.success, false);
  });

  test('unknown spot returns an error', async () => {
    queue = [{ data: null, error: null }]; // egg lookup → none
    const r = await ee.find_egg({ placement_key: 'nope' }, USER);
    assert.equal(r.success, false);
    assert.match(r.error, /No active egg/);
  });

  test('newly found (not complete) records the find', async () => {
    queue = [
      { data: EGG, error: null },      // egg lookup
      { count: 10 },                   // countActiveEggs
      { data: null, error: null },     // existing find → none
      { error: null },                 // insert find
      { count: 3 }                     // countUserFinds
    ];
    const r = await ee.find_egg({ placement_key: 'home.landing.footer' }, USER);
    assert.equal(r.success, true);
    assert.equal(r.data.newly_found, true);
    assert.equal(r.data.just_completed, false);
    assert.equal(r.data.total_found, 3);
    assert.equal(r.data.total_eggs, 10);
    assert.equal(inserts.length, 1);
    assert.equal(inserts[0].egg_id, EGG.id);
  });

  test('already found is a friendly no-op', async () => {
    queue = [
      { data: EGG, error: null },        // egg lookup
      { count: 10 },                     // countActiveEggs
      { data: { id: 'f1' }, error: null }, // existing find present
      { count: 5 }                       // countUserFinds
    ];
    const r = await ee.find_egg({ placement_key: 'home.landing.footer' }, USER);
    assert.equal(r.success, true);
    assert.equal(r.data.already_found, true);
    assert.equal(r.data.newly_found, false);
    assert.equal(inserts.length, 0, 'no insert on a repeat click');
  });

  test('tenth find flips just_completed and writes an achievement', async () => {
    queue = [
      { data: EGG, error: null },      // egg lookup
      { count: 10 },                   // countActiveEggs
      { data: null, error: null },     // existing → none
      { error: null },                 // insert find
      { count: 10 },                   // countUserFinds → now 10
      { data: null, error: null },     // achievement lookup → none
      { error: null }                  // achievement insert
      // sendCongratsEmail chain runs fire-and-forget; extra dequeues fall back
    ];
    const r = await ee.find_egg({ placement_key: 'home.landing.footer' }, USER);
    assert.equal(r.success, true);
    assert.equal(r.data.just_completed, true);
    const achInsert = inserts.find(i => i && i.season === 1 && i.user_id === USER && !i.egg_id);
    assert.ok(achInsert, 'achievement row inserted');
  });
});

describe('get_my_egg_basket', () => {
  test('reveals names only for found eggs (EE-01) and returns the leader', async () => {
    queue = [
      { data: [
        { id: 'e1', egg_name: 'Home', asset_ref: 'egg-01', sort_order: 1, placement_key: 'home.landing.footer' },
        { id: 'e2', egg_name: 'About', asset_ref: 'egg-08', sort_order: 2, placement_key: 'shell.about.footer' }
      ], error: null },                                              // active eggs
      { data: [{ egg_id: 'e1', found_at: '2026-07-15T00:00:00Z' }], error: null }, // my finds
      // computeLeaderboard: countActiveEggs, users, all finds
      { count: 2 },
      { data: [{ id: USER, display_name: 'You' }, { id: 'other', display_name: 'Maya' }], error: null },
      { data: [
        { user_id: 'other', found_at: '2026-07-14T00:00:00Z', easter_eggs: { asset_ref: 'egg-03' } },
        { user_id: 'other', found_at: '2026-07-16T00:00:00Z', easter_eggs: { asset_ref: 'egg-05' } },
        { user_id: USER, found_at: '2026-07-15T00:00:00Z', easter_eggs: { asset_ref: 'egg-01' } }
      ], error: null }
    ];
    const r = await ee.get_my_egg_basket({}, USER);
    assert.equal(r.success, true);
    assert.equal(r.data.total_found, 1);
    assert.equal(r.data.total_eggs, 2);
    const found = r.data.basket.find(b => b.egg_id === 'e1');
    const unfound = r.data.basket.find(b => b.egg_id === 'e2');
    assert.equal(found.egg_name, 'Home');
    assert.equal(unfound.egg_name, null, 'unfound egg name hidden');
    // Maya (2) leads You (1); leader shows her most-recent egg (egg-05).
    assert.equal(r.data.leader.display_name, 'Maya');
    assert.equal(r.data.leader.found_count, 2);
    assert.equal(r.data.leader.last_asset_ref, 'egg-05');
    assert.equal(r.data.leader.is_me, false);
  });
});

describe('get_egg_leaderboard', () => {
  test('rejects non-admin', async () => {
    queue = [ADMIN_NO];
    const r = await ee.get_egg_leaderboard({}, USER);
    assert.equal(r.success, false);
  });

  test('orders by count desc, tie broken by most recent last egg', async () => {
    queue = [
      ADMIN_OK,
      { count: 10 },                                       // countActiveEggs
      { data: [
        { id: 'a', display_name: 'Ann' },
        { id: 'b', display_name: 'Bob' },
        { id: 'c', display_name: 'Cy' }                    // zero finds
      ], error: null },
      { data: [
        { user_id: 'a', found_at: '2026-07-10T00:00:00Z', easter_eggs: { asset_ref: 'egg-01' } },
        { user_id: 'a', found_at: '2026-07-11T00:00:00Z', easter_eggs: { asset_ref: 'egg-02' } },
        { user_id: 'b', found_at: '2026-07-12T00:00:00Z', easter_eggs: { asset_ref: 'egg-03' } },
        { user_id: 'b', found_at: '2026-07-15T00:00:00Z', easter_eggs: { asset_ref: 'egg-04' } }
      ], error: null }
    ];
    const r = await ee.get_egg_leaderboard({}, USER);
    assert.equal(r.success, true);
    assert.equal(r.data.total_eggs, 10);
    // Ann & Bob tie at 2; Bob's last egg (07-15) is more recent → Bob first.
    assert.deepEqual(r.data.rows.map(x => x.display_name), ['Bob', 'Ann', 'Cy']);
    assert.equal(r.data.rows[0].last_asset_ref, 'egg-04');
    assert.equal(r.data.rows[2].found_count, 0);
  });
});

describe('get_recent_egg_finds', () => {
  test("hides other users' egg names, reveals the caller's own (EE-01)", async () => {
    queue = [
      { data: [
        { user_id: 'other', egg_id: 'e1', found_at: 't2', easter_eggs: { egg_name: 'About', asset_ref: 'egg-08' }, users: { display_name: 'Maya' } },
        { user_id: USER,   egg_id: 'e2', found_at: 't1', easter_eggs: { egg_name: 'Home', asset_ref: 'egg-01' }, users: { display_name: 'You' } }
      ], error: null },
      { data: [], error: null } // achievements
    ];
    const r = await ee.get_recent_egg_finds({ limit: 15 }, USER);
    assert.equal(r.success, true);
    const other = r.data.finds.find(f => f.display_name === 'Maya');
    const own = r.data.finds.find(f => f.is_own);
    assert.equal(other.egg_name, null, "other user's location hidden");
    assert.equal(own.egg_name, 'Home', 'own find reveals the name');
  });
});

describe('admin config gating', () => {
  test('list_easter_eggs rejects non-admin', async () => {
    queue = [ADMIN_NO];
    const r = await ee.list_easter_eggs({}, USER);
    assert.equal(r.success, false);
    assert.match(r.error, /Admin role/);
  });

  test('set_easter_egg_active validates args for admin', async () => {
    queue = [ADMIN_OK];
    const r = await ee.set_easter_egg_active({ egg_id: 'x' }, USER); // missing active
    assert.equal(r.success, false);
  });

  test('upsert_easter_egg (admin) inserts a new egg', async () => {
    queue = [ADMIN_OK, { data: { id: 'new' }, error: null }];
    const r = await ee.upsert_easter_egg({
      egg_slug: 's', placement_key: 'a.b.c', egg_name: 'X', location_detail: 'somewhere',
      asset_ref: 'egg-01', sort_order: 1
    }, USER);
    assert.equal(r.success, true);
  });
});
