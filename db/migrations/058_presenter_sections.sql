-- 058_presenter_sections.sql
-- Pathways OI Trust — per-participant presenter sections (session 2026-07-12)
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- A presenter section belongs to one participant (action items, escalations,
-- blockers, accomplishments). presenter_user_id on the track template routes
-- initiative adds by person; on meeting sections it lets "pull from last
-- meeting" match presenter sections across meetings even after renames.
-- Section keys for presenter sections are stable: 'presenter-<user_id>'.

ALTER TABLE team_meeting_track_sections
  ADD COLUMN IF NOT EXISTS presenter_user_id uuid REFERENCES users(id);

ALTER TABLE team_meeting_sections
  ADD COLUMN IF NOT EXISTS presenter_user_id uuid REFERENCES users(id);

-- Verification:
-- SELECT title, presenter_user_id FROM team_meeting_track_sections WHERE presenter_user_id IS NOT NULL;
