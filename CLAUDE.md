
# CLAUDE.md — Pathways OI Trust | v3.7 | July 2026 | CONFIDENTIAL

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
- MCP test invocation: `node --test tests/` fails on this setup ("Cannot find module tests"). Working invocation: `node --test tests/*.test.js`. (CC-32 CLAUDE.md candidate 2, 2026-06-30.)
- Deploy: `ng build` → copy `dist/.../browser/` to deploy folder → push to gh-pages branch. MCP (Render): `git push origin master`. **Render does NOT auto-deploy on push. Both MCP services require a manual redeploy in the Render dashboard after every MCP-touching push. Confirm redeploy before UAT.** (CC-32 CLAUDE.md candidate 1, 2026-06-30.)

---

## Architectural Rules — Non-Negotiable

Violating any of these is an error, not a style preference.

### Arch-1 — MCP-Only Database Access
All database operations go through MCP servers. No direct Supabase client calls from Angular components or services.
- NEVER: import @supabase/supabase-js in any Angular component or service
- NEVER: bypass the MCP layer for "simple" reads

**Authorized exceptions (Design-locked only):**
- `system_config` — pre-auth maintenance mode read (D-MaintenanceMode). **SUSPENDED 2026-07-30:** no such code exists. AC-29 is NOT BUILT; the Angular read this exception authorises has never been written. Reinstate when AC-29 ships. See ARCH-35.

**Escalation rule (D-381):** Any direct Supabase access from Angular is an Arch-1 conflict under Rule 2. Flag and STOP — do not implement, do not rationalize, do not record as a CC-decision and proceed. Surface to Design before writing any code. Rule 30 autonomy does not apply to Arch-1 violations or any security boundary decision.

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

**Rule — Optimistic UI reversion.**
Rule: Never revert an optimistic UI state on a timer. Revert only on a server-confirmed state transition.
Conformance test: Does any component revert optimistic state via setTimeout or interval? No = pass.
Exceptions: None.

**Rule — Busy guard on MCP-calling controls.**
Rule: Every control that fires an MCP call disables itself with a Saving…/spinner state until the call resolves.
Conformance test: Does every server-calling control have a disabled/busy state during the in-flight call? Yes = pass.
Exceptions: None.

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

**(3) Test ratchet** — list every logic-touching change and the test protecting it. If no test exists for a logic-touching change, state why and flag it explicitly as a CLAUDE.md candidate. Per D-442: include an explicit untested-item list (or zero-gap statement) and record Phil's acknowledgment before CodeClose is complete. View-only template changes with no logic are exempt.

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

**(9) Repo cleanliness** — when this contract adds new MCP tool files or new Angular imports: run `git status -s mcp/ angular/src/` before any deploy push. Confirm no `??` entries exist for files named in any committed `require()` or `import` statement. If found: `git add` before pushing. State result: "Repo cleanliness: clean" or "Repo cleanliness: [N] untracked files found and added." If no new files this contract: state "Repo cleanliness: not applicable — no new tool files this contract."

**Conformance test:** Does the CodeClose output contain all nine numbered sections under "CodeClose Verification" with explicit declarations for each? Yes = compliant. Any section absent = violation.

**Exceptions:** None.

---

### Rule 30 — Autonomous Decision Threshold (D-373)

Before escalating to Design mid-session, apply this test:

- Is Phil's explicit approval required by an existing rule? (Rule 11 override, CodeClose sign-off, branch routing — check the specific rule text.)
- Does the decision contradict a locked decision in decisions-active.md? (Search before concluding it does not.)

If both answers are **no** and you have a stated lean with reasoning: take it, record as a CC-decision, proceed. Do not interrupt the session for Design adjudication.

If either answer is **yes**: stop and surface to Design.

All autonomous decisions recorded under Rule 30 appear in the CC-decisions section of the CodeClose output. Design reviews at the next session open.

---

### Rule 31 — Worktree Branch Sanity Check at Session Open

At session open, before plan mode and before reading any file from the worktree, verify the worktree branch points at source, not a deploy artifact.

**Check:** Does the working tree contain `angular/`, `mcp/`, and `db/` directories at the repo root?

- **Yes** → source confirmed. Proceed.
- **No** → branch is on a deploy artifact (gh-pages or similar). Run `git switch -C <branch-name> origin/master` to reset the branch ref to source HEAD. Then run `npm install` in both `mcp/<service>/` and `angular/` before any test run or build — node_modules are gitignored and will not be present after the overlay.

Record the branch state (source-confirmed or reset-required) in the implementation plan header under "Worktree Hygiene."

**Conformance test:** Does the implementation plan header declare the worktree branch state before the first file read or plan-mode statement? If a reset was required, did `npm install` run in both directories before the first build or test invocation? Yes to both applicable conditions = compliant.

**Exceptions:** Sessions explicitly scoped to dist artifacts or deploy-only work — Phil states this at session open.

---

### Rule 34 — Schema-First SQL Authoring

Before composing any mutation SQL (UPDATE, DELETE, transaction blocks) or any diagnostic SQL referencing columns beyond a table's primary key, open `types/database.ts` PLUS the latest ALTER migrations for any table modified after types generation — never the original CREATE or seed migration — and verify: (1) the correct column names for every column referenced, (2) the primary key column name for every table in scope. (D-574; source: Contract 38 migration 076 v1 failure.)

For operations that DELETE or UPDATE rows referenced by foreign keys — particularly any operation touching `public.users.id` — run an `information_schema.referential_constraints` query first to enumerate all FK columns before composing the mutation.

**Conformance test:** For every mutation SQL block and every non-trivial diagnostic SQL block this session, were column names verified against `types/database.ts` before the SQL was written? Yes = compliant. Any column-name or constraint error caught at execution = violation.

**Exceptions:** SQL operating only on tables created this session (schema not yet reflected in `database.ts`). Simple primary-key lookups (`SELECT * FROM table WHERE id = $1`) on well-known tables are exempt.

---

### Rule 35 — Build-After-Commit Sequence

Run `ng build` AFTER committing — not before. `version.json` stamps the current HEAD SHA at build time; building before the commit ships a `version.json` one SHA behind the deployed code.

**Conformance test:** Does `git commit` precede `ng build` in the deploy sequence? Yes = pass. No = violation.

**Exceptions:** None.

---

### Rule 36 — Gate Labels from Canonical Source Only

Gate labels in any UI component or MCP response must derive exclusively from the canonical five gate names via `gate-resolution.js` `GATE_LABELS` / `NEXT_GATE_LABELS`. `milestone_label` must never be used as a gate label. Any code path reading `milestone_label` for gate display is a defect.

**Conformance test:** Does any gate display path read `milestone_label`? Yes = violation. No = pass.

**Exceptions:** None.

---

### Rule 37 — team-meetings-mcp Test Mock Limitation

`team-meetings-mcp`'s single-result mock cannot sequence multi-query tools. New multi-query tools must either: (a) write validation-path tests only, or (b) adopt the FIFO-queue mock pattern from `delivery-cycle-mcp/contract32-status.test.js` before adding happy-path coverage.

**Conformance test:** Do new multi-query tool tests assert success paths against the single-result mock? Yes = violation. No = pass.

**Exceptions:** None.

---

### Rule 38 — RLS Enabled in Every CREATE TABLE Migration

Every migration that creates a table must include `ENABLE ROW LEVEL SECURITY` in the same file. Deny-all (zero policies) is the correct default for MCP-only tables — the service role bypasses RLS (Arch-1), so the app is unaffected. Per-user policies apply only to tables read under user JWTs.

**Conformance test:** Does any `CREATE TABLE` migration in this session lack an `ENABLE ROW LEVEL SECURITY` statement? Yes = violation. No = pass.

**Exceptions:** None.

---

### Rule 39 — Assessment Collection Posture on Gate-Action Tools

GA-1 collection points: any new gate-action tool must decide assessment collection posture (collect / skip) explicitly — registry lives in `lib/gate-assessment-registry.js`, client mirror in `gate-assessment.constants.ts`; keep in sync.

**Conformance test:** Does every new or modified gate-action tool state its assessment collection posture (collect or skip) in the CC-decision or spec section covering it, with the registry and client mirror updated in the same commit when items change? Yes = pass. No = violation.

**Exceptions:** Tools that cannot reach a gate decision or submission path (read-only gate queries) — posture is implicitly skip and need not be stated.

---

### Rule 40 — FIFO Fixture Ripple on Gate-Flow Test Suites

FIFO fixture ripple: adding queries to submit/approve/consult flows shifts every downstream fixture in G3/G5/G6 suites — add new queries as late as possible or document slots.

**Conformance test:** When a change adds a query to a gate submit/approve/consult flow, does the CC-decision or commit note state either (a) the query was added as late as possible in the flow, or (b) the affected FIFO fixture slots and the suites updated? Yes = pass. No = violation.

**Exceptions:** Changes to flows with no FIFO-mocked test coverage.

---

### Rule 41 — Angular Build Log Check Before Declaring a Hang

Angular build failures are frequently reported as "stuck" — npm buffers the error until exit. ALWAYS `> log 2>&1` + check the log's tail/timestamp before assuming a hang; a stale log mtime with an ERROR line = failed fast.

**Conformance test:** Before reporting any `ng build` / npm build as hung or killing it, was the redirected log's tail and mtime inspected? Yes = pass. No = violation.

**Exceptions:** None.

---

### Rule 42 — Confirm Push Before Render Redeploy

Sequencing trap: Phil redeploys Render eagerly. Before saying "ready for Render", confirm the relevant commits are PUSHED to master — a redeploy before the push silently ships the old code.

**Conformance test:** Before any statement that a Render redeploy can proceed, was `git log origin/master` (or equivalent push confirmation) verified to contain the relevant commits? Yes = pass. No = violation.

**Exceptions:** None.

---

### Rule 43 — Stage Graduation via Shared Transition Only (D-580)

Gate stage rule (CC-0726-01): approval graduates current_lifecycle_stage to the gate's target from any earlier stage. Any new approval path must use applyGateApprovalTransition, never a bespoke stage write.

**Conformance test:** Does any new or modified approval path write current_lifecycle_stage outside applyGateApprovalTransition? Yes = violation. No = pass.

**Exceptions:** None. (Forward-only: the shared transition never moves a stage backwards and leaves CANCELLED/unknown stages untouched — that behavior lives inside the transition, not in callers.)

---

### Rule 44 — Never Auto-Clear Gate Conditions (D-581)

Conditions are durable (CC-0726-02): never auto-clear gate_conditions in any new return/reset path; closure is human-only (resolve / withdraw).

**Conformance test:** Does any new or modified return, reset, or resubmission path resolve, clear, or delete gate_conditions rows without an explicit human resolve or withdraw action? Yes = violation. No = pass.

**Exceptions:** None.

### Rule 45 — Skip-Delegate Parameter Pass-Through (D-596)

Any new submit-time parameter accepted by `submit_gate_for_approval` must also be forwarded through the `confirm_gate_skip` delegate call.

**Conformance test:** Every parameter accepted at submission appears in the skip delegate forward.

**Exceptions:** None.

Source: D-596.

---

### Rule 46 — Append every CC-decision to the running ledger at the moment it is made.
Every CC-decision is appended to `docs/cc-decisions-active.md` when the decision is made, before the work implementing it is committed. Entry carries: CC-letter, one-line title, the reasoning, and the commit hash once known. The per-contract CodeClose summarises the ledger; it does not replace it.
Conformance test: for every CC-letter named in a CodeClose, does a corresponding entry exist in `docs/cc-decisions-active.md`? Yes for all = pass.
Exceptions: None.

### Rule 47 — Every CodeClose opens by naming the locked decisions it touched.
The first section of every CodeClose lists every locked decision, ARCH item, and Standard the session's work touched, before any other content. One line each: identifier, and what the work did to it (implements / extends / contradicts / supersedes).
Conformance test: does the CodeClose contain a locked-decisions-touched section positioned before the CC-decisions section? Yes = pass.
Exceptions: None. A session that touched nothing writes "None."

### Rule 48 — No migration executes unless its file is committed to master first.
No migration is run against any environment until its file exists on `master`. This applies to manual execution in the Supabase console as much as to scripted runs.
Conformance test: for every schema object in the live database, does a committed migration create it? Yes for all = pass.
Exceptions: None.

### Rule 49 — Every CodeClose carries a schema summary.
Every CodeClose includes `schema-summary.md` listing each table the session touched and that table's actual column names as read from the live schema or `types/database.ts`, not from build-c-spec.md.
Conformance test: does the CodeClose include a schema-summary covering every table named in its CC-decisions? Yes = pass.
Exceptions: Sessions that touched no table write "No schema surfaces touched."

---

## Standing Notes — Dispositioned CLAUDE.md Candidates

Four dispositioned candidates carried from the Contract 40 CodeCloses (2026-07-30):
1. `delivery_cycles` primary key is `delivery_cycle_id`, not `id`. Verify against `get_delivery_cycle` before any cycle query.
2. The require-cache FIFO Supabase mock ignores `.select()` and `.eq()` column names — a wrong column passes unit tests and fails live. Rule 34 is the only guard; green tests are not evidence.
3. Neither MCP service exposes `/health` or `/tools` without a JWT. Both apply `validateJwt` before mounting them, and the `(no JWT required)` comments in both `index.js` files are stale. Never conclude "tool not shipped" from a curl 401 — check the Render dashboard or call in-app.
4. Never offer a UI option that has no representable stored state. If an option maps to another value on selection, the selected-state check will highlight the wrong control. Add the value to the schema or do not offer it. (Trigger: D-617.)

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | July 2026 | v3.7*
