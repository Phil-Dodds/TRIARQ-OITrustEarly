-- 055_team_meetings.sql
-- Pathways OI Trust — Contract 33 / D-490
-- Team Meetings feature: four new tables.
-- Phil executes all migrations by hand — never auto-executed by Code.

-- ── 1. team_meetings ──────────────────────────────────────────────────────────
CREATE TABLE team_meetings (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  meeting_date date        NOT NULL,
  created_by   uuid        NOT NULL REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_meetings_created_by   ON team_meetings(created_by);
CREATE INDEX idx_team_meetings_meeting_date ON team_meetings(meeting_date DESC);

-- ── 2. team_meeting_sections ──────────────────────────────────────────────────
CREATE TABLE team_meeting_sections (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid    NOT NULL REFERENCES team_meetings(id) ON DELETE CASCADE,
  section_key text    NOT NULL CHECK (section_key IN (
    'hot-topics', 'escalation', 'comms', 'initiatives-gates', 'training'
  )),
  sort_order  int     NOT NULL,
  collapsed   boolean NOT NULL DEFAULT false,
  UNIQUE (meeting_id, section_key)
);

-- ── 3. team_meeting_bullets ───────────────────────────────────────────────────
CREATE TABLE team_meeting_bullets (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id            uuid        NOT NULL REFERENCES team_meeting_sections(id) ON DELETE CASCADE,
  text                  text        NOT NULL,
  initiative_id         uuid        REFERENCES delivery_cycles(delivery_cycle_id) ON DELETE SET NULL,
  sort_order            int         NOT NULL DEFAULT 0,
  carried_from_bullet_id uuid       REFERENCES team_meeting_bullets(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tmb_section_id    ON team_meeting_bullets(section_id);
CREATE INDEX idx_tmb_initiative_id ON team_meeting_bullets(initiative_id);

-- ── 4. team_meeting_notes ─────────────────────────────────────────────────────
CREATE TABLE team_meeting_notes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  uuid        NOT NULL REFERENCES team_meeting_sections(id) ON DELETE CASCADE,
  notes_text  text        NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid        NOT NULL REFERENCES users(id),
  UNIQUE (section_id)
);
