# Claude Code — Session Active Rules
Pathways OI Trust | v1.3 | April 2026 | CONFIDENTIAL
Owner: Phil Sappington, EVP Performance & Governance

These rules are active from the start of every Claude Code session with Phil.
They do not need to be re-prompted — they are standing behavioral requirements.

**Trigger phrase:** If Phil types "Session Active Rules" at any point, stop all
other activity, re-read all rules, confirm compliance with each one explicitly,
and apply them actively from that point forward.

---

## Rule 1 — First Principles before large artifacts.

Before committing to any large implementation decision — a new table, a new
component architecture, a new MCP tool set, a significant refactor — apply the
First Principles sequence in order:

Context → Question → Reduce → Simplify → Automate

Do not produce the implementation until Steps 1–3 are complete. If Phil asks
for something large, work through the first three steps conversationally before
writing code.

---

## Rule 2 — Push back without being prompted.

Surface important disagreements, flag risks, and pressure-test decisions before
building on them. Do not wait for Phil to ask for pushback. If a direction looks
wrong, incomplete, or likely to cause problems downstream, say so in the same
response — not after the code is written.

If a request conflicts with a locked decision, a design principle, or an
existing architectural constraint, flag it immediately and explicitly.

---

## Rule 3 — Capture undefined or new terms.

If a new term, label, field name, or concept is introduced during the session
that has not been used before, flag it. Ask Phil to confirm the definition
before building on it. Do not invent definitions — surface the gap.

At session close, list any terms that were used but not confirmed so Phil can
route them to the Design Session for the Terminology Register.

---

## Rule 4 — Label all questions in multi-question responses.

When a response contains more than one question, label each one: Q1, Q2, Q3,
or a descriptive label when the topic warrants it. Phil can answer by label
without restating the question. A single question does not need a label.

---

## Rule 5 — Lead with the point.

Every response opens with the main point, main ask, or primary conclusion.
Supporting context and detail follow. Never make Phil work through setup to
find what matters. No preamble before the answer.

---

## Rule 6 — No bare generic nouns.

Every field name, label, schema column, UI element, and named object uses a
fully qualified descriptive name. Generic nouns without a clarifying qualifier
are not acceptable.

**Not acceptable:** date, name, type, status, id, description, notes

**Acceptable:** last_login_at, artifact_display_name, lifecycle_status,
screen_key, actor_user_id, division_owner_user_id

This applies to: database schema, API field names, UI labels, form fields,
report columns, MCP tool names, and any identifier Phil or another Claude
instance will encounter.

---

## Rule 7 — Never construct identifiers dynamically.

Screen keys, event type strings, entity type labels, and any stable system
identifier must be declared as named constants. Never construct them from
runtime variables or string concatenation. Define once, reference everywhere.

---

## Rule 8 — Implement patterns at build time, not as retrofits.

When a universal pattern is established (Filter & Sort Memory, Universal Entity
Detail Panel, activity event stamping), apply it to every new screen and
component at the time it is built. Do not defer pattern implementation and
plan to retrofit later. If a screen ships without the pattern, flag it
explicitly so Phil can decide — do not silently omit it.

---

## Rule 9 — Track decisions and feed them back.

As Phil and Claude Code make implementation decisions during a session, track
them in the format Claude Code has established for handoff. At session close,
produce the decision record so Phil can route it back to the Design Session.
The Design Session owns the canonical documents — Claude Code feeds it, does
not replace it.

---

## Rule 10 — Trigger phrase re-prompt.

If Phil types "Session Active Rules" at any point, stop, re-read all rules,
confirm compliance with each one explicitly, and apply them actively from that
point forward for the remainder of the session.

---

---

## Rule 11 — Confirm Spec Before Implementing Any Component or Screen (Rule A)

Before implementing any new component, screen, or form, confirm the governing
spec document is available and re-read it immediately before writing code. Do
not infer field sets, field order, interaction patterns, or layout from partial
context, prior session memory, or the component's name alone.

If the governing spec document is not present in the session materials:
1. Stop before implementing that component.
2. Surface a warning: "Spec document for [component name] not found in session
   materials. Cannot implement without the spec — proceeding risks building
   against the wrong requirements."
3. Continue with other work. Do not attempt to infer the spec.

Spec documents contain locked decisions not fully recoverable from session-brief
decision summaries alone. A component built without its spec requires a full
correction pass, not a patch.

---

## Rule 12 — Record Every Deviation from Spec as a CC-Decision (Rule B)

Any time implementation differs from the spec — including improvements that go
beyond what the spec describes — record it as a CC-decision before session
close. Do not reserve CC-decisions for architectural choices only.

The test: if a reviewer reading the spec would expect to see something different
from what was built, that difference is a CC-decision regardless of whether the
built version is better.

CC-decisions that are not recorded are indistinguishable from spec violations.
An unrecorded improvement will be treated as a mistake in the next correction
pass and overwritten. Recording it protects it.

Format: follow the existing CC-decision format in the session close output.
Include what was built, what the spec said, and why the deviation is an
improvement.

---

## Rule 13 — Conflict Check Before Implementing Any Correction or New Spec (Rule C)

Before implementing any correction spec or new spec that touches an existing
surface, run a conflict check. Do not begin implementation until the check is
complete.

The conflict check looks in two places:

1. CC-decisions in the current session's CodeClose output — improvements
   recorded this session that touch the same surface. These are protected.
   Do not overwrite them without surfacing the conflict.

2. Relevant D-numbers in the session-brief — decisions already assigned
   D-numbers from prior sessions. These are locked. Do not overwrite them.

What to do with a conflict:

- If the incoming spec contradicts a CC-decision or D-number: surface the
  conflict before implementing. Format: "Conflict found — [spec section]
  contradicts [CC-decision / D-number]. Spec says [X]. Existing implementation
  says [Y]. Which takes precedence?" Do not resolve unilaterally.
- If the incoming spec covers a surface where the existing implementation
  differs but there is no CC-decision or D-number protecting it: treat the
  difference as a spec violation. Implement the spec.

What is not a conflict: Intentional improvements from Design Session
instructions — prototype fidelity targets, design token requirements, principle
citations — are not conflicts. The conflict check protects Code's deliberate
decisions, not its mistakes.

---

## Rule 14 — Pre-Build Component Verification (D-219)

Before modifying any existing component or service file, verify it appears in
at least one active import or route declaration. A commented-out import does
not qualify. If a file fails this check, it is a dead file. Do not modify,
refactor, or delete it. Record it as a CC-decision in this format:
`CC-NNN: Dead file found — [filename]. Not wired to any active import or route.
Awaiting Design instruction.` Surface it in the CodeClose file under a
dedicated "Dead Files Found" section. Phil routes the decision in the next
Design session.

---

## Rule 15 — Dependency Sequencing (D-222)

Before proposing implementation order on any multi-section spec, identify
inter-section dependencies and sequence dependent sections as a unit. Dependent
sections are not independently shippable — they ship together. If Section A
calls Section B's output, they are one implementation unit regardless of their
label in the spec. State the dependency reasoning in the implementation plan
before beginning work.

---

## Rule 16 — Behavior Protection During Code Changes (D-224)

Triggered when modifying a file that contains confirmed working behavior from a
prior session — including consolidations, extractions, and relocations of
existing logic. New files and new functions are exempt.

Two tiers:
- Pure structural (logic unchanged, location only): write tests if none exist,
  proceed if confident the change is mechanical, note coverage status in
  CodeClose.
- Logic-touching (logic changes during restructure): confirmed test baseline
  required before starting; same tests must pass after the change; no
  exceptions.

Declare which tier applies in the session output before beginning. Phil can
declare the type in the session instruction. If type is unclear and Phil has
not declared it, ask Phil one question before proceeding: "Is this pure
structural or will logic change?" Phil can override the test requirement
entirely by stating "no test baseline needed" in the session instruction.

---

## Rule 17 — Triggered Structural Read (D-225)

When a spec instructs you to modify a file not yet touched in the current
session, before writing any code: read the file and record (1) current line
count, (2) stated responsibility from the top comment or inferred from content,
(3) whether it exceeds 300 lines (component threshold) or 400 lines (service
threshold). Report findings in CodeClose under a "Structural Health" section.
Do not surface mid-session. Do not block implementation. If a file exceeds the
threshold, note it and continue — Phil routes oversized files to a dedicated
refactor session via Design.

---

## Rule 18 — Required File Verification at Session Start (D-227)

At session start, after reading START-HERE.md and the session brief, identify
every file the brief instructs you to read or modify. Verify each exists at the
expected path before beginning any work. If any required file is missing: record
a CC-decision (`CC-NNN: Required file missing — [filename]. Expected at [path].
Cannot proceed with [task].`), skip that task, complete any tasks that don't
depend on the missing file, and open the CodeClose file with a prominent header:
`⚠ PARTIAL SESSION — [task name] skipped: [filename] not found at [path].` Do
not create a substitute from scratch unless the session brief explicitly
authorizes it.

---

## Rule 19 — Plan-Mode Checkpoint (D-240)

Every Code session opens with plan mode against the session contract before touching any
files. Code produces a written plan surfacing: gaps in the contract, stated assumptions,
conflicts with CLAUDE.md or locked decisions. Phil reviews and approves or redirects.
No file modifications until Phil explicitly approves the plan. If Phil is unavailable,
wait — do not proceed on assumption of approval.

Binary test: did this session produce a written plan before the first file modification?
Yes = compliant. No = violation.

---

## Rule 20 — As-Built Document (D-241)

At every session close, update `docs/as-built.md`. One section per surface touched this
session. Format per section: **Implemented:** [what was built] / **Deviations:** [list
or "None"] / **Open questions:** [list or "None"]. Create the file if it does not exist.
This is a required session close step — session is not complete without as-built.md
updated and committed.

Binary test: was `docs/as-built.md` updated and committed before session close?
Yes = compliant. No = violation.

---

## Session Initialization Checklist

At the start of every Claude Code session, read these documents in order before
writing any code or calling any tool:

1. `CLAUDE.md` — architectural rules and non-negotiables
2. `claude-code-session-rules.md` — this file
3. `docs/design-principles.md` — UX and navigation constraints
4. `docs/decision-registry.md` — current next-available D-number
5. Current build specification (e.g. `docs/build-c-spec.md`)

---

*Pathways OI Trust · Empower | Optimize | Partner*
*CONFIDENTIAL | April 2026 | v1.2*
