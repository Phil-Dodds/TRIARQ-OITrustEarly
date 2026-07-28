// gate-conditions-list.component.ts — Pathways OI Trust
// Contract 40 WS3 (D-590): the "Address Gate Conditions" My Actions tab body.
// Distinct from the approvals list (ActionsListComponent) — different columns,
// no Approve/Deny action (CC-40-A: a dedicated component, not a column reconfig
// of the approvals list, since the column set and the action shape diverge
// entirely). Rows route to the initiative detail with the gate sub-panel
// auto-expanded (?gate=, D-345), where the conditions live.
// D-93: presentation only; items are the open_conditions rows from
// list_pending_approvals, filtered upstream by My Actions.

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PendingApprovalItem } from '../../core/types/database';

@Component({
  selector:        'app-gate-conditions-list',
  standalone:      true,
  imports:         [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="loading" class="gcl-loading">Loading…</div>

    <div *ngIf="!loading && items.length === 0" class="gcl-empty">
      No gate conditions need your attention. When an approver sets a condition on a
      gate you own, it appears here until every condition is resolved or withdrawn.
    </div>

    <table *ngIf="!loading && items.length > 0" class="gcl-table">
      <thead>
        <tr>
          <th>Initiative</th>
          <th>Gate</th>
          <th class="gcl-num"># open conditions</th>
          <th class="gcl-num">Days waiting</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let item of items" class="gcl-row">
          <td>
            <a class="gcl-init-link"
               [routerLink]="['/initiatives', item.delivery_cycle_id]"
               [queryParams]="{ gate: item.gate_name, returnTo: returnTo }">{{ item.cycle_title }}</a>
            <span *ngIf="item.division_display_name_short" class="gcl-div">{{ item.division_display_name_short }}</span>
          </td>
          <td>
            <a class="gcl-gate-link"
               [routerLink]="['/initiatives', item.delivery_cycle_id]"
               [queryParams]="{ gate: item.gate_name, returnTo: returnTo }">{{ item.gate_name_display }}</a>
          </td>
          <td class="gcl-num">
            <span class="gcl-cond-pill">{{ item.open_condition_count ?? 0 }}</span>
          </td>
          <td class="gcl-num">{{ item.days_waiting ?? 0 }}d</td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [`
    .gcl-loading, .gcl-empty { padding: 16px; font: 400 13px Roboto, sans-serif; color: #5A5A5A; }
    .gcl-empty { font-style: italic; }
    .gcl-table { width: 100%; border-collapse: collapse; font-family: Roboto, sans-serif; }
    .gcl-table th { text-align: left; font: 600 11px Roboto; letter-spacing: 0.04em; text-transform: uppercase;
                    color: #5A5A5A; padding: 8px 12px; border-bottom: 2px solid var(--triarq-color-border, #e0e0e0); }
    .gcl-table th.gcl-num, .gcl-table td.gcl-num { text-align: right; }
    .gcl-row td { padding: 10px 12px; border-bottom: 1px solid var(--triarq-color-border, #eee);
                  font-size: 14px; color: #1E1E1E; vertical-align: top; }
    .gcl-init-link, .gcl-gate-link { color: var(--triarq-color-primary, #257099); text-decoration: none; font-weight: 600; }
    .gcl-init-link:hover, .gcl-gate-link:hover { text-decoration: underline; }
    .gcl-div { display: block; font-size: 11px; font-style: italic; color: #5A5A5A; margin-top: 2px; }
    /* Amber pill — an open condition is a live obligation (D-548 amber-means-attend). */
    .gcl-cond-pill { display: inline-block; min-width: 20px; padding: 2px 8px; border-radius: 999px;
                     background: #FFF8E1; color: #B26A00; border: 1px solid #F2A620; font: 700 12px Roboto; }
  `]
})
export class GateConditionsListComponent {
  @Input() items: PendingApprovalItem[] = [];
  @Input() loading = false;
  @Input() returnTo = 'actions';
}
