-- 086_initiative_executive.sql
-- Pathways OI Trust — Contract G8 (governance redesign, D-560)
-- Initiative Executive role storage. Granted/revoked by Phil only (D-464
-- posture — enforced in the MCP setter); grants are activity-logged.
-- Phil is the first Initiative Executive by definition (D-560 subsumes D-465),
-- but is_super_admin already carries every IE capability — no seed needed.
-- ⚠ Do NOT execute via Code. Phil executes (preview env only until GEnd).
-- Must run after: 081_governance_level_columns.sql

BEGIN;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS is_initiative_executive boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.is_initiative_executive IS
    'D-560 — Initiative Executive: may loudly override any non-board gate '
    '(ie_override, reason required), sees the All Pending Gates view, joins '
    'the leadership set for approver resolution and level/oversight controls. '
    'Set via set_initiative_executive MCP tool — Phil (is_super_admin) only.';

COMMIT;
