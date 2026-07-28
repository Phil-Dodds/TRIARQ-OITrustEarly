// contract40-raci.test.js — Contract 40 WS5 (D-599)
// get_my_raci: per-initiative RACI letters the caller holds. R = trio; A =
// resolved next-gate approver (absent for L1/closed/unsized); C/I from
// participation stakes; C provisional until Go to Build cast committed.

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
  or: () => chain, order: () => chain, limit: () => chain, not: () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};
const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const { get_my_raci } = require('../src/tools/get_my_raci');

const ME = 'me-uuid', CYC = 'c1';

beforeEach(() => { queue = []; });

// Gate rows: all not_started (next gate = brief_review, no approver stored).
function freshGates(cycleId) {
  return ['brief_review','go_to_build','go_to_deploy','go_to_release','close_review']
    .map(g => ({ delivery_cycle_id: cycleId, gate_name: g, gate_status: 'not_started', approver_user_id: null, cast_confirmed_at: null }));
}

describe('WS5 (D-599): get_my_raci', () => {

  test('AC-24: Level 1 initiative → A absent even for the resolved approver', async () => {
    queue = [
      { data: [{ delivery_cycle_id: CYC, division_id: 'd1', current_lifecycle_stage: 'BRIEF',
                 baseline_level: 1, set_level: null, oversight_user_id: null,
                 assigned_dcs_user_id: ME, assigned_epo_user_id: 'x', assigned_dol_user_id: 'y' }], error: null }, // cycles
      { data: freshGates(CYC), error: null },   // gate rows
      { data: [], error: null },                // my groups
      { data: [], error: null }                 // my stakes
    ];
    const r = await get_my_raci({ cycle_ids: [CYC] }, ME);
    assert.equal(r.success, true);
    assert.equal(r.data[CYC].r, true, 'trio member → R');
    assert.equal(r.data[CYC].a, false, 'L1 → no external approver → A absent');
  });

  test('AC-25: closed initiative → A absent', async () => {
    queue = [
      { data: [{ delivery_cycle_id: CYC, division_id: 'd1', current_lifecycle_stage: 'COMPLETE',
                 baseline_level: 2, set_level: null, oversight_user_id: null,
                 assigned_dcs_user_id: 'x', assigned_epo_user_id: 'y', assigned_dol_user_id: 'z' }], error: null },
      { data: freshGates(CYC).map(g => ({ ...g, gate_status: 'approved' })), error: null },
      { data: [], error: null },
      { data: [], error: null }
    ];
    const r = await get_my_raci({ cycle_ids: [CYC] }, ME);
    assert.equal(r.data[CYC].a, false);
  });

  test('AC-25: submitted next gate → A reads the stored approver', async () => {
    const gates = freshGates(CYC);
    gates[0] = { ...gates[0], gate_status: 'awaiting_approval', approver_user_id: ME };
    queue = [
      { data: [{ delivery_cycle_id: CYC, division_id: 'd1', current_lifecycle_stage: 'BRIEF',
                 baseline_level: 2, set_level: null, oversight_user_id: null,
                 assigned_dcs_user_id: 'x', assigned_epo_user_id: 'y', assigned_dol_user_id: 'z' }], error: null },
      { data: gates, error: null },
      { data: [], error: null },
      { data: [], error: null }
    ];
    const r = await get_my_raci({ cycle_ids: [CYC] }, ME);
    assert.equal(r.data[CYC].a, true, 'stored approver == caller → A');
    assert.equal(r.data[CYC].a_gate_name, 'brief_review');
  });

  test('AC-27: Consulted stake is provisional pre-Go-to-Build', async () => {
    queue = [
      { data: [{ delivery_cycle_id: CYC, division_id: 'd1', current_lifecycle_stage: 'BRIEF',
                 baseline_level: 2, set_level: null, oversight_user_id: null,
                 assigned_dcs_user_id: 'x', assigned_epo_user_id: 'y', assigned_dol_user_id: 'z' }], error: null },
      { data: freshGates(CYC), error: null },   // go_to_build not_started → not committed
      { data: [], error: null },                // groups
      { data: [{ delivery_cycle_id: CYC, letter: 'C' }], error: null }  // my stakes: Consulted
    ];
    const r = await get_my_raci({ cycle_ids: [CYC] }, ME);
    assert.equal(r.data[CYC].c, true);
    assert.equal(r.data[CYC].c_provisional, true, 'pre-GtB → provisional');
    assert.equal(r.data[CYC].r, false);
  });

  test('AC-22: plain follower with an Informed stake → i true, others false', async () => {
    queue = [
      { data: [{ delivery_cycle_id: CYC, division_id: 'd1', current_lifecycle_stage: 'BRIEF',
                 baseline_level: 2, set_level: null, oversight_user_id: null,
                 assigned_dcs_user_id: 'x', assigned_epo_user_id: 'y', assigned_dol_user_id: 'z' }], error: null },
      { data: freshGates(CYC), error: null },
      { data: [], error: null },
      { data: [{ delivery_cycle_id: CYC, letter: 'I' }], error: null }
    ];
    const r = await get_my_raci({ cycle_ids: [CYC] }, ME);
    assert.deepEqual(
      { r: r.data[CYC].r, a: r.data[CYC].a, c: r.data[CYC].c, i: r.data[CYC].i },
      { r: false, a: false, c: false, i: true }
    );
  });
});
