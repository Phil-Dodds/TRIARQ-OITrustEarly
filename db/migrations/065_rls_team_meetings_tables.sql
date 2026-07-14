-- 065_rls_team_meetings_tables.sql
-- Pathways OI Trust — SECURITY FIX (Supabase advisory 2026-07-12/14:
-- rls_disabled_in_public, project TRIARQ-OITrustEarly).
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- Migrations 055/056/059/061 created the Team Meetings and Roadmap Themes
-- tables WITHOUT Row-Level Security. The public anon key ships in the Angular
-- bundle, so until this runs, anyone who extracts it can read/write these
-- tables directly through PostgREST.
--
-- Fix: ENABLE RLS with NO anon/authenticated policies = deny-all from the
-- public API. This is deliberate and matches Arch-1 (MCP-only database
-- access): every legitimate read/write of these tables goes through the MCP
-- servers using the service-role key, which BYPASSES RLS — the application
-- is unaffected. (Differs from migration 031's per-user policies because
-- these tables are never accessed with the user's own JWT.)

ALTER TABLE public.team_meetings                ENABLE ROW LEVEL SECURITY;  -- 055
ALTER TABLE public.team_meeting_sections        ENABLE ROW LEVEL SECURITY;  -- 055
ALTER TABLE public.team_meeting_bullets         ENABLE ROW LEVEL SECURITY;  -- 055
ALTER TABLE public.team_meeting_notes           ENABLE ROW LEVEL SECURITY;  -- 055
ALTER TABLE public.team_meeting_tracks          ENABLE ROW LEVEL SECURITY;  -- 056
ALTER TABLE public.team_meeting_track_members   ENABLE ROW LEVEL SECURITY;  -- 056
ALTER TABLE public.team_meeting_section_catalog ENABLE ROW LEVEL SECURITY;  -- 056
ALTER TABLE public.team_meeting_track_sections  ENABLE ROW LEVEL SECURITY;  -- 056
ALTER TABLE public.team_meeting_views           ENABLE ROW LEVEL SECURITY;  -- 059
ALTER TABLE public.roadmap_themes               ENABLE ROW LEVEL SECURITY;  -- 061

-- No CREATE POLICY statements: with RLS enabled and zero policies, anon and
-- authenticated roles are denied everything; service_role (MCP servers)
-- bypasses RLS and continues to work unchanged.
