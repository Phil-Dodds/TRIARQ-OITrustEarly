-- 003_seed_tier_gate_config.sql
-- Pathways OI Trust — Build C
-- Seeds tier gate requirements and division gate approvers.
--
-- BEFORE RUNNING:
--   1. Run migration 026_create_tier_gate_config.sql first.
--   2. Confirm Sabrina's user record exists in public.users.
--      Run: SELECT id, display_name FROM public.users WHERE display_name ILIKE '%Sabrina%';
--      If her row is missing, invite her via Supabase Auth, then seed her user row first.
--   3. Confirm division names. Run:
--      SELECT division_id, division_name FROM public.divisions WHERE deleted_at IS NULL;
--      Update the ILIKE patterns below if division names differ from expected.
--
-- Source: Section 4 (build-c-ux-correction-spec-2026-04-06), D-65, D-66, Session 2026-03-29-C

-- ── Part 1: Tier Gate Requirements ───────────────────────────────────────────
-- All three tiers require all five gates for the current rollout phase.
-- When Tier 1 / Tier 2 gate configs are loosened, UPDATE the relevant rows —
-- do not delete them (soft delete or boolean flip).

INSERT INTO public.tier_gate_requirements (tier_classification, gate_name, gate_required)
VALUES
    ('tier_1', 'brief_review',   true),
    ('tier_1', 'go_to_build',    true),
    ('tier_1', 'go_to_deploy',   true),
    ('tier_1', 'go_to_release',  true),
    ('tier_1', 'close_review',   true),

    ('tier_2', 'brief_review',   true),
    ('tier_2', 'go_to_build',    true),
    ('tier_2', 'go_to_deploy',   true),
    ('tier_2', 'go_to_release',  true),
    ('tier_2', 'close_review',   true),

    ('tier_3', 'brief_review',   true),
    ('tier_3', 'go_to_build',    true),
    ('tier_3', 'go_to_deploy',   true),
    ('tier_3', 'go_to_release',  true),
    ('tier_3', 'close_review',   true)
ON CONFLICT (tier_classification, gate_name) DO UPDATE SET
    gate_required = EXCLUDED.gate_required,
    updated_at    = now();

-- ── Part 2: Division Gate Approvers — Demo Data ───────────────────────────────
-- Approver assignment per Division × Gate per the spec:
--   Brief Review, Go to Build, Go to Deploy → Sabrina (Domain Lead)
--      for Practice Services Trust and Value Services Trust
--   Go to Release, Close Review → Phil (EVP Governance)
--      for Practice Services Trust and Value Services Trust
--   Other Divisions: no rows inserted — MCP escalates to Division Owner.
--
-- Phil's user_id is seeded in 001_seed_system_admin.sql.
-- Sabrina's user_id is resolved by display_name lookup below.
-- Division IDs are resolved by division_name lookup — update ILIKE patterns if names differ.

DO $$
DECLARE
    phil_user_id        uuid := '5d0cb7bc-c56f-4db8-a2d3-6a34d92fe82a'::uuid;
    sabrina_user_id     uuid;
    practice_div_id     uuid;
    value_svc_div_id    uuid;
BEGIN
    -- ── Resolve Sabrina's user_id ──────────────────────────────────────────
    SELECT id INTO sabrina_user_id
    FROM public.users
    WHERE display_name ILIKE '%Sabrina%'
      AND deleted_at IS NULL
    LIMIT 1;

    IF sabrina_user_id IS NULL THEN
        RAISE WARNING 'Sabrina user not found. Skipping division gate approver seed for her gates. '
                      'Create her user record and re-run this script.';
    END IF;

    -- ── Resolve Practice Services Trust division_id ────────────────────────
    SELECT division_id INTO practice_div_id
    FROM public.divisions
    WHERE division_name ILIKE '%Practice Services%'
      AND deleted_at IS NULL
    LIMIT 1;

    IF practice_div_id IS NULL THEN
        RAISE WARNING 'Practice Services Trust division not found. '
                      'Check division_name and update ILIKE pattern if needed.';
    END IF;

    -- ── Resolve Value Services Trust division_id ───────────────────────────
    SELECT division_id INTO value_svc_div_id
    FROM public.divisions
    WHERE division_name ILIKE '%Value Services%'
      AND deleted_at IS NULL
    LIMIT 1;

    IF value_svc_div_id IS NULL THEN
        RAISE WARNING 'Value Services Trust division not found. '
                      'Check division_name and update ILIKE pattern if needed.';
    END IF;

    -- ── Seed: Practice Services Trust ─────────────────────────────────────
    IF practice_div_id IS NOT NULL THEN
        -- Brief Review, Go to Build, Go to Deploy → Sabrina (if found)
        IF sabrina_user_id IS NOT NULL THEN
            INSERT INTO public.division_gate_approvers
                (division_id, gate_name, approver_user_id)
            VALUES
                (practice_div_id, 'brief_review',   sabrina_user_id),
                (practice_div_id, 'go_to_build',    sabrina_user_id),
                (practice_div_id, 'go_to_deploy',   sabrina_user_id)
            ON CONFLICT (division_id, gate_name) DO UPDATE SET
                approver_user_id = EXCLUDED.approver_user_id,
                updated_at       = now();
        END IF;

        -- Go to Release, Close Review → Phil
        INSERT INTO public.division_gate_approvers
            (division_id, gate_name, approver_user_id)
        VALUES
            (practice_div_id, 'go_to_release',  phil_user_id),
            (practice_div_id, 'close_review',   phil_user_id)
        ON CONFLICT (division_id, gate_name) DO UPDATE SET
            approver_user_id = EXCLUDED.approver_user_id,
            updated_at       = now();

        RAISE NOTICE 'Practice Services Trust gate approvers seeded (division_id: %)', practice_div_id;
    END IF;

    -- ── Seed: Value Services Trust ─────────────────────────────────────────
    IF value_svc_div_id IS NOT NULL THEN
        -- Brief Review, Go to Build, Go to Deploy → Sabrina (if found)
        IF sabrina_user_id IS NOT NULL THEN
            INSERT INTO public.division_gate_approvers
                (division_id, gate_name, approver_user_id)
            VALUES
                (value_svc_div_id, 'brief_review',   sabrina_user_id),
                (value_svc_div_id, 'go_to_build',    sabrina_user_id),
                (value_svc_div_id, 'go_to_deploy',   sabrina_user_id)
            ON CONFLICT (division_id, gate_name) DO UPDATE SET
                approver_user_id = EXCLUDED.approver_user_id,
                updated_at       = now();
        END IF;

        -- Go to Release, Close Review → Phil
        INSERT INTO public.division_gate_approvers
            (division_id, gate_name, approver_user_id)
        VALUES
            (value_svc_div_id, 'go_to_release',  phil_user_id),
            (value_svc_div_id, 'close_review',   phil_user_id)
        ON CONFLICT (division_id, gate_name) DO UPDATE SET
            approver_user_id = EXCLUDED.approver_user_id,
            updated_at       = now();

        RAISE NOTICE 'Value Services Trust gate approvers seeded (division_id: %)', value_svc_div_id;
    END IF;

    -- ── Summary ────────────────────────────────────────────────────────────
    RAISE NOTICE 'Tier gate requirements: 15 rows upserted (all tiers × all gates = required).';
    RAISE NOTICE 'All other Divisions: no approver rows — MCP will escalate to Division Owner per Session 2026-03-29-C.';
END $$;
