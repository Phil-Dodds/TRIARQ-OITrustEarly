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

require.cache[require.resolve('../src/db')] = {
  id:       require.resolve('../src/db'),
  filename: require.resolve('../src/db'),
  loaded:   true,
  exports: {
    supabase: {
      auth: {
        getUser: (token) => mockGetUser.fn(token)
      }
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

  test('accepts valid token and attaches auth to req', async () => {
    mockGetUser.fn = async () => ({
      data: { user: { id: 'user-abc', email: 'user@test.com' } },
      error: null
    });

    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = mockRes();
    let nextCalled = false;

    await validateJwt(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.auth.user_id, 'user-abc');
    assert.equal(req.auth.email, 'user@test.com');
    assert.equal(res._status, null); // no error response sent
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
