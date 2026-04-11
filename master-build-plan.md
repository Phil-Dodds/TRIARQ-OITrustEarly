# Master Build Plan
Pathways OI Trust | v1.4 | March 2026 | CONFIDENTIAL
Owner: Phil Dodds, EVP Performance & Governance
Source: D-133

---

## Definitions

**Demonstration** = pre-port, proof-of-capability. Production-ready architecture and function. Infrastructure is pre-port (personal GCP, Supabase, Render, GitHub Pages). At port time, TRIARQ engineers replace infrastructure layer. Angular app, MCP tool contracts, and skills layer unchanged.

**Production-ready** = designed to be used from Build A forward. Real Delivery Cycles, real OI Library approvals, real RACI enforcement, real MCP architecture. No cycle produces a prototype.

---

## Infrastructure Stack (D-132, D-143, D-148)

| Layer | Pre-Port | Port-Time Replacement |
|-------|----------|----------------------|
| Frontend | Angular 19 + Native Federation | Unchanged |
| DB | Supabase (PostgreSQL + pgvector + Auth) | BigQuery + TRIARQ Auth |
| MCP Servers | Node.js on Render | Cloud Run Confidential |
| AI | Vertex AI (personal GCP) | Vertex AI (TRIARQ GCP) |
| Hosting | GitHub Pages | TRIARQ infrastructure |

MCP layer = portability guarantee.

---

## Build Prerequisites (one-time setup)

1. ~~Phil: personal GCP account setup, Vertex AI API enabled~~ — **COMPLETE** (Session 2026-03-29-E)
2. Phil: Supabase project created, credentials available
3. GitHub repo with CLAUDE.md and Build Spec in /docs/
4. Engineering lead: Vertex AI model selection (ARCH-19) — does not block Build A

---

## Six Build Cycles

| Cycle | Focus | Key Deliverables |
|-------|-------|-----------------|
| **A** | Foundation | Container hierarchy, bulk knowledge seed, Document Access MCP, Division MCP, home screen (chat card stub only — wired in Build B) |
| **C** | Delivery Cycle | Delivery Cycle MCP, delivery cycle tracker UI, gate workflows, milestone dates, Delivery Workstream registry, Jira sync. Build Report OI Library submission stubbed — wired fully in Build B. |
| **B** | OI Library Core | OI Library MCP, admin UI, submission/review/approval workflows (UC-21, UC-02), approver configuration UI (RACI per artifact type per Division), embedded chat fully wired (chat skill, Vertex AI, query_knowledge, Document Viewer). Build Report submission stub from Build C wired at this point. Blocked by ARCH-19 (Vertex AI model selection). |
| **D** | Notifications | Notification MCP, Alert Log, SLA timers |
| **E** | Performance & Standards | Performance metrics, policy register, training tracking |
| **F** | Agent Governance | AI System Registry, agent stage advancement, operational monitoring |

[NOTE: Build sequence revised from A→B→C→D→E→F to A→C→B→D→E→F per Session 2026-03-24-P. Delivery Cycle tracker pulled forward to deliver immediate value to Domain Strategists and Capability Builders. Hard dependency on Build A (Division/user infrastructure) satisfied before Build C begins.]

---

## Schema Summary by Build Cycle

**Build A:** divisions, users, division_memberships, artifact_types, artifacts, artifact_versions, document_files, document_embeddings, folders, tags, artifact_tags, approval_workflows, approval_participants, notifications

**Build C** (now cycle 2): delivery_cycles, cycle_stages, gate_records, cycle_artifacts, cycle_artifact_types, jira_links, delivery_workstreams, workstream_members

**Build B** (now cycle 3): OI Library submission workflow tables, review queue state, lifecycle transition log

**Build D:** notification_log, sla_timers, alert_subscriptions

**Build E:** kpi_definitions, kpi_values, policy_records, training_completions

Full column definitions and constraints in Build A Specification.

---

## Claude Code Session Discipline

Read before writing any code, every session:
1. CLAUDE.md
2. Master Build Plan (this file)
3. Current Build Specification

Rules:
- Confirm current build cycle scope before beginning
- Never expand scope mid-build — scope change requires new Build Spec
- Generate tests alongside every code file
- MCP servers are the only path to the database
- No prompt logic in Angular components or services
- All environment variables via process.env — never hardcoded

---

## Build A Acceptance Criteria

Build A is complete when all are demonstrable against real data:
- System Admin can create Trust Division hierarchy mirroring nine TRIARQ Trusts
- System Admin can create users and assign them to Divisions with roles
- Batch of RCM SOPs can be uploaded, scanned, reviewed, and approved into Canonical status
- Home screen renders correct card set for each role
- Unauthenticated user cannot access any content
- Authenticated user with no Division assignment sees onboarding message
- All MCP tool calls validate JWT before executing
- No direct Supabase client calls in any Angular component
