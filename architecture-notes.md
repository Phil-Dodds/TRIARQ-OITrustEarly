# Architecture Notes Running Log
Pathways OI Trust | v1.6 | March 2026 | CONFIDENTIAL

---

## Purpose
Technology, infrastructure, and build architecture decisions. One of eleven canonical documents. Routing: technology/infrastructure choices here. Design choices in decisions-active.md. Significant decisions appear in both.

---

## Demo Technology Stack
Source: D-92

| Layer | Demo | Port-Time Replacement |
|-------|------|----------------------|
| Frontend | Angular 19 + Native Federation remote | Unchanged |
| Backend DB | Supabase (PostgreSQL + pgvector + Auth) | BigQuery + TRIARQ Auth |
| MCP Servers | Node.js on Render | Cloud Run Confidential (TRIARQ infra) |
| AI | Vertex AI (personal GCP) | Vertex AI (TRIARQ GCP) |
| Hosting | GitHub Pages | TRIARQ infrastructure |

The MCP layer is the portability guarantee — replace it at port time; everything else unchanged.

---

## Architectural Rules
Source: D-93. Non-negotiable.

**Rule 1 — MCP-Only Database Access.** All database calls through MCP layer. No direct Supabase client calls from Angular components or services.

**Rule 2 — UI as Presentation Layer Only.** Angular responsible for display only. No prompts or business logic in components. Skills and MCP own everything else.

---

## MCP Server Design
Source: D-93, D-144

All servers: stateless Node.js on Render. Verb_noun tool naming. JWT validation middleware on every request. Atomic tools. Response envelope: `{ success: boolean, data: any, error?: string }`. Semantic versioning.

**On-demand tool loading** is the standard (D-155). Claude Code uses Tool Search to discover and load tools rather than loading all tools at session start.

### Demo MCP Servers

| Server | Build | Purpose |
|--------|-------|---------|
| document-access-mcp | A | Human governance + agent consumption (query_knowledge) |
| division-mcp | A | Division hierarchy, user membership (admin-only writes) |
| oi-library-mcp | B | UC-21 submission, UC-02 review queue, lifecycle transitions |
| delivery-cycle-mcp | C | Delivery Cycle lifecycle, stage transitions, gates, artifacts |
| notification-mcp | D | Alert Log, SLA timers |

---

## Skill File Architecture
Skills = AI work product layer. Contain prompts, MCP tool call orchestration, output assembly. No UI logic. No direct DB calls. Markdown files in /skills/. Referenced from services via skills loader. No prompt text in TypeScript files.

---

## Supabase Schema Baseline
Constraints applying to all schema decisions:
- UUID primary keys on all tables
- created_at, updated_at on all tables
- Soft delete: deleted_at timestamp; never hard delete
- All foreign keys ON DELETE RESTRICT unless noted
- Parameterized statements only — no string interpolation in SQL
- WHERE deleted_at IS NULL on all SELECT queries on soft-deletable tables

Full table definitions in Build A Specification.

---

## Demo UI Architecture

**Home Screen:** Role-driven summary cards. Universal + role-specific. Cards connect to MCP servers as each build delivers them. (D-150, ARCH-08 resolved)

**Embedded Chat:** Angular component (presentation only) → chat skill → Document Access MCP query_knowledge → Vertex AI → grounded answer with citations. Citation format: inline superscript [N], reference list with clickable DocumentViewerComponent side panel. (D-153, ARCH-09 resolved)

**Bulk Seed:** Writes to same metadata table Document Access MCP reads from. Directory import reads source file hierarchy and proposes folder structure mapping. Seed Review lifecycle state added.

---

## OI Library Topic Taxonomy Schema
- folder_id, parent_folder_id, division_id, folder_name, created_by, created_at
- tag_id, division_id, tag_name
- Artifact-to-tag junction table
- Folder path field on artifact metadata records

---

## Design Token Rules
Source: D-151, D-152

- Import triarq.tokens.v1.css in styles.scss
- Import ionic.theme.map.scss in global.scss before Ionic default theme
- Use --triarq-* CSS variables for all color/spacing/typography
- **CRITICAL: --triarq-text-h2 = 60px. Token file value of 20px is data entry error.**
- radius.card=10px, radius.button=5px, radius.input=5px, radius.pill=999px
- Sidebar active: --triarq-color-primary (#257099) left border indicator
- Font: Roboto (not Gill Sans or Lato)

---

## Native Federation Configuration
Source: D-143

- @angular-architects/native-federation installed
- Exposed module: AppModule
- All routes relative — no hardcoded absolute paths
- Lazy-loaded feature modules: OILibraryModule, AdminModule, ChatModule, DeliveryModule

---

## Open Architecture Items

**ARCH-11:** Rename all "Delivery Epic" → "Delivery Cycle" in schema, API contracts, UI wireframes.
**ARCH-12:** State machine for 12 stages with tier-dependent N/A paths. Five gates with locked positions: Brief Review (exits BRIEF, before DESIGN), Go to Build (exits SPEC, before BUILD), Go to Deploy (exits UAT, before PILOT), Go to Release (exits PILOT, before RELEASE), Close Review (exits OUTCOME, before COMPLETE). Gate configuration (approver, required/optional) admin-configurable per Division per tier per D-65/D-66. [Updated: four gates → five gates per Session 2026-03-24-G. Positions and names per Session 2026-03-18 Decisions A and C.]
**ARCH-13:** Rename all OI Library/KB references in schema, API, UI.
**ARCH-14:** Retrieval layer queries both OI Library (institutional) and Delivery Cycle records (cycle artifacts) via Delivery Cycle ID tag.
**ARCH-15:** Each Delivery Cycle stage requires: status enum, target_start_date, actual_start_date, actual_completion_date, gate_result enum, artifact references.
**ARCH-16:** MCP read/write contract for Jira epic fields: Outcome Statement, Context Brief Link, Tier Classification, Capabilities Equation Mapping, Technical Specification status.
**ARCH-18:** Concept funnel intake — Idea and Selected stages deferred. Design as pre-cycle process at port time.
**ARCH-19:** Vertex AI model and embedding model selection. VERTEX_MODEL env var — which Gemini model for embedded chat. Embedding model dimension (provisionally 768) must be confirmed before document_embeddings table populated. **Does not block Build A. Blocks Build B** — Build B cannot be finalized until model and embedding model confirmed. Resolution pending engineering lead.

**ARCH-20:** Analytics Capability Registry schema design. Separate table from Agent Registry. Provisional fields in D-161. Requires design session before Build E SPEC. Source: D-161, UC-28.

**ARCH-21:** Analytics AI Consumption MCP Server tool set definition. Provisional tools: query_metric, list_metrics, get_metric_definition, query_semantic_layer. Must be locked before Build E SPEC stage. Source: D-160.

**ARCH-22:** Governing document retrieval architecture for coding agent sessions. Bootstrap file in repo contains MCP endpoint reference only — not document IDs, version hashes, or governing document content. Coding agent reads bootstrap file at session start and calls get_session_context; MCP returns all governing documents for the current build cycle. Documents may chain further MCP calls. Failure behavior: hard pause — session does not proceed on absent or unverified governing constraints. GitHub integration pending engineering leads session. Provenance record design pending D-36. Source: Session 2026-03-24.

**ARCH-23:** Delivery Workstream registry schema. Fields: workstream_id, workstream_name, active_status (boolean), home_division_id (FK), workstream_lead_user_id (FK), created_at, updated_at, deleted_at. Junction table: workstream_members (workstream_id, user_id). delivery_cycles table requires workstream_id (FK) and division_id (FK — pre-populated from workstream home Division, overridable per cycle). Business rules MCP checks workstream active_status at every gate clearance attempt — blocks if inactive. Milestone date status fields on cycle record: not_started, on_track, at_risk, behind, complete — with logged_reason field on complete reversal. Source: Session 2026-03-24.

**ARCH-24:** Delivery Cycle artifact tracking schema. Two tables added to Build C scope. cycle_artifact_types: system-defined seed table with artifact_type_id, artifact_type_name, lifecycle_stage, guidance_text, sort_order, gate_required (boolean, dormant), required_at_gate (text, dormant). Seeded at migration with slot set locked in Session 2026-03-25-F. cycle_artifacts: attachment record table with cycle_artifact_id, delivery_cycle_id, artifact_type_id (nullable — null = ad hoc), display_name, external_url, oi_library_artifact_id (FK → artifacts), pointer_status (enum: external_only / promoted / oi_only), attached_by_user_id, attached_at. pointer_status manages MSO365 → OI Library promotion — external_url preserved on promotion, not deleted. Connects to ARCH-15. Source: Session 2026-03-25.

**ARCH-25:** Stage Track component (StageTrackComponent). Standalone Angular presentation-only component. Inputs: lifecycle definition (ordered stage array with gate positions), current stage identifier, gate state map (pending / blocked / complete / upcoming per gate), display mode enum (full / condensed). No business logic in component — all state data from MCP responses. Token mapping: Complete/Current → `--triarq-color-primary`; Gate Pending → `--triarq-color-sunray`; Gate Blocked → system error color; Upcoming → `--triarq-color-fog`. Gate nodes interactive (click opens gate record); stage nodes non-interactive. Build C: Full mode for Delivery Cycle detail view, Condensed mode for dashboard row. Build B: Full mode for OI Library artifact detail view. Source: Session 2026-03-29-F, design-communication-principles.md Section 5.1.

Resolved: ARCH-01, ARCH-08, ARCH-09, ARCH-17.

---

## Change Log

**2026-03-29:** ARCH-25 added — Stage Track component specification (StageTrackComponent). ARCH-19 updated — now blocks Build B, not Build A. container-mcp renamed to division-mcp throughout. Source: Session 2026-03-29.

**2026-03-25:** ARCH-24 added — Delivery Cycle artifact tracking tables (cycle_artifact_types seed table and cycle_artifacts attachment table). delivery_cycles table extended with outcome_statement, outcome_set_by_user_id, outcome_set_at per Session 2026-03-25-A. Source: Session 2026-03-25.

**2026-03-24:** ARCH-12 updated — Go to Release added as fifth named gate (exits PILOT, before RELEASE). ARCH-22 added — bootstrap file as MCP entry point only, hard pause on failure. ARCH-23 added — Delivery Workstream registry schema and gate enforcement integration. D-108 annotated with updated lifecycle string. Source: Session 2026-03-24.

**2026-03-18:** Gate positions explicitly locked in ARCH-12. Four gates: Brief Review (exits BRIEF), Go to Build (exits SPEC), Go to Deploy (exits UAT), Close Review (exits OUTCOME). "Close" renamed to "Close Review" across all references. Source: Session 2026-03-18 Decisions A and C.

**2026-03-13:** All canonical documents converted from .docx to .md. No architecture changes.

**2026-03-11:** ARCH-20 and ARCH-21 added. Analytics Capability Registry schema and Analytics AI Consumption MCP Server tool set both pending design session before Build E SPEC. Source: Decisions 160–161, Session Output 2026-03-11.

**2026-03-08:** GCP project established — triarq-OITRUSTDemonstration (Project Number: 136510130770). Service account OITRUST-SA created (oitrust-sa@triarq-oitrustdemonstration.iam.gserviceaccount.com), key downloaded. Local dev credential pattern: GOOGLE_APPLICATION_CREDENTIALS=./credentials/oitrust-sa-key.json, credentials/ never committed. On-demand MCP tool loading confirmed (D-155). Render credential pattern deferred (D-23).

**2026-03-06:** Infrastructure stack locked (D-132). Angular 19 + Native Federation (D-143), Node.js on Render, Supabase, personal GCP for Vertex AI (D-148). Division as universal container (D-134). Hierarchical admin model (D-135). System-level roles (D-136). Six build cycles A–F (D-133). RACI definitions (D-149). Home screen cards (D-150). Document Access MCP dual-layer tool set (D-147). Email OTP auth (D-142). Two-tier artifact type model (D-145). File security (D-146). Design token TODOs resolved (D-151–152). Citation format (D-153). ARCH-08, ARCH-09, ARCH-17 resolved. ARCH-19 added.

**2026-03-03:** Delivery Cycle replaces Delivery Epic. 12-stage lifecycle with 3 gates. OI Library replaces KB. ARCH-11–18 added. QPathways design tokens confirmed (ARCH-01 resolved by D-118).
