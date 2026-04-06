# Build C Completion Audit
Pathways OI Trust | Build C | April 2026 | CONFIDENTIAL
<!-- SECTION-H: passthrough to for-ClaudeCode.zip — do not edit -->

---

## Purpose

Build C Groups A–F are reported complete. Before declaring Build C done and opening the next Code session, audit every surface specified in build-c-supplement-spec.md against the current implementation. This audit is required — do not skip it.

**Audit protocol:**
1. For each surface below, navigate to it in the running application.
2. Check each criterion listed.
3. Record PASS, FAIL, or PARTIAL with a one-line description.
4. Surfaces with any FAIL or PARTIAL require a correction pass before Build C closes.
5. Apply Rule C (conflict check) before implementing any correction — check CC-decisions and session-brief D-numbers for that surface first.

**After the audit:** produce a brief audit report in the CodeClose output listing each surface and its result. Phil reviews before the next Code session opens.

---

## Prerequisite — Run Conflict Check First

Before implementing any correction this session, run the Rule C conflict check:
- Review CC-decisions from the 2026-04-04 and 2026-04-04-B CodeClose outputs for the surface being corrected.
- Review relevant D-numbers in the session-brief (D-177 through D-187 are the primary Build C decisions).
- Surface any conflict before implementing. Do not resolve unilaterally.

---

## Surface 1 — Create Cycle Form

**Governing spec:** build-c-supplement-spec.md Section 3 + OITrust-CreateCycleForm-CorrectionSpec-2026-04-05.md (correction spec — takes precedence for this surface)

This surface has confirmed violations from Design Session review. Apply the correction spec. Run conflict check first.

| Criterion | Check |
|-----------|-------|
| Form opens as right panel — dashboard visible behind it | |
| Exactly 8 fields in correct order (Title, Division, Workstream, Tier, DS, CB, Outcome Statement, Jira Epic Link) | |
| No Target Dates section present | |
| Delivery Workstream required, not optional | |
| Tier Classification renders as radio group, no default | |
| DS and CB show inline gate-requirement notes | |
| Outcome Statement shows persistent amber warning when empty | |
| Create button labeled "Create Delivery Cycle" | |
| QPathways design tokens applied throughout (Roboto, correct colors, radius values) | |
| On success: panel closes, new row at top of list, snackbar confirms | |

**Governing principles:** Principle 10 (Right-Panel Entity Detail, D-180), Principle 14 (Entity Name Capitalization, D-184)

---

## Surface 2 — Gate Action Permission Matrix

**Governing spec:** build-c-supplement-spec.md Section 1

| Criterion | Check |
|-----------|-------|
| Gate action buttons render only for users with authority — no ghost buttons, no unexplained disabled states | |
| Accountable user sees Approve + Return buttons | |
| Consulted user sees advisory Approve + Decline buttons | |
| Informed user sees no action buttons | |
| DS sees Submit gate on own cycles only | |
| CB sees Submit gate on own cycles only | |
| CE sees no action buttons on any surface | |
| Phil sees all actions across all Trusts | |

**Governing principles:** Principle 10 (D-180 — blocked action UX shows what's blocked and what must change)

---

## Surface 3 — Gate Detail Sub-Panel

**Governing spec:** build-c-supplement-spec.md Section 2

| Criterion | Check |
|-----------|-------|
| Clicking a gate node in Stage Track opens gate detail sub-panel | |
| Sub-panel renders inline below Stage Track — not a modal | |
| Sub-panel shows: gate name, target date, actual date, status, approver routing, required checklist | |
| Checklist items correct for each of the 5 gates | |
| Only one sub-panel open at a time — opening second closes first | |
| Sub-panel dismissible via ✕ or clicking another gate node | |

---

## Surface 4 — Artifact Attach Interaction

**Governing spec:** build-c-supplement-spec.md Section 4

| Criterion | Check |
|-----------|-------|
| Each artifact slot renders as a card with guidance text | |
| Current and past stage slots are active | |
| Future stage slots visible but dimmed with "Available when cycle reaches [STAGE]" label | |
| File attach: inline file picker, no modal | |
| ClamAV scan spinner shown during scan | |
| Clean result: green checkmark shown on slot | |
| Rejected file: inline error in slot — "File rejected by malware scan. Remove and try a different file." | |
| External URL attach: inline form expands below slot, no modal | |
| External URL fields: Display Name (pre-filled, editable) + External URL | |
| Ad hoc attachment: "+ Attach Document" link at bottom of each stage section | |
| Build Report slot OI Library button renders as informational stub — not an error, not wired | |

---

## Surface 5 — Delivery Workstream Admin UI

**Governing spec:** build-c-supplement-spec.md Section 5

| Criterion | Check |
|-----------|-------|
| Page header: "Delivery Workstream Registry" | |
| Subheading text present (inactive workstream warning language) | |
| All 6 columns present: avatar, Workstream Name, Home Division, Workstream Lead, Active Cycle Count, Active Status | |
| Workstream Name tappable → right panel detail | |
| Home Division tappable → Division Detail Panel | |
| Workstream Lead tappable → User Detail Panel | |
| Active Status renders as pill badge: Active (green) / Inactive (gray) | |
| Inactive workstream row shows amber warning band | |
| Filter toggle: Active / Inactive / All (default: Active) | |
| "+ New Workstream" button present top right | |

**Governing principles:** Principle 11 (Tappable Entity Chips, D-181)

---

## Surface 6 — Home Screen Delivery Card

**Governing spec:** build-c-supplement-spec.md Section 6

| Criterion | Check |
|-----------|-------|
| Card visible to DS and CB roles; not visible to Phil, CE, Admin (per D-150) | |
| Card header: "My Delivery Cycles" | |
| Up to 3 cycle rows shown, each with: title, stage badge, next gate name + target date, tier badge | |
| Footer link: "View all [N] cycles →" | |
| Empty state: "No active cycles assigned to you." with "+ Start a Delivery Cycle" link | |
| Data scoped to cycles where current user is assigned DS or CB | |

---

## Surface 7 — Delivery Hub Summary Cards

**Governing spec:** build-c-supplement-spec.md Section 7

| Criterion | Check |
|-----------|-------|
| Four summary cards present at top of Delivery hub | |
| Card 1: Active Cycles — count + stage breakdown | |
| Card 2: Gates Awaiting Your Action — count + oldest gate info | |
| Card 3: Overdue Gates — count, amber accent when count > 0 | |
| Card 4: Active Workstreams — count + total active cycle count | |
| Each card is a tap target that filters the dashboard below | |

---

## Surface 8 — Role-Differentiated Views

**Governing spec:** build-c-supplement-spec.md Section 8

| Criterion | Check |
|-----------|-------|
| Phil sees all cycles across all Trusts | |
| DS sees cycles in own Divisions only | |
| CB sees cycles in own Divisions only | |
| CE sees cycles in own Divisions — read-only, no action buttons | |
| Admin sees cycles in administered Divisions | |
| No role-specific Angular component trees — single DeliveryDashboardComponent for all roles | |
| Role differentiation via MCP data scope + conditional button rendering only | |

---

## Surface 9 — Build Report Stub

**Governing spec:** build-c-supplement-spec.md Section 9

| Criterion | Check |
|-----------|-------|
| Build Report slot present in BUILD stage artifact section | |
| Slot guidance text correct: "As-built record — what was built, how it works, deviations from spec." | |
| Standard attach interaction works (file or URL) | |
| "Submit to OI Library" button present but renders as stub — informational note, not error | |
| Business rules MCP blocks Go to Deploy if Build Report slot has no attachment (Tier 2+) | |
| Blocked action message correct: "Delivery Cycle Build Report required before Go to Deploy gate can be submitted." | |

---

## Surface 10 — Jira Sync Panel

**Governing spec:** build-c-supplement-spec.md Section 10

| Criterion | Check |
|-----------|-------|
| Jira sync panel present on Cycle Detail View, in Identity Zone | |
| State 1 (no Jira link): "Not linked" text + "+ Link Jira Epic" action | |
| State 2 (link present, API not configured): epic key displayed + informational warning note | |
| State 3 (link present, API configured): epic key + "Sync Now" + last synced timestamp | |
| Inline link form: single "Jira Epic Key" field, Save / Cancel, no API validation | |
| Sync Now triggers sync_jira_epic tool call | |
| Correct governance fields written to Jira: Outcome Statement, Context Brief Link, Tier Classification, Tech Spec Status | |

---

## Visual Quality Check — Prototype Fidelity

**Governing reference:** BuildsACBprototypesv2.pptx (Build C slides 1–4 of 4)

The prototypes are the visual target. After completing the functional audit above, do a visual pass against the prototypes.

| Check | Notes |
|-------|-------|
| Dark navy sidebar matches prototype (`--triarq-color-primary` #257099) | |
| Navigation items and active state match prototype | |
| Card layouts match prototype proportions and hierarchy | |
| Stage Track condensed mode (5 gate diamonds) matches prototype dashboard row | |
| Stage Track full mode (10 stage nodes + 5 gate nodes) matches prototype detail view | |
| Entity chips render as pill-shaped (radius-pill), muted background, avatar or icon | |
| Right panel layout and proportions match prototype | |
| Typography: Roboto throughout, correct h-scale per D-151 | |
| Color usage matches prototype — Deep Navy headers, Oravive accents, Sunray for warnings | |

Where a prototype detail conflicts with a locked D-number decision: the D-number takes precedence. Surface the conflict in the CodeClose output — do not resolve unilaterally.

---

## Audit Report Format (include in CodeClose output)

```
BUILD C COMPLETION AUDIT — [DATE]

Surface 1 — Create Cycle Form: [PASS / FAIL / PARTIAL]
[one-line description if not PASS]

Surface 2 — Gate Action Permission Matrix: [PASS / FAIL / PARTIAL]
...

Surface 10 — Jira Sync Panel: [PASS / FAIL / PARTIAL]

Visual Quality Check: [PASS / FAIL / PARTIAL]

Corrections applied this session: [list or "None"]
Corrections deferred (with reason): [list or "None"]
Conflicts surfaced: [list or "None"]
```

---

*Pathways OI Trust · Empower | Optimize | Partner · CONFIDENTIAL · April 2026*
