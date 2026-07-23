-- 081_governance_level_columns.sql
-- Pathways OI Trust — Contract G1 (governance redesign schema foundation)
-- Primitive 2 — Governance level (D-556, D-559, D-561, D-562).
-- Adds level + oversight columns to delivery_cycles and the per-user global
-- trusted_dcs flag to users. Effective level = COALESCE(set_level, baseline_level).
-- baseline_level NULL = unsized (no initiative_sizing row yet).
-- No existing column is dropped, renamed, or repurposed (D-252). The legacy
-- tier_classification field is untouched — retired per-initiative by D-567 flow
-- in G3, not by migration.
-- ⚠ Do NOT execute via Code. Phil executes against Supabase.
-- Must run after: 080_initiative_sizing.sql

BEGIN;

ALTER TABLE public.delivery_cycles
    ADD COLUMN IF NOT EXISTS baseline_level           smallint NULL,
    ADD COLUMN IF NOT EXISTS set_level                smallint NULL,
    ADD COLUMN IF NOT EXISTS set_level_by_user_id     uuid NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS set_level_reason         text NULL,
    ADD COLUMN IF NOT EXISTS set_level_at             timestamptz NULL,
    ADD COLUMN IF NOT EXISTS oversight_user_id        uuid NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS oversight_set_via        text NULL,
    ADD COLUMN IF NOT EXISTS oversight_set_by_user_id uuid NULL REFERENCES public.users(id) ON DELETE RESTRICT;

-- Idempotent CHECK-constraint pattern (075 precedent).
ALTER TABLE public.delivery_cycles
    DROP CONSTRAINT IF EXISTS delivery_cycles_baseline_level_check;
ALTER TABLE public.delivery_cycles
    ADD CONSTRAINT delivery_cycles_baseline_level_check
    CHECK (baseline_level IS NULL OR baseline_level IN (1, 2, 3));

ALTER TABLE public.delivery_cycles
    DROP CONSTRAINT IF EXISTS delivery_cycles_set_level_check;
ALTER TABLE public.delivery_cycles
    ADD CONSTRAINT delivery_cycles_set_level_check
    CHECK (set_level IS NULL OR set_level IN (1, 2, 3));

ALTER TABLE public.delivery_cycles
    DROP CONSTRAINT IF EXISTS delivery_cycles_oversight_set_via_check;
ALTER TABLE public.delivery_cycles
    ADD CONSTRAINT delivery_cycles_oversight_set_via_check
    CHECK (oversight_set_via IS NULL OR oversight_set_via IN ('default', 'manual'));

-- set_level_reason is required whenever set_level is present (D-562).
-- Enforced at both layers: MCP validation + this constraint.
ALTER TABLE public.delivery_cycles
    DROP CONSTRAINT IF EXISTS delivery_cycles_set_level_reason_check;
ALTER TABLE public.delivery_cycles
    ADD CONSTRAINT delivery_cycles_set_level_reason_check
    CHECK (set_level IS NULL OR (set_level_reason IS NOT NULL AND length(trim(set_level_reason)) > 0));

COMMENT ON COLUMN public.delivery_cycles.baseline_level IS
    'Computed governance level cached from initiative_sizing via derive_baseline '
    '(D-558, single source of truth in delivery-cycle-mcp lib/governance-derivation.js). '
    'NULL = unsized. Recomputed on sizing upsert, DCS reassignment, and trusted_dcs change.';

COMMENT ON COLUMN public.delivery_cycles.set_level IS
    'Leadership-set governance level (D-562). Effective level = COALESCE(set_level, baseline_level). '
    'set_level_reason required whenever set.';

COMMENT ON COLUMN public.delivery_cycles.oversight_user_id IS
    'Per-Initiative approver override (D-561). Consumed by approver resolution in G2. '
    'Clearing requires a note (clear_oversight MCP tool).';

-- D-559 — per-user global trust flag, anchored on the DCS.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS trusted_dcs boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.trusted_dcs IS
    'D-559 — global trust flag for this user acting as assigned DCS. Feeds the '
    'Level 1 vs Level 2 branch of derive_baseline. Set via set_trusted_dcs MCP '
    'tool (admin/Phil JWT); every change is activity-logged.';

COMMIT;
