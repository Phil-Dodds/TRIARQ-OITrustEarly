-- 005_create_artifact_types.sql
-- Pathways OI Trust — Build A
-- Defines the 13 seeded system artifact types plus any admin-defined types.
-- is_system_type = true means the type has hardcoded workflow logic and a handler.
-- Must run after: 001_create_users.sql
-- Seeded values: see db/seeds/002_seed_artifact_types.sql

CREATE TABLE IF NOT EXISTS public.artifact_types (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    type_name        text        NOT NULL UNIQUE,
    type_description text,
    is_system_type   boolean     NOT NULL DEFAULT false,
    workflow_handler text,
    default_scope    text        CHECK (default_scope IN ('system', 'trust', 'division')),
    created_by       uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz
);

CREATE TRIGGER artifact_types_set_updated_at
    BEFORE UPDATE ON public.artifact_types
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.artifact_types IS
    '13 seeded system types (D-145) plus admin-defined types. '
    'System types have workflow_handler references for coded workflow logic. '
    'Admin-defined types have workflow_handler IS NULL.';

COMMENT ON COLUMN public.artifact_types.workflow_handler IS
    'Reference to application handler code for system types. '
    'NULL for admin-defined types. Format TBD at Build B wiring.';
