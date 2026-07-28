// contract40-sizing-idk.test.js — Contract 40 WS2 (D-598, amends D-558)
// "I don't know" (idk) on Q1/Q2/Q3: derives Large/Major/Significant, forces
// Level 2 minimum, distinct from unanswered. Q4/Q5 accept no stored idk.

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  deriveBaselineLevel,
  buildDerivationExplanation
} = require('../src/lib/governance-derivation');

function sizingRow(q1, q2, q3, extra = {}) {
  return {
    q1_investment: q1, q2_novelty: q2, q3_wrongness: q3,
    q4_security_impact: false, q5_ux: 'standard', ...extra
  };
}

describe('WS2 (D-598): IDK derivation', () => {

  // AC-5: IDK on each of Q1/Q2/Q3 derives its cautious value → Level 2.
  test('AC-5: Q1=idk derives Large → Level 2 (even trusted DCS)', () => {
    assert.equal(deriveBaselineLevel(sizingRow('idk', 'standard', 'contained'), true), 2);
  });
  test('AC-5: Q2=idk derives Major → Level 2', () => {
    assert.equal(deriveBaselineLevel(sizingRow('small', 'idk', 'contained'), true), 2);
  });
  test('AC-5: Q3=idk derives Significant → Level 2', () => {
    assert.equal(deriveBaselineLevel(sizingRow('small', 'standard', 'idk'), true), 2);
  });

  // AC-6: any single IDK on an otherwise Level-1-eligible baseline forces Level 2.
  test('AC-6: Small+Standard+Contained+Q1=idk (trusted) → Level 2, not Level 1', () => {
    assert.equal(deriveBaselineLevel(sizingRow('small', 'standard', 'contained'), true), 1); // control
    assert.equal(deriveBaselineLevel(sizingRow('idk', 'standard', 'contained'), true), 2);
  });

  // IDK never reaches Level 3 on its own (needs explicit xlarge / large_hard).
  test('IDK does not reach Level 3 without an explicit L3 answer', () => {
    assert.equal(deriveBaselineLevel(sizingRow('idk', 'idk', 'idk'), true), 2);
    assert.equal(deriveBaselineLevel(sizingRow('idk', 'idk', 'large_hard'), true), 3);
  });

  // Display: provenance chip attributes IDK as "Not yet known (treated as …)".
  test('explanation attributes IDK as Not yet known (treated as …)', () => {
    const chips = buildDerivationExplanation(sizingRow('idk', 'standard', 'contained'), true);
    assert.ok(chips.some(c => /Not yet known \(treated as Large\)/.test(c)));
  });
});

describe('WS2 (D-598): save-tool accepts idk on Q1/Q2/Q3 only', () => {
  const fs = require('node:fs');
  const src = fs.readFileSync(require.resolve('../src/tools/initiative_sizing.js'), 'utf8');

  // AC-4/AC-8: idk is an allowed value on q1/q2/q3 (distinct from null); the
  // q5_ux allow-list stays 2-valued (no idk), q4 is boolean (no idk).
  test('AC-4: q1/q2/q3 allow-lists include idk; q5 does not', () => {
    assert.match(src, /q1_investment:\s*\[[^\]]*'idk'/);
    assert.match(src, /q2_novelty:\s*\[[^\]]*'idk'/);
    assert.match(src, /q3_wrongness:\s*\[[^\]]*'idk'/);
    assert.doesNotMatch(src, /q5_ux:\s*\[[^\]]*'idk'/);
  });
});
