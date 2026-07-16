// easter-egg-leaderboard.component.ts — Admin Easter Egg leaderboard
// Route: /admin/easter-eggs. Admin-only view of how the hunt is going: every
// user, most eggs to least, with a 0-to-10 progress bar. Presentation only.

import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { filter, take, Subscription } from 'rxjs';
import { EasterEggService, EggLeaderboardRow } from '../../../core/services/easter-egg.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { EggIconComponent, EggAssetRef } from '../../easter-eggs/egg-icon.component';

@Component({
  selector: 'app-easter-egg-leaderboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, IonicModule, EggIconComponent],
  template: `
    <div class="el-shell">
      <a routerLink="/admin" class="el-back">← Administration</a>

      <div class="el-head">
        <h3 class="el-title">Easter Egg Leaderboard</h3>
        <p class="el-sub">
          Every user, most eggs found to least. The bar shows progress toward all {{ totalEggs }}.
          A read-only sense of how the hunt is going across the team.
        </p>
      </div>

      <div *ngIf="blockedReason" class="el-blocked">
        <div class="el-blocked-primary">This screen is Admin-only.</div>
        <div class="el-blocked-secondary">{{ blockedReason }}</div>
      </div>

      <ng-container *ngIf="!blockedReason">
        <div *ngIf="loading" class="el-loading">Loading leaderboard…</div>

        <div *ngIf="!loading && rows.length === 0" class="el-empty">No users found.</div>

        <div *ngIf="!loading && rows.length > 0" class="el-list">
          <div class="el-row el-row-head">
            <span>#</span><span>User</span><span>Progress</span><span class="num">Found</span>
          </div>
          <div class="el-row" *ngFor="let r of rows; let i = index">
            <span class="el-rank">{{ i + 1 }}</span>
            <span class="el-name">
              <app-egg-icon *ngIf="r.found_count > 0" [assetRef]="asset(r.last_asset_ref)" [size]="20"></app-egg-icon>
              {{ r.display_name }}
            </span>
            <span class="el-bar-wrap">
              <span class="el-bar" [style.width.%]="pct(r)"
                    [class.el-bar-done]="r.found_count >= totalEggs"></span>
            </span>
            <span class="num el-count">{{ r.found_count }} / {{ totalEggs }}</span>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .el-shell { max-width: 900px; margin: var(--triarq-space-2xl) auto; padding: 0 var(--triarq-space-md); }
    .el-back { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .el-head { margin: 8px 0 16px; }
    .el-title { margin: 0 0 4px; }
    .el-sub { margin: 0; font-size: 11px; font-style: italic; color: #5A5A5A; line-height: 1.6; max-width: 640px; }
    .el-list { display: flex; flex-direction: column; }
    .el-row { display: grid; grid-template-columns: 40px 1.4fr 3fr 90px; gap: var(--triarq-space-sm);
              align-items: center; padding: 8px var(--triarq-space-sm); border-bottom: 1px solid var(--triarq-color-border); }
    .el-row-head { font-size: var(--triarq-text-small); font-weight: 500; color: var(--triarq-color-text-secondary);
                   border-bottom: 2px solid var(--triarq-color-border); }
    .el-rank { color: var(--triarq-color-text-secondary); }
    .el-name { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; }
    .el-bar-wrap { height: 10px; background: var(--triarq-color-fog, #F1EFE8); border-radius: 999px; overflow: hidden; }
    .el-bar { display: block; height: 100%; background: #1D9E75; border-radius: 999px; transition: width .3s; }
    .el-bar-done { background: #257099; }
    .num { text-align: right; }
    .el-count { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); }
    .el-loading, .el-empty { padding: var(--triarq-space-xl); text-align: center; color: var(--triarq-color-text-secondary); }
    .el-blocked { max-width: 560px; padding: var(--triarq-space-md); background: rgba(245,166,35,0.08);
                  border-left: 3px solid var(--triarq-color-sunray, #f5a623); border-radius: 5px; }
    .el-blocked-primary { font-weight: 500; margin-bottom: 4px; }
    .el-blocked-secondary { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); }
  `]
})
export class EasterEggLeaderboardComponent implements OnInit, OnDestroy {
  rows: EggLeaderboardRow[] = [];
  totalEggs = 10;
  loading = false;
  blockedReason = '';
  private subs = new Subscription();

  constructor(
    private readonly eggs: EasterEggService,
    private readonly profile: UserProfileService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(this.profile.profile$.pipe(
      filter((p): p is NonNullable<typeof p> => p !== null), take(1)
    ).subscribe(p => {
      if (p.is_admin !== true) {
        this.blockedReason = 'You need Admin role to view the Easter Egg leaderboard.';
        this.cdr.markForCheck();
        return;
      }
      this.load();
    }));
  }
  ngOnDestroy(): void { this.subs.unsubscribe(); }

  private load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.subs.add(this.eggs.getLeaderboard().subscribe(res => {
      this.rows = res.rows;
      this.totalEggs = res.total_eggs || 10;
      this.loading = false;
      this.cdr.markForCheck();
    }));
  }

  pct(r: EggLeaderboardRow): number { return this.totalEggs ? Math.round((r.found_count / this.totalEggs) * 100) : 0; }
  asset(ref: string | null): EggAssetRef { return (ref as EggAssetRef) || 'egg-01'; }
}
