-- 070_news_banner_reactions.sql
-- Pathways OI Trust — reactions on the bottom news banner items.
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- One row per (news item, emoji, user). news_item_key is a stable composite id
-- for a banner item: '<kind>:<source_row_id>' (e.g. 'gate:<cycle_event_log.id>',
-- 'egg:<user_egg_finds.id>'). Emoji stored as a short CODE, not a unicode glyph,
-- so the TRIARQ Q reaction works alongside heart/clap. MCP-only; RLS deny-all.
--
-- Deliberately specific name (not a generic "activity_*") so it doesn't muddy
-- later schema analysis.
--
-- Must run after: 069_seed_easter_eggs.sql

CREATE TABLE IF NOT EXISTS public.news_banner_reactions (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    news_item_key text        NOT NULL,               -- '<kind>:<source_row_id>'
    emoji         text        NOT NULL                -- reaction code
                              CHECK (emoji IN ('heart', 'clap', 'triarq')),
    user_id       uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz
);

-- One live reaction of each emoji per user per item (toggle re-inserts after a
-- soft delete, so uniqueness is scoped to live rows).
CREATE UNIQUE INDEX idx_news_banner_reactions_unique
    ON public.news_banner_reactions (news_item_key, emoji, user_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_news_banner_reactions_key
    ON public.news_banner_reactions (news_item_key)
    WHERE deleted_at IS NULL;

CREATE TRIGGER news_banner_reactions_set_updated_at
    BEFORE UPDATE ON public.news_banner_reactions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Rule 38 / D-547: RLS on, zero policies. Service role bypasses; anon denied.
ALTER TABLE public.news_banner_reactions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.news_banner_reactions IS
    'Emoji reactions on bottom news-banner items. news_item_key = <kind>:<source_row_id>. '
    'emoji is a code (heart/clap/triarq). Reactions live with the event and age out of '
    'view when the item leaves the banner window. MCP-only; RLS deny-all.';
