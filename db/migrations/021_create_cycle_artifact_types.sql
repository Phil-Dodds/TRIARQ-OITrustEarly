-- 021_create_cycle_artifact_types.sql
-- Pathways OI Trust — Build C
-- System-defined seed table of artifact slot types, organized by lifecycle stage.
-- Populated via the INSERT below — not user-editable at launch.
-- 26 rows seeded per Session 2026-03-25-F.
-- gate_required and required_at_gate are dormant at launch — do not enforce (Session 2026-03-25-C).
-- Must run after: no Build C dependency (pure reference table)

CREATE TABLE IF NOT EXISTS public.cycle_artifact_types (
    artifact_type_id    uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_type_name  text     NOT NULL,
    lifecycle_stage     text     NOT NULL,
    guidance_text       text     NOT NULL,
    sort_order          integer  NOT NULL,
    gate_required       boolean  NOT NULL DEFAULT false,
    required_at_gate    text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER cycle_artifact_types_set_updated_at
    BEFORE UPDATE ON public.cycle_artifact_types
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_cycle_artifact_types_stage
    ON public.cycle_artifact_types (lifecycle_stage, sort_order);

COMMENT ON TABLE public.cycle_artifact_types IS
    'System-defined artifact slot types by lifecycle stage. '
    'Not user-editable at launch. Populated once via seed INSERT in this migration. '
    'lifecycle_stage = ''ANY'' marks ad hoc slots (Reference document). '
    'gate_required and required_at_gate are dormant at launch — no enforcement (Session 2026-03-25-C). '
    'Source: ARCH-24, Session 2026-03-25-B, Session 2026-03-25-F.';

COMMENT ON COLUMN public.cycle_artifact_types.gate_required IS
    'Dormant at launch. When true (future build), this slot must be filled before '
    'the gate named in required_at_gate can proceed.';

COMMENT ON COLUMN public.cycle_artifact_types.lifecycle_stage IS
    'Stage this slot belongs to. ''ANY'' = ad hoc attachment not tied to a stage. '
    'Valid values: BRIEF, DESIGN, SPEC, BUILD, VALIDATE, UAT, PILOT, RELEASE, OUTCOME, ANY.';

-- ============================================================
-- SEED DATA — 26 rows (Session 2026-03-25-F)
-- sort_order is per-stage, starting at 1
-- ============================================================

INSERT INTO public.cycle_artifact_types
    (artifact_type_name, lifecycle_stage, guidance_text, sort_order, gate_required)
VALUES
    -- BRIEF stage
    ('Context Brief',
     'BRIEF',
     'Primary framing document for this cycle',
     1, false),

    ('Scenario Journeys',
     'BRIEF',
     'Context Package layer — scenario-based supporting context',
     2, false),

    ('True-life examples',
     'BRIEF',
     'Context Package layer — real examples supporting the brief',
     3, false),

    ('Stakeholder input record',
     'BRIEF',
     'Structured record of stakeholder input gathered',
     4, false),

    -- DESIGN stage
    ('Design session output',
     'DESIGN',
     'Session output file from design work',
     1, false),

    ('UI/UX mockup',
     'DESIGN',
     'Screen designs or wireframes',
     2, false),

    ('Process flow diagram',
     'DESIGN',
     'Workflow or process map',
     3, false),

    -- SPEC stage
    ('Technical Specification',
     'SPEC',
     'Full tech spec — MCP scope, schema, acceptance criteria',
     1, false),

    ('Cursor prompt',
     'SPEC',
     'Initial AI-executable build prompt (BUILD phase working artifact per D-115)',
     2, false),

    ('Architecture Decision Record',
     'SPEC',
     'ADR if applicable',
     3, false),

    ('Agent Registry entry',
     'SPEC',
     'Required for Tier 3 agent deployments',
     4, false),

    -- BUILD stage
    ('Governing document bootstrap log',
     'BUILD',
     'CLAUDE.md session context confirmation',
     1, false),

    ('Mend scan results',
     'BUILD',
     'SCA scan — no critical/high CVEs',
     2, false),

    ('Code review sign-off',
     'BUILD',
     'CB code review gate record',
     3, false),

    ('Delivery Cycle Build Report',
     'BUILD',
     'As-built record — complete before Go to Deploy',
     4, false),

    -- VALIDATE stage
    ('QA test results',
     'VALIDATE',
     'Functional test pass record',
     1, false),

    ('OWASP ZAP scan',
     'VALIDATE',
     'DAST results',
     2, false),

    ('Wiz posture report',
     'VALIDATE',
     'CSPM baseline',
     3, false),

    -- UAT stage
    ('UAT sign-off record',
     'UAT',
     'Stakeholder acceptance',
     1, false),

    ('7-step governance checklist',
     'UAT',
     'Required for Tier 3',
     2, false),

    ('HITRUST/GRICS checklist',
     'UAT',
     'Required for Tier 3',
     3, false),

    -- PILOT stage
    ('Pilot Plan',
     'PILOT',
     'Who, scope, duration, success criteria, rollback trigger',
     1, false),

    ('Pilot observations log',
     'PILOT',
     'Running log during pilot',
     2, false),

    -- RELEASE stage
    ('Wiz continuous monitoring baseline',
     'RELEASE',
     'Production posture baseline',
     1, false),

    -- OUTCOME stage
    ('Outcome measurement record',
     'OUTCOME',
     'Demonstrated outcome against acceptance criteria',
     1, false),

    -- ANY (ad hoc)
    ('Reference document',
     'ANY',
     'Ad hoc — user provides display name',
     1, false);
