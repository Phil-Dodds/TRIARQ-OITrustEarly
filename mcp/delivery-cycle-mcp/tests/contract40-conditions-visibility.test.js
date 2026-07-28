// contract40-conditions-visibility.test.js — Contract 40 WS3 (D-590)
// (c) condition text auto-posts to the gate thread on add; no email.
// (b) list_pending_approvals surfaces open_conditions rows routed to the trio
//     and consultation_required parties, with count + days_waiting, clearing
//     when the last condition closes.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

let queue = [];
const inserts = [];
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }
const chain = {
  from:   (t) => { chain._table = t; return chain; },
  select: () => chain, insert: (row) => { inserts.push({ table: chain._table, row }); return chain; },
  update: () => chain, upsert: () => chain, delete: () => chain,
  eq: () => chain, is: () => chain, in: () => chain, not: () => chain, or: () => chain,
  order: () => chain, limit: () => chain,
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};
const dbPath = require.resolve('../src/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain } };

const conditionTools = require('../src/tools/gate_conditions');

const GATE = 'g1', CYC = 'c1', APPROVER = 'approver-uuid';

beforeEach(() => { queue = []; inserts.length = 0; });

describe('WS3(c) (D-590/D-565): condition auto-posts to the gate thread', () => {

  test('AC-16: add_gate_condition inserts a gate_thread_messages row with the condition text', async () => {
    queue = [
      { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'go_to_build', approver_user_id: APPROVER }, error: null }, // gate fetch
      { data: { condition_id: 'cond1', gate_record_id: GATE, condition_type: 'general', condition_status: 'open' }, error: null },   // insert condition
      { data: null, error: null }   // event log
    ];
    const r = await conditionTools.add_gate_condition(
      { gate_record_id: GATE, type: 'general', text: 'Add a rollback plan' }, APPROVER);
    assert.equal(r.success, true);
    const threadInsert = inserts.find(i => i.table === 'gate_thread_messages');
    assert.ok(threadInsert, 'a gate_thread_messages row is inserted');
    assert.match(threadInsert.row.message_text, /Add a rollback plan/);
    assert.equal(threadInsert.row.user_id, APPROVER, 'attributed to the setter');
  });

  test('AC-17: the add-condition path invokes no email edge function', () => {
    const src = fs.readFileSync(require.resolve('../src/tools/gate_conditions.js'), 'utf8');
    assert.doesNotMatch(src, /functions\.invoke|sendGateNotificationEmail|send-notification-email/);
  });
});

describe('WS3(b) (D-590): open_conditions rows in list_pending_approvals', () => {
  const src = fs.readFileSync(require.resolve('../src/tools/list_pending_approvals.js'), 'utf8');

  // AC-12: routed to trio + consultation_required parties.
  test('AC-12: routing covers trio membership and consultation targets', () => {
    assert.match(src, /item_type:\s*'open_conditions'/);
    assert.match(src, /assigned_dcs_user_id[\s\S]*assigned_epo_user_id[\s\S]*assigned_dol_user_id[\s\S]*includes\(caller_user_id\)/);
    assert.match(src, /consultation_required/);
    assert.match(src, /consultUserByTarget/);
    assert.match(src, /if \(!isTrio && !isConsultationParty\)/);
  });

  // AC-13: the source scopes to open conditions only — a gate with no open
  // conditions produces no row, so closing the last one clears the rows.
  test('AC-13: rows are built only from condition_status = open', () => {
    assert.match(src, /gate_conditions[\s\S]*condition_status'?,?\s*'open'|eq\('condition_status',\s*'open'\)/);
  });

  // AC-14 columns: open_condition_count + days_waiting on the row.
  test('AC-14: row carries open_condition_count and days_waiting', () => {
    assert.match(src, /open_condition_count:\s*info\.count/);
    assert.match(src, /days_waiting:\s*daysWaiting/);
  });
});
