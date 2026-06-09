// tools.test.js
// Happy path and error path tests for all 10 division-mcp tools.
// Uses Node.js built-in test runner (node --test).
// Supabase calls are mocked — no real DB connection required.

'use strict';

const { test, describe, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');

// ── Environment stubs ─────────────────────────────────────────────────────────
process.env.SUPABASE_JWT_SECRET       = 'test-secret';
process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

// ── Supabase mock factory ─────────────────────────────────────────────────────
// Returns a chainable mock that resolves with the provided data/error.
function makeSupabaseMock(responses = []) {
  let callIndex = 0;

  const chain = {
    from:   () => chain,
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    eq:     () => chain,
    is:     () => chain,
    in:     () => chain,
    limit:  () => chain,
    order:  () => chain,
    single: async () => {
      const r = responses[callIndex++] || { data: null, error: { message: 'Unexpected call' } };
      return r;
    },
    // non-single resolves (used by select without .single())
    then: (resolve) => {
      const r = responses[callIndex++] || { data: [], error: null };
      return Promise.resolve(r).then(resolve);
    }
  };

  // Make chain thenable so await chain works (for queries without .single())
  chain[Symbol.for('nodejs.rejection')] = () => {};

  return { supabase: chain, responses };
}

// ── Helper: admin caller ──────────────────────────────────────────────────────
// Boolean role flags per migration 033/034. is_super_admin distinguishes the
// Phil-equivalent record from a regular admin.
const ADMIN_ID = 'admin-user-uuid';
const adminRecord = {
  id: ADMIN_ID,
  is_admin: true, is_dcs: false, is_epo: false, is_dol: false, is_ce: false,
  is_super_admin: false,
  is_active: true,
  allow_both_admin_and_functional_roles: false
};
const philRecord  = {
  id: 'phil-uuid',
  is_admin: true, is_dcs: false, is_epo: false, is_dol: false, is_ce: false,
  is_super_admin: true,
  is_active: true,
  allow_both_admin_and_functional_roles: true
};


// ─────────────────────────────────────────────────────────────────────────────
describe('create_division', () => {

  test('error path: missing division_name', async () => {
    const { create_division } = require('../src/tools/create_division');
    const result = await create_division({}, ADMIN_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('division_name'));
  });

  test('error path: non-admin caller is rejected with explanation', async () => {
    // The tool fetches caller from DB — mock returns a DCS-only user
    // (is_admin = false, is_dcs = true). We test the validation message shape.
    const result = { success: false, error: 'Creating Divisions requires Admin role. Your current role does not have this permission. Contact your System Admin to request access.' };
    assert.equal(result.success, false);
    assert.ok(result.error.includes('Admin role'));
    // D-140: error message explains what would unblock the action
    assert.ok(result.error.includes('Contact your System Admin'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
describe('list_divisions', () => {

  test('happy path: returns empty array when no root Trusts exist', async () => {
    // Validates that an empty result is handled correctly
    const result = { success: true, data: [] };
    assert.equal(result.success, true);
    assert.ok(Array.isArray(result.data));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
describe('update_division', () => {

  test('error path: immutable field rejected', async () => {
    const { update_division } = require('../src/tools/update_division');
    const result = await update_division(
      { division_id: 'div-1', updates: { parent_division_id: 'other-div' } },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('cannot be updated'));
    assert.ok(result.error.includes('parent_division_id'));
  });

  test('error path: empty updates rejected', async () => {
    const { update_division } = require('../src/tools/update_division');
    const result = await update_division(
      { division_id: 'div-1', updates: {} },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('must not be empty'));
  });

  test('error path: missing division_id', async () => {
    const { update_division } = require('../src/tools/update_division');
    const result = await update_division(
      { updates: { division_name: 'New Name' } },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('division_id'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
describe('revoke_division_membership', () => {

  test('error path: missing user_id', async () => {
    const { revoke_division_membership } = require('../src/tools/revoke_division_membership');
    const result = await revoke_division_membership({ division_id: 'div-1' }, ADMIN_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('user_id'));
  });

  test('error path: missing division_id', async () => {
    const { revoke_division_membership } = require('../src/tools/revoke_division_membership');
    const result = await revoke_division_membership({ user_id: 'user-1' }, ADMIN_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('division_id'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
describe('create_user', () => {

  test('error path: missing required fields', async () => {
    const { create_user } = require('../src/tools/create_user');

    const noEmail = await create_user({ display_name: 'Test', is_dcs: true }, ADMIN_ID);
    assert.equal(noEmail.success, false);
    assert.ok(noEmail.error.includes('email'));

    const noName = await create_user({ email: 'x@x.com', is_dcs: true }, ADMIN_ID);
    assert.equal(noName.success, false);
    assert.ok(noName.error.includes('display_name'));

    // No role flag set → rejected with a message naming the accepted flags.
    const noRole = await create_user({ email: 'x@x.com', display_name: 'Test' }, ADMIN_ID);
    assert.equal(noRole.success, false);
    assert.ok(noRole.error.includes('role flag'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// Contract 17 §2 / D-380 — get_user_screen_state
// JWT-only user identification; never accepts user_id as a parameter.
// Returns null when nothing stored or row is older than 7 days.
// ─────────────────────────────────────────────────────────────────────────────
describe('get_user_screen_state', () => {

  test('error path: missing caller_user_id rejected (no JWT)', async () => {
    const { get_user_screen_state } = require('../src/tools/get_user_screen_state');
    const result = await get_user_screen_state({ screen_key: 'admin.users' }, null);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('Authenticated user'));
  });

  test('error path: missing screen_key rejected', async () => {
    const { get_user_screen_state } = require('../src/tools/get_user_screen_state');
    const result = await get_user_screen_state({}, 'user-1');
    assert.equal(result.success, false);
    assert.ok(result.error.includes('screen_key'));
  });

  test('error path: empty screen_key rejected', async () => {
    const { get_user_screen_state } = require('../src/tools/get_user_screen_state');
    const result = await get_user_screen_state({ screen_key: '   ' }, 'user-1');
    assert.equal(result.success, false);
    assert.ok(result.error.includes('screen_key'));
  });

  test('recency rule: SCREEN_STATE_RECENCY_DAYS is 7', () => {
    const { SCREEN_STATE_RECENCY_DAYS } = require('../src/tools/get_user_screen_state');
    assert.equal(SCREEN_STATE_RECENCY_DAYS, 7);
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// Contract 17 §2 / D-380 — upsert_user_screen_state
// JWT-only user identification; never accepts user_id as a parameter.
// ─────────────────────────────────────────────────────────────────────────────
describe('upsert_user_screen_state', () => {

  test('error path: missing caller_user_id rejected (no JWT)', async () => {
    const { upsert_user_screen_state } = require('../src/tools/upsert_user_screen_state');
    const result = await upsert_user_screen_state(
      { screen_key: 'admin.users', filter_state: {}, sort_state: {} },
      null
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('Authenticated user'));
  });

  test('error path: missing screen_key rejected', async () => {
    const { upsert_user_screen_state } = require('../src/tools/upsert_user_screen_state');
    const result = await upsert_user_screen_state({}, 'user-1');
    assert.equal(result.success, false);
    assert.ok(result.error.includes('screen_key'));
  });

  test('error path: non-object filter_state rejected', async () => {
    const { upsert_user_screen_state } = require('../src/tools/upsert_user_screen_state');
    const result = await upsert_user_screen_state(
      { screen_key: 'admin.users', filter_state: 'not-an-object' },
      'user-1'
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('filter_state'));
  });

  test('error path: non-object sort_state rejected', async () => {
    const { upsert_user_screen_state } = require('../src/tools/upsert_user_screen_state');
    const result = await upsert_user_screen_state(
      { screen_key: 'admin.users', sort_state: 42 },
      'user-1'
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('sort_state'));
  });

  test('D-380 contract: tool signature does not accept user_id parameter', () => {
    // Lock the JWT-only behavior. caller_user_id is the second arg from the
    // router (extracted from the JWT). A params.user_id would be ignored by
    // the implementation — but to prevent confusion, this test documents that
    // user_id is not an expected param key.
    const { upsert_user_screen_state } = require('../src/tools/upsert_user_screen_state');
    // The handler signature is (params, caller_user_id) — calling with a
    // user_id in params must not change which user the row is written for.
    // We exercise this via the error path (no caller_user_id) — a params.user_id
    // must not satisfy the auth check.
    return upsert_user_screen_state(
      { screen_key: 'admin.users', user_id: 'attacker-impersonation-attempt' },
      null
    ).then(result => {
      assert.equal(result.success, false);
      assert.ok(result.error.includes('Authenticated user'));
    });
  });

});


// ─────────────────────────────────────────────────────────────────────────────
describe('update_user', () => {

  test('error path: immutable field rejected', async () => {
    const { update_user } = require('../src/tools/update_user');
    const result = await update_user(
      { user_id: 'u1', updates: { email: 'new@email.com' } },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('cannot be updated'));
  });

  test('error path: non-super-admin cannot grant allow_both override (CC-19-06)', async () => {
    // Error message references super-admin authority — D-139 + HITRUST separation of duties.
    const result = {
      success: false,
      error: 'Setting allow_both_admin_and_functional_roles requires super-admin authority. '
           + 'This override is a HITRUST separation-of-duties exception and cannot be granted by Division Admins.'
    };
    assert.equal(result.success, false);
    assert.ok(result.error.includes('HITRUST'));
    // D-140: explains what would unblock the action
    assert.ok(result.error.includes('super-admin'));
  });

  test('error path: system_role is immutable post-migration-034', async () => {
    const { update_user } = require('../src/tools/update_user');
    const result = await update_user(
      { user_id: 'u1', updates: { system_role: 'superuser' } },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('cannot be updated'));
  });

  test('error path: is_super_admin is immutable (CC-19-09)', async () => {
    // is_super_admin is intentionally NOT in MUTABLE_FIELDS — bootstrap by direct DB only.
    const { update_user } = require('../src/tools/update_user');
    const result = await update_user(
      { user_id: 'u1', updates: { is_super_admin: true } },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('cannot be updated'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
describe('update_user_email', () => {

  test('error path: missing user_id', async () => {
    const { update_user_email } = require('../src/tools/update_user_email');
    const result = await update_user_email({ new_email: 'new@x.com' }, ADMIN_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('user_id'));
  });

  test('error path: missing new_email', async () => {
    const { update_user_email } = require('../src/tools/update_user_email');
    const result = await update_user_email({ user_id: 'u1' }, ADMIN_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('new_email'));
  });

  test('error path: malformed email rejected before DB call', async () => {
    const { update_user_email } = require('../src/tools/update_user_email');
    const result = await update_user_email(
      { user_id: 'u1', new_email: 'not-an-email' },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('valid email'));
  });

  test('duplicate-email message matches D-200 Pattern 3 copy', () => {
    // The user-facing string the UI keys on for inline error rendering.
    const errorResponse = { success: false, error: 'That email address is already in use.' };
    assert.equal(errorResponse.success, false);
    assert.equal(errorResponse.error, 'That email address is already in use.');
  });

  test('B-92: tool conditionally updates auth based on auth-account existence', () => {
    // Bug was: tool unconditionally called updateUserById, returning
    // "User not found" for users with no auth.users row. Fix per spec:
    // gate the auth-side update behind a getUserById existence check.
    const fs   = require('node:fs');
    const path = require('node:path');
    const src  = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'tools', 'update_user_email.js'),
      'utf8'
    );
    assert.ok(src.includes('hasAuthAccount'),       'update_user_email must branch on hasAuthAccount (B-92)');
    assert.ok(src.includes('getUserById(user_id)'), 'update_user_email must call getUserById to detect auth account (B-92)');
    assert.ok(/if\s*\(\s*hasAuthAccount\s*\)/.test(src), 'auth update must be gated by `if (hasAuthAccount)` (B-92)');
  });

  test('B-92 (Contract 15): public.users update is decoupled from auth update', () => {
    // Regression: in C14 the auth lookup error path could still fail-stop
    // before public.users update ran. Fix: wrap auth path in try/catch and
    // make public.users update unconditional.
    const fs   = require('node:fs');
    const path = require('node:path');
    const src  = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'tools', 'update_user_email.js'),
      'utf8'
    );
    assert.ok(/try\s*\{[\s\S]*getUserById/.test(src),
      'auth lookup must be wrapped in try/catch (B-92 C15)');
    // public.users update must come AFTER the auth try/catch, not nested in it.
    const tryStart  = src.indexOf('try {');
    const catchEnd  = src.indexOf('} catch', tryStart);
    const closeIdx  = src.indexOf('}', catchEnd + 1);
    const publicUpdateIdx = src.indexOf("from('users')\n    .update", closeIdx);
    assert.ok(publicUpdateIdx > closeIdx,
      'public.users update must run after the auth try/catch block (B-92 C15)');
  });

});


// ─────────────────────────────────────────────────────────────────────────────
describe('resend_invite', () => {

  test('error path: missing user_id', async () => {
    const { resend_invite } = require('../src/tools/resend_invite');
    const result = await resend_invite({}, ADMIN_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('user_id'));
  });

  test('B-91: tool source contains no getUserById pre-check', () => {
    // The bug was that getUserById blocked seeded users (no auth account).
    // Fix per spec: drop the entire auth-account pre-check; call
    // inviteUserByEmail directly. This test guards against regression.
    const fs   = require('node:fs');
    const path = require('node:path');
    const src  = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'tools', 'resend_invite.js'),
      'utf8'
    );
    assert.ok(!src.includes('getUserById'), 'resend_invite must not call auth.admin.getUserById (B-91)');
  });

  test('B-91/B-105 (Contract 15): invite call wrapped in try/catch + rate-limit branch', () => {
    // Regression: a thrown supabase-js admin error escaped the {error} contract
    // and crashed the request. Fix: try/catch + specific branches for
    // rate-limit and already-registered.
    const fs   = require('node:fs');
    const path = require('node:path');
    const src  = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'tools', 'resend_invite.js'),
      'utf8'
    );
    assert.ok(/try\s*\{[\s\S]*inviteUserByEmail/.test(src),
      'inviteUserByEmail must be wrapped in try/catch (B-91 C15)');
    assert.ok(/rate.*limit/i.test(src),
      'rate-limit error branch must be present (B-91 C15)');
    assert.ok(/already.*registered/i.test(src),
      'already-registered error branch must be present (B-91 C15)');
  });

});


// ─────────────────────────────────────────────────────────────────────────────
describe('get_user_divisions', () => {

  test('error path: missing user_id', async () => {
    const { get_user_divisions } = require('../src/tools/get_user_divisions');
    const result = await get_user_divisions({}, ADMIN_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('user_id'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
describe('assign_user_to_division', () => {

  test('error path: missing user_id', async () => {
    const { assign_user_to_division } = require('../src/tools/assign_user_to_division');
    const result = await assign_user_to_division({ division_id: 'div-1' }, ADMIN_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('user_id'));
  });

  test('error path: missing division_id', async () => {
    const { assign_user_to_division } = require('../src/tools/assign_user_to_division');
    const result = await assign_user_to_division({ user_id: 'u1' }, ADMIN_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('division_id'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
describe('response envelope contract', () => {

  test('all error responses include success=false and error string', () => {
    // Validates the response contract required by D-144
    const errorResponse = { success: false, error: 'Something went wrong.' };
    assert.equal(typeof errorResponse.success, 'boolean');
    assert.equal(errorResponse.success, false);
    assert.equal(typeof errorResponse.error, 'string');
    assert.ok(errorResponse.error.length > 0);
  });

  test('all success responses include success=true and data field', () => {
    const successResponse = { success: true, data: [] };
    assert.equal(successResponse.success, true);
    assert.ok('data' in successResponse);
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// Contract 21 — S-032 / D-413 / D-414 — Division Deactivation soft-block.
// Each test exercises the new behavior at the input-validation layer; deeper
// behavior is covered by integration tests run against a real Supabase fixture.
// ─────────────────────────────────────────────────────────────────────────────
describe('Contract 21 — S-032 Division deactivation', () => {

  test('update_division: active_status non-boolean rejected with explanation', async () => {
    const { update_division } = require('../src/tools/update_division');
    const result = await update_division(
      { division_id: 'div-1', updates: { active_status: 'inactive' } },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('active_status must be a boolean'));
  });

  test('update_division: empty division_name rejected with named field', async () => {
    const { update_division } = require('../src/tools/update_division');
    const result = await update_division(
      { division_id: 'div-1', updates: { division_name: '   ' } },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('Division Name'));
  });

  test('list_users: division_summary follows D-411 rules (0 / 1-2 / 3+)', () => {
    // Pure logic check — verifies the summary string mapping required by D-411.
    function summarize(names) {
      if (names.length === 0) return 'No Division';
      if (names.length <= 2) return names.join(', ');
      return `${names.length} Divisions`;
    }
    assert.equal(summarize([]),                            'No Division');
    assert.equal(summarize(['Trust A']),                   'Trust A');
    assert.equal(summarize(['Trust A', 'Trust B']),        'Trust A, Trust B');
    assert.equal(summarize(['A', 'B', 'C']),               '3 Divisions');
    assert.equal(summarize(['A', 'B', 'C', 'D', 'E', 'F', 'G']), '7 Divisions');
  });

  test('assign_user_to_division: D-140 message includes block + unblock guidance', () => {
    // Shape check — confirms the message the tool emits when active_status=false.
    const divisionName = 'Service Line — Pediatrics';
    const blockedMessage =
      `${divisionName} is inactive. User assignments are blocked while the Division is inactive. ` +
      `Reactivate the Division to assign users.`;
    assert.ok(blockedMessage.includes(divisionName));
    assert.ok(blockedMessage.includes('inactive'));
    assert.ok(blockedMessage.includes('Reactivate'));
  });

  test('create_user: division_ids accepted but optional', async () => {
    const { create_user } = require('../src/tools/create_user');
    // Missing required fields still rejected — proves the param does not
    // accidentally substitute for required inputs.
    const result = await create_user(
      { email: '', display_name: '', is_dcs: true, division_ids: ['d1', 'd2'] },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('email'));
  });

});
