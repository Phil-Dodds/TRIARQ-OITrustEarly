# Delivery Cycle — Dashboard List & Detail View Design Specification
Pathways OI Trust | v1.0 | April 2026 | CONFIDENTIAL
Owner: Phil Dodds, EVP Performance & Governance

For Claude Code. This document describes the complete visual and behavioral
specification for the Delivery Cycle dashboard list view and the cycle detail
right panel. Apply exactly as written. Raise any conflicts with locked
decisions before building around them.

---

## 1. Dashboard List View

### 1.1 Layout Principle

The dashboard is a data-dense list. Columns must fit in a single row per cycle
without wrapping. The row is the unit of navigation — clicking a row opens the
cycle detail in the right panel (per D-153, Session 2026-03-24-I). The list
remains visible and navigable while the right panel is open.

Horizontal space is constrained. Design priority order:
1. Division + Title + Outcome — the identity columns. Always visible. Never truncated below legibility.
2. Stage Track (Condensed) — always visible. Fixed width.
3. Headline — the most information-dense single column. Flexible width — absorbs available space.
4. Assigned DS + Assigned CB — people columns. Can be icons/avatars with tooltip if space is tight.
5. Pilot Start Date + Production Release Date — date columns. Fixed narrow width.
6. Tier — narrow badge. Always visible.
7. Delivery Workstream — can be truncated with tooltip if needed.

### 1.2 Column Set — Ordered

| # | Column | Display | Width Behavior | Source |
|---|--------|---------|---------------|--------|
| 1 | Division | Division name — tappable → Division Detail Panel | Fixed, medium | delivery_cycles.division_id |
| 2 | Cycle Title | Full title — tappable → opens right panel detail | Flexible, grows | delivery_cycles.cycle_title |
| 3 | Outcome Statement | One-line truncation with tooltip on hover. Amber dot indicator when null — no text. | Flexible, grows | delivery_cycles.outcome_statement |
| 4 | Stage Track (Condensed) | 5 gate nodes only. See Stage Track spec (Section 3). | Fixed | cycle_stages + gate_records |
| 5 | Headline | Intelligent summary text. See Section 1.4. | Flexible, fills remaining | Computed |
| 6 | Assigned DS | Display name — tappable → User Detail Panel | Fixed, narrow (avatar + name or avatar only) | delivery_cycles.assigned_ds_user_id |
| 7 | Assigned CB | Display name — tappable → User Detail Panel | Fixed, narrow (avatar + name or avatar only) | delivery_cycles.assigned_cb_user_id |
| 8 | Pilot Start Date | Date with state model. See Section 1.3. | Fixed, narrow | cycle milestone dates |
| 9 | Production Release Date | Date with state model. See Section 1.3. | Fixed, narrow | cycle milestone dates |
| 10 | Tier | Badge: 1 / 2 / 3. Neutral color. | Fixed, narrow | delivery_cycles.tier |
| 11 | Delivery Workstream | Workstream name — tappable → Workstream detail | Fixed, medium — truncate with tooltip | delivery_cycles.workstream_id |

**Responsive handling for tight viewports:**
- Columns 6 and 7 (DS, CB): collapse to avatar only with full name on hover tooltip.
- Column 11 (Workstream): truncate to first word + ellipsis with full name on hover tooltip.
- Column 3 (Outcome): always truncates to one line. Tooltip shows full text.
- Column 2 (Title): truncates before Division does.
- Never hide Division, Title, Stage Track, or Tier.

### 1.3 Date Column — State Model (Session 2026-03-24-A, -B, -N)

Each date column (Pilot Start Date, Production Release Date) displays one of
three modes based on whether an actual date has been recorded:

**Commitment mode** (actual_date is null):
- Show target date.
- If today > target_date and gate not yet cleared: display in Oravive (`#E96127`) — overdue.
- If target_date is within 4 days: display in Sunray (`#F2A620`) — upcoming.
- Otherwise: neutral display.
- When not set: column is blank. No placeholder text.

**Achieved mode** (actual_date populated, actual_date ≤ target_date):
- Show actual date. Label as "Actual" in small text below or inline.
- Neutral color treatment.

**Missed mode** (actual_date populated, actual_date > target_date):
- Show actual date. Label as "Actual."
- Muted overdue color treatment (not full Oravive — this is historical, not urgent).

**Suppression rule:** Overdue state (Oravive) is suppressed on any cycle in
COMPLETE or CANCELLED lifecycle stage.

### 1.4 Headline — Intelligent Summary Text (Session 2026-03-24-C)

The headline is a computed text field — not stored. Computed fresh on each
list render from cycle state. Logic in order of priority:

1. **Gate pending approval:** "Awaiting [Gate Name] approval · [target date if set]"
2. **Gate overdue:** "[Gate Name] approval overdue · X days"
3. **Pre-pilot, pilot target set:** "Next: [Gate Name] [date] · Pilot [date]"
4. **Pre-pilot, no pilot target set:** "Next: [Gate Name] [date if set]"
5. **Stage active, next gate future:** "In [Current Stage] · Next: [Gate Name] [date if set]"
6. **Post-deploy:** "Pilot [date] · Release [date if set]"

Overdue and upcoming color logic from Section 1.3 applies to any date
referenced in the headline.

### 1.5 Filter and Sort Controls

Apply Filter & Sort Memory pattern (see claude-code-session-rules.md and
filter-sort-memory-spec.md). Screen key: `delivery_cycles.list`.

**Filter controls:**
- Division (dropdown — scoped to viewer's accessible Divisions)
- Tier (chips: All | 1 | 2 | 3)
- Delivery Workstream (dropdown)
- Lifecycle stage (dropdown — active stages + COMPLETE + CANCELLED)
- Assigned DS (dropdown)
- Assigned CB (dropdown)

**Sort controls:**
- Any column header is sortable.
- Default sort: Division A–Z, then Cycle Title A–Z.
- Active sort column shows direction arrow (↑ / ↓).

**Summary line** below the table (same pattern as User Management):
"[N] of [Total] cycles[filter description if active]"

---

## 2. Cycle Detail View — Right Panel

### 2.1 Layout

Opens in the right panel on row click. List remains visible on the left.
Right panel has three vertical zones:

1. **Header zone** — Stage Track (Full mode) spanning the full panel width.
2. **Identity zone** — cycle title, division, tier, workstream, assigned DS/CB,
   outcome statement (with amber warning if null).
3. **Content zone** — tabbed or sectioned: Gates | Artifacts | Activity

### 2.2 Header Zone — Stage Track Full Mode

Full mode: all 10 stage nodes + 5 gate nodes. Labels below each node.
See Stage Track specification (Section 3 of this document).

Current stage highlighted. Completed stages filled. Gate nodes interactive —
clicking opens the gate record inline or as a sub-panel.

### 2.3 Identity Zone

| Field | Display | Behavior |
|-------|---------|----------|
| Cycle Title | Large, primary heading | Editable inline by assigned DS or CB |
| Division | Tappable chip | → Division Detail Panel |
| Tier | Badge (1 / 2 / 3) | Read only |
| Delivery Workstream | Tappable chip | → Workstream detail |
| Assigned DS | Avatar + name | Tappable → User Detail Panel |
| Assigned CB | Avatar + name | Tappable → User Detail Panel |
| Outcome Statement | Full text, below identity fields | Amber warning banner when null: "Outcome Statement not set — add one to help the team align on what success looks like." Never a gate block. Editable inline by assigned DS. |

### 2.4 Gates Section

One entry per gate. Five gates in order:
Brief Review · Go to Build · Go to Deploy · Go to Release · Close Review

Each gate entry shows:

| Element | Description |
|---------|-------------|
| Gate name | Bold label |
| Gate status badge | See status model below |
| Target date | Editable. Date state model from Section 1.3. |
| Actual date | System-set when gate clears. Read only. |
| Milestone status | Five-state model with colors — see Section 2.5 |
| Days overdue | Shown when status is Behind. "X days overdue." |
| Approver | Named person. Tappable → User Detail Panel. Shows "Not configured — will escalate to Division Owner" if unset. |
| Consulted | Named people (Build C — RACI). Advisory participants. |
| Informed | Named people (Build C — RACI). Notification only. |
| Gate action button | "Submit for Approval" / "Approve" / "Return" — shown to the correct role only. |
| Required artifacts | Artifact slots scoped to this gate. Guidance only at launch — not blocking. |

**Unset actual date warning** (Session 2026-03-24-F): If the cycle has advanced
past a gate and the actual date for that gate is not recorded, show a data
quality warning on that gate entry: "Actual date not recorded for completed
gate." Not a block — a signal.

### 2.5 Milestone Date Status Model (Session 2026-03-24-N, -O)

Five statuses. Fixed colors. No exceptions.

| Status | Color | Who Sets It | When |
|--------|-------|-------------|------|
| Not Started | Gray | System default | Default when target date set for non-current/non-next gate, or before any date is set |
| On Track | Green (`--triarq-color-success` or equivalent) | Human | Human affirmatively sets — not a system default |
| At Risk | Amber (`--triarq-color-sunray`) | Human | Human signals date is in jeopardy |
| Behind | Red (system error color) | System | Automatic when today > target_date and gate not cleared. Displays days-overdue count. System overrides any human-set status. |
| Complete | Blue (`--triarq-color-primary`) | System | Automatic when gate cleared and actual date recorded. |

**Status transition rules:**
- Human can set: On Track, At Risk. Human can move status backward (On Track → Not Started, At Risk → On Track).
- System overrides human for Behind — no human can prevent this.
- Complete can be unset by human, but requires a logged reason. Reason is captured in the cycle audit trail. This is a compliance requirement.
- When a human changes a target date on a Behind milestone, status automatically resets to Not Started.
- When target date is set for the current or next gate: default is Not Started. Human must affirmatively set On Track.
- When target date is set for a gate two or more positions ahead: status is Not Started, system-defaulted, until cycle reaches that gate.

### 2.6 Artifacts Section

Artifact slots organized by lifecycle stage. Each slot shows:
- Artifact type name
- Stage it belongs to
- Pointer status: external URL / promoted to OI Library / OI Library only
- Attach / view action

Empty slots render as guidance placeholders — visible, skippable, never blocking.
Ad hoc attachments (no slot type) are supported.

See Session 2026-03-25-B for full artifact model.

### 2.7 Activity Section

Cycle-level activity log. All events on this cycle in reverse chronological
order: stage transitions, gate actions, artifact attachments, field edits,
workstream changes. Actor name tappable → User Detail Panel.

This section is populated from `user_activity_events` filtered by
`entity_type = 'delivery_cycle'` and `entity_id = [cycle id]`.
Available from Build C forward.

---

## 3. Stage Track Component Reference

*From design-communication-principles.md v1.2 Section 5.1 and ARCH-25.*

**Component:** `StageTrackComponent`
**Type:** Standalone Angular presentation-only component. No business logic.

### Inputs
- `lifecycleDefinition` — ordered array of stage and gate objects
- `currentStageIdentifier` — which stage the record is currently in
- `gateStateMap` — map of gate ID → state (pending / blocked / complete / upcoming)
- `displayMode` — enum: `full` | `condensed`

### Node States

| State | Visual | When |
|-------|--------|------|
| Complete | Filled circle, `--triarq-color-primary`, checkmark or stage icon | Stages the record has passed |
| Current | Filled circle, `--triarq-color-primary`, stage icon, pulse or ring emphasis | Current stage |
| Gate Pending | Filled circle, `--triarq-color-sunray`, gate icon | Gate awaiting approval |
| Gate Blocked | Filled circle, system error color, blocked icon | Gate overdue or workstream inactive |
| Upcoming | Outline circle only, `--triarq-color-fog` | Not yet reached |

### Connecting Line
Fills from left using `--triarq-color-primary` up to and including current stage.
Remaining line: `--triarq-color-fog`.

### Gate Nodes
Rendered as distinct shape from stage nodes (diamond or shield vs. circle).
Positioned between the stages they separate.

### Full Mode (detail views)
All 10 stage nodes + 5 gate nodes. Labels below each node.
Gate nodes interactive — click opens gate record.
Stage nodes not interactive.

### Condensed Mode (dashboard rows)
5 gate nodes only. Labels suppressed — tooltip on hover acceptable.
Current stage name displayed as adjacent text: "Currently in BUILD."
Gate nodes interactive — click opens gate record.

### Lifecycle String
`BRIEF → DESIGN → SPEC → [Go to Build] → BUILD → VALIDATE → UAT →
[Go to Deploy] → PILOT → [Go to Release] → RELEASE → OUTCOME →
[Close Review] → COMPLETE`

Terminal states (not on track): CANCELLED, ON HOLD.

### Mobile / Narrow Panel
Track collapses to "Stage X of Y" text indicator + small progress bar.
Full track renders on expand.

### Build Sequence
- Build C: Full mode (Delivery Cycle detail view) + Condensed mode (dashboard row)
- Build B: Full mode for OI Library artifact detail view

---

## 4. Decision References

All design choices in this document trace to locked decisions. Key references:

| Decision | What It Governs |
|----------|----------------|
| Session 2026-03-24-A | Date column state model (Commitment / Achieved / Missed) |
| Session 2026-03-24-B | Two dashboard date columns: Pilot Start, Production Release |
| Session 2026-03-24-C | Headline as intelligent summary text |
| Session 2026-03-24-D | Current stage displayed on dashboard and detail |
| Session 2026-03-24-E | Five milestone dates as planning layer |
| Session 2026-03-24-F | Warning for unset actual dates on passed gates |
| Session 2026-03-24-I | Right panel as standard detail surface |
| Session 2026-03-24-J | Cycle detail view required in Build C first pass |
| Session 2026-03-24-L | Delivery Workstream as required field on every cycle |
| Session 2026-03-24-N | Five milestone date statuses with fixed colors |
| Session 2026-03-24-O | Default status when target date is set |
| Session 2026-03-25-A | Outcome Statement as direct field with amber warning |
| Session 2026-03-25-B | Artifact slots model |
| Session 2026-03-29-F / ARCH-25 | Stage Track component contract |
| D-65, D-66 | Approval assignment model — people-based, inherits up hierarchy |
| D-149 | RACI functional definitions (Accountable / Consulted / Informed) |
| D-108 | 12-stage lifecycle string |

---

## 5. What Is Not Yet Designed

The following items are noted as gaps — do not invent behavior for these.
Raise with Phil before building.

- Column set for this dashboard was locked in Design Session 2026-04-03.
  This document is the first formal record of it.
- Inform and Consult participant UI on gate entries: designed for Build C
  but detail UI not fully specified. Raise before implementing.
- Gate action button permission logic: which roles can submit, approve,
  return at each gate. Not fully locked — confirm before wiring.

---

*Pathways OI Trust · Empower | Optimize | Partner*
*CONFIDENTIAL | April 2026 | v1.0*
