-- 076_ai_artifact_types.sql
-- Pathways OI Trust — Contract 38 follow-on 13 (AI Production Governance)
--
-- Two new delivery artifact slot types (Phil 2026-07-17):
--   'AI Production Governance Report'  — advisory (amber) at the AI Production
--     Board gate (Go to Deploy for embedded+external; Go to Release for
--     internal AI). primary_gate set to go_to_deploy for D-438 suggestion
--     warnings; the Angular checklist applies the profile-specific gate.
--   'AI Delivery Requirements Record'  — Track 2 analytics deliverables
--     (data lineage, reproducibility statement, AI disclosure). Advisory only.
--
-- Idempotent by artifact_type_name. No new table → no RLS statement required.
-- ⚠ Do NOT execute via Code. Phil executes against Supabase.

BEGIN;

INSERT INTO public.cycle_artifact_types
    (artifact_type_name, lifecycle_stage, guidance_text, sort_order,
     gate_required, primary_gate, gate_warning_behavior)
SELECT 'AI Production Governance Report', 'UAT',
       'AI Production Board governance report — required reading for the AI Production Board review',
       90, false, 'go_to_deploy', 'primary_only'
WHERE NOT EXISTS (SELECT 1 FROM public.cycle_artifact_types
                  WHERE artifact_type_name = 'AI Production Governance Report');

INSERT INTO public.cycle_artifact_types
    (artifact_type_name, lifecycle_stage, guidance_text, sort_order,
     gate_required, primary_gate, gate_warning_behavior)
SELECT 'AI Delivery Requirements Record', 'UAT',
       'Track 2 analytics: data lineage, reproducibility statement, and AI disclosure for delivered outputs',
       91, false, 'go_to_deploy', 'primary_only'
WHERE NOT EXISTS (SELECT 1 FROM public.cycle_artifact_types
                  WHERE artifact_type_name = 'AI Delivery Requirements Record');

COMMIT;
