// epo-deploy.component.ts — EpoDeployComponent
// Route: /initiatives/epo-deploy (D-399, Contract 20 Session 2)
//
// EPO-organized Go to Deploy gate cadence. Parallel to the workstream
// Deploy Gate by Quarter view (/initiatives/deploy-schedule) — same
// expansion + section structure + right-panel-detail interaction, pivot
// dimension is EPO instead of Workstream.
//
// Top-level: every EPO with at least one active Initiative as a row with
// inline counts + expand chevron. Multiple rows expandable simultaneously
// (no accordion). Each EPO expands into three section groups:
//
//   1. Prior Quarter [Q label] Actual    — go_to_deploy actual date in prior Q.
//                                          Includes COMPLETE cycles. Header
//                                          always renders ("No Initiatives" empty).
//   2. Current Quarter [Q label]         — go_to_deploy actual or target date in
//                                          current calendar Q. Header always
//                                          renders.
//   3. Other Active                      — all other active cycles owned by
//                                          this EPO that don't fit either
//                                          quarter. Header always renders.
//
// Prior-quarter miss detection (spec §7.3):
//   If a cycle has a go_to_deploy TARGET date in the prior quarter but no
//   actual date set and is still active, it appears in BOTH the Prior
//   Quarter group (with a red status dot) AND in Other Active. Surfaces the
//   miss without asserting cause. Mirrors the Workstream Deploy Schedule
//   D-PilotSchedule-2026-04-06 rule.
//
// CC-20-05 expansion shipped: the in-place expanded EPO row with three
// quarter sections + embedded Initiative grid was the deferred spec
// behaviour. Row click opens a right-panel detail per D-308 / S-018.
//
// Click an EPO name (not the row body) to drill out to
// /initiatives/list?epo=<user_id> — the count summary stays useful even
// when the user wants the dashboard's filter chip stack rather than the
// per-quarter breakdown.

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
  Division,
  DateStatus,
  CycleMilestoneDate
} from '../../../core/types/database';

const DEPLOY_GATE = 'go_to_deploy';

interface EpoGroup {
  user_id:      string;
  display_name: string;
  prior:        DeliveryCycle[];
  current:      DeliveryCycle[];
  other:        DeliveryCycle[];
}

interface QuarterLabel {
  label: string;   // e.g. "Q2 2026"
  year:  number;
  q:     number;
}

@Component({
  selector:        'app-epo-deploy',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, FormsModule, IonicModule,
    DeliveryCycleDetailComponent
  ],
  template: `
    <!-- D-308 / S-018: flex container — list left, detail panel right. -->
    <div style="display:flex;min-height:calc(100vh - 56px);">

    <div class="edp-shell" [style.flex]="selectedCycleId ? '0 0 40%' : '1 1 100%'">

      <div class="edp-header">
        <a routerLink="/initiatives" class="edp-back-link">← Initiative Tracking</a>
        <div class="edp-header-row">
          <h3 class="edp-title">EPO Deploy by Quarter</h3>
          <button *ngIf="canCreateCycle" class="edp-new-cycle" (click)="onNewCycle()">+ New Initiative</button>
        </div>
        <p class="edp-subtitle">
          Go to Deploy gate cadence per EPO across the prior quarter ({{ priorQuarter.label }}),
          current quarter ({{ currentQuarter.label }}), and other active Initiatives. Click an EPO row
          to expand and see Initiatives grouped by quarter. Click an EPO name to filter
          the full dashboard to their Initiatives.
        </p>
      </div>

      <label *ngIf="!isPrivileged" class="edp-toggle">
        <input type="checkbox" [(ngModel)]="showMyDivisionsOnly" (ngModelChange)="onToggleChange()" />
        Display only my Divisions
      </label>

      <div *ngIf="loading">
        <div class="edp-row-skeleton" *ngFor="let _ of skeletonRows">
          <ion-skeleton-text animated style="height:14px;border-radius:4px;width:60%;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;width:30%;"></ion-skeleton-text>
        </div>
      </div>

      <div *ngIf="loadError && !loading" class="edp-error">
        <div class="edp-error-primary">EPO Deploy by Quarter could not load.</div>
        <div class="edp-error-secondary">{{ loadError }}</div>
      </div>

      <ng-container *ngIf="!loading && !loadError">

        <div *ngFor="let group of epoGroups; trackBy: trackByUserId">

          <button class="edp-row" type="button" (click)="toggle(group.user_id)">
            <span class="edp-chevron"
                  [style.transform]="isExpanded(group.user_id) ? 'rotate(0)' : 'rotate(-90deg)'">▼</span>
            <span class="edp-epo-name"
                  (click)="$event.stopPropagation(); drillDown(group.user_id)">
              {{ group.display_name }}
            </span>
            <span class="edp-counts">
              Prior: {{ group.prior.length }}
              · Current: {{ group.current.length }}
              · Other: {{ group.other.length }}
            </span>
          </button>

          <!-- Expanded body — three quarter sections -->
          <div *ngIf="isExpanded(group.user_id)" class="edp-body">

            <!-- Prior Quarter -->
            <section class="edp-section">
              <div class="edp-section-header">
                Prior Quarter — {{ priorQuarter.label }} Actual
              </div>
              <div class="edp-grid edp-grid-header">
                <span>Initiative</span>
                <span>Stage</span>
                <span>Deploy Date</span>
                <span>Status</span>
              </div>
              <ng-container *ngIf="group.prior.length > 0; else priorEmpty">
                <div *ngFor="let c of group.prior; trackBy: trackByCycleId"
                     class="edp-grid edp-grid-row"
                     (click)="openCycle(c.delivery_cycle_id)">
                  <span class="edp-cycle-title">{{ c.cycle_title }}</span>
                  <span class="edp-meta">{{ c.current_lifecycle_stage }}</span>
                  <span>{{ deployDisplay(c) }}</span>
                  <span>
                    <span class="edp-dot"
                          [style.background]="deployStatusColor(c)"
                          [title]="deployStatusLabel(c)"></span>
                    <span class="edp-status-text" [style.color]="deployStatusColor(c)">
                      {{ deployStatusLabel(c) }}
                    </span>
                  </span>
                </div>
              </ng-container>
              <ng-template #priorEmpty>
                <div class="edp-row-empty">No Initiatives.</div>
              </ng-template>
            </section>

            <!-- Current Quarter -->
            <section class="edp-section">
              <div class="edp-section-header">
                Current Quarter — {{ currentQuarter.label }} Planned/Actual
              </div>
              <div class="edp-grid edp-grid-header">
                <span>Initiative</span>
                <span>Stage</span>
                <span>Deploy Date</span>
                <span>Status</span>
              </div>
              <ng-container *ngIf="group.current.length > 0; else currentEmpty">
                <div *ngFor="let c of group.current; trackBy: trackByCycleId"
                     class="edp-grid edp-grid-row"
                     (click)="openCycle(c.delivery_cycle_id)">
                  <span class="edp-cycle-title">{{ c.cycle_title }}</span>
                  <span class="edp-meta">{{ c.current_lifecycle_stage }}</span>
                  <span>{{ deployDisplay(c) }}</span>
                  <span>
                    <span class="edp-dot"
                          [style.background]="deployStatusColor(c)"
                          [title]="deployStatusLabel(c)"></span>
                    <span class="edp-status-text" [style.color]="deployStatusColor(c)">
                      {{ deployStatusLabel(c) }}
                    </span>
                  </span>
                </div>
              </ng-container>
              <ng-template #currentEmpty>
                <div class="edp-row-empty">No Initiatives.</div>
              </ng-template>
            </section>

            <!-- Other Active -->
            <section class="edp-section">
              <div class="edp-section-header">Other Active</div>
              <div class="edp-grid edp-grid-header">
                <span>Initiative</span>
                <span>Stage</span>
                <span>Deploy Date</span>
                <span>Status</span>
              </div>
              <ng-container *ngIf="group.other.length > 0; else otherEmpty">
                <div *ngFor="let c of group.other; trackBy: trackByCycleId"
                     class="edp-grid edp-grid-row"
                     (click)="openCycle(c.delivery_cycle_id)">
                  <span class="edp-cycle-title">{{ c.cycle_title }}</span>
                  <span class="edp-meta">{{ c.current_lifecycle_stage }}</span>
                  <span>{{ deployDisplay(c) }}</span>
                  <span>
                    <span class="edp-dot"
                          [style.background]="deployStatusColor(c)"
                          [title]="deployStatusLabel(c)"></span>
                    <span class="edp-status-text" [style.color]="deployStatusColor(c)">
                      {{ deployStatusLabel(c) }}
                    </span>
                  </span>
                </div>
              </ng-container>
              <ng-template #otherEmpty>
                <div class="edp-row-empty">No Initiatives.</div>
              </ng-template>
            </section>

          </div>
        </div>

        <div *ngIf="epoGroups.length === 0" class="edp-empty">
          No EPOs with active Initiatives in scope.
        </div>

      </ng-container>

    </div>

    <!-- D-308 / S-018: Right Detail Panel slot. Same component as on dashboard. -->
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

    <!-- D-292: Modal scrim — covers list when edit panel is open inside detail. -->
    <div *ngIf="showEditScrim"
         style="position:fixed;inset:0;z-index:50;background:rgba(0,0,0,0.32);pointer-events:all;"
         (click)="onScrimClick()">
    </div>
  `,
  styles: [`
    .edp-shell { max-width: 1100px; margin: var(--triarq-space-2xl) auto; padding: 0 var(--triarq-space-md); }
    .edp-back-link { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .edp-header { margin-bottom: var(--triarq-space-md); }
    .edp-header-row { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 4px 0; }
    .edp-title { margin: 0; }
    .edp-new-cycle { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 6px; padding: 8px 18px; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; }
    .edp-new-cycle:hover { background: #1d5a7a; }
    .edp-subtitle { margin: 4px 0 12px 0; font-size: 11px; font-style: italic; color: #5A5A5A; max-width: 720px; line-height: 1.6; }
    .edp-toggle { display: flex; align-items: center; gap: 8px; font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); margin-bottom: var(--triarq-space-md); cursor: pointer; }
    .edp-row { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--triarq-color-background-subtle); border: none; border-radius: 6px; margin: 8px 0 4px 0; cursor: pointer; font-size: 13px; }
    .edp-row:hover { background: rgba(37,112,153,0.06); }
    .edp-chevron { font-size: 11px; color: var(--triarq-color-text-secondary); transition: transform 0.15s; flex-shrink: 0; }
    .edp-epo-name { font-weight: 600; color: var(--triarq-color-primary); cursor: pointer; flex: 1; text-align: left; }
    .edp-epo-name:hover { text-decoration: underline; }
    .edp-counts { font-size: 12px; color: var(--triarq-color-text-secondary); }
    .edp-body { padding: 0 12px var(--triarq-space-md) 12px; }
    .edp-section { margin-top: var(--triarq-space-md); }
    .edp-section-header { font-size: 12px; font-weight: 600; padding: 6px 10px; border-radius: 4px; background: rgba(37,112,153,0.06); color: var(--triarq-color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .edp-grid { display: grid; grid-template-columns: 3fr 1fr 1.4fr 1.4fr; gap: var(--triarq-space-sm); padding: 8px 12px; align-items: center; font-size: var(--triarq-text-small); }
    .edp-grid-header { font-weight: 500; color: var(--triarq-color-text-secondary); border-bottom: 2px solid var(--triarq-color-border); }
    .edp-grid-row { border-bottom: 1px solid var(--triarq-color-border); cursor: pointer; }
    .edp-grid-row:hover { background: var(--triarq-color-background-subtle); }
    .edp-cycle-title { font-weight: 500; color: var(--triarq-color-text-primary); }
    .edp-meta { color: var(--triarq-color-text-secondary); }
    .edp-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
    .edp-status-text { font-size: 11px; }
    .edp-row-empty { padding: 10px 12px; color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); font-style: italic; text-align: center; border-bottom: 1px solid var(--triarq-color-border); }
    .edp-row-skeleton { display: flex; gap: 16px; padding: 10px 12px; border-bottom: 1px solid var(--triarq-color-border); }
    .edp-empty { padding: var(--triarq-space-xl); text-align: center; color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); }
    .edp-error { padding: var(--triarq-space-md); max-width: 560px; }
    .edp-error-primary { color: var(--triarq-color-error); font-weight: 500; margin-bottom: 4px; }
    .edp-error-secondary { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); }
  `]
})
export class EpoDeployComponent implements OnInit, OnDestroy {

  loading              = false;
  loadError            = '';
  isPrivileged         = false;
  showMyDivisionsOnly  = true;
  userDivisionIds:     string[] = [];
  canCreateCycle       = false;

  cycles: DeliveryCycle[] = [];

  // Expansion state — multi-expand (no accordion). Mirrors WorkstreamDeploySchedule.
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

        const saved = await this.screenState.restore(SCREEN_KEYS.INITIATIVES_EPO_DEPLOY);
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
      SCREEN_KEYS.INITIATIVES_EPO_DEPLOY,
      { showMyDivisionsOnly: this.showMyDivisionsOnly },
      {}
    );
    this.loadCycles();
  }

  // ── Quarter math (mirrors deploy-schedule) ────────────────────────────────

  private quarterOf(d: Date): { year: number; q: number } {
    return { year: d.getFullYear(), q: Math.floor(d.getMonth() / 3) + 1 };
  }

  private quarterFromIso(iso: string | null | undefined): { year: number; q: number } | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return this.quarterOf(d);
  }

  get currentQuarter(): QuarterLabel {
    const q = this.quarterOf(new Date());
    return { ...q, label: `Q${q.q} ${q.year}` };
  }

  get priorQuarter(): QuarterLabel {
    const now = this.quarterOf(new Date());
    let q = now.q - 1, year = now.year;
    if (q < 1) { q = 4; year -= 1; }
    return { year, q, label: `Q${q} ${year}` };
  }

  private inQuarter(iso: string | null | undefined, target: QuarterLabel): boolean {
    const q = this.quarterFromIso(iso);
    return !!q && q.year === target.year && q.q === target.q;
  }

  // ── Deploy gate helpers ───────────────────────────────────────────────────

  private deployMilestone(c: DeliveryCycle): CycleMilestoneDate | null {
    return c.milestone_dates?.find(m => m.gate_name === DEPLOY_GATE) ?? null;
  }

  deployDisplay(c: DeliveryCycle): string {
    const m = this.deployMilestone(c);
    if (!m) return '—';
    if (m.actual_date) return m.actual_date + ' (actual)';
    if (m.target_date) return m.target_date + ' (target)';
    return '—';
  }

  deployStatusLabel(c: DeliveryCycle): string {
    const m = this.deployMilestone(c);
    if (!m) return '—';
    const map: Record<DateStatus, string> = {
      not_started: 'Not Started',
      on_track:    'On Track',
      at_risk:     'At Risk',
      behind:      'Behind',
      complete:    'Complete'
    };
    return map[m.date_status] ?? '—';
  }

  deployStatusColor(c: DeliveryCycle): string {
    const m = this.deployMilestone(c);
    const colors: Record<string, string> = {
      not_started: '#9E9E9E',
      on_track:    '#2E7D32',
      at_risk:     '#F2A620',
      behind:      '#D32F2F',
      complete:    '#257099'
    };
    return colors[m?.date_status ?? 'not_started'] ?? '#9E9E9E';
  }

  // ── Grouping ──────────────────────────────────────────────────────────────

  /**
   * Group cycles by assigned_epo_user_id, then classify each into Prior /
   * Current / Other. Same prior-quarter-miss rule as WorkstreamDeploySchedule
   * (D-PilotSchedule-2026-04-06): a cycle with target-in-prior + no actual +
   * still active surfaces in BOTH Prior and Other.
   */
  get epoGroups(): EpoGroup[] {
    const byEpo = new Map<string, { display_name: string; cycles: DeliveryCycle[] }>();
    for (const c of this.cycles) {
      if (!c.assigned_epo_user_id) continue;
      let entry = byEpo.get(c.assigned_epo_user_id);
      if (!entry) {
        entry = { display_name: c.assigned_epo_display_name ?? 'EPO', cycles: [] };
        byEpo.set(c.assigned_epo_user_id, entry);
      }
      entry.cycles.push(c);
    }

    const prior   = this.priorQuarter;
    const current = this.currentQuarter;

    const isActive = (c: DeliveryCycle) =>
      c.current_lifecycle_stage !== 'COMPLETE' &&
      c.current_lifecycle_stage !== 'CANCELLED';

    const groups: EpoGroup[] = [];
    for (const [user_id, entry] of byEpo) {
      const priorList:   DeliveryCycle[] = [];
      const currentList: DeliveryCycle[] = [];
      const otherList:   DeliveryCycle[] = [];

      for (const c of entry.cycles) {
        const m = this.deployMilestone(c);
        const actualInPrior   = !!m?.actual_date && this.inQuarter(m.actual_date, prior);
        const actualInCurrent = !!m?.actual_date && this.inQuarter(m.actual_date, current);
        const targetInCurrent = !!m?.target_date && this.inQuarter(m.target_date, current);
        const targetInPrior   = !!m?.target_date && !m.actual_date && this.inQuarter(m.target_date, prior);

        let placed = false;

        if (actualInPrior) {
          priorList.push(c);
          placed = true;
        }
        if (actualInCurrent || targetInCurrent) {
          currentList.push(c);
          placed = true;
        }
        if (targetInPrior && isActive(c)) {
          priorList.push(c);
          otherList.push(c);
          placed = true;
        }
        if (!placed && isActive(c)) {
          otherList.push(c);
        }
      }

      groups.push({
        user_id,
        display_name: entry.display_name,
        prior:   priorList,
        current: currentList,
        other:   otherList
      });
    }

    return groups.sort((a, b) =>
      (b.prior.length + b.current.length + b.other.length) -
      (a.prior.length + a.current.length + a.other.length) ||
      a.display_name.localeCompare(b.display_name)
    );
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
    // D-292: scrim click = ESC = Cancel edit. Signal the detail to handle
    // dirty-state prompt.
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
