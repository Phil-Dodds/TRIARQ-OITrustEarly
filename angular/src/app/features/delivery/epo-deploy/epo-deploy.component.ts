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
  CycleMilestoneDate,
  RoadmapFreezeDate
} from '../../../core/types/database';
import {
  QuarterRef,
  quarterOfDate,
  shiftQuarter as shiftQuarterRef,
  quarterFromIso,
  isoInQuarter,
  quarterIndex,
  computePriorQuarterSymbol,
  PRIOR_QUARTER_SYMBOL_DISPLAY,
  PriorQuarterSymbol
} from '../shared/roadmap-planning.util';

const DEPLOY_GATE = 'go_to_deploy';
// D-419 walkback chain — Go to Deploy → Go to Build → Brief Review. First gate
// with non-default status wins the row dot. See walkbackMilestone().
const WALKBACK_CHAIN: readonly string[] = ['go_to_deploy', 'go_to_build', 'brief_review'];

interface EpoGroup {
  user_id:      string;
  display_name: string;
  // D-419 four-section model. `other` retired, replaced by next2Q + unscheduled.
  prior:        DeliveryCycle[];
  current:      DeliveryCycle[];
  nextQ1:       DeliveryCycle[];  // Q+1
  nextQ2:       DeliveryCycle[];  // Q+2
  unscheduled:  DeliveryCycle[];
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

          <!-- D-445: Quarter Pivot Control — non-persistent, resets on every load. -->
          <div class="rpd-pivot" *ngIf="referenceQuarter">
            <button type="button" class="rpd-pivot-btn" (click)="onShiftQuarter(-1)" aria-label="Previous quarter">‹</button>
            <span class="rpd-pivot-label">{{ referenceQuarter.label }}</span>
            <button type="button" class="rpd-pivot-btn" (click)="onShiftQuarter(1)"  aria-label="Next quarter">›</button>
          </div>

          <button *ngIf="canCreateCycle" class="edp-new-cycle" (click)="onNewCycle()">+ New Initiative</button>
        </div>

        <!-- D-446: Baseline selector — non-persistent. -->
        <div class="rpd-baseline-row">
          <label class="rpd-baseline-label">Baseline:</label>
          <select class="rpd-baseline-select"
                  [disabled]="freezeDates.length === 0"
                  [ngModel]="selectedFreezeDateId"
                  (ngModelChange)="onBaselineChange($event)">
            <option *ngIf="freezeDates.length === 0" [ngValue]="null">No baselines saved — see Admin</option>
            <ng-container *ngIf="freezeDates.length > 0">
              <option [ngValue]="null">— Select baseline —</option>
              <option *ngFor="let fd of freezeDates" [ngValue]="fd.freeze_date_id">
                {{ fd.freeze_label }} — {{ formatBaselineDate(fd.freeze_date) }}
              </option>
            </ng-container>
          </select>
        </div>

        <p class="edp-subtitle">
          Go to Deploy gate cadence per EPO across the prior quarter ({{ priorQuarter.label }}),
          current quarter ({{ currentQuarter.label }}), and active Initiatives. Use the quarter
          control to anchor a different reference quarter. Select a baseline to compare prior
          quarter planned vs. actual deployments.
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
            <!-- D-419: four counts replace three. -->
            <span class="edp-counts">
              Prior: {{ group.prior.length }}
              · Current: {{ group.current.length }}
              · Next 2Q: {{ group.nextQ1.length + group.nextQ2.length }}
              · Unscheduled: {{ group.unscheduled.length }}
            </span>
          </button>

          <!-- D-419 four-section body. -->
          <div *ngIf="isExpanded(group.user_id)" class="edp-body">

            <!-- Section 1 — Prior Quarter Actual / Planned vs Actual -->
            <section class="edp-section">
              <div class="edp-section-header">
                {{ priorSectionHeader }}
              </div>

              <!-- D-446: Data gap notice (D-200 Pattern 2). -->
              <div *ngIf="showDataGapNotice" class="rpd-data-gap">
                <span class="rpd-data-gap-text">
                  Target date history before {{ dataGapBoundaryLabel }} is incomplete.
                  Some initiatives may be misclassified.
                </span>
                <button type="button" class="rpd-data-gap-dismiss" (click)="dismissDataGap()">Got it</button>
              </div>

              <div class="edp-grid edp-grid-header">
                <span>Initiative</span><span>Stage</span><span>Deploy Date</span><span>Status</span>
              </div>
              <ng-container *ngIf="group.prior.length > 0; else priorEmpty">
                <div *ngFor="let c of group.prior; trackBy: trackByCycleId"
                     class="edp-grid edp-grid-row" (click)="openCycle(c.delivery_cycle_id)">
                  <span class="edp-cycle-title">
                    <span *ngIf="priorQuarterSymbolFor(c) as sym"
                          class="rpd-prior-symbol"
                          [style.color]="sym.color">{{ sym.char }}</span>
                    {{ c.cycle_title }}
                  </span>
                  <span class="edp-meta">{{ c.current_lifecycle_stage }}</span>
                  <span>{{ deployDisplay(c) }}</span>
                  <span>
                    <span class="edp-dot" [style.background]="deployStatusColor(c)"
                          [title]="deployStatusLabel(c)"></span>
                    <span class="edp-status-text" [style.color]="deployStatusColor(c)">
                      {{ deployStatusLabel(c) }}
                    </span>
                  </span>
                </div>
              </ng-container>
              <ng-template #priorEmpty><div class="edp-row-empty">No Initiatives.</div></ng-template>
            </section>

            <!-- Section 2 — Current Quarter Planned/Actual -->
            <section class="edp-section">
              <div class="edp-section-header">
                Current Quarter — {{ currentQuarter.label }} Planned/Actual
              </div>
              <div class="edp-grid edp-grid-header">
                <span>Initiative</span><span>Stage</span><span>Deploy Date</span><span>Status</span>
              </div>
              <ng-container *ngIf="group.current.length > 0; else currentEmpty">
                <div *ngFor="let c of group.current; trackBy: trackByCycleId"
                     class="edp-grid edp-grid-row" (click)="openCycle(c.delivery_cycle_id)">
                  <span class="edp-cycle-title">{{ c.cycle_title }}</span>
                  <span class="edp-meta">{{ c.current_lifecycle_stage }}</span>
                  <span>{{ deployDisplay(c) }}</span>
                  <span>
                    <span class="edp-dot" [style.background]="deployStatusColor(c)"
                          [title]="deployStatusLabel(c)"></span>
                    <span class="edp-status-text" [style.color]="deployStatusColor(c)">
                      {{ deployStatusLabel(c) }}
                    </span>
                  </span>
                </div>
              </ng-container>
              <ng-template #currentEmpty><div class="edp-row-empty">No Initiatives.</div></ng-template>
            </section>

            <!-- Section 3 — Next Two Quarters Targeted (sub-grouped Q+1 then Q+2) -->
            <section class="edp-section">
              <div class="edp-section-header">
                Next Two Quarters — {{ nextQ1.label }} / {{ nextQ2.label }} Targeted
              </div>
              <div class="edp-grid edp-grid-header">
                <span>Initiative</span><span>Stage</span><span>Deploy Date</span><span>Status</span>
              </div>
              <!-- Q+1 sub-section -->
              <div class="edp-subgroup">{{ nextQ1.label }}</div>
              <ng-container *ngIf="group.nextQ1.length > 0; else q1Empty">
                <div *ngFor="let c of group.nextQ1; trackBy: trackByCycleId"
                     class="edp-grid edp-grid-row" (click)="openCycle(c.delivery_cycle_id)">
                  <span class="edp-cycle-title">{{ c.cycle_title }}</span>
                  <span class="edp-meta">{{ c.current_lifecycle_stage }}</span>
                  <span>{{ deployDisplay(c) }}</span>
                  <span>
                    <span class="edp-dot" [style.background]="deployStatusColor(c)"
                          [title]="deployStatusLabel(c)"></span>
                    <span class="edp-status-text" [style.color]="deployStatusColor(c)">
                      {{ deployStatusLabel(c) }}
                    </span>
                  </span>
                </div>
              </ng-container>
              <ng-template #q1Empty><div class="edp-row-empty">No Initiatives.</div></ng-template>
              <!-- Q+2 sub-section -->
              <div class="edp-subgroup">{{ nextQ2.label }}</div>
              <ng-container *ngIf="group.nextQ2.length > 0; else q2Empty">
                <div *ngFor="let c of group.nextQ2; trackBy: trackByCycleId"
                     class="edp-grid edp-grid-row" (click)="openCycle(c.delivery_cycle_id)">
                  <span class="edp-cycle-title">{{ c.cycle_title }}</span>
                  <span class="edp-meta">{{ c.current_lifecycle_stage }}</span>
                  <span>{{ deployDisplay(c) }}</span>
                  <span>
                    <span class="edp-dot" [style.background]="deployStatusColor(c)"
                          [title]="deployStatusLabel(c)"></span>
                    <span class="edp-status-text" [style.color]="deployStatusColor(c)">
                      {{ deployStatusLabel(c) }}
                    </span>
                  </span>
                </div>
              </ng-container>
              <ng-template #q2Empty><div class="edp-row-empty">No Initiatives.</div></ng-template>
            </section>

            <!-- Section 4 — Unscheduled Active -->
            <section class="edp-section">
              <div class="edp-section-header">Unscheduled Active</div>
              <div class="edp-grid edp-grid-header">
                <span>Initiative</span><span>Stage</span><span>Deploy Date</span><span>Status</span>
              </div>
              <ng-container *ngIf="group.unscheduled.length > 0; else unschedEmpty">
                <div *ngFor="let c of group.unscheduled; trackBy: trackByCycleId"
                     class="edp-grid edp-grid-row" (click)="openCycle(c.delivery_cycle_id)">
                  <span class="edp-cycle-title">{{ c.cycle_title }}</span>
                  <span class="edp-meta">{{ c.current_lifecycle_stage }}</span>
                  <span>{{ deployDisplay(c) }}</span>
                  <span>
                    <span class="edp-dot" [style.background]="deployStatusColor(c)"
                          [title]="deployStatusLabel(c)"></span>
                    <span class="edp-status-text" [style.color]="deployStatusColor(c)">
                      {{ deployStatusLabel(c) }}
                    </span>
                  </span>
                </div>
              </ng-container>
              <ng-template #unschedEmpty><div class="edp-row-empty">No Initiatives.</div></ng-template>
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
    .edp-header-row { display: flex; align-items: center; gap: var(--triarq-space-md); justify-content: space-between; margin: 8px 0 4px; flex-wrap: wrap; }
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
    .edp-subgroup { font-size: 11px; font-weight: 600; color: var(--triarq-color-text-secondary); padding: 6px 10px 4px; text-transform: uppercase; letter-spacing: 0.04em; }
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

  // D-445: Reference quarter — non-persistent. Initialized to actual current
  // calendar quarter on every component init. Mutated by Quarter Pivot Control.
  referenceQuarter: QuarterRef = quarterOfDate(new Date());

  // D-446: Baseline selector state — non-persistent. selectedFreezeDateId is
  // bound to the <select>; selectedFreezeDate is the resolved record.
  freezeDates: RoadmapFreezeDate[]               = [];
  selectedFreezeDateId: string | null            = null;
  selectedFreezeDate:   RoadmapFreezeDate | null = null;

  // D-446: Data gap notice — dismissed flag persisted via user_screen_state.
  dataGapDismissed = false;

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
    // D-445: pivot resets to actual current quarter on every load.
    this.referenceQuarter = quarterOfDate(new Date());

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

        // D-446: load persisted data-gap dismissal flag.
        const gapState = await this.screenState.restore(
          SCREEN_KEYS.INITIATIVES_EPO_DEPLOY_DATA_GAP_DISMISSED
        );
        this.dataGapDismissed = gapState?.filter_state?.['dismissed'] === true;

        if (!this.isPrivileged) {
          await this.loadUserDivisions(userId);
        }
        this.loadFreezeDates();
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

    const params: {
      division_id?:             string;
      include_child_divisions?: boolean;
      include_event_log?:       boolean;
    } = {};
    if (!this.isPrivileged && this.showMyDivisionsOnly && this.userDivisionIds.length === 1) {
      params.division_id = this.userDivisionIds[0];
      params.include_child_divisions = true;
    }
    // D-446: only pull event log when a baseline is selected — symbol algorithm
    // is the only consumer.
    if (this.selectedFreezeDate) {
      params.include_event_log = true;
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

  // ── D-444 / D-446: Baseline list + selection ─────────────────────────────

  private loadFreezeDates(): void {
    this.delivery.listRoadmapFreezeDates().subscribe({
      next: (res) => {
        this.freezeDates = (res.success && res.data) ? res.data : [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.freezeDates = [];
        this.cdr.markForCheck();
      }
    });
  }

  onBaselineChange(freezeDateId: string | null): void {
    this.selectedFreezeDateId = freezeDateId;
    this.selectedFreezeDate   = freezeDateId
      ? (this.freezeDates.find(f => f.freeze_date_id === freezeDateId) ?? null)
      : null;
    // Re-query so target_date_change_events are present (or stripped) per state.
    this.loadCycles();
  }

  formatBaselineDate(iso: string): string {
    if (!iso) { return '—'; }
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) { return iso; }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  onToggleChange(): void {
    this.screenState.save(
      SCREEN_KEYS.INITIATIVES_EPO_DEPLOY,
      { showMyDivisionsOnly: this.showMyDivisionsOnly },
      {}
    );
    this.loadCycles();
  }

  // ── D-445: Reference-quarter pivot ────────────────────────────────────────

  onShiftQuarter(delta: number): void {
    this.referenceQuarter = shiftQuarterRef(this.referenceQuarter, delta);
    this.cdr.markForCheck();
  }

  // ── Quarter accessors — derive from referenceQuarter (D-445) ─────────────

  get currentQuarter(): QuarterRef { return this.referenceQuarter; }
  get priorQuarter():   QuarterRef { return shiftQuarterRef(this.referenceQuarter, -1); }
  get nextQ1():         QuarterRef { return shiftQuarterRef(this.referenceQuarter, 1); }
  get nextQ2():         QuarterRef { return shiftQuarterRef(this.referenceQuarter, 2); }

  private inQuarter(iso: string | null | undefined, target: QuarterRef): boolean {
    return isoInQuarter(iso, target);
  }

  private isoQuarterIndex(iso: string | null | undefined): number | null {
    const q = quarterFromIso(iso);
    return q ? quarterIndex(q) : null;
  }

  // ── D-446: Section header + per-row symbol + data-gap notice ─────────────

  get priorSectionHeader(): string {
    const base = `Prior Quarter — ${this.priorQuarter.label}`;
    if (this.selectedFreezeDate) {
      return `${base} Planned / Actual · ${this.selectedFreezeDate.freeze_label}`;
    }
    return `${base} Actual`;
  }

  /** Returns symbol display object for the row, or null when no symbol. */
  priorQuarterSymbolFor(c: DeliveryCycle): { char: string; color: string } | null {
    if (!this.selectedFreezeDate) { return null; }
    const sym: PriorQuarterSymbol | null = computePriorQuarterSymbol(
      c,
      this.selectedFreezeDate.freeze_date,
      this.priorQuarter,
      c.target_date_change_events
    );
    return sym ? PRIOR_QUARTER_SYMBOL_DISPLAY[sym] : null;
  }

  /** Spec §Workstream 3 Data Gap Disclosure — show when (a) baseline selected,
   *  (b) not yet dismissed, and (c) zero milestone_target_date_changed events
   *  exist across the loaded cycles. Contract 23 deploy date is not currently
   *  recorded in CLAUDE.md or changelog.ts — CC-27-4 records this fallback. */
  get showDataGapNotice(): boolean {
    if (!this.selectedFreezeDate || this.dataGapDismissed) { return false; }
    const anyEvents = this.cycles.some(c => (c.target_date_change_events?.length ?? 0) > 0);
    return !anyEvents;
  }

  get dataGapBoundaryLabel(): string {
    if (!this.selectedFreezeDate) { return ''; }
    return this.formatBaselineDate(this.selectedFreezeDate.freeze_date);
  }

  dismissDataGap(): void {
    this.dataGapDismissed = true;
    this.screenState.save(
      SCREEN_KEYS.INITIATIVES_EPO_DEPLOY_DATA_GAP_DISMISSED,
      { dismissed: true },
      {}
    );
    this.cdr.markForCheck();
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

  /** D-419 — walkback: first gate in WALKBACK_CHAIN with non-default status wins. */
  private walkbackMilestone(c: DeliveryCycle): CycleMilestoneDate | null {
    for (const gate of WALKBACK_CHAIN) {
      const m = c.milestone_dates?.find(x => x.gate_name === gate);
      if (m && m.date_status && m.date_status !== 'not_started') { return m; }
    }
    return null;
  }

  deployStatusLabel(c: DeliveryCycle): string {
    const m = this.walkbackMilestone(c);
    if (!m) return 'Not Started';
    const map: Record<DateStatus, string> = {
      not_started: 'Not Started',
      on_track:    'On Track',
      at_risk:     'At Risk',
      behind:      'Behind',
      complete:    'Complete'
    };
    return map[m.date_status] ?? '—';
  }

  /** D-419 + D-205 colors — On Track #22c55e, Behind #E96127. */
  deployStatusColor(c: DeliveryCycle): string {
    const m = this.walkbackMilestone(c);
    const colors: Record<string, string> = {
      not_started: '#9E9E9E',
      on_track:    '#22c55e',
      at_risk:     '#F2A620',
      behind:      '#E96127',
      complete:    '#257099'
    };
    return colors[m?.date_status ?? 'not_started'] ?? '#9E9E9E';
  }

  // ── Grouping ──────────────────────────────────────────────────────────────

  /**
   * D-419 four-section grouping by EPO:
   *   1. Prior Quarter Actual           — actual in prior Q (includes COMPLETE).
   *                                       Plus prior-quarter miss (target in prior,
   *                                       no actual, still active) — appears here
   *                                       AND in Next Two if its target shifted forward.
   *   2. Current Quarter Planned/Actual — actual or target in current Q (COMPLETE if actual).
   *   3. Next Two Quarters Targeted     — target in Q+1 or Q+2 (no actual), or actual
   *                                       falling in Q+1/Q+2. Active only. Sub-grouped Q+1, Q+2.
   *   4. Unscheduled Active             — active, target null OR target beyond Q+2.
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
    const q1      = this.nextQ1;
    const q2      = this.nextQ2;
    const q2Index = quarterIndex(q2);

    const isActive = (c: DeliveryCycle) =>
      c.current_lifecycle_stage !== 'COMPLETE' &&
      c.current_lifecycle_stage !== 'CANCELLED' &&
      c.current_lifecycle_stage !== 'ON_HOLD';

    const groups: EpoGroup[] = [];
    for (const [user_id, entry] of byEpo) {
      const priorList:   DeliveryCycle[] = [];
      const currentList: DeliveryCycle[] = [];
      const nextQ1List:  DeliveryCycle[] = [];
      const nextQ2List:  DeliveryCycle[] = [];
      const unschedList: DeliveryCycle[] = [];

      for (const c of entry.cycles) {
        const m = this.deployMilestone(c);
        const actualInPrior   = !!m?.actual_date && this.inQuarter(m.actual_date, prior);
        const actualInCurrent = !!m?.actual_date && this.inQuarter(m.actual_date, current);
        const targetInCurrent = !m?.actual_date && !!m?.target_date && this.inQuarter(m.target_date, current);
        const actualInNext1   = !!m?.actual_date && this.inQuarter(m.actual_date, q1);
        const actualInNext2   = !!m?.actual_date && this.inQuarter(m.actual_date, q2);
        const targetInNext1   = !m?.actual_date && !!m?.target_date && this.inQuarter(m.target_date, q1);
        const targetInNext2   = !m?.actual_date && !!m?.target_date && this.inQuarter(m.target_date, q2);
        const targetInPriorMiss = !!m?.target_date && !m?.actual_date && this.inQuarter(m.target_date, prior);

        let placed = false;

        // Section 1: Prior actual (any lifecycle stage including COMPLETE).
        if (actualInPrior) { priorList.push(c); placed = true; }

        // Section 2: Current quarter (actual or target).
        if (actualInCurrent || targetInCurrent) { currentList.push(c); placed = true; }

        // Section 3: Next two quarters (active only).
        if (isActive(c)) {
          if (actualInNext1 || targetInNext1) { nextQ1List.push(c); placed = true; }
          if (actualInNext2 || targetInNext2) { nextQ2List.push(c); placed = true; }
        }

        // Section 1 also: prior-quarter miss surfaced inline with red dot.
        if (targetInPriorMiss && isActive(c)) {
          priorList.push(c);
          placed = true;
        }

        // Section 4: Unscheduled Active — active and (no target, target before prior, or beyond Q+2).
        if (!placed && isActive(c)) {
          const tIdx = m?.target_date ? this.isoQuarterIndex(m.target_date) : null;
          if (tIdx === null || tIdx > q2Index) {
            unschedList.push(c);
          }
        }
      }

      groups.push({
        user_id,
        display_name: entry.display_name,
        prior:       priorList,
        current:     currentList,
        nextQ1:      nextQ1List,
        nextQ2:      nextQ2List,
        unscheduled: unschedList
      });
    }

    return groups.sort((a, b) =>
      (b.prior.length + b.current.length + b.nextQ1.length + b.nextQ2.length + b.unscheduled.length) -
      (a.prior.length + a.current.length + a.nextQ1.length + a.nextQ2.length + a.unscheduled.length) ||
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
    // S-008 Parent Refresh on Return: stack pop re-queries so edits made in the
    // detail/edit panel reflect in the EPO row counts + section placement.
    this.loadCycles();
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
    // S-008: edit pop returns to detail View — re-query the list so the EPO row
    // counts + section placement reflect any milestone-date or stage changes.
    this.loadCycles();
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
