// database.ts — Pathways OI Trust
// TypeScript interfaces for all database table shapes.
// These match the schema exactly. Used by services and components.
// No Supabase client imports here — this file is types only.

export type SystemRole = 'phil' | 'ds' | 'cb' | 'ce' | 'admin';
export type LifecycleStatus = 'draft' | 'seed_review' | 'candidate' | 'canon' | 'superseded' | 'archived';
export type FileFormat = 'pdf' | 'docx' | 'md' | 'txt';
export type MalwareScanStatus = 'pending' | 'clean' | 'rejected';
export type WorkflowStatus = 'open' | 'approved' | 'declined' | 'cancelled';
export type RaciRole = 'A' | 'C' | 'I';
export type ParticipantStatus = 'pending' | 'approved' | 'declined' | 'dismissed' | 'informed';
export type DefaultScope = 'system' | 'trust' | 'division';

export interface User {
  id:                                    string;
  email:                                 string;
  display_name:                          string;
  system_role:                           SystemRole;
  allow_both_admin_and_functional_roles: boolean;
  is_active:                             boolean;
  created_at:                            string;
  updated_at:                            string;
  deleted_at:                            string | null;
}

export interface Division {
  id:                 string;
  parent_division_id: string | null;
  division_name:      string;
  division_level:     number;
  division_type_label: string | null;
  owner_user_id:      string | null;
  created_by:         string;
  created_at:         string;
  updated_at:         string;
  deleted_at:         string | null;
}

export interface DivisionMembership {
  id:          string;
  user_id:     string;
  division_id: string;
  assigned_by: string;
  assigned_at: string;
  revoked_at:  string | null;
  created_at:  string;
  updated_at:  string;
  deleted_at:  string | null;
}

export interface ArtifactType {
  id:               string;
  type_name:        string;
  type_description: string | null;
  is_system_type:   boolean;
  workflow_handler: string | null;
  default_scope:    DefaultScope | null;
  created_by:       string;
  created_at:       string;
  updated_at:       string;
  deleted_at:       string | null;
}

export interface Artifact {
  id:               string;
  artifact_type_id: string;
  artifact_title:   string;
  artifact_content: string | null;
  division_id:      string;
  folder_id:        string | null;
  lifecycle_status: LifecycleStatus;
  submitted_by:     string;
  submitted_at:     string;
  superseded_by:    string | null;
  created_at:       string;
  updated_at:       string;
  deleted_at:       string | null;
  // Joined fields (present when fetched with relations)
  artifact_types?:  Pick<ArtifactType, 'type_name' | 'type_description'>;
  divisions?:       Pick<Division, 'division_name'>;
  download_url?:    string | null;
}

export interface ArtifactVersion {
  id:                        string;
  artifact_id:               string;
  version_number:            number;
  artifact_content_snapshot: string | null;
  file_id:                   string | null;
  created_by:                string;
  created_at:                string;
  change_note:               string | null;
  updated_at:                string;
  deleted_at:                string | null;
  document_files?:           DocumentFile;
}

export interface DocumentFile {
  id:                  string;
  storage_path:        string;
  original_filename:   string;
  file_format:         FileFormat;
  file_size_bytes:     number;
  malware_scan_status: MalwareScanStatus;
  malware_scan_at:     string | null;
  uploaded_by:         string;
  uploaded_at:         string;
  created_at:          string;
  updated_at:          string;
  deleted_at:          string | null;
}

export interface Folder {
  id:               string;
  division_id:      string;
  parent_folder_id: string | null;
  folder_name:      string;
  created_by:       string;
  created_at:       string;
  updated_at:       string;
  deleted_at:       string | null;
}

export interface ApprovalWorkflow {
  id:                  string;
  artifact_id:         string;
  workflow_type:       string;
  workflow_status:     WorkflowStatus;
  accountable_user_id: string;
  decided_at:          string | null;
  decision_note:       string | null;
  created_at:          string;
  updated_at:          string;
  deleted_at:          string | null;
}

export interface ApprovalParticipant {
  id:                 string;
  workflow_id:        string;
  user_id:            string;
  raci_role:          RaciRole;
  participant_status: ParticipantStatus;
  responded_at:       string | null;
  response_note:      string | null;
  created_at:         string;
  updated_at:         string;
  deleted_at:         string | null;
}

export interface Notification {
  id:                string;
  user_id:           string;
  notification_type: string;
  artifact_id:       string | null;
  workflow_id:       string | null;
  notification_body: string;
  dismissed_at:      string | null;
  created_at:        string;
  updated_at:        string;
  deleted_at:        string | null;
}

// ── MCP response envelope ─────────────────────────────────────────────────────
export interface McpResponse<T = unknown> {
  success: boolean;
  data?:   T;
  error?:  string;
  message?: string;
}
