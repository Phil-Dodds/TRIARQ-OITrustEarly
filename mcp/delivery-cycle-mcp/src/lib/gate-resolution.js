// gate-resolution.js — Contract 36 (§3.1 / D-419 extraction note)
// Shared gate resolution for delivery-cycle-mcp. The D-419 walkback exists in
// three team-meetings-mcp copies; the spec forbids a FOURTH duplicate — this
// module is the shared implementation for THIS service (services deploy
// separately, so cross-service sharing needs a package; deferred per
// deferred-items D-WalkbackExtraction).

'use strict';

const GATE_FORWARD_ORDER = [
  'brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'
];

const GATE_LABELS = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

// D-419 walkback: furthest-in-progress gate status.
const WALKBACK_CHAIN = ['go_to_deploy', 'go_to_build', 'brief_review'];

function resolveGateStatusWalkback(milestoneDates) {
  for (const gate of WALKBACK_CHAIN) {
    const m = (milestoneDates || []).find(x => x.gate_name === gate);
    if (!m || !m.date_status) continue;
    if (m.date_status === 'not_started') continue;
    if (m.date_status === 'skipped')     continue;
    return m.date_status;
  }
  return 'not_started';
}

/** CC-017 forward resolution: first gate in forward order not complete/skipped.
 *  Returns { gate_name, label, target_date } or null when all gates resolved. */
function resolveNextGate(milestoneDates) {
  for (const gate of GATE_FORWARD_ORDER) {
    const m = (milestoneDates || []).find(x => x.gate_name === gate);
    if (!m) continue;
    if (m.date_status === 'complete') continue;
    if (m.date_status === 'skipped')  continue;
    return {
      gate_name:   gate,
      label:       m.milestone_label || GATE_LABELS[gate] || gate,
      target_date: m.target_date ?? null
    };
  }
  return null;
}

module.exports = { GATE_FORWARD_ORDER, GATE_LABELS, resolveGateStatusWalkback, resolveNextGate };
