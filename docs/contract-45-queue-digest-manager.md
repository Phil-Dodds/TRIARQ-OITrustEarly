# Contract 45 — Queue, Digest, and Manager Relation (Phase 2)
Pathways OI Trust | Section H spec | 2026-08-02 | CONFIDENTIAL

**Decisions governing:** D-638, D-639, D-640, D-641, D-642, D-643, D-644, D-645, D-647, D-648, D-649.
**Companion:** `companion/manager-awareness-and-digest-design-2026-08-02.md` — travels with this spec per D-571 until the family closes. Read it for the reasoning behind every rule below.
**Do not start until Contract 42 closes.**

## Verification gate — answer before building

- **V3** — Does RLS enforce Division scope at the data layer? **Blocks D-648.** If RLS enforces it, the cross-Division team view returns nothing and D-648 cannot be implemented as written — route back to Design. Interacts with the pending D-382 RLS audit.
- **V4** — Does ARCH-23 `date_status` already compute `behind` from a passed target date? **Affects D-649.** If it does, surface the existing field rather than adding a fourth commitment check.

## 1. Notification queue — D-642

`notification_queue`, written by MCP at each trigger. MCP tools **stop invoking `send-notification-email` directly**.

Columns, minimum: `notification_id`, `recipient_user_id`, `event_type`, `delivery_class` (`immediate` | `digest`), `initiative_id`, `gate_record_id` (nullable), `actor_user_id`, `headline`, `detail` (nullable), `created_at`, `sent_at` (nullable), `suppressed_at` (nullable).

**Headlines render at write time, not send time.** The event's facts are true when it happens; re-deriving at 06:00 risks describing a state that has since changed. This is the D-463 stored-at-submission pattern applied to messages.

Immediate rows dispatch on write through the existing D-467 Edge Function — provider, template, and CTA unchanged. Digest rows accumulate.

## 2. Delivery classification — D-641

> **If the recipient appears in the gate's D-565(4) waiting-on line, the message is immediate. If the recipient is an awareness party, it is digest.**

Four exceptions are always immediate regardless, and are never preference-suppressible: oversight cleared (D-561), level lowered (D-562), IE override (D-560), approval over a returned consultation (D-569).

Full inventory in the SOF, Appendix A.

## 3. Informed parties — D-647

D-458's deferral is lifted. Informed parties receive gate decisions — approved, returned, conditions — via the **digest**. Stake removal or downgrade and initiative cancellation remain immediate. Informed parties are never waited on and never appear in waiting-on.

## 4. Daily digest — D-643

One email per recipient per day, **06:00 ET**, system constant. Scheduled job — pg_cron invoking the existing Edge Function is the assumed mechanism; **confirm availability on the current Supabase plan and report** (ARCH-36-SCHED). This is the system's first scheduled job.

Sections, fixed order, **empty sections omitted entirely**:

1. Waiting on you
2. Blocked
3. At risk
4. Waiting on your team
5. Governance changes
6. Returned / conditions open
7. Moving
8. Completed
9. Started / assignments
10. Commitment checks

**At most five lines per section**, then an overflow link to the corresponding filtered surface. The email is the headline layer; the application is the detail layer.

**Line format:** `[Person] · [what] · [state] · [duration] · [holder]`. Every line names a person, an artifact, and a state. Examples:

> Maya's **Go to Build** on *Referral Leakage Analysis* has waited **9 days** on Sabrina K.
> *Pre-Auth Automation* is marked **behind** — Dev Anand is DCS.
> Three gates are waiting on **Dev Anand** — oldest **11 days**.

**Subject line** carries the counts that drive action: `3 blocked · 2 at risk — your team, Monday`. Never a generic label.

**Hard constraints:**
- **No rates, rankings, or per-person comparisons.** D-568's publication principle — diagnostic, not targets.
- Section names describe **work** states, never person states.
- **A digest with no content is not sent.**
- State lines appear on entry, then **weekly**. Event lines appear **once**.
- Before send, re-check unsent `blocked` and `at_risk` rows against current state and suppress lines whose state has resolved. Completed and moved lines are historical facts — do not re-check.

## 5. Preference — D-644

One toggle on the D-169 preference surface: **immediate** or **daily**. Default daily. Governs the awareness class only. The immediate class and the four loud exceptions are unaffected.

**No per-event-type matrix.** It moves the trigger taxonomy onto the user and permits silent opt-out from messages that unblock colleagues.

## 6. Manager relation — D-638

`users.manager_user_id uuid NULL REFERENCES users(user_id)`.

- Maintained on the D-410 User Management **Edit** panel via single-user picker. Admin and Phil only.
- Displayed **read-only** in the User View panel, so it is visible during any user review.
- **Application-layer cycle validation** — walk the chain on write, reject any assignment that would close a reporting loop. Self-referencing FKs permit loops and the resulting query never terminates.
- Interim demo pattern per the D-353 posture. Mark it as such in code comments — it is replaced by the TRIARQ infrastructure org model at port.

## 7. "My team" scope — D-639, D-648

Defined once: `manager_user_id = current_user`. **Direct reports only** — no transitive walk.

Added as an option to the Person/Submitter filter on **All Initiatives**, **All Pending Gates**, **Gate Schedule**, and **Initiative Activity** (`/initiatives/activity`). Filter persistence per D-171 under each screen's existing key. Chips per S-012.

**Composition rule — D-648, and get this exactly right:**

- "My team" selected with **no explicit Division choice** → **all Divisions**. If the Division filter sits at its default (`My Divisions`), selecting "My team" **resets it to All**.
- "My team" selected with an **explicit Division choice** → the Division choice is honoured; result is the intersection.

Only a deliberate Division selection narrows a team view. Division scope is convenience, not security — a manager's reports frequently work in Divisions the manager has no assignment to, and surfacing that is the point of the feature.

## 8. Manager fan-out — D-642

At write time, when a queue row is written for a user with a non-null `manager_user_id`, write a **parallel digest row** to the manager with a manager-framed headline.

**The four loud exceptions are person-specific and are NOT fanned out.**

## 9. Commitment checks — D-649

Three state checks against active initiatives, digest class, to the trio and each trio member's manager:

| Check | Condition |
|---|---|
| No commitment | Next gate has no target date |
| Weak commitment | Next gate target date more than **42 days** out (system constant, ARCH-33 pattern — code constant initially, admin-configurable later) |
| Stale commitment | Initiative dates not updated in N days (system constant) |

Per V4: if `date_status` already computes `behind` from a passed target date, surface that rather than adding a fourth check.

## Manager authority — D-640, and this is a hard boundary

An in-line manager receives visibility and voice, and **no authority**.

- **Not** added to the D-561 oversight setters.
- **Not** added to the D-562 level setters.
- **Never** a gate approver by virtue of the relation.
- **No "remind" button** anywhere. A manager may not generate a system message addressed to another person. The gate thread post (D-565(1)) is the attributed equivalent and already exists.

Manager reactions are four, all existing: read (digest CTA → initiative detail, gate auto-expanded), follow (claim Informed, D-564), nudge (post to gate thread, D-565), escalate (Division Leader or IE, the D-569(3) path).

## Out of scope — Phase 3

Team WIP rollup (D-397 pattern), team Consulted-load view, skip-level scope, raw dormancy detection, in-app notification centre, manager KPIs (belong to D-568's build), per-user digest send times.

## Definition of done

- V3 and V4 reported before build.
- No MCP tool invokes `send-notification-email` directly.
- Immediate class behaves exactly as Contract 44 left it.
- Digest sends at 06:00 ET, severity-ordered, empty sections omitted, not sent when empty.
- One preference toggle; immediate class unaffected by it.
- `manager_user_id` maintained, cycle-validated, visible in View panel.
- "My team" on four surfaces with the D-648 composition rule verified in both directions.
- Manager fan-out writes digest rows; loud exceptions do not fan out.
- Three commitment checks firing; state lines weekly, event lines once.
- No manager authority anywhere in the code path.
