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
          <div *ngIf="updates.length === 0" class="oi-zone-explain">No status updates recorded.</div>

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
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .ish-entry { padding:10px 0; border-bottom:1px solid var(--triarq-color-border, #e0e0e0); }
    .ish-head { font-size:12px; color:var(--triarq-color-text-secondary); margin-bottom:6px; font-weight:500; }
    .ish-row { display:flex; flex-direction:column; gap:2px; margin-bottom:6px; }
  `]
})
export class InitiativeStatusHistoryPanelComponent implements OnInit {
  @Input() initiativeId!: string;
  @Input() initiativeName = '';
  @Output() close = new EventEmitter<void>();

  loading = false;
  updates: InitiativeStatusUpdate[] = [];

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

  formatDateTime(iso: string | null): string {
    if (!iso) { return '—'; }
    const d = new Date(iso);
    if (isNaN(d.getTime())) { return iso; }
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  }
}
