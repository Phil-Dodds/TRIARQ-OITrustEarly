# OITrust CodeClose — Contracts G5–G10 + GEnd (Governance Redesign, Run 2)
Date: 2026-07-23 | Spec: governance-redesign-code-spec.md v2.1 §§5–10
Authorization: OITrust-Checkpoint-G4G5-RunTwo-Authorization-2026-07-23.md (D-575)
Branch: `governance-redesign` — ALL ten contracts complete. **NO production
deployment performed** — production receives ONE deployment of the complete
governance model at GEnd, executed by Phil after this Design final close.

Commits this run: 35baf3b (pre-work), then one commit per contract G5→G10,
plus this GEnd close. Run 1 (G2–G4) closed separately
(OITrust-CodeClose-ContractsG2-G4-2026-07-23.md); G1 earlier the same day.

---

## Checkpoint compliance (Run 2 pre-work)
- **CC-G2-01 CORRECTED as ruled:** `isLeadershipForCycle` — Phil + the cycle's
  own DL + ancestor-chain DLs (parent walk, depth-guarded); cross-division
  owners rejected. Tests: ancestor honored; cross-division ignored + warning.
- **F-1 fixed with regression test:** `record_gate_decision` compares
  'approved'; `suggestion_warnings` now compute on approval (source-assertion
  regression test per repo precedent).
- **Ruling 1 (CC-G1-15) implemented in G5**; **ruling 3 (S-C6 UI) in G8**;
  **ruling 4 (About) composed at this close**; **ruling 5 acknowledged**.

## What was built (per contract)

### G5 — Level 1 consensus (retires D-570a)
Migration **085**: `gate_approvals.cleared_by_return_at` +
`cleared_by_event_id` (ruling 1 — cleared, never deleted; current set =
uncleared rows; no blocking unique constraint). `helpers/l1-consensus.js`
(collection state, trio approvals, any-return-clears-all).
`record_gate_decision`: L1 route (trio/Admin only; partial approvals pend
with the waiting list; the last collected approval passes the gate via the
extracted `applyGateApprovalTransition`; L1 returns clear everything, trio
notified, approver_user_id stays NULL). `record_consultation_response`:
consulted decline returns entirely (S-A4); last consulted approval passes
(S-A3→AC#6). Submit: L1 assignment floor (DCS+DOL at Brief Review — absolute;
full trio from GtB), submitter auto-approval (S-A1), resolution now yields
NULL approver / no dual-write at L1. `list_pending_approvals`:
`trio_member_approval` items. Gate modal: waiting list, L1 approve/confirm
texts; the G3 interim tooltip retired.

### G6 — Gate thread + conditions
Submission note = thread message #1. Conditions hold approvals (single-
approver AND the L1 collection); returns clear open conditions (AC#5 lean);
`consultation_required` auto-resolves on the target's approval (S-B5); setter
auth = approver/trio/Admin; resolver set + the gate's approver.
`gate-thread-conditions` modal section (one line + one action; thread,
composer, conditions, add/resolve one tap deep).

### G7 — Waiting-on + path panel
`lib/waiting-on.js` — THE single computation (AC#1): condition_open (naming
the consultation-required target) → L1 trio (names) → L1 consultation (party)
→ approver (days). Wired to `get_delivery_cycle`, `list_pending_approvals`,
`list_delivery_cycles` (list rows carry `waiting_on`). Trio roster
approved/pending on L1 gates (AC#3). The four D-555 purposes rotate at the
approval action (D-527 architecture; day+gate rotation) with the one approver
note field (AC#4).

### G8 — Initiative Executive
Migration **086**: `users.is_initiative_executive`.
`set_initiative_executive` (Phil-only). `list_all_pending_gates` (IE/Admin;
oldest first; ARCH-33-APG-AGING = 7 days, code constant — CC-G8; waiting-on
lines). Loud override in `record_gate_decision` (`ie_override` +
`override_reason`; distinct approval row + event; assigned approver emailed;
board gates rejected — S-C3). D-569 over-returned flow on EVERY approval:
mandatory reasoning (structured `RETURNED_CONSULTATION_REQUIRES_REASON`
prompt), marker row + event, returning parties emailed with the reasoning, DL
auto-notified on content-triggered returns (Security×Q4; Compliance×
pre-deploy — CC-G8 membership lean until suggestion provenance exists). IE
joins leadership everywhere (L3 chain, level/oversight controls — completes
CC-G1-08/-09; CC-G1-14 interim retired). Angular: All Pending Gates view +
nav (requiresFlag is_initiative_executive, devStatus uat) + IE home count
card; modal override + over-returned prompts; S-C6 confirm-or-release prompt
on the level chip (ruling 3).

### G9 — Suggestions + interest filters
Migration **087**: `suggestion_dismissals` (UNIQUE per cycle+rule; note
mandatory — the S-C7 specialty-visible record). `get_suggestion_state` /
`apply_suggestion_decision` — EXACTLY two rules (q4_security→Security,
q5_ux→UX); unknown rule_key rejected; no framework (AC#3). Sizing form shows
live suggestions with Add / Dismiss-with-note; create panel, gate
interstitial, and edit dialog apply decisions post-save. Interest profiles:
OR-of-ANDs matcher (`core/utils/governance-filter.ts`) over answers, subs,
Other-notes, Division, stage; Interest panel on Initiative Tracking;
remembered per-user per-screen through the existing SCREEN_KEYS constant
(Rule 4 — no dynamic keys). `list_delivery_cycles` rows carry `sizing`.
Grade 3 untouched: AI→Board remains the only auto-attach (AC#5). The G3
vendor Informed flag was already surfaced by the G4 participation section.

### G10 — Cancellation + home card
Migration **088**: `cancel_requests`. `cancel_delivery_cycle`: severity
authority (trio pre-Brief-Review / L1 / unsized; resolved approver L2/L3 —
awaiting stamp else next-gate chain; Admin/Phil/IE = release valve), C/I
holder notifications, closes open requests. `request_cancel` (trio, reason
required; routes by authority; queue row `cancel_request` in the authority's
My Actions), `decline_cancel_request` (note required; requester notified),
`get_open_cancel_request` (panel banner). `get_quarter_deploy_goal` — THE one
v1 KPI (D-568 C): per-person done/remaining across the deploy chain for
Initiatives targeting Go to Deploy this quarter; recent weekly pace vs needed
pace; deploy-target movement count shown; Division roll-ups for DLs; L1
shared gates count once per person (per-person views count each assigned
Initiative's gate once). Families A/B/D NOT built (AC#5 — deferred to the
metric-definitions pass). Angular: cancel-request banner + Request Cancel on
the detail panel (Execute routes into the existing D-183 two-step); My
Actions cancel-request rows; quarter deploy-goal home card with the
"diagnostic, not a target" footer.

### GEnd items
- **About entry composed** (ruling 4): one `changelog.ts` entry covering
  G2–G10, seven surfaces, audience-tagged — ships with Phil's GEnd deploy.
- **Retirement leans (present, not executed — Design confirms):**
  - CC-GEnd-01 (lean): DROP `other_consulted_user_ids` /
    `other_informed_user_ids` in a GEnd+1 migration after one clean
    production cycle on participation_records; until then the 084 annotations
    stand. NOT executed.
  - CC-GEnd-02 (lean): remove the retired optional TS fields
    (`other_consulted_users`/`other_informed_users`/array params) at the same
    moment as the column drop. NOT executed.
- **Spec drops from companion/** per D-571 at Design final close.

## Tests
delivery-cycle-mcp: **430/430** (`node --test tests/*.test.js`) — 337
pre-governance + 93 governance tests across G1–G10 files. Fixture updates
this run (assert-preserving, spec-mandated behavior changes): contract38
sizing pre-check slots, G1 condition-auth gate rows, G2 L1 resolution
semantics, G5/G6 open-conditions + declined-consultation slots.
Angular build: SUCCEEDS (`npm run build`, exit 0, zero errors) — pre-existing
CSS budget warnings only. Three compile errors caught and fixed during the
GEnd build: the widened RoleFlag type required IE entries in the users-admin
pill records, and the cancel-request banner needed `loadCycle` template-
accessible.
team-meetings suite: unchanged (7 pre-existing stale failures — F-3).

## Consolidated Run 2 CC-decision lean list (Design final close input)
- **CC-G5-01 (taken):** L1 assignment floor is absolute at Brief Review —
  the Division dol_required exemption applies to single-approver routes only.
- **CC-G5-02 (taken):** an Admin submitting on behalf is not a collected
  party — no submitter auto-approval unless the submitter is trio.
- **CC-G5-03 (taken):** ruling-1 mechanics = cleared_by_return_at +
  cleared_by_event_id (FK to the gate_returned event); partial index on
  uncleared rows.
- **CC-G5-04 (taken):** trio members' D-459 consultation rows never
  double-count at L1 — trio approvals live in gate_approvals only.
- **CC-G5-05 (taken):** L1 admin fallback — admins may act on L1 gates
  (Build C null-approver posture retained); queue typing prefers
  trio_member_approval.
- **CC-G6-01 (taken):** open conditions BLOCK approval (both routes);
  resolving never auto-approves.
- **CC-G6-02 (taken):** returns clear open conditions (resolved with a
  clearing note — never deleted). Spec AC#5 asked for the flag: confirmed
  intent assumed; correct at final close if design differs.
- **CC-G6-03 (taken):** thread posting stays open to any active user (G1
  posture; D-565's cast list is the read audience — flag if posting must be
  cast-restricted).
- **CC-G7-01 (taken):** waiting-on priority = conditions → trio →
  consultation → approver; 'meeting requested' state is UNREACHABLE (meetings
  are ordinary thread messages — no mechanism; flagged, not fabricated).
- **CC-G7-02 (taken):** purposes rotation = (day + gate index) mod 4.
- **CC-G7-03 (flag):** D-565's binary "less first-layer UI than today" test
  needs a live element count at Build review — the modal gained a waiting-on
  line + one collapsed toggle while losing none; likely FAILS as measured.
  Design decides what the pre-redesign baseline count is.
- **CC-G8-01 (taken):** ARCH-33-APG-AGING = 7 days, code constant (spec:
  named/valued at implementation).
- **CC-G8-02 (taken):** All Pending Gates auth includes Admins.
- **CC-G8-03 (taken):** content-trigger detection = Security membership ×
  Q4-flag, Compliance membership × go_to_deploy (until G9 provenance).
- **CC-G8-04 (taken):** IE grant UI deferred — grant runs through the MCP
  tool (Phil via Claude Desktop / API); user-management toggle at a later
  pass.
- **CC-G8-05 (taken):** IE home count card shows for every IE (the "optional
  per user" preference toggle deferred with the preference pass).
- **CC-G9-01 (taken):** dedicated suggestion_dismissals table (column-gap
  allowance) rather than event-log scraping.
- **CC-G9-02 (taken):** suggestion stakes are initiative-level (v1
  participation has no per-gate dimension); the rules' named gates are
  rationale text.
- **CC-G9-03 (taken):** dismissals surface via get_suggestion_state (detail
  panel + tooling); S-C7's "filtered list view" reads the same data — a
  dismissal-count list column deferred.
- **CC-G10-01 (taken):** L2/L3 cancel authority = awaiting gate's stamped
  approver, else the next unapproved gate's would-be approver via the chain.
- **CC-G10-02 (taken):** unsized (NULL level) cancellation maps to trio
  authority — legacy stays as permissive as today.
- **CC-G10-03 (taken):** Admin/Phil/IE retain operational cancel authority;
  IE = the stuck-request release valve (D-566/D-560).
- **CC-G10-04 (taken):** cancel-request queue rows are synthetic
  list_pending_approvals items (resolution on the panel banner).
- **CC-G10-05 (taken):** KPI denominator = assigned Initiatives with a
  go_to_deploy milestone target inside the current quarter; 'skipped' counts
  as done; pace = trailing-28-day approvals / 4.

## Structural Health (Rule 12) — over-threshold declarations
record_gate_decision.js ~940 (grew with L1 route + G8 flows — split candidate
S-030 at the next touch); submit_gate_for_approval.js ~760 (pre-existing +
G3/G5/G6 pre-checks — same); gate-record-modal.component.ts ~1750
(pre-existing giant; five new confirmMode branches); detail component ~4400
(pre-existing); list_pending_approvals.js ~370; dashboard ~2500
(pre-existing). New files all single-responsibility and under thresholds
except initiative_executive.js (~190 ✓) and cancel_requests.js (~250 ✓).

## Rule 29 verification
**(1) Spec coverage:** G5 AC1–8 PASS (S-A1 submit-side auto-approval + queue
items unit-covered; full-path email chain UAT); G6 AC1–6 PASS (AC2 cast
posting = CC-G6-03 lean; AC6 deferred items not built ✓); G7 AC1–4 PASS, AC5
FLAGGED (CC-G7-03 — Build-review measurement); G8 AC7–9 + S-B3/B4/C1–C6 PASS
(S-C5 setter email = clear_oversight event + G1 note; S-C6 prompt built);
G9 AC1–5 PASS; G10 AC1–5 PASS (AC5: only family C ships ✓).
**(2) Regression:** 430/430 incl. all pre-governance suites; zero production
impact (branch only). **(3) Ratchet:** 93 governance tests; untested (D-442,
acknowledgment granted for the class at checkpoint — new items listed): email
bodies/DL-notify chains, All Pending Gates aging visual, Angular components
(build-only verification), migrations 085–088 DB effects (preview
execution), interest-profile UI interaction (matcher logic is pure + typed).
**(4) Pattern sweep:** approval transition unified in
applyGateApprovalTransition (three callers); waiting-on single-sourced (three
consumers); board-trigger consumed everywhere (submit + decision + G1 tool).
**(5) Standards:** S-003 PASS; S-023 two-step confirms throughout; S-025
Pattern 2 ambers; S-027 routed to Design (precedent CC-G1-24) — D-555–D-569
impl_status → built (G-scope), D-570–D-575 → built; S-035 satisfied by the
composed GEnd About entry. **(6) CC-decisions:** sequential per contract, no
gaps. **(7) Structural health:** declared. **(8) Deployment:** NOT performed
(D-575). GEnd deploy runbook below. **(9) Repo cleanliness:** clean at each
contract commit.

## GEnd deployment runbook (Phil, after Design final close)
1. Merge `governance-redesign` → master (fast-forwardable; master untouched
   since 6ed9d84).
2. Run migrations **080–088 in order** against production Supabase (080–083
   already ran in production for G1; 084–088 are new to production).
3. `git push origin master` → Render dashboard → **delivery-cycle-mcp →
   Manual Deploy**.
4. Angular: commit → `npm run build` (Rule 35: build AFTER the merge commit)
   → deploy `dist/…/browser/` to gh-pages via the /c/tmp/oi-deploy copy
   workaround → add 404.html + .nojekyll.
5. Health: `GET /tools` lists 36 governance tools; smoke the UAT trail below.

## UAT checklist (preview env; production only at GEnd)
1. L1 initiative (small/standard/contained, trusted DCS): submit Brief Review
   → submitter auto-approved; other trio members see trio-member queue items;
   waiting-on names them (S-A1). PASS/FAIL
2. One trio member returns → everything clears; resubmit restarts; consulted
   decline does the same (S-A2/S-A4). PASS/FAIL
3. All trio + consulted approve → gate passes instantly; stage advances; L1
   gate face shows no single approver (AC#6). PASS/FAIL
4. Submit with a note → note is thread message #1; post a reply; approver
   adds a condition → approval blocked until resolved; consultation-required
   condition auto-resolves when the party approves (S-B5). PASS/FAIL
5. Waiting-on reads identically on the gate panel, My Actions, and the
   Initiative list for the same gate. PASS/FAIL
6. Approval confirm shows a rotating purpose line + optional note; the note
   lands on the gate record. PASS/FAIL
7. Phil grants IE to a user → "All Pending Gates" appears for them (aging
   highlight); IE overrides a stuck non-board gate with a reason → assigned
   approver emailed; board-triggered gate refuses the override (S-C2/S-C3).
   PASS/FAIL
8. Approver approves a gate carrying a declined consultation → reasoning
   prompt; marker + email to the returning party; Security-on-Q4 case also
   emails the DL (S-B3/S-B4). PASS/FAIL
9. Q4=Yes at creation → Security suggestion; Dismiss requires a note; note
   visible via suggestion state (S-C7). Q5=Critical → UX suggestion at both
   named gates' rationale. Exactly two rules anywhere. PASS/FAIL
10. Interest panel: three conditions (e.g. Q4=Yes; Q5=Critical AND stage
    BUILD; note contains "vendor") → any-condition-true matching; survives
    reload (per-user memory). PASS/FAIL
11. L2 post-Brief-Review: trio member direct cancel blocked → Request Cancel
    with reason → authority sees queue row + banner → Decline (note, requester
    emailed) or Execute (C/I holders emailed). Pre-Brief-Review trio cancel
    still direct. PASS/FAIL
12. Home: quarter deploy-goal card shows done/remaining/pace for a seeded
    user; DL sees Division roll-up; moving a deploy target changes
    "remaining" and increments the movement count. PASS/FAIL
13. About panel shows the composed Governance Redesign entry. PASS/FAIL
14. **Regression:** unsized legacy initiative behaves exactly as pre-G2
    (legacy chain, tier badge, permissive cancel) until it gates. PASS/FAIL

## CLAUDE.md candidates
1. "record_gate_decision + submit_gate_for_approval are the S-030 split
   candidates for the next contract touching gates" (both far over 400).
2. "FIFO test queues: every new pre-check query in submit/decision tools
   shifts all downstream fixtures — grep the test files for queue arrays
   before adding queries."
3. "Angular build on OneDrive: always run with output redirected to a log
   file; npm buffering hides failures until exit."

## Open for Design final close
- Ratify the Run 2 lean list above (load-bearing: CC-G6-02 return-clears-
  conditions, CC-G7-03 element-count test, CC-G10-01 authority resolution).
- CC-GEnd-01/-02 drop decisions.
- impl_status updates for D-555–D-575 (S-027 routing).
- Deferred registry (per spec §10): trust registry, request-state machinery,
  per-purpose notes, approver standing preferences, KPI families A/B/D,
  dismissal-count list column, IE grant UI, IE home-card preference toggle.
- The governance spec drops from companion/ (D-571) once ratified.

---
*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-07-23*
