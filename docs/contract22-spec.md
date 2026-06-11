# Contract 22 Specification
Pathways OI Trust | 2026-06-09 | CONFIDENTIAL
Owner: Phil Dodds, EVP Performance & Governance

---

## Overview

Contract 22 delivers eight workstreams:

1. **Compact Person Row Layout** — S-034 applied system-wide to EntityPickerComponent rows and all avatar+subline grid rows
2. **Panel Header Conformance** — × button repositioned into sticky panel header; destructive action visual segregation applied system-wide
3. **Division Assignment Picker** — hierarchical tree multi-select replacing flat Trust dropdown on User Management Assign Divisions
4. **Artifact Availability Fix** — attach action available on all artifact slots regardless of Initiative lifecycle stage
5. **User Management Corrections** — Division filter default All; "No Division Assigned" filter option added; division assignment picker replacement
6. **EPO Deploy Gate by Quarter + Deploy Gate Schedule by Quarter** — four-section model; status dot resolution rule; bug sweep
7. **User Management: Login Visibility + Inline Add User + No-Division Alert** — last_login_at column, Login Activity zone in User View, inline Add User from EntityPicker, no-Division warning at user creation
8. **Home Screen My Initiatives Card** — My Initiatives card for non-admin users
9. **Admin Screens UI Conformance Pass** — User Management and Division Management audited against Initiatives as reference; all applicable standards applied
10. **System-wide Bug Fixes** — home screen card responsive layout; D-346/D-178 loader conformance pass

---

## Governing Decisions

| Decision | What It Locks |
|----------|--------------|
| D-415 | Compact Person Row Layout — system-wide (EntityPicker + avatar+subline rows) |
| D-416 | Panel Header: × close button position; destructive action segregation |
| D-417 | Division Assignment Picker — hierarchical tree multi-select |
| D-418 | Artifact Attach Action available at all lifecycle stages |
| D-419 | EPO Deploy Gate by Quarter — four sections, status resolution rule, parallel apply to Deploy Gate Schedule by Quarter |
| D-410 amendment (1) | User Management Division filter default = All |
| D-410 amendment (2) | User Management Division filter adds "No Division Assigned" option |
| D-420 | EntityPicker — inline Add User for Admins |
| D-421 | No-Division warning on user creation |
| D-422 | User Management: last_login_at column + Login Activity zone in User View panel |
| D-423 | Home Screen My Initiatives Card |

Governing standards: **S-034 — Compact Person Row Layout** (new, this session)

---

## Decision Text

**D-415 — Compact Person Row Layout.** All rows displaying a person or named entity with an avatar and secondary attribute use compact single-line layout: avatar 32px, name and secondary attribute (role pill, type label, or equivalent) on the same horizontal line, vertical padding 8px top/bottom per row. Stacked layout (avatar > 32px, secondary attribute below name on its own line) is not permitted on person rows. Applies system-wide to: EntityPickerComponent rows, User Management grid rows, Workstream member rows, and any other avatar+subline row. Grid rows where sub-line carries multi-value content (e.g. "7 Divisions" per D-411) compress row height but the division sub-line text remains below the name — only the row height and avatar size compress. In picker context, name and role pill move to the same line. Promoted to Active Standard S-034. | impl_status: specced | Connects to: D-182, D-411, S-034

**D-416 — Panel Header: × Close Button Position and Destructive Action Segregation.** Rule 1 — × close button: lives inside the sticky panel header, right-aligned, at the same vertical position as the panel title. Not a floating corner element above the header. Amends D-291. Applies to all right panels (View, Edit, Create) and modal overlays (EntityPicker, GateRecordModal). Rule 2 — Destructive action segregation: destructive record-level actions (Cancel Initiative, Deactivate, Delete, any irreversible or terminating action) in the panel header action bar are visually segregated from non-destructive actions. Treatment: Oravive (#E96127) filled button per D-207, positioned at the far right of the action bar, separated from non-destructive actions by a 1px vertical rule in fog color (#A6A6A6) with 12px horizontal margin each side. Non-destructive actions remain in primary color. Two-step confirmation per D-183 still required. Applies to panel header Tier 2 actions per D-348. Tier 3 inline actions (e.g. Remove links) keep their existing inline treatment — unaffected. | impl_status: specced | Connects to: D-291, D-348, D-207, D-183

**D-417 — Division Assignment Picker: Hierarchical Tree Multi-Select.** The "Assign Divisions" action in the User Management panel (D-410) uses a hierarchical tree multi-select picker, not the flat Trust-only dropdown. Structure: modal overlay per D-182 pattern. Tree layout: Trust rows (bold, no indent) with expand/collapse chevron; Service Line rows (24px indent) with expand/collapse chevron; Functional Team rows (48px indent, no chevron). All Trusts expanded by default. Checkboxes on every row — selecting a Trust does not auto-select children (assignment is explicit; access inheritance is downward per D-135 separately). Active Divisions only — inactive Divisions shown dimmed, not selectable per S-032. Search field at top filters tree by name match, expanding matched branches automatically. Echo section below tree: selected Divisions as dismissible chips. Confirm/Cancel footer. Currently assigned Divisions pre-checked on open. Replaces the flat "Assign a Trust" dropdown. | impl_status: specced | Connects to: D-410, D-413, D-135, D-182, D-169, S-032

**D-418 — Artifact Attach Action Available at All Lifecycle Stages.** The attach action (URL entry or OI Library link) is available on every artifact slot regardless of the Initiative's current lifecycle stage. Future stage slots are visually de-emphasized (dimmed, stone color label, reduced opacity on slot card) for orientation — but the attach action is present and functional. Empty-state text "Artifact slots become available as the cycle advances through stages" is incorrect — remove it. Correct empty-state text for future stage slots: "Attach early — slots are available at any stage." Current/past stage slots with no attachment retain existing guidance text per Session 2026-03-25-F. `gate_required` and `required_at_gate` columns remain dormant per Session 2026-03-25-C. Dimming is orientation-only, not an action gate. | impl_status: specced | Connects to: Session 2026-03-25-B, Session 2026-03-25-C, Session 2026-03-25-F, build-c-spec.md Section 6

**D-419 — EPO Deploy Gate by Quarter: Four-Section Structure, Status Resolution Rule, and Parallel Apply.** Amends D-399 and D-PilotSchedule-2026-04-06. Full text: see Section 7 below. | impl_status: specced | Connects to: D-399, D-PilotSchedule-2026-04-06, D-205, Session 2026-03-24-N

**D-410 Amendment (1) — User Management Division Filter Default.** The Division filter default for User Management (screen key `admin.users`) is All, not "My Divisions." User Management is an admin surface — default visibility of all users is the correct expectation. Filter memory per D-171 applies as normal after first visit. All other D-410 filter panel rules unchanged. | impl_status: specced | Connects to: D-410, D-171

**D-410 Amendment (2) — User Management "No Division Assigned" Filter Option.** The Division filter drill-in for User Management adds a fourth option: "No Division Assigned" — shows users where `division_memberships` has zero rows for that user. Options in order: All / No Division Assigned / My Divisions / Select single. Active filter chip label: "Division: None assigned." | impl_status: specced | Connects to: D-410, D-171, D-395

**D-420 — EntityPicker: Inline Add User for Admins.** When an Admin user is operating any EntityPicker configured for person selection (DCS, EPO, DOL, or any user role picker), a "+ Add User" link appears at the bottom of the picker list below the last result row. Tapping it opens the Create User panel (reusing the User Management Create form per S-016) as a modal over the picker. On successful user creation (invite sent): picker refreshes its list, newly created user is auto-selected in the echo section, picker returns to normal state with the new user selected. On cancel: picker returns to its prior state, no changes. The "+ Add User" link is visible only to Admins — non-admins do not see it. Non-admin picker behavior unchanged. No-Division warning per D-421 fires after creation if no Division was assigned during creation. | impl_status: specced | Connects to: D-182, D-410, D-421, D-369, S-016

**D-421 — No-Division Warning on User Creation.** After a user is successfully created (invite sent), if the new user has zero Division assignments, a D-200 Pattern 2 warning appears inline on the newly created user's View panel: "No Division assigned — this user will not appear in Division-scoped views or Initiative pickers until a Division is assigned." An "Assign Division →" action link within the warning opens the Division assignment picker (D-417) directly. Not a creation block — creation proceeds, warning surfaces post-save. Applies both from User Management + Add User flow and from EntityPicker inline Add User (D-420). | impl_status: specced | Connects to: D-410, D-417, D-420, D-200, D-395

**D-422 — User Management: Login Activity Visibility.** Two surfaces added using the existing `last_login_at` column on the `users` table (D-166, stamped by Division MCP on JWT validation). Before implementing, Code confirms `last_login_at` column exists on `users` table — if absent, add via migration (timestamptz nullable, no backfill). Surface 1 — User Management grid column: "Last Login" column added as the rightmost column before the Invite Status column. Display: relative datetime (e.g. "3 days ago") with full datetime on hover tooltip. Null value: "Never logged in" in stone italic. Sortable: descending by default (most recent first) when column header tapped. Surface 2 — User View panel Login Activity zone: new read-only zone in the User View panel below the Roles/Divisions zone. Zone header: "Login Activity." Fields: Last Login (formatted datetime or "Never logged in"), Account Created (formatted datetime from `created_at`), Invite Status (current state). Full User History panel (backed by `user_activity_events`) deferred to Build D per D-167. | impl_status: specced | Connects to: D-166, D-167, D-410, ARCH-26

**D-423 — Home Screen My Initiatives Card.** A My Initiatives card is added to the home screen for all roles. Card title: "My Initiatives." Content: list of Initiatives where the current user is assigned DCS, EPO, or DOL — active Initiatives only (not COMPLETE, CANCELLED, ON HOLD). Columns per row: Initiative name (tappable → Initiative right panel per S-018), Division (short name per D-203), Stage badge, status dot (per D-419 resolution rule — Go to Deploy → Go to Build → Brief Review status walkback). Sorted by most recently updated descending. Row limit: 5 visible rows. Footer link: "View all [N] →" navigates to All Initiatives with Assigned Person filter set to "My Initiatives." Empty state: "No Initiatives assigned to you yet." Card load: async per D-346 — skeleton rows on card render, no home screen block. Note: a partial implementation of this card may already exist in the running build — Code treats existing implementation as the baseline and applies this spec as a delta per D-252. My Activity card (backed by `user_activity_events`) deferred to Build D per D-167. | impl_status: specced | Connects to: D-166, D-167, D-346, D-419, D-203, S-018, D-252

---

## S-034 — Compact Person Row Layout (NEW)

**Status:** Active
**Adopted:** 2026-06-09
**Governing decisions:** D-415

**Rule:** All rows displaying a person or named entity with an avatar and secondary attribute use compact single-line layout: avatar 32px, name and secondary attribute (role pill, type label, or equivalent) on the same horizontal line, vertical padding 8px top/bottom per row. Stacked layout (avatar > 32px, secondary attribute on its own line below the name) is not permitted on person rows. Applies to: EntityPickerComponent rows, User Management grid rows, Workstream member rows, and any other avatar+subline row system-wide.

**Exception:** Grid rows where sub-line content is multi-value (e.g. Division list per D-411) may retain sub-line text below the name. Row height and avatar size still compress. Sub-line text position exception applies only to multi-value content that cannot fit inline — single secondary attributes must be inline.

**Conformance test:** Does any person row use an avatar larger than 32px? (No = pass.) Does any person row display a single secondary attribute below the name on its own line? (No = pass.) Any failure = violation.

---

## Section 1 — Compact Person Row Layout (D-415, S-034)

### Scope

Every surface in the system containing EntityPickerComponent or an avatar+subline row pattern.

### Surfaces to update

| Surface | Current pattern | Change |
|---------|----------------|--------|
| EntityPickerComponent (DCS/EPO/DOL/Workstream/all instances) | ~40px avatar, role label below name | 32px avatar, role pill inline right of name |
| User Management grid rows | Existing sub-line (Divisions) | Row height compresses; avatar 32px; Division sub-line retained below name per exception |
| Division Management member list in right panel | Varies | 32px avatar, role badges inline |
| Any other avatar+subline row found during audit | Varies | Apply S-034 |

### Implementation note

Code audits all uses of EntityPickerComponent and any component rendering avatar+name+subline before touching code. Documents each instance found. Applies S-034 to each. Does not alter picker selection logic, scope radios, or search behavior — layout change only.

---

## Section 2 — Panel Header Conformance (D-416)

### × close button

Every right panel and modal overlay: × button moves from floating corner position above the header into the sticky panel header zone, right-aligned at the same vertical centre as the panel title. Applies to: all right panels (View, Edit, Create), EntityPicker modal, GateRecordModal, any other modal overlay.

Code audits all panel and modal components for × button position before touching code. Documents each instance. Applies D-416 to each.

### Destructive action segregation

In every panel header action bar where a destructive record-level action appears alongside non-destructive actions:

- Destructive action button: Oravive (#E96127) fill, white text
- Positioned at far right of the action bar
- Separated from non-destructive actions by a 1px vertical rule, fog color (#A6A6A6), 12px horizontal margin each side
- Two-step confirmation per D-183 unchanged

**Known instances requiring update:**
- Initiative View panel: "Cancel Initiative" alongside "Edit Initiative" and "Submit Brief Review for Approval"
- Division View panel: Deactivation action (if rendered in header)
- Any other panel header with destructive + non-destructive actions co-located

Code identifies all instances during audit before touching code.

---

## Section 3 — Division Assignment Picker (D-417)

### Replaces

Flat "Assign a Trust" dropdown on User Management Assign Divisions action.

### Tree structure

```
▼ Admin Services          [Trust, bold, no indent]     ☐
    ▶ Analytics           [Service Line, 24px indent]  ☐
        Data Engineering  [Functional Team, 48px]      ☐
▼ Enterprise Services     [Trust, bold, no indent]     ☐
    ...
```

All Trusts expanded on open. Expand/collapse chevron on Trust and Service Line rows.

### Picker behaviour

- Search field at top: filters tree by name match, expands matched branches automatically
- Checkboxes on every row; selecting parent does not cascade to children
- Inactive Divisions: dimmed, not selectable per S-032
- Echo section below tree: selected Divisions as dismissible chips
- Currently assigned Divisions pre-checked on open
- Confirm / Cancel footer buttons
- MCP: uses existing `add_user_to_division` / `remove_user_from_division` per D-414; diff current selections against confirmed selections, call add/remove for changed items only

---

## Section 4 — Artifact Availability Fix (D-418)

### Change

Future stage artifact slots: attach action present and functional (not hidden). Visual treatment: slot card at reduced opacity (0.6), stone color slot header label, guidance text in stone italic.

Empty-state text correction:
- **Remove:** "Artifact slots become available as the cycle advances through stages."
- **Future stage slots with no attachment:** "Attach early — slots are available at any stage."
- **Current/past stage slots with no attachment:** existing guidance text unchanged

### MCP

No MCP change. Attach action calls existing `attach_cycle_artifact` tool regardless of current stage. No gate_required enforcement — columns remain dormant.

---

## Section 5 — User Management Corrections (D-410 amendments)

### Division filter default

Screen key `admin.users` Division filter default: **All** (not "My Divisions"). First visit and after filter memory cleared: All users shown. Stored filter memory wins on subsequent visits per D-171.

### "No Division Assigned" filter option

Division filter drill-in options (in order):
1. All *(default)*
2. No Division Assigned — users with zero `division_memberships` rows
3. My Divisions
4. Select single — existing picker per D-313 pattern

Active filter chip label when "No Division Assigned" selected: "Division: None assigned"

---

## Section 6 — User Management Enhancements (D-420, D-421, D-422)

### 6.1 Last Login column (D-422)

**Schema check:** Before implementing, Code confirms `last_login_at timestamptz nullable` exists on `users` table. If absent: add via new migration, no backfill.

**Grid column:** "Last Login" — rightmost column before Invite Status (which shows only when not Active).
- Format: relative ("3 days ago") with ISO datetime on hover tooltip
- Null: "Never logged in" in stone italic
- Sortable via column header tap; default sort on this column: descending

**User View panel — Login Activity zone:**
- Position: below Roles/Divisions zone
- Zone header: "Login Activity" (Deep Navy bar per S-005 zone header standard)
- Fields:
  - Last Login: formatted datetime, or "Never logged in" stone italic
  - Account Created: formatted datetime from `users.created_at`
  - Invite Status: current invite state label

### 6.2 EntityPicker inline Add User (D-420)

**Trigger:** Admin user, any person-role EntityPicker

**"+ Add User" link:**
- Position: below last result row, above picker footer
- Style: primary color link, small text, left-aligned
- Visible to Admins only; absent for all other roles

**Flow:**
1. Admin taps "+ Add User"
2. Create User panel opens as modal over picker (reuses User Management Create form per S-016)
3. On successful creation: picker list refreshes; new user auto-selected in echo section; picker returns to normal state
4. On cancel: picker returns to prior state unchanged
5. D-421 no-Division warning fires on User View panel if no Division assigned

### 6.3 No-Division warning (D-421)

After any user creation (User Management + Add User flow or EntityPicker inline flow), if the created user has zero Division assignments:

D-200 Pattern 2 warning inline on User View panel:
> "No Division assigned — this user will not appear in Division-scoped views or Initiative pickers until a Division is assigned. [Assign Division →]"

"Assign Division →" link opens D-417 hierarchical tree picker directly. Warning clears once at least one Division is assigned.

---

## Section 7 — EPO Deploy Gate by Quarter + Deploy Gate Schedule by Quarter (D-419)

### Four-section model (replaces three-section model in both views)

**Section 1 — Prior Quarter [Q label] Actual**
- Go to Deploy **actual** date in the prior calendar quarter
- Includes COMPLETE Initiatives
- Prior-quarter miss: if target was set but no actual date set, Initiative appears here with Behind/red signal AND in Next Two Quarters section if target date falls in a future quarter

**Section 2 — Current Quarter [Q label] Planned/Actual**
- Go to Deploy actual or target date in the current calendar quarter
- Includes COMPLETE Initiatives where actual date is in current quarter

**Section 3 — Next Two Quarters [Q+1 / Q+2 label] Targeted**
- Go to Deploy target date (no actual set) in either of the next two calendar quarters
- If actual is set and falls in next two quarters: Initiative appears here
- Sub-grouped within section by quarter — Q+1 rows first, then Q+2 rows (not flat)
- Active Initiatives only; COMPLETE, CANCELLED, ON HOLD excluded

**Section 4 — Unscheduled Active**
- Active Initiatives where Go to Deploy target date is null OR falls beyond Q+2
- Replaces "Other Active"
- COMPLETE, CANCELLED, ON HOLD excluded

### Row counts on EPO/Workstream row

Four counts replacing three: `Prior: N · Current: N · Next 2Q: N · Unscheduled: N`

### Quarter boundary logic

Calendar quarters at server date query time: Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec. Section labels show quarter identifier (e.g. "Q3 2026 / Q4 2026 Targeted").

### Status dot resolution rule (replaces Pilot Start milestone dot)

Single dot per Initiative row, resolved in order:

1. **Go to Deploy** milestone status — if not null/Not Started: use it
2. **Go to Build** milestone status — if not null/Not Started: use it
3. **Brief Review** milestone status — if not null/Not Started: use it
4. **No gate has non-default status** → gray/Not Started dot

Five display values per D-205:

| Status | Color |
|--------|-------|
| Not Started | Gray |
| On Track | Green #22c55e |
| At Risk | Amber #F2A620 |
| Behind | Red #E96127 |
| Complete | Blue #257099 |

### Bug sweep instruction

Code audits the existing implementation of both views against the following before touching code. Documents each gap found:

1. **Quarter assignment logic** — confirm calendar quarter boundaries (not rolling 90-day window); actual-date-overrides-target precedence
2. **Section assignment** — confirm each Initiative lands in exactly one section (except prior-quarter miss which appears in Prior AND Next Two)
3. **Status dot derivation** — confirm walkback rule is applied; confirm colors match D-205 values above
4. **Row counts** — confirm EPO/Workstream row counts match section counts

Applies to both `/initiatives/epo-deploy` (D-399) and `/delivery/deploy-schedule` (D-PilotSchedule-2026-04-06).

---

## Section 8 — Home Screen My Initiatives Card (D-423)

### Card specification

**Title:** My Initiatives
**Position:** Home screen card grid — below Action Queue, alongside existing cards
**Visible to:** All roles

**Content query:** Initiatives where current user is `assigned_dcs_user_id`, `assigned_epo_user_id`, or `assigned_dol_user_id` AND lifecycle stage is not COMPLETE, CANCELLED, ON HOLD.

**Row display (per Initiative):**
- Initiative name — tappable → Initiative right panel per S-018
- Division short name per D-203 (stone, small)
- Stage badge
- Status dot — per D-419 resolution rule

**Sort:** Most recently updated descending (`updated_at`)

**Row limit:** 5 rows visible

**Footer:** "View all [N] →" — navigates to All Initiatives with Assigned Person filter set to "My Initiatives"

**Empty state:** "No Initiatives assigned to you yet."

**Load behaviour:** Async per D-346. Skeleton rows on card render. Does not block home screen load.

**Existing implementation:** A partial My Initiatives card may already exist in the running build. Code reads the existing component before touching code. This spec is the delta — apply D-252 (spec as delta, not greenfield rebuild).

---

## Section 9 — Admin Screens UI Conformance Pass

### Scope

`/admin/users` (User Management) and `/admin/divisions` (Division Management) — full audit against Initiatives grid+panel as visual reference implementation.

### Standards and decisions to audit against

S-005, S-010, S-011, S-012, S-016, S-017, S-018, S-019, S-034 (new), D-291 (as amended by D-416), D-346, D-178, D-348, D-394 (role pills), D-411, D-413, D-414, D-207 (color tokens)

### Execution rule (D-252)

Before touching any code: Code documents every gap found (surface, standard violated, observed vs expected behaviour). Phil reviews gap list if any gap is non-trivial (more than a style fix). Confirmed gaps only are then fixed. No greenfield rebuilds — existing conforming behaviour is baseline.

### Reference implementation

Initiatives grid (`/initiatives/list`): column layout, filter panel, right panel View state, Edit state, action button placement, role pills, chip display, loading skeletons, status dots.

---

## Section 10 — System-wide Bug Fixes

### Bug 1 — Home screen card responsive layout

**Symptom:** Home screen cards render in single-column narrow layout on wide viewport (observed in Craig's session, Image 1).

**Fix:** Audit home screen card grid CSS. Confirm responsive breakpoints conform to S-006 (viewport-adaptive rendering). Apply correct multi-column grid layout for desktop viewport. Verify Craig's viewport triggers correct layout.

**Governing:** S-006, D-178

### Bug 2 — D-346/D-178 loader conformance pass

**Scope:** System-wide audit of every grid load, panel load, and button-triggered operation.

**Standard:** D-346 (four contexts: button-triggered, list/picker loading, irreversible two-step, panel-level mutating operation) + D-178 (three-tier loading skeleton).

**Execution:** Code audits each surface before touching code. Documents every gap (surface, context type, observed vs required behaviour). Applies fixes. Particular focus: User Management grid load, Division Management grid load, Initiative detail panel load, any newly built Contract 21/22 surfaces.

---

## Acceptance Criteria

| # | Criterion | Surface |
|---|-----------|---------|
| 1 | All EntityPicker rows: avatar 32px, role pill inline on same line as name | EntityPickerComponent (all instances) |
| 2 | All avatar+subline grid rows: row height compressed, avatar 32px | User Management, Division member list, any other |
| 3 | × button in sticky panel header on all right panels and modal overlays | System-wide |
| 4 | Destructive actions in panel headers: Oravive fill, far right, fog rule separator | System-wide |
| 5 | Assign Divisions: hierarchical tree multi-select with expand/collapse, search, multi-check | User Management right panel |
| 6 | Attach action present and functional on all artifact slots regardless of Initiative stage | Initiative detail panel |
| 7 | Future stage slots show dimmed card + "Attach early" text; attach action works | Initiative detail panel |
| 8 | User Management Division filter default = All on first visit | `/admin/users` |
| 9 | "No Division Assigned" filter option present and returns correct results | `/admin/users` |
| 10 | "+ Add User" visible to Admins only in all person EntityPickers | EntityPickerComponent |
| 11 | Inline Add User: creates user, picker refreshes, new user auto-selected | EntityPickerComponent |
| 12 | No-Division warning fires on User View panel when created user has zero Divisions | User Management, EntityPicker |
| 13 | "Assign Division →" in warning opens hierarchical tree picker | User Management |
| 14 | Last Login column present in User Management grid; null = "Never logged in" stone italic | `/admin/users` |
| 15 | Last Login column sortable; Login Activity zone present in User View panel | `/admin/users` |
| 16 | EPO Deploy Gate by Quarter: four sections present with correct Initiative placement | `/initiatives/epo-deploy` |
| 17 | Deploy Gate Schedule by Quarter: four sections present with correct Initiative placement | `/delivery/deploy-schedule` |
| 18 | Status dot derivation: Go to Deploy → Go to Build → Brief Review walkback; correct colors | Both deploy views |
| 19 | EPO/Workstream row shows four counts: Prior · Current · Next 2Q · Unscheduled | Both deploy views |
| 20 | Next Two Quarters section sub-grouped Q+1 then Q+2 | Both deploy views |
| 21 | My Initiatives card present on home screen for all roles | Home screen |
| 22 | My Initiatives card: 5 rows max, correct sort, "View all →" link, async load | Home screen |
| 23 | My Initiatives card: empty state renders when no Initiatives assigned | Home screen |
| 24 | Home screen card grid: multi-column layout on desktop viewport | Home screen |
| 25 | D-346/D-178 loader conformance: skeleton rows on all grid loads; button labels change to present-participle | System-wide |
| 26 | User Management and Division Management: all listed standards conformant; no gap vs Initiatives reference | Admin screens |

---

## Section 11 — Build Order

Section 9 (Admin Screens UI Conformance Pass) is the capstone — it audits against standards that must be applied first. Starting with Section 9 would require touching the same components twice. Build in four rounds.

### Round 1 — Foundations (build first)

| Workstream | Section | Why first |
|------------|---------|-----------|
| S-034 / D-415 — Compact Person Row Layout | Section 1 | Section 9 audits against S-034; EntityPicker changes needed before D-420 |
| D-416 — Panel Header × button + destructive segregation | Section 2 | Section 9 audits panel headers against D-416 |
| D-417 — Division Assignment Tree Picker | Section 3 | Section 9 audits Assign Divisions UI; D-421 depends on this picker |

These three are component-level changes with no feature dependencies between them. Build together.

### Round 2 — Features (build on Round 1 foundations)

| Workstream | Section | Dependencies |
|------------|---------|-------------|
| D-410 amendments — Division filter default + No Division Assigned option | Section 5 | None; but must precede Section 9 audit of filter panel |
| D-420 + D-421 — Inline Add User + No-Division warning | Section 6.2, 6.3 | D-417 (Round 1) must exist; S-034 (Round 1) applies to picker |
| D-422 — Last Login column + Login Activity zone | Section 6.1 | Independent; must precede Section 9 audit of User View panel |
| D-418 — Artifact attach at all stages | Section 4 | Fully independent — can slot anywhere; place here for clean batching |
| D-419 — Deploy Gate views four-section model + bug sweep | Section 7 | Fully independent — separate screens, no shared components |

### Round 3 — Section 9 Conformance Pass (build after Round 2)

All standards and components it audits against are now live: S-034, D-416, D-417, D-410 amendments, D-422. Code audits User Management and Division Management against the full standards list, documents every gap before touching code, applies fixes. Uses Initiatives grid as visual reference.

### Round 4 — Cleanup (build last)

| Workstream | Section | Why last |
|------------|---------|----------|
| D-423 — My Initiatives card | Section 8 | Independent; benefits from Bug 1 (home screen layout) being resolved first |
| Bug 1 — Home screen responsive layout | Section 10 | CSS only; resolve before D-423 so card renders in correct grid |
| Bug 2 — D-346/D-178 loader conformance pass | Section 10 | Last — catches all new surfaces introduced in Rounds 1–3 |

### Summary

```
Round 1:  S-034/D-415 · D-416 · D-417
Round 2:  D-410 amendments · D-420+D-421 · D-422 · D-418 · D-419
Round 3:  Section 9 conformance pass
Round 4:  Bug 1 · D-423 · Bug 2
```

Code confirms this order at session open. If any Round 1 item proves unexpectedly complex, flag before proceeding to Round 2 — do not begin Section 9 until Rounds 1 and 2 are complete.

---

*Pathways OI Trust · Contract 22 · 2026-06-09 · CONFIDENTIAL*
