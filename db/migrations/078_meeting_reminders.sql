-- 078_meeting_reminders.sql
-- Pathways OI Trust — Contract 38 follow-on 19 (Team Meetings email reminders)
--
-- Presenter prep reminders (Phil 2026-07-18):
--   * Track-level settings: normal meeting time (ET), reminder lead, note.
--   * Reminders are emailed to the track's configured presenters
--     (team_meeting_track_sections.presenter_user_id) within the lead window.
--   * Skip: presenter already opened today's meeting instance (presence row).
--   * One-and-done per (track, meeting_date, user) via the reminder log.
--   * Sender: a second pg_cron entry on the existing 30-minute heartbeat,
--     calling the team-meetings-mcp internal endpoint via pg_net.
--
-- ⚠ Do NOT execute via Code. Phil executes against Supabase.
-- ⚠ BEFORE RUNNING: replace the two placeholders in Step 3:
--      <TEAM_MEETINGS_MCP_URL>     e.g. https://team-meetings-mcp-xxxx.onrender.com
--      <TEAM_MEETINGS_INTERNAL_CRON_KEY>  generated secret, also set in Render env
--    The key is substituted at execution time so it is never committed (Arch-4).

BEGIN;

-- Step 1: track-level reminder settings.
ALTER TABLE public.team_meeting_tracks
    ADD COLUMN IF NOT EXISTS meeting_time          time,
    ADD COLUMN IF NOT EXISTS reminder_lead_minutes integer,
    ADD COLUMN IF NOT EXISTS reminder_note         text NOT NULL DEFAULT 'Please review and prep.';

ALTER TABLE public.team_meeting_tracks
    DROP CONSTRAINT IF EXISTS team_meeting_tracks_reminder_lead_check;
ALTER TABLE public.team_meeting_tracks
    ADD CONSTRAINT team_meeting_tracks_reminder_lead_check
    CHECK (reminder_lead_minutes IS NULL OR reminder_lead_minutes BETWEEN 30 AND 10080);

COMMENT ON COLUMN public.team_meeting_tracks.meeting_time IS
    'Normal scheduled meeting time, Eastern Time wall clock. Maintained by track leaders.';
COMMENT ON COLUMN public.team_meeting_tracks.reminder_lead_minutes IS
    'Minutes before meeting_time to email presenter reminders. NULL = reminders off.';

-- Step 2: one-and-done send log. Keyed on meeting_date (not meeting_id)
-- because the reminder fires even when the meeting instance has not been
-- created yet. MCP-only table → deny-all RLS (Rule 38; service role bypasses).
CREATE TABLE IF NOT EXISTS public.team_meeting_reminder_log (
    reminder_id    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id       uuid        NOT NULL REFERENCES public.team_meeting_tracks(track_id) ON DELETE CASCADE,
    meeting_id     uuid        REFERENCES public.team_meetings(id) ON DELETE SET NULL,
    meeting_date   date        NOT NULL,
    user_id        uuid        NOT NULL REFERENCES public.users(id),
    delivery_error text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    UNIQUE (track_id, meeting_date, user_id)
);

ALTER TABLE public.team_meeting_reminder_log ENABLE ROW LEVEL SECURITY;

-- Step 3: schedule the sender on the same 30-minute heartbeat as the
-- initiative status refresh. pg_net POSTs to the MCP internal endpoint;
-- the endpoint authorizes via the x-internal-key header.
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'send-meeting-reminders',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url     := '<TEAM_MEETINGS_MCP_URL>/internal/send_meeting_reminders',
    headers := jsonb_build_object('x-internal-key', '<TEAM_MEETINGS_INTERNAL_CRON_KEY>',
                                  'Content-Type',  'application/json'),
    body    := '{}'::jsonb
  );
  $$
);

COMMIT;

-- Rollback of the cron entry if ever needed:
--   SELECT cron.unschedule('send-meeting-reminders');
