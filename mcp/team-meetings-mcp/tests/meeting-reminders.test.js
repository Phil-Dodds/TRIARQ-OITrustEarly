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

const { occurrenceInWindow, timeToMinutes, isScheduledOccurrence } = require('../src/tools/send_meeting_reminders');

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

describe('isScheduledOccurrence — schedule gate (defect fix 2026-07-23)', () => {
  // Date helpers relative to the real clock: suggestNextMeetingDate clamps to
  // "never in the past", so fixtures must be computed from today (UTC-date
  // space, matching cadence.js).
  const iso = d => d.toISOString().slice(0, 10);
  const addDays = (d, n) => { const x = new Date(d.getTime()); x.setUTCDate(x.getUTCDate() + n); return x; };
  const todayUtc = () => new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  /** Next date >= today+minAhead whose UTC weekday = dow. */
  const nextDow = (dow, minAhead = 0) => {
    let d = addDays(todayUtc(), minAhead);
    while (d.getUTCDay() !== dow) { d = addDays(d, 1); }
    return d;
  };

  it('fires on the cadence-suggested day even with NO meeting instance (Phil 2026-07-23)', () => {
    const nextMonday = nextDow(1);
    const lastMonday = addDays(nextMonday, -7);
    const cadence = { type: 'weekly', day_of_week: 1 };
    assert.strictEqual(
      isScheduledOccurrence(iso(nextMonday), false, cadence, iso(lastMonday)),
      true
    );
  });

  it('does NOT fire on an off-cadence day with no instance (the daily-spam defect)', () => {
    // Weekly Monday series; window date = the next Thursday. No instance.
    const nextMonday = nextDow(1);
    const lastMonday = addDays(nextMonday, -7);
    const offDay = nextDow(4, 1); // a Thursday >= tomorrow, never the suggested Monday
    const cadence = { type: 'weekly', day_of_week: 1 };
    assert.strictEqual(
      isScheduledOccurrence(iso(offDay), false, cadence, iso(lastMonday)),
      false
    );
  });

  it('an actual instance dated that day fires regardless of cadence (reschedule/ad-hoc)', () => {
    const offDay = nextDow(4, 1);
    const cadence = { type: 'weekly', day_of_week: 1 };
    assert.strictEqual(isScheduledOccurrence(iso(offDay), true, cadence, null), true);
  });

  it('no cadence configured → instance is the only schedule signal', () => {
    const anyDay = iso(addDays(todayUtc(), 2));
    assert.strictEqual(isScheduledOccurrence(anyDay, false, null, null), false);
    assert.strictEqual(isScheduledOccurrence(anyDay, false, {}, null), false);
    assert.strictEqual(isScheduledOccurrence(anyDay, true, null, null), true);
  });

  it('interval cadence: fires only on last + interval_days', () => {
    const target = addDays(todayUtc(), 3);
    const last = addDays(target, -7);
    const cadence = { type: 'interval', interval_days: 7 };
    assert.strictEqual(isScheduledOccurrence(iso(target), false, cadence, iso(last)), true);
    assert.strictEqual(isScheduledOccurrence(iso(addDays(target, 1)), false, cadence, iso(last)), false);
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
