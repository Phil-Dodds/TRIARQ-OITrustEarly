-- 099_notification_queue_manager_copy.sql
-- Pathways OI Trust — Contract 45 Unit D (D-643, D-642).
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- WHY THIS EXISTS
-- The D-643 digest has ten fixed sections, and two of them — "Waiting on you"
-- and "Waiting on your team" — carry the SAME event_type. What separates them
-- is only whether the row is the participant's own notification or the parallel
-- manager copy written by the D-642 fan-out.
--
-- notification_queue as created in 098 cannot answer that. The fan-out is
-- distinguishable today only by the "Name — " prefix the helper puts on the
-- manager headline, which is presentation text: it would work until the first
-- person reworded a headline, and then the digest would silently file manager
-- copies under "Waiting on you". A boolean is the honest signal.
--
-- Default false, so every row written by 098-era code (and every direct
-- notification thereafter) is correctly a non-manager row without a backfill.

ALTER TABLE public.notification_queue
  ADD COLUMN IF NOT EXISTS manager_copy boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.notification_queue.manager_copy IS
  'True when this row is the D-642 parallel copy written to a recipient''s '
  'manager rather than the recipient''s own notification. Drives the D-643 '
  'digest split between "Waiting on you" and "Waiting on your team". Manager '
  'copies are always delivery_class = digest and are never written for the '
  'four loud exceptions (D-641).';

-- The digest job reads one recipient's unsent rows and splits them by this
-- flag, so it belongs in the existing pending index rather than its own.
DROP INDEX IF EXISTS idx_notification_queue_pending;
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending
  ON public.notification_queue (recipient_user_id, delivery_class, manager_copy, created_at)
  WHERE sent_at IS NULL AND suppressed_at IS NULL;
