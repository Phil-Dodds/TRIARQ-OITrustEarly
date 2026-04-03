-- 023_create_jira_links.sql
-- Pathways OI Trust — Build C
-- Jira epic link records for bidirectional sync (D-67, D-117, ARCH-16).
-- A single cycle may link to multiple Jira epics. One row per epic.
-- delivery_cycles.jira_epic_key holds the primary epic key for convenience.
-- Five governance fields are read/written via sync_jira_epic:
--   1. Outcome Statement
--   2. Context Brief Link
--   3. Tier Classification
--   4. Capabilities Equation Mapping
--   5. Technical Specification status
-- If Jira credentials are not configured, sync_jira_epic returns a graceful stub response.
-- Must run after: 017_create_delivery_cycles.sql

CREATE TABLE IF NOT EXISTS public.jira_links (
    jira_link_id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_cycle_id   uuid        NOT NULL REFERENCES public.delivery_cycles(delivery_cycle_id) ON DELETE RESTRICT,
    jira_epic_key       text        NOT NULL,
    jira_project_key    text        NOT NULL,
    sync_status         text        NOT NULL DEFAULT 'unsynced'
                                    CHECK (sync_status IN ('unsynced', 'synced', 'error')),
    last_synced_at      timestamptz,
    last_sync_error     text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz,
    UNIQUE (delivery_cycle_id, jira_epic_key)
);

CREATE TRIGGER jira_links_set_updated_at
    BEFORE UPDATE ON public.jira_links
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_jira_links_cycle
    ON public.jira_links (delivery_cycle_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_jira_links_epic_key
    ON public.jira_links (jira_epic_key)
    WHERE deleted_at IS NULL;

COMMENT ON TABLE public.jira_links IS
    'Jira epic links for a Delivery Cycle. One row per epic — a cycle may link to multiple epics (D-67). '
    'OI Trust is the system of record; Jira fields are updated from here, not the reverse (D-117). '
    'Five governance fields synced bidirectionally via sync_jira_epic MCP tool (ARCH-16). '
    'If JIRA_BASE_URL, JIRA_API_TOKEN, JIRA_USER_EMAIL are not set, sync_jira_epic returns a graceful stub. '
    'Source: D-67, D-117, ARCH-16.';

COMMENT ON COLUMN public.jira_links.jira_epic_key IS
    'Jira epic key in project-number format (e.g. PS-2025-042). '
    'Unique per cycle — a cycle cannot link to the same epic twice.';

COMMENT ON COLUMN public.jira_links.sync_status IS
    'unsynced: link created but no sync attempted. '
    'synced: last sync_jira_epic call succeeded — five governance fields current. '
    'error: last sync attempt failed — see last_sync_error for details.';

COMMENT ON COLUMN public.jira_links.last_sync_error IS
    'Error message from the most recent failed sync attempt. '
    'Cleared on next successful sync. Displayed in Jira sync panel on cycle detail view.';
