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

const { get_news_ticker, toggle_news_banner_reaction } = require('../src/tools/news_ticker');
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

  test('merges sources newest-first, stamps stable keys, folds in reactions', async () => {
    queue = [
      // 1. gate approvals
      { data: [{ id: 'g1', delivery_cycle_id: 'c1', event_metadata: { gate_name: 'go_to_build' }, created_at: '2026-07-10T00:00:00Z' }], error: null },
      { data: [{ delivery_cycle_id: 'c1', cycle_title: 'Referral Mgmt' }], error: null }, // titles
      // 2. meetings
      { data: [{ id: 'm1', title: 'Weekly', created_at: '2026-07-16T00:00:00Z', created_by: 'u2', users: { display_name: 'Sarah' } }], error: null },
      // 3. egg finds
      { data: [{ id: 'e1', found_at: '2026-07-15T00:00:00Z', users: { display_name: 'Maya' }, easter_eggs: { asset_ref: 'egg-05' } }], error: null },
      // 4. new users
      { data: [{ id: 'u1', display_name: 'Tom', created_at: '2026-07-12T00:00:00Z' }], error: null },
      // 5. status updates (+ title fetch)
      { data: [{ id: 's1', initiative_id: 'c1', saved_at: '2026-07-17T00:00:00Z', users: { display_name: 'Ana' } }], error: null },
      { data: [{ delivery_cycle_id: 'c1', cycle_title: 'Referral Mgmt' }], error: null },
      // 6. acknowledgements
      { data: [{ id: 'a1', acknowledged_at: '2026-07-11T00:00:00Z', users: { display_name: 'Bo' } }], error: null },
      // reactions fold-in
      { data: [
        { news_item_key: 'status:s1', emoji: 'heart', user_id: USER },
        { news_item_key: 'status:s1', emoji: 'clap',  user_id: 'other' }
      ], error: null }
    ];
    const r = await get_news_ticker({}, USER);
    assert.equal(r.success, true);
    // newest first: status (07-17) → meeting (07-16) → egg (07-15) → user (07-12) → ack (07-11) → gate (07-10)
    assert.deepEqual(r.data.items.map(i => i.kind), ['status', 'meeting', 'egg', 'user', 'ack', 'gate']);
    assert.equal(r.data.items[0].news_item_key, 'status:s1');
    assert.equal(r.data.items[5].news_item_key, 'gate:g1');
    assert.equal(r.data.items[2].asset_ref, 'egg-05');
    // reactions on the status item: heart mine=true, clap mine=false
    const heart = r.data.items[0].reactions.find(x => x.emoji === 'heart');
    const clap  = r.data.items[0].reactions.find(x => x.emoji === 'clap');
    assert.equal(heart.count, 1); assert.equal(heart.mine, true);
    assert.equal(clap.count, 1);  assert.equal(clap.mine, false);
    assert.deepEqual(r.data.items[1].reactions, []); // meeting has none
  });
});

describe('get_news_ticker pinned notice (NEWS_TICKER_NOTICE)', () => {
  const NOTICE = 'OI Trust moves to oi-trust.myqone.com tonight.';

  test('absent env var → no notice item', async () => {
    delete process.env.NEWS_TICKER_NOTICE;
    const r = await get_news_ticker({}, USER);
    assert.equal(r.success, true);
    assert.equal(r.data.items.some(i => i.kind === 'notice'), false);
  });

  test('whitespace-only env var is ignored', async () => {
    process.env.NEWS_TICKER_NOTICE = '   ';
    const r = await get_news_ticker({}, USER);
    assert.equal(r.data.items.some(i => i.kind === 'notice'), false);
    delete process.env.NEWS_TICKER_NOTICE;
  });

  test('set env var → notice is first, on an otherwise empty feed', async () => {
    process.env.NEWS_TICKER_NOTICE = NOTICE;
    const r = await get_news_ticker({}, USER);
    assert.equal(r.success, true);
    assert.equal(r.data.items[0].kind, 'notice');
    assert.equal(r.data.items[0].text, NOTICE);
    assert.deepEqual(r.data.items[0].reactions, []);
    assert.equal(r.data.items[0].news_item_key, 'notice:pinned');
    delete process.env.NEWS_TICKER_NOTICE;
  });

  test('notice is trimmed', async () => {
    process.env.NEWS_TICKER_NOTICE = `  ${NOTICE}  `;
    const r = await get_news_ticker({}, USER);
    assert.equal(r.data.items[0].text, NOTICE);
    delete process.env.NEWS_TICKER_NOTICE;
  });
});

describe('toggle_news_banner_reaction', () => {
  test('rejects an invalid emoji', async () => {
    const r = await toggle_news_banner_reaction({ news_item_key: 'gate:g1', emoji: 'thumbsdown' }, USER);
    assert.equal(r.success, false);
  });
  test('requires a signed-in caller', async () => {
    const r = await toggle_news_banner_reaction({ news_item_key: 'gate:g1', emoji: 'heart' }, null);
    assert.equal(r.success, false);
  });
  test('adds a reaction when none exists', async () => {
    queue = [{ data: null, error: null }]; // no existing reaction
    const r = await toggle_news_banner_reaction({ news_item_key: 'gate:g1', emoji: 'heart' }, USER);
    assert.equal(r.success, true);
    assert.equal(r.data.reacted, true);
  });
  test('removes a reaction when one exists', async () => {
    queue = [{ data: { id: 'r1' }, error: null }]; // existing reaction found
    const r = await toggle_news_banner_reaction({ news_item_key: 'gate:g1', emoji: 'clap' }, USER);
    assert.equal(r.success, true);
    assert.equal(r.data.reacted, false);
  });
});
