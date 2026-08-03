# Contract 44 — Notification Triggers (Phase 1)
Pathways OI Trust | Section H spec | 2026-08-02 | CONFIDENTIAL

**Decisions governing:** D-646, D-641. **Connects to:** D-467, D-557, D-564, D-565, D-581, D-345, D-560, D-561, D-562, D-569.
**Priority:** Urgent. Active throughput bleed. Independent of Contracts 42 and 43.
**Scope discipline:** immediate sends only. **No queue. No digest. No manager relation.** Those are Contract 45.

## The problem

`D-467` built a working sender — Supabase Edge Function `send-notification-email`, O365 SMTP via nodemailer, fire-and-forget, TRIARQ-branded, initiative CTA. Its trigger list has exactly **two** entries and was written **2026-06-18**.

The governance redesign landed **2026-07-19**. D-557 introduced Level 1 multi-party approval collection with **no external approver**. D-565 introduced conditions. D-581 added Return with Set Conditions. The trigger list was never revised.

Consequences, matching the observed symptom:
- At Level 1 there is no "assigned approver," so the trio members whose turn it actually is are **not on the recipient list at all**.
- `gate_returned` exists as an event and **fires nothing**. A submitter whose gate was returned finds out by logging in.

## Verification gate — do this first

Report before building. If either answer differs from the inventory below, **stop and route back to Design**.

- **V1** — Who does `submit_gate_for_approval` actually email at Level 1 today?
- **V2** — Does any return notification exist anywhere?

The G-series contracts may have amended recipient resolution without recording a decision. That is exactly the gap D-620 was written for, and it is why this is a gate rather than an assumption.

## Trigger inventory — immediate class only

Build these. Digest-class rows are Contract 45.

| Event | Recipients | Source |
|---|---|---|
| Gate submitted (L1) | All assigned trio members **except the submitter**; all Consulted on that gate | D-557 |
| Gate submitted (L2/L3) | Resolved approver; all Consulted on that gate | D-557, D-463 |
| **Gate returned** | Submitter; all trio | D-345 — **missing today** |
| Return with Set Conditions | Submitter; all trio | D-581 |
| Conditions set on approval | Submitter; all trio | D-565(2) |
| Consultation declined | Approver | D-459, D-460 |
| Post-approval decline | Approver; Phil | D-466 — already built, verify |
| Consulted/Informed removed or downgraded | Affected party | D-564 |
| Cancel requested | Cancel authority | D-566 |
| Initiative cancelled | All Consulted; all Informed | D-566, D-564 |

## The four loud exceptions — verify, do not redesign

Each is already specified as loud by a locked decision. Confirm each fires and carries the required content.

| Event | Recipient | Requirement | Source |
|---|---|---|---|
| Approved over returned consultation | Returning party | Must carry the approver's reasoning. Division Leader auto-notified where the consultation arose from a content trigger | D-569 |
| IE override approval | Displaced assigned approver | Distinct approval type; one-line reason | D-560 |
| Oversight cleared | The setter | Note required | D-561 |
| Level lowered | Displaced approver | Reason required | D-562 |

These are never suppressible and never batched. The friction is the point.

## Level 1 recipient resolution — the core change

At Level 1 a gate passes when **every collected party** approves: all assigned trio members (submitting counts as the submitter's approval) and all Consulted on that gate (D-557). The notification must therefore address **each remaining collected party individually**, not a single resolved approver.

Any single return by any collected party returns the gate entirely and clears all approvals. The return notification goes to the submitter **and all trio**, because all of them must realign and resubmit.

## Accept the noise

Volume rises for roughly two weeks until Contract 45 batches it. This is a deliberate trade — the alternative is continued silence on the blocking class. Tell users before they discover it.

## Out of scope

`notification_queue`, delivery classification, digest job, preference toggle, `manager_user_id`, "My team" filter, commitment checks. All Contract 45.

## Definition of done

- V1 and V2 reported.
- Every immediate-class row above fires to the correct recipients.
- Level 1 submission notifies each remaining collected party individually.
- Gate returns notify submitter and trio.
- All four loud exceptions verified.
- No digest, no queue table, no manager relation introduced.
