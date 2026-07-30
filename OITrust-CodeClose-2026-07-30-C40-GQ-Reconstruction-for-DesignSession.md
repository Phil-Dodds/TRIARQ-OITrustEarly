# OITrust — Contract 40 CC-40-G..Q Close Reconstruction

**Date:** 2026-07-30
**Session type:** Read-only investigation and reconstruction. Not a build session.
**Requested by:** Design Session 2026-07-30 (Phil Dodds)
**Branch:** `master` @ `2ef60ab`. Nothing modified except this file. No commits, no pushes, no deploys.

---

## 1. Verdict

**No third CodeClose or session record for CC-40-G..Q exists.** `cc-decisions-active.md` contains zero CC-40 entries; there is no as-built file, no `docs/session-archive/` entry for this window, and neither stash holds a relevant record. The gap File 2 pointed at is real.

**However, the record is substantially recoverable — better than expected.** Code committed each decision as its own commit with the CC-letter in the subject line *and the reasoning in the commit body*. All eleven letters **G, H, I, J, K, L, M, N, O, P, Q are recovered at HIGH confidence**, with stated rationale for each — not merely inferred from diffs. Nothing required a provisional label.

Three caveats Design must weigh:

1. **Anchor 2 fails.** There is no home-card-sizing "CC-40-M" for CC-40-M2 to have superseded. CC-40-M is the Status History Accomplishment View toggle — unrelated. `CC-40-M2` in File 2 is a **label collision**, not a revision. See §4.
2. **File 2 misattributes CC-40-P.** The dashboard approver filter/initials column is entirely **CC-40-Q**. CC-40-P is Division-Leader scoping on All Pending Gates. See §4.
3. **Three changes in this window carry no CC-letter** (two hotfixes and one Phil-requested feature). They are live and unrecorded. See §5.

Separately, the Rule 34 Build C §12 rolling check (Task 4, §6) surfaces a finding independent of Contract 40: **AC-29 — maintenance mode — is NOT BUILT**, and Build C §12 states Build C does not close until AC-29 is met.

---

## 2. Commit window

Window boundary confirmed by inspection, not assumption:

- `1a78578`'s parent is `ab954ae` (Contract 39 base) → Contract 40 begins exactly at `1a78578`.
- `2ed1bdf`'s parent is `1409a8c` → the G..Q window ends exactly at `1409a8c`.
- **The arcs do not interleave.** CC-40-A..F landed 2026-07-28 morning (10:08–11:19); G..Q ran 2026-07-28 afternoon through 2026-07-29 evening. Clean separation.

All commits `ab954ae..2ed1bdf`, oldest first:

| # | Hash | Date (EDT) | Subject | Arc |
|---|---|---|---|---|
| 1 | `1a78578` | 07-28 10:08 | Contract 40 WS1+WS2: skip-note pass-through (D-489/D-596, Rule 45) + sizing IDK (D-598, migration 092) | **A..F** |
| 2 | `2df9e3b` | 07-28 10:20 | Contract 40 WS3+WS4: conditions visibility (D-590) + Gate Wait Chip (D-587) | **A..F** |
| 3 | `db77ea6` | 07-28 10:23 | Contract 40 WS7: Not-met lessons flag (D-589) | **A..F** |
| 4 | `1685f72` | 07-28 11:17 | Contract 40 WS5+WS6: RACI glyphs (D-599) + My Initiative Status attention (D-588) | **A..F** |
| 5 | `7d12dd7` | 07-28 11:19 | Contract 40: tool inventory (D-572), changelog (S-035), CodeClose | **A..F** |
| 6 | `5b62e56` | 07-28 13:27 | Hotfix migration 093: drop NOT NULL on retired tier_classification | *unlettered* |
| 7 | `11e999f` | 07-28 13:40 | Contract 40 follow-on (CC-40-G): My Role (RACI) dashboard filter | **G** |
| 8 | `a51e458` | 07-28 14:04 | Delight: celebration spray button on Recently Approved Gates | *unlettered* |
| 9 | `dddac34` | 07-28 14:22 | Hotfix: sizing edit fails on answered_by_user_id NOT NULL (upsert INSERT trap) | *unlettered* |
| 10 | `9257e22` | 07-28 18:33 | CC-40-H: Initiative list hides COMPLETE by default + Include complete toggle | **H** |
| 11 | `037185c` | 07-28 19:08 | CC-40-I: stage advance — EPO floor replaces workstream-presence requirement | **I** |
| 12 | `6e2dc11` | 07-28 19:25 | CC-40-J: drop post-approval artifact reminder (keep WIP alert) | **J** |
| 13 | `f50442c` | 07-29 18:11 | CC-40-K: custom Sprint picker — past sprints lighter + Older Sprints expander | **K** |
| 14 | `3b916e6` | 07-29 18:28 | CC-40-L: unify next-gate resolution on gate-records approval | **L** |
| 15 | `7743976` | 07-29 18:57 | CC-40-M: Status History — Accomplishment View toggle | **M** |
| 16 | `76d3781` | 07-29 20:01 | CC-40-N: Identity reorg + DL sets Level & Approver | **N** |
| 17 | `df4735a` | 07-29 20:50 | CC-40-O/P (server): approver reassignment re-routes in-flight gates + DL scope | **O + P** |
| 18 | `4e41fc1` | 07-29 20:59 | CC-40-Q (Angular stage 1): All Pending Gates filters + reassign + shared dialog | **Q** |
| 19 | `1409a8c` | 07-29 21:14 | CC-40-Q (Angular stages 4-5): Initiative-grid approver filter/column/reassign + My Actions reassign | **Q** |

`2ed1bdf` (CC-40-M2) excluded per instruction — it opens the File 2 arc.

**Note on File 1's own claim:** File 1 (CC-40-A..F) described its build as four commits. There are five (`1a78578`, `2df9e3b`, `db77ea6`, `1685f72`, plus the `7d12dd7` CodeClose/changelog commit) — consistent if the fifth was not counted as a build commit. Migration 092 is in `1a78578` (WS2), as File 1 states.

---

## 3. Reconstructed CC-decisions

Every entry below cites a commit whose message explicitly carries the CC-letter. Rationale is quoted/paraphrased from the commit body, so "Why" is **recovered evidence, not inference**, for all eleven.

### CC-40-G — My Role (RACI) filter on the Initiative grid
- **Evidence:** `11e999f`; `angular/src/app/features/delivery/dashboard/delivery-cycle-dashboard.component.ts`. Subject names CC-40-G.
- **What was built:** New "My Role" filter-panel facet on the Initiatives grid — multi-select R/A/C/I with OR semantics, mirroring the WS5 glyphs. Client-side over the already-loaded `raciByCycle` map (no server change). Active chip; persists per-screen (D-171); re-applies once RACI data lands.
- **Why:** Commit body: all four letters kept deliberately — "R overlaps Assigned Person=Me by design, per Phil."
- **Confidence:** HIGH

### CC-40-H — Initiative list hides COMPLETE by default
- **Evidence:** `9257e22`; same dashboard component.
- **What was built:** Initiative list now default-hides COMPLETE (previously hid only CANCELLED); adds an "Include complete Initiatives" reveal in the Filters panel mirroring Include cancelled — off by default, applies immediately, never persists.
- **Why:** Commit body records a verification finding: the status dashboard already excluded COMPLETE/CANCELLED server-side (`get_initiative_status_dashboard`, `get_my_status_due`) — "confirmed, no change"; the list was the inconsistent surface. Active count already excluded terminal stages — unchanged.
- **Confidence:** HIGH

### CC-40-I — Stage advance: EPO floor replaces workstream-presence requirement
- **Evidence:** `037185c`; `mcp/delivery-cycle-mcp/src/tools/advance_cycle_stage.js` + `tests/contract40-advance-epo.test.js`.
- **What was built:** `advance_cycle_stage` no longer hard-requires an assigned Workstream; the active-status check runs only when a Workstream is assigned (ARCH-23 retained). An assigned EPO is now required to enter BUILD or any later stage; pre-Build advances need no EPO. D-140 message names the block and the fix.
- **Why:** Commit body: the old requirement meant any "Workstream: Not set" initiative could never advance, which "contradicted D-165 / Contract 19 Part 3b, which `submit_gate_for_approval` already honours." EPO floor mirrors the D-390 EPO-at-Go-to-Build floor. Attributed to "Phil 2026-07-28."
- **Governance note:** Code itself flagged this — "Governance-rule change — wants a D-number at Design (touches ARCH-12/D-165/D-390)." Tests 491/491 at the time.
- **Confidence:** HIGH

### CC-40-J — Drop the post-approval artifact reminder (keep WIP alert)
- **Evidence:** `6e2dc11`; `angular/src/app/features/delivery/gate-record-modal/gate-record-modal.component.ts`.
- **What was built:** Approval now closes and refreshes immediately when the only warning is artifact suggestions. The EPO WIP alert (D-400) still holds for acknowledgement. Server response unchanged — suggestions still returned and still surfaced at submit time.
- **Why:** Commit body: the post-approval Acknowledge interstitial (D-437) "held the modal after an already-recorded approval to nudge 'typically attached' artifacts (D-438) — pure ceremony on a non-blocking reminder."
- **Confidence:** HIGH

### CC-40-K — Custom Sprint picker (past sprints lighter + Older Sprints expander)
- **Evidence:** `f50442c`; new `angular/src/app/shared/components/sprint-select/sprint-select.component.ts` + `delivery-cycle-detail.component.ts`.
- **What was built:** Replaces the native `<select>` in the milestone date-rule Sprint mode with a reusable `SprintSelectComponent`. Past sprints (end_date < today) render lighter; current/future normal; older sprints tuck under "Older Sprints…". Anchoring rule: a past selection shows itself + everything after (older-than-selection behind the expander); otherwise anchors at the current sprint with all past behind the expander. Angular-only.
- **Why:** Commit body: "native options can't be coloured or collapsed."
- **Confidence:** HIGH

### CC-40-L — Unify next-gate resolution on gate-records approval
- **Evidence:** `3b916e6`; `mcp/delivery-cycle-mcp/src/lib/gate-resolution.js`, `lib/needs-review.js`, `tools/get_initiative_status_dashboard.js`, `tests/contract40-gate-resolution.test.js`, `tests/contract32-status.test.js`.
- **What was built:** `resolveNextGate` now resolves from gate records (`approved|skipped` = cleared) — the governance truth — instead of milestone `date_status`; milestone still supplies `target_date`. Callers (status dashboard, needs-review) pass gate rows. Legacy milestone fallback retained when no gate records are supplied.
- **Why:** Commit body documents the concrete defect: the dashboard GATE column derived the next gate from milestone `date_status` while the list headline and Gate Wait Chip used gate-records approval status. When a milestone was marked complete ahead of approval (allowed under D-205) the two disagreed — "MIU Tableau showed 'Awaiting Brief Review approval' on the list but 'Go to Build' on the dashboard."
- **Governance note:** Code flagged it — "Touches Contract 36 resolver (D-419/CC-017) — wants a D-number at Design." Tests 496/496.
- **Confidence:** HIGH

### CC-40-M — Status History: Accomplishment View toggle
- **Evidence:** `7743976`; `angular/src/app/features/delivery/status-panel/initiative-status-history-panel.component.ts`.
- **What was built:** New "Status View" / "Accomplishment View" toggle in the Status History panel. Accomplishment View is a reverse-chronological list of date + bold accomplishment text only; consecutive identical accomplishment texts collapse to their **original (earliest)** report. Client-only; Status View unchanged and remains default.
- **Why:** Commit body on the collapse-to-earliest rule: "later repeats are usually edits elsewhere in the update."
- **Confidence:** HIGH
- **⚠ Naming:** This is CC-40-**M**. It has no relationship to File 2's CC-40-**M2** (home card sizing). See §4.

### CC-40-N — Identity reorg + DL sets Level & Approver
- **Evidence:** `76d3781`; `delivery-cycle-detail.component.ts`, `core/services/delivery.service.ts`, `core/types/database.ts`, `mcp/delivery-cycle-mcp/src/tools/get_delivery_cycle.js`.
- **What was built:** Identity zone restructured — slim top row (Division/Workstream/Jira/AI), then two aligned columns: trio (DCS/DOL/EPO) stacked left; Approver + Level side-by-side right; Consulted/Informed stacked below. Values bold. Governance Level chip always renders (unsized → "Not sized"; previously hidden). Division Leader / IE / Phil can set the Level (`set_effective_level`, reason required) and the Approver (`set_oversight`; clear → D-557 defaults) inline. `get_delivery_cycle` now returns the oversight approver name + a `caller_can_set_governance` flag.
- **Why:** Commit body frames it as surfacing existing authority: "existing DL-authorized tools surfaced in the UI" — no new permission was created.
- **Governance note:** Code flagged it — "Touches D-561/D-562/D-557 surfacing — wants a D-number at Design." Tests 496/496.
- **Confidence:** HIGH

### CC-40-O — Approver reassignment re-routes in-flight gates
- **Evidence:** `df4735a` (first half); `mcp/delivery-cycle-mcp/src/tools/governance_level.js`, `tests/contract40-reassign.test.js`.
- **What was built:** `set_oversight` now rewrites `approver_user_id` on every `awaiting_approval` gate on the cycle to the new approver immediately — so a reassignment lands in their My Actions queue, leaves the displaced approver's queue, and persists. Trio + displaced approver are notified in-app via a gate-thread post + activity event. Only single-approver L2/L3 gates re-route; L1 trio-consensus gates untouched. `clear_oversight` re-resolves awaiting gates back to the D-557 default.
- **Why:** Commit body: email notification "deferred to future design, per Phil" — in-app only was a deliberate scope decision, not an omission.
- **Confidence:** HIGH

### CC-40-P — Division Leader scope on All Pending Gates
- **Evidence:** `df4735a` (second half); `mcp/delivery-cycle-mcp/src/tools/initiative_executive.js` (`list_all_pending_gates`).
- **What was built:** `list_all_pending_gates` now admits Division Leaders, scoped to their owned division(s). IE / Admin / Phil retain the all-divisions view. Tests 498/498.
- **Why:** Not stated beyond the change itself — the widest-scope-allowed intent is implicit in the scoping design. **Rationale not written down.**
- **Confidence:** HIGH on what was built; rationale MEDIUM (intent inferred from the scoping logic).

### CC-40-Q — Angular reassignment surfaces (two commits)
- **Evidence:** `4e41fc1` (stage 1) and `1409a8c` (stages 4-5). Files: new `shared/components/reassign-approver-dialog/reassign-approver-dialog.component.ts`, `all-pending-gates.component.ts`, `delivery-cycle-dashboard.component.ts`, `actions/actions-list.component.ts`, `actions/my-actions.component.ts`, `shared/components/sidebar/sidebar.component.ts`, `mcp/delivery-cycle-mcp/src/tools/get_my_raci.js`, `core/services/delivery.service.ts`.
- **What was built:**
  - Shared `ReassignApproverDialog` (loads users, calls `setOversight` → CC-40-O reroutes the in-flight gate).
  - **All Pending Gates:** client-side filters (search, Division, Approver, Level, Overdue-only) + count, sortable columns (Initiative/Division/Level/Approver/Days), per-row Reassign action on L2/L3 gates.
  - **Sidebar:** "All Pending Gates" link now shows for IE / Admin / Phil (was IE-only).
  - `get_my_raci` extended to return resolved approver identity (`a_approver_user_id` + `_display_name`), not just a caller-is-approver boolean.
  - **Initiative grid:** Approver filter facet (Any / Me / specific person) + chip; filtering by approver reveals a narrow Approver-initials column with per-row Reassign; dynamic `grid-template` adds the column only when the filter is active.
  - **My Actions:** approver rows gain a Reassign… action → shared dialog → reroute + reload.
  - Also fixed the CC-40-N `clearApprover` call (note now required by `clear_oversight`).
- **Why:** The conditional-column behaviour is attributed "per Phil." Both surfaces route through `set_oversight` (CC-40-O) rather than a bespoke write.
- **Known debt recorded at the time:** "DL-visible link pends an `is_division_leader` profile flag (division-mcp follow-up) — the tool already serves DLs." So CC-40-P's server-side DL scope has **no sidebar entry point for DLs**; a DL can only reach the view by direct URL. Still true at `2ef60ab`.
- **Confidence:** HIGH

**Recoverable count: 11 of 11 letters (G–Q).** No provisional labels needed.

---

## 4. Anchor check

| Anchor | Located? | Finding |
|---|---|---|
| **1.** CC-40-P/Q are, in some order, a dashboard approver filter and an approver initials column | **Partially — with a correction** | Both the dashboard approver filter **and** the initials column are **CC-40-Q** (`1409a8c`). **CC-40-P is something else entirely**: Division-Leader scoping on `list_all_pending_gates` (`df4735a`). File 2's regression note "Dashboard approver filter/initials column (CC-40-P/Q)" is imprecise. Design should record CC-40-P as the DL-scope decision. |
| **2.** CC-40-M2 implies a CC-40-M it superseded or corrected | **NO — anchor fails** | CC-40-M (`7743976`) is the **Status History Accomplishment View toggle** — no relation to card sizing. There is no earlier home-card-sizing decision anywhere in the window. `CC-40-M2` is a **label collision**: a new, unrelated decision that reused the letter M with a "2" suffix. It supersedes nothing. Design should renumber it (e.g. to the next free letter) rather than treat it as a revision of M. |
| **3.** Something in G..Q added the inline Reassign affordance and `ReassignApproverDialogComponent` | **YES** | `4e41fc1` (CC-40-Q stage 1) created `reassign-approver-dialog.component.ts` and the All Pending Gates per-row Reassign; `1409a8c` (CC-40-Q stages 4-5) added the Initiative-grid and My Actions Reassign actions. File 2's CC-40-T removed all three call sites and deleted the dialog — so **CC-40-Q was reversed by CC-40-T roughly 24 hours later.** |

**Design should note the CC-40-Q → CC-40-T reversal explicitly.** A decision built on 07-29 at 20:59–21:14 was substantially undone on 07-29/30 by CC-40-T. Ratifying CC-40-Q as live behaviour would be wrong: only the *filters, sortable columns, sidebar widening, and `get_my_raci` approver identity* survive. The Reassign affordance and the dialog do not.

---

## 5. Commits with undetermined purpose

No commit in the window has an undeterminable purpose. Three, however, **carry no CC-letter** and appear in no CodeClose — they are live and unrecorded:

| Hash | Change | Assessment |
|---|---|---|
| `5b62e56` | **Migration 093** — drop NOT NULL on retired `tier_classification` | Hotfix. Contract 39 (D-583) retired tier and stopped writing the column, but migration 091 only annotated it; the NOT NULL from migration 017 survived and broke initiative creation. **This is a schema change with no CodeClose entry.** Design may want a D-number or at least a registry note. |
| `dddac34` | Hotfix: sizing edit fails on `answered_by_user_id` NOT NULL (upsert INSERT trap) | Hotfix to `initiative_sizing.js` + `tests/contract40-sizing-idk.test.js`. Repairs a defect in CC-40-A..F's WS2 (migration 092 sizing IDK). Belongs to the A..F arc's aftermath; unrecorded in File 1. |
| `a51e458` | **Celebration spray** on Recently Approved Gates | A Phil-requested feature, not a hotfix: a 🎉 button firing a full-screen one-shot spray (~40 copies of a randomly chosen heart / TRIARQ Q / Easter-egg image), reusable `CelebrationSpray` overlay, `pointer-events:none`, honours `prefers-reduced-motion`. Presentation only, no data. **A live user-facing feature with no CC-decision and no changelog entry** (S-035 exposure). |

---

## 6. Build C §12 rolling acceptance-criteria check (Rule 34)

Source: `docs/build-c-spec.md` §12 (lines 735–780) — the real Build C ACs, 31 items. File 1's table labelled "Rolling Build C §12" enumerated Contract 40's own 32 ACs instead; that mislabel is confirmed. This is the actual check.

**Read-only: nothing below was built, fixed, or merged.**

| AC | Status | Evidence |
|---|---|---|
| 1 | BUILT | `features/delivery/create-panel/delivery-cycle-create-panel.component.ts`; `tools/create_delivery_cycle.js` |
| 2 | BUILT | Workstream optional (migration `024`); D-140 block in `submit_gate_for_approval.js`, `shared/components/blocked-action/` |
| 3 | **PARTIAL (evolved)** | Headers persist, but the set is **6 columns, not 11** — retooled by Contract 4 (D-264/D-265/D-267). `delivery-cycle-dashboard.component.ts` |
| 4 | **NOT BUILT (retired by design)** | Tier dot removed (D-264), tier chip removed (CC-38-25), tier fully retired by **D-583** (Contract 39). AC is obsolete, not failed. |
| 5 | BUILT | `tools/advance_cycle_stage.js`, `lib/lifecycle.js`, migration `019` |
| 6 | BUILT | `workstream_active_at_clearance` written in `submit_gate_for_approval.js` |
| 7 | BUILT | `shared/components/milestone-status-selector/`; `set_milestone_target_date.js`, `set_milestone_actual_date.js`, `update_milestone_status.js` |
| 8 | **PARTIAL** | `set_outcome_statement.js` exists and null-state guidance renders, but the **amber warning and inline edit were deliberately removed** (D-276 "No amber box"; edit moved to Edit Initiative panel per D-296). Not as-written. |
| 9 | BUILT | `features/delivery/stage-track/stage-track.component.ts` (full + condensed); gate node click → `gate-record-modal.component.ts` |
| 10 | BUILT | `features/delivery/hub/delivery-hub.component.ts` (four cards, async headline strips, D-396) |
| 11 | BUILT (evolved) | Six drill-in filters + active chips in dashboard; effectively **5 live** since the tier filter retired (D-583) |
| 12 | BUILT | `core/services/screen-state.service.ts` — key `delivery.cycles`, 7-day window (D-171) |
| 13 | BUILT | Header counts incl. tappable Overdue → `onOverdueGatesTap()` |
| 14 | BUILT | `features/delivery/gates-summary/gates-summary.component.ts` |
| 15 | BUILT | `features/delivery/deploy-schedule/deploy-schedule.component.ts` (prior-quarter miss detection) |
| 16 | BUILT | Role-scoped actions in `gate-record-modal.component.ts` (`callerCanSubmitGates`) |
| 17 | BUILT | D-183 two-step confirmation naming the advanced stage — `gate-record-modal.component.ts` |
| 18 | BUILT | `EpoWipWarning` in gate modal; `get_epo_wip_limits.js`, migration `035` |
| 19 | BUILT | 5-gate sequence in `lib/lifecycle.js` / `helpers/gates.js` (tier gate config `026` now moot post-D-583) |
| 20 | **PARTIAL** | 26 seed slots exist (migration `021`) with stage groupings, but the **dimmed future-slot / "Available when reaches [STAGE]" behaviour was removed by D-418** ("no future-gate gating"). Not as-written. |
| 21 | **NOT FOUND** | `malware_scan_status` / `malware_scan_at` exist in `core/types/database.ts`, but **no scan-spinner / Clean-badge / rejected-error UI** in any delivery component. Artifacts are external-URL pointers, not file uploads — the AC may be obsolete against the as-built artifact model, but that is a Design call, not mine. |
| 22 | BUILT (stub) | "→ OI Library" button + `promoteStubMessage` in detail; `promote_artifact_to_oi_library.js` returns `stub_message` |
| 23 | BUILT | Jira panel in detail; `link_jira_epic.js`, `sync_jira_epic.js`, migration `023` |
| 24 | BUILT (expanded) | `features/admin/admin-hub.component.ts`; single sidebar Admin link (D-164). **Card count now exceeds three** — Users, Divisions, Workstreams + more. |
| 25 | BUILT | `features/delivery/workstream-admin/workstream-admin.component.ts`; `update_workstream_active_status.js`; migrations `015`/`027` |
| 26 | BUILT | `features/home/components/my-delivery-cycles-card.component.ts` |
| 27 | BUILT | Server-side scope (`helpers/phil.js`, JWT middleware); CE action suppression via role flags (`core/constants/roles.ts`, migration `033`) |
| 28 | BUILT | `screen-state.service.ts` + `core/utils/sort-state.ts`; `upsert_user_screen_state.js` / `get_user_screen_state.js`, migration `032` |
| **29** | **NOT BUILT** | **See below.** |
| 30 | BUILT | `mcp/delivery-cycle-mcp/src/middleware/jwt.js` returns 401 on any auth failure, no exceptions (D-93, D-144) |
| 31 | BUILT (with expected exception) | Only direct Supabase use in Angular is `core/services/auth.service.ts` (auth SDK — getSession/OTP/signOut, not data queries). No other `createClient`/`@supabase` import in any component or service. Note: the spec's carve-out (AppComponent reading `system_config.maintenance_mode`) **does not exist**, because AC-29 isn't built. |

**Tally:** 22 BUILT · 3 PARTIAL (AC-3, AC-8, AC-20) · 1 NOT FOUND (AC-21) · 1 obsolete-by-design (AC-4, D-583) · **1 NOT BUILT (AC-29)**.

### AC-29 — Maintenance mode — NOT BUILT (confirmed, and worse than a gap)

Verified absent from the main tree at `2ef60ab`:
- No `MaintenanceScreenComponent` anywhere under `angular/src/app`.
- No `set_maintenance_mode` / `get_maintenance_mode` in `mcp/division-mcp/src/tools/`.
- No `system_config.maintenance_mode` migration (`053_system_config_status_refresh.sql` is status-refresh only, unrelated).
- No `system_config` read in Angular at all — so the Arch-1 authorized exception in `CLAUDE.md` ("`system_config` — pre-auth maintenance mode read (D-MaintenanceMode)") currently describes code that does not exist.

**A complete implementation exists on disk but is committed to no ref.** `.claude/worktrees/youthful-khorana/` contains `angular/src/app/features/maintenance/maintenance-screen.component.ts`, `mcp/division-mcp/src/tools/set_maintenance_mode.js`, `get_maintenance_mode.js`, `db/migrations/027_system_config.sql`, and app bootstrap interception. But:
- `git log --all --diff-filter=A -- "**/maintenance-screen.component.ts"` returns **nothing** — the file was never committed on any reachable ref.
- `git worktree list` shows **only the main tree** — that directory is not a registered worktree.

So this is untracked work sitting in an unregistered directory: **not deployed, not committed, and one `rm -rf` or clean-up script away from being lost.** I did not touch it.

**Consequence for Design:** `build-c-spec.md` §12 line 780 states — "Build C does not close and Build B does not open until criterion 29 (maintenance mode) is met." By that gate, **Build C is not closed**, and every deployment since has run without a maintenance-mode window (including the migration-bearing deploys in Contract 40). Rule 29(8) instructs deployments to begin with "maintenance mode on"; that step has not been executable.

---

## 7. Observations (found, not touched)

1. **AC-29 maintenance work is uncommitted and at risk.** See §6. Highest-value item here: it is real work, it is the Build C close gate, and it exists only as untracked files. Recommend someone recover it to a branch before any repo hygiene runs.

2. **`c271915` is almost certainly NOT live on delivery-cycle-mcp.** Evidence: the Render dashboard showed the service **Live on `aace5f9`** (deployed 2026-07-29 22:29 EDT, manual trigger). `c271915` lands *after* `aace5f9` and `80e8d6a` in sequence, so that deploy predates the fix. Corroborating: the approver picker was still failing with `column delivery_cycles.id does not exist` after that deploy — the exact defect `c271915` fixes. No evidence of any redeploy after `c271915` was pushed. **Cannot be verified externally:** `delivery-cycle-mcp` mounts `validateJwt` before `/health` and `/tools` (`mcp/delivery-cycle-mcp/src/index.js:314` vs `:364`/`:369`), so unauthenticated `curl` returns an auth error regardless of what shipped. Verification requires the Render dashboard or an in-app call. **Live consequence: the scoped approver picker (File 2's CC-40-S) is broken in production until that redeploy happens.**

3. **Migration applied-state is not determinable from the repo.** There is no migration ledger table or applied-marker convention in `db/migrations/` — the repo only proves a migration *file* exists. All of `090`–`094` are present as files. Indirect evidence, offered as evidence and not as repo fact:
   - **092 (sizing IDK):** reported complete by Phil in session on 2026-07-28.
   - **093 (tier NOT NULL):** initiative creation subsequently worked, which the NOT NULL would have blocked → almost certainly applied.
   - **094 (division_approvers):** a Division Management screenshot showed "APPROVERS (2)" with two saved rows, which requires the table to exist → **applied**, despite File 2 listing it as an open item. File 2's open-items list is stale on this point.

4. **CC-40-Q was largely reversed by CC-40-T within ~24 hours** (§4). Design is ratifying a decision whose principal affordance no longer exists.

5. **CC-40-P has no UI entry point.** The server admits Division Leaders to `list_all_pending_gates`, but the sidebar link is gated on `is_initiative_executive` / `is_admin` / `is_super_admin`. A DL can only reach the view by typing the URL. Recorded as known debt in `4e41fc1` ("pends an `is_division_leader` profile flag"); still open at `2ef60ab`.

6. **Three unlettered live changes** (§5), one of them a schema migration (`093`) and one a user-facing feature (celebration spray) with no changelog entry — an S-035 exposure.

7. **File 2 contains the factual error that caused this session:** it states CC-40-G..Q "were recorded in the prior Contract 40 CodeClose (2026-07-28)." They were not. File 1 covers A..F only.

8. **`CLAUDE.md` Arch-1 exception list is stale** — it names the `system_config` pre-auth maintenance read as an authorized exception, but no such code exists (§6). It also lists `user_screen_state` as "pending MCP migration in Contract 17 (D-380)"; that migration appears complete (`upsert_user_screen_state.js` / `get_user_screen_state.js` exist), so that exception should be closed per its own terms.

9. Repo working tree is dirty with pre-existing untracked CodeClose files and one modified file (`OITrust-CodeClose-Contract23-2026-06-12.md`, `angular/tsconfig.federation.json`, `.claude/settings.local.json`, plus many untracked build logs and session outputs). Unrelated to this session; not touched.

---

## 8. What Design still cannot know

Being explicit, because the reconstruction came out stronger than expected and that could mislead.

**Recovered with genuine rationale (ratifiable with reasoning):** G, H, I, J, K, L, M, N, O, Q. For these, Code wrote the *why* into the commit body at the time — the defect being fixed, the contradiction being resolved, or the Phil instruction being followed. These are not diff inferences.

**Recovered as behaviour, thin on rationale:** **CC-40-P.** The DL-scoping change is unambiguous in the diff, but no commit text states *why* Division Leaders were admitted or why scope was drawn at owned divisions rather than the ancestor chain (note: `isLeadershipForCycle` elsewhere walks ancestors — CC-40-P does not, and nothing explains the divergence). Ratify as a factual description; do not attribute intent.

**Genuinely unrecoverable:**

1. **Alternatives considered and rejected.** No commit records what was weighed. For CC-40-I (EPO floor) and CC-40-L (resolver unification) — both governance-touching — Design cannot know whether other options were on the table. `balance_points` cannot be reconstructed for any of the eleven.
2. **Whether Phil approved each decision or Code took it under Rule 30.** Several commits cite "per Phil" (G, I, Q's conditional column, O's email deferral), which implies live direction. The rest are silent. The distinction matters for ratification and is not in the repo.
3. **First Principles application (Rule 1).** No commit records a Context → Question → Reduce → Simplify → Automate pass. CC-40-K introduced a new shared component and CC-40-Q a new shared dialog — both Rule 1 triggers. Whether the discipline was applied is unknowable.
4. **Why the letters ran G..Q at all.** Whether every letter was assigned deliberately, and whether the numbering was ever coherent, is unrecoverable. The CC-40-M / CC-40-M2 collision (§4) is evidence that at least one letter was assigned loosely — which means Design should treat the letter sequence as a recovered artifact, not an authority.
5. **What was *not* built.** A diff shows what shipped. If a decision in this window was to *defer* something, and nothing was committed, no trace survives. CC-40-O's email deferral survived only because Code happened to write it down.
6. **UAT outcome.** No record shows whether Phil UAT'd any of G..Q. File 2's checklist covers the follow-on arc only.

**One recommendation, offered and not acted on:** the root cause is that CC-decisions lived only in commit messages and a per-contract CodeClose, with no running ledger. `cc-decisions-active.md` exists and contains no CC-40 entries at all. If it were appended per decision rather than per contract, this session would have been unnecessary.

---

**Nothing in the repo was modified except this file. No commit, no push, no deploy, no migration.**

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-07-30
