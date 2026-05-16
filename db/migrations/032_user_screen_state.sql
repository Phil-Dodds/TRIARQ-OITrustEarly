-- 032_user_screen_state.sql
-- Pathways OI Trust — Contract 16
-- Per-user filter and sort persistence (D-171, D-370).
--
-- Spec: build-c-contract16-spec.md §3.1
-- Authority: D-171 Filter and Sort Memory; D-370 build assignment to Contract 16
-- Schema mirrors the spec exactly. Unique (user_id, screen_key) so an upsert
-- targeting that pair is the natural write op.
--
-- RLS: enabled per D-353. Users read and upsert only their own rows. Policy
-- uses auth.uid() to match the user_id column, which is why the table is
-- read/written via the Angular-side authenticated Supabase client and not
-- through MCP (Arch-1 exception authorized by D-171).
--
-- Filter and sort state are jsonb. Search-text fields are excluded by the
-- application — never written into filter_state. last_rendered_at drives the
-- 7-day recency rule (SCREEN_STATE_RECENCY_DAYS).
--
-- Source: D-171, D-353, D-370, build-c-contract16-spec §3.1.

CREATE TABLE IF NOT EXISTS public.user_screen_state (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    screen_key        text        NOT NULL,
    filter_state      jsonb,
    sort_state        jsonb,
    last_rendered_at  timestamptz NOT NULL DEFAULT now(),
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_screen_state_user_screen_unique UNIQUE (user_id, screen_key)
);

CREATE INDEX IF NOT EXISTS idx_user_screen_state_user_screen
    ON public.user_screen_state (user_id, screen_key);

CREATE TRIGGER user_screen_state_set_updated_at
    BEFORE UPDATE ON public.user_screen_state
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.user_screen_state IS
    'Per-user filter and sort state per screen. One row per (user_id, screen_key). '
    'Restored on screen mount when last_rendered_at is within 7 days; upserted on '
    'every render after filters/sort are applied. Search-text fields are never '
    'persisted here — application layer enforces. '
    'Source: D-171, D-370, build-c-contract16-spec §3.1.';

COMMENT ON COLUMN public.user_screen_state.screen_key IS
    'Named constant declared in screen-state.service.ts SCREEN_KEYS — never '
    'constructed dynamically (Rule 4). Examples: admin.users, delivery.cycles, '
    'delivery.workstreams, delivery.divisions, delivery.gates.';

COMMENT ON COLUMN public.user_screen_state.last_rendered_at IS
    'Drives SCREEN_STATE_RECENCY_DAYS = 7 expiry. State older than this is not '
    'restored — system defaults apply on next mount.';

-- ── RLS — users may read and upsert their own rows only ───────────────────
ALTER TABLE public.user_screen_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_screen_state_own_rows" ON public.user_screen_state
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
