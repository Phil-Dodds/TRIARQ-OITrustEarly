-- 014_create_search_functions.sql
-- Pathways OI Trust — Build A
-- PostgreSQL functions called via supabase.rpc() from document-access-mcp.
-- Must run after: 009_create_document_embeddings.sql, 007_create_artifacts.sql
-- Requires: vector extension (000_extensions.sql)

-- ── Vector similarity search ──────────────────────────────────────────────────
-- Called by query_knowledge tool. Returns ranked embedding chunks for
-- Division-scoped artifacts above the similarity threshold.
-- similarity_score = 1 - cosine_distance (range 0–1, higher = more similar)

CREATE OR REPLACE FUNCTION public.search_document_embeddings(
    query_embedding      vector(768),
    division_ids         uuid[],
    artifact_type_filter text    DEFAULT NULL,
    result_limit         integer DEFAULT 10,
    similarity_threshold float   DEFAULT 0.7
)
RETURNS TABLE (
    chunk_text       text,
    artifact_id      uuid,
    artifact_title   text,
    artifact_type    text,
    division_name    text,
    lifecycle_status text,
    chunk_index      integer,
    similarity_score float
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        de.chunk_text,
        a.id                                    AS artifact_id,
        a.artifact_title,
        at.type_name                            AS artifact_type,
        d.division_name,
        a.lifecycle_status,
        de.chunk_index,
        (1 - (de.embedding <=> query_embedding))::float AS similarity_score
    FROM public.document_embeddings de
    JOIN public.artifacts       a  ON a.id  = de.artifact_id
    JOIN public.artifact_types  at ON at.id = a.artifact_type_id
    JOIN public.divisions       d  ON d.id  = a.division_id
    WHERE de.deleted_at IS NULL
      AND a.deleted_at  IS NULL
      AND at.deleted_at IS NULL
      AND d.deleted_at  IS NULL
      AND a.division_id = ANY(division_ids)
      AND (artifact_type_filter IS NULL OR at.type_name = artifact_type_filter)
      AND (1 - (de.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT result_limit;
$$;

COMMENT ON FUNCTION public.search_document_embeddings IS
    'Division-scoped pgvector cosine similarity search. Called by document-access-mcp '
    'query_knowledge tool. Embedding dimension 768 is provisional pending ARCH-19 (Build B). '
    'After bulk embedding load, run: REINDEX INDEX document_embeddings_ivfflat_idx;';
