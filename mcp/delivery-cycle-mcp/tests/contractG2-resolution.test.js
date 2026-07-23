// contractG2-resolution.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract G2, D-557/D-561/D-570).
// Approver Resolution v2: effective-level-aware chain, oversight, L3
// leadership-only with warnings, dual-write helper. FIFO-queue mock per
// contract32/G1 technique. Submit-tool integration (board refactor AC #7) is
// covered by the existing contract38-ai-governance suite passing unchanged.

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

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain }
};

const { resolveGateApproverV2, recordAssignedDualWrite } = require('../src/tools/helpers/approver');

const DIV = 'div-uuid', OVR = 'oversight-uuid', CFG = 'config-uuid',
      DL = 'dl-uuid', PHIL = 'phil-uuid', GATE = 'gate-uuid';

const baseCycle = (over = {}) => ({
  delivery_cycle_id: 'cyc-uuid',
  division_id: DIV,
  baseline_level: null,
  set_level: null,
  oversight_user_id: null,
  ...over
});

beforeEach(() => { queue = []; });

describe('resolveGateApproverV2 — unsized (D-570b)', () => {
  test('NULL effective level → legacy chain, no dual-write (AC #1)', async () => {
    queue = [
      { data: { approver_user_id: CFG }, error: null },  // legacy: config
      { data: { owner_user_id: DL }, error: null },      // legacy: division
      { data: { id: PHIL }, error: null },               // legacy: phil lookup
      { data: { id: CFG }, error: null }                 // legacy: liveness of first candidate
    ];
    const r = await resolveGateApproverV2({ cycle: baseCycle(), gate_name: 'brief_review' });
    assert.equal(r.approver_user_id, CFG);
    assert.equal(r.source, 'legacy_config');
    assert.equal(r.effective_level, null);
    assert.equal(r.dual_write, false);
    assert.deepEqual(r.warnings, []);
  });

  test('unsized ignores oversight — strictly legacy (CC-G2 lean)', async () => {
    queue = [
      { data: null, error: null },                       // legacy: no config
      { data: { owner_user_id: DL }, error: null },      // legacy: division
      { data: { id: PHIL }, error: null },               // legacy: phil
      { data: { id: DL }, error: null }                  // liveness: DL
    ];
    const r = await resolveGateApproverV2({
      cycle: baseCycle({ oversight_user_id: OVR }), gate_name: 'go_to_build'
    });
    assert.equal(r.approver_user_id, DL);
    assert.equal(r.source, 'legacy_division_owner');
    assert.equal(r.dual_write, false);
  });
});

describe('resolveGateApproverV2 — Level 2 (D-557/D-561)', () => {
  test('oversight wins over config (S-B2 / AC #2)', async () => {
    queue = [
      { data: { id: OVR }, error: null }                 // isLiveUser(oversight)
    ];
    const r = await resolveGateApproverV2({
      cycle: baseCycle({ baseline_level: 2, oversight_user_id: OVR }), gate_name: 'go_to_build'
    });
    assert.equal(r.approver_user_id, OVR);
    assert.equal(r.source, 'oversight');
    assert.equal(r.effective_level, 2);
    assert.equal(r.dual_write, true);
  });

  test('config person when no oversight (S-B1 / AC #3)', async () => {
    queue = [
      { data: { approver_user_id: CFG }, error: null },  // config
      { data: { id: CFG }, error: null }                 // isLiveUser(config)
    ];
    const r = await resolveGateApproverV2({
      cycle: baseCycle({ baseline_level: 2 }), gate_name: 'go_to_build'
    });
    assert.equal(r.approver_user_id, CFG);
    assert.equal(r.source, 'config');
    assert.equal(r.dual_write, true);
  });

  test('neither → Division Leader (AC #4)', async () => {
    queue = [
      { data: null, error: null },                       // no config
      { data: { owner_user_id: DL }, error: null },      // division
      { data: { id: DL }, error: null }                  // isLiveUser(DL)
    ];
    const r = await resolveGateApproverV2({
      cycle: baseCycle({ baseline_level: 2 }), gate_name: 'go_to_build'
    });
    assert.equal(r.approver_user_id, DL);
    assert.equal(r.source, 'division_owner');
  });

  test('DL absent → Phil (AC #4)', async () => {
    queue = [
      { data: null, error: null },                       // no config
      { data: { owner_user_id: null }, error: null },    // division has no owner
      { data: { id: PHIL }, error: null },               // getPhil
      { data: { id: PHIL }, error: null }                // isLiveUser(Phil)
    ];
    const r = await resolveGateApproverV2({
      cycle: baseCycle({ baseline_level: 2 }), gate_name: 'go_to_build'
    });
    assert.equal(r.approver_user_id, PHIL);
    assert.equal(r.source, 'phil');
  });

  test('set_level overrides baseline (D-562 COALESCE)', async () => {
    queue = [
      { data: null, error: null },                       // no config
      { data: { owner_user_id: DL }, error: null },
      { data: { id: DL }, error: null }
    ];
    const r = await resolveGateApproverV2({
      cycle: baseCycle({ baseline_level: 1, set_level: 2 }), gate_name: 'go_to_build'
    });
    assert.equal(r.effective_level, 2);
    assert.equal(r.source, 'division_owner');
  });
});

describe('resolveGateApproverV2 — Level 1 transition (D-570a, S-C4)', () => {
  test('L1 without oversight → legacy chain, dual-write ON (AC #6)', async () => {
    queue = [
      { data: { approver_user_id: CFG }, error: null },  // legacy: config
      { data: { owner_user_id: DL }, error: null },      // legacy: division
      { data: { id: PHIL }, error: null },               // legacy: phil
      { data: { id: CFG }, error: null }                 // liveness
    ];
    const r = await resolveGateApproverV2({
      cycle: baseCycle({ baseline_level: 1 }), gate_name: 'brief_review'
    });
    assert.equal(r.approver_user_id, CFG);
    assert.equal(r.source, 'legacy_config');
    assert.equal(r.effective_level, 1);
    assert.equal(r.dual_write, true);
  });

  test('L1 with oversight set → runs as L2: oversight person (S-C4)', async () => {
    queue = [
      { data: { id: OVR }, error: null }                 // isLiveUser(oversight)
    ];
    const r = await resolveGateApproverV2({
      cycle: baseCycle({ baseline_level: 1, oversight_user_id: OVR }), gate_name: 'brief_review'
    });
    assert.equal(r.approver_user_id, OVR);
    assert.equal(r.source, 'oversight');
    assert.equal(r.dual_write, true);
  });
});

describe('resolveGateApproverV2 — Level 3 leadership-only (D-570c, S-C1)', () => {
  test('config naming non-leadership → ignored, resolves DL, warning (AC #5)', async () => {
    queue = [
      { data: { approver_user_id: CFG }, error: null },  // config exists
      { data: { id: CFG, is_super_admin: false }, error: null }, // isLeadership: user row
      { data: null, error: null },                       // isLeadership: owns no division
      { data: { owner_user_id: DL }, error: null },      // division
      { data: { id: DL }, error: null }                  // isLiveUser(DL)
    ];
    const r = await resolveGateApproverV2({
      cycle: baseCycle({ baseline_level: 3 }), gate_name: 'go_to_deploy'
    });
    assert.equal(r.approver_user_id, DL);
    assert.equal(r.source, 'division_owner');
    assert.deepEqual(r.warnings, ['level3_sub_leadership_config_ignored']);
    assert.equal(r.dual_write, true);
  });

  test('oversight naming non-leadership → ignored with same warning class', async () => {
    queue = [
      { data: { id: OVR }, error: null },                        // isLiveUser(oversight)
      { data: { id: OVR, is_super_admin: false }, error: null }, // isLeadership: user
      { data: null, error: null },                               // owns no division
      { data: null, error: null },                               // no config
      { data: { owner_user_id: DL }, error: null },              // division
      { data: { id: DL }, error: null }                          // isLiveUser(DL)
    ];
    const r = await resolveGateApproverV2({
      cycle: baseCycle({ baseline_level: 3, oversight_user_id: OVR }), gate_name: 'go_to_build'
    });
    assert.equal(r.approver_user_id, DL);
    assert.ok(r.warnings.includes('level3_sub_leadership_config_ignored'));
  });

  test('oversight naming leadership (a Division owner) is honored at L3', async () => {
    queue = [
      { data: { id: OVR }, error: null },                        // isLiveUser(oversight)
      { data: { id: OVR, is_super_admin: false }, error: null }, // isLeadership: user
      { data: { id: 'other-div' }, error: null }                 // owns a division
    ];
    const r = await resolveGateApproverV2({
      cycle: baseCycle({ baseline_level: 3, oversight_user_id: OVR }), gate_name: 'go_to_build'
    });
    assert.equal(r.approver_user_id, OVR);
    assert.equal(r.source, 'oversight');
    assert.deepEqual(r.warnings, []);
  });

  test('no config, no oversight → DL directly, no warning', async () => {
    queue = [
      { data: null, error: null },                       // no config
      { data: { owner_user_id: DL }, error: null },
      { data: { id: DL }, error: null }
    ];
    const r = await resolveGateApproverV2({
      cycle: baseCycle({ baseline_level: 3 }), gate_name: 'go_to_release'
    });
    assert.equal(r.approver_user_id, DL);
    assert.deepEqual(r.warnings, []);
  });
});

describe('recordAssignedDualWrite (D-570a history)', () => {
  test('writes an assigned row when none exists', async () => {
    queue = [
      { data: null, error: null },  // dup check: none
      { data: null, error: null }   // insert
    ];
    const r = await recordAssignedDualWrite(GATE, DL);
    assert.equal(r.written, true);
    assert.equal(r.error, null);
  });

  test('skips duplicate (gate, approver, assigned) rows', async () => {
    queue = [
      { data: { approval_id: 'app-1' }, error: null }
    ];
    const r = await recordAssignedDualWrite(GATE, DL);
    assert.equal(r.written, false);
    assert.equal(r.error, null);
  });
});
