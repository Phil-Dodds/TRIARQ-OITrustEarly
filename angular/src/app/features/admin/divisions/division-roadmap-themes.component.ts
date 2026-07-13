// division-roadmap-themes.component.ts — Pathways OI Trust
// D-487: Roadmap Themes section on the Division admin panel (extracted child
// component per S-030/D-252, same pattern as app-division-initiative-cycle).
// Add / rename / reorder / deactivate the Division's theme vocabulary.
// Deactivate-only when referenced (D-437) — deactivated themes stay on tagged
// initiatives and keep displaying; they leave pickers and new tagging.
//
// CC: D-487 grants management to "Division Leader (own Division)" — the MCP
// enforces Admin-only for now (divisions.owner_user_id exists but carries no
// permission semantics in delivery-cycle-mcp). Flagged to Design.

import {
  Component, Input, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { DeliveryService } from '../../../core/services/delivery.service';
import { RoadmapTheme }    from '../../../core/types/database';

@Component({
  selector:        'app-division-roadmap-themes',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <p class="rt-hint">
      Division-scoped vocabulary for grouping initiatives on the roadmap.
      Themes appear as a prefix on initiative names and as a filter on the
      initiative grids. Deactivating hides a Theme from pickers — initiatives
      already tagged keep it.
    </p>

    <div *ngIf="error" class="rt-error">{{ error }}</div>

    <div *ngFor="let t of themes; let i = index" class="rt-row" [class.rt-inactive]="!t.active">
      <ng-container *ngIf="editingId !== t.id">
        <span class="rt-name">{{ t.name }}</span>
        <span *ngIf="!t.active" class="rt-inactive-chip">Inactive</span>
        <span class="rt-actions">
          <ng-container *ngIf="t.active">
            <button class="rt-icon-btn" type="button" title="Rename" [disabled]="busy" (click)="startEdit(t)">✎</button>
            <button class="rt-icon-btn" type="button" title="Move up" [disabled]="busy || i === 0" (click)="move(i, -1)">↑</button>
            <button class="rt-icon-btn" type="button" title="Move down" [disabled]="busy || i === lastActiveIndex" (click)="move(i, 1)">↓</button>
            <button *ngIf="confirmDeactivateId !== t.id" class="rt-icon-btn rt-danger" type="button"
                    title="Deactivate" [disabled]="busy" (click)="confirmDeactivateId = t.id">×</button>
            <span *ngIf="confirmDeactivateId === t.id" class="rt-confirm">
              Deactivate "{{ t.name }}"?
              <button class="rt-confirm-btn" type="button" (click)="deactivate(t)">Yes</button>
              <button class="rt-cancel-btn" type="button" (click)="confirmDeactivateId = null">Cancel</button>
            </span>
          </ng-container>
        </span>
      </ng-container>
      <ng-container *ngIf="editingId === t.id">
        <input class="rt-input" [(ngModel)]="editName" (keydown.enter)="saveEdit(t)" (keydown.escape)="editingId = null">
        <span class="rt-actions">
          <button class="rt-mini-primary" type="button" [disabled]="busy || !editName.trim()" (click)="saveEdit(t)">
            {{ busy ? 'Saving…' : 'Save' }}
          </button>
          <button class="rt-cancel-btn" type="button" (click)="editingId = null">Cancel</button>
        </span>
      </ng-container>
    </div>
    <div *ngIf="themes.length === 0 && !loading" class="rt-empty">No Themes yet.</div>

    <div class="rt-add">
      <input class="rt-input" [(ngModel)]="newName" placeholder="New Theme name…"
             (keydown.enter)="add()">
      <button class="rt-mini-primary" type="button" [disabled]="busy || !newName.trim()" (click)="add()">
        {{ busy ? 'Saving…' : '+ Add Theme' }}
      </button>
    </div>
  `,
  styles: [`
    .rt-hint { font: italic 11px/1.5 Roboto, sans-serif; color: #757575; margin: 0 0 8px; }
    .rt-error { padding: 6px 10px; background: #FFF3F3; border-left: 3px solid #D32F2F; font-size: 12px; border-radius: 4px; margin-bottom: 8px; }
    .rt-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid #F5F5F5; }
    .rt-inactive { opacity: 0.55; }
    .rt-name { font: 13px Roboto, sans-serif; color: #1A1A1A; flex: 1; min-width: 0; }
    .rt-inactive-chip { background: #F0F0F0; color: #757575; border-radius: 999px; padding: 1px 8px; font: 500 10px Roboto, sans-serif; }
    .rt-actions { display: flex; align-items: center; gap: 4px; margin-left: auto; flex-shrink: 0; }
    .rt-icon-btn { background: none; border: none; color: #757575; cursor: pointer; font-size: 13px; padding: 2px 5px; }
    .rt-icon-btn:disabled { opacity: 0.3; cursor: default; }
    .rt-icon-btn.rt-danger { color: #D32F2F; }
    .rt-confirm { display: flex; align-items: center; gap: 6px; font: 11px Roboto, sans-serif; color: #D32F2F; white-space: nowrap; }
    .rt-confirm-btn { background: #D32F2F; color: #fff; border: none; border-radius: 3px; padding: 2px 8px; font: 500 11px Roboto, sans-serif; cursor: pointer; }
    .rt-cancel-btn { background: none; border: none; color: #757575; cursor: pointer; font-size: 11px; }
    .rt-input { flex: 1; border: 1px solid #BDBDBD; border-radius: 5px; padding: 6px 10px; font: 13px Roboto, sans-serif; outline: none; min-width: 0; }
    .rt-input:focus { border-color: var(--triarq-color-primary, #257099); }
    .rt-mini-primary { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 5px; padding: 5px 12px; font: 500 12px Roboto, sans-serif; cursor: pointer; white-space: nowrap; }
    .rt-mini-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .rt-add { display: flex; gap: 8px; margin-top: 8px; }
    .rt-empty { font: italic 12px Roboto, sans-serif; color: #9E9E9E; padding: 6px 0; }
  `]
})
export class DivisionRoadmapThemesComponent implements OnChanges {
  @Input({ required: true }) divisionId!: string;

  themes: RoadmapTheme[] = [];
  loading = false;
  error   = '';
  busy    = false;

  newName   = '';
  editingId: string | null = null;
  editName  = '';
  confirmDeactivateId: string | null = null;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['divisionId'] && this.divisionId) this.load();
  }

  get lastActiveIndex(): number {
    for (let i = this.themes.length - 1; i >= 0; i--) {
      if (this.themes[i].active) return i;
    }
    return -1;
  }

  load(): void {
    this.loading = true;
    this.error   = '';
    this.cdr.markForCheck();
    this.delivery.listRoadmapThemes(this.divisionId, true).subscribe({
      next: res => {
        this.loading = false;
        if (res.success) {
          // Active first (sort_order), inactive trail.
          const data = res.data ?? [];
          this.themes = [
            ...data.filter(t => t.active),
            ...data.filter(t => !t.active)
          ];
        } else {
          this.error = res.error ?? 'Failed to load Themes.';
        }
        this.cdr.markForCheck();
      },
      error: err => { this.loading = false; this.error = err?.error ?? 'Failed to load Themes.'; this.cdr.markForCheck(); }
    });
  }

  add(): void {
    const name = this.newName.trim();
    if (!name || this.busy) return;
    this.busy = true;
    this.cdr.markForCheck();
    this.delivery.createRoadmapTheme(this.divisionId, name).subscribe({
      next: res => {
        this.busy = false;
        if (res.success) { this.newName = ''; this.load(); }
        else { this.error = res.error ?? 'Failed to add Theme.'; }
        this.cdr.markForCheck();
      },
      error: err => { this.busy = false; this.error = err?.error ?? 'Failed to add Theme.'; this.cdr.markForCheck(); }
    });
  }

  startEdit(t: RoadmapTheme): void {
    this.editingId = t.id;
    this.editName  = t.name;
    this.error     = '';
    this.cdr.markForCheck();
  }

  saveEdit(t: RoadmapTheme): void {
    const name = this.editName.trim();
    if (!name || this.busy) return;
    this.busy = true;
    this.cdr.markForCheck();
    this.delivery.updateRoadmapTheme(t.id, { name }).subscribe({
      next: res => {
        this.busy = false;
        if (res.success) { this.editingId = null; this.load(); }
        else { this.error = res.error ?? 'Failed to rename Theme.'; }
        this.cdr.markForCheck();
      },
      error: err => { this.busy = false; this.error = err?.error ?? 'Failed to rename Theme.'; this.cdr.markForCheck(); }
    });
  }

  move(index: number, dir: -1 | 1): void {
    if (this.busy) return;
    const target = index + dir;
    if (target < 0 || target > this.lastActiveIndex) return;
    const arr = [...this.themes];
    [arr[index], arr[target]] = [arr[target], arr[index]];
    this.themes = arr;
    this.busy = true;
    this.cdr.markForCheck();
    // Persist new sort_order for both swapped rows (1-based over active set).
    const updates = arr
      .filter(t => t.active)
      .map((t, i) => ({ id: t.id, sort_order: i + 1 }));
    let remaining = updates.length;
    updates.forEach(u => {
      this.delivery.updateRoadmapTheme(u.id, { sort_order: u.sort_order }).subscribe({
        next: () => { if (--remaining === 0) { this.busy = false; this.cdr.markForCheck(); } },
        error: () => { if (--remaining === 0) { this.busy = false; this.load(); } }
      });
    });
  }

  deactivate(t: RoadmapTheme): void {
    if (this.busy) return;
    this.confirmDeactivateId = null;
    this.busy = true;
    this.cdr.markForCheck();
    this.delivery.deactivateRoadmapTheme(t.id).subscribe({
      next: res => {
        this.busy = false;
        if (res.success) this.load();
        else { this.error = res.error ?? 'Failed to deactivate Theme.'; }
        this.cdr.markForCheck();
      },
      error: err => { this.busy = false; this.error = err?.error ?? 'Failed to deactivate Theme.'; this.cdr.markForCheck(); }
    });
  }
}
