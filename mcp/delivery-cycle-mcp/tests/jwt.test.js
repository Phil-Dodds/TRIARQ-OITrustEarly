// jwt.test.js
// Tests for JWT validation middleware — delivery-cycle-mcp.
// Uses Node.js built-in test runner (node --test).
// Supabase auth.getUser() is mocked — no real network calls.

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ── Environment stubs ─────────────────────────────────────────────────────────
process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

// ── Mock supabase db module before requiring middleware ───────────────────────
const mockGetUser = { fn: null };
// Registered-user lookup result for the security gate (defaults to an active row).
const mockUserRow = { row: { id: 'user-abc', is_active: true }, error: null };

function chainableUsers() {
  const chain = {};
  chain.select = () => chain;
  chain.eq     = () => chain;
  chain.is     = () => chain;
  chain.maybeSingle = async () => ({ data: mockUserRow.row, error: mockUserRow.error });
  chain.update = () => chain;
  chain.then   = (resolve) => resolve({ data: null, error: null });
  return chain;
}

require.cache[require.resolve('../src/db')] = {
  id:       require.resolve('../src/db'),
  filename: require.resolve('../src/db'),
  loaded:   true,
  exports: {
    supabase: {
      auth: {
        getUser: (token) => mockGetUser.fn(token)
      },
      from: () => chainableUsers()
    }
  }
};

const { validateJwt } = require('../src/middleware/jwt');

// ── Helper ────────────────────────────────────────────────────────────────────
function mockRes() {
  const res = { _status: null, _body: null };
  res.status = (code) => { res._status = code; return res; };
  res.json   = (body) => { res._body  = body; return res; };
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
describe('validateJwt middleware', () => {

  test('rejects request with no Authorization header', async () => {
    const req = { headers: {} };
    const res = mockRes();
    let nextCalled = false;

    await validateJwt(req, res, () => { nextCalled = true; });

    assert.equal(res._status, 401);
    assert.equal(res._body.success, false);
    assert.ok(res._body.error.includes('Authorization header'));
    assert.equal(nextCalled, false);
  });

  test('rejects request with malformed Authorization header (no Bearer prefix)', async () => {
    const req = { headers: { authorization: 'Token abc123' } };
    const res = mockRes();
    let nextCalled = false;

    await validateJwt(req, res, () => { nextCalled = true; });

    assert.equal(res._status, 401);
    assert.equal(res._body.success, false);
    assert.equal(nextCalled, false);
  });

  test('rejects when Supabase auth.getUser returns an error', async () => {
    mockGetUser.fn = async () => ({ data: { user: null }, error: { message: 'invalid token' } });

    const req = { headers: { authorization: 'Bearer bad-token' } };
    const res = mockRes();
    let nextCalled = false;

    await validateJwt(req, res, () => { nextCalled = true; });

    assert.equal(res._status, 401);
    assert.equal(res._body.success, false);
    assert.ok(res._body.error.includes('JWT validation failed'));
    assert.equal(nextCalled, false);
  });

  test('rejects when Supabase returns no user', async () => {
    mockGetUser.fn = async () => ({ data: { user: null }, error: null });

    const req = { headers: { authorization: 'Bearer empty-user-token' } };
    const res = mockRes();
    let nextCalled = false;

    await validateJwt(req, res, () => { nextCalled = true; });

    assert.equal(res._status, 401);
    assert.equal(res._body.success, false);
    assert.equal(nextCalled, false);
  });

  test('accepts valid token from a registered active user', async () => {
    mockGetUser.fn = async () => ({
      data: { user: { id: 'user-abc', email: 'user@test.com' } },
      error: null
    });
    mockUserRow.row = { id: 'user-abc', is_active: true };
    mockUserRow.error = null;

    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = mockRes();
    let nextCalled = false;

    await validateJwt(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.auth.user_id, 'user-abc');
    assert.equal(req.auth.email, 'user@test.com');
    assert.equal(res._status, null); // no error response sent
  });

  // SECURITY (D-302/D-354): valid token whose identity has no active public.users
  // row must be refused — Supabase OTP authenticates any email.
  test('rejects a valid token with no registered public.users row', async () => {
    mockGetUser.fn = async () => ({
      data: { user: { id: 'ghost-user', email: 'unregistered@triarqhealth.com' } },
      error: null
    });
    mockUserRow.row = null;
    mockUserRow.error = null;

    const req = { headers: { authorization: 'Bearer valid-but-unregistered' } };
    const res = mockRes();
    let nextCalled = false;

    await validateJwt(req, res, () => { nextCalled = true; });

    assert.equal(res._status, 401);
    assert.equal(nextCalled, false);
    assert.ok(res._body.error.includes('not provisioned'));

    mockUserRow.row = { id: 'user-abc', is_active: true };
  });

  test('rejects when auth.getUser throws unexpectedly', async () => {
    mockGetUser.fn = async () => { throw new Error('Network error'); };

    const req = { headers: { authorization: 'Bearer throws-token' } };
    const res = mockRes();
    let nextCalled = false;

    await validateJwt(req, res, () => { nextCalled = true; });

    assert.equal(res._status, 401);
    assert.equal(res._body.success, false);
    assert.equal(nextCalled, false);
  });

});
