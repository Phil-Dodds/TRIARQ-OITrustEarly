-- 002_seed_artifact_types.sql
-- Pathways OI Trust — Build A
-- Seeds the 13 system artifact types (D-145).
-- References Phil's user via email lookup — run after 001_seed_system_admin.sql.
--
-- is_system_type = true for all 13: these types have hardcoded workflow logic.
-- workflow_handler references are placeholder format — wired in Build B.
-- default_scope reflects the natural home for each type.

DO $$
DECLARE
    phil_id uuid;
BEGIN
    -- Resolve Phil's user id by email (avoids hardcoding the UUID twice)
    SELECT id INTO phil_id FROM public.users WHERE email = 'pdodds@triarqhealth.com' LIMIT 1;

    IF phil_id IS NULL THEN
        RAISE EXCEPTION 'Phil''s user record not found. Run 001_seed_system_admin.sql first.';
    END IF;

    INSERT INTO public.artifact_types (
        type_name,
        type_description,
        is_system_type,
        workflow_handler,
        default_scope,
        created_by
    ) VALUES

    -- 1
    ('Context Brief',
     'Structured summary of a client, project, or domain context. '
     'Primary input to Delivery Cycle planning.',
     true,
     'handlers.context_brief',
     'division',
     phil_id),

    -- 2
    ('Delivery Cycle Build Report',
     'End-of-cycle report documenting what was built, decisions made, and outcomes. '
     'Produced by CB at Delivery Cycle close.',
     true,
     'handlers.delivery_cycle_build_report',
     'division',
     phil_id),

    -- 3
    ('Engineering Best Practice',
     'Documented engineering pattern, standard, or convention approved for reuse. '
     'Scoped to a Division or system-wide.',
     true,
     'handlers.engineering_best_practice',
     'trust',
     phil_id),

    -- 4
    ('Domain Knowledge',
     'General domain knowledge artifact — not a formal SOP or policy. '
     'Captures institutional knowledge for agent consumption.',
     true,
     'handlers.domain_knowledge',
     'division',
     phil_id),

    -- 5
    ('SOP',
     'Standard Operating Procedure. Step-by-step process documentation '
     'approved for operational use.',
     true,
     'handlers.sop',
     'division',
     phil_id),

    -- 6
    ('Policy',
     'Formal organizational policy. Authoritative and binding. '
     'Approval requires accountable authority per RACI.',
     true,
     'handlers.policy',
     'trust',
     phil_id),

    -- 7
    ('Workflow Map',
     'Visual or structured representation of a process flow. '
     'May reference SOPs and Policies.',
     true,
     'handlers.workflow_map',
     'division',
     phil_id),

    -- 8
    ('Training Module',
     'Structured learning content for onboarding or capability development. '
     'May reference SOPs, Policies, and Domain Knowledge.',
     true,
     'handlers.training_module',
     'trust',
     phil_id),

    -- 9
    ('Risk Register Entry',
     'Documented risk, likelihood, impact, and mitigation. '
     'Maintained by the owning Division.',
     true,
     'handlers.risk_register_entry',
     'division',
     phil_id),

    -- 10
    ('HITRUST Control',
     'HITRUST CSF control documentation. Linked to compliance program. '
     'Requires Phil or designated approver.',
     true,
     'handlers.hitrust_control',
     'system',
     phil_id),

    -- 11
    ('CBR',
     'Capability Build Request. Formal request to initiate a Delivery Cycle. '
     'Initiates DS → CB handoff workflow.',
     true,
     'handlers.cbr',
     'division',
     phil_id),

    -- 12
    ('Agent Registry Entry',
     'Registration record for a deployed AI agent — purpose, capabilities, '
     'owner Division, and operational constraints.',
     true,
     'handlers.agent_registry_entry',
     'system',
     phil_id),

    -- 13
    ('Performance Metric Definition',
     'Formal definition of a KPI or operational metric — formula, source, '
     'frequency, and accountable owner.',
     true,
     'handlers.performance_metric_definition',
     'trust',
     phil_id)

    ON CONFLICT (type_name) DO UPDATE SET
        type_description = EXCLUDED.type_description,
        is_system_type   = EXCLUDED.is_system_type,
        workflow_handler = EXCLUDED.workflow_handler,
        default_scope    = EXCLUDED.default_scope,
        updated_at       = now();

    RAISE NOTICE '13 system artifact types seeded successfully.';
END $$;
