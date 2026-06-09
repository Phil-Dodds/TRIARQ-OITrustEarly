-- 036_add_active_status_to_divisions.sql
-- Pathways OI Trust — Contract 21 (2026-06-09)
-- Governing decisions: D-413, D-414 (Division Management — Deactivation),
--                      S-032 (Entity Deactivation as Soft Block on New Work).
--
-- Adds active_status boolean to divisions. NOT NULL DEFAULT true so every
-- existing Division row is treated as Active on rollout — no existing
-- Initiative or membership is disrupted.
--
-- Soft-block semantics (S-032): new Initiatives cannot reference an inactive
-- Division and new user assignments are blocked; existing references continue
-- to function. Workstream inactivation (ARCH-23) is a hard block and remains
-- distinct.
--
-- Must run after: 002_create_divisions.sql.

BEGIN;

ALTER TABLE public.divisions
  ADD COLUMN IF NOT EXISTS active_status boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.divisions.active_status IS
  'Soft-block flag (S-032). When false, new Initiatives and new user assignments '
  'are blocked at the MCP layer. Existing Initiatives, memberships, and gate '
  'advancement continue to function. Governing: D-413, D-414, Contract 21.';

COMMIT;
