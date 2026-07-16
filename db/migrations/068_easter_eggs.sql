-- 068_easter_eggs.sql
-- Pathways OI Trust — Easter Egg Hunt (spec docs/easter-egg-spec.md §3)
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- Three tables: egg definitions, per-user finds, and the all-ten achievement.
-- All MCP-only; RLS enabled with ZERO policies (Rule 38 / Arch-1) — the service
-- role bypasses RLS, the public anon key is denied. Soft delete + audit cols.
--
-- Must run after: 067_seed_standard_2026_calendar.sql

CREATE TABLE IF NOT EXISTS public.easter_eggs (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    egg_slug        text        NOT NULL,            -- stable code id, e.g. 'home_footer'
    placement_key   text        NOT NULL,            -- module.screen.spot (Rule 4 constant)
    egg_name        text        NOT NULL,            -- feature only, shown once found (EE-02)
    location_detail text        NOT NULL,            -- admin/reference only, never sent to others (EE-01)
    asset_ref       text        NOT NULL,            -- egg-01..egg-10 (EggIconComponent)
    sort_order      integer     NOT NULL,
    season          integer     NOT NULL DEFAULT 1,  -- EE-14 dormant (future reset)
    active_status   boolean     NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);

CREATE UNIQUE INDEX idx_easter_eggs_season_placement
    ON public.easter_eggs (season, placement_key) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_easter_eggs_season_slug
    ON public.easter_eggs (season, egg_slug) WHERE deleted_at IS NULL;

CREATE TRIGGER easter_eggs_set_updated_at
    BEFORE UPDATE ON public.easter_eggs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.user_egg_finds (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    egg_id      uuid        NOT NULL REFERENCES public.easter_eggs(id) ON DELETE RESTRICT,
    found_at    timestamptz NOT NULL DEFAULT now(),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

-- EE-06 idempotency: one live find per user per egg.
CREATE UNIQUE INDEX idx_user_egg_finds_user_egg
    ON public.user_egg_finds (user_id, egg_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_egg_finds_recent
    ON public.user_egg_finds (found_at DESC) WHERE deleted_at IS NULL;

CREATE TRIGGER user_egg_finds_set_updated_at
    BEFORE UPDATE ON public.user_egg_finds
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.user_egg_achievements (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    season        integer     NOT NULL DEFAULT 1,
    achieved_at   timestamptz NOT NULL DEFAULT now(),
    email_sent_at timestamptz,                        -- once-only congrats email guard
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz
);

CREATE UNIQUE INDEX idx_user_egg_achievements_user_season
    ON public.user_egg_achievements (user_id, season) WHERE deleted_at IS NULL;

CREATE TRIGGER user_egg_achievements_set_updated_at
    BEFORE UPDATE ON public.user_egg_achievements
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Rule 38 / D-547: RLS on, zero policies. MCP service role bypasses; anon denied.
ALTER TABLE public.easter_eggs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_egg_finds        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_egg_achievements ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.easter_eggs IS
    'Easter Egg Hunt definitions (spec docs/easter-egg-spec.md). Ten active eggs, '
    'each keyed to a screen (placement_key). egg_name is feature-only; location_detail '
    'is admin/reference only. MCP-only; RLS deny-all.';
