# Easter Egg Hunt — Feature Specification
Pathways OI Trust | Build C | v0.1 DRAFT | 2026-07-15 | CONFIDENTIAL
Author: Code session 2026-07-15. D-numbers pending Design allocation (D-317 — Code never allocates). Feature-local decisions tagged EE-NN below.

---

## 1. Purpose and Scope

A playful, system-wide egg hunt. Ten eggs are hidden in fixed spots just off the main user workflows. Every authenticated user can find each egg once, collect them in a personal basket, and — on collecting all ten — trigger a celebration and a congratulations email. No user type has an advantage: eggs live only in surfaces every user can reach (never admin-only screens, never role-gated zones).

In scope: egg definitions + placement, discovery/collection, two Home cards (personal basket + community feed), all-ten completion (celebration state + email), admin placement config, egg + celebration artwork.

Out of scope (future): resettable seasons (schema carries a dormant `season` column, EE-14); per-egg time windows; leaderboards beyond the recent-finds feed.

Governing constraints: Arch-1 (MCP-only), Arch-4 (env config for recipients), Arch-5 (JWT), Arch-6 (soft delete), Rule 4 (placement keys are named constants), Rule 38 (RLS in the CREATE TABLE migration).

---

## 2. Core Decisions (EE-NN)

- **EE-01 — No spoilers.** An egg's *name is its location* ("Main feature — sub feature"). A user sees an egg's name only after they personally find it. The community feed shows other users' finds as an anonymous egg ("Maya found an egg") with the location withheld; it reveals the name only on the viewer's own rows. Unfound slots on the personal card render as a mystery "?" with no name.
- **EE-02 — Egg name = feature only (Phil, 2026-07-15).** The name is just the feature/screen: "Home", "About", "Recently Approved Gates", "Contact an Admin". No whimsical names, and the name does NOT include the detailed location. The detailed location is stored separately (`location_detail`) for admin/reference only — never shown to other users (EE-01). A user sees an egg's name once they've found it (their basket + own feed rows).
- **EE-03 — Ten eggs, ten looks.** Exactly 10 active eggs, each a visually distinct design (see §7). Count is data-driven (admin can deactivate), but the shipped set is 10.
- **EE-04 — Subtle-visible until found, then gone for good (Phil, 2026-07-15).** Before it's found, an egg renders a small, faintly-styled glyph at its spot — findable by exploring, not invisible. On click: it's recorded as found, a brief celebration micro-interaction plays (egg cracks/bursts + a toast naming it and the running count), then the glyph is removed from that spot. It never reappears for that user — not later in the session, not in any future session, ever (persisted via `user_egg_finds`; on every load, already-found eggs render nothing at their spot). Other users still see and can find it until they too collect it.
- **EE-05 — Fairness.** Placement keys resolve only to surfaces reachable by every authenticated user. No egg on an admin route or behind a role/permission gate.
- **EE-06 — One find per user per egg.** `find_egg` is idempotent; re-click on an already-found egg is a friendly no-op.
- **EE-07 — Completion cc grows.** The celebration email's cc is the fixed base list (env) PLUS every user who has already completed all ten (the "finishers club"). Each new finisher is witnessed by all prior finishers.
- **EE-08 — One-time (this release).** No reset. Schema carries `season` (default 1) for a future opt-in reset (EE-14); no UI for it now.
- **EE-15 — Screen-keyed, live-only placement (Phil, 2026-07-15).** Each egg binds to a *screen/component*, not a specific record — it appears on every instance of that screen (any Initiative, any meeting series), found once per user. Eggs live only on screens whose nav devStatus is Live or Pilot and that every user can reach; never on Coming-Soon areas (unreachable) or admin/role-gated screens. Position = bottom of the screen or a deliberately non-default, "interesting" point (not the default first-glance view). If a screen's devStatus later regresses to Coming-Soon, that egg is reassigned.

---

## 3. Data Model

Single migration; both new tables ENABLE ROW LEVEL SECURITY with zero policies (Rule 38 / Arch-1 — MCP service role bypasses). Soft delete + created_at/updated_at throughout.

```sql
easter_eggs (
  id             uuid PK default gen_random_uuid(),
  egg_slug       text not null,                 -- stable code id, e.g. 'delivery_filter_panel'
  placement_key  text not null,                 -- module.screen.spot named constant (Rule 4)
  egg_name       text not null,                 -- feature only, e.g. "Home", "About" (EE-02)
  location_detail text not null,                -- admin/reference only, never sent to other users (EE-01)
  asset_ref      text not null,                 -- which of the 10 SVG designs, e.g. 'egg-01'
  sort_order     integer not null,              -- 1..10 display order
  season         integer not null default 1,    -- EE-14 dormant
  active_status  boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (season, placement_key) where deleted_at is null,  -- partial unique
  unique (season, egg_slug)      where deleted_at is null
)

user_egg_finds (
  id         uuid PK default gen_random_uuid(),
  user_id    uuid not null references public.users(id),
  egg_id     uuid not null references public.easter_eggs(id),
  found_at   timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, egg_id) where deleted_at is null    -- EE-06 idempotency
)

user_egg_achievements (
  id           uuid PK default gen_random_uuid(),
  user_id      uuid not null references public.users(id),
  season       integer not null default 1,
  achieved_at  timestamptz not null default now(),
  email_sent_at timestamptz,                    -- once-only email guard
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  unique (user_id, season) where deleted_at is null
)
```

RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` on all three, zero policies.

---

## 4. Placement Keys (Rule 4 — named constants)

Declared once, Angular + seed share the vocabulary. Format `module.screen.spot`. Never string-built. Every key below resolves to a Live/Pilot screen reachable by any user, egg keyed to the screen (any record), placed bottom / non-default (EE-15). Phil-selected screens marked ★.

| # | Egg name (shown once found) | Detailed location (admin/reference only) | Placement key · status |
|---|---|---|---|
| 1 | Home | Bottom of the Home page, below all cards | `home.landing.footer` · Pilot |
| 2 ★ | Acknowledge Status Updates | My Actions → Acknowledge tab, foot of the list | `myactions.ack.footer` · Pilot |
| 3 ★ | Recently Approved Gates | Initiative Tracking → gates-approved grid, below the last row | `initiatives.gates_approved.footer` · Live |
| 4 ★ | Initiative Guide | Initiative Tracking → How It Works guide, foot after Outcomes | `initiatives.guide.footer` · Live |
| 5 ★ | Event Log | Initiative detail panel (any Initiative), bottom of the Event Log | `delivery.detail.event_log_footer` · Live |
| 6 ★ | Team Meetings | Team Meetings → any series detail, bottom of the screen | `team_meetings.track.footer` · Pilot |
| 7 | Filters | Initiative Tracking → inside the Filters slide-in, below Apply/Clear | `initiatives.filter.footer` · Live |
| 8 | About | About panel, foot after the build-history list | `shell.about.footer` · any user |
| 9 | Update Statuses | My Actions → Update Initiative Statuses tab, foot of the list | `myactions.update.footer` · Pilot |
| 10 | Contact an Admin | Contact an Admin screen, bottom | `shell.contact_admin.footer` · Live |

`easter_eggs` gains `location_detail text` (the middle column) — admin/reference only, never returned to other users (EE-01/EE-02). Per-record screens (5 Initiative detail, 6 Team Meetings series) carry the egg on the component, so it appears on every record of that type; a user still finds it once (EE-06). Final DOM anchors verified at build; if an anchor turns out role-gated or its screen regresses to Coming-Soon, it's swapped and recorded (EE-15). Dropped since the last draft: the "account menu" (no such screen — that's the sidebar footer, not a screen), OI Library and Notifications (Coming-Soon / unreachable).

Egg → design mapping: egg #N uses `asset_ref = egg-0N` (§7).

---

## 5. Discovery Mechanism (Angular)

- Shared standalone directive `oiEggSpot` — `<span [oiEggSpot]="EGG_KEYS.DELIVERY_FILTER_FOOTER"></span>`. Keys imported from a single `easter-egg.constants.ts` (Rule 4).
- On init it asks `EasterEggService` whether this key is a live egg and whether the current user already found it; renders the subtle egg glyph accordingly (EE-04). Found → faint "collected" tick; unfound → clickable glyph.
- Click → `find_egg(placement_key)` (busy-guarded per the Busy-guard rule). Success → a small non-blocking celebration toast: "You found *Delivery — Filter panel*  ·  4 of 10". No page navigation.
- The directive never hard-codes egg metadata — it only knows its placement key; everything else comes from the service (Arch-2: presentation only).
- Placement adds one element per spot to existing components; no business logic enters those components.

---

## 6. MCP Tools

Host service: `division-mcp` (EE-09 — it already owns users + screen-state, the "profile/home" domain; avoids a sixth Render service). All JWT-validated (Arch-5); user identity from JWT, never a body param.

| Tool | Access | Behavior |
|---|---|---|
| `find_egg(placement_key)` | any authenticated | Resolve active egg for the current season by key. If none → `{success:false}` (unknown spot). Insert find if absent (idempotent, EE-06). Recompute total found. If found count == active egg count and no achievement row → create achievement + enqueue celebration email (§8). Returns `{ egg, newly_found, already_found, total_found, total_eggs, just_completed }`. |
| `get_my_egg_basket()` | any authenticated | The caller's finds joined to egg defs (name, asset_ref, found_at) + all active eggs (so unfound render as "?"), `total_found`, `total_eggs`, `completed`. Feeds the personal card. |
| `get_recent_egg_finds(limit=15)` | any authenticated | Recent finds across all users + completion achievements, newest first. Each row: finder display name, egg asset_ref, found_at, `is_own` (caller's own find?), and `egg_name` ONLY when `is_own` (EE-01 no-spoiler). Achievement rows: finder name + "collected all 10". |
| `list_easter_eggs()` | admin | All egg defs incl. inactive — admin config screen. |
| `upsert_easter_egg(...)` | admin | Create/edit an egg def (placement_key, egg_name, asset_ref, sort_order, active_status). |
| `set_easter_egg_active(egg_id, active)` | admin | Activate/deactivate without delete. |

All tools return the `{ success, data|error }` envelope; errors never throw to HTTP.

---

## 7. Artwork

Ten distinct egg SVGs (see the session mockup for the proposed set): 1 teal stripes · 2 coral dots · 3 purple chevrons · 4 blue waves · 5 amber lattice · 6 pink verticals · 7 green diamonds · 8 gray rings · 9 navy stars · 10 gilded scallops. Palette drawn from triarq / CDS ramps; flat fills, no gradients (renders crisp at 24–60px). Delivered as a keyed set (`egg-01`…`egg-10`) so `asset_ref` selects one.

Also produced:
- Basket art (empty → partially full → full) for the personal card header.
- "All ten" celebration graphic: Easter bunny + confetti banner, for the card completion state and the community achievement banner.
- Email header graphic: raster **PNG** (email clients don't render inline SVG), hosted on the gh-pages deploy so the email can `<img src>` it.

---

## 8. Completion — Celebration + Email

**Trigger:** `find_egg` detects the 10th distinct find → writes `user_egg_achievements` (idempotent on `unique(user_id, season)`).

**In-app:**
- Personal card flips to the celebration state (bunny + confetti, all ten eggs glowing, "You found them all!").
- Community feed posts the achievement banner: "[Name] collected all 10 eggs" — visible to everyone.

**Email (EE-07):**
- Sent once — guarded by `achievements.email_sent_at` (set after a successful send; a failed send leaves it null for retry).
- From: the existing OITrust system sender (reuse `notification-email` helper on the MCP side).
- To: the finder.
- Cc: base list from env `EASTER_EGG_CELEBRATION_CC` (Arch-4 — never hardcoded) = Mike Sappington, Sabrina Dobbins, Milind Ghyar, Phil Dodds, Vijay Patil, Shirish Bhavsar. PLUS the dynamic finishers club — every other user with a completion achievement this season (their emails resolved from `users`), deduped against the base list and the finder.
- Body: congratulations copy explaining the achievement (found all ten hidden eggs across the app) + the celebration PNG. Plain, warm, no exclamation-heavy shouting.

---

## 9. Home Cards

- **My Easter Eggs** — 10-slot grid. Found = painted egg + its name (the location reveal). Unfound = dashed "?" with no name (EE-01). Progress bar + "N of 10". All ten → celebration state.
- **Egg hunt — community** — recent finds feed. Others' finds: anonymous egg + "found an egg", location withheld. Own finds: egg + name + location shown. Achievement banner for any user who completed all ten.
- Both cards use the async hub-card loading exception (S-028) — they sit on the Home hub.

---

## 10. Fairness & Anti-abuse

- Every placement key resolves to a surface reachable by all authenticated users (EE-05); no admin/role gating.
- A determined user could read the bundle and call `find_egg` directly — accepted for a fun feature; JWT still required, and the "reward" is only bragging rights + an email. No further hardening.

---

## 11. Acceptance Criteria

| AC | Criterion |
|---|---|
| 1 | Migration creates all three tables with RLS enabled (zero policies) in one file. |
| 2 | Seed inserts 10 active eggs (season 1) with the §4 keys, names, and asset refs. |
| 3 | Each of the 10 spots renders a subtle egg glyph reachable by a non-admin user. |
| 4 | Clicking an egg records a find once; re-click is a friendly no-op; toast shows name + running count. |
| 5 | Personal card shows found eggs with names, unfound as "?", correct N/10, progress bar. |
| 6 | Community feed hides others' locations, reveals own; shows achievement banners. |
| 7 | Finding the 10th egg flips the personal card to the celebration state and posts the community achievement. |
| 8 | Completion sends exactly one email: to finder, cc base env list + all prior finishers, with the PNG graphic; re-finds send nothing. |
| 9 | Admin config screen lists eggs and can activate/deactivate and edit placement without delete. |
| 10 | No egg appears on an admin-only or role-gated surface. |

---

## 12. Open Items for Phil

- Confirm the 10 locations in §4 (swap any you dislike).
- Confirm the celebration email copy (draft on request).
- Admin config screen: needed for launch, or seed-only for v1 and add the screen later?

---

## 13. Final congratulations designs (locked 2026-07-15)

Shared motif, both surfaces: **TRIARQ Q emblem** top-left, a **confetti** strip, a **cartoon bunny hugging an egg beside a basket brimming with all ten coloured eggs**, then two lines of copy. Minimal words; the finder's display name is large.

**Q asset (build step):** extract a Q-only file to `angular/src/assets/icons/triarq/triarq-q.svg` (that folder exists, empty) from the emblem paths in `assets/images/TRIARQ_Logo_rgb.svg` — navy top-left arc (`#12274A`) + orange swoosh + dot (orange gradient `#E66028→#F3A51E`), viewBox framed to the mark (~`304 14 84 80`). Both surfaces reference this one file.

**Bunny + basket:** the `EggIconComponent` palette drives the basket's ten eggs; bunny + basket render as one inline SVG pair in `EggCelebrationComponent` (screen) and as the hosted PNG header (email).

**On-screen (celebration card, `EggCelebrationComponent`):**
- Line 1 (large, ~28px/500): `Congrats, {displayName}!`
- Line 2 (~16px, secondary): `You found all ten Easter eggs!`
- `{displayName}` = the finder's `users.display_name`, injected at render — never hardcoded.

**Email (`EggCelebrationEmail`, rendered to a hosted PNG header + minimal HTML):**
- Subject: `You found all ten Easter eggs in OI Trust`
- Line 1 (large): `Congrats, {displayName}!`
- Line 2: `You found all ten Easter eggs in OI Trust!`  ← "in OI Trust" is required for context (a bare "you found all ten eggs" reads as spam).
- Sign-off: `— The OI Trust team`
- Send: division-mcp invokes the `send-notification-email` Edge Function. **To** = finder; **Cc** = env base list (`EASTER_EGG_CELEBRATION_CC`) + finishers club, deduped. **Relay dependency (EE-16):** if the Edge Function does not honour a `cc` field, pass all recipients in `to` so delivery is guaranteed, and record the intended split in metadata — the proper To/Cc split is a one-line Edge Function change, flagged in the runbook. The congrats email is fire-and-forget (never blocks `find_egg`); `email_sent_at` guards a single send.

---
*Pathways OI Trust · Easter Egg Hunt · v0.2 · CONFIDENTIAL*
