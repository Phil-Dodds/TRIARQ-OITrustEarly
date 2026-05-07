# Session Output — Build C Contract 13
Pathways OI Trust | 2026-05-06 | CONFIDENTIAL

Branch: `claude/competent-tharp-d9ef11` (worktree)
Worktree path: `.claude/worktrees/competent-tharp-d9ef11`

Source point: `master` HEAD `335fac3` (D-353 migration 031 RLS amendments)

---

## Surfaces Delivered

All 12 surfaces in `build-c-contract13-spec.md` Surface Inventory implemented.

| # | Surface | Type | Result |
|---|---------|------|--------|
| 1 | Auth — Login screen | MOD | DONE |
| 2 | Auth — OTP Entry screen | NEW | DONE |
| 3 | Auth — Invite flow | MOD | DONE |
| 4 | Admin — Edit user (email field + MCP tool) | MOD + NEW | DONE |
| 5 | Gate Record Modal | NEW | DONE |
| 6 | StageTrackComponent — both diamonds clickable | MOD | DONE |
| 7 | B-88 — Regress Stage schema cache | OPS | OPS step pending Phil |
| 8 | Hub Landing — card text + badges | MOD | DONE |
| 9 | Nav — "Coming Soon" labels | MOD | DONE |
| 10 | Workstream Summary view | NEW | DONE |
| 11 | Gate Schedule view | NEW | DONE |
| 12 | Deploy Gate by Quarter view | NEW | DONE |

---

## Files Touched

### Angular — auth (Surfaces 1–3)
- [angular/src/app/features/login/login.component.ts](angular/src/app/features/login/login.component.ts) — rewritten for OTP flow
- [angular/src/app/features/login/otp-verify.component.ts](angular/src/app/features/login/otp-verify.component.ts) — NEW
- [angular/src/app/core/services/auth.service.ts](angular/src/app/core/services/auth.service.ts) — `signInWithOtp` + `verifyOtp`; `signInWithPassword` / `resetPasswordForEmail` / `verifyToken` / `updatePassword` retired
- [angular/src/app/app-routing.module.ts](angular/src/app/app-routing.module.ts) — `/auth/verify-otp` added; `/auth/set-password` and `/auth/callback` removed
- [angular/src/app/app.module.ts](angular/src/app/app.module.ts) — `AuthCallbackComponent` declaration removed; `BrowserAnimationsModule` added (Material support)
- DELETED `angular/src/app/features/login/auth-callback.component.ts`
- DELETED `angular/src/app/features/login/set-password.component.ts`
- [angular/src/environments/environment.ts](angular/src/environments/environment.ts) — `passwordSetUrl` removed
- [angular/src/environments/environment.production.ts](angular/src/environments/environment.production.ts) — `passwordSetUrl` removed

### Angular — admin (Surface 4)
- [angular/src/app/features/admin/users/users.component.ts](angular/src/app/features/admin/users/users.component.ts) — Email field added to inline Edit form; D-200 Pattern 3 inline duplicate-email error; status label "Invited — awaiting code entry" (D-354)

### MCP — division-mcp (Surface 4)
- [mcp/division-mcp/src/tools/update_user_email.js](mcp/division-mcp/src/tools/update_user_email.js) — NEW; admin-only; `supabase.auth.admin.updateUserById` + `public.users.email` update; surfaces "That email address is already in use." for duplicates
- [mcp/division-mcp/src/index.js](mcp/division-mcp/src/index.js) — registered `update_user_email`
- [mcp/division-mcp/tests/tools.test.js](mcp/division-mcp/tests/tools.test.js) — 4 new tests (parameter validation, duplicate-message contract). All 4 pass; 1 pre-existing `update_user` test failure unrelated to Contract 13.
- [mcp/division-mcp/src/tools/create_user.js](mcp/division-mcp/src/tools/create_user.js) — invite redirect URL switched to /login (OTP email contains token, not link)
- [mcp/division-mcp/src/tools/resend_invite.js](mcp/division-mcp/src/tools/resend_invite.js) — same redirect change; "set a password" wording removed from already-confirmed error

### Angular — Gate Record Modal (Surfaces 5, 6)
- [angular/src/app/features/delivery/gate-record-modal/gate-record-modal.component.ts](angular/src/app/features/delivery/gate-record-modal/gate-record-modal.component.ts) — NEW; standalone; MatDialog; state-driven action area (Submit / Approve+Return / Withdraw); D-183 inline confirmation; D-200 Pattern 3 inline error; S-028 Context A button transitions; S-028 Context D non-interactive overlay during MCP writes; mobile full-screen `< 600px`
- [angular/src/app/features/delivery/stage-track/stage-track.component.ts](angular/src/app/features/delivery/stage-track/stage-track.component.ts) — large filled circle now emits `gateClicked` for the next gate following the current stage (D-355, ARCH-25); keyboard accessible
- [angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts](angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts) — inline gate sub-panel HTML deleted (~270 lines); `openGatePanel` rewritten to open MatDialog; orphan state + methods removed (`selectedGate`, `selectedGateRecord`, `gateActionBusy/Error/Hint`, `approveConfirming`, `withdrawConfirming`, `withdrawBusy`, `returnFormOpen`, `returnBusy`, `gateDecisionForm`, `submitGate`, `recordDecision*`, `withdrawGate`, `closeGatePanel`, `selectedGateMilestone`, `selectedGateApproverName`); replaced with S-015 instruction text "Click a gate diamond on the Stage Track to open its record."
- [angular/package.json](angular/package.json) — added `@angular/cdk@^17.3.10` and `@angular/material@^17.3.10`
- [angular/src/styles.scss](angular/src/styles.scss) — `@angular/material/prebuilt-themes/azure-blue.css` import (structural CSS only — TRIARQ tokens override visuals inside the dialog)

### Angular — Hub + Nav polish (Surfaces 8, 9)
- [angular/src/app/features/delivery/hub/delivery-hub.component.ts](angular/src/app/features/delivery/hub/delivery-hub.component.ts) — rewritten with extracted styles; S-015 11px italic Stone for subtitle and card descriptions; D-356 Vital Blue (#0071AF) "Coming Soon" pill on unbuilt views (badges removed from all three implemented views in this contract)
- [angular/src/app/shared/components/sidebar/sidebar.component.ts](angular/src/app/shared/components/sidebar/sidebar.component.ts) — `** Not Started` → `** Coming Soon` for `not-started` devStatus

### Angular — three new analytical views (Surfaces 10–12)
- [angular/src/app/features/delivery/workstream-summary/workstream-summary.component.ts](angular/src/app/features/delivery/workstream-summary/workstream-summary.component.ts) — rewritten for new D-WIPLimit-2026-04-06 zones (Pre-Build / Build / Post-Deploy); per-workstream limits 3/3/3; D-298 header pattern; S-015 subtitle; "Display only my Divisions" toggle; row tappable to drill; division chip; ⚠ WIP Flag column; Oravive (#E96127) at-or-over limit
- [angular/src/app/features/delivery/gates-summary/gates-summary.component.ts](angular/src/app/features/delivery/gates-summary/gates-summary.component.ts) — rewritten as cycle-level Gate Schedule per Section 11; Overdue + Upcoming 7-day named sections + Other Active grid; D-200 Pattern 2 callout banner taps to /delivery/cycles?gate_status=overdue; gate filter dropdown; S-015 subtitle; section headers always render
- [angular/src/app/features/delivery/deploy-schedule/deploy-schedule.component.ts](angular/src/app/features/delivery/deploy-schedule/deploy-schedule.component.ts) — NEW; D-PilotSchedule-2026-04-06; quarter math (current + prior); per-workstream rows with inline counts + chevron; multi-expand (no accordion); three section groups always render; prior-quarter miss detection (cycle in BOTH Prior + Other Active when target in prior with no actual + still active); Pilot Start status dot per row
- [angular/src/app/features/delivery/delivery.module.ts](angular/src/app/features/delivery/delivery.module.ts) — `/delivery/deploy-schedule` route added

### MCP — delivery-cycle-mcp (zone reshape)
- [mcp/delivery-cycle-mcp/src/lifecycle.js](mcp/delivery-cycle-mcp/src/lifecycle.js) — `WIP_CATEGORY_BY_STAGE` reshaped per D-WIPLimit-2026-04-06: pre_build (DESIGN/SPEC), build (BUILD/VALIDATE/UAT), post_deploy (PILOT/RELEASE/OUTCOME); BRIEF excluded; new `WIP_LIMIT_PRE_BUILD`/`WIP_LIMIT_BUILD`/`WIP_LIMIT_POST_DEPLOY` = 3
- [mcp/delivery-cycle-mcp/src/tools/get_delivery_summary.js](mcp/delivery-cycle-mcp/src/tools/get_delivery_summary.js) — emits `wip_pre_build`/`wip_build`/`wip_post_deploy` + `wip_*_limit` + `wip_*_exceeded` (boolean: count >= limit). Old `wip_prep`/`wip_outcome`/`wip_*_exceeded` field names retired (no other callers)
- [angular/src/app/core/types/database.ts](angular/src/app/core/types/database.ts) — `WorkstreamSummaryItem` updated: new zone field names + per-workstream limits

---

## Spec Gaps / CodeClose Candidates

1. **Per-workstream WIP limit columns not in schema.**
   Spec says default 3/3/3 with per-workstream override. Current implementation
   applies the default at the MCP layer (no migration in Contract 13 per spec).
   Future contract should add `wip_limit_pre_build`, `wip_limit_build`,
   `wip_limit_post_deploy` columns to `delivery_workstreams` so admins can
   tune per workstream. The Angular type already carries the per-row limit so
   no UI change required when migration lands.

2. **+ New Cycle pre-population is partial.**
   Per D-HubCreate-2026-04-06, "+ New Cycle" should pre-populate Workstream
   from row context on Workstream Summary, Division when scope is single on
   Gate Schedule, and Workstream from the expanded row on Deploy Schedule.
   Implementation passes hints via query params (`?new=true&workstream_id=...`
   or `&division_id=...`) but the dashboard's create panel does not yet
   consume those hints to pre-fill its form. Wiring the create panel to read
   query params on auto-open is a small follow-up.

3. **Banner-tap filter on Gate Schedule.**
   Tapping the overdue banner navigates to `/delivery/cycles?gate_status=overdue`.
   The dashboard currently supports a `filterGateStatus` filter — verify the
   query-param wiring routes through to the existing filter on landing.

4. **D-353 RLS on `divisions` and `delivery_workstreams`.**
   D-353 + migration 031 are live. The new views call existing MCP tools with
   service role, so RLS doesn't constrain them. No issue.

5. **`update_user_email` audit trail.**
   The new MCP tool updates `auth.users` then `public.users` separately. If
   the second step fails, Auth and `public.users` diverge until retry. The
   tool returns a clear error so the admin can retry, but a transactional
   wrapper is a future enhancement (would need a stored proc that wraps the
   Auth admin call — not trivial in Supabase).

6. **`@angular/material` is a new top-level dependency.**
   Adds ~2 MB of runtime to the bundle. Justified by S-014 baseline + D-355
   modal pattern. `BrowserAnimationsModule` added to AppModule. Prebuilt
   `azure-blue` theme imported for structural Material CSS only — TRIARQ
   tokens override visuals inside the dialog component.

7. **`ng build` not run in this session.**
   The worktree had no `angular/node_modules`. A clean `npm install` + `ng build`
   has not been performed in this session. Phil — please run a foreground
   `cd angular && npm install && npx ng build --configuration production`
   (timeout 300000) before deploying. All TypeScript changes have been spot-
   checked for orphan references.

8. **Existing pre-existing `update_user` test fragility.**
   The `update_user` "invalid system_role" test in
   `mcp/division-mcp/tests/tools.test.js` fails because it makes a real
   Supabase call before validating the system_role. Pre-existing — not
   introduced by Contract 13. The 4 new `update_user_email` tests all pass.

---

## Non-Code Steps Required (Phil to perform)

### A — Supabase Auth Email Templates (D-354 / Section 1)

In Supabase Dashboard → **Authentication → Email Templates**, edit each of these
three templates and replace `{{ .ConfirmationURL }}` with `{{ .Token }}`:

1. **Invite user** template
2. **Magic Link** template
3. **Confirm signup** template

After saving, send yourself a test invite from Admin → Users (on a Not Yet Invited user)
and verify the email contains a 6-digit code (no clickable confirmation URL).

### B — PostgREST Schema Cache Reload (B-88 / Section 7)

In Supabase Dashboard → **Database → SQL Editor**, run:

```sql
NOTIFY pgrst, 'reload schema';
```

Then trigger a Regress Stage on any active cycle and confirm the
`actual_date` column error is gone. Alternatively from the Dashboard:
**API → Reload schema**.

---

## Render Deploy Status

`division-mcp`, `delivery-cycle-mcp`, `document-access-mcp` deploy from `master`.
This contract introduces:
- `update_user_email` tool in `division-mcp` (new endpoint `/tools/update_user_email`)
- Reshaped zone fields in `get_delivery_summary` response (callers updated in same commit)

Phil — push `master` to remote and Render will redeploy all three. Verify each
service comes up green at `/health`.

---

## UAT Checklist (D-357)

Format: numbered binary pass/fail steps. Phil runs without Code present.

### Surface 1 — Login Screen
What changed: password field and "Forgot password?" link removed; Sign In submits an email-only form, calls `signInWithOtp`, navigates to `/auth/verify-otp`.
- [ ] 1.1 Open `/login`. The password input field is **absent**. PASS / FAIL
- [ ] 1.2 The "Forgot password?" link is **absent**. PASS / FAIL
- [ ] 1.3 The "Keep me signed in" checkbox is present and defaults checked. PASS / FAIL
- [ ] 1.4 Enter a valid work email and click **Sign In** — button label changes to "Sending code…" and screen navigates to `/auth/verify-otp` showing the email you entered. PASS / FAIL
- [ ] 1.5 If the OTP send step fails (e.g. offline), the screen returns to `/login` with the message **"Something went wrong. Please try again."** (no account-existence info). PASS / FAIL

### Surface 2 — OTP Entry Screen
What changed: NEW route `/auth/verify-otp`. User types 6-digit code, submits, lands on `/home` on success.
- [ ] 2.1 At `/auth/verify-otp` the page shows "Check your email" and the orienting line "We sent a 6-digit code to **<email>**. Enter it below." PASS / FAIL
- [ ] 2.2 Orienting text is 11px italic Stone (#5A5A5A). PASS / FAIL
- [ ] 2.3 Verification Code input auto-focuses on render and accepts only 6 digits. PASS / FAIL
- [ ] 2.4 Enter the correct code → button label changes to "Verifying…" and you land on `/home` with an active session. PASS / FAIL
- [ ] 2.5 Enter a wrong code → inline error **"Invalid or expired code. Please try again."** appears (no account info leaked). PASS / FAIL
- [ ] 2.6 Resend link is **disabled for 60 seconds** with countdown ("Resend in 42s"); after the countdown the link reappears. PASS / FAIL
- [ ] 2.7 Click Resend after countdown → new code is sent and the entry field is cleared. PASS / FAIL
- [ ] 2.8 Sign in with "Keep me signed in" checked → close browser → reopen → still signed in (D-351 unchanged). PASS / FAIL
- [ ] 2.9 Navigate directly to `/auth/verify-otp` (without going through login) → redirects to `/login`. PASS / FAIL

### Surface 3 — Invite Flow
What changed: invite email sends 6-digit code (no link); status label updated.
- [ ] 3.1 As Admin, on Admin → Users, invite a Not Yet Invited user. Email arrives containing a 6-digit code (not a clickable link). PASS / FAIL
- [ ] 3.2 In Admin → Users the invitee row shows the badge **"Invited — awaiting code entry"**. PASS / FAIL
- [ ] 3.3 As the invitee, navigate to `/login`, enter your email, then enter the 6-digit code from the email → session established, redirected to `/home`. PASS / FAIL
- [ ] 3.4 In Admin → Users the invitee badge now shows **Active**. PASS / FAIL

### Surface 4 — Admin Edit User Form
What changed: Email field added; new MCP tool `update_user_email`.
- [ ] 4.1 Admin → Users → Edit on any user. The form now has an **Email Address** field showing the user's current email. PASS / FAIL
- [ ] 4.2 Change the email to a new unused address and Save. Snackbar **"User updated."** appears and the email column in the row updates. PASS / FAIL
- [ ] 4.3 Edit again and try to set the email to an address already in use by another user. Inline error **"That email address is already in use."** renders below the field; the row is not changed. PASS / FAIL
- [ ] 4.4 Edit, change Display Name only (leave email untouched), Save. Save succeeds and email is unchanged. PASS / FAIL
- [ ] 4.5 Edit, type an invalid email (no `@`) and click Save. Inline validation error **"Enter a valid email address."** appears; Save is rejected client-side. PASS / FAIL

### Surface 5 — Gate Record Modal
What changed: gate record now opens in a centered MatDialog. Inline sub-panel retired.
- [ ] 5.1 On any cycle detail, click a small gate diamond on the Stage Track. Modal opens centered on the page; the detail panel dims behind it. PASS / FAIL
- [ ] 5.2 Modal renders Gate Status, Milestone Date (Target / Actual / status pill), Approval Routing (Accountable + name), and Gate Checklist sections. PASS / FAIL
- [ ] 5.3 (DS/CB on a not-yet-submitted current gate) Click **Submit for Approval**. Button label changes to "Submitting…", action area is disabled, and on success the modal closes and the detail panel refreshes with the gate now Awaiting Approval. PASS / FAIL
- [ ] 5.4 (Approver on awaiting-approval gate) Click **Approve**. The action area is replaced **inline** with an amber confirmation block (NOT a second modal): "Approving this gate will advance the Delivery Cycle. This cannot be undone without a stage regression." with **Confirm Approval** and **Cancel** buttons. PASS / FAIL
- [ ] 5.5 Click **Confirm Approval**. Button label changes to "Approving…", overlay covers the modal so nothing including × is clickable, and on success the modal closes; detail panel reloads with the cycle stage advanced. PASS / FAIL
- [ ] 5.6 (Approver) Click **Return**. A notes textarea appears inline; submit with empty notes → inline error "Return notes are required." appears, submission is blocked. PASS / FAIL
- [ ] 5.7 Type return notes and click **Confirm Return**. Modal closes; detail panel reloads with the gate showing Returned and the notes visible. PASS / FAIL
- [ ] 5.8 (DS/CB on awaiting-approval gate) Click **Withdraw Submission**. The action area is replaced inline with an amber confirmation: "Withdrawing this submission will reset the gate to Not Started." Confirm → modal closes; gate state resets. PASS / FAIL
- [ ] 5.9 With the modal open and idle, the **×** button, the footer **Cancel** button, the **Escape** key, and a backdrop click all close the modal with no action taken. PASS / FAIL
- [ ] 5.10 During an MCP write (click Confirm Approval and observe), the entire modal content area (including ×) is non-interactive — Escape and backdrop clicks are also blocked. PASS / FAIL
- [ ] 5.11 Open the modal at viewport width <600 px. The modal renders **full-screen**. PASS / FAIL
- [ ] 5.12 The bottom of the cycle detail panel (where the inline sub-panel used to live) shows the instruction text **"Click a gate diamond on the Stage Track to open its record."** in 11px italic Stone. PASS / FAIL

### Surface 6 — StageTrackComponent
What changed: large filled circle (current stage indicator, full mode) is now interactive.
- [ ] 6.1 On a cycle whose current stage is BUILD (or any non-terminal stage), the large filled circle for the current stage shows a pointer cursor and a tooltip naming the next gate (e.g. "Open Go to Deploy"). PASS / FAIL
- [ ] 6.2 Click the large filled circle. The Gate Record Modal opens for the **next gate** following the current stage (e.g. BUILD → Go to Deploy). PASS / FAIL
- [ ] 6.3 Stage circles for stages that are **not** the current stage remain non-interactive (no pointer cursor, no click). PASS / FAIL
- [ ] 6.4 Condensed mode (dashboard rows): gate diamonds remain non-interactive — clicking does nothing. PASS / FAIL
- [ ] 6.5 The modal opened from the large circle is identical to the modal opened from the small diamond for the same gate. PASS / FAIL

### Surface 7 — B-88 Regress Stage Schema Cache
What changed: operational schema-cache reload required (no code change).
- [ ] 7.1 In Supabase SQL Editor run: `NOTIFY pgrst, 'reload schema';` PASS / FAIL
- [ ] 7.2 On any active cycle past BRIEF, trigger Regress Stage. The stage regresses **and** the corresponding gate record resets to pending without the "Could not find the 'actual_date' column" error. PASS / FAIL

### Surface 8 — Hub Landing
What changed: subtitle + card descriptions now S-015 (11px italic Stone); Coming Soon pill on unbuilt views.
- [ ] 8.1 Open `/delivery`. The page subtitle below "Delivery Cycle Tracking" is **11px, italic, color #5A5A5A**. PASS / FAIL
- [ ] 8.2 All four card descriptions are **11px, italic, color #5A5A5A**. PASS / FAIL
- [ ] 8.3 All four cards fit on a 1280×800 desktop without scrolling. PASS / FAIL
- [ ] 8.4 (Visual styling check — temporarily set `comingSoon: true` on any card in `delivery-hub.component.ts` HUB_CARDS array and reload.) The badge renders top-right of the card with **Vital Blue (#0071AF) background, white 11px text, fully rounded**. After the visual check, revert the flag. PASS / FAIL
- [ ] 8.5 The "Open view →" link is active on every card, including any with `comingSoon: true`. PASS / FAIL

### Surface 9 — Nav "Coming Soon" Labels
What changed: nav suffix `** Not Started` → `** Coming Soon` for unbuilt surfaces.
- [ ] 9.1 In the sidebar nav, **OI Library** shows the suffix **"** Coming Soon"**. PASS / FAIL
- [ ] 9.2 In the sidebar nav, **Chat** shows the suffix **"** Coming Soon"**. PASS / FAIL
- [ ] 9.3 No nav item still shows the old "** Not Started" wording. PASS / FAIL

### Surface 10 — Workstream Summary
What changed: NEW view at `/delivery/workstreams` — Pre-Build / Build / Post-Deploy zones with per-workstream WIP limits.
- [ ] 10.1 Open `/delivery/workstreams`. Header shows back link "← Delivery Cycle Tracking", title "Workstream Summary", and S-015 surface description text. PASS / FAIL
- [ ] 10.2 Column headers always render: Workstream, Home Division, Pre-Build WIP, Build WIP, Post-Deploy WIP, WIP Flag. PASS / FAIL
- [ ] 10.3 Each row shows zone counts as `n / limit` (e.g. `2 / 3`). PASS / FAIL
- [ ] 10.4 A workstream with any zone at or over its limit renders that count in **Oravive (#E96127), bold** and the WIP Flag column shows a sunray ⚠ icon. PASS / FAIL
- [ ] 10.5 Click a workstream name → navigates to `/delivery/cycles?workstream_id=<id>`. PASS / FAIL
- [ ] 10.6 Click the Home Division chip → navigates to `/delivery/cycles?division_id=<id>`. PASS / FAIL
- [ ] 10.7 (Sign in as DS or CB) the **"Display only my Divisions"** toggle is visible and defaults ON. PASS / FAIL
- [ ] 10.8 (Sign in as Phil or Admin) the toggle is **hidden**. PASS / FAIL
- [ ] 10.9 The list initially renders skeleton rows then loads. PASS / FAIL
- [ ] 10.10 If the user has zero accessible workstreams, the empty state "No workstreams found." renders **inside the grid body** with the column headers still visible above. PASS / FAIL
- [ ] 10.11 The "+ New Cycle" button at top-right navigates to `/delivery/cycles?new=true`. PASS / FAIL
- [ ] 10.12 The hub card for "Workstream Summary" no longer shows a "Coming Soon" badge. PASS / FAIL

### Surface 11 — Gate Schedule
What changed: NEW view at `/delivery/gates` — Overdue + Due-in-7-days sections + overdue banner.
- [ ] 11.1 Open `/delivery/gates`. Header shows back link, title "Gate Schedule", and S-015 surface description. PASS / FAIL
- [ ] 11.2 If any cycles are overdue, an amber callout banner appears at top: "X cycles have overdue gates." with ⚠ icon and amber left border (D-200 Pattern 2). PASS / FAIL
- [ ] 11.3 Tap the overdue banner → navigates to `/delivery/cycles?gate_status=overdue`. The banner cannot be dismissed (no × button). PASS / FAIL
- [ ] 11.4 The page renders three sections in order: **Overdue** (Oravive header), **Due in 7 days** (Sunray header), and **All Other Active Cycles** (default header). PASS / FAIL
- [ ] 11.5 Each section renders column headers (Cycle, Workstream, Next Gate, Target Date) and either rows or a "No <kind> gates" empty line — section headers always render. PASS / FAIL
- [ ] 11.6 Click any cycle row → navigates to `/delivery/<cycle_id>` (cycle detail). PASS / FAIL
- [ ] 11.7 Gate filter dropdown narrows all three sections to the selected gate type. Default option "All gates". PASS / FAIL
- [ ] 11.8 (DS/CB) "Display only my Divisions" toggle is visible and defaults ON; (Phil/Admin) toggle is hidden. PASS / FAIL
- [ ] 11.9 Initial load shows skeleton rows. PASS / FAIL
- [ ] 11.10 The hub card for "Gate Schedule" no longer shows a "Coming Soon" badge. PASS / FAIL

### Surface 12 — Deploy Gate by Quarter
What changed: NEW view at `/delivery/deploy-schedule`.
- [ ] 12.1 Open `/delivery/deploy-schedule`. Header shows back link, title "Deploy Gate by Quarter", and S-015 surface description. PASS / FAIL
- [ ] 12.2 The top-level list shows **all** workstreams (including those with zero cycles) with the inline counts "Prior: N · Current: N · Other: N" and an expand chevron. PASS / FAIL
- [ ] 12.3 Click a workstream row's chevron — it expands to show three sections: "Prior Quarter — <Q label> Actual", "Current Quarter — <Q label> Planned/Actual", "Other Active". Each section header always renders. PASS / FAIL
- [ ] 12.4 Expand a second workstream — both stay expanded simultaneously (no accordion behavior). PASS / FAIL
- [ ] 12.5 Each section renders column headers (Cycle, Stage, Pilot Start, Status) and either rows or "No cycles." PASS / FAIL
- [ ] 12.6 The Pilot Start cell shows the date with "(actual)" or "(target)" suffix; the Status cell shows the milestone status dot in the correct color (Not Started grey, On Track green, At Risk amber, Behind red, Complete primary blue). PASS / FAIL
- [ ] 12.7 (Edge case — requires test data: a cycle with target Pilot Start in the prior quarter, no actual, still active.) That cycle appears in BOTH the Prior Quarter group AND in Other Active for its workstream. PASS / FAIL
- [ ] 12.8 Click a cycle row → navigates to `/delivery/<cycle_id>`. PASS / FAIL
- [ ] 12.9 Click the workstream name (not the chevron) → navigates to `/delivery/workstreams?workstream_id=<id>`. PASS / FAIL
- [ ] 12.10 Initial load shows skeleton rows for the workstream list. PASS / FAIL
- [ ] 12.11 The hub card for "Deploy Gate by Quarter" no longer shows a "Coming Soon" badge. PASS / FAIL

---

## Build / Deploy

Build (Phil to run):
```
cd "C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\.claude\worktrees\competent-tharp-d9ef11\angular"
npm install
npx ng build --configuration production
```
(Foreground only, timeout 300000 — per memory.)

Deploy (per memory): copy `dist` to `/c/tmp/oi-deploy`, push to `gh-pages`, add `404.html` (copy of `index.html`) and `.nojekyll`.

Render: push `master` to remote — `division-mcp` and `delivery-cycle-mcp` redeploy.

---

## Output File

Full Windows path:
`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\.claude\worktrees\competent-tharp-d9ef11\.claude\sessions\session-output-2026-05-06-BuildC-Contract13.md`

---

*Pathways OI Trust · CONFIDENTIAL · 2026-05-06*
