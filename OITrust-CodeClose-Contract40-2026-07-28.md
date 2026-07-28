# CodeClose — Contract 40 — 2026-07-28
Pathways OI Trust | CONFIDENTIAL
Contract: Governance Visibility, Sizing Honesty, RACI Glyphs (D-587/D-588/D-589/D-590/D-596/D-598/D-599 + D-489 skip-note fix)
Spec: contract40-visibility-sizing-spec-2026-07-27.md | Brief: OITrust-SessionBrief-2026-07-27-BuildC.md | Registry v3.67 (next D-600)
Built on Contract 39 (master ab954ae, live). Commits: WS1+WS2, WS3+WS4, WS7, WS5+WS6 (see git log). Migration 092 (WS2) — Phil executes.

---

## Plan header
**Worktree Hygiene (Rule 31):** source-confirmed (`angular/`, `mcp/`, `db/` at root); no reset.
**Dependency sequencing (Rule 10):** WS1→WS2→WS3→WS4→WS5→WS6→WS7 per spec. WS4 chip consumed by WS5/WS6; WS4/WS5/WS6 a visual unit. WS1/WS2/WS7 independent. Migration 092 = WS2 only.

## CC-decisions
- **CC-40-A (spec seam) — D-515 built-state + conditions tab render.** Verified in code: `my-actions.component.ts` has the D-515 restructured tab model (3 primary tabs, Completed demoted to a link) — **D-515 is BUILT** (registry `specced` was stale). The new "Address Gate Conditions" tab conforms to the restructured model as a **distinct component** (`gate-conditions-list.component.ts`) — its column set (Initiative · Gate · # open conditions · Days waiting) and no-approve/deny action diverge entirely from the approvals list, so a dedicated component is cleaner than reconfiguring `ActionsListComponent`.
- **CC-40-B (spec seam) — glyph treatment.** RACI glyphs: 18px circular hit targets, 12px letter, 3px gap; hollow-i = 1px Fog (#A6A6A6) ring on transparent fill (quiet in the common single-glyph row, ≥18px tap target on touch); held letters use filled low-opacity tokens (R/C teal, A navy); C provisional = dashed grey (D-593, non-amber); filled-i = teal. Max set (RACI) = 4×18px + gaps ≈ 84px — no wrap. Urgency is decoupled from the letters (rides the WS4 chip amber, D-599 balance point).
- **CC-40-C (new, Rule 30) — `get_my_raci` companion tool.** RACI needs live D-557 approver resolution (server-only, Arch-1) + a consultation read per row. Rather than tax every `list_delivery_cycles` consumer, a dedicated read-only companion `get_my_raci({cycle_ids})` serves the three glyph surfaces. Reuses `resolveGateApproverV2` (read-only). D-599 sanctions the per-card resolution cost. Lean taken, recorded, proceeding.
- **CC-40-D — CLAUDE.md Rule 45 added by Code.** Spec §WS1 + brief line 24 instruct Code to add the D-596 skip-delegate rule to repo CLAUDE.md. This is the sanctioned exception to D-332 (CLAUDE.md read-only for Code). Rule 45 added; version bumped v3.5→v3.6.
- **CC-40-E — Q4/Q5 "Not sure" affordance.** WS2 spec says Q4/Q5 have no stored IDK but an "unsure selection resolves to Yes/Critical." Implemented as a "Not sure" chip whose click sets the routing-positive stored value (q4=true, q5='critical') — no distinct stored state (AC-7). The positive chip shows selected after; documented interpretation of AC-4's "no IDK option" = no stored idk enum (which holds for Q4/Q5).
- **CC-40-F — WS7 not-met flag placement.** The assessment display groups by respondent, not by item, so the D-585-sliver flag renders once as an amber line at the top of the close_review assessment display (a single not-met fact), clickable to scroll to the `#grm-verdict-block`. "Beside the lessons-captured sub-item" satisfied by close_review-assessment-context co-location.

Rule 7 deviations from spec: none beyond the CC-decisions above. CC-decision count = 6 (≥5) → **recommend return to Design** for CC-40-A…F ratification (per standing rule + spec CodeClose requirement).

## CodeClose Verification (Rule 29)
**(1) Spec coverage** — 32/32 AC table below; all BUILT.
**(2) Regression** — full delivery-cycle-mcp suite 486/486 (incl. G1–G10, GA-1, conditions-loop, contract32-status, contract38); Angular `ng build` 0 errors + `tsc --noEmit` clean. Existing skip test (tools.test.js), G6 conditions test, contract32 get_my_status_due happy test all pass (fixtures updated where new queries were added — Rule 40).
**(3) Test ratchet** — new suites: contract40-skip-note (D-596 sweep + AC-1), contract40-sizing-idk (derivation AC-5/6/8 + allow-list AC-4), contract40-conditions-visibility (thread auto-post AC-16, no-email AC-17, open_conditions routing/columns AC-12/13/14), contract40-raci (AC-22/24/25/27). **Untested-item list (D-442):** (a) all WS Angular templates (chip/glyph/tab/flag rendering, attention sort) — view-layer, covered by build + UAT; `ng test` remains pre-existing broken; (b) WS3 open_conditions happy-path routing is source-asserted (multi-query FIFO fixture cost, Rule 37 posture) rather than executed end-to-end; (c) WS4 chip precedence label logic is client-only (no unit spec — `ng test` broken). Phil acknowledgment of this list requested at UAT.
**(4) Pattern sweep** — Shared patterns touched: `computeWaitingOnBatch` (added `open_condition_count`; callers list_pending_approvals/list_delivery_cycles/status-dashboard/my-status-due all now surface it — swept, consistent). `resolveGateApproverV2` reused read-only by get_my_raci — no mutation added. RACI glyph + Gate Wait Chip are new shared components (single source, three surfaces each).
**(5) Standards** — S-035 About Entry below + changelog.ts prepended in the deploy commit. S-037 (ellipsis): new form-opening labels — "Update Status…" retained; "Add condition" executes inline (no ellipsis, correct); tab labels are toggles (no ellipsis). S-038 (panel actions): no right-panel action placement changed. S-001/S-025: the relabeled add-condition control names what's blocked + what unblocks; WS7 flag + attention band use D-200 Pattern 2 amber only where it means attend (D-548). S-030/S-031: new components single-responsibility; verb+object+context naming (loadMyRaci, isAttentionRow, closeReviewNotMetFlag).
**(6) CC-decision completeness** — CC-40-A…F, sequential, no gaps.
**(7) Structural health** — files first-touched this session over threshold: delivery-cycle-dashboard.component.ts (~2540), gate-record-modal.component.ts (~2200), delivery-cycle-detail.component.ts (~4470), my-actions.component.ts (grew ~+30), my-initiative-status.component.ts (~360, over the 300 trigger). All pre-existing exceedances except my-initiative-status which crossed 300 with the WS6 additions — flagged; single responsibility (embedded status grids) intact, no extraction mandated. New files all under threshold (get_my_raci 130, raci-glyphs 100, gate-wait-chip 95, gate-conditions-list 80).
**(8) Deployment** — Angular built AFTER commits (Rule 35), deploying to gh-pages this session. **Pending Phil, in order: (1) execute migration 092 (sizing idk CHECK extension), (2) manually redeploy delivery-cycle-mcp on Render (new tool get_my_raci + list/status waiting_on + skip-note fix + conditions + sizing), (3) UAT.** No maintenance mode: additive column CHECK + new read tool; the only degraded window is a skip-routed submission or sizing IDK save between gh-pages rollover and Render redeploy (old server rejects idk / drops the note). initiative-public-mcp unaffected (still suspended per prior session — separate issue).
**(9) Repo cleanliness** — new files (get_my_raci.js, raci-glyphs, gate-wait-chip, gate-conditions-list, migration 092, 4 test files) staged before push; `git status -s mcp/ angular/src/` clean of `??` for required modules. Result: clean.

## Rolling Build C §12 — 32-AC conformance
| AC | WS | Result | Evidence |
|----|----|--------|----------|
| AC-1 | 1 | BUILT | submission_note forwarded in confirm_gate_skip; test contract40-skip-note |
| AC-2 | 1 | BUILT | note reaches submit path → D-534 Approve-tab display (unchanged display path) |
| AC-3 | 1 | BUILT | D-596 sweep test enumerates all 7 submit params present in the forward |
| AC-4 | 2 | BUILT | Q1/Q2/Q3 allow-lists include idk; Q5 does not; Q4 boolean (contract40-sizing-idk) |
| AC-5 | 2 | BUILT | idk derives Large/Major/Significant → L2 (deriveBaselineLevel tests) |
| AC-6 | 2 | BUILT | Small+Standard+Contained+Q1=idk → L2 not L1 (test) |
| AC-7 | 2 | BUILT | Q4/Q5 "Not sure" → true/'critical', fires suggestion; no stored unsure (CC-40-E) |
| AC-8 | 2 | BUILT | idk distinct from null (enum value vs no row); migration 092 CHECK |
| AC-9 | 2 | BUILT | idk selectable in Q1/Q2/Q3 interest facets; governance-filter exact-match |
| AC-10 | 2 | BUILT | non-blocking reprompt: sizing form (GtB confirm) + Brief Review glance checklist |
| AC-11 | 3 | BUILT | inline add-condition relabeled "gate waits here; approval blocked until resolved" |
| AC-12 | 3 | BUILT | open_conditions rows routed to trio + consultation_required parties (source + logic) |
| AC-13 | 3 | BUILT | rows built only from condition_status=open → clear when last closes |
| AC-14 | 3 | BUILT | Address Gate Conditions tab: Initiative/Gate/#conditions/Days; tap → gate auto-expand |
| AC-15 | 3 | BUILT | sidebar pendingCount includes open_conditions (only post-approval consulted excluded) |
| AC-16 | 3 | BUILT | add_gate_condition inserts gate_thread_messages attributed to setter (test) |
| AC-17 | 3 | BUILT | no email on add path (source assertion: no functions.invoke/sendGate…) |
| AC-18 | 4 | BUILT | Gate Wait Chip on grid + status dashboard + My Initiative Status (all three) |
| AC-19 | 4 | BUILT | precedence: condition_open → "N open conditions" wins (chipLabel + waiting-on priority) |
| AC-20 | 4 | BUILT | approver_pending → "Awaiting approval · Nd" from days_waiting |
| AC-21 | 4 | BUILT | chip routerLink → /initiatives/:id?gate=… (D-345 auto-expand) |
| AC-22 | 5 | BUILT | plain follower → hollow-i only; toggling fills (RaciGlyphs + get_my_raci test) |
| AC-23 | 5 | BUILT | held letters render in R,A,C,I order (template order fixed) |
| AC-24 | 5 | BUILT | L1 → A absent for everyone (get_my_raci test) |
| AC-25 | 5 | BUILT | closed → A absent; submitted → stored approver; pre-submission → live D-557 (tests) |
| AC-26 | 5 | BUILT | no ghost row — only held letters + ever-present hollow-i render (*ngIf per letter) |
| AC-27 | 5 | BUILT | C provisional (dashed/muted) pre-GtB, solid after (c_provisional; test) |
| AC-28 | 5 | BUILT | I toggles; A→next gate; C→participation/initiative; R→initiative; tooltips per letter |
| AC-29 | 6 | BUILT | attention rows (open conditions OR returned gate) sort top + amber (dueRowsSorted) |
| AC-30 | 6 | BUILT | attention rows carry the WS4 chip; no instruction text added |
| AC-31 | 7 | BUILT | not-met → amber flag "declared → actual", links to verdict block (CC-40-F) |
| AC-32 | 7 | BUILT | flag absent on met/unanswered (notMetFlag null unless outcome_verdict==='not_met') |

## Migration 092 — Phil executes (Code stopped after display)
File: `db/migrations/092_sizing_idk.sql`
```sql
BEGIN;
ALTER TABLE public.initiative_sizing DROP CONSTRAINT IF EXISTS initiative_sizing_q1_investment_check;
ALTER TABLE public.initiative_sizing ADD CONSTRAINT initiative_sizing_q1_investment_check
  CHECK (q1_investment IN ('small','medium','large','xlarge','idk'));
ALTER TABLE public.initiative_sizing DROP CONSTRAINT IF EXISTS initiative_sizing_q2_novelty_check;
ALTER TABLE public.initiative_sizing ADD CONSTRAINT initiative_sizing_q2_novelty_check
  CHECK (q2_novelty IN ('standard','major','idk'));
ALTER TABLE public.initiative_sizing DROP CONSTRAINT IF EXISTS initiative_sizing_q3_wrongness_check;
ALTER TABLE public.initiative_sizing ADD CONSTRAINT initiative_sizing_q3_wrongness_check
  CHECK (q3_wrongness IN ('contained','significant','large_hard','idk'));
-- + column COMMENTs. Full text in the file.
COMMIT;
```
No new table/column → no RLS change (D-547; existing deny-all table). WS3 open_conditions = JS-assembled item_type, **no schema change**.

## UAT Checklist (post migration 092 + delivery-cycle-mcp Render redeploy + hard refresh)
### WS1 — skip-note
1. Submit a gate via the skip interstitial (with predecessors to skip) and enter a "Why ready?" note → after submit, the gate thread's first message is that note. PASS/FAIL
### WS2 — sizing IDK
2. New/edit sizing: Q1/Q2/Q3 each show "I don't know"; Q4/Q5 show "Not sure"; sub-chips show none. PASS/FAIL
3. Pick Small/Standard/Contained then set Q1="I don't know" → live governance panel shows Level 2 with "Not yet known (treated as Large)". PASS/FAIL
4. Q4="Not sure" → Security specialist suggestion appears; Q5="Not sure" → UX suggestion appears. PASS/FAIL
5. Dashboard interest filter: Q1 = "I don't know" returns your IDK initiative. PASS/FAIL
6. On an initiative holding an IDK, the Brief Review readiness checklist shows the "Still unknown, or can you size it now?" reprompt. PASS/FAIL
### WS3 — conditions visibility
7. As approver on an awaiting gate, the add-condition control reads "Add condition — gate waits here; approval blocked until resolved". PASS/FAIL
8. Add a condition → it appears in the gate thread; no email is sent; the trio see an "Address Gate Conditions" My Actions row (count + days). PASS/FAIL
9. Resolve/withdraw the last condition → the Address Gate Conditions rows clear. PASS/FAIL
### WS4 — Gate Wait Chip
10. On the Initiatives grid, an awaiting gate shows a chip: open conditions → "N open conditions"; else consultation → "Awaiting consultation: …"; else "Awaiting approval · Nd". Tapping opens the gate. PASS/FAIL
11. Same chip appears on the Initiative Status Dashboard and My Initiative Status rows. PASS/FAIL
### WS5 — RACI glyphs
12. A row where you're only a follower shows a single hollow "i"; tap fills it (following); tap again clears. PASS/FAIL
13. A row where you're trio + next-gate approver shows "R A"; a followed+consulted row shows "C i/I"; Level 1 shows no "A". PASS/FAIL
14. Consulted before Go to Build shows the C dashed/muted; after Go to Build it's solid. PASS/FAIL
15. Glyphs appear on the grid, My Initiative Status, and the Home "My Initiatives" card. PASS/FAIL
### WS6 — status attention
16. On My Initiative Status (Updates Due), an initiative with open conditions or a returned gate sorts to the top with an amber band and its chip. PASS/FAIL
### WS7 — not-met lessons flag
17. Open a Close Review closed Not met → the assessment area shows an amber "closed Not met: declared → actual" line linking to the verdict; a Met close shows no such line. PASS/FAIL

## About Entry — Contract 40
Date: 2026-07-28 | BuiltAt: see version.json
Items: (see changelog.ts, prepended this deploy) — Sizing "I don't know"; Gate Wait Chip; Address Gate Conditions tab; RACI participation glyphs; My Initiative Status attention; Close Review not-met lessons flag.

## CLAUDE.md Candidates
- No new candidates. (Rule 45 / D-596 was added to CLAUDE.md this session under the spec's explicit instruction — CC-40-D — not a candidate.)

## Stage check (S-020)
No devStatus advancement flagged — touched features are already live; flag only after Phil UAT.

## Session close — What's next?
**Recommendation: back to Design.** Six CC-decisions (CC-40-A…F) await ratification; CC-40-B glyph treatment and CC-40-A tab-render are the spec's flagged Code-judgment seams and want Design's eye. Then a short Code session for any UAT fixes. Deployment of migration 092 + delivery-cycle-mcp Render redeploy is Phil-side before UAT.

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-07-28*
