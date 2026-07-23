// contractG1-governance.test.js
// Pathways OI Trust — delivery-cycle-mcp (Contract G1, D-555–D-569).
// Governance redesign schema foundation: sizing + derivation (D-558),
// governance level + trust + oversight (D-559/D-561/D-562), participation
// (D-563/D-564), gate events (D-557/D-565/D-569).
// Supabase singleton mocked via require.cache injection (FIFO response queue),
// same technique as contract32-status.test.js. Derivation test table 4.1 is
// asserted in full (AC #3). Migration-level constraints (CHECKs, RLS) are
// verified by Phil executing migrations 080–083 — not testable here.

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

const {
  deriveBaselineLevel,
  buildDerivationExplanation,
  computeSizingAlerts
} = require('../src/lib/governance-derivation');
const { isBoardTriggeredGate } = require('../src/tools/helpers/board-trigger');
const sizingTools    = require('../src/tools/initiative_sizing');
const levelTools     = require('../src/tools/governance_level');
const partTools      = require('../src/tools/participation');
const groupTools     = require('../src/tools/specialty_groups');
const ddcTools       = require('../src/tools/division_default_consulteds');
const threadTools    = require('../src/tools/gate_thread');
const conditionTools = require('../src/tools/gate_conditions');
const approvalTools  = require('../src/tools/gate_approvals');
const { assign_roles_to_cycle } = require('../src/tools/assign_roles_to_cycle');
const { update_delivery_cycle } = require('../src/tools/update_delivery_cycle');

const CALLER = 'caller-uuid', OTHER = 'other-uuid', CYC = 'cycle-uuid', GATE = 'gate-uuid';

beforeEach(() => { queue = []; });

function sizingRow(q1, q2, q3, extra = {}) {
  return {
    delivery_cycle_id: CYC,
    q1_investment: q1, q2_novelty: q2, q3_wrongness: q3,
    q4_security_impact: false, q5_ux: 'standard',
    ...extra
  };
}

// ── deriveBaselineLevel — derivation test table 4.1, all 12 rows (AC #3) ─────
describe('deriveBaselineLevel — spec table 4.1', () => {
  const table = [
    // [q1, q2, q3, trusted, expected]
    ['small',  'standard', 'contained',   true,  1],
    ['small',  'standard', 'contained',   false, 2],
    ['medium', 'standard', 'contained',   true,  2],
    ['large',  'standard', 'contained',   false, 2],
    ['xlarge', 'standard', 'contained',   true,  3],
    ['small',  'major',    'contained',   true,  2],
    ['small',  'major',    'contained',   false, 2],
    ['small',  'standard', 'significant', true,  2],
    ['small',  'standard', 'large_hard',  true,  3],
    ['xlarge', 'major',    'large_hard',  false, 3],
    ['medium', 'major',    'significant', true,  2],
    ['large',  'standard', 'large_hard',  false, 3]
  ];

  table.forEach(([q1, q2, q3, trusted, expected], i) => {
    test(`row ${i + 1}: ${q1}/${q2}/${q3}/trusted=${trusted} → ${expected}`, () => {
      assert.equal(deriveBaselineLevel(sizingRow(q1, q2, q3), trusted), expected);
    });
  });
});

// ── explanation chips + alerts ────────────────────────────────────────────────
describe('derivation explanation and sizing alerts', () => {
  test('trusted small/standard/contained explains Level 1', () => {
    const chips = buildDerivationExplanation(sizingRow('small', 'standard', 'contained'), true);
    assert.equal(chips.length, 1);
    assert.match(chips[0], /trusted DCS.*Level 1/);
  });

  test('sub_exceeds_answer fires when Q1 sub ranks above the direct answer', () => {
    const alerts = computeSizingAlerts(sizingRow('small', 'standard', 'contained', { q1_sub_engineering: 'large' }));
    assert.ok(alerts.includes('sub_exceeds_answer'));
  });

  test('novelty_ux_mismatch fires on Q2 major + Q5 standard', () => {
    const alerts = computeSizingAlerts(sizingRow('small', 'major', 'contained', { q5_ux: 'standard' }));
    assert.ok(alerts.includes('novelty_ux_mismatch'));
  });

  test('no alerts on clean sizing', () => {
    assert.deepEqual(computeSizingAlerts(sizingRow('large', 'standard', 'contained')), []);
  });
});

// ── board-trigger helper (D-560) ──────────────────────────────────────────────
describe('isBoardTriggeredGate', () => {
  test('external product-embedded AI → go_to_deploy is board-triggered', () => {
    assert.equal(isBoardTriggeredGate(
      { ai_functionality: 'yes', ai_delivery_form: 'product_embedded', ai_audience: 'external' },
      'go_to_deploy'), true);
  });

  test('internal AI → go_to_release is board-triggered', () => {
    assert.equal(isBoardTriggeredGate(
      { ai_functionality: 'yes', ai_delivery_form: 'analytics_outputs', ai_audience: 'internal' },
      'go_to_release'), true);
  });

  test('non-AI Initiative has no board gates', () => {
    assert.equal(isBoardTriggeredGate(
      { ai_functionality: 'no', ai_delivery_form: null, ai_audience: null },
      'go_to_deploy'), false);
  });

  test('brief_review is never board-triggered', () => {
    assert.equal(isBoardTriggeredGate(
      { ai_functionality: 'yes', ai_delivery_form: 'product_embedded', ai_audience: 'external' },
      'brief_review'), false);
  });
});

// ── get_initiative_sizing ─────────────────────────────────────────────────────
describe('get_initiative_sizing', () => {
  test('rejects missing delivery_cycle_id', async () => {
    const r = await sizingTools.get_initiative_sizing({}, CALLER);
    assert.equal(r.success, false);
  });

  test('returns is_sized=false when no row exists (D-567)', async () => {
    queue = [{ data: null, error: null }];
    const r = await sizingTools.get_initiative_sizing({ delivery_cycle_id: CYC }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.is_sized, false);
    assert.equal(r.data.sizing, null);
  });

  test('returns the sizing row when present', async () => {
    queue = [{ data: sizingRow('small', 'standard', 'contained'), error: null }];
    const r = await sizingTools.get_initiative_sizing({ delivery_cycle_id: CYC }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.is_sized, true);
  });
});

// ── upsert_initiative_sizing ──────────────────────────────────────────────────
describe('upsert_initiative_sizing', () => {
  const fullAnswers = {
    q1_investment: 'small', q2_novelty: 'standard', q3_wrongness: 'contained',
    q4_security_impact: false, q5_ux: 'standard'
  };

  test('rejects when a direct answer is missing (AC #2)', async () => {
    const { q3_wrongness, ...partial } = fullAnswers;
    const r = await sizingTools.upsert_initiative_sizing(
      { delivery_cycle_id: CYC, answers: partial }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /q3_wrongness/);
  });

  test('rejects an invalid answer value', async () => {
    const r = await sizingTools.upsert_initiative_sizing(
      { delivery_cycle_id: CYC, answers: { ...fullAnswers, q1_investment: 'huge' } }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /q1_investment/);
  });

  test('rejects missing answers object', async () => {
    const r = await sizingTools.upsert_initiative_sizing({ delivery_cycle_id: CYC }, CALLER);
    assert.equal(r.success, false);
  });

  test('happy path: saves, recomputes baseline, returns alerts', async () => {
    const saved = sizingRow('small', 'major', 'contained');
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', set_level: null }, error: null }, // cycle
      { data: null, error: null },                                                          // no existing row
      { data: saved, error: null },                                                         // upsert
      { data: { delivery_cycle_id: CYC, assigned_dcs_user_id: OTHER, set_level: null }, error: null }, // recompute: cycle
      { data: saved, error: null },                                                         // recompute: sizing
      { data: { trusted_dcs: false }, error: null },                                        // recompute: dcs
      { data: null, error: null },                                                          // recompute: cache update
      { data: null, error: null }                                                           // event log insert
    ];
    const r = await sizingTools.upsert_initiative_sizing(
      { delivery_cycle_id: CYC, answers: { ...fullAnswers, q2_novelty: 'major' } }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.baseline_level, 2);
    assert.ok(r.data.alerts.includes('novelty_ux_mismatch'));
    assert.equal(queue.length, 0);
  });
});

// ── derive_governance ─────────────────────────────────────────────────────────
describe('derive_governance', () => {
  test('rejects missing delivery_cycle_id', async () => {
    const r = await sizingTools.derive_governance({}, CALLER);
    assert.equal(r.success, false);
  });

  test('unsized Initiative returns is_sized=false with D-567 chip', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, assigned_dcs_user_id: null, baseline_level: null, set_level: null, set_level_reason: null }, error: null },
      { data: null, error: null }
    ];
    const r = await sizingTools.derive_governance({ delivery_cycle_id: CYC }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.is_sized, false);
    assert.match(r.data.explanation_chips[0], /Not yet sized/);
  });

  test('sized + trusted DCS derives Level 1 with chips', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, assigned_dcs_user_id: OTHER, baseline_level: 1, set_level: null, set_level_reason: null }, error: null },
      { data: sizingRow('small', 'standard', 'contained'), error: null },
      { data: { trusted_dcs: true }, error: null }
    ];
    const r = await sizingTools.derive_governance({ delivery_cycle_id: CYC }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.baseline_level, 1);
    assert.equal(r.data.effective_level, 1);
    assert.ok(r.data.explanation_chips.length > 0);
  });
});

// ── set_effective_level / clear_effective_level ──────────────────────────────
describe('set_effective_level', () => {
  test('rejects missing reason (AC #5)', async () => {
    const r = await levelTools.set_effective_level({ delivery_cycle_id: CYC, level: 2 }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /reason/i);
  });

  test('rejects an invalid level', async () => {
    const r = await levelTools.set_effective_level({ delivery_cycle_id: CYC, level: 4, reason: 'x' }, CALLER);
    assert.equal(r.success, false);
  });

  test('rejects non-leadership JWT (AC #5)', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, division_id: 'div', baseline_level: 2, set_level: null }, error: null },
      { data: { id: CALLER, is_super_admin: false, is_active: true }, error: null },
      { data: { id: 'div', owner_user_id: OTHER }, error: null }
    ];
    const r = await levelTools.set_effective_level({ delivery_cycle_id: CYC, level: 3, reason: 'risk' }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /leadership/i);
  });

  test('Phil sets level with reason', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, division_id: 'div', baseline_level: 2, set_level: null }, error: null },
      { data: { id: CALLER, is_super_admin: true, is_active: true }, error: null },
      { data: { id: 'div', owner_user_id: OTHER }, error: null },
      { data: { delivery_cycle_id: CYC, baseline_level: 2, set_level: 3, set_level_reason: 'risk', set_level_at: 'now' }, error: null },
      { data: null, error: null } // event log
    ];
    const r = await levelTools.set_effective_level({ delivery_cycle_id: CYC, level: 3, reason: 'risk' }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.effective_level, 3);
  });
});

describe('clear_effective_level', () => {
  test('rejects missing reason', async () => {
    const r = await levelTools.clear_effective_level({ delivery_cycle_id: CYC }, CALLER);
    assert.equal(r.success, false);
  });

  test('rejects when no set level exists', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, division_id: 'div', baseline_level: 2, set_level: null }, error: null },
      { data: { id: CALLER, is_super_admin: true, is_active: true }, error: null },
      { data: { id: 'div', owner_user_id: OTHER }, error: null }
    ];
    const r = await levelTools.clear_effective_level({ delivery_cycle_id: CYC, reason: 'done' }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /nothing to clear/i);
  });

  test('Division Leader clears — effective falls back to baseline', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, division_id: 'div', baseline_level: 2, set_level: 3 }, error: null },
      { data: { id: CALLER, is_super_admin: false, is_active: true }, error: null },
      { data: { id: 'div', owner_user_id: CALLER }, error: null },
      { data: { delivery_cycle_id: CYC, baseline_level: 2, set_level: null }, error: null },
      { data: null, error: null }
    ];
    const r = await levelTools.clear_effective_level({ delivery_cycle_id: CYC, reason: 'resolved' }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.effective_level, 2);
  });
});

// ── set_oversight / clear_oversight ──────────────────────────────────────────
describe('set_oversight / clear_oversight', () => {
  test('set_oversight rejects an invalid set_via', async () => {
    const r = await levelTools.set_oversight(
      { delivery_cycle_id: CYC, user_id: OTHER, set_via: 'random' }, CALLER);
    assert.equal(r.success, false);
  });

  test('set_oversight happy path (leadership)', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, division_id: 'div', oversight_user_id: null }, error: null },
      { data: { id: CALLER, is_super_admin: true, is_active: true }, error: null },
      { data: { id: 'div', owner_user_id: OTHER }, error: null },
      { data: { id: OTHER, display_name: 'Oversight Person', is_active: true }, error: null },
      { data: { delivery_cycle_id: CYC, oversight_user_id: OTHER, oversight_set_via: 'manual', oversight_set_by_user_id: CALLER }, error: null },
      { data: null, error: null }
    ];
    const r = await levelTools.set_oversight(
      { delivery_cycle_id: CYC, user_id: OTHER, set_via: 'manual' }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.oversight_user_id, OTHER);
  });

  test('clear_oversight rejects missing note (D-561)', async () => {
    const r = await levelTools.clear_oversight({ delivery_cycle_id: CYC }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /note/i);
  });

  test('clear_oversight happy path with note', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, division_id: 'div', oversight_user_id: OTHER, oversight_set_by_user_id: OTHER }, error: null },
      { data: { id: CALLER, is_super_admin: true, is_active: true }, error: null },
      { data: { id: 'div', owner_user_id: OTHER }, error: null },
      { data: { delivery_cycle_id: CYC, oversight_user_id: null }, error: null },
      { data: null, error: null }
    ];
    const r = await levelTools.clear_oversight({ delivery_cycle_id: CYC, note: 'no longer needed' }, CALLER);
    assert.equal(r.success, true);
  });
});

// ── set_trusted_dcs ───────────────────────────────────────────────────────────
describe('set_trusted_dcs', () => {
  test('rejects non-admin caller', async () => {
    queue = [
      { data: { id: CALLER, is_admin: false, is_super_admin: false, is_active: true }, error: null }
    ];
    const r = await levelTools.set_trusted_dcs({ user_id: OTHER, trusted: true }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /Admin/);
  });

  test('rejects non-boolean trusted', async () => {
    const r = await levelTools.set_trusted_dcs({ user_id: OTHER, trusted: 'yes' }, CALLER);
    assert.equal(r.success, false);
  });

  test('admin sets flag; affected cycle baselines recompute', async () => {
    queue = [
      { data: { id: CALLER, is_admin: true, is_super_admin: false, is_active: true }, error: null }, // caller
      { data: { id: OTHER, display_name: 'DCS Person', trusted_dcs: false }, error: null },          // target
      { data: null, error: null },                                                                   // users update
      { data: [{ delivery_cycle_id: CYC }], error: null },                                           // affected cycles
      { data: { delivery_cycle_id: CYC, assigned_dcs_user_id: OTHER, set_level: null }, error: null }, // recompute: cycle
      { data: sizingRow('small', 'standard', 'contained'), error: null },                            // recompute: sizing
      { data: { trusted_dcs: true }, error: null },                                                  // recompute: dcs
      { data: null, error: null },                                                                   // recompute: cache write
      { data: null, error: null }                                                                    // cycle event log
    ];
    const r = await levelTools.set_trusted_dcs({ user_id: OTHER, trusted: true, note: 'proven' }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.trusted_dcs, true);
    assert.equal(r.data.recomputed_cycles.length, 1);
    assert.equal(r.data.recomputed_cycles[0].baseline_level, 1);
    assert.equal(queue.length, 0);
  });
});

// ── participation ─────────────────────────────────────────────────────────────
describe('add_participation', () => {
  test('rejects when both holder fields are set', async () => {
    const r = await partTools.add_participation(
      { delivery_cycle_id: CYC, letter: 'C', holder_user_id: OTHER, holder_group_id: 'g', set_via: 'trio' }, CALLER);
    assert.equal(r.success, false);
  });

  test('rejects an invalid letter', async () => {
    const r = await partTools.add_participation(
      { delivery_cycle_id: CYC, letter: 'R', holder_user_id: OTHER, set_via: 'trio' }, CALLER);
    assert.equal(r.success, false);
  });

  test("rejects set_via 'self' when holder is not the caller", async () => {
    const r = await partTools.add_participation(
      { delivery_cycle_id: CYC, letter: 'I', holder_user_id: OTHER, set_via: 'self' }, CALLER);
    assert.equal(r.success, false);
  });

  test('happy path: user-held Consulted stake', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T' }, error: null },
      { data: { id: OTHER, display_name: 'Holder', is_active: true }, error: null },
      { data: null, error: null }, // no duplicate
      { data: { record_id: 'rec-1', delivery_cycle_id: CYC, letter: 'C', holder_user_id: OTHER, set_via: 'trio' }, error: null },
      { data: null, error: null }  // event log
    ];
    const r = await partTools.add_participation(
      { delivery_cycle_id: CYC, letter: 'C', holder_user_id: OTHER, set_via: 'trio' }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.letter, 'C');
  });
});

describe('remove_participation', () => {
  test("rejects removing another's stake without a note (AC #7)", async () => {
    queue = [
      { data: { record_id: 'rec-1', delivery_cycle_id: CYC, letter: 'C', holder_user_id: OTHER, holder_group_id: null, removed_at: null }, error: null }
    ];
    const r = await partTools.remove_participation({ record_id: 'rec-1' }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /note is required/i);
  });

  test('holder removes own stake without a note', async () => {
    queue = [
      { data: { record_id: 'rec-1', delivery_cycle_id: CYC, letter: 'I', holder_user_id: CALLER, holder_group_id: null, removed_at: null }, error: null },
      { data: { record_id: 'rec-1', removed_at: 'now', removed_by_user_id: CALLER }, error: null },
      { data: null, error: null }
    ];
    const r = await partTools.remove_participation({ record_id: 'rec-1' }, CALLER);
    assert.equal(r.success, true);
  });

  test('rejects an already-removed stake', async () => {
    queue = [
      { data: { record_id: 'rec-1', delivery_cycle_id: CYC, letter: 'I', holder_user_id: CALLER, holder_group_id: null, removed_at: '2026-07-01' }, error: null }
    ];
    const r = await partTools.remove_participation({ record_id: 'rec-1' }, CALLER);
    assert.equal(r.success, false);
  });
});

describe('list_participation / list_my_participation', () => {
  test('list_participation rejects missing delivery_cycle_id', async () => {
    const r = await partTools.list_participation({}, CALLER);
    assert.equal(r.success, false);
  });

  test('list_participation resolves holder labels', async () => {
    queue = [
      { data: [{ record_id: 'rec-1', holder_user_id: OTHER, holder_group_id: null, letter: 'C' }], error: null },
      { data: [{ id: OTHER, display_name: 'Holder' }], error: null }
    ];
    const r = await partTools.list_participation({ delivery_cycle_id: CYC }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.participation_records[0].holder_display_name, 'Holder');
  });

  test('list_my_participation includes group-held stakes via membership', async () => {
    queue = [
      { data: [{ group_id: 'g1' }], error: null },
      { data: [{ record_id: 'rec-2', holder_user_id: null, holder_group_id: 'g1', letter: 'C' }], error: null },
      { data: [{ group_id: 'g1', group_name: 'Security' }], error: null }
    ];
    const r = await partTools.list_my_participation({}, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.participation_records[0].holder_group_name, 'Security');
  });
});

// ── specialty groups ──────────────────────────────────────────────────────────
describe('specialty groups', () => {
  test('list_specialty_groups returns groups with member rosters', async () => {
    queue = [
      { data: [{ group_id: 'g1', group_name: 'Security', active_status: true }], error: null },
      { data: [{ group_id: 'g1', user_id: OTHER, created_at: 'now' }], error: null },
      { data: [{ id: OTHER, display_name: 'Member', is_active: true }], error: null }
    ];
    const r = await groupTools.list_specialty_groups({}, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.specialty_groups[0].members[0].display_name, 'Member');
  });

  test('add_specialty_group_member rejects non-admin', async () => {
    queue = [
      { data: { id: CALLER, is_admin: false, is_super_admin: false, is_active: true }, error: null }
    ];
    const r = await groupTools.add_specialty_group_member({ group_id: 'g1', user_id: OTHER }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /Admin/);
  });

  test('add_specialty_group_member happy path', async () => {
    queue = [
      { data: { id: CALLER, is_admin: true, is_super_admin: false, is_active: true }, error: null },
      { data: { group_id: 'g1', group_name: 'Security', active_status: true }, error: null },
      { data: { id: OTHER, display_name: 'Member', is_active: true }, error: null },
      { data: null, error: null }, // no existing membership
      { data: { group_id: 'g1', user_id: OTHER }, error: null }
    ];
    const r = await groupTools.add_specialty_group_member({ group_id: 'g1', user_id: OTHER }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.group_name, 'Security');
  });

  test('remove_specialty_group_member rejects a missing membership', async () => {
    queue = [
      { data: { id: CALLER, is_admin: true, is_super_admin: false, is_active: true }, error: null },
      { data: null, error: null }
    ];
    const r = await groupTools.remove_specialty_group_member({ group_id: 'g1', user_id: OTHER }, CALLER);
    assert.equal(r.success, false);
  });

  test('remove_specialty_group_member soft-deletes (Arch-6)', async () => {
    queue = [
      { data: { id: CALLER, is_admin: true, is_super_admin: false, is_active: true }, error: null },
      { data: { group_id: 'g1', user_id: OTHER, deleted_at: null }, error: null },
      { data: null, error: null } // update (soft delete)
    ];
    const r = await groupTools.remove_specialty_group_member({ group_id: 'g1', user_id: OTHER }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.removed, true);
  });
});

// ── division default consulteds ───────────────────────────────────────────────
describe('division default consulteds', () => {
  test('add rejects when both holder fields are set', async () => {
    const r = await ddcTools.add_division_default_consulted(
      { division_id: 'div', holder_user_id: OTHER, holder_group_id: 'g1' }, CALLER);
    assert.equal(r.success, false);
  });

  test('add rejects non-DL non-admin caller', async () => {
    queue = [
      { data: { id: 'div', division_name: 'Div', owner_user_id: OTHER }, error: null },
      { data: { id: CALLER, is_admin: false, is_super_admin: false, is_active: true }, error: null }
    ];
    const r = await ddcTools.add_division_default_consulted(
      { division_id: 'div', holder_user_id: OTHER }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /Division Leader or an Admin/);
  });

  test('DL adds a group default', async () => {
    queue = [
      { data: { id: 'div', division_name: 'Div', owner_user_id: CALLER }, error: null },
      { data: { id: CALLER, is_admin: false, is_super_admin: false, is_active: true }, error: null },
      { data: { group_id: 'g1', group_name: 'Security', active_status: true }, error: null },
      { data: null, error: null }, // no duplicate
      { data: { default_consulted_id: 'ddc-1', division_id: 'div', holder_group_id: 'g1' }, error: null }
    ];
    const r = await ddcTools.add_division_default_consulted(
      { division_id: 'div', holder_group_id: 'g1' }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.holder_label, 'Security');
  });

  test('remove soft-deletes an active entry', async () => {
    queue = [
      { data: { default_consulted_id: 'ddc-1', division_id: 'div', deleted_at: null }, error: null },
      { data: { id: 'div', division_name: 'Div', owner_user_id: CALLER }, error: null },
      { data: { id: CALLER, is_admin: false, is_super_admin: false, is_active: true }, error: null },
      { data: null, error: null }
    ];
    const r = await ddcTools.remove_division_default_consulted({ default_consulted_id: 'ddc-1' }, CALLER);
    assert.equal(r.success, true);
  });

  test('list resolves holder labels', async () => {
    queue = [
      { data: [{ default_consulted_id: 'ddc-1', division_id: 'div', holder_user_id: OTHER, holder_group_id: null }], error: null },
      { data: [{ id: OTHER, display_name: 'Person' }], error: null }
    ];
    const r = await ddcTools.list_division_default_consulteds({ division_id: 'div' }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.division_default_consulteds[0].holder_display_name, 'Person');
  });
});

// ── gate thread ───────────────────────────────────────────────────────────────
describe('gate thread', () => {
  test('add_gate_thread_message rejects empty text', async () => {
    const r = await threadTools.add_gate_thread_message({ gate_record_id: GATE, text: '  ' }, CALLER);
    assert.equal(r.success, false);
  });

  test('add_gate_thread_message happy path', async () => {
    queue = [
      { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'brief_review' }, error: null },
      { data: { message_id: 'msg-1', gate_record_id: GATE, message_text: 'Question on scope' }, error: null }
    ];
    const r = await threadTools.add_gate_thread_message({ gate_record_id: GATE, text: 'Question on scope' }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.message_text, 'Question on scope');
  });

  test('list_gate_thread resolves author names chronologically', async () => {
    queue = [
      { data: [{ message_id: 'msg-1', user_id: OTHER, message_text: 'Hi', created_at: 'now' }], error: null },
      { data: [{ id: OTHER, display_name: 'Author' }], error: null }
    ];
    const r = await threadTools.list_gate_thread({ gate_record_id: GATE }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.gate_thread_messages[0].author_display_name, 'Author');
  });
});

// ── gate conditions ───────────────────────────────────────────────────────────
describe('gate conditions', () => {
  test('consultation_required without target_consultation_id is rejected', async () => {
    queue = [
      { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'go_to_build' }, error: null }
    ];
    const r = await conditionTools.add_gate_condition(
      { gate_record_id: GATE, type: 'consultation_required', text: 'Security must weigh in' }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /target_consultation_id/);
  });

  test('target consultation on a different gate is rejected', async () => {
    queue = [
      { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'go_to_build' }, error: null },
      { data: { id: 'cons-1', gate_record_id: 'different-gate' }, error: null }
    ];
    const r = await conditionTools.add_gate_condition(
      { gate_record_id: GATE, type: 'consultation_required', text: 'x', target_consultation_id: 'cons-1' }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /different gate/);
  });

  test('general condition happy path', async () => {
    queue = [
      { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'go_to_build' }, error: null },
      { data: { condition_id: 'cond-1', gate_record_id: GATE, condition_type: 'general', condition_status: 'open' }, error: null },
      { data: null, error: null }
    ];
    const r = await conditionTools.add_gate_condition(
      { gate_record_id: GATE, type: 'general', text: 'Confirm rollback plan' }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.condition_status, 'open');
  });

  test('resolving an already-resolved condition is rejected', async () => {
    queue = [
      { data: { condition_id: 'cond-1', gate_record_id: GATE, condition_status: 'resolved', set_by_user_id: CALLER }, error: null }
    ];
    const r = await conditionTools.resolve_gate_condition({ condition_id: 'cond-1' }, CALLER);
    assert.equal(r.success, false);
  });

  test('setter resolves an open condition', async () => {
    queue = [
      { data: { condition_id: 'cond-1', gate_record_id: GATE, condition_type: 'general', condition_text: 'x', condition_status: 'open', set_by_user_id: CALLER }, error: null },
      { data: { condition_id: 'cond-1', condition_status: 'resolved' }, error: null },
      { data: { delivery_cycle_id: CYC, gate_name: 'go_to_build' }, error: null },
      { data: null, error: null }
    ];
    const r = await conditionTools.resolve_gate_condition({ condition_id: 'cond-1', note: 'done' }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.condition_status, 'resolved');
  });

  test('non-setter non-admin cannot resolve', async () => {
    queue = [
      { data: { condition_id: 'cond-1', gate_record_id: GATE, condition_type: 'general', condition_text: 'x', condition_status: 'open', set_by_user_id: OTHER }, error: null },
      { data: { is_admin: false, is_super_admin: false }, error: null }
    ];
    const r = await conditionTools.resolve_gate_condition({ condition_id: 'cond-1' }, CALLER);
    assert.equal(r.success, false);
  });

  test('list_gate_conditions returns rows', async () => {
    queue = [
      { data: [{ condition_id: 'cond-1', condition_status: 'open' }], error: null }
    ];
    const r = await conditionTools.list_gate_conditions({ gate_record_id: GATE }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.gate_conditions.length, 1);
  });
});

// ── gate approvals ────────────────────────────────────────────────────────────
describe('record_gate_approval', () => {
  test('ie_override without reason is rejected (AC #6)', async () => {
    const r = await approvalTools.record_gate_approval(
      { gate_record_id: GATE, approval_type: 'ie_override' }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /reason/i);
  });

  test('over_returned_consultation without reason is rejected (AC #6, D-569)', async () => {
    const r = await approvalTools.record_gate_approval(
      { gate_record_id: GATE, approval_type: 'assigned', over_returned_consultation: true }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /returned consultation/i);
  });

  test('invalid approval_type is rejected', async () => {
    const r = await approvalTools.record_gate_approval(
      { gate_record_id: GATE, approval_type: 'super_approval' }, CALLER);
    assert.equal(r.success, false);
  });

  test('ie_override on a board-triggered gate is rejected (AC #6, D-560)', async () => {
    queue = [
      { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'go_to_deploy', gate_status: 'pending' }, error: null },
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', ai_functionality: 'yes', ai_delivery_form: 'product_embedded', ai_audience: 'external' }, error: null }
    ];
    const r = await approvalTools.record_gate_approval(
      { gate_record_id: GATE, approval_type: 'ie_override', reason_note: 'urgent' }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /board/i);
  });

  test('ie_override by non-Phil is rejected until G8 role grant', async () => {
    queue = [
      { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'brief_review', gate_status: 'pending' }, error: null },
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', ai_functionality: 'no', ai_delivery_form: null, ai_audience: null }, error: null },
      { data: { is_super_admin: false }, error: null }
    ];
    const r = await approvalTools.record_gate_approval(
      { gate_record_id: GATE, approval_type: 'ie_override', reason_note: 'urgent' }, CALLER);
    assert.equal(r.success, false);
  });

  test('trio_member approval happy path', async () => {
    queue = [
      { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'brief_review', gate_status: 'pending' }, error: null },
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', ai_functionality: 'no', ai_delivery_form: null, ai_audience: null }, error: null },
      { data: null, error: null }, // no duplicate
      { data: { approval_id: 'app-1', gate_record_id: GATE, approval_type: 'trio_member', over_returned_consultation: false }, error: null },
      { data: null, error: null }
    ];
    const r = await approvalTools.record_gate_approval(
      { gate_record_id: GATE, approval_type: 'trio_member' }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.approval_type, 'trio_member');
  });

  test('over_returned approval with reason carries the D-569 marker', async () => {
    queue = [
      { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'go_to_build', gate_status: 'pending' }, error: null },
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', ai_functionality: 'no', ai_delivery_form: null, ai_audience: null }, error: null },
      { data: null, error: null },
      { data: { approval_id: 'app-2', gate_record_id: GATE, approval_type: 'assigned', over_returned_consultation: true, reason_note: 'accepted risk' }, error: null },
      { data: null, error: null }
    ];
    const r = await approvalTools.record_gate_approval(
      { gate_record_id: GATE, approval_type: 'assigned', over_returned_consultation: true, reason_note: 'accepted risk' }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.over_returned_consultation, true);
  });

  test('three approvals accumulate on one gate record (AC #8)', async () => {
    const approvers = ['user-a', 'user-b', 'user-c'];
    for (const [i, approver] of approvers.entries()) {
      queue = [
        { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'brief_review', gate_status: 'pending' }, error: null },
        { data: { delivery_cycle_id: CYC, cycle_title: 'T', ai_functionality: 'no', ai_delivery_form: null, ai_audience: null }, error: null },
        { data: null, error: null },
        { data: { approval_id: `app-${i}`, gate_record_id: GATE, approval_type: 'trio_member' }, error: null },
        { data: null, error: null }
      ];
      const r = await approvalTools.record_gate_approval(
        { gate_record_id: GATE, approval_type: 'trio_member' }, approver);
      assert.equal(r.success, true, `approval ${i + 1} should succeed`);
    }
  });

  test('duplicate approval by the same user and type is rejected', async () => {
    queue = [
      { data: { gate_record_id: GATE, delivery_cycle_id: CYC, gate_name: 'brief_review', gate_status: 'pending' }, error: null },
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', ai_functionality: 'no', ai_delivery_form: null, ai_audience: null }, error: null },
      { data: { approval_id: 'app-1' }, error: null } // duplicate found
    ];
    const r = await approvalTools.record_gate_approval(
      { gate_record_id: GATE, approval_type: 'trio_member' }, CALLER);
    assert.equal(r.success, false);
    assert.match(r.error, /already recorded/);
  });
});

describe('list_gate_approvals', () => {
  test('resolves approver display names', async () => {
    queue = [
      { data: [{ approval_id: 'app-1', approver_user_id: OTHER, approval_type: 'assigned' }], error: null },
      { data: [{ id: OTHER, display_name: 'Approver' }], error: null }
    ];
    const r = await approvalTools.list_gate_approvals({ gate_record_id: GATE }, CALLER);
    assert.equal(r.success, true);
    assert.equal(r.data.gate_approvals[0].approver_display_name, 'Approver');
  });
});

// ── DCS reassignment recompute hooks (AC #4) ─────────────────────────────────
describe('DCS reassignment recomputes cached baseline (AC #4)', () => {
  test('assign_roles_to_cycle triggers recompute when DCS changes', async () => {
    queue = [
      { data: { is_admin: true, is_dcs: false, is_epo: false, is_dol: false, is_ce: false, is_active: true }, error: null }, // caller
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', assigned_dcs_user_id: 'old-dcs', assigned_epo_user_id: null, assigned_dol_user_id: null, current_lifecycle_stage: 'BUILD' }, error: null }, // cycle
      { data: { id: OTHER, display_name: 'New DCS', is_active: true }, error: null },  // assignee validation
      { data: { delivery_cycle_id: CYC, assigned_dcs_user_id: OTHER }, error: null },  // update
      { data: null, error: null },                                                     // event log
      { data: { delivery_cycle_id: CYC, assigned_dcs_user_id: OTHER, set_level: null }, error: null }, // recompute: cycle
      { data: sizingRow('small', 'standard', 'contained'), error: null },              // recompute: sizing
      { data: { trusted_dcs: true }, error: null },                                    // recompute: dcs
      { data: null, error: null }                                                      // recompute: cache write
    ];
    const r = await assign_roles_to_cycle(
      { delivery_cycle_id: CYC, assigned_dcs_user_id: OTHER }, CALLER);
    assert.equal(r.success, true);
    assert.equal(queue.length, 0, 'recompute queries should have consumed the queue');
  });

  test('assign_roles_to_cycle does NOT recompute when DCS is unchanged', async () => {
    queue = [
      { data: { is_admin: true, is_dcs: false, is_epo: false, is_dol: false, is_ce: false, is_active: true }, error: null },
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', assigned_dcs_user_id: 'old-dcs', assigned_epo_user_id: null, assigned_dol_user_id: null, current_lifecycle_stage: 'BUILD' }, error: null },
      { data: { id: OTHER, display_name: 'New EPO', is_active: true }, error: null },
      { data: { delivery_cycle_id: CYC, assigned_epo_user_id: OTHER }, error: null },
      { data: null, error: null }
    ];
    const r = await assign_roles_to_cycle(
      { delivery_cycle_id: CYC, assigned_epo_user_id: OTHER }, CALLER);
    assert.equal(r.success, true);
    assert.equal(queue.length, 0, 'no recompute queries should fire for EPO-only change');
  });

  test('update_delivery_cycle triggers recompute when DCS changes', async () => {
    queue = [
      { data: { delivery_cycle_id: CYC, cycle_title: 'T', cycle_status: 'active', division_id: 'div', workstream_id: null, tier_classification: 'tier_2', outcome_statement: null, assigned_dcs_user_id: 'old-dcs', assigned_epo_user_id: null, assigned_dol_user_id: null, jira_epic_key: null, other_consulted_user_ids: [], other_informed_user_ids: [], ai_functionality: 'no', ai_delivery_form: null, ai_audience: null, ai_board_approved: false }, error: null }, // cycle
      { data: { id: OTHER, display_name: 'New DCS', is_active: true }, error: null },  // assignee validation
      { data: { delivery_cycle_id: CYC, assigned_dcs_user_id: OTHER }, error: null },  // update
      { data: null, error: null },                                                     // field_edit events
      { data: { delivery_cycle_id: CYC, assigned_dcs_user_id: OTHER, set_level: null }, error: null }, // recompute: cycle
      { data: sizingRow('small', 'standard', 'contained'), error: null },              // recompute: sizing
      { data: { trusted_dcs: false }, error: null },                                   // recompute: dcs
      { data: null, error: null }                                                      // recompute: cache write
    ];
    const r = await update_delivery_cycle(
      { delivery_cycle_id: CYC, assigned_dcs_user_id: OTHER }, CALLER);
    assert.equal(r.success, true);
    assert.equal(queue.length, 0, 'recompute queries should have consumed the queue');
  });
});
