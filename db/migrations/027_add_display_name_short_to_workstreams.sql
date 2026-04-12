-- 027_add_display_name_short_to_workstreams.sql
-- Pathways OI Trust — Build C Contract 5
-- Adds nullable display_name_short column to delivery_workstreams.
-- Existing records will have NULL; fallback to workstream_name per D-203.
-- CC-Decision-2026-04-12-C: required per schema change convention (Rule 7).
-- Source: D-203 (Short Display Names), D-279 (Workstream display corrections).

ALTER TABLE public.delivery_workstreams
  ADD COLUMN IF NOT EXISTS display_name_short text;

COMMENT ON COLUMN public.delivery_workstreams.display_name_short IS
  'Short display name (max 20 chars) for chips, grids, and tight display surfaces. '
  'Falls back to workstream_name when null. Source: D-203.';
