// digest.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 45, D-643).
//
// Pure assembly of the daily digest. No I/O: rows in, one rendered email out
// (or null). Kept free of Supabase so the rules below — which are almost all
// judgement rather than plumbing — are testable in isolation.
//
// ── The rules this file enforces, all from D-643 ─────────────────────────────
//   * Ten sections, FIXED order, severity first.
//   * Empty sections omitted ENTIRELY — no "nothing here" headings.
//   * At most five lines per section, then an overflow link to the matching
//     filtered surface. The email is the headline layer; the app is the detail
//     layer.
//   * A digest with no content is NOT SENT. Returns null, and the caller must
//     treat null as "skip this recipient".
//   * The subject carries the counts that drive action, never a generic label.
//   * No rates, rankings, or per-person comparisons — D-568's publication
//     principle. This file therefore has no counting-by-person anywhere, and
//     the section names below describe WORK states, never person states.
//
// ── Section mapping is Code's call, and is flagged ───────────────────────────
// D-643 names the ten sections but the event→section inventory lives in the
// SOF Appendix A, which travels in the companion document — not supplied with
// this contract. The mapping below is reasoned from each event's meaning and
// recorded as CC-45-P so Design can correct it cheaply: it is one table.

'use strict';

/** At most five lines, then the overflow link (D-643). */
const MAX_LINES_PER_SECTION = 5;

/**
 * The ten sections, in fixed severity-first order. `key` is internal, `title`
 * is what the reader sees, `overflowPath` is where "see all" goes.
 */
const SECTIONS = Object.freeze([
  { key: 'waiting_on_you',    title: 'Waiting on you',          overflowPath: '/actions' },
  { key: 'blocked',           title: 'Blocked',                 overflowPath: '/initiatives/all-pending-gates' },
  { key: 'at_risk',           title: 'At risk',                 overflowPath: '/initiatives/status-dashboard' },
  { key: 'waiting_on_team',   title: 'Waiting on your team',    overflowPath: '/initiatives/all-pending-gates' },
  { key: 'governance',        title: 'Governance changes',      overflowPath: '/initiatives/activity' },
  { key: 'returned',          title: 'Returned / conditions open', overflowPath: '/actions' },
  { key: 'moving',            title: 'Moving',                  overflowPath: '/initiatives' },
  { key: 'completed',         title: 'Completed',               overflowPath: '/initiatives/gates-approved' },
  { key: 'started',           title: 'Started / assignments',   overflowPath: '/initiatives' },
  { key: 'commitment_checks', title: 'Commitment checks',       overflowPath: '/initiatives/status-dashboard' }
]);

const SECTION_KEYS = SECTIONS.map(s => s.key);

/**
 * event_type → section key, for a row that is NOT a manager copy.
 * Manager copies are redirected to the team section by sectionForRow below,
 * which is the whole reason migration 099 exists.
 */
const SECTION_BY_EVENT = Object.freeze({
  // Something is owed by this reader.
  gate_submission:                     'waiting_on_you',
  cancel_requested:                    'waiting_on_you',

  // The work is stopped and someone must act to unstop it.
  gate_returned:                       'returned',
  l1_gate_returned:                    'returned',
  gate_returned_with_conditions:       'returned',
  conditions_set_on_approval:          'returned',

  // Governance instruments changed under the reader.
  governance_level_lowered:            'governance',
  oversight_cleared:                   'governance',
  ie_override:                         'governance',
  approver_override:                   'governance',
  approved_over_returned_consultation: 'governance',
  dl_override_notification:            'governance',
  consulted_removed:                   'governance',

  // Outcomes.
  informed_gate_decision:              'completed',
  close_review_assessment_roster:      'completed',
  cycle_cancelled:                     'completed',
  cancel_request_declined:             'completed',

  // Commitment checks (D-649) — written by the digest job itself.
  no_commitment:                       'commitment_checks',
  weak_commitment:                     'commitment_checks',
  stale_commitment:                    'commitment_checks',

  // State lines written by the job, not by a governance action.
  initiative_blocked:                  'blocked',
  initiative_at_risk:                  'at_risk',
  stage_advanced:                      'moving',
  initiative_started:                  'started',
  role_assigned:                       'started'
});

/**
 * Which section a queued row belongs in.
 *
 * A manager copy of anything the report was waited on for becomes "Waiting on
 * your team" — that is the manager's version of the same fact, and it is the
 * only difference between sections 1 and 4. Manager copies of awareness events
 * keep their own section: a manager does not need "your team" framing for an
 * Initiative that merely completed.
 */
function sectionForRow(row) {
  const base = SECTION_BY_EVENT[row.event_type] ?? 'moving';
  if (row.manager_copy === true && (base === 'waiting_on_you' || base === 'returned')) {
    return 'waiting_on_team';
  }
  return base;
}

/**
 * Group rows into the fixed section order, dropping empties.
 * @param {Array<object>} rows queued notification_queue rows
 * @returns {Array<{key,title,overflowPath,lines,overflowCount}>}
 */
function groupIntoSections(rows) {
  const byKey = new Map(SECTION_KEYS.map(k => [k, []]));
  for (const row of rows || []) {
    const key = sectionForRow(row);
    (byKey.get(key) ?? byKey.get('moving')).push(row);
  }

  const out = [];
  for (const section of SECTIONS) {
    const all = byKey.get(section.key) || [];
    if (all.length === 0) { continue; }          // omitted entirely (D-643)
    // Oldest first inside a section: the thing that has waited longest is the
    // thing most worth reading first.
    const ordered = [...all].sort((a, b) =>
      String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')));
    out.push({
      ...section,
      lines:         ordered.slice(0, MAX_LINES_PER_SECTION).map(r => r.headline),
      overflowCount: Math.max(0, ordered.length - MAX_LINES_PER_SECTION)
    });
  }
  return out;
}

/**
 * The subject line carries the counts that drive action (D-643) — never a
 * generic label like "Your daily summary".
 *
 * Counts are of WORK ITEMS in the severity sections, deliberately not of
 * people: D-568's publication principle forbids per-person comparison, and a
 * subject line is the most quoted part of an email.
 */
function buildSubject(sections, { dayLabel } = {}) {
  const count = key => (sections.find(s => s.key === key)?.lines.length ?? 0) +
                       (sections.find(s => s.key === key)?.overflowCount ?? 0);

  const parts = [];
  const blocked = count('blocked');
  const atRisk  = count('at_risk');
  const waiting = count('waiting_on_you');
  const team    = count('waiting_on_team');

  if (blocked) { parts.push(`${blocked} blocked`); }
  if (atRisk)  { parts.push(`${atRisk} at risk`); }
  if (waiting) { parts.push(`${waiting} waiting on you`); }
  if (!parts.length && team) { parts.push(`${team} waiting on your team`); }

  // Nothing severe today — name what IS there rather than inventing urgency.
  if (!parts.length) {
    const total = sections.reduce((n, s) => n + s.lines.length + s.overflowCount, 0);
    parts.push(`${total} update${total === 1 ? '' : 's'}`);
  }

  const suffix = dayLabel ? ` — ${dayLabel}` : '';
  return `${parts.join(' · ')}${suffix}`;
}

/**
 * Assemble one recipient's digest.
 *
 * @param {Array<object>} rows  unsent digest-class rows for ONE recipient
 * @param {object} [opts]
 * @param {string} [opts.dayLabel]  e.g. 'Monday' — appended to the subject
 * @param {string} [opts.appBaseUrl] for overflow links
 * @returns {null | { subject, sections, totalItems, bodyText }}
 *          null when there is nothing to send — D-643: a digest with no
 *          content is not sent, and the caller must honour that.
 */
function buildDigest(rows, opts = {}) {
  const sections = groupIntoSections(rows);
  if (sections.length === 0) { return null; }

  const totalItems = sections.reduce((n, s) => n + s.lines.length + s.overflowCount, 0);
  if (totalItems === 0) { return null; }

  const base = (opts.appBaseUrl || '').replace(/\/$/, '');
  const blocks = sections.map(s => {
    const lines = s.lines.map(l => `  • ${l}`).join('\n');
    const overflow = s.overflowCount > 0
      ? `\n  + ${s.overflowCount} more — ${base}${s.overflowPath}`
      : '';
    return `${s.title}\n${lines}${overflow}`;
  });

  return {
    subject:    buildSubject(sections, opts),
    sections,
    totalItems,
    bodyText:   blocks.join('\n\n')
  };
}

module.exports = {
  buildDigest,
  groupIntoSections,
  sectionForRow,
  buildSubject,
  SECTIONS,
  SECTION_BY_EVENT,
  MAX_LINES_PER_SECTION
};
