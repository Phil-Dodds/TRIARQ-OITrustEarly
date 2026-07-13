// busy.service.ts — Pathways OI Trust
// Global processing indicator (Standard proposal: Processing Feedback, 2026-07-12).
// While any MUTATING MCP call is in flight: <body> gets .oi-busy → progress
// cursor everywhere, and a thin animated activity bar shows at the top of the
// viewport. Read calls (get_* / list_* / meeting_changed_since polling) never
// trigger it — the 10-second live-collab poll must not flash the cursor.
//
// This layer is perception only — duplicate-submission protection remains the
// responsibility of per-control busy guards (disable while in flight).

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Read-tool heuristic — this codebase names tools verb_noun consistently.
const READ_PREFIXES = ['get_', 'list_', 'search_'];
const READ_TOOLS    = new Set(['meeting_changed_since']);

export function isReadTool(tool: string): boolean {
  return READ_TOOLS.has(tool) || READ_PREFIXES.some(p => tool.startsWith(p));
}

@Injectable({ providedIn: 'root' })
export class BusyService {
  private inFlight = 0;
  private _busy$   = new BehaviorSubject<boolean>(false);
  busy$: Observable<boolean> = this._busy$.asObservable();

  begin(): void {
    this.inFlight++;
    if (this.inFlight === 1) {
      document.body.classList.add('oi-busy');
      this._busy$.next(true);
    }
  }

  end(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
    if (this.inFlight === 0) {
      document.body.classList.remove('oi-busy');
      this._busy$.next(false);
    }
  }
}
