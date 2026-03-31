-- 003_create_division_memberships.sql
-- Pathways OI Trust — Build A
-- Tracks which users are assigned to which Divisions.
-- revoked_at = NULL means the membership is currently active.
-- The unique index enforces one active membership per user per Division.
-- Must run after: 001_create_users.sql, 002_create_divisions.sql

CREATE TABLE IF NOT EXISTS public.division_memberships (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    division_id uuid        NOT NULL REFERENCES public.divisions(id) ON DELETE RESTRICT,
    assigned_by uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    revoked_at  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

-- One active membership per user per Division — partial unique index
CREATE UNIQUE INDEX division_memberships_active_unique
    ON public.division_memberships (user_id, division_id)
    WHERE revoked_at IS NULL;

CREATE TRIGGER division_memberships_set_updated_at
    BEFORE UPDATE ON public.division_memberships
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.division_memberships IS
    'User-to-Division assignments. revoked_at IS NULL = active membership. '
    'Managed via division-mcp assign_user_to_division and revoke_division_membership tools.';

COMMENT ON COLUMN public.division_memberships.revoked_at IS
    'Soft revocation timestamp. Set by division-mcp revoke_division_membership. '
    'Never delete rows — keeps audit trail of all historical assignments.';
