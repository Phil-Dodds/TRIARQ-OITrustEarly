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
| CC-41-G | Reuse RaciGlyphsComponent with an additive `readonly` input | Restyling glyphs inside the card would duplicate the visual language S-030 exists to prevent. Passing `busy=true` was rejected — it disables the follow button but still renders a hollow `i` on every row, implying a follow affordance the card does not offer. `readonly` defaults false, so the Initiative grid, My Initiative Status, and My Initiatives card are byte-identical. `c_provisional` is not carried by this summary: the provisional distinction needs Go to Build cast state the card does not fetch, so a Consulted stake renders solid here and dashed on the grid. Flagged rather than silently resolved. | afc7800 |
| CC-41-F | A separate discovery tool rather than a parameter on `get_my_raci` | `get_my_raci` maps letters onto a caller-supplied `cycle_ids` list; a Home card has no list to supply. Bolting discovery onto it would give one tool two opposite contracts. Excluded A from the card: an approval owed is a push obligation already served by My Actions, and repeating it here would read as a second work queue. Excluded CANCELLED per S-009 but deliberately kept COMPLETE — a just-approved Close Review is precisely what "recently completed" means. | afc7800 |
| CC-41-E | Targeted return refresh via a transient snapshot, not a full reload | "Refreshed on the one initiative only" is impossible with a plain route round trip, because navigating to the Initiative destroys the component and coming back re-runs a full load. Chose a 60-second sessionStorage snapshot of the queue plus a new optional `delivery_cycle_id` scope on `list_all_pending_gates`: on return, only the acted-on Initiative is re-queried and spliced in. TTL exists because rows for *other* Initiatives go stale and this screen's whole job is saying what is genuinely waiting. Rejected converting the screen to an S-018 right panel — it would make the refresh trivially correct, but Phil explicitly endorsed the existing navigation ("brought back to the initiative (it does)"), so that is a bigger change than asked for. Also fixed a dead Back link found while wiring this: `returnTo` was `'all-pending-gates'`, which `navigateByUrl` resolves as root, but the route is nested under `/initiatives`. | 6c3fc87 |
| CC-41-D | Submitter resolved in the existing users lookup, not a new query | `submitted_by_user_id` was already selected but never returned. Folding submitter-name resolution into the approver lookup avoids adding a query to a flow whose downstream waiting-on fixtures are FIFO-mocked — a new query would have shifted every slot after it (Rule 40). | 6c3fc87 |
| CC-41-C | Navy grid header rather than the pale reskin | The 2026-07-29 reskin aimed to match the Initiative list but used `#F7FAFC`; the Initiative grid actually uses `#12274A` with white uppercase labels. Copied the real treatment, including the `#F0F4F8` hover and `#E8F0FE` selected pair, so the two screens are genuinely the same surface. | 6c3fc87 |
| CC-41-B | Loud-on-open warnings get their own column rather than switching the other types off | D-616 wanted two loud artifact types; the Go to Build panel showed twelve. The cause was not migration 096 but the Contract 40 follow-on adding `computeArtifactWarningsByGate` to the read path, which exposed the ~10 types that have carried `gate_warning_behavior='primary_and_subsequent'` since Contract 25. Setting those to `'none'` would also have silenced their D-438 post-action warnings, which are still wanted — "is this mentioned after an action" and "is this loud before an action" are different questions. Migration 097 adds `gate_warning_on_open` (default false, so nothing is loud by inheritance) and the read path filters on it. Rejected inferring loudness from `gate_warning_through IS NOT NULL`: true of exactly these two rows today, but only by coincidence. | a92e1ff |

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL*
