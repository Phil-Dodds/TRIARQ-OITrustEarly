-- 092_sizing_idk.sql
-- Contract 40 WS2 (D-598, amends D-558): "I don't know" (idk) is a first-class
-- sizing answer on Q1 Investment, Q2 Novelty, Q3 If-wrong — distinct from
-- unanswered (null). It derives to the cautious value (Q1→Large, Q2→Major,
-- Q3→Significant), each a Level 2 floor, so any IDK forces Level 2 minimum.
-- Q4/Q5 and all sub-chips are NOT extended (an unsure Q4/Q5 resolves to
-- Yes/Critical client-side; there is no stored 'idk' on those).
--
-- ⚠ Do NOT execute via Code. Phil executes.
-- Must run after: 091_cast_confirmation_outcome_verdict.sql.
--
-- The 080 CHECK constraints are inline/unnamed → Postgres auto-named them
-- '<table>_<column>_check'. Drop-and-readd with the extended value set.
-- No new column, no RLS change (existing table, deny-all, MCP service-role only
-- per D-547). Existing rows are unaffected — 'idk' is additive.

BEGIN;

ALTER TABLE public.initiative_sizing
  DROP CONSTRAINT IF EXISTS initiative_sizing_q1_investment_check;
ALTER TABLE public.initiative_sizing
  ADD CONSTRAINT initiative_sizing_q1_investment_check
  CHECK (q1_investment IN ('small','medium','large','xlarge','idk'));

ALTER TABLE public.initiative_sizing
  DROP CONSTRAINT IF EXISTS initiative_sizing_q2_novelty_check;
ALTER TABLE public.initiative_sizing
  ADD CONSTRAINT initiative_sizing_q2_novelty_check
  CHECK (q2_novelty IN ('standard','major','idk'));

ALTER TABLE public.initiative_sizing
  DROP CONSTRAINT IF EXISTS initiative_sizing_q3_wrongness_check;
ALTER TABLE public.initiative_sizing
  ADD CONSTRAINT initiative_sizing_q3_wrongness_check
  CHECK (q3_wrongness IN ('contained','significant','large_hard','idk'));

COMMENT ON COLUMN public.initiative_sizing.q1_investment IS
  'D-598 (Contract 40): small|medium|large|xlarge|idk. idk = deliberate "not yet known", derives as Large (Level 2 floor); distinct from null (unsized).';
COMMENT ON COLUMN public.initiative_sizing.q2_novelty IS
  'D-598 (Contract 40): standard|major|idk. idk derives as Major (Level 2 floor).';
COMMENT ON COLUMN public.initiative_sizing.q3_wrongness IS
  'D-598 (Contract 40): contained|significant|large_hard|idk. idk derives as Significant (Level 2 floor).';

COMMIT;
