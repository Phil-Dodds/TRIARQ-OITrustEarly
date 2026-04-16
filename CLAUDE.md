<!-- CLAUDE.md — Pathways OI Trust | v2.1 | April 2026 -->
<!-- Version history:
  v1.0 March 2026: Initial file. Design Session A. Arch rules, security, coding standards, design tokens. Source: D-93, D-130–D-153.
  v1.1 2026-04-14: Added Output Style — Caveman Mode. Source: D-325.
  v2.1 2026-04-15: Rationale block labels updated per D-334 and D-335.
    Question/Root → Why. Balance/Dirt → Considered/Downsides.
    Source: Governance session 2026-04-15.
  v2.0 2026-04-15: Merged claude-code-session-rules.md into CLAUDE.md (D-327). 598 → 243 lines.
    Removed: Security Requirements (→ Build B spec), What You Are Building, What This File Does NOT Contain,
    Session Close Checklist (consolidated into rules), Rule 10 trigger phrase duplicate, Blocked Action UX
    (covered by S-001 in standards-summary.md), No Bare Generic Nouns (covered by S-003 in standards-summary.md),
    Arch-3 Skills Layer (Build B concern — no /skills/ directory yet).
    Added: Build and Test Commands, HTML comment rationale blocks, D-326 Trigger A (Rule 16).
    Corrected: .docx → .md file references, build-a-spec → build-c-spec, ionic.theme.map.scss pending D-IonicVsAngularMaterial.
    Governance: reviewed against Boris Cherny, HumanLayer/Dex Horthy best practices. Known deliberate divergences documented in D-327.
-->

# CLAUDE.md — Pathways OI Trust | v2.1 | April 2026 | CONFIDENTIAL

---

## Session Initialization

Read these documents in order before writing any code or calling any tool. Verify each exists at the expected path — if any are missing, stop and report before proceeding.

1. `docs/standards-summary.md`
2. `docs/decision-registry.md`
3. Current build spec (e.g. `docs/build-c-spec.md`)

Read decision-registry.md for content lookup only. Never claim or assign a D-number — D-number assignment happens outside Code sessions.

---

## Build and Test Commands

- Build: `ng build`
- Test: `ng test`
- Deploy: push to master → GitHub Pages auto-deploys; Render deploys on push

---

## Architectural Rules — Non-Negotiable

<!-- Why these exist: violations here produce data loss, security holes, or broken ports — not just bad code.
     Each rule has caused or would cause a production failure if violated. -->

Violating any of these is an error, not a style preference.

### Arch-1 — MCP-Only Database Access
<!-- Failure mode prevented: direct Supabase calls from Angular expose the service key to the browser
     and bypass all access control. One violation = credentials leak. -->
All database operations go through MCP servers. No direct Supabase client calls from Angular components or services. No exceptions.
- NEVER: import @supabase/supabase-js in any Angular component or service
- NEVER: bypass the MCP layer for "simple" reads

### Arch-2 — UI as Presentation Layer Only
<!-- Failure mode prevented: business logic in components cannot be tested in isolation and
     breaks the port-time architecture separation. -->
Angular components render what they receive. No business logic, prompts, or data access in components.
- NEVER: put prompt text or business rules in any component or service

### Arch-3 — No Prompts in TypeScript
<!-- Failure mode prevented: prompts hardcoded in TypeScript are invisible to the governance layer
     and cannot be updated without a code deploy. Build B ships the /skills/ layer. -->
NEVER put prompt text in TypeScript files, Angular components, or services.

### Arch-4 — Environment Variables Only
<!-- Failure mode prevented: hardcoded credentials committed to git = immediate security incident. -->
All credentials, keys, and configuration are environment variables. Never hardcode them.

Required environment variables (never in source code):
- VERTEX_PROJECT_ID, VERTEX_LOCATION, VERTEX_MODEL, VERTEX_EMBEDDING_MODEL
- SUPABASE_URL
- SUPABASE_SERVICE_KEY (MCP servers only — never exposed to Angular)
- SUPABASE_ANON_KEY (Angular app only)
- RENDER_INTERNAL_API_KEY (MCP server auth)
- NEVER: commit .env files or log environment variable values

### Arch-5 — JWT Validation on Every MCP Tool Call
<!-- Failure mode prevented: without JWT validation first, any unauthenticated caller can
     read or write data by hitting the MCP endpoint directly. -->
Every MCP server validates the Supabase JWT before executing any tool. No tool executes without a valid JWT.
- Validate JWT as the first operation in every tool handler
- Return 401 with clear error message on invalid JWT
- Extract user_id and check Division access from JWT claims
- NEVER: execute any database operation before JWT validation

### Arch-6 — Soft Delete Only
<!-- Failure mode prevented: hard deletes permanently destroy audit trail and OI Library records.
     Healthcare governance requires permanent record retention. -->
Never hard delete records. Set deleted_at timestamp. Records with deleted_at are excluded from all queries by default.
- Set deleted_at = now() for all delete operations
- Add WHERE deleted_at IS NULL to every SELECT on soft-deletable tables
- NEVER: use DELETE SQL on any production table

---

## Coding Standards

<!-- These are implementation conventions. They don't prevent failures but ensure consistency
     across sessions. Move to agent_docs/coding-standards.md at next governance review (D-GoverningDocReviewProcess). -->

**TypeScript:** Strict mode. No `any` without justification in a comment. All MCP tool parameters, return types, and database table shapes are fully typed interfaces in /types/database.ts.

**Angular:** Standalone components preferred. OnPush change detection on all components. Reactive forms only. No logic in templates beyond simple conditionals and pipes.

**Node.js MCP Servers:** Express.js for HTTP layer. All tool handlers are async with try/catch. All errors return `{ success: false, error: string }` — never throw to HTTP layer. Log all tool calls with: tool_name, user_id, division_id, timestamp, duration_ms. Never log JWT values, file content, or personal data.

**Tests:** Generate alongside every code file — not after. Tests validate acceptance criteria from the build spec, not just that code runs. Every MCP tool: at least one happy path and one error path test. Angular components: test correct data is displayed, not implementation details.

**Database:** Parameterized statements only — no string interpolation in SQL. WHERE deleted_at IS NULL on every SELECT on soft-deletable tables. Transactions for multi-step operations. created_at and updated_at on every new table.

---

## Native Federation Remote Configuration

<!-- Move to agent_docs/native-federation.md at next governance review (D-GoverningDocReviewProcess).
     Port-time rationale: D-263. AppModule/standalone compatibility: verify before Build B (D-AppModuleStandaloneVerification). -->
- @angular-architects/native-federation installed; Exposed module: AppModule
- All routes are relative — no hardcoded absolute paths
- Feature modules are lazy-loaded: OILibraryModule, AdminModule, ChatModule, DeliveryModule
- NEVER: use APP_BASE_HREF with an absolute path or import feature modules eagerly

---

## Design Token Rules

<!-- Move to agent_docs/design-tokens.md at next governance review (D-GoverningDocReviewProcess).
     ionic.theme.map.scss status pending D-IonicVsAngularMaterial resolution — do not add or remove until Design instructs.
     --triarq-text-h2 corrected to 60px in this version (was 20px data entry error in token file — fix token file directly). -->
- Import triarq.tokens.v1.css in styles.scss
- Use --triarq-* CSS variables for all color, spacing, and typography values
- --triarq-text-h2: 60px
- Radius: cards = 10px, buttons = 5px, inputs = 5px, pills = 999px
- Sidebar active: --triarq-color-primary (#257099) left border indicator
- Font: Roboto — not Gill Sans or Lato

---

## Output Style — Caveman Mode

<!-- Why: long verbose responses in Code sessions consume context window and bury the signal.
     Exceptions exist for rule-driven outputs (session close artifacts) and safety-critical confirmations. -->
Communicate in compressed caveman style at all times. Drop articles (a/an/the),
filler words (just/really/basically/actually), pleasantries (sure/certainly/happy to),
and hedging. Fragments OK. Arrows for causality (X → Y).

Technical content passes through untouched: code blocks, file paths, commands, error
messages, URLs, technical terms.

Exception: any output produced in direct response to a standing instruction or rule
is written in full. If a rule told you to produce it, write it fully.

Suspend for: security warnings, irreversible action confirmations, multi-step sequences
where fragment order risks misread. Resume after.

---

## Session Rules

<!-- Rules 1–5: behavioral. Rules 6–18: process with binary compliance tests.
     All rules are standing requirements — active from session start without re-prompting. -->

### Rule 1 — First Principles before significant decisions.
<!-- Origin: large implementations without upfront reduction repeatedly produced wrong-direction builds.
     First Principles is a thinking discipline, not just an artifact gate. -->
Before any significant decision or large implementation — new table, new component architecture, new MCP tool set, significant refactor — apply Context → Question → Reduce → Simplify → Automate. Do not lock a direction until Steps 1–3 complete.

### Rule 2 — Push back without being prompted.
<!-- Origin: Code silently building against directions that conflicted with locked decisions
     produced correction contracts. Flag the conflict when you see it, not after the code is written. -->
Flag disagreements, risks, and conflicts with locked decisions in the same response — not after code is written. If a request conflicts with a locked decision, design principle, or these architectural rules, flag it immediately and explicitly.

### Rule 3 — Track decisions and feed them back.
<!-- Origin: implementation decisions made in Code sessions that were never recorded were
     treated as spec violations in the next correction pass and overwritten. -->
Track implementation decisions in CodeClose format during session. At session close, produce the decision record. Canonical documents are not Code's to edit — surface decisions and changes, don't apply them directly.

### Rule 4 — Never construct identifiers dynamically.
<!-- Origin: dynamically constructed screen keys caused identifier collisions and made
     codebase-wide search for a key impossible. -->
Screen keys, event type strings, entity type labels, any stable system identifier: declared as named constants. Never constructed from runtime variables or string concatenation. Define once, reference everywhere.

### Rule 5 — Implement patterns at build time.
<!-- Origin: screens shipped without established patterns required dedicated retrofit contracts.
     Pattern is in standards-summary.md — apply it when building the surface, not after. -->
When a pattern is declared in standards-summary.md as universally applicable, apply it to every new screen and component when built. If a screen ships without the pattern, flag it explicitly — do not silently omit.

### Rule 6 — Confirm Spec Before Implementing Any Component or Screen
<!-- Origin: components built from session-brief decision summaries alone consistently missed
     field sets, interaction patterns, and layout rules that only existed in the spec document.
     A component built without its spec requires a full correction pass, not a patch. -->

Before implementing any new component, screen, or form, confirm the governing
spec document is available and re-read it immediately before writing code. Do
not infer field sets, field order, interaction patterns, or layout from partial
context, prior session memory, or the component's name alone.

If the governing spec document is not present in the documents listed in Session Initialization:
1. Stop before implementing that component.
2. Surface a warning: "Spec document for [component name] not found. Cannot
   implement without the spec — proceeding risks building against the wrong
   requirements."
3. Continue with other work. Do not attempt to infer the spec.

### Rule 7 — Record Every Deviation from Spec as a CC-Decision
<!-- Origin: unrecorded improvements were treated as spec violations in the next correction pass
     and overwritten. Recording protects the improvement and makes it reviewable. -->

If what was built differs from what the spec describes — record it as a
CC-decision before session close, even if the built version is better.

Format: what was built / what spec said / why the deviation is an improvement.

### Rule 8 — Conflict Check Before Implementing Any Correction or New Spec
<!-- Origin: correction specs silently overwrote prior CC-decisions, undoing protected improvements.
     The conflict check catches this before implementation, not after. -->

Before implementing any correction spec or new spec touching an existing surface,
run a conflict check against: (1) CC-decisions in the current session's CodeClose
output — these are protected, do not overwrite without surfacing the conflict;
(2) relevant D-numbers in the session-brief — these are locked.

Conflict format: "Conflict found — [spec section] contradicts [CC-decision /
D-number]. Spec says [X]. Existing implementation says [Y]. Which takes
precedence?" Do not resolve unilaterally.

Not a conflict: intentional improvements from session brief instructions —
prototype fidelity targets, design token requirements, principle citations.

### Rule 9 — Pre-Build Component Verification
<!-- Origin: dead files modified in prior sessions caused phantom test failures and confusing diffs.
     A commented-out import is not active — the file is dead until wired. -->

Before modifying any existing component or service file, verify it appears in
at least one active import or route declaration. A commented-out import does not
qualify. If a file fails this check, it is a dead file — record as CC-decision,
surface in CodeClose under "Dead Files Found." Do not modify, refactor, or delete.

### Rule 10 — Dependency Sequencing
<!-- Origin: sections implemented out of dependency order shipped incomplete — Section A called
     Section B's output before Section B existed. Ship dependent sections as a unit. -->

Before proposing implementation order on any multi-section spec, identify
inter-section dependencies and sequence dependent sections as a unit. Dependent
sections ship together — they are not independently shippable. State dependency
reasoning in the implementation plan before beginning work.

### Rule 11 — Behavior Protection During Code Changes
<!-- Origin: consolidation and extraction sessions repeatedly broke confirmed working behavior
     because no test baseline was established before restructuring. The pure-structural /
     logic-touching distinction is the minimum viable safety gate. -->

Triggered when modifying a file containing confirmed working behavior as declared
in the spec or confirmed in the plan review — including consolidations, extractions,
and relocations. New files and new functions are exempt.

Two tiers: (1) Pure structural (logic unchanged, location only) — write tests if
none exist, proceed if confident, note coverage in CodeClose. (2) Logic-touching —
confirmed test baseline required before starting; same tests must pass after.
Declare tier before beginning. If unclear, ask before proceeding: "Pure structural
or will logic change?" Override available: "no test baseline needed."

### Rule 12 — Triggered Structural Read
<!-- Origin: files grew past maintainable thresholds without Code or Phil noticing.
     This rule surfaces structural health passively — no blocking, just reporting. -->

When a spec instructs modification of a file not yet touched this session, before
writing any code: read the file and record (1) current line count, (2) stated
responsibility, (3) whether it exceeds 300 lines (component) or 400 lines (service).
Report in CodeClose under "Structural Health." Do not surface mid-session or block
implementation.

### Rule 13 — Required File Verification at Session Start
<!-- Origin: sessions proceeded on missing files, producing partial implementations
     with no record of what was skipped. Missing file = skip + record, never infer. -->

After reading START-HERE.md and the session brief, identify every file the brief
instructs you to read or modify. Verify each exists at the expected path before
beginning work. If any file is missing: record a CC-decision, skip that task,
complete tasks that don't depend on the missing file, and open the CodeClose with:
`⚠ PARTIAL SESSION — [task name] skipped: [filename] not found at [path].`

### Rule 14 — Plan-Mode Checkpoint
<!-- Origin: sessions that skipped plan review produced implementations that solved
     the wrong problem or conflicted with locked decisions. Plan first, build second. -->

Every session opens with plan mode before touching any files. Produce a written
plan surfacing: gaps in the contract, stated assumptions, conflicts with these
architectural rules or locked decisions. No file modifications until the plan
is explicitly approved.

Binary test: written plan produced before first file modification? Yes = compliant. No = violation.

### Rule 15 — As-Built Document
<!-- Origin: what Code actually built diverged from what Design thought was built.
     as-built.md is the single source of truth for implementation state. -->

At every session close, update `docs/as-built.md`. One section per surface touched.
Format: **Implemented:** [what was built] / **Deviations:** [list or "None"] /
**Open questions:** [list or "None"]. Create if it does not exist.

Binary test: `docs/as-built.md` updated and committed before session close? Yes = compliant. No = violation.

### Rule 16 — CLAUDE.md Candidates
<!-- Origin: Code was updating CLAUDE.md autonomously, creating the same registry divergence
     problem D-317 fixed. Candidates surface the observation; Design decides the action. -->

Every CodeClose output includes a CLAUDE.md Candidates section. Format per candidate: candidate text, why Code would add it, which session moment triggered it. Code does not update this file autonomously — candidates are reviewed and disposed outside Code sessions.

### Rule 17 — CC-Decision Sequence Completeness Check at Code Close
<!-- Origin: gaps in CC-decision sequence left unrecorded decisions that were later
     treated as undocumented spec violations. Enumerate sequence at close — gaps are recoverable then, not later. -->

At every session close, before producing the session output file, enumerate all
CC-decisions in sequence order, confirm no gaps exist, and verify each appears in
the CCode-decisions list in the session output. A gap = a missing decision number —
recover before closing.

Binary test: all CC-decisions enumerated in sequence and verified before session output written? Yes = compliant. No = violation.

### Rule 18 — Supabase Migration Execution Pattern
<!-- Origin: direct migration execution against production Supabase without Phil confirmation
     caused irreversible schema changes. Write → display → confirm is the only safe pattern. -->

Never execute migrations directly against Supabase. Required pattern: (1) write
migration file to repo, (2) display full SQL content, (3) wait for explicit
confirmation before proceeding.

Binary test: every migration followed write → display → confirm? Yes = compliant. Any direct execution = violation.

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | April 2026 | v2.1*
