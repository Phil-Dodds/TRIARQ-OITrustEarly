# Terminology & Context Register
Pathways OI Trust | v0.21 | March 2026 | CONFIDENTIAL

Status: CONFIRMED = Phil confirmed in session. PARTIAL = inferred, needs confirmation. NEEDS DEF = appeared but undefined — must ask before using.

---

## Internal Acronyms

**Emily** | CONFIRMED | HR Manager at TRIARQ. Reports to Katie (Controller). Owns HR Service Line Division under Administration Services Trust.

**GRICS** | CONFIRMED | Compliance standard (not a team name). Governs TRIARQ's compliance obligations alongside HITRUST. The "GRICS Cluster" (Authority 1D) refers to the group of people who work on Compliance, Risk, Security, and IT — not an acronym for a team.

---

## Systems and Tools

**Onspring** | CONFIRMED | Current home for company policies and training tracking. Bridge system — Phil's intent is to migrate to OI Trust long-term. Not a permanent architecture.

**ai.triarqpathways.com** | CONFIRMED | Mike's production platform. Angular + Native Federation host. MCP is the universal connectivity standard. OI Trust is built to merge into this platform at port time as a Native Federation remote.

**Cursor** | CONFIRMED | AI coding tool used by Capability Builders for Delivery Cycle execution. Part of TRIARQ's AI-First Delivery Framework.

**myQone** | PARTIAL | TRIARQ internal system. Referenced in container naming discussions — "practice group" terminology conflicts with Division naming. Full scope unclear.

---

## People (first-name references)

**Katie** | CONFIRMED | Controller. CEO direct report. Leads Administration Services Trust. Service Line Divisions: Finance & Accounting, Business Intelligence, Administrative Services, HR.

**Marko** | CONFIRMED | EVP Growth. CEO direct report. Leads Growth Trust. Scope: go-to-market for Pathways platform, practice acquisition, PPN growth, referral management wedge, market narrative for AI differentiation.

**Milind** | CONFIRMED | GM GCC (Global Capability Center) — India. Works under Pravin.

---

## Working Language

**Phil System / Phil System of Systems** | PARTIAL | Phil's informal term for the overall governance and management infrastructure he is building. Pathways OI Trust is the first formal component of this system.

**Check down with you** | CONFIRMED | Phil's phrase meaning "verify with you / confirm with you." Used when escalating or seeking approval.

**Domain team selection** | PARTIAL | Phil's phrase referring to the process by which Domain Strategists select and prioritize work for their Trust. Full process design TBD.

---

## Design Constraints (stated by Phil, not formal decisions)

**RAG destination requirement for policies and training** | CONFIRMED | Policies and training materials must be retrievable by agents via RAG. This is a design constraint on OI Library storage — policies and training are not just filed, they enter the agent consumption layer.

**Onspring as bridge, not permanent home** | CONFIRMED | Onspring holds policies and training now. It is explicitly a bridge. Architecture must support migration to OI Trust without requiring Onspring to remain.

---

## System Architecture Terms

**Alert Log** | CONFIRMED | Every employee has a visible in-system log of all notifications received — not just unread. Notifications persist until explicitly dismissed. Extension of Notification Primitive (D-80, D-94).

**Primitive / Targeted Use Case** | CONFIRMED | Primitive = one of eight configurable foundation capabilities (Record, Registry, View, Queue, Approval Workflow, Lifecycle, Trigger, Notification). Targeted Use Case = named surface of one or more primitives — what end users see. Primitives are not visible to users.

**Engineering Lead / Capability Builder** | CONFIRMED | Same role. Engineering Lead is the legacy term from earlier design sessions. Capability Builder is current TRIARQ OS terminology. Use Capability Builder.

**Mildred** | PARTIAL | Member of Phil's Security & Governance team. Pintal also on this team. Full roles unclear.

**Architecture Notes Running Log** | CONFIRMED | One of eleven canonical project documents. Records all technology stack, infrastructure, and build architecture decisions. Uploaded at each session start.

---

## Domain Roles

**Domain Strategist (DS)** | CONFIRMED | TRIARQ OS role. Owns the outcome statement and acceptance criteria for a Delivery Cycle. Counterpart to Capability Builder. Manages Context Brief, Technical Spec sign-off, and UAT.

**Context Engineer (CE)** | CONFIRMED | TRIARQ OS role. Manages OI Library content quality, taxonomy, and agent training data. Distinct from DS and CB.

**Performance Systems Builder (PSB)** | PARTIAL | Role referenced in Phil's authority structure. Builds and maintains performance measurement systems. Relationship to CB role unclear.

**Automation and Agent Lead** | PARTIAL | Role referenced in Foundry context. Leads agentic deployment work. May be Sagar or a report of Sagar's.

**Foundry / AI Foundry** | CONFIRMED | TRIARQ Foundry Trust. Led by Sagar. Responsible for agent development, deployment, and the Consult→Automate→Product progression. Receives OI Library Candidates from all Trusts for automation scope evaluation.

---

## System Design Terms

**Capabilities Equation** | CONFIRMED | Context + Organizational Intelligence + AI = Capabilities. The flywheel that connects all TRIARQ delivery work. Every Delivery Cycle must identify which variable it advances and its expected contribution.

**First Principles / TRIARQ System Design Principles** | CONFIRMED | Mike's five-step sequence: Context → Question → Reduce → Simplify → Automate. Called "First Principles" by Mike; "TRIARQ System Design Principles" in Phil's working context to signal it's organizational canon, not a personal habit.

**Consult → Automate → Product** | CONFIRMED | Three-stage AI maturity progression for deployed agents. Consult = human in decision loop on every output. Automate = circuit breaker required, per-agent data scope. Product = deterministic output validation, clinical safety checks, 7/10-year audit retention.

---

## Design Session A Terms

**Adjudicate** | CONFIRMED | The act of an Accountable party making the binding Approve/Decline decision on an artifact in an approval workflow. Once adjudicated, Consulted parties cannot change their advisory response (blocked per D-140).

**My Action Queue** | CONFIRMED | The personal queue showing all items requiring the user's response — both Accountable (binding decisions) and Consulted (advisory responses). Items persist until the user acts or explicitly dismisses.

**My Notifications** | CONFIRMED | The personal feed showing all Informed items. Distinct from Action Queue. Persists until user dismisses.

**Approve/Decline** | CONFIRMED | The two disposition options for both Accountable and Consulted roles in the approval workflow. UI makes advisory nature clear for Consulted: "Your response is advisory — the Accountable party makes the final decision."

**Allow both Admin and Functional Roles on this user** | CONFIRMED | Boolean setting on users table, default false. When false: system hard-blocks assigning both admin and functional roles to same account. Phil's bootstrap account = true (exception). Satisfies HITRUST separation of duties requirement.

**Document Viewer** | CONFIRMED | DocumentViewerComponent — the Angular side panel that opens when a user clicks a citation in embedded chat. Supports PDF, DOCX, MD, TXT. Read-only. Opens alongside chat (chat narrows, does not navigate away). Scrolls to relevant chunk if chunk_index available.

**Translation Layer** | CONFIRMED | System-managed process that fires when an artifact's lifecycle_status transitions to Canon. Generates embeddings via Vertex AI embedding model, writes chunks to document_embeddings table. Makes the artifact available to query_knowledge (agent consumption layer).

---

## Section 13 — New Terms (2026-03-11 Session)

**Analytics Capability** | PARTIAL — pending Mike terminology confirmation | Any governed analytics output drawing from the managed semantic data layer, at any stage of the three-stage maturity model (Consult, Automate, Product). Analytics Capabilities are the analytics expression of the Capabilities Equation. At Consult stage, no registration required. At Automate or Product stage, becomes a Registered Analytics Capability. Connects to: D-156, D-157, Capabilities Equation.

**Registered Analytics Capability** | PARTIAL — pending Mike terminology confirmation | An Analytics Capability formally promoted to Automate or Product stage, with a registry entry, named owner, stage advancement approval record, semantic layer version reference, output logic version reference, and data period lock status. Registration occurs at stage advancement, not at creation. Connects to: D-156, D-157, D-158, D-161, UC-28.

**Analytics Capability Registry** | PARTIAL — pending Mike terminology confirmation | The monitored register of all Registered Analytics Capabilities in the Pathways OI Trust. Tracks stage classification, ownership, versioning, lock status, reproducibility baseline, and stage advancement history for every Analytics Capability at Automate or Product stage. Surfaces alongside the AI Agent Registry in the OI Trust dashboard. Governed separately — see D-158. Connects to: D-161, UC-28, UC-26.

**Fully Qualified Name Standard** | CONFIRMED — scope elevation pending (D-31) | The requirement that every business object, metric, field name, and dimension in the analytics semantic layer carries a fully qualified descriptive name with no generic nouns. Enforced at definition time by analytics strategy and at build time by analytics engineering. OS-wide elevation pending (D-31). Connects to: D-159, Design & Communication Principles (3.1).

**Semantic Data Layer** | CONFIRMED | The governed layer of the analytics stack between raw dbt transformation models and all consumption surfaces. Encodes business object definitions, grain rules, business rules, and fully qualified field names per the Fully Qualified Name Standard. Every Analytics Capability draws from the semantic data layer. AI tools access it through the analytics AI consumption MCP server only. Connects to: D-159, D-160, Analytics Core Standards v1.0.

**Analytics AI Consumption MCP Server** | CONFIRMED — tool set pending | The dedicated MCP server exposing the governed semantic data layer to AI tools in the Pathways platform. Stateless, JWT-validated, verb-noun tool naming per D-144. All queries logged with full provenance. No raw table access. Tool set pending Build E design session. Connects to: D-160, D-144, D-147.

**Metric Definition Library** | CONFIRMED | The version-controlled, governed store of every approved metric definition that analytics engineering builds against. One entry per metric: fully qualified name, precise calculation, data source, grain, observation window, success threshold, named owner. No pipeline starts against a metric without an approved entry. Connects to: D-159, D-162, Analytics Core Standards v1.0.

**Data Period Lock / Period Close** | CONFIRMED | The point at which data for a completed reporting period is locked — cannot be changed without a formal reopening requiring Phil's approval and a documented reason. Locked-period data is prerequisite for Automate and Product stage Analytics Capabilities. Unlocked-period outputs carry a mandatory disclosure label. Connects to: Analytics Core Standards v1.0, D-157, D-158.

**Delivery Cycle Build Report** | CONFIRMED | The canonical record of what was actually built in a Delivery Cycle. Produced at the Go to Deploy gate (UAT). Synthesizes the Context Brief, Technical Specification, development changes, and examples. Supersedes the Context Brief upon canonization as the authoritative record of the Delivery Cycle. Submitted to the OI Library at Delivery Cycle close. Previously called "Epic Build Report" — retired 2026-03-13. Connects to: D-74 (resolved), D-73, UC-01, UC-22.

**AI Production Governance Board** | CONFIRMED | The board that approves and monitors all AI in production at TRIARQ — agents and Analytics Capabilities. Governs stage advancement (Consult → Automate → Product) for agents as primary authority. For Analytics Capabilities, plays a compliance check role at Product stage only — business owners are the primary advancement authority per D-158. Previously referred to as "AI Governance Board" — "AI Production Governance Board" is the confirmed name. Connects to: Authority 1C, D-163, D-158, UC-14, UC-15, UC-16, UC-26, UC-28.

---

## Section 14 — Validator Corrections (2026-03-13)

**Context Package** | CONFIRMED | The working knowledge artifact that travels with the Delivery Cycle. Supersedes "Source Pack" (D-128). Established as the first layer of the two-layer model (Context Package + Context Brief) per D-128. Contains the context and knowledge inputs that inform the Context Brief and Technical Specification. Status of two-layer model (D-Context-Brief-2Layer) pending Mike confirmation — the term itself is locked. Connects to: D-128, D-49, D-Context-Brief-2Layer.


---

## Section 15 — New Terms (2026-03-24 Session)

**Delivery Workstream** | CONFIRMED | A named team of Capability Builders with shared delivery accountability. Registry entry in the OI Trust with: workstream name, active/inactive status, home Division, named workstream lead, member list. Every delivery cycle is linked to one Delivery Workstream. Home Division pre-populates the Division field on the cycle but is overridable per cycle. The term 'workstream' signals stability and input→output delivery responsibility. Not called 'Build Team' (conflicts with Build stage name) or 'Capability Build Workstream' (too engineering-specific for all Divisions). Connects to: Session 2026-03-24-L, Session 2026-03-24-Q, ARCH-23.

**Go to Release** | CONFIRMED | The fifth named Delivery Cycle gate. Exits PILOT stage before RELEASE begins. Configured per Division per tier (admin-configurable per D-65/D-66). Triggers AI Production Governance Board review for Tier 3 cycles with agent or Analytics Capability deployment. Connects to: Session 2026-03-24-G, D-154, D-108.

**Bootstrap File** | CONFIRMED | The repo-resident file that serves as the entry point for coding agent session initialization. Contains the MCP endpoint reference only — not governing document content, document IDs, or version hashes. The coding agent reads it at session start to initiate a get_session_context MCP call that returns all governing documents for the current build cycle. Failure to retrieve governing documents results in a hard session pause. Connects to: Session 2026-03-24-K, ARCH-22.

**Provenance Record** | NEEDS DEF | The artifact that documents which coding agent produced changes, under which constraint file versions and AGENTS.md hash, at what point in time. Required for agent-generated changes to PHI-adjacent code under HIPAA Security Rule 45 CFR §164.312(b) per blueprint Section 2.4. Scope and OI Library artifact type status pending production approval checklist design session (D-36). Connects to: ARCH-22, D-36, D-49.


## Section 16 — New Terms (2026-03-25 Session)

**Scenario Journey** | CONFIRMED | A narrative walkthrough of the experience being improved, written from the human's perspective. Describes before and after states. Distinct from a formal use case — it is a grounded human story, not a structured requirement. Lives in the BRIEF stage artifact slot set as a Context Package input alongside the Context Brief. Previously referred to informally as "narrative use case descriptions." Scenario Journey is the confirmed platform label. Connects to: Session 2026-03-25-E, D-Context-Brief-2Layer, Context Package (Section 14).

---

## Section 17 — New Terms (2026-03-29 Session)

**Stage Track** | CONFIRMED | A compact horizontal lifecycle indicator rendered on record detail views and dashboard rows. Shows discrete stage nodes connected by a line, with four node states: Complete (filled, primary color), Current (filled, primary color, emphasized), Gate Pending (amber), Gate Blocked (error color), and Upcoming (outline only). Two rendering modes: Full (all stage and gate nodes with labels — used on detail views) and Condensed (gate nodes only — used on dashboard rows). Stage nodes are non-interactive — orientation only. Gate nodes open the gate record on click. Implemented as StageTrackComponent — a standalone Angular presentation-only component. Connects to: design-communication-principles.md Section 5.1, ARCH-25, D-108, D-154.

**Division MCP** | CONFIRMED | The MCP server responsible for Division hierarchy management, user creation and assignment, and role management. Server name: `division-mcp`. Previously named "Container MCP" — renamed Session 2026-03-29 to align with Division as the confirmed universal container primitive (D-134). Tool names unchanged. Connects to: Session 2026-03-29-B, D-134, D-144, build-a-spec.md Section 5.2.

## Section 18 — New Terms (2026-03-30 Session)

**RLS (Row Level Security)** | CONFIRMED | Supabase database feature that enforces access control at the row level. Explicitly disabled in the OI Trust — JWT validation and Division-scoped access control live in the MCP layer (D-93). Not a deferral; an architectural choice. Enabling RLS would add a second enforcement layer conflicting with the MCP-only access rule.

**Magic Link** | CONFIRMED | Supabase Auth's email OTP sign-in mechanism. A one-time sign-in link sent to the user's email. No password required. 30-day persistent session. Authentication method for all OI Trust users. Source: D-142.

**Translation Layer** | CONFIRMED | The automated process that fires when an artifact transitions to Canon lifecycle status. Generates vector embeddings via Vertex AI and writes chunked text to the document_embeddings table. Makes the artifact queryable via the query_knowledge tool on document-access-mcp. Only Canon artifacts are embedded — Candidate artifacts are not in the vector search index. Source: D-95, build-a-spec.md Section 5.1.
