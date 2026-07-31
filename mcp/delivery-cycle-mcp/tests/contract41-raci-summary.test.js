// contract41-raci-summary.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 41, Phil 2026-07-31).
// get_my_raci_gate_summary: the Home card that DISCOVERS the caller's R/C/I
// Initiatives, then splits their gates into awaiting-now and recently-approved.
// FIFO-queue mock per Rule 37 / the established technique.
//
// Query order the fixtures must match:
//   1 specialty_group_members  (caller's groups)
//   2 participation_records    (C/I stakes)
//   3 delivery_cycles          (R — trio membership)
//   4 delivery_cycles          (the Initiatives themselves)
//   5 gate_records             (all gates on those Initiatives)
//   6 divisions  +  7 users    (Promise.all — divisions resolves first)

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
  upsert: () => chain,
  delete: () => chain,
  eq:     () => chain,
  is:     () => chain,
  in:     () => chain,
  not:    () => chain,
  or:     () => chain,
  gte:    () => chain,
  order:  () => chain,
  limit:  () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};
chain.functions = { invoke: async () => ({ data: null, error: null }) };

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain }
};

const {
  get_my_raci_gate_summary,
  RACI_RECENT_COMPLETED_DAYS
} = require('../src/tools/get_my_raci_gate_summary');

const ME = 'me-uuid', APPROVER = 'appr-uuid', SUBMITTER = 'sub-uuid';
const CYC_R = 'cyc-r', CYC_C = 'cyc-c';

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

const cycle = (id, over = {}) => ({
  delivery_cycle_id: id, cycle_title: `Initiative ${id}`,
  division_id: 'div', current_lifecycle_stage: 'BUILD', ...over
});

const divisions = { data: [{ id: 'div', division_name: 'Division A', display_name_short: 'DivA' }], error: null };
const people = {
  data: [{ id: APPROVER, display_name: 'Jane Approver' }, { id: SUBMITTER, display_name: 'Sam Submitter' }],
  error: null
};

beforeEach(() => { queue = []; });

describe('get_my_raci_gate_summary — identity and empty cases', () => {

  test('missing caller identity is rejected', async () => {
    const r = await get_my_raci_gate_summary({}, '');
    assert.equal(r.success, false);
    assert.match(r.error, /identity/i);
  });

  test('no stakes and no trio membership yields two empty lists, not an error', async () => {
    queue = [
      { data: [], error: null },   // groups
      { data: [], error: null },   // participation
      { data: [], error: null }    // trio cycles
    ];
    const r = await get_my_raci_gate_summary({}, ME);
    assert.equal(r.success, true);
    assert.deepEqual(r.data.pending_gates, []);
    assert.deepEqual(r.data.completed_gates, []);
    assert.equal(r.data.recent_window_days, RACI_RECENT_COMPLETED_DAYS);
  });

  test('a group-membership lookup failure is surfaced, not swallowed', async () => {
    queue = [{ data: null, error: { message: 'boom' } }];
    const r = await get_my_raci_gate_summary({}, ME);
    assert.equal(r.success, false);
    assert.match(r.error, /group memberships/i);
  });

  test('a participation lookup failure is surfaced', async () => {
    queue = [
      { data: [], error: null },
      { data: null, error: { message: 'boom' } }
    ];
    const r = await get_my_raci_gate_summary({}, ME);
    assert.equal(r.success, false);
    assert.match(r.error, /participation stakes/i);
  });
});

describe('get_my_raci_gate_summary — letters', () => {

  test('R comes from trio membership; C and I from participation records', async () => {
    queue = [
      { data: [], error: null },                                              // groups
      { data: [{ delivery_cycle_id: CYC_C, letter: 'C' },
               { delivery_cycle_id: CYC_C, letter: 'I' }], error: null },     // participation
      { data: [{ delivery_cycle_id: CYC_R }], error: null },                  // trio
      { data: [cycle(CYC_R), cycle(CYC_C)], error: null },                    // cycles
      { data: [
          { gate_record_id: 'g-r', delivery_cycle_id: CYC_R, gate_name: 'go_to_build', gate_status: 'awaiting_approval', approver_user_id: APPROVER, approver_decision_at: null, submitted_at: daysAgo(3), submitted_by_user_id: SUBMITTER },
          { gate_record_id: 'g-c', delivery_cycle_id: CYC_C, gate_name: 'go_to_deploy', gate_status: 'awaiting_approval', approver_user_id: APPROVER, approver_decision_at: null, submitted_at: daysAgo(1), submitted_by_user_id: SUBMITTER }
        ], error: null },                                                     // gates
      divisions,
      people
    ];
    const r = await get_my_raci_gate_summary({}, ME);
    assert.equal(r.success, true);
    assert.equal(r.data.pending_gates.length, 2);

    const byCycle = {};
    r.data.pending_gates.forEach(row => { byCycle[row.delivery_cycle_id] = row; });
    assert.deepEqual(byCycle[CYC_R].my_letters, { r: true, c: false, i: false });
    assert.deepEqual(byCycle[CYC_C].my_letters, { r: false, c: true, i: true });
  });

  test('trio membership and a stake on the same Initiative combine letters', async () => {
    queue = [
      { data: [], error: null },
      { data: [{ delivery_cycle_id: CYC_R, letter: 'C' }], error: null },
      { data: [{ delivery_cycle_id: CYC_R }], error: null },
      { data: [cycle(CYC_R)], error: null },
      { data: [
          { gate_record_id: 'g-1', delivery_cycle_id: CYC_R, gate_name: 'go_to_build', gate_status: 'awaiting_approval', approver_user_id: APPROVER, approver_decision_at: null, submitted_at: daysAgo(2), submitted_by_user_id: SUBMITTER }
        ], error: null },
      divisions,
      people
    ];
    const r = await get_my_raci_gate_summary({}, ME);
    assert.deepEqual(r.data.pending_gates[0].my_letters, { r: true, c: true, i: false });
  });

  test('a group-held stake counts as the caller\'s own', async () => {
    queue = [
      { data: [{ group_id: 'grp-1' }], error: null },                          // caller is in a group
      { data: [{ delivery_cycle_id: CYC_C, letter: 'C' }], error: null },      // stake held via that group
      { data: [], error: null },                                              // no trio membership
      { data: [cycle(CYC_C)], error: null },
      { data: [
          { gate_record_id: 'g-1', delivery_cycle_id: CYC_C, gate_name: 'go_to_build', gate_status: 'awaiting_approval', approver_user_id: APPROVER, approver_decision_at: null, submitted_at: daysAgo(2), submitted_by_user_id: SUBMITTER }
        ], error: null },
      divisions,
      people
    ];
    const r = await get_my_raci_gate_summary({}, ME);
    assert.equal(r.data.pending_gates.length, 1);
    assert.equal(r.data.pending_gates[0].my_letters.c, true);
  });
});

describe('get_my_raci_gate_summary — pending vs completed split', () => {

  const withGates = (gateRows) => [
    { data: [], error: null },
    { data: [], error: null },
    { data: [{ delivery_cycle_id: CYC_R }], error: null },
    { data: [cycle(CYC_R)], error: null },
    { data: gateRows, error: null },
    divisions,
    people
  ];

  test('awaiting_approval lands in pending; recent approved lands in completed', async () => {
    queue = withGates([
      { gate_record_id: 'g-await', delivery_cycle_id: CYC_R, gate_name: 'go_to_deploy', gate_status: 'awaiting_approval', approver_user_id: APPROVER, approver_decision_at: null, submitted_at: daysAgo(4), submitted_by_user_id: SUBMITTER },
      { gate_record_id: 'g-done', delivery_cycle_id: CYC_R, gate_name: 'go_to_build', gate_status: 'approved', approver_user_id: APPROVER, approver_decision_at: daysAgo(2), submitted_at: daysAgo(9), submitted_by_user_id: SUBMITTER }
    ]);
    const r = await get_my_raci_gate_summary({}, ME);
    assert.equal(r.data.pending_gates.length, 1);
    assert.equal(r.data.pending_gates[0].gate_record_id, 'g-await');
    assert.equal(r.data.completed_gates.length, 1);
    assert.equal(r.data.completed_gates[0].gate_record_id, 'g-done');
  });

  test('an approval older than the window is excluded', async () => {
    queue = withGates([
      { gate_record_id: 'g-stale', delivery_cycle_id: CYC_R, gate_name: 'brief_review', gate_status: 'approved', approver_user_id: APPROVER, approver_decision_at: daysAgo(RACI_RECENT_COMPLETED_DAYS + 5), submitted_at: daysAgo(40), submitted_by_user_id: SUBMITTER }
    ]);
    const r = await get_my_raci_gate_summary({}, ME);
    assert.deepEqual(r.data.completed_gates, []);
  });

  test('an approved gate with no decision timestamp is excluded, not counted as today', async () => {
    queue = withGates([
      { gate_record_id: 'g-nodate', delivery_cycle_id: CYC_R, gate_name: 'brief_review', gate_status: 'approved', approver_user_id: APPROVER, approver_decision_at: null, submitted_at: daysAgo(9), submitted_by_user_id: SUBMITTER }
    ]);
    const r = await get_my_raci_gate_summary({}, ME);
    assert.deepEqual(r.data.completed_gates, []);
  });

  test('statuses that are neither awaiting nor approved appear in neither list', async () => {
    queue = withGates([
      { gate_record_id: 'g-skip', delivery_cycle_id: CYC_R, gate_name: 'brief_review', gate_status: 'skipped', approver_user_id: null, approver_decision_at: daysAgo(1), submitted_at: null, submitted_by_user_id: null },
      { gate_record_id: 'g-open', delivery_cycle_id: CYC_R, gate_name: 'go_to_build', gate_status: 'not_submitted', approver_user_id: null, approver_decision_at: null, submitted_at: null, submitted_by_user_id: null }
    ]);
    const r = await get_my_raci_gate_summary({}, ME);
    assert.deepEqual(r.data.pending_gates, []);
    assert.deepEqual(r.data.completed_gates, []);
  });

  test('pending is oldest-first and completed is most-recent-first', async () => {
    queue = withGates([
      { gate_record_id: 'p-new', delivery_cycle_id: CYC_R, gate_name: 'go_to_build', gate_status: 'awaiting_approval', approver_user_id: APPROVER, approver_decision_at: null, submitted_at: daysAgo(1), submitted_by_user_id: SUBMITTER },
      { gate_record_id: 'p-old', delivery_cycle_id: CYC_R, gate_name: 'go_to_deploy', gate_status: 'awaiting_approval', approver_user_id: APPROVER, approver_decision_at: null, submitted_at: daysAgo(11), submitted_by_user_id: SUBMITTER },
      { gate_record_id: 'd-old', delivery_cycle_id: CYC_R, gate_name: 'brief_review', gate_status: 'approved', approver_user_id: APPROVER, approver_decision_at: daysAgo(10), submitted_at: daysAgo(20), submitted_by_user_id: SUBMITTER },
      { gate_record_id: 'd-new', delivery_cycle_id: CYC_R, gate_name: 'go_to_release', gate_status: 'approved', approver_user_id: APPROVER, approver_decision_at: daysAgo(1), submitted_at: daysAgo(5), submitted_by_user_id: SUBMITTER }
    ]);
    const r = await get_my_raci_gate_summary({}, ME);
    assert.deepEqual(r.data.pending_gates.map(g => g.gate_record_id), ['p-old', 'p-new']);
    assert.deepEqual(r.data.completed_gates.map(g => g.gate_record_id), ['d-new', 'd-old']);
  });

  test('days_waiting and days_since_approval are whole days', async () => {
    queue = withGates([
      { gate_record_id: 'p-1', delivery_cycle_id: CYC_R, gate_name: 'go_to_build', gate_status: 'awaiting_approval', approver_user_id: APPROVER, approver_decision_at: null, submitted_at: daysAgo(6), submitted_by_user_id: SUBMITTER },
      { gate_record_id: 'd-1', delivery_cycle_id: CYC_R, gate_name: 'brief_review', gate_status: 'approved', approver_user_id: APPROVER, approver_decision_at: daysAgo(3), submitted_at: daysAgo(12), submitted_by_user_id: SUBMITTER }
    ]);
    const r = await get_my_raci_gate_summary({}, ME);
    assert.equal(r.data.pending_gates[0].days_waiting, 6);
    assert.equal(r.data.completed_gates[0].days_since_approval, 3);
  });
});

describe('get_my_raci_gate_summary — scope and row shape', () => {

  test('a CANCELLED Initiative is excluded entirely (S-009)', async () => {
    queue = [
      { data: [], error: null },
      { data: [], error: null },
      { data: [{ delivery_cycle_id: CYC_R }], error: null },
      { data: [cycle(CYC_R, { current_lifecycle_stage: 'CANCELLED' })], error: null },
      { data: [], error: null }
    ];
    const r = await get_my_raci_gate_summary({}, ME);
    assert.deepEqual(r.data.pending_gates, []);
    assert.deepEqual(r.data.completed_gates, []);
  });

  test('a COMPLETE Initiative is NOT excluded — a just-approved Close Review belongs here', async () => {
    queue = [
      { data: [], error: null },
      { data: [], error: null },
      { data: [{ delivery_cycle_id: CYC_R }], error: null },
      { data: [cycle(CYC_R, { current_lifecycle_stage: 'COMPLETE' })], error: null },
      { data: [
          { gate_record_id: 'g-close', delivery_cycle_id: CYC_R, gate_name: 'close_review', gate_status: 'approved', approver_user_id: APPROVER, approver_decision_at: daysAgo(1), submitted_at: daysAgo(4), submitted_by_user_id: SUBMITTER }
        ], error: null },
      divisions,
      people
    ];
    const r = await get_my_raci_gate_summary({}, ME);
    assert.equal(r.data.completed_gates.length, 1);
    assert.equal(r.data.completed_gates[0].gate_name, 'close_review');
  });

  test('a soft-deleted Initiative referenced by a stake drops out silently', async () => {
    queue = [
      { data: [], error: null },
      { data: [{ delivery_cycle_id: 'gone', letter: 'C' }], error: null },
      { data: [], error: null },
      { data: [], error: null }   // the cycles query filters deleted_at, returns nothing
    ];
    const r = await get_my_raci_gate_summary({}, ME);
    assert.equal(r.success, true);
    assert.deepEqual(r.data.pending_gates, []);
  });

  test('gate label comes from the canonical map, never milestone_label (Rule 36)', async () => {
    queue = [
      { data: [], error: null },
      { data: [], error: null },
      { data: [{ delivery_cycle_id: CYC_R }], error: null },
      { data: [cycle(CYC_R)], error: null },
      { data: [
          { gate_record_id: 'g-1', delivery_cycle_id: CYC_R, gate_name: 'go_to_release', gate_status: 'awaiting_approval', approver_user_id: APPROVER, approver_decision_at: null, submitted_at: daysAgo(2), submitted_by_user_id: SUBMITTER, milestone_label: 'WRONG LABEL' }
        ], error: null },
      divisions,
      people
    ];
    const r = await get_my_raci_gate_summary({}, ME);
    assert.equal(r.data.pending_gates[0].gate_name_display, 'Go to Release');
  });

  test('row carries division, approver, submitter, and stage for display', async () => {
    queue = [
      { data: [], error: null },
      { data: [], error: null },
      { data: [{ delivery_cycle_id: CYC_R }], error: null },
      { data: [cycle(CYC_R, { cycle_title: 'Dynamic Patient Forms', current_lifecycle_stage: 'BUILD' })], error: null },
      { data: [
          { gate_record_id: 'g-1', delivery_cycle_id: CYC_R, gate_name: 'go_to_build', gate_status: 'awaiting_approval', approver_user_id: APPROVER, approver_decision_at: null, submitted_at: daysAgo(2), submitted_by_user_id: SUBMITTER }
        ], error: null },
      divisions,
      people
    ];
    const r = await get_my_raci_gate_summary({}, ME);
    const row = r.data.pending_gates[0];
    assert.equal(row.cycle_title, 'Dynamic Patient Forms');
    assert.equal(row.current_lifecycle_stage, 'BUILD');
    assert.equal(row.division_display_name_short, 'DivA');
    assert.equal(row.approver_display_name, 'Jane Approver');
    assert.equal(row.submitted_by_display_name, 'Sam Submitter');
  });

  test('an unresolvable approver yields null, not undefined', async () => {
    queue = [
      { data: [], error: null },
      { data: [], error: null },
      { data: [{ delivery_cycle_id: CYC_R }], error: null },
      { data: [cycle(CYC_R)], error: null },
      { data: [
          { gate_record_id: 'g-1', delivery_cycle_id: CYC_R, gate_name: 'go_to_build', gate_status: 'awaiting_approval', approver_user_id: 'ghost', approver_decision_at: null, submitted_at: daysAgo(2), submitted_by_user_id: null }
        ], error: null },
      divisions,
      { data: [], error: null }   // no user rows resolve
    ];
    const r = await get_my_raci_gate_summary({}, ME);
    assert.equal(r.data.pending_gates[0].approver_display_name, null);
    assert.equal(r.data.pending_gates[0].submitted_by_display_name, null);
  });

  test('a gate-records failure is surfaced', async () => {
    queue = [
      { data: [], error: null },
      { data: [], error: null },
      { data: [{ delivery_cycle_id: CYC_R }], error: null },
      { data: [cycle(CYC_R)], error: null },
      { data: null, error: { message: 'boom' } }
    ];
    const r = await get_my_raci_gate_summary({}, ME);
    assert.equal(r.success, false);
    assert.match(r.error, /gate records/i);
  });
});
