// role-switch.component.ts — shared EPO | DOL | DCS segmented control
// (CC-38-45). Used by Next Gates and Deploy by Quarter; presentation only —
// the host persists the choice per its own screen key.

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonRole, PERSON_ROLES, ROLE_FIELDS } from '../role-grouping.utils';

@Component({
  selector: 'app-role-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="rsw" role="tablist" aria-label="Group by role">
      <button *ngFor="let r of roles" type="button" role="tab"
              class="rsw-btn"
              [class.rsw-active]="role === r"
              [attr.aria-selected]="role === r"
              (click)="pick(r)">
        {{ label(r) }}
      </button>
    </div>
  `,
  styles: [`
    .rsw { display: inline-flex; border: 1px solid var(--triarq-color-primary, #257099); border-radius: 6px; overflow: hidden; }
    .rsw-btn { background: #fff; border: none; padding: 6px 18px; font-size: 13px; font-weight: 500; color: var(--triarq-color-primary, #257099); cursor: pointer; }
    .rsw-btn + .rsw-btn { border-left: 1px solid var(--triarq-color-primary, #257099); }
    .rsw-active { background: var(--triarq-color-primary, #257099); color: #fff; }
  `]
})
export class RoleSwitchComponent {
  @Input()  role: PersonRole = 'epo';
  @Output() roleChange = new EventEmitter<PersonRole>();

  readonly roles = PERSON_ROLES;

  label(r: PersonRole): string { return ROLE_FIELDS[r].label; }

  pick(r: PersonRole): void {
    if (r !== this.role) { this.roleChange.emit(r); }
  }
}
