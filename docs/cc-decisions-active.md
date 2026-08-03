# CC-Decisions — Running Ledger

docs/cc-decisions-active.md | v1.0 | July 2026 | CONFIDENTIAL

Governing rule: **CLAUDE.md Rule 46** (D-620) — every CC-decision is appended here at the
moment it is made, before the work implementing it is committed. The per-contract CodeClose
summarises this ledger; it does not replace it.

---

## How to Use This File

Append one row per CC-decision, at the moment the decision is made. Never batch at close.

Required per entry:

| Field | Content |
|---|---|
| CC-letter | The session's CC identifier, e.g. `CC-41-A`, `CC-0801-03` |
| Title | One line |
| Reasoning | Why this direction over the alternatives |
| Commit | Hash, filled in once known — `pending` until then |

Rule 46 conformance test: for every CC-letter named in a CodeClose, does a corresponding
entry exist in this file? Yes for all = pass.

---

## Coverage Boundary

**This ledger opens at Contract 41 (2026-07-30).**

CC-decisions from Contract 1 through Contract 40 — including the G-series, GA-1, and the
Contract 40 follow-ons — were recorded per-contract, not in a running ledger. They live in
the `OITrust-CodeClose-*.md` files in the repository root and in the ratified D-numbers in
`docs/decision-registry.md`. They are not restated here.

Backfilling those contracts into this ledger is an open item for Design. Until Design directs
otherwise, Rule 46's conformance test applies to Contract 41 forward only.

---

## Ledger

### Contract 41 — 2026-07-30 — ValidatorClose Document Install

| CC-letter | Title | Reasoning | Commit |
|---|---|---|---|
| CC-41-A | Ledger opens at Contract 41; Contracts 1–40 not backfilled | Rule 46 arrived with no ledger in the repository. Backfilling forty contracts of CC-decisions is a substantial reconstruction with real fabrication risk, and the source records already exist in the root `OITrust-CodeClose-*.md` files and the ratified D-numbers. Opening forward and stating the boundary explicitly is honest; a silently partial backfill is not. Escalated to Design rather than resolved unilaterally. Phil confirmed 2026-07-31: no backfill. | 22251a9 |

### Contract 41 — 2026-07-31 — Home RACI card, All Pending Gates, warning scope

| CC-letter | Title | Reasoning | Commit |
|---|---|---|---|
| CC-41-H | Aging marks the row rather than repainting it | CC-41-C fixed the header background but left the row treatment, which was the half still reading as nonstandard. Removed the zebra striping the All Initiatives grid does not have, and stopped the aging highlight painting the full row background at 8% amber: 19 of 25 live gates are past the 7-day threshold, so the wash covered nearly every row and the highlight carried no signal. Aging is now a 3px amber left border plus the day count in `#B87700` — deliberately not the `#F2A620` token, which is a fill colour and fails contrast as text. Also confirmed the `—` Level column is not a defect: those Initiatives predate sizing, and newer ones correctly show L2. | fa32fac |
| CC-41-G | Reuse RaciGlyphsComponent with an additive `readonly` input | Restyling glyphs inside the card would duplicate the visual language S-030 exists to prevent. Passing `busy=true` was rejected — it disables the follow button but still renders a hollow `i` on every row, implying a follow affordance the card does not offer. `readonly` defaults false, so the Initiative grid, My Initiative Status, and My Initiatives card are byte-identical. `c_provisional` is not carried by this summary: the provisional distinction needs Go to Build cast state the card does not fetch, so a Consulted stake renders solid here and dashed on the grid. Flagged rather than silently resolved. | afc7800 |
| CC-41-F | A separate discovery tool rather than a parameter on `get_my_raci` | `get_my_raci` maps letters onto a caller-supplied `cycle_ids` list; a Home card has no list to supply. Bolting discovery onto it would give one tool two opposite contracts. Excluded A from the card: an approval owed is a push obligation already served by My Actions, and repeating it here would read as a second work queue. Excluded CANCELLED per S-009 but deliberately kept COMPLETE — a just-approved Close Review is precisely what "recently completed" means. | afc7800 |
| CC-41-E | Targeted return refresh via a transient snapshot, not a full reload | "Refreshed on the one initiative only" is impossible with a plain route round trip, because navigating to the Initiative destroys the component and coming back re-runs a full load. Chose a 60-second sessionStorage snapshot of the queue plus a new optional `delivery_cycle_id` scope on `list_all_pending_gates`: on return, only the acted-on Initiative is re-queried and spliced in. TTL exists because rows for *other* Initiatives go stale and this screen's whole job is saying what is genuinely waiting. Rejected converting the screen to an S-018 right panel — it would make the refresh trivially correct, but Phil explicitly endorsed the existing navigation ("brought back to the initiative (it does)"), so that is a bigger change than asked for. Also fixed a dead Back link found while wiring this: `returnTo` was `'all-pending-gates'`, which `navigateByUrl` resolves as root, but the route is nested under `/initiatives`. | 6c3fc87 |
| CC-41-D | Submitter resolved in the existing users lookup, not a new query | `submitted_by_user_id` was already selected but never returned. Folding submitter-name resolution into the approver lookup avoids adding a query to a flow whose downstream waiting-on fixtures are FIFO-mocked — a new query would have shifted every slot after it (Rule 40). | 6c3fc87 |
| CC-41-C | Navy grid header rather than the pale reskin | The 2026-07-29 reskin aimed to match the Initiative list but used `#F7FAFC`; the Initiative grid actually uses `#12274A` with white uppercase labels. Copied the real treatment, including the `#F0F4F8` hover and `#E8F0FE` selected pair, so the two screens are genuinely the same surface. | 6c3fc87 |
| CC-41-B | Loud-on-open warnings get their own column rather than switching the other types off | D-616 wanted two loud artifact types; the Go to Build panel showed twelve. The cause was not migration 096 but the Contract 40 follow-on adding `computeArtifactWarningsByGate` to the read path, which exposed the ~10 types that have carried `gate_warning_behavior='primary_and_subsequent'` since Contract 25. Setting those to `'none'` would also have silenced their D-438 post-action warnings, which are still wanted — "is this mentioned after an action" and "is this loud before an action" are different questions. Migration 097 adds `gate_warning_on_open` (default false, so nothing is loud by inheritance) and the read path filters on it. Rejected inferring loudness from `gate_warning_through IS NOT NULL`: true of exactly these two rows today, but only by coincidence. | a92e1ff |

### Contract 42 — 2026-08-02 — AC-29 Maintenance Mode

| CC-letter | Title | Reasoning | Commit |
|---|---|---|---|
| CC-42-A | Both maintenance tools are authenticated admin operations | D-635 required correcting `get_maintenance_mode`'s "NO JWT REQUIRED" header rather than accommodating it, and that is done — no `/maintenance-mode` carve-out was added, `/health` and `/tools` remain the only exceptions. Separately: the rescued `set_maintenance_mode` header claimed "Admin role only" but the file carried **no admin check at all** — any authenticated user could have taken the application down. Added the gate matching `clear_division_status_config`. The header was aspirational; the code was not. Also added an explicit "no system_config row" failure rather than reporting success on an `UPDATE` that matched nothing. | ecdba21 |
| CC-42-B | Bootstrap interception empties the route table; hiding the outlet is not enough | build-c-spec §5.2 requires the maintenance screen to suppress all routing and **attempt no auth**. An `*ngIf` on `<router-outlet>` satisfies neither: the router still matches a route, runs `AuthGuard`, and lazy-loads the feature module. Chose `APP_INITIALIZER` (the only hook that runs before initial navigation — a guard has already resolved a route, an `ngOnInit` read flashes the shell) which, when the flag is on, calls `router.resetConfig([{ path: '**', children: [] }])`. A wildcard matching everything and resolving to nothing runs no guard and loads no module. `AppComponent.ngOnInit` also returns early, so no version polling, news ticker, or profile resolution runs. | ecdba21 |
| CC-42-C | The Arch-1 read is a plain fetch, and it fails open | The authorized exception permits a direct Supabase read; it does not require the SDK. A `fetch` against PostgREST avoids constructing a second Supabase client, restoring a session, or importing `@supabase/supabase-js` into a new location — all of which would be auth-adjacent work in a path that must attempt no auth. Fail-open on any error was the harder call: a failed read resolving to "in maintenance" could lock every user out of a healthy application on a network blip, while the inverse failure (a user reaching a mid-deploy app) is exactly the pre-AC-29 status quo. Fail-open is strictly no worse than today; fail-closed introduces a new way to be down. | ecdba21 |
| CC-42-D | Migration 095 is committed unexecuted, plus RLS | Disposition: **no execution required**. The rescue note inferred the table existed; this contract confirmed it directly against the live schema — one row, created 2026-04-07, carrying 053's column. Both statements are guarded, so running it would be a no-op. It is committed for rebuild completeness (Rule 48), which is the ARCH-34 hole it closes. Added `ENABLE ROW LEVEL SECURITY` to satisfy Rule 38 — idempotent, and policy ownership stays with 031 exactly as column ownership of `status_refresh_last_run` stays with 053. | ecdba21 |
| CC-42-E | ARCH-34 answered by enumeration, not inference | Contract 42 §6 worried that `system_config` was found by accident and that others might exist. Rather than reason about it, read the live table list from the PostgREST OpenAPI document and diffed it against every `CREATE TABLE` on master: 66 live tables, **exactly one** orphan, and it is `system_config`. All 7 live RPC functions trace to committed migrations. The concern is closed by evidence. Stated caveat rather than buried it: the diff covers the `public` schema's tables and exposed functions, not indexes, triggers, or policies. | ecdba21 |

### Contract 43 — 2026-08-02 — D-613 All Pending Gates Scope

| CC-letter | Title | Reasoning | Commit |
|---|---|---|---|
| CC-43-A | Division-Leader scope becomes `isLeadershipForCycle`, resolved once per Division | CC-40-P scoped the screen to directly-owned divisions while D-577 grants a parent Division Leader approval authority over child divisions via the ancestor walk — leaders held power over work the screen never showed them. Now one scope function, not two. Resolved once per **distinct Division** rather than per gate, because the walk would otherwise repeat for every gate in the same Division. The queries sit inside the `!isWide` branch deliberately, so no FIFO fixture in the IE/Admin/Phil tests shifts (Rule 40). Kept the `owner_user_id` query as the access gate — owning no Division still means the screen is not yours — and verified the Contract 41 ordering survives: `delivery_cycle_id` still narrows `gatesQuery` before the division filter, so a leader passing a foreign cycle id gets nothing. | ecdba21 |
| CC-43-B | `owns_division` is derived in the existing profile call, never stored | D-613 forbids an `is_division_leader` flag, and the reason generalises: a stored flag duplicates a fact `divisions.owner_user_id` already owns and drifts the moment ownership changes, silently costing someone access to their own queue. Folded a single batch query over `owner_user_id` into `list_users` — the call the app already makes for the profile — so no round trip was added. Chose `list_users` over a new tool because the sidebar reads its result already. | ecdba21 |
| CC-43-C | The CC-40-P source assertion is updated, not deleted | `contract40-reassign.test.js` asserted the old `ownedDivisionIds` filter as source text. D-613 supersedes that behaviour, so the assertion is now false by design. Rewrote it to pin the new scope (`leadershipDivisionIds`, `isLeadershipForCycle`) rather than removing it — the test's value is catching a silent revert, and that value survives the supersession. | ecdba21 |

### Contract 44 — 2026-08-02 — Notification Triggers (reconciled to as-built)

| CC-letter | Title | Reasoning | Commit |
|---|---|---|---|
| CC-44-A | One shared `notifyGateReturned`, closing the silent L2/L3 path | V2 found the real defect: the L1 consensus return notified the trio, and the single-approver return path — every Level 2 and Level 3 return, the majority of returns — sent **nothing**. One event, two implementations, one of them empty. Fixed by giving both paths a single helper rather than copying the L1 block, because a copy is what produced the divergence. Recipients are submitter + all trio minus the actor (D-345): the submitter was added because an Admin submitting on behalf was never told their own submission came back. "Return with Set Conditions" rides in the same email with the condition count rather than sending a second — two messages about one action is noise. `submitted_by_user_id` was added to the **existing** `gate_records` select, not a new query, so no FIFO slot shifts (Rule 40). | ecdba21 |
| CC-44-B | Contract 44's V1 premise does not hold; wording fixed, recipients unchanged | The spec states that at Level 1 "the trio members whose turn it actually is are not on the recipient list at all." That is false against the code: `deriveConsultedUserIdsV2` pushes the non-null trio into the Consulted set before any C stakes, so every remaining collected party is already addressed. I had begun adding the trio explicitly and reverted it — it was dead code the helper's dedupe would have absorbed, and shipping redundant code to satisfy a stale premise is worse than shipping none. What WAS wrong is the copy: at L1 the body read "You have been notified as an approver or a consulted party," which misdescribes consensus. It now states that the gate passes when every collected party approves. Added a regression test pinning the trio's presence so the derivation cannot silently drop them later. | ecdba21 |
| CC-44-C | The remaining nine trigger rows were verified, not rebuilt | Contract 44 says the trigger list "has exactly two entries." Fourteen `email_type`s are live, including rows the spec asks to build — `ie_override`, `governance_level_lowered`, `approved_over_returned_consultation`, `consulted_removed`, `cancel_requested`, `cycle_cancelled`, `post_approval_decline`, `approver_override`, `informed_gate_decision`. Building them as specified would have produced duplicate sends. Phil authorised fixing Contract 44 in-session rather than routing to Design, so scope was set to the genuine gaps only; the rest are reported as as-built for Design to reconcile the inventory against. | ecdba21 |

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL*
