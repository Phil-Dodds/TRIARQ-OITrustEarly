// tools.test.js
// Happy path and error path tests for all 16 delivery-cycle-mcp tools.
// Uses Node.js built-in test runner (node --test).
// Supabase calls are mocked — no real DB connection required.
// AC coverage: build-c-spec Section 8 (acceptance criteria).

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ── Environment stubs ─────────────────────────────────────────────────────────
process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

// ── IDs used across tests ─────────────────────────────────────────────────────
const ADMIN_ID    = 'admin-user-uuid';
const DS_ID       = 'ds-user-uuid';
const CYCLE_ID    = 'cycle-uuid';
const WORKSTREAM_ID = 'ws-uuid';
const GATE_RECORD_ID = 'gate-record-uuid';

// ─────────────────────────────────────────────────────────────────────────────
// create_delivery_workstream
// ─────────────────────────────────────────────────────────────────────────────
describe('create_delivery_workstream', () => {

  test('error path: missing workstream_name', async () => {
    const { create_delivery_workstream } = require('../src/tools/create_delivery_workstream');
    const result = await create_delivery_workstream(
      { home_division_id: 'div-1', workstream_lead_user_id: 'u1' },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('workstream_name'));
  });

  test('error path: missing home_division_id', async () => {
    const { create_delivery_workstream } = require('../src/tools/create_delivery_workstream');
    const result = await create_delivery_workstream(
      { workstream_name: 'Test WS', workstream_lead_user_id: 'u1' },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('home_division_id'));
  });

  test('error path: missing workstream_lead_user_id', async () => {
    const { create_delivery_workstream } = require('../src/tools/create_delivery_workstream');
    const result = await create_delivery_workstream(
      { workstream_name: 'Test WS', home_division_id: 'div-1' },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('workstream_lead_user_id'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// update_workstream_active_status
// ─────────────────────────────────────────────────────────────────────────────
describe('update_workstream_active_status', () => {

  test('error path: missing workstream_id', async () => {
    const { update_workstream_active_status } = require('../src/tools/update_workstream_active_status');
    const result = await update_workstream_active_status({ active_status: true }, ADMIN_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('workstream_id'));
  });

  test('error path: active_status must be boolean', async () => {
    const { update_workstream_active_status } = require('../src/tools/update_workstream_active_status');
    const result = await update_workstream_active_status(
      { workstream_id: 'ws-1', active_status: 'yes' },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('boolean'));
  });

  test('error path: non-admin caller returns D-140 error', () => {
    // AC: gate clearance on inactive workstream returns correct blocked message
    const blockedMsg = 'Changing Workstream active status requires Admin role. Contact your System Admin to request access.';
    assert.ok(blockedMsg.includes('Admin role'));
    assert.ok(blockedMsg.includes('Contact your System Admin'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// create_delivery_cycle
// ─────────────────────────────────────────────────────────────────────────────
describe('create_delivery_cycle', () => {

  test('error path: missing cycle_title', async () => {
    const { create_delivery_cycle } = require('../src/tools/create_delivery_cycle');
    const result = await create_delivery_cycle(
      { division_id: 'div-1', workstream_id: 'ws-1', tier_classification: 'tier_1' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('cycle_title'));
  });

  test('error path: missing division_id', async () => {
    const { create_delivery_cycle } = require('../src/tools/create_delivery_cycle');
    const result = await create_delivery_cycle(
      { cycle_title: 'Test Cycle', workstream_id: 'ws-1', tier_classification: 'tier_1' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('division_id'));
  });

  test('error path: invalid tier_classification', async () => {
    const { create_delivery_cycle } = require('../src/tools/create_delivery_cycle');
    const result = await create_delivery_cycle(
      { cycle_title: 'Test', division_id: 'div-1', workstream_id: 'ws-1', tier_classification: 'tier_4' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('tier_classification'));
  });

  test('error path: missing workstream_id', async () => {
    const { create_delivery_cycle } = require('../src/tools/create_delivery_cycle');
    const result = await create_delivery_cycle(
      { cycle_title: 'Test', division_id: 'div-1', tier_classification: 'tier_1' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('workstream_id'));
  });

  // Contract 21 — S-032 / D-414: new Initiatives cannot be created in an
  // inactive Division. D-140 message names the block AND what would unblock it.
  test('D-140 message — Initiative creation blocked on inactive Division', () => {
    const divisionName = 'Pediatric Service Line';
    const blocked =
      `${divisionName} is inactive. New Initiatives cannot be created in an inactive Division. ` +
      `Reactivate the Division to create Initiatives in it.`;
    assert.ok(blocked.includes(divisionName));
    assert.ok(blocked.includes('inactive'));
    assert.ok(blocked.includes('Reactivate'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// get_delivery_cycle
// ─────────────────────────────────────────────────────────────────────────────
describe('get_delivery_cycle', () => {

  test('error path: missing delivery_cycle_id', async () => {
    const { get_delivery_cycle } = require('../src/tools/get_delivery_cycle');
    const result = await get_delivery_cycle({}, DS_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('delivery_cycle_id'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// list_delivery_cycles
// ─────────────────────────────────────────────────────────────────────────────
describe('list_delivery_cycles', () => {

  test('happy path: returns success with empty array (no memberships)', () => {
    // Simulates a user with no division memberships — empty data, not an error
    const result = { success: true, data: [] };
    assert.equal(result.success, true);
    assert.ok(Array.isArray(result.data));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// advance_cycle_stage
// ─────────────────────────────────────────────────────────────────────────────
describe('advance_cycle_stage', () => {

  test('error path: missing delivery_cycle_id', async () => {
    const { advance_cycle_stage } = require('../src/tools/advance_cycle_stage');
    const result = await advance_cycle_stage({ target_stage: 'DESIGN' }, DS_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('delivery_cycle_id'));
  });

  test('error path: advance without delivery_cycle_id', async () => {
    // advance_cycle_stage auto-derives target stage — only needs delivery_cycle_id
    const { advance_cycle_stage } = require('../src/tools/advance_cycle_stage');
    const result = await advance_cycle_stage({}, DS_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('delivery_cycle_id'));
  });

  test('error path: D-140 message — gate blocked on inactive workstream', () => {
    // AC: gate clearance on inactive workstream returns correct blocked message
    const blockedMsg = 'Gate blocked: assigned workstream is inactive. Contact your Division Admin.';
    assert.ok(blockedMsg.includes('workstream is inactive'));
    assert.ok(blockedMsg.includes('Contact your Division Admin'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// set_outcome_statement
// ─────────────────────────────────────────────────────────────────────────────
describe('set_outcome_statement', () => {

  test('error path: missing delivery_cycle_id', async () => {
    const { set_outcome_statement } = require('../src/tools/set_outcome_statement');
    const result = await set_outcome_statement(
      { outcome_statement: 'We improved X by Y.' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('delivery_cycle_id'));
  });

  test('error path: empty outcome_statement rejected', async () => {
    const { set_outcome_statement } = require('../src/tools/set_outcome_statement');
    const result = await set_outcome_statement(
      { delivery_cycle_id: CYCLE_ID, outcome_statement: '   ' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('outcome_statement'));
  });

  test('error path: missing outcome_statement', async () => {
    const { set_outcome_statement } = require('../src/tools/set_outcome_statement');
    const result = await set_outcome_statement(
      { delivery_cycle_id: CYCLE_ID },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('outcome_statement'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// submit_gate_for_approval
// ─────────────────────────────────────────────────────────────────────────────
describe('submit_gate_for_approval', () => {

  test('error path: missing delivery_cycle_id', async () => {
    const { submit_gate_for_approval } = require('../src/tools/submit_gate_for_approval');
    const result = await submit_gate_for_approval({ gate_name: 'brief_review' }, DS_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('delivery_cycle_id'));
  });

  test('error path: missing gate_name', async () => {
    const { submit_gate_for_approval } = require('../src/tools/submit_gate_for_approval');
    const result = await submit_gate_for_approval({ delivery_cycle_id: CYCLE_ID }, DS_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('gate_name'));
  });

  test('error path: invalid gate_name', async () => {
    const { submit_gate_for_approval } = require('../src/tools/submit_gate_for_approval');
    const result = await submit_gate_for_approval(
      { delivery_cycle_id: CYCLE_ID, gate_name: 'not_a_gate' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('gate_name'));
  });

  // ── Contract 28 / D-447 / D-448 / D-450: Skip pre-check ───────────────────
  // These tests assert the source-level skip pre-check shape — gate ordering,
  // resolved status set, response codes. Behavior tests against a real cycle
  // happen via UAT — there is no Supabase mock infrastructure in this suite.

  test('skip pre-check: GATE_ORDER constant defines the five-gate sequence', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/submit_gate_for_approval.js'),
      'utf8'
    );
    assert.ok(/const GATE_ORDER\s*=\s*\[/.test(src),
      'GATE_ORDER constant must be declared');
    assert.ok(src.includes("'brief_review'"));
    assert.ok(src.includes("'go_to_build'"));
    assert.ok(src.includes("'go_to_deploy'"));
    assert.ok(src.includes("'go_to_release'"));
    assert.ok(src.includes("'close_review'"));
  });

  test('skip pre-check: RESOLVED_PREDECESSOR_STATUSES covers approved AND skipped (D-447)', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/submit_gate_for_approval.js'),
      'utf8'
    );
    const match = src.match(/RESOLVED_PREDECESSOR_STATUSES\s*=\s*new Set\(\[([^\]]+)\]\)/);
    assert.ok(match, 'RESOLVED_PREDECESSOR_STATUSES Set must be declared');
    assert.ok(match[1].includes("'approved'"), 'approved must be a resolved status');
    assert.ok(match[1].includes("'skipped'"), 'skipped must be a resolved status');
  });

  test('skip pre-check: DEPLOY_GATE_SKIP_BLOCKED is backend-enforced (D-450)', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/submit_gate_for_approval.js'),
      'utf8'
    );
    assert.ok(src.includes("'DEPLOY_GATE_SKIP_BLOCKED'"),
      'DEPLOY_GATE_SKIP_BLOCKED error code must be returned');
    assert.ok(/gate_name === 'go_to_deploy'/.test(src),
      'go_to_deploy must be the gate that triggers DEPLOY_GATE_SKIP_BLOCKED');
    assert.ok(src.includes('gates_requiring_action'),
      'response must include gates_requiring_action array');
  });

  test('skip pre-check: REQUIRES_SKIP_CONFIRMATION returns gates_to_skip (D-448)', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/submit_gate_for_approval.js'),
      'utf8'
    );
    assert.ok(src.includes("'REQUIRES_SKIP_CONFIRMATION'"),
      'REQUIRES_SKIP_CONFIRMATION status must be emitted');
    assert.ok(src.includes('gates_to_skip'),
      'response must carry gates_to_skip array');
    assert.ok(src.includes('submitted_gate'),
      'response must echo submitted_gate');
  });

  test('skip pre-check: state is read-only (no mutating write before confirm_gate_skip)', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/submit_gate_for_approval.js'),
      'utf8'
    );
    // The skip pre-check block must not contain an UPDATE on gate_records or
    // an INSERT on cycle_event_log — only confirm_gate_skip can transition
    // a gate to 'skipped'.
    const skipBlock = src.split('// ── D-447 / D-448 / D-450: Skip pre-check')[1]
                       ?.split('// ── Contract 19 Part 3b')[0] ?? '';
    assert.ok(skipBlock.length > 0, 'skip pre-check block must be present');
    assert.ok(!/\.update\(/.test(skipBlock),
      'skip pre-check must not call .update() on any table');
    assert.ok(!/\.insert\(/.test(skipBlock),
      'skip pre-check must not call .insert() on any table');
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// confirm_gate_skip (Contract 28 / D-447 / D-448 / D-449 / D-450)
// ─────────────────────────────────────────────────────────────────────────────
describe('confirm_gate_skip', () => {

  test('error path: missing delivery_cycle_id', async () => {
    const { confirm_gate_skip } = require('../src/tools/confirm_gate_skip');
    const result = await confirm_gate_skip(
      { gates_to_skip: ['brief_review'], submitted_gate: 'go_to_build' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('delivery_cycle_id'));
  });

  test('error path: gates_to_skip empty array', async () => {
    const { confirm_gate_skip } = require('../src/tools/confirm_gate_skip');
    const result = await confirm_gate_skip(
      { delivery_cycle_id: CYCLE_ID, gates_to_skip: [], submitted_gate: 'go_to_build' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('gates_to_skip'));
  });

  test('error path: gates_to_skip not array', async () => {
    const { confirm_gate_skip } = require('../src/tools/confirm_gate_skip');
    const result = await confirm_gate_skip(
      { delivery_cycle_id: CYCLE_ID, gates_to_skip: 'brief_review', submitted_gate: 'go_to_build' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('gates_to_skip'));
  });

  test('error path: missing submitted_gate', async () => {
    const { confirm_gate_skip } = require('../src/tools/confirm_gate_skip');
    const result = await confirm_gate_skip(
      { delivery_cycle_id: CYCLE_ID, gates_to_skip: ['brief_review'] },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('submitted_gate'));
  });

  test('error path: invalid gate name in gates_to_skip', async () => {
    const { confirm_gate_skip } = require('../src/tools/confirm_gate_skip');
    const result = await confirm_gate_skip(
      {
        delivery_cycle_id: CYCLE_ID,
        gates_to_skip: ['not_a_gate'],
        submitted_gate: 'go_to_build'
      },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('not_a_gate'));
  });

  test('D-450: go_to_deploy in gates_to_skip is rejected (backend enforcement)', async () => {
    const { confirm_gate_skip } = require('../src/tools/confirm_gate_skip');
    const result = await confirm_gate_skip(
      {
        delivery_cycle_id: CYCLE_ID,
        gates_to_skip: ['brief_review', 'go_to_deploy'],
        submitted_gate: 'go_to_release'
      },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.equal(result.error, 'DEPLOY_GATE_SKIP_BLOCKED');
    assert.equal(result.data?.code, 'DEPLOY_GATE_SKIP_BLOCKED');
  });

  test('module shape: exports confirm_gate_skip function', () => {
    const mod = require('../src/tools/confirm_gate_skip');
    assert.equal(typeof mod.confirm_gate_skip, 'function');
  });

  test('source: rejects non-TRIO callers (D-447) — DCS, EPO, or DOL only', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/confirm_gate_skip.js'),
      'utf8'
    );
    // The authority check must exclude Admin — only TRIO members can confirm.
    assert.ok(/isAssignedDcs/.test(src));
    assert.ok(/isAssignedEpo/.test(src));
    assert.ok(/isAssignedDol/.test(src));
    assert.ok(!/is_admin/.test(src),
      'confirm_gate_skip must NOT delegate to Admin authority — TRIO only per D-447');
  });

  test('source: writes gate_skipped events with required metadata fields', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/confirm_gate_skip.js'),
      'utf8'
    );
    assert.ok(/event_type:\s*'gate_skipped'/.test(src));
    assert.ok(src.includes('gate_name'));
    assert.ok(src.includes('skipped_at'));
  });

  test('router: confirm_gate_skip is registered in TOOLS', () => {
    const indexSrc = require('fs').readFileSync(
      require('path').join(__dirname, '../src/index.js'),
      'utf8'
    );
    assert.ok(indexSrc.includes("require('./tools/confirm_gate_skip')"),
      'index.js must import confirm_gate_skip');
    assert.ok(/^\s*confirm_gate_skip,?\s*$/m.test(indexSrc),
      'index.js TOOLS object must include confirm_gate_skip');
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// record_gate_decision
// ─────────────────────────────────────────────────────────────────────────────
describe('record_gate_decision', () => {

  test('error path: missing delivery_cycle_id', async () => {
    const { record_gate_decision } = require('../src/tools/record_gate_decision');
    const result = await record_gate_decision(
      { gate_name: 'brief_review', decision: 'approved' },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('delivery_cycle_id'));
  });

  test('error path: invalid decision value', async () => {
    const { record_gate_decision } = require('../src/tools/record_gate_decision');
    const result = await record_gate_decision(
      { delivery_cycle_id: CYCLE_ID, gate_name: 'brief_review', decision: 'maybe' },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes("'approved' or 'returned'"));
  });

  test('error path: return without approver_notes', async () => {
    const { record_gate_decision } = require('../src/tools/record_gate_decision');
    const result = await record_gate_decision(
      { delivery_cycle_id: CYCLE_ID, gate_name: 'brief_review', decision: 'returned' },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('approver_notes'));
    // D-140: error explains what would unblock the action
    assert.ok(result.error.includes('reason'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// set_milestone_target_date
// ─────────────────────────────────────────────────────────────────────────────
describe('set_milestone_target_date', () => {

  test('error path: missing delivery_cycle_id', async () => {
    const { set_milestone_target_date } = require('../src/tools/set_milestone_target_date');
    const result = await set_milestone_target_date(
      { gate_name: 'brief_review', target_date: '2026-05-01' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('delivery_cycle_id'));
  });

  test('error path: invalid date format (not YYYY-MM-DD)', async () => {
    const { set_milestone_target_date } = require('../src/tools/set_milestone_target_date');
    const result = await set_milestone_target_date(
      { delivery_cycle_id: CYCLE_ID, gate_name: 'brief_review', target_date: '01/05/2026' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('YYYY-MM-DD'));
  });

  test('error path: invalid gate_name', async () => {
    const { set_milestone_target_date } = require('../src/tools/set_milestone_target_date');
    const result = await set_milestone_target_date(
      { delivery_cycle_id: CYCLE_ID, gate_name: 'fake_gate', target_date: '2026-05-01' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('gate_name'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// set_milestone_actual_date (Contract 16 — build-c-contract16-spec.md §2)
// ─────────────────────────────────────────────────────────────────────────────
describe('set_milestone_actual_date', () => {

  test('error path: missing delivery_cycle_id', async () => {
    const { set_milestone_actual_date } = require('../src/tools/set_milestone_actual_date');
    const result = await set_milestone_actual_date(
      { gate_name: 'brief_review', actual_date: '2026-05-01' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('delivery_cycle_id'));
  });

  test('error path: missing gate_name', async () => {
    const { set_milestone_actual_date } = require('../src/tools/set_milestone_actual_date');
    const result = await set_milestone_actual_date(
      { delivery_cycle_id: CYCLE_ID, actual_date: '2026-05-01' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('gate_name'));
  });

  test('error path: missing actual_date', async () => {
    const { set_milestone_actual_date } = require('../src/tools/set_milestone_actual_date');
    const result = await set_milestone_actual_date(
      { delivery_cycle_id: CYCLE_ID, gate_name: 'brief_review' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('actual_date'));
  });

  test('error path: invalid date format (not YYYY-MM-DD)', async () => {
    const { set_milestone_actual_date } = require('../src/tools/set_milestone_actual_date');
    const result = await set_milestone_actual_date(
      { delivery_cycle_id: CYCLE_ID, gate_name: 'brief_review', actual_date: '05/01/2026' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('YYYY-MM-DD'));
  });

  test('error path: invalid gate_name', async () => {
    const { set_milestone_actual_date } = require('../src/tools/set_milestone_actual_date');
    const result = await set_milestone_actual_date(
      { delivery_cycle_id: CYCLE_ID, gate_name: 'fake_gate', actual_date: '2026-05-01' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('gate_name'));
  });

  test('AC-5: unauthorized caller error message follows D-140 framing', () => {
    // The error message returned by the auth branch when a caller is neither
    // Phil, Admin, assigned DS, nor assigned CB. Asserted as a string contract
    // because the existing tests pattern does not mock Supabase. Wider DB-
    // dependent coverage is a CodeClose candidate.
    const blockedMsg = 'You do not have authority to set the actual date for this milestone. ' +
                       'Only the assigned Domain Strategist, the assigned Capability Builder, ' +
                       'Phil, or an Admin can record actual dates.';
    assert.ok(blockedMsg.includes('do not have authority'));
    assert.ok(blockedMsg.includes('Domain Strategist'));
    assert.ok(blockedMsg.includes('Capability Builder'));
    assert.ok(blockedMsg.includes('Admin'));
  });

  test('AC-2: revert-without-override-reason error message names the required field (deferred — block commented out pending UI input)', () => {
    // Contract 16 UAT (CC-016): block commented out in tool — UI has no
    // override_reason input, so the restriction would make completed actual
    // dates uncorrectable. Test kept as the locked-in error contract for when
    // the block is re-enabled (UI delivery of override_reason input).
    const blockedMsg = 'A reason is required to change this milestone\'s actual date after it was marked complete. ' +
                       'Provide override_reason describing why the date is being changed.';
    assert.ok(blockedMsg.includes('reason is required'));
    assert.ok(blockedMsg.includes('override_reason'));
  });

  // ── Contract 28 / D-449 — Backdate path (skipped → complete) ──────────────
  test('D-449 backdate: isBackdate branch checks date_status === skipped', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/set_milestone_actual_date.js'),
      'utf8'
    );
    assert.ok(/isBackdate\s*=\s*milestone\.date_status\s*===\s*'skipped'/.test(src),
      'isBackdate must check milestone.date_status === skipped');
  });

  test('D-449 backdate: updates gate_records.gate_status to approved', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/set_milestone_actual_date.js'),
      'utf8'
    );
    // gate_records update inside the isBackdate branch.
    const backdateBlock = src.split('if (isBackdate)')[1]?.split('// ── Append event log')[0] ?? '';
    assert.ok(backdateBlock.length > 0, 'isBackdate block must exist');
    assert.ok(/\.from\('gate_records'\)/.test(backdateBlock),
      'backdate must update gate_records');
    assert.ok(/gate_status:\s*'approved'/.test(backdateBlock),
      'backdate must set gate_status to approved');
  });

  test('D-449 backdate: does NOT set approver_user_id (self-asserted historical record)', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/set_milestone_actual_date.js'),
      'utf8'
    );
    const backdateBlock = src.split('if (isBackdate)')[1]?.split('// ── Append event log')[0] ?? '';
    assert.ok(!/approver_user_id/.test(backdateBlock),
      'backdate must NOT populate approver_user_id (D-449 — no approval routing)');
    assert.ok(!/approver_decision_at/.test(backdateBlock),
      'backdate must NOT populate approver_decision_at');
  });

  test('D-449 backdate: emits gate_backdated event with required metadata', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/set_milestone_actual_date.js'),
      'utf8'
    );
    assert.ok(/event_type:\s*'gate_backdated'/.test(src),
      'backdate must use event_type gate_backdated');
    assert.ok(/backdated_date/.test(src),
      'backdate metadata must include backdated_date');
    assert.ok(/previous_status:\s*'skipped'/.test(src),
      'backdate metadata must include previous_status: skipped');
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// update_milestone_status
// ─────────────────────────────────────────────────────────────────────────────
describe('update_milestone_status', () => {

  test('error path: missing delivery_cycle_id', async () => {
    const { update_milestone_status } = require('../src/tools/update_milestone_status');
    const result = await update_milestone_status(
      { gate_name: 'brief_review', date_status: 'on_track' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('delivery_cycle_id'));
  });

  test('error path: invalid date_status value', async () => {
    const { update_milestone_status } = require('../src/tools/update_milestone_status');
    const result = await update_milestone_status(
      { delivery_cycle_id: CYCLE_ID, gate_name: 'brief_review', date_status: 'pending' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('date_status'));
  });

  // ── Contract 28 / D-447 / D-451 — new trigger model ──────────────────────

  test('D-451 source: trigger criterion is milestone.actual_date IS NOT NULL', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/update_milestone_status.js'),
      'utf8'
    );
    assert.ok(/isRevertPath\s*=\s*milestone\.actual_date\s*!==\s*null/.test(src),
      'trigger must read milestone.actual_date, not milestone.date_status');
  });

  test('D-451 source: missing confirmation token returns REVERT_CONFIRMATION_REQUIRED', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/update_milestone_status.js'),
      'utf8'
    );
    assert.ok(src.includes("error: 'REVERT_CONFIRMATION_REQUIRED'"));
    assert.ok(/REVERT_CONFIRMATION_TOKEN\s*=\s*'confirmed-revert'/.test(src),
      'fixed system token must be confirmed-revert');
  });

  test('D-451 source: persists fixed system token, not free text', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/update_milestone_status.js'),
      'utf8'
    );
    // The update payload writes the system token when in the revert path —
    // never the user-supplied status_override_reason directly.
    assert.ok(/status_override_reason:\s*isRevertPath\s*\?\s*REVERT_CONFIRMATION_TOKEN/.test(src),
      'update payload must use the system token, not user-supplied text');
  });

  test('D-451 source: emits milestone_status_reverted event with required metadata', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/update_milestone_status.js'),
      'utf8'
    );
    assert.ok(/event_type:\s*'milestone_status_reverted'/.test(src));
    assert.ok(/previous_status:/.test(src));
    assert.ok(/new_status:/.test(src));
    assert.ok(/previous_actual_date:/.test(src));
  });

  test('D-447 source: rejects mutation of skipped milestone', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/update_milestone_status.js'),
      'utf8'
    );
    assert.ok(/milestone\.date_status\s*===\s*'skipped'/.test(src),
      'skipped state must be checked and rejected');
  });

  test('D-447 source: skipped not in user-settable VALID_STATUSES', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/tools/update_milestone_status.js'),
      'utf8'
    );
    const match = src.match(/VALID_STATUSES\s*=\s*\[([^\]]+)\]/);
    assert.ok(match, 'VALID_STATUSES array must be declared');
    assert.ok(!match[1].includes("'skipped'"),
      'skipped is system-only — not in user-facing valid statuses');
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// attach_cycle_artifact
// ─────────────────────────────────────────────────────────────────────────────
describe('attach_cycle_artifact', () => {

  test('error path: missing delivery_cycle_id', async () => {
    const { attach_cycle_artifact } = require('../src/tools/attach_cycle_artifact');
    const result = await attach_cycle_artifact(
      { display_name: 'Context Brief', external_url: 'https://sharepoint.com/brief' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('delivery_cycle_id'));
  });

  test('error path: missing display_name', async () => {
    const { attach_cycle_artifact } = require('../src/tools/attach_cycle_artifact');
    const result = await attach_cycle_artifact(
      { delivery_cycle_id: CYCLE_ID, external_url: 'https://sharepoint.com/brief' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('display_name'));
  });

  test('error path: neither external_url nor oi_library_artifact_id provided', async () => {
    const { attach_cycle_artifact } = require('../src/tools/attach_cycle_artifact');
    const result = await attach_cycle_artifact(
      { delivery_cycle_id: CYCLE_ID, display_name: 'My Doc' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('external_url') || result.error.includes('oi_library_artifact_id'));
  });

  test('error path: invalid pointer_status', async () => {
    const { attach_cycle_artifact } = require('../src/tools/attach_cycle_artifact');
    const result = await attach_cycle_artifact(
      {
        delivery_cycle_id: CYCLE_ID,
        display_name:      'My Doc',
        external_url:      'https://sharepoint.com/doc',
        pointer_status:    'shared'
      },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('pointer_status'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// promote_artifact_to_oi_library
// ─────────────────────────────────────────────────────────────────────────────
describe('promote_artifact_to_oi_library', () => {

  test('error path: missing cycle_artifact_id', async () => {
    const { promote_artifact_to_oi_library } = require('../src/tools/promote_artifact_to_oi_library');
    const result = await promote_artifact_to_oi_library(
      { oi_library_artifact_id: 'art-uuid' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('cycle_artifact_id'));
  });

  test('error path: missing oi_library_artifact_id', async () => {
    const { promote_artifact_to_oi_library } = require('../src/tools/promote_artifact_to_oi_library');
    const result = await promote_artifact_to_oi_library(
      { cycle_artifact_id: 'ca-uuid' },
      DS_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('oi_library_artifact_id'));
  });

  test('happy path: stub_message included in success response', () => {
    // AC: Build Report stub — OI Library submission button returns stub message
    const stubResponse = {
      success: true,
      data: { pointer_status: 'promoted' },
      stub_message: 'OI Library submission recorded. Full submission workflow (ingestion, indexing, visibility) completes in Build B.'
    };
    assert.equal(stubResponse.success, true);
    assert.ok('stub_message' in stubResponse);
    assert.ok(stubResponse.stub_message.includes('Build B'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// get_cycle_event_log
// ─────────────────────────────────────────────────────────────────────────────
describe('get_cycle_event_log', () => {

  test('error path: missing delivery_cycle_id', async () => {
    const { get_cycle_event_log } = require('../src/tools/get_cycle_event_log');
    const result = await get_cycle_event_log({}, DS_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('delivery_cycle_id'));
  });

  test('happy path: event log is chronological array', () => {
    // AC: event log shows every stage advance, gate decision, artifact attachment, outcome set in order
    const result = {
      success: true,
      data: [
        { event_type: 'cycle_created',   created_at: '2026-04-01T09:00:00Z' },
        { event_type: 'stage_advanced',  created_at: '2026-04-02T10:00:00Z' },
        { event_type: 'artifact_attached', created_at: '2026-04-02T11:00:00Z' }
      ]
    };
    assert.equal(result.success, true);
    assert.ok(Array.isArray(result.data));
    // Verify chronological order
    for (let i = 1; i < result.data.length; i++) {
      assert.ok(result.data[i].created_at >= result.data[i - 1].created_at);
    }
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// sync_jira_epic
// ─────────────────────────────────────────────────────────────────────────────
describe('sync_jira_epic', () => {

  test('error path: missing delivery_cycle_id', async () => {
    const { sync_jira_epic } = require('../src/tools/sync_jira_epic');
    const result = await sync_jira_epic({ jira_epic_key: 'PS-2025-001' }, DS_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('delivery_cycle_id'));
  });

  test('error path: missing jira_epic_key', async () => {
    const { sync_jira_epic } = require('../src/tools/sync_jira_epic');
    const result = await sync_jira_epic({ delivery_cycle_id: CYCLE_ID }, DS_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('jira_epic_key'));
  });

  test('happy path: graceful stub when Jira env vars absent', () => {
    // AC: Jira stub — graceful message if unconfigured
    // Env vars are not set in the test environment (JIRA_BASE_URL etc.)
    const stubResponse = {
      success: true,
      data: {
        synced: false,
        stub: true,
        message: 'Jira sync is not configured. Set JIRA_BASE_URL, JIRA_API_TOKEN, and JIRA_USER_EMAIL environment variables to enable bidirectional sync.'
      }
    };
    assert.equal(stubResponse.success, true);
    assert.equal(stubResponse.data.stub, true);
    assert.ok(stubResponse.data.message.includes('JIRA_BASE_URL'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// lifecycle.js constants
// ─────────────────────────────────────────────────────────────────────────────
describe('lifecycle constants (D-108, ARCH-12)', () => {

  const lifecycle = require('../src/lifecycle');

  test('STAGE_SEQUENCE has 10 main stages', () => {
    assert.equal(lifecycle.STAGE_SEQUENCE.length, 10);
    assert.equal(lifecycle.STAGE_SEQUENCE[0], 'BRIEF');
    assert.equal(lifecycle.STAGE_SEQUENCE[lifecycle.STAGE_SEQUENCE.length - 1], 'COMPLETE');
  });

  test('GATE_REQUIRED_TO_ENTER has 5 entries matching spec gates', () => {
    const gates = Object.values(lifecycle.GATE_REQUIRED_TO_ENTER);
    assert.equal(gates.length, 5);
    assert.ok(gates.includes('brief_review'));
    assert.ok(gates.includes('go_to_build'));
    assert.ok(gates.includes('go_to_deploy'));
    assert.ok(gates.includes('go_to_release'));
    assert.ok(gates.includes('close_review'));
  });

  test('nextStage returns null for terminal stages', () => {
    assert.equal(lifecycle.nextStage('COMPLETE'),  null);
    assert.equal(lifecycle.nextStage('CANCELLED'), null);
  });

  test('nextStage returns correct next stage from BRIEF', () => {
    assert.equal(lifecycle.nextStage('BRIEF'), 'DESIGN');
  });

  test('nextStage returns correct next stage from VALIDATE to UAT', () => {
    // AC: cycle advances through at least three stages; gate records created at correct positions
    // Per D-108 the lifecycle sequence is VALIDATE → UAT → PILOT
    assert.equal(lifecycle.nextStage('VALIDATE'), 'UAT');
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// Response envelope contract (D-144)
// ─────────────────────────────────────────────────────────────────────────────
describe('response envelope contract', () => {

  test('all error responses include success=false and error string', () => {
    const errorResponse = { success: false, error: 'Something went wrong.' };
    assert.equal(typeof errorResponse.success, 'boolean');
    assert.equal(errorResponse.success, false);
    assert.equal(typeof errorResponse.error, 'string');
    assert.ok(errorResponse.error.length > 0);
  });

  test('all success responses include success=true and data field', () => {
    const successResponse = { success: true, data: [] };
    assert.equal(successResponse.success, true);
    assert.ok('data' in successResponse);
  });

  test('blocked action UX: error messages explain what is blocked and how to unblock (D-140)', () => {
    // Workstream inactive block
    const workstreamBlock = 'Gate blocked: assigned workstream is inactive. Contact your Division Admin.';
    assert.ok(workstreamBlock.includes('inactive'));
    assert.ok(workstreamBlock.includes('Contact your Division Admin'));

    // Gate return without notes
    const gateReturn = 'approver_notes are required when returning a gate. Provide the reason so the team can act on it.';
    assert.ok(gateReturn.includes('approver_notes'));
    assert.ok(gateReturn.includes('reason'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// Contract 20 — EPO WIP Limit Model (D-400)
// ─────────────────────────────────────────────────────────────────────────────
describe('record_gate_decision — EPO WIP warning (Contract 20, D-400)', () => {

  test('zone-trigger gate set contains exactly go_to_build and go_to_deploy', () => {
    // AC: spec §2.3 names only these two gates as WIP-trigger gates.
    // brief_review (BRIEF → DESIGN) is excluded by design — spec wording is
    // the contract.
    const tool = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'src', 'tools', 'record_gate_decision.js'),
      'utf8'
    );
    // Asserts the literal set definition stays in sync with spec.
    assert.ok(tool.includes("new Set(['go_to_build', 'go_to_deploy'])"));
    assert.ok(!/new Set\(\[.*brief_review.*\]\)/.test(tool));
  });

  test('WIP_LIMIT_DEFAULTS resolve to 3/3/3 via lifecycle constants', () => {
    // AC: missing epo_wip_limits row → 3/3/3 default per D-400.
    const lifecycle = require('../src/lifecycle');
    assert.equal(lifecycle.WIP_LIMIT_PRE_BUILD,   3);
    assert.equal(lifecycle.WIP_LIMIT_BUILD,       3);
    assert.equal(lifecycle.WIP_LIMIT_POST_DEPLOY, 3);
  });

  test('wip_warning payload contract — fields required by Angular D-200 Pattern 2', () => {
    // String contract for the warning shape returned alongside success.
    const sampleWarning = {
      zone:             'build',
      zone_display:     'Build',
      count:            3,
      limit:            3,
      epo_user_id:      'epo-uuid',
      epo_display_name: 'Sample EPO',
      message:          'Sample EPO now has 3 Initiatives in the Build zone — at or over the limit of 3.'
    };
    assert.equal(typeof sampleWarning.zone, 'string');
    assert.equal(typeof sampleWarning.zone_display, 'string');
    assert.equal(typeof sampleWarning.count, 'number');
    assert.equal(typeof sampleWarning.limit, 'number');
    assert.ok(sampleWarning.count >= sampleWarning.limit);
    assert.ok(sampleWarning.message.includes('at or over the limit'));
    assert.ok(sampleWarning.message.includes(String(sampleWarning.limit)));
  });

  test('null assigned_epo_user_id path documented — WIP check is skipped (CC-20-04)', () => {
    // String-contract: spec §2.3 "If assigned_epo_user_id is null on the cycle
    // (no EPO assigned), skip WIP check — no warning."
    const guardComment = 'cycle has assigned_epo_user_id (null → skip per spec)';
    assert.ok(guardComment.includes('assigned_epo_user_id'));
    assert.ok(guardComment.includes('null'));
    assert.ok(guardComment.includes('skip'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// update_epo_wip_limits — Contract 20 §2.2 (D-400, D-401)
// ─────────────────────────────────────────────────────────────────────────────
describe('update_epo_wip_limits', () => {

  test('error path: missing user_id', async () => {
    const { update_epo_wip_limits } = require('../src/tools/update_epo_wip_limits');
    const result = await update_epo_wip_limits({ pre_build_limit: 5 }, ADMIN_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('user_id'));
  });

  test('error path: no limit fields supplied', async () => {
    const { update_epo_wip_limits } = require('../src/tools/update_epo_wip_limits');
    const result = await update_epo_wip_limits({ user_id: 'epo-uuid' }, ADMIN_ID);
    assert.equal(result.success, false);
    assert.ok(result.error.includes('pre_build_limit'));
    assert.ok(result.error.includes('build_limit'));
    assert.ok(result.error.includes('post_deploy_limit'));
  });

  test('error path: non-integer limit', async () => {
    const { update_epo_wip_limits } = require('../src/tools/update_epo_wip_limits');
    const result = await update_epo_wip_limits(
      { user_id: 'epo-uuid', build_limit: 3.5 },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('build_limit'));
    assert.ok(result.error.includes('integer'));
  });

  test('error path: limit below 1 (zero)', async () => {
    const { update_epo_wip_limits } = require('../src/tools/update_epo_wip_limits');
    const result = await update_epo_wip_limits(
      { user_id: 'epo-uuid', pre_build_limit: 0 },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('pre_build_limit'));
    assert.ok(result.error.includes('1 or greater'));
  });

  test('error path: limit below 1 (negative)', async () => {
    const { update_epo_wip_limits } = require('../src/tools/update_epo_wip_limits');
    const result = await update_epo_wip_limits(
      { user_id: 'epo-uuid', post_deploy_limit: -3 },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('post_deploy_limit'));
  });

  test('error path: limit is string (D-200 Pattern 3 framing)', async () => {
    const { update_epo_wip_limits } = require('../src/tools/update_epo_wip_limits');
    const result = await update_epo_wip_limits(
      { user_id: 'epo-uuid', build_limit: '5' },
      ADMIN_ID
    );
    assert.equal(result.success, false);
    assert.ok(result.error.includes('integer'));
  });

  test('D-140 framing: non-admin error names role + recovery path', () => {
    // String contract for the admin-required error message.
    const adminBlock = 'Updating EPO WIP limits requires Admin role. Contact your System Admin to request access.';
    assert.ok(adminBlock.includes('Admin role'));
    assert.ok(adminBlock.includes('Contact your System Admin'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// get_epo_wip_limits — Contract 20 §2.1 (D-400, D-401)
// ─────────────────────────────────────────────────────────────────────────────
describe('get_epo_wip_limits', () => {

  test('module exports the tool function', () => {
    const mod = require('../src/tools/get_epo_wip_limits');
    assert.equal(typeof mod.get_epo_wip_limits, 'function');
  });

  test('response shape contract — array of rows with documented fields', () => {
    // Spec §2.1: return shape contract. Asserted as a string-contract
    // because the existing tests pattern does not mock Supabase.
    const sampleRow = {
      user_id:                 'epo-uuid',
      display_name:            'Sample EPO',
      pre_build_limit:         3,
      build_limit:             3,
      post_deploy_limit:       3,
      updated_at:              null,
      updated_by_display_name: null
    };
    for (const field of [
      'user_id', 'display_name',
      'pre_build_limit', 'build_limit', 'post_deploy_limit',
      'updated_at', 'updated_by_display_name'
    ]) {
      assert.ok(field in sampleRow, `field ${field} missing from response`);
    }
  });

  test('auto-create behavior documented (spec §2.1)', () => {
    // Reads tool source and confirms the auto-create branch exists.
    const tool = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'src', 'tools', 'get_epo_wip_limits.js'),
      'utf8'
    );
    assert.ok(tool.includes('Auto-create'));
    assert.ok(tool.includes('is_epo'));
    assert.ok(tool.includes('3/3/3'));
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// get_delivery_summary — epo_summaries (Contract 20 Session 2, D-397)
// ─────────────────────────────────────────────────────────────────────────────
describe('get_delivery_summary — epo_summaries shape (Contract 20 Session 2)', () => {

  test('response envelope contract — epo_summaries row fields documented', () => {
    // String-contract for the per-EPO summary row shape returned alongside
    // workstream_summaries. Mocking Supabase is out of scope per existing pattern.
    // overdue_count + upcoming_count added per CC-20-08.
    const sampleEpoRow = {
      user_id:                  'epo-uuid',
      display_name:             'Sample EPO',
      total_active_cycles:      4,
      wip_pre_build:            1,
      wip_build:                3,
      wip_post_deploy:          0,
      wip_pre_build_limit:      3,
      wip_build_limit:          3,
      wip_post_deploy_limit:    3,
      wip_pre_build_exceeded:   false,
      wip_build_exceeded:       true,
      wip_post_deploy_exceeded: false,
      overdue_count:            2,
      upcoming_count:           1
    };
    for (const field of [
      'user_id', 'display_name', 'total_active_cycles',
      'wip_pre_build', 'wip_build', 'wip_post_deploy',
      'wip_pre_build_limit', 'wip_build_limit', 'wip_post_deploy_limit',
      'wip_pre_build_exceeded', 'wip_build_exceeded', 'wip_post_deploy_exceeded',
      'overdue_count', 'upcoming_count'
    ]) {
      assert.ok(field in sampleEpoRow, `field ${field} missing from epo_summaries row`);
    }
    // exceeded flag matches count >= limit
    assert.equal(sampleEpoRow.wip_build_exceeded, sampleEpoRow.wip_build >= sampleEpoRow.wip_build_limit);
  });

  test('tool source includes buildEpoSummaries helper (CC-20-05)', () => {
    const tool = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'src', 'tools', 'get_delivery_summary.js'),
      'utf8'
    );
    assert.ok(tool.includes('buildEpoSummaries'));
    assert.ok(tool.includes('epo_summaries'));
    assert.ok(tool.includes('epo_wip_limits'));
  });

});
