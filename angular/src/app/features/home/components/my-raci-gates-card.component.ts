// my-raci-gates-card.component.ts
// Pathways OI Trust — home screen "My RACI Gates" card (Contract 41, Phil
// 2026-07-31).
//
// For anyone holding Responsible, Consulted, or Informed on an Initiative:
// that Initiative's gates awaiting approval, and the ones approved recently.
// Merged single list with per-row R/C/I glyphs — Phil's choice 2026-07-31 over
// three letter-grouped sections.
//
// This is a PULL surface. Being the approver (A) is deliberately absent: that is
// a push obligation and already lives in My Actions, and duplicating it here
// would make the card look like a second work queue. The glyphs run readonly for
// the same reason — the hollow follow affordance belongs on a grid you can act
// in, not a summary.
//
// Async per D-346. Rows route to /initiatives/:id with the gate pre-expanded,
// reusing the D-345 §8 ?gate= mechanism, and carry returnTo so Back lands home.
//
// Overlaps My Completed Gates (D-430) on one axis: that card is trio-only
// (R) and 28 days; this one adds C and I and pairs completions with what is
// still waiting. Flagged in CodeClose rather than merged — merging is a Design
// call, not a Code one.

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule }  from '@ionic/angular';

import { DeliveryService, MyRaciGateRow, MyRaciEntry } from '../../../core/services/delivery.service';
import { RaciGlyphsComponent } from '../../../shared/components/raci-glyphs/raci-glyphs.component';

/** Rows shown before the footer link takes over. */
const CARD_LIMIT = 5;

/** Days waiting past which a pending row is called out (matches ARCH-33 / APG). */
const AGING_DAYS = 7;

@Component({
  selector:        'app-my-raci-gates-card',
  standalone:      true,
  imports:         [CommonModule, RouterModule, IonicModule, RaciGlyphsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card oi-home-card">
      <div class="oi-card-header">
        <h4>My RACI Gates</h4>
      </div>

      <!-- S-015 zone explanation — what this is and why these rows. -->
      <p class="mrg-desc">
        Gates on the Initiatives where you are Responsible, Consulted, or
        Informed. Approvals you owe are in My Actions.
      </p>

      <!-- D-346 async card: skeleton, never a spinner. -->
      <ng-container *ngIf="loading">
        <div class="mrg-skeleton" *ngFor="let _ of skeletonRows">
          <ion-skeleton-text animated style="height:12px;width:75%;"></ion-skeleton-text>
        </div>
      </ng-container>

      <div *ngIf="!loading && errorText" class="mrg-error">
        <div class="mrg-error-primary">Your RACI gates could not load.</div>
        <div class="mrg-error-secondary">{{ errorText }}</div>
      </div>

      <!-- S-001: empty state says what would put something here. -->
      <p *ngIf="!loading && !errorText && isEmpty" class="oi-card-empty">
        No gates waiting or recently decided on your Initiatives. Rows appear
        here once you are on an Initiative's trio, or someone Consults or
        Informs you.
      </p>

      <!-- ── Awaiting approval ────────────────────────────────────────────── -->
      <ng-container *ngIf="!loading && !errorText && pending.length > 0">
        <div class="mrg-section-header">Awaiting approval</div>
        <ul class="mrg-list">
          <li *ngFor="let r of visiblePending" class="mrg-item" [class.mrg-item--aging]="isAging(r)">
            <app-raci-glyphs
              class="mrg-glyphs"
              [raci]="glyphsFor(r)"
              [deliveryCycleId]="r.delivery_cycle_id"
              [readonly]="true">
            </app-raci-glyphs>

            <a class="mrg-chip"
               [routerLink]="['/initiatives', r.delivery_cycle_id]"
               [queryParams]="gateParams(r)"
               [title]="r.cycle_title">{{ r.cycle_title }}</a>

            <span class="mrg-gate">{{ r.gate_name_display }}</span>
            <span class="mrg-days" [title]="'Submitted ' + absoluteTime(r.submitted_at)">
              {{ waitingLabel(r) }}
            </span>
          </li>
        </ul>
        <a *ngIf="pending.length > CARD_LIMIT" class="mrg-more" routerLink="/initiatives/all-pending-gates">
          {{ pending.length - CARD_LIMIT }} more awaiting →
        </a>
      </ng-container>

      <!-- ── Recently completed ───────────────────────────────────────────── -->
      <ng-container *ngIf="!loading && !errorText && completed.length > 0">
        <div class="mrg-section-header">Completed in the last {{ recentWindowDays }} days</div>
        <ul class="mrg-list">
          <li *ngFor="let r of visibleCompleted" class="mrg-item">
            <app-raci-glyphs
              class="mrg-glyphs"
              [raci]="glyphsFor(r)"
              [deliveryCycleId]="r.delivery_cycle_id"
              [readonly]="true">
            </app-raci-glyphs>

            <a class="mrg-chip"
               [routerLink]="['/initiatives', r.delivery_cycle_id]"
               [queryParams]="gateParams(r)"
               [title]="r.cycle_title">{{ r.cycle_title }}</a>

            <span class="mrg-gate">{{ r.gate_name_display }}</span>
            <span class="mrg-days mrg-days--done"
                  [title]="'Approved ' + absoluteTime(r.approver_decision_at)">
              {{ approvedLabel(r) }}
            </span>
          </li>
        </ul>
        <a *ngIf="completed.length > CARD_LIMIT" class="mrg-more" routerLink="/initiatives/gates-approved">
          {{ completed.length - CARD_LIMIT }} more completed →
        </a>
      </ng-container>
    </div>
  `,
  styles: [`
    .oi-card-header { display: flex; align-items: center; gap: var(--triarq-space-sm); margin-bottom: 4px; }
    h4 { margin: 0; font-size: var(--triarq-text-h4); }
    /* S-015 zone explanation — 11px italic Stone. */
    .mrg-desc { margin: 0 0 var(--triarq-space-md) 0; font-size: 11px; font-style: italic; color: #5A5A5A; line-height: 1.5; }
    .oi-card-empty { color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); }

    .mrg-section-header { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
                          color: var(--triarq-color-text-secondary); padding: 6px 0 4px 0; margin-top: 6px; }
    .mrg-list { list-style: none; padding: 0; margin: 0; }
    .mrg-item { display: flex; align-items: center; gap: var(--triarq-space-sm);
                padding: 6px 0; border-bottom: 1px solid var(--triarq-color-border);
                font-size: var(--triarq-text-small); }
    .mrg-item:last-of-type { border-bottom: 0; }
    /* D-200 Pattern 2 geometry for an aging row — attention, not a block. */
    .mrg-item--aging { border-left: 3px solid var(--triarq-color-sunray, #F2A620); padding-left: 6px; }

    .mrg-glyphs { flex: 0 0 auto; }
    .mrg-chip { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px;
                background: rgba(120,130,140,0.10); color: var(--triarq-color-primary);
                text-decoration: none; font-size: 11px; white-space: nowrap;
                max-width: 150px; overflow: hidden; text-overflow: ellipsis; }
    .mrg-chip:hover { background: rgba(120,130,140,0.20); cursor: pointer; }
    .mrg-gate { color: var(--triarq-color-text-primary); font-size: 11px; white-space: nowrap; }
    .mrg-days { margin-left: auto; color: #5A5A5A; font-size: 11px; white-space: nowrap; }
    .mrg-item--aging .mrg-days { color: #B87700; font-weight: 600; }
    .mrg-days--done { color: #2E7D32; }

    .mrg-skeleton { padding: 6px 0; }
    .mrg-more { display: inline-block; margin-top: var(--triarq-space-sm); font-size: var(--triarq-text-small);
                color: var(--triarq-color-primary); text-decoration: none; font-weight: 500; }
    .mrg-more:hover { text-decoration: underline; }
    .mrg-error { font-size: var(--triarq-text-small); }
    .mrg-error-primary { color: var(--triarq-color-error); font-weight: 500; margin-bottom: 2px; }
    .mrg-error-secondary { color: var(--triarq-color-text-secondary); font-size: 11px; }
  `]
})
export class MyRaciGatesCardComponent implements OnInit {
  pending:   MyRaciGateRow[] = [];
  completed: MyRaciGateRow[] = [];
  recentWindowDays = 14;
  loading   = true;
  errorText = '';

  readonly skeletonRows = [1, 2, 3];
  readonly CARD_LIMIT = CARD_LIMIT;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.delivery.getMyRaciGateSummary().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.pending          = res.data.pending_gates   ?? [];
          this.completed        = res.data.completed_gates  ?? [];
          this.recentWindowDays = res.data.recent_window_days ?? this.recentWindowDays;
        } else {
          this.errorText = res.error ?? 'Unable to reach the server.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.errorText = err?.error ?? 'Unable to reach the server.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  get isEmpty(): boolean {
    return this.pending.length === 0 && this.completed.length === 0;
  }

  get visiblePending(): MyRaciGateRow[] { return this.pending.slice(0, CARD_LIMIT); }
  get visibleCompleted(): MyRaciGateRow[] { return this.completed.slice(0, CARD_LIMIT); }

  /**
   * Adapt the row's letters to the shared glyph component's input. A is always
   * false here by design, and c_provisional is not carried by this summary — the
   * provisional distinction needs the Go to Build cast state, which the card
   * does not fetch. Flagged in CodeClose.
   */
  glyphsFor(r: MyRaciGateRow): MyRaciEntry {
    return {
      r: r.my_letters.r,
      a: false,
      c: r.my_letters.c,
      i: r.my_letters.i,
      c_provisional: false,
      a_gate_name: null
    } as MyRaciEntry;
  }

  /** Pre-expand the relevant gate and come back here on Back (D-345 §8). */
  gateParams(r: MyRaciGateRow): Record<string, string> {
    return { gate: r.gate_name, returnTo: '/home' };
  }

  isAging(r: MyRaciGateRow): boolean {
    return (r.days_waiting ?? 0) > AGING_DAYS;
  }

  waitingLabel(r: MyRaciGateRow): string {
    const d = r.days_waiting ?? 0;
    if (d <= 0) { return 'today'; }
    return d === 1 ? '1 day' : `${d} days`;
  }

  approvedLabel(r: MyRaciGateRow): string {
    const d = r.days_since_approval ?? 0;
    if (d <= 0) { return 'today'; }
    return d === 1 ? 'yesterday' : `${d} days ago`;
  }

  absoluteTime(iso: string | null): string {
    if (!iso) { return 'date unknown'; }
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toUTCString() : iso;
  }
}
