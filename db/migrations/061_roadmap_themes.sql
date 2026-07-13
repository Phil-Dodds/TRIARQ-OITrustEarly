-- 061_roadmap_themes.sql
-- Pathways OI Trust — D-487/D-488 Roadmap Themes
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- Division-scoped roadmap vocabulary. Initiatives optionally tag one theme.
-- Deactivate-only when referenced (D-437 pattern) — no hard delete path.
-- Admin management is Admin-only for now: the "Division Leader" role in D-487
-- does not exist as a concept in the schema (flagged to Design).

CREATE TABLE roadmap_themes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id  uuid        NOT NULL REFERENCES divisions(id) ON DELETE RESTRICT,
  name         text        NOT NULL,
  sort_order   int         NOT NULL DEFAULT 0,
  active       boolean     NOT NULL DEFAULT true,
  created_by   uuid        NOT NULL REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Unique active name per Division (deactivated names may be reused).
CREATE UNIQUE INDEX uq_roadmap_themes_division_name_active
  ON roadmap_themes (division_id, lower(name))
  WHERE active;

CREATE INDEX idx_roadmap_themes_division
  ON roadmap_themes (division_id)
  WHERE active;

-- Optional theme tag on initiatives.
ALTER TABLE delivery_cycles
  ADD COLUMN IF NOT EXISTS roadmap_theme_id uuid REFERENCES roadmap_themes(id);

CREATE INDEX IF NOT EXISTS idx_delivery_cycles_roadmap_theme
  ON delivery_cycles (roadmap_theme_id)
  WHERE roadmap_theme_id IS NOT NULL;

-- Verification:
-- SELECT count(*) FROM roadmap_themes;                       -- 0 until themes created
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='delivery_cycles' AND column_name='roadmap_theme_id';
