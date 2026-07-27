// contract39-cast-outcome.test.js — Contract 39 (D-583/D-584/D-585)
// Cast confirmation at Go to Build submission, Close Review outcome verdict
// block, verdict-required approval guard, and post-Go-to-Build Consulted
// removal heavy path. Supabase mocked via the FIFO queue; notification-email
// helper mocked to capture sends.

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

const sentEmails = [];
const emailPath = require.resolve('../src/tools/helpers/notification-email');
require.cache[emailPath] = {
  id: emailPath, filename: emailPath, loaded: true,
  exports: { sendGateNotificationEmail: async (args) => { sentEmails.push(args); return { ok: true }; } }
};

const { submit_gate_for_approval } = require('../src/tools/submit_gate_for_approval');
const { record_gate_decision } = require('../src/tools/record_gate_decision');
const { remove_participation } = require('../src/tools/participation');
const { requiredItemKeys } = require('../src/lib/gate-assessment-registry');

const CYC = 'cycle-uuid', DCS = 'dcs-u', EPO = 'epo-u', DOL = 'dol-u', APPROVER = 'approver-uuid';
const ga1 = (gate, role) => requiredItemKeys(gate, role).map(k => ({ item_key: k, grade: 'A' }));

const cycleRow = (stage) => ({
  delivery_cycle_id: CYC, cycle_title: 'Init', current_lifecycle_stage: stage,
  workstream_id: null, division_id: null, jira_epic_key: 'PS-1',
  assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO, assigned_dol_user_id: DOL,
  baseline_level: 2, set_level: null, oversight_user_id: null,
  ai_functionality: 'no', ai_delivery_form: null, ai_audience: null, ai_board_approved: false
});

beforeEach(() => { queue = []; sentEmails.length = 0; });

// ─────────────────────────────────────────────────────────────────────────────
describe('D-584: cast confirmation at Go to Build submission', () => {

  test('go_to_build blocked when cast_confirmed is absent', async () => {
    queue = [
      { data: cycleRow('DESIGN'), error: null },                          // cycle
      { data: { is_admin: false, display_name: 'Dana' }, error: null },  // caller (DCS)
      { data: { delivery_cycle_id: CYC }, error: null },                 // sizing row present
      { data: [{ gate_name: 'brief_review', gate_status: 'approved' }], error: null } // predecessors
    ];
    const r = await submit_gate_for_approval(
      { delivery_cycle_id: CYC, gate_name: 'go_to_build', assessment: ga1('go_to_build', 'submitter') }, DCS);
    assert.equal(r.success, false);
    assert.match(r.error, /cast has not been confirmed/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('D-585: Close Review outcome verdict block', () => {

  const submissionQueueHead = () => ([
    { data: cycleRow('OUTCOME'), error: null },                          // cycle
    { data: { is_admin: false, display_name: 'Dana' }, error: null },   // caller (DCS)
    { data: { delivery_cycle_id: CYC }, error: null },                  // sizing row present
    { data: ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release']
        .map(g => ({ gate_name: g, gate_status: 'approved' })), error: null } // predecessors
  ]);

  test('close_review submission blocked until verdict, actual, and evidence populated', async () => {
    queue = submissionQueueHead();
    const r = await submit_gate_for_approval(
      { delivery_cycle_id: CYC, gate_name: 'close_review',
        assessment: ga1('close_review', 'submitter'), outcome_verdict: 'met' }, DCS);
    assert.equal(r.success, false);
    assert.match(r.error, /outcome verdict block is incomplete/);
    assert.match(r.error, /actual result/);
    assert.match(r.error, /evidence/);
  });

  test('close_review submission rejects an invalid verdict value', async () => {
    queue = submissionQueueHead();
    const r = await submit_gate_for_approval(
      { delivery_cycle_id: CYC, gate_name: 'close_review',
        assessment: ga1('close_review', 'submitter'),
        outcome_verdict: 'partially', outcome_actual: 'x', outcome_evidence: 'y' }, DCS);
    assert.equal(r.success, false);
    assert.match(r.error, /verdict \(met or not_met\)/);
  });

  test('close_review approval blocked when no verdict is recorded on the gate', async () => {
    queue = [
      { data: { gate_record_id: 'g5', gate_status: 'awaiting_approval',
                approver_user_id: APPROVER, outcome_verdict: null }, error: null }, // gate
      { data: cycleRow('OUTCOME'), error: null },                                   // cycle
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: false,
                display_name: 'App Rover' }, error: null }                          // caller
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'close_review', decision: 'approved' }, APPROVER);
    assert.equal(r.success, false);
    assert.match(r.error, /no outcome verdict is recorded/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('D-584: post-Go-to-Build Consulted removal heavy path', () => {

  const cRecord = {
    record_id: 'pr-1', delivery_cycle_id: CYC, letter: 'C',
    holder_user_id: 'holder-u', holder_group_id: null, removed_at: null
  };

  test('post-GtB removal without a note is blocked — even for the holder', async () => {
    queue = [
      { data: cRecord, error: null },                                    // record
      { data: { gate_status: 'approved' }, error: null }                 // go_to_build gate
    ];
    const r = await remove_participation({ record_id: 'pr-1' }, 'holder-u');
    assert.equal(r.success, false);
    assert.match(r.error, /past Go to Build/);
    assert.match(r.error, /note/i);
  });

  test('post-GtB removal with note succeeds, notifies the party, posts gate-thread event', async () => {
    queue = [
      { data: cRecord, error: null },                                    // record
      { data: { gate_status: 'approved' }, error: null },                // go_to_build gate
      { data: { ...cRecord, removed_at: 'now' }, error: null },          // removal update
      { data: null, error: null },                                       // participation_removed event
      { data: { display_name: 'Remo Ver' }, error: null },               // remover lookup
      { data: { cycle_title: 'Init' }, error: null },                    // cycle lookup
      { data: { display_name: 'Holly Holder', email: 'holly@x.com' }, error: null }, // holder lookup
      { data: { gate_record_id: 'g-awaiting' }, error: null },           // awaiting gate
      { data: null, error: null }                                        // gate thread insert
    ];
    const r = await remove_participation(
      { record_id: 'pr-1', note: 'Scope moved out of their domain' }, 'trio-u');
    assert.equal(r.success, true);
    assert.equal(sentEmails.length, 1);
    assert.equal(sentEmails[0].email_type, 'consulted_removed');
    assert.match(sentEmails[0].contextParagraph, /Holly Holder/);
  });

  test('pre-GtB holder self-removal stays light — no note, no email', async () => {
    queue = [
      { data: cRecord, error: null },                                    // record
      { data: { gate_status: 'not_started' }, error: null },             // go_to_build gate
      { data: { ...cRecord, removed_at: 'now' }, error: null },          // removal update
      { data: null, error: null }                                        // participation_removed event
    ];
    const r = await remove_participation({ record_id: 'pr-1' }, 'holder-u');
    assert.equal(r.success, true);
    assert.equal(sentEmails.length, 0);
  });
});
