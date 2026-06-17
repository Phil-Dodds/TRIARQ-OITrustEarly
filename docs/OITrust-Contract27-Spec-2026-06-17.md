<!-- SECTION-H: passthrough to for-ClaudeCode.zip — do not edit -->
# Contract 27 Specification — Roadmap Planning Mode

**Governing decisions:** D-444 (Deploy Roadmap Baselines registry), D-445 (Quarter Pivot Control), D-446 (Prior Quarter Planned vs. Actual Analysis)
**Build:** C — Contract 27
**Spec date:** 2026-06-17
**Prerequisites:** Contract 26 (AC-29) closed. Build C canonical set current.

**Scope:** Three workstreams.
- Workstream 1 — D-444: New `roadmap_freeze_dates` table + four MCP tools + Admin screen `/admin/deploy-baselines`
- Workstream 2 — D-445: Quarter Pivot Control on both deploy gate views
- Workstream 3 — D-446: Baseline selector + prior quarter planned vs. actual symbol rendering on both deploy gate views

**Build order:** Workstream 1 first (schema migration, then MCP tools, then Admin UI). Workstreams 2 and 3 in parallel after Workstream 1 MCP is deployed — both touch the same two view components; complete one view end-to-end before starting the other. EPO Deploy (`/initiatives/epo-deploy`) first, then Workstream Deploy (`/delivery/deploy-schedule`).

**Rule 17 supersession declaration:** This spec is additive to the existing EPO Deploy and Workstream Deploy specs in build-c-spec.md §5.8 and the D-419 amendments. It does not supersede those sections — all prior spec content remains operative. This spec adds the quarter pivot control and baseline selector to both views. Where this spec and the prior spec conflict on the same element, this spec governs.

---

## Workstream 1 — D-444: Deploy Roadmap Baselines Registry

### Schema Migration

New migration file. Run after Contract 26 migration (or current latest migration if Contract 26 has no migration).

**Read the current latest migration number before writing the file.** Name the file `NNN_roadmap_freeze_dates.sql` where NNN is the next sequential number.

```sql
-- Create roadmap_freeze_dates table
CREATE TABLE public.roadmap_freeze_dates (
  freeze_date_id  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  freeze_date     date        NOT NULL,
  freeze_label    text        NOT NULL CHECK (char_length(freeze_label) <= 100),
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid     NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  CONSTRAINT uq_roadmap_freeze_date UNIQUE (freeze_date)
);

-- RLS: enabled; any authenticated user may read; only service role writes (MCP enforces Admin JWT)
ALTER TABLE public.roadmap_freeze_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read roadmap_freeze_dates"
  ON public.roadmap_freeze_dates FOR SELECT
  USING (auth.role() = 'authenticated');

-- No INSERT/UPDATE/DELETE policies for anon/authenticated — all writes go through MCP (service role)
```

Print the SQL in chat and wait for Phil to apply. Verify with:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'roadmap_freeze_dates'
ORDER BY ordinal_position;
```
Expected: freeze_date_id, freeze_date, freeze_label, created_at, created_by_user_id — all present.

---

### MCP Tools — Four New Tools in delivery-cycle-mcp

Add all four tools to `mcp/delivery-cycle-mcp/src/tools/` and register in `index.js`.

**Tool 1: `list_roadmap_freeze_dates`**

Any authenticated JWT (no Admin restriction — deploy views call this for the selector).

```
Input: none
Output: array of { freeze_date_id, freeze_date (ISO date string), freeze_label, created_at, created_by_display_name }
Order: freeze_date DESC (most recent first)
Query: SELECT rfd.*, u.display_name AS created_by_display_name
       FROM public.roadmap_freeze_dates rfd
       JOIN public.users u ON u.user_id = rfd.created_by_user_id
       WHERE rfd.deleted_at IS NULL  -- no soft-delete on this table; omit if column absent
       ORDER BY rfd.freeze_date DESC
```

Note: `roadmap_freeze_dates` has no `deleted_at` column per the schema above. Query is simply `SELECT ... ORDER BY freeze_date DESC`. Do not add deleted_at unless Phil explicitly adds it.

**Tool 2: `create_roadmap_freeze_date`**

Admin JWT required. Check `is_admin = true` on the calling user before proceeding.

```
Input: { freeze_date: string (ISO date YYYY-MM-DD, required), freeze_label: string (required, max 100 chars) }
Validation:
  - freeze_date must parse as a valid date
  - freeze_label must be non-empty after trim, max 100 chars
  - Unique constraint on freeze_date: if duplicate, return structured error
    { error: 'DUPLICATE_DATE', message: 'A baseline already exists for [date] — [existing label]' }
On success: INSERT row, return the created record (same shape as list_roadmap_freeze_dates row)
Event log: no cycle_event_log entry — this is a system-level record, not per-initiative
```

**Tool 3: `update_roadmap_freeze_date`**

Admin JWT required.

```
Input: { freeze_date_id: uuid (required), freeze_date?: string (ISO date), freeze_label?: string (max 100 chars) }
Validation: at least one of freeze_date / freeze_label must be provided
  - If freeze_date provided: validate as date, check uniqueness against other rows
  - If freeze_label provided: validate non-empty, max 100 chars
On success: UPDATE row, return updated record
```

**Tool 4: `delete_roadmap_freeze_date`**

Admin JWT required.

```
Input: { freeze_date_id: uuid (required) }
On success: DELETE row (hard delete — no soft-delete on this table)
  Return: { deleted: true, freeze_date_id }
```

---

### Admin UI — `/admin/deploy-baselines`

**Governing principles:** Principle 1 (P1 — Self-Clarifying Labels), Principle 4 (P4 — Proportional Governance)
**Governing decisions:** D-444: Admin + Phil access, inline-edit list pattern, four MCP tools; D-311: Admin hub sixth card; D-183: two-step destructive confirmation; D-171: sort state persistence

**Hub card (amends D-311):** Add sixth card to Admin hub at `/admin`. Card title: "Deploy Roadmap Baselines". Card description: "Manage the roadmap baselines used for planned vs. actual deployment analysis." Route: `/admin/deploy-baselines`. Access guard: `is_admin = true`. No async headline strip — card renders instantly (consistent with other Admin hub cards).

**Screen layout:** Standard list, no right panel. Full-width grid. Roles: Admin and Phil only (`is_admin = true`). Route guard blocks all other roles.

**Grid columns:**

| Column | Source | Notes |
|--------|--------|-------|
| Freeze Date | `freeze_date` | Formatted MMM D, YYYY (e.g. "Jun 1, 2026") |
| Label | `freeze_label` | Plain text |
| Set By | `created_by_display_name` | Stone color (#5A5A5A) |
| Set At | `created_at` | Relative date (e.g. "3 days ago"); hover tooltip shows absolute datetime |

**Sort:** `freeze_date` descending default (most recent first). All columns sortable. Sort state persists per D-171 screen key `admin.deploy-baselines`.

**Add new baseline:** "+ Add Baseline" button in screen header. On click: inserts a new inline row at the top of the list with two editable fields — Freeze Date (date picker, required) and Label (text input, required, placeholder "e.g. Roadmap Q3 2026"). "Save" button and "Cancel" link in the row. On Save: call `create_roadmap_freeze_date`. On duplicate date error: show D-200 Pattern 3 inline error "A baseline already exists for [date] — [existing label]". On success: row converts to standard read-only row. On Cancel: inline row disappears.

**Inline edit:** Tapping any cell in the Freeze Date or Label column on an existing row makes it editable inline (same field types as Add). Save on blur or Enter key. Cancel on Escape. Call `update_roadmap_freeze_date`. Validation errors: D-200 Pattern 3 inline.

**Delete:** Per-row "Remove" link (stone color, rightmost column). D-183 two-step confirmation: first click changes link text to "Confirm remove?" with a 5-second timeout; second click within the window calls `delete_roadmap_freeze_date` and removes the row. Timeout resets link to "Remove" with no action taken.

**Empty state:** "No roadmap baselines recorded. Add one to enable planned vs. actual analysis on deploy views."

**Load:** Full before interactive per D-346. Call `list_roadmap_freeze_dates` on component init.

**Error state:** D-140 error pattern if `list_roadmap_freeze_dates` fails.

**New Angular component:** `admin/deploy-baselines/deploy-baselines.component.ts`. Add route to admin routing module. Add "Deploy Roadmap Baselines" card to `admin-hub.component.ts` card array.

**Responsibility declaration (D-226):**
```
// Manages the Deploy Roadmap Baselines admin screen — CRUD for roadmap_freeze_dates records.
// Does NOT manage the baseline selector on deploy views — that lives in
// the EPO Deploy and Workstream Deploy view components.
```

---

## Workstream 2 — D-445: Quarter Pivot Control

**Governing principles:** Principle 2 (P2 — Progressive Disclosure)
**Governing decisions:** D-445: non-persistent quarter pivot, both deploy views; D-419: four-section structure, quarter boundary logic; D-399: EPO Deploy view; D-PilotSchedule-2026-04-06: Workstream Deploy view

Apply identically to both views:
- `/initiatives/epo-deploy` → `epo-deploy.component.ts`
- `/delivery/deploy-schedule` → `deploy-schedule.component.ts` (or current filename — check repo)

**Before writing any code:** Read the current component filenames for both views. Flag as CC-decision if filename differs from expected.

### Control Placement

In each view's header bar: right of the page title, left of the existing Filters button (if present) or right of title if no filter button. The control is part of the header, not the filter panel.

### Control Structure

```html
<!-- Quarter Pivot Control -->
<div class="quarter-pivot-control">
  <button (click)="shiftQuarter(-1)" aria-label="Previous quarter">&#8249;</button>
  <span class="quarter-label">{{ referenceQuarterLabel }}</span>
  <button (click)="shiftQuarter(1)" aria-label="Next quarter">&#8250;</button>
</div>
```

Styling: compact, inline with header. Quarter label centered between chevrons, min-width sufficient for "Q4 2026" without layout shift. Use existing header typography — no new font sizes.

### Component Logic

```typescript
// Reference quarter state — NOT persisted (D-445)
referenceQuarterLabel: string;      // e.g. "Q2 2026"
referenceQuarterStart: Date;        // first day of reference quarter
referenceQuarterEnd: Date;          // last day of reference quarter

// Initialize to actual current calendar quarter on every component init
ngOnInit(): void {
  this.setReferenceQuarter(new Date());  // today's date → derives current quarter
  this.loadData();
}

setReferenceQuarter(anchorDate: Date): void {
  // Quarter boundary logic per D-419:
  // Q1 = Jan 1 – Mar 31, Q2 = Apr 1 – Jun 30, Q3 = Jul 1 – Sep 30, Q4 = Oct 1 – Dec 31
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth(); // 0-indexed
  const quarter = Math.floor(month / 3); // 0=Q1, 1=Q2, 2=Q3, 3=Q4
  this.referenceQuarterStart = new Date(year, quarter * 3, 1);
  this.referenceQuarterEnd = new Date(year, quarter * 3 + 3, 0); // last day of quarter
  this.referenceQuarterLabel = `Q${quarter + 1} ${year}`;
}

shiftQuarter(delta: number): void {
  // Move referenceQuarterStart by delta quarters
  const newAnchor = new Date(this.referenceQuarterStart);
  newAnchor.setMonth(newAnchor.getMonth() + (delta * 3));
  this.setReferenceQuarter(newAnchor);
  this.loadData();  // re-query all sections
}
```

### Section Label Updates

All four section header labels derive from `referenceQuarterLabel`. Derive prior, next-1, and next-2 quarter labels from `referenceQuarterStart`:

```typescript
get priorQuarterLabel(): string { /* referenceQuarterStart - 3 months */ }
get nextOneQuarterLabel(): string { /* referenceQuarterStart + 3 months */ }
get nextTwoQuarterLabel(): string { /* referenceQuarterStart + 6 months */ }
```

Section headers:
- `PRIOR QUARTER — [priorQuarterLabel] ACTUAL` (when no baseline selected)
- `PRIOR QUARTER — [priorQuarterLabel] PLANNED / ACTUAL · [baselineLabel]` (when baseline selected — Workstream 3)
- `CURRENT QUARTER — [referenceQuarterLabel] PLANNED/ACTUAL`
- `NEXT TWO QUARTERS — [nextOneQuarterLabel] / [nextTwoQuarterLabel] TARGETED`
- `UNSCHEDULED ACTIVE`

### MCP Query Changes

The existing `list_delivery_cycles` (or equivalent data-fetch call) passes quarter boundaries to the server. Replace hardcoded `now()` quarter derivation with parameters derived from `referenceQuarterStart` and `referenceQuarterEnd`. Pass as ISO date strings. Server uses these dates for all quarter-bucket assignments instead of server-side `now()`.

Flag as CC-decision if the current implementation derives quarter boundaries client-side — in that case, client-side derivation already uses component state and this change is contained to updating the state source from `now()` to `referenceQuarterStart`.

---

## Workstream 3 — D-446: Prior Quarter Planned vs. Actual Analysis

**Governing principles:** Principle 1 (P1 — Self-Clarifying Labels), Principle 2 (P2 — Progressive Disclosure)
**Governing decisions:** D-446: baseline selector, three symbols, cycle_event_log reconstruction, data gap disclosure; D-427: milestone_target_date_changed event type; D-444: list_roadmap_freeze_dates MCP tool; D-171: user_screen_state for dismissal

Apply identically to both views (same components as Workstream 2).

### Baseline Selector — Component Addition

In each view's header bar: below the Quarter Pivot Control (D-445), or on the same line at narrower widths. Label "Baseline:" in stone color.

Control: `<select>` dropdown.

```typescript
// Baseline state — NOT persisted (D-446)
freezeDates: RoadmapFreezeDate[] = [];   // loaded from list_roadmap_freeze_dates()
selectedFreezeDate: RoadmapFreezeDate | null = null;  // null = blank default

interface RoadmapFreezeDate {
  freeze_date_id: string;
  freeze_date: string;       // ISO date string
  freeze_label: string;
  created_by_display_name: string;
}
```

Dropdown options:
- First option: `— Select baseline —` (value: null/empty) — always present
- One option per record from `list_roadmap_freeze_dates()`: display text `[freeze_label] — [MMM D, YYYY]`
- When `freezeDates` is empty: single disabled option `No baselines saved — see Admin`

Load `list_roadmap_freeze_dates()` on component init alongside other data loads. On selection change: set `selectedFreezeDate`, trigger prior quarter symbol computation.

When `selectedFreezeDate` is null: prior quarter section renders in actuals-only mode (no symbols). When set: prior quarter section renders with symbols.

### Prior Quarter Symbol Rendering

**Symbol definitions:**
```typescript
type PriorQuarterSymbol = 'planned-deployed' | 'planned-not-deployed' | 'unplanned-deployed';

// ✓ Planned and Deployed — green checkmark
// ✕ Planned but Not Deployed — red X
// ✚ Deployed but Not Planned — green plus
```

**Algorithm — called once per initiative in the Prior Quarter section when `selectedFreezeDate` is set:**

```typescript
computePriorQuarterSymbol(
  initiative: DeliveryCycle,
  baselineDate: string,        // ISO date from selectedFreezeDate.freeze_date
  priorQuarterStart: Date,
  priorQuarterEnd: Date,
  eventLog: CycleEventLogEntry[]
): PriorQuarterSymbol {

  // Step 1: Was there a Go to Deploy actual date in the prior quarter?
  const hasActualInPriorQuarter: boolean =
    initiative.go_to_deploy_actual_date != null &&
    new Date(initiative.go_to_deploy_actual_date) >= priorQuarterStart &&
    new Date(initiative.go_to_deploy_actual_date) <= priorQuarterEnd;

  // Step 2: What was the Go to Deploy target date as-of the baseline date?
  // Walk cycle_event_log for this initiative:
  // Filter to event_type = 'milestone_target_date_changed'
  //   AND event_metadata.gate_name = 'go_to_deploy'
  //   AND created_at <= baselineDate (inclusive)
  // Sort by created_at DESC, take the first (most recent before baseline)
  // Extract event_metadata.new_target_date as the as-of-baseline target
  const goToDeployEvents = eventLog
    .filter(e =>
      e.event_type === 'milestone_target_date_changed' &&
      e.event_metadata?.gate_name === 'go_to_deploy' &&
      new Date(e.created_at) <= new Date(baselineDate)
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const targetAsOfBaseline: string | null =
    goToDeployEvents.length > 0 ? goToDeployEvents[0].event_metadata?.new_target_date : null;

  // Step 3: Did the target-as-of-baseline point to the prior quarter?
  const targetPointedToPriorQuarter: boolean =
    targetAsOfBaseline != null &&
    new Date(targetAsOfBaseline) >= priorQuarterStart &&
    new Date(targetAsOfBaseline) <= priorQuarterEnd;

  // Step 4: Classify
  if (targetPointedToPriorQuarter && hasActualInPriorQuarter) {
    return 'planned-deployed';     // ✓
  } else if (targetPointedToPriorQuarter && !hasActualInPriorQuarter) {
    return 'planned-not-deployed'; // ✕
  } else {
    return 'unplanned-deployed';   // ✚ (this initiative is in Prior Quarter section,
                                   // so hasActualInPriorQuarter is true by section membership)
  }
}
```

**Symbol display:** Render immediately left of the Initiative name in each Prior Quarter section row. Use existing row layout — add a `<span class="prior-quarter-symbol">` before the title span.

```
✓  green  #22c55e   font-weight: bold
✕  red    #E96127   font-weight: bold
✚  green  #22c55e   font-weight: bold
```

Symbols are decorative text characters, not icon assets. No tooltip required — the section header "PLANNED / ACTUAL" context is sufficient.

### Data Loading for Symbol Computation

The symbol algorithm requires `cycle_event_log` entries for each initiative in the Prior Quarter section. Current data model: `get_delivery_cycle` returns the event log for a single initiative. For the deploy view, initiatives are listed in aggregate — fetching event logs per-initiative on render would be N+1.

**Recommended approach:** Add an optional `event_log` parameter to the existing `list_delivery_cycles` MCP call (or equivalent) — when `include_event_log: true`, return the last 50 `cycle_event_log` entries per initiative filtered to `event_type = 'milestone_target_date_changed'`. This scopes the payload to only what the algorithm needs.

**Flag as CC-decision** if the current data-fetch pattern makes this impractical. Acceptable fallback: fetch event logs lazily per-initiative when the Prior Quarter section is expanded (not on initial load). If fallback chosen: symbols render as a loading spinner until the expand-fetch completes, then appear. Record the approach as a CC-decision either way.

### Data Gap Disclosure

Check: is the selected `freeze_date` before the Contract 23 deployment date?

Contract 23 deploy date = the date `D-427` went live. **Read this from `CLAUDE.md` or `changelog.ts` — do not hardcode a date.** If the date is not in either file, default to checking whether any `milestone_target_date_changed` events exist in `cycle_event_log` at all. If zero such events exist system-wide, the feature is in a pre-history state and the disclosure should show.

When disclosure applies: render an inline amber notice (D-200 Pattern 2, non-blocking) below the Prior Quarter section header:

> "Target date history before [date] is incomplete. Some initiatives may be misclassified."

**Dismissal:** "Got it" button on the notice. On click: store dismissal in `user_screen_state`:
- EPO Deploy: key `initiatives.epo-deploy.data-gap-dismissed`, value `true`
- Workstream Deploy: key `delivery.deploy-schedule.data-gap-dismissed`, value `true`

On subsequent loads: check `user_screen_state` for this key before rendering the notice. If dismissed: suppress permanently for this user. Use existing `user_screen_state` service pattern.

### Section Header Updates

When `selectedFreezeDate` is null:
```
PRIOR QUARTER — [priorQuarterLabel] ACTUAL
```

When `selectedFreezeDate` is set:
```
PRIOR QUARTER — [priorQuarterLabel] PLANNED / ACTUAL · [freeze_label]
```

Where `[freeze_label]` is `selectedFreezeDate.freeze_label` (e.g. "Roadmap Q2 2026").

### Empty Selector State

When `list_roadmap_freeze_dates()` returns an empty array: render the Baseline selector as a disabled `<select>` with single option text "No baselines saved — see Admin". No symbols rendered. Prior quarter section header remains "PRIOR QUARTER — [priorQuarterLabel] ACTUAL".

---

## Acceptance Criteria

### Workstream 1 — Deploy Roadmap Baselines

1. Migration runs cleanly. `roadmap_freeze_dates` table present with correct schema — `freeze_date_id`, `freeze_date` (date, UNIQUE), `freeze_label` (text, max 100), `created_at`, `created_by_user_id`. PASS / FAIL.
2. `list_roadmap_freeze_dates()` returns empty array when no records exist; returns records ordered `freeze_date` DESC when records exist. PASS / FAIL.
3. `create_roadmap_freeze_date` with Admin JWT creates a record and returns it. Non-Admin JWT returns auth error. Duplicate `freeze_date` returns structured `DUPLICATE_DATE` error. PASS / FAIL.
4. `update_roadmap_freeze_date` with Admin JWT updates label and/or date. Non-Admin JWT returns auth error. Duplicate date on update returns structured error. PASS / FAIL.
5. `delete_roadmap_freeze_date` with Admin JWT removes the record. Non-Admin JWT returns auth error. PASS / FAIL.
6. Admin hub at `/admin` shows sixth card "Deploy Roadmap Baselines" — visible to Admin/Phil, absent to other roles. PASS / FAIL.
7. Screen at `/admin/deploy-baselines` renders grid with Freeze Date / Label / Set By / Set At columns, sorted most-recent first. PASS / FAIL.
8. "+ Add Baseline" creates a record; duplicate date shows inline error without saving. PASS / FAIL.
9. Inline edit on Freeze Date and Label fields saves correctly via `update_roadmap_freeze_date`. PASS / FAIL.
10. "Remove" per-row two-step deletes the record; five-second timeout resets without deleting. PASS / FAIL.
11. Empty state "No roadmap baselines recorded..." renders when table is empty. PASS / FAIL.
12. Non-Admin user navigating to `/admin/deploy-baselines` is blocked by route guard. PASS / FAIL.

### Workstream 2 — Quarter Pivot Control

13. EPO Deploy view (`/initiatives/epo-deploy`) shows `< Q[N] YYYY >` control in header, defaulting to actual current calendar quarter on load. PASS / FAIL.
14. Workstream Deploy view (`/delivery/deploy-schedule`) shows the same control with identical behavior. PASS / FAIL.
15. Clicking `<` steps back one quarter; clicking `>` steps forward one quarter. Labels update correctly. No lower or upper bound enforced. PASS / FAIL.
16. All four section headers update to reflect the selected reference quarter. Prior section shows correct prior quarter label; Next Two Quarters section shows correct Q+1/Q+2 labels. PASS / FAIL.
17. Initiatives re-bucket correctly when quarter changes — an initiative with a Go to Deploy target date in Q3 2026 appears in Current Quarter when Q3 2026 is selected, and in Next Two Quarters when Q2 2026 is selected. PASS / FAIL.
18. Refreshing the page resets the quarter pivot to the actual current quarter (non-persistent confirmed). PASS / FAIL.

### Workstream 3 — Prior Quarter Planned vs. Actual Analysis

19. Baseline selector on EPO Deploy view populates from `list_roadmap_freeze_dates()`. Shows "No baselines saved — see Admin" when table is empty. PASS / FAIL.
20. Workstream Deploy view shows identical selector behavior. PASS / FAIL.
21. With no baseline selected: Prior Quarter section shows actuals only, no symbols, header reads "PRIOR QUARTER — [Q label] ACTUAL". PASS / FAIL.
22. With a baseline selected: section header reads "PRIOR QUARTER — [Q label] PLANNED / ACTUAL · [freeze_label]". PASS / FAIL.
23. ✓ symbol renders on an initiative whose Go to Deploy target date pointed to the prior quarter as-of the baseline AND whose actual date fell in the prior quarter. PASS / FAIL.
24. ✕ symbol renders on an initiative whose Go to Deploy target date pointed to the prior quarter as-of the baseline AND whose actual date did not fall in the prior quarter (or is null). PASS / FAIL.
25. ✚ symbol renders on an initiative with an actual date in the prior quarter whose target date did NOT point to the prior quarter as-of the baseline (or had no target set). PASS / FAIL.
26. Clearing the baseline selector (selecting "— Select baseline —") removes all symbols and reverts section header to actuals-only. PASS / FAIL.
27. Data gap disclosure notice appears when baseline date predates D-427 deployment (or when no `milestone_target_date_changed` events exist). "Got it" dismisses permanently for the user (persisted in `user_screen_state`). PASS / FAIL.
28. Refreshing the page resets the baseline selector to blank (non-persistent confirmed). PASS / FAIL.

---

## CC-Decision Guidance

Record any of the following as CC-decisions and surface in CodeClose:

- **Quarter boundary computation location** — client-side vs. server-side parameter passing (flag approach chosen)
- **Event log data-fetch strategy** — included in `list_delivery_cycles` vs. lazy per-initiative on expand
- **Contract 23 deploy date source** — where this date is read from, or what fallback was used
- **View component filenames** — if they differ from `epo-deploy.component.ts` / `deploy-schedule.component.ts`
- Any MCP tool wire-contract deviations from this spec

---

## New Files Expected

| File | Type | Notes |
|------|------|-------|
| `db/migrations/NNN_roadmap_freeze_dates.sql` | Migration | NNN = next sequential number |
| `mcp/delivery-cycle-mcp/src/tools/list_roadmap_freeze_dates.js` | MCP tool | |
| `mcp/delivery-cycle-mcp/src/tools/create_roadmap_freeze_date.js` | MCP tool | |
| `mcp/delivery-cycle-mcp/src/tools/update_roadmap_freeze_date.js` | MCP tool | |
| `mcp/delivery-cycle-mcp/src/tools/delete_roadmap_freeze_date.js` | MCP tool | |
| `angular/src/app/features/admin/deploy-baselines/deploy-baselines.component.ts` | Angular | Admin screen |

## Modified Files Expected

| File | Change |
|------|--------|
| `mcp/delivery-cycle-mcp/src/index.js` | Register four new tools |
| `angular/src/app/features/admin/admin-hub.component.ts` | Sixth card |
| `angular/src/app/features/admin/admin-routing.module.ts` | Route for deploy-baselines |
| EPO Deploy component | Quarter pivot + baseline selector + symbols |
| Workstream Deploy component | Same — parallel apply |
| `angular/src/app/core/services/delivery.service.ts` | `listRoadmapFreezeDates()` service method |
