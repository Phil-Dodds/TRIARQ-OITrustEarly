-- 039_artifact_types_contract_24.sql
-- Pathways OI Trust — Contract 24 (D-437)
--
-- Adds active_status soft-delete column to cycle_artifact_types, installs the
-- CHECK constraint on required_at_gate (allowing 'all'), and replaces the
-- 26-row seed from Migration 021 with the Contract 24 revised 38-row set.
--
-- Preservation rule (per D-437 Part D): existing cycle_artifacts rows are
-- never deleted. Artifact types still present by name are updated in place.
-- New types are inserted. Types removed from the new set are deactivated
-- only when no cycle_artifacts rows reference them.
--
-- Source: OITrust-Contract24-Spec-2026-06-15.md §Workstream 8, D-437.
--
-- ⚠ Do NOT execute via Code per Rule 21. Phil executes against Supabase.

BEGIN;

-- ── Schema additions ────────────────────────────────────────────────────────

ALTER TABLE public.cycle_artifact_types
    ADD COLUMN IF NOT EXISTS active_status boolean NOT NULL DEFAULT true;

ALTER TABLE public.cycle_artifact_types
    DROP CONSTRAINT IF EXISTS cycle_artifact_types_required_at_gate_check;

ALTER TABLE public.cycle_artifact_types
    ADD CONSTRAINT cycle_artifact_types_required_at_gate_check
    CHECK (required_at_gate IS NULL OR required_at_gate IN (
        'brief_review',
        'go_to_build',
        'go_to_deploy',
        'go_to_release',
        'close_review',
        'all'
    ));

COMMENT ON COLUMN public.cycle_artifact_types.active_status IS
    'D-437 (Contract 24): soft delete flag. Deactivated types no longer surface '
    'in the Artifact Type picker on new attachments. Existing cycle_artifacts '
    'rows referencing a deactivated type continue to render normally.';

-- ── Helper: deduplicating UPSERT for the 38-row Contract 24 set ─────────────
-- Match by artifact_type_name (case-sensitive). Sort orders use 10/20/30/...
-- within each stage so future inserts can slot in cleanly.

DO $$
DECLARE
    new_types CONSTANT jsonb := $j$
[
  {"stage":"BRIEF","name":"One-Pager","req":"brief_review","sort":10,"guide":"Simple explanation of the proposed initiative — basis for Stakeholder Interview Questionnaire"},
  {"stage":"BRIEF","name":"Stakeholder Interview Questionnaire","req":"brief_review","sort":20,"guide":"Completed before Context Brief is written"},
  {"stage":"BRIEF","name":"Context Brief","req":"brief_review","sort":30,"guide":"Primary framing document — QUESTION and Outcome Statement required"},
  {"stage":"BRIEF","name":"Scenario Journeys","req":"brief_review","sort":40,"guide":"Scenario-based supporting context including gotcha/edge cases"},
  {"stage":"BRIEF","name":"True-life examples","req":"brief_review","sort":50,"guide":"Real examples supporting the brief"},
  {"stage":"DESIGN","name":"Design session output","req":"go_to_build","sort":10,"guide":"Session output file from design work"},
  {"stage":"DESIGN","name":"UI/UX mockup","req":"go_to_build","sort":20,"guide":"Screen designs or wireframes (Figma or equivalent — decision documented)"},
  {"stage":"DESIGN","name":"Process flow diagram","req":"go_to_build","sort":30,"guide":"Workflow or process map"},
  {"stage":"DESIGN","name":"User Stories","req":"go_to_build","sort":40,"guide":"Problem Statement, Solution Statement, Acceptance Criteria"},
  {"stage":"DESIGN","name":"Jira Epic","req":"go_to_build","sort":50,"guide":"Jira epic with all documents attached"},
  {"stage":"SPEC","name":"Technical Specification","req":"go_to_build","sort":10,"guide":"Full tech spec — MCP scope, schema, acceptance criteria"},
  {"stage":"SPEC","name":"Cursor prompt","req":"go_to_build","sort":20,"guide":"Initial AI-executable build prompt"},
  {"stage":"SPEC","name":"Architecture Decision Record","req":"go_to_build","sort":30,"guide":"ADR if applicable"},
  {"stage":"SPEC","name":"Agent Registry entry","req":"go_to_build","sort":40,"guide":"Required for Tier 3 agent deployments"},
  {"stage":"SPEC","name":"AI Governance Spec","req":"go_to_build","sort":50,"guide":"AI projects only: model approach, data inputs, governance hooks"},
  {"stage":"BUILD","name":"Governing document bootstrap log","req":"go_to_deploy","sort":10,"guide":"CLAUDE.md session context confirmation"},
  {"stage":"BUILD","name":"Mend scan results","req":"go_to_deploy","sort":20,"guide":"SCA scan — no critical/high CVEs"},
  {"stage":"BUILD","name":"Code review sign-off","req":"go_to_deploy","sort":30,"guide":"CB code review gate record"},
  {"stage":"BUILD","name":"As-built Document","req":"go_to_deploy","sort":40,"guide":"Retelling of what was actually created after build iterations — passed to UAT, training, OI Trust log"},
  {"stage":"VALIDATE","name":"QA test results","req":"go_to_deploy","sort":10,"guide":"Functional test pass record"},
  {"stage":"VALIDATE","name":"OWASP ZAP scan","req":"go_to_deploy","sort":20,"guide":"DAST results"},
  {"stage":"VALIDATE","name":"Wiz posture report","req":"go_to_deploy","sort":30,"guide":"CSPM baseline"},
  {"stage":"UAT","name":"UAT sign-off record","req":"go_to_deploy","sort":10,"guide":"Stakeholder acceptance"},
  {"stage":"UAT","name":"Release Notes / Build Completion Summary","req":"go_to_deploy","sort":20,"guide":"Summary of what was built and what changed"},
  {"stage":"UAT","name":"7-step governance checklist","req":"go_to_deploy","sort":30,"guide":"Required for Tier 3"},
  {"stage":"UAT","name":"HITRUST/GRICS checklist","req":"go_to_deploy","sort":40,"guide":"Required for Tier 3"},
  {"stage":"UAT","name":"AI Governance Board approval","req":"go_to_deploy","sort":50,"guide":"AI projects only: confirmed before gate opens — Tier 3 hard stop"},
  {"stage":"PILOT","name":"Pilot Plan","req":"go_to_release","sort":10,"guide":"User roles, pilot clients, observation period, feedback mechanism, success criteria"},
  {"stage":"PILOT","name":"Pilot observations log","req":"go_to_release","sort":20,"guide":"Running log during pilot period"},
  {"stage":"PILOT","name":"Pilot Results Summary","req":"go_to_release","sort":30,"guide":"1 page max"},
  {"stage":"PILOT","name":"Outstanding Issues Log","req":"go_to_release","sort":40,"guide":"All P1/P2 resolved or with approved resolution plan"},
  {"stage":"RELEASE","name":"Production Rollout Plan","req":"close_review","sort":10,"guide":"Timeline, comms, training"},
  {"stage":"RELEASE","name":"Rollback Plan","req":"close_review","sort":20,"guide":"Documented and tested"},
  {"stage":"RELEASE","name":"Wiz continuous monitoring baseline","req":"close_review","sort":30,"guide":"Production posture baseline"},
  {"stage":"OUTCOME","name":"Outcome measurement record","req":"close_review","sort":10,"guide":"Demonstrated outcome against acceptance criteria"},
  {"stage":"OUTCOME","name":"Outcomes Dashboard / KPI Summary","req":"close_review","sort":20,"guide":"1 page max"},
  {"stage":"OUTCOME","name":"Lessons Learned Summary","req":"close_review","sort":30,"guide":"Submitted to OI Library"},
  {"stage":"ANY","name":"Compliance & Risk Assessment","req":"all","sort":10,"guide":"Required before every gate — attach latest version"},
  {"stage":"ANY","name":"Reference document","req":null,"sort":20,"guide":"Ad hoc — user provides display name"}
]
$j$;
    row jsonb;
    new_name text;
    keep_names text[];
BEGIN
    -- Build the canonical name list once for the deactivation pass below.
    SELECT array_agg(t->>'name') INTO keep_names FROM jsonb_array_elements(new_types) AS t;

    -- UPSERT every row by name. Insert when missing; update in place when found.
    FOR row IN SELECT * FROM jsonb_array_elements(new_types)
    LOOP
        new_name := row->>'name';
        IF EXISTS (SELECT 1 FROM public.cycle_artifact_types WHERE artifact_type_name = new_name) THEN
            UPDATE public.cycle_artifact_types
               SET lifecycle_stage  = row->>'stage',
                   required_at_gate = NULLIF(row->>'req', ''),
                   sort_order       = (row->>'sort')::int,
                   guidance_text    = row->>'guide',
                   active_status    = true,
                   updated_at       = now()
             WHERE artifact_type_name = new_name;
        ELSE
            INSERT INTO public.cycle_artifact_types
                (artifact_type_name, lifecycle_stage, guidance_text, sort_order, gate_required, required_at_gate, active_status)
            VALUES
                (new_name, row->>'stage', row->>'guide',
                 (row->>'sort')::int, false,
                 NULLIF(row->>'req', ''), true);
        END IF;
    END LOOP;

    -- Deactivate any prior type now absent from the canonical set, but only
    -- when no cycle_artifacts row references it. Types with references stay
    -- visible to preserve historical attachments.
    UPDATE public.cycle_artifact_types t
       SET active_status = false,
           updated_at    = now()
     WHERE t.artifact_type_name <> ALL (keep_names)
       AND NOT EXISTS (
           SELECT 1 FROM public.cycle_artifacts a
            WHERE a.artifact_type_id = t.artifact_type_id
       );
END $$;

COMMIT;

-- ── Verification queries (run separately after migration) ──────────────────
-- SELECT lifecycle_stage, count(*) FROM public.cycle_artifact_types
--   WHERE active_status = true GROUP BY 1 ORDER BY 1;
-- SELECT artifact_type_name, lifecycle_stage, required_at_gate, sort_order, active_status
--   FROM public.cycle_artifact_types ORDER BY active_status DESC, lifecycle_stage, sort_order;
