// epo-schedule.component.ts — EpoScheduleComponent
// Route: /initiatives/epo-schedule (D-398, Contract 20 Session 2)
//
// Gate urgency view organized by EPO. Parallel to Gate Schedule
// (/initiatives/gates) but pivot dimension is EPO person.
//
// MVP scope vs spec (D-398) — deltas recorded as CC-20-05:
//   - Shipped:    Two sections (Overdue, Upcoming 7-day window), each shows
//                 EPO rows with Initiative counts. Click an EPO row to drill
//                 to /initiatives/list?epo=user_id pre-filtered. Pattern 2
//                 amber callout banner when any overdue Initiatives exist.
//                 'Display only my Divisions' toggle (DCS/EPO/DOL default ON).
//                 D-171 persistence for the toggle.
//   - Deferred:   Slide-in filter panel (Division / EPO picker / Gate Status /
//                 Lifecycle Stage / Tier), active filter chips, embedded full
//                 Initiative grid below the two sections, gate type narrow
//                 dropdown, role-aware EPO filter default, in-panel drill-down
//                 per-row to detail panel. Spec sections 6.2 + 6.3 + 6.4
//                 partially honored. Full implementation in a follow-up.

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
import {
  DeliveryCycle,
  GateName,
  Division,
  LifecycleStage
} from '../../../core/types/database';

const NEXT_GATE_BY_STAGE: Partial<Record<LifecycleStage, GateName>> = {
  BRIEF:    'brief_review',
  DESIGN:   'go_to_build',
  SPEC:     'go_to_build',
  BUILD:    'go_to_deploy',
  VALIDATE: 'go_to_deploy',
  UAT:      'go_to_deploy',
  PILOT:    'go_to_release',
  RELEASE:  'close_review',
  OUTCOME:  'close_review'
};

interface EpoBucket {
  user_id:      string;
  display_name: string;
  cycle_count:  number;
}

@Component({
  selector:        'app-epo-schedule',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule, FormsModule, IonicModule],
  template: `
    <div class="esch-shell">

      <div class="esch-header">
        <a routerLink="/initiatives" class="esch-back-link">← Initiative Tracking</a>
        <div class="esch-header-row">
          <h3 class="esch-title">EPO Gate Schedule</h3>
          <button *ngIf="canCreateCycle" class="esch-new-cycle" (click)="onNewCycle()">+ New Initiative</button>
        </div>
        <p class="esch-subtitle">
          Initiatives with gates due in the next 7 days or already overdue,
          organized by EPO. Click an EPO row to see their matching Initiatives.
        </p>
      </div>

      <!-- D-200 Pattern 2 overdue banner -->
      <div *ngIf="overdueTotal > 0 && !loading" class="esch-banner-overdue">
        <span class="esch-banner-icon">⚠</span>
        <span>
          <strong>{{ overdueTotal }} Initiative{{ overdueTotal === 1 ? '' : 's' }} overdue.</strong>
          Approval or rescheduling required.
        </span>
      </div>

      <label *ngIf="!isPrivileged" class="esch-toggle">
        <input type="checkbox" [(ngModel)]="showMyDivisionsOnly" (ngModelChange)="onToggleChange()" />
        Display only my Divisions
      </label>

      <!-- Skeleton -->
      <div *ngIf="loading">
        <div class="esch-section-title">Overdue</div>
        <div class="esch-grid esch-grid-row" *ngFor="let _ of skeletonRows">
          <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
        </div>
      </div>

      <div *ngIf="loadError && !loading" class="esch-error">
        <div class="esch-error-primary">EPO Gate Schedule could not load.</div>
        <div class="esch-error-secondary">{{ loadError }}</div>
      </div>

      <ng-container *ngIf="!loading && !loadError">

        <!-- Overdue section -->
        <div class="esch-section">
          <div class="esch-section-title">Overdue ({{ overdueTotal }})</div>
          <div *ngIf="overdueBuckets.length === 0" class="esch-empty">No overdue Initiatives.</div>
          <div *ngFor="let b of overdueBuckets; trackBy: trackByUserId" class="esch-grid esch-grid-row">
            <a (click)="drillDown(b.user_id)" class="esch-epo-link">{{ b.display_name }}</a>
            <span class="num esch-over">{{ b.cycle_count }}</span>
          </div>
        </div>

        <!-- Upcoming section -->
        <div class="esch-section">
          <div class="esch-section-title">Upcoming (next 7 days) ({{ upcomingTotal }})</div>
          <div *ngIf="upcomingBuckets.length === 0" class="esch-empty">No upcoming gates in the next 7 days.</div>
          <div *ngFor="let b of upcomingBuckets; trackBy: trackByUserId" class="esch-grid esch-grid-row">
            <a (click)="drillDown(b.user_id)" class="esch-epo-link">{{ b.display_name }}</a>
            <span class="num">{{ b.cycle_count }}</span>
          </div>
        </div>

      </ng-container>

    </div>
  `,
  styles: [`
    .esch-shell { max-width: 1100px; margin: var(--triarq-space-2xl) auto; padding: 0 var(--triarq-space-md); }
    .esch-back-link { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .esch-header { margin-bottom: var(--triarq-space-md); }
    .esch-header-row { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 4px 0; }
    .esch-title { margin: 0; }
    .esch-new-cycle { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 6px; padding: 8px 18px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .esch-new-cycle:hover { background: #1d5a7a; }
    .esch-subtitle { margin: 4px 0 12px 0; font-size: 11px; font-style: italic; color: #5A5A5A; max-width: 720px; line-height: 1.6; }
    .esch-banner-overdue { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(245,166,35,0.08); border-left: 3px solid var(--triarq-color-sunray, #f5a623); border-radius: 5px; margin-bottom: var(--triarq-space-md); font-size: var(--triarq-text-small); }
    .esch-banner-icon { color: var(--triarq-color-sunray, #f5a623); font-size: 16px; }
    .esch-toggle { display: flex; align-items: center; gap: 8px; font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); margin-bottom: var(--triarq-space-md); cursor: pointer; }
    .esch-section { margin-bottom: var(--triarq-space-lg); }
    .esch-section-title { font-size: var(--triarq-text-small); font-weight: 600; color: var(--triarq-color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; border-bottom: 2px solid var(--triarq-color-border); }
    .esch-grid { display: grid; grid-template-columns: 1fr 100px; gap: var(--triarq-space-sm); padding: var(--triarq-space-xs) var(--triarq-space-sm); align-items: center; }
    .esch-grid-row { border-bottom: 1px solid var(--triarq-color-border); font-size: var(--triarq-text-small); }
    .num { text-align: center; }
    .esch-epo-link { color: var(--triarq-color-text-primary); font-weight: 500; cursor: pointer; }
    .esch-epo-link:hover { text-decoration: underline; }
    .esch-over { color: #E96127; font-weight: 600; }
    .esch-empty { padding: var(--triarq-space-md); color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); font-style: italic; }
    .esch-error { padding: var(--triarq-space-md); max-width: 560px; }
    .esch-error-primary { color: var(--triarq-color-error); font-weight: 500; margin-bottom: 4px; }
    .esch-error-secondary { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); }
  `]
})
export class EpoScheduleComponent implements OnInit, OnDestroy {

  loading              = false;
  loadError            = '';
  isPrivileged         = false;
  showMyDivisionsOnly  = true;
  userDivisionIds:     string[] = [];
  canCreateCycle       = false;

  overdueBuckets:  EpoBucket[] = [];
  upcomingBuckets: EpoBucket[] = [];
  overdueTotal     = 0;
  upcomingTotal    = 0;

  readonly skeletonRows = [1, 2, 3];

  private currentUserId       = '';
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
        this.currentUserId  = profile.id ?? '';
        this.isPrivileged   = profile.is_admin === true;
        this.canCreateCycle =
          profile.is_admin === true ||
          profile.is_dcs   === true ||
          profile.is_epo   === true ||
          profile.is_dol   === true;

        const saved = await this.screenState.restore(SCREEN_KEYS.INITIATIVES_EPO_SCHEDULE);
        if (saved?.filter_state && typeof saved.filter_state['showMyDivisionsOnly'] === 'boolean') {
          this.showMyDivisionsOnly = saved.filter_state['showMyDivisionsOnly'] as boolean;
        }

        if (!this.isPrivileged) {
          await this.loadUserDivisions(this.currentUserId);
        }
        this.loadCycles();
      })
    );
  }

  ngOnDestroy(): void { this.profileSub.unsubscribe(); }

  private async loadUserDivisions(userId: string): Promise<void> {
    if (!userId) { return; }
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
  }

  private loadCycles(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();

    this.delivery.listCycles({}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.classify(res.data);
        } else {
          this.loadError = res.error ?? 'Unable to reach the server.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.loadError = err?.error ?? 'Unable to reach the server.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  private classify(cycles: DeliveryCycle[]): void {
    const today    = new Date().toISOString().slice(0, 10);
    const in7Days  = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const accessible = !this.isPrivileged && this.showMyDivisionsOnly
      ? new Set(this.userDivisionIds)
      : null;

    const overdueMap  = new Map<string, EpoBucket>();
    const upcomingMap = new Map<string, EpoBucket>();

    for (const c of cycles) {
      if (accessible && (!c.division_id || !accessible.has(c.division_id))) { continue; }
      if (!c.assigned_epo_user_id) { continue; }
      if (!c.current_lifecycle_stage) { continue; }

      const nextGate = NEXT_GATE_BY_STAGE[c.current_lifecycle_stage as LifecycleStage];
      if (!nextGate) { continue; }

      const milestone = (c.milestone_dates ?? []).find(m => m.gate_name === nextGate);
      if (!milestone?.target_date || milestone.actual_date) { continue; }

      const targetMap =
        milestone.target_date < today  ? overdueMap  :
        milestone.target_date <= in7Days ? upcomingMap :
        null;
      if (!targetMap) { continue; }

      const epoId = c.assigned_epo_user_id;
      let bucket = targetMap.get(epoId);
      if (!bucket) {
        bucket = {
          user_id:      epoId,
          display_name: c.assigned_epo_display_name ?? 'EPO',
          cycle_count:  0
        };
        targetMap.set(epoId, bucket);
      }
      bucket.cycle_count++;
    }

    const sortBuckets = (m: Map<string, EpoBucket>) =>
      Array.from(m.values()).sort((a, b) =>
        b.cycle_count - a.cycle_count ||
        a.display_name.localeCompare(b.display_name)
      );

    this.overdueBuckets  = sortBuckets(overdueMap);
    this.upcomingBuckets = sortBuckets(upcomingMap);
    this.overdueTotal    = this.overdueBuckets.reduce((s, b) => s + b.cycle_count, 0);
    this.upcomingTotal   = this.upcomingBuckets.reduce((s, b) => s + b.cycle_count, 0);
  }

  onToggleChange(): void {
    this.screenState.save(
      SCREEN_KEYS.INITIATIVES_EPO_SCHEDULE,
      { showMyDivisionsOnly: this.showMyDivisionsOnly },
      {}
    );
    this.loadCycles();
  }

  drillDown(epoUserId: string): void {
    this.router.navigate(['/initiatives/list'], { queryParams: { epo: epoUserId } });
  }

  onNewCycle(): void {
    this.router.navigate(['/initiatives/list'], { queryParams: { new: 'true' } });
  }

  trackByUserId(_: number, b: EpoBucket): string { return b.user_id; }
}
