-- 071_leader_placeholder_section_catalog.sql
-- Pathways OI Trust — session 2026-07-16
-- Replace hardcoded "Phil" in the shared section catalog with a {leader}
-- placeholder. The MCP layer resolves {leader} to the series' first leader's
-- first name when sections are snapshotted into a track (create_track /
-- add_track_section) and when the catalog is listed with track context
-- (list_section_catalog resolve_for_track_id).
--
-- Existing track section snapshots are NOT touched — leaders edit those
-- per-series via the existing pencil control.

UPDATE team_meeting_section_catalog SET
  title      = 'Escalation to {leader}, Inform {leader}, Blockers',
  sub_label  = 'Things That Need {leader}''s Attention, Awareness, or a Decision',
  updated_at = now()
WHERE section_key = 'escalation';

UPDATE team_meeting_section_catalog SET
  title      = '{leader} Communications / Reminders',
  sub_label  = 'Items {leader} Wants the Team to Know',
  updated_at = now()
WHERE section_key = 'comms';
