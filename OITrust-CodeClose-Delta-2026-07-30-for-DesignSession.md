# OITrust CodeClose — DELTA for Design, 2026-07-30

**Covers:** everything since `OITrust-CodeClose-Contract40-Followon-2026-07-29.md` (which closed CC-40-M2 and CC-40-R..V).
**New CC-decisions:** CC-40-W, CC-40-X.
**Also in this window:** two non-build deliverables (a governance reconstruction and an at-risk-code rescue) and one Phil deployment that activated previously-dead work.

**Master:** `b1fb483` · **gh-pages:** `8499d4a` (version `b1fb483`) · **Rescue branch:** `rescue/ac-29-maintenance-mode` @ `1bc28c5` (pushed, unmerged)

---

## 1. What Design needs to act on first

Three items, in descending order of consequence:

1. **Build C has never closed.** Build C §12 AC-29 (maintenance mode) is NOT BUILT, and `build-c-spec.md:780` states Build C does not close and Build B does not open until it is met. Detail in §6. A near-complete implementation was found **untracked and historyless** on disk and is now preserved on a branch. It is blocked on one Design decision (§7).
2. **Eleven governance decisions (CC-40-G..Q) had no surviving record.** They are now reconstructed at HIGH confidence from commit bodies — but with three corrections to the previous CodeClose's own claims. See §5.
3. **CC-40-W is only half-deployed** and is sitting in a temporarily inconsistent state until Phil runs migration 096 and redeploys delivery-cycle-mcp. See §4 and §8.

---

## 2. CC-decisions

### CC-40-W — Context Brief and Scenario Journeys become loud suggestions, not hard stops
**Commit:** `d059919` · **Migration:** 096 (**not yet executed**)

Phil's ruling 2026-07-30 reverses his own 2026-07-17 ruling that made a missing Context Brief a hard stop at Go to Build.

- **Removed** the Context Brief hard stop from `submit_gate_for_approval.js`, and its client-side twin from `gateHardStops()`.
- **Added** `gate_warning_through` (migration 096) to bound a warning window. D-438 only modelled `primary_only` (exactly one gate) or `primary_and_subsequent` (that gate and every gate forever). Phil specified a bounded set. `NULL` = unbounded, so every existing artifact type is unaffected.
- **Configured:** Context Brief → Brief Review through Go to Deploy. Scenario Journeys → Go to Build through Go to Deploy (deliberately silent at Brief Review, per Phil's explicit exception).
- **Both parties see it.** The amber panel is placed *outside* the submit/approve blocks in the gate modal, so the approver sees the same omissions the submitter does, while the gate is still open.
- `get_delivery_cycle` now returns `artifact_warnings_by_gate`; a new `computeArtifactWarningsByGate()` computes all five gates in one query pair rather than five round trips.

**First Principles (Rule 1)** — Context: an artifact rule was enforced in one hard-coded block. Question: should a missing framing document stop work, or inform it? Reduce: the warning machinery (D-438) already existed and already ran on both the submit and approve paths. Simplify: rather than new bespoke logic, extend the existing rule with one bounding column and move the two artifacts onto it. Automate: enforcement is now data-driven — configuring an artifact type is all that is required, with no code change.

**Stated assumption (Design may correct):** Phil said Scenario Journeys should be loud "for Go to Build." I ran it Go to Build **and** Go to Deploy, preserving "treated the same" minus the stated Brief Review exception.

### CC-40-X — Remove the "Not sure" chip from sizing Q4 (Security) and Q5 (UX)
**Commit:** `b1fb483` · Client-only, no schema or MCP change

Phil reported the chip "acting oddly." It was defective, in Q4's case in two directions at once.

`q4_security_impact` is a **boolean**; `q5_ux` is **`standard | critical`**. Neither has a third state, so under D-598 the chip was client-only sugar mapped to the routing-positive value. Consequences found in the code:

- **Q4:** `isAnswerSelected` computed `answers.q4 === ('unsure' === 'true')`, i.e. `=== false` — so the "Not sure" chip **highlighted whenever the answer was No**, while clicking it wrote `true` and highlighted **Yes**.
- **Q5:** the chip could never highlight at all.

Removed both chips and the dead `selectAnswer` branches. Nothing lost: choosing Yes / Critical directly fires the same Security / UX specialist suggestion. Q1–Q3 keep "I don't know" — `idk` is a genuine stored value there (migration 092), which is why the two groups behaved differently.

**Design implication — partial walk-back of D-598.** D-598 specified "Not sure" on Q4/Q5. The intent was sound but is **unimplementable as specified**: those columns have no third state. A real "not sure" on Security/UX would require `q4_security_impact` to become an enum rather than a boolean. Recorded as a question, not built.

---

## 3. Non-build deliverables in this window

**(a) CC-40-G..Q close reconstruction** — `OITrust-CodeClose-2026-07-30-C40-GQ-Reconstruction-for-DesignSession.md` (uncommitted, working tree).

A read-only investigation, requested by Design. No repo file was modified except the output. Outcome: all eleven letters recovered at HIGH confidence **with stated rationale**, because Code had written the *why* into each commit body. Three corrections to the prior CodeClose are in §5.

**(b) AC-29 maintenance-mode rescue** — branch `rescue/ac-29-maintenance-mode` @ `1bc28c5`, pushed to origin.

Preservation only; does not function and must not be merged as-is. Six blockers documented in `RESCUE-NOTES-AC29.md`. See §6 and §7.

**(c) Design prompt** — `OITrust-DesignPrompt-2026-07-30-AC29-MaintenanceMode.md` (uncommitted). Two decisions: the `get_maintenance_mode` auth posture, and a proposed 10-step replacement for `build-c-spec.md` §9 that names Phil's manual steps. §9 as written assumes automation that does not exist.

---

## 4. Deployment activated by Phil in this window

Phil redeployed delivery-cycle-mcp on `2ef60ab` at 09:04 EDT. Verified `c271915` is an ancestor of that commit and the live tool now queries `delivery_cycle_id`. **CC-40-S (the scoped approver picker) went from broken-in-production to working.** That closes the CC-40-U3 defect chain.

---

## 5. Corrections to the previous CodeClose

The 2026-07-29 CodeClose contained three claims that the reconstruction disproved. Design should not carry them forward.

| Claim in File 2 | Correction |
|---|---|
| "CC-40-G..Q were recorded in the prior Contract 40 CodeClose (2026-07-28)" | **False.** That file covers A–F only and asserts its sequence complete at F. This is the error that triggered the reconstruction. |
| "Dashboard approver filter/initials column (CC-40-P/Q)" | **Misattributed.** Both are **CC-40-Q** (`1409a8c`). **CC-40-P** is Division-Leader scoping on `list_all_pending_gates` (`df4735a`). |
| `CC-40-M2` implies a CC-40-M it revised | **No such decision.** CC-40-M (`7743976`) is the Status History Accomplishment View toggle — unrelated to card sizing. `M2` is a **label collision** and supersedes nothing; it needs renumbering. |

Two further findings for the registry:

- **CC-40-Q was largely reversed by CC-40-T** within ~24 hours. Only the filters, sortable columns, sidebar widening, and `get_my_raci` approver identity survive; the Reassign affordance and its dialog were deleted. Ratifying CC-40-Q as live behaviour would be wrong.
- **Three live changes carry no CC-letter:** migration 093 (a schema change), the sizing `answered_by_user_id` hotfix, and the celebration-spray feature (user-facing, and it had no changelog entry — an S-035 gap).

A correction of my own: I previously told Phil that division-mcp's `/tools` was reachable by `curl`. **It is not** — both services gate `/health` and `/tools` behind JWT (verified live: HTTP 401). The `// (no JWT required)` comments in both `index.js` files are stale. This had already cost one misdiagnosis.

---

## 6. Rule 34 — Build C §12 rolling AC check

The previous CodeClose's table labelled "Rolling Build C §12" enumerated Contract 40's own 32 ACs, not Build C's 31. This is the actual check against `build-c-spec.md` §12.

**Tally: 22 BUILT · 3 PARTIAL · 1 NOT FOUND · 1 obsolete-by-design · 1 NOT BUILT.**

Full per-AC table with evidence paths is in the reconstruction document §6. Items that are not a clean BUILT:

| AC | Status | Note |
|---|---|---|
| 3 | PARTIAL (evolved) | 6 columns, not the specified 11 — retooled by D-264/265/267 |
| 4 | Obsolete by design | Tier fully retired by D-583; AC is stale, not failed |
| 8 | PARTIAL | Amber warning + inline edit deliberately removed (D-276, D-296) |
| 20 | PARTIAL | 26 slots exist; dimmed future-slot behaviour removed by D-418 |
| 21 | NOT FOUND | No malware scan-spinner / Clean-badge UI. Artifacts are external-URL pointers, so the AC may be obsolete against the as-built model — a Design call |
| **29** | **NOT BUILT** | **Build C close gate.** See below |

**AC-29 — maintenance mode.** Verified absent from master: no `MaintenanceScreenComponent`, no `set_maintenance_mode` / `get_maintenance_mode`, no `system_config` read in Angular. The `CLAUDE.md` Arch-1 exception for that read therefore describes code that does not exist.

**Half of it is already live, which nobody knew.** No migration on master creates `public.system_config`, yet migrations `031` (RLS + the D-MaintenanceMode anon-SELECT policy) and `053` both `ALTER` it successfully and have been applied. The orphaned migration was executed manually at Build C time. So the table, columns, RLS policy and seed row are **in production**; only application code is missing. Corollary: **the repo could not rebuild the database from scratch** — a fresh run of `db/migrations/` would fail at `031`. Migration 095 on the rescue branch closes that hole.

---

## 7. Open decisions for Design

1. **`get_maintenance_mode` auth posture** — security boundary, escalated under Rule 30, Code will not resolve it. There is currently **no unauthenticated endpoint anywhere in the MCP layer**, so honouring the rescued file's "public endpoint" header would set the first such precedent. Note the Angular bootstrap does not use the tool (it reads Supabase directly by design), and the data is *already* anon-readable via `031`'s `USING (TRUE)` policy — so a public endpoint adds no new data exposure, only a new request surface. Code's lean: JWT-only. Three options in the Design prompt.
2. **§9 deployment sequence** — ratify the proposed 10-step text naming Phil's manual migration and Render steps; decide whether it lives in `build-c-spec.md` §9, `CLAUDE.md` Rule 29(8), or both with one canonical.
3. **D-numbers for CC-40-G..X**, plus renumbering the M/M2 collision and re-attributing CC-40-P.
4. **D-598 partial walk-back** (CC-40-X) — accept that Q4/Q5 carry no "not sure", or schedule the schema change.
5. **`gate_required` vs code enforcement** — Context Brief's `gate_required` column was `false` the whole time the hard stop existed, so schema and code had disagreed since 2026-07-17. CC-40-W removes the disagreement by making enforcement fully data-driven. Worth a registry note.
6. **Two coexisting per-division approver concepts** (carried forward, unresolved): `gate_approver_configs` (auto-routing) and `division_approvers` (manual pool). A configured approver not in the pool still auto-routes but cannot be manually re-picked.

---

## 8. CodeClose Verification

**(1) Spec coverage.** No formal spec this window; both CC-decisions were Phil-specified inline and confirmed in-session.
- Context Brief hard stop → loud suggestion at Brief Review / Go to Build / Go to Deploy → **PASS**
- Scenario Journeys same treatment, silent at Brief Review → **PASS**
- Both submitter and approver informed → **PASS** (amber panel outside the submit/approve blocks)
- Amber (not red) treatment → **PASS**
- Remove "Not sure" from sizing Q4 and Q5 only → **PASS** (Q1–Q3 untouched)

**(2) Regression check.** Context Brief enforcement was removed intentionally; a test now guards the reversal (asserts submission falls through to the Jira stop and that the error does *not* mention Context Brief). Q4/Q5 chip removal verified not to disturb `isAnswerSelected`'s boolean handling or the Q1–Q3 `idk` paths. `list_participation`, approver resolution and gate flow untouched. Verified by full MCP suite + AOT build.

**(3) Test ratchet.** delivery-cycle-mcp **512/512** (was 502, +11 window cases +1 rewritten). New cases cover: primary gate, mid-window, boundary gate itself, one gate past the boundary, close_review, `NULL` = unbounded, unrecognised value = unbounded, `through` ignored for `primary_only`, already-attached suppression, and Scenario Journeys' silence at Brief Review.
**Untested-item list (D-442):** the Angular amber panel rendering and the Q4/Q5 chip removal have no unit test — view-template changes, no component harness in use for these. `computeArtifactWarningsByGate` has no dedicated test (its rule is covered via `computeWarnings`; only the fetch-and-fan-out wrapper is uncovered). Phil's acknowledgment requested.

**(4) Pattern sweep.** Shared pattern modified: the D-438 artifact-warning rule, used by `submit_gate_for_approval` and `record_gate_decision`. Both call sites reviewed — both consume the shared helper, so both inherit the bound with no edit. `computeWarnings` signature unchanged. Searched for `gate_warning_behavior` and `computeArtifactSuggestionWarnings` across `mcp/`; no other consumers.

**(5) Standards conformance.**
- Rule 34 (schema-first): PASS — `gate_warning_through` verified against migration 040's column set before authoring; `delivery_cycles` PK lesson from CC-40-U3 applied.
- Rule 38 (RLS in CREATE TABLE): N/A — 096 is ALTER + UPDATE, creates no table.
- Rule 40 (FIFO ripple): PASS and **acted on** — two stale Context Brief fixture slots removed from `contract38-ai-governance`. One of those tests had been **passing for the wrong reason**, its stale slot silently consumed as the Division lookup.
- Rule 35 (build after commit): PASS both commits.
- Rule 42 (confirm push before Render): PASS — `d059919` and `b1fb483` both on `origin/master`.
- Busy-guard / optimistic-reversion rules: N/A — no new server-calling control.
- S-035 (About entry): PASS — one entry dated 2026-07-30 with both items. **Note:** the CC-40-X item was added in this CodeClose commit rather than in `b1fb483`, so `b1fb483` shipped without it. Recorded as a minor S-035 sequencing miss, corrected here.
- Design tokens: PASS — amber uses `--triarq-color-warning`.

**(6) CC-decision completeness.** W, X — sequential, no gaps after V.

**(7) Structural health (Rule 12).** Files touched that exceed thresholds, all pre-existing: `delivery-cycle-detail.component.ts` (~3900 lines), `gate-record-modal.component.ts` (>1200), `submit_gate_for_approval.js` (849 → 835, net reduction). `initiative-sizing-form.component.ts` net reduction. `artifact-warnings.js` grew ~45 lines and remains well under the 400-line service threshold. No extraction attempted this window.

**(8) Deployment.** **PARTIAL — and deliberately reported as such.**
- Angular: **LIVE** — gh-pages `8499d4a`, version `b1fb483`.
- Migration 096: **NOT EXECUTED** (Phil).
- delivery-cycle-mcp redeploy for CC-40-W: **NOT DONE** (Phil).

**Consequence Design should know:** CC-40-W is currently in a split state. The client no longer disables Submit for a missing Context Brief, but the server hard stop is still live — so a user submitting Go to Build without one now gets a *server rejection* instead of a disabled button with an explanation. Functionally safe, worse UX, self-resolving on redeploy. Order matters: **migration 096 must run before the redeploy**, or the new column select fails and the amber panel silently shows nothing.

This is precisely the mid-deploy window AC-29 maintenance mode exists to cover — the second time in three days that the missing capability has had a visible cost.

**(9) Repo cleanliness.** No new MCP tool files this window (`computeArtifactWarningsByGate` was added to an existing helper). `git status -s mcp/ angular/src/` shows no `??` entries for any file named in a committed `require()` or `import`. **Clean.**

---

## 9. UAT checklist

Run **after** migration 096 and the delivery-cycle-mcp redeploy. Steps 5–7 need no redeploy.

**Gate artifact warnings** (initiative missing a Context Brief)
1. Open Brief Review → amber "Recommended document not attached · Context Brief" panel shows. PASS/FAIL
2. Open Go to Build → same amber panel; **Submit is enabled** and submission succeeds (no Context Brief block). PASS/FAIL
3. Open Go to Deploy → panel still shows. PASS/FAIL
4. Open Go to Release → panel is **gone** (past the window). PASS/FAIL
5. As the **approver**, open a gate awaiting your approval on that initiative → you see the same amber panel while deciding. PASS/FAIL
6. Attach a Context Brief → panel disappears at every gate. PASS/FAIL
7. On an initiative missing Scenario Journeys: silent at Brief Review, amber at Go to Build and Go to Deploy, gone at Go to Release. PASS/FAIL

**Sizing chips** (no redeploy required — already live)
8. Open sizing → Q4 (Security) shows **Yes / No only**; Q5 (UX) shows **Standard / Critical only**. PASS/FAIL
9. Q4: select No → the No chip highlights and nothing else does (the old bug lit "Not sure" here). PASS/FAIL
10. Q1–Q3 still offer "I don't know", and selecting it keeps that chip highlighted. PASS/FAIL

---

## 10. CLAUDE.md candidates

1. **Client-only enum sugar is a defect pattern.** Candidate: "Never offer a UI option that has no representable stored state. If an option maps to another value on selection, the selected-state check will highlight the wrong chip. Add the value to the schema or do not offer it." Trigger: CC-40-X — D-598's "Not sure" on a boolean column, wrong in both directions for a full contract.
2. **`delivery_cycles` PK is `delivery_cycle_id`.** Candidate: "The `delivery_cycles` primary key is `delivery_cycle_id`, not `id`. Verify against `get_delivery_cycle` before any cycle query." Trigger: CC-40-U3 shipped a production crash. (Carried from the previous CodeClose — still un-dispositioned.)
3. **The FIFO mock does not validate column names.** Candidate: "The require-cache FIFO Supabase mock ignores `.select()` / `.eq()` column names — a wrong column passes tests and fails live. Green tests are not evidence against Rule 34." Trigger: CC-40-U3's happy-path test passed while the tool crashed. (Carried.)
4. **Neither MCP service exposes `/health` or `/tools` without a JWT.** Candidate: "Both services apply `validateJwt` before mounting `/health` and `/tools`; the `(no JWT required)` comments are stale. Never conclude 'tool not shipped' from a curl 401 — check the Render dashboard or call in-app." Trigger: one wasted diagnosis cycle. Also blocks §9 step 6.
5. **Removing a check ripples FIFO fixtures downstream, and can expose tests passing for the wrong reason.** Candidate: "When deleting queries from a flow, re-read every fixture in the affected suite — a stale slot may be silently consumed by the next query and keep a test green for the wrong reason." Trigger: the Jira-required test in `contract38-ai-governance`.

---

## 11. What Design still cannot know

Carried forward from the reconstruction, because it governs how CC-40-G..Q can be ratified:

- **`balance_points` are unrecoverable** for all eleven G..Q decisions. No commit records alternatives considered.
- **Whether Phil approved each decision or Code took it under Rule 30** is unknown for most. Several cite "per Phil"; the rest are silent.
- **No First Principles record** exists for G..Q, including two Rule 1 triggers (new shared components in CC-40-K and CC-40-Q).
- **CC-40-P's rationale specifically** — the diff is unambiguous, but nothing explains why DL scope was drawn at owned divisions rather than the ancestor chain, when `isLeadershipForCycle` elsewhere walks ancestors. Ratify as a factual description; do not attribute intent.
- **UAT outcome for G..Q** was never recorded.

For CC-40-W and CC-40-X (this window) rationale **is** recorded — in the commit bodies, in §2 above, and in the code comments at each change site.

---

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-07-30
