# OITrust CodeClose — Contract 33 (Team Meetings, D-490 + Tracks expansion)

**Sessions:** 2026-07-07 (initial build) · 2026-07-09/10 (UAT iterations) ·
2026-07-11/12 (Tracks Phase A–D, templates, cadence, presenter sections)
**Commits:** `8e50fb1` … `aece6ac` (31 commits — full list in git log, all prefixed
"Contract 33" or "Tracks")
**Migrations:** 055 (initial, +ad-hoc deleted_at fix), 056 (tracks), 057 (cadence),
058 (presenter sections) — all executed by Phil manually per standing rule.
**Companion documents:** initial-build CodeClose + first continuation live in
`.claude/sessions/session-output-2026-07-07-Contract33.md` (CC-001 … CC-011).
This document covers the full arc and is the Design hand-off.

---

## Summary — what Team Meetings is now

Contract 33 began as D-490: an Admin-only meeting prep/run tool for Phil's
Product Ops meeting — one meeting list, five fixed sections, bullets, notes,
carry-forward, and a DCS reference panel. Over the UAT sessions it grew into a
**general-purpose meeting series platform for the whole company**:

- **N meeting series (tracks)**, each with its own participants, leaders,
  section configuration, cadence, and meeting sequence. Existing meetings were
  migrated into a seed "Product Ops" series.
- **Membership model** replaces admin-only: any active series member works the
  meeting; leaders manage series config; only leaders manage leaders; Admins get
  an opt-in "include series I don't participate in" view plus restore/purge of
  soft-deleted series.
- **Creation restricted to pdodds@triarqhealth.com** for now (app-layer check).
  Series are private (Outlook-format invites, no email sent, unknown addresses
  rejected with a report) or public (instant join via "Search Public Meetings
  to Join").
- **Meeting templates** at series creation: Team Meeting (collect-the-agenda-first
  guidance), Manager/Employee 1:1 (six Grove High Output Management sections),
  or Blank (full shared catalog).
- **Sections** are per-series templates drawn from an admin-curated shared
  catalog plus custom sections; ordered; leader-editable (title/description)
  including mid-meeting add/remove; meetings **snapshot** their sections at
  creation (template changes affect future meetings only).
- **Presenter sections** — one section per participant (action items,
  escalations, blockers, accomplishments); initiative adds route to the clicked
  person's presenter section automatically.
- **Live collaboration** via 10-second polling with a cheap timestamp check
  (`content_updated_at` + `meeting_changed_since`), focus-preserving merge, and
  keep-mine/take-theirs conflict resolution on section notes.
- **Cadence** per series (none / every 1·7·14 days / weekly / bi-weekly /
  tri-weekly / monthly, with weekday + monthly occurrence) drives the suggested
  date and auto-title of the next meeting. Suggestion only, never enforced.
- **Pull from last meeting** (master + per-section) with automatic dedupe, and
  **drag & drop** of any bullet between any two sections.
- **Initiative Reference panel** is participant-aware: participants (initiatives
  merged across DCS/DOL/EPO assignments) shown by default; a toggle reveals all
  people of a chosen role type. Per-user view memory per series.
- **Share URL** per series (`/team-meetings/track/{id}/latest`) → login → latest
  meeting; non-members get a Decision-140 blocked message.
- Sidebar entry visible to **all users** with a series-participation badge.

---

## Schema (migrations 056–058)

- `team_meeting_tracks` — track_name, is_public, ref_panel_person_type
  ('dcs'|'dol'|'epo'), meeting_cadence jsonb, created_by, deleted_at (soft
  delete: hidden from members, visible to Admins), **purged_at** (Admin purge:
  invisible to everyone, data retained — the Arch-6 conflict resolution, see
  CC-018).
- `team_meeting_track_members` — track_id, user_id, is_leader,
  UNIQUE(track_id, user_id); deleted_at = removed/left, re-invite reactivates.
- `team_meeting_section_catalog` — shared section list, admin-curated (Admin →
  Meeting Sections screen), seeded with the original five sections.
- `team_meeting_track_sections` — per-series ordered template; catalog_id (null
  = custom), stable section_key (catalog key, `custom-<uuid>`, or
  `presenter-<user_id>`), title/sub_label/bar_color, presenter_user_id.
- `team_meetings` + track_id, content_updated_at (polling), deleted_at.
- `team_meeting_sections` + snapshot columns (title/sub_label/bar_color),
  presenter_user_id, deleted_at; fixed-key CHECK constraint dropped.
- `team_meeting_bullets` + created_by (attribution).
- Seed: "Product Ops" track, Phil sole leader, catalog template, all existing
  meetings backfilled.

## MCP surface (team-meetings-mcp)

Original 12 tools converted from admin-only to track-member access; every
mutating tool bumps `content_updated_at`. New tools (all JWT-validated first,
per Arch-5): list_my_tracks · create_track · get_track · update_track ·
delete_track · restore_track · purge_track · add_track_members ·
remove_track_member · set_track_leader · list_public_tracks ·
join_public_track · add_track_section · update_track_section ·
remove_track_section · reorder_track_sections · list_section_catalog ·
save_catalog_section · delete_catalog_section · get_latest_meeting ·
meeting_changed_since · list_track_initiative_reference ·
set_presenter_section · add_presenter_sections_all · move_bullet ·
pull_from_last_meeting. Shared modules: `track_access.js` (caller/membership/
leader checks, meeting→track resolution, bump, Outlook email parser),
`cadence.js` (date math, validated).

## Angular surface

Routes under /team-meetings: `''` series list · `public` join screen ·
`track/:id` meetings list (+ settings panel; `?setup=1` auto-opens it) ·
`track/:id/latest` share-URL redirect · `:meeting_id` detail. New components:
tracks-list, public-tracks, track-settings (slide-in), track-latest-redirect,
admin meeting-sections; `meeting-templates.ts` constant. Reworked: detail
(polling/merge/drag-drop/pull/chooser), reference panel (participant-aware +
per-user memory), meetings list (track-scoped, cadence-suggested date).
Sidebar: Team Meetings for all users + badge.

---

## Conflicts with locked rules — flagged and resolved (Rule 2 / Rule 8)

1. **Arch-6 (never hard delete) vs. requested Admin "hard delete" of deleted
   series.** Flagged before build; Phil chose option (b): a second flag
   `purged_at` — purged series are invisible to everyone but rows are retained.
   No DELETE SQL was introduced. (Pre-existing exception: `remove_meeting_bullet`
   remains a hard delete per the original D-490 Step 2 spec.)
2. **Arch-1 (MCP-only DB access) vs. real-time collaboration.** Supabase
   Realtime would require a direct Angular→Supabase subscription. Flagged;
   resolved as 10s polling through the MCP with a timestamp-only change check.
   Phil accepted, noting the TRIARQ port may revisit the architecture.

## Deviations from spec (Rule 7)

- **D-490 "Admin-only"** → replaced by the track-membership model (Phil
  direction, 2026-07-11). Improvement: the tool serves the whole company.
- **D-490 read-only prior meetings** → all meetings fully editable; only the
  past-meeting banner and carry-forward affordances key off "latest"
  (Phil direction, 2026-07-09/10, reaffirmed for multi-user 2026-07-12).
- **D-490 fixed five sections** → per-series configurable sections with
  snapshot-at-creation semantics.

---

## CC-Decisions (CC-001 … CC-011 in the 07-07 session output; sequential continuation below — Rule 17)

**CC-012** — `isLatestMeeting` replaces `isReadOnly`; latest = first by
created_at DESC within the series. All meetings editable.

**CC-013** — Meeting list sort: created_at DESC only (Phil: chronology of
creation, name-independent).

**CC-014** — Detail subscribes to `route.paramMap` (not snapshot) so
same-route navigation between meetings re-initializes.

**CC-015** — Initiative detail overlay reuses `app-delivery-cycle-detail`
panel mode (`[cycleId]` input) per D-478 — no duplicate initiative UI.

**CC-016** — Reference panel "Add" buttons replaced by leading checkboxes on
initiative rows (Phil design, saves a row per initiative). Checked = in
meeting; row disabled until removed via ×.

**CC-017** — Initiative bullets carry right-aligned meta: assigned person (of
the series' person type) + next gate + target date. Next gate = first gate in
forward order (brief_review → … → close_review) not complete/skipped. Later
extended from initiatives-gates to all sections (presenter sections).

**CC-018** — Purge model for Arch-6 conflict (see above): `purged_at`
timestamp, Admin-only, requires prior soft delete.

**CC-019** — Track-creation restriction implemented as a code constant
(`TRACK_CREATOR_EMAIL = pdodds@triarqhealth.com`) in `track_access.js` and the
tracks-list component — a business rule, not a credential, so not an env var.
Revisit when creation opens up.

**CC-020** — Access model: `assertTrackAccess` / `assertMeetingAccess` /
`assertSectionAccess` shared helpers; members act, leaders configure, only
leaders grant/revoke leader; admins pass all checks; meeting deletion is
leader/Admin. Leaderless series are permitted (Phil: leader not mandatory).

**CC-021** — Live-collab design: every mutating tool bumps
`team_meetings.content_updated_at`; client polls `meeting_changed_since`
(timestamp-only) every 10s and refetches only on change; merge preserves the
focused textarea (notes + bullet notes) so screens never rewrite under typing;
section-collapse updates deliberately do NOT bump (UI noise). Notes carry
optimistic concurrency: save sends `base_updated_at`; a newer server copy
returns a conflict payload naming the editor; UI offers keep-mine (force) /
take-theirs.

**CC-022** — Invites: server-side Outlook-format parser ("Name <email>; …",
comma/semicolon/newline separated, deduped, case-normalized). Unknown emails
rejected with an added/already/not-found report — no pending-invite table
pre-port. Re-inviting a removed member reactivates the membership row.

**CC-023** — Section snapshot model: meetings copy title/sub_label/bar_color
(+ presenter_user_id) from the series template at creation; series edits apply
to future meetings only, except leader actions taken from inside a meeting
(add/remove/edit section with meeting_id) which also patch that live meeting.
Past meetings always keep their snapshot. The section_key CHECK constraint was
dropped to allow custom and presenter keys.

**CC-024** — create_track section seeding: no template → all active catalog
sections; template → provided list, where a catalog section_key links
catalog_id and provided title/sub_label override catalog values (used by the
Team template to rewrite the Hot Topics guidance).

**CC-025** — Person type (dcs/dol/epo) is series-level state surfaced as pills
ON the reference panel; any participant switches locally in real time; a
leader's switch persists as the series default (carries to the next meeting);
default dcs. Settings-panel radio removed in favor of the pills.

**CC-026** — update_track_section: leader edits section title/description;
same-meeting propagation via optional meeting_id; snapshot rule otherwise.

**CC-027** — New-meeting defaulting: date field first; title auto-fills
"<Series Name> — <Date>" and follows date changes until the user types a
title. Date defaults to the cadence suggestion (below), else today.

**CC-028** — Bullet attribution: created_by recorded on every bullet;
rendered as a small initials chip (full name on hover) ONLY when the series
has >1 member (member_count returned by get_team_meeting) — solo series stay
clean.

**CC-029** — "+ Add All" disables (not hides) with label "All Added ✓" iff
every initiative for that person is already in the meeting.

**CC-030** — Participant-aware reference panel: new
`list_track_initiative_reference` returns participants (initiatives merged +
deduped across all three assignment columns) and others (selected role type,
excluding participants), both division-scoped like the original tool.
"Show only initiatives for meeting participants" toggle defaults ON; OFF
reveals the pills and appends others under a divider; participants stay pinned
on top. **Per-user view memory (Option A):** toggle, pill, and per-person
expand/collapse persist per track via ScreenStateService (new screen key
`team-meetings.ref-panel`, `filter_state.byTrack` map — key is a constant per
Rule 4; per-track data lives in the value). Defaults when nothing saved:
leaders collapsed, non-leader participants expanded, others collapsed. Browse
state is local per viewer by design — never synced. Known limit: the 7-day
screen-state recency window resets stale view memory.

**CC-031** — Meeting templates are a hardcoded constant
(`meeting-templates.ts`): Team Meeting (five catalog sections; Hot Topics
sub_label rewritten to collect-the-agenda-first guidance; suggests weekly),
Manager/Employee 1:1 (six custom sections from Grove's High Output Management —
Your Agenda / Nascent Problems / Manager Topics / Development & Career /
Actions & Follow-Ups / One More Thing…; suggests bi-weekly), Blank (catalog,
no cadence). Guidance text is carried in sub_label — no new column. Promote to
a DB table + admin screen when a third template appears.

**CC-032** — Cadence: `meeting_cadence` jsonb on tracks (migration 057).
Types: interval (1|7|14 days), weekly, **bi-weekly** (added at Phil's request),
tri-weekly, monthly (weekday + 1st/2nd/3rd/4th/last). Computation is a pure
MCP-side function (`cadence.js`, Arch-2 — business logic out of components):
the last non-deleted meeting anchors the phase (no separate anchor date —
reschedules drift gracefully); the result is never in the past (lapsed series
roll forward by period); no last meeting → next matching weekday / today.
Returned as `suggested_next_meeting_date` on get_track and list_team_meetings.
Suggestion only, never enforced (D-205 nudge philosophy). Date math
unit-verified across all six types including lapsed/rescheduled cases.

**CC-033** — Presenter sections (migration 058): presenter_user_id on both
section tables; stable key `presenter-<user_id>` makes carry-forward and
pull-from-last match across meetings and renames. Series settings: per-member
"Presenter" toggle + one-click "add for all participants"; both accept
meeting_id for live-meeting propagation. Routing: an initiative added from the
panel goes to the clicked person's presenter section → else Initiatives and
Gates → else a section-chooser popover (Add All queues all pending adds into
one choice). Section title defaults to the person's name; bar color from the
avatar palette hash.

**CC-034** — Drag & drop: HTML5 native (desktop-only per Phil — workstations
and laptops, no tablets). The bullet main row is the drag handle (not the whole
row — note textareas keep normal text selection); sections are drop targets
with a dashed highlight; optimistic move + `move_bullet` tool (same-meeting
guard, appends to target sort order); poll corrects on failure.

**CC-035** — pull_from_last_meeting: previous = most recent non-deleted
meeting in the series created before this one. Master button (all sections) +
subtle per-section ⟲. Matching: presenter sections by presenter_user_id,
everything else by section_key; unmatched source sections skip silently (Phil
decision). Dedupe skips a source bullet if (a) already carried into this
meeting (FK), (b) its initiative already exists in the target section, or (c)
identical trimmed text (generic bullets). Bullet notes travel; pulls record
carried_from_bullet_id lineage and created_by.

**CC-036** — New-series flow: Meeting Type picker cards + Invite Members
textarea in the create panel; hint text; after create → series page with the
settings panel auto-opened (`?setup=1`, immediately stripped from the URL).

**CC-037** — Bullet-note field styling: light blue-grey tint + border when
empty (invites input), white with primary border on focus / when filled,
height autogrows with content.

**CC-038** — Checkbox state machine (duplicate-row root cause): the original
optimistic checkmarks reverted on 1.5s/2.5s timers and the input-sync deleted
fresh optimistic ids before server confirm — a slow (Render cold-start)
response visibly unchecked the box mid-save, and repeat clicks inserted
duplicate bullets. Fix: optimistic ids persist until a confirmed
present→absent transition (bullet removed via ×); no revert timers; the
isInitiativeAdded guard makes double-clicks no-ops from the first click.
Module-wide busy-guard sweep added "Saving…"/disabled states to: presenter
toggle, make/remove leader, remove/leave member, section add/create/remove.
(All other server-calling controls were verified already guarded.)

**CC-039** — Two data-correctness fixes: `existingInitiativeIds` (panel
checkbox source) scans ALL sections, not just initiatives-gates, since
presenter routing distributes initiatives; and the meetings list reloads after
a delete so the cadence suggestion never anchors on a just-deleted meeting
(the MCP queries always excluded deleted meetings — the stale value was a
client-side capture-at-load issue).

---

## First Principles records (Rule 1)

- **Tracks schema (CC-018/020/023):** Context = one hardcoded meeting series
  must become N series without breaking existing meetings. Question = what is
  actually per-series vs per-meeting? Reduce = sections resolve to
  template-vs-snapshot; membership resolves to one table with is_leader flag
  (no separate roles table). Simplify = stable section_key strings carry
  identity across meetings, making carry-forward/pull free. Automate = seed
  migration converts the existing world in one pass.
- **Live collab (CC-021):** Reduced "real-time" to "no lost work + sub-15s
  convergence"; polling with a timestamp check meets it without violating
  Arch-1; only notes need true conflict handling because bullets are
  append/remove-mergeable.
- **Cadence (CC-032):** Reduced all six options to one question — "given the
  last meeting, when is the next?" — one pure function, one jsonb column.
- **Reference panel (CC-030):** Reduced "which people?" to participants-first
  with an escape hatch, keyed off track membership rather than a new config
  surface.

## CodeClose Verification (Rule 29)

**(1) Spec coverage.** D-490 original acceptance criteria: PASS per the 07-07
session output. This arc was UAT-driven (Phil direction in-session, no formal
spec); every directed item above shipped and was UAT'd live except the final
busy-guard commit (`aece6ac`, pending deploy at time of writing).

**(2) Regression check.** Existing Product Ops meetings verified working after
each migration (056 backfill, 057, 058) via Phil's live UAT: sections render
from snapshots, bullets/notes intact, carry-forward works, DCS panel checkboxes
consistent. Contract 32 surfaces untouched except sidebar (badge addition —
verified visually).

**(3) Test ratchet.** cadence.js date math verified by a scripted node run
covering all six types + lapsed/rescheduled/occurrence edges (in-session, not
committed as a test file). track_access email parser verified by scripted run
(Outlook format, dedupe, case, junk rejection). **Gap flagged:** no committed
automated tests for the new MCP tools — every tool has manual UAT coverage
only. Carried as CLAUDE.md candidate 3 below.

**(4) Pattern sweep.** Shared patterns touched: screen-state persistence
(added TEAM_MEETINGS_REF_PANEL to the central SCREEN_KEYS constant — pattern
followed, no other consumers affected); D-419 gate-status walkback duplicated
again in tracks.js (now 3 MCP copies) — extraction candidate re-flagged from
the 07-07 close; changelog (S-035) updated twice per pattern.

**(5) Standards conformance.** JWT-first on every new tool (Arch-5) ·
parameterized queries throughout · soft delete + deleted_at filters on every
new SELECT (Arch-6; purge model documented; remove_meeting_bullet pre-existing
exception) · no credentials in code (creator email is a business rule, CC-019)
· no prompts in TS (Arch-3, n/a) · OnPush + standalone components + reactive
form for series creation · screen keys as constants (Rule 4) · blocked actions
show what-and-how-to-unblock messages (Decision 140: non-member access, private
join, restricted creation).

**(6) CC-decision completeness.** CC-001…CC-011 (07-07 document),
CC-012…CC-039 (this document): sequential, no gaps.

**(7) Structural health (Rule 12).** Over threshold, declared:
`team-meetings-detail.component.ts` **1136** lines (meeting run screen — carries
polling merge, drag-drop, chooser, pull; extraction candidate: drag-drop +
pull into a directive/service next contract) · `track-settings.component.ts`
**610** · `dcs-reference-panel.component.ts` **584** · `team-meetings-list.component.ts`
**514** · `tracks.js` (MCP) **1403** lines across 24 tools (single-responsibility
per function; split into tracks/, sections/, membership/ files if it grows).
Under threshold: tracks-list 356, service 220, others < 200.

**(8) Deployment.** Complete. Angular: gh-pages force-pushed through the final
busy-guard build (`aece6ac`, deployed 2026-07-12). MCP: Render manual redeploys
performed by Phil after each MCP-touching push (final MCP change: `7643450`).
Migrations 056/057/058 executed by Phil in Supabase. UAT checklists were issued
per increment in-session and executed live by Phil; remaining open item: retest
rapid-click on the panel checkboxes and the presenter-toggle "Saving…" states
against the deployed busy-guard build.

## Stage check (S-020)

Team Meetings sidebar devStatus: **pilot** (set during this arc). Live usage by
Phil + first invited participants underway. Advance to live only after Phil
confirms multi-user UAT (per stage-check timing rule).

## CLAUDE.md Candidates (Rule 16)

1. **Optimistic-UI rule:** "Never revert an optimistic UI state on a timer.
   Revert only on a server-confirmed transition. Timers + slow responses
   invite duplicate submissions." Trigger: CC-038 duplicate-bullet incident.
2. **Busy-guard rule:** "Every control that fires an MCP call disables itself
   (with a Saving…/spinner state) until the call resolves." Trigger: CC-038
   audit found four unguarded controls.
3. **MCP test gap:** team-meetings-mcp has no committed automated tests across
   26 tools; `npm test` remains broken (use `node --test tests/*.test.js`).
   Candidate: seed a test file per new tool at creation time (existing standard
   says this; it was not followed under UAT pace — Design should decide whether
   to backfill).
4. **D-419 walkback extraction** (re-flag from 07-07): three MCP copies +
   Angular copies of resolveGateStatus now exist.
5. **Screen-state recency:** the 7-day window silently resets per-user view
   memory for infrequent series (monthly 1:1s WILL reset). Candidate: raise the
   window or exempt team-meetings.ref-panel.

## Design follow-ups / open items (for D-number disposition)

- Tracks model, membership/leader semantics, purge model, templates, cadence,
  presenter sections, pull/dedupe rules — all currently governed by in-session
  Phil decisions recorded above; need D-numbers assigned outside Code.
- Deferred by decision: pending invites for unknown emails (rejected instead),
  public-series content preview before join (name/leaders/latest only),
  member-visible read-only past meetings (kept fully editable), tablet drag &
  drop, template promotion to DB + admin screen.
- Known pre-existing exception carried forward: remove_meeting_bullet hard
  delete (D-490 Step 2).

---

*Pathways OI Trust · Contract 33 · CodeClose · 2026-07-12 · CONFIDENTIAL*
