# Deferred Items Register
Pathways OI Trust | v1.6 | March 2026 | CONFIDENTIAL

Items deferred from the Use Case Register — operational workflows, Jira-owned functions, or judgment-based activities that don't map cleanly to a system use case. Preserved for future mining.

---

## Cross-Cutting

**D-01** | Project Management | Deferred: Owned by Jira. Sprint management, task assignment, velocity tracking = Jira's function. OI Trust manages knowledge artifacts that come out of projects. Mining note: Epic is a specialization of a generic Project concept. If OI Trust models Epic as a specialization of a foundation-layer Project record (not hardcoded), it can govern any major effort through the same structure. D-01 may warrant retrieval pending D-79 design session.

**D-02** | Weekly Standup Submission Review | Deferred: Meeting cadence, not a system function. Mining note: "Show me everything submitted this week across all Trusts, pending my review" = dashboard/queue display requirement, not a separate use case.

**D-03** | Assist on Toughest Epics | Deferred: Judgment-based. Mining note: Phil already surfaces at Concept Review gate and UAT gate for every Tier 3 epic. Watch for whether a lightweight "flag for review" function on the cycle record is needed.

**D-04** | Monitor Priorities for Design Team | Deferred: Operational management. Mining note: If "priorities" = ordered backlog of context briefs or epics awaiting review, that's a queue ordering function within existing UC-02.

---

## IT

**D-05** | Monitor Projects (IT) | Deferred: Owned by Jira. Mining note: IT projects produce artifacts (infrastructure decisions, config standards, security patterns) that belong in the Trust. Same pattern as engineering delivery. Ensure UC-21 accessible to Jon Kramer's team.

---

## Security

**D-06** | Monitor Projects (Security) | Deferred: Owned by Jira. Mining note: Security projects produce policy updates, incident response patterns, config standards — high-value OI. May warrant "security knowledge capture" workflow analogous to UC-22 once foundation is proven.

**D-07** | Monitor Security KPIs | Deferred: Merged into UC-11 (Pathways Performance Review). Mining note: Security KPIs may need restricted visibility (Phil, Dennis, Pravin only). Flag as access control requirement when UC-11 is designed.

---

## RACI Design

**D-08** | RACI — Accountable Functional Definition | RESOLVED by D-149. Accountable = binding Approve/Decline. Workflow cannot advance without it. Can adjudicate before all Consulted respond.

**D-09** | RACI — Artifact Sub-Type Granularity | Open. Engineering OI Library, Policy OI Library, Domain OI Library likely need separate templates — but how granular? Mining note: Design test — if two sub-types always share the same RACI in practice, one template suffices. If they diverge even occasionally, separate templates needed. Linked to artifact type registry.

**D-10** | Consult → Automate → Product Tracker | Deferred: Separate lifecycle on agent records. UC-14, UC-15, UC-26 cover agent governance lifecycle. Mining note: When UC-26 is designed, C→A→P stage history should be a first-class view on agent record, not buried in approval history.

---

## Methodology

**D-11** | Mike's Response on Two-Layer Model (Context Package + Context Brief) | Deferred: Awaiting Mike response. Phil locked Context Package + Brief as two-layer model. Mike may confirm or modify. Mining note: If Mike disagrees, reconciliation needed. If he agrees, his skill files need updating.

**D-12** | Sprint vs. Delivery Cycle Terminology — Mike Alignment | Deferred: "Delivery Cycle" locked for OI Trust. Mike's skill files still say "sprint." Mining note: "Delivery Cycle" is duration-neutral — may land well if presented with flywheel connection.

---

## Infrastructure

**D-23** | Render Service Account Credential Pattern | Deferred: JSON key as env variable vs. Workload Identity Federation — resolve before Render deployment. Does not block Build A (local dev only now).

---

## Locked Decisions (accuracy)

**D-24** | Decision 119 Conflict with Phil's Recollection | Deferred: D-119 locked text may conflict with Phil's intent. Phil confirmation required before amending. Mining note: If Phil's recollection is correct, D-119 needs amendment and PCP skill files should be reviewed.

**D-31** | Fully Qualified Name Standard — Analytics-Specific vs. OS-Wide Elevation | Category: Terminology / OS architecture | Deferred: The standard was designed as an analytics semantic layer authoring requirement. It is directly parallel to Design & Communication Principles rule 3.1. Whether it should be elevated as an OS-wide standard applying to all terminology, schema, and semantic work was not resolved. Mining note: If elevated OS-wide, becomes a named standard in the Pathways OS and requires a coherence review of all canonical document terminology. Add to Mike OS review session agenda.

**D-32** | Blueprint-to-OI Library and Delivery Cycle Connection | Category: Architecture / OS implementation | Deferred: The AI-First Blueprint OS Alignment Review and Context Brief from the 2026-03-09 session route to Mike as Decision Required. Mike review session is still pending. Implementation cannot be designed until Mike's review confirms which components are requirements, conflicts, or new concepts. Mining note: Post-Mike-review agenda: (1) submit confirmed blueprint standards to OI Library via UC-21 as Standards Document artifact types, (2) open Delivery Cycles for confirmed implementation requirements, (3) design blueprint implementation tracking view in OI Trust dashboard.

**D-33** | Analytics Capability Registry — Separate vs. Extended UC-26 | Category: Architecture / Use case design | Deferred: The Analytics Capability Registry (UC-28) is structurally parallel to the AI Agent Registry (UC-26). Whether these should be one unified registry with a type field or two separate registries with a unified dashboard view was not resolved. Mining note: Governance authorities differ (D-158 vs. D-116), suggesting separate registries with unified dashboard view. Schema implications need design session before Build E SPEC. D-145 (two-tier artifact type model) may apply if unified.

**D-34** | "Phil" Role → "EVP, Performance & Governance" Rename | Category: Port / Role model | Deferred: The system is built with "Phil" as a named role (D-136). At port time this should be renamed to "EVP, Performance & Governance" to make it position-based rather than person-based, so the role transfers correctly if the position changes hands. No design impact on current build — pure rename. Mining note: affects user table, role enum, all UI references to the Phil role, and any documentation that names the role explicitly.

**D-35** | Engineering Governance Standards Delivery Mechanism to Claude Code | Category: Architecture / Engineering tooling | Deferred: D-52 locks that engineering governance standards are governed OI Library artifacts. How those governed standards surface to Claude Code and engineers at build time — whether through CLAUDE.md inclusion, a dedicated MCP tool, or another mechanism — was not resolved. Mining note: resolve before Build C or D when engineering tooling integration is in scope. Current state: ENGINEERING_PRINCIPLES.md exists as a repo file; the governed version in OI Library is the authoritative source but the bridge between the two is undefined.

---

## Delivery Cycle Governance

**D-36** | Production Approval Checklist for AI-First Delivery Cycles | Category: Delivery Cycle governance / gate design | Deferred: Requires dedicated design session. Current gate content (D-49) predates AI-first build model. Checklist must cover: provenance record requirements, bootstrap verification log confirming current governing documents loaded at session start, constraint file version locking on the cycle record, AI Production Governance Board checklist at Go to Release for Tier 3 cycles with agent or Analytics Capability deployment. Engineering leads input needed before finalizing. Mining note: Feeds Go to Deploy and Go to Release gate content directly. Priority: complete before engineering leads package is finalized.

**D-37** | Approval Authority for Engineering Governance Artifact Types in OI Library | Category: Governance configuration | Deferred: Engineering leads not yet introduced to OI Trust. Named approvers for engineering governance artifact type changes expected to be engineering leads — not Phil per-item. Phil is governance oversight, not per-item approver. Lock after engineering leads session when named approvers are confirmed. Mining note: Consistent with D-65/D-66 — configuration decision, not structural.

**D-38** | Decision Registry | Category: New platform module / Build sequence | Deferred: Requires dedicated design session. Own build cycle — not folded into Build C. Integration with Delivery Cycle is a linking relationship (optional FK on decision record), not a structural dependency. What is known: tracks "big" decisions needing team and wider awareness (strategic, technology, staffing, operational — all types). Each decision maps to a primary Division. Dashboard: decisions per domain, rolled up under filtered parent division. Status lifecycle (minimum): Pending → Made, Cancelled. Delivery Cycle link: optional, one primary cycle at launch, many-to-many broadened later. RACI on every decision: Accountable (documents the result) and Consulted/Informed at minimum. Phil's governance role surfaces through RACI — not a separate mechanism. User actions: add, modify, update, mark made, cancel, remove. Visible on Delivery Cycle detail view when linked. Separate decisions dashboard per domain. Core intent: surface implicit decisions teams are treating as assumed; create lightweight escalation-awareness forcing function. Low friction to create is a design requirement — if logging feels like filing a form it won't be used. Nudge mechanism: system-triggered prompts at stage transitions — not passive automated detection (outside OI Trust scope without communication channel access). Open design questions: full status lifecycle; category taxonomy (free-form vs. fixed vs. none); escalation signal design; notification behavior (ties into Build D); whether made decisions are OI Library candidates; build sequence slot (new cycle after F, or G inserted between existing cycles). Mining note: Decision Registry, RACI, and Delivery Cycle together form the governance visibility layer across all nine Trusts — OI Trust as the surface where accountability is made visible, not just enforced through gates.
