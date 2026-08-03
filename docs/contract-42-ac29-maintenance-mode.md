# Contract 42 — AC-29 Maintenance Mode
Pathways OI Trust | Section H spec | 2026-08-02 | CONFIDENTIAL

**Decisions governing:** D-635, D-636, D-637. **Also touches:** ARCH-34, ARCH-35, Rule 48, Arch-1 exceptions.
**Priority:** Highest. `build-c-spec.md:780` — Build C does not close and Build B does not open until AC-29 is met.

## Read first

1. `RESCUE-NOTES-AC29.md` — branch `rescue/ac-29-maintenance-mode` @ `1bc28c5`, repo root.
   Read without checkout: `git show rescue/ac-29-maintenance-mode:RESCUE-NOTES-AC29.md`
2. Current `angular/src/app/app.component.ts` on master. The interception point cannot be specified from documents; it has to be read.

## Context

A complete-looking maintenance-mode implementation was found uncommitted in a deleted worktree during the 2026-07-30 reconstruction session and rescued onto a preservation branch. **That branch must not be merged as-is.** Half of AC-29 is already live in production; three of six blockers were Design's and are now resolved; three remain and are this contract.

## Scope

### 1. Register both MCP tools
`set_maintenance_mode` and `get_maintenance_mode` are absent from `mcp/division-mcp/src/index.js` — both the `tools` router map and the `/tools` discovery array. Unregistered files are dead code. Register both.

### 2. Correct the auth model — D-635
The rescued `get_maintenance_mode.js` header claims "NO JWT REQUIRED" and describes a public `/maintenance-mode` GET endpoint. That is wrong against current architecture and is **corrected, not accommodated**.

- The tool stays behind division-mcp's global `app.use(validateJwt)`.
- It requires admin.
- **Do not** add a no-JWT carve-out. `/health` and `/tools` remain the only exceptions.

Rationale: the one consumer that must work unauthenticated during a deploy is the Angular bootstrap, and it reads Supabase directly under the existing Arch-1 exception. A public endpoint would widen the attack surface without enabling anything.

### 3. Re-implement bootstrap interception

⚠️ **Do not copy the worktree's `app.component.ts` or `app.module.ts`.** They are Build C era — 31 migrations against master's 94. Copying them regresses roughly three months of application code. The rescued files are sitting on the branch and look usable; they are not.

Write fresh against current `AppComponent`:
- Read `system_config.maintenance_mode` via direct Supabase query **before any route resolves**.
- When true: render `MaintenanceScreenComponent`, suppress all routing, attempt no auth.
- The rescued `maintenance-screen.component.ts` (70 lines, standalone, OnPush, `CommonModule` only, no auth or MCP dependency) appears current-compatible — reuse it.

The direct Supabase read is an authorized Arch-1 exception. It is currently marked **SUSPENDED** in CLAUDE.md because AC-29 was not built. Un-suspend it as part of this contract.

### 4. Tests
Happy-path and error-path for both MCP tools, per CLAUDE.md.

### 5. Migration 095 disposition
`db/migrations/095_system_config_rescued.sql` is the original `027_system_config.sql`, renumbered (027 is taken on master) with its seed INSERT guarded. Determine whether it needs executing against production and **report the answer with reasoning**. The file header is the authority. Do not execute without confirming with Phil (D-622, and CLAUDE.md forbids Code-run migrations).

### 6. Schema reconciliation — ARCH-34, and this is the important one

`public.system_config` exists in production. **No migration on master creates it** — migrations 031 and 053 both `ALTER` a table nothing creates, because the original 027 was run by hand at Build C time and never committed. The database cannot be rebuilt from the repository; a fresh environment fails at 031 with 63 migrations behind it.

Compare the live schema against the complete migration set on master. Report every object that exists in production and is created by no migration. `system_config` was found by accident because two later migrations happened to touch it; nothing rules out others that were never referenced again.

Produce this as `schema-summary.md` — it satisfies D-623 and ARCH-34 in one pass.

## Explicitly out of scope — D-636

**No admin UI for the toggle.** Not a hub card, not a screen, not an in-app control — in Build C or after.

The reason is structural rather than scope-driven: maintenance mode suppresses routing and attempts no auth, so an in-app control could enable the state and could never clear it. The operator in build-c-spec §9 is Code or Phil at a terminal.

Recorded as an explicit D-310 exception so a future entry-point audit does not flag it as a gap.

## Deployment note

This contract builds maintenance mode and therefore cannot use it. This deploy is live, like every deploy before it. Consider running it at low traffic.

## Definition of done

- Both tools registered and reachable; admin auth enforced on both.
- Bootstrap interception works against current `AppComponent`; maintenance screen renders; no route resolves; no auth attempted.
- Four tests pass.
- Migration 095 disposition reported.
- `schema-summary.md` produced, listing all orphaned objects.
- Arch-1 `system_config` exception un-suspended in CLAUDE.src.md.
- AC-29 declared met in `build-c-spec.md` §12.
