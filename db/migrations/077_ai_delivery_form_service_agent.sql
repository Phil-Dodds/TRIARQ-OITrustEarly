-- 077_ai_delivery_form_service_agent.sql
-- Pathways OI Trust — Contract 38 follow-on 16
--
-- Third AI delivery form: 'service_agent' — internal service / workflow
-- agents that are neither product-embedded nor delivered analytics (Phil
-- 2026-07-17). Service agents are internal by definition; the app coerces
-- ai_audience = 'internal' when this form is chosen. Governance unchanged:
-- internal AI → AI Production Board approval before Go to Release.
--
-- No new table → no RLS statement required.
-- ⚠ Do NOT execute via Code. Phil executes against Supabase.

BEGIN;

ALTER TABLE public.delivery_cycles
    DROP CONSTRAINT IF EXISTS delivery_cycles_ai_delivery_form_check;
ALTER TABLE public.delivery_cycles
    ADD CONSTRAINT delivery_cycles_ai_delivery_form_check
    CHECK (ai_delivery_form IS NULL OR ai_delivery_form IN ('product_embedded', 'analytics_outputs', 'service_agent'));

COMMIT;
