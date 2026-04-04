// contact-admin.component.ts — Pathways OI Trust
// Route: /contact-admin
// Roles: all
// Shows all active Admins (system_role = 'admin' or 'phil') with name and
// clickable email address. Available to every authenticated user so anyone
// can reach someone with system access.
// D-93: data via UserProfileService → division-mcp list_users. No direct DB.
// D-140: clear load error with actionable message.
// D-178: Tier 1 skeleton while loading.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule }          from '@angular/common';
import { RouterModule }          from '@angular/router';
import { IonicModule }           from '@ionic/angular';
import { UserProfileService }    from '../../core/services/user-profile.service';
import { User }                  from '../../core/types/database';

@Component({
  selector: 'app-contact-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, IonicModule],
  template: `
    <div style="max-width:640px;margin:var(--triarq-space-2xl) auto;
                padding:0 var(--triarq-space-md);">

      <!-- Header -->
      <h2 style="font-size:var(--triarq-text-h3,24px);font-weight:600;
                 margin:0 0 var(--triarq-space-xs) 0;color:var(--triarq-color-text-primary);">
        Contact an Admin
      </h2>
      <p style="margin:0 0 var(--triarq-space-lg) 0;font-size:var(--triarq-text-small);
                color:var(--triarq-color-text-secondary);">
        The following Admins have full system access and can help with access requests,
        account issues, or any question about Pathways OI Trust.
        Click an email address to send a message directly.
      </p>

      <!-- D-178 Tier 1: skeleton while loading -->
      <div *ngIf="loading" class="oi-card">
        <div *ngFor="let _ of [1,2,3]"
             style="display:grid;grid-template-columns:1fr 2fr;gap:var(--triarq-space-sm);
                    padding:var(--triarq-space-sm) 0;
                    border-bottom:1px solid var(--triarq-color-border);">
          <ion-skeleton-text animated style="height:15px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:15px;border-radius:4px;"></ion-skeleton-text>
        </div>
      </div>

      <!-- D-140: load error -->
      <div *ngIf="!loading && loadError" class="oi-card">
        <div style="color:var(--triarq-color-error);font-weight:500;margin-bottom:6px;">
          {{ loadError }}
        </div>
        <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
          Try refreshing the page. If the problem persists, contact your IT team directly.
        </div>
      </div>

      <!-- Admin list -->
      <div *ngIf="!loading && !loadError" class="oi-card" style="padding:0;">

        <div *ngIf="admins.length === 0"
             style="padding:var(--triarq-space-lg);font-size:var(--triarq-text-small);
                    color:var(--triarq-color-text-secondary);">
          No Admins are currently configured. Contact your IT team directly.
        </div>

        <div *ngFor="let admin of admins; let last = last"
             style="display:grid;grid-template-columns:1fr 2fr;gap:var(--triarq-space-md);
                    align-items:center;padding:var(--triarq-space-md) var(--triarq-space-lg);"
             [style.border-bottom]="last ? 'none' : '1px solid var(--triarq-color-border)'">

          <!-- Name + role badge -->
          <div>
            <div style="font-weight:500;color:var(--triarq-color-text-primary);
                        margin-bottom:3px;">
              {{ admin.display_name }}
            </div>
            <span class="oi-pill"
                  [style.background]="admin.system_role === 'phil'
                    ? 'var(--triarq-color-primary)'
                    : 'var(--triarq-color-background-subtle)'"
                  [style.color]="admin.system_role === 'phil'
                    ? '#fff'
                    : 'var(--triarq-color-text-secondary)'"
                  style="font-size:10px;">
              {{ admin.system_role === 'phil' ? 'System Owner' : 'Admin' }}
            </span>
          </div>

          <!-- Clickable email -->
          <div>
            <a *ngIf="admin.email"
               [href]="'mailto:' + admin.email"
               style="color:var(--triarq-color-primary);font-size:var(--triarq-text-small);
                      text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
              <span style="font-size:14px;">✉</span>
              {{ admin.email }}
            </a>
            <span *ngIf="!admin.email"
                  style="font-size:var(--triarq-text-small);
                         color:var(--triarq-color-text-secondary);font-style:italic;">
              No email on record
            </span>
          </div>
        </div>
      </div>

      <!-- Back link -->
      <div style="margin-top:var(--triarq-space-lg);">
        <a routerLink="/home"
           style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                  text-decoration:none;">
          ← Back to Home
        </a>
      </div>

    </div>
  `
})
export class ContactAdminComponent implements OnInit {
  admins:    User[] = [];
  loading    = true;
  loadError  = '';

  constructor(
    private readonly profileService: UserProfileService,
    private readonly cdr:            ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.profileService.listAdmins().subscribe({
      next: (admins) => {
        this.admins   = admins;
        this.loading  = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadError = 'Could not load the Admin list.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }
}
