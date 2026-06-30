// initiative-status-update-panel.component.ts — Contract 32 (WS2)
// Right panel for Initiative Status (D-478). Two modes:
//   edit  — trio member authors an update (Save/Cancel in header, D-348 Tier 1).
//   read  — read-only view + acknowledgment + Needs Review + View Initiative link.
//
// S-017: edit is modal (scrim); read is non-modal (no scrim). D-178 skeleton on
// read load. D-346 Context A on Save/Acknowledge. D-200 Pattern 3 inline errors.
// D-477: confidence fields use the shared MilestoneStatusSelectorComponent.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';
import { CommonModule }       from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { IonicModule }        from '@ionic/angular';
import { DeliveryService }    from '../../../core/services/delivery.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { LifecycleStage }     from '../../../core/types/database';
import { MilestoneStatusSelectorComponent } from '../../../shared/components/milestone-status-selector/milestone-status-selector.component';
import {
  LatestInitiativeStatus,
  StatusConfidence
} from '../../../core/types/initiative-status';

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-initiative-status-update-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, MilestoneStatusSelectorComponent],
  template: `
    <!-- S-017: edit is modal (scrim covers list); read is non-modal. -->
    <div *ngIf="mode === 'edit'" class="oi-scrim oi-scrim-detail" (click)="onCancel()"></div>

    <div class="oi-side-panel oi-side-detail" role="dialog" aria-modal="true"
         [attr.aria-label]="mode === 'edit' ? 'Initiative Status Update' : 'Initiative Status'">

      <!-- ── Header (D-348 Tier 1: Save/Cancel here in edit mode) ── -->
      <div class="oi-side-head">
        <div style="display:flex;flex-direction:column;gap:2px;">
          <strong>{{ mode === 'edit' ? 'Initiative Status Update' : 'Initiative Status' }}</strong>
          <span style="font-size:12px;color:var(--triarq-color-text-secondary);">{{ initiativeName }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <ng-container *ngIf="mode === 'edit'">
            <button class="oi-btn-secondary" (click)="onCancel()" [disabled]="saving">Cancel</button>
            <button class="oi-btn-primary" (click)="save()" [disabled]="saving">
              {{ saving ? 'Saving…' : 'Save Status Update' }}
            </button>
          </ng-container>
          <button class="oi-close-btn" (click)="onCancel()" aria-label="Close">✕</button>
        </div>
      </div>

      <div class="oi-side-body">

        <!-- ============ EDIT MODE ============ -->
        <form *ngIf="mode === 'edit'" [formGroup]="form">
          <div class="oi-field-row" style="flex-direction:column;align-items:stretch;gap:4px;">
            <label class="oi-field-label">Accomplished Last Cycle</label>
            <textarea class="oi-input" rows="3" formControlName="accomplished_last_cycle"></textarea>
          </div>
          <div class="oi-field-row" style="flex-direction:column;align-items:stretch;gap:4px;">
            <label class="oi-field-label">Plan for Next Cycle</label>
            <textarea class="oi-input" rows="3" formControlName="plan_next_cycle"></textarea>
          </div>
          <div class="oi-field-row" style="flex-direction:column;align-items:stretch;gap:4px;">
            <label class="oi-field-label">Current Blockers &amp; Resolution</label>
            <textarea class="oi-input" rows="3" formControlName="blockers"></textarea>
          </div>

          <div class="oi-field-row" style="justify-content:space-between;">
            <label class="oi-field-label">Escalation Needed?</label>
            <label class="isp-toggle">
              <input type="checkbox" formControlName="escalation_needed" />
              <span>{{ form.value.escalation_needed ? 'Yes' : 'No' }}</span>
            </label>
          </div>

          <div class="oi-field-row" *ngIf="pilotApp" style="flex-direction:column;align-items:stretch;gap:4px;">
            <label class="oi-field-label">Go to Deploy Confidence</label>
            <app-milestone-status-selector
              [value]="pilotConfidence"
              (valueChange)="pilotConfidence = $event">
            </app-milestone-status-selector>
            <span class="isp-helper">(Updates gate status)</span>
          </div>

          <div class="oi-field-row" *ngIf="closeApp" style="flex-direction:column;align-items:stretch;gap:4px;">
            <label class="oi-field-label">Close Review Confidence</label>
            <app-milestone-status-selector
              [value]="closeConfidence"
              (valueChange)="closeConfidence = $event">
            </app-milestone-status-selector>
            <span class="isp-helper">(Updates gate status)</span>
          </div>

          <div class="oi-err" *ngIf="error">{{ error }}</div>
        </form>

        <!-- ============ READ MODE ============ -->
        <ng-container *ngIf="mode === 'read'">
          <!-- D-178 Tier 1 skeleton -->
          <div *ngIf="loading" style="display:flex;flex-direction:column;gap:8px;">
            <ion-skeleton-text animated style="width:55%;height:14px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="width:90%;height:48px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="width:80%;height:48px;"></ion-skeleton-text>
          </div>

          <ng-container *ngIf="!loading">
            <div *ngIf="!latest?.latest" class="oi-zone-explain">No status updates recorded.</div>

            <ng-container *ngIf="latest?.latest as u">
              <div class="isp-subhead">Updated by {{ latest!.saved_by_name || 'Unknown' }} · {{ formatDateTime(u.saved_at) }}</div>

              <div class="oi-field-row" style="flex-direction:column;align-items:stretch;">
                <span class="oi-field-label">Accomplished Last Cycle</span>
                <span>{{ u.accomplished_last_cycle || '—' }}</span>
              </div>
              <div class="oi-field-row" style="flex-direction:column;align-items:stretch;">
                <span class="oi-field-label">Plan for Next Cycle</span>
                <span>{{ u.plan_next_cycle || '—' }}</span>
              </div>
              <div class="oi-field-row" style="flex-direction:column;align-items:stretch;">
                <span class="oi-field-label">Blockers</span>
                <span>{{ u.blockers || '—' }}</span>
              </div>
              <div class="oi-field-row">
                <span class="oi-field-label">Escalation Needed</span>
                <span [class.isp-escalation]="u.escalation_needed">{{ u.escalation_needed ? 'Yes' : 'No' }}</span>
              </div>
              <div class="oi-field-row" *ngIf="u.pilot_confidence_applicable">
                <span class="oi-field-label">Go to Deploy Confidence</span>
                <span>{{ confidenceLabel(u.pilot_confidence) }}</span>
              </div>
              <div class="oi-field-row" *ngIf="u.close_confidence_applicable">
                <span class="oi-field-label">Close Review Confidence</span>
                <span>{{ confidenceLabel(u.close_confidence) }}</span>
              </div>

              <!-- Acknowledged by -->
              <div class="oi-zone" style="margin-top:12px;">
                <div class="oi-zone-title">Acknowledged by</div>
                <div *ngIf="latest!.acknowledgments.length === 0" class="oi-zone-explain">
                  No acknowledgments required.
                </div>
                <div *ngFor="let a of latest!.acknowledgments" class="isp-ack-row">
                  <span [class.isp-ack-done]="a.acknowledged">{{ a.acknowledged ? '✓' : '○' }}</span>
                  <span>{{ a.display_name }}</span>
                  <span style="color:var(--triarq-color-text-secondary);font-size:12px;">
                    {{ a.acknowledged ? formatDateTime(a.acknowledged_at) : 'Pending' }}
                  </span>
                </div>
              </div>

              <!-- Needs Review pills -->
              <div class="oi-zone" *ngIf="latest!.needs_review_reasons.length">
                <div class="oi-zone-title">Needs Review</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  <span class="isp-pill" *ngFor="let r of latest!.needs_review_reasons">{{ r }}</span>
                </div>
              </div>

              <!-- View Initiative link (D-478, S-006/S-007) -->
              <div style="margin-top:12px;">
                <a role="button" tabindex="0" class="isp-link"
                   (click)="viewInitiative.emit()" (keydown.enter)="viewInitiative.emit()">View Initiative</a>
              </div>

              <!-- Acknowledge button (D-346 Context A) -->
              <div style="margin-top:12px;" *ngIf="canAcknowledge">
                <button class="oi-btn-primary" (click)="acknowledge(u.id)" [disabled]="acking">
                  {{ acking ? 'Acknowledging…' : 'Acknowledge Update' }}
                </button>
              </div>
              <div style="margin-top:12px;" *ngIf="ackDone" class="isp-ack-done">
                ✓ Acknowledged {{ formatDateTime(ackDoneAt) }}
              </div>

              <div class="oi-err" *ngIf="error">{{ error }}</div>
            </ng-container>
          </ng-container>
        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .isp-helper { font-size:11px; color:var(--triarq-color-stone, #5A5A5A); }
    .isp-subhead { font-size:12px; color:var(--triarq-color-text-secondary); margin-bottom:10px; }
    .isp-toggle { display:inline-flex; align-items:center; gap:6px; cursor:pointer; }
    .isp-escalation { color:var(--triarq-color-error, #E96127); font-weight:500; }
    .isp-ack-row { display:flex; align-items:center; gap:8px; font-size:13px; padding:3px 0; }
    .isp-ack-done { color:#22c55e; font-weight:500; }
    .isp-pill {
      background:var(--triarq-color-error, #E96127); color:#fff;
      border-radius:var(--radius-pill, 999px); padding:2px 10px; font-size:11px;
    }
    .isp-link { color:var(--triarq-color-primary, #257099); cursor:pointer; font-size:13px; }
  `]
})
export class InitiativeStatusUpdatePanelComponent implements OnInit {
  @Input() initiativeId!: string;
  @Input() initiativeName = '';
  @Input() mode: 'edit' | 'read' = 'edit';
  /** Edit-mode field visibility (D-479). Server recomputes the authoritative value on save. */
  @Input() pilotApplicable = false;
  @Input() closeApplicable = false;
  /** When true (openers without the cycle stage handy), the panel fetches the
   *  cycle and derives applicability itself rather than trusting the inputs. */
  @Input() deriveApplicability = false;

  // Internal applicability — seeded from inputs, optionally derived (D-479).
  pilotApp = false;
  closeApp = false;

  @Output() saved          = new EventEmitter<void>();
  @Output() cancelled      = new EventEmitter<void>();
  @Output() viewInitiative = new EventEmitter<void>();
  @Output() acknowledged   = new EventEmitter<void>();

  form: FormGroup;
  pilotConfidence: StatusConfidence | null = null;
  closeConfidence: StatusConfidence | null = null;

  loading = false;
  saving  = false;
  acking  = false;
  ackDone = false;
  ackDoneAt = '';
  error: string | null = null;

  latest: LatestInitiativeStatus | null = null;

  constructor(
    private readonly fb:             FormBuilder,
    private readonly delivery:       DeliveryService,
    private readonly profileService: UserProfileService,
    private readonly cdr:            ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      accomplished_last_cycle: [''],
      plan_next_cycle:         [''],
      blockers:                [''],
      escalation_needed:       [false]
    });
  }

  ngOnInit(): void {
    if (this.mode === 'read') { this.load(); return; }
    // Edit mode: seed applicability from inputs, optionally derive from the cycle.
    this.pilotApp = this.pilotApplicable;
    this.closeApp = this.closeApplicable;
    if (this.deriveApplicability) { this.deriveFromCycle(); }
  }

  private deriveFromCycle(): void {
    this.delivery.getCycle(this.initiativeId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const ORDER: string[] = ['BRIEF','DESIGN','SPEC','BUILD','VALIDATE','PILOT','UAT','RELEASE','OUTCOME','COMPLETE'];
          const c = res.data;
          const idx = ORDER.indexOf(c.current_lifecycle_stage as LifecycleStage as string);
          const reached = idx >= 0 && idx >= ORDER.indexOf('PILOT');
          const md = c.milestone_dates || [];
          const gd = md.find(m => m.gate_name === 'go_to_deploy')?.date_status;
          const cr = md.find(m => m.gate_name === 'close_review')?.date_status;
          const bothComplete = gd === 'complete' && cr === 'complete';
          this.pilotApp = !bothComplete && !reached;
          this.closeApp = !bothComplete && reached;
          this.cdr.markForCheck();
        }
      },
      error: () => {}
    });
  }

  private load(): void {
    this.loading = true;
    this.delivery.getLatestInitiativeStatus(this.initiativeId).subscribe({
      next: (res) => {
        this.latest = (res.success && res.data) ? res.data : null;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  /** Acknowledge button visibility (D-483): current user is an unacknowledged
   *  non-save trio member, within the 5-day window. */
  get canAcknowledge(): boolean {
    if (this.ackDone || !this.latest?.latest) { return false; }
    const me = this.profileService.getCurrentProfile()?.id;
    if (!me) { return false; }
    const within5d = (Date.now() - new Date(this.latest.latest.saved_at).getTime()) <= FIVE_DAYS_MS;
    if (!within5d) { return false; }
    const entry = this.latest.acknowledgments.find(a => a.user_id === me);
    return !!entry && !entry.acknowledged;
  }

  save(): void {
    this.error = null;
    this.saving = true;
    const v = this.form.value;
    this.delivery.saveInitiativeStatusUpdate({
      initiative_id:           this.initiativeId,
      accomplished_last_cycle: v.accomplished_last_cycle || null,
      plan_next_cycle:         v.plan_next_cycle || null,
      blockers:                v.blockers || null,
      escalation_needed:       v.escalation_needed === true,
      pilot_confidence:        this.pilotApp ? this.pilotConfidence : null,
      close_confidence:        this.closeApp ? this.closeConfidence : null
    }).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) { this.saved.emit(); }
        else { this.error = res.error || 'Could not save the status update.'; this.cdr.markForCheck(); }
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error || 'Could not save the status update.';
        this.cdr.markForCheck();
      }
    });
  }

  acknowledge(statusUpdateId: string): void {
    this.error = null;
    this.acking = true;
    this.delivery.acknowledgeStatusUpdate(statusUpdateId).subscribe({
      next: (res) => {
        this.acking = false;
        if (res.success && res.data) {
          this.ackDone = true;
          this.ackDoneAt = res.data.acknowledged_at;
          this.acknowledged.emit();
        } else {
          this.error = res.error || 'Could not record acknowledgment.';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.acking = false;
        this.error = err?.error || 'Could not record acknowledgment.';
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void { this.cancelled.emit(); }

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
