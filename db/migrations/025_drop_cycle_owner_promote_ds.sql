-- 025_drop_cycle_owner_promote_ds.sql
-- Pathways OI Trust — Build C
-- Removes cycle_owner_user_id from delivery_cycles.
--
-- Background (CC-006 / Session 2026-04-04):
-- cycle_owner_user_id is the same person as assigned_ds_user_id.
-- The distinction was unnecessary. assigned_ds_user_id (migration 024) is the correct
-- field — it is specific, named per R6 (no bare generic nouns), and consistent with
-- the DS/CB assignment pattern. cycle_owner was a legacy of the original data model.
--
-- Migration logic:
-- Step 1: For any cycle where assigned_ds_user_id is NULL but cycle_owner_user_id is NOT NULL,
--         copy cycle_owner into assigned_ds before the column is dropped. This preserves
--         any data entered prior to this migration.
-- Step 2: Drop cycle_owner_user_id.
--
-- Gate enforcement reminder (CC-006):
-- assigned_ds_user_id is nullable at creation. DS assignment is required before
-- Brief Review gate can be submitted (enforced in submit_gate_for_approval.js MCP tool).
-- assigned_cb_user_id is nullable at creation. CB assignment is required before
-- Go to Build gate can be submitted.
-- Neither field uses a DB NOT NULL constraint — enforcement lives in the MCP layer.
-- This matches the workstream pattern (D-165, ARCH-23).
--
-- Phil must run this in Supabase SQL editor before the MCP changes go live.

-- Step 1: Carry forward any cycle owner data that hasn't been migrated to assigned_ds yet
UPDATE delivery_cycles
SET assigned_ds_user_id = cycle_owner_user_id
WHERE assigned_ds_user_id IS NULL
  AND cycle_owner_user_id IS NOT NULL
  AND deleted_at IS NULL;

-- Step 2: Drop the now-redundant column
ALTER TABLE delivery_cycles
  DROP COLUMN IF EXISTS cycle_owner_user_id;
