-- 051_initiative_status_acknowledgments.sql
-- Pathways OI Trust — Contract 32 (Initiative Status Updates)
-- Governing decisions: D-476, D-483, D-353
-- Must run after: 050_initiative_status_updates.sql, 001_create_users.sql
--
-- Why this migration:
--   D-483 — when a trio member saves a status update, the other two trio
--   members acknowledge it (single button press, no comment). One row per
--   (status_update_id, acknowledged_by). Preserved in history; acknowledgment
--   requirement on prior updates is retired by query logic, not deletion.
--
-- Deviation from CLAUDE.md schema rule — recorded as CC-32-8:
--   acknowledged_at present; created_at/updated_at intentionally OMITTED.
--   Append-only acknowledgment record — acknowledged_at IS the creation
--   timestamp. Same append-only family as cycle_event_log (D-125).
--
-- ⚠ Do NOT execute via Code per Rule 22. Phil executes against Supabase.

BEGIN;

CREATE TABLE IF NOT EXISTS public.initiative_status_acknowledgments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  status_update_id  uuid        NOT NULL
                                REFERENCES public.initiative_status_updates(id)
                                ON DELETE CASCADE,
  acknowledged_by   uuid        NOT NULL REFERENCES public.users(id),
  acknowledged_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (status_update_id, acknowledged_by)
);

CREATE INDEX idx_status_acks_update
  ON public.initiative_status_acknowledgments (status_update_id);

COMMENT ON TABLE public.initiative_status_acknowledgments IS
  'Per-user acknowledgment of a status update (D-483). One row per '
  '(status_update_id, acknowledged_by). Save user never acknowledges own '
  'update (enforced in MCP). Append-only; acknowledged_at is the creation '
  'time. Source: D-483.';

-- ── RLS (D-353) — division-scoped read via update -> initiative ──────────
ALTER TABLE public.initiative_status_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "initiative_status_acknowledgments_select"
  ON public.initiative_status_acknowledgments FOR SELECT
  USING (
    status_update_id IN (
      SELECT u.id FROM public.initiative_status_updates u
      JOIN public.delivery_cycles c ON c.delivery_cycle_id = u.initiative_id
      WHERE c.division_id IN (SELECT public.user_division_ids())
        AND c.deleted_at IS NULL
    )
    OR public.user_is_admin()
  );
-- No INSERT/UPDATE/DELETE policy — service role bypasses RLS; MCP
--   (acknowledge_status_update) enforces the non-save-trio-member check and
--   writes acknowledged_by = caller. Append-only.

COMMIT;
