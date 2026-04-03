-- 019_create_gate_records.sql
-- Pathways OI Trust — Build C
-- Approval records for the five named gates (D-154, ARCH-12). Seeded by create_delivery_cycle.
-- Gate positions in the 12-stage lifecycle (ARCH-12):
--   brief_review   exits BRIEF    → enters DESIGN   (milestone: Brief Review Complete)
--   go_to_build    exits SPEC     → enters BUILD     (milestone: Build Start)
--   go_to_deploy   exits VALIDATE → enters PILOT     (milestone: Pilot Start)
--   go_to_release  exits UAT      → enters RELEASE   (milestone: Release Start)
--   close_review   exits OUTCOME  → enters COMPLETE  (milestone: Close Review Complete)
--
-- Full stage sequence: BRIEF → DESIGN → SPEC → BUILD → VALIDATE → PILOT → UAT → RELEASE → OUTCOME → COMPLETE
-- CANCELLED and ON_HOLD are terminal/pause states outside the sequential path.
-- workstream_active_at_clearance is recorded at every gate attempt regardless of outcome — audit trail.
-- Must run after: 017_create_delivery_cycles.sql, 001_create_users.sql

CREATE TABLE IF NOT EXISTS public.gate_records (
    gate_record_id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_cycle_id               uuid        NOT NULL REFERENCES public.delivery_cycles(delivery_cycle_id) ON DELETE RESTRICT,
    gate_name                       text        NOT NULL
                                                CHECK (gate_name IN (
                                                    'brief_review', 'go_to_build', 'go_to_deploy',
                                                    'go_to_release', 'close_review'
                                                )),
    gate_status                     text        NOT NULL DEFAULT 'pending'
                                                CHECK (gate_status IN (
                                                    'pending', 'approved', 'returned', 'blocked'
                                                )),
    approver_user_id                uuid        REFERENCES public.users(id) ON DELETE RESTRICT,
    approver_decision_at            timestamptz,
    approver_notes                  text,
    workstream_active_at_clearance  boolean,
    created_at                      timestamptz NOT NULL DEFAULT now(),
    updated_at                      timestamptz NOT NULL DEFAULT now(),
    deleted_at                      timestamptz
);

CREATE TRIGGER gate_records_set_updated_at
    BEFORE UPDATE ON public.gate_records
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_gate_records_cycle
    ON public.gate_records (delivery_cycle_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_gate_records_approver
    ON public.gate_records (approver_user_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_gate_records_status
    ON public.gate_records (gate_status)
    WHERE deleted_at IS NULL;

COMMENT ON TABLE public.gate_records IS
    'Approval records for the five named gates (D-154). One row per gate seeded on cycle creation. '
    'gate_status transitions: pending → approved (on record_gate_decision approval) '
    'or returned (requires approver_notes) or blocked (inactive workstream). '
    'Source: D-49, D-154, ARCH-12, Session 2026-03-18-A.';

COMMENT ON COLUMN public.gate_records.gate_status IS
    'pending: gate not yet submitted for approval. '
    'approved: approver cleared the gate — triggers stage advance and actual_date recording. '
    'returned: approver returned — approver_notes required. '
    'blocked: workstream inactive at time of submission attempt.';

COMMENT ON COLUMN public.gate_records.approver_user_id IS
    'Build C: Phil Sappington user_id used as default approver for all gates (Section 4.2). '
    'Build B: resolved from Division-level RACI configuration per D-65.';

COMMENT ON COLUMN public.gate_records.workstream_active_at_clearance IS
    'Snapshot of delivery_workstreams.active_status at the moment of the gate clearance attempt. '
    'Recorded regardless of whether the attempt succeeded. Audit trail. '
    'false = workstream was inactive; gate was blocked (ARCH-23, Session 2026-03-24-Q).';
