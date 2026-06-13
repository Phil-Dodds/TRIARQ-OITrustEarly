// cycle-headline.utils.spec.ts — Contract 23 Item 2.2 acceptance criteria tests.
// Pure function — no Angular TestBed needed.

import { computeHeadline, formatHeadlineDate } from './cycle-headline.utils';
import { DeliveryCycle } from '../../../core/types/database';

const FROZEN_NOW = new Date('2026-06-12T12:00:00Z');
const today      = '2026-06-12';

function baseCycle(overrides: Partial<DeliveryCycle> = {}): DeliveryCycle {
  return {
    delivery_cycle_id:        'c-1',
    cycle_title:              'Test Initiative',
    current_lifecycle_stage:  'BRIEF',
    tier_classification:      'tier_2',
    division_id:              'div-1',
    workstream_id:            null,
    outcome_statement:        null,
    assigned_dcs_user_id:     null,
    assigned_epo_user_id:     null,
    assigned_dol_user_id:     null,
    milestone_dates:          [],
    gate_records:             [],
    ...overrides
  } as unknown as DeliveryCycle;
}

describe('computeHeadline', () => {
  it('Rule 1 — gate awaiting_approval wins over everything', () => {
    const cycle = baseCycle({
      current_lifecycle_stage: 'BUILD',
      milestone_dates: [{ gate_name: 'go_to_build', target_date: '2026-06-20', actual_date: null }],
      gate_records:    [{ gate_name: 'go_to_build', gate_status: 'awaiting_approval' }]
    } as Partial<DeliveryCycle>);
    const result = computeHeadline(cycle, FROZEN_NOW);
    expect(result.text).toContain('Awaiting Go to Build approval');
    expect(result.color).toBe('default');
  });

  it('Rule 2 — overdue unapproved gate renders Oravive', () => {
    const cycle = baseCycle({
      current_lifecycle_stage: 'BRIEF',
      milestone_dates: [{ gate_name: 'brief_review', target_date: '2026-06-09', actual_date: null }],
      gate_records:    [{ gate_name: 'brief_review', gate_status: 'not_started' }]
    } as Partial<DeliveryCycle>);
    const result = computeHeadline(cycle, FROZEN_NOW);
    expect(result.text).toBe('Brief Review approval overdue · 3 days');
    expect(result.color).toBe('oravive');
  });

  it('Rule 2 — approved overdue gate does not trigger', () => {
    const cycle = baseCycle({
      current_lifecycle_stage: 'DESIGN',
      milestone_dates: [{ gate_name: 'brief_review', target_date: '2026-06-09', actual_date: null }],
      gate_records:    [{ gate_name: 'brief_review', gate_status: 'approved' }]
    } as Partial<DeliveryCycle>);
    const result = computeHeadline(cycle, FROZEN_NOW);
    expect(result.text).not.toContain('overdue');
  });

  it('Rule 3 — pre-deploy with Go to Deploy target set', () => {
    const cycle = baseCycle({
      current_lifecycle_stage: 'BUILD',
      milestone_dates: [
        { gate_name: 'go_to_build',  target_date: '2026-06-18', actual_date: null },
        { gate_name: 'go_to_deploy', target_date: '2026-08-01', actual_date: null }
      ],
      gate_records: [
        { gate_name: 'brief_review', gate_status: 'approved' },
        { gate_name: 'go_to_build',  gate_status: 'not_started' }
      ]
    } as Partial<DeliveryCycle>);
    const result = computeHeadline(cycle, FROZEN_NOW);
    expect(result.text).toContain('Next: Go to Build');
    expect(result.text).toContain('Deploy ');
    expect(result.color).toBe('sunray');
  });

  it('Rule 4 — pre-deploy with no Go to Deploy target', () => {
    const cycle = baseCycle({
      current_lifecycle_stage: 'BRIEF',
      milestone_dates: [{ gate_name: 'brief_review', target_date: '2026-06-18', actual_date: null }],
      gate_records:    []
    } as Partial<DeliveryCycle>);
    const result = computeHeadline(cycle, FROZEN_NOW);
    expect(result.text).toBe('Next: Brief Review in 6 days');
    expect(result.color).toBe('sunray');
  });

  it('Rule 5 — BRIEF with no milestone data', () => {
    const cycle = baseCycle({ current_lifecycle_stage: 'BRIEF' });
    const result = computeHeadline(cycle, FROZEN_NOW);
    expect(result.text).toBe('In Brief · Next: Brief Review');
  });

  it('Rule 6 — post-deploy with deploy + release dates', () => {
    const cycle = baseCycle({
      current_lifecycle_stage: 'PILOT',
      milestone_dates: [
        { gate_name: 'go_to_deploy',  target_date: '2026-06-01', actual_date: '2026-06-05' },
        { gate_name: 'go_to_release', target_date: '2026-07-15', actual_date: null }
      ],
      gate_records: [
        { gate_name: 'go_to_deploy',  gate_status: 'approved' },
        { gate_name: 'go_to_release', gate_status: 'not_started' }
      ]
    } as Partial<DeliveryCycle>);
    const result = computeHeadline(cycle, FROZEN_NOW);
    expect(result.text).toContain('Deploy ');
    expect(result.text).toContain('Release ');
    expect(result.color).toBe('default');
  });

  it('null/empty guard — no milestones, no gates', () => {
    const cycle = baseCycle({ current_lifecycle_stage: 'BRIEF', milestone_dates: undefined, gate_records: undefined } as Partial<DeliveryCycle>);
    const result = computeHeadline(cycle, FROZEN_NOW);
    expect(result.text).toBe('In Brief · Next: Brief Review');
  });
});

describe('formatHeadlineDate', () => {
  it('today → "today"',                        () => expect(formatHeadlineDate(today, FROZEN_NOW)).toBe('today'));
  it('+1 day → "in 1 day"',                    () => expect(formatHeadlineDate('2026-06-13', FROZEN_NOW)).toBe('in 1 day'));
  it('+3 days → "in 3 days"',                  () => expect(formatHeadlineDate('2026-06-15', FROZEN_NOW)).toBe('in 3 days'));
  it('-1 day → "1 day ago"',                   () => expect(formatHeadlineDate('2026-06-11', FROZEN_NOW)).toBe('1 day ago'));
  it('-2 days → "2 days ago"',                 () => expect(formatHeadlineDate('2026-06-10', FROZEN_NOW)).toBe('2 days ago'));
  it('+30 days → short date format',           () => expect(formatHeadlineDate('2026-07-12', FROZEN_NOW)).toMatch(/Jul \d+/));
  it('null → empty string',                    () => expect(formatHeadlineDate(null, FROZEN_NOW)).toBe(''));
  it('invalid → empty string',                 () => expect(formatHeadlineDate('not-a-date', FROZEN_NOW)).toBe(''));
});
