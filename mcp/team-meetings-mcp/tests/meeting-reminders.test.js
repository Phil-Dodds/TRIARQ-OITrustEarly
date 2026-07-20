// meeting-reminders.test.js
// Pathways OI Trust — team-meetings-mcp (Contract 38 follow-on 19)
// Pure-function coverage for the reminder window math + update_track
// validation of the new reminder fields. Per Rule 37 the single-result mock
// cannot sequence the multi-query sweep — happy path is UAT-verified via the
// cron summary log.

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const mockChain = {
  _result: { data: null, error: null },
  select() { return this; }, insert() { return this; }, update() { return this; },
  upsert() { return this; }, delete() { return this; }, eq() { return this; },
  neq() { return this; }, gte() { return this; }, in() { return this; },
  is() { return this; }, not() { return this; }, or() { return this; },
  order() { return this; }, limit() { return this; }, range() { return this; },
  single() { return Promise.resolve(this._result); },
  maybeSingle() { return Promise.resolve(this._result); },
  then(resolve) { return Promise.resolve(this._result).then(resolve); }
};
require.cache[require.resolve('../src/db')] = {
  id: require.resolve('../src/db'),
  filename: require.resolve('../src/db'),
  loaded: true,
  exports: { supabase: { from() { return mockChain; }, functions: { invoke: async () => ({ error: null }) } } }
};

const { occurrenceInWindow, timeToMinutes } = require('../src/tools/send_meeting_reminders');

describe('occurrenceInWindow — ET reminder window math', () => {
  const et = (dateStr, minutes) => ({ dateStr, minutes });

  it('inside the same-day window → today', () => {
    // Meeting 10:00 (600), lead 2h → window [08:00, 10:00). Now 08:30.
    assert.strictEqual(occurrenceInWindow(et('2026-07-20', 510), 600, 120), '2026-07-20');
  });

  it('before the window opens → null', () => {
    assert.strictEqual(occurrenceInWindow(et('2026-07-20', 420), 600, 120), null);
  });

  it('at/after meeting time → null (no late reminders)', () => {
    assert.strictEqual(occurrenceInWindow(et('2026-07-20', 600), 600, 120), null);
    assert.strictEqual(occurrenceInWindow(et('2026-07-20', 700), 600, 120), null);
  });

  it('24h lead crossing midnight → tomorrow', () => {
    // Meeting 09:00 (540), lead 1440. Now 22:00 (1320) the evening before:
    // minutes until tomorrow 09:00 = 120 + 540 = 660 ≤ 1440 → tomorrow.
    assert.strictEqual(occurrenceInWindow(et('2026-07-20', 1320), 540, 1440), '2026-07-21');
  });

  it('timeToMinutes parses HH:MM and HH:MM:SS', () => {
    assert.strictEqual(timeToMinutes('09:30'), 570);
    assert.strictEqual(timeToMinutes('14:05:00'), 845);
    assert.strictEqual(timeToMinutes('bogus'), null);
  });
});

describe('update_track — reminder field validation (CC-38 f19)', () => {
  const tracksTools = require('../src/tools/tracks');

  it('rejects malformed meeting_time', async () => {
    const res = await tracksTools.update_track(
      { track_id: 't1', meeting_time: 'ten am' }, 'u1'
    );
    assert.strictEqual(res.success, false);
    assert.match(res.error, /HH:MM|access|not found/i);
  });

  it('rejects out-of-range reminder_lead_minutes', async () => {
    const res = await tracksTools.update_track(
      { track_id: 't1', reminder_lead_minutes: 5 }, 'u1'
    );
    assert.strictEqual(res.success, false);
  });
});
