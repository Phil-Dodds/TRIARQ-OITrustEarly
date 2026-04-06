# Create Cycle Form — Correction Spec
Pathways OI Trust | Build C | April 2026 | CONFIDENTIAL
<!-- SECTION-H: passthrough to for-ClaudeCode.zip — do not edit -->

---

## Purpose

The Create Cycle form as currently implemented has multiple violations of locked decisions and the supplement spec. This document is the authoritative correction spec. Rebuild the form against this document. Do not preserve the current implementation — replace it.

---

## 1. Form Container

**Violation:** Form currently renders as a full-page overlay, replacing the dashboard.

**Correct behavior:** The form opens as a right panel alongside the Delivery Cycle dashboard. The dashboard remains visible and navigable behind it. This is the Right-Panel Entity Detail Pattern (D-180, docs/design-principles.md Principle 10).

- Triggered by the \"+ New Cycle\" button on the dashboard
- Right panel slot — same slot used by cycle detail view
- Dashboard list remains visible on wide viewports
- On mobile/narrow viewports: panel takes full width per D-180 mobile rule
- Dismiss: ✕ button top right of panel, or Cancel button at form bottom

**Governing principles:** Principle 10 (Right-Panel Entity Detail, D-180)

---

## 2. Field Specification

Exact fields, labels, required state, and interaction type. No other fields. Remove Target Dates — those belong on the cycle detail view, not the create form.

| # | Field Label | Required at Creation | Input Type | Notes |
|---|-------------|---------------------|------------|-------|
| 1 | Delivery Cycle Title | Required | Text input, max 120 chars | Placeholder: \"e.g. Member Attribution Model\" |
| 2 | Division | Required | Dropdown | Divisions the current user has access to. If user has access to only one Division, pre-populate and set read-only. |
| 3 | Delivery Workstream | Required | Dropdown | Active workstreams in the selected Division only. Inactive workstreams not shown. Populates after Division is selected — shows empty state \"Select a Division first\" until Division is set. |
| 4 | Tier Classification | Required | Radio: Tier 1 / Tier 2 / Tier 3 | No default — user must explicitly choose. |
| 5 | Assigned Domain Strategist | Optional | Dropdown | DS-role users in the selected Division. Nullable at creation. Show inline note below field: \"Required before Brief Review gate.\" |
| 6 | Assigned Capability Builder | Optional | Dropdown | CB-role users in the selected Division. Nullable at creation. Show inline note below field: \"Required before Go to Build gate.\" |
| 7 | Outcome Statement | Optional | Textarea | Show persistent amber inline warning below field: \"Outcome Statement should be set before Brief Review. You can add it now or after creation.\" Not a validation error — form submits without it. |
| 8 | Jira Epic Link | Optional | Text input | Placeholder: \"e.g. PS-2026-041\". Not validated against Jira at creation. Show inline note: \"Required before Go to Build gate.\" |

This is the complete field set. Do not add fields. Do not reorder.

**Governing principles:** Principle 6 (No Bare Generic Nouns, D-184 — use exact labels above)

---

## 3. Form Behavior

- Division selection triggers Delivery Workstream dropdown refresh — active workstreams in that Division only.
- Workstream selection pre-populates Division if Division not yet set (Workstream home Division). Overridable by user.
- Create button label: **\"Create Delivery Cycle\"** — not \"Create Cycle\", not \"Submit\".
- On success: right panel closes, new cycle row appears at top of dashboard list, snackbar: \"Delivery Cycle created.\"
- On validation failure: inline field-level error messages. Do not use a top-of-form error summary.
- Starting lifecycle stage is always BRIEF — system-set, never shown as a user field.

---

## 4. Design Token Requirements

**Violation:** Current form has no design tokens applied — wrong font, no brand colors, no correct radius values.

Apply QPathways design tokens throughout (D-151, docs/design-principles.md):

- **Font:** Roboto throughout. No Gill Sans or Lato.
- **Form field labels:** h6 (20px) — metadata label size
- **Section headers within form:** h5 (24px)
- **Input border radius:** radius.input = 5px
- **Button border radius:** radius.button = 5px
- **Primary action button (Create Delivery Cycle):** background `--triarq-color-primary` (#257099), white text
- **Secondary/cancel button:** outlined, `--triarq-color-primary` border, `--triarq-color-primary` text
- **Amber inline warnings:** `--triarq-color-sunray` (#F2A620) — for Outcome Statement null warning and gate requirement notes
- **Panel header:** `--triarq-color-primary` background, white text
- **Required field indicator:** asterisk (*) after label, consistent with system pattern

---

## 5. What to Remove

The following are in the current implementation and must be removed:

- Target Dates section (Brief Review, Go to Build, Pilot Start, Production Release, Close Review date inputs) — these belong on the cycle detail view, not the create form
- \"The cycle starts in Brief stage. Title should describe the deliverable...\" instructional text block — replace with the panel header only
- Any plain-text \"— Assign later —\" placeholder patterns — use proper dropdown empty states

---

## 6. Acceptance Criteria

1. Form opens as right panel — dashboard remains visible behind it on wide viewports
2. Exactly eight fields present in the order specified in Section 2
3. No Target Dates fields present
4. Division dropdown populated with user-accessible Divisions
5. Delivery Workstream dropdown shows active workstreams only, populates after Division selection
6. Tier Classification renders as radio group with no default selection
7. Assigned DS and Assigned CB render as dropdowns with inline gate-requirement notes
8. Outcome Statement shows persistent amber warning when empty — form still submits
9. Create button labeled \"Create Delivery Cycle\"
10. All QPathways design tokens applied — Roboto font, correct colors, correct radius values
11. On success: panel closes, new row at top of dashboard, snackbar confirmation

---

*Pathways OI Trust · Empower | Optimize | Partner · CONFIDENTIAL · April 2026*
