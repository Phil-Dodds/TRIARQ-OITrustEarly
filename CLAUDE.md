<!-- CLAUDE.md — Pathways OI Trust | v2.3 | April 2026 -->
<!-- Version history:
  v1.0 March 2026: Initial file. Design Session A. Arch rules, security, coding standards, design tokens. Source: D-93, D-130–D-153.
  v1.1 2026-04-14: Added Output Style — Caveman Mode. Source: D-325.
  v2.0 2026-04-15: Merged claude-code-session-rules.md into CLAUDE.md (D-327). 598 → 243 lines.
    Removed: Security Requirements (→ Build B spec), What You Are Building, What This File Does NOT Contain,
    Session Close Checklist (consolidated into rules), Rule 10 trigger phrase duplicate, Blocked Action UX
    (covered by S-001 in standards-summary.md), No Bare Generic Nouns (covered by S-003 in standards-summary.md),
    Arch-3 Skills Layer (Build B concern — no /skills/ directory yet).
    Added: Build and Test Commands, HTML comment rationale blocks, D-326 Trigger A (Rule 16).
    Corrected: .docx → .md file references, build-a-spec → build-c-spec, ionic.theme.map.scss pending D-IonicVsAngularMaterial.
    Governance: reviewed against Boris Cherny, HumanLayer/Dex Horthy best practices. Known deliberate divergences documented in D-327.
  v2.1 2026-04-15: Rationale block labels updated per D-334 and D-335.
    Question/Root → Why. Balance/Dirt → Considered/Downsides.
    Source: Governance session 2026-04-15.
  v2.2 2026-04-17: Added Rule 23 (D-333 Template Conformance Check). Source: D-336, Session 2026-04-17.
  v2.3 2026-04-18: D-333 template retrofit on Rules 1–18. Rules 9 and 13 retired. Rule 15 suspended.
    Rule 14 approval requirement removed (D-240 amendment). Rule 4 scope narrowed to screen keys.
    Rule 23 table row 4 reworded. Source: D-337, Session 2026-04-18.
-->

# CLAUDE.md — Pathways OI Trust | v2.3 | April 2026 | CONFIDENTIAL

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

Before any significant decision or large implementation, apply Context → Question → Reduce → Simplify → Automate. Do not lock a direction until Steps 1–3 complete.

**Conformance test:** For every new table, new component architecture, new MCP tool set, or significant refactor this session, does CodeClose record that Context → Question → Reduce → Simplify → Automate was applied before locking direction? Yes = pass. Any trigger item with no First Principles record = violation.

**Exceptions:** None.

<!-- RATIONALE:
     Why: Large implementations without upfront reduction repeatedly produced
       wrong-direction builds requiring full correction contracts. First Principles
       is a thinking discipline — not just an artifact gate.
     Considered: Requiring a written First Principles document for every trigger
       (rejected — too heavy for small tables and minor refactors); no trigger list,
       purely judgment-based (rejected — not binary-testable); named trigger list
       with CodeClose record obligation (chosen).
     Downsides: "Significant refactor" remains partially interpretive. Code must
       self-report. Watch for: CodeClose entries that claim First Principles was
       applied with no supporting reasoning. -->
<!-- GOVERNING: D-130, D-201 -->

### Rule 2 — Push back without being prompted.

Flag disagreements, risks, and conflicts with locked decisions in the same response — not after code is written. If a request conflicts with a locked decision, design principle, or these architectural rules, flag it immediately and explicitly.

**Conformance test:** For every conflict with a locked decision, design principle, or architectural rule encountered this session, was it flagged in the same response before code was written? Yes = pass. Any conflict flagged after code was written, or not flagged at all = violation.

**Exceptions:** None.

<!-- RATIONALE:
     Why: Code silently building against locked decisions produced correction
       contracts. Flagging in the same response — before code is written — is the
       only point at which the conflict is recoverable without a full correction pass.
     Considered: Blocking implementation until Phil resolves the conflict
       (rejected — too heavy, many conflicts are resolvable with a clarification);
       flagging at session close after code is written (rejected — correction
       contract required to undo); flagging in the same response while continuing
       implementation (chosen — Phil can redirect immediately, and if the flag
       was wrong no harm done).
     Downsides: Self-reporting limitation. Code can only confirm it flagged what
       it recognized. Unrecognized conflicts are not caught by this rule — they
       surface in UAT or the next Design session. Watch for: CodeClose outputs
       with no Rule 2 flags across a full session — either a clean session or
       a compliance gap. -->
<!-- GOVERNING: D-130 -->

### Rule 3 — Track decisions and feed them back.

Track implementation decisions in CodeClose format during session. At session close, produce the decision record.

**Conformance test:** Does the CodeClose output contain a CC-decisions section with every implementation decision made this session? Yes = pass. Any implementation decision not recorded in CodeClose = violation.

**Exceptions:** None.

<!-- RATIONALE:
     Why: Implementation decisions made in Code sessions that were never recorded
       were treated as spec violations in the next correction pass and overwritten.
       Recording protects the decision and makes it reviewable by Design.
     Considered: Code editing canonical documents directly to record decisions
       (rejected — D-317 prohibits Code from assigning D-numbers); verbal summary
       at session close without structured format (rejected — not actionable for
       Design); CodeClose CC-decisions section with structured format (chosen —
       Design can assign D-numbers and route to Document Author in one pass).
     Downsides: Code must self-identify what counts as an implementation decision.
       Judgment calls that seem minor may go unrecorded. Watch for: CodeClose
       outputs with no CC-decisions across a session where new surfaces were built —
       likely a compliance gap, not a clean session. -->
<!-- GOVERNING: D-317, D-332 -->

### Rule 4 — Never construct screen keys dynamically.

Screen keys for filter and sort memory persistence are declared as named constants in the format `[module].[screen]`. Never constructed from runtime variables or string concatenation. Define once, reference everywhere.

**Conformance test:** Does any screen key appear constructed from runtime variables or string concatenation anywhere in code written this session? Yes = violation. All screen keys declared as named constants = pass.

**Exceptions:** None.

<!-- RATIONALE:
     Why: Dynamically constructed screen keys caused identifier collisions in the
       filter and sort memory system (D-171) and made codebase-wide search
       impossible — a string never written whole cannot be found by grep.
     Considered: Screen key constants per module (rejected — same key declared
       multiple times across modules, divergence guaranteed); dynamic construction
       with naming convention (rejected — not enforceable, grep still broken);
       named constant declared once, referenced everywhere (chosen).
     Downsides: This rule is a temporary home for a surface-specific constraint
       that belongs in a permanent surface spec. Reliable delivery of surface
       constraints to Code is an open architecture question pending GDA-IMPLEMENT
       (D-ExecutionMemoryArchitecture, Q-SSA-1 through Q-SSA-9). Linter or hook
       enforcement would be more reliable — flagged for D-HooksDesign review. -->
<!-- GOVERNING: D-171 -->

### Rule 5 — Implement patterns at build time.

When a pattern is declared in any Session Initialization document as universally applicable, apply it to every new screen and component when built. If a screen ships without the pattern, flag it explicitly — do not silently omit.

**Conformance test:** For every new screen or component built this session, does CodeClose confirm each applicable Active Standard from the Session Initialization documents was applied or explicitly flagged as omitted with a candidate entry? Yes = pass. Any screen shipped without confirmation = violation.

**Exceptions:** None.

<!-- RATIONALE:
     Why: Screens shipped without established patterns required dedicated retrofit
       contracts to correct. Applying the pattern at build time costs nothing;
       retrofitting costs a full correction pass.
     Considered: Applying patterns as a retrofit after UAT flags them (rejected —
       retrofit cost is a full correction contract); leaving pattern application
       to per-surface spec judgment (rejected — inconsistent application across
       sessions); universal application at build time with explicit flag on omission
       (chosen — omissions are visible, not silent).
     Downsides: Code must read Session Initialization documents and self-identify
       which standards apply to each surface. Misidentification is not caught by
       the conformance test. Watch for: CodeClose confirmations that list no
       applicable standards for a surface that clearly has them. -->
<!-- GOVERNING: D-216, D-231 -->

### Rule 6 — Confirm Spec Before Implementing Any Component or Screen

Before implementing any new component, screen, or form, confirm the governing
spec document is available and re-read it immediately before writing code. Do
not infer field sets, field order, interaction patterns, or layout from partial
context, prior session memory, or the component's name alone.

If the governing spec document is not present in the Session Initialization documents:
1. Stop before implementing that component.
2. Surface a warning: "Spec document for [component name] not found. Cannot
   implement without the spec — proceeding risks building against the wrong
   requirements."
3. Continue with other work. Do not attempt to infer the spec.

**Conformance test:** Was the governing spec document confirmed present and re-read immediately before writing code for every new component, screen, or form this session? Yes = pass. Any component implemented without spec confirmation = violation.

**Exceptions:** None.

<!-- RATIONALE:
     Why: Components built from session-brief decision summaries alone consistently
       missed field sets, interaction patterns, and layout rules that only existed
       in the spec document. A component built without its spec requires a full
       correction pass, not a patch.
     Considered: Trusting Code to infer spec requirements from decisions and
       prior session memory (rejected — consistently produced incomplete
       implementations); spec confirmed present in Session Initialization documents
       before any implementation begins (chosen — spec travels with the session,
       confirmation is a read operation).
     Downsides: Depends on Design placing the correct spec in Section H. If the
       spec is missing from the session zip, Code stops — correct behavior but
       the session is partially blocked. This is a symptom of the surface spec
       routing question pending GDA-IMPLEMENT, not a flaw in this rule. -->
<!-- GOVERNING: D-Code-SpecFirst -->

### Rule 7 — Record Every Deviation from Spec as a CC-Decision

If what was built differs from what the spec describes — record it as a
CC-decision before session close, even if the built version is better.

Format: what was built / what spec said / why the deviation is an improvement.

**Conformance test:** Does the CodeClose output contain a CC-decision entry for every deviation from spec this session? Yes = pass. Any unrecorded deviation = violation.

**Exceptions:** None.

<!-- RATIONALE:
     Why: Unrecorded improvements were treated as spec violations in the next
       correction pass and overwritten. Recording protects the improvement and
       makes it reviewable by Design — an improvement that isn't recorded is
       indistinguishable from a mistake.
     Considered: Allowing undocumented improvements when obviously better
       (rejected — "obviously better" is not recoverable across sessions);
       requiring Design approval before any deviation (rejected — too heavy);
       record every deviation in CodeClose regardless of quality judgment
       (chosen — Design adjudicates, Code records).
     Downsides: Code must self-identify deviations. A deviation Code doesn't
       recognize as a deviation goes unrecorded. Watch for: CodeClose outputs
       with no CC-decisions across a session where new surfaces were built
       against an existing spec — either a clean session or a recognition gap. -->
<!-- GOVERNING: D-Code-CCDecisionRecord, D-332 -->

### Rule 8 — Conflict Check Before Implementing Any Correction or New Spec

Before implementing any correction spec or new spec touching an existing surface,
run a conflict check against: (1) CC-decisions in the current session's CodeClose
output — these are protected, do not overwrite without surfacing the conflict;
(2) relevant D-numbers in the session-brief — these are locked.

Conflict format: "Conflict found — [spec section] contradicts [CC-decision /
D-number]. Spec says [X]. Existing implementation says [Y]. Which takes
precedence?" Do not resolve unilaterally.

Not a conflict: intentional improvements from session brief instructions —
prototype fidelity targets, design token requirements, principle citations.

**Conformance test:** Before implementing any correction or new spec touching an existing surface this session, was a conflict check run against current CC-decisions and session-brief D-numbers? Yes = pass. Any implementation without a conflict check = violation.

**Exceptions:** None.

<!-- RATIONALE:
     Why: Correction specs silently overwrote prior CC-decisions, undoing
       protected improvements. The conflict check catches this before
       implementation — after is too late without a further correction pass.
     Considered: Trusting spec to supersede all prior CC-decisions automatically
       (rejected — Design cannot know which CC-decisions exist at spec authoring
       time); requiring Design to explicitly list protected CC-decisions in every
       spec (rejected — adds authoring burden); Code runs conflict check before
       implementing, surfaces conflicts before writing code (chosen).
     Downsides: Conflict check only covers current session CC-decisions, not
       historical ones from prior sessions still operative in the codebase.
       Watch for: prior-session CC-decisions that are not in the current CodeClose
       but are still operative — this rule does not catch those. -->
<!-- GOVERNING: D-Code-ConflictCheck -->

<!-- Rule 9 RETIRED 2026-04-18. Pre-Build Component Verification suspended —
     static import analysis produces too many false positives in Angular/Native Federation
     (lazy loading, remotes, barrel files, DI tokens). Redesign pending D-TestingComplianceGap
     resolution. See deferred item D-Rule9-Suspended. -->

### Rule 10 — Dependency Sequencing

Before proposing implementation order on any multi-section spec, identify
inter-section dependencies and sequence dependent sections as a unit. Dependent
sections ship together — they are not independently shippable. State dependency
reasoning in the implementation plan before beginning work.

**Conformance test:** Does the implementation plan produced at session start state inter-section dependencies and sequence dependent sections as a unit before any code is written? Yes = pass. No dependency reasoning stated on a multi-section spec = violation.

**Exceptions:** Single-section specs with no inter-section dependencies — state "no dependencies" explicitly in the plan.

<!-- RATIONALE:
     Why: Sections implemented out of dependency order shipped incomplete —
       Section A called Section B's output before Section B existed, producing
       runtime failures requiring a correction pass to fix sequencing, not logic.
     Considered: Leaving sequencing to Code's judgment without obligation to
       state it (rejected — silent sequencing errors are invisible until runtime);
       requiring Design to specify implementation order in the spec (rejected —
       Design cannot always anticipate Code-level dependencies); Code states
       dependency reasoning in the plan before implementation begins (chosen).
     Downsides: Adds overhead for simple single-section specs. The Exceptions
       clause handles this — "no dependencies" is a valid and lightweight statement.
       Watch for: plans that list sections without any dependency statement —
       that is a compliance gap, not a clean plan. -->
<!-- GOVERNING: D-222 -->

### Rule 11 — Behavior Protection During Code Changes

Triggered when modifying a file containing confirmed working behavior as declared
in the spec or confirmed in the plan review — including consolidations, extractions,
and relocations. New files and new functions are exempt.

Two tiers: (1) Pure structural (logic unchanged, location only) — note coverage in CodeClose. (2) Logic-touching — confirmed test baseline required before starting; same tests must pass after.
Declare tier before beginning. If unclear, ask before proceeding: "Pure structural
or will logic change?" Override available: "no test baseline needed."

**Conformance test:** For every logic-touching modification this session, was a confirmed test baseline established before starting and verified passing after? Yes = pass. Any logic-touching modification without a test baseline = violation.

**Exceptions:** Phil declares "no test baseline needed" — override logged in CodeClose.

<!-- RATIONALE:
     Why: Consolidation and extraction sessions repeatedly broke confirmed working
       behavior because no test baseline was established before restructuring.
     Considered: Single tier requiring test baseline for all modifications including
       pure structural (rejected — too heavy for location-only moves); no tier
       distinction (rejected — not binary-testable); two tiers with explicit
       declaration before beginning (chosen).
     Downsides: Depends on tests existing to form a baseline. No .spec.ts files
       currently exist in the repo (D-TestingComplianceGap — PRIORITY deferred item).
       Logic-touching modifications cannot fully comply until testing is established.
       This rule is partially suspended until the testing gap is resolved. Watch for:
       sessions declaring "pure structural" for changes that touch logic. -->
<!-- GOVERNING: D-224 -->

### Rule 12 — Triggered Structural Read

When a spec instructs modification of a file not yet touched this session, before
writing any code: read the file and record (1) current line count, (2) stated
responsibility, (3) whether it exceeds 300 lines (component) or 400 lines (service).
Report in CodeClose under "Structural Health." Do not surface mid-session or block
implementation.

**Conformance test:** Does CodeClose contain a Structural Health entry for every file instructed for modification this session that had not been previously touched? Yes = pass. Any missing entry = violation.

**Exceptions:** None.

<!-- RATIONALE:
     Why: Files grew past maintainable thresholds without Code or Phil noticing.
       No single session produced the problem — accumulated growth crossed the
       threshold invisibly. Passive reporting surfaces the signal without blocking work.
     Considered: Blocking implementation when thresholds are exceeded (rejected —
       threshold crossing is a signal for Design, not a Code decision); no reporting
       obligation (rejected — threshold crossings remain invisible); passive CodeClose
       report with no mid-session interruption (chosen).
     Downsides: Passive reporting means a file can cross the threshold and stay there
       across multiple sessions before Design acts. Watch for: Structural Health entries
       showing the same file above threshold across consecutive sessions. -->
<!-- GOVERNING: D-225 -->

<!-- Rule 13 RETIRED 2026-04-18. Required File Verification at Session Start retired —
     session briefs do not name specific repo files; they name Section H documents.
     The rule's premise did not match actual brief format. Coverage provided by:
     D-234 (Permanent Reference Documents verification at session start) and
     Rule 6 (spec document presence before implementation). -->

### Rule 14 — Plan-Mode Checkpoint

Every session opens with plan mode before touching any files. Produce a written
plan stating: surfaces in scope, NEW/MODIFICATION classification per surface,
stated assumptions, conflicts with locked decisions or architectural rules.
Proceed after the plan is complete — do not wait for explicit approval unless
Phil instructs otherwise.

**Conformance test:** Was a written plan produced before the first file modification this session? Yes = pass. No = violation.

**Exceptions:** Phil instructs "skip plan" explicitly — logged in CodeClose.

<!-- RATIONALE:
     Why: Sessions that skipped planning produced code that solved the wrong
       problem or conflicted with locked decisions. Plan-first is the cheapest
       correction point — before any code is written.
     Considered: Mandatory human approval before execution (rejected — Phil
       cannot evaluate implementation correctness; approval gate is unworkable;
       not supported by research); no plan obligation (rejected — consistently
       produced wrong-direction builds); self-directed plan before execution
       with Phil able to redirect if he reads it (chosen).
     Downsides: Plan quality depends on spec and session brief quality. A good
       plan against a bad spec still produces the wrong thing. Code proceeds
       without approval — Phil must actively read and redirect if the plan is
       wrong. Watch for: plans produced in the same response as the first file
       modification — that is a violation.
     Research: Anthropic official best practices (code.claude.com/docs/best-practices,
       April 2026): "Letting Claude jump straight to coding can produce code that
       solves the wrong problem. Use Plan Mode to separate exploration from
       execution." Consensus across independent sources: plan-first is
       non-negotiable for production code; human approval gate is not required —
       value is in Code's own structured thinking before execution. One-sentence
       rule: if the diff can be described in one sentence, skip the plan —
       Exceptions clause above covers this. -->
<!-- GOVERNING: D-240, D-280 -->

<!-- Rule 15 SUSPENDED 2026-04-18. As-Built Document suspended pending routing
     mechanism resolution. as-built.md has no reliable path to Design sessions —
     not in canonical twelve, not in for-DesignSession zip. execution-memory.md
     (D-256) is the machine-read successor but not yet implemented. Both suspended
     until GDA-IMPLEMENT / RETRO-DEFERRED-005 resolve the routing architecture.
     See deferred item D-Rule15-Suspended. -->

### Rule 16 — CLAUDE.md Candidates

Every CodeClose output includes a CLAUDE.md Candidates section. Format per candidate: candidate text, why Code would add it, which session moment triggered it. Code does not update this file autonomously — candidates are reviewed and disposed outside Code sessions.

**Conformance test:** Does every CodeClose output contain a CLAUDE.md Candidates section? Yes = pass. Absent = violation. Section required even when empty — state "No candidates this session."

**Exceptions:** None.

<!-- RATIONALE:
     Why: Code updating CLAUDE.md autonomously created the same registry divergence
       problem D-317 fixed for D-numbers — changes made outside Design authority
       are invisible to the governance chain and cannot be traced to a locked decision.
     Considered: Code updates CLAUDE.md directly when it identifies an improvement
       (rejected — autonomous updates bypass Design review and D-number assignment);
       no candidate mechanism, Code surfaces observations conversationally (rejected —
       conversational observations are lost at session close); structured Candidates
       section in every CodeClose (chosen — Design has a standing review trigger,
       candidates are traceable, nothing is lost).
     Downsides: Candidates that are never reviewed accumulate. Design must actively
       consume CodeClose Candidates sections at the Trigger A review cadence (D-326)
       or they become noise. Watch for: multiple consecutive CodeClose outputs with
       the same candidate — that is a Design review gap, not a Code compliance gap. -->
<!-- GOVERNING: D-326, D-332, D-317 -->

### Rule 17 — CC-Decision Sequence Completeness Check at Code Close

At every session close, before producing the session output file, enumerate all
CC-decisions in sequence order, confirm no gaps exist, and verify each appears in
the CCode-decisions list in the session output. A gap = a missing decision number —
recover before closing.

**Conformance test:** Were all CC-decisions enumerated in sequence and verified before the session output was written? Yes = pass. Any gap discovered after session output written = violation.

**Exceptions:** None.

<!-- RATIONALE:
     Why: Gaps in CC-decision sequence left unrecorded decisions that were later
       treated as undocumented spec violations and overwritten. A gap is recoverable
       at session close — it is not recoverable after the session ends and context
       is lost.
     Considered: Trusting Code to record decisions as they occur without a sequence
       check at close (rejected — mid-session recording is incomplete under time
       pressure; gaps only become visible when the next session overwrites the
       unrecorded decision); end-of-session sequence enumeration before writing
       output (chosen — the sequence check is the last action before close, when
       all decisions are in context and recovery is still possible).
     Downsides: Sequence check requires Code to maintain accurate numbering
       throughout the session. If numbering drifts mid-session the check itself
       becomes unreliable. Watch for: CodeClose outputs where the CC-decision
       sequence jumps by more than one. -->
<!-- GOVERNING: D-CC-Handoff-2 -->

### Rule 18 — Supabase Migration Execution Pattern

Never execute migrations directly against Supabase. Required pattern: (1) write
migration file to repo, (2) display full SQL content, (3) stop — Phil executes
all migrations manually. Code does not execute against Supabase directly.

**Conformance test:** Did Code stop after displaying SQL and wait for Phil to execute? Yes = pass. Any direct execution attempt = violation.

**Exceptions:** None.

<!-- RATIONALE:
     Why: Phil executes all SQL against Supabase directly — Code does not have
       execution authority. This rule prevents Code from wasting session time
       attempting execution that will fail, and provides a safety backstop against
       any future session where Code might attempt direct execution. Schema changes
       are irreversible — the stop is non-negotiable regardless of context.
     Considered: Allowing Code to execute with Phil confirmation (rejected — Phil
       executes all SQL; Code execution authority does not exist and should not be
       established); no rule, rely on Code's judgment (rejected — safety backstop
       requires an explicit rule; a session without this rule might attempt execution
       and waste context budget); write → display → stop pattern (chosen — Code
       delivers the artifact, Phil executes, no ambiguity about authority boundary).
     Downsides: A future session where execution authority changes would require this
       rule to be explicitly amended — it cannot be silently overridden. That is a
       feature, not a limitation. Watch for: CodeClose outputs that describe migration
       execution — that is a violation even if Supabase rejected the attempt. -->
<!-- GOVERNING: D-295 -->

---

### Rule 23 — D-333 Template Conformance Check
<!-- RATIONALE:
     Why: Rules accumulate without required template sections when authoring is rushed
       or the template standard postdates older rules. Code acting on a rule missing a
       Conformance test or Exceptions declaration makes implicit assumptions that may
       contradict Design intent. The check makes the gap visible before it becomes
       silent compliance drift.
     Considered: Session-start scan of all rules (rejected — burns instruction budget
       on rules not applied that session, no protective value beyond triggered check);
       verbatim default text per rule (rejected — ~45 boilerplate lines, diminishing
       returns on instruction budget per research findings); hooks enforcement (not
       applicable — judgment behavior, not deterministic).
     Downsides: Cannot enforce itself — 80% compliance ceiling applies. Watch for:
       HTML-only candidates that never surface to Design for retrofit; Conformance test
       flags noted in CodeClose but not routed back.
-->
<!-- GOVERNING: D-333, D-328, D-329, D-330, D-331 -->

When applying any rule in this file or in any file listed in the Session Initialization
block above, verify the rule contains the required D-333 template sections before
acting on it.

Required sections — readable: Rule, Conformance test, Exceptions.
Required sections — HTML: RATIONALE block (Why / Considered / Downsides), GOVERNING block.

Tiered response when a section is missing:

| Missing section | Response |
|---|---|
| RATIONALE or GOVERNING (HTML only) | Continue. Record as candidate in CodeClose. |
| Conformance test | Flag before acting. State which test is absent. Surface to Design. |
| Exceptions | Flag before acting. Same handling as missing Conformance test. |
| Non-conformance handling omitted | This table governs. |

This table is the non-conformance default. Rules with explicit non-conformance handling in their own text override the relevant row.

Binary test: when applying a rule, were all four section types checked and findings
handled per the tiered response above? Yes = compliant.

Exceptions: None.

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | April 2026 | v2.3*
