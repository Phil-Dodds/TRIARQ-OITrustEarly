# CodeClose — Contract GA-1: Gate Assessments (Coaching Grades)
Pathways OI Trust | 2026-07-25 | Branch: `gate-assessments` (NO production deploy — Design gates release, per spec)
Design authority: D-579. Blueprint: existing gate submit/approve flows (D-252 delta).

## What was built
- **Migration 089** — `gate_assessments` (one row per item per respondent per attempt;
  D-578 cleared-never-deleted attempt marking; partial unique index on active rows;
  RLS enabled) + `gate_coaching_links` (per-gate best-practices URL, seeded blank, RLS).
- **MCP registry** `src/lib/gate-assessment-registry.js` — single server-side source of
  item keys/texts per gate + role scoping + `validateAssessment` (unknown keys, blank
  grades, missing coverage all rejected). Client mirror:
  `shared/constants/gate-assessment.constants.ts`.
- **Collection embedded in existing flows** (no separate task):
  - `submit_gate_for_approval` — submitter (all 3 top-level + gate subs); required for
    assigned trio callers; validated before ANY submission work; saved after transition.
  - `record_gate_decision` — L1 trio-member approvals (`trio_member`) + single-approver
    approvals (`approver`, designated approver only).
  - `record_consultation_response` — approving consulted responses (`stakeholders` + subs).
  - `confirm_gate_skip` — forwards the assessment through the skip interstitial.
- **Skips (AC #7):** phil_override, ie_override, admin-on-behalf (non-assigned admin
  submit; admin fallback approver), returns, declines.
- **Attempts (AC #5):** returns (single-approver, L1 trio, L1 consulted-decline) and
  withdraws stamp active rows `cleared_by_return_at` + `cleared_by_event_id`.
- **Visibility (AC #3/#4):** `get_delivery_cycle` gate records carry `assessments`
  filtered server-side — own rows pre-decision; ALL rows for the approver-in-decision;
  ALL rows post-decision. Cycle payload carries `gate_coaching_links`.
- **New tools:** `list_gate_coaching_links`, `set_gate_coaching_link` (Admin-only).
- **Angular:** `GateAssessmentFormComponent` (one compact screen: purpose-sentence
  header + link, chip rows A/B/C/D/N-A, inline per-item comment, completeness gating)
  + `GateAssessmentDisplayComponent` (collapsed-by-default read-only roster, prior
  attempts marked). Integrated: submit area (submitter), approve confirm (approver /
  trio member + "Answers collected so far" panel), consultation editor (approving
  responses), post-decision roster on the gate record. Action buttons disabled until
  every presented item is non-blank (S-035: no wizard, no scroll-hunting).
- **Retired (AC #6):** the rotating GATE_PURPOSES line no longer renders on
  submit/approve confirms; the assessment header shows GATE_COACHING_SHORT per gate.
  Constants remain for the Initiative Guide.
- **Tool inventory** §1.14 added (D-572, same commit).

## CC-decisions
- **CC-GA1-01** — Attempt marker = D-578 columns (`cleared_by_return_at`,
  `cleared_by_event_id`) + partial unique index on active rows (spec invited lean).
- **CC-GA1-02** — Withdraw clears assessments like a return (spec silent; a
  resubmission is a new attempt either way).
- **CC-GA1-03** — Approver collection required only from the DESIGNATED approver;
  an Admin approving via the unconfigured-gate fallback is on-behalf → skipped
  (extends the spec's admin-on-behalf posture to the approval side).
- **CC-GA1-04** — Self-supersede: re-collection from the same respondent in one
  attempt stamps their prior rows cleared and inserts fresh (never deletes;
  satisfies the active-row unique index).
- **CC-GA1-05** — Link config = `gate_coaching_links` table + Admin-only MCP tool;
  NO admin UI in v1 (flagged for a future contract; spec's "implementation lean
  welcome").
- **CC-GA1-06** — Consulted N/A: N/A is a legal grade everywhere; blank still blocked
  (spec: "N/A freely").
- **CC-GA1-07** — Assessment validation runs before the sizing interstitial and skip
  pre-check in submit (fail-fast; UI collects the assessment on the same screen, so
  the payload always accompanies the first call and survives interstitial round-trips).
- **CC-GA1-08** — Post-return display: when every row of a gate is cleared (returned
  attempt), the roster shows those rows as the attempt rather than an empty panel.

## Conflict check (Rule 8)
Retiring the rotating purposes line from confirm surfaces touches G7 D-565 item 5
(locked) — resolved by the spec itself (Design-locked D-579 explicitly replaces it;
constants retained for the Guide). Board-trigger machinery untouched. D-578 clearing
pattern reused, not modified.

## CodeClose Verification
1. **Spec coverage:** AC1 PASS (8-item block on Brief Review — registry test + submit
   twin-enforcement test). AC2 PASS (trio approvals collect trio_member; consulted =
   stakeholders+subs — role-scope tests). AC3 PASS (filterForViewer tests: own-only
   pre-decision, approver sees all; MCP response filtered server-side). AC4 PASS
   (post-decision all rows — filter test both statuses). AC5 PASS (returns stamp
   cleared_by_return_at in all three return paths + withdraw; fresh collection via
   self-supersede; both attempts render). AC6 PASS (GATE_PURPOSES import removed from
   modal; header = GATE_COACHING_SHORT; link renders iff URL). AC7 PASS (all skip
   paths guarded). AC8 PASS (server rejects unknown keys/blank grades — tests).
   AC9 PASS (450/450; inventory updated).
2. **Regression check:** full delivery-cycle-mcp suite 450/450 after fixture updates
   (G3/G5/G6 trio-path tests now send assessments — assertions unweakened, extra FIFO
   slots only). `ng build` green.
3. **Test ratchet:** new contractGA1-assessments.test.js (registry, validation,
   visibility, submit twin enforcement). Untested-gap list: saveAssessment /
   clearActiveAssessments happy paths and gate_coaching_links tools are
   validation-path covered only (FIFO single-shape limits; DB write-through verified
   at UAT — same posture as prior contracts). Phil acknowledgment requested at
   session close.
4. **Pattern sweep:** shared approval transition untouched; collection points are
   additive. No shared pattern modified.
5. **Standards conformance:** S-023 (inline, no wizard) PASS; S-035 (action reachable)
   PASS; busy-guard PASS (existing processing/saving guards gate the new buttons);
   D-140 messaging PASS (validation errors name the missing items).
6. **CC-decision completeness:** CC-GA1-01..08, sequential, no gaps.
7. **Structural health:** gate-record-modal.component.ts now ~1900 lines (S-030 split
   candidate, pre-existing trend); record_gate_decision.js ~1100 (flagged since G8);
   new components 150/130 lines — healthy.
8. **Deployment:** NOT performed — branch-only per spec ("Branch until Design says
   deploy"). UAT checklist deferred to the deploy contract; migration 089 displayed
   for Phil but runs only against preview until release.
9. **Repo cleanliness:** new files (registry, helpers, tool, tests, 2 components,
   constants, migration) all `git add`ed in the same commit as their imports.

## CLAUDE.md Candidates
1. "GA-1 collection points: any new gate-action tool must decide assessment
   collection posture (collect / skip) explicitly — registry lives in
   lib/gate-assessment-registry.js, client mirror in gate-assessment.constants.ts;
   keep in sync." — triggered by embedding collection in four tools.
2. "FIFO fixture ripple: adding queries to submit/approve/consult flows shifts every
   downstream fixture in G3/G5/G6 suites — add new queries as late as possible or
   document slots." — triggered by the 8-test fallout.

## UAT Checklist
Withheld — deployment deferred to Design release decision (spec §1). A 12-step trail
will accompany the deploy CodeClose.

## Migration 089 (for Phil, at deploy time — do not run yet)
File: `db/migrations/089_gate_assessments.sql` (displayed in session; creates
`gate_assessments` + `gate_coaching_links`, RLS enabled, seeds five blank link rows).

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | Contract GA-1 | 2026-07-25*
