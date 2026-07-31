// artifact-warnings.test.js
// Unit tests for the pure rule in tools/helpers/artifact-warnings.js (D-438).
// Exercises computeWarnings against every gate_warning_behavior × gate-sequence
// permutation called out in Contract 25 WS1 AC 4–6.

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

const {
  GATE_SEQUENCE,
  computeWarnings
} = require('../src/tools/helpers/artifact-warnings');

// Convenience: build a candidate type
function type({ id, name, primary, behavior, active = true, through = null, onOpen = false }) {
  return {
    artifact_type_id:      id,
    artifact_type_name:    name,
    primary_gate:          primary,
    gate_warning_behavior: behavior,
    gate_warning_through:  through,
    gate_warning_on_open:  onOpen,
    active_status:         active
  };
}

describe('GATE_SEQUENCE', () => {
  test('numbers match Contract 25 spec', () => {
    assert.equal(GATE_SEQUENCE.brief_review,  1);
    assert.equal(GATE_SEQUENCE.go_to_build,   2);
    assert.equal(GATE_SEQUENCE.go_to_deploy,  3);
    assert.equal(GATE_SEQUENCE.go_to_release, 4);
    assert.equal(GATE_SEQUENCE.close_review,  5);
  });
});

describe('computeWarnings — primary_only', () => {
  const t = type({ id:'t1', name:'Context Brief', primary:'brief_review', behavior:'primary_only' });

  test('fires at the primary gate', () => {
    const out = computeWarnings([t], new Set(), 'brief_review');
    assert.equal(out.length, 1);
    assert.equal(out[0].artifact_type_name, 'Context Brief');
  });

  test('does not fire before the primary gate', () => {
    // primary=brief_review (1). No gate is "before" 1, but check go_to_build > primary.
    const goToBuild = type({ id:'t2', name:'Technical Spec', primary:'go_to_build', behavior:'primary_only' });
    const out = computeWarnings([goToBuild], new Set(), 'brief_review');
    assert.deepEqual(out, []);
  });

  test('does not fire after the primary gate', () => {
    const out = computeWarnings([t], new Set(), 'go_to_build');
    assert.deepEqual(out, []);
  });
});

describe('computeWarnings — primary_and_subsequent', () => {
  const t = type({ id:'t3', name:'Compliance & Risk', primary:'brief_review', behavior:'primary_and_subsequent' });

  test('fires at the primary gate', () => {
    const out = computeWarnings([t], new Set(), 'brief_review');
    assert.equal(out.length, 1);
  });

  test('fires at every subsequent gate', () => {
    for (const g of ['go_to_build','go_to_deploy','go_to_release','close_review']) {
      const out = computeWarnings([t], new Set(), g);
      assert.equal(out.length, 1, `expected warning at ${g}`);
    }
  });

  test('does not fire before the primary gate', () => {
    const tBuild = type({ id:'t4', name:'QA results', primary:'go_to_build', behavior:'primary_and_subsequent' });
    const out = computeWarnings([tBuild], new Set(), 'brief_review');
    assert.deepEqual(out, []);
  });
});

describe('computeWarnings — none', () => {
  const t = type({ id:'t5', name:'Reference doc', primary:null, behavior:'none' });

  test('never fires', () => {
    for (const g of Object.keys(GATE_SEQUENCE)) {
      const out = computeWarnings([t], new Set(), g);
      assert.deepEqual(out, [], `unexpected warning at ${g}`);
    }
  });
});

describe('computeWarnings — exclusions', () => {
  const t = type({ id:'t6', name:'Pilot Plan', primary:'go_to_release', behavior:'primary_only' });

  test('inactive types do not warn', () => {
    const inactive = { ...t, active_status: false };
    const out = computeWarnings([inactive], new Set(), 'go_to_release');
    assert.deepEqual(out, []);
  });

  test('attached types do not warn', () => {
    const out = computeWarnings([t], new Set(['t6']), 'go_to_release');
    assert.deepEqual(out, []);
  });

  test('unknown current gate produces no warnings', () => {
    const out = computeWarnings([t], new Set(), 'not_a_real_gate');
    assert.deepEqual(out, []);
  });

  test('missing primary_gate is skipped', () => {
    const orphan = { ...t, primary_gate: null };
    const out = computeWarnings([orphan], new Set(), 'go_to_release');
    assert.deepEqual(out, []);
  });
});

describe('computeWarnings — return shape', () => {
  test('returns {artifact_type_id, artifact_type_name} objects', () => {
    const t = type({ id:'t7', name:'Rollback Plan', primary:'close_review', behavior:'primary_only' });
    const out = computeWarnings([t], new Set(), 'close_review');
    assert.deepEqual(out, [{ artifact_type_id:'t7', artifact_type_name:'Rollback Plan' }]);
  });
});

// ── Contract 40 follow-on (Phil 2026-07-30): gate_warning_through upper bound ──
describe('computeWarnings — gate_warning_through window', () => {
  // Context Brief as configured by migration 096: brief_review → go_to_deploy.
  const cb = type({
    id: 'cb', name: 'Context Brief', primary: 'brief_review',
    behavior: 'primary_and_subsequent', through: 'go_to_deploy'
  });

  const fires = (gate) => computeWarnings([cb], new Set(), gate).length === 1;

  test('fires at the primary gate (brief_review)', () => {
    assert.equal(fires('brief_review'), true);
  });

  test('fires mid-window (go_to_build)', () => {
    assert.equal(fires('go_to_build'), true);
  });

  test('fires at the boundary gate itself (go_to_deploy)', () => {
    assert.equal(fires('go_to_deploy'), true);
  });

  test('does NOT fire past the boundary (go_to_release)', () => {
    assert.equal(fires('go_to_release'), false);
  });

  test('does NOT fire past the boundary (close_review)', () => {
    assert.equal(fires('close_review'), false);
  });

  test('null through = unbounded (prior D-438 behaviour preserved)', () => {
    const unbounded = { ...cb, gate_warning_through: null };
    assert.equal(computeWarnings([unbounded], new Set(), 'close_review').length, 1);
  });

  test('unrecognised through value is treated as unbounded, not silent', () => {
    const bogus = { ...cb, gate_warning_through: 'not_a_gate' };
    assert.equal(computeWarnings([bogus], new Set(), 'close_review').length, 1);
  });

  test('through is ignored for primary_only behaviour', () => {
    const primaryOnly = { ...cb, gate_warning_behavior: 'primary_only', gate_warning_through: 'close_review' };
    assert.equal(computeWarnings([primaryOnly], new Set(), 'go_to_build').length, 0);
    assert.equal(computeWarnings([primaryOnly], new Set(), 'brief_review').length, 1);
  });

  test('already-attached artifact never warns inside the window', () => {
    assert.equal(computeWarnings([cb], new Set(['cb']), 'go_to_build').length, 0);
  });

  // Scenario Journeys as configured by migration 096: go_to_build → go_to_deploy.
  test('Scenario Journeys is silent at brief_review, loud at go_to_build', () => {
    const sj = type({
      id: 'sj', name: 'Scenario Journeys', primary: 'go_to_build',
      behavior: 'primary_and_subsequent', through: 'go_to_deploy'
    });
    assert.equal(computeWarnings([sj], new Set(), 'brief_review').length, 0);
    assert.equal(computeWarnings([sj], new Set(), 'go_to_build').length, 1);
    assert.equal(computeWarnings([sj], new Set(), 'go_to_deploy').length, 1);
    assert.equal(computeWarnings([sj], new Set(), 'go_to_release').length, 0);
  });
});

// ── Contract 41 (D-616, migration 097): the on-open scope ────────────────────
// Regression guard for the twelve-bullet Go to Build panel. The other ~10
// artifact types have carried primary_and_subsequent since Contract 25; adding
// the read path surfaced all of them on modal open. onOpenOnly is the filter
// that keeps the panel to Context Brief and Scenario Journeys, WITHOUT
// silencing anyone's D-438 submit/decision-response warnings.
describe('computeWarnings — onOpenOnly (Contract 41 / D-616)', () => {

  // The two loud types per migrations 096 + 097.
  const contextBrief = type({
    id: 'cb', name: 'Context Brief', primary: 'brief_review',
    behavior: 'primary_and_subsequent', through: 'go_to_deploy', onOpen: true
  });
  const scenarioJourneys = type({
    id: 'sj', name: 'Scenario Journeys', primary: 'go_to_build',
    behavior: 'primary_and_subsequent', through: 'go_to_deploy', onOpen: true
  });

  // A representative slice of the Contract 25 / migration 076 set that made the
  // Go to Build panel twelve bullets long. All warning-configured, none loud.
  const quietTypes = [
    'Design session output', 'UI/UX mockup', 'Process flow diagram',
    'User Stories', 'Jira Epic', 'Technical Specification', 'Cursor prompt',
    'Architecture Decision Record', 'Agent Registry entry', 'AI Governance Spec',
    'Compliance & Risk Assessment'
  ].map((name, i) => type({
    id: `q${i}`, name, primary: 'go_to_build',
    behavior: 'primary_and_subsequent', through: null, onOpen: false
  }));

  const allTypes = [contextBrief, scenarioJourneys, ...quietTypes];

  test('go_to_build on open yields exactly the two loud types', () => {
    const names = computeWarnings(allTypes, new Set(), 'go_to_build', { onOpenOnly: true })
      .map(w => w.artifact_type_name).sort();
    assert.deepEqual(names, ['Context Brief', 'Scenario Journeys']);
  });

  test('the same input without onOpenOnly still yields all thirteen', () => {
    // Proves the D-438 submit/decision path is untouched by this change —
    // the quiet types keep warning after an action, just not before one.
    const all = computeWarnings(allTypes, new Set(), 'go_to_build');
    assert.equal(all.length, 13);
  });

  test('brief_review on open yields Context Brief only', () => {
    // Scenario Journeys is deliberately not warned at Brief Review (mig 096).
    const names = computeWarnings(allTypes, new Set(), 'brief_review', { onOpenOnly: true })
      .map(w => w.artifact_type_name);
    assert.deepEqual(names, ['Context Brief']);
  });

  test('go_to_release and close_review are silent on open', () => {
    // Both loud types close their window at go_to_deploy — no Close Review nag.
    for (const gate of ['go_to_release', 'close_review']) {
      assert.deepEqual(
        computeWarnings(allTypes, new Set(), gate, { onOpenOnly: true }), [],
        `expected no on-open warnings at ${gate}`
      );
    }
  });

  test('an attached loud type drops out of the on-open panel', () => {
    const names = computeWarnings(allTypes, new Set(['cb']), 'go_to_build', { onOpenOnly: true })
      .map(w => w.artifact_type_name);
    assert.deepEqual(names, ['Scenario Journeys']);
  });

  test('a missing gate_warning_on_open field reads as not-loud', () => {
    // Guards the pre-migration row shape and any select that forgets the column:
    // a type is never loud by accident.
    const legacy = { ...contextBrief };
    delete legacy.gate_warning_on_open;
    assert.deepEqual(computeWarnings([legacy], new Set(), 'brief_review', { onOpenOnly: true }), []);
  });

  test('onOpenOnly false and omitted behave identically', () => {
    const omitted = computeWarnings(allTypes, new Set(), 'go_to_build');
    const explicit = computeWarnings(allTypes, new Set(), 'go_to_build', { onOpenOnly: false });
    assert.deepEqual(omitted, explicit);
  });

  test('a loud type still obeys its behaviour window', () => {
    // on_open is a scope filter, not an override — primary_only still means one gate.
    const narrow = { ...contextBrief, gate_warning_behavior: 'primary_only' };
    assert.equal(computeWarnings([narrow], new Set(), 'brief_review', { onOpenOnly: true }).length, 1);
    assert.equal(computeWarnings([narrow], new Set(), 'go_to_build', { onOpenOnly: true }).length, 0);
  });

  test('an inactive loud type is silent on open', () => {
    const retired = { ...scenarioJourneys, active_status: false };
    assert.deepEqual(computeWarnings([retired], new Set(), 'go_to_build', { onOpenOnly: true }), []);
  });
});
