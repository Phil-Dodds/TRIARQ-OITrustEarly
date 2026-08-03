# Section H — Code-Bound Specifications
## Session 2026-08-02 · Pathways OI Trust

Four contracts. Sequencing is load-bearing.

| Contract | Title | Priority | Depends on |
|---|---|---|---|
| 42 | AC-29 maintenance mode | **Highest** — closes Build C §12, unblocks Build B | None |
| 43 | D-613 rework — All Pending Gates scope | Medium | None. May ride with 42 |
| 44 | Notification triggers (phase 1) | **Urgent** — active throughput bleed | Verification gate |
| 45 | Queue, digest, manager relation (phase 2) | Medium | Contract 42 must close first |

## Standing requirements for every contract in this set

- **D-621** — the CodeClose opens by naming every locked decision touched.
- **D-622** — no migration executes unless committed first.
- **D-623** — produce `schema-summary.md` at close. Contract 42's reconciliation satisfies this.
- **D-620 / Rule 46** — every CC-decision gets a ledger entry at the point of decision, with reasoning. Where reasoning is absent, Design must write `Not recorded — Code decided.` per D-633 — which is a worse record than one you could have written in ten seconds.
- **D-624** — Design will not assert repo or deployment state from stale documents. Report actual state.

## Verification gates — answer before building

| # | Question | Blocks |
|---|---|---|
| V1 | Who does `submit_gate_for_approval` actually email at Level 1 today? | Contract 44 |
| V2 | Does any `gate_returned` notification exist? | Contract 44 |
| V3 | Does RLS enforce Division scope at the data layer? | Contract 45 (D-648) |
| V4 | Does ARCH-23 `date_status` already compute `behind` from a passed target date? | Contract 45 (D-649) |
| V5 | Is CC-41-H present in `docs/cc-decisions-active.md`? | Housekeeping |
| V6 | Does `set_oversight` check caller authority per D-561? | Housekeeping |

Any mismatch between a verification answer and the specs below routes back to Design. Do not resolve it inside the contract.

## Prerequisite before any contract opens

`CLAUDE.md` must be regenerated from `CLAUDE.src.md` v3.8 and pushed to master. Until then Code runs v3.7 and D-637's Rule 29(8) amendment is not in force.
