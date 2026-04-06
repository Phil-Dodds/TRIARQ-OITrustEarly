# Claude Code Input — Part 3 of 3
# Build C Remaining Spec Items — 2026-04-04

Pathways OI Trust | April 2026 | CONFIDENTIAL

**This is Part 3 of 3. Parts 1 and 2 must be committed before starting this file.**

## Your instructions for this file

1. Read CLAUDE.md, AGENTS.md, and all governing documents — including the updated design-principles.md (v1.4) — before making any changes.
2. Apply all six items below to the current Build C implementation.
3. When a spec instruction conflicts with an implementation choice, raise the conflict against the named governing principle — do not resolve silently (Principle 6 — Debate Before Building).
4. Update `impl_status` to `built` in decisions-active.md for each decision as you complete its implementation.
5. After all six items are implemented: add D-185 through D-187 to decisions-active.md per the New Decisions section at the bottom of this file. Update decision-registry.md — next available is **D-188**.
6. Commit all changes and confirm completion.

Prior documents Claude Code has:

* build-c-spec.md (original)
* delivery-cycle-dashboard-spec.md
* build-c-supplement-spec.md (Part 2 of this session)
* design-principles.md v1.4 (Part 1 of this session)

Do not re-implement anything already solid in those documents.

---

## Item 1 — Milestone Date Status: Edit Interaction and System Override Rules

**Source:** Session 2026-03-24-N, Session 2026-03-24-O
**Governing principles:** Principle 3 (Visible Context), Principle 13 (Destructive Action Confirmation), Principle 14 (Entity Name Capitalization)

The dashboard spec covers what the five statuses look like. This covers how the user sets them and how the system overrides them.

### Human-editable statuses

On Track and At Risk are human-set. Not Started is the system default. Complete and Behind are system-set and cannot be directly set by the user.

The edit control for a milestone date row in the cycle detail view:

```
[Gate Name]   Target: [date input]   Actual: [system-filled or —]   Status: [dropdown]
```

Status dropdown options rendered depend on current state:

| Current Status | Options Available to Human |
|---------------|---------------------------|
| Not Started | On Track, At Risk |
| On Track | Not Started, At Risk |
| At Risk | Not Started, On Track |
| Behind (system-set) | Not editable — system holds Behind until target date changes or Gate clears |
| Complete (system-set) | Unset Complete (requires reason — see below) |

Per Principle 3 (Visible Context): the dropdown renders only the options the user can actually take. Behind must not show a disabled dropdown — render no dropdown at all and show a muted label: "System-set — change target date to re-plan." This answers Why and How without requiring the user to guess.

### Target date input behavior

* Free date input on the target date field. User types or uses date picker.
* When target date is changed on a Milestone currently showing Behind: system automatically resets Status to Not Started. No confirmation required — the date change is the replanning signal.
* When target date is set for the current or next Gate: default Status is Not Started. User must affirmatively set On Track.
* When target date is set for a Gate two or more positions ahead of current stage: Status is Not Started and remains system-defaulted until the Delivery Cycle reaches that Gate. Dropdown rendered but grayed out with tooltip: "Status available when Delivery Cycle reaches this Gate." (Principle 14: capitalize Gate, Delivery Cycle.)

### Unsetting Complete

Complete is system-set when a Gate clears. A user can unset it if a Gate was approved in error ahead of a stage regression. Unsetting Complete is an irreversible action requiring a logged reason — per Principle 13 (Destructive Action Confirmation), Rule 1: state what will change before the user commits.

Confirmation flow (inline — not a modal, per Principle 13 Rule 3):

1. User clicks "Unset Complete" on the Milestone row.
2. Inline confirmation expands immediately below the row:
   * Impact statement: "Unsetting Complete will remove the recorded Gate clearance date and return this Milestone to Not Started. This cannot be undone without reapproving the Gate."
   * Required text field: "Reason for unsetting Complete" — minimum 10 characters. Per Principle 3: placeholder text explains why: "Required for audit trail — describe why this Gate clearance is being reversed."
   * Save / Cancel buttons.
3. Save commits the reason to the cycle audit trail and sets Status back to Not Started.
4. Cancel closes without change.

This is a compliance record — Gate approval and its reversal must both appear in the audit trail per D-179 and HITRUST/GRICS requirements.

### Warning for unset actual dates on passed stages

**Source:** Session 2026-03-24-F
**Governing principles:** Principle 3 (Visible Context), Principle 5 (Progressive Disclosure)

When a cycle has passed through a Gate (gate_status = approved) but the actual date on the corresponding Milestone is null: display a data quality warning on the cycle detail view. Per Principle 5 (Progressive Disclosure): show the summary warning first, then reveal the editable fields per affected row — do not expand all rows by default.

Warning renders as an amber inline alert at the top of the Gates & Milestone Dates section:

"[N] Milestone(s) are missing actual dates for Gates this Delivery Cycle has already passed. Actual dates are recorded automatically on Gate approval — if missing, the Gate may have been approved before date tracking was active. Add them manually to maintain a complete audit record."

(Principle 14: capitalize Gate, Milestone, Delivery Cycle in alert text.)

Each affected Milestone row shows an amber ⚠ icon beside the Actual date field. The Actual date field becomes editable for that row (normally system-set only). The system logs manual entries in the audit trail with a "manually entered" flag distinguishing them from system-recorded dates.

This is a data quality signal — not a Gate block. Delivery Cycles are not prevented from advancing.

---

## Item 2 — Artifact Stage Sections: Full Rendering Spec

**Source:** Session 2026-03-25-B, C, D, E, F, G
**Governing principles:** Principle 3 (Visible Context), Principle 5 (Progressive Disclosure), Principle 10 (Right-Panel Entity Detail), Principle 11 (Tappable Entity Chips), Principle 14 (Entity Name Capitalization)

The supplement (Part 2) covers the attach interaction for a single slot. This covers how stage sections and slots render in the cycle detail view.

### Stage section structure

The Artifacts section of the cycle detail view is organized by lifecycle stage. Per Principle 5 (Progressive Disclosure): current and past stages expanded by default, future stages collapsed — the user sees what is relevant now without being overwhelmed by the full set.

```
▼ BRIEF   [2 of 4 attached]        ← past stage — expanded
▼ BUILD   [1 of 4 attached]        ← current stage — expanded
▶ VALIDATE                          ← future stage — collapsed
▶ UAT                               ← future stage — collapsed
```

Expand/collapse behavior:

* Current stage: expanded by default.
* Past stages (Delivery Cycle has already been through them): expanded by default.
* Future stages: collapsed by default. Section header shows stage name only — no slot count. Label: "Available when Delivery Cycle reaches [STAGE]." User can expand to view slot names but Attach button does not render for future stages.

Per Principle 3 (Visible Context): every empty slot answers What (artifact type name) and Why (guidance text). A slot with no guidance text is an incomplete spec — all 24 named slots below have guidance text.

### Slot rendering

**Empty slot (no attachment):**

```
[Artifact type icon]  [Artifact Type Name]
[Guidance text from cycle_artifact_types.guidance_text]
[Attach ▾]  ← dropdown: "Add URL / Link" or "Upload File"
```

**Filled slot (attachment present, pointer_status = external_only):**

```
[File/link icon]  [Display Name]
Attached by [Name chip] · [timestamp]          ← Name chip per Principle 11
[View]  [Replace]  [Remove]  [Promote to OI Library ▾]
```

"Attached by [Name]" renders the user name as a tappable chip per Principle 11 — tap opens User detail panel per Principle 10.

**Filled slot promoted to OI Library (pointer_status = promoted):**

```
[OI Library icon]  [Display Name]
OI Library: [Artifact Title chip] · [Lifecycle Status badge]   ← primary, tappable chip
External: [URL truncated] · Archived reference                  ← secondary, plain text
[View in OI Library]  [Replace]
```

Artifact Title is a tappable chip per Principle 11 — tap opens OI Library artifact detail in right panel per Principle 10.

**Future stage slot (collapsed section):** Not rendered — only section header visible when collapsed.

### Full seed list by stage

Seed in cycle_artifact_types migration. All slots visible to all tiers (Session 2026-03-25-C).

| Stage | Artifact Type Name | Guidance Text |
|-------|-------------------|---------------|
| BRIEF | Context Brief | The primary knowledge artifact for this Delivery Cycle. Captures domain context, question, and Outcome Statement. |
| BRIEF | Scenario Journeys | Illustrative journeys showing the before/after experience this Delivery Cycle improves. |
| BRIEF | True-life examples | Real cases or data points that ground the Context Brief. |
| BRIEF | Stakeholder input record | Notes or artifacts capturing input from affected stakeholders. |
| DESIGN | Design session output | Notes, decisions, or artifacts produced in the design session for this Delivery Cycle. |
| DESIGN | UI/UX mockup | Screen mockups or wireframes for any user-facing components. |
| DESIGN | Process flow diagram | Diagram of the process or workflow this Delivery Cycle modifies or automates. |
| SPEC | Technical Specification | The complete technical spec reviewed and approved at the Go to Build Gate. |
| SPEC | Cursor prompt | The initial Cursor/Claude Code prompt translating the Technical Specification into build instructions. |
| SPEC | Architecture Decision Record | ADR if this Delivery Cycle requires a significant architectural decision with downstream consequences. |
| SPEC | Agent Registry entry | Required for Tier 3 Delivery Cycles deploying an agent. |
| BUILD | Governing document bootstrap log | Log confirming current governing documents were loaded at Claude Code session start. |
| BUILD | Mend scan results | SCA scan results confirming no unmitigated critical/high CVEs before QA. |
| BUILD | Code review sign-off | Capability Builder code review record confirming AI output quality and secure coding practices. |
| BUILD | Delivery Cycle Build Report | As-built record — what was built, how it works, deviations from spec. Complete before Go to Deploy. Input to Pilot, training, and OI Library submission. |
| VALIDATE | QA test results | Test run results confirming functional validation against the Outcome Statement. |
| VALIDATE | OWASP ZAP scan | DAST scan results from Staging environment. Required before UAT. |
| VALIDATE | Wiz posture report | CSPM scan results from Staging environment. Required before UAT. |
| UAT | UAT sign-off record | Formal sign-off confirming UAT criteria were met. |
| UAT | 7-step governance checklist | Confirmation all 7 steps of agentic governance are wired. Tier 3 only — slot visible to all tiers with guidance note for Tier 1/2: "Required for Tier 3 Delivery Cycles only." |
| UAT | HITRUST/GRICS checklist | HITRUST/GRICS compliance acceptance criteria pass/fail checklist. Tier 3 only — same visibility rule as above. |
| PILOT | Pilot Plan | Who participates, scope, duration, success criteria, and rollback triggers. Required if PILOT stage is active. |
| PILOT | Pilot observations log | Running record of observations during pilot. |
| RELEASE | Wiz continuous monitoring baseline | Baseline Wiz posture for Production continuous monitoring. |
| OUTCOME | Outcome measurement record | Measurement of the Outcome Statement — did this Delivery Cycle achieve what it committed to? |

Ad hoc slot: always available on every stage. `artifact_type_id = null`. Display Name is user-provided. No guidance text — the Attach form shows: "Add any supporting document for this stage."

### Pointer status display rules

| pointer_status | Display |
|---------------|---------|
| external_only | File or link icon. "Promote to OI Library" action available. |
| promoted | OI Library icon. OI Library Artifact as primary tappable chip (Principle 11). External URL as archived reference — plain text, not a chip. No "Promote" action — already promoted. |
| oi_only | OI Library icon. OI Library Artifact as tappable chip. No external URL. |

---

## Item 3 — Dashboard Filter UI: Division Filter and Workstream Filter Grouping

**Source:** D-166 (Claude Code), D-167 (Claude Code)
**Governing principles:** Principle 3 (Visible Context), Principle 5 (Progressive Disclosure), Principle 14 (Entity Name Capitalization)

### Division filter (D-166)

Per Principle 5 (Progressive Disclosure): filter only rendered when it adds value — hidden for users with a single Division assignment.

* Rendered only when the current user has more than one directly-assigned Division, or is Phil/Admin (who see all Divisions).
* Label: "Division" (Principle 14 — capitalize).
* Default: "All Divisions."
* When a specific Division is selected: "Include child Divisions" checkbox appears below the dropdown. Default: unchecked. Per Principle 3: checkbox label reads "Include child Divisions" — not "recursive" or "all below."
* When "All Divisions" selected: checkbox hidden.
* MCP params: `division_id` (null = all) + `include_child_divisions` (boolean, only sent when `division_id` is set).

### Workstream filter grouping (D-167)

Per Principle 3 (Visible Context): the grouping makes the difference between "no Workstream assigned" and "inactive Workstream" immediately visible — these are different conditions requiring different responses.

Three groups — never merged:

```
No Workstream assigned          ← Group 1 (always first — Principle 14: capitalize Workstream)
────────────────────────
RCM Core Team                   ← Group 2: Active Workstreams (alphabetical)
Value Services CB Team
Foundry Analytics
────────────────────────
Platform Integrations (inactive) ← Group 3: Inactive Workstreams (dimmed, labeled)
```

"No Workstream assigned" = expected early-scoping state. "Inactive Workstream" = blocked-Gate condition. Merging them hides the blocked-Gate signal from users filtering for unassigned Delivery Cycles.

---

## Item 4 — Filter and Sort Memory on Delivery Cycle Screens

**Source:** Session 2026-04-04 D-171
**Governing principles:** Principle 4 (No Bare Generic Nouns — screen key naming), Principle 9 (Three-Tier Loading — skeleton on restore)

First implementation was admin.users in Build A. All Build C screens with filter or sort controls must implement it at build time — not as a retrofit.

| Screen | Screen Key | Controls to Persist |
|--------|-----------|---------------------|
| Delivery Cycle dashboard | `delivery.cycles` | Workstream filter, Division filter, include-child-divisions, Tier filter, next-gate filter, sort column, sort direction |
| Workstream Summary | `delivery.workstreams` | Sort column, sort direction |
| Division Summary | `delivery.divisions` | Sort column, sort direction |
| Gate Summary | `delivery.gates` | Gate type filter, sort column, sort direction |

Rules:

* Search text fields: never persisted — always return to blank default.
* Discrete controls only: filter dropdowns, filter chips, sort column, sort direction.
* 7-day recency threshold: `SCREEN_STATE_RECENCY_DAYS = 7` — use the existing constant.
* Screen keys are dot-separated constants declared at the top of the component file. Never constructed dynamically (Principle 4: self-clarifying names, declared not inferred).
* Upsert to `user_screen_state` on every render.
* Per Principle 9: when filter state is being restored on screen load, the list area shows Tier 1 skeleton rows until the filtered data arrives — same as a fresh load.

---

## Item 5 — Drill-Down Query Parameter Contract

**Source:** D-175 (Claude Code)
**Governing principles:** Principle 1 (Workflow Entry Point Completeness — every count drillable), Principle 3 (Visible Context — applied filters visible on landing)

Supported query parameters on `/delivery/cycles`:

| Param | Type | Effect |
|-------|------|--------|
| `workstream_id` | string (UUID) | Pre-selects Workstream filter; triggers filtered load |
| `division_id` | string (UUID) | Pre-selects Division filter; triggers filtered server load |
| `next_gate` | string (GateName) | Pre-selects Next Gate filter |

The cycle list reads these via `ActivatedRoute.queryParams` on init and applies them as initial filter values before the first data load.

Per Principle 3 (Visible Context): when the user lands from a drill-down, the active filter controls must visually reflect the applied filters. The user must be able to see what landed them here and remove the filter if needed — do not load a filtered list silently with no indication of what filter is applied.

All three params are independent and combinable: `/delivery/cycles?workstream_id=X&next_gate=go_to_build`

---

## Item 6 — Action Queue Name Confirmed

**Source:** D-180 (locked this session)
**Governing principles:** Principle 14 (Entity Name Capitalization)

"Action Queue" is the confirmed name. No rename as new action types are added unless a specific UX problem requires it. Gate approvals (Accountable) and Gate reviews (Consulted) are the first two action types — similar enough to live together in the same queue.

Per Principle 14: capitalize "Action Queue" in all user-facing text — labels, card headers, empty states, MCP error messages. "My Action Queue" on home screen card. "Items in your Action Queue" in notifications.

---

## New Decisions Locked This Session

Add these to decisions-active.md with `impl_status: specced`. Update decision-registry.md — next available becomes **D-188**.

**D-185 — Principle Citation in Specs**
Every spec document produced by Claude Chat cites the governing design principle number(s) for each section, in brackets, at the section header. Format: `**Governing principles:** Principle N (Name), Principle N (Name)`. Purpose: Claude Code can debate a spec instruction against the named principle rather than against the spec detail in isolation. If a spec instruction appears to conflict with its cited principle, Claude Code raises the conflict explicitly per Principle 6 before building.
Source: Claude Chat | April 2026 | impl_status: specced

**D-186 — Implementation Status on Decisions**
Every decision in decisions-active.md carries an `impl_status` field with one of four values: `unspecced` (locked but no spec document yet produced), `specced` (included in a spec document given to Claude Code), `built` (Claude Code has implemented), `verified` (Phil has confirmed acceptance criteria met). Claude Code updates `impl_status` to `built` when it completes implementation of a decision. Claude Chat sets `impl_status: specced` when a decision is included in a spec document. Default for all existing decisions not yet reviewed: `unspecced`.
Source: Claude Chat | April 2026 | impl_status: specced

**D-187 — Action Queue Name**
"Action Queue" is the confirmed name for the user action surface. Gate approvals (Accountable) and Gate reviews (Consulted) are the first two action types. No rename as new action types are added unless a specific UX problem requires it. Capitalize in all user-facing text per Principle 14.
Source: Session 2026-04-04 | April 2026 | impl_status: specced

**Next available: D-188**

---

## Build C Remaining Acceptance Criteria

These add to the supplement (Part 2) and original build-c-spec.md criteria.

| Criterion | How Demonstrated |
|-----------|-----------------|
| Milestone status — Behind not editable | Set a past target date on an active Gate. Verify Status shows Behind, no dropdown, muted replanning label visible. |
| Target date change resets Behind to Not Started | With a Behind Milestone, change the target date. Verify Status resets to Not Started immediately. |
| Unset Complete — impact statement visible | Approve a Gate. Click Unset Complete. Verify impact statement renders before reason field. |
| Unset Complete — reason required | Attempt to save Unset Complete with empty reason. Verify save blocked. Enter reason. Verify reason in cycle audit trail. |
| Unset actual date warning | Pass through a Gate. Manually null the actual date. Verify amber alert appears at top of Gates section with row-level ⚠ icon. |
| Manual actual date logged as manual | Enter an actual date manually via the warning path. Verify audit trail entry shows "manually entered" flag. |
| Artifact sections — future stages collapsed | Open a Delivery Cycle in BRIEF. Verify DESIGN and later sections collapsed with "Available when Delivery Cycle reaches [STAGE]" label. |
| Artifact slots — all 24 named types seeded | Query cycle_artifact_types. Verify 24 rows with correct stage, name, and guidance text. |
| Empty slot answers What and Why | Open any empty artifact slot. Verify Artifact Type Name and guidance text both visible without expanding anything. |
| Promoted artifact — dual pointer display | Set pointer_status = promoted on an artifact. Verify OI Library link renders as primary tappable chip, external URL as plain archived reference. |
| Workstream filter — three groups | Open dashboard Workstream filter with one inactive Workstream in system. Verify three distinct groups in correct order. |
| Division filter — hidden for single-Division users | Log in as a user with one Division assignment. Verify Division filter does not render. |
| Division filter — include-child checkbox | Select a specific Division. Verify checkbox appears. Check it. Verify child Division cycles included. |
| Filter memory — delivery.cycles restored | Apply Workstream + Tier filter. Navigate away. Return within 7 days. Verify filters restored, Tier 1 skeleton shows during restore load. |
| Filter memory — search not persisted | Apply search text. Navigate away. Return. Verify search field blank. |
| Drill-down filter visually confirmed | Navigate to `/delivery/cycles?workstream_id=X`. Verify Workstream filter control shows selected value matching the param. |
| Action Queue capitalized consistently | Review home screen card header, empty state, and notification badge. Verify "Action Queue" — not "action queue" or "Actions." |

---

*Pathways OI Trust · Build C Remaining Spec Items · CONFIDENTIAL · April 2026*
