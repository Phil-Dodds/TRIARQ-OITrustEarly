<!-- SECTION-H: passthrough to for-ClaudeCode.zip — do not edit -->

# Team Meetings Feature Spec
**Decision:** D-490  
**Date:** 2026-06-30  
**Status:** Specced — ready for Code  
**Prior specs covering this surface:** None. This is a new feature with no prior Section H coverage.

---

## Before You Write Any Code

Read these decisions in full from decisions-active.md before implementing anything in this spec. Each one governs a specific component you will reuse:

| Decision | Governs |
|----------|---------|
| D-415 / S-034 | Compact person row layout — avatar 32px, name + role pill on same line. Required for DCS rows in the reference panel. |
| D-419 | Status dot rule — gate status color logic. Required for initiative rows in the reference panel. |
| D-478 | Read-only Status Update panel with "View Initiative" link. Required for initiative chip tap behavior. |
| S-005 | Right-panel pattern (not modal, not inline). Required for New Meeting creation panel. |
| S-010 / S-011 / S-012 | Filter panel, filter state, active filter chips. Required if filtering is added to meeting list in future — read now so you don't build against it. |
| D-171 | Filter state persistence. Required for meeting list sort memory. |
| D-389 | DCS role — `system_role = 'dcs'`, `assigned_dcs_user_id` on `delivery_cycles`. Required for reference panel query. |
| D-308 | List → View navigation (tapping a row opens right panel). Required for meeting list row behavior. |

Do not approximate these patterns from memory. Read the decisions, then implement.

---

## Build Sequence

Follow this order exactly. Do not skip ahead. Each step depends on the previous.

1. Schema
2. MCP tools (server-side)
3. Meeting list screen
4. Meeting prep/run screen — sections and bullets only
5. DCS Initiative Reference Panel
6. Carry-forward behavior
7. Prior meeting read-only view
8. Nav registration

---

## Step 1 — Schema

Run these migrations in order. Phil executes all SQL by hand — produce the migration SQL as a file, do not execute directly against Supabase.

### 1.1 `team_meetings`

```sql
CREATE TABLE team_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  meeting_date date NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_meetings_created_by ON team_meetings(created_by);
CREATE INDEX idx_team_meetings_meeting_date ON team_meetings(meeting_date DESC);
```

### 1.2 `team_meeting_sections`

```sql
CREATE TABLE team_meeting_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES team_meetings(id) ON DELETE CASCADE,
  section_key text NOT NULL CHECK (section_key IN (
    'hot-topics', 'escalation', 'comms', 'initiatives-gates', 'training'
  )),
  sort_order int NOT NULL,
  collapsed boolean NOT NULL DEFAULT false,
  UNIQUE (meeting_id, section_key)
);
```

### 1.3 `team_meeting_bullets`

```sql
CREATE TABLE team_meeting_bullets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES team_meeting_sections(id) ON DELETE CASCADE,
  text text NOT NULL,
  initiative_id uuid REFERENCES delivery_cycles(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  carried_from_bullet_id uuid REFERENCES team_meeting_bullets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tmb_section_id ON team_meeting_bullets(section_id);
CREATE INDEX idx_tmb_initiative_id ON team_meeting_bullets(initiative_id);
```

### 1.4 `team_meeting_notes`

```sql
CREATE TABLE team_meeting_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES team_meeting_sections(id) ON DELETE CASCADE,
  notes_text text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES users(id),
  UNIQUE (section_id)
);
```

---

## Step 2 — MCP Tools

All tools require Admin JWT. Phil is Admin — no bespoke user_id check. Never hardcode a user ID.

Implement these tools in this order (list tool last — it depends on the shape established by get):

### `create_team_meeting(title, meeting_date)`

1. Insert into `team_meetings` with `created_by` = caller user_id.
2. Insert five rows into `team_meeting_sections` in fixed order:

| sort_order | section_key |
|-----------|-------------|
| 1 | hot-topics |
| 2 | escalation |
| 3 | comms |
| 4 | initiatives-gates |
| 5 | training |

3. Return full meeting object including sections (no bullets yet).

### `get_team_meeting(meeting_id)`

Returns:
```
{
  id, title, meeting_date, created_at, updated_at,
  sections: [
    {
      id, section_key, sort_order, collapsed,
      bullets: [
        {
          id, text, sort_order, carried_from_bullet_id,
          initiative: { id, name, stage, gate_status } | null
        }
      ],
      notes: { notes_text, updated_at, updated_by_display_name } | null
    }
  ]
}
```

Bullets ordered by `sort_order ASC`. Sections ordered by `sort_order ASC`. Initiative join: LEFT JOIN `delivery_cycles` on `initiative_id` — return `id`, `name` (display name field per existing pattern), `stage`, and current gate status (per D-419 rule — query existing gate status logic, do not re-implement).

### `list_team_meetings(limit?, offset?)`

Returns array of `{ id, title, meeting_date, created_at, updated_at }` sorted by `meeting_date DESC`. Default limit 20.

### `add_meeting_bullet(section_id, text, initiative_id?, carried_from_bullet_id?)`

**CRITICAL — both entry paths must populate `initiative_id`:**
- When called from the `@` initiative picker: `initiative_id` must be set. Text = initiative display name.
- When called from the reference panel "+ Add": `initiative_id` must be set. Text = initiative display name.
- When called from free-text input: `initiative_id` is null. Text = whatever Phil typed.

**Carry-forward is never a text copy.** When `carried_from_bullet_id` is provided:
- Set `carried_from_bullet_id` on the new bullet record — this FK is the lineage record.
- Do not just copy the text and leave `carried_from_bullet_id` null — that breaks the carry-forward relationship entirely.

Insert with `sort_order` = (MAX existing sort_order in section) + 1. Return new bullet object.

### `remove_meeting_bullet(bullet_id)`

Hard delete. If other bullets have `carried_from_bullet_id` pointing to this bullet, set those to null (ON DELETE SET NULL handles this at DB level — confirm migration includes it).

### `update_meeting_notes(section_id, notes_text)`

Upsert into `team_meeting_notes` (ON CONFLICT section_id DO UPDATE). Set `updated_at = now()`, `updated_by = caller user_id`. Return updated notes object.

### `carry_forward_bullet(source_bullet_id, target_meeting_id)`

1. Load source bullet — get its `text`, `initiative_id`, `section_id`.
2. Resolve source section's `section_key`.
3. Find the matching section (same `section_key`) in `target_meeting_id`.
4. If no matching section found: return error "Target meeting does not have a matching section."
5. Call `add_meeting_bullet` logic with `text`, `initiative_id` (preserved), `carried_from_bullet_id = source_bullet_id`.
6. Return new bullet object and target meeting id.

### `list_dcs_users_with_initiatives()`

Returns:
```
[
  {
    id, display_name, avatar_url,
    initiatives: [
      {
        id, name, stage,
        gate_status,           // per D-419 rule — reuse existing gate status logic
        last_status_update_date
      }
    ]
  }
]
```

Query: users where `system_role = 'dcs'`, ordered by `display_name ASC`. For each DCS, delivery_cycles where `assigned_dcs_user_id = dcs.id` AND `stage != 'closed'`, scoped to divisions the caller has access to (reuse existing division access scoping pattern — do not write new access logic). Order initiatives by `name ASC` within each DCS.

---

## Step 3 — Meeting List Screen

Route: `/team-meetings`  
Nav: left-nav item "Team Meetings", placed below "Initiative Tracking" grouping. Visible only when `system_role = 'admin'`. Use existing nav registration pattern — do not invent a new one.

Grid columns: Title (tappable per D-308 → opens meeting prep/run screen), Meeting Date, Last Updated.  
Sort: `meeting_date DESC`. No filter panel phase 1.  
"+ New Meeting" button top right — opens New Meeting creation panel (right-panel per S-005).

**New Meeting panel fields:**
- Title: text input, pre-filled with `"Product Ops Prep — Week of [Monday of current week, formatted: 'Mon DD, YYYY']"`, editable.
- Meeting Date: date picker, default today.
- Save / Cancel actions.

On save: call `create_team_meeting`, navigate to meeting prep/run screen for the new meeting.

---

## Step 4 — Meeting Prep/Run Screen — Sections and Bullets

Route: `/team-meetings/:meeting_id`

**Layout:** Two-column on desktop (≥ 1024px): left column 65% width (sections), right column 35% width (DCS reference panel). Single column on mobile — reference panel collapses to a toggle button at top.

**Each section renders:**
- Section header: colored left bar (color per section — see below), section title, sub-label, collapse chevron (D-308 pattern). Tapping header toggles collapse state; persist `collapsed` state via `update_meeting_section_collapsed` (add this lightweight MCP call — single field update on `team_meeting_sections.collapsed`).
- Bullet list: each bullet shows colored dot, text (initiative bullets render as a tappable chip — underlined name; tapping opens initiative detail right-panel per D-478 read-only mode), remove (×) button.
- Add-bullet input: text field with "Add" button. Enter key submits. `@` character in input triggers initiative search picker (inline dropdown, searches `delivery_cycles.name` across active initiatives scoped to caller's division access, shows name + stage, tap to select — populates initiative_id, sets text to initiative name). On add: call `add_meeting_bullet`.
- Notes textarea: label "NOTES / COMMENTS", placeholder "Capture discussion, decisions, or follow-ups here…". Auto-save on blur — call `update_meeting_notes`.

**Section colors:**

| section_key | Bar color |
|-------------|-----------|
| hot-topics | #E96127 (Oravive) |
| escalation | #F2A620 (Sunray) |
| comms | #0071AF (Vital Blue) |
| initiatives-gates | #534AB7 (purple — consistent with D-490 spec) |
| training | #5A5A5A (Stone) |

**Section display titles and sub-labels:**

| section_key | Title | Sub-label |
|-------------|-------|-----------|
| hot-topics | Hot topics / agenda topics | What the team wants to raise today |
| escalation | Escalation to Phil, inform Phil, blockers and gates planning | Things that need Phil's attention, awareness, or a decision |
| comms | Phil communications / reminders | Items Phil wants the team to know |
| initiatives-gates | Initiatives and gates | Initiative status, gate dates, and planning discussion |
| training | Trainings / process / getting better | Process improvements, skill gaps, team development |

---

## Step 5 — DCS Initiative Reference Panel

Right column of the meeting prep/run screen. Load data from `list_dcs_users_with_initiatives()` on screen mount. Show loading state (skeleton rows) while fetching.

**Panel header:** "Initiative Reference" label, collapse toggle (icon button top right of panel). When collapsed: panel shrinks to a narrow tab or toggle button — left column expands to full width.

**DCS rows:** Per D-415/S-034 — avatar 32px, display name and role pill ("DCS") on same horizontal line, expand chevron right-aligned. Tap row to expand/collapse initiatives list for that DCS.

**Initiative rows (inside expanded DCS):**
- Initiative name (text, not tappable in this panel — tap is reserved for "+ Add")
- Stage badge (existing StageComponent — reuse, do not re-implement)
- Gate status dot (per D-419 rule — reuse existing GateStatusDotComponent)
- Last status update date (stone color, small)
- "+ Add" button right-aligned — on tap: call `add_meeting_bullet(initiatives_gates_section_id, initiative.name, initiative.id)`. Auto-expand `initiatives-gates` section if collapsed. Show brief confirmation (button text changes to "Added ✓" for 1.5s, then reverts).

**Empty state per DCS:** "No active initiatives" if a DCS has no active delivery_cycles in scope.

**Panel empty state:** "No DCS users found." — should not occur in production but handle gracefully.

---

## Step 6 — Carry-Forward Behavior

Prior meeting view (Step 7) shows a "→ This week" tap target on each bullet. This step implements the action.

On "→ This week" tap:
1. Call `list_team_meetings(limit: 5)` to find the most recent meeting that is not the one being viewed.
2. If exactly one candidate (most common case): confirm with Phil via a small inline confirmation: "Carry to [meeting title]?" with Confirm / Cancel. On confirm: call `carry_forward_bullet(source_bullet_id, target_meeting_id)`.
3. If no candidate found: prompt Phil to create a new meeting first. Show "No current meeting found — create one?" with a "+ New Meeting" link.
4. On success: show inline confirmation on the source bullet "Carried to [meeting title]". The carried indicator persists on the source bullet for the session.

**CRITICAL:** `carry_forward_bullet` must set `carried_from_bullet_id` on the new bullet. Verify the returned bullet object contains `carried_from_bullet_id` before showing confirmation. If it is null, something went wrong — surface an error, do not silently succeed.

---

## Step 7 — Prior Meeting Read-Only View

Same route `/team-meetings/:meeting_id`. Read-only mode is determined by: meeting is not the most recent meeting (or Phil explicitly opened it from the meeting list — treat any non-current meeting as read-only for phase 1; current = most recent by `meeting_date`).

Read-only mode differences from prep/run:
- No add-bullet inputs.
- No remove (×) buttons on bullets.
- No notes textarea — notes render as plain text.
- Initiative chips still tappable (open initiative detail per D-478).
- Each bullet gains a "→ This week" tap target (right-aligned, stone color, small). Behavior per Step 6.
- Banner at top of screen: "[Meeting title] — [date] · Read only" with a "→ Prep this week's meeting" link that navigates to the most recent meeting (or New Meeting if none exists).
- DCS reference panel hidden in read-only mode — no initiative reference needed when reviewing history.

---

## Step 8 — Nav Registration

Add "Team Meetings" to the left nav component:
- Position: below "Initiative Tracking" group, above "To Do" (or wherever "To Do" currently sits — check existing nav order, do not guess).
- Visibility guard: `currentUser.system_role === 'admin'` — same guard pattern used elsewhere in nav for admin-only items.
- Route: `/team-meetings`.
- Icon: calendar or clipboard — use whichever is already in the icon set and not in use by an adjacent nav item. Do not import a new icon library.
- Badge: none phase 1.

---

## What Not To Do

- Do not hardcode Phil's user_id anywhere. Access is gated by `system_role = 'admin'`.
- Do not re-implement gate status color logic. Reuse the existing component/utility per D-419.
- Do not re-implement division access scoping. Reuse the existing pattern from `list_delivery_cycles` or equivalent.
- Do not implement carry-forward as a text copy. `carried_from_bullet_id` FK must be set — see Step 6 critical note.
- Do not omit `initiative_id` when adding bullets from the reference panel or `@` picker — both paths must populate the FK.
- Do not open the initiative detail in a modal. Use the existing right-panel per D-478/S-005.
- Do not add a filter panel to the meeting list — not in scope phase 1.
- Do not auto-create a meeting on nav open. Phil creates explicitly.

---

## CC-Decision Scope

Low-stakes implementation choices (icon selection, exact collapse animation, loading skeleton row count, auto-save debounce interval on notes textarea) are within CC-decision scope per D-373/Rule 30. Record each as a CC-decision for Design review. Do not allocate D-numbers — those are Design session only per D-317.

High-stakes choices requiring Design review before proceeding: any schema change beyond what is specified here, any deviation from the read-only mode rule, any change to the `carried_from_bullet_id` FK behavior.

---

*Team Meetings Spec · D-490 · 2026-06-30 · Pathways OI Trust · Build C*
