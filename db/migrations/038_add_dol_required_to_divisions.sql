-- 038_add_dol_required_to_divisions.sql
-- Pathways OI Trust — Build C Contract 23 / D-424
-- Adds `dol_required` boolean to divisions. First Division-level governance setting.
--
-- Default true: every existing Division retains current DOL gate-enforcement behavior
-- (Brief Review gate blocks on null DOL). No backfill needed.
-- When false: Brief Review pre-check skips the DOL null block on Initiatives in that
-- Division. DCS/Workstream pre-checks (D-312) remain enforced regardless.
--
-- Source: D-424, Section H Contract 23 Item 3.1.

ALTER TABLE public.divisions
  ADD COLUMN IF NOT EXISTS dol_required boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.divisions.dol_required IS
  'When true (default), Brief Review gate submission requires a non-null DOL on each '
  'Initiative in this Division. When false, the DOL null check is skipped for this Division '
  'only — DCS and Workstream pre-checks remain enforced. Source: D-424, Contract 23 Item 3.';
