-- 016_create_workstream_members.sql
-- Pathways OI Trust — Build C
-- Associates users with Delivery Workstreams. Membership is informational at launch —
-- gate approver resolution uses Division-level configuration (D-65, ARCH-23).
-- Must run after: 015_create_delivery_workstreams.sql, 001_create_users.sql

CREATE TABLE IF NOT EXISTS public.workstream_members (
    workstream_member_id  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    workstream_id         uuid        NOT NULL REFERENCES public.delivery_workstreams(workstream_id) ON DELETE RESTRICT,
    member_user_id        uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now(),
    deleted_at            timestamptz,
    UNIQUE (workstream_id, member_user_id)
);

CREATE TRIGGER workstream_members_set_updated_at
    BEFORE UPDATE ON public.workstream_members
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_workstream_members_workstream
    ON public.workstream_members (workstream_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_workstream_members_user
    ON public.workstream_members (member_user_id)
    WHERE deleted_at IS NULL;

COMMENT ON TABLE public.workstream_members IS
    'Membership association between users and Delivery Workstreams. '
    'Informational at launch — gate approver resolution uses Division-level RACI config (D-65, Build B). '
    'Source: ARCH-23.';

COMMENT ON COLUMN public.workstream_members.member_user_id IS
    'Member of this Workstream. The Workstream lead is stored separately on '
    'delivery_workstreams.workstream_lead_user_id and is not required to also appear here.';
