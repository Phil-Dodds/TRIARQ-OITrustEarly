// contract29.test.js
// Pathways OI Trust — Contract 29 (Gate Approval, Consultation, and Notification).
// Happy-path coverage for pure logic helpers + error-path coverage for the new
// and modified tools. Matches the suite convention: no Supabase mock —
// DB-dependent happy paths are verified via UAT (see CodeClose test ratchet).
// AC refs: build-c-spec Contract 29 §Acceptance Criteria.

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

const DCS = 'dcs-uuid';
const EPO = 'epo-uuid';
const DOL = 'dol-uuid';
const OTHER1 = 'other-1-uuid';
const GATE = 'gate-record-uuid';

// ─────────────────────────────────────────────────────────────────────────────
// helpers/consultations — deriveConsultedUserIds (WS2 core logic, D-459)
// ─────────────────────────────────────────────────────────────────────────────
describe('deriveConsultedUserIds (D-459)', () => {
  const { deriveConsultedUserIds } = require('../src/tools/helpers/consultations');

  test('happy path: merges trio + other_consulted, order preserved', () => {
    const ids = deriveConsultedUserIds({
      assigned_dcs_user_id: DCS,
      assigned_epo_user_id: EPO,
      assigned_dol_user_id: DOL,
      other_consulted_user_ids: [OTHER1]
    });
    assert.deepEqual(ids, [DCS, EPO, DOL, OTHER1]);
  });

  test('excludes null trio members', () => {
    const ids = deriveConsultedUserIds({
      assigned_dcs_user_id: DCS,
      assigned_epo_user_id: null,
      assigned_dol_user_id: null,
      other_consulted_user_ids: []
    });
    assert.deepEqual(ids, [DCS]);
  });

  test('deduplicates a user present in both trio and other_consulted', () => {
    const ids = deriveConsultedUserIds({
      assigned_dcs_user_id: DCS,
      assigned_epo_user_id: EPO,
      assigned_dol_user_id: null,
      other_consulted_user_ids: [DCS, OTHER1] // DCS duplicate
    });
    assert.deepEqual(ids, [DCS, EPO, OTHER1]);
  });

  test('empty when no trio and no others', () => {
    const ids = deriveConsultedUserIds({
      assigned_dcs_user_id: null,
      assigned_epo_user_id: null,
      assigned_dol_user_id: null,
      other_consulted_user_ids: null
    });
    assert.deepEqual(ids, []);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// helpers/notification-email — buildHtmlBody (WS4, D-467)
// ─────────────────────────────────────────────────────────────────────────────
describe('buildHtmlBody (D-467)', () => {
  const { buildHtmlBody } = require('../src/tools/helpers/notification-email');

  test('happy path: includes initiative name, gate, and CTA when initiativeId present', () => {
    const html = buildHtmlBody({
      initiativeName: 'Patient Intake Redesign',
      gateNameDisplay: 'Brief Review',
      contextParagraph: 'A submitted Brief Review.',
      initiativeId: 'init-123'
    });
    assert.ok(html.includes('Patient Intake Redesign'));
    assert.ok(html.includes('Brief Review'));
    assert.ok(html.includes('/initiatives/init-123'));
    assert.ok(html.includes('View Initiative'));
    assert.ok(html.includes('TRIARQ Health'));
  });

  // Contract 30 follow-up: the approve/review email sends the recipient to their
  // My Actions grid (/actions), not the Initiative detail.
  test('gate_submission CTA links to My Actions, not the Initiative detail', () => {
    const html = buildHtmlBody({
      initiativeName: 'Patient Intake Redesign',
      gateNameDisplay: 'Brief Review',
      contextParagraph: 'Please review this gate.',
      initiativeId: 'init-123',
      emailType: 'gate_submission'
    });
    assert.ok(html.includes('/actions'));
    assert.ok(html.includes('Go to My Actions'));
    assert.ok(!html.includes('/initiatives/init-123'));
    assert.ok(!html.includes('View Initiative'));
  });

  test('omits CTA button when initiativeId is null', () => {
    const html = buildHtmlBody({
      initiativeName: 'X',
      gateNameDisplay: 'Go to Build',
      contextParagraph: 'ctx',
      initiativeId: null
    });
    assert.ok(!html.includes('View Initiative'));
  });

  test('escapes HTML-significant characters in content', () => {
    const html = buildHtmlBody({
      initiativeName: 'A & B <script>',
      gateNameDisplay: 'Close Review',
      contextParagraph: 'x',
      initiativeId: null
    });
    assert.ok(html.includes('A &amp; B &lt;script&gt;'));
    assert.ok(!html.includes('<script>'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// record_consultation_response (WS2, D-460) — error paths
// ─────────────────────────────────────────────────────────────────────────────
describe('record_consultation_response (D-460)', () => {
  const { record_consultation_response } = require('../src/tools/record_consultation_response');

  test('error path: missing gate_record_id', async () => {
    const r = await record_consultation_response({ response: 'approved' }, DCS);
    assert.equal(r.success, false);
    assert.ok(r.error.includes('gate_record_id'));
  });

  test('error path: missing response', async () => {
    const r = await record_consultation_response({ gate_record_id: GATE }, DCS);
    assert.equal(r.success, false);
    assert.ok(r.error.includes('response'));
  });

  test('error path: invalid response value', async () => {
    const r = await record_consultation_response(
      { gate_record_id: GATE, response: 'maybe' }, DCS
    );
    assert.equal(r.success, false);
    assert.ok(r.error.includes('response must be one of'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// list_gate_consultations (WS2, D-462) — error path
// ─────────────────────────────────────────────────────────────────────────────
describe('list_gate_consultations (D-462)', () => {
  const { list_gate_consultations } = require('../src/tools/list_gate_consultations');

  test('error path: missing gate_record_id', async () => {
    const r = await list_gate_consultations({}, DCS);
    assert.equal(r.success, false);
    assert.ok(r.error.includes('gate_record_id'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// set_gate_approver (WS3, D-464) — error paths
// ─────────────────────────────────────────────────────────────────────────────
describe('set_gate_approver (D-464)', () => {
  const { set_gate_approver } = require('../src/tools/set_gate_approver');

  test('error path: missing division_id', async () => {
    const r = await set_gate_approver({ gate_name: 'brief_review', approver_user_id: DCS }, 'phil');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('division_id'));
  });

  test('error path: missing approver_user_id', async () => {
    const r = await set_gate_approver({ division_id: 'div-1', gate_name: 'brief_review' }, 'phil');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('approver_user_id'));
  });

  test('error path: invalid gate_name', async () => {
    const r = await set_gate_approver(
      { division_id: 'div-1', gate_name: 'not_a_gate', approver_user_id: DCS }, 'phil'
    );
    assert.equal(r.success, false);
    assert.ok(r.error.includes('gate_name must be one of'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// delete_gate_approver_config (WS3, D-464) — error paths
// ─────────────────────────────────────────────────────────────────────────────
describe('delete_gate_approver_config (D-464)', () => {
  const { delete_gate_approver_config } = require('../src/tools/delete_gate_approver_config');

  test('error path: missing division_id', async () => {
    const r = await delete_gate_approver_config({ gate_name: 'brief_review' }, 'phil');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('division_id'));
  });

  test('error path: invalid gate_name', async () => {
    const r = await delete_gate_approver_config({ division_id: 'div-1', gate_name: 'x' }, 'phil');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('gate_name must be one of'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// update_delivery_cycle (WS1, D-458) — array field validation (pre-DB paths)
// ─────────────────────────────────────────────────────────────────────────────
describe('update_delivery_cycle other_consulted/informed (D-458)', () => {
  const { update_delivery_cycle } = require('../src/tools/update_delivery_cycle');

  test('error path: other_consulted_user_ids must be an array', async () => {
    const r = await update_delivery_cycle(
      { delivery_cycle_id: 'c1', other_consulted_user_ids: 'not-array' }, DCS
    );
    assert.equal(r.success, false);
    assert.ok(r.error.includes('Other Consulted'));
    assert.ok(r.error.toLowerCase().includes('array'));
  });

  test('error path: other_informed_user_ids with a non-string entry', async () => {
    const r = await update_delivery_cycle(
      { delivery_cycle_id: 'c1', other_informed_user_ids: [123] }, DCS
    );
    assert.equal(r.success, false);
    assert.ok(r.error.includes('Other Informed'));
    assert.ok(r.error.includes('invalid user id'));
  });
});
