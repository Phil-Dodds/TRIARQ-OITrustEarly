# cc-decisions-active.md
# Claude Code Implementation Decisions
# Pathways OI Trust — Build C
# Source: Claude Code sessions | CC-prefix = Claude Code implementation decisions
#
# These are implementation-layer decisions that do not require canonical D-number allocation.
# Chat-originated decisions retain their D-prefix (D-178, D-179, D-180).
# CC-prefix is non-colliding with D-prefix by design (Session 2026-04-04).
#
# Reconciliation: Claude Chat may canonize any CC decision into the D-registry at its discretion.
# Until canonized, CC decisions are binding for Claude Code sessions.

---

## CC-001 — Claude Code Decision Numbering Convention
**Date:** 2026-04-04
**Source:** Claude Code (Session 2026-04-04)
**Status:** Active

Claude Code uses CC-xxx prefix for all implementation decisions generated within Claude Code sessions.
Claude Chat retains D-xxx prefix for canonical decisions.
The two namespaces cannot collide. No cross-namespace collision check is needed.
CC decisions are binding for Claude Code sessions until explicitly superseded.
Claude Chat may canonize a CC decision into the D-registry by assigning a D-number and noting the CC-origin.

---

## CC-002 — Workstream Picker Design (Picker Modal Standard)
**Date:** 2026-04-04
**Source:** Claude Code (Session 2026-04-04) — derived from Claude Chat D-178 pattern
**Status:** Active

WorkstreamPickerComponent design decisions:

**Scope radio options (drives list contents, not a filter field):**
- "Cycle's Division" → scope_type = 'division_tree', scope_division_id = cycle's division ID
- "Trust" → scope_type = 'trust' (all workstreams under Trust nodes, division_level = 1)
- "My Divisions" → scope_type = 'user_divisions' (caller's memberships)
- "All" → scope_type = 'all' (admin/phil only)

Default scope: "Cycle's Division". Falls back to "Trust" if no Division is set on the cycle yet.

**Columns:** Division Name | Workstream Name | inline (Inactive) badge.
Division Name always shown.

**Status badge:** Inactive badge shown only when Workstream is inactive. Active Workstreams have no badge.

**Inactive Workstream behaviour:** Row is visible when "Show inactive" toggle is on. Row is NOT selectable (D-165, ARCH-23 enforcement is at gate time, but picker prevents selecting inactive to give clear upfront feedback). Echo section shows, but OK button stays disabled.

**Echo section:** Shows lead name, division, status, active cycle count for the highlighted row.

**"Show inactive" toggle:** Off by default. When toggled on, inactive rows appear with (Inactive) badge but cannot be selected.

**No filter field:** List sizes stay ≤15 for most scopes. Radio set is sufficient for navigation.

**Pre-selection:** Current workstream_id pre-selected when picker opens (if cycle already has one).

**OK/Cancel:** OK emits selected workstream (active only). Cancel emits null. Overlay click = Cancel.

---

## CC-003 — Entity Detail View Standard
**Date:** 2026-04-04
**Source:** Claude Code (Session 2026-04-04) — derived from Claude Chat D-179 pattern
**Status:** Pending design session

Detail view standard for Workstream and Cycle entity detail pages.
Design session required before building Workstream detail view.

**Known constraints (from Claude Chat discussion):**
- Edit-in-place where possible (not separate edit pages)
- Action buttons above the fold
- Event log always present, anchored at bottom of page

---

## CC-004 — Rich Creation Page Standard (Create Cycle Form)
**Date:** 2026-04-04
**Source:** Claude Code (Session 2026-04-04) — derived from Claude Chat D-180 pattern
**Status:** Partially active (Create Cycle implemented; broader standard pending design session)

**Create Cycle form field order (confirmed Session 2026-04-04):**
1. Owner Division * (required)
2. Cycle Title *
3. Delivery Workstream — via picker modal (recommended, not required — D-165)
4. Tier Classification *
5. Delivery Specialist — auto-populated if caller is DS role; blank otherwise; nullable at creation (CC-006)
6. Outcome Statement — optional at creation
7. Jira Epic Key — optional
8. Gate Target Dates — 5 date inputs (Brief Review, Go to Build, Pilot Start/Go to Deploy, Production Release/Go to Release, Close Review) — all optional

**Auto-assignment rule for DS:** If caller's system_role = 'ds', their user_id is pre-populated as assigned_ds_user_id. For admin/phil, field is left blank.

**Picker modal trigger:** Workstream field shows a button (not a dropdown). Button opens WorkstreamPickerComponent (CC-002). Division selection clears any workstream selection (scope changes).

**Broader Rich Creation Page Standard:** Pending design session. This file documents what was built for Create Cycle only.

---

## CC-005 — Workstream Picker Scope: list_delivery_workstreams Enhancement
**Date:** 2026-04-04
**Source:** Claude Code (Session 2026-04-04)
**Status:** Active

`list_delivery_workstreams` enhanced with:
- `scope_type` param: 'division_tree' | 'trust' | 'user_divisions' | 'all'
- `scope_division_id`: required when scope_type = 'division_tree'
- `include_inactive`: boolean, default false (inactive excluded from picker unless toggled)
- `home_division_id` and `active_status` still supported for backward compatibility
- Returns `home_division_name`, `lead_display_name`, `active_cycle_count` on every row
- 'all' scope requires admin or phil role — returns 401-style error for other roles

---

## CC-006 — Drop cycle_owner_user_id; DS/CB Gate Enforcement
**Date:** 2026-04-04
**Source:** Claude Code (Session 2026-04-04) — confirmed by Phil (Reading A)
**Status:** Active

**Reading A confirmation:** cycle_owner_user_id and assigned_ds_user_id refer to the same person. cycle_owner is redundant. Drop it.

**Migration 025:** Copies cycle_owner_user_id → assigned_ds_user_id WHERE assigned_ds IS NULL; then DROP COLUMN cycle_owner_user_id.

**Gate enforcement:**
- `assigned_ds_user_id` is nullable at creation. Required before Brief Review gate.
  MCP: `submit_gate_for_approval` blocks brief_review gate if assigned_ds_user_id IS NULL.
  D-140 message: "Cannot submit Brief Review gate — no Delivery Specialist is assigned to this cycle. A DS must be named before Brief Review can proceed."

- `assigned_cb_user_id` is nullable at creation. Required before Go to Build gate.
  MCP: `submit_gate_for_approval` blocks go_to_build gate if assigned_cb_user_id IS NULL.
  D-140 message: "Cannot submit Go to Build gate — no Capability Builder is assigned to this cycle. A CB must be named before this cycle enters the BUILD phase."

Neither field uses a DB NOT NULL constraint — enforcement lives entirely in the MCP layer.
Same pattern as workstream assignment (D-165, ARCH-23).

**Phil must run migration 025 in Supabase SQL editor before MCP changes go live.**
