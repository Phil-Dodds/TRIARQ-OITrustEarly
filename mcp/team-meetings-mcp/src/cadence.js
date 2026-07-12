// cadence.js
// Pathways OI Trust — meeting series cadence math (session 2026-07-11 design).
// Computes the suggested date for the next meeting in a series. Suggestion only —
// never enforced (D-205 nudge philosophy). All dates are 'YYYY-MM-DD' strings;
// math is done in UTC-date space to avoid timezone drift.
//
// Cadence shape (team_meeting_tracks.meeting_cadence jsonb):
//   { type: 'interval'|'weekly'|'biweekly'|'triweekly'|'monthly',
//     interval_days?, day_of_week? (0=Sun…6=Sat), month_occurrence? ('1'|'2'|'3'|'4'|'last') }
//
// Universal guard: the suggested date is never in the past — lapsed series step
// forward by the cadence period until the date is >= today.

'use strict';

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toIso(date) {
  return date.toISOString().split('T')[0];
}

function addDays(date, n) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function todayUtc() {
  return parseDate(new Date().toISOString().split('T')[0]);
}

/** First date >= start whose UTC weekday matches dow (0=Sun…6=Sat). */
function nextWeekday(start, dow) {
  const delta = (dow - start.getUTCDay() + 7) % 7;
  return addDays(start, delta);
}

/** Round a target date to the matching weekday within its own week (±3 days). */
function roundToWeekday(target, dow) {
  let delta = (dow - target.getUTCDay() + 7) % 7;
  if (delta > 3) delta -= 7;
  return addDays(target, delta);
}

/** Nth (or last) occurrence of a weekday in the month containing `ref`. */
function occurrenceInMonth(year, month, dow, occurrence) {
  if (occurrence === 'last') {
    // Walk back from the last day of the month.
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const delta = (lastDay.getUTCDay() - dow + 7) % 7;
    return addDays(lastDay, -delta);
  }
  const n = parseInt(occurrence, 10);
  const firstDay = new Date(Date.UTC(year, month, 1));
  const first = nextWeekday(firstDay, dow);
  return addDays(first, (n - 1) * 7);
}

/**
 * Suggested date for the next meeting.
 * @param {object|null} cadence          team_meeting_tracks.meeting_cadence
 * @param {string|null} lastMeetingDate  latest meeting_date in the series ('YYYY-MM-DD')
 * @returns {string} 'YYYY-MM-DD'
 */
function suggestNextMeetingDate(cadence, lastMeetingDate) {
  const today = todayUtc();
  if (!cadence || !cadence.type) return toIso(today);

  const last = lastMeetingDate ? parseDate(lastMeetingDate) : null;
  const dow  = Number.isInteger(cadence.day_of_week) ? cadence.day_of_week : null;

  switch (cadence.type) {
    case 'interval': {
      const n = cadence.interval_days > 0 ? cadence.interval_days : 7;
      if (!last) return toIso(today);
      let d = addDays(last, n);
      while (d < today) d = addDays(d, n);
      return toIso(d);
    }

    case 'weekly': {
      if (dow === null) return toIso(today);
      // First matching weekday strictly after the last meeting, and >= today.
      const start = last && addDays(last, 1) > today ? addDays(last, 1) : today;
      return toIso(nextWeekday(start, dow));
    }

    case 'biweekly':
    case 'triweekly': {
      if (dow === null) return toIso(today);
      const period = cadence.type === 'biweekly' ? 14 : 21;
      // The last meeting is the anchor — phase drifts gracefully on reschedules.
      if (!last) return toIso(nextWeekday(today, dow));
      let d = roundToWeekday(addDays(last, period), dow);
      while (d < today || d <= last) d = addDays(d, period);
      return toIso(d);
    }

    case 'monthly': {
      if (dow === null || !cadence.month_occurrence) return toIso(today);
      const ref = last ?? today;
      let year = ref.getUTCFullYear(), month = ref.getUTCMonth();
      let d = occurrenceInMonth(year, month, dow, cadence.month_occurrence);
      // Advance months until strictly after the last meeting and >= today.
      let guard = 0;
      while ((last && d <= last) || d < today) {
        month += 1;
        if (month > 11) { month = 0; year += 1; }
        d = occurrenceInMonth(year, month, dow, cadence.month_occurrence);
        if (++guard > 36) break; // safety
      }
      return toIso(d);
    }

    default:
      return toIso(today);
  }
}

const VALID_TYPES = ['interval', 'weekly', 'biweekly', 'triweekly', 'monthly'];
const VALID_OCCURRENCES = ['1', '2', '3', '4', 'last'];

/** Validate a cadence payload. Returns error string or null. Accepts null (= none). */
function validateCadence(cadence) {
  if (cadence === null || cadence === undefined) return null;
  if (typeof cadence !== 'object') return 'meeting_cadence must be an object or null.';
  if (!VALID_TYPES.includes(cadence.type)) return `meeting_cadence.type must be one of: ${VALID_TYPES.join(', ')}.`;
  if (cadence.type === 'interval') {
    if (![1, 7, 14].includes(cadence.interval_days)) return 'interval_days must be 1, 7, or 14.';
  } else {
    if (!Number.isInteger(cadence.day_of_week) || cadence.day_of_week < 0 || cadence.day_of_week > 6) {
      return 'day_of_week must be 0–6.';
    }
  }
  if (cadence.type === 'monthly' && !VALID_OCCURRENCES.includes(String(cadence.month_occurrence))) {
    return "month_occurrence must be '1', '2', '3', '4', or 'last'.";
  }
  return null;
}

module.exports = { suggestNextMeetingDate, validateCadence };
