// contractG9-suggestions.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract G9, D-563 Grades 1–2).
// Exactly two hardcoded rules (no framework); dismiss-with-note (S-C7);
// add attaches the group as Consulted (set_via 'rule', idempotent).
// FIFO-queue mock per the established technique.

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

const { get_suggestion_state, apply_suggestion_decision, SUGGESTION_RULES } = require('../src/tools/suggestions');

const DCS = 'dcs-uuid', OUT = 'out-uuid', CYC = 'c1';
const cycleRow = {
  delivery_cycle_id: CYC, cycle_title: 'T', division_id: 'div',
  assigned_dcs_user_id: DCS, assigned_epo_user_id: null, assigned_dol_user_id: null
};

beforeEach(() => { queue = []; });

describe('G9 — exactly two rules (D-563, AC #3)', () => {
  test('SUGGESTION_RULES has exactly q4_security and q5_ux', () => {
    assert.deepEqual(Object.keys(SUGGESTION_RULES).sort(), ['q4_security', 'q5_ux']);
  });

  test('unknown rule_key rejected — no rules framework', async () => {
    const r = await apply_suggestion_decision(
      { delivery_cycle_id: CYC, rule_key: 'q9_custom', action: 'add' }, DCS);
    assert.equal(r.success, false);
    assert.match(r.error, /exactly two rules/);
  });
});

describe('G9 — get_suggestion_state', () => {
  test('Q4=Yes yields a live Security suggestion when unattached and undismissed (AC #1)', async () => {
    queue = [
      { data: { q4_security_impact: true, q5_ux: 'standard' }, error: null },        // sizing
      { data: [{ group_id: 'g-sec', group_name: 'Security' }, { group_id: 'g-ux', group_name: 'UX' }], error: null },
      { data: [], error: null },                                                     // no C stakes
      { data: [], error: null }                                                      // no dismissals
    ];
    const r = await get_suggestion_state({ delivery_cycle_id: CYC }, DCS);
    assert.equal(r.success, true);
    const sec = r.data.suggestions.find(s => s.rule_key === 'q4_security');
    const ux  = r.data.suggestions.find(s => s.rule_key === 'q5_ux');
    assert.equal(sec.live, true);
    assert.equal(ux.applies, false);
  });

  test('a dismissal makes the suggestion not-live and carries the visible note (S-C7)', async () => {
    queue = [
      { data: { q4_security_impact: true, q5_ux: 'standard' }, error: null },
      { data: [{ group_id: 'g-sec', group_name: 'Security' }], error: null },
      { data: [], error: null },
      { data: [{ rule_key: 'q4_security', group_id: 'g-sec', note: 'legacy auth only', dismissed_by_user_id: DCS, created_at: 'now' }], error: null }
    ];
    const r = await get_suggestion_state({ delivery_cycle_id: CYC }, DCS);
    const sec = r.data.suggestions.find(s => s.rule_key === 'q4_security');
    assert.equal(sec.live, false);
    assert.equal(sec.dismissed, true);
    assert.equal(sec.dismissal_note, 'legacy auth only');
  });
});

describe('G9 — apply_suggestion_decision', () => {
  test('dismiss without a note rejected (AC #1)', async () => {
    const r = await apply_suggestion_decision(
      { delivery_cycle_id: CYC, rule_key: 'q4_security', action: 'dismiss' }, DCS);
    assert.equal(r.success, false);
    assert.match(r.error, /note/);
  });

  test('non-trio non-admin cannot act', async () => {
    queue = [
      { data: { group_id: 'g-sec', group_name: 'Security' }, error: null },  // group
      { data: cycleRow, error: null },                                       // cycle
      { data: { is_admin: false, is_super_admin: false }, error: null }      // caller
    ];
    const r = await apply_suggestion_decision(
      { delivery_cycle_id: CYC, rule_key: 'q4_security', action: 'add' }, OUT);
    assert.equal(r.success, false);
    assert.match(r.error, /trio or an Admin/);
  });

  test('trio Add attaches Security as Consulted via rule (AC #1)', async () => {
    queue = [
      { data: { group_id: 'g-sec', group_name: 'Security' }, error: null },
      { data: cycleRow, error: null },
      { data: null, error: null },                                           // no existing stake
      { data: null, error: null },                                           // participation insert
      { data: null, error: null }                                            // event
    ];
    const r = await apply_suggestion_decision(
      { delivery_cycle_id: CYC, rule_key: 'q4_security', action: 'add' }, DCS);
    assert.equal(r.success, true);
    assert.equal(r.data.group_name, 'Security');
    assert.equal(queue.length, 0);
  });

  test('trio Dismiss records the note (S-C7)', async () => {
    queue = [
      { data: { group_id: 'g-ux', group_name: 'UX' }, error: null },
      { data: cycleRow, error: null },
      { data: null, error: null },                                           // dismissal upsert
      { data: null, error: null }                                            // event
    ];
    const r = await apply_suggestion_decision(
      { delivery_cycle_id: CYC, rule_key: 'q5_ux', action: 'dismiss', note: 'standard patterns only' }, DCS);
    assert.equal(r.success, true);
    assert.equal(r.data.action, 'dismiss');
    assert.equal(queue.length, 0);
  });
});

describe('G9 — Grade 3 untouched (AC #5)', () => {
  test('board-trigger helper is the only auto-attach — unchanged by G9', () => {
    const fs = require('node:fs');
    const src = fs.readFileSync(require.resolve('../src/tools/helpers/board-trigger.js'), 'utf8');
    assert.match(src, /isBoardTriggeredGate/);
    const sugg = fs.readFileSync(require.resolve('../src/tools/suggestions.js'), 'utf8');
    assert.ok(!/auto[_-]?attach/i.test(sugg), 'suggestions never auto-attach');
  });
});
