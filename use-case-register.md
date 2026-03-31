# Use Case Register — Summary
Pathways OI Trust | v1.1-summary | March 2026 | CONFIDENTIAL

Format: UC number, title, group, status, primitives, one-line scope. Full journey narratives in use-case-register-full.md — load only when designing that UC.

---

## Scoring Guide
Build First = Importance − Complexity penalty. High importance + low complexity = build first.

---

## Group A — OI & Context Flow

**UC-01** | Delivery Cycle Initiation & Context Brief Flow | Status: Designed (Option 1 locked) | Primitives: Record, Lifecycle, Approval Workflow, Queue, Trigger, Notification | DS initiates Delivery Cycle, attaches artifacts, submits Context Brief through approval, produces Tech Spec, builds, and closes with Build Report submitted to OI Library.

**UC-21** | Standalone OI Library Submission | Status: Designed (Option 1 locked) | Primitives: Record, Approval Workflow, Queue, Trigger, Notification | Any user submits any artifact type to OI Library at any time; RACI-configured approval routes to correct approver and destination.

**UC-22** | Project-Close Knowledge Capture | Status: Designed (Option 1 locked) | Primitives: Trigger, Record, Approval Workflow | System detects COMPLETE stage, presents structured reflection prompt pre-populated from cycle record, user selects items → routes into UC-21.

**UC-02** | OI Library Review & Approval (Phil's Queue) | Status: Designed | Primitives: Queue, Approval Workflow, Notification | Phil reviews pending submissions with SLA clock visible; approves or returns with feedback.

**UC-03** | OI Library Search & Retrieval (Human) | Status: TBD | Primitives: View, Record | Users search and browse the OI Library by folder, tag, type, status.

**UC-04** | OI Library Canonization & Versioning | Status: TBD | Primitives: Lifecycle, Record, Trigger | Artifacts promoted to Canonical status; translation layer fires; versioning and supersession managed.

---

## Group B — Delivery Cycle Management

**UC-05** | Delivery Cycle Review & Approval | Status: TBD | Primitives: Queue, Approval Workflow, Notification | Gate approvals at Go to Build, Go to Deploy, Close. NOTE (Session 2026-03-24): Delivery Workstream is a required field on every delivery cycle. Gate advancement blocked by business rules MCP when assigned workstream is inactive. Primitives mapping updated to include Registry (Delivery Workstream registry). See Session 2026-03-24-L, Session 2026-03-24-Q, ARCH-23.

**UC-06** | Delivery Cycle Build Report | Status: TBD | Primitives: Record, Approval Workflow, Trigger | Build Report produced at Go to Deploy gate; submitted to OI Library.

**UC-07** | Delivery Cycle Summary / Jira Sync | Status: TBD | Primitives: View, Trigger, Record | System receives summary data from Jira; Delivery Cycle record updated.

---

## Group C — Performance & Metrics

**UC-08** | KPI Definition & Tracking | Status: TBD | Primitives: Registry, View, Trigger | KPIs defined, tracked, and surfaced per Trust.

**UC-09** | Trust-Level Metric Sets | Status: TBD | Primitives: View, Registry | Metric sets per Trust as performance architecture frame. (D-120 — pre-archive decision; full text in retired .docx archive)

**UC-10** | Financial KPI Management (Katie/Admin Services) | Status: TBD | Primitives: Registry, View | Finance KPIs owned by Administration Services Trust.

**UC-11** | Pathways Performance Review | Status: TBD | Primitives: View, Record, Queue | Monthly performance review across Trusts including security KPIs (D-07 merged here — pre-archive decision; full text in retired .docx archive).

---

## Group D — Container & Access Management

**UC-20** | Container / Trust Division Setup | Status: Build A | Primitives: Record, Registry, Lifecycle | System Admin creates Division hierarchy, creates users, assigns roles and Division memberships.

---

## Group E — Governance & Compliance

**UC-12** | HITRUST Control Management | Status: TBD | Primitives: Registry, Record, Approval Workflow, Lifecycle | HITRUST controls tracked, evidence attached, review managed.

**UC-13** | Risk Register | Status: TBD | Primitives: Registry, Record, Lifecycle, Notification | Risk items tracked with owner, status, mitigation.

**UC-14** | AI System Registry | Status: TBD | Primitives: Registry, Record, Lifecycle | Agent registry entries created and maintained per AI Production Governance Board requirements.

**UC-15** | AI Stage Advancement (Consult → Automate → Product) | Status: TBD | Primitives: Lifecycle, Approval Workflow, Queue | Formal approval process for advancing an agent to next AI stage.

---

## Group F — Policy, Training, Standards

**UC-17** | Company Policy Register | Status: TBD | Primitives: Registry, Record, Lifecycle, Approval Workflow | Company policies managed with approval, version control, distribution.

**UC-18** | Training Tracking | Status: TBD | Primitives: Registry, Record, Trigger, Notification | Training completion tracked per employee.

---

## Group G — Product & Support Knowledge

**UC-19** | Product Knowledge Article Management | Status: TBD | Primitives: Record, Lifecycle, View | Support and product knowledge articles authored, reviewed, published.

---

## Group H — Embedded Chat & Agent Consumption

**UC-16** | Embedded Chat (OI Library Q&A) | Status: Build A | Primitives: View, Record (via Document Access MCP) | Authenticated users ask questions; chat skill calls query_knowledge, assembles grounded answer with citations; viewer side panel on click.

---

## Group I — Agent Operations

**UC-26** | Agent Operational Monitoring | Status: TBD | Primitives: View, Registry, Notification | Live monitoring of deployed agents — stage, health, usage. C→A→P stage history as first-class view.

---

## Group J — Standards & Capability Governance

**UC-23** | Standards Framework Management | Status: Placeholder | Primitives: TBD | TBD.
**UC-24** | Analytics Capability Standards | Group: J — Standards, Frameworks & Capability Governance | Status: Designed — full design in Analytics Core Standards v1.0 (2026-03-11) | Primitives: Record, Lifecycle, Approval Workflow, Registry, Notification | Sam's analytics strategy function owns cross-domain Analytics Capability standards, the semantic data layer design, the Analytics Capability Registry, and the metric definition library under Phil's Performance authority. This use case governs how Analytics Capabilities are defined, built, registered, advanced through stages, and monitored. Routes to Build E. Depends on: UC-21, UC-20, UC-26.
**UC-25** | TBD | Status: Placeholder | Primitives: TBD | TBD.

---

## Group K — Bulk Operations

**UC-27** | Bulk Knowledge Seed | Status: Build A | Primitives: Record, Lifecycle, Trigger, Notification | Batch upload with form-level defaults, Seed Review lifecycle state, batch approval, directory import with folder structure mapping. (D-105/106 — pre-archive decisions; full text in retired .docx archive)

**UC-28** | Analytics Capability Registry and Stage Monitoring | Group: F — AI Governance | Status: Designed — requires dedicated design session before Build E SPEC (ARCH-20, ARCH-21 must be resolved first) | Primitives: Registry, Lifecycle, Approval Workflow, Trigger, Notification | OI Trust maintains and surfaces an Analytics Capability Registry tracking all Registered Analytics Capabilities at Automate and Product stage. Stage advancement routes through governance authority model per D-158. Surfaces alongside AI Agent Registry in dashboard. Depends on: UC-20, UC-21, UC-24, UC-26.
