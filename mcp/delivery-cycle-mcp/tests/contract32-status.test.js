// contract32-status.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 32 WS2, D-476–D-486).
// AMENDED Contract 36 (D-501–D-515): open authorship (D-506), supersede-edit
// chains (D-507), 3-day recency window (D-508), dashboard D-510 shape, and the
// missing-target-date review reason. Tests assert the Contract 36 contract.
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
    assert.deepEqual(labels, ['Gate Date Moved +19 days']);   // CC-38-44: aggregated push-out
  });

  test('computeSlippedGateLabels: no interval → no query, empty', async () => {
    const labels = await nr.computeSlippedGateLabels(chain, CYC, null);
    assert.deepEqual(labels, []);
  });

  // D-482 final (2026-07-14, migration 064): the status_overdue FLAG is the
  // single signal — true iff the chain root predates the most recently opened
  // prep window. The lib surfaces it verbatim; the window math lives in pg.
  test('computeNeedsReviewReasons: escalation + overdue flag + at-risk milestone', async () => {
    queue = [
      { data: null, error: null }                       // rpc → no cadence config (slip skipped)
    ];
    const reasons = await nr.computeNeedsReviewReasons(
      chain,
      { delivery_cycle_id: CYC, division_id: 'div', status_overdue: true },
      { escalation_needed: true, pilot_confidence_applicable: false, close_confidence_applicable: false },
      [{ gate_name: 'go_to_build', date_status: 'behind' }]
    );
    assert.ok(reasons.includes('Escalation'));
    assert.ok(reasons.includes('Status Update Overdue'));
    assert.ok(reasons.includes('At Risk'));
  });

  test('computeNeedsReviewReasons: flag false → no status reason', async () => {
    queue = [ { data: null, error: null } ];
    const reasons = await nr.computeNeedsReviewReasons(
      chain,
      { delivery_cycle_id: CYC, division_id: 'div', status_overdue: false },
      { escalation_needed: false, pilot_confidence_applicable: false, close_confidence_applicable: false },
      []
    );
    assert.ok(!reasons.some(r => /overdue/i.test(r)));
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

  // D-506: trio membership no longer gates authorship — visibility does.
  test('error — caller without Division visibility (D-506)', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, division_id: 'div', current_lifecycle_stage: 'BUILD',
                assigned_dol_user_id: DOL, assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO,
                latest_status_update_id: null, status_overdue: false }, error: null },  // cycle
      { data: { is_admin: false }, error: null },                                        // caller
      { data: null, error: null }                                                        // membership → none
    ];
    const r = await save_initiative_status_update({ initiative_id: CYC, escalation_needed: false }, OUT);
    assert.equal(r.success, false);
    assert.ok(/visibility/.test(r.error));
  });

  test('happy — trio author saves row, links Initiative (no confidence)', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, division_id: 'div', current_lifecycle_stage: 'BUILD',
                assigned_dol_user_id: DOL, assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO,
                latest_status_update_id: null, status_overdue: false }, error: null },  // cycle
      { data: { is_admin: false }, error: null },                                        // caller (trio → no membership query)
      { data: [{ gate_name: 'go_to_deploy', date_status: 'on_track' },
               { gate_name: 'close_review', date_status: 'not_started' }], error: null }, // milestones
      { data: [{ gate_name: 'brief_review', gate_status: 'approved' },
               { gate_name: 'go_to_build', gate_status: 'awaiting_approval' }], error: null }, // gate_records (CC-38-30 snapshot)
      { data: { id: UPD, saved_at: '2026-06-30T12:00:00Z' }, error: null },              // insert
      { data: [], error: null }                                                          // cycle update
    ];
    const r = await save_initiative_status_update(
      { initiative_id: CYC, escalation_needed: true, accomplished_last_cycle: 'shipped X' }, DOL);
    assert.equal(r.success, true);
    assert.equal(r.data.status_update_id, UPD);
    assert.equal(r.data.is_edit, false);
    assert.equal(r.data.is_trio_author, true);
  });

  // D-507: edit = supersede row; overdue closes the edit window.
  test('edit happy — supersede row within window (D-507)', async () => {
    const recent = new Date().toISOString();
    queue = [
      { data: { delivery_cycle_id: CYC, division_id: 'div', current_lifecycle_stage: 'BUILD',
                assigned_dol_user_id: DOL, assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO,
                latest_status_update_id: UPD, status_overdue: false }, error: null },    // cycle
      { data: { is_admin: false }, error: null },                                        // caller
      { data: [{ id: UPD, supersedes_update_id: null, saved_at: recent }], error: null }, // chain root walk
      { data: { id: UPD, saved_by: DOL }, error: null },                                 // edit target
      { data: [{ gate_name: 'go_to_deploy', date_status: 'on_track' }], error: null },   // milestones
      { data: [{ gate_name: 'brief_review', gate_status: 'approved' }], error: null },   // gate_records (CC-38-30 snapshot)
      { data: { id: 'update-2', saved_at: recent }, error: null },                       // insert
      { data: [], error: null }                                                          // cycle update (head only)
    ];
    const r = await save_initiative_status_update(
      { initiative_id: CYC, escalation_needed: false, supersedes_update_id: UPD }, DOL);
    assert.equal(r.success, true);
    assert.equal(r.data.is_edit, true);
  });

  test('edit rejected — initiative status_overdue closes the window (D-507)', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, division_id: 'div', current_lifecycle_stage: 'BUILD',
                assigned_dol_user_id: DOL, assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO,
                latest_status_update_id: UPD, status_overdue: true }, error: null },     // cycle
      { data: { is_admin: false }, error: null }                                         // caller
    ];
    const r = await save_initiative_status_update(
      { initiative_id: CYC, escalation_needed: false, supersedes_update_id: UPD }, DOL);
    assert.equal(r.success, false);
    assert.ok(/overdue/.test(r.error));
  });
});

// ── get_latest_initiative_status (D-485) ──────────────────────────────────────
describe('get_latest_initiative_status', () => {

  test('error — initiative_id required', async () => {
    const r = await get_latest_initiative_status({}, DOL);
    assert.equal(r.success, false);
  });

  // Contract 36: non-trio author → chips for ALL trio members (D-506/D-513);
  // chain context (D-507); missing-target-date review reason.
  test('happy — non-trio author: chain, all-trio chips, needs review', async () => {
    const recent = new Date().toISOString();
    queue = [
      { data: { delivery_cycle_id: CYC, division_id: 'div', status_overdue: false,
                latest_status_update_id: UPD,
                assigned_dol_user_id: DOL, assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO }, error: null }, // cycle
      { data: { id: UPD, saved_by: OUT, supersedes_update_id: null, saved_at: recent, escalation_needed: true,
                pilot_confidence_applicable: false, close_confidence_applicable: false }, error: null },          // latest
      { data: [{ id: DOL, display_name: 'Dana' }, { id: DCS, display_name: 'Sam' },
               { id: EPO, display_name: 'Eli' }, { id: OUT, display_name: 'Oz' }], error: null },                 // users
      { data: [{ id: UPD, supersedes_update_id: null, saved_at: recent }], error: null },                        // chain root walk
      { data: [{ status_update_id: UPD, acknowledged_by: DCS, acknowledged_at: '2026-06-30T13:00:00Z' }], error: null }, // acks
      { data: [{ gate_name: 'go_to_build', date_status: 'on_track', target_date: null }], error: null }          // milestones
    ]; // trailing rpc calls (cadence ×2) fall through to the null fallback
    const r = await get_latest_initiative_status({ initiative_id: CYC }, DCS);
    assert.equal(r.success, true);
    assert.equal(r.data.saved_by_name, 'Oz');
    assert.equal(r.data.is_trio_author, false);
    assert.equal(r.data.chain.is_edited, false);
    assert.equal(r.data.chain.edit_window_open, true);
    // D-513: one chip per trio member — author is non-trio, so nobody is excluded.
    assert.equal(r.data.acknowledgments.length, 3);
    const dcs = r.data.acknowledgments.find(a => a.user_id === DCS);
    const dol = r.data.acknowledgments.find(a => a.user_id === DOL);
    assert.equal(dcs.acknowledged, true);
    assert.equal(dol.acknowledged, false);
    assert.ok(r.data.needs_review_reasons.includes('Escalation'));
    // Contract 36 UAT addition: next gate without a target date needs review.
    assert.ok(r.data.needs_review_reasons.includes('Missing Target Date'));
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
      { data: [], error: null },                                                             // Contract 40 WS4/WS6: gate_records (no awaiting → no waiting-on sub-queries)
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

  // Contract 36 (D-506/D-508): non-trio-authored head, chain root within the
  // 3-day window, caller not yet acked.
  test('happy — non-trio author within 3d window, not acked', async () => {
    const recent = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 1 day ago
    queue = [
      { data: [{ delivery_cycle_id: CYC, cycle_title: 'Alpha', division_id: 'div', latest_status_update_id: UPD,
                 assigned_dol_user_id: DOL, assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO }], error: null }, // cycles
      { data: [{ id: UPD, saved_by: OUT, saved_at: recent, supersedes_update_id: null }], error: null }, // updates
      { data: [{ id: UPD, supersedes_update_id: null, saved_at: recent }], error: null },                // chain roots
      { data: [], error: null },                                                  // caller acks (none)
      { data: [{ id: 'div', division_name: 'Cardiology' }], error: null },        // divisions
      { data: [{ id: OUT, display_name: 'Oz' }], error: null }                    // saver names
    ];
    const r = await get_my_acknowledgments_due({}, DCS);
    assert.equal(r.success, true);
    assert.equal(r.data.length, 1);
    assert.equal(r.data[0].saved_by_name, 'Oz');
    assert.equal(r.data[0].status_update_id, UPD);
  });

  test('trio-authored head generates no invitation (D-506)', async () => {
    const recent = new Date().toISOString();
    queue = [
      { data: [{ delivery_cycle_id: CYC, cycle_title: 'Alpha', division_id: 'div', latest_status_update_id: UPD,
                 assigned_dol_user_id: DOL, assigned_dcs_user_id: DCS, assigned_epo_user_id: EPO }], error: null },
      { data: [{ id: UPD, saved_by: DOL, saved_at: recent, supersedes_update_id: null }], error: null },
      { data: [{ id: UPD, supersedes_update_id: null, saved_at: recent }], error: null },
      { data: [], error: null }
    ];
    const r = await get_my_acknowledgments_due({}, DCS);
    assert.equal(r.success, true);
    assert.equal(r.data.length, 0);
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

  // Contract 36 (D-510): short division name, canonical Next Gate label (never
  // milestone_label), pending-approval flag, trio-author flag, chain-root age.
  test('happy — admin scope, D-510 row shape with needs review', async () => {
    queue = [
      { data: { is_admin: true }, error: null },                                  // caller (privileged)
      { data: [{ delivery_cycle_id: CYC, cycle_title: 'Alpha', division_id: 'div', current_lifecycle_stage: 'BUILD',
                 status_overdue: true, latest_status_update_id: UPD,
                 assigned_dol_user_id: DOL, assigned_dcs_user_id: null, assigned_epo_user_id: null }, ], error: null }, // cycles
      { data: [{ id: 'div', division_name: 'Cardiology', display_name_short: 'Cardio' }], error: null }, // divisions
      { data: [{ id: UPD, saved_by: DOL, escalation_needed: true, pilot_confidence: null, close_confidence: null, pilot_confidence_applicable: false, close_confidence_applicable: false, saved_at: '2026-06-20T00:00:00Z' }], error: null }, // updates
      { data: [{ id: UPD, supersedes_update_id: null, saved_at: '2026-06-20T00:00:00Z' }], error: null }, // chain roots
      { data: [{ id: DOL, display_name: 'Dana' }], error: null },                 // author + team names
      { data: [{ delivery_cycle_id: CYC, gate_name: 'go_to_build', date_status: 'on_track', milestone_label: 'Build Start', target_date: null }], error: null }, // milestones
      { data: [{ delivery_cycle_id: CYC, gate_name: 'go_to_build', gate_status: 'awaiting_approval' }], error: null } // gate_records
    ]; // needs-review cadence rpc falls through to the null fallback
    const r = await get_initiative_status_dashboard({}, DOL);
    assert.equal(r.success, true);
    assert.equal(r.data[0].division_display_name_short, 'Cardio');
    assert.equal(r.data[0].saved_by_name, 'Dana');
    assert.equal(r.data[0].is_trio_author, true);
    assert.equal(r.data[0].root_saved_at, '2026-06-20T00:00:00Z');
    // Canonical gate name — 'Build Start' (milestone_label) must never surface.
    assert.equal(r.data[0].next_gate_label, 'Go to Build');
    assert.equal(r.data[0].next_gate_pending_approval, true);
    assert.ok(r.data[0].needs_review_reasons.includes('Escalation'));
    assert.ok(r.data[0].needs_review_reasons.includes('Status Update Overdue'));
    assert.ok(r.data[0].needs_review_reasons.includes('Missing Target Date'));
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
