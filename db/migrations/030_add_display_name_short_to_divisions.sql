-- 030_add_display_name_short_to_divisions.sql
-- Pathways OI Trust — Build C Contract 11 / Validator Close 2026-05-02
-- Adds nullable display_name_short column to divisions.
-- Existing records will have NULL; UI shows full division_name when null.
-- Source: ARCH-29 (display_name_short on divisions), D-203 (Short Display Names),
-- Contract 10 §6 B-48, Contract 11 §B-48 (allow-list regression).
--
-- CC-C11-003 (this contract): Migration 030 added because the column did not exist —
-- CC-C10-002 prior declaration was incomplete (allow-list updated without column).
--
-- Max length 10 chars enforced at MCP/UI layer per Contract 10 §6 B-48 spec.

ALTER TABLE public.divisions
  ADD COLUMN IF NOT EXISTS display_name_short text;

COMMENT ON COLUMN public.divisions.display_name_short IS
  'Short display name (max 10 chars enforced at MCP/UI layer) for grids, filter chips, and tight display surfaces. '
  'Falls back to division_name when null. Source: ARCH-29, D-203, Contract 10 §6 B-48.';
