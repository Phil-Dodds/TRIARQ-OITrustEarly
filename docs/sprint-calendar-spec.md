# Contract 37 — Sprint Calendar and Gate Date Rules Specification
Pathways OI Trust | Build C | v1.0 | 2026-07-14 | CONFIDENTIAL
Governing decisions: D-549, D-550, D-551, D-552, D-553. Related: D-547 (RLS), D-527/D-530 (coaching), D-482/D-537 (overdue), D-108/D-154 (gates), Arch-1.

---

## 1. Purpose and Scope

Sprint-facilitated gate date setting. Trios who plan in sprints select a sprint (or a sprint offset from the prior gate); OI Trust resolves and stores a true calendar date as the gate target. The resolved date remains the canonical gate target date — every existing consumer (D-537 overdue, D-521 needs-review, dashboard, slip logic, status panel) is unchanged. Origin: Julie's Gate Date Calculator spreadsheet (2026-07-14 analysis).

In scope: sprint calendar entities + admin, per-division calendar assignment with inheritance, gate date rule model with three modes, cascade recompute, editor and grid display.
Out of scope (deferred): "Apply standard schedule" template action (D-StandardScheduleTemplate); actual-date-anchored cascades.

---

## 2. Data Model

**Governing decisions:** D-549: minimal calendar entities; sprint IDs are TEXT. D-550: division assignment via nullable FK with ancestor walk. D-547: RLS enabled deny-all in the CREATE TABLE migration. D-551: rule metadata alongside the canonical resolved date.

New tables (single migration; ENABLE ROW LEVEL SECURITY, zero policies, in the same file — D-547):

```sql
sprint_calendars (
  id uuid PK default gen_random_uuid(),
  name text not null unique,          -- e.g. 'TRIARQ Standard 2026'
  is_active boolean not null default true,
  created_at timestamptz not null default now()
)

sprints (
  id uuid PK default gen_random_uuid(),
  calendar_id uuid not null FK sprint_calendars(id) on delete cascade,
  sprint_id text not null,            -- TEXT, never numeric: '2026.10' (D-549)
  start_date date not null,
  end_date date not null,
  unique (calendar_id, sprint_id),
  check (end_date > start_date)
)
```

Division assignment — one nullable column on the existing divisions table:

```sql
ALTER TABLE divisions ADD COLUMN sprint_calendar_id uuid NULL
  REFERENCES sprint_calendars(id);
```

Resolution (effective calendar): walk self → parent → … → root; first non-null `sprint_calendar_id` wins; all-null = no calendar (sprint modes hidden). A sentinel value is NOT used for "None" — see §4.3 for the explicit opt-out.

Gate date rule metadata — columns added to the gate/milestone target-date storage (Code maps to the actual table; same row that holds the target date):

```sql
date_rule_type text not null default 'manual',   -- 'manual' | 'sprint' | 'relative'
rule_sprint_id text null,        -- sprint mode: which sprint (text id)
rule_anchor text null,           -- 'start' | 'end' (sprint mode)
rule_sprint_count integer null,  -- relative mode: X sprints after prior gate
rule_day_offset integer null,    -- both modes: Z days (may be 0; negative allowed)
rule_stale boolean not null default false  -- set when effective calendar no longer resolves the rule
```

The **resolved target date column is unchanged and remains canonical** (D-551). Rules are derivation metadata only. Clearing a target date (D-501 model) also clears its rule.

## 3. Seed (Phil executes; Code writes the SQL)

**Governing decision:** D-550: all root trusts default to the standard table; children inherit via null.

1. Insert `sprint_calendars` row: 'TRIARQ Standard 2026'.
2. Insert 18 sprints from Julie's calendar, sprint_id as text `'2026.01'`–`'2026.18'` (correcting the source file's `2026.1` float artifact), 3-week ranges: 2026.01 = 2025-12-29→2026-01-16 … 2026.18 = 2026-12-21→2027-01-08 (exact table in Appendix A).
3. `UPDATE divisions SET sprint_calendar_id = <standard-id> WHERE parent_division_id IS NULL;` — children remain NULL (inherit).

## 4. Admin

**Governing decisions:** D-549, D-550. Admin-only surfaces (existing Admin area patterns).

### 4.1 Calendar management
- Calendar list: name, active, sprint count, divisions using (direct assignments count).
- Sprint editor per calendar: grid of sprint_id / start / end; add, edit, delete rows. Validation: unique sprint_id per calendar; no overlapping ranges within a calendar (warn, not block — gaps allowed).
- Editing a sprint's dates triggers scoped recompute (§6.3) with a D-183 two-step confirmation showing the count of affected initiatives.

### 4.2 Division assignment
- Division admin gains a "Sprint calendar" selector with options: **Inherit (currently: [effective calendar name])** [default] · each active calendar · **None**.
- Selector shows the resolved effective calendar when Inherit is selected.

### 4.3 None (explicit opt-out)
- Stored as a distinguished value (implementation choice: dedicated boolean `sprint_calendar_none` or a reserved sentinel — Code decides, documents in CodeClose). A division set to None resolves to no calendar for itself and its inheriting descendants; sprint and relative modes are hidden in editors for initiatives in that subtree; Date mode only.

## 5. Gate Date Rule Model

**Governing decision:** D-551. One grammar: **target = anchor + (X sprints) + (Z days)**.

| Mode | Anchor | Inputs | Example |
|---|---|---|---|
| `manual` | none | date picker (today's behavior) | Jul 20 |
| `sprint` | explicit sprint | sprint (dropdown from effective calendar) + anchor edge (start/end) + optional ±Z days | Sprint 2026.11 end + 14d |
| `relative` | prior gate's **target** date | X sprints + optional ±Z days | Go to Deploy + 28d (X=0, Z=28) |

Semantics:
- `sprint` mode resolves: selected sprint's start or end date + Z days.
- `relative` mode resolves: prior gate's target date, advanced X sprints along the effective calendar (X sprints = the end date of the sprint X positions after the sprint containing the prior gate's target; X=0 means the prior gate's target itself), + Z days. When the prior gate's target falls outside any sprint, X>0 counts from the next sprint that starts on or after that date. Server computes; Angular previews with the same lib.
- "Prior gate" = the previous gate in the canonical five-gate lifecycle order (D-108/D-154), regardless of whether intermediate gates have rules. Brief Review has no prior gate — relative mode hidden there.
- Resolution is server-side at save (MCP tool computes and writes both the resolved date and the rule metadata atomically). Angular shows a live preview using the loaded calendar.

## 6. Cascade

**Governing decision:** D-552.

### 6.1 What cascades
Only `relative` rules cascade. When a gate's **target** date changes (by any means — manual edit, sprint re-selection, upstream cascade), each downstream gate whose rule is `relative` recomputes, in lifecycle order, chaining. `manual` and `sprint` gates never move from an upstream change.

### 6.2 Target-to-target
Relative rules anchor to the prior gate's **target**, never its actual. Gate approval (actual date set) triggers no cascade. Replanning after slippage is a human act — the trio moves targets deliberately; slip evidence is preserved for analytics.

### 6.3 Confirmation and visibility
- Any save that will cascade shows the D-140-style confirmation listing every shifted gate with old → new dates ("Also moves: Go to Release Sep 25 → Oct 2, Close Review Oct 9 → Oct 16") before writing. Cancel aborts the whole save.
- Admin sprint-date edits recompute all `sprint` and downstream `relative` rules for initiatives whose **effective** calendar is the edited one; two-step confirmation shows affected-initiative count (§4.1).

### 6.4 Rule-breaking edits
Directly editing the date on a gate that has a `sprint` or `relative` rule converts the gate to `manual` (rule metadata cleared) with an inline confirmation noting the rule will be removed. Its own downstream `relative` gates still cascade from the new value.

### 6.5 Stale rules
When a rule can no longer resolve against the effective calendar (division reassigned, initiative moved divisions, sprint deleted): the resolved date **holds** — dates never move on reassignment — and `rule_stale` is set. Display flags the rule chip ("Sprint 2026.11 — not in current calendar"); the next edit of that gate rebuilds or converts the rule. No cascade fires from staleness.

## 7. Display

**Governing decision:** D-553.

### 7.1 Editor (gate target date, Initiative detail → Gates & Milestone Dates)
- Mode toggle: **Date · Sprint · After prior gate**. Sprint/relative options render only when an effective calendar resolves (§4.3); relative hidden on Brief Review.
- Sprint mode inputs: sprint dropdown (effective calendar, ordered by start_date, labeled "2026.11 · Jul 27 – Aug 14"), anchor Start/End select, "+ days" numeric (default 0).
- Relative mode inputs: "+ sprints" numeric (default 0), "+ days" numeric (default 0); caption names the prior gate.
- Live "Resolves to" date preview; caption line = sprint real dates + rule restated + the D-530 date-semantics line.
- Actual dates are never rule-driven — Date mode only (unchanged).

### 7.2 Grid (Gates & Milestone Dates rows)
- Target Date cell: resolved date primary (D-520 format); beneath it a muted rule chip — "Sprint 2026.11 start", "Sprint 2026.11 end + 14d", "Go to Deploy + 28d", or nothing for manual. Stale rules: chip in warning treatment with "not in current calendar" suffix.
- Dashboard, status panel, Recently Approved Gates: **no change** — dates only.

## 8. MCP Tools (division-mcp or delivery-cycle-mcp per Code's service mapping)

| Tool | Access | Notes |
|---|---|---|
| list_sprint_calendars / create / update / delete | admin | delete blocked if any division assignment or non-stale rule references it (D-140 message) |
| list_sprints(calendar_id) / upsert_sprints / delete_sprint | admin | upsert batch for the grid editor; sprint-date change returns affected-initiative count for the confirmation, second call commits + recomputes |
| set_division_sprint_calendar(division_id, calendar_id \| inherit \| none) | admin | no recompute; stale-flag pass over affected initiatives' rules |
| get_effective_sprint_calendar(division_id) | any authenticated | ancestor walk; returns calendar + sprints for editor dropdowns |
| set_gate_date_rule(initiative_id, gate, rule…) | same permission as today's set target date | computes resolved date, writes date + rule atomically, runs cascade, returns full shifted-gate list (pre-flight variant returns the list without writing, for the confirmation) |

All tables MCP-only; RLS deny-all (D-546 posture, D-547 rule).

## 9. Acceptance Criteria

| AC | Criterion |
|---|---|
| 1 | Migration creates both tables with RLS enabled (zero policies) in the same file |
| 2 | Seed: standard calendar + 18 text-id sprints; all root trusts assigned; children NULL |
| 3 | Division admin selector: Inherit (showing effective name) / calendars / None; saves correctly |
| 4 | Effective calendar resolves by ancestor walk; None truncates the walk for its subtree |
| 5 | Editor shows three modes when calendar resolves; Date-only when it doesn't; relative hidden on Brief Review |
| 6 | Sprint mode: dropdown + anchor + days resolves correctly; save writes resolved date + rule |
| 7 | Relative mode: X sprints + Z days from prior gate target resolves correctly, incl. X=0 and out-of-sprint anchors |
| 8 | Changing an upstream target cascades only through relative rules, in lifecycle order, with a confirmation listing every shift; cancel aborts all writes |
| 9 | Setting an actual date cascades nothing |
| 10 | Direct date edit on a ruled gate converts to manual with confirmation; downstream still cascades |
| 11 | Division/calendar reassignment moves no dates; affected rules flagged stale; chip shows warning treatment |
| 12 | Admin sprint-date edit shows affected count, then recomputes only initiatives on that effective calendar |
| 13 | Grid shows rule chips under target dates; dashboard and all other read surfaces unchanged |
| 14 | Sprint IDs render and store as text ('2026.10' keeps its zero) |
| 15 | Calendar delete blocked while referenced, with D-140 message |

## Appendix A — Standard 2026 Seed Sprints

| sprint_id | start | end |
|---|---|---|
| 2026.01 | 2025-12-29 | 2026-01-16 |
| 2026.02 | 2026-01-19 | 2026-02-06 |
| 2026.03 | 2026-02-09 | 2026-02-27 |
| 2026.04 | 2026-03-02 | 2026-03-20 |
| 2026.05 | 2026-03-23 | 2026-04-10 |
| 2026.06 | 2026-04-13 | 2026-05-01 |
| 2026.07 | 2026-05-04 | 2026-05-22 |
| 2026.08 | 2026-05-25 | 2026-06-12 |
| 2026.09 | 2026-06-15 | 2026-07-03 |
| 2026.10 | 2026-07-06 | 2026-07-24 |
| 2026.11 | 2026-07-27 | 2026-08-14 |
| 2026.12 | 2026-08-17 | 2026-09-04 |
| 2026.13 | 2026-09-07 | 2026-09-25 |
| 2026.14 | 2026-09-28 | 2026-10-16 |
| 2026.15 | 2026-10-19 | 2026-11-06 |
| 2026.16 | 2026-11-09 | 2026-11-27 |
| 2026.17 | 2026-11-30 | 2026-12-18 |
| 2026.18 | 2026-12-21 | 2027-01-08 |

UAT End (+7) and Release Target (+14) columns from the source spreadsheet are deliberately NOT calendar properties — they are per-gate rule offsets (D-549 balance_point).

---
*TRIARQ Health · Pathways OI Trust · CONFIDENTIAL · July 2026 · v1.0*
