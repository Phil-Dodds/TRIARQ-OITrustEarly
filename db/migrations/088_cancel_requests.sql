-- 088_cancel_requests.sql
-- Pathways OI Trust — Contract G10 (governance redesign, D-566)
-- Request-cancel: the trio retains initiation at every level; the request
-- (reason required) routes to the cancel authority (L1: any trio member;
-- L2/L3: the resolved approver). The IE release valve applies to stuck
-- requests as to any stuck decision.
-- ⚠ Do NOT execute via Code. Phil executes (preview env only until GEnd).
-- Must run after: 082_participation_tables.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.cancel_requests (
    request_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_cycle_id    uuid NOT NULL REFERENCES public.delivery_cycles(delivery_cycle_id) ON DELETE CASCADE,
    requested_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    reason               text NOT NULL,
    authority_user_id    uuid NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    request_status       text NOT NULL DEFAULT 'open'
                         CHECK (request_status IN ('open', 'executed', 'declined')),
    resolved_by_user_id  uuid NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    resolution_note      text NULL,
    resolved_at          timestamptz NULL,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER cancel_requests_set_updated_at
    BEFORE UPDATE ON public.cancel_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_cancel_requests_open
    ON public.cancel_requests (delivery_cycle_id) WHERE request_status = 'open';
CREATE INDEX idx_cancel_requests_authority
    ON public.cancel_requests (authority_user_id) WHERE request_status = 'open';

ALTER TABLE public.cancel_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.cancel_requests IS
    'Contract G10 (D-566) — trio-initiated cancel requests routed to the '
    'cancel authority. authority_user_id NULL = trio-level authority (L1 / '
    'pre-Brief-Review). request_status: open → executed | declined.';

COMMIT;
