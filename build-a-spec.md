# Build A Specification
Pathways OI Trust | Foundation — Container Hierarchy, Bulk Knowledge Seed, Document Access, Embedded Chat | v1.1 | March 2026 | CONFIDENTIAL
Owner: Phil Sappington, EVP Performance & Governance

---

## 1. Build A Scope

Build A delivers the foundational infrastructure that all subsequent build cycles depend on. It is not scaffolding — it is a working, usable system from the moment it ships. Every component listed here must be production-ready before Build B begins.

| Component | Use Case | Delivers |
|-----------|----------|---------|
| Container / Division Hierarchy | UC-20 | Nine-Trust hierarchy with recursive divisions. Admin UI for creation, membership, role assignment. Hierarchical admin model. |
| Bulk Knowledge Seed | UC-27 | Batch file upload with metadata, malware scanning, Seed Review state, batch approval, directory import. |
| Document Access MCP | Foundation | Node.js MCP server. Nine tools covering human governance layer and agent consumption (vector) layer. |
| Home Screen | Foundation | Role-aware card layout. Universal Action Queue and Notifications cards. Role-specific cards per D-150. |
| Embedded Chat | Foundation | Chat card stub only — UI card present per D-150, no chat skill wired, no Vertex AI dependency. Fully implemented in Build B. |

---

## 2. Authentication Architecture
Source: D-142.

| Element | Specification |
|---------|--------------|
| Login method | Email OTP (magic link) via Supabase Auth — no password required |
| Session persistence | Remember me — persistent session token, 30-day expiry |
| JWT validation | Every MCP server validates the Supabase JWT on every tool call before executing |
| Bootstrap | System Admin accounts seeded via seed script before UI exists — D-135 |
| Combined roles setting | allow_both_admin_and_functional_roles field on users table — defaults false, Phil seeded as true |

---

## 3. Role and Division Model

### 3.1 System-Level Roles
Source: D-136. Roles are system-level — one role per user, applies everywhere.

| Role | Description | Home Screen Cards |
|------|-------------|------------------|
| Phil | EVP P&G — primary governance authority | Action Queue, Notifications, System Health, OI Library, Divisions, Chat |
| DS | Domain Strategist — Context Brief and Delivery Cycle owner | Action Queue, Notifications, My Delivery Cycles, OI Library, Chat |
| CB | Capability Builder — technical execution and build owner | Action Queue, Notifications, My Delivery Cycles, OI Library, Chat |
| CE | Context Engineer — OI Library content contributor | Action Queue, Notifications, OI Library, Chat |
| Admin | Division and user management | Action Queue, Notifications, Divisions, User Management, OI Library, Chat |

### 3.2 Hierarchical Admin Model
Source: D-134, D-135, D-137.

- Division is the universal container primitive — every container at every level is a Division
- Admin role at any Division level grants access to that Division and all child Divisions recursively
- Access does not propagate upward — assigned to a child does not mean access to parent
- System Admin is an admin assigned to the root — access to everything
- Division admins can assign admins to child Divisions within their scope
- Users are registered at system level and assigned to Divisions by admins

### 3.3 Permissions Model
Source: D-131. Role-aware, permissions-deferred.

- UI surfaces the correct cards, queues, and actions for each role
- Any authenticated user can perform any non-admin action — permissions enforcement deferred to future build
- Admin actions (Division creation, user management, role assignment) are gated to Admin role only
- RACI approval workflow enforces approver identity — wired from Build B

---

## 4. Database Schema — Build A

All tables: UUID primary keys. created_at and updated_at on all tables. Soft delete: deleted_at timestamp, never hard delete. All foreign keys ON DELETE RESTRICT unless noted.

### 4.1 divisions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Division unique identifier |
| parent_division_id | uuid | FK divisions.id, nullable | Parent Division — null for root (system level) |
| division_name | text | NOT NULL | Human-readable Division name |
| division_level | integer | NOT NULL | Hierarchy depth — 0 for root Trusts, increments per level |
| division_type_label | text | nullable | UI label (Trust / Service Line Division / Function Division) — interim pending Mike |
| owner_user_id | uuid | FK users.id, nullable | Division Owner — not automatically OI Library approver |
| created_by | uuid | FK users.id, NOT NULL | User who created this Division |
| created_at | timestamptz | NOT NULL, default now() | Creation timestamp |
| updated_at | timestamptz | NOT NULL, default now() | Last update timestamp |
| deleted_at | timestamptz | nullable | Soft delete timestamp |

### 4.2 users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK — matches Supabase Auth user id | User unique identifier |
| email | text | NOT NULL, UNIQUE | User email address — login identifier |
| display_name | text | NOT NULL | Full name for display in UI and approval workflows |
| system_role | text | NOT NULL, CHECK IN (phil, ds, cb, ce, admin) | System-level role — applies everywhere |
| allow_both_admin_and_functional_roles | boolean | NOT NULL, default false | HITRUST separation of duties override |
| is_active | boolean | NOT NULL, default true | Account active status |
| created_at | timestamptz | NOT NULL, default now() | Creation timestamp |
| updated_at | timestamptz | NOT NULL, default now() | Last update timestamp |

### 4.3 division_memberships

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Membership record identifier |
| user_id | uuid | FK users.id, NOT NULL | Assigned user |
| division_id | uuid | FK divisions.id, NOT NULL | Division the user is assigned to |
| assigned_by | uuid | FK users.id, NOT NULL | Admin who created this assignment |
| assigned_at | timestamptz | NOT NULL, default now() | Assignment timestamp |
| revoked_at | timestamptz | nullable | Revocation timestamp — null means active |

Index: (user_id, division_id) UNIQUE WHERE revoked_at IS NULL — one active membership per user per Division.

### 4.4 artifact_types

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Artifact type identifier |
| type_name | text | NOT NULL, UNIQUE | Human-readable type name |
| type_description | text | nullable | What this type is and when it is used |
| is_system_type | boolean | NOT NULL, default false | True for types with hardcoded workflow logic and handler |
| workflow_handler | text | nullable | Reference to application handler code — null for admin-defined types |
| default_scope | text | CHECK IN (system, trust, division) | Default Division scope when submitting this type |
| created_by | uuid | FK users.id, NOT NULL | User who created this type (system for seeded types) |
| created_at | timestamptz | NOT NULL, default now() | Creation timestamp |

Seeded system types (13): Context Brief, Delivery Cycle Build Report, Engineering Best Practice, Domain Knowledge, SOP, Policy, Workflow Map, Training Module, Risk Register Entry, HITRUST Control, CBR, Agent Registry Entry, Performance Metric Definition.

### 4.5 artifacts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Artifact unique identifier |
| artifact_type_id | uuid | FK artifact_types.id, NOT NULL | Type of this artifact |
| artifact_title | text | NOT NULL | Human-readable artifact title |
| artifact_content | text | nullable | Text content — used for markdown and plain text artifacts |
| division_id | uuid | FK divisions.id, NOT NULL | Scoping Division |
| folder_id | uuid | FK folders.id, nullable | OI Library folder assignment |
| lifecycle_status | text | NOT NULL, default draft, CHECK IN (draft, seed_review, candidate, canon, superseded, archived) | Current lifecycle state |
| submitted_by | uuid | FK users.id, NOT NULL | User who submitted this artifact |
| submitted_at | timestamptz | NOT NULL, default now() | Submission timestamp |
| superseded_by | uuid | FK artifacts.id, nullable | Points to the artifact that supersedes this one |
| created_at | timestamptz | NOT NULL, default now() | Creation timestamp |
| updated_at | timestamptz | NOT NULL, default now() | Last update timestamp |
| deleted_at | timestamptz | nullable | Soft delete timestamp |

### 4.6 artifact_versions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Version record identifier |
| artifact_id | uuid | FK artifacts.id, NOT NULL | Parent artifact |
| version_number | integer | NOT NULL | Sequential version number starting at 1 |
| artifact_content_snapshot | text | nullable | Content at this version — text artifacts |
| file_id | uuid | FK document_files.id, nullable | File at this version — file-based artifacts |
| created_by | uuid | FK users.id, NOT NULL | User who created this version |
| created_at | timestamptz | NOT NULL, default now() | Version creation timestamp |
| change_note | text | nullable | Description of what changed in this version |

### 4.7 document_files

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | File record identifier |
| storage_path | text | NOT NULL | Supabase Storage bucket path |
| original_filename | text | NOT NULL | Original uploaded filename |
| file_format | text | NOT NULL, CHECK IN (pdf, docx, md, txt) | Validated file format — magic bytes checked |
| file_size_bytes | integer | NOT NULL | File size in bytes — max 26214400 (25MB) |
| malware_scan_status | text | NOT NULL, default pending, CHECK IN (pending, clean, rejected) | ClamAV scan result |
| malware_scan_at | timestamptz | nullable | Scan completion timestamp |
| uploaded_by | uuid | FK users.id, NOT NULL | Uploading user |
| uploaded_at | timestamptz | NOT NULL, default now() | Upload timestamp |

### 4.8 document_embeddings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Embedding record identifier |
| artifact_id | uuid | FK artifacts.id, NOT NULL | Source artifact |
| chunk_index | integer | NOT NULL | Sequential chunk position — used for citation scroll-to |
| chunk_text | text | NOT NULL | Text content of this chunk |
| embedding | vector(768) | NOT NULL | pgvector embedding — dimension provisional pending Vertex AI model confirmation (ARCH-19) |
| created_at | timestamptz | NOT NULL, default now() | Embedding generation timestamp |

Index: `CREATE INDEX ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`

### 4.9 folders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Folder identifier |
| division_id | uuid | FK divisions.id, NOT NULL | Owning Division |
| parent_folder_id | uuid | FK folders.id, nullable | Parent folder — null for top-level |
| folder_name | text | NOT NULL | Display name |
| created_by | uuid | FK users.id, NOT NULL | Creating user |
| created_at | timestamptz | NOT NULL, default now() | Creation timestamp |

### 4.10 tags and artifact_tags

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| tags.id | uuid | PK | Tag identifier |
| tags.division_id | uuid | FK divisions.id, NOT NULL | Division scope of this tag |
| tags.tag_name | text | NOT NULL | Tag label |
| artifact_tags.artifact_id | uuid | FK artifacts.id, NOT NULL | Tagged artifact |
| artifact_tags.tag_id | uuid | FK tags.id, NOT NULL | Applied tag |

### 4.11 approval_workflows

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Workflow instance identifier |
| artifact_id | uuid | FK artifacts.id, NOT NULL | Artifact under review |
| workflow_type | text | NOT NULL | Type of approval (oilibrary_submission, gate_review, etc.) |
| workflow_status | text | NOT NULL, default open, CHECK IN (open, approved, declined, cancelled) | Overall workflow outcome |
| accountable_user_id | uuid | FK users.id, NOT NULL | The single Accountable party — their decision is binding |
| decided_at | timestamptz | nullable | Timestamp of Accountable adjudication |
| decision_note | text | nullable | Accountable party rationale |
| created_at | timestamptz | NOT NULL, default now() | Workflow creation timestamp |

### 4.12 approval_participants

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Participant record identifier |
| workflow_id | uuid | FK approval_workflows.id, NOT NULL | Parent workflow |
| user_id | uuid | FK users.id, NOT NULL | Participant user |
| raci_role | text | NOT NULL, CHECK IN (A, C, I) | RACI role — A=Accountable, C=Consulted, I=Informed |
| participant_status | text | NOT NULL, default pending, CHECK IN (pending, approved, declined, dismissed, informed) | This participant's current status |
| responded_at | timestamptz | nullable | Timestamp of participant response |
| response_note | text | nullable | Optional participant comment |

### 4.13 notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Notification identifier |
| user_id | uuid | FK users.id, NOT NULL | Recipient user |
| notification_type | text | NOT NULL | Type label (approval_requested, item_decided, item_seeded, etc.) |
| artifact_id | uuid | FK artifacts.id, nullable | Related artifact — nullable for system notifications |
| workflow_id | uuid | FK approval_workflows.id, nullable | Related workflow — nullable |
| notification_body | text | NOT NULL | Human-readable notification message |
| dismissed_at | timestamptz | nullable | Null means active — user must explicitly dismiss |
| created_at | timestamptz | NOT NULL, default now() | Creation timestamp |

---

## 5. MCP Server Specifications
Source: D-93, D-142, D-144, D-147. All MCP servers: Node.js on Render free tier. JWT validation before every tool execution. Tool naming: verb_noun. Response envelope: `{ success: boolean, data: any, error?: string }`.

### 5.1 Document Access MCP (document-access-mcp) — v1.0

**Translation layer trigger:** when artifact lifecycle_status transitions to canon, MCP fires translation layer — generates embeddings via Vertex AI and writes chunks to document_embeddings.

**Division scoping rule:** when division_id omitted, results scoped to all Divisions the JWT holder can access. When provided, server validates JWT holder has access before executing.

| Tool | Layer | Parameters | Returns |
|------|-------|------------|---------|
| search_documents | Human governance | query: string, division_id?: uuid, artifact_type?: string, folder_id?: uuid, limit?: number | Array of artifact metadata records — no file content |
| query_knowledge | Agent consumption | query: string, division_id?: uuid, artifact_type?: string, limit?: number, similarity_threshold?: number | Array of { chunk_text, artifact_id, artifact_title, artifact_type, division_name, lifecycle_status, chunk_index, similarity_score } |
| get_document | Human governance | document_id: uuid | Full artifact record including content or file download URL, metadata, current version |
| get_documents_bulk | Human / Engineering | document_ids?: uuid[], folder_id?: uuid, artifact_type?: string, division_id?: uuid | Array of complete artifact records with file content — primary tool for Claude Code calling canonical files |
| list_documents | Human governance | division_id?: uuid, folder_id?: uuid, artifact_type?: string, lifecycle_status?: string, limit?: number, offset?: number | Paginated array of artifact metadata — no file content |
| upload_document | Human governance | file: base64, filename: string, artifact_type_id: uuid, division_id: uuid, metadata: object | Created artifact record — triggers type validation and malware scan |
| delete_document | Human governance | document_id: uuid | Confirmation — sets deleted_at, never destroys record |
| get_document_versions | Human governance | document_id: uuid | Array of version records with timestamps and change notes |
| update_document_metadata | Human governance | document_id: uuid, metadata: object | Updated artifact record — does not replace file content |

### 5.2 Division MCP (division-mcp) — v1.0

Admin-only write operations.

| Tool | Parameters | Returns |
|------|------------|---------|
| create_division | division_name: string, parent_division_id?: uuid, division_type_label?: string | Created Division record |
| get_division | division_id: uuid | Division record with child Divisions and member count |
| list_divisions | parent_division_id?: uuid | Array of Division records — defaults to root Trusts if no parent specified |
| update_division | division_id: uuid, updates: object | Updated Division record |
| assign_user_to_division | user_id: uuid, division_id: uuid | Created membership record |
| revoke_division_membership | user_id: uuid, division_id: uuid | Confirmation — sets revoked_at |
| get_user_divisions | user_id: uuid | Array of all Divisions user has active membership in, with inherited access |
| create_user | email: string, display_name: string, system_role: string | Created user record — triggers Supabase Auth invite email |
| update_user | user_id: uuid, updates: object | Updated user record |
| list_users | division_id?: uuid | Array of users — all if no division_id, or users with access to that Division |

---

## 6. Angular Application Architecture
Source: D-93, D-143, D-150, D-151, D-152.

### 6.1 Native Federation Remote Configuration
- Package: @angular-architects/native-federation
- Exposed module: AppModule
- All routes relative — no hardcoded absolute paths
- Lazy-loaded feature modules: OILibraryModule, AdminModule, ChatModule, DeliveryModule (Build C)

### 6.2 UI Rules
- Angular components are presentation-only — no prompts, no direct Supabase calls
- All data operations through Angular services calling MCP server tool endpoints
- Business logic lives in skill files — not in components or services
- Every screen: What + Why + How per Principle 4.2
- Blocked actions follow D-140 — primary message + secondary unblock guidance in smaller font

### 6.3 Design Token Application
- triarq.tokens.v1.css applied as global styles — import in styles.scss
- ionic.theme.map.scss imported in global.scss before Ionic default theme
- SVG icons under assets/icons/triarq — stroke=currentColor, 24px base grid
- **CRITICAL: --triarq-text-h2 = 60px. Token file value of 20px is a data entry error.**
- radius: cards=10px, buttons=5px, inputs=5px, pills=999px
- Sidebar active: --triarq-color-primary (#257099) as left border indicator
- Font: Roboto — not Gill Sans or Lato

### 6.4 Home Screen Card Components

| Card Component | Roles | Data Source | Build A State |
|---------------|-------|-------------|---------------|
| MyActionQueueCard | All | approval_participants + approval_workflows + artifacts | Present — sparsely populated until Build B |
| MyNotificationsCard | All | notifications table | Present and functional |
| SystemHealthCard | Phil only | Division count, user count, artifact count | Present and functional |
| OILibraryCard | All | artifacts — Canonical, scoped to user's Divisions | Present and functional |
| DivisionsCard | Phil, Admin | divisions table | Present and functional |
| UserManagementCard | Admin only | users + division_memberships | Present and functional |
| MyDeliveryCyclesCard | DS, CB | delivery_cycles table (Build C) | Shell present — data wired in Build C |
| EmbeddedChatCard | All | query_knowledge via chat skill | Stub only — card shell present, no chat skill wired. Wired in Build B. |
| OnboardingMessageCard | Authenticated, no Division | Static content | Present and functional |

---

## 7. Embedded Chat Specification
Source: D-147, D-148, D-153.

> **NOTE (Session 2026-03-29):** Embedded chat implementation moved to Build B. This specification is preserved for reference. The Build A deliverable is a Chat card stub only — no chat skill, no MCP calls, no Vertex AI dependency. Full implementation per this spec occurs in Build B.

### 7.1 Component Architecture
- **EmbeddedChatComponent** — presentation only, receives answers and citations as input
- **ChatSkillService** — calls chat skill endpoint on MCP server
- **DocumentViewerComponent** — side panel, calls get_document, renders file, opens on citation click
- No prompt logic in any Angular file — prompts in chat skill file only

### 7.2 Chat Skill Behavior
- Calls query_knowledge with user's question and Division scope
- Similarity threshold: 0.7
- Maximum chunks per answer: 5
- Citation numbers assigned in order of first appearance
- No-results message: *"I couldn't find relevant information in the OI Library for this question. Try rephrasing or check that the relevant documents have been seeded and canonized."*

### 7.3 Citation Format
- Inline: superscript [N], clickable, jumps to reference list
- Reference list: `[N] Artifact Type — Document Title — Section · Division Name · Lifecycle Status`
- Entries clickable — open DocumentViewerComponent side panel
- Lifecycle status color: Canon=green, Candidate=amber, other=gray
- If chunk_index available, viewer scrolls to and highlights relevant section

### 7.4 Document Viewer Side Panel
- Opens alongside chat — chat narrows, does not navigate away
- Supports PDF, DOCX, MD, TXT. Read-only.
- Close button returns chat to full width

---

## 8. Bulk Knowledge Seed Specification
Source: D-145, D-146, UC-27.

### 8.1 Upload Flow
1. Admin selects files (PDF, DOCX, MD, TXT — max 25MB each, 500MB or 100 files per batch)
2. Extension AND magic bytes validated — mismatch rejected per D-140
3. Files queued for ClamAV scan — malware_scan_status = pending
4. Scan: clean = proceed, rejected = blocked with explanation
5. Clean files written to Supabase Storage, document_files record created
6. Admin sets batch metadata defaults: artifact_type, division_id, source_tag
7. Individual items can override batch defaults before submission
8. Batch submitted — artifact records created with lifecycle_status = seed_review

### 8.2 Batch Approval
- Authority reviews batch in approval queue (source, metadata sample, file count, artifact types)
- Approve or reject as whole — no partial approval in this version
- Approved: all artifacts transition seed_review → candidate; translation layer fires per artifact
- Rejected: artifacts remain in seed_review with rejection note

### 8.3 Directory Import
1. Admin uploads ZIP organized in folders
2. System reads folder hierarchy, proposes OI Library folder mapping
3. Admin confirms, adjusts, or collapses folder levels
4. Editable tree displayed before batch is created

---

## 9. Build A Acceptance Criteria

| Criterion | How Demonstrated |
|-----------|-----------------|
| Create nine TRIARQ Trust Division hierarchy | Navigate Admin UI, create nine top-level Divisions with correct names and owners |
| Create child Divisions under a Trust | Create at least two levels of child Divisions under Practice Services Trust |
| Create users and assign to Divisions with roles | Create DS user, assign to Practice Services Trust, confirm role-aware home screen |
| Downward access inheritance works | Assign user to Practice Services Trust — confirm access to child Divisions |
| Upward access blocked | Assign user to child Division only — confirm parent Trust inaccessible |
| Admin/functional role separation enforced | Attempt to assign admin + DS role with allow_both=false — hard block with explanation |
| Batch upload scans clean and reaches seed_review | Upload 5+ RCM SOP files, confirm scan passes, confirm seed_review status |
| Batch approval transitions to candidate and triggers embeddings | Phil approves seed batch — confirm candidate status and document_embeddings rows |
| Home screen correct per role | Log in as Phil, DS, CB, CE, Admin — confirm each sees correct cards |
| No Division user sees onboarding message | Create user, no Division assignment — confirm onboarding message |
| MCP JWT validation | Attempt unauthenticated MCP call — confirm 401 rejection |
| No direct Supabase calls in Angular | Code review — zero Supabase client imports in any component or service |

---

## 10. Pending Items Before Build A Ships

| Item | Impact | Owner | Status |
|------|--------|-------|--------|
| ionic.theme.map.scss designer confirmation | Provisional accepted for build start — only remaining blocker | Phil to share D-151 with designer | Provisional |

Note: Vertex AI items moved to Build B blockers. GCP account confirmed ready (Session 2026-03-29-E).

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | March 2026 | Initial document. Produced in Design Session A. Full Build A specification. Source: D-130–153. |
| v1.1 | 2026-03-29 | Embedded chat moved to Build B (stub only in Build A). Division MCP rename (container-mcp → division-mcp). ARCH-19 updated to Build B blocker. Three embedded chat acceptance criteria removed. Section 10 pending items reduced to single remaining blocker. Build-B deferral note added to Section 7. Source: Session 2026-03-29-A, B, D, E. |
