-- Migration 027 — system_config table
-- Pathways OI Trust | Build C | April 2026
-- Source: D-MaintenanceMode
--
-- Single-row config table for system-wide settings.
-- maintenance_mode is read by Angular bootstrap BEFORE auth (direct Supabase read).
-- This is the ONE deliberate exception to D-93 (MCP-only DB access).
-- All other reads/writes go through division-mcp tools.

CREATE TABLE IF NOT EXISTS system_config (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_mode     boolean     NOT NULL DEFAULT false,
  maintenance_message  text,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  updated_by           text
);

-- Seed single config row (maintenance off by default)
INSERT INTO system_config (maintenance_mode)
VALUES (false);
