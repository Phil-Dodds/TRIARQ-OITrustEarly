// contract44-return-notifications.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 44, D-646 / D-345 / D-557).
//
// Two gaps found by the 2026-08-02 V1/V2 verification audit and closed here:
//
//   V2 — the L2/L3 return path (record_gate_decision, single-approver branch)
//        sent NO notification at all. Only the L1 consensus branch notified.
//        Same event, two implementations, one of them empty.
//   V1 — at Level 1 there is no assigned approver, so submit_gate_for_approval
//        emailed only Consulted parties. The trio members whose approval the
//        gate actually waits on were not on the recipient list.
//
// These tests exist so neither can regress silently. Email helper mocked to
// capture sends; Supabase mocked via the FIFO queue.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

let queue = [];
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }
const chain = {
  from: () => chain, select: () => chain, insert: () => chain, update: () => chain,
  upsert: () => chain,
  delete: () => chain, eq: () => chain, neq: () => chain, is: () => chain, in: () => chain,
  gte: () => chain, not: () => chain, or: () => chain, order: () => chain, limit: () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};
const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const sentEmails = [];
const emailPath = require.resolve('../src/tools/helpers/notification-email');
require.cache[emailPath] = {
  id: emailPath, filename: emailPath, loaded: true,
  exports: { sendGateNotificationEmail: async (args) => { sentEmails.push(args); return { ok: true }; } }
};

const { record_gate_decision }     = require('../src/tools/record_gate_decision');
const { submit_gate_for_approval } = require('../src/tools/submit_gate_for_approval');
const { requiredItemKeys }         = require('../src/lib/gate-assessment-registry');
const ga1 = (gate, role) => requiredItemKeys(gate, role).map(k => ({ item_key: k, grade: 'B' }));

const CYC = 'cycle-uuid', GATE = 'gate-uuid', APPROVER = 'approver-uuid';
const DCS = 'dcs-u', EPO = 'epo-u', DOL = 'dol-u', SUBMITTER = 'admin-submitter-u';

const cycleRow = (over = {}) => ({
  delivery_cycle_id: CYC, cycle_title: 'Referral Leakage Analysis',
  current_lifecycle_stage: 'BUILD', workstream_id: null, division_id: 'div',
  assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO, assigned_dol_user_id: DOL,
  baseline_level: 2, set_level: null,
  ai_functionality: 'no', ai_delivery_form: null, ai_audience: null,
  ...over
});

const trioUserRows = [
  { id: DCS,       display_name: 'Dana',  email: 'dana@x.com' },
  { id: EPO,       display_name: 'Evan',  email: 'evan@x.com' },
  { id: DOL,       display_name: 'Drew',  email: 'drew@x.com' },
  { id: SUBMITTER, display_name: 'Alex Admin', email: 'alex@x.com' }
];

beforeEach(() => { queue = []; sentEmails.length = 0; });

describe('V2 — L2/L3 gate return notifies submitter and trio (D-345, was silent)', () => {

  test('a Level 2 return emails the submitter and every trio member', async () => {
    const gateRow = {
      gate_record_id: GATE, gate_status: 'awaiting_approval',
      approver_user_id: APPROVER, outcome_verdict: null,
      submitted_by_user_id: SUBMITTER
    };
    queue = [
      { data: gateRow, error: null },                                     // gate
      { data: cycleRow(), error: null },                                  // cycle
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: false, display_name: 'App Rover' }, error: null },
      { data: { ...gateRow, gate_status: 'returned' }, error: null },     // gate update
      { data: { event_id: 'ev-1' }, error: null },                        // gate_returned event
      { data: [], error: null },                                          // clearGateApprovals
      { data: [], error: null },                                          // clearActiveAssessments
      { data: trioUserRows, error: null }                                 // return-notification users
    ];

    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'go_to_build', decision: 'returned',
        approver_notes: 'Scope is not bounded yet.' }, APPROVER);

    assert.equal(r.success, true, r.error);

    const ret = sentEmails.find(e => e.email_type === 'gate_returned');
    assert.ok(ret, 'a Level 2 return sends a notification — this was the silent path');

    const emails = ret.recipients.map(x => x.email).sort();
    assert.deepEqual(emails, ['alex@x.com', 'dana@x.com', 'drew@x.com', 'evan@x.com'],
      'submitter + all trio');
    assert.match(ret.contextParagraph, /Scope is not bounded yet/, 'return reason carried');
    assert.match(ret.subject, /returned/);
  });

  test('the returner is never emailed about their own return', async () => {
    // The approver here IS a trio member (DCS returning at L2).
    const gateRow = {
      gate_record_id: GATE, gate_status: 'awaiting_approval',
      approver_user_id: DCS, outcome_verdict: null, submitted_by_user_id: EPO
    };
    queue = [
      { data: gateRow, error: null },
      { data: cycleRow(), error: null },
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: false, display_name: 'Dana' }, error: null },
      { data: { ...gateRow, gate_status: 'returned' }, error: null },
      { data: { event_id: 'ev-2' }, error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: trioUserRows.filter(u => u.id !== DCS), error: null }
    ];

    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'go_to_build', decision: 'returned',
        approver_notes: 'Needs a target date.' }, DCS);

    assert.equal(r.success, true, r.error);
    const ret = sentEmails.find(e => e.email_type === 'gate_returned');
    assert.ok(ret);
    assert.ok(!ret.recipients.some(x => x.email === 'dana@x.com'),
      'the person who returned it is excluded');
  });

  test('Return with Set Conditions states the condition count in the same email (D-581)', async () => {
    const gateRow = {
      gate_record_id: GATE, gate_status: 'awaiting_approval',
      approver_user_id: APPROVER, outcome_verdict: null, submitted_by_user_id: SUBMITTER
    };
    queue = [
      { data: gateRow, error: null },
      { data: cycleRow(), error: null },
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: false, display_name: 'App Rover' }, error: null },
      { data: { ...gateRow, gate_status: 'returned' }, error: null },
      { data: { event_id: 'ev-3' }, error: null },
      { data: [], error: null },                                          // clearGateApprovals
      { data: [], error: null },                                          // clearActiveAssessments
      { data: [], error: null },                                          // conditions insert
      { data: [], error: null },                                          // conditions event log
      { data: trioUserRows, error: null }
    ];

    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'go_to_build', decision: 'returned',
        approver_notes: 'Two things first.',
        conditions: [{ condition_text: 'Name the DOL' }, { condition_text: 'Add a target date' }]
      }, APPROVER);

    assert.equal(r.success, true, r.error);
    const ret = sentEmails.find(e => e.email_type === 'gate_returned');
    assert.ok(ret, 'one email for the return, not a second for the conditions');
    assert.match(ret.contextParagraph, /2 conditions must be resolved/);
  });
});

describe('V2 — the L1 consensus return keeps notifying, and now reaches the submitter', () => {

  test('an L1 return reaches an on-behalf submitter who is not on the trio', async () => {
    // L1 consensus = effective level 1 AND no assigned approver.
    const gateRow = {
      gate_record_id: GATE, gate_status: 'awaiting_approval',
      approver_user_id: null, outcome_verdict: null, submitted_by_user_id: SUBMITTER
    };
    queue = [
      { data: gateRow, error: null },                                     // gate
      { data: cycleRow({ baseline_level: 1 }), error: null },             // cycle — L1
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: false, display_name: 'Dana' }, error: null },
      { data: { ...gateRow, gate_status: 'returned' }, error: null },     // gate update
      { data: { event_id: 'ev-4' }, error: null },                        // gate_returned event
      { data: [], error: null },                                          // clearGateApprovals
      { data: [], error: null },                                          // clearActiveAssessments
      { data: trioUserRows, error: null }                                 // return-notification users
    ];

    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'go_to_build', decision: 'returned',
        approver_notes: 'Realign and resubmit.' }, DCS);

    assert.equal(r.success, true, r.error);
    const ret = sentEmails.find(e => e.email_type === 'gate_returned');
    assert.ok(ret, 'L1 returns still notify');
    const emails = ret.recipients.map(x => x.email);
    assert.ok(emails.includes('alex@x.com'),
      'the on-behalf submitter is notified — trio-only would have missed them');
  });
});

describe('V1 — Level 1 submission notifies every remaining collected party (D-557)', () => {

  // V1 finding, corrected during the build: at L1 resolvedApproverId IS null,
  // so the recipient list carries no approver — but the trio are NOT missing
  // from it. deriveConsultedUserIdsV2 pushes the non-null trio into the
  // Consulted set before any C stakes, so every remaining collected party is
  // already addressed. Contract 44's premise that "the trio members whose turn
  // it actually is are not on the recipient list at all" does not hold against
  // the code. This test pins that down so the reading cannot drift again — and
  // so that any future change to the Consulted derivation cannot silently drop
  // the trio from L1 submission mail. Fixture order follows the live sequence.
  test('an L1 submission reaches the trio (minus the submitter) and Consulted', async () => {
    const l1Cycle = cycleRow({
      current_lifecycle_stage: 'BRIEF', baseline_level: 1, oversight_user_id: null
    });
    const CONS = 'consulted-u';

    queue = [
      { data: l1Cycle, error: null },                                     // cycle
      { data: { is_admin: false, display_name: 'Dana' }, error: null },   // caller
      { data: { delivery_cycle_id: CYC }, error: null },                  // sizing (G3)
      { data: { gate_record_id: GATE, gate_status: 'pending' }, error: null }, // gate record
      { data: [], error: null },                                          // open conditions
      { data: { gate_record_id: GATE, gate_status: 'awaiting_approval' }, error: null }, // gate update
      { data: null, error: null },                                        // trio approval read
      { data: [], error: null },                                          // trio approval write
      { data: [], error: null },                                          // approval event log
      { data: [], error: null },                                          // assessments clear
      { data: [], error: null },                                          // assessments insert
      { data: null, error: null },                                        // gate_submitted event
      { data: [{ holder_user_id: CONS }], error: null },                  // C stakes
      { data: [], error: null },                                          // consultations read
      { data: [], error: null },                                          // consultations insert
      { data: [                                                           // recipient lookup
          { id: EPO,  display_name: 'Evan',  email: 'evan@x.com' },
          { id: DOL,  display_name: 'Drew',  email: 'drew@x.com' },
          { id: CONS, display_name: 'Casey', email: 'casey@x.com' }
        ], error: null },
      { data: [], error: null }                                           // artifact warnings
    ];

    const r = await submit_gate_for_approval(
      { delivery_cycle_id: CYC, gate_name: 'brief_review',
        assessment: ga1('brief_review', 'submitter') }, DCS);

    assert.equal(r.success, true, r.error);
    assert.equal(r.assigned_approver, null, 'L1 resolves no single approver');
    assert.equal(r.approver_source, 'l1_consensus');

    const sub = sentEmails.find(e => e.email_type === 'gate_submission');
    assert.ok(sub, 'a submission email is sent');

    const emails = [...new Set(sub.recipients.map(x => x.email))].sort();
    assert.ok(emails.includes('evan@x.com') && emails.includes('drew@x.com'),
      'the remaining trio members ARE notified, via the Consulted derivation');
    assert.ok(emails.includes('casey@x.com'), 'C-stake Consulted parties notified');
    assert.ok(!emails.includes('dana@x.com'),
      'the submitter is excluded — submitting counts as their approval (D-557)');
    assert.match(sub.contextParagraph, /every collected party approves/,
      'L1 wording states the consensus model rather than naming an approver');
  });
});
