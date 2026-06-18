// stage-track.component.ts — StageTrackComponent (ARCH-25)
// Standalone reusable component. Renders the 12-stage Initiative lifecycle
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
// Contract 28 / D-447: 'skipped' display state added — hollow Oravive diamond
// (transparent fill, 2px Oravive stroke). Render is identical in Full and
// Condensed modes. Full-mode tooltip surfaces the skip date when supplied via
// gateSkippedAtMap.
//
// D-93: No MCP calls. Presentation only — renders what it receives.
// D-140: Gate blocked state visible to user with tooltip explanation.
// Source: ARCH-25, D-108, D-154, D-345, D-447, Contract 11 §B-61.

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
              [style.border]="gateBorder(node.id)"
              [attr.title]="gateTitle(node.id)"
              (click)="onGateClick(node.id)"
              style="width:24px;height:24px;border-radius:4px;transform:rotate(45deg);
                     cursor:pointer;transition:opacity 0.15s;box-sizing:border-box;"
            ></div>
          </div>

        </ng-container>
      </div>
    </div>

    <!-- ── Condensed mode — 5 gate diamonds + stage name below (Contract 23 Item 2.1) ──
         5 unlabeled gate diamonds in a horizontal row. Current stage name renders below
         per S-015: 11px italic Stone (#5A5A5A). Diamonds are non-interactive in condensed
         mode — gate interaction is detail-panel only. Supersedes ARCH-25 spec 5.1
         "adjacent text" placement (locked by D-267 + Section H Item 2.1). -->
    <div *ngIf="displayMode === 'condensed'"
         style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;">

      <!-- 5 gate diamonds, no labels on diamonds, non-interactive -->
      <div style="display:flex;align-items:center;gap:3px;">
        <ng-container *ngFor="let gate of gateNodes; let i = index">
          <div *ngIf="i > 0"
               [style.background]="condensedConnectorBg(gate.id, i)"
               style="height:1px;width:6px;flex-shrink:0;"></div>
          <div
            [style.background]="gateColor(gate.id)"
            [style.border]="gateBorder(gate.id)"
            [attr.title]="gateDisplayState(gate.id) === 'skipped'
                            ? null
                            : (gate.label + ': ' + gateDisplayState(gate.id))"
            style="width:10px;height:10px;border-radius:2px;
                   transform:rotate(45deg);flex-shrink:0;box-sizing:border-box;"
          ></div>
        </ng-container>
      </div>

      <!-- Stage name as plain secondary text below the diamonds (S-015) -->
      <span style="font-size:11px;font-style:italic;color:#5A5A5A;
                   white-space:nowrap;line-height:1;">
        {{ condensedStageLabel }}
      </span>
    </div>
  `
})
export class StageTrackComponent implements AfterViewInit, OnChanges {
  @Input() currentStageId: string     = 'BRIEF';
  @Input() gateStateMap:   GateStateMap = {} as GateStateMap;
  @Input() displayMode:    'full' | 'condensed' = 'full';
  /** D-447: ISO timestamp per gate marked as 'skipped'. Used to build the
   *  full-mode tooltip "Skipped — [MMM D, YYYY]". Condensed mode never
   *  shows the tooltip per spec. */
  @Input() gateSkippedAtMap: Partial<Record<GateName, string | null>> = {};

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

  /** True if the connector before track index i should be filled (primary color).
   *  CC-28-2: 'skipped' gates fill the connector (treated as resolved). Otherwise
   *  a chain of skipped gates would visually break the track. */
  connectorFilled(i: number): boolean {
    // Connector between index i-1 and i is filled if both adjacent nodes are complete/current
    const prev = this.fullTrack[i - 1];
    if (!prev) { return false; }
    if (prev.type === 'stage') { return this.isComplete(prev.id) || this.isCurrent(prev.id); }
    if (prev.type === 'gate')  {
      const s = this.gateDisplayState(prev.id);
      return s === 'complete' || s === 'skipped';
    }
    return false;
  }

  /** Condensed-mode connector colour. Skipped (like complete) fills with primary
   *  per CC-28-2 so the dashboard row reads as continuous through skipped gates. */
  condensedConnectorBg(gateId: string, _i: number): string {
    const prevGate = this.gateNodes[_i - 1];
    if (!prevGate) { return 'var(--triarq-color-fog, #e0e0e0)'; }
    const prevState = this.gateDisplayState(prevGate.id);
    if (prevState === 'complete' || prevState === 'skipped') {
      return 'var(--triarq-color-primary)';
    }
    return 'var(--triarq-color-fog, #e0e0e0)';
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
      // D-447: hollow Oravive — transparent fill + stroke via gateBorder().
      case 'skipped':            return 'transparent';
      default:                   return 'var(--triarq-color-fog, #e0e0e0)';
    }
  }

  /** D-447: hollow Oravive stroke for skipped gates; no border otherwise.
   *  Stroke is 2px in Full mode and Condensed (spec literal). Box-sizing
   *  border-box on the diamond keeps the overall 24px / 10px footprint. */
  gateBorder(gateId: string): string {
    if (this.gateDisplayState(gateId) === 'skipped') {
      return '2px solid var(--triarq-color-oravive, #E96127)';
    }
    return 'none';
  }

  gateTitle(gateId: string): string {
    const state  = this.gateDisplayState(gateId);
    const node   = this.fullTrack.find(n => n.id === gateId);
    if (state === 'skipped') {
      // D-447: "Skipped — [MMM D, YYYY]". When no skip date is supplied
      // (parent has not joined the metadata), fall back to undated label.
      const isoSkip = this.gateSkippedAtMap[gateId as GateName] ?? null;
      const formatted = isoSkip ? this.formatSkipDate(isoSkip) : null;
      return formatted
        ? `${node?.label ?? gateId} — Skipped — ${formatted}`
        : `${node?.label ?? gateId} — Skipped`;
    }
    const hint   = state === 'blocked'           ? ' — workstream inactive, gate blocked'
                 : state === 'awaiting_approval' ? ' — awaiting approver decision'
                 : state === 'pending'           ? ' — awaiting approval'
                 : state === 'complete'          ? ' — cleared'
                 : state === 'not_started'       ? ' — not yet submitted'
                 : ' — not yet reached';
    return `${node?.label ?? gateId}${hint}`;
  }

  /** D-447 tooltip date format: "MMM D, YYYY" (e.g. "Jun 17, 2026"). */
  private formatSkipDate(iso: string): string | null {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const month = d.toLocaleString('en-US', { month: 'short' });
    return `${month} ${d.getDate()}, ${d.getFullYear()}`;
  }

  /** Human-readable stage label for condensed mode (Contract 23 Item 2.1).
   *  Derived from LIFECYCLE_TRACK — same source as the full-mode node labels —
   *  so the label is never hardcoded and stays in sync with structural reads. */
  get condensedStageLabel(): string {
    const terminal: Record<string, string> = {
      CANCELLED: 'Cancelled', ON_HOLD: 'On Hold'
    };
    const fromTrack = this.fullTrack.find(n => n.type === 'stage' && n.id === this.currentStageId)?.label;
    return terminal[this.currentStageId] ?? fromTrack ?? this.currentStageId;
  }
}
