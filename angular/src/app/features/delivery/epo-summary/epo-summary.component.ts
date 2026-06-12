// epo-summary.component.ts — EpoSummaryComponent
// Route: /initiatives/epo-summary (D-397, Contract 20 Session 2)
//
// EPO-organized WIP zone view. Parallel to the Workstream Summary view but
// the row dimension is EPO person. Top-level: every EPO with at least one
// active Initiative (or all EPOs when "Include EPOs with no WIP" is on) as
// a row with inline counts + WIP alert flag + expand chevron. Each row
// expands into three zone section groups:
//
//   1. Pre-Build Zone  — Initiatives in DESIGN or SPEC stage
//   2. Build Zone      — Initiatives in BUILD, VALIDATE, or UAT stage
//   3. Post-Deploy Zone — Initiatives in PILOT, RELEASE, or OUTCOME stage
//
// WIP alert: amber count + ⚠ flag when zone count ≥ EPO's limit (default
// 3/3/3 from epo_wip_limits). D-200 Pattern 2 amber styling.
//
// "Include EPOs with no WIP" toggle (D-397 §5.2, renamed per CC-20-07)
// reveals EPOs with zero active Initiatives at all-zero counts against
// their configured limits. Resets on every screen load — NOT persisted.
//
// CC-20-05 expansion shipped: in-place expanded EPO row with three zone
// sections + embedded Initiative grid. Row click opens a right-panel
// detail per D-308 / S-018.

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
  LifecycleStage,
  EpoWipLimitRow
} from '../../../core/types/database';

// WIP_CATEGORY_BY_STAGE mirror — kept in component scope to avoid widening imports.
const ZONE_BY_STAGE: Partial<Record<LifecycleStage, 'pre_build' | 'build' | 'post_deploy'>> = {
  DESIGN:   'pre_build',
  SPEC:     'pre_build',
  BUILD:    'build',
  VALIDATE: 'build',
  UAT:      'build',
  PILOT:    'post_deploy',
  RELEASE:  'post_deploy',
  OUTCOME:  'post_deploy'
};

const WIP_LIMIT_DEFAULT = 3;

interface EpoRowView {
  user_id:                  string;
  display_name:             string;
  total_active_cycles:      number;
  pre_build:                DeliveryCycle[];
  build:                    DeliveryCycle[];
  post_deploy:              DeliveryCycle[];
  pre_build_limit:          number;
  build_limit:              number;
  post_deploy_limit:        number;
  pre_build_exceeded:       boolean;
  build_exceeded:           boolean;
  post_deploy_exceeded:     boolean;
}

@Component({
  selector:        'app-epo-summary',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, FormsModule, IonicModule,
    DeliveryCycleDetailComponent
  ],
  template: `
    <div style="display:flex;min-height:calc(100vh - 56px);">

    <div class="es-shell" [style.flex]="selectedCycleId ? '0 0 40%' : '1 1 100%'">

      <div class="es-header">
        <a routerLink="/initiatives" class="es-back-link">← Initiative Tracking</a>
        <div class="es-header-row">
          <h3 class="es-title">EPO Summary</h3>
          <button *ngIf="canCreateCycle" class="es-new-cycle" (click)="onNewCycle()">+ New Initiative</button>
        </div>
        <p class="es-subtitle">
          Active Initiatives organized by EPO across Pre-Build, Build, and
          Post-Deploy zones. The ⚠ flag and amber count mark zones where the
          EPO has reached or exceeded their configured WIP limit. Click an
          EPO row to expand; click an EPO name to filter the full dashboard.
        </p>
      </div>

      <div class="es-toggle-row">
        <label *ngIf="!isPrivileged" class="es-toggle">
          <input type="checkbox"
                 [(ngModel)]="showMyDivisionsOnly"
                 (ngModelChange)="onToggleChange()" />
          Display only my Divisions
        </label>

        <label class="es-toggle es-toggle-secondary">
          <input type="checkbox"
                 [(ngModel)]="includeEposWithNoWip"
                 (ngModelChange)="onIncludeEposToggle()" />
          Include EPOs with no WIP
        </label>
      </div>

      <div *ngIf="loading">
        <div class="es-row-skeleton" *ngFor="let _ of skeletonRows">
          <ion-skeleton-text animated style="height:14px;border-radius:4px;width:60%;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;width:30%;"></ion-skeleton-text>
        </div>
      </div>

      <div *ngIf="loadError && !loading" class="es-error">
        <div class="es-error-primary">EPO Summary could not load.</div>
        <div class="es-error-secondary">{{ loadError }}</div>
      </div>

      <div *ngIf="!loading && !loadError && rows.length === 0" class="es-empty">
        No EPOs with active Initiatives in scope.
        <span *ngIf="!isPrivileged && showMyDivisionsOnly">
          Try unchecking 'Display only my Divisions' to see all accessible Initiatives.
        </span>
      </div>

      <ng-container *ngIf="!loading && !loadError">

        <div *ngFor="let row of rows; trackBy: trackByUserId">

          <button class="es-row" type="button" (click)="toggle(row.user_id)">
            <span class="es-chevron"
                  [style.transform]="isExpanded(row.user_id) ? 'rotate(0)' : 'rotate(-90deg)'">▼</span>
            <span class="es-epo-name"
                  (click)="$event.stopPropagation(); drillDown(row.user_id)">
              {{ row.display_name }}
            </span>
            <span class="es-counts">
              <span [class.es-over]="row.pre_build_exceeded">
                Pre-Build: {{ row.pre_build.length }}/{{ row.pre_build_limit }}
              </span>
              ·
              <span [class.es-over]="row.build_exceeded">
                Build: {{ row.build.length }}/{{ row.build_limit }}
              </span>
              ·
              <span [class.es-over]="row.post_deploy_exceeded">
                Post-Deploy: {{ row.post_deploy.length }}/{{ row.post_deploy_limit }}
              </span>
              <span *ngIf="anyZoneExceeded(row)" class="es-flag-icon" title="One or more zones at or over the WIP limit">⚠</span>
            </span>
          </button>

          <!-- Expanded body — three zone sections -->
          <div *ngIf="isExpanded(row.user_id)" class="es-body">

            <section class="es-section">
              <div class="es-section-header"
                   [class.es-section-amber]="row.pre_build_exceeded">
                Pre-Build Zone — {{ row.pre_build.length }} of {{ row.pre_build_limit }}
              </div>
              <ng-container *ngTemplateOutlet="zoneRows; context: { cycles: row.pre_build, emptyMsg: 'No Initiatives in Pre-Build zone.' }"></ng-container>
            </section>

            <section class="es-section">
              <div class="es-section-header"
                   [class.es-section-amber]="row.build_exceeded">
                Build Zone — {{ row.build.length }} of {{ row.build_limit }}
              </div>
              <ng-container *ngTemplateOutlet="zoneRows; context: { cycles: row.build, emptyMsg: 'No Initiatives in Build zone.' }"></ng-container>
            </section>

            <section class="es-section">
              <div class="es-section-header"
                   [class.es-section-amber]="row.post_deploy_exceeded">
                Post-Deploy Zone — {{ row.post_deploy.length }} of {{ row.post_deploy_limit }}
              </div>
              <ng-container *ngTemplateOutlet="zoneRows; context: { cycles: row.post_deploy, emptyMsg: 'No Initiatives in Post-Deploy zone.' }"></ng-container>
            </section>

          </div>
        </div>

      </ng-container>

      <!-- Shared zone grid template — used by all three sections -->
      <ng-template #zoneRows let-cycles="cycles" let-emptyMsg="emptyMsg">
        <div class="es-grid es-grid-header">
          <span>Initiative</span>
          <span>Stage</span>
          <span>Tier</span>
        </div>
        <ng-container *ngIf="cycles.length > 0; else zoneEmpty">
          <div *ngFor="let c of cycles; trackBy: trackByCycleId"
               class="es-grid es-grid-row"
               (click)="openCycle(c.delivery_cycle_id)">
            <span class="es-cycle-title">{{ c.cycle_title }}</span>
            <span class="es-meta">{{ c.current_lifecycle_stage }}</span>
            <span class="es-meta">{{ tierLabel(c.tier_classification) }}</span>
          </div>
        </ng-container>
        <ng-template #zoneEmpty>
          <div class="es-row-empty">{{ emptyMsg }}</div>
        </ng-template>
      </ng-template>

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
    .es-shell { max-width: 1100px; margin: var(--triarq-space-2xl) auto; padding: 0 var(--triarq-space-md); }
    .es-back-link { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .es-header { margin-bottom: var(--triarq-space-md); }
    .es-header-row { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 4px 0; }
    .es-title { margin: 0; }
    .es-new-cycle { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 6px; padding: 8px 18px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .es-new-cycle:hover { background: #1d5a7a; }
    .es-subtitle { margin: 4px 0 12px 0; font-size: 11px; font-style: italic; color: #5A5A5A; max-width: 720px; line-height: 1.6; }
    .es-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: var(--triarq-space-md); margin-bottom: var(--triarq-space-md); }
    .es-toggle { display: flex; align-items: center; gap: 8px; font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); cursor: pointer; }
    .es-toggle-secondary { color: var(--triarq-color-stone, #5A5A5A); font-size: 11px; margin-left: auto; }
    .es-row { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--triarq-color-background-subtle); border: none; border-radius: 6px; margin: 8px 0 4px 0; cursor: pointer; font-size: 13px; }
    .es-row:hover { background: rgba(37,112,153,0.06); }
    .es-chevron { font-size: 11px; color: var(--triarq-color-text-secondary); transition: transform 0.15s; flex-shrink: 0; }
    .es-epo-name { font-weight: 600; color: var(--triarq-color-primary); cursor: pointer; flex: 1; text-align: left; }
    .es-epo-name:hover { text-decoration: underline; }
    .es-counts { font-size: 12px; color: var(--triarq-color-text-secondary); display: flex; align-items: center; gap: 4px; }
    .es-over { color: #E96127; font-weight: 600; }
    .es-flag-icon { color: var(--triarq-color-sunray, #f5a623); font-size: 14px; margin-left: 4px; }
    .es-body { padding: 0 12px var(--triarq-space-md) 12px; }
    .es-section { margin-top: var(--triarq-space-md); }
    .es-section-header { font-size: 12px; font-weight: 600; padding: 6px 10px; border-radius: 4px; background: rgba(37,112,153,0.06); color: var(--triarq-color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .es-section-amber { background: rgba(245,166,35,0.12); color: #b07000; }
    .es-grid { display: grid; grid-template-columns: 3fr 1.2fr 1fr; gap: var(--triarq-space-sm); padding: 8px 12px; align-items: center; font-size: var(--triarq-text-small); }
    .es-grid-header { font-weight: 500; color: var(--triarq-color-text-secondary); border-bottom: 2px solid var(--triarq-color-border); }
    .es-grid-row { border-bottom: 1px solid var(--triarq-color-border); cursor: pointer; }
    .es-grid-row:hover { background: var(--triarq-color-background-subtle); }
    .es-cycle-title { font-weight: 500; color: var(--triarq-color-text-primary); }
    .es-meta { color: var(--triarq-color-text-secondary); }
    .es-row-empty { padding: 10px 12px; color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); font-style: italic; text-align: center; border-bottom: 1px solid var(--triarq-color-border); }
    .es-row-skeleton { display: flex; gap: 16px; padding: 10px 12px; border-bottom: 1px solid var(--triarq-color-border); }
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
  canCreateCycle       = false;

  /** Toggle: include EPOs with zero active Initiatives in the row set.
   *  Spec §5.2 named this 'Show all EPOs'; UAT-driven rename to 'Include
   *  EPOs with no WIP' per CC-20-07. Resets on every screen load. */
  includeEposWithNoWip = false;

  private cycles: DeliveryCycle[] = [];
  private epoLimits: EpoWipLimitRow[] = [];
  rows: EpoRowView[] = [];

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

        const saved = await this.screenState.restore(SCREEN_KEYS.INITIATIVES_EPO_SUMMARY);
        if (saved?.filter_state && typeof saved.filter_state['showMyDivisionsOnly'] === 'boolean') {
          this.showMyDivisionsOnly = saved.filter_state['showMyDivisionsOnly'] as boolean;
        }

        if (!this.isPrivileged) {
          await this.loadUserDivisions(userId);
        }
        this.loadAll();
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

  /** Load cycles + EPO WIP limits in parallel; build rows locally. */
  private async loadAll(): Promise<void> {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();

    const cycleParams: { division_id?: string; include_child_divisions?: boolean } = {};
    if (!this.isPrivileged && this.showMyDivisionsOnly && this.userDivisionIds.length === 1) {
      cycleParams.division_id = this.userDivisionIds[0];
      cycleParams.include_child_divisions = true;
    }

    try {
      const [cyclesRes, limitsRes] = await Promise.all([
        firstValueFrom(this.delivery.listCycles(cycleParams)),
        firstValueFrom(this.delivery.getEpoWipLimits())
      ]);
      if (cyclesRes.success && cyclesRes.data) {
        this.cycles = cyclesRes.data;
      } else {
        this.loadError = cyclesRes.error ?? 'Could not load Initiatives.';
      }
      if (limitsRes.success && limitsRes.data) {
        this.epoLimits = limitsRes.data;
      }
      this.rebuildRows();
    } catch (err: unknown) {
      const e = err as { error?: string };
      this.loadError = e?.error ?? 'Unable to reach the server.';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  onToggleChange(): void {
    this.saveScreenState();
    this.loadAll();
  }

  onIncludeEposToggle(): void {
    this.rebuildRows();
    this.cdr.markForCheck();
  }

  /** Aggregate cycles by EPO + zone, join with limits, optionally include
   *  zero-Initiative EPOs from the limits roster. */
  private rebuildRows(): void {
    const limitsById = new Map<string, EpoWipLimitRow>();
    for (const l of this.epoLimits) {
      limitsById.set(l.user_id, l);
    }

    const byEpo = new Map<string, EpoRowView>();

    const ensureRow = (epoId: string, displayName: string): EpoRowView => {
      let row = byEpo.get(epoId);
      if (!row) {
        const lim = limitsById.get(epoId);
        row = {
          user_id:              epoId,
          display_name:         displayName,
          total_active_cycles:  0,
          pre_build:            [],
          build:                [],
          post_deploy:          [],
          pre_build_limit:      lim?.pre_build_limit   ?? WIP_LIMIT_DEFAULT,
          build_limit:          lim?.build_limit       ?? WIP_LIMIT_DEFAULT,
          post_deploy_limit:    lim?.post_deploy_limit ?? WIP_LIMIT_DEFAULT,
          pre_build_exceeded:   false,
          build_exceeded:       false,
          post_deploy_exceeded: false
        };
        byEpo.set(epoId, row);
      }
      return row;
    };

    for (const c of this.cycles) {
      if (!c.assigned_epo_user_id) continue;
      const zone = ZONE_BY_STAGE[c.current_lifecycle_stage as LifecycleStage];
      if (!zone) continue;
      const row = ensureRow(c.assigned_epo_user_id, c.assigned_epo_display_name ?? 'EPO');
      row[zone].push(c);
      row.total_active_cycles++;
    }

    // Include zero-WIP EPOs when toggle is on.
    if (this.includeEposWithNoWip) {
      for (const l of this.epoLimits) {
        if (!byEpo.has(l.user_id)) {
          ensureRow(l.user_id, l.display_name);
        }
      }
    }

    // Compute exceeded flags after all cycles assigned.
    for (const row of byEpo.values()) {
      row.pre_build_exceeded   = row.pre_build.length   >= row.pre_build_limit;
      row.build_exceeded       = row.build.length       >= row.build_limit;
      row.post_deploy_exceeded = row.post_deploy.length >= row.post_deploy_limit;
    }

    this.rows = Array.from(byEpo.values()).sort((a, b) =>
      b.total_active_cycles - a.total_active_cycles ||
      a.display_name.localeCompare(b.display_name)
    );
  }

  anyZoneExceeded(r: EpoRowView): boolean {
    return r.pre_build_exceeded || r.build_exceeded || r.post_deploy_exceeded;
  }

  tierLabel(tier?: string | null): string {
    if (!tier) return '—';
    return tier.replace('tier_', 'Tier ');
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
    // S-008 Parent Refresh on Return — re-query so EPO row totals reflect edits.
    this.loadAll();
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
    this.loadAll();
    this.cdr.markForCheck();
  }

  drillDown(epoUserId: string): void {
    this.router.navigate(['/initiatives/list'], { queryParams: { epo: epoUserId } });
  }

  onNewCycle(): void {
    this.router.navigate(['/initiatives/list'], { queryParams: { new: 'true' } });
  }

  trackByUserId(_: number, r: EpoRowView): string { return r.user_id; }
  trackByCycleId(_: number, c: DeliveryCycle): string { return c.delivery_cycle_id; }
}
