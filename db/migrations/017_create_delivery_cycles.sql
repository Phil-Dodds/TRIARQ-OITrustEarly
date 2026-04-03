-- 017_create_delivery_cycles.sql
-- Pathways OI Trust — Build C
-- Primary unit of delivery work (D-83). One cycle per initiative, advancing through
-- a 12-stage lifecycle (D-108) with five named gates (D-154, ARCH-12).
-- current_lifecycle_stage is system-controlled — updated only via advance_cycle_stage.
-- outcome_statement is a direct field (not an artifact) — amber UI warning when null (Session 2026-03-25-A).
-- Must run after: 015_create_delivery_workstreams.sql, 002_create_divisions.sql, 001_create_users.sql

CREATE TABLE IF NOT EXISTS public.delivery_cycles (
    delivery_cycle_id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_title               text        NOT NULL,
    cycle_description         text,
    division_id               uuid        NOT NULL REFERENCES public.divisions(id) ON DELETE RESTRICT,
    workstream_id             uuid        NOT NULL REFERENCES public.delivery_workstreams(workstream_id) ON DELETE RESTRICT,
    tier_classification       text        NOT NULL
                                          CHECK (tier_classification IN ('tier_1', 'tier_2', 'tier_3')),
    current_lifecycle_stage   text        NOT NULL DEFAULT 'BRIEF'
                                          CHECK (current_lifecycle_stage IN (
                                              'BRIEF', 'DESIGN', 'SPEC', 'BUILD',
                                              'VALIDATE', 'UAT', 'PILOT', 'RELEASE',
                                              'OUTCOME', 'COMPLETE', 'CANCELLED', 'ON_HOLD'
                                          )),
    outcome_statement         text,
    outcome_set_by_user_id    uuid        REFERENCES public.users(id) ON DELETE RESTRICT,
    outcome_set_at            timestamptz,
    cycle_owner_user_id       uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    jira_epic_key             text,
    created_at                timestamptz NOT NULL DEFAULT now(),
    updated_at                timestamptz NOT NULL DEFAULT now(),
    deleted_at                timestamptz
);

CREATE TRIGGER delivery_cycles_set_updated_at
    BEFORE UPDATE ON public.delivery_cycles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_delivery_cycles_division
    ON public.delivery_cycles (division_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_delivery_cycles_workstream
    ON public.delivery_cycles (workstream_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_delivery_cycles_owner
    ON public.delivery_cycles (cycle_owner_user_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_delivery_cycles_lifecycle_stage
    ON public.delivery_cycles (current_lifecycle_stage)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_delivery_cycles_tier
    ON public.delivery_cycles (tier_classification)
    WHERE deleted_at IS NULL;

COMMENT ON TABLE public.delivery_cycles IS
    'Primary unit of delivery work (D-83). Tracks a single initiative from BRIEF through OUTCOME. '
    'Lifecycle is 12 stages with 5 gates (D-108, D-154). '
    'current_lifecycle_stage is system-controlled — only advance_cycle_stage may update it. '
    'Five cycle_milestone_dates rows and gate_records are seeded on creation by create_delivery_cycle. '
    'Source: D-83, D-108, D-124, D-125, ARCH-12, ARCH-15, ARCH-23.';

COMMENT ON COLUMN public.delivery_cycles.current_lifecycle_stage IS
    'System-controlled. Valid progression: BRIEF → DESIGN → SPEC → BUILD → VALIDATE → UAT → '
    'PILOT → RELEASE → OUTCOME → COMPLETE. CANCELLED and ON_HOLD are terminal / pause states. '
    'Updated only by advance_cycle_stage MCP tool. Tier set at BRIEF stage (D-124).';

COMMENT ON COLUMN public.delivery_cycles.outcome_statement IS
    'Direct field — not stored as an artifact (Session 2026-03-25-A). '
    'UI renders amber persistent warning when null: "Outcome statement not yet set. Add one to keep the team aligned." '
    'Set via set_outcome_statement MCP tool.';

COMMENT ON COLUMN public.delivery_cycles.tier_classification IS
    'Set once at BRIEF stage (D-124). Drives gate configuration and artifact requirements. '
    'Tier 3 requires Agent Registry entry artifact slot and additional UAT checklist items.';

COMMENT ON COLUMN public.delivery_cycles.jira_epic_key IS
    'Primary Jira epic key for this cycle (e.g. PS-2025-042). '
    'Bidirectional sync via sync_jira_epic. One cycle may link to multiple epics via jira_links table (D-67). '
    'This field is the primary key. Additional links are rows in jira_links.';
