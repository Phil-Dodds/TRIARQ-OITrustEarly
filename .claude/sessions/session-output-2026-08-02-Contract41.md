# Session Output — 2026-07-31 → 2026-08-02 (Code)

**Session type:** Code
**Branch:** master · `c7037af` · in sync with origin
**Live:** gh-pages `71e5d1c`, `version.json` = `fa32fac`
**Governing files at session open:** CLAUDE.md v3.3/v3.6 → **v3.7** (installed this session)

---

## 1. ValidatorClose 2026-07-30 — installed

Input: `OITrust-ValidatorClose-2026-07-30-for-ClaudeCode.zip`. Installed verbatim, commit `22251a9`, pushed.

- `CLAUDE.md` → **v3.7**. Byte-for-byte identical to the Document Author output. Adds Rules 46–49 (running CC ledger, CodeClose opens with locked decisions touched, no migration before its file is on master, schema summary at close) and the Standing Notes section.
- `docs/decision-registry.md` → **v3.68**, next available **D-625**.
- `docs/session-archive/2026-07-14-spec-contract-36-37-closes.md` — new.
- `docs/cc-decisions-active.md` — **new**, created because Rule 46 arrived with no ledger in the repo.
- Five previously-untracked Design docs brought under version control.

**Arch-1 exception removals — both verified against code before accepting:**
- `system_config` suspension is correct: zero `system_config` references in `angular/src`, no `MaintenanceScreenComponent`. AC-29 genuinely NOT BUILT.
- `user_screen_state` exception deletion is correct: `screen-state.service.ts:99` routes through `McpService` to `division/get_user_screen_state`. D-380 migration complete; the exception was stale.

**Ledger boundary — Phil's decision 2026-07-31: no backfill.** Ledger opens at Contract 41. Contracts 1–40 remain in the root `OITrust-CodeClose-*.md` files and the ratified D-numbers. Do not re-propose.

---

## 2. Contract 41 — built, deployed, closed

Full record: **`OITrust-CodeClose-Contract41-2026-07-31.md`** (repo root). Not duplicated here.

Summary: eight CC-decisions **CC-41-A … CC-41-H**, all in `docs/cc-decisions-active.md`, all awaiting D-numbers.

| WS | Delivered |
|---|---|
| 1 | Loud-on-open gate warnings scoped to Context Brief + Scenario Journeys (migration 097) |
| 2 | All Pending Gates — navy grid, submitter column/filter/sort, targeted return refresh, dead Back link fixed |
| 3 | My RACI Gates home card + `get_my_raci_gate_summary` |
| — | CC-41-H post-deploy: row colours (zebra removed, amber wash reduced to border + day count) |

**Deployed in full.** Migration 097 run by Phil, `delivery-cycle-mcp` redeployed, Angular on gh-pages. Tests: delivery-cycle-mcp **546/546** (was 521).

**Phil's dispositions:** UAT **skipped**; D-442 untested-item list **acknowledged**; all Design items **deferred**.

**Ships unexercised** — recorded because the Back-link defect survived two contracts precisely by never being exercised: the Back-link fix, the targeted refresh, the new Home card.

---

## 3. Notification trigger audit (read-only) — for Appendix A

Asked at session end: who does `submit_gate_for_approval` email at Level 1, and does any return notification exist. Answered by reading the functions, not the CodeCloses. **No code changed.**

### 3.1 Submit at Level 1

`submit_gate_for_approval.js:762–808` builds one list: resolved approver **+** non-submitter Consulted set.

| L1 case | `resolveGateApproverV2` | `gate_submission` recipients |
|---|---|---|
| `oversight_user_id` set and live | that user, `source: 'oversight'` — wins outright at L1 (S-C4, `approver.js:28–45`) | oversight + non-submitter Consulted |
| No oversight (common L1) | `approver_user_id: null`, `source: 'l1_consensus'` (`approver.js:205–213`) | **Consulted set only — no approver recipient** |

Consulted set = `deriveConsultedUserIdsV2` (non-null trio + active participation-C stakes, groups expanded) minus the submitter, who is excluded deliberately (AC #43).

**Undocumented behaviour:** recipients are filtered on `byId[id]?.email`. A user with a null `email` is silently dropped, and if that empties the list the send is skipped with no log. At plain L1 that list is the entire notification.

### 3.2 Return notifications — exist, but asymmetric

| Return path | Code | Email |
|---|---|---|
| L1 consensus | `record_gate_decision.js:276–300` | **Yes** — `l1_gate_returned` to **trio minus the returner** |
| L2 / L3 single-approver | `record_gate_decision.js:456–498` | **None** |

Verified exhaustively: `record_gate_decision.js` has seven `sendGateNotificationEmail` call sites — 288, 590, 629, 661, 879, 910, 961. None falls inside 456–498, and the branch returns at 498 before reaching any of them.

The L1 return list is the **trio**, not the submission recipients — a Consulted party emailed at submission is not told the gate came back.

### 3.3 Finding for Appendix A

**Returning a gate at Level 2 or 3 emails nobody, including the submitter.** Returned gates do surface in-app — `list_pending_approvals.js:91` includes `'returned'` in its status filter — so it is pull-only, not invisible. Since L2/L3 is the routed-approver path and therefore the normal governance route, the recordable fact is the asymmetry, **not** "no return notification exists."

### 3.4 On the stated hypothesis

Partly correct. The G-series did amend recipient resolution without a recorded decision: `l1_consensus` returning a null approver is attributed in-code to "Contract G5 — D-570a RETIRED", which silently changed the L1 submission recipient from an approver to a consulted set. But the return trigger was not simply left unrevised — `l1_gate_returned` was **added** on the L1 branch while the L2/L3 branch was not given the matching call.

### 3.5 Not verified — do not assert in Appendix A

1. Whether the L2/L3 return gap is deliberate or an oversight.
2. Whether the `send-notification-email` Supabase edge function (`notification-email.js:169`) applies recipient filtering of its own.

---

## 4. Open items

**For Design**
1. D-numbers for **CC-41-A … CC-41-H** (eight). Registry v3.68, next available **D-625**.
2. Merge question: new RACI card vs **My Completed Gates** (D-430) — overlapping completions.
3. `c_provisional` not carried by the card: Consulted renders solid there, dashed on the grid.
4. Should the other ten artifact types stay loud on the submit/decision response?
5. **Pattern 2 row-tint inversion** — an 8% row wash stops being a signal when most rows qualify (19 of 25 here). Standards question.
6. **L2/L3 return notification gap** (§3.3) — deliberate or defect?

**For Phil**
7. `ng test` harness broken since before Contract 37. Every Angular change since has gone untested; three more this contract.
8. **AC-29 / maintenance mode** still unbuilt — Arch-1 `system_config` exception stays suspended, and no contract can follow build-c-spec §9 as written. Preservation branch `rescue/ac-29-maintenance-mode` (`1bc28c5`), notes at `RESCUE-NOTES-AC29.md` on that branch. Its finding stands: `public.system_config` exists in the live DB with no committed migration creating it — a Rule 48 violation predating the rule, which migration 095 on that branch closes.

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-08-02*
