-- repair_stranded_stages_2026-07-26.sql
-- Phil ruling 2026-07-26: an approved gate graduates the Initiative to the
-- stage after the gate. The old transition only advanced when the cycle sat
-- exactly one stage before the target (prevStageOf), silently stranding
-- stages behind approved gates whenever intermediate manual stages (Spec,
-- Validate, UAT) were skipped. Code fixed in record_gate_decision; this
-- repairs existing production rows. Forward-only; CANCELLED/held/deleted
-- untouched; unknown stages map to NULL and are skipped.

-- 1) PREVIEW — run first; each row is a cycle whose stage lags its gates.
WITH latest_gate AS (
  SELECT delivery_cycle_id,
         MAX(CASE gate_name
               WHEN 'brief_review'  THEN 1
               WHEN 'go_to_build'   THEN 2
               WHEN 'go_to_deploy'  THEN 3
               WHEN 'go_to_release' THEN 4
               WHEN 'close_review'  THEN 5
             END) AS g
  FROM gate_records
  WHERE gate_status = 'approved' AND deleted_at IS NULL
  GROUP BY delivery_cycle_id
),
target AS (
  SELECT delivery_cycle_id,
         CASE g WHEN 1 THEN 'DESIGN' WHEN 2 THEN 'BUILD' WHEN 3 THEN 'PILOT'
                WHEN 4 THEN 'RELEASE' WHEN 5 THEN 'COMPLETE' END AS target_stage
  FROM latest_gate
)
SELECT dc.delivery_cycle_id, dc.cycle_title,
       dc.current_lifecycle_stage AS stage_now, t.target_stage
FROM delivery_cycles dc
JOIN target t ON t.delivery_cycle_id = dc.delivery_cycle_id
WHERE dc.deleted_at IS NULL
  AND dc.current_lifecycle_stage NOT IN ('CANCELLED', 'COMPLETE')
  AND (CASE dc.current_lifecycle_stage
         WHEN 'BRIEF' THEN 1 WHEN 'DESIGN' THEN 2 WHEN 'SPEC' THEN 3
         WHEN 'BUILD' THEN 4 WHEN 'VALIDATE' THEN 5 WHEN 'UAT' THEN 6
         WHEN 'PILOT' THEN 7 WHEN 'RELEASE' THEN 8 WHEN 'OUTCOME' THEN 9
         WHEN 'COMPLETE' THEN 10 END)
    < (CASE t.target_stage
         WHEN 'DESIGN' THEN 2 WHEN 'BUILD' THEN 4 WHEN 'PILOT' THEN 7
         WHEN 'RELEASE' THEN 8 WHEN 'COMPLETE' THEN 10 END)
ORDER BY dc.cycle_title;

-- 2) REPAIR — run after reviewing the preview.
WITH latest_gate AS (
  SELECT delivery_cycle_id,
         MAX(CASE gate_name
               WHEN 'brief_review'  THEN 1
               WHEN 'go_to_build'   THEN 2
               WHEN 'go_to_deploy'  THEN 3
               WHEN 'go_to_release' THEN 4
               WHEN 'close_review'  THEN 5
             END) AS g
  FROM gate_records
  WHERE gate_status = 'approved' AND deleted_at IS NULL
  GROUP BY delivery_cycle_id
),
target AS (
  SELECT delivery_cycle_id,
         CASE g WHEN 1 THEN 'DESIGN' WHEN 2 THEN 'BUILD' WHEN 3 THEN 'PILOT'
                WHEN 4 THEN 'RELEASE' WHEN 5 THEN 'COMPLETE' END AS target_stage
  FROM latest_gate
)
UPDATE delivery_cycles dc
SET current_lifecycle_stage = t.target_stage,
    updated_at = now()
FROM target t
WHERE dc.delivery_cycle_id = t.delivery_cycle_id
  AND dc.deleted_at IS NULL
  AND dc.current_lifecycle_stage NOT IN ('CANCELLED', 'COMPLETE')
  AND (CASE dc.current_lifecycle_stage
         WHEN 'BRIEF' THEN 1 WHEN 'DESIGN' THEN 2 WHEN 'SPEC' THEN 3
         WHEN 'BUILD' THEN 4 WHEN 'VALIDATE' THEN 5 WHEN 'UAT' THEN 6
         WHEN 'PILOT' THEN 7 WHEN 'RELEASE' THEN 8 WHEN 'OUTCOME' THEN 9
         WHEN 'COMPLETE' THEN 10 END)
    < (CASE t.target_stage
         WHEN 'DESIGN' THEN 2 WHEN 'BUILD' THEN 4 WHEN 'PILOT' THEN 7
         WHEN 'RELEASE' THEN 8 WHEN 'COMPLETE' THEN 10 END);
