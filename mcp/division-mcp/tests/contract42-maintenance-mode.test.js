// contract42-maintenance-mode.test.js
// Pathways OI Trust — division-mcp (Contract 42, AC-29).
// Happy + error paths for set_maintenance_mode and get_maintenance_mode.
// Supabase singleton mocked via require.cache injection; FIFO response queue
// answers each chained terminal in call order (same technique as
// contract40-approvers.test.js).
//
// NOTE (CLAUDE.md standing note 2): the FIFO mock ignores .select()/.eq()
// column names, so these tests cannot prove the column names are right.
// Rule 34 is the guard there — the columns below were verified against
// db/migrations/095_system_config_rescued.sql and 053_system_config_status_refresh.sql.

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
  rpc:    async () => nextResp({ data: null, error: null }),
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const { set_maintenance_mode } = require('../src/tools/set_maintenance_mode');
const { get_maintenance_mode } = require('../src/tools/get_maintenance_mode');

const ADMIN = 'admin-uuid';
const USER  = 'user-uuid';

const adminOk    = { data: { is_admin: true,  is_active: true }, error: null };
const notAdmin   = { data: { is_admin: false, is_active: true }, error: null };

beforeEach(() => { queue = []; });

describe('set_maintenance_mode', () => {
  test('happy path — admin enables maintenance mode with a message', async () => {
    queue = [
      adminOk,
      { data: [{
          maintenance_mode:    true,
          maintenance_message: 'Deploying Contract 42.',
          updated_at:          '2026-08-02T19:00:00.000Z',
          updated_by:          ADMIN
        }], error: null }
    ];

    const r = await set_maintenance_mode(
      { enabled: true, message: 'Deploying Contract 42.' }, ADMIN
    );

    assert.equal(r.success, true);
    assert.equal(r.data.maintenance_mode, true);
    assert.equal(r.data.maintenance_message, 'Deploying Contract 42.');
    assert.equal(r.data.updated_by, ADMIN);
  });

  test('happy path — admin clears maintenance mode', async () => {
    queue = [
      adminOk,
      { data: [{
          maintenance_mode:    false,
          maintenance_message: null,
          updated_at:          '2026-08-02T19:30:00.000Z',
          updated_by:          ADMIN
        }], error: null }
    ];

    const r = await set_maintenance_mode({ enabled: false }, ADMIN);

    assert.equal(r.success, true);
    assert.equal(r.data.maintenance_mode, false);
    assert.equal(r.data.maintenance_message, null);
  });

  test('error — enabled is not a boolean (no DB call)', async () => {
    const r = await set_maintenance_mode({ enabled: 'yes' }, ADMIN);
    assert.equal(r.success, false);
    assert.match(r.error, /enabled \(boolean\) is required/);
  });

  test('error — caller is not an admin (D-635)', async () => {
    queue = [notAdmin];
    const r = await set_maintenance_mode({ enabled: true }, USER);
    assert.equal(r.success, false);
    assert.match(r.error, /requires Admin role/);
  });

  test('error — no system_config row to update', async () => {
    queue = [adminOk, { data: [], error: null }];
    const r = await set_maintenance_mode({ enabled: true }, ADMIN);
    assert.equal(r.success, false);
    assert.match(r.error, /No system_config row found/);
  });
});

describe('get_maintenance_mode', () => {
  test('happy path — admin reads the current flag', async () => {
    queue = [
      adminOk,
      { data: { maintenance_mode: true, maintenance_message: 'Back shortly.' }, error: null }
    ];

    const r = await get_maintenance_mode({}, ADMIN);

    assert.equal(r.success, true);
    assert.equal(r.data.maintenance_mode, true);
    assert.equal(r.data.maintenance_message, 'Back shortly.');
  });

  test('error — caller is not an admin (D-635: authenticated admin read, not public)', async () => {
    queue = [notAdmin];
    const r = await get_maintenance_mode({}, USER);
    assert.equal(r.success, false);
    assert.match(r.error, /requires Admin role/);
  });

  test('error — system_config read fails', async () => {
    queue = [adminOk, { data: null, error: { message: 'relation does not exist' } }];
    const r = await get_maintenance_mode({}, ADMIN);
    assert.equal(r.success, false);
    assert.match(r.error, /Failed to read system_config/);
  });
});
