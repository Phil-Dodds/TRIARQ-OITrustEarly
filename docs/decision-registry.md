# Decision Registry — Pathways OI Trust
# Pathways OI Trust | v3.16 | April 2026 | CONFIDENTIAL
# Authoritative source for decision number allocation.
# Feed to Claude Chat at the start of any design session so it knows the current next-available number.
# Claude Code reads this file to look up existing decision content only. D-number allocation is Claude Chat / Design Session only (D-317).

---

## Next Available Decision Number

**Next available: D-338**

Before claiming a number — Claude Chat only — confirm this field and claim the next sequential
number. D-number assignment is exclusively a Design Session responsibility (D-317). Claude Code
does not claim numbers. Claude Chat states the number it is claiming in the Session Output File
Section A. The Document Author adds the registry row and updates this field via Section F
instructions.

---

## Collision Protocol

Retired per D-317. Claude Code no longer claims D-numbers. Collisions cannot occur if only
one session type (Claude Chat / Design Session) assigns numbers. If a collision is ever
discovered from the pre-D-317 era, the resolution is: assign a new number to the
late-arriving decision; never renumber an existing entry (D-316).

---

## Source Tag Definitions

Every decision entry in `decisions-active.md` includes a source tag. Definitions:

| Tag | Meaning |
|---|---|
| `Claude Chat` | Decision originated in a Claude Chat design session. Phil accepted it and asked Claude Code to commit it, or it was committed directly from the chat transcript. |
| `Claude Code` | Decision originated during a Claude Code build session — typically an implementation discovery, design gap found during coding, or explicit design instruction given during a code session. |
| `Design Session` | Multi-party session (Phil + others) where the decision was made outside of any AI session. Documented retrospectively. |

---

## Decision Registry

| Number | Short Title | Source | Date | Status |
|---|---|---|---|---|
| D-37 | System Architecture — Hierarchy and Multi-Tenancy (Decision 37) | Design Session | Pre-March 2026 | Active |
| D-38 | Canon / Scope Independence | Design Session | Pre-March 2026 | Active |
| D-39 | Engineering Governance File Structure | Design Session | Pre-March 2026 | Active |
| D-40 | Engineering Governance Queue | Design Session | Pre-March 2026 | Active |
| D-41 | Soft Gate Model | Design Session | Pre-March 2026 | Active |
| D-42 | Governance Circuit Breaker | Design Session | Pre-March 2026 | Active |
| D-43 | Governance Escalation Path | Design Session | Pre-March 2026 | Active |
| D-67 | Jira link model — bidirectional, one cycle to multiple epics | Claude Chat | Pre-April 2026 | Active |
| D-83 | Delivery Cycle as primary unit of work | Claude Chat | Pre-April 2026 | Active |
| D-93 | MCP-only DB access; UI as presentation layer only | Claude Chat | March 2026 | Active |
| D-97 | CLAUDE.md scope — project-specific constraints only | Claude Chat | March 2026 | Active |
| D-108 | 12-stage lifecycle with 5 gates | Claude Chat | Pre-April 2026 | Active |
| D-113 | Cycle artifacts live on cycle until Build Report canonization | Claude Chat | Pre-April 2026 | Active |
| D-115 | Cursor Prompt as BUILD phase working artifact | Claude Chat | Pre-April 2026 | Active |
| D-117 | Jira MCP integration — OI Trust as system of record | Claude Chat | Pre-April 2026 | Active |
| D-124 | Tier set at BRIEF stage and locked | Claude Chat | Pre-April 2026 | Active |
| D-125 | Append-only event log on every cycle | Claude Chat | Pre-April 2026 | Active |
| D-130 | (Carried — see decisions-active.md for full text) | Claude Chat | March 2026 | Active |
| D-140 | Blocked action UX standard | Claude Chat | March 2026 | Active |
| D-143 | Angular Native Federation remote | Claude Chat | March 2026 | Active |
| D-144 | MCP server pattern | Claude Chat | March 2026 | Active |
| D-148 | Vertex AI model selection (open) | Claude Chat | March 2026 | Open |
| D-151 | Design token rules (h2=60px critical fix) | Claude Chat | March 2026 | Active |
| D-154 | Five named gates | Claude Chat | Pre-April 2026 | Active |
| D-155 | On-demand MCP tool loading | Claude Chat | March 2026 | Active |
| D-163 | AI Production Governance Board name — see decisions-active.md | Claude Chat | March 2026 | Active |
| D-164 | Delivery Cycle Build Report name — see decisions-active.md | Claude Chat | March 2026 | Active |
| D-165 | Universal Entity Detail Panel — see decisions-active.md | Claude Chat | April 2026 | Active |
| D-166 | User Activity Event Infrastructure — see decisions-active.md | Claude Chat | April 2026 | Active |
| D-167 | User Activity / Accomplishments Build Assignment — see decisions-active.md | Claude Chat | April 2026 | Active |
| D-168 | Accomplishments Card Role-Sectioned Display — see decisions-active.md | Claude Chat | April 2026 | Active |
| D-169 | User Self-Service Boundary — see decisions-active.md. Registry entry superseded by D-201 for source-tagging protocol. | Claude Chat | April 2026 | Active |
| D-170 | Phil and Admin have implicit access to all Divisions | Claude Code | April 2026 | Active |
| D-171 | Delivery hub page at /delivery — four option cards, no data on load | Claude Code | April 2026 | Active |
| D-172 | Dashboard Column Set — 11 columns, 4 always visible | Claude Chat | April 2026 | Active |
| D-173 | assigned_ds_user_id as sole DS field; cycle_owner dropped (Migration 025) | Claude Chat | April 2026 | Active |
| D-174 | DS and CB nullable at creation; gate enforcement in MCP only | Claude Chat | April 2026 | Active |
| D-175 | Drill-down from summary views to /delivery/cycles via query params | Claude Code | April 2026 | Active |
| D-176 | Division summary as flat indented list (not collapsible tree) | Claude Code | April 2026 | Active |
| D-177 | Entity name capitalization in UI text — SUPERSEDED by D-184 | Claude Code | April 2026 | Superseded |
| D-178 | Processing State Standard: Three-Tier Loading Pattern | Claude Code | April 2026 | Active |
| D-179 | Stage Regression Gate Reset Rule — two-call confirm pattern, gatesResetOnRegressionTo() | Claude Code | April 2026 | Active |
| D-180 | Right-Panel Entity Detail Pattern | Claude Chat | April 2026 | Active |
| D-181 | Tappable Entity Chips | Claude Chat | April 2026 | Active |
| D-182 | Entity Picker Pattern (incl. PICKER_SEARCH_DEBOUNCE_MS = 600) | Claude Chat | April 2026 | Active |
| D-183 | Destructive and Irreversible Action Confirmation | Claude Chat | April 2026 | Active |
| D-184 | Entity Name Capitalization | Claude Chat | April 2026 | Active |
| D-185 | Principle Citation in Specs | Claude Chat | April 2026 | Active |
| D-186 | Decision Implementation Status | Claude Chat | April 2026 | Active |
| D-187 | Action Queue Name confirmed | Claude Chat | April 2026 | Active |
| D-188 | Delivery module sub-routes (renumbered from D-172 — collision) | Claude Code | April 2026 | Active |
| D-189 | Next gate derived from lifecycle stage / NEXT_GATE_BY_STAGE (renumbered from D-173) | Claude Code | April 2026 | Active |
| D-190 | WIP categories Prep/Build/Outcome, limit=4 (renumbered from D-174) | Claude Code | April 2026 | Active |
| D-191 | Tier Classification as dropdown with descriptions | Claude Chat | April 2026 | Active |
| D-192 | Full gate sequence for all tiers — rollout phase config | Claude Chat | April 2026 | Active |
| D-193 | Workstream filter as tab strip on hub screen | Claude Chat | April 2026 | Active |
| D-194 | Create Cycle form field order (Outcome Statement at position 3) | Claude Chat | April 2026 | Active |
| D-195 | Workstream Picker — suppress Trust radio; inactive toggle treatment | Claude Chat | April 2026 | Active |
| D-196 | Column headers always rendered on hub screen | Claude Chat | April 2026 | Active |
| D-197 | Tier avatar dot column on hub screen rows | Claude Chat | April 2026 | Active |
| D-198 | Primary Workflow Clarity — secondary controls visually recessed | Claude Chat | April 2026 | Active |
| D-199 | Sidebar-Only Navigation — no top nav; section headers at 7+ items | Claude Chat | April 2026 | Active |
| D-200 | UI Feedback Standard — three patterns only (Guidance/Warning/Error) | Claude Chat | April 2026 | Active |
| D-201 | decision-registry.md as twelfth canonical document | Claude Chat | April 2026 | Active |
| D-202 | Spec Staleness Standing Rule (Rule D) | Claude Chat | April 2026 | Active |
| D-203 | Short Display Name for Divisions and Workstreams | Claude Chat | April 2026 | Active |
| D-204 | CB Defaults from Workstream Lead | Claude Chat | April 2026 | Active |
| D-205 | User-Controlled Milestone Status Philosophy | Claude Chat | April 2026 | Active |
| D-206 | Workstream Picker Scope Radio Sequence | Claude Chat | April 2026 | Active |
| D-207 | App UI Uses QPathways Design Tokens Exclusively | Claude Chat | April 2026 | Active |
| D-208 | Standards Layer Concept | Claude Chat | April 2026 | Active |
| D-209 | Artifact Conflict Check — Session Open | Claude Chat | April 2026 | Active |
| D-210 | Artifact Conflict Check — Session Close (Prevention) | Claude Chat | April 2026 | Active |
| D-211 | Amend D-185: Governing Context Block extended | Claude Chat | April 2026 | Active |
| D-212 | impl_status Sweep at Session Close | Claude Chat | April 2026 | Active |
| D-213 | Session Retro Instruction | Claude Chat | April 2026 | Active |
| D-214 | Standards Document Structure | Claude Chat | April 2026 | Active |
| D-215 | Standard Lifecycle | Claude Chat | April 2026 | Active |
| D-216 | Standards Propagation to Claude Code | Claude Chat | April 2026 | Active |
| D-217 | Drift Detection Model | Claude Chat | April 2026 | Active |
| D-218 | Resolution of design-communication-principles.md | Claude Chat | April 2026 | Active |
| D-219 | Pre-Build Component Verification | Claude Code → Claude Chat | 2026-04-09 | Active |
| D-220 | Orchestration Automation and OI Library Integration Design Session | Claude Chat | 2026-04-09 | Deferred |
| D-221 | Starter CI/CD Pipeline Before Build B | Claude Chat | 2026-04-09 | Active |
| D-222 | Dependency Sequencing Rule | Claude Chat | 2026-04-09 | Active |
| D-223 | Self-Documenting Naming Standard | Claude Chat | 2026-04-09 | Active |
| D-224 | Behavior Protection During Code Changes | Claude Chat | 2026-04-09 | Active |
| D-225 | Triggered Structural Read | Claude Chat | 2026-04-09 | Active |
| D-226 | Responsibility Declaration on New Files | Claude Chat | 2026-04-09 | Active |
| D-227 | Required File Verification at Session Start | Claude Chat | 2026-04-09 | Active |
| D-228 | Tier Classification Edit Behavior on Existing Cycles | Claude Chat | 2026-04-09 | Active |
| D-229 | Delivery Cycle Field Edit Audit Log | Claude Chat | 2026-04-09 | Active |
| D-230 | Cancelled Item Visibility Philosophy (superseded by S-009) | Claude Chat | 2026-04-09 | Superseded |
| D-231 | Standards Govern Design Output | Claude Chat | 2026-04-09 | Active |
| D-232 | Standards Propagation Mechanism | Claude Chat | 2026-04-09 | Active |
| D-233 | Standards Summary Maintenance Rule | Claude Chat | 2026-04-09 | Active |
| D-234 | Permanent Reference Documents in CLAUDE.md | Claude Chat | 2026-04-09 | Active |
| D-235 | Session Type Declaration and Reading Order Rule | Claude Chat | 2026-04-09 | Active |
| D-236 | Delta Instruction Format for Modification Sessions | Claude Chat | 2026-04-09 | Active |
| D-237 | Build Configuration Change Requires CC-Decision | Claude Chat | 2026-04-09 | Active |
| D-238 | Redesigned Surface Reading Order | Claude Chat | 2026-04-09 | Active |
| D-239 | Thin Contract Standard | Claude Chat | April 2026 | Active |
| D-240 | Plan-Mode Checkpoint | Claude Chat | April 2026 | Active |
| D-241 | As-Built Document | Claude Chat | April 2026 | Active |
| D-242 | Field Completeness Check at Spec Production | Claude Chat | April 2026 | Active |
| D-243 | Spec Completeness Standard | Claude Chat | April 2026 | Active |
| D-244 | Gate Display Treatment — Current Build | Claude Chat | April 2026 | Active |
| D-245 | Gate Approval Status Display | Claude Chat | April 2026 | Active |
| D-246 | Build Sequence Split for Infrastructure Priority | Claude Chat | April 2026 | Active |
| D-247 | CLAUDE.md Candidates Field in CodeClose Output | Claude Chat | 2026-04-10 | Active |
| D-248 | Production Auth — Supabase Email+Password Invite Flow | Claude Chat | 2026-04-10 | Active |
| D-249 | update_delivery_cycle MCP Tool (net-new Contract 2) | Claude Code | 2026-04-10 | Active |
| D-250 | Workstream Picker Label Shortened | Claude Code | 2026-04-10 | Active |
| D-251 | Code Effort Level High — Standing Instruction | Claude Chat | 2026-04-10 | Active |
| D-252 | Greenfield vs. Modification Execution Model | Claude Chat | 2026-04-11 | Active |
| D-253 | Angular Template Performance: No Object-Returning Methods in *ngFor | Claude Code | 2026-04-11 | Active |
| D-254 | Angular CLI Analytics Flag Auto-Written to angular.json | Claude Code | 2026-04-11 | Active |
| D-255 | GDA — Framework Concept | Claude Chat | 2026-04-11 | Active |
| D-256 | GDA — Execution Memory as a Category | Claude Chat | 2026-04-11 | Active |
| D-257 | GDA — Four Question Names | Claude Chat | 2026-04-11 | Active |
| D-258 | GDA — CCode-Decision Naming Convention | Claude Chat | 2026-04-11 | Active |
| D-259 | GDA — Two Maintained Layers Plus Constitution | Claude Chat | 2026-04-11 | Active |
| D-260 | GDA — Governance Constitution | Claude Chat | 2026-04-11 | Active |
| D-261 | GDA — Governance Health Signals | Claude Chat | 2026-04-11 | Active |
| D-262 | Section H Routing: Validator-Only for-ClaudeCode.zip | Claude Chat | 2026-04-11 | specced |
| D-263 | OI Trust Port-Time Compatibility Requirement | Claude Chat | 2026-04-11 | not-specced |
| D-264 | Grid Row Tier Display Removed | Claude Chat | 2026-04-11 | not-specced |
| D-265 | Grid Row Team Cell | Claude Chat | 2026-04-11 | not-specced |
| D-266 | Grid Row Title and Outcome Wrapping | Claude Chat | 2026-04-11 | not-specced |
| D-267 | Grid Row Stage and Headline as Separate Columns | Claude Chat | 2026-04-11 | not-specced |
| D-268 | S-010: Filter Panel Structure | Claude Chat | 2026-04-11 | not-specced |
| D-269 | S-011: Filter Panel Commit Model | Claude Chat | 2026-04-11 | not-specced |
| D-270 | S-012: Active Filter Chips | Claude Chat | 2026-04-11 | not-specced |
| D-271 | S-013: Filter Drill-in Pattern | Claude Chat | 2026-04-11 | not-specced |
| D-272 | Workstream Filter Drill-in | Claude Chat | 2026-04-11 | not-specced |
| D-273 | Delivery Cycle Detail Panel — View Surface | Claude Chat | 2026-04-11 | not-specced |
| D-274 | Component Library Baseline: Angular Material (MD3) | Claude Chat | 2026-04-11 | not-specced |
| D-275 | Gate Record Inline Edit in Cycle View | Claude Chat | 2026-04-12 | built |
| D-276 | Outcome Statement Display in Cycle View | Claude Chat | 2026-04-12 | built |
| D-277 | Assigned Person Filter Drill-in | Claude Chat | 2026-04-12 | not-specced |
| D-278 | No-Filter Default Pattern | Claude Chat | 2026-04-12 | not-specced |
| D-279 | Workstream Filter Display Corrections | Claude Chat | 2026-04-12 | not-specced |
| D-280 | Contract Regression Protection | Claude Chat | 2026-04-12 | not-specced |
| D-281 | Tier Badge Pill Restored to Grid Cycle Name Cell | Claude Code | 2026-04-12 | Active |
| D-282 | Gate Status Initialization: `not_started` Seed on New Cycles | Claude Code | 2026-04-12 | Active |
| D-283 | Migration 027: `display_name_short` on `delivery_workstreams` | Claude Code | 2026-04-12 | Active |
| D-284 | Zone Explanatory Text: 11px Italic #5A5A5A | Claude Code | 2026-04-12 | Active |
| D-285 | Workstream Filter: `wsScope` State Variable and Peer Options Model | Claude Code | 2026-04-12 | Active |
| D-286 | Assigned Person Filter: `personScope` State Variable | Claude Code | 2026-04-12 | Active |
| D-287 | Memoization of Person and Workstream List Getters | Claude Code | 2026-04-12 | Active |
| D-288 | S-015: Secondary Orienting Text Style (Active Standard) | Claude Chat | 2026-04-12 | Active |
| D-289 | Migration 028: `gate_records_gate_status_check` Constraint Updated | Claude Code | 2026-04-12 | Active |
| D-290 | Create Surface Panel Behavior | Claude Chat | 2026-04-12 | Active |
| D-291 | Panel Header Sticky Behavior | Claude Chat | 2026-04-12 | Active |
| D-292 | Panel Modality by Surface Type | Claude Chat | 2026-04-12 | Active |
| D-293 | CC-Decision Sequence Completeness Check at Code Close | Claude Chat | 2026-04-12 | Active |
| D-294 | Worktree Merge Check Before Deploy Prompt | Claude Chat | 2026-04-12 | Active |
| D-295 | Supabase Migration Execution Pattern | Claude Chat | 2026-04-12 | Active |
| D-296 | Outcome Statement Display Style in Cycle View | Claude Chat | 2026-04-12 | Amends D-276 |
| D-297 | Inform Don't Hide or Disable | Claude Chat | 2026-04-12 | Active |
| D-298 | All Delivery Cycles Header Zone Layout | Claude Chat | 2026-04-12 | Active |
| D-299 | DS/CB Picker Default Scope When No Division Set | Claude Chat | 2026-04-13 | Active |
| D-300 | Gate Date Text Color | Claude Chat | 2026-04-13 | Active |
| D-301 | Persistent Session / Remember This Device | Claude Chat | 2026-04-13 | Active |
| D-302 | Unknown User Login Error Message | Claude Chat | 2026-04-14 | Active |
| D-303 | Forgot Password as Universal No-Password Recovery Path | Claude Chat | 2026-04-14 | Active |
| D-304 | Rationale-First Reasoning on Decision Extensions | Claude Chat | 2026-04-14 | Active |
| D-305 | Search Deferred Items When Rationale Is Missing | Claude Chat | 2026-04-14 | Active |
| D-306 | Document Author Self-Correct Classification | Claude Chat | 2026-04-14 | Active |
| D-307 | build-c-supplement-spec.md Reference Retirement | Claude Chat | 2026-04-14 | Active |
| D-308 | List → View Navigation Pattern | Claude Chat | 2026-04-14 | Active |
| D-309 | Bidirectional Entity Traversal Requirement | Claude Chat | 2026-04-14 | Active |
| D-310 | Workflow Entry Point Completeness | Claude Chat | 2026-04-14 | Active |
| D-311 | Admin Hub Route and Card Structure | Claude Chat | 2026-04-14 | Active |
| D-312 | Workstream Field Requirement Model | Claude Code | 2026-04-14 | Active |
| D-313 | Division Filter Drill-in | Claude Code | 2026-04-14 | Active |
| D-314 | Workstream Filter Options Model | Claude Code | 2026-04-14 | Active |
| D-315 | Claude Code Debate Before Building | Claude Chat | 2026-04-14 | Active |
| D-316 | Title-First Citation Standard and Permanent Number Stability | Claude Chat | 2026-04-14 | Active |
| D-317 | D-Number Assignment Authority Restricted to Design Session | Claude Chat | 2026-04-14 | Active |
| D-318 | Decision Registry Always Travels in for-ClaudeCode.zip | Claude Chat | 2026-04-14 | Active |
| D-319 | Solution Completeness Check (Rule 22) | Claude Chat | 2026-04-14 | Active |
| D-320 | Document Author Session Quality Rules (str_replace uniqueness, risk review, citation scan) | Claude Chat | 2026-04-14 | Active |
| D-321 | Design Session Type System (Spec / Governance / Planning, loading table, inference) | Claude Chat | 2026-04-14 | Active |
| D-322 | Document Author Optimized Loading (on-demand per instruction, load-once) | Claude Chat | 2026-04-14 | Active |
| D-323 | Validator Optimized Loading (by check group batch) | Claude Chat | 2026-04-14 | Active |
| D-324 | D-213 Amendment: Decision Referencing Error Tracking (DECISION-REF-ERROR, TYPE-MISS) | Claude Chat | 2026-04-14 | Active |
| D-325 | Caveman Mode: Always-On Prose Compression | Claude Chat | 2026-04-14 | Active |
| D-326 | CLAUDE.md Update Authority and Review Triggers | Claude Chat | 2026-04-15 | Active |
| D-327 | Merge CLAUDE.md and claude-code-session-rules.md | Claude Chat | 2026-04-15 | Active |
| D-328 | Non-conformance Handling: Standards Violations Discovered Mid-Session | Claude Chat | 2026-04-15 | Active |
| D-329 | Exception Convention for Active Standards | Claude Chat | 2026-04-15 | Active — final lock pending GDA-IMPLEMENT |
| D-330 | Governing References Move to HTML Comments in Code-Read Files | Claude Chat | 2026-04-15 | Active |
| D-331 | Rationale Required in HTML for All Instructions in Code-Read Files | Claude Chat | 2026-04-15 | Active |
| D-332 | Improvement Proposal Routing | Claude Chat | 2026-04-15 | Active |
| D-333 | Instruction Template Standard | Claude Chat | 2026-04-15 | Active |
| D-334 | Rationale Block Label Amendment: "Why" Replaces "Question/Root" | Claude Chat | 2026-04-15 | Active |
| D-335 | Rationale Block Three-Field Template: Why / Considered / Downsides | Claude Chat | 2026-04-15 | Active |
| D-336 | Rule 23: D-333 Template Conformance Check | Claude Chat | 2026-04-17 | Active |
| D-337 | Rule Authoring Template: Three-Part Standard for Design Sessions | Claude Chat | 2026-04-18 | Active |

---

## Numbers Currently Reserved / Open

None currently reserved.

---

## Gaps in Numbering

D-44 through D-66: Pre-existing decisions not yet entered in this registry.
D-68 through D-82: Pre-existing decisions not yet entered in this registry.
D-84 through D-92: Pre-existing decisions not yet entered in this registry.
D-94 through D-96: Pre-existing decisions not yet entered in this registry.
D-98 through D-107: Pre-existing decisions not yet entered in this registry.
D-109 through D-112: Pre-existing decisions not yet entered in this registry.
D-118 through D-123: Pre-existing decisions not yet entered in this registry.
D-126 through D-129: Pre-existing decisions not yet entered in this registry.
D-131 through D-139: Pre-existing decisions not yet entered in this registry.
D-141 through D-142: Pre-existing decisions not yet entered in this registry.
D-145 through D-147: Pre-existing decisions not yet entered in this registry.
D-149 through D-150: Pre-existing decisions not yet entered in this registry.
D-152 through D-153: Pre-existing decisions not yet entered in this registry.
D-156 through D-162: Pre-existing or open decisions not yet entered in this registry.

D-163 through D-169: Numbers occupied in decisions-active.md by pre-existing decisions. Registry rows corrected 2026-04-14 to reflect decisions-active content. Prior registry entries for these numbers (Workflow Entry Point Completeness, Admin Hub Consolidation, Workstream optional, Division filter, Workstream filter, Claude Code debate, source tagging) are now registered as D-310 through D-315 and D-201.

These gaps are not available for allocation — the numbers exist in decisions-active.md or
decisions-archive.md. They are listed here to prevent accidental reuse. A future session
should back-fill these rows if the full registry is needed.

---

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | April 2026
