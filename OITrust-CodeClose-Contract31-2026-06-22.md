# OITrust CodeClose — Contract 31

**Contract:** 31 — Public Initiative MCP, API Key Infrastructure, API Key Admin Screen
**Governing decisions:** D-473, D-474, D-475
**Date:** 2026-06-22
**Build:** Build C — Delivery Cycle Tracker
**Session type:** Code (build)

---

## Summary

Three workstreams delivered:

- **WS1 — API Key Infrastructure (D-474):** migration `048_api_keys.sql`, key gen/verify + Phil helpers, six Phil-only tools in `division-mcp`, 12 tests.
- **WS2 — API Key Admin Screen (D-475):** `/admin/api-keys` (Phil-only) grid + right panel — List → View → Edit → Create → one-time reveal, Setup Instructions overlay, Inactivate (two-step) / Reactivate (single), status filter, sortable columns.
- **WS3 — initiative-public-mcp (D-473):** new standalone **real MCP server** (Streamable HTTP at `/mcp`, API-key bearer auth), three read-only tools (`list_initiatives`, `get_initiative`, `get_initiative_history`), 11 tests.

All test suites green: division-mcp **64/64**, initiative-public-mcp **11/11**. Angular `npm run build` succeeded (version.json written).

---

## First Principles (Rule 1)

Significant decision this session — WS3 transport. Context → the public server's purpose is executive Claude Desktop access via `mcp-remote`. Question → can it "match the existing pattern exactly" (REST `/tools/:tool`) and still be reachable by `mcp-remote`? Reduce → tool logic + auth + field-exclusions are transport-independent (built + tested as pure functions). Simplify → one stateless Streamable-HTTP `/mcp` endpoint, not a REST mirror + MCP both. Automate → tools registered once via the SDK. Surfaced to Phil before locking; Phil chose the real MCP server.

---

## Push-back / Conflicts flagged before code (Rule 2 / Rule 8)

Conflict check run against the spec, the live schema, and locked decisions before writing code. Two genuine spec-vs-reality conflicts were surfaced to Phil and resolved by him (not unilaterally):

1. **WS3 transport contradiction.** Spec §WS3.1 says "match the existing MCP server pattern exactly," but the three existing servers are plain REST (`POST /tools/:tool`) and nothing speaks the MCP wire protocol — while §WS2.6 Setup Instructions tell execs to connect via `mcp-remote → [URL]/mcp`, which only works against a real MCP server. **Phil's decision: build a real MCP server.** → CC-31-1.
2. **api_key event-log conflict.** §WS1.3 instructs logging key lifecycle to `cycle_event_log`, but that table's `delivery_cycle_id` is `NOT NULL` (FK to `delivery_cycles`); an API key has no Initiative, so the insert fails. **Phil's decision: omit event logging** (the row's `created_by`/`created_at`/`revoked_at` are the audit trail). → CC-31-2.

---

## CC-Decisions (Rule 3) — sequential, no gaps (Rule 17 verified)

- **CC-31-1** — WS3 built as a real MCP server (`@modelcontextprotocol/sdk` Streamable-HTTP transport at `POST /mcp`, stateless), not the REST `/tools/:tool` pattern. *Spec deviation §WS3.1 (Rule 7):* the existing servers are REST and cannot be driven by `mcp-remote`; the Setup Instructions require a real MCP server. Added dep `@modelcontextprotocol/sdk` (+ `zod`), beyond the spec's listed deps (express/bcrypt/supabase). Phil-approved.
- **CC-31-2** — api_key tools do **not** write to `cycle_event_log`. *Spec deviation §WS1.3 (Rule 7):* `cycle_event_log.delivery_cycle_id` is `NOT NULL`; keys aren't Initiative events. Phil-approved. Audit trail = `created_by` + `created_at` + `revoked_at` on the row.
- **CC-31-3** — `isPhil()` helper mirrored into `division-mcp/src/helpers/phil.js`. Spec §WS1.3 said "use the existing `isPhil()` helper (helpers/phil.js)", but that helper existed only in `delivery-cycle-mcp`. Same-shape copy (queries `users.is_super_admin`).
- **CC-31-4** — env var name `SUPABASE_SERVICE_ROLE_KEY` used (repo convention), not the spec's `SUPABASE_SERVICE_KEY`. Matches `db.js` in all existing servers.
- **CC-31-5** — gate-status surface mapping: real `gate_records.gate_status` values `not_started`/`pending` → public `not_submitted`; `awaiting_approval`/`approved`/`returned`/`skipped`/`blocked` pass through. Spec §WS3.4's `not_submitted` is not a stored value.
- **CC-31-6** — artifact `pointer_status` returns the real stored values (`external_only`/`promoted`/`oi_only`). Spec §WS3.4 listed `active`/`stale`/`unknown`, which do not exist and have no backing data (no link-freshness tracking).
- **CC-31-7** — WS3 queries written against the **live** schema, not the stale field names in the spec: PKs `users.id` / `divisions.id` / `delivery_cycles.delivery_cycle_id` / `gate_records.gate_record_id`; `divisions.division_name` (not `display_name`); `cycle_artifact_types.artifact_type_name`; `approver_decision_at` (not `decided_at`). `submitted_at` exists (mig 029).
- **CC-31-8** — "403" (non-Phil) and "409" (already active/inactive) realized as the codebase's uniform `{ success:false, error }` envelope (router serves HTTP 400), matching the existing Phil-gated `set_gate_approver`/`delete_gate_approver_config` precedent. Tests assert the envelope + message.
- **CC-31-9** — `/admin/api-keys` default sort declared as **Created (desc)** (S-036 requires a declared default; D-475 did not specify). Newest keys first; mirrors `list_api_keys` order.
- **CC-31-10** — Stale `division-mcp/tests/tools.test.js` B-92 matcher fixed (was a literal `"\n    .update"` that never matched the CRLF source). Behavior under test confirmed still holds; matcher made line-ending-tolerant. Closes SessionBrief Open Q#1 for that test. (Pure test-quality fix — no product code changed.)

---

## MODIFICATION vs NEW (D-252 / D-280)

| Surface | Class | Notes |
|---|---|---|
| `db/migrations/048_api_keys.sql` | NEW | Phil executes manually (Rule 21) |
| `division-mcp/src/helpers/phil.js`, `api-key.js`, `api-key-format.js` | NEW | |
| 6 api_key tools + `contract31.test.js` | NEW | |
| `division-mcp/src/index.js` | MODIFICATION | additive — register 6 tools + discovery entries |
| `division-mcp/package.json` | MODIFICATION | + bcrypt |
| `division-mcp/tests/tools.test.js` | MODIFICATION | CC-31-10 matcher fix only |
| `angular .../admin/api-keys/*`, `core/services/api-key.service.ts` | NEW | |
| `admin.module.ts`, `admin-hub.component.ts`, `screen-state.service.ts`, `types/database.ts`, `environment(.production).ts`, `changelog.ts` | MODIFICATION | additive |
| `mcp/initiative-public-mcp/**` | NEW | entire server |

**Confirmed-clean (must not regress, D-280):** existing division-mcp tools + JWT middleware (64/64 green); admin hub cards/routes (build green); McpService server routing (unchanged — `initiative` deliberately NOT added; Angular never calls the public server).

---

## CodeClose Verification Pass (Rule 29)

**(1) Spec coverage** — acceptance criteria 1–22:
- AC 1 (table + indexes): PASS — migration 048 (Phil to apply).
- AC 2 (raw_key once, get has none): PASS — `create_api_key` returns `raw_key`; `get_api_key`/shape helper never include it (test).
- AC 3–5 (inactivate/reactivate/409): PASS — tests.
- AC 6 (403 non-Phil all six): PASS — `isPhil` gate; envelope per CC-31-8 (test).
- AC 7 (`/admin/api-keys` Phil-only): PASS — `is_super_admin` gate + D-140 blocked band (build).
- AC 8 (hub card Phil-only): PASS — `philOnly:true` card.
- AC 9 (Create → reveal → Done): PASS — `panelMode='reveal'`, no ×, Done → View + refresh.
- AC 10 (Setup overlay, URL substituted): PASS — `setupInstructionsText` interpolates `environment.initiativeMcpBaseUrl` (placeholder in source; Phil sets prod).
- AC 11/12 (inactivate two-step / reactivate single, pill flips): PASS.
- AC 13 (edit name): PASS.
- AC 14 (default Active filter; All shows both): PASS — default `'active'`.
- AC 15/16 (no/revoked auth → 401): PASS — `validateApiKey` invalid → index returns 401 (auth tests).
- AC 17 (list, no emails/raw UUIDs): PASS — whitelist shaping (test asserts no `@`, no UUIDs).
- AC 18 (lifecycle_stage filter): PASS — test.
- AC 19 (get_initiative milestones(5)/gates(5)/artifacts, no consulted/approver UUID): PASS — test.
- AC 20 (history descending, no email_sent, no event_metadata): PASS — test.
- AC 21 (unknown id → 404): PASS — null → `notFound` at transport (test returns null).
- AC 22 (last_used_at updates): PASS — `validateApiKey` fire-and-forget update on match. *Verified by code + unit path; live confirmation requires deploy (Phil UAT).* 

**(2) Regression check** — division-mcp full suite 64/64 (52 pre-existing + 12 new). Angular prod build succeeded with no new errors. No existing behavior removed; all index.js/registry changes additive. CC-31-10 fixed a stale-matcher false failure (behavior unchanged).

**(3) Test ratchet** — every logic-touching change protected:
- 6 api_key tools + key gen/verify → `contract31.test.js` (12 tests).
- 3 public tools + auth → `contract31-public-mcp.test.js` (11 tests).
- WS2 Angular component: no Karma spec added — flagged as CLAUDE.md candidate (see below); covered by `npm run build` type-check + manual UAT. Consistent with existing admin screens (gate-approvers has no component spec).

**(4) Pattern sweep** — shared patterns touched: `SCREEN_KEYS` (added constant, no other component affected); admin hub card array (additive); McpService (unchanged). Entity-chip standard (S-021/D-181): the View panel renders "Created By" and approver names as plain text — **matches the gate-approvers precedent** (that Phil-only admin screen renders `approver_display_name` as plain text, not a chip+detail-nav). No user-detail navigation is wired on admin config screens. Recorded as a candidate for a future system-wide sweep.

**(5) Standards conformance** (CodeClose-applicable):
- S-030 (single responsibility): PASS — services thin; shaping extracted to `api-key-format.js` / `format-helpers.js` (no duplication across list/get). `api-keys.component.ts` is one screen (~640 lines, NEW — exempt from Rule 11 threshold; Setup overlay is an extraction candidate if it grows).
- S-031 (test ratchet / naming): PASS — verb+object names; ratchet per (3).
- S-032: not applicable (no Active/Inactive *entity soft-block* surface; key revoke is its own lifecycle).
- S-033 (build pipeline): PASS — `npm run build` wrote version.json; no new suite regressions.
- S-035 (About entry): PASS — changelog.ts prepended (block below).
- S-036 (sortable columns): PASS — all 5 columns sortable; default declared (CC-31-9).

**(6) CC-decision completeness** — CC-31-1 … CC-31-10, sequential, no gaps.

**(7) Structural health** (Rule 12 — files modified this session):
- `division-mcp/src/index.js` ~190 lines (router — under 400). 
- `admin-hub.component.ts` ~178 lines (component — under 300). 
- `screen-state.service.ts` ~140 (service — under 400). 
- `admin.module.ts` ~34. `changelog.ts`/`environment*.ts` data/config. `types/database.ts` ~605 (type-declaration file — not a component/service; informational).
- NEW: `api-keys.component.ts` ~640 lines — exceeds 300 (NEW-file exempt per spec); flagged as a candidate for Setup-overlay extraction.

**(8) Deployment (Rule 29 §8 / D-372):** Code does **not** auto-run this — migrations are Phil-only (Rule 21) and Render does not auto-deploy (memory: manual redeploy). Deployment is **staged, pending Phil**, not failed. UAT Checklist is produced (work complete + verified by tests/build). **Deploy prerequisites** below.

---

## Deployment prerequisites (Phil-run, in order)

1. **`git add` ALL new files before pushing** — untracked: `mcp/division-mcp/src/helpers/`, the six `*_api_key*.js` tools, `mcp/division-mcp/tests/contract31.test.js`, and the entire `mcp/initiative-public-mcp/`. Render deploys from pushed master; missing files → "Cannot find module" crash (per prior incident). Run `git status -s` and confirm no `??` source files remain.
2. **Apply migration** `db/migrations/048_api_keys.sql` against Supabase (full SQL displayed below). Verify RLS enabled, 0 policies (deny-by-default).
3. **division-mcp** → push master, then **manually redeploy in Render** (adds `bcrypt`; new tools). 
4. **initiative-public-mcp** → create a **new Render web service** from `mcp/initiative-public-mcp/`; set env `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (same as other servers); start `npm start`. Note the deployed URL.
5. **Angular** → set `initiativeMcpBaseUrl` in `environment.production.ts` to the real Render URL from step 4, then `npm run build` and deploy GitHub Pages (worktree-safe copy per CLAUDE.md / memory).
6. Smoke: from a Claude Desktop config (Setup Instructions block) with a freshly created key, confirm `list_initiatives` returns data and `last_used_at` updates.

---

## Full migration SQL (Rule 21 — Phil executes; Code does NOT run it)

See `db/migrations/048_api_keys.sql`. Key points: `api_keys` (key_id PK, key_hash UNIQUE, display_name, user_label, scope_type CHECK in ('all','divisions'), division_ids uuid[], created_at, last_used_at, revoked_at, created_by → users(id)); indexes on key_hash and revoked_at; **RLS enabled with no policies** (service-role-only; no anon reads of key_hash). No `deleted_at` (Arch-6 exception — revoked_at is lifecycle end). No `updated_at` trigger.

---

## UAT Checklist (Rule 19 / D-357)

Run after the deploy steps above. Binary pass/fail, no Code present.

### Surface 1 — Admin hub (Phil)
1. Sign in as Phil → `/admin` shows an **API Keys** card. PASS/FAIL.
2. Sign in as a non-Phil admin → the API Keys card is **absent**. PASS/FAIL.

### Surface 2 — API Keys grid + Create/Reveal
3. Open `/admin/api-keys` as Phil → grid loads, default filter shows **Active** only. PASS/FAIL.
4. As a non-Phil admin, navigating to `/admin/api-keys` → blocked message ("Only Phil can issue and manage API keys"). PASS/FAIL.
5. Click **+ Add Key**, enter Display Name + User Label, Save → **one-time reveal** shows an `oitrust_…` key, **Copy** → "Copied ✓", no × on the panel. PASS/FAIL.
6. Click **Done** → panel switches to View of the new key; grid shows the new row. PASS/FAIL.
7. Re-open the key → the raw key is **not** shown anywhere. PASS/FAIL.

### Surface 3 — Setup Instructions / Edit / Inactivate / Reactivate
8. In View → **Setup Instructions** → overlay shows the config block with the **real Render URL** substituted (not a placeholder). **Copy instructions** → "Copied ✓". PASS/FAIL.
9. **Edit** → change Display Name → Save → snackbar "Key updated."; View shows the new name. PASS/FAIL.
10. **Inactivate** → two-step confirm ("will stop working immediately") → confirm → pill flips to stone **Inactive**, snackbar "Key inactivated." PASS/FAIL.
11. Switch Status filter to **Inactive** → the key appears; **Reactivate** → single confirm → pill flips to green **Active**, snackbar "Key reactivated." PASS/FAIL.

### Surface 4 — Public MCP (Claude Desktop)
12. Paste the Setup Instructions into a Claude Desktop config, replace `oitrust_XXXXX` with a created key, restart → ask Claude to "list OI Trust initiatives" → returns Initiatives (no emails, no UUIDs). PASS/FAIL.
13. Ask for one initiative's detail → milestones, gates, artifacts returned; no consulted names / approver UUIDs. PASS/FAIL.
14. Inactivate that key in the admin screen → next Claude Desktop call → **401 / unauthorized**. PASS/FAIL.
15. Re-open the key's View → **Last Used** shows a recent time (was "Never used"). PASS/FAIL.

---

## About Entry (S-035) — also added to changelog.ts

## About Entry — Contract 31
Date: 2026-06-22
BuiltAt: (set at deploy)
Items:
- [Admin] Admin — API Keys (Phil only): issue/manage keys that connect an executive's Claude Desktop to OI Trust as a read-only Initiative source; one-time key reveal, Setup Instructions, edit, inactivate (two-step), reactivate; Active/Inactive/All filter.

---

## Stage advancement check (S-020)

The API Keys screen is reached via the Admin hub, not a top-level `NAV_ITEMS` entry — there is no `devStatus` to advance. Nothing to flag until Phil UATs (per standing guidance: flag advancement only after Phil UAT, not on deploy).

---

## CLAUDE.md Candidates (Rule 16)

1. **Public MCP key-auth perf** — `validateApiKey` bcrypt-compares every active key per request. Fine for Phase 1; add a fast-path lookup column if key count grows. (Trigger: WS3.2 implementation.)
2. **API Keys component has no Karma spec** — WS2 component logic (reveal flow, status filter, two-step inactivate) is covered by build + UAT only, matching existing admin screens. Candidate: a component-spec standard for admin grid+panel screens. (Trigger: Rule 29 §3.)
3. **gate_status surface vocabulary** — public MCP maps `not_started`/`pending` → `not_submitted`. Candidate: align the spec's documented gate-status enum with the live `gate_records` CHECK values. (Trigger: CC-31-5.)
4. **Decision-registry gap** — repo `decision-registry.md` next-available is D-452 and tops out at D-451, but this contract is governed by D-473/474/475 (carried in the SessionBrief). The registry is behind; Design should backfill. (Trigger: session init.)
5. **`build-c-spec.md` is stale (v2.0, April)** — predates the DS→DCS / CB→EPO / Delivery Cycle→Initiative renames (D-389–393) and the role/column changes. Candidate: refresh or supersede. (Trigger: session init cross-check.)

---

## Session output path

`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\OITrust-CodeClose-Contract31-2026-06-22.md`

---

## Follow-on (post-Contract-31, same session) — Division creation in the UI

After Contract 31 deployed, Phil directed an in-session change to **Division Management**: add Division **creation** to the UI, Phil-only.

**Built:**
- `division-mcp/create_division.js` — tightened from admin-level to **Phil-only (`is_super_admin`)**, with a guard test (`tools.test.js`). Tool already computes `division_level` from the parent (null parent → Trust level 0).
- `admin/divisions/divisions.component.ts` — **"+ Add Trust"** (toolbar) creates a top-level Trust; **"+ Add Service Line"** (in a Trust's View) and **"+ Add Functional Team"** (in a Service Line's View) create children. New Create panel (modal, mirrors Edit) with Division Name + optional Short Name; on save expands the parent, refreshes the grid (S-008), opens the new Division's View. All gated on `is_super_admin`. Subheading + stale `+ New Division REMOVED` comment updated.

**Verification:** division-mcp 65/65; Angular `npm run build` exit 0.

### ⚠️ NOTE TO DESIGN — D-number required (reverses a locked decision)

This **reverses D-413 / D-414**, which deliberately removed Division creation from the UI ("structural changes require a Design session"), and the divisions spec §2.1 "+ New Division REMOVED." It was built on Phil's direct in-session instruction. **Code cannot mint a D-number (D-317)** — Design must assign one and ratify the following:

1. **New decision** authorizing Phil-only Division creation in the UI, superseding the relevant clause of D-413/D-414. State its number and back-reference here.
2. **Scope boundary** (as built): only **creation** is opened. **Re-parenting and level changes remain Design-gated** — no UI to move or re-level a Division. Confirm this is the intended boundary.
3. **Authorization level:** built as **Phil-only (`is_super_admin`)**, enforced both in the UI and server-side in `create_division` (stricter than the tool's prior admin-level contract). Confirm, or decide whether Division Admins should create children within their own branch (the tool's original "downward-only" design — currently gated off by the super-admin check).
4. **Field set** (no governing spec existed — Rule 6): create form collects **Division Name** (required) + **Short Name** (optional, ≤10, derived if blank); parent/level/type are derived from context; `division_type_label` set to the level label. Confirm or extend (e.g., set Division Leader at creation).

Until a D-number is assigned, this ships as a CC-decision pending Design ratification.

---

*Pathways OI Trust · CONFIDENTIAL · Contract 31 (+ follow-on) · 2026-06-22*
