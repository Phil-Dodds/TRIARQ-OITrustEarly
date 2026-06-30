// contract32.test.js
// Pathways OI Trust — division-mcp (Contract 32, D-480/D-481).
// Happy + error path tests for the three division_status_config tools.
// Uses Node's built-in test runner (node --test). Supabase singleton mocked
// via require.cache injection (same technique as contract31.test.js); a FIFO
// response queue answers each chained terminal in order.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

// ── Mock Supabase singleton ───────────────────────────────────────────────────
let queue = [];
function nextResp(fallback) {
  return queue.length ? queue.shift() : fallback;
}
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
  rpc:    async () => nextResp({ data: null, error: null }),
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain }
};

const { save_division_status_config }  = require('../src/tools/save_division_status_config');
const { get_division_status_config }   = require('../src/tools/get_division_status_config');
const { clear_division_status_config } = require('../src/tools/clear_division_status_config');

const ADMIN     = 'admin-uuid';
const adminOk   = { data: { is_admin: true,  is_active: true }, error: null };
const notAdmin  = { data: { is_admin: false, is_active: true }, error: null };
const DIV       = '11111111-1111-1111-1111-111111111111';
const divExists = { data: { id: DIV, division_name: 'Cardiology' }, error: null };

beforeEach(() => { queue = []; });

// ── save_division_status_config ───────────────────────────────────────────────
describe('save_division_status_config (D-480)', () => {

  test('happy path — weekly config saved (anchor/occurrence nulled)', async () => {
    queue = [
      adminOk,                                                   // caller admin check
      divExists,                                                 // division exists
      { data: { id: 'cfg-1', division_id: DIV, cadence: 'weekly', day_of_week: 1 }, error: null } // upsert
    ];
    const r = await save_division_status_config(
      { division_id: DIV, cadence: 'weekly', day_of_week: 1 }, ADMIN);
    assert.equal(r.success, true);
    assert.equal(r.data.cadence, 'weekly');
  });

  test('error — triweekly without anchor_date rejected (validation, no DB call)', async () => {
    const r = await save_division_status_config(
      { division_id: DIV, cadence: 'triweekly', day_of_week: 1 }, ADMIN);
    assert.equal(r.success, false);
    assert.ok(/Starting From/.test(r.error));
  });

  test('error — monthly without occurrence rejected', async () => {
    const r = await save_division_status_config(
      { division_id: DIV, cadence: 'monthly', day_of_week: 1 }, ADMIN);
    assert.equal(r.success, false);
    assert.ok(/Occurrence/.test(r.error));
  });

  test('error — day_of_week out of range rejected', async () => {
    const r = await save_division_status_config(
      { division_id: DIV, cadence: 'weekly', day_of_week: 9 }, ADMIN);
    assert.equal(r.success, false);
    assert.ok(/0 \(Sunday\) to 6/.test(r.error));
  });

  test('error — non-admin caller rejected', async () => {
    queue = [notAdmin];
    const r = await save_division_status_config(
      { division_id: DIV, cadence: 'weekly', day_of_week: 1 }, 'someone');
    assert.equal(r.success, false);
    assert.ok(/Admin role/.test(r.error));
  });
});

// ── get_division_status_config ────────────────────────────────────────────────
describe('get_division_status_config (D-481 inheritance)', () => {

  test('happy path — local config (not inherited)', async () => {
    queue = [
      { data: { id: 'cfg-1', division_id: DIV, cadence: 'weekly', day_of_week: 1 }, error: null }, // rpc
      { data: { id: DIV, division_name: 'Cardiology' }, error: null }                              // source div
    ];
    const r = await get_division_status_config({ division_id: DIV }, ADMIN);
    assert.equal(r.success, true);
    assert.equal(r.data.inherited, false);
    assert.equal(r.data.source_division_name, 'Cardiology');
  });

  test('happy path — inherited from parent', async () => {
    const PARENT = '22222222-2222-2222-2222-222222222222';
    queue = [
      { data: { id: 'cfg-9', division_id: PARENT, cadence: 'monthly', day_of_week: 2, month_occurrence: 'first' }, error: null },
      { data: { id: PARENT, division_name: 'Hospital Group' }, error: null }
    ];
    const r = await get_division_status_config({ division_id: DIV }, ADMIN);
    assert.equal(r.success, true);
    assert.equal(r.data.inherited, true);
    assert.equal(r.data.source_division_id, PARENT);
  });

  test('no config in chain — config null, inherited false', async () => {
    queue = [{ data: null, error: null }]; // rpc returns no row
    const r = await get_division_status_config({ division_id: DIV }, ADMIN);
    assert.equal(r.success, true);
    assert.equal(r.data.config, null);
    assert.equal(r.data.inherited, false);
  });

  test('error — division_id missing', async () => {
    const r = await get_division_status_config({}, ADMIN);
    assert.equal(r.success, false);
  });
});

// ── clear_division_status_config ──────────────────────────────────────────────
describe('clear_division_status_config (D-480, local only)', () => {

  test('happy path — local row deleted', async () => {
    queue = [
      adminOk,                                              // caller admin check
      { data: [{ id: 'cfg-1', division_id: DIV }], error: null } // delete().select() → then
    ];
    const r = await clear_division_status_config({ division_id: DIV }, ADMIN);
    assert.equal(r.success, true);
    assert.equal(r.data.cleared, true);
  });

  test('error — no local row returns not-found message', async () => {
    queue = [
      adminOk,
      { data: [], error: null } // delete affected nothing
    ];
    const r = await clear_division_status_config({ division_id: DIV }, ADMIN);
    assert.equal(r.success, false);
    assert.ok(/No local update cycle/.test(r.error));
  });

  test('error — non-admin caller rejected', async () => {
    queue = [notAdmin];
    const r = await clear_division_status_config({ division_id: DIV }, 'someone');
    assert.equal(r.success, false);
    assert.ok(/Admin role/.test(r.error));
  });
});
