# CodeClose — Contract 41

**Date:** 2026-07-31
**Session type:** Code
**Branch:** master · pushed to `origin/master` at `bfe2ff1`
**Governing input:** Phil's four-item instruction, 2026-07-31 (no spec document — see Rule 6 note)
**Governing file versions:** CLAUDE.md v3.7, decision-registry.md v3.68, standards-summary.md v2.0

---

## 1. Locked Decisions Touched (Rule 47)

| Identifier | What this session's work did to it |
|---|---|
| **D-616** (CC-40-W, Context Brief / Scenario Journeys as bounded warnings) | **Implements as intended.** The built version over-delivered — the read path surfaced every warning-configured artifact type, not the two D-616 names. Now scoped to exactly those two. |
| **D-438** (Contract 25, artifact warning behaviour model) | **Extends.** `gate_warning_behavior` semantics unchanged; a second, orthogonal axis (`gate_warning_on_open`) added beside it. No existing row's behaviour changes on the submit/decision path. |
| **D-560** (Contract G8, All Pending Gates) | **Extends.** Adds submitter display/filter/sort and an optional single-cycle scope to `list_all_pending_gates`. Auth model untouched. |
| **D-613 / CC-40-P** (Division Leader scope on All Pending Gates) | **Preserved.** The new `delivery_cycle_id` scope runs *before* the division filter, so a Division Leader passing a foreign cycle id still gets nothing. Explicitly noted in the tool comment. |
| **CC-40-T** (reassignment is detail-only; All Pending Gates reskin) | **Supersedes the reskin half.** The 2026-07-29 reskin aimed at the Initiative list but used `#F7FAFC`; the real treatment is navy `#12274A`. Reassignment placement untouched. |
| **D-599 / CC-40-Q** (RACI participation glyphs) | **Extends.** `RaciGlyphsComponent` gains an additive `readonly` input. Three existing consumers unchanged. |
| **D-564** (participation records — the C and I letters) | **Implements a new reader.** No schema or write-path change. |
| **D-430** (My Completed Gates card) | **Overlaps — not resolved.** See §4 finding. |
| **D-345 §8** (`?gate=` auto-expand) | **Reuses** for both new row types. |
| **D-346** (async home cards) | **Conforms.** New card is async with skeleton rows. |
| **ARCH-33** (APG aging threshold, 7 days) | **Reuses** the same threshold for the card's aging emphasis. |
| **Rule 36** (canonical gate labels) | **Conforms.** New tool reads `GATE_NAME_DISPLAY`; a test asserts a decoy `milestone_label` is ignored. |
| **Rule 39** (assessment posture) | **Exception applies.** New tool is a read-only gate query that cannot reach a decision or submission path — posture implicitly skip. |
| **Rule 40** (FIFO fixture ripple) | **Conforms.** Submitter resolution folded into the existing users lookup specifically to avoid adding a query ahead of the FIFO-mocked waiting-on fixtures. |
| **S-009** (cancelled item visibility) | **Conforms.** CANCELLED excluded from the new card; COMPLETE deliberately retained. |
| **S-030** (component design) | **Conforms.** Glyphs reused rather than restyled. |
| **S-035** (About panel history) | **Conforms.** Entry prepended to `changelog.ts` in `bfe2ff1`. |
| **Arch-1** | **Untouched.** No Angular Supabase access added. |

---

## 2. CC-Decisions

All entries are in `docs/cc-decisions-active.md` per Rule 46, appended as made.

| CC | Title | Commit |
|---|---|---|
| CC-41-A | Ledger opens at Contract 41; Contracts 1–40 not backfilled (Phil confirmed) | `22251a9` |
| CC-41-B | Loud-on-open warnings get their own column rather than switching other types off | `a92e1ff` |
| CC-41-C | Navy grid header rather than the pale reskin | `6c3fc87` |
| CC-41-D | Submitter resolved in the existing users lookup, not a new query | `6c3fc87` |
| CC-41-E | Targeted return refresh via a transient snapshot, not a full reload | `6c3fc87` |
| CC-41-F | A separate discovery tool rather than a parameter on `get_my_raci` | `afc7800` |
| CC-41-G | Reuse `RaciGlyphsComponent` with an additive `readonly` input | `afc7800` |

Sequence A→G, no gaps.

---

## 3. Schema Summary (Rule 49)

Columns as read from `types/database.ts` and the latest ALTER migrations — not from `build-c-spec.md`.

**`cycle_artifact_types`** — modified this contract (migration 097)
`artifact_type_id` (PK), `artifact_type_name`, `guidance_text`, `sort_order`, `gate_required`, `primary_gate`, `gate_warning_behavior`, `gate_warning_through` (migration 096), **`gate_warning_on_open` (NEW, migration 097, boolean NOT NULL DEFAULT false)**, `active_status`

**`gate_records`** — read only
`gate_record_id` (PK), `delivery_cycle_id`, `gate_name`, `gate_status`, `approver_user_id`, `approver_decision_at`, `approver_notes`, `submitted_at`, `submitted_by_user_id`, `cast_confirmed_at`, `deleted_at`

**`participation_records`** — read only (migration 082)
`record_id` (PK), `delivery_cycle_id`, `letter` (`'C'`/`'I'`), `holder_user_id`, `holder_group_id`, `set_via`, `set_by_user_id`, `created_at`, `updated_at`, **`removed_at`** — soft delete is `removed_at`, *not* `deleted_at`

**`specialty_group_members`** — read only
`group_id`, `user_id`, `deleted_at`

**`delivery_cycles`** — read only
`delivery_cycle_id` (**PK — not `id`**, Standing Note 1), `cycle_title`, `division_id`, `current_lifecycle_stage`, `assigned_dcs_user_id`, `assigned_epo_user_id`, `assigned_dol_user_id`, `baseline_level`, `set_level`, `oversight_user_id`, `deleted_at`

**`divisions`** — read only: `id` (PK), `division_name`, `display_name_short`, `owner_user_id`, `deleted_at`
**`users`** — read only: `id` (PK), `display_name`, `deleted_at`
**`cycle_artifacts`** — read only: `artifact_type_id`, `delivery_cycle_id`, `deleted_at`

---

## 4. CodeClose Verification (Rule 29)

### (1) Spec coverage

No spec document exists; the acceptance criteria are Phil's four instruction items.

| Item | Result | Evidence |
|---|---|---|
| Home card for R/C/I showing pending gates and recently completed | **PASS** | `get_my_raci_gate_summary` + `MyRaciGatesCardComponent`; 20 unit tests |
| Fix All Pending Gates grid to match All Initiatives | **PASS** | Navy `#12274A` header, white uppercase, sticky, 6px top corners, `#F0F4F8` hover, `#E8F0FE` selected — copied from `delivery-cycle-dashboard.component.ts:784–830` |
| Add submitter + filter by submitter | **PASS** | Column, filter, sort; 3 unit tests incl. legacy-null and deleted-user |
| Return to this screen refreshed on one initiative only | **PASS, with a caveat** | Snapshot + scoped re-query. Caveat: a plain route round trip destroys the component, so a 60s sessionStorage snapshot backs it; past the TTL it falls back to a full load. Stated in CC-41-E. |
| Limit warnings to Context Brief + Scenario Journeys | **PASS** | Migration 097 + `onOpenOnly`; the twelve-bullet case is a named regression test |

### (2) Regression check

| Surface | Verified how |
|---|---|
| Submit / decision artifact warnings (D-438) | Test asserts `computeWarnings` without `onOpenOnly` still returns all 13 — byte-identical to prior behaviour |
| `list_all_pending_gates` auth + Division Leader scope | contractG8 suite 13/13; scope filter still runs after the new cycle filter |
| Approver name resolution on APG rows | Asserted in the same test that adds submitter — the shared lookup does not regress it |
| Three existing `RaciGlyphsComponent` consumers | `readonly` defaults false; template branch is `*ngIf="!readonly"`, so the rendered output is unchanged |
| Full delivery-cycle-mcp suite | **546/546 pass** (was 521 before this contract) |
| Angular compile | `ng build` exit 0; no new CSS budget warnings |

### (3) Test ratchet

| Logic-touching change | Protecting test |
|---|---|
| `computeWarnings` `onOpenOnly` filter | 10 new cases in `artifact-warnings.test.js` |
| `computeArtifactWarningsByGate` scoping | Same suite (pure-rule level) |
| Submitter resolution in `list_all_pending_gates` | 3 new cases in `contractG8-executive.test.js` |
| Optional `delivery_cycle_id` scope | 2 new cases (chain integrity + blank-id) |
| `get_my_raci_gate_summary` (whole tool) | 20 new cases in `contract41-raci-summary.test.js` |

**Untested-item list, per D-442 — requires Phil's acknowledgment:**

1. **`AllPendingGatesComponent`** — snapshot write/read, TTL expiry, splice logic, filter and sort getters. No test.
2. **`MyRaciGatesCardComponent`** — row rendering, aging threshold, label helpers. No test.
3. **`RaciGlyphsComponent` `readonly` branch** — no test (component had none before either).

Reason for all three: `ng test` is broken on this setup and has been since before Contract 37. These are Angular component tests, so the ratchet cannot be satisfied without first fixing the harness. **Flagged as CLAUDE.md candidate #1 below.** The MCP half of every one of these features does carry unit coverage.

Note on what the passing MCP tests do *not* prove: per Standing Note 2 the FIFO mock ignores `.select()` and `.eq()` column names, so neither the `gate_warning_on_open = true` filter nor the `delivery_cycle_id` filter is proven by a green test. The `onOpenOnly` guard in the pure rule is the real protection for the first; the second is UAT-verified only.

### (4) Pattern sweep

A shared pattern was modified: `RaciGlyphsComponent`. Components searched — `delivery-cycle-dashboard.component.ts`, `my-initiative-status.component.ts`, `my-delivery-cycles-card.component.ts`. Finding: all three pass no `readonly` input, so all three keep the interactive hollow-`i`. No change required.

Second sweep, on the `returnTo` bug found while wiring CC-41-E. Values searched: `/actions`, `/actions?tab=completed`, `actions`, `initiatives`, `all-pending-gates`. Finding: **only `all-pending-gates` was broken**, because it is the only one whose route is nested (under `/initiatives`) while being passed as a bare segment to `navigateByUrl`. The other four resolve to real top-level routes. Fixed; no further instances.

### (5) Standards conformance

| Standard | Result |
|---|---|
| **S-030** Component design | **PASS** — glyphs reused, not duplicated; both new files single-responsibility |
| **S-031** Code quality | **PASS** on pattern sweep and verb+object naming (`buildRefreshNotice`, `refreshOneCycle`, `listPendingGatesForCycle`, `glyphsFor`). **PARTIAL** on test ratchet — see §4(3) |
| **S-035** About panel | **PASS** — entry in `changelog.ts`, shipped in `bfe2ff1` |
| **S-037** Ellipsis | **PASS** — no new command opens an input surface; no ellipsis added or wrongly omitted |
| **S-038** Panel actions visible | **N/A** — no right panel added or modified |
| **S-032** Deactivation | **N/A** |
| **S-033** Cache-busting | **PASS** — untouched; `version.json` stamped post-commit per Rule 35 |
| **S-001** Visible context | **PASS** — card has a zone explanation and an empty state naming what would populate it; the refresh notice states what changed |
| **S-015** Secondary orienting text | **PASS** — card description 11px italic `#5A5A5A` |
| **S-009** Cancelled visibility | **PASS** — CANCELLED excluded server-side |
| **S-021** Tappable entity chips | **PASS** — Initiative names render as chips on both new lists |
| **S-036** Grid column sort | **PASS** — submitter column sortable via header only, `↕`/`↑`/`↓` indicators |

### (6) CC-decision completeness

CC-41-A through CC-41-G, sequential, no gaps. All seven present in `docs/cc-decisions-active.md`.

### (7) Structural health (Rule 12)

| File | Lines | Threshold | Status |
|---|---|---|---|
| `all-pending-gates.component.ts` | 399 | 300 (component) | **Over by 99.** Grew from 210. Single responsibility holds (one grid). Extraction candidate: the snapshot logic → a small service. Not done this contract. |
| `my-raci-gates-card.component.ts` | 260 | 300 | Under |
| `raci-glyphs.component.ts` | 103 | 300 | Under |
| `delivery.service.ts` | 1218 | 400 (service) | **Over by 818.** Pre-existing; this contract added ~45 lines. Long-standing split candidate. |
| `initiative_executive.js` | 216 | 400 | Under |
| `get_my_raci_gate_summary.js` | 239 | 400 | Under |
| `artifact-warnings.js` | 188 | 400 | Under |
| `index.js` | 386 | 400 | Under (registration file) |
| `types/database.ts` | 1145 | — | Type declarations only |

### (8) Deployment

Per build-c-spec §9, with two standing deviations: maintenance mode cannot be used (AC-29 is not built — verified again this session, zero `system_config` references in `angular/src`, no `MaintenanceScreenComponent`), and migrations are Phil-only per Rule 21.

**Status: partially complete — Angular deploy deliberately held.**

- Code committed and **pushed** to `origin/master` at `bfe2ff1` (Rule 42 satisfied — a Render redeploy is now safe).
- Migration 097 written and committed, **not executed** (Rule 21). Rule 48 satisfied: the file is on master before any run.
- `ng build` run **after** commit per Rule 35; `version.json` = `bfe2ff1`.
- **gh-pages deploy withheld by choice, not failure.** The new Home card calls `get_my_raci_gate_summary`, which does not exist on Render until Phil redeploys. Shipping the Angular first would put a red error box on every user's home screen in the interval. Sequence below.

UAT checklist is provided rather than withheld — nothing failed; the remaining steps are Phil's manual ones.

### (9) Repo cleanliness

New MCP tool file and new Angular imports were added this contract, so the check applies. `git status -s mcp/ angular/src/` before the push showed the two new files as `A` (staged), no `??` entries for anything named in a committed `require()` or `import`. **Result: clean.**

---

## 5. Deployment Sequence for Phil

Run in this order — the order matters:

1. **Execute migration 097** in the Supabase console (`db/migrations/097_artifact_warning_on_open.sql`). Run both verification queries at the bottom of the file. Expect exactly two rows true.
2. **Redeploy `delivery-cycle-mcp`** in the Render dashboard. Manual — Render does not auto-deploy on push.
3. **Tell me, and I will deploy the Angular to gh-pages.** Or deploy it yourself from `angular/dist/pathways-oi-trust/browser/`.

If you deploy Angular before step 2, the My RACI Gates card shows "Your RACI gates could not load" until Render catches up. Nothing else breaks.

Between steps 1 and 2 the gate modal shows **no** artifact warnings at all — the old code does not know the new column. That is a fail-safe, and it lasts only as long as the gap.

---

## 6. About Entry — Contract 41 (S-035)

```
Date: 2026-07-31
BuiltAt: 15:40 UTC
Items:
 - [All]   My RACI Gates card on Home: new Home card for Initiatives where you are Responsible, Consulted, or Informed — their gates awaiting approval, plus ones approved in the last 14 days, with an R/C/I marker per row.
 - [Trio]  Gate warnings trimmed back to two documents: the gate panel listed twelve missing documents at Go to Build; it now names only Context Brief and Scenario Journeys.
 - [Admin] All Pending Gates: grid matches the All Initiatives list, submitter shown and filterable, returning from a gate refreshes only that Initiative, and the Back link works again.
```

---

## 7. UAT Checklist (Rule 19)

Runnable after deployment steps 1–3 above.

### Surface A — Gate modal artifact warnings

*What changed: the amber "recommended documents not attached" panel now lists at most two document types.*

1. Open an Initiative at Go to Build with no artifacts attached. Open the Go to Build gate. → The amber panel lists **at most `Context Brief` and `Scenario Journeys`** — never `Jira Epic`, `Cursor prompt`, `AI Governance Spec`, or the other nine. **Pass / Fail**
2. Same Initiative at Brief Review. → Panel lists **`Context Brief` only**. Scenario Journeys must be absent. **Pass / Fail**
3. Open a gate at Go to Release or Close Review. → **No amber document panel at all.** **Pass / Fail**
4. Attach a Context Brief, reopen the Go to Build gate. → Context Brief is gone from the panel; Scenario Journeys remains. **Pass / Fail**
5. Submit a gate that is missing several documents. → The **submit response** still mentions the wider set. This is intended — the post-action advisory is unchanged. **Pass / Fail**

### Surface B — All Pending Gates

*What changed: navy grid header, submitter column and filter, targeted refresh, Back link fixed.*

1. Open All Pending Gates. → Column header row is **dark navy with white uppercase labels**, visually identical to the All Initiatives header. **Pass / Fail**
2. Scroll the list. → Header stays pinned. **Pass / Fail**
3. → A **Submitted by** column shows a person's name (or `—`) on each row. **Pass / Fail**
4. Set the **Submitted by** dropdown to one person. → Only their submissions remain; the `N of M` count drops. **Pass / Fail**
5. Click the **Submitted by** header. → Sorts A→Z, arrow shows `↑`; click again for `↓`. **Pass / Fail**
6. Clear filters, click a row. → The Initiative opens with that gate expanded. **Pass / Fail**
7. Click **← Back**. → You land on **All Pending Gates**, not a blank or error page. *(This was broken before this contract.)* **Pass / Fail**
8. → On arrival, a blue note reads "Updated — …", and that Initiative's row is highlighted with a blue left border. **Pass / Fail**
9. Open a gate, **approve** it, then Back. → The note says that Initiative has no gates awaiting approval any more, and its row is gone. Every other row is still present. **Pass / Fail**
10. Wait more than a minute on the Initiative before clicking Back. → Still returns correctly; the list reloads fully instead of splicing. No error. **Pass / Fail**

### Surface C — My RACI Gates card (Home)

*What changed: new card.*

1. Open Home as a user who is DCS/EPO/DOL on at least one Initiative. → **My RACI Gates** card appears, below My Actions and above the admin cards. **Pass / Fail**
2. → Card shows a skeleton briefly, then rows — never a spinner, never an indefinite blank. **Pass / Fail**
3. → Each row shows a small **R**, **C**, and/or **I** chip. An Initiative you are trio on shows **R**. **Pass / Fail**
4. → There is **no hollow `i` follow button** on these rows (unlike the Initiative grid). **Pass / Fail**
5. → Rows with a gate awaiting approval sit under **Awaiting approval**, oldest first. **Pass / Fail**
6. → A gate waiting more than 7 days shows an **amber left border** and amber day count. **Pass / Fail**
7. → Gates approved in the last 14 days sit under **Completed in the last 14 days**, most recent first, day count in green. **Pass / Fail**
8. Click an Initiative chip. → Opens that Initiative with the gate expanded; **← Back** returns to Home. **Pass / Fail**
9. As a user with no Initiatives and no stakes. → Card shows the empty state explaining that rows appear once you are on a trio or are Consulted/Informed — **not** an error. **Pass / Fail**
10. Ask someone to add you as **Consulted** on an Initiative, reload Home. → That Initiative appears with a **C** chip. **Pass / Fail**
11. → An approval **you personally owe** appears in **My Actions**, and is *not* duplicated as an "A" on this card. **Pass / Fail**

---

## 8. Stage Check (S-020)

No `devStatus` advancement proposed. Per the standing preference, stage advancement is only flagged after Phil has UAT'd, not on deployment. **All Pending Gates** currently sits at `uat` and is the likely candidate once Surface B passes — raise it next session.

---

## 9. CLAUDE.md Candidates (Rule 16)

**Candidate 1 — `ng test` is broken, so the Angular half of the test ratchet is unsatisfiable.**
Text: *"`ng test` does not run on this setup and has not since before Contract 37. Until it is fixed, Rule 29(3)'s test ratchet cannot be met for Angular components — declare every Angular logic change on the untested-item list and rely on UAT. Do not report a contract as ratchet-compliant on the strength of MCP tests alone."*
Why: three components this contract carry real logic (snapshot TTL, splice, aging thresholds) with zero automated protection, and the same gap has recurred silently for several contracts.
Trigger: writing §4(3) and finding no way to protect `AllPendingGatesComponent`.

**Candidate 2 — `navigateByUrl` with a bare segment silently targets the root.**
Text: *"`returnTo` values passed to `navigateByUrl` must be absolute paths. A bare segment like `'all-pending-gates'` resolves against the root, not the current route, so any surface nested under a parent route gets a dead link that fails silently — no console error, no 404 the user can name."*
Why: this shipped in Contract G8 and survived a Contract 40 reskin of the same component without being noticed.
Trigger: wiring CC-41-E and discovering the Back link had never worked.

**Candidate 3 — a read path that surfaces existing config is a behaviour change.**
Text: *"Before adding a read path that exposes stored configuration to a new surface, enumerate what that config currently contains in production. Config accumulated for a write-time or post-action purpose will not be sized for a load-time display."*
Why: the twelve-bullet panel came from a correct two-row migration plus a read path that inherited a decade of unrelated settings. The migration was right; the assumption about the data was not.
Trigger: diagnosing item 5.

---

## 10. Open Items for Design

1. **`get_my_raci_gate_summary` needs D-numbers** for CC-41-B through CC-41-G, and a decision on whether the new card and **My Completed Gates (D-430)** should merge. They overlap: D-430 is trio-only over 28 days, the new card adds C and I over 14 days and pairs completions with pending. Two cards showing overlapping completions is a Design call, not a Code one — I did not merge them.
2. **`c_provisional` is not carried by the card.** The D-593 provisional-Consulted distinction needs Go to Build cast state the summary does not fetch, so a Consulted stake renders solid on the card and dashed on the Initiative grid. Either accept the inconsistency or accept the extra query.
3. **Migration 097 leaves the other ten artifact types loud on the submit/decision response.** If Phil wants them quiet there too, that is a separate data decision — say so and it is a one-line migration.
4. **`AllPendingGatesComponent` is 399 lines** against a 300 threshold. Snapshot logic is the extraction candidate.
5. **AC-29 / maintenance mode** remains unbuilt, so no contract can follow the build-c-spec §9 deployment sequence as written. The Arch-1 `system_config` exception stays suspended.

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | Contract 41 | 2026-07-31*
