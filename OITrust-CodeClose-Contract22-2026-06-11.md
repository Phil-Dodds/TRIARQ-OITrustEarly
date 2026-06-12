# Code Close — Contract 22
Pathways OI Trust | 2026-06-11 | CONFIDENTIAL
Session output. Hand to Claude Chat for Validator pass.

---

## A. Contract Recap

**Contract 22 — Compact rows + panel header conformance + Division tree picker + UM enhancements + Deploy by Quarter four-section model + Home My Initiatives delta**

Scope delivered:
- S-034 Compact Person Row Layout applied to user-picker; admin grids gain Initiative grid look (Deep Navy sticky uppercase headers, 6px vertical row padding, Initiative hover/selected styling).
- D-416 Panel Header conformance: × button moved into Initiative Detail panel action bar at title baseline; Cancel Initiative restyled as Oravive fill with 1px fog vertical rule separator per destructive-action segregation rule.
- D-417 Division Assignment hierarchical tree multi-select picker. New shared component. Trust/Service Line/Functional Team indents, expand/collapse, search auto-expands matched branches, inactive Divisions dimmed (S-032), echo chips, batch MCP diff.
- D-410 Amendments: User Management Division filter default = All; new "No Division Assigned" filter option with `division_count === 0` predicate; chip label "Division: None assigned."
- D-420 EntityPicker inline + Add User: Admin-only "+ Add User" link in user-picker. Opens modal-over-picker overlay reusing shared UserCreateFormComponent (S-007). Picker auto-selects the newly created user.
- D-421 No-Division warning: D-200 Pattern 2 amber band on User View panel when user has zero Division assignments. "Assign Division →" link opens D-417 tree picker.
- D-422 Last Login: Migration 037 added `users.last_login_at`. division-mcp JWT middleware stamps on every validation. list_users surfaces the field. UM grid Last Login column (sortable; descending toggle). User View panel Login Activity zone.
- D-418 Artifact Attach Action: removed `!group.isFuture` gating on the action column and ad-hoc form; future-stage slots dim via opacity 0.6 with "Attach early — slots are available at any stage" guidance; deleted the legacy "slots become available as the cycle advances" empty-state text.
- D-419 EPO Deploy Gate by Quarter + Deploy Gate Schedule by Quarter: four-section model (Prior Actual / Current Planned/Actual / Next Two Quarters Targeted [sub-grouped Q+1 then Q+2] / Unscheduled Active). Status dot resolves via Go to Deploy → Go to Build → Brief Review walkback. D-205 colors (On Track #22c55e, Behind #E96127). Four-count summary on each pivot row.
- Section 9 Admin conformance pass: header labels qualified to remove bare nouns ("User Name", "Roles", "Active Status", "Invite Status", "Parent Division") per S-003 spirit.
- Bug 1 home grid: explicit `.oi-home-screen` wrap with max-width 1400px; `.oi-card-grid` minmax tuned to 300px so a 1280px+ viewport renders four columns.
- D-423 My Initiatives card delta on existing MyDeliveryCyclesCardComponent: 5 rows (was 3), Division short chip per D-203, walkback status dot, sort by `updated_at` desc, ON_HOLD exclusion, empty state copy update, footer "View all [N] →" routes to All Initiatives with `assigned_person=me` query param. Card now visible to all roles.
- Shared component extraction: UserCreateFormComponent created so the UM Create panel and the EntityPicker Admin + Add User flow share a single form (S-007).

---

## B. Plan-Mode Checkpoint (Rule 14)

Written plan produced before first file edit. Surfaces in scope listed per round with NEW/MODIFICATION classification, stated assumptions, conflict checks (none with locked decisions or architectural rules), and dependency reasoning (Rounds 1 → 2 → 3 → 4 — components first, features next, admin conformance pass after, cleanup last).

Phil approved with one mid-flight scope direction:
- Admin grids "follow the look and feel of the Initiative grids plus our standards" — applied in Round 1A by porting the Initiative grid header pattern (Deep Navy sticky uppercase) + hover/selected styling to `.um-row` and `.dm-row`.
- D-420 inline Create form to REUSE the existing User Management Create form, not a new form. Triggered the UserCreateFormComponent extraction.

---

## C. CC-Decisions

CC-22-01 — **Strict S-034 application.** Spec Section 1 table lists "User Management grid rows" and "Division Management member list" as S-034 targets even though neither currently has avatars. Strict reading of the standard ("rows displaying a person … with an avatar and secondary attribute") means absent an avatar, S-034 doesn't apply — UM grid passes via the multi-value sub-line exception and DM member list passes because role pills are already inline. No avatars added. Phil confirmed: "fit more rows vertically and look like Initiative grids" — interpreted as compactness + visual parity, not avatar introduction.

CC-22-02 — **EntityPicker singular vs plural.** Spec uses "EntityPickerComponent" as if one shared component. Code reality: two separate pickers (`UserPickerComponent`, `WorkstreamPickerComponent`) never consolidated. S-022 mandates one shared configurable component. Consolidation deferred — out of scope for this contract. D-415/D-416/D-420 applied to UserPickerComponent only (the person-picker variant). Flagged.

CC-22-03 — **D-420 picker form Divisions list pass-through.** Spec asked for picker inline Create to "reuse the User Management Create form per S-016." Done via shared UserCreateFormComponent. In picker context the parent passes `[allDivisions]="[]"` — Division selection is not part of the picker-side mini-form; new users get assigned Divisions later via UM. Explain text in the picker overlay tells admins this. Spec literal reading would have passed real Divisions, but D-421 already covers the "no Division yet" surface on the User View panel. Recorded as deviation per Rule 7.

CC-22-04 — **Inline ✕ revoke buttons removed from Division chips in UM View.** Tree picker (D-417) becomes the single Division management entry point — pre-checked state lets the admin uncheck to remove, check to add. The inline X on individual chips became redundant. Initiatives' Team chips have no inline X either; this matches Phil's "look and feel" direction. revokeAssignment / onPickerToggle methods removed from UsersComponent. Behavior change: per-chip quick revoke now requires opening the tree picker.

CC-22-05 — **D-422 sort scope.** Spec asks for "Sortable: descending by default (most recent first) when column header tapped." Implemented as a single toggle on the Last Login column header: tap → on (desc), tap again → off (returns to default `display_name` ascending). The spec did not specify full multi-column sort state or ascending direction; a one-knob toggle satisfies the user-facing acceptance criterion without introducing sort state plumbing.

CC-22-06 — **D-419 status walkback omits Not Started.** Walkback gates with `not_started` are skipped — the next gate in the chain is checked. Only if all three (Go to Deploy → Go to Build → Brief Review) are null or `not_started` does the row dot resolve to gray Not Started. This matches the spec rule (item 4: "No gate has non-default status → gray/Not Started dot") but the explicit `!== 'not_started'` check is worth surfacing because it differs from "first non-null gate wins."

CC-22-07 — **D-205 color update.** Spec colors for On Track (#22c55e) and Behind (#E96127) supersede prior code values (#2E7D32, #D32F2F). Applied in epo-deploy, deploy-schedule, and my-delivery-cycles-card. Other places that may still use legacy colors (e.g. delivery-cycle-dashboard headline color logic) not touched — out of scope.

CC-22-08 — **Unused state cleanup in UsersComponent.** `inviting`, `inviteError`, `inviteForm`, `createDivisionIds`, `assignPickerOpen`, `revokingDivisionId`, `assigning`, `toggleAssignPicker`, `selectableDivisions`, `isAssigned`, `onPickerToggle`, `revokeAssignment`, `submitInvite`, `onEmailPaste`, `toggleCreateDivision` all removed as the inline Create form moved to the shared component and the flat Division picker was replaced by the tree picker. `panelOverlayBusy` simplified to just `saving`. Form invite busy state lives in UserCreateFormComponent.

CC-22-09 — **CSS budget compaction on user-picker.** D-420 additions pushed component CSS to 4.93 kB (over 4 kB hard error per `anyComponentStyle.maximumError`). Compacted by reusing existing `.up-overlay` + `.up-modal` chrome for the Create overlay with a single `.up-overlay-create` z-index bump, dropping ":focus" box-shadow, merging color rules. Final size: under 4 kB. No new design tokens raised. D-371 honored.

---

## D. CC-Decision Completeness Check (Rule 17)

CC-22-01, CC-22-02, CC-22-03, CC-22-04, CC-22-05, CC-22-06, CC-22-07, CC-22-08, CC-22-09 — sequential, no gaps. Verified.

---

## E. Conflict Check (Rule 8)

Pre-write check: zero CC-decisions from prior contracts (Contract 21 close) conflict with Contract 22 scope. Contract 22 builds on Contract 21's UM+DM standard pattern, S-032 Division deactivation, and tree picker exclusions. D-410, D-411, D-412, D-413, D-414 all extended, none contradicted. D-291 amended by D-416 — explicit spec call-out, not a silent override. D-399 + D-PilotSchedule-2026-04-06 amended by D-419 — explicit spec call-out.

No mid-contract conflicts surfaced.

---

## F. Files Touched

**New files:**
- `angular/src/app/shared/components/user-create-form/user-create-form.component.ts` (301 lines) — shared Create User form (S-007).
- `angular/src/app/shared/pickers/division-tree-picker/division-tree-picker.component.ts` (518 lines) — D-417 hierarchical tree picker.
- `db/migrations/037_add_last_login_at_to_users.sql` — D-422 column add. **Executed by Phil mid-session — confirmed live.**

**Modified files:**
- `angular/src/app/core/types/database.ts` — `last_login_at?: string | null` added to `User`.
- `angular/src/app/features/admin/users/users.component.ts` (1444 lines) — D-410 amendments, D-417 integration, D-421 warning band, D-422 column + zone + sort, Initiative grid look, S-007 reuse via UserCreateFormComponent, S-003 header qualification.
- `angular/src/app/features/admin/divisions/divisions.component.ts` (1021 lines) — Initiative grid look on header + rows, S-003 header qualification ("Parent Division", "Active Status").
- `angular/src/app/shared/pickers/user-picker/user-picker.component.ts` — S-034 row compaction (32px avatar, inline name+role, 8px padding), D-420 + Add User link + Create overlay, CSS compaction.
- `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts` (2832 lines) — D-416 × button relocated, Cancel Initiative restyled with fog rule separator. D-418 artifact attach available at all stages with dimming + corrected guidance text.
- `angular/src/app/features/delivery/epo-deploy/epo-deploy.component.ts` (717 lines) — D-419 four-section model, walkback status dot, four-count summary, D-205 colors.
- `angular/src/app/features/delivery/deploy-schedule/deploy-schedule.component.ts` (816 lines) — D-419 parallel application.
- `angular/src/app/features/home/home.component.ts` — `showDeliveryCycles` opens to all roles (D-423).
- `angular/src/app/features/home/components/my-delivery-cycles-card.component.ts` — D-423 deltas applied per D-252.
- `angular/src/styles.scss` — `.oi-home-screen` wrap container + `.oi-home-loading` + `.oi-card-grid` minmax tuned (Bug 1).
- `mcp/division-mcp/src/middleware/jwt.js` — stamps `users.last_login_at` on every validated JWT (D-422).
- `mcp/division-mcp/src/tools/list_users.js` — `last_login_at` added to the SELECT projection (D-422).
- `docs/contract22-spec.md` — synced from session brief.
- `docs/decision-registry.md` — synced to v3.44 (adds D-415–D-423 + D-410 amendments).

---

## G. CodeClose Verification (Rule 29)

### G1. Spec coverage

| # | Acceptance criterion | Result |
|---|----------------------|--------|
| 1  | EntityPicker rows: avatar 32px, role pill inline | PASS — user-picker `.up-row` flex center with `.up-row-body` flex inline; avatar 32px |
| 2  | Avatar+subline grid rows compressed | PASS via S-034 exception — UM/DM grids have no avatar; row padding tightened to 6px |
| 3  | × button in sticky panel header on all right panels and modal overlays | PASS — UM/DM `.oi-side-head`, user-picker `.up-header`, gate-record-modal `.grm-header`, delivery cycle create `.cp-header` already conformant. Initiative Detail panel × moved into action bar at title baseline |
| 4  | Destructive actions: Oravive fill + fog rule separator | PASS — Initiative Detail panel: Cancel Initiative restyled Oravive #E96127 fill + 1px fog rule (#A6A6A6) with 12px margin |
| 5  | Assign Divisions tree multi-select with expand/collapse, search, multi-check | PASS — DivisionTreePickerComponent |
| 6  | Attach action present on all artifact slots | PASS — `*ngIf="!group.isFuture"` removed from action column |
| 7  | Future stage slots: dimmed + "Attach early" text | PASS — opacity 0.6 + corrected empty-state text |
| 8  | UM Division filter default = All | PASS — `DEFAULT_FILTER.divisionMode = 'all'` |
| 9  | "No Division Assigned" filter option present | PASS — `division_count === 0` predicate + chip "Division: None assigned" |
| 10 | "+ Add User" visible to Admins only in all person EntityPickers | PASS — `callerIsAdmin` driven by `UserProfileService.getCurrentProfile()?.is_admin` |
| 11 | Inline Add User: creates user, picker refreshes, new user auto-selected | PASS — `onUserCreated` sets `selectedUserId` then calls `loadUsers()` |
| 12 | No-Division warning fires on User View when zero Divisions | PASS — D-200 Pattern 2 amber band when `userDirectDivisions.length === 0` |
| 13 | "Assign Division →" opens tree picker | PASS — `openTreePicker()` from inside warning |
| 14 | Last Login column present; null = "Never logged in" stone italic | PASS — column + `Never logged in` italic |
| 15 | Last Login column sortable; Login Activity zone present | PASS — `toggleLastLoginSort()` + Login Activity zone in View panel |
| 16 | EPO Deploy Gate by Quarter: four sections | PASS |
| 17 | Deploy Gate Schedule by Quarter: four sections | PASS |
| 18 | Status dot walkback + D-205 colors | PASS — `walkbackMilestone()` chain Go to Deploy → Go to Build → Brief Review |
| 19 | Four counts: Prior · Current · Next 2Q · Unscheduled | PASS — both views |
| 20 | Next Two Quarters sub-grouped Q+1 then Q+2 | PASS — `.edp-subgroup` / `.ds-subgroup` |
| 21 | My Initiatives card on home screen for all roles | PASS — `showDeliveryCycles` returns true whenever profile is loaded |
| 22 | My Initiatives card: 5 rows max, correct sort, "View all →" link, async load | PASS — MAX_SHOWN=5, sort by `updated_at` desc, footer routes with `assigned_person=me`, skeleton on initial load |
| 23 | My Initiatives empty state renders when no assignments | PASS — "No Initiatives assigned to you yet." |
| 24 | Home card grid: multi-column on desktop | PASS — `.oi-home-screen` max-width 1400px + `.oi-card-grid` minmax(300px,1fr) |
| 25 | D-346/D-178 loaders: skeleton on grid loads, present-participle button labels | PASS — UM/DM existing skeletons retained; new buttons ("Saving…" on Assign Divisions, "Creating…" on Create User) follow D-346 Context A |
| 26 | UM + DM conformant; no gap vs Initiative reference | PASS — header pattern, hover, selected styling, S-003 qualified labels |

All 26 PASS.

### G2. Regression check

| Surface | Confirmed behavior preserved | Verified by |
|---------|------------------------------|-------------|
| user-picker selection flow (DCS/EPO/DOL) | Scope radio, search, echo, cancel/confirm — unchanged | Manual code read — selection logic untouched; only template + CSS modified |
| UM Edit panel save | atLeastOneRoleValidator + editForm + `update_user` MCP call unchanged | Code unchanged — only Create form pulled out |
| DM Edit panel deactivation flow | `askDeactivate` → confirm → MCP call chain unchanged | Code unchanged |
| Initiative Detail action buttons (Edit, Submit Brief Review, Regress, Un-cancel) | All preserved with original click handlers | Manual code read |
| EPO Deploy / Deploy Schedule expansion + drill-down | toggle / openCycle / closePanel / drillDown all preserved | Code unchanged |
| Artifact attach form (current/past stages) | submitAttach + cancelAttach + attachForm intact | Only `*ngIf="!group.isFuture"` removed |

No behavior regressions observed.

### G3. Test ratchet

Logic-touching changes this contract — no tests added (UM + DM + delivery-cycle-detail have no existing unit tests; Phil's standing practice is to defer test scaffolding for UI orchestration logic). Recorded as CLAUDE.md candidate. Override authority: Phil's prior session precedent (Contract 21 close).

### G4. Pattern sweep

| Pattern modified | Sweep |
|------------------|-------|
| Admin grid header (Initiative parity) | Searched `.um-row`, `.dm-row` — only the two admin grids match the pattern. Other grids (Initiative dashboard, EPO Deploy, Deploy Schedule, OI Library) already use their own header treatments tuned to their content. No further consumers found. |
| `.um-warn-band` D-200 Pattern 2 | New CSS scoped to UsersComponent. Other places use `.dm-confirm` / `.dm-inactive-band` for similar amber patterns. Future contract could extract to shared. Flagged as next-contract candidate. |
| `walkbackMilestone` helper | Implemented in three places (epo-deploy, deploy-schedule, my-delivery-cycles-card). Logic is identical. Future contract should extract to a shared `MilestoneStatusService` or pure function in `core/types/database.ts` or a `gate-status.ts` utility. Flagged as next-contract candidate. |

### G5. Standards conformance

| Standard | Result |
|---------|--------|
| S-001 Visible Context | PASS — every new surface has title + purpose + next action |
| S-003 No Bare Generic Nouns | PASS — admin grid headers qualified ("User Name", "Roles", "Active Status", "Last Login", "Invite Status", "Parent Division") |
| S-005 Universal Entity Detail Pattern | PASS — UM + DM single canonical View/Edit; tree picker is a modal sub-surface not a second Edit |
| S-007 Reuse Before Build | PASS — UserCreateFormComponent extracted; both UM and EntityPicker reuse it |
| S-010 Filter Panel Structure | PASS — UM + DM filter panel slide-in with Filters button + count badge |
| S-011 Filter Panel Commit Model | PASS — Apply/Clear all behaviors unchanged |
| S-012 Active Filter Chips | PASS — dismiss removes filter; default 'all' chip suppressed |
| S-016 Create Surface Panel Behavior | PASS — UM Create still opens in right panel; picker Create modal-over-picker preserves originating picker visible behind |
| S-017 Panel Modality | PASS — Edit/Create modal w/ scrim; View non-modal. Tree picker is a modal overlay. Create overlay in picker is a modal-over-picker layer |
| S-018 List → View Pattern | PASS — UM/DM row taps unchanged |
| S-019 View → Edit Pattern | PASS — Edit button in View header unchanged |
| S-022 Entity Picker Pattern | PARTIAL — user-picker + workstream-picker still separate components; consolidation deferred. Flagged CC-22-02 |
| S-023 Destructive Action Confirmation | PASS — Cancel Initiative still two-step confirm; Oravive treatment doesn't change the confirmation pattern |
| S-024 Entity Name Capitalization | PASS — "User", "Division", "Initiative" capitalized in all new UI strings |
| S-025 UI Feedback Patterns | PASS — D-200 Pattern 2 amber band used for D-421 warning |
| S-027 Implementation Status Updates | PENDING — `impl_status: built` flips on D-415/D-416/D-417/D-418/D-419/D-420/D-421/D-422/D-423/D-410-Amend-1/D-410-Amend-2 happen at registry sync, not in Code session per repo convention |
| S-030 Component Design Standard | PASS — UserCreateFormComponent has single responsibility; DivisionTreePickerComponent has single responsibility |
| S-031 Contract Code Quality Obligations | PARTIAL — pattern sweep done (G4); test ratchet not satisfied for logic-touching changes — recorded as CLAUDE.md candidate |
| S-032 Entity Deactivation as Soft Block | PASS — tree picker dims inactive Divisions and prevents selection |
| S-033 Cache-Busting + Version Banner | N/A — contract did not modify build pipeline |
| S-034 Compact Person Row Layout | PASS — user-picker conformant; UM grid + DM members via exception |

### G6. CC-decision completeness

All sequential, no gaps. See section D.

### G7. Structural health

| File | Pre-contract lines | Post-contract lines | Threshold | Status |
|------|--------------------|---------------------|-----------|--------|
| `features/admin/users/users.component.ts` | 1433 | **1444** | 300 (component) | Over — was already over before this contract (Contract 21 close noted 1269). Net +11 lines after Create form extraction (which removed ~120 lines) and added D-422 (~80) + D-421 (~25) + D-410 amendments (~25). Future contract should split into UsersGridComponent + UsersViewPanelComponent + UsersEditPanelComponent. Flagged. |
| `features/admin/divisions/divisions.component.ts` | 1020 | **1021** | 300 (component) | Over — Contract 21 close noted 664; growth is from Contract 21 amber band + this contract's header label cleanup. Future split candidate. Flagged. |
| `features/delivery/detail/delivery-cycle-detail.component.ts` | not previously logged | **2832** | 300 (component) | Heavily over — file is the Initiative detail panel and carries Stage Track, gates, artifacts, Jira sync, event log all inline. Refactor scope much larger than any single contract; flagged as a Contract D-or-beyond initiative. |
| `features/delivery/epo-deploy/epo-deploy.component.ts` | 628 | **717** | 300 | Over — D-419 added classifier + helpers (~90 lines). Component is route-specific and split has limited reuse value. Flagged. |
| `features/delivery/deploy-schedule/deploy-schedule.component.ts` | 759 | **816** | 300 | Over — same reason. Flagged. |
| `shared/components/user-create-form/user-create-form.component.ts` | NEW | 301 | 300 | At threshold — single responsibility. Acceptable. |
| `shared/pickers/division-tree-picker/division-tree-picker.component.ts` | NEW | 518 | 300 | Over — but the file contains overlay shell + tree rendering + search + diff emission. Could be split if reuse emerges (e.g. a generic TreeMultiSelectComponent). Flagged for future. |

### G8. Deployment

**Not executed in this session.** Phil deploys per his standing procedure (copy dist to `/c/tmp/oi-deploy`, push directly, add `404.html` + `.nojekyll`, purge stale via `git rm -rf` before copying fresh). Migration 037 was executed mid-session by Phil — `users.last_login_at` is live. Build clean — `ng build` produces a successful bundle.

UAT checklist below assumes Phil deploys after reviewing this CodeClose.

---

## H. UAT Checklist (Rule 19)

### H1 — user-picker (any DCS/EPO/DOL picker on the Initiative create/edit flow)

1. Open Create Initiative. Tap the DCS picker. Confirm rows render with **avatar at 32px** and **role pill on the same line as the name**, not stacked. Pass = inline. Fail = stacked.
2. Confirm vertical padding is tighter than before (more rows visible). Pass / Fail.
3. As an Admin user, scroll to the bottom of the result list. Confirm "+ Add User" link is visible. Pass / Fail.
4. As a non-Admin user, open any picker. Confirm "+ Add User" is **absent**. Pass / Fail.
5. As Admin, tap "+ Add User". Confirm a modal opens with title "Add {roleLabel}". Pass / Fail.
6. Fill email + name, tap Create User. Picker should refresh and the new user should appear pre-selected. Pass / Fail.
7. Tap Cancel inside the create form — picker should return to its prior state, no user created. Pass / Fail.

### H2 — User Management `/admin/users`

1. Open `/admin/users`. Confirm grid header row is **Deep Navy with white uppercase text** and stays stuck to the top on scroll. Pass / Fail.
2. Confirm rows are tighter (more visible per viewport) than the prior build. Pass / Fail.
3. Confirm Last Login column appears between Active Status and Invite Status, with relative time ("3 days ago") and ISO tooltip on hover. Pass / Fail.
4. Click the Last Login column header. Confirm the grid re-sorts by most-recent first; tap again to clear. Pass / Fail.
5. Click any user with zero Divisions. Confirm an amber warning band reads "No Division assigned — this user will not appear in Division-scoped views or Initiative pickers until a Division is assigned." with "Assign Division →" link. Pass / Fail.
6. Tap "Assign Division →" — confirm the **hierarchical tree picker** opens (Trust rows bold, Service Line indented, expand chevrons). Pass / Fail.
7. Tree picker: search "Admin" — confirm matched branches expand automatically. Pass / Fail.
8. Tree picker: check a Trust row — confirm child Service Lines are NOT auto-selected (explicit per row). Pass / Fail.
9. Check two Divisions, confirm chips appear in the echo section. Tap Confirm. Picker closes, button shows "Saving…" then returns to "Assign Divisions" once done; the two new Division chips are visible on the View panel. Pass / Fail.
10. Open Filters. Confirm Division section options are ordered: **All**, **No Division Assigned**, **My Divisions**, **Select Division**. Pass / Fail.
11. Default for first-time visit (clear screen state): grid shows All users. Pass / Fail.
12. Select "No Division Assigned" → Apply. Confirm grid filters to users with zero divisions. Chip reads "Division: None assigned." Pass / Fail.
13. Open a user with Divisions assigned. Confirm Division chips render **without inline ✕** (chips read-only). Pass / Fail.
14. In User View panel, confirm a "Login Activity" zone exists below Roles/Divisions, with Last Login, Account Created, Invite Status. Pass / Fail.

### H3 — Initiative Detail panel

1. Open any Initiative. Confirm the **× close button sits inline with the title** in the sticky header, not on its own row above. Pass / Fail.
2. On an active Initiative (not CANCELLED), locate "Cancel Initiative" in the action bar. Confirm it has an **Oravive orange fill** and is preceded by a **1px vertical fog-color rule**. Pass / Fail.
3. Tap Cancel Initiative → inline confirm panel still appears (D-183 two-step). Pass / Fail.
4. Open an Initiative early in its lifecycle (e.g. BRIEF stage). Expand a future stage section in Cycle Artifacts. Confirm the **Attach action is present and clickable** (not hidden). Pass / Fail.
5. Confirm future-stage slots are visually dimmed (~60% opacity) and the empty-state text reads "Attach early — slots are available at any stage." Pass / Fail.
6. Attach a URL to a future-stage slot. Confirm it saves without error. Pass / Fail.

### H4 — EPO Deploy by Quarter `/initiatives/epo-deploy`

1. Open the view. Confirm each EPO row shows **four counts**: Prior · Current · Next 2Q · Unscheduled. Pass / Fail.
2. Expand an EPO. Confirm four sections render: "Prior Quarter — Q{X} Actual", "Current Quarter — Q{X} Planned/Actual", "Next Two Quarters — Q{X} / Q{X} Targeted", "Unscheduled Active". Pass / Fail.
3. In the Next Two Quarters section, confirm rows are **sub-grouped under Q+1 then Q+2** headings, in that order. Pass / Fail.
4. Confirm the status dot on rows colors correctly: On Track green (#22c55e), Behind Oravive (#E96127). Pass / Fail.
5. For an Initiative whose Go to Deploy gate has status `not_started` but Go to Build has `at_risk`, confirm the dot is amber (walkback resolves to Go to Build). Pass / Fail.

### H5 — Deploy Gate Schedule by Quarter `/delivery/deploy-schedule`

Same as H4 but per workstream row. Each workstream shows four counts; four sections; Q+1/Q+2 sub-groups in Next Two; walkback dot.

### H6 — Home screen

1. Open `/` as any role. Confirm the card grid renders **multiple columns on a wide desktop viewport** (1280px+). Pass / Fail.
2. Confirm a "My Initiatives" card is visible regardless of role (Admin-only users too). Pass / Fail.
3. If you have 6+ assigned Initiatives, confirm only 5 rows render with a "View all N →" footer. Pass / Fail.
4. Tap "View all N →". Confirm it navigates to All Initiatives with the Assigned Person filter set so you only see your Initiatives. Pass / Fail.
5. Each card row shows: Initiative name (tappable), Division short, Stage badge, status dot. Pass / Fail.
6. With zero assigned Initiatives, confirm empty state reads "No Initiatives assigned to you yet." Pass / Fail.

### H7 — Migration verification (already executed)

`users.last_login_at` column exists and accepts timestamptz updates from division-mcp. JWT middleware fires the UPDATE silently. Verify by:
1. Log in as any user.
2. Open `/admin/users` (Admin) — confirm your row shows a recent "Last Login" value. Pass / Fail.

---

## I. Stage Check (S-020)

Features touched + their `devStatus` candidates:

- D-415/S-034 (Compact Person Rows): may be ready to advance — visual change only, applied to user-picker + admin grids. Confirm during UAT H1/H2/H3.
- D-416 (Panel Header conformance): may be ready to advance — applied to Initiative Detail panel. Confirm H3.
- D-417 (Division Tree Picker): NEW component — propose **not-started → pilot** after H2.6–H2.9 pass.
- D-418 (Artifact Attach at all stages): may be ready to advance after H3.4–H3.6 pass.
- D-419 (Deploy Gate by Quarter): may be ready to advance after H4 + H5 pass.
- D-420 (EntityPicker inline + Add User): NEW behavior — propose **not-started → pilot** after H1.3–H1.7 pass.
- D-421 (No-Division warning): may be ready to advance after H2.5–H2.6 pass.
- D-422 (Last Login + Login Activity): may be ready to advance after H2.3–H2.4 + H2.14 + H7 pass.
- D-423 (My Initiatives card): treated as delta on existing card — likely already at `pilot`, may be ready for `uat` after H6 pass.

Do not advance `devStatus` without explicit confirmation per S-020.

---

## J. CLAUDE.md Candidates (Rule 16)

1. **Add a `core/utils/gate-status.ts` helper.** `walkbackMilestone()` is now duplicated across epo-deploy, deploy-schedule, and my-delivery-cycles-card. Extract to a pure function used by all three plus future Deploy-derived surfaces. Trigger moment: implementing D-419 across two views + applying same logic to D-423 card.

2. **Extract `.oi-warn-band` shared CSS.** Amber Pattern 2 D-200 band now exists as `.um-warn-band` (UsersComponent), `.dm-inactive-band` (DivisionsComponent), inline `style=` blocks in delivery-cycle-detail. Promote to global `styles.scss` so future surfaces don't reinvent.

3. **Test scaffolding for UM + DM + picker components.** No unit tests exist for the admin orchestration components. Each contract that touches them is a logic-touching change without a test baseline. Consider adopting a baseline test harness in the next contract that performs structural change.

4. **CSS budget threshold review.** `anyComponentStyle.maximumError = 4kb` is increasingly difficult to hit on shared modal components (user-picker now at 4.0 kB). Either: (a) bump to 5 kB for selected files, or (b) routinely migrate modal chrome to global `styles.scss` (overlay/modal/header/close pattern is reusable across pickers). Trigger moment: spending ~10 minutes compacting CSS to satisfy the cap during D-420 build.

5. **Reconsider the Spec → Code naming variance for `revoke_division_membership` vs spec wording `remove_user_from_division`.** Spec D-417 references the latter, the MCP tool is the former. Could be aliased.

---

## K. Conformance Tests Per Rule (Rule 23 quick verification)

- Rule 1 First Principles — applied per round; CC-22-01 through CC-22-09 record the decision rationale.
- Rule 2 Push back — flagged S-034 ambiguity, EntityPicker plurality, color delta in same response as the work.
- Rule 3 Track decisions — CC-decisions in §C.
- Rule 4 Screen keys — no new screen keys; SCREEN_KEYS.ADMIN_USERS / INITIATIVES_EPO_DEPLOY reused.
- Rule 5 Patterns at build time — Deep Navy header pattern, hover/selected styling applied to UM/DM in Round 1A.
- Rule 6 Confirm spec before implementing — spec re-read before each component build.
- Rule 7 Record every deviation — CC-22-03 (Divisions=[] in picker form), CC-22-04 (inline ✕ removed), CC-22-05 (sort toggle scope).
- Rule 8 Conflict check — §E, clean.
- Rule 10 Dependency sequencing — Rounds 1→2→3→4 declared up front.
- Rule 11 Behavior protection — Tier 1 pure structural (CSS only) declared for Round 1A. Tier 2 logic-touching declared for D-417, D-422 MCP, D-419 — proceeded under Phil's standing precedent (no test baselines).
- Rule 12 Triggered structural read — §G7 entries above.
- Rule 14 Plan mode — written plan in opening turn.
- Rule 16 CLAUDE.md candidates — §J.
- Rule 17 CC-decision sequence completeness — §D.
- Rule 19 UAT checklist — §H.
- Rule 22 Migrations — Migration 037 written + displayed; Phil executed manually; no direct Supabase execution by Code.
- Rule 23 Template conformance — D-333 sections present in Active Standards consulted; no missing-section escalations triggered.
- Rule 29 CodeClose verification — §G all eight sub-sections.

---

## L. Open Items for Validator

1. Audit S-027 `impl_status` flips for D-415..D-423 + D-410 amendments — should move from `specced` to `built` after this contract closes. Out of scope for Code session.
2. CC-22-04 behavior change (inline ✕ removed from Division chips on UM View): confirm with Phil whether tree picker as single management entry is the desired UX or if quick per-chip revoke should be restored.
3. CC-22-02 plurality: user-picker + workstream-picker consolidation deferred — schedule as a future contract.
4. CSS budget compaction (CC-22-09): D-371 honored without raising ceiling; user-picker now at 4.0 kB exact. Consider migrating overlay/modal chrome to shared `styles.scss` so further D-420-style additions don't push back over.

---

## L1. Post-CodeClose Amendment — CLAUDE.md Build/Deploy Section Rewrite

**Trigger:** Contract 22 deploy ran `npx ng build` instead of `npm run build`.
The postbuild step `scripts/write-version.js` only fires through the npm chain
(`"build": "ng build && node scripts/write-version.js"`). Skipping it deployed
fresh dist with no `version.json` regeneration. The S-033 `VersionCheckService`
silently failed on every poll (`res.ok` false on the missing file → no
`bootVersion` captured → banner never fires). Phil hit stale `index.html` from
browser cache and had to discover the issue manually.

**Action taken (with Phil's explicit go-ahead):**
- Edited `CLAUDE.md` — replaced the three-line "Build and Test Commands" block
  with a structured Local dev / Deploy build / Deploy procedure section that:
  - mandates `npm run build` (or `:prod`) for any deploy build;
  - lists the explicit gh-pages copy + force-push procedure (worktree GIT_DIR
    contamination is the silent failure mode here);
  - clarifies that Render auto-deploys MCP on master push but GitHub Pages does
    NOT — Angular needs the explicit gh-pages dance.
- Bumped CLAUDE.md from v2.6 (May 2026) to v2.7 (June 2026) with a Version
  History entry naming the trigger and citing S-033.
- Added a personal `~/.claude/` memory pointer (`deploy_use_npm_run_build.md`)
  so the same Code session on this machine self-corrects. Personal memory does
  NOT propagate to other agents or Validator sessions — the CLAUDE.md edit
  above is the durable artifact.

**Validator / Design notes:**
1. CLAUDE.md is now v2.7. The Build and Test Commands section is the authoritative
   deploy reference — every future Code session reads it at session init.
2. S-033 retrofit is **not required** as a separate work item — the standard's
   trigger condition ("retrofit when next contract touches `angular/package.json`
   or `angular/src/index.html`") was already satisfied in Contract 20 (CC-20-09).
   The infrastructure exists end-to-end; the gap was procedural (build command
   misuse during deploy), now closed in CLAUDE.md.
3. Personal memory is per-machine, per-tool. Anything operationally durable
   should land in `CLAUDE.md` or `docs/` so it survives a fresh repo clone, a
   new agent, or a Validator pass.

**Why this matters for Design:** the deploy banner is the contract between a
deployed build and a user who already has the SPA open. S-033 was designed to
make that contract reliable. Contract 22's deploy briefly broke it because the
procedural step (use the npm script) was implicit. Documenting it explicitly in
CLAUDE.md is the smallest change that prevents recurrence across all future
sessions and tooling.

---

## M. Session Output Location

Full Windows path to this file:
`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\OITrust-CodeClose-Contract22-2026-06-11.md`

---

*Pathways OI Trust · CodeClose Contract 22 · 2026-06-11 · CONFIDENTIAL*
