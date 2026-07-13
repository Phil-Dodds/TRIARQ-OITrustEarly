-- 060_gate_submission_note.sql
-- Pathways OI Trust — D-489 Gate Submission Justification Note
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- Free-text "Why is this gate ready?" captured at gate submission. Encouraged,
-- not required. Set only by submit_gate_for_approval (a re-submission is a new
-- submission and overwrites); never editable through any other path.
-- Visible to the Accountable approver (above the Consulted Summary, D-461) and
-- all Consulted parties; truncated one line in the Action Queue.

ALTER TABLE gate_records
  ADD COLUMN IF NOT EXISTS submission_note text;

-- Verification:
-- SELECT gate_name, submission_note FROM gate_records WHERE submission_note IS NOT NULL;
