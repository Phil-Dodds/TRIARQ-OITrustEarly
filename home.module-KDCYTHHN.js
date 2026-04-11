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
import "./chunk-LQKHA6MY.js";
import "./chunk-AHL2ZQC7.js";
import "./chunk-A2SZYZK4.js";
import "./chunk-WOWOWLRW.js";
import "./chunk-ZNWM5CSD.js";
import "./chunk-FBLRPVXF.js";
import "./chunk-D6LV3SEQ.js";
import "./chunk-ENFSYKZQ.js";
import "./chunk-F6PICJNB.js";
import "./chunk-4TKDMDPC.js";
import "./chunk-6SMHFLGE.js";
import "./chunk-BPPHWHFG.js";
import "./chunk-SJ5XQY7K.js";
import "./chunk-DHRBUV2X.js";
import "./chunk-KA4VJ47T.js";
import "./chunk-CIYO67CO.js";
import "./chunk-SII3QBXZ.js";
import "./chunk-FKQOC7QR.js";
import {
  __async
} from "./chunk-DSWO3WHD.js";

// src/app/features/home/home.module.ts
import { NgModule } from "@angular/core";
import { CommonModule as CommonModule2 } from "@angular/common";
import { RouterModule as RouterModule2 } from "@angular/router";

// src/app/features/home/home.component.ts
import { Component as Component10, ChangeDetectionStrategy as ChangeDetectionStrategy10 } from "@angular/core";
import { firstValueFrom as firstValueFrom5 } from "rxjs";
import * as i010 from "@angular/core";
import * as i33 from "@angular/common";

// src/app/features/home/components/my-delivery-cycles-card.component.ts
import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import * as i0 from "@angular/core";
import * as i2 from "@angular/common";
import * as i3 from "@angular/router";
var _c0 = () => [1, 2, 3];
var _c1 = (a0) => ["/delivery", a0];
function MyDeliveryCyclesCardComponent_div_4_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 9);
    i0.\u0275\u0275element(1, "ion-skeleton-text", 10)(2, "ion-skeleton-text", 11);
    i0.\u0275\u0275elementEnd();
  }
}
function MyDeliveryCyclesCardComponent_div_4_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div");
    i0.\u0275\u0275template(1, MyDeliveryCyclesCardComponent_div_4_div_1_Template, 3, 0, "div", 8);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", i0.\u0275\u0275pureFunction0(1, _c0));
  }
}
function MyDeliveryCyclesCardComponent_div_5_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 12);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate3(" \u26A0 ", ctx_r0.attentionCount, " cycle", ctx_r0.attentionCount === 1 ? "" : "s", " need", ctx_r0.attentionCount === 1 ? "s" : "", " attention ");
  }
}
function MyDeliveryCyclesCardComponent_div_6_div_1_span_8_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 21);
    i0.\u0275\u0275text(1, "\u26A0");
    i0.\u0275\u0275elementEnd();
  }
}
function MyDeliveryCyclesCardComponent_div_6_div_1_span_10_span_3_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cycle_r2 = i0.\u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275styleProp("color", ctx_r0.nextGateDateColor(cycle_r2));
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" \xB7 ", ctx_r0.nextGateTargetDate(cycle_r2), " ");
  }
}
function MyDeliveryCyclesCardComponent_div_6_div_1_span_10_span_4_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 25);
    i0.\u0275\u0275text(1, "\u2014 no target date set");
    i0.\u0275\u0275elementEnd();
  }
}
function MyDeliveryCyclesCardComponent_div_6_div_1_span_10_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 22)(1, "span", 23);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(3, MyDeliveryCyclesCardComponent_div_6_div_1_span_10_span_3_Template, 2, 3, "span", 24)(4, MyDeliveryCyclesCardComponent_div_6_div_1_span_10_span_4_Template, 2, 0, "span", 20);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cycle_r2 = i0.\u0275\u0275nextContext().$implicit;
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r0.nextGateLabel(cycle_r2), " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.nextGateTargetDate(cycle_r2));
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", !ctx_r0.nextGateTargetDate(cycle_r2));
  }
}
function MyDeliveryCyclesCardComponent_div_6_div_1_span_11_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 25);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_4_0;
    const cycle_r2 = i0.\u0275\u0275nextContext().$implicit;
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", (tmp_4_0 = ctx_r0.STAGE_LABEL[cycle_r2.current_lifecycle_stage]) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : cycle_r2.current_lifecycle_stage, " ");
  }
}
function MyDeliveryCyclesCardComponent_div_6_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 9)(1, "div", 13)(2, "a", 14);
    i0.\u0275\u0275text(3);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(4, "span", 15);
    i0.\u0275\u0275text(5);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(6, "span", 16);
    i0.\u0275\u0275text(7);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(8, MyDeliveryCyclesCardComponent_div_6_div_1_span_8_Template, 2, 0, "span", 17);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(9, "div", 18);
    i0.\u0275\u0275template(10, MyDeliveryCyclesCardComponent_div_6_div_1_span_10_Template, 5, 3, "span", 19)(11, MyDeliveryCyclesCardComponent_div_6_div_1_span_11_Template, 2, 1, "span", 20);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_6_0;
    const cycle_r2 = ctx.$implicit;
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("routerLink", i0.\u0275\u0275pureFunction1(10, _c1, cycle_r2.delivery_cycle_id))("title", cycle_r2.cycle_title);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", cycle_r2.cycle_title, " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", (tmp_6_0 = ctx_r0.STAGE_LABEL[cycle_r2.current_lifecycle_stage]) !== null && tmp_6_0 !== void 0 ? tmp_6_0 : cycle_r2.current_lifecycle_stage, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("background", ctx_r0.tierPillBg(cycle_r2.tier_classification));
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" T", ctx_r0.tierShort(cycle_r2.tier_classification), " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.needsAttention(cycle_r2));
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngIf", ctx_r0.nextGateLabel(cycle_r2));
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", !ctx_r0.nextGateLabel(cycle_r2));
  }
}
function MyDeliveryCyclesCardComponent_div_6_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div");
    i0.\u0275\u0275template(1, MyDeliveryCyclesCardComponent_div_6_div_1_Template, 12, 12, "div", 8);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r0.activeCycles);
  }
}
function MyDeliveryCyclesCardComponent_div_7_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 26);
    i0.\u0275\u0275text(1, " No active cycles assigned to you. ");
    i0.\u0275\u0275elementStart(2, "a", 27);
    i0.\u0275\u0275text(3, " + Start a Delivery Cycle ");
    i0.\u0275\u0275elementEnd()();
  }
}
var STAGE_LABEL = {
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
var GATE_LABEL = {
  brief_review: "Brief Review",
  go_to_build: "Go to Build",
  go_to_deploy: "Go to Deploy",
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
var TERMINAL = ["COMPLETE", "CANCELLED"];
var MyDeliveryCyclesCardComponent = class _MyDeliveryCyclesCardComponent {
  constructor(delivery, cdr) {
    this.delivery = delivery;
    this.cdr = cdr;
    this.userId = "";
    this.loading = true;
    this.activeCycles = [];
    this.totalActive = 0;
    this.STAGE_LABEL = STAGE_LABEL;
    this.MAX_SHOWN = 3;
    this.TODAY = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  }
  ngOnInit() {
    this.delivery.listCycles({ assigned_to_current_user: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const all = Array.isArray(res.data) ? res.data : [];
          const active = all.filter((c) => !TERMINAL.includes(c.current_lifecycle_stage));
          this.totalActive = active.length;
          this.activeCycles = active.slice(0, this.MAX_SHOWN);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  get attentionCount() {
    return this.activeCycles.filter((c) => this.needsAttention(c)).length;
  }
  needsAttention(cycle) {
    if (cycle.gate_records?.some((g) => g.gate_status === "blocked")) {
      return true;
    }
    if (cycle.milestone_dates?.some((m) => m.target_date && !m.actual_date && m.target_date < this.TODAY)) {
      return true;
    }
    return false;
  }
  /** S6: next gate name label for this cycle, null when terminal */
  nextGateLabel(cycle) {
    const gate = NEXT_GATE_BY_STAGE[cycle.current_lifecycle_stage];
    return gate ? GATE_LABEL[gate] : null;
  }
  /** S6: target date for the next gate's milestone row */
  nextGateTargetDate(cycle) {
    const gate = NEXT_GATE_BY_STAGE[cycle.current_lifecycle_stage];
    if (!gate) {
      return null;
    }
    return cycle.milestone_dates?.find((m) => m.gate_name === gate)?.target_date ?? null;
  }
  /** S6: color the target date based on proximity to today */
  nextGateDateColor(cycle) {
    const date = this.nextGateTargetDate(cycle);
    if (!date) {
      return "var(--triarq-color-text-secondary)";
    }
    if (date < this.TODAY) {
      return "var(--triarq-color-error)";
    }
    const daysAway = (new Date(date).getTime() - new Date(this.TODAY).getTime()) / 864e5;
    if (daysAway <= 7) {
      return "var(--triarq-color-sunray,#f5a623)";
    }
    return "var(--triarq-color-text-secondary)";
  }
  /** S6: tier badge pill color */
  tierPillBg(tier) {
    return tier === "tier_1" ? "#e8f5e9" : tier === "tier_2" ? "#fff8e1" : "#fce4ec";
  }
  /** S6: tier short label "1" | "2" | "3" */
  tierShort(tier) {
    return tier.replace("tier_", "");
  }
  static {
    this.\u0275fac = function MyDeliveryCyclesCardComponent_Factory(t) {
      return new (t || _MyDeliveryCyclesCardComponent)(i0.\u0275\u0275directiveInject(DeliveryService), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _MyDeliveryCyclesCardComponent, selectors: [["app-my-delivery-cycles-card"]], inputs: { userId: "userId" }, standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 11, vars: 6, consts: [[1, "oi-card", "oi-home-card"], [2, "display", "flex", "align-items", "center", "justify-content", "space-between", "margin-bottom", "var(--triarq-space-md)"], [2, "margin", "0", "font-size", "var(--triarq-text-h4)"], [4, "ngIf"], ["style", "background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);\n                  border-radius:0 6px 6px 0;padding:var(--triarq-space-xs) var(--triarq-space-sm);\n                  font-size:var(--triarq-text-small);font-weight:500;\n                  margin-bottom:var(--triarq-space-sm);", 4, "ngIf"], ["style", "font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);", 4, "ngIf"], [2, "margin-top", "var(--triarq-space-sm)", "padding-top", "var(--triarq-space-xs)", "border-top", "1px solid var(--triarq-color-border)"], ["routerLink", "/delivery", 2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)", "text-decoration", "none"], ["style", "padding:var(--triarq-space-xs) 0;\n                    border-bottom:1px solid var(--triarq-color-border);", 4, "ngFor", "ngForOf"], [2, "padding", "var(--triarq-space-xs) 0", "border-bottom", "1px solid var(--triarq-color-border)"], ["animated", "", 2, "width", "60%", "height", "14px", "border-radius", "4px", "margin-bottom", "4px"], ["animated", "", 2, "width", "40%", "height", "11px", "border-radius", "4px"], [2, "background", "#fff8e1", "border-left", "4px solid var(--triarq-color-sunray,#f5a623)", "border-radius", "0 6px 6px 0", "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "font-size", "var(--triarq-text-small)", "font-weight", "500", "margin-bottom", "var(--triarq-space-sm)"], [2, "display", "flex", "align-items", "center", "gap", "var(--triarq-space-xs)", "margin-bottom", "2px", "flex-wrap", "wrap"], [2, "color", "var(--triarq-color-text-primary)", "text-decoration", "none", "font-weight", "500", "font-size", "var(--triarq-text-small)", "flex", "1", "min-width", "0", "overflow", "hidden", "text-overflow", "ellipsis", "white-space", "nowrap", 3, "routerLink", "title"], [1, "oi-pill", 2, "font-size", "9px", "flex-shrink", "0", "background", "var(--triarq-color-background-subtle)"], [1, "oi-pill", 2, "font-size", "9px", "flex-shrink", "0"], ["style", "color:var(--triarq-color-sunray,#f5a623);flex-shrink:0;font-size:12px;", "title", "Needs attention", 4, "ngIf"], [2, "font-size", "10px", "color", "var(--triarq-color-text-secondary)", "display", "flex", "align-items", "center", "gap", "var(--triarq-space-xs)"], ["style", "display:flex;align-items:center;gap:4px;", 4, "ngIf"], ["style", "font-style:italic;", 4, "ngIf"], ["title", "Needs attention", 2, "color", "var(--triarq-color-sunray,#f5a623)", "flex-shrink", "0", "font-size", "12px"], [2, "display", "flex", "align-items", "center", "gap", "4px"], [2, "font-weight", "500", "color", "var(--triarq-color-text-primary)"], [3, "color", 4, "ngIf"], [2, "font-style", "italic"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], ["routerLink", "/delivery/cycles", 2, "display", "block", "margin-top", "var(--triarq-space-xs)", "color", "var(--triarq-color-primary)", "text-decoration", "none"]], template: function MyDeliveryCyclesCardComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h4", 2);
        i0.\u0275\u0275text(3, "My Delivery Cycles");
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275template(4, MyDeliveryCyclesCardComponent_div_4_Template, 2, 2, "div", 3)(5, MyDeliveryCyclesCardComponent_div_5_Template, 2, 3, "div", 4)(6, MyDeliveryCyclesCardComponent_div_6_Template, 2, 1, "div", 3)(7, MyDeliveryCyclesCardComponent_div_7_Template, 4, 0, "div", 5);
        i0.\u0275\u0275elementStart(8, "div", 6)(9, "a", 7);
        i0.\u0275\u0275text(10);
        i0.\u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        i0.\u0275\u0275advance(4);
        i0.\u0275\u0275property("ngIf", ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && ctx.attentionCount > 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && ctx.activeCycles.length > 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && ctx.activeCycles.length === 0);
        i0.\u0275\u0275advance(3);
        i0.\u0275\u0275textInterpolate2(" View all ", ctx.totalActive > 0 ? ctx.totalActive + " " : "", "cycle", ctx.totalActive === 1 ? "" : "s", " \u2192 ");
      }
    }, dependencies: [CommonModule, i2.NgForOf, i2.NgIf, RouterModule, i3.RouterLink, IonicModule, IonSkeletonText, RouterLinkWithHrefDelegateDirective], styles: ["\n\nh4[_ngcontent-%COMP%] {\n  margin: 0 0 var(--triarq-space-md) 0;\n}\n/*# sourceMappingURL=my-delivery-cycles-card.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(MyDeliveryCyclesCardComponent, { className: "MyDeliveryCyclesCardComponent", filePath: "src\\app\\features\\home\\components\\my-delivery-cycles-card.component.ts", lineNumber: 162 });
})();

// src/app/features/home/components/my-action-queue-card.component.ts
import { Component as Component2, Input as Input2, ChangeDetectionStrategy as ChangeDetectionStrategy2 } from "@angular/core";
import * as i02 from "@angular/core";
import * as i22 from "@angular/common";
function MyActionQueueCardComponent_span_4_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "span", 6);
    i02.\u0275\u0275text(1);
    i02.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i02.\u0275\u0275nextContext();
    i02.\u0275\u0275advance();
    i02.\u0275\u0275textInterpolate(ctx_r0.items.length);
  }
}
function MyActionQueueCardComponent_p_5_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "p", 7);
    i02.\u0275\u0275text(1, "Loading\u2026");
    i02.\u0275\u0275elementEnd();
  }
}
function MyActionQueueCardComponent_p_6_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "p", 8);
    i02.\u0275\u0275text(1, " No pending actions. You're all caught up. ");
    i02.\u0275\u0275elementEnd();
  }
}
function MyActionQueueCardComponent_ul_7_li_1_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "li", 11)(1, "span", 12);
    i02.\u0275\u0275text(2);
    i02.\u0275\u0275elementEnd();
    i02.\u0275\u0275elementStart(3, "span", 13);
    i02.\u0275\u0275text(4);
    i02.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r2 = ctx.$implicit;
    i02.\u0275\u0275advance(2);
    i02.\u0275\u0275textInterpolate(item_r2.artifact_title);
    i02.\u0275\u0275advance(2);
    i02.\u0275\u0275textInterpolate(item_r2.raci_role);
  }
}
function MyActionQueueCardComponent_ul_7_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "ul", 9);
    i02.\u0275\u0275template(1, MyActionQueueCardComponent_ul_7_li_1_Template, 5, 2, "li", 10);
    i02.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i02.\u0275\u0275nextContext();
    i02.\u0275\u0275advance();
    i02.\u0275\u0275property("ngForOf", ctx_r0.items);
  }
}
var MyActionQueueCardComponent = class _MyActionQueueCardComponent {
  constructor(mcp, cdr) {
    this.mcp = mcp;
    this.cdr = cdr;
    this.userId = "";
    this.items = [];
    this.loading = true;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.loading = false;
      this.cdr.markForCheck();
    });
  }
  static {
    this.\u0275fac = function MyActionQueueCardComponent_Factory(t) {
      return new (t || _MyActionQueueCardComponent)(i02.\u0275\u0275directiveInject(McpService), i02.\u0275\u0275directiveInject(i02.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i02.\u0275\u0275defineComponent({ type: _MyActionQueueCardComponent, selectors: [["app-my-action-queue-card"]], inputs: { userId: "userId" }, decls: 8, vars: 4, consts: [[1, "oi-card", "oi-home-card"], [1, "oi-card-header"], ["class", "oi-badge", 4, "ngIf"], ["class", "oi-card-loading", 4, "ngIf"], ["class", "oi-card-empty", 4, "ngIf"], ["class", "oi-action-list", 4, "ngIf"], [1, "oi-badge"], [1, "oi-card-loading"], [1, "oi-card-empty"], [1, "oi-action-list"], ["class", "oi-action-item", 4, "ngFor", "ngForOf"], [1, "oi-action-item"], [1, "oi-action-title"], [1, "oi-action-role"]], template: function MyActionQueueCardComponent_Template(rf, ctx) {
      if (rf & 1) {
        i02.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h4");
        i02.\u0275\u0275text(3, "My Action Queue");
        i02.\u0275\u0275elementEnd();
        i02.\u0275\u0275template(4, MyActionQueueCardComponent_span_4_Template, 2, 1, "span", 2);
        i02.\u0275\u0275elementEnd();
        i02.\u0275\u0275template(5, MyActionQueueCardComponent_p_5_Template, 2, 0, "p", 3)(6, MyActionQueueCardComponent_p_6_Template, 2, 0, "p", 4)(7, MyActionQueueCardComponent_ul_7_Template, 2, 1, "ul", 5);
        i02.\u0275\u0275elementEnd();
      }
      if (rf & 2) {
        i02.\u0275\u0275advance(4);
        i02.\u0275\u0275property("ngIf", ctx.items.length > 0);
        i02.\u0275\u0275advance();
        i02.\u0275\u0275property("ngIf", ctx.loading);
        i02.\u0275\u0275advance();
        i02.\u0275\u0275property("ngIf", !ctx.loading && ctx.items.length === 0);
        i02.\u0275\u0275advance();
        i02.\u0275\u0275property("ngIf", !ctx.loading && ctx.items.length > 0);
      }
    }, dependencies: [i22.NgForOf, i22.NgIf], styles: ["\n\n.oi-card-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: var(--triarq-space-sm);\n  margin-bottom: var(--triarq-space-md);\n}\nh4[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: var(--triarq-text-h4);\n}\n.oi-badge[_ngcontent-%COMP%] {\n  background: var(--triarq-color-primary);\n  color: #fff;\n  border-radius: var(--triarq-radius-pill);\n  padding: 2px 8px;\n  font-size: var(--triarq-text-caption);\n  font-weight: var(--triarq-font-weight-bold);\n}\n.oi-card-empty[_ngcontent-%COMP%], .oi-card-loading[_ngcontent-%COMP%] {\n  color: var(--triarq-color-text-secondary);\n  font-size: var(--triarq-text-small);\n}\n.oi-action-list[_ngcontent-%COMP%] {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n}\n.oi-action-item[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  padding: var(--triarq-space-sm) 0;\n  border-bottom: 1px solid var(--triarq-color-border);\n  font-size: var(--triarq-text-small);\n}\n.oi-action-role[_ngcontent-%COMP%] {\n  color: var(--triarq-color-primary);\n  font-weight: var(--triarq-font-weight-medium);\n}\n/*# sourceMappingURL=my-action-queue-card.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i02.\u0275setClassDebugInfo(MyActionQueueCardComponent, { className: "MyActionQueueCardComponent", filePath: "src\\app\\features\\home\\components\\my-action-queue-card.component.ts", lineNumber: 50 });
})();

// src/app/features/home/components/my-notifications-card.component.ts
import { Component as Component3, Input as Input3, ChangeDetectionStrategy as ChangeDetectionStrategy3 } from "@angular/core";
import * as i03 from "@angular/core";
import * as i23 from "@angular/common";
function MyNotificationsCardComponent_span_4_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "span", 5);
    i03.\u0275\u0275text(1);
    i03.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i03.\u0275\u0275nextContext();
    i03.\u0275\u0275advance();
    i03.\u0275\u0275textInterpolate(ctx_r0.notifications.length);
  }
}
function MyNotificationsCardComponent_p_5_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "p", 6);
    i03.\u0275\u0275text(1, "Loading\u2026");
    i03.\u0275\u0275elementEnd();
  }
}
function MyNotificationsCardComponent_p_6_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "p", 6);
    i03.\u0275\u0275text(1, " No new notifications. ");
    i03.\u0275\u0275elementEnd();
  }
}
function MyNotificationsCardComponent_ul_7_li_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = i03.\u0275\u0275getCurrentView();
    i03.\u0275\u0275elementStart(0, "li", 9)(1, "span", 10);
    i03.\u0275\u0275text(2);
    i03.\u0275\u0275elementEnd();
    i03.\u0275\u0275elementStart(3, "button", 11);
    i03.\u0275\u0275listener("click", function MyNotificationsCardComponent_ul_7_li_1_Template_button_click_3_listener() {
      const n_r3 = i03.\u0275\u0275restoreView(_r2).$implicit;
      const ctx_r0 = i03.\u0275\u0275nextContext(2);
      return i03.\u0275\u0275resetView(ctx_r0.dismiss(n_r3.id));
    });
    i03.\u0275\u0275text(4, "\u2715");
    i03.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const n_r3 = ctx.$implicit;
    i03.\u0275\u0275advance(2);
    i03.\u0275\u0275textInterpolate(n_r3.notification_body);
  }
}
function MyNotificationsCardComponent_ul_7_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "ul", 7);
    i03.\u0275\u0275template(1, MyNotificationsCardComponent_ul_7_li_1_Template, 5, 1, "li", 8);
    i03.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i03.\u0275\u0275nextContext();
    i03.\u0275\u0275advance();
    i03.\u0275\u0275property("ngForOf", ctx_r0.notifications);
  }
}
var MyNotificationsCardComponent = class _MyNotificationsCardComponent {
  constructor(mcp, cdr) {
    this.mcp = mcp;
    this.cdr = cdr;
    this.userId = "";
    this.notifications = [];
    this.loading = true;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.loading = false;
      this.cdr.markForCheck();
    });
  }
  dismiss(notificationId) {
    return __async(this, null, function* () {
      this.notifications = this.notifications.filter((n) => n.id !== notificationId);
      this.cdr.markForCheck();
    });
  }
  static {
    this.\u0275fac = function MyNotificationsCardComponent_Factory(t) {
      return new (t || _MyNotificationsCardComponent)(i03.\u0275\u0275directiveInject(McpService), i03.\u0275\u0275directiveInject(i03.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i03.\u0275\u0275defineComponent({ type: _MyNotificationsCardComponent, selectors: [["app-my-notifications-card"]], inputs: { userId: "userId" }, decls: 8, vars: 4, consts: [[1, "oi-card", "oi-home-card"], [1, "oi-card-header"], ["class", "oi-badge", 4, "ngIf"], ["class", "oi-card-empty", 4, "ngIf"], ["class", "oi-notif-list", 4, "ngIf"], [1, "oi-badge"], [1, "oi-card-empty"], [1, "oi-notif-list"], ["class", "oi-notif-item", 4, "ngFor", "ngForOf"], [1, "oi-notif-item"], [1, "oi-notif-body"], ["aria-label", "Dismiss", 1, "oi-dismiss-btn", 3, "click"]], template: function MyNotificationsCardComponent_Template(rf, ctx) {
      if (rf & 1) {
        i03.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h4");
        i03.\u0275\u0275text(3, "Notifications");
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275template(4, MyNotificationsCardComponent_span_4_Template, 2, 1, "span", 2);
        i03.\u0275\u0275elementEnd();
        i03.\u0275\u0275template(5, MyNotificationsCardComponent_p_5_Template, 2, 0, "p", 3)(6, MyNotificationsCardComponent_p_6_Template, 2, 0, "p", 3)(7, MyNotificationsCardComponent_ul_7_Template, 2, 1, "ul", 4);
        i03.\u0275\u0275elementEnd();
      }
      if (rf & 2) {
        i03.\u0275\u0275advance(4);
        i03.\u0275\u0275property("ngIf", ctx.notifications.length > 0);
        i03.\u0275\u0275advance();
        i03.\u0275\u0275property("ngIf", ctx.loading);
        i03.\u0275\u0275advance();
        i03.\u0275\u0275property("ngIf", !ctx.loading && ctx.notifications.length === 0);
        i03.\u0275\u0275advance();
        i03.\u0275\u0275property("ngIf", !ctx.loading && ctx.notifications.length > 0);
      }
    }, dependencies: [i23.NgForOf, i23.NgIf], styles: ["\n\n.oi-card-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: var(--triarq-space-sm);\n  margin-bottom: var(--triarq-space-md);\n}\nh4[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: var(--triarq-text-h4);\n}\n.oi-badge[_ngcontent-%COMP%] {\n  background: var(--triarq-color-accent);\n  color: #fff;\n  border-radius: var(--triarq-radius-pill);\n  padding: 2px 8px;\n  font-size: var(--triarq-text-caption);\n  font-weight: var(--triarq-font-weight-bold);\n}\n.oi-card-empty[_ngcontent-%COMP%] {\n  color: var(--triarq-color-text-secondary);\n  font-size: var(--triarq-text-small);\n}\n.oi-notif-list[_ngcontent-%COMP%] {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n}\n.oi-notif-item[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  padding: var(--triarq-space-sm) 0;\n  border-bottom: 1px solid var(--triarq-color-border);\n  gap: var(--triarq-space-sm);\n}\n.oi-notif-body[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-small);\n  flex: 1;\n}\n.oi-dismiss-btn[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  cursor: pointer;\n  color: var(--triarq-color-text-disabled);\n  flex-shrink: 0;\n  padding: 0;\n  font-size: 12px;\n}\n.oi-dismiss-btn[_ngcontent-%COMP%]:hover {\n  color: var(--triarq-color-text-secondary);\n}\n/*# sourceMappingURL=my-notifications-card.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i03.\u0275setClassDebugInfo(MyNotificationsCardComponent, { className: "MyNotificationsCardComponent", filePath: "src\\app\\features\\home\\components\\my-notifications-card.component.ts", lineNumber: 45 });
})();

// src/app/features/home/components/system-health-card.component.ts
import { Component as Component4, ChangeDetectionStrategy as ChangeDetectionStrategy4 } from "@angular/core";
import { firstValueFrom } from "rxjs";
import * as i04 from "@angular/core";
import * as i24 from "@angular/common";
function SystemHealthCardComponent_p_3_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "p", 3);
    i04.\u0275\u0275text(1, "Loading\u2026");
    i04.\u0275\u0275elementEnd();
  }
}
function SystemHealthCardComponent_div_4_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 4)(1, "div", 5)(2, "span", 6);
    i04.\u0275\u0275text(3);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(4, "span", 7);
    i04.\u0275\u0275text(5, "Divisions");
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(6, "div", 5)(7, "span", 6);
    i04.\u0275\u0275text(8);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(9, "span", 7);
    i04.\u0275\u0275text(10, "Users");
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(11, "div", 5)(12, "span", 6);
    i04.\u0275\u0275text(13);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(14, "span", 7);
    i04.\u0275\u0275text(15, "Artifacts");
    i04.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r0 = i04.\u0275\u0275nextContext();
    i04.\u0275\u0275advance(3);
    i04.\u0275\u0275textInterpolate(ctx_r0.stats.divisionCount);
    i04.\u0275\u0275advance(5);
    i04.\u0275\u0275textInterpolate(ctx_r0.stats.userCount);
    i04.\u0275\u0275advance(5);
    i04.\u0275\u0275textInterpolate(ctx_r0.stats.artifactCount);
  }
}
var SystemHealthCardComponent = class _SystemHealthCardComponent {
  constructor(mcp, cdr) {
    this.mcp = mcp;
    this.cdr = cdr;
    this.stats = { divisionCount: 0, userCount: 0, artifactCount: 0 };
    this.loading = true;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      try {
        const [divResponse, userResponse, artifactResponse] = yield Promise.all([
          firstValueFrom(this.mcp.call("division", "list_divisions", {})),
          firstValueFrom(this.mcp.call("division", "list_users", {})),
          firstValueFrom(this.mcp.call("document", "list_documents", { limit: 1 }))
        ]);
        this.stats = {
          divisionCount: divResponse.data?.length ?? 0,
          userCount: userResponse.data?.length ?? 0,
          artifactCount: artifactResponse.data?.total ?? 0
        };
      } catch {
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  static {
    this.\u0275fac = function SystemHealthCardComponent_Factory(t) {
      return new (t || _SystemHealthCardComponent)(i04.\u0275\u0275directiveInject(McpService), i04.\u0275\u0275directiveInject(i04.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i04.\u0275\u0275defineComponent({ type: _SystemHealthCardComponent, selectors: [["app-system-health-card"]], decls: 5, vars: 2, consts: [[1, "oi-card", "oi-home-card"], ["class", "oi-card-empty", 4, "ngIf"], ["class", "oi-health-stats", 4, "ngIf"], [1, "oi-card-empty"], [1, "oi-health-stats"], [1, "oi-stat"], [1, "oi-stat-value"], [1, "oi-stat-label"]], template: function SystemHealthCardComponent_Template(rf, ctx) {
      if (rf & 1) {
        i04.\u0275\u0275elementStart(0, "div", 0)(1, "h4");
        i04.\u0275\u0275text(2, "System Health");
        i04.\u0275\u0275elementEnd();
        i04.\u0275\u0275template(3, SystemHealthCardComponent_p_3_Template, 2, 0, "p", 1)(4, SystemHealthCardComponent_div_4_Template, 16, 3, "div", 2);
        i04.\u0275\u0275elementEnd();
      }
      if (rf & 2) {
        i04.\u0275\u0275advance(3);
        i04.\u0275\u0275property("ngIf", ctx.loading);
        i04.\u0275\u0275advance();
        i04.\u0275\u0275property("ngIf", !ctx.loading);
      }
    }, dependencies: [i24.NgIf], styles: ["\n\nh4[_ngcontent-%COMP%] {\n  margin: 0 0 var(--triarq-space-md) 0;\n  font-size: var(--triarq-text-h4);\n}\n.oi-health-stats[_ngcontent-%COMP%] {\n  display: flex;\n  gap: var(--triarq-space-lg);\n}\n.oi-stat[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n}\n.oi-stat-value[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-h3);\n  font-weight: var(--triarq-font-weight-bold);\n  color: var(--triarq-color-primary);\n}\n.oi-stat-label[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-caption);\n  color: var(--triarq-color-text-secondary);\n}\n.oi-card-empty[_ngcontent-%COMP%] {\n  color: var(--triarq-color-text-secondary);\n  font-size: var(--triarq-text-small);\n}\n/*# sourceMappingURL=system-health-card.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i04.\u0275setClassDebugInfo(SystemHealthCardComponent, { className: "SystemHealthCardComponent", filePath: "src\\app\\features\\home\\components\\system-health-card.component.ts", lineNumber: 46 });
})();

// src/app/features/home/components/oi-library-card.component.ts
import { Component as Component5, Input as Input4, ChangeDetectionStrategy as ChangeDetectionStrategy5 } from "@angular/core";
import { firstValueFrom as firstValueFrom2 } from "rxjs";
import * as i05 from "@angular/core";
import * as i25 from "@angular/router";
import * as i32 from "@angular/common";
function OILibraryCardComponent_p_6_Template(rf, ctx) {
  if (rf & 1) {
    i05.\u0275\u0275elementStart(0, "p", 5);
    i05.\u0275\u0275text(1, "Loading\u2026");
    i05.\u0275\u0275elementEnd();
  }
}
function OILibraryCardComponent_p_7_Template(rf, ctx) {
  if (rf & 1) {
    i05.\u0275\u0275elementStart(0, "p", 5);
    i05.\u0275\u0275text(1, " No canonical documents yet. ");
    i05.\u0275\u0275elementEnd();
  }
}
function OILibraryCardComponent_ul_8_li_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = i05.\u0275\u0275getCurrentView();
    i05.\u0275\u0275elementStart(0, "li", 8);
    i05.\u0275\u0275listener("click", function OILibraryCardComponent_ul_8_li_1_Template_li_click_0_listener() {
      const a_r2 = i05.\u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = i05.\u0275\u0275nextContext(2);
      return i05.\u0275\u0275resetView(ctx_r2.openArtifact(a_r2.id));
    });
    i05.\u0275\u0275elementStart(1, "span", 9);
    i05.\u0275\u0275text(2);
    i05.\u0275\u0275elementEnd();
    i05.\u0275\u0275elementStart(3, "span");
    i05.\u0275\u0275text(4);
    i05.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const a_r2 = ctx.$implicit;
    i05.\u0275\u0275advance(2);
    i05.\u0275\u0275textInterpolate(a_r2.artifact_title);
    i05.\u0275\u0275advance();
    i05.\u0275\u0275classMapInterpolate1("oi-status-pill status-", a_r2.lifecycle_status, "");
    i05.\u0275\u0275advance();
    i05.\u0275\u0275textInterpolate(a_r2.lifecycle_status);
  }
}
function OILibraryCardComponent_ul_8_Template(rf, ctx) {
  if (rf & 1) {
    i05.\u0275\u0275elementStart(0, "ul", 6);
    i05.\u0275\u0275template(1, OILibraryCardComponent_ul_8_li_1_Template, 5, 5, "li", 7);
    i05.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = i05.\u0275\u0275nextContext();
    i05.\u0275\u0275advance();
    i05.\u0275\u0275property("ngForOf", ctx_r2.artifacts);
  }
}
var OILibraryCardComponent = class _OILibraryCardComponent {
  constructor(mcp, router, cdr) {
    this.mcp = mcp;
    this.router = router;
    this.cdr = cdr;
    this.userId = "";
    this.artifacts = [];
    this.loading = true;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      try {
        const response = yield firstValueFrom2(this.mcp.call("document", "list_documents", {
          lifecycle_status: "canon",
          limit: 5
        }));
        this.artifacts = response.data?.artifacts ?? [];
      } catch {
        this.artifacts = [];
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  openArtifact(id) {
    this.router.navigate(["/library", id]);
  }
  static {
    this.\u0275fac = function OILibraryCardComponent_Factory(t) {
      return new (t || _OILibraryCardComponent)(i05.\u0275\u0275directiveInject(McpService), i05.\u0275\u0275directiveInject(i25.Router), i05.\u0275\u0275directiveInject(i05.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i05.\u0275\u0275defineComponent({ type: _OILibraryCardComponent, selectors: [["app-oi-library-card"]], inputs: { userId: "userId" }, decls: 9, vars: 3, consts: [[1, "oi-card", "oi-home-card"], [1, "oi-card-header"], ["routerLink", "/library", 1, "oi-card-link"], ["class", "oi-card-empty", 4, "ngIf"], ["class", "oi-artifact-list", 4, "ngIf"], [1, "oi-card-empty"], [1, "oi-artifact-list"], ["class", "oi-artifact-item", 3, "click", 4, "ngFor", "ngForOf"], [1, "oi-artifact-item", 3, "click"], [1, "oi-artifact-title"]], template: function OILibraryCardComponent_Template(rf, ctx) {
      if (rf & 1) {
        i05.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h4");
        i05.\u0275\u0275text(3, "OI Library");
        i05.\u0275\u0275elementEnd();
        i05.\u0275\u0275elementStart(4, "a", 2);
        i05.\u0275\u0275text(5, "View all \u2192");
        i05.\u0275\u0275elementEnd()();
        i05.\u0275\u0275template(6, OILibraryCardComponent_p_6_Template, 2, 0, "p", 3)(7, OILibraryCardComponent_p_7_Template, 2, 0, "p", 3)(8, OILibraryCardComponent_ul_8_Template, 2, 1, "ul", 4);
        i05.\u0275\u0275elementEnd();
      }
      if (rf & 2) {
        i05.\u0275\u0275advance(6);
        i05.\u0275\u0275property("ngIf", ctx.loading);
        i05.\u0275\u0275advance();
        i05.\u0275\u0275property("ngIf", !ctx.loading && ctx.artifacts.length === 0);
        i05.\u0275\u0275advance();
        i05.\u0275\u0275property("ngIf", !ctx.loading && ctx.artifacts.length > 0);
      }
    }, dependencies: [i32.NgForOf, i32.NgIf, RouterLinkWithHrefDelegateDirective, i25.RouterLink], styles: ["\n\n.oi-card-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: var(--triarq-space-md);\n}\nh4[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: var(--triarq-text-h4);\n}\n.oi-card-link[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-small);\n  color: var(--triarq-color-primary);\n  text-decoration: none;\n}\n.oi-card-empty[_ngcontent-%COMP%] {\n  color: var(--triarq-color-text-secondary);\n  font-size: var(--triarq-text-small);\n}\n.oi-artifact-list[_ngcontent-%COMP%] {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n}\n.oi-artifact-item[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: var(--triarq-space-sm) 0;\n  border-bottom: 1px solid var(--triarq-color-border);\n  cursor: pointer;\n}\n.oi-artifact-item[_ngcontent-%COMP%]:hover {\n  background: rgba(37, 112, 153, 0.04);\n}\n.oi-artifact-title[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-small);\n  flex: 1;\n}\n/*# sourceMappingURL=oi-library-card.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i05.\u0275setClassDebugInfo(OILibraryCardComponent, { className: "OILibraryCardComponent", filePath: "src\\app\\features\\home\\components\\oi-library-card.component.ts", lineNumber: 44 });
})();

// src/app/features/home/components/divisions-card.component.ts
import { Component as Component6, ChangeDetectionStrategy as ChangeDetectionStrategy6 } from "@angular/core";
import { firstValueFrom as firstValueFrom3 } from "rxjs";
import * as i06 from "@angular/core";
import * as i26 from "@angular/common";
import * as i4 from "@angular/router";
function DivisionsCardComponent_p_6_Template(rf, ctx) {
  if (rf & 1) {
    i06.\u0275\u0275elementStart(0, "p", 5);
    i06.\u0275\u0275text(1, "Loading\u2026");
    i06.\u0275\u0275elementEnd();
  }
}
function DivisionsCardComponent_p_7_Template(rf, ctx) {
  if (rf & 1) {
    i06.\u0275\u0275elementStart(0, "p", 5);
    i06.\u0275\u0275text(1, " No Divisions created yet. Go to Manage to create the nine Trust Divisions. ");
    i06.\u0275\u0275elementEnd();
  }
}
function DivisionsCardComponent_ul_8_li_1_span_3_Template(rf, ctx) {
  if (rf & 1) {
    i06.\u0275\u0275elementStart(0, "span", 11);
    i06.\u0275\u0275text(1);
    i06.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const d_r1 = i06.\u0275\u0275nextContext().$implicit;
    i06.\u0275\u0275advance();
    i06.\u0275\u0275textInterpolate(d_r1.division_type_label);
  }
}
function DivisionsCardComponent_ul_8_li_1_Template(rf, ctx) {
  if (rf & 1) {
    i06.\u0275\u0275elementStart(0, "li", 8)(1, "span", 9);
    i06.\u0275\u0275text(2);
    i06.\u0275\u0275elementEnd();
    i06.\u0275\u0275template(3, DivisionsCardComponent_ul_8_li_1_span_3_Template, 2, 1, "span", 10);
    i06.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const d_r1 = ctx.$implicit;
    i06.\u0275\u0275advance(2);
    i06.\u0275\u0275textInterpolate(d_r1.division_name);
    i06.\u0275\u0275advance();
    i06.\u0275\u0275property("ngIf", d_r1.division_type_label);
  }
}
function DivisionsCardComponent_ul_8_Template(rf, ctx) {
  if (rf & 1) {
    i06.\u0275\u0275elementStart(0, "ul", 6);
    i06.\u0275\u0275template(1, DivisionsCardComponent_ul_8_li_1_Template, 4, 2, "li", 7);
    i06.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i06.\u0275\u0275nextContext();
    i06.\u0275\u0275advance();
    i06.\u0275\u0275property("ngForOf", ctx_r1.divisions);
  }
}
var DivisionsCardComponent = class _DivisionsCardComponent {
  constructor(mcp, cdr) {
    this.mcp = mcp;
    this.cdr = cdr;
    this.divisions = [];
    this.loading = true;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      try {
        const response = yield firstValueFrom3(this.mcp.call("division", "list_divisions", {}));
        this.divisions = response.data ?? [];
      } catch {
        this.divisions = [];
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  static {
    this.\u0275fac = function DivisionsCardComponent_Factory(t) {
      return new (t || _DivisionsCardComponent)(i06.\u0275\u0275directiveInject(McpService), i06.\u0275\u0275directiveInject(i06.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i06.\u0275\u0275defineComponent({ type: _DivisionsCardComponent, selectors: [["app-divisions-card"]], decls: 9, vars: 3, consts: [[1, "oi-card", "oi-home-card"], [1, "oi-card-header"], ["routerLink", "/admin/divisions", 1, "oi-card-link"], ["class", "oi-card-empty", 4, "ngIf"], ["class", "oi-division-list", 4, "ngIf"], [1, "oi-card-empty"], [1, "oi-division-list"], ["class", "oi-division-item", 4, "ngFor", "ngForOf"], [1, "oi-division-item"], [1, "oi-division-name"], ["class", "oi-division-label", 4, "ngIf"], [1, "oi-division-label"]], template: function DivisionsCardComponent_Template(rf, ctx) {
      if (rf & 1) {
        i06.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h4");
        i06.\u0275\u0275text(3, "Divisions");
        i06.\u0275\u0275elementEnd();
        i06.\u0275\u0275elementStart(4, "a", 2);
        i06.\u0275\u0275text(5, "Manage \u2192");
        i06.\u0275\u0275elementEnd()();
        i06.\u0275\u0275template(6, DivisionsCardComponent_p_6_Template, 2, 0, "p", 3)(7, DivisionsCardComponent_p_7_Template, 2, 0, "p", 3)(8, DivisionsCardComponent_ul_8_Template, 2, 1, "ul", 4);
        i06.\u0275\u0275elementEnd();
      }
      if (rf & 2) {
        i06.\u0275\u0275advance(6);
        i06.\u0275\u0275property("ngIf", ctx.loading);
        i06.\u0275\u0275advance();
        i06.\u0275\u0275property("ngIf", !ctx.loading && ctx.divisions.length === 0);
        i06.\u0275\u0275advance();
        i06.\u0275\u0275property("ngIf", !ctx.loading && ctx.divisions.length > 0);
      }
    }, dependencies: [i26.NgForOf, i26.NgIf, RouterLinkWithHrefDelegateDirective, i4.RouterLink], styles: ["\n\n.oi-card-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: var(--triarq-space-md);\n}\nh4[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: var(--triarq-text-h4);\n}\n.oi-card-link[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-small);\n  color: var(--triarq-color-primary);\n  text-decoration: none;\n}\n.oi-card-empty[_ngcontent-%COMP%] {\n  color: var(--triarq-color-text-secondary);\n  font-size: var(--triarq-text-small);\n}\n.oi-division-list[_ngcontent-%COMP%] {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n}\n.oi-division-item[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  padding: var(--triarq-space-xs) 0;\n  border-bottom: 1px solid var(--triarq-color-border);\n  font-size: var(--triarq-text-small);\n}\n.oi-division-label[_ngcontent-%COMP%] {\n  color: var(--triarq-color-text-secondary);\n  font-size: var(--triarq-text-caption);\n}\n/*# sourceMappingURL=divisions-card.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i06.\u0275setClassDebugInfo(DivisionsCardComponent, { className: "DivisionsCardComponent", filePath: "src\\app\\features\\home\\components\\divisions-card.component.ts", lineNumber: 42 });
})();

// src/app/features/home/components/user-management-card.component.ts
import { Component as Component7, ChangeDetectionStrategy as ChangeDetectionStrategy7 } from "@angular/core";
import { firstValueFrom as firstValueFrom4 } from "rxjs";
import * as i07 from "@angular/core";
import * as i27 from "@angular/common";
import * as i42 from "@angular/router";
function UserManagementCardComponent_p_6_Template(rf, ctx) {
  if (rf & 1) {
    i07.\u0275\u0275elementStart(0, "p", 5);
    i07.\u0275\u0275text(1, "Loading\u2026");
    i07.\u0275\u0275elementEnd();
  }
}
function UserManagementCardComponent_div_7_Template(rf, ctx) {
  if (rf & 1) {
    i07.\u0275\u0275elementStart(0, "div", 6)(1, "span", 7);
    i07.\u0275\u0275text(2);
    i07.\u0275\u0275elementEnd();
    i07.\u0275\u0275elementStart(3, "span", 8);
    i07.\u0275\u0275text(4, "total users");
    i07.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = i07.\u0275\u0275nextContext();
    i07.\u0275\u0275advance(2);
    i07.\u0275\u0275textInterpolate(ctx_r0.totalUsers);
  }
}
var UserManagementCardComponent = class _UserManagementCardComponent {
  constructor(mcp, cdr) {
    this.mcp = mcp;
    this.cdr = cdr;
    this.totalUsers = 0;
    this.loading = true;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      try {
        const response = yield firstValueFrom4(this.mcp.call("division", "list_users", {}));
        this.totalUsers = response.data?.length ?? 0;
      } catch {
        this.totalUsers = 0;
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  static {
    this.\u0275fac = function UserManagementCardComponent_Factory(t) {
      return new (t || _UserManagementCardComponent)(i07.\u0275\u0275directiveInject(McpService), i07.\u0275\u0275directiveInject(i07.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i07.\u0275\u0275defineComponent({ type: _UserManagementCardComponent, selectors: [["app-user-management-card"]], decls: 8, vars: 2, consts: [[1, "oi-card", "oi-home-card"], [1, "oi-card-header"], ["routerLink", "/admin/users", 1, "oi-card-link"], ["class", "oi-card-empty", 4, "ngIf"], ["class", "oi-user-stats", 4, "ngIf"], [1, "oi-card-empty"], [1, "oi-user-stats"], [1, "oi-stat-value"], [1, "oi-stat-label"]], template: function UserManagementCardComponent_Template(rf, ctx) {
      if (rf & 1) {
        i07.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h4");
        i07.\u0275\u0275text(3, "User Management");
        i07.\u0275\u0275elementEnd();
        i07.\u0275\u0275elementStart(4, "a", 2);
        i07.\u0275\u0275text(5, "Manage \u2192");
        i07.\u0275\u0275elementEnd()();
        i07.\u0275\u0275template(6, UserManagementCardComponent_p_6_Template, 2, 0, "p", 3)(7, UserManagementCardComponent_div_7_Template, 5, 1, "div", 4);
        i07.\u0275\u0275elementEnd();
      }
      if (rf & 2) {
        i07.\u0275\u0275advance(6);
        i07.\u0275\u0275property("ngIf", ctx.loading);
        i07.\u0275\u0275advance();
        i07.\u0275\u0275property("ngIf", !ctx.loading);
      }
    }, dependencies: [i27.NgIf, RouterLinkWithHrefDelegateDirective, i42.RouterLink], styles: ["\n\n.oi-card-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: var(--triarq-space-md);\n}\nh4[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: var(--triarq-text-h4);\n}\n.oi-card-link[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-small);\n  color: var(--triarq-color-primary);\n  text-decoration: none;\n}\n.oi-card-empty[_ngcontent-%COMP%] {\n  color: var(--triarq-color-text-secondary);\n  font-size: var(--triarq-text-small);\n}\n.oi-user-stats[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: baseline;\n  gap: var(--triarq-space-sm);\n}\n.oi-stat-value[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-h3);\n  font-weight: var(--triarq-font-weight-bold);\n  color: var(--triarq-color-primary);\n}\n.oi-stat-label[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-small);\n  color: var(--triarq-color-text-secondary);\n}\n/*# sourceMappingURL=user-management-card.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i07.\u0275setClassDebugInfo(UserManagementCardComponent, { className: "UserManagementCardComponent", filePath: "src\\app\\features\\home\\components\\user-management-card.component.ts", lineNumber: 36 });
})();

// src/app/features/home/components/embedded-chat-card.component.ts
import { Component as Component8, ChangeDetectionStrategy as ChangeDetectionStrategy8 } from "@angular/core";
import * as i08 from "@angular/core";
var EmbeddedChatCardComponent = class _EmbeddedChatCardComponent {
  static {
    this.\u0275fac = function EmbeddedChatCardComponent_Factory(t) {
      return new (t || _EmbeddedChatCardComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i08.\u0275\u0275defineComponent({ type: _EmbeddedChatCardComponent, selectors: [["app-embedded-chat-card"]], decls: 7, vars: 0, consts: [[1, "oi-card", "oi-home-card", "oi-card-shell"], [1, "oi-shell-message"], [1, "oi-shell-sub"]], template: function EmbeddedChatCardComponent_Template(rf, ctx) {
      if (rf & 1) {
        i08.\u0275\u0275elementStart(0, "div", 0)(1, "h4");
        i08.\u0275\u0275text(2, "OI Assistant");
        i08.\u0275\u0275elementEnd();
        i08.\u0275\u0275elementStart(3, "p", 1);
        i08.\u0275\u0275text(4, " AI-powered knowledge chat is coming in Build B. ");
        i08.\u0275\u0275elementEnd();
        i08.\u0275\u0275elementStart(5, "p", 2);
        i08.\u0275\u0275text(6, " You'll be able to ask questions across your Division's knowledge library and receive cited, source-linked answers. ");
        i08.\u0275\u0275elementEnd()();
      }
    }, styles: ["\n\nh4[_ngcontent-%COMP%] {\n  margin: 0 0 var(--triarq-space-sm) 0;\n  font-size: var(--triarq-text-h4);\n}\n.oi-card-shell[_ngcontent-%COMP%] {\n  border: 1px dashed var(--triarq-color-border);\n}\n.oi-shell-message[_ngcontent-%COMP%] {\n  color: var(--triarq-color-text-secondary);\n  font-size: var(--triarq-text-small);\n  margin: 0 0 var(--triarq-space-xs) 0;\n}\n.oi-shell-sub[_ngcontent-%COMP%] {\n  color: var(--triarq-color-text-disabled);\n  font-size: var(--triarq-text-caption);\n  margin: 0;\n}\n/*# sourceMappingURL=embedded-chat-card.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i08.\u0275setClassDebugInfo(EmbeddedChatCardComponent, { className: "EmbeddedChatCardComponent", filePath: "src\\app\\features\\home\\components\\embedded-chat-card.component.ts", lineNumber: 29 });
})();

// src/app/features/home/components/onboarding-message-card.component.ts
import { Component as Component9, Input as Input5, ChangeDetectionStrategy as ChangeDetectionStrategy9 } from "@angular/core";
import * as i09 from "@angular/core";
var OnboardingMessageCardComponent = class _OnboardingMessageCardComponent {
  constructor() {
    this.displayName = "";
  }
  static {
    this.\u0275fac = function OnboardingMessageCardComponent_Factory(t) {
      return new (t || _OnboardingMessageCardComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i09.\u0275\u0275defineComponent({ type: _OnboardingMessageCardComponent, selectors: [["app-onboarding-message-card"]], inputs: { displayName: "displayName" }, decls: 7, vars: 1, consts: [[1, "oi-card", "oi-onboarding-card"], [1, "oi-onboarding-primary"], [1, "oi-onboarding-secondary"]], template: function OnboardingMessageCardComponent_Template(rf, ctx) {
      if (rf & 1) {
        i09.\u0275\u0275elementStart(0, "div", 0)(1, "h3");
        i09.\u0275\u0275text(2);
        i09.\u0275\u0275elementEnd();
        i09.\u0275\u0275elementStart(3, "p", 1);
        i09.\u0275\u0275text(4, " You're not assigned to any Division yet. ");
        i09.\u0275\u0275elementEnd();
        i09.\u0275\u0275elementStart(5, "p", 2);
        i09.\u0275\u0275text(6, " Contact your System Admin to be assigned to a Division. Once assigned, your home screen will show your workspace cards. ");
        i09.\u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        i09.\u0275\u0275advance(2);
        i09.\u0275\u0275textInterpolate1("Welcome, ", ctx.displayName, "");
      }
    }, styles: ["\n\n.oi-onboarding-card[_ngcontent-%COMP%] {\n  max-width: 520px;\n  margin: 64px auto;\n  text-align: center;\n  padding: var(--triarq-space-2xl);\n}\nh3[_ngcontent-%COMP%] {\n  color: var(--triarq-color-primary);\n  margin-bottom: var(--triarq-space-md);\n}\n.oi-onboarding-primary[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-body);\n  font-weight: var(--triarq-font-weight-medium);\n}\n.oi-onboarding-secondary[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-small);\n  color: var(--triarq-color-text-secondary);\n}\n/*# sourceMappingURL=onboarding-message-card.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i09.\u0275setClassDebugInfo(OnboardingMessageCardComponent, { className: "OnboardingMessageCardComponent", filePath: "src\\app\\features\\home\\components\\onboarding-message-card.component.ts", lineNumber: 34 });
})();

// src/app/features/home/home.component.ts
function HomeComponent_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i010.\u0275\u0275elementStart(0, "div", 4);
    i010.\u0275\u0275element(1, "ion-spinner", 5);
    i010.\u0275\u0275elementStart(2, "p");
    i010.\u0275\u0275text(3, "Loading your workspace\u2026");
    i010.\u0275\u0275elementEnd()();
  }
}
function HomeComponent_app_onboarding_message_card_2_Template(rf, ctx) {
  if (rf & 1) {
    i010.\u0275\u0275element(0, "app-onboarding-message-card", 6);
  }
  if (rf & 2) {
    let tmp_1_0;
    const ctx_r0 = i010.\u0275\u0275nextContext();
    i010.\u0275\u0275property("displayName", (tmp_1_0 = ctx_r0.profile == null ? null : ctx_r0.profile.display_name) !== null && tmp_1_0 !== void 0 ? tmp_1_0 : "");
  }
}
function HomeComponent_div_3_app_system_health_card_3_Template(rf, ctx) {
  if (rf & 1) {
    i010.\u0275\u0275element(0, "app-system-health-card");
  }
}
function HomeComponent_div_3_app_divisions_card_5_Template(rf, ctx) {
  if (rf & 1) {
    i010.\u0275\u0275element(0, "app-divisions-card");
  }
}
function HomeComponent_div_3_app_user_management_card_6_Template(rf, ctx) {
  if (rf & 1) {
    i010.\u0275\u0275element(0, "app-user-management-card");
  }
}
function HomeComponent_div_3_app_my_delivery_cycles_card_7_Template(rf, ctx) {
  if (rf & 1) {
    i010.\u0275\u0275element(0, "app-my-delivery-cycles-card", 8);
  }
  if (rf & 2) {
    let tmp_2_0;
    const ctx_r0 = i010.\u0275\u0275nextContext(2);
    i010.\u0275\u0275property("userId", (tmp_2_0 = ctx_r0.profile == null ? null : ctx_r0.profile.id) !== null && tmp_2_0 !== void 0 ? tmp_2_0 : "");
  }
}
function HomeComponent_div_3_Template(rf, ctx) {
  if (rf & 1) {
    i010.\u0275\u0275elementStart(0, "div", 7);
    i010.\u0275\u0275element(1, "app-my-action-queue-card", 8)(2, "app-my-notifications-card", 8);
    i010.\u0275\u0275template(3, HomeComponent_div_3_app_system_health_card_3_Template, 1, 0, "app-system-health-card", 9);
    i010.\u0275\u0275element(4, "app-oi-library-card", 8);
    i010.\u0275\u0275template(5, HomeComponent_div_3_app_divisions_card_5_Template, 1, 0, "app-divisions-card", 9)(6, HomeComponent_div_3_app_user_management_card_6_Template, 1, 0, "app-user-management-card", 9)(7, HomeComponent_div_3_app_my_delivery_cycles_card_7_Template, 1, 1, "app-my-delivery-cycles-card", 10);
    i010.\u0275\u0275element(8, "app-embedded-chat-card");
    i010.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_1_0;
    let tmp_2_0;
    let tmp_4_0;
    const ctx_r0 = i010.\u0275\u0275nextContext();
    i010.\u0275\u0275advance();
    i010.\u0275\u0275property("userId", (tmp_1_0 = ctx_r0.profile == null ? null : ctx_r0.profile.id) !== null && tmp_1_0 !== void 0 ? tmp_1_0 : "");
    i010.\u0275\u0275advance();
    i010.\u0275\u0275property("userId", (tmp_2_0 = ctx_r0.profile == null ? null : ctx_r0.profile.id) !== null && tmp_2_0 !== void 0 ? tmp_2_0 : "");
    i010.\u0275\u0275advance();
    i010.\u0275\u0275property("ngIf", ctx_r0.showSystemHealth);
    i010.\u0275\u0275advance();
    i010.\u0275\u0275property("userId", (tmp_4_0 = ctx_r0.profile == null ? null : ctx_r0.profile.id) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : "");
    i010.\u0275\u0275advance();
    i010.\u0275\u0275property("ngIf", ctx_r0.showDivisions);
    i010.\u0275\u0275advance();
    i010.\u0275\u0275property("ngIf", ctx_r0.showUserManagement);
    i010.\u0275\u0275advance();
    i010.\u0275\u0275property("ngIf", ctx_r0.showDeliveryCycles);
  }
}
var HomeComponent = class _HomeComponent {
  constructor(profileService, mcp, cdr) {
    this.profileService = profileService;
    this.mcp = mcp;
    this.cdr = cdr;
    this.profile = null;
    this.role = null;
    this.hasDivision = false;
    this.loading = true;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.profile = yield this.profileService.loadProfile();
      this.role = this.profile?.system_role ?? null;
      if (this.profile) {
        yield this.checkDivisionMembership();
      }
      this.loading = false;
      this.cdr.markForCheck();
    });
  }
  checkDivisionMembership() {
    return __async(this, null, function* () {
      if (this.role === "phil" || this.role === "admin") {
        this.hasDivision = true;
        this.profileService.setHasDivision(true);
        return;
      }
      try {
        const response = yield firstValueFrom5(this.mcp.call("division", "get_user_divisions", { user_id: this.profile.id }));
        const divisions = response.data?.all_accessible_divisions ?? [];
        this.hasDivision = divisions.length > 0;
        this.profileService.setHasDivision(this.hasDivision);
      } catch {
        this.hasDivision = false;
      }
    });
  }
  // Role visibility helpers — used in template to show/hide cards per D-150
  get isPhil() {
    return this.role === "phil";
  }
  get isDS() {
    return this.role === "ds";
  }
  get isCB() {
    return this.role === "cb";
  }
  get isCE() {
    return this.role === "ce";
  }
  get isAdmin() {
    return this.role === "admin";
  }
  get showSystemHealth() {
    return this.isPhil;
  }
  get showDivisions() {
    return this.isPhil || this.isAdmin;
  }
  get showUserManagement() {
    return this.isAdmin;
  }
  // My Delivery Cycles card — DS and CB only (build-c-supplement-spec Section 6, D-150).
  // Phil and Admin use the full dashboard. CE is read-only and not in a create/DS/CB role.
  // assigned_to_current_user scopes data server-side; role check here hides card for non-DS/CB.
  get showDeliveryCycles() {
    return this.isDS || this.isCB;
  }
  // Phil and Admin always see the main cards — they need the Divisions card to
  // bootstrap the hierarchy before they can have a division assignment themselves.
  // Other roles see the onboarding message until an admin assigns them.
  get showOnboarding() {
    return !this.hasDivision && !this.loading && !this.isPhil && !this.isAdmin;
  }
  get showMainCards() {
    if (this.loading)
      return false;
    if (this.isPhil || this.isAdmin)
      return true;
    return this.hasDivision;
  }
  static {
    this.\u0275fac = function HomeComponent_Factory(t) {
      return new (t || _HomeComponent)(i010.\u0275\u0275directiveInject(UserProfileService), i010.\u0275\u0275directiveInject(McpService), i010.\u0275\u0275directiveInject(i010.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i010.\u0275\u0275defineComponent({ type: _HomeComponent, selectors: [["app-home"]], decls: 4, vars: 3, consts: [[1, "oi-home-screen"], ["class", "oi-home-loading", 4, "ngIf"], [3, "displayName", 4, "ngIf"], ["class", "oi-card-grid", 4, "ngIf"], [1, "oi-home-loading"], ["name", "crescent", "color", "primary"], [3, "displayName"], [1, "oi-card-grid"], [3, "userId"], [4, "ngIf"], [3, "userId", 4, "ngIf"]], template: function HomeComponent_Template(rf, ctx) {
      if (rf & 1) {
        i010.\u0275\u0275elementStart(0, "div", 0);
        i010.\u0275\u0275template(1, HomeComponent_div_1_Template, 4, 0, "div", 1)(2, HomeComponent_app_onboarding_message_card_2_Template, 1, 1, "app-onboarding-message-card", 2)(3, HomeComponent_div_3_Template, 9, 7, "div", 3);
        i010.\u0275\u0275elementEnd();
      }
      if (rf & 2) {
        i010.\u0275\u0275advance();
        i010.\u0275\u0275property("ngIf", ctx.loading);
        i010.\u0275\u0275advance();
        i010.\u0275\u0275property("ngIf", ctx.showOnboarding);
        i010.\u0275\u0275advance();
        i010.\u0275\u0275property("ngIf", ctx.showMainCards);
      }
    }, dependencies: [i33.NgIf, IonSpinner, MyDeliveryCyclesCardComponent, MyActionQueueCardComponent, MyNotificationsCardComponent, SystemHealthCardComponent, OILibraryCardComponent, DivisionsCardComponent, UserManagementCardComponent, EmbeddedChatCardComponent, OnboardingMessageCardComponent], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i010.\u0275setClassDebugInfo(HomeComponent, { className: "HomeComponent", filePath: "src\\app\\features\\home\\home.component.ts", lineNumber: 17 });
})();

// src/app/features/home/home.module.ts
import * as i011 from "@angular/core";
var HomeModule = class _HomeModule {
  static {
    this.\u0275fac = function HomeModule_Factory(t) {
      return new (t || _HomeModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ i011.\u0275\u0275defineNgModule({ type: _HomeModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ i011.\u0275\u0275defineInjector({ imports: [
      CommonModule2,
      IonicModule,
      MyDeliveryCyclesCardComponent,
      RouterModule2.forChild([{ path: "", component: HomeComponent }])
    ] });
  }
};
export {
  HomeModule
};
//# sourceMappingURL=home.module-KDCYTHHN.js.map
