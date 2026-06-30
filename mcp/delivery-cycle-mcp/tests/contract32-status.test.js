// contract32-status.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 32 WS2, D-476–D-486).
// Coverage for the needs-review helper + the four Initiative Status tools.
// Supabase singleton mocked via require.cache injection (FIFO response queue),
// same technique as the division-mcp contract32 suite. DB-heavy confidence
// write-through happy path is verified via UAT (cross-tool chain).

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
  rpc:    async () => nextResp({ data: null, error: null }),
  single:      async () => nextResp({ data: null, error: { message: 'no mock response' } }),
  maybeSingle: async () => nextResp({ data: null, error: null }),
  then: (resolve) => Promise.resolve(nextResp({ data: [], error: null })).then(resolve)
};

const dbPath = require.resolve('../src/db');
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true, exports: { supabase: chain }
};

const nr = require('../src/lib/needs-review');
const { save_initiative_status_update } = require('../src/tools/save_initiative_status_update');
const { get_latest_initiative_status }  = require('../src/tools/get_latest_initiative_status');
const { get_initiative_status_history } = require('../src/tools/get_initiative_status_history');
const { acknowledge_status_update }     = require('../src/tools/acknowledge_status_update');
const { get_my_status_due }             = require('../src/tools/get_my_status_due');
const { get_my_acknowledgments_due }    = require('../src/tools/get_my_acknowledgments_due');
const { get_initiative_status_dashboard } = require('../src/tools/get_initiative_status_dashboard');
const { trigger_status_refresh }        = require('../src/tools/trigger_status_refresh');
const { get_status_refresh_last_run }   = require('../src/tools/get_status_refresh_last_run');

const DOL = 'dol-uuid', DCS = 'dcs-uuid', EPO = 'epo-uuid', OUT = 'outsider-uuid';
const CYC = 'cycle-uuid', UPD = 'update-uuid';

beforeEach(() => { queue = []; });

// ── needs-review helper (D-485, D-486) ────────────────────────────────────────
describe('needs-review helper', () => {

  test('resolveCadenceIntervalDays maps cadence → days', async () => {
    queue = [{ data: { cadence: 'triweekly' }, error: null }];
    assert.equal(await nr.resolveCadenceIntervalDays(chain, 'div'), 21);
  });

  test('resolveCadenceIntervalDays returns null when no config', async () => {
    queue = [{ data: null, error: null }];
    assert.equal(await nr.resolveCadenceIntervalDays(chain, 'div'), null);
  });

  test('computeSlippedGateLabels: push-out within window flagged, null-old ignored', async () => {
    queue = [{ data: [
      { event_metadata: { gate_name: 'go_to_deploy', old_target_date: '2026-06-01', new_target_date: '2026-06-20' }, created_at: new Date().toISOString() },
      { event_metadata: { gate_name: 'close_review', old_target_date: null, new_target_date: '2026-07-01' }, created_at: new Date().toISOString() }
    ], error: null }];
    const labels = await nr.computeSlippedGateLabels(chain, CYC, 7);
    assert.deepEqual(labels, ['Go to Deploy']);
  });

  test('computeSlippedGateLabels: no interval → no query, empty', async () => {
    const labels = await nr.computeSlippedGateLabels(chain, CYC, null);
    assert.deepEqual(labels, []);
  });

  test('computeNeedsReviewReasons: escalation + overdue + at-risk milestone', async () => {
    queue = [
      { data: null, error: null }                       // rpc → no cadence config (slip skipped)
    ];
    const reasons = await nr.computeNeedsReviewReasons(
      chain,
      { delivery_cycle_id: CYC, division_id: 'div', status_overdue: true },
      { escalation_needed: true, pilot_confidence_applicable: false, close_confidence_applicable: false },
      [{ gate_name: 'go_to_build', date_status: 'behind' }]
    );
    assert.ok(reasons.includes('Escalation flagged'));
    assert.ok(reasons.includes('Status overdue'));
    assert.ok(reasons.includes('At risk: Go to Build'));
  });
});

// ── save_initiative_status_update (D-476–D-479) ───────────────────────────────
describe('save_initiative_status_update', () => {

  test('error — initiative_id required', async () => {
    const r = await save_initiative_status_update({ escalation_needed: false }, DOL);
    assert.equal(r.success, false);
  });

  test('error — invalid confidence value', async () => {
    const r = await save_initiative_status_update(
      { initiative_id: CYC, escalation_needed: false, pilot_confidence: 'great' }, DOL);
    assert.equal(r.success, false);
    assert.ok(/pilot_confidence must be one of/.test(r.error));
  });

  test('error — caller not on trio (403 semantics)', async () => {
    queue = [{ data: {
      delivery_cycle_id: CYC, current_lifecycle_stage: 'BUILD',
      assigned_dol_user_id: DOL, assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO
    }, error: null }];
    const r = await save_initiative_status_update({ initiative_id: CYC, escalation_needed: false }, OUT);
    assert.equal(r.success, false);
    assert.ok(/DOL, DCS, or EPO/.test(r.error));
  });

  test('happy — saves row, links Initiative (no confidence)', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, current_lifecycle_stage: 'BUILD',
                assigned_dol_user_id: DOL, assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO }, error: null }, // cycle
      { data: [{ gate_name: 'go_to_deploy', date_status: 'on_track' },
               { gate_name: 'close_review', date_status: 'not_started' }], error: null },                         // milestones
      { data: { id: UPD, saved_at: '2026-06-30T12:00:00Z' }, error: null },                                       // insert
      { data: [], error: null }                                                                                   // cycle update
    ];
    const r = await save_initiative_status_update(
      { initiative_id: CYC, escalation_needed: true, accomplished_last_cycle: 'shipped X' }, DOL);
    assert.equal(r.success, true);
    assert.equal(r.data.status_update_id, UPD);
  });
});

// ── get_latest_initiative_status (D-485) ──────────────────────────────────────
describe('get_latest_initiative_status', () => {

  test('error — initiative_id required', async () => {
    const r = await get_latest_initiative_status({}, DOL);
    assert.equal(r.success, false);
  });

  test('happy — latest + acknowledgments + needs review', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, division_id: 'div', status_overdue: true,
                latest_status_update_id: UPD,
                assigned_dol_user_id: DOL, assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO }, error: null }, // cycle
      { data: { id: UPD, saved_by: DOL, escalation_needed: true,
                pilot_confidence_applicable: false, close_confidence_applicable: false }, error: null },          // latest
      { data: [{ id: DOL, display_name: 'Dana' }, { id: DCS, display_name: 'Sam' }, { id: EPO, display_name: 'Eli' }], error: null }, // users
      { data: [{ acknowledged_by: DCS, acknowledged_at: '2026-06-30T13:00:00Z' }], error: null },                // acks
      { data: [{ gate_name: 'go_to_build', date_status: 'on_track' }], error: null },                            // milestones
      { data: null, error: null }                                                                                 // rpc (no cadence → slip skipped)
    ];
    const r = await get_latest_initiative_status({ initiative_id: CYC }, DCS);
    assert.equal(r.success, true);
    assert.equal(r.data.saved_by_name, 'Dana');
    // DCS acknowledged; EPO pending; DOL (save user) excluded.
    const dcs = r.data.acknowledgments.find(a => a.user_id === DCS);
    const epo = r.data.acknowledgments.find(a => a.user_id === EPO);
    assert.equal(dcs.acknowledged, true);
    assert.equal(epo.acknowledged, false);
    assert.ok(!r.data.acknowledgments.find(a => a.user_id === DOL));
    assert.ok(r.data.needs_review_reasons.includes('Escalation flagged'));
    assert.ok(r.data.needs_review_reasons.includes('Status overdue'));
  });
});

// ── get_initiative_status_history (D-483) ─────────────────────────────────────
describe('get_initiative_status_history', () => {

  test('error — initiative_id required', async () => {
    const r = await get_initiative_status_history({}, DOL);
    assert.equal(r.success, false);
  });

  test('happy — reverse-chron with acknowledgment lists', async () => {
    queue = [
      { data: [{ id: UPD, saved_by: DOL, saved_at: '2026-06-30T12:00:00Z' }], error: null }, // updates
      { data: [{ status_update_id: UPD, acknowledged_by: DCS, acknowledged_at: '2026-06-30T13:00:00Z' }], error: null }, // acks
      { data: [{ id: DOL, display_name: 'Dana' }, { id: DCS, display_name: 'Sam' }], error: null } // users
    ];
    const r = await get_initiative_status_history({ initiative_id: CYC }, DOL);
    assert.equal(r.success, true);
    assert.equal(r.data[0].saved_by_name, 'Dana');
    assert.equal(r.data[0].acknowledged_by[0].display_name, 'Sam');
  });
});

// ── acknowledge_status_update (D-483) ─────────────────────────────────────────
describe('acknowledge_status_update', () => {

  test('error — status_update_id required', async () => {
    const r = await acknowledge_status_update({}, DCS);
    assert.equal(r.success, false);
  });

  test('error — save user cannot acknowledge own update', async () => {
    queue = [{ data: { id: UPD, initiative_id: CYC, saved_by: DOL }, error: null }];
    const r = await acknowledge_status_update({ status_update_id: UPD }, DOL);
    assert.equal(r.success, false);
    assert.ok(/cannot acknowledge a status update you authored/.test(r.error));
  });

  test('error — already acknowledged (409 semantics)', async () => {
    queue = [
      { data: { id: UPD, initiative_id: CYC, saved_by: DOL }, error: null },                       // update
      { data: { assigned_dol_user_id: DOL, assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO }, error: null }, // cycle
      { data: [{ id: 'ack-1' }], error: null }                                                      // existing ack
    ];
    const r = await acknowledge_status_update({ status_update_id: UPD }, DCS);
    assert.equal(r.success, false);
    assert.ok(/already acknowledged/.test(r.error));
  });

  test('happy — non-save trio member acknowledges', async () => {
    queue = [
      { data: { id: UPD, initiative_id: CYC, saved_by: DOL }, error: null },                       // update
      { data: { assigned_dol_user_id: DOL, assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO }, error: null }, // cycle
      { data: [], error: null },                                                                    // no existing ack
      { data: { id: 'ack-1', acknowledged_at: '2026-06-30T14:00:00Z' }, error: null }               // insert
    ];
    const r = await acknowledge_status_update({ status_update_id: UPD }, DCS);
    assert.equal(r.success, true);
    assert.equal(r.data.acknowledgment_id, 'ack-1');
  });
});

// ── trigger_status_refresh (D-482) ────────────────────────────────────────────
describe('trigger_status_refresh', () => {

  test('happy — invokes function, returns count + last_run', async () => {
    queue = [
      { data: 5, error: null },                                          // rpc count
      { data: { status_refresh_last_run: '2026-06-30T15:00:00Z' }, error: null } // system_config
    ];
    const r = await trigger_status_refresh({}, DOL);
    assert.equal(r.success, true);
    assert.equal(r.data.initiatives_processed, 5);
    assert.equal(r.data.last_run, '2026-06-30T15:00:00Z');
  });

  test('error — rpc failure surfaces', async () => {
    queue = [{ data: null, error: { message: 'cron unavailable' } }];
    const r = await trigger_status_refresh({}, DOL);
    assert.equal(r.success, false);
    assert.ok(/Status refresh failed/.test(r.error));
  });
});

// ── get_status_refresh_last_run (D-484) ───────────────────────────────────────
describe('get_status_refresh_last_run', () => {

  test('happy — returns last_run timestamp', async () => {
    queue = [{ data: { status_refresh_last_run: '2026-06-30T15:00:00Z' }, error: null }];
    const r = await get_status_refresh_last_run({}, DOL);
    assert.equal(r.success, true);
    assert.equal(r.data.last_run, '2026-06-30T15:00:00Z');
  });

  test('error — read failure surfaces', async () => {
    queue = [{ data: null, error: { message: 'no config' } }];
    const r = await get_status_refresh_last_run({}, DOL);
    assert.equal(r.success, false);
  });
});

// ── get_my_status_due (D-484) ─────────────────────────────────────────────────
describe('get_my_status_due', () => {

  test('happy — overdue Initiatives with cadence + last saved', async () => {
    queue = [
      { data: [{ delivery_cycle_id: CYC, cycle_title: 'Alpha', division_id: 'div', status_due_at: '2026-07-01T00:00:00Z', latest_status_update_id: UPD }], error: null }, // cycles
      { data: [{ id: 'div', division_name: 'Cardiology' }], error: null },                 // divisions
      { data: { cadence: 'weekly' }, error: null },                                          // rpc cadence
      { data: [{ id: UPD, saved_at: '2026-06-20T00:00:00Z' }], error: null }                 // updates
    ];
    const r = await get_my_status_due({}, DOL);
    assert.equal(r.success, true);
    assert.equal(r.data[0].division_name, 'Cardiology');
    assert.equal(r.data[0].cadence, 'Weekly');
    assert.equal(r.data[0].last_saved_at, '2026-06-20T00:00:00Z');
  });

  test('error — query failure surfaces', async () => {
    queue = [{ data: null, error: { message: 'db down' } }];
    const r = await get_my_status_due({}, DOL);
    assert.equal(r.success, false);
  });
});

// ── get_my_acknowledgments_due (D-484) ────────────────────────────────────────
describe('get_my_acknowledgments_due', () => {

  test('happy — within 5d, not save user, not acked', async () => {
    const recent = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 1 day ago
    queue = [
      { data: [{ delivery_cycle_id: CYC, cycle_title: 'Alpha', division_id: 'div', latest_status_update_id: UPD }], error: null }, // cycles
      { data: [{ id: UPD, saved_by: DOL, saved_at: recent }], error: null },     // updates
      { data: [], error: null },                                                  // caller acks (none)
      { data: [{ id: 'div', division_name: 'Cardiology' }], error: null },        // divisions
      { data: [{ id: DOL, display_name: 'Dana' }], error: null }                  // saver names
    ];
    const r = await get_my_acknowledgments_due({}, DCS);
    assert.equal(r.success, true);
    assert.equal(r.data.length, 1);
    assert.equal(r.data[0].saved_by_name, 'Dana');
    assert.equal(r.data[0].status_update_id, UPD);
  });

  test('filters out the save user own update', async () => {
    const recent = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    queue = [
      { data: [{ delivery_cycle_id: CYC, cycle_title: 'Alpha', division_id: 'div', latest_status_update_id: UPD }], error: null },
      { data: [{ id: UPD, saved_by: DCS, saved_at: recent }], error: null }, // caller IS the saver
      { data: [], error: null }
    ];
    const r = await get_my_acknowledgments_due({}, DCS);
    assert.equal(r.success, true);
    assert.equal(r.data.length, 0);
  });
});

// ── get_initiative_status_dashboard (D-485) ───────────────────────────────────
describe('get_initiative_status_dashboard', () => {

  test('happy — admin scope, rows with needs review', async () => {
    queue = [
      { data: { is_admin: true }, error: null },                                  // caller (privileged)
      { data: [{ delivery_cycle_id: CYC, cycle_title: 'Alpha', division_id: 'div', current_lifecycle_stage: 'BUILD', status_overdue: true, latest_status_update_id: UPD }], error: null }, // cycles
      { data: [{ id: 'div', division_name: 'Cardiology' }], error: null },        // divisions
      { data: [{ id: UPD, saved_by: DOL, escalation_needed: true, pilot_confidence: null, close_confidence: null, pilot_confidence_applicable: false, close_confidence_applicable: false, saved_at: '2026-06-20T00:00:00Z' }], error: null }, // updates
      { data: [{ id: DOL, display_name: 'Dana' }], error: null },                 // saver names
      { data: [{ delivery_cycle_id: CYC, gate_name: 'go_to_build', date_status: 'on_track' }], error: null }, // milestones
      { data: null, error: null }                                                  // rpc (no cadence → slip skipped)
    ];
    const r = await get_initiative_status_dashboard({}, DOL);
    assert.equal(r.success, true);
    assert.equal(r.data[0].division_name, 'Cardiology');
    assert.equal(r.data[0].saved_by_name, 'Dana');
    assert.ok(r.data[0].needs_review_reasons.includes('Escalation flagged'));
    assert.ok(r.data[0].needs_review_reasons.includes('Status overdue'));
  });

  test('non-admin with no memberships returns empty', async () => {
    queue = [
      { data: { is_admin: false }, error: null }, // caller
      { data: [], error: null }                    // memberships (none)
    ];
    const r = await get_initiative_status_dashboard({}, OUT);
    assert.equal(r.success, true);
    assert.deepEqual(r.data, []);
  });
});
