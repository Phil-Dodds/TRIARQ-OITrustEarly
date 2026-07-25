// phil-override.test.js
// Pathways OI Trust — delivery-cycle-mcp (Phil override levers, 2026-07-24).
// Covers: phil_override rejection for non-Phil callers on submit + decision,
// force_close_initiative validation + non-Phil rejection, and the neutral
// (trust-silent) Level 1/2 derivation explanations.
// Supabase singleton mocked via require.cache injection (FIFO response queue).

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
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain }
};

const { submit_gate_for_approval } = require('../src/tools/submit_gate_for_approval');
const { record_gate_decision }     = require('../src/tools/record_gate_decision');
const { force_close_initiative }   = require('../src/tools/force_close_initiative');
const { deriveBaselineLevel, buildDerivationExplanation } = require('../src/lib/governance-derivation');

const CYC = 'cycle-uuid';
const USR = 'user-uuid';

beforeEach(() => { queue = []; });

describe('phil_override — submit_gate_for_approval', () => {

  test('rejects phil_override from a non-Phil caller', async () => {
    queue = [
      // cycle fetch (single)
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', division_id: null,
                current_lifecycle_stage: 'BRIEF', assigned_dcs_user_id: USR,
                assigned_epo_user_id: null, assigned_dol_user_id: null,
                jira_epic_key: null, ai_functionality: null, workstream_id: null,
                baseline_level: 2, set_level: null, oversight_user_id: null }, error: null },
      // caller fetch (single) — an admin, but not Phil
      { data: { is_admin: true, display_name: 'Not Phil' }, error: null },
      // isPhil() lookup: users where is_super_admin (single/maybeSingle)
      { data: null, error: null },
      { data: null, error: null }
    ];
    const res = await submit_gate_for_approval(
      { delivery_cycle_id: CYC, gate_name: 'brief_review', phil_override: true }, USR);
    assert.equal(res.success, false);
    assert.match(res.error, /Phil only/);
  });

  test('validation errors still precede any override handling', async () => {
    const res = await submit_gate_for_approval({ gate_name: 'brief_review', phil_override: true }, USR);
    assert.equal(res.success, false);
    assert.match(res.error, /delivery_cycle_id/);
  });
});

describe('phil_override — record_gate_decision', () => {

  test('rejects phil_override from a non-Phil caller', async () => {
    queue = [
      // gate record fetch (single)
      { data: { gate_record_id: 'gr-1', gate_status: 'awaiting_approval', approver_user_id: null }, error: null },
      // cycle fetch (single)
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', current_lifecycle_stage: 'BRIEF',
                workstream_id: null, division_id: null, assigned_dcs_user_id: null,
                assigned_epo_user_id: null, assigned_dol_user_id: null,
                baseline_level: 2, set_level: null, ai_functionality: null,
                ai_delivery_form: null, ai_audience: null }, error: null },
      // caller fetch (single) — admin, is_super_admin false
      { data: { is_admin: true, is_super_admin: false, is_initiative_executive: false,
                display_name: 'Not Phil' }, error: null }
    ];
    const res = await record_gate_decision(
      { delivery_cycle_id: CYC, gate_name: 'brief_review', decision: 'approved', phil_override: true }, USR);
    assert.equal(res.success, false);
    assert.match(res.error, /Phil only/);
  });
});

describe('force_close_initiative', () => {

  test('requires delivery_cycle_id', async () => {
    const res = await force_close_initiative({}, USR);
    assert.equal(res.success, false);
    assert.match(res.error, /delivery_cycle_id/);
  });

  test('rejects non-Phil callers', async () => {
    queue = [
      // isPhil() lookup — no super-admin match for this caller
      { data: null, error: null },
      { data: null, error: null }
    ];
    const res = await force_close_initiative({ delivery_cycle_id: CYC }, USR);
    assert.equal(res.success, false);
    assert.match(res.error, /Phil only/);
  });
});

describe('derivation explanation stays silent on the trusted-DCS rule (Phil 2026-07-24)', () => {

  test('Level 1 all-small explanation carries no trust language', () => {
    const sizing = { q1_investment: 'small', q2_novelty: 'standard', q3_wrongness: 'contained' };
    assert.equal(deriveBaselineLevel(sizing, true), 1);
    const text = buildDerivationExplanation(sizing, true).join(' ');
    assert.doesNotMatch(text, /trust/i);
    assert.match(text, /→ Level 1/);
  });

  test('Level 2 all-small (untrusted DCS) explanation carries no trust language', () => {
    const sizing = { q1_investment: 'small', q2_novelty: 'standard', q3_wrongness: 'contained' };
    assert.equal(deriveBaselineLevel(sizing, false), 2);
    const text = buildDerivationExplanation(sizing, false).join(' ');
    assert.doesNotMatch(text, /trust/i);
    assert.doesNotMatch(text, /DCS/);
    assert.match(text, /→ Level 2/);
  });
});
