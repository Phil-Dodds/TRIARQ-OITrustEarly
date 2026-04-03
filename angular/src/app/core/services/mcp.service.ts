// mcp.service.ts — Pathways OI Trust
// Base HTTP client for all MCP server tool calls.
// All Angular services use this — never call MCP endpoints directly from components.
// Attaches the Supabase JWT to every request (D-93, D-144).

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { McpResponse } from '../types/database';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class McpService {
  constructor(
    private readonly http:  HttpClient,
    private readonly auth:  AuthService
  ) {}

  /**
   * Calls a tool on an MCP server.
   * @param server  - 'division' | 'document'
   * @param tool    - tool name (verb_noun)
   * @param params  - tool parameters object
   */
  call<T>(server: 'division' | 'document' | 'delivery', tool: string, params: Record<string, unknown> = {}): Observable<McpResponse<T>> {
    const baseUrl = server === 'division'
      ? environment.divisionMcpUrl
      : server === 'delivery'
        ? environment.deliveryCycleMcpUrl
        : environment.documentMcpUrl;

    const token = this.auth.getAccessToken();
    if (!token) {
      return throwError(() => new Error('No active session. Please sign in.'));
    }

    const headers = new HttpHeaders({
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http
      .post<McpResponse<T>>(`${baseUrl}/tools/${tool}`, params, { headers })
      .pipe(
        map(response => response),
        catchError((err: HttpErrorResponse) => {
          // 401 from MCP — session may have expired
          if (err.status === 401) {
            return throwError(() => ({
              success: false,
              error: 'Your session has expired. Please sign in again.'
            }));
          }
          // MCP returned a 400 with { success: false, error: string }
          if (err.error?.success === false) {
            return throwError(() => err.error);
          }
          return throwError(() => ({
            success: false,
            error: 'Unable to reach the server. Check your connection and try again.'
          }));
        })
      );
  }
}
