// gates.js
// Pathways OI Trust — delivery-cycle-mcp shared helper.
// Canonical five-gate constants. Extracted in Contract 29 to de-duplicate the
// GATE_NAME_DISPLAY / GATE_SEQUENCE / valid-gate-list maps that were being
// copy-pasted into each new tool file. Pre-existing tools keep their local
// copies for now; new tools import from here.

'use strict';

// Human-readable gate labels (D-154).
const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

// Gate ordinal position in the lifecycle (ARCH-12), used for sorting/sequencing.
const GATE_SEQUENCE = {
  brief_review:  1,
  go_to_build:   2,
  go_to_deploy:  3,
  go_to_release: 4,
  close_review:  5
};

// The set of valid gate_name values (CHECK-constraint mirror).
const VALID_GATES = Object.keys(GATE_SEQUENCE);

module.exports = { GATE_NAME_DISPLAY, GATE_SEQUENCE, VALID_GATES };
