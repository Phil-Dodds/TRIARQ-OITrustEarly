-- 079_bullet_indent.sql
-- Pathways OI Trust — Contract 38 follow-on 22 (Meeting Collab sub-bullets)
--
-- Flat indent model (Phil 2026-07-21): a bullet is "under" the nearest
-- shallower bullet above it in the same section. Two levels only (0 = bullet,
-- 1 = sub-bullet). Ordering stays the existing single sort_order — no tree.
-- Carry-forward of a sub-bullet also carries its parent line (context);
-- deleting a parent promotes its sub-bullets (never cascades).
--
-- No new table → no RLS statement required.
-- ⚠ Do NOT execute via Code. Phil executes against Supabase.

BEGIN;

ALTER TABLE public.team_meeting_bullets
    ADD COLUMN IF NOT EXISTS indent_level int NOT NULL DEFAULT 0;

ALTER TABLE public.team_meeting_bullets
    DROP CONSTRAINT IF EXISTS team_meeting_bullets_indent_check;
ALTER TABLE public.team_meeting_bullets
    ADD CONSTRAINT team_meeting_bullets_indent_check
    CHECK (indent_level IN (0, 1));

COMMIT;
