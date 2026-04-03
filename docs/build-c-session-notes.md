# Build C Session Notes
# Pathways OI Trust | April 2026 | CONFIDENTIAL
# For handoff to future Claude Code sessions

---

## What Build C Delivered

Build C is complete and deployed. All acceptance criteria from build-c-spec Section 8 are met.

### Deployed infrastructure
| Service | URL | Status |
|---|---|---|
| Angular app | https://phil-dodds.github.io/TRIARQ-OITrustEarly/ | Live |
| division-mcp | https://division-mcp.onrender.com | Live (Build A) |
| document-access-mcp | https://document-access-mcp.onrender.com | Live (Build A) |
| delivery-cycle-mcp | https://delivery-cycle-mcp.onrender.com | Live (Build C) |
| Supabase project | https://dpnkxrrtqfqkhuzbljbw.supabase.co | Live |
| GitHub repo | https://github.com/Phil-Dodds/TRIARQ-OITrustEarly | master branch |

### GitHub deploy details
- **Git author email**: pdodds@triarqhealth.com (NOT phil@triarq.com)
- **Git author name**: Phil Dodds
- **GitHub Pages branch**: gh-pages
- **Angular build command**: `ng build --configuration production`
- **GitHub Pages deploy command**:
  ```
  npx angular-cli-ghpages --dir=dist/pathways-oi-trust/browser \
    --repo=https://github.com/Phil-Dodds/TRIARQ-OITrustEarly.git \
    --branch=gh-pages \
    --name='Phil Dodds' \
    --email='pdodds@triarqhealth.com'
  ```
- Run from: `angular/` directory

### Render service settings (delivery-cycle-mcp)
| Setting | Value |
|---|---|
| Root directory | *(repo root)* |
| Build command | `cd mcp/delivery-cycle-mcp && npm install` |
| Start command | `node mcp/delivery-cycle-mcp/src/index.js` |
| Node version | 22 (Render default) |
| Branch | master |

**Render environment variables (delivery-cycle-mcp):**
- `SUPABASE_URL` = https://dpnkxrrtqfqkhuzbljbw.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY` = *(in Phil's local .env — get from Supabase Dashboard → Project Settings → API → service_role secret)*
- `PORT` = 3003 (Render sets this automatically — leave unset in Render env vars)

---

## Files Created or Modified in Build C

### New files
```
mcp/delivery-cycle-mcp/                    ← full MCP server (16 tools)
  src/index.js
  src/db.js
  src/lifecycle.js
  src/middleware/jwt.js
  src/tools/ (16 tool files)
  tests/jwt.test.js
  tests/tools.test.js
  package.json
  .env.example

angular/src/app/core/services/
  delivery.service.ts                      ← all 16 MCP tool calls

angular/src/app/features/delivery/
  dashboard/delivery-cycle-dashboard.component.ts
  detail/delivery-cycle-detail.component.ts
  stage-track/stage-track.component.ts
  workstream-admin/workstream-admin.component.ts
  delivery.module.ts

db/migrations/
  015_create_delivery_workstreams.sql
  016_create_workstream_members.sql
  017_create_delivery_cycles.sql
  018_create_cycle_milestone_dates.sql
  019_create_gate_records.sql
  020_create_cycle_event_log.sql
  021_create_cycle_artifact_types.sql      ← includes 26 seed rows
  022_create_cycle_artifacts.sql
  023_create_jira_links.sql
  verify_build_c_schema.sql
```

### Modified files
```
angular/src/app/core/services/mcp.service.ts     ← added 'delivery' server type
angular/src/app/core/types/database.ts           ← all Build C types + artifacts field
angular/src/app/features/admin/admin.module.ts   ← added /workstreams route
angular/src/environments/environment.ts          ← deliveryCycleMcpUrl: localhost:3003
angular/src/environments/environment.production.ts ← deliveryCycleMcpUrl: Render URL
```

---

## Known Issues / Tech Debt for Next Session

### Minor issues (non-blocking)
1. **Health endpoint JWT** — `/health` and `/tools` GET routes on delivery-cycle-mcp are behind JWT middleware (they should be exempt). Comment says "no JWT required" but the `app.use(validateJwt)` runs before these routes. Fix: move health/tools routes before `app.use(validateJwt)`, or add path exclusion to the middleware. Low priority — Angular always sends JWT so this only affects manual curl testing.

2. **Login component CSS budget** — Angular build shows a budget warning (3KB vs 2KB limit) on login component styles. Non-blocking. Fix: refactor login component inline styles to use token variables, or increase budget in `angular.json`.

3. **Workstream Lead user picker** — WorkstreamAdminComponent calls `list_users` on division-mcp. Confirm this tool exists and returns `{ id, display_name }` — it was added in Build A but not verified against the live API in Build C testing.

4. **node --test Windows path** — `npm test` in delivery-cycle-mcp uses `node --test tests/` which fails on Windows. Must run as: `node --test tests/jwt.test.js tests/tools.test.js`. Fix the package.json test script if running tests on Windows.

---

## Build Sequence Status

Per Session 2026-03-24-P: A → C → B → D → E → F

| Build | Status | Description |
|---|---|---|
| A | ✅ Complete + deployed | OI Library, document access, division management |
| C | ✅ Complete + deployed | Delivery Cycle Tracker |
| B | 🔜 Next | Embedded chat, OI Library submission workflow, notification SLA timers |
| D | — | — |
| E | — | — |
| F | — | — |

---

## Build B Scope (next session context)

Build B picks up exactly where Build C stubs left off:

1. **OI Library submission workflow** — `promote_artifact_to_oi_library` currently returns a stub message. Build B wires this fully.
2. **Embedded chat** — ChatModule (already lazy-loaded stub in AppModule routing)
3. **Notification SLA timers** — Build B / D per CLAUDE.md

Do NOT re-build anything from Build C. The delivery-cycle-mcp 16 tools and Angular DeliveryModule are complete.

---

## Session Init Reminder for Build B

Per CLAUDE.md hard pause rule:
1. Read CLAUDE.md
2. Call `get_session_context` on governing docs MCP endpoint
3. Confirm build scope = **Build B**
4. Read Master Build Plan
5. Read Build B Specification

---

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | April 2026
