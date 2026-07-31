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
| CC-41-A | Ledger opens at Contract 41; Contracts 1–40 not backfilled | Rule 46 arrived with no ledger in the repository. Backfilling forty contracts of CC-decisions is a substantial reconstruction with real fabrication risk, and the source records already exist in the root `OITrust-CodeClose-*.md` files and the ratified D-numbers. Opening forward and stating the boundary explicitly is honest; a silently partial backfill is not. Escalated to Design rather than resolved unilaterally. | 22251a9 |

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL*
