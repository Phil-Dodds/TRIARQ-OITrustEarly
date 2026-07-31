# Gate Coaching Text Specification
Pathways OI Trust | Build C | v1.1 | 2026-07-14 | CONFIDENTIAL
Governing decisions: D-527, D-530 (amendment — trimmed build). Related: D-531 (Initiative Guide), D-517, D-514, D-510, D-519, D-49 (amended), D-108, D-154, P4.

**BUILD STATUS (D-530, CodeClose 2026-07-14):** Built — GATE_COACHING constants file (all four exports), Surface 1 as a single date-semantics line rendered full-width UNDER the gate row while a date editor is open (spec's below-the-fields placement rejected: 1fr date columns cannot hold the sentence), Surface 2 one-liner + "More →" deep link to the Initiative Guide (D-531). PARKED pending the OI Library decision (deferred item D-527-Remainder): per-gate line in editors, expandable FULL text in the modal, dashboard header popover (ACs 1-partial, 4, 5, 6). AC2 built; AC3/7/8 PASS.

---

## 1. Purpose and Scope

In-application coaching for Initiative gate semantics, rendered on three surfaces from a single content source. Origin: DCS confusion (2026-07-13) about whether gate target/actual dates are start dates or completion dates — the confusion occurred inside the gate date editor, so coaching renders at the point of use.

Scope: Angular only. No schema changes. No MCP changes. One new constants file, three component touch points.

---

## 2. Content Source — `GATE_COACHING` Constant

**Governing principles:** P1 (Self-Clarifying Labels), P4 (Proportional Governance)
**Governing decisions:** D-527: content lives in an Angular constant colocated with canonical gate names — not a database table. D-517: gate names come only from the canonical five; coaching keys must match them.

Create `src/app/shared/constants/gate-coaching.constants.ts` (colocate with, or adjacent to, the existing canonical gate name constants so the two cannot drift independently).

```typescript
/** Shared date-semantics line — shown in every gate date editor. */
export const GATE_DATE_SEMANTICS =
  'Target date: when you expect this gate approved — the next phase starts after approval. ' +
  'Actual date: when it was approved.';

/** One-line meaning per canonical gate — editor helper + popover rows. */
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

/** Full training text per canonical gate — gate sub-panel / modal expandable text. */
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

/** Outcome definition — rendered in the popover footer (Surface 3 only). */
export const OUTCOME_COACHING =
  'An Outcome is a business or operational result, not usually a technical one. What are the ' +
  'success metrics? How will the business know it was worth spending time and money on this?';
```

Keys are the canonical five gate names exactly (D-517). Lookup by canonical label; a missing key renders nothing (never a placeholder string).

---

## 3. Surface 1 — Gate Date Editors

**Governing principles:** P2 (Progressive Disclosure — inverted deliberately here), Principle: coaching at point of use
**Governing decisions:** D-527: helper text is ALWAYS VISIBLE in the editors — not hover/tap. The confusion occurred here; a hidden affordance would have been missed. D-514 pattern: helper text style and placement follow the cadence-named helper text treatment.

In the milestone/gate date editor (target date and actual date fields, Initiative detail → Milestones):

1. Below the date fields, render `GATE_DATE_SEMANTICS` in the D-514 helper-text visual style (same font size, color, spacing as the cadence helper text).
2. Below it, render `GATE_COACHING_SHORT[gateLabel]` for the gate being edited, same style.
3. Both lines are static text — no dismiss, no toggle, no per-user suppression.
4. If the editor is for a milestone with no canonical gate mapping, render only `GATE_DATE_SEMANTICS`.

## 4. Surface 2 — Gate Sub-Panel / Gate Record Modal

**Governing principles:** P2 (Progressive Disclosure)
**Governing decisions:** D-527: read context gets the short line always and the full text on demand. D-416: modal layout — coaching must not displace the header action bar.

In the gate sub-panel and GateRecordModal:

1. Directly under the gate name, render `GATE_COACHING_SHORT[gateLabel]` (helper-text style).
2. Below it, a "What this gate means →" text link toggles an expandable block containing `GATE_COACHING_FULL[gateLabel]`. Collapsed by default. No animation requirement.
3. Toggle state is not persisted (no D-171 memory — transient read affordance).

## 5. Surface 3 — Initiative Status Dashboard, Next Gate Column Header

**Governing principles:** P2 (Progressive Disclosure)
**Governing decisions:** D-519: the grid is density-optimized — coaching must be an affordance, never per-row text. D-510: Next Gate column definition unchanged.

1. The Next Gate column header gains an ⓘ icon after the label.
2. Click/tap opens a popover listing all five canonical gates in lifecycle order, each with its `GATE_COACHING_SHORT` line.
3. Popover footer renders `OUTCOME_COACHING` separated by a divider.
4. Popover closes on outside click or Esc. No screen-state memory.
5. No per-row coaching anywhere in the grid.

---

## 6. Acceptance Criteria

| AC | Criterion |
|---|---|
| 1 | Gate date editor shows the date-semantics line and the gate's one-liner, always visible, D-514 style |
| 2 | Editor for a non-gate milestone shows the date-semantics line only |
| 3 | Gate sub-panel and GateRecordModal show the one-liner under the gate name |
| 4 | "What this gate means →" expands to the full training text; collapsed by default |
| 5 | Dashboard Next Gate header ⓘ opens a popover with all five gates in lifecycle order + Outcome footer |
| 6 | Popover closes on outside click and Esc |
| 7 | All coaching strings resolve from gate-coaching.constants.ts — no literals in components |
| 8 | Coaching keys are the five canonical gate names (D-517); unknown key renders nothing |

## 7. Explicitly Out of Scope

- Database-stored or admin-editable coaching content (P4 — rejected)
- Per-user dismiss/suppression of editor helper text
- Coaching on Team Meetings surfaces
- Per-row grid coaching

---
*TRIARQ Health · Pathways OI Trust · CONFIDENTIAL · July 2026 · v1.0*
