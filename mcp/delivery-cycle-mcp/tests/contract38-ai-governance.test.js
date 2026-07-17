// contract38-ai-governance.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 38 follow-on 13).
// Server-side hard-stop ladder in submit_gate_for_approval (Context Brief,
// Jira-with-Division-exception, AI profile ladder, AI Production Board stops)
// + update_delivery_cycle AI field validation and Board audit stamps.
// Supabase singleton mocked via require.cache injection (FIFO response queue).

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

let queue = [];
let capturedUpdates = [];
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }
const chain = {
  from:   () => chain,
  select: () => chain,
  insert: () => chain,
  update: (arg) => { capturedUpdates.push(arg); return chain; },
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

const { submit_gate_for_approval } = require('../src/tools/submit_gate_for_approval');
const { update_delivery_cycle }    = require('../src/tools/update_delivery_cycle');

const CALLER = 'user-1';
const baseCycle = {
  delivery_cycle_id: 'c1', cycle_title: 'Test', workstream_id: null,
  division_id: 'd1', current_lifecycle_stage: 'SPEC',
  assigned_dcs_user_id: 'u-dcs', assigned_epo_user_id: 'u-epo',
  assigned_dol_user_id: 'u-dol', other_consulted_user_ids: [],
  jira_epic_key: null, ai_functionality: null, ai_delivery_form: null,
  ai_audience: null, ai_board_approved: false
};
const approved = (names) => names.map(g => ({ gate_name: g, gate_status: 'approved' }));

describe('submit_gate_for_approval — CC-38 f13 hard-stop ladder', () => {
  beforeEach(() => { queue = []; capturedUpdates = []; });

  test('go_to_build blocked when no Context Brief attached', async () => {
    queue = [
      { data: { ...baseCycle }, error: null },                       // cycle
      { data: { is_admin: true, display_name: 'Phil' }, error: null }, // caller
      { data: approved(['brief_review']), error: null },             // predecessors
      { data: { artifact_type_id: 't-cb' }, error: null },           // Context Brief type
      { data: [], error: null },                                     // no attachments
      { data: null, error: null }                                    // gate_blocked event insert
    ];
    const res = await submit_gate_for_approval({ delivery_cycle_id: 'c1', gate_name: 'go_to_build' }, CALLER);
    assert.equal(res.success, false);
    assert.match(res.error, /Context Brief/);
  });

  test('go_to_build blocked on missing Jira epic when Division requires it', async () => {
    queue = [
      { data: { ...baseCycle }, error: null },
      { data: { is_admin: true, display_name: 'Phil' }, error: null },
      { data: approved(['brief_review']), error: null },
      { data: { artifact_type_id: 't-cb' }, error: null },
      { data: [{ cycle_artifact_id: 'a1' }], error: null },          // Context Brief present
      { data: { jira_epic_required: true }, error: null },           // division requires Jira
      { data: null, error: null }                                    // event insert
    ];
    const res = await submit_gate_for_approval({ delivery_cycle_id: 'c1', gate_name: 'go_to_build' }, CALLER);
    assert.equal(res.success, false);
    assert.match(res.error, /Jira epic/);
  });

  test('go_to_build Jira stop skipped for exempt Division — falls through to AI question', async () => {
    queue = [
      { data: { ...baseCycle }, error: null },
      { data: { is_admin: true, display_name: 'Phil' }, error: null },
      { data: approved(['brief_review']), error: null },
      { data: { artifact_type_id: 't-cb' }, error: null },
      { data: [{ cycle_artifact_id: 'a1' }], error: null },
      { data: { jira_epic_required: false }, error: null },          // Division exempt (migration 074)
      { data: null, error: null }                                    // event insert (AI unanswered block)
    ];
    const res = await submit_gate_for_approval({ delivery_cycle_id: 'c1', gate_name: 'go_to_build' }, CALLER);
    assert.equal(res.success, false);
    assert.match(res.error, /Includes AI functionality/);
  });

  test('go_to_deploy blocked: external embedded AI without AI Production Board approval', async () => {
    queue = [
      { data: { ...baseCycle, ai_functionality: 'yes', ai_delivery_form: 'product_embedded', ai_audience: 'external' }, error: null },
      { data: { is_admin: true, display_name: 'Phil' }, error: null },
      { data: approved(['brief_review', 'go_to_build']), error: null },
      { data: null, error: null }                                    // event insert
    ];
    const res = await submit_gate_for_approval({ delivery_cycle_id: 'c1', gate_name: 'go_to_deploy' }, CALLER);
    assert.equal(res.success, false);
    assert.match(res.error, /AI Production Board/);
  });

  test('go_to_deploy blocked when ai_functionality is unknown', async () => {
    queue = [
      { data: { ...baseCycle, ai_functionality: 'unknown' }, error: null },
      { data: { is_admin: true, display_name: 'Phil' }, error: null },
      { data: approved(['brief_review', 'go_to_build']), error: null },
      { data: null, error: null }
    ];
    const res = await submit_gate_for_approval({ delivery_cycle_id: 'c1', gate_name: 'go_to_deploy' }, CALLER);
    assert.equal(res.success, false);
    assert.match(res.error, /Yes or No/);
  });

  test('go_to_release blocked: internal AI without AI Production Board approval', async () => {
    queue = [
      { data: { ...baseCycle, ai_functionality: 'yes', ai_delivery_form: 'analytics_outputs', ai_audience: 'internal' }, error: null },
      { data: { is_admin: true, display_name: 'Phil' }, error: null },
      { data: approved(['brief_review', 'go_to_build', 'go_to_deploy']), error: null },
      { data: null, error: null }
    ];
    const res = await submit_gate_for_approval({ delivery_cycle_id: 'c1', gate_name: 'go_to_release' }, CALLER);
    assert.equal(res.success, false);
    assert.match(res.error, /AI Production Board/);
  });
});

describe('update_delivery_cycle — CC-38 f13 AI fields', () => {
  beforeEach(() => { queue = []; capturedUpdates = []; });

  test('rejects invalid ai_functionality value', async () => {
    const res = await update_delivery_cycle({ delivery_cycle_id: 'c1', ai_functionality: 'maybe' }, CALLER);
    assert.equal(res.success, false);
    assert.match(res.error, /yes, no, unknown/);
  });

  test('rejects non-boolean ai_board_approved', async () => {
    const res = await update_delivery_cycle({ delivery_cycle_id: 'c1', ai_board_approved: 'yes' }, CALLER);
    assert.equal(res.success, false);
    assert.match(res.error, /boolean/);
  });

  test('flipping ai_board_approved true stamps approved_at/by; false clears', async () => {
    queue = [
      { data: { delivery_cycle_id: 'c1', cycle_status: 'active', ai_board_approved: false }, error: null }, // fetch
      { data: { delivery_cycle_id: 'c1' }, error: null },            // update .single
      { data: null, error: null }                                    // field_edit events
    ];
    const res = await update_delivery_cycle({ delivery_cycle_id: 'c1', ai_board_approved: true }, CALLER);
    assert.equal(res.success, true);
    const payload = capturedUpdates[0];
    assert.equal(payload.ai_board_approved, true);
    assert.ok(payload.ai_board_approved_at);
    assert.equal(payload.ai_board_approved_by, CALLER);

    queue = [
      { data: { delivery_cycle_id: 'c1', cycle_status: 'active', ai_board_approved: true }, error: null },
      { data: { delivery_cycle_id: 'c1' }, error: null },
      { data: null, error: null }
    ];
    capturedUpdates = [];
    const res2 = await update_delivery_cycle({ delivery_cycle_id: 'c1', ai_board_approved: false }, CALLER);
    assert.equal(res2.success, true);
    const p2 = capturedUpdates[0];
    assert.equal(p2.ai_board_approved, false);
    assert.equal(p2.ai_board_approved_at, null);
    assert.equal(p2.ai_board_approved_by, null);
  });
});
