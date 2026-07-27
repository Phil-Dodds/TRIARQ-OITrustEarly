// contractGA1-roster-notification.test.js — GA-1 scope addition (Design 2026-07-25)
// Close Review approval → the decision notification to trio + consulted carries
// the assessment roster; other gates unchanged. notification-email helper is
// mocked to capture sends; Supabase mocked via the FIFO queue.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

let queue = [];
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }
const chain = {
  from: () => chain, select: () => chain, insert: () => chain, update: () => chain,
  delete: () => chain, eq: () => chain, neq: () => chain, is: () => chain, in: () => chain,
  gte: () => chain, not: () => chain, or: () => chain, order: () => chain, limit: () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};
const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

// Capture outbound notification emails.
const sentEmails = [];
const emailPath = require.resolve('../src/tools/helpers/notification-email');
require.cache[emailPath] = {
  id: emailPath, filename: emailPath, loaded: true,
  exports: { sendGateNotificationEmail: async (args) => { sentEmails.push(args); return { ok: true }; } }
};

const { record_gate_decision } = require('../src/tools/record_gate_decision');
const { buildAssessmentRosterText } = require('../src/tools/helpers/gate-assessments');
const { requiredItemKeys } = require('../src/lib/gate-assessment-registry');

const CYC = 'cycle-uuid', GATE = 'gate-uuid', APPROVER = 'approver-uuid', DCS = 'dcs-u', EPO = 'epo-u', DOL = 'dol-u';
const ga1Assessment = (gate, role) => requiredItemKeys(gate, role).map(k => ({ item_key: k, grade: 'A' }));

const cycleRow = (stage) => ({
  delivery_cycle_id: CYC, cycle_title: 'Closing Init', current_lifecycle_stage: stage,
  workstream_id: null, division_id: null,
  assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO, assigned_dol_user_id: DOL,
  baseline_level: 2, set_level: null, ai_functionality: 'no', ai_delivery_form: null, ai_audience: null
});

beforeEach(() => { queue = []; sentEmails.length = 0; });

describe('roster text builder', () => {
  test('groups per respondent, active rows only, comments quoted', () => {
    const rows = [
      { respondent_user_id: DCS, respondent_role: 'submitter', item_key: 'cr_outcomes', grade: 'A', comment: 'solid', cleared_by_return_at: null },
      { respondent_user_id: DCS, respondent_role: 'submitter', item_key: 'cr_retro', grade: 'NA', comment: null, cleared_by_return_at: null },
      { respondent_user_id: EPO, respondent_role: 'trio_member', item_key: 'cr_outcomes', grade: 'B', comment: null, cleared_by_return_at: '2026-07-01' }
    ];
    const text = buildAssessmentRosterText(rows, { [DCS]: 'Dana', [EPO]: 'Evan' });
    assert.match(text, /Dana \(Submitter\): cr_outcomes A \(“solid”\) · cr_retro N\/A/);
    assert.doesNotMatch(text, /Evan/, 'cleared rows excluded');
  });
});

describe('Close Review approval → roster notification (Design 2026-07-25)', () => {

  test('close_review approve sends the roster email to trio + consulted', async () => {
    // D-585 (Contract 39): close_review approval requires a recorded verdict.
    const gateRow = { gate_record_id: GATE, gate_status: 'awaiting_approval', approver_user_id: APPROVER, outcome_verdict: 'met' };
    queue = [
      { data: gateRow, error: null },                                     // gate
      { data: cycleRow('OUTCOME'), error: null },                         // cycle
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: false, display_name: 'App Rover' }, error: null }, // caller
      { data: [], error: null },                                          // declined consultations (D-569) — none
      { data: [], error: null },                                          // open conditions — none
      // ── applyGateApprovalTransition ──
      { data: { ...gateRow, gate_status: 'approved', approver_user_id: APPROVER }, error: null }, // gate update
      { data: null, error: null },                                        // milestone update
      { data: null, error: null },                                        // stage advance
      { data: null, error: null },                                        // gate_approved event
      { data: null, error: null },                                        // stage_advanced event
      { data: [], error: null },                                          // informed stakes — none
      // close_review roster block (inside the transition, after informed):
      { data: [
          { respondent_user_id: DCS, respondent_role: 'submitter', item_key: 'cr_outcomes', grade: 'A', comment: null, cleared_by_return_at: null, created_at: 't' }
        ], error: null },                                                 // fetchAssessments
      { data: [{ consulted_user_id: 'cons-1' }], error: null },           // gate_consultations
      { data: [
          { id: DCS, display_name: 'Dana', email: 'dana@x.com' },
          { id: EPO, display_name: 'Evan', email: 'evan@x.com' },
          { id: DOL, display_name: 'Drew', email: 'drew@x.com' },
          { id: 'cons-1', display_name: 'Casey', email: 'casey@x.com' }
        ], error: null },                                                 // roster users
      { data: [], error: null },                                          // suggestion warnings: artifact types
      { data: [], error: null },                                          // suggestion warnings: attachments
      // ── after the transition: approver assessment save ──
      { data: null, error: null },                                        // self-supersede clear
      { data: null, error: null }                                         // insert
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'close_review', decision: 'approved',
        assessment: ga1Assessment('close_review', 'approver') }, APPROVER);
    assert.equal(r.success, true, r.error);
    const roster = sentEmails.find(e => e.email_type === 'close_review_assessment_roster');
    assert.ok(roster, 'roster email sent');
    assert.match(roster.contextParagraph, /Dana \(Submitter\): cr_outcomes A/);
    const emails = roster.recipients.map(x => x.email).sort();
    assert.ok(emails.includes('casey@x.com'), 'consulted included');
    assert.ok(emails.includes('dana@x.com') && emails.includes('evan@x.com') && emails.includes('drew@x.com'), 'trio included');
  });

  test('stage graduates from ANY earlier stage on gate approval (Phil 2026-07-26)', async () => {
    // go_to_build approved while the cycle sits at DESIGN (Spec never manually
    // entered) — the old prevStageOf() check silently skipped the advance.
    // D-585 (Contract 39): close_review approval requires a recorded verdict.
    const gateRow = { gate_record_id: GATE, gate_status: 'awaiting_approval', approver_user_id: APPROVER, outcome_verdict: 'met' };
    queue = [
      { data: gateRow, error: null },
      { data: { ...cycleRow('DESIGN'), assigned_epo_user_id: null }, error: null },
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: false, display_name: 'App Rover' }, error: null },
      { data: [], error: null },                                          // declined consultations
      { data: [], error: null },                                          // open conditions
      { data: { ...gateRow, gate_status: 'approved' }, error: null },     // gate update
      { data: null, error: null },                                        // milestone
      { data: null, error: null },                                        // stage advance UPDATE
      { data: null, error: null },                                        // gate_approved event
      { data: null, error: null },                                        // stage_advanced event
      { data: [], error: null },                                          // informed stakes
      { data: [], error: null },                                          // artifact types
      { data: [], error: null },                                          // attachments
      { data: null, error: null },                                        // assessment clear
      { data: null, error: null }                                         // assessment insert
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'go_to_build', decision: 'approved',
        assessment: ga1Assessment('go_to_build', 'approver') }, APPROVER);
    assert.equal(r.success, true, r.error);
    assert.equal(r.data.stage_advanced, true, 'stage must graduate past skipped manual stages');
    assert.equal(r.data.new_stage ?? r.data.gate_record?.current_lifecycle_stage ?? 'BUILD', 'BUILD');
  });

  test('other gates: no roster email (control)', async () => {
    // D-585 (Contract 39): close_review approval requires a recorded verdict.
    const gateRow = { gate_record_id: GATE, gate_status: 'awaiting_approval', approver_user_id: APPROVER, outcome_verdict: 'met' };
    queue = [
      { data: gateRow, error: null },
      { data: cycleRow('PILOT'), error: null },
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: false, display_name: 'App Rover' }, error: null },
      { data: [], error: null },                                          // declined consultations
      { data: [], error: null },                                          // open conditions
      { data: { ...gateRow, gate_status: 'approved' }, error: null },     // gate update
      { data: null, error: null },                                        // milestone
      { data: null, error: null },                                        // stage advance
      { data: null, error: null },                                        // gate_approved event
      { data: null, error: null },                                        // stage_advanced event
      { data: [], error: null },                                          // informed stakes
      { data: [], error: null },                                          // artifact types
      { data: [], error: null },                                          // attachments
      { data: null, error: null },                                        // assessment clear
      { data: null, error: null }                                         // assessment insert
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'go_to_release', decision: 'approved',
        assessment: ga1Assessment('go_to_release', 'approver') }, APPROVER);
    assert.equal(r.success, true, r.error);
    assert.equal(sentEmails.filter(e => e.email_type === 'close_review_assessment_roster').length, 0);
  });
});
