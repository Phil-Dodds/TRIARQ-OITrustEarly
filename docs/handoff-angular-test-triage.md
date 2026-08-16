# Session Handoff — Angular Test Suite Triage

Pathways OI Trust | written 2026-08-13 | CONFIDENTIAL
Prepared for a future Code session. Hand this file to Code at session open.

---

## Session prompt

> The Angular Karma suite runs but 28 of 90 tests fail. Triage and get it to green.
> Read `docs/handoff-angular-test-triage.md` first — it has the full context, the
> failure categories, and the three tests that need my judgement rather than a fix.
> Do not change production code to make a test pass without telling me why.

---

## Why this matters

Between 2026-08-04 and 2026-08-13 three user-facing defects shipped that tests
should have caught:

1. `DEPLOY_GATE_SKIP_BLOCKED` rendered as a raw error code — the fix was placed in
   the `next()` callback, which never fires for a `success:false` response
   (CC-0806-04).
2. The D-569 over-returned reason prompt, dead the same way, unnoticed for nine days.
3. `confirm_gate_skip` enforcing an Admin restriction no decision contains, actively
   defended by a source-grep test (CC-0813-01/02).

The common thread: **the Angular suite has not run at all for months.** Five
TypeScript compile errors in two specs stopped the entire suite loading, so `npm test`
exited non-zero and nobody could tell absent coverage from failing coverage. That
blocker was fixed on 2026-08-13 (commit `6b0e528`). What is left is the backlog it hid.

---

## Current state

| | |
|---|---|
| Command | `npm test` in `angular/` (`ng test --watch=false --browsers=ChromeHeadless`) |
| Result | 90 executed, **28 failed** |
| Passing and new | 14 export tests in `team-meetings-export.utils.spec.ts` — leave alone |
| Compile blocker | Fixed — do not re-break `EpoRowView`'s export or the `ActivatedRoute` provider |

---

## Failure categories

### A — Harness plumbing (~25 failures, mechanical)

- **18 × `TypeError: Cannot read properties of undefined (reading 'subscribe')`**
  Spy objects missing methods the component calls. The spy needs the method
  stubbed to return an observable (`of(...)`), not merely to exist.
- **7 × `NullInjectorError: No provider for HttpClient!`** in
  `DeliveryCycleDetailComponent`. Add `HttpClientTestingModule`, or provide the
  services the component injects. Prefer providing spies over pulling in real HTTP.

No judgement needed. Suites affected: `DeliveryCycleDetailComponent`,
`StageTrackComponent`, and one loose `increments cancelEditSignal when edit panel is open`.

### B — Stale expectations (3 failures, need Phil)

These assert behaviour the application no longer has. **Do not simply update the
expectation to match the code** — that converts a possible regression into a
rubber stamp. For each, establish which side is correct, then bring the wrong one
into line and record a CC-decision.

1. **`Expected 'Next: Brief Review' to be 'In Brief · Next: Brief Review'`** (×2)
   The headline format lost its stage prefix, or the test predates the format.
   Cross-check against `cycle-headline.utils.ts` and the governing decision for
   the headline (D-463 area) before deciding.

2. **`Expected '#7E57C2' to be 'var(--triarq-color-sunray, #f5a623)'`**
   A gate-diamond colour. `#7E57C2` is a purple that appears in no token file;
   `--triarq-color-sunray` is a real token. Likely a hardcoded hex that should be
   a token, i.e. the **code** is wrong, not the test — but confirm against
   `triarq.tokens.v1.css` and the Design Token Rules in CLAUDE.md.

---

## Rules that apply

- **Rule 11** — logic-touching changes need a confirmed test baseline first. The
  baseline here is "28 failing, 62 passing"; record it before starting.
- **Rule 29 (3)** — test ratchet: list every logic-touching change and its
  protecting test in CodeClose.
- **Rule 46** — append each CC-decision to `docs/cc-decisions-active.md` as it is
  made, not at close.
- **Do not** delete or `xit` a failing test to reach green. A removed test is a
  silently lowered standard; if a test is genuinely obsolete, say so explicitly
  and record why.

---

## Definition of done

1. `npm test` exits 0 with 90 passing.
2. Each category-B decision recorded as a CC-decision with the reasoning.
3. Any production code changed to satisfy a test is called out separately from
   test-only changes — a code change means a real defect was found.
4. CodeClose states the before/after counts.

---

## Related open items (context, not scope)

- Filter redesign on the Initiatives grid — "Include completed"/"Include cancelled"
  behave unexpectedly; recommendation was a single Status control
  (Active / Completed / Cancelled / All). Parked by Phil.
- D-449 has one exit from a skipped gate, and it requires asserting a completion
  date — so a gate skipped as *not needed* forces a false date. Raised 2026-08-13,
  awaiting Design.
- Design ratification pending: D-644 deferral, D-600 admin-approver, D-450 override
  completion, CC-0806-01, CC-0813-01. D-447's registry entry should be annotated to
  state what it does **not** govern.

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL*
