-- 000_extensions.sql
-- Pathways OI Trust — Build A
-- Run first, before any table migrations.
-- Run once per Supabase project.

-- UUID generation (enabled by default in Supabase, included for explicitness)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgvector — required for document_embeddings.embedding vector(768)
-- Enable via Supabase Dashboard > Database > Extensions if SQL fails here
CREATE EXTENSION IF NOT EXISTS "vector";

-- Shared trigger function: sets updated_at = now() on every UPDATE
-- All tables in this schema use this function via per-table triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
