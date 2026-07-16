// egg-celebration-overlay.component.ts — Easter Egg Hunt (spec §8, §13)
// Mounted once at the app shell. When the caller finds their tenth egg (on ANY
// screen), it shows a celebratory modal over the app. User-dismissed.

import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { EasterEggService } from '../../core/services/easter-egg.service';
import { UserProfileService } from '../../core/services/user-profile.service';
import { EggCelebrationComponent } from './egg-celebration.component';

@Component({
  selector: 'app-egg-celebration-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EggCelebrationComponent],
  template: `
    <div *ngIf="visible" class="egg-ovl-scrim" (click)="close()">
      <div class="egg-ovl-card" (click)="$event.stopPropagation()" role="dialog" aria-modal="true"
           aria-label="You found all ten Easter eggs">
        <button type="button" class="egg-ovl-close" (click)="close()" aria-label="Close">✕</button>
        <app-egg-celebration [displayName]="displayName"></app-egg-celebration>
        <div style="text-align:center; padding:0 1rem 1.25rem;">
          <button type="button" class="egg-ovl-done" (click)="close()">Wonderful!</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .egg-ovl-scrim {
      position:fixed; inset:0; background:rgba(18,39,74,0.45); z-index:1000;
      display:flex; align-items:center; justify-content:center; padding:1rem;
    }
    .egg-ovl-card {
      position:relative; background:var(--triarq-color-surface,#fff);
      border-radius:12px; max-width:460px; width:100%;
      box-shadow:0 12px 40px rgba(0,0,0,0.25); animation:eggOvlIn .25s ease-out;
    }
    @keyframes eggOvlIn { 0% { transform:scale(0.92); opacity:0; } 100% { transform:scale(1); opacity:1; } }
    .egg-ovl-close {
      position:absolute; top:8px; right:10px; background:none; border:none;
      font-size:18px; color:#9E9E9E; cursor:pointer; z-index:2;
    }
    .egg-ovl-done {
      background:var(--triarq-color-primary,#257099); color:#fff; border:none;
      border-radius:999px; padding:8px 22px; font-size:14px; font-weight:500; cursor:pointer;
    }
  `]
})
export class EggCelebrationOverlayComponent implements OnInit, OnDestroy {
  visible = false;
  displayName = '';
  private subs = new Subscription();

  constructor(
    private readonly eggs: EasterEggService,
    private readonly profile: UserProfileService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(this.profile.profile$.subscribe(p => {
      this.displayName = p?.display_name ?? '';
      this.cdr.markForCheck();
    }));
    this.subs.add(this.eggs.completed$.subscribe(() => {
      this.visible = true;
      this.cdr.markForCheck();
    }));
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  close(): void { this.visible = false; this.cdr.markForCheck(); }
}
