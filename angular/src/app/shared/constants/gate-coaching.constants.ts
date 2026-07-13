// gate-coaching.constants.ts — D-527 (trimmed scope, 2026-07-13)
// In-app coaching for gate semantics. UI helper copy, NOT prompt text — no
// Arch-3 concern. Keys are the five canonical gate names (D-517/CC-36-13);
// an unknown key renders nothing, never a placeholder.
//
// Trimmed per Phil 2026-07-13: GATE_COACHING_FULL, OUTCOME_COACHING, and the
// dashboard header popover are HELD until the OI Library exists to own the
// training content — the modal will link there instead of embedding it.

/** Shared date-semantics line — shown while editing gate dates. */
export const GATE_DATE_SEMANTICS =
  'Target date: when you expect this gate approved — the next phase starts after approval. ' +
  'Actual date: when it was approved.';

/** One-line meaning per canonical gate — rendered under the gate name in read contexts. */
export const GATE_COACHING_SHORT: Record<string, string> = {
  'Brief Review':
    'The Context Brief is approved: assumptions challenged, Outcome declared, first phase scoped. Design begins after this gate.',
  'Go to Build':
    'Requirements and plan are approved — scenarios, real examples, Outcome statement, top risks documented. Engineering starts after this gate.',
  'Go to Deploy':
    'Pilot plan is ready and the DOL (operations/business owner) is ready. Pilot starts after this gate.',
  'Go to Release':
    'Pilot reviewed successfully, DOL consulted. Full rollout toward the planned Outcome starts after this gate.',
  'Close Review':
    'Outcome accomplished and reviewed with exec. Initiative closes after this gate.',
};
