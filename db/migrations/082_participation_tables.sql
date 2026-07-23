-- 082_participation_tables.sql
-- Pathways OI Trust — Contract G1 (governance redesign schema foundation)
-- Primitive 3 — Participation records (D-563, D-564).
-- Four tables: specialty_groups (+ seed), specialty_group_members,
-- participation_records (the C and I letters), division_default_consulteds.
-- These supersede the D-458 arrays in behavior at G4 — the arrays
-- (other_consulted_user_ids / other_informed_user_ids) remain untouched in G1.
-- Initiative-level C → per-gate gate_consultations wiring is G4; G1 creates
-- tables only.
-- ⚠ Do NOT execute via Code. Phil executes against Supabase.
-- Must run after: 017_create_delivery_cycles.sql, 002_create_divisions.sql

BEGIN;

-- ── specialty_groups ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.specialty_groups (
    group_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name    text NOT NULL UNIQUE,
    active_status boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER specialty_groups_set_updated_at
    BEFORE UPDATE ON public.specialty_groups
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.specialty_groups ENABLE ROW LEVEL SECURITY;

-- Seed the four launch groups (D-563).
INSERT INTO public.specialty_groups (group_name)
VALUES ('Security'), ('UX'), ('Compliance'), ('IT/Infrastructure')
ON CONFLICT (group_name) DO NOTHING;

-- ── specialty_group_members ──────────────────────────────────────────────────
-- CC-G1: deleted_at added beyond spec column list — Arch-6 (soft delete only);
-- remove_specialty_group_member sets deleted_at, never DELETEs.
CREATE TABLE IF NOT EXISTS public.specialty_group_members (
    group_id   uuid NOT NULL REFERENCES public.specialty_groups(group_id) ON DELETE CASCADE,
    user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL,
    PRIMARY KEY (group_id, user_id)
);

CREATE TRIGGER specialty_group_members_set_updated_at
    BEFORE UPDATE ON public.specialty_group_members
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.specialty_group_members ENABLE ROW LEVEL SECURITY;

-- ── participation_records — the C and I letters (D-564) ──────────────────────
-- Removal is soft: removed_at/removed_by_user_id (spec pattern — this IS the
-- Arch-6 soft-delete for this table; no separate deleted_at).
CREATE TABLE IF NOT EXISTS public.participation_records (
    record_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_cycle_id  uuid NOT NULL REFERENCES public.delivery_cycles(delivery_cycle_id) ON DELETE CASCADE,
    letter             text NOT NULL CHECK (letter IN ('C','I')),
    holder_user_id     uuid NULL REFERENCES public.users(id) ON DELETE CASCADE,
    holder_group_id    uuid NULL REFERENCES public.specialty_groups(group_id) ON DELETE CASCADE,
    set_via            text NOT NULL CHECK (set_via IN ('trio','self','rule','division_default','approver','leadership')),
    set_by_user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    removed_at         timestamptz NULL,
    removed_by_user_id uuid NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    removal_note       text NULL,
    -- exactly one of user/group set
    CONSTRAINT participation_records_holder_xor
        CHECK ((holder_user_id IS NULL) <> (holder_group_id IS NULL))
);

CREATE TRIGGER participation_records_set_updated_at
    BEFORE UPDATE ON public.participation_records
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_participation_records_cycle
    ON public.participation_records (delivery_cycle_id) WHERE removed_at IS NULL;
CREATE INDEX idx_participation_records_holder_user
    ON public.participation_records (holder_user_id) WHERE removed_at IS NULL;

ALTER TABLE public.participation_records ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.participation_records IS
    'Contract G1 (D-564) — Initiative-level Consulted/Informed stakes, user- or '
    'group-held. removal_note required when remover != holder (MCP-enforced). '
    'Active rows have removed_at IS NULL. Per-gate consultation wiring lands in G4.';

-- ── division_default_consulteds (D-563) ──────────────────────────────────────
-- CC-G1: spec declares no PK — default_consulted_id added (every table needs a
-- PK; remove tool addresses rows by it). deleted_at added per Arch-6.
CREATE TABLE IF NOT EXISTS public.division_default_consulteds (
    default_consulted_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id          uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    holder_user_id       uuid NULL REFERENCES public.users(id) ON DELETE CASCADE,
    holder_group_id      uuid NULL REFERENCES public.specialty_groups(group_id) ON DELETE CASCADE,
    created_by_user_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now(),
    deleted_at           timestamptz NULL,
    CONSTRAINT division_default_consulteds_holder_xor
        CHECK ((holder_user_id IS NULL) <> (holder_group_id IS NULL))
);

CREATE TRIGGER division_default_consulteds_set_updated_at
    BEFORE UPDATE ON public.division_default_consulteds
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_division_default_consulteds_division
    ON public.division_default_consulteds (division_id) WHERE deleted_at IS NULL;

ALTER TABLE public.division_default_consulteds ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.division_default_consulteds IS
    'Contract G1 (D-563) — Division default Consulted parties (user or group), '
    'attached to new Initiatives at creation from G4 onward. G1: tables + CRUD only.';

COMMIT;
