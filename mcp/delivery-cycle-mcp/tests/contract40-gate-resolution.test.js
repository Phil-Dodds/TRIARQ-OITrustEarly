// contract40-gate-resolution.test.js — Contract 40 follow-on (CC-40-L)
// resolveNextGate resolves the next gate from gate-records approval status
// (governance truth), not milestone date_status. This unifies the status
// dashboard GATE column with the list headline + Gate Wait Chip. Regression:
// the MIU Tableau case — Brief Review milestone marked complete while the Brief
// Review gate is still only awaiting_approval — must resolve to Brief Review,
// not skip ahead to Go to Build.

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { resolveNextGate } = require('../src/lib/gate-resolution');

const ALL_MS = [
  { gate_name: 'brief_review',  date_status: 'complete',    target_date: '2026-07-01' },
  { gate_name: 'go_to_build',   date_status: 'not_started', target_date: '2026-08-07' },
  { gate_name: 'go_to_deploy',  date_status: 'not_started', target_date: null },
  { gate_name: 'go_to_release', date_status: 'not_started', target_date: null },
  { gate_name: 'close_review',  date_status: 'not_started', target_date: null }
];

describe('CC-40-L: resolveNextGate from gate-records approval', () => {

  test('milestone complete but gate awaiting → still resolves to that gate (MIU Tableau case)', () => {
    const gates = [
      { gate_name: 'brief_review', gate_status: 'awaiting_approval' },   // NOT approved yet
      { gate_name: 'go_to_build',  gate_status: 'not_started' }
    ];
    const next = resolveNextGate(ALL_MS, gates);
    assert.equal(next.gate_name, 'brief_review');
    assert.equal(next.label, 'Brief Review');
  });

  test('gate approved → skipped; resolves to the next unapproved gate', () => {
    const gates = [
      { gate_name: 'brief_review', gate_status: 'approved' },
      { gate_name: 'go_to_build',  gate_status: 'awaiting_approval' }
    ];
    const next = resolveNextGate(ALL_MS, gates);
    assert.equal(next.gate_name, 'go_to_build');
    assert.equal(next.target_date, '2026-08-07');   // from the milestone row
  });

  test("'skipped' gate is treated as cleared", () => {
    const gates = [
      { gate_name: 'brief_review', gate_status: 'skipped' },
      { gate_name: 'go_to_build',  gate_status: 'skipped' },
      { gate_name: 'go_to_deploy', gate_status: 'awaiting_approval' }
    ];
    assert.equal(resolveNextGate(ALL_MS, gates).gate_name, 'go_to_deploy');
  });

  test('all gates approved → null', () => {
    const gates = ['brief_review','go_to_build','go_to_deploy','go_to_release','close_review']
      .map(g => ({ gate_name: g, gate_status: 'approved' }));
    assert.equal(resolveNextGate(ALL_MS, gates), null);
  });

  test('legacy fallback: no gate records → milestone date_status', () => {
    // Brief complete (milestone), no gate records supplied → falls back to
    // milestone status and skips brief_review.
    const next = resolveNextGate(ALL_MS);
    assert.equal(next.gate_name, 'go_to_build');
  });
});
