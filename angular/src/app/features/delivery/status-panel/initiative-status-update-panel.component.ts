// initiative-status-update-panel.component.ts — Contract 32 (WS2),
// reworked Contract 36 (D-506/D-507/D-512/D-513/D-514).
// Right panel for Initiative Status (D-478). Modes:
//   edit — ANY user with visibility authors an update (D-506); may supersede
//          the latest update when the edit window is open (D-507).
//   read — read-only view + D-513 acknowledgment chips + Prev/Next meeting
//          navigation (D-512) + Update Status / Edit actions from the panel.
//
// Full-rewrite note (D-252): Contract 36 deltas touched ~70% of the file —
// recorded as a CC-decision; behaviors preserved: S-017 modality, D-178
// skeleton, D-346 busy states, D-200 inline errors, D-477 confidence selector.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges
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

// D-514: cadence display names — 'weekly cycle' / 'tri-weekly cycle' / 'monthly cycle'.
const CADENCE_PHRASE: Record<string, string> = {
  weekly:    'Weekly Cycle',
  triweekly: 'Tri-weekly Cycle',
  monthly:   'Monthly Cycle'
};

@Component({
  selector: 'app-initiative-status-update-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, MilestoneStatusSelectorComponent],
  template: `
    <!-- S-017: edit is modal (scrim covers list); read is non-modal. -->
    <div *ngIf="activeMode === 'edit'" class="oi-scrim oi-scrim-detail" (click)="onCancel()"></div>

    <div class="oi-side-panel oi-side-detail" role="dialog" aria-modal="true"
         [attr.aria-label]="activeMode === 'edit' ? 'Initiative Status Update' : 'Initiative Status'">

      <!-- ── Header (D-348 Tier 1: Save/Cancel here in edit mode) ── -->
      <div class="oi-side-head">
        <div style="display:flex;flex-direction:column;gap:2px;">
          <strong>{{ activeMode === 'edit' ? (editingUpdateId ? 'Edit Status Update' : 'Initiative Status Update') : 'Initiative Status' }}</strong>
          <span style="font-size:12px;color:var(--triarq-color-text-secondary);">{{ initiativeName }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <!-- D-512: Prev/Next walk the dashboard grid in its in-effect filter + sort. -->
          <ng-container *ngIf="activeMode === 'read' && (hasPrev || hasNext)">
            <button class="oi-btn-secondary isp-nav" [disabled]="!hasPrev" (click)="prev.emit()">‹ Prev</button>
            <button class="oi-btn-secondary isp-nav" [disabled]="!hasNext" (click)="next.emit()">Next ›</button>
          </ng-container>
          <ng-container *ngIf="activeMode === 'edit'">
            <button class="oi-btn-secondary" (click)="onCancel()" [disabled]="saving">Cancel</button>
            <button class="oi-btn-primary" (click)="save()" [disabled]="saving">
              {{ saving ? 'Saving…' : (editingUpdateId ? 'Save Edit' : 'Save Status Update') }}
            </button>
          </ng-container>
          <button class="oi-close-btn" (click)="onCancel()" aria-label="Close">✕</button>
        </div>
      </div>

      <div class="oi-side-body">

        <!-- ============ EDIT MODE ============ -->
        <form *ngIf="activeMode === 'edit'" [formGroup]="form">
          <!-- CC-38-43: live review warnings while entering — what the review
               meeting will see right now, addressable before saving. -->
          <div *ngIf="latest?.needs_review_reasons?.length"
               class="isp-band"
               [class.isp-band-red]="reasonBandRed(latest!.needs_review_reasons)"
               [class.isp-band-amber]="!reasonBandRed(latest!.needs_review_reasons)">
            <div class="isp-band-title">This Initiative currently needs review</div>
            <div *ngFor="let r of latest!.needs_review_reasons" class="isp-band-line"
                 [style.color]="reasonIsRed(r) ? '#791F1F' : '#7A5A2A'">• <strong>{{ r }}</strong></div>
          </div>
          <div *ngIf="editingUpdateId" class="isp-edit-note">
            Editing the latest update — the original save time still governs due dates.
          </div>
          <div class="oi-field-row" style="flex-direction:column;align-items:stretch;gap:4px;">
            <label class="oi-field-label">{{ accomplishedLabel }}</label>
            <textarea class="oi-input" rows="3" formControlName="accomplished_last_cycle"></textarea>
          </div>
          <div class="oi-field-row" style="flex-direction:column;align-items:stretch;gap:4px;">
            <label class="oi-field-label">{{ planLabel }}</label>
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
              <span>Yes</span>
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
        <ng-container *ngIf="activeMode === 'read'">
          <!-- D-178 Tier 1 skeleton -->
          <div *ngIf="loading" style="display:flex;flex-direction:column;gap:8px;">
            <ion-skeleton-text animated style="width:55%;height:14px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="width:90%;height:48px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="width:80%;height:48px;"></ion-skeleton-text>
          </div>

          <ng-container *ngIf="!loading">
            <div *ngIf="!latest?.latest" class="oi-zone-explain">No status updates recorded.</div>
            <!-- D-512 act-from-panel: Update Status available with or without a prior update. -->
            <div *ngIf="!latest?.latest" style="margin-top:12px;">
              <button class="oi-btn-primary" (click)="startNewUpdate()">Update Status</button>
            </div>

            <ng-container *ngIf="latest?.latest as u">
              <div class="isp-subhead">
                Updated by {{ latest!.saved_by_name || 'Unknown' }} · {{ ageLabel }}
                <span *ngIf="latest!.chain?.is_edited" class="isp-edited">(edited)</span>
              </div>

              <div class="oi-field-row" style="flex-direction:column;align-items:stretch;">
                <span class="oi-field-label">{{ accomplishedLabel }}</span>
                <span>{{ u.accomplished_last_cycle || '—' }}</span>
              </div>
              <div class="oi-field-row" style="flex-direction:column;align-items:stretch;">
                <span class="oi-field-label">{{ planLabel }}</span>
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

              <!-- D-513: Acknowledgment chips — non-trio-authored updates only. -->
              <div class="oi-zone" style="margin-top:12px;" *ngIf="latest!.is_trio_author === false && latest!.acknowledgments.length">
                <div class="oi-zone-title">Acknowledgments</div>
                <div class="isp-chip-row">
                  <ng-container *ngFor="let a of latest!.acknowledgments">
                    <!-- Own pending chip = one-click Acknowledge -->
                    <button *ngIf="isMe(a.user_id) && !a.acknowledged"
                            class="isp-chip isp-chip-action"
                            [disabled]="acking"
                            [title]="a.display_name"
                            (click)="acknowledge(u.id)">
                      {{ acking ? 'Acknowledging…' : 'Acknowledge' }}
                    </button>
                    <span *ngIf="!isMe(a.user_id) || a.acknowledged"
                          class="isp-chip"
                          [class.isp-chip-done]="a.acknowledged"
                          [class.isp-chip-pending]="!a.acknowledged"
                          [title]="chipTitle(a)">
                      {{ initials(a.display_name) }}<ng-container *ngIf="a.acknowledged"> ✓</ng-container>
                    </span>
                    <span *ngIf="!a.acknowledged && a.acknowledged_earlier" class="isp-earlier">
                      acknowledged an earlier version
                    </span>
                  </ng-container>
                </div>
              </div>

              <!-- Needs Review — banded block (CC-38-42, matches grid grammar). -->
              <div class="oi-zone" *ngIf="latest!.needs_review_reasons.length">
                <div class="oi-zone-title">Needs Review</div>
                <div class="isp-band"
                     [class.isp-band-red]="reasonBandRed(latest!.needs_review_reasons)"
                     [class.isp-band-amber]="!reasonBandRed(latest!.needs_review_reasons)">
                  <div *ngFor="let r of latest!.needs_review_reasons" class="isp-band-line"
                       [style.color]="reasonIsRed(r) ? '#791F1F' : '#7A5A2A'">• <strong>{{ r }}</strong></div>
                </div>
              </div>

              <!-- D-512 act-from-panel: Update Status (any user) + Edit (window rules) -->
              <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                <button class="oi-btn-primary" (click)="startNewUpdate()">Update Status</button>
                <button *ngIf="canEdit" class="oi-btn-secondary" (click)="startEditLatest()">Edit</button>
              </div>

              <!-- View Initiative link (D-478, S-006/S-007) -->
              <div style="margin-top:12px;">
                <a role="button" tabindex="0" class="isp-link"
                   (click)="viewInitiative.emit()" (keydown.enter)="viewInitiative.emit()">View Initiative</a>
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
    .isp-edited { font-style:italic; color:#9E9E9E; margin-left:4px; }
    .isp-edit-note { font-size:11px; font-style:italic; color:#757575; background:#F4F7F9; border-radius:5px; padding:6px 10px; margin-bottom:10px; }
    .isp-toggle { display:inline-flex; align-items:center; gap:6px; cursor:pointer; }
    .isp-escalation { color:var(--triarq-color-error, #E96127); font-weight:500; }
    .isp-nav { font-size:12px; padding:4px 10px; }
    .isp-chip-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
    .isp-chip {
      display:inline-flex; align-items:center; gap:3px;
      border-radius:999px; padding:2px 10px; font-size:11px; font-weight:600;
      border:1px solid transparent;
    }
    .isp-chip-done { background:#E8F5E9; color:#2E7D32; }
    .isp-chip-pending { background:#F0F0F0; color:#9E9E9E; border-color:#E0E0E0; }
    .isp-chip-action {
      background:var(--triarq-color-primary,#257099); color:#fff; cursor:pointer; border:none;
    }
    .isp-chip-action:disabled { opacity:0.6; cursor:default; }
    .isp-earlier { font-size:10px; font-style:italic; color:#757575; }
    .isp-pill {
      background:var(--triarq-color-error, #E96127); color:#fff;
      border-radius:var(--radius-pill, 999px); padding:2px 10px; font-size:11px;
    }
    .isp-band { padding:6px 10px; margin-bottom:10px; }
    .isp-band-red   { border-left:3px solid #A32D2D; background:rgba(211,47,47,0.09); }
    .isp-band-amber { border-left:3px solid #BA7517; background:rgba(242,166,32,0.12); }
    .isp-band-title { font-size:12px; font-weight:500; }
    .isp-band-red .isp-band-title   { color:#791F1F; }
    .isp-band-amber .isp-band-title { color:#633806; }
    .isp-band-line { font-size:11.5px; margin-top:1px; }
    .isp-band-line strong { font-weight:600; }
    .isp-link { color:var(--triarq-color-primary, #257099); cursor:pointer; font-size:13px; }
  `]
})
export class InitiativeStatusUpdatePanelComponent implements OnInit, OnChanges {
  @Input() initiativeId!: string;
  @Input() initiativeName = '';
  @Input() mode: 'edit' | 'read' = 'edit';
  /** Edit-mode field visibility (D-479). Server recomputes the authoritative value on save. */
  @Input() pilotApplicable = false;
  @Input() closeApplicable = false;
  /** When true, the panel fetches the cycle and derives applicability itself. */
  @Input() deriveApplicability = false;
  /** D-512: Prev/Next meeting navigation (dashboard supplies availability). */
  @Input() hasPrev = false;
  @Input() hasNext = false;

  // Internal applicability — seeded from inputs, optionally derived (D-479).
  pilotApp = false;
  closeApp = false;

  // Contract 36: the panel can switch read → edit internally (act from panel).
  activeMode: 'edit' | 'read' = 'edit';
  /** D-507: set when editing (superseding) the latest update. */
  editingUpdateId: string | null = null;

  @Output() saved          = new EventEmitter<void>();
  @Output() cancelled      = new EventEmitter<void>();
  @Output() viewInitiative = new EventEmitter<void>();
  @Output() acknowledged   = new EventEmitter<void>();
  @Output() prev           = new EventEmitter<void>();
  @Output() next           = new EventEmitter<void>();

  form: FormGroup;
  pilotConfidence: StatusConfidence | null = null;
  closeConfidence: StatusConfidence | null = null;

  loading = false;
  saving  = false;
  acking  = false;
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
    this.activeMode = this.mode;
    if (this.activeMode === 'read') { this.load(); return; }
    // Edit mode: seed applicability from inputs, optionally derive from the cycle.
    this.pilotApp = this.pilotApplicable;
    this.closeApp = this.closeApplicable;
    if (this.deriveApplicability) { this.deriveFromCycle(); }
    // D-514: cadence phrase needs the latest-status payload even in edit mode.
    this.loadCadenceOnly();
  }

  /** D-512: Prev/Next changes initiativeId — reload in place. */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initiativeId'] && !changes['initiativeId'].firstChange) {
      this.error = null;
      this.editingUpdateId = null;
      this.activeMode = this.mode;
      if (this.activeMode === 'read') { this.load(); }
    }
  }

  /** External refresh hook — the dashboard's poll refreshes an open panel (D-512). */
  refresh(): void {
    if (this.activeMode === 'read') { this.load(); }
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

  /** Edit-mode openers still need resolved_cadence for the D-514 labels. */
  private loadCadenceOnly(): void {
    this.delivery.getLatestInitiativeStatus(this.initiativeId).subscribe({
      next: (res) => {
        if (res.success && res.data) { this.latest = res.data; this.cdr.markForCheck(); }
      },
      error: () => {}
    });
  }

  // ── D-514: cadence-named helper text ────────────────────────────────────────
  get cadencePhrase(): string | null {
    const c = this.latest?.resolved_cadence;
    return c ? (CADENCE_PHRASE[c] ?? null) : null;
  }
  get accomplishedLabel(): string {
    return this.cadencePhrase ? `Accomplished Last ${this.cadencePhrase}` : 'Accomplished Recently';
  }
  get planLabel(): string {
    return this.cadencePhrase ? `Plan for Next ${this.cadencePhrase}` : 'Plan / Next Steps';
  }

  // ── D-507 age from chain root ───────────────────────────────────────────────
  get ageLabel(): string {
    const rootIso = this.latest?.chain?.root_saved_at ?? this.latest?.latest?.saved_at ?? null;
    if (!rootIso) { return '—'; }
    const dayMs = 24 * 60 * 60 * 1000;
    const d = new Date(rootIso);
    const days = Math.floor(Date.now() / dayMs) - Math.floor(d.getTime() / dayMs);
    if (days <= 0) { return 'Today'; }
    return days === 1 ? '1 day' : `${days} days`;
  }

  // ── D-512 act-from-panel ────────────────────────────────────────────────────
  startNewUpdate(): void {
    this.editingUpdateId = null;
    this.form.reset({ accomplished_last_cycle: '', plan_next_cycle: '', blockers: '', escalation_needed: false });
    this.pilotConfidence = null;
    this.closeConfidence = null;
    this.activeMode = 'edit';
    this.deriveFromCycle();
    this.cdr.markForCheck();
  }

  /** D-507: Edit offered when the window is open AND caller is author or trio.
   *  The trio check is server-authoritative; the panel shows Edit when the
   *  window is open and the caller is the author OR appears in the ack chip
   *  roster (trio) — the server re-validates on save. */
  get canEdit(): boolean {
    if (!this.latest?.latest || !this.latest.chain?.edit_window_open) { return false; }
    const me = this.profileService.getCurrentProfile();
    if (!me) { return false; }
    if (me.is_admin === true) { return true; }
    if (this.latest.latest.saved_by === me.id) { return true; }
    return this.latest.acknowledgments.some(a => a.user_id === me.id);
  }

  startEditLatest(): void {
    const u = this.latest?.latest;
    if (!u) { return; }
    this.editingUpdateId = u.id;
    this.form.reset({
      accomplished_last_cycle: u.accomplished_last_cycle ?? '',
      plan_next_cycle:         u.plan_next_cycle ?? '',
      blockers:                u.blockers ?? '',
      escalation_needed:       u.escalation_needed === true
    });
    this.pilotConfidence = u.pilot_confidence ?? null;
    this.closeConfidence = u.close_confidence ?? null;
    this.pilotApp = u.pilot_confidence_applicable;
    this.closeApp = u.close_confidence_applicable;
    this.activeMode = 'edit';
    this.cdr.markForCheck();
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
      close_confidence:        this.closeApp ? this.closeConfidence : null,
      ...(this.editingUpdateId ? { supersedes_update_id: this.editingUpdateId } : {})
    }).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.editingUpdateId = null;
          if (this.mode === 'read') {
            // Opened as a read panel — return to read view with fresh data.
            this.activeMode = 'read';
            this.load();
          }
          this.saved.emit();
        }
        else { this.error = res.error || 'Could not save the status update.'; this.cdr.markForCheck(); }
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error || 'Could not save the status update.';
        this.cdr.markForCheck();
      }
    });
  }

  // ── D-513 chips ─────────────────────────────────────────────────────────────
  isMe(userId: string): boolean {
    return this.profileService.getCurrentProfile()?.id === userId;
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');
  }

  chipTitle(a: { display_name: string; acknowledged: boolean; acknowledged_at: string | null; acknowledged_earlier?: boolean }): string {
    if (a.acknowledged) { return `${a.display_name} — acknowledged ${this.formatDateTime(a.acknowledged_at)}`; }
    if (a.acknowledged_earlier) { return `${a.display_name} — acknowledged an earlier version`; }
    return `${a.display_name} — not acknowledged`;
  }

  acknowledge(statusUpdateId: string): void {
    this.error = null;
    this.acking = true;
    this.delivery.acknowledgeStatusUpdate(statusUpdateId).subscribe({
      next: (res) => {
        this.acking = false;
        if (res.success && res.data) {
          this.load();               // chips re-render from server truth
          this.acknowledged.emit();  // drains the My Actions badge (D-512 live)
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

  onCancel(): void {
    // Internal edit started from read view → back to read, not close.
    if (this.activeMode === 'edit' && this.mode === 'read') {
      this.activeMode = 'read';
      this.editingUpdateId = null;
      this.load();
      this.cdr.markForCheck();
      return;
    }
    this.cancelled.emit();
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

  /** CC-38-42/43: banded warnings — red reasons dominate; slips/at-risk amber. */
  private static readonly RED_REASONS = ['Escalation', 'Status Update Overdue', 'Missing Target Date', 'Missing Deploy Date', 'Gate Overdue'];
  reasonIsRed(reason: string): boolean {
    return InitiativeStatusUpdatePanelComponent.RED_REASONS.some(p => reason.startsWith(p));
  }
  reasonBandRed(reasons: string[]): boolean { return reasons.some(r => this.reasonIsRed(r)); }
}
