-- 024_delivery_cycle_schema_updates.sql
-- Pathways OI Trust — Post-Build C schema corrections and additions.
--
-- Changes:
--   1. workstream_id: make nullable — D-165 says workstream is optional at creation,
--      required only before Brief Review gate. Migration 017 incorrectly had NOT NULL.
--   2. assigned_ds_user_id: add — delivery-cycle-dashboard-spec.md Section 1.2
--   3. assigned_cb_user_id: add — delivery-cycle-dashboard-spec.md Section 1.2
--   4. pre_hold_lifecycle_stage: add — stores the stage before ON_HOLD so
--      resume_cycle_from_hold can return the cycle to the correct stage (D-180 TBD).
--
-- Must run after: 017_create_delivery_cycles.sql

-- 1. Make workstream_id nullable (D-165 fix)
ALTER TABLE public.delivery_cycles
    ALTER COLUMN workstream_id DROP NOT NULL;

-- 2. Assigned Delivery Specialist
ALTER TABLE public.delivery_cycles
    ADD COLUMN IF NOT EXISTS assigned_ds_user_id uuid
        REFERENCES public.users(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.delivery_cycles.assigned_ds_user_id IS
    'The Delivery Specialist assigned to this cycle. '
    'Visible in dashboard list and detail panel. Tappable to User Detail Panel. '
    'Source: delivery-cycle-dashboard-spec.md Section 1.2';

-- 3. Assigned CB (Capability Builder / Coach)
ALTER TABLE public.delivery_cycles
    ADD COLUMN IF NOT EXISTS assigned_cb_user_id uuid
        REFERENCES public.users(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.delivery_cycles.assigned_cb_user_id IS
    'The Capability Builder assigned to this cycle. '
    'Visible in dashboard list and detail panel. Tappable to User Detail Panel. '
    'Source: delivery-cycle-dashboard-spec.md Section 1.2';

-- 4. Pre-hold stage — stores stage before ON_HOLD for reactivation
ALTER TABLE public.delivery_cycles
    ADD COLUMN IF NOT EXISTS pre_hold_lifecycle_stage text
        CHECK (pre_hold_lifecycle_stage IN (
            'BRIEF', 'DESIGN', 'SPEC', 'BUILD',
            'VALIDATE', 'UAT', 'PILOT', 'RELEASE',
            'OUTCOME', 'COMPLETE'
        ));

COMMENT ON COLUMN public.delivery_cycles.pre_hold_lifecycle_stage IS
    'Populated by set_cycle_on_hold. Stores the lifecycle stage the cycle was in '
    'immediately before being placed ON_HOLD. Cleared by resume_cycle_from_hold '
    'when the cycle is returned to active progression. '
    'Null when cycle is not ON_HOLD.';

-- Indexes for the new FK columns
CREATE INDEX IF NOT EXISTS idx_delivery_cycles_assigned_ds
    ON public.delivery_cycles (assigned_ds_user_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_delivery_cycles_assigned_cb
    ON public.delivery_cycles (assigned_cb_user_id)
    WHERE deleted_at IS NULL;
