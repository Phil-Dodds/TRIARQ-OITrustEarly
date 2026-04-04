# OI Trust — AI Session Orchestration Design
# Memo to Claude Chat | From Claude Code Session 2026-04-04
# Status: Proposal — Claude Chat feedback requested before implementation

---

## Why This Exists

Phil has been running two parallel AI workflows without a structured bridge:

- **Claude Chat** — strategy, architecture, canonical decisions, document management
- **Claude Code** — implementation, repo access, build execution

Both are producing valuable output. The problem: decisions made in Claude Chat
don't reliably reach Claude Code. Implementation decisions made in Claude Code
don't reliably reach Claude Chat. Sessions on both sides run long because they
lack scope boundaries and clear close conditions.

This memo describes a proposed bridge. Claude Chat's feedback is needed before
anything is implemented — specifically on whether this conflicts with how Claude
Chat has been operating and what is missing from the Claude Chat side.

---

## What Claude Code Knows That Claude Chat Doesn't

**Current implementation state:**
- Migration 025 ran (cycle_owner_user_id dropped from delivery_cycles)
- WorkstreamPickerComponent built and deployed
- Create Cycle form redesigned with full field set
- DS/CB gate enforcement live in submit_gate_for_approval MCP tool
- list_delivery_workstreams has scope params (division_tree/trust/user_divisions/all)
- cc-decisions-active.md created with CC-001 through CC-006

**Current devStatus:**
- Home: uat | Delivery Cycle Tracking: uat | Contact Admin: uat | Admin: uat
- OI Library: not-started | Chat: not-started

**CC-decisions that may need D-numbers:**
- CC-002: Workstream Picker design
- CC-004: Rich Create Cycle form field order and DS auto-assign pattern
- CC-006: Drop cycle_owner_user_id; DS/CB nullable at creation, enforced at gate

**Pending Build C items needing design input:**
- Workstream detail view (CC-003 — needs design session)
- DS/CB user picker (no list_users MCP tool exists; assignment deferred to detail view)
- Tier definitions (what T1/T2/T3 means operationally)
- CB assignment flow on cycle detail

---

## What Claude Chat Knows That Claude Code Doesn't

- Full canonical D-decision history and rationale
- Product strategy and stakeholder context beyond the build spec
- Build sequence: A → C → B → D → E → F and why
- The Claude Chat session type design (Design, Document Updater, Validator)
- The zip-based file handoff workflow between Chat sessions
- OI Trust vision beyond Build C scope

---

## The Problem With the Current Workflow

**Sessions drift and run too long.** Without a clear scope boundary and a defined
close condition, Claude Code sessions expand to fill available time. Design
conversations happen inside Claude Code sessions (which can read the repo)
instead of in Claude Chat (which is the right venue for design). Context fills,
responses degrade.

**Decisions fall into gaps.** Implementation decisions made in Claude Code (CC-xxx)
don't automatically reach Claude Chat. Architectural decisions made in Claude Chat
don't automatically reach Claude Code with the right specificity to build from.
Phil carries information between them manually and imperfectly.

**No structured handoff.** When a Claude Code session ends, Phil has no standard
output to carry to Claude Chat. When a Claude Chat session ends, Phil has no
standard input to give Claude Code. Each session starts from a cold, expensive
reconnaissance phase.

---

## The Proposed Solution

### Three Claude Code Session Types

**Implementation Session** (most common — short and focused)
- Input: session-brief-[datetime].md specifying exact scope and files
- Does: bounded code changes, no design discussions
- Output: session-output-[datetime].md committed to repo
- Closes with: verbal announcement of next step
- Goes to: next Claude Code session (via repo) OR Claude Chat (Phil hands file)

**Orchestration Session** (less common — coordinates implementation agents)
- Input: build plan from Claude Chat
- Does: reads repo, breaks plan into tasks, spawns implementation agents
- Output: status update + aggregated session output
- Goes to: Claude Chat for plan update

**Analysis Session** (occasional — answers a repo question)
- Input: a specific question about current code state
- Does: reads code, produces answer document
- Output: analysis document Phil hands to Claude Chat Design Session
- Does NOT implement anything; closes before implementation begins

### The File Flow

**Within Claude Code — repo carries everything:**
```
Session ends → output committed to .claude/sessions/ in repo
Next session starts → reads from repo
Phil hands nothing between Claude Code sessions
```

**Crossing the boundary — Phil hands files:**

| Transition | Phil hands |
|---|---|
| Chat → Code | session-brief-[datetime].md |
| Code → Chat | session-output-[datetime].md + relevant canonical files |

### The Two Standard Files

**session-brief-[datetime].md** (Claude Chat generates, Phil hands to Claude Code)
```
Scope: what this session builds — one paragraph
Files to read: exact list, Claude Code reads nothing else
Decisions in effect: only the ones relevant to this scope
Acceptance checklist: line-item definition of done
Pre-answered design questions: no open questions during implementation
Prerequisites: migrations to run, env vars to set
```

**session-output-[datetime].md** (Claude Code generates at close, committed to repo)
```
Next Step: RETURN TO CLAUDE CHAT or CONTINUE IN CLAUDE CODE
What was built: file-by-file
What was NOT built: with reasons
Decisions made: CC-xxx entries
Flags for Claude Chat: strategic questions, conflicts, D-number recommendations
DevStatus recommendations
Suggested Claude Chat instruction changes: copy-pasteable
If continuing in Claude Code: next session brief embedded here
```

### START-HERE.md — The Index File

A single file at repo root that any AI session reads first.
Eliminates the need for Phil to explain context at session start.

```
Project: OI Trust — what it is in 2 sentences
Build status: current build, what's done, what's active
Canonical files: what exists and what each one covers
Session types: what to hand each type
Last session output: pointer to most recent
```

Lives in the repo. Also included in the zip Phil hands to Claude Chat.
Updated at the close of every session.

---

## Where Files Live

**In the repo** (Claude Code reads directly):
```
CLAUDE.md                          — project rules, permanent
claude-code-session-rules.md       — behavioral rules for Claude Code
cc-decisions-active.md             — Claude Code implementation decisions
START-HERE.md                      — project index, updated every session
docs/canonical/                    — canonical files (proposed move from zip)
docs/ai-sessions/                  — Claude Chat session type instructions
.claude/sessions/                  — session briefs and outputs, committed
.claude/memory/                    — cross-session memory (already exists)
```

**In the zip** (Claude Chat reads via Phil handoff):
```
START-HERE.md                      — same file, copy from repo
docs/canonical/*                   — same files as repo
session-output-[datetime].md       — most recent Claude Code output
```

The zip is generated from the repo before each Claude Chat session.
The repo is always the source of truth.
Claude Chat cannot access the repo directly — always works from files Phil hands.

---

## The Canonical Files Question

Currently the canonical files Phil hands Claude Chat live outside the repo —
in a zip Phil has been maintaining. This creates a sync problem: Claude Code
makes implementation changes, but the canonical files Claude Chat uses don't
reflect them until Phil manually carries the information.

**Proposed:** move canonical files to `docs/canonical/` in the repo.
The zip becomes a packaging step — Claude Code or a script generates the zip
from repo files immediately before Phil starts a Claude Chat session.
The files are always current. The sync problem is eliminated.

**What needs to move:**
- decisions-active.md
- master-build-plan.md
- build-c-spec.md (and future build specs)
- Any other files Phil currently maintains in the zip

This is a one-time migration. Recommend doing it before the TRIARQ repo handover.

---

## For Future Projects

The AI working method (session types, CLAUDE.md skeleton, START-HERE.md template,
session rules, Claude Chat session type instructions) should be extractable as a
template repo. New projects clone the template and fill in project-specific content.
OI Trust is the first instance. The template is extracted from it once the
session management system is stable.

---

## The Open Debate

Claude Code recommends implementing the minimum viable session management system
first — session brief, session output, verbal close, START-HERE.md — and using it
for ten real implementation sessions before building orchestration infrastructure
(agent spawning, orchestrator sessions, automated task assignment).

**The argument for minimum first:**
- Phil is one person with one application that needs features built
- The orchestration infrastructure solves a future problem (multiple people,
  parallel streams) that doesn't exist yet
- Every session spent designing infrastructure is a session not spent on Build C
- The actual pain points (drift, lost decisions, unclear next steps) are solved
  by the minimum system

**The argument for building it now:**
- Designing the system while actively using it is harder than designing it first
- The TRIARQ handover is coming and the system should be in place before
  new people join
- Getting the architecture right now prevents a refactor later

Claude Chat's view on this tradeoff is the primary feedback requested.

---

## Specific Feedback Requested from Claude Chat

**1. Does the session-brief format conflict with how Claude Chat currently produces output?**
The brief needs to be something Claude Chat naturally generates at Design Session close.
If the current output format is different, what would need to change?

**2. Should CC-002, CC-004, CC-006 be canonized as D-decisions?**
These are architectural decisions made during implementation. Claude Chat should
determine whether they warrant canonical D-numbers and recording in decisions-active.md.

**3. Is the canonical files migration feasible now?**
Moving docs/canonical/ into the repo requires a Document Updater session to
restructure the canonical files and a Validator session to confirm. Is this
the right moment in the Build C timeline to do that?

**4. What is missing from the Claude Chat side?**
This memo reflects Claude Code's view of the gap. Claude Chat has context
Claude Code doesn't. What would Claude Chat add, change, or flag as incorrect?

**5. Minimum vs. full system — what does Claude Chat recommend?**
Given the full Build C feature backlog and the TRIARQ timeline, what's the
right investment level in session management infrastructure right now?

---

## Build C Feature Backlog (for Claude Chat's build planning)

**Implemented and deployed:**
- Workstream Picker (CC-002)
- Create Cycle form redesign (CC-004)
- DS/CB gate enforcement (CC-006)
- list_delivery_workstreams scope params (CC-005)
- cycle_owner_user_id dropped (CC-006, migration 025)

**Pending — needs implementation session:**
- DS/CB edit panel on cycle detail (assign after creation)
- CB assignment flow

**Pending — needs design session first:**
- Workstream detail view (CC-003)
- Tier definitions (T1/T2/T3 operational meaning)
- DS/CB user picker component (requires list_users MCP tool)

**Pending — Build C acceptance criteria not yet met:**
- See build-c-spec.md Section 8 for full list

---
Source: Claude Code session 2026-04-04 | Build C active
Committed to repo: .claude/sessions/session-output-2026-04-04.md
