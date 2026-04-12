-- 028_add_not_started_to_gate_status_check.sql
-- Pathways OI Trust — Build C Contract 5
-- Adds 'not_started' to the gate_records_gate_status_check constraint.
-- Required by D-282: gate records are seeded with 'not_started' on new cycle creation.
-- Existing records seeded with 'pending' are unaffected — 'pending' remains valid.
-- CC-Decision-2026-04-12-B: gate_status seed changed from 'pending' to 'not_started'.

ALTER TABLE public.gate_records
  DROP CONSTRAINT gate_records_gate_status_check;

ALTER TABLE public.gate_records
  ADD CONSTRAINT gate_records_gate_status_check
  CHECK (gate_status IN ('not_started', 'pending', 'approved', 'returned', 'blocked'));

COMMENT ON COLUMN public.gate_records.gate_status IS
  'Gate lifecycle status. not_started = seeded state on new cycle; pending = submitted for review; '
  'approved = gate cleared; returned = sent back; blocked = hard block. Source: D-282.';
