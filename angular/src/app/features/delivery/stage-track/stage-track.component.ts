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

/** Full ordered lifecycle track — 10 stages + 5 gate nodes = 15 nodes.
 *  Canonical order: VALIDATE → UAT → go_to_deploy → PILOT → go_to_release → RELEASE.
 */
export const LIFECYCLE_TRACK: LifecycleTrackNode[] = [
  { type: 'stage', id: 'BRIEF',        label: 'Brief' },
  { type: 'gate',  id: 'brief_review', label: 'Brief Review' },
  { type: 'stage', id: 'DESIGN',       label: 'Design' },
  { type: 'stage', id: 'SPEC',         label: 'Spec' },
  { type: 'gate',  id: 'go_to_build',  label: 'Go to Build' },
  { type: 'stage', id: 'BUILD',        label: 'Build' },
  { type: 'stage', id: 'VALIDATE',     label: 'Validate' },
  { type: 'stage', id: 'UAT',          label: 'UAT' },
  { type: 'gate',  id: 'go_to_deploy', label: 'Go to Deploy' },
  { type: 'stage', id: 'PILOT',        label: 'Pilot' },
  { type: 'gate',  id: 'go_to_release', label: 'Go to Release' },
  { type: 'stage', id: 'RELEASE',      label: 'Release' },
  { type: 'stage', id: 'OUTCOME',      label: 'Outcome' },
  { type: 'gate',  id: 'close_review', label: 'Close Review' },
  { type: 'stage', id: 'COMPLETE',     label: 'Complete' }
];

/** Gate-only track — 5 nodes for condensed dashboard row (spec 5.1) */
export const GATE_NODES_ONLY: LifecycleTrackNode[] = LIFECYCLE_TRACK.filter(n => n.type === 'gate');

const STAGE_ORDER = ['BRIEF','DESIGN','SPEC','BUILD','VALIDATE','UAT','PILOT','RELEASE','OUTCOME','COMPLETE'];

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

          <!-- Stage node — D-360 Surface 2 five interaction states:
               completed (teal filled ✓, no cursor, no tooltip),
               active (teal filled ●, no cursor, no tooltip),
               next-free (outline, pointer, "Advance to X" tooltip, clickable),
               next-gate-blocked (outline, default cursor, "Requires X approval" tooltip),
               future (outline, default cursor, no tooltip).
               Active stage no longer opens Gate Record Modal — gate diamond is the
               sole trigger for the modal. (Supersedes ARCH-25 active-stage-click behavior.) -->
          <div *ngIf="node.type === 'stage'"
               [attr.data-stage-id]="node.id"
               style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:0 0 auto;">
            <div
              [style.background]="stageCircleBg(node.id)"
              [style.border]="stageCircleBorder(node.id)"
              [style.cursor]="stageNodeState(node.id) === 'next-free' ? 'pointer' : 'default'"
              [attr.role]="stageNodeState(node.id) === 'next-free' ? 'button' : null"
              [attr.tabindex]="stageNodeState(node.id) === 'next-free' ? 0 : null"
              [attr.aria-label]="stageNodeAriaLabel(node.id)"
              [attr.title]="stageNodeTooltip(node.id)"
              (click)="onStageClick(node.id)"
              (keydown.enter)="onStageClick(node.id)"
              (keydown.space)="onStageClick(node.id)"
              style="width:28px;height:28px;border-radius:50%;box-sizing:border-box;
                     display:flex;align-items:center;justify-content:center;
                     transition:background 0.2s, border-color 0.2s;"
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
              [attr.title]="gateTitle(node.id)"
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
            [attr.title]="gate.label + ': ' + gateDisplayState(gate.id)"
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
  /** D-360 Surface 3: emitted when the user clicks the next free stage circle.
   *  Parent renders the inline two-step confirmation and calls advance_cycle_stage. */
  @Output() stageAdvanceRequested = new EventEmitter<string>();

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
   * D-360 Surface 2: stage circle click. Only the next free stage is clickable —
   * any other state is a no-op. The parent renders the inline confirmation.
   */
  onStageClick(stageId: string): void {
    if (this.stageNodeState(stageId) !== 'next-free') return;
    this.stageAdvanceRequested.emit(stageId);
  }

  /**
   * D-360 Surface 2 source-of-truth derivation: structural read of LIFECYCLE_TRACK.
   * If the next stage is preceded by a gate node in the track, the transition is
   * gate-blocked; otherwise free. Returns the gate id (when blocked) or null.
   */
  private nextStageGate(): { nextStageId: string | null; gateId: string | null } {
    const idx = this.fullTrack.findIndex(n => n.type === 'stage' && n.id === this.currentStageId);
    if (idx === -1) return { nextStageId: null, gateId: null };
    let interveningGate: string | null = null;
    for (let i = idx + 1; i < this.fullTrack.length; i++) {
      const node = this.fullTrack[i];
      if (node.type === 'gate')  { interveningGate = node.id; continue; }
      if (node.type === 'stage') { return { nextStageId: node.id, gateId: interveningGate }; }
    }
    return { nextStageId: null, gateId: null };
  }

  /** D-360 Surface 2: returns one of five interaction states for a stage circle. */
  stageNodeState(stageId: string): 'completed' | 'active' | 'next-free' | 'next-gate-blocked' | 'future' {
    if (this.isComplete(stageId)) return 'completed';
    if (this.isCurrent(stageId))  return 'active';
    const { nextStageId, gateId } = this.nextStageGate();
    if (stageId === nextStageId) {
      if (!gateId) return 'next-free';
      // Gate-blocked unless the gate has already cleared (rare but possible — gate
      // cleared without the cycle yet advancing). Cleared = display 'complete'.
      return this.gateDisplayState(gateId) === 'complete' ? 'next-free' : 'next-gate-blocked';
    }
    return 'future';
  }

  /** D-360 Surface 2 + B-98 fix: tooltip resolves to a string or null — never the literal "null". */
  stageNodeTooltip(stageId: string): string | null {
    const state = this.stageNodeState(stageId);
    if (state === 'next-free') {
      const label = this.fullTrack.find(n => n.id === stageId)?.label ?? stageId;
      return `Advance to ${label}`;
    }
    if (state === 'next-gate-blocked') {
      const { gateId } = this.nextStageGate();
      const gateLabel = gateId ? (this.fullTrack.find(n => n.id === gateId)?.label ?? gateId) : '';
      return `Requires ${gateLabel} approval`;
    }
    return null;
  }

  stageNodeAriaLabel(stageId: string): string | null {
    const state = this.stageNodeState(stageId);
    if (state === 'next-free') {
      const label = this.fullTrack.find(n => n.id === stageId)?.label ?? stageId;
      return `Advance to ${label}`;
    }
    return null;
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
    return 'transparent';
  }

  stageCircleBorder(stageId: string): string {
    if (this.isCurrent(stageId) || this.isComplete(stageId)) {
      return 'none';
    }
    return '2px solid var(--triarq-color-primary)';
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
