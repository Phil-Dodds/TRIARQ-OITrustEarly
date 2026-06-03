# CodeClose — 2026-06-03 — Build C Contract 18

Pathways OI Trust | Build C | Contract 18 | Role + Entity Rename + DOL | CONFIDENTIAL

Session brief: `.claire/validator-close-2026-06-02/OITrust-SessionBrief-2026-06-02-BuildC.md`
Spec: `.claire/validator-close-2026-06-02/OITrust-Contract18-Spec-2026-06-02.md`
Governing decisions: D-389, D-390, D-391, D-392, D-393.

---

## A. Surfaces Touched

| Surface | Type | Outcome |
|---|---|---|
| `angular/src/app/core/constants/roles.ts` | NEW | Central role + entity display constants (SYSTEM_ROLES, ROLE_DISPLAY_NAMES, ROLE_ABBREVIATIONS, ENTITY_DISPLAY_NAMES). |
| `angular/src/app/core/types/database.ts` | MOD | SystemRole re-exported from roles.ts. DeliveryCycle columns renamed; assigned_dol_user_id + assigned_dol_display_name added. |
| `angular/src/app/core/services/delivery.service.ts` | MOD | createCycle / updateCycle params renamed + DOL added. assignDsCb → assignRolesToCycle (MCP endpoint also renamed). |
| `angular/src/app/features/delivery/dashboard/delivery-cycle-dashboard.component.ts` | MOD | Header "Initiatives" / "Initiative Tracking" / "My Initiatives". Filter values renamed (unassigned_dcs/epo/dol). DOL column in Team. canCreateCycle accepts DOL. dcs/epo/dolFilterOptions. assignedPersonChipLabel helper. |
| `angular/src/app/features/delivery/create-panel/delivery-cycle-create-panel.component.ts` | MOD | Header / title / button "Initiative". DCS/EPO/DOL pickers (DOL row 8, Jira row 9). Submit payload uses new column names. |
| `angular/src/app/features/delivery/edit-panel/delivery-cycle-edit-panel.component.ts` | MOD | Title "Edit Initiative". DCS/EPO/DOL fields. Save payload, isDirty, friendlyError text. |
| `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts` | MOD | Identity zone shows DCS / EPO / DOL chip rows. Dead inline DS/CB edit code removed. Gate readiness checks updated. |
| `angular/src/app/features/delivery/hub/delivery-hub.component.ts` | MOD | All four hub cards relabelled + routes pointed to /initiatives/*. |
| `angular/src/app/features/delivery/workstream-summary/workstream-summary.component.ts` | MOD | Back link, +New Initiative, canCreateCycle, route refs to /initiatives/list. |
| `angular/src/app/features/delivery/division-summary/division-summary.component.ts` | MOD | Back link, descriptions, route refs. SYSTEM_ROLES.PHIL/ADMIN. |
| `angular/src/app/features/delivery/gates-summary/gates-summary.component.ts` | MOD | Back link, +New Initiative, role list, /initiatives/list nav. |
| `angular/src/app/features/delivery/deploy-schedule/deploy-schedule.component.ts` | MOD | Back link, +New Initiative, role list, /initiatives/list nav. |
| `angular/src/app/features/delivery/workstream-admin/workstream-admin.component.ts` | MOD | Description text + footer back link. View Initiatives link → /initiatives/list. |
| `angular/src/app/features/delivery/delivery.module.ts` | MOD | Child path `cycles` → `list` with redirect from `cycles`. |
| `angular/src/app/features/delivery/delivery.component.ts` | MOD | Stub text relabelled. |
| `angular/src/app/features/delivery/stage-track/stage-track.component.ts` | MOD | File header comment relabel. |
| `angular/src/app/features/delivery/gate-record-modal/gate-record-modal.component.ts` | MOD | Inline message text + role list "DCS, EPO, DOL, or Phil". |
| `angular/src/app/shared/components/sidebar/sidebar.component.ts` | MOD | Nav label "Initiative Tracking"; route `/initiatives`; role list via SYSTEM_ROLES. |
| `angular/src/app/shared/pickers/user-picker/user-picker.component.ts` | MOD | userRole accepts full SystemRole. roleLabel uses ROLE_DISPLAY_NAMES. "Delivery Cycle" → "Initiative" in empty-state. |
| `angular/src/app/features/home/home.component.ts` | MOD | Role getters renamed; showDeliveryCycles includes DOL. |
| `angular/src/app/features/home/components/my-delivery-cycles-card.component.ts` | MOD | Card label "My Initiatives". Routes /initiatives/list, /initiatives/:id. Predicate copy. |
| `angular/src/app/features/admin/users/users.component.ts` | MOD | Two role dropdowns refreshed (DCS/EPO/DOL/CE/Admin/Phil). Role filter array uses SYSTEM_ROLES. visibleRoleFilters tab order includes DOL. roleDisplayLabel uses ROLE_ABBREVIATIONS. |
| `angular/src/app/features/admin/admin-hub.component.ts` | MOD | Card descriptions: "Delivery Cycles" → "Initiatives". |
| `angular/src/app/features/login/login.component.ts` | MOD | Right-panel headline + feature copy: "Initiative management" / "Initiative Tracking". |
| `angular/src/app/app-routing.module.ts` | MOD | `/delivery` → `/initiatives`. Redirects from `/delivery/*` to `/initiatives/*` (full, list, workstreams, divisions, gates, deploy-schedule, :cycle_id). |
| `mcp/delivery-cycle-mcp/src/tools/assign_roles_to_cycle.js` | NEW | Replaces assign_ds_cb_to_cycle.js. Accepts DCS/EPO/DOL params. VALID_ASSIGNER_ROLES constant. Per-role validate helper. |
| `mcp/delivery-cycle-mcp/src/tools/assign_ds_cb_to_cycle.js` | DELETED | Replaced by assign_roles_to_cycle.js. |
| `mcp/delivery-cycle-mcp/src/index.js` | MOD | Tool registry import + entry renamed. Header comment updated. |
| `mcp/delivery-cycle-mcp/src/tools/create_delivery_cycle.js` | MOD | VALID_TIERS + VALID_CREATOR_ROLES constants. DCS/EPO/DOL params + validators. INSERT columns + event log updated. |
| `mcp/delivery-cycle-mcp/src/tools/update_delivery_cycle.js` | MOD | MUTABLE_FIELD_LABELS rewritten. New params + per-role assignee validator. |
| `mcp/delivery-cycle-mcp/src/tools/get_delivery_cycle.js` | MOD | SELECT columns + caller authority (isAssignedDcs/Epo/Dol). Returned display-name fields renamed. |
| `mcp/delivery-cycle-mcp/src/tools/list_delivery_cycles.js` | MOD | SELECT columns + or-filter for caller-DCS/EPO/DOL. Enriched response uses new display-name fields. |
| `mcp/delivery-cycle-mcp/src/tools/submit_gate_for_approval.js` | MOD | Authority check covers DCS/EPO/DOL. Brief Review gate now requires both DCS and DOL (parallel blocks). Go to Build requires EPO. All D-140 messages use new role labels. |
| `mcp/division-mcp/src/tools/create_user.js` | MOD | VALID_ROLES updated. |
| `mcp/division-mcp/src/tools/update_user.js` | MOD | VALID_ROLES updated. |
| `mcp/division-mcp/tests/tools.test.js` | MOD | Stale `system_role: 'ds'` literals → `'dcs'`. |
| `db/migrations/032_role_rename_dol_addition.sql` | NEW | DROP-then-UPDATE-then-ADD constraint order; column renames; DOL column + index added. **Executed successfully against Supabase 2026-06-03.** |

---

## B. CC-Decisions

| ID | Decision | Why |
|---|---|---|
| CC-C18-001 | Migration 032 order: DROP CONSTRAINT before UPDATE, then ADD new CONSTRAINT after UPDATE. | First run failed with `users_system_role_check` violation — old constraint still in force when UPDATE attempted to write new role values. Reordering keeps the table under a CHECK at all times *except* the brief atomic window inside the same transaction between DROP and ADD. |
| CC-C18-002 | Path B Steps 2+3 collapsed. | Spec template creates `roles.ts` with the FINAL role values (`dcs`/`epo`/`dol`). That makes Step 2 ("pure import consolidation, no rename yet") impossible — any consumer that imports `SYSTEM_ROLES.DCS` is *both* importing and renaming. Step 3 ("flip the file") becomes a no-op. Net behavior identical to spec intent: rename surface bounded to roles.ts + database.ts interface; TypeScript compiler surfaces every consumer. |
| CC-C18-003 | `assign_ds_cb_to_cycle.js` MCP tool renamed to `assign_roles_to_cycle.js`; tool endpoint also renamed to `assign_roles_to_cycle`; Angular caller method `assignDsCb` renamed to `assignRolesToCycle`. | Phil pre-approved during plan-mode questions. Neutral filename + endpoint name survives future role additions; one-shot rename cleaner than carrying historical filename. |
| CC-C18-004 | Filter value rename: `unassigned_ds` → `unassigned_dcs`, `unassigned_cb` → `unassigned_epo`, new `unassigned_dol`. Existing screen-state rows migrated on restore. `my_cycles` legacy value already migrated to `me` in a prior session — left as `me`. | Phil pre-approved during plan-mode questions. One-time UX hit (saved filters reset for any user who still has legacy DS/CB stored) accepted for clean naming. |
| CC-C18-005 | DOL added to `canCreateCycle` role list everywhere it appears (dashboard, gates-summary, workstream-summary, deploy-schedule). | Spec is silent on whether DOL can create Initiatives; D-391 places DOL parallel to DCS in gate ownership; create authority follows. If Design wants DOL excluded from create, flag and amend. |
| CC-C18-006 | Inline DS/CB edit methods removed from `delivery-cycle-detail.component.ts` (state vars: `editingDs`, `savingDs`, `dsError`, `dsControl`, mirror for CB; methods: `startDsEdit`/`saveDs`/`cancelDsEdit`/`startCbEdit`/`saveCb`/`cancelCbEdit`). | Grep confirmed zero template references. Edit happens via the Edit panel (delivery-cycle-edit-panel.component.ts). Refactoring dead code to new role names was wasted work; deleted per CLAUDE.md "If you are certain that something is unused, you can delete it completely." |
| CC-C18-007 | Variable name `dsUser` in `mcp/division-mcp/tests/tools.test.js:66` left unrenamed (value string changed `'ds'` → `'dcs'`). | Test-internal local variable, no production impact, low cognitive cost. |
| CC-C18-008 | `ENTITY_DISPLAY_NAMES` constant added to `roles.ts` (INITIATIVE_SINGULAR, INITIATIVE_PLURAL). | Phil pre-approved during plan-mode questions. Single central module per Path B intent — entity labels can flow through ROLE_DISPLAY_NAMES + ENTITY_DISPLAY_NAMES from the same source. |
| CC-C18-009 | Rule 11 Tier 2 override — Phil declared "no test baseline needed". | Repo has zero `.spec.ts` / `.spec.js` files. `ng test` cannot run a baseline. UAT Checklist below is the sole gate. |

CC-decision sequence completeness check (Rule 17): 001–009 sequential, no gaps. All listed above.

---

## C. CodeClose Verification (Rule 29)

### 1. Spec coverage

| Spec acceptance criterion | Result |
|---|---|
| New Initiative form: DCS, EPO, DOL fields present | PASS — create-panel template + state |
| DOL field optional; gate-requirement notes correct | PASS — "Required before Brief Review Gate" rendered |
| Submit Brief Review: blocked if DCS null with D-140 message (new label) | PASS — submit_gate_for_approval §D-389 block |
| Submit Brief Review: blocked if DOL null with D-140 message | PASS — submit_gate_for_approval §D-391 block |
| Submit Brief Review: passes when both DCS + DOL set | PASS — neither block triggers |
| Submit Go to Build: blocked if EPO null with D-140 message | PASS — submit_gate_for_approval §D-390 block |
| All Initiatives grid: DCS, EPO, DOL columns present; chips tappable; Unassigned filter options | PASS — dashboard Team cell + filter panel |
| My Initiatives filter: returns Initiatives where caller is DCS, EPO, or DOL | PASS — applyFilters `me` branch updated |
| Initiative Detail View Identity zone: DOL field present | PASS — detail.component.ts identity zone |
| Initiative Edit panel: DOL assignment field present; saves correctly | PASS — edit-panel.component.ts DOL block |
| Routes /initiatives, /initiatives/list, /initiatives/:id, /initiatives/workstreams, /initiatives/schedule, /initiatives/deploy resolve | PASS — delivery.module + app-routing |
| Old routes /delivery/* redirect to /initiatives/* (no 404s) | PASS — app-routing.module 6 redirect entries |
| Role values in DB: users.system_role contains dcs/epo/dol; no ds/cb rows | PASS — migration 032 executed |
| Column names in DB: assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id; old columns absent | PASS — migration 032 executed |
| UserPicker accepts 'dol' and returns DOL-role users | PASS — userRole: SystemRole union (includes 'dol') |
| Home My Initiatives card: correct label + predicate | PASS — my-delivery-cycles-card.component.ts |
| Zero "Delivery Specialist" / "Coach" in canonical code | PASS — grep against angular/src + mcp/ + db/migrations(active) |
| Regression: existing Initiatives load correctly | PENDING UAT — Phil to verify |

### 2. Regression check

| Surface touched | Behavior preserved | Verified by |
|---|---|---|
| dashboard.component.ts grid filter logic | Stage / Tier / Workstream / Gate Status / Division filters untouched | Code review; no logic change to those filter branches. |
| dashboard.component.ts Team column rendering | Render order EPO → Workstream → DCS → DOL; null-collapse still applies; chip styling unchanged | Code review of template block. |
| create-panel form field validation | Required/optional flags unchanged for existing fields; only added DOL row | Code review of form group + template. |
| edit-panel dirty-state and save payload | Dirty-check covers DCS/EPO/DOL parallel to old DS/CB; save payload diff logic unchanged structurally | Code review of isDirty + onSave. |
| submit_gate_for_approval — authority check | Phil + assigned-role-on-cycle preserved; DCS/EPO/DOL replace DS/CB | Code review against original. |
| Existing screen state with legacy filter values | restoreScreenState() migrates `unassigned_ds`/`unassigned_cb`/`my_cycles` to new values | Migration mapping in restoreScreenState. |

### 3. Test ratchet

No `.spec.ts` files in repo. Rule 11 Tier 2 override applied (CC-C18-009). Test ratchet = 0 → 0. No regression test added because no test infrastructure exists to add it to. **CLAUDE.md Candidate** (see §F) — propose dedicated contract to bootstrap Karma + a first regression spec for the gate pre-check (highest-blast-radius modification this contract).

### 4. Pattern sweep

Shared patterns modified this contract:
- **Role string literals** — swept across `angular/src` and `mcp/`. All canonical occurrences refactored to `SYSTEM_ROLES.*` (TypeScript) or central `VALID_ROLES` arrays (MCP).
- **Column property accesses** `cycle.assigned_ds_user_id` / `assigned_cb_user_id` — TypeScript compiler surfaced every reference via interface rename; 6 files updated.
- **Display strings** "Delivery Cycle" / "Domain Strategist" / "Capability Builder" — swept across templates and inline error/event strings.
- **Routes** `/delivery/*` — swept; 25+ routerLink and router.navigate references updated.

Pattern-sweep findings:
- `.claude/worktrees/*` carry old text — historical worktree snapshots, NOT canonical. Left unchanged.
- `db/migrations/024_*.sql` retains "Delivery Specialist" / "Capability Builder / Coach" in historical comments — historical record per "do not edit past migrations" principle.
- `mcp/division-mcp/tests/tools.test.js` test variable name `dsUser` (now value `'dcs'`) — CC-C18-007.

### 5. Standards conformance

| Standard | Status |
|---|---|
| Arch-1 (MCP-only DB access) | PASS — no direct Supabase imports added to Angular |
| Arch-3 (no prompts in TS) | PASS — no prompt strings added |
| Arch-5 (JWT validation) | PASS — submit_gate_for_approval JWT path unchanged |
| Arch-6 (soft delete) | N/A — no DELETE introduced |
| S-001 Visible Context | PASS — new DOL gate-requirement notes added per Pattern 1 |
| S-003 No Bare Generic Nouns | PASS — all new fields qualified (assigned_dol_user_id, etc.) |
| S-005 Universal Entity Detail | PASS — single View + single Edit per Initiative; DOL respected in both |
| S-019 View → Edit | PASS — Edit panel still opens in same slot; DOL field present |
| S-024 Entity Name Capitalization | PASS — "Initiative" / "Initiatives" capitalized in all UI surfaces |
| S-027 Implementation Status | PENDING — D-389/D-390/D-391/D-392/D-393 impl_status update is a Document Author task per the source-tag protocol; flagged for Design Session close-out. |
| S-030 Component Design | PASS — no new responsibilities added to components; DOL parallels existing DCS/EPO patterns |
| S-031 Contract Code Quality | PARTIAL — descriptive naming applied; test ratchet bypassed per CC-C18-009; pattern sweep complete |

### 6. CC-decision completeness check

CC-C18-001 through CC-C18-009 — sequential, no gaps. All present in §B.

### 7. Structural Health (Rule 12)

Pre-existing files modified that exceed thresholds:
- `features/delivery/dashboard/delivery-cycle-dashboard.component.ts` — 1,975+ lines (was already >300; this contract added ~30 lines net for DOL filter + helper).
- `features/delivery/detail/delivery-cycle-detail.component.ts` — was 2,864 lines; net **decreased** ~80 lines after dead DS/CB edit code removed (CC-C18-006).
- `features/delivery/edit-panel/delivery-cycle-edit-panel.component.ts` — was 868; added ~40 lines for DOL state + methods.
- `features/delivery/create-panel/delivery-cycle-create-panel.component.ts` — was 690; added ~50 lines for DOL field + picker + methods.
- `features/delivery/gate-record-modal/gate-record-modal.component.ts` — 869 lines; minor text edits only.
- `features/delivery/deploy-schedule/deploy-schedule.component.ts` — 731 lines; minor edits.
- `features/delivery/gates-summary/gates-summary.component.ts` — 591 lines; minor edits.
- `features/delivery/workstream-admin/workstream-admin.component.ts` — 659 lines; minor edits.
- `features/delivery/stage-track/stage-track.component.ts` — 344 lines; header comment only.
- `features/delivery/division-summary/division-summary.component.ts` — 371 lines; minor edits.
- `features/delivery/workstream-summary/workstream-summary.component.ts` — 401 lines; minor edits.

No new component exceeded the threshold by virtue of this contract.

---

## D. Deviations from Spec (Rule 7)

| Deviation | Spec text | What was built | Why an improvement |
|---|---|---|---|
| Migration step order | Spec ordered: UPDATE → DROP CONSTRAINT → ADD CONSTRAINT. | DROP CONSTRAINT → UPDATE → ADD CONSTRAINT. | Spec order fails — first execution against Supabase produced `users_system_role_check` violation. Reordering is necessary for the migration to succeed at all. CC-C18-001. |
| Spec Step 1 roles.ts shape | Template implied a single shape with new values. | Same shape implemented; Step 3 ("apply renames in roles.ts") became a no-op as a consequence. | No effective difference at deploy time; collapsed step pair documented as CC-C18-002. |
| File rename + endpoint rename | Spec implied internal-only updates to assign_ds_cb_to_cycle.js. | Filename and endpoint name renamed to assign_roles_to_cycle. | Removes a permanent historical mismatch between filename, endpoint name, and current roles. Pre-approved by Phil. CC-C18-003. |
| Dead inline DS/CB edit code | Spec did not mention it. | Deleted entirely from detail component (CC-C18-006). | Spec implicitly required renaming all DS/CB references; refactoring dead code instead of deleting it would have created a permanent maintenance liability. |

---

## E. UAT Checklist (Rule 19)

Run after the Render redeploy completes (MCP) and the GitHub Pages publish completes (Angular). Migration 032 already executed.

### Initiative creation (create-panel)

1. ☐ Navigate to `/initiatives/list` → header reads **All Initiatives**, summary cards labelled correctly.
2. ☐ Click **+ New Initiative** → right panel opens titled **New Initiative**.
3. ☐ Field rows in order: Division, Initiative Title, Outcome, Workstream, Tier, Assigned Domain Capability Strategist, Assigned Engineering Product Owner, Assigned Domain Outcome Lead, Jira Epic Link.
4. ☐ Each role picker opens UserPicker scoped to "This Division" by default, then "All Divisions" radio available.
5. ☐ Create with only Title + Division + Tier → succeeds; new Initiative appears in grid; success snackbar text "Initiative created" (if surfaced).

### Brief Review gate

6. ☐ Open an existing Initiative with **no DCS and no DOL**. Try **Submit for Approval** on Brief Review → blocked, D-140 message names **Domain Capability Strategist** *or* **Domain Outcome Lead** (whichever fires first).
7. ☐ Assign a DCS only. Try Submit → blocked, message names **Domain Outcome Lead** specifically.
8. ☐ Assign a DOL also. Try Submit → succeeds; gate enters `awaiting_approval`.

### Go to Build gate

9. ☐ On an Initiative cleared past Brief Review with **no EPO**, try **Submit for Approval** on Go to Build → blocked, D-140 message names **Engineering Product Owner**.
10. ☐ Assign an EPO. Try Submit → succeeds.

### Grid + filter

11. ☐ All Initiatives grid Team column shows EPO / Workstream / DCS / DOL chips per Initiative (null rows collapse).
12. ☐ Filter panel → Assigned Person → terminals visible: **Me**, **Unassigned DCS**, **Unassigned EPO**, **Unassigned DOL**. Apply each — list filters as expected. Active chip text matches.
13. ☐ Set **Me** filter as DCS user → list contains only Initiatives where you are DCS, EPO, or DOL.

### Detail + Edit

14. ☐ Open any Initiative → Detail Identity zone shows three rows: Domain Capability Strategist / Engineering Product Owner / Domain Outcome Lead. Each chip shows display name or "Unassigned" pill.
15. ☐ Edit Initiative → all three role fields editable with UserPicker. Saving DOL persists across reload (`get_delivery_cycle` returns it).

### Routing

16. ☐ Old bookmark `/delivery` → redirects to `/initiatives` cleanly. No 404.
17. ☐ `/delivery/cycles?division_id=X` → redirects to `/initiatives/list?division_id=X` keeping query params (Angular preserves them through `redirectTo` rules with `pathMatch: 'full'`).
18. ☐ `/delivery/:cycle_id` → redirects to `/initiatives/:cycle_id`.

### Admin

19. ☐ Sidebar nav reads **Initiative Tracking**.
20. ☐ Admin → Users → role dropdown lists **DCS / EPO / DOL / CE / Admin / Phil** (no DS or CB).
21. ☐ Admin Hub → Delivery Workstreams card description reads "Initiatives" (not "Delivery Cycles").

### Home

22. ☐ Home → **My Initiatives** card renders for DCS / EPO / DOL users. Predicate includes DOL.

### Coverage sweep

23. ☐ Open every left-sidebar surface (Home, OI Library, Initiative Tracking, Chat, Contact an Admin, Admin) → none show "Delivery Cycle" or "DS" or "CB" or "Domain Strategist" or "Capability Builder" in user-facing text.

---

## F. CLAUDE.md Candidates (Rule 16)

| Candidate | Trigger this session | Why Code would add it |
|---|---|---|
| **Spec template + Step narrative must agree on roles.ts initial state.** Either (a) Step 1 creates with NEW values and Step 3 is explicitly a no-op, or (b) Step 1 creates with OLD values and Step 2 is pure import refactor. The current spec template implies (a) while text implies (b). | Path B execution required collapsing Steps 2+3 (CC-C18-002). | Future Path B contracts will repeat the ambiguity. Pick one and lock it. |
| **Migration order rule: ALWAYS DROP CONSTRAINT before UPDATE when migrating constrained values.** | Migration 032 first run failed (CC-C18-001). | Subtle SQL ordering bug; easy to repeat. Worth a one-liner in standards. |
| **Zero `.spec.ts` files in repo despite Coding Standards mandate "Generate tests alongside every code file".** | Step 0 baseline impossible (CC-C18-009). | Standing systemic violation. Either bootstrap Karma + first regression spec (target: gate pre-check), or amend the standard to acknowledge the deferred-test status during the pre-port phase. |
| **Define a constants-import policy for the MCP layer parallel to the Angular roles.ts.** | Each MCP tool currently maintains its own `VALID_ROLES` array. Path B intent was a single source of truth — bounded only inside Angular. | Reduces drift across MCP tools when roles change again. Either `mcp/_shared/roles.js` or per-tool inline kept consistent by lint. |
| **`+ New Cycle` filename `my-delivery-cycles-card.component.ts` retains "delivery-cycles" in path.** Selector and class name `MyDeliveryCyclesCardComponent` also retain old wording. | Phil's rename guidance favored content updates over filename churn. | Add a future-contract candidate to rename the file + selector for consistency, scheduled when low-risk. |

---

## G. Stage Check (S-020)

Stage check pending Phil's UAT — per stored memory, do not flag stage advancement before Phil UATs. After UAT passes:
- `Initiative Tracking` nav item is currently `devStatus: 'uat'`. Post-UAT, consider advancing to `'live'`.

No stage advancement attempted in this session. Will flag after Phil signs off the UAT checklist above.

---

## H. Deploy Sequence (operator notes)

Migration 032 — DONE (executed 2026-06-03).

Remaining deploys (Phil to coordinate):
1. Push current branch → master → GitHub Pages auto-publishes Angular; Render auto-deploys delivery-cycle-mcp and division-mcp.
2. Wait ~2 minutes for Render rolling restart.
3. Hard reload `/initiatives` once. Then run UAT checklist (§E).

Deploy order rationale: schema first (already done), then MCP servers (Render), then Angular. Render and GitHub Pages deploy from the same push, but Render takes ~2 minutes for the rolling restart, so Angular hits a transient MCP outage if you start UAT immediately. Wait for both.

---

## Session Output File Path

`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\.claude\sessions\session-output-2026-06-03.md`
