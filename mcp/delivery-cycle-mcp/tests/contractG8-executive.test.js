// contractG8-executive.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract G8, D-560/D-569).
// IE grant (Phil-only), All Pending Gates auth, loud override (reason
// required, board untouchable — S-C3), D-569 over-returned flow (reason
// mandatory — S-B3 shape). FIFO-queue mock per the established technique.

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

const { set_initiative_executive, list_all_pending_gates } = require('../src/tools/initiative_executive');
const { record_gate_decision } = require('../src/tools/record_gate_decision');

const IE = 'ie-uuid', PHIL = 'phil-uuid', OTHER = 'other-uuid', APPROVER = 'appr-uuid';
const CYC = 'c1', GATE = 'g1';

const cycleRow = (over = {}) => ({
  delivery_cycle_id: CYC, cycle_title: 'T', current_lifecycle_stage: 'BRIEF',
  workstream_id: null, division_id: 'div', assigned_dcs_user_id: OTHER,
  assigned_epo_user_id: OTHER, assigned_dol_user_id: OTHER,
  baseline_level: 2, set_level: null,
  ai_functionality: 'no', ai_delivery_form: null, ai_audience: null,
  ...over
});

beforeEach(() => { queue = []; });

describe('set_initiative_executive (D-560/D-464 posture)', () => {
  test('non-Phil cannot grant', async () => {
    queue = [
      { data: { id: OTHER, is_super_admin: false, is_active: true, display_name: 'Admin' }, error: null }
    ];
    const r = await set_initiative_executive({ user_id: IE, granted: true }, OTHER);
    assert.equal(r.success, false);
    assert.match(r.error, /Phil/);
  });

  test('Phil grants; revoke works symmetrically', async () => {
    queue = [
      { data: { id: PHIL, is_super_admin: true, is_active: true, display_name: 'Phil' }, error: null },
      { data: { id: IE, display_name: 'Exec', is_initiative_executive: false }, error: null },
      { data: null, error: null }
    ];
    const r = await set_initiative_executive({ user_id: IE, granted: true }, PHIL);
    assert.equal(r.success, true);
    assert.equal(r.data.is_initiative_executive, true);
  });
});

describe('list_all_pending_gates (D-560 pull view)', () => {
  test('non-IE non-admin is pointed to My Actions', async () => {
    queue = [
      { data: { is_initiative_executive: false, is_super_admin: false, is_admin: false, is_active: true }, error: null }
    ];
    const r = await list_all_pending_gates({}, OTHER);
    assert.equal(r.success, false);
    assert.match(r.error, /My Actions/);
  });

  test('IE sees pending gates sorted by age with the aging highlight (S-C2 shape)', async () => {
    const old = new Date(Date.now() - 10 * 86400000).toISOString();
    const recent = new Date(Date.now() - 1 * 86400000).toISOString();
    queue = [
      { data: { is_initiative_executive: true, is_super_admin: false, is_admin: false, is_active: true }, error: null },
      { data: [
          { gate_record_id: 'g-old', delivery_cycle_id: CYC, gate_name: 'go_to_build', gate_status: 'awaiting_approval', approver_user_id: APPROVER, submitted_at: old },
          { gate_record_id: 'g-new', delivery_cycle_id: CYC, gate_name: 'go_to_deploy', gate_status: 'awaiting_approval', approver_user_id: APPROVER, submitted_at: recent }
        ], error: null },                                                  // gates
      { data: [cycleRow()], error: null },                                 // cycles
      { data: [{ id: 'div', division_name: 'Division A', display_name_short: 'DivA' }], error: null }, // divisions
      { data: [{ id: APPROVER, display_name: 'Jane' }], error: null },     // approvers
      // waiting-on batch:
      { data: [], error: null },                                           // conditions
      { data: [], error: null },                                           // consultations
      { data: [], error: null },                                           // approvals
      { data: [{ id: APPROVER, display_name: 'Jane' }, { id: OTHER, display_name: 'O' }], error: null } // names
    ];
    const r = await list_all_pending_gates({}, IE);
    assert.equal(r.success, true);
    assert.equal(r.data.pending_gates.length, 2);
    assert.equal(r.data.pending_gates[0].gate_record_id, 'g-old', 'oldest first');
    assert.equal(r.data.pending_gates[0].aging, true);
    assert.equal(r.data.pending_gates[1].aging, false);
    assert.ok(r.data.pending_gates[0].waiting_on.line.includes('Jane'));
  });
});

describe('record_gate_decision — IE override (D-560, S-C2/S-C3)', () => {
  test('override without reason rejected', async () => {
    queue = [
      { data: { gate_record_id: GATE, gate_status: 'awaiting_approval', approver_user_id: APPROVER }, error: null },
      { data: cycleRow(), error: null },
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: true, display_name: 'Exec' }, error: null }
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'go_to_build', decision: 'approved', ie_override: true }, IE);
    assert.equal(r.success, false);
    assert.match(r.error, /reason/i);
  });

  test('override on a board-triggered gate rejected (S-C3, untouchable)', async () => {
    queue = [
      { data: { gate_record_id: GATE, gate_status: 'awaiting_approval', approver_user_id: APPROVER }, error: null },
      { data: cycleRow({ ai_functionality: 'yes', ai_delivery_form: 'product_embedded', ai_audience: 'external' }), error: null },
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: true, display_name: 'Exec' }, error: null }
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'go_to_deploy', decision: 'approved', ie_override: true, override_reason: 'stuck' }, IE);
    assert.equal(r.success, false);
    assert.match(r.error, /board/i);
  });

  test('non-IE cannot override (AC #7)', async () => {
    queue = [
      { data: { gate_record_id: GATE, gate_status: 'awaiting_approval', approver_user_id: APPROVER }, error: null },
      { data: cycleRow(), error: null },
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: false, display_name: 'User' }, error: null }
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'go_to_build', decision: 'approved', ie_override: true, override_reason: 'x' }, OTHER);
    assert.equal(r.success, false);
    assert.match(r.error, /Initiative Executive role or Phil/);
  });
});

describe('record_gate_decision — D-569 over-returned consultation (S-B3)', () => {
  test('approving over a returned consultation without a reason is rejected', async () => {
    queue = [
      { data: { gate_record_id: GATE, gate_status: 'awaiting_approval', approver_user_id: APPROVER }, error: null },
      { data: cycleRow(), error: null },
      { data: { is_admin: false, is_super_admin: false, is_initiative_executive: false, display_name: 'Jane' }, error: null },
      { data: [{ id: 'cons1', consulted_user_id: OTHER, response: 'declined', notes: 'concerns' }], error: null } // declined rows
    ];
    const r = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'go_to_build', decision: 'approved' }, APPROVER);
    assert.equal(r.success, false);
    assert.equal(r.error, 'RETURNED_CONSULTATION_REQUIRES_REASON');
    assert.deepEqual(r.data.returned_consultation_user_ids, [OTHER]);
  });
});
