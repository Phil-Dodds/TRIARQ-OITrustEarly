-- 063_meeting_window_overdue.sql
-- Pathways OI Trust — D-482 evaluation amended (Phil, 2026-07-14).
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- Status signals are MEETING-ANCHORED and fire only when action is timely:
--   amber "Update due for meeting"    — window open (due-2 .. due-1), status
--                                       predates the window (client-derived)
--   red   "Not updated for this meeting" — meeting DAY, status predates the
--                                       window (computed live in needs-review)
--   mid-cycle / right after a meeting — NO signal, nothing is owed.
-- The durable "dark for a full cycle" red is retired: chips always mean
-- "act now", never "you failed in the past" (age columns carry history).
--
-- Column semantics change:
--   status_due_at  = the NEXT MEETING DATE itself (was meeting - 1 day).
--   status_overdue = "an update is being requested right now": today within
--                    [meeting-2 .. meeting] AND chain root predates the window
--                    (or no update exists). Drives get_my_status_due (the
--                    My Actions Update Initiative Statuses tab) and clears on
--                    save as before. Outside the window it is always false.

CREATE OR REPLACE FUNCTION public.refresh_initiative_status_overdue()
RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  r_init            RECORD;
  v_cfg             public.division_status_config;
  v_today           date := CURRENT_DATE;
  v_next_meeting    date;
  v_window_start    date;
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

    -- Next meeting date from cadence config (unchanged computation).
    IF v_cfg.cadence = 'weekly' THEN
      v_next_meeting := v_today
        + ((v_cfg.day_of_week - EXTRACT(DOW FROM v_today)::int + 7) % 7);

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

    v_window_start := v_next_meeting - 2;

    -- D-507: the chain ROOT's saved_at governs; an edit never refreshes it.
    IF r_init.latest_status_update_id IS NULL THEN
      v_latest_saved_at := NULL;
    ELSE
      v_latest_saved_at := public.status_update_chain_root_saved_at(r_init.latest_status_update_id);
    END IF;

    -- Requested-now flag: only inside [window_start .. meeting day], and only
    -- when the current status predates the window (or none exists).
    v_overdue := (v_today >= v_window_start AND v_today <= v_next_meeting)
      AND (v_latest_saved_at IS NULL
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
  'D-482 as amended 2026-07-14: status_due_at = next meeting DATE; '
  'status_overdue = update requested right now (today within meeting-2..meeting '
  'and chain root predates the window). No signal outside the window.';

-- Recompute immediately so stale meeting-window flags clear without waiting
-- for the next cron run.
SELECT public.refresh_initiative_status_overdue();
