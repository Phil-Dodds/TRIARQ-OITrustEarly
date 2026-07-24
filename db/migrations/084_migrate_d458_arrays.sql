-- 084_migrate_d458_arrays.sql
-- Pathways OI Trust — Contract G4 (governance redesign, D-564 / D-458 retirement)
-- Migrates the D-458 participant arrays (other_consulted_user_ids,
-- other_informed_user_ids) on delivery_cycles into participation_records
-- (Contract G1, migration 082), then annotates the columns retired.
-- CC-G4 lean: columns are ANNOTATED RETIRED, not dropped (D-252 compatibility;
-- drop timing is a Design decision at GEnd).
-- set_by_user_id provenance is unknowable from the arrays — attributed to the
-- cycle's assigned DCS, else the Division owner, else Phil (CC-G4 lean).
-- Idempotent: re-running skips stakes that already exist as active rows.
-- ⚠ Do NOT execute via Code. Phil executes against Supabase (preview env first
--   per D-575 — production receives GEnd deployment only).
-- Must run after: 082_participation_tables.sql

BEGIN;

WITH attribution AS (
  SELECT
    dc.delivery_cycle_id,
    COALESCE(
      dc.assigned_dcs_user_id,
      d.owner_user_id,
      (SELECT u.id FROM public.users u
        WHERE u.is_super_admin = true AND u.deleted_at IS NULL LIMIT 1)
    ) AS set_by_user_id
  FROM public.delivery_cycles dc
  LEFT JOIN public.divisions d ON d.id = dc.division_id AND d.deleted_at IS NULL
  WHERE dc.deleted_at IS NULL
),
consulted AS (
  SELECT dc.delivery_cycle_id, unnest(dc.other_consulted_user_ids) AS holder_user_id, 'C'::text AS letter
  FROM public.delivery_cycles dc
  WHERE dc.deleted_at IS NULL AND array_length(dc.other_consulted_user_ids, 1) > 0
),
informed AS (
  SELECT dc.delivery_cycle_id, unnest(dc.other_informed_user_ids) AS holder_user_id, 'I'::text AS letter
  FROM public.delivery_cycles dc
  WHERE dc.deleted_at IS NULL AND array_length(dc.other_informed_user_ids, 1) > 0
),
combined AS (
  SELECT * FROM consulted UNION ALL SELECT * FROM informed
)
INSERT INTO public.participation_records
  (delivery_cycle_id, letter, holder_user_id, set_via, set_by_user_id)
SELECT c.delivery_cycle_id, c.letter, c.holder_user_id, 'trio', a.set_by_user_id
FROM combined c
JOIN attribution a ON a.delivery_cycle_id = c.delivery_cycle_id
JOIN public.users u ON u.id = c.holder_user_id AND u.deleted_at IS NULL
WHERE a.set_by_user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.participation_records pr
  WHERE pr.delivery_cycle_id = c.delivery_cycle_id
    AND pr.letter = c.letter
    AND pr.holder_user_id = c.holder_user_id
    AND pr.removed_at IS NULL
);

-- Retirement annotation (columns kept for compatibility; no code path reads
-- them after Contract G4 — verified by grep in the G2–G4 CodeClose).
COMMENT ON COLUMN public.delivery_cycles.other_consulted_user_ids IS
  'RETIRED (Contract G4, 2026-07-23). Migrated to participation_records '
  '(letter C) by migration 084. No code path reads or writes this column. '
  'Drop timing: Design decision at GEnd.';
COMMENT ON COLUMN public.delivery_cycles.other_informed_user_ids IS
  'RETIRED (Contract G4, 2026-07-23). Migrated to participation_records '
  '(letter I) by migration 084. No code path reads or writes this column. '
  'Drop timing: Design decision at GEnd.';

COMMIT;
