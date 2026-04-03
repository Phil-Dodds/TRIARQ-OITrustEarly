// division-summary.component.ts — DivisionSummaryComponent
// Route: /delivery/divisions  (D-172)
//
// Active cycle count per Division in flat indented list order (D-176).
// Tree order: parent before children, siblings alphabetical.
// Indentation: (division_level - 1) * 20px left padding.
// Click a row → /delivery/cycles?division_id=X (D-175).
// Toggle: "Display only my divisions" — hidden for phil/admin (D-170).
//
// D-93: DeliveryService only — no direct Supabase access.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule }          from '@angular/forms';
import { firstValueFrom }       from 'rxjs';
import { DeliveryService }      from '../../../core/services/delivery.service';
import { McpService }           from '../../../core/services/mcp.service';
import { UserProfileService }   from '../../../core/services/user-profile.service';
import { DivisionSummaryItem, Division } from '../../../core/types/database';

@Component({
  selector:        'app-division-summary',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule, FormsModule],
  template: `
    <div style="max-width:700px;margin:var(--triarq-space-2xl) auto;
                padding:0 var(--triarq-space-md);">

      <!-- Back + title -->
      <div style="margin-bottom:var(--triarq-space-md);">
        <a routerLink="/delivery"
           style="font-size:var(--triarq-text-small);
                  color:var(--triarq-color-primary);text-decoration:none;">
          ← Delivery Cycle Tracking
        </a>
        <h3 style="margin:8px 0 4px 0;">Division Summary</h3>
        <p style="margin:0;font-size:var(--triarq-text-small);
                  color:var(--triarq-color-text-secondary);">
          Active delivery cycle count by Division, shown in hierarchy order.
          Click a Division to see all its cycles.
        </p>
      </div>

      <!-- Toggle — hidden for privileged roles -->
      <label *ngIf="!isPrivileged"
             style="display:flex;align-items:center;gap:8px;
                    font-size:var(--triarq-text-small);
                    color:var(--triarq-color-text-secondary);
                    margin-bottom:var(--triarq-space-md);cursor:pointer;">
        <input type="checkbox"
               [(ngModel)]="showMyDivisionsOnly"
               (ngModelChange)="onToggleChange()" />
        Display only my divisions
      </label>

      <!-- Loading -->
      <div *ngIf="loading"
           style="text-align:center;padding:var(--triarq-space-xl);
                  color:var(--triarq-color-text-secondary);">
        Loading division summary…
      </div>

      <!-- Error (D-140: state what is blocked and what needs to change) -->
      <div *ngIf="loadError && !loading"
           style="padding:var(--triarq-space-md);max-width:560px;">
        <div style="color:var(--triarq-color-error);font-weight:500;margin-bottom:4px;">
          Division summary could not load.
        </div>
        <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
          {{ loadError }}
        </div>
      </div>

      <!-- Column header -->
      <div *ngIf="!loading && !loadError && sortedDivisions.length > 0"
           style="display:grid;grid-template-columns:1fr 120px;
                  gap:var(--triarq-space-sm);
                  padding:var(--triarq-space-xs) var(--triarq-space-sm);
                  font-size:var(--triarq-text-small);font-weight:500;
                  color:var(--triarq-color-text-secondary);
                  border-bottom:2px solid var(--triarq-color-border);">
        <span>Division</span>
        <span style="text-align:right;">Active Cycles</span>
      </div>

      <!-- Division rows — flat indented list (D-176) -->
      <div *ngFor="let div of sortedDivisions"
           style="display:grid;grid-template-columns:1fr 120px;
                  gap:var(--triarq-space-sm);
                  border-bottom:1px solid var(--triarq-color-border);
                  font-size:var(--triarq-text-small);align-items:center;
                  transition:background 0.1s;"
           [style.paddingLeft]="indentPx(div)"
           style="padding:var(--triarq-space-xs) var(--triarq-space-sm);"
           [style.cursor]="div.active_cycle_count > 0 ? 'pointer' : 'default'"
           (mouseenter)="div.active_cycle_count > 0 && highlightRow($event, true)"
           (mouseleave)="div.active_cycle_count > 0 && highlightRow($event, false)"
           (click)="div.active_cycle_count > 0 && drillDown(div.division_id)">

        <!-- Division name with tree prefix -->
        <span [style.paddingLeft]="indentPx(div)">
          <span *ngIf="div.division_level > 1"
                style="color:var(--triarq-color-text-secondary);margin-right:4px;">
            {{ treePrefix(div.division_level) }}
          </span>
          <span [style.fontWeight]="div.division_level === 1 ? '600' : '400'"
                [style.color]="div.active_cycle_count > 0
                  ? 'var(--triarq-color-text-primary)'
                  : 'var(--triarq-color-text-secondary)'">
            {{ div.division_name }}
          </span>
        </span>

        <!-- Cycle count -->
        <span style="text-align:right;"
              [style.color]="div.active_cycle_count > 0
                ? 'var(--triarq-color-primary)'
                : 'var(--triarq-color-text-secondary)'">
          {{ div.active_cycle_count > 0 ? div.active_cycle_count : '—' }}
          <span *ngIf="div.active_cycle_count > 0"
                style="margin-left:4px;color:var(--triarq-color-text-secondary);">→</span>
        </span>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && !loadError && sortedDivisions.length === 0"
           style="text-align:center;padding:var(--triarq-space-xl);
                  color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);">
        No divisions found.
        <span *ngIf="!isPrivileged && showMyDivisionsOnly">
          Try unchecking "Display only my divisions."
        </span>
      </div>

      <!-- Total -->
      <div *ngIf="!loading && !loadError && sortedDivisions.length > 0"
           style="display:grid;grid-template-columns:1fr 120px;
                  gap:var(--triarq-space-sm);
                  padding:var(--triarq-space-xs) var(--triarq-space-sm);
                  font-size:var(--triarq-text-small);font-weight:600;
                  border-top:2px solid var(--triarq-color-border);
                  color:var(--triarq-color-text-primary);">
        <span>All divisions</span>
        <span style="text-align:right;">{{ totalCycles }}</span>
      </div>
    </div>
  `
})
export class DivisionSummaryComponent implements OnInit {

  loading            = false;
  loadError          = '';
  isPrivileged       = false;
  showMyDivisionsOnly = true;
  userDivisionIds:   string[] = [];
  divisionSummaries: DivisionSummaryItem[] = [];

  constructor(
    private readonly delivery: DeliveryService,
    private readonly mcp:      McpService,
    private readonly profile:  UserProfileService,
    private readonly router:   Router,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const currentProfile = this.profile.getCurrentProfile();
    const role           = currentProfile?.system_role;
    this.isPrivileged    = role === 'phil' || role === 'admin';

    if (!this.isPrivileged) {
      this.loadUserDivisions(currentProfile?.id ?? '');
    } else {
      this.loadSummary();
    }
  }

  private async loadUserDivisions(userId: string): Promise<void> {
    if (!userId) { this.loadSummary(); return; }
    try {
      const res = await firstValueFrom(
        this.mcp.call<{ directly_assigned_divisions: Division[] }>(
          'division', 'get_user_divisions', { user_id: userId }
        )
      );
      this.userDivisionIds = (res.data?.directly_assigned_divisions ?? []).map(d => d.id);
    } catch {
      this.userDivisionIds = [];
    }
    this.loadSummary();
  }

  private loadSummary(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();

    const params: { division_ids?: string[] } = {};
    if (!this.isPrivileged && this.showMyDivisionsOnly && this.userDivisionIds.length > 0) {
      params.division_ids = this.userDivisionIds;
    }

    this.delivery.getDeliverySummary(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.divisionSummaries = res.data.division_summaries;
        } else {
          this.loadError = this.friendlyError(res.error);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.loadError = this.friendlyError(err?.error);
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  private friendlyError(serverMsg?: string): string {
    if (!serverMsg) {
      return 'Unable to reach the server. Check your connection and try again.';
    }
    if (serverMsg.includes('not found') && serverMsg.includes('get_delivery_summary')) {
      return 'The summary feature is still deploying to the server. ' +
             'This takes 1–2 minutes after a new release. Reload the page to try again.';
    }
    return serverMsg;
  }

  onToggleChange(): void {
    this.loadSummary();
  }

  drillDown(divisionId: string): void {
    this.router.navigate(['/delivery/cycles'], { queryParams: { division_id: divisionId } });
  }

  // D-176: flat indented list in tree order (parent before children, siblings alphabetical)
  get sortedDivisions(): DivisionSummaryItem[] {
    const byParent = new Map<string | null, DivisionSummaryItem[]>();
    for (const div of this.divisionSummaries) {
      const key = div.parent_division_id;
      if (!byParent.has(key)) { byParent.set(key, []); }
      byParent.get(key)!.push(div);
    }

    const result: DivisionSummaryItem[] = [];

    const visit = (parentId: string | null) => {
      const children = (byParent.get(parentId) ?? [])
        .slice()
        .sort((a, b) => a.division_name.localeCompare(b.division_name));
      for (const child of children) {
        result.push(child);
        visit(child.division_id);
      }
    };

    visit(null);
    return result;
  }

  get totalCycles(): number {
    // Sum only top-level divisions to avoid double-counting
    return this.divisionSummaries
      .filter(d => !d.parent_division_id)
      .reduce((s, d) => s + d.active_cycle_count, 0);
  }

  indentPx(div: DivisionSummaryItem): string {
    // Level 1 = 0px, Level 2 = 20px, Level 3 = 40px, etc.
    return `${(div.division_level - 1) * 20}px`;
  }

  treePrefix(level: number): string {
    return level === 2 ? '└─' : '  └─';
  }

  highlightRow(event: MouseEvent, on: boolean): void {
    const el = event.currentTarget as HTMLElement;
    el.style.background = on ? 'var(--triarq-color-background-subtle)' : '';
  }
}
