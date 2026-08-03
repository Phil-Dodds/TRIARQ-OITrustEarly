-- 098_manager_relation_notification_queue.sql
-- Pathways OI Trust — Contract 45 (D-638, D-642).
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- Two objects, both foundational to Contract 45:
--   1. users.manager_user_id — the in-line manager relation (D-638)
--   2. notification_queue    — replaces direct Edge Function invocation (D-642)
--
-- ─────────────────────────────────────────────────────────────────────────────
-- SPEC CORRECTION (flagged, not silently applied)
-- ─────────────────────────────────────────────────────────────────────────────
-- The Contract 45 spec writes the FK as `REFERENCES users(user_id)`. There is
-- no `user_id` column on public.users — its primary key is `id`, confirmed
-- against the live schema on 2026-08-02 (docs/schema-summary.md). Written here
-- as REFERENCES users(id); as specified it would fail at execution.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Manager relation — D-638
-- ─────────────────────────────────────────────────────────────────────────────
-- INTERIM DEMO PATTERN per the D-353 posture. This column is replaced by the
-- TRIARQ infrastructure org model at port time. It is deliberately a single
-- nullable self-reference rather than an org-structure table: the demo needs
-- "who does this person report to", not a history-bearing hierarchy.
--
-- ON DELETE SET NULL: Arch-6 means users are soft-deleted, so this should never
-- fire. It is here so that a hard delete performed directly against the
-- database during a demo reset cannot leave a dangling manager pointer.
--
-- NOTE: a self-referencing FK does NOT prevent reporting loops (A→B→A is
-- perfectly valid to Postgres). Cycle prevention is APPLICATION-LAYER, in
-- update_user, which walks the chain on write. See D-638 and the guard in
-- mcp/division-mcp/src/tools/update_user.js.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS manager_user_id uuid NULL
    REFERENCES public.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.users.manager_user_id IS
  'In-line manager (D-638, Contract 45). Interim demo pattern per D-353 — '
  'replaced by the TRIARQ infrastructure org model at port. Grants visibility '
  'and voice, never authority (D-640): the manager is not an oversight setter '
  '(D-561), not a level setter (D-562), and never a gate approver by virtue of '
  'this relation. Reporting-loop prevention is application-layer in update_user.';

-- Managers are looked up by "who reports to me" on every My-team filter and on
-- every notification fan-out write, so the reverse direction needs an index.
CREATE INDEX IF NOT EXISTS idx_users_manager_user_id
  ON public.users (manager_user_id)
  WHERE manager_user_id IS NOT NULL AND deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Notification queue — D-642
-- ─────────────────────────────────────────────────────────────────────────────
-- Every MCP trigger writes a row here instead of invoking send-notification-email
-- directly. Immediate rows dispatch on write through the existing D-467 Edge
-- Function (provider, template and CTA unchanged); digest rows accumulate for
-- the 06:00 ET job (D-643).
--
-- headline and detail are rendered at WRITE time, not send time. The event's
-- facts are true when it happens; re-deriving them at 06:00 risks describing a
-- state that has since changed. This is the D-463 stored-at-submission pattern
-- applied to messages.

CREATE TABLE IF NOT EXISTS public.notification_queue (
  notification_id    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  recipient_user_id  uuid        NOT NULL REFERENCES public.users(id),
  event_type         text        NOT NULL,
  delivery_class     text        NOT NULL
                                 CHECK (delivery_class IN ('immediate', 'digest')),

  -- Subject of the message. initiative_id is nullable because a few events
  -- (stake removal on a cancelled Initiative, future account-level notices)
  -- are not anchored to a live Initiative.
  initiative_id      uuid        NULL REFERENCES public.delivery_cycles(delivery_cycle_id),
  gate_record_id     uuid        NULL REFERENCES public.gate_records(gate_record_id),
  actor_user_id      uuid        NULL REFERENCES public.users(id),

  -- Rendered at write time. headline is the digest line; detail carries the
  -- reason / note / condition text where the event has one.
  headline           text        NOT NULL,
  detail             text        NULL,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  -- sent_at: stamped when the row actually goes out (immediately, or in a
  -- digest). suppressed_at: stamped when the digest job drops the line because
  -- the state it describes has resolved (D-643). A row has at most one of them.
  sent_at            timestamptz NULL,
  suppressed_at      timestamptz NULL
);

COMMENT ON TABLE public.notification_queue IS
  'Contract 45 (D-642). Every notification trigger writes here; MCP tools no '
  'longer invoke send-notification-email directly. Headlines render at write '
  'time (D-463 pattern). delivery_class follows the D-565(4) waiting-on line '
  'per D-641 — waiting-on recipients are immediate, awareness parties digest.';

-- The digest job's only query: unsent digest rows for one recipient. The
-- partial index keeps it off the growing tail of already-sent history.
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending
  ON public.notification_queue (recipient_user_id, delivery_class, created_at)
  WHERE sent_at IS NULL AND suppressed_at IS NULL;

-- Rule 38: RLS on from creation. Deny-all (zero policies) is the correct
-- default for an MCP-only table — the service role bypasses RLS (Arch-1), so
-- the application is unaffected. These rows are never read under a user JWT.
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
