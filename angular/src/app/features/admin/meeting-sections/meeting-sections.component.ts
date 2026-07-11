// meeting-sections.component.ts — Pathways OI Trust
// Admin screen: shared Team Meeting section list (Tracks Phase A).
// Series leaders pick from this catalog when configuring a series.
// Route: /admin/meeting-sections — Admin-only (enforced by MCP).

import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }        from '@angular/common';
import { RouterModule }        from '@angular/router';
import { FormsModule }         from '@angular/forms';
import { TeamMeetingsService } from '../../team-meetings/team-meetings.service';
import { CatalogSection }      from '../../../core/types/team-meetings';

@Component({
  selector:        'app-meeting-sections',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="ms-shell">
      <a routerLink="/admin" class="ms-back">← Admin</a>
      <h1 class="ms-title">Meeting Sections</h1>
      <p class="ms-subtitle">Shared section list for Team Meeting series. Series leaders pick from this list; removing a section here does not change series already using it.</p>

      <div *ngIf="loadError" class="ms-error">{{ loadError }}</div>

      <div class="ms-list">
        <div *ngFor="let s of sections" class="ms-row">
          <span class="ms-bar" [style.background]="s.bar_color"></span>
          <ng-container *ngIf="editingId !== s.id">
            <span class="ms-row-title">{{ s.title }}</span>
            <span class="ms-row-sub">{{ s.sub_label }}</span>
            <span class="ms-actions">
              <button class="ms-mini-btn" type="button" (click)="startEdit(s)">Edit</button>
              <button class="ms-mini-btn ms-danger" type="button" (click)="remove(s)">Remove</button>
            </span>
          </ng-container>
          <ng-container *ngIf="editingId === s.id">
            <span class="ms-edit-fields">
              <input class="ms-input" [(ngModel)]="editTitle" placeholder="Section title">
              <input class="ms-input" [(ngModel)]="editSub" placeholder="Sub-label (optional)">
              <input class="ms-color" type="color" [(ngModel)]="editColor" title="Bar color">
            </span>
            <span class="ms-actions">
              <button class="ms-mini-primary" type="button" [disabled]="!editTitle.trim()" (click)="saveEdit(s)">Save</button>
              <button class="ms-mini-btn" type="button" (click)="editingId = null">Cancel</button>
            </span>
          </ng-container>
        </div>
      </div>

      <div class="ms-add">
        <input class="ms-input" [(ngModel)]="newTitle" placeholder="New section title…">
        <input class="ms-input" [(ngModel)]="newSub" placeholder="Sub-label (optional)">
        <input class="ms-color" type="color" [(ngModel)]="newColor" title="Bar color">
        <button class="ms-mini-primary" type="button" [disabled]="!newTitle.trim() || saving" (click)="add()">
          {{ saving ? 'Adding…' : '+ Add Section' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .ms-shell { padding: 24px 32px; max-width: 900px; }
    .ms-back { font: 13px Roboto, sans-serif; color: var(--triarq-color-primary, #257099); text-decoration: none; }
    .ms-title { font: 600 22px/1.2 Roboto, sans-serif; margin: 6px 0 4px; color: #1A1A1A; }
    .ms-subtitle { font: italic 11px/1.4 Roboto, sans-serif; color: #5A5A5A; margin: 0 0 20px; }
    .ms-error { margin-bottom: 12px; padding: 8px 12px; background: #FFF3F3; border-left: 3px solid #D32F2F; font-size: 13px; border-radius: 4px; }
    .ms-row { display: flex; align-items: center; gap: 10px; padding: 8px 4px; border-bottom: 1px solid #F5F5F5; }
    .ms-bar { width: 5px; height: 24px; border-radius: 3px; flex-shrink: 0; }
    .ms-row-title { font: 500 14px Roboto, sans-serif; color: #1A1A1A; min-width: 240px; }
    .ms-row-sub { font: italic 12px Roboto, sans-serif; color: #757575; flex: 1; }
    .ms-actions { display: flex; gap: 6px; margin-left: auto; flex-shrink: 0; }
    .ms-edit-fields { display: flex; gap: 8px; flex: 1; align-items: center; }
    .ms-input { border: 1px solid #BDBDBD; border-radius: 5px; padding: 6px 10px; font: 13px Roboto, sans-serif; outline: none; flex: 1; }
    .ms-input:focus { border-color: var(--triarq-color-primary, #257099); }
    .ms-color { width: 36px; height: 30px; border: 1px solid #BDBDBD; border-radius: 5px; padding: 1px; cursor: pointer; flex-shrink: 0; }
    .ms-mini-btn { background: none; border: 1px solid #BDBDBD; border-radius: 5px; color: #5A5A5A; padding: 3px 10px; font: 500 11px Roboto, sans-serif; cursor: pointer; }
    .ms-mini-btn.ms-danger { border-color: #D32F2F; color: #D32F2F; }
    .ms-mini-primary { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 5px; padding: 6px 14px; font: 500 12px Roboto, sans-serif; cursor: pointer; white-space: nowrap; }
    .ms-mini-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .ms-add { display: flex; gap: 8px; margin-top: 16px; align-items: center; }
  `]
})
export class MeetingSectionsComponent implements OnInit {
  sections: CatalogSection[] = [];
  loadError = '';
  saving    = false;

  newTitle = '';
  newSub   = '';
  newColor = '#5A5A5A';

  editingId: string | null = null;
  editTitle = '';
  editSub   = '';
  editColor = '#5A5A5A';

  constructor(
    private readonly svc: TeamMeetingsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.svc.listSectionCatalog().subscribe({
      next: res => {
        if (res.success) this.sections = res.data ?? [];
        else this.loadError = res.error ?? 'Failed to load sections.';
        this.cdr.markForCheck();
      },
      error: err => { this.loadError = err?.error ?? 'Unable to load sections.'; this.cdr.markForCheck(); }
    });
  }

  add(): void {
    if (!this.newTitle.trim() || this.saving) return;
    this.saving = true;
    this.svc.saveCatalogSection({ title: this.newTitle, sub_label: this.newSub, bar_color: this.newColor }).subscribe({
      next: res => {
        this.saving = false;
        if (res.success) {
          this.newTitle = ''; this.newSub = ''; this.newColor = '#5A5A5A';
          this.load();
        } else {
          this.loadError = res.error ?? 'Failed to add section.';
          this.cdr.markForCheck();
        }
      },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }

  startEdit(s: CatalogSection): void {
    this.editingId = s.id;
    this.editTitle = s.title;
    this.editSub   = s.sub_label;
    this.editColor = s.bar_color;
    this.cdr.markForCheck();
  }

  saveEdit(s: CatalogSection): void {
    if (!this.editTitle.trim()) return;
    this.svc.saveCatalogSection({ id: s.id, title: this.editTitle, sub_label: this.editSub, bar_color: this.editColor }).subscribe({
      next: res => {
        if (res.success) { this.editingId = null; this.load(); }
        else { this.loadError = res.error ?? 'Failed to save.'; this.cdr.markForCheck(); }
      }
    });
  }

  remove(s: CatalogSection): void {
    this.svc.deleteCatalogSection(s.id).subscribe({
      next: res => { if (res.success) this.load(); }
    });
  }
}
