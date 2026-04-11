import {
  SCREEN_KEYS,
  ScreenStateService
} from "./chunk-27HR6UOY.js";
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

// src/app/features/delivery/gates-summary/gates-summary.component.ts
import { Component, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { firstValueFrom, Subscription } from "rxjs";
import { filter, take } from "rxjs/operators";
import * as i0 from "@angular/core";
import * as i5 from "@angular/router";
import * as i6 from "@angular/common";
import * as i7 from "@angular/forms";
function GatesSummaryComponent_label_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "label", 8)(1, "input", 9);
    i0.\u0275\u0275twoWayListener("ngModelChange", function GatesSummaryComponent_label_8_Template_input_ngModelChange_1_listener($event) {
      i0.\u0275\u0275restoreView(_r1);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.showMyDivisionsOnly, $event) || (ctx_r1.showMyDivisionsOnly = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function GatesSummaryComponent_label_8_Template_input_ngModelChange_1_listener() {
      i0.\u0275\u0275restoreView(_r1);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.onToggleChange());
    });
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275text(2, " Display only my Divisions ");
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275twoWayProperty("ngModel", ctx_r1.showMyDivisionsOnly);
  }
}
function GatesSummaryComponent_div_9_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 11);
    i0.\u0275\u0275element(1, "ion-skeleton-text", 12)(2, "ion-skeleton-text", 12)(3, "ion-skeleton-text", 12)(4, "ion-skeleton-text", 12);
    i0.\u0275\u0275elementEnd();
  }
}
function GatesSummaryComponent_div_9_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div");
    i0.\u0275\u0275template(1, GatesSummaryComponent_div_9_div_1_Template, 5, 0, "div", 10);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r1.skeletonRows);
  }
}
function GatesSummaryComponent_div_10_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 13)(1, "div", 14);
    i0.\u0275\u0275text(2, " Gate summary could not load. ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 15);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.loadError, " ");
  }
}
function GatesSummaryComponent_div_11_option_5_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "option", 26);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const g_r4 = ctx.$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275property("value", g_r4);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r1.gateLabel(g_r4));
  }
}
function GatesSummaryComponent_div_11_div_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 27);
    i0.\u0275\u0275listener("mouseenter", function GatesSummaryComponent_div_11_div_15_Template_div_mouseenter_0_listener($event) {
      i0.\u0275\u0275restoreView(_r5);
      return i0.\u0275\u0275resetView($event.currentTarget.style.background = "var(--triarq-color-background-subtle)");
    })("mouseleave", function GatesSummaryComponent_div_11_div_15_Template_div_mouseleave_0_listener($event) {
      i0.\u0275\u0275restoreView(_r5);
      return i0.\u0275\u0275resetView($event.currentTarget.style.background = "");
    })("click", function GatesSummaryComponent_div_11_div_15_Template_div_click_0_listener() {
      const gate_r6 = i0.\u0275\u0275restoreView(_r5).$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.drillDown(gate_r6.gate_name));
    });
    i0.\u0275\u0275elementStart(1, "span", 28);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "span", 29);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "span", 29);
    i0.\u0275\u0275text(6);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(7, "span", 29);
    i0.\u0275\u0275text(8);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const gate_r6 = ctx.$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.gateLabel(gate_r6.gate_name), " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("color", gate_r6.total_pending_count > 0 ? "var(--triarq-color-primary)" : "var(--triarq-color-text-secondary)");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", gate_r6.total_pending_count || "\u2014", " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("color", gate_r6.upcoming_count > 0 ? "var(--triarq-color-sunray,#f5a623)" : "var(--triarq-color-text-secondary)")("font-weight", gate_r6.upcoming_count > 0 ? "600" : "400");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", gate_r6.upcoming_count > 0 ? gate_r6.upcoming_count : "\u2014", " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("color", gate_r6.overdue_count > 0 ? "var(--triarq-color-error,#d32f2f)" : "var(--triarq-color-text-secondary)")("font-weight", gate_r6.overdue_count > 0 ? "600" : "400");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", gate_r6.overdue_count > 0 ? gate_r6.overdue_count : "\u2014", " ");
  }
}
function GatesSummaryComponent_div_11_div_16_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 30);
    i0.\u0275\u0275text(1, " No active Delivery Cycles found in your Divisions. ");
    i0.\u0275\u0275elementEnd();
  }
}
function GatesSummaryComponent_div_11_div_17_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 31)(1, "strong", 32);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "span", 33);
    i0.\u0275\u0275text(4, " \u2014 these Delivery Cycles have passed their target Gate date with no approval recorded. Click the relevant Gate row to identify the Delivery Cycles. ");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate2(" ", ctx_r1.totalOverdue, " overdue gate", ctx_r1.totalOverdue === 1 ? "" : "s", " ");
  }
}
function GatesSummaryComponent_div_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div")(1, "div", 16)(2, "select", 17);
    i0.\u0275\u0275twoWayListener("ngModelChange", function GatesSummaryComponent_div_11_Template_select_ngModelChange_2_listener($event) {
      i0.\u0275\u0275restoreView(_r3);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.filterGateType, $event) || (ctx_r1.filterGateType = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function GatesSummaryComponent_div_11_Template_select_ngModelChange_2_listener() {
      i0.\u0275\u0275restoreView(_r3);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.saveState());
    });
    i0.\u0275\u0275elementStart(3, "option", 18);
    i0.\u0275\u0275text(4, "All Gate Types");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(5, GatesSummaryComponent_div_11_option_5_Template, 2, 2, "option", 19);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(6, "div", 20)(7, "span", 21);
    i0.\u0275\u0275listener("click", function GatesSummaryComponent_div_11_Template_span_click_7_listener() {
      i0.\u0275\u0275restoreView(_r3);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.setSort("gate_name"));
    });
    i0.\u0275\u0275text(8);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(9, "span", 22);
    i0.\u0275\u0275listener("click", function GatesSummaryComponent_div_11_Template_span_click_9_listener() {
      i0.\u0275\u0275restoreView(_r3);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.setSort("total_pending_count"));
    });
    i0.\u0275\u0275text(10);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(11, "span", 22);
    i0.\u0275\u0275listener("click", function GatesSummaryComponent_div_11_Template_span_click_11_listener() {
      i0.\u0275\u0275restoreView(_r3);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.setSort("upcoming_count"));
    });
    i0.\u0275\u0275text(12);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(13, "span", 22);
    i0.\u0275\u0275listener("click", function GatesSummaryComponent_div_11_Template_span_click_13_listener() {
      i0.\u0275\u0275restoreView(_r3);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.setSort("overdue_count"));
    });
    i0.\u0275\u0275text(14);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275template(15, GatesSummaryComponent_div_11_div_15_Template, 9, 14, "div", 23)(16, GatesSummaryComponent_div_11_div_16_Template, 2, 0, "div", 24)(17, GatesSummaryComponent_div_11_div_17_Template, 5, 2, "div", 25);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275twoWayProperty("ngModel", ctx_r1.filterGateType);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275property("ngForOf", ctx_r1.allGateNames);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1(" Gate ", ctx_r1.sortIndicator("gate_name"), " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" Total Pending ", ctx_r1.sortIndicator("total_pending_count"), " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" Upcoming (\u22647 days) ", ctx_r1.sortIndicator("upcoming_count"), " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" Overdue ", ctx_r1.sortIndicator("overdue_count"), " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r1.sortedGateSummaries);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.gateSummaries.length === 0);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.totalOverdue > 0);
  }
}
var SCREEN_KEY = SCREEN_KEYS.DELIVERY_GATES;
var GATE_LABELS = {
  brief_review: "Brief Review",
  go_to_build: "Go to Build",
  go_to_deploy: "Go to Deploy",
  go_to_release: "Go to Release",
  close_review: "Close Review"
};
var GatesSummaryComponent = class _GatesSummaryComponent {
  constructor(delivery, mcp, profile, screenState, router, cdr) {
    this.delivery = delivery;
    this.mcp = mcp;
    this.profile = profile;
    this.screenState = screenState;
    this.router = router;
    this.cdr = cdr;
    this.loading = false;
    this.loadError = "";
    this.isPrivileged = false;
    this.showMyDivisionsOnly = true;
    this.userDivisionIds = [];
    this.gateSummaries = [];
    this.filterGateType = "";
    this.sortCol = "gate_name";
    this.sortDir = "asc";
    this.allGateNames = [
      "brief_review",
      "go_to_build",
      "go_to_deploy",
      "go_to_release",
      "close_review"
    ];
    this.skeletonRows = [1, 2, 3, 4, 5];
    this.currentUserId = "";
    this.profileSub = new Subscription();
  }
  ngOnInit() {
    this.profileSub.add(this.profile.profile$.pipe(filter((p) => p !== null), take(1)).subscribe((profile) => {
      this.currentUserId = profile.id ?? "";
      const saved = this.screenState.restore(SCREEN_KEY, this.currentUserId);
      if (saved) {
        if (typeof saved["filterGateType"] === "string") {
          this.filterGateType = saved["filterGateType"];
        }
        if (typeof saved["sortCol"] === "string") {
          this.sortCol = saved["sortCol"];
        }
        if (saved["sortDir"] === "asc" || saved["sortDir"] === "desc") {
          this.sortDir = saved["sortDir"];
        }
      }
      const role = profile.system_role;
      this.isPrivileged = role === "phil" || role === "admin";
      if (!this.isPrivileged) {
        this.loadUserDivisions(this.currentUserId);
      } else {
        this.loadSummary();
      }
      this.cdr.markForCheck();
    }));
  }
  ngOnDestroy() {
    this.profileSub.unsubscribe();
  }
  loadUserDivisions(userId) {
    return __async(this, null, function* () {
      if (!userId) {
        this.loadSummary();
        return;
      }
      try {
        const res = yield firstValueFrom(this.mcp.call("division", "get_user_divisions", { user_id: userId }));
        this.userDivisionIds = (res.data?.directly_assigned_divisions ?? []).map((d) => d.id);
      } catch {
        this.userDivisionIds = [];
      }
      this.loadSummary();
    });
  }
  loadSummary() {
    this.loading = true;
    this.loadError = "";
    this.cdr.markForCheck();
    const params = {};
    if (!this.isPrivileged && this.showMyDivisionsOnly && this.userDivisionIds.length > 0) {
      params.division_ids = this.userDivisionIds;
    }
    this.delivery.getDeliverySummary(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.gateSummaries = res.data.gate_summaries;
        } else {
          this.loadError = this.friendlyError(res.error);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadError = this.friendlyError(err?.error);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  friendlyError(serverMsg) {
    if (!serverMsg) {
      return "Unable to reach the server. Check your connection and try again.";
    }
    if (serverMsg.includes("not found") && serverMsg.includes("get_delivery_summary")) {
      return "The summary feature is still deploying to the server. This takes 1\u20132 minutes after a new release. Reload the page to try again.";
    }
    return serverMsg;
  }
  onToggleChange() {
    this.loadSummary();
  }
  // Item 4: sort controls
  setSort(col) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
    } else {
      this.sortCol = col;
      this.sortDir = col === "gate_name" ? "asc" : "desc";
    }
    this.saveState();
    this.cdr.markForCheck();
  }
  sortIndicator(col) {
    if (this.sortCol !== col) {
      return "";
    }
    return this.sortDir === "asc" ? "\u2191" : "\u2193";
  }
  saveState() {
    if (!this.currentUserId) {
      return;
    }
    this.screenState.save(SCREEN_KEY, this.currentUserId, {
      filterGateType: this.filterGateType,
      sortCol: this.sortCol,
      sortDir: this.sortDir
    });
  }
  get sortedGateSummaries() {
    let rows = this.filterGateType ? this.gateSummaries.filter((g) => g.gate_name === this.filterGateType) : [...this.gateSummaries];
    rows = rows.slice().sort((a, b) => {
      const dir = this.sortDir === "asc" ? 1 : -1;
      if (this.sortCol === "gate_name") {
        return dir * a.gate_name.localeCompare(b.gate_name);
      }
      return dir * (a[this.sortCol] - b[this.sortCol]);
    });
    return rows;
  }
  drillDown(gate) {
    this.router.navigate(["/delivery/cycles"], { queryParams: { next_gate: gate } });
  }
  gateLabel(gate) {
    return GATE_LABELS[gate];
  }
  get totalOverdue() {
    return this.gateSummaries.reduce((s, g) => s + g.overdue_count, 0);
  }
  static {
    this.\u0275fac = function GatesSummaryComponent_Factory(t) {
      return new (t || _GatesSummaryComponent)(i0.\u0275\u0275directiveInject(DeliveryService), i0.\u0275\u0275directiveInject(McpService), i0.\u0275\u0275directiveInject(UserProfileService), i0.\u0275\u0275directiveInject(ScreenStateService), i0.\u0275\u0275directiveInject(i5.Router), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _GatesSummaryComponent, selectors: [["app-gates-summary"]], standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 12, vars: 4, consts: [[2, "max-width", "800px", "margin", "var(--triarq-space-2xl) auto", "padding", "0 var(--triarq-space-md)"], [2, "margin-bottom", "var(--triarq-space-md)"], ["routerLink", "/delivery", 2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)", "text-decoration", "none"], [2, "margin", "8px 0 4px 0"], [2, "margin", "0", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], ["style", "display:flex;align-items:center;gap:8px;\n                    font-size:var(--triarq-text-small);\n                    color:var(--triarq-color-text-secondary);\n                    margin-bottom:var(--triarq-space-md);cursor:pointer;", 4, "ngIf"], [4, "ngIf"], ["style", "padding:var(--triarq-space-md);max-width:560px;", 4, "ngIf"], [2, "display", "flex", "align-items", "center", "gap", "8px", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "margin-bottom", "var(--triarq-space-md)", "cursor", "pointer"], ["type", "checkbox", 3, "ngModelChange", "ngModel"], ["style", "display:grid;grid-template-columns:2fr 1fr 1fr 1fr;\n                    gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);\n                    border-bottom:1px solid var(--triarq-color-border);align-items:center;", 4, "ngFor", "ngForOf"], [2, "display", "grid", "grid-template-columns", "2fr 1fr 1fr 1fr", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-sm)", "border-bottom", "1px solid var(--triarq-color-border)", "align-items", "center"], ["animated", "", 2, "height", "16px", "border-radius", "4px"], [2, "padding", "var(--triarq-space-md)", "max-width", "560px"], [2, "color", "var(--triarq-color-error)", "font-weight", "500", "margin-bottom", "4px"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], [2, "display", "flex", "gap", "var(--triarq-space-sm)", "flex-wrap", "wrap", "margin-bottom", "var(--triarq-space-sm)", "align-items", "center"], [1, "oi-input", 2, "font-size", "var(--triarq-text-small)", "max-width", "200px", 3, "ngModelChange", "ngModel"], ["value", ""], [3, "value", 4, "ngFor", "ngForOf"], [2, "display", "grid", "grid-template-columns", "2fr 120px 140px 120px", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "font-size", "var(--triarq-text-small)", "font-weight", "500", "color", "var(--triarq-color-text-secondary)", "border-bottom", "2px solid var(--triarq-color-border)"], [2, "cursor", "pointer", "user-select", "none", 3, "click"], [2, "text-align", "center", "cursor", "pointer", "user-select", "none", 3, "click"], ["style", "display:grid;grid-template-columns:2fr 120px 140px 120px;\n                    gap:var(--triarq-space-sm);\n                    padding:var(--triarq-space-sm);\n                    border-bottom:1px solid var(--triarq-color-border);\n                    font-size:var(--triarq-text-small);align-items:center;\n                    cursor:pointer;transition:background 0.1s;", 3, "mouseenter", "mouseleave", "click", 4, "ngFor", "ngForOf"], ["style", "text-align:center;padding:var(--triarq-space-xl);\n                    color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);", 4, "ngIf"], ["style", "margin-top:var(--triarq-space-md);padding:var(--triarq-space-sm) var(--triarq-space-md);\n                    background:#fff8f0;border:1px solid var(--triarq-color-sunray,#f5a623);\n                    border-radius:5px;font-size:var(--triarq-text-small);", 4, "ngIf"], [3, "value"], [2, "display", "grid", "grid-template-columns", "2fr 120px 140px 120px", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-sm)", "border-bottom", "1px solid var(--triarq-color-border)", "font-size", "var(--triarq-text-small)", "align-items", "center", "cursor", "pointer", "transition", "background 0.1s", 3, "mouseenter", "mouseleave", "click"], [2, "font-weight", "500", "color", "var(--triarq-color-text-primary)"], [2, "text-align", "center"], [2, "text-align", "center", "padding", "var(--triarq-space-xl)", "color", "var(--triarq-color-text-secondary)", "font-size", "var(--triarq-text-small)"], [2, "margin-top", "var(--triarq-space-md)", "padding", "var(--triarq-space-sm) var(--triarq-space-md)", "background", "#fff8f0", "border", "1px solid var(--triarq-color-sunray,#f5a623)", "border-radius", "5px", "font-size", "var(--triarq-text-small)"], [2, "color", "var(--triarq-color-sunray,#f5a623)"], [2, "color", "var(--triarq-color-text-secondary)", "margin-left", "6px"]], template: function GatesSummaryComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "a", 2);
        i0.\u0275\u0275text(3, " \u2190 Delivery Cycle Tracking ");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(4, "h3", 3);
        i0.\u0275\u0275text(5, "Upcoming Gate Summary");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(6, "p", 4);
        i0.\u0275\u0275text(7, " Gates with target dates in the next 7 days and gates with overdue target dates. Click a Gate row to see all Delivery Cycles pending it. ");
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275template(8, GatesSummaryComponent_label_8_Template, 3, 1, "label", 5)(9, GatesSummaryComponent_div_9_Template, 2, 1, "div", 6)(10, GatesSummaryComponent_div_10_Template, 5, 1, "div", 7)(11, GatesSummaryComponent_div_11_Template, 18, 9, "div", 6);
        i0.\u0275\u0275elementEnd();
      }
      if (rf & 2) {
        i0.\u0275\u0275advance(8);
        i0.\u0275\u0275property("ngIf", !ctx.isPrivileged);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.loadError && !ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && !ctx.loadError);
      }
    }, dependencies: [CommonModule, i6.NgForOf, i6.NgIf, RouterModule, i5.RouterLink, FormsModule, i7.NgSelectOption, i7.\u0275NgSelectMultipleOption, i7.CheckboxControlValueAccessor, i7.SelectControlValueAccessor, i7.NgControlStatus, i7.NgModel, IonicModule, IonSkeletonText, RouterLinkWithHrefDelegateDirective], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(GatesSummaryComponent, { className: "GatesSummaryComponent", filePath: "src\\app\\features\\delivery\\gates-summary\\gates-summary.component.ts", lineNumber: 200 });
})();
export {
  GatesSummaryComponent
};
//# sourceMappingURL=gates-summary.component-UH6JRAXO.js.map
