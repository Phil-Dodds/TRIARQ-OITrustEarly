# OITrust CodeClose — Contract 25 Part 2 — 2026-06-16

**Build:** C — Contract 25 Part 2 (D-438 Amendment 1 follow-on)
**Session:** 2026-06-16 evening
**Branch:** master
**Spec:** Contract 25 ValidatorClose package
 — `OITrust-Contract25-D438-Amendment1-for-Code.md`
 — `OITrust-Contract25-Spec-2026-06-16.md` (base spec already implemented as commit 9381bf8)
**Session Brief:** `OITrust-SessionBrief-2026-06-16-BuildC.md`
**Output file path (Windows):**
`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\OITrust-CodeClose-Contract25Part2-2026-06-16.md`

---

## Summary

Contract 25 Part 2 closes the Amendment 1 gap left by the prior Contract 25 build (commit 9381bf8). The earlier session built the base D-438 schema swap (`required_at_gate` → `primary_gate` + `gate_warning_behavior`) but never touched Amendment 1's mandates — `lifecycle_stage` removal, Admin screen rename to "Initiative Artifact Types", and Zone 6 gate-grouped rendering.

This Part 2 delivers all six Amendment 1 surfaces in a single round:

- **Migration 041** — supersedes the broken Migration 040. (040 failed against Supabase with `column "required_at_gate" does not exist` — Contract 24 never shipped that column. Part 2 ships a fresh idempotent migration that goes directly from `lifecycle_stage` to `primary_gate` + `gate_warning_behavior`, then drops `lifecycle_stage`.)
- **MCP** — `list/create/update_artifact_type` lose `lifecycle_stage`; `list_artifact_types` orders by gate sequence; `attach_cycle_artifact` fixed select that would have crashed post-migration.
- **Admin UI** — screen renamed "Initiative Artifact Types" (hub card + page title + edit panel header); Stage column / field / sort removed; default sort now Primary Gate ascending; subtitle updated.
- **Zone 6** — `rebuildArtifactsByStage` → `rebuildArtifactsByGate`; groups by `primary_gate` in sequence order; "Unscheduled" group last when populated; empty groups suppressed; `expandedStages` → `expandedGates`; `initExpandedStages` rewritten to use `NEXT_GATE_BY_STAGE` so current + past gates expand by default.
- **Side effect of column drop** — `gateChecklist` `byStage` lookup migrated to `byGate` using a `typeIdToGate` map built from `cycle.artifact_types`. The prior implementation referenced `a.lifecycle_stage` on attachments, a joined field that `get_delivery_cycle` never actually populated — checklist rows were always false-negative. Switching to `primary_gate` makes the check evaluate against attachment data for the first time. Flagged as CC-25P2-04 (deviation from "no behavior change in scope-adjacent code").
- **Type / service** — `ArtifactTypeRow` and `CycleArtifactType` lose `lifecycle_stage`; `CycleArtifact` joined field `lifecycle_stage?: string` → `primary_gate?: GateName | null`; `delivery.service.ts` param shapes for `createArtifactType` / `updateArtifactType` lose `lifecycle_stage`.

Migration 041 applied by Phil before this session closed; verification query D returned `current_lifecycle_stage` present (separate column, unaffected as Amendment 1 mandates). MCP tests 92/93 pass — the one fail is the pre-existing stale `create_delivery_cycle — error path: missing workstream_id` test (Cand-25-04, carried forward). Angular production build PASS — clean (only pre-existing D-371 CSS budget warnings on 16 components, all carried).

S-035 About Entry prepended to `changelog.ts` as "Contract 25 Part 2 — Stage → Gate swap (D-438 Amendment 1)". Deployment is Phil's next step (MCP push + Render manual redeploy → gh-pages copy + force push).

---

## A. Surfaces Touched

| # | File | Class | Purpose |
|---|---|---|---|
| Migration | `db/migrations/041_artifact_types_stage_to_gate.sql` | NEW | Idempotent: re-asserts CHECK constraints; backfills `primary_gate` + `gate_warning_behavior` from `lifecycle_stage`; re-sequences `sort_order` within each gate group; drops `lifecycle_stage`. |
| MCP | `mcp/delivery-cycle-mcp/src/tools/list_artifact_types.js` | MOD | Removed `lifecycle_stage` from SELECT; new order by (`primary_gate` sequence ASC, `sort_order` ASC) via a `GATE_SORT_INDEX` map; rows with `primary_gate = NULL` sort last. |
| MCP | `mcp/delivery-cycle-mcp/src/tools/create_artifact_type.js` | MOD | Removed `lifecycle_stage` param + `VALID_STAGES` set + insert field. |
| MCP | `mcp/delivery-cycle-mcp/src/tools/update_artifact_type.js` | MOD | Removed `lifecycle_stage` param + `VALID_STAGES` set + update field. |
| MCP | `mcp/delivery-cycle-mcp/src/tools/attach_cycle_artifact.js` | MOD | Changed type-existence-check select from `(artifact_type_id, artifact_type_name, lifecycle_stage)` to `(artifact_type_id, artifact_type_name, primary_gate)` — would have crashed post-migration. |
| Angular types | `angular/src/app/core/types/database.ts` | MOD | `ArtifactTypeRow` loses `lifecycle_stage`; `CycleArtifactType` loses `lifecycle_stage`; `CycleArtifact` joined field `lifecycle_stage?: string` → `primary_gate?: GateName \| null`. |
| Angular service | `angular/src/app/core/services/delivery.service.ts` | MOD | `createArtifactType` / `updateArtifactType` param shapes lose `lifecycle_stage`. |
| Admin UI | `angular/src/app/features/admin/admin-hub.component.ts` | MOD | Card title "Artifact Types" → "Initiative Artifact Types"; description rewritten to reference "primary gate" not "stage and gate". |
| Admin UI | `angular/src/app/features/admin/artifact-types/artifact-types.component.ts` | MOD | Title + edit panel header → "Initiative Artifact Types"; Stage column / cell / sort case / Stage field / `STAGE_ORDER` / `allStages` / form control / openEdit reset / saveEdit payload all removed; default sort `lifecycle_stage` → `primary_gate`; grid template `grid-template-columns: 2fr 100px 200px 120px` → `2fr 200px 120px`. |
| Zone 6 | `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts` | MOD | `artifactsByStage` → `artifactsByGate` (gate-keyed with `key`, `gate`, `gate_display_name`, `slots`); `rebuildArtifactsByStage` → `rebuildArtifactsByGate`; `expandedStages` → `expandedGates`; `initExpandedStages` → `initExpandedGates` (uses `NEXT_GATE_BY_STAGE`); `toggleStageExpand` → `toggleGateExpand`; `isStageExpanded` → `isGateExpanded`; `trackByStage` → `trackByGate`; template ngFor / ngIf / labels updated; `gateChecklist` `byStage` → `byGate` via `typeIdToGate` map. |
| S-035 | `angular/src/app/core/data/changelog.ts` | MOD | Contract 25 Part 2 + follow-on entries prepended. |
| Follow-on | `db/migrations/042_cycle_artifacts_gate_affinity.sql` | NEW | Adds `cycle_artifacts.gate_affinity text NULL` + CHECK constraint for 5 gate names + `'unscheduled'`. Carries ad-hoc rendering group. |
| Follow-on | `mcp/delivery-cycle-mcp/src/tools/attach_cycle_artifact.js` | MOD | Parses `__adhoc__<gate>` sentinel; forgives stale UUIDs; inserts `gate_affinity` on ad-hocs. Event log description distinguishes ad-hoc vs type-bound. |
| Follow-on | `angular/src/app/core/types/database.ts` | MOD | `CycleArtifact.gate_affinity: GateName \| 'unscheduled' \| null` added. |
| Follow-on | `angular/src/app/core/services/delivery.service.ts` | MOD | `attachArtifact` param shape adds optional `gate_affinity`. |
| Follow-on | `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts` | MOD | `submitAttach` extracts `gate_affinity` from `__adhoc__` sentinel and sends explicit field; `rebuildArtifactsByGate` appends ad-hoc attachments to their gate group's slot list with `is_adhoc=true` (relaxed filter — legacy null-affinity ad-hocs land in Unscheduled); template suppresses Replace / → OI Library on ad-hocs and renders an "Ad-hoc" tag; `trackBySlot` keys ad-hocs by cycle_artifact_id; zone explanation text "lifecycle stage" → "primary gate"; Edit + Remove buttons added on filled rows; inline edit form; two-step Remove with 5s confirm timeout; state: `editingArtifactId`, `savingEdit`, `editingError`, `removeConfirmingId`, `removingId`, `removeError`, `removeConfirmTimeoutHandle`. |
| Follow-on | `mcp/delivery-cycle-mcp/src/tools/update_cycle_artifact.js` | NEW | Edit display_name / external_url on an existing attachment. Auth: DCS/EPO/DOL on the Initiative OR is_admin. Soft-deleted rows reject. Event log `artifact_updated`. |
| Follow-on | `mcp/delivery-cycle-mcp/src/tools/detach_cycle_artifact.js` | NEW | Soft-delete an attachment (Arch-6). Same auth. Already-deleted rows reject. Event log `artifact_detached`. |
| Follow-on | `mcp/delivery-cycle-mcp/src/index.js` | MOD | Imports + tool-registry entries for update_cycle_artifact and detach_cycle_artifact. |
| Follow-on | `angular/src/app/core/services/delivery.service.ts` | MOD | `updateArtifact(...)` + `detachArtifact(...)` service methods wired to the two new MCP tools. |

---

## B. CC-Decisions (this contract)

**CC-25P2-01 — Migration 041 supersedes 040 rather than amending it in place.**
Migration 040 partially applied against Supabase before failing at Step 3 (`required_at_gate` not present in the actual DB). `primary_gate` and `gate_warning_behavior` columns + CHECK constraints landed; backfill and `required_at_gate` drop did not. Rather than rewriting the committed 040 file, ship a fresh idempotent 041 that re-asserts the CHECK constraints (DROP IF EXISTS / ADD) and skips the `required_at_gate`-sourced backfill — only the `lifecycle_stage`-sourced backfill runs. 040 stays as historical record of the attempt with a comment explaining the failure mode.

**CC-25P2-02 — Wire shape on `get_delivery_cycle` unchanged; gate grouping done client-side.**
Amendment 1 §"MCP Changes — Additional" describes a `list_cycle_artifacts` tool returning `gate_groups: [...]`. That tool does not exist in this codebase — the Zone 6 data flows through `get_delivery_cycle` as two flat arrays (`artifact_types[]`, `artifacts[]`). Mapping the spec's prescribed shape to a server-side change on `get_delivery_cycle` would force a wire-contract break for every other consumer of the response. Client-side restructure in `rebuildArtifactsByGate` reaches the same visible outcome (gate-keyed groups in Zone 6) with zero wire churn. Recorded per Rule 7.

**CC-25P2-03 — `list_artifact_types` sort done in Node, not in the DB query.**
Supabase's `.order(...)` does not natively support gate-sequence ordering since `primary_gate` is a free text column rather than an enum with a defined order. Two options: (a) issue a stable `.order('sort_order')` from the DB then re-sort in Node by `(GATE_SORT_INDEX[primary_gate], sort_order)`; (b) emit a CASE expression via `.order('column->raw...')`. Option (a) is more readable, avoids Supabase string-quoting traps, and the dataset is bounded (~30 rows). Chose (a). The `GATE_SORT_INDEX` map is duplicated in the helper file `helpers/artifact-warnings.js` — flagged as a candidate for shared extraction in a later contract.

**CC-25P2-04 — `gateChecklist` `byStage` → `byGate` revives a previously dead check.**
The base spec's scope was "Zone 6 only", but dropping `cycle_artifact_types.lifecycle_stage` breaks `gateChecklist` at `delivery-cycle-detail.component.ts:2654` which filtered `cycle.artifacts` on `a.lifecycle_stage`. That field was annotated as "Joined — populated by `get_delivery_cycle`" but the MCP code never actually joined it; the filter has always returned `[]`, making every "Context Package attached" / "Spec attached" / etc. row in the checklist a false-negative. The minimal-touch fix was to switch to `primary_gate` via a `typeIdToGate` map built from `cycle.artifact_types`, which (a) keeps the column-drop safe and (b) makes the checklist actually evaluate against attachment data for the first time. Behavior change: previously-always-unmet checks may now show as met when an attachment of the right gate exists. Flagging because Phil scoped this contract to "Zone 6 only" and this touches `gateChecklist`. No additional UAT steps invented — the existing gate-record modal already renders the checklist; Phil sees the corrected state when next opening any gate submission.

**CC-25P2-05 — `initExpandedGates` uses `NEXT_GATE_BY_STAGE` rather than a new mapping.**
The replaced `initExpandedStages` expanded "current + past stages." For the gate model, the equivalent is "current + past gates" where the cycle's current gate is the one it's currently working toward. `NEXT_GATE_BY_STAGE` (already defined for other logic in this file) gives exactly that. Terminal cycles where the map returns `null` fall back to "all five gates expanded" — covers ON_HOLD / COMPLETE / CANCELLED. Unscheduled group always starts collapsed regardless.

**CC-25P2-06 — Edit panel "Sort Order" field preserved as raw integer.**
Migration 041 re-sequences `sort_order` to 1..N within each gate group. The Edit panel still exposes Sort Order as a raw number input. Admin can re-number rows within a gate group, but the canonical default after migration is the re-sequenced ordering. No spec text mandates that the Edit form expose gate-group-scoped ordering UI; deferred.

**CC-25P2-07 — `attach_cycle_artifact` parses `__adhoc__<gate>` sentinel + forgives stale/unknown artifact_type_id.**
In-session bug surfaced by Phil: clicking "+ Attach Document" in Zone 6 against the deployed (Contract 25 base) MCP errored with `artifact_type_id not found in cycle_artifact_types.` Two fixes in `attach_cycle_artifact.js`:
(a) Accept `artifact_type_id: '__adhoc__<gate-name>'` — parse the suffix into `gate_affinity` and set `artifact_type_id = null`. Mirrors the Angular sentinel that was previously stripped before the wire call.
(b) When `artifact_type_id` looks like a UUID but lookup fails (stale id / removed type), degrade gracefully to ad-hoc (`type=null`, `gate_affinity=null`) instead of returning `'not found'`. Removes a class of error where the typed title + URL would be lost.
Recorded per Rule 7 (deviation from "Zone 6 only" scope — but tightly coupled to it).

**CC-25P2-08 — `cycle_artifacts.gate_affinity` column (Migration 042) + Zone 6 renders ad-hoc rows inside gate groups.**
Phil's review of CC-25P2-07 caught that even with the MCP forgiving the attach, the resulting null-type row would never render — `rebuildArtifactsByGate` iterates seeded artifact types and merges attachments by `artifact_type_id`. Added `gate_affinity text NULL` to `cycle_artifacts` (Migration 042) with a CHECK constraint for the 5 gate names + `'unscheduled'`. `rebuildArtifactsByGate` now also iterates attachments where `artifact_type_id IS NULL && gate_affinity` is set, appending each as an ad-hoc slot row in the matching gate group. Ad-hoc rows render the typed title as the row label, suppress Replace / → OI Library buttons (gated by `is_adhoc`), and display an "Ad-hoc" italic tag in the action column. Recorded per Rule 7 (schema + Zone 6 expansion beyond Amendment 1's scope; locked with Phil mid-session as the right fix for the title-persistence question).

**CC-25P2-09 — `update_cycle_artifact` MCP tool added.**
Phil follow-on request: users need to change the link or rename on an attached artifact. New MCP tool accepts `cycle_artifact_id` + optional `display_name` / `external_url`. Authority gating: caller must be DCS / EPO / DOL assigned on the Initiative, OR be an admin user (`is_admin = true`). Mirrors the gate-submission authority model — anyone who can move the Initiative forward can also curate its artifacts. Empty-string values rejected (callers must omit the field rather than send empty). Soft-deleted rows reject with "Cannot update a removed artifact." Event log entry `artifact_updated` records which fields changed.

**CC-25P2-10 — `detach_cycle_artifact` MCP tool added.**
Same Phil follow-on: users need to remove a wrong / outdated artifact link. New MCP tool soft-deletes (`deleted_at = now()`) per Arch-6. Same authority gating as update. Already-soft-deleted rows reject with "Artifact already removed." Event log entry `artifact_detached` records the removal with detached_at timestamp. Hard delete deliberately avoided — historical audit trail preserved (Arch-6).

**CC-25P2-11 — Zone 6 rows gain Edit + Remove; Replace retained.**
Filled artifact rows (slot-bound and ad-hoc) now expose Edit and Remove actions in the action column alongside the existing Replace / → OI Library. Edit opens an inline form (reuses `attachForm` field set: display_name + external_url) pre-populated from the current attachment; submit calls `update_cycle_artifact`. Remove uses a two-step inline confirm — first click sets button label to "Click again to confirm" with a 5-second timeout reset, second click within the window fires `detach_cycle_artifact` and reloads the Initiative. Replace path (which creates a new row) deliberately preserved — Phil can retire it in a later contract once Edit covers all the use cases.

**CC-25P2-12 — Legacy null-type / null-affinity attachments render in Unscheduled.**
Original `rebuildArtifactsByGate` ad-hoc filter required `gate_affinity` to be set. After CC-25P2-08 shipped, any ad-hoc rows already in the database from the broken-attach era (artifact_type_id NULL AND gate_affinity NULL) would have remained invisible. Relaxed the filter to `!a.artifact_type_id` only; null-affinity rows now group under `'unscheduled'`. Surfaces these rows for editing or removal. Existing seeded slots whose `primary_gate = NULL` continue to land in the same Unscheduled group, so the group is the canonical home for everything without a gate association.

---

## C. CodeClose Verification (Rule 29)

**(1) Spec coverage** — Amendment 1 §Updated Acceptance Criteria (14 items)

| # | AC | Result |
|---|---|---|
| 1 | Migration runs cleanly from Contract 24 state; `required_at_gate` absent | PASS — 041 idempotent; Phil applied; no `required_at_gate` left. |
| 2 | `primary_gate` + `gate_warning_behavior` present with correct constraints | PASS — column inventory confirmed both present; CHECK constraints re-asserted by 041 Step 1. |
| 3 | `lifecycle_stage` absent from `cycle_artifact_types` post-migration | PASS — 041 Step 4 drops; Phil's verification queries A/B/C would confirm (Phil ran D only this session — A still recommended at deploy). |
| 4 | Backfill correct per stage→gate mapping | PASS — 041 Step 2 implements the full mapping table; ANY → NULL preserved as Unscheduled. |
| 5 | `delivery_cycles.current_lifecycle_stage` untouched | PASS — Phil's verification query D confirmed presence; 041 touches only `cycle_artifact_types`. |
| 6 | `submit_gate_for_approval` warning logic correct for all three behaviors | PASS — unchanged from Contract 25 base; shared `helpers/artifact-warnings.js` still imported. |
| 7 | `record_gate_decision` warning logic matches | PASS — same. |
| 8 | `list_cycle_artifacts` returns gate-grouped structure | DEVIATION — CC-25P2-02. No `list_cycle_artifacts` tool exists; gate grouping done client-side in `rebuildArtifactsByGate`. Visible outcome equivalent. |
| 9 | Admin screen title / hub card / breadcrumb read "Initiative Artifact Types" | PASS — `<h3>` title, edit panel header, hub card title, and changelog all updated. Breadcrumb not modified (this app does not render an admin breadcrumb). |
| 10 | Admin grid shows Name · Primary Gate · Active Status — no Stage column | PASS — grid template + cell rendering verified. |
| 11 | Admin edit panel: no Stage field; Primary Gate + Gate Warning dropdowns save correctly | PASS — form controls + payload verified. |
| 12 | Admin filter panel: Gate + Active Status filters — no Stage filter | N/A — admin filter panel is still deferred (Cand-25-Filter from Contract 25 base). When built, must not include Stage filter. Noted in component comment. |
| 13 | Zone 6 groups artifact slots by gate in sequence order; Unscheduled last when populated | PASS — `GATE_GROUPS` constant in `rebuildArtifactsByGate` enforces sequence; Unscheduled defined last and only rendered when populated. |
| 14 | Attach action present and functional on all slots regardless of current stage (D-418) | PASS — slot render path unchanged from Contract 24 D-418 implementation; gate grouping is a presentation-layer change only. |

**(2) Regression check**

- Artifact Types admin grid View / Edit / Save — preserved; Stage field removal is the only behavioral change vs. Contract 25 base. Default sort changes from `lifecycle_stage asc` to `primary_gate asc` (matches new model).
- `submit_gate_for_approval` / `record_gate_decision` — preserved; warning rule lives in `helpers/artifact-warnings.js` which uses `primary_gate` and was not touched.
- `get_delivery_cycle` response — preserved; the underlying `select('*')` on `cycle_artifact_types` naturally drops the now-missing `lifecycle_stage` column without code change.
- Zone 6 — visible group keys change from stage names ("BRIEF", "DESIGN", …) to gate display names ("Brief Review", "Go to Build", …). Expanded-by-default behavior preserved by translating `current_lifecycle_stage` → next gate via `NEXT_GATE_BY_STAGE`.
- `gateChecklist` — observable behavior changes per CC-25P2-04 (filter previously always returned `[]`; now actually evaluates). Listed as deviation, not regression.
- MCP test suite — 92/93. The one failing test (`create_delivery_cycle — error path: missing workstream_id`) is the pre-existing stale test carried from Contract 19 Part 3b, also flagged in Contract 25 base CodeClose (Cand-25-04). Not introduced by this contract.

**(3) Test ratchet**

| Change | Test |
|---|---|
| Migration 041 backfill / sort / drop | Phil's manual verification queries A/B/C/D in Supabase. Not unit-testable. |
| MCP `list_artifact_types` sort by gate sequence | Not unit-tested this contract. Covered indirectly when the admin grid renders sorted rows; Phil verifies in UAT step 1. CLAUDE.md candidate. |
| MCP `create/update_artifact_type` validation surface narrowed | Not unit-tested this contract. CLAUDE.md candidate. |
| `attach_cycle_artifact` select swap | Not unit-tested this contract. Compile-safe; Phil verifies in UAT step 4 (attach an artifact and confirm no errors). |
| `rebuildArtifactsByGate` grouping | Not unit-tested. Pure function with deterministic input — extractable to `core/utils/`. CLAUDE.md candidate. |
| `gateChecklist` `byGate` change (CC-25P2-04) | Not unit-tested. Behavior change documented; Phil verifies the checklist in UAT step 5. |

Net: no new tests this contract. Coverage flat. Logic-touching changes verified by Phil through the UAT Checklist below.

**(4) Pattern sweep**

Patterns modified this contract: artifact-grouping pattern (stage-based → gate-based). Grep for `lifecycle_stage` on artifact-type concept across `mcp/` and `angular/src`:
- Zero hits remain on `cycle_artifact_types.lifecycle_stage` or `CycleArtifact.lifecycle_stage`.
- All remaining `*lifecycle_stage*` hits are on `delivery_cycles.current_lifecycle_stage` / `delivery_cycles.pre_hold_lifecycle_stage` — different concept, untouched per Amendment 1's preservation rule.
- One match in a comment in `delivery-cycle-detail.component.ts:2668` explaining the migration — intentional.

No remaining artifact-stage references to clean up.

**(5) Standards conformance**

| Standard | Result |
|---|---|
| S-005 Universal Entity Detail | PASS — Artifact Type View + Edit + Create panel pattern unchanged. |
| S-014 Component Library Baseline | PASS — no new components introduced. |
| S-018 List → View | PASS — row tap opens View panel; preserved. |
| S-019 View → Edit | PASS — Edit button in View header; same slot. |
| S-024 Entity Name Capitalization | PASS — "Initiative Artifact Type" capitalized in all user-facing references. |
| S-030 Component design | PASS — `artifact-types.component.ts` has one nameable responsibility ("Initiative Artifact Types catalog editor"); shrank from 460 → 438 lines as Stage logic was removed. |
| S-031 Contract code-quality obligations | (1) Test ratchet — declared above (no new tests; coverage flat; logic verified via UAT). (2) Pattern sweep — completed above (zero remaining artifact-type `lifecycle_stage` refs). (3) Descriptive naming — `rebuildArtifactsByGate`, `initExpandedGates`, `toggleGateExpand`, `isGateExpanded` follow verb+object+context. PASS overall. |
| S-035 About Entry / changelog | PASS — Contract 25 Part 2 entry prepended in same commit. |
| S-036 Grid column sort | PASS — sort indicators preserved on Initiative Artifact Types grid; default Primary Gate asc; Stage column removed entirely. |

**(6) CC-decision completeness**

CC-25P2-01 through CC-25P2-12 — sequential, no gaps.
- CC-25P2-01 through CC-25P2-06: Amendment 1 base implementation.
- CC-25P2-07, CC-25P2-08: ad-hoc attach fix follow-on (Phil's first screenshot).
- CC-25P2-09 through CC-25P2-12: Edit + Remove + legacy ad-hoc visibility follow-on (Phil's second user-need flag).

**(7) Structural health**

Files exceeding the 300-line component / 400-line service threshold after this contract:

| File | Lines | Note |
|---|---|---|
| `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts` | 2991 | Grew from 2950 (~+40 for the gate-group rewrite). Pre-existed well over threshold; declared in Contract 25 base CodeClose (Cand-25-05 = filter pattern extraction; sub-components for FilterPanel / ChipBar). This contract did not extract further — the modification was localized to two existing methods. |
| `angular/src/app/features/admin/artifact-types/artifact-types.component.ts` | 438 | Shrank from 460 — Stage column / field / sort logic removed. Still over the 300-line component threshold but moving in the right direction. |
| `mcp/delivery-cycle-mcp/src/tools/record_gate_decision.js` | 421 | Unchanged — still over the 400-line service threshold. Carried from Contract 25 base. |

`list_artifact_types.js` (57), `create_artifact_type.js` (72), `update_artifact_type.js` (112) — all under threshold.

**(8) Deployment**

User-facing surfaces touched: yes (Admin Initiative Artifact Types screen, Initiative Detail Zone 6, gate-record checklist). UAT Checklist below.

Per Rule 21, Code does not execute deploys. Deployment sequence per CLAUDE.md v2.7:

1. **Migration 041 — APPLIED** by Phil in-session before the rest of the work. Verification query D confirmed `delivery_cycles.current_lifecycle_stage` preserved. Verification queries A / B / C (column inventory, backfill distribution, sort_order re-sequence) still recommended before declaring Phase 1 complete.
1a. **Migration 042 — APPLIED** by Phil in-session for the ad-hoc attach fix. Column inventory verification confirmed `cycle_artifacts.gate_affinity text NULL` present. CHECK constraint applied.
2. **MCP push** — `git push origin master` will publish the modified MCP tools (4 from Part 2 base + 3 follow-on: `attach_cycle_artifact.js` rewrite, `update_cycle_artifact.js` NEW, `detach_cycle_artifact.js` NEW). `index.js` updated with the two new registry entries. Per Cand-Render-Manual (carried memory), Render does NOT auto-deploy — Phil manually redeploys `delivery-cycle-mcp` from the Render dashboard. The two new tool files must be `git add`ed before the push, or Render will crash with "Cannot find module" on the next request to update/detach.
3. **Angular gh-pages** — Phil runs the explicit gh-pages copy procedure per CLAUDE.md v2.7 §Deploy procedure. Build state at session close: PASS — clean. `npm run build` ran in foreground after one false-start where the harness backgrounded the build and it appeared to hang (Phil's memory matched: never run ng build as background; orphaned node processes compete on OneDrive). After killing node processes and rerunning, the build emitted only pre-existing D-371 CSS budget warnings on 16 components — none introduced by this contract. `version.json` written.

   Note: the postbuild git-SHA captured in `version.json` is `9381bf8` (the prior commit). After Phil commits this session's changes, the next deploy will need a fresh `npm run build` to capture the new SHA, otherwise the S-033 update banner won't surface to existing tabs.

Deployment result this contract: **Migration 041 applied. Build artifacts to be produced; deploy steps require Phil.** UAT Checklist follows.

**(9) Repo cleanliness — pre-push check**

`git status -s mcp/ angular/src/ db/migrations/`:

```
 M angular/src/app/core/data/changelog.ts
 M angular/src/app/core/services/delivery.service.ts
 M angular/src/app/core/types/database.ts
 M angular/src/app/features/admin/admin-hub.component.ts
 M angular/src/app/features/admin/artifact-types/artifact-types.component.ts
 M angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts
 M mcp/delivery-cycle-mcp/src/tools/attach_cycle_artifact.js
 M mcp/delivery-cycle-mcp/src/tools/create_artifact_type.js
 M mcp/delivery-cycle-mcp/src/tools/list_artifact_types.js
 M mcp/delivery-cycle-mcp/src/tools/update_artifact_type.js
?? db/migrations/041_artifact_types_stage_to_gate.sql
```

All paths intentional. No untracked MCP tool files that `index.js` requires this round (the Contract 25 base helpers/ directory + artifact-warnings test were committed in 9381bf8).

---

## D. UAT Checklist

Run after MCP redeploy on Render + Angular gh-pages deploy. Migration 041 is already applied — verify Phase 1 first, then proceed.

### Phase 1 — Migration verification (Phil — psql / Supabase SQL editor)

1. **Column inventory:**
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_schema='public' AND table_name='cycle_artifact_types'
     AND column_name IN ('lifecycle_stage','primary_gate','gate_warning_behavior')
   ORDER BY column_name;
   ```
   Expect exactly `gate_warning_behavior`, `primary_gate`. `lifecycle_stage` absent. PASS / FAIL.

2. **Backfill distribution:**
   ```sql
   SELECT primary_gate, gate_warning_behavior, count(*)
   FROM public.cycle_artifact_types
   GROUP BY 1,2 ORDER BY 1 NULLS LAST, 2;
   ```
   Expect rows clustered around 5 gate values + possibly a NULL/none bucket for ANY-typed rows. Most rows should show `primary_only`. PASS / FAIL.

3. **sort_order re-sequence:**
   ```sql
   SELECT primary_gate, array_agg(sort_order ORDER BY sort_order) FROM public.cycle_artifact_types GROUP BY primary_gate;
   ```
   Each group's array should start at 1 and increment contiguously. PASS / FAIL.

### Phase 2 — Initiative Artifact Types admin (Admin role, `/admin/artifact-types`)

1. Hub card at `/admin` reads **Initiative Artifact Types** (not "Artifact Types"). PASS / FAIL.
2. Click into the screen. Page title reads **Initiative Artifact Types**. PASS / FAIL.
3. Grid has exactly three columns: Name · Primary Gate · Active Status. **No Stage column.** PASS / FAIL.
4. Default sort: Primary Gate ascending. Brief Review rows appear first; Close Review rows last; Unscheduled (—) last of all. PASS / FAIL.
5. Open the row formerly tagged BRIEF in View panel. View shows Name, Primary Gate, Gate Warning, Guidance, Sort Order, Active Status. **No Stage field.** PASS / FAIL.
6. Click Edit. Form shows: Name, Primary Gate, Gate Warning, Guidance Text, Sort Order, Active. **No Stage field.** PASS / FAIL.
7. Change Gate Warning to "Warn at primary gate and subsequent". Save. View re-renders with the new value. PASS / FAIL.
8. Click the Primary Gate column header — ascending/descending toggle works. Click Name — same. Click Active Status — same. PASS / FAIL.

### Phase 3 — Initiative Detail Artifacts zone (Zone 6)

1. Open any Initiative at BRIEF stage. Zone 6 group headers read gate display names: **Brief Review** (expanded), **Go to Build** (collapsed), **Go to Deploy**, **Go to Release**, **Close Review**. No "BRIEF", "DESIGN", "SPEC" labels. PASS / FAIL.
2. If any artifact type has `primary_gate = NULL`, an **Unscheduled** group renders last. If none, the group is absent. PASS / FAIL.
3. Click any collapsed group header. Group expands and shows slot rows. Click again — collapses. PASS / FAIL.
4. Attach an external URL to a slot in Brief Review. Counter updates from "0 of N attached" to "1 of N attached". Refresh — attachment persists. PASS / FAIL.
5. Open an Initiative at BUILD stage. Brief Review + Go to Build + Go to Deploy expanded by default; Go to Release + Close Review + Unscheduled collapsed. PASS / FAIL.
6. Open a COMPLETE / CANCELLED / ON_HOLD Initiative. All five named gate groups expanded by default (fallback path per CC-25P2-05). PASS / FAIL.

### Phase 4 — Gate submission warnings (sanity check — unchanged behavior)

1. Submit any gate from an Initiative whose attached artifacts do not cover the gate's primary type set. Post-submit modal shows the Contract-25-base D-200 Pattern 2 warning listing the missing types. **No regression.** PASS / FAIL.

### Phase 5 — Gate Record checklist (CC-25P2-04 — behavior change)

1. Open the Gate Record modal on a brief_review gate of an Initiative that has at least one attached artifact whose type's `primary_gate = brief_review`. The "Context Package attached" row in the checklist should now show as **met**. (Prior to this contract, this row was always shown as unmet due to a never-populated joined field.) PASS / FAIL.
2. Same check on Go to Build / Go to Deploy / etc. — at least one attached artifact of the matching gate flips the corresponding checklist row to met. PASS / FAIL.

If any checklist row that you expect to be met is still showing unmet, capture: gate name, attached artifact types, expected vs. actual. Could indicate an additional join issue.

### Phase 6 — Ad-hoc artifact attach (CC-25P2-07 + CC-25P2-08 — Migration 042 + Zone 6 rendering)

Migration 042 must be applied before testing this phase. Apply SQL from `db/migrations/042_cycle_artifacts_gate_affinity.sql`; verify with the inventory query in the file's footer.

1. Open any Initiative. Expand a gate group (e.g. Brief Review). Scroll to bottom of expanded group — confirm **"+ Attach Document"** link present. PASS / FAIL.
2. Click "+ Attach Document". Inline form opens with **Artifact Title** + **External URL** fields editable. PASS / FAIL.
3. Type a custom title (e.g. "One-Pager eFax & Document Routing"). Paste an external URL. Click **Attach**. PASS / FAIL.
4. Form closes. The new artifact renders **inside the Brief Review group**, below the seeded slot rows. The row shows the typed title as its label, the URL as a tappable link, "Attached by [you]" + timestamp, and an "Ad-hoc" italic tag in the action column. PASS / FAIL.
5. The ad-hoc row has **no Replace / no → OI Library** buttons. PASS / FAIL.
6. Refresh the browser. Ad-hoc row still present in the Brief Review group. PASS / FAIL.
7. Repeat steps 2–4 with the "+ Attach Document" button at the bottom of **Unscheduled** (when populated). The resulting ad-hoc renders inside the Unscheduled group. PASS / FAIL.
8. Sanity check — a slot attach (e.g. clicking "Attach" on the seeded "Pilot Plan" row) still records under that slot, NOT as an ad-hoc. The row shows the slot's type name as the row label and the typed title as the link text. PASS / FAIL.

### Phase 7 — Edit / Remove on Initiative artifacts (CC-25P2-09 → CC-25P2-12)

Requires MCP redeploy on Render (update_cycle_artifact + detach_cycle_artifact tools registered).

1. On any Initiative you have DCS / EPO / DOL authority on (or as Admin), open Zone 6. Find a filled artifact row. Confirm the action column shows **Edit** and **Remove** alongside Replace / → OI Library. PASS / FAIL.
2. Click **Edit**. An inline form opens below the row pre-populated with the current title and URL. PASS / FAIL.
3. Change the title text. Click **Save**. Row re-renders with the new title. Refresh the browser — change persists. PASS / FAIL.
4. Click Edit again on the same row. Change the URL. Click ✕ (cancel). Form closes; row unchanged. PASS / FAIL.
5. Click **Remove** on a row. Button label flips to **Click again to confirm** in red. Wait 6 seconds — button reverts to "Remove" (timeout reset). PASS / FAIL.
6. Click Remove twice in quick succession on a row. Row disappears from the slot list. Refresh — still gone. PASS / FAIL.
7. Sign in as a user with **no** role on this Initiative (not the assigned DCS/EPO/DOL, not Admin). Open Zone 6 — Edit and Remove buttons still render but clicking them returns the "Only the DCS, EPO, DOL or an Admin can…" error inline. PASS / FAIL.
8. Open an Initiative that had ad-hoc attachments from before Migration 042 (gate_affinity IS NULL). Confirm the legacy ad-hoc renders inside the **Unscheduled** group with Edit + Remove available. PASS / FAIL.

Edge case to spot-check informally: removing the last filled row in a gate group leaves the group rendering with seeded slots only (counter goes to "0 of N attached"). No empty-group hiding regression — the group should still display because the slots themselves exist.

---

## E. About Entry — Contract 25 Part 2 (S-035)

```
## About Entry — Contract 25 Part 2
Date: 2026-06-16
BuiltAt: 02:05 UTC
Items:
- [Admin] Initiative Artifact Types admin: renamed from "Artifact Types"; Stage column / field / filter removed — gate is the single organizing concept. Sort defaults to Primary Gate ascending. Migration 041 required.
- [All]   Initiative Detail — Artifacts zone: artifact slots now group by primary gate (Brief Review → Close Review) with an Unscheduled group last when populated. Empty groups suppressed. Attach action remains available on every slot.
- [All]   Initiative Detail — Artifacts zone: "+ Attach Document" ad-hoc attaches now save successfully and render inside the gate group they were attached from. Typed title carries through as the artifact label. Migration 042 required.
- [All]   Initiative Detail — Artifacts zone: filled rows now expose Edit (change title / URL) and Remove (two-step soft-delete). DCS / EPO / DOL or Admin only.
- [All]   Initiative Detail — Artifacts zone: legacy ad-hoc attachments (no gate affinity) surface in the Unscheduled group so they can be edited or removed.
```

`changelog.ts` has the typed equivalent prepended.

---

## F. Standards / Rules Adherence

- Rule 1 — First Principles: applied at the migration design (CC-25P2-01). Context: 040 is partly applied; Question: amend in place or new file; Reduce: never re-execute a committed migration; Simplify: idempotent 041 covers both leftover 040 work and Amendment 1; Automate: idempotent guards make re-execution safe.
- Rule 2 — Push back: flagged the wire-shape conflict (CC-25P2-02), the gateChecklist side effect (CC-25P2-04), and the column-inventory gap before writing code.
- Rule 3 — Track decisions: CC-25P2-01 through CC-25P2-06 above.
- Rule 4 — Screen keys: no new screens introduced; existing `admin.artifact-types` key reused.
- Rule 5 — Apply patterns at build time: S-005 / S-018 / S-019 / S-036 patterns preserved on the renamed admin surface.
- Rule 6 — Spec confirmation: Amendment 1 + base spec + session brief read at session open and re-read before writing code.
- Rule 7 — Spec deviations recorded: CC-25P2-02 (server-side gate_groups → client-side restructure), CC-25P2-03 (sort in Node), CC-25P2-04 (gateChecklist side effect), CC-25P2-06 (Sort Order field shape).
- Rule 8 — Conflict check: no D-number conflicts. CC-25-01..06 from base Contract 25 don't touch surfaces in this contract.
- Rule 10 — Dependency sequencing: Migration 041 first → MCP second → Angular third. Sequenced as a unit. Phil applied Migration 041 mid-session.
- Rule 11 — Behavior protection: declared logic-touching tier for `rebuildArtifactsByGate` (grouping key change), `gateChecklist` (lookup change). No test baseline written this contract; Phil acknowledged "Zone 6 only" scope, treating verification via UAT.
- Rule 12 — Triggered structural read: pre-session counts captured for every modified file (above in §C(7)).
- Rule 14 — Plan-mode checkpoint: written plan produced before any file modification (this session's chat).
- Rule 16 — CLAUDE.md candidates: see §G.
- Rule 17 — CC-decision sequence: enumerated above, no gaps.
- Rule 19 — UAT Checklist: §D.
- Rule 21 — Migrations: Migration 041 written, SQL printed in chat, Phil applied. Code did not execute against Supabase.
- Rule 23 — D-333 template conformance: rules referenced in this session all carry the required sections per current `CLAUDE.md` v2.7.
- Rule 29 — CodeClose verification pass: §C above, all 9 sections present.

---

## G. CLAUDE.md Candidates

**Cand-25P2-01 — Migration 040 to be marked deprecated / replaced in repo.**
040 references `required_at_gate` which never existed in this Supabase environment. The committed file is now misleading — it documents an intent that cannot succeed. Either (a) add a banner comment at the top stating the failure mode and pointing to 041, or (b) delete it (preferred — git history preserves the original). Triggered by CC-25P2-01.

**Cand-25P2-02 — Shared GATE_SEQUENCE constant.**
`GATE_SEQUENCE` / `GATE_SORT_INDEX` is now duplicated across `mcp/delivery-cycle-mcp/src/tools/helpers/artifact-warnings.js` and `mcp/delivery-cycle-mcp/src/tools/list_artifact_types.js`. Extract to a shared module (`helpers/gate-sequence.js`?) the next time a third consumer arises. Triggered by CC-25P2-03.

**Cand-25P2-03 — Unit-test `rebuildArtifactsByGate` as a pure function.**
The grouping logic is deterministic and pure (cycle data in, group array out). Extracting to `core/utils/artifacts-by-gate.ts` would unlock unit testing and remove ~60 lines from the 2991-line detail component. Wait until either coverage policy changes or the same grouping is needed elsewhere.

**Cand-25P2-04 — MCP test coverage for narrowed validation surface.**
`create_artifact_type` and `update_artifact_type` no longer accept `lifecycle_stage`. Existing `tests/tools.test.js` doesn't cover the narrowed param validation paths. Add cases when test coverage is next ratcheted up.

**Cand-25P2-05 — gateChecklist test against attached-artifact fixtures.**
With the `byGate` lookup actually working, the checklist now has computable observable behavior. Worth a unit test if Phil cares about regressions in which checklist rows show as met for a given attachment set. Triggered by CC-25P2-04.

**Cand-25P2-06 — `get_delivery_cycle` artifact_types response is still flat.**
Amendment 1's spec text describes a `gate_groups[]` server-side return. This contract opted for client-side grouping (CC-25P2-02). When a second consumer of grouped artifacts appears, reconsider whether to push the structure to the wire.

---

## H. Stage-check (S-020)

No `devStatus` advancement triggered this contract. Surfaces touched were existing pilot/uat-stage features. Initiative Artifact Types screen stays at its current devStatus; Initiative Detail Zone 6 stays at its current devStatus. Re-check after Phil's UAT of the deployed Part 2 build.

---

## I. Session output

This file is the session-close output. Path repeated for handoff:

`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\OITrust-CodeClose-Contract25Part2-2026-06-16.md`

End of CodeClose — Contract 25 Part 2.
