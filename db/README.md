# Database — Pathways OI Trust Build A

Run migrations and seeds in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
Run each file in order. Each file is idempotent — safe to re-run.

---

## Step 1 — Enable Extensions and Shared Function

**File:** `migrations/000_extensions.sql`

Enables `uuid-ossp`, `vector` (pgvector), and creates the shared `set_updated_at()` trigger function.
Must run before any table migration.

> If the vector extension is not available via SQL, enable it first:
> Supabase Dashboard > Database > Extensions > Search "vector" > Enable

---

## Step 2 — Run Migrations in Order

| Order | File | Tables Created |
|-------|------|---------------|
| 1 | `001_create_users.sql` | users |
| 2 | `002_create_divisions.sql` | divisions |
| 3 | `003_create_division_memberships.sql` | division_memberships |
| 4 | `004_create_folders.sql` | folders |
| 5 | `005_create_artifact_types.sql` | artifact_types |
| 6 | `006_create_document_files.sql` | document_files |
| 7 | `007_create_artifacts.sql` | artifacts |
| 8 | `008_create_artifact_versions.sql` | artifact_versions |
| 9 | `009_create_document_embeddings.sql` | document_embeddings |
| 10 | `010_create_tags.sql` | tags, artifact_tags |
| 11 | `011_create_approval_workflows.sql` | approval_workflows |
| 12 | `012_create_approval_participants.sql` | approval_participants |
| 13 | `013_create_notifications.sql` | notifications |

All files use `CREATE TABLE IF NOT EXISTS` — safe to re-run.

---

## Step 3 — Seed System Admin (Phil)

**File:** `seeds/001_seed_system_admin.sql`

**Phil's UUID and email are already set** (`pdodds@triarqhealth.com`, UUID `5d0cb7bc-c56f-4db8-a2d3-6a34d92fe82a`).
Phil must click the magic link invite email before this seed will succeed — the UUID must exist in
Supabase Auth before it can be inserted into `public.users`.

---

## Step 4 — Seed Artifact Types

**File:** `seeds/002_seed_artifact_types.sql`

Seeds the 13 system artifact types (D-145). Resolves Phil's user_id by email —
run after Step 3. Idempotent: uses `ON CONFLICT (type_name) DO UPDATE`.

---

## Schema Rules (Applied to Every Table)

- UUID primary keys — `default gen_random_uuid()` (except users.id which matches Supabase Auth)
- `created_at` and `updated_at` on all tables — `updated_at` maintained by trigger
- Soft delete: `deleted_at timestamptz` — never hard delete
- All queries must include `WHERE deleted_at IS NULL` on soft-deletable tables
- All foreign keys `ON DELETE RESTRICT`
- RLS disabled — access control enforced in MCP layer (D-93)

---

## Notes

- `document_embeddings.embedding vector(768)` — dimension is provisional pending Vertex AI
  model confirmation (ARCH-19, locked Build B). If the model changes dimension, run:
  `ALTER TABLE document_embeddings ALTER COLUMN embedding TYPE vector(NEW_DIM);`
  and `REINDEX INDEX document_embeddings_ivfflat_idx;`
- After bulk loading embeddings, rebuild the IVFFlat index for optimal search performance:
  `REINDEX INDEX document_embeddings_ivfflat_idx;`
