

# CLAUDE.md — Pathways OI Trust | v2.6 | May 2026 | CONFIDENTIAL

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

Violating any of these is an error, not a style preference.

### Arch-1 — MCP-Only Database Access

All database operations go through MCP servers. No direct Supabase client calls from Angular components or services. No exceptions.
- NEVER: import @supabase/supabase-js in any Angular component or service
- NEVER: bypass the MCP layer for "simple" reads

### Arch-2 — UI as Presentation Layer Only

Angular components render what they receive. No business logic, prompts, or data access in components.
- NEVER: put prompt text or business rules in any component or service

### Arch-3 — No Prompts in TypeScript

NEVER put prompt text in TypeScript files, Angular components, or services.

### Arch-4 — Environment Variables Only

All credentials, keys, and configuration are environment variables. Never hardcode them.

Required environment variables (never in source code):
- VERTEX_PROJECT_ID, VERTEX_LOCATION, VERTEX_MODEL, VERTEX_EMBEDDING_MODEL
- SUPABASE_URL
- SUPABASE_SERVICE_KEY (MCP servers only — never exposed to Angular)
- SUPABASE_ANON_KEY (Angular app only)
- RENDER_INTERNAL_API_KEY (MCP server auth)
- NEVER: commit .env files or log environment variable values

### Arch-5 — JWT Validation on Every MCP Tool Call

Every MCP server validates the Supabase JWT before executing any tool. No tool executes without a valid JWT.
- Validate JWT as the first operation in every tool handler
- Return 401 with clear error message on invalid JWT
- Extract user_id and check Division access from JWT claims
- NEVER: execute any database operation before JWT validation

### Arch-6 — Soft Delete Only

Never hard delete records. Set deleted_at timestamp. Records with deleted_at are excluded from all queries by default.
- Set deleted_at = now() for all delete operations
- Add WHERE deleted_at IS NULL to every SELECT on soft-deletable tables
- NEVER: use DELETE SQL on any production table

---

## Coding Standards

**TypeScript:** Strict mode. No `any` without justification in a comment. All MCP tool parameters, return types, and database table shapes are fully typed interfaces in /types/database.ts.

**Angular:** Standalone components preferred. OnPush change detection on all components. Reactive forms only. No logic in templates beyond simple conditionals and pipes.

**Node.js MCP Servers:** Express.js for HTTP layer. All tool handlers are async with try/catch. All errors return `{ success: false, error: string }` — never throw to HTTP layer. Log all tool calls with: tool_name, user_id, division_id, timestamp, duration_ms. Never log JWT values, file content, or personal data.

**Tests:** Generate alongside every code file — not after. Tests validate acceptance criteria from the build spec, not just that code runs. Every MCP tool: at least one happy path and one error path test. Angular components: test correct data is displayed, not implementation details.

**Database:** Parameterized statements only — no string interpolation in SQL. WHERE deleted_at IS NULL on every SELECT on soft-deletable tables. Transactions for multi-step operations. created_at and updated_at on every new table.

---

## Native Federation Remote Configuration

- @angular-architects/native-federation installed; Exposed module: AppModule
- All routes are relative — no hardcoded absolute paths
- Feature modules are lazy-loaded: OILibraryModule, AdminModule, ChatModule, DeliveryModule
- NEVER: use APP_BASE_HREF with an absolute path or import feature modules eagerly

---

## Design Token Rules

- Import triarq.tokens.v1.css in styles.scss
- Use --triarq-* CSS variables for all color, spacing, and typography values
- --triarq-text-h2: 60px
- Radius: cards = 10px, buttons = 5px, inputs = 5px, pills = 999px
- Sidebar active: --triarq-color-primary (#257099) left border indicator
- Font: Roboto — not Gill Sans or Lato

---

## Output Style — Caveman Mode

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

### Rule 1 — First Principles before significant decisions.

Before any significant decision or large implementation, apply Context → Question → Reduce → Simplify → Automate. Do not lock a direction until Steps 1–3 complete.

**Conformance test:** For every new table, new component architecture, new MCP tool set, or significant refactor this session, does CodeClose record that Context → Question → Reduce → Simplify → Automate was applied before locking direction? Yes = pass. Any trigger item with no First Principles record = violation.

**Exceptions:** None.

### Rule 2 — Push back without being prompted.

Flag disagreements, risks, and conflicts with locked decisions in the same response — not after code is written. If a request conflicts with a locked decision, design principle, or these architectural rules, flag it immediately and explicitly.

**Conformance test:** For every conflict with a locked decision, design principle, or architectural rule encountered this session, was it flagged in the same response before code was written? Yes = pass. Any conflict flagged after code was written, or not flagged at all = violation.

**Exceptions:** None.

### Rule 3 — Track decisions and feed them back.

Track implementation decisions in CodeClose format during session. At session close, produce the decision record.

**Conformance test:** Does the CodeClose output contain a CC-decisions section with every implementation decision made this session? Yes = pass. Any implementation decision not recorded in CodeClose = violation.

**Exceptions:** None.

### Rule 4 — Never construct screen keys dynamically.

Screen keys for filter and sort memory persistence are declared as named constants in the format `[module].[screen]`. Never constructed from runtime variables or string concatenation. Define once, reference everywhere.

**Conformance test:** Does any screen key appear constructed from runtime variables or string concatenation anywhere in code written this session? Yes = violation. All screen keys declared as named constants = pass.

**Exceptions:** None.

### Rule 5 — Implement patterns at build time.

When a pattern is declared in any Session Initialization document as universally applicable, apply it to every new screen and component when built. If a screen ships without the pattern, flag it explicitly — do not silently omit.

**Conformance test:** For every new screen or component built this session, does CodeClose confirm each applicable Active Standard from the Session Initialization documents was applied or explicitly flagged as omitted with a candidate entry? Yes = pass. Any screen shipped without confirmation = violation.

**Exceptions:** None.

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

### Rule 7 — Record Every Deviation from Spec as a CC-Decision

If what was built differs from what the spec describes — record it as a
CC-decision before session close, even if the built version is better.

Format: what was built / what spec said / why the deviation is an improvement.

**Conformance test:** Does the CodeClose output contain a CC-decision entry for every deviation from spec this session? Yes = pass. Any unrecorded deviation = violation.

**Exceptions:** None.

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

### Rule 10 — Dependency Sequencing

Before proposing implementation order on any multi-section spec, identify
inter-section dependencies and sequence dependent sections as a unit. Dependent
sections ship together — they are not independently shippable. State dependency
reasoning in the implementation plan before beginning work.

**Conformance test:** Does the implementation plan produced at session start state inter-section dependencies and sequence dependent sections as a unit before any code is written? Yes = pass. No dependency reasoning stated on a multi-section spec = violation.

**Exceptions:** Single-section specs with no inter-section dependencies — state "no dependencies" explicitly in the plan.

### Rule 11 — Behavior Protection During Code Changes

Triggered when modifying a file containing confirmed working behavior as declared
in the spec or confirmed in the plan review — including consolidations, extractions,
and relocations. New files and new functions are exempt.

Two tiers: (1) Pure structural (logic unchanged, location only) — note coverage in CodeClose. (2) Logic-touching — confirmed test baseline required before starting; same tests must pass after.
Declare tier before beginning. If unclear, ask before proceeding: "Pure structural
or will logic change?" Override available: "no test baseline needed."

**Conformance test:** For every logic-touching modification this session, was a confirmed test baseline established before starting and verified passing after? Yes = pass. Any logic-touching modification without a test baseline = violation.

**Exceptions:** Phil declares "no test baseline needed" — override logged in CodeClose.

### Rule 12 — Triggered Structural Read

When a spec instructs modification of a file not yet touched this session, before
writing any code: read the file and record (1) current line count, (2) stated
responsibility, (3) whether it exceeds 300 lines (component) or 400 lines (service).
Report in CodeClose under "Structural Health." Do not surface mid-session or block
implementation.

**Conformance test:** Does CodeClose contain a Structural Health entry for every file instructed for modification this session that had not been previously touched? Yes = pass. Any missing entry = violation.

**Exceptions:** None.

### Rule 14 — Plan-Mode Checkpoint

Every session opens with plan mode before touching any files. Produce a written
plan stating: surfaces in scope, NEW/MODIFICATION classification per surface,
stated assumptions, conflicts with locked decisions or architectural rules.
Proceed after the plan is complete — do not wait for explicit approval unless
Phil instructs otherwise.

**Conformance test:** Was a written plan produced before the first file modification this session? Yes = pass. No = violation.

**Exceptions:** Phil instructs "skip plan" explicitly — logged in CodeClose.

### Rule 16 — CLAUDE.md Candidates

Every CodeClose output includes a CLAUDE.md Candidates section. Format per candidate: candidate text, why Code would add it, which session moment triggered it. Code does not update this file autonomously — candidates are reviewed and disposed outside Code sessions.

**Conformance test:** Does every CodeClose output contain a CLAUDE.md Candidates section? Yes = pass. Absent = violation. Section required even when empty — state "No candidates this session."

**Exceptions:** None.

### Rule 17 — CC-Decision Sequence Completeness Check at Code Close

At every session close, before producing the session output file, enumerate all
CC-decisions in sequence order, confirm no gaps exist, and verify each appears in
the CCode-decisions list in the session output. A gap = a missing decision number —
recover before closing.

**Conformance test:** Were all CC-decisions enumerated in sequence and verified before the session output was written? Yes = pass. Any gap discovered after session output written = violation.

**Exceptions:** None.

### Rule 19 — UAT Checklist (D-357)

At every CodeClose for sessions touching user-facing surfaces, produce a UAT Checklist section. One subsection per surface touched, in execution order. Each subsection: surface name, what changed, numbered binary pass/fail steps Phil can run without Code present.

**Conformance test:** Does every CodeClose for a session touching login/auth, new components, new views, MCP changes, or admin surfaces include a UAT Checklist? Yes = pass. Absent = violation.

**Exceptions:** Single-bug fix sessions — checklist optional at Code's discretion.

Never execute migrations directly against Supabase. Required pattern: (1) write
migration file to repo, (2) display full SQL content, (3) stop — Phil executes
all migrations manually. Code does not execute against Supabase directly.

**Conformance test:** Did Code stop after displaying SQL and wait for Phil to execute? Yes = pass. Any direct execution attempt = violation.

**Exceptions:** None.

---

### Rule 23 — D-333 Template Conformance Check

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

### Rule 29 — CodeClose Verification Pass

Before producing the CodeClose output, run a mandatory verification pass. Report results explicitly under a "CodeClose Verification" section in the CodeClose output. All seven declarations are required — absence of any section is a violation.

**(1) Spec coverage** — for every acceptance criterion in the spec, state PASS or FAIL with evidence.

**(2) Regression check** — for every surface touched, confirm no behavior present before the contract was removed or broken. State how verified (test result or manual UAT note).

**(3) Test ratchet** — list every logic-touching change and the test protecting it. If no test exists for a logic-touching change, state why and flag it explicitly as a CLAUDE.md candidate.

**(4) Pattern sweep** — if a shared pattern was modified this contract, list components searched and findings. If no shared pattern was modified, state: "Pattern sweep: no shared pattern modified this contract."

**(5) Standards conformance** — for each Active Standard flagged as CodeClose-applicable in standards-summary.md, state PASS or the specific finding.

**(6) CC-decision completeness** — all CC-decisions are sequential with no gaps.

**(7) Structural health** — all components exceeding the 300-line threshold are declared with current line count.

**(8) Deployment** — before producing a UAT Checklist, run the deployment
sequence per build-c-spec.md Section 9 (maintenance mode on → migrations →
deploy MCP to Render → deploy Angular to GitHub Pages → health checks →
maintenance mode off). Report the result explicitly:
- If deployment succeeded: produce UAT Checklist normally.
- If deployment failed: state failure reason explicitly, withhold UAT Checklist,
  state "UAT checklist withheld — deployment failed: [reason]."
- If no user-facing surfaces were touched this contract: state "Deployment:
  not required this contract" and omit UAT Checklist.

**Conformance test:** Does the CodeClose output contain all eight numbered sections under "CodeClose Verification" with explicit declarations for each? Yes = compliant. Any section absent = violation.

**Exceptions:** None.

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | May 2026 | v2.6*
