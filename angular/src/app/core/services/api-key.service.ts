// api-key.service.ts — Pathways OI Trust (Contract 31, D-474)
// Thin wrapper over McpService for the six Phil-only api_key tools, which live
// on division-mcp. Presentation layer (api-keys.component) calls only this
// service — never McpService directly (Arch-1 / D-93). Phil-gating is enforced
// server-side in each tool; this service does not duplicate the check.

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { McpService } from './mcp.service';
import { McpResponse, ApiKey, ApiKeyCreated } from '../types/database';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {

  constructor(private readonly mcp: McpService) {}

  listApiKeys(): Observable<McpResponse<ApiKey[]>> {
    return this.mcp.call<ApiKey[]>('division', 'list_api_keys', {});
  }

  getApiKey(key_id: string): Observable<McpResponse<ApiKey>> {
    return this.mcp.call<ApiKey>('division', 'get_api_key', { key_id });
  }

  createApiKey(display_name: string, user_label: string): Observable<McpResponse<ApiKeyCreated>> {
    return this.mcp.call<ApiKeyCreated>('division', 'create_api_key', { display_name, user_label });
  }

  updateApiKey(key_id: string, updates: { display_name?: string; user_label?: string }):
    Observable<McpResponse<ApiKey>> {
    return this.mcp.call<ApiKey>('division', 'update_api_key', { key_id, ...updates });
  }

  inactivateApiKey(key_id: string): Observable<McpResponse<{ key_id: string; revoked_at: string }>> {
    return this.mcp.call<{ key_id: string; revoked_at: string }>('division', 'inactivate_api_key', { key_id });
  }

  reactivateApiKey(key_id: string): Observable<McpResponse<{ key_id: string }>> {
    return this.mcp.call<{ key_id: string }>('division', 'reactivate_api_key', { key_id });
  }
}
