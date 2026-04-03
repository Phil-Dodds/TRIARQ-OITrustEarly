-- 020_create_cycle_event_log.sql
-- Pathways OI Trust — Build C
-- Append-only chronological audit log for every significant action on a Delivery Cycle (D-125).
-- IMPORTANT: Rows in this table are NEVER updated or deleted — not even soft-deleted.
-- Every stage advance, gate decision, artifact attachment, outcome set, and Jira sync
-- must append a row here via the MCP tool that performs the action.
-- actor_user_id is null for system-generated events.
-- Must run after: 017_create_delivery_cycles.sql, 001_create_users.sql

CREATE TABLE IF NOT EXISTS public.cycle_event_log (
    event_id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_cycle_id uuid        NOT NULL REFERENCES public.delivery_cycles(delivery_cycle_id) ON DELETE RESTRICT,
    event_type        text        NOT NULL,
    event_description text        NOT NULL,
    actor_user_id     uuid        REFERENCES public.users(id) ON DELETE RESTRICT,
    event_metadata    jsonb,
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- No updated_at trigger — this table is append-only (D-125). Rows are never updated.

CREATE INDEX idx_cycle_event_log_cycle
    ON public.cycle_event_log (delivery_cycle_id, created_at ASC);

CREATE INDEX idx_cycle_event_log_event_type
    ON public.cycle_event_log (event_type);

COMMENT ON TABLE public.cycle_event_log IS
    'Append-only audit log for all significant actions on a Delivery Cycle (D-125). '
    'NEVER update or delete rows — not even via soft delete. '
    'Ordered by created_at ascending. Returned by get_cycle_event_log MCP tool. '
    'event_type values include: cycle_created, stage_advanced, gate_submitted, gate_approved, '
    'gate_returned, gate_blocked, artifact_attached, artifact_promoted, outcome_set, jira_synced, '
    'workstream_deactivated. Source: D-125.';

COMMENT ON COLUMN public.cycle_event_log.event_type IS
    'Machine-readable event classifier. MCP tools must use consistent values. '
    'UI may filter or group by event_type in future builds.';

COMMENT ON COLUMN public.cycle_event_log.event_description IS
    'Human-readable summary rendered directly in the event log UI panel. '
    'Must be meaningful without surrounding context — no bare "Updated" or "Changed" entries.';

COMMENT ON COLUMN public.cycle_event_log.event_metadata IS
    'Structured detail for the event. Schema varies by event_type. Examples: '
    'stage_advanced: { prior_stage, new_stage }; '
    'gate_approved: { gate_name, approver_user_id, actual_date }; '
    'artifact_attached: { cycle_artifact_id, display_name, artifact_type_name }; '
    'outcome_set: { prior_value_was_null: true }.';

COMMENT ON COLUMN public.cycle_event_log.actor_user_id IS
    'User who triggered the action. NULL for system-generated events '
    '(e.g. automatic stage advance triggered by gate approval).';
