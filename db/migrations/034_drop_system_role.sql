-- 034_drop_system_role.sql
-- Pathways OI Trust — Build C, post-Contract 19
-- Governing decisions: D-394, CC-19-04 (Phase 1/Phase 2 split),
--                      CC-19-06 option B (is_super_admin replaces 'phil' semantics — RESOLVED).
--
-- DO NOT RUN until:
--   (1) Contract 19 UAT has confirmed all role-based behavior works on the booleans.
--   (2) The companion code change that removes the dual-write sync logic in
--       create_user.js / update_user.js has been deployed. Specifically, the
--       deriveSystemRole() helper and any "system_role: ..." assignments in the
--       insert/update payloads must be removed in the same deploy as this migration.
--   (3) `grep -r "system_role" mcp/ angular/src/` returns only comments, the
--       SystemRole type alias retention (or its removal), and no live reads/writes.
--
-- CC-19-06 status: RESOLVED. is_super_admin (added in migration 033) carries the
-- D-139 override authority and the Canon-document delete authority. The boolean
-- flag is bootstrapped by direct DB assignment in Supabase Studio — no MCP write
-- path — so dropping system_role does not break the override.
--
-- After running this migration, the boolean flags become the sole source of role truth.
-- The legacy column and CHECK constraint are dropped together.

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
