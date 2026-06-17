-- 042_cycle_artifacts_gate_affinity.sql
-- Pathways OI Trust — Contract 25 Part 2 follow-on (ad-hoc attach fix)
--
-- Why this migration:
--   The "+ Attach Document" button at the bottom of each Zone 6 gate group
--   lets a user attach an artifact (title + URL) without selecting a seeded
--   artifact type. Today the attachment is recorded with
--   cycle_artifacts.artifact_type_id = NULL, but the Initiative Detail view
--   never renders it — rebuildArtifactsByGate iterates seeded types and
--   merges in matching attachments by type id, so null-type attachments are
--   orphaned. This migration adds gate_affinity so ad-hoc attachments can
--   carry the gate group they were added under, and Zone 6 can append them
--   to that group's slot list.
--
-- Column:
--   gate_affinity text NULL — gate name when the attachment is ad-hoc;
--   NULL when the attachment is bound to a seeded artifact type (the type's
--   primary_gate determines its rendering group). 'unscheduled' is allowed
--   for ad-hocs attached from the Unscheduled gate group.
--
-- Source: Contract 25 Part 2 in-session follow-on, 2026-06-16.
--
-- ⚠ Do NOT execute via Code per Rule 21. Phil executes against Supabase.

BEGIN;

-- ── Step 1: Add nullable gate_affinity column ────────────────────────────
ALTER TABLE public.cycle_artifacts
    ADD COLUMN IF NOT EXISTS gate_affinity text;

-- ── Step 2: CHECK constraint ─────────────────────────────────────────────
ALTER TABLE public.cycle_artifacts
    DROP CONSTRAINT IF EXISTS cycle_artifacts_gate_affinity_check;
ALTER TABLE public.cycle_artifacts
    ADD CONSTRAINT cycle_artifacts_gate_affinity_check
    CHECK (gate_affinity IS NULL OR gate_affinity IN (
        'brief_review',
        'go_to_build',
        'go_to_deploy',
        'go_to_release',
        'close_review',
        'unscheduled'
    ));

COMMENT ON COLUMN public.cycle_artifacts.gate_affinity IS
    'Contract 25 Part 2: gate group an ad-hoc attachment was added under. '
    'NULL for type-bound attachments (artifact_type_id is set — render via '
    'cycle_artifact_types.primary_gate). One of '
    'brief_review/go_to_build/go_to_deploy/go_to_release/close_review or '
    '''unscheduled'' for ad-hoc attaches.';

COMMIT;

-- ── Verification queries (run separately) ────────────────────────────────
-- 1. Column present:
--    SELECT column_name, data_type, is_nullable FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='cycle_artifacts' AND column_name='gate_affinity';
--
-- 2. CHECK constraint registered:
--    SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conname='cycle_artifacts_gate_affinity_check';
--
-- 3. Existing rows unaffected (gate_affinity should be NULL on all pre-migration rows):
--    SELECT gate_affinity, count(*) FROM public.cycle_artifacts GROUP BY 1;
