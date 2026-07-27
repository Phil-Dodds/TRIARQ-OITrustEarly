# CodeClose — Post-GA1 UAT Session (assessment UX, stage graduation, conditions loop)
Pathways OI Trust | 2026-07-26 | Session scope: 4bef854..bfa17d9 (all on master, all deployed)
Also closes the pre-merge UAT-sweep work (9770b60, 4432070, 2026-07-24/25) never formally CodeClosed.

## What shipped this session (chronological)

**Pre-GA1-merge sweep (9770b60 + 4432070, 07-24/25):**
- Trusted-DCS wording removed from derivation chips (silent rule, server + tests).
- Jira blocker "(ask an Admin to exempt)" removed (client + server).
- Phil override levers: `phil_override` on submit/decision/skip (Phil-only,
  event-logged, UI-confirmed), Deploy-skip allowed under override,
  `force_close_initiative` tool + detail-panel button.
- Participation People list fixed (`loadAllUsers()` was never invoked).
- Edit panel solid overlay + governance/sizing pointer; create-panel header
  actions; detail ✕ clearance; dangling "· Not set" fix; dashboard row wrap;
  Workstream "recommended" tag removed.
- Filter-restore race fixed: single load after restore settles + generation
  guard on loadCycles (stale responses discarded).
- Design agenda doc: docs/design-agenda-gates-tier-sizing-2026-07-24.md.

**GA-1 follow-ons (0d40c3e..7e6dd8e, 07-26, Phil live-UAT rulings):**
- Assessment form: progressive disclosure (3 top-level questions; gate-named
  best-practices question third; grading it reveals the gate-specific
  sub-questions, indented + labeled), comment auto-appears on grade,
  "Self-grade the team" nudge per role.
- Approver flow: "Answers collected so far" + own assessment on the MAIN gate
  panel BEFORE Approve; Approve gated on completeness; confirm is decision-only.
- Declutter: empty Gate Checklist / empty Milestone Date / empty read-only
  Thread & conditions hidden; one "Submitted … — awaiting your approval" line
  replaces three; purpose sentence de-duped; "Pending ·" dot; zero-count
  consulted summary trimmed.
- No personal names in routing fallbacks ("Escalation default — no Accountable
  configured"; "…or an Admin"); override labels de-named.
- Override-approve: same action row, right-justified, label "Override: approve
  without requirements…", rendered ONLY when plain Approve is unavailable or
  blocked (not approver/trio, L1 collecting, or open conditions — count wired
  from the conditions data).

**Stage graduation (0cbb085, Phil ruling):**
- Root cause: transition advanced stage only when
  `current_lifecycle_stage === prevStageOf(target)` — manual stages (Spec,
  Validate, UAT) nobody walks stranded stages behind approved gates.
- Fix: approval graduates the stage to the gate's target from ANY earlier
  stage (never backwards; CANCELLED/unknown stages untouched). Regression test.
- Repair for existing rows: db/ops/repair_stranded_stages_2026-07-26.sql
  (PREVIEW SELECT + forward-only UPDATE). Phil to confirm the UPDATE ran.

**Conditions loop (fa1f04d + bfa17d9 + migration 090, Phil ruling — supersedes G6 auto-clear):**
- Conditions are DURABLE work items: survive returns/resubmissions until a
  human resolves or withdraws them. All three auto-clear-on-return calls
  removed (single-approver, L1 trio, L1 consulted-decline).
- "Return with Set Conditions" third action: return notes + inline composer
  (1..n items); conditions created open with the return; distinct
  `gate_returned_with_conditions` event.
- Open conditions block RESUBMISSION (server twin, D-140 message naming every
  item; phil_override bypasses) and continue to block approval (unchanged).
- `withdraw_gate_condition` (setter / gate approver / Admin; reason REQUIRED;
  status 'withdrawn' via migration 090; reason on resolution_note; never-delete).
- Gate modal: prominent amber Conditions block (state-aware title; Mark
  resolved; "No longer applies…" with inline reason; struck-through withdrawn
  rows with reasons; resolver recorded); submit disabled with explanation
  while conditions open; modal owns the conditions data (loads + refreshes).

## CC-decisions (Rule 17 enumeration — sequential, no gaps)
Sweep series (assigned at close for the 07-24/25 work):
- CC-0725-01 trusted-DCS rule silent on screen (both derivation branches neutral).
- CC-0725-02 admin-exempt hints removed from blocked-action messages.
- CC-0725-03 phil_override semantics: bypasses ALL submission/approval rules;
  Phil-only (is_super_admin); every use event-logged 'phil_override'; UI confirms.
- CC-0725-04 force_close_initiative reuses applyGateApprovalTransition per gate
  (real approvals — stages/milestones/events behave normally).
- CC-0725-05 Edit-panel ghost = translucent overlay; solid white + explicit
  "Governance Level & Sizing — managed on the Initiative panel" pointer.
- CC-0725-06 create-panel actions moved to sticky header (Edit-panel pattern).
- CC-0725-07 Workstream "— recommended" tag removed (Phil: no longer recommended).
- CC-0725-08 admin-fallback approver = on-behalf → assessment skipped (extends
  CC-G5-02 posture to the approval side; later ratified in GA-1 CC-GA1-03).
- CC-0725-09 filter-restore race: single load after restore + generation guard.
GA-1 follow-on series (continues the deploy CodeClose's 09/10):
- CC-GA1-11 progressive disclosure; trigger = gate-named best_practices
  (consulted trigger = stakeholders, their only top-level item).
- CC-GA1-12 comment field auto-appears on grade (not always-visible).
- CC-GA1-13 role-aware nudge copy ("Self-grade the team…").
- CC-GA1-14 gate name rides on the trigger question text + sub-section label.
- CC-GA1-15 assessment + collected-answers render before Approve; confirm
  becomes decision-only; Approve gated on completeness.
- CC-GA1-16 empty sections suppressed (checklist, milestone, thread line).
- CC-GA1-17 neutral routing fallbacks — no personal names (B-95 amended).
- CC-GA1-18 override labels de-named ("Override: …").
- CC-GA1-19 declutter round 2 (one submitted/awaiting line; purpose de-dupe;
  Pending dot; zero-count summary).
- CC-GA1-20 override-approve placement/visibility (same row, right-justified,
  only when plain Approve unavailable/blocked; "Skipping Gate(s)" label
  declined as misleading — gate-skip is a different mechanism; Phil accepted).
Ruling series (2026-07-26, Phil is Design authority in-session):
- CC-0726-01 stage graduates from ANY earlier stage on gate approval
  (supersedes the prevStageOf equality check); forward-only; repair script.
- CC-0726-02 conditions are durable — G6 AC#5 auto-clear on return RETIRED
  entirely (no automatic wiping; human resolve/withdraw only).
- CC-0726-03 'withdrawn' as a first-class status (migration 090); reason
  required, stored as "Withdrawn — {reason}" on resolution_note.
- CC-0726-04 return-attached conditions are condition_type 'general', created
  non-fatally after the return stands.
- CC-0726-05 open conditions block resubmission with every item named (D-140);
  phil_override bypasses.
- CC-0726-06 withdraw authority mirrors resolve (setter / gate approver / Admin).
- CC-0726-07 the modal owns the prominent conditions block (self-loads,
  refreshes after actions); the Thread & conditions line remains for
  discussion history and the legacy composer.

## Conflict check (Rule 8)
- CC-0726-02 explicitly contradicts locked G6 AC#5 / Checkpoint ruling
  (return clears conditions). Surfaced to Phil twice in-session
  ("what sense does it make to wipe…"); Phil ruled auto-wipe retired.
  Recorded here as the governing decision; Design to ratify D-number.
- CC-0726-01 changes shared-transition behavior (applyGateApprovalTransition)
  — Phil's ruling stated in-session ("the Stage needs to graduate…").
- GATE_PURPOSES retirement + G6 UX correction trace to D-579 + these rulings.

## CodeClose Verification (Rule 29)
1. **Spec coverage** — session was ruling-driven (no written spec): every Phil
   ruling above maps to a shipped commit + CC-decision; conditions-loop ACs
   (durability, third action, resubmit block, withdraw, visibility) PASS via
   tests + live deploy. Stage ruling PASS (regression test).
2. **Regression check** — delivery-cycle-mcp 459/459 after every change;
   ng build clean at bfa17d9; live version.json verified after each deploy
   (0d40c3e, 6d07c89, db8797f, 7e6dd8e, bfa17d9). G6 return test rewritten to
   assert the new durable behavior (assertions not weakened — retargeted to
   the ruling).
3. **Test ratchet** — new: phil-override.test.js (override rejection paths,
   force-close validation, trust-silence), contractGA1-roster-notification
   (roster send/control + stage-graduation regression),
   conditions-loop.test.js (withdraw validation/authority-shape, return
   creates conditions, resubmit blocked w/ items named). Untested-item list:
   Angular condition-block interactions and modal composer are template-level
   (view + service calls) — covered by UAT trail below; force-close and
   override happy paths DB-write-through verified at UAT (D-442 ack granted
   by Design 2026-07-25 for this class). Phil acknowledgment requested.
4. **Pattern sweep** — applyGateApprovalTransition modified (stage rule):
   callers checked — record_gate_decision (single + L1), 
   record_consultation_response (L1 last-piece), force_close_initiative — all
   inherit correctly (force-close now also graduates stages properly).
   Auto-clear removal swept across all three return paths.
5. **Standards conformance** — D-140 PASS (block messages name items + fix
   path); S-023 inline confirms PASS; busy guards PASS (conditionBusyId,
   processing); S-035 action-reachable PASS (assessment/conditions above the
   buttons); Rule 34 PASS (repair SQL composed against types/database.ts +
   migration 083 verified); Rule 35 PASS after correction (the mid-build
   commit race was caught, build killed, rebuilt on fa1f04d/bfa17d9); Rule 38
   N/A (no CREATE TABLE; 090 is ALTER).
6. **CC-decision completeness** — CC-0725-01..09, CC-GA1-11..20, CC-0726-01..07:
   sequential within each series, no gaps; CC-GA1-09/10 closed in the deploy
   CodeClose.
7. **Structural health** — record_gate_decision.js 1134 lines,
   gate-record-modal.component.ts 2183 lines: both S-030 split candidates;
   Design has scheduled the splits as participation-redesign pre-work — do
   not split before then (Design instruction 2026-07-25).
8. **Deployment** — Angular: gh-pages live at bfa17d9 (verified). Supabase:
   migrations 089, 090 run by Phil; stranded-stage repair script delivered
   (Phil to confirm the UPDATE statement ran, not just the preview). Render:
   delivery-cycle-mcp redeployed by Phil during the session but BEFORE
   fa1f04d — **one final manual redeploy required** (picks up conditions loop
   + stage fix in one go). UAT checklist below assumes it.
9. **Repo cleanliness** — `git status -s mcp/ angular/src/ db/` clean; all new
   files (conditions-loop.test.js, migration 090, repair script, override
   tests, assessment components) committed with their imports.

## CLAUDE.md Candidates
1. "Angular build failures are frequently reported as 'stuck' — npm buffers
   the error until exit. ALWAYS `> log 2>&1` + check the log's tail/timestamp
   before assuming a hang; a stale log mtime with an ERROR line = failed
   fast." — triggered twice this session (HubCard union; withdrawn union).
2. "Sequencing trap: Phil redeploys Render eagerly. Before saying 'ready for
   Render', confirm the relevant commits are PUSHED to master — a redeploy
   before the push silently ships the old code." — triggered twice (GA-1
   merge; conditions loop).
3. "Gate stage rule (CC-0726-01): approval graduates current_lifecycle_stage
   to the gate's target from any earlier stage. Any new approval path must
   use applyGateApprovalTransition, never a bespoke stage write." 
4. "Conditions are durable (CC-0726-02): never auto-clear gate_conditions in
   any new return/reset path; closure is human-only (resolve / withdraw)."

## UAT Checklist (Rule 19) — after the final Render redeploy
Surface: gate modal (approver) —
1. Awaiting gate: actions read Approve / Return / Return with Set Conditions;
   override button absent when you can plainly approve. PASS/FAIL
2. Return with Set Conditions: notes required; at least one condition
   required; multiple rows add/remove. PASS/FAIL
Surface: gate modal (submitter, returned gate) —
3. Amber "Returned with conditions" block lists items; Re-submit disabled
   with count explanation. PASS/FAIL
4. Mark resolved → ✓ + name; all resolved → Re-submit enables. PASS/FAIL
Surface: gate modal (approver, resubmitted gate) —
5. Conditions block shows each item's fate above Approve. PASS/FAIL
6. "No longer applies…" requires a reason; row shows struck-through with
   "Withdrawn — reason". PASS/FAIL
Surface: assessments —
7. Submit as a trio member: 3 questions first; grading the gate-named third
   reveals the sub-questions; comments appear on grade; Submit gated. PASS/FAIL
8. Approve: collected answers + own assessment above Approve; confirm is
   two lines. PASS/FAIL
Surface: stages —
9. Approve a gate on an initiative sitting ≥2 stages back → stage jumps to
   the gate's target. PASS/FAIL
10. Repair script UPDATE run → preview SELECT returns zero rows. PASS/FAIL
Surface: overrides —
11. Blocked gate (open conditions): "Override: approve without requirements…"
    appears right-justified and works with confirm. PASS/FAIL
12. Close Review approval with assessments → roster email to trio +
    consulted. PASS/FAIL

## Open items handed forward
- Phil: final Render redeploy (≥ fa1f04d); confirm repair-script UPDATE ran;
  outstanding team-meetings-mcp + division-mcp redeploys (Contract 38).
- Design: ratify CC-0726-01/02 (D-numbers) + the CC-0725/CC-GA1 series;
  agenda doc items (Tier retirement, set-level rules, E1 participation
  redesign with S-030 splits as pre-work, E2 governance summary on create).
- Count flip-flop (C2, 07-24) — likely fixed by the filter-race generation
  guard; verify during UAT; reopen if counters still disagree.
- Thread & conditions composer merge idea (message + "must fix" checkbox) —
  Design question, parked.

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-07-26*
