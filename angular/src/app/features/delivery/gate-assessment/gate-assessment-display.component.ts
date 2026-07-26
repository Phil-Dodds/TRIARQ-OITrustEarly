// gate-assessment-display.component.ts — Contract GA-1 (D-579)
// Read-only view of collected assessments: the approver's pre-decision panel
// (collapsed by default, one tap to expand — spec §7) and the post-decision
// roster on the gate record. Cleared rows render under "Previous attempt".

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ASSESSMENT_ITEM_TEXT } from '../../../shared/constants/gate-assessment.constants';

export interface GateAssessmentRow {
  id: string;
  respondent_user_id: string;
  respondent_display_name?: string | null;
  respondent_role: string;
  item_key: string;
  grade: string;
  comment: string | null;
  cleared_by_return_at: string | null;
  created_at: string;
}

interface RespondentGroup {
  name: string;
  role: string;
  items: { text: string; grade: string; comment: string | null }[];
}

const ROLE_LABELS: Record<string, string> = {
  submitter: 'Submitter', trio_member: 'Trio member', consulted: 'Consulted', approver: 'Approver'
};

@Component({
  selector: 'app-gate-assessment-display',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="rows.length > 0" class="gad-root">
      <button type="button" class="gad-toggle" (click)="open = !open">
        {{ open ? '▾' : '▸' }} {{ title }} ({{ currentGroups.length }})
      </button>
      <ng-container *ngIf="open">
        <div *ngFor="let g of currentGroups" class="gad-group">
          <div class="gad-respondent">{{ g.name }} <span class="gad-role">{{ g.role }}</span></div>
          <div *ngFor="let it of g.items" class="gad-item">
            <span class="gad-grade" [class.gad-grade--low]="it.grade === 'C' || it.grade === 'D'">
              {{ it.grade === 'NA' ? 'N/A' : it.grade }}
            </span>
            <span class="gad-text">{{ it.text }}</span>
            <span *ngIf="it.comment" class="gad-comment">— “{{ it.comment }}”</span>
          </div>
        </div>
        <ng-container *ngIf="showPriorAttempts && priorGroups.length > 0">
          <div class="gad-prior-label">Previous attempt</div>
          <div *ngFor="let g of priorGroups" class="gad-group gad-group--prior">
            <div class="gad-respondent">{{ g.name }} <span class="gad-role">{{ g.role }}</span></div>
            <div *ngFor="let it of g.items" class="gad-item">
              <span class="gad-grade">{{ it.grade === 'NA' ? 'N/A' : it.grade }}</span>
              <span class="gad-text">{{ it.text }}</span>
              <span *ngIf="it.comment" class="gad-comment">— “{{ it.comment }}”</span>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </div>
  `,
  styles: [`
    .gad-root { border: 1px solid #DDE5EA; border-radius: 8px; padding: 8px 12px; margin: 8px 0; background: #fff; }
    .gad-toggle { background: none; border: none; cursor: pointer; font: 600 12px Roboto, sans-serif; color: #257099; padding: 0; }
    .gad-group { margin-top: 8px; }
    .gad-group--prior { opacity: 0.65; }
    .gad-respondent { font: 600 12px Roboto, sans-serif; color: #1A1A1A; }
    .gad-role { font: italic 10px Roboto, sans-serif; color: #757575; margin-left: 6px; }
    .gad-item { display: flex; align-items: baseline; gap: 6px; padding: 2px 0 2px 8px; }
    .gad-grade {
      min-width: 24px; text-align: center; border-radius: 999px; padding: 1px 6px;
      background: rgba(37,112,153,0.10); color: #257099; font: 700 10px Roboto, sans-serif;
    }
    .gad-grade--low { background: #FDECEA; color: #B3261E; }
    .gad-text { font: 400 11px/1.35 Roboto, sans-serif; color: #1A1A1A; }
    .gad-comment { font: italic 11px Roboto, sans-serif; color: #5A5A5A; }
    .gad-prior-label { margin-top: 10px; font: 600 10px Roboto, sans-serif; color: #757575; text-transform: uppercase; letter-spacing: 0.05em; }
  `]
})
export class GateAssessmentDisplayComponent {
  @Input() rows: GateAssessmentRow[] = [];
  @Input() title = 'Assessments collected';
  @Input() showPriorAttempts = true;
  /** Collapsed by default (progressive disclosure, spec §7). */
  @Input() open = false;

  private group(rows: GateAssessmentRow[]): RespondentGroup[] {
    const byUser = new Map<string, RespondentGroup>();
    for (const r of rows) {
      const key = r.respondent_user_id + '|' + r.respondent_role;
      if (!byUser.has(key)) {
        byUser.set(key, {
          name: r.respondent_display_name || 'Participant',
          role: ROLE_LABELS[r.respondent_role] ?? r.respondent_role,
          items: []
        });
      }
      byUser.get(key)!.items.push({
        text: ASSESSMENT_ITEM_TEXT[r.item_key] ?? r.item_key,
        grade: r.grade,
        comment: r.comment
      });
    }
    return [...byUser.values()];
  }

  get currentGroups(): RespondentGroup[] {
    const active = this.rows.filter(r => !r.cleared_by_return_at);
    // After a return every row of the attempt is cleared-stamped (D-578) —
    // the attempt stays visible: fall back to all rows when none are active.
    return this.group(active.length > 0 ? active : this.rows);
  }
  get priorGroups(): RespondentGroup[] {
    const active = this.rows.filter(r => !r.cleared_by_return_at);
    return active.length > 0 ? this.group(this.rows.filter(r => !!r.cleared_by_return_at)) : [];
  }
}
