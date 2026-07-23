-- 083_gate_event_tables.sql
-- Pathways OI Trust — Contract G1 (governance redesign schema foundation)
-- Primitive 4 — Gate events (D-557, D-565, D-569).
-- Three tables: gate_approvals (N-approval collection), gate_conditions,
-- gate_thread_messages. gate_records.approver_user_id (D-463) stays — it
-- remains the resolved assigned approver at Levels 2/3 and NULL at Level 1.
-- Existing single-approval flows are untouched in G1; dual-write of an
-- 'assigned' gate_approvals row begins in G2.
-- ⚠ Do NOT execute via Code. Phil executes against Supabase.
-- Must run after: 019_create_gate_records.sql, 046_gate_consultations.sql

BEGIN;

-- ── gate_approvals — N-approval collection (D-557 L1, co-signs, D-569) ───────
-- Append-only like cycle_event_log: rows are never updated or deleted (a
-- cleared approval on gate return is a G5 semantic — G1 creates structure only).
-- No updated_at, per cycle_event_log precedent.
CREATE TABLE IF NOT EXISTS public.gate_approvals (
    approval_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gate_record_id   uuid NOT NULL REFERENCES public.gate_records(gate_record_id) ON DELETE CASCADE,
    approver_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    approval_type    text NOT NULL CHECK (approval_type IN ('assigned','trio_member','ie_override','condition_cosign')),
    -- D-569 marker: approval recorded over a returned consultation.
    over_returned_consultation boolean NOT NULL DEFAULT false,
    reason_note      text NULL,
    -- reason_note required when approval_type='ie_override' or
    -- over_returned_consultation=true — enforced in the MCP layer
    -- (record_gate_approval), per spec Section 2.4.
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_gate_approvals_gate_record
    ON public.gate_approvals (gate_record_id, created_at ASC);
CREATE INDEX idx_gate_approvals_approver
    ON public.gate_approvals (approver_user_id);

ALTER TABLE public.gate_approvals ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.gate_approvals IS
    'Contract G1 (D-557/D-569) — approval collection per gate record. Supports '
    'N approvals per gate (Level 1 trio + consulted consensus, condition '
    'co-signs, IE overrides). Append-only. Existing flows dual-write from G2.';

-- ── gate_conditions — approver conditions (D-565) ────────────────────────────
-- CC-G1: spec column "status" renamed condition_status (S-003 — no bare
-- generic nouns in schema identifiers).
CREATE TABLE IF NOT EXISTS public.gate_conditions (
    condition_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gate_record_id         uuid NOT NULL REFERENCES public.gate_records(gate_record_id) ON DELETE CASCADE,
    condition_type         text NOT NULL CHECK (condition_type IN ('general','consultation_required')),
    condition_text         text NOT NULL,
    target_consultation_id uuid NULL REFERENCES public.gate_consultations(id) ON DELETE SET NULL,
    condition_status       text NOT NULL DEFAULT 'open' CHECK (condition_status IN ('open','resolved')),
    set_by_user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now(),
    resolved_at            timestamptz NULL,
    resolved_by_user_id    uuid NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    resolution_note        text NULL
);

CREATE TRIGGER gate_conditions_set_updated_at
    BEFORE UPDATE ON public.gate_conditions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_gate_conditions_gate_record
    ON public.gate_conditions (gate_record_id) WHERE condition_status = 'open';

ALTER TABLE public.gate_conditions ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN public.gate_conditions.target_consultation_id IS
    'Set when condition_type=consultation_required — the gate_consultations row '
    'whose approval auto-resolves this condition (waiting-on wiring lands in G6).';

-- ── gate_thread_messages — gate thread (D-565) ───────────────────────────────
-- Append-only: messages are never edited or deleted. No updated_at, per
-- cycle_event_log precedent.
CREATE TABLE IF NOT EXISTS public.gate_thread_messages (
    message_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gate_record_id uuid NOT NULL REFERENCES public.gate_records(gate_record_id) ON DELETE CASCADE,
    user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    message_text   text NOT NULL,
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_gate_thread_messages_gate_record
    ON public.gate_thread_messages (gate_record_id, created_at ASC);

ALTER TABLE public.gate_thread_messages ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.gate_thread_messages IS
    'Contract G1 (D-565) — chronological gate thread. Submission note becomes '
    'the opening message from G6. Append-only; ordered created_at ASC.';

COMMIT;
