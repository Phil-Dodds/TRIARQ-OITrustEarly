// contract37-sprint-resolution.test.js
// Contract 37 (D-551/D-552) — pure resolution library tests.
// Validates spec §5 semantics (sprint + relative modes, X=0, out-of-sprint
// anchors) and §6 cascade semantics (relative-only, lifecycle order, chaining,
// manual/sprint gates never move). AC 6, 7, 8 (compute side), 14.

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

const {
  addDaysToIsoDate,
  sortSprintsByStartDate,
  resolveSprintRule,
  resolveRelativeRule,
  resolveRule,
  computeCascade
} = require('../src/lib/sprint-resolution');

// Subset of the Standard 2026 seed (spec Appendix A) — deliberately includes
// '2026.10' to prove text ids survive (AC 14) and a gap-free 3-week cadence.
const SPRINTS = [
  { sprint_id: '2026.09', start_date: '2026-06-15', end_date: '2026-07-03' },
  { sprint_id: '2026.10', start_date: '2026-07-06', end_date: '2026-07-24' },
  { sprint_id: '2026.11', start_date: '2026-07-27', end_date: '2026-08-14' },
  { sprint_id: '2026.12', start_date: '2026-08-17', end_date: '2026-09-04' }
];

describe('addDaysToIsoDate', () => {
  test('adds days within a month', () => {
    assert.strictEqual(addDaysToIsoDate('2026-07-06', 5), '2026-07-11');
  });
  test('rolls over month boundaries', () => {
    assert.strictEqual(addDaysToIsoDate('2026-07-24', 14), '2026-08-07');
  });
  test('rolls over year boundaries', () => {
    assert.strictEqual(addDaysToIsoDate('2026-12-21', 18), '2027-01-08');
  });
  test('supports negative offsets', () => {
    assert.strictEqual(addDaysToIsoDate('2026-08-01', -7), '2026-07-25');
  });
  test('zero offset is identity', () => {
    assert.strictEqual(addDaysToIsoDate('2026-07-06', 0), '2026-07-06');
  });
});

describe('sortSprintsByStartDate', () => {
  test('orders by start_date, not sprint_id text', () => {
    const shuffled = [SPRINTS[2], SPRINTS[0], SPRINTS[3], SPRINTS[1]];
    const sorted = sortSprintsByStartDate(shuffled);
    assert.deepStrictEqual(sorted.map(s => s.sprint_id),
      ['2026.09', '2026.10', '2026.11', '2026.12']);
  });
  test('excludes soft-deleted sprints', () => {
    const withDeleted = [...SPRINTS, {
      sprint_id: '2026.13', start_date: '2026-09-07', end_date: '2026-09-25',
      deleted_at: '2026-07-01T00:00:00Z'
    }];
    const sorted = sortSprintsByStartDate(withDeleted);
    assert.strictEqual(sorted.length, 4);
    assert.ok(!sorted.find(s => s.sprint_id === '2026.13'));
  });
  test("text sprint id '2026.10' keeps its trailing zero (AC 14)", () => {
    const sorted = sortSprintsByStartDate(SPRINTS);
    assert.strictEqual(sorted[1].sprint_id, '2026.10');
    assert.notStrictEqual(sorted[1].sprint_id, '2026.1');
  });
});

describe('resolveSprintRule (spec §5, AC 6)', () => {
  test('start anchor resolves to sprint start', () => {
    const r = resolveSprintRule(SPRINTS, '2026.11', 'start', 0);
    assert.strictEqual(r.resolved_date, '2026-07-27');
  });
  test('end anchor + 14 days (Sprint 2026.11 end + 14d example)', () => {
    const r = resolveSprintRule(SPRINTS, '2026.11', 'end', 14);
    assert.strictEqual(r.resolved_date, '2026-08-28');
  });
  test('negative day offset allowed', () => {
    const r = resolveSprintRule(SPRINTS, '2026.10', 'start', -3);
    assert.strictEqual(r.resolved_date, '2026-07-03');
  });
  test('unknown sprint id errors (stale path)', () => {
    const r = resolveSprintRule(SPRINTS, '2025.01', 'start', 0);
    assert.match(r.error, /not in the effective calendar/);
  });
  test('invalid anchor errors', () => {
    const r = resolveSprintRule(SPRINTS, '2026.10', 'middle', 0);
    assert.match(r.error, /'start' or 'end'/);
  });
});

describe('resolveRelativeRule (spec §5, AC 7)', () => {
  test('X=0 is the prior target itself + Z days (Go to Deploy + 28d example)', () => {
    const r = resolveRelativeRule(SPRINTS, '2026-07-10', 0, 28);
    assert.strictEqual(r.resolved_date, '2026-08-07');
  });
  test('X=0, Z=0 echoes the prior target', () => {
    const r = resolveRelativeRule(SPRINTS, '2026-07-10', 0, 0);
    assert.strictEqual(r.resolved_date, '2026-07-10');
  });
  test('X=1 from inside a sprint resolves to the NEXT sprint end', () => {
    // 2026-07-10 is inside 2026.10 → 1 sprint after = 2026.11 → end 2026-08-14
    const r = resolveRelativeRule(SPRINTS, '2026-07-10', 1, 0);
    assert.strictEqual(r.resolved_date, '2026-08-14');
  });
  test('X=2 + Z days chains sprint count and day offset', () => {
    const r = resolveRelativeRule(SPRINTS, '2026-07-10', 2, 3);
    // 2 after 2026.10 = 2026.12 end 2026-09-04 + 3d
    assert.strictEqual(r.resolved_date, '2026-09-07');
  });
  test('out-of-sprint anchor: X counts from the next sprint that starts on/after (AC 7)', () => {
    // 2026-07-04/05 fall in the gap between 2026.09 and 2026.10.
    // X=1 → 2026.10 itself → end 2026-07-24.
    const r = resolveRelativeRule(SPRINTS, '2026-07-04', 1, 0);
    assert.strictEqual(r.resolved_date, '2026-07-24');
  });
  test('out-of-sprint anchor X=2 → second counted sprint', () => {
    const r = resolveRelativeRule(SPRINTS, '2026-07-04', 2, 0);
    assert.strictEqual(r.resolved_date, '2026-08-14');
  });
  test('anchor after the last sprint errors', () => {
    const r = resolveRelativeRule(SPRINTS, '2026-09-10', 1, 0);
    assert.match(r.error, /after the last sprint/);
  });
  test('X beyond the calendar end errors', () => {
    const r = resolveRelativeRule(SPRINTS, '2026-07-10', 10, 0);
    assert.match(r.error, /ends before/);
  });
  test('null prior target errors (relative needs an anchor)', () => {
    const r = resolveRelativeRule(SPRINTS, null, 1, 0);
    assert.match(r.error, /no target date/);
  });
  test('negative X errors', () => {
    const r = resolveRelativeRule(SPRINTS, '2026-07-10', -1, 0);
    assert.match(r.error, /0 or greater/);
  });
});

describe('resolveRule dispatcher', () => {
  test('manual does not resolve', () => {
    const r = resolveRule({ date_rule_type: 'manual' }, SPRINTS, null);
    assert.ok(r.error);
  });
  test('sprint dispatches with rule fields', () => {
    const r = resolveRule(
      { date_rule_type: 'sprint', rule_sprint_id: '2026.10', rule_anchor: 'end', rule_day_offset: 0 },
      SPRINTS, null);
    assert.strictEqual(r.resolved_date, '2026-07-24');
  });
  test('relative dispatches with prior target', () => {
    const r = resolveRule(
      { date_rule_type: 'relative', rule_sprint_count: 0, rule_day_offset: 7 },
      SPRINTS, '2026-07-10');
    assert.strictEqual(r.resolved_date, '2026-07-17');
  });
});

// ── Cascade (spec §6, AC 8/9/10 compute side) ───────────────────────────────

const gate = (gate_name, target_date, rule = {}) => ({
  gate_name,
  target_date,
  date_rule_type: rule.date_rule_type || 'manual',
  rule_sprint_id: rule.rule_sprint_id ?? null,
  rule_anchor: rule.rule_anchor ?? null,
  rule_sprint_count: rule.rule_sprint_count ?? null,
  rule_day_offset: rule.rule_day_offset ?? null,
  rule_stale: false
});

describe('computeCascade (D-552)', () => {
  test('relative chain shifts in lifecycle order, chaining target-to-target', () => {
    const milestones = [
      gate('brief_review', '2026-06-20'),
      gate('go_to_build', '2026-07-10'),
      gate('go_to_deploy', '2026-07-17', { date_rule_type: 'relative', rule_sprint_count: 0, rule_day_offset: 7 }),
      gate('go_to_release', '2026-07-24', { date_rule_type: 'relative', rule_sprint_count: 0, rule_day_offset: 7 }),
      gate('close_review', '2026-07-31', { date_rule_type: 'relative', rule_sprint_count: 0, rule_day_offset: 7 })
    ];
    const { shifts, unresolved } = computeCascade(milestones, 'go_to_build', '2026-07-15', SPRINTS);
    assert.deepStrictEqual(shifts, [
      { gate_name: 'go_to_deploy',  old_target_date: '2026-07-17', new_target_date: '2026-07-22' },
      { gate_name: 'go_to_release', old_target_date: '2026-07-24', new_target_date: '2026-07-29' },
      { gate_name: 'close_review',  old_target_date: '2026-07-31', new_target_date: '2026-08-05' }
    ]);
    assert.strictEqual(unresolved.length, 0);
  });

  test('manual and sprint gates never move; manual anchor still feeds the next relative', () => {
    const milestones = [
      gate('brief_review', '2026-06-20'),
      gate('go_to_build', '2026-07-10'),
      gate('go_to_deploy', '2026-08-01'), // manual — must not move
      gate('go_to_release', '2026-08-08', { date_rule_type: 'relative', rule_sprint_count: 0, rule_day_offset: 7 }),
      gate('close_review', '2026-09-07', { date_rule_type: 'sprint', rule_sprint_id: '2026.12', rule_anchor: 'end', rule_day_offset: 3 })
    ];
    const { shifts } = computeCascade(milestones, 'go_to_build', '2026-07-15', SPRINTS);
    // go_to_deploy manual → unchanged; go_to_release anchors to the UNCHANGED
    // manual date → resolves to the same value → no shift; sprint gate never moves.
    assert.deepStrictEqual(shifts, []);
  });

  test('shift only reported when the resolved date actually changes', () => {
    const milestones = [
      gate('brief_review', '2026-06-20'),
      gate('go_to_build', '2026-07-10'),
      gate('go_to_deploy', '2026-07-22', { date_rule_type: 'relative', rule_sprint_count: 0, rule_day_offset: 7 })
    ];
    // New upstream date resolves go_to_deploy to its existing value.
    const { shifts } = computeCascade(milestones, 'go_to_build', '2026-07-15', SPRINTS);
    assert.deepStrictEqual(shifts, []);
  });

  test('unresolvable downstream rule reported as unresolved; date holds (§6.5)', () => {
    const milestones = [
      gate('go_to_build', '2026-07-10'),
      gate('go_to_deploy', '2026-08-14', { date_rule_type: 'relative', rule_sprint_count: 10, rule_day_offset: 0 })
    ];
    const { shifts, unresolved } = computeCascade(milestones, 'go_to_build', '2026-07-15', SPRINTS);
    assert.deepStrictEqual(shifts, []);
    assert.strictEqual(unresolved.length, 1);
    assert.strictEqual(unresolved[0].gate_name, 'go_to_deploy');
  });

  test('clearing an upstream target makes downstream relatives unresolved, not shifted', () => {
    const milestones = [
      gate('go_to_build', '2026-07-10'),
      gate('go_to_deploy', '2026-07-17', { date_rule_type: 'relative', rule_sprint_count: 0, rule_day_offset: 7 })
    ];
    const { shifts, unresolved } = computeCascade(milestones, 'go_to_build', null, SPRINTS);
    assert.deepStrictEqual(shifts, []);
    assert.strictEqual(unresolved[0].gate_name, 'go_to_deploy');
  });

  test('no cascade from the last gate', () => {
    const milestones = [gate('close_review', '2026-07-31')];
    const { shifts, unresolved } = computeCascade(milestones, 'close_review', '2026-08-07', SPRINTS);
    assert.deepStrictEqual(shifts, []);
    assert.deepStrictEqual(unresolved, []);
  });

  test('X=0 relative chain across a cleared intermediate anchors to null and reports unresolved', () => {
    const milestones = [
      gate('go_to_build', null),
      gate('go_to_deploy', '2026-07-17', { date_rule_type: 'relative', rule_sprint_count: 0, rule_day_offset: 7 }),
      gate('go_to_release', '2026-07-24', { date_rule_type: 'relative', rule_sprint_count: 0, rule_day_offset: 7 })
    ];
    // brief_review changes; go_to_build (manual, null) doesn't move; go_to_deploy
    // anchors to null → unresolved → holds; go_to_release anchors to the HELD value.
    const withBrief = [gate('brief_review', '2026-06-20'), ...milestones];
    const { shifts, unresolved } = computeCascade(withBrief, 'brief_review', '2026-06-25', SPRINTS);
    assert.strictEqual(unresolved[0].gate_name, 'go_to_deploy');
    // go_to_release anchors to go_to_deploy's held 2026-07-17 → resolves 2026-07-24 → no shift.
    assert.deepStrictEqual(shifts, []);
  });
});
