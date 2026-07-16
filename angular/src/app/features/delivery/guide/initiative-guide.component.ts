// initiative-guide.component.ts — Initiative Guide
// Route: /initiatives/guide  (hub card "How Initiative Tracking Works")
//
// Concept guide, not an FAQ: one anchored section per concept, readable
// end-to-end as onboarding. Gate texts and the Outcome definition come from
// gate-coaching.constants.ts (D-527) so the point-of-use one-liners and this
// page can never drift apart. Deep links: point-of-use coaching links here
// with a fragment (e.g. #go-to-deploy).
//
// This page is the OI Library seed — when the Library ships, this content
// becomes its first document and this route can redirect.

import {
  Component, ChangeDetectionStrategy, OnInit, OnDestroy, ElementRef
} from '@angular/core';
import { CommonModule }  from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  GATE_DATE_SEMANTICS, GATE_COACHING_SHORT, GATE_COACHING_FULL, OUTCOME_COACHING
} from '../../../shared/constants/gate-coaching.constants';

interface GuideGate {
  anchor: string;
  label:  string;
  short:  string;
  full:   string;
}

const GATE_ORDER = ['Brief Review', 'Go to Build', 'Go to Deploy', 'Go to Release', 'Close Review'];

import { EggSpotComponent } from '../../easter-eggs/egg-spot.component';
import { EGG_KEYS }         from '../../../core/constants/easter-egg.constants';

@Component({
  selector:        'app-initiative-guide',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule, EggSpotComponent],
  template: `
    <div class="ig-shell">
      <div class="ig-header">
        <a routerLink="/initiatives" class="ig-back">← Initiative Tracking</a>
        <h3 class="ig-title">How Initiative Tracking Works</h3>
        <p class="ig-subtitle">
          What Initiatives are, what each of the five gates means, how dates and statuses behave,
          and how status updates flow. Link colleagues here — every section has its own anchor.
        </p>
      </div>

      <!-- In-page section nav -->
      <div class="ig-toc">
        <a (click)="scrollTo('initiatives')">Initiatives</a>
        <a (click)="scrollTo('gates')">The Five Gates</a>
        <a (click)="scrollTo('dates')">Target vs Actual Dates</a>
        <a (click)="scrollTo('statuses')">Statuses &amp; Approval</a>
        <a (click)="scrollTo('status-updates')">Status Updates</a>
        <a (click)="scrollTo('outcome')">Outcomes</a>
      </div>

      <!-- ── Initiatives ── -->
      <div class="ig-section" id="initiatives">
        <h4>Initiatives</h4>
        <p>
          An Initiative is a unit of governed delivery work — it moves from an approved Context
          Brief to an achieved business Outcome through five governance gates. Every Initiative
          belongs to a Division and carries a team: a Domain Capability Strategist (DCS), an
          Engineering Product Owner (EPO), and a Domain Outcome Lead (DOL) — the DOL is the
          operations/business owner accountable for running the result in the real world.
        </p>
        <p>
          Initiative Tracking's views (All Initiatives, the Status Dashboard, the EPO and gate
          schedules) are different windows onto the same Initiatives — pick the view that matches
          your current question.
        </p>
      </div>

      <!-- ── The five gates ── -->
      <div class="ig-section" id="gates">
        <h4>The Five Gates</h4>
        <p>
          Gates are approval checkpoints, in a fixed order. A gate being approved is what starts
          the next phase — the gate names describe what is being approved, not what starts next.
        </p>
        <div *ngFor="let g of gates" class="ig-gate" [id]="g.anchor">
          <div class="ig-gate-name">◇ {{ g.label }}</div>
          <div class="ig-gate-short">{{ g.short }}</div>
          <p class="ig-gate-full">{{ g.full }}</p>
        </div>
      </div>

      <!-- ── Dates ── -->
      <div class="ig-section" id="dates">
        <h4>Target vs Actual Dates</h4>
        <p class="ig-callout">{{ dateSemantics }}</p>
        <p>
          Dates are yours to manage: they can be set, changed, or cleared at any time, and
          changing a date never changes the gate's status — the app may note the mismatch, but it
          never blocks or overrides you. Every target-date change is logged with who made it.
          A target date in the past shows overdue treatment wherever it renders.
        </p>
      </div>

      <!-- ── Statuses ── -->
      <div class="ig-section" id="statuses">
        <h4>Statuses &amp; Approval</h4>
        <p>
          Each gate carries a milestone status — Not Started, On Track, At Risk, Behind, or
          Complete — set freely by the team as their honest read of the work. Approval is a
          separate workflow: a gate is submitted for approval, shows Awaiting approval (Pending
          Approval on the dashboard), and its approver approves it. Statuses inform; approvals
          govern progression.
        </p>
        <p>
          "Next Gate" on any screen means the first gate in order that is not yet complete or
          skipped — always one of the five gate names above.
        </p>
      </div>

      <!-- ── Status updates ── -->
      <div class="ig-section" id="status-updates">
        <h4>Status Updates &amp; Acknowledgments</h4>
        <p>
          Anyone with visibility on an Initiative's Division can save a status update — what was
          accomplished, the plan for the next cycle, blockers, escalation, and confidence. Your
          Division's update cadence (weekly, tri-weekly, or monthly) drives when an Initiative's
          status shows as overdue.
        </p>
        <p>
          When someone outside the Initiative's trio (DCS/EPO/DOL) saves an update, all three trio
          members are invited to acknowledge it — an invitation, never a requirement. A fresh
          update can be edited by its author or a trio member for 3 calendar days; after that (or
          once the status is overdue), the path is a new update. Edits never reset the overdue
          clock — the original save's date governs.
        </p>
      </div>

      <!-- ── Outcome ── -->
      <div class="ig-section" id="outcome">
        <h4>Outcomes</h4>
        <p class="ig-callout">{{ outcome }}</p>
        <p>
          The Outcome is declared at Brief Review and accomplished by Close Review — every gate in
          between exists to keep the work pointed at it.
        </p>
      </div>

      <!-- Easter Egg Hunt spot — foot of the guide, after Outcomes -->
      <div style="text-align:center; padding:16px 0 4px;">
        <app-egg-spot [placementKey]="EGG_KEYS.INITIATIVE_GUIDE_FOOTER"></app-egg-spot>
      </div>
    </div>
  `,
  styles: [`
    .ig-shell { max-width: 760px; margin: var(--triarq-space-2xl) auto; padding: 0 var(--triarq-space-md) 64px; }
    .ig-back { font-size: 12px; color: var(--triarq-color-primary); text-decoration: none; }
    .ig-title { margin: 8px 0 4px; }
    .ig-subtitle { margin: 0 0 12px; font-size: 11px; font-style: italic; color: #5A5A5A; line-height: 1.6; max-width: 620px; }
    .ig-toc { display: flex; flex-wrap: wrap; gap: 6px 16px; padding: 10px 0; border-top: 1px solid var(--triarq-color-border);
              border-bottom: 1px solid var(--triarq-color-border); margin-bottom: 20px; }
    .ig-toc a { font-size: 12px; color: var(--triarq-color-primary); cursor: pointer; }
    .ig-section { margin-bottom: 28px; scroll-margin-top: 16px; }
    .ig-section h4 { margin: 0 0 8px; color: var(--triarq-color-deep-navy, #1a2b4a); }
    .ig-section p { font-size: 13px; line-height: 1.7; color: #333; margin: 0 0 10px; }
    .ig-callout { background: #F0F5F8; border-left: 3px solid var(--triarq-color-primary, #257099);
                  border-radius: 0 5px 5px 0; padding: 10px 12px; font-style: italic; }
    .ig-gate { padding: 10px 0 2px; border-top: 1px solid #F0F0F0; scroll-margin-top: 16px; }
    .ig-gate-name { font-weight: 600; font-size: 14px; color: var(--triarq-color-primary, #257099); }
    .ig-gate-short { font-size: 11px; font-style: italic; color: #757575; margin: 2px 0 6px; }
    .ig-gate-full { font-size: 13px; line-height: 1.7; color: #333; }
  `]
})
export class InitiativeGuideComponent implements OnInit, OnDestroy {
  readonly EGG_KEYS = EGG_KEYS;
  readonly dateSemantics = GATE_DATE_SEMANTICS;
  readonly outcome       = OUTCOME_COACHING;
  readonly gates: GuideGate[] = GATE_ORDER.map(label => ({
    anchor: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    short:  GATE_COACHING_SHORT[label] ?? '',
    full:   GATE_COACHING_FULL[label] ?? ''
  }));

  private destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly host:  ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    // Fragment deep links (e.g. /initiatives/guide#go-to-deploy) — manual
    // scroll; router anchorScrolling is not enabled app-wide.
    this.route.fragment.pipe(takeUntil(this.destroy$)).subscribe(frag => {
      if (frag) { setTimeout(() => this.scrollTo(frag)); }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  scrollTo(anchor: string): void {
    this.host.nativeElement.querySelector(`#${CSS.escape(anchor)}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
