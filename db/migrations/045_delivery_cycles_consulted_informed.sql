-- 045_delivery_cycles_consulted_informed.sql
-- Pathways OI Trust — Contract 29 (Gate Approval, Consultation, and Notification System)
-- Governing decision: D-458 — Initiative Other Consulted and Other Informed Fields (WS1)
--
-- Why this migration:
--   D-458 adds two initiative-level participant lists used by the gate
--   consultation system (WS2). other_consulted_user_ids feeds the Consulted
--   set derived at gate submission (D-459); other_informed_user_ids is stored
--   now but carries no behavior yet (Informed behavior deferred — D-458).
--
-- Design:
--   uuid[] arrays, NOT NULL DEFAULT '{}'. No FK constraint on array elements
--   (Postgres cannot FK array members) — user existence is validated at write
--   time inside update_delivery_cycle.js per spec WS1.
--
-- Backward compatibility:
--   Pure additive. Both columns default to empty array, so every existing
--   delivery_cycles row is valid immediately. No data rewrite. Existing read
--   tools that do not select these columns are unaffected.
--
-- RLS: delivery_cycles already has RLS enabled (migration 031). New columns
--   inherit the existing table policies — no policy change required.
--
-- ⚠ Do NOT execute via Code per Rule 21 / Rule 18. Phil executes against
--   Supabase. Migration ships in repo; deployment runs only after Phil
--   confirms manual apply.

BEGIN;

ALTER TABLE public.delivery_cycles
  ADD COLUMN IF NOT EXISTS other_consulted_user_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS other_informed_user_ids  uuid[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.delivery_cycles.other_consulted_user_ids IS
  'D-458 (WS1). Users consulted on every gate submission for this initiative, '
  'beyond the DCS/EPO/DOL trio. Feeds the Consulted set derived at '
  'submit_gate_for_approval (D-459). uuid[] — no FK on members; existence '
  'validated in update_delivery_cycle.js. Full-array replace on write.';

COMMENT ON COLUMN public.delivery_cycles.other_informed_user_ids IS
  'D-458 (WS1). Stored Informed participant list. No Action Queue, notification, '
  'or email behavior at this stage — behavior deferred per D-458. uuid[], '
  'full-array replace on write.';

COMMIT;

-- ── Verification (read-only, safe to run post-apply) ─────────────────────
-- SELECT column_name, data_type, column_default, is_nullable
--   FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'delivery_cycles'
--    AND column_name IN ('other_consulted_user_ids', 'other_informed_user_ids');
-- Expected: 2 rows, ARRAY type, default '{}', NOT NULL.

-- ── Rollback (if needed) ──────────────────────────────────────────────────
-- ALTER TABLE public.delivery_cycles
--   DROP COLUMN IF EXISTS other_consulted_user_ids,
--   DROP COLUMN IF EXISTS other_informed_user_ids;
