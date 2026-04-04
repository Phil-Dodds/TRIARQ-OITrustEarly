// loading-overlay.component.ts — Pathways OI Trust
// Tier 3 processing state overlay (D-178).
//
// Covers its parent element with a semi-transparent overlay + spinner
// while a CRUD operation is in progress.
//
// Usage:
//   Parent element must have position:relative.
//   <div style="position:relative;">
//     <app-loading-overlay [visible]="creating" message="Creating Workstream…"></app-loading-overlay>
//     <!-- form content -->
//   </div>
//
// D-178: sidebar is never locked — overlay covers only its positioned parent.

import {
  Component,
  Input,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule }  from '@ionic/angular';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonicModule],
  template: `
    <div *ngIf="visible"
         style="position:absolute;
                inset:0;
                background:rgba(255,255,255,0.82);
                z-index:20;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                border-radius:10px;">
      <ion-spinner name="crescent"
                   style="color:var(--triarq-color-primary);
                          width:32px;height:32px;">
      </ion-spinner>
      <div *ngIf="message"
           style="margin-top:var(--triarq-space-sm);
                  font-size:var(--triarq-text-small);
                  color:var(--triarq-color-text-secondary);
                  text-align:center;">
        {{ message }}
      </div>
    </div>
  `
})
export class LoadingOverlayComponent {
  /** Show or hide the overlay. Controlled by parent CRUD state flag. */
  @Input() visible = false;

  /**
   * One-line label shown below the spinner.
   * Use active-voice present tense: "Creating Workstream…", "Saving changes…"
   * D-178: operation label communicates what the system is doing.
   */
  @Input() message = '';
}
