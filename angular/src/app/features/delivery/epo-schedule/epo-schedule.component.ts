// epo-schedule.component.ts — EpoScheduleComponent
// Route: /initiatives/epo-schedule (D-398, Contract 20 Session 2)
//
// EPO-organized gate urgency view. Parallel to the workstream Gate Schedule
// view but pivot dimension is EPO. Top-level: every EPO with at least one
// overdue or upcoming gate as a row with inline counts + expand chevron.
// Multiple rows expandable simultaneously (no accordion). Each expansion
// shows two section groups:
//
//   1. Overdue                — Initiatives whose next gate target_date is
//                                in the past, no actual_date.
//   2. Upcoming (next 7 days) — Initiatives whose next gate target_date is
//                                within the next 7 days, no actual_date.
//
// D-200 Pattern 2 banner at top of view persists until overall overdue
// count = 0. Window is fixed at 7 days per D-DeliveryHub-GateSummary.
//
// CC-20-05 expansion shipped: the in-place expanded EPO row with two
// section groups + embedded Initiative grid was the deferred spec
// behaviour. Row click opens a right-panel detail per D-308 / S-018.

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
import { DeliveryCycleDetailComponent } from '../detail/delivery-cycle-detail.component';
import {
  DeliveryCycle,
  GateName,
  Division,
  LifecycleStage,
  CycleMilestoneDate
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

const GATE_DISPLAY: Record<GateName, string> = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

interface EpoGroup {
  user_id:      string;
  display_name: string;
  overdue:      DeliveryCycle[];
  upcoming:     DeliveryCycle[];
}

@Component({
  selector:        'app-epo-schedule',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, FormsModule, IonicModule,
    DeliveryCycleDetailComponent
  ],
  template: `
    <div style="display:flex;min-height:calc(100vh - 56px);">

    <div class="esch-shell" [style.flex]="selectedCycleId ? '0 0 40%' : '1 1 100%'">

      <div class="esch-header">
        <a routerLink="/initiatives" class="esch-back-link">← Initiative Tracking</a>
        <div class="esch-header-row">
          <h3 class="esch-title">EPO Gate Schedule</h3>
          <button *ngIf="canCreateCycle" class="esch-new-cycle" (click)="onNewCycle()">+ New Initiative</button>
        </div>
        <p class="esch-subtitle">
          Initiatives with gates due in the next 7 days or already overdue,
          organized by EPO. Click an EPO row to expand. Click an EPO name to
          filter the full dashboard to their Initiatives.
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

      <div *ngIf="loading">
        <div class="esch-row-skeleton" *ngFor="let _ of skeletonRows">
          <ion-skeleton-text animated style="height:14px;border-radius:4px;width:60%;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;width:30%;"></ion-skeleton-text>
        </div>
      </div>

      <div *ngIf="loadError && !loading" class="esch-error">
        <div class="esch-error-primary">EPO Gate Schedule could not load.</div>
        <div class="esch-error-secondary">{{ loadError }}</div>
      </div>

      <ng-container *ngIf="!loading && !loadError">

        <div *ngFor="let group of epoGroups; trackBy: trackByUserId">

          <button class="esch-row" type="button" (click)="toggle(group.user_id)">
            <span class="esch-chevron"
                  [style.transform]="isExpanded(group.user_id) ? 'rotate(0)' : 'rotate(-90deg)'">▼</span>
            <span class="esch-epo-name"
                  (click)="$event.stopPropagation(); drillDown(group.user_id)">
              {{ group.display_name }}
            </span>
            <span class="esch-counts">
              <span [class.esch-over]="group.overdue.length > 0">
                Overdue: {{ group.overdue.length }}
              </span>
              · Upcoming: {{ group.upcoming.length }}
            </span>
          </button>

          <!-- Expanded body — two sections -->
          <div *ngIf="isExpanded(group.user_id)" class="esch-body">

            <section class="esch-section">
              <div class="esch-section-header esch-section-overdue">Overdue</div>
              <div class="esch-grid esch-grid-header">
                <span>Initiative</span>
                <span>Stage</span>
                <span>Next Gate</span>
                <span>Target Date</span>
              </div>
              <ng-container *ngIf="group.overdue.length > 0; else overdueEmpty">
                <div *ngFor="let c of group.overdue; trackBy: trackByCycleId"
                     class="esch-grid esch-grid-row"
                     (click)="openCycle(c.delivery_cycle_id)">
                  <span class="esch-cycle-title">{{ c.cycle_title }}</span>
                  <span class="esch-meta">{{ c.current_lifecycle_stage }}</span>
                  <span>{{ nextGateLabel(c) }}</span>
                  <span class="esch-over">{{ nextGateTarget(c) }}</span>
                </div>
              </ng-container>
              <ng-template #overdueEmpty>
                <div class="esch-row-empty">No overdue Initiatives.</div>
              </ng-template>
            </section>

            <section class="esch-section">
              <div class="esch-section-header">Upcoming (next 7 days)</div>
              <div class="esch-grid esch-grid-header">
                <span>Initiative</span>
                <span>Stage</span>
                <span>Next Gate</span>
                <span>Target Date</span>
              </div>
              <ng-container *ngIf="group.upcoming.length > 0; else upcomingEmpty">
                <div *ngFor="let c of group.upcoming; trackBy: trackByCycleId"
                     class="esch-grid esch-grid-row"
                     (click)="openCycle(c.delivery_cycle_id)">
                  <span class="esch-cycle-title">{{ c.cycle_title }}</span>
                  <span class="esch-meta">{{ c.current_lifecycle_stage }}</span>
                  <span>{{ nextGateLabel(c) }}</span>
                  <span>{{ nextGateTarget(c) }}</span>
                </div>
              </ng-container>
              <ng-template #upcomingEmpty>
                <div class="esch-row-empty">No upcoming gates in the next 7 days.</div>
              </ng-template>
            </section>

          </div>
        </div>

        <div *ngIf="epoGroups.length === 0" class="esch-empty">
          No EPOs with overdue or upcoming gates in scope.
        </div>

      </ng-container>

    </div>

    <div *ngIf="selectedCycleId"
         style="width:60%;border-left:1px solid #E0E0E0;background:#fff;
                position:sticky;top:0;height:100vh;overflow-y:auto;flex-shrink:0;"
         [style.z-index]="showEditScrim ? '100' : '5'">
      <app-delivery-cycle-detail
        [cycleId]="selectedCycleId"
        [cancelEditSignal]="cancelEditSignal"
        (close)="closePanel()"
        (editPanelOpened)="onEditPanelOpened()"
        (editPanelClosed)="onEditPanelClosed()">
      </app-delivery-cycle-detail>
    </div>

    </div><!-- /flex -->

    <div *ngIf="showEditScrim"
         style="position:fixed;inset:0;z-index:50;background:rgba(0,0,0,0.32);pointer-events:all;"
         (click)="onScrimClick()">
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
    .esch-row { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--triarq-color-background-subtle); border: none; border-radius: 6px; margin: 8px 0 4px 0; cursor: pointer; font-size: 13px; }
    .esch-row:hover { background: rgba(37,112,153,0.06); }
    .esch-chevron { font-size: 11px; color: var(--triarq-color-text-secondary); transition: transform 0.15s; flex-shrink: 0; }
    .esch-epo-name { font-weight: 600; color: var(--triarq-color-primary); cursor: pointer; flex: 1; text-align: left; }
    .esch-epo-name:hover { text-decoration: underline; }
    .esch-counts { font-size: 12px; color: var(--triarq-color-text-secondary); }
    .esch-over { color: #D32F2F; font-weight: 600; }
    .esch-body { padding: 0 12px var(--triarq-space-md) 12px; }
    .esch-section { margin-top: var(--triarq-space-md); }
    .esch-section-header { font-size: 12px; font-weight: 600; padding: 6px 10px; border-radius: 4px; background: rgba(37,112,153,0.06); color: var(--triarq-color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .esch-section-overdue { background: rgba(211,47,47,0.08); color: #D32F2F; }
    .esch-grid { display: grid; grid-template-columns: 3fr 1fr 1.4fr 1.4fr; gap: var(--triarq-space-sm); padding: 8px 12px; align-items: center; font-size: var(--triarq-text-small); }
    .esch-grid-header { font-weight: 500; color: var(--triarq-color-text-secondary); border-bottom: 2px solid var(--triarq-color-border); }
    .esch-grid-row { border-bottom: 1px solid var(--triarq-color-border); cursor: pointer; }
    .esch-grid-row:hover { background: var(--triarq-color-background-subtle); }
    .esch-cycle-title { font-weight: 500; color: var(--triarq-color-text-primary); }
    .esch-meta { color: var(--triarq-color-text-secondary); }
    .esch-row-empty { padding: 10px 12px; color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); font-style: italic; text-align: center; border-bottom: 1px solid var(--triarq-color-border); }
    .esch-row-skeleton { display: flex; gap: 16px; padding: 10px 12px; border-bottom: 1px solid var(--triarq-color-border); }
    .esch-empty { padding: var(--triarq-space-xl); text-align: center; font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); }
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

  cycles: DeliveryCycle[] = [];

  // Expansion state.
  expanded: Set<string> = new Set();

  // D-308 / S-018: right-panel detail state.
  selectedCycleId: string | null = null;
  cancelEditSignal = 0;
  showEditScrim    = false;

  readonly skeletonRows = [1, 2, 3];

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
        const userId = profile.id ?? '';
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
          await this.loadUserDivisions(userId);
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

    const params: { division_id?: string; include_child_divisions?: boolean } = {};
    if (!this.isPrivileged && this.showMyDivisionsOnly && this.userDivisionIds.length === 1) {
      params.division_id = this.userDivisionIds[0];
      params.include_child_divisions = true;
    }

    this.delivery.listCycles(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycles = res.data;
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

  onToggleChange(): void {
    this.screenState.save(
      SCREEN_KEYS.INITIATIVES_EPO_SCHEDULE,
      { showMyDivisionsOnly: this.showMyDivisionsOnly },
      {}
    );
    this.loadCycles();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private nextGate(c: DeliveryCycle): GateName | null {
    return NEXT_GATE_BY_STAGE[c.current_lifecycle_stage as LifecycleStage] ?? null;
  }

  private nextMilestone(c: DeliveryCycle): CycleMilestoneDate | null {
    const g = this.nextGate(c);
    if (!g) return null;
    return c.milestone_dates?.find(m => m.gate_name === g) ?? null;
  }

  nextGateLabel(c: DeliveryCycle): string {
    const g = this.nextGate(c);
    return g ? GATE_DISPLAY[g] : '—';
  }

  nextGateTarget(c: DeliveryCycle): string {
    return this.nextMilestone(c)?.target_date ?? '—';
  }

  // ── Grouping ──────────────────────────────────────────────────────────────

  get epoGroups(): EpoGroup[] {
    const today   = new Date().toISOString().slice(0, 10);
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const byEpo = new Map<string, EpoGroup>();

    for (const c of this.cycles) {
      if (!c.assigned_epo_user_id) continue;
      const m = this.nextMilestone(c);
      if (!m?.target_date || m.actual_date) continue;

      let bucket: 'overdue' | 'upcoming' | null = null;
      if (m.target_date < today) bucket = 'overdue';
      else if (m.target_date <= in7Days) bucket = 'upcoming';
      if (!bucket) continue;

      let group = byEpo.get(c.assigned_epo_user_id);
      if (!group) {
        group = {
          user_id:      c.assigned_epo_user_id,
          display_name: c.assigned_epo_display_name ?? 'EPO',
          overdue:      [],
          upcoming:     []
        };
        byEpo.set(c.assigned_epo_user_id, group);
      }
      group[bucket].push(c);
    }

    return Array.from(byEpo.values()).sort((a, b) =>
      (b.overdue.length + b.upcoming.length) -
      (a.overdue.length + a.upcoming.length) ||
      a.display_name.localeCompare(b.display_name)
    );
  }

  get overdueTotal(): number {
    return this.epoGroups.reduce((sum, g) => sum + g.overdue.length, 0);
  }

  // ── Expansion ─────────────────────────────────────────────────────────────

  toggle(userId: string): void {
    if (this.expanded.has(userId)) {
      this.expanded.delete(userId);
    } else {
      this.expanded.add(userId);
    }
    this.cdr.markForCheck();
  }

  isExpanded(userId: string): boolean {
    return this.expanded.has(userId);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  openCycle(cycleId: string): void {
    if (this.selectedCycleId === cycleId) return;
    this.selectedCycleId = cycleId;
    this.cdr.markForCheck();
  }

  closePanel(): void {
    this.selectedCycleId = null;
    this.showEditScrim   = false;
    this.cdr.markForCheck();
  }

  onScrimClick(): void {
    this.cancelEditSignal++;
    this.cdr.markForCheck();
  }

  onEditPanelOpened(): void {
    this.showEditScrim = true;
    this.cdr.markForCheck();
  }

  onEditPanelClosed(): void {
    this.showEditScrim = false;
    this.cdr.markForCheck();
  }

  drillDown(epoUserId: string): void {
    this.router.navigate(['/initiatives/list'], { queryParams: { epo: epoUserId } });
  }

  onNewCycle(): void {
    this.router.navigate(['/initiatives/list'], { queryParams: { new: 'true' } });
  }

  trackByUserId(_: number, g: EpoGroup): string { return g.user_id; }
  trackByCycleId(_: number, c: DeliveryCycle): string { return c.delivery_cycle_id; }
}
