// initiative-sizing-form.component.ts — Pathways OI Trust
// Contract G3 (D-558, D-567): the five-question sizing experience.
// One component, three uses: creation form section, sizing-at-next-gate
// migration interstitial (gate modal), and the Go to Build confirm summary
// (readOnly mode re-presenting the answers).
// Presentation layer only (Arch-2): derivation preview comes from the
// preview_governance_derivation MCP tool — lib/governance-derivation.js stays
// the single source of truth. Alerts are advisory ambers (D-200 Pattern 2),
// never blocks.

import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter,
  Input, OnDestroy, OnInit, Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { DeliveryService, SizingAnswers, SizingSubs, SizingNotes } from '../../../core/services/delivery.service';
import { InitiativeSizing } from '../../../core/types/database';

export interface SizingFormPayload {
  valid:   boolean;
  answers: SizingAnswers;
  subs:    SizingSubs;
  notes:   SizingNotes;
  /** Contract G9 (D-563): the trio's Add/Dismiss decisions on the two
   *  hardcoded suggestion rules — applied post-save by the host component. */
  suggestionDecisions: Partial<Record<'q4_security' | 'q5_ux', { action: 'add' | 'dismiss'; note?: string }>>;
}

interface ChipOption { value: string; label: string; }
interface SubGroup   { key: keyof SizingSubs; label: string; options: ChipOption[]; }

@Component({
  selector: 'app-initiative-sizing-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sz-root" [class.sz-readonly]="readOnly">
      <div class="sz-intro" *ngIf="!readOnly">
        Five questions size this Initiative and derive its governance level.
        Sub-answers guide and alert only — they never change the level.
      </div>

      <div class="sz-question" *ngFor="let q of questions">
        <div class="sz-q-label">{{ q.label }} <span class="sz-required" aria-hidden="true">*</span></div>
        <div class="sz-chips">
          <button type="button" *ngFor="let opt of q.options"
                  class="sz-chip"
                  [class.sz-chip--selected]="isAnswerSelected(q.key, opt.value)"
                  [disabled]="readOnly"
                  (click)="selectAnswer(q.key, opt.value)">{{ opt.label }}</button>
        </div>

        <ng-container *ngIf="q.subs.length > 0 && (!readOnly || hasSubValues(q))">
          <div class="sz-sub-block" *ngFor="let sub of q.subs">
            <span class="sz-sub-label">{{ sub.label }}</span>
            <span class="sz-chips sz-chips--sub">
              <button type="button" *ngFor="let opt of sub.options"
                      class="sz-chip sz-chip--sub"
                      [class.sz-chip--selected]="subs[sub.key] === opt.value"
                      [disabled]="readOnly"
                      (click)="selectSub(sub.key, opt.value)">{{ opt.label }}</button>
            </span>
          </div>
        </ng-container>

        <!-- Q2 vendor boolean sub -->
        <div class="sz-sub-block" *ngIf="q.key === 'q2_novelty' && (!readOnly || subs.q2_sub_new_vendor !== undefined)">
          <span class="sz-sub-label">New vendor involved</span>
          <span class="sz-chips sz-chips--sub">
            <button type="button" class="sz-chip sz-chip--sub"
                    [class.sz-chip--selected]="subs.q2_sub_new_vendor === true"
                    [disabled]="readOnly" (click)="toggleVendor(true)">Yes</button>
            <button type="button" class="sz-chip sz-chip--sub"
                    [class.sz-chip--selected]="subs.q2_sub_new_vendor === false"
                    [disabled]="readOnly" (click)="toggleVendor(false)">No</button>
          </span>
          <span class="sz-sub-hint" *ngIf="subs.q2_sub_new_vendor === true">
            IT/Infrastructure will be flagged Informed automatically.
          </span>
        </div>

        <!-- "Other…" free-text sub-chip -->
        <div class="sz-note-block" *ngIf="!readOnly || notes[q.noteKey]">
          <button type="button" class="sz-chip sz-chip--sub sz-chip--other"
                  *ngIf="!readOnly && !noteOpen[q.noteKey] && !notes[q.noteKey]"
                  (click)="openNote(q.noteKey)">Other…</button>
          <input *ngIf="noteOpen[q.noteKey] || notes[q.noteKey]"
                 class="sz-note-input" type="text" maxlength="500"
                 [readonly]="readOnly"
                 placeholder="Anything else that should inform this answer"
                 [ngModel]="notes[q.noteKey] ?? ''"
                 (ngModelChange)="setNote(q.noteKey, $event)" />
        </div>
      </div>

      <!-- Live Governance panel (D-558) -->
      <div class="sz-gov-panel" *ngIf="showGovernancePanel">
        <div class="sz-gov-title">Governance</div>
        <ng-container *ngIf="allAnswered; else govPending">
          <div class="sz-gov-level" *ngIf="previewLevel !== null">
            Level {{ previewLevel }} baseline
          </div>
          <div class="sz-gov-chip" *ngFor="let chip of previewChips">{{ chip }}</div>
          <div class="sz-alert" *ngIf="previewAlerts.includes('sub_exceeds_answer')">
            ⚠ A sub-answer ranks above the direct Q1 answer — double-check the investment size.
          </div>
          <div class="sz-alert" *ngIf="previewAlerts.includes('novelty_ux_mismatch')">
            ⚠ Major novelty with standard UX involvement is unusual — confirm Q5.
          </div>

          <!-- Contract G9 (D-563 Grade 2): exactly two hardcoded suggestions.
               Add attaches the group as Consulted; Dismiss requires a note
               visible to the specialty (S-C7). -->
          <div *ngFor="let s of liveSuggestions" class="sz-suggestion">
            <div class="sz-suggest-text">
              Suggested: <strong>{{ s.label }}</strong> — {{ s.rationale }}
            </div>
            <div class="sz-suggest-actions" *ngIf="!readOnly">
              <ng-container *ngIf="!suggestionDecisions[s.rule_key]">
                <button type="button" class="sz-chip sz-chip--sub" (click)="acceptSuggestion(s.rule_key)">Add</button>
                <button type="button" class="sz-chip sz-chip--sub sz-chip--other" (click)="startDismiss(s.rule_key)">Dismiss…</button>
              </ng-container>
              <span *ngIf="suggestionDecisions[s.rule_key]?.action === 'add'" class="sz-suggest-state">
                ✓ Will attach {{ s.group_name }} as Consulted
                <button type="button" class="sz-link" (click)="clearDecision(s.rule_key)">undo</button>
              </span>
              <span *ngIf="suggestionDecisions[s.rule_key]?.action === 'dismiss'" class="sz-suggest-state">
                Dismissed — note recorded (visible to {{ s.group_name }})
                <button type="button" class="sz-link" (click)="clearDecision(s.rule_key)">undo</button>
              </span>
            </div>
            <div *ngIf="dismissNoteOpenFor === s.rule_key" class="sz-suggest-note">
              <input type="text" maxlength="300"
                     placeholder="Why is this suggestion being dismissed? (visible to {{ s.group_name }})"
                     [(ngModel)]="dismissNoteDraft" class="sz-note-input" />
              <button type="button" class="sz-chip sz-chip--sub"
                      [disabled]="!dismissNoteDraft.trim()"
                      (click)="confirmDismiss(s.rule_key)">Dismiss</button>
            </div>
          </div>
        </ng-container>
        <ng-template #govPending>
          <div class="sz-gov-pending">Answer all five questions to see the derived governance level.</div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .sz-root { display: flex; flex-direction: column; gap: 14px; }
    .sz-intro { font: italic 11px Roboto, sans-serif; color: #5A5A5A; }
    .sz-q-label { font: 500 13px Roboto, sans-serif; color: #00274E; margin-bottom: 6px; }
    .sz-required { color: #C62828; }
    .sz-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .sz-chip {
      border: 1px solid #B9C4CE; border-radius: 999px; background: #fff;
      padding: 5px 14px; font: 400 12px Roboto, sans-serif; color: #00274E;
      cursor: pointer;
    }
    .sz-chip:hover:not(:disabled) { background: #EEF3F6; }
    .sz-chip--selected { background: #257099; border-color: #257099; color: #fff; }
    .sz-chip--selected:hover:not(:disabled) { background: #1d5878; }
    .sz-chip--sub { padding: 3px 10px; font-size: 11px; }
    .sz-chip--other { border-style: dashed; color: #5A5A5A; }
    .sz-chip:disabled { cursor: default; opacity: 0.85; }
    .sz-sub-block { margin-top: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .sz-sub-label { font: 400 11px Roboto, sans-serif; color: #5A5A5A; min-width: 130px; }
    .sz-sub-hint { font: italic 11px Roboto, sans-serif; color: #8a5b00; }
    .sz-note-block { margin-top: 6px; }
    .sz-note-input {
      width: 100%; border: 1px solid #B9C4CE; border-radius: 5px;
      padding: 6px 10px; font: 400 12px Roboto, sans-serif;
    }
    .sz-gov-panel {
      border: 1px solid #DDE5EA; border-radius: 10px; padding: 12px 14px;
      background: #F7FAFC; display: flex; flex-direction: column; gap: 6px;
    }
    .sz-gov-title { font: 500 12px Roboto, sans-serif; color: #5A5A5A; text-transform: uppercase; letter-spacing: .04em; }
    .sz-gov-level { font: 700 16px Roboto, sans-serif; color: #00274E; }
    .sz-gov-chip { font: 400 12px Roboto, sans-serif; color: #00274E; }
    .sz-gov-pending { font: italic 11px Roboto, sans-serif; color: #5A5A5A; }
    /* D-200 Pattern 2 — advisory amber, never a block. */
    .sz-alert {
      border-left: 3px solid #F2A620; background: rgba(242, 166, 32, 0.08);
      padding: 6px 10px; font: 400 12px Roboto, sans-serif; color: #1a1a1a;
    }
    /* G9 suggestions */
    .sz-suggestion {
      border-left: 3px solid #257099; background: rgba(37, 112, 153, 0.06);
      padding: 6px 10px; display: flex; flex-direction: column; gap: 4px;
    }
    .sz-suggest-text { font: 400 12px Roboto, sans-serif; color: #1a1a1a; }
    .sz-suggest-actions { display: flex; gap: 6px; align-items: center; }
    .sz-suggest-state { font: italic 11px Roboto, sans-serif; color: #2e7d32; }
    .sz-suggest-note { display: flex; gap: 6px; align-items: center; }
    .sz-link { background: none; border: none; color: #257099; cursor: pointer; font-size: 11px; text-decoration: underline; }
  `]
})
export class InitiativeSizingFormComponent implements OnInit, OnDestroy {
  /** Pre-populate from an existing sizing row (edit / confirm modes). */
  @Input() initialSizing: InitiativeSizing | null = null;
  /** Assigned DCS for trust-aware live preview. */
  @Input() dcsUserId: string | null = null;
  /** Confirm mode: answers displayed, not editable (Go to Build re-present). */
  @Input() readOnly = false;
  /** Live Governance panel visibility (on for create/migration; on in confirm too). */
  @Input() showGovernancePanel = true;

  @Output() payloadChange = new EventEmitter<SizingFormPayload>();

  answers: SizingAnswers = {} as SizingAnswers;
  subs:    SizingSubs    = {};
  notes:   SizingNotes   = {};
  noteOpen: Record<string, boolean> = {};

  previewLevel: 1 | 2 | 3 | null = null;
  previewChips: string[] = [];
  previewAlerts: string[] = [];

  // Contract G9 (D-563 Grade 2): decision state for the two hardcoded rules.
  suggestionDecisions: SizingFormPayload['suggestionDecisions'] = {};
  dismissNoteOpenFor: 'q4_security' | 'q5_ux' | null = null;
  dismissNoteDraft = '';

  /** Pure rule evaluation from the current answers — exactly two rules. */
  get liveSuggestions(): Array<{ rule_key: 'q4_security' | 'q5_ux'; group_name: string; label: string; rationale: string }> {
    const out: Array<{ rule_key: 'q4_security' | 'q5_ux'; group_name: string; label: string; rationale: string }> = [];
    if (this.answers.q4_security_impact === true) {
      out.push({
        rule_key: 'q4_security', group_name: 'Security', label: 'Security as Consulted',
        rationale: 'Q4 flags a new security or access element — Security consults at Go to Build.'
      });
    }
    if (this.answers.q5_ux === 'critical') {
      out.push({
        rule_key: 'q5_ux', group_name: 'UX', label: 'UX as Consulted',
        rationale: 'Q5 marks UX involvement critical — UX consults at Brief Review and Go to Build.'
      });
    }
    return out;
  }

  acceptSuggestion(rule_key: 'q4_security' | 'q5_ux'): void {
    this.suggestionDecisions = { ...this.suggestionDecisions, [rule_key]: { action: 'add' } };
    this.dismissNoteOpenFor = null;
    this.emitPayload();
    this.cdr.markForCheck();
  }

  startDismiss(rule_key: 'q4_security' | 'q5_ux'): void {
    this.dismissNoteOpenFor = rule_key;
    this.dismissNoteDraft = '';
    this.cdr.markForCheck();
  }

  confirmDismiss(rule_key: 'q4_security' | 'q5_ux'): void {
    const note = this.dismissNoteDraft.trim();
    if (!note) { return; }
    this.suggestionDecisions = { ...this.suggestionDecisions, [rule_key]: { action: 'dismiss', note } };
    this.dismissNoteOpenFor = null;
    this.dismissNoteDraft = '';
    this.emitPayload();
    this.cdr.markForCheck();
  }

  clearDecision(rule_key: 'q4_security' | 'q5_ux'): void {
    const next = { ...this.suggestionDecisions };
    delete next[rule_key];
    this.suggestionDecisions = next;
    this.emitPayload();
    this.cdr.markForCheck();
  }

  readonly questions: Array<{
    key: keyof SizingAnswers; noteKey: keyof SizingNotes; label: string;
    options: ChipOption[]; subs: SubGroup[];
  }> = [
    {
      key: 'q1_investment', noteKey: 'q1_note',
      label: 'Q1 — How big is the investment?',
      options: [
        { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' }, { value: 'xlarge', label: 'X-Large' }
      ],
      subs: [
        { key: 'q1_sub_engineering', label: 'Engineering effort', options: [
          { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' }, { value: 'xlarge', label: 'X-Large' }] },
        { key: 'q1_sub_operational', label: 'Operational effort', options: [
          { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' }, { value: 'xlarge', label: 'X-Large' }] }
      ]
    },
    {
      key: 'q2_novelty', noteKey: 'q2_note',
      label: 'Q2 — How novel is this work?',
      options: [
        { value: 'standard', label: 'Standard' }, { value: 'major', label: 'Major novelty' }
      ],
      subs: [
        { key: 'q2_sub_persona', label: 'Persona', options: [
          { value: 'well_known', label: 'Well known' }, { value: 'new', label: 'New' }] },
        { key: 'q2_sub_scenarios', label: 'Scenarios', options: [
          { value: 'highly_studied', label: 'Highly studied' }, { value: 'in_discovery', label: 'In discovery' }] },
        { key: 'q2_sub_technology', label: 'Technology', options: [
          { value: 'standard', label: 'Standard' }, { value: 'new_untried', label: 'New / untried' }] }
      ]
    },
    {
      key: 'q3_wrongness', noteKey: 'q3_note',
      label: 'Q3 — If this goes wrong, how bad is it?',
      options: [
        { value: 'contained', label: 'Contained' },
        { value: 'significant', label: 'Significant' },
        { value: 'large_hard', label: 'Large / hard to correct' }
      ],
      subs: [
        { key: 'q3_sub_blast', label: 'Blast radius', options: [
          { value: 'contained_internal', label: 'Contained internal' }, { value: 'external_large', label: 'External / large' }] },
        { key: 'q3_sub_correctable', label: 'Correctability', options: [
          { value: 'easy', label: 'Easy' }, { value: 'difficult', label: 'Difficult' }] }
      ]
    },
    {
      key: 'q4_security_impact', noteKey: 'q4_note',
      label: 'Q4 — Security impact?',
      options: [ { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' } ],
      subs: []
    },
    {
      key: 'q5_ux', noteKey: 'q5_note',
      label: 'Q5 — UX involvement?',
      options: [ { value: 'standard', label: 'Standard' }, { value: 'critical', label: 'Critical' } ],
      subs: [
        { key: 'q5_sub_facing', label: 'Facing', options: [
          { value: 'none', label: 'None' }, { value: 'patient', label: 'Patient' },
          { value: 'provider_clinical', label: 'Provider / clinical' }] },
        { key: 'q5_sub_application', label: 'Application', options: [
          { value: 'established', label: 'Established' }, { value: 'new_application', label: 'New application' }] }
      ]
    }
  ];

  private previewTrigger = new Subject<void>();
  private previewSub?: Subscription;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.initialSizing) {
      const s = this.initialSizing;
      this.answers = {
        q1_investment: s.q1_investment, q2_novelty: s.q2_novelty,
        q3_wrongness: s.q3_wrongness, q4_security_impact: s.q4_security_impact,
        q5_ux: s.q5_ux
      };
      this.subs = {
        ...(s.q1_sub_engineering != null ? { q1_sub_engineering: s.q1_sub_engineering } : {}),
        ...(s.q1_sub_operational != null ? { q1_sub_operational: s.q1_sub_operational } : {}),
        ...(s.q2_sub_persona != null ? { q2_sub_persona: s.q2_sub_persona } : {}),
        ...(s.q2_sub_scenarios != null ? { q2_sub_scenarios: s.q2_sub_scenarios } : {}),
        ...(s.q2_sub_technology != null ? { q2_sub_technology: s.q2_sub_technology } : {}),
        ...(s.q2_sub_new_vendor != null ? { q2_sub_new_vendor: s.q2_sub_new_vendor } : {}),
        ...(s.q3_sub_blast != null ? { q3_sub_blast: s.q3_sub_blast } : {}),
        ...(s.q3_sub_correctable != null ? { q3_sub_correctable: s.q3_sub_correctable } : {}),
        ...(s.q5_sub_facing != null ? { q5_sub_facing: s.q5_sub_facing } : {}),
        ...(s.q5_sub_application != null ? { q5_sub_application: s.q5_sub_application } : {})
      };
      this.notes = {
        ...(s.q1_note ? { q1_note: s.q1_note } : {}),
        ...(s.q2_note ? { q2_note: s.q2_note } : {}),
        ...(s.q3_note ? { q3_note: s.q3_note } : {}),
        ...(s.q4_note ? { q4_note: s.q4_note } : {}),
        ...(s.q5_note ? { q5_note: s.q5_note } : {})
      };
    }

    this.previewSub = this.previewTrigger.pipe(debounceTime(400)).subscribe(() => this.refreshPreview());
    if (this.allAnswered) { this.refreshPreview(); }
    this.emitPayload();
  }

  ngOnDestroy(): void { this.previewSub?.unsubscribe(); }

  get allAnswered(): boolean {
    return !!(this.answers.q1_investment && this.answers.q2_novelty &&
      this.answers.q3_wrongness && this.answers.q4_security_impact !== undefined &&
      this.answers.q5_ux);
  }

  hasSubValues(q: { subs: SubGroup[] }): boolean {
    return q.subs.some(sub => this.subs[sub.key] != null);
  }

  selectAnswer(key: keyof SizingAnswers, value: string): void {
    if (key === 'q4_security_impact') {
      (this.answers as unknown as Record<string, unknown>)[key] = value === 'true';
    } else {
      (this.answers as unknown as Record<string, unknown>)[key] = value;
    }
    this.onAnyChange();
  }

  selectSub(key: keyof SizingSubs, value: string): void {
    if (this.subs[key] === value) {
      delete this.subs[key];           // tap again to clear an advisory sub
    } else {
      (this.subs as unknown as Record<string, unknown>)[key] = value;
    }
    this.onAnyChange();
  }

  toggleVendor(value: boolean): void {
    if (this.subs.q2_sub_new_vendor === value) {
      delete this.subs.q2_sub_new_vendor;
    } else {
      this.subs.q2_sub_new_vendor = value;
    }
    this.onAnyChange();
  }

  openNote(noteKey: keyof SizingNotes): void {
    this.noteOpen[noteKey] = true;
    this.cdr.markForCheck();
  }

  setNote(noteKey: keyof SizingNotes, value: string): void {
    if (value?.trim()) {
      (this.notes as unknown as Record<string, unknown>)[noteKey] = value;
    } else {
      delete this.notes[noteKey];
    }
    this.emitPayload();
  }

  isAnswerSelected(key: keyof SizingAnswers, value: string): boolean {
    if (key === 'q4_security_impact') { return this.answers[key] === (value === 'true'); }
    return this.answers[key] === (value as never);
  }

  private onAnyChange(): void {
    this.emitPayload();
    if (this.allAnswered && this.showGovernancePanel && !this.readOnly) {
      this.previewTrigger.next();
    }
    this.cdr.markForCheck();
  }

  private emitPayload(): void {
    this.payloadChange.emit({
      valid: this.allAnswered,
      answers: this.answers,
      subs: this.subs,
      notes: this.notes,
      suggestionDecisions: this.suggestionDecisions
    });
  }

  private refreshPreview(): void {
    if (!this.allAnswered) { return; }
    this.delivery.previewGovernanceDerivation({
      answers: this.answers,
      subs: this.subs,
      ...(this.dcsUserId ? { dcs_user_id: this.dcsUserId } : {})
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.previewLevel  = res.data.baseline_level;
          this.previewChips  = res.data.explanation_chips ?? [];
          this.previewAlerts = res.data.alerts ?? [];
          this.cdr.markForCheck();
        }
      },
      error: () => { /* advisory panel only — stay quiet on preview failure */ }
    });
  }
}
