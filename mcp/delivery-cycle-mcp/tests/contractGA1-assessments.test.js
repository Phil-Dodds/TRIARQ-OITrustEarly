// contractGA1-assessments.test.js — Contract GA-1 (D-579) Gate Assessments.
// Registry validation (AC #1/#8), role scoping (AC #2), blind-until-decision
// filtering (AC #3/#4), clearing semantics (AC #5), and the submit-tool twin
// enforcement via the FIFO Supabase mock.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

let queue = [];
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }
const chain = {
  from:   () => chain,
  select: () => chain,
  insert: () => chain,
  update: () => chain,
  delete: () => chain,
  eq:     () => chain,
  is:     () => chain,
  in:     () => chain,
  gte:    () => chain,
  not:    () => chain,
  or:     () => chain,
  order:  () => chain,
  limit:  () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};
const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const { requiredItemKeys, validateAssessment, GATE_SUB_ITEMS, TOP_LEVEL_ITEMS } =
  require('../src/lib/gate-assessment-registry');
const { filterForViewer } = require('../src/tools/helpers/gate-assessments');
const { submit_gate_for_approval } = require('../src/tools/submit_gate_for_approval');

const CYC = 'cycle-uuid', DCS = 'dcs-uuid', OTHER = 'other-uuid';

beforeEach(() => { queue = []; });

const gradeAll = (gate, role, grade = 'B') =>
  requiredItemKeys(gate, role).map(k => ({ item_key: k, grade }));

describe('GA-1 registry — item sets per gate and role', () => {

  test('Brief Review submitter set = 3 top-level + 5 subs (AC #1: 8 items)', () => {
    const keys = requiredItemKeys('brief_review', 'submitter');
    assert.equal(keys.length, 8);
    assert.ok(keys.includes('trio_alignment'));
    assert.ok(keys.includes('br_dates'));
  });

  test('consulted set = stakeholders + subs only (AC #2)', () => {
    const keys = requiredItemKeys('go_to_build', 'consulted');
    assert.ok(!keys.includes('trio_alignment'));
    assert.ok(!keys.includes('best_practices'));
    assert.ok(keys.includes('stakeholders'));
    assert.ok(keys.includes('gtb_risks'));
    assert.equal(keys.length, 1 + GATE_SUB_ITEMS.go_to_build.length);
  });

  test('every gate has sub-items; top-level trio is exactly three', () => {
    for (const g of Object.keys(GATE_SUB_ITEMS)) {
      assert.ok(GATE_SUB_ITEMS[g].length > 0, g);
    }
    assert.equal(TOP_LEVEL_ITEMS.length, 3);
  });
});

describe('GA-1 validation (AC #1, #8)', () => {

  test('complete grades pass; comments optional', () => {
    const v = validateAssessment('brief_review', 'submitter', gradeAll('brief_review', 'submitter'));
    assert.equal(v.ok, true);
    assert.equal(v.items.length, 8);
    assert.equal(v.items[0].comment, null);
  });

  test('missing an item is rejected with the missing key named', () => {
    const items = gradeAll('brief_review', 'submitter').slice(0, 7);
    const v = validateAssessment('brief_review', 'submitter', items);
    assert.equal(v.ok, false);
    assert.match(v.error, /Missing:/);
  });

  test('blank grade rejected', () => {
    const items = gradeAll('close_review', 'approver');
    items[0] = { item_key: items[0].item_key, grade: '' };
    const v = validateAssessment('close_review', 'approver', items);
    assert.equal(v.ok, false);
    assert.match(v.error, /blank is not accepted/);
  });

  test('unknown item_key rejected (server twin, AC #8)', () => {
    const items = [...gradeAll('go_to_deploy', 'submitter'), { item_key: 'made_up', grade: 'A' }];
    const v = validateAssessment('go_to_deploy', 'submitter', items);
    assert.equal(v.ok, false);
    assert.match(v.error, /Unknown or out-of-scope/);
  });

  test('out-of-scope item for role rejected (consulted grading trio_alignment)', () => {
    const items = [...gradeAll('go_to_build', 'consulted'), { item_key: 'trio_alignment', grade: 'A' }];
    const v = validateAssessment('go_to_build', 'consulted', items);
    assert.equal(v.ok, false);
  });

  test('NA accepted as a grade; comments trimmed', () => {
    const items = gradeAll('go_to_release', 'consulted', 'NA');
    items[0].comment = '  fine  ';
    const v = validateAssessment('go_to_release', 'consulted', items);
    assert.equal(v.ok, true);
    assert.equal(v.items[0].grade, 'NA');
    assert.equal(v.items[0].comment, 'fine');
  });
});

describe('GA-1 blind-until-decision filtering (AC #3, #4)', () => {
  const rows = [
    { respondent_user_id: DCS,   item_key: 'trio_alignment', grade: 'A' },
    { respondent_user_id: OTHER, item_key: 'trio_alignment', grade: 'C' }
  ];

  test('pre-decision, a non-approver sees only their own rows', () => {
    const out = filterForViewer(rows, { viewer_user_id: DCS, gate_status: 'awaiting_approval', viewerIsApprover: false });
    assert.equal(out.length, 1);
    assert.equal(out[0].respondent_user_id, DCS);
  });

  test('the approver-in-decision sees all rows', () => {
    const out = filterForViewer(rows, { viewer_user_id: 'appr', gate_status: 'awaiting_approval', viewerIsApprover: true });
    assert.equal(out.length, 2);
  });

  test('post-decision (approved or returned) everyone sees all rows', () => {
    for (const s of ['approved', 'returned']) {
      const out = filterForViewer(rows, { viewer_user_id: OTHER, gate_status: s, viewerIsApprover: false });
      assert.equal(out.length, 2);
    }
  });
});

describe('GA-1 submit-tool twin enforcement (AC #1)', () => {

  test('assigned-DCS submit without an assessment is blocked', async () => {
    queue = [
      // cycle fetch — caller is assigned DCS; unsized checks bypassed by fixtures below
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', division_id: null,
                current_lifecycle_stage: 'BRIEF', assigned_dcs_user_id: DCS,
                assigned_epo_user_id: 'epo', assigned_dol_user_id: 'dol',
                jira_epic_key: null, ai_functionality: null, workstream_id: null,
                baseline_level: 2, set_level: null, oversight_user_id: null }, error: null },
      // caller fetch
      { data: { is_admin: false, display_name: 'DCS User' }, error: null },
      // sizing row exists (maybeSingle)
      { data: { delivery_cycle_id: CYC }, error: null }
      // predecessor pre-check: brief_review has none — no fixture needed
      // then the GA-1 validation fails before any gate-record fetch
    ];
    const res = await submit_gate_for_approval(
      { delivery_cycle_id: CYC, gate_name: 'brief_review' }, DCS);
    assert.equal(res.success, false);
    assert.match(res.error, /every presented item needs a grade|Missing:/);
  });
});
