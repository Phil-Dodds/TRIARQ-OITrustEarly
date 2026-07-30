# AC-29 Maintenance Mode — Rescue Notes

**Branch:** `rescue/ac-29-maintenance-mode` (branched from `master` @ `2ef60ab`)
**Date:** 2026-07-30
**Status:** PRESERVATION ONLY. Not merged, not deployed, not complete. Do not merge as-is.

---

## Why this branch exists

A complete-looking maintenance-mode implementation was found on disk in
`.claude/worktrees/youthful-khorana/` during the 2026-07-30 CC-40-G..Q
reconstruction session. It had **never been committed to any git ref**, and its
worktree git metadata (`.git/worktrees/youthful-khorana`) **had already been
deleted** — so `git worktree list` did not show it and no `git log --all` search
could find the files. It was plain, untracked, historyless files on disk, one
cleanup away from permanent loss.

This branch commits the salvageable parts so they cannot be lost. It does not
finish the work.

Build C §12 AC-29 is the reason this matters:

> *"Build C does not close and Build B does not open until criterion 29
> (maintenance mode) is met."* — `docs/build-c-spec.md:780`

---

## What maintenance mode is for

Per `docs/build-c-spec.md` §5.2 and §9: a `system_config.maintenance_mode`
boolean that `AppComponent` reads **before any route resolves**, via a direct
Supabase query (one of the two authorized Arch-1 exceptions — the read must work
when MCP servers are down mid-deploy). When true, the app renders
`MaintenanceScreenComponent`, suppresses all routing, and attempts no auth.

§9 makes it the **standing deployment sequence**, not a one-off:

```
1. set_maintenance_mode(true)
2. Run Supabase migrations
3. Deploy delivery-cycle-mcp to Render (wait healthy)
4. Deploy division-mcp to Render (wait healthy)
5. Deploy Angular to GitHub Pages
6. Health checks
7. set_maintenance_mode(false)
```

`CLAUDE.md` Rule 29(8) already **requires** this sequence be run and reported at
every CodeClose. Because the capability was never merged, that step has never
been executable — every deployment to date has been non-conformant with Rule
29(8) by omission, not by choice.

The cost is not theoretical. During Contract 40's follow-on arc, Angular shipped
the scoped approver picker before `delivery-cycle-mcp` had
`list_eligible_approvers`, and again while a PK bug was live. Real users saw
"Couldn't load eligible approvers" on a live screen. Maintenance mode is exactly
the control that collapses that window into an honest "we're updating" page.

---

## Current state: half of AC-29 is already live in production

**Already in production (verified from migrations on master):**

| Piece | Evidence |
|---|---|
| `public.system_config` table, with `maintenance_mode` + `maintenance_message` | `031` and `053` both `ALTER` it successfully; no migration on master creates it → the orphaned 027 was run manually at Build C time |
| RLS enabled + anon-readable | `031_enable_rls_all_tables.sql:340-345` — `system_config_select` policy `USING (TRUE)`, comment cites D-MaintenanceMode and accepts that `maintenance_message` is therefore public "at deployment scale" |
| `status_refresh_last_run` column (unrelated feature sharing the table) | `053_system_config_status_refresh.sql` |

**Rescued onto this branch (was orphaned, now committed):**

| File | Notes |
|---|---|
| `angular/src/app/features/maintenance/maintenance-screen.component.ts` | 70 lines. Standalone, OnPush, `CommonModule` only, no auth or MCP dependency. Verbatim as found. Appears current-compatible. |
| `mcp/division-mcp/src/tools/set_maintenance_mode.js` | 51 lines. Admin-only, JWT required. Writes `maintenance_mode`, `maintenance_message`, `updated_at`, `updated_by`. Verbatim as found. Matches current division-mcp `(params, caller_user_id)` + `../db` convention. |
| `mcp/division-mcp/src/tools/get_maintenance_mode.js` | 35 lines. No JWT by design. Verbatim as found. **See blocker 3.** |
| `db/migrations/095_system_config_rescued.sql` | Original `027_system_config.sql` renumbered (027 is taken on master by `027_add_display_name_short_to_workstreams.sql`) and its seed INSERT guarded. See the file header for the one deliberate change. |

**Deliberately NOT rescued:**

The worktree's `app.component.ts` / `app.module.ts` carried the bootstrap
interception, but that worktree is from the Build C era — **31 migrations vs
master's 94**. Copying those files onto master would regress roughly three
months of application code. The interception must be **re-implemented against
current `app.component.ts`**, not restored. This is the single largest remaining
piece of work.

---

## Blockers before this can merge

1. **Bootstrap interception is missing.** Nothing yet reads
   `system_config.maintenance_mode` at startup, so the rescued component is
   unreachable and the feature does not function. Must be written fresh against
   the current `AppComponent`. Note `CLAUDE.md` already lists this exact read as
   an authorized Arch-1 exception — the permission exists, the code does not.

2. **Neither MCP tool is registered.** `set_maintenance_mode` and
   `get_maintenance_mode` are absent from `mcp/division-mcp/src/index.js` —
   both the `tools` router map and the `/tools` discovery array. Unregistered
   files are dead code.

3. **`get_maintenance_mode` has an auth-model conflict.** Its header says "NO JWT
   REQUIRED ... registered as a public GET endpoint (`/maintenance-mode`)". But
   current division-mcp applies `app.use(validateJwt)` globally
   (`mcp/division-mcp/src/index.js`) before the tool router; `/health` and
   `/tools` are mounted as explicit no-JWT exceptions. A public
   `/maintenance-mode` endpoint therefore needs a deliberate carve-out. Whether
   it should be public at all is a **security-boundary decision — Rule 30 says
   that goes to Design, not to Code.** Note the Angular bootstrap read does not
   depend on this tool (it reads Supabase directly), so the public endpoint may
   be unnecessary; `get_maintenance_mode` may only be needed as an
   authenticated admin read.

4. **No tests.** No happy-path or error-path test exists for either tool
   (CLAUDE.md requires both per MCP tool).

5. **No admin UI.** Nothing surfaces the toggle. §9 assumes an operator can call
   `set_maintenance_mode(true)`. Today that would be a raw MCP call. Design
   should decide whether it belongs in Admin (Phil/super-admin only, presumably)
   or stays a deliberate command-line-only control.

6. **§9's sequence assumes automation that does not exist.** Step 2, "Run
   Supabase migrations", sits inside the maintenance window — but `CLAUDE.md`
   forbids Code from executing migrations; Phil runs them manually. In practice
   the sequence is: Code sets the flag → Phil runs the migration → Code deploys →
   Code clears the flag. The spec text should be reconciled with that reality.

---

## Recommended next step

Do not merge this branch to close AC-29 — it is preservation, not completion.
Treat it as the input to a scoped contract: register the two tools, decide the
`get_maintenance_mode` auth posture at Design (blocker 3), re-implement the
bootstrap interception against current `AppComponent`, add tests, and decide the
admin surface. Migration 095 most likely needs no execution (see its header).

---

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-07-30
