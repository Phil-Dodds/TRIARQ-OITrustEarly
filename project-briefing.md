# Project Briefing
Pathways OI Trust | v5.30 | March 2026 | CONFIDENTIAL
Owner: Phil Dodds, EVP Performance & Governance

---

## System Identity

| Field | Value |
|-------|-------|
| System Name | Pathways OI Trust (interim — pending Mike review) |
| Owner | Phil Dodds, EVP Performance & Governance |
| Scope | Phil's full management infrastructure for four authorities: Governance, Performance, Technical Support Services, Enterprise Services |
| Nine Trusts | Practice Services, Value Services, Enterprise Services, Foundry, Performance, Platform, Governance, Growth, Administration Services |
| Demo Stack | Angular 19 + Native Federation, Supabase (PostgreSQL + pgvector + Auth), Node.js MCP on Render, Vertex AI (personal GCP), GitHub Pages |

---

## Current Frontier

Design sessions complete. Master Build Plan revised: build sequence is now A → C → B → D → E → F per Session 2026-03-24-P.

**Begin Build A with Claude Code using CLAUDE.md, Master Build Plan v1.3, and Build A Specification.**

Build A blockers (updated 2026-03-30):
- GitHub repo with /docs/ folder — not yet created
- Supabase project and credentials — not yet created (do NOT enable RLS — JWT validation lives in MCP layer per D-93)
- Render account for MCP server deployment — not yet set up
- ionic.theme.map.scss designer confirmation — provisional accepted for build start per D-151/D-152
- CLAUDE.md environment variables — placeholders written; fill before first Claude Code session

ARCH-19 (Vertex AI model selection) open — does not block Build A; blocks Build B. Embedded chat fully deferred to Build B.

---

## Pending Actions

- Engineering onboarding session scheduled 2026-03-31 (Sandip + possible second engineer). Agenda: introduce OI Trust vision, architecture, Build A scope, screen prototypes. Materials produced: engineering-intro.docx, pathways-oi-trust-engineering-intro.pptx, BuildsACBprototypesv2.pptx.
- Populate CLAUDE.md environment variable placeholders before first Claude Code session: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DOCUMENT_ACCESS_MCP_URL, DIVISION_MCP_URL. Commit CLAUDE.md and build-a-spec.md to GitHub repo /docs/ before Claude Code session starts.
- Confirm whether to complete Builds A, C, and B before engineering lead arrives; confirm engineering lead role model (primary builder vs. support)
- Engineering lead onboarding session: confirm whether Build A proceeds on demo stack or TRIARQ environment; confirm role model before engagement begins
- Mike and Milind: respond to PSB hire proposal (D-162)
- Mike: confirm Analytics Capability terminology set — D-156–161 pending confirmation
- Mike: complete OS alignment review and schedule OS review session (D-32)
- Mike OS review session agenda: D-31 (Fully Qualified Name Standard elevation), D-32 (blueprint connection), analytics terminology confirmation
- Mike review session: name lock, Tier 2 gates, L2/L3 naming
- Phil to schedule Security & Governance team session (Jon, Dennis, Ally, Mildred, Pintal)
- Engineering lead response: Vertex AI model + embedding model (ARCH-19) — blocks embedded chat skill finalization
- Phil to confirm D-24 (Decision 119 conflict with recollection)
- Build E design session required before SPEC: UC-28 and analytics AI consumption MCP server tool set (ARCH-20, ARCH-21)
- Analytics Core Standards v1.0: submit to OI Library via UC-21 upon Mike approval
- Stakeholder session on Delivery Cycle date commitment model required (Sabrina, engineering leads). Proposed model: Next Gate Commitment Date + Pilot Launch Target Date. Purpose statement locked (Session 2026-03-18 Decision B). Model held for stakeholder input before locking.
- Phil to raise with Mike and engineering team: confirm ai.triarqpathways.com is building to QPathways UX standards — right panel detail pattern, design tokens (D-151/D-152), component library. Misalignment now creates port-time rework.
- Engineering leads session: introduce OI Trust, governing files question, five design questions from leave-behind (ai-first-governing-docs-discussion.md, 2026-03-24). Capture verbal answers as decision inputs for D-36 and D-37.
- Production approval checklist for AI-first delivery cycles: complete in dedicated design session before finalizing engineering leads package. Feeds Go to Deploy and Go to Release gate content. See D-36.

---

## Open Decisions Queue

See decisions-active.md for full open decisions list.

Key open items:
- System name — Mike review
- D-Vertex-AI-Model: Vertex AI model selection (ARCH-19) — blocks embedded chat
- D-18: Performance measurement system scope
- D-24: Decision 119 text vs Phil's recollection
- RACI template granularity (D-94-Granularity)
- Pathways Connect Trust assignment
- Concept funnel design (Idea/Selected stages)
- Onspring migration timing
- D-162: Performance Systems Builder hire — pending Mike and Milind response
- D-156–161 terminology: Analytics Capability terminology set pending Mike confirmation
- D-Context-Brief-2Layer: Context Package + Brief as two-layer model — awaiting Mike confirmation
- D-Mike-Terminology: Present Delivery Cycle and OI Library terms to Mike for alignment
- D-OI-Library-Tool: Knowledge base tool for product knowledge management (UC-19)
- D-36: Production approval checklist for AI-first delivery cycles — pending dedicated design session
- D-37: Approval authority for engineering governance artifact types in OI Library — pending engineering leads session
- D-38: Decision Registry — new platform module, pending dedicated design session

---

## Locked State Summary

- 12-stage Delivery Cycle lifecycle with 5 named gates (Brief Review, Go to Build, Go to Deploy, Go to Release, Close Review)
- Eight platform primitives (D-80) as the foundation for all use cases
- Division as universal container primitive, Trust Structure hierarchy, nine named Trusts
- Dual-interface OI Library (human governance + agent consumption layers)
- Three-layer OI maturity model (human discipline → workflow assistance → AI extraction)
- RACI governance pattern across all primitives; Accountable = binding; Consulted = advisory
- 13 seeded system artifact types (D-145)
- Design Wide, Build Narrow: six build cycles A–F

---

## How to Resume

**FIRST — confirm all documents are present before proceeding.**

Required documents (eleven canonical — all must be present):

1. project-briefing.md — v5.30 or later
2. decisions-active.md — v3.7-active or later
3. authority-map.md — v1.0 or later
4. use-case-register.md — v1.1-summary or later
5. terminology-register.md — v0.21 or later
6. design-communication-principles.md — v1.2 or later
7. deferred-items.md — v1.6 or later
8. architecture-notes.md — v1.6 or later
9. master-build-plan.md — v1.4 or later
10. build-a-spec.md — v1.1 or later *(replace with current build spec each cycle)*
11. project-instructions.md — v2.8 or later

**On-demand only (do not load every session):**
- decisions-archive.md — load when researching decision history
- use-case-register-full.md — v0.9-full or later — load when actively designing or modifying a specific UC
- port-readiness.md — load when working on port design
- CLAUDE.md — load when reviewing build constraints; lives with build-a-spec.md in the GitHub repo

**Session type must be declared at start:** DESIGN SESSION | DOCUMENT AUTHOR SESSION | VALIDATOR SESSION

---

## Last Updated

**2026-03-30 (validator corrections — pass 1 on v5.29 set).** Four issues resolved. decisions-active.md bumped to v3.7-active (version not incremented during Document Author session despite five appended decisions). "Three" corrected to "four" env var placeholders in decisions-active.md Session 2026-03-30-C and project-briefing.md Last Updated. Two stale Build A Acceptance Criteria removed from master-build-plan.md (embedded chat and citation viewer — moved to Build B per Session 2026-03-29-A). GCP prerequisite in master-build-plan.md marked COMPLETE per Session 2026-03-29-E. master-build-plan → v1.4. decisions-active → v3.7-active. project-briefing → v5.30.

**2026-03-30 (engineering onboarding prep, CLAUDE.md, screen prototypes).** Five decisions this session. RLS explicitly disabled — JWT validation and Division access control live in MCP layer, not Supabase (A). Bulk Knowledge Seed confirmed as supporting multiple independent batches at any time with no cross-batch dependencies (B). CLAUDE.md authored for Build A — four placeholder env vars remain; governing docs bootstrap mechanism deferred to Build B per ARCH-22 (C). MCP architecture confirmed staying in Build A — portability guarantee, no deferral (D). Engineering onboarding session scheduled 2026-03-31; Build A infrastructure not yet created (E). Three terms confirmed to Terminology Register: RLS, Magic Link, Translation Layer. Artifacts produced: CLAUDE.md (ready to commit to /docs/), engineering-intro.docx, pathways-oi-trust-engineering-intro.pptx, delivery-cycle-detail-prototype.pptx, build-a-screen-prototypes.pptx, BuildsACBprototypes.pptx, BuildsACBprototypesv2.pptx. project-briefing → v5.29. terminology-register → v0.21.

**2026-03-29 (dev lead orientation, Stage Track UI pattern, Build A/B readiness review).** Six decisions locked: embedded chat moved from Build A to Build B (A); Division MCP rename from container-mcp (B); unset-approver business rule — escalate to Division Owner then Phil, never hard-fail (C); ARCH-19 moves to Build B blocker (D); GCP account confirmed ready, removed from Build A blockers (E); Stage Track component contract locked — full spec in design-communication-principles.md Section 5.1 (F). Two new terms confirmed: Stage Track, Division MCP. ARCH-25 added (Stage Track component). ARCH-19 updated (Build B blocker). Division MCP rename applied throughout. Three new Pending Actions added. decisions-active → v3.6-active. architecture-notes → v1.6. build-a-spec → v1.1. master-build-plan → v1.3. terminology-register → v0.20. design-communication-principles → v1.2. project-briefing → v5.28.

**2026-03-25 (Delivery Cycle artifact model, Outcome Statement field, Decision Registry).** Seven decisions locked: Outcome Statement as direct field on delivery_cycles with amber warning when null, never a gate block (A); Delivery Cycle artifact model — cycle_artifact_types seed table and cycle_artifacts attachment table, stage-scoped, dual pointer model (B); no platform enforcement on artifact slots at launch, dormant gate enforcement columns in schema (C); Delivery Cycle Build Report placed in BUILD stage as input to Pilot, training, and OI Library (D); BRIEF stage artifact slots include Context Package artifacts — Scenario Journeys and True-life examples added alongside Context Brief and Stakeholder input record (E); full cycle_artifact_types seed set locked across all stages (F); MSO365 to OI Library pointer transition model — external URL preserved on promotion (G). One new term confirmed: Scenario Journey. One new deferred item: D-38 (Decision Registry). One new architecture item: ARCH-24 (Delivery Cycle artifact tracking tables). Build C schema updated: cycle_artifact_types and cycle_artifacts added to Build C scope. decisions-active → v3.5-active. architecture-notes → v1.5. master-build-plan → v1.2. deferred-items → v1.6. terminology-register → v0.19. project-briefing → v5.26.

**2026-03-24 (dashboard date model, fifth gate, governing files architecture, Delivery Workstream registry, build sequence reorder).** Seventeen decisions locked: Delivery Cycle dashboard date field state model (A); dashboard milestone date columns — Pilot Start Date and Production Release Date (B); dashboard headline as intelligent summary text (C); current stage display on dashboard and detail view (D); five milestone dates as planning layer — Brief Review Complete, Build Start, Pilot Start, Release Start, Close Review Complete (E); warning for unset actual dates on passed stages (F); Go to Release as fifth named gate, exits PILOT before RELEASE (G); gate enforcement via business rules MCP, automatic stage advancement on gate approval (H); right panel as standard detail surface system-wide (I); cycle detail view required in Build C first pass (J); bootstrap file as MCP entry point only, hard pause on failure (K); Delivery Workstream registry — name, home Division, lead, members, active/inactive, pre-populates Division on cycle with override (L); current stage as system-controlled fixed-list field, auto-advances on gate approval (M); five milestone date statuses with fixed colors: Not Started gray, On Track green, At Risk amber, Behind red, Complete blue — human can unset Complete with logged reason (N); default status Not Started when date set for non-current gate (O); build sequence revised A→C→B→D→E→F (P); Delivery Workstream active/inactive enforcement — gate blocked on inactive workstream, no grace period (Q). Three new ARCH items: ARCH-12 updated (five gates), ARCH-22 (bootstrap file), ARCH-23 (Delivery Workstream schema). Two new deferred items: D-36 (production approval checklist), D-37 (engineering governance artifact approvers). Four Terminology Register entries: Delivery Workstream (confirmed), Go to Release (confirmed), Bootstrap File (confirmed), Provenance Record (needs def). Pending Actions added: QPathways UX alignment with Mike; engineering leads session; production approval checklist design session. Current Frontier updated: build sequence now A→C→B→D→E→F. UC-05 annotated with Delivery Workstream requirement. Artifacts produced: DS meeting presentation (delivery-cycle-tracker-ds.pptx), engineering leads leave-behind, research prompt, Vijay three-layer story. decisions-active → v3.3-active. architecture-notes → v1.4. master-build-plan → v1.1. project-briefing → v5.25. terminology-register → v0.18. deferred-items → v1.5. use-case-register → v1.1-summary.

**2026-03-18 (gate positions, Close Review rename, date commitment purpose).** Three decisions locked: gate positions in stage sequence (Brief Review exits BRIEF, Go to Build exits SPEC, Go to Deploy exits UAT, Close Review exits OUTCOME); Delivery Cycle date commitment purpose statement (team alignment and communication tool — four named purposes); Close Review as final name for fourth gate (renamed from Close). Date commitment model held for stakeholder session with Sabrina and engineering leads. Stakeholder memo produced and sent. AI Governance Framework project setup work completed in parallel — no OI Trust decisions produced from that work. project-instructions.md → v2.7 (session close workflow and Update session delivery language updated). decisions-active.md → v3.2-active. architecture-notes.md → v1.3. project-briefing.md → v5.24.

**2026-03-13 (validator corrections — pass 5).** Two issues: RESOLVED entry removed from Open Decisions Queue in project-briefing (resolved items belong in decisions-active RESOLVED section only). "Twelve" → "eleven" corrected in terminology-register.md Architecture Notes Running Log entry (v0.17).

**2026-03-13 (validator corrections — pass 4 continued).** D-123 stale NOTE removed from decisions-active (Session Active Rules recovered). ARCH-12 updated: three gates → four gates per D-154. Three missing open decisions added to Briefing key open items (D-Context-Brief-2Layer, D-Mike-Terminology, D-OI-Library-Tool). X-01 standing exception added to project-instructions.md Validator checklist for D-07, D-105/106, D-120 (acknowledged unresolvable pre-archive references). decisions-active → v3.1-active, architecture-notes → v1.2, project-instructions → v2.6.

**2026-03-13 (validator corrections — pass 4).** Canonical count "twelve" → "eleven" fixed in project-instructions.md section heading (v2.5) and architecture-notes.md purpose line (v1.1). Historical Last Updated entries in project-briefing.md preserved as accurate records. D-130 annotation already correct.

**2026-03-13 (Session Active Rules recovered).** Session Active Rules section added to project-instructions.md (v2.4) from project knowledge file. Pending Actions item removed. D-123 fully resolved.

**2026-03-13 (v0.4 era ratification).** Eleven reconstructed v0.4 decisions reviewed with Phil one by one. Six ratified into decisions-active: D-44 (OI Library as full working system), D-45 (canonization lifecycle states — reconciliation note added to D-38), D-47 (scope assignment with approver-adjustment rule), D-48 (submission UI minimum fields — corrected: Division replaces Scope/Container; five-minute rule dropped), D-50 (Delivery Cycle Build Report required at Go to Deploy gate), D-52 (engineering governance as governed OI artifact — delivery mechanism deferred). Two archived: D-46 (superseded by D-145), D-51 (superseded by D-131/D-136 — EVP role rename deferred to port). Three discarded: D-49 (content covered by existing decisions; no minimum packet or SLA), D-53 (architecturally incorrect — Trust is a Division type, not above the hierarchy), D-54 (pure process history). Two new deferred items added: D-34 (EVP role rename at port), D-35 (engineering governance delivery mechanism to Claude Code). decisions-active → v3.0-active, decisions-archive → v2.4-archive, deferred-items → v1.4.

**2026-03-13 (pre-archive recovery — v0.3/v0.5).** Working Principles P1, P2, P3 and Decisions 37–43, 55–56, 60, 62, 65–67 recovered from v0.3 and v0.5 source files and added to decisions-active.md. Decisions 57–59, 61, 63–64, 68 added to decisions-archive.md as superseded. D-44 through D-54 confirmed unrecoverable (v0.4 source file missing). decisions-active → v2.9-active, decisions-archive → v2.3-archive.

**2026-03-13 (migration recovery).** Nine decisions recovered that were dropped during the docx-to-md migration: D-114 (Pilot Plan as DESIGN Output), D-115 (Cursor Prompt as BUILD Artifact), D-116 (AI Stage as Agent Property — AI Production Governance Board name corrected per D-163), D-117 (Jira MCP Integration), D-118 (QPathways Design Tokens), D-120 (Trust-Level Metric Sets), D-121 (Governance Metrics Two-Mode Architecture), D-122 (Phil owns Governance Trust), D-123 (Session Active Rules and Trigger Phrase). D-116 unverified annotations on D-156/157/158 removed. Session Active Rules section also dropped from project-instructions.md — added to Pending Actions for recovery. decisions-active.md → v2.8-active.

**2026-03-13 (validator corrections — pass 3).** Three remaining validator issues resolved. decisions-active.md: D-59/74 removed from OPEN DECISIONS (was labeled RESOLVED but should not appear in OPEN section at all; remains in RESOLVED section); D-116 references in D-156/157/158 annotated as unverified pending Phil confirmation. use-case-register.md: D-07, D-105/106, D-120 references annotated as pre-archive decisions.

**2026-03-13 (CLAUDE.md reclassification).** CLAUDE.md removed from canonical document list. Reclassified as on-demand — it is a Claude Code build constraint file that lives in the GitHub repo with the build spec, not a design or validator session document. Canonical count corrected from twelve to eleven. project-instructions.md v2.3, project-briefing.md v5.14.

**2026-03-13 (validator corrections).** 11 validator issues resolved. decisions-active.md: D-79 removed from OPEN (already resolved by D-80, added to RESOLVED section); D-94-Granularity duplicate removed; D-49, D-109, D-96, D-81 annotated for supersession by D-154, D-133, D-145 respectively. D-158 annotated with Craig identifier. project-instructions.md: canonical twelve list corrected (port-readiness removed, project-instructions.md added as item 12, CLAUDE.md as item 11). terminology-register.md: Context Package term added (Section 14). project-briefing.md: duplicate 2026-03-13 Last Updated entry removed; GCP action removed from Pending Actions (completed 2026-03-08); project-instructions floor raised to v2.2.

**2026-03-13.** Token reduction and format migration session. All canonical documents converted from .docx to .md. Decisions Log split into decisions-active.md and decisions-archive.md. Use Case Register condensed to summary; full narratives in use-case-register-full.md (on-demand). Port Readiness Log designated on-demand. Project Instructions updated to v2.1 (md-based workflow; complete zip delivery rule added). Delivery Cycle Build Report name confirmed as final (D-164, closes D-59/74 and D-74). AI Production Governance Board name and scope confirmed (D-163). D-163 and D-164 added to decisions-active. No architecture changes.

**2026-03-11.** Long design session. Six primary work products: (1) Analytics Core Standards v1.0 — full standards document covering semantic foundation, Fully Qualified Name Standard, two metric types, six-phase analytics build plan, three-stage Analytics Capability maturity model, data locking, logic versioning, reproducibility testing, governance authority model, team structure, and TAGS alignment. Submitted to Mike for review and approval. Routes to OI Library as Standards Document upon approval. (2) Analytics Capability terminology locked pending Mike confirmation (Decisions 156–161). Seven additional terms confirmed. (3) UC-24 promoted from placeholder to design complete. UC-28 added (Analytics Capability Registry and Stage Monitoring). (4) PSB hire proposal memo transmitted to Mike and Milind (D-162). (5) Analytics Capability memo transmitted to Mike proposing terminology and registry. (6) AI Data and Analysis Employee Guide produced. (7) AI Data and Insights Manager Guide produced. Deferred items added: D-31, D-32, D-33.

**2026-03-08.** AI-First Blueprint alignment session. Companion alignment review, Context Brief, and reading sequence recommendation for Mike produced. D-24 added (Decision 119 conflict). No new Terminology Register entries. No architecture changes.

**2026-03-08.** Infrastructure session. GCP project established (triarq-OITRUSTDemonstration). Service account configured. On-demand MCP tool loading confirmed (D-155). Render credential pattern deferred (D-23). Build A blockers identified.

**2026-03-06.** Design Session A. 24 decisions locked (D-130–153). Three new canonical documents: Master Build Plan, Build A Specification, CLAUDE.md. Infrastructure stack locked.
