-- 007_create_artifacts.sql
-- Pathways OI Trust — Build A
-- Core OI Library record. Represents a document, policy, SOP, or any typed
-- knowledge artifact. Lifecycle transitions are enforced in document-access-mcp.
-- Must run after: 001–006 migrations

CREATE TABLE IF NOT EXISTS public.artifacts (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_type_id uuid        NOT NULL REFERENCES public.artifact_types(id) ON DELETE RESTRICT,
    artifact_title   text        NOT NULL,
    artifact_content text,
    division_id      uuid        NOT NULL REFERENCES public.divisions(id) ON DELETE RESTRICT,
    folder_id        uuid        REFERENCES public.folders(id) ON DELETE RESTRICT,
    lifecycle_status text        NOT NULL DEFAULT 'draft'
                                 CHECK (lifecycle_status IN
                                     ('draft', 'seed_review', 'candidate', 'canon', 'superseded', 'archived')),
    submitted_by     uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    submitted_at     timestamptz NOT NULL DEFAULT now(),
    superseded_by    uuid        REFERENCES public.artifacts(id) ON DELETE RESTRICT,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz
);

CREATE TRIGGER artifacts_set_updated_at
    BEFORE UPDATE ON public.artifacts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.artifacts IS
    'OI Library knowledge artifacts. Lifecycle: draft → seed_review → candidate → canon → superseded/archived. '
    'canon transition triggers document_embeddings generation via Vertex AI (Build B). '
    'Build A: seed_review → candidate transition triggers embedding row creation placeholder.';

COMMENT ON COLUMN public.artifacts.artifact_content IS
    'Text content for markdown and plain text artifacts. '
    'NULL for file-based artifacts — content accessed via document_files through artifact_versions.';

COMMENT ON COLUMN public.artifacts.lifecycle_status IS
    'Managed by document-access-mcp. Bulk seed arrives at seed_review. '
    'Batch approval transitions seed_review → candidate. '
    'candidate → canon requires approval_workflow (wired Build B).';

COMMENT ON COLUMN public.artifacts.superseded_by IS
    'Points to the artifact that replaces this one. '
    'When set, lifecycle_status should also be superseded.';
