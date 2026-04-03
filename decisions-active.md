# Design Decisions — Active
Pathways OI Trust | v3.7-active | March 2026 | CONFIDENTIAL

Active = operative locked decisions + open decisions. Superseded decisions are in decisions-archive.md.

---

## OPEN DECISIONS

**D-162** — Performance Systems Builder hire — pending Mike and Milind response.

**D-156–161 terminology** — Analytics Capability terminology set pending Mike confirmation.

**D-94-Granularity** — RACI template granularity — does artifact sub-type need separate templates (e.g. Engineering OI vs Policy OI)? Linked to artifact type registry.

**D-18** — Performance measurement system scope — new UC section in OI Trust or separate system?

**D-55/56** — System name 'Pathways OI Trust' and OI definition extension — pending Mike review session. See locked Decisions 55 and 56 for full rationale.

**D-Policy-Migration** — Onspring migration plan and timing.

**D-Context-Brief-2Layer** — Context Package + Brief as two-layer model — awaiting Mike confirmation.

**D-Mike-Terminology** — Present Delivery Cycle and OI Library terms to Mike for alignment.

**D-Concept-Funnel** — Idea and Selected stages deferred from Decision 108. Pre-cycle intake process for future.

**D-OI-Library-Tool** — Knowledge base tool for product knowledge management (UC-19).

**D-Pathways-Connect** — Pathways Connect as own Trust or under Performance Trust. Pending org structure.

**D-Vertex-AI-Model** — Vertex AI model selection: which Gemini model for embedded chat; which embedding model for pgvector. Blocks embedded chat skill finalization and document_embeddings vector dimension. Source: Decision 148. (ARCH-19 open)

**D-24** — Decision 119 text conflicts with Phil's recollection of intent. Pending Phil confirmation before amending.

**D-36** — Production approval checklist for AI-first delivery cycles — pending dedicated design session before engineering leads package is finalized.

**D-37** — Approval authority for engineering governance artifact types in OI Library — pending engineering leads session; engineering leads expected to be named approvers, not Phil per-item.

**D-38** | Decision Registry — new platform module. Pending dedicated design session. See deferred-items.md.

---

## WORKING PRINCIPLES — Foundational (Tenant-Level OI)

These principles apply to every effort, not just this system.

**P1** — Self-Clarifying Labels. Every field, schema column, and UI label must include enough context to be unambiguous without relying on surrounding context. Add the clarifying adjective before the noun whenever the label would otherwise be ambiguous in isolation. Anti-pattern: date, status, type, name, id. Applied: org_tenant_id, submission_date, lifecycle_state, oi_type, artifact_display_name, detection_date, target_resolution_date. Applies to: database schema, API field names, UI labels, report column headers, all explanatory language produced in this project. Connects to: Design & Communication Principles (3.1 — No Bare Generic Nouns), D-159 (Fully Qualified Name Standard — analytics layer extension of this principle).

**P2** — Progressive Disclosure. Lead with the simplest, most essential concept. Allow complexity and detail to unfold only as needed and only for the audience that needs it. The full picture is always available — but it is never the starting point. Anti-pattern: email that opens with schema decisions, UI that surfaces every data field as equally important, explanation that starts with edge cases. Note: Phil engages with full complexity directly and will flag if this principle is over-applied. Connects to: Design & Communication Principles (2.1 — Lead With the Point).

**P3** — TRIARQ First Principles of System Design. The five-step methodology applied to every system, process, org change, agent design, and document before building: Context (full picture: domain, stakeholder, data, the why) → Question (challenge assumptions, ask why, assume it can be done differently) → Reduce (strip to essence, remove what does not need to exist) → Simplify (make what remains as clean as possible; outcome statement lives here) → Automate (only then, automation and AI on the simplified, essential process). Operationalized as TRIARQ's structured methodology. Apply as a review gate before locking the full plan. Connects to: Design & Communication Principles (1.1), D-119.

---

## LOCKED DECISIONS — OPERATIVE

### UX and Navigation Principles

**D-163** — Workflow Entry Point Completeness. Every user-facing function must be reachable from exactly one declared entry point: sidebar nav item (user-initiated, persistent), home page card (role-relevant summary), or action queue / notification (system-triggered). A feature with no wired entry point is incomplete regardless of whether the route and component exist. Admin functions are never standalone sidebar links — they belong in the Admin hub (D-164). Entry point role arrays must include every permitted role. Full principle in docs/design-principles.md. Triggered by: Build C Delivery Cycle Tracking nav gap (sidebar restricted to ds/cb, excluding Phil; home card was non-functional stub). Source: April 2026 post-Build-C review.

**D-164** — Admin Hub Consolidation. All administrative functions are grouped under a single Admin hub at `/admin`, accessible via one sidebar entry for `['phil','admin']` roles. The hub renders a card grid — one card per admin function. No admin sub-function appears as a direct sidebar link. Admin sub-routes (`/admin/workstreams`, `/admin/divisions`, `/admin/users`, etc.) remain stable as functions are added. Each hub card follows Principle 3 (Visible Context) — states what the function does and why. Full principle in docs/design-principles.md. Source: April 2026 post-Build-C review.



### System Scope & Architecture Principles

**37** — System Hierarchy, Container Types, and Multi-Tenancy. Six-level hierarchy with configurable governance settings at every level. Platform level sits above all Organizations (managed by TRIARQ). Level 1 naming resolved as Trust (D-70) and Division as collective noun (D-71). Governance settings at each level are configurable — default is inherit from parent. Phil's visibility is a system constant that cannot be toggled off by any Sub-Division configuration. Schema is multi-tenant from day one — every entity carries org_tenant_id. Demo runs as single-tenant. Standing up a second Org-Tenant is a configuration exercise. UI label is Organization. Connects to: D-70, D-71, D-72, D-85, D-134, D-135.

**38** — Canon / Scope Independence. Canon is a lifecycle state — not a scope level. Scope and lifecycle state are independent axes. Any OI artifact has both a lifecycle state and a scope level. They move independently. Lifecycle states: Draft → Candidate → Canon → Superseded. [NOTE: "Candidate" is the conceptual label for the submission-through-approval phase; see D-45 for the full operational state detail within that phase.] Scope levels: Project → Sub-Division Group → Sub-Division → Division → Tenant-wide. "Canon at Sub-Division scope" means approved, authoritative, in active use — but only within that Sub-Division. "Tenant-wide" is the highest scope within an Org-Tenant. Connects to: D-45, D-76, D-95, D-105.

**39** — Engineering Governance File Structure. Four canonical governance files committed to the repository on day one before any schema or application code: BOOTSTRAP.md (highest authority — enforcement philosophy, hard gate definitions, override mechanics, gate lifecycle, amendment process), OPERATING_MODEL.md (system identity and philosophy, AI authority boundaries, stability classes), ENGINEERING_PRINCIPLES.md (technical guardrails, tenant isolation doctrine, security authority at data layer, dynamic SQL discipline), EXTERNAL_SYSTEMS.md (monitoring doctrine for systems outside version control — schema drift, security policy drift, privilege expansion). Precedence order: Bootstrap → Operating Model → Engineering Principles → External Systems → Project-specific context. Higher layer prevails on conflicts. Conflicts must be surfaced explicitly — AI may not silently resolve precedence conflicts. These files are the highest-authority context for Claude Code. Connects to: D-97 (CLAUDE.md scope), CLAUDE.md.

**40** — Engineering Governance Queue. Demo: GitHub Issues with structured labels (governance-override, soft-gate-dismissed, hard-gate-exception). Production: typed governance work item in the system queue. Required fields: issue type, severity, component affected, rationale, resolution notes, timestamp, actor. Queue view requirements: visible queue, severity filtering, aging report, override frequency tracking, trend analysis. Override frequency and trend analysis are explicit requirements — not optional. Tickets remain open until explicitly resolved. Dismissed concerns and overrides are never silently closed. Connects to: D-41, D-42, D-43, UC-12.

**41** — Soft Gate Model. Soft gates do not block merge. They require structured reflection and create a governance ticket. Soft gate triggers: dependency addition, complexity increase, architectural boundary adjustment, long-lived feature flag introduction. Soft gate acknowledgment must answer: Why is this necessary? Does it affect core invariants? Is it reversible? Could it become debt? Under what conditions would we revisit it? Soft gate acknowledgments create GitHub Issues (demo) or governance queue items (production). Connects to: D-40, D-42, D-43.

**42** — Governance Circuit Breaker. Pattern-level governance response — not incident-level. Triggers when patterns emerge rather than individual violations. Trigger conditions: high override frequency, increasing violation density, tenant-related violation clustering, CI failure trend increase. Response options (graduated): require higher-level approval for overrides, freeze certain change classes, escalate to architecture review, temporarily disallow overrides. Thresholds are configurable — not hardcoded. Circuit breaker configuration is a Core Identity change requiring a decision record and version increment in BOOTSTRAP.md. Circuit breaker status is visible in the governance queue dashboard and surfaces in Phil's work queue as a priority alert when triggered. NOTE: this governance circuit breaker is separate from the AI agent circuit breaker in the Delivery Framework — different concept, same name, context distinguishes them. Connects to: D-40, D-41, D-43.

**43** — Governance Escalation Path. Escalation triggers: incomplete override rationale, repeated violations by same component, repeated overrides of same rule, security-sensitive cluster patterns. Escalation path: Step 1 — Capability Builder (direct reviewer); Step 2 — Phil, EVP Performance & Governance (Governance Lead); Step 3 — Pravin, VP Technology (Architecture Authority); Step 4 — Jon Kramer / Dennis / Ally (Security Authority — security-sensitive escalations only). Escalation logic is explicit and documented in BOOTSTRAP.md. Every escalation creates a governance ticket and is logged in the immutable audit trail. Resolution must be documented before closing. Connects to: D-40, D-41, D-42, Authority Map (Authority 1D).

**44** — OI Library as Full Working System, Not Repository Only. The OI Library submission function (UC-21) is a full working system for all authorized participants — not a governance repository for Phil only. Any authorized person can submit any artifact directly through a working UI. The review and canonization queue is a live working queue for assigned approvers. This is the foundational access model for UC-21 that D-60 builds on: D-44 establishes who the system is for; D-60 establishes that submission is decoupled from workflow. Connects to: D-60, UC-21.

**45** — OI Library Artifact Canonization Lifecycle States. The operational lifecycle states for an OI Library artifact are: Draft → Candidate (= Submitted, in approver's queue) → Under Review (approver has opened it; Consulted parties notified) → Approved → Canon → Superseded → Voided. A returned artifact (Approver returns to submitter for revision) re-enters at Draft with a revision note. NOTE: D-38 uses "Candidate" as the conceptual label for the submission-through-approval phase; D-45 gives the operational states within that phase. The two are complementary — D-38 is the conceptual model, D-45 is the implementation detail. Connects to: D-38, D-60, UC-21, Approval Workflow primitive, Lifecycle primitive.

**47** — OI Library Scope Assignment: Submitter Proposes, Approver Can Adjust. Submitter proposes Division and scope level at submission time. Approver can adjust scope before or during canonization — scope is not locked at submission. System applies artifact type's default scope when none is specified. Inheritance applies: type-level defaults configured at tenant level; Divisions can override. NOTE: D-62 covers the same principle at a summary level; D-47 adds the explicit rule that the approver (not just the submitter) can adjust scope, and makes the inheritance detail explicit. Connects to: D-38, D-62, D-65, UC-21.

**48** — OI Library Submission UI: Minimum Required Fields. Minimum required fields for an OI Library artifact submission: (1) Title, (2) Artifact Type (from admin-configured type list), (3) Division (defaults to user's linked Division; dropdown if user is linked to multiple Divisions; can be inferred by workflow in some cases), (4) Artifact Body or Attachment, (5) Summary (one paragraph — what this is and why it matters), (6) Source Context (optional — linked Delivery Cycle, linked gate, or ad-hoc). System auto-populates: submitter identity, submission date, routing destinations based on type configuration. Connects to: D-44, D-45, D-47, D-62, UC-21, Record primitive.

**50** — Delivery Cycle Build Report Required at Go to Deploy Gate. The Delivery Cycle Build Report must be submitted to the OI Library before the Go to Deploy gate can open (the gate that advances from UAT to PILOT). Delivery Cycle Build Report canonization must be complete before the Close Gate. Tier 2 cycles do not require a Delivery Cycle Build Report at the Go to Deploy gate. Connects to: D-74, D-110, D-113, UC-21, UC-06.

**52** — Engineering Governance Standards as Governed OI Library Artifacts. Engineering governance standards (ENGINEERING_PRINCIPLES.md and companion documents) are governed OI Library artifacts — versioned, approved through the OI Library canonization flow, scoped tenant-wide. Phil is the Approver for engineering governance artifacts at tenant level. Updates go through the same submission and approval process as any other artifact. This makes engineering governance a governed OI artifact rather than an unmanaged file. NOTE: delivery mechanism — how governed engineering standards surface to Claude Code and engineers — is deferred pending a design session before Build C or D. Connects to: D-39, D-60, UC-08, UC-25.

**49** — Tier 3 Gate Battery and Gate Content Standards. Three delivery gates: Go to Build, Go to Deploy, Close (D-109). [NOTE: Gate count superseded by D-154 — four named gates: Brief Review, Go to Build, Go to Deploy, Close. Gate content below remains operative.] Gate content is guidance not mandated. Go to Build: Context Package completeness, Brief quality, Tech Spec, MCP scope, acceptance criteria, agent registry (T3), data classification. Go to Deploy: security scans, compliance checklist, 7-step agentic governance (T3), UAT sign-off, Build Report reviewed. Close: outcome demonstrated, verification status set, OI Library submission, retrospective (T2–3). Connects to: D-108, D-109, D-124, D-125, D-154.

**55** — System Name: Pathways OI Trust. The system is named the Pathways OI Trust. Name rationale: a Trust holds and protects assets on behalf of beneficiaries, governed by a trustee with fiduciary responsibility, designed to compound value over time. OI is the asset. Phil is the trustee. The governance gates are the trust instrument. The Capabilities Equation is how the trust compounds. The name resolves the collective-name question for the cross-cutting domain management layer: OI is the sum of all organizational data and knowledge — HITRUST controls, engineering anti-patterns, risk register entries, and compliance policies are all OI. NOTE: final form of name still pending Mike confirmation (D-55/56 open). Connects to: D-56, D-81.

**56** — OI Definition Extended. Under Mike's own definition ("OI is the sum of TRIARQ's organizational data and knowledge"), OI is extended to include compliance knowledge (HITRUST controls), security knowledge, performance knowledge (KPI definitions), engineering context (best practices, anti-patterns, architectural notes), and policy knowledge — not just Context Briefs and the OI Library. All artifact types the platform manages are categories of OI. NOTE: pending Mike confirmation (D-55/56 open). Connects to: D-55, D-81, D-111.

**60** — OI Library Submission Decoupled from Delivery Cycle Workflow. The OI Library submission function exists independently of any Delivery Cycle or workflow. Any authorized person can submit any artifact to the OI Library at any time. The full OI Library flow (Submit → Review → Approve/Return → Canon → Superseded/Voided) operates as a standalone capability. Specific workflows (e.g., Delivery Cycle Build Report at UAT) integrate naturally into this standalone capability rather than building parallel review processes. Primary build priority — needed before or alongside the Delivery Cycle workflow, after UC-20 container infrastructure. Connects to: UC-21, D-89.

**62** — OI Library Artifact Scope Assignment. Submitter proposes scope level and container at submission time. Editable after submission. Many engineering artifacts are tenant-wide but not all — some scoped to Performance Core, Foundry, or a specific domain. Example: "RCM agents must have PHI flag set to Yes" is RCM-scoped, not tenant-wide. System suggests scope based on artifact type defaults. Connects to: D-38, D-104, UC-21.

**65** — Approval Assignment Model. People-based, not abstract roles. Configured per container per artifact type or gate type. Inherits up to parent container when not set at current level. When no container template exists, escalates up the hierarchy until a template is found. Same model applies identically to Delivery Cycle gate approvers and OI Library canonization approvers. Connects to: D-94, D-66, D-135.

**66** — RACI Inheritance. Container-level RACI template is the default for all Delivery Cycles and OI Library submissions within that container. Overridable per Delivery Cycle or per OI Library submission. This inheritance pattern applies broadly across the system — not just to RACI but as a general design pattern for configurable defaults. Connects to: D-65, D-94, D-135, D-137.

**67** — Jira Link Model. Jira link is bidirectional — OI Trust Delivery Cycle can be linked to an existing Jira epic, or a Jira epic linked back to a Delivery Cycle. Link must be in place before Go to Build gate. One Delivery Cycle can link to multiple Jira epics (iterative phases, split cycles). Manual linking for demo. API-based Jira epic creation from the system deferred. Connects to: D-117 (Jira MCP integration approach — complementary, not superseding), UC-07.

**69** — OI Library Knowledge Capture: Three-Layer Maturity Model. Layer 1 — Human Discipline: people recognize OI-worth content. Layer 2 — Workflow Assistance: capture at natural stopping points (epic close, UAT). Layer 3 — AI-Driven Extraction: AI drafts, human reviews. Layers are not sequential phases; all may be active simultaneously. The Trust makes all three coherent.

**70** — Container Naming: Trust at L1. Nine Trusts: Practice Services Trust, Value Services Trust, Enterprise Services Trust, Foundry Trust, Performance Trust, Platform Trust, Governance Trust, Growth Trust, Administration Services Trust.

**71** — Division as collective noun for all containers at every level. Full term: Trust Division.

**72** — Overall hierarchy called Trust Structure.

**73** — Context Briefs are archived historical record, not canonical. Superseded by Delivery Cycle Build Report upon canonization.

**74** — Delivery Cycle Build Report is the confirmed name for the artifact that records what was actually built in a Delivery Cycle. Produced at the Go to Deploy gate. Supersedes the Context Brief upon canonization. Submitted to the OI Library at Delivery Cycle close. Previously called "Epic Build Report" (working placeholder — retired 2026-03-13). Connects to: D-73, UC-01, UC-22.

**75** — Workflow Maps are a first-class OI Library artifact type, distinct from SOPs.

**76** — OI Library Storage: four-layer architecture. (1) Relational DB: metadata/workflow state/governance. (2) Vector embeddings: semantic retrieval, only Canonical artifacts embedded. (3) Structured rule store: CBRs/decision logic, MD + JSON/YAML. (4) Project/working context: live material until canonization.

**78** — Growth Trust (Marko, EVP Growth) and Administration Services Trust (Katie, Controller) added. Both OI Library submission/approval only — out of scope for epic delivery flow.

**80** — Platform Primitives — Eight Foundation Capabilities. 1-Record, 2-Registry, 3-View, 4-Queue, 5-Approval Workflow, 6-Lifecycle, 7-Trigger, 8-Notification. All use cases are compositions of these. Targeted use cases are named surfaces of the primitives. Every UC entry must include a Primitives mapping. Decision 79 resolved: Project = Record+Lifecycle+Approval+Notification; Epic is a specialization.

**81** — System is Phil's full management infrastructure for all four authorities. OI is the first artifact type built; architecture accommodates all 11 artifact types. [NOTE: Artifact type count superseded by D-145 — 13 seeded system artifact types.]

**82** — Design Wide, Build Narrow. All artifact types designed from day one. OI is first build priority.

**83** — Delivery Cycle is the primary unit of work. [Renamed from Epic — see D-107]. All artifacts organized around it.

**84** — BCBSM: three-layer scope. Multi-tenancy must be architecturally possible (D-85).

**85** — Multi-Tenancy at Organization level architecturally required from day one. org_tenant_id field.

**86** — System is a working system for all participants, not just Phil.

**87** — US/India authority seam acknowledged. Phil: strategy/policy. Pravin: execution. GRICS cluster.

**88** — Policy and Training added as Authority 1F. Near-term: Onspring. Long-term: OI Trust.

**89** — Build Order: Containers → OI Library → Delivery Cycle workflow.

**91** — Active Capture Mandate. Claude captures decisions during session. Named patterns → Decisions Log. Primitive extensions → Decisions Log + Architecture Notes. Phil verbal approval = locked.

**92** — Demo Technology Stack: Angular, Supabase (PostgreSQL + pgvector + Auth), Vertex AI, Node.js MCP servers on Render, GitHub Pages. QPathways look and feel.

**93** — Two non-negotiable architectural rules: (1) MCP-Only Database Access — no direct Supabase client calls from Angular. (2) UI as Presentation Layer Only — no prompts or business logic in components.

**94** — RACI as governance pattern across primitives. Approval + Consultation interaction pattern. Alert Log as Notification Primitive extension. Consulted uses Approve/Decline labels (advisory). Required role: Accountable only. RACI assignments via templates + instance overrides. Deferred: Accountable definition (resolved D-149), granularity (still open D-94-Granularity).

**95** — OI Library Dual-Interface: Human Governance Layer (submit/review/organize/supersede) and Agent Consumption Layer (vector search, structured rules, metadata-filtered retrieval). System-managed Translation Layer fires at Canonical status.

**96** — Demo Build Sequence: four design-then-build cycles A–D. [NOTE: Superseded by D-133 — six build cycles A–F.] Each cycle = design session → Build Spec → Claude Code build. Connects to D-97, D-98, D-133.

**97** — CLAUDE.md Scope: project-specific constraints only. Schema/tools/acceptance criteria in Build Spec.

**107** — Delivery Cycle replaces Delivery Epic across all references.

**108** — 12-stage lifecycle: BRIEF → DESIGN → SPEC → [Go to Build] → BUILD → VALIDATE → UAT → [Go to Deploy] → PILOT → RELEASE → OUTCOME → [Close] → COMPLETE. CANCELLED and ON HOLD as terminal states. Tier 1 skips VALIDATE and PILOT (or N/A with rationale). [NOTE: Go to Release gate added between PILOT and RELEASE per Session 2026-03-24-G. Updated lifecycle string: BRIEF → DESIGN → SPEC → [Go to Build] → BUILD → VALIDATE → UAT → [Go to Deploy] → PILOT → [Go to Release] → RELEASE → OUTCOME → [Close Review] → COMPLETE]

**109** — Three named gates: Go to Build, Go to Deploy, Close. [NOTE: Superseded by D-154 — four named gates: Brief Review, Go to Build, Go to Deploy, Close.]

**110** — Delivery Cycle Build Report produced at Go to Deploy gate.

**111** — OI Library replaces Knowledge Base / KB across all references.

**112** — Context Package supersedes Source Pack. [SUPERSEDED by D-128 — see archive for D-112 original].

**113** — Delivery Cycle artifacts live on the cycle record, not in OI Library, until Build Report canonization.

**114** — Pilot Plan as Mandatory DESIGN Output. If the PILOT stage is set to active (not N/A), the pilot plan field in DESIGN becomes required. The DESIGN gate cannot pass without it. At minimum the pilot plan covers: who participates, what scope, what duration, what success criteria, what triggers rollback. Can be a full document for complex cycles or a paragraph for straightforward ones. Cannot be empty if a pilot is planned. Connects to: DESIGN stage, PILOT stage, D-108.

**115** — Cursor Prompt as BUILD Phase Artifact. The Cursor prompt is not part of the governed tech spec. It is a BUILD phase working artifact. The Capability Builder writes the initial Cursor prompt after the tech spec passes the Go to Build gate, translating the approved spec into AI-executable instructions. Multiple prompts are expected during BUILD — the initial prompt is comprehensive but iteration is the norm. The OI Trust does not track individual prompts. For Tier 3 (patient data), the initial prompt may be attached to the cycle record for audit trail purposes, but this is a compliance requirement not a delivery requirement. Connects to: SPEC stage, BUILD stage, Go to Build gate, tech spec template, Tier 3 governance.

**116** — AI Stage as Agent Property, Not Cycle Property. The AI maturity stage (Consult → Automate → Product) is a property of the agent in the Agent Registry, not a property of the Delivery Cycle. A cycle deploys an agent at a designated stage. Stage advancement requires a new Delivery Cycle with a new Context Brief whose Context Package includes prior-stage performance evidence. The AI Production Governance Board reviews stage advancement decisions. [AI Governance Board corrected to AI Production Governance Board per D-163.] Connects to: Agent Registry, PILOT stage (AI stage determines monitoring requirements), D-163.

**117** — Jira MCP Integration Approach. The OI Trust is the governance system of record for Delivery Cycles. Jira is the engineering execution tool. They connect via MCP integration. The OI Trust reads/writes governance fields on Jira epics: Outcome Statement, Context Brief Link, Tier Classification, Capabilities Equation Mapping, Technical Specification status. Jira remains where Capability Builders manage stories and daily work. The OI Trust is where Phil, Domain Strategists, and governance reviewers see the governed lifecycle, gates, and OI Library. Mike's required Jira epic fields become the MCP integration contract. Connects to: Build C, Jira integration, ARCH-16.

**118** — QPathways Design Tokens for OI Trust. The OI Trust demo uses the QPathways application design tokens (triarq_tokens_v1.json, triarq_tokens_v1.css), NOT the TRIARQ corporate brand tokens from brand.md. QPathways tokens use Roboto, primary #257099, dark #00274E. Corporate brand uses Gill Sans, Deep Navy #12274A, Vital Blue #0071AF. The application design system is distinct from the corporate brand. The ionic.theme.map.scss, CSS variables file, and SVG icon set are ready for the Ionic + Angular stack. Connects to: Build A (UI foundation), D-92, D-151, D-152. Resolves ARCH-01.

**119** — First Principles Delivery Cycle Application Standards. Context Package before Brief. Automate field never blank. Complexity at Automate = go back to Reduce. Capabilities Equation advancement required. NOTE: D-24 open — Phil's recollection of intent may conflict with locked text.

**120** — Trust-Level Metric Sets as Performance Architecture Frame. Each Trust owns a metric set reflecting what that Trust is accountable for delivering. The Performance Systems Builder owns definition and governance of metric sets across all Trusts. Trust Division Owners collaborate but do not own definitional authority. The Pathways Performance reporting cadence aggregates metric sets upward across all Trusts. Connects to: Performance Systems Builder role, Authority Map, UC-09, UC-11.

**121** — Governance Metrics: Two-Mode Architecture. Mode 1 — Governance Trust's own performance: gate review turnaround time, operating contract freshness, policy attestation completion rates, OI Library submission rates. Mode 2 — Governance health indicators embedded as a standard layer across all other Trusts: governance behaviors within each Trust (agents deployed through correct gates, operating contracts current, agent registry maintained) that aggregate to a cross-Trust governance health view owned by Phil. Mode 2 indicators are defined once and applied uniformly across every Trust. Connects to: D-122, Authority Map, all Trust metric sets.

**122** — Phil Owns Governance Trust and Cross-Trust Governance Health View. Phil is the Division Owner of the Governance Trust. Phil owns the cross-Trust governance health view produced by Mode 2 governance indicators (D-121). One authority expressed at two levels of granularity — no handoff between roles because both are Phil. Connects to: D-121, Authority Map.

**123** — Session Active Rules and Trigger Phrase. Seven Session Active Rules established as a standing behavioral re-prompt for all design sessions. Rules are active from session start. Trigger phrase: if Phil types "Session Active Rules" at any point, Claude stops, re-reads all seven rules, confirms compliance, and applies them actively from that point forward. Rules embedded in Project Instructions as a named section. Connects to: Design & Communication Principles, project-instructions.md.

**124** — Delivery Cycle Tier Election. Tier set at BRIEF stage. Tier drives gate configuration.

**125** — Delivery Cycle Event Log. Append-only log on every Delivery Cycle record.

**126** — BRIEF-exit formal gate. Brief Review gate is the exit from BRIEF stage.

**127** — Context Brief three-term convention. [Full text in archive — terminology operational.]

**128** — Context Package supersedes Source Pack. Context Package = the working knowledge artifact that travels with the Delivery Cycle.

**129** — Trust name updates: Practice Services Trust, Value Services Trust, Enterprise Services Trust, Administration Services Trust. Global find-and-replace applied.

### Build A Decisions (Design Session A — D-130 through D-155)

**130** — Canonical document count corrected to twelve. [NOTE: Superseded — count corrected to eleven. CLAUDE.md reclassified as on-demand 2026-03-13.]

**131** — Permissions model: role-aware, permissions-deferred. Any authenticated user can perform non-admin actions. Admin actions gated to Admin role. RACI approval workflow enforces approver identity from Build B.

**132** — Infrastructure stack locked: Angular 19 + Native Federation (D-143), Node.js on Render for MCP servers, Supabase (PostgreSQL + pgvector + Auth), personal GCP for Vertex AI (D-148).

**133** — Six build cycles A–F.

**134** — Division as universal container primitive. Every container at every level is a Division.

**135** — Hierarchical admin model. Admin at any Division level grants access to that Division and all children recursively. Access does not propagate upward.

**136** — Roles are system-level. One role per user, applies everywhere. Roles: Phil, DS, CB, CE, Admin.

**137** — Division access inheritance is downward only.

**138** — Authenticated user with no Division assignment sees personal and system-level views only.

**139** — Admin and Functional Role Separation with Override. Default: admin OR functional, not both. Setting: "Allow both Admin and Functional Roles on this user" (boolean, default false). Phil's bootstrap account = true.

**140** — Blocked Action UX Standard. Tell user action is blocked + what would need to change. Never error codes or silent failures.

**141** — Authenticated user with no Division assignment sees helpful onboarding message, not blank shell.

**142** — Authentication: Email OTP (magic link) via Supabase Auth. Remember me: 30-day persistent session. No SSO/biometric in this build.

**143** — Angular Native Federation Remote. Runs standalone on GitHub Pages AND loadable into Mike's platform shell at merger. Feature areas: OILibraryModule, AdminModule, ChatModule, DeliveryModule (lazy-loaded).

**144** — MCP Server Pattern: stateless, verb_noun tool naming, JWT validation middleware on every request, atomic tools, response envelope { success, data, error? }, semantic versioning.

**145** — Two-Tier Artifact Type Model. is_system_type boolean + workflow_handler string. 13 seeded system types: Context Brief, Delivery Cycle Build Report, Engineering Best Practice, Domain Knowledge, SOP, Policy, Workflow Map, Training Module, Risk Register Entry, HITRUST Control, CBR, Agent Registry Entry, Performance Metric Definition.

**146** — Supported file formats: PDF, DOCX, MD, TXT only. Layer 1: extension + magic bytes. Layer 2: ClamAV scan. Size: 25MB per file, 500MB/100 files per batch.

**147** — Document Access MCP Tool Set. Human governance: search_documents, get_document, get_documents_bulk, create_artifact, update_artifact_metadata, transition_lifecycle_status, create_folder, get_folder_contents. Agent consumption: query_knowledge. Division scoping rule: omit division_id = scoped to all accessible Divisions.

**148** — Vertex AI via personal GCP pre-port. Env vars: VERTEX_PROJECT_ID, VERTEX_LOCATION, VERTEX_MODEL. Model selection deferred (ARCH-19, does not block Build A).

**149** — RACI Functional Definitions. Accountable: binding Approve/Decline, can adjudicate before all Consulted respond. Consulted: advisory Approve/Decline, blocked after Accountable adjudicates. Informed: Notifications only, not Action Queue. Items persist until user dismisses.

**150** — Home Screen Card Definitions per Role. Universal: My Action Queue + My Notifications. Phil: + System Health, OI Library, Divisions, Embedded Chat. DS/CB: + My Delivery Cycles, OI Library, Embedded Chat. CE: + OI Library, Embedded Chat. Admin: + Divisions, User Management, OI Library, Embedded Chat.

**151** — QPathways Design Token TODOs Resolved. radius.card=10px, radius.button=5px, radius.input=5px, radius.pill=999px. sidebar-active: --triarq-color-primary (#257099). CRITICAL: token file h2=20px is data entry error — canonical h2=60px. Font: Roboto (not Gill Sans/Lato). h1(96px) hero only; h2(60px) page-level sections; h3(48px) major sections; h4(34px) card/panel titles; h5(24px) list/form headers; h6(20px) metadata labels.

**152** — Ionic Theme Map provisional. ionic.theme.map.scss maps --triarq-* to --ion-color-*. Provisional pending designer confirmation.

**153** — Embedded Chat Citation Format. Inline: superscript [N] clickable. Reference list: [N] Artifact Type — Title — Section · Division · Lifecycle Status. Clickable → DocumentViewerComponent side panel. Viewer scrolls to chunk if chunk_index available. Lifecycle color: Canon=green, Candidate=amber, other=gray.

**154** — Five Named Gates: Brief Review, Go to Build, Go to Deploy, Go to Release, Close Review. Tier gate configuration is admin-configurable. [NOTE: Gate positions in stage sequence locked by Session 2026-03-18 Decision A. "Close" renamed to "Close Review" by Session 2026-03-18 Decision C. Fifth gate Go to Release added between PILOT and RELEASE by Session 2026-03-24-G.]

**[Session 2026-03-18 — Decision A]** — Gate Position in Stage Sequence. The four named gates are positioned as follows in the 12-stage Delivery Cycle lifecycle: Brief Review gate exits BRIEF stage before DESIGN begins; Go to Build gate exits SPEC stage before BUILD begins; Go to Deploy gate exits UAT stage before PILOT begins; Close Review gate exits OUTCOME stage before COMPLETE. Locks the positional ambiguity introduced by D-154. D-49 gate content mapping remains operative. Brief Review accurately names its gate — it guards the Brief only, before DESIGN begins. Connects to: D-154, D-49, D-108, D-126, ARCH-12.

**[Session 2026-03-18 — Decision B]** — Delivery Cycle Date Commitment Purpose. Target dates in the Delivery Cycle are a team alignment and communication tool — not project management overhead and not a governance tracking mechanism. Four purposes: (1) Team commitment — a team that cannot name a date has not finished planning; the act of setting the date is itself valuable. (2) Planning and alignment forcing function — setting the date requires the team to reason through what reaching the next gate demands; gaps surface during planning, not after the miss. (3) Divergence as signal — materially different dates proposed by a Domain Strategist and Capability Builder indicate misaligned scope, competing commitments, or insufficient context; the negotiation reveals the real problem early. (4) Upward communication without upward management — Phil, Sabrina, and development leaders see where teams are pointed without having to ask; under-directed or under-resourced teams self-report through their dates or through the absence of them. This purpose statement constrains implementation: any date feature that adds overhead without serving one of these four purposes should not be built. Connects to: D-154, D-108, D-124.

**[Session 2026-03-18 — Decision C]** — Close Review Gate Name. The fourth named gate is renamed from "Close" to "Close Review." Close Review names the act of review at that passage point — the demonstrated outcome is reviewed before the cycle completes — consistent with Brief Review. The four confirmed gate names are: Brief Review, Go to Build, Go to Deploy, Close Review. Supersedes "Close" as the fourth gate name everywhere it appears in canonical documents. Connects to: D-154, D-108, Session 2026-03-18 Decision A.

**[Session 2026-03-24 — Decision A]** — Delivery Cycle Dashboard Date Field State Model. Each date column on the Delivery Cycle dashboard row operates in one of three display modes determined by whether an actual date has been recorded. Commitment mode: actual_date is null — show target date with upcoming/overdue logic applied (overdue = today exceeds target date, displayed in Oravive; upcoming = 4 or fewer days remaining, displayed in Sunray). Achieved mode: actual_date is populated and actual_date ≤ target_date — show actual date, label as "Actual," neutral color treatment. Missed mode: actual_date is populated and actual_date > target_date — show actual date, label as "Actual," muted overdue color treatment. Urgency indicators (Sunray/Oravive) apply only in Commitment mode. Overdue state suppressed on cycles in COMPLETE or CANCELLED lifecycle stage. Connects to: ARCH-15, D-108, Session 2026-03-24-B, Session 2026-03-24-E.

**[Session 2026-03-24 — Decision B]** — Delivery Cycle Dashboard Milestone Date Columns. The two persistent date columns on the Delivery Cycle dashboard row are Pilot Start Date and Production Release Date. Pilot Start Date corresponds to Go to Deploy gate clearance. Production Release Date corresponds to Go to Release gate clearance. Each column is always present at a fixed position on the dashboard row. When not yet set, the column is blank — no placeholder text. No rules govern when these dates must be set. Gate dates (all five) are visible on the cycle detail view, not the dashboard row. Connects to: D-108, D-154, ARCH-15, Session 2026-03-24-A, Session 2026-03-24-E, Session 2026-03-24-G.

**[Session 2026-03-24 — Decision C]** — Dashboard Headline as Intelligent Summary Text. The Delivery Cycle dashboard row displays a headline text field — not a grid of date cells — that answers: what does someone need to know right now about where this cycle is going? Display logic: (1) Pre-pilot, no pilot target set: next gate name and target date. (2) Pre-pilot, pilot target set: next gate name and date plus pilot target date. (3) Gate pending approval: "Awaiting [Gate Name] approval · [target date if set]." (4) Gate overdue: "[Gate Name] approval overdue · X days." (5) Stage active, next gate future: current stage and next gate target. (6) Post-deploy: Pilot Start or Production Release as anchoring date. Overdue and upcoming logic from Decision A applies. Connects to: D-108, Session 2026-03-24-A, Session 2026-03-24-B.

**[Session 2026-03-24 — Decision D]** — Current Stage Displayed on Dashboard and Detail View. Current lifecycle stage is displayed on both the Delivery Cycle dashboard row and the cycle detail view. Connects to: D-108.

**[Session 2026-03-24 — Decision E]** — Five Milestone Dates as Planning Layer. Five tracked planning dates on a Delivery Cycle, each with a target date (team-set) and actual date (system-recorded when gate clears): (1) Brief Review Complete — Brief Review gate; (2) Build Start — Go to Build gate; (3) Pilot Start — Go to Deploy gate; (4) Release Start — Go to Release gate; (5) Close Review Complete — Close Review gate. Each operates under the date field state model in Decision A. Gate detail lives on the cycle detail view. Connects to: ARCH-15, D-108, D-154, Session 2026-03-24-A.

**[Session 2026-03-24 — Decision F]** — Warning for Unset Actual Dates on Passed Stages. The system warns when actual dates are unset for stages the cycle has already moved through. Data quality signal — not a hard block. Warning surfaces on the cycle detail view. Connects to: ARCH-15, Session 2026-03-24-E.

**[Session 2026-03-24 — Decision G]** — Fifth Gate: Go to Release. A fifth named gate, Go to Release, is added to the Delivery Cycle lifecycle. Positioned between PILOT and RELEASE stages — exits PILOT, before RELEASE begins. Gate configuration (approver identity, required or optional by tier) is admin-configurable per Division per tier per D-65/D-66. Tier 3 cycles with agent or Analytics Capability deployment trigger AI Production Governance Board review at this gate. The five confirmed gate names are: Brief Review, Go to Build, Go to Deploy, Go to Release, Close Review. Connects to: D-108, D-154, Session 2026-03-18 Decision A, D-65, D-66, D-163, ARCH-12.

**[Session 2026-03-24 — Decision H]** — Gate Enforcement via Business Rules MCP. Stage advancement past any required gate is enforced by the business rules MCP. The UI calls the MCP before allowing any stage transition. A required unapproved gate returns a blocked state with reason stated. Users cannot manually set current stage. Blocked action UX follows D-140. Connects to: D-93, D-140, D-144, Session 2026-03-24-G.

**[Session 2026-03-24 — Decision I]** — Right Panel as Standard Detail Surface. The right panel pattern established for the Document Viewer (D-153) is the standard detail surface across the system. Clicking any record in a list view opens its detail in a right panel. The list view remains visible and navigable on the left. No detail view opens as a full page replacement or modal unless a specific exception is locked. Connects to: D-153, Principle 4.2, UC-05, Build C detail view requirement.

**[Session 2026-03-24 — Decision J]** — Cycle Detail View Required in Build C First Pass. The Delivery Cycle detail view is required in the first pass of Build C — not a later addition. Shows all five milestone dates (target and actual), current stage, all five gate statuses with required approvers, and other cycle details. Opens in right panel per Decision I. Connects to: D-108, Session 2026-03-24-E, Session 2026-03-24-I.

**[Session 2026-03-24 — Decision K]** — Bootstrap File Design Principle: Entry Point Not Manifest. The repo-resident bootstrap file for coding agent session initialization contains only the MCP endpoint reference — not document IDs, version hashes, or governing document content. All governing documents are retrieved from the OI Library via MCP at session start. MCP response determines what to load and in what order; documents may chain further MCP calls. Failure behavior: hard pause — session does not proceed on absent or unverified governing constraints. Connects to: D-93, D-155, ARCH-22, D-52, D-39.

**[Session 2026-03-24 — Decision L]** — Delivery Workstream Registry and Delivery Cycle Assignment. A Delivery Workstream is a named registry entry representing a team of Capability Builders with shared delivery accountability. Registry fields: workstream name, active/inactive status, home Division, member list (Capability Builders), named workstream lead. Every delivery cycle is linked to a Delivery Workstream at creation. Division is set explicitly on the delivery cycle — the workstream's home Division pre-populates the field but is overridable per cycle. A Delivery Workstream can work across multiple Divisions across different cycles without affecting Division governance accuracy on those cycles. The dashboard supports filtering and grouping by Delivery Workstream, enabling WIP visibility per workstream and a roadmap view. The OI Trust dashboard serves as the planning surface for Phil and Domain Leaders to see what each workstream is carrying. Connects to: D-108, D-80 (Registry primitive), UC-20, ARCH-15, ARCH-23, Session 2026-03-24-M, Session 2026-03-24-Q.

**[Session 2026-03-24 — Decision M]** — Current Stage as System-Controlled Field with Automatic Advancement. Current lifecycle stage is a system-controlled field with a fixed list of values: the 12 named stages (BRIEF, DESIGN, SPEC, BUILD, VALIDATE, UAT, PILOT, RELEASE, OUTCOME, COMPLETE) plus CANCELLED and ON HOLD as terminal states. Users cannot manually set current stage. When a required gate is approved, the system automatically advances the stage to the next stage — no manual trigger required. Gate approval is the advancement event. Connects to: Session 2026-03-24-D, Session 2026-03-24-H, D-108.

**[Session 2026-03-24 — Decision N]** — Milestone Date Status Model: Five States with Color. Each of the five milestone dates on a delivery cycle carries one of five statuses with fixed display colors: (1) Not Started (gray) — default state when a target date is set for a gate that is not yet the current or next gate, or before any date is set. (2) On Track (green) — human-set affirmation that the team expects to meet the target date. Not a system default. (3) At Risk (amber) — human-set signal that the date is in jeopardy regardless of arithmetic proximity. (4) Behind (red) — system-set automatically when today exceeds the target date and the gate is not yet cleared. Displays days-overdue count. System sets this regardless of what human had previously set. (5) Complete (blue) — system-set automatically when the gate is cleared, actual date is recorded, and stage advances. Human can unset Complete, but unsetting requires a logged reason captured in the cycle audit trail to preserve the compliance record of the gate approval and its reversal. Human can set On Track and At Risk, and can move status backward (e.g. On Track → Not Started, At Risk → On Track). System overrides human for Behind. When a human changes a target date on a Behind milestone, the status automatically resets to Not Started. Connects to: Session 2026-03-24-A, Session 2026-03-24-E, Session 2026-03-24-O, D-108.

**[Session 2026-03-24 — Decision O]** — Default Status When Target Date Is Set. When a target date is set for the current or next gate, the default status is Not Started (gray) — the human must affirmatively set On Track. When a target date is set for any gate two or more positions ahead of the current stage, the status is Not Started (gray) and remains system-defaulted until the cycle reaches that gate. Connects to: Session 2026-03-24-N.

**[Session 2026-03-24 — Decision P]** — Build Sequence Revised: A → C → B → D → E → F. The delivery cycle tracker (Build C) is pulled forward to position 2, ahead of OI Library Core (Build B). Rationale: the tracker delivers immediate visible value to Domain Strategists and Capability Builders, creates natural demand for the OI Library, and the only hard dependency (Division and user infrastructure) is satisfied by Build A. The Delivery Cycle Build Report submission to the OI Library at cycle close is implemented as a stub in Build C and wired fully when Build B ships. Revised build sequence: A (Foundation) → C (Delivery Cycle) → B (OI Library Core) → D (Notifications) → E (Performance & Standards) → F (Agent Governance). Connects to: D-133, Master Build Plan v1.0, D-89.

**[Session 2026-03-24 — Decision Q]** — Delivery Workstream Active/Inactive Lifecycle and Gate Enforcement. Delivery Workstreams carry an active/inactive status. An inactive workstream cannot be assigned to new delivery cycles — the system blocks the assignment. When a workstream is inactivated, all active delivery cycles assigned to that workstream are immediately flagged with a warning: "Assigned Delivery Workstream is inactive — reassign before this cycle can advance past its current gate." The business rules MCP checks workstream active status as part of every gate clearance attempt. A cycle with an inactive workstream cannot advance past its current gate until a new active workstream is assigned. No grace period — reassignment is the resolution path and is not operationally complex. Connects to: Session 2026-03-24-L, Session 2026-03-24-H, D-80.

**Session 2026-03-25-A** | Outcome Statement as direct field on delivery_cycles | Three columns on delivery_cycles: outcome_statement (text, nullable), outcome_set_by_user_id (uuid FK → users), outcome_set_at (timestamptz). UI displays persistent amber warning when null. Never a gate block. Outcome Statement is not an artifact — it is a direct property of the cycle record. Connects to: ARCH-15, Session 2026-03-25-B.

**Session 2026-03-25-B** | Delivery Cycle artifact model | Two new tables: cycle_artifact_types (system-defined seed — artifact_type_id, artifact_type_name, lifecycle_stage, guidance_text, sort_order, gate_required [dormant], required_at_gate [dormant]) and cycle_artifacts (attachment records — cycle_artifact_id, delivery_cycle_id, artifact_type_id [nullable for ad hoc], display_name, external_url, oi_library_artifact_id, pointer_status [enum: external_only / promoted / oi_only], attached_by_user_id, attached_at). Slots organized by lifecycle stage. Empty slots render as placeholders in UI — guidance, not requirements. Connects to: Session 2026-03-25-A, C, D, E, F, G.

**Session 2026-03-25-C** | No platform enforcement on artifact slots at launch | gate_required and required_at_gate columns dormant at launch. All slots are guidance — visible, skippable, never blocking. Tier-specific enforcement available post-port via dormant columns. Connects to: Session 2026-03-25-B.

**Session 2026-03-25-D** | Delivery Cycle Build Report placed in BUILD stage | Named artifact slot in BUILD, not RELEASE. Guidance: "As-built record — what was built, how it works, deviations from spec. Complete before Go to Deploy. Input to Pilot, training, and OI Library submission." Consistent with existing Terminology Register definition (Go to Deploy gate). Connects to: Session 2026-03-25-B, D-50, terminology-register.md Section 13.

**Session 2026-03-25-E** | BRIEF stage artifact slots include Context Package artifacts | Four named slots in BRIEF: Context Brief; Scenario Journeys; True-life examples (plural); Stakeholder input record. Slots 2 and 3 represent the Context Package layer. Connects to: Session 2026-03-25-B, D-Context-Brief-2Layer.

**Session 2026-03-25-F** | Full cycle_artifact_types seed set locked | Complete slot set by stage: BRIEF (Context Brief; Scenario Journeys; True-life examples; Stakeholder input record). DESIGN (Design session output; UI/UX mockup; Process flow diagram). SPEC (Technical Specification; Cursor prompt; Architecture Decision Record; Agent Registry entry). BUILD (Governing document bootstrap log; Mend scan results; Code review sign-off; Delivery Cycle Build Report). VALIDATE (QA test results; OWASP ZAP scan; Wiz posture report). UAT (UAT sign-off record; 7-step governance checklist; HITRUST/GRICS checklist). PILOT (Pilot Plan; Pilot observations log). RELEASE/OUTCOME (Wiz continuous monitoring baseline; Outcome measurement record). ANY STAGE ad hoc (Reference document — artifact_type_id null, user provides display_name). All slots visible to all tiers. Connects to: Session 2026-03-25-B, C, D, E.

**Session 2026-03-25-G** | MSO365 to OI Library pointer transition model | On OI Library promotion: oi_library_artifact_id populated, pointer_status transitions from external_only to promoted, external_url preserved (not deleted). UI shows OI Library entry as live authoritative pointer, external URL as archived reference. Connects to: Session 2026-03-25-B.

**155** — On-Demand MCP Tool Loading Standard. Claude Code uses Tool Search to discover and load tools on demand rather than loading all tools at session start.

**156** — Analytics Capability as the Named Governed Analytics Output Object. LOCKED — pending Mike terminology confirmation. The governed analytics output object in the Pathways OI Trust is called an Analytics Capability. Any governed analytics output drawing from the managed semantic data layer, at any stage of maturity, is an Analytics Capability. When formally promoted to Automate or Product stage it becomes a Registered Analytics Capability tracked in the Analytics Capability Registry. Rationale: The Capabilities Equation defines Capabilities as what Context + OI + AI produces. Analytics outputs are Capabilities — this term extends the equation's vocabulary rather than creating parallel terminology. Connects to: Capabilities Equation, D-116, D-157, D-158, D-161, UC-24, UC-28.

**157** — Analytics Capability Three-Stage Maturity Model. LOCKED. Analytics Capabilities follow the same three-stage maturity model as AI agents: Consult → Automate → Product. Stage is a property of the Analytics Capability, not of the Delivery Cycle that produced it. Consult: output available, human reviews every result before use, no registration required. Automate: validated against known values, reproducibility baseline established, runs without human review on schedule, registration required. Product: embedded in client-facing deliverable, parent-company report, or governance document — locked data, versioned logic, provenance metadata, and Business Owner sign-off required before it ships. Connects to: D-156, D-116, D-158, Analytics Core Standards v1.0.

**158** — Analytics Capability Governance Authority Model. LOCKED. Analytics Capability stage advancement is governed by named business owners, not the AI Production Governance Board as primary authority. The Board plays a compliance check role at Product stage only. Consult: analytics team confirms human reviewed output before use. Automate — Operational Performance: Phil + relevant Domain Leader (validated, reproducibility baseline, locked-data confirmed, checklist complete). Automate — Process Health: Phil (Accountable), Craig/Sam/Mike/Sabrina (Consulted — advisory per D-149). [Craig = Craig Sycuro, VP Analytics — pending authority map entry.] Product: Phil + relevant Business Owner (Sabrina / Katie / Enterprise Services leader) — locked data, semantic layer version, output logic version, provenance metadata confirmed. Product — Board compliance check: AI Production Governance Board confirms four items only: data lock, semantic layer version, output logic version, provenance metadata present. Not a directional review. Why separate from agent governance: AI agents act autonomously at scale — a bad agent decision compounds before anyone notices. An Analytics Capability produces a number a human then acts on. The consequence goes through a human before it causes harm. Connects to: D-116, D-149, D-156, D-157.

**159** — Fully Qualified Name Standard as Analytics Layer Authoring Requirement. LOCKED — OS-wide elevation question deferred (D-31). Every business object, metric, field name, and dimension in the analytics semantic layer carries a fully qualified descriptive name. Generic nouns are not valid semantic layer terms. Examples: "Denial" → "First-submission claim denial." "Member" → "Attributed PPN member." "Date" → "Claim adjudication date." Enforcement: objects without a fully qualified name are returned before being added to the semantic layer. Analytics strategy enforces at definition; analytics engineering flags at build. Serves both humans and AI tools simultaneously. Connects to: Design & Communication Principles (3.1), Analytics Core Standards v1.0, D-31.

**160** — Analytics AI Consumption MCP Server Pattern Lock. LOCKED — tool set definition pending Build E design session. The analytics AI consumption interface is a dedicated MCP server following D-144 pattern: stateless, JWT-validated on every request, verb-noun tool naming, consistent response envelope, semantic versioning. Exposes governed semantic layer only — no raw table access. All queries logged with full provenance. Provisional tool set: query_metric, list_metrics, get_metric_definition, query_semantic_layer. Tool set to be locked in Build E design session. Blocks Build E SPEC stage. Connects to: D-144, D-147, D-155, Analytics Core Standards v1.0.

**161** — Analytics Capability Registry as OI Trust Feature. LOCKED — UC-28 design session required before Build E. The OI Trust maintains an Analytics Capability Registry alongside the AI Agent Registry. Tracks all Registered Analytics Capabilities at Automate and Product stage. Surfaces together in the OI Trust dashboard. Governed separately per D-158. Provisional registry fields: Analytics Capability name (fully qualified), Registry ID, Trust Division scope, stage, output type, semantic layer version, output logic version, data period lock status, named owner, stage advancement approval record, reproducibility baseline reference, last reproducibility test result and date. Connects to: D-156, D-157, D-158, UC-26, UC-28.

**162** — Performance Systems Builder Hire — Formal Proposal Opened. OPEN — pending Mike and Milind response. Phil formally proposed hiring a Performance Systems Builder to Mike and Milind by memo on 2026-03-11. Motivated by the analytics semantic foundation work — without this role, Phil carries the metric definition work directly as the analytics layer scales. Open items: internal candidate evaluation (Milind), organizational timing (Mike), role definition document to be authored through UC-08 once hire approved. Connects to: Terminology Register (PSB definition, Section 7), Analytics Core Standards v1.0, D-120, UC-08.

**163** — AI Production Governance Board name and scope confirmed. LOCKED. The governing body is named "AI Production Governance Board." Scope: all AI in production including agents and Analytics Capabilities. Stage advancement (Consult → Automate → Product) applies to both. Board governance role on Analytics Capabilities is a compliance check at Product stage only per D-158 — not the primary advancement authority. Connects to: Authority 1C, UC-14, UC-15, UC-16, UC-26, UC-28, D-158.

**164** — Delivery Cycle Build Report name confirmed as final. LOCKED. "Delivery Cycle Build Report" is the final confirmed name. Closes D-59/74 and D-74. Connects to: D-73, D-74 (resolved), UC-01, UC-22.

**Session 2026-03-29-A** | Embedded chat moved from Build A to Build B | Embedded chat removed from Build A scope. Home screen Chat card is a stub in Build A — present in UI per D-150, no chat skill or Vertex AI dependency wired. Fully implemented in Build B alongside OI Library approval workflow and translation layer. Removes ARCH-19 as Build A blocker; ARCH-19 now blocks Build B. Connects to: build-a-spec.md, master-build-plan.md, ARCH-19, D-150, D-153.

**Session 2026-03-29-B** | Division MCP rename | "Container MCP" (`container-mcp`) renamed to "Division MCP" (`division-mcp`) across all references. Tool names unchanged. Connects to: build-a-spec.md Section 5.2, architecture-notes.md, master-build-plan.md, D-134, D-144.

**Session 2026-03-29-C** | Unset-approver business rule | When no approver configured for an artifact type at a given Division: escalate to Division Owner; if no Division Owner set, escalate to Phil. Workflow never hard-fails on missing configuration. Build B spec must include approver configuration UI for admins. Connects to: D-65, D-66, D-94, UC-21, UC-02.

**Session 2026-03-29-D** | ARCH-19 moves to Build B blocker | Vertex AI model selection no longer blocks Build A. Blocks Build B finalization. Connects to: ARCH-19, Session 2026-03-29-A.

**Session 2026-03-29-E** | GCP account confirmed ready | Phil's personal GCP account ready. GCP setup removed from Build A blockers. Remaining Build A blocker: ionic.theme.map.scss designer confirmation. Connects to: build-a-spec.md Section 10.

**Session 2026-03-29-F** | Stage Track component contract locked | Full specification in design-communication-principles.md v1.2 Section 5.1. Stage nodes non-interactive. Gate nodes open gate record on click. StageTrackComponent is presentation-only Angular component. Two rendering modes: Full (detail views) and Condensed (dashboard rows). Build C: Full + Condensed for Delivery Cycle. Build B: applied to OI Library artifact detail. Connects to: ARCH-25, D-93, D-108, D-154.

**Session 2026-03-30-A** | RLS explicitly disabled | RLS (Row Level Security) is disabled in the Supabase project. JWT validation and Division-scoped access control live entirely in the MCP layer (D-93). Enabling RLS would add a second enforcement layer that conflicts with the MCP-only access rule and creates maintenance overhead with no security benefit in this architecture. This is not a deferral — it is an explicit architectural choice. Connects to: D-93, build-a-spec.md Section 2, CLAUDE.md.

**Session 2026-03-30-B** | Bulk Knowledge Seed supports multiple independent batches | The Bulk Knowledge Seed can be run as many times as needed — Batch A, then Batch B, then Batch C at any point in the future. Each batch creates independent artifact records with no dependencies on prior batches. The data model has no batch counter, no sequence dependency, and no carry-over state. Deduplication is a future consideration but not a current constraint. The ivfflat index on document_embeddings requires periodic maintenance as the table grows — operational note, not a build constraint. Connects to: build-a-spec.md Section 8, document_embeddings table.

**Session 2026-03-30-C** | CLAUDE.md produced; governing docs bootstrap mechanism deferred | CLAUDE.md authored for Build A and ready to commit to GitHub repo /docs/ folder. The ARCH-22 bootstrap mechanism cannot be implemented yet — OI Library does not exist. For Build A, CLAUDE.md points Claude Code directly at files in /docs/. Full ARCH-22 bootstrap mechanism wired when Build B ships the OI Library MCP. Four environment variable placeholders remain: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DOCUMENT_ACCESS_MCP_URL, DIVISION_MCP_URL — must be populated before Claude Code's first session. Connects to: ARCH-22, build-a-spec.md, CLAUDE.md.

**Session 2026-03-30-D** | MCP architecture stays in Build A; no deferral | A proposal to defer MCP servers to a later build was considered and rejected. The MCP-only architecture (D-93) is the portability guarantee. Retrofitting MCP after the fact means doing the migration work twice. The two MCP servers in Build A (document-access-mcp, division-mcp) are thin JWT-validating pass-through layers over straightforward queries. Build cost is low; retrofit cost is higher and introduces behavioral risk. Connects to: D-93, build-a-spec.md Section 5.

**Session 2026-03-30-E** | Engineering introduction: build sequence paused pending engineer onboarding | Build A infrastructure setup (GitHub repo, Supabase project, Render account) has not yet been created. Phil will introduce the engineer (Sandip managing, possible second engineer) on 2026-03-31. Build A does not start until after that session. Engineering introduction materials produced this session. Connects to: project-briefing.md Pending Actions, Build A blockers.

---

## RESOLVED (reference only — details in archive)

- D-79: Project as Foundation Object resolved. Project = Record+Lifecycle+Approval+Notification; Epic is a specialization. Resolved by D-80.
- D-35: Cloud Supabase confirmed. Resolved by D-92.
- D-79: Project as foundation object. Resolved by D-99 (Delivery Cycle Type field) and D-80 (Primitives).
- D-94-Accountable: Resolved by D-149.
- D-99/100/101/102/103: Superseded by D-107–110.
- D-IAS-Name: Administration Services Trust. Resolved by D-129.
- D-QPathways-Figma: Resolved by D-151/152.
- D-Tier2-Detail: Resolved by D-154.
- D-L2/L3: Service Line Division (L2), Function Division (L3). Interim pending Mike.
- D-59/74: Delivery Cycle Build Report name confirmed as final. Resolved 2026-03-13.
- D-74: Delivery Cycle Build Report confirmed as final name (not a working placeholder). Resolved 2026-03-13.
