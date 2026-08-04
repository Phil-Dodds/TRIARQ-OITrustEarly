// contract40-approvers.test.js
// Pathways OI Trust — division-mcp (Contract 40 follow-on).
// Happy + error paths for the three division_approvers tools. Supabase
// singleton mocked via require.cache injection; FIFO response queue answers
// each chained terminal in call order (same technique as contract32.test.js).

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

const { set_division_approver }    = require('../src/tools/set_division_approver');
const { list_division_approvers }  = require('../src/tools/list_division_approvers');
const { remove_division_approver } = require('../src/tools/remove_division_approver');

const ADMIN    = 'admin-uuid';
const USER     = 'user-uuid';
const DIV      = '11111111-1111-1111-1111-111111111111';
const adminOk  = { data: { is_admin: true },  error: null };
const notAdmin = { data: { is_admin: false }, error: null };
const divActive = { data: { id: DIV, division_name: 'Value', active_status: true }, error: null };
const userExists = { data: { id: USER, display_name: 'Karly' }, error: null };
const memberYes = { data: [{ id: 'm1' }], error: null };
const memberNo  = { data: [], error: null };
const noExisting = { data: [], error: null };

beforeEach(() => { queue = []; });

describe('set_division_approver', () => {
  test('happy path — member designated', async () => {
    queue = [adminOk, divActive, userExists, memberYes, noExisting,
             { data: { id: 'da-1', division_id: DIV, user_id: USER }, error: null }];
    const r = await set_division_approver({ division_id: DIV, user_id: USER }, ADMIN);
    assert.equal(r.success, true);
    assert.equal(r.data.user_id, USER);
  });

  test('error — missing division_id (no DB call)', async () => {
    const r = await set_division_approver({ user_id: USER }, ADMIN);
    assert.equal(r.success, false);
  });

  // ── CC-0804-07: AMENDS D-600 / CC-40-R members-only ──────────────────────
  // Phil 2026-08-04: Admins should be selectable as Division Approvers without
  // being enrolled as members. D-170 already gives them implicit access to every
  // Division, so members-only forced a false organisational fact to pass a check.
  test('an ADMIN target needs no membership — the membership query is never consulted', async () => {
    // No memberYes/memberNo fixture supplied: if the code consulted membership
    // it would fall through to the default and fail. Its absence is the assertion.
    queue = [adminOk, divActive,
             { data: { id: USER, display_name: 'Craig Bickford', is_admin: true }, error: null },
             noExisting,
             { data: { id: 'da-2', division_id: DIV, user_id: USER }, error: null }];
    const r = await set_division_approver({ division_id: DIV, user_id: USER }, ADMIN);
    assert.equal(r.success, true, r.error);
    assert.equal(r.data.user_id, USER);
  });

  test('a NON-admin non-member is still refused, with the unblock named (D-140)', async () => {
    queue = [adminOk, divActive,
             { data: { id: USER, display_name: 'Karly', is_admin: false }, error: null },
             memberNo];
    const r = await set_division_approver({ division_id: DIV, user_id: USER }, ADMIN);
    assert.equal(r.success, false);
    assert.match(r.error, /is not a member of/);
    assert.match(r.error, /Add them as a member/, 'states what would unblock it');
  });

  test('error — caller not admin', async () => {
    queue = [notAdmin];
    const r = await set_division_approver({ division_id: DIV, user_id: USER }, ADMIN);
    assert.equal(r.success, false);
    assert.match(r.error, /Admin/);
  });

  test('error — target not a member of the division', async () => {
    queue = [adminOk, divActive, userExists, memberNo];
    const r = await set_division_approver({ division_id: DIV, user_id: USER }, ADMIN);
    assert.equal(r.success, false);
    assert.match(r.error, /not a member/);
  });

  test('error — already an approver', async () => {
    queue = [adminOk, divActive, userExists, memberYes, { data: [{ id: 'da-1' }], error: null }];
    const r = await set_division_approver({ division_id: DIV, user_id: USER }, ADMIN);
    assert.equal(r.success, false);
    assert.match(r.error, /already an approver/);
  });
});

describe('list_division_approvers', () => {
  test('happy path — rows with resolved names', async () => {
    queue = [
      adminOk,
      { data: [{ id: 'da-1', division_id: DIV, user_id: USER, assigned_by: ADMIN, assigned_at: 'now' }], error: null },
      { data: [{ id: USER, display_name: 'Karly', is_active: true }], error: null }
    ];
    const r = await list_division_approvers({ division_id: DIV }, ADMIN);
    assert.equal(r.success, true);
    assert.equal(r.data.length, 1);
    assert.equal(r.data[0].display_name, 'Karly');
  });

  test('happy path — empty', async () => {
    queue = [adminOk, { data: [], error: null }];
    const r = await list_division_approvers({ division_id: DIV }, ADMIN);
    assert.equal(r.success, true);
    assert.equal(r.data.length, 0);
  });

  test('error — not admin', async () => {
    queue = [notAdmin];
    const r = await list_division_approvers({ division_id: DIV }, ADMIN);
    assert.equal(r.success, false);
  });
});

describe('remove_division_approver', () => {
  test('happy path — removed', async () => {
    queue = [adminOk, { data: [{ id: 'da-1' }], error: null }, { data: null, error: null }];
    const r = await remove_division_approver({ division_id: DIV, user_id: USER }, ADMIN);
    assert.equal(r.success, true);
    assert.equal(r.data.removed, true);
  });

  test('idempotent — nothing to remove', async () => {
    queue = [adminOk, { data: [], error: null }];
    const r = await remove_division_approver({ division_id: DIV, user_id: USER }, ADMIN);
    assert.equal(r.success, true);
    assert.equal(r.data.removed, false);
  });

  test('error — not admin', async () => {
    queue = [notAdmin];
    const r = await remove_division_approver({ division_id: DIV, user_id: USER }, ADMIN);
    assert.equal(r.success, false);
  });
});
