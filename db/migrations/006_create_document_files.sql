-- 006_create_document_files.sql
-- Pathways OI Trust — Build A
-- Physical file records linked to Supabase Storage.
-- Files pass two validation layers before this record is written (D-146):
--   Layer 1: extension + magic bytes match
--   Layer 2: ClamAV scan result = clean
-- Records with malware_scan_status = rejected are never written to storage.
-- Must run after: 001_create_users.sql
-- Referenced by: 008_create_artifact_versions.sql

CREATE TABLE IF NOT EXISTS public.document_files (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_path        text        NOT NULL,
    original_filename   text        NOT NULL,
    file_format         text        NOT NULL
                                    CHECK (file_format IN ('pdf', 'docx', 'md', 'txt')),
    file_size_bytes     integer     NOT NULL
                                    CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400),
    malware_scan_status text        NOT NULL DEFAULT 'pending'
                                    CHECK (malware_scan_status IN ('pending', 'clean', 'rejected')),
    malware_scan_at     timestamptz,
    uploaded_by         uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    uploaded_at         timestamptz NOT NULL DEFAULT now(),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);

CREATE TRIGGER document_files_set_updated_at
    BEFORE UPDATE ON public.document_files
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.document_files IS
    'Physical file records scoped to Supabase Storage. '
    'Only written after type validation + ClamAV scan passes (D-146). '
    'Max file size: 26214400 bytes (25MB). Supported formats: pdf, docx, md, txt.';

COMMENT ON COLUMN public.document_files.malware_scan_status IS
    'ClamAV scan state. pending = scan queued. clean = safe to use. '
    'rejected = malware detected, record kept for audit, file NOT written to storage.';
