// home.component.ts — Pathways OI Trust
// Role-aware home screen. Renders the correct card set per D-150.
// Presentation only — no business logic, no MCP calls, no prompts (D-93 Rule 2).
// All data arrives via @Input from the resolved profile.
//
// Contract 19 (D-394): role checks read boolean flags from the profile.
//   A user with is_admin = true AND is_dcs = true sees both Admin and DCS cards —
//   the multi-role intent is explicit.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { UserProfileService } from '../../core/services/user-profile.service';
import { McpService }         from '../../core/services/mcp.service';
import { User }               from '../../core/types/database';
import { firstValueFrom }     from 'rxjs';

@Component({
  selector:        'app-home',
  templateUrl:     './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  profile:      User | null = null;
  hasDivision:  boolean = false;
  loading:      boolean = true;

  constructor(
    private readonly profileService: UserProfileService,
    private readonly mcp:            McpService,
    private readonly cdr:            ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.profile = await this.profileService.loadProfile();

    if (this.profile) {
      await this.checkDivisionMembership();
    }

    this.loading = false;
    this.cdr.markForCheck();
  }

  private async checkDivisionMembership(): Promise<void> {
    // D-170: Admin has implicit access to all Divisions — no assignment needed.
    // Skip the membership check entirely; treat as fully provisioned.
    if (this.isAdmin) {
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

  // Role visibility helpers — Contract 19: read boolean flags from profile.
  get isDCS():   boolean { return this.profile?.is_dcs   === true; }
  get isEPO():   boolean { return this.profile?.is_epo   === true; }
  get isDOL():   boolean { return this.profile?.is_dol   === true; }
  get isCE():    boolean { return this.profile?.is_ce    === true; }
  get isAdmin(): boolean { return this.profile?.is_admin === true; }

  get showSystemHealth():    boolean { return this.isAdmin; }
  get showDivisions():       boolean { return this.isAdmin; }
  get showUserManagement():  boolean { return this.isAdmin; }
  // My Initiatives card — D-423: visible to ALL roles. Admin without functional
  // role still sees the card; renders empty-state when no Initiatives are
  // assigned. Was previously gated by DCS/EPO/DOL flags.
  get showDeliveryCycles():  boolean { return this.profile !== null; }

  // Admin always sees the main cards — needs the Divisions card to bootstrap.
  // Other roles see the onboarding message until an admin assigns a Division.
  get showOnboarding(): boolean {
    return !this.hasDivision && !this.loading && !this.isAdmin;
  }
  get showMainCards(): boolean {
    if (this.loading) return false;
    if (this.isAdmin) return true;
    return this.hasDivision;
  }
}
