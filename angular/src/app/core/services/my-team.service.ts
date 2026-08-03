// my-team.service.ts — Pathways OI Trust
// Responsibility: resolve the current user's direct reports, once, for the
// "My team" filter value on every surface that offers it.
//
// Contract 45 (D-639, D-648).
//
// "My team" is defined ONCE, here: `manager_user_id = current_user`.
// **Direct reports only — no transitive walk.** A manager's manager does not
// inherit the whole sub-tree; D-639 is deliberate about that, because a
// skip-level rollup is a different feature with different privacy properties
// (it is listed under Contract 45's Phase 3 out-of-scope items).
//
// ── D-648 DIVERGENCE, FLAGGED (Contract 45, 2026-08-02) ──────────────────────
// D-648 states that selecting "My team" with no explicit Division choice should
// widen results to ALL Divisions, on the reasoning that a manager's reports
// frequently work in Divisions the manager has no assignment to.
//
// That is NOT implemented. `list_delivery_cycles.js` restricts every
// non-privileged caller to their own Division memberships
// (`query.in('division_id', accessible_ids)`) before any client-side filter
// runs, so honouring D-648 literally would require bypassing a data-access
// boundary for non-privileged users. Rule 30 withholds autonomy on security
// boundaries, so this was routed to Design rather than decided here.
//
// Current behaviour: "My team" intersects with whatever Division access the
// viewer already has. A manager sees their reports' work in Divisions they can
// already see, and nothing beyond. Phil ruled 2026-08-02 to ship the
// intersection and route the widening.

import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { McpService } from './mcp.service';
import { UserProfileService } from './user-profile.service';
import { User } from '../types/database';

/** Filter sentinel. Declared once; never constructed from a runtime value. */
export const MY_TEAM_FILTER_VALUE = 'my_team';

@Injectable({ providedIn: 'root' })
export class MyTeamService {
  private directReportIds: Set<string> | null = null;
  private inFlight: Promise<Set<string>> | null = null;

  constructor(
    private readonly mcp:     McpService,
    private readonly profile: UserProfileService
  ) {}

  /**
   * Direct reports of the signed-in user. Cached for the session — the
   * reporting line changes only through the Admin Edit panel, which is not a
   * flow a filtering user is in the middle of.
   *
   * Resolves to an empty set on any failure. An empty "My team" reads as "no
   * team", which is the honest answer when we could not determine one; the
   * alternative (falling through to unfiltered results) would silently show
   * more than the user asked for.
   */
  async getDirectReportIds(): Promise<Set<string>> {
    if (this.directReportIds) { return this.directReportIds; }
    if (this.inFlight)        { return this.inFlight; }

    this.inFlight = (async () => {
      const me = this.profile.getCurrentProfile()?.id ?? '';
      if (!me) { return new Set<string>(); }

      try {
        const res = await firstValueFrom(
          this.mcp.call<User[]>('division', 'list_users', {})
        );
        if (!res.success || !res.data) { return new Set<string>(); }

        return new Set(
          res.data
            .filter(u => u.manager_user_id === me && u.is_active === true)
            .map(u => u.id)
        );
      } catch {
        return new Set<string>();
      }
    })();

    this.directReportIds = await this.inFlight;
    this.inFlight = null;
    return this.directReportIds;
  }

  /** True when the signed-in user has at least one direct report. */
  async hasTeam(): Promise<boolean> {
    return (await this.getDirectReportIds()).size > 0;
  }

  /** Drop the cache — call after a reporting line is edited in Admin. */
  clear(): void {
    this.directReportIds = null;
  }
}
