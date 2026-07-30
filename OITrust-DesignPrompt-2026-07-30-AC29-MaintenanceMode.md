# Design Session Prompt — AC-29 Maintenance Mode: Auth Posture + §9 Sequence

**Date raised:** 2026-07-30
**Raised by:** Code session (CC-40-G..Q reconstruction + AC-29 rescue)
**Type:** Two decisions requiring Design. Item 1 is a security-boundary decision escalated under Rule 30 — Code will not resolve it unilaterally.
**Artifacts:** branch `rescue/ac-29-maintenance-mode` (`1bc28c5`, pushed) · `RESCUE-NOTES-AC29.md` · `OITrust-CodeClose-2026-07-30-C40-GQ-Reconstruction-for-DesignSession.md`

---

## Background Design needs before either decision

Maintenance mode is the Build C close gate. `docs/build-c-spec.md:780`:

> *"Build C does not close and Build B does not open until criterion 29 (maintenance mode) is met."*

It has never been met. A complete-looking implementation was found on 2026-07-30 as **untracked, historyless files** in `.claude/worktrees/youthful-khorana/` — never committed to any ref, its worktree git metadata already deleted, and git actively attempting to prune it (blocked only by OneDrive file locks). It is now preserved on the rescue branch above. That branch does **not** make the feature work.

**Three findings that change the shape of these decisions:**

1. **Half of AC-29 is already live in production.** No migration on master creates `public.system_config` — yet migration `031` (RLS + policy) and `053` (ADD COLUMN) both `ALTER` it successfully, and both have been applied. The orphaned `027_system_config.sql` was therefore executed manually at Build C time. **The table, its `maintenance_mode` / `maintenance_message` columns, its RLS policy, and its seeded row are all live.** What is missing is only application code.

2. **Anonymous read access to the flag already exists and was already accepted.** `031_enable_rls_all_tables.sql:336-345`:
   ```sql
   -- D-MaintenanceMode exception: SELECT TRUE so Angular bootstrap reads
   -- maintenance_mode pre-auth. maintenance_message is therefore public —
   -- accepted known limitation at deployment scale.
   CREATE POLICY "system_config_select" ON public.system_config
     FOR SELECT USING (TRUE);
   ```
   So `maintenance_mode` and `maintenance_message` are **already readable by anyone** with the anon key. This is prior accepted design, not a new exposure.

3. **There is currently no unauthenticated endpoint anywhere in the MCP layer.** Both services apply `app.use(validateJwt)` globally *before* mounting `/health` and `/tools`, and the middleware has no path exceptions. Verified live 2026-07-30: `curl https://division-mcp.onrender.com/tools` → **HTTP 401**. The `// (no JWT required)` comments above those routes in both `index.js` files are stale and describe intent the middleware order defeats.

---

## DECISION 1 — What is `get_maintenance_mode`'s auth posture?

### The conflict

The rescued `mcp/division-mcp/src/tools/get_maintenance_mode.js` declares in its own header:

> *"NO JWT REQUIRED — Angular reads system_config directly from Supabase on bootstrap (D-MaintenanceMode; the one deliberate exception to D-93). This MCP tool is registered as a public GET endpoint (`/maintenance-mode`) in index.js so it can also be polled without auth if needed during deployment."*

That contradicts current division-mcp architecture (finding 3). Honouring the header means **creating the first unauthenticated endpoint in the entire MCP layer** and adding a deliberate carve-out to `validateJwt`.

### The question Design must answer

Does maintenance mode need an unauthenticated MCP endpoint at all — and if so, is establishing the first public-endpoint precedent warranted?

**Key input:** the Angular bootstrap read does **not** use this tool. Per `build-c-spec.md:393` it reads `system_config` **directly from Supabase**, deliberately, because *"MCP servers may be down during deployment"* — the exact condition under which an MCP-based check is useless. So the public endpoint is not required for the feature to function.

### Options

| | Option | What it means | Trade-offs |
|---|---|---|---|
| **A** | **JWT-protected admin read only** (drop the public claim) | `get_maintenance_mode` stays behind `validateJwt` like every other tool. Bootstrap reads Supabase directly. | Smallest attack surface. No new precedent. Loses any unauthenticated deploy-time probe. Requires editing the rescued file's header comment. |
| **B** | **Public `/maintenance-mode` endpoint** with an explicit `validateJwt` carve-out | An external monitor or operator can poll deploy state without credentials. | Adds **no new data exposure** (finding 2 — the data is already anon-readable via RLS). But adds a new *unauthenticated request surface* (DoS/abuse target) and sets the first public-endpoint precedent, which future work will cite. |
| **C** | **Delete `get_maintenance_mode` entirely** | Keep only `set_maintenance_mode` (admin, JWT). Bootstrap reads Supabase directly; nothing else needs to read the flag. | Least code, least surface. Forecloses server-side reads (e.g. a future admin UI showing current state would read Supabase or re-add the tool). |

**Code's lean (stated, not taken):** **A**. It satisfies every functional requirement in §5.2 and §9, since the bootstrap read bypasses MCP by design. B's benefit is an unauthenticated deploy probe, which is real but is a separate concern better addressed by Decision 1a below — and B's cost is a precedent every future tool author can point at. Code did **not** implement this lean; Rule 30 routes security-boundary decisions to Design.

### Decision 1a (related, Design may fold in or split)

**`/health` and `/tools` are behind JWT on both services** (finding 3). Two consequences:

- **§9 step 6, "Run health checks", is not externally runnable.** No unauthenticated probe exists on either service. Whatever "health checks" means operationally, it currently cannot be performed by an external monitor.
- **It has already cost real diagnostic time.** During Contract 40's follow-on, `curl .../tools` returned an auth error and was misread as "the tool did not ship," sending a debugging cycle down the wrong path. The tool had shipped.

Design may wish to decide whether `/health` should be genuinely unauthenticated (its comment already claims it is), independently of the `get_maintenance_mode` question. Note this partly overlaps Option B — a public `/health` might satisfy the deploy-probe need without a public `/maintenance-mode`.

---

## DECISION 2 — Amend §9 to name Phil's manual migration step

**Phil directed this on 2026-07-30.** Recorded here for ratification rather than applied directly: `build-c-spec.md` is a Session Initialization document, so Code does not edit its own governing instructions.

### The problem

`docs/build-c-spec.md` §9 currently reads:

```
1. Call set_maintenance_mode(true) via division-mcp tool
2. Run Supabase migrations
3. Deploy delivery-cycle-mcp to Render (wait for healthy)
4. Deploy division-mcp to Render (wait for healthy)
5. Deploy Angular to GitHub Pages
6. Run health checks
7. Call set_maintenance_mode(false)
```

Step 2 is written as though whoever runs the sequence also runs the migrations. **Code cannot** — `CLAUDE.md` requires migrations be written to the repo, displayed, and then executed **manually by Phil**, with any direct execution attempt counted a violation. Likewise steps 3 and 4: Render does not auto-deploy, and **only Phil can trigger a redeploy** from the dashboard. So the sequence as written describes automation that does not exist, and Rule 29(8) requires reporting against it.

### Proposed replacement text

```
Before any schema migration, MCP deploy, or Angular deploy. Steps marked
[PHIL] are manual and cannot be performed by Code — the sequence pauses at
each until Phil confirms completion.

1. Code:   set_maintenance_mode(true) via division-mcp; confirm the
           maintenance screen renders before proceeding
2. Code:   write migration file to repo, display full SQL, STOP
3. [PHIL]  execute the migration against Supabase; confirm to Code
4. Code:   commit, then build (Rule 35 — version.json stamps HEAD)
5. Code:   push master; confirm commits are on origin/master (Rule 42)
6. [PHIL]  redeploy delivery-cycle-mcp on Render; confirm Live on the
           expected commit
7. [PHIL]  redeploy division-mcp on Render (if touched); confirm Live
8. Code:   deploy Angular to GitHub Pages
9. Code:   health checks (see Decision 1a — currently not externally
           runnable; both services gate /health behind JWT)
10. Code:  set_maintenance_mode(false); confirm normal routing resumes

Maintenance mode is never left active. Clearing it is the final required
deployment step and Code must confirm it is cleared before session close.
If the sequence is abandoned mid-way for any reason, clearing the flag is
still mandatory.
```

**Changes from the original, each with a reason:**

| Change | Reason |
|---|---|
| Added `[PHIL]` markers + explicit pause semantics | Steps 3, 6, 7 are human-gated; the original implies otherwise |
| Split migration authoring (Code) from execution (Phil) | `CLAUDE.md` migration rule — Code writes and displays, Phil executes |
| Named the Render redeploys as Phil-only, with commit confirmation | Render does not auto-deploy; a redeploy before the push silently ships old code (Rule 42) |
| Inserted commit-before-build and push-confirmation | Rules 35 and 42 already require these; §9 omitted both |
| Added confirmation that the maintenance screen actually renders (step 1) | Setting a flag is not evidence the interception works |
| Added the abandoned-sequence clause | The original said "never left active" but only in the happy path |

**Question for Design:** ratify this text, or amend? Should the 10-step form live in `build-c-spec.md` §9, be lifted into `CLAUDE.md` Rule 29(8) (which already enumerates an abbreviated version and is what Code actually reads each session), or both with one designated canonical?

---

## What Design is NOT being asked

Neither decision requires closing AC-29 now. The remaining build work — register both tools, re-implement bootstrap interception against the current `AppComponent` (the worktree's is Build C era, 31 migrations vs master's 94, and must not be copied), tests, and an admin toggle surface — is a scoped contract, blocked only by Decision 1. Full blocker list in `RESCUE-NOTES-AC29.md`.

Migration `095_system_config_rescued.sql` on the rescue branch most likely needs **no execution** (finding 1); its header explains why and its seed INSERT was guarded so it is safe in any environment.

---

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-07-30
