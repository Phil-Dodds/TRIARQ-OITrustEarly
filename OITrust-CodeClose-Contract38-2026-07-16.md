# CodeClose — Contract 38 — Leader-Name Section Defaults + Live Meeting Presence
Session date: 2026-07-16 | Repo: TRIARQ-OITrustEarly | Branch: master
Deployed SHA: 2d1a4d5 (gh-pages cb76720) | CONFIDENTIAL

---

## Scope

Phil (live in a Teams meeting with Shirish Bhavsar and Vijay Patil) requested:
1. Series sections stop defaulting to "Phil" — use the first leader's actual name.
2. Live presence on the meeting screen — colored initial avatars (matching the
   initiative/reference-panel icons) showing who else is on the meeting, with a
   chip that moves to whichever section each person is working in
   (Google-Docs-style simultaneous-collaboration pattern).

No formal spec document exists — built from the Phil-approved in-session
proposal (Rule 6 flag; see CC-38-01).

---

## Worktree Hygiene (Rule 31)

Source-confirmed: `angular/`, `mcp/`, `db/` present at repo root. No reset required.

## First Principles record (Rule 1)

Trigger: new table (`team_meeting_presence`) + poll-tool redesign.
- **Context:** two live collaborators already share a 10s `meeting_changed_since`
  poll; Arch-1 forbids Supabase Realtime from Angular.
- **Question:** does presence need a new transport? No — the poll already carries
  the heartbeat cadence.
- **Reduce:** no new endpoint, no new poll loop, no WebSocket. One upsert + one
  select added to the existing tool.
- **Simplify:** presence rows never deleted; freshness window (25s) decides
  "here now". No deleted_at, no cleanup job.
- **Automate:** heartbeat is implicit in the poll; UI updates with zero extra
  user action.
Direction locked only after the above.

---

## CC-Decisions

- **CC-38-01** — No governing spec doc for either feature. Built from the
  Phil-approved proposal in this session (mockup + design message). Rule 6
  surfaced; Phil's "go" on the proposal is the authorizing instruction.
- **CC-38-02** — Catalog stores a literal `{leader}` token (migration 071);
  resolution happens at snapshot time. Phil picked dynamic-name option over
  static role-neutral names.
- **CC-38-03** — "First leader" = earliest active leader membership
  (`created_at` asc), fallback = track creator, final fallback = literal
  "Leader". First name only (`display_name` first token).
- **CC-38-04** — Admin catalog editor receives RAW `{leader}` text;
  series-settings dropdown receives resolved text via new optional
  `resolve_for_track_id` param on `list_section_catalog`. Protects the token
  from being baked over by an admin save. `resolve_for_track_id` is
  access-checked (assertTrackAccess) before resolution.
- **CC-38-05** — Existing tracks keep their snapshot titles — no retroactive
  rename. Leaders edit per-series via the existing pencil control.
- **CC-38-06** — Presence transport = piggyback on `meeting_changed_since`
  (Arch-1 blocks Supabase Realtime from Angular). Latency = poll cadence (10s),
  accepted in design discussion.
- **CC-38-07** — `team_meeting_presence` has no `deleted_at` and no DELETE
  path — ephemeral rows expire via 25s freshness window (2.5 poll intervals).
  Arch-6 satisfied (no hard delete exists). RLS enabled deny-all per Rule 38.
- **CC-38-08** — Presence write failures never fail the poll (upsert error →
  empty presence array). Makes deploy order irrelevant: old/new Angular, MCP,
  and migration can land in any sequence without breaking live collab.
- **CC-38-09** — Focused section = last section expanded or typed in (section
  toggle, add-bullet focus, bullet-note focus, notes focus). Collapsing the
  focused section clears it. Client also seeds one poll immediately after
  meeting load so presence appears without waiting 10s.
- **CC-38-10** — Presence avatar colors reuse the id-hashed 10-color palette
  already used by dcs-reference-panel and MCP presenter sections — same person,
  same color everywhere. Function duplicated locally per existing codebase
  pattern (flagged in CLAUDE.md candidates).
- **CC-38-11** — CSS budget breach (detail component styles exceeded the 10 kB
  hard cap by 534 B after presence CSS) resolved per D-371 by quality work, not
  a ceiling raise: deleted three dead rules the template no longer references
  (`tmd-notes-readonly`, `tmd-bullet-note-readonly`, `tmd-close-btn`) and
  grouped `background:none; border:none; cursor:pointer` shared by eight
  button rules into one selector. Emitted CSS now 10.00 kB.

Sequence check: CC-38-01 … CC-38-11, no gaps.

---

## Surfaces Touched

| Surface | Class | Change |
|---|---|---|
| `db/migrations/071_leader_placeholder_section_catalog.sql` | MODIFICATION (data) | `{leader}` token into escalation + comms catalog rows |
| `db/migrations/072_team_meeting_presence.sql` | NEW | presence table + RLS |
| `mcp/team-meetings-mcp/src/leader_placeholder.js` | NEW | token resolver + first-leader lookup |
| `mcp/team-meetings-mcp/src/tools/tracks.js` | MODIFICATION | create_track / add_track_section / list_section_catalog resolution; meeting_changed_since presence |
| `angular .../core/types/team-meetings.ts` | MODIFICATION | `MeetingPresenceEntry` |
| `angular .../team-meetings.service.ts` | MODIFICATION | poll + catalog signatures |
| `angular .../tracks/track-settings.component.ts` | MODIFICATION | pass track context to catalog list |
| `angular .../detail/team-meetings-detail.component.ts` | MODIFICATION | presence stack + section chips + focus tracking + CSS budget work |
| `angular .../core/data/changelog.ts` | MODIFICATION | S-035 About entry |
| `mcp/team-meetings-mcp/tests/leader-placeholder.test.js` | NEW | resolver + validation tests |

## Structural Health (Rule 12)

| File | Lines at read | Responsibility | Threshold |
|---|---|---|---|
| `mcp/.../tools/tracks.js` | 1495 (pre-change) | Track/series CRUD + membership + sections + poll | EXCEEDS 400 (pre-existing) |
| `angular .../team-meetings-detail.component.ts` | 1416 (pre-change) | Meeting prep/run screen | EXCEEDS 300 (pre-existing) |
| `angular .../team-meetings.service.ts` | 239 | MCP call façade | OK |
| `angular .../tracks/track-settings.component.ts` | 653 | Series settings panel | EXCEEDS 300 (pre-existing) |
| `angular .../core/types/team-meetings.ts` | ~260 | Type definitions | OK |

---

## CodeClose Verification (Rule 29)

**(1) Spec coverage** — no formal spec (CC-38-01). Against the Phil-approved proposal:
- Sections default to first leader's actual name — PASS (migration 071 + resolver at create_track/add_track_section/list_section_catalog).
- Colored icon + initials for other live person(s), matching initiative icons — PASS (id-hashed palette identical to reference panel).
- Icon moves to the section a person clicks into — PASS (focused_section_key heartbeat + per-section chips).

**(2) Regression check** — surfaces touched: meeting detail (poll/merge path unchanged except presence side-channel; verified by unchanged test results + successful build), series settings catalog dropdown (server resolves; response shape unchanged), admin catalog editor (call unchanged → raw text), create-track (template flow unchanged; resolution server-side). MCP suite pass-set identical pre/post (13 passing baseline tests still pass; see 3).

**(3) Test ratchet** — baseline: 20 tests, 13 pass, 7 fail (all 7 pre-existing stale "non-admin caller" assertions from the pilot-era admin gate, unrelated). After: 30 tests, 23 pass, same 7 fail. New coverage: `resolveLeaderPlaceholder` (5 tests), `firstNameOf` (4), `meeting_changed_since` missing-param validation (1).
**Untested items (D-442):** (a) `firstLeaderFirstName` DB path, (b) presence upsert/select happy path, (c) `list_section_catalog` resolve path, (d) Angular presence rendering. (a)–(c) are multi-query — Rule 37 single-result mock cannot sequence them; validation-path-only per rule. (d) covered by UAT checklist. **Phil: acknowledge this untested list at UAT.**

**(4) Pattern sweep** — shared pattern modified: none structurally; avatar-color hash now exists in 4 places (dcs-reference-panel, delivery edit-panel, delivery create-panel, meeting detail) plus MCP presenterColor. Flagged as next-contract extraction candidate (see CLAUDE.md Candidates).

**(5) Standards conformance** —
- S-001: presence chips carry title tooltips naming the person and location — PASS.
- S-003: new columns qualified (`meeting_id`, `user_id`, `section_key`, `last_seen_at`, `presence_id`) — PASS.
- S-015: no new orienting text zones — N/A.
- S-021: presence avatars are status indicators, not tappable entity references (no drill-down target exists for "user detail") — flagged as candidate rather than silently deciding.
- S-028: no new MCP-calling controls added (presence is read-along on existing poll; poll is in BusyService READ_TOOLS) — PASS.
- S-030: presence logic lives in detail component (its screen); resolver logic in its own MCP module — PASS.
- S-031: see (3) and (4); new methods named verb+object+context (`setFocusedSection`, `presenceInSection`, `resolveLeaderPlaceholder`, `firstLeaderFirstName`) — PASS.
- S-035: About entry + changelog.ts in deployment commit 2d1a4d5 — PASS.
- Optimistic-reversion rule: no timers added — PASS. Busy-guard rule: no new server-calling controls — PASS.

**(6) CC-decision completeness** — CC-38-01…11 sequential, no gaps — PASS.

**(7) Structural health** — table above; three pre-existing threshold breaches declared, none introduced this contract.

**(8) Deployment** —
- Angular: built AFTER commit (Rule 35), deployed to gh-pages `cb76720`, `version.json` = 2d1a4d5 = master HEAD. 404.html + .nojekyll present. Live URL served prior SHA at check time (CDN propagation); S-033 banner will surface the update.
- MCP: master pushed (de5bc18 → 2d1a4d5). **Render does NOT auto-deploy — Phil must manually redeploy team-meetings-mcp.** Health endpoint answered (401 from JWT middleware = service alive, old code).
- Migrations 071 + 072: written and displayed — **Phil executes manually** (standing migration rule). Deploy order is safe in any sequence (CC-38-08).
- Maintenance mode: not engaged — all changes backward-compatible in every ordering; no window where users see a broken state.

**(9) Repo cleanliness** — 4 untracked new files found and added before push (`leader_placeholder.js`, test file, two migrations); `leader_placeholder.js` is require()'d by tracks.js — Render-crash class averted. Result: 4 untracked files found and added.

---

## UAT Checklist (Rule 19 / D-357)

**Pre-req: run migrations 071 + 072 in Supabase, then redeploy team-meetings-mcp in Render.**

### 1. Live presence — meeting screen
What changed: "Here now" avatar stack in the meeting header; per-section chips that follow each person's focus.
1. You + Shirish both open the same meeting (two accounts, two machines). Within ~10s, each of you sees the other's colored initials next to the series name with "Here now". Pass/Fail.
2. Hover the avatar — tooltip names the person. Pass/Fail.
3. Shirish clicks into a section (expands it or clicks a note box). Within ~10s your screen shows their chip on that section's header. Pass/Fail.
4. Shirish moves to a different section — chip moves there on your screen within ~10s. Pass/Fail.
5. Shirish closes the tab. Within ~25–35s their avatar disappears from your header. Pass/Fail.
6. Solo user on a meeting sees no presence UI at all (no empty "Here now"). Pass/Fail.
7. Chip color for a person matches their color in the right-hand reference panel. Pass/Fail.

### 2. Leader-name section defaults — new series
What changed: catalog escalation/comms rows carry `{leader}`; new series resolve it to the creator's first name.
1. As Shirish (or any non-Phil leader), create a new series with the Team Meeting template. Sections read "Escalation to Shirish, Inform Shirish, Blockers" and "Shirish Communications / Reminders" (sub-labels match). Pass/Fail.
2. Existing series (e.g. Weekly AI Coding Framework / Governance) still shows its current titles — unchanged. Pass/Fail.
3. In series settings, "Add from shared list" dropdown shows leader-resolved titles, not `{leader}`. Pass/Fail.
4. Admin → Meeting Sections catalog editor shows the raw `{leader}` token (intentional). Pass/Fail.
5. Remove the escalation section from a test series, re-add from shared list — re-added title carries the first leader's name. Pass/Fail.

### 3. About panel
1. About panel shows the Contract 38 entry (presence + leader-name sections). Pass/Fail.

---

## About Entry — Contract 38
Date: 2026-07-16
BuiltAt: 13:00 UTC
Items:
- [All] Team Meeting screen: "Here now" avatar stack + per-section presence chips that move with each person's focus.
- [All] Series sections: new series default the escalation/communications section names to the series leader's first name instead of "Phil".

## Stage check (S-020)
Team Meetings is `pilot`. Presence + leader-naming extend the pilot surface; no advancement flagged — per standing guidance, advancement is only flagged after Phil has UAT'd.

---

## CLAUDE.md Candidates (Rule 16)

1. **Candidate:** "Avatar color hash (31-multiplier over 10-color palette) is duplicated in dcs-reference-panel, delivery edit-panel, delivery create-panel, team-meetings-detail, and MCP tracks.js presenterColor. Next contract touching two of these: extract to a shared `avatar-color.ts` util (S-031 duplicated-logic rule)."
   **Why:** fifth copy added this session; palettes must stay in sync for the one-person-one-color promise.
   **Trigger:** implementing presence chips (CC-38-10).
2. **Candidate:** "Component CSS budget: detail screens ride within ~500 B of the 10 kB hard cap. Before adding styles to team-meetings-detail, check emitted size; reclaim via dead-rule deletion / declaration grouping per D-371, never via angular.json budget raise."
   **Why:** build failed mid-contract on exactly this; the fix pattern (dead rules + grouped declarations) is reusable.
   **Trigger:** CC-38-11 build failure.
3. **Candidate:** "S-021 scope question for Design: are presence/attribution avatars 'entity references' requiring tappable chips, or status indicators exempt from S-021? Presence chips and bullet-author initials currently render non-tappable."
   **Why:** two surfaces now show non-tappable person initials; a locked answer prevents per-contract re-litigation.
   **Trigger:** standards conformance pass (5).

---

## Phil's open actions
1. Run migration 071, then 072 in Supabase SQL editor (SQL below in session close message).
2. Render dashboard → team-meetings-mcp → Manual Deploy (master 2d1a4d5).
3. UAT checklist above (needs a second user for presence steps).
4. Acknowledge untested-item list in Verification (3) per D-442.
5. Hand CC-38 decisions to Design for D-number assignment.

---

# Follow-on Addendum — News Banner Blocking Fix (same session, 2026-07-16)

Phil report: bottom news banner sometimes blocks key controls; new users don't
know it can be hidden. Analysis approved, "go" given. Deployed SHA: ac41d12
(gh-pages 600b1ce). Angular-only — no MCP, no migration, no Render action.

## Root cause
Banner was `position:fixed; bottom:0; z-index:900`. Pre-existing reservation
(`.oi-main-content { padding-bottom: 38px }`) was (a) unconditional — never
reclaimed when hidden, (b) main content only — sidebar Sign out still covered,
(c) irrelevant to fixed panels (z 100–210 < 900) whose bottom strip the banner
overrode, and to inner `height:100vh` columns. Hide control buried in the tag
click-menu; collapsed handle sat on the sidebar's Sign out corner.

## Addendum CC-Decisions

- **CC-38-12** — Space reservation via `--nb-space` CSS custom property on
  `.oi-app-root` (0px default; `38px + env(safe-area-inset-bottom)` when the
  strip actually renders). `NewsTickerService` gains `bannerVisible$`
  (BehaviorSubject) which the banner component reports (visible = not hidden
  AND items.length > 0; false on destroy). `.oi-app-shell` consumes the var —
  sidebar now included. Replaces the unconditional main-content padding.
  Space reclaims immediately on hide and when the ticker is empty.
- **CC-38-13** — Banner z-index 900 → 80 (menus 901 → 81): above in-page
  sticky headers (40) and pickers (50), below slide-in panels and scrims
  (100–210). A modal always beats the banner; panel footer controls
  (Save/Cancel) can no longer be covered.
- **CC-38-14** — Always-visible `×` dismiss on the banner's right edge
  (aria-labelled; no busy state — local hide, no MCP call). Collapsed handle
  moved bottom-left → bottom-right, off the sidebar Sign out corner; menu
  anchors right.
- **CC-38-15** — The eight `position:sticky; height:100vh` dashboard side
  columns were left unchanged this pass: they are scrollable lists with no
  bottom-pinned controls, and were equally covered before this fix (no
  regression). They may consume `var(--nb-space)` for full clearance —
  next-contract candidate.
- **CC-38-16** — `env(safe-area-inset-bottom)` added to banner height and the
  reservation so iOS home bars don't eat the strip.

Sequence check: CC-38-01 … CC-38-16, no gaps.

## Addendum Verification (Rule 29 deltas)

1. **Spec coverage** — no spec doc; against Phil-approved analysis: reserve
   space (PASS — CC-38-12), reclaim on hide (PASS — Phil's explicit question,
   confirmed by binding to `bannerVisible$`), modal precedence (PASS —
   CC-38-13), visible dismiss + handle relocation (PASS — CC-38-14).
2. **Regression check** — banner render/scroll/reactions untouched; hide
   persistence unchanged (localStorage). App shell padding change is
   presentation-only. Build green.
3. **Test ratchet** — view/layout-only template + CSS changes (exempt class);
   `bannerVisible$` push logic is trivially observable in UAT.
   Untested: service subject wiring (no Angular test harness runs on this
   setup — `ng test` pre-existing broken). Phil: acknowledge per D-442.
4. **Pattern sweep** — no shared pattern modified. `--nb-space` is a NEW
   shared mechanism; documented in app.component comment.
5. **Standards** — Arch-2 kept (state in service, components render);
   busy-guard N/A (× makes no server call); S-035 changelog entry in deploy
   commit ac41d12 — PASS.
6. **CC-decisions** — 12–16 sequential — PASS.
7. **Structural health** — news-ticker.service.ts 63 lines, app.component.ts
   ~185, news-banner.component.ts ~260 — all under thresholds.
8. **Deployment** — commit → build (Rule 35) → gh-pages 600b1ce;
   version.json ac41d12 = master HEAD. No MCP surface — Render untouched.
9. **Repo cleanliness** — no new files; not applicable.

## Addendum UAT Checklist

### News banner behavior
1. Open any long screen (e.g. Initiative Tracking). Scroll to bottom — last row/footer fully visible ABOVE the banner, not under it. Pass/Fail.
2. Sidebar Sign out button fully visible and clickable with banner showing. Pass/Fail.
3. Open any Edit/Create slide-in panel — panel bottom (Save/Cancel area) draws OVER the banner; nothing blocked. Pass/Fail.
4. Click the × at the banner's right edge — banner hides, page content drops down to use the freed space immediately (no reload). Pass/Fail.
5. Collapsed "◂ OI Trust" handle appears bottom-RIGHT; click → "Show news banner" → banner returns and space is re-reserved. Pass/Fail.
6. Refresh after hiding — banner stays hidden (persistence). Pass/Fail.
7. "OI Trust" tag menu still offers Hide/Show as before. Pass/Fail.

---

# Follow-on 2 — Egg Hunt Leader Moved to Community Card (same session)

Phil report: leader display on wrong card. Discussed, "go" given.
Deployed SHA: d2b6e39 (gh-pages f6e08c4). Angular-only.

- **CC-38-17** — Spec deviation (Rule 7): the Easter Egg leaderboard spec placed
  the leader strip on My Easter Eggs. **What was built:** leader strip is now a
  pinned row (fog background) at the top of "Egg hunt — community", above the
  feed. **What spec said:** leader on My card. **Why better:** hunt standings
  are community information — on the personal card the row read as a second
  personal count and literally duplicated "X of 10" when the caller led.
  Content unchanged per spec (name, X of 10, leader's most recent egg).
  Implementation: community card reads `leader`/`totalEggs` from the shared
  `basket$` state it already subscribed to; `ensureLoaded()` added so the strip
  populates even if the My card hasn't initialized first.

**Verification deltas:** view-only template move, no logic change (test-ratchet
exempt); build green; S-035 changelog entry in deploy commit d2b6e39; no new
files (repo cleanliness N/A); deployment gh-pages f6e08c4, version d2b6e39 =
master HEAD.

**Addendum UAT:**
1. Home → "Egg hunt — community" shows a pinned Leader row at top (egg icon, name, X of 10). Pass/Fail.
2. "My Easter Eggs" no longer shows the Leader row; card ends with the "quiet corners" hint. Pass/Fail.
3. Find an egg (or have another user find one) — leader strip and feed update together. Pass/Fail.

---

# Follow-on 3 — Compact Egg Cards + Dancing-Egg Teaser (same session)

Phil: "Shrink the cards down vertically" + dancing egg over Home nav for
zero-egg users. Deployed SHA: 1c452cf (gh-pages 25be07e). Angular-only.

- **CC-38-18** — Both egg cards drop `height:100%` (were stretching to the
  tallest card in the Home grid row); community find-feed capped at 280px with
  internal scroll. Cards now size to content.
- **CC-38-19** — Dancing-egg teaser: sidebar Home nav item occasionally shows
  a small animated egg — ONLY while the caller's basket shows zero eggs found
  (shared `basket$` state; stops permanently on first find, including
  mid-session). Cadence: first appearance 30–90s after load, then every 4–9
  minutes, ~7s visible, random egg art each time. (Amended same session, Phil
  suggestion: repeat interval shortened to 1–3 minutes — deployed 6bb82c2.)
  Decorative by design:
  `pointer-events:none`, `aria-hidden`, no hunt credit — pure curiosity nudge
  toward the Home screen. No persistence, no server calls.
- **CC-38-20** — `EggIconComponent` (standalone) added to `app.module.ts`
  imports so the module-declared sidebar can render it.

**Verification deltas:** teaser logic is new (no confirmed behavior modified —
Rule 11 exempt); timers cleaned in ngOnDestroy; build green; S-035 changelog
entry in deploy commit 1c452cf; no new files. Sidebar now 431 lines —
**exceeds 400-line threshold**; single responsibility still "role-aware
navigation + nav ornaments"; extraction of teaser into a directive is a
next-contract candidate if the sidebar grows again.

**Addendum UAT:**
1. Home cards: both egg cards shorter; community feed scrolls inside the card; row no longer stretches to feed length. Pass/Fail.
2. Zero-egg user (fresh account): within ~90s of sign-in, small egg dances beside "Home" in the sidebar for ~7s, then disappears; reappears within ~10 min. Pass/Fail.
3. Clicking the dancing egg does nothing beyond normal Home navigation — no hunt credit. Pass/Fail.
4. User with ≥1 egg (you): teaser never appears. Pass/Fail.
5. Find your first egg while teaser eligible — teaser stops for good. Pass/Fail.

---

# Follow-on 4 — Home Screen Standard Height + Value-First Order + Live Statuses (same session)

Phil: standard card height, move purposeless cards down, organize for EPO/DCS
value, advance nav statuses past pilot. Deployed SHA: e9da20f (gh-pages
5c3466d). Angular-only.

- **CC-38-21** — Standard Home card height: 340px, content scrolls inside.
  Chosen so the tallest natural content (egg grid, activity feed) fits without
  scroll while empty cards stop reading as holes. Scoped
  `.oi-home-screen .oi-card-grid .oi-card` in styles.scss — hub screens keep
  natural heights.
- **CC-38-22** — Home card order (spec deviation, Rule 7 — supersedes
  D-425/D-429 append-after-Notifications ordering on Phil's instruction):
  My Initiatives (D-423 lead preserved) → My Action Queue → My Activity →
  My Completed Gates → egg cards → Divisions/User Management/System Health
  (admin) → Notifications, OI Library, OI Assistant (placeholder value, bottom).
- **CC-38-23** — devStatus pilot → live: Home, My Actions, Team Meetings.
  Phil's explicit instruction (Initiative Tracking already live). S-020
  advancement confirmation satisfied by the instruction itself.

**Verification deltas:** template reorder + global CSS + constant edits — no
logic; build green; S-035 changelog entry in deploy commit e9da20f; no new
files. Stage check (S-020): statuses advanced this contract at Phil's
direction — no further flags.

**Addendum UAT:**
1. Home: all cards equal height (340px); long content (activity feed, egg grid, division list) scrolls inside its card. Pass/Fail.
2. Card order: Initiatives, Action Queue, Activity, Completed Gates first; eggs next; admin cards after; Notifications / OI Library / OI Assistant last. Pass/Fail.
3. Non-admin (Shirish): same order minus admin cards. Pass/Fail.
4. Sidebar: Home, My Actions, Team Meetings, Initiative Tracking all show "Live". Pass/Fail.
5. Hub screens (Delivery hub, Admin hub): card heights unchanged. Pass/Fail.

---

# Follow-on 5 — "Coming Soon …" Sidebar Group (same session)

Phil: collapse all coming-soon nav items under one expandable menu below
Contact an Admin. Deployed SHA: 350f54e (gh-pages ece47e3). Angular-only.

- **CC-38-24** — Sidebar: single collapsible "Coming Soon …" parent (below
  Contact an Admin, above Admin) holds To Dos, OI Library, Chat, AI Governance
  Boards, Policy Committee. Status chips hidden on grouping parents and on
  sublist children — the group label carries the message. Sidebar nests one
  level, so the former grandchildren (Skills Management, Context, Artifact,
  AI Inventory, Meeting Archives) are removed from the sidebar until built —
  D-163 entry points restored per feature at build time.

**Verification deltas:** NAV_ITEMS constant + template conditional only; build
green; S-035 changelog entry folded into the 16:30 deploy entry, deployed
350f54e; no new files.

**Addendum UAT:**
1. Sidebar order: … Contact an Admin, "Coming Soon …", Admin (admin users). Pass/Fail.
2. "Coming Soon …" collapsed by default; click expands five items (To Dos, OI Library, Chat, AI Governance Boards, Policy Committee). Pass/Fail.
3. OI Library and Chat sub-items still navigate to their stub routes. Pass/Fail.
4. No status chips on the group or its children; Live/Pilot chips unchanged on top-level items. Pass/Fail.

---

# Follow-on 6 — Initiatives Grid Headline Upgrade (same session)

Phil (planned + banded-background proposal approved): remove Tier chip, fix
weak headline color, add latest-status digest, band the headline cell by
next-gate state. Deployed SHA: 30af8dc (gh-pages 1136edd).
**Touches delivery-cycle-mcp — Phil must manually redeploy delivery-cycle-mcp
in Render before the digest line appears.** (Grid works fine against the old
MCP meanwhile — digest simply absent.)

- **CC-38-25** — Tier chip removed from grid rows; tier remains in the filter
  panel and detail view. Supersedes the themed-title-era badge re-add; D-264
  originally removed a tier dot/badge — direction now re-confirmed by Phil.
- **CC-38-26** — Headline cell second line: latest status digest
  "Done: «accomplished_last_cycle» · Next: «plan_next_cycle» · age".
  `list_delivery_cycles` joins the newest update via
  `delivery_cycles.latest_status_update_id` (one batched query, no scan).
  Absent when no status exists.
- **CC-38-27** — Status band on the headline cell (D-200 Pattern-2 treatment:
  3px left bar + ~9–12% tint + dark same-hue text): blue = awaiting approval,
  red = gate overdue, amber = next gate due within 7 days OR undated,
  green = next gate on track, none = neutral (no band, dark neutral text).
  AMBER_WINDOW_DAYS = 7 is a new constant — D-482's window is meeting-anchored
  and not applicable to gate proximity. Replaces the weak sunray/oravive
  headline text colors (Phil's readability complaint).

**Verification deltas:** delivery-cycle-mcp tests 238/238 before and after
(Rule 11 baseline held). computeHeadline band logic covered by 6 new unit
specs in cycle-headline.utils.spec.ts (ng test runner pre-existing broken —
specs maintained per ratchet, currently unexecutable; Phil acknowledgment per
D-442 applies). Rule 37 N/A (delivery-cycle mock is the FIFO pattern; no new
tool). S-035 changelog in deploy commit 30af8dc. Repo cleanliness: no new
files. list_delivery_cycles now 350 lines (service-file threshold applies to
services; tool file — declared for visibility).

**Addendum UAT (after Render redeploy of delivery-cycle-mcp):**
1. Initiatives grid: Tier chip gone from every row; Tier filter still works. Pass/Fail.
2. Headline cells show colored bands: red on the overdue ones (25 overdue gates exist), blue on "Awaiting … approval" rows, amber on near/undated next gates, green on comfortably dated ones, no band on neutral post-deploy rows. Pass/Fail.
3. Headline text is dark and readable in every band — no pale orange. Pass/Fail.
4. Rows with a posted status show "Done: … · Next: … · Nd ago" as a second line; tooltip shows full text; rows without status show only line 1. Pass/Fail.
5. Before Render redeploy: grid renders normally with no digest line (backward compatible). Pass/Fail.

---

# Follow-on 7 — One Gate Color Language (same session)

Phil's design goals: blue reserved for approved gates; submissions purple;
diamonds follow user gate status everywhere; both headline sections colored by
their gate's status (current vs. at-time-of-update); grid and panel tracks
must match. Deployed SHA: e4be0d4 (gh-pages 84fc7c1).
**Requires: Phil runs migration 073, then manually redeploys delivery-cycle-mcp
in Render** (snapshot save + digest fields). Everything else works pre-redeploy;
digest color/as-of appear as new updates are posted.

- **CC-38-28** — Canonical resolver `gate-visual.utils.ts`
  (`resolveGateVisual`/`buildUnifiedGateStateMap`): approved → blue (reserved);
  submitted/awaiting → purple; otherwise the USER's D-205 `date_status`
  verbatim (on_track green #2E7D32, at_risk amber #F2A620, behind red #D32F2F,
  complete blue #257099, not_started grey). Grid and panel `gateStateMap`
  builders (previously divergent — grid forced overdue→red, panel ignored
  user status) both delegate to it. `GateDisplayState` union gains
  on_track/at_risk/behind.
- **CC-38-29** — Submission purple `#7E57C2` ("almost done" blue + "stopped at
  the gate" red). Replaces sunray on submitted gates in every surface; sunray
  now unambiguously = at_risk.
- **CC-38-30** — Migration 073: `initiative_status_updates` gains
  `next_gate_name` + `next_gate_status_token`, snapshotted by
  `save_initiative_status_update` at save (submitted | user date_status).
  Digest line colors from the snapshot; " · as of [gate]" appears in the grid
  once the initiative moves past that gate; Initiative panel Current Status
  shows a staleness nudge line. Pre-073 rows render neutral (accepted ramp-up).
- **CC-38-31 (PRINCIPLE — for Design registry)** — *User status wins; system
  disagreement flags, never recolors.* When a rule contradicts the
  user-selected status (e.g. target date passed, status not behind), surfaces
  render the user's color plus a small ⚠ with an explanatory tooltip. Applied:
  grid headline, panel Gates & Milestone STATUS column. Grid diamonds no longer
  force red on overdue.

**Verification deltas:** delivery-cycle-mcp 238/238 before and after (two
FIFO-mock queues extended for the new gate_records query — test-only change).
Headline band specs rewritten to user-status semantics (7 cases incl. conflict
flag); ng test runner pre-existing broken — D-442 acknowledgment applies.
Build green. Repo cleanliness: 2 new files (gate-visual.utils.ts, migration
073) committed with their importers. S-035 changelog in deploy commit e4be0d4.
AMBER_WINDOW_DAYS (CC-38-27) removed — superseded same session by CC-38-28.

**Addendum UAT (after migration 073 + Render redeploy):**
1. Grid vs panel: open any Initiative — diamonds in the grid row and the panel Stage Track show identical colors per gate. Pass/Fail.
2. Set a gate status to At Risk → diamond amber in both places + headline band amber when it's the next gate. Behind → red. On Track → green. Pass/Fail.
3. Submit a gate for approval → that diamond turns purple in grid + panel; headline reads "Awaiting … approval" on a purple band. Pass/Fail.
4. Approve a gate → blue diamond. No submission ever shows blue. Pass/Fail.
5. Initiative with a passed target date and status still On Track → green band + ⚠ in the headline, ⚠ beside the status in the panel gates table; color unchanged. Pass/Fail.
6. Post a fresh status update → grid digest line takes the next gate's current status color. Approve that gate later → digest shows " · as of [gate]" and the panel Current Status shows the staleness nudge. Pass/Fail.
7. Pre-migration statuses: digest renders in neutral grey, no as-of note. Pass/Fail.

---

# Follow-on 8 — Halo Marks the Working Gate (same session)

Phil: strong visual for "where we're currently working" on the diamond track;
refined in discussion to two-tone (his suggestion). Deployed SHA: 7c2b385
(gh-pages 7ec2525). Angular-only.

- **CC-38-32 (amends CC-38-29)** — Halo marker on the walkback next gate, both
  StageTrack modes: diamond scales (paint-only transform + box-shadow — zero
  layout shift) with a ring in its own status color. Purple moves from the
  FILL to the ring: a submitted gate keeps the user's status fill inside a
  purple halo, so approvers read "submitted and behind" in one glance and
  submission never hides team status. Grey/hollow fills take a Deep Navy ring
  (self-colored ring would vanish). All five approved → no halo. Grid
  condensed scale 1.35 / ring 2.5+4.5px; panel full scale 1.25 / ring 3+6px.
  Condensed tooltips gain "Next gate" prefix; raw underscores humanized.

**Verification deltas:** view-only visual change (transform/shadow bindings +
resolver branch removal); build green; no MCP surface; S-035 changelog in
deploy commit 7c2b385; no new files.

**Render fix (same follow-on, deployed dc3f40b / gh-pages ea69af6):** Phil's
screenshot review caught two cosmetic defects — grid halos clipped into
crescents by ancestor overflow, and the full-mode halo colliding with gate
labels ("Go to Deploy" → "Go to"). Fixed: condensed track gains internal
padding (offset by negative margin — row footprint unchanged) so the ring
paints inside the component box; haloed diamonds take z-index 1 so connectors
never slice the ring; full-mode diamonds gain 7px label clearance; rings
tightened one notch both modes. Second review pass (deployed 432ad8b /
gh-pages b345417): scale-up removed entirely — the haloed diamond is the same
size as its siblings; the ring alone is the marker. Screenshot review also
CONFIRMED working:
two-tone submitted render (green-in-purple on On-Demand Formulary), ⚠ overdue
conflict on Passive/Active Engagement, grid↔panel color agreement.

**Addendum UAT:**
1. Grid: exactly one haloed diamond per unfinished row, on the next unapproved gate; none on finished rows. Full ring — no crescent clipping. Pass/Fail.
2. Halo ring matches the diamond's status color (green/amber/red/blue); grey no-status diamonds get a navy ring. Pass/Fail.
3. Submit a gate → diamond KEEPS your status color, ring turns purple in grid and panel. Approve → halo moves to the following gate. Pass/Fail.
4. Rows don't jump or resize as halos render (paint-only check). Pass/Fail.
5. Panel full track shows the same halo on the same gate as the grid row. Pass/Fail.
6. Hover a haloed diamond in the grid → tooltip starts "Next gate —" (or "Next gate (awaiting approval) —"). Pass/Fail.

---

# Follow-on 9 — Polish Batch (same session, Phil-directed tweaks)

All Angular-only, each deployed on its own commit:
- **CC-38-33** — Ring-only halo: scale-up removed, haloed diamond same size as
  siblings (432ad8b).
- **CC-38-34** — Initiatives grid: gate track centered + lowered in its cell;
  stage label centered under the diamonds; all six column header labels
  centered (0a42259).
- **CC-38-35** — Egg community feed: completions and finds interleave in one
  reverse-chronological stream, so "collected all ten eggs" banners sink as new
  finds arrive; leader strip stays pinned (0c418dd, gh-pages a88b1f9).

**UAT:** grid halo is a ring at normal diamond size; track sits centered in
its column; header labels centered; egg community card shows newest activity
first with old trophies sinking.

---

# Follow-on 10 — Undated Gates, Next Gates, Banded Warnings, Cancelled (big batch)

Deployed SHA: 3d77048 (gh-pages 86815cf). Touches delivery-cycle-mcp
(auto-deploys) and **team-meetings-mcp — Phil manual Render redeploy needed**.
No migrations.

- **CC-38-36** — Undated next gate → dashed RED halo ring (outline, paint-only)
  in both track modes; beats every ring color including purple. Fill keeps user
  status; tooltip: "Next gate (…, no target date set)".
- **CC-38-37** — needs-review reason 6: "No Deploy target date" — Brief Review
  approved/skipped, Go to Deploy unresolved, Deploy milestone undated. Shared
  computation fetches gate_records; dashboard + panel + entry all inherit.
- **CC-38-38** — team-meetings-mcp bug fix: `.neq('current_lifecycle_stage',
  'closed')` matched nothing ('closed' isn't a stage) — reference panels showed
  cancelled/complete initiatives. Now excludes COMPLETE + CANCELLED (3 sites).
- **CC-38-39** — Initiative panel: D-200 Pattern 2 amber band atop Gates &
  Milestone Dates when the next gate is undated, naming the gate and pointing
  at Set date; that row's Set date cell renders amber-emphasized.
- **CC-38-40** — "Next Gates" (renamed from EPO Gate Schedule; hub card too):
  EPO | DOL | DCS segmented switch, choice persisted per user in the existing
  `INITIATIVES_EPO_SCHEDULE` screen key; third "No target date" bucket with
  amber subtotal + banner count; Unassigned group at bottom (DOL view exempts
  divisions with dol_required = false — Phil rule); CANCELLED/COMPLETE/ON_HOLD
  excluded; dashboard accepts dol/dcs drill-down query params.
- **CC-38-41** — Initiatives grid: cancelled excluded by default; S-009
  "Include cancelled" checkbox beside Filters (off every load, session-local);
  stage filter CANCELLED reveals too but is stripped from persisted state so
  the reveal can never stick. Home My Initiatives card audited: already
  compliant (TERMINAL exclusion) — earlier audit note corrected.
- **CC-38-42** — Needs-review warnings restyled from red pills to the grid
  headline's banded grammar (3px bar + tint + dark same-hue text) on the
  Initiative Status Dashboard, Initiative panel Current Status, and status
  panel. Red reasons (Escalation, Status overdue, No target date, No Deploy
  target date) dominate the band; slips/at-risk amber; mixed lists keep
  per-line colors.
- **CC-38-43 (decision)** — Review warnings ALWAYS reflect the current moment,
  on every surface including the status entry form (live banner at top of the
  form). No frozen warnings on history rows — the CC-38-30 gate snapshot is
  the historical channel. Audit-trail snapshot of reasons deferred to Design.

**Verification:** delivery-cycle-mcp 238/238; team-meetings-mcp pass set
unchanged; Angular build green. Structural: epo-schedule.component now ~560
lines (>300, single responsibility "role-grouped gate urgency view" —
declared). Untested (D-442): reason-6 happy path (FIFO queue tolerates the
extra query — validation-covered), role-switch grouping, cancelled toggle —
UAT below.

**UAT (after team-meetings-mcp Render redeploy):**
1. Grid/panel: undated next gate shows dashed red ring; dated ones keep solid status-colored rings. Pass/Fail.
2. Panel: undated next gate → amber band names the gate; its Set date cell is amber. Set a date → band and dashed ring clear. Pass/Fail.
3. Next Gates: renamed everywhere; EPO/DOL/DCS switch regroups; choice survives reload; No-date subtotal + section list correct; Unassigned at bottom; DOL view hides no-DOL initiatives from divisions not requiring DOL. Pass/Fail.
4. Click a DOL/DCS name → dashboard filters to them. Pass/Fail.
5. Status dashboard + panel + entry form: warnings render as red/amber bands; entry form shows live warnings while typing. An initiative past Brief Review with undated Deploy shows "No Deploy target date". Pass/Fail.
6. Grid: cancelled rows hidden; "Include cancelled" reveals; reload → hidden again. Team meeting ref panels no longer list completed/cancelled initiatives. Pass/Fail.

---

# Follow-on 11 — Review Reason Rewording + Gate Overdue (CC-38-44)

Deployed SHA: b084c5d (gh-pages 80acaae). delivery-cycle-mcp auto-deploys.

- **CC-38-44** — Reason vocabulary reworded server-side (single definition
  flows to dashboard, panel, and entry form): **Escalation** · **Status Update
  Overdue** · **Gate Date Moved +N days** (aggregated push-out across the
  cadence window, replaces per-gate "Gate date slipped: X" — Phil confirmed
  slip ≠ overdue) · **At Risk** (bare, deduped) · **Missing Target Date** ·
  **Missing Deploy Date** · NEW **Gate Overdue** (any unresolved gate past its
  target date — previously not a review reason at all). No gate names in any
  reason; the row's Next Gate/Target Date columns and the panel gates table
  carry the detail. Display: header sentence removed on dashboard + panel
  bands; one bolded • bullet per reason; Gate Overdue joins the red set,
  Gate Date Moved stays amber. Entry-form banner keeps its context sentence
  (only anchor above an empty form). Tests updated for wording — 238/238.

**UAT:** dashboard reasons render as bolded bullets with no "Needs review · N"
line; an initiative with a passed, unapproved gate date shows **Gate Overdue**;
a pushed-out date within cadence shows **Gate Date Moved +N days**; same
wording in the panel and live in the status entry form.

---

# Follow-on 12 — Deploy by Quarter Role-Generalized (CC-38-45)

Deployed SHA: 8ad0408 (gh-pages 78ad587). delivery-cycle-mcp auto-deploys
(get_delivery_summary gains `deploys_this_quarter`). No migrations.

- **CC-38-45** — "Deploy by Quarter" (renamed from EPO Deploy by Quarter;
  route unchanged) gains the EPO | DOL | DCS switch, persisted in its
  existing screen key. Second consumer triggered the S-031 extraction:
  NEW shared `role-grouping.utils.ts` (PersonRole, ROLE_FIELDS,
  UNASSIGNED_ID, personFor, isPersonRole) + NEW standalone
  `RoleSwitchComponent`; Next Gates refactored onto both. Quarter sections,
  prior-miss detection, D-446 baselines (role-agnostic — cycle-keyed), and
  theme filters unchanged per group. Behavior gain: Unassigned group at the
  bottom (screen previously dropped ownerless initiatives silently), DOL view
  exempts dol_required=false divisions; role-aware dashboard drill-down.
  Hub card renamed; headline now role-neutral per Phil-approved #5:
  "N Initiatives with a deploy this quarter" (amber when zero).

**Verification:** delivery-cycle-mcp 238/238; build green; 2 new files
committed with importers. Workstream-pivot Deploy Schedule screen: same
pattern, flagged as a next-contract candidate (not built).

**UAT:** hub shows "Deploy by Quarter" with the new count headline; screen
switches EPO/DOL/DCS and remembers the choice; Unassigned group appears at
bottom (absent for DOL where the division doesn't require one); baselines and
quarter pivot behave identically in all three views; name click filters the
dashboard by the chosen role.

## Addendum CLAUDE.md Candidate
4. **Candidate:** "Fixed viewport-edge chrome (banners, tickers, docks) must
   (a) reserve layout space via a root CSS var bound to actual render state,
   (b) sit below the modal layer (z < 100). Pattern: `--nb-space` /
   `bannerVisible$` from CC-38-12/13."
   **Why:** second bottom-chrome element would repeat the same blocking bug.
   **Trigger:** Phil's report that banner covered key controls.


---

# Follow-on 13 — Gate submission triggers, checklist rework, AI Production Governance (2026-07-17)

Commits: `d1c813a` (build), `7d100bd` (migration 076 v2). gh-pages `374dd3e`.
Migrations 074/075/076 executed by Phil 2026-07-17 (076 required a v2 — see CC-38-54).

## CC-decisions

- **CC-38-46** — Gate approval dialog entry points reduced to three: big
  diamond on the Stage Track, Submit button at the top, diamond + gate name in
  the Gates & Milestone Dates table (col 1). Full-row click handler REMOVED —
  accidental clicks anywhere on a gate row were opening approval dialogs.
  Date/status editors keep their existing stopPropagation wrappers.
- **CC-38-47** — Gate checklist reworked to advisory ambers ONLY. Brief
  Review: Scenario document / Outcome Statement / Tier. Go to Build and Close
  Review: empty. Go to Deploy / Go to Release: AI-profile-conditional artifact
  ambers (AI Production Governance Report; AI Delivery Requirements Record for
  Track 2 external analytics). Technical Specification and MCP-scope items
  removed. **Design deferral: MCP-scope declaration policy** — removed from
  checklist pending a Design decision on where MCP scope is governed.
- **CC-38-48** — Mandatory items are hard stops enforced TWICE: gate modal
  (red D-140 block, Submit disabled) AND server-side ladder in
  submit_gate_for_approval (Context Brief attached, Jira-unless-Division-
  exempt, EPO, DCS/DOL per D-389/D-391/D-424, AI ladder). **Design deferral:
  org-wide audit of the double-enforcement approach across all tools** (Phil:
  one day MCP requests will skip the UI; rules must hold at the server).
- **CC-38-49** — AI Governance model: three orthogonal fields on
  delivery_cycles (migration 075): ai_functionality (NULL/yes/no/unknown),
  ai_delivery_form (product_embedded/analytics_outputs), ai_audience
  (external/internal), plus ai_board_approved(+at/by audit stamps).
  Progression ladder: blank OK through Brief Review; answered by Go to Build;
  yes/no (with follow-ups when yes) by Go to Deploy. AI Production Board
  stops: embedded+external → before Go to Deploy (pilot); internal (either
  form) → before Go to Release; analytics+external (Track 2) → no Board stop,
  advisory AI Delivery Requirements Record instead.
- **CC-38-50** — AI Production Board half-diamond marker (right-pointing
  triangle at the left flank of the Board gate diamond, full-mode track only):
  amber = approval required, not yet received (from the moment the profile
  determines it); blue = received. No grey state; no generalization to gate
  requirements (Phil 2026-07-17 — marker is AI Prod Board only; requirements
  surface at submission). NAMING RULE: never bare "board" in user-visible
  text — always "AI Production Board" or "AI Prod Board".
- **CC-38-51** — divisions.jira_epic_required (migration 074, default true).
  Admin → Divisions edit gains "Require Jira epic on Initiatives" toggle;
  Go to Build Jira hard stop skipped when false. Mirrors dol_required (D-424).
- **CC-38-52** — (Rule 30 autonomous) AI Governance fields NOT added to the
  create panel. Blank is compliant through Brief Review; the edit panel is the
  canonical entry. Keeps create lightweight; create tool untouched.
- **CC-38-53** — Tooltip unification on StageTrack: full-mode tooltips gain
  the halo vocabulary (Next gate / awaiting approval / no target date) via a
  shared prefix; user D-205 status fills now described ("on track (status set
  by team)" etc. — previously fell to "not yet reached"); condensed
  skipped/returned tooltips added (previously silent); AI Prod Board marker
  tooltip covers both color states.
- **CC-38-54** — Migration 076 v2: original failed (42703) because
  cycle_artifact_types.lifecycle_stage was dropped by migration 041; column
  list was verified against the 021 seed migration instead of the live shape.
  **Rule 34 violation logged** — the check target should have been
  types/database.ts (CycleArtifactType had the correct shape).

## CodeClose Verification

1. **Spec coverage:** Phil-directed batch (no written spec). All rulings from
   the 2026-07-17 design dialogue implemented — trigger fix, per-gate
   checklist rulings, double enforcement, AI model incl. 4-state +
   analytics distinction, Board marker colors (amber/blue, no grey),
   AI Production Board naming, Jira Division exemption, tooltip audit. PASS.
2. **Regression check:** delivery-cycle-mcp 247/247 (238 pre-existing + 9
   new); division-mcp 98/98; ng build green. Gate modal open/submit/skip
   flows unchanged except entry points and the new hard-stop block.
3. **Test ratchet:** new server logic covered by
   tests/contract38-ai-governance.test.js (6 hard-stop paths, 2 validation
   paths, Board audit-stamp flip both directions). UNTESTED: Angular-side
   gateHardStops mirror, edit-panel AI section, Board marker rendering,
   tooltip text (ng test pre-existing broken — UAT covers; Phil
   acknowledgment requested per D-442).
4. **Pattern sweep:** shared pattern modified: StageTrack (new inputs,
   tooltip builder). Consumers searched: detail panel (full mode — bound),
   dashboard grid + status dashboard (condensed — new inputs default off, no
   behavior change). PASS.
5. **Standards conformance:** busy guard — Submit already guarded by
   `processing`; hard-stop disable added. Optimistic reversion — none added.
   D-140 — hard-stop block states blocked action + unblock path. PASS.
6. **CC-decision completeness:** CC-38-46..54 sequential, no gaps.
7. **Structural health:** delivery-cycle-detail 4245 lines (over threshold,
   long-standing); gate-record-modal 1392; edit-panel 1322; divisions
   1462; stage-track 541 — all over 300, all pre-existing overs grown
   modestly this follow-on. Extraction candidates unchanged.
8. **Deployment:** migrations 074/075/076 run by Phil → master pushed
   (delivery-cycle-mcp auto-deploys) → ng build after commit (version.json =
   7d100bd) → gh-pages 374dd3e with 404.html + .nojekyll. **Phil action:
   manually redeploy division-mcp in Render** (list_divisions now selects
   jira_epic_required; update_division accepts the toggle). Delivery-cycle
   auto-deploy: confirm it completed in the Render dashboard.
9. **Repo cleanliness:** 4 new files (3 migrations + 1 test) — all committed
   before push. Clean.

## UAT Checklist — Follow-on 13

**A. Gate row triggers (Initiative panel → Gates & Milestone Dates)**
1. Click empty space on a gate row → nothing opens. PASS/FAIL
2. Click the gate diamond or name → gate modal opens. PASS/FAIL
3. Edit a target date / actual date / status → no modal at any point. PASS/FAIL

**B. Gate modal hard stops**
4. Initiative w/o Context Brief: open Go to Build modal → red "cannot be
   submitted yet" block lists Context Brief; Submit disabled. PASS/FAIL
5. Attach Context Brief + Jira + EPO + answer AI question → Submit enables. PASS/FAIL
6. Division with Jira toggle OFF: Jira line absent from the block. PASS/FAIL

**C. AI Governance (Initiative edit panel)**
7. "Includes AI functionality" dropdown: blank/Yes/No/I do not know saves. PASS/FAIL
8. Yes → delivery form + audience appear; consequence line states the correct
   Board gate; embedded+external shows Deploy, internal shows Release,
   analytics+external shows the Track-2 line. PASS/FAIL
9. Check "Has AI Prod Board Approval" → save → reopen shows recorded date. PASS/FAIL

**D. Board marker + chips (Initiative view panel)**
10. AI-yes Initiative: amber triangle at left of the Board gate diamond;
    tooltip names AI Production Board. PASS/FAIL
11. Record Board approval → triangle turns blue; "AI Prod Board: Approved"
    pill in identity zone. PASS/FAIL
12. Gate tooltips describe status colors and Next-gate ring in full mode. PASS/FAIL

**E. Server enforcement (spot check)**
13. Attempt a blocked submit on a non-compliant Initiative (e.g. via a stale
    tab): error text explains the block + fix. PASS/FAIL

**F. Admin → Divisions**
14. Edit a Division: "Require Jira epic on Initiatives" toggle saves; View
    shows Jira Epic Required Yes/No. PASS/FAIL

## CLAUDE.md Candidates — Follow-on 13

5. **Candidate:** "Rule 34 check target: verify columns against
   types/database.ts AND the latest ALTER migrations for the table — never
   against the table's original CREATE/seed migration."
   **Why:** migration 076 v1 failed on a column dropped by migration 041.
   **Trigger:** Phil's 42703 screenshot, 2026-07-17.


---

# Follow-on 14 — Create-form completions + Trio theme management (2026-07-17)

Commit `1acc563`; gh-pages `d404036`. No migrations.

## CC-decisions

- **CC-38-55** — New Initiative form gains Roadmap Theme (Division-scoped
  dropdown; the create tool already accepted roadmap_theme_id — UI never sent
  it) and the AI Governance questions (functionality / delivery form /
  audience + consequence line). Supersedes CC-38-52. Board approval checkbox
  intentionally NOT on create — recorded later in Edit once received.
  create_delivery_cycle now accepts the three ai fields with the same enum
  validation as update; follow-ups nulled unless functionality = yes.
- **CC-38-56** — Roadmap Theme management access widened from Admin-only to
  Admin OR member of the theme's Division (division_memberships). Supersedes
  the interim Admin-only rule (which was itself a Design-flagged CC-decision:
  D-487's Division Leader role does not exist). update_roadmap_theme gains
  `active` (boolean) — reactivation path Trios can drive.
- **CC-38-57** — "Manage Themes" inline panel on Deploy by Quarter (link
  beside the Theme filter pills; separate zero-theme entry point): Division
  select scoped to manageable Divisions, add / rename / deactivate /
  reactivate, inactive themes listed italic-grey, busy guards on all
  mutations, filter pills + grouping refresh immediately after each change.
  D-437 semantics unchanged: deactivated themes keep displaying on tagged
  Initiatives.

## CodeClose Verification

1. **Spec coverage:** Phil rulings 2026-07-17 (create-form gaps proposal
   approved; Trio theme management with add/edit/deactivate/activate scoped
   to accessible Divisions). All implemented. PASS.
2. **Regression check:** delivery-cycle-mcp 250/250; ng build green. Existing
   theme admin surface (Admin → Divisions) untouched and still works — admins
   pass the new access check trivially.
3. **Test ratchet:** +3 tests (create ai enum validation; theme access denied
   for non-member; member reactivation writes active:true). UNTESTED
   (Angular): create-panel theme/AI section, Manage Themes panel — UAT covers
   (ng test pre-existing broken; D-442 acknowledgment requested).
4. **Pattern sweep:** no shared pattern modified this follow-on.
5. **Standards conformance:** busy guard — all four theme mutations disable
   controls via mgrBusy; create submit unchanged. D-140 — access-denied error
   names the requirement (Division membership or Admin). PASS.
6. **CC-decision completeness:** CC-38-55..57 sequential, no gaps.
7. **Structural health:** epo-deploy.component.ts now ~1190 lines (was 1016)
   — theme manager is an extraction candidate if it grows further;
   create-panel ~940 lines. Both over 300, pre-existing overs.
8. **Deployment:** no migrations → master pushed (delivery-cycle-mcp
   auto-deploys — REQUIRED for theme access + create AI fields; confirm in
   Render) → build after commit (version.json = 1acc563) → gh-pages d404036.
   Reminder: division-mcp manual redeploy from follow-on 13 still pending if
   not yet done.
9. **Repo cleanliness:** no new files this follow-on. Not applicable.

## UAT Checklist — Follow-on 14

**A. New Initiative form**
1. Pick a Division → Roadmap Theme dropdown populates with that Division's
   themes; changing Division resets it. PASS/FAIL
2. Answer "Includes AI functionality" = Yes → form + audience appear;
   consequence line matches the profile. Create → open Edit → values match. PASS/FAIL
3. Create with theme picked → grid/panel show the theme tag. PASS/FAIL

**B. Deploy by Quarter — Manage Themes**
4. Click "Manage Themes" → panel opens; Division list = your Divisions
   (admin sees all). PASS/FAIL
5. Add a theme → appears in the panel AND in the filter pills without a page
   reload. PASS/FAIL
6. Rename a theme → pill text updates. PASS/FAIL
7. Deactivate → theme leaves the pills; still displays on already-tagged
   Initiatives; shows "(inactive)" in the panel. PASS/FAIL
8. Reactivate → returns to pills and pickers. PASS/FAIL
9. Non-member (no Division access): panel shows the no-Divisions guidance. PASS/FAIL

## CLAUDE.md Candidates — Follow-on 14

No candidates this session segment.


---

# Follow-on 15 — AI Production Governance surfaces + filter cleanup (2026-07-17)

Commits: `e2b351f` (checkbox move), `ecf4b55` (screen + markers). gh-pages `b9ebcea`. No migrations.

## CC-decisions

- **CC-38-58** — Include-cancelled checkbox moved from the grid header into
  the Filters panel (bottom row, applies immediately — not staged — still
  never persisted per S-009). Header keeps only Filters + New Initiative.
- **CC-38-59** — AI Production Board half-diamond marker added to the
  CONDENSED StageTrack (smaller triangle, 5×7px, left flank, amber/blue —
  same semantics as full mode). Initiatives grid rows bind it; chip idea
  dropped (Phil: half-diamonds suffice). `aiBoardGateFor` extracted to
  gate-visual.utils as the single source for Board-gate derivation (detail
  panel refactored onto it).
- **CC-38-60** — NEW "AI Production Governance" screen at
  /initiatives/ai-governance + hub card. Three sections: Approval needed
  (sorted by Board gate target date, undated last in amber — the Board's
  agenda feed), Approved—active, Approved—closed (COMPLETE register the grid
  can't show). CANCELLED excluded (S-009). Read-only phase 1 — approval is
  recorded on the edit panel; visible to all users (governance transparency).
  Track-2 external analytics intentionally absent (no Board stop) — footnote
  explains. Phase-2 candidates deferred to Design: on-screen record-approval
  action, Board-member notifications, formal Board role.
  list_delivery_cycles adds ai_board_approved_at for the register stamps.

## CodeClose Verification

1. **Spec coverage:** Phil rulings (checkbox buried in Filters; grid gets
   half-diamonds; screen only — no grid AI filter, no chip). All implemented. PASS.
2. **Regression check:** ng build green; delivery-cycle-mcp suite unaffected
   by the one-column select addition (250/250 at last run). Grid condensed
   tracks: new inputs default null/false — rows without AI profile render
   identically.
3. **Test ratchet:** logic-touching MCP change = one select column (view-only
   data addition; no branch logic — no new test). Angular: new screen +
   marker rendering UAT-covered (ng test pre-existing broken; D-442
   acknowledgment requested).
4. **Pattern sweep:** shared StageTrack modified (condensed marker).
   Consumers: detail (full — unchanged), grid + status dashboard (condensed —
   inputs unbound default to no marker; grid explicitly bound). PASS.
5. **Standards conformance:** read-only screen — no MCP-calling controls;
   S-009 cancelled exclusion applied; D-200 error framing on load failure. PASS.
6. **CC-decision completeness:** CC-38-58..60 sequential, no gaps.
7. **Structural health:** NEW ai-governance.component.ts ~290 lines (within
   threshold). stage-track 585 lines; dashboard grew ~15 lines — pre-existing
   overs.
8. **Deployment:** master pushed (delivery-cycle-mcp auto-deploy carries the
   ai_board_approved_at select — confirm it completed; screen shows
   "Recorded" without dates until it does) → build after commit
   (version.json = ecf4b55) → gh-pages b9ebcea.
9. **Repo cleanliness:** 1 new component file committed with its route import
   in the same commit. Clean.

## UAT Checklist — Follow-on 15

**A. Initiatives grid**
1. Filters panel bottom shows "Include cancelled Initiatives"; toggling
   reveals/hides cancelled rows immediately; header checkbox gone. PASS/FAIL
2. An AI-yes Initiative (embedded+external) shows a small amber triangle at
   the left of its Go to Deploy diamond in the grid track; tooltip names the
   AI Production Board. PASS/FAIL
3. Record Board approval → grid triangle turns blue. PASS/FAIL

**B. AI Production Governance screen**
4. Initiative Tracking hub shows the "AI Production Governance" card; click
   opens /initiatives/ai-governance. PASS/FAIL
5. Pending section lists unapproved Board-gate Initiatives sorted by gate
   target date; undated rows last with amber "No date set". PASS/FAIL
6. Approved—active shows the approval date; mark an active AI Initiative
   approved → it moves sections on reload. PASS/FAIL
7. A COMPLETE approved Initiative appears under Approved—closed. PASS/FAIL
8. Row click opens the Initiative panel on the right; close returns. PASS/FAIL
9. Cancelled AI Initiatives appear nowhere on the screen. PASS/FAIL

## CLAUDE.md Candidates — Follow-on 15

No candidates this session segment.
