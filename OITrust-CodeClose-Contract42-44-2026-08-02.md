# CodeClose — Contracts 42, 43, 44

Pathways OI Trust | 2026-08-02 | CONFIDENTIAL
Commits: `ecdba21` (implementation), `1a8d167` (CC ledger hashes). Both on `origin/master`.
CLAUDE.md v3.8 installed this session. Worktree Hygiene (Rule 31): primary repo, branch `master`, `angular/` + `mcp/` + `db/` present at root — **source-confirmed**, no reset required.

---

## 1. Locked decisions touched (Rule 47 / D-621)

| Identifier | What the work did to it |
|---|---|
| D-635 | **Implements.** `get_maintenance_mode` is an authenticated admin read; no public endpoint added. |
| D-636 | **Implements.** No admin UI for the toggle, in Build C or after. Recorded as an explicit D-310 exception. |
| D-637 | **Implements.** Rule 29(8) is conditional on AC-29; AC-29 now met, and §12 records it. |
| D-MaintenanceMode | **Implements.** The bootstrap interception this decision has specified since Build C now exists. |
| ARCH-34 | **Implements.** Live-vs-migration reconciliation performed; the single orphan closed. |
| ARCH-35 | **Extends.** The Arch-1 `system_config` exception is un-suspended and now names the exact authorised call site. |
| Arch-1 | **Extends.** One new direct Supabase read, under the named exception only. No other Angular Supabase access introduced. |
| Rule 38 | **Implements.** `ENABLE ROW LEVEL SECURITY` added to migration 095. |
| Rule 48 / D-622 | **Implements.** Migration 095 committed to master; nothing executed against any environment. |
| D-623 | **Implements.** `docs/schema-summary.md` produced. |
| D-613 | **Implements.** All Pending Gates Division-Leader scope reworked to `isLeadershipForCycle`. |
| D-577 | **Extends.** The screen's visibility now matches the approval authority this decision granted. |
| CC-40-P (D-613 as built) | **Supersedes.** Owned-divisions scope replaced. Source assertion in `contract40-reassign.test.js` updated, not deleted. |
| CC-41-E | **Preserves.** The `delivery_cycle_id` scope still precedes the division filter. Verified explicitly. |
| D-560, D-601, D-611 | **Untouched.** IE / Admin / super_admin behaviour on All Pending Gates is unchanged. |
| D-345 | **Implements.** Gate returns now notify submitter and trio. This was the missing trigger. |
| D-581 | **Implements.** Return with Set Conditions carries the condition count. Conditions are not auto-cleared (Rule 44 respected). |
| D-557 | **Verifies.** L1 collected-party notification confirmed present; Contract 44's premise that it was absent does not hold. |
| D-646 | **Partially implements.** Immediate-class gaps closed; the nine already-built rows verified rather than rebuilt. |
| D-467 | **Extends.** Same Edge Function, same template, one new `email_type` (`gate_returned`). |
| Rule 40 | **Respected.** Both new queries placed so no FIFO fixture slot shifts. Stated per change. |
| Rule 34 | **Respected.** Every column verified against the live schema before use. |
| Rule 35 | **Respected.** `ng build` run after commit; `version.json` stamps `1a8d167`. |
| Rule 42 | **Respected.** `git log origin/master` confirms both commits pushed before any Render statement. |
| D-379 | **Conflict, unresolved.** Contract 42's DoD requires editing `CLAUDE.src.md`; D-379 locks that file as not-a-Code-target, and it does not exist in this repo. See §10. |
| S-030, S-031, S-035, S-020 | Declared in §5 below. |

---

## 2. CC-decisions

Full reasoning is in `docs/cc-decisions-active.md` (Rule 46 — appended at the point of decision, hashes filled after commit). Summary:

| CC-letter | Title |
|---|---|
| CC-42-A | Both maintenance tools are authenticated admin operations |
| CC-42-B | Bootstrap interception empties the route table; hiding the outlet is not enough |
| CC-42-C | The Arch-1 read is a plain fetch, and it fails open |
| CC-42-D | Migration 095 is committed unexecuted, plus RLS |
| CC-42-E | ARCH-34 answered by enumeration, not inference |
| CC-43-A | Division-Leader scope becomes `isLeadershipForCycle`, resolved once per Division |
| CC-43-B | `owns_division` is derived in the existing profile call, never stored |
| CC-43-C | The CC-40-P source assertion is updated, not deleted |
| CC-44-A | One shared `notifyGateReturned`, closing the silent L2/L3 path |
| CC-44-B | Contract 44's V1 premise does not hold; wording fixed, recipients unchanged |
| CC-44-C | The remaining nine trigger rows were verified, not rebuilt |

---

## 3. Verification gate answers (all six)

| # | Question | Answer |
|---|---|---|
| **V1** | Who does `submit_gate_for_approval` email at L1 today? | The approver slot is empty — `resolution.approver_user_id` is null at L1 by design. **But the trio are not missing.** `deriveConsultedUserIdsV2` pushes the non-null trio into the Consulted set before any C stakes, so every remaining collected party is already addressed. **Contract 44's premise is incorrect.** Only the email copy was wrong. |
| **V2** | Does any return notification exist? | **Partially — and this is a genuine mismatch.** L1 consensus returns fire (`l1_gate_returned`, trio minus returner). **L2/L3 returns fired nothing at all.** Closed this contract. |
| **V3** | Does RLS enforce Division scope at the data layer? | Declared yes (`031:198`, `delivery_cycles_select`), but the app never travels that path — Arch-1 routes reads through MCP on the service key, which bypasses RLS. **D-648 is implementable as written.** |
| **V4** | Does ARCH-23 `date_status` compute `behind` from a passed target date? | **No.** `date_status` is user-set (D-205). The only automatic date signal is D-486 gate-date *slip* — target date **moved**, not **passed**. D-649's three checks stand; nothing to surface instead. |
| **V5** | Is CC-41-H in `docs/cc-decisions-active.md`? | **Yes**, commit `fa32fac`. |
| **V6** | Does `set_oversight` check caller authority per D-561? | **Yes** — `governance_level.js:279-286`, `loadCycleWithLeadershipCheck` → Division Leader or Phil, with a D-140-shaped block message. |

Contract 44's inventory also understates what exists. **Fourteen** `email_type`s are live, not two. Nine of the rows the spec asks to build already ship. Full list in §10 for Design to reconcile.

---

## 4. Deviations from spec (Rule 7)

**Contract 44 — L1 recipient resolution.** Spec: "the notification must address each remaining collected party individually, not a single resolved approver," on the premise the trio are absent. Built: no recipient change. Why it is the right call — the trio are already on the list via the Consulted derivation; adding them again would be dead code absorbed by the helper's dedupe. The real defect in that area was the copy, which is fixed.

**Contract 44 — scope.** Spec's gate says a V-answer mismatch routes back to Design. Phil directed in-session that Contract 44 be fixed here instead. Scope was set to the genuine gaps only, deliberately not the nine already-built rows.

**Contract 42 — migration 095.** Spec: "determine whether it needs executing." Built: determined **no**, and additionally added an RLS statement Rule 38 requires. The RLS line is a change to a rescued file beyond its own flagged change — recorded rather than made silently.

---

## 5. CodeClose Verification (Rule 29 — all nine)

**(1) Spec coverage**

| Criterion | Result |
|---|---|
| C42 — both tools registered and reachable | **PASS** — router map + `/tools` array, `mcp/division-mcp/src/index.js` |
| C42 — admin auth enforced on both | **PASS** — `is_admin` + `is_active` gate on each; error-path tests |
| C42 — bootstrap interception against current `AppComponent` | **PASS** — `APP_INITIALIZER`, pre-navigation |
| C42 — maintenance screen renders, no route resolves, no auth attempted | **PASS by construction** — route table emptied, `ngOnInit` returns early. **Live behaviour is UAT-only** (see §5.3) |
| C42 — four tests pass | **PASS — exceeded.** 8 tests |
| C42 — migration 095 disposition reported | **PASS** — no execution required; §4 and `schema-summary.md` |
| C42 — `schema-summary.md` listing all orphaned objects | **PASS** — one orphan, `system_config` |
| C42 — Arch-1 exception un-suspended | **PASS in CLAUDE.md**; **FAIL in CLAUDE.src.md** — file absent, and D-379 forbids Code editing it. Owed to Design |
| C42 — AC-29 declared met in §12 | **PASS** |
| C43 — parent DL sees child-division gates | **PASS** — test: "a parent Division Leader sees gates on Initiatives in a CHILD Division" |
| C43 — DL sees the sidebar link without a stored flag | **PASS** — `owns_division` derived; no column added |
| C43 — DL passing a foreign cycle id receives nothing | **PASS** — test asserts empty result; filter ordering verified |
| C43 — no change to IE/Admin/super_admin | **PASS** — `isWide` branch untouched; all pre-existing G8 tests unchanged and green |
| C44 — V1 and V2 reported | **PASS** — §3 |
| C44 — gate returns notify submitter and trio | **PASS** — both paths, shared helper, 4 tests |
| C44 — every immediate-class row fires correctly | **PARTIAL** — 2 gaps closed, 9 rows verified as-built, 1 premise corrected. Full inventory in §10 |
| C44 — four loud exceptions verified | **PASS** — `ie_override` (D-560), `governance_level_lowered` (D-562), `approved_over_returned_consultation` (D-569) all present and reason-gated. **`oversight cleared` (D-561): no notification found** — flagged in §10 |
| C44 — no digest, queue table, or manager relation introduced | **PASS** — none |

**(2) Regression check** — surfaces touched: All Pending Gates (MCP + sidebar), gate return, gate submission, `list_users`, `AppComponent`/`AppModule`. Verified by full suite: division-mcp **117/117**, delivery-cycle-mcp **553/553**, both from a 546/109 baseline — no test removed, no assertion weakened. The one assertion changed (`contract40-reassign.test.js`) asserted behaviour D-613 explicitly supersedes; it was rewritten to pin the new scope, not dropped. Angular: `npm run build` exit 0. The `AppComponent` change is additive — the non-maintenance path is byte-identical in behaviour, wrapped in `ng-template`.

**(3) Test ratchet** — every logic-touching change and its protecting test:

| Change | Test |
|---|---|
| `set_maintenance_mode` admin gate + no-row failure | `contract42-maintenance-mode.test.js` × 5 |
| `get_maintenance_mode` admin gate + read failure | same file × 3 |
| DL scope → `isLeadershipForCycle` | `contractG8-executive.test.js` × 2 (behavioural) + `contract40-reassign.test.js` (source) |
| `owns_division` derivation in `list_users` | **NO TEST** — see gap list |
| `notifyGateReturned`, L2/L3 path | `contract44-return-notifications.test.js` × 3 |
| L1 return reaches on-behalf submitter | same file × 1 |
| L1 submission copy + recipient regression pin | same file × 1 |

**D-442 untested-item list — 3 items, explicitly declared:**
1. **`owns_division` in `list_users`** — division-mcp has no `list_users` enrichment test to extend, and the derivation is a set-membership check over one batch query. Low risk, real gap.
2. **Angular bootstrap interception** — no Angular test exists in this repo for `AppModule` providers or `AppComponent` rendering; `ng test` is a known-broken pre-existing surface (Contract 37 note). Verified by construction and reasoning, not by test. **This is the largest untested item in the contract and the reason UAT step 1 matters.**
3. **`MaintenanceModeService` fetch + fail-open** — same reason.

**Phil's acknowledgment of this list is required before CodeClose is complete (D-442). Not yet given.**

**(4) Pattern sweep** — a shared pattern *was* modified: the gate-return notification. Searched every `sendGateNotificationEmail` call site (8 files, 14 `email_type`s). Findings: the return event was the only one with two divergent implementations; it is now one helper. `record_consultation_response.js:221` also emits `l1_gate_returned` for a consultation-triggered L1 return and still uses its own recipient block — **left alone deliberately** (different actor, different context text), but flagged as a next-contract candidate for the same consolidation.

**(5) Standards conformance**

| Standard | Result |
|---|---|
| S-030 Component Design | **PASS** — `MaintenanceScreenComponent` and `MaintenanceModeService` each have one nameable responsibility. `notifyGateReturned` extracts duplicated logic rather than copying it. |
| S-031 Contract Code Quality | **PASS** on pattern sweep and verb+object+context naming (`resolveMaintenanceModeAtBootstrap`, `notifyGateReturned`). **PARTIAL** on test ratchet — 3 declared gaps above. |
| S-032 Entity Deactivation | Not applicable — no entity with Active/Inactive state touched. |
| S-033 Cache-Busting / Version Banner | **PASS** — build pipeline unchanged; `version.json` written, stamps `1a8d167`. |
| S-035 About Panel | **PASS** — About Entry below; `changelog.ts` updated in the deployment commit. |
| S-037 Ellipsis | Not applicable — no new form-opening command. |
| S-038 Panel Actions Visible | Not applicable — no right panel added or modified. |
| S-009 Cancelled Visibility | Not applicable. |
| S-001 Visible Context | **PASS** — the maintenance screen states what is happening and what to do ("Check back shortly"). |

**(6) CC-decision completeness** — CC-42-A…E (5), CC-43-A…C (3), CC-44-A…C (3). Eleven letters, three sequences, **no gaps**. All eleven present in `docs/cc-decisions-active.md` with reasoning and commit hash (Rule 46 pass).

**(7) Structural health** (Rule 12 — files instructed for modification, not previously touched this session)

| File | Lines | Responsibility | Over threshold? |
|---|---|---|---|
| `angular/src/app/app.component.ts` | 185 → 216 | Root shell | No (300) |
| `angular/src/app/app.module.ts` | 49 → 82 | Root module wiring | No |
| `mcp/division-mcp/src/index.js` | 221 → 227 | division-mcp HTTP layer + tool router | No (400) |
| `mcp/division-mcp/src/tools/list_users.js` | 124 → 148 | User listing + enrichment | No |
| `mcp/delivery-cycle-mcp/src/tools/initiative_executive.js` | 268 → 289 | IE role + All Pending Gates | No |
| `mcp/delivery-cycle-mcp/src/tools/record_gate_decision.js` | 1161 → 1237 | Gate decision, all levels | **YES — 3× the 400-line service threshold.** Not a defect introduced here, but the largest structural liability in the codebase. The two return paths living 200 lines apart in this file is precisely what let one of them go silent. Candidate below. |
| `mcp/delivery-cycle-mcp/src/tools/submit_gate_for_approval.js` | 838 → 836 | Gate submission | **YES — 2× threshold.** Candidate below. |

**(8) Deployment** — **UAT checklist NOT withheld, but deployment is INCOMPLETE.** Stated plainly:
- Both commits are **pushed to `origin/master`** (`1a8d167`). Rule 42 confirmation performed.
- Angular is **built** (exit 0, `version.json` = `1a8d167`) but **NOT deployed to GitHub Pages** — the deploy command was declined this session. **The front-end deploy remains outstanding.**
- **Render redeploy of `division-mcp` and `delivery-cycle-mcp` is outstanding** and is Phil's manual step. Both services changed. Render does not auto-deploy on push.
- The build-c-spec §9 maintenance-mode sequence was **not** run, for the reason Contract 42 anticipated: this contract *builds* maintenance mode, so it cannot use it. This is the last deploy that will be non-conformant with Rule 29(8) by necessity rather than omission.
- No migration was executed. 095 requires none.

**(9) Repo cleanliness** — `git status -s mcp/ angular/src/` run before push. **13 untracked files found and added**, including four named in committed `require()` / `import` statements: `set_maintenance_mode.js`, `get_maintenance_mode.js`, `maintenance-mode.service.ts`, `maintenance-screen.component.ts`. Without this step Render would have crashed on "Cannot find module". Post-add status: clean.

---

## 6. Schema summary (Rule 49 / D-623)

`docs/schema-summary.md` — covers `system_config`, `divisions`, `users`, `gate_records`, `delivery_cycles`, each with actual live column names, plus the full ARCH-34 reconciliation. **No table was created, altered, or dropped this session.**

One finding worth carrying to Contract 45: `public.users`' primary key is **`id`**, not `user_id`. The Contract 45 spec specifies `manager_user_id uuid NULL REFERENCES users(user_id)`, which will fail. It must reference `users(id)`.

---

## 7. UAT Checklist (Rule 19 / D-357)

**Run after the GitHub Pages deploy and the Render redeploy of both services.** Steps 1–3 will not work until then.

### Surface A — Maintenance mode (Contract 42)
*What changed: two new admin tools; the app now checks a flag before it does anything else.*

1. With the flag off (its current state), load the app. It behaves exactly as before — you land on your normal screen, sidebar present. **Pass/fail.**
2. Call `set_maintenance_mode` with `enabled: true` and a message (from a terminal or an authenticated tool call — there is deliberately no screen for this, per D-636). **Pass/fail: returns success.**
3. In a fresh browser tab, load the app. You see the TRIARQ maintenance screen with your message. **No sidebar, no login prompt, no redirect.** **Pass/fail.**
4. While the flag is on, try a deep link — e.g. `/initiatives/all-pending-gates`. You still get the maintenance screen, not a login page. **Pass/fail.**
5. Call `set_maintenance_mode` with `enabled: false`. Reload. Normal app returns. **Pass/fail.**
6. Ask a non-admin colleague to call `get_maintenance_mode`. It is refused with a role message. **Pass/fail.**

### Surface B — All Pending Gates for Division Leaders (Contract 43)
*What changed: Division Leaders can now reach the screen, and see child Divisions.*

7. Sign in as a Division Leader who is **not** an Admin or IE. "All Pending Gates" appears in the sidebar. **Pass/fail.**
8. Open it. You see pending gates for your own Division. **Pass/fail.**
9. If you own a **parent** Division, you also see gates on Initiatives in its child Divisions — the ones you could already approve. **Pass/fail.**
10. Sign in as a user who owns no Division and is not Admin/IE. No sidebar link; if you deep-link the route you get the "your obligations live in My Actions" message. **Pass/fail.**
11. Sign in as Admin or IE. The screen shows everything, exactly as before. **Pass/fail.**

### Surface C — Return notifications (Contract 44)
*What changed: returning a gate now emails people. Most returns previously emailed nobody.*

12. On a **Level 2 or 3** Initiative, return a gate with a reason. The submitter and all three trio members receive an email carrying your reason. **Pass/fail — this is the fix; it previously sent nothing.**
13. Confirm **you** (the returner) did not receive it. **Pass/fail.**
14. Return a gate using **Set Conditions** with two conditions. One email arrives, not two, and it states "2 conditions must be resolved". **Pass/fail.**
15. On a **Level 1** Initiative, return a gate. Trio and submitter are notified, as before. **Pass/fail.**
16. Submit a **Level 1** gate. The email body reads "This gate passes when every collected party approves" rather than naming an approver. **Pass/fail.**

---

## 8. About Entry (S-035)

## About Entry — Contracts 42–44
Date: 2026-08-02
BuiltAt: 20:40 UTC
Items:
- [All] Gate returned notifications: returning a gate now emails the submitter and the trio with the reason and any conditions — most returns previously sent nothing.
- [Trio] All Pending Gates: Division Leaders reach the screen from the sidebar and see gates across every Division they lead, including child Divisions.
- [Admin] Maintenance mode: deployments can show a short "being updated" page; switched from the command line, not from a screen.

---

## 9. Stage check (S-020)

**All Pending Gates** is at `devStatus: 'uat'`. This contract widened its audience to Division Leaders, which is new unvalidated surface — **recommend it stays at `uat`** until steps 7–11 pass. No advancement proposed. No other `devStatus` changed.

---

## 10. Open items for Design

1. **`CLAUDE.src.md` does not exist in this repository, and D-379 forbids Code editing it.** Contract 42's DoD requires the Arch-1 un-suspend there. I made it in `CLAUDE.md` v3.8 (which Phil supplied mid-session). **It will be lost the next time Design regenerates from source unless Design applies the same edit.** The exact replacement text is in commit `ecdba21`.
2. **Contract 44's trigger inventory is stale.** Fourteen `email_type`s ship today: `gate_submission`, `gate_returned` (new), `l1_gate_returned`, `post_approval_decline`, `ie_override`, `approved_over_returned_consultation`, `dl_override_notification`, `approver_override`, `informed_gate_decision`, `close_review_assessment_roster`, `governance_level_lowered`, `consulted_removed`, `cancel_requested`, `cancel_request_declined`, `cycle_cancelled`. Design should reconcile the spec's ten-row table against this before Contract 45 moves everything onto the queue.
3. **The D-561 loud exception has no notification.** "Oversight cleared → the setter, note required" is listed as one of the four never-suppressible messages. `clear_oversight` sends no email. The other three loud exceptions are present. Not fixed here — it is a new trigger, not a gap in one I was closing, and Contract 45 moves this whole class onto the queue anyway.
4. **Contract 45 blockers.** The companion document `manager-awareness-and-digest-design-2026-08-02.md` was not in the zip, though D-571 says it travels with the spec. And `users(user_id)` in the D-638 FK does not exist — the column is `users(id)`.
5. **Contract 45 V-answers are in hand** (§3) — V3 does not block D-648; V4 means D-649's three checks stand unchanged.

---

## 11. CLAUDE.md Candidates (Rule 16)

1. **"A header comment is not an access control."** The rescued `set_maintenance_mode` declared "Admin role only" in its header and enforced nothing. Candidate text: *When a tool's header claims a permission, verify the check exists in the body before trusting it — in rescued, copied, or long-untouched files especially.* Trigger: CC-42-A.
2. **"Hiding the outlet does not suppress routing."** Candidate text: *Suppressing navigation in Angular means emptying the route table before initial navigation. An `*ngIf` on `<router-outlet>` still lets the router match, run guards, and lazy-load — including auth guards.* Trigger: CC-42-B.
3. **`record_gate_decision.js` is 1237 lines, 3× the service threshold, and its two return paths sit 200 lines apart.** That distance is the direct cause of the V2 defect. Candidate text: *Extract the gate-decision paths into per-level modules before adding further behaviour to this file.* Trigger: §5(7). Also `submit_gate_for_approval.js` at 836.
4. **The PostgREST OpenAPI document is a live schema inventory.** `GET /rest/v1/` with the service key returns every exposed table and RPC. Candidate text: *For ARCH-34 reconciliation, diff that document against `db/migrations/` rather than reasoning from which migrations happen to reference a table.* Trigger: CC-42-E — it turned an open-ended worry into a one-line answer.
5. **A spec's stated premise about existing behaviour is a hypothesis, not a fact.** Contract 44 asserted the L1 trio were unnotified; they were not. Candidate text: *Where a spec describes current behaviour as justification, verify it before building against it — and report the mismatch even when the fix is smaller than specified.* Trigger: CC-44-B.

---

## 12. Session close

**Outstanding, in order:**
1. Deploy `angular/dist/pathways-oi-trust/browser/` to `gh-pages` (declined this session — yours).
2. Redeploy **both** MCP services in the Render dashboard. Both changed. Push is confirmed at `1a8d167`.
3. Run the UAT checklist (§7).
4. Acknowledge the D-442 untested-item list (§5.3) — **CodeClose is not complete without this**.
5. No migration to run. 095 needs no execution.

**Session output file:**
`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\OITrust-CodeClose-Contract42-44-2026-08-02.md`

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-08-02*
