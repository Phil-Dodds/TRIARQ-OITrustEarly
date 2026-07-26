// gate-assessment-form.component.ts — Contract GA-1 (D-579)
// The ONE compact assessment screen (spec §7), revised per Phil 2026-07-26:
//  - Progressive disclosure: three top-level questions first; the gate-named
//    best-practices question sits THIRD and, once graded, reveals the
//    gate-specific sub-questions.
//  - Generic vs gate-specific items are visually distinct sections.
//  - The optional comment field appears automatically once a grade is set.
//  - A nudge line frames the exercise ("Self-grade the team…").
// The parent's action button stays disabled until every presented item is
// non-blank — completeness covers the revealed sub-items too.

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ASSESSMENT_GRADES, AssessmentGrade, AssessmentRole, AssessmentItemDef, assessmentItemsFor
} from '../../../shared/constants/gate-assessment.constants';
import { GATE_COACHING_SHORT } from '../../../shared/constants/gate-coaching.constants';

export interface AssessmentPayloadItem { item_key: string; grade: AssessmentGrade; comment?: string; }
export interface AssessmentChange { complete: boolean; items: AssessmentPayloadItem[]; }

interface DraftRow { def: AssessmentItemDef; grade: AssessmentGrade | ''; comment: string; }

const GATE_LABEL_BY_KEY: Record<string, string> = {
  brief_review: 'Brief Review', go_to_build: 'Go to Build', go_to_deploy: 'Go to Deploy',
  go_to_release: 'Go to Release', close_review: 'Close Review'
};

@Component({
  selector: 'app-gate-assessment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ga-root">
      <div class="ga-header">
        <span class="ga-purpose">{{ purposeLine }}</span>
        <span class="ga-nudge">{{ nudgeLine }}</span>
        <a *ngIf="linkUrl" class="ga-link" [href]="linkUrl" target="_blank" rel="noopener">
          Full best practices for this gate →
        </a>
      </div>

      <!-- Top-level questions (gate-named best-practices item LAST — it is
           the reveal trigger for the gate-specific block below). -->
      <div *ngFor="let row of topRows" class="ga-item">
        <div class="ga-item-row">
          <span class="ga-item-text">{{ displayText(row) }}</span>
          <span class="ga-chips">
            <button *ngFor="let g of grades" type="button" class="ga-chip"
                    [class.ga-chip--on]="row.grade === g" [disabled]="disabled"
                    (click)="setGrade(row, g)">{{ g === 'NA' ? 'N/A' : g }}</button>
          </span>
        </div>
        <input *ngIf="row.grade !== ''" type="text" maxlength="500"
               class="ga-comment" placeholder="Optional comment"
               [disabled]="disabled"
               [(ngModel)]="row.comment" (ngModelChange)="emit()"
               [ngModelOptions]="{standalone: true}" />
      </div>

      <!-- Gate-specific sub-questions — revealed once the trigger is graded. -->
      <ng-container *ngIf="subsRevealed">
        <div class="ga-section-label">{{ gateLabel }} best practices — how did we do?</div>
        <div *ngFor="let row of subRows" class="ga-item ga-item--sub">
          <div class="ga-item-row">
            <span class="ga-item-text">{{ row.def.text }}</span>
            <span class="ga-chips">
              <button *ngFor="let g of grades" type="button" class="ga-chip"
                      [class.ga-chip--on]="row.grade === g" [disabled]="disabled"
                      (click)="setGrade(row, g)">{{ g === 'NA' ? 'N/A' : g }}</button>
            </span>
          </div>
          <input *ngIf="row.grade !== ''" type="text" maxlength="500"
                 class="ga-comment" placeholder="Optional comment"
                 [disabled]="disabled"
                 [(ngModel)]="row.comment" (ngModelChange)="emit()"
                 [ngModelOptions]="{standalone: true}" />
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .ga-root { border: 1px solid #DDE5EA; border-radius: 8px; padding: 10px 12px; margin: 8px 0; background: #FBFDFE; }
    .ga-header { display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px; }
    .ga-purpose { font: italic 11px/1.4 Roboto, sans-serif; color: #5A5A5A; }
    .ga-nudge { font: 600 11px/1.4 Roboto, sans-serif; color: #257099; }
    .ga-link { font: 500 11px Roboto, sans-serif; color: #257099; text-decoration: underline; }
    .ga-section-label {
      margin: 10px 0 2px; font: 600 10px Roboto, sans-serif; color: #757575;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .ga-item { padding: 4px 0; border-top: 1px solid #EEF3F6; }
    .ga-item:first-of-type { border-top: none; }
    .ga-item--sub { padding-left: 14px; border-left: 2px solid #DDE5EA; border-top: none; }
    .ga-item-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .ga-item-text { font: 400 12px/1.35 Roboto, sans-serif; color: #1A1A1A; flex: 1; min-width: 0; }
    .ga-chips { display: flex; gap: 4px; flex-shrink: 0; align-items: center; }
    .ga-chip {
      min-width: 26px; padding: 3px 6px; border-radius: 999px; cursor: pointer;
      border: 1px solid #B9C4CE; background: #fff; color: #5A5A5A;
      font: 600 11px Roboto, sans-serif;
    }
    .ga-chip--on { background: #257099; border-color: #257099; color: #fff; }
    .ga-chip:disabled { opacity: 0.55; cursor: not-allowed; }
    .ga-comment {
      width: 100%; margin-top: 4px; border: 1px solid #B9C4CE; border-radius: 5px;
      padding: 4px 8px; font: 400 12px Roboto, sans-serif;
    }
  `]
})
export class GateAssessmentFormComponent implements OnChanges {
  @Input() gateKey = '';
  @Input() role: AssessmentRole = 'submitter';
  @Input() linkUrl: string | null = null;
  @Input() disabled = false;
  @Output() changed = new EventEmitter<AssessmentChange>();

  grades = ASSESSMENT_GRADES;
  private rows: DraftRow[] = [];

  get gateLabel(): string {
    return GATE_LABEL_BY_KEY[this.gateKey] ?? this.gateKey;
  }

  get purposeLine(): string {
    return GATE_COACHING_SHORT[this.gateLabel] ?? '';
  }

  /** Phil 2026-07-26: frame the exercise — a personal read, not a verdict. */
  get nudgeLine(): string {
    return this.role === 'consulted'
      ? 'Your individual read — grade what you saw. N/A freely; comments optional.'
      : 'Self-grade the team — your individual read of how the work went. Comments optional.';
  }

  /** Top-level rows, reordered so the gate-named best-practices item is LAST
   *  (Phil 2026-07-26): it triggers the gate-specific reveal. For consulted
   *  (no best_practices item) the trigger is their last top-level item. */
  get topRows(): DraftRow[] {
    const tops = this.rows.filter(r => !this.isSub(r));
    const trigger = tops.find(r => r.def.key === this.triggerKey);
    const rest = tops.filter(r => r.def.key !== this.triggerKey);
    return trigger ? [...rest, trigger] : tops;
  }

  get subRows(): DraftRow[] {
    return this.rows.filter(r => this.isSub(r));
  }

  /** Sub-questions appear once the trigger question is graded. */
  get subsRevealed(): boolean {
    const trigger = this.rows.find(r => r.def.key === this.triggerKey);
    return !!trigger && trigger.grade !== '';
  }

  private get triggerKey(): string {
    return this.role === 'consulted' ? 'stakeholders' : 'best_practices';
  }

  private isSub(row: DraftRow): boolean {
    return !['trio_alignment', 'best_practices', 'stakeholders'].includes(row.def.key);
  }

  /** The gate name rides on the trigger question (Phil 2026-07-26). */
  displayText(row: DraftRow): string {
    if (row.def.key === 'best_practices') {
      return `We are learning the best practices for this gate — ${this.gateLabel}.`;
    }
    return row.def.text;
  }

  ngOnChanges(): void {
    const defs = assessmentItemsFor(this.gateKey, this.role);
    if (this.rows.length !== defs.length || this.rows.some((r, i) => r.def.key !== defs[i].key)) {
      this.rows = defs.map(def => ({ def, grade: '', comment: '' }));
      this.emit();
    }
  }

  setGrade(row: DraftRow, g: AssessmentGrade): void {
    row.grade = row.grade === g ? '' : g;
    this.emit();
  }

  emit(): void {
    const complete = this.rows.length > 0 && this.rows.every(r => r.grade !== '');
    const items: AssessmentPayloadItem[] = this.rows
      .filter(r => r.grade !== '')
      .map(r => ({
        item_key: r.def.key,
        grade:    r.grade as AssessmentGrade,
        ...(r.comment.trim() ? { comment: r.comment.trim() } : {})
      }));
    this.changed.emit({ complete, items });
  }
}
