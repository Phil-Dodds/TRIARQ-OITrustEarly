-- 034_drop_system_role.sql
-- Pathways OI Trust — Build C, Contract 19 Phase 2
-- Governing decisions: D-394, CC-19-04 (Phase 1/Phase 2 split),
--                      CC-19-06 option B (is_super_admin replaces 'phil' semantics).
--
-- RUN ORDER (this is the same session as the Phase 2 cleanup commit):
--   (1) Push Phase 2 code to master (this commit).
--   (2) Redeploy all three MCP services on Render. New MCP no longer reads or
--       writes system_role. Existing column is harmlessly ignored.
--   (3) Run this migration. Column drops cleanly because nothing references it.
--   (4) Deploy new Angular bundle. User type no longer carries system_role.
--
-- After this runs, the boolean flags become the sole source of role truth.

BEGIN;

-- 1. Drop the dual-write sync logic in update_user / create_user before this runs.
--    (Application change — must ship in the same deploy as this migration.)

-- 2. Drop the CHECK constraint and the column.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_system_role_check;
ALTER TABLE public.users DROP COLUMN IF EXISTS system_role;

-- 3. Sanity check — view definitions and RLS policies must not reference system_role.
--    Run this manually before COMMIT:
-- SELECT pg_get_viewdef(c.oid)
--   FROM pg_class c WHERE c.relkind = 'v' AND pg_get_viewdef(c.oid) LIKE '%system_role%';
-- (Expected: 0 rows.)

COMMIT;

-- Verification:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'users'
--   ORDER BY ordinal_position;
--   Expected: id, email, display_name, is_admin, is_dcs, is_epo, is_dol, is_ce,
--             allow_both_admin_and_functional_roles, is_active, created_at, updated_at, deleted_at
--             (NO system_role)
