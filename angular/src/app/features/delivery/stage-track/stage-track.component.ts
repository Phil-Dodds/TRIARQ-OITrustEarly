// stage-track.component.ts — StageTrackComponent (ARCH-25)
// Standalone reusable component. Renders the 12-stage Delivery Cycle lifecycle
// with 5 gate nodes in Full and Condensed display modes.
//
// Full mode:     All 10 stages + 5 gate nodes, labels shown, gate nodes interactive.
//                Container scrolls horizontally when content overflows the panel —
//                active stage scrolled into view on render (Contract 11 B-61, supersedes
//                build-c-view-correction-spec-2026-04-09 §2.2 "no overflow scroll").
// Condensed mode: 5 gate nodes only + "In [STAGE]" text adjacent — compact for dashboard rows.
//                 Per design spec 5.1: "Gate nodes only on the dashboard row; stage name
//                 displayed as text adjacent to the track, not as a node."
//
// gateStateMap accepts D-345 awaiting_approval state (sunray, same as pending) and
// not_started (grey). complete (teal), blocked (red), upcoming (fog) unchanged.
//
// D-93: No MCP calls. Presentation only — renders what it receives.
// D-140: Gate blocked state visible to user with tooltip explanation.
// Source: ARCH-25, D-108, D-154, D-345, Contract 11 §B-61.

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GateName, GateDisplayState, GateStateMap, LifecycleTrackNode } from '../../../core/types/database';

/** Full ordered lifecycle track — 10 stages + 5 gate nodes = 15 nodes */
export const LIFECYCLE_TRACK: LifecycleTrackNode[] = [
  { type: 'stage', id: 'BRIEF',        label: 'Brief' },
  { type: 'gate',  id: 'brief_review', label: 'Brief Review' },
  { type: 'stage', id: 'DESIGN',       label: 'Design' },
  { type: 'stage', id: 'SPEC',         label: 'Spec' },
  { type: 'gate',  id: 'go_to_build',  label: 'Go to Build' },
  { type: 'stage', id: 'BUILD',        label: 'Build' },
  { type: 'stage', id: 'VALIDATE',     label: 'Validate' },
  { type: 'gate',  id: 'go_to_deploy', label: 'Go to Deploy' },
  { type: 'stage', id: 'PILOT',        label: 'Pilot' },
  { type: 'stage', id: 'UAT',          label: 'UAT' },
  { type: 'gate',  id: 'go_to_release', label: 'Go to Release' },
  { type: 'stage', id: 'RELEASE',      label: 'Release' },
  { type: 'stage', id: 'OUTCOME',      label: 'Outcome' },
  { type: 'gate',  id: 'close_review', label: 'Close Review' },
  { type: 'stage', id: 'COMPLETE',     label: 'Complete' }
];

/** Gate-only track — 5 nodes for condensed dashboard row (spec 5.1) */
export const GATE_NODES_ONLY: LifecycleTrackNode[] = LIFECYCLE_TRACK.filter(n => n.type === 'gate');

const STAGE_ORDER = ['BRIEF','DESIGN','SPEC','BUILD','VALIDATE','PILOT','UAT','RELEASE','OUTCOME','COMPLETE'];

@Component({
  selector: 'app-stage-track',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <!-- ── Full mode ──────────────────────────────────────────────────────── -->
    <!-- Contract 11 B-61: horizontal scroll when content overflows; active stage
         scrolled into view on render. Supersedes build-c-view-correction-spec-2026-04-09 §2.2. -->
    <div *ngIf="displayMode === 'full'"
         #fullScroller
         style="padding:var(--triarq-space-sm) 20px;height:90px;overflow-x:auto;overflow-y:hidden;">
      <div style="display:flex;align-items:center;min-width:max-content;gap:0;height:100%;">

        <ng-container *ngFor="let node of fullTrack; let i = index">

          <!-- Connector line — fixed minimum width so track is reachable when scrolling -->
          <div
            *ngIf="i > 0"
            [style.background]="connectorFilled(i) ? 'var(--triarq-color-primary)' : '#D0D0D0'"
            style="height:2px;flex:0 0 32px;"
          ></div>

          <!-- Stage node — current stage circle is interactive (D-355, ARCH-25):
               clicking it opens the Gate Record Modal for the next gate. -->
          <div *ngIf="node.type === 'stage'"
               [attr.data-stage-id]="node.id"
               style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:0 0 auto;">
            <div
              [style.background]="stageCircleBg(node.id)"
              [style.outline]="isCurrent(node.id) ? '2px solid #fff' : 'none'"
              [style.outline-offset]="'2px'"
              [style.cursor]="isCurrent(node.id) && nextGateAfterCurrent ? 'pointer' : 'default'"
              [attr.role]="isCurrent(node.id) && nextGateAfterCurrent ? 'button' : null"
              [attr.tabindex]="isCurrent(node.id) && nextGateAfterCurrent ? 0 : null"
              [attr.aria-label]="isCurrent(node.id) && nextGateAfterCurrent ? 'Open ' + nextGateLabel + ' gate' : null"
              [title]="isCurrent(node.id) && nextGateAfterCurrent ? 'Open ' + nextGateLabel : null"
              (click)="isCurrent(node.id) && onCurrentStageClick()"
              (keydown.enter)="isCurrent(node.id) && onCurrentStageClick()"
              (keydown.space)="isCurrent(node.id) && onCurrentStageClick()"
              style="width:28px;height:28px;border-radius:50%;
                     display:flex;align-items:center;justify-content:center;
                     transition:background 0.2s;"
            >
              <span *ngIf="isComplete(node.id)"
                    style="color:#fff;font-size:12px;font-weight:700;">✓</span>
              <span *ngIf="isCurrent(node.id) && !isComplete(node.id)"
                    style="color:#fff;font-size:10px;font-weight:700;">●</span>
            </div>
            <span style="font-size:10px;color:#5A5A5A;text-align:center;
                         max-width:48px;line-height:1.1;word-break:break-word;">
              {{ node.label }}
            </span>
          </div>

          <!-- Gate node — diamond, label above, interactive -->
          <div *ngIf="node.type === 'gate'"
               style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:0 0 auto;">
            <span style="font-size:10px;color:#5A5A5A;text-align:center;
                         max-width:56px;line-height:1.1;word-break:break-word;margin-bottom:2px;">
              {{ node.label }}
            </span>
            <div
              [style.background]="gateColor(node.id)"
              [title]="gateTitle(node.id)"
              (click)="onGateClick(node.id)"
              style="width:24px;height:24px;border-radius:4px;transform:rotate(45deg);
                     cursor:pointer;transition:opacity 0.15s;"
            ></div>
          </div>

        </ng-container>
      </div>
    </div>

    <!-- ── Condensed mode — gate nodes only + stage text (spec 5.1) ─────── -->
    <div *ngIf="displayMode === 'condensed'"
         style="display:flex;align-items:center;gap:var(--triarq-space-xs);">

      <!-- Stage text label — "In BUILD" -->
      <span style="font-size:10px;color:var(--triarq-color-text-secondary);
                   white-space:nowrap;min-width:40px;">
        {{ condensedStageLabel }}
      </span>

      <!-- 5 gate nodes only -->
      <div style="display:flex;align-items:center;gap:3px;">
        <ng-container *ngFor="let gate of gateNodes; let i = index">
          <div *ngIf="i > 0"
               [style.background]="gateDisplayState(gate.id) === 'complete'
                 ? 'var(--triarq-color-primary)'
                 : 'var(--triarq-color-fog, #e0e0e0)'"
               style="height:1px;width:6px;flex-shrink:0;"></div>
          <div
            [style.background]="gateColor(gate.id)"
            [title]="gate.label + ': ' + gateDisplayState(gate.id)"
            style="width:10px;height:10px;border-radius:2px;
                   transform:rotate(45deg);flex-shrink:0;"
          ></div>
        </ng-container>
      </div>
    </div>
  `
})
export class StageTrackComponent implements AfterViewInit, OnChanges {
  @Input() currentStageId: string     = 'BRIEF';
  @Input() gateStateMap:   GateStateMap = {} as GateStateMap;
  @Input() displayMode:    'full' | 'condensed' = 'full';

  @Output() gateClicked = new EventEmitter<GateName>();

  @ViewChild('fullScroller') fullScroller?: ElementRef<HTMLDivElement>;

  readonly fullTrack  = LIFECYCLE_TRACK;
  readonly gateNodes  = GATE_NODES_ONLY;

  ngAfterViewInit(): void {
    this.scrollActiveStageIntoView();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentStageId'] && !changes['currentStageId'].firstChange) {
      this.scrollActiveStageIntoView();
    }
  }

  /** Contract 11 B-61: scroll the active stage into view when full track overflows. */
  private scrollActiveStageIntoView(): void {
    if (this.displayMode !== 'full' || !this.fullScroller) { return; }
    const root = this.fullScroller.nativeElement;
    const target = root.querySelector(`[data-stage-id="${this.currentStageId}"]`) as HTMLElement | null;
    if (!target) { return; }
    // Place active stage near the centre when there's overflow.
    const containerWidth = root.clientWidth;
    const targetCentre   = target.offsetLeft + target.offsetWidth / 2;
    const desiredScroll  = Math.max(0, targetCentre - containerWidth / 2);
    root.scrollTo({ left: desiredScroll, behavior: 'auto' });
  }

  onGateClick(gateId: string): void {
    this.gateClicked.emit(gateId as GateName);
  }

  /**
   * D-355 / ARCH-25: clicking the current stage's filled circle opens the Gate
   * Record Modal for the next gate the cycle must pass. No-op if there is no
   * next gate (e.g. cycle is at COMPLETE).
   */
  onCurrentStageClick(): void {
    const nextGate = this.nextGateAfterCurrent;
    if (nextGate) this.gateClicked.emit(nextGate as GateName);
  }

  /** Gate id of the first gate node following the current stage in the full track. */
  get nextGateAfterCurrent(): string | null {
    const idx = this.fullTrack.findIndex(n => n.type === 'stage' && n.id === this.currentStageId);
    if (idx === -1) return null;
    for (let i = idx + 1; i < this.fullTrack.length; i++) {
      if (this.fullTrack[i].type === 'gate') return this.fullTrack[i].id;
    }
    return null;
  }

  get nextGateLabel(): string {
    const id = this.nextGateAfterCurrent;
    if (!id) return '';
    return this.fullTrack.find(n => n.id === id)?.label ?? '';
  }

  gateDisplayState(gateId: string): GateDisplayState {
    return this.gateStateMap[gateId as GateName] ?? 'upcoming';
  }

  isComplete(stageId: string): boolean {
    const currentIdx = STAGE_ORDER.indexOf(this.currentStageId);
    const nodeIdx    = STAGE_ORDER.indexOf(stageId);
    return nodeIdx !== -1 && nodeIdx < currentIdx;
  }

  isCurrent(stageId: string): boolean {
    return stageId === this.currentStageId;
  }

  /** True if the connector before track index i should be filled (primary color) */
  connectorFilled(i: number): boolean {
    // Connector between index i-1 and i is filled if both adjacent nodes are complete/current
    const prev = this.fullTrack[i - 1];
    if (!prev) { return false; }
    if (prev.type === 'stage') { return this.isComplete(prev.id) || this.isCurrent(prev.id); }
    if (prev.type === 'gate')  { return this.gateDisplayState(prev.id) === 'complete'; }
    return false;
  }

  stageCircleBg(stageId: string): string {
    if (this.isCurrent(stageId) || this.isComplete(stageId)) {
      return 'var(--triarq-color-primary)';
    }
    return 'var(--triarq-color-fog, #e0e0e0)';
  }

  gateColor(gateId: string): string {
    switch (this.gateDisplayState(gateId)) {
      case 'complete':           return 'var(--triarq-color-primary)';
      case 'pending':            return 'var(--triarq-color-sunray, #f5a623)';
      case 'awaiting_approval':  return 'var(--triarq-color-sunray, #f5a623)';
      case 'blocked':            return 'var(--triarq-color-error, #d32f2f)';
      case 'not_started':        return 'var(--triarq-color-fog, #e0e0e0)';
      default:                   return 'var(--triarq-color-fog, #e0e0e0)';
    }
  }

  gateTitle(gateId: string): string {
    const state  = this.gateDisplayState(gateId);
    const node   = this.fullTrack.find(n => n.id === gateId);
    const hint   = state === 'blocked'           ? ' — workstream inactive, gate blocked'
                 : state === 'awaiting_approval' ? ' — awaiting approver decision'
                 : state === 'pending'           ? ' — awaiting approval'
                 : state === 'complete'          ? ' — cleared'
                 : state === 'not_started'       ? ' — not yet submitted'
                 : ' — not yet reached';
    return `${node?.label ?? gateId}${hint}`;
  }

  /** "In BUILD" label for condensed mode */
  get condensedStageLabel(): string {
    const terminal: Record<string, string> = {
      COMPLETE: 'Done', CANCELLED: 'Cancelled', ON_HOLD: 'On Hold'
    };
    return terminal[this.currentStageId] ?? this.currentStageId;
  }
}
