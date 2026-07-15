// sprint-resolution.spec.ts — Contract 37 (D-551/D-553)
// Mirror-parity tests: these cases replicate the server-lib suite
// (mcp/delivery-cycle-mcp/tests/contract37-sprint-resolution.test.js) so the
// Angular preview and the canonical server resolution cannot drift silently.

import {
  addDaysToIsoDate,
  sortSprintsByStartDate,
  formatTargetDateDisplay,
  resolveSprintRule,
  resolveRelativeRule,
  sprintDropdownLabel,
  ruleChipLabel
} from './sprint-resolution';
import { SprintRow } from '../types/database';

const SPRINTS: SprintRow[] = [
  { id: 's09', sprint_id: '2026.09', start_date: '2026-06-15', end_date: '2026-07-03' },
  { id: 's10', sprint_id: '2026.10', start_date: '2026-07-06', end_date: '2026-07-24' },
  { id: 's11', sprint_id: '2026.11', start_date: '2026-07-27', end_date: '2026-08-14' },
  { id: 's12', sprint_id: '2026.12', start_date: '2026-08-17', end_date: '2026-09-04' }
];

describe('addDaysToIsoDate', () => {
  it('adds days across month boundaries without timezone shift', () => {
    expect(addDaysToIsoDate('2026-07-24', 14)).toBe('2026-08-07');
  });
  it('supports negative offsets and year rollover', () => {
    expect(addDaysToIsoDate('2026-08-01', -7)).toBe('2026-07-25');
    expect(addDaysToIsoDate('2026-12-21', 18)).toBe('2027-01-08');
  });
});

describe('sortSprintsByStartDate', () => {
  it('orders by start_date and keeps text ids intact (AC 14)', () => {
    const sorted = sortSprintsByStartDate([SPRINTS[2], SPRINTS[0], SPRINTS[3], SPRINTS[1]]);
    expect(sorted.map(s => s.sprint_id)).toEqual(['2026.09', '2026.10', '2026.11', '2026.12']);
    expect(sorted[1].sprint_id).toBe('2026.10'); // never 2026.1
  });
});

describe('formatTargetDateDisplay (D-520)', () => {
  it('renders Mon DD without year for the current year', () => {
    expect(formatTargetDateDisplay('2026-07-27', '2026-07-15')).toBe('Jul 27');
  });
  it('appends the year when it differs from the current year', () => {
    expect(formatTargetDateDisplay('2027-01-08', '2026-07-15')).toBe('Jan 8, 2027');
  });
  it('returns empty for null', () => {
    expect(formatTargetDateDisplay(null)).toBe('');
  });
});

describe('resolveSprintRule (AC 6)', () => {
  it('resolves end anchor + days', () => {
    expect(resolveSprintRule(SPRINTS, '2026.11', 'end', 14).resolved_date).toBe('2026-08-28');
  });
  it('errors for a sprint not in the calendar (stale path)', () => {
    expect(resolveSprintRule(SPRINTS, '2025.01', 'start', 0).error).toContain('not in the effective calendar');
  });
});

describe('resolveRelativeRule (AC 7)', () => {
  it('X=0 is the prior target itself + Z days', () => {
    expect(resolveRelativeRule(SPRINTS, '2026-07-10', 0, 28).resolved_date).toBe('2026-08-07');
  });
  it('X=1 from inside a sprint resolves to the next sprint end', () => {
    expect(resolveRelativeRule(SPRINTS, '2026-07-10', 1, 0).resolved_date).toBe('2026-08-14');
  });
  it('out-of-sprint anchor counts from the next sprint that starts on/after', () => {
    expect(resolveRelativeRule(SPRINTS, '2026-07-04', 1, 0).resolved_date).toBe('2026-07-24');
  });
  it('errors past the calendar end', () => {
    expect(resolveRelativeRule(SPRINTS, '2026-07-10', 10, 0).error).toContain('ends before');
  });
  it('errors on a null prior target', () => {
    expect(resolveRelativeRule(SPRINTS, null, 1, 0).error).toContain('no target date');
  });
});

describe('display labels (D-553)', () => {
  it('sprint dropdown label shows real dates', () => {
    expect(sprintDropdownLabel(SPRINTS[2])).toBe('2026.11 · Jul 27 – Aug 14');
  });
  it('chip: sprint rule with day offset', () => {
    expect(ruleChipLabel(
      { date_rule_type: 'sprint', rule_sprint_id: '2026.11', rule_anchor: 'end', rule_day_offset: 14 }, ''
    )).toBe('Sprint 2026.11 end + 14d');
  });
  it('chip: sprint rule without offset', () => {
    expect(ruleChipLabel(
      { date_rule_type: 'sprint', rule_sprint_id: '2026.11', rule_anchor: 'start', rule_day_offset: 0 }, ''
    )).toBe('Sprint 2026.11 start');
  });
  it('chip: relative rule names the prior gate', () => {
    expect(ruleChipLabel(
      { date_rule_type: 'relative', rule_sprint_count: 0, rule_day_offset: 28 }, 'Go to Deploy'
    )).toBe('Go to Deploy + 28d');
  });
  it('chip: manual is empty', () => {
    expect(ruleChipLabel({ date_rule_type: 'manual' }, 'Go to Deploy')).toBe('');
  });
});
