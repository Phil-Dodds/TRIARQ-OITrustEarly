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

// src/app/features/delivery/division-summary/division-summary.component.ts
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
function DivisionSummaryComponent_label_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "label", 12)(1, "input", 13);
    i0.\u0275\u0275twoWayListener("ngModelChange", function DivisionSummaryComponent_label_8_Template_input_ngModelChange_1_listener($event) {
      i0.\u0275\u0275restoreView(_r1);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.showMyDivisionsOnly, $event) || (ctx_r1.showMyDivisionsOnly = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function DivisionSummaryComponent_label_8_Template_input_ngModelChange_1_listener() {
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
function DivisionSummaryComponent_div_9_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 15);
    i0.\u0275\u0275element(1, "ion-skeleton-text", 16)(2, "ion-skeleton-text", 16);
    i0.\u0275\u0275elementEnd();
  }
}
function DivisionSummaryComponent_div_9_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div");
    i0.\u0275\u0275template(1, DivisionSummaryComponent_div_9_div_1_Template, 3, 0, "div", 14);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r1.skeletonRows);
  }
}
function DivisionSummaryComponent_div_10_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 17)(1, "div", 18);
    i0.\u0275\u0275text(2, " Division summary could not load. ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 19);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.loadError, " ");
  }
}
function DivisionSummaryComponent_div_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 20)(1, "span", 21);
    i0.\u0275\u0275listener("click", function DivisionSummaryComponent_div_11_Template_span_click_1_listener() {
      i0.\u0275\u0275restoreView(_r3);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.setSort("division_name"));
    });
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "span", 22);
    i0.\u0275\u0275listener("click", function DivisionSummaryComponent_div_11_Template_span_click_3_listener() {
      i0.\u0275\u0275restoreView(_r3);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.setSort("active_cycle_count"));
    });
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" Division ", ctx_r1.sortIndicator("division_name"), " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" Active Cycles ", ctx_r1.sortIndicator("active_cycle_count"), " ");
  }
}
function DivisionSummaryComponent_div_12_span_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 27);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const div_r5 = i0.\u0275\u0275nextContext().$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.treePrefix(div_r5.division_level), " ");
  }
}
function DivisionSummaryComponent_div_12_span_7_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 28);
    i0.\u0275\u0275text(1, "\u2192");
    i0.\u0275\u0275elementEnd();
  }
}
function DivisionSummaryComponent_div_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 23);
    i0.\u0275\u0275listener("mouseenter", function DivisionSummaryComponent_div_12_Template_div_mouseenter_0_listener($event) {
      const div_r5 = i0.\u0275\u0275restoreView(_r4).$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(div_r5.active_cycle_count > 0 && ctx_r1.highlightRow($event, true));
    })("mouseleave", function DivisionSummaryComponent_div_12_Template_div_mouseleave_0_listener($event) {
      const div_r5 = i0.\u0275\u0275restoreView(_r4).$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(div_r5.active_cycle_count > 0 && ctx_r1.highlightRow($event, false));
    })("click", function DivisionSummaryComponent_div_12_Template_div_click_0_listener() {
      const div_r5 = i0.\u0275\u0275restoreView(_r4).$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(div_r5.active_cycle_count > 0 && ctx_r1.drillDown(div_r5.division_id));
    });
    i0.\u0275\u0275elementStart(1, "span");
    i0.\u0275\u0275template(2, DivisionSummaryComponent_div_12_span_2_Template, 2, 1, "span", 24);
    i0.\u0275\u0275elementStart(3, "span");
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(5, "span", 25);
    i0.\u0275\u0275text(6);
    i0.\u0275\u0275template(7, DivisionSummaryComponent_div_12_span_7_Template, 2, 0, "span", 26);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const div_r5 = ctx.$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275styleProp("padding-left", ctx_r1.indentPx(div_r5))("cursor", div_r5.active_cycle_count > 0 ? "pointer" : "default");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("padding-left", ctx_r1.indentPx(div_r5));
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", div_r5.division_level > 1);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("font-weight", div_r5.division_level === 1 ? "600" : "400")("color", div_r5.active_cycle_count > 0 ? "var(--triarq-color-text-primary)" : "var(--triarq-color-text-secondary)");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", div_r5.division_name, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("color", div_r5.active_cycle_count > 0 ? "var(--triarq-color-primary)" : "var(--triarq-color-text-secondary)");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", div_r5.active_cycle_count > 0 ? div_r5.active_cycle_count : "\u2014", " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", div_r5.active_cycle_count > 0);
  }
}
function DivisionSummaryComponent_div_13_span_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1, ' Try unchecking "Display only my Divisions." ');
    i0.\u0275\u0275elementEnd();
  }
}
function DivisionSummaryComponent_div_13_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 29);
    i0.\u0275\u0275text(1, " No Divisions found. ");
    i0.\u0275\u0275template(2, DivisionSummaryComponent_div_13_span_2_Template, 2, 0, "span", 6);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngIf", !ctx_r1.isPrivileged && ctx_r1.showMyDivisionsOnly);
  }
}
function DivisionSummaryComponent_div_14_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 30)(1, "span");
    i0.\u0275\u0275text(2, "All divisions");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "span", 25);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275textInterpolate(ctx_r1.totalCycles);
  }
}
var SCREEN_KEY = SCREEN_KEYS.DELIVERY_DIVISIONS;
var DivisionSummaryComponent = class _DivisionSummaryComponent {
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
    this.divisionSummaries = [];
    this.sortCol = "division_name";
    this.sortDir = "asc";
    this.skeletonRows = [1, 2, 3, 4, 5];
    this.currentUserId = "";
    this.profileSub = new Subscription();
  }
  ngOnInit() {
    this.profileSub.add(this.profile.profile$.pipe(filter((p) => p !== null), take(1)).subscribe((profile) => {
      this.currentUserId = profile.id ?? "";
      const saved = this.screenState.restore(SCREEN_KEY, this.currentUserId);
      if (saved) {
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
          this.divisionSummaries = res.data.division_summaries;
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
  // Item 4: sort controls (siblings within hierarchy — preserves parent-before-children order)
  setSort(col) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
    } else {
      this.sortCol = col;
      this.sortDir = col === "division_name" ? "asc" : "desc";
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
      sortCol: this.sortCol,
      sortDir: this.sortDir
    });
  }
  drillDown(divisionId) {
    this.router.navigate(["/delivery/cycles"], { queryParams: { division_id: divisionId } });
  }
  // D-176: flat indented list in tree order (parent before children, siblings alphabetical)
  get sortedDivisions() {
    const byParent = /* @__PURE__ */ new Map();
    for (const div of this.divisionSummaries) {
      const key = div.parent_division_id;
      if (!byParent.has(key)) {
        byParent.set(key, []);
      }
      byParent.get(key).push(div);
    }
    const result = [];
    const dir = this.sortDir === "asc" ? 1 : -1;
    const visit = (parentId) => {
      const children = (byParent.get(parentId) ?? []).slice().sort((a, b) => {
        if (this.sortCol === "active_cycle_count") {
          return dir * (a.active_cycle_count - b.active_cycle_count);
        }
        return dir * a.division_name.localeCompare(b.division_name);
      });
      for (const child of children) {
        result.push(child);
        visit(child.division_id);
      }
    };
    visit(null);
    return result;
  }
  get totalCycles() {
    return this.divisionSummaries.filter((d) => !d.parent_division_id).reduce((s, d) => s + d.active_cycle_count, 0);
  }
  indentPx(div) {
    return `${(div.division_level - 1) * 20}px`;
  }
  treePrefix(level) {
    return level === 2 ? "\u2514\u2500" : "  \u2514\u2500";
  }
  highlightRow(event, on) {
    const el = event.currentTarget;
    el.style.background = on ? "var(--triarq-color-background-subtle)" : "";
  }
  static {
    this.\u0275fac = function DivisionSummaryComponent_Factory(t) {
      return new (t || _DivisionSummaryComponent)(i0.\u0275\u0275directiveInject(DeliveryService), i0.\u0275\u0275directiveInject(McpService), i0.\u0275\u0275directiveInject(UserProfileService), i0.\u0275\u0275directiveInject(ScreenStateService), i0.\u0275\u0275directiveInject(i5.Router), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _DivisionSummaryComponent, selectors: [["app-division-summary"]], standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 15, vars: 7, consts: [[2, "max-width", "700px", "margin", "var(--triarq-space-2xl) auto", "padding", "0 var(--triarq-space-md)"], [2, "margin-bottom", "var(--triarq-space-md)"], ["routerLink", "/delivery", 2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)", "text-decoration", "none"], [2, "margin", "8px 0 4px 0"], [2, "margin", "0", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], ["style", "display:flex;align-items:center;gap:8px;\n                    font-size:var(--triarq-text-small);\n                    color:var(--triarq-color-text-secondary);\n                    margin-bottom:var(--triarq-space-md);cursor:pointer;", 4, "ngIf"], [4, "ngIf"], ["style", "padding:var(--triarq-space-md);max-width:560px;", 4, "ngIf"], ["style", "display:grid;grid-template-columns:1fr 120px;\n                  gap:var(--triarq-space-sm);\n                  padding:var(--triarq-space-xs) var(--triarq-space-sm);\n                  font-size:var(--triarq-text-small);font-weight:500;\n                  color:var(--triarq-color-text-secondary);\n                  border-bottom:2px solid var(--triarq-color-border);", 4, "ngIf"], ["style", "padding:var(--triarq-space-xs) var(--triarq-space-sm);", 3, "paddingLeft", "cursor", "mouseenter", "mouseleave", "click", 4, "ngFor", "ngForOf"], ["style", "text-align:center;padding:var(--triarq-space-xl);\n                  color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);", 4, "ngIf"], ["style", "display:grid;grid-template-columns:1fr 120px;\n                  gap:var(--triarq-space-sm);\n                  padding:var(--triarq-space-xs) var(--triarq-space-sm);\n                  font-size:var(--triarq-text-small);font-weight:600;\n                  border-top:2px solid var(--triarq-color-border);\n                  color:var(--triarq-color-text-primary);", 4, "ngIf"], [2, "display", "flex", "align-items", "center", "gap", "8px", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "margin-bottom", "var(--triarq-space-md)", "cursor", "pointer"], ["type", "checkbox", 3, "ngModelChange", "ngModel"], ["style", "display:grid;grid-template-columns:3fr 1fr;\n                    gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);\n                    border-bottom:1px solid var(--triarq-color-border);align-items:center;", 4, "ngFor", "ngForOf"], [2, "display", "grid", "grid-template-columns", "3fr 1fr", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-sm)", "border-bottom", "1px solid var(--triarq-color-border)", "align-items", "center"], ["animated", "", 2, "height", "16px", "border-radius", "4px"], [2, "padding", "var(--triarq-space-md)", "max-width", "560px"], [2, "color", "var(--triarq-color-error)", "font-weight", "500", "margin-bottom", "4px"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], [2, "display", "grid", "grid-template-columns", "1fr 120px", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "font-size", "var(--triarq-text-small)", "font-weight", "500", "color", "var(--triarq-color-text-secondary)", "border-bottom", "2px solid var(--triarq-color-border)"], [2, "cursor", "pointer", "user-select", "none", 3, "click"], [2, "text-align", "right", "cursor", "pointer", "user-select", "none", 3, "click"], [2, "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", 3, "mouseenter", "mouseleave", "click"], ["style", "color:var(--triarq-color-text-secondary);margin-right:4px;", 4, "ngIf"], [2, "text-align", "right"], ["style", "margin-left:4px;color:var(--triarq-color-text-secondary);", 4, "ngIf"], [2, "color", "var(--triarq-color-text-secondary)", "margin-right", "4px"], [2, "margin-left", "4px", "color", "var(--triarq-color-text-secondary)"], [2, "text-align", "center", "padding", "var(--triarq-space-xl)", "color", "var(--triarq-color-text-secondary)", "font-size", "var(--triarq-text-small)"], [2, "display", "grid", "grid-template-columns", "1fr 120px", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "font-size", "var(--triarq-text-small)", "font-weight", "600", "border-top", "2px solid var(--triarq-color-border)", "color", "var(--triarq-color-text-primary)"]], template: function DivisionSummaryComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "a", 2);
        i0.\u0275\u0275text(3, " \u2190 Delivery Cycle Tracking ");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(4, "h3", 3);
        i0.\u0275\u0275text(5, "Division Summary");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(6, "p", 4);
        i0.\u0275\u0275text(7, " Active delivery cycle count by Division, shown in hierarchy order. Click a Division to see all its cycles. ");
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275template(8, DivisionSummaryComponent_label_8_Template, 3, 1, "label", 5)(9, DivisionSummaryComponent_div_9_Template, 2, 1, "div", 6)(10, DivisionSummaryComponent_div_10_Template, 5, 1, "div", 7)(11, DivisionSummaryComponent_div_11_Template, 5, 2, "div", 8)(12, DivisionSummaryComponent_div_12_Template, 8, 16, "div", 9)(13, DivisionSummaryComponent_div_13_Template, 3, 1, "div", 10)(14, DivisionSummaryComponent_div_14_Template, 5, 1, "div", 11);
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
        i0.\u0275\u0275property("ngIf", !ctx.loading && !ctx.loadError && ctx.sortedDivisions.length > 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngForOf", ctx.sortedDivisions);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && !ctx.loadError && ctx.sortedDivisions.length === 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && !ctx.loadError && ctx.sortedDivisions.length > 0);
      }
    }, dependencies: [CommonModule, i6.NgForOf, i6.NgIf, RouterModule, i5.RouterLink, FormsModule, i7.CheckboxControlValueAccessor, i7.NgControlStatus, i7.NgModel, IonicModule, IonSkeletonText, RouterLinkWithHrefDelegateDirective], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(DivisionSummaryComponent, { className: "DivisionSummaryComponent", filePath: "src\\app\\features\\delivery\\division-summary\\division-summary.component.ts", lineNumber: 174 });
})();
export {
  DivisionSummaryComponent
};
//# sourceMappingURL=division-summary.component-MLQBDQPK.js.map
