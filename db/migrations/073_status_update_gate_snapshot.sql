-- 073_status_update_gate_snapshot.sql
-- Pathways OI Trust — session 2026-07-16 (CC-38-30)
-- Snapshot the next gate and its resolved visual status onto each status
-- update at save time. Drives the second headline section's color and the
-- "as of [gate]" staleness indicator on status views — a status posted when
-- Brief Review was next reads "as of Brief Review" once the initiative moves
-- on, nudging the trio to refresh.
--
-- next_gate_status_token values: submitted | not_started | on_track | at_risk
-- | behind | complete (user D-205 vocabulary plus the submission state).
-- Existing rows stay NULL — status views render neutral until the next update.

ALTER TABLE initiative_status_updates
  ADD COLUMN next_gate_name         text,
  ADD COLUMN next_gate_status_token text;
