-- 032_role_rename_dol_addition.sql
-- Pathways OI Trust — Build C Contract 18
-- Governing decisions: D-389, D-390, D-391, D-393.
--
-- Renames system_role values and delivery_cycles assignment columns:
--   'ds' → 'dcs'    (Domain Capability Strategist)        — D-389
--   'cb' → 'epo'    (Engineering Product Owner)           — D-390
--   adds 'dol'      (Domain Outcome Lead)                  — D-391
--   delivery_cycles.assigned_ds_user_id → assigned_dcs_user_id
--   delivery_cycles.assigned_cb_user_id → assigned_epo_user_id
--   delivery_cycles.assigned_dol_user_id  (new column)
--
-- Order matters:
--   1. DROP the existing CHECK constraint so old + new values coexist briefly.
--   2. UPDATE existing system_role values to the new role names.
--   3. ADD the new CHECK constraint with the final role set.
--   4. Rename columns on delivery_cycles.
--   5. Add the new assigned_dol_user_id column.
--   6. Rename / create supporting indexes.
--
-- Why DROP before UPDATE: the existing CHECK lists only ('phil','ds','cb','ce','admin').
-- Any UPDATE that sets system_role to 'dcs' or 'epo' would violate the old constraint
-- before it is replaced, aborting the transaction. Dropping the constraint first
-- lets the UPDATE land cleanly; the new constraint is added immediately after,
-- so the table is never left without a CHECK.
--
-- Index name verification: pre-rename names match those created by
-- migration 024_delivery_cycle_schema_updates.sql lines 54–58.
-- If actual names in your database differ, adjust the ALTER INDEX lines below.

BEGIN;

-- 1. Drop the old CHECK constraint so the new role values can be written.
ALTER TABLE public.users DROP CONSTRAINT users_system_role_check;

-- 2. Migrate existing role values to the new role names.
UPDATE public.users SET system_role = 'dcs' WHERE system_role = 'ds';
UPDATE public.users SET system_role = 'epo' WHERE system_role = 'cb';

-- 3. Add the new CHECK constraint with the final role set.
ALTER TABLE public.users
    ADD CONSTRAINT users_system_role_check
    CHECK (system_role IN ('phil', 'dcs', 'epo', 'dol', 'ce', 'admin'));

-- 4. Rename assignment columns on delivery_cycles
ALTER TABLE public.delivery_cycles
    RENAME COLUMN assigned_ds_user_id TO assigned_dcs_user_id;
ALTER TABLE public.delivery_cycles
    RENAME COLUMN assigned_cb_user_id TO assigned_epo_user_id;

-- 5. Add the new DOL assignment column (D-391)
ALTER TABLE public.delivery_cycles
    ADD COLUMN assigned_dol_user_id uuid REFERENCES public.users(id);

-- 6. Rename / create supporting indexes
ALTER INDEX public.idx_delivery_cycles_assigned_ds RENAME TO idx_delivery_cycles_assigned_dcs;
ALTER INDEX public.idx_delivery_cycles_assigned_cb RENAME TO idx_delivery_cycles_assigned_epo;
CREATE INDEX idx_delivery_cycles_assigned_dol
    ON public.delivery_cycles(assigned_dol_user_id);

COMMIT;

-- ── Verification queries (run after COMMIT to confirm) ─────────────────────
-- SELECT DISTINCT system_role FROM public.users ORDER BY 1;
--   Expected: admin, ce, dcs, dol, epo, phil (no 'ds' or 'cb')
--
-- SELECT column_name
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name   = 'delivery_cycles'
--     AND column_name LIKE 'assigned_%';
--   Expected: assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id
--             (no assigned_ds_user_id or assigned_cb_user_id)
--
-- SELECT indexname FROM pg_indexes
--   WHERE schemaname = 'public' AND tablename = 'delivery_cycles'
--   AND indexname LIKE 'idx_delivery_cycles_assigned_%';
--   Expected: idx_delivery_cycles_assigned_dcs, idx_delivery_cycles_assigned_epo,
--             idx_delivery_cycles_assigned_dol
