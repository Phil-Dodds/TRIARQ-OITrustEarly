-- 013_create_notifications.sql
-- Pathways OI Trust — Build A
-- User notifications. dismissed_at IS NULL means the notification is active.
-- Users must explicitly dismiss — no auto-expiry in Build A.
-- Must run after: 001_create_users.sql, 007_create_artifacts.sql,
--                 011_create_approval_workflows.sql

CREATE TABLE IF NOT EXISTS public.notifications (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    notification_type text        NOT NULL,
    artifact_id       uuid        REFERENCES public.artifacts(id) ON DELETE RESTRICT,
    workflow_id       uuid        REFERENCES public.approval_workflows(id) ON DELETE RESTRICT,
    notification_body text        NOT NULL,
    dismissed_at      timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz
);

CREATE TRIGGER notifications_set_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.notifications IS
    'User inbox notifications. dismissed_at IS NULL = active/unread. '
    'notification_type examples: approval_requested, item_decided, item_seeded. '
    'artifact_id and workflow_id are nullable for system-level notifications.';

COMMENT ON COLUMN public.notifications.dismissed_at IS
    'Set when user explicitly dismisses. NULL means active. '
    'MyNotificationsCard queries WHERE dismissed_at IS NULL AND deleted_at IS NULL.';
