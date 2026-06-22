// contract31-public-mcp.test.js
// Pathways OI Trust — initiative-public-mcp (Contract 31, D-473).
// Tests the API-key auth helper and the three read tools. Tool functions take
// the Supabase client as a parameter, so tests inject a lightweight table-aware
// mock — no require.cache patching needed.

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');

const { validateApiKey } = require('../src/helpers/api-key-auth');
const { listInitiatives } = require('../src/tools/list_initiatives');
const { getInitiative } = require('../src/tools/get_initiative');
const { getInitiativeHistory } = require('../src/tools/get_initiative_history');

// ── Table-aware Supabase mock ─────────────────────────────────────────────────
// .from(table) → chainable builder. Awaiting the builder (after .order/.is/.in)
// resolves { data: <array for table> }. .single()/.maybeSingle() resolve the
// first row. Filters are no-ops — the tools do their own mapping over the rows.
function makeSupabase(tables) {
  function builder(table) {
    const b = {
      select: () => b, eq: () => b, is: () => b, in: () => b,
      order: () => b, not: () => b, update: () => b, insert: () => b, limit: () => b,
      maybeSingle: async () => single(table),
      single:      async () => single(table),
      then: (resolve) => Promise.resolve(list(table)).then(resolve)
    };
    return b;
  }
  function list(table)   { const v = tables[table]; return { data: Array.isArray(v) ? v : (v == null ? [] : [v]), error: null }; }
  function single(table) { const v = tables[table]; return { data: Array.isArray(v) ? (v[0] ?? null) : (v ?? null), error: null }; }
  return { from: (t) => builder(t) };
}

const GATE_NAMES = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];
function fiveMilestones() {
  return GATE_NAMES.map((g, i) => ({ gate_name: g, target_date: `2026-0${i + 1}-01`, actual_date: null, date_status: 'not_started' }));
}
function fiveGates() {
  return GATE_NAMES.map((g, i) => ({
    gate_record_id: `gr-${i}`, gate_name: g,
    gate_status: i === 0 ? 'approved' : 'not_started',
    approver_user_id: 'uuid-approver', submitted_at: null,
    approver_decision_at: null, approver_notes: 'secret return note'
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
describe('validateApiKey', () => {

  test('missing header → invalid', async () => {
    const sb = makeSupabase({ api_keys: [] });
    const r = await validateApiKey(sb, undefined);
    assert.equal(r.valid, false);
  });

  test('wrong prefix → invalid', async () => {
    const sb = makeSupabase({ api_keys: [] });
    const r = await validateApiKey(sb, 'Bearer not-an-oitrust-key');
    assert.equal(r.valid, false);
    assert.match(r.error, /format/i);
  });

  test('valid key → returns scope_type', async () => {
    const raw = 'oitrust_testkey1234567890';
    const hash = await bcrypt.hash(raw, 10);
    const sb = makeSupabase({ api_keys: [{ key_id: 'k1', key_hash: hash, scope_type: 'all', division_ids: [] }] });
    const r = await validateApiKey(sb, `Bearer ${raw}`);
    assert.equal(r.valid, true);
    assert.equal(r.scope_type, 'all');
  });

  test('revoked / no active key → invalid', async () => {
    // The active-key query filters revoked_at IS NULL; an empty active set models a revoked key.
    const sb = makeSupabase({ api_keys: [] });
    const r = await validateApiKey(sb, 'Bearer oitrust_anything');
    assert.equal(r.valid, false);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('list_initiatives', () => {

  const cyclesFixture = [
    { delivery_cycle_id: 'i1', cycle_title: 'Alpha', division_id: 'd1', workstream_id: 'w1',
      tier_classification: 'tier_2', current_lifecycle_stage: 'BUILD', outcome_statement: 'Ship it',
      assigned_dcs_user_id: 'u-dcs', assigned_epo_user_id: null, assigned_dol_user_id: null,
      jira_epic_key: 'PS-1', created_at: '2026-06-01T00:00:00Z' },
    { delivery_cycle_id: 'i2', cycle_title: 'Beta', division_id: 'd1', workstream_id: null,
      tier_classification: 'tier_1', current_lifecycle_stage: 'PILOT', outcome_statement: null,
      assigned_dcs_user_id: null, assigned_epo_user_id: null, assigned_dol_user_id: null,
      jira_epic_key: null, created_at: '2026-05-01T00:00:00Z' }
  ];
  const baseTables = () => ({
    delivery_cycles: cyclesFixture,
    users:       [{ id: 'u-dcs', display_name: 'Dana DCS', email: 'dana@x.com' }],
    divisions:   [{ id: 'd1', division_name: 'Practice Services', display_name_short: 'PS' }],
    delivery_workstreams: [{ workstream_id: 'w1', workstream_name: 'Core', display_name_short: 'Core' }],
    cycle_milestone_dates: [],
    gate_records: []
  });

  test('valid auth → returns array, names resolved, no UUID/email fields', async () => {
    const sb = makeSupabase(baseTables());
    const rows = await listInitiatives(sb, {}, { scope_type: 'all', division_ids: [] });
    assert.ok(Array.isArray(rows));
    assert.equal(rows.length, 2);
    assert.equal(rows[0].division_name, 'Practice Services');
    assert.equal(rows[0].dcs_name, 'Dana DCS');
    const json = JSON.stringify(rows);
    assert.ok(!json.includes('assigned_dcs_user_id'), 'no raw assigned UUID field');
    assert.ok(!json.includes('u-dcs'), 'no raw user UUID value');
    assert.ok(!json.includes('@'), 'no email leaked');
    assert.ok(!json.includes('_next_gate_raw'), 'internal filter field stripped');
  });

  test('lifecycle_stage filter → correct subset', async () => {
    // Mock ignores SQL filters, so emulate the eq() narrowing in the fixture.
    const tables = baseTables();
    tables.delivery_cycles = cyclesFixture.filter(c => c.current_lifecycle_stage === 'BUILD');
    const sb = makeSupabase(tables);
    const rows = await listInitiatives(sb, { lifecycle_stage: 'BUILD' }, { scope_type: 'all' });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].current_stage, 'Build');
  });

  test('tier filter passes through (current_stage humanized)', async () => {
    const tables = baseTables();
    tables.delivery_cycles = cyclesFixture.filter(c => c.tier_classification === 'tier_1');
    const sb = makeSupabase(tables);
    const rows = await listInitiatives(sb, { tier: 'tier_1' }, { scope_type: 'all' });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].tier, 'tier_1');
    assert.equal(rows[0].current_stage, 'Pilot');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('get_initiative', () => {

  function tablesFor(cycle) {
    return {
      delivery_cycles: cycle ? [cycle] : [],
      users: [
        { id: 'u-dcs', display_name: 'Dana DCS', email: 'dana@x.com' },
        { id: 'uuid-approver', display_name: 'Phil Dodds', email: 'phil@x.com' }
      ],
      divisions: [{ id: 'd1', division_name: 'Practice Services', display_name_short: 'PS' }],
      delivery_workstreams: [{ workstream_id: 'w1', workstream_name: 'Core', display_name_short: 'Core' }],
      cycle_milestone_dates: fiveMilestones(),
      gate_records: fiveGates(),
      cycle_artifacts: [{ artifact_type_id: 't1', display_name: 'Context Brief', external_url: 'http://x', gate_affinity: 'brief_review', pointer_status: 'external_only' }],
      cycle_artifact_types: [{ artifact_type_id: 't1', artifact_type_name: 'Context Brief' }],
      gate_consultations: [
        { gate_record_id: 'gr-0', response: 'approved' },
        { gate_record_id: 'gr-0', response: 'declined_post_approval' },
        { gate_record_id: 'gr-0', response: 'pending' }
      ]
    };
  }

  const goodCycle = {
    delivery_cycle_id: 'i1', cycle_title: 'Alpha', division_id: 'd1', workstream_id: 'w1',
    tier_classification: 'tier_2', current_lifecycle_stage: 'BUILD', outcome_statement: 'Ship it',
    assigned_dcs_user_id: 'u-dcs', assigned_epo_user_id: null, assigned_dol_user_id: null,
    jira_epic_key: 'PS-1', other_consulted_user_ids: ['a', 'b'], other_informed_user_ids: ['c'],
    created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-02T00:00:00Z'
  };

  test('unknown id → null (→404)', async () => {
    const sb = makeSupabase(tablesFor(null));
    const r = await getInitiative(sb, 'missing', { scope_type: 'all' });
    assert.equal(r, null);
  });

  test('valid → milestones(5), gates(5), artifacts; counts; no UUIDs/emails/notes-when-not-returned', async () => {
    const sb = makeSupabase(tablesFor(goodCycle));
    const r = await getInitiative(sb, 'i1', { scope_type: 'all' });
    assert.equal(r.milestones.length, 5);
    assert.equal(r.gates.length, 5);
    assert.equal(r.artifacts.length, 1);
    assert.equal(r.artifacts[0].type_label, 'Context Brief');
    assert.equal(r.other_consulted_count, 2);
    assert.equal(r.other_informed_count, 1);

    // Consultation summary aggregation (declined_post_approval counts as declined).
    const g0 = r.gates.find(g => g.gate_name === 'brief_review');
    assert.equal(g0.consultation_summary.consulted_count, 3);
    assert.equal(g0.consultation_summary.responded_count, 2);
    assert.equal(g0.consultation_summary.approved_count, 1);
    assert.equal(g0.consultation_summary.declined_count, 1);
    // approver_notes only present when returned — brief_review is approved → null.
    assert.equal(g0.approver_notes, null);

    const json = JSON.stringify(r);
    assert.ok(!json.includes('assigned_dcs_user_id'));
    assert.ok(!json.includes('approver_user_id'));
    assert.ok(!json.includes('consulted_user_id'));
    assert.ok(!json.includes('other_consulted_user_ids'));
    assert.ok(!json.includes('u-dcs'), 'no raw DCS UUID');
    assert.ok(!json.includes('uuid-approver'), 'no raw approver UUID');
    assert.ok(!json.includes('@'), 'no email leaked');
    assert.ok(!json.includes('secret return note'), 'return note suppressed on non-returned gate');
    // Names ARE present.
    assert.equal(r.dcs_name, 'Dana DCS');
    assert.equal(r.gates[0].approver_display_name, 'Phil Dodds');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('get_initiative_history', () => {

  test('valid → events descending, email_sent filtered, no event_metadata/actor_user_id', async () => {
    const tables = {
      delivery_cycles: [{ delivery_cycle_id: 'i1' }],
      users: [{ id: 'actor1', display_name: 'Dana DCS', email: 'dana@x.com' }],
      cycle_event_log: [
        { event_type: 'gate_approved', event_description: 'Gate approved', actor_user_id: 'actor1', event_metadata: { gate_name: 'brief_review', secret: 'x' }, created_at: '2026-06-03T00:00:00Z' },
        { event_type: 'email_sent', event_description: 'Email sent', actor_user_id: null, event_metadata: { to: 'a@b.com' }, created_at: '2026-06-02T00:00:00Z' },
        { event_type: 'cycle_created', event_description: 'Initiative created', actor_user_id: 'actor1', event_metadata: null, created_at: '2026-06-01T00:00:00Z' }
      ]
    };
    const sb = makeSupabase(tables);
    const r = await getInitiativeHistory(sb, 'i1');
    assert.equal(r.length, 2, 'email_sent filtered out');
    assert.equal(r[0].event_type, 'Gate approved', 'label mapped');
    assert.equal(r[0].gate_name, 'brief_review', 'gate_name derived from metadata');
    assert.equal(r[0].actor_display_name, 'Dana DCS');
    const json = JSON.stringify(r);
    assert.ok(!json.includes('event_metadata'));
    assert.ok(!json.includes('actor_user_id'));
    assert.ok(!json.includes('delivery_cycle_id'));
    assert.ok(!json.includes('"secret"'));
    assert.ok(!json.includes('@'), 'no email leaked');
  });

  test('unknown id → null (→404)', async () => {
    const sb = makeSupabase({ delivery_cycles: [], cycle_event_log: [] });
    const r = await getInitiativeHistory(sb, 'missing');
    assert.equal(r, null);
  });

});
