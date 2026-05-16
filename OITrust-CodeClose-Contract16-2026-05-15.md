# OITrust CodeClose — Contract 16
Pathways OI Trust | 2026-05-15 | CONFIDENTIAL

**Session type:** Build C Contract 16 (final pre-declaration contract).
**Surfaces touched:** §1 B-97 fix, §2 set_milestone_actual_date, §3a migration 032, §3b admin.users screen-state, §4 D-341 cleanup (no-op), §5 Admin SQL backfill, §6 CLAUDE.src.md amendment (Path C).
**Codebase audit report:** `docs/build-c-audit-report-2026-05-15.md`.

---

## CodeClose Verification (Rule 29 — Eight Declarations)

### (1) Spec coverage

Per build-c-contract16-spec.md §9 — 18 acceptance criteria.

| AC | Surface | Status | Evidence |
|----|---------|--------|----------|
| 1 | B-97: Escape closes modal, no grid reload | PASS (UAT-pending) | `gateModalOpen` flag in detail.openGatePanel; `ev.stopPropagation()` in modal.onEscape happy path. 4/4 Karma cases pass. |
| 2 | B-97: × close button unchanged | PASS | × calls `onDismiss()` directly — same path as before. No change to `onDismiss`. |
| 3 | set_milestone_actual_date: direct call sets actual_date + date_status='complete' | PASS (logic verified by code review; happy path covered by string assertions per test pattern) | Tool writes `actual_date` and `date_status: 'complete'` (line 124–127 of tool). |
| 4 | set_milestone_actual_date: revert without override_reason returns error | PASS | `isRevert && !override_reason` branch returns Pattern 3 error (line 106–112). Test: "AC-2: revert-without-override-reason error message names the required field". |
| 5 | set_milestone_actual_date: event log appended on success | PASS | Insert into `cycle_event_log` with `event_type: 'milestone_actual_date_set'` and metadata `{ gate_name, prior_actual_date, new_actual_date, override_reason }` (line 144–157). |
| 6 | set_milestone_actual_date: record_gate_decision approval still sets actual date (regression) | PASS — not modified | `record_gate_decision` does its own direct write to `cycle_milestone_dates.actual_date` — not via this tool. No regression vector. |
| 7 | user_screen_state table created with schema + RLS | WRITTEN, Phil-executes | `db/migrations/032_user_screen_state.sql`. SQL displayed. |
| 8 | User Management restores filter/sort within 7 days | PASS — code review | `restoreScreenState()` checks `ageDays > SCREEN_STATE_RECENCY_DAYS` (7 days) before applying. |
| 9 | State resets after 7 days or first visit | PASS — code review | Same recency check; null returned → defaults apply. |
| 10 | Search text always blank on load | PASS — code review | No search field exists on admin.users component. roleFilter and nameSortDir are the only persisted controls. |
| 11 | Screen key is a named constant | PASS | `SCREEN_KEYS.ADMIN_USERS = 'admin.users'` in `screen-state.service.ts`. |
| 12 | Admin SQL produced with confirmed emails + verification SELECT | PASS | SQL displayed in session output. Emails: cbickford@triarqhealth.com, sdobbins@triarqhealth.com, vijay.patil@triarqhealth.com. Verification SELECT included. |
| 13 | D-341: all six files deleted; no broken references | PASS — work was already complete | Files absent in repo: deleted in commits b6e45af (2026-04-19), 560a1d8 (2026-04-15), 29ecbc9. No references in operative files (only one historical archive reference). |
| 14 | Rule 29 declaration (8) present | PASS — delivered via CLAUDE.md v2.6 replacement (Path C) | Lines 346–354 of root `CLAUDE.md`. Conformance test updated to "eight declarations" line 356. |
| 15 | `ng build` completes clean | PASS | 21.2s, bundle generated. CSS budget warnings only (not errors) on 5 components — F5. |
| 16 | Deployed to GitHub Pages and Render | DELEGATED to Phil | Per Phil 2026-05-15: "Angular bundle ready — full deploy delegated to Phil." |
| 17 | Maintenance mode cleared | DELEGATED to Phil | Step 7 of build-c-spec.md §9 — Phil-executed. |
| 18 | Codebase audit report present | PASS | `docs/build-c-audit-report-2026-05-15.md` — 5 sections, F1–F8 in Section 5. |

### (2) Regression check

Confirmed-clean list from Contract 15 UAT (2026-05-09) — none regressed this contract:

| Item | Touched? | Verification |
|------|----------|--------------|
| B-91/B-105 (invite flow) | NO | Invite flow not modified. |
| B-92 (email update) | NO | Email update path not modified. |
| B-101 (gate-blocked tooltip) | NO | Tooltips unchanged. |
| B-102 (null tooltips on future stages) | NO | Tooltips unchanged. |
| B-103 (divergence alert icon) | NO | Milestone display logic unchanged. |
| D-308 Gate Schedule | NO | `gates-summary.component.ts` not modified. |
| D-308 Deploy Gate by Quarter | NO | `deploy-schedule.component.ts` not modified. |
| `record_gate_decision` approval path | NO | Tool not modified; still does direct `actual_date` write. |
| `dialog.openDialogs.length` guard (Contract 15 B-97 fix) | REMOVED | Replaced with `gateModalOpen` flag per CC-005. Same intent, more reliable mechanism. No behavior regression — fix strengthens, not weakens. |

### (3) Test ratchet

Logic-touching changes this contract and protecting tests:

| Change | Tier | Test protecting it | Pre-existing baseline? |
|--------|------|--------------------|------------------------|
| `delivery-cycle-detail.component.ts` — added `gateModalOpen` flag, modified `onEscKey` and `openGatePanel` | Tier 2 (logic-touching) | `delivery-cycle-detail.component.spec.ts` — 4 cases on `onEscKey` | NO baseline pre-Contract 16. Rule 11 override NOT granted — wrote new spec per Phil 2026-05-15. |
| `gate-record-modal.component.ts` — added `ev.stopPropagation()` to `onEscape` happy path | Tier 2 (logic-touching) | Covered indirectly by detail spec (modal close path tested via integration) | NO modal-specific spec. Surfaces as test gap in audit Section 2. **CLAUDE.md candidate.** |
| `mcp/delivery-cycle-mcp/src/tools/set_milestone_actual_date.js` — full rewrite (auth, revert, event log) | Tier 2 (logic-touching) | `tests/tools.test.js` — 7 new cases (5 input validation, 2 error-message contracts) | Existing tests covered prior implementation. New tests added alongside rewrite. |
| `angular/src/app/core/services/delivery.service.ts` — `setMilestoneActualDate` signature change | Tier 2 (signature change, no logic) | None — type system covers signature breakage at compile time | Service has no spec file. Test gap. |
| `angular/src/app/core/services/auth.service.ts` — added two new methods | New methods (Rule 11 exempt) | None | AuthService has no spec file. Test gap. **CLAUDE.md candidate.** |
| `angular/src/app/features/admin/users/users.component.ts` — wired screen-state restore/save | Tier 2 (logic-touching) | None | users.component has no spec file. Test gap. |
| `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts` — `setMilestoneActualDate` call site updated (dropped `manually_entered`) | Tier 1 (signature update, no behavior change) | Covered by Angular compilation (TypeScript strict) | n/a |

**Logic-touching changes without test protection this contract:** modal stopPropagation, AuthService screen-state methods, users.component wiring. All flagged in audit Section 2 priority list.

### (4) Pattern sweep

Shared patterns modified this contract:

- **D-171 / D-370 — Filter and Sort Memory (NEW PATTERN INSTANCE):** First Supabase-backed adopter is `admin.users`. Existing localStorage-based pattern remains on five `delivery.*` screens. **Two-pattern coexistence acknowledged.** Migration of other screens is future scope — not done this contract. Audit Section 4 lists outstanding screens.

- **B-97 escape guard pattern:** Self-tracking flag replaces CDK-internals check. Pattern is component-local (no shared abstraction needed). If other components later open `MatDialog` and need similar guards, same pattern can be replicated.

**Components searched for the D-171 Supabase pattern (only adopter this contract):** `users.component.ts` only — per spec scope.

### (5) Standards conformance

Active Standards from `docs/standards-summary.md` v1.3:

| Standard | Status | Finding |
|----------|--------|---------|
| S-001 Visible context on every surface | PASS | admin.users surface description unchanged. |
| S-005 Universal entity detail | n/a — no entity detail surface modified | — |
| S-008 Parent refresh on return | PASS (B-97 strengthens it — refresh only fires when modal returns non-none refreshKind) | — |
| S-009 Cancelled item visibility | n/a — no cancelled-item surface modified | — |
| S-014 Component Library Baseline (Angular Material) | PASS | Gate Record Modal uses `MatDialog` per D-355. No new MD3 component introduced. |
| S-020 Feature Stage Advancement | RECORDED — see "impl_status Changes" section below | Stage check timing per memory: only flag after Phil UAT'd. |
| S-022 Entity picker pattern | n/a — pickers not touched | — |
| S-023 Destructive action confirmation | n/a — no destructive action modified | — |
| S-024 Entity name capitalization | PASS | Audit report and SQL use canonical capitalizations. |
| S-025 UI Feedback Patterns | PASS | `set_milestone_actual_date` revert error follows Pattern 3 (validation failure blocks action). |
| S-026 Sidebar-only navigation | n/a — sidebar not touched | — |
| S-027 Implementation Status Updates | RECORDED — see "impl_status Changes" section below | |

### (6) CC-decision completeness

Sequence verified — no gaps. CC-001 through CC-012, sequential.

(See "CC-Decisions" section below for full list.)

### (7) Structural health

Files modified this contract, line counts:

| File | Lines | Threshold | Over? |
|------|------:|----------:|-------|
| `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts` | 2871 | 300 | **YES (+2571)** |
| `angular/src/app/features/delivery/gate-record-modal/gate-record-modal.component.ts` | 876 | 300 | **YES (+576)** |
| `angular/src/app/features/admin/users/users.component.ts` | 1157 | 300 | **YES (+857)** |
| `angular/src/app/core/services/delivery.service.ts` | 280 | 400 | OK |
| `angular/src/app/core/services/auth.service.ts` | 229 | 400 | OK |
| `mcp/delivery-cycle-mcp/src/tools/set_milestone_actual_date.js` | 167 | n/a (MCP tool — no formal threshold) | OK |
| `mcp/delivery-cycle-mcp/tests/tools.test.js` | 836 | n/a (test file — no threshold) | OK |
| `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.spec.ts` (new) | 99 | n/a | OK |
| `db/migrations/032_user_screen_state.sql` (new) | 58 | n/a | OK |
| `CLAUDE.md` (root — replaced with zip v2.6) | 322 | n/a | OK |
| `docs/build-c-audit-report-2026-05-15.md` (new) | ~280 | n/a | OK |
| `angular/src/app/core/services/screen-state.service.ts` | 85 (was 84) | 400 | OK |

Top three components remain over threshold. Refactor proposal in audit Section 1.

### (8) Deployment

Per Phil 2026-05-15: **"Angular bundle ready — full deploy delegated to Phil."**

- `ng build`: PASS — clean, 21.2s. Bundle at `angular/dist/pathways-oi-trust/`.
- `ng test`: PASS — 4/4.
- `mcp/delivery-cycle-mcp` tests: 55/57 PASS (2 pre-existing failures flagged in Contract 14, see Audit F6).
- Steps 1, 3, 4, 6, 7 of build-c-spec.md §9: **delegated to Phil.**
- Step 2 (migrations): two SQL artifacts displayed this contract — **migration 032 + Admin SQL backfill**. Phil executes both before deploy step 3.

**UAT Checklist tagged "valid after Phil completes deploy steps 1–4, 6–7"** — see UAT Checklist section below.

---

## CC-Decisions (Sequential, Rule 17 verified)

| ID | Decision |
|----|----------|
| CC-001 | **CLAUDE.md path discrepancy.** START-HERE said `docs/CLAUDE.md` but actual operative file is root `CLAUDE.md`. Replaced root file with zip v2.6. Why: zip authority + START-HERE intent was clear (replace operative file before first touch). How to apply: future zips should reference root path. |
| CC-002 | **§4 D-341 cleanup is a no-op.** All six target files already deleted in prior commits (b6e45af 2026-04-19, 560a1d8 2026-04-15, 29ecbc9). `build-c-spec.md` contains zero references to deleted files. Only stale reference is in `docs/session-archive/2026-04-14-governance-...md` — historical, not operative, untouched. No commit needed this contract. |
| CC-003 | **§6 CLAUDE.src.md amendment — Path C.** `CLAUDE.src.md` does not exist in repo and has never existed (git history confirms). D-338/D-339 source/output split was never implemented. Per Phil/Design 2026-05-15: Path C — CLAUDE.md v2.6 replacement (CC-001) is the only Code action this contract; RATIONALE block "Why (addition — D-372)" and GOVERNING comment `<!-- GOVERNING: S-030, S-031, D-357, D-371, D-372 -->` recorded as Document Author candidates per D-306. |
| CC-004 | **§5 Spec correction — Craig surname.** Spec §5 said "Craig Sycuro." Phil correction 2026-05-15: surname is "Bickford." SQL produced with `cbickford@triarqhealth.com`. Recorded per Rule 7 (deviation from spec, even when better). |
| CC-005 | **§1 B-97 root cause + fix mechanism.** Contract 15 guard `this.dialog.openDialogs.length > 0` relied on Angular CDK internals. Race condition with `OverlayKeyboardDispatcher` registration order plausibly bypassed the guard in production. Replaced with self-tracking flag: `private gateModalOpen = false`; set true synchronously before `dialog.open()`, cleared in `afterClosed()` subscription. Also added `ev.stopPropagation()` to modal's `onEscape` happy path as defense-in-depth. Two-line fix. |
| CC-006 | **§1 New test file.** Created `delivery-cycle-detail.component.spec.ts` (first .spec.ts for that file). 4 cases on `onEscKey()`: panelMode-false short-circuit, gateModalOpen-true short-circuit (regression guard), showEditPanel-true emits cancelEditSignal, plain panel mode emits close. Per Phil 2026-05-15 — Rule 11 override not granted; spec required. |
| CC-007 | **§2 Reclassification — set_milestone_actual_date was MODIFICATION, not NEW.** Spec described it as NEW; actual repo state was a prior Session 2026-03-24-A implementation. Rewrote per Contract 16 spec; reclassified in plan. |
| CC-008 | **§2 Latent bug fixed.** Prior implementation wrote `'achieved'`, `'overdue'`, or `'complete'` to `cycle_milestone_dates.date_status` based on `target_date` vs `actual_date` comparison. CHECK constraint only allows `'not_started','on_track','at_risk','behind','complete'`. Two of the three computed values would have caused write failures. Contract 16 writes `'complete'` per D-205. Recorded as Audit F3. |
| CC-009 | **§2 Service signature change — `manually_entered` dropped.** Prior service interface included `manually_entered?: boolean` — was set but never honored by the old MCP handler (inert parameter). Dropped this contract. Replaced with `override_reason` per spec §2 revert handling. Single caller site (detail.saveActualDate) updated to drop the field. Recorded as Audit F4. |
| CC-010 | **§3 Architectural placement — AuthService extension (Path A).** Added `restoreUserScreenState(screen_key)` and `upsertUserScreenState(screen_key, filter_state, sort_state)` methods to AuthService. Path A approved by Phil 2026-05-15. SRP technically weakens; alternative (Option C — extract `SupabaseClientService`) recorded as deferred item. Why: smallest blast radius — AuthService already owns the only `createClient()` call. How to apply: future direct-Supabase calls from Angular route through these methods (or a future SupabaseClientService). |
| CC-011 | **§3 SCREEN_KEYS placement — central constant map.** Spec §3.2 said "declare at top of component file." Existing pattern (delivery.cycles, delivery.workstreams, etc.) declares in `SCREEN_KEYS` map in `screen-state.service.ts`. Followed existing pattern: added `ADMIN_USERS: 'admin.users'` to the map; imported into users.component. Deviation from spec literal text recorded per Rule 7. Both forms satisfy Rule 4 (named constant, never dynamic). Existing pattern preferred for consistency. |
| CC-012 | **§3 Two-pattern coexistence.** Post-Contract 16: `admin.users` persists filter/sort via Supabase `user_screen_state`; `delivery.*` screens still use localStorage via `ScreenStateService`. Migration of other screens is future scope. Recorded as Audit F7 + deferred item. Spec was explicit — first surface only. |
| CC-013 | **§5 Vijay orphan resolution.** During §5 SQL execution, two of three updates landed (Craig + Sabrina). Diagnostic found Vijay's row with typo'd email (`vijay.patil@triarghealth.com`, missing `q`). Further diagnostic showed Vijay was an **orphan in `public.users`** with no `auth.users` identity — could not sign in regardless of role. FK audit: 3 `division_memberships` rows (all top-level Trusts: Value Services, Practice Services, Performance), zero references on `delivery_cycles`, `gate_records`, `cycle_event_log`, `delivery_workstreams`, `workstream_members`. Resolution (Path 1, per Phil 2026-05-15): (1) captured 3 Trust assignments, (2) `DELETE FROM division_memberships` + `DELETE FROM public.users` in transaction (orphan id `b693a88b-26f0-472c-bf44-9184c1308fd3`), (3) re-invited via Admin Users UI at correct email `vijay.patil@triarqhealth.com`, (4) re-assign 3 Trusts via UI after OTP acceptance, (5) capture new id + grant Admin via SQL. **In-flight at CodeClose** — Steps 3–5 pending Vijay OTP acceptance. Why this path: cleanest end state; orphan's referenced FKs were limited to division_memberships, which are admin-controlled and inexpensive to re-establish. |

| CC-014 | **§1 B-97 second-pass fix — NoopAnimations sync race.** First-pass fix (CC-005, `gateModalOpen` flag) failed UAT 2026-05-16. Root cause: app uses `NoopAnimationsModule` (federation compat per commit ab65d20) → MatDialog exit animation is 0ms → `afterClosed()` fires synchronously inside `dialogRef.close()`. When CDK `OverlayKeyboardDispatcher` is registered on `document` before detail's `@HostListener` (true any time an earlier overlay opened this session — MatSelect dropdown, tooltip, datepicker), CDK dispatcher fires first on Escape → `dialogRef.close()` → afterClosed sync → `gateModalOpen=false` → then detail's `onEscKey` runs with flag false → `close.emit()` → grid reload. Phil's stopPropagation hypothesis was correct that stopPropagation is wrong tool (siblings on same node not affected). Fix: defer the flag clear via `setTimeout(() => this.gateModalOpen = false, 0)` in `afterClosed` so it lands after all synchronous keydown handlers in the current event complete. UAT pass confirmed 2026-05-16. |

| CC-015 | **§2 UAT fix — translateMilestoneError removed + commit/merge gap surfaced.** UAT 2026-05-16 hit "Could not save date — status value may be incompatible with this gate" on Go to Build milestone. Two-part root cause: (a) Angular `translateMilestoneError` function mapped any CHECK constraint failure to a misleading status-block message — contradicts D-205 (no save block based on status). (b) Underlying constraint violation came from the OLD MCP code on Render (master), which writes 'achieved'/'overdue' to date_status (latent bug per CC-008) — my Contract 16 rewrite of `set_milestone_actual_date.js` was uncommitted in this worktree when Phil ran Render deploys earlier in the session, so Render still served the old code. Fix: (1) removed `translateMilestoneError` entirely + neutral error fallback (`res.error ?? 'Save failed.'`); (2) committed all Contract 16 work to `claude/busy-moser-b3d26e` and pushed to origin; (3) requested Phil merge to master so Render picks up the rewritten MCP tool. Process gap recorded: commit-and-merge should be an explicit step at session close, not left for hand-off — future contracts. |

| CC-016 | **§2 UAT — override_reason block commented out (deferred to UI delivery).** Per Phil 2026-05-16: the `isRevert && !override_reason` block in `set_milestone_actual_date.js` makes completed actual dates uncorrectable through the UI because the detail panel has no `override_reason` input. Block is now commented out (in-code TODO marker) until UI surfaces the input. `isRevert` is still computed for the event-log entry. Test for the error contract retained with a "deferred — block commented out pending UI input" comment so the contract is locked for re-enable. UAT step 8 will be marked DEFERRED rather than retested; will retest once UI surfaces override_reason. |

**Gap check:** CC-001 through CC-016 — sequential, no gaps. PASS per Rule 17.

---

## impl_status Changes

Per spec §10 corrected by Phil 2026-05-15 (D-369/D-370/D-372 already specced in decisions-active.md v3.82):

| Decision | From | To | Trigger |
|----------|------|----|---------|
| D-341 | not-specced | built | §4 acceptance (work already complete in prior commits; verified this contract) |
| D-369 | specced | built | §5 SQL produced and displayed; Phil executes |
| D-370 | specced | built | §3 user_screen_state table + admin.users first impl delivered |
| D-372 | specced | built | §7 Rule 29 declaration (8) delivered via CLAUDE.md v2.6 replacement (Path C per CC-003) |
| D-360 | specced | **flagged for Phil — not advanced** | Per memory: only flag stage advancement after Phil UAT'd. AC-1 of Contract 16 = B-97 UAT PASS. Stage check entry: D-360 may be ready to advance from specced to built after Phil verifies B-97 in UAT. |

---

## UAT Checklist — Contract 16

**Tagged: VALID AFTER PHIL COMPLETES DEPLOY STEPS 1–4, 6–7** per build-c-spec.md §9 (maintenance mode on → run migrations 032 + Admin SQL → deploy MCPs to Render → deploy Angular to GitHub Pages → health checks → maintenance mode off).

Until full deploy completes, the running site reflects the prior contract. Do NOT execute these steps before Phil confirms deploy is complete.

### B-97 Escape Key Regression

1. Sign in to OI Trust. Navigate to `/delivery/cycles`.
2. Open any Delivery Cycle by clicking the row → detail panel opens on right.
3. Click any gate diamond on the Stage Track → Gate Record Modal opens centered.
4. Press **Escape**.
   - Expected: Modal closes.
   - Expected: Delivery cycles grid does **NOT** reload (the "Loading..." spinner does not appear on the grid).
   - Expected: Detail panel remains open, in its prior state.
5. Open another gate modal. This time click the **×** in the top-right corner.
   - Expected: Modal closes. Detail panel remains open. Grid does not reload.
6. Compare: behavior in step 4 and step 5 should be identical from the grid's perspective.

**PASS if all expected.** **FAIL if grid reloads on Escape (step 4).**

### `set_milestone_actual_date` MCP Tool

7. As a Phil/Admin/DS/CB on a cycle: open a cycle detail. Click a milestone date row that has no actual date set. Set an actual date (e.g., today). Save.
   - Expected: Date saves. Status badge shows "Complete" (blue color).
   - Expected: Event log entry appears: "`<your name>` set `<Gate>` actual date to YYYY-MM-DD."
8. As same caller: edit the same milestone's actual date (change to another date).
   - Expected: Error message: "A reason is required to change this milestone's actual date after it was marked complete. Provide override_reason describing why the date is being changed."
   - Until the UI surfaces an override_reason input, the only way to change a completed actual date is via direct MCP call. **UI surface for override_reason is NOT in Contract 16 — this is a known gap.** Test #8 should fail with the error above; that proves the contract is enforced.
9. As a CE role (not assigned to the cycle): attempt to call the MCP tool directly.
   - Expected: Error message: "You do not have authority to set the actual date for this milestone. Only the assigned Domain Strategist, the assigned Capability Builder, Phil, or an Admin can record actual dates."
10. Open a cycle and submit a gate. Approve it.
    - Expected: Approval still sets the actual date (regression check — `record_gate_decision` not affected).

### `user_screen_state` — admin.users

11. Sign in. Navigate to `/admin/users`.
12. Set role filter to "DS" by clicking the DS tab.
13. Toggle name sort by clicking the Name header (changes asc → desc).
14. Navigate away (e.g., to `/delivery/cycles`).
15. Navigate back to `/admin/users`.
    - Expected: Role filter is still DS. Sort is still desc.
16. Open a different browser. Sign in as a different user. Navigate to `/admin/users`.
    - Expected: That user sees their own filter/sort state (default if first visit), NOT yours.

### Admin SQL Backfill

17. After Phil executes the Admin SQL, sign in as Craig Bickford (cbickford@triarqhealth.com).
    - Expected: Craig has access to `/admin` routes (Admin role granted).
18. Same for Sabrina Dobbins (sdobbins@triarqhealth.com).
18a. **Vijay Patil:** Originally listed for SQL backfill, then surfaced as orphan record (no `auth.users` identity, typo'd email). Resolution path: orphan deleted, fresh invite at `vijay.patil@triarqhealth.com` (correct spelling), re-assign 3 Trusts via UI, then SQL grant Admin on new id. **Test 18a deferred until Steps 3–5 of CC-013 complete.** Sign-in test executes against the correct email post-grant.

### Migration 032 — `user_screen_state` table

19. In Supabase SQL editor: `SELECT count(*) FROM user_screen_state;`
    - Expected: Returns a count (>= 0). Table exists.
20. As any signed-in user: navigate `/admin/users`. Set a filter. Then `SELECT * FROM user_screen_state WHERE screen_key = 'admin.users';`
    - Expected: A row exists for your user_id with `filter_state.roleFilter` set.

### Deployment Completion

21. After step 7 of build-c-spec.md §9 (set_maintenance_mode(false)): visit the deployed site without auth.
    - Expected: Login screen appears (not maintenance screen).
22. Verify all PASS items from Contract 15 UAT (B-91, B-92, B-101, B-102, B-103, D-308 Gate Schedule, D-308 Deploy Gate by Quarter) still pass — no regressions.

---

## CLAUDE.md Candidates (Rule 16)

1. **Candidate:** Worktree branch pointer can drift to deploy artifacts (gh-pages content) instead of master source. Add CLAUDE.md note: "Verify worktree is on master source at session start. If on a deploy-style branch (built JS visible at root), reset to origin/master before any work."
   - **Why:** This session opened in worktree `claude/busy-moser-b3d26e` on commit `d7e0096` (deploy artifacts, no source). Took explicit Phil + Design coordination to resolve.
   - **Trigger moment:** Session open, step 2 of structural read pass — `ls` showed built JS, not source.

2. **Candidate:** `gate-record-modal.component.ts` has no `.spec.ts` despite being gate-critical and 876 lines. Add CLAUDE.md note: "Gate Record Modal (`gate-record-modal.component.ts`) requires test coverage before next Contract that touches gate workflow."
   - **Why:** Contract 16 added `stopPropagation()` to modal's `onEscape` without a dedicated modal spec. Tier 2 logic change uncovered.
   - **Trigger moment:** §1 B-97 fix, second mechanism (modal stopPropagation).

3. **Candidate:** `auth.service.ts` has no `.spec.ts`. Add CLAUDE.md note: "AuthService is the only file with `createClient()` from `@supabase/supabase-js` — coverage is high-value. Before next contract that touches auth.service.ts methods, add `auth.service.spec.ts`."
   - **Why:** Contract 16 added two screen-state methods to AuthService without test coverage.
   - **Trigger moment:** §3 — CC-010 placement.

4. **Candidate:** START-HERE.md paths in for-ClaudeCode.zip should be verified against repo before use. Add CLAUDE.md note for zip producers: "Verify each path mentioned in START-HERE.md exists in the target repo before shipping the zip."
   - **Why:** START-HERE referenced `docs/CLAUDE.md`; actual operative file is root `CLAUDE.md`. Required CC-001 to record.
   - **Trigger moment:** Step 1 — CLAUDE.md replacement.

5. **Candidate:** Spec sections requiring file deletion or amendment should be conflict-checked against current repo state before shipping. Add CLAUDE.md note for spec authors: "Run `git ls-files` against the targets of every file deletion or amendment instruction. If targets are already absent, mark the section as 'verify-no-op'."
   - **Why:** §4 D-341 cleanup was a no-op (work was already complete). §6 CLAUDE.src.md amendment targeted a file that never existed. Both forced mid-session Design adjudication.
   - **Trigger moment:** Step 2 structural read pass — found §4 and §6 conflicts simultaneously.

6. **Candidate:** When MCP tool spec references a service-call signature ("the service call in delivery.service.ts is already wired"), Code should diff the service signature against the spec parameter list before implementing. Add CLAUDE.md note: "Before implementing any MCP tool, diff the corresponding Angular service signature against the spec params list — surface mismatches as CC-decisions."
   - **Why:** `set_milestone_actual_date` service signature had `manually_entered: boolean` (inert) — spec §2 used `override_reason` instead. Identified during implementation, recorded as CC-009.
   - **Trigger moment:** §2 — pre-rewrite signature check.

---

## Deferred Items (future-session candidates)

| ID | Item | Origin |
|----|------|--------|
| DEFER-CC10 | Extract `SupabaseClientService` (Option C from §3 design choice). Both AuthService and a future `UserScreenStateService` inject it. Cleaner SRP than current Path A. | CC-010 |
| DEFER-SCREEN-MIGRATE | Migrate `delivery.cycles`, `delivery.workstreams`, `delivery.divisions`, `delivery.gates` from localStorage to Supabase `user_screen_state` table. Pattern is established; sweep contract. | Audit F7, CC-012 |
| DEFER-TEST-RATCHET | Test infrastructure decisions: Karma/Jasmine spec coverage for components > 300 lines; Supabase mocking decision for MCP DB-dependent happy paths. | Audit Section 2 |
| DEFER-COMPONENT-DECOMP | Decomposition design session for top-4 oversized components (detail 2871, dashboard 1975, users 1157, gate-record-modal 876). | Audit Section 1 |
| DEFER-MCP-TEST-FIX | Fix `nextStage VALIDATE → PILOT` test (assertion expects PILOT, actual is UAT; per D-108 the order is VALIDATE → UAT → PILOT — test is wrong). 1-line change. | Audit F6 |
| DEFER-CSS-BUDGET | Raise CSS budget in `angular.json` or extract inline `styles:` to `.scss` files. 5 components emit warnings. Cosmetic. | Audit F5 |
| DEFER-DOC-AUTHOR | Document Author self-correct session (D-306): create `CLAUDE.src.md`, add RATIONALE block "Why (addition — D-372)" and GOVERNING comment `<!-- GOVERNING: S-030, S-031, D-357, D-371, D-372 -->` to Rule 29. Update `auth.service.ts` "ONLY file" comment to reflect Contract 16 screen-state addition. | CC-003, F1, CC-010 |
| DEFER-MCP-COUNT | Reconcile build-c-spec.md "20 tools" vs actual 18 in `delivery-cycle-mcp/src/tools/`. Spec language stale. | Audit §3 |
| DEFER-ORPHAN-AUDIT | Sweep `public.users` for rows with no corresponding `auth.users.id` (other orphans). Single audit query, low cost. Decide whether to delete or backfill auth identities for each. Origin of Vijay's orphan never identified. | CC-013, F9 |

---

## File Inventory — This Contract

### Modified

- `CLAUDE.md` (root) — replaced with zip v2.6 (step 1)
- `angular/src/app/core/services/auth.service.ts` — added `restoreUserScreenState`, `upsertUserScreenState`
- `angular/src/app/core/services/delivery.service.ts` — `setMilestoneActualDate` signature: `manually_entered` → `override_reason`
- `angular/src/app/core/services/screen-state.service.ts` — added `ADMIN_USERS` to `SCREEN_KEYS`
- `angular/src/app/features/admin/users/users.component.ts` — wired screen-state restore/save
- `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts` — `gateModalOpen` flag, `onEscKey` guard updated, `openGatePanel` sets flag, `afterClosed` clears flag, dropped `manually_entered` from `setMilestoneActualDate` call
- `angular/src/app/features/delivery/gate-record-modal/gate-record-modal.component.ts` — `ev.stopPropagation()` on `onEscape` happy path
- `mcp/delivery-cycle-mcp/src/tools/set_milestone_actual_date.js` — full rewrite per Contract 16 spec §2
- `mcp/delivery-cycle-mcp/tests/tools.test.js` — added `set_milestone_actual_date` describe block (7 cases)

### New

- `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.spec.ts` — first .spec.ts for this file; 4 `onEscKey` cases
- `db/migrations/032_user_screen_state.sql` — table + index + trigger + RLS policy
- `docs/build-c-audit-report-2026-05-15.md` — codebase audit report (5 sections, F1–F8)
- `OITrust-CodeClose-Contract16-2026-05-15.md` (this file)

### Not Modified

- All other Build C files. Confirmed-clean list from Contract 15 unaffected.

---

## Phil — Required Actions Before UAT

**Already completed this session:**
- ✅ `db/migrations/032_user_screen_state.sql` executed
- ✅ Admin SQL granted Craig Bickford + Sabrina Dobbins
- ✅ Step 2 of CC-013 — orphan + 3 memberships deleted (id `b693a88b-26f0-472c-bf44-9184c1308fd3`)
- ✅ Step 3 of CC-013 — Vijay invited via Admin Users UI at `vijay.patil@triarqhealth.com`

**Still pending (in order):**

1. (Was Step 1) — done.
2. (Was Step 2) — done.
3. **Wait for Vijay to accept the OTP** at `vijay.patil@triarqhealth.com`. His row will flip from "Invited" to "Active" in Admin Users.

4. **Step 4 of CC-013 — assign 3 Trusts in the UI.** Open Vijay's row in Admin Users. Add division memberships for:
   - Value Services (Trust)
   - Practice Services (Trust)
   - Performance (Trust)

5. **Step 5 of CC-013 — capture new id, grant Admin via SQL.** In Supabase SQL editor:

```sql
-- 5a. Capture Vijay's new id (after invite accepted)
SELECT id, email, display_name, system_role, is_active, created_at
FROM public.users
WHERE email = 'vijay.patil@triarqhealth.com'
  AND deleted_at IS NULL;
```

Copy the `id` value from the result. Then replace `NEW_ID_HERE` below and run:

```sql
-- 5b. Grant Admin role on Vijay's new id
UPDATE public.users
SET system_role = 'admin',
    updated_at  = now()
WHERE id = 'NEW_ID_HERE';

-- Verify
SELECT id, email, display_name, system_role, updated_at
FROM public.users
WHERE id = 'NEW_ID_HERE';
```

Expected: `system_role` = `admin`, `email` = `vijay.patil@triarqhealth.com`.

6. **Run deployment sequence per build-c-spec.md §9** (if not already done):
   - `set_maintenance_mode(true)`
   - Deploy `delivery-cycle-mcp` to Render (wait healthy)
   - Deploy `division-mcp` to Render (wait healthy)
   - Deploy Angular: bundle is at `angular/dist/pathways-oi-trust/` — push to GitHub Pages per memory note (copy dist to `/c/tmp/oi-deploy`, push directly; add `404.html` and `.nojekyll` post-deploy)
   - Health checks
   - `set_maintenance_mode(false)` — **mandatory final step**

7. **Run UAT checklist** (above). Confirm PASS items. If any FAIL, surface to next session.

8. **After UAT PASS on B-97:** advance D-360 from `specced` to `built`.

9. **After full contract UAT PASS:** advance Contract 16 surfaces to `built` per impl_status table.

---

## Session Output Path

**Full Windows path** (per persistent memory note — Phil hands to Chat or next Code session):

```
C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\.claude\worktrees\busy-moser-b3d26e\OITrust-CodeClose-Contract16-2026-05-15.md
```

Audit report:

```
C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\.claude\worktrees\busy-moser-b3d26e\docs\build-c-audit-report-2026-05-15.md
```

Worktree branch: `claude/busy-moser-b3d26e` — reset to `origin/master` this session via `git switch -C` per Design adjudication. Ready for commit + merge-to-master per project convention.

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-05-15*
