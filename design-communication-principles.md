# Design & Communication Principles
Phil | EVP Performance & Governance | v1.2 | March 2026 | CONFIDENTIAL

Phil's personal operating standards. Claude applies these without being prompted. Flag violations. Phil indicates if application has gone too far in a specific case.

---

## 1.1 First Principles — Analytical Discipline

Before any large artifact: Context → Question → Reduce → Simplify → Automate. Each step must be satisfied before advancing.

**Phil-and-Claude application rules (not employee-facing):**
- **AR-1:** Apply as mental discipline in conversation, not as a formatted document (unless Phil explicitly requests one).
- **AR-2:** Name the step when applying it — "I'm at Reduce here."
- **AR-3:** Challenge the premise first (Question step) before moving to solution design.
- **AR-4:** Reduce shows what was CUT — not what was kept. If Reduce restates Context, it hasn't done its work.
- **AR-5:** Simplify the solution, not the reasoning visible to the reader. A communication that can't be disagreed with has been over-reduced.
- **AR-6:** Calibrate to the reader before producing any communication artifact for someone other than Phil.

---

## 1.2 Active Disagreement

Claude applies the Question step actively — surfaces disagreements, pressure-tests decisions, pushes back without being prompted. If a direction looks wrong, incomplete, or likely to cause downstream problems, flag it in the same response. Standing expectation, not an occasional request.

---

## 1.3 Session-End Term Capture

At session close, flag any terms used but not yet in the Terminology Register with a confirmed definition. Phil confirms, corrects, or defers each. Confirmed definitions added before session ends. If a critical term appears mid-session with an unclear definition — ask in the moment, then add at close.

---

## 1.4 Labeled Questions

When a response contains more than one question, label each: Q1, Q2, Q3 (or descriptive: Q-Accountable, Q-Granularity). Phil answers by label without restating. Applies to all multi-question responses. One question = no label needed.

---

## 2.1 Lead With the Point (Pyramid Principle)

Every communication opens with the main point, ask, or conclusion. Supporting context follows. Readers never work through setup to find what matters.

**Extension — Headline Before Body:** For any communication intended for an audience outside the design session, precede the body with a single headline sentence that distills the entire message. Define any session-native term before using it as if it's shared context.

---

## 3.1 No Bare Generic Nouns

Field names, column headers, UI labels, schema identifiers must never be bare generic nouns. Every generic noun (Date, Name, Type, Status, ID, Description, Notes) requires a clarifying adjective or qualifying noun.

Examples: Date → Submission Date / Approval Date. Name → Artifact Name / Approver Name. Status → Approval Status / Lifecycle Status. Notes → Reviewer Notes / Decline Explanation.

Applies to: DB schemas, API response fields, UI labels, form fields, report columns, any named identifier.

---

## 4.1 Design Before Specialization

Build foundation-layer capabilities before specialized workflows. A configurable foundation that handles the general case allows specialization to be delivered as configuration, not parallel engineering. Applies at every layer: schema, API, UI, governance.

Example: Eight primitives (D-80) before any named use case. Delivery Cycle as a configurable Record+Lifecycle before specialized UC-01 workflow. Division as the universal container before Trust-specific configuration.

---

## 4.2 Visible Context on Every Surface

Every screen shows: What this is (context), Why it matters (purpose), How to act (next action). Novice-first default. Progressive disclosure for advanced options. Clarity over elegance. Applies to blocked action UX (D-140): tell user what's blocked AND what needs to change.

---

## 5.1 Stage Track — UI Pattern

A Stage Track is a compact horizontal indicator that shows where a record sits in its lifecycle, how far it has progressed, and — where applicable — whether a gate is pending or blocked. It makes lifecycle position visible at a glance without requiring the reader to open the full record or interpret a status label in isolation.

**Pattern origin:** Adopted from the QPathways EMR referral workflow, where a horizontal node-and-line component communicates multi-step clinical workflow state using contextual icons and fill state. The OI Trust adapts this pattern for its own lifecycle surfaces.

### When to Use

Apply a Stage Track when all three conditions are met:

1. The record has a defined lifecycle with discrete, ordered stages (not just a status field with unordered values).
2. The viewer benefits from knowing relative position — how far along, what came before, what comes next.
3. The surface has enough horizontal space to render the track without collapsing it below legibility.

**Primary candidates in the OI Trust:**

| Surface | Lifecycle | Notes |
|---------|-----------|-------|
| Delivery Cycle detail view (right panel header) | BRIEF → DESIGN → SPEC → BUILD → VALIDATE → UAT → PILOT → RELEASE → OUTCOME → COMPLETE | 10 active stages — see condensed rendering rule below |
| Delivery Cycle dashboard row | Same — condensed to gate positions only | Show only the 5 gate nodes on the dashboard row; full stage track on detail view |
| OI Library artifact detail | Draft → Candidate → Under Review → Approved → Canon → Superseded | 5–6 nodes — straightforward fit |
| Approval workflow panel | Pending → Under Review → Decided | 3 nodes — minimal, use only if the panel has room and the workflow is multi-party |

**Do not apply** to registry entries (no meaningful ordered lifecycle), notification items, or any surface where the lifecycle has fewer than 3 stages or the stages are not ordered.

### Visual Design Rules

**Nodes:** Each stage is represented by a circular icon node. Use a contextual icon that reflects the stage's function — not a generic circle or number. Icon selection should be consistent across all instances of the same stage across the system.

**Connecting line:** A horizontal line connects nodes left to right. The line fills (using `--triarq-color-primary`) from left up to and including the current stage. Remaining line is muted (`--triarq-color-fog` or equivalent).

**Node states — four states, each visually distinct:**

| State | Visual Treatment | When Applied |
|-------|-----------------|--------------|
| Complete | Filled circle, primary color, checkmark or stage icon | Stages the record has passed through |
| Current | Filled circle, primary color, stage icon, subtle pulse or ring emphasis | The stage the record is in now |
| Gate pending | Filled circle, amber (`--triarq-color-sunray`), gate icon | A named gate is awaiting approval before the record can advance |
| Gate blocked | Filled circle, red/error color, blocked icon | Gate is overdue or the workstream is inactive |
| Upcoming | Outline circle only, muted | Stages not yet reached |

**Labels:** Node labels (stage names) are optional on the track itself. On the Delivery Cycle detail view, labels should appear below each node. On the dashboard row condensed version (gate nodes only), labels are suppressed — tooltip on hover is acceptable.

**Gate nodes:** Named gates (Brief Review, Go to Build, Go to Deploy, Go to Release, Close Review) are rendered as distinct nodes on the track — visually differentiated from stage nodes (e.g., diamond or shield icon vs. circle). Gates appear between the stages they separate, not as stages themselves.

### Condensed Rendering — Long Lifecycles

The Delivery Cycle lifecycle has 10 active stages plus 5 gates — too many nodes to render legibly at dashboard row scale. Two permitted rendering modes:

**Full mode** (detail view only): All 10 stage nodes plus 5 gate nodes rendered. Labels below nodes. Used in the right panel detail view where horizontal space is available.

**Condensed mode** (dashboard row): Gate nodes only — 5 nodes representing the 5 named gates. Current position inferred from which gates are complete vs. pending vs. upcoming. Stage name displayed as text adjacent to the track (e.g., "Currently in BUILD") rather than as a node. This keeps the dashboard row compact while preserving lifecycle visibility.

### Interaction Behavior

- Stage nodes are not interactive. The Stage Track is an orientation aid — position and progress only. Detail content lives in the view below the track, not in the track itself.
- Clicking a gate node opens the gate record — approver, status, target date, required artifacts.
- Clicking a pending gate node triggers the same action as the primary gate action button if the user has permission; otherwise shows a read-only gate detail.
- On mobile or narrow right panel, the track collapses to a single "Stage X of Y" text indicator with a small progress bar. The full track renders on expand.

### Implementation Notes

- Stage Track is a standalone Angular component: `StageTrackComponent`. Takes lifecycle definition, current stage, gate states, and display mode (full / condensed) as inputs.
- No business logic in the component. Stage state data comes from the delivery-cycle-mcp or oi-library-mcp response. The component renders only.
- Token mapping: complete/current nodes use `--triarq-color-primary`. Gate pending uses `--triarq-color-sunray`. Gate blocked uses the system error color. Upcoming nodes use `--triarq-color-fog`.
- Condensed mode is the default for dashboard rows. Full mode is the default for detail views. Mode is an explicit input — not inferred from screen width.
- Build sequence: implement full mode in Build C (Delivery Cycle detail view). Implement condensed mode for dashboard row in the same build. Apply to OI Library artifact detail in Build B.
