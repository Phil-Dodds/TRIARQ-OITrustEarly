-- 008_create_artifact_versions.sql
-- Pathways OI Trust — Build A
-- Immutable version history for artifacts. Every change to artifact content
-- or file creates a new version record. Version numbers start at 1.
-- Must run after: 001_create_users.sql, 006_create_document_files.sql,
--                 007_create_artifacts.sql

CREATE TABLE IF NOT EXISTS public.artifact_versions (
    id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id               uuid        NOT NULL REFERENCES public.artifacts(id) ON DELETE RESTRICT,
    version_number            integer     NOT NULL,
    artifact_content_snapshot text,
    file_id                   uuid        REFERENCES public.document_files(id) ON DELETE RESTRICT,
    created_by                uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at                timestamptz NOT NULL DEFAULT now(),
    change_note               text,
    updated_at                timestamptz NOT NULL DEFAULT now(),
    deleted_at                timestamptz,
    UNIQUE (artifact_id, version_number)
);

CREATE TRIGGER artifact_versions_set_updated_at
    BEFORE UPDATE ON public.artifact_versions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.artifact_versions IS
    'Append-only version history. version_number starts at 1 and increments per artifact. '
    'artifact_content_snapshot: used for text artifacts. '
    'file_id: used for file-based artifacts — FK to document_files.';

COMMENT ON COLUMN public.artifact_versions.artifact_content_snapshot IS
    'Point-in-time snapshot of text content at this version. '
    'NULL for file-based artifacts.';
