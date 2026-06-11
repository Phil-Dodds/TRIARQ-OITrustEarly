-- 037_add_last_login_at_to_users.sql
-- Pathways OI Trust — Contract 22
-- D-422 Last Login visibility: adds last_login_at column to users.
-- D-166 referenced this column; not previously created.
-- Stamped by division-mcp JWT middleware on every validated request.
-- timestamptz nullable, no backfill.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

COMMENT ON COLUMN users.last_login_at IS
  'Last successful JWT validation against this user. Stamped by division-mcp on auth (D-422, D-166).';
