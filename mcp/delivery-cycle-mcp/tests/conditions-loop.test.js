// conditions-loop.test.js — Conditions loop (Phil ruling 2026-07-26).
// Durable conditions: created with a return, survive it, block resubmission,
// human-only closure (resolve / withdraw-with-reason). Migration 090.

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

const { withdraw_gate_condition } = require('../src/tools/gate_conditions');
const { record_gate_decision }    = require('../src/tools/record_gate_decision');
const { submit_gate_for_approval } = require('../src/tools/submit_gate_for_approval');
const { requiredItemKeys } = require('../src/lib/gate-assessment-registry');
const ga1Assessment = (gate, role) => requiredItemKeys(gate, role).map(k => ({ item_key: k, grade: 'B' }));

const CYC = 'cycle-uuid', GATE = 'gate-uuid', APPROVER = 'approver-uuid', DCS = 'dcs-uuid';

beforeEach(() => { queue = []; });

describe('withdraw_gate_condition', () => {

  test('requires a reason', async () => {
    const r = await withdraw_gate_condition({ condition_id: 'c1' }, APPROVER);
    assert.equal(r.success, false);
    assert.match(r.error, /reason is required/i);
  });

  test('rejects non-open conditions', async () => {
    queue = [
      { data: { condition_id: 'c1', gate_record_id: GATE, condition_status: 'resolved', set_by_user_id: APPROVER }, error: null }
    ];
    const r = await withdraw_gate_condition({ condition_id: 'c1', reason: 'moot' }, APPROVER);
    assert.equal(r.success, false);
    assert.match(r.error, /Only open conditions/);
  });

  test('setter withdraws with reason — status withdrawn, reason recorded', async () => {
    queue = [
      { data: { condition_id: 'c1', gate_record_id: GATE, condition_status: 'open', set_by_user_id: APPROVER }, error: null },
      { data: { condition_id: 'c1', condition_status: 'withdrawn', resolution_note: 'Withdrawn — moot now' }, error: null }, // update
      { data: { delivery_cycle_id: CYC, gate_name: 'go_to_build' }, error: null }, // gate for event
      { data: null, error: null }                                                  // event insert
    ];
    const r = await withdraw_gate_condition({ condition_id: 'c1', reason: 'moot now' }, APPROVER);
    assert.equal(r.success, true);
    assert.equal(r.data.condition_status, 'withdrawn');
  });
});

describe('return with set conditions (record_gate_decision)', () => {

  test('single-approver return creates the attached conditions open', async () => {
    const gateRow = { gate_record_id: GATE, gate_status: 'awaiting_approval', approver_user_id: APPROVER };
    queue = [
      { data: gateRow, error: null },                                     // gate
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', current_lifecycle_stage: 'DESIGN',
                workstream_id: null, division_id: null, assigned_dcs_user_id: DCS,
                assigned_epo_user_id: 'e', assigned_dol_user_id: 'd',
                baseline_level: 2, set_level: null, ai_functionality: 'no',
                ai_delivery_form: null, ai_audience: null }, error: null }, // cycle
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: false, display_name: 'App Rover' }, error: null }, // caller
      { data: { ...gateRow, gate_status: 'returned' }, error: null },     // gate update
      { data: { event_id: 'ev1' }, error: null },                         // gate_returned event
      { data: null, error: null },                                        // clear approvals
      { data: null, error: null },                                        // clear assessments (GA-1)
      { data: null, error: null },                                        // conditions INSERT
      { data: null, error: null }                                         // returned_with_conditions event
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'go_to_build', decision: 'returned',
        approver_notes: 'fix these',
        conditions: [{ condition_text: 'Tighten the pilot plan' }, { condition_text: 'Name the DOL backup' }] },
      APPROVER);
    assert.equal(r.success, true, r.error);
    assert.equal(r.data.gate_record.gate_status, 'returned');
    assert.equal(queue.length, 0, 'condition insert + event consumed — conditions created, never cleared');
  });
});

describe('open conditions block resubmission (submit_gate_for_approval)', () => {

  test('resubmit refused while conditions are open, items named', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', division_id: null,
                current_lifecycle_stage: 'DESIGN', assigned_dcs_user_id: DCS,
                assigned_epo_user_id: 'e', assigned_dol_user_id: 'd',
                jira_epic_key: null, ai_functionality: 'no', workstream_id: null,
                baseline_level: 2, set_level: null, oversight_user_id: null }, error: null }, // cycle
      { data: { is_admin: false, display_name: 'DCS User' }, error: null },  // caller (assigned DCS)
      { data: { delivery_cycle_id: CYC }, error: null },                     // sizing row exists
      // brief_review: no predecessors; DCS/DOL assigned; baseline 2 → no L1 floor
      { data: { gate_record_id: GATE, gate_status: 'returned' }, error: null }, // gate record
      { data: [{ condition_text: 'Tighten the pilot plan' }], error: null },    // OPEN conditions
      { data: null, error: null }                                              // gate_blocked event
    ];
    const r = await submit_gate_for_approval(
      { delivery_cycle_id: CYC, gate_name: 'brief_review',
        assessment: ga1Assessment('brief_review', 'submitter') }, DCS);
    assert.equal(r.success, false);
    assert.match(r.error, /condition/);
    assert.match(r.error, /Tighten the pilot plan/);
  });
});
