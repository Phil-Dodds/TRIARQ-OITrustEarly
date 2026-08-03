// contract45-commitment-checks.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 45, D-649).
//
// Three state checks whose boundaries matter: 42 days is the line between a
// commitment and a gesture, and the checks must not fire on Initiatives that
// are legitimately finished or paused. Pure logic, so the boundaries are
// testable exactly rather than approximately — `now` is injected.

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  findingsForCycle, trioRecipientIds, daysBetween,
  WEAK_COMMITMENT_DAYS, STALE_COMMITMENT_DAYS, INACTIVE_STAGES
} = require('../src/lib/commitment-checks');

const NOW = new Date('2026-08-03T12:00:00.000Z');

const cycle = (over = {}) => ({
  delivery_cycle_id: 'c1',
  cycle_title: 'Referral Leakage Analysis',
  current_lifecycle_stage: 'BUILD',
  assigned_dcs_user_id: 'dcs-u',
  assigned_epo_user_id: 'epo-u',
  assigned_dol_user_id: 'dol-u',
  ...over
});
const gate = (target_date) => ({
  gate_name: 'go_to_build', gate_name_display: 'Go to Build', target_date
});
/** ISO date N days from NOW. */
const dayOffset = (n) =>
  new Date(NOW.getTime() + n * 86400000).toISOString().slice(0, 10);
const types = (f) => f.map(x => x.event_type).sort();

describe('no commitment (D-649)', () => {

  test('fires when the next gate has no target date', () => {
    const f = findingsForCycle(cycle(), gate(null), null, NOW);
    assert.deepEqual(types(f), ['no_commitment']);
    assert.match(f[0].headline, /Go to Build has no target date/);
    assert.match(f[0].headline, /Referral Leakage Analysis/);
  });

  test('does NOT fire when there is no next gate at all', () => {
    // Nothing left to commit to is not the same as declining to commit.
    const f = findingsForCycle(cycle(), null, null, NOW);
    assert.deepEqual(types(f), []);
  });

  test('uses the canonical gate label, never milestone_label (Rule 36)', () => {
    const f = findingsForCycle(cycle(), gate(null), null, NOW);
    assert.match(f[0].headline, /Go to Build/);
    assert.doesNotMatch(f[0].headline, /Build Start/);
  });
});

describe('weak commitment — the 42-day boundary (D-649)', () => {

  test('does not fire exactly AT the threshold', () => {
    const f = findingsForCycle(cycle(), gate(dayOffset(WEAK_COMMITMENT_DAYS)), null, NOW);
    assert.deepEqual(types(f), [], '42 days out is still a commitment');
  });

  test('fires one day past the threshold', () => {
    const f = findingsForCycle(cycle(), gate(dayOffset(WEAK_COMMITMENT_DAYS + 1)), null, NOW);
    assert.deepEqual(types(f), ['weak_commitment']);
    assert.match(f[0].headline, /targeted 43 days out/);
  });

  test('a near-term date fires nothing', () => {
    const f = findingsForCycle(cycle(), gate(dayOffset(10)), null, NOW);
    assert.deepEqual(types(f), []);
  });

  test('a date in the past is not "weak" — that is a different signal', () => {
    // An overdue gate is not an absent commitment. D-486 slip detection and the
    // status dashboard own that; flagging it here would double-report.
    const f = findingsForCycle(cycle(), gate(dayOffset(-5)), null, NOW);
    assert.deepEqual(types(f), []);
  });
});

describe('stale commitment (D-649)', () => {

  test('fires when dates have not been touched past the threshold', () => {
    const stale = new Date(NOW.getTime() - (STALE_COMMITMENT_DAYS + 6) * 86400000).toISOString();
    const f = findingsForCycle(cycle(), gate(dayOffset(10)), stale, NOW);
    assert.deepEqual(types(f), ['stale_commitment']);
    assert.match(f[0].headline, /dates not updated in 20 days/);
  });

  test('does not fire at the threshold', () => {
    const edge = new Date(NOW.getTime() - STALE_COMMITMENT_DAYS * 86400000).toISOString();
    const f = findingsForCycle(cycle(), gate(dayOffset(10)), edge, NOW);
    assert.deepEqual(types(f), []);
  });

  test('never fires when there is no touch history to judge', () => {
    const f = findingsForCycle(cycle(), gate(dayOffset(10)), null, NOW);
    assert.deepEqual(types(f), []);
  });

  test('reports independently of the other two, not instead of them', () => {
    // "No date, and nobody has looked at the dates in three weeks" is two
    // distinct facts; collapsing them would hide the second.
    const stale = new Date(NOW.getTime() - 21 * 86400000).toISOString();
    const f = findingsForCycle(cycle(), gate(null), stale, NOW);
    assert.deepEqual(types(f), ['no_commitment', 'stale_commitment']);
  });
});

describe('inactive Initiatives are never checked', () => {

  for (const stage of INACTIVE_STAGES) {
    test(`${stage} produces no findings even when every condition holds`, () => {
      const stale = new Date(NOW.getTime() - 60 * 86400000).toISOString();
      const f = findingsForCycle(
        cycle({ current_lifecycle_stage: stage }), gate(null), stale, NOW
      );
      assert.deepEqual(types(f), [], `${stage} is not active work`);
    });
  }

  test('the inactive list is exactly CANCELLED, COMPLETE, ON_HOLD', () => {
    assert.deepEqual([...INACTIVE_STAGES].sort(), ['CANCELLED', 'COMPLETE', 'ON_HOLD']);
  });
});

describe('recipients (D-649)', () => {

  test('the trio, deduplicated, nulls dropped', () => {
    assert.deepEqual(
      trioRecipientIds(cycle()).sort(), ['dcs-u', 'dol-u', 'epo-u']);
  });

  test('one person holding two trio seats appears once', () => {
    assert.deepEqual(
      trioRecipientIds(cycle({ assigned_epo_user_id: 'dcs-u' })).sort(),
      ['dcs-u', 'dol-u']);
  });

  test('an unassigned seat is simply absent', () => {
    assert.deepEqual(
      trioRecipientIds(cycle({ assigned_dol_user_id: null })).sort(),
      ['dcs-u', 'epo-u']);
  });

  test('managers are NOT resolved here — the D-642 fan-out adds them', () => {
    // D-649 addresses the trio. If this function ever returned managers, they
    // would receive two copies: one direct and one fanned out.
    const ids = trioRecipientIds(cycle());
    assert.equal(ids.length, 3, 'trio only');
  });
});

describe('daysBetween', () => {
  test('positive when the first argument is later', () => {
    assert.equal(daysBetween(new Date('2026-08-10T00:00:00Z'), new Date('2026-08-03T00:00:00Z')), 7);
  });
  test('negative when earlier', () => {
    assert.equal(daysBetween(new Date('2026-08-01T00:00:00Z'), new Date('2026-08-03T00:00:00Z')), -2);
  });
});
