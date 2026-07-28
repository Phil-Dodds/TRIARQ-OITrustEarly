// contract40-skip-note.test.js — Contract 40 WS1 (D-489 restoration / D-596)
// The skip delegate must forward every submit-time param, incl. submission_note.
// AC-1: skip-submit with a note persists it. AC-3: D-596 conformance sweep —
// every param submit_gate_for_approval reads from params appears in the
// confirm_gate_skip forward. Source-level parity assertion.

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

describe('WS1 (D-596): skip-delegate param pass-through', () => {

  test('AC-3: every submit-time param is forwarded by confirm_gate_skip', () => {
    const submitSrc = fs.readFileSync(require.resolve('../src/tools/submit_gate_for_approval.js'), 'utf8');
    const skipSrc   = fs.readFileSync(require.resolve('../src/tools/confirm_gate_skip.js'), 'utf8');

    // Params destructured or read as params.<name> by submit_gate_for_approval.
    // delivery_cycle_id and gate_name are the identity args the skip delegate
    // supplies itself (gate_name := submitted_gate) — excluded from the sweep.
    const submitParams = [
      'submission_note',   // D-489 (WS1 restores this)
      'phil_override',
      'assessment',        // GA-1 / D-579
      'cast_confirmed',    // D-584
      'outcome_verdict',   // D-585
      'outcome_actual',
      'outcome_evidence'
    ];

    // Each param must actually be read by submit (guards a stale enumeration)
    // AND appear in the skip forward block.
    for (const p of submitParams) {
      assert.match(submitSrc, new RegExp(`params\\.${p}|\\b${p}\\b`),
        `submit_gate_for_approval should read ${p}`);
      assert.match(skipSrc, new RegExp(`\\b${p}\\b`),
        `confirm_gate_skip must forward ${p} (D-596 parity)`);
    }
  });

  test('AC-1: confirm_gate_skip forwards submission_note into the delegate call', () => {
    const skipSrc = fs.readFileSync(require.resolve('../src/tools/confirm_gate_skip.js'), 'utf8');
    // The forward is conditional on a string note, mirroring the direct path.
    assert.match(skipSrc, /params\.submission_note[\s\S]*submission_note:\s*params\.submission_note/);
  });
});
