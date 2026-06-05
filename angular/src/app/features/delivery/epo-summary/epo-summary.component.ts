// epo-summary.component.ts — EpoSummaryComponent
// Route: /initiatives/epo-summary (D-397, Contract 20 Session 2)
//
// EPO-organized WIP zone view. Parallel to Workstream Summary but the row
// dimension is EPO person. Each row shows three zone counts (Pre-Build,
// Build, Post-Deploy) and a WIP alert flag when any zone count is at or over
// that EPO's configured limit (epo_wip_limits, defaulting to 3/3/3 when no
// row exists).
//
// MVP scope vs spec (D-397) — deltas recorded as CC-20-05:
//   - Shipped:    EPO rows, zone counts, per-EPO WIP alert + amber styling,
//                 EPO name drill-down to /initiatives/list?epo=user_id,
//                 'Display only my Divisions' toggle (DCS/EPO/DOL default ON),
//                 sort by total cycles desc then name (D-171 persistence).
//   - Deferred:   Slide-in filter panel (Division / EPO picker / Lifecycle
//                 Stage / Tier), active filter chips, role-aware EPO filter
//                 default, 'Show all EPOs' toggle for zero-Initiative EPOs,
//                 expanded EPO rows showing three zone sections with full
//                 Initiative grid. Spec sections 5.3 + 5.4 + 5.5 partially
//                 honored — full implementation is a follow-up contract.
//
// Patterns:
//   D-93 / Arch-1: all DB access through DeliveryService.
//   D-178 / S-028: skeleton rows during load.
//   D-180 / D-181: EPO name renders as tappable link.
//   D-200 Pattern 2: amber border for over-limit zone counts + amber ⚠ flag.
//   D-298 header zone (back link + title + S-015 subtitle + + New Initiative).
//   D-400: WIP discipline is per-EPO. Counts reflect epo_summaries from
//          get_delivery_summary; thresholds reflect each EPO's limits.

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
import { firstValueFrom, Subscription, filter, take } from 'rxjs';

import { DeliveryService }      from '../../../core/services/delivery.service';
import { McpService }           from '../../../core/services/mcp.service';
import { UserProfileService }   from '../../../core/services/user-profile.service';
import {
  ScreenStateService,
  SCREEN_KEYS
} from '../../../core/services/screen-state.service';
import { EpoSummaryItem, Division, EpoWipLimitRow } from '../../../core/types/database';

@Component({
  selector:        'app-epo-summary',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule, FormsModule, IonicModule],
  template: `
    <div class="es-shell">

      <!-- D-298 header zone -->
      <div class="es-header">
        <a routerLink="/initiatives" class="es-back-link">← Initiative Tracking</a>
        <div class="es-header-row">
          <h3 class="es-title">EPO Summary</h3>
          <button *ngIf="canCreateCycle"
                  class="es-new-cycle"
                  (click)="onNewCycle()">
            + New Initiative
          </button>
        </div>
        <!-- S-015 — Contract 20 Session 2: spec wording -->
        <p class="es-subtitle">
          Active Initiatives organized by EPO across Pre-Build, Build, and
          Post-Deploy zones. The ⚠ flag and amber count mark zones where the
          EPO has reached or exceeded their configured WIP limit. Click an
          EPO name to see the matching Initiatives.
        </p>
      </div>

      <div class="es-toggle-row">
        <!-- 'Display only my Divisions' toggle (DCS/EPO/DOL only, defaults ON) -->
        <label *ngIf="!isPrivileged" class="es-toggle">
          <input type="checkbox"
                 [(ngModel)]="showMyDivisionsOnly"
                 (ngModelChange)="onToggleChange()" />
          Display only my Divisions
        </label>

        <!-- 'Show all EPOs' toggle (D-397 §5.2). Resets on every screen load —
             NOT persisted via D-171. Reveals EPOs with zero active Initiatives. -->
        <label class="es-toggle es-toggle-secondary">
          <input type="checkbox"
                 [(ngModel)]="showAllEpos"
                 (ngModelChange)="onShowAllEposChange()" />
          Show all EPOs
        </label>
      </div>

      <!-- Column headers — D-196 -->
      <div class="es-grid es-grid-header">
        <span>EPO</span>
        <span class="num">Pre-Build WIP</span>
        <span class="num">Build WIP</span>
        <span class="num">Post-Deploy WIP</span>
        <span class="num">WIP Flag</span>
      </div>

      <!-- Skeleton — S-028 Context B -->
      <div *ngIf="loading">
        <div *ngFor="let _ of skeletonRows" class="es-grid es-grid-row">
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="loadError && !loading" class="es-error">
        <div class="es-error-primary">EPO summary could not load.</div>
        <div class="es-error-secondary">{{ loadError }}</div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && !loadError && rows.length === 0" class="es-empty">
        No EPOs with active Initiatives in scope.
        <span *ngIf="!isPrivileged && showMyDivisionsOnly">
          Try unchecking 'Display only my Divisions' to see all accessible Initiatives.
        </span>
      </div>

      <!-- EPO rows -->
      <ng-container *ngIf="!loading && !loadError">
        <div *ngFor="let row of rows; trackBy: trackByUserId" class="es-grid es-grid-row">
          <span>
            <a (click)="drillDown(row.user_id)" class="es-epo-link">
              {{ row.display_name }}
            </a>
          </span>
          <span class="num"
                [class.es-over-limit]="row.wip_pre_build_exceeded"
                [title]="row.wip_pre_build_exceeded
                  ? 'At or over the Pre-Build WIP limit (' + row.wip_pre_build_limit + ')'
                  : ''">
            {{ row.wip_pre_build }} / {{ row.wip_pre_build_limit }}
          </span>
          <span class="num"
                [class.es-over-limit]="row.wip_build_exceeded"
                [title]="row.wip_build_exceeded
                  ? 'At or over the Build WIP limit (' + row.wip_build_limit + ')'
                  : ''">
            {{ row.wip_build }} / {{ row.wip_build_limit }}
          </span>
          <span class="num"
                [class.es-over-limit]="row.wip_post_deploy_exceeded"
                [title]="row.wip_post_deploy_exceeded
                  ? 'At or over the Post-Deploy WIP limit (' + row.wip_post_deploy_limit + ')'
                  : ''">
            {{ row.wip_post_deploy }} / {{ row.wip_post_deploy_limit }}
          </span>
          <span class="num">
            <span *ngIf="anyZoneExceeded(row)" class="es-flag-icon" title="One or more zones at or over the WIP limit">⚠</span>
          </span>
        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    .es-shell { max-width: 1100px; margin: var(--triarq-space-2xl) auto; padding: 0 var(--triarq-space-md); }
    .es-back-link { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .es-header { margin-bottom: var(--triarq-space-md); }
    .es-header-row { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 4px 0; }
    .es-title { margin: 0; }
    .es-new-cycle { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 6px; padding: 8px 18px; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; }
    .es-new-cycle:hover { background: #1d5a7a; }
    .es-subtitle { margin: 4px 0 12px 0; font-size: 11px; font-style: italic; color: #5A5A5A; max-width: 720px; line-height: 1.6; }
    .es-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: var(--triarq-space-md); margin-bottom: var(--triarq-space-md); }
    .es-toggle { display: flex; align-items: center; gap: 8px; font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); cursor: pointer; }
    .es-toggle-secondary { color: var(--triarq-color-stone, #5A5A5A); font-size: 11px; margin-left: auto; }
    .es-grid { display: grid; grid-template-columns: 2fr 110px 100px 130px 80px; gap: var(--triarq-space-sm); padding: var(--triarq-space-xs) var(--triarq-space-sm); align-items: center; }
    .es-grid-header { font-size: var(--triarq-text-small); font-weight: 500; color: var(--triarq-color-text-secondary); border-bottom: 2px solid var(--triarq-color-border); }
    .es-grid-row { border-bottom: 1px solid var(--triarq-color-border); font-size: var(--triarq-text-small); }
    .num { text-align: center; }
    .es-epo-link { color: var(--triarq-color-text-primary); font-weight: 500; cursor: pointer; }
    .es-epo-link:hover { text-decoration: underline; }
    .es-over-limit { color: #E96127; font-weight: 600; }
    .es-flag-icon { color: var(--triarq-color-sunray, #f5a623); font-size: 14px; }
    .es-empty { padding: var(--triarq-space-xl); text-align: center; color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); }
    .es-error { padding: var(--triarq-space-md); max-width: 560px; }
    .es-error-primary { color: var(--triarq-color-error); font-weight: 500; margin-bottom: 4px; }
    .es-error-secondary { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); }
  `]
})
export class EpoSummaryComponent implements OnInit, OnDestroy {

  loading              = false;
  loadError            = '';
  isPrivileged         = false;
  showMyDivisionsOnly  = true;
  userDivisionIds:     string[] = [];

  /** EPO rows with at least one active Initiative in scope. Loaded every time
   *  the filter scope changes. Base set for rendering. */
  private activeRows: EpoSummaryItem[] = [];

  /** All EPOs (any is_epo = true user) with their configured WIP limits.
   *  Lazy-loaded the first time 'Show all EPOs' is enabled. Used to back-fill
   *  zero-Initiative EPOs into the visible list. */
  private allEpoLimits: EpoWipLimitRow[] = [];
  private allEposLoaded = false;

  /** Toggle: surface EPOs with zero active Initiatives. Per D-397 §5.2,
   *  this resets on every screen load — explicitly NOT persisted via D-171. */
  showAllEpos          = false;
  rows: EpoSummaryItem[] = [];
  canCreateCycle       = false;

  readonly skeletonRows = [1, 2, 3, 4];

  private currentUserId    = '';
  private readonly profileSub = new Subscription();

  constructor(
    private readonly delivery:    DeliveryService,
    private readonly mcp:         McpService,
    private readonly profile:     UserProfileService,
    private readonly router:      Router,
    private readonly screenState: ScreenStateService,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.profileSub.add(
      this.profile.profile$.pipe(
        filter((p): p is NonNullable<typeof p> => p !== null),
        take(1)
      ).subscribe(async profile => {
        this.currentUserId = profile.id ?? '';
        this.isPrivileged  = profile.is_admin === true;
        this.canCreateCycle =
          profile.is_admin === true ||
          profile.is_dcs   === true ||
          profile.is_epo   === true ||
          profile.is_dol   === true;

        const saved = await this.screenState.restore(SCREEN_KEYS.INITIATIVES_EPO_SUMMARY);
        if (saved) {
          const filter = saved.filter_state ?? {};
          if (typeof filter['showMyDivisionsOnly'] === 'boolean') {
            this.showMyDivisionsOnly = filter['showMyDivisionsOnly'] as boolean;
          }
        }

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

  private saveScreenState(): void {
    this.screenState.save(
      SCREEN_KEYS.INITIATIVES_EPO_SUMMARY,
      { showMyDivisionsOnly: this.showMyDivisionsOnly },
      {}
    );
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
          this.activeRows = res.data.epo_summaries ?? [];
          this.rebuildRows();
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

  onToggleChange(): void {
    this.saveScreenState();
    this.loadSummary();
  }

  /**
   * D-397 §5.2 'Show all EPOs' toggle. When enabled the first time, lazy-load
   * get_epo_wip_limits (returns every is_epo = true user with their limits).
   * On subsequent toggles, reuse the cached set.
   */
  onShowAllEposChange(): void {
    if (this.showAllEpos && !this.allEposLoaded) {
      this.delivery.getEpoWipLimits().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.allEpoLimits  = res.data;
            this.allEposLoaded = true;
          }
          this.rebuildRows();
          this.cdr.markForCheck();
        },
        error: () => {
          // Non-fatal — fall back to active-only rows and surface no error.
          this.rebuildRows();
          this.cdr.markForCheck();
        }
      });
    } else {
      this.rebuildRows();
      this.cdr.markForCheck();
    }
  }

  /**
   * Merge active EPO summaries with the all-EPOs limit set when the toggle is
   * on. Back-fills zero-Initiative EPOs at all-zero counts; preserves the
   * existing sort order (active EPOs first by total cycles desc, zero-EPOs
   * appended alphabetically).
   */
  private rebuildRows(): void {
    if (!this.showAllEpos || !this.allEposLoaded) {
      this.rows = this.activeRows;
      return;
    }
    const activeIds = new Set(this.activeRows.map(r => r.user_id));
    const zeroRows: EpoSummaryItem[] = this.allEpoLimits
      .filter(l => !activeIds.has(l.user_id))
      .map(l => ({
        user_id:                  l.user_id,
        display_name:             l.display_name,
        total_active_cycles:      0,
        wip_pre_build:            0,
        wip_build:                0,
        wip_post_deploy:          0,
        wip_pre_build_limit:      l.pre_build_limit,
        wip_build_limit:          l.build_limit,
        wip_post_deploy_limit:    l.post_deploy_limit,
        wip_pre_build_exceeded:   false,
        wip_build_exceeded:       false,
        wip_post_deploy_exceeded: false
      }))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
    this.rows = [...this.activeRows, ...zeroRows];
  }

  anyZoneExceeded(r: EpoSummaryItem): boolean {
    return r.wip_pre_build_exceeded || r.wip_build_exceeded || r.wip_post_deploy_exceeded;
  }

  drillDown(epoUserId: string): void {
    this.router.navigate(['/initiatives/list'], { queryParams: { epo: epoUserId } });
  }

  onNewCycle(): void {
    this.router.navigate(['/initiatives/list'], { queryParams: { new: 'true' } });
  }

  trackByUserId(_: number, r: EpoSummaryItem): string { return r.user_id; }
}
