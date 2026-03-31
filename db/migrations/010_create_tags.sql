-- 010_create_tags.sql
-- Pathways OI Trust — Build A
-- Tags are scoped to a Division. artifact_tags is the join table.
-- Must run after: 002_create_divisions.sql, 007_create_artifacts.sql

CREATE TABLE IF NOT EXISTS public.tags (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id uuid        NOT NULL REFERENCES public.divisions(id) ON DELETE RESTRICT,
    tag_name    text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

CREATE TRIGGER tags_set_updated_at
    BEFORE UPDATE ON public.tags
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Join table: artifacts to tags. One row per artifact-tag pair.
CREATE TABLE IF NOT EXISTS public.artifact_tags (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id uuid        NOT NULL REFERENCES public.artifacts(id) ON DELETE RESTRICT,
    tag_id      uuid        NOT NULL REFERENCES public.tags(id) ON DELETE RESTRICT,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (artifact_id, tag_id)
);

CREATE TRIGGER artifact_tags_set_updated_at
    BEFORE UPDATE ON public.artifact_tags
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.tags IS
    'Division-scoped tags. A tag created in Division A cannot be applied '
    'to an artifact in Division B.';
