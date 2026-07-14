-- 064_window_anchored_overdue.sql
-- Pathways OI Trust — D-482 evaluation, final model (Phil, 2026-07-14).
-- SUPERSEDES 063 (ran briefly same day). Phil executes migrations by hand.
--
-- ONE continuous rule, one chip:
--   Every meeting's prep window opens 2 days before it.
--   RED "Status overdue" = the status chain-root predates the MOST RECENTLY
--   OPENED window. Clears the instant anyone saves an update.
--
--   - Updated in the current window  → blank through the meeting and all the
--     way mid-cycle, until the NEXT window opens.
--   - Updated mid-cycle or earlier   → red from window-open, through the
--     meeting, and persisting after — until someone updates.
--   - An update made today is never red today (the last window-start is
--     always behind it).
--
-- status_due_at remains the NEXT MEETING DATE. status_overdue is again the
-- single authoritative signal (no amber companion; 063's window-scoped flag
-- semantics are replaced).

CREATE OR REPLACE FUNCTION public.refresh_initiative_status_overdue()
RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  r_init            RECORD;
  v_cfg             public.division_status_config;
  v_today           date := CURRENT_DATE;
  v_next_meeting    date;
  v_prev_meeting    date;
  v_window_start    date;   -- most recent window-start ON OR BEFORE today
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

    IF v_cfg.id IS NULL THEN
      CONTINUE;
    END IF;

    -- Next + previous meeting dates from cadence config.
    IF v_cfg.cadence = 'weekly' THEN
      v_next_meeting := v_today
        + ((v_cfg.day_of_week - EXTRACT(DOW FROM v_today)::int + 7) % 7);
      v_prev_meeting := v_next_meeting - 7;

    ELSIF v_cfg.cadence = 'triweekly' THEN
      v_aligned_anchor := v_cfg.anchor_date
        + ((v_cfg.day_of_week - EXTRACT(DOW FROM v_cfg.anchor_date)::int + 7) % 7);
      IF v_aligned_anchor >= v_today THEN
        v_next_meeting := v_aligned_anchor;
      ELSE
        v_diff   := v_today - v_aligned_anchor;
        v_cycles := CEIL(v_diff::numeric / 21);
        v_next_meeting := v_aligned_anchor + (v_cycles * 21);
      END IF;
      v_prev_meeting := v_next_meeting - 21;

    ELSE  -- monthly (nth weekday of month)
      v_month := date_trunc('month', v_today)::date;
      v_candidate := public.nth_weekday_of_month(
        v_month, v_cfg.day_of_week, v_cfg.month_occurrence);
      IF v_candidate < v_today THEN
        v_month := (date_trunc('month', v_today) + interval '1 month')::date;
        v_candidate := public.nth_weekday_of_month(
          v_month, v_cfg.day_of_week, v_cfg.month_occurrence);
      END IF;
      v_next_meeting := v_candidate;
      v_prev_meeting := public.nth_weekday_of_month(
        (date_trunc('month', v_next_meeting) - interval '1 month')::date,
        v_cfg.day_of_week, v_cfg.month_occurrence);
    END IF;

    -- Most recent window-start on or before today.
    IF v_today >= (v_next_meeting - 2) THEN
      v_window_start := v_next_meeting - 2;
    ELSE
      v_window_start := v_prev_meeting - 2;
    END IF;

    -- D-507: the chain ROOT's saved_at governs; an edit never refreshes it.
    IF r_init.latest_status_update_id IS NULL THEN
      v_latest_saved_at := NULL;
    ELSE
      v_latest_saved_at := public.status_update_chain_root_saved_at(r_init.latest_status_update_id);
    END IF;

    v_overdue := (v_latest_saved_at IS NULL
                  OR v_latest_saved_at < v_window_start::timestamptz);

    UPDATE public.delivery_cycles
    SET status_overdue            = v_overdue,
        status_due_at             = v_next_meeting::timestamptz,
        status_last_calculated_at = now()
    WHERE delivery_cycle_id = r_init.delivery_cycle_id;

    v_processed := v_processed + 1;
  END LOOP;

  RETURN v_processed;
END;
$$;

COMMENT ON FUNCTION public.refresh_initiative_status_overdue() IS
  'D-482 final (2026-07-14): status_overdue = chain root predates the most '
  'recently opened prep window (meeting - 2 days). Clears on any save. '
  'status_due_at = next meeting date.';

-- Recompute now so flags match the new rule without waiting for the cron.
SELECT public.refresh_initiative_status_overdue();
