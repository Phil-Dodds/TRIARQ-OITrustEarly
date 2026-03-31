-- 011_create_approval_workflows.sql
-- Pathways OI Trust — Build A
-- One workflow instance per artifact review event.
-- The Accountable party (raci_role = 'A') makes the binding decision.
-- Full RACI wiring occurs in Build B. Build A: workflow rows created for
-- batch approval (seed_review → candidate transition).
-- Must run after: 001_create_users.sql, 007_create_artifacts.sql

CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id         uuid        NOT NULL REFERENCES public.artifacts(id) ON DELETE RESTRICT,
    workflow_type       text        NOT NULL,
    workflow_status     text        NOT NULL DEFAULT 'open'
                                    CHECK (workflow_status IN ('open', 'approved', 'declined', 'cancelled')),
    accountable_user_id uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    decided_at          timestamptz,
    decision_note       text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);

CREATE TRIGGER approval_workflows_set_updated_at
    BEFORE UPDATE ON public.approval_workflows
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.approval_workflows IS
    'One workflow instance per artifact review. workflow_type examples: '
    'oilibrary_submission, gate_review, seed_batch_approval. '
    'accountable_user_id is the single A in RACI — their decision is binding (D-131).';

COMMENT ON COLUMN public.approval_workflows.workflow_type IS
    'Workflow type label. Build A uses: seed_batch_approval. '
    'Full type registry locked in Build B.';
