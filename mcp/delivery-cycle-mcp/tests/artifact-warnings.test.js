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
function type({ id, name, primary, behavior, active = true }) {
  return {
    artifact_type_id:      id,
    artifact_type_name:    name,
    primary_gate:          primary,
    gate_warning_behavior: behavior,
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
