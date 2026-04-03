-- 022_create_cycle_artifacts.sql
-- Pathways OI Trust — Build C
-- Attachment records linking artifacts (external URLs or OI Library entries) to a cycle.
-- artifact_type_id = NULL indicates an ad hoc attachment (user provides display_name).
-- pointer_status tracks the MSO365 → OI Library promotion lifecycle (Session 2026-03-25-G):
--   external_only: artifact lives at external_url only
--   promoted: artifact has been submitted to OI Library — both external_url and oi_library_artifact_id set
--   oi_only: external_url no longer relevant; artifact lives in OI Library
-- Slot enforcement is dormant at launch — no required-field blocking (Session 2026-03-25-C).
-- Must run after: 017_create_delivery_cycles.sql, 021_create_cycle_artifact_types.sql,
--                 007_create_artifacts.sql, 001_create_users.sql

CREATE TABLE IF NOT EXISTS public.cycle_artifacts (
    cycle_artifact_id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_cycle_id        uuid        NOT NULL REFERENCES public.delivery_cycles(delivery_cycle_id) ON DELETE RESTRICT,
    artifact_type_id         uuid        REFERENCES public.cycle_artifact_types(artifact_type_id) ON DELETE RESTRICT,
    display_name             text        NOT NULL,
    external_url             text,
    oi_library_artifact_id   uuid        REFERENCES public.artifacts(id) ON DELETE RESTRICT,
    pointer_status           text        NOT NULL DEFAULT 'external_only'
                                         CHECK (pointer_status IN ('external_only', 'promoted', 'oi_only')),
    attached_by_user_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    attached_at              timestamptz NOT NULL DEFAULT now(),
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    deleted_at               timestamptz
);

CREATE TRIGGER cycle_artifacts_set_updated_at
    BEFORE UPDATE ON public.cycle_artifacts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_cycle_artifacts_cycle
    ON public.cycle_artifacts (delivery_cycle_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_cycle_artifacts_artifact_type
    ON public.cycle_artifacts (artifact_type_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_cycle_artifacts_oi_library
    ON public.cycle_artifacts (oi_library_artifact_id)
    WHERE deleted_at IS NULL AND oi_library_artifact_id IS NOT NULL;

COMMENT ON TABLE public.cycle_artifacts IS
    'Artifacts attached to a Delivery Cycle. Two categories: '
    '(1) Typed slots: artifact_type_id references a seed row in cycle_artifact_types. '
    '(2) Ad hoc: artifact_type_id IS NULL — user provides display_name. '
    'Artifacts live on the cycle until Build Report canonization (D-113). '
    'OI Library promotion is stubbed in Build C — fully wired in Build B. '
    'Source: ARCH-24, Session 2026-03-25-B, Session 2026-03-25-G.';

COMMENT ON COLUMN public.cycle_artifacts.pointer_status IS
    'MSO365 → OI Library promotion state (Session 2026-03-25-G): '
    'external_only = artifact lives at external_url only (initial state). '
    'promoted = submitted to OI Library; both external_url and oi_library_artifact_id are set. '
    'oi_only = external URL no longer relevant; oi_library_artifact_id is the canonical reference. '
    'Transitions managed by promote_artifact_to_oi_library MCP tool (stubbed Build C, wired Build B).';

COMMENT ON COLUMN public.cycle_artifacts.external_url IS
    'MSO365 SharePoint link or other external URL. '
    'Preserved on OI Library promotion — external_url is never cleared when pointer_status changes.';

COMMENT ON COLUMN public.cycle_artifacts.artifact_type_id IS
    'NULL for ad hoc attachments. When set, references a system-defined slot type. '
    'Multiple attachments of the same type are permitted — no uniqueness constraint. '
    'Slot enforcement is dormant at launch (Session 2026-03-25-C).';
