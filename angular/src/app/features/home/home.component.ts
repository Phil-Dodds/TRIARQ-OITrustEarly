// home.component.ts — Pathways OI Trust
// Role-aware home screen. Renders the correct card set per D-150.
// Presentation only — no business logic, no MCP calls, no prompts (D-93 Rule 2).
// All data arrives via @Input from the resolved profile.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { UserProfileService } from '../../core/services/user-profile.service';
import { McpService }         from '../../core/services/mcp.service';
import { SystemRole, User }   from '../../core/types/database';
import { SYSTEM_ROLES }       from '../../core/constants/roles';
import { firstValueFrom }     from 'rxjs';

@Component({
  selector:        'app-home',
  templateUrl:     './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  profile:      User | null = null;
  role:         SystemRole | null = null;
  hasDivision:  boolean = false;
  loading:      boolean = true;

  constructor(
    private readonly profileService: UserProfileService,
    private readonly mcp:            McpService,
    private readonly cdr:            ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.profile = await this.profileService.loadProfile();
    this.role    = this.profile?.system_role ?? null;

    if (this.profile) {
      await this.checkDivisionMembership();
    }

    this.loading = false;
    this.cdr.markForCheck();
  }

  private async checkDivisionMembership(): Promise<void> {
    // D-170: Phil and Admin have implicit access to all Divisions — no assignment needed.
    // Skip the membership check entirely; treat as fully provisioned.
    if (this.role === SYSTEM_ROLES.PHIL || this.role === SYSTEM_ROLES.ADMIN) {
      this.hasDivision = true;
      this.profileService.setHasDivision(true);
      return;
    }

    try {
      const response = await firstValueFrom(
        this.mcp.call<{ all_accessible_divisions: unknown[] }>(
          'division', 'get_user_divisions', { user_id: this.profile!.id }
        )
      );
      const divisions = response.data?.all_accessible_divisions ?? [];
      this.hasDivision = divisions.length > 0;
      this.profileService.setHasDivision(this.hasDivision);
    } catch {
      this.hasDivision = false;
    }
  }

  // Role visibility helpers — used in template to show/hide cards per D-150.
  get isPhil():  boolean { return this.role === SYSTEM_ROLES.PHIL; }
  get isDCS():   boolean { return this.role === SYSTEM_ROLES.DCS; }
  get isEPO():   boolean { return this.role === SYSTEM_ROLES.EPO; }
  get isDOL():   boolean { return this.role === SYSTEM_ROLES.DOL; }
  get isCE():    boolean { return this.role === SYSTEM_ROLES.CE; }
  get isAdmin(): boolean { return this.role === SYSTEM_ROLES.ADMIN; }

  get showSystemHealth():    boolean { return this.isPhil; }
  get showDivisions():       boolean { return this.isPhil || this.isAdmin; }
  // UAT Bug 1 fix from master: showUserManagement is Phil OR Admin (not Admin only).
  get showUserManagement():  boolean { return this.isPhil || this.isAdmin; }
  // My Initiatives card — DCS, EPO, DOL only (D-391). Phil and Admin use the full dashboard.
  // CE is read-only and has no per-Initiative field. Server scopes data via assigned_to_current_user.
  get showDeliveryCycles():  boolean { return this.isDCS || this.isEPO || this.isDOL; }

  // Phil and Admin always see the main cards — they need the Divisions card to
  // bootstrap the hierarchy before they can have a division assignment themselves.
  // Other roles see the onboarding message until an admin assigns them.
  get showOnboarding(): boolean {
    return !this.hasDivision && !this.loading && !this.isPhil && !this.isAdmin;
  }
  get showMainCards(): boolean {
    if (this.loading) return false;
    if (this.isPhil || this.isAdmin) return true;  // always visible for bootstrap
    return this.hasDivision;
  }
}
