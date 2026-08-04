# CodeClose — Initiatives Grid Filter Visibility (follow-on)

Pathways OI Trust | 2026-08-04 | CONFIDENTIAL
Commits: `45cb434` (fix), `e84ea29` (ledger). gh-pages `bbda148` carrying build `e84ea29`.
No contract number — a defect Phil reported from live use. Date-based CC numbering per the CC-0714 / CC-0726 precedent.
Worktree Hygiene (Rule 31): primary repo, branch `master`, source-confirmed.

---

## 1. Locked decisions touched (Rule 47 / D-621)

| Identifier | What the work did to it |
|---|---|
| S-012 Active Filter Chips | **Restores conformance.** Four active filters rendered no chip. Now all four do, with immediate re-query on dismissal as the standard requires. |
| D-297 Inform Don't Hide | **Restores conformance.** A filter that is applied, persisted, invisible, and unreachable is the purest form of hiding. |
| S-011 Filter Panel Commit Model | **Respected, deliberately.** Clear All still fires no query and leaves the panel open. Making it self-applying would have been a deviation, so it does not. |
| D-198 Primary Workflow Clarity | **Adjusted, not abandoned.** Clear All stays visibly secondary against the filled Apply, but the recessed treatment had gone far enough to read as disabled. |
| D-171 Filter and Sort Memory | **Unchanged, and implicated.** Persistence is why a one-off drill-in became permanent. The fix makes the persisted state visible rather than stopping it persisting. |
| CC-38-40 | **Completes it.** That change added the DCS/DOL drill-downs and the query params; it never added their chips. |
| CC-40-Q | **Follows its precedent.** The Approver filter got a chip and a badge entry when it was added; these four are brought up to the same standard. |
| Rule 36 Gate Labels | **Respected.** The Next Gate chip label reads from canonical `GATE_LABELS`, never `milestone_label`. |
| S-030 / S-031 | Declared in §5. |

---

## 2. CC-decisions

CC-0804-01 through CC-0804-06, all in `docs/cc-decisions-active.md` with reasoning and commit hash (Rule 46).

| CC | Subject |
|---|---|
| 01 | Chips for DCS / EPO / DOL / Next Gate |
| 02 | Filters badge counts them |
| 03 | Clear All clears everything, S-011 preserved |
| 04 | Clear All no longer reads as disabled |
| 05 | "0 of 59" was correct — no load-ordering bug, and two wrong hypotheses recorded |
| 06 | Pattern sweep — the defect is confined to this grid |

---

## 3. The defect, and how it presented

Phil reported the Initiatives grid as broken: with a Practice Services Division filter it showed **"Showing 0 of 59"**, and more generally "only Value division initiatives are appearing."

Root cause, verified against the live database rather than inferred:

His `user_screen_state` row for `delivery.cycles` held **two** filters:
```
filterDivision : af0cc99f…   Practice Services
filterDcs      : 4e5d65b6…   Christian Sherbinow
```

`filterDcs` was **applied** (line 2148), **persisted** (line 1914), **restored on every visit** (line 1945), and represented **nowhere** — no chip, absent from `activeFilterCount`, and no row in the filter panel. It had arrived from a role-view drill-in (`qp['dcs']`, line 1361) at some point and had been silently narrowing his grid ever since.

**The 59 was correct.** Practice Services (1) + QSuite & Pathways Clinical (27) + Revenue Cycle Management (31) = 59, because his saved state carries `includeChildDivisions: true` and the server correctly expands to descendants. The client then filtered 59 → 0 on the invisible DCS filter, which matches none of them.

**Clear All was not disabled**, contrary to the report — no `[disabled]` binding exists. But it could not have helped: the panel has no DCS row, so `clearStagedFilters` had nothing to clear, and the button's styling made a live control look inert.

Two hypotheses I raised and then disproved, recorded so the reasoning is auditable:
- An Interest profile acting as a hidden filter — **wrong**, `interestConditions` is `[]`.
- Duplicate `user_screen_state` rows per screen key — **wrong**, 210 rows map to 210 distinct (user, screen_key) pairs.

---

## 4. Deviations from spec (Rule 7)

No spec governs this work — it is a defect fix restoring conformance to S-012 and D-297. One judgement worth naming: Phil asked that Clear All "always clear everything," which could have meant applying immediately. It does not fire a query, because S-011 explicitly forbids that and its conformance test checks for it. Clearing reaches every filter; committing still requires Apply. Flagged rather than assumed.

---

## 5. CodeClose Verification (Rule 29)

**(1) Spec coverage** — no acceptance criteria; the test is the reported symptom.

| Symptom | Result |
|---|---|
| An active drill-in filter is visible | **PASS** — chip per filter |
| It can be dismissed individually | **PASS** — × clears and re-queries (S-012) |
| The badge reflects how many filters are active | **PASS** — Phil's case would read 2, not 1 |
| Clear All reaches every filter | **PASS** — including the four with no panel row |
| Clear All does not look disabled | **PASS** — primary-colour outline |
| No query fired by Clear All | **PASS** — S-011 intact |

**(2) Regression check** — the change is additive: four new chips, four added counter lines, four assignments in a reset method, and one button's inline style. No existing filter logic altered, no query changed, no persistence shape changed. `npm run build` exit 0. delivery-cycle-mcp **623/623** and division-mcp **125/125** still pass, though neither is exercised by this change.

**(3) Test ratchet** — **no tests added.** Phil directed "skip testing" earlier in the session and that override stands. Declared plainly rather than glossed: the four chips, the badge count, and the Clear All behaviour are verified by build, by reading the code, and by Phil's UAT — not by test. `ng test` is a known-broken surface in this repo (Contract 37), so an Angular component test would have been new infrastructure rather than a new test. **Untested items: all six CC-decisions in this change.**

**(4) Pattern sweep** — performed and reported in CC-0804-06. Searched every component reading `qp['dcs'] / ['epo'] / ['dol'] / ['next_gate']`; only `delivery-cycle-dashboard.component.ts` both reads those params and persists them. No sibling grid carries an invisible persisted filter.

**(5) Standards conformance**

| Standard | Result |
|---|---|
| S-012 Active Filter Chips | **PASS** — restored; this was the violation |
| S-011 Filter Panel Commit Model | **PASS** — no query, panel stays open |
| S-013 Filter Drill-in | **PASS** — panel rows untouched |
| D-297 / D-200 | **PASS** — the hidden state is now surfaced |
| D-198 | **PASS** — secondary, but no longer inert-looking |
| S-030 Component Design | **PASS** — no new responsibility; one small label helper added |
| S-031 Contract Code Quality | **PARTIAL** — pattern sweep done, naming fine; test ratchet waived by Phil |
| S-035 About Panel | **PASS** — About Entry in §7, `changelog.ts` updated in the fix commit |
| S-020 Stage Check | No `devStatus` change — the grid stays `live` |

**(6) CC-decision completeness** — CC-0804-01 … 06. Six, sequential, no gaps. All six in the ledger.

**(7) Structural health**

| File | Lines | Over threshold? |
|---|---|---|
| `delivery-cycle-dashboard.component.ts` | 2591 → 2650 | **YES — 8.8× the 300-line component threshold.** Pre-existing; grew ~59 lines. The single largest component in the codebase. Candidate below. |
| `core/data/changelog.ts` | +17 | No — append-only data file |

**(8) Deployment** — **complete.**
- `master` at `e84ea29`, pushed.
- Built AFTER commit (Rule 35): `version.json` = `e84ea29`, matching HEAD.
- gh-pages `bbda148` carrying `e84ea29`, verified in sync with the remote; `.nojekyll`, `404.html`, `index.html`, `version.json` all present.
- **No MCP change, no migration.** Neither Render service needs a redeploy.
- Maintenance mode not used: an additive front-end change with no schema or API dependency, so there is no window during which a user could see an inconsistent system. Stated rather than skipped, per Rule 29(8).

**(9) Repo cleanliness** — `git status -s angular/src/` run before push. No new files; two modified (`delivery-cycle-dashboard.component.ts`, `changelog.ts`) plus the ledger. No `??` entries. **Clean.**

---

## 6. Schema summary (Rule 49 / D-623)

**No schema surfaces touched.** No migration, no column, no table. The work reads `user_screen_state.filter_state` only through existing persistence code, whose shape is unchanged — the same keys were already being written and restored.

For the record, the row that caused the report (read-only diagnostic):
`user_screen_state` — `user_id`, `screen_key` (`delivery.cycles`), `filter_state` jsonb, `updated_at`. The jsonb already carried `filterDcs`, `filterEpo`, `filterDol`, `filterNextGate`; nothing about persistence changed, only their visibility.

---

## 7. About Entry (S-035)

## About Entry — Filter visibility fix
Date: 2026-08-04
BuiltAt: 17:09 UTC
Items:
- [All] Initiatives grid filters: filters set by drilling in from a role view — DCS, EPO, DOL, Next Gate — now appear as dismissible chips and count towards the Filters badge. Previously they were applied and remembered but invisible.
- [All] Clear All in the filter panel: now clears every filter, including the drill-in ones the panel had no row for, and no longer looks greyed out.

---

## 8. UAT Checklist (Rule 19 / D-357)

Deployed. Hard-refresh the grid first — the update banner will offer a reload.

1. Open **Initiative Tracking → Initiatives**. Your Practice Services filter is still saved, and you should now see a **second chip**: "DCS: Christian Sherbinow". **Pass/fail — this is the filter that was invisible.**
2. The **Filters badge reads 2**, not 1. **Pass/fail.**
3. Click the **×** on the DCS chip. The grid re-queries immediately, no Apply needed, and **New Prior Auth Suite** appears under the Practice Services filter. **Pass/fail.**
4. Open **Filters**. **Clear All** is an outline button in TRIARQ blue — clearly live, not greyed. **Pass/fail.**
5. Click **Clear All**, then **Apply filters**. Every filter clears, including any drill-in ones. **Pass/fail.**
6. Drill in from a role view (e.g. a Next Gates by DCS screen) to set a role filter, then return to the grid. The chip is present and dismissible rather than silent. **Pass/fail.**
7. Confirm nothing else regressed: Division, Assigned Person, Lifecycle Stage, Gate Status, My Role, Approver, Roadmap Theme, Workstream chips all behave as before. **Pass/fail.**

---

## 9. Stage check (S-020)

No change. The Initiatives grid stays `live` — this restores intended behaviour rather than adding surface.

---

## 10. Open items

1. **Phil's saved DCS filter is still in his `user_screen_state` row.** The fix makes it visible and one click clears it. I did **not** write to that row — production data, and it was not explicitly authorised. Offered.
2. **`delivery-cycle-dashboard.component.ts` is 2650 lines**, 8.8× the component threshold and the largest component in the codebase. Every filter addition makes it worse. Candidate below.
3. Everything from the Contract 45 CodeClose §10 remains open — the D-644 ratification, the D-648 ruling, the missing companion document, the D-561 loud exception, the Contract 38 key misnaming, and CLAUDE.md's stale Arch-4 line.

---

## 11. CLAUDE.md Candidates (Rule 16)

1. **A persisted filter must be a visible filter.** Candidate text: *Any filter written to `user_screen_state` must render as a dismissible chip and count towards the Filters badge. A filter that persists without a chip becomes permanent and unexplainable.* Trigger: this defect — a one-off drill-in silently narrowed a grid indefinitely, and the user reasonably concluded the screen was broken.
2. **A recessed control must not read as a disabled one.** Candidate text: *Secondary buttons keep the primary colour as an outline. Grey-on-grey reads as disabled and costs a support round trip.* Trigger: CC-0804-04 — Phil reported a working button as disabled.
3. **`delivery-cycle-dashboard.component.ts` is 2650 lines.** Candidate: extract the filter bar and filter panel into their own components before the next filter is added. This contract added 59 lines to a file already 8.8× over threshold.
4. **Diagnose from the live database, not from the code's intent.** Candidate text: *When a user reports a screen as broken, read their actual persisted state before reasoning about the component.* Trigger: two plausible hypotheses (Interest profile, duplicate rows) were both wrong, and reading `user_screen_state` settled it in one query.

---

## 12. Session close

**Complete and deployed.** master `e84ea29`, gh-pages `bbda148`, no migration, no Render redeploy.

**Outstanding:** UAT §8, and Phil's stale saved filter if he wants it cleared server-side rather than by clicking the new chip.

**Session output file:**
`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\OITrust-CodeClose-GridFilterVisibility-2026-08-04.md`

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-08-04*
