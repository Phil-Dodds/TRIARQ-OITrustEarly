-- 012_create_approval_participants.sql
-- Pathways OI Trust — Build A
-- One row per participant per workflow. RACI roles: A (Accountable),
-- C (Consulted), I (Informed). Accountable decision is binding.
-- Must run after: 001_create_users.sql, 011_create_approval_workflows.sql

CREATE TABLE IF NOT EXISTS public.approval_participants (
    id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id        uuid        NOT NULL REFERENCES public.approval_workflows(id) ON DELETE RESTRICT,
    user_id            uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    raci_role          text        NOT NULL
                                   CHECK (raci_role IN ('A', 'C', 'I')),
    participant_status text        NOT NULL DEFAULT 'pending'
                                   CHECK (participant_status IN
                                       ('pending', 'approved', 'declined', 'dismissed', 'informed')),
    responded_at       timestamptz,
    response_note      text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    deleted_at         timestamptz
);

CREATE TRIGGER approval_participants_set_updated_at
    BEFORE UPDATE ON public.approval_participants
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.approval_participants IS
    'RACI participants per workflow. A=Accountable (binding), C=Consulted, I=Informed. '
    'Accountable participant corresponds to approval_workflows.accountable_user_id.';

COMMENT ON COLUMN public.approval_participants.participant_status IS
    'pending: awaiting response. approved/declined: explicit decision. '
    'dismissed: workflow closed before response. informed: I role, no action required.';
