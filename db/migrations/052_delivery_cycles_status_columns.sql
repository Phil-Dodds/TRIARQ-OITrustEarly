-- 052_delivery_cycles_status_columns.sql
-- Pathways OI Trust — Contract 32 (Initiative Status Updates)
-- Governing decisions: D-476, D-482
-- Must run after: 050_initiative_status_updates.sql (FK target)
--
-- Why this migration:
--   D-476 — add status-tracking columns to delivery_cycles (the Initiative
--   table). latest_status_update_id points at the most recent immutable
--   status row; status_due_at / status_overdue / status_last_calculated_at
--   are maintained by the scheduled function (D-482, migration 054).
--
-- Naming note (CC-32, spec inconsistency): D-476 decision text says
--   "Additions to `initiatives`" but spec §1.5 and the schema use
--   delivery_cycles. The Initiative IS the delivery_cycles row
--   (delivery_cycle_id PK). Columns added to delivery_cycles.
--
-- ⚠ Do NOT execute via Code per Rule 22. Phil executes against Supabase.

BEGIN;

ALTER TABLE public.delivery_cycles
  ADD COLUMN IF NOT EXISTS latest_status_update_id    uuid        NULL
                                                      REFERENCES public.initiative_status_updates(id),
  ADD COLUMN IF NOT EXISTS status_due_at              timestamptz NULL,
  ADD COLUMN IF NOT EXISTS status_overdue             boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status_last_calculated_at  timestamptz NULL;

COMMENT ON COLUMN public.delivery_cycles.latest_status_update_id IS
  'FK to the most recent initiative_status_updates row (D-476). Updated by '
  'save_initiative_status_update. NULL until first status save.';
COMMENT ON COLUMN public.delivery_cycles.status_due_at IS
  'next_meeting_date − 1 day, computed by refresh_initiative_status_overdue() '
  '(D-482). NULL when no cadence config resolves in the Division chain.';
COMMENT ON COLUMN public.delivery_cycles.status_overdue IS
  'True when no status update was saved within the cadence valid window '
  '(D-482). Reset to false on save. Initiatives with no resolvable cadence '
  'config are never flagged (D-481).';
COMMENT ON COLUMN public.delivery_cycles.status_last_calculated_at IS
  'Timestamp of last per-initiative overdue evaluation by the scheduled '
  'function (D-482). NULL until first run that resolves a cadence config.';

COMMIT;

-- ── Verification (read-only, safe post-apply) ────────────────────────────
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'delivery_cycles'
--   AND column_name LIKE 'status%' OR column_name = 'latest_status_update_id';
