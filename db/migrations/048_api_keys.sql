-- 048_api_keys.sql
-- Pathways OI Trust — Contract 31 (Public Initiative MCP, API Key Infrastructure)
-- Governing decisions: D-473, D-474, D-475
--
-- Why this migration:
--   D-474 introduces programmatic API-key access for executive MCP clients
--   (Claude Desktop) to read Initiative data through the new read-only
--   initiative-public-mcp server (D-473). Keys are issued and managed by Phil
--   from the /admin/api-keys screen (D-475). The raw key is shown once at
--   creation and never stored — only a bcrypt hash is persisted. The public
--   MCP validates an inbound `oitrust_…` bearer token by bcrypt-comparing it
--   against the active rows here, then stamps last_used_at.
--
-- ── Arch-6 exception (documented, intentional) ──
--   No deleted_at column. Per the SessionBrief and spec §WS1.1, api_keys uses
--   revoked_at as its single inactivation/lifecycle-end mechanism — keys are
--   credentials, not domain records, so the soft-delete pattern does not apply.
--   Precedent: gate_approver_configs (migration 047) likewise diverges from the
--   universal column set where the table's nature warrants it. "Active" is the
--   derived predicate revoked_at IS NULL — no stored boolean (D-474).
--
-- ── No updated_at column ──
--   The only mutable fields are display_name, user_label, and last_used_at.
--   last_used_at is written by the public MCP on every call; the screen's edit
--   path writes display_name/user_label directly. No updated_at trigger is
--   required (spec §WS1.1). created_at is retained as the issuance timestamp.
--
-- RLS (D-353 / D-382): ENABLED with NO permissive policies → every anon-key and
--   authenticated-key request is denied by default. Only the service role
--   (used by division-mcp and initiative-public-mcp) bypasses RLS and can read
--   the key_hash. This is stricter than gate_approver_configs (which allows
--   public SELECT) because key_hash is a credential and must never be readable
--   by the anon key. "No anon-key reads" (spec §WS1.1).
--
-- ⚠ Do NOT execute via Code per Rule 21 / Rule 18. Phil executes against
--   Supabase. Migration ships in repo; deployment runs only after Phil
--   confirms manual apply.

BEGIN;

CREATE TABLE IF NOT EXISTS public.api_keys (
    key_id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash       text        NOT NULL UNIQUE,
    display_name   text        NOT NULL,
    user_label     text        NOT NULL,
    scope_type     text        NOT NULL DEFAULT 'all'
                               CHECK (scope_type IN ('all', 'divisions')),
    division_ids   uuid[]      NOT NULL DEFAULT '{}',
    created_at     timestamptz NOT NULL DEFAULT now(),
    last_used_at   timestamptz,
    revoked_at     timestamptz,
    created_by     uuid        NOT NULL REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash   ON public.api_keys (key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked_at ON public.api_keys (revoked_at);

COMMENT ON TABLE public.api_keys IS
    'D-474 (Contract 31). Programmatic API keys for executive MCP read access to '
    'Initiative data via initiative-public-mcp (D-473). Raw key returned once at '
    'creation (create_api_key); only the bcrypt hash is stored. Active = '
    'revoked_at IS NULL (no stored boolean). No deleted_at (Arch-6 exception — '
    'revoked_at is the lifecycle end state). Phase 1: scope_type always ''all''.';

COMMENT ON COLUMN public.api_keys.key_hash IS
    'bcrypt hash (cost 10) of the raw oitrust_… key. The raw key is never stored.';
COMMENT ON COLUMN public.api_keys.scope_type IS
    'Phase 1: always ''all'' (all Divisions). ''divisions'' reserved for Phase 2 '
    'Division-scoped keys (division_ids).';
COMMENT ON COLUMN public.api_keys.revoked_at IS
    'Inactivation timestamp. NULL = active. Set by inactivate_api_key; cleared by '
    'reactivate_api_key. Replaces the soft-delete deleted_at pattern for this table.';
COMMENT ON COLUMN public.api_keys.last_used_at IS
    'Stamped by initiative-public-mcp on every successful authenticated call.';

-- RLS (D-353 / D-382): enable with no permissive policies — deny all non-service-role
-- access. The service role bypasses RLS. No anon-key reads of key_hash.
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ── Verification (read-only, safe to run post-apply) ─────────────────────
-- SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'api_keys'
--  ORDER BY ordinal_position;
-- Confirm RLS on and no policies (deny-by-default):
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'api_keys';            -- expect t
-- SELECT polname FROM pg_policy WHERE polrelid = 'public.api_keys'::regclass; -- expect 0 rows

-- ── Rollback (if needed) ──────────────────────────────────────────────────
-- DROP TABLE IF EXISTS public.api_keys;
