-- 087_suggestion_dismissals.sql
-- Pathways OI Trust — Contract G9 (governance redesign, D-563 Grade 2)
-- Suggestion dismissals with notes — visible to the relevant specialty
-- (S-C7). CC-G9: a dedicated table (spec column-gap allowance) — queryable by
-- specialty views without scanning the event log. Exactly two hardcoded rule
-- keys exist at launch; NO rules framework (D-563 — framework only when rule
-- three arrives).
-- ⚠ Do NOT execute via Code. Phil executes (preview env only until GEnd).
-- Must run after: 082_participation_tables.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.suggestion_dismissals (
    dismissal_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_cycle_id  uuid NOT NULL REFERENCES public.delivery_cycles(delivery_cycle_id) ON DELETE CASCADE,
    rule_key           text NOT NULL CHECK (rule_key IN ('q4_security', 'q5_ux')),
    group_id           uuid NOT NULL REFERENCES public.specialty_groups(group_id) ON DELETE CASCADE,
    note               text NOT NULL,
    dismissed_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    UNIQUE (delivery_cycle_id, rule_key)
);

CREATE TRIGGER suggestion_dismissals_set_updated_at
    BEFORE UPDATE ON public.suggestion_dismissals
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_suggestion_dismissals_group
    ON public.suggestion_dismissals (group_id);

ALTER TABLE public.suggestion_dismissals ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.suggestion_dismissals IS
    'Contract G9 (D-563 Grade 2) — trio dismissals of the two hardcoded '
    'consultation suggestions, with mandatory note; visible to the relevant '
    'specialty (S-C7). rule_key: q4_security (Q4=Yes → Security Consulted), '
    'q5_ux (Q5=Critical → UX Consulted).';

COMMIT;
