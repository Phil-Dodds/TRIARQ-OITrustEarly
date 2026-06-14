// about-panel.component.ts — Pathways OI Trust
// About Panel with Build History (D-426).
// Right-panel overlay reached from the sidebar footer "About" link.
// Renders the CHANGELOG typed constant — see src/app/core/data/changelog.ts.
// S-035 maintenance: every CodeClose touching user-facing surfaces prepends
// one entry to that constant.
//
// Built from the registry one-liner + S-035 spec — Section H instruction
// for D-426 was not in the Validator close zip. Open for adjustment when
// the full spec arrives.

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { CHANGELOG, ChangelogEntry } from '../../../core/data/changelog';

@Component({
  selector:        'app-about-panel',
  standalone:      true,
  imports:         [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="show"
         class="ab-scrim"
         (click)="close.emit()"
         (keydown.escape)="close.emit()">
      <aside class="ab-panel"
             (click)="$event.stopPropagation()"
             role="dialog"
             aria-label="About Pathways">

        <header class="ab-head">
          <strong>About Pathways OI Trust</strong>
          <button class="ab-close"
                  type="button"
                  (click)="close.emit()"
                  aria-label="Close">✕</button>
        </header>

        <div class="ab-body">
          <p class="ab-sub">
            Recent build history. Most recent at the top. Each line maps to a
            change you may notice in the app.
          </p>

          <div *ngFor="let entry of entries; trackBy: trackByEntry"
               class="ab-entry">
            <div class="ab-entry-head">
              <span class="ab-entry-label">{{ entry.contractLabel }}</span>
              <span class="ab-entry-date">
                {{ entry.date }}
                <ng-container *ngIf="entry.builtAt"> · {{ entry.builtAt }}</ng-container>
              </span>
            </div>
            <ul class="ab-items">
              <li *ngFor="let item of entry.items">
                <span *ngIf="item.audience"
                      class="ab-aud"
                      [class.aud-admin]="item.audience === 'Admin'"
                      [class.aud-trio]="item.audience === 'Trio'"
                      [class.aud-all]="item.audience === 'All'">
                  {{ item.audience }}
                </span>
                <span class="ab-surface">{{ item.surface }}:</span>
                <span class="ab-desc">{{ item.description }}</span>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .ab-scrim {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.35);
      z-index: 9000;
      display: flex; justify-content: flex-end;
    }
    .ab-panel {
      width: min(520px, 92vw); height: 100vh;
      background: #fff;
      box-shadow: -4px 0 16px rgba(0,0,0,0.2);
      display: flex; flex-direction: column;
    }
    .ab-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px;
      background: #12274A; color: #fff;
    }
    .ab-close {
      background: none; border: none; color: #fff;
      font-size: 18px; cursor: pointer; padding: 0 4px;
    }
    .ab-body { flex: 1 1 auto; overflow-y: auto; padding: 16px 20px; }
    .ab-sub {
      font-size: 11px; font-style: italic; color: #5A5A5A;
      margin: 0 0 16px 0; line-height: 1.5;
    }
    .ab-entry { margin-bottom: 18px; }
    .ab-entry-head {
      display: flex; align-items: baseline; justify-content: space-between;
      margin-bottom: 6px; gap: 10px;
    }
    .ab-entry-label { font-weight: 600; font-size: 13px; }
    .ab-entry-date { font-size: 11px; color: #5A5A5A; white-space: nowrap; }
    .ab-items { list-style: none; padding: 0; margin: 0; font-size: 12px; }
    .ab-items li {
      padding: 6px 0; line-height: 1.55;
      border-bottom: 1px dotted rgba(0,0,0,0.08);
    }
    .ab-items li:last-child { border-bottom: 0; }
    .ab-aud {
      display: inline-block; padding: 1px 7px;
      border-radius: 999px;
      font-size: 10px; font-weight: 600;
      margin-right: 6px; vertical-align: middle;
    }
    .aud-admin { background: rgba(233,97,39,0.15);  color: #B6471D; }
    .aud-trio  { background: rgba(37,112,153,0.15); color: #1B5474; }
    .aud-all   { background: rgba(120,130,140,0.15); color: #444;   }
    .ab-surface { font-weight: 500; margin-right: 4px; }
  `]
})
export class AboutPanelComponent {
  @Input()  show = false;
  @Output() close = new EventEmitter<void>();

  readonly entries: readonly ChangelogEntry[] = CHANGELOG;

  trackByEntry = (_i: number, e: ChangelogEntry): string =>
    `${e.date}|${e.contractLabel}`;
}
