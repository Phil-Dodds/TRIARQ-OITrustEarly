// board-trigger.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G1
// Detects whether a gate is board-triggered for a given Initiative — i.e. the
// gate where the AI Production Board requirement attaches (D-560: board gates
// are exempt from IE override; migration 075 documents the placement rules).
//
// Mirrors the enforcement conditions in submit_gate_for_approval.js
// (external product-embedded AI → Go to Deploy; internal AI → Go to Release).
// Deliberately NOT extracted from the submit tool in G1 — zero behavior change
// to existing gate flows is a G1 acceptance criterion. Pattern-sweep candidate:
// G2 refactors submit_gate_for_approval to consume this helper.

'use strict';

/**
 * @param {object} cycle — delivery_cycles row with ai_functionality,
 *                         ai_delivery_form, ai_audience
 * @param {string} gate_name — canonical gate name
 * @returns {boolean} true when the AI Production Board requirement attaches
 *                    to this gate for this Initiative
 */
function isBoardTriggeredGate(cycle, gate_name) {
  if (cycle.ai_functionality !== 'yes') { return false; }

  // Embedded + external → Board approval attaches to Go to Deploy.
  if (
    gate_name === 'go_to_deploy' &&
    cycle.ai_delivery_form === 'product_embedded' &&
    cycle.ai_audience === 'external'
  ) {
    return true;
  }

  // Internal AI (embedded or analytics) → Board approval attaches to Go to Release.
  if (gate_name === 'go_to_release' && cycle.ai_audience === 'internal') {
    return true;
  }

  return false;
}

module.exports = { isBoardTriggeredGate };
