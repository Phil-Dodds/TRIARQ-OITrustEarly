-- 046_gate_consultations.sql
-- Pathways OI Trust — Contract 29 (Gate Approval, Consultation, and Notification System)
-- Governing decisions: D-459, D-460, D-461, D-462 — Gate Consultation System (WS2)
--
-- Why this migration:
--   D-462 introduces the gate_consultations table. One row per Consulted party
--   per gate submission. The Consulted set is derived at submission time
--   (D-459) from the DCS/EPO/DOL trio plus delivery_cycles.other_consulted_user_ids.
--   The submitter is auto-approved (D-460). Consulted parties may respond, and
--   may record a post-approval decline indefinitely (D-460).
--
-- ── Deviations from spec §WS2 Schema Migration — recorded as CC-decisions ──
--   (1) FK target corrected. Spec DDL: "REFERENCES gate_records(id)". The live
--       gate_records PK is gate_record_id (migration 019), not id. As written
--       the migration would fail. Corrected to gate_records(gate_record_id).
--       → CC-29-1.
--   (2) updated_at column + trigger added. Spec DDL omits updated_at, but
--       gate_consultations rows are mutated by record_consultation_response
--       (response, notes, responded_at). CLAUDE.md requires created_at AND
--       updated_at on every new table. Added with the shared set_updated_at
--       trigger. → CC-29-2.
--   Both deviations preserve all spec-listed columns and semantics.
--
-- Backward compatibility:
--   New table — no impact on existing rows. gate_record_id FK is ON DELETE
--   CASCADE per spec; gate_records are soft-deleted (ARCH-6) so the cascade is
--   effectively inert in normal operation.
--
-- RLS (D-353): enabled. SELECT visible to the consulted user, to admins, and to
--   users with division access via the gate's initiative. Writes are MCP-only
--   (service role bypasses RLS) — no INSERT/UPDATE policy, matching gate_records.
--
-- ⚠ Do NOT execute via Code per Rule 21 / Rule 18. Phil executes against
--   Supabase. Migration ships in repo; deployment runs only after Phil
--   confirms manual apply.

BEGIN;

CREATE TABLE IF NOT EXISTS public.gate_consultations (
    id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    gate_record_id     uuid        NOT NULL REFERENCES public.gate_records(gate_record_id) ON DELETE CASCADE,
    consulted_user_id  uuid        NOT NULL REFERENCES public.users(id),
    response           text        NOT NULL DEFAULT 'pending'
                                   CHECK (response IN (
                                       'pending', 'approved', 'declined', 'declined_post_approval'
                                   )),
    notes              text,
    responded_at       timestamptz,
    is_auto_approved   boolean     NOT NULL DEFAULT false,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    UNIQUE (gate_record_id, consulted_user_id)
);

CREATE INDEX IF NOT EXISTS idx_gate_consultations_gate_record
    ON public.gate_consultations (gate_record_id);

CREATE INDEX IF NOT EXISTS idx_gate_consultations_user
    ON public.gate_consultations (consulted_user_id);

CREATE TRIGGER gate_consultations_set_updated_at
    BEFORE UPDATE ON public.gate_consultations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.gate_consultations IS
    'D-459/D-460/D-461/D-462 (Contract 29 WS2). One row per Consulted party per '
    'gate submission. Consulted set = non-null DCS/EPO/DOL trio + '
    'delivery_cycles.other_consulted_user_ids, derived at submit_gate_for_approval. '
    'Submitter auto-approved (is_auto_approved = true). Response window stays open '
    'indefinitely post-approval (declined_post_approval).';

COMMENT ON COLUMN public.gate_consultations.response IS
    'pending: awaiting consulted response. approved: consulted concurs. '
    'declined: consulted dissents while gate still awaiting_approval. '
    'declined_post_approval: consulted dissents after the gate was already '
    'approved (D-460) — triggers WS4 post-approval decline email (D-466).';

COMMENT ON COLUMN public.gate_consultations.is_auto_approved IS
    'true only on the submitter''s own row, auto-set to approved at submission '
    'time (D-460). No Action Queue inbox delivery for the submitter.';

-- RLS (D-353)
ALTER TABLE public.gate_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gate_consultations_select"
  ON public.gate_consultations FOR SELECT
  USING (
    consulted_user_id = auth.uid()
    OR public.user_is_admin()
    OR gate_record_id IN (
      SELECT gr.gate_record_id
        FROM public.gate_records gr
        JOIN public.delivery_cycles dc
          ON dc.delivery_cycle_id = gr.delivery_cycle_id
       WHERE dc.division_id IN (SELECT public.user_division_ids())
         AND dc.deleted_at IS NULL
    )
  );
-- No INSERT/UPDATE policy — MCP service role writes these rows (mirrors gate_records).

COMMIT;

-- ── Verification (read-only, safe to run post-apply) ─────────────────────
-- SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--  WHERE conrelid = 'public.gate_consultations'::regclass;
-- Expect: PK, the gate_record_id FK → gate_records(gate_record_id), the
--   consulted_user_id FK → users(id), the response CHECK, and the
--   UNIQUE(gate_record_id, consulted_user_id).

-- ── Rollback (if needed) ──────────────────────────────────────────────────
-- DROP TABLE IF EXISTS public.gate_consultations;
