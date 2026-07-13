-- 059_team_meeting_views.sql
-- Pathways OI Trust — per-user meeting view tracking (session 2026-07-12)
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- Drives the "unread" bold on the My Team Meetings list: a series is bold when
-- the caller has never opened its latest meeting, or the meeting's content
-- changed after their last view (unread-email semantics).
-- get_team_meeting upserts viewed_at on every load — including the 10s polling
-- refetch, so a meeting you have open stays read while you watch it.

CREATE TABLE team_meeting_views (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id),
  meeting_id  uuid        NOT NULL REFERENCES team_meetings(id) ON DELETE CASCADE,
  viewed_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, meeting_id)
);

CREATE INDEX idx_tmv_user_meeting ON team_meeting_views(user_id, meeting_id);

-- Verification:
-- SELECT count(*) FROM team_meeting_views;  -- rows appear as meetings are opened
