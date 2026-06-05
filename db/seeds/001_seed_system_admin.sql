-- 001_seed_system_admin.sql
-- Pathways OI Trust — Build A Bootstrap
-- Creates Phil Dodds's System Admin user record.
--
-- BEFORE RUNNING THIS SEED:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Invite user" and invite phil@triarqhealth.com (or correct email)
-- 3. Phil accepts the invite and logs in via magic link
-- 4. Go to Supabase Dashboard > Authentication > Users, find Phil's record
-- 5. Copy Phil's UUID (the "User UID" column)
-- 6. Replace the UUID literal below with that UUID
-- 7. Update the email below to match Phil's actual email address
-- 8. Run this script
--
-- Post-migration-034: role identity is carried by boolean flags. The bootstrap
-- user is seeded as Admin + Super-Admin (D-139, CC-19-06).
-- allow_both_admin_and_functional_roles = true per D-139.

DO $$
DECLARE
    phil_user_id uuid := '5d0cb7bc-c56f-4db8-a2d3-6a34d92fe82a'::uuid;
BEGIN
    INSERT INTO public.users (
        id,
        email,
        display_name,
        is_admin,
        is_super_admin,
        allow_both_admin_and_functional_roles,
        is_active
    ) VALUES (
        phil_user_id,
        'pdodds@triarqhealth.com',
        'Phil Dodds',
        true,                           -- Admin role
        true,                           -- CC-19-06: super-admin for D-139 override and Canon delete
        true,                           -- D-139 override: Phil holds both admin + functional roles
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name                          = EXCLUDED.display_name,
        is_admin                              = EXCLUDED.is_admin,
        is_super_admin                        = EXCLUDED.is_super_admin,
        allow_both_admin_and_functional_roles = EXCLUDED.allow_both_admin_and_functional_roles,
        is_active                             = EXCLUDED.is_active,
        updated_at                            = now();

    RAISE NOTICE 'System Admin seeded. Phil user_id: %', phil_user_id;
END $$;
