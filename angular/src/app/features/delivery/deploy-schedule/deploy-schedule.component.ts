// deploy-schedule.component.ts — DeployScheduleComponent
// Route: /delivery/deploy-schedule  (D-DeliveryHub-FourViews)
//
// Contract 13 surface (Section 12). Go to Deploy gates grouped by quarter and
// by workstream. Top-level: every workstream as a row with inline counts and
// expand chevron. Multiple workstreams may be expanded simultaneously
// (no accordion). Each workstream expands into three section groups:
//
//   1. Prior Quarter [Q label] Actual    — Pilot Start actual date in prior Q.
//                                          Includes COMPLETE cycles. Header
//                                          always renders ("No cycles" empty).
//   2. Current Quarter [Q label]         — Pilot Start actual or target date in
//                                          current calendar Q. Header always
//                                          renders.
//   3. Other Active                      — all other active cycles in this
//                                          workstream that don't fit either
//                                          quarter. Header always renders.
//
// Prior-quarter miss detection (D-PilotSchedule-2026-04-06):
//   If a cycle has a Pilot Start TARGET date in the prior quarter but no actual
//   date set and is still active, the cycle appears in BOTH the Prior Quarter
//   group (with a Behind red dot) AND in the Other Active group. Surfaces the
//   miss without asserting cause.
//
// Pilot Start milestone status dot is shown on every cycle row in this view.

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
  Division,
  DateStatus,
  CycleMilestoneDate
} from '../../../core/types/database';

const DEPLOY_GATE = 'go_to_deploy';

interface WorkstreamGroup {
  workstream_id:    string | null;
  workstream_name:  string;
  // Cycles in this workstream by section
  prior:            DeliveryCycle[];
  current:          DeliveryCycle[];
  other:            DeliveryCycle[];
}

interface QuarterLabel {
  label: string; // e.g. "Q2 2026"
  year:  number;
  q:     number;
}

@Component({
  selector:        'app-deploy-schedule',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule, FormsModule, IonicModule],
  template: `
    <div class="ds-shell">

      <!-- D-298 header -->
      <div class="ds-header">
        <a routerLink="/delivery" class="ds-back-link">← Delivery Cycle Tracking</a>
        <div class="ds-header-row">
          <h3 class="ds-title">Deploy Gate by Quarter</h3>
          <button *ngIf="canCreateCycle" class="ds-new-cycle" (click)="onNewCycle()">
            + New Cycle
          </button>
        </div>
        <p class="ds-subtitle">
          Go to Deploy gates grouped by quarter. See which cycles are scheduled
          to reach production each quarter and track commitment against target
          dates.
        </p>
      </div>

      <label *ngIf="!isPrivileged" class="ds-toggle">
        <input type="checkbox"
               [(ngModel)]="showMyDivisionsOnly"
               (ngModelChange)="onToggleChange()" />
        Display only my Divisions
      </label>

      <!-- Skeleton on initial workstream list load -->
      <div *ngIf="loading">
        <div *ngFor="let _ of skeletonRows" class="ds-row ds-row-skeleton">
          <ion-skeleton-text animated style="height:14px;border-radius:4px;width:60%;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;width:30%;"></ion-skeleton-text>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="loadError && !loading" class="ds-error">
        <div class="ds-error-primary">Deploy schedule could not load.</div>
        <div class="ds-error-secondary">{{ loadError }}</div>
      </div>

      <!-- Workstream rows -->
      <ng-container *ngIf="!loading && !loadError">

        <div *ngFor="let group of workstreamGroups; trackBy: trackByWsId">

          <button class="ds-ws-row" type="button" (click)="toggle(group.workstream_id)">
            <span class="ds-chevron"
                  [style.transform]="isExpanded(group.workstream_id) ? 'rotate(0)' : 'rotate(-90deg)'">▼</span>
            <span class="ds-ws-name"
                  (click)="$event.stopPropagation(); openWorkstream(group.workstream_id)">
              {{ group.workstream_name }}
            </span>
            <span class="ds-counts">
              Prior: {{ group.prior.length }}
              · Current: {{ group.current.length }}
              · Other: {{ group.other.length }}
            </span>
          </button>

          <!-- Expanded body — three sections -->
          <div *ngIf="isExpanded(group.workstream_id)" class="ds-ws-body">

            <!-- Prior Quarter -->
            <section class="ds-section">
              <div class="ds-section-header">
                Prior Quarter — {{ priorQuarter.label }} Actual
              </div>
              <div class="ds-grid ds-grid-header">
                <span>Cycle</span>
                <span>Stage</span>
                <span>Pilot Start</span>
                <span>Status</span>
              </div>
              <ng-container *ngIf="group.prior.length > 0; else priorEmpty">
                <div *ngFor="let c of group.prior; trackBy: trackByCycleId"
                     class="ds-grid ds-grid-row"
                     (click)="openCycle(c.delivery_cycle_id)">
                  <span class="ds-cycle-title">{{ c.cycle_title }}</span>
                  <span class="ds-meta">{{ c.current_lifecycle_stage }}</span>
                  <span>{{ pilotStartDisplay(c) }}</span>
                  <span>
                    <span class="ds-dot"
                          [style.background]="pilotStatusColor(c)"
                          [title]="pilotStatusLabel(c)"></span>
                    <span class="ds-status-text" [style.color]="pilotStatusColor(c)">
                      {{ pilotStatusLabel(c) }}
                    </span>
                  </span>
                </div>
              </ng-container>
              <ng-template #priorEmpty>
                <div class="ds-row-empty">No cycles.</div>
              </ng-template>
            </section>

            <!-- Current Quarter -->
            <section class="ds-section">
              <div class="ds-section-header">
                Current Quarter — {{ currentQuarter.label }} Planned/Actual
              </div>
              <div class="ds-grid ds-grid-header">
                <span>Cycle</span>
                <span>Stage</span>
                <span>Pilot Start</span>
                <span>Status</span>
              </div>
              <ng-container *ngIf="group.current.length > 0; else currentEmpty">
                <div *ngFor="let c of group.current; trackBy: trackByCycleId"
                     class="ds-grid ds-grid-row"
                     (click)="openCycle(c.delivery_cycle_id)">
                  <span class="ds-cycle-title">{{ c.cycle_title }}</span>
                  <span class="ds-meta">{{ c.current_lifecycle_stage }}</span>
                  <span>{{ pilotStartDisplay(c) }}</span>
                  <span>
                    <span class="ds-dot"
                          [style.background]="pilotStatusColor(c)"
                          [title]="pilotStatusLabel(c)"></span>
                    <span class="ds-status-text" [style.color]="pilotStatusColor(c)">
                      {{ pilotStatusLabel(c) }}
                    </span>
                  </span>
                </div>
              </ng-container>
              <ng-template #currentEmpty>
                <div class="ds-row-empty">No cycles.</div>
              </ng-template>
            </section>

            <!-- Other Active -->
            <section class="ds-section">
              <div class="ds-section-header">Other Active</div>
              <div class="ds-grid ds-grid-header">
                <span>Cycle</span>
                <span>Stage</span>
                <span>Pilot Start</span>
                <span>Status</span>
              </div>
              <ng-container *ngIf="group.other.length > 0; else otherEmpty">
                <div *ngFor="let c of group.other; trackBy: trackByCycleId"
                     class="ds-grid ds-grid-row"
                     (click)="openCycle(c.delivery_cycle_id)">
                  <span class="ds-cycle-title">{{ c.cycle_title }}</span>
                  <span class="ds-meta">{{ c.current_lifecycle_stage }}</span>
                  <span>{{ pilotStartDisplay(c) }}</span>
                  <span>
                    <span class="ds-dot"
                          [style.background]="pilotStatusColor(c)"
                          [title]="pilotStatusLabel(c)"></span>
                    <span class="ds-status-text" [style.color]="pilotStatusColor(c)">
                      {{ pilotStatusLabel(c) }}
                    </span>
                  </span>
                </div>
              </ng-container>
              <ng-template #otherEmpty>
                <div class="ds-row-empty">No cycles.</div>
              </ng-template>
            </section>

          </div>
        </div>

        <!-- Empty state for workstream list -->
        <div *ngIf="workstreamGroups.length === 0" class="ds-empty">
          No workstreams found.
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .ds-shell {
      max-width: 1100px;
      margin: var(--triarq-space-2xl) auto;
      padding: 0 var(--triarq-space-md);
    }
    .ds-header { margin-bottom: var(--triarq-space-md); }
    .ds-back-link {
      font-size: var(--triarq-text-small);
      color: var(--triarq-color-primary);
      text-decoration: none;
    }
    .ds-header-row {
      display: flex; align-items: center; justify-content: space-between;
      margin: 8px 0 4px 0;
    }
    .ds-title { margin: 0; }
    .ds-new-cycle {
      background: var(--triarq-color-primary, #257099); color: #fff;
      border: none; border-radius: 6px;
      padding: 8px 18px; font-size: 14px; font-weight: 500;
      cursor: pointer; white-space: nowrap;
    }
    .ds-subtitle {
      margin: 4px 0 12px 0;
      font-size: 11px; font-style: italic; color: #5A5A5A;
      max-width: 720px; line-height: 1.6;
    }
    .ds-toggle {
      display: flex; align-items: center; gap: 8px;
      font-size: var(--triarq-text-small);
      color: var(--triarq-color-text-secondary);
      margin-bottom: var(--triarq-space-md); cursor: pointer;
    }

    .ds-ws-row {
      width: 100%; display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; background: var(--triarq-color-background-subtle);
      border: none; border-radius: 6px;
      margin: 8px 0 4px 0; cursor: pointer;
      font-size: 13px;
    }
    .ds-ws-row:hover { background: rgba(37,112,153,0.06); }
    .ds-chevron {
      font-size: 11px; color: var(--triarq-color-text-secondary);
      transition: transform 0.15s; flex-shrink: 0;
    }
    .ds-ws-name {
      font-weight: 600; color: var(--triarq-color-primary);
      cursor: pointer; flex: 1; text-align: left;
    }
    .ds-ws-name:hover { text-decoration: underline; }
    .ds-counts {
      font-size: 12px; color: var(--triarq-color-text-secondary);
    }

    .ds-ws-body {
      padding: 0 12px var(--triarq-space-md) 12px;
    }
    .ds-section { margin-top: var(--triarq-space-md); }
    .ds-section-header {
      font-size: 12px; font-weight: 600;
      padding: 6px 10px; border-radius: 4px;
      background: rgba(37,112,153,0.06);
      color: var(--triarq-color-text-secondary);
      text-transform: uppercase; letter-spacing: 0.04em;
    }

    .ds-grid {
      display: grid;
      grid-template-columns: 3fr 1fr 1.2fr 1.5fr;
      gap: var(--triarq-space-sm);
      padding: 8px 12px;
      align-items: center;
      font-size: var(--triarq-text-small);
    }
    .ds-grid-header {
      font-weight: 500;
      color: var(--triarq-color-text-secondary);
      border-bottom: 2px solid var(--triarq-color-border);
    }
    .ds-grid-row {
      border-bottom: 1px solid var(--triarq-color-border);
      cursor: pointer;
    }
    .ds-grid-row:hover { background: var(--triarq-color-background-subtle); }
    .ds-cycle-title { font-weight: 500; color: var(--triarq-color-text-primary); }
    .ds-meta { color: var(--triarq-color-text-secondary); }
    .ds-dot {
      display: inline-block; width: 9px; height: 9px;
      border-radius: 50%; margin-right: 6px; vertical-align: middle;
    }
    .ds-status-text { font-size: 11px; }

    .ds-row-empty {
      padding: 10px 12px;
      color: var(--triarq-color-text-secondary);
      font-size: var(--triarq-text-small);
      font-style: italic;
      text-align: center;
      border-bottom: 1px solid var(--triarq-color-border);
    }
    .ds-row-skeleton {
      display: flex; gap: 16px; padding: 10px 12px;
      border-bottom: 1px solid var(--triarq-color-border);
    }

    .ds-empty {
      padding: var(--triarq-space-xl);
      text-align: center; font-size: var(--triarq-text-small);
      color: var(--triarq-color-text-secondary);
    }

    .ds-error { padding: var(--triarq-space-md); max-width: 560px; }
    .ds-error-primary {
      color: var(--triarq-color-error); font-weight: 500; margin-bottom: 4px;
    }
    .ds-error-secondary {
      font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary);
    }
  `]
})
export class DeployScheduleComponent implements OnInit, OnDestroy {

  loading              = false;
  loadError            = '';
  isPrivileged         = false;
  canCreateCycle       = false;
  showMyDivisionsOnly  = true;
  userDivisionIds:     string[] = [];

  cycles:      DeliveryCycle[] = [];
  workstreams: { workstream_id: string; workstream_name: string }[] = [];
  expanded:    Set<string> = new Set();

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
          this.loadAll();
        }
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void { this.profileSub.unsubscribe(); }

  private async loadUserDivisions(userId: string): Promise<void> {
    if (!userId) { this.loadAll(); return; }
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
    this.loadAll();
  }

  /** Loads cycles + workstream summary in parallel; classifies locally. */
  private async loadAll(): Promise<void> {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();

    const cycleParams: { division_id?: string; include_child_divisions?: boolean } = {};
    if (!this.isPrivileged && this.showMyDivisionsOnly && this.userDivisionIds.length === 1) {
      cycleParams.division_id = this.userDivisionIds[0];
      cycleParams.include_child_divisions = true;
    }
    const wsParams: { division_ids?: string[] } = {};
    if (!this.isPrivileged && this.showMyDivisionsOnly && this.userDivisionIds.length > 0) {
      wsParams.division_ids = this.userDivisionIds;
    }

    try {
      const [cyclesRes, summaryRes] = await Promise.all([
        firstValueFrom(this.delivery.listCycles(cycleParams)),
        firstValueFrom(this.delivery.getDeliverySummary(wsParams))
      ]);
      if (cyclesRes.success && cyclesRes.data) {
        this.cycles = cyclesRes.data ?? [];
      } else {
        this.loadError = cyclesRes.error ?? 'Could not load cycles.';
      }
      if (summaryRes.success && summaryRes.data) {
        this.workstreams = (summaryRes.data.workstream_summaries ?? [])
          .filter(w => w.workstream_id !== null)
          .map(w => ({
            workstream_id:   w.workstream_id as string,
            workstream_name: w.workstream_name
          }));
      }
    } catch (err: unknown) {
      const e = err as { error?: string };
      this.loadError = e?.error ?? 'Unable to reach the server. Check your connection and try again.';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  onToggleChange(): void { this.loadAll(); }

  // ── Quarter math ──────────────────────────────────────────────────────────

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

  // ── Pilot Start helpers ───────────────────────────────────────────────────

  private pilotMilestone(c: DeliveryCycle): CycleMilestoneDate | null {
    return c.milestone_dates?.find(m => m.gate_name === DEPLOY_GATE) ?? null;
  }

  pilotStartDisplay(c: DeliveryCycle): string {
    const m = this.pilotMilestone(c);
    if (!m) return '—';
    if (m.actual_date) return m.actual_date + ' (actual)';
    if (m.target_date) return m.target_date + ' (target)';
    return '—';
  }

  pilotStatusLabel(c: DeliveryCycle): string {
    const m = this.pilotMilestone(c);
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

  pilotStatusColor(c: DeliveryCycle): string {
    const m = this.pilotMilestone(c);
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
   * D-PilotSchedule-2026-04-06: classify each cycle into Prior/Current/Other
   * sections per workstream. Prior-quarter miss detection: a cycle with TARGET
   * Pilot Start in the prior quarter but no actual + still active appears in
   * BOTH Prior Quarter AND Other Active.
   */
  get workstreamGroups(): WorkstreamGroup[] {
    // Index cycles by workstream_id
    const byWs = new Map<string, DeliveryCycle[]>();
    for (const c of this.cycles) {
      const k = c.workstream_id ?? '__none__';
      if (!byWs.has(k)) byWs.set(k, []);
      byWs.get(k)!.push(c);
    }

    const prior   = this.priorQuarter;
    const current = this.currentQuarter;

    // Always include all known workstreams (even with zero cycles) per spec.
    const wsList = this.workstreams.length > 0
      ? this.workstreams
      : Array.from(byWs.keys()).map(id => ({
          workstream_id: id,
          workstream_name: id === '__none__' ? '(No workstream assigned)' : id
        }));

    return wsList.map(ws => {
      const cycles = byWs.get(ws.workstream_id) ?? [];
      const priorList:   DeliveryCycle[] = [];
      const currentList: DeliveryCycle[] = [];
      const otherList:   DeliveryCycle[] = [];

      const isActive = (c: DeliveryCycle) =>
        c.current_lifecycle_stage !== 'COMPLETE' &&
        c.current_lifecycle_stage !== 'CANCELLED';

      for (const c of cycles) {
        const m = this.pilotMilestone(c);
        const actualInPrior   = !!m?.actual_date && this.inQuarter(m.actual_date, prior);
        const actualInCurrent = !!m?.actual_date && this.inQuarter(m.actual_date, current);
        const targetInCurrent = !!m?.target_date && this.inQuarter(m.target_date, current);
        const targetInPrior   = !!m?.target_date && !m.actual_date && this.inQuarter(m.target_date, prior);

        let placed = false;

        // Prior actual — includes COMPLETE cycles per spec.
        if (actualInPrior) {
          priorList.push(c);
          placed = true;
        }

        // Current actual or target.
        if (actualInCurrent || targetInCurrent) {
          currentList.push(c);
          placed = true;
        }

        // Prior-quarter miss detection — also surface in Other Active.
        if (targetInPrior && isActive(c)) {
          priorList.push(c);
          otherList.push(c);
          placed = true;
        }

        if (!placed && isActive(c)) {
          otherList.push(c);
        }
      }

      return {
        workstream_id:   ws.workstream_id,
        workstream_name: ws.workstream_name,
        prior:   priorList,
        current: currentList,
        other:   otherList
      };
    }).sort((a, b) => a.workstream_name.localeCompare(b.workstream_name));
  }

  // ── Expand state — multiple workstreams expandable simultaneously ─────────

  toggle(workstreamId: string | null): void {
    const k = workstreamId ?? '__none__';
    if (this.expanded.has(k)) {
      this.expanded.delete(k);
    } else {
      this.expanded.add(k);
    }
    this.cdr.markForCheck();
  }

  isExpanded(workstreamId: string | null): boolean {
    return this.expanded.has(workstreamId ?? '__none__');
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  openCycle(cycleId: string): void {
    this.router.navigate(['/delivery/cycles', cycleId]);
  }

  openWorkstream(workstreamId: string | null): void {
    this.router.navigate(['/delivery/workstreams'], {
      queryParams: workstreamId ? { workstream_id: workstreamId } : {}
    });
  }

  /** D-HubCreate-2026-04-06: Workstream pre-populated from the expanded row. */
  onNewCycle(): void {
    const queryParams: Record<string, string> = { new: 'true' };
    const expandedIds = Array.from(this.expanded);
    if (expandedIds.length === 1 && expandedIds[0] !== '__none__') {
      queryParams['workstream_id'] = expandedIds[0];
    }
    this.router.navigate(['/delivery/cycles'], { queryParams });
  }

  trackByWsId(_: number, group: WorkstreamGroup): string {
    return group.workstream_id ?? '__none__';
  }

  trackByCycleId(_: number, c: DeliveryCycle): string {
    return c.delivery_cycle_id;
  }
}
