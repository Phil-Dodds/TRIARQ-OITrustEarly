-- 066_sprint_calendars.sql
-- Pathways OI Trust — Contract 37 (D-549/D-550/D-551, RLS per D-547/Rule 38)
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- Sprint calendar entities (D-549), per-Division calendar assignment (D-550),
-- and gate date rule metadata on cycle_milestone_dates (D-551).
--
-- D-551: the resolved target_date column on cycle_milestone_dates is UNCHANGED
-- and remains the canonical gate target. Rule columns are derivation metadata
-- only — every existing consumer (D-537 overdue, D-521 needs-review, dashboard,
-- slip logic) reads dates exactly as before.
--
-- Naming deviations from spec v1.0 SQL (recorded as CC-37 decisions):
--   name      → calendar_name  (S-003 — no bare generic nouns in schema)
--   is_active → active_status  (S-032 schema form; matches divisions)
--   deleted_at added to both tables (Arch-6 soft delete only); the spec's
--   UNIQUE (calendar_id, sprint_id) becomes a partial unique index so a
--   soft-deleted sprint_id can be re-added.
--
-- Must run after: 065_rls_team_meetings_tables.sql

-- ── Sprint calendars (D-549) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sprint_calendars (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_name  text        NOT NULL UNIQUE,      -- e.g. 'TRIARQ Standard 2026'
    active_status  boolean     NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz
);

CREATE TRIGGER sprint_calendars_set_updated_at
    BEFORE UPDATE ON public.sprint_calendars
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.sprints (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id  uuid        NOT NULL REFERENCES public.sprint_calendars(id) ON DELETE CASCADE,
    -- TEXT, never numeric: '2026.10' keeps its trailing zero (D-549).
    -- Sort by start_date, never by sprint_id.
    sprint_id    text        NOT NULL,
    start_date   date        NOT NULL,
    end_date     date        NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CHECK (end_date > start_date)
);

CREATE TRIGGER sprints_set_updated_at
    BEFORE UPDATE ON public.sprints
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Partial unique replaces the spec's table constraint so soft-deleted rows
-- (Arch-6) do not block re-adding the same sprint_id.
CREATE UNIQUE INDEX idx_sprints_calendar_sprint_id
    ON public.sprints (calendar_id, sprint_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_sprints_calendar_start
    ON public.sprints (calendar_id, start_date)
    WHERE deleted_at IS NULL;

-- D-547 / Rule 38: RLS enabled with ZERO policies in the same CREATE TABLE
-- migration. Deny-all from the public API; MCP servers use the service-role
-- key which bypasses RLS (Arch-1) — the application is unaffected.
ALTER TABLE public.sprint_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints          ENABLE ROW LEVEL SECURITY;

-- ── Per-Division calendar assignment (D-550) ────────────────────────────────

-- Effective calendar = ancestor walk (self → parent → … → root), first
-- non-null sprint_calendar_id wins. sprint_calendar_none = true is the
-- explicit opt-out (spec §4.3, implementation choice: dedicated boolean, not
-- a sentinel row): it truncates the walk — the division and its inheriting
-- descendants resolve to NO calendar and sprint/relative modes are hidden.
ALTER TABLE public.divisions
    ADD COLUMN sprint_calendar_id uuid NULL REFERENCES public.sprint_calendars(id),
    ADD COLUMN sprint_calendar_none boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.divisions.sprint_calendar_id IS
    'D-550: direct sprint calendar assignment. NULL = inherit from nearest ancestor. '
    'Reassignment never moves gate dates — rules are flagged stale instead (D-552).';

COMMENT ON COLUMN public.divisions.sprint_calendar_none IS
    'D-550 explicit opt-out (spec 4.3). TRUE truncates the ancestor walk: this division '
    'and its inheriting descendants resolve to no calendar; Date mode only in editors. '
    'When TRUE, sprint_calendar_id is ignored.';

-- ── Gate date rule metadata (D-551) ─────────────────────────────────────────

-- target = anchor + (X sprints) + (Z days). Rules are metadata; the resolved
-- date in target_date stays canonical. Actual dates are never rule-driven.
ALTER TABLE public.cycle_milestone_dates
    ADD COLUMN date_rule_type text NOT NULL DEFAULT 'manual'
        CHECK (date_rule_type IN ('manual', 'sprint', 'relative')),
    ADD COLUMN rule_sprint_id text NULL,
    ADD COLUMN rule_anchor text NULL
        CHECK (rule_anchor IN ('start', 'end')),
    ADD COLUMN rule_sprint_count integer NULL,
    ADD COLUMN rule_day_offset integer NULL,
    ADD COLUMN rule_stale boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.cycle_milestone_dates.date_rule_type IS
    'D-551: how target_date was derived. manual = date picker (default, today''s behavior). '
    'sprint = rule_sprint_id + rule_anchor + rule_day_offset. '
    'relative = prior gate''s TARGET + rule_sprint_count sprints + rule_day_offset days. '
    'target_date remains canonical — rules are derivation metadata only. '
    'Clearing a target date (D-501) also clears its rule.';

COMMENT ON COLUMN public.cycle_milestone_dates.rule_stale IS
    'D-552 6.5: set when the effective calendar no longer resolves the rule '
    '(division reassigned, initiative moved, sprint deleted). The resolved date HOLDS — '
    'dates never move on reassignment. Next edit rebuilds or converts the rule.';

COMMENT ON TABLE public.sprint_calendars IS
    'D-549: named sprint calendars. Admin-managed, assigned per Division (D-550). '
    'No derived offset columns — offsets live on gate date rules (D-551). MCP-only; RLS deny-all.';

COMMENT ON TABLE public.sprints IS
    'D-549: sprint rows per calendar. sprint_id is TEXT end-to-end (''2026.10'' keeps its zero). '
    'Order by start_date, never by sprint_id. MCP-only; RLS deny-all.';
