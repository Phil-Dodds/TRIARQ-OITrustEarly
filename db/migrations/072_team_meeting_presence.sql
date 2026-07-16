-- 072_team_meeting_presence.sql
-- Pathways OI Trust — session 2026-07-16
-- Live presence for the meeting prep/run screen. One row per (meeting, user),
-- upserted by the existing 10s meeting_changed_since poll. section_key records
-- which section the user last focused; NULL = on the meeting, no section focus.
--
-- Rows are never deleted — freshness is timestamp-based (last_seen_at within
-- the MCP freshness window counts as "here now"). No deleted_at column by
-- design: presence is ephemeral state, not a soft-deletable record.

CREATE TABLE team_meeting_presence (
  presence_id  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id   uuid        NOT NULL REFERENCES team_meetings(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES users(id),
  section_key  text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, user_id)
);

CREATE INDEX idx_tmp_meeting_seen ON team_meeting_presence(meeting_id, last_seen_at);

-- MCP-only table: deny-all RLS is correct — the service role bypasses RLS (Arch-1).
ALTER TABLE team_meeting_presence ENABLE ROW LEVEL SECURITY;
