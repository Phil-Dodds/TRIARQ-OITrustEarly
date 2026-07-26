# CodeClose — GA-1 Combined Release Deployment
Pathways OI Trust | 2026-07-26 | Design authorization: 2026-07-25 ratification (Option 1)

## Deployment record
- **CC-GA1-10 (deviation noted, Rule 7):** Design's Option 1 assumed `governance-redesign`
  was still branch-only. It was already in production (GEnd deploy 2026-07-24: master
  505debe, migrations 084–088 run, Render redeployed, gh-pages verified). `gate-assessments`
  was branched FROM that master, so the "combined release" executed as: GA-1 merge only,
  migration **089 only**. Runbook otherwise followed.
- **CC-GA1-09:** Close Review roster notification implemented as a dedicated email
  (`close_review_assessment_roster`) to trio + consulted + assessment respondents
  (decision-maker excluded), compact text roster embedded, prior attempts referenced to
  the gate record. No trio+consulted decision email existed to extend. Tests: roster
  builder, close_review send (recipients + roster content), other-gates control.
- Merge: `gate-assessments` → master `4bef854` (no conflicts — branch was current).
- Tests: delivery-cycle-mcp **453/453**. `ng build` clean.
- Migration 089: **run by Phil** (confirmed in session, 2026-07-26).
- Render: delivery-cycle-mcp manual redeploy — Phil triggered one BEFORE the merge push;
  **a second redeploy after 4bef854 is required** (flagged in session). Phil also owes
  the outstanding team-meetings-mcp + division-mcp redeploys from Contract 38.
- Angular: gh-pages deployed; live version.json = `4bef854…` verified.
- Rule 35: release commit preceded the build (version.json stamps 4bef854). ✔
- Health check: pending the post-merge Render redeploy (step 1 below).

## Combined UAT Checklist
**Part A — GEnd (G1–G10):** the 14-step trail in
`OITrust-CodeClose-ContractsG5-G10-GEnd-2026-07-23.md` stands as issued (production
since 07-24; still owed).

**Part B — GA-1 (12 steps, after the post-merge Render redeploy):**
1. Hard refresh. Open a test Initiative → submit Brief Review. The assessment block
   renders above "Why is this gate ready?" with the gate-purpose sentence as header.
2. Leave one item blank → Submit stays disabled. Grade all 8 → Submit enables.
3. Add a comment via ✎ on one item → saves with the submission (verify in step 8).
4. As a consulted party, open the gate → Approve/Decline → choosing Approve shows
   the `stakeholders` + sub-items block; Save disabled until graded; Decline shows none.
5. As a second trio member on an L1 gate: approving collects their assessment
   (same rule: blank blocks).
6. Pre-decision blindness: as trio member B, confirm you cannot see member A's
   grades anywhere on the gate.
7. As the approver: the Approve confirm shows "Answers collected so far" (collapsed;
   one tap expands) above your own assessment block. The old rotating purpose line
   is gone.
8. Approve the gate → the gate record now shows "Gate assessments" (all respondents,
   grades, comments) to everyone on the Initiative.
9. Return a gate that has assessments → resubmit → fresh assessment collected;
   the roster shows the new attempt with "Previous attempt" beneath.
10. Phil override submit/approve → no assessment block, no requirement.
11. Admin (non-trio) submitting on behalf → no assessment block; submission proceeds.
12. `set_gate_coaching_link` (admin) with a URL → "Full best practices for this
    gate →" renders in the assessment header; blank hides it.

**Part C — Close Review roster notification (1 step):**
13. Approve Close Review on a test Initiative with at least one assessment collected →
    trio + consulted receive the "Close Review approved · gate assessments" email with
    the per-respondent grade roster in the body. Approve any OTHER gate → no such email.

## CodeClose Verification (delta over the GA-1 build CodeClose)
1. Spec coverage: scope addition AC (roster on Close Review, other gates unchanged)
   PASS — contractGA1-roster-notification.test.js (send + control).
2. Regression: 453/453 (three new tests added; zero existing weakened).
3. Test ratchet: roster email content asserted against the mocked notification helper;
   real SMTP delivery verified at UAT step 13 (same posture as all email features).
4. Pattern sweep: applyGateApprovalTransition extended additively (roster block is
   gate-guarded + non-fatal); shared transition callers (L1 route, consultation
   last-piece) inherit the behavior correctly — close_review via those routes also
   sends the roster.
5. Standards: PASS (non-fatal notification, D-140 unaffected).
6. CC-decisions: CC-GA1-09, CC-GA1-10 — sequential after the build CodeClose's 01–08.
7. Structural health: record_gate_decision.js now ~1180 lines — S-030 split scheduled
   as participation-redesign pre-work per Design ruling; not split here as instructed.
8. Deployment: executed (this document). Health check pending Render redeploy —
   `https://delivery-cycle-mcp.onrender.com` tool count must include
   list_gate_coaching_links, set_gate_coaching_link, force_close_initiative.
9. Repo cleanliness: 2 new files this addition (helper export + test) committed with
   their imports; `git status -s mcp/ angular/src/` clean at push.

## CLAUDE.md Candidates
None beyond the two already accepted by Design (collection-posture rule, FIFO-ripple
note) — both applied as working practice this session.

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | GA-1 Deploy | 2026-07-26*
