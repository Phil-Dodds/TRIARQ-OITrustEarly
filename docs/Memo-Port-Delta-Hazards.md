# Port Delta Hazards — what blocks users at the new production URL

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-08-17

Audience: the engineers copying the code delta into the myqone production repo.

Every item below is something in the current codebase that, carried across
unchanged, either locks users out of oi-trust.myqone.com, silently misdirects
them back to the retired system, or points production at the old database.
Ranked by how badly it breaks production.

---

## Blockers — production is down or locked out

### 0. The repository default branch is stale — clone `master`, not `main`

`Phil-Dodds/TRIARQ-OITrustEarly` has `main` as its GitHub default branch, but
`main` was last touched in April 2026 and is **503 commits behind `master`**.
All work lands on `master`; `gh-pages` carries the built artifact.

A port team that clones the repository without specifying a branch gets four
months of stale code — no governance redesign, no gate assessments, no
maintenance mode, none of Contracts 33–45. It will build and run, which is what
makes this dangerous.

```bash
git clone --branch master https://github.com/Phil-Dodds/TRIARQ-OITrustEarly.git
```

Fixed at source by pointing the default branch at `master`
(`gh repo edit --default-branch master`), which also lets scheduled workflows
fire — GitHub Actions only honours `schedule:` triggers from the default branch.

### 1. `angular.json:75` — production `baseHref` is the old subpath

```json
"baseHref": "/TRIARQ-OITrustEarly/",
```

Served from the root of a domain, every script, style, asset, and lazy chunk
resolves to `/TRIARQ-OITrustEarly/...`, 404s, and the user gets a blank page.

**Change to `"/"`.** This one line is sufficient — nothing else is hardcoded
around it. `APP_BASE_HREF` is deliberately not provided in code, all routes are
relative, and `version-check.service.ts:41` fetches a relative `version.json`
that resolves against `<base href>`.

### 2. `angular/src/environments/environment.production.ts` — points at the OLD Supabase project and the OLD MCP services

All seven values are unconditional constants with no env-var fallback:

```ts
supabaseUrl:     'https://dpnkxrrtqfqkhuzbljbw.supabase.co',
supabaseAnonKey: 'eyJ...',
divisionMcpUrl:      'https://division-mcp.onrender.com',
documentMcpUrl:      'https://document-access-mcp.onrender.com',
deliveryCycleMcpUrl: 'https://delivery-cycle-mcp.onrender.com',
initiativeMcpBaseUrl: 'https://oi-trust-initiative-public-mcp.onrender.com',
teamMeetingsMcpUrl:  'https://team-meetings-mcp.onrender.com'
```

Left unchanged this is the most dangerous failure mode on the list, because it
**works**: new production reads and writes the old, frozen database. Users see
plausible data and their saves land in the wrong system — or fail, since Early
is read-only after the freeze. `environments/environment.ts` carries the same
project ref for dev.

### 3. Three MCP CORS allowlists are unconditional constants

```js
app.use(cors({
  origin: [
    'https://phil-dodds.github.io',
    'http://localhost:4201'
  ],
```

`mcp/delivery-cycle-mcp/src/index.js:308`, `mcp/division-mcp/src/index.js:64`,
`mcp/document-access-mcp/src/index.js:33`. Every browser call from
`oi-trust.myqone.com` fails preflight — users authenticate successfully and then
nothing works. Add the new origin, ideally via an env var.

Note `mcp/team-meetings-mcp/src/index.js:87` is bare `app.use(cors())` — wide
open, so it will work, but it is the outlier and worth tightening rather than
copying as a pattern.

### 4. `public.users` rows must exist and match `auth.users` UUIDs

Identical guard in all four JWT middlewares (`middleware/jwt.js:46-60` in each
service):

```js
if (!userErr && (!userRow || userRow.is_active === false)) {
  return res.status(401).json({
    success: false,
    error: 'Your account is not provisioned for OI Trust access. Contact your System Admin.'
```

A **missing** `public.users` row is treated the same as a deactivated one. If the
port copies `auth.users` but not `public.users`, or the UUIDs do not line up
across the two Supabase projects, every user logs in successfully and is then
locked out of the entire application with that message.

This is the most likely port-day lockout after items 1 and 2. Verify before
opening to users:

```sql
SELECT count(*) FROM auth.users;
SELECT count(*) FROM public.users WHERE is_active AND deleted_at IS NULL;
SELECT a.id FROM auth.users a
  LEFT JOIN public.users u ON u.id = a.id
 WHERE u.id IS NULL;   -- expect zero rows
```

### 5. `db/migrations/056_team_meeting_tracks.sql:121` aborts on a fresh database

```sql
SELECT id INTO v_phil_id FROM users WHERE email = 'pdodds@triarqhealth.com' AND deleted_at IS NULL;
IF v_phil_id IS NULL THEN
    RAISE EXCEPTION 'pdodds@triarqhealth.com not found in users — cannot seed Product Ops track';
```

Running migrations in order against a fresh database with no users aborts at 056
and leaves 057–100 unapplied — a half-built schema. Either seed that user first
or make the seed block conditional.

---

## Misdirection — users are sent back to the retired system

### 6. Invite and notification links fall back to the old URL

All have env vars, so they are config fixes — but they fail **silently** if the
var is unset, which is the trap.

| File:line | Env var | Fallback if unset |
|---|---|---|
| `mcp/division-mcp/src/tools/create_user.js:26` | `APP_INVITE_REDIRECT_URL`, `APP_PASSWORD_SET_URL` | `https://phil-dodds.github.io/TRIARQ-OITrustEarly/login` |
| `mcp/division-mcp/src/tools/resend_invite.js:13` | same | same |
| `mcp/delivery-cycle-mcp/src/tools/helpers/notification-email.js:26` | `APP_BASE_URL` | `https://phil-dodds.github.io/TRIARQ-OITrustEarly` |
| `mcp/team-meetings-mcp/src/tools/send_meeting_reminders.js:39` | `APP_BASE_URL` | same |
| `mcp/division-mcp/src/tools/easter_eggs.js:210` | `APP_BASE_URL` | same |

`create_user` / `resend_invite` are the serious pair: every user provisioned
after cutover gets a password-set link into the retired app. That is a lockout
for exactly the people you cannot afford to lock out — new joiners.

**Set `APP_BASE_URL` and `APP_INVITE_REDIRECT_URL` on every Render service
before the first user is created.**

### 7. `system_config.maintenance_mode` travels with a data dump

`maintenance-mode.service.ts:52` reads it pre-auth, pre-router, from an
`APP_INITIALIZER`. A `true` value shows every user the maintenance screen with no
route to login.

A **fresh** database is safe — `095_system_config_rescued.sql:72` seeds `false`
under a `WHERE NOT EXISTS` guard. A **dump** carries whatever the value was when
it was taken. Check after migrating:

```sql
SELECT maintenance_mode, maintenance_message FROM system_config;
```

Two related notes: the read is fail-open, so a broken read means maintenance mode
is silently non-functional rather than blocking; and it depends on the
anon-readable policy from `031_enable_rls_all_tables.sql:338`
(`system_config_select USING (TRUE)`) existing in the new database.

### 8. `mcp/team-meetings-mcp/src/track_access.js:17` — hardcoded email gate

```js
const TRACK_CREATOR_EMAIL = 'pdodds@triarqhealth.com';
```

Unconditional constant, no env var. If production provisions Phil under a
different address, nobody can create a Team Meeting track. Not a lockout — a
permanently dead feature, and a quiet one.

---

## Freeze tooling — safe to copy, but know what it is

These four exist only to retire OITrustEarly. They are now **guarded** so that
copying them across is harmless, but they should still be excluded from the
delta as a matter of hygiene.

| Artifact | What it would do unguarded | Guard now in place |
|---|---|---|
| `db/migrations/101_port_freeze_schedule.sql` | Puts `service_role` into read-only and stops all three cron jobs — production silently rejects every write while looking healthy | Requires a `port_freeze_sentinel` row that is inserted by hand on Early only. Checked at registration **and** at fire time. On any other database it schedules nothing. |
| `.github/workflows/port-cutover.yml` | Deletes the `gh-pages` deployment and replaces it with a redirect to oi-trust.myqone.com — the site redirecting to itself, app gone. Its health check would *pass* in that world. | `if: github.repository == 'Phil-Dodds/TRIARQ-OITrustEarly'` |
| `.github/workflows/port-evict-tabs.yml` | Forces every production tab to reload, annually on 19 August | Same repository pin |
| `docs/port-redirect/index.html` | The redirect page itself | Not in `angular.json` assets globs, so `ng build` cannot ship it. Only the cutover workflow installs it. |

Note both cron expressions are **annual**, not one-shot: `'0 3 19 8 *'` means
19 August every year. The freeze job self-retires on success, but an armed job
that never fired stays armed.

---

## Checked and clean

- No feature flag, allowlist, denylist, or kill-switch table anywhere. `system_config` has only `id`, `maintenance_mode`, `maintenance_message`, `updated_at`, `updated_by`.
- No hardcoded UUIDs — no user ids or division ids in `angular/src` or `mcp/*/src`.
- No division gating from a literal id list; access is computed from role booleans on `users`.
- One route guard only (`core/guards/auth.guard.ts`) — nothing division-scoped to misfire.
- Migrations 078 and 100 register pg_cron jobs using `<PLACEHOLDER>` URLs, not old ones, so they cannot silently point production at the old infrastructure. They do need the real values substituted, and note the DST defect in 100 described in `Memo-Porting-OITrust-ScheduledJobs.md`.
- No hardcoded origins in `supabase/` edge functions.

---

## Pre-launch checklist

Code, before first deploy:
- [ ] `angular.json` production `baseHref` → `"/"`
- [ ] `environment.production.ts` — all seven values repointed
- [ ] Three CORS allowlists include the new origin
- [ ] `track_access.js` `TRACK_CREATOR_EMAIL` set correctly, or made configurable
- [ ] `056` seed block made conditional, or its user seeded first

Render env, on every service:
- [ ] `APP_BASE_URL`, `APP_INVITE_REDIRECT_URL`, `APP_PASSWORD_SET_URL`
- [ ] `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` for the new project
- [ ] `TEAM_MEETINGS_INTERNAL_CRON_KEY`, `DELIVERY_DIGEST_INTERNAL_CRON_KEY` (new values, not the old ones)
- [ ] Manual redeploy after every push — Render does not auto-deploy

Database, before opening to users:
- [ ] `system_config.maintenance_mode = false`
- [ ] Every `auth.users` row has a matching `public.users` row with `is_active = true`
- [ ] `system_config_select` RLS policy present
- [ ] Three cron jobs re-registered with the new URLs and keys
- [ ] `port_freeze_sentinel` is **empty**
