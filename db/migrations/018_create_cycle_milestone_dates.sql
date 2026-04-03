-- 018_create_cycle_milestone_dates.sql
-- Pathways OI Trust — Build C
-- One row per named gate per cycle. Five rows seeded by create_delivery_cycle on creation.
-- target_date is team-set. actual_date is system-recorded when the gate clears.
-- date_status drives the UI color model (Session 2026-03-24-A):
--   not_started → on_track / at_risk / behind (commitment mode) → complete (achieved/missed)
-- Must run after: 017_create_delivery_cycles.sql

CREATE TABLE IF NOT EXISTS public.cycle_milestone_dates (
    milestone_id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_cycle_id       uuid        NOT NULL REFERENCES public.delivery_cycles(delivery_cycle_id) ON DELETE RESTRICT,
    gate_name               text        NOT NULL
                                        CHECK (gate_name IN (
                                            'brief_review', 'go_to_build', 'go_to_deploy',
                                            'go_to_release', 'close_review'
                                        )),
    milestone_label         text        NOT NULL,
    target_date             date,
    actual_date             date,
    date_status             text        NOT NULL DEFAULT 'not_started'
                                        CHECK (date_status IN (
                                            'not_started', 'on_track', 'at_risk', 'behind', 'complete'
                                        )),
    status_override_reason  text,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    deleted_at              timestamptz,
    UNIQUE (delivery_cycle_id, gate_name)
);

CREATE TRIGGER cycle_milestone_dates_set_updated_at
    BEFORE UPDATE ON public.cycle_milestone_dates
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_cycle_milestone_dates_cycle
    ON public.cycle_milestone_dates (delivery_cycle_id)
    WHERE deleted_at IS NULL;

COMMENT ON TABLE public.cycle_milestone_dates IS
    'Planning and tracking layer for the five named gates. One row per gate per cycle, '
    'seeded by create_delivery_cycle. '
    'target_date is team-set via set_milestone_target_date. '
    'actual_date is system-recorded by record_gate_decision on approval — not editable by users. '
    'Source: Session 2026-03-24-E, Session 2026-03-24-A (date state model).';

COMMENT ON COLUMN public.cycle_milestone_dates.milestone_label IS
    'Human-readable gate label. Seeded values: Brief Review Complete, Build Start, '
    'Pilot Start, Release Start, Close Review Complete.';

COMMENT ON COLUMN public.cycle_milestone_dates.date_status IS
    'Date field state model (Session 2026-03-24-A): '
    'Commitment mode (actual_date IS NULL): not_started / on_track / at_risk / behind. '
    'Overdue = today > target_date (Oravive color). Upcoming = target_date within 4 days (Sunray color). '
    'Achieved mode: actual_date <= target_date (neutral color, label "Actual"). '
    'Missed mode: actual_date > target_date (muted overdue color, label "Actual"). '
    'Urgency indicators suppressed when cycle is COMPLETE or CANCELLED.';

COMMENT ON COLUMN public.cycle_milestone_dates.status_override_reason IS
    'Required when reverting date_status from complete to any other status. '
    'Enforced by update_milestone_status MCP tool.';
