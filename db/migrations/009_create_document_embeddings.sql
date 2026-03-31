-- 009_create_document_embeddings.sql
-- Pathways OI Trust — Build A
-- Stores pgvector embeddings for vector similarity search (query_knowledge tool).
-- Rows are created when an artifact transitions to candidate (Build A: placeholder rows).
-- Full Vertex AI embedding generation wired in Build B (ARCH-19).
-- Must run after: 000_extensions.sql (for vector extension),
--                 007_create_artifacts.sql

CREATE TABLE IF NOT EXISTS public.document_embeddings (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id uuid        NOT NULL REFERENCES public.artifacts(id) ON DELETE RESTRICT,
    chunk_index integer     NOT NULL,
    chunk_text  text        NOT NULL,
    embedding   vector(768) NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

-- IVFFlat index for cosine similarity search.
-- NOTE: IVFFlat is trained at index creation time. After bulk loading embeddings,
-- run: REINDEX INDEX document_embeddings_ivfflat_idx;
-- to rebuild with actual data distribution. lists=100 is appropriate for
-- up to ~1M vectors; tune lists = sqrt(row_count) for larger corpora.
CREATE INDEX document_embeddings_ivfflat_idx
    ON public.document_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE TRIGGER document_embeddings_set_updated_at
    BEFORE UPDATE ON public.document_embeddings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.document_embeddings IS
    'pgvector embedding chunks per artifact. Dimension: vector(768) provisional '
    'pending Vertex AI model confirmation (ARCH-19, locked Build B). '
    'chunk_index used for citation scroll-to in DocumentViewer (Build B).';

COMMENT ON COLUMN public.document_embeddings.chunk_index IS
    'Sequential 0-based chunk position within the artifact. '
    'Used by DocumentViewerComponent to scroll-to and highlight the cited section.';
