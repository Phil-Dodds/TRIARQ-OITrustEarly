// epo-deploy.component.ts — EpoDeployComponent
// Route: /initiatives/epo-deploy (D-399, Contract 20 Session 2)
//
// Deploy gate cadence view organized by EPO. Parallel to Deploy Gate by
// Quarter (/initiatives/deploy-schedule) but pivot dimension is EPO person.
//
// MVP scope vs spec (D-399) — deltas recorded as CC-20-05:
//   - Shipped:    EPO rows with three quarter counts (Prior actual / Current
//                 planned-or-actual / Other active). Click EPO row to drill
//                 to /initiatives/list?epo=user_id pre-filtered.
//                 'Display only my Divisions' toggle (DCS/EPO/DOL default ON).
//                 D-171 persistence for the toggle.
//   - Deferred:   Slide-in filter panel (Division / EPO picker / Tier),
//                 active filter chips, expanded EPO rows with three quarter
//                 sections containing full Initiative grid, 'Show all EPOs'
//                 default ON for zero-Initiative EPOs, role-aware EPO filter
//                 default. Spec sections 7.2 + 7.3 + 7.4 partially honored.
//
// Quarter assignment rule (spec §7.3): Go to Deploy actual date wins; falls
// back to target date when no actual; cycles with neither excluded from
// Prior/Current sections — surface in 'Other Active'.

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
import { DeliveryCycle, Division } from '../../../core/types/database';

interface EpoQuarterRow {
  user_id:       string;
  display_name:  string;
  prior_count:   number;
  current_count: number;
  other_count:   number;
}

@Component({
  selector:        'app-epo-deploy',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule, FormsModule, IonicModule],
  template: `
    <div class="edp-shell">

      <div class="edp-header">
        <a routerLink="/initiatives" class="edp-back-link">← Initiative Tracking</a>
        <div class="edp-header-row">
          <h3 class="edp-title">EPO Deploy by Quarter</h3>
          <button *ngIf="canCreateCycle" class="edp-new-cycle" (click)="onNewCycle()">+ New Initiative</button>
        </div>
        <p class="edp-subtitle">
          Deploy gate cadence per EPO across the prior quarter ({{ priorLabel }}),
          current quarter ({{ currentLabel }}), and other active Initiatives.
          Click an EPO row to see their matching Initiatives.
        </p>
      </div>

      <label *ngIf="!isPrivileged" class="edp-toggle">
        <input type="checkbox" [(ngModel)]="showMyDivisionsOnly" (ngModelChange)="onToggleChange()" />
        Display only my Divisions
      </label>

      <div class="edp-grid edp-grid-header">
        <span>EPO</span>
        <span class="num">Prior</span>
        <span class="num">Current</span>
        <span class="num">Other</span>
      </div>

      <div *ngIf="loading">
        <div class="edp-grid edp-grid-row" *ngFor="let _ of skeletonRows">
          <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
        </div>
      </div>

      <div *ngIf="loadError && !loading" class="edp-error">
        <div class="edp-error-primary">EPO Deploy by Quarter could not load.</div>
        <div class="edp-error-secondary">{{ loadError }}</div>
      </div>

      <div *ngIf="!loading && !loadError && rows.length === 0" class="edp-empty">
        No EPOs with active Initiatives in scope.
      </div>

      <ng-container *ngIf="!loading && !loadError">
        <div *ngFor="let row of rows; trackBy: trackByUserId" class="edp-grid edp-grid-row">
          <a (click)="drillDown(row.user_id)" class="edp-epo-link">{{ row.display_name }}</a>
          <span class="num">{{ row.prior_count }}</span>
          <span class="num">{{ row.current_count }}</span>
          <span class="num">{{ row.other_count }}</span>
        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    .edp-shell { max-width: 1100px; margin: var(--triarq-space-2xl) auto; padding: 0 var(--triarq-space-md); }
    .edp-back-link { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .edp-header { margin-bottom: var(--triarq-space-md); }
    .edp-header-row { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 4px 0; }
    .edp-title { margin: 0; }
    .edp-new-cycle { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 6px; padding: 8px 18px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .edp-new-cycle:hover { background: #1d5a7a; }
    .edp-subtitle { margin: 4px 0 12px 0; font-size: 11px; font-style: italic; color: #5A5A5A; max-width: 720px; line-height: 1.6; }
    .edp-toggle { display: flex; align-items: center; gap: 8px; font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); margin-bottom: var(--triarq-space-md); cursor: pointer; }
    .edp-grid { display: grid; grid-template-columns: 2fr 100px 100px 100px; gap: var(--triarq-space-sm); padding: var(--triarq-space-xs) var(--triarq-space-sm); align-items: center; }
    .edp-grid-header { font-size: var(--triarq-text-small); font-weight: 500; color: var(--triarq-color-text-secondary); border-bottom: 2px solid var(--triarq-color-border); }
    .edp-grid-row { border-bottom: 1px solid var(--triarq-color-border); font-size: var(--triarq-text-small); }
    .num { text-align: center; }
    .edp-epo-link { color: var(--triarq-color-text-primary); font-weight: 500; cursor: pointer; }
    .edp-epo-link:hover { text-decoration: underline; }
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

  rows: EpoQuarterRow[] = [];

  priorLabel   = '';
  currentLabel = '';

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
  ) {
    this.priorLabel   = this.formatQuarter(this.quarterOf(new Date(), -1));
    this.currentLabel = this.formatQuarter(this.quarterOf(new Date(), 0));
  }

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

        const saved = await this.screenState.restore(SCREEN_KEYS.INITIATIVES_EPO_DEPLOY);
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
          this.aggregate(res.data);
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

  private aggregate(cycles: DeliveryCycle[]): void {
    const today    = new Date();
    const priorQ   = this.quarterOf(today, -1);
    const currentQ = this.quarterOf(today, 0);
    const accessible = !this.isPrivileged && this.showMyDivisionsOnly
      ? new Set(this.userDivisionIds)
      : null;

    const map = new Map<string, EpoQuarterRow>();

    for (const c of cycles) {
      if (accessible && (!c.division_id || !accessible.has(c.division_id))) { continue; }
      if (!c.assigned_epo_user_id) { continue; }

      let row = map.get(c.assigned_epo_user_id);
      if (!row) {
        row = {
          user_id:       c.assigned_epo_user_id,
          display_name:  c.assigned_epo_display_name ?? 'EPO',
          prior_count:   0,
          current_count: 0,
          other_count:   0
        };
        map.set(c.assigned_epo_user_id, row);
      }

      // Quarter assignment: actual date wins, then target date.
      const deploy = (c.milestone_dates ?? []).find(m => m.gate_name === 'go_to_deploy');
      const key = deploy?.actual_date ?? deploy?.target_date ?? null;
      if (!key) { row.other_count++; continue; }

      const q = this.quarterOfIso(key);
      if (q.year === priorQ.year && q.quarter === priorQ.quarter)       { row.prior_count++;   }
      else if (q.year === currentQ.year && q.quarter === currentQ.quarter) { row.current_count++; }
      else                                                              { row.other_count++;   }
    }

    this.rows = Array.from(map.values()).sort((a, b) =>
      (b.prior_count + b.current_count + b.other_count) -
      (a.prior_count + a.current_count + a.other_count) ||
      a.display_name.localeCompare(b.display_name)
    );
  }

  private quarterOf(d: Date, offset: number): { year: number; quarter: number } {
    const year    = d.getFullYear();
    const quarter = Math.floor(d.getMonth() / 3) + 1;
    let q = quarter + offset;
    let y = year;
    while (q < 1) { q += 4; y--; }
    while (q > 4) { q -= 4; y++; }
    return { year: y, quarter: q };
  }

  private quarterOfIso(iso: string): { year: number; quarter: number } {
    const d = new Date(iso);
    return { year: d.getFullYear(), quarter: Math.floor(d.getMonth() / 3) + 1 };
  }

  private formatQuarter(q: { year: number; quarter: number }): string {
    return `Q${q.quarter} ${q.year}`;
  }

  onToggleChange(): void {
    this.screenState.save(
      SCREEN_KEYS.INITIATIVES_EPO_DEPLOY,
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

  trackByUserId(_: number, r: EpoQuarterRow): string { return r.user_id; }
}
