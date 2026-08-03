// contract45-notification-queue.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 45, D-641/D-642).
//
// The queue helper carries three rules that fail silently if wrong — a message
// batched that should have been immediate, a loud exception quietly fanned out
// to someone's manager, a duplicate row for a person holding two stakes. All
// three are invisible in production until someone complains, so they are
// pinned here.
//
// Supabase mocked via require.cache; writes captured rather than queued, since
// what matters is the SHAPE of the rows, not a fixture sequence.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

// Captured writes and the canned manager lookup.
let insertedRows = [];
let managerRows  = [];
let updatedSets  = [];
let lastTable    = null;

const chain = {
  from(t) { lastTable = t; return chain; },
  select: () => chain,
  eq:     () => chain,
  is:     () => chain,
  in:     () => chain,
  not:    () => chain,
  order:  () => chain,
  limit:  () => chain,
  insert(rows) {
    insertedRows = insertedRows.concat(rows);
    // .insert().select() resolves to the written rows, with ids assigned.
    const withIds = rows.map((r, i) => ({
      notification_id: `n-${insertedRows.length - rows.length + i}`,
      recipient_user_id: r.recipient_user_id,
      delivery_class: r.delivery_class
    }));
    return {
      select: () => Promise.resolve({ data: withIds, error: null })
    };
  },
  update(patch) {
    return {
      in: (_col, ids) => {
        updatedSets.push({ patch, ids });
        return Promise.resolve({ data: null, error: null });
      }
    };
  },
  // The only plain-await query in the helper is the manager lookup.
  then(resolve) {
    return Promise.resolve({ data: managerRows, error: null }).then(resolve);
  }
};

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const sentEmails = [];
const emailPath = require.resolve('../src/tools/helpers/notification-email');
require.cache[emailPath] = {
  id: emailPath, filename: emailPath, loaded: true,
  exports: { sendGateNotificationEmail: async (args) => { sentEmails.push(args); return { ok: true }; } }
};

const {
  enqueueNotifications, isLoudEvent, LOUD_EVENT_TYPES
} = require('../src/tools/helpers/notification-queue');

const DANA = 'dana-u', EVAN = 'evan-u', CASEY = 'casey-u', MAYA = 'maya-u';

const person = (id, name, email, cls) =>
  ({ user_id: id, display_name: name, email, delivery_class: cls });

beforeEach(() => {
  insertedRows = []; managerRows = []; updatedSets = []; sentEmails.length = 0;
});

describe('delivery classification (D-641)', () => {

  test('immediate recipients are written immediate AND dispatched now', async () => {
    const r = await enqueueNotifications({
      event_type: 'gate_submitted',
      recipients: [person(DANA, 'Dana', 'dana@x.com', 'immediate')],
      headline:   "Maya's Go to Build is waiting on you.",
      subject:    'Go to Build submitted',
      initiative_id: 'init-1'
    });

    assert.equal(r.queued, 1);
    assert.equal(r.immediate, 1);
    assert.equal(insertedRows[0].delivery_class, 'immediate');
    assert.equal(sentEmails.length, 1, 'immediate class dispatches on write');
    assert.equal(updatedSets.length, 1, 'sent_at stamped');
    assert.ok(updatedSets[0].patch.sent_at);
  });

  test('digest recipients are queued and NOT emailed', async () => {
    const r = await enqueueNotifications({
      event_type: 'gate_approved',
      recipients: [person(CASEY, 'Casey', 'casey@x.com', 'digest')],
      headline:   'Go to Build was approved.',
      initiative_id: 'init-1'
    });

    assert.equal(r.queued, 1);
    assert.equal(r.immediate, 0);
    assert.equal(insertedRows[0].delivery_class, 'digest');
    assert.equal(sentEmails.length, 0, 'digest accumulates — nothing sent now');
    assert.equal(updatedSets.length, 0, 'nothing stamped sent');
  });

  test('an unspecified class defaults to digest, not immediate', async () => {
    await enqueueNotifications({
      event_type: 'gate_approved',
      recipients: [{ user_id: CASEY, display_name: 'Casey', email: 'casey@x.com' }],
      headline:   'Go to Build was approved.'
    });

    assert.equal(insertedRows[0].delivery_class, 'digest',
      'the safe default — the blocking class is always stated explicitly');
  });

  test('one person holding two stakes gets ONE row, and immediate wins', async () => {
    const r = await enqueueNotifications({
      event_type: 'gate_submitted',
      recipients: [
        person(DANA, 'Dana', 'dana@x.com', 'digest'),     // as Informed
        person(DANA, 'Dana', 'dana@x.com', 'immediate')   // and as trio
      ],
      headline: 'Go to Build submitted.'
    });

    assert.equal(r.queued, 1, 'deduplicated by user id');
    assert.equal(insertedRows[0].delivery_class, 'immediate',
      'the stronger obligation governs');
  });
});

describe('the four loud exceptions (D-641)', () => {

  test('every loud type is forced immediate even when the caller says digest', async () => {
    for (const event_type of LOUD_EVENT_TYPES) {
      insertedRows = []; sentEmails.length = 0; managerRows = [];
      await enqueueNotifications({
        event_type,
        recipients: [person(DANA, 'Dana', 'dana@x.com', 'digest')],
        headline:   'Your instrument was overridden.'
      });
      assert.equal(insertedRows[0].delivery_class, 'immediate',
        `${event_type} must never be batched`);
      assert.equal(sentEmails.length, 1, `${event_type} must go out now`);
    }
  });

  test('the loud four are never fanned out to a manager', async () => {
    managerRows = [{ id: DANA, manager_user_id: MAYA }];

    await enqueueNotifications({
      event_type: 'ie_override',
      recipients: [person(DANA, 'Dana', 'dana@x.com', 'immediate')],
      headline:   'An IE approved over your assignment.'
    });

    assert.equal(insertedRows.length, 1, 'no manager copy');
    assert.ok(!insertedRows.some(r => r.recipient_user_id === MAYA),
      'person-specific override is not the manager\'s business');
  });

  test('isLoudEvent is exactly the four', () => {
    assert.equal(LOUD_EVENT_TYPES.length, 4);
    assert.ok(isLoudEvent('oversight_cleared'));
    assert.ok(isLoudEvent('governance_level_lowered'));
    assert.ok(isLoudEvent('ie_override'));
    assert.ok(isLoudEvent('approved_over_returned_consultation'));
    assert.ok(!isLoudEvent('gate_submitted'));
  });
});

describe('manager fan-out (D-642)', () => {

  test('a parallel DIGEST row is written to the manager, manager-framed', async () => {
    managerRows = [{ id: DANA, manager_user_id: MAYA }];

    const r = await enqueueNotifications({
      event_type: 'gate_returned',
      recipients: [person(DANA, 'Dana', 'dana@x.com', 'immediate')],
      headline:   'Go to Build was returned.',
      initiative_id: 'init-1'
    });

    assert.equal(r.fannedOut, 1);
    const managerRow = insertedRows.find(x => x.recipient_user_id === MAYA);
    assert.ok(managerRow, 'manager receives a copy');
    assert.equal(managerRow.delivery_class, 'digest',
      'a manager copy is awareness — it batches even when the report\'s did not');
    assert.match(managerRow.headline, /^Dana — /, 'manager-framed headline names the report');
  });

  test('no duplicate when the manager is already a direct recipient', async () => {
    managerRows = [{ id: DANA, manager_user_id: MAYA }];

    await enqueueNotifications({
      event_type: 'gate_returned',
      recipients: [
        person(DANA, 'Dana', 'dana@x.com', 'immediate'),
        person(MAYA, 'Maya', 'maya@x.com', 'immediate')   // manager is also trio
      ],
      headline: 'Go to Build was returned.'
    });

    const mayaRows = insertedRows.filter(x => x.recipient_user_id === MAYA);
    assert.equal(mayaRows.length, 1, 'one row, not a direct copy plus a fan-out copy');
    assert.equal(mayaRows[0].delivery_class, 'immediate', 'her own stake governs');
  });

  test('fanOutToManagers=false suppresses it entirely', async () => {
    managerRows = [{ id: DANA, manager_user_id: MAYA }];

    await enqueueNotifications({
      event_type: 'gate_returned',
      recipients: [person(DANA, 'Dana', 'dana@x.com', 'immediate')],
      headline:   'Go to Build was returned.',
      fanOutToManagers: false
    });

    assert.equal(insertedRows.length, 1);
  });

  test('no recipients means no write and no send', async () => {
    const r = await enqueueNotifications({
      event_type: 'gate_returned', recipients: [], headline: 'x'
    });
    assert.deepEqual(r, { queued: 0, immediate: 0, fannedOut: 0 });
    assert.equal(insertedRows.length, 0);
    assert.equal(sentEmails.length, 0);
  });
});

describe('headlines render at write time (D-463 pattern)', () => {
  test('the stored headline is the finished text, not ids to resolve later', async () => {
    await enqueueNotifications({
      event_type: 'gate_submitted',
      recipients: [person(DANA, 'Dana', 'dana@x.com', 'immediate')],
      headline:   "Maya's Go to Build on Referral Leakage has waited 9 days on Sabrina K.",
      detail:     'Scope is not bounded yet.'
    });

    assert.match(insertedRows[0].headline, /waited 9 days on Sabrina K\./);
    assert.equal(insertedRows[0].detail, 'Scope is not bounded yet.');
  });
});
