// contractG3-sizing.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract G3, D-558/D-562/D-567).
// Sizing lifecycle MCP layer: REQUIRES_SIZING interstitial, post-GtB edit
// guard (two-call approver confirmation), lowering-edit notification event,
// S-C6 baseline_exceeds_set_level alert, vendor→IT/Infra Informed rule,
// preview_governance_derivation, get_governance_config_warnings.
// FIFO-queue mock per contract32/G1/G2 technique.

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
  order:  () => chain,
  limit:  () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};
// Edge Function relay stub — recipients are kept empty in these tests so the
// email path is never exercised; the stub guards against accidental calls.
chain.functions = { invoke: async () => ({ data: null, error: null }) };

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain }
};

const sizingTools = require('../src/tools/initiative_sizing');
const { get_governance_config_warnings } = require('../src/tools/governance_config_warnings');
const { submit_gate_for_approval } = require('../src/tools/submit_gate_for_approval');

const CALLER = 'caller-uuid', OTHER = 'dcs-uuid', CYC = 'c1', CFG = 'config-uuid', DL = 'dl-uuid';

const smallAnswers = {
  q1_investment: 'small', q2_novelty: 'standard', q3_wrongness: 'contained',
  q4_security_impact: false, q5_ux: 'standard'
};

beforeEach(() => { queue = []; });

describe('submit_gate_for_approval — D-567 sizing interstitial (G3)', () => {
  test('unsized initiative → REQUIRES_SIZING, non-mutating (AC #3)', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', division_id: 'div', assigned_dcs_user_id: CALLER, assigned_dol_user_id: OTHER, assigned_epo_user_id: OTHER, ai_functionality: 'no' }, error: null }, // cycle
      { data: { is_admin: true, display_name: 'Phil' }, error: null },  // caller
      { data: null, error: null }                                       // no sizing row
    ];
    const res = await submit_gate_for_approval({ delivery_cycle_id: CYC, gate_name: 'brief_review' }, CALLER);
    assert.equal(res.success, true);
    assert.equal(res.status, 'REQUIRES_SIZING');
    assert.equal(res.data.code, 'REQUIRES_SIZING');
    assert.equal(queue.length, 0);
  });
});

describe('upsert_initiative_sizing — post-GtB edit guard (D-567/D-562)', () => {
  test('edit after Go to Build without confirmation → REQUIRES_APPROVER_CONFIRMATION preview', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', baseline_level: 3, set_level: null, set_level_by_user_id: null, assigned_dcs_user_id: OTHER }, error: null }, // cycle
      { data: { delivery_cycle_id: CYC }, error: null },                                   // existing sizing
      { data: [{ gate_record_id: 'g1', gate_name: 'go_to_build', gate_status: 'approved', approver_user_id: DL }], error: null }, // gates
      { data: { trusted_dcs: false }, error: null }                                        // dcs trust
    ];
    const res = await sizingTools.upsert_initiative_sizing(
      { delivery_cycle_id: CYC, answers: smallAnswers }, CALLER);
    assert.equal(res.success, true);
    assert.equal(res.status, 'REQUIRES_APPROVER_CONFIRMATION');
    assert.equal(res.data.current_baseline_level, 3);
    assert.equal(res.data.new_baseline_level, 2);
    assert.equal(queue.length, 0, 'must not save');
  });

  test('confirmed lowering edit by awaiting-gate approver saves and logs sizing_lowered_level', async () => {
    const saved = { delivery_cycle_id: CYC, ...smallAnswers };
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', baseline_level: 3, set_level: null, set_level_by_user_id: null, assigned_dcs_user_id: OTHER }, error: null }, // cycle
      { data: { delivery_cycle_id: CYC }, error: null },                                   // existing sizing
      { data: [
          { gate_record_id: 'g1', gate_name: 'go_to_build', gate_status: 'approved', approver_user_id: DL },
          { gate_record_id: 'g2', gate_name: 'go_to_deploy', gate_status: 'awaiting_approval', approver_user_id: CALLER }
        ], error: null },                                                                  // gates
      { data: { trusted_dcs: false }, error: null },                                       // dcs trust (preview)
      { data: saved, error: null },                                                        // upsert
      { data: { delivery_cycle_id: CYC, assigned_dcs_user_id: OTHER, set_level: null }, error: null }, // recompute: cycle
      { data: saved, error: null },                                                        // recompute: sizing
      { data: { trusted_dcs: false }, error: null },                                       // recompute: dcs
      { data: null, error: null },                                                         // recompute: cache write
      { data: [], error: null },                                                           // lowering: approver lookup (empty → no email)
      { data: null, error: null },                                                         // sizing_lowered_level event
      { data: null, error: null }                                                          // sizing_updated event
    ];
    const res = await sizingTools.upsert_initiative_sizing(
      { delivery_cycle_id: CYC, answers: smallAnswers, approver_confirmed: true }, CALLER);
    assert.equal(res.success, true);
    assert.equal(res.data.baseline_level, 2);
    assert.equal(queue.length, 0);
  });

  test('confirmed edit by non-approver non-admin while a gate awaits → rejected', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', baseline_level: 2, set_level: null, set_level_by_user_id: null, assigned_dcs_user_id: OTHER }, error: null },
      { data: { delivery_cycle_id: CYC }, error: null },
      { data: [
          { gate_record_id: 'g1', gate_name: 'go_to_build', gate_status: 'approved', approver_user_id: DL },
          { gate_record_id: 'g2', gate_name: 'go_to_deploy', gate_status: 'awaiting_approval', approver_user_id: DL }
        ], error: null },
      { data: { trusted_dcs: false }, error: null },
      { data: { is_admin: false, is_super_admin: false }, error: null }                    // caller role check
    ];
    const res = await sizingTools.upsert_initiative_sizing(
      { delivery_cycle_id: CYC, answers: smallAnswers, approver_confirmed: true }, CALLER);
    assert.equal(res.success, false);
    assert.match(res.error, /approver of the gate|Admin/);
  });
});

describe('upsert_initiative_sizing — S-C6 + vendor rule (G3)', () => {
  test('baseline rising above a set level adds baseline_exceeds_set_level alert', async () => {
    const bigAnswers = { ...smallAnswers, q1_investment: 'xlarge' };
    const saved = { delivery_cycle_id: CYC, ...bigAnswers };
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', baseline_level: 2, set_level: 1, set_level_by_user_id: DL, assigned_dcs_user_id: null }, error: null }, // cycle
      { data: null, error: null },                                                         // no existing row (first sizing)
      { data: saved, error: null },                                                        // upsert
      { data: { delivery_cycle_id: CYC, assigned_dcs_user_id: null, set_level: 1 }, error: null }, // recompute: cycle
      { data: saved, error: null },                                                        // recompute: sizing
      { data: null, error: null },                                                         // recompute: cache write
      { data: null, error: null },                                                         // baseline_exceeds_set_level event
      { data: null, error: null }                                                          // sizing_answered event
    ];
    const res = await sizingTools.upsert_initiative_sizing(
      { delivery_cycle_id: CYC, answers: bigAnswers }, CALLER);
    assert.equal(res.success, true);
    assert.ok(res.data.alerts.includes('baseline_exceeds_set_level'));
    assert.equal(queue.length, 0);
  });

  test('q2_sub_new_vendor=true writes the IT/Infrastructure Informed record (idempotent)', async () => {
    const saved = { delivery_cycle_id: CYC, ...smallAnswers, q2_sub_new_vendor: true };
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', baseline_level: null, set_level: null, set_level_by_user_id: null, assigned_dcs_user_id: null }, error: null },
      { data: null, error: null },                                                         // no existing row
      { data: saved, error: null },                                                        // upsert
      { data: { delivery_cycle_id: CYC, assigned_dcs_user_id: null, set_level: null }, error: null }, // recompute: cycle
      { data: saved, error: null },                                                        // recompute: sizing
      { data: null, error: null },                                                         // recompute: cache write
      { data: { group_id: 'it-group', group_name: 'IT/Infrastructure' }, error: null },    // group lookup
      { data: null, error: null },                                                         // no existing stake
      { data: null, error: null },                                                         // participation insert
      { data: null, error: null }                                                          // sizing_answered event
    ];
    const res = await sizingTools.upsert_initiative_sizing(
      { delivery_cycle_id: CYC, answers: smallAnswers, subs: { q2_sub_new_vendor: true } }, CALLER);
    assert.equal(res.success, true);
    assert.equal(queue.length, 0, 'vendor rule queries consumed');
  });
});

describe('preview_governance_derivation (G3 live panel)', () => {
  test('rejects incomplete answers', async () => {
    const { q5_ux, ...partial } = smallAnswers;
    const res = await sizingTools.preview_governance_derivation({ answers: partial }, CALLER);
    assert.equal(res.success, false);
    assert.match(res.error, /q5_ux/);
  });

  test('derives with DCS trust when dcs_user_id supplied', async () => {
    queue = [{ data: { trusted_dcs: true }, error: null }];
    const res = await sizingTools.preview_governance_derivation(
      { answers: smallAnswers, dcs_user_id: OTHER }, CALLER);
    assert.equal(res.success, true);
    assert.equal(res.data.baseline_level, 1);
    assert.equal(res.data.dcs_trusted, true);
    assert.ok(res.data.explanation_chips.length > 0);
  });

  test('no DCS → untrusted branch (Level 2 on the else-path)', async () => {
    const res = await sizingTools.preview_governance_derivation({ answers: smallAnswers }, CALLER);
    assert.equal(res.success, true);
    assert.equal(res.data.baseline_level, 2);
  });
});

describe('get_governance_config_warnings (G3 admin banner, D-570c)', () => {
  test('rejects non-admin caller', async () => {
    queue = [
      { data: { is_admin: false, is_super_admin: false, is_active: true }, error: null }
    ];
    const res = await get_governance_config_warnings({}, CALLER);
    assert.equal(res.success, false);
    assert.match(res.error, /Admin/);
  });

  test('no Level 3 initiatives → empty warnings', async () => {
    queue = [
      { data: { is_admin: true, is_super_admin: false, is_active: true }, error: null },
      { data: [], error: null }                                                            // no L3 cycles
    ];
    const res = await get_governance_config_warnings({}, CALLER);
    assert.equal(res.success, true);
    assert.deepEqual(res.data.config_warnings, []);
  });

  test('non-leadership config in an L3 Division produces a warning row (S-C1 admin side)', async () => {
    queue = [
      { data: { is_admin: true, is_super_admin: false, is_active: true }, error: null },
      { data: [{ delivery_cycle_id: CYC, division_id: 'div', set_level: null, baseline_level: 3 }], error: null }, // L3 cycles
      { data: [{ division_id: 'div', gate_name: 'go_to_build', approver_user_id: CFG }], error: null },           // configs
      { data: [{ id: CFG, display_name: 'Config Person', is_super_admin: false }], error: null },                 // approvers
      { data: [{ id: 'div', division_name: 'Division A', owner_user_id: DL }], error: null }                      // divisions
    ];
    const res = await get_governance_config_warnings({}, CALLER);
    assert.equal(res.success, true);
    assert.equal(res.data.config_warnings.length, 1);
    assert.equal(res.data.config_warnings[0].division_name, 'Division A');
    assert.equal(res.data.config_warnings[0].l3_initiative_count, 1);
  });

  test('leadership-named config produces no warning', async () => {
    queue = [
      { data: { is_admin: true, is_super_admin: false, is_active: true }, error: null },
      { data: [{ delivery_cycle_id: CYC, division_id: 'div', set_level: 3, baseline_level: 2 }], error: null },
      { data: [{ division_id: 'div', gate_name: 'go_to_build', approver_user_id: DL }], error: null },
      { data: [{ id: DL, display_name: 'The DL', is_super_admin: false }], error: null },
      { data: [{ id: 'div', division_name: 'Division A', owner_user_id: DL }], error: null }
    ];
    const res = await get_governance_config_warnings({}, CALLER);
    assert.equal(res.success, true);
    assert.deepEqual(res.data.config_warnings, []);
  });
});
