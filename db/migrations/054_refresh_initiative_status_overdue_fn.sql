-- 054_refresh_initiative_status_overdue_fn.sql
-- Pathways OI Trust — Contract 32 (Initiative Status Updates)
-- Governing decisions: D-481, D-482
-- Must run after: 049_division_status_config.sql, 050_initiative_status_updates.sql,
--                 052_delivery_cycles_status_columns.sql, 053_system_config_status_refresh.sql
--
-- Why this migration:
--   D-482 — overdue detection. A pg_cron job runs every 30 minutes; per active
--   Initiative it resolves cadence (D-481 upward Division-chain walk), computes
--   the next meeting date, sets status_due_at / status_overdue, and stamps
--   status_last_calculated_at. system_config.status_refresh_last_run is bumped
--   after each run. trigger_status_refresh (MCP) invokes the same function on
--   demand via RPC.
--
-- CC-32 note: the existing Division inheritance helper (getAccessibleDivisionIds,
--   document-access-mcp) walks DOWNWARD to descendants for access scoping.
--   Cadence inheritance (D-481) walks UPWARD via parent_division_id to the
--   nearest ancestor with a config — a different traversal, implemented here as
--   resolve_division_status_config(). No existing SQL helper covered this.
--
-- This is the FIRST pg_cron job in the system. Requires the pg_cron extension
--   (Supabase: Database → Extensions → enable pg_cron, or run the CREATE
--   EXTENSION below if your role permits). Section 3 of this file registers the
--   schedule idempotently.
--
-- ⚠ Do NOT execute via Code per Rule 22. Phil executes against Supabase.

BEGIN;

-- ── Section 1: nth-weekday-of-month helper ───────────────────────────────
-- Returns the date of the Nth (or last) p_dow weekday within p_month's month.
-- p_dow: 0=Sunday .. 6=Saturday (matches PostgreSQL EXTRACT(DOW ...)).
CREATE OR REPLACE FUNCTION public.nth_weekday_of_month(
  p_month       date,
  p_dow         integer,
  p_occurrence  text
)
RETURNS date
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_first  date := date_trunc('month', p_month)::date;
  v_last   date := (date_trunc('month', p_month) + interval '1 month - 1 day')::date;
  v_offset integer;
  v_n      integer;
BEGIN
  IF p_occurrence = 'last' THEN
    v_offset := (EXTRACT(DOW FROM v_last)::int - p_dow + 7) % 7;
    RETURN v_last - v_offset;
  END IF;

  v_n := CASE p_occurrence
           WHEN 'first'  THEN 1
           WHEN 'second' THEN 2
           WHEN 'third'  THEN 3
           WHEN 'fourth' THEN 4
           ELSE 1
         END;

  v_offset := (p_dow - EXTRACT(DOW FROM v_first)::int + 7) % 7;
  RETURN v_first + v_offset + 7 * (v_n - 1);
END;
$$;

COMMENT ON FUNCTION public.nth_weekday_of_month(date, integer, text) IS
  'Date of the first/second/third/fourth/last p_dow weekday in p_month''s '
  'month. p_dow 0=Sunday..6=Saturday. Used by monthly cadence (D-480/D-482).';

-- ── Section 2: upward Division-chain cadence resolver (D-481) ─────────────
-- Walks parent_division_id from p_division_id to root; returns the nearest
-- ancestor's division_status_config (including the Division itself). NULL row
-- if no config exists anywhere in the chain → Initiative is exempt (D-481).
CREATE OR REPLACE FUNCTION public.resolve_division_status_config(p_division_id uuid)
RETURNS public.division_status_config
LANGUAGE sql STABLE AS $$
  WITH RECURSIVE chain AS (
    SELECT id, parent_division_id, 0 AS depth
    FROM public.divisions
    WHERE id = p_division_id AND deleted_at IS NULL
    UNION ALL
    SELECT d.id, d.parent_division_id, c.depth + 1
    FROM public.divisions d
    JOIN chain c ON d.id = c.parent_division_id
    WHERE d.deleted_at IS NULL
  )
  SELECT cfg.*
  FROM chain
  JOIN public.division_status_config cfg ON cfg.division_id = chain.id
  ORDER BY chain.depth ASC
  LIMIT 1
$$;

COMMENT ON FUNCTION public.resolve_division_status_config(uuid) IS
  'D-481 cadence inheritance. Walks parent_division_id upward; returns nearest '
  'ancestor division_status_config. NULL row when no config in chain (exempt).';

-- ── Section 3: overdue refresh (D-482) ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_initiative_status_overdue()
RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  r_init            RECORD;
  v_cfg             public.division_status_config;
  v_today           date := CURRENT_DATE;
  v_next_meeting    date;
  v_due_at          timestamptz;
  v_overdue         boolean;
  v_latest_saved_at timestamptz;
  v_aligned_anchor  date;
  v_diff            integer;
  v_cycles          integer;
  v_month           date;
  v_candidate       date;
  v_processed       integer := 0;
BEGIN
  FOR r_init IN
    SELECT delivery_cycle_id, division_id, latest_status_update_id
    FROM public.delivery_cycles
    WHERE deleted_at IS NULL
      AND current_lifecycle_stage NOT IN ('COMPLETE', 'CANCELLED')
  LOOP
    v_cfg := public.resolve_division_status_config(r_init.division_id);

    -- D-481: no cadence config in chain → skip entirely (not flagged overdue,
    -- status_due_at / status_last_calculated_at left untouched for this row).
    IF v_cfg.id IS NULL THEN
      CONTINUE;
    END IF;

    -- Compute next meeting date from the recurrence rule.
    IF v_cfg.cadence = 'weekly' THEN
      v_next_meeting := v_today
        + ((v_cfg.day_of_week - EXTRACT(DOW FROM v_today)::int + 7) % 7);

    ELSIF v_cfg.cadence = 'triweekly' THEN
      -- align anchor forward to the configured weekday, then step by 21 days
      v_aligned_anchor := v_cfg.anchor_date
        + ((v_cfg.day_of_week - EXTRACT(DOW FROM v_cfg.anchor_date)::int + 7) % 7);
      IF v_aligned_anchor >= v_today THEN
        v_next_meeting := v_aligned_anchor;
      ELSE
        v_diff   := v_today - v_aligned_anchor;
        v_cycles := CEIL(v_diff::numeric / 21);
        v_next_meeting := v_aligned_anchor + (v_cycles * 21);
      END IF;

    ELSE  -- monthly
      v_month := date_trunc('month', v_today)::date;
      v_candidate := public.nth_weekday_of_month(
        v_month, v_cfg.day_of_week, v_cfg.month_occurrence);
      IF v_candidate < v_today THEN
        v_month := (date_trunc('month', v_today) + interval '1 month')::date;
        v_candidate := public.nth_weekday_of_month(
          v_month, v_cfg.day_of_week, v_cfg.month_occurrence);
      END IF;
      v_next_meeting := v_candidate;
    END IF;

    v_due_at := (v_next_meeting - 1)::timestamptz;

    -- Valid window: a status saved within 2 days before the next meeting.
    IF r_init.latest_status_update_id IS NULL THEN
      v_overdue := true;
    ELSE
      SELECT saved_at INTO v_latest_saved_at
      FROM public.initiative_status_updates
      WHERE id = r_init.latest_status_update_id;
      v_overdue := NOT (v_latest_saved_at >= (v_next_meeting - 2)::timestamptz);
    END IF;

    UPDATE public.delivery_cycles
    SET status_overdue            = v_overdue,
        status_due_at             = v_due_at,
        status_last_calculated_at = now()
    WHERE delivery_cycle_id = r_init.delivery_cycle_id;

    v_processed := v_processed + 1;
  END LOOP;

  UPDATE public.system_config SET status_refresh_last_run = now();

  RETURN v_processed;
END;
$$;

COMMENT ON FUNCTION public.refresh_initiative_status_overdue() IS
  'D-482 overdue detection. Per active Initiative: resolves cadence (D-481), '
  'computes next meeting date, sets status_due_at = next − 1 day, sets '
  'status_overdue from the 2-day valid window, stamps status_last_calculated_at. '
  'Bumps system_config.status_refresh_last_run. Returns count processed. Invoked '
  'by pg_cron every 30 min and by trigger_status_refresh (MCP) on demand.';

COMMIT;

-- ── Section 4: pg_cron registration (run separately; not in the txn above) ─
-- Requires the pg_cron extension. On Supabase, enable it under
--   Database → Extensions → pg_cron, then run the block below.
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-initiative-status') THEN
--     PERFORM cron.unschedule('refresh-initiative-status');
--   END IF;
--   PERFORM cron.schedule(
--     'refresh-initiative-status',
--     '*/30 * * * *',
--     'SELECT public.refresh_initiative_status_overdue();'
--   );
-- END $$;
--
-- ── Verification (read-only, safe post-apply) ────────────────────────────
-- SELECT jobid, jobname, schedule, command FROM cron.job
-- WHERE jobname = 'refresh-initiative-status';
-- SELECT public.refresh_initiative_status_overdue();  -- manual one-shot run
