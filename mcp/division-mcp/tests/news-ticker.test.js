// news-ticker.test.js — division-mcp get_news_ticker.
// FIFO Supabase mock (contract31 pattern) + gte. Validates auth gating and the
// merge/sort/normalize of the multi-source feed.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

let queue = [];
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }
const chain = {
  from: () => chain, select: () => chain, insert: () => chain, update: () => chain,
  eq: () => chain, is: () => chain, in: () => chain, not: () => chain,
  gte: () => chain, order: () => chain, limit: () => chain,
  single:      async () => nextResp({ data: null, error: null }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const { get_news_ticker } = require('../src/tools/news_ticker');
const USER = 'user-uuid';

beforeEach(() => { queue = []; });

describe('get_news_ticker', () => {
  test('requires a signed-in caller', async () => {
    const r = await get_news_ticker({}, null);
    assert.equal(r.success, false);
  });

  test('empty sources → success with empty feed', async () => {
    const r = await get_news_ticker({}, USER);
    assert.equal(r.success, true);
    assert.deepEqual(r.data.items, []);
  });

  test('merges sources newest-first and normalizes egg items with an asset', async () => {
    queue = [
      // 1. gate approvals
      { data: [{ delivery_cycle_id: 'c1', event_metadata: { gate_name: 'go_to_build' }, created_at: '2026-07-10T00:00:00Z' }], error: null },
      { data: [{ delivery_cycle_id: 'c1', cycle_title: 'Referral Mgmt' }], error: null }, // titles
      // 2. meetings
      { data: [{ title: 'Weekly', created_at: '2026-07-16T00:00:00Z', created_by: 'u2', users: { display_name: 'Sarah' } }], error: null },
      // 3. egg finds
      { data: [{ found_at: '2026-07-15T00:00:00Z', users: { display_name: 'Maya' }, easter_eggs: { asset_ref: 'egg-05' } }], error: null },
      // 4. new users
      { data: [{ display_name: 'Tom', created_at: '2026-07-12T00:00:00Z' }], error: null }
    ];
    const r = await get_news_ticker({}, USER);
    assert.equal(r.success, true);
    // newest first: meeting (07-16) → egg (07-15) → user (07-12) → gate (07-10)
    assert.deepEqual(r.data.items.map(i => i.kind), ['meeting', 'egg', 'user', 'gate']);
    assert.match(r.data.items[0].text, /Sarah created a new meeting/);
    assert.equal(r.data.items[1].asset_ref, 'egg-05');
    assert.match(r.data.items[3].text, /Referral Mgmt passed its Go to Build gate/);
  });
});
