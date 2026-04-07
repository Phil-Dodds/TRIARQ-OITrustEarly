// deploy-schedule.component.ts — DeployScheduleComponent
// Route: /delivery/deploy-schedule
// Block 5 (Session 2) — full implementation: cycles by Go-to-Deploy quarter per workstream.
// This shell component holds the route until Session 2 builds the full view.

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector:        'app-deploy-schedule',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule],
  template: `
    <div style="max-width:900px;margin:var(--triarq-space-2xl, 48px) auto;
                padding:0 var(--triarq-space-md, 16px);">
      <div style="margin-bottom:var(--triarq-space-md, 16px);">
        <h3 style="margin:0 0 4px 0;">Deploy Gate by Quarter</h3>
        <p style="margin:0;font-size:var(--triarq-text-small, 14px);
                  color:var(--triarq-color-text-secondary, #5A5A5A);">
          Cycles organized by Go to Deploy quarter per workstream.
        </p>
      </div>
      <div style="padding:var(--triarq-space-xl, 32px);
                  border:1px solid var(--triarq-color-border, #E0E0E0);
                  border-radius:10px;text-align:center;
                  color:var(--triarq-color-text-secondary, #5A5A5A);
                  font-size:var(--triarq-text-small, 14px);">
        This view is being built — available in the next session.
      </div>
    </div>
  `
})
export class DeployScheduleComponent {}
