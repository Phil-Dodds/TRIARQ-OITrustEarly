-- 050_initiative_status_updates.sql
-- Pathways OI Trust — Contract 32 (Initiative Status Updates)
-- Governing decisions: D-476, D-477, D-478, D-479, D-483, D-353
-- Must run after: 017_create_delivery_cycles.sql, 001_create_users.sql
--
-- Why this migration:
--   D-476 — immutable history record per status save. Each save inserts one
--   row; no UPDATE or DELETE post-insert (append-only, like cycle_event_log
--   per D-125). The trio (DOL/DCS/EPO) authors these; confidence fields mirror
--   gate status (D-477) and their applicability is snapshotted (D-479).
--
-- Deviation from CLAUDE.md schema rule — recorded as CC-32-8:
--   created_at present; updated_at intentionally OMITTED. This table is
--   append-only and immutable — same pattern as cycle_event_log (migration
--   020, D-125). An updated_at column would imply mutability that the RLS
--   (no UPDATE policy) and the contract (D-476 "immutable") both forbid.
--
-- Confidence value enum: exactly the five cycle_milestone_dates.date_status
--   values per D-477/CC-32-5 (not_started, on_track, at_risk, behind,
--   complete). The 'skipped' value (migration 044) is intentionally NOT
--   accepted on confidence fields — confidence is a forward-looking judgement,
--   not a terminal gate state.
--
-- ⚠ Do NOT execute via Code per Rule 22. Phil executes against Supabase.

BEGIN;

CREATE TABLE IF NOT EXISTS public.initiative_status_updates (
  id                           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id                uuid        NOT NULL
                                           REFERENCES public.delivery_cycles(delivery_cycle_id)
                                           ON DELETE CASCADE,
  accomplished_last_cycle      text,
  plan_next_cycle              text,
  blockers                     text,
  escalation_needed            boolean     NOT NULL DEFAULT false,
  pilot_confidence             text        NULL
                                           CHECK (pilot_confidence IN
                                             ('not_started','on_track','at_risk','behind','complete')),
  close_confidence             text        NULL
                                           CHECK (close_confidence IN
                                             ('not_started','on_track','at_risk','behind','complete')),
  pilot_confidence_applicable  boolean     NOT NULL DEFAULT false,
  close_confidence_applicable  boolean     NOT NULL DEFAULT false,
  saved_by                     uuid        NOT NULL REFERENCES public.users(id),
  saved_at                     timestamptz NOT NULL DEFAULT now(),
  created_at                   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_initiative_status_updates_initiative
  ON public.initiative_status_updates (initiative_id, saved_at DESC);

COMMENT ON TABLE public.initiative_status_updates IS
  'Immutable, append-only status update history per Initiative (D-476). Each '
  'save inserts one row; NEVER updated or deleted. confidence fields mirror '
  'cycle_milestone_dates.date_status (D-477); *_applicable columns snapshot '
  'D-479 applicability at save time for history fidelity. Source: D-476, '
  'D-477, D-479.';

-- ── RLS (D-353) — division-scoped read via parent Initiative; immutable ──
ALTER TABLE public.initiative_status_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "initiative_status_updates_select"
  ON public.initiative_status_updates FOR SELECT
  USING (
    initiative_id IN (
      SELECT delivery_cycle_id FROM public.delivery_cycles
      WHERE division_id IN (SELECT public.user_division_ids())
        AND deleted_at IS NULL
    )
    OR public.user_is_admin()
  );
-- No INSERT policy — service role bypasses RLS; MCP (save_initiative_status_update)
--   enforces the DOL/DCS/EPO trio check before insert.
-- No UPDATE / DELETE policy — append-only, immutable (D-476).

COMMIT;
