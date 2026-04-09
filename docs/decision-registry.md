# Decision Registry — Pathways OI Trust
# Pathways OI Trust | April 2026 | CONFIDENTIAL
# Authoritative source for decision number allocation.
# Feed to Claude Chat at the start of any design session so it knows the current next-available number.
# Claude Code reads this file before allocating any new D-number.

---

## Next Available Decision Number

**Next available: D-208**

Before claiming a number — Claude Code or Claude Chat — confirm this field and claim the next
sequential number. Claude Code updates this field in the same commit that writes the decision.
Claude Chat states the number it is claiming; Phil asks Claude Code to commit and update in the
next code session.

---

## Collision Protocol

If Claude Code opens this registry and finds that the next-available number is already claimed
in decisions-active.md by a different decision, it must:
1. Take the next unclaimed number
2. Add a `COLLISION` note to the registry row for the conflicting number
3. Surface the collision to Phil before committing

Collisions are expected (Claude Chat operates outside the repo). They are resolved by
renumbering the lower-priority entry and updating any cross-references.

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
| D-163 | Workflow Entry Point Completeness | Claude Chat | April 2026 | Active |
| D-164 | Admin Hub Consolidation | Claude Chat | April 2026 | Active |
| D-165 | Workstream optional at creation; required at Brief Review gate | Claude Code | April 2026 | Active |
| D-166 | Division filter on dashboard with include-child-divisions toggle | Claude Code | April 2026 | Active |
| D-167 | Workstream filter: no-workstream and inactive as separate options | Claude Code | April 2026 | Active |
| D-168 | Claude Code mandatory debate/question before building | Claude Code | April 2026 | Active |
| D-169 | Decision source tagging and registry protocol | Claude Code | April 2026 | Active |
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

These gaps are not available for allocation — the numbers exist in decisions-active.md or
decisions-archive.md. They are listed here to prevent accidental reuse. A future session
should back-fill these rows if the full registry is needed.

---

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | April 2026
