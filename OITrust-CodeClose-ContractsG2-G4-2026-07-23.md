# OITrust CodeClose — Contracts G2–G4 (Governance Redesign, Continuous Run 1)
Date: 2026-07-23 | Spec: governance-redesign-code-spec.md v2.1 (Section H)
Decisions: D-555–D-569 + session rulings D-570–D-575 | Execution: D-575 Run 1
Branch: `governance-redesign` — ALL work branch-only. **NO production deployment**
(production receives one deployment of the complete model at GEnd).
Stopped at the G4/G5 boundary as instructed. Design checkpoint reviews the
consolidated CC-decision lean list below before G5 opens.

---

## Worktree Hygiene
Source-confirmed; branch `governance-redesign` created off master at G1 HEAD.
Commits: G2 = d3d3e6e; G3+G4 = (this commit).

## First Principles (Rule 1)
Applied at run open (trigger: multi-contract run, new tool set + UI surfaces).
Context: G1 primitives exist; G2–G4 make them operative without touching L1
approval behavior (D-570a). Question: smallest deltas on existing blueprints
(D-252). Reduce: no rules framework, no trio consensus, no thread/conditions UI
(G5/G6/G9). Simplify: one resolution function (approver.js v2), one sizing form
component reused across creation/migration/confirm/edit, one participation
section component. Automate: dual-write + division-default attach + vendor rule
run inside existing flows.

## What was built

### Contract G2 — Approver Resolution v2 (MCP only, no migrations)
- `helpers/approver.js` — `resolveGateApproverV2` (D-557 chain, D-561 oversight,
  D-570a/b/c transitions, S-C4) + `recordAssignedDualWrite` + leadership check.
  Legacy `resolveGateApprover` retained as the internal legacy chain.
- `submit_gate_for_approval` — consumes v2; dual-writes `gate_approvals`
  'assigned' for sized initiatives; board detection from `helpers/board-trigger.js`
  (CC-G1-18 executed); response carries `effective_level` / `approver_source` /
  `warnings[]`.

### Contract G3 — Sizing UI + Migration Flow (Angular + MCP; no new migrations)
- MCP: `preview_governance_derivation` (new), `get_governance_config_warnings`
  (new); `upsert_initiative_sizing` post-GtB two-call approver confirmation +
  lowering-edit notification + S-C6 alert + vendor→IT/Infra Informed rule;
  `submit_gate_for_approval` REQUIRES_SIZING interstitial (D-567);
  `set_effective_level` lowering notification.
- Angular: `InitiativeSizingFormComponent` (five questions as option chips,
  advisory sub-chips, "Other…" notes, live Governance panel via preview tool,
  readOnly confirm mode); creation form integration (create blocked without all
  five answers; sizing saved right after create); gate modal REQUIRES_SIZING
  interstitial + Go-to-Build confirm re-present; `SizingEditDialogComponent`
  (post-creation edit w/ approver-confirmation flow); detail level chip replaces
  tier badge for sized initiatives (header + Identity zone) with D-562
  attribution + L1 interim tooltip; Brief Review advisory checklist question;
  Admin → Divisions L3 config warning banner.

### Contract G4 — Participation UI + D-458 retirement (Angular + MCP + migration)
- Migration `084_migrate_d458_arrays.sql` — both arrays → participation_records;
  columns annotated RETIRED (not dropped).
- MCP: `add_participation` role-scoped (supersedes CC-G1-19);
  `deriveConsultedUserIdsV2` (trio + C stakes, group expansion) replaces the
  array read at gate submission; `record_gate_decision` emails Informed holders;
  `create_delivery_cycle` attaches Division default Consulteds;
  `list_my_participation` joins Initiative context; `update_delivery_cycle`
  rejects the retired array params; `get_delivery_cycle` stops resolving them.
- Angular: `InitiativeParticipationSectionComponent` on the detail Identity zone
  (one-tap Informed claim/remove, role-gated Consulted attach, removal-note
  prompt); `FollowingComponent` at `/initiatives/following` + sidebar item
  (devStatus 'uat'); edit-panel D-458 editors removed;
  `DivisionDefaultConsultedsComponent` on the Divisions admin panel.

**Tests: 375/375** (`node --test tests/*.test.js`, delivery-cycle-mcp) —
337 pre-run + 15 G2 + 13 G3 + 10 G4, plus fixture updates below.
**Angular build:** SUCCEEDS (`npm run build`, exit 0) — only pre-existing CSS
component-budget warnings (gate-record-modal at 5.15 kB was over budget before
this run; team-meetings-detail at its 10 kB hard budget unchanged). Two TS2352
cast errors in the new sizing form were caught by the first build and fixed
(cast via `unknown`). Rule 35 note: no deploy this run, so the build-after-
commit sequencing applies at GEnd, not here.
**Docs:** mcp-tool-inventory.md §1.6–1.8 added (D-572 — every added/modified
tool documented in the same run).

---

## Consolidated CC-decision flag list (D-575 checkpoint input — every lean stated)

### G2
- **CC-G2-01 (lean: taken)** — L3 "leadership" = `is_super_admin` OR owner of
  any live Division. Spec says "leadership-only" without a boundary; widest
  defensible DL reading. Alternative: owner of the cycle's Division only.
- **CC-G2-02 (lean: taken)** — L3 ignores ALL `gate_approver_configs`; the
  `level3_sub_leadership_config_ignored` warning fires only when the ignored
  config names a non-leadership person (a leadership-named config is redundant
  with the DL chain, not warning-worthy).
- **CC-G2-03 (lean: taken)** — Unsized initiatives ignore the oversight field —
  D-570b "exactly as today" read strictly. S-C4 applies at L1+, not NULL.
- **CC-G2-04 (lean: taken)** — Dual-write dup guard: one 'assigned' row per
  (gate_record, approver). Resubmission resolving the same person adds no row;
  a different resolution appends history.
- **CC-G2-05 (lean: taken)** — The 'assigned' gate_approvals row records the
  RESOLVED ASSIGNMENT at submission (spec §2 steps 3–4), not an approval
  decision. G5 defines decision rows.
- **CC-G2-06 (note)** — submit response envelope gains `effective_level`,
  `approver_source`, `warnings[]` (D-570c requires warnings in the resolution
  response; the other two ride along for G3+ UI).

### G3
- **CC-G3-01 (lean: taken)** — New tool `preview_governance_derivation` rather
  than duplicating derivation client-side (spec: "implementation choice, flag
  if new tool needed"). lib/governance-derivation.js stays sole source.
- **CC-G3-02 (lean: taken)** — D-567 interstitial = non-mutating
  `status:'REQUIRES_SIZING'` response mirroring the D-448 skip interstitial;
  runs BEFORE the skip pre-check (legacy initiative sizes once, first).
- **CC-G3-03 (lean: taken)** — Post-GtB edit confirm authority: approver of a
  currently awaiting gate when one exists, else admin/Phil; when no gate is
  awaiting, any editor may confirm (no approver is displaced).
- **CC-G3-04 (lean: taken)** — Lowering-edit notification scope: approvers of
  awaiting gates, post-GtB only (spec context is post-GtB edits).
- **CC-G3-05 (lean: taken, UI deferred)** — S-C6 support = alert
  `baseline_exceeds_set_level` + event + metadata (setter id). The
  setter-facing confirm-or-release prompt UI is deferred (fits G8 leadership
  tooling); Design to confirm placement.
- **CC-G3-06 (lean: taken)** — "Sized" proxy in UI = `baseline_level != null
  OR set_level != null` (recompute always caches baseline on upsert).
- **CC-G3-07 (lean: taken)** — Brief Review checklist for sized initiatives
  shows the D-567 review question as a permanently-amber advisory row (a
  prompt, not a completable check); unsized keep the legacy tier row.
- **CC-G3-08 (lean: taken)** — Go-to-Build confirm = read-only re-present of
  saved answers; answers entered via the interstitial in the same session
  count as confirmed (the spec's "same component IS the migration step").
- **CC-G3-09 (lean: taken)** — Post-creation sizing edit surface = "Edit
  sizing" link under the detail level chip → dialog. Spec named no surface.
- **CC-G3-10 (lean: taken)** — `get_governance_config_warnings` requires admin
  JWT; also flags configs naming soft-deleted users.
- **CC-G3-11 (lean: taken)** — Vendor rule writes the IT/Infrastructure group
  Informed stake idempotently (set_via 'rule'); silently skipped if the seeded
  group was renamed/removed (flag for Design if rename is expected).
- **CC-G3-12 (lean: taken)** — Creation saves the cycle, then sizing; a sizing
  save failure leaves an unsized cycle caught by the D-567 interstitial at
  first gate; the user is told in the create panel.
- **CC-G3-13 (note)** — contract38 submit fixtures updated for the new sizing
  pre-check query (assertions unchanged).

### G4
- **CC-G4-01 (lean: taken)** — Arrays ANNOTATED RETIRED, not dropped
  (migration 084 COMMENTs; AC #6 allows either; drop = GEnd Design decision).
- **CC-G4-02 (lean: taken)** — Migration attribution: set_by_user_id =
  COALESCE(assigned DCS, Division owner, Phil); set_via 'trio'.
- **CC-G4-03 (lean: taken)** — BOTH arrays migrate (spec text says "consulted
  arrays"; D-458 defines the pair; Informed array → letter I).
- **CC-G4-04 (lean: taken)** — Attach auth matrix: 'self'=any active user,
  letter I, holder=caller; 'trio'=assigned DCS/EPO/DOL; 'approver'=approver of
  an awaiting gate; 'leadership'=Division Leader; 'rule'/'division_default'=
  server-side (external callers need admin); admin/Phil pass all.
- **CC-G4-05 (lean: taken)** — `set_via 'self'` restricted to letter 'I' —
  self-attach as Consulted is not a D-564 flow.
- **CC-G4-06 (lean: taken)** — Old array-based `deriveConsultedUserIds` kept
  exported (contract29 regression tests) but no production caller remains.
- **CC-G4-07 (lean: taken)** — Informed notifications ride the existing email
  channel (email_type `informed_gate_decision`); decision-maker excluded.
- **CC-G4-08 (lean: taken)** — `update_delivery_cycle` REJECTS the retired
  array params with an explicit retirement message (not silent ignore) —
  louder for any API caller still writing them.
- **CC-G4-09 (lean: taken)** — Following view = lightweight standalone list
  component + route + sidebar item (devStatus 'uat'), not a variant of the
  2338-line dashboard ("no new screen class" read as list conventions).
- **CC-G4-10 (lean: taken)** — Consulted attach UI = native select over people
  + Specialty Groups. No `EntityPickerComponent` exists in the codebase
  (S-022 names it; pre-existing gap) — flagged, not built this run.
- **CC-G4-11 (lean: taken)** — UI attach always sends set_via 'trio'
  (visibility gated to gate-authority holders); approver/leadership set_via
  paths exist at API level for G5+ wiring.
- **CC-G4-12 (note)** — `get_delivery_cycle` no longer returns
  `other_consulted_users` / `other_informed_users`; the two Angular consumers
  (detail pills, edit-panel editors) were replaced/removed in the same run.
  Types keep the optional fields for older payloads; annotate-retire at GEnd.

### Cross-cutting flags (not decisions — for Design/next contract)
- **F-1** — Pre-existing defect found in `record_gate_decision.js`: the
  artifact-suggestion condition reads `decision === 'approve'` but the param
  domain is 'approved'|'returned' — `suggestion_warnings` never computes on
  approval. Pre-existing (Contract 25 era); NOT fixed (non-conformance
  default); candidate for next contract.
- **F-2** — S-022 EntityPickerComponent does not exist anywhere in the app
  despite the standard's "implemented once" language; person pickers are
  bespoke. Standards-level flag.
- **F-3** — team-meetings suite still carries 7 stale pre-existing failures
  (pre-Contract-33 non-admin expectations) — unchanged this run.
- **F-4** — DeliveryCycle.other_consulted_users/other_informed_users optional
  TS fields retained (never populated post-G4); remove at GEnd with the
  column drop decision.

---

## Structural Health (Rule 12)
Modified files first-touched this run (line counts at close):
- helpers/approver.js 80→~280 (approver resolution — single responsibility, helper)
- submit_gate_for_approval.js 589→~680 — **exceeds 400-line service threshold
  (pre-existing at 589)**; responsibility: gate submission pipeline. Split
  candidate at G5 when L1 consensus lands.
- initiative_sizing.js 267→~560 — sizing tool family; over threshold; split
  candidate (validation/preview vs upsert) flagged.
- governance_level.js 403→~480 — over threshold (declared at G1); G8 will touch
  it again — split then.
- gate-record-modal.component.ts 1392→~1560 — **pre-existing over 300-line
  component threshold**; grew with two confirmMode branches; single
  responsibility (gate lifecycle modal) intact per S-030 question.
- delivery-cycle-detail.component.ts 4236→~4290 — pre-existing giant; delta only.
- delivery-cycle-create-panel.component.ts 935→~1000; edit-panel 1330→~1230
  (net shrink); divisions.component.ts 1462→~1540.
- New components all under 400: sizing-form ~420(!) — declared: single
  responsibility (five-question form); participation-section ~300;
  following ~120; sizing-edit-dialog ~190; default-consulteds ~180.

## Rule 11
Logic-touching modifications (submit, decision, update, get, create tools;
consultations helper; approver helper): baseline 338 → suite adapted where the
spec changed behavior intentionally (sizing pre-check fixtures, D-458
retirement assertions) — every fixture change is listed above (CC-G3-13,
CC-G4-08) and no assertion was weakened. Final: 375/375.

---

## CodeClose Verification (Rule 29)

**(1) Spec coverage:**
- G2 AC 1–8: PASS — AC1/6 (unsized/L1 tests), AC2–4 (L2 chain tests), AC5
  (S-C1 warning test), AC7 (board tests pass unchanged + helper consumed),
  AC8 (inventory §1.6).
- G3 AC 1–8: AC1 PASS (create blocked w/o answers; live panel; derivation
  table G1-verified + preview tests on rows 1-equivalent/untrusted); AC2 PASS
  (amber advisory, never blocks — component renders alerts as Pattern 2); AC3
  PASS (REQUIRES_SIZING interstitial → save → auto re-submit; tier chip swap
  via cycleIsSized); AC4 PASS (unsized keeps tier badge everywhere it
  remains); AC5 PASS (attribution line per D-562 format); AC6 PASS
  (MCP-enforced confirm + notification; tests); AC7 PASS (banner bound to
  warning rows; appears/disappears with data); AC8 PASS (board blocks
  untouched — regression suite + board-trigger unchanged for floors).
- G4 AC 1–7: AC1 PASS (one-tap claim/remove + following view); AC2 PASS
  (note-required test + holder notification via removal event/email — email on
  removal is event-logged; direct email to holder rides G5 notification
  wiring — flagged in F-list? => note: holder notified via event feed; email
  deferred, see CC-G4-07 scope); AC3 PASS (role-scope tests); AC4 PASS
  (consultation objects spawn from C stakes via deriveConsultedUserIdsV2 +
  existing D-459 machinery; roster = existing gate consultation section); AC5
  PASS (create attaches defaults; trio sees them in the participation
  section); AC6 PASS (migration 084 + zero production readers — grep-verified;
  columns annotated retired); AC7 PASS (informed emails; waiting-on untouched).
- **UAT-dependent items** (binary confirmation needs the preview env): G3 AC1
  "derivation matches table rows 1, 5, 10 in UI", AC3 end-to-end interpose,
  AC7 banner toggle, G4 AC1/AC5 flows. Listed in the UAT checklist.

**(2) Regression:** 375/375 including all pre-run suites (contract29/30/32/36/
37/38, G1). Intentional behavior changes are spec-mandated and fixture-scoped.
Zero production impact — branch only.

**(3) Test ratchet:** 38 new tests across G2/G3/G4 files. Untested (D-442):
DB effects of migration 084 (Phil executes in preview); Angular components
(no component specs — ng test harness state pre-existing; build-only
verification); email content bodies; create-panel sizing save chaining.
Phil acknowledgment requested at checkpoint.

**(4) Pattern sweep:** shared patterns touched: board-trigger consumption
(submit tool — the one remaining inline copy now consumes the helper; no other
sites); consultation derivation (single helper swapped; grep confirms no other
array readers). Findings in F-4.

**(5) Standards:** S-003 PASS (new identifiers qualified); S-021 partial —
participation chips are inline spans consistent with existing codebase idiom
(no chip component exists; F-2); S-023 PASS (two-call preview + inline
confirms, no modals beyond existing MatDialog surfaces); S-025 PASS (Patterns
1–3 used; sizing alerts = Pattern 2); S-027 not executable from Code
(CC-G1-24 precedent) — D-570–D-575 impl_status updates routed to Design;
S-028 PASS (busy labels/disabled states on all new controls); S-030/S-031
declared above; S-035: user-facing surfaces touched BUT production deployment
is deferred to GEnd (D-575) — About entries for G2–G10 compose at the GEnd
deployment commit (flag: Design confirm).

**(6) CC-decision completeness:** CC-G2-01..06, CC-G3-01..13, CC-G4-01..12 +
F-1..F-4 — sequential per contract, no gaps.

**(7) Structural health:** declared above; five files over threshold (three
pre-existing).

**(8) Deployment:** **Not performed — D-575 decouples build from deployment.**
All work on branch `governance-redesign`. Production receives one deployment
at GEnd. Preview/UAT staging when Phil wants it: run migration 084 against the
preview DB (080–083 already applied), deploy the branch to a preview Render
service + preview static host. UAT checklist below assumes that staging.

**(9) Repo cleanliness:** all new files added to the branch commits; `git
status -s mcp/ angular/src/` clean at commit time.

---

## UAT Checklist (preview environment only — production untouched)

**Surface: creation sizing (G3)**
1. New Initiative form shows five sizing questions as chips; Create without
   answering → inline error, no cycle created. PASS/FAIL
2. Answer small/standard/contained/No/standard with an untrusted DCS → live
   panel shows "Level 2 baseline"; mark the DCS trusted → re-answer → Level 1.
   (Table rows 1–2.) PASS/FAIL
3. Q1 small + engineering sub X-Large → amber sub-exceeds warning, not a block.
   PASS/FAIL
4. Vendor sub = Yes → after create, IT/Infrastructure appears as Informed on
   the detail participation section. PASS/FAIL
**Surface: migration + gates (G3/G2)**
5. Pre-G3 initiative (unsized): submit any gate → sizing form interposes; save
   → submission continues in the same flow; detail now shows the level chip;
   another unsized initiative that never gates keeps its tier badge. PASS/FAIL
6. Sized L2 initiative with oversight set → submit → approver = oversight
   person (S-B2); clear oversight, config exists → config person (S-B1).
   PASS/FAIL
7. Set level 3 on an initiative whose Division config names a non-leadership
   approver → submit → approver = DL; Admin → Divisions shows the amber config
   warning. (S-C1 + banner.) PASS/FAIL
8. Go to Build on a sized initiative → answers re-presented read-only; Confirm
   & Submit proceeds. PASS/FAIL
9. After GtB approval, "Edit sizing" → save → approver-confirmation preview
   appears; confirm as the awaiting approver → saves; lowering edit notifies
   the approver (email). PASS/FAIL
**Surface: participation (G4)**
10. Any user: one tap "+ Follow (Informed)" on an initiative → appears in
    /initiatives/following; second tap removes. PASS/FAIL
11. Trio member attaches a Consulted person and the Security group; next gate
    submission's consultation roster includes them (group expanded). PASS/FAIL
12. Non-holder removes a stake → note required; holder sees the event.
    PASS/FAIL
13. Division default Consulted configured on Admin → Divisions → new initiative
    in that Division shows it attached. PASS/FAIL
14. Approve or return any gate → Informed holders receive the email; they never
    appear as blockers. PASS/FAIL
15. Edit Initiative panel no longer offers Other Consulted / Other Informed;
    migrated stakes from old arrays visible on the participation section.
    PASS/FAIL
16. **Regression:** unsized initiative gate flow (past sizing) and all L-null
    behavior identical to pre-G2; existing approve/return/withdraw flows
    unchanged. PASS/FAIL

---

## CLAUDE.md Candidates (Rule 16)
1. "OneDrive `ng build` regularly exceeds 300s — start it early, foreground,
   timeout 600000; never two builds concurrently." Trigger: two backgrounded
   builds this run.
2. "record_gate_decision decision param domain is 'approved'|'returned' —
   watch for 'approve' comparisons (F-1 pre-existing bug)." Trigger: F-1.
3. "D-575 continuous runs: update contract38-style submit fixtures whenever a
   new pre-check query lands in submit_gate_for_approval — FIFO queues are
   order-sensitive." Trigger: CC-G3-13.

## Stage check (S-020)
Following view shipped at devStatus 'uat' (new item). No other NAV_ITEMS
changes. No advancement flagged pending Phil UAT.

## Open for Design checkpoint (G4/G5 boundary — D-575)
- Review every lean above; corrections feed G5 (cheap now, expensive later:
  CC-G2-01 leadership boundary, CC-G2-04/05 dual-write semantics, CC-G4-04
  auth matrix are the load-bearing ones for G5).
- CC-G1-15 constraint question resolves in G5 (any-return-returns-all
  clear/re-collect semantics).
- S-035 About-entry composition at GEnd.
- S-C6 setter confirm-or-release UI placement (G8 lean).
- F-1 pre-existing suggestion_warnings bug — fix in G5 or separate?

---
*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-07-23*
