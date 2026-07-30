# OITrust CodeClose — Contract 40 Follow-on (Approver Setup & Governance Reach)

**Date:** 2026-07-29
**Session:** Contract 40 follow-on arc (continuation)
**Scope:** Home card sizing; Division Approvers concept + scoped approver picker; All Pending Gates reskin; Reassign-button removal; Initiative Executive setup UI; picker error-handling and a schema hotfix.

Covers CC-40-M2 and CC-40-R through CC-40-V. Earlier follow-on decisions (CC-40-G..Q) were recorded in the prior Contract 40 CodeClose (2026-07-28).

---

## CC-decisions

**CC-40-M2 — Home card standard height.**
Built: `all-pending-gates-card` and `quarter-deploy-goal-card` on the Home screen now use the 340px standard height + internal scroll (CC-38-21). They used their own root classes and so were missed by the global `.oi-home-screen .oi-card-grid .oi-card` rule. Added `height:340px; overflow-y:auto; box-sizing:border-box` + `:host{display:block}` to each.

**CC-40-R — Division Approvers (new concept, picker-only).**
New table `division_approvers` (migration 094): designated per-division approvers, chosen from Division members. This is a candidate pool for the manual approver picker only. The D-557 automatic resolution chain (oversight → gate_approver_configs → division owner → Phil) is unchanged. Phil locked "picker-only" explicitly. RLS enabled, deny-all (Rule 38) — MCP-only table, service role bypasses.
- division-mcp: `set_division_approver`, `list_division_approvers`, `remove_division_approver` — Admin-only, members-only (target must have an active `division_memberships` row).
- Admin → Divisions: an Approvers editor beside Members.

**CC-40-S — Scoped eligible-approver picker.**
delivery-cycle-mcp `list_eligible_approvers(delivery_cycle_id)` returns the candidate pool for a cycle: all Initiative Executives + the cycle Division's Leader + every ancestor Division's Leader (full `parent_division_id` walk) + the cycle Division's designated Approvers. Ancestor Divisions contribute Leaders only, not approvers (Phil-locked). Leadership-gated via `isLeadershipForCycle`. The initiative detail "Set approver…" picker now consumes this instead of listing every active user.

**CC-40-T — Reassign moved to detail; All Pending Gates reskin.**
Removed the inline Reassign button from All Pending Gates, the My Actions approval queue, and the Initiative grid. Reassignment is now detail-only (the "Set approver…" control, which routes through `set_oversight`). Deleted the now-dead `ReassignApproverDialogComponent`. Reskinned All Pending Gates onto the standard card/grid surface (`--triarq-*` tokens, radius-10 card, zebra rows, right-aligned Days) to match the Initiative list.

**CC-40-U — Split load-error from empty-pool message.**
The approver picker rendered a failed call and a genuinely-empty pool identically ("No eligible approvers"). Split them: empty pool shows actionable guidance; a failed call shows "Couldn't load eligible approvers · Try again".

**CC-40-U2 — Surface the actual error text.**
Added `eligibleErrorText` capturing `res.error` / HTTP error so the real server message shows under the failure line. Kept as permanent UX — a real message beats a generic one. This is what pinned CC-40-U3.

**CC-40-U3 — Schema hotfix (Rule 34).**
`list_eligible_approvers` queried `delivery_cycles.id` / `.eq('id', …)`, but the table's primary key is `delivery_cycle_id`. Every call threw `column delivery_cycles.id does not exist` → generic load failure. Fixed to `delivery_cycle_id` (matches `get_delivery_cycle`). The FIFO test mock does not validate column names, so the happy-path unit test passed despite the bug — see CLAUDE.md Candidates.

**CC-40-V — Initiative Executive setup UI.**
Admin → Users view panel gained an "Initiative Executive" zone, visible only to Phil/super_admin, with a Grant/Revoke control that calls `delivery.setInitiativeExecutive` (delivery-cycle-mcp `set_initiative_executive`, not `update_user` which rejects the flag). Server re-enforces super_admin. IE pill now renders on the grid and Identity rows (IE is intentionally excluded from `ALL_ROLE_FLAGS`, so it is rendered explicitly). Placement and Phil-only authority both confirmed by Phil.

---

## Rule 7 — Deviations from spec

No governing spec document existed for the Division Approvers concept or the IE setup UI; both were specified inline by Phil this session and confirmed via AskUserQuestion (picker-only scope; ancestors contribute leaders only; placement in User Management / Division Management; Phil-only authority). Treated Phil's messages as the spec. No deviation from an existing written spec.

---

## CodeClose Verification

**(1) Spec coverage.** Inline requirements this session, each PASS:
- Reskin All Pending Gates to standard → PASS (card surface + tokens).
- Remove Reassign button, rely on detail control → PASS (three surfaces + dialog deleted; grep shows zero remaining references).
- Limit approver list to Division Approvers + Leader + parent Leaders + IEs; add Division Approvers concept selectable from members → PASS (`list_eligible_approvers` + `division_approvers` + admin editor).
- IE setup → PASS (Phil-only grant/revoke + pills).
- Home card sizing → PASS.

**(2) Regression check.** Reassign removal: verified the detail "Set approver…" path still performs the reassignment via `set_oversight` (unchanged tool). Dashboard approver filter/initials column (CC-40-P/Q) retained — only the Reassign button removed. All Pending Gates row-drill unchanged. MatDialog/MatDialogModule removed from dashboard only after confirming `this.dialog` had no other use. Verified via full MCP suites (below) and Angular AOT build (EXIT=0).

**(3) Test ratchet.** Logic-touching changes and their tests:
- `list_eligible_approvers` → `contract40-eligible-approvers.test.js` (validation, not-found, not-leadership, happy path). NOTE: the happy-path test did NOT catch CC-40-U3 because the FIFO mock ignores column names — flagged as a CLAUDE.md candidate.
- `set_division_approver` / `list_division_approvers` / `remove_division_approver` → `contract40-approvers.test.js` (11 tests: happy + validation + not-admin + not-member + duplicate + idempotent).
- IE toggle (CC-40-V), message split (CC-40-U/U2), card sizing (CC-40-M2), reskin (CC-40-T) are view/UI wiring over existing tools — Angular component behavior verified by build + UAT; no new server logic. **Untested-item list:** the Angular IE toggle handler and the picker error-branch rendering have no unit test (component test harness not in use for these panels). Phil acknowledgment requested at close.

**(4) Pattern sweep.** Shared pattern modified: the approver-reassignment affordance. Searched all `.ts` under `angular/src/app` for `reassign`, `Reassign…`, `reassignRequested`, `reassignApprover`, `ReassignApproverDialog` — found and removed all call sites (all-pending-gates, actions-list, my-actions, delivery-cycle-dashboard); dialog component deleted; post-change grep returns NONE.

**(5) Standards conformance.**
- Rule 38 (RLS in CREATE TABLE): PASS — migration 094 includes `ENABLE ROW LEVEL SECURITY`.
- Rule 34 (schema-first SQL): initial FAIL caught at runtime (CC-40-U3), then fixed. Recorded.
- Busy-guard on MCP-calling controls: PASS — IE Grant/Revoke uses `ieBusy`; picker disables during load; admin add/remove approver use existing busy patterns.
- Optimistic-reversion rule: PASS — IE toggle sets state from the server-confirmed response, not on a timer.
- Rule 4 (named screen keys): N/A — no new filter/sort persistence this session.
- Design tokens: PASS — reskin uses `--triarq-*`.

**(6) CC-decision completeness.** Sequence this session: M2, R, S, T, U, U2, U3, V. No gaps. (G..Q closed previously.)

**(7) Structural health (Rule 12).** Files modified that exceed thresholds:
- `delivery-cycle-detail.component.ts` — already well over 300 lines (~3900+); this session added the eligible-approver picker wiring only. Pre-existing; flagged previously.
- `delivery-cycle-dashboard.component.ts` — over 300 lines (pre-existing); this session net-removed code (reassign).
- `divisions.component.ts` and `users.component.ts` — over 300 lines (pre-existing admin components); Approvers editor / IE zone added. No new file split undertaken this session; noted for a future extraction pass.
- New MCP tool files are small and single-responsibility.

**(8) Deployment.** No maintenance-mode window used — additive change, no destructive migration.
- Angular deployed to GitHub Pages across the arc; final user-facing build `928b79c` (gh-pages `1f3c13a`), changelog build pending in this commit (below).
- MCP: division-mcp redeployed by Phil (approver tools live — admin editor works). delivery-cycle-mcp redeployed by Phil; CC-40-U3 hotfix (`c271915`) pushed and requires ONE more delivery-cycle-mcp redeploy.
- Result: **partial** — Angular live; delivery-cycle-mcp needs a final redeploy for the PK hotfix. UAT for the picker is gated on that redeploy.

**(9) Repo cleanliness.** New MCP tool files (`set_division_approver.js`, `list_division_approvers.js`, `remove_division_approver.js`, `list_eligible_approvers.js`) and test files were `git add`ed and committed before the deploy pushes; both index.js `require()`s resolve to committed files. Result: clean.

---

## UAT Checklist

Run after the final delivery-cycle-mcp redeploy (commit `c271915`+) and a hard refresh.

### Admin → Users — Initiative Executive
1. As Phil, open a user → an "Initiative Executive" zone appears with current status + Grant/Revoke. PASS/FAIL.
2. Grant → status flips to "Initiative Executive", IE pill appears on the grid row. PASS/FAIL.
3. Revoke → clears. PASS/FAIL.
4. As a non-super-admin admin, the IE zone is absent. PASS/FAIL.

### Admin → Divisions — Approvers
5. Open a Division → "Approvers (N)" zone under Members. PASS/FAIL.
6. Add Approver lists only that Division's members; adding one shows it in the list. PASS/FAIL.
7. Remove drops it. PASS/FAIL.

### Initiative detail — Set approver
8. As DL/IE/Phil, "Set approver…" lists only eligible people (Division Approvers + Leader + parent Leaders + IEs), not every user. PASS/FAIL.
9. Division with no leader/approvers → empty-pool guidance pointing to Admin → Divisions. PASS/FAIL.
10. Simulate a load failure (e.g. before the redeploy) → "Couldn't load…" with the actual error text + Try again — distinct from the empty message. PASS/FAIL.
11. Pick an approver → saves; chip updates. PASS/FAIL.

### All Pending Gates
12. Renders on the standard card/grid surface (not the old plain table). PASS/FAIL.
13. No Reassign button on rows; row click still opens the gate. PASS/FAIL.

### My Actions / Initiative grid
14. No Reassign button in the approval queue or the grid approver column. PASS/FAIL.

### Home
15. All Pending Gates + Deploy Goal cards match the height of My Initiatives. PASS/FAIL.

---

## CLAUDE.md Candidates

1. **delivery_cycles PK is `delivery_cycle_id`, not `id`.** Candidate text: "delivery_cycles primary key is `delivery_cycle_id` (not `id`). Verify against `get_delivery_cycle` / `types/database.ts` before any cycle query." Why: CC-40-U3 shipped a crash because the tool assumed `id`. Trigger: the live "column delivery_cycles.id does not exist" failure.

2. **FIFO test mock does not validate column names.** Candidate text: "The require-cache FIFO Supabase mock ignores `.select()` / `.eq()` column names — a wrong column name passes the unit test but fails live. Rule 34 (schema-first) is the only guard; do not rely on green tests to catch column typos." Why: the happy-path test for `list_eligible_approvers` passed while the tool was crashing in production. Trigger: CC-40-U3.

3. **delivery-cycle-mcp `/tools` and `/health` are behind JWT — cannot curl-verify a deploy.** Candidate text: "delivery-cycle-mcp mounts `validateJwt` before `/health` and `/tools`; an unauthenticated `curl .../tools` always returns the auth error, so it cannot confirm whether a tool shipped. Verify a delivery-cycle-mcp redeploy in-app or with a Bearer token, not by curl. (division-mcp mounts these open — curl works there.)" Why: wasted a diagnosis cycle concluding a tool was 'not found' when it was the auth wall. Trigger: this session. (Also saved to memory.)

---

## Open items for Phil / Design

- **Phil:** run migration 094; final delivery-cycle-mcp redeploy for the CC-40-U3 hotfix (`c271915`); then UAT.
- **Design:** assign D-numbers for CC-40-G..V. Flag for adjudication: two per-Division approver concepts now coexist — `gate_approver_configs` (automatic routing default) and `division_approvers` (manual-picker pool). A configured gate approver not in the pool still auto-routes but cannot be manually re-picked. Deliberate under picker-only; wants a Design eye.

---

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-07-29
