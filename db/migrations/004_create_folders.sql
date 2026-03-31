-- 004_create_folders.sql
-- Pathways OI Trust — Build A
-- OI Library folder hierarchy. Folders are scoped to a Division.
-- Self-referencing for nested folder trees within a Division.
-- Must run after: 001_create_users.sql, 002_create_divisions.sql

CREATE TABLE IF NOT EXISTS public.folders (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id      uuid        NOT NULL REFERENCES public.divisions(id) ON DELETE RESTRICT,
    parent_folder_id uuid        REFERENCES public.folders(id) ON DELETE RESTRICT,
    folder_name      text        NOT NULL,
    created_by       uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz
);

CREATE TRIGGER folders_set_updated_at
    BEFORE UPDATE ON public.folders
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.folders IS
    'OI Library folder tree scoped to a Division. '
    'parent_folder_id IS NULL = top-level folder within the Division. '
    'Used in directory import (bulk seed) to map ZIP folder structure (D-146).';
