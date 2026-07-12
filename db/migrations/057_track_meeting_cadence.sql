-- 057_track_meeting_cadence.sql
-- Pathways OI Trust — Meeting series cadence (session 2026-07-11 design)
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- One nullable jsonb column. NULL = no cadence (new meeting date defaults to today).
-- Shape: { "type": "interval" | "weekly" | "biweekly" | "triweekly" | "monthly",
--          "interval_days"?: int,          -- interval: 1 | 7 | 14
--          "day_of_week"?: int,            -- 0=Sunday … 6=Saturday (weekly/biweekly/triweekly/monthly)
--          "month_occurrence"?: text }     -- monthly: '1'|'2'|'3'|'4'|'last'
-- Suggested-next-date computation lives in team-meetings-mcp (Arch-2) —
-- suggestion only, never enforced (D-205 nudge philosophy).

ALTER TABLE team_meeting_tracks
  ADD COLUMN IF NOT EXISTS meeting_cadence jsonb;

-- Verification:
-- SELECT track_name, meeting_cadence FROM team_meeting_tracks;
