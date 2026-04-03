-- 015_create_delivery_workstreams.sql
-- Pathways OI Trust — Build C
-- Registry of named Delivery Workstreams. Each Workstream belongs to a Division
-- and has a designated lead. active_status drives gate enforcement — an inactive
-- Workstream blocks all gate clearance on any cycle assigned to it (ARCH-23, D-140).
-- Must run after: 001_create_users.sql, 002_create_divisions.sql

CREATE TABLE IF NOT EXISTS public.delivery_workstreams (
    workstream_id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    workstream_name          text        NOT NULL,
    home_division_id         uuid        NOT NULL REFERENCES public.divisions(id) ON DELETE RESTRICT,
    workstream_lead_user_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    active_status            boolean     NOT NULL DEFAULT true,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    deleted_at               timestamptz
);

CREATE TRIGGER delivery_workstreams_set_updated_at
    BEFORE UPDATE ON public.delivery_workstreams
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_delivery_workstreams_home_division
    ON public.delivery_workstreams (home_division_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_delivery_workstreams_lead_user
    ON public.delivery_workstreams (workstream_lead_user_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_delivery_workstreams_active_status
    ON public.delivery_workstreams (active_status)
    WHERE deleted_at IS NULL;

COMMENT ON TABLE public.delivery_workstreams IS
    'Delivery Workstreams — named organizational units that own Delivery Cycles. '
    'active_status = false blocks all gate clearance on assigned cycles (ARCH-23, Session 2026-03-24-Q). '
    'Managed via delivery-cycle-mcp create_delivery_workstream and update_workstream_active_status tools. '
    'Admin role required to create or toggle. Source: ARCH-23.';

COMMENT ON COLUMN public.delivery_workstreams.active_status IS
    'Gate enforcement gate. When false, submit_gate_for_approval and advance_cycle_stage '
    'return a blocked error for any cycle assigned to this Workstream. '
    'workstream_active_at_clearance is recorded on each gate_record at attempt time — audit trail.';

COMMENT ON COLUMN public.delivery_workstreams.workstream_lead_user_id IS
    'Single named lead. Not a gate approver role — that is resolved from Division configuration (D-65, Build B). '
    'Used for display and ownership attribution.';
