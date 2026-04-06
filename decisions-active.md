# Design Decisions — Active
Pathways OI Trust | v3.7-active | March 2026 | CONFIDENTIAL

Active = operative locked decisions + open decisions. Superseded decisions are in decisions-archive.md.

---

## OPEN DECISIONS

**D-162** — Performance Systems Builder hire — pending Mike and Milind response.
| impl_status: unspecced |

**D-156–161 terminology** — Analytics Capability terminology set pending Mike confirmation.

**D-94-Granularity** — RACI template granularity — does artifact sub-type need separate templates (e.g. Engineering OI vs Policy OI)? Linked to artifact type registry.

**D-18** — Performance measurement system scope — new UC section in OI Trust or separate system?
| impl_status: unspecced |

**D-55/56** — System name 'Pathways OI Trust' and OI definition extension — pending Mike review session. See locked Decisions 55 and 56 for full rationale.

**D-Policy-Migration** — Onspring migration plan and timing.

**D-Context-Brief-2Layer** — Context Package + Brief as two-layer model — awaiting Mike confirmation.

**D-Mike-Terminology** — Present Delivery Cycle and OI Library terms to Mike for alignment.

**D-Concept-Funnel** — Idea and Selected stages deferred from Decision 108. Pre-cycle intake process for future.

**D-OI-Library-Tool** — Knowledge base tool for product knowledge management (UC-19).

**D-Pathways-Connect** — Pathways Connect as own Trust or under Performance Trust. Pending org structure.

**D-Vertex-AI-Model** — Vertex AI model selection: which Gemini model for embedded chat; which embedding model for pgvector. Blocks embedded chat skill finalization and document_embeddings vector dimension. Source: Decision 148. (ARCH-19 open)

**D-24** — Decision 119 text conflicts with Phil's recollection of intent. Pending Phil confirmation before amending.
| impl_status: unspecced |

**D-36** — Production approval checklist for AI-first delivery cycles — pending dedicated design session before engineering leads package is finalized.
| impl_status: unspecced |

**D-37** — Approval authority for engineering governance artifact types in OI Library — pending engineering leads session; engineering leads expected to be named approvers, not Phil per-item.
| impl_status: unspecced |

**D-38** | Decision Registry — new platform module. Pending dedicated design session. See deferred-items.md.
| impl_status: unspecced |

---

## WORKING PRINCIPLES — Foundational (Tenant-Level OI)

These principles apply to every effort, not just this system.

**P1** — Self-Clarifying Labels. Every field, schema column, and UI label must include enough context to be unambiguous without relying on surrounding context. Add the clarifying adjective before the noun whenever the label would otherwise be ambiguous in isolation. Anti-pattern: date, status, type, name, id. Applied: org_tenant_id, submission_date, lifecycle_state, oi_type, artifact_display_name, detection_date, target_resolution_date. Applies to: database schema, API field names, UI labels, report column headers, all explanatory language produced in this project. Connects to: Design & Communication Principles (3.1 — No Bare Generic Nouns), D-159 (Fully Qualified Name Standard — analytics layer extension of this principle).
| impl_status: unspecced |

**P2** — Progressive Disclosure. Lead with the simplest, most essential concept. Allow complexity and detail to unfold only as needed and only for the audience that needs it. The full picture is always available — but it is never the starting point. Anti-pattern: email that opens with schema decisions, UI that surfaces every data field as equally important, explanation that starts with edge cases. Note: Phil engages with full complexity directly and will flag if this principle is over-applied. Connects to: Design & Communication Principles (2.1 — Lead With the Point).
| impl_status: unspecced |

**P3** — TRIARQ First Principles of System Design. The five-step methodology applied to every system, process, org change, agent design, and document before building: Context (full picture: domain, stakeholder, data, the why) → Question (challenge assumptions, ask why, assume it can be done differently) → Reduce (strip to essence, remove what does not need to exist) → Simplify (make what remains as clean as possible; outcome statement lives here) → Automate (only then, automation and AI on the simplified, essential process). Operationalized as TRIARQ's structured methodology. Apply as a review gate before locking the full plan. Connects to: Design & Communication Principles (1.1), D-119.
| impl_status: unspecced |

---

## LOCKED DECISIONS — OPERATIVE

### UX and Navigation Principles

**D-163** — Workflow Entry Point Completeness. Every user-facing function must be reachable from exactly one declared entry point: sidebar nav item (user-initiated, persistent), home page card (role-relevant summary), or action queue / notification (system-triggered). A feature with no wired entry point is incomplete regardless of whether the route and component exist. Admin functions are never standalone sidebar links — they belong in the Admin hub (D-164). Entry point role arrays must include every permitted role. Full principle in docs/design-principles.md. Triggered by: Build C Delivery Cycle Tracking nav gap (sidebar restricted to ds/cb, excluding Phil; home card was non-functional stub). | Source: Claude Chat | April 2026 |
| impl_status: unspecced |

**D-164** — Admin Hub Consolidation. All administrative functions are grouped under a single Admin hub at `/admin`, accessible via one sidebar entry for `['phil','admin']` roles. The hub renders a card grid — one card per admin function. No admin sub-function appears as a direct sidebar link. Admin sub-routes (`/admin/workstreams`, `/admin/divisions`, `/admin/users`, etc.) remain stable as functions are added. Each hub card follows Principle 3 (Visible Context) — states what the function does and why. Full principle in docs/design-principles.md. | Source: Claude Chat | April 2026 |
| impl_status: unspecced |

**D-165** — Workstream Optional at Cycle Creation, Required at Brief Review Gate. `workstream_id` is recommended but not required when creating a Delivery Cycle. Rationale: at initial scoping (Brief stage), the owning workstream may not yet be known. By Brief Review — the first governance gate — the workstream must be assigned because it determines delivery team accountability and gate clearance eligibility. MCP enforcement: `create_delivery_cycle` accepts null workstream_id; `submit_gate_for_approval` blocks ALL gates when workstream_id is null, with D-140 message directing user to assign one. Schema: migration 024 makes `workstream_id` nullable. | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-166** — Division Filter on Delivery Cycle Dashboard. The dashboard has a server-side Division filter showing the user's directly-assigned Divisions. An "Include child Divisions" checkbox expands the query to descendant Divisions when a specific Division is selected. Filter only rendered when user has more than one directly-assigned Division. MCP: `list_delivery_cycles` accepts `division_id` + `include_child_divisions` params; child resolution uses recursive descendant collection mirroring D-135. Known gap: the default unfiltered dashboard view uses direct `division_memberships` only and does not apply D-135 inheritance — fixing this globally is Build D scope. | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-167** — Workstream Filter: No-Workstream and Inactive as Separate Options. The Workstream filter dropdown has three distinct groups: (1) "No workstream assigned" — cycles with null workstream_id; (2) Active workstreams; (3) Inactive workstreams, labelled "(inactive)". These are never merged. No workstream = expected early-scoping state. Inactive workstream = blocked gate condition. Merging them would hide blocked-gate visibility from users filtering for blank cycles. | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-168** — Claude Code Mandatory Debate and Question Behavior. Before implementing any design change, architectural choice, or feature containing ambiguity, conflict with a locked decision, or a design choice Claude disagrees with, Claude Code must explicitly raise the issue, state its position, and present the conflict or question before writing any code. Silent resolution of conflicts is a hard build error equivalent. Applies to: (1) design choices Claude disagrees with — state the disagreement and rationale; (2) requirements that are unclear — ask before building, not after; (3) requests that conflict with locked decisions — surface the conflict explicitly; (4) implementation paths with multiple valid approaches that carry different trade-offs — present the options. This behavior is mandatory in all Claude Code sessions for this project. Full principle in docs/design-principles.md Principle 6. | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-170** — Phil and Admin Have Implicit Access to All Divisions. Users with system_role of 'phil' or 'admin' are not required to have explicit Division membership assignments. They have read and governance access to all active Divisions in the system. Rationale: Phil governs the entire trust; Admin manages the system. Restricting their access to only assigned Divisions creates a bootstrapping problem (who assigns Phil?) and a coverage risk (a Division without a membership assignment becomes invisible). Implementation: (1) `get_user_divisions` MCP tool returns all active Divisions for phil/admin roles, tagged `access_type: 'privileged'`; (2) Angular home component skips the division membership check for phil/admin and sets `hasDivision = true` directly; (3) Dashboard `checkUserDivisions()` short-circuits for phil/admin; (4) Dashboard division filter uses `filterDivisionOptions` getter which returns all loaded divisions for phil/admin and directly-assigned divisions for other roles. `list_delivery_cycles` already handled this correctly (isPrivileged check). | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-169** — Decision Source Tagging and Registry Protocol. Every decision record in decisions-active.md includes a source tag: `| Source: Claude Code | [date] |` or `| Source: Claude Chat | [date] |` or `| Source: Design Session | [date] |`. The authoritative master list of all allocated decision numbers is `docs/decision-registry.md`. This file includes a "Next available" field at the top. Claude Code reads the registry before allocating any new D-number and updates the "Next available" field in the same commit. Claude Chat checks the registry file and states the number it is claiming; Phil asks Claude Code to commit and update in the next code session. If Claude Code finds a number collision, it claims the next available number, adds a COLLISION note in the registry, and surfaces the conflict to Phil. Purpose: distinguish Claude Code-originated vs Claude Chat-originated decisions to enable collision detection and reconciliation without archaeology. Full protocol in docs/decision-registry.md. | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-171** — Delivery Cycle Tracking Hub Page. The `/delivery` route renders a hub page with four option cards. No data is loaded at the hub level — the hub is purely navigational. The four options are: Workstream Summary (`/delivery/workstreams`), Division Summary (`/delivery/divisions`), Upcoming Gate Summary (`/delivery/gates`), and All Delivery Cycles (`/delivery/cycles`). The hub page answers Principle 3 (Visible Context) for each view: what it shows, why it is useful, and how to get started. Users select the view that matches their current question before any data loads. | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-172** — Delivery Module Sub-Routes. The Delivery feature module uses the following sub-routes under `/delivery`: (1) `/delivery` → DeliveryHubComponent (hub, no data); (2) `/delivery/workstreams` → WorkstreamSummaryComponent; (3) `/delivery/divisions` → DivisionSummaryComponent; (4) `/delivery/gates` → GatesSummaryComponent; (5) `/delivery/cycles` → DeliveryCycleDashboardComponent (the "big list" view, moved from the former root `/delivery` path to this sub-path); (6) `/delivery/:cycle_id` → DeliveryCycleDetailComponent. Named sub-routes are declared before the `:cycle_id` param route to avoid routing conflicts. The sidebar still links to `/delivery` (the hub). | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-173** — Next Gate Derived from Current Lifecycle Stage. The "next gate" a cycle must clear is determined by its current lifecycle stage, not by querying gate_records. Mapping: BRIEF → brief_review; DESIGN, SPEC → go_to_build; BUILD, VALIDATE → go_to_deploy; PILOT, UAT → go_to_release; RELEASE, OUTCOME → close_review; COMPLETE, CANCELLED, ON_HOLD → null (no next gate). This mapping is defined in `lifecycle.js` as `NEXT_GATE_BY_STAGE` and shared by the `get_delivery_summary` MCP tool and the Angular dashboard component. Used for: gate summary grouping, workstream gate counts, and the "Next Gate" filter on the cycles list. | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-174** — WIP Categories and Limit. Work-in-progress (WIP) is measured per workstream in three categories: Prep (stages BRIEF, DESIGN, SPEC), Build (stages BUILD, VALIDATE), and Outcome (stages PILOT, UAT, RELEASE, OUTCOME). WIP limit per category per workstream is 4. COMPLETE and CANCELLED cycles are excluded from WIP counting entirely. ON_HOLD cycles are included in WIP counting (they occupy a slot even when paused — the constraint is intentional). WIP exceeded = category count > 4; displayed as an amber warning in the Workstream Summary view. WIP constants defined in `lifecycle.js` as `WIP_CATEGORY_BY_STAGE` and `WIP_LIMIT`. | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-175** — Drill-Down from Summary Views to Cycle List. Clicking on a summary row or count in the Workstream Summary, Division Summary, or Gate Summary views navigates to `/delivery/cycles` with filters pre-applied as Angular Router query parameters. Supported params: `workstream_id` (string — pre-selects workstream filter), `division_id` (string — pre-selects division filter and triggers server reload), `next_gate` (GateName string — pre-selects next gate filter). The cycle list reads these params on init via `ActivatedRoute.queryParams` and applies them as initial filter values before loading. This satisfies D-163: every summary count is drillable with no dead ends. | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-177** — Entity Name Capitalization in UI Text. In all user-facing text — labels, descriptions, empty states, error messages, button text, and tooltips — named entities in the system are capitalized: Division, Workstream, Delivery Cycle, Gate, Artifact, OI Library. General-purpose nouns that describe the same concepts are not capitalized (e.g., "a delivery cycle" in an explanatory sentence that is defining what a Delivery Cycle is). The principle: if you could substitute the entity name for a label in the product (e.g., "View all Delivery Cycles"), capitalize it. If it is a conceptual explanation ("a delivery cycle is a unit of work"), use lower case. Applies to: all Angular component templates, all error messages, all empty states, all loading states, all hub card descriptions, and all MCP error messages returned to the UI. Does not apply to: TypeScript variable names, database column names, MCP parameter names (those follow existing naming conventions). | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-178** — Processing State Standard: Three-Tier Loading Pattern. All MCP calls, queries, and transactions must display a loading indicator appropriate to the operation type. Lazy omission of a loading state is a build error, not a style preference. Three mandatory tiers: Tier 1 — Skeleton screen for data loads (tables, lists, cards). Rendered as `ion-skeleton-text` rows matching the expected content layout with animated shimmer. Replaces all "Loading…" text states. Appears immediately; replaced by content on arrival. Tier 2 — Button spinner for inline actions (save, toggle, submit individual field). `ion-spinner name="crescent"` replaces button label; button is `[disabled]="true"` during processing. No overlay. Rest of form remains operable. Tier 3 — Section overlay for CRUD operations (create, full form save, delete, gate action). Semi-transparent overlay covers the active form or panel via `LoadingOverlayComponent` (`position:absolute;inset:0;background:rgba(255,255,255,0.8)`). Centered spinner and one-line operation label visible within overlay. Sidebar and other panels remain interactive. Overlay lifts on success or error. Error appears within the form — overlay does not persist on error. Async card loading (dashboard, summary views) uses Tier 1 scoped to the card; other cards and sidebar remain interactive. Sidebar is never locked during any tier. Completion feedback: operations completing in <3 seconds receive in-form success/error feedback only. Operations exceeding 3 seconds where the user may have navigated away emit an `ion-toast` on completion (bottom of screen, auto-dismiss 4 seconds). Toast is not used for routine fast operations. Shared implementation: `LoadingOverlayComponent` (standalone, OnPush) at `/shared/components/loading-overlay/loading-overlay.component.ts` provides Tier 3. Tier 1 uses `ion-skeleton-text` directly in templates. Tier 2 uses `ion-spinner` inline in button templates. All three tiers applied at build time — not deferred as retrofits (Rule 8). | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-179** — Stage Regression Gate Reset Rule. When a Delivery Cycle stage is reversed to a prior stage, every gate that guards entry to a stage between the target stage and the current stage (target exclusive, current inclusive) is reset to status 'pending'. Fields cleared on reset: actual_date, approved_by, approver_notes, workstream_active_at_clearance. This allows the gate workflow to be re-run from the regressed position. The user receives a preview of the target stage and the list of gates that will be reset before confirming; the regression does not execute until the user confirms (two-call pattern: first call returns warning data, second call with confirmed=true executes). This pattern is universal — it applies to all gates, not just the immediately adjacent one. No gate record is hard-deleted during regression. The event log records which gates were reset and which user initiated the regression. Implementation: reverse_cycle_stage MCP tool in delivery-cycle-mcp; prevStage() and gatesResetOnRegressionTo() helpers in lifecycle.js. Cannot regress from BRIEF (no prior stage), CANCELLED, or ON_HOLD. Connects to: D-108, ARCH-12. | Source: Claude Code | April 2026 |
| impl_status: unspecced |

**D-176** — Division Summary as Flat Indented List. The Division Summary view renders divisions as a flat indented list (not a collapsible tree). Indentation is determined by `division_level` (each additional level = 20px left padding relative to level 1). Divisions are displayed in tree order: parent before children, siblings sorted alphabetically. Rationale: collapsible trees add interaction cost with no scanning benefit for the current Division depth (typically 2–3 levels). A flat indented list is scannable without interaction. Each row shows: division name (indented), active cycle count, and a click target navigating to `/delivery/cycles?division_id=X`. | Source: Claude Code | April 2026 |
| impl_status: unspecced |


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
| impl_status: unspecced |

**[Session 2026-03-18 — Decision B]** — Delivery Cycle Date Commitment Purpose. Target dates in the Delivery Cycle are a team alignment and communication tool — not project management overhead and not a governance tracking mechanism. Four purposes: (1) Team commitment — a team that cannot name a date has not finished planning; the act of setting the date is itself valuable. (2) Planning and alignment forcing function — setting the date requires the team to reason through what reaching the next gate demands; gaps surface during planning, not after the miss. (3) Divergence as signal — materially different dates proposed by a Domain Strategist and Capability Builder indicate misaligned scope, competing commitments, or insufficient context; the negotiation reveals the real problem early. (4) Upward communication without upward management — Phil, Sabrina, and development leaders see where teams are pointed without having to ask; under-directed or under-resourced teams self-report through their dates or through the absence of them. This purpose statement constrains implementation: any date feature that adds overhead without serving one of these four purposes should not be built. Connects to: D-154, D-108, D-124.
| impl_status: unspecced |

**[Session 2026-03-18 — Decision C]** — Close Review Gate Name. The fourth named gate is renamed from "Close" to "Close Review." Close Review names the act of review at that passage point — the demonstrated outcome is reviewed before the cycle completes — consistent with Brief Review. The four confirmed gate names are: Brief Review, Go to Build, Go to Deploy, Close Review. Supersedes "Close" as the fourth gate name everywhere it appears in canonical documents. Connects to: D-154, D-108, Session 2026-03-18 Decision A.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision A]** — Delivery Cycle Dashboard Date Field State Model. Each date column on the Delivery Cycle dashboard row operates in one of three display modes determined by whether an actual date has been recorded. Commitment mode: actual_date is null — show target date with upcoming/overdue logic applied (overdue = today exceeds target date, displayed in Oravive; upcoming = 4 or fewer days remaining, displayed in Sunray). Achieved mode: actual_date is populated and actual_date ≤ target_date — show actual date, label as "Actual," neutral color treatment. Missed mode: actual_date is populated and actual_date > target_date — show actual date, label as "Actual," muted overdue color treatment. Urgency indicators (Sunray/Oravive) apply only in Commitment mode. Overdue state suppressed on cycles in COMPLETE or CANCELLED lifecycle stage. Connects to: ARCH-15, D-108, Session 2026-03-24-B, Session 2026-03-24-E.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision B]** — Delivery Cycle Dashboard Milestone Date Columns. The two persistent date columns on the Delivery Cycle dashboard row are Pilot Start Date and Production Release Date. Pilot Start Date corresponds to Go to Deploy gate clearance. Production Release Date corresponds to Go to Release gate clearance. Each column is always present at a fixed position on the dashboard row. When not yet set, the column is blank — no placeholder text. No rules govern when these dates must be set. Gate dates (all five) are visible on the cycle detail view, not the dashboard row. Connects to: D-108, D-154, ARCH-15, Session 2026-03-24-A, Session 2026-03-24-E, Session 2026-03-24-G.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision C]** — Dashboard Headline as Intelligent Summary Text. The Delivery Cycle dashboard row displays a headline text field — not a grid of date cells — that answers: what does someone need to know right now about where this cycle is going? Display logic: (1) Pre-pilot, no pilot target set: next gate name and target date. (2) Pre-pilot, pilot target set: next gate name and date plus pilot target date. (3) Gate pending approval: "Awaiting [Gate Name] approval · [target date if set]." (4) Gate overdue: "[Gate Name] approval overdue · X days." (5) Stage active, next gate future: current stage and next gate target. (6) Post-deploy: Pilot Start or Production Release as anchoring date. Overdue and upcoming logic from Decision A applies. Connects to: D-108, Session 2026-03-24-A, Session 2026-03-24-B.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision D]** — Current Stage Displayed on Dashboard and Detail View. Current lifecycle stage is displayed on both the Delivery Cycle dashboard row and the cycle detail view. Connects to: D-108.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision E]** — Five Milestone Dates as Planning Layer. Five tracked planning dates on a Delivery Cycle, each with a target date (team-set) and actual date (system-recorded when gate clears): (1) Brief Review Complete — Brief Review gate; (2) Build Start — Go to Build gate; (3) Pilot Start — Go to Deploy gate; (4) Release Start — Go to Release gate; (5) Close Review Complete — Close Review gate. Each operates under the date field state model in Decision A. Gate detail lives on the cycle detail view. Connects to: ARCH-15, D-108, D-154, Session 2026-03-24-A.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision F]** — Warning for Unset Actual Dates on Passed Stages. The system warns when actual dates are unset for stages the cycle has already moved through. Data quality signal — not a hard block. Warning surfaces on the cycle detail view. Connects to: ARCH-15, Session 2026-03-24-E.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision G]** — Fifth Gate: Go to Release. A fifth named gate, Go to Release, is added to the Delivery Cycle lifecycle. Positioned between PILOT and RELEASE stages — exits PILOT, before RELEASE begins. Gate configuration (approver identity, required or optional by tier) is admin-configurable per Division per tier per D-65/D-66. Tier 3 cycles with agent or Analytics Capability deployment trigger AI Production Governance Board review at this gate. The five confirmed gate names are: Brief Review, Go to Build, Go to Deploy, Go to Release, Close Review. Connects to: D-108, D-154, Session 2026-03-18 Decision A, D-65, D-66, D-163, ARCH-12.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision H]** — Gate Enforcement via Business Rules MCP. Stage advancement past any required gate is enforced by the business rules MCP. The UI calls the MCP before allowing any stage transition. A required unapproved gate returns a blocked state with reason stated. Users cannot manually set current stage. Blocked action UX follows D-140. Connects to: D-93, D-140, D-144, Session 2026-03-24-G.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision I]** — Right Panel as Standard Detail Surface. The right panel pattern established for the Document Viewer (D-153) is the standard detail surface across the system. Clicking any record in a list view opens its detail in a right panel. The list view remains visible and navigable on the left. No detail view opens as a full page replacement or modal unless a specific exception is locked. Connects to: D-153, Principle 4.2, UC-05, Build C detail view requirement.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision J]** — Cycle Detail View Required in Build C First Pass. The Delivery Cycle detail view is required in the first pass of Build C — not a later addition. Shows all five milestone dates (target and actual), current stage, all five gate statuses with required approvers, and other cycle details. Opens in right panel per Decision I. Connects to: D-108, Session 2026-03-24-E, Session 2026-03-24-I.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision K]** — Bootstrap File Design Principle: Entry Point Not Manifest. The repo-resident bootstrap file for coding agent session initialization contains only the MCP endpoint reference — not document IDs, version hashes, or governing document content. All governing documents are retrieved from the OI Library via MCP at session start. MCP response determines what to load and in what order; documents may chain further MCP calls. Failure behavior: hard pause — session does not proceed on absent or unverified governing constraints. Connects to: D-93, D-155, ARCH-22, D-52, D-39.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision L]** — Delivery Workstream Registry and Delivery Cycle Assignment. A Delivery Workstream is a named registry entry representing a team of Capability Builders with shared delivery accountability. Registry fields: workstream name, active/inactive status, home Division, member list (Capability Builders), named workstream lead. Every delivery cycle is linked to a Delivery Workstream at creation. Division is set explicitly on the delivery cycle — the workstream's home Division pre-populates the field but is overridable per cycle. A Delivery Workstream can work across multiple Divisions across different cycles without affecting Division governance accuracy on those cycles. The dashboard supports filtering and grouping by Delivery Workstream, enabling WIP visibility per workstream and a roadmap view. The OI Trust dashboard serves as the planning surface for Phil and Domain Leaders to see what each workstream is carrying. Connects to: D-108, D-80 (Registry primitive), UC-20, ARCH-15, ARCH-23, Session 2026-03-24-M, Session 2026-03-24-Q.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision M]** — Current Stage as System-Controlled Field with Automatic Advancement. Current lifecycle stage is a system-controlled field with a fixed list of values: the 12 named stages (BRIEF, DESIGN, SPEC, BUILD, VALIDATE, UAT, PILOT, RELEASE, OUTCOME, COMPLETE) plus CANCELLED and ON HOLD as terminal states. Users cannot manually set current stage. When a required gate is approved, the system automatically advances the stage to the next stage — no manual trigger required. Gate approval is the advancement event. Connects to: Session 2026-03-24-D, Session 2026-03-24-H, D-108.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision N]** — Milestone Date Status Model: Five States with Color. Each of the five milestone dates on a delivery cycle carries one of five statuses with fixed display colors: (1) Not Started (gray) — default state when a target date is set for a gate that is not yet the current or next gate, or before any date is set. (2) On Track (green) — human-set affirmation that the team expects to meet the target date. Not a system default. (3) At Risk (amber) — human-set signal that the date is in jeopardy regardless of arithmetic proximity. (4) Behind (red) — system-set automatically when today exceeds the target date and the gate is not yet cleared. Displays days-overdue count. System sets this regardless of what human had previously set. (5) Complete (blue) — system-set automatically when the gate is cleared, actual date is recorded, and stage advances. Human can unset Complete, but unsetting requires a logged reason captured in the cycle audit trail to preserve the compliance record of the gate approval and its reversal. Human can set On Track and At Risk, and can move status backward (e.g. On Track → Not Started, At Risk → On Track). System overrides human for Behind. When a human changes a target date on a Behind milestone, the status automatically resets to Not Started. Connects to: Session 2026-03-24-A, Session 2026-03-24-E, Session 2026-03-24-O, D-108.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision O]** — Default Status When Target Date Is Set. When a target date is set for the current or next gate, the default status is Not Started (gray) — the human must affirmatively set On Track. When a target date is set for any gate two or more positions ahead of the current stage, the status is Not Started (gray) and remains system-defaulted until the cycle reaches that gate. Connects to: Session 2026-03-24-N.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision P]** — Build Sequence Revised: A → C → B → D → E → F. The delivery cycle tracker (Build C) is pulled forward to position 2, ahead of OI Library Core (Build B). Rationale: the tracker delivers immediate visible value to Domain Strategists and Capability Builders, creates natural demand for the OI Library, and the only hard dependency (Division and user infrastructure) is satisfied by Build A. The Delivery Cycle Build Report submission to the OI Library at cycle close is implemented as a stub in Build C and wired fully when Build B ships. Revised build sequence: A (Foundation) → C (Delivery Cycle) → B (OI Library Core) → D (Notifications) → E (Performance & Standards) → F (Agent Governance). Connects to: D-133, Master Build Plan v1.0, D-89.
| impl_status: unspecced |

**[Session 2026-03-24 — Decision Q]** — Delivery Workstream Active/Inactive Lifecycle and Gate Enforcement. Delivery Workstreams carry an active/inactive status. An inactive workstream cannot be assigned to new delivery cycles — the system blocks the assignment. When a workstream is inactivated, all active delivery cycles assigned to that workstream are immediately flagged with a warning: "Assigned Delivery Workstream is inactive — reassign before this cycle can advance past its current gate." The business rules MCP checks workstream active status as part of every gate clearance attempt. A cycle with an inactive workstream cannot advance past its current gate until a new active workstream is assigned. No grace period — reassignment is the resolution path and is not operationally complex. Connects to: Session 2026-03-24-L, Session 2026-03-24-H, D-80.
| impl_status: unspecced |

**Session 2026-03-25-A** | Outcome Statement as direct field on delivery_cycles | Three columns on delivery_cycles: outcome_statement (text, nullable), outcome_set_by_user_id (uuid FK → users), outcome_set_at (timestamptz). UI displays persistent amber warning when null. Never a gate block. Outcome Statement is not an artifact — it is a direct property of the cycle record. Connects to: ARCH-15, Session 2026-03-25-B.
| impl_status: unspecced |

**Session 2026-03-25-B** | Delivery Cycle artifact model | Two new tables: cycle_artifact_types (system-defined seed — artifact_type_id, artifact_type_name, lifecycle_stage, guidance_text, sort_order, gate_required [dormant], required_at_gate [dormant]) and cycle_artifacts (attachment records — cycle_artifact_id, delivery_cycle_id, artifact_type_id [nullable for ad hoc], display_name, external_url, oi_library_artifact_id, pointer_status [enum: external_only / promoted / oi_only], attached_by_user_id, attached_at). Slots organized by lifecycle stage. Empty slots render as placeholders in UI — guidance, not requirements. Connects to: Session 2026-03-25-A, C, D, E, F, G.
| impl_status: unspecced |

**Session 2026-03-25-C** | No platform enforcement on artifact slots at launch | gate_required and required_at_gate columns dormant at launch. All slots are guidance — visible, skippable, never blocking. Tier-specific enforcement available post-port via dormant columns. Connects to: Session 2026-03-25-B.
| impl_status: unspecced |

**Session 2026-03-25-D** | Delivery Cycle Build Report placed in BUILD stage | Named artifact slot in BUILD, not RELEASE. Guidance: "As-built record — what was built, how it works, deviations from spec. Complete before Go to Deploy. Input to Pilot, training, and OI Library submission." Consistent with existing Terminology Register definition (Go to Deploy gate). Connects to: Session 2026-03-25-B, D-50, terminology-register.md Section 13.
| impl_status: unspecced |

**Session 2026-03-25-E** | BRIEF stage artifact slots include Context Package artifacts | Four named slots in BRIEF: Context Brief; Scenario Journeys; True-life examples (plural); Stakeholder input record. Slots 2 and 3 represent the Context Package layer. Connects to: Session 2026-03-25-B, D-Context-Brief-2Layer.
| impl_status: unspecced |

**Session 2026-03-25-F** | Full cycle_artifact_types seed set locked | Complete slot set by stage: BRIEF (Context Brief; Scenario Journeys; True-life examples; Stakeholder input record). DESIGN (Design session output; UI/UX mockup; Process flow diagram). SPEC (Technical Specification; Cursor prompt; Architecture Decision Record; Agent Registry entry). BUILD (Governing document bootstrap log; Mend scan results; Code review sign-off; Delivery Cycle Build Report). VALIDATE (QA test results; OWASP ZAP scan; Wiz posture report). UAT (UAT sign-off record; 7-step governance checklist; HITRUST/GRICS checklist). PILOT (Pilot Plan; Pilot observations log). RELEASE/OUTCOME (Wiz continuous monitoring baseline; Outcome measurement record). ANY STAGE ad hoc (Reference document — artifact_type_id null, user provides display_name). All slots visible to all tiers. Connects to: Session 2026-03-25-B, C, D, E.
| impl_status: unspecced |

**Session 2026-03-25-G** | MSO365 to OI Library pointer transition model | On OI Library promotion: oi_library_artifact_id populated, pointer_status transitions from external_only to promoted, external_url preserved (not deleted). UI shows OI Library entry as live authoritative pointer, external URL as archived reference. Connects to: Session 2026-03-25-B.
| impl_status: unspecced |

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
| impl_status: unspecced |

**Session 2026-03-29-B** | Division MCP rename | "Container MCP" (`container-mcp`) renamed to "Division MCP" (`division-mcp`) across all references. Tool names unchanged. Connects to: build-a-spec.md Section 5.2, architecture-notes.md, master-build-plan.md, D-134, D-144.
| impl_status: unspecced |

**Session 2026-03-29-C** | Unset-approver business rule | When no approver configured for an artifact type at a given Division: escalate to Division Owner; if no Division Owner set, escalate to Phil. Workflow never hard-fails on missing configuration. Build B spec must include approver configuration UI for admins. Connects to: D-65, D-66, D-94, UC-21, UC-02.
| impl_status: unspecced |

**Session 2026-03-29-D** | ARCH-19 moves to Build B blocker | Vertex AI model selection no longer blocks Build A. Blocks Build B finalization. Connects to: ARCH-19, Session 2026-03-29-A.
| impl_status: unspecced |

**Session 2026-03-29-E** | GCP account confirmed ready | Phil's personal GCP account ready. GCP setup removed from Build A blockers. Remaining Build A blocker: ionic.theme.map.scss designer confirmation. Connects to: build-a-spec.md Section 10.
| impl_status: unspecced |

**Session 2026-03-29-F** | Stage Track component contract locked | Full specification in design-communication-principles.md v1.2 Section 5.1. Stage nodes non-interactive. Gate nodes open gate record on click. StageTrackComponent is presentation-only Angular component. Two rendering modes: Full (detail views) and Condensed (dashboard rows). Build C: Full + Condensed for Delivery Cycle. Build B: applied to OI Library artifact detail. Connects to: ARCH-25, D-93, D-108, D-154.
| impl_status: unspecced |

**Session 2026-03-30-A** | RLS explicitly disabled | RLS (Row Level Security) is disabled in the Supabase project. JWT validation and Division-scoped access control live entirely in the MCP layer (D-93). Enabling RLS would add a second enforcement layer that conflicts with the MCP-only access rule and creates maintenance overhead with no security benefit in this architecture. This is not a deferral — it is an explicit architectural choice. Connects to: D-93, build-a-spec.md Section 2, CLAUDE.md.
| impl_status: unspecced |

**Session 2026-03-30-B** | Bulk Knowledge Seed supports multiple independent batches | The Bulk Knowledge Seed can be run as many times as needed — Batch A, then Batch B, then Batch C at any point in the future. Each batch creates independent artifact records with no dependencies on prior batches. The data model has no batch counter, no sequence dependency, and no carry-over state. Deduplication is a future consideration but not a current constraint. The ivfflat index on document_embeddings requires periodic maintenance as the table grows — operational note, not a build constraint. Connects to: build-a-spec.md Section 8, document_embeddings table.
| impl_status: unspecced |

**Session 2026-03-30-C** | CLAUDE.md produced; governing docs bootstrap mechanism deferred | CLAUDE.md authored for Build A and ready to commit to GitHub repo /docs/ folder. The ARCH-22 bootstrap mechanism cannot be implemented yet — OI Library does not exist. For Build A, CLAUDE.md points Claude Code directly at files in /docs/. Full ARCH-22 bootstrap mechanism wired when Build B ships the OI Library MCP. Four environment variable placeholders remain: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DOCUMENT_ACCESS_MCP_URL, DIVISION_MCP_URL — must be populated before Claude Code's first session. Connects to: ARCH-22, build-a-spec.md, CLAUDE.md.
| impl_status: unspecced |

**Session 2026-03-30-D** | MCP architecture stays in Build A; no deferral | A proposal to defer MCP servers to a later build was considered and rejected. The MCP-only architecture (D-93) is the portability guarantee. Retrofitting MCP after the fact means doing the migration work twice. The two MCP servers in Build A (document-access-mcp, division-mcp) are thin JWT-validating pass-through layers over straightforward queries. Build cost is low; retrofit cost is higher and introduces behavioral risk. Connects to: D-93, build-a-spec.md Section 5.
| impl_status: unspecced |

**Session 2026-03-30-E** | Engineering introduction: build sequence paused pending engineer onboarding | Build A infrastructure setup (GitHub repo, Supabase project, Render account) has not yet been created. Phil will introduce the engineer (Sandip managing, possible second engineer) on 2026-03-31. Build A does not start until after that session. Engineering introduction materials produced this session. Connects to: project-briefing.md Pending Actions, Build A blockers.
| impl_status: unspecced |

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

### Design Principles — D-180 through D-186 (April 2026)

**D-180** — Right-Panel Entity Detail Pattern. Clicking any named entity anywhere in the system opens its detail in a right panel. The originating screen remains visible and navigable. No entity detail opens as a full-page replacement or modal unless a specific exception is locked by a design decision. Architectural basis: (1) QPathways UX alignment — right-panel is the QPathways standard for entity detail at port time; (2) Mobile compatibility — right-panel layout collapses to single-column on narrow viewports without a separate implementation. Rules: one right-panel slot (no stacking); list stays visible on wide viewports; entity references within a panel are tappable chips per D-181; URL does not change on panel open/close; exceptions require a locked decision. Applies to: Delivery Cycle (Build C), Division and User (Build A shell / Build D full), Workstream and Gate (Build C), OI Library Artifact (Build B). Full principle in docs/design-principles.md Principle 10. | Source: Claude Chat | April 2026 |
| impl_status: built |

**D-181** — Tappable Entity Chips. Every named entity reference in a list row, detail panel, or form is rendered as a tappable chip. Plain text entity references are an anti-pattern. Visual treatment: pill shape (border-radius: var(--radius-pill)), muted background (--triarq-color-fog at low opacity), initials avatar or type icon on left, Roboto font. Tap behavior: opens referenced entity detail in right panel per D-180. Inactive or inaccessible entities: chip still renders, tap shows read-only summary — never hidden. Multiple chips: render each inline, never concatenated to plain text. Form pickers produce chips after selection (with remove x for editable fields). Required in Build C for: Assigned DS and CB on every cycle row and detail, Delivery Workstream on every cycle row and detail, Division on every cycle row and detail, approver names in gate detail, actor names in activity log, gate names in milestone rows, Attached by user on artifact slots. Full principle in docs/design-principles.md Principle 11. | Source: Claude Chat | April 2026 |
| impl_status: built |

**D-182** — Entity Picker Pattern. When a form field requires selecting a named entity with meaningful attributes, use an entity picker — not a plain dropdown. A dropdown is only appropriate for short, flat lists of simple scalar values. Picker structure: scope radio (tightest scope default; explicit progression; always visible); search field (always present; client-side filtering under ~100 records; debounced server query for large scopes); entity rows (avatar, name, key attrs, status badge; inactive items dimmed at bottom; blocked message inline on inactive tap); echo section (selected entity as chip). Scope expansion is always deliberate — picker never auto-expands on no results. PICKER_SEARCH_DEBOUNCE_MS = 600 — defined once as a shared constant, never hardcoded. 600ms intentionally longer than web standard for healthcare context. EntityPickerComponent is implemented once, configurable per entity type — never reimplemented per type. DS/CB Picker is the reference implementation. Full principle in docs/design-principles.md Principle 12. | Source: Claude Chat | April 2026 |
| impl_status: built |

**D-183** — Destructive and Irreversible Action Confirmation. Any action that cannot be automatically reversed requires an explicit two-step confirmation stating what will change before the user commits. Rules: (1) state what changes, not just "are you sure"; (2) two-call pattern for computed downstream effects — first MCP call returns preview, second call with confirmed: true executes; (3) confirmation is inline, not a modal; (4) cancel available until Tier 3 overlay takes over; (5) say "cannot be undone without [correction path]" not "permanent" if manually reversible. Connects to: D-140, D-179, Session 2026-03-24-N. Full principle in docs/design-principles.md Principle 13. | Source: Claude Chat | April 2026 |
| impl_status: built |

**D-184** — Entity Name Capitalization. Named system entities are capitalized in all user-facing text. General-purpose nouns describing the same concept are not. Test: if you could substitute the entity name as a UI label, capitalize it; if it appears in a conceptual explanation, use lowercase. Capitalized entities: Division, Workstream, Delivery Cycle, Gate, Artifact, OI Library, Delivery Workstream, Context Brief, Build Report, Action Queue, Stage Track, Trust, Milestone. Applies to: all Angular component templates, error messages, empty states, loading state labels, hub card descriptions, MCP error messages returned to UI, form field labels, table column headers. Does not apply to: TypeScript variable names, database column names, MCP parameter names. Supersedes D-177. Full principle in docs/design-principles.md Principle 14. | Source: Claude Chat | April 2026 |
| impl_status: specced |

**D-185** — Principle Citation in Specs. Every spec document produced by Claude Chat cites the governing design principle number(s) for each section. Format immediately after Source: Governing principles: Principle N (Name). Omit the line when no principle applies — do not write "None." Citation required on every section governing UI or behavioral decisions; schema-only sections do not require it. When a spec instruction conflicts with its cited principle, Claude Code raises it explicitly per Principle 6 before building. Missing principle for a behavior is a spec gap — flag to Phil. Full principle in docs/design-principles.md Principle 15. | Source: Claude Chat | April 2026 |
| impl_status: specced |

**D-186** — Decision Implementation Status. Every decision in decisions-active.md carries an impl_status field. Four values: unspecced (locked, no spec yet — default for all pre-existing decisions), specced (included in a spec document given to Claude Code — set by Claude Chat), built (Claude Code has implemented — set by Claude Code at completion), verified (Phil has confirmed acceptance criteria met). Format: | impl_status: [value] | on its own line after the decision record. Claude Code updates to built at implementation completion and does not set verified speculatively. Full principle in docs/design-principles.md Principle 16. | Source: Claude Chat | April 2026 |
| impl_status: specced |

**D-187** — Action Queue Name. "Action Queue" is the confirmed name for the user action surface. Gate approvals (Accountable) and Gate reviews (Consulted) are the first two action types. No rename as new action types are added unless a specific UX problem requires it. Capitalize in all user-facing text per Principle 14: labels, card headers, empty states, MCP error messages. "My Action Queue" on home screen card. "Items in your Action Queue" in notifications. | Source: Claude Chat | April 2026 |
| impl_status: specced |

**D-188** — Primary Workflow Clarity. Every screen and panel is designed around its primary workflow. Primary workflow controls are the largest, most prominent elements. Secondary and tertiary controls are visually recessed: smaller text, reduced contrast, positioned below a visual separator or at screen edge, never inline with primary controls at equal weight. Anti-patterns: "Show inactive Workstreams" checkbox at equal weight to scope radios; an advanced filter rendered identically to a primary filter; an edge-case toggle positioned beside the main action path. Full principle in docs/design-principles.md Principle 17. | Source: Claude Chat | April 2026 |
| impl_status: built |

**D-189** — Sidebar-Only Navigation. OI Trust uses sidebar-only navigation. No top navigation bar. All navigation items live in the left sidebar. As items grow, apply section grouping with muted uppercase section headers when sidebar has 7+ items. Current grouping model (when triggered): (no header) Home/Action Queue/Notifications; OI LIBRARY — OI Library; DELIVERY — Delivery Cycle Tracking/Gates/Workstreams; ADMIN — Admin. Section headers are non-interactive labels. Full principle in docs/design-principles.md Principle 18. | Source: Claude Chat | April 2026 |
| impl_status: built |

**D-190** — UI Feedback Standard. Exactly three visual feedback patterns are used across all forms, panels, and screens. Pattern 1 — Field Guidance (gray sub-text, --triarq-color-stone, one size below label, no icon/background). Pattern 2 — Warning (amber left border 3px solid --triarq-color-sunray, 8% opacity background, standard body text, ⚠ icon). Pattern 3 — Error (2px solid error color field border, error message below field, ✕/⚠ icon). No fourth pattern is introduced without a locked design decision. Full principle in docs/design-principles.md UI Feedback Standard section. | Source: Claude Chat | April 2026 |
| impl_status: built |

**D-191** — Tier Classification as Dropdown with Descriptions. Tier Classification renders as a dropdown (not radio buttons). No default selection; placeholder "Select tier classification". Three options with inline descriptions: Tier 1 — Fast Lane: Workflow changes, config updates, no platform dependencies; Tier 2 — Structured: Platform changes, integrations, cross-domain dependencies; Tier 3 — Governed: Agent deployments, compliance scope changes, AI Governance Board required. Required before cycle creation; block with Pattern 3 error if unselected. | Source: Claude Chat | April 2026 |
| impl_status: built |

**D-192** — Full Gate Sequence for All Tiers (Rollout Phase). All three tiers run the full five-gate sequence during the current rollout phase. Implemented as gate configuration data — not a code change to the Tier model. Approvers by gate: Brief Review/Go to Build/Go to Deploy — Sabrina (Domain Lead) for Practice and Value Services Trusts; Go to Release/Close Review — Phil (EVP Governance). Other Trusts: escalate to Division Owner per Session 2026-03-29-C. | Source: Claude Chat | April 2026 |
| impl_status: built |

**D-193** — Workstream Filter as Tab Strip on Hub Screen. The Workstream filter on /delivery/cycles renders as a horizontal tab strip, not a dropdown. First tab: "All Workstreams" (default). Subsequent tabs: one per Workstream the authenticated user can access, ordered by name. Active tab: filled --triarq-color-primary, white text. Inactive tabs: outlined, muted text. Overflow: first N that fit, then "+ N more ▾" overflow tab — no second-row wrap. | Source: Claude Chat | April 2026 |
| impl_status: built |

**D-194** — Create Cycle Form Field Order. Field order on the New Delivery Cycle right panel: (1) Division, (2) Cycle Title, (3) Outcome Statement, (4) Delivery Workstream, (5) Tier Classification, (6) Assigned Domain Strategist, (7) Assigned Capability Builder, (8) Jira Epic Link. Outcome Statement moves to position 3 — immediately after Title — because it is the "why" of the cycle. | Source: Claude Chat | April 2026 |
| impl_status: built |

**D-195** — Workstream Picker: Suppress Trust Radio at Trust-Level Division; Inactive Toggle Treatment. Suppress the "Trust" scope radio when the cycle's selected Division is a Trust (hierarchy depth = 1). Default scope: "Cycle's Division". "Show inactive Workstreams" toggle is visually separated from scope radios (thin rule or 16px margin), text one step smaller than scope radio labels, color --triarq-color-stone. Toggle must not appear as a peer to scope radios. | Source: Claude Chat | April 2026 |
| impl_status: built |

**D-196** — Column Headers Always Rendered on Hub Screen. Column headers on /delivery/cycles always render — even when no rows exist. Header row: --triarq-color-navy background, white text. Column order: avatar (48px), Cycle Name (flex min 200px), Headline Status (flex), Lifecycle Stage (200px), Pilot Start Date (120px), Release Start Date (120px). Not sortable at this stage. | Source: Claude Chat | April 2026 |
| impl_status: built |

**D-197** — Tier Avatar Dot Column on Hub Screen Rows. Each cycle row on /delivery/cycles shows a colored circle in the avatar column (48px) indicating Tier. Colors: Tier 1 = green (#4CAF50), Tier 2 = amber (--triarq-color-sunray), Tier 3 = teal (--triarq-color-primary). No initials or icon — color alone carries the signal. Tier badge (pill, matching color, white text) renders below the cycle title in the Cycle Name column. | Source: Claude Chat | April 2026 |
| impl_status: built |
