// initiative-status-history-panel.component.ts — Contract 32 (WS2)
// Right panel: reverse-chronological status update history for an Initiative
// (D-478 §4.3). Read-only, no actions. D-178/D-346 Context B skeleton on load.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { IonicModule }     from '@ionic/angular';
import { DeliveryService } from '../../../core/services/delivery.service';
import { InitiativeStatusUpdate } from '../../../core/types/initiative-status';

@Component({
  selector: 'app-initiative-status-history-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="oi-side-panel oi-side-detail" role="dialog" aria-label="Status History">
      <div class="oi-side-head">
        <div style="display:flex;flex-direction:column;gap:2px;">
          <strong>Status History</strong>
          <span style="font-size:12px;color:var(--triarq-color-text-secondary);">{{ initiativeName }}</span>
        </div>
        <button class="oi-close-btn" (click)="close.emit()" aria-label="Close">✕</button>
      </div>

      <div class="oi-side-body">
        <!-- D-346 Context B skeleton -->
        <div *ngIf="loading" style="display:flex;flex-direction:column;gap:10px;">
          <ion-skeleton-text animated style="width:50%;height:14px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="width:90%;height:60px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="width:90%;height:60px;"></ion-skeleton-text>
        </div>

        <ng-container *ngIf="!loading">
          <!-- Accomplishment/Status view toggle (Phil 2026-07-28, CC-40-M). -->
          <div class="ish-toggle">
            <button type="button" [class.ish-toggle--active]="histView === 'status'"
                    (click)="histView = 'status'">Status View</button>
            <button type="button" [class.ish-toggle--active]="histView === 'accomplishment'"
                    (click)="histView = 'accomplishment'">Accomplishment View</button>
          </div>

          <div *ngIf="updates.length === 0" class="oi-zone-explain">No status updates recorded.</div>

          <!-- Accomplishment View: date + bold accomplishment, reverse-chron.
               Consecutive identical texts collapse to their original (earliest)
               report — later repeats are usually edits elsewhere in the update. -->
          <ng-container *ngIf="histView === 'accomplishment'">
            <div *ngIf="updates.length > 0 && accomplishmentRows.length === 0" class="oi-zone-explain">
              No accomplishments recorded.
            </div>
            <div *ngFor="let r of accomplishmentRows" class="ish-acc">
              <span class="ish-acc-date">{{ formatDateOnly(r.date) }}</span>
              <span class="ish-acc-text"><strong>{{ r.text }}</strong></span>
            </div>
          </ng-container>

          <ng-container *ngIf="histView === 'status'">
          <div *ngFor="let u of updates" class="ish-entry">
            <div class="ish-head">{{ u.saved_by_name || 'Unknown' }} · {{ formatDateTime(u.saved_at) }}</div>
            <div class="ish-row"><span class="oi-field-label">Accomplished Last Cycle</span><span>{{ u.accomplished_last_cycle || '—' }}</span></div>
            <div class="ish-row"><span class="oi-field-label">Plan for Next Cycle</span><span>{{ u.plan_next_cycle || '—' }}</span></div>
            <div class="ish-row"><span class="oi-field-label">Blockers</span><span>{{ u.blockers || '—' }}</span></div>
            <div class="ish-row"><span class="oi-field-label">Escalation</span><span>{{ u.escalation_needed ? 'Yes' : 'No' }}</span></div>
            <div class="ish-row" *ngIf="u.pilot_confidence_applicable">
              <span class="oi-field-label">Go to Deploy Confidence</span><span>{{ confidenceLabel(u.pilot_confidence) }}</span>
            </div>
            <div class="ish-row" *ngIf="u.close_confidence_applicable">
              <span class="oi-field-label">Close Review Confidence</span><span>{{ confidenceLabel(u.close_confidence) }}</span>
            </div>
            <div class="ish-row">
              <span class="oi-field-label">Acknowledged by</span>
              <span>
                <ng-container *ngIf="u.acknowledged_by?.length; else noAcks">
                  <span *ngFor="let a of u.acknowledged_by; let last = last">
                    {{ a.display_name }} · {{ formatDateTime(a.acknowledged_at) }}{{ last ? '' : ', ' }}
                  </span>
                </ng-container>
                <ng-template #noAcks>None</ng-template>
              </span>
            </div>
          </div>
          </ng-container>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .ish-entry { padding:10px 0; border-bottom:1px solid var(--triarq-color-border, #e0e0e0); }
    .ish-head { font-size:12px; color:var(--triarq-color-text-secondary); margin-bottom:6px; font-weight:500; }
    .ish-row { display:flex; flex-direction:column; gap:2px; margin-bottom:6px; }
    /* View toggle (CC-40-M). */
    .ish-toggle { display:flex; gap:4px; margin-bottom:12px; }
    .ish-toggle button {
      flex:1; border:1px solid var(--triarq-color-border, #B9C4CE); background:#fff;
      border-radius:5px; padding:5px 8px; font:500 12px Roboto,sans-serif; color:#5A5A5A; cursor:pointer;
    }
    .ish-toggle--active {
      background:rgba(37,112,153,0.10); border-color:var(--triarq-color-primary,#257099) !important;
      color:var(--triarq-color-primary,#257099) !important; font-weight:600;
    }
    /* Accomplishment View rows. */
    .ish-acc { padding:8px 0; border-bottom:1px solid var(--triarq-color-border, #eee); }
    .ish-acc-date { display:block; font:500 11px Roboto,sans-serif; color:var(--triarq-color-text-secondary,#5A5A5A); margin-bottom:2px; }
    .ish-acc-text { font:400 13px/1.4 Roboto,sans-serif; color:#1E1E1E; }
  `]
})
export class InitiativeStatusHistoryPanelComponent implements OnInit {
  @Input() initiativeId!: string;
  @Input() initiativeName = '';
  @Output() close = new EventEmitter<void>();

  loading = false;
  updates: InitiativeStatusUpdate[] = [];
  // CC-40-M: condensed Accomplishment View vs the full Status View (default).
  histView: 'status' | 'accomplishment' = 'status';

  /** Reverse-chron accomplishment rows: date + text, consecutive identical
   *  texts collapsed to their ORIGINAL (earliest) report. `updates` is
   *  newest-first, so the earliest of a run is its last member. */
  get accomplishmentRows(): { date: string; text: string }[] {
    const list = this.updates.filter(u => (u.accomplished_last_cycle || '').trim());
    const rows: { date: string; text: string }[] = [];
    let i = 0;
    while (i < list.length) {
      const text = (list[i].accomplished_last_cycle || '').trim();
      let j = i;
      while (j + 1 < list.length && (list[j + 1].accomplished_last_cycle || '').trim() === text) { j++; }
      rows.push({ date: list[j].saved_at, text });   // list[j] = oldest of the run = original
      i = j + 1;
    }
    return rows;
  }

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.delivery.getInitiativeStatusHistory(this.initiativeId).subscribe({
      next: (res) => {
        this.updates = (res.success && Array.isArray(res.data)) ? res.data : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  confidenceLabel(v: string | null): string {
    const map: Record<string, string> = {
      not_started: 'Not Started', on_track: 'On Track', at_risk: 'At Risk',
      behind: 'Behind', complete: 'Complete'
    };
    return v ? (map[v] || v) : 'N/A';
  }

  /** Date-only label for the condensed Accomplishment View. */
  formatDateOnly(iso: string | null): string {
    if (!iso) { return '—'; }
    const d = new Date(iso);
    if (isNaN(d.getTime())) { return iso; }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatDateTime(iso: string | null): string {
    if (!iso) { return '—'; }
    const d = new Date(iso);
    if (isNaN(d.getTime())) { return iso; }
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  }
}
