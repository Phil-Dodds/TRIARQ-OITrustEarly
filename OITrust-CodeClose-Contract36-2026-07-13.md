# OITrust CodeClose — Contract 36 — Initiative Status & Date Management
Pathways OI Trust | Build C | 2026-07-13 | CONFIDENTIAL
Spec: `initiative-status-fixes-spec.md` v1.0 (ValidatorClose 2026-07-12). Governing decisions: D-501–D-515.
Sessions: 2026-07-12 (build, phases A–D) + 2026-07-13 (UAT fixes, dashboard polish, test ratchet, close).

---

## 1. What was built

**Phase A — Gate date clear model (D-501–D-505).**
Clear is a first-class operation on target and actual dates. `set_milestone_target_date` / `set_milestone_actual_date` implement the D-502 null contract (explicit `null` = clear → SQL NULL; omitted param = no change). Save enablement is difference-based including set→blank; blank→blank stays disabled. Clearing never changes gate status (D-503); clearing a target on an At Risk/Behind gate shows the inline "Status retained; no target date to track against." note; clearing the actual date on a Complete gate uses the two-step D-183 inline confirm and leaves status Complete. Target dates stay editable while Awaiting approval (D-504). All changes log `cycle_event_log` events with `actor_user_id`; clears log `new_target_date: null`; D-486 slip detection tolerates null new dates (a clear is not a slip). Downstream counts/headlines recompute passively.

**Phase B — Authorship + edit model (D-506–D-509).**
Authorship opened to any user with Division visibility (`save_initiative_status_update`; Angular Update Status un-gated). Acknowledgment invitations fire only for non-trio-authored updates; missing ack is never a Needs Review reason; queue window is 3 calendar days from the chain ROOT. Edits are supersede rows (`supersedes_update_id`, migration 062): append-only chain, head displays, root `saved_at` governs overdue and all age displays. Editability = latest row + root within `STATUS_RECENT_DAYS = 3` + not status_overdue + author-or-trio. Acks preserved across edits with "acknowledged an earlier version" + one-click re-acknowledge. D-509: confidence-based review reasons persist age-independently until the applicable gate completes, then clear.

**Phase C — Dashboard redesign + meeting run model (D-510–D-512).**
New column set: Division short name (hidden on single-division views, now LEFT of Initiative Name) · Next Gate (canonical five gate names via shared `gate-resolution.js`) · Target Date (packed, "Jul 13" format, year only when non-current, overdue styling) · Team (grid parity) · Updated By (trio author = initials, non-trio = full name; age from chain root on its own line) · Escalation · Confidence · Needs Review · View Status. EPO/DOL/DCS person filters per the grid pattern; chips corrected; D-171 memory. Offered sorts (Next Gate Target Date; EPO then Target Date); header sort retained; Never-updated rows sort oldest. Prev/Next in the View Status panel walks the in-effect filter+sort. Update Status / Edit / Acknowledge actionable from the panel. New `status_dashboard_changed_since` boolean change signal, 10s poll while route active, CC-021 merge mechanics.

**Phase D — Ack visibility, helper text, My Actions (D-513–D-515).**
Ack chips on Current Status + View Status panel, non-trio-authored updates only; one chip per trio member; viewer's own chip is a one-click Acknowledge. Cadence-named helper text ("weekly/tri-weekly/monthly cycle"; phrase omitted when unconfigured). My Actions tabs: Approve Initiative Gates · Update Initiative Statuses · Acknowledge Initiative Status Updates; Completed moved behind "View completed →" inside the first tab; nav badge sum unchanged.

**§7 CLAUDE.md** — applied as v2.8: Rule 35 (no timer-based optimistic reverts), Rule 36 (busy guards), Render-manual-redeploy correction, `node --test tests/*.test.js` correction.

**Post-deploy UAT fixes (2026-07-13, Phil-directed).**
Canonical gate names enforced everywhere Next Gate renders (milestone_label like "Pilot Start"/"Build Start" had been surfacing — fixed in both delivery-cycle-mcp and team-meetings-mcp). Amber "Pending Approval" chip when the next gate is awaiting approval. Dashboard polish: Division left of name, shrink-to-content columns, month-day dates, two-line Updated By, Initiative Name width 30%. New Needs Review reason "No target date: [gate]" in the shared needs-review lib.

**Session follow-on outside contract scope (Phil-directed, Team Meetings).**
Section drag-to-reorder (header as handle, new `move_section` tool, meeting-local). Bold bullet main text. Inline bullet edit (new `update_bullet_text` tool, free-text only). Note autogrow on load/merge/expand. Drag/edit interaction guards.

---

## 2. CC-decisions

- **CC-36-01 — Migration numbering.** Spec says migration 059; repo sequence was at 061 → shipped as `db/migrations/062_status_update_supersede.sql`. Also includes `status_update_chain_root_saved_at()` pg function + re-created `refresh_initiative_status_overdue()` reading the chain root (the spec's "evaluate chain-root saved_at" amendment).
- **CC-36-02 — Dashboard component full rewrite (D-252 note).** Contract 36 touched every zone of `initiative-status-dashboard.component.ts`; rewritten rather than patched. Preserved behaviors: S-010/S-011/S-012 filter panel, D-171 memory, S-036 header sort, D-346 skeleton, S-018 row tap → detail.
- **CC-36-03 — Status panel full rewrite (D-252 note).** `initiative-status-update-panel.component.ts` rewritten: internal read/edit mode switch, supersede flow, Prev/Next, `refresh()` hook, ack chips, cadence labels.
- **CC-36-04 — Per-service gate resolution extraction.** §7 forbids a fourth walkback duplicate; services deploy separately so cross-service sharing needs a package (deferred, D-WalkbackExtraction). Created `delivery-cycle-mcp/src/lib/gate-resolution.js` as that service's single copy (its first); team-meetings-mcp keeps its own.
- **CC-36-05 — Recency semantics.** `STATUS_RECENT_DAYS = 3` in `lib/status-chain.js`; calendar-day comparison in UTC (today/yesterday/day-before), not 72 rolling hours.
- **CC-36-06 — Edit never touches the overdue clock.** Edit path cycle patch = `{ latest_status_update_id }` only; fresh saves also clear `status_overdue` (D-482).
- **CC-36-07 — Clears and status flags.** Actual-date clear leaves `date_status` untouched; clears excluded from isRevert/isBackdate branches. §1.3 actor verification: both date tools already write `actor_user_id` — confirmed, no schema addition needed.
- **CC-36-08 — Ack accepted regardless of window.** The 3-day window filters the QUEUE; the self-chip Acknowledge on an older non-trio-authored head still works. Spec silent; chosen so a late ack is never blocked.
- **CC-36-09 — Panel Edit visibility approximation.** Server supplies `chain.edit_window_open` (root recent + not overdue); client offers Edit to author / ack-roster trio members / admin. Exact author-or-trio enforcement is server-side at save; the client check is a superset display gate.
- **CC-36-10 — Unconfigured-cadence section labels.** D-514 phrase-omission extended to the panel's section labels: fallbacks "Accomplished Recently" / "Plan / Next Steps" when no cadence config exists.
- **CC-36-11 — Change-signal scoping.** `status_dashboard_changed_since` mirrors the dashboard's own access model (division memberships; admin unrestricted) over `initiative_status_updates` + `initiative_status_acknowledgments`.
- **CC-36-12 — Completed as link not tab.** `ActiveTab` retains `'completed'` internally; it renders via "View completed →" inside Approve Initiative Gates per D-515.
- **CC-36-13 — Canonical gate labels always (UAT fix).** `resolveNextGate` label = the five canonical gate names, never `milestone_label`. Applied in both delivery-cycle-mcp (dashboard) and team-meetings-mcp (`get_team_meeting` bullet meta) — the bug predated the contract in the meetings copy.
- **CC-36-14 — Pending Approval qualifier (Phil-directed).** Dashboard batches `gate_records`; `next_gate_pending_approval` = next gate's `gate_status === 'awaiting_approval'` → amber chip under the gate name (own line — inline it inflated the nowrap column width).
- **CC-36-15 — Dashboard layout polish (Phil-directed).** Division column left of Initiative Name; Division/Next Gate/Target Date/Updated By shrink-to-content (`width:1%` + nowrap); Initiative Name `width:30%`/`min-width:220px`.
- **CC-36-16 — Target Date display format (Phil-directed).** "Jul 13"; ", YYYY" appended only when the year differs from current. String-parsed (no Date() timezone shift).
- **CC-36-17 — New Needs Review reason (spec deviation, Phil-directed).** "No target date: [gate]" fires when the resolved next gate has no target date. Added to the shared needs-review lib so the dashboard and status panel agree; `get_latest_initiative_status` milestone select gained `target_date` for parity. Deviation: D-485's reason set did not include this; improvement — rows with no date can never trip slip/overdue-date logic, so they previously hid.
- **CC-36-18 — Section drag-to-reorder (follow-on, Phil-directed).** Header = drag handle (grip glyph); body non-draggable so textareas keep text selection. Drop = dragged section takes target's position; client splice mirrors server. New `move_section` tool rewrites `sort_order` 1..N + bumps `content_updated_at`. Meeting-local only — series template order untouched (carrying to future meetings deferred to Design if wanted).
- **CC-36-19 — Bold bullet main text (follow-on, Phil-directed).** Free-text bullets and initiative chips at `font-weight:600`; notes stay regular.
- **CC-36-20 — Inline bullet edit (follow-on, Phil-directed).** ✎ on saved free-text bullets → inline input; Enter/blur saves, Esc cancels, busy state per Rule 36. New `update_bullet_text` tool REJECTS initiative-linked bullets ("text is the Initiative name — edit the note instead", D-140 style) since their text is never rendered.
- **CC-36-21 — Note autogrow on load (follow-on, bug fix).** autoGrow only fired on typing; pre-filled notes stayed clipped. `sizeAllNotes()` runs after load/merge/expand; section NOTES/COMMENTS textarea also gained on-input autogrow it never had.
- **CC-36-22 — Drag/edit interaction guards (follow-on).** Poll refetch skips a tick while any drag is in flight (mid-drag DOM reorder kills the drag); row draggability off while its bullet is being edited; poll merge preserves the bullet mid-edit (same guard as focused notes).
- **CC-36-23 — Stale-test modernization (test ratchet).** `contract32-status.test.js` rewritten to assert the Contract 36 contract (D-506 visibility auth, D-507 supersede + overdue-closed window, D-508 3-day queue, D-510 row shape incl. canonical labels + pending-approval flag, CC-36-17 reason). Two `tools.test.js` stale assertions converted to current-contract source checks (D-165 optional workstream_id; D-502 clear-excluded backdate). Suite: 176 pass / 0 fail.

Sequence check (Rule 17): CC-36-01 → CC-36-23, no gaps.

---

## 3. CodeClose Verification (Rule 29)

**(1) Spec coverage — 28 ACs.**
Legend: PASS-T = protected by automated test; PASS-U = verified in Phil's live UAT during the session; BUILT = implemented, binary UAT step below (§5).

| AC | Result | Evidence |
|---|---|---|
| 1 Clear target date → NULL | PASS-U | Phil exercised clears post-deploy; D-502 null path in both tools |
| 2 Clear actual (non-Complete) no confirm | BUILT | §5-A step 3 |
| 3 Clear actual on Complete → two-step, status stays | BUILT | `confirmClearCompleteGate` two-step; §5-A step 4 |
| 4 Clear target on At Risk → note, status kept | BUILT | milestoneNote path; §5-A step 5 |
| 5 Save disabled on no-diff incl. blank/blank | BUILT | `milestoneTargetUnchanged`/`actualDateUnchanged`; §5-A step 2 |
| 6 Target editable while Awaiting approval | BUILT | D-504; §5-A step 6 |
| 7 Clear event logs null + actor | PASS-T/code | `actor_user_id` in both tools (verified §1.3); event `new_target_date: null` |
| 8 Passive recompute | PASS-U | Dashboard reflects clears (Phil screenshots) |
| 9 Non-trio user can save | PASS-T | visibility-auth tests; needs second-account UAT for full pass (§5-B) |
| 10 Non-trio save → 3 trio ack entries; trio save → none | PASS-T | `get_my_acknowledgments_due` tests (both directions) |
| 11 Missing ack never a review reason | PASS-T | needs-review lib has no ack input |
| 12 Edit offered ≤3d root + not overdue | PASS-T | edit happy + overdue-rejected tests |
| 13 Edit writes supersede row; head displays | PASS-T | edit test asserts `is_edit`; history expands chain |
| 14 Edit doesn't change overdue/age | PASS-T/code | CC-36-06 head-only patch; pg fn reads chain root |
| 15 Acks survive edit + earlier-version marker | BUILT | chain-walk in `get_latest_initiative_status`; §5-B step 6 |
| 16 Confidence reason until gate complete | PASS-T | D-509 gating in needs-review lib |
| 17 Division short names; hidden when single | PASS-U | Phil's screenshots (multi-division view shows short names) |
| 18 Next Gate + Target Date w/ overdue styling | PASS-U | Post-fix screenshots show canonical gates + red past dates |
| 19 Team column grid parity | PASS-U | Screenshots |
| 20 Updated By initials/full-name/Never + root age | PASS-U | Screenshots (DS initials + 3 days; Never rows) |
| 21 Person filters + chips + memory | BUILT | §5-C step 4 |
| 22 Offered sorts + memory | PASS-U | "EPO, then Target Date" active in screenshots |
| 23 Prev/Next walks in-effect order | BUILT | §5-C step 6 |
| 24 Update/Edit/Acknowledge from panel | BUILT | §5-B |
| 25 ~10s live refresh, focus preserved | BUILT | §5-C step 7 (two windows) |
| 26 Ack chips non-trio-authored only; self one-click | PASS-T (render rule) | chips-only-when-non-trio in tool tests; UI click = §5-B step 5 |
| 27 Cadence-named helper text | BUILT | §5-B step 7 |
| 28 My Actions tabs + completed link | BUILT | §5-D |

No FAILs. All BUILT items have a binary step in §5.

**(2) Regression check.**
- Milestone date editors: set/change paths untouched by clear additions; D-449 backdate and revert logic preserved (clears excluded, not removed) — suite green.
- Status save: trio-author path unchanged shape; confidence write-through untouched — happy-path test green.
- Dashboard: S-010/011/012/S-036/D-171/D-346/S-018 behaviors carried into the rewrite (CC-36-02) — division filter + sorts exercised in Phil's UAT.
- My Actions: approvals tab logic untouched; Completed still reachable; nav badge sum formula unchanged.
- Team Meetings (follow-ons): bullet drag between sections re-verified alongside section drag (shared drop targets, discriminated payloads); 10s collab poll unchanged except the in-drag skip.

**(3) Test ratchet.**
- delivery-cycle-mcp: **176 pass / 0 fail** after modernization (CC-36-23). Logic-touching changes and their protection: open authorship / edit validations → save tests; ack queue → 2 tests; dashboard shape incl. canonical labels + pending flag + no-target-date reason → dashboard test; needs-review lifecycle → helper tests; date-tool clear semantics → D-502 source-contract test.
- team-meetings-mcp: `move_section` (3 tests) + `update_bullet_text` (2 tests) pass. **7 pre-existing failures remain** (Contract 33-era single-result mock can't sequence multi-query tools) — unchanged before/after this session (Rule 11 baseline held); flagged as a CLAUDE.md candidate below.
- Angular: no component tests added this contract (repo has no harnessed component test setup for these features); UI verified via build + live UAT — flagged below.

**(4) Pattern sweep.**
Shared patterns modified: `lib/needs-review.js` — consumers `get_latest_initiative_status`, `get_initiative_status_dashboard`: both pass `target_date` in milestones (verified). `lib/gate-resolution.js` — consumer `get_initiative_status_dashboard` (sole consumer in service). `lib/status-chain.js` — consumers `save_initiative_status_update`, `get_latest_initiative_status`, `get_my_acknowledgments_due`, `get_initiative_status_dashboard` (all verified passing head ids). team-meetings walkback copies: `get_team_meeting` fixed for canonical labels; the other copies don't render next-gate labels (checked).

**(5) Standards conformance.**
S-010/S-011/S-012 (filter panel/staging/chips): PASS — dashboard filters follow the grid pattern per D-511. S-036 header sort: PASS. D-171 screen-state memory: PASS (`SCREEN_KEYS.INITIATIVE_STATUS_DASHBOARD`, named constant per Rule 4). D-346 skeleton: PASS. S-018 row tap: PASS. D-140 blocked-action UX: PASS (visibility error, edit-window errors, initiative-bullet rename rejection all say what unblocks). Rule 35: PASS — no timer reverts anywhere new. Rule 36: PASS — all new controls busy-guard (Save/Acknowledge/theme admin/section drag is optimistic-with-poll-correction per the established move_bullet pattern). S-033 version banner: PASS — all deploys via `npm run build` with version.json confirmed.

**(6) CC-decision completeness.** CC-36-01..23 sequential, no gaps (§2).

**(7) Structural health.** Components over 300 lines / services over 400:
- `delivery-cycle-detail.component.ts` — 3,697 (pre-existing giant; additive edits only this contract)
- `gate-record-modal.component.ts` — 1,353
- `team-meetings-detail.component.ts` — 1,341
- `initiative-status-dashboard.component.ts` — 573 (rewrite; cohesive but over threshold)
- `initiative-status-update-panel.component.ts` — 545 (rewrite; over threshold)
- `actions-list.component.ts` — 365
- `tracks.js` (team-meetings-mcp) — ~1,445 (pre-existing; new tools added as standalone files, not into it)

**(8) Deployment.** Executed by Phil (per Rule 22 / manual-deploy model), confirmed complete 2026-07-13: migrations 060, 061, **062** run against Supabase; Render manual redeploy of BOTH services (delivery-cycle-mcp, team-meetings-mcp); gh-pages force-pushed (latest staging `oi-deploy-bulletedit-2026-07-13`, build_version `3d1defd…`). Health: live app verified via Phil's post-deploy screenshots (dashboard + team meetings). Today's test-only commit needs no redeploy. → UAT Checklist produced (§5).

---

## 4. CLAUDE.md Candidates (Rule 16)

1. **Candidate:** "team-meetings-mcp test suite uses a single-result mock that cannot sequence multi-query tools; new multi-query tools get validation-path tests only, or adopt the FIFO-queue mock from delivery-cycle-mcp's contract32-status suite." **Why:** 7 permanent failures mislead every session's test run. **Trigger:** Rule 11 baseline comparisons kept hitting the same 7 failures.
2. **Candidate:** "Angular features have no component-test harness; UI verification is build + UAT. If Design wants component tests, a harness decision (TestBed vs none) is needed first." **Why:** the Tests standard says 'alongside every code file' but the repo has no working pattern to follow for these screens. **Trigger:** Rule 29(3) declaration this contract.
3. **Candidate:** "Build for deploy AFTER committing — version.json stamps the current HEAD SHA; building before the commit ships a version.json one SHA behind." **Why:** happened twice this session; caught by checking staged version.json. **Trigger:** §8 deploy staging.
4. **Candidate:** "Next Gate labels come only from the canonical five gate names (gate-resolution GATE_LABELS / NEXT_GATE_LABELS); milestone_label is a milestone display name and must never surface as a gate." **Why:** the same bug shipped twice from two code paths before being caught in UAT. **Trigger:** CC-36-13.

---

## 5. UAT Checklist (Rule 19, D-357)

**A. Gate date editors (Initiative detail → Milestones)** — changed: clear support, diff-based Save, inline notes/confirm.
1. Open a gate with a target date → clear the field → Save enabled → save → field shows "Set date". PASS/FAIL
2. Reopen the same editor without changing anything → Save disabled (incl. blank→blank). PASS/FAIL
3. Clear an actual date on a NON-Complete gate → saves with no confirmation. PASS/FAIL
4. Clear the actual date on a Complete gate → "Clear the actual date anyway?" two-step → confirm → date cleared, status still Complete. PASS/FAIL
5. Set a gate to At Risk, clear its target date → status stays At Risk; inline note "Status retained; no target date to track against." PASS/FAIL
6. Submit a gate for approval → its target date remains editable while Awaiting approval. PASS/FAIL
7. Admin → event log for that initiative shows the clear with your name recorded. PASS/FAIL
8. Overdue Gates count / "Next:" headline reflect the clear after reload. PASS/FAIL

**B. Status updates (dashboard View Status panel or detail Current Status)** — changed: open authorship, edit chains, ack chips, cadence text. *(Steps 1–2 and 5–6 need a second, non-trio account.)*
1. Second account (non-trio, division member): Update Status opens and saves. PASS/FAIL
2. After that save: all three trio members get Acknowledge Initiative Status Updates entries; a save by a trio member creates none. PASS/FAIL
3. On a fresh (today) update you authored: Edit offered → change text → save → history shows both versions, display shows the new one, age unchanged. PASS/FAIL
4. On an initiative whose status is overdue or whose update is >3 days old: Edit not offered. PASS/FAIL
5. Viewing a non-trio-authored update as a trio member: three chips render; your own chip is an Acknowledge button; one click flips it and drains the badge. PASS/FAIL
6. Acknowledge, then have the update edited → your chip shows "acknowledged an earlier version" with one-click re-acknowledge. PASS/FAIL
7. Panel helper text names your division's cadence ("weekly cycle" etc.); on an unconfigured division the phrase is absent ("Accomplished Recently" / "Plan / Next Steps"). PASS/FAIL

**C. Initiative Status Dashboard** — changed: full D-510/511/512 redesign + polish.
1. Columns read: Division (left, short names) · Initiative Name · Next Gate · Target Date (adjacent, "Jul 13" format) · Team · Updated By (author line + age line) · Escalation · Confidence · Needs Review · View Status. PASS/FAIL
2. Next Gate shows ONLY the five gate names; a submitted gate shows the amber "Pending Approval" chip under it (e.g. SMS Texting). PASS/FAIL
3. Filter to one division → Division column disappears. PASS/FAIL
4. EPO/DOL/DCS filters filter correctly; chips removable; filters + sort survive leaving and returning. PASS/FAIL
5. Rows with a gate but no target date show "No target date: [gate]" in Needs Review. PASS/FAIL
6. Open View Status → Prev/Next moves through rows in the current filter+sort order. PASS/FAIL
7. Two windows: save a status in one → other window's grid reflects it within ~10s without losing your scroll/typing. PASS/FAIL

**D. My Actions** — changed: D-515 tabs.
1. Tabs read Approve Initiative Gates / Update Initiative Statuses / Acknowledge Initiative Status Updates with badges; "View completed →" inside the first tab opens the completed list; sidebar badge total unchanged. PASS/FAIL

**E. Team Meetings (session follow-ons)** — changed: section drag, bullet edit, autogrow, bold.
1. Drag a section header (⋮⋮ grip) onto another section → order changes, survives reload, second browser sees it ≤10s. PASS/FAIL
2. Bullet drag between sections still works. PASS/FAIL
3. ✎ on a free-text bullet → edit → Enter saves; Esc cancels; initiative bullets show no ✎. PASS/FAIL
4. Reload a meeting with long notes → notes fully visible (no clipping); typing still grows them; section NOTES/COMMENTS grows too. PASS/FAIL
5. Bullet titles render bold; notes regular. PASS/FAIL

---

## 6. Deferred / handoff to Design

- **D-WalkbackExtraction** — cross-service shared gate resolution still needs a package mechanism; each service has one internal copy now (no duplicates added this contract).
- **Section reorder scope** — meeting-local (CC-36-18). If reorder should write back to the series template ("apply to future meetings"), that's a Design call.
- **team-meetings-mcp test mock** — candidate 1 above.
- **Ack window semantics** — CC-36-08 (late acks accepted) for ratification.
- **New review reason** — CC-36-17 "No target date: [gate]" for D-number assignment, plus CC-36-13..16, 18–22 as candidate D-numbers.

---

*Pathways OI Trust · CodeClose Contract 36 · 2026-07-13 · CONFIDENTIAL*
