-- 033_boolean_role_flags.sql
-- Pathways OI Trust — Build C Contract 19
-- Governing decisions: D-394, D-353, D-369, CC-19-01 (phil → is_admin),
--                      CC-19-06 option B (super-admin boolean for D-139 / Canon delete).
--
-- Replaces the single-role `system_role` column with five boolean role flags,
-- enabling multi-role users (e.g. Craig as both Admin and DCS). Demo-environment
-- interim per D-394 — retired at port.
--
-- This migration is additive and reversible BEFORE the follow-up migration that
-- drops system_role. After this runs, code that reads system_role keeps working;
-- code that reads booleans starts working. The MCP and Angular updates that
-- follow shift reads to the booleans.
--
-- Backfill mapping (per Step 0 live counts — 12 active users):
--   system_role = 'admin' (2)  → is_admin = true
--   system_role = 'dcs'   (6)  → is_dcs   = true
--   system_role = 'epo'   (1)  → is_epo   = true
--   system_role = 'dol'   (1)  → is_dol   = true
--   system_role = 'ce'    (1)  → is_ce    = true
--   system_role = 'phil'  (1)  → is_admin = true AND is_super_admin = true
--                                (CC-19-01 + CC-19-06 option B — Phil gets both flags)
--
-- Super-admin semantics (CC-19-06 option B):
--   is_super_admin gates D-139 override authority (allow_both_admin_and_functional_roles)
--   and Canon-document delete authority. Single-user today (Phil). Future
--   super-admins are bootstrapped by direct DB assignment — no MCP write path,
--   so the flag cannot be self-granted or escalated through the Admin UI.
--
-- public.user_is_admin() predicate changes from `system_role = 'phil'` to
-- `is_admin = true`. Now multi-user (D-369) instead of single-user.

BEGIN;

-- 1. Add boolean role columns ─────────────────────────────────────────────────
ALTER TABLE public.users
    ADD COLUMN is_admin       boolean NOT NULL DEFAULT false,
    ADD COLUMN is_dcs         boolean NOT NULL DEFAULT false,
    ADD COLUMN is_epo         boolean NOT NULL DEFAULT false,
    ADD COLUMN is_dol         boolean NOT NULL DEFAULT false,
    ADD COLUMN is_ce          boolean NOT NULL DEFAULT false,
    ADD COLUMN is_super_admin boolean NOT NULL DEFAULT false;

-- 2. Backfill from system_role ────────────────────────────────────────────────
UPDATE public.users SET is_admin = true WHERE system_role = 'admin';
UPDATE public.users SET is_dcs   = true WHERE system_role = 'dcs';
UPDATE public.users SET is_epo   = true WHERE system_role = 'epo';
UPDATE public.users SET is_dol   = true WHERE system_role = 'dol';
UPDATE public.users SET is_ce    = true WHERE system_role = 'ce';
-- CC-19-01 option a: 'phil' collapses into is_admin = true.
-- CC-19-06 option B: 'phil' also gets is_super_admin = true (D-139, Canon delete).
UPDATE public.users SET is_admin = true,  is_super_admin = true WHERE system_role = 'phil';

-- 3. Update user_is_admin() to read the boolean (D-369 multi-user Admin) ──────
-- Function name retained for spec continuity. Replaces the single-row 'phil'
-- check with the new multi-user boolean. SECURITY DEFINER prevents RLS
-- recursion when other tables' policies call it. STABLE because output
-- depends only on the calling user.
CREATE OR REPLACE FUNCTION public.user_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND is_admin = true
      AND deleted_at IS NULL
  )
$$;

-- 4. Helpful index for picker filters (post-deploy queries) ───────────────────
-- One partial index per flag — small B-tree, covers WHERE is_<role> = true.
CREATE INDEX IF NOT EXISTS idx_users_is_admin       ON public.users (id) WHERE is_admin       = true;
CREATE INDEX IF NOT EXISTS idx_users_is_dcs         ON public.users (id) WHERE is_dcs         = true;
CREATE INDEX IF NOT EXISTS idx_users_is_epo         ON public.users (id) WHERE is_epo         = true;
CREATE INDEX IF NOT EXISTS idx_users_is_dol         ON public.users (id) WHERE is_dol         = true;
CREATE INDEX IF NOT EXISTS idx_users_is_ce          ON public.users (id) WHERE is_ce          = true;
CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON public.users (id) WHERE is_super_admin = true;

COMMIT;

-- ── Verification queries (run after COMMIT to confirm) ─────────────────────
-- SELECT id, display_name, system_role, is_admin, is_dcs, is_epo, is_dol, is_ce, is_super_admin
--   FROM public.users
--   WHERE deleted_at IS NULL
--   ORDER BY display_name;
--
-- Expected (per Step 0 counts):
--   3× is_admin = true (2 'admin' rows + 1 'phil' row)
--   6× is_dcs   = true
--   1× is_epo   = true
--   1× is_dol   = true
--   1× is_ce    = true
--   1× is_super_admin = true (phil's row only)
--
-- SELECT public.user_is_admin();   -- run authenticated as Phil → true
--
-- system_role column REMAINS in place. Drop happens in migration 034 after
-- MCP and Angular code is updated to read booleans only.
--
-- is_super_admin is intentionally NOT exposed as a mutable field on update_user
-- MCP. Future super-admin grants are made by direct DB UPDATE in Supabase Studio.
-- This prevents privilege escalation through the Admin Users UI.
