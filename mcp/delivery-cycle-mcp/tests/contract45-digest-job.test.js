// contract45-digest-job.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 45, D-643).
//
// Two things here must not be wrong:
//   1. The internal-key door. It is the first non-JWT auth path in the system,
//      so its failure modes are worth pinning explicitly — especially that an
//      UNSET env var closes the route rather than opening it.
//   2. The job's idempotence and suppression. "The cron fired twice" is a
//      normal operational event and must not become a user-visible one.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

let queue = [];
let updates = [];
let lastTable = null;
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }

const chain = {
  from(t) { lastTable = t; return chain; },
  select: () => chain,
  insert: () => chain,
  eq:     () => chain,
  is:     () => chain,
  in:     () => chain,
  not:    () => chain,
  order:  () => chain,
  limit:  () => chain,
  update(patch) {
    const table = lastTable;
    return { in: (_c, ids) => { updates.push({ table, patch, ids }); return Promise.resolve({ error: null }); } };
  },
  single:      async () => nextResp({ data: null, error: null }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const sentEmails = [];
const emailPath = require.resolve('../src/tools/helpers/notification-email');
require.cache[emailPath] = {
  id: emailPath, filename: emailPath, loaded: true,
  exports: {
    sendGateNotificationEmail: async (args) => { sentEmails.push(args); return { ok: true }; },
    APP_BASE_URL: 'https://app.example'
  }
};

const { run_daily_digest } = require('../src/tools/run_daily_digest');
const { requireInternalKey, safeEqual } = require('../src/middleware/internal-key');

const DANA = 'dana-u', MAYA = 'maya-u';
const qrow = (over = {}) => ({
  notification_id: 'n1', recipient_user_id: DANA, event_type: 'informed_gate_decision',
  delivery_class: 'digest', initiative_id: 'init-1', gate_record_id: null,
  headline: 'Go to Build was approved.', detail: null, manager_copy: false,
  created_at: '2026-08-03T01:00:00.000Z', ...over
});
const userRow = (id, email) => ({ id, display_name: 'Dana', email, is_active: true });

beforeEach(() => { queue = []; updates = []; sentEmails.length = 0; });

// ─────────────────────────────────────────────────────────────────────────────
describe('internal-key door (Arch-4 RENDER_INTERNAL_API_KEY)', () => {

  const mockRes = () => {
    const r = { statusCode: null, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json   = (b) => { r.body = b; return r; };
    return r;
  };

  test('an UNSET env var DISABLES the route — it does not open it', () => {
    delete process.env.RENDER_INTERNAL_API_KEY;
    const res = mockRes();
    let nexted = false;
    requireInternalKey({ headers: { 'x-internal-api-key': 'anything' } }, res, () => { nexted = true; });

    assert.equal(nexted, false, 'must not pass through');
    assert.equal(res.statusCode, 404, 'missing config reads as no route, never as no auth');
  });

  test('a wrong key is rejected 401 without explaining why', () => {
    process.env.RENDER_INTERNAL_API_KEY = 'correct-horse';
    const res = mockRes();
    let nexted = false;
    requireInternalKey({ headers: { 'x-internal-api-key': 'wrong' } }, res, () => { nexted = true; });

    assert.equal(nexted, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, 'Unauthorized.', 'no detail leaked');
    delete process.env.RENDER_INTERNAL_API_KEY;
  });

  test('a missing header is rejected', () => {
    process.env.RENDER_INTERNAL_API_KEY = 'correct-horse';
    const res = mockRes();
    let nexted = false;
    requireInternalKey({ headers: {} }, res, () => { nexted = true; });
    assert.equal(nexted, false);
    assert.equal(res.statusCode, 401);
    delete process.env.RENDER_INTERNAL_API_KEY;
  });

  test('the correct key passes through', () => {
    process.env.RENDER_INTERNAL_API_KEY = 'correct-horse';
    const res = mockRes();
    let nexted = false;
    requireInternalKey({ headers: { 'x-internal-api-key': 'correct-horse' } }, res, () => { nexted = true; });
    assert.equal(nexted, true);
    assert.equal(res.statusCode, null, 'no response written — request continues');
    delete process.env.RENDER_INTERNAL_API_KEY;
  });

  test('comparison is length-safe and does not throw on mismatched lengths', () => {
    assert.equal(safeEqual('abc', 'abcdef'), false);
    assert.equal(safeEqual('abc', 'abc'), true);
    assert.equal(safeEqual('', ''), true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('run_daily_digest', () => {

  test('an empty queue sends nothing and reports zero', async () => {
    queue = [{ data: [], error: null }];
    const r = await run_daily_digest();
    assert.equal(r.success, true);
    assert.equal(r.data.recipients, 0);
    assert.equal(sentEmails.length, 0);
  });

  test('one recipient gets one email, and their rows are stamped sent', async () => {
    queue = [
      { data: [qrow(), qrow({ notification_id: 'n2', headline: 'Go to Deploy was approved.' })], error: null },
      { data: [userRow(DANA, 'dana@x.com')], error: null }
    ];

    const r = await run_daily_digest();

    assert.equal(r.success, true);
    assert.equal(r.data.recipients, 1);
    assert.equal(r.data.sent, 1);
    assert.equal(sentEmails.length, 1, 'ONE email per recipient per day');
    assert.match(sentEmails[0].contextParagraph, /Completed/);
    assert.equal(sentEmails[0].email_type, 'daily_digest');

    const stamp = updates.find(u => u.patch.sent_at);
    assert.ok(stamp, 'rows stamped sent_at');
    assert.deepEqual(stamp.ids.sort(), ['n1', 'n2']);
  });

  test('two recipients get two separate emails, never a shared one', async () => {
    queue = [
      { data: [qrow(), qrow({ notification_id: 'n2', recipient_user_id: MAYA })], error: null },
      { data: [userRow(DANA, 'dana@x.com'), { ...userRow(MAYA, 'maya@x.com'), display_name: 'Maya' }], error: null }
    ];
    const r = await run_daily_digest();
    assert.equal(r.data.recipients, 2);
    assert.equal(sentEmails.length, 2);
  });

  test('dry_run assembles but sends and stamps nothing', async () => {
    queue = [
      { data: [qrow()], error: null },
      { data: [userRow(DANA, 'dana@x.com')], error: null }
    ];
    const r = await run_daily_digest({ dry_run: true });
    assert.equal(r.data.sent, 1, 'reports what it WOULD send');
    assert.equal(sentEmails.length, 0, 'but sends nothing');
    assert.equal(updates.length, 0, 'and stamps nothing — a second run is unaffected');
  });

  test('a recipient with no email address is stamped, not retried forever', async () => {
    queue = [
      { data: [qrow()], error: null },
      { data: [{ id: DANA, display_name: 'Dana', email: null, is_active: true }], error: null }
    ];
    const r = await run_daily_digest();
    assert.equal(r.data.sent, 0);
    assert.equal(sentEmails.length, 0);
    assert.ok(updates.find(u => u.patch.sent_at), 'rows cleared so they do not accumulate');
  });

  test('a deactivated user is skipped', async () => {
    queue = [
      { data: [qrow()], error: null },
      { data: [{ id: DANA, display_name: 'Dana', email: 'dana@x.com', is_active: false }], error: null }
    ];
    const r = await run_daily_digest();
    assert.equal(sentEmails.length, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('pre-send suppression (D-643)', () => {

  test('an at-risk line is suppressed when the Initiative is no longer overdue', async () => {
    queue = [
      { data: [qrow({ event_type: 'initiative_at_risk', headline: 'Pre-Auth is at risk.' })], error: null },
      // resolveSuppressions → delivery_cycles lookup: resolved overnight
      { data: [{ delivery_cycle_id: 'init-1', current_lifecycle_stage: 'BUILD', status_overdue: false }], error: null },
      { data: [userRow(DANA, 'dana@x.com')], error: null }
    ];

    const r = await run_daily_digest();

    assert.equal(r.data.suppressed, 1);
    assert.equal(sentEmails.length, 0, 'nothing left to say, so nothing is sent');
    assert.ok(updates.find(u => u.patch.suppressed_at), 'stamped suppressed, not sent');
  });

  test('an at-risk line still standing is sent', async () => {
    queue = [
      { data: [qrow({ event_type: 'initiative_at_risk', headline: 'Pre-Auth is at risk.' })], error: null },
      { data: [{ delivery_cycle_id: 'init-1', current_lifecycle_stage: 'BUILD', status_overdue: true }], error: null },
      { data: [userRow(DANA, 'dana@x.com')], error: null }
    ];
    const r = await run_daily_digest();
    assert.equal(r.data.suppressed, 0);
    assert.equal(sentEmails.length, 1);
    assert.match(sentEmails[0].contextParagraph, /At risk/);
  });

  test('a state line for a cancelled Initiative is suppressed', async () => {
    queue = [
      { data: [qrow({ event_type: 'initiative_blocked', headline: 'Pre-Auth is blocked.' })], error: null },
      { data: [{ delivery_cycle_id: 'init-1', current_lifecycle_stage: 'CANCELLED', status_overdue: true }], error: null },
      { data: [userRow(DANA, 'dana@x.com')], error: null }
    ];
    const r = await run_daily_digest();
    assert.equal(r.data.suppressed, 1);
  });

  test('historical facts are NEVER re-checked — a completed gate stays reported', async () => {
    // Only blocked/at_risk are state. An approval happened; it cannot un-happen.
    queue = [
      { data: [qrow({ event_type: 'informed_gate_decision' })], error: null },
      { data: [userRow(DANA, 'dana@x.com')], error: null }
    ];
    const r = await run_daily_digest();
    assert.equal(r.data.suppressed, 0);
    assert.equal(sentEmails.length, 1);
  });
});
