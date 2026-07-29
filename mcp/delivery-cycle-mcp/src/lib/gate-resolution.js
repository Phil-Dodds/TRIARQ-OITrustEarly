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

/** Forward resolution: the first gate in forward order that is NOT cleared.
 *  Returns { gate_name, label, target_date } or null when all gates resolved.
 *
 *  Contract 40 follow-on (CC-40-L, Phil 2026-07-28): "cleared" is now decided by
 *  the GATE RECORD approval status (approved | skipped) — the governance truth —
 *  NOT the milestone date_status. The milestone status is a free, user-controlled
 *  planning signal (D-205) that can run ahead of approval, which made this
 *  resolver disagree with the list headline + the Gate Wait Chip (both
 *  gate-records-based). Unifying every surface on gate-records approval fixes
 *  that. target_date still comes from the chosen gate's milestone row.
 *
 *  gateRecords: [{ gate_name, gate_status }]. When omitted (legacy call), falls
 *  back to milestone date_status so the function stays safe, but all in-repo
 *  callers pass gateRecords.
 *
 *  Contract 36 UAT correction retained: label is ALWAYS the canonical gate name;
 *  milestone_label ("Build Start" etc.) must never surface here. */
function resolveNextGate(milestoneDates, gateRecords) {
  const statusByGate = {};
  for (const g of (gateRecords || [])) { statusByGate[g.gate_name] = g.gate_status; }
  const haveGateStatus = (gateRecords || []).length > 0;

  for (const gate of GATE_FORWARD_ORDER) {
    const m = (milestoneDates || []).find(x => x.gate_name === gate);
    if (haveGateStatus) {
      const st = statusByGate[gate];
      // Cleared only when the gate record is approved or skipped.
      if (st === 'approved' || st === 'skipped') continue;
    } else {
      // Legacy fallback (no gate records supplied) — milestone date_status.
      if (!m) continue;
      if (m.date_status === 'complete') continue;
      if (m.date_status === 'skipped')  continue;
    }
    return {
      gate_name:   gate,
      label:       GATE_LABELS[gate] || gate,
      target_date: m?.target_date ?? null
    };
  }
  return null;
}

module.exports = { GATE_FORWARD_ORDER, GATE_LABELS, resolveGateStatusWalkback, resolveNextGate };
