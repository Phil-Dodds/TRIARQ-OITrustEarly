// commitment-checks.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 45, D-649).
//
// Three state checks against active Initiatives, digest class, addressed to the
// trio. Each trio member's manager receives a copy automatically through the
// D-642 fan-out — the checks do not resolve managers themselves.
//
// ── Why these three, and why not dormancy ────────────────────────────────────
// D-649 replaces raw dormancy detection with commitment checks. Dormancy asks
// "has anyone touched this lately", which flags Initiatives that are quietly
// fine and misses ones that are actively drifting. These three ask whether a
// DATE has been committed to, and whether that commitment is meaningful:
//
//   no commitment    — the next gate has no target date at all
//   weak commitment  — the next gate's target date is further out than
//                      WEAK_COMMITMENT_DAYS, i.e. a date exists but concedes
//                      nothing
//   stale commitment — the Initiative's dates have not been touched in
//                      STALE_COMMITMENT_DAYS, so whatever was committed to is
//                      no longer being maintained
//
// ── V4, answered ─────────────────────────────────────────────────────────────
// Contract 45 asked whether ARCH-23's `date_status` already computes `behind`
// from a passed target date, in which case a fourth check should surface that
// instead. It does NOT: `date_status` is user-set (D-205 free dropdown), and the
// only automatic date signal in the system is D-486 gate-date SLIP, which fires
// when a target date MOVES rather than when it passes. So all three checks below
// stand, and no fourth is added.
//
// ── Constants ────────────────────────────────────────────────────────────────
// ARCH-33 pattern: code constants now, admin-configurable later. Both are
// deliberately named rather than inlined so the eventual admin surface has an
// obvious seam.

'use strict';

/** D-649: a target date further out than this is a weak commitment. */
const WEAK_COMMITMENT_DAYS = 42;

/**
 * D-649: dates untouched for longer than this are a stale commitment.
 * The spec says "N days" without fixing N. 14 is chosen to sit just outside a
 * fortnightly rhythm — long enough that a team on a two-week cadence is never
 * flagged for working normally, short enough that a month of silence is caught
 * twice. Flagged as Code's choice.
 */
const STALE_COMMITMENT_DAYS = 14;

/** Lifecycle stages that are not "active work" and are never checked. */
const INACTIVE_STAGES = Object.freeze(['CANCELLED', 'COMPLETE', 'ON_HOLD']);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days between two dates, positive when `later` is after `earlier`. */
function daysBetween(later, earlier) {
  return Math.floor((later.getTime() - earlier.getTime()) / MS_PER_DAY);
}

/**
 * Midnight UTC on the same calendar day.
 *
 * `target_date` is a SQL DATE, which parses to midnight. `now` is a timestamp.
 * Comparing the two directly floors away part of a day, so a gate targeted 43
 * calendar days out measures as 42 and the weak-commitment check misses it by
 * one. Normalising both ends to midnight makes the comparison what the decision
 * actually says: a count of calendar days.
 *
 * Staleness deliberately does NOT use this — "not updated in N days" is a real
 * elapsed-time question, and truncating it would report a change made an hour
 * ago as a full day old.
 */
function startOfUtcDay(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Compute commitment findings for one Initiative.
 *
 * Pure: no I/O, no clock of its own. `now` is injected so the boundaries are
 * testable rather than dependent on when the suite runs.
 *
 * @param {object} cycle          delivery_cycles row (needs delivery_cycle_id,
 *                               cycle_title, current_lifecycle_stage, trio ids)
 * @param {object|null} nextGate  the next unmet milestone: { gate_name,
 *                               gate_name_display, target_date } or null
 * @param {string|null} lastDateTouch  ISO timestamp of the most recent
 *                               cycle_milestone_dates.updated_at, or null
 * @param {Date} now
 * @returns {Array<{event_type, headline}>} zero or more findings
 */
function findingsForCycle(cycle, nextGate, lastDateTouch, now = new Date()) {
  const out = [];
  if (!cycle || INACTIVE_STAGES.includes(cycle.current_lifecycle_stage)) { return out; }

  const title = cycle.cycle_title ?? 'An Initiative';
  const gateLabel = nextGate?.gate_name_display ?? nextGate?.gate_name ?? 'the next gate';

  // 1. No commitment — a next gate exists but carries no target date.
  //    An Initiative with NO next gate is not flagged: there is nothing left to
  //    commit to, which is not the same as declining to commit.
  if (nextGate && !nextGate.target_date) {
    out.push({
      event_type: 'no_commitment',
      headline:   `${title} — ${gateLabel} has no target date.`
    });
  }

  // 2. Weak commitment — a date exists but is far enough out to concede nothing.
  if (nextGate && nextGate.target_date) {
    const target = new Date(`${nextGate.target_date}T00:00:00Z`);
    const out_days = daysBetween(target, startOfUtcDay(now));
    if (out_days > WEAK_COMMITMENT_DAYS) {
      out.push({
        event_type: 'weak_commitment',
        headline:   `${title} — ${gateLabel} is targeted ${out_days} days out.`
      });
    }
  }

  // 3. Stale commitment — the dates themselves are no longer maintained.
  //    Reported independently of 1 and 2: "no date, and nobody has looked at
  //    the dates in three weeks" is two distinct facts, and collapsing them
  //    would hide the second.
  if (lastDateTouch) {
    const idle = daysBetween(now, new Date(lastDateTouch));
    if (idle > STALE_COMMITMENT_DAYS) {
      out.push({
        event_type: 'stale_commitment',
        headline:   `${title} — dates not updated in ${idle} days.`
      });
    }
  }

  return out;
}

/**
 * Trio user ids for a cycle, deduplicated, nulls dropped.
 * D-649 addresses the trio; managers arrive via the D-642 fan-out.
 */
function trioRecipientIds(cycle) {
  return [...new Set([
    cycle.assigned_dcs_user_id,
    cycle.assigned_epo_user_id,
    cycle.assigned_dol_user_id
  ].filter(Boolean))];
}

module.exports = {
  startOfUtcDay,
  findingsForCycle,
  trioRecipientIds,
  daysBetween,
  WEAK_COMMITMENT_DAYS,
  STALE_COMMITMENT_DAYS,
  INACTIVE_STAGES
};
