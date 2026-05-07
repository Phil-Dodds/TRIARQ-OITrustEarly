// gates-summary.component.ts — GatesSummaryComponent
// Route: /delivery/gates  (D-DeliveryHub-FourViews)
//
// Contract 13 surface (Section 11). Cycles whose current gate is overdue or
// due within 7 days, organized into two named sections above a full grid of
// the rest of the active cycles. Banner at top alerts when any overdue cycles
// exist (D-200 Pattern 2 — cannot be dismissed).
//
// Window is fixed at 7 days. Gate filter narrows the result to a single gate
// type. "Display only my Divisions" defaults ON for DS/CB and is hidden for
// Phil/Admin (D-170).
//
// Read-only analytical surface — no create/edit/delete from this view.
// + New Cycle pre-populates Division when the scope is single-division
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
  DeliveryCycle,
  GateName,
  Division,
  LifecycleStage
} from '../../../core/types/database';

const GATE_LABELS: Record<GateName, string> = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

// D-189 mirror of NEXT_GATE_BY_STAGE — kept in component scope to avoid
// bringing in a wider import surface.
const NEXT_GATE_BY_STAGE: Partial<Record<LifecycleStage, GateName>> = {
  BRIEF:    'brief_review',
  DESIGN:   'go_to_build',
  SPEC:     'go_to_build',
  BUILD:    'go_to_deploy',
  VALIDATE: 'go_to_deploy',
  PILOT:    'go_to_release',
  UAT:      'go_to_release',
  RELEASE:  'close_review',
  OUTCOME:  'close_review'
};

interface ScheduleRow {
  cycle:        DeliveryCycle;
  nextGate:     GateName | null;
  targetDate:   string | null;
  daysUntil:    number | null; // null when no target_date
  isOverdue:    boolean;
  isUpcoming:   boolean;
}

@Component({
  selector:        'app-gates-summary',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule, FormsModule, IonicModule],
  template: `
    <div class="gs-shell">

      <!-- D-298 header -->
      <div class="gs-header">
        <a routerLink="/delivery" class="gs-back-link">← Delivery Cycle Tracking</a>
        <div class="gs-header-row">
          <h3 class="gs-title">Gate Schedule</h3>
          <button *ngIf="canCreateCycle" class="gs-new-cycle" (click)="onNewCycle()">
            + New Cycle
          </button>
        </div>
        <p class="gs-subtitle">
          Gates coming up in the next 7 days and gates with overdue target dates.
          Use this to prioritize approval actions and identify stalled cycles.
        </p>
      </div>

      <!-- D-200 Pattern 2: Overdue callout banner. Tap → drill to cycles?gate_status=overdue. Cannot be dismissed. -->
      <div *ngIf="overdueRows.length > 0"
           class="gs-overdue-banner"
           role="button"
           tabindex="0"
           (click)="onBannerTap()"
           (keydown.enter)="onBannerTap()">
        <span class="gs-overdue-icon">⚠</span>
        <span class="gs-overdue-text">
          {{ overdueRows.length }}
          {{ overdueRows.length === 1 ? 'cycle has' : 'cycles have' }}
          overdue gates.
        </span>
        <span class="gs-overdue-cta">Filter to overdue →</span>
      </div>

      <!-- Toggle + Gate filter -->
      <div class="gs-controls">
        <label *ngIf="!isPrivileged" class="gs-toggle">
          <input type="checkbox"
                 [(ngModel)]="showMyDivisionsOnly"
                 (ngModelChange)="onToggleChange()" />
          Display only my Divisions
        </label>

        <label class="gs-gate-filter">
          <span>Gate:</span>
          <select class="oi-input" [(ngModel)]="filterGate">
            <option value="">All gates</option>
            <option *ngFor="let g of allGates" [value]="g">{{ gateLabel(g) }}</option>
          </select>
        </label>
      </div>

      <!-- Skeleton -->
      <div *ngIf="loading" class="gs-skeleton-block">
        <div *ngFor="let _ of skeletonRows" class="gs-row">
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="loadError && !loading" class="gs-error">
        <div class="gs-error-primary">Gate schedule could not load.</div>
        <div class="gs-error-secondary">{{ loadError }}</div>
      </div>

      <!-- Sections -->
      <ng-container *ngIf="!loading && !loadError">

        <!-- Section: Overdue -->
        <section class="gs-section">
          <div class="gs-section-header gs-section-overdue">Overdue</div>
          <div class="gs-row gs-row-header">
            <span>Cycle</span>
            <span>Workstream</span>
            <span>Next Gate</span>
            <span>Target Date</span>
          </div>
          <ng-container *ngIf="overdueFiltered.length > 0; else overdueEmpty">
            <div *ngFor="let r of overdueFiltered; trackBy: trackByCycleId"
                 class="gs-row gs-row-data"
                 (click)="openCycle(r.cycle.delivery_cycle_id)">
              <span class="gs-cycle-title">{{ r.cycle.cycle_title }}</span>
              <span class="gs-meta">{{ r.cycle.workstream?.workstream_name ?? '—' }}</span>
              <span class="gs-meta">{{ r.nextGate ? gateLabel(r.nextGate) : '—' }}</span>
              <span class="gs-target gs-target-overdue">
                {{ r.targetDate ?? '—' }}
                <span *ngIf="r.daysUntil !== null" class="gs-days-tag">
                  ({{ -r.daysUntil }}d late)
                </span>
              </span>
            </div>
          </ng-container>
          <ng-template #overdueEmpty>
            <div class="gs-row-empty">No overdue gates.</div>
          </ng-template>
        </section>

        <!-- Section: Upcoming 7 days -->
        <section class="gs-section">
          <div class="gs-section-header gs-section-upcoming">Due in 7 days</div>
          <div class="gs-row gs-row-header">
            <span>Cycle</span>
            <span>Workstream</span>
            <span>Next Gate</span>
            <span>Target Date</span>
          </div>
          <ng-container *ngIf="upcomingFiltered.length > 0; else upcomingEmpty">
            <div *ngFor="let r of upcomingFiltered; trackBy: trackByCycleId"
                 class="gs-row gs-row-data"
                 (click)="openCycle(r.cycle.delivery_cycle_id)">
              <span class="gs-cycle-title">{{ r.cycle.cycle_title }}</span>
              <span class="gs-meta">{{ r.cycle.workstream?.workstream_name ?? '—' }}</span>
              <span class="gs-meta">{{ r.nextGate ? gateLabel(r.nextGate) : '—' }}</span>
              <span class="gs-target gs-target-upcoming">
                {{ r.targetDate ?? '—' }}
                <span *ngIf="r.daysUntil !== null" class="gs-days-tag">
                  ({{ r.daysUntil === 0 ? 'today' : 'in ' + r.daysUntil + 'd' }})
                </span>
              </span>
            </div>
          </ng-container>
          <ng-template #upcomingEmpty>
            <div class="gs-row-empty">No gates due in the next 7 days.</div>
          </ng-template>
        </section>

        <!-- Full grid: cycles outside both windows -->
        <section class="gs-section">
          <div class="gs-section-header">All Other Active Cycles</div>
          <div class="gs-row gs-row-header">
            <span>Cycle</span>
            <span>Workstream</span>
            <span>Next Gate</span>
            <span>Target Date</span>
          </div>
          <ng-container *ngIf="otherFiltered.length > 0; else otherEmpty">
            <div *ngFor="let r of otherFiltered; trackBy: trackByCycleId"
                 class="gs-row gs-row-data"
                 (click)="openCycle(r.cycle.delivery_cycle_id)">
              <span class="gs-cycle-title">{{ r.cycle.cycle_title }}</span>
              <span class="gs-meta">{{ r.cycle.workstream?.workstream_name ?? '—' }}</span>
              <span class="gs-meta">{{ r.nextGate ? gateLabel(r.nextGate) : '—' }}</span>
              <span class="gs-target">{{ r.targetDate ?? '—' }}</span>
            </div>
          </ng-container>
          <ng-template #otherEmpty>
            <div class="gs-row-empty">No other active cycles.</div>
          </ng-template>
        </section>

      </ng-container>
    </div>
  `,
  styles: [`
    .gs-shell {
      max-width: 1100px;
      margin: var(--triarq-space-2xl) auto;
      padding: 0 var(--triarq-space-md);
    }
    .gs-header { margin-bottom: var(--triarq-space-md); }
    .gs-back-link {
      font-size: var(--triarq-text-small);
      color: var(--triarq-color-primary);
      text-decoration: none;
    }
    .gs-header-row {
      display: flex; align-items: center; justify-content: space-between;
      margin: 8px 0 4px 0;
    }
    .gs-title { margin: 0; }
    .gs-new-cycle {
      background: var(--triarq-color-primary, #257099); color: #fff;
      border: none; border-radius: 6px;
      padding: 8px 18px; font-size: 14px; font-weight: 500;
      cursor: pointer; white-space: nowrap;
    }
    .gs-subtitle {
      margin: 4px 0 12px 0;
      font-size: 11px; font-style: italic; color: #5A5A5A;
      max-width: 720px; line-height: 1.6;
    }

    /* D-200 Pattern 2: amber left border, 8% opacity background, ⚠ icon */
    .gs-overdue-banner {
      display: flex; align-items: center; gap: 10px;
      background: rgba(245,166,35,0.08);
      border-left: 4px solid var(--triarq-color-sunray, #f5a623);
      border-radius: 0 6px 6px 0;
      padding: 10px 14px;
      margin-bottom: var(--triarq-space-md);
      cursor: pointer;
      font-size: 13px;
    }
    .gs-overdue-banner:hover { background: rgba(245,166,35,0.13); }
    .gs-overdue-icon {
      font-size: 16px; color: var(--triarq-color-sunray, #f5a623); line-height: 1;
    }
    .gs-overdue-text { flex: 1; color: var(--triarq-color-text-primary); font-weight: 500; }
    .gs-overdue-cta { color: var(--triarq-color-primary); font-weight: 500; }

    .gs-controls {
      display: flex; gap: var(--triarq-space-md);
      align-items: center; flex-wrap: wrap;
      margin-bottom: var(--triarq-space-md);
    }
    .gs-toggle, .gs-gate-filter {
      display: flex; align-items: center; gap: 8px;
      font-size: var(--triarq-text-small);
      color: var(--triarq-color-text-secondary);
      cursor: pointer;
    }
    .gs-gate-filter select {
      font-size: var(--triarq-text-small); max-width: 200px;
    }

    .gs-section { margin-bottom: var(--triarq-space-lg); }
    .gs-section-header {
      font-size: 13px; font-weight: 600;
      padding: 8px 12px;
      border-radius: 6px 6px 0 0;
      background: var(--triarq-color-background-subtle);
      color: var(--triarq-color-text-secondary);
    }
    .gs-section-overdue { color: #E96127; } /* Oravive */
    .gs-section-upcoming { color: var(--triarq-color-sunray, #f5a623); }

    .gs-row {
      display: grid;
      grid-template-columns: 2.5fr 1.5fr 1fr 1.2fr;
      gap: var(--triarq-space-sm);
      padding: 8px 12px;
      align-items: center;
      font-size: var(--triarq-text-small);
    }
    .gs-row-header {
      font-weight: 500;
      color: var(--triarq-color-text-secondary);
      border-bottom: 2px solid var(--triarq-color-border);
    }
    .gs-row-data {
      border-bottom: 1px solid var(--triarq-color-border);
      cursor: pointer;
    }
    .gs-row-data:hover { background: var(--triarq-color-background-subtle); }
    .gs-cycle-title { font-weight: 500; color: var(--triarq-color-text-primary); }
    .gs-meta { color: var(--triarq-color-text-secondary); }
    .gs-target { color: var(--triarq-color-text-primary); }
    .gs-target-overdue { color: var(--triarq-color-error, #c0392b); font-weight: 500; }
    .gs-target-upcoming { color: var(--triarq-color-sunray, #f5a623); font-weight: 500; }
    .gs-days-tag {
      font-size: 11px; color: var(--triarq-color-text-secondary);
      margin-left: 6px;
    }

    .gs-row-empty {
      padding: 12px;
      color: var(--triarq-color-text-secondary);
      font-size: var(--triarq-text-small);
      font-style: italic;
      text-align: center;
      border-bottom: 1px solid var(--triarq-color-border);
    }

    .gs-skeleton-block { padding: 12px; }

    .gs-error { padding: var(--triarq-space-md); max-width: 560px; }
    .gs-error-primary {
      color: var(--triarq-color-error); font-weight: 500; margin-bottom: 4px;
    }
    .gs-error-secondary {
      font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary);
    }
  `]
})
export class GatesSummaryComponent implements OnInit, OnDestroy {

  loading              = false;
  loadError            = '';
  isPrivileged         = false;
  canCreateCycle       = false;
  showMyDivisionsOnly  = true;
  userDivisionIds:     string[] = [];
  cycles:              DeliveryCycle[] = [];
  filterGate:          GateName | '' = '';

  readonly allGates: GateName[] = [
    'brief_review','go_to_build','go_to_deploy','go_to_release','close_review'
  ];

  readonly skeletonRows = [1, 2, 3, 4];

  private readonly profileSub = new Subscription();

  constructor(
    private readonly delivery: DeliveryService,
    private readonly mcp:      McpService,
    private readonly profile:  UserProfileService,
    private readonly router:   Router,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.profileSub.add(
      this.profile.profile$.pipe(
        filter((p): p is NonNullable<typeof p> => p !== null),
        take(1)
      ).subscribe(profile => {
        const userId = profile.id ?? '';
        const role   = profile.system_role;
        this.isPrivileged   = role === 'phil' || role === 'admin';
        this.canCreateCycle = ['phil', 'admin', 'ds', 'cb'].includes(role);
        if (!this.isPrivileged) {
          this.loadUserDivisions(userId);
        } else {
          this.loadCycles();
        }
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void { this.profileSub.unsubscribe(); }

  private async loadUserDivisions(userId: string): Promise<void> {
    if (!userId) { this.loadCycles(); return; }
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
    this.loadCycles();
  }

  private loadCycles(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();

    // listCycles supports a single division_id filter; for "Display only my
    // Divisions" with multiple IDs the MCP server applies caller-scope by JWT
    // when no division_id is supplied. We accept that scope here and let the
    // server-side filter handle it; the toggle just nudges between explicit
    // single-division and full caller scope.
    const params: { division_id?: string; include_child_divisions?: boolean } = {};
    if (!this.isPrivileged && this.showMyDivisionsOnly && this.userDivisionIds.length === 1) {
      params.division_id = this.userDivisionIds[0];
      params.include_child_divisions = true;
    }

    this.delivery.listCycles(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycles = (res.data ?? []).filter(c =>
            c.current_lifecycle_stage !== 'COMPLETE' &&
            c.current_lifecycle_stage !== 'CANCELLED'
          );
        } else {
          this.loadError = res.error ?? 'Unable to reach the server. Check your connection and try again.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.loadError = err?.error ?? 'Unable to reach the server. Check your connection and try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onToggleChange(): void { this.loadCycles(); }

  // ── Row classification ────────────────────────────────────────────────────

  private classify(cycle: DeliveryCycle): ScheduleRow {
    const nextGate   = NEXT_GATE_BY_STAGE[cycle.current_lifecycle_stage as LifecycleStage] ?? null;
    const milestone  = nextGate
      ? cycle.milestone_dates?.find(m => m.gate_name === nextGate)
      : null;
    const targetDate = milestone?.target_date ?? null;
    const actualDate = milestone?.actual_date ?? null;

    let daysUntil: number | null = null;
    let isOverdue  = false;
    let isUpcoming = false;

    if (targetDate && !actualDate) {
      const today = new Date(); today.setHours(0,0,0,0);
      const target = new Date(targetDate); target.setHours(0,0,0,0);
      daysUntil = Math.round((target.getTime() - today.getTime()) / 86400000);
      if (daysUntil < 0)         { isOverdue  = true; }
      else if (daysUntil <= 7)   { isUpcoming = true; }
    }

    return { cycle, nextGate, targetDate, daysUntil, isOverdue, isUpcoming };
  }

  /** All rows after classification. */
  get classifiedRows(): ScheduleRow[] {
    return this.cycles.map(c => this.classify(c));
  }

  /** Filter helper applied to overdue/upcoming/other lists. */
  private applyGateFilter(rows: ScheduleRow[]): ScheduleRow[] {
    if (!this.filterGate) return rows;
    return rows.filter(r => r.nextGate === this.filterGate);
  }

  get overdueRows(): ScheduleRow[] { return this.classifiedRows.filter(r => r.isOverdue); }
  get upcomingRows(): ScheduleRow[] { return this.classifiedRows.filter(r => r.isUpcoming); }
  get otherRows(): ScheduleRow[] {
    return this.classifiedRows.filter(r => !r.isOverdue && !r.isUpcoming);
  }

  get overdueFiltered(): ScheduleRow[]  { return this.applyGateFilter(this.overdueRows); }
  get upcomingFiltered(): ScheduleRow[] { return this.applyGateFilter(this.upcomingRows); }
  get otherFiltered(): ScheduleRow[]    { return this.applyGateFilter(this.otherRows); }

  // ── Actions ──────────────────────────────────────────────────────────────

  /** D-DeliveryHub-GateSummary: tap banner to drill to overdue filter. */
  onBannerTap(): void {
    this.router.navigate(['/delivery/cycles'], { queryParams: { gate_status: 'overdue' } });
  }

  openCycle(cycleId: string): void {
    this.router.navigate(['/delivery/cycles', cycleId]);
  }

  /** D-HubCreate-2026-04-06: pre-populate Division when scope is single-division. */
  onNewCycle(): void {
    const queryParams: Record<string, string> = { new: 'true' };
    if (!this.isPrivileged && this.showMyDivisionsOnly && this.userDivisionIds.length === 1) {
      queryParams['division_id'] = this.userDivisionIds[0];
    }
    this.router.navigate(['/delivery/cycles'], { queryParams });
  }

  gateLabel(g: GateName): string { return GATE_LABELS[g]; }

  trackByCycleId(_: number, r: ScheduleRow): string { return r.cycle.delivery_cycle_id; }
}
