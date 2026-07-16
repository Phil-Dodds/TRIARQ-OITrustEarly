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

## Addendum CLAUDE.md Candidate
4. **Candidate:** "Fixed viewport-edge chrome (banners, tickers, docks) must
   (a) reserve layout space via a root CSS var bound to actual render state,
   (b) sit below the modal layer (z < 100). Pattern: `--nb-space` /
   `bannerVisible$` from CC-38-12/13."
   **Why:** second bottom-chrome element would repeat the same blocking bug.
   **Trigger:** Phil's report that banner covered key controls.
