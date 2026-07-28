-- 093_tier_classification_drop_notnull.sql
-- HOTFIX (Contract 40 follow-on): Contract 39 (D-583) retired tier_classification
-- and stopped the app from writing it, but the column was created NOT NULL in
-- migration 017 and migration 091 only annotated it retired (COMMENT) — it never
-- dropped the constraint. Result: every new initiative insert fails with
-- "null value in column tier_classification violates not-null constraint".
--
-- Fix: drop NOT NULL. New rows get null (tier is retired — never written again,
-- D-583); historical values are untouched; the physical column drop still joins
-- the scheduled GEnd+1 batch. The existing CHECK (tier IN tier_1/2/3) already
-- admits NULL, so no CHECK change is needed.
--
-- ⚠ Do NOT execute via Code. Phil executes.
-- Must run after: 092_sizing_idk.sql. No RLS change (existing table).

BEGIN;

ALTER TABLE public.delivery_cycles
  ALTER COLUMN tier_classification DROP NOT NULL;

COMMIT;
