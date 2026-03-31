-- 002_create_divisions.sql
-- Pathways OI Trust — Build A
-- Universal container primitive. Every container at every level is a Division.
-- Root Trusts have parent_division_id = NULL and division_level = 0.
-- Access propagates downward only — never upward (D-134, D-135).
-- Must run after: 001_create_users.sql

CREATE TABLE IF NOT EXISTS public.divisions (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_division_id  uuid        REFERENCES public.divisions(id) ON DELETE RESTRICT,
    division_name       text        NOT NULL,
    division_level      integer     NOT NULL,
    division_type_label text,
    owner_user_id       uuid        REFERENCES public.users(id) ON DELETE RESTRICT,
    created_by          uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);

CREATE TRIGGER divisions_set_updated_at
    BEFORE UPDATE ON public.divisions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.divisions IS
    'Universal container primitive (D-134). Root Trusts: parent_division_id IS NULL, '
    'division_level = 0. Child Divisions: division_level increments per level. '
    'Nine top-level Trusts seeded via Admin UI in Build A acceptance demo.';

COMMENT ON COLUMN public.divisions.division_type_label IS
    'UI display label — interim pending Mike (D-134). '
    'Examples: Trust / Service Line Division / Function Division.';

COMMENT ON COLUMN public.divisions.owner_user_id IS
    'Division Owner. NOT automatically the OI Library approver — those are wired in approval_workflows.';
