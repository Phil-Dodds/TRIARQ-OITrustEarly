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

// src/app/features/delivery/workstream-summary/workstream-summary.component.ts
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
function WorkstreamSummaryComponent_label_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "label", 12)(1, "input", 13);
    i0.\u0275\u0275twoWayListener("ngModelChange", function WorkstreamSummaryComponent_label_8_Template_input_ngModelChange_1_listener($event) {
      i0.\u0275\u0275restoreView(_r1);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.showMyDivisionsOnly, $event) || (ctx_r1.showMyDivisionsOnly = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function WorkstreamSummaryComponent_label_8_Template_input_ngModelChange_1_listener() {
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
function WorkstreamSummaryComponent_div_9_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 15);
    i0.\u0275\u0275element(1, "ion-skeleton-text", 16)(2, "ion-skeleton-text", 16)(3, "ion-skeleton-text", 16)(4, "ion-skeleton-text", 16)(5, "ion-skeleton-text", 16)(6, "ion-skeleton-text", 16)(7, "ion-skeleton-text", 16)(8, "ion-skeleton-text", 16)(9, "ion-skeleton-text", 16);
    i0.\u0275\u0275elementEnd();
  }
}
function WorkstreamSummaryComponent_div_9_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div");
    i0.\u0275\u0275template(1, WorkstreamSummaryComponent_div_9_div_1_Template, 10, 0, "div", 14);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r1.skeletonRows);
  }
}
function WorkstreamSummaryComponent_div_10_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 17)(1, "div", 18);
    i0.\u0275\u0275text(2, " Workstream summary could not load. ");
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
function WorkstreamSummaryComponent_div_11_span_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1, ' Try unchecking "Display only my Divisions" to see all accessible Workstreams. ');
    i0.\u0275\u0275elementEnd();
  }
}
function WorkstreamSummaryComponent_div_11_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 20);
    i0.\u0275\u0275text(1, " No active Workstreams found with Delivery Cycles in your Divisions. ");
    i0.\u0275\u0275template(2, WorkstreamSummaryComponent_div_11_span_2_Template, 2, 0, "span", 6);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngIf", !ctx_r1.isPrivileged && ctx_r1.showMyDivisionsOnly);
  }
}
function WorkstreamSummaryComponent_div_12_span_11_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 24);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const gate_r3 = ctx.$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.gateLabel(gate_r3), " ");
  }
}
function WorkstreamSummaryComponent_div_12_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 21)(1, "span");
    i0.\u0275\u0275text(2, "Workstream");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "span", 22);
    i0.\u0275\u0275text(4, "Active Cycles");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "span", 22);
    i0.\u0275\u0275text(6, "Prep");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(7, "span", 22);
    i0.\u0275\u0275text(8, "Build");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(9, "span", 22);
    i0.\u0275\u0275text(10, "Outcome");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(11, WorkstreamSummaryComponent_div_12_span_11_Template, 2, 1, "span", 23);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(11);
    i0.\u0275\u0275property("ngForOf", ctx_r1.gates);
  }
}
function WorkstreamSummaryComponent_div_13_div_3_span_4_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 34);
    i0.\u0275\u0275text(1, " (inactive) ");
    i0.\u0275\u0275elementEnd();
  }
}
function WorkstreamSummaryComponent_div_13_div_3_span_9_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 35);
    i0.\u0275\u0275text(1, "\u26A0");
    i0.\u0275\u0275elementEnd();
  }
}
function WorkstreamSummaryComponent_div_13_div_3_span_12_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 35);
    i0.\u0275\u0275text(1, "\u26A0");
    i0.\u0275\u0275elementEnd();
  }
}
function WorkstreamSummaryComponent_div_13_div_3_span_15_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 35);
    i0.\u0275\u0275text(1, "\u26A0");
    i0.\u0275\u0275elementEnd();
  }
}
function WorkstreamSummaryComponent_div_13_div_3_span_16_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "span", 36);
    i0.\u0275\u0275listener("click", function WorkstreamSummaryComponent_div_13_div_3_span_16_Template_span_click_0_listener() {
      const gate_r7 = i0.\u0275\u0275restoreView(_r6).$implicit;
      const ws_r5 = i0.\u0275\u0275nextContext().$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ws_r5.cycles_by_next_gate[gate_r7] > 0 && ctx_r1.drillDown({ workstream_id: ws_r5.workstream_id, next_gate: gate_r7 }));
    });
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const gate_r7 = ctx.$implicit;
    const ws_r5 = i0.\u0275\u0275nextContext().$implicit;
    i0.\u0275\u0275styleProp("cursor", ws_r5.cycles_by_next_gate[gate_r7] > 0 ? "pointer" : "default")("color", ws_r5.cycles_by_next_gate[gate_r7] > 0 ? "var(--triarq-color-primary)" : "var(--triarq-color-text-secondary)");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ws_r5.cycles_by_next_gate[gate_r7] || "\u2014", " ");
  }
}
function WorkstreamSummaryComponent_div_13_div_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 27)(1, "div")(2, "span", 28);
    i0.\u0275\u0275text(3);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(4, WorkstreamSummaryComponent_div_13_div_3_span_4_Template, 2, 0, "span", 29);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "span", 30);
    i0.\u0275\u0275text(6);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(7, "span", 31);
    i0.\u0275\u0275listener("click", function WorkstreamSummaryComponent_div_13_div_3_Template_span_click_7_listener() {
      const ws_r5 = i0.\u0275\u0275restoreView(_r4).$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.drillDown({ workstream_id: ws_r5.workstream_id }));
    });
    i0.\u0275\u0275text(8);
    i0.\u0275\u0275template(9, WorkstreamSummaryComponent_div_13_div_3_span_9_Template, 2, 0, "span", 32);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(10, "span", 31);
    i0.\u0275\u0275listener("click", function WorkstreamSummaryComponent_div_13_div_3_Template_span_click_10_listener() {
      const ws_r5 = i0.\u0275\u0275restoreView(_r4).$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.drillDown({ workstream_id: ws_r5.workstream_id }));
    });
    i0.\u0275\u0275text(11);
    i0.\u0275\u0275template(12, WorkstreamSummaryComponent_div_13_div_3_span_12_Template, 2, 0, "span", 32);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(13, "span", 31);
    i0.\u0275\u0275listener("click", function WorkstreamSummaryComponent_div_13_div_3_Template_span_click_13_listener() {
      const ws_r5 = i0.\u0275\u0275restoreView(_r4).$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.drillDown({ workstream_id: ws_r5.workstream_id }));
    });
    i0.\u0275\u0275text(14);
    i0.\u0275\u0275template(15, WorkstreamSummaryComponent_div_13_div_3_span_15_Template, 2, 0, "span", 32);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(16, WorkstreamSummaryComponent_div_13_div_3_span_16_Template, 2, 5, "span", 33);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ws_r5 = ctx.$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1(" ", ws_r5.workstream_name, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", !ws_r5.active_status);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", ws_r5.total_active_cycles, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("color", ws_r5.wip_prep_exceeded ? "var(--triarq-color-sunray,#f5a623)" : "inherit")("font-weight", ws_r5.wip_prep_exceeded ? "600" : "400");
    i0.\u0275\u0275property("title", ws_r5.wip_prep_exceeded ? "WIP limit exceeded (>" + ctx_r1.wipLimit + ")" : "");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ws_r5.wip_prep, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ws_r5.wip_prep_exceeded);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("color", ws_r5.wip_build_exceeded ? "var(--triarq-color-sunray,#f5a623)" : "inherit")("font-weight", ws_r5.wip_build_exceeded ? "600" : "400");
    i0.\u0275\u0275property("title", ws_r5.wip_build_exceeded ? "WIP limit exceeded (>" + ctx_r1.wipLimit + ")" : "");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ws_r5.wip_build, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ws_r5.wip_build_exceeded);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("color", ws_r5.wip_outcome_exceeded ? "var(--triarq-color-sunray,#f5a623)" : "inherit")("font-weight", ws_r5.wip_outcome_exceeded ? "600" : "400");
    i0.\u0275\u0275property("title", ws_r5.wip_outcome_exceeded ? "WIP limit exceeded (>" + ctx_r1.wipLimit + ")" : "");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ws_r5.wip_outcome, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ws_r5.wip_outcome_exceeded);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r1.gates);
  }
}
function WorkstreamSummaryComponent_div_13_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 1)(1, "div", 25);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(3, WorkstreamSummaryComponent_div_13_div_3_Template, 17, 25, "div", 26);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const group_r8 = ctx.$implicit;
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", group_r8.divisionName || "\u2014", " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", group_r8.workstreams);
  }
}
function WorkstreamSummaryComponent_div_14_span_11_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 22);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const gate_r9 = ctx.$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.totalByGate[gate_r9] || "\u2014", " ");
  }
}
function WorkstreamSummaryComponent_div_14_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 37)(1, "span");
    i0.\u0275\u0275text(2, "All Workstreams");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "span", 22);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "span", 22);
    i0.\u0275\u0275text(6);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(7, "span", 22);
    i0.\u0275\u0275text(8);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(9, "span", 22);
    i0.\u0275\u0275text(10);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(11, WorkstreamSummaryComponent_div_14_span_11_Template, 2, 1, "span", 38);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275textInterpolate(ctx_r1.totalCycles);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("color", ctx_r1.totalPrep > ctx_r1.wipLimit ? "var(--triarq-color-sunray,#f5a623)" : "inherit");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.totalPrep, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("color", ctx_r1.totalBuild > ctx_r1.wipLimit ? "var(--triarq-color-sunray,#f5a623)" : "inherit");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.totalBuild, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("color", ctx_r1.totalOutcome > ctx_r1.wipLimit ? "var(--triarq-color-sunray,#f5a623)" : "inherit");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.totalOutcome, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r1.gates);
  }
}
var SCREEN_KEY = SCREEN_KEYS.DELIVERY_WORKSTREAMS;
var GATE_LABELS = {
  brief_review: "Brief Review",
  go_to_build: "Go to Build",
  go_to_deploy: "Go to Deploy",
  go_to_release: "Go to Release",
  close_review: "Close Review"
};
var ALL_GATES = [
  "brief_review",
  "go_to_build",
  "go_to_deploy",
  "go_to_release",
  "close_review"
];
var WorkstreamSummaryComponent = class _WorkstreamSummaryComponent {
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
    this.workstreamSummaries = [];
    this.sortCol = "workstream_name";
    this.sortDir = "asc";
    this.gates = ALL_GATES;
    this.wipLimit = 4;
    this.skeletonRows = [1, 2, 3, 4];
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
          this.workstreamSummaries = res.data.workstream_summaries;
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
    if (serverMsg.includes("not found")) {
      return serverMsg;
    }
    return serverMsg;
  }
  onToggleChange() {
    this.loadSummary();
  }
  // Item 4: sort controls (within each Division group)
  setSort(col) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
    } else {
      this.sortCol = col;
      this.sortDir = col === "workstream_name" ? "asc" : "desc";
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
  drillDown(params) {
    const queryParams = {};
    if (params.workstream_id) {
      queryParams["workstream_id"] = params.workstream_id;
    }
    if (params.next_gate) {
      queryParams["next_gate"] = params.next_gate;
    }
    this.router.navigate(["/delivery/cycles"], { queryParams });
  }
  // ── Grouping ───────────────────────────────────────────────────────────────
  get groups() {
    const map = /* @__PURE__ */ new Map();
    for (const ws of this.workstreamSummaries) {
      const key = ws.home_division_name || "(No Division assigned)";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(ws);
    }
    const dir = this.sortDir === "asc" ? 1 : -1;
    return Array.from(map.entries()).map(([divisionName, workstreams]) => ({
      divisionName,
      // Item 4: sort workstreams within each Division group per sortCol/sortDir
      workstreams: workstreams.slice().sort((a, b) => {
        if (this.sortCol === "workstream_name") {
          return dir * a.workstream_name.localeCompare(b.workstream_name);
        }
        return dir * (a.total_active_cycles - b.total_active_cycles);
      })
    })).sort((a, b) => a.divisionName.localeCompare(b.divisionName));
  }
  // ── Totals ─────────────────────────────────────────────────────────────────
  get totalCycles() {
    return this.workstreamSummaries.reduce((s, w) => s + w.total_active_cycles, 0);
  }
  get totalPrep() {
    return this.workstreamSummaries.reduce((s, w) => s + w.wip_prep, 0);
  }
  get totalBuild() {
    return this.workstreamSummaries.reduce((s, w) => s + w.wip_build, 0);
  }
  get totalOutcome() {
    return this.workstreamSummaries.reduce((s, w) => s + w.wip_outcome, 0);
  }
  get totalByGate() {
    const totals = {};
    for (const gate of ALL_GATES) {
      totals[gate] = this.workstreamSummaries.reduce((s, w) => s + (w.cycles_by_next_gate[gate] ?? 0), 0);
    }
    return totals;
  }
  gateLabel(gate) {
    return GATE_LABELS[gate];
  }
  static {
    this.\u0275fac = function WorkstreamSummaryComponent_Factory(t) {
      return new (t || _WorkstreamSummaryComponent)(i0.\u0275\u0275directiveInject(DeliveryService), i0.\u0275\u0275directiveInject(McpService), i0.\u0275\u0275directiveInject(UserProfileService), i0.\u0275\u0275directiveInject(ScreenStateService), i0.\u0275\u0275directiveInject(i5.Router), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _WorkstreamSummaryComponent, selectors: [["app-workstream-summary"]], standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 15, vars: 7, consts: [[2, "max-width", "1100px", "margin", "var(--triarq-space-2xl) auto", "padding", "0 var(--triarq-space-md)"], [2, "margin-bottom", "var(--triarq-space-md)"], ["routerLink", "/delivery", 2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)", "text-decoration", "none"], [2, "margin", "8px 0 4px 0"], [2, "margin", "0", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], ["style", "display:flex;align-items:center;gap:8px;\n                    font-size:var(--triarq-text-small);\n                    color:var(--triarq-color-text-secondary);\n                    margin-bottom:var(--triarq-space-md);cursor:pointer;", 4, "ngIf"], [4, "ngIf"], ["style", "padding:var(--triarq-space-md);max-width:560px;", 4, "ngIf"], ["style", "text-align:center;padding:var(--triarq-space-xl);\n                  color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);", 4, "ngIf"], ["style", "display:grid;grid-template-columns:2fr 60px 80px 80px 80px repeat(5,70px);\n                  gap:var(--triarq-space-xs);\n                  padding:var(--triarq-space-xs) var(--triarq-space-sm);\n                  font-size:var(--triarq-text-small);font-weight:500;\n                  color:var(--triarq-color-text-secondary);\n                  border-bottom:2px solid var(--triarq-color-border);", 4, "ngIf"], ["style", "margin-bottom:var(--triarq-space-md);", 4, "ngFor", "ngForOf"], ["style", "display:grid;grid-template-columns:2fr 60px 80px 80px 80px repeat(5,70px);\n                  gap:var(--triarq-space-xs);\n                  padding:var(--triarq-space-xs) var(--triarq-space-sm);\n                  font-size:var(--triarq-text-small);font-weight:600;\n                  border-top:2px solid var(--triarq-color-border);\n                  color:var(--triarq-color-text-primary);", 4, "ngIf"], [2, "display", "flex", "align-items", "center", "gap", "8px", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "margin-bottom", "var(--triarq-space-md)", "cursor", "pointer"], ["type", "checkbox", 3, "ngModelChange", "ngModel"], ["style", "display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;\n                    gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);\n                    border-bottom:1px solid var(--triarq-color-border);align-items:center;", 4, "ngFor", "ngForOf"], [2, "display", "grid", "grid-template-columns", "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-sm)", "border-bottom", "1px solid var(--triarq-color-border)", "align-items", "center"], ["animated", "", 2, "height", "16px", "border-radius", "4px"], [2, "padding", "var(--triarq-space-md)", "max-width", "560px"], [2, "color", "var(--triarq-color-error)", "font-weight", "500", "margin-bottom", "4px"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], [2, "text-align", "center", "padding", "var(--triarq-space-xl)", "color", "var(--triarq-color-text-secondary)", "font-size", "var(--triarq-text-small)"], [2, "display", "grid", "grid-template-columns", "2fr 60px 80px 80px 80px repeat(5,70px)", "gap", "var(--triarq-space-xs)", "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "font-size", "var(--triarq-text-small)", "font-weight", "500", "color", "var(--triarq-color-text-secondary)", "border-bottom", "2px solid var(--triarq-color-border)"], [2, "text-align", "center"], ["style", "text-align:center;font-size:10px;line-height:1.3;", 4, "ngFor", "ngForOf"], [2, "text-align", "center", "font-size", "10px", "line-height", "1.3"], [2, "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "background", "var(--triarq-color-background-subtle)", "font-size", "var(--triarq-text-small)", "font-weight", "600", "color", "var(--triarq-color-text-secondary)", "border-bottom", "1px solid var(--triarq-color-border)"], ["style", "display:grid;grid-template-columns:2fr 60px 80px 80px 80px repeat(5,70px);\n                    gap:var(--triarq-space-xs);\n                    padding:var(--triarq-space-xs) var(--triarq-space-sm);\n                    border-bottom:1px solid var(--triarq-color-border);\n                    font-size:var(--triarq-text-small);align-items:center;", 4, "ngFor", "ngForOf"], [2, "display", "grid", "grid-template-columns", "2fr 60px 80px 80px 80px repeat(5,70px)", "gap", "var(--triarq-space-xs)", "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "border-bottom", "1px solid var(--triarq-color-border)", "font-size", "var(--triarq-text-small)", "align-items", "center"], [2, "font-weight", "500", "color", "var(--triarq-color-text-primary)"], ["style", "margin-left:6px;font-size:10px;\n                         color:var(--triarq-color-sunray,#f5a623);", 4, "ngIf"], [2, "text-align", "center", "font-weight", "500"], [2, "text-align", "center", "cursor", "pointer", 3, "click", "title"], ["style", "font-size:10px;", 4, "ngIf"], ["style", "text-align:center;", 3, "cursor", "color", "click", 4, "ngFor", "ngForOf"], [2, "margin-left", "6px", "font-size", "10px", "color", "var(--triarq-color-sunray,#f5a623)"], [2, "font-size", "10px"], [2, "text-align", "center", 3, "click"], [2, "display", "grid", "grid-template-columns", "2fr 60px 80px 80px 80px repeat(5,70px)", "gap", "var(--triarq-space-xs)", "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "font-size", "var(--triarq-text-small)", "font-weight", "600", "border-top", "2px solid var(--triarq-color-border)", "color", "var(--triarq-color-text-primary)"], ["style", "text-align:center;", 4, "ngFor", "ngForOf"]], template: function WorkstreamSummaryComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "a", 2);
        i0.\u0275\u0275text(3, " \u2190 Delivery Cycle Tracking ");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(4, "h3", 3);
        i0.\u0275\u0275text(5, "Workstream Summary");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(6, "p", 4);
        i0.\u0275\u0275text(7, " Active Delivery Cycle count and WIP breakdown per Workstream. Prep = Brief/Design/Spec, Build = Build/Validate, Outcome = Pilot/UAT/Release/Outcome. Limit is 4 per category. Click any count to see the matching cycles. ");
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275template(8, WorkstreamSummaryComponent_label_8_Template, 3, 1, "label", 5)(9, WorkstreamSummaryComponent_div_9_Template, 2, 1, "div", 6)(10, WorkstreamSummaryComponent_div_10_Template, 5, 1, "div", 7)(11, WorkstreamSummaryComponent_div_11_Template, 3, 1, "div", 8)(12, WorkstreamSummaryComponent_div_12_Template, 12, 1, "div", 9)(13, WorkstreamSummaryComponent_div_13_Template, 4, 2, "div", 10)(14, WorkstreamSummaryComponent_div_14_Template, 12, 11, "div", 11);
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
        i0.\u0275\u0275property("ngIf", !ctx.loading && !ctx.loadError && ctx.groups.length === 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && ctx.groups.length > 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngForOf", ctx.groups);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && ctx.groups.length > 0);
      }
    }, dependencies: [CommonModule, i6.NgForOf, i6.NgIf, RouterModule, i5.RouterLink, FormsModule, i7.CheckboxControlValueAccessor, i7.NgControlStatus, i7.NgModel, IonicModule, IonSkeletonText, RouterLinkWithHrefDelegateDirective], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(WorkstreamSummaryComponent, { className: "WorkstreamSummaryComponent", filePath: "src\\app\\features\\delivery\\workstream-summary\\workstream-summary.component.ts", lineNumber: 256 });
})();
export {
  WorkstreamSummaryComponent
};
//# sourceMappingURL=workstream-summary.component-U3RSAVRH.js.map
