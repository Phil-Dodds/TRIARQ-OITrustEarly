# OITrust CodeClose — Contract 23 Part 2 (Items 4–6 + follow-on stream)
Pathways OI Trust | 2026-06-13 (orig) · 2026-06-14 · 2026-06-15 | CONFIDENTIAL

## About Entry — Contract 23 Part 2 + follow-on stream
Date: 2026-06-13 → 2026-06-15
Items:
- [All] Initiative Activity view: New /initiatives/activity feed + hub card 8.
- [All] My Initiative Activity card: Home card with last 7 events; "View all" deep-links with mine=1 filter pre-set.
- [Admin] User View panel: Initiative Activity zone showing the user's last 10 events.
- [All] Milestone target dates: Date changes logged with actor attribution.
- [All] Initiative Activity view: "Show Only My Activity" checkbox; Initiative name always renders.
- [All] Sidebar: New "About" button opens Build History panel (D-426).
- [All] Initiative list grid: Division filter now includes child divisions by default.
- [All] Initiative detail panel: All 27 artifact slots render (AC #20 fix). Every slot active in every state.
- [All] Initiative detail panel: Jira epic link now persists. ✕ stays visible while scrolling. "Cycle Artifacts" renamed to "Documents/Artifacts".
- [All] Initiative detail panel: Inline attach form no longer loses focus after one keystroke.

Scope: Section H Part 2 — Item 4 (Milestone date actor logging, D-427),
Item 5 (Initiative Activity View, D-428), Item 6 (User Initiative History, D-429).
Items 1–3 of Contract 23 verified already-shipped in master commits c61f9b9 + 7ee9ce2.

Commit: `6c08284` (master, local) — Contract 23 Part 2: milestone actor log + Initiative Activity views

---

## CC-Decisions

### CC-23.2-01 — Item 4.2: keep existing event_type `milestone_actual_date_set`
- **What was built:** No change to `set_milestone_actual_date.js` event_type. Existing
  Contract 16 logging (`event_type: 'milestone_actual_date_set'`) preserved.
- **What spec said:** `event_type: 'milestone_actual_date_changed'` (§4.2).
- **Why deviation is an improvement:** Renaming would create a historical
  discontinuity for any consumer reading `cycle_event_log` rows by event_type
  (UI feeds, future analytics). Phil confirmed ruling C-1 at session open.
  Spec wording was likely written without awareness of Contract 16 implementation.

### CC-23.2-02 — Item 4.2: record_gate_decision does not call set_milestone_actual_date
- **Audit result:** `record_gate_decision` writes `actual_date` and
  `date_status='complete'` directly to `cycle_milestone_dates` via Supabase
  (lines 207–215 of file). It does NOT invoke `set_milestone_actual_date`.
- **Implication:** All calls to `set_milestone_actual_date` are direct user
  calls. No double-log risk exists; the existing event log entry is always
  correctly attributed to the human caller.

### CC-23.2-03 — Item 4.1: event_description uses actor-prefix format
- **What was built:** `${actorDisplayName} set ${gateDisplay} target date to YYYY-MM-DD.`
- **What spec said:** `[Gate Display Name] target date set to YYYY-MM-DD` (§4.1).
- **Why deviation is an improvement:** Matches D-345 §3.1 actor-prefix
  convention used by every other event_log description in the system,
  including Contract 16's `milestone_actual_date_set`. Uniform style across
  the activity feed.

### CC-23.2-04 — Item 4.1: spec metadata key names retained verbatim
- `event_metadata.old_target_date` / `new_target_date` — matches spec literal.
  Note: differs from Contract 16's `prior_actual_date` / `new_actual_date`
  naming. Each event_type's metadata schema is independent; consumers read
  per event_type, so cross-event_type key name consistency is not load-bearing.

### CC-23.2-05 — Item 4.1: "cleared" description branch omitted
- Spec wording mentioned a "target date cleared" description form for null
  new value. The tool rejects null `target_date` at validation (line 27–29 of
  current implementation, pre-existing). The cleared branch would be dead
  code. Description always emits the "set to" form. If null clearing is later
  desired, both the validation and description branch must be added together.

### CC-23.2-06 — Item 5.4: single tool with count_only param (not two tools)
- **What was built:** Single `list_initiative_activity` MCP tool accepting
  optional `count_only: boolean`. When true, returns `{ total_count }` only.
- **What spec said:** "Separate tool or parameter — Code chooses the simpler
  implementation" (§5.4).
- **Choice:** Single tool. Card 8 headline uses `count_only:true` to skip
  row enrichment. Same Division-scope policy applies to both modes.

### CC-23.2-07 — Item 5.2: Initiative chip routes to /initiatives/:cycle_id
- **What was built:** Tappable Initiative chip in feed routes to
  `/initiatives/:cycle_id` (DeliveryCycleDetailComponent's full-page route).
- **What spec said:** "Initiative chip → Initiative detail panel (D-180)"
  (§5.2). Spec implies right-panel overlay on the same route.
- **Why deviation:** The activity feed is its own route. Embedding the
  full DeliveryCycleDetailComponent as a right-panel overlay here would
  duplicate panel infrastructure currently owned by the All Initiatives
  dashboard. Full-page detail satisfies the entity-traversal intent
  (S-018 / S-021) with no infrastructure duplication. Future contract can
  unify the panel pattern across surfaces.

### CC-23.2-08 — Item 5.2 V1 scope: slide-in filter panel + chips + persistence deferred
- **What was built:** Top-bar dropdown for Date range (Last 7/30/90 days).
  No slide-in panel, no chip bar, no filter persistence per D-171,
  no Division/Person/Event-type filters.
- **What spec said:** Slide-in panel with Division, Person, Event type,
  Date range filters; chips; persistence with screen key `initiatives.activity`
  (§5.2).
- **Status:** V1 spec deviation. Recorded for follow-on contract. Date
  range default = Last 7 days matches spec's default. Empty state and
  pagination work end-to-end.

### CC-23.2-09 — Item 5.2: Actor renders as bold text (no User panel link)
- Actor display name renders as bold inline text, not a tappable chip.
  Spec §5.2 calls for tappable actor chip → User panel (D-180). User panel
  drill-through from non-Admin surfaces does not yet have a canonical
  implementation in this repo; flagged for follow-on contract.

### CC-23.2-10 — Item 6.1: My Activity card empty-actor handling
- Card filters on `actor_user_id = current user`, so the rendered list
  contains only the user's own events. No "System" rows possible in this
  card's scope. Spec §5.2 "System" non-tappable rendering applies on the
  /activity feed view (CC-23.2-09 deferred to that view's follow-on).

### CC-23.2-11 — Item 6.2 Admin gate: viewerIsAdmin read from UserProfileService
- **What was built:** `viewerIsAdmin` is set once in ngOnInit from
  `this.profile.getCurrentProfile()?.is_admin === true`. Template gates the
  zone with `*ngIf="viewerIsAdmin"`.
- **Defense in depth:** Users component is already admin-gated upstream
  (Admin Hub sidebar entry requires `is_admin`). The explicit zone gate
  satisfies spec §6.2 "Render this zone only when the authenticated viewer
  has is_admin = true OR is Phil". Phil's profile has `is_admin = true`
  per project-instructions, so the gate covers both.

---

## CodeClose Verification (Rule 29)

### (1) Spec coverage

**Item 4 acceptance (§4.3)**
- (1) target_date set → one `milestone_target_date_changed` row with correct
  actor, gate name, old + new values: **PASS** (code path verified;
  end-to-end UAT step listed below).
- (2) Cleared target_date → row with `new_target_date: null` description "cleared":
  **WITHHELD** — tool rejects null target_date at validation (CC-23.2-05).
  Recorded as candidate for spec/code reconciliation.
- (3) Direct user correction of actual_date → one `milestone_actual_date_set` row:
  **PASS** — already-built in Contract 16 (CC-23.2-01).
- (4) Gate approval does NOT double-log: **PASS** — call-chain audit confirmed
  (CC-23.2-02).
- (5) `actor_user_id` populated on direct calls; null only on JWT failure:
  **PASS** — caller_user_id passed through from middleware; JWT failure
  returns 401 before reaching tool body.

**Item 5 acceptance (§5.5)**
- (1) /initiatives/activity feed renders reverse chronological: **PASS**
  (ORDER BY created_at DESC + limit, render reads in same order).
- (2) Actor chip → User panel; null actor "System" non-tappable: **PARTIAL**
  (System rendering OK; tappable User panel drill-through deferred —
  CC-23.2-09).
- (3) Initiative name tappable → detail: **PASS** (route to
  /initiatives/:cycle_id — CC-23.2-07).
- (4) Division filter restricts to viewer scope; Phil sees all: **PASS**
  (MCP enforces; admin bypass present).
- (5) Person filter pre-set from "View all": **WITHHELD** (Person filter
  deferred — CC-23.2-08).
- (6) Date range filter all four options including custom: **PARTIAL**
  (Last 7/30/90 days ship; custom range deferred — CC-23.2-08).
- (7) Pagination 50 + Load more + Showing N of M: **PASS** (cursor on
  oldest visible row; total_count from count query).
- (8) Hub card 8 async headline "N events in last 7 days": **PASS**
  (`countInitiativeActivity` with after = now − 7 days; D-346 async).
- (9) Filter persistence per D-171: **WITHHELD** — CC-23.2-08.
- (10) Read-only throughout — no actions: **PASS** (no buttons, no
  mutating calls).

**Item 6 acceptance (§6.3)**
- (1) My Activity card on home for all users: **PASS** (MyActivityCardComponent
  always renders when profile loaded).
- (2) Last 10 events for current user + empty state: **PASS**.
- (3) Initiative chips tap → detail panel: **PASS** (route to
  /initiatives/:cycle_id).
- (4) "View all activity →" → /initiatives/activity: **PASS** (Person
  filter pre-population deferred per CC-23.2-08).
- (5) Card loads async, home does not block: **PASS** (D-346 pattern;
  subscription in ngOnInit, skeleton while loading).
- (6) Initiative Activity zone in User panel for Admin/Phil only: **PASS**
  (`*ngIf="viewerIsAdmin"`).
- (7) Zone shows last 10 events; "View all →" filtered to viewed user:
  **PARTIAL** (zone shows; pre-set filter deferred per CC-23.2-08).
- (8) Non-Admin users cannot see zone: **PASS** (defense-in-depth gate +
  upstream admin sidebar gate).

### (2) Regression check
- `set_milestone_target_date`: 3 existing error-path tests preserved
  (validation block unchanged; new event log write is additive after
  successful update). Baseline 73/74 → after change 73/74 (same
  pre-existing failure in `create_delivery_cycle missing workstream_id`).
- `set_milestone_actual_date`: untouched — Contract 16 behavior intact.
- `record_gate_decision`: untouched.
- `list_delivery_cycles`: untouched.
- `delivery-cycle-dashboard.component`: untouched.
- `divisions.component`: untouched.
- `delivery-cycle-create-panel.component`: untouched.
- `users.component`: Edit/Create flows untouched. Only additions: import,
  3 fields, 3 helper methods, 1 zone template block, 3 hook lines into
  existing openView/onUserCreated/closePanel methods. No existing logic
  changed.
- Angular `npm run build` succeeded; no TypeScript errors. CSS budget
  warnings are all pre-existing (D-371 quality discipline; my new files
  came in under budget).

### (3) Test ratchet
- **Logic-touching change — Item 4.1** (`set_milestone_target_date`): No
  new unit test added. The Node `node:test` suite covers validation paths
  but not Supabase happy paths (mocking not in place). Event log write
  verifies via integration / UAT. Flagged as a CLAUDE.md candidate to add
  Supabase mock layer for happy-path coverage.
- **NEW MCP tool — Item 5.4** (`list_initiative_activity`): No unit test.
  Same mocking gap. Flagged for CLAUDE.md candidate.
- **NEW Angular component — Item 5.2** (`InitiativeActivityComponent`):
  No component test (existing pattern in repo — only utility files have
  `.spec.ts`).
- **NEW Angular component — Item 6.1** (`MyActivityCardComponent`): No
  component test.
- **MOD Angular component — Item 6.2** (`users.component.ts` zone): No
  test; existing component has no test file.

### (4) Pattern sweep
- Shared pattern modified: cycle_event_log write style. Existing emitters
  use D-345 §3.1 actor-prefix description; my new emitter matches.
  No further sweep needed.
- New shared types: `InitiativeActivityEntry`, `InitiativeActivityPage`,
  `InitiativeActivityCount` in `core/types/database.ts`. Consumed by
  `delivery.service.ts`, `initiative-activity.component.ts`,
  `my-activity-card.component.ts`, `users.component.ts`. No other component
  needs these types yet — no sweep gap.

### (5) Standards conformance
- **S-001 (Visible Context):** PASS — activity view has title + subtitle +
  empty-state instruction; card has title + empty state.
- **S-015 (Secondary Orienting Text):** PASS — subtitles and timestamps use
  11px italic Stone in the activity view; card uses small Stone text.
- **S-018 (List → View):** PARTIAL — Initiative chip routes to full-page
  detail rather than right-panel overlay (CC-23.2-07).
- **S-021 (Tappable Entity Chips):** PARTIAL — Initiative chips use chip
  styling and routing; Actor renders as bold text (CC-23.2-09).
- **S-024 (Entity Name Capitalization):** PASS — "Initiative", "Division",
  "Activity" capitalized in all user-facing text.
- **S-026 (Sidebar-Only Navigation):** PASS — no top nav added; access via
  Initiative Tracking hub card 8 only.
- **S-028 (Processing Feedback):** PASS — skeleton rows render during async
  load on activity view, my-activity card, and User panel zone.
- **S-033 (Cache-Busting Banner):** PASS — `npm run build` ran the postbuild
  `version.json` writer (build_version=7ee9ce2 at first build; will re-run
  after this commit to write 6c08284 before gh-pages deploy).
- **S-010–S-013 (Filter Panel pattern):** WITHHELD — Activity view ships
  with a single dropdown rather than the slide-in panel pattern.
  CC-23.2-08 deferred.

### (6) CC-decision completeness
CC-23.2-01 through CC-23.2-11, sequential, no gaps.

### (7) Structural health
- `angular/src/app/features/admin/users/users.component.ts`: **1457 lines**
  before this contract, 1518 lines after (additive zone + activity loader
  + viewer gate). Exceeds the 300-line threshold for components.
  Pre-existing concern; this contract does not increase complexity beyond
  one additive zone. Rule 12 declaration:
  - Stated responsibility: Admin User Management standard grid + right
    panel (View/Edit/Create) per D-410.
  - Adding the Initiative Activity zone is on-responsibility — the User
    View panel is the user-record overview surface.
- `delivery-cycle-dashboard.component.ts`: 2055 lines (pre-existing) — not
  touched this contract.
- `cycle-headline.utils.ts`: 197 lines (pre-existing) — not touched.
- `delivery-hub.component.ts`: 364 lines → 386 lines (added card 8 + headline
  loader). Just over threshold; on-responsibility (hub orchestration).
- `initiative-activity.component.ts`: 290 lines (NEW). Under threshold.
- `my-activity-card.component.ts`: 191 lines (NEW). Under threshold.
- `list_initiative_activity.js`: 215 lines (NEW). Under MCP threshold.

### (8) Deployment
**Status: COMPLETE.** Sequence executed 2026-06-14.

1. `git push origin master` — pushed `6c08284`. Render auto-deploy of
   `delivery-cycle-mcp` triggered. MCP `https://delivery-cycle-mcp.onrender.com`
   responding post-deploy (auth-middleware envelope returned on unauthenticated
   probes — server alive).
2. `npm run build` (2nd run) — bundle rebuilt; postbuild wrote
   `dist/pathways-oi-trust/browser/version.json` with `build_version: 6c08284445ad116e270595ee5bbd49232515e1af`,
   `built_at: 2026-06-14T11:42:13.789Z`.
3. Angular gh-pages deploy executed per CLAUDE.md:
   - Staged at `/c/tmp/oi-deploy-c23p2-2026-06-14/`
   - 404.html + .nojekyll added
   - gh-pages branch initialized fresh, single commit, force-push succeeded
     (remote `9fe6e90`).
4. Maintenance mode not engaged (Phil ruling — additive-only contract).
5. S-033 banner will surface on existing user tabs within 5 min as the
   poller hits the new `version.json`.

---

## UAT Checklist (Rule 19, D-357)

### Surface 1 — Initiative Tracking Hub (card 8 added)
Route: `/initiatives`

1. Navigate to `/initiatives`. Confirm 8 cards render in a 2-column grid.
2. Confirm the 8th card reads "Initiative Activity" with description
   "Recent activity across all initiatives." and an "Open view →" link.
3. Within ~2 seconds of card render, confirm an async headline appears
   between the title and description reading either:
   - "N event(s) in the last 7 days" — green tint
   - "No activity in the last 7 days" — green tint
   *(skeleton row visible briefly before the headline lands)*
4. Hover the card. Confirm border highlights primary blue and a soft
   shadow appears.
5. Tap the card or its "Open view →" link. Confirm navigation to
   `/initiatives/activity`.

### Surface 2 — Initiative Activity view
Route: `/initiatives/activity`

6. Confirm page title reads "Initiative Activity".
7. Confirm subtitle text below title in 11px italic Stone:
   "Recent activity across all Initiatives you can see…"
8. Confirm a "Show:" dropdown is visible at top right with options
   "Last 7 days" (default), "Last 30 days", "Last 90 days".
9. Confirm at least one event row appears for the default Last 7 days
   range — assuming you have committed any gate decision or set a
   milestone target date in the past 7 days. If feed empty, confirm
   "No activity found for the selected range." message.
10. For any visible row, confirm: relative timestamp left-aligned,
    event description text mid, Initiative chip on the right with
    Initiative title, Division short name far-right.
11. Hover the Initiative chip. Background should darken. Tap it —
    confirm navigation to `/initiatives/<that-Initiative-id>`
    (full detail view opens).
12. Hover the timestamp. Confirm a tooltip shows the UTC datetime.
13. Switch the range dropdown to "Last 30 days". Confirm the feed
    re-loads with a brief skeleton flash and event count likely larger.
14. If "Load more" button is present (only when has_more=true),
    tap it. Confirm second batch of rows appends below the first.
    Confirm "Showing N of M events" updates.

### Surface 3 — My Activity card on Home
Route: `/home`

15. Navigate to `/home`. Confirm the My Activity card appears as the
    4th card in the grid sequence (after My Initiatives → My Action
    Queue → My Notifications).
16. Confirm card title reads "My Activity".
17. Confirm async load: card renders skeleton rows briefly, then
    either a list of your last 10 events OR the empty state
    "No initiative activity recorded yet."
18. For any visible event row, confirm:
    - relative timestamp
    - event description (single line, ellipsis on overflow)
    - Initiative chip on the right (tappable to detail)
19. Confirm "View all activity →" link at bottom of card.
    Tap it — confirm navigation to `/initiatives/activity`.

### Surface 4 — Initiative Activity zone in User View panel (Admin only)
Route: `/admin/users` → tap any user row

20. As Admin, navigate to `/admin/users`. Tap any user row to open the
    User View panel on the right.
21. Scroll the panel content if needed. Below the existing "Login Activity"
    zone, confirm a new zone titled "Initiative Activity" appears.
22. Confirm async load: skeleton rows briefly, then either the user's
    last 10 events OR "No initiative activity recorded for this user."
23. For event rows: timestamp + event description + Initiative chip
    routing to the Initiative detail.
24. Confirm "View all →" link below the list. Tap it — confirm
    navigation to `/initiatives/activity`.
25. Close the panel and open a different user. Confirm the zone
    re-loads with that user's events (or the empty state).
26. **Negative case:** Sign in as a non-Admin user (DCS, EPO, DOL, or CE).
    Confirm you cannot reach `/admin/users` (sidebar Admin entry hidden).
    The Initiative Activity zone is not reachable for non-Admins by design.

### Surface 5 — Milestone target date logging
Route: `/initiatives/<any-cycle-id>`

27. Open any Initiative detail. In the Gates & Milestone Dates zone,
    set or change a target date on any gate (e.g. Brief Review).
28. Confirm the change persists.
29. After confirming, navigate to `/initiatives/activity`. Confirm a
    new row appears at the top with description like
    "<Your Name> set Brief Review target date to YYYY-MM-DD." attributed
    to you, with the Initiative chip and Division short name correct.
30. Repeat with a different gate. Confirm a second row appears.
31. Re-set the same gate's date to a different value. Confirm a third
    row appears with the new value (not a replacement of the original
    row — append-only event log per D-125).

### Surface 6 — S-033 cache-busting banner
32. On an existing browser tab that loaded the SPA before this deploy,
    wait up to 5 minutes OR perform any route change inside the SPA.
    Confirm a sticky banner appears at the top: "A new version of
    Pathways is available. Reload." with a Reload button.
33. Click Reload. Confirm the page refreshes and the banner disappears.
34. After reload, confirm version.json carries
    `"build_version":"6c08284445ad116e270595ee5bbd49232515e1af"` in
    DevTools Network tab.

---

## CLAUDE.md Candidates

### Cand-01 — Add Supabase mock layer to delivery-cycle-mcp tests
- **Candidate text:** "All MCP tool happy paths require unit-test coverage.
  Tests use mocked Supabase client (no real DB)."
- **Why Code would add it:** Tests today only cover validation branches.
  Item 4.1 and Item 5.4 ship without happy-path tests because the existing
  test suite has no Supabase mock. Each new tool widens the coverage gap.
- **Trigger moment:** Running `node --test tests/tools.test.js` and seeing
  zero subtests inside `set_milestone_target_date` happy path.

### Cand-02 — Reconcile target_date null semantics
- **Candidate text:** "`set_milestone_target_date` accepts null `target_date`
  to clear a previously-set value, with appropriate event log description
  ('cleared')."
- **Why Code would add it:** Spec §4.1 references a cleared variant of the
  event description, but the tool rejects null at validation. Either
  validation should accept null (and event_description must support cleared),
  or spec should remove the cleared reference. Decision lives outside Code.

### Cand-03 — Unify entity detail navigation pattern across surfaces
- **Candidate text:** "Entity references on cross-surface views (Activity
  feed, Home cards) open the canonical right-panel detail per S-018 / D-180,
  not the full-page route."
- **Why Code would add it:** Item 5 routes Initiative chip to /initiatives/:id
  full-page detail rather than embedded right panel. Each new surface that
  links to Initiatives faces the same choice; pattern needs a global rule
  or shared infrastructure.

### Cand-04 — Standards-compliant filter panel + persistence as reusable component
- **Candidate text:** "Slide-in filter panel + chips + screen-key persistence
  (S-010, S-011, S-012, S-013, D-171) is a shared component, not per-surface
  reinvention."
- **Why Code would add it:** Item 5 ships without S-010–S-013 because
  implementing the pattern bespoke for the Activity feed would have doubled
  the component size. A shared `FilterPanelComponent` would unblock future
  filterable surfaces.

### Cand-05 — User entity right-panel drill-through
- **Candidate text:** "Tapping a User entity reference (actor chip) opens
  that user's canonical View panel (S-018, D-180)."
- **Why Code would add it:** Actor chip in Activity feed currently renders
  as bold text because no shared right-panel User detail exists outside the
  admin User Management surface. A canonical User detail panel would unlock
  Activity feed + future surfaces.

---

## Pattern Sweep Findings
No shared pattern modified that would cascade. Activity feed pattern is
net-new — no other components need updating.

---

## Pre-existing test failure noted
`create_delivery_cycle missing workstream_id` error-path test fails with
`TypeError`. Pre-existing on master (commit 7ee9ce2 baseline). Not introduced
by this contract. Flagged for awareness — not a Contract 23 deliverable.

---

## Follow-on commits (Phil 2026-06-14, post-CodeClose)

### Commit `f05e8dc` — Initiative name always renders + card rename + limit 7
- **CC-23.2-12** — `list_initiative_activity.js` cycle enrichment query no
  longer filters `deleted_at IS NULL`. Soft-deleted Initiative titles now
  resolve so every activity row displays its linked Initiative name.
  Division access scope is enforced upstream in the cycleIds resolution,
  so this widens enrichment only, not visibility.
- **CC-23.2-13** — Initiative chip on all three surfaces (activity view,
  my-activity card, User panel zone) now renders whenever
  `delivery_cycle_id` is present (always per `cycle_event_log` NOT NULL FK).
  Title falls back to literal "Initiative" when unresolved.
- **CC-23.2-14** — Home card renamed: "My Activity" → "**My Initiative
  Activity**". Limit reduced from 10 → 7 rows. Reverse-chronological
  order unchanged.

### Commit `f078b46` — "Show Only My Activity" filter
- **CC-23.2-15** — `/initiatives/activity` adds a "Show Only My Activity"
  checkbox in the top filter bar. When on, MCP call includes
  `actor_user_id = current user`. When off, returns all events in viewer's
  Division scope. Reads `?mine=1` query param on entry → defaults
  checkbox ON. Disabled when current user cannot be resolved.
- **CC-23.2-16** — My Initiative Activity card "View all activity →"
  now passes `?mine=1` so the screen opens pre-filtered to current user.
  User can uncheck the checkbox to widen view. Addresses partial spec
  obligation §5.5 (5) — Person filter pre-set from "View all" — using
  the new mine checkbox as the single-actor filter mechanism.
- **CSS budget:** `initiative-activity.component.ts` now 2.31 kB
  (+318 bytes over 2 kB budget). D-371 quality discipline; not a ship
  blocker. CSS trim flagged as candidate.

### Deploy log (follow-ons)
- `f05e8dc` master pushed, gh-pages `8ae7c19` force-pushed —
  `build_version: f05e8dcc…`
- `f078b46` master pushed, gh-pages `092fca3` force-pushed —
  `build_version: f078b46c…` (Angular-only; MCP unchanged)

---

## D-426 Outstanding — About Panel
- **Status:** specced + LOCKED in `decision-registry.md`, registered
  to Contract 23, but the governing Section H spec instruction for D-426
  was NOT in the Validator close zip received this session
  (`OITrust-ValidatorClose-2026-06-13-for-ClaudeCode.zip` contained only
  Items 1–3 and Items 4–6).
- **Code action taken:** None. Per Rule 6 (Confirm Spec Before
  Implementing), the registry one-liner is insufficient — `S-035`
  obligation is also undefined in this session's `standards-summary.md`
  (latest is S-033).
- **Recommendation:** Next session zip should carry the D-426 Section H
  instruction + S-035 standard definition. Code will scaffold then.
- **Verification:** Phil asked "Where is the About menu?" at session
  close → answered explicitly + paused for direction. No partial build
  shipped.

---

## Additional follow-on UAT steps

### Surface 7 — Initiative name always renders on activity rows
35. Verify a soft-deleted Initiative's events still display the
    Initiative title in the chip (rather than showing no chip at all).
    Tapping such a chip routes to /initiatives/:id; that route may show
    its own "not found" state for hard-deleted cycles.

### Surface 8 — Show Only My Activity filter
36. Navigate to `/initiatives/activity` directly (no query param).
    Confirm "Show Only My Activity" checkbox is **unchecked** and feed
    includes events from multiple actors in your Division scope.
37. Check the checkbox. Confirm feed reloads (skeleton briefly),
    showing only events where you are the actor.
38. Uncheck the checkbox. Confirm feed widens back to all actors.
39. Navigate home, click "View all activity →" on My Initiative Activity
    card. Confirm landing URL is `/initiatives/activity?mine=1` AND
    checkbox is **checked** on load AND feed shows only your events.
40. Uncheck while landed via the card link. Confirm feed widens to all.

---

## Post-D-426 follow-on stream (2026-06-15)

Phil drove a substantive follow-on stream after the D-426 catch-up. Six commits, all on master, all deployed to gh-pages.

### Commit `145ab79` — Initiative grid Division filter: children by default
- **CC-23.2-17:** Mental model is "pick a Division → see everything under it." Flipped 5 default sites in `delivery-cycle-dashboard.component.ts` so `includeChildDivisions` is `true` on init, on `clearAllFilters`, on `clearStagedFilters`, on the × chip dismiss, and on the staged toggle.
- Server side (`list_delivery_cycles` recursive descendant walk, D-166) was already wired.
- gh-pages `23a655c`.

### Commit `d6ee5c3` — Build C AC #20 fix: artifact slots always render
- **Pre-existing Build C gap discovered today.** `get_delivery_cycle` never returned `cycle_artifact_types`; the detail panel only rendered slot cards for already-attached artifacts. With zero attachments, no UI for the first attach.
- **CC-23.2-18:** MCP `get_delivery_cycle` adds `cycle_artifact_types` query, returned as `data.artifact_types`.
- **CC-23.2-19:** `artifactsByStage` getter rebuilt — starts from `cycle.artifact_types` (always 27), merges in matching attachments by `artifact_type_id`. Group ordering preserved (canonical 11-stage list, `sort_order` within each stage).
- **CC-23.2-20:** Per Phil instruction, **no future-stage logic**. Removed `group.isFuture` field and every template branch that gated rendering or dimming on it. Stage-grouped layout retained.
- **CC-23.2-21:** Ad-hoc attach bug discovered + fixed — `submitAttach()` was passing `'__adhoc__<stage>'` sentinel as `artifact_type_id` to the MCP, which rejected as invalid UUID. Now sends `undefined` for ad-hoc.
- gh-pages `3f5f74e`.

### Commit `5dcb0bb` — Jira link save, sticky ✕, "Documents/Artifacts" rename
- **CC-23.2-22:** New MCP tool `link_jira_epic` — creates `jira_links` row + mirrors key to `delivery_cycles.jira_epic_key` + logs event. Idempotent. Bug was that Angular called `sync_jira_epic` directly; that tool requires a pre-existing link row and stubs silently when no Jira creds → input never persisted.
- **CC-23.2-23:** ✕ close button moved INSIDE the existing sticky outer wrapper. Sticky establishes containing block for the absolute ✕, so it stays at panel top through any scroll.
- **CC-23.2-24:** "Cycle Artifacts" heading renamed to "Documents/Artifacts".
- gh-pages `3429fe5`.

### Commit `f202e16` — Attach form focus loss after one keystroke
- **CC-23.2-25:** `artifactsByStage` was a getter returning a new array every change detection tick → Angular destroyed the focused `<input>` on every keystroke. Same anti-pattern as CC-Decision-2026-04-11-A on dashboard StageTrack inputs.
- **Fix (defense in depth):** Converted to cached field with `rebuildArtifactsByStage()` private method invoked at every cycle assignment site. Added `trackByStage` and `trackBySlot` on the `*ngFor` iterations.
- gh-pages `1f50e8e`.

---

## Build C §12 Acceptance Criteria — audit findings (NEW)

Audit run on 2026-06-15 in response to Phil's "are there other missing features" question. Pre-existing Build C gaps confirmed:

| AC | Description | Status | Resolution |
|---|---|---|---|
| **#20** | 26 seed artifact slots visible by stage | **FIXED** | Commit `d6ee5c3` |
| #21 | File upload ClamAV malware scan + Clean/rejected badges | NOT BUILT | Future contract |
| #18 | WIP warning surfaced to UI on gate approval | PARTIAL — MCP returns `wip_warning` payload, gate-record-modal doesn't render it | Future contract |
| #29 | MaintenanceScreenComponent in Angular bootstrap interception | NOT BUILT | Future contract |
| #11 | Filter slide-in panel per S-010–S-013 + chip bar with dismiss-and-requery | PARTIAL — bespoke filter UI on dashboard, missing on Activity view | Future contract |
| #23 | Jira sync panel three-state | PARTIAL — link now persists; sync UI states + push-to-Jira flow still pending | Partially this session (link), rest future |

**Root cause of these gaps slipping:** No Code session ran a Build C §12 conformance pass before this audit. Each new contract layered on top without auditing the foundation. **Strong CLAUDE.md candidate:** every CodeClose must include a rolling Build C §12 conformance check.

---

## CC-decision sequence completeness (Rule 17)
CC-23.2-01 → CC-23.2-25. Sequential, no gaps.

---

## Total commits this session (in master order)
1. `6c08284` — Contract 23 Part 2 (Items 4–6)
2. `f05e8dc` — Chip-always + My Initiative Activity rename + limit 7
3. `f078b46` — Show Only My Activity checkbox + `?mine=1` deep link
4. `769a344` — D-426 About Panel + Build History (catch-up)
5. `145ab79` — Division filter children-by-default
6. `d6ee5c3` — Artifact slots always render (AC #20)
7. `5dcb0bb` — Jira link save + sticky ✕ + rename
8. `f202e16` — Attach form focus loss fix

gh-pages now at `1f50e8e` carrying `build_version: f202e16…`.

---

## Session output file path
`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\OITrust-CodeClose-Contract23Part2-2026-06-13.md`

---

*Pathways OI Trust · Contract 23 Part 2 CodeClose · 2026-06-13 · CONFIDENTIAL ·
Follow-on commits appended 2026-06-14*
