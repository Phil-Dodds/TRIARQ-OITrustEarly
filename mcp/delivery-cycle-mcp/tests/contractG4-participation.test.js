// contractG4-participation.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract G4, D-563/D-564).
// Role-scoped participation attach (supersedes CC-G1-19), Consulted derivation
// from participation records with group expansion (D-458 array retired),
// Informed derivation for gate-decision notifications.
// FIFO-queue mock per contract32/G1–G3 technique.

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
chain.functions = { invoke: async () => ({ data: null, error: null }) };

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain }
};

const partTools = require('../src/tools/participation');
const { deriveConsultedUserIdsV2, deriveInformedUserIds } = require('../src/tools/helpers/consultations');

const CALLER = 'caller-uuid', OTHER = 'other-uuid', CYC = 'c1', DL = 'dl-uuid';

const cycleRow = (over = {}) => ({
  delivery_cycle_id: CYC, cycle_title: 'T', division_id: 'div',
  assigned_dcs_user_id: null, assigned_epo_user_id: null, assigned_dol_user_id: null,
  ...over
});

beforeEach(() => { queue = []; });

describe('add_participation — G4 role-scoped attach (AC #3)', () => {
  test("set_via 'self' with letter C is rejected — self is the Informed claim only", async () => {
    const r = await partTools.add_participation(
      { delivery_cycle_id: CYC, letter: 'C', holder_user_id: CALLER, set_via: 'self' }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /Informed claim/);
  });

  test("non-role user cannot attach via 'trio'", async () => {
    queue = [
      { data: cycleRow({ assigned_dcs_user_id: OTHER }), error: null },              // cycle — caller not in trio
      { data: { id: CALLER, is_admin: false, is_super_admin: false, is_active: true }, error: null }
    ];
    const r = await partTools.add_participation(
      { delivery_cycle_id: CYC, letter: 'C', holder_user_id: OTHER, set_via: 'trio' }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /trio|approver|Division Leader|Admin/);
  });

  test("awaiting-gate approver attaches via 'approver'", async () => {
    queue = [
      { data: cycleRow(), error: null },
      { data: { id: CALLER, is_admin: false, is_super_admin: false, is_active: true }, error: null },
      { data: { gate_record_id: 'g1' }, error: null },                               // awaiting gate w/ caller as approver
      { data: { id: OTHER, display_name: 'Holder', is_active: true }, error: null }, // holder
      { data: null, error: null },                                                   // no duplicate
      { data: { record_id: 'rec-1', letter: 'C', set_via: 'approver', delivery_cycle_id: CYC }, error: null },
      { data: null, error: null }                                                    // event log
    ];
    const r = await partTools.add_participation(
      { delivery_cycle_id: CYC, letter: 'C', holder_user_id: OTHER, set_via: 'approver' }, CALLER);
    assert.equal(r.success, true);
  });

  test("Division Leader attaches via 'leadership'", async () => {
    queue = [
      { data: cycleRow(), error: null },
      { data: { id: CALLER, is_admin: false, is_super_admin: false, is_active: true }, error: null },
      { data: { owner_user_id: CALLER }, error: null },                              // division — caller is DL
      { data: { id: OTHER, display_name: 'Holder', is_active: true }, error: null },
      { data: null, error: null },
      { data: { record_id: 'rec-2', letter: 'C', set_via: 'leadership', delivery_cycle_id: CYC }, error: null },
      { data: null, error: null }
    ];
    const r = await partTools.add_participation(
      { delivery_cycle_id: CYC, letter: 'C', holder_user_id: OTHER, set_via: 'leadership' }, CALLER);
    assert.equal(r.success, true);
  });

  test("one-tap Informed self-claim needs no role (AC #1)", async () => {
    queue = [
      { data: cycleRow(), error: null },
      { data: { id: CALLER, display_name: 'Me', is_active: true }, error: null },    // holder validation
      { data: null, error: null },                                                   // no duplicate
      { data: { record_id: 'rec-3', letter: 'I', set_via: 'self', delivery_cycle_id: CYC }, error: null },
      { data: null, error: null }
    ];
    const r = await partTools.add_participation(
      { delivery_cycle_id: CYC, letter: 'I', holder_user_id: CALLER, set_via: 'self' }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.set_via, 'self');
  });
});

describe('deriveConsultedUserIdsV2 — participation-based derivation (G4)', () => {
  test('trio + user-held C stakes + group members, deduplicated', async () => {
    queue = [
      { data: [
          { holder_user_id: OTHER, holder_group_id: null },
          { holder_user_id: null,  holder_group_id: 'g1' }
        ], error: null },                                                            // C stakes
      { data: [{ user_id: 'member-1' }, { user_id: OTHER }], error: null }           // group members (OTHER deduped)
    ];
    const ids = await deriveConsultedUserIdsV2(cycleRow({
      assigned_dcs_user_id: 'dcs-1', assigned_epo_user_id: 'epo-1', assigned_dol_user_id: null
    }));
    assert.deepEqual(ids, ['dcs-1', 'epo-1', OTHER, 'member-1']);
  });

  test('no stakes → trio only (array column never read)', async () => {
    queue = [ { data: [], error: null } ];
    const ids = await deriveConsultedUserIdsV2(cycleRow({
      assigned_dcs_user_id: 'dcs-1',
      other_consulted_user_ids: ['array-ghost']   // must be ignored — D-458 retired
    }));
    assert.deepEqual(ids, ['dcs-1']);
  });
});

describe('deriveInformedUserIds (G4 gate-decision notifications, AC #7)', () => {
  test('user-held and group-held I stakes, groups expanded', async () => {
    queue = [
      { data: [
          { holder_user_id: 'inf-1', holder_group_id: null },
          { holder_user_id: null, holder_group_id: 'g1' }
        ], error: null },
      { data: [{ user_id: 'inf-2' }], error: null }
    ];
    const ids = await deriveInformedUserIds(CYC);
    assert.deepEqual(ids, ['inf-1', 'inf-2']);
  });

  test('no informed stakes → empty (nobody emailed)', async () => {
    queue = [ { data: [], error: null } ];
    assert.deepEqual(await deriveInformedUserIds(CYC), []);
  });
});
