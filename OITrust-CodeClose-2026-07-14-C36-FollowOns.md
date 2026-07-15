# OITrust CodeClose — 2026-07-13/14 Follow-On Session (post-Contract 36)
Pathways OI Trust | Build C | 2026-07-14 | CONFIDENTIAL
Scope: Phil-directed improvement stream after the Contract 36 CodeClose, plus the
trimmed build of the Gate Coaching spec (D-527), a D-482 evaluation amendment,
and one security fix. No numbered contract governs this session; decisions are
CC-0714-01..20, all flagged for Design D-number assignment.

---

## 1. What was built (chronological)

1. **User admin — stranded-account recovery.** `create_user` now restores a soft-deleted `users` row in place, or relinks an orphaned auth account (invite succeeded, row insert failed) by locating it via the admin API and creating the missing row. No new invite fires on either path; response carries `recovery` + message. (Emily Bohy case: existed in auth only — invisible in User Management, "already has an active account" on create.)
2. **Series Settings — section reorder via drag & drop**, ↑↓ arrows removed, hint text explains drag. Same take-the-target's-position semantics as the meeting screen.
3. **Gate Coaching (D-527) — trimmed scope.** New `shared/constants/gate-coaching.constants.ts` (`GATE_DATE_SEMANTICS`, `GATE_COACHING_SHORT`, and now also `GATE_COACHING_FULL` + `OUTCOME_COACHING` for the Guide). Surface 1: date-semantics line renders full-width under a gate row whenever either date editor is open. Surface 2: one-line gate meaning under the GateRecordModal title + "More →" deep link. NOT built (deliberately): per-gate line in editors, expandable FULL text in the modal, dashboard header ⓘ popover (ACs 4–6).
4. **Initiative Guide** — `/initiatives/guide`, concept guide (Initiatives · Five Gates with FULL texts · Target vs Actual Dates · Statuses & Approval · Status Updates & Acks · Outcomes), anchored sections + TOC, fragment deep links. OI Library seed. No Tiers section — no Design-approved tier text exists (Rule 6).
5. **Initiative Tracking hub** — 3 columns (shell 880→1180px); top row = All Initiatives · Status Dashboard · Guide; Workstream Summary / Gate Schedule / Deploy Gate by Quarter collapsed behind "More views (workstream-organized) →" (workstreams not in effect).
6. **Recently Approved Gates** — completes the Contract 24 deferred filter panel: Division + Gate filters (staged, chips, D-171), Team column (grid-parity chips; `list_approved_gates` returns assigned names), Division column far left. Fixed latent bug: sort-save used to wipe saved filters.
7. **My Actions / Approve Initiative Gates** — submission note upgraded to 2-line clamp + hover; EPO/DOL/DCS single-select person filters (`list_pending_approvals` returns team ids+names); "Submitted by" filter (display-name keyed, client-only).
8. **Initiative Status Dashboard** — Next Gate multi-select filter (canonical five, chips, D-171); silent refresh on detail-panel close / panel save / acknowledge (no skeleton, trackBy merge — grid never flashes); two new offered sorts: EPO · Next Gate · Division and EPO · Division · Next Gate · Target Date (gates rank in lifecycle order; no-gate rows last).
9. **D-482 evaluation amendment — final model (migration 064, supersedes 063 which ran briefly the same day).** `status_overdue` = the status chain-root predates the MOST RECENTLY OPENED prep window (meeting − 2 days). Blank from an in-window save until the next window opens; red from window-open through and past the meeting until anyone saves; an update made today is never red today. `status_due_at` = next meeting date. Intermediate designs (rolling interval; amber nudge + meeting-day-only red — 063) were built, UAT-reasoned with Phil through a four-scenario matrix, and replaced. Origin: Yogesh updated a status the same day it showed "Status overdue" (old rule required saves within the pre-meeting window).
10. **Team Meetings batch:**
    - Positioned bullet drag: drop ON a bullet = take its position (reorder within a section or insert-at-position across sections; `move_bullet` gains `target_bullet_id`); drop on section = append (unchanged).
    - My Team Meetings purpose subtitle (plan ahead / organize live / carry forward).
    - Series creation opened to ALL users (Contract 33 pilot gate lifted); encouraging hint under + New Series; creator = first member + leader (already built).
    - Latest-activity preview (`latest_activity.js`): newest bullet (created_at) or non-empty note (updated_at) per meeting → "snippet" — initials, on both lists.
    - Sticky meeting header (back link, ⚙ Series, title, date, pull controls float with shadow).
    - Latest Change as its own rightmost column on both lists — 2-line clamp, initials, no section name, bolds with the unread row.
    - Admin scope toggle SWAPS the view (checked = only non-participating meetings), reworded label.
    - Deleted visibility decoupled from scope: "Show deleted series (N)" (admin-only, only when N>0, transient, resets on scope change) and "Show deleted meetings (N)" (leaders/admins, only when N>0) with per-row Restore via NEW `restore_team_meeting` tool — first recovery path for mis-deleted meetings. `list_team_meetings` gains `include_deleted` + `deleted_count`; default consumers unchanged; graveyard auto-exits when emptied.
    - Last Updated shows time to the minute; documented that content_updated_at (all mutations incl. deletes/reorders) can run ahead of the Latest Change preview (newest surviving content).
11. **SECURITY — migration 065.** Supabase advisory `rls_disabled_in_public`: migrations 055/056/059/061 created ten tables (all Team Meetings tables + roadmap_themes) WITHOUT Row-Level Security — readable/writable via PostgREST with the anon key that ships in the Angular bundle. Fix: RLS enabled with ZERO policies (deny-all from the public API); MCP service-role access bypasses RLS, so the app is unaffected (Arch-1).

---

## 2. CC-decisions (CC-0714-01..20, sequential, no gaps)

- **CC-0714-01** create_user recovery: soft-deleted row → restore in place (flags/name applied, no invite); orphaned auth → relink via `auth.admin.listUsers` + insert row with auth id; response `recovery: 'restored'|'relinked'|null`.
- **CC-0714-02** Series Settings reorder = drag only; arrows removed (Phil chose the "remove and explain" option); hint text carries the affordance.
- **CC-0714-03** D-527 built trimmed (Phil-directed after overreach review): point-of-use = one always-visible semantics line + modal one-liner; FULL text, Outcome definition, dashboard popover HELD for the OI Library. Editor line renders full-width UNDER the gate row (spec said below the fields; the 1fr date columns can't hold a two-clause sentence).
- **CC-0714-04** Initiative Guide chosen over an FAQ (concept guide, anchor-linkable, single content source shared with point-of-use constants); framed as the OI Library's first document. Tiers section omitted — no Design text (Rule 6).
- **CC-0714-05** Hub: Guide on top row; 3-column grid; workstream-organized cards secondary behind a transient "More views" link (Phil: workstreams not in effect). Routes unchanged.
- **CC-0714-06** Recently Approved Gates filters are client-side over the loaded 28-day window (no server round-trips; server params retained for future use). Sort persistence now writes filters+sort together (was wiping filters).
- **CC-0714-07** My Actions person filters follow the dashboard/grid single-select-radio-per-role pattern; Submitted-by filter keys on display name (already in payload; no MCP change).
- **CC-0714-08** Dashboard refreshes silently (load(true)) on detail close / save / acknowledge — reload flash eliminated; initial load keeps the skeleton.
- **CC-0714-09** Offered sorts rank gates in LIFECYCLE order via a gate→index map, never alphabetically; rows with no next gate sort last within group.
- **CC-0714-10** D-482 FINAL: one continuous rule — overdue iff chain root < most recent window-start (≤ today); windows recur per cadence (weekly −7, triweekly −21, monthly nth-weekday of prior month for the previous meeting). Save clears; cron re-evaluates daily; `status_due_at` = next meeting DATE. The amber/meeting-day two-signal model (migration 063) was built and REPLACED same-day; 063 ran in prod briefly — 064 supersedes in place. My Actions "Update Initiative Statuses" stays flag-driven and therefore now fills only from window-open.
- **CC-0714-11** needs-review lib surfaces the flag verbatim again ("Status overdue"); D-482 window math lives only in pg. Tests rewritten to the final contract (delivery-cycle 177 pass / 0 fail).
- **CC-0714-12** move_bullet positioned drop = take-the-target's-position (same splice as move_section, mirrored optimistically); section-area drop keeps append; concurrent-delete of target falls back to append.
- **CC-0714-13** Series creation open to any authenticated user; server + client gates removed; hint: "Anyone can start a series… You'll be its leader."
- **CC-0714-14** Latest-activity preview: bullets rank by created_at (table has no updated_at → bullet TEXT edits don't refresh the preview — accepted v1; a column addition is the fix if it bites); notes by updated_at, empties excluded; initiative bullets preview their stored text (the initiative name).
- **CC-0714-15** Sticky meeting header includes the pull-from-last-meeting controls (navigation-adjacent); z-index below overlays.
- **CC-0714-16** Latest Change column: 2-line -webkit-line-clamp, initials only, section name dropped, full text via title tooltip; bolds with the row's unread state.
- **CC-0714-17** Admin scope toggle swaps (non-participating only) instead of adding; deleted-series visibility moved to its own toggle (below).
- **CC-0714-18** Deleted toggles: series-level admin-only (restore/purge is admin-only — showing non-admins read-only graveyards is frustration); meeting-level for leaders+admins with NEW restore_team_meeting (leader-or-admin). Both: off by default, rendered only when count > 0, transient (deleted views are exceptional states, not preferences). Member-mode list_my_tracks now returns the caller's own deleted series (flagged) so counts can render.
- **CC-0714-19** Last Updated format gains minutes; divergence from the preview documented (stamp covers deletes/reorders/title changes; preview shows newest surviving content).
- **CC-0714-20** RLS remediation posture: MCP-only tables get RLS ENABLED WITH NO POLICIES (deny-all; service role bypasses) — deliberately different from migration 031's per-user policies, which exist for tables read under user JWTs.

Sequence check (Rule 17): CC-0714-01 → CC-0714-20, no gaps.

---

## 3. CodeClose Verification (Rule 29)

**(1) Spec coverage.** No numbered contract this session. D-527 (the only formal spec touched): AC1 partially (semantics line built; per-gate editor line intentionally not), AC2 built (likely unreachable in schema), AC3 PASS (Phil screenshot), AC7 PASS, AC8 PASS, AC4/5/6 intentionally NOT BUILT (CC-0714-03, held for OI Library) — Design should treat D-527 as amended. All other work was Phil-directed with acceptance = his in-session UAT; remaining items are in §5.

**(2) Regression check.** delivery-cycle-mcp suite 177 pass / 0 fail (includes rewritten D-482 tests). division-mcp 78 / 0. team-meetings-mcp 13 pass / 7 PRE-EXISTING failures — baseline identical before and after every change this session (single-result mock limitation, candidate below). Manual regressions verified in Phil's rolling UAT: bullet cross-section drag alongside positioned drops; dashboard filters/sorts/memory through the redesigns; meetings-list consumers (latest-meeting detection, carry-forward) unaffected by include_deleted (default path unchanged).

**(3) Test ratchet.** Protected: D-482 final rule (2 lib tests + dashboard shape test), move_section (3), update_bullet_text (2), create_user recovery (source-contract test), canonical-label + pending-approval dashboard assertions. Unprotected logic (flagged): move_bullet positioned path, restore_team_meeting, latest_activity.js, list_team_meetings include_deleted, list_my_tracks deleted inclusion — all in team-meetings-mcp where the mock can't sequence multi-query tools (candidate 1). Angular changes: build + live UAT only (no component harness — standing gap).

**(4) Pattern sweep.** needs-review lib touched twice (signature out and back) — both consumers (dashboard, get_latest) verified at each step. gate-coaching constants: three consumers (editors, modal, Guide) share one file by design. Latest Change cell styling duplicated deliberately in two list components (different grids).

**(5) Standards conformance.** Rule 35 (no timer reverts): PASS — none added. Rule 36 (busy guards): PASS — Restore buttons, create flows guarded; pure-local toggles exempt. D-171 memory: dashboard gate filter, approvals filters persist; deleted/scope toggles deliberately transient (CC-0714-18). D-140 messaging: restore-denied, create_user relink-failure, and RLS notes all say what unblocks. S-033: every deploy via npm run build with version.json verified (one SHA-lag caught and rebuilt).

**(6) CC-decision completeness.** 01..20 sequential (§2).

**(7) Structural health** (>300-line components / >400-line services): delivery-cycle-detail 3,697 · gate-record-modal ~1,370 · team-meetings-detail ~1,480 · tracks.js ~1,520 · gates-approved ~500 · status-dashboard ~620 · tracks-list ~490 · team-meetings-list ~470 · status panel ~560. All pre-existing overages grown incrementally; no extractions this session.

**(8) Deployment.** Incremental (Phil deployed batches throughout; latest confirmed deploy = the sticky-header/Latest Change batch). OUTSTANDING at close: **migration 064** (window-anchored overdue — 063 ran; 064 supersedes) · **migration 065** (RLS security fix — run ASAP) · **Render redeploys**: delivery-cycle-mcp (D-482 final needs-review revert) and team-meetings-mcp (restore tool, include_deleted, activity preview, open creation, positioned bullet drops) · **gh-pages**: staging `C:/tmp/oi-deploy-deleted-2026-07-14` (build 3b240ff, cumulative). UAT checklist below assumes those land.

---

## 4. CLAUDE.md Candidates (Rule 16)

1. **Every CREATE TABLE migration must ENABLE ROW LEVEL SECURITY in the same file.** Deny-all (zero policies) is correct for MCP-only tables — the service role bypasses RLS. Trigger: Supabase advisory caught ten tables from migrations 055–061; two-day-late external detection is not a control.
2. **team-meetings-mcp test mock cannot sequence multi-query tools** — new tools get validation-only coverage; adopt delivery-cycle's FIFO-queue mock pattern. Trigger: recurring 13/7 baseline; five unprotected logic changes this session.
3. **Build for deploy AFTER committing** — version.json stamps HEAD; pre-commit builds ship a one-behind SHA. Trigger: caught twice on 7/13.
4. **Signal semantics rule of thumb:** a red chip must mean "act now"; history belongs in age columns. Trigger: the D-482 redesign — the old rule flagged rows red 28 days a month by design.

---

## 5. UAT Checklist (Rule 19) — items not yet UAT'd at close

**A. Run first: migrations 064 + 065, Render both services, gh-pages push (§3.8).**

**B. Status overdue (final rule)**
1. Initiative updated today shows NO "Status overdue" anywhere (Yogesh case). PASS/FAIL
2. A division whose meeting window is open (2 days before → meeting) shows red only on rows whose status predates the window; saving clears it instantly. PASS/FAIL
3. Mid-cycle rows show no status chip regardless of staleness; Updated By age still shows staleness. PASS/FAIL
4. My Actions → Update Initiative Statuses fills from window-open, empties after saves. PASS/FAIL

**C. RLS (security)**
1. After 065: Team Meetings fully works (open meeting, add bullet, note, lists). PASS/FAIL
2. Supabase → Advisors: rls_disabled_in_public cleared; note any remaining advisories. PASS/FAIL

**D. Team Meetings batch**
1. Drag a bullet onto another bullet → takes its position (same + cross section); onto section whitespace → appends; order survives reload + second browser ≤10s. PASS/FAIL
2. Meeting screen: header (back/⚙/title/date/pull) floats with shadow while scrolling. PASS/FAIL
3. Both lists: Latest Change column — quoted 2-line snippet + initials, bold on unread rows; Last Updated shows minutes. PASS/FAIL
4. Craig (any non-Phil user): + New Series visible with hint → creates → Leader chip. PASS/FAIL
5. Admin toggle swaps to non-participating meetings only. PASS/FAIL
6. "Show deleted meetings (N)" appears only where deletions exist (leaders) → graveyard rows → Restore returns the meeting; toggle disappears at N=0. "Show deleted series (N)" same for admins on My Team Meetings. PASS/FAIL

**E. Initiative surfaces**
1. Guide: hub card top row → Guide renders, TOC + gate-modal "More →" deep-link scroll to sections. PASS/FAIL
2. Date editors: helper line under the row while a date editor is open; gate modal shows one-liner + More →. PASS/FAIL
3. Hub: 3 columns; workstream cards behind "More views". PASS/FAIL
4. Dashboard: Next Gate filter chips; open+close an initiative → no grid flash, scroll preserved; both new sorts group correctly. PASS/FAIL
5. Recently Approved Gates: Division far left, Team chips, Division/Gate filters + chips persist. PASS/FAIL
6. Approvals: 2-line note w/ tooltip; EPO/DOL/DCS + Submitted-by filters. PASS/FAIL
7. User Management: create ebohy@triarqhealth.com → succeeds with "relinked/restored — no new invitation sent"; Emily appears. PASS/FAIL

---

## 6. Design handoff

- D-numbers requested for CC-0714-01..20 (notably: 10/11 amend D-482; 03/04 amend D-527; 13 amends the Contract 33 creation restriction; 18 introduces the restore-meeting permission model; 20 sets the RLS posture).
- D-527 remainder (FULL text surfaces, Outcome coaching, dashboard popover) is intentionally parked pending the OI Library decision — the Guide at /initiatives/guide is proposed as that Library's first document.
- Deferred: bullets.updated_at column (preview refresh on edits); tiers section text for the Guide; team-meetings test mock upgrade; section-reorder write-back to series template (meeting-local today).

---

*Pathways OI Trust · CodeClose 2026-07-14 Follow-On Session · CONFIDENTIAL*
