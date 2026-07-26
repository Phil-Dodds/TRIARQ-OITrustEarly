-- 089_gate_assessments.sql
-- Contract GA-1 (D-579) — Gate Assessments (coaching grades) + per-gate
-- best-practices link config.
-- One row per item per respondent per attempt. Attempts use the D-578
-- cleared-never-deleted pattern (cleared_by_return_at / cleared_by_event_id):
-- active attempt = rows with cleared_by_return_at IS NULL; a return/withdraw
-- stamps the active rows, never deletes them.
-- RLS enabled deny-all (Rule 38) — MCP-only tables, service role bypasses.

BEGIN;

CREATE TABLE gate_assessments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_cycle_id    uuid NOT NULL REFERENCES delivery_cycles(delivery_cycle_id),
  gate_key             text NOT NULL CHECK (gate_key IN
                         ('brief_review','go_to_build','go_to_deploy','go_to_release','close_review')),
  respondent_user_id   uuid NOT NULL REFERENCES users(id),
  respondent_role      text NOT NULL CHECK (respondent_role IN
                         ('submitter','trio_member','consulted','approver')),
  item_key             text NOT NULL,
  grade                text NOT NULL CHECK (grade IN ('A','B','C','D','NA')),
  comment              text NULL,
  -- D-578 clearing pattern: a return (or withdraw) stamps active rows.
  cleared_by_return_at timestamptz NULL,
  cleared_by_event_id  uuid NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz NULL
);

-- One active row per item per respondent per gate per cycle (attempt-scoped
-- uniqueness — cleared rows belong to prior attempts and fall out of the index).
CREATE UNIQUE INDEX gate_assessments_active_uniq
  ON gate_assessments (delivery_cycle_id, gate_key, respondent_user_id, item_key)
  WHERE cleared_by_return_at IS NULL AND deleted_at IS NULL;

CREATE INDEX gate_assessments_cycle_gate_idx
  ON gate_assessments (delivery_cycle_id, gate_key);

ALTER TABLE gate_assessments ENABLE ROW LEVEL SECURITY;

-- Per-gate "Full best practices" link (GA-1 §2). Blank/NULL url = link hidden.
CREATE TABLE gate_coaching_links (
  gate_key   text PRIMARY KEY CHECK (gate_key IN
               ('brief_review','go_to_build','go_to_deploy','go_to_release','close_review')),
  url        text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO gate_coaching_links (gate_key, url) VALUES
  ('brief_review',  NULL),
  ('go_to_build',   NULL),
  ('go_to_deploy',  NULL),
  ('go_to_release', NULL),
  ('close_review',  NULL);

ALTER TABLE gate_coaching_links ENABLE ROW LEVEL SECURITY;

COMMIT;
