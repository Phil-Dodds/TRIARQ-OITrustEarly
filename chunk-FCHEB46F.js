import {
  LoadingOverlayComponent
} from "./chunk-CPG53S23.js";
import {
  UserProfileService
} from "./chunk-G46Y23DK.js";
import {
  DeliveryService
} from "./chunk-65IKJVPJ.js";
import {
  McpService
} from "./chunk-SQSDYRWS.js";
import {
  IonSkeletonText,
  IonSpinner,
  IonicModule,
  RouterLinkWithHrefDelegateDirective
} from "./chunk-XICHVGJY.js";
import {
  __spreadValues
} from "./chunk-DSWO3WHD.js";

// src/app/features/delivery/detail/delivery-cycle-detail.component.ts
import { Component as Component4, ChangeDetectionStrategy as ChangeDetectionStrategy4, Input as Input4, Output as Output4, EventEmitter as EventEmitter4 } from "@angular/core";
import { CommonModule as CommonModule4 } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ReactiveFormsModule as ReactiveFormsModule3, FormsModule, FormControl as FormControl2, Validators as Validators2 } from "@angular/forms";

// src/app/features/delivery/stage-track/stage-track.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
function StageTrackComponent_div_0_ng_container_2_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "div", 7);
  }
  if (rf & 2) {
    const i_r1 = i0.\u0275\u0275nextContext().index;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275styleProp("background", ctx_r1.connectorFilled(i_r1) ? "var(--triarq-color-primary)" : "#D0D0D0");
  }
}
function StageTrackComponent_div_0_ng_container_2_div_2_span_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 13);
    i0.\u0275\u0275text(1, "\u2713");
    i0.\u0275\u0275elementEnd();
  }
}
function StageTrackComponent_div_0_ng_container_2_div_2_span_3_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 14);
    i0.\u0275\u0275text(1, "\u25CF");
    i0.\u0275\u0275elementEnd();
  }
}
function StageTrackComponent_div_0_ng_container_2_div_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 8)(1, "div", 9);
    i0.\u0275\u0275template(2, StageTrackComponent_div_0_ng_container_2_div_2_span_2_Template, 2, 0, "span", 10)(3, StageTrackComponent_div_0_ng_container_2_div_2_span_3_Template, 2, 0, "span", 11);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(4, "span", 12);
    i0.\u0275\u0275text(5);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const node_r3 = i0.\u0275\u0275nextContext().$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("background", ctx_r1.stageCircleBg(node_r3.id))("outline", ctx_r1.isCurrent(node_r3.id) ? "2px solid #fff" : "none")("outline-offset", "2px");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.isComplete(node_r3.id));
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.isCurrent(node_r3.id) && !ctx_r1.isComplete(node_r3.id));
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", node_r3.label, " ");
  }
}
function StageTrackComponent_div_0_ng_container_2_div_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 8)(1, "span", 15);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 16);
    i0.\u0275\u0275listener("click", function StageTrackComponent_div_0_ng_container_2_div_3_Template_div_click_3_listener() {
      i0.\u0275\u0275restoreView(_r4);
      const node_r3 = i0.\u0275\u0275nextContext().$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.onGateClick(node_r3.id));
    });
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const node_r3 = i0.\u0275\u0275nextContext().$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", node_r3.label, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("background", ctx_r1.gateColor(node_r3.id));
    i0.\u0275\u0275property("title", ctx_r1.gateTitle(node_r3.id));
  }
}
function StageTrackComponent_div_0_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementContainerStart(0);
    i0.\u0275\u0275template(1, StageTrackComponent_div_0_ng_container_2_div_1_Template, 1, 2, "div", 5)(2, StageTrackComponent_div_0_ng_container_2_div_2_Template, 6, 9, "div", 6)(3, StageTrackComponent_div_0_ng_container_2_div_3_Template, 4, 4, "div", 6);
    i0.\u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const node_r3 = ctx.$implicit;
    const i_r1 = ctx.index;
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", i_r1 > 0);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", node_r3.type === "stage");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", node_r3.type === "gate");
  }
}
function StageTrackComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 2)(1, "div", 3);
    i0.\u0275\u0275template(2, StageTrackComponent_div_0_ng_container_2_Template, 4, 3, "ng-container", 4);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngForOf", ctx_r1.fullTrack);
  }
}
function StageTrackComponent_div_1_ng_container_4_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "div", 22);
  }
  if (rf & 2) {
    const gate_r5 = i0.\u0275\u0275nextContext().$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275styleProp("background", ctx_r1.gateDisplayState(gate_r5.id) === "complete" ? "var(--triarq-color-primary)" : "var(--triarq-color-fog, #e0e0e0)");
  }
}
function StageTrackComponent_div_1_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementContainerStart(0);
    i0.\u0275\u0275template(1, StageTrackComponent_div_1_ng_container_4_div_1_Template, 1, 2, "div", 20);
    i0.\u0275\u0275element(2, "div", 21);
    i0.\u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const gate_r5 = ctx.$implicit;
    const i_r6 = ctx.index;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", i_r6 > 0);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("background", ctx_r1.gateColor(gate_r5.id));
    i0.\u0275\u0275property("title", gate_r5.label + ": " + ctx_r1.gateDisplayState(gate_r5.id));
  }
}
function StageTrackComponent_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 17)(1, "span", 18);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 19);
    i0.\u0275\u0275template(4, StageTrackComponent_div_1_ng_container_4_Template, 3, 4, "ng-container", 4);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.condensedStageLabel, " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngForOf", ctx_r1.gateNodes);
  }
}
var LIFECYCLE_TRACK = [
  { type: "stage", id: "BRIEF", label: "Brief" },
  { type: "gate", id: "brief_review", label: "Brief Review" },
  { type: "stage", id: "DESIGN", label: "Design" },
  { type: "stage", id: "SPEC", label: "Spec" },
  { type: "gate", id: "go_to_build", label: "Go to Build" },
  { type: "stage", id: "BUILD", label: "Build" },
  { type: "stage", id: "VALIDATE", label: "Validate" },
  { type: "gate", id: "go_to_deploy", label: "Go to Deploy" },
  { type: "stage", id: "PILOT", label: "Pilot" },
  { type: "stage", id: "UAT", label: "UAT" },
  { type: "gate", id: "go_to_release", label: "Go to Release" },
  { type: "stage", id: "RELEASE", label: "Release" },
  { type: "stage", id: "OUTCOME", label: "Outcome" },
  { type: "gate", id: "close_review", label: "Close Review" },
  { type: "stage", id: "COMPLETE", label: "Complete" }
];
var GATE_NODES_ONLY = LIFECYCLE_TRACK.filter((n) => n.type === "gate");
var STAGE_ORDER = ["BRIEF", "DESIGN", "SPEC", "BUILD", "VALIDATE", "PILOT", "UAT", "RELEASE", "OUTCOME", "COMPLETE"];
var StageTrackComponent = class _StageTrackComponent {
  constructor() {
    this.currentStageId = "BRIEF";
    this.gateStateMap = {};
    this.displayMode = "full";
    this.gateClicked = new EventEmitter();
    this.fullTrack = LIFECYCLE_TRACK;
    this.gateNodes = GATE_NODES_ONLY;
  }
  onGateClick(gateId) {
    this.gateClicked.emit(gateId);
  }
  gateDisplayState(gateId) {
    return this.gateStateMap[gateId] ?? "upcoming";
  }
  isComplete(stageId) {
    const currentIdx = STAGE_ORDER.indexOf(this.currentStageId);
    const nodeIdx = STAGE_ORDER.indexOf(stageId);
    return nodeIdx !== -1 && nodeIdx < currentIdx;
  }
  isCurrent(stageId) {
    return stageId === this.currentStageId;
  }
  /** True if the connector before track index i should be filled (primary color) */
  connectorFilled(i) {
    const prev = this.fullTrack[i - 1];
    if (!prev) {
      return false;
    }
    if (prev.type === "stage") {
      return this.isComplete(prev.id) || this.isCurrent(prev.id);
    }
    if (prev.type === "gate") {
      return this.gateDisplayState(prev.id) === "complete";
    }
    return false;
  }
  stageCircleBg(stageId) {
    if (this.isCurrent(stageId) || this.isComplete(stageId)) {
      return "var(--triarq-color-primary)";
    }
    return "var(--triarq-color-fog, #e0e0e0)";
  }
  gateColor(gateId) {
    switch (this.gateDisplayState(gateId)) {
      case "complete":
        return "var(--triarq-color-primary)";
      case "pending":
        return "var(--triarq-color-sunray, #f5a623)";
      case "blocked":
        return "var(--triarq-color-error, #d32f2f)";
      default:
        return "var(--triarq-color-fog, #e0e0e0)";
    }
  }
  gateTitle(gateId) {
    const state = this.gateDisplayState(gateId);
    const node = this.fullTrack.find((n) => n.id === gateId);
    const hint = state === "blocked" ? " \u2014 workstream inactive, gate blocked" : state === "pending" ? " \u2014 awaiting approval" : state === "complete" ? " \u2014 cleared" : " \u2014 not yet reached";
    return `${node?.label ?? gateId}${hint}`;
  }
  /** "In BUILD" label for condensed mode */
  get condensedStageLabel() {
    const terminal = {
      COMPLETE: "Done",
      CANCELLED: "Cancelled",
      ON_HOLD: "On Hold"
    };
    return terminal[this.currentStageId] ?? this.currentStageId;
  }
  static {
    this.\u0275fac = function StageTrackComponent_Factory(t) {
      return new (t || _StageTrackComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _StageTrackComponent, selectors: [["app-stage-track"]], inputs: { currentStageId: "currentStageId", gateStateMap: "gateStateMap", displayMode: "displayMode" }, outputs: { gateClicked: "gateClicked" }, standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 2, vars: 2, consts: [["style", "padding:var(--triarq-space-sm) 20px;height:80px;overflow:hidden;", 4, "ngIf"], ["style", "display:flex;align-items:center;gap:var(--triarq-space-xs);", 4, "ngIf"], [2, "padding", "var(--triarq-space-sm) 20px", "height", "80px", "overflow", "hidden"], [2, "display", "flex", "align-items", "center", "width", "100%", "gap", "0", "height", "100%"], [4, "ngFor", "ngForOf"], ["style", "height:2px;flex:1;", 3, "background", 4, "ngIf"], ["style", "display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;", 4, "ngIf"], [2, "height", "2px", "flex", "1"], [2, "display", "flex", "flex-direction", "column", "align-items", "center", "gap", "2px", "flex-shrink", "0"], [2, "width", "28px", "height", "28px", "border-radius", "50%", "display", "flex", "align-items", "center", "justify-content", "center", "transition", "background 0.2s"], ["style", "color:#fff;font-size:12px;font-weight:700;", 4, "ngIf"], ["style", "color:#fff;font-size:10px;font-weight:700;", 4, "ngIf"], [2, "font-size", "10px", "color", "#5A5A5A", "text-align", "center", "max-width", "40px", "line-height", "1.1", "word-break", "break-word"], [2, "color", "#fff", "font-size", "12px", "font-weight", "700"], [2, "color", "#fff", "font-size", "10px", "font-weight", "700"], [2, "font-size", "10px", "color", "#5A5A5A", "text-align", "center", "max-width", "44px", "line-height", "1.1", "word-break", "break-word", "margin-bottom", "2px"], [2, "width", "24px", "height", "24px", "border-radius", "4px", "transform", "rotate(45deg)", "cursor", "pointer", "transition", "opacity 0.15s", 3, "click", "title"], [2, "display", "flex", "align-items", "center", "gap", "var(--triarq-space-xs)"], [2, "font-size", "10px", "color", "var(--triarq-color-text-secondary)", "white-space", "nowrap", "min-width", "40px"], [2, "display", "flex", "align-items", "center", "gap", "3px"], ["style", "height:1px;width:6px;flex-shrink:0;", 3, "background", 4, "ngIf"], [2, "width", "10px", "height", "10px", "border-radius", "2px", "transform", "rotate(45deg)", "flex-shrink", "0", 3, "title"], [2, "height", "1px", "width", "6px", "flex-shrink", "0"]], template: function StageTrackComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275template(0, StageTrackComponent_div_0_Template, 3, 1, "div", 0)(1, StageTrackComponent_div_1_Template, 5, 2, "div", 1);
      }
      if (rf & 2) {
        i0.\u0275\u0275property("ngIf", ctx.displayMode === "full");
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.displayMode === "condensed");
      }
    }, dependencies: [CommonModule, i1.NgForOf, i1.NgIf], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(StageTrackComponent, { className: "StageTrackComponent", filePath: "src\\app\\features\\delivery\\stage-track\\stage-track.component.ts", lineNumber: 141 });
})();

// src/app/features/delivery/edit-panel/delivery-cycle-edit-panel.component.ts
import { Component as Component3, Input as Input3, Output as Output3, EventEmitter as EventEmitter3, ChangeDetectionStrategy as ChangeDetectionStrategy3 } from "@angular/core";
import { Validators, ReactiveFormsModule as ReactiveFormsModule2 } from "@angular/forms";
import { CommonModule as CommonModule3 } from "@angular/common";
import { Subscription as Subscription2 } from "rxjs";
import { filter, take } from "rxjs/operators";

// src/app/shared/pickers/workstream-picker/workstream-picker.component.ts
import { Component as Component2, Input as Input2, Output as Output2, EventEmitter as EventEmitter2, ChangeDetectionStrategy as ChangeDetectionStrategy2 } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { CommonModule as CommonModule2 } from "@angular/common";
import { Subscription } from "rxjs";
import * as i02 from "@angular/core";
import * as i2 from "@angular/common";
import * as i3 from "@angular/forms";
function WorkstreamPickerComponent_ng_container_14_label_1_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "label", 20);
    i02.\u0275\u0275element(1, "input", 21);
    i02.\u0275\u0275text(2);
    i02.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const opt_r1 = i02.\u0275\u0275nextContext().$implicit;
    const ctx_r1 = i02.\u0275\u0275nextContext();
    i02.\u0275\u0275advance();
    i02.\u0275\u0275property("value", opt_r1.value)("formControl", ctx_r1.scopeCtrl);
    i02.\u0275\u0275advance();
    i02.\u0275\u0275textInterpolate1(" ", opt_r1.label, " ");
  }
}
function WorkstreamPickerComponent_ng_container_14_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementContainerStart(0);
    i02.\u0275\u0275template(1, WorkstreamPickerComponent_ng_container_14_label_1_Template, 3, 3, "label", 19);
    i02.\u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const opt_r1 = ctx.$implicit;
    const ctx_r1 = i02.\u0275\u0275nextContext();
    i02.\u0275\u0275advance();
    i02.\u0275\u0275property("ngIf", !(opt_r1.value === "trust" && ctx_r1.isTrustLevelDivision));
  }
}
function WorkstreamPickerComponent_div_15_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "div", 22)(1, "span", 23);
    i02.\u0275\u0275text(2, "Could not load Workstreams.");
    i02.\u0275\u0275elementEnd();
    i02.\u0275\u0275elementStart(3, "span", 24);
    i02.\u0275\u0275text(4);
    i02.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i02.\u0275\u0275nextContext();
    i02.\u0275\u0275advance(4);
    i02.\u0275\u0275textInterpolate(ctx_r1.loadError);
  }
}
function WorkstreamPickerComponent_div_16_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "div", 25);
    i02.\u0275\u0275text(1, " Loading Workstreams\u2026 ");
    i02.\u0275\u0275elementEnd();
  }
}
function WorkstreamPickerComponent_div_17_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "div", 29);
    i02.\u0275\u0275text(1, " No Workstreams found for this scope. ");
    i02.\u0275\u0275elementEnd();
  }
}
function WorkstreamPickerComponent_div_17_table_2_tr_8_span_5_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "span", 37);
    i02.\u0275\u0275text(1, "Inactive");
    i02.\u0275\u0275elementEnd();
  }
}
function WorkstreamPickerComponent_div_17_table_2_tr_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = i02.\u0275\u0275getCurrentView();
    i02.\u0275\u0275elementStart(0, "tr", 33);
    i02.\u0275\u0275listener("click", function WorkstreamPickerComponent_div_17_table_2_tr_8_Template_tr_click_0_listener() {
      const ws_r4 = i02.\u0275\u0275restoreView(_r3).$implicit;
      const ctx_r1 = i02.\u0275\u0275nextContext(3);
      return i02.\u0275\u0275resetView(ctx_r1.selectRow(ws_r4));
    });
    i02.\u0275\u0275elementStart(1, "td", 34);
    i02.\u0275\u0275text(2);
    i02.\u0275\u0275elementEnd();
    i02.\u0275\u0275elementStart(3, "td", 35);
    i02.\u0275\u0275text(4);
    i02.\u0275\u0275template(5, WorkstreamPickerComponent_div_17_table_2_tr_8_span_5_Template, 2, 0, "span", 36);
    i02.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_7_0;
    const ws_r4 = ctx.$implicit;
    const ctx_r1 = i02.\u0275\u0275nextContext(3);
    i02.\u0275\u0275classProp("ws-row-selected", ctx_r1.selectedId === ws_r4.workstream_id)("ws-row-inactive", !ws_r4.active_status);
    i02.\u0275\u0275attribute("aria-selected", ctx_r1.selectedId === ws_r4.workstream_id);
    i02.\u0275\u0275advance(2);
    i02.\u0275\u0275textInterpolate((tmp_7_0 = ws_r4.home_division_name) !== null && tmp_7_0 !== void 0 ? tmp_7_0 : "\u2014");
    i02.\u0275\u0275advance(2);
    i02.\u0275\u0275textInterpolate1(" ", ws_r4.workstream_name, " ");
    i02.\u0275\u0275advance();
    i02.\u0275\u0275property("ngIf", !ws_r4.active_status);
  }
}
function WorkstreamPickerComponent_div_17_table_2_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "table", 30)(1, "thead")(2, "tr")(3, "th", 31);
    i02.\u0275\u0275text(4, "Division");
    i02.\u0275\u0275elementEnd();
    i02.\u0275\u0275elementStart(5, "th", 31);
    i02.\u0275\u0275text(6, "Workstream");
    i02.\u0275\u0275elementEnd()()();
    i02.\u0275\u0275elementStart(7, "tbody");
    i02.\u0275\u0275template(8, WorkstreamPickerComponent_div_17_table_2_tr_8_Template, 6, 8, "tr", 32);
    i02.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i02.\u0275\u0275nextContext(2);
    i02.\u0275\u0275advance(8);
    i02.\u0275\u0275property("ngForOf", ctx_r1.rows);
  }
}
function WorkstreamPickerComponent_div_17_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "div", 26);
    i02.\u0275\u0275template(1, WorkstreamPickerComponent_div_17_div_1_Template, 2, 0, "div", 27)(2, WorkstreamPickerComponent_div_17_table_2_Template, 9, 1, "table", 28);
    i02.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i02.\u0275\u0275nextContext();
    i02.\u0275\u0275advance();
    i02.\u0275\u0275property("ngIf", ctx_r1.rows.length === 0);
    i02.\u0275\u0275advance();
    i02.\u0275\u0275property("ngIf", ctx_r1.rows.length > 0);
  }
}
function WorkstreamPickerComponent_div_18_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "div", 38)(1, "div", 39)(2, "span", 40);
    i02.\u0275\u0275text(3, "Lead:");
    i02.\u0275\u0275elementEnd();
    i02.\u0275\u0275elementStart(4, "span", 41);
    i02.\u0275\u0275text(5);
    i02.\u0275\u0275elementEnd()();
    i02.\u0275\u0275elementStart(6, "div", 39)(7, "span", 40);
    i02.\u0275\u0275text(8, "Division:");
    i02.\u0275\u0275elementEnd();
    i02.\u0275\u0275elementStart(9, "span", 41);
    i02.\u0275\u0275text(10);
    i02.\u0275\u0275elementEnd()();
    i02.\u0275\u0275elementStart(11, "div", 39)(12, "span", 40);
    i02.\u0275\u0275text(13, "Status:");
    i02.\u0275\u0275elementEnd();
    i02.\u0275\u0275elementStart(14, "span", 41);
    i02.\u0275\u0275text(15);
    i02.\u0275\u0275elementEnd()();
    i02.\u0275\u0275elementStart(16, "div", 39)(17, "span", 40);
    i02.\u0275\u0275text(18, "Active cycles:");
    i02.\u0275\u0275elementEnd();
    i02.\u0275\u0275elementStart(19, "span", 41);
    i02.\u0275\u0275text(20);
    i02.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_1_0;
    let tmp_2_0;
    let tmp_5_0;
    const ctx_r1 = i02.\u0275\u0275nextContext();
    i02.\u0275\u0275advance(5);
    i02.\u0275\u0275textInterpolate((tmp_1_0 = ctx_r1.echoWorkstream.lead_display_name) !== null && tmp_1_0 !== void 0 ? tmp_1_0 : "\u2014");
    i02.\u0275\u0275advance(5);
    i02.\u0275\u0275textInterpolate((tmp_2_0 = ctx_r1.echoWorkstream.home_division_name) !== null && tmp_2_0 !== void 0 ? tmp_2_0 : "\u2014");
    i02.\u0275\u0275advance(4);
    i02.\u0275\u0275classProp("ws-echo-inactive", !ctx_r1.echoWorkstream.active_status);
    i02.\u0275\u0275advance();
    i02.\u0275\u0275textInterpolate1(" ", ctx_r1.echoWorkstream.active_status ? "Active" : "Inactive", " ");
    i02.\u0275\u0275advance(5);
    i02.\u0275\u0275textInterpolate((tmp_5_0 = ctx_r1.echoWorkstream.active_cycle_count) !== null && tmp_5_0 !== void 0 ? tmp_5_0 : 0);
  }
}
function WorkstreamPickerComponent_div_19_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "div", 42)(1, "span", 23);
    i02.\u0275\u0275text(2, "This Workstream is inactive and cannot be selected.");
    i02.\u0275\u0275elementEnd();
    i02.\u0275\u0275elementStart(3, "span", 24);
    i02.\u0275\u0275text(4, "A Division Admin must reactivate it before it can be assigned to a cycle.");
    i02.\u0275\u0275elementEnd()();
  }
}
var WorkstreamPickerComponent = class _WorkstreamPickerComponent {
  constructor(deliveryService, cdr) {
    this.deliveryService = deliveryService;
    this.cdr = cdr;
    this.cycleDivisionId = null;
    this.isTrustLevelDivision = false;
    this.currentWorkstreamId = null;
    this.workstreamSelected = new EventEmitter2();
    this.scopeOptions = [
      { value: "division_tree", label: "Cycle's Division" },
      { value: "trust", label: "Trust" },
      { value: "user_divisions", label: "My Divisions" },
      { value: "all", label: "All" }
    ];
    this.scopeCtrl = new FormControl("division_tree");
    this.showInactiveCtrl = new FormControl(false);
    this.rows = [];
    this.loading = false;
    this.loadError = null;
    this.selectedId = null;
    this.echoWorkstream = null;
    this.subs = new Subscription();
  }
  ngOnInit() {
    this.selectedId = this.currentWorkstreamId;
    this.subs.add(this.scopeCtrl.valueChanges.subscribe(() => this.loadWorkstreams()));
    this.subs.add(this.showInactiveCtrl.valueChanges.subscribe(() => this.loadWorkstreams()));
    this.loadWorkstreams();
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
  get canConfirm() {
    return !!this.selectedId && !!this.echoWorkstream && this.echoWorkstream.active_status;
  }
  loadWorkstreams() {
    this.loading = true;
    this.loadError = null;
    this.rows = [];
    this.cdr.markForCheck();
    const scopeType = this.scopeCtrl.value ?? "division_tree";
    const includeInactive = this.showInactiveCtrl.value ?? false;
    const params = {
      scope_type: scopeType,
      include_inactive: includeInactive
    };
    if (scopeType === "division_tree") {
      if (!this.cycleDivisionId) {
        params.scope_type = "trust";
      } else {
        params.scope_division_id = this.cycleDivisionId;
      }
    }
    this.deliveryService.listWorkstreams(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.rows = res.data;
          const match = this.rows.find((w) => w.workstream_id === this.selectedId);
          this.echoWorkstream = match ?? null;
          if (!match) {
            this.selectedId = null;
          }
        } else {
          this.loadError = res.error ?? "Unknown error loading Workstreams.";
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadError = "Network error \u2014 could not reach the MCP server. Check your connection and try again.";
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  selectRow(ws) {
    if (!ws.active_status) {
      this.echoWorkstream = ws;
      this.cdr.markForCheck();
      return;
    }
    this.selectedId = ws.workstream_id;
    this.echoWorkstream = ws;
    this.cdr.markForCheck();
  }
  confirm() {
    if (!this.canConfirm) {
      return;
    }
    this.workstreamSelected.emit(this.echoWorkstream);
  }
  cancel() {
    this.workstreamSelected.emit(null);
  }
  onOverlayClick(event) {
    if (event.target.classList.contains("ws-picker-overlay")) {
      this.cancel();
    }
  }
  static {
    this.\u0275fac = function WorkstreamPickerComponent_Factory(t) {
      return new (t || _WorkstreamPickerComponent)(i02.\u0275\u0275directiveInject(DeliveryService), i02.\u0275\u0275directiveInject(i02.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i02.\u0275\u0275defineComponent({ type: _WorkstreamPickerComponent, selectors: [["app-workstream-picker"]], inputs: { cycleDivisionId: "cycleDivisionId", isTrustLevelDivision: "isTrustLevelDivision", currentWorkstreamId: "currentWorkstreamId" }, outputs: { workstreamSelected: "workstreamSelected" }, standalone: true, features: [i02.\u0275\u0275StandaloneFeature], decls: 25, vars: 8, consts: [[1, "ws-picker-overlay", 3, "click"], ["role", "dialog", "aria-modal", "true", "aria-label", "Select Workstream", 1, "ws-picker-modal"], [1, "ws-picker-header"], [1, "ws-picker-title"], [2, "display", "flex", "align-items", "center", "gap", "12px"], [2, "display", "flex", "align-items", "center", "gap", "5px", "cursor", "pointer", "font-size", "12px", "color", "var(--triarq-color-stone,#8a9ba8)", "white-space", "nowrap"], ["type", "checkbox", 3, "formControl"], ["aria-label", "Close picker", 1, "ws-picker-close", 3, "click"], [1, "ws-scope-row"], [1, "ws-scope-label"], [4, "ngFor", "ngForOf"], ["class", "ws-load-error", "role", "alert", 4, "ngIf"], ["class", "ws-loading", 4, "ngIf"], ["class", "ws-list-container", 4, "ngIf"], ["class", "ws-echo-section", 4, "ngIf"], ["class", "ws-inactive-warning", "role", "alert", 4, "ngIf"], [1, "ws-picker-footer"], [1, "ws-btn-cancel", 3, "click"], [1, "ws-btn-ok", 3, "click", "disabled"], ["class", "ws-scope-option", 4, "ngIf"], [1, "ws-scope-option"], ["type", "radio", 3, "value", "formControl"], ["role", "alert", 1, "ws-load-error"], [1, "ws-error-primary"], [1, "ws-error-secondary"], [1, "ws-loading"], [1, "ws-list-container"], ["class", "ws-empty", 4, "ngIf"], ["class", "ws-table", "role", "grid", 4, "ngIf"], [1, "ws-empty"], ["role", "grid", 1, "ws-table"], ["scope", "col"], ["role", "row", 3, "ws-row-selected", "ws-row-inactive", "click", 4, "ngFor", "ngForOf"], ["role", "row", 3, "click"], [1, "ws-cell-division"], [1, "ws-cell-name"], ["class", "ws-inactive-badge", 4, "ngIf"], [1, "ws-inactive-badge"], [1, "ws-echo-section"], [1, "ws-echo-row"], [1, "ws-echo-label"], [1, "ws-echo-value"], ["role", "alert", 1, "ws-inactive-warning"]], template: function WorkstreamPickerComponent_Template(rf, ctx) {
      if (rf & 1) {
        i02.\u0275\u0275elementStart(0, "div", 0);
        i02.\u0275\u0275listener("click", function WorkstreamPickerComponent_Template_div_click_0_listener($event) {
          return ctx.onOverlayClick($event);
        });
        i02.\u0275\u0275elementStart(1, "div", 1)(2, "div", 2)(3, "h2", 3);
        i02.\u0275\u0275text(4, "Select Workstream");
        i02.\u0275\u0275elementEnd();
        i02.\u0275\u0275elementStart(5, "div", 4)(6, "label", 5);
        i02.\u0275\u0275element(7, "input", 6);
        i02.\u0275\u0275text(8, " Show inactive ");
        i02.\u0275\u0275elementEnd();
        i02.\u0275\u0275elementStart(9, "button", 7);
        i02.\u0275\u0275listener("click", function WorkstreamPickerComponent_Template_button_click_9_listener() {
          return ctx.cancel();
        });
        i02.\u0275\u0275text(10, "\u2715");
        i02.\u0275\u0275elementEnd()()();
        i02.\u0275\u0275elementStart(11, "div", 8)(12, "span", 9);
        i02.\u0275\u0275text(13, "Scope:");
        i02.\u0275\u0275elementEnd();
        i02.\u0275\u0275template(14, WorkstreamPickerComponent_ng_container_14_Template, 2, 1, "ng-container", 10);
        i02.\u0275\u0275elementEnd();
        i02.\u0275\u0275template(15, WorkstreamPickerComponent_div_15_Template, 5, 1, "div", 11)(16, WorkstreamPickerComponent_div_16_Template, 2, 0, "div", 12)(17, WorkstreamPickerComponent_div_17_Template, 3, 2, "div", 13)(18, WorkstreamPickerComponent_div_18_Template, 21, 6, "div", 14)(19, WorkstreamPickerComponent_div_19_Template, 5, 0, "div", 15);
        i02.\u0275\u0275elementStart(20, "div", 16)(21, "button", 17);
        i02.\u0275\u0275listener("click", function WorkstreamPickerComponent_Template_button_click_21_listener() {
          return ctx.cancel();
        });
        i02.\u0275\u0275text(22, "Cancel");
        i02.\u0275\u0275elementEnd();
        i02.\u0275\u0275elementStart(23, "button", 18);
        i02.\u0275\u0275listener("click", function WorkstreamPickerComponent_Template_button_click_23_listener() {
          return ctx.confirm();
        });
        i02.\u0275\u0275text(24, " OK ");
        i02.\u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        i02.\u0275\u0275advance(7);
        i02.\u0275\u0275property("formControl", ctx.showInactiveCtrl);
        i02.\u0275\u0275advance(7);
        i02.\u0275\u0275property("ngForOf", ctx.scopeOptions);
        i02.\u0275\u0275advance();
        i02.\u0275\u0275property("ngIf", ctx.loadError);
        i02.\u0275\u0275advance();
        i02.\u0275\u0275property("ngIf", ctx.loading && !ctx.loadError);
        i02.\u0275\u0275advance();
        i02.\u0275\u0275property("ngIf", !ctx.loading && !ctx.loadError);
        i02.\u0275\u0275advance();
        i02.\u0275\u0275property("ngIf", ctx.echoWorkstream);
        i02.\u0275\u0275advance();
        i02.\u0275\u0275property("ngIf", ctx.echoWorkstream && !ctx.echoWorkstream.active_status);
        i02.\u0275\u0275advance(4);
        i02.\u0275\u0275property("disabled", !ctx.canConfirm);
      }
    }, dependencies: [CommonModule2, i2.NgForOf, i2.NgIf, ReactiveFormsModule, i3.DefaultValueAccessor, i3.CheckboxControlValueAccessor, i3.RadioControlValueAccessor, i3.NgControlStatus, i3.FormControlDirective], styles: ["\n\n.ws-picker-overlay[_ngcontent-%COMP%] {\n  position: fixed;\n  inset: 0;\n  background: rgba(0, 0, 0, 0.55);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 1000;\n}\n.ws-picker-modal[_ngcontent-%COMP%] {\n  background: #fff;\n  border-radius: 10px;\n  width: 620px;\n  max-width: 95vw;\n  max-height: 80vh;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);\n}\n.ws-picker-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: var(--triarq-space-md) var(--triarq-space-lg);\n  border-bottom: 1px solid #e5e5e5;\n}\n.ws-picker-title[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-h4, 16px);\n  font-weight: var(--triarq-font-weight-bold);\n  color: var(--triarq-color-text-primary);\n  margin: 0;\n}\n.ws-picker-close[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 18px;\n  color: var(--triarq-color-text-secondary);\n  line-height: 1;\n}\n.ws-scope-row[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: var(--triarq-space-md);\n  flex-wrap: wrap;\n  padding: var(--triarq-space-sm) var(--triarq-space-lg);\n  border-bottom: 1px solid #f0f0f0;\n  background: #fafafa;\n}\n.ws-scope-label[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-caption);\n  font-weight: var(--triarq-font-weight-bold);\n  color: var(--triarq-color-text-secondary);\n}\n.ws-scope-option[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  font-size: var(--triarq-text-caption);\n  cursor: pointer;\n}\n.ws-inactive-toggle[_ngcontent-%COMP%] {\n  padding: var(--triarq-space-xs) var(--triarq-space-lg);\n  background: #fafafa;\n}\n.ws-toggle-label[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-caption);\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  cursor: pointer;\n}\n.ws-load-error[_ngcontent-%COMP%], .ws-loading[_ngcontent-%COMP%], .ws-empty[_ngcontent-%COMP%] {\n  padding: var(--triarq-space-md) var(--triarq-space-lg);\n  font-size: var(--triarq-text-body);\n}\n.ws-error-primary[_ngcontent-%COMP%] {\n  display: block;\n  color: var(--triarq-color-error, #e53935);\n}\n.ws-error-secondary[_ngcontent-%COMP%] {\n  display: block;\n  font-size: var(--triarq-text-caption);\n  color: var(--triarq-color-text-secondary);\n  margin-top: 2px;\n}\n.ws-list-container[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n}\n.ws-table[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n}\n.ws-table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  text-align: left;\n  font-size: var(--triarq-text-caption);\n  font-weight: var(--triarq-font-weight-bold);\n  color: var(--triarq-color-text-secondary);\n  padding: var(--triarq-space-xs) var(--triarq-space-md);\n  border-bottom: 1px solid #e5e5e5;\n  position: sticky;\n  top: 0;\n  background: #fff;\n}\n.ws-table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: var(--triarq-space-xs) var(--triarq-space-md);\n  font-size: var(--triarq-text-body);\n  border-bottom: 1px solid #f5f5f5;\n  vertical-align: middle;\n}\n.ws-table[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%] {\n  cursor: pointer;\n}\n.ws-row-selected[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  background: rgba(37, 112, 153, 0.1);\n}\n.ws-row-inactive[_ngcontent-%COMP%] {\n  opacity: 0.6;\n  cursor: default;\n}\n.ws-row-inactive[_ngcontent-%COMP%]:hover   td[_ngcontent-%COMP%] {\n  background: none;\n}\n.ws-table[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]:not(.ws-row-inactive):hover   td[_ngcontent-%COMP%] {\n  background: #f5f9fb;\n}\n.ws-inactive-badge[_ngcontent-%COMP%] {\n  display: inline-block;\n  background: rgba(0, 0, 0, 0.08);\n  color: var(--triarq-color-text-secondary);\n  font-size: 10px;\n  border-radius: 999px;\n  padding: 1px 6px;\n  margin-left: 6px;\n  vertical-align: middle;\n}\n.ws-echo-section[_ngcontent-%COMP%] {\n  border-top: 1px solid #e5e5e5;\n  background: #f5f9fb;\n  padding: var(--triarq-space-sm) var(--triarq-space-lg);\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: var(--triarq-space-xs);\n}\n.ws-echo-row[_ngcontent-%COMP%] {\n  display: contents;\n}\n.ws-echo-label[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-caption);\n  color: var(--triarq-color-text-secondary);\n}\n.ws-echo-value[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-caption);\n  color: var(--triarq-color-text-primary);\n}\n.ws-echo-inactive[_ngcontent-%COMP%] {\n  color: var(--triarq-color-error, #e53935);\n}\n.ws-inactive-warning[_ngcontent-%COMP%] {\n  padding: var(--triarq-space-xs) var(--triarq-space-lg);\n  background: #fff8f0;\n  border-top: 1px solid #ffe0b2;\n}\n.ws-picker-footer[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n  gap: var(--triarq-space-sm);\n  padding: var(--triarq-space-sm) var(--triarq-space-lg);\n  border-top: 1px solid #e5e5e5;\n}\n.ws-btn-cancel[_ngcontent-%COMP%] {\n  background: none;\n  border: 1px solid #ccc;\n  border-radius: 5px;\n  padding: var(--triarq-space-xs) var(--triarq-space-md);\n  cursor: pointer;\n  font-size: var(--triarq-text-body);\n}\n.ws-btn-ok[_ngcontent-%COMP%] {\n  background: var(--triarq-color-primary, #257099);\n  color: #fff;\n  border: none;\n  border-radius: 5px;\n  padding: var(--triarq-space-xs) var(--triarq-space-md);\n  cursor: pointer;\n  font-size: var(--triarq-text-body);\n  font-weight: var(--triarq-font-weight-bold);\n}\n.ws-btn-ok[_ngcontent-%COMP%]:disabled {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\n/*# sourceMappingURL=workstream-picker.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i02.\u0275setClassDebugInfo(WorkstreamPickerComponent, { className: "WorkstreamPickerComponent", filePath: "src\\app\\shared\\pickers\\workstream-picker\\workstream-picker.component.ts", lineNumber: 283 });
})();

// src/app/features/delivery/edit-panel/delivery-cycle-edit-panel.component.ts
import * as i03 from "@angular/core";
import * as i12 from "@angular/forms";
import * as i5 from "@angular/common";
function DeliveryCycleEditPanelComponent_ion_spinner_9_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275element(0, "ion-spinner", 34);
  }
}
function DeliveryCycleEditPanelComponent_div_19_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "div", 35);
    i03.\u0275\u0275text(1, "Delivery Cycle Title is required.");
    i03.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleEditPanelComponent_option_28_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "option", 36);
    i03.\u0275\u0275text(1);
    i03.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const d_r1 = ctx.$implicit;
    i03.\u0275\u0275property("value", d_r1.id);
    i03.\u0275\u0275advance();
    i03.\u0275\u0275textInterpolate1(" ", d_r1.division_name, " ");
  }
}
function DeliveryCycleEditPanelComponent_div_29_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "div", 35);
    i03.\u0275\u0275text(1, "Division is required.");
    i03.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleEditPanelComponent_div_30_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "div", 37);
    i03.\u0275\u0275text(1);
    i03.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i03.\u0275\u0275nextContext();
    i03.\u0275\u0275advance();
    i03.\u0275\u0275textInterpolate1(" ", ctx_r1.approverChangeNote, " ");
  }
}
function DeliveryCycleEditPanelComponent_div_43_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "div", 37);
    i03.\u0275\u0275text(1);
    i03.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i03.\u0275\u0275nextContext();
    i03.\u0275\u0275advance();
    i03.\u0275\u0275textInterpolate1(" ", ctx_r1.workstreamClearedNote, " ");
  }
}
function DeliveryCycleEditPanelComponent_span_45_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "span", 38);
    i03.\u0275\u0275text(1, " \u2014 Select Workstream \u2014 ");
    i03.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleEditPanelComponent_span_46_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "span")(1, "span", 39);
    i03.\u0275\u0275text(2);
    i03.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i03.\u0275\u0275nextContext();
    i03.\u0275\u0275advance(2);
    i03.\u0275\u0275textInterpolate(ctx_r1.selectedWorkstream.workstream_name);
  }
}
function DeliveryCycleEditPanelComponent_button_47_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = i03.\u0275\u0275getCurrentView();
    i03.\u0275\u0275elementStart(0, "button", 40);
    i03.\u0275\u0275listener("click", function DeliveryCycleEditPanelComponent_button_47_Template_button_click_0_listener() {
      i03.\u0275\u0275restoreView(_r3);
      const ctx_r1 = i03.\u0275\u0275nextContext();
      return i03.\u0275\u0275resetView(ctx_r1.clearWorkstream());
    });
    i03.\u0275\u0275text(1, "\u2715 Remove");
    i03.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleEditPanelComponent_div_48_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "div", 35);
    i03.\u0275\u0275text(1, "Delivery Workstream is required.");
    i03.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleEditPanelComponent_div_63_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "div", 35);
    i03.\u0275\u0275text(1, "Tier Classification is required.");
    i03.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleEditPanelComponent_div_64_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "div", 37);
    i03.\u0275\u0275text(1, " Changing Tier may affect gate requirements. Existing gate records are not modified. ");
    i03.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleEditPanelComponent_option_71_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "option", 36);
    i03.\u0275\u0275text(1);
    i03.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const u_r4 = ctx.$implicit;
    i03.\u0275\u0275property("value", u_r4.id);
    i03.\u0275\u0275advance();
    i03.\u0275\u0275textInterpolate(u_r4.display_name);
  }
}
function DeliveryCycleEditPanelComponent_option_80_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "option", 36);
    i03.\u0275\u0275text(1);
    i03.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const u_r5 = ctx.$implicit;
    i03.\u0275\u0275property("value", u_r5.id);
    i03.\u0275\u0275advance();
    i03.\u0275\u0275textInterpolate(u_r5.display_name);
  }
}
function DeliveryCycleEditPanelComponent_div_89_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "div", 41);
    i03.\u0275\u0275text(1);
    i03.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i03.\u0275\u0275nextContext();
    i03.\u0275\u0275advance();
    i03.\u0275\u0275textInterpolate1(" ", ctx_r1.saveError, " ");
  }
}
function DeliveryCycleEditPanelComponent_app_workstream_picker_90_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = i03.\u0275\u0275getCurrentView();
    i03.\u0275\u0275elementStart(0, "app-workstream-picker", 42);
    i03.\u0275\u0275listener("workstreamSelected", function DeliveryCycleEditPanelComponent_app_workstream_picker_90_Template_app_workstream_picker_workstreamSelected_0_listener($event) {
      i03.\u0275\u0275restoreView(_r6);
      const ctx_r1 = i03.\u0275\u0275nextContext();
      return i03.\u0275\u0275resetView(ctx_r1.onWorkstreamSelected($event));
    });
    i03.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_1_0;
    let tmp_2_0;
    const ctx_r1 = i03.\u0275\u0275nextContext();
    i03.\u0275\u0275property("cycleDivisionId", ((tmp_1_0 = ctx_r1.form.get("division_id")) == null ? null : tmp_1_0.value) || null)("currentWorkstreamId", (tmp_2_0 = ctx_r1.selectedWorkstream == null ? null : ctx_r1.selectedWorkstream.workstream_id) !== null && tmp_2_0 !== void 0 ? tmp_2_0 : null);
  }
}
var DeliveryCycleEditPanelComponent = class _DeliveryCycleEditPanelComponent {
  get f() {
    return this.form.controls;
  }
  // DS users filtered to currently selected Division.
  get dsUsers() {
    const divId = this.form.get("division_id")?.value;
    return this.allUsers.filter((u) => u.system_role === "ds" && (!divId || u.division_id === divId));
  }
  // CB users filtered to currently selected Division.
  get cbUsers() {
    const divId = this.form.get("division_id")?.value;
    return this.allUsers.filter((u) => u.system_role === "cb" && (!divId || u.division_id === divId));
  }
  // Whether the cycle has existing gate records — used for D-228 Tier change warning.
  get cycleHasGateRecords() {
    return (this.cycle.gate_records?.length ?? 0) > 0 || (this.cycle.milestone_dates?.length ?? 0) > 0;
  }
  constructor(fb, delivery, profile, mcp, cdr) {
    this.fb = fb;
    this.delivery = delivery;
    this.profile = profile;
    this.mcp = mcp;
    this.cdr = cdr;
    this.allUsers = [];
    this.saved = new EventEmitter3();
    this.cancelled = new EventEmitter3();
    this.saving = false;
    this.saveError = "";
    this.availableDivisions = [];
    this.showWorkstreamPicker = false;
    this.selectedWorkstream = null;
    this.workstreamClearedNote = "";
    this.approverChangeNote = "";
    this.showTierChangeWarning = false;
    this.originalTier = "";
    this.workstreamRequired = false;
    this.subs = new Subscription2();
  }
  ngOnInit() {
    this.form = this.fb.group({
      cycle_title: [this.cycle.cycle_title, [Validators.required, Validators.maxLength(120)]],
      division_id: [this.cycle.division_id, Validators.required],
      outcome_statement: [this.cycle.outcome_statement ?? ""],
      tier_classification: [this.cycle.tier_classification, Validators.required],
      assigned_ds_user_id: [this.cycle.assigned_ds_user_id ?? ""],
      assigned_cb_user_id: [this.cycle.assigned_cb_user_id ?? ""],
      jira_epic_key: [this.cycle.jira_epic_key ?? ""]
    });
    if (this.cycle.workstream_id) {
      this.selectedWorkstream = {
        workstream_id: this.cycle.workstream_id,
        workstream_name: this.cycle.workstream?.workstream_name ?? "(Workstream)",
        home_division_id: this.cycle.division_id,
        home_division_name: null,
        active_status: true,
        active_cycle_count: null,
        lead_display_name: null
      };
    }
    this.originalTier = this.cycle.tier_classification;
    this.loadDivisions();
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
  // ── Division loading ─────────────────────────────────────────────────────────
  loadDivisions() {
    this.subs.add(this.profile.profile$.pipe(filter((p) => p !== null), take(1)).subscribe((profile) => {
      if (!profile?.id) {
        return;
      }
      this.subs.add(this.mcp.call("division", "get_user_divisions", { user_id: profile.id }).subscribe((res) => {
        this.availableDivisions = res.data?.all_accessible_divisions ?? [];
        this.cdr.markForCheck();
      }));
    }));
  }
  // ── Division change (spec 2.4) ────────────────────────────────────────────────
  onDivisionChange() {
    const newDivisionId = this.form.get("division_id")?.value;
    this.workstreamClearedNote = "";
    if (this.selectedWorkstream) {
      const wsHomeDivId = this.selectedWorkstream.home_division_id;
      if (wsHomeDivId && wsHomeDivId !== newDivisionId) {
        this.selectedWorkstream = null;
        this.workstreamClearedNote = "Workstream cleared \u2014 the current Workstream is not available in the selected Division. Please select a new Workstream.";
      }
    }
    this.cdr.markForCheck();
  }
  // ── Tier change — D-228 ───────────────────────────────────────────────────────
  onTierChange() {
    const currentTier = this.form.get("tier_classification")?.value;
    this.showTierChangeWarning = this.cycleHasGateRecords && currentTier !== "" && currentTier !== this.originalTier;
    this.cdr.markForCheck();
  }
  // ── Workstream picker ─────────────────────────────────────────────────────────
  openWorkstreamPicker() {
    this.showWorkstreamPicker = true;
    this.cdr.markForCheck();
  }
  onWorkstreamSelected(ws) {
    this.showWorkstreamPicker = false;
    this.workstreamClearedNote = "";
    if (ws) {
      this.selectedWorkstream = ws;
    }
    this.cdr.markForCheck();
  }
  clearWorkstream() {
    this.selectedWorkstream = null;
    this.workstreamClearedNote = "";
    this.cdr.markForCheck();
  }
  // ── Save ──────────────────────────────────────────────────────────────────────
  onSave() {
    this.form.markAllAsTouched();
    this.workstreamRequired = true;
    if (this.form.invalid || this.saving) {
      return;
    }
    this.saving = true;
    this.saveError = "";
    this.cdr.markForCheck();
    const v = this.form.value;
    const payload = {
      delivery_cycle_id: this.cycle.delivery_cycle_id
    };
    if (v.cycle_title.trim() !== this.cycle.cycle_title) {
      payload.cycle_title = v.cycle_title.trim();
    }
    if (v.division_id !== this.cycle.division_id) {
      payload.division_id = v.division_id;
    }
    const newOutcome = v.outcome_statement?.trim() || null;
    if (newOutcome !== (this.cycle.outcome_statement ?? null)) {
      payload.outcome_statement = newOutcome;
    }
    const newWorkstreamId = this.selectedWorkstream?.workstream_id ?? null;
    if (newWorkstreamId !== (this.cycle.workstream_id ?? null)) {
      payload.workstream_id = newWorkstreamId;
    }
    if (v.tier_classification !== this.cycle.tier_classification) {
      payload.tier_classification = v.tier_classification;
    }
    const newDsId = v.assigned_ds_user_id || null;
    if (newDsId !== (this.cycle.assigned_ds_user_id ?? null)) {
      payload.assigned_ds_user_id = newDsId;
    }
    const newCbId = v.assigned_cb_user_id || null;
    if (newCbId !== (this.cycle.assigned_cb_user_id ?? null)) {
      payload.assigned_cb_user_id = newCbId;
    }
    const newJira = v.jira_epic_key?.trim() || null;
    if (newJira !== (this.cycle.jira_epic_key ?? null)) {
      payload.jira_epic_key = newJira;
    }
    const changedKeys = Object.keys(payload).filter((k) => k !== "delivery_cycle_id");
    if (changedKeys.length === 0) {
      this.saving = false;
      this.cdr.markForCheck();
      this.cancelled.emit();
      return;
    }
    this.delivery.updateCycle(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.saved.emit();
        } else {
          this.saveError = res.error ?? "Save failed. Please try again.";
        }
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.saveError = err?.error ?? "Save failed. Please try again.";
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Cancel ────────────────────────────────────────────────────────────────────
  onCancel() {
    this.cancelled.emit();
  }
  static {
    this.\u0275fac = function DeliveryCycleEditPanelComponent_Factory(t) {
      return new (t || _DeliveryCycleEditPanelComponent)(i03.\u0275\u0275directiveInject(i12.FormBuilder), i03.\u0275\u0275directiveInject(DeliveryService), i03.\u0275\u0275directiveInject(UserProfileService), i03.\u0275\u0275directiveInject(McpService), i03.\u0275\u0275directiveInject(i03.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i03.\u0275\u0275defineComponent({ type: _DeliveryCycleEditPanelComponent, selectors: [["app-delivery-cycle-edit-panel"]], inputs: { cycle: "cycle", allUsers: "allUsers" }, outputs: { saved: "saved", cancelled: "cancelled" }, standalone: true, features: [i03.\u0275\u0275StandaloneFeature], decls: 91, vars: 20, consts: [[1, "ep-overlay"], [1, "ep-panel"], [1, "ep-header"], [1, "ep-title"], [1, "ep-header-actions"], ["type", "button", 1, "ep-btn-cancel-header", 3, "click", "disabled"], ["type", "button", 1, "ep-btn-save", 3, "click", "disabled"], ["name", "crescent", "style", "width:14px;height:14px;vertical-align:middle;margin-right:4px;", 4, "ngIf"], [1, "ep-body"], ["novalidate", "", 3, "formGroup"], [1, "ep-field"], [1, "ep-label"], [1, "ep-required"], ["formControlName", "cycle_title", "type", "text", "maxlength", "120", 1, "ep-input"], ["class", "ep-field-error", 4, "ngIf"], ["formControlName", "division_id", 1, "ep-input", 3, "change"], ["value", ""], [3, "value", 4, "ngFor", "ngForOf"], ["class", "ep-amber-note", 4, "ngIf"], ["formControlName", "outcome_statement", "rows", "3", 1, "ep-input", "ep-textarea"], [1, "ep-hint"], ["type", "button", 1, "ep-picker-trigger", 3, "click"], ["class", "ep-picker-placeholder", 4, "ngIf"], [4, "ngIf"], ["type", "button", "class", "ep-chip-remove", 3, "click", 4, "ngIf"], ["formControlName", "tier_classification", 1, "ep-input", 3, "change"], ["value", "tier_1"], ["value", "tier_2"], ["value", "tier_3"], ["formControlName", "assigned_ds_user_id", 1, "ep-input"], ["formControlName", "assigned_cb_user_id", 1, "ep-input"], ["formControlName", "jira_epic_key", "type", "text", "placeholder", "e.g. PS-2026-041", 1, "ep-input"], ["class", "ep-save-error", "role", "alert", 4, "ngIf"], [3, "cycleDivisionId", "currentWorkstreamId", "workstreamSelected", 4, "ngIf"], ["name", "crescent", 2, "width", "14px", "height", "14px", "vertical-align", "middle", "margin-right", "4px"], [1, "ep-field-error"], [3, "value"], [1, "ep-amber-note"], [1, "ep-picker-placeholder"], [1, "ep-entity-chip"], ["type", "button", 1, "ep-chip-remove", 3, "click"], ["role", "alert", 1, "ep-save-error"], [3, "workstreamSelected", "cycleDivisionId", "currentWorkstreamId"]], template: function DeliveryCycleEditPanelComponent_Template(rf, ctx) {
      if (rf & 1) {
        i03.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "h2", 3);
        i03.\u0275\u0275text(4, "Edit Delivery Cycle");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(5, "div", 4)(6, "button", 5);
        i03.\u0275\u0275listener("click", function DeliveryCycleEditPanelComponent_Template_button_click_6_listener() {
          return ctx.onCancel();
        });
        i03.\u0275\u0275text(7, " Cancel ");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(8, "button", 6);
        i03.\u0275\u0275listener("click", function DeliveryCycleEditPanelComponent_Template_button_click_8_listener() {
          return ctx.onSave();
        });
        i03.\u0275\u0275template(9, DeliveryCycleEditPanelComponent_ion_spinner_9_Template, 1, 0, "ion-spinner", 7);
        i03.\u0275\u0275text(10);
        i03.\u0275\u0275elementEnd()()();
        i03.\u0275\u0275elementStart(11, "div", 8)(12, "form", 9)(13, "div", 10)(14, "label", 11);
        i03.\u0275\u0275text(15, " Delivery Cycle Title ");
        i03.\u0275\u0275elementStart(16, "span", 12);
        i03.\u0275\u0275text(17, "*");
        i03.\u0275\u0275elementEnd()();
        i03.\u0275\u0275element(18, "input", 13);
        i03.\u0275\u0275template(19, DeliveryCycleEditPanelComponent_div_19_Template, 2, 0, "div", 14);
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(20, "div", 10)(21, "label", 11);
        i03.\u0275\u0275text(22, " Division ");
        i03.\u0275\u0275elementStart(23, "span", 12);
        i03.\u0275\u0275text(24, "*");
        i03.\u0275\u0275elementEnd()();
        i03.\u0275\u0275elementStart(25, "select", 15);
        i03.\u0275\u0275listener("change", function DeliveryCycleEditPanelComponent_Template_select_change_25_listener() {
          return ctx.onDivisionChange();
        });
        i03.\u0275\u0275elementStart(26, "option", 16);
        i03.\u0275\u0275text(27, "\u2014 Select Division \u2014");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275template(28, DeliveryCycleEditPanelComponent_option_28_Template, 2, 2, "option", 17);
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275template(29, DeliveryCycleEditPanelComponent_div_29_Template, 2, 0, "div", 14)(30, DeliveryCycleEditPanelComponent_div_30_Template, 2, 1, "div", 18);
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(31, "div", 10)(32, "label", 11);
        i03.\u0275\u0275text(33, "Outcome Statement");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(34, "textarea", 19);
        i03.\u0275\u0275text(35, "              ");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(36, "div", 20);
        i03.\u0275\u0275text(37, "Should be set before Brief Review Gate.");
        i03.\u0275\u0275elementEnd()();
        i03.\u0275\u0275elementStart(38, "div", 10)(39, "label", 11);
        i03.\u0275\u0275text(40, " Delivery Workstream ");
        i03.\u0275\u0275elementStart(41, "span", 12);
        i03.\u0275\u0275text(42, "*");
        i03.\u0275\u0275elementEnd()();
        i03.\u0275\u0275template(43, DeliveryCycleEditPanelComponent_div_43_Template, 2, 1, "div", 18);
        i03.\u0275\u0275elementStart(44, "button", 21);
        i03.\u0275\u0275listener("click", function DeliveryCycleEditPanelComponent_Template_button_click_44_listener() {
          return ctx.openWorkstreamPicker();
        });
        i03.\u0275\u0275template(45, DeliveryCycleEditPanelComponent_span_45_Template, 2, 0, "span", 22)(46, DeliveryCycleEditPanelComponent_span_46_Template, 3, 1, "span", 23);
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275template(47, DeliveryCycleEditPanelComponent_button_47_Template, 2, 0, "button", 24)(48, DeliveryCycleEditPanelComponent_div_48_Template, 2, 0, "div", 14);
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(49, "div", 10)(50, "label", 11);
        i03.\u0275\u0275text(51, " Tier Classification ");
        i03.\u0275\u0275elementStart(52, "span", 12);
        i03.\u0275\u0275text(53, "*");
        i03.\u0275\u0275elementEnd()();
        i03.\u0275\u0275elementStart(54, "select", 25);
        i03.\u0275\u0275listener("change", function DeliveryCycleEditPanelComponent_Template_select_change_54_listener() {
          return ctx.onTierChange();
        });
        i03.\u0275\u0275elementStart(55, "option", 16);
        i03.\u0275\u0275text(56, "\u2014 Select Tier \u2014");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(57, "option", 26);
        i03.\u0275\u0275text(58, "Tier 1 \u2014 Fast Lane");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(59, "option", 27);
        i03.\u0275\u0275text(60, "Tier 2 \u2014 Structured");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(61, "option", 28);
        i03.\u0275\u0275text(62, "Tier 3 \u2014 Governed");
        i03.\u0275\u0275elementEnd()();
        i03.\u0275\u0275template(63, DeliveryCycleEditPanelComponent_div_63_Template, 2, 0, "div", 14)(64, DeliveryCycleEditPanelComponent_div_64_Template, 2, 0, "div", 18);
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(65, "div", 10)(66, "label", 11);
        i03.\u0275\u0275text(67, "Assigned Domain Strategist");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(68, "select", 29)(69, "option", 16);
        i03.\u0275\u0275text(70, "\u2014 Unassigned \u2014");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275template(71, DeliveryCycleEditPanelComponent_option_71_Template, 2, 2, "option", 17);
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(72, "div", 20);
        i03.\u0275\u0275text(73, "Required before Brief Review Gate.");
        i03.\u0275\u0275elementEnd()();
        i03.\u0275\u0275elementStart(74, "div", 10)(75, "label", 11);
        i03.\u0275\u0275text(76, "Assigned Capability Builder");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(77, "select", 30)(78, "option", 16);
        i03.\u0275\u0275text(79, "\u2014 Unassigned \u2014");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275template(80, DeliveryCycleEditPanelComponent_option_80_Template, 2, 2, "option", 17);
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275elementStart(81, "div", 20);
        i03.\u0275\u0275text(82, "Required before Go to Build Gate.");
        i03.\u0275\u0275elementEnd()();
        i03.\u0275\u0275elementStart(83, "div", 10)(84, "label", 11);
        i03.\u0275\u0275text(85, "Jira Epic Link");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275element(86, "input", 31);
        i03.\u0275\u0275elementStart(87, "div", 20);
        i03.\u0275\u0275text(88, "Required before Go to Build Gate.");
        i03.\u0275\u0275elementEnd()();
        i03.\u0275\u0275template(89, DeliveryCycleEditPanelComponent_div_89_Template, 2, 1, "div", 32);
        i03.\u0275\u0275elementEnd()()()();
        i03.\u0275\u0275template(90, DeliveryCycleEditPanelComponent_app_workstream_picker_90_Template, 1, 2, "app-workstream-picker", 33);
      }
      if (rf & 2) {
        i03.\u0275\u0275advance(6);
        i03.\u0275\u0275property("disabled", ctx.saving);
        i03.\u0275\u0275advance(2);
        i03.\u0275\u0275property("disabled", ctx.form.invalid || ctx.saving);
        i03.\u0275\u0275advance();
        i03.\u0275\u0275property("ngIf", ctx.saving);
        i03.\u0275\u0275advance();
        i03.\u0275\u0275textInterpolate1(" ", ctx.saving ? "Saving\u2026" : "Save", " ");
        i03.\u0275\u0275advance(2);
        i03.\u0275\u0275property("formGroup", ctx.form);
        i03.\u0275\u0275advance(7);
        i03.\u0275\u0275property("ngIf", ctx.f["cycle_title"].invalid && ctx.f["cycle_title"].touched);
        i03.\u0275\u0275advance(9);
        i03.\u0275\u0275property("ngForOf", ctx.availableDivisions);
        i03.\u0275\u0275advance();
        i03.\u0275\u0275property("ngIf", ctx.f["division_id"].invalid && ctx.f["division_id"].touched);
        i03.\u0275\u0275advance();
        i03.\u0275\u0275property("ngIf", ctx.approverChangeNote);
        i03.\u0275\u0275advance(13);
        i03.\u0275\u0275property("ngIf", ctx.workstreamClearedNote);
        i03.\u0275\u0275advance(2);
        i03.\u0275\u0275property("ngIf", !ctx.selectedWorkstream);
        i03.\u0275\u0275advance();
        i03.\u0275\u0275property("ngIf", ctx.selectedWorkstream);
        i03.\u0275\u0275advance();
        i03.\u0275\u0275property("ngIf", ctx.selectedWorkstream);
        i03.\u0275\u0275advance();
        i03.\u0275\u0275property("ngIf", ctx.workstreamRequired && !ctx.selectedWorkstream);
        i03.\u0275\u0275advance(15);
        i03.\u0275\u0275property("ngIf", ctx.f["tier_classification"].invalid && ctx.f["tier_classification"].touched);
        i03.\u0275\u0275advance();
        i03.\u0275\u0275property("ngIf", ctx.showTierChangeWarning);
        i03.\u0275\u0275advance(7);
        i03.\u0275\u0275property("ngForOf", ctx.dsUsers);
        i03.\u0275\u0275advance(9);
        i03.\u0275\u0275property("ngForOf", ctx.cbUsers);
        i03.\u0275\u0275advance(9);
        i03.\u0275\u0275property("ngIf", ctx.saveError);
        i03.\u0275\u0275advance();
        i03.\u0275\u0275property("ngIf", ctx.showWorkstreamPicker);
      }
    }, dependencies: [CommonModule3, i5.NgForOf, i5.NgIf, ReactiveFormsModule2, i12.\u0275NgNoValidate, i12.NgSelectOption, i12.\u0275NgSelectMultipleOption, i12.DefaultValueAccessor, i12.SelectControlValueAccessor, i12.NgControlStatus, i12.NgControlStatusGroup, i12.MaxLengthValidator, i12.FormGroupDirective, i12.FormControlName, IonicModule, IonSpinner, WorkstreamPickerComponent], styles: ["\n\n.ep-overlay[_ngcontent-%COMP%] {\n  position: absolute;\n  inset: 0;\n  background: rgba(255, 255, 255, 0.98);\n  z-index: 10;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n.ep-panel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  overflow: hidden;\n}\n.ep-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0 20px;\n  height: 64px;\n  flex-shrink: 0;\n  background: #12274A;\n}\n.ep-title[_ngcontent-%COMP%] {\n  margin: 0;\n  font: 700 20px/1.2 Roboto, sans-serif;\n  color: #fff;\n}\n.ep-header-actions[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n}\n.ep-btn-cancel-header[_ngcontent-%COMP%] {\n  background: none;\n  border: 1.5px solid rgba(255, 255, 255, 0.5);\n  border-radius: 5px;\n  padding: 7px 16px;\n  font: 500 13px Roboto, sans-serif;\n  color: rgba(255, 255, 255, 0.85);\n  cursor: pointer;\n}\n.ep-btn-cancel-header[_ngcontent-%COMP%]:hover:not(:disabled) {\n  border-color: #fff;\n  color: #fff;\n}\n.ep-btn-cancel-header[_ngcontent-%COMP%]:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n.ep-btn-save[_ngcontent-%COMP%] {\n  background: #257099;\n  border: none;\n  border-radius: 5px;\n  padding: 7px 18px;\n  font: 500 13px Roboto, sans-serif;\n  color: #fff;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n}\n.ep-btn-save[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: #1d5878;\n}\n.ep-btn-save[_ngcontent-%COMP%]:disabled {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\n.ep-body[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  padding: 24px;\n}\n.ep-field[_ngcontent-%COMP%] {\n  margin-bottom: 16px;\n}\n.ep-label[_ngcontent-%COMP%] {\n  display: block;\n  margin-bottom: 6px;\n  font: 500 13px/1.3 Roboto, sans-serif;\n  color: #5A5A5A;\n}\n.ep-required[_ngcontent-%COMP%] {\n  color: #E96127;\n  margin-left: 2px;\n}\n.ep-input[_ngcontent-%COMP%] {\n  width: 100%;\n  box-sizing: border-box;\n  border: 1.5px solid #D0D0D0;\n  border-radius: 5px;\n  padding: 10px 12px;\n  font: 400 14px Roboto, sans-serif;\n  color: #262626;\n  background: #fff;\n}\n.ep-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: #257099;\n  box-shadow: 0 0 0 3px rgba(37, 112, 153, 0.15);\n}\nselect.ep-input[_ngcontent-%COMP%] {\n  appearance: auto;\n}\n.ep-textarea[_ngcontent-%COMP%] {\n  min-height: 80px;\n  resize: vertical;\n}\n.ep-field-error[_ngcontent-%COMP%] {\n  margin-top: 4px;\n  font: 400 12px Roboto, sans-serif;\n  color: #C62828;\n}\n.ep-hint[_ngcontent-%COMP%] {\n  margin-top: 4px;\n  font: 400 12px italic Roboto, sans-serif;\n  color: #9E9E9E;\n}\n.ep-amber-note[_ngcontent-%COMP%] {\n  margin-top: 6px;\n  background: #FFF8E1;\n  border-left: 3px solid #F2A620;\n  border-radius: 4px;\n  padding: 8px 12px;\n  font: 400 12px italic Roboto, sans-serif;\n  color: #5A5A5A;\n}\n.ep-picker-trigger[_ngcontent-%COMP%] {\n  width: 100%;\n  text-align: left;\n  cursor: pointer;\n  border: 1.5px solid #D0D0D0;\n  border-radius: 5px;\n  padding: 10px 12px;\n  font: 400 14px Roboto, sans-serif;\n  background: #fff;\n  color: #262626;\n}\n.ep-picker-trigger[_ngcontent-%COMP%]:hover {\n  border-color: #257099;\n}\n.ep-picker-placeholder[_ngcontent-%COMP%] {\n  color: #9E9E9E;\n}\n.ep-entity-chip[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  background: rgba(37, 112, 153, 0.08);\n  border-radius: 999px;\n  padding: 3px 10px;\n  font: 400 13px Roboto, sans-serif;\n  color: #262626;\n}\n.ep-chip-remove[_ngcontent-%COMP%] {\n  display: block;\n  margin-top: 4px;\n  background: none;\n  border: none;\n  cursor: pointer;\n  font: 400 12px Roboto, sans-serif;\n  color: #9E9E9E;\n  padding: 2px 0;\n}\n.ep-chip-remove[_ngcontent-%COMP%]:hover {\n  color: #C62828;\n}\n.ep-save-error[_ngcontent-%COMP%] {\n  margin-top: 8px;\n  padding: 10px 12px;\n  background: #FFEBEE;\n  border-left: 3px solid #C62828;\n  border-radius: 4px;\n  font: 400 13px Roboto, sans-serif;\n  color: #C62828;\n}\n/*# sourceMappingURL=delivery-cycle-edit-panel.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i03.\u0275setClassDebugInfo(DeliveryCycleEditPanelComponent, { className: "DeliveryCycleEditPanelComponent", filePath: "src\\app\\features\\delivery\\edit-panel\\delivery-cycle-edit-panel.component.ts", lineNumber: 322 });
})();

// src/app/features/delivery/detail/delivery-cycle-detail.component.ts
import * as i04 from "@angular/core";
import * as i13 from "@angular/router";
import * as i4 from "@angular/forms";
import * as i52 from "@angular/common";
var _c0 = () => ({ padding: "var(--triarq-space-md)" });
var _c1 = () => ({ "max-width": "860px", margin: "var(--triarq-space-xl) auto", padding: "0 var(--triarq-space-md)" });
var _c2 = () => [1, 2, 3];
function DeliveryCycleDetailComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 3)(1, "div", 4);
    i04.\u0275\u0275element(2, "ion-skeleton-text", 5)(3, "ion-skeleton-text", 6)(4, "ion-skeleton-text", 7);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(5, "div", 4);
    i04.\u0275\u0275element(6, "ion-skeleton-text", 8)(7, "ion-skeleton-text", 9)(8, "ion-skeleton-text", 10);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(9, "div", 4);
    i04.\u0275\u0275element(10, "ion-skeleton-text", 11)(11, "ion-skeleton-text", 12);
    i04.\u0275\u0275elementEnd()();
  }
}
function DeliveryCycleDetailComponent_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 13)(1, "div", 14);
    i04.\u0275\u0275text(2);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(3, "div", 15);
    i04.\u0275\u0275text(4, " Check that you have access to this Division, or return to the ");
    i04.\u0275\u0275elementStart(5, "a", 16);
    i04.\u0275\u0275text(6, "Delivery Dashboard");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275text(7, ". If access has been granted recently, try refreshing. ");
    i04.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext();
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.loadError, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_app_delivery_cycle_edit_panel_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "app-delivery-cycle-edit-panel", 70);
    i04.\u0275\u0275listener("saved", function DeliveryCycleDetailComponent_div_2_app_delivery_cycle_edit_panel_1_Template_app_delivery_cycle_edit_panel_saved_0_listener() {
      i04.\u0275\u0275restoreView(_r3);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.onEditSaved());
    })("cancelled", function DeliveryCycleDetailComponent_div_2_app_delivery_cycle_edit_panel_1_Template_app_delivery_cycle_edit_panel_cancelled_0_listener() {
      i04.\u0275\u0275restoreView(_r3);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.onEditCancelled());
    });
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275property("cycle", ctx_r0.cycle)("allUsers", ctx_r0.allUsers);
  }
}
function DeliveryCycleDetailComponent_div_2_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "div", 71)(1, "button", 72);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_2_Template_button_click_1_listener() {
      i04.\u0275\u0275restoreView(_r4);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.close.emit());
    });
    i04.\u0275\u0275text(2, "\u2715");
    i04.\u0275\u0275elementEnd()();
  }
}
function DeliveryCycleDetailComponent_div_2_span_15_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span");
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate(ctx_r0.cycle.workstream.home_division_name);
  }
}
function DeliveryCycleDetailComponent_div_2_span_16_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 73);
    i04.\u0275\u0275text(1, "Not set");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_span_21_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 55);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_2_0;
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", (tmp_2_0 = ctx_r0.cycle.assigned_ds_display_name) !== null && tmp_2_0 !== void 0 ? tmp_2_0 : ctx_r0.cycle.assigned_ds_user_id, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_span_22_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 74);
    i04.\u0275\u0275text(1, "Unassigned");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_span_26_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 55);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_2_0;
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", (tmp_2_0 = ctx_r0.cycle.assigned_cb_display_name) !== null && tmp_2_0 !== void 0 ? tmp_2_0 : ctx_r0.cycle.assigned_cb_user_id, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_span_27_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 74);
    i04.\u0275\u0275text(1, "Unassigned");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_button_31_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "button", 75);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_button_31_Template_button_click_0_listener() {
      i04.\u0275\u0275restoreView(_r5);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.submitGate(ctx_r0.pendingGateForSubmit));
    });
    i04.\u0275\u0275text(1, " \u2191 Submit Gate for Approval ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_button_32_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "button", 76);
    i04.\u0275\u0275element(1, "ion-spinner", 77);
    i04.\u0275\u0275text(2, " Submitting\u2026 ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_button_33_ion_spinner_1_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275element(0, "ion-spinner", 77);
  }
}
function DeliveryCycleDetailComponent_div_2_button_33_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "button", 78);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_button_33_Template_button_click_0_listener() {
      i04.\u0275\u0275restoreView(_r6);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.initiateRegress());
    });
    i04.\u0275\u0275template(1, DeliveryCycleDetailComponent_div_2_button_33_ion_spinner_1_Template, 1, 0, "ion-spinner", 79);
    i04.\u0275\u0275text(2, " \u21A9 Regress Stage ");
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275property("disabled", ctx_r0.regressBusy);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.regressBusy);
  }
}
function DeliveryCycleDetailComponent_div_2_button_34_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "button", 80);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_button_34_Template_button_click_0_listener() {
      i04.\u0275\u0275restoreView(_r7);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.cancelConfirming = true);
    });
    i04.\u0275\u0275text(1, " \u2715 Cancel Cycle ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_button_35_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "button", 75);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_button_35_Template_button_click_0_listener() {
      i04.\u0275\u0275restoreView(_r8);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.uncancelConfirming = true);
    });
    i04.\u0275\u0275text(1, " \u21BA Un-cancel Cycle ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_36_div_3_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 89);
    i04.\u0275\u0275text(1, " These gate records will be reset to pending: ");
    i04.\u0275\u0275elementStart(2, "strong", 90);
    i04.\u0275\u0275text(3);
    i04.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance(3);
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.regressPreview.gates_to_reset.join(", "), " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_36_div_4_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 91);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.regressPreview.warning, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_36_ion_spinner_7_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275element(0, "ion-spinner", 77);
  }
}
function DeliveryCycleDetailComponent_div_2_div_36_div_11_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 92);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.regressError, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_36_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "div", 81)(1, "div", 82);
    i04.\u0275\u0275text(2);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(3, DeliveryCycleDetailComponent_div_2_div_36_div_3_Template, 4, 1, "div", 83)(4, DeliveryCycleDetailComponent_div_2_div_36_div_4_Template, 2, 1, "div", 84);
    i04.\u0275\u0275elementStart(5, "div", 85)(6, "button", 86);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_36_Template_button_click_6_listener() {
      i04.\u0275\u0275restoreView(_r9);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.confirmRegress());
    });
    i04.\u0275\u0275template(7, DeliveryCycleDetailComponent_div_2_div_36_ion_spinner_7_Template, 1, 0, "ion-spinner", 79);
    i04.\u0275\u0275text(8);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(9, "button", 87);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_36_Template_button_click_9_listener() {
      i04.\u0275\u0275restoreView(_r9);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.cancelRegress());
    });
    i04.\u0275\u0275text(10, " Cancel ");
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275template(11, DeliveryCycleDetailComponent_div_2_div_36_div_11_Template, 2, 1, "div", 88);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate1(" Regress to ", ctx_r0.regressPreview.target_stage, "? ");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.regressPreview.gates_to_reset == null ? null : ctx_r0.regressPreview.gates_to_reset.length);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.regressPreview.warning);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275property("disabled", ctx_r0.regressBusy);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.regressBusy);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.regressBusy ? "Regressing\u2026" : "Confirm Regress", " ");
    i04.\u0275\u0275advance(3);
    i04.\u0275\u0275property("ngIf", ctx_r0.regressError);
  }
}
function DeliveryCycleDetailComponent_div_2_div_37_ion_spinner_7_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275element(0, "ion-spinner", 77);
  }
}
function DeliveryCycleDetailComponent_div_2_div_37_div_11_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 92);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.cancelError, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_37_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "div", 93)(1, "div", 94);
    i04.\u0275\u0275text(2, " Cancel this cycle? ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(3, "div", 95);
    i04.\u0275\u0275text(4, " The cycle will be marked CANCELLED. You can un-cancel it later from this panel. ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(5, "div", 85)(6, "button", 96);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_37_Template_button_click_6_listener() {
      i04.\u0275\u0275restoreView(_r10);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.cancelCycleAction());
    });
    i04.\u0275\u0275template(7, DeliveryCycleDetailComponent_div_2_div_37_ion_spinner_7_Template, 1, 0, "ion-spinner", 79);
    i04.\u0275\u0275text(8);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(9, "button", 87);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_37_Template_button_click_9_listener() {
      i04.\u0275\u0275restoreView(_r10);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      ctx_r0.cancelConfirming = false;
      return i04.\u0275\u0275resetView(ctx_r0.cancelError = "");
    });
    i04.\u0275\u0275text(10, " Keep Active ");
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275template(11, DeliveryCycleDetailComponent_div_2_div_37_div_11_Template, 2, 1, "div", 88);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance(6);
    i04.\u0275\u0275property("disabled", ctx_r0.cancelBusy);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.cancelBusy);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.cancelBusy ? "Cancelling\u2026" : "Confirm Cancel", " ");
    i04.\u0275\u0275advance(3);
    i04.\u0275\u0275property("ngIf", ctx_r0.cancelError);
  }
}
function DeliveryCycleDetailComponent_div_2_div_38_ion_spinner_7_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275element(0, "ion-spinner", 77);
  }
}
function DeliveryCycleDetailComponent_div_2_div_38_div_11_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 92);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.uncancelError, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_38_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "div", 97)(1, "div", 82);
    i04.\u0275\u0275text(2, " Restore this cycle? ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(3, "div", 95);
    i04.\u0275\u0275text(4, " The cycle will be returned to BRIEF stage and can resume the delivery workflow. ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(5, "div", 85)(6, "button", 98);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_38_Template_button_click_6_listener() {
      i04.\u0275\u0275restoreView(_r11);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.uncancelCycleAction());
    });
    i04.\u0275\u0275template(7, DeliveryCycleDetailComponent_div_2_div_38_ion_spinner_7_Template, 1, 0, "ion-spinner", 79);
    i04.\u0275\u0275text(8);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(9, "button", 87);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_38_Template_button_click_9_listener() {
      i04.\u0275\u0275restoreView(_r11);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      ctx_r0.uncancelConfirming = false;
      return i04.\u0275\u0275resetView(ctx_r0.uncancelError = "");
    });
    i04.\u0275\u0275text(10, " Cancel ");
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275template(11, DeliveryCycleDetailComponent_div_2_div_38_div_11_Template, 2, 1, "div", 88);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance(6);
    i04.\u0275\u0275property("disabled", ctx_r0.uncancelBusy);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.uncancelBusy);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.uncancelBusy ? "Restoring\u2026" : "Confirm Restore", " ");
    i04.\u0275\u0275advance(3);
    i04.\u0275\u0275property("ngIf", ctx_r0.uncancelError);
  }
}
function DeliveryCycleDetailComponent_div_2_div_43_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 99);
    i04.\u0275\u0275text(1, " No Outcome Statement set. Required before Brief Review gate. ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_44_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 100);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.cycle.outcome_statement, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_51_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 101)(1, "div", 102);
    i04.\u0275\u0275text(2);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(3, "div", 15);
    i04.\u0275\u0275text(4, " Actual dates are recorded automatically on Gate approval \u2014 if missing, the Gate may have been approved before date tracking was active. Add them manually to maintain a complete audit record. ");
    i04.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate2(" \u26A0 ", ctx_r0.missingActualDateGateNames.length, " Milestone", ctx_r0.missingActualDateGateNames.length > 1 ? "s are" : " is", " missing actual dates for Gates this Delivery Cycle has already passed. ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_58_div_4_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 113);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const m_r12 = i04.\u0275\u0275nextContext().$implicit;
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275styleProp("color", ctx_r0.gateApprovalNarrativeColor(m_r12.gate_name));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.gateApprovalNarrative(m_r12.gate_name), " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_58_span_8_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span");
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const m_r12 = i04.\u0275\u0275nextContext().$implicit;
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275styleProp("color", ctx_r0.milestoneTargetColor(m_r12));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate(m_r12.target_date);
  }
}
function DeliveryCycleDetailComponent_div_2_div_58_span_9_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 114);
    i04.\u0275\u0275text(1, "\u2014");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_58_span_13_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span");
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_4_0;
    const m_r12 = i04.\u0275\u0275nextContext().$implicit;
    i04.\u0275\u0275styleProp("color", m_r12.actual_date <= ((tmp_4_0 = m_r12.target_date) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : m_r12.actual_date) ? "var(--triarq-color-text-secondary)" : "var(--triarq-color-error)");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", m_r12.actual_date, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_58_span_14_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 115);
    i04.\u0275\u0275text(1, "\u26A0 missing");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_58_span_15_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 114);
    i04.\u0275\u0275text(1, "\u2014");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_58_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 103)(1, "div")(2, "span", 104);
    i04.\u0275\u0275text(3);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(4, DeliveryCycleDetailComponent_div_2_div_58_div_4_Template, 2, 3, "div", 105);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(5, "div")(6, "div", 106);
    i04.\u0275\u0275text(7, "Target Date");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(8, DeliveryCycleDetailComponent_div_2_div_58_span_8_Template, 2, 3, "span", 107)(9, DeliveryCycleDetailComponent_div_2_div_58_span_9_Template, 2, 0, "span", 108);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(10, "div")(11, "div", 106);
    i04.\u0275\u0275text(12, "Actual Date");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(13, DeliveryCycleDetailComponent_div_2_div_58_span_13_Template, 2, 3, "span", 107)(14, DeliveryCycleDetailComponent_div_2_div_58_span_14_Template, 2, 0, "span", 109)(15, DeliveryCycleDetailComponent_div_2_div_58_span_15_Template, 2, 0, "span", 108);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(16, "div", 110);
    i04.\u0275\u0275element(17, "span", 111);
    i04.\u0275\u0275elementStart(18, "span", 112);
    i04.\u0275\u0275text(19);
    i04.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const m_r12 = ctx.$implicit;
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance(3);
    i04.\u0275\u0275textInterpolate(ctx_r0.GATE_LABELS[m_r12.gate_name]);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.gateApprovalNarrative(m_r12.gate_name));
    i04.\u0275\u0275advance(4);
    i04.\u0275\u0275property("ngIf", m_r12.target_date);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !m_r12.target_date);
    i04.\u0275\u0275advance(4);
    i04.\u0275\u0275property("ngIf", m_r12.actual_date);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !m_r12.actual_date && ctx_r0.isMissingActualDate(m_r12.gate_name));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !m_r12.actual_date && !ctx_r0.isMissingActualDate(m_r12.gate_name));
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275styleProp("background", ctx_r0.milestoneStatusDotColor(ctx_r0.effectiveDateStatus(m_r12)));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275styleProp("color", ctx_r0.milestoneStatusDotColor(ctx_r0.effectiveDateStatus(m_r12)));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.gateStatusDisplayLabel(ctx_r0.effectiveDateStatus(m_r12)), " ");
  }
}
function DeliveryCycleDetailComponent_div_2_span_65_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 116);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" \u2014 ", ctx_r0.GATE_LABELS[ctx_r0.selectedGate], " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_66_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 117);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate2(" ", ctx_r0.cycle.cycle_title, " \xB7 Tier ", ctx_r0.tierShortLabel(ctx_r0.cycle.tier_classification), " ");
  }
}
function DeliveryCycleDetailComponent_div_2_button_67_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "button", 118);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_button_67_Template_button_click_0_listener() {
      i04.\u0275\u0275restoreView(_r13);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.closeGatePanel());
    });
    i04.\u0275\u0275text(1, "\u2715");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_68_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 15)(1, "p", 119);
    i04.\u0275\u0275text(2, " Gates are formal checkpoints in the lifecycle. Each Gate must be approved before the Delivery Cycle can advance past it. ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(3, "p", 120);
    i04.\u0275\u0275text(4, " Click a gate diamond on the Lifecycle Track above to view the Gate record, submit for approval, or record an Approve or Return decision. ");
    i04.\u0275\u0275elementEnd()();
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_span_7_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 15);
    i04.\u0275\u0275text(1, " Advance the Delivery Cycle through earlier stages to unlock this Gate. ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_span_8_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 137);
    i04.\u0275\u0275text(1, " Workstream was inactive at last clearance attempt. Reactivate the Workstream in Admin \u2192 Delivery Workstream Registry, then resubmit. ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_9_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 121)(1, "div", 122);
    i04.\u0275\u0275text(2, "Milestone Date");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(3, "div", 138)(4, "div")(5, "span", 29);
    i04.\u0275\u0275text(6, "Target: ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(7, "span");
    i04.\u0275\u0275text(8);
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(9, "div")(10, "span", 29);
    i04.\u0275\u0275text(11, "Actual: ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(12, "span");
    i04.\u0275\u0275text(13);
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(14, "span", 139);
    i04.\u0275\u0275text(15);
    i04.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_4_0;
    let tmp_5_0;
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance(7);
    i04.\u0275\u0275styleProp("color", ctx_r0.milestoneTargetColor(ctx_r0.selectedGateMilestone));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", (tmp_4_0 = ctx_r0.selectedGateMilestone.target_date) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : "\u2014", " ");
    i04.\u0275\u0275advance(5);
    i04.\u0275\u0275textInterpolate((tmp_5_0 = ctx_r0.selectedGateMilestone.actual_date) !== null && tmp_5_0 !== void 0 ? tmp_5_0 : "\u2014");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275styleProp("background", ctx_r0.dateStatusBg(ctx_r0.selectedGateMilestone.date_status))("color", ctx_r0.dateStatusColor(ctx_r0.selectedGateMilestone.date_status));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.dateStatusLabel(ctx_r0.selectedGateMilestone.date_status), " ");
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_span_18_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 140);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.approverDisplayName(ctx_r0.selectedGateRecord.approver_user_id), " ");
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_span_19_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 141);
    i04.\u0275\u0275text(1, " Phil (escalation default \u2014 no Accountable configured) ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_25_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 142)(1, "span", 143);
    i04.\u0275\u0275text(2);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(3, "span");
    i04.\u0275\u0275text(4);
    i04.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r14 = ctx.$implicit;
    i04.\u0275\u0275advance();
    i04.\u0275\u0275styleProp("color", item_r14.met ? "var(--triarq-color-success,#2e7d32)" : "var(--triarq-color-sunray,#f5a623)");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", item_r14.met ? "\u2713" : "\u26A0", " ");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275styleProp("color", item_r14.met ? "var(--triarq-color-text-primary)" : "var(--triarq-color-text-secondary)");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", item_r14.label, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_26_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 15);
    i04.\u0275\u0275text(1, " No checklist items defined for this Gate. ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_27_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 121)(1, "div", 122);
    i04.\u0275\u0275text(2, "Review Notes");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(3, "div", 144);
    i04.\u0275\u0275text(4);
    i04.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance(4);
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.selectedGateRecord.approver_notes, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_29_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 15);
    i04.\u0275\u0275text(1, " Advance the Delivery Cycle through earlier stages to unlock this Gate. ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_30_button_5_ion_spinner_1_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275element(0, "ion-spinner", 150);
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_30_button_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "button", 148);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_ng_container_69_div_30_button_5_Template_button_click_0_listener() {
      i04.\u0275\u0275restoreView(_r15);
      const ctx_r0 = i04.\u0275\u0275nextContext(4);
      return i04.\u0275\u0275resetView(ctx_r0.submitGate(ctx_r0.selectedGate));
    });
    i04.\u0275\u0275template(1, DeliveryCycleDetailComponent_div_2_ng_container_69_div_30_button_5_ion_spinner_1_Template, 1, 0, "ion-spinner", 149);
    i04.\u0275\u0275elementStart(2, "span");
    i04.\u0275\u0275text(3, "Submit for Approval");
    i04.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(4);
    i04.\u0275\u0275property("disabled", ctx_r0.gateActionBusy);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.gateActionBusy);
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_30_div_6_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 29);
    i04.\u0275\u0275text(1, " Only the assigned Domain Strategist, Capability Builder, or Phil can submit this Gate. Contact the cycle owner or an Admin to submit for approval. ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_30_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 28)(1, "p", 145)(2, "strong");
    i04.\u0275\u0275text(3);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275text(4, " has not been submitted yet. Use the button below when the Delivery Cycle is ready for Gate review. ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(5, DeliveryCycleDetailComponent_div_2_ng_container_69_div_30_button_5_Template, 4, 2, "button", 146)(6, DeliveryCycleDetailComponent_div_2_ng_container_69_div_30_div_6_Template, 2, 0, "div", 147);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance(3);
    i04.\u0275\u0275textInterpolate(ctx_r0.GATE_LABELS[ctx_r0.selectedGate]);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275property("ngIf", ctx_r0.callerCanSubmitGates);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !ctx_r0.callerCanSubmitGates);
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_1_ion_spinner_2_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275element(0, "ion-spinner", 150);
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "div", 121)(1, "button", 148);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_1_Template_button_click_1_listener() {
      i04.\u0275\u0275restoreView(_r16);
      const ctx_r0 = i04.\u0275\u0275nextContext(4);
      return i04.\u0275\u0275resetView(ctx_r0.submitGate(ctx_r0.selectedGate));
    });
    i04.\u0275\u0275template(2, DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_1_ion_spinner_2_Template, 1, 0, "ion-spinner", 149);
    i04.\u0275\u0275elementStart(3, "span");
    i04.\u0275\u0275text(4);
    i04.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(4);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("disabled", ctx_r0.gateActionBusy);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.gateActionBusy);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate(ctx_r0.selectedGateRecord.gate_status === "returned" ? "Resubmit for Approval" : "Submit for Approval");
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_ng_container_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementContainerStart(0);
    i04.\u0275\u0275elementStart(1, "button", 157);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_ng_container_9_Template_button_click_1_listener() {
      i04.\u0275\u0275restoreView(_r18);
      const ctx_r0 = i04.\u0275\u0275nextContext(5);
      return i04.\u0275\u0275resetView(ctx_r0.approveConfirming = true);
    });
    i04.\u0275\u0275text(2, "\u2713 Approve");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(5);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("disabled", ctx_r0.gateActionBusy);
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_ng_container_10_ion_spinner_4_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275element(0, "ion-spinner", 150);
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_ng_container_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementContainerStart(0);
    i04.\u0275\u0275elementStart(1, "span", 15);
    i04.\u0275\u0275text(2, " Approve this Gate? This cannot be undone. ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(3, "button", 158);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_ng_container_10_Template_button_click_3_listener() {
      i04.\u0275\u0275restoreView(_r19);
      const ctx_r0 = i04.\u0275\u0275nextContext(5);
      return i04.\u0275\u0275resetView(ctx_r0.recordDecisionWithValue(ctx_r0.selectedGate, "approved"));
    });
    i04.\u0275\u0275template(4, DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_ng_container_10_ion_spinner_4_Template, 1, 0, "ion-spinner", 149);
    i04.\u0275\u0275elementStart(5, "span");
    i04.\u0275\u0275text(6, "Confirm Approve");
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(7, "button", 159);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_ng_container_10_Template_button_click_7_listener() {
      i04.\u0275\u0275restoreView(_r19);
      const ctx_r0 = i04.\u0275\u0275nextContext(5);
      return i04.\u0275\u0275resetView(ctx_r0.approveConfirming = false);
    });
    i04.\u0275\u0275text(8, "Cancel");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(5);
    i04.\u0275\u0275advance(3);
    i04.\u0275\u0275property("disabled", ctx_r0.gateActionBusy);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.gateActionBusy);
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_ion_spinner_12_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275element(0, "ion-spinner", 160);
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "div")(1, "div", 82);
    i04.\u0275\u0275text(2, " Record Decision ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(3, "div", 151);
    i04.\u0275\u0275text(4, " Return notes are required when returning. Notes are optional for approval. ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(5, "form", 152);
    i04.\u0275\u0275listener("ngSubmit", function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_Template_form_ngSubmit_5_listener() {
      i04.\u0275\u0275restoreView(_r17);
      const ctx_r0 = i04.\u0275\u0275nextContext(4);
      return i04.\u0275\u0275resetView(ctx_r0.recordDecision(ctx_r0.selectedGate));
    });
    i04.\u0275\u0275elementStart(6, "textarea", 153);
    i04.\u0275\u0275text(7, "                  ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(8, "div", 154);
    i04.\u0275\u0275template(9, DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_ng_container_9_Template, 3, 1, "ng-container", 25)(10, DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_ng_container_10_Template, 9, 2, "ng-container", 25);
    i04.\u0275\u0275elementStart(11, "button", 155);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_Template_button_click_11_listener() {
      i04.\u0275\u0275restoreView(_r17);
      const ctx_r0 = i04.\u0275\u0275nextContext(4);
      return i04.\u0275\u0275resetView(ctx_r0.recordDecisionWithValue(ctx_r0.selectedGate, "returned"));
    });
    i04.\u0275\u0275template(12, DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_ion_spinner_12_Template, 1, 0, "ion-spinner", 156);
    i04.\u0275\u0275elementStart(13, "span");
    i04.\u0275\u0275text(14, "\u2717 Return");
    i04.\u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(4);
    i04.\u0275\u0275advance(5);
    i04.\u0275\u0275property("formGroup", ctx_r0.gateDecisionForm);
    i04.\u0275\u0275advance(4);
    i04.\u0275\u0275property("ngIf", !ctx_r0.approveConfirming);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.approveConfirming);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("disabled", ctx_r0.gateActionBusy);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.gateActionBusy);
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_3_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 15);
    i04.\u0275\u0275text(1, " This Gate is awaiting approval. Only the designated approver or Phil can record a decision. ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div");
    i04.\u0275\u0275template(1, DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_1_Template, 5, 3, "div", 126)(2, DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_2_Template, 15, 5, "div", 25)(3, DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_div_3_Template, 2, 0, "div", 59);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", (ctx_r0.selectedGateRecord.gate_status === "returned" || ctx_r0.selectedGateRecord.gate_status === "pending") && (ctx_r0.selectedGateRecord.current_user_gate_authority == null ? null : ctx_r0.selectedGateRecord.current_user_gate_authority.can_submit) !== false);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.selectedGateRecord.gate_status === "pending" && (ctx_r0.selectedGateRecord.current_user_gate_authority == null ? null : ctx_r0.selectedGateRecord.current_user_gate_authority.can_approve));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.selectedGateRecord.gate_status === "pending" && !(ctx_r0.selectedGateRecord.current_user_gate_authority == null ? null : ctx_r0.selectedGateRecord.current_user_gate_authority.can_approve));
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_32_div_3_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 164);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(4);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.gateActionHint, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_div_32_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 161)(1, "span", 162);
    i04.\u0275\u0275text(2);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(3, DeliveryCycleDetailComponent_div_2_ng_container_69_div_32_div_3_Template, 2, 1, "div", 163);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate(ctx_r0.gateActionError);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.gateActionHint);
  }
}
function DeliveryCycleDetailComponent_div_2_ng_container_69_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementContainerStart(0);
    i04.\u0275\u0275elementStart(1, "div", 121)(2, "div", 122);
    i04.\u0275\u0275text(3, "Gate Status");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(4, "div", 123)(5, "span", 124);
    i04.\u0275\u0275text(6);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(7, DeliveryCycleDetailComponent_div_2_ng_container_69_span_7_Template, 2, 0, "span", 59)(8, DeliveryCycleDetailComponent_div_2_ng_container_69_span_8_Template, 2, 0, "span", 125);
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275template(9, DeliveryCycleDetailComponent_div_2_ng_container_69_div_9_Template, 16, 9, "div", 126);
    i04.\u0275\u0275elementStart(10, "div", 121)(11, "div", 127);
    i04.\u0275\u0275text(12, "Approval Routing");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(13, "div", 128)(14, "span", 129);
    i04.\u0275\u0275text(15, "A");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(16, "span", 130);
    i04.\u0275\u0275text(17, "Accountable");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(18, DeliveryCycleDetailComponent_div_2_ng_container_69_span_18_Template, 2, 1, "span", 131)(19, DeliveryCycleDetailComponent_div_2_ng_container_69_span_19_Template, 2, 0, "span", 132);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(20, "div", 133);
    i04.\u0275\u0275text(21, " Consulted and Informed routing configured in Build D (RACI Management module). ");
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(22, "div", 121)(23, "div", 127);
    i04.\u0275\u0275text(24, "Gate Checklist");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(25, DeliveryCycleDetailComponent_div_2_ng_container_69_div_25_Template, 5, 6, "div", 134)(26, DeliveryCycleDetailComponent_div_2_ng_container_69_div_26_Template, 2, 0, "div", 59);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(27, DeliveryCycleDetailComponent_div_2_ng_container_69_div_27_Template, 5, 1, "div", 126);
    i04.\u0275\u0275element(28, "div", 135);
    i04.\u0275\u0275template(29, DeliveryCycleDetailComponent_div_2_ng_container_69_div_29_Template, 2, 0, "div", 59)(30, DeliveryCycleDetailComponent_div_2_ng_container_69_div_30_Template, 7, 3, "div", 66)(31, DeliveryCycleDetailComponent_div_2_ng_container_69_div_31_Template, 4, 3, "div", 25)(32, DeliveryCycleDetailComponent_div_2_ng_container_69_div_32_Template, 4, 2, "div", 136);
    i04.\u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance(5);
    i04.\u0275\u0275styleProp("background", ctx_r0.gateDetailStatusBg(ctx_r0.selectedGate))("color", ctx_r0.gateDetailStatusColor(ctx_r0.selectedGate));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.gateDetailStatus(ctx_r0.selectedGate), " ");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.gateDetailStatus(ctx_r0.selectedGate) === "Not Yet Active");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", (ctx_r0.selectedGateRecord == null ? null : ctx_r0.selectedGateRecord.workstream_active_at_clearance) === false);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.selectedGateMilestone);
    i04.\u0275\u0275advance(9);
    i04.\u0275\u0275property("ngIf", ctx_r0.selectedGateRecord == null ? null : ctx_r0.selectedGateRecord.approver_user_id);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !(ctx_r0.selectedGateRecord == null ? null : ctx_r0.selectedGateRecord.approver_user_id));
    i04.\u0275\u0275advance(6);
    i04.\u0275\u0275property("ngForOf", ctx_r0.gateChecklist(ctx_r0.selectedGate));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.gateChecklist(ctx_r0.selectedGate).length === 0);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.selectedGateRecord == null ? null : ctx_r0.selectedGateRecord.approver_notes);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275property("ngIf", !ctx_r0.selectedGateRecord && ctx_r0.isGateNotYetActive(ctx_r0.selectedGate));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !ctx_r0.selectedGateRecord && !ctx_r0.isGateNotYetActive(ctx_r0.selectedGate));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.selectedGateRecord);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.gateActionError);
  }
}
function DeliveryCycleDetailComponent_div_2_div_76_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 165);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.promoteStubMessage, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_span_7_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 173);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const group_r21 = i04.\u0275\u0275nextContext().$implicit;
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" \u2014 Available when cycle reaches ", group_r21.stage, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_5_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 185);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const slot_r22 = i04.\u0275\u0275nextContext().$implicit;
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", slot_r22.guidance_text, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_6_span_6_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 191);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const slot_r22 = i04.\u0275\u0275nextContext(2).$implicit;
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", slot_r22.attached_by_display_name, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_6_span_7_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 172);
    i04.\u0275\u0275text(1, " Unknown ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_6_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 186)(1, "a", 187);
    i04.\u0275\u0275text(2);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(3, "div", 188)(4, "span", 172);
    i04.\u0275\u0275text(5, " Attached by ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(6, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_6_span_6_Template, 2, 1, "span", 189)(7, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_6_span_7_Template, 2, 0, "span", 190);
    i04.\u0275\u0275elementStart(8, "span", 172);
    i04.\u0275\u0275text(9);
    i04.\u0275\u0275pipe(10, "date");
    i04.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const slot_r22 = i04.\u0275\u0275nextContext().$implicit;
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("href", slot_r22.external_url, i04.\u0275\u0275sanitizeUrl);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", slot_r22.display_name, " ");
    i04.\u0275\u0275advance(4);
    i04.\u0275\u0275property("ngIf", slot_r22.attached_by_display_name);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !slot_r22.attached_by_display_name);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate1(" \xB7 ", i04.\u0275\u0275pipeBind2(10, 5, slot_r22.attached_at, "dd MMM yyyy"), " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_7_div_6_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 196);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementStart(2, "em");
    i04.\u0275\u0275text(3, "Archived reference");
    i04.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const slot_r22 = i04.\u0275\u0275nextContext(2).$implicit;
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" External: ", slot_r22.external_url, " \xB7 ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_7_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 186)(1, "div", 192)(2, "span", 193);
    i04.\u0275\u0275text(3, "OI Library:");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(4, "span", 194);
    i04.\u0275\u0275text(5);
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275template(6, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_7_div_6_Template, 4, 1, "div", 195);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const slot_r22 = i04.\u0275\u0275nextContext().$implicit;
    i04.\u0275\u0275advance(5);
    i04.\u0275\u0275textInterpolate1(" ", slot_r22.display_name, " ");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", slot_r22.external_url);
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_8_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 197);
    i04.\u0275\u0275text(1, " Not yet attached ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_9_button_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "button", 202);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_9_button_1_Template_button_click_0_listener() {
      let tmp_9_0;
      i04.\u0275\u0275restoreView(_r23);
      const slot_r22 = i04.\u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = i04.\u0275\u0275nextContext(4);
      return i04.\u0275\u0275resetView(ctx_r0.openAttachForm((tmp_9_0 = slot_r22.artifact_type_id) !== null && tmp_9_0 !== void 0 ? tmp_9_0 : ""));
    });
    i04.\u0275\u0275text(1, " Attach ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_9_button_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r24 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "button", 203);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_9_button_2_Template_button_click_0_listener() {
      let tmp_9_0;
      i04.\u0275\u0275restoreView(_r24);
      const slot_r22 = i04.\u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = i04.\u0275\u0275nextContext(4);
      return i04.\u0275\u0275resetView(ctx_r0.openAttachForm((tmp_9_0 = slot_r22.artifact_type_id) !== null && tmp_9_0 !== void 0 ? tmp_9_0 : ""));
    });
    i04.\u0275\u0275text(1, " Replace ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_9_button_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r25 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "button", 204);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_9_button_3_Template_button_click_0_listener() {
      i04.\u0275\u0275restoreView(_r25);
      const slot_r22 = i04.\u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = i04.\u0275\u0275nextContext(4);
      return i04.\u0275\u0275resetView(ctx_r0.promoteArtifact(slot_r22));
    });
    i04.\u0275\u0275text(1, " \u2192 OI Library ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_9_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 198);
    i04.\u0275\u0275template(1, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_9_button_1_Template, 2, 0, "button", 199)(2, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_9_button_2_Template, 2, 0, "button", 200)(3, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_9_button_3_Template, 2, 0, "button", 201);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const slot_r22 = i04.\u0275\u0275nextContext().$implicit;
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !slot_r22.external_url);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", slot_r22.external_url);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", slot_r22.external_url && slot_r22.pointer_status === "external_only");
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_10_ion_spinner_18_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275element(0, "ion-spinner", 150);
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_10_div_23_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 216);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(6);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.attachError, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r26 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "div", 205);
    i04.\u0275\u0275element(1, "app-loading-overlay", 206);
    i04.\u0275\u0275elementStart(2, "form", 152);
    i04.\u0275\u0275listener("ngSubmit", function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_10_Template_form_ngSubmit_2_listener() {
      i04.\u0275\u0275restoreView(_r26);
      const ctx_r0 = i04.\u0275\u0275nextContext(5);
      return i04.\u0275\u0275resetView(ctx_r0.submitAttach());
    });
    i04.\u0275\u0275elementStart(3, "div", 207)(4, "div")(5, "label", 208);
    i04.\u0275\u0275text(6, " Artifact Title ");
    i04.\u0275\u0275elementStart(7, "span", 209);
    i04.\u0275\u0275text(8, "*");
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275element(9, "input", 210);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(10, "div")(11, "label", 208);
    i04.\u0275\u0275text(12, " External URL ");
    i04.\u0275\u0275elementStart(13, "span", 209);
    i04.\u0275\u0275text(14, "*");
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275element(15, "input", 211);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(16, "div", 212)(17, "button", 213);
    i04.\u0275\u0275template(18, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_10_ion_spinner_18_Template, 1, 0, "ion-spinner", 149);
    i04.\u0275\u0275elementStart(19, "span");
    i04.\u0275\u0275text(20);
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(21, "button", 214);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_10_Template_button_click_21_listener() {
      i04.\u0275\u0275restoreView(_r26);
      const ctx_r0 = i04.\u0275\u0275nextContext(5);
      return i04.\u0275\u0275resetView(ctx_r0.cancelAttach());
    });
    i04.\u0275\u0275text(22, "\u2715");
    i04.\u0275\u0275elementEnd()()();
    i04.\u0275\u0275template(23, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_10_div_23_Template, 2, 1, "div", 215);
    i04.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(5);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("visible", ctx_r0.attaching);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("formGroup", ctx_r0.attachForm);
    i04.\u0275\u0275advance(15);
    i04.\u0275\u0275property("disabled", ctx_r0.attachForm.invalid || ctx_r0.attaching);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.attaching);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate(ctx_r0.attaching ? "\u2026" : "Attach");
    i04.\u0275\u0275advance(3);
    i04.\u0275\u0275property("ngIf", ctx_r0.attachError);
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 176)(1, "div", 177)(2, "div", 178)(3, "div", 179);
    i04.\u0275\u0275text(4);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(5, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_5_Template, 2, 1, "div", 180)(6, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_6_Template, 11, 8, "div", 181)(7, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_7_Template, 7, 2, "div", 181)(8, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_8_Template, 2, 0, "div", 182);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(9, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_9_Template, 4, 3, "div", 183);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(10, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_div_10_Template, 24, 6, "div", 184);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_6_0;
    let tmp_12_0;
    const slot_r22 = ctx.$implicit;
    const group_r21 = i04.\u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance(4);
    i04.\u0275\u0275textInterpolate1(" ", (tmp_6_0 = slot_r22.artifact_type_name) !== null && tmp_6_0 !== void 0 ? tmp_6_0 : slot_r22.display_name, " ");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", slot_r22.guidance_text);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", slot_r22.external_url && slot_r22.pointer_status !== "promoted");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", slot_r22.pointer_status === "promoted");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !slot_r22.external_url && !slot_r22.oi_library_artifact_id);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !group_r21.isFuture);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.showAttachForm && ctx_r0.attachingForTypeId === ((tmp_12_0 = slot_r22.artifact_type_id) !== null && tmp_12_0 !== void 0 ? tmp_12_0 : ""));
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_2_div_1_ion_spinner_18_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275element(0, "ion-spinner", 150);
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_2_div_1_div_23_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 216);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(6);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.attachError, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_2_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r27 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "div", 220);
    i04.\u0275\u0275element(1, "app-loading-overlay", 206);
    i04.\u0275\u0275elementStart(2, "form", 152);
    i04.\u0275\u0275listener("ngSubmit", function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_2_div_1_Template_form_ngSubmit_2_listener() {
      i04.\u0275\u0275restoreView(_r27);
      const ctx_r0 = i04.\u0275\u0275nextContext(5);
      return i04.\u0275\u0275resetView(ctx_r0.submitAttach());
    });
    i04.\u0275\u0275elementStart(3, "div", 207)(4, "div")(5, "label", 208);
    i04.\u0275\u0275text(6, " Artifact Title ");
    i04.\u0275\u0275elementStart(7, "span", 209);
    i04.\u0275\u0275text(8, "*");
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275element(9, "input", 210);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(10, "div")(11, "label", 208);
    i04.\u0275\u0275text(12, " External URL ");
    i04.\u0275\u0275elementStart(13, "span", 209);
    i04.\u0275\u0275text(14, "*");
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275element(15, "input", 211);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(16, "div", 212)(17, "button", 213);
    i04.\u0275\u0275template(18, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_2_div_1_ion_spinner_18_Template, 1, 0, "ion-spinner", 149);
    i04.\u0275\u0275elementStart(19, "span");
    i04.\u0275\u0275text(20);
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(21, "button", 214);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_2_div_1_Template_button_click_21_listener() {
      i04.\u0275\u0275restoreView(_r27);
      const ctx_r0 = i04.\u0275\u0275nextContext(5);
      return i04.\u0275\u0275resetView(ctx_r0.cancelAttach());
    });
    i04.\u0275\u0275text(22, "\u2715");
    i04.\u0275\u0275elementEnd()()();
    i04.\u0275\u0275template(23, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_2_div_1_div_23_Template, 2, 1, "div", 215);
    i04.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(5);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("visible", ctx_r0.attaching);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("formGroup", ctx_r0.attachForm);
    i04.\u0275\u0275advance(15);
    i04.\u0275\u0275property("disabled", ctx_r0.attachForm.invalid || ctx_r0.attaching);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.attaching);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate(ctx_r0.attaching ? "\u2026" : "Attach");
    i04.\u0275\u0275advance(3);
    i04.\u0275\u0275property("ngIf", ctx_r0.attachError);
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_2_button_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r28 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "button", 221);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_2_button_2_Template_button_click_0_listener() {
      i04.\u0275\u0275restoreView(_r28);
      const group_r21 = i04.\u0275\u0275nextContext(3).$implicit;
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.openAttachForm("__adhoc__" + group_r21.stage));
    });
    i04.\u0275\u0275text(1, " + Attach Document ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_div_2_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 217);
    i04.\u0275\u0275template(1, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_2_div_1_Template, 24, 6, "div", 218)(2, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_2_button_2_Template, 2, 0, "button", 219);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const group_r21 = i04.\u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.showAttachForm && ctx_r0.attachingForTypeId === "__adhoc__" + group_r21.stage);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !(ctx_r0.showAttachForm && ctx_r0.attachingForTypeId === "__adhoc__" + group_r21.stage));
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_div_10_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div");
    i04.\u0275\u0275template(1, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_1_Template, 11, 7, "div", 174)(2, DeliveryCycleDetailComponent_div_2_div_77_div_10_div_2_Template, 3, 2, "div", 175);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const group_r21 = i04.\u0275\u0275nextContext().$implicit;
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngForOf", group_r21.slots);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !group_r21.isFuture);
  }
}
function DeliveryCycleDetailComponent_div_2_div_77_Template(rf, ctx) {
  if (rf & 1) {
    const _r20 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "div", 166)(1, "button", 167);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_77_Template_button_click_1_listener() {
      const group_r21 = i04.\u0275\u0275restoreView(_r20).$implicit;
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.toggleStageExpand(group_r21.stage));
    });
    i04.\u0275\u0275elementStart(2, "span", 168)(3, "span", 169);
    i04.\u0275\u0275text(4, " \u25BC ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(5, "span", 170);
    i04.\u0275\u0275text(6);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(7, DeliveryCycleDetailComponent_div_2_div_77_span_7_Template, 2, 1, "span", 171);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(8, "span", 172);
    i04.\u0275\u0275text(9);
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275template(10, DeliveryCycleDetailComponent_div_2_div_77_div_10_Template, 3, 2, "div", 25);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const group_r21 = ctx.$implicit;
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275styleProp("opacity", group_r21.isFuture ? "0.65" : "1");
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275styleProp("transform", ctx_r0.isStageExpanded(group_r21.stage) ? "rotate(0)" : "rotate(-90deg)");
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275styleProp("color", group_r21.isFuture ? "var(--triarq-color-text-secondary)" : "var(--triarq-color-primary)");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", group_r21.stage, " ");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", group_r21.isFuture);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate2(" ", ctx_r0.attachedCountInGroup(group_r21.slots), " of ", group_r21.slots.length, " attached ");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.isStageExpanded(group_r21.stage));
  }
}
function DeliveryCycleDetailComponent_div_2_div_78_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 222);
    i04.\u0275\u0275text(1, " No artifacts attached yet. Artifact slots become available as the cycle advances through stages. ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_button_83_ion_spinner_1_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275element(0, "ion-spinner", 150);
  }
}
function DeliveryCycleDetailComponent_div_2_button_83_Template(rf, ctx) {
  if (rf & 1) {
    const _r29 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "button", 148);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_button_83_Template_button_click_0_listener() {
      i04.\u0275\u0275restoreView(_r29);
      const ctx_r0 = i04.\u0275\u0275nextContext(2);
      return i04.\u0275\u0275resetView(ctx_r0.triggerJiraSync());
    });
    i04.\u0275\u0275template(1, DeliveryCycleDetailComponent_div_2_button_83_ion_spinner_1_Template, 1, 0, "ion-spinner", 149);
    i04.\u0275\u0275elementStart(2, "span");
    i04.\u0275\u0275text(3);
    i04.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275property("disabled", ctx_r0.syncing);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.syncing);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate(ctx_r0.syncing ? "Syncing\u2026" : "Sync Now");
  }
}
function DeliveryCycleDetailComponent_div_2_div_84_div_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r30 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "div")(1, "button", 202);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_84_div_3_Template_button_click_1_listener() {
      i04.\u0275\u0275restoreView(_r30);
      const ctx_r0 = i04.\u0275\u0275nextContext(3);
      ctx_r0.showJiraLinkForm = true;
      return i04.\u0275\u0275resetView(ctx_r0.jiraLinkError = "");
    });
    i04.\u0275\u0275text(2, " + Link Jira Epic ");
    i04.\u0275\u0275elementEnd()();
  }
}
function DeliveryCycleDetailComponent_div_2_div_84_div_4_ion_spinner_3_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275element(0, "ion-spinner", 150);
  }
}
function DeliveryCycleDetailComponent_div_2_div_84_div_4_span_8_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 227);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(4);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.jiraLinkError, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_84_div_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r31 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "div", 123);
    i04.\u0275\u0275element(1, "input", 224);
    i04.\u0275\u0275elementStart(2, "button", 148);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_84_div_4_Template_button_click_2_listener() {
      i04.\u0275\u0275restoreView(_r31);
      const ctx_r0 = i04.\u0275\u0275nextContext(3);
      return i04.\u0275\u0275resetView(ctx_r0.linkJiraEpic());
    });
    i04.\u0275\u0275template(3, DeliveryCycleDetailComponent_div_2_div_84_div_4_ion_spinner_3_Template, 1, 0, "ion-spinner", 149);
    i04.\u0275\u0275elementStart(4, "span");
    i04.\u0275\u0275text(5, "Link");
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(6, "button", 225);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_div_84_div_4_Template_button_click_6_listener() {
      i04.\u0275\u0275restoreView(_r31);
      const ctx_r0 = i04.\u0275\u0275nextContext(3);
      ctx_r0.showJiraLinkForm = false;
      return i04.\u0275\u0275resetView(ctx_r0.jiraLinkError = "");
    });
    i04.\u0275\u0275text(7, " Cancel ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(8, DeliveryCycleDetailComponent_div_2_div_84_div_4_span_8_Template, 2, 1, "span", 226);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("formControl", ctx_r0.jiraEpicKeyCtrl);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("disabled", ctx_r0.jiraEpicKeyCtrl.invalid || ctx_r0.linkingJiraEpic);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.linkingJiraEpic);
    i04.\u0275\u0275advance(5);
    i04.\u0275\u0275property("ngIf", ctx_r0.jiraLinkError);
  }
}
function DeliveryCycleDetailComponent_div_2_div_84_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div")(1, "div", 151);
    i04.\u0275\u0275text(2, " No Jira epic linked to this cycle. Link a Jira epic key to enable two-way sync of the five governance fields (ARCH-16). ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(3, DeliveryCycleDetailComponent_div_2_div_84_div_3_Template, 3, 0, "div", 25)(4, DeliveryCycleDetailComponent_div_2_div_84_div_4_Template, 9, 4, "div", 223);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance(3);
    i04.\u0275\u0275property("ngIf", !ctx_r0.showJiraLinkForm);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.showJiraLinkForm);
  }
}
function DeliveryCycleDetailComponent_div_2_div_85_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 28)(1, "div");
    i04.\u0275\u0275text(2, " Epic: ");
    i04.\u0275\u0275elementStart(3, "strong");
    i04.\u0275\u0275text(4);
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(5, "div", 228)(6, "div", 229);
    i04.\u0275\u0275text(7, "Jira sync not yet configured");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(8, "div", 29);
    i04.\u0275\u0275text(9);
    i04.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance(4);
    i04.\u0275\u0275textInterpolate(ctx_r0.jiraLink.jira_epic_key);
    i04.\u0275\u0275advance(5);
    i04.\u0275\u0275textInterpolate(ctx_r0.syncStubMessage);
  }
}
function DeliveryCycleDetailComponent_div_2_div_86_span_8_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "span", 29);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275pipe(2, "date");
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" \xA0\xB7 Last synced: ", i04.\u0275\u0275pipeBind2(2, 1, ctx_r0.jiraLink.last_synced_at, "short"), " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_86_div_9_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 92);
    i04.\u0275\u0275text(1);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(3);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" Last sync error: ", ctx_r0.jiraLink.last_sync_error, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_div_86_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div")(1, "div", 28);
    i04.\u0275\u0275text(2, " Epic: ");
    i04.\u0275\u0275elementStart(3, "strong");
    i04.\u0275\u0275text(4);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275text(5, " \xA0\xB7\xA0 Sync Status: ");
    i04.\u0275\u0275elementStart(6, "span");
    i04.\u0275\u0275text(7);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(8, DeliveryCycleDetailComponent_div_2_div_86_span_8_Template, 3, 4, "span", 147);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(9, DeliveryCycleDetailComponent_div_2_div_86_div_9_Template, 2, 1, "div", 88);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext(2);
    i04.\u0275\u0275advance(4);
    i04.\u0275\u0275textInterpolate(ctx_r0.jiraLink.jira_epic_key);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275styleProp("color", ctx_r0.jiraLink.sync_status === "synced" ? "var(--triarq-color-success,#2e7d32)" : ctx_r0.jiraLink.sync_status === "error" ? "var(--triarq-color-error)" : "var(--triarq-color-text-secondary)");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r0.jiraLink.sync_status, " ");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.jiraLink.last_synced_at);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.jiraLink.last_sync_error);
  }
}
function DeliveryCycleDetailComponent_div_2_div_92_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 231);
    i04.\u0275\u0275element(1, "ion-skeleton-text", 232)(2, "ion-skeleton-text", 232);
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_92_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div");
    i04.\u0275\u0275template(1, DeliveryCycleDetailComponent_div_2_div_92_div_1_Template, 3, 0, "div", 230);
    i04.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngForOf", i04.\u0275\u0275pureFunction0(1, _c2));
  }
}
function DeliveryCycleDetailComponent_div_2_div_93_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 15);
    i04.\u0275\u0275text(1, " No events recorded yet. Events appear here as the cycle progresses. ");
    i04.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDetailComponent_div_2_div_94_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 233)(1, "span", 234);
    i04.\u0275\u0275text(2);
    i04.\u0275\u0275pipe(3, "date");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(4, "span")(5, "span", 235);
    i04.\u0275\u0275text(6);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275text(7);
    i04.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ev_r32 = ctx.$implicit;
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate1(" ", i04.\u0275\u0275pipeBind2(3, 3, ev_r32.created_at, "short"), " ");
    i04.\u0275\u0275advance(4);
    i04.\u0275\u0275textInterpolate1(" ", ev_r32.event_type, " ");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ev_r32.event_description, " ");
  }
}
function DeliveryCycleDetailComponent_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = i04.\u0275\u0275getCurrentView();
    i04.\u0275\u0275elementStart(0, "div", 17);
    i04.\u0275\u0275template(1, DeliveryCycleDetailComponent_div_2_app_delivery_cycle_edit_panel_1_Template, 1, 2, "app-delivery-cycle-edit-panel", 18)(2, DeliveryCycleDetailComponent_div_2_div_2_Template, 3, 0, "div", 19);
    i04.\u0275\u0275elementStart(3, "div", 4)(4, "div", 20)(5, "div")(6, "div", 21)(7, "span", 22);
    i04.\u0275\u0275text(8);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(9, "span", 23);
    i04.\u0275\u0275text(10);
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(11, "h3", 24);
    i04.\u0275\u0275text(12);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(13, "div", 15);
    i04.\u0275\u0275text(14);
    i04.\u0275\u0275template(15, DeliveryCycleDetailComponent_div_2_span_15_Template, 2, 1, "span", 25)(16, DeliveryCycleDetailComponent_div_2_span_16_Template, 2, 0, "span", 26);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(17, "div", 27)(18, "div", 28)(19, "span", 29);
    i04.\u0275\u0275text(20, "DS: ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(21, DeliveryCycleDetailComponent_div_2_span_21_Template, 2, 1, "span", 30)(22, DeliveryCycleDetailComponent_div_2_span_22_Template, 2, 0, "span", 31);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(23, "div", 28)(24, "span", 29);
    i04.\u0275\u0275text(25, "CB: ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(26, DeliveryCycleDetailComponent_div_2_span_26_Template, 2, 1, "span", 30)(27, DeliveryCycleDetailComponent_div_2_span_27_Template, 2, 0, "span", 31);
    i04.\u0275\u0275elementEnd()()();
    i04.\u0275\u0275elementStart(28, "div", 32)(29, "button", 33);
    i04.\u0275\u0275listener("click", function DeliveryCycleDetailComponent_div_2_Template_button_click_29_listener() {
      i04.\u0275\u0275restoreView(_r2);
      const ctx_r0 = i04.\u0275\u0275nextContext();
      return i04.\u0275\u0275resetView(ctx_r0.openEditPanel());
    });
    i04.\u0275\u0275text(30, " \u270E Edit Cycle ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(31, DeliveryCycleDetailComponent_div_2_button_31_Template, 2, 0, "button", 34)(32, DeliveryCycleDetailComponent_div_2_button_32_Template, 3, 0, "button", 35)(33, DeliveryCycleDetailComponent_div_2_button_33_Template, 3, 2, "button", 36)(34, DeliveryCycleDetailComponent_div_2_button_34_Template, 2, 0, "button", 37)(35, DeliveryCycleDetailComponent_div_2_button_35_Template, 2, 0, "button", 34);
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275template(36, DeliveryCycleDetailComponent_div_2_div_36_Template, 12, 7, "div", 38)(37, DeliveryCycleDetailComponent_div_2_div_37_Template, 12, 4, "div", 39)(38, DeliveryCycleDetailComponent_div_2_div_38_Template, 12, 4, "div", 40);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(39, "div", 4)(40, "div", 41);
    i04.\u0275\u0275text(41, " Outcome Statement ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(42, "div", 42);
    i04.\u0275\u0275template(43, DeliveryCycleDetailComponent_div_2_div_43_Template, 2, 0, "div", 43)(44, DeliveryCycleDetailComponent_div_2_div_44_Template, 2, 1, "div", 44);
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(45, "div", 4)(46, "div", 45);
    i04.\u0275\u0275text(47, "Stage Track");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(48, "div", 46);
    i04.\u0275\u0275text(49, " Click a gate diamond to open its record and record a decision. ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(50, "app-stage-track", 47);
    i04.\u0275\u0275listener("gateClicked", function DeliveryCycleDetailComponent_div_2_Template_app_stage_track_gateClicked_50_listener($event) {
      i04.\u0275\u0275restoreView(_r2);
      const ctx_r0 = i04.\u0275\u0275nextContext();
      return i04.\u0275\u0275resetView(ctx_r0.openGatePanel($event));
    });
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275template(51, DeliveryCycleDetailComponent_div_2_div_51_Template, 5, 2, "div", 48);
    i04.\u0275\u0275elementStart(52, "div", 49)(53, "div", 50)(54, "div", 45);
    i04.\u0275\u0275text(55, "Milestone Dates");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(56, "div", 46);
    i04.\u0275\u0275text(57, " Actual date is set automatically when a gate is cleared. Target dates and milestone status are editable via Edit Cycle. ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(58, DeliveryCycleDetailComponent_div_2_div_58_Template, 20, 12, "div", 51);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(59, "div", 52);
    i04.\u0275\u0275element(60, "app-loading-overlay", 53);
    i04.\u0275\u0275elementStart(61, "div", 54)(62, "div")(63, "div", 55);
    i04.\u0275\u0275text(64, " Gate Record ");
    i04.\u0275\u0275template(65, DeliveryCycleDetailComponent_div_2_span_65_Template, 2, 1, "span", 56);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(66, DeliveryCycleDetailComponent_div_2_div_66_Template, 2, 2, "div", 57);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(67, DeliveryCycleDetailComponent_div_2_button_67_Template, 2, 0, "button", 58);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(68, DeliveryCycleDetailComponent_div_2_div_68_Template, 5, 0, "div", 59)(69, DeliveryCycleDetailComponent_div_2_ng_container_69_Template, 33, 17, "ng-container", 25);
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(70, "div", 4)(71, "div", 60)(72, "span", 55);
    i04.\u0275\u0275text(73, "Cycle Artifacts");
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(74, "p", 61);
    i04.\u0275\u0275text(75, ' Artifacts are grouped by the lifecycle stage they belong to. Attach an external URL to fill a slot. Use "\u2192 OI Library" to record the artifact in the OI Library (full submission completes in Build B). ');
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(76, DeliveryCycleDetailComponent_div_2_div_76_Template, 2, 1, "div", 62)(77, DeliveryCycleDetailComponent_div_2_div_77_Template, 11, 11, "div", 63)(78, DeliveryCycleDetailComponent_div_2_div_78_Template, 2, 0, "div", 64);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(79, "div", 4)(80, "div", 60)(81, "span", 55);
    i04.\u0275\u0275text(82, "Jira Sync");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(83, DeliveryCycleDetailComponent_div_2_button_83_Template, 4, 3, "button", 65);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(84, DeliveryCycleDetailComponent_div_2_div_84_Template, 5, 2, "div", 25)(85, DeliveryCycleDetailComponent_div_2_div_85_Template, 10, 2, "div", 66)(86, DeliveryCycleDetailComponent_div_2_div_86_Template, 10, 6, "div", 25);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(87, "div", 50)(88, "div", 45);
    i04.\u0275\u0275text(89, "Event Log");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(90, "div", 46);
    i04.\u0275\u0275text(91, " Append-only record of all stage advances, gate decisions, artifact attachments, and outcome changes. Oldest events at the top. ");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275template(92, DeliveryCycleDetailComponent_div_2_div_92_Template, 2, 2, "div", 25)(93, DeliveryCycleDetailComponent_div_2_div_93_Template, 2, 0, "div", 59)(94, DeliveryCycleDetailComponent_div_2_div_94_Template, 8, 6, "div", 67);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(95, "div", 68)(96, "a", 69);
    i04.\u0275\u0275text(97, " \u2190 Delivery Dashboard ");
    i04.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_4_0;
    let tmp_9_0;
    const ctx_r0 = i04.\u0275\u0275nextContext();
    i04.\u0275\u0275property("ngStyle", ctx_r0.panelMode ? i04.\u0275\u0275pureFunction0(48, _c0) : i04.\u0275\u0275pureFunction0(49, _c1));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.showEditPanel && ctx_r0.cycle);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.panelMode);
    i04.\u0275\u0275advance(6);
    i04.\u0275\u0275textInterpolate1(" ", (tmp_4_0 = ctx_r0.STAGE_LABEL_MAP[ctx_r0.cycle.current_lifecycle_stage]) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : ctx_r0.cycle.current_lifecycle_stage, " ");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275styleProp("background", ctx_r0.tierBadgeBg(ctx_r0.cycle.tier_classification))("color", ctx_r0.tierBadgeColor(ctx_r0.cycle.tier_classification));
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" Tier ", ctx_r0.tierLabel(ctx_r0.cycle.tier_classification), " ");
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate(ctx_r0.cycle.cycle_title);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate1(" ", (tmp_9_0 = ctx_r0.cycle.workstream == null ? null : ctx_r0.cycle.workstream.workstream_name) !== null && tmp_9_0 !== void 0 ? tmp_9_0 : ctx_r0.cycle.workstream_id, " \xA0\xB7\xA0 ");
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.cycle.workstream == null ? null : ctx_r0.cycle.workstream.home_division_name);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !(ctx_r0.cycle.workstream == null ? null : ctx_r0.cycle.workstream.home_division_name));
    i04.\u0275\u0275advance(5);
    i04.\u0275\u0275property("ngIf", ctx_r0.cycle.assigned_ds_user_id);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !ctx_r0.cycle.assigned_ds_user_id);
    i04.\u0275\u0275advance(4);
    i04.\u0275\u0275property("ngIf", ctx_r0.cycle.assigned_cb_user_id);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !ctx_r0.cycle.assigned_cb_user_id);
    i04.\u0275\u0275advance(4);
    i04.\u0275\u0275property("ngIf", ctx_r0.pendingGateForSubmit && ctx_r0.callerCanSubmitGates && !ctx_r0.gateActionBusy);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.pendingGateForSubmit && ctx_r0.callerCanSubmitGates && ctx_r0.gateActionBusy);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.canRegress && !ctx_r0.regressConfirming);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.canCancelCycle && !ctx_r0.cancelConfirming);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.cycle.current_lifecycle_stage === "CANCELLED" && !ctx_r0.uncancelConfirming);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.regressConfirming && ctx_r0.regressPreview);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.cancelConfirming);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.uncancelConfirming);
    i04.\u0275\u0275advance(5);
    i04.\u0275\u0275property("ngIf", !ctx_r0.cycle.outcome_statement);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.cycle.outcome_statement);
    i04.\u0275\u0275advance(6);
    i04.\u0275\u0275property("currentStageId", ctx_r0.cycle.current_lifecycle_stage)("gateStateMap", ctx_r0.gateStateMap);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.missingActualDateGateNames.length > 0);
    i04.\u0275\u0275advance(7);
    i04.\u0275\u0275property("ngForOf", ctx_r0.cycle.milestone_dates)("ngForTrackBy", ctx_r0.trackByMilestoneId);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275property("visible", ctx_r0.gateActionBusy);
    i04.\u0275\u0275advance(5);
    i04.\u0275\u0275property("ngIf", ctx_r0.selectedGate);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.cycle && ctx_r0.selectedGate);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.selectedGate);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !ctx_r0.selectedGate);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.selectedGate);
    i04.\u0275\u0275advance(7);
    i04.\u0275\u0275property("ngIf", ctx_r0.promoteStubMessage);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngForOf", ctx_r0.artifactsByStage);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.artifactsByStage.length === 0);
    i04.\u0275\u0275advance(5);
    i04.\u0275\u0275property("ngIf", ctx_r0.jiraLink && !ctx_r0.syncStubMessage);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !ctx_r0.jiraLink);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.jiraLink && ctx_r0.syncStubMessage);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", ctx_r0.jiraLink && !ctx_r0.syncStubMessage);
    i04.\u0275\u0275advance(6);
    i04.\u0275\u0275property("ngIf", ctx_r0.loadingEvents);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngIf", !ctx_r0.loadingEvents && ctx_r0.events.length === 0);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngForOf", ctx_r0.events);
  }
}
var GATE_LABELS = {
  brief_review: "Brief Review",
  go_to_build: "Go to Build",
  go_to_deploy: "Go to Deploy (Pilot Start)",
  go_to_release: "Go to Release",
  close_review: "Close Review"
};
var NEXT_GATE_BY_STAGE = {
  BRIEF: "brief_review",
  DESIGN: "go_to_build",
  SPEC: "go_to_build",
  BUILD: "go_to_deploy",
  VALIDATE: "go_to_deploy",
  PILOT: "go_to_release",
  UAT: "go_to_release",
  RELEASE: "close_review",
  OUTCOME: "close_review"
};
var STAGE_LABEL_MAP = {
  BRIEF: "Brief",
  DESIGN: "Design",
  SPEC: "Spec",
  BUILD: "Build",
  VALIDATE: "Validate",
  PILOT: "Pilot",
  UAT: "UAT",
  RELEASE: "Release",
  OUTCOME: "Outcome",
  COMPLETE: "Complete",
  CANCELLED: "Cancelled",
  ON_HOLD: "On Hold"
};
var DeliveryCycleDetailComponent = class _DeliveryCycleDetailComponent {
  /** True when component is embedded as a right panel (cycleId provided via @Input). */
  get panelMode() {
    return !!this.cycleId;
  }
  constructor(route, delivery, profileService, fb, cdr) {
    this.route = route;
    this.delivery = delivery;
    this.profileService = profileService;
    this.fb = fb;
    this.cdr = cdr;
    this.close = new EventEmitter4();
    this.cycle = null;
    this.events = [];
    this.loading = false;
    this.loadingEvents = false;
    this.loadError = "";
    this.showEditPanel = false;
    this.editingOutcome = false;
    this.savingOutcome = false;
    this.outcomeError = "";
    this.outcomeControl = new FormControl2("", Validators2.required);
    this.advancing = false;
    this.advanceError = "";
    this.selectedGate = null;
    this.selectedGateRecord = null;
    this.gateActionBusy = false;
    this.gateActionError = "";
    this.gateActionHint = "";
    this.editingMilestoneGate = null;
    this.savingMilestone = false;
    this.milestoneError = "";
    this.milestoneDateControl = new FormControl2("");
    this.showAttachForm = false;
    this.attaching = false;
    this.attachError = "";
    this.attachingForTypeId = "";
    this.promoteStubMessage = "";
    this.syncing = false;
    this.syncStubMessage = "";
    this.showJiraLinkForm = false;
    this.linkingJiraEpic = false;
    this.jiraEpicKeyCtrl = new FormControl2("", Validators2.required);
    this.jiraLinkError = "";
    this.approveConfirming = false;
    this.holdBusy = false;
    this.holdError = "";
    this.showHoldReason = false;
    this.holdReasonCtrl = new FormControl2("");
    this.regressPreview = null;
    this.regressConfirming = false;
    this.regressBusy = false;
    this.regressError = "";
    this.cancelConfirming = false;
    this.cancelBusy = false;
    this.cancelError = "";
    this.uncancelConfirming = false;
    this.uncancelBusy = false;
    this.uncancelError = "";
    this.allUsers = [];
    this.editingDs = false;
    this.savingDs = false;
    this.dsError = "";
    this.dsControl = new FormControl2("");
    this.editingCb = false;
    this.savingCb = false;
    this.cbError = "";
    this.cbControl = new FormControl2("");
    this.editingMilestoneStatus = null;
    this.milestoneStatusValue = "";
    this.savingMilestoneStatus = false;
    this.milestoneStatusError = "";
    this.unsetCompleteGate = null;
    this.unsetCompleteReason = new FormControl2("", [Validators2.required, Validators2.minLength(10)]);
    this.unsetCompleteSaving = false;
    this.unsetCompleteError = "";
    this.editingActualDateGate = null;
    this.actualDateControl = new FormControl2("");
    this.savingActualDate = false;
    this.actualDateError = "";
    this.expandedStages = /* @__PURE__ */ new Set();
    this.GATE_LABELS = GATE_LABELS;
    this.STAGE_LABEL_MAP = STAGE_LABEL_MAP;
  }
  ngOnInit() {
    this.gateDecisionForm = this.fb.group({ approver_notes: [""] });
    this.attachForm = this.fb.group({
      display_name: ["", Validators2.required],
      external_url: ["", Validators2.required]
    });
    const id = this.cycleId ?? this.route.snapshot.paramMap.get("cycle_id");
    if (id) {
      this.loadCycle(id);
    }
  }
  ngOnChanges(changes) {
    if (changes["cycleId"] && !changes["cycleId"].firstChange && this.cycleId) {
      this.loadCycle(this.cycleId);
    }
  }
  loadAllUsers() {
    this.profileService.listUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.cdr.markForCheck();
      },
      error: () => {
      }
    });
  }
  loadCycle(cycleId) {
    this.loading = true;
    this.loadError = "";
    this.cdr.markForCheck();
    this.delivery.getCycle(cycleId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycle = res.data;
          this.initExpandedStages();
          this.loadEvents(cycleId);
        } else {
          this.loadError = res.error ?? "Could not load this cycle.";
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadError = err.error ?? "Could not load cycle. Check your access and try again.";
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  loadEvents(cycleId) {
    this.loadingEvents = true;
    this.cdr.markForCheck();
    this.delivery.getEventLog(cycleId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.events = Array.isArray(res.data) ? res.data : [];
        }
        this.loadingEvents = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingEvents = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Computed properties ────────────────────────────────────────────────────
  get gateStateMap() {
    const gates = ["brief_review", "go_to_build", "go_to_deploy", "go_to_release", "close_review"];
    const map = {};
    for (const gate of gates) {
      const record = this.cycle?.gate_records?.find((g) => g.gate_name === gate);
      if (!record) {
        map[gate] = "upcoming";
        continue;
      }
      if (record.gate_status === "approved") {
        map[gate] = "complete";
        continue;
      }
      if (record.gate_status === "blocked") {
        map[gate] = "blocked";
        continue;
      }
      map[gate] = "pending";
    }
    return map;
  }
  get jiraLink() {
    return this.cycle?.jira_links?.[0] ?? null;
  }
  /**
   * Supplement Section 1: can the current caller submit gates on this cycle?
   * Derived from can_submit on any gate record (same value for all — based on role/assignment).
   * Defaults true when no gate records have authority info yet.
   */
  get callerCanSubmitGates() {
    const gateWithAuth = this.cycle?.gate_records?.find((g) => g.current_user_gate_authority != null);
    return gateWithAuth?.current_user_gate_authority?.can_submit ?? true;
  }
  /**
   * Returns true when the selected gate has not yet been reached in the lifecycle
   * and submitting it would be premature. Gates are "not yet active" when the cycle
   * is more than one stage before the gate's trigger point.
   */
  isGateNotYetActive(gateName) {
    if (!this.cycle) {
      return false;
    }
    const GATE_MIN_STAGE_IDX = {
      go_to_build: 2,
      go_to_deploy: 4,
      go_to_release: 6,
      close_review: 8
      // OUTCOME (index 8)
    };
    const STAGE_ORDER2 = [
      "BRIEF",
      "DESIGN",
      "SPEC",
      "BUILD",
      "VALIDATE",
      "PILOT",
      "UAT",
      "RELEASE",
      "OUTCOME",
      "COMPLETE"
    ];
    const minIdx = GATE_MIN_STAGE_IDX[gateName];
    if (minIdx === void 0) {
      return false;
    }
    const currentIdx = STAGE_ORDER2.indexOf(this.cycle.current_lifecycle_stage);
    return currentIdx >= 0 && currentIdx < minIdx;
  }
  get canAdvance() {
    const terminal = ["COMPLETE", "CANCELLED", "ON_HOLD"];
    return !!this.cycle && !terminal.includes(this.cycle.current_lifecycle_stage);
  }
  get canRegress() {
    const blocked = ["BRIEF", "COMPLETE", "CANCELLED", "ON_HOLD"];
    return !!this.cycle && !blocked.includes(this.cycle.current_lifecycle_stage);
  }
  get canPlaceOnHold() {
    const blocked = ["COMPLETE", "CANCELLED", "ON_HOLD"];
    return !!this.cycle && !blocked.includes(this.cycle.current_lifecycle_stage);
  }
  // Contract 1: Cancel Cycle — available when not CANCELLED and not COMPLETE.
  get canCancelCycle() {
    const terminal = ["COMPLETE", "CANCELLED"];
    return !!this.cycle && !terminal.includes(this.cycle.current_lifecycle_stage);
  }
  // Contract 1: Submit Gate for Approval shortcut — next pending gate for current stage.
  // Returns null when no gate is pending or gate is already submitted/approved.
  get pendingGateForSubmit() {
    if (!this.cycle) {
      return null;
    }
    const nextGate = NEXT_GATE_BY_STAGE[this.cycle.current_lifecycle_stage];
    if (!nextGate) {
      return null;
    }
    const record = this.cycle.gate_records?.find((r) => r.gate_name === nextGate);
    if (record?.gate_status === "pending" || record?.gate_status === "approved") {
      return null;
    }
    return nextGate;
  }
  // Contract 3 Block 4 Fix 4: "Behind" requires target date set AND today > target date.
  // When no target date is set, raw server value may be 'behind' — treat as 'not_started'.
  // All template calls for milestone status dot/label go through this wrapper. Source: contract-3-spec.md Block 4 FIX 4.
  effectiveDateStatus(m) {
    if (!m.target_date && m.date_status === "behind") {
      return "not_started";
    }
    return m.date_status;
  }
  // D-244: Milestone Status 5-color dot — maps date_status to color token.
  milestoneStatusDotColor(dateStatus) {
    const map = {
      not_started: "#9E9E9E",
      on_track: "#2E7D32",
      at_risk: "#F2A620",
      behind: "#D32F2F",
      complete: "#257099"
    };
    return map[dateStatus ?? "not_started"] ?? "#9E9E9E";
  }
  // D-245: Gate Approval Status as contextual narrative text.
  // Contract 3 Block 4 Fix 3: "Under Review" only shown for the CURRENT gate (the gate this
  // cycle's lifecycle stage is heading toward). Gates not yet reached show nothing when pending.
  // Source: contract-3-spec.md Block 4 FIX 3.
  gateApprovalNarrative(gateName) {
    const record = this.cycle?.gate_records?.find((r) => r.gate_name === gateName);
    if (!record) {
      return "";
    }
    const currentGate = this.cycle ? NEXT_GATE_BY_STAGE[this.cycle.current_lifecycle_stage] : null;
    switch (record.gate_status) {
      case "pending":
        return gateName === currentGate ? "Under Review \u2014 awaiting decision" : "";
      case "approved":
        return "Approved";
      case "returned":
        return "Returned for revision";
      case "blocked":
        return "Blocked \u2014 workstream inactive";
      default:
        return "";
    }
  }
  // D-245: Color for Gate Approval Status narrative.
  gateApprovalNarrativeColor(gateName) {
    const record = this.cycle?.gate_records?.find((r) => r.gate_name === gateName);
    switch (record?.gate_status) {
      case "approved":
        return "var(--triarq-color-primary)";
      case "returned":
        return "var(--triarq-color-error)";
      case "blocked":
        return "var(--triarq-color-error)";
      case "pending":
        return "var(--triarq-color-sunray,#F2A620)";
      default:
        return "var(--triarq-color-text-secondary)";
    }
  }
  /**
   * Session 2026-03-24-F: gates where gate_status = 'approved' but
   * the corresponding milestone has no actual_date.
   * Returns GateName[] for row-level checks and count in the warning banner.
   */
  get missingActualDateGateNames() {
    if (!this.cycle) {
      return [];
    }
    const approvedGates = this.cycle.gate_records?.filter((g) => g.gate_status === "approved") ?? [];
    return approvedGates.filter((g) => {
      const milestone = this.cycle.milestone_dates?.find((m) => m.gate_name === g.gate_name);
      return milestone && !milestone.actual_date;
    }).map((g) => g.gate_name);
  }
  isMissingActualDate(gate) {
    return this.missingActualDateGateNames.includes(gate);
  }
  /** Group cycle artifacts by lifecycle_stage for the artifacts panel.
   *  Group C: isFuture=true when the stage is beyond the current lifecycle stage — slots are dimmed. */
  get artifactsByStage() {
    const artifacts = this.cycle?.artifacts;
    if (!artifacts?.length) {
      return [];
    }
    const STAGE_ORDER2 = [
      "BRIEF",
      "DESIGN",
      "SPEC",
      "BUILD",
      "VALIDATE",
      "PILOT",
      "UAT",
      "RELEASE",
      "OUTCOME",
      "COMPLETE"
    ];
    const currentIdx = STAGE_ORDER2.indexOf(this.cycle?.current_lifecycle_stage ?? "");
    const stages = [...new Set(artifacts.map((a) => a.lifecycle_stage ?? "General"))];
    return stages.map((stage) => {
      const stageIdx = STAGE_ORDER2.indexOf(stage);
      return {
        stage,
        slots: artifacts.filter((a) => (a.lifecycle_stage ?? "General") === stage),
        isFuture: currentIdx >= 0 && stageIdx > currentIdx
      };
    });
  }
  // ── Outcome ────────────────────────────────────────────────────────────────
  startOutcomeEdit() {
    this.outcomeControl.setValue(this.cycle?.outcome_statement ?? "");
    this.editingOutcome = true;
    this.outcomeError = "";
    this.cdr.markForCheck();
  }
  cancelOutcomeEdit() {
    this.editingOutcome = false;
    this.outcomeError = "";
    this.cdr.markForCheck();
  }
  // ── DS / CB assignment ─────────────────────────────────────────────────────
  startDsEdit() {
    this.dsControl.setValue(this.cycle?.assigned_ds_user_id ?? "");
    this.editingDs = true;
    this.dsError = "";
    this.cdr.markForCheck();
  }
  cancelDsEdit() {
    this.editingDs = false;
    this.dsError = "";
    this.cdr.markForCheck();
  }
  saveDs() {
    if (!this.cycle) {
      return;
    }
    this.savingDs = true;
    this.dsError = "";
    this.cdr.markForCheck();
    this.delivery.assignDsCb({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      assigned_ds_user_id: this.dsControl.value || null
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycle.assigned_ds_user_id = res.data.assigned_ds_user_id;
          this.cycle.assigned_ds_display_name = this.allUsers.find((u) => u.id === res.data.assigned_ds_user_id)?.display_name;
          this.editingDs = false;
          this.loadEvents(this.cycle.delivery_cycle_id);
        } else {
          this.dsError = res.error ?? "Assignment failed.";
        }
        this.savingDs = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.dsError = err.error ?? "Assignment failed. Check permissions and try again.";
        this.savingDs = false;
        this.cdr.markForCheck();
      }
    });
  }
  startCbEdit() {
    this.cbControl.setValue(this.cycle?.assigned_cb_user_id ?? "");
    this.editingCb = true;
    this.cbError = "";
    this.cdr.markForCheck();
  }
  cancelCbEdit() {
    this.editingCb = false;
    this.cbError = "";
    this.cdr.markForCheck();
  }
  saveCb() {
    if (!this.cycle) {
      return;
    }
    this.savingCb = true;
    this.cbError = "";
    this.cdr.markForCheck();
    this.delivery.assignDsCb({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      assigned_cb_user_id: this.cbControl.value || null
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycle.assigned_cb_user_id = res.data.assigned_cb_user_id;
          this.cycle.assigned_cb_display_name = this.allUsers.find((u) => u.id === res.data.assigned_cb_user_id)?.display_name;
          this.editingCb = false;
          this.loadEvents(this.cycle.delivery_cycle_id);
        } else {
          this.cbError = res.error ?? "Assignment failed.";
        }
        this.savingCb = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cbError = err.error ?? "Assignment failed. Check permissions and try again.";
        this.savingCb = false;
        this.cdr.markForCheck();
      }
    });
  }
  saveOutcome() {
    if (!this.cycle || !this.outcomeControl.value?.trim()) {
      return;
    }
    this.savingOutcome = true;
    this.outcomeError = "";
    this.cdr.markForCheck();
    this.delivery.setOutcomeStatement({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      outcome_statement: this.outcomeControl.value.trim()
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycle.outcome_statement = res.data.outcome_statement;
          this.editingOutcome = false;
          this.loadEvents(this.cycle.delivery_cycle_id);
        } else {
          this.outcomeError = res.error ?? "Save failed.";
        }
        this.savingOutcome = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.outcomeError = err.error ?? "Save failed. Check permissions and try again.";
        this.savingOutcome = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Stage advance ──────────────────────────────────────────────────────────
  advanceStage() {
    if (!this.cycle) {
      return;
    }
    this.advancing = true;
    this.advanceError = "";
    this.cdr.markForCheck();
    this.delivery.advanceStage(this.cycle.delivery_cycle_id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.loadCycle(this.cycle.delivery_cycle_id);
        } else {
          this.advanceError = res.error ?? "Advance failed.";
        }
        this.advancing = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.advanceError = err.error ?? "Advance failed. Check gate status and Workstream.";
        this.advancing = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Stage regression — D-179 two-call pattern ─────────────────────────────
  /** Call 1: fetch preview (target stage + gates that will reset). */
  initiateRegress() {
    if (!this.cycle) {
      return;
    }
    this.regressBusy = true;
    this.regressError = "";
    this.cdr.markForCheck();
    this.delivery.reverseStage({ delivery_cycle_id: this.cycle.delivery_cycle_id }).subscribe({
      next: (res) => {
        if (res.success && res.data?.["requires_confirmation"]) {
          this.regressPreview = res.data;
          this.regressConfirming = true;
        } else {
          this.regressError = res.error ?? "Unable to preview stage regression.";
        }
        this.regressBusy = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.regressError = err.error ?? "Could not reach the server.";
        this.regressBusy = false;
        this.cdr.markForCheck();
      }
    });
  }
  /** Call 2: user confirmed — execute regression. */
  confirmRegress() {
    if (!this.cycle) {
      return;
    }
    this.regressBusy = true;
    this.regressError = "";
    this.cdr.markForCheck();
    this.delivery.reverseStage({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      confirmed: true
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.regressConfirming = false;
          this.regressPreview = null;
          this.loadCycle(this.cycle.delivery_cycle_id);
        } else {
          this.regressError = res.error ?? "Stage regression failed.";
        }
        this.regressBusy = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.regressError = err.error ?? "Stage regression failed.";
        this.regressBusy = false;
        this.cdr.markForCheck();
      }
    });
  }
  cancelRegress() {
    this.regressConfirming = false;
    this.regressPreview = null;
    this.regressError = "";
    this.cdr.markForCheck();
  }
  // ── ON_HOLD ────────────────────────────────────────────────────────────────
  placeOnHold() {
    if (!this.cycle) {
      return;
    }
    this.holdBusy = true;
    this.holdError = "";
    this.cdr.markForCheck();
    const reason = this.holdReasonCtrl.value?.trim() || void 0;
    this.delivery.setOnHold(__spreadValues({
      delivery_cycle_id: this.cycle.delivery_cycle_id
    }, reason ? { hold_reason: reason } : {})).subscribe({
      next: (res) => {
        if (res.success) {
          this.showHoldReason = false;
          this.holdReasonCtrl.reset();
          this.loadCycle(this.cycle.delivery_cycle_id);
        } else {
          this.holdError = res.error ?? "Could not place cycle on hold.";
        }
        this.holdBusy = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.holdError = err.error ?? "Could not place cycle on hold.";
        this.holdBusy = false;
        this.cdr.markForCheck();
      }
    });
  }
  resumeFromHold() {
    if (!this.cycle) {
      return;
    }
    this.holdBusy = true;
    this.holdError = "";
    this.cdr.markForCheck();
    this.delivery.resumeFromHold(this.cycle.delivery_cycle_id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadCycle(this.cycle.delivery_cycle_id);
        } else {
          this.holdError = res.error ?? "Could not resume cycle from hold.";
        }
        this.holdBusy = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.holdError = err.error ?? "Could not resume cycle from hold.";
        this.holdBusy = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Contract 1 action zone methods ────────────────────────────────────────
  // Opens Edit Cycle panel — S-006 push. Replaces editCycleStub() from Contract 1.
  // Contract 2 2026-04-10.
  openEditPanel() {
    this.showEditPanel = true;
    this.cdr.markForCheck();
  }
  // Edit saved: pop Edit from stack, re-query cycle unconditionally per S-008.
  onEditSaved() {
    this.showEditPanel = false;
    this.loadCycle(this.cycle.delivery_cycle_id);
    this.cdr.markForCheck();
  }
  // Edit cancelled: pop Edit from stack. No re-query (spec 2.6).
  onEditCancelled() {
    this.showEditPanel = false;
    this.cdr.markForCheck();
  }
  // Cancel Cycle action — D-183 two-step pattern. State: cancelConfirming guards the button.
  cancelCycleAction() {
    if (!this.cycle) {
      return;
    }
    this.cancelBusy = true;
    this.cancelError = "";
    this.cdr.markForCheck();
    this.delivery.cancelCycle(this.cycle.delivery_cycle_id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycle = res.data;
          this.cancelConfirming = false;
        } else {
          this.cancelError = res.error ?? "Cancel failed. Please try again.";
        }
        this.cancelBusy = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cancelError = "Cancel failed. Please try again.";
        this.cancelBusy = false;
        this.cdr.markForCheck();
      }
    });
  }
  // Un-cancel Cycle action — D-183 two-step pattern. State: uncancelConfirming guards the button.
  uncancelCycleAction() {
    if (!this.cycle) {
      return;
    }
    this.uncancelBusy = true;
    this.uncancelError = "";
    this.cdr.markForCheck();
    this.delivery.uncancelCycle(this.cycle.delivery_cycle_id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycle = res.data;
          this.uncancelConfirming = false;
        } else {
          this.uncancelError = res.error ?? "Restore failed. Please try again.";
        }
        this.uncancelBusy = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.uncancelError = "Restore failed. Please try again.";
        this.uncancelBusy = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Gate panel ─────────────────────────────────────────────────────────────
  openGatePanel(gate) {
    this.selectedGate = gate;
    this.selectedGateRecord = this.cycle?.gate_records?.find((g) => g.gate_name === gate) ?? null;
    this.gateActionError = "";
    this.gateActionHint = "";
    this.approveConfirming = false;
    this.gateDecisionForm.reset();
    this.cdr.markForCheck();
  }
  submitGate(gate) {
    if (!this.cycle) {
      return;
    }
    this.gateActionBusy = true;
    this.gateActionError = "";
    this.gateActionHint = "";
    this.cdr.markForCheck();
    this.delivery.submitGateForApproval({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name: gate
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadCycle(this.cycle.delivery_cycle_id);
        } else {
          this.gateActionError = res.error ?? "Submit failed.";
          this.gateActionHint = "Check that the Workstream is active. If it has been deactivated, an admin must reactivate it before gates can be submitted.";
        }
        this.gateActionBusy = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.gateActionError = err.error ?? "Submit failed.";
        this.gateActionHint = "Check that the Workstream is active before submitting for approval.";
        this.gateActionBusy = false;
        this.cdr.markForCheck();
      }
    });
  }
  /** No-op — decision submitted via recordDecisionWithValue buttons */
  recordDecision(_gate) {
  }
  recordDecisionWithValue(gate, decision) {
    if (!this.cycle) {
      return;
    }
    const notes = this.gateDecisionForm.value.approver_notes ?? "";
    if (decision === "returned" && !notes.trim()) {
      this.gateActionError = "Approver Return Notes are required when returning a gate.";
      this.gateActionHint = "Add notes explaining what must be resolved before resubmission.";
      this.cdr.markForCheck();
      return;
    }
    this.gateActionBusy = true;
    this.gateActionError = "";
    this.gateActionHint = "";
    this.cdr.markForCheck();
    this.delivery.recordGateDecision({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name: gate,
      decision,
      approver_notes: notes.trim() || void 0
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedGate = null;
          this.selectedGateRecord = null;
          this.loadCycle(this.cycle.delivery_cycle_id);
        } else {
          this.gateActionError = res.error ?? "Decision record failed.";
          this.gateActionHint = decision === "returned" ? "Provide notes explaining the return reason so the team can act on it." : "Check Workstream status and try again. If the Workstream is inactive, reactivate it first.";
        }
        this.gateActionBusy = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.gateActionError = err.error ?? "Decision record failed.";
        this.gateActionBusy = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Milestone dates ────────────────────────────────────────────────────────
  startMilestoneEdit(m) {
    this.editingMilestoneGate = m.gate_name;
    this.milestoneDateControl.setValue(m.target_date ?? "");
    this.milestoneError = "";
    this.cdr.markForCheck();
  }
  cancelMilestoneEdit() {
    this.editingMilestoneGate = null;
    this.milestoneError = "";
    this.cdr.markForCheck();
  }
  saveMilestoneDate(gate) {
    if (!this.cycle || !this.milestoneDateControl.value) {
      return;
    }
    this.savingMilestone = true;
    this.milestoneError = "";
    this.cdr.markForCheck();
    const preSaveIdx = this.cycle.milestone_dates?.findIndex((m) => m.gate_name === gate) ?? -1;
    const wasBehind = preSaveIdx !== -1 && this.cycle.milestone_dates[preSaveIdx].date_status === "behind";
    this.delivery.setMilestoneTargetDate({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name: gate,
      target_date: this.milestoneDateControl.value
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const idx = this.cycle.milestone_dates?.findIndex((m) => m.gate_name === gate) ?? -1;
          if (idx !== -1 && this.cycle.milestone_dates) {
            const updated = res.data;
            if (wasBehind && updated.date_status === "behind") {
              updated.date_status = "not_started";
            }
            this.cycle.milestone_dates[idx] = updated;
          }
          this.editingMilestoneGate = null;
        } else {
          this.milestoneError = res.error ?? "Save failed.";
        }
        this.savingMilestone = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.milestoneError = err.error ?? "Save failed.";
        this.savingMilestone = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Artifacts ──────────────────────────────────────────────────────────────
  openAttachForm(artifactTypeId) {
    this.attachingForTypeId = artifactTypeId;
    this.showAttachForm = true;
    this.attachError = "";
    this.promoteStubMessage = "";
    this.attachForm.reset();
    this.cdr.markForCheck();
  }
  cancelAttach() {
    this.showAttachForm = false;
    this.attachError = "";
    this.cdr.markForCheck();
  }
  submitAttach() {
    if (!this.cycle || this.attachForm.invalid) {
      return;
    }
    this.attaching = true;
    this.attachError = "";
    this.cdr.markForCheck();
    this.delivery.attachArtifact({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      artifact_type_id: this.attachingForTypeId || void 0,
      display_name: this.attachForm.value.display_name,
      external_url: this.attachForm.value.external_url
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showAttachForm = false;
          this.loadCycle(this.cycle.delivery_cycle_id);
        } else {
          this.attachError = res.error ?? "Attach failed.";
        }
        this.attaching = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.attachError = err.error ?? "Attach failed. Check the URL and try again.";
        this.attaching = false;
        this.cdr.markForCheck();
      }
    });
  }
  promoteArtifact(artifact) {
    this.promoteStubMessage = "";
    this.delivery.promoteArtifact({
      cycle_artifact_id: artifact.cycle_artifact_id,
      oi_library_artifact_id: artifact.cycle_artifact_id
      // placeholder until OI Library wired in Build B
    }).subscribe({
      next: (res) => {
        if (res.stub_message) {
          this.promoteStubMessage = res.stub_message;
        } else if (res.success) {
          this.loadCycle(this.cycle.delivery_cycle_id);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }
  // ── Jira sync ──────────────────────────────────────────────────────────────
  /** State 1: Link a Jira epic to this cycle using the epic key form. */
  linkJiraEpic() {
    if (!this.cycle || !this.jiraEpicKeyCtrl.value?.trim()) {
      return;
    }
    this.linkingJiraEpic = true;
    this.jiraLinkError = "";
    this.cdr.markForCheck();
    this.delivery.syncJiraEpic({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      jira_epic_key: this.jiraEpicKeyCtrl.value.trim()
    }).subscribe({
      next: (res) => {
        if (res.success || res.data?.["stub"]) {
          this.showJiraLinkForm = false;
          this.jiraEpicKeyCtrl.reset();
          this.loadCycle(this.cycle.delivery_cycle_id);
        } else {
          this.jiraLinkError = res.error ?? "Could not link epic. Check the key and try again.";
        }
        this.linkingJiraEpic = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.jiraLinkError = "Could not reach the server. Check your connection and try again.";
        this.linkingJiraEpic = false;
        this.cdr.markForCheck();
      }
    });
  }
  triggerJiraSync() {
    if (!this.cycle || !this.jiraLink) {
      return;
    }
    this.syncing = true;
    this.syncStubMessage = "";
    this.cdr.markForCheck();
    this.delivery.syncJiraEpic({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      jira_epic_key: this.jiraLink.jira_epic_key
    }).subscribe({
      next: (res) => {
        if (res.success && res.data?.["stub"]) {
          this.syncStubMessage = res.data["message"] ?? "";
        } else if (!res.success) {
          this.syncStubMessage = res.error ?? "Sync failed.";
        }
        this.loadCycle(this.cycle.delivery_cycle_id);
        this.syncing = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.syncing = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Presentation helpers ───────────────────────────────────────────────────
  stagePillBg(stage) {
    if (stage === "COMPLETE") {
      return "#e8f5e9";
    }
    if (stage === "CANCELLED") {
      return "#fdecea";
    }
    if (stage === "ON_HOLD") {
      return "#fff8e1";
    }
    return "var(--triarq-color-background-subtle)";
  }
  tierPillBg(tier) {
    return tier === "tier_1" ? "#e3f2fd" : tier === "tier_2" ? "#f3e5f5" : "#e8f5e9";
  }
  // ── Badge helpers (Visual Layout Standards 1.7/3.1 — 4px radius, not pill) ──
  tierBadgeBg(tier) {
    if (tier === "tier_1") {
      return "#E3F2FD";
    }
    if (tier === "tier_2") {
      return "#E0F2F1";
    }
    return "#FFF3E0";
  }
  tierBadgeColor(tier) {
    if (tier === "tier_1") {
      return "#1565C0";
    }
    if (tier === "tier_2") {
      return "#00695C";
    }
    return "#E65100";
  }
  tierLabel(tier) {
    if (tier === "tier_1") {
      return "1";
    }
    if (tier === "tier_2") {
      return "2";
    }
    return "3";
  }
  // ── Gate status text display (Section 2.4 — display-only per date state model) ──
  /** Gate status text color per Visual Layout Standards 1.7 */
  gateStatusTextColor(dateStatus) {
    if (dateStatus === "on_track") {
      return "var(--triarq-color-sunray,#F2A620)";
    }
    if (dateStatus === "at_risk") {
      return "#E96127";
    }
    return "#9E9E9E";
  }
  /** Gate status font weight per Visual Layout Standards 1.7 */
  gateStatusFontWeight(dateStatus) {
    return dateStatus === "not_started" ? "400" : "600";
  }
  /** Gate status display label (pending/awaiting = Sunray label) */
  gateStatusDisplayLabel(dateStatus) {
    const labels = {
      not_started: "Not Started",
      on_track: "Awaiting Approval",
      at_risk: "At Risk"
    };
    return labels[dateStatus] ?? dateStatus;
  }
  gateStatusBg(status) {
    if (status === "approved") {
      return "#e8f5e9";
    }
    if (status === "blocked") {
      return "#fdecea";
    }
    if (status === "returned") {
      return "#fff8e1";
    }
    return "var(--triarq-color-background-subtle)";
  }
  gateStatusColor(status) {
    if (status === "approved") {
      return "#2e7d32";
    }
    if (status === "blocked") {
      return "var(--triarq-color-error)";
    }
    if (status === "returned") {
      return "#e65100";
    }
    return "var(--triarq-color-text-secondary)";
  }
  milestoneTargetColor(m) {
    if (!m.target_date || m.actual_date) {
      return "var(--triarq-color-primary)";
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const diff = Math.ceil((new Date(m.target_date).getTime() - new Date(today).getTime()) / 864e5);
    if (diff < 0) {
      return "var(--triarq-color-error, #d32f2f)";
    }
    if (diff <= 4) {
      return "var(--triarq-color-sunray, #f5a623)";
    }
    return "var(--triarq-color-primary)";
  }
  trackByMilestoneId(_, m) {
    return m.milestone_id;
  }
  // ── S2: Gate detail sub-panel methods ─────────────────────────────────────
  /** Close gate panel without navigating away — Principle 10 */
  closeGatePanel() {
    this.selectedGate = null;
    this.selectedGateRecord = null;
    this.gateActionError = "";
    this.gateActionHint = "";
    this.approveConfirming = false;
    this.cdr.markForCheck();
  }
  /** Compute the display status label for the gate — Section 2.3 of Part 2 spec */
  gateDetailStatus(gate) {
    const record = this.cycle?.gate_records?.find((g) => g.gate_name === gate);
    if (record?.gate_status === "approved") {
      return "Approved";
    }
    if (record?.gate_status === "blocked") {
      return "Blocked";
    }
    if (record?.gate_status === "returned") {
      return "Returned";
    }
    if (record?.gate_status === "pending") {
      return "Under Review";
    }
    if (this.isGateNotYetActive(gate)) {
      return "Not Yet Active";
    }
    const nextGate = NEXT_GATE_BY_STAGE[this.cycle?.current_lifecycle_stage ?? "BRIEF"];
    if (nextGate === gate) {
      return "Pending";
    }
    return "Upcoming";
  }
  gateDetailStatusBg(gate) {
    const s = this.gateDetailStatus(gate);
    if (s === "Approved") {
      return "#e8f5e9";
    }
    if (s === "Blocked") {
      return "#fdecea";
    }
    if (s === "Returned") {
      return "#fff8e1";
    }
    if (s === "Under Review") {
      return "#e3f2fd";
    }
    if (s === "Pending") {
      return "var(--triarq-color-background-subtle)";
    }
    return "#f5f5f5";
  }
  gateDetailStatusColor(gate) {
    const s = this.gateDetailStatus(gate);
    if (s === "Approved") {
      return "#2e7d32";
    }
    if (s === "Blocked") {
      return "var(--triarq-color-error)";
    }
    if (s === "Returned") {
      return "#e65100";
    }
    if (s === "Under Review") {
      return "var(--triarq-color-primary)";
    }
    return "var(--triarq-color-text-secondary)";
  }
  /** Milestone row matching the selected gate — shown in gate sub-panel MILESTONE DATE section */
  get selectedGateMilestone() {
    if (!this.selectedGate || !this.cycle) {
      return null;
    }
    return this.cycle.milestone_dates?.find((m) => m.gate_name === this.selectedGate) ?? null;
  }
  /** Gate checklist — computed from cycle state per gate name. Section 2.2, Part 2 spec. */
  gateChecklist(gate) {
    if (!this.cycle) {
      return [];
    }
    const c = this.cycle;
    const arts = c.artifacts ?? [];
    const byStage = (stage) => arts.filter((a) => a.lifecycle_stage === stage && a.external_url);
    const briefArts = byStage("BRIEF");
    const specArts = byStage("SPEC");
    const buildArts = byStage("BUILD");
    const uatArts = byStage("UAT");
    const pilotArts = byStage("PILOT");
    const outcomeArts = byStage("OUTCOME");
    const hasName = (list, ...terms) => list.some((a) => terms.some((t) => (a.artifact_type_name ?? "").toLowerCase().includes(t)));
    const isTier3 = c.tier_classification === "tier_3";
    switch (gate) {
      case "brief_review":
        return [
          { label: "Context Package attached (at least one Brief Artifact)", met: briefArts.length > 0 },
          { label: "Outcome Statement set", met: !!c.outcome_statement },
          { label: "Tier classification set", met: !!c.tier_classification },
          { label: "Assigned Domain Strategist set", met: !!c.assigned_ds_user_id }
        ];
      case "go_to_build":
        return [
          { label: "Context Package attached", met: briefArts.length > 0 },
          { label: "Outcome Statement set", met: !!c.outcome_statement },
          { label: "Technical Specification complete", met: hasName(specArts, "technical spec") },
          { label: "Tier classification set", met: !!c.tier_classification },
          { label: "Jira epic linked", met: !!c.jira_links?.[0]?.jira_epic_key },
          { label: "MCP scope declared (Cursor Prompt or Agent Registry)", met: hasName(specArts, "cursor prompt", "agent registry", "mcp scope") },
          { label: "Assigned Capability Builder set", met: !!c.assigned_cb_user_id }
        ];
      case "go_to_deploy":
        return [
          { label: "Delivery Cycle Build Report attached", met: hasName(buildArts, "build report") },
          { label: "UAT sign-off record attached", met: hasName(uatArts, "uat sign") },
          ...isTier3 ? [
            { label: "7-step governance checklist attached (Tier 3)", met: hasName(uatArts, "7-step", "governance checklist") },
            { label: "HITRUST/GRICS checklist attached (Tier 3)", met: hasName(uatArts, "hitrust", "grics") }
          ] : []
        ];
      case "go_to_release":
        return [
          { label: "Pilot observations log attached", met: hasName(pilotArts, "pilot observ") },
          ...isTier3 ? [
            { label: "AI Production Governance Board compliance check (Tier 3)", met: false }
          ] : []
        ];
      case "close_review":
        return [
          { label: "Outcome measurement record attached", met: hasName(outcomeArts, "outcome measurement") },
          { label: "Outcome Statement matches demonstrated result (confirm in notes)", met: !!this.selectedGateRecord?.approver_notes },
          ...isTier3 ? [
            { label: "Wiz continuous monitoring baseline attached (Tier 3)", met: hasName(outcomeArts, "wiz") }
          ] : []
        ];
      default:
        return [];
    }
  }
  /** Short tier label for gate sub-panel breadcrumb — "1", "2", or "3" */
  tierShortLabel(tier) {
    return tier === "tier_1" ? "1" : tier === "tier_2" ? "2" : "3";
  }
  /** Resolve approver display name from allUsers list */
  approverDisplayName(userId) {
    return this.allUsers.find((u) => u.id === userId)?.display_name ?? userId;
  }
  // ── Date status helpers (used in gate sub-panel + milestone rows) ──────────
  dateStatusLabel(s) {
    const labels = {
      not_started: "Not Started",
      on_track: "On Track",
      at_risk: "At Risk",
      behind: "Behind",
      complete: "Complete"
    };
    return labels[s] ?? s;
  }
  dateStatusBg(s) {
    if (s === "on_track") {
      return "#e8f5e9";
    }
    if (s === "at_risk") {
      return "#fff8e1";
    }
    if (s === "behind") {
      return "#fdecea";
    }
    if (s === "complete") {
      return "#e3f2fd";
    }
    return "var(--triarq-color-background-subtle)";
  }
  dateStatusColor(s) {
    if (s === "on_track") {
      return "#2e7d32";
    }
    if (s === "at_risk") {
      return "#e65100";
    }
    if (s === "behind") {
      return "var(--triarq-color-error)";
    }
    if (s === "complete") {
      return "var(--triarq-color-primary)";
    }
    return "var(--triarq-color-text-secondary)";
  }
  /** Options available to user for status dropdown based on current date_status */
  milestoneStatusOptions(current) {
    const all = [
      { value: "not_started", label: "Not Started" },
      { value: "on_track", label: "On Track" },
      { value: "at_risk", label: "At Risk" }
    ];
    return all.filter((o) => o.value !== current);
  }
  // ── Item 1: Milestone status edit ─────────────────────────────────────────
  startMilestoneStatusEdit(m) {
    this.editingMilestoneStatus = m.gate_name;
    this.milestoneStatusValue = m.date_status;
    this.milestoneStatusError = "";
    this.cdr.markForCheck();
  }
  cancelMilestoneStatusEdit() {
    this.editingMilestoneStatus = null;
    this.milestoneStatusError = "";
    this.cdr.markForCheck();
  }
  saveMilestoneStatus(gate) {
    if (!this.cycle || !this.milestoneStatusValue) {
      return;
    }
    this.savingMilestoneStatus = true;
    this.milestoneStatusError = "";
    this.cdr.markForCheck();
    this.delivery.updateMilestoneStatus({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name: gate,
      date_status: this.milestoneStatusValue
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const idx = this.cycle.milestone_dates?.findIndex((m) => m.gate_name === gate) ?? -1;
          if (idx !== -1 && this.cycle.milestone_dates) {
            this.cycle.milestone_dates[idx] = res.data;
          }
          this.editingMilestoneStatus = null;
        } else {
          this.milestoneStatusError = res.error ?? "Save failed.";
        }
        this.savingMilestoneStatus = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.milestoneStatusError = err.error ?? "Save failed. Try again.";
        this.savingMilestoneStatus = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Item 1: Unset Complete inline confirmation — Principle 13 ──────────────
  /** Begin the Unset Complete flow — show inline confirmation with impact statement. */
  startUnsetComplete(gate) {
    this.unsetCompleteGate = gate;
    this.unsetCompleteReason.reset();
    this.unsetCompleteError = "";
    this.cdr.markForCheck();
  }
  cancelUnsetComplete() {
    this.unsetCompleteGate = null;
    this.unsetCompleteError = "";
    this.cdr.markForCheck();
  }
  /** Save Unset Complete — requires reason ≥ 10 chars; logs to audit trail. */
  confirmUnsetComplete() {
    if (!this.cycle || !this.unsetCompleteGate || this.unsetCompleteReason.invalid) {
      return;
    }
    this.unsetCompleteSaving = true;
    this.unsetCompleteError = "";
    this.cdr.markForCheck();
    this.delivery.updateMilestoneStatus({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name: this.unsetCompleteGate,
      date_status: "not_started",
      status_override_reason: this.unsetCompleteReason.value?.trim() ?? ""
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const idx = this.cycle.milestone_dates?.findIndex((m) => m.gate_name === this.unsetCompleteGate) ?? -1;
          if (idx !== -1 && this.cycle.milestone_dates) {
            this.cycle.milestone_dates[idx] = res.data;
          }
          this.unsetCompleteGate = null;
          this.loadEvents(this.cycle.delivery_cycle_id);
        } else {
          this.unsetCompleteError = res.error ?? "Save failed.";
        }
        this.unsetCompleteSaving = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.unsetCompleteError = err.error ?? "Save failed. Try again.";
        this.unsetCompleteSaving = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Session 2026-03-24-F: manual actual date entry (data quality path) ────────
  startActualDateEdit(gate) {
    this.editingActualDateGate = gate;
    this.actualDateControl.setValue("");
    this.actualDateError = "";
    this.cdr.markForCheck();
  }
  cancelActualDateEdit() {
    this.editingActualDateGate = null;
    this.actualDateError = "";
    this.cdr.markForCheck();
  }
  saveActualDate(gate) {
    if (!this.cycle || !this.actualDateControl.value) {
      return;
    }
    this.savingActualDate = true;
    this.actualDateError = "";
    this.cdr.markForCheck();
    this.delivery.setMilestoneActualDate({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name: gate,
      actual_date: this.actualDateControl.value,
      manually_entered: true
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const idx = this.cycle.milestone_dates?.findIndex((m) => m.gate_name === gate) ?? -1;
          if (idx !== -1 && this.cycle.milestone_dates) {
            this.cycle.milestone_dates[idx] = res.data;
          }
          this.editingActualDateGate = null;
          this.loadEvents(this.cycle.delivery_cycle_id);
        } else {
          this.actualDateError = res.error ?? "Save failed.";
        }
        this.savingActualDate = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.actualDateError = err.error ?? "Save failed. Try again.";
        this.savingActualDate = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Item 2: Artifact stage expand/collapse ─────────────────────────────────
  /** Initialise expandedStages: current + past stages expanded; future collapsed. */
  initExpandedStages() {
    if (!this.cycle) {
      return;
    }
    const STAGE_ORDER2 = [
      "BRIEF",
      "DESIGN",
      "SPEC",
      "BUILD",
      "VALIDATE",
      "PILOT",
      "UAT",
      "RELEASE",
      "OUTCOME",
      "COMPLETE"
    ];
    const currentIdx = STAGE_ORDER2.indexOf(this.cycle.current_lifecycle_stage);
    this.expandedStages = new Set(STAGE_ORDER2.filter((_, i) => i <= currentIdx));
  }
  /** Toggle a stage section open or closed. */
  toggleStageExpand(stage) {
    if (this.expandedStages.has(stage)) {
      this.expandedStages.delete(stage);
    } else {
      this.expandedStages.add(stage);
    }
    this.cdr.markForCheck();
  }
  isStageExpanded(stage) {
    return this.expandedStages.has(stage);
  }
  /** Count attached artifacts in a stage group */
  attachedCountInGroup(slots) {
    return slots.filter((s) => s.external_url || s.oi_library_artifact_id).length;
  }
  static {
    this.\u0275fac = function DeliveryCycleDetailComponent_Factory(t) {
      return new (t || _DeliveryCycleDetailComponent)(i04.\u0275\u0275directiveInject(i13.ActivatedRoute), i04.\u0275\u0275directiveInject(DeliveryService), i04.\u0275\u0275directiveInject(UserProfileService), i04.\u0275\u0275directiveInject(i4.FormBuilder), i04.\u0275\u0275directiveInject(i04.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i04.\u0275\u0275defineComponent({ type: _DeliveryCycleDetailComponent, selectors: [["app-delivery-cycle-detail"]], inputs: { cycleId: "cycleId" }, outputs: { close: "close" }, standalone: true, features: [i04.\u0275\u0275NgOnChangesFeature, i04.\u0275\u0275StandaloneFeature], decls: 3, vars: 3, consts: [["style", "max-width:1100px;margin:var(--triarq-space-xl) auto;\n                                padding:0 var(--triarq-space-md);", 4, "ngIf"], ["style", "max-width:700px;margin:var(--triarq-space-2xl) auto;", "class", "oi-card", 4, "ngIf"], ["style", "position:relative;", 3, "ngStyle", 4, "ngIf"], [2, "max-width", "1100px", "margin", "var(--triarq-space-xl) auto", "padding", "0 var(--triarq-space-md)"], [1, "oi-card", 2, "margin-bottom", "var(--triarq-space-md)"], ["animated", "", 2, "width", "28%", "height", "16px", "border-radius", "4px", "margin-bottom", "8px"], ["animated", "", 2, "width", "55%", "height", "22px", "border-radius", "4px", "margin-bottom", "6px"], ["animated", "", 2, "width", "38%", "height", "13px", "border-radius", "4px"], ["animated", "", 2, "width", "22%", "height", "15px", "border-radius", "4px", "margin-bottom", "8px"], ["animated", "", 2, "width", "78%", "height", "13px", "border-radius", "4px", "margin-bottom", "4px"], ["animated", "", 2, "width", "55%", "height", "13px", "border-radius", "4px"], ["animated", "", 2, "width", "18%", "height", "15px", "border-radius", "4px", "margin-bottom", "10px"], ["animated", "", 2, "width", "100%", "height", "44px", "border-radius", "8px"], [1, "oi-card", 2, "max-width", "700px", "margin", "var(--triarq-space-2xl) auto"], [2, "color", "var(--triarq-color-error)", "font-weight", "500", "margin-bottom", "8px"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], ["routerLink", "/delivery", 2, "color", "var(--triarq-color-primary)"], [2, "position", "relative", 3, "ngStyle"], [3, "cycle", "allUsers", "saved", "cancelled", 4, "ngIf"], ["style", "display:flex;justify-content:flex-end;margin-bottom:var(--triarq-space-sm);", 4, "ngIf"], [2, "display", "flex", "align-items", "flex-start", "justify-content", "space-between", "flex-wrap", "wrap", "gap", "var(--triarq-space-sm)"], [2, "display", "flex", "align-items", "center", "gap", "var(--triarq-space-sm)", "flex-wrap", "wrap", "margin-bottom", "var(--triarq-space-xs)"], [2, "background", "var(--triarq-color-primary,#257099)", "color", "#fff", "font-size", "12px", "font-weight", "500", "font-family", "Roboto,sans-serif", "border-radius", "4px", "padding", "3px 8px", "text-transform", "uppercase", "letter-spacing", "0.5px"], [2, "font-size", "12px", "font-weight", "500", "font-family", "Roboto,sans-serif", "border-radius", "4px", "padding", "3px 8px"], [2, "margin", "0 0 4px 0"], [4, "ngIf"], ["style", "color:#9E9E9E;font-style:italic;", 4, "ngIf"], [2, "display", "flex", "gap", "var(--triarq-space-lg)", "margin-top", "var(--triarq-space-sm)", "flex-wrap", "wrap"], [2, "font-size", "var(--triarq-text-small)"], [2, "color", "var(--triarq-color-text-secondary)"], ["style", "font-weight:500;", 4, "ngIf"], ["style", "color:var(--triarq-color-text-secondary);font-style:italic;", 4, "ngIf"], [2, "display", "flex", "flex-direction", "column", "gap", "6px", "align-items", "flex-end", "flex-shrink", "0"], [1, "oi-btn-primary", 2, "white-space", "nowrap", "font-size", "var(--triarq-text-small)", 3, "click"], ["style", "white-space:nowrap;font-size:11px;color:var(--triarq-color-primary);\n                           background:none;border:1px solid var(--triarq-color-primary);\n                           border-radius:5px;padding:3px 8px;cursor:pointer;", 3, "click", 4, "ngIf"], ["disabled", "", "style", "white-space:nowrap;font-size:11px;color:var(--triarq-color-primary);\n                           background:none;border:1px solid var(--triarq-color-primary);\n                           border-radius:5px;padding:3px 8px;\n                           display:flex;align-items:center;gap:4px;", 4, "ngIf"], ["style", "white-space:nowrap;font-size:11px;color:var(--triarq-color-text-secondary);\n                           background:none;border:1px solid var(--triarq-color-border);\n                           border-radius:5px;padding:3px 8px;cursor:pointer;\n                           display:flex;align-items:center;gap:4px;", 3, "disabled", "click", 4, "ngIf"], ["style", "white-space:nowrap;font-size:11px;color:var(--triarq-color-error);\n                           background:none;border:1px solid var(--triarq-color-error);\n                           border-radius:5px;padding:3px 8px;cursor:pointer;", 3, "click", 4, "ngIf"], ["style", "margin-top:var(--triarq-space-xs);padding:var(--triarq-space-xs);\n                    border:1px solid var(--triarq-color-sunray,#f5a623);border-radius:5px;\n                    background:#fff8e1;", 4, "ngIf"], ["style", "margin-top:var(--triarq-space-xs);padding:var(--triarq-space-xs);\n                    border:1px solid var(--triarq-color-error);border-radius:5px;\n                    background:#FFF5F5;", 4, "ngIf"], ["style", "margin-top:var(--triarq-space-xs);padding:var(--triarq-space-xs);\n                    border:1px solid var(--triarq-color-primary);border-radius:5px;\n                    background:#F0F7FF;", 4, "ngIf"], [2, "font-weight", "500", "font-size", "var(--triarq-text-body)", "margin-bottom", "var(--triarq-space-xs)"], [2, "border", "1.5px solid var(--triarq-color-sunray,#F2A620)", "background", "#FFFBF0", "border-radius", "6px", "padding", "12px"], ["style", "color:var(--triarq-color-sunray,#F2A620);font-size:14px;\n                      font-style:italic;font-family:Roboto,sans-serif;", 4, "ngIf"], ["style", "font-size:14px;font-style:italic;font-family:Roboto,sans-serif;\n                      color:#262626;white-space:pre-wrap;", 4, "ngIf"], [2, "font-weight", "500", "margin-bottom", "4px"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "margin-bottom", "var(--triarq-space-sm)"], ["displayMode", "full", 3, "gateClicked", "currentStageId", "gateStateMap"], ["style", "margin-bottom:var(--triarq-space-md);\n                  background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);\n                  border-radius:0 6px 6px 0;padding:var(--triarq-space-sm) var(--triarq-space-md);", 4, "ngIf"], [2, "display", "grid", "grid-template-columns", "1fr 1fr", "gap", "var(--triarq-space-md)", "margin-bottom", "var(--triarq-space-md)"], [1, "oi-card"], ["style", "display:grid;grid-template-columns:2fr 1fr 1fr 100px;\n                      gap:var(--triarq-space-sm);padding:12px 0;\n                      border-bottom:1px solid var(--triarq-color-border);\n                      font-size:var(--triarq-text-small);align-items:start;", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "oi-card", 2, "position", "relative"], ["message", "Processing gate\u2026", 3, "visible"], [2, "display", "flex", "align-items", "flex-start", "justify-content", "space-between", "margin-bottom", "var(--triarq-space-sm)"], [2, "font-weight", "500"], ["style", "font-weight:400;color:var(--triarq-color-text-secondary);", 4, "ngIf"], ["style", "font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);\n                          margin-top:2px;", 4, "ngIf"], ["aria-label", "Close Gate panel", "style", "background:none;border:none;cursor:pointer;\n                           color:var(--triarq-color-text-secondary);font-size:18px;\n                           line-height:1;padding:2px 4px;flex-shrink:0;", 3, "click", 4, "ngIf"], ["style", "font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);", 4, "ngIf"], [2, "display", "flex", "align-items", "center", "justify-content", "space-between", "margin-bottom", "var(--triarq-space-xs)"], [2, "margin", "0 0 var(--triarq-space-sm) 0", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], ["style", "background:#e3f2fd;border-left:4px solid var(--triarq-color-primary);\n                    border-radius:0 6px 6px 0;padding:var(--triarq-space-xs) var(--triarq-space-sm);\n                    font-size:var(--triarq-text-small);margin-bottom:var(--triarq-space-sm);", 4, "ngIf"], ["style", "margin-bottom:var(--triarq-space-xs);", 4, "ngFor", "ngForOf"], ["style", "font-size:14px;font-style:italic;font-family:Roboto,sans-serif;\n                    color:#9E9E9E;padding:16px;", 4, "ngIf"], ["class", "oi-btn-primary", "style", "font-size:var(--triarq-text-small);\n                         display:flex;align-items:center;gap:6px;", 3, "disabled", "click", 4, "ngIf"], ["style", "font-size:var(--triarq-text-small);", 4, "ngIf"], ["style", "display:grid;grid-template-columns:140px 1fr;\n                    gap:var(--triarq-space-sm);padding:var(--triarq-space-xs) 0;\n                    border-bottom:1px solid var(--triarq-color-border);\n                    font-size:var(--triarq-text-small);", 4, "ngFor", "ngForOf"], [2, "margin-top", "var(--triarq-space-lg)"], ["routerLink", "/delivery", 2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)"], [3, "saved", "cancelled", "cycle", "allUsers"], [2, "display", "flex", "justify-content", "flex-end", "margin-bottom", "var(--triarq-space-sm)"], ["title", "Close panel", 2, "background", "none", "border", "none", "cursor", "pointer", "color", "var(--triarq-color-text-secondary)", "font-size", "20px", "line-height", "1", "padding", "4px 8px", 3, "click"], [2, "color", "#9E9E9E", "font-style", "italic"], [2, "color", "var(--triarq-color-text-secondary)", "font-style", "italic"], [2, "white-space", "nowrap", "font-size", "11px", "color", "var(--triarq-color-primary)", "background", "none", "border", "1px solid var(--triarq-color-primary)", "border-radius", "5px", "padding", "3px 8px", "cursor", "pointer", 3, "click"], ["disabled", "", 2, "white-space", "nowrap", "font-size", "11px", "color", "var(--triarq-color-primary)", "background", "none", "border", "1px solid var(--triarq-color-primary)", "border-radius", "5px", "padding", "3px 8px", "display", "flex", "align-items", "center", "gap", "4px"], ["name", "crescent", 2, "width", "10px", "height", "10px"], [2, "white-space", "nowrap", "font-size", "11px", "color", "var(--triarq-color-text-secondary)", "background", "none", "border", "1px solid var(--triarq-color-border)", "border-radius", "5px", "padding", "3px 8px", "cursor", "pointer", "display", "flex", "align-items", "center", "gap", "4px", 3, "click", "disabled"], ["name", "crescent", "style", "width:10px;height:10px;", 4, "ngIf"], [2, "white-space", "nowrap", "font-size", "11px", "color", "var(--triarq-color-error)", "background", "none", "border", "1px solid var(--triarq-color-error)", "border-radius", "5px", "padding", "3px 8px", "cursor", "pointer", 3, "click"], [2, "margin-top", "var(--triarq-space-xs)", "padding", "var(--triarq-space-xs)", "border", "1px solid var(--triarq-color-sunray,#f5a623)", "border-radius", "5px", "background", "#fff8e1"], [2, "font-size", "var(--triarq-text-small)", "font-weight", "500", "margin-bottom", "4px"], ["style", "font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);margin-bottom:4px;", 4, "ngIf"], ["style", "font-size:var(--triarq-text-small);color:var(--triarq-color-error);margin-bottom:6px;", 4, "ngIf"], [2, "display", "flex", "gap", "6px"], [1, "oi-btn-primary", 2, "font-size", "11px", "padding", "3px 10px", "background", "var(--triarq-color-sunray,#f5a623)", "display", "flex", "align-items", "center", "gap", "4px", 3, "click", "disabled"], [2, "font-size", "11px", "background", "none", "border", "none", "cursor", "pointer", "color", "var(--triarq-color-text-secondary)", 3, "click"], ["style", "color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:4px;", 4, "ngIf"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "margin-bottom", "4px"], [2, "color", "var(--triarq-color-text-primary)"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-error)", "margin-bottom", "6px"], [2, "color", "var(--triarq-color-error)", "font-size", "var(--triarq-text-small)", "margin-top", "4px"], [2, "margin-top", "var(--triarq-space-xs)", "padding", "var(--triarq-space-xs)", "border", "1px solid var(--triarq-color-error)", "border-radius", "5px", "background", "#FFF5F5"], [2, "font-size", "var(--triarq-text-small)", "font-weight", "500", "margin-bottom", "4px", "color", "var(--triarq-color-error)"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "margin-bottom", "6px"], [1, "oi-btn-primary", 2, "font-size", "11px", "padding", "3px 10px", "background", "var(--triarq-color-error)", "display", "flex", "align-items", "center", "gap", "4px", 3, "click", "disabled"], [2, "margin-top", "var(--triarq-space-xs)", "padding", "var(--triarq-space-xs)", "border", "1px solid var(--triarq-color-primary)", "border-radius", "5px", "background", "#F0F7FF"], [1, "oi-btn-primary", 2, "font-size", "11px", "padding", "3px 10px", "display", "flex", "align-items", "center", "gap", "4px", 3, "click", "disabled"], [2, "color", "var(--triarq-color-sunray,#F2A620)", "font-size", "14px", "font-style", "italic", "font-family", "Roboto,sans-serif"], [2, "font-size", "14px", "font-style", "italic", "font-family", "Roboto,sans-serif", "color", "#262626", "white-space", "pre-wrap"], [2, "margin-bottom", "var(--triarq-space-md)", "background", "#fff8e1", "border-left", "4px solid var(--triarq-color-sunray,#f5a623)", "border-radius", "0 6px 6px 0", "padding", "var(--triarq-space-sm) var(--triarq-space-md)"], [2, "font-weight", "500", "font-size", "var(--triarq-text-small)", "margin-bottom", "4px"], [2, "display", "grid", "grid-template-columns", "2fr 1fr 1fr 100px", "gap", "var(--triarq-space-sm)", "padding", "12px 0", "border-bottom", "1px solid var(--triarq-color-border)", "font-size", "var(--triarq-text-small)", "align-items", "start"], [2, "font-weight", "500", "font-size", "14px"], ["style", "font-size:11px;margin-top:3px;", 3, "color", 4, "ngIf"], [2, "color", "var(--triarq-color-text-secondary)", "font-size", "10px", "margin-bottom", "2px"], [3, "color", 4, "ngIf"], ["style", "color:#9E9E9E;", 4, "ngIf"], ["style", "color:var(--triarq-color-sunray,#f5a623);", "title", "Gate approved but actual date not recorded", 4, "ngIf"], [2, "display", "flex", "align-items", "center", "gap", "6px"], [2, "display", "inline-block", "width", "10px", "height", "10px", "border-radius", "50%", "flex-shrink", "0"], [2, "font-size", "12px", "font-weight", "500"], [2, "font-size", "11px", "margin-top", "3px"], [2, "color", "#9E9E9E"], ["title", "Gate approved but actual date not recorded", 2, "color", "var(--triarq-color-sunray,#f5a623)"], [2, "font-weight", "400", "color", "var(--triarq-color-text-secondary)"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "margin-top", "2px"], ["aria-label", "Close Gate panel", 2, "background", "none", "border", "none", "cursor", "pointer", "color", "var(--triarq-color-text-secondary)", "font-size", "18px", "line-height", "1", "padding", "2px 4px", "flex-shrink", "0", 3, "click"], [2, "margin", "0 0 8px 0"], [2, "margin", "0"], [2, "margin-bottom", "var(--triarq-space-sm)"], [2, "font-size", "10px", "font-weight", "600", "letter-spacing", "0.06em", "text-transform", "uppercase", "color", "var(--triarq-color-text-secondary)", "margin-bottom", "4px"], [2, "display", "flex", "align-items", "center", "gap", "var(--triarq-space-sm)", "flex-wrap", "wrap"], [1, "oi-pill", 2, "font-size", "11px"], ["style", "font-size:var(--triarq-text-small);color:var(--triarq-color-error);", 4, "ngIf"], ["style", "margin-bottom:var(--triarq-space-sm);", 4, "ngIf"], [2, "font-size", "10px", "font-weight", "600", "letter-spacing", "0.06em", "text-transform", "uppercase", "color", "var(--triarq-color-text-secondary)", "margin-bottom", "6px"], [2, "display", "flex", "align-items", "center", "gap", "8px", "margin-bottom", "4px", "font-size", "var(--triarq-text-small)"], [2, "width", "18px", "height", "18px", "border-radius", "50%", "background", "var(--triarq-color-primary)", "color", "#fff", "font-size", "9px", "font-weight", "700", "display", "inline-flex", "align-items", "center", "justify-content", "center", "flex-shrink", "0"], [2, "color", "var(--triarq-color-text-secondary)", "min-width", "72px"], ["style", "padding:2px 10px;border-radius:999px;\n                             background:rgba(37,112,153,0.09);font-size:11px;", 4, "ngIf"], ["style", "color:var(--triarq-color-text-secondary);font-style:italic;font-size:11px;", 4, "ngIf"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "font-style", "italic"], ["style", "display:flex;align-items:center;gap:6px;margin-bottom:3px;\n                          font-size:var(--triarq-text-small);", 4, "ngFor", "ngForOf"], [2, "border-top", "1px solid var(--triarq-color-border)", "margin", "var(--triarq-space-sm) 0"], ["style", "margin-top:var(--triarq-space-xs);font-size:var(--triarq-text-small);", 4, "ngIf"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-error)"], [2, "display", "flex", "gap", "var(--triarq-space-lg)", "font-size", "var(--triarq-text-small)", "flex-wrap", "wrap", "align-items", "center"], [1, "oi-pill", 2, "font-size", "10px"], [2, "padding", "2px 10px", "border-radius", "999px", "background", "rgba(37,112,153,0.09)", "font-size", "11px"], [2, "color", "var(--triarq-color-text-secondary)", "font-style", "italic", "font-size", "11px"], [2, "display", "flex", "align-items", "center", "gap", "6px", "margin-bottom", "3px", "font-size", "var(--triarq-text-small)"], [2, "flex-shrink", "0"], [2, "background", "var(--triarq-color-background-subtle)", "border-radius", "6px", "padding", "var(--triarq-space-xs)", "font-size", "var(--triarq-text-small)"], [2, "margin", "0 0 8px 0", "color", "var(--triarq-color-text-secondary)"], ["class", "oi-btn-primary", "style", "font-size:var(--triarq-text-small);display:flex;align-items:center;gap:6px;", 3, "disabled", "click", 4, "ngIf"], ["style", "color:var(--triarq-color-text-secondary);", 4, "ngIf"], [1, "oi-btn-primary", 2, "font-size", "var(--triarq-text-small)", "display", "flex", "align-items", "center", "gap", "6px", 3, "click", "disabled"], ["name", "crescent", "style", "width:14px;height:14px;", 4, "ngIf"], ["name", "crescent", 2, "width", "14px", "height", "14px"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "margin-bottom", "var(--triarq-space-xs)"], [3, "ngSubmit", "formGroup"], ["formControlName", "approver_notes", "rows", "2", "placeholder", "Approver notes (required if returning)", 1, "oi-input", 2, "width", "100%", "resize", "none", "font-size", "var(--triarq-text-small)"], [2, "display", "flex", "gap", "var(--triarq-space-sm)", "margin-top", "var(--triarq-space-xs)", "align-items", "center", "flex-wrap", "wrap"], ["type", "button", 2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-error)", "background", "none", "border", "1px solid var(--triarq-color-error)", "border-radius", "5px", "padding", "6px 12px", "cursor", "pointer", "display", "flex", "align-items", "center", "gap", "6px", 3, "click", "disabled"], ["name", "crescent", "style", "width:14px;height:14px;color:var(--triarq-color-error);", 4, "ngIf"], ["type", "button", 1, "oi-btn-primary", 2, "font-size", "var(--triarq-text-small)", 3, "click", "disabled"], ["type", "button", 1, "oi-btn-primary", 2, "font-size", "var(--triarq-text-small)", "display", "flex", "align-items", "center", "gap", "6px", 3, "click", "disabled"], ["type", "button", 2, "font-size", "var(--triarq-text-small)", "background", "none", "border", "none", "cursor", "pointer", "color", "var(--triarq-color-text-secondary)", 3, "click"], ["name", "crescent", 2, "width", "14px", "height", "14px", "color", "var(--triarq-color-error)"], [2, "margin-top", "var(--triarq-space-xs)", "font-size", "var(--triarq-text-small)"], [2, "color", "var(--triarq-color-error)", "font-weight", "500"], ["style", "color:var(--triarq-color-text-secondary);margin-top:4px;", 4, "ngIf"], [2, "color", "var(--triarq-color-text-secondary)", "margin-top", "4px"], [2, "background", "#e3f2fd", "border-left", "4px solid var(--triarq-color-primary)", "border-radius", "0 6px 6px 0", "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "font-size", "var(--triarq-text-small)", "margin-bottom", "var(--triarq-space-sm)"], [2, "margin-bottom", "var(--triarq-space-xs)"], [2, "width", "100%", "background", "none", "border", "none", "cursor", "pointer", "display", "flex", "align-items", "center", "justify-content", "space-between", "padding", "var(--triarq-space-xs) var(--triarq-space-xs)", "border-radius", "5px", "margin-bottom", "2px", "background", "var(--triarq-color-background-subtle)", 3, "click"], [2, "display", "flex", "align-items", "center", "gap", "var(--triarq-space-xs)"], [2, "font-size", "11px", "color", "var(--triarq-color-text-secondary)", "transition", "transform 0.15s"], [2, "font-weight", "500", "font-size", "var(--triarq-text-small)"], ["style", "font-size:10px;color:var(--triarq-color-text-secondary);font-style:italic;", 4, "ngIf"], [2, "font-size", "10px", "color", "var(--triarq-color-text-secondary)"], [2, "font-size", "10px", "color", "var(--triarq-color-text-secondary)", "font-style", "italic"], ["style", "padding:var(--triarq-space-xs) var(--triarq-space-xs);\n                        border-bottom:1px solid var(--triarq-color-border);\n                        font-size:var(--triarq-text-small);", 4, "ngFor", "ngForOf"], ["style", "padding:var(--triarq-space-xs) var(--triarq-space-xs);", 4, "ngIf"], [2, "padding", "var(--triarq-space-xs) var(--triarq-space-xs)", "border-bottom", "1px solid var(--triarq-color-border)", "font-size", "var(--triarq-text-small)"], [2, "display", "flex", "align-items", "flex-start", "justify-content", "space-between", "gap", "var(--triarq-space-sm)", "flex-wrap", "wrap"], [2, "flex", "1", "min-width", "0"], [2, "font-weight", "500", "color", "var(--triarq-color-text-primary)"], ["style", "font-size:10px;color:var(--triarq-color-text-secondary);\n                              margin-top:1px;font-style:italic;", 4, "ngIf"], ["style", "margin-top:4px;", 4, "ngIf"], ["style", "margin-top:4px;font-size:10px;color:var(--triarq-color-text-secondary);\n                              font-style:italic;", 4, "ngIf"], ["style", "display:flex;flex-direction:column;align-items:flex-end;\n                            gap:4px;flex-shrink:0;", 4, "ngIf"], ["style", "margin-top:var(--triarq-space-xs);\n                          background:var(--triarq-color-background-subtle);\n                          border-radius:5px;padding:var(--triarq-space-xs);\n                          position:relative;", 4, "ngIf"], [2, "font-size", "10px", "color", "var(--triarq-color-text-secondary)", "margin-top", "1px", "font-style", "italic"], [2, "margin-top", "4px"], ["target", "_blank", "rel", "noopener noreferrer", 2, "color", "var(--triarq-color-primary)", "word-break", "break-all", 3, "href"], [2, "margin-top", "4px", "display", "flex", "align-items", "center", "gap", "4px", "flex-wrap", "wrap"], ["class", "oi-pill", "style", "font-size:10px;cursor:default;\n                                   background:var(--triarq-color-fog, #f0f4f8);\n                                   color:var(--triarq-color-text-primary);", 4, "ngIf"], ["style", "font-size:10px;color:var(--triarq-color-text-secondary);", 4, "ngIf"], [1, "oi-pill", 2, "font-size", "10px", "cursor", "default", "background", "var(--triarq-color-fog, #f0f4f8)", "color", "var(--triarq-color-text-primary)"], [2, "display", "flex", "align-items", "center", "gap", "6px", "margin-bottom", "4px"], [2, "font-size", "11px", "color", "var(--triarq-color-text-secondary)"], ["title", "View in OI Library (full integration in Build B)", 1, "oi-pill", 2, "font-size", "10px", "background", "#e3f2fd", "color", "var(--triarq-color-primary)", "cursor", "pointer"], ["style", "font-size:10px;color:var(--triarq-color-text-secondary);\n                                word-break:break-all;", 4, "ngIf"], [2, "font-size", "10px", "color", "var(--triarq-color-text-secondary)", "word-break", "break-all"], [2, "margin-top", "4px", "font-size", "10px", "color", "var(--triarq-color-text-secondary)", "font-style", "italic"], [2, "display", "flex", "flex-direction", "column", "align-items", "flex-end", "gap", "4px", "flex-shrink", "0"], ["style", "font-size:var(--triarq-text-small);color:var(--triarq-color-primary);\n                                 background:none;border:none;cursor:pointer;padding:0;", 3, "click", 4, "ngIf"], ["style", "font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);\n                                 background:none;border:none;cursor:pointer;padding:0;", 3, "click", 4, "ngIf"], ["style", "font-size:10px;color:var(--triarq-color-text-secondary);\n                                 background:none;border:none;cursor:pointer;padding:0;", "title", "Record in OI Library (submission completes in Build B)", 3, "click", 4, "ngIf"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)", "background", "none", "border", "none", "cursor", "pointer", "padding", "0", 3, "click"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "background", "none", "border", "none", "cursor", "pointer", "padding", "0", 3, "click"], ["title", "Record in OI Library (submission completes in Build B)", 2, "font-size", "10px", "color", "var(--triarq-color-text-secondary)", "background", "none", "border", "none", "cursor", "pointer", "padding", "0", 3, "click"], [2, "margin-top", "var(--triarq-space-xs)", "background", "var(--triarq-color-background-subtle)", "border-radius", "5px", "padding", "var(--triarq-space-xs)", "position", "relative"], ["message", "Attaching artifact\u2026", 3, "visible"], [2, "display", "grid", "gap", "var(--triarq-space-xs)", "grid-template-columns", "2fr 3fr auto", "align-items", "end"], [2, "display", "block", "font-size", "10px", "margin-bottom", "2px"], [2, "color", "var(--triarq-color-error)"], ["formControlName", "display_name", "placeholder", "e.g. Context Brief v2", 1, "oi-input", 2, "font-size", "var(--triarq-text-small)"], ["formControlName", "external_url", "type", "url", "placeholder", "https://\u2026", 1, "oi-input", 2, "font-size", "var(--triarq-text-small)"], [2, "display", "flex", "gap", "4px"], ["type", "submit", 1, "oi-btn-primary", 2, "font-size", "var(--triarq-text-small)", "white-space", "nowrap", "display", "flex", "align-items", "center", "gap", "6px", 3, "disabled"], ["type", "button", 2, "background", "none", "border", "none", "cursor", "pointer", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", 3, "click"], ["style", "color:var(--triarq-color-error);font-size:10px;margin-top:4px;", 4, "ngIf"], [2, "color", "var(--triarq-color-error)", "font-size", "10px", "margin-top", "4px"], [2, "padding", "var(--triarq-space-xs) var(--triarq-space-xs)"], ["style", "background:var(--triarq-color-background-subtle);\n                          border-radius:5px;padding:var(--triarq-space-xs);\n                          position:relative;", 4, "ngIf"], ["style", "font-size:10px;color:var(--triarq-color-primary);\n                             background:none;border:none;cursor:pointer;padding:0;", 3, "click", 4, "ngIf"], [2, "background", "var(--triarq-color-background-subtle)", "border-radius", "5px", "padding", "var(--triarq-space-xs)", "position", "relative"], [2, "font-size", "10px", "color", "var(--triarq-color-primary)", "background", "none", "border", "none", "cursor", "pointer", "padding", "0", 3, "click"], [2, "font-size", "14px", "font-style", "italic", "font-family", "Roboto,sans-serif", "color", "#9E9E9E", "padding", "16px"], ["style", "display:flex;align-items:center;gap:var(--triarq-space-sm);flex-wrap:wrap;", 4, "ngIf"], ["placeholder", "e.g. OIT-123", 1, "oi-input", 2, "font-size", "var(--triarq-text-small)", "max-width", "160px", 3, "formControl"], [2, "font-size", "var(--triarq-text-small)", "background", "none", "border", "none", "cursor", "pointer", "color", "var(--triarq-color-text-secondary)", 3, "click"], ["style", "color:var(--triarq-color-error);font-size:var(--triarq-text-small);", 4, "ngIf"], [2, "color", "var(--triarq-color-error)", "font-size", "var(--triarq-text-small)"], [2, "background", "#fff8e1", "border-left", "4px solid var(--triarq-color-sunray,#f5a623)", "border-radius", "0 6px 6px 0", "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "margin-top", "var(--triarq-space-xs)"], [2, "font-weight", "500", "margin-bottom", "2px"], ["style", "display:grid;grid-template-columns:140px 1fr;gap:var(--triarq-space-sm);\n                      padding:var(--triarq-space-xs) 0;border-bottom:1px solid var(--triarq-color-border);", 4, "ngFor", "ngForOf"], [2, "display", "grid", "grid-template-columns", "140px 1fr", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-xs) 0", "border-bottom", "1px solid var(--triarq-color-border)"], ["animated", "", 2, "height", "13px", "border-radius", "4px"], [2, "display", "grid", "grid-template-columns", "140px 1fr", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-xs) 0", "border-bottom", "1px solid var(--triarq-color-border)", "font-size", "var(--triarq-text-small)"], [2, "color", "var(--triarq-color-text-secondary)", "white-space", "nowrap"], [1, "oi-pill", 2, "font-size", "9px", "background", "var(--triarq-color-background-subtle)", "margin-right", "6px"]], template: function DeliveryCycleDetailComponent_Template(rf, ctx) {
      if (rf & 1) {
        i04.\u0275\u0275template(0, DeliveryCycleDetailComponent_div_0_Template, 12, 0, "div", 0)(1, DeliveryCycleDetailComponent_div_1_Template, 8, 1, "div", 1)(2, DeliveryCycleDetailComponent_div_2_Template, 98, 50, "div", 2);
      }
      if (rf & 2) {
        i04.\u0275\u0275property("ngIf", ctx.loading);
        i04.\u0275\u0275advance();
        i04.\u0275\u0275property("ngIf", !ctx.loading && ctx.loadError);
        i04.\u0275\u0275advance();
        i04.\u0275\u0275property("ngIf", !ctx.loading && ctx.cycle);
      }
    }, dependencies: [CommonModule4, i52.NgForOf, i52.NgIf, i52.NgStyle, i52.DatePipe, RouterModule, i13.RouterLink, ReactiveFormsModule3, i4.\u0275NgNoValidate, i4.DefaultValueAccessor, i4.NgControlStatus, i4.NgControlStatusGroup, i4.FormControlDirective, i4.FormGroupDirective, i4.FormControlName, FormsModule, IonicModule, IonSkeletonText, IonSpinner, RouterLinkWithHrefDelegateDirective, StageTrackComponent, LoadingOverlayComponent, DeliveryCycleEditPanelComponent], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i04.\u0275setClassDebugInfo(DeliveryCycleDetailComponent, { className: "DeliveryCycleDetailComponent", filePath: "src\\app\\features\\delivery\\detail\\delivery-cycle-detail.component.ts", lineNumber: 1215 });
})();

export {
  StageTrackComponent,
  WorkstreamPickerComponent,
  DeliveryCycleDetailComponent
};
//# sourceMappingURL=chunk-FCHEB46F.js.map
