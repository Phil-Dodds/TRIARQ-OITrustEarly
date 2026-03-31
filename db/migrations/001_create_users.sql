-- 001_create_users.sql
-- Pathways OI Trust — Build A
-- System-level user records. users.id must match the corresponding Supabase Auth user id.
-- RLS is disabled. Access control is enforced entirely in the MCP layer.
-- Must run before: all other tables (many FK to users.id)

CREATE TABLE IF NOT EXISTS public.users (
    id                                    uuid        PRIMARY KEY,
    email                                 text        NOT NULL UNIQUE,
    display_name                          text        NOT NULL,
    system_role                           text        NOT NULL
                                                      CHECK (system_role IN ('phil', 'ds', 'cb', 'ce', 'admin')),
    allow_both_admin_and_functional_roles boolean     NOT NULL DEFAULT false,
    is_active                             boolean     NOT NULL DEFAULT true,
    created_at                            timestamptz NOT NULL DEFAULT now(),
    updated_at                            timestamptz NOT NULL DEFAULT now(),
    deleted_at                            timestamptz
);

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.users IS
    'System-level user records. id must match Supabase Auth user id. '
    'Managed via division-mcp create_user and update_user tools.';

COMMENT ON COLUMN public.users.allow_both_admin_and_functional_roles IS
    'HITRUST separation of duties override. Default false. '
    'Phil is seeded as true (D-139). Only System Admin can set this.';
