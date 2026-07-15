// contract37-tools.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 37, D-549–D-553).
// Sprint calendar admin tools, division assignment, effective-calendar walk,
// and set_gate_date_rule (resolution + pre-flight cascade + commit).
// Supabase singleton mocked via require.cache injection (FIFO response queue,
// contract32-status.test.js pattern) extended with update/insert payload
// capture so rule-metadata writes are assertable.

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

let queue = [];
let updatePayloads = [];
let insertPayloads = [];
function nextResp(fallback) { return queue.length ? queue.shift() : fallback; }
const chain = {
  from:   () => chain,
  select: () => chain,
  insert: (payload) => { insertPayloads.push(payload); return chain; },
  update: (payload) => { updatePayloads.push(payload); return chain; },
  delete: () => chain,
  eq:     () => chain,
  is:     () => chain,
  in:     () => chain,
  gte:    () => chain,
  not:    () => chain,
  or:     () => chain,
  order:  () => chain,
  limit:  () => chain,
  rpc:    async () => nextResp({ data: null, error: null }),
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain }
};

const cal = require('../src/tools/sprint_calendars');
const { set_division_sprint_calendar, get_effective_sprint_calendar } = require('../src/tools/division_sprint_calendar');
const { set_gate_date_rule } = require('../src/tools/set_gate_date_rule');
const { set_milestone_target_date } = require('../src/tools/set_milestone_target_date');

const ADMIN = { data: { is_admin: true }, error: null };
const NON_ADMIN = { data: { is_admin: false }, error: null };
const CYC = 'cycle-uuid';
const USR = 'user-uuid';

const SPRINTS = [
  { id: 's09', sprint_id: '2026.09', start_date: '2026-06-15', end_date: '2026-07-03' },
  { id: 's10', sprint_id: '2026.10', start_date: '2026-07-06', end_date: '2026-07-24' },
  { id: 's11', sprint_id: '2026.11', start_date: '2026-07-27', end_date: '2026-08-14' }
];

const milestone = (gate_name, target_date, extra = {}) => ({
  milestone_id: `m-${gate_name}`,
  gate_name,
  target_date,
  actual_date: null,
  date_rule_type: 'manual',
  rule_sprint_id: null, rule_anchor: null,
  rule_sprint_count: null, rule_day_offset: null,
  rule_stale: false,
  ...extra
});

// Queue prefix for set_gate_date_rule: cycle → milestones → effective calendar
// (division → calendar → sprints).
function queueRulePrefix(milestones) {
  queue.push(
    { data: { delivery_cycle_id: CYC, division_id: 'div-1' }, error: null },
    { data: milestones, error: null },
    { data: { id: 'div-1', parent_division_id: null, sprint_calendar_id: 'cal-1', sprint_calendar_none: false }, error: null },
    { data: { id: 'cal-1', calendar_name: 'TRIARQ Standard 2026', active_status: true }, error: null },
    { data: SPRINTS, error: null }
  );
}

beforeEach(() => { queue = []; updatePayloads = []; insertPayloads = []; });

// ── Calendar CRUD ─────────────────────────────────────────────────────────────
describe('sprint calendar admin tools', () => {

  test('create_sprint_calendar happy path', async () => {
    queue = [ADMIN, { data: { id: 'cal-1', calendar_name: 'TRIARQ Standard 2026' }, error: null }];
    const r = await cal.create_sprint_calendar({ calendar_name: 'TRIARQ Standard 2026' }, USR);
    assert.equal(r.success, true);
    assert.equal(r.data.calendar_name, 'TRIARQ Standard 2026');
  });

  test('create_sprint_calendar rejects non-admin', async () => {
    queue = [NON_ADMIN];
    const r = await cal.create_sprint_calendar({ calendar_name: 'X' }, USR);
    assert.equal(r.success, false);
    assert.match(r.error, /Admin role/);
  });

  test('create_sprint_calendar rejects empty name', async () => {
    queue = [ADMIN];
    const r = await cal.create_sprint_calendar({ calendar_name: '  ' }, USR);
    assert.equal(r.success, false);
    assert.match(r.error, /calendar_name/);
  });

  test('update_sprint_calendar rejects immutable fields', async () => {
    queue = [ADMIN];
    const r = await cal.update_sprint_calendar({ calendar_id: 'cal-1', updates: { deleted_at: 'x' } }, USR);
    assert.equal(r.success, false);
    assert.match(r.error, /cannot be updated/);
  });

  test('delete_sprint_calendar blocked while Divisions reference it (AC 15, D-140)', async () => {
    queue = [ADMIN, { count: 2, data: null, error: null }];
    const r = await cal.delete_sprint_calendar({ calendar_id: 'cal-1' }, USR);
    assert.equal(r.success, false);
    // D-140: says what is blocked AND what unblocks it.
    assert.match(r.error, /cannot be deleted/);
    assert.match(r.error, /Reassign/);
  });

  test('delete_sprint_calendar soft-deletes when unreferenced (Arch-6)', async () => {
    queue = [ADMIN, { count: 0, data: null, error: null },
             { data: { id: 'cal-1', deleted_at: '2026-07-15T00:00:00Z' }, error: null }];
    const r = await cal.delete_sprint_calendar({ calendar_id: 'cal-1' }, USR);
    assert.equal(r.success, true);
    assert.ok(updatePayloads[0].deleted_at, 'must soft delete via deleted_at, never DELETE');
  });

  test('list_sprints requires calendar_id', async () => {
    queue = [ADMIN];
    const r = await cal.list_sprints({}, USR);
    assert.equal(r.success, false);
  });
});

// ── upsert_sprints ────────────────────────────────────────────────────────────
describe('upsert_sprints', () => {

  test('rejects duplicate sprint_id within the batch (AC 14 uniqueness)', async () => {
    queue = [ADMIN];
    const r = await cal.upsert_sprints({
      calendar_id: 'cal-1',
      sprints: [
        { sprint_id: '2026.01', start_date: '2025-12-29', end_date: '2026-01-16' },
        { sprint_id: '2026.01', start_date: '2026-01-19', end_date: '2026-02-06' }
      ]
    }, USR);
    assert.equal(r.success, false);
    assert.match(r.error, /unique per calendar/);
  });

  test('rejects end_date <= start_date', async () => {
    queue = [ADMIN];
    const r = await cal.upsert_sprints({
      calendar_id: 'cal-1',
      sprints: [{ sprint_id: '2026.01', start_date: '2026-01-16', end_date: '2026-01-16' }]
    }, USR);
    assert.equal(r.success, false);
    assert.match(r.error, /after start_date/);
  });

  test('adds-only batch commits immediately and returns overlap warnings (warn, not block)', async () => {
    queue = [
      ADMIN,
      { data: { id: 'cal-1' }, error: null },   // calendar exists
      { data: [], error: null },                 // existing sprints
      { data: null, error: null },               // insert row 1
      { data: null, error: null },               // insert row 2
      { data: SPRINTS, error: null }             // after list
    ];
    const r = await cal.upsert_sprints({
      calendar_id: 'cal-1',
      sprints: [
        { sprint_id: '2026.01', start_date: '2025-12-29', end_date: '2026-01-16' },
        { sprint_id: '2026.02', start_date: '2026-01-10', end_date: '2026-02-06' } // overlaps 01
      ]
    }, USR);
    assert.equal(r.success, true);
    assert.equal(r.data.warnings.length, 1);
    assert.match(r.data.warnings[0], /overlaps/);
    assert.equal(insertPayloads.length, 2);
  });

  test('existing-sprint date change returns two-call confirmation with affected count (AC 12, D-183)', async () => {
    queue = [
      ADMIN,
      { data: { id: 'cal-1' }, error: null },
      { data: [{ id: 's10', sprint_id: '2026.10', start_date: '2026-07-06', end_date: '2026-07-24' }], error: null },
      { data: [{ id: 'div-1' }], error: null },  // divisions assigned to cal
      { data: [{ id: 'div-1', parent_division_id: null, sprint_calendar_id: 'cal-1', sprint_calendar_none: false }], error: null }, // all divisions (subtree walk)
      { count: 3, data: null, error: null }      // affected initiative count
    ];
    const r = await cal.upsert_sprints({
      calendar_id: 'cal-1',
      sprints: [{ id: 's10', sprint_id: '2026.10', start_date: '2026-07-07', end_date: '2026-07-24' }]
    }, USR);
    assert.equal(r.success, true);
    assert.equal(r.data.requires_confirmation, true);
    assert.equal(r.data.affected_initiative_count, 3);
    assert.equal(updatePayloads.length, 0, 'pre-flight must not write');
  });
});

// ── Division assignment + effective calendar ─────────────────────────────────
describe('set_division_sprint_calendar', () => {

  test("assignment 'none' sets the opt-out boolean and runs the stale pass, moving no dates (AC 11)", async () => {
    queue = [
      ADMIN,
      { data: { id: 'div-1' }, error: null },  // division exists
      { data: { id: 'div-1', division_name: 'Ortho', sprint_calendar_id: null, sprint_calendar_none: true }, error: null }, // update
      { data: [{ id: 'div-1', parent_division_id: null, sprint_calendar_id: null, sprint_calendar_none: true }], error: null }, // all divisions
      { data: { id: 'div-1', parent_division_id: null, sprint_calendar_id: null, sprint_calendar_none: true }, error: null },   // walk in stale pass
      { data: [], error: null }                 // cycles in division
    ];
    const r = await set_division_sprint_calendar({ division_id: 'div-1', assignment: 'none' }, USR);
    assert.equal(r.success, true);
    assert.deepEqual(updatePayloads[0], { sprint_calendar_id: null, sprint_calendar_none: true });
    // Only the assignment write happened — no target_date writes anywhere.
    assert.equal(updatePayloads.length, 1);
  });

  test('rejects non-admin', async () => {
    queue = [NON_ADMIN];
    const r = await set_division_sprint_calendar({ division_id: 'div-1', assignment: 'inherit' }, USR);
    assert.equal(r.success, false);
    assert.match(r.error, /Admin role/);
  });

  test('rejects unknown calendar id', async () => {
    queue = [ADMIN, { data: { id: 'div-1' }, error: null }, { data: null, error: null }];
    const r = await set_division_sprint_calendar({ division_id: 'div-1', assignment: 'no-such-cal' }, USR);
    assert.equal(r.success, false);
    assert.match(r.error, /not found/);
  });
});

describe('get_effective_sprint_calendar (AC 4)', () => {

  test('walks to the parent when self is null', async () => {
    queue = [
      { data: { id: 'child', parent_division_id: 'root', sprint_calendar_id: null, sprint_calendar_none: false }, error: null },
      { data: { id: 'root', parent_division_id: null, sprint_calendar_id: 'cal-1', sprint_calendar_none: false }, error: null },
      { data: { id: 'cal-1', calendar_name: 'TRIARQ Standard 2026', active_status: true }, error: null },
      { data: SPRINTS, error: null }
    ];
    const r = await get_effective_sprint_calendar({ division_id: 'child' }, USR);
    assert.equal(r.success, true);
    assert.equal(r.data.calendar.calendar_name, 'TRIARQ Standard 2026');
    assert.equal(r.data.sprints.length, 3);
    assert.equal(r.data.source_division_id, 'root');
  });

  test("explicit None truncates the walk — parent's calendar does NOT apply (AC 4)", async () => {
    queue = [
      { data: { id: 'child', parent_division_id: 'root', sprint_calendar_id: null, sprint_calendar_none: true }, error: null }
    ];
    const r = await get_effective_sprint_calendar({ division_id: 'child' }, USR);
    assert.equal(r.success, true);
    assert.equal(r.data.calendar, null);
  });

  test('all-null walk resolves to no calendar', async () => {
    queue = [
      { data: { id: 'child', parent_division_id: 'root', sprint_calendar_id: null, sprint_calendar_none: false }, error: null },
      { data: { id: 'root', parent_division_id: null, sprint_calendar_id: null, sprint_calendar_none: false }, error: null }
    ];
    const r = await get_effective_sprint_calendar({ division_id: 'child' }, USR);
    assert.equal(r.success, true);
    assert.equal(r.data.calendar, null);
  });

  test('requires division_id', async () => {
    const r = await get_effective_sprint_calendar({}, USR);
    assert.equal(r.success, false);
  });
});

// ── set_gate_date_rule ────────────────────────────────────────────────────────
describe('set_gate_date_rule', () => {

  test('sprint mode resolves edge + days and writes date + rule atomically (AC 6)', async () => {
    const milestones = [
      milestone('brief_review', '2026-06-20'),
      milestone('go_to_build', null),
      milestone('go_to_deploy', null),
      milestone('go_to_release', null),
      milestone('close_review', null)
    ];
    queueRulePrefix(milestones);
    queue.push(
      { data: { milestone_id: 'm-go_to_build', target_date: '2026-08-28' }, error: null }, // gate update
      { data: { display_name: 'Phil Dodds' }, error: null },                               // caller
      { data: null, error: null }                                                          // event insert
    );
    const r = await set_gate_date_rule({
      delivery_cycle_id: CYC,
      gate_name: 'go_to_build',
      rule: { date_rule_type: 'sprint', rule_sprint_id: '2026.11', rule_anchor: 'end', rule_day_offset: 14 }
    }, USR);
    assert.equal(r.success, true);
    assert.equal(r.data.resolved_date, '2026-08-28');
    // Single write carries BOTH the canonical resolved date and the rule (D-551).
    assert.equal(updatePayloads[0].target_date, '2026-08-28');
    assert.equal(updatePayloads[0].date_rule_type, 'sprint');
    assert.equal(updatePayloads[0].rule_sprint_id, '2026.11');
    assert.equal(updatePayloads[0].rule_anchor, 'end');
    assert.equal(updatePayloads[0].rule_day_offset, 14);
    assert.equal(updatePayloads[0].rule_stale, false);
    // Event log keeps D-427 metadata keys (slip detection unchanged).
    assert.equal(insertPayloads[0].event_metadata.new_target_date, '2026-08-28');
  });

  test('relative mode anchors to the prior gate TARGET (AC 7)', async () => {
    const milestones = [
      milestone('brief_review', '2026-06-20'),
      milestone('go_to_build', '2026-07-10'),
      milestone('go_to_deploy', null),
      milestone('go_to_release', null),
      milestone('close_review', null)
    ];
    queueRulePrefix(milestones);
    queue.push(
      { data: { milestone_id: 'm-go_to_deploy', target_date: '2026-08-14' }, error: null },
      { data: { display_name: 'Phil Dodds' }, error: null },
      { data: null, error: null }
    );
    const r = await set_gate_date_rule({
      delivery_cycle_id: CYC,
      gate_name: 'go_to_deploy',
      rule: { date_rule_type: 'relative', rule_sprint_count: 1, rule_day_offset: 0 }
    }, USR);
    assert.equal(r.success, true);
    // go_to_build target 2026-07-10 is in 2026.10 → 1 sprint after = 2026.11 end.
    assert.equal(r.data.resolved_date, '2026-08-14');
    assert.equal(updatePayloads[0].date_rule_type, 'relative');
    assert.equal(updatePayloads[0].rule_sprint_count, 1);
  });

  test('relative mode rejected on Brief Review (no prior gate, AC 5)', async () => {
    queueRulePrefix([milestone('brief_review', null)]);
    const r = await set_gate_date_rule({
      delivery_cycle_id: CYC,
      gate_name: 'brief_review',
      rule: { date_rule_type: 'relative', rule_sprint_count: 1 }
    }, USR);
    assert.equal(r.success, false);
    assert.match(r.error, /no prior gate/);
  });

  test('relative mode rejected when prior gate has no target (D-140 message says what unblocks)', async () => {
    const milestones = [
      milestone('brief_review', null),
      milestone('go_to_build', null),
      milestone('go_to_deploy', null)
    ];
    queueRulePrefix(milestones);
    const r = await set_gate_date_rule({
      delivery_cycle_id: CYC,
      gate_name: 'go_to_deploy',
      rule: { date_rule_type: 'relative', rule_sprint_count: 0, rule_day_offset: 7 }
    }, USR);
    assert.equal(r.success, false);
    assert.match(r.error, /Go to Build has no target date/);
    assert.match(r.error, /Set a target/);
  });

  test('sprint/relative rejected when no effective calendar resolves (AC 5)', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, division_id: 'div-1' }, error: null },
      { data: [milestone('go_to_build', null)], error: null },
      { data: { id: 'div-1', parent_division_id: null, sprint_calendar_id: null, sprint_calendar_none: true }, error: null }
    ];
    const r = await set_gate_date_rule({
      delivery_cycle_id: CYC,
      gate_name: 'go_to_build',
      rule: { date_rule_type: 'sprint', rule_sprint_id: '2026.10', rule_anchor: 'start' }
    }, USR);
    assert.equal(r.success, false);
    assert.match(r.error, /No effective Sprint Calendar/);
  });

  test('cascading save pre-flights: returns shift list, writes nothing (AC 8)', async () => {
    const milestones = [
      milestone('brief_review', '2026-06-20'),
      milestone('go_to_build', '2026-07-10'),
      milestone('go_to_deploy', '2026-07-17', { date_rule_type: 'relative', rule_sprint_count: 0, rule_day_offset: 7 }),
      milestone('go_to_release', null),
      milestone('close_review', null)
    ];
    queueRulePrefix(milestones);
    const r = await set_gate_date_rule({
      delivery_cycle_id: CYC,
      gate_name: 'go_to_build',
      rule: { date_rule_type: 'manual', target_date: '2026-07-15' }
    }, USR);
    assert.equal(r.success, true);
    assert.equal(r.data.requires_confirmation, true);
    assert.deepEqual(r.data.shifts[0], {
      gate_name: 'go_to_deploy',
      old_target_date: '2026-07-17',
      new_target_date: '2026-07-22',
      gate_label: 'Go to Deploy'
    });
    assert.equal(updatePayloads.length, 0, 'pre-flight must not write');
    assert.equal(insertPayloads.length, 0, 'pre-flight must not log events');
  });

  test('confirmed cascading save writes gate + shifted gates + events (AC 8, AC 10)', async () => {
    const milestones = [
      milestone('brief_review', '2026-06-20'),
      milestone('go_to_build', '2026-07-10', { date_rule_type: 'sprint', rule_sprint_id: '2026.10', rule_anchor: 'end', rule_day_offset: 0 }),
      milestone('go_to_deploy', '2026-07-17', { date_rule_type: 'relative', rule_sprint_count: 0, rule_day_offset: 7 }),
      milestone('go_to_release', null),
      milestone('close_review', null)
    ];
    queueRulePrefix(milestones);
    queue.push(
      { data: { milestone_id: 'm-go_to_build', target_date: '2026-07-15' }, error: null }, // gate update
      { data: null, error: null },                                                        // shift update
      { data: { display_name: 'Phil Dodds' }, error: null },                              // caller
      { data: null, error: null },                                                        // event: gate
      { data: null, error: null }                                                         // event: cascade
    );
    const r = await set_gate_date_rule({
      delivery_cycle_id: CYC,
      gate_name: 'go_to_build',
      rule: { date_rule_type: 'manual', target_date: '2026-07-15' },
      confirmed: true
    }, USR);
    assert.equal(r.success, true);
    // §6.4: direct date edit on a ruled gate converts to manual, rule cleared…
    assert.equal(updatePayloads[0].date_rule_type, 'manual');
    assert.equal(updatePayloads[0].rule_sprint_id, null);
    // …and downstream still cascades.
    assert.equal(updatePayloads[1].target_date, '2026-07-22');
    // Cascade event carries the D-427 keys + provenance.
    const cascadeEvent = insertPayloads.find(p => p.event_metadata?.cascaded_from);
    assert.equal(cascadeEvent.event_metadata.gate_name, 'go_to_deploy');
    assert.equal(cascadeEvent.event_metadata.old_target_date, '2026-07-17');
    assert.equal(cascadeEvent.event_metadata.new_target_date, '2026-07-22');
  });

  test('manual null clears the date AND the rule (D-501 extension)', async () => {
    const milestones = [
      milestone('brief_review', null),
      milestone('go_to_build', '2026-08-28', { date_rule_type: 'sprint', rule_sprint_id: '2026.11', rule_anchor: 'end', rule_day_offset: 14 }),
      milestone('go_to_deploy', null),
      milestone('go_to_release', null),
      milestone('close_review', null)
    ];
    queueRulePrefix(milestones);
    queue.push(
      { data: { milestone_id: 'm-go_to_build', target_date: null }, error: null },
      { data: { display_name: 'Phil Dodds' }, error: null },
      { data: null, error: null }
    );
    const r = await set_gate_date_rule({
      delivery_cycle_id: CYC,
      gate_name: 'go_to_build',
      rule: { date_rule_type: 'manual', target_date: null }
    }, USR);
    assert.equal(r.success, true);
    assert.equal(updatePayloads[0].target_date, null);
    assert.equal(updatePayloads[0].date_rule_type, 'manual');
    assert.equal(updatePayloads[0].rule_sprint_id, null);
    assert.equal(updatePayloads[0].rule_day_offset, null);
  });

  test('invalid rule type rejected', async () => {
    const r = await set_gate_date_rule({
      delivery_cycle_id: CYC, gate_name: 'go_to_build',
      rule: { date_rule_type: 'lunar' }
    }, USR);
    assert.equal(r.success, false);
    assert.match(r.error, /date_rule_type/);
  });
});

// ── set_milestone_target_date rule-clearing (§6.4 legacy path) ───────────────
describe('set_milestone_target_date clears rule metadata (Contract 37)', () => {

  test('direct write through the legacy tool resets the rule to manual', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, current_lifecycle_stage: 'BUILD' }, error: null },
      { data: { milestone_id: 'm1', date_status: 'on_track', actual_date: null, target_date: '2026-07-01' }, error: null },
      { data: { milestone_id: 'm1', target_date: '2026-07-20' }, error: null },
      { data: { display_name: 'Phil Dodds' }, error: null },
      { data: null, error: null }
    ];
    const r = await set_milestone_target_date(
      { delivery_cycle_id: CYC, gate_name: 'go_to_build', target_date: '2026-07-20' }, USR);
    assert.equal(r.success, true);
    assert.equal(updatePayloads[0].date_rule_type, 'manual');
    assert.equal(updatePayloads[0].rule_sprint_id, null);
    assert.equal(updatePayloads[0].rule_stale, false);
  });
});
