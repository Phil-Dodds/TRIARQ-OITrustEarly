# Standard Proposal — Processing Feedback (Wait Cursor & Friends)

**Status:** Proposed to Design for Active Standard disposition (S-number pending)
**Origin:** Contract 33 UAT, 2026-07-12 — duplicate bullets created because a
slow server response gave no processing signal and the user clicked again.
**Reference implementation:** Team Meetings module + global BusyService
(commits of 2026-07-12).

---

## Philosophy

Every user action that talks to the server must produce **visible
acknowledgment within one frame of the click**. A user who sees nothing
happen assumes the click was lost and clicks again — the system's slowness
becomes the user's data-integrity problem (duplicate rows, double submissions,
conflicting writes). Feedback is therefore not polish; it is a correctness
control that pairs with input guards.

Three principles:

1. **Acknowledge instantly, everywhere.** The cheapest universal signal is the
   cursor. If the system is working, the cursor says so — no per-screen work.
2. **Show progress where the user is looking.** The cursor says "busy";
   the *place the result will appear* should say "coming." A pending ghost
   row beats a spinner in the corner.
3. **Feedback informs; guards protect.** Indicators never substitute for
   disabling the control. Every server-calling control disables itself (or
   becomes a no-op) from the first click until the call resolves. A slow
   response must never re-enable an action the user already took —
   **never revert optimistic state on a timer; revert only on a
   server-confirmed transition.**

## The three layers

### Layer 1 — Global busy indicator (automatic, zero per-screen cost)
All server calls flow through one client (`McpService`). While any **mutating**
call is in flight:
- `<body>` carries `.oi-busy` → `cursor: progress` on every element.
- A 2px animated activity bar renders fixed at the top of the viewport.

Mutating vs read is decided by tool-name convention (`get_*`, `list_*`,
`search_*`, and named polling tools are reads). **Reads and background polls
never trigger the indicator** — a 10-second sync poll that flashed the cursor
would train users to ignore it.

Implementation: `core/services/busy.service.ts` (in-flight counter →
BehaviorSubject + body class), one `finalize()` in `McpService.call`, ~10 lines
of CSS, one element in the app-root template. New screens inherit it for free.

### Layer 2 — Local feedback at the point of action
Required wherever the result of the action is a visible thing appearing,
changing, or disappearing:

| Action shape | Required treatment |
|---|---|
| Adds a row/item | **Pending ghost** — item appears instantly, dimmed, labeled "Saving…"; server row replaces it; removed on error. Ghosts are inert (no drag, no edit, no remove). |
| Removes a row/item | Row dims (≈40% opacity), its action glyph becomes "…", pointer events off. |
| Long-running action button | Label swaps to a gerund ("Pulling…", "Inviting…", "Creating…") and disables. |
| Icon-only button | Glyph animates (spin) and disables. |
| Toggle/checkbox settings | Disables with a "Saving…" label until resolved. |

### Layer 3 — Confirmation for silent saves
Auto-save-on-blur fields (notes, config dropdowns) give a small inline
"Saving… → Saved ✓" that fades after ~1.8s. Silence is indistinguishable from
failure; a fading ✓ costs nothing and answers "did that take?"

## What NOT to do
- **No blocking overlays or modal spinners** for routine saves — they destroy
  flow, especially on collaborative screens.
- **No optimistic-state revert timers** (the root cause of the originating
  incident).
- **No indicator on background reads/polls.**
- Don't rely on the indicator instead of the guard — both, always.

## Conformance test (binary)
For every control that issues a server call: (1) does something visible change
within one frame of the click, at or near the control? (2) is the control
inert to further clicks until the call resolves? (3) if the result is a list
change, does the list show it optimistically or as a pending ghost? All yes =
compliant.

## Adoption path
Applied module-wide to Team Meetings (reference). Layer 1 is already global.
Candidate follow-on: sweep Initiative Tracking and Admin surfaces against the
conformance test in a future contract.

---

*Pathways OI Trust · Standard Proposal · 2026-07-12 · CONFIDENTIAL*
