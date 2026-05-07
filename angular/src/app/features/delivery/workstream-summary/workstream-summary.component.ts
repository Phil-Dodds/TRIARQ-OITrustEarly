// workstream-summary.component.ts — WorkstreamSummaryComponent
// Route: /delivery/workstreams (D-DeliveryHub-FourViews)
//
// Contract 13 surface (Section 10): WIP counts per workstream across the three
// zones — Pre-Build (DESIGN/SPEC), Build (BUILD/VALIDATE/UAT), and Post-Deploy
// (PILOT/RELEASE/OUTCOME). Zone count renders red and the row carries a ⚠ WIP
// Flag whenever a zone is at or over its limit (D-WIPLimit-2026-04-06).
//
// Header pattern: D-298 (back link + title + S-015 subtitle).
// Toggle: "Display only my Divisions" — visible for DS/CB defaulting ON,
//         hidden for Phil/Admin (D-170).
// Loading: D-178 / S-028 Context B — skeleton rows on full load.
// Empty state: inside grid body; column headers always rendered (D-196).
//
// Read-only analytical surface — no create/edit/delete from this view.
// + New Cycle navigates to /delivery/cycles with workstream pre-population
// (D-HubCreate-2026-04-06).

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule }          from '@angular/forms';
import { IonicModule }          from '@ionic/angular';
import { firstValueFrom, Subscription } from 'rxjs';
import { filter, take }         from 'rxjs/operators';
import { DeliveryService }      from '../../../core/services/delivery.service';
import { McpService }           from '../../../core/services/mcp.service';
import { UserProfileService }   from '../../../core/services/user-profile.service';
import {
  WorkstreamSummaryItem,
  Division
} from '../../../core/types/database';

@Component({
  selector:        'app-workstream-summary',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule, FormsModule, IonicModule],
  template: `
    <div class="ws-shell">

      <!-- D-298 header zone -->
      <div class="ws-header">
        <a routerLink="/delivery" class="ws-back-link">← Delivery Cycle Tracking</a>
        <div class="ws-header-row">
          <h3 class="ws-title">Workstream Summary</h3>
          <button *ngIf="canCreateCycle"
                  class="ws-new-cycle"
                  (click)="onNewCycle()">
            + New Cycle
          </button>
        </div>
        <!-- S-015 surface description -->
        <p class="ws-subtitle">
          WIP counts per workstream across Pre-Build, Build, and Post-Deploy
          stages. Identify workstreams over the {{ defaultLimit }}-cycle WIP limit.
        </p>
      </div>

      <!-- Toggle: "Display only my Divisions" — DS/CB only, defaults ON -->
      <label *ngIf="!isPrivileged" class="ws-toggle">
        <input type="checkbox"
               [(ngModel)]="showMyDivisionsOnly"
               (ngModelChange)="onToggleChange()" />
        Display only my Divisions
      </label>

      <!-- Column headers — D-196: always rendered, even when list empty -->
      <div class="ws-grid ws-grid-header">
        <span>Workstream</span>
        <span>Home Division</span>
        <span class="num">Pre-Build WIP</span>
        <span class="num">Build WIP</span>
        <span class="num">Post-Deploy WIP</span>
        <span class="num">WIP Flag</span>
      </div>

      <!-- Skeleton — S-028 Context B / D-178 Tier 1 -->
      <div *ngIf="loading">
        <div *ngFor="let _ of skeletonRows"
             class="ws-grid ws-grid-row">
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="loadError && !loading" class="ws-error">
        <div class="ws-error-primary">Workstream summary could not load.</div>
        <div class="ws-error-secondary">{{ loadError }}</div>
      </div>

      <!-- Empty state — inside grid body per D-196 -->
      <div *ngIf="!loading && !loadError && workstreamSummaries.length === 0"
           class="ws-empty">
        No workstreams found.
        <span *ngIf="!isPrivileged && showMyDivisionsOnly">
          Try unchecking "Display only my Divisions" to see all accessible Workstreams.
        </span>
      </div>

      <!-- Workstream rows -->
      <ng-container *ngIf="!loading && !loadError">
        <div *ngFor="let ws of sortedWorkstreams; trackBy: trackByWsId"
             class="ws-grid ws-grid-row">

          <!-- Workstream name — tappable → drill down to filtered cycle list -->
          <span>
            <a (click)="drillDown({ workstream_id: ws.workstream_id })"
               class="ws-name-link">
              {{ ws.workstream_name }}
            </a>
            <span *ngIf="!ws.active_status" class="ws-inactive-tag">(inactive)</span>
          </span>

          <!-- Home Division — tappable chip -->
          <span>
            <a *ngIf="ws.home_division_id"
               class="ws-division-chip"
               (click)="onDivisionClick(ws.home_division_id!)">
              {{ ws.home_division_name || '—' }}
            </a>
            <span *ngIf="!ws.home_division_id" class="ws-division-empty">—</span>
          </span>

          <!-- Pre-Build zone count -->
          <span class="num"
                [class.ws-over-limit]="ws.wip_pre_build_exceeded"
                [title]="ws.wip_pre_build_exceeded
                  ? 'At or over the Pre-Build WIP limit (' + ws.wip_pre_build_limit + ')'
                  : ''">
            {{ ws.wip_pre_build }} / {{ ws.wip_pre_build_limit }}
          </span>

          <!-- Build zone count -->
          <span class="num"
                [class.ws-over-limit]="ws.wip_build_exceeded"
                [title]="ws.wip_build_exceeded
                  ? 'At or over the Build WIP limit (' + ws.wip_build_limit + ')'
                  : ''">
            {{ ws.wip_build }} / {{ ws.wip_build_limit }}
          </span>

          <!-- Post-Deploy zone count -->
          <span class="num"
                [class.ws-over-limit]="ws.wip_post_deploy_exceeded"
                [title]="ws.wip_post_deploy_exceeded
                  ? 'At or over the Post-Deploy WIP limit (' + ws.wip_post_deploy_limit + ')'
                  : ''">
            {{ ws.wip_post_deploy }} / {{ ws.wip_post_deploy_limit }}
          </span>

          <!-- WIP Flag — ⚠ Sunray when any zone is over limit -->
          <span class="num">
            <span *ngIf="anyZoneExceeded(ws)" class="ws-flag-icon" title="One or more zones at or over the WIP limit">
              ⚠
            </span>
          </span>
        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    .ws-shell {
      max-width: 1100px;
      margin: var(--triarq-space-2xl) auto;
      padding: 0 var(--triarq-space-md);
    }

    .ws-header { margin-bottom: var(--triarq-space-md); }
    .ws-back-link {
      font-size: var(--triarq-text-small);
      color: var(--triarq-color-primary);
      text-decoration: none;
    }
    .ws-header-row {
      display: flex; align-items: center; justify-content: space-between;
      margin: 8px 0 4px 0;
    }
    .ws-title { margin: 0; }

    .ws-new-cycle {
      background: var(--triarq-color-primary, #257099); color: #fff;
      border: none; border-radius: 6px;
      padding: 8px 18px; font-size: 14px; font-weight: 500;
      cursor: pointer; white-space: nowrap;
    }
    .ws-new-cycle:hover { background: #1d5a7a; }

    /* S-015 */
    .ws-subtitle {
      margin: 4px 0 12px 0;
      font-size: 11px; font-style: italic; color: #5A5A5A;
      max-width: 720px; line-height: 1.6;
    }

    .ws-toggle {
      display: flex; align-items: center; gap: 8px;
      font-size: var(--triarq-text-small);
      color: var(--triarq-color-text-secondary);
      margin-bottom: var(--triarq-space-md); cursor: pointer;
    }

    .ws-grid {
      display: grid;
      grid-template-columns: 2fr 1.5fr 110px 100px 130px 80px;
      gap: var(--triarq-space-sm);
      padding: var(--triarq-space-xs) var(--triarq-space-sm);
      align-items: center;
    }
    .ws-grid-header {
      font-size: var(--triarq-text-small); font-weight: 500;
      color: var(--triarq-color-text-secondary);
      border-bottom: 2px solid var(--triarq-color-border);
    }
    .ws-grid-row {
      border-bottom: 1px solid var(--triarq-color-border);
      font-size: var(--triarq-text-small);
    }
    .num { text-align: center; }

    .ws-name-link {
      color: var(--triarq-color-text-primary); font-weight: 500;
      cursor: pointer;
    }
    .ws-name-link:hover { text-decoration: underline; }
    .ws-inactive-tag {
      margin-left: 6px;
      font-size: 10px; color: var(--triarq-color-sunray, #f5a623);
    }

    .ws-division-chip {
      display: inline-block; padding: 2px 10px; border-radius: 999px;
      background: rgba(37,112,153,0.08); color: var(--triarq-color-primary, #257099);
      font-size: 11px; cursor: pointer;
    }
    .ws-division-chip:hover { background: rgba(37,112,153,0.16); }
    .ws-division-empty { color: var(--triarq-color-text-secondary); }

    /* Oravive when at/over limit (D-WIPLimit-2026-04-06) */
    .ws-over-limit {
      color: #E96127; /* Oravive */
      font-weight: 600;
    }
    .ws-flag-icon {
      color: var(--triarq-color-sunray, #f5a623);
      font-size: 14px;
    }

    .ws-empty {
      padding: var(--triarq-space-xl);
      text-align: center;
      color: var(--triarq-color-text-secondary);
      font-size: var(--triarq-text-small);
    }
    .ws-error { padding: var(--triarq-space-md); max-width: 560px; }
    .ws-error-primary {
      color: var(--triarq-color-error); font-weight: 500; margin-bottom: 4px;
    }
    .ws-error-secondary {
      font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary);
    }
  `]
})
export class WorkstreamSummaryComponent implements OnInit, OnDestroy {

  loading              = false;
  loadError            = '';
  isPrivileged         = false;
  showMyDivisionsOnly  = true;
  userDivisionIds:     string[] = [];
  workstreamSummaries: WorkstreamSummaryItem[] = [];
  canCreateCycle       = false;

  /** Default WIP limit shown in the surface description text. */
  readonly defaultLimit = 3;

  // S-028 Context B / D-178 Tier 1 skeleton rows
  readonly skeletonRows = [1, 2, 3, 4];

  private currentUserId    = '';
  private readonly profileSub = new Subscription();

  constructor(
    private readonly delivery:    DeliveryService,
    private readonly mcp:         McpService,
    private readonly profile:     UserProfileService,
    private readonly router:      Router,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.profileSub.add(
      this.profile.profile$.pipe(
        filter((p): p is NonNullable<typeof p> => p !== null),
        take(1)
      ).subscribe(profile => {
        this.currentUserId = profile.id ?? '';
        const role         = profile.system_role;
        this.isPrivileged  = role === 'phil' || role === 'admin';
        // Cycle creation is open to ds/cb/admin/phil per existing dashboard rules.
        this.canCreateCycle = ['phil', 'admin', 'ds', 'cb'].includes(role);
        if (!this.isPrivileged) {
          this.loadUserDivisions(this.currentUserId);
        } else {
          this.loadSummary();
        }
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void { this.profileSub.unsubscribe(); }

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
          this.workstreamSummaries = res.data.workstream_summaries;
        } else {
          this.loadError = res.error ?? 'Unable to reach the server. Check your connection and try again.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.loadError = err?.error ?? 'Unable to reach the server. Check your connection and try again.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  onToggleChange(): void { this.loadSummary(); }

  /** Sort by total active cycles desc, then name. */
  get sortedWorkstreams(): WorkstreamSummaryItem[] {
    return [...this.workstreamSummaries].sort((a, b) =>
      b.total_active_cycles - a.total_active_cycles ||
      a.workstream_name.localeCompare(b.workstream_name)
    );
  }

  anyZoneExceeded(ws: WorkstreamSummaryItem): boolean {
    return ws.wip_pre_build_exceeded || ws.wip_build_exceeded || ws.wip_post_deploy_exceeded;
  }

  drillDown(params: { workstream_id?: string | null }): void {
    const queryParams: Record<string, string> = {};
    if (params.workstream_id) { queryParams['workstream_id'] = params.workstream_id; }
    this.router.navigate(['/delivery/cycles'], { queryParams });
  }

  onDivisionClick(divisionId: string): void {
    this.router.navigate(['/delivery/cycles'], { queryParams: { division_id: divisionId } });
  }

  /** D-HubCreate-2026-04-06: + New Cycle navigates to dashboard with new=true. */
  onNewCycle(): void {
    this.router.navigate(['/delivery/cycles'], { queryParams: { new: 'true' } });
  }

  trackByWsId(_: number, ws: WorkstreamSummaryItem): string {
    return ws.workstream_id ?? '__none__';
  }
}
