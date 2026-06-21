# CodeClose — Contract 30

**Contract:** 30 — My Actions Screen, Gate Return Fix, Initiative Grid Improvements, Division Leader Assignment
**Date:** 2026-06-21
**Governing decisions:** D-469, D-470, D-471, D-472 (+ D-149, D-181, D-183, D-187, D-199, D-200, D-203, D-252, D-280, D-345, D-346, D-468, S-005, S-012, S-013, S-018, S-019, S-036)
**Build result:** `npm run build` succeeded; `version.json` written (build_version `f93e48b`). CSS-budget warnings only (see Structural Health).
**Deployment:** NOT executed this session — staged, pending Phil's go-ahead (see §8).

---

## First Principles (Rule 1)

Applied Context → Question → Reduce → Simplify → Automate before locking the two significant decisions:

- **New My Actions architecture (WS1.3):** Context = a new tabbed surface needing the dashboard's filter pattern. Question = reuse vs. fork. Reduce = no shared filter-panel component exists; the pattern is inline in the 2,141-line dashboard. Simplify = replicate the S-011/S-012/S-013 pattern locally in the new tab components, fetch once in the container and split by `item_type`, filter/sort client-side over the loaded set. Automate = flagged a shared `FilterPanelComponent` extraction as a next-contract candidate. **Locked with Phil (this session).**
- **Returned-diamond surface set (WS2.2):** Reduced to the minimum that makes the diamond render — the existing `skipped` hollow-Oravive treatment is reused rather than inventing new visual logic.

---

## MODIFICATION vs. NEW (D-252) — as built

| Surface | Class | Outcome |
|---|---|---|
| Sidebar nav | MOD | Added "My Actions" item + pending badge |
| Home Action Queue card | MOD | Top-7, Consulted indicator, "View all →" |
| MyActionsComponent + `/actions` | NEW | Built |
| GateApprovalsTab / GateReviewsTab | NEW | Built |
| ConsultedStatusIndicatorComponent | NEW (shared) | Built |
| `record_gate_decision` | MOD | No change needed (already conformant) + regression test |
| StageTrackComponent | MOD | `returned` hollow-Oravive |
| Gate sub-panel (gate-record-modal) | MOD | Re-submit hides prior return notes |
| Initiative grid (dashboard) | MOD | Subtitle, short Division name, conditional Workstream chip |
| Division Management panel | MOD | Division Leader field |
| `list_pending_approvals` | MOD | `consulted_summary`, `created_at`, `gate_target_date` |
| `list_divisions` / `get_division` | MOD | `owner_display_name` |
| `update_division` | MOD | server-side super-admin gate on `owner_user_id` |

---

## CC-Decisions (Rule 3, Rule 17 — sequential, no gaps)

- **CC-30-01** — Team-column Workstream display. *Built:* Workstream chip removed from the Initiative grid Team column, then made conditional — shown only while a Workstream filter is active; empty-state guard updated. *Spec:* WS3.3 said "hide an existing sub-row." *Why deviation:* No Workstream sub-row ever existed (workstream was in the Team column); Phil's clarification this session set the conditional rule. Supersedes **D-265 / CC-Decision-2026-04-10-C**. (Phil direction)
- **CC-30-02** — WS2.1 premise mismatch. *Built:* `record_gate_decision` return path verified to leave `current_lifecycle_stage` untouched (no code change needed) + added a regression test locking it. *Spec:* described a stage-regression bug on return. *Why:* the bug is not present in the current code (return path returns before any stage write; no DB trigger regresses it) — the conformance test already passes. Treated as verify + protect.
- **CC-30-03** — WS2.2 scope expansion. *Built:* `returned` added to `GateDisplayState` (database.ts), mapped `returned→returned` in **both** producers (detail `gateStateMap`, dashboard `buildGateStateMap`), and a `returned` case added to StageTrack `gateColor`/`gateBorder`/`gateTitle`. *Spec:* classification table named "StageTrackComponent only." *Why:* the diamond cannot render without the type + producer changes; reuses the existing `skipped` hollow-Oravive treatment.
- **CC-30-04** — WS2.3 return-notes handling. *Built:* the Review Notes section is display-gated to `returned`/`blocked`, so prior return notes disappear once a gate is re-submitted (status → `awaiting_approval`); notes remain on the gate record for history. *Spec:* "prior notes move to event log only." *Why:* **D-345** forbids copying `approver_notes` into the event log; display-gating satisfies "cleared from active display" without violating D-345.
- **CC-30-05** — WS1.1 premise. *Built:* added a new "My Actions" sidebar item (route `/actions`) with a pending badge. *Spec:* "rename Action Queue; Home → My Actions → Notifications." *Why:* no Action Queue or Notifications nav items existed (Action Queue was a Home card only). Notifications not added — that surface is not built; a dead link would violate D-199/S-026.
- **CC-30-06** — `list_pending_approvals` additions. *Built:* added `created_at` and `gate_target_date` alongside the specced `consulted_summary`. *Why:* the My Actions tabs need `created_at` (21-day filter/ordering) and `gate_target_date` (Due column); same tool, single round-trip.
- **CC-30-07** — My Actions filter pattern. *Built:* S-011/S-012/S-013 pattern replicated locally in each tab; no shared component. Division filter has no "My Divisions" default (the returned data is already personal to the caller). *Why:* no shared `FilterPanelComponent` exists; extraction flagged as a candidate (locked with Phil this session).
- **CC-30-08** — WS1.4 navigation. *Built:* Initiative chip + Approve/Respond navigate to `/initiatives/:id?gate=` (the proven Home-card pattern; detail auto-expands the gate via D-345). *Spec:* `/initiatives/list?cycleId=…&gate=…`. *Why:* the grid reads `selected_cycle_id` (not `cycleId`) and gate-propagation through the embedded panel was unwired; the detail-route pattern already works. (Locked with Phil this session)
- **CC-30-09** — WS3.2 Division short name. *Built:* template-only switch to `cycle.display_name_short` (fallback to full name; full name kept in hover title). *Spec:* anticipated possibly amending `list_delivery_cycles`. *Why:* the tool already returns `display_name_short` — no MCP change. Field is named `display_name_short`, not `division_display_name_short`.
- **CC-30-10** — WS4 MCP. *Built:* `owner_user_id` was already in `update_division` MUTABLE_FIELDS (no change to make it settable); added a **server-side super-admin gate** so only Phil can change `owner_user_id`; added `owner_display_name` to `list_divisions` and `get_division`. *Why:* the spec's "Phil-only field" intent warranted defense-in-depth beyond the UI gate, while non-owner fields stay any-admin ("existing auth pattern").
- **CC-30-11** — WS4 View chip. *Built:* the View-state Division Leader renders as a styled chip but does not navigate to a user detail. *Spec:* "tappable user chip per D-181." *Why:* no user-detail surface is reachable from the admin Divisions panel; full drill-through flagged as a candidate.

---

## Deviations from Spec (Rule 7)

Recorded above as CC-30-01 (Team column), CC-30-02 (WS2.1 premise), CC-30-03 (WS2.2 scope), CC-30-04 (WS2.3 notes), CC-30-05 (WS1.1 premise), CC-30-08 (WS1.4 nav), CC-30-11 (WS4 chip). No unrecorded deviations.

---

## CodeClose Verification Pass (Rule 29)

**(1) Spec coverage — acceptance criteria:**
1. `/actions` loads, Gate Approvals default — **PASS** (route + container, default tab).
2. Sidebar "My Actions" + badge — **PASS** (NAV_ITEMS + actionBadge).
3. Home card max 7 + "View all →" — **PASS** (displayItems top-7, footer link).
4. Consulted indicator amber ○ / red ✕ on card + tabs — **PASS** (home card + indicator component; note: tabs show it on the card/approvals row via summary).
5. Initiative chip → detail with gate auto-expanded — **PASS** (`/initiatives/:id?gate=`).
6. Gate Approvals 21-day default, clearable, memory — **PASS** (default filter + chip + ScreenStateService).
7. Gate Reviews 21-day + post-approval stone label — **PASS** (Status column + stone class).
8. Return leaves `current_lifecycle_stage` unchanged — **PASS** (verified + regression test).
9. Returned diamond Oravive hollow — **PASS** (StageTrack + producers).
10. Re-submit hides prior return notes; fresh item for approver — **PASS** (display-gate + submit re-resolves approver).
11. Grid subtitle text — **PASS**.
12. Division column short name — **PASS**.
13. Workstream sub-row conditional; Team chips always — **PASS** (conditional Workstream chip; EPO/DCS/DOL unaffected).
14. Division Leader View/Edit, Phil set/clear, non-Phil read-only — **PASS** (UI + server gate).
15. Regression items — **PASS** (see §2).

**(2) Regression check:** Build compiles clean. Behaviors confirmed preserved: Home card badge/post-approval/dismiss (untouched logic; display getter added); sidebar other nav items (untouched); `record_gate_decision` approval path (untouched — only return path asserted); StageTrack `awaiting_approval` sunray + `skipped` hollow (regression test asserts both unchanged); dashboard load/filter/right-panel (only Col1/Col2/Col6/subtitle template + producer touched); Division panel View/Edit existing fields (additive only). Verified via build typecheck + MCP test suites + new StageTrack spec.

**(3) Test ratchet (S-031):** logic-touching changes and their protecting tests —
- WS2.2 StageTrack `returned` → `stage-track.component.spec.ts` (NEW).
- WS2.1 return stage-freeze → `record_gate_decision` source-assertion test (NEW).
- WS1.2 `consulted_summary`/`created_at`/`gate_target_date` → `list_pending_approvals` tests (NEW).
- WS1-shared indicator precedence → `consulted-status-indicator.component.spec.ts` (NEW).
- WS4 owner super-admin gate → `update_division` source-assertion test (NEW).
- My Actions tab filter/sort logic — **no unit test added this contract; flagged as a CLAUDE.md candidate** (Karma not run this session — see candidates).

**(4) Pattern sweep:** Shared pattern modified — the `gate_status → GateDisplayState` mapping. Searched both producers (`delivery-cycle-detail.gateStateMap`, `delivery-cycle-dashboard.buildGateStateMap`); both updated for `returned`. Found a pre-existing inconsistency: the dashboard producer maps `skipped` to `upcoming` (detail maps it to `skipped`) — **out of scope (Contract 28 / D-447); flagged as candidate.**

**(5) Standards conformance (CodeClose-applicable):**
- S-030 (Component Design) — new tabs each have a single responsibility; shared helpers factored to `actions-util.ts`; indicator factored to a shared component. **PASS** (line counts in §7).
- S-031 — see (3); **PASS with one flagged gap** (tab unit tests).
- S-032 — not touched.
- S-033 — build pipeline unchanged; `version.json` written. **PASS.**
- S-034 — no person-row layout changes. **N/A.**
- S-035 — About Entry produced + `changelog.ts` updated. **PASS** (see below).
- S-036 — both tabs sort via column headers only, ↕/↑/↓ indicators, no sort in filter panel. **PASS.**

**(6) CC-decision completeness:** CC-30-01 … CC-30-11 — sequential, no gaps.

**(7) Structural health:** see §Structural Health.

**(8) Deployment:** **No migrations this contract** (`owner_user_id` pre-existing; no schema change). `npm run build` succeeded; `version.json` written. The Render (MCP) and GitHub Pages (Angular) deploys were **not executed** — production deploy is outward-facing and awaits Phil's explicit go-ahead. MCP changes (`list_pending_approvals`, `list_divisions`, `get_division`, `update_division`) require a **manual Render redeploy** after push (per project memory). Deployment was not attempted (≠ failed); UAT Checklist below is provided for execution once deployed.

---

## Structural Health (Rule 12)

Files instructed-for-modification, current line counts (threshold: 300 component / 400 service):

| File | Lines | Over? |
|---|---|---|
| delivery-cycle-detail.component.ts | 3,367 | over (pre-existing) |
| delivery-cycle-dashboard.component.ts | 2,141 | over (pre-existing) |
| gate-record-modal.component.ts | 1,302 | over (pre-existing) |
| divisions.component.ts | 1,135 | over (pre-existing) |
| stage-track.component.ts | 412 | over (pre-existing) |
| gate-approvals-tab.component.ts | 325 | over (NEW — exempt from Rule 11; near threshold) |
| gate-reviews-tab.component.ts | 315 | over (NEW — exempt; near threshold) |
| sidebar.component.ts | 194 | ok |
| my-action-queue-card.component.ts | 193 | ok |
| my-actions.component.ts | 114 | ok (NEW) |
| consulted-status-indicator.component.ts | 60 | ok (NEW) |

No refactor mandated (S-030). CSS-budget warnings (>2kB component styles) fired for the two new tabs and ~16 existing components — per **D-371/S-030 these are quality-discipline warnings, not failures**; build succeeded.

---

## Stage Check (S-020)

- **My Actions** (new feature): route + components + MCP exist; happy path works; `devStatus` set to `uat` on the nav item. **Not advancing further without Phil UAT.** Recommend Phil run the UAT checklist below, then confirm advancement.

---

## About Entry — Contract 30 (S-035)

```
## About Entry — Contract 30
Date: 2026-06-21
BuiltAt: (set at deploy)
Items:
- [All] My Actions screen: new sidebar page + badge; Gate Approvals and Gate Reviews tabs, 21-day default filter, sortable.
- [All] Home My Action Queue card: top-7, "View all →", amber ○ / red ✕ consulted marker.
- [All] Initiative grid: new subtitle, short Division name, Workstream chip only when a Workstream filter is active.
- [All] Gate return: hollow orange diamond, stage no longer regresses, re-submit clears prior notes and re-notifies.
- [Admin] Division Management: Division Leader field — Phil-only edit, read-only for others.
```
`changelog.ts` updated (most-recent-first) in the working tree, ready for the deploy commit.

---

## UAT Checklist (Rule 19 / D-357)

**1. My Actions screen**
1. Click "My Actions" in the sidebar → `/actions` loads with the Gate Approvals tab active. PASS/FAIL
2. Sidebar shows a numeric badge equal to your pending actions (excludes post-approval review-welcome items). PASS/FAIL
3. Gate Approvals shows a "Last 21 days" chip; click its × → older items appear. PASS/FAIL
4. Click a column header (e.g. Submitted) → rows sort, arrow toggles asc/desc on second click. PASS/FAIL
5. Open Filters → expand Gate → tick a gate → Apply → only that gate shows; a "Gate: …" chip appears. PASS/FAIL
6. Switch to Gate Reviews → post-approval items read "Approved — review welcome" in grey; Status filter narrows Active/Post-approval/All. PASS/FAIL
7. Tap an Initiative chip or Approve/Respond → the Initiative detail opens with the correct gate expanded. PASS/FAIL

**2. Home — My Action Queue card**
1. Card shows at most 7 rows. PASS/FAIL
2. "View all →" navigates to `/actions`. PASS/FAIL
3. A row with a pending consulted party shows a small amber ○; a declined one shows a red ✕. PASS/FAIL

**3. Gate return**
1. Return a gate as approver → on the Stage Track the gate is a hollow orange diamond. PASS/FAIL
2. The Initiative's stage is unchanged after the return (does not slip back). PASS/FAIL
3. As DCS/EPO, Re-submit → the prior return notes are gone from the panel and the gate is awaiting approval again; the approver sees it in My Actions. PASS/FAIL

**4. Initiative grid**
1. Subtitle reads "Track Initiatives through five governance gates — from Context Brief to achieved Outcome." PASS/FAIL
2. Division column shows the short name. PASS/FAIL
3. With no Workstream filter, the Team column shows no Workstream name; apply a Workstream filter → the Workstream name appears; EPO/DCS/DOL chips always show. PASS/FAIL

**5. Division Management — Division Leader**
1. Open a Division → View shows "Division Leader" (a name chip or "None assigned"). PASS/FAIL
2. As Phil, Edit → Assign/Change opens the user picker; pick a user → Save → View shows the new leader. PASS/FAIL
3. As Phil, Edit → Clear → Save → View shows "None assigned". PASS/FAIL
4. As a non-Phil admin, the field is read-only in Edit ("Only Phil can change the Division Leader"). PASS/FAIL

---

## CLAUDE.md Candidates (Rule 16)

1. **Extract a shared `FilterPanelComponent`** (S-010/S-011/S-012/S-013) used by the Initiative dashboard and the My Actions tabs — the pattern is currently replicated, not shared (CC-30-07).
2. **Pre-existing failing unit tests** (not introduced this contract): `create_delivery_cycle` "missing workstream_id" (delivery-cycle-mcp — stale; workstream is nullable per Contract 19 Part 3b); `validateJwt middleware` and `update_user_email` B-92 (division-mcp). Fix or retire.
3. **My Actions tab unit tests** — filter/sort logic on the two tabs has no Karma spec yet (test ratchet gap; build typecheck only).
4. **decisions-active.md absent from the for-ClaudeCode bundle** and the registry is stale (stops at D-451 while D-458–D-472 are in use) — full decision text was unavailable this session (D-318 expects the registry to travel; consider shipping decisions-active too).
5. **Latent bug:** `record_gate_decision.js` line ~359 tests `decision === 'approve'` (value is `'approved'`), so `suggestion_warnings` never fire on approval. Out of scope; confirm and fix.
6. **Dashboard `buildGateStateMap` maps `skipped`→`upcoming`** (detail maps it to `skipped`) — condensed grid track doesn't show skipped gates as hollow Oravive. Inconsistency from Contract 28; align in a future contract.
7. **WS4 Division Leader View chip is non-navigating** — full D-181 drill-through to user detail is not reachable from the admin Divisions panel (CC-30-11).

---

## Files changed (uncommitted — ready for deploy commit)

Angular: `core/types/database.ts`, `core/services/screen-state.service.ts`, `core/data/changelog.ts`, `app-routing.module.ts`, `shared/components/sidebar/…`, `shared/components/consulted-status-indicator/…` (NEW ×2), `features/home/components/my-action-queue-card.component.ts`, `features/actions/…` (NEW ×4), `features/delivery/stage-track/…` (+ spec NEW), `features/delivery/detail/…`, `features/delivery/dashboard/…`, `features/delivery/gate-record-modal/…`, `features/admin/divisions/divisions.component.ts`.
MCP: `delivery-cycle-mcp/src/tools/list_pending_approvals.js` (+ tests), `delivery-cycle-mcp/tests/tools.test.js`, `division-mcp/src/tools/{list_divisions,get_division,update_division}.js` (+ tests).

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | Contract 30 CodeClose | 2026-06-21*
