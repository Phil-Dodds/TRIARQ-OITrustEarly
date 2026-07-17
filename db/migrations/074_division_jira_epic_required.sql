-- 074_division_jira_epic_required.sql
-- Pathways OI Trust — Contract 38 follow-on 13 (gate checklist rework)
--
-- Per-Division exception to the Go to Build Jira-epic hard stop (Phil
-- 2026-07-17): Jira epic is required at Go to Build submission EXCEPT for
-- Divisions configured with jira_epic_required = false. Mirrors the
-- dol_required pattern (D-424, migration 037).
--
-- No new table → no RLS statement required (Rule 38 applies to CREATE TABLE).
-- ⚠ Do NOT execute via Code. Phil executes against Supabase.

BEGIN;

ALTER TABLE public.divisions
    ADD COLUMN IF NOT EXISTS jira_epic_required boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.divisions.jira_epic_required IS
    'When false, the Go to Build gate does not require a linked Jira epic for '
    'Initiatives in this Division. Default true. Contract 38 follow-on 13.';

COMMIT;
