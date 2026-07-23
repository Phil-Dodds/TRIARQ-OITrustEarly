-- 080_initiative_sizing.sql
-- Pathways OI Trust — Contract G1 (governance redesign schema foundation)
-- Primitive 1 — Sizing answers (D-558, D-567).
-- One row per Initiative (delivery cycle). Five direct answers are NOT NULL at
-- row creation; sub-answers and Other-notes are nullable, stored queryable
-- (guide/alert only — they never enter the derivation).
-- Absence of a row = the "not yet sized" state (D-567). Do NOT backfill
-- existing Initiatives — sizing is captured at next gate per D-567 flow (G3).
-- The Contract 38 "Includes AI functionality" fields on delivery_cycles are
-- untouched and remain the AI Production Board trigger.
-- ⚠ Do NOT execute via Code. Phil executes against Supabase.
-- Must run after: 017_create_delivery_cycles.sql, 001_create_users.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.initiative_sizing (
    delivery_cycle_id   uuid PRIMARY KEY
                        REFERENCES public.delivery_cycles(delivery_cycle_id) ON DELETE CASCADE,

    -- Q1 Investment
    q1_investment       text NOT NULL CHECK (q1_investment IN ('small','medium','large','xlarge')),
    q1_sub_engineering  text NULL CHECK (q1_sub_engineering IN ('small','medium','large','xlarge')),
    q1_sub_operational  text NULL CHECK (q1_sub_operational IN ('small','medium','large','xlarge')),
    q1_note             text NULL,

    -- Q2 Novelty
    q2_novelty          text NOT NULL CHECK (q2_novelty IN ('standard','major')),
    q2_sub_persona      text NULL CHECK (q2_sub_persona IN ('well_known','new')),
    q2_sub_scenarios    text NULL CHECK (q2_sub_scenarios IN ('highly_studied','in_discovery')),
    q2_sub_technology   text NULL CHECK (q2_sub_technology IN ('standard','new_untried')),
    q2_sub_new_vendor   boolean NULL,
    q2_note             text NULL,

    -- Q3 If wrong
    q3_wrongness        text NOT NULL CHECK (q3_wrongness IN ('contained','significant','large_hard')),
    q3_sub_blast        text NULL CHECK (q3_sub_blast IN ('contained_internal','external_large')),
    q3_sub_correctable  text NULL CHECK (q3_sub_correctable IN ('easy','difficult')),
    q3_note             text NULL,

    -- Q4 Security impact
    q4_security_impact  boolean NOT NULL,
    q4_note             text NULL,

    -- Q5 UX involvement
    q5_ux               text NOT NULL CHECK (q5_ux IN ('standard','critical')),
    q5_sub_facing       text NULL CHECK (q5_sub_facing IN ('none','patient','provider_clinical')),
    q5_sub_application  text NULL CHECK (q5_sub_application IN ('established','new_application')),
    q5_note             text NULL,

    -- provenance
    answered_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    answered_at         timestamptz NOT NULL DEFAULT now(),
    updated_by_user_id  uuid NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    updated_at          timestamptz NULL,

    -- CC-G1: created_at added beyond spec column list per CLAUDE.md database
    -- standard (created_at on every new table). answered_at is the domain
    -- timestamp; created_at is the row-audit timestamp.
    created_at          timestamptz NOT NULL DEFAULT now()
);

-- No set_updated_at trigger: updated_at here is a provenance pair with
-- updated_by_user_id, written explicitly by upsert_initiative_sizing only on
-- edits (NULL = never edited since first answer). A DEFAULT-now() trigger
-- would destroy that meaning.

-- Rule 38 / D-353: RLS enabled, zero policies = deny-all. All reads and writes
-- go through MCP tools under the service role (Arch-1), which bypasses RLS.
ALTER TABLE public.initiative_sizing ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.initiative_sizing IS
    'Contract G1 (D-558) — sizing answers, one row per Initiative. Five direct '
    'answers (q1_investment, q2_novelty, q3_wrongness, q4_security_impact, q5_ux) '
    'drive baseline governance level derivation; subs and notes guide/alert only. '
    'No row = not yet sized (D-567). Never backfilled. Read via get_initiative_sizing; '
    'written via upsert_initiative_sizing.';

COMMENT ON COLUMN public.initiative_sizing.updated_at IS
    'NULL until the sizing is edited after first answer. Written explicitly by '
    'upsert_initiative_sizing together with updated_by_user_id.';

COMMIT;
