// contract31.test.js
// Pathways OI Trust — division-mcp (Contract 31, D-474).
// Happy + error path tests for the six api_key tools and the key generation
// helper. Uses Node's built-in test runner (node --test). The Supabase client
// singleton (../src/db) is mocked via require.cache injection (same technique
// as jwt.test.js): a FIFO response queue answers each chained query in order.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

// ── Mock Supabase singleton ───────────────────────────────────────────────────
// FIFO queue: each terminal (.single / .maybeSingle) and each awaited builder
// (after .order / .in) dequeues the next response. Tests set `queue` per case.
let queue = [];
function nextResp(fallback) {
  return queue.length ? queue.shift() : fallback;
}
const chain = {
  from:   () => chain,
  select: () => chain,
  insert: () => chain,
  update: () => chain,
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
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain }
};

// Tools require('../db') → the injected mock above.
const { create_api_key }     = require('../src/tools/create_api_key');
const { list_api_keys }      = require('../src/tools/list_api_keys');
const { get_api_key }        = require('../src/tools/get_api_key');
const { update_api_key }     = require('../src/tools/update_api_key');
const { inactivate_api_key } = require('../src/tools/inactivate_api_key');
const { reactivate_api_key } = require('../src/tools/reactivate_api_key');
const { generateApiKey, verifyApiKey } = require('../src/helpers/api-key');

const PHIL = 'phil-uuid';
const philOk = { data: { is_super_admin: true }, error: null };   // isPhil → true
const notPhil = { data: { is_super_admin: false }, error: null }; // isPhil → false

beforeEach(() => { queue = []; });

// ─────────────────────────────────────────────────────────────────────────────
describe('api_key tools — Phil gate (AC #6)', () => {

  test('non-Phil caller is rejected on create_api_key', async () => {
    queue = [notPhil];
    const r = await create_api_key({ display_name: 'X', user_label: 'Y' }, 'someone-else');
    assert.equal(r.success, false);
    assert.ok(/Only Phil/.test(r.error));
  });

  test('non-Phil caller is rejected on list_api_keys', async () => {
    queue = [notPhil];
    const r = await list_api_keys({}, 'someone-else');
    assert.equal(r.success, false);
    assert.ok(/Only Phil/.test(r.error));
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('create_api_key', () => {

  test('error path: missing display_name', async () => {
    queue = [philOk];
    const r = await create_api_key({ user_label: 'Sabrina Chen' }, PHIL);
    assert.equal(r.success, false);
    assert.ok(r.error.includes('display_name'));
  });

  test('error path: missing user_label', async () => {
    queue = [philOk];
    const r = await create_api_key({ display_name: 'Sabrina key' }, PHIL);
    assert.equal(r.success, false);
    assert.ok(r.error.includes('user_label'));
  });

  test('happy path: returns raw_key with oitrust_ prefix, no key_hash', async () => {
    queue = [
      philOk,
      { data: { key_id: 'k1', display_name: 'Sabrina key', user_label: 'Sabrina Chen', created_at: '2026-06-22T00:00:00Z' }, error: null }
    ];
    const r = await create_api_key({ display_name: 'Sabrina key', user_label: 'Sabrina Chen' }, PHIL);
    assert.equal(r.success, true);
    assert.ok(r.data.raw_key.startsWith('oitrust_'));
    assert.equal(r.data.key_id, 'k1');
    assert.ok(!('key_hash' in r.data));
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('get_api_key — raw key is never retrievable again', () => {

  test('happy path: returns shaped row, no raw_key and no key_hash', async () => {
    queue = [
      philOk,
      { data: { key_id: 'k1', display_name: 'Sabrina key', user_label: 'Sabrina Chen', scope_type: 'all', created_at: 't', last_used_at: null, revoked_at: null, created_by: 'c1' }, error: null },
      { data: [{ id: 'c1', display_name: 'Phil Dodds' }], error: null }
    ];
    const r = await get_api_key({ key_id: 'k1' }, PHIL);
    assert.equal(r.success, true);
    assert.ok(!('raw_key' in r.data), 'get_api_key must never return the raw key');
    assert.ok(!('key_hash' in r.data));
    assert.equal(r.data.is_active, true);
    assert.equal(r.data.created_by_name, 'Phil Dodds');
  });

  test('error path: not found', async () => {
    queue = [philOk, { data: null, error: null }];
    const r = await get_api_key({ key_id: 'missing' }, PHIL);
    assert.equal(r.success, false);
    assert.ok(/not found/i.test(r.error));
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('update_api_key', () => {

  test('error path: no fields provided', async () => {
    queue = [philOk];
    const r = await update_api_key({ key_id: 'k1' }, PHIL);
    assert.equal(r.success, false);
    assert.ok(/at least one/i.test(r.error));
  });

  test('happy path: updated display_name returned', async () => {
    queue = [
      philOk,
      { data: { key_id: 'k1' }, error: null },                       // existence check
      { data: { key_id: 'k1', display_name: 'Renamed', user_label: 'Sabrina Chen', scope_type: 'all', created_at: 't', last_used_at: null, revoked_at: null, created_by: 'c1' }, error: null },
      { data: [{ id: 'c1', display_name: 'Phil Dodds' }], error: null }
    ];
    const r = await update_api_key({ key_id: 'k1', display_name: 'Renamed' }, PHIL);
    assert.equal(r.success, true);
    assert.equal(r.data.display_name, 'Renamed');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('inactivate_api_key', () => {

  test('conflict: already inactive', async () => {
    queue = [philOk, { data: { key_id: 'k1', revoked_at: '2026-01-01T00:00:00Z' }, error: null }];
    const r = await inactivate_api_key({ key_id: 'k1' }, PHIL);
    assert.equal(r.success, false);
    assert.equal(r.error, 'Key is already inactive.');
  });

  test('happy path: revoked_at set', async () => {
    queue = [
      philOk,
      { data: { key_id: 'k1', revoked_at: null }, error: null },              // existence + state
      { data: { key_id: 'k1', revoked_at: '2026-06-22T00:00:00Z' }, error: null } // update
    ];
    const r = await inactivate_api_key({ key_id: 'k1' }, PHIL);
    assert.equal(r.success, true);
    assert.ok(r.data.revoked_at);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('reactivate_api_key', () => {

  test('conflict: already active', async () => {
    queue = [philOk, { data: { key_id: 'k1', revoked_at: null }, error: null }];
    const r = await reactivate_api_key({ key_id: 'k1' }, PHIL);
    assert.equal(r.success, false);
    assert.equal(r.error, 'Key is already active.');
  });

  test('happy path: revoked_at cleared', async () => {
    queue = [
      philOk,
      { data: { key_id: 'k1', revoked_at: '2026-06-22T00:00:00Z' }, error: null }, // existence + state
      { data: { key_id: 'k1' }, error: null }                                       // update
    ];
    const r = await reactivate_api_key({ key_id: 'k1' }, PHIL);
    assert.equal(r.success, true);
    assert.equal(r.data.key_id, 'k1');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('generateApiKey / verifyApiKey helper', () => {

  test('produces an oitrust_ key whose hash verifies', async () => {
    const { raw, hash } = await generateApiKey();
    assert.ok(raw.startsWith('oitrust_'));
    assert.notEqual(raw, hash);
    assert.equal(await verifyApiKey(raw, hash), true);
    assert.equal(await verifyApiKey('oitrust_wrong', hash), false);
  });

});
