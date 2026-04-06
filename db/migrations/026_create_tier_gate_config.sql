-- 026_create_tier_gate_config.sql
-- Pathways OI Trust — Build C
-- Tier Gate Requirements configuration table.
-- Records which gates are required for each tier classification.
-- Allows admin to loosen gate requirements per tier without code changes (D-65, D-66).
-- Build C: all three tiers require all five gates (seeded in 003_seed_tier_gate_config.sql).
-- Build B: UI for admin to configure per Division per tier per D-65.
--
-- Must run after: 000_extensions.sql
-- Source: D-65, D-66, Session 2026-03-24-G, Section 4 (build-c-ux-correction-spec-2026-04-06)

CREATE TABLE IF NOT EXISTS public.tier_gate_requirements (
    requirement_id      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_classification text        NOT NULL
                                    CHECK (tier_classification IN ('tier_1', 'tier_2', 'tier_3')),
    gate_name           text        NOT NULL
                                    CHECK (gate_name IN (
                                        'brief_review', 'go_to_build', 'go_to_deploy',
                                        'go_to_release', 'close_review'
                                    )),
    gate_required       boolean     NOT NULL DEFAULT true,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz,

    UNIQUE (tier_classification, gate_name)
);

CREATE TRIGGER tier_gate_requirements_set_updated_at
    BEFORE UPDATE ON public.tier_gate_requirements
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.tier_gate_requirements IS
    'Configures which gates are required for each tier classification. '
    'Build C: all three tiers require all five gates. '
    'Build B: admin can loosen requirements per Division per tier (D-65, D-66). '
    'Source: D-65, D-66, Session 2026-03-24-G.';

-- ── Division Gate Approver Configuration ──────────────────────────────────────
-- Per-division, per-gate approver assignment (D-65).
-- Build C: demo data seeded for Practice Services Trust and Value Services Trust.
-- If no row found for a division+gate, MCP escalates to Division Owner (Session 2026-03-29-C).
-- Must run after: 002_create_divisions.sql, 001_create_users.sql

CREATE TABLE IF NOT EXISTS public.division_gate_approvers (
    approver_config_id  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id         uuid        NOT NULL REFERENCES public.divisions(division_id) ON DELETE RESTRICT,
    gate_name           text        NOT NULL
                                    CHECK (gate_name IN (
                                        'brief_review', 'go_to_build', 'go_to_deploy',
                                        'go_to_release', 'close_review'
                                    )),
    approver_user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz,

    UNIQUE (division_id, gate_name)
);

CREATE TRIGGER division_gate_approvers_set_updated_at
    BEFORE UPDATE ON public.division_gate_approvers
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_division_gate_approvers_division
    ON public.division_gate_approvers (division_id)
    WHERE deleted_at IS NULL;

COMMENT ON TABLE public.division_gate_approvers IS
    'Per-division, per-gate approver assignment (D-65). '
    'When no row exists for a division+gate combination, the MCP layer escalates to '
    'Division Owner. If no Division Owner is set, escalates to Phil (Session 2026-03-29-C). '
    'Build B: admin UI for configuring these records. '
    'Source: D-65, D-66, Session 2026-03-29-C.';
