// contract45-digest.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 45, D-643).
//
// The digest carries several rules that are easy to state and easy to lose:
// empty sections omitted entirely, five lines then overflow, never sent when
// empty, a subject that names counts rather than a label, and no per-person
// comparison anywhere (D-568). Pure logic, so these are cheap to pin.

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  buildDigest, groupIntoSections, sectionForRow, buildSubject,
  SECTIONS, MAX_LINES_PER_SECTION
} = require('../src/lib/digest');

const row = (event_type, headline, over = {}) => ({
  event_type,
  headline,
  delivery_class: 'digest',
  manager_copy:   false,
  created_at:     '2026-08-03T01:00:00.000Z',
  ...over
});

describe('section ordering and omission (D-643)', () => {

  test('sections render in the fixed severity-first order', () => {
    const sections = groupIntoSections([
      row('informed_gate_decision', 'Go to Build was approved.'),   // completed (8th)
      row('initiative_blocked',     'Pre-Auth is blocked.'),        // blocked (2nd)
      row('gate_submission',        'A gate is waiting on you.')    // waiting_on_you (1st)
    ]);

    assert.deepEqual(sections.map(s => s.key),
      ['waiting_on_you', 'blocked', 'completed']);
  });

  test('empty sections are omitted entirely — no empty headings', () => {
    const sections = groupIntoSections([row('initiative_at_risk', 'Referral Leakage is at risk.')]);
    assert.equal(sections.length, 1);
    assert.equal(sections[0].key, 'at_risk');
  });

  test('the full section list is exactly ten, in the D-643 order', () => {
    assert.equal(SECTIONS.length, 10);
    assert.equal(SECTIONS[0].title, 'Waiting on you');
    assert.equal(SECTIONS[3].title, 'Waiting on your team');
    assert.equal(SECTIONS[9].title, 'Commitment checks');
  });
});

describe('five-line cap and overflow (D-643)', () => {

  test('at most five lines, with the remainder counted for an overflow link', () => {
    const rows = Array.from({ length: 8 }, (_, i) =>
      row('gate_submission', `Gate ${i} is waiting on you.`, {
        created_at: `2026-08-03T0${i}:00:00.000Z`
      }));

    const [section] = groupIntoSections(rows);
    assert.equal(section.lines.length, MAX_LINES_PER_SECTION);
    assert.equal(section.overflowCount, 3);
  });

  test('oldest first inside a section', () => {
    const rows = [
      row('gate_submission', 'newer', { created_at: '2026-08-03T09:00:00.000Z' }),
      row('gate_submission', 'older', { created_at: '2026-08-01T09:00:00.000Z' })
    ];
    const [section] = groupIntoSections(rows);
    assert.equal(section.lines[0], 'older');
  });

  test('the overflow link points at the matching filtered surface', () => {
    const rows = Array.from({ length: 7 }, (_, i) =>
      row('initiative_blocked', `Blocked ${i}`, { created_at: `2026-08-0${i + 1}T09:00:00Z` }));
    const d = buildDigest(rows, { appBaseUrl: 'https://app.example/' });
    assert.match(d.bodyText, /\+ 2 more — https:\/\/app\.example\/initiatives\/all-pending-gates/);
  });
});

describe('a digest with no content is not sent (D-643)', () => {

  test('no rows returns null, not an empty email', () => {
    assert.equal(buildDigest([]), null);
    assert.equal(buildDigest(null), null);
  });
});

describe('manager copies split sections 1 and 4 (D-642 / migration 099)', () => {

  test('a manager copy of a waiting-on event lands in "Waiting on your team"', () => {
    assert.equal(
      sectionForRow(row('gate_submission', 'Dana — a gate is waiting.', { manager_copy: true })),
      'waiting_on_team');
  });

  test('the report\'s own row of the same event stays in "Waiting on you"', () => {
    assert.equal(sectionForRow(row('gate_submission', 'A gate is waiting.')), 'waiting_on_you');
  });

  test('a manager copy of an awareness event keeps its own section', () => {
    // "Your team" framing would be wrong for something that merely completed.
    assert.equal(
      sectionForRow(row('informed_gate_decision', 'Dana — Go to Build approved.', { manager_copy: true })),
      'completed');
  });

  test('an unmapped event type falls back to Moving rather than being dropped', () => {
    assert.equal(sectionForRow(row('some_future_event', 'Something happened.')), 'moving');
  });
});

describe('subject line carries counts, never a generic label (D-643)', () => {

  test('severity counts lead the subject', () => {
    const sections = groupIntoSections([
      row('initiative_blocked', 'a'), row('initiative_blocked', 'b'),
      row('initiative_at_risk', 'c')
    ]);
    const subject = buildSubject(sections, { dayLabel: 'Monday' });
    assert.equal(subject, '2 blocked · 1 at risk — Monday');
  });

  test('falls back to team, then to a plain update count — never a bare label', () => {
    const teamOnly = groupIntoSections([
      row('gate_submission', 'Dana — waiting', { manager_copy: true })
    ]);
    assert.match(buildSubject(teamOnly), /1 waiting on your team/);

    const awarenessOnly = groupIntoSections([row('informed_gate_decision', 'approved')]);
    assert.match(buildSubject(awarenessOnly), /1 update/);
  });

  test('overflow items are counted in the subject, not just the visible five', () => {
    const rows = Array.from({ length: 9 }, (_, i) =>
      row('initiative_blocked', `b${i}`, { created_at: `2026-08-0${i + 1}T09:00:00Z` }));
    const sections = groupIntoSections(rows);
    assert.match(buildSubject(sections), /^9 blocked/,
      'the subject reports what is true, not what fits');
  });
});

describe('D-568 publication principle — no per-person comparison', () => {

  test('no section name describes a person state', () => {
    // Section names must describe WORK. "Slow approvers" would be a violation;
    // "Waiting on your team" describes the work's state, not the team's.
    for (const s of SECTIONS) {
      assert.doesNotMatch(s.title, /slow|late|worst|best|rank|top|bottom/i, s.title);
    }
  });

  test('the subject never names a person', () => {
    const sections = groupIntoSections([
      row('gate_submission', "Maya's Go to Build has waited 9 days on Sabrina K.")
    ]);
    const subject = buildSubject(sections);
    assert.doesNotMatch(subject, /Maya|Sabrina/,
      'people appear in lines, which are facts — never in the subject, which is a summary');
  });
});

describe('body rendering', () => {

  test('every line is a rendered headline, not an id to resolve later', () => {
    const d = buildDigest([
      row('gate_submission', "Maya's Go to Build on Referral Leakage has waited 9 days on Sabrina K.")
    ], { appBaseUrl: 'https://app.example' });

    assert.match(d.bodyText, /Waiting on you/);
    assert.match(d.bodyText, /waited 9 days on Sabrina K\./);
    assert.equal(d.totalItems, 1);
  });
});
