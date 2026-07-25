# Design Agenda — Gates, Tier, Sizing & Participation
Pathways OI Trust | Prepared by Code for Design | 2026-07-24 | Phil UAT walkthrough session

Purpose: Phil requested a full Design pass on (1) per-gate approver coaching ("routing
judgment"), (2) the "Typically attached" reminders, (3) the per-gate submission blockers,
(4) Tier vs Level, (5) the set-level rules, (6) the Go to Build sizing re-confirmation UX,
(7) the Consulted & Informed attach flow, and (8) the New Initiative governance section.
Everything below is current production behavior, verified in code 2026-07-24.

---

## 1. "Routing judgment" — what it is, per-gate walkthrough

**What the approver sees:** one italic line on the Approve confirmation, e.g.
*"Routing judgment — catching what this Initiative needs that nobody realized yet."*

**Mechanics (Contract G7, D-555/D-565 item 5):** it is NOT gate-specific. There are four
rotating "gate purposes" in `gate-coaching.constants.ts` (GATE_PURPOSES), rotated by
day + gate index so the same user sees a different one over time (anti-habituation):
1. *Teamwork verification — this gate confirms the trio is genuinely aligned.*
2. *Craft development — the approver acts as coach and inspector; this is where the organization teaches what good looks like.*
3. *Stakeholder awareness with teeth — parties outside the trio follow along, question, and can genuinely stop passage.*
4. *Routing judgment — catching what this Initiative needs that nobody realized yet.*

**What the approver is "supposed to do" with it:** nothing mechanical — it is a framing
reminder of why the gate exists, shown at the moment of decision. It renders only in the
plain Approve confirm (not IE-override, not over-returned flows).

**Design question:** should this stay a rotating generic reminder, or become per-gate
coaching (each gate arguably has a distinct purpose — Brief Review = stop wrong efforts
cheaply; Go to Build = don't build the wrong thing fast; etc., which already exists as
GATE_COACHING_SHORT)? Two coaching systems (per-gate meaning + rotating purposes)
render on adjacent surfaces today.

## 2. "Typically attached before {gate}" — mechanics + the ordering oddity

**What it is:** an advisory reminder listing artifact types usually attached by this
gate that are missing. **Data-driven, not hardcoded** — from the `cycle_artifact_types`
table: active types whose `gate_warning_behavior` is `primary_only` (warn at their
primary gate) or `primary_and_subsequent` (warn at their gate and every later gate),
minus what is already attached. Admins control the lists by editing artifact types.

**Phil's observation confirmed: it appears AFTER the approval is recorded** (a
post-approve Acknowledge block, D-437/D-438 — "Approving without these is permitted —
this is a reminder"). The approval has already happened; the reminder cannot change it.
Same computation also runs at submission (suggestion_warnings on the submit response).

**Design question:** should the artifact reminder move BEFORE the Confirm Approval
action (approver sees what's missing while deciding), stay after (deliberate
non-blocking posture), or both? Current order reads backwards to the approver (Phil,
this session).

## 3. Per-gate summary — blockers, checklist, reminders

Canonical five gates. "Hard stop" = submission refused (server + UI twin). "Advisory" =
amber, never blocks.

### Brief Review
- **Purpose (coaching):** Context Brief approved; assumptions challenged; Outcome declared; first phase scoped. Design begins after.
- **Submit hard stops:** DCS assigned (D-389); DOL assigned unless Division `dol_required=false` (D-391/D-424); at Level 1 the assignment floor requires DCS+DOL absolutely (D-557); sizing must exist (D-567 interstitial, any gate); inactive workstream blocks (ARCH-23, any gate).
- **Checklist (advisory):** Scenario document attached; Outcome Statement set; "Do the sizing answers still look right now that the brief is written?" (always amber for sized initiatives).
- **Typically attached (current data):** Stakeholder input record, One-Pager, Stakeholder Interview Questionnaire, Context Brief, Scenario Journeys, True-life examples, Compliance & Risk Assessment (per Phil's screenshot — table-driven).

### Go to Build
- **Purpose:** requirements/plan approved — scenarios, real examples, Outcome statement, top risks. Engineering starts after.
- **Submit hard stops:** Context Brief artifact attached; Jira epic linked unless Division exempt (mig 074); AI functionality question answered; EPO assigned (D-390); L1 floor = full trio.
- **Special:** sized initiatives get the sizing answers RE-PRESENTED for confirmation before submit (D-567) — see §6.
- **Checklist:** none (Phil 2026-07-17 trim).

### Go to Deploy
- **Purpose:** pilot plan ready, DOL ready. Pilot starts after.
- **Submit hard stops:** AI question resolved to Yes/No; AI profile complete when Yes; external user-facing embedded AI requires AI Prod Board approval (board-triggered, untouchable); **Deploy gate cannot be skipped** (D-450).
- **Checklist (advisory, AI-conditional):** AI Production Governance Report (embedded+external); AI Delivery Requirements Record (analytics+external).

### Go to Release
- **Purpose:** pilot reviewed with DOL; full rollout starts after.
- **Submit hard stops:** internal AI requires AI Prod Board approval before release.
- **Checklist (advisory):** AI Production Governance Report (AI internal).

### Close Review
- **Purpose:** Outcome accomplished and reviewed with exec; Initiative closes.
- **Submit hard stops:** none beyond the universal ones (sizing exists, workstream active).
- **Checklist:** none.

### Approval-side blockers (all gates)
- Return requires notes; a return clears collected approvals AND open conditions (G5/G6).
- Open conditions block approval until resolved (single-approver route) or hold the L1 gate.
- L1 consensus gates: only trio members/Admin act; any single return returns the gate entirely.
- Approving over a returned consultation requires a recorded reason; returning party notified; DL auto-notified on content-triggered cases (D-569).
- IE override: approval-only, reason required, board gates untouchable (D-560).
- Advisory post-approve: EPO WIP warning (D-400) + Typically-attached reminder (§2).

## 4. How people monitor pending gates

- **My Actions** (`/actions`) + the sidebar badge + Home "Action Queue" card — `list_pending_approvals`: gates waiting on YOU (approver, trio member, cancel requests), with the shared waiting-on line.
- **All Pending Gates** (`/initiatives/all-pending-gates`, IE/Phil) — every awaiting gate in the Trust, aging highlighted (7-day threshold).
- **Initiatives list** — waiting-on line on each awaiting row + Next Gate column/sort; overdue gates counter card.
- **Initiative detail / gate modal** — the same single waiting-on line (G7: computed once server-side, identical on every surface).
- **Home** — All Pending Gates card (leadership), Action Queue card (everyone).

## 5. Tier vs Level — inventory for retirement/derivation decision

**Where Tier still APPEARS (display):** detail-panel badge (unsized initiatives only),
gate modal breadcrumb ("· Tier 3"), dashboard pills/dots + tier filter + tier sort,
EPO summary meta, Edit panel dropdown + helper text, initiative-public-mcp `tier` field.

**Where Tier still DRIVES behavior (business rules):**
1. `create_delivery_cycle` — required field, defaults to Tier 3 on the New form.
2. `update_delivery_cycle` — validated on edit; D-228 amber warning on change.
3. `sync_jira_epic` — pushed to Jira custom field (external contract!).
4. `initiative-public-mcp list_initiatives` — tier filter parameter (Claude Desktop consumers).
5. Legacy checklist row "Tier classification set" — unsized initiatives only.
(The old Tier-3 checklist items were retired 2026-07-17; `isTier3` is now void.)

**Adjacent since G1–G10:** governance Level (sizing-derived) controls approver routing,
consensus, cancellation authority — everything Tier used to imply. The two systems are
UNCONNECTED: Tier 3 + Level 1 is a legal combination and appears on the same form.

**Design options:** (a) retire Tier (migrate Jira field + public-MCP filter to Level);
(b) derive Tier from Level for external contracts, drop from UI; (c) keep both with a
documented distinction. Code lean: (b) then (a) — user-facing duplication is the harm;
the Jira/public-MCP contracts need a mapping decision before any drop.

## 6. Set-level rules (A2 — Design to evaluate)

Current implementation: effective level = `set_level ?? baseline_level`. `set_level` is
written via set_governance_level with authority checks (L3 = leadership-only chain:
Phil / IE / own-DL / ancestor DLs); level3_sub_leadership warnings; S-C6 divergence
prompt when the computed baseline rises above a set level. Post-Go-to-Build sizing
edits that change the approver require explicit confirmation (two-call).

**Phil (2026-07-24): "Phil thinks we had different rules/requirements proposed in
Design [A]."** Design should compare the shipped model above against the original
Design-A proposals and rule on divergences. Code cannot adjudicate this — the shipped
model traces to D-555–D-575 + checkpoint ruling, but earlier Design-A intent may
differ.

## 7. Go to Build sizing re-confirmation UX (A3/A4)

**Current behavior:** clicking Submit on Go to Build first interposes a read-only
re-presentation of the five sizing answers ("do they still look right?") — confirm
proceeds, or the user edits sizing. It fires AFTER the user tried to submit, which
Phil reads as backwards ("asks for sizing answers after the user tries to submit").

**Confirmed gap (A4):** the re-presentation shows NO alerts — Phil's test case had
Q1=Small with X-Large sub-answers and vendor/new-tech conflicts, and the confirm
screen offered no warning or coaching, even though the sizing engine computes
`sub_exceeds_answer` and `novelty_ux_mismatch` alerts (they render in the sizing form,
not in the gate-submission re-presentation).

**Also noted:** this re-presentation is a THIRD sizing rendering (create form, sizing
edit dialog, gate confirm) — it does not reuse the edit control, and Phil questions
whether the edit-dialog control is the right base at all.

**Design scope:** (1) move the sizing check earlier in the flow (e.g. a visible
"Sizing: confirmed for this gate" checklist row before Submit, instead of a post-click
interstitial); (2) render the computed alerts wherever sizing is shown; (3) one
shared sizing-display component across the three surfaces.

## 8. Consulted & Informed — strategy playback + redesign scope (E1)

**Shipped G4 model:** participation lives in `participation_records` (one row per
stake; person or Specialty Group holder). **Consulted** = deliberately attached on the
Initiative detail panel (role-scoped attach; picker offers Specialty Groups + People);
Consulted parties become gate consultations at their gates, with S-B5 auto-resolution
and D-569 loud over-return handling. **Informed** = self-serve (Follow star/button,
one-tap) plus rule-driven attachments (vendor → IT/Infrastructure Informed; G9
suggestions attach Security/UX as Consulted from sizing answers, with undo).

**Defects found this session:** the People optgroup was ALWAYS empty — `loadAllUsers()`
was never invoked on the detail component (fixed 2026-07-24); native `<select>` with
no search does not scale to the org's user list.

**Redesign scope for Design:** searchable person/group picker (the long-standing F-2
EntityPickerComponent gap is the same problem); show who will be Consulted/Informed
on the CREATE form (today invisible until after create); consider making attach
available at create time; clarity on group-held vs direct stakes.

## 9. New Initiative governance section (E2)

Phil's three asks: (1) the FINAL level unmistakable (today: "Level 3 baseline" text
block at the form bottom); (2) show WHO the approver will be before create (today:
approver resolution runs at gate submission — a create-time preview needs the resolver
run against unsaved data: division, DCS, oversight, level); (3) state clearly if/how
level or approver can change later (set-level authority + sizing edits).

Code note: (2) is real work — `resolveGateApproverV2` needs a preview variant taking a
cycle-shaped payload instead of a saved row. Feasible; spec it with (1) and (3) as one
section redesign, possibly a persistent "Governance summary" card pinned as answers
change rather than a block at the bottom.

## 10. Smaller items riding along

- **Persisted filters (E4):** the list opens at "Showing 3 of 107" from remembered
  filter state; correct per screen-state memory, but reads as missing data. Consider a
  louder "Filters active — clear" affordance on load.
- **Count flip-flop:** Active/total counters differed between renders (98/107 vs
  97/106) during the same session with nothing deleted. Suspect two count paths
  disagree (pending-cancel or in-flight rows). Code will chase separately.
- **Blocked-message hygiene:** "(ask an Admin to exempt this Division)" removed from
  the Jira blocker per Phil — users should not read admin instructions on every block.
- **Trusted-DCS silence:** derivation explanations no longer name the trusted-DCS rule
  (Phil 2026-07-24; fixed in code + tests). The rule still operates server-side.
  Design may want a policy on where (if anywhere) trust status is visible — currently
  Admin-only tooling.

---

## Changes Code already shipped this session (for Design awareness)

1. Trusted-DCS wording removed from derivation chips (neutral "→ Level 1/2").
2. Jira blocker admin-exempt hint removed (client + server).
3. Phil-only override levers (testing/cleanup): `phil_override` on submit + decision
   (bypasses all rules, event-logged, UI-confirmed), Deploy-skip allowed under
   override, `force_close_initiative` tool + detail-panel button (approves all
   remaining gates via the shared transition). All Phil-gated server-side
   (is_super_admin), all logged as `phil_override` events.
4. Participation picker People list fixed (loadAllUsers never called).
5. Edit Initiative: solid overlay background (ghosting read as defect), explicit
   "Governance Level & Sizing — managed on the Initiative panel" pointer.
6. New Initiative: Cancel/Create moved to the sticky header (footer was clipping).
7. Detail panel: action row clears the ✕ close button; dangling "· Not set"
   workstream line fixed.
8. Dashboard control row wraps instead of overlapping the Filters/+ New buttons.
9. Delivery Workstream "— recommended" tag removed (Phil: workstreams no longer
   recommended; possible future hide).

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-07-24*
