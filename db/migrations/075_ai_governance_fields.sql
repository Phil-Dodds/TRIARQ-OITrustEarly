-- 075_ai_governance_fields.sql
-- Pathways OI Trust — Contract 38 follow-on 13 (AI Production Governance)
--
-- Three orthogonal AI profile fields + AI Production Board approval with audit
-- stamps (Phil policy 2026-07-17):
--   ai_functionality — NULL (blank) | 'yes' | 'no' | 'unknown'
--     Blank allowed through Brief Review; answered (any) by Go to Build;
--     'yes'/'no' only by Go to Deploy. Enforced in submit_gate_for_approval.
--   ai_delivery_form — when yes: 'product_embedded' | 'analytics_outputs'
--   ai_audience      — when yes: 'external' | 'internal'
--   ai_board_approved(+at/by) — AI Production Board approval record.
--     Board placement: embedded+external → before Go to Deploy (pilot);
--     internal (either form) → before Go to Release;
--     analytics+external → no Board stop (Track 2 requirements instead).
--
-- No new table → no RLS statement required.
-- ⚠ Do NOT execute via Code. Phil executes against Supabase.

BEGIN;

ALTER TABLE public.delivery_cycles
    ADD COLUMN IF NOT EXISTS ai_functionality      text,
    ADD COLUMN IF NOT EXISTS ai_delivery_form      text,
    ADD COLUMN IF NOT EXISTS ai_audience           text,
    ADD COLUMN IF NOT EXISTS ai_board_approved     boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS ai_board_approved_at  timestamptz,
    ADD COLUMN IF NOT EXISTS ai_board_approved_by  uuid REFERENCES public.users(id) ON DELETE RESTRICT;

ALTER TABLE public.delivery_cycles
    DROP CONSTRAINT IF EXISTS delivery_cycles_ai_functionality_check;
ALTER TABLE public.delivery_cycles
    ADD CONSTRAINT delivery_cycles_ai_functionality_check
    CHECK (ai_functionality IS NULL OR ai_functionality IN ('yes', 'no', 'unknown'));

ALTER TABLE public.delivery_cycles
    DROP CONSTRAINT IF EXISTS delivery_cycles_ai_delivery_form_check;
ALTER TABLE public.delivery_cycles
    ADD CONSTRAINT delivery_cycles_ai_delivery_form_check
    CHECK (ai_delivery_form IS NULL OR ai_delivery_form IN ('product_embedded', 'analytics_outputs'));

ALTER TABLE public.delivery_cycles
    DROP CONSTRAINT IF EXISTS delivery_cycles_ai_audience_check;
ALTER TABLE public.delivery_cycles
    ADD CONSTRAINT delivery_cycles_ai_audience_check
    CHECK (ai_audience IS NULL OR ai_audience IN ('external', 'internal'));

COMMIT;
