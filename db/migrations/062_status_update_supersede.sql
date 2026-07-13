-- 062_status_update_supersede.sql
-- Pathways OI Trust — Contract 36 Phase B (D-507 supersede edit model)
-- Spec calls this "migration 059"; the repo is already at 061 (Team Meetings
-- views / gate submission note / roadmap themes) — numbering mapped in CodeClose.
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- initiative_status_updates stays append-only (CC-32-8): an edit INSERTS a new
-- row pointing at the row it supersedes. Rows linked by supersedes_update_id
-- form a Status Update Chain — head (newest) displays; root's created_at
-- governs age + overdue (D-507). RLS: insert-only path unchanged — column
-- addition inherits the existing policies (D-353).

ALTER TABLE initiative_status_updates
  ADD COLUMN IF NOT EXISTS supersedes_update_id uuid NULL
    REFERENCES initiative_status_updates(id);

CREATE INDEX IF NOT EXISTS idx_isu_supersedes
  ON initiative_status_updates (supersedes_update_id)
  WHERE supersedes_update_id IS NOT NULL;

-- ── D-507: chain-root resolver + overdue evaluation update ───────────────────
-- The chain ROOT's saved_at governs overdue and all age displays; an edit never
-- refreshes the clock. Replaces the direct saved_at read in
-- refresh_initiative_status_overdue (migration 054) with a chain walk.

CREATE OR REPLACE FUNCTION public.status_update_chain_root_saved_at(p_update_id uuid)
RETURNS timestamptz
LANGUAGE sql STABLE AS $$
  WITH RECURSIVE chain AS (
    SELECT id, supersedes_update_id, saved_at, 0 AS depth
    FROM public.initiative_status_updates
    WHERE id = p_update_id
    UNION ALL
    SELECT u.id, u.supersedes_update_id, u.saved_at, c.depth + 1
    FROM public.initiative_status_updates u
    JOIN chain c ON u.id = c.supersedes_update_id
  )
  SELECT saved_at FROM chain ORDER BY depth DESC LIMIT 1
$$;

COMMENT ON FUNCTION public.status_update_chain_root_saved_at(uuid) IS
  'D-507: walks supersedes_update_id from a chain head down to the original '
  'row and returns the ROOT saved_at — the timestamp that governs overdue '
  'evaluation and age displays. An edit never refreshes the clock.';

-- Re-create refresh_initiative_status_overdue with the chain-root read.
-- (Body identical to migration 054 except the v_latest_saved_at lookup.)
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

    IF v_cfg.id IS NULL THEN
      CONTINUE;
    END IF;

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

    v_due_at := (v_next_meeting - 1)::timestamptz;

    -- D-507: overdue evaluates the CHAIN ROOT saved_at, never an edit's.
    IF r_init.latest_status_update_id IS NULL THEN
      v_overdue := true;
    ELSE
      v_latest_saved_at := public.status_update_chain_root_saved_at(r_init.latest_status_update_id);
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

-- Verification:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='initiative_status_updates' AND column_name='supersedes_update_id';
-- SELECT public.refresh_initiative_status_overdue();  -- manual one-shot run
