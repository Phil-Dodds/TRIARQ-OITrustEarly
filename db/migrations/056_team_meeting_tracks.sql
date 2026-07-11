-- 056_team_meeting_tracks.sql
-- Pathways OI Trust — Team Meeting Tracks (Phase A + B)
-- N meeting tracks/series, each with own member list, section config, meeting sequence.
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- Design decisions (session 2026-07-11):
--   - Track creation restricted to pdodds@triarqhealth.com (app-layer check)
--   - Creator defaults to leader; only leaders add/remove leaders
--   - purged_at instead of hard delete (Arch-6 conflict resolution 1b)
--   - ref_panel_person_type per track: dcs | dol | epo (default dcs)
--   - Sections snapshot into meetings at creation; series config = template
--   - content_updated_at on team_meetings drives 10s polling optimization

-- ── 1. team_meeting_tracks ────────────────────────────────────────────────────
CREATE TABLE team_meeting_tracks (
  track_id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  track_name             text        NOT NULL,
  is_public              boolean     NOT NULL DEFAULT false,
  ref_panel_person_type  text        NOT NULL DEFAULT 'dcs'
                                     CHECK (ref_panel_person_type IN ('dcs', 'dol', 'epo')),
  created_by             uuid        NOT NULL REFERENCES users(id),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  deleted_at             timestamptz,          -- soft delete: hidden from members, visible to admins
  purged_at              timestamptz           -- admin purge: invisible to everyone, data retained
);

CREATE INDEX idx_tmt_created_by ON team_meeting_tracks(created_by);
CREATE INDEX idx_tmt_is_public  ON team_meeting_tracks(is_public) WHERE deleted_at IS NULL AND purged_at IS NULL;

-- ── 2. team_meeting_track_members ─────────────────────────────────────────────
CREATE TABLE team_meeting_track_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id    uuid        NOT NULL REFERENCES team_meeting_tracks(track_id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES users(id),
  is_leader   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,          -- member removed / left; re-invite reactivates
  UNIQUE (track_id, user_id)
);

CREATE INDEX idx_tmtm_track_id ON team_meeting_track_members(track_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tmtm_user_id  ON team_meeting_track_members(user_id)  WHERE deleted_at IS NULL;

-- ── 3. team_meeting_section_catalog (shared section list, admin-curated) ──────
CREATE TABLE team_meeting_section_catalog (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text        NOT NULL UNIQUE,
  title       text        NOT NULL,
  sub_label   text        NOT NULL DEFAULT '',
  bar_color   text        NOT NULL DEFAULT '#5A5A5A',
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

-- Seed with the five existing sections.
INSERT INTO team_meeting_section_catalog (section_key, title, sub_label, bar_color, sort_order) VALUES
  ('hot-topics',        'Hot Topics / Agenda Topics',                'What the Team Wants to Raise Today',                          '#E96127', 1),
  ('escalation',        'Escalation to Phil, Inform Phil, Blockers', 'Things That Need Phil''s Attention, Awareness, or a Decision', '#F2A620', 2),
  ('comms',             'Phil Communications / Reminders',           'Items Phil Wants the Team to Know',                           '#0071AF', 3),
  ('initiatives-gates', 'Initiatives and Gates',                     'Initiative Status, Gate Dates, and Planning Discussion',      '#534AB7', 4),
  ('training',          'Trainings / Process / Getting Better',      'Process Improvements, Skill Gaps, Team Development',          '#5A5A5A', 5);

-- ── 4. team_meeting_track_sections (per-track section template, ordered) ──────
CREATE TABLE team_meeting_track_sections (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id    uuid        NOT NULL REFERENCES team_meeting_tracks(track_id) ON DELETE CASCADE,
  catalog_id  uuid        REFERENCES team_meeting_section_catalog(id),  -- NULL = custom section
  section_key text        NOT NULL,   -- catalog key, or 'custom-<uuid>' for customs
  title       text        NOT NULL,   -- snapshot/custom title (editable per track)
  sub_label   text        NOT NULL DEFAULT '',
  bar_color   text        NOT NULL DEFAULT '#5A5A5A',
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,            -- removed from series (past meetings keep their snapshot)
  UNIQUE (track_id, section_key)
);

CREATE INDEX idx_tmts_track_id ON team_meeting_track_sections(track_id) WHERE deleted_at IS NULL;

-- ── 5. team_meetings: track scoping + polling timestamp ───────────────────────
ALTER TABLE team_meetings
  ADD COLUMN IF NOT EXISTS track_id           uuid REFERENCES team_meeting_tracks(track_id),
  ADD COLUMN IF NOT EXISTS content_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at         timestamptz;

CREATE INDEX IF NOT EXISTS idx_team_meetings_track_id ON team_meetings(track_id) WHERE deleted_at IS NULL;

-- ── 6. team_meeting_sections: drop fixed-key CHECK, add snapshot columns ──────
ALTER TABLE team_meeting_sections DROP CONSTRAINT IF EXISTS team_meeting_sections_section_key_check;

ALTER TABLE team_meeting_sections
  ADD COLUMN IF NOT EXISTS title      text,
  ADD COLUMN IF NOT EXISTS sub_label  text,
  ADD COLUMN IF NOT EXISTS bar_color  text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;   -- leader deletes section from current meeting

-- Backfill snapshot columns on existing meeting sections from the catalog seed.
UPDATE team_meeting_sections s
SET title     = c.title,
    sub_label = c.sub_label,
    bar_color = c.bar_color
FROM team_meeting_section_catalog c
WHERE s.section_key = c.section_key
  AND s.title IS NULL;

-- ── 7. team_meeting_bullets: attribution for async/multi-user contributions ───
ALTER TABLE team_meeting_bullets
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id);

-- ── 8. Seed: "Product Ops" track — Phil as leader, existing meetings backfilled ─
DO $$
DECLARE
  v_phil_id  uuid;
  v_track_id uuid;
BEGIN
  SELECT id INTO v_phil_id FROM users WHERE email = 'pdodds@triarqhealth.com' AND deleted_at IS NULL;
  IF v_phil_id IS NULL THEN
    RAISE EXCEPTION 'pdodds@triarqhealth.com not found in users — cannot seed Product Ops track';
  END IF;

  INSERT INTO team_meeting_tracks (track_name, is_public, ref_panel_person_type, created_by)
  VALUES ('Product Ops', false, 'dcs', v_phil_id)
  RETURNING track_id INTO v_track_id;

  INSERT INTO team_meeting_track_members (track_id, user_id, is_leader)
  VALUES (v_track_id, v_phil_id, true);

  -- Track section template = the five seeded catalog sections.
  INSERT INTO team_meeting_track_sections (track_id, catalog_id, section_key, title, sub_label, bar_color, sort_order)
  SELECT v_track_id, c.id, c.section_key, c.title, c.sub_label, c.bar_color, c.sort_order
  FROM team_meeting_section_catalog c
  WHERE c.deleted_at IS NULL;

  -- All existing meetings belong to Product Ops.
  UPDATE team_meetings SET track_id = v_track_id WHERE track_id IS NULL;
END $$;

-- ── Verification ──────────────────────────────────────────────────────────────
-- SELECT track_name, is_public, ref_panel_person_type FROM team_meeting_tracks;
-- SELECT count(*) FROM team_meeting_track_members;        -- expect 1
-- SELECT count(*) FROM team_meeting_section_catalog;      -- expect 5
-- SELECT count(*) FROM team_meeting_track_sections;       -- expect 5
-- SELECT count(*) FROM team_meetings WHERE track_id IS NULL;  -- expect 0
