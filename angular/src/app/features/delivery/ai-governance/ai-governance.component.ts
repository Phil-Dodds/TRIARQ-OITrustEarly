// ai-governance.component.ts — AI Production Governance (Contract 38 f15)
// Route: /initiatives/ai-governance
//
// The AI Production Board team's discovery surface. Three sections:
//   1. Approval needed — AI profile requires AI Prod Board approval, not yet
//      received; sorted by the Board gate's target date (undated last, amber).
//      This is the Board's agenda feed.
//   2. Approved — active — approval recorded, Initiative still in flight.
//   3. Approved — closed — approval recorded, Initiative COMPLETE. The
//      historical register the Initiatives grid can't show (it hides COMPLETE).
// CANCELLED Initiatives are excluded everywhere (S-009).
// Read-only: approval itself is recorded on the Initiative edit panel.
// Visible to every authenticated user (Phil 2026-07-17 — governance
// transparency; nothing sensitive shown).

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterModule }         from '@angular/router';
import { IonicModule }          from '@ionic/angular';

import { DeliveryService }      from '../../../core/services/delivery.service';
import { DeliveryCycleDetailComponent } from '../detail/delivery-cycle-detail.component';
import { aiBoardGateFor }       from '../gate-visual.utils';
import { DeliveryCycle, GateName } from '../../../core/types/database';

const GATE_DISPLAY: Record<string, string> = {
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release'
};

interface BoardRow {
  cycle:        DeliveryCycle;
  boardGate:    GateName;
  gateLabel:    string;
  targetDate:   string | null;
  profileLabel: string;
}

@Component({
  selector:        'app-ai-governance',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, IonicModule, DeliveryCycleDetailComponent],
  template: `
    <div style="display:flex;min-height:calc(100vh - 56px);">

    <div class="aig-shell" [style.flex]="selectedCycleId ? '0 0 40%' : '1 1 100%'">

      <div class="aig-header">
        <a routerLink="/initiatives" class="aig-back-link">← Initiative Tracking</a>
        <h3 class="aig-title">AI Production Governance</h3>
        <p class="aig-subtitle">
          Initiatives whose AI profile requires AI Production Board approval —
          pending first, sorted by the Board gate's target date — plus the
          register of approvals already recorded. Approval is recorded on the
          Initiative's edit panel ("Has AI Prod Board Approval").
        </p>
      </div>

      <div *ngIf="loading">
        <div class="aig-row-skeleton" *ngFor="let _ of [1,2,3]">
          <ion-skeleton-text animated style="height:14px;border-radius:4px;width:60%;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;width:30%;"></ion-skeleton-text>
        </div>
      </div>

      <div *ngIf="loadError && !loading" class="aig-error">
        <div class="aig-error-primary">AI Production Governance could not load.</div>
        <div class="aig-error-secondary">{{ loadError }}</div>
      </div>

      <ng-container *ngIf="!loading && !loadError">

        <section class="aig-section">
          <div class="aig-section-header aig-header-pending">
            <span class="aig-marker aig-marker-amber"></span>
            AI Prod Board approval needed ({{ pending.length }})
          </div>
          <ng-container *ngIf="pending.length > 0; else pendingEmpty">
            <div class="aig-grid aig-grid-header">
              <span>Initiative</span><span>Division</span><span>AI Profile</span><span>Board Gate</span><span>Gate Target</span>
            </div>
            <div *ngFor="let r of pending; trackBy: trackByRow"
                 class="aig-grid aig-grid-row" (click)="openCycle(r.cycle.delivery_cycle_id)">
              <span class="aig-name">{{ r.cycle.cycle_title }}</span>
              <span>{{ r.cycle.display_name_short || r.cycle.division_name || '—' }}</span>
              <span>{{ r.profileLabel }}</span>
              <span>{{ r.gateLabel }}</span>
              <span [class.aig-nodate]="!r.targetDate">{{ r.targetDate ? (r.targetDate | date:'mediumDate') : 'No date set' }}</span>
            </div>
          </ng-container>
          <ng-template #pendingEmpty>
            <div class="aig-empty">No Initiatives are waiting on AI Production Board approval.</div>
          </ng-template>
        </section>

        <section class="aig-section">
          <div class="aig-section-header">
            <span class="aig-marker aig-marker-blue"></span>
            Approved — active ({{ approvedActive.length }})
          </div>
          <ng-container *ngIf="approvedActive.length > 0; else activeEmpty">
            <div class="aig-grid aig-grid-header">
              <span>Initiative</span><span>Division</span><span>AI Profile</span><span>Board Gate</span><span>Approval Recorded</span>
            </div>
            <div *ngFor="let r of approvedActive; trackBy: trackByRow"
                 class="aig-grid aig-grid-row" (click)="openCycle(r.cycle.delivery_cycle_id)">
              <span class="aig-name">{{ r.cycle.cycle_title }}</span>
              <span>{{ r.cycle.display_name_short || r.cycle.division_name || '—' }}</span>
              <span>{{ r.profileLabel }}</span>
              <span>{{ r.gateLabel }}</span>
              <span>{{ r.cycle.ai_board_approved_at ? (r.cycle.ai_board_approved_at | date:'mediumDate') : 'Recorded' }}</span>
            </div>
          </ng-container>
          <ng-template #activeEmpty>
            <div class="aig-empty">No active Initiatives with recorded AI Production Board approval.</div>
          </ng-template>
        </section>

        <section class="aig-section">
          <div class="aig-section-header">
            <span class="aig-marker aig-marker-blue"></span>
            Approved — closed ({{ approvedClosed.length }})
          </div>
          <ng-container *ngIf="approvedClosed.length > 0; else closedEmpty">
            <div class="aig-grid aig-grid-header">
              <span>Initiative</span><span>Division</span><span>AI Profile</span><span>Board Gate</span><span>Approval Recorded</span>
            </div>
            <div *ngFor="let r of approvedClosed; trackBy: trackByRow"
                 class="aig-grid aig-grid-row" (click)="openCycle(r.cycle.delivery_cycle_id)">
              <span class="aig-name">{{ r.cycle.cycle_title }}</span>
              <span>{{ r.cycle.display_name_short || r.cycle.division_name || '—' }}</span>
              <span>{{ r.profileLabel }}</span>
              <span>{{ r.gateLabel }}</span>
              <span>{{ r.cycle.ai_board_approved_at ? (r.cycle.ai_board_approved_at | date:'mediumDate') : 'Recorded' }}</span>
            </div>
          </ng-container>
          <ng-template #closedEmpty>
            <div class="aig-empty">No closed Initiatives with recorded AI Production Board approval yet.</div>
          </ng-template>
        </section>

        <p class="aig-footnote">
          Board gate: external user-facing embedded AI needs approval before Go to Deploy (pilot);
          internal AI needs it before Go to Release. Delivered analytics for external customers
          (Track 2) carry the AI Delivery Requirements Record instead of a Board stop and are not
          listed here.
        </p>

      </ng-container>
    </div>

    <!-- Right-panel detail (S-018 split pattern). -->
    <div *ngIf="selectedCycleId" style="flex:1 1 60%;border-left:1px solid var(--triarq-color-border);min-width:0;">
      <app-delivery-cycle-detail
        [cycleId]="selectedCycleId"
        (close)="closePanel()">
      </app-delivery-cycle-detail>
    </div>

    </div>
  `,
  styles: [`
    .aig-shell { padding: var(--triarq-space-lg); min-width: 0; }
    .aig-back-link { font-size: 12px; color: var(--triarq-color-primary, #257099); text-decoration: none; }
    .aig-title { font-family: Roboto, sans-serif; font-size: 22px; font-weight: 600; margin: 6px 0 2px; color: #1E1E1E; }
    .aig-subtitle { margin: 4px 0 16px; font-size: 11px; font-style: italic; color: #5A5A5A; max-width: 720px; line-height: 1.6; }
    .aig-section { margin-bottom: 22px; }
    .aig-section-header { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #1E1E1E; padding: 6px 0; border-bottom: 2px solid var(--triarq-color-border, #E0E0E0); }
    .aig-marker { width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; }
    .aig-marker-amber { border-left: 9px solid #F2A620; }
    .aig-marker-blue  { border-left: 9px solid #257099; }
    .aig-grid { display: grid; grid-template-columns: 2fr 90px 1.3fr 110px 130px; gap: var(--triarq-space-sm); align-items: center; }
    .aig-grid-header { padding: 6px 0; font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--triarq-color-text-secondary); border-bottom: 1px solid var(--triarq-color-border, #E0E0E0); }
    .aig-grid-row { padding: 9px 0; font-size: 13px; border-bottom: 1px solid #F0F0F0; cursor: pointer; }
    .aig-grid-row:hover { background: rgba(37,112,153,0.04); }
    .aig-name { font-weight: 500; color: var(--triarq-color-primary, #257099); }
    .aig-nodate { color: #B87700; font-weight: 500; font-style: italic; }
    .aig-empty { font-size: 12px; font-style: italic; color: #757575; padding: 10px 0; }
    .aig-footnote { font-size: 11px; font-style: italic; color: #757575; max-width: 720px; line-height: 1.6; }
    .aig-error { padding: 16px 0; }
    .aig-error-primary { font-size: 14px; color: #1E1E1E; }
    .aig-error-secondary { font-size: 12px; color: #757575; margin-top: 4px; }
    .aig-row-skeleton { display: flex; gap: 12px; padding: 10px 0; }
  `]
})
export class AiGovernanceComponent implements OnInit {
  loading   = true;
  loadError = '';

  pending:        BoardRow[] = [];
  approvedActive: BoardRow[] = [];
  approvedClosed: BoardRow[] = [];

  selectedCycleId: string | null = null;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.delivery.listCycles({}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.buildSections(res.data);
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

  private buildSections(cycles: DeliveryCycle[]): void {
    const rows: BoardRow[] = [];
    for (const c of cycles) {
      if (c.current_lifecycle_stage === 'CANCELLED') { continue; }   // S-009
      const boardGate = aiBoardGateFor(c);
      if (!boardGate) { continue; }
      const milestone = (c.milestone_dates ?? []).find(m => m.gate_name === boardGate);
      rows.push({
        cycle:        c,
        boardGate,
        gateLabel:    GATE_DISPLAY[boardGate] ?? boardGate,
        targetDate:   milestone?.target_date ?? null,
        profileLabel: (c.ai_delivery_form === 'analytics_outputs' ? 'Analytics' : 'Embedded')
                      + ' · ' + (c.ai_audience === 'external' ? 'External' : 'Internal')
      });
    }

    const byDate = (a: BoardRow, b: BoardRow) => {
      if (!a.targetDate && !b.targetDate) { return a.cycle.cycle_title.localeCompare(b.cycle.cycle_title); }
      if (!a.targetDate) { return 1; }
      if (!b.targetDate) { return -1; }
      return a.targetDate.localeCompare(b.targetDate);
    };

    this.pending = rows
      .filter(r => r.cycle.ai_board_approved !== true)
      .sort(byDate);
    const approved = rows.filter(r => r.cycle.ai_board_approved === true);
    this.approvedActive = approved
      .filter(r => r.cycle.current_lifecycle_stage !== 'COMPLETE')
      .sort(byDate);
    this.approvedClosed = approved
      .filter(r => r.cycle.current_lifecycle_stage === 'COMPLETE')
      .sort(byDate);
  }

  trackByRow(_i: number, r: BoardRow): string { return r.cycle.delivery_cycle_id; }

  openCycle(id: string): void {
    this.selectedCycleId = id;
    this.cdr.markForCheck();
  }

  closePanel(): void {
    this.selectedCycleId = null;
    this.cdr.markForCheck();
  }
}
