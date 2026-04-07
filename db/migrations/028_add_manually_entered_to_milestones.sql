-- Migration 028 — add manually_entered to cycle_milestone_dates
-- Pathways OI Trust | Build C
-- Required by set_milestone_actual_date tool (fix #30 from Design Chat triage).
-- Distinguishes user-initiated actual date corrections from gate-approval-driven
-- actual date writes (record_gate_decision sets actual_date directly without this flag).
-- Source: Session 2026-04-07, build-c-spec Section 4.1

ALTER TABLE public.cycle_milestone_dates
  ADD COLUMN IF NOT EXISTS manually_entered boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.cycle_milestone_dates.manually_entered IS
  'True when actual_date was set directly by a user via set_milestone_actual_date tool (correction path). '
  'False (default) when set by record_gate_decision on gate approval.';
