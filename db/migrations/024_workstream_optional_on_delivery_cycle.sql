-- 024_workstream_optional_on_delivery_cycle.sql
-- Pathways OI Trust — Build C amendment
-- Decision D-165: Workstream is recommended but not required at cycle creation.
-- Workstream must be assigned before the Brief Review gate can be submitted.
-- Removes NOT NULL constraint on delivery_cycles.workstream_id.
-- Partial index on workstream_id is recreated to handle NULLs correctly.
-- Must run after: 017_create_delivery_cycles.sql

-- Drop the existing partial index (references workstream_id, needs to be recreated)
DROP INDEX IF EXISTS public.idx_delivery_cycles_workstream;

-- Make workstream_id nullable
ALTER TABLE public.delivery_cycles
    ALTER COLUMN workstream_id DROP NOT NULL;

-- Recreate the partial index — NULLs are now valid, exclude them from index
-- (non-null workstream assignments are the indexable case)
CREATE INDEX idx_delivery_cycles_workstream
    ON public.delivery_cycles (workstream_id)
    WHERE deleted_at IS NULL AND workstream_id IS NOT NULL;

-- Add a separate index for the "no workstream" filter case
CREATE INDEX idx_delivery_cycles_no_workstream
    ON public.delivery_cycles (delivery_cycle_id)
    WHERE deleted_at IS NULL AND workstream_id IS NULL;

COMMENT ON COLUMN public.delivery_cycles.workstream_id IS
    'Nullable. Optional at cycle creation — recommended but not required. '
    'Must be assigned before the Brief Review (brief_review) gate can be submitted. '
    'Gate enforcement blocks submission with D-140 message when null at gate time. '
    'Source: D-165, April 2026.';
