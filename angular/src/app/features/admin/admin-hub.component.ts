// admin-hub.component.ts — AdminHubComponent
// Route: /admin
// D-164: Admin hub consolidates all administrative functions in one place.
// D-163: This is the single declared entry point for all admin functions.
// Principle 3 (Visible Context): each card states what, why, and how.
// Rule 2: Presentation only — no business logic.

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface AdminCard {
  title:       string;
  description: string;
  who:         string;
  route:       string;
  icon:        string;
}

const ADMIN_CARDS: AdminCard[] = [
  {
    title:       'Users',
    description: 'View all user accounts, system roles, and active status. Assign roles and manage user access. A user without a Division assignment sees an onboarding message until assigned.',
    who:         'Phil and Admin',
    route:       'users',
    icon:        '◎'
  },
  {
    title:       'Divisions',
    description: 'View and manage the Division hierarchy. Divisions scope which users can see which Initiatives, artifacts, and library content. Changes here affect access across the entire system.',
    who:         'Phil and Admin',
    route:       'divisions',
    icon:        '◫'
  },
  {
    title:       'Delivery Workstreams',
    description: 'Create and manage Workstreams — the persistent delivery teams that Initiatives are assigned to. Activating or deactivating a Workstream directly controls whether its Initiatives can clear gates.',
    who:         'Phil and Admin',
    route:       'workstreams',
    icon:        '⬡'
  },
  // Contract 20 (D-401): fourth admin card — EPO WIP Limits.
  {
    title:       'EPO WIP Limits',
    description: 'Configure WIP zone limits for each EPO across Pre-Build, Build, and Post-Deploy. Defaults are 3 per zone. Lower limits enforce tighter focus; higher limits open capacity. Changes take effect on the next gate approval.',
    who:         'Phil and Admin',
    route:       'epo-wip',
    icon:        '◐'
  },
  // Contract 24 (D-437): fifth admin card — Artifact Type management.
  {
    title:       'Artifact Types',
    description: 'Manage suggested artifact types by stage and gate. The system uses these to suggest the right document when an Initiative submits a gate. Deactivating a type hides it from new attachments while leaving historical attachments in place.',
    who:         'Phil and Admin',
    route:       'artifact-types',
    icon:        '⬢'
  }
];

@Component({
  selector: 'app-admin-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="max-width:900px;margin:var(--triarq-space-2xl) auto;padding:0 var(--triarq-space-md);">

      <!-- Page header -->
      <div style="margin-bottom:var(--triarq-space-xl);">
        <h3 style="margin:0 0 6px 0;">Administration</h3>
        <!-- S-015 surface description: 11px italic #5A5A5A. Contract 17 CC-018. -->
        <p style="margin:0;font-size:11px;font-style:italic;color:#5A5A5A;max-width:560px;">
          System configuration and governance management. Changes made here affect
          access, workflow, and data visibility across all Divisions.
          Proceed deliberately — most actions are not reversible without admin intervention.
        </p>
      </div>

      <!-- Admin function card grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--triarq-space-md);">
        <a *ngFor="let card of cards"
           [routerLink]="card.route"
           style="display:block;text-decoration:none;color:inherit;">
          <div class="oi-card"
               style="height:100%;box-sizing:border-box;transition:box-shadow 0.15s;cursor:pointer;"
               (mouseenter)="$any($event.currentTarget).style.boxShadow='0 2px 12px rgba(37,112,153,0.12)'"
               (mouseleave)="$any($event.currentTarget).style.boxShadow=''">
            <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);
                        margin-bottom:var(--triarq-space-sm);">
              <span style="font-size:24px;line-height:1;color:var(--triarq-color-primary);">
                {{ card.icon }}
              </span>
              <span style="font-weight:600;font-size:var(--triarq-text-body);
                           color:var(--triarq-color-text-primary);">
                {{ card.title }}
              </span>
            </div>
            <p style="margin:0 0 var(--triarq-space-sm) 0;
                      font-size:var(--triarq-text-small);
                      color:var(--triarq-color-text-secondary);
                      line-height:1.5;">
              {{ card.description }}
            </p>
            <div style="font-size:var(--triarq-text-small);
                        color:var(--triarq-color-primary);
                        display:flex;align-items:center;gap:4px;">
              <span>Open {{ card.title }}</span>
              <span>→</span>
            </div>
          </div>
        </a>
      </div>
    </div>
  `
})
export class AdminHubComponent {
  readonly cards = ADMIN_CARDS;
}
