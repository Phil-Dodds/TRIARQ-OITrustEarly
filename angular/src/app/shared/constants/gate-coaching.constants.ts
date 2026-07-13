// gate-coaching.constants.ts — D-527 (trimmed scope, 2026-07-13)
// In-app coaching for gate semantics. UI helper copy, NOT prompt text — no
// Arch-3 concern. Keys are the five canonical gate names (D-517/CC-36-13);
// an unknown key renders nothing, never a placeholder.
//
// Point-of-use surfaces render the one-liners; the FULL text and Outcome
// definition render on the Initiative Guide (/initiatives/guide) — the OI
// Library seed page — which point-of-use links deep-link into.

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

/** Full training text per canonical gate — Initiative Guide gate sections. */
export const GATE_COACHING_FULL: Record<string, string> = {
  'Brief Review':
    'The Context Brief is approved. We challenged our assumptions, weighed what could be removed entirely, and declared the Outcome — a black-and-white statement of how the business improves and how we\'ll know we\'re done. We aligned on what is likely part of the first phase and what might come later. We are looking for a meaningful first phase that adds business value and achieves learning, without overbuilding or excessive complexity. Design work begins after this gate. Don\'t polish requirements or Figmas before it — everything is still being questioned here. This gate is the cheapest place to stop a wrong effort.',
  'Go to Build':
    'Our requirements and plan are good and approved. To clear this gate we need: scenarios (main, secondary, gotcha); real examples; possibly user Figmas; a confirmed Outcome statement; and documented top risks (technical, operational, user, other). Engineering starts now. Heavy coding before this gate risks building the wrong thing fast.',
  'Go to Deploy':
    'We can pilot to a small target. The pilot plan is ready and the DOL — the operations/business owner — is ready to run it in the real world.',
  'Go to Release':
    'We reviewed a successful pilot — with the DOL consulted on whether it truly worked in operations — and now we roll out to more places to accomplish the full planned Outcome.',
  'Close Review':
    'The Outcome is accomplished and reviewed with exec. The initiative closes.',
};

/** Outcome definition — Initiative Guide Outcome section. */
export const OUTCOME_COACHING =
  'An Outcome is a business or operational result, not usually a technical one. What are the ' +
  'success metrics? How will the business know it was worth spending time and money on this?';
