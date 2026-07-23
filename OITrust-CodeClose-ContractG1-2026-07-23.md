# OITrust CodeClose — Contract G1 (Governance Redesign Schema Foundation)
Date: 2026-07-23 | Session brief: OITrust-SessionBrief-2026-07-19-BuildC-G1
Spec: governance-redesign-code-spec.md (Section H) | Decisions: D-555–D-569
Scope: migrations + MCP tools + tests. No UI. Zero behavior change to existing gate flows.

---

## Worktree Hygiene
Source-confirmed — `angular/`, `mcp/`, `db/` present at repo root, branch `master`. No reset required.

## First Principles (Rule 1)
Applied before locking direction (trigger: 8 new tables, new MCP tool set).
Context: governance redesign needs four data primitives before any behavior change.
Question: smallest schema satisfying D-556–D-569 without touching existing flows.
Reduce: no UI, no dual-write, no array migration, no suggestions framework (spec §5).
Simplify: derivation as one function (`lib/governance-derivation.js`), single source of truth for upsert, derive tool, reassignment hooks, trust-flip recompute.
Automate: baseline cache recomputes automatically at every input change point.

## What was built

**Migrations (Phil executes manually — never run by Code):**
- `db/migrations/080_initiative_sizing.sql` — Primitive 1: sizing answers table (D-558/D-567)
- `db/migrations/081_governance_level_columns.sql` — Primitive 2: 8 columns on delivery_cycles + users.trusted_dcs (D-559/D-561/D-562)
- `db/migrations/082_participation_tables.sql` — Primitive 3: specialty_groups (+4 seeds), specialty_group_members, participation_records, division_default_consulteds (D-563/D-564)
- `db/migrations/083_gate_event_tables.sql` — Primitive 4: gate_approvals, gate_conditions, gate_thread_messages (D-557/D-565/D-569)

**MCP (delivery-cycle-mcp) — 25 new tools registered:**
- Sizing: get_initiative_sizing, upsert_initiative_sizing, derive_governance
- Level/trust/oversight: set_effective_level, clear_effective_level, set_oversight, clear_oversight, set_trusted_dcs
- Participation: add_participation, remove_participation, list_participation, list_my_participation, list_specialty_groups, add_specialty_group_member, remove_specialty_group_member, list_division_default_consulteds, add_division_default_consulted, remove_division_default_consulted
- Gate events: add_gate_thread_message, list_gate_thread, add_gate_condition, resolve_gate_condition, list_gate_conditions, record_gate_approval, list_gate_approvals

**Libraries:** `src/lib/governance-derivation.js` (derivation single source of truth), `src/tools/helpers/board-trigger.js` (board-gate detection).

**Hooks (logic-touching):** `assign_roles_to_cycle.js` + `update_delivery_cycle.js` recompute cached baseline_level on DCS reassignment (AC #4).

**Types:** `angular/src/app/core/types/database.ts` — InitiativeSizing, GovernanceDerivation, SpecialtyGroup(+Member), ParticipationRecord, DivisionDefaultConsulted, GateApproval, GateConditionRecord, GateThreadMessage; User.trusted_dcs; DeliveryCycle governance columns. Types only — no Angular behavior change, no deploy needed.

**Docs:** `docs/mcp-tool-inventory.md` created (AC #9); `docs/decision-registry.md` replaced with handoff v3.62 (D-318).

**Tests:** `tests/contractG1-governance.test.js` — 87 tests. Suite total 338/338 pass (`node --test tests/*.test.js`).

---

## CC-decisions (Rule 3 / Rule 30) — sequential, no gaps (Rule 17 verified)

- **CC-G1-01** — Migrations numbered 080–083 (next available after 079; spec instructed "check current max").
- **CC-G1-02** — `initiative_sizing.created_at` added beyond spec column list (CLAUDE.md DB standard). `updated_at` kept as the spec's provenance pair with `updated_by_user_id` — written explicitly by the upsert tool, NO set_updated_at trigger (a trigger would destroy the "NULL = never edited" meaning).
- **CC-G1-03** — S-003 conflict in spec flagged pre-code: `gate_conditions.status` is a bare generic noun. Built as `condition_status`. Spec conflict per Rule 2; improvement recorded per Rule 7.
- **CC-G1-04** — `division_default_consulteds` had no PK in spec. Added `default_consulted_id uuid PK` — remove tool addresses rows by it.
- **CC-G1-05** — Arch-6 soft delete: `deleted_at` added to `specialty_group_members` and `division_default_consulteds` (spec omitted). `participation_records` uses the spec's `removed_at` as its soft-delete. Gate tables are append-only — no delete tools shipped.
- **CC-G1-06** — `created_at`/`updated_at` + `set_updated_at` triggers on all new mutable tables per CLAUDE.md DB standard. `gate_approvals` and `gate_thread_messages` are append-only per `cycle_event_log` precedent (D-125 pattern) — no `updated_at`, documented in-file.
- **CC-G1-07** — RLS: ENABLE ROW LEVEL SECURITY, zero policies (deny-all) on all 8 new tables — Rule 38 default for MCP-only tables, migration 078 precedent, D-353-consistent (service role bypasses).
- **CC-G1-08** — Leadership check for set/clear_effective_level = Division Leader (`divisions.owner_user_id` of the cycle's Division) or Phil (`is_super_admin`). Spec says "DL/IE/Phil JWT" — IE role has no storage until G8; IE joins the check in G8.
- **CC-G1-09** — set_oversight/clear_oversight caller posture mirrors set_effective_level (DL/Phil). Spec lists no JWT annotation for these tools; D-561 implies leadership.
- **CC-G1-10** — Brief-vs-spec discrepancy: D-559 brief says "DL/Phil set" trusted flag; spec §2.5 says "admin/Phil JWT". Spec governs — set_trusted_dcs requires `is_admin` or `is_super_admin`.
- **CC-G1-11** — set_trusted_dcs recomputes cached baseline_level on every live Initiative where the user is assigned DCS. Spec's recompute trigger list (sizing upsert, DCS reassignment) omits trust flips — without this the cache goes stale against the D-558 derivation. Rule 30 autonomous decision.
- **CC-G1-12** — "Activity-logged" (D-559) for set_trusted_dcs: `trusted_dcs_changed` event per affected Initiative in `cycle_event_log` + structured server log for the user-level change. No user-level audit table exists and spec adds none — flagged for Design if a user-level audit surface is wanted.
- **CC-G1-13** — No assigned DCS → `trusted=false` branch in derivation (Level 2 on the else-branch). Spec silent; an absent DCS cannot be a trusted DCS.
- **CC-G1-14** — `record_gate_approval` approval_type `ie_override` restricted to Phil (`is_super_admin`) until the G8 IE role grant exists. Error message names the later contract.
- **CC-G1-15** — Duplicate-approval guard: one approval per (gate_record, approver, approval_type), MCP-layer only. No DB unique constraint — G5's any-return-returns-all semantics will clear/re-collect approvals; constraint decision deferred to G5.
- **CC-G1-16** — `list_gate_approvals` and `list_gate_conditions` added beyond the spec tool list — AC #9 requires every new table readable via a documented tool.
- **CC-G1-17** — Specialty group CRUD scope: list + member add/remove only, per spec line "list_specialty_groups / group member CRUD". Group create/rename/deactivate tools not built (groups seeded by migration 082).
- **CC-G1-18** — `helpers/board-trigger.js` mirrors the board conditions in `submit_gate_for_approval.js` rather than refactoring that file — G1 AC #10 zero-behavior-change guard. Pattern-sweep candidate: G2 refactors the submit tool to consume the helper.
- **CC-G1-19** — add_participation G1 auth posture: any active user may add; `set_via='self'` requires holder = caller (one-tap Informed). Role-scoped attach flows (trio/approver/leadership/division_default) wire in G4.
- **CC-G1-20** — resolve_gate_condition resolver = condition setter, admin, or Phil (spec silent; conditions gate progress — open resolution to everyone would break integrity). Consultation auto-resolve is G6.
- **CC-G1-21** — derive_governance is strictly read-only (returns freshly derived value + `cached_baseline_level` for drift visibility); only upsert/hooks write the cache.
- **CC-G1-22** — No tool inventory doc existed. Created `docs/mcp-tool-inventory.md` — full documentation for G1 tools (D-575 public-data-API intent), names-only inventory for pre-G1 tools.
- **CC-G1-23** — `docs/decision-registry.md` replaced with handoff v3.62 (repo had v3.61; D-318 travel pattern).
- **CC-G1-24** — S-027 impl_status: `decisions-active.md` is not in this repo and `decision-registry.md` is lookup-only for Code (D-318). Cannot update impl_status in the same commit — routed to Design via this CodeClose: D-557–D-565, D-567, D-569 schema/MCP layers are **built** (G1 scope only).
- **CC-G1-25** — Duplicate-active-stake guards on add_participation and add_division_default_consulted (spec silent; prevents duplicate C/I noise).
- **CC-G1-26** — Re-adding a removed specialty group member reactivates the soft-deleted membership row (composite PK requires it; avoids hard delete).
- **CC-G1-27** — UAT checklist produced with deployment prerequisites listed as step 0, though deployment is gated on Phil (manual migrations + manual Render redeploy). Precedent: Contracts 37/38 CodeCloses.

---

## Structural Health (Rule 12)

Files instructed for modification, read before writing:
- `update_delivery_cycle.js` — 305→311 lines; responsibility: Edit-surface save path for Initiative core fields; under 400-line service threshold.
- `assign_roles_to_cycle.js` — 149→158 lines; trio assignment; OK.
- `index.js` — 305→347 lines; tool registry + HTTP router; OK.
- `database.ts` — 872→1025 lines; canonical DB type definitions (type-only file; no logic).

New files over threshold:
- `governance_level.js` — 403 lines (400-line service threshold). Single nameable responsibility: leadership governance-level controls (5 tools). Declared per S-030 — split candidate if G2+ adds tools here.

## Rule 11 declaration
`assign_roles_to_cycle.js` + `update_delivery_cycle.js` = logic-touching. Baseline established before modification: 251/251 pass. After: all 251 original tests still pass (338 total with new suite). Tier declared in plan.

---

## CodeClose Verification (Rule 29)

**(1) Spec coverage — G1 acceptance criteria:**
1. Migrations apply cleanly / no existing column dropped, renamed, repurposed — **PASS by construction** (ADD COLUMN IF NOT EXISTS + new tables only; final proof at Phil's execution against production schema).
2. initiative_sizing rejects missing direct answers; accepts null subs/notes — **PASS** (NOT NULL constraints + MCP validation; tests: "rejects when a direct answer is missing", "happy path").
3. derive_baseline correct for all 12 derivation-table rows — **PASS** (12 explicit tests, table 4.1 verbatim).
4. baseline_level recomputes on sizing upsert and DCS reassignment — **PASS** (tests: upsert happy path; assign_roles + update_delivery_cycle recompute tests incl. negative case).
5. set_effective_level rejects missing reason; rejects non-leadership JWT — **PASS** (both tests present; DB CHECK backstop in 081).
6. record_gate_approval rejects ie_override w/o reason; rejects ie_override on board-triggered gate; rejects over_returned w/o reason — **PASS** (three explicit tests + board-trigger unit tests).
7. remove_participation remover≠holder rejects missing note — **PASS** (test present).
8. gate_approvals supports ≥3 approvals on one gate_record — **PASS** (schema has no blocking constraint; three-approval accumulation test).
9. Every new table readable via documented MCP tool; inventory doc updated — **PASS** (table→tool map in docs/mcp-tool-inventory.md §1.5; doc created, CC-G1-22).
10. Zero behavior change to existing gate submission/approval UI paths — **PASS** (no existing tool's logic altered except additive post-commit recompute hooks; 251 pre-existing regression tests all pass; no Angular behavior change — types only).

**(2) Regression check:** Surfaces touched = assign_roles_to_cycle, update_delivery_cycle, index.js registry. Verified by full suite: 338/338 pass including all 251 pre-contract tests. No Angular deploy required (types only).

**(3) Test ratchet:** Logic-touching changes and their tests:
- DCS recompute hook (assign_roles) → "triggers recompute when DCS changes" + negative test.
- DCS recompute hook (update_delivery_cycle) → "triggers recompute when DCS changes".
- Derivation function → 12-row table + chips/alerts tests.
- Every new tool → ≥1 happy + ≥1 error path (87 tests total).
**Untested items (D-442) — Phil acknowledgment requested:**
- DB-level CHECK constraints, FK integrity, RLS deny-all, seed inserts (migrations 080–083) — verifiable only at Phil's manual execution.
- index.js registry wiring — no unit test; verify via `GET /tools` after Render redeploy (UAT step 1).
- set_trusted_dcs structured console log line — not asserted.

**(4) Pattern sweep:** Board-trigger conditions existed in one other component — `submit_gate_for_approval.js`. Searched; no other site. Not refactored in G1 (CC-G1-18); flagged as G2 candidate. No other shared pattern modified.

**(5) Standards conformance:**
- S-003 — PASS (spec's bare `status` renamed `condition_status`; all other new identifiers qualified).
- S-020 stage check — no NAV_ITEMS feature built or modified; no advancement flagged.
- S-024 — MCP error messages use capitalized entity names (Initiative, Division Leader, Specialty Group, Gate).
- S-027 — cannot execute (CC-G1-24); routed to Design.
- S-030 — PASS (single responsibility per module; derivation logic extracted to shared lib, not duplicated).
- S-031 — test ratchet above; pattern sweep above; naming: all new methods verb+object+context (recomputeBaselineForCycle, requireDivisionLeaderOrAdmin, isBoardTriggeredGate…).
- S-032 — inactive Specialty Groups and inactive users blocked as new stake holders / members — PASS.
- S-035 — no user-facing surface changes this contract — About Entry exempt.

**(6) CC-decision completeness:** CC-G1-01 through CC-G1-27 sequential, no gaps — verified by enumeration above.

**(7) Structural health:** declared above; one file over threshold (governance_level.js, 403) with single responsibility stated.

**(8) Deployment:** Not executable by Code this contract — migrations are Phil-manual (session rule: display SQL, stop) and Render does not auto-deploy. **Deployment sequence for Phil:**
1. Run migrations in order: 080, 081, 082, 083 (Supabase SQL editor). Full SQL in `db/migrations/`.
2. `git pull` is not needed (work committed on master); Render dashboard → delivery-cycle-mcp → Manual Deploy (latest commit).
3. Health check: `GET /health` on delivery-cycle-mcp; `GET /tools` should list 25 new G1 tools.
4. Maintenance mode not required — zero behavior change to existing flows; new tables/tools are inert until called.
No Angular deploy required (types only — no runtime change).

**(9) Repo cleanliness:** 15 new files under `mcp/` + 4 migrations + 2 docs + 1 test — all `git add`ed in the deployment commit. Result: clean. (Pre-existing untracked files unrelated to G1 — session archives, db/ops, gate-coaching-spec — left untouched.)

---

## UAT Checklist (Rule 19) — API-level; valid only after step 0

**Step 0 (prerequisite):** run migrations 080–083 + Render manual redeploy of delivery-cycle-mcp (section 8 above). All calls below via any REST client with a valid Supabase JWT, or via Claude Desktop against the service.

**Surface: sizing + derivation**
1. `get_initiative_sizing` on any existing Initiative → `is_sized: false`, `sizing: null` (no backfill). PASS/FAIL
2. `upsert_initiative_sizing` with q3 omitted → error naming q3_wrongness. PASS/FAIL
3. `upsert_initiative_sizing` full answers small/standard/contained on an Initiative whose DCS is NOT trusted → `baseline_level: 2`. PASS/FAIL
4. `set_trusted_dcs` (as admin) trusted=true for that DCS → response lists the Initiative in `recomputed_cycles` with `baseline_level: 1`. PASS/FAIL
5. `derive_governance` → `effective_level: 1`, explanation chips mention trusted DCS. PASS/FAIL

**Surface: level + oversight**
6. `set_effective_level` without reason → rejected. PASS/FAIL
7. `set_effective_level` level 3 + reason as Phil → success; `derive_governance` shows `effective_level: 3` with baseline unchanged. PASS/FAIL
8. `clear_effective_level` + reason → effective falls back to baseline. PASS/FAIL
9. `set_oversight` (manual) then `clear_oversight` without note → clear rejected; with note → success. PASS/FAIL

**Surface: participation + groups**
10. `list_specialty_groups` → 4 seeded groups (Security, UX, Compliance, IT/Infrastructure). PASS/FAIL
11. `add_specialty_group_member` as non-admin → rejected; as admin → member appears in roster. PASS/FAIL
12. `add_participation` letter I, set_via self, holder = you → success; `list_my_participation` shows it. PASS/FAIL
13. As a different user, `remove_participation` on that record without note → rejected; with note → success. PASS/FAIL

**Surface: gate events**
14. `add_gate_thread_message` + `list_gate_thread` on any gate record → message with your display name. PASS/FAIL
15. `add_gate_condition` (general) + `resolve_gate_condition` → condition_status transitions open→resolved. PASS/FAIL
16. `record_gate_approval` ie_override without reason → rejected. PASS/FAIL
17. `record_gate_approval` ie_override on a board-triggered gate (AI external product-embedded Initiative, go_to_deploy) → rejected with board message. PASS/FAIL
18. Three different users `record_gate_approval` trio_member on one gate → all succeed; `list_gate_approvals` shows 3 rows. PASS/FAIL
19. **Regression:** submit + approve a gate through the existing UI exactly as before — no change in behavior. PASS/FAIL

---

## CLAUDE.md Candidates (Rule 16)

1. **Candidate:** "Multi-tool MCP modules are the norm for contract tool sets (precedent: roadmap_themes, sprint_calendars, Contract G1 modules). One file per domain, named exports, registered individually in TOOLS."
   **Why:** removes per-session re-derivation of file layout. **Trigger:** G1 layout decision at plan time.
2. **Candidate:** "cycle_event_log.delivery_cycle_id is NOT NULL — user-level (non-cycle) administrative actions have no audit table. If a contract needs user-level audit, surface to Design before improvising."
   **Why:** set_trusted_dcs activity-logging had no landing surface (CC-G1-12). **Trigger:** D-559 "activity-logged" implementation.
3. **Candidate:** "S-027 is not executable from Code sessions — decisions-active.md is not in the repo and decision-registry.md is lookup-only. impl_status updates route via CodeClose."
   **Why:** standing conflict between S-027 text and D-306/D-318 reality. **Trigger:** CC-G1-24.

## Stage check (S-020)
No feature built or modified in NAV_ITEMS scope this contract (schema + MCP only). No devStatus advancement flagged.

## Open items for Design
- D-numbers/impl_status for G1 build (CC-G1-24): D-557–D-565, D-567, D-569 → built (schema/MCP layer).
- CC-G1-08/-14: IE role storage lands G8 — confirm interim Phil-only ie_override posture.
- CC-G1-12: user-level audit surface for trusted_dcs changes — wanted or is cycle-level logging sufficient?
- CC-G1-15: DB unique constraint on gate_approvals deferred to G5 return-semantics decision.
- D-575 referenced in spec but absent from registry v3.62 (next available D-570) — flag for Author.

---

## Addendum — Meeting reminder daily-fire defect (same session, 2026-07-23)

**Defect (new, distinct from CC-38 f19):** presenter reminder emails fired every
day at lead time, not just on meeting days. Phil received a 1:01 PM reminder on
Thu 7/23 for a weekly-Monday series (latest meeting Jul 20, next Jul 27).
Root cause: `send_meeting_reminders.js` `occurrenceInWindow()` checks
time-of-day only — nothing consulted the series cadence. Every day with
`meeting_time`/lead set was treated as a meeting day; one-and-done log resets
daily → daily email to all 16 presenters.

**Fix:** schedule gate `isScheduledOccurrence()` in
`mcp/team-meetings-mcp/src/tools/send_meeting_reminders.js` — the window date
must equal the cadence-suggested next meeting date
(`cadence.js suggestNextMeetingDate`, same suggestion "Start next meeting"
uses). Fires whether or not the meeting instance exists (Phil 2026-07-23
direction). An instance dated that day also passes (reschedule/ad-hoc).

**CC-decisions (addendum):**
- **CC-R1-01** — Gate = cadence-suggested date (instance optional) OR
  instance-dated day. No cadence configured → instance-exists is the only
  schedule signal (otherwise reminders with no cadence can never be correct).
- **CC-R1-02** — Gate implemented as exported pure function; 5 unit tests added
  (Rule 37: no multi-query happy path against the single-result mock; fixtures
  computed relative to the real clock because suggestNextMeetingDate clamps to
  never-in-past).
- **CC-R1-03** — Known limitation: cadence math is UTC-date-space; for
  meetings at/after 8 PM ET with no instance created, the suggested date can
  sit one day ahead of the ET window date and the reminder would skip.
  All current series meet in business hours; flagged, not fixed.

**Rule 8 conflict check:** no conflict with G1 CC-decisions or session-brief
D-numbers. Refines Contract 38 f19 reminder behavior per Phil's live direction.

**Rule 11:** logic-touching. Baseline before: meeting-reminders.test.js 7/7;
full team-meetings suite 30 pass / 7 pre-existing failures. After: 12/12
reminder tests (5 new); suite 35 pass / same 7 pre-existing failures.

**Structural health:** send_meeting_reminders.js 266→~320 lines, single
responsibility (reminder sweep), under threshold.

**CLAUDE.md candidate (addendum):** team-meetings.test.js carries 7 stale
"returns error for non-admin caller" failures — expectations predate Contract
33's open-access model. `node --test tests/*.test.js` on team-meetings-mcp is
red at baseline. Candidate: repair or retire these tests next contract.

**Deployment:** push to master done; **Phil: manual Render redeploy of
team-meetings-mcp required.** No migration, no Angular change.

**UAT (after redeploy):**
1. Tomorrow (Fri 7/24) 1:00–3:00 PM ET: no reminder email for the
   Written Stand Up series. PASS/FAIL
2. Monday 7/27 ~1:00 PM ET: reminder email arrives (even before anyone
   clicks "Start next meeting"). PASS/FAIL
3. Render logs on any 30-min tick: summary line shows
   `skipped_off_schedule` ≥ 1 on non-meeting days. PASS/FAIL

---
*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-07-23*
