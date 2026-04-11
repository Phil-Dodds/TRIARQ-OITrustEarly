import {
  LoadingOverlayComponent
} from "./chunk-CPG53S23.js";
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
import "./chunk-DSWO3WHD.js";

// src/app/features/delivery/workstream-admin/workstream-admin.component.ts
import { Component, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ReactiveFormsModule, Validators } from "@angular/forms";
import * as i0 from "@angular/core";
import * as i3 from "@angular/forms";
import * as i4 from "@angular/common";
import * as i5 from "@angular/router";
var _c0 = () => ["active", "inactive", "all"];
var _c1 = () => ["/delivery"];
var _c2 = (a0) => ({ workstream_id: a0 });
function WorkstreamAdminComponent_div_9_div_13_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 32);
    i0.\u0275\u0275text(1, " Workstream Name is required. ");
    i0.\u0275\u0275elementEnd();
  }
}
function WorkstreamAdminComponent_div_9_option_20_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "option", 33);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const d_r3 = ctx.$implicit;
    i0.\u0275\u0275property("value", d_r3.id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(d_r3.division_name);
  }
}
function WorkstreamAdminComponent_div_9_div_21_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 32);
    i0.\u0275\u0275text(1, " Home Division is required. ");
    i0.\u0275\u0275elementEnd();
  }
}
function WorkstreamAdminComponent_div_9_option_28_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "option", 33);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const u_r4 = ctx.$implicit;
    i0.\u0275\u0275property("value", u_r4.id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", u_r4.display_name, " ");
  }
}
function WorkstreamAdminComponent_div_9_div_29_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 32);
    i0.\u0275\u0275text(1, " Workstream Lead is required. ");
    i0.\u0275\u0275elementEnd();
  }
}
function WorkstreamAdminComponent_div_9_div_30_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 34);
    i0.\u0275\u0275text(1, " No users found. Ensure users have been created in Admin \u2192 Users. ");
    i0.\u0275\u0275elementEnd();
  }
}
function WorkstreamAdminComponent_div_9_ion_spinner_33_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "ion-spinner", 35);
  }
}
function WorkstreamAdminComponent_div_9_div_35_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 36)(1, "span", 37);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "span", 38);
    i0.\u0275\u0275text(4, " Check that the selected Division and Lead are valid. ");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate(ctx_r1.createError);
  }
}
function WorkstreamAdminComponent_div_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 13);
    i0.\u0275\u0275element(1, "app-loading-overlay", 14);
    i0.\u0275\u0275elementStart(2, "div", 15)(3, "h4", 16);
    i0.\u0275\u0275text(4, "New Workstream");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "p", 17);
    i0.\u0275\u0275text(6, " The Workstream Lead is accountable for gate reviews on cycles within this Workstream. The Home Division scopes which users can see cycles assigned here. ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(7, "form", 18);
    i0.\u0275\u0275listener("ngSubmit", function WorkstreamAdminComponent_div_9_Template_form_ngSubmit_7_listener() {
      i0.\u0275\u0275restoreView(_r1);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.submitCreate());
    });
    i0.\u0275\u0275elementStart(8, "div", 19)(9, "div")(10, "label", 20);
    i0.\u0275\u0275text(11, " Workstream Name * ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(12, "input", 21);
    i0.\u0275\u0275template(13, WorkstreamAdminComponent_div_9_div_13_Template, 2, 0, "div", 22);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(14, "div")(15, "label", 20);
    i0.\u0275\u0275text(16, " Home Division * ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(17, "select", 23)(18, "option", 24);
    i0.\u0275\u0275text(19, "\u2014 Select Division \u2014");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(20, WorkstreamAdminComponent_div_9_option_20_Template, 2, 2, "option", 25);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(21, WorkstreamAdminComponent_div_9_div_21_Template, 2, 0, "div", 22);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(22, "div")(23, "label", 20);
    i0.\u0275\u0275text(24, " Workstream Lead * ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(25, "select", 26)(26, "option", 24);
    i0.\u0275\u0275text(27, "\u2014 Select Lead \u2014");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(28, WorkstreamAdminComponent_div_9_option_28_Template, 2, 2, "option", 25);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(29, WorkstreamAdminComponent_div_9_div_29_Template, 2, 0, "div", 22)(30, WorkstreamAdminComponent_div_9_div_30_Template, 2, 0, "div", 27);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(31, "div", 28)(32, "button", 29);
    i0.\u0275\u0275template(33, WorkstreamAdminComponent_div_9_ion_spinner_33_Template, 1, 0, "ion-spinner", 30);
    i0.\u0275\u0275text(34);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(35, WorkstreamAdminComponent_div_9_div_35_Template, 5, 1, "div", 31);
    i0.\u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_5_0;
    let tmp_7_0;
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("visible", ctx_r1.creating);
    i0.\u0275\u0275advance(6);
    i0.\u0275\u0275property("formGroup", ctx_r1.createForm);
    i0.\u0275\u0275advance(6);
    i0.\u0275\u0275property("ngIf", ((tmp_3_0 = ctx_r1.createForm.get("workstream_name")) == null ? null : tmp_3_0.invalid) && ((tmp_3_0 = ctx_r1.createForm.get("workstream_name")) == null ? null : tmp_3_0.touched));
    i0.\u0275\u0275advance(7);
    i0.\u0275\u0275property("ngForOf", ctx_r1.divisions);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ((tmp_5_0 = ctx_r1.createForm.get("home_division_id")) == null ? null : tmp_5_0.invalid) && ((tmp_5_0 = ctx_r1.createForm.get("home_division_id")) == null ? null : tmp_5_0.touched));
    i0.\u0275\u0275advance(7);
    i0.\u0275\u0275property("ngForOf", ctx_r1.users);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ((tmp_7_0 = ctx_r1.createForm.get("workstream_lead_user_id")) == null ? null : tmp_7_0.invalid) && ((tmp_7_0 = ctx_r1.createForm.get("workstream_lead_user_id")) == null ? null : tmp_7_0.touched));
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.users.length === 0 && !ctx_r1.loadingUsers);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("disabled", ctx_r1.createForm.invalid || ctx_r1.creating);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.creating);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.creating ? "Creating\u2026" : "Create Workstream", " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.createError);
  }
}
function WorkstreamAdminComponent_div_10_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 40);
    i0.\u0275\u0275element(1, "ion-skeleton-text", 41)(2, "ion-skeleton-text", 41)(3, "ion-skeleton-text", 41)(4, "ion-skeleton-text", 41)(5, "ion-skeleton-text", 41)(6, "ion-skeleton-text", 41);
    i0.\u0275\u0275elementEnd();
  }
}
function WorkstreamAdminComponent_div_10_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div");
    i0.\u0275\u0275template(1, WorkstreamAdminComponent_div_10_div_1_Template, 7, 0, "div", 39);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r1.skeletonRows);
  }
}
function WorkstreamAdminComponent_div_11_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 42)(1, "div", 43);
    i0.\u0275\u0275text(2, " Workstreams could not load. ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 44);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.loadError, " ");
  }
}
function WorkstreamAdminComponent_div_12_button_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "button", 48);
    i0.\u0275\u0275listener("click", function WorkstreamAdminComponent_div_12_button_1_Template_button_click_0_listener() {
      const f_r6 = i0.\u0275\u0275restoreView(_r5).$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.activeFilter = f_r6);
    });
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275pipe(2, "titlecase");
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const f_r6 = ctx.$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275styleProp("font-weight", ctx_r1.activeFilter === f_r6 ? "600" : "400")("color", ctx_r1.activeFilter === f_r6 ? "var(--triarq-color-primary)" : "var(--triarq-color-text-secondary)")("border-color", ctx_r1.activeFilter === f_r6 ? "var(--triarq-color-primary)" : "var(--triarq-color-border)");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", i0.\u0275\u0275pipeBind1(2, 7, f_r6), " ");
  }
}
function WorkstreamAdminComponent_div_12_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 45);
    i0.\u0275\u0275template(1, WorkstreamAdminComponent_div_12_button_1_Template, 3, 9, "button", 46);
    i0.\u0275\u0275elementStart(2, "span", 47);
    i0.\u0275\u0275text(3);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", i0.\u0275\u0275pureFunction0(3, _c0));
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate2(" ", ctx_r1.filteredWorkstreams.length, " of ", ctx_r1.workstreams.length, " ");
  }
}
function WorkstreamAdminComponent_div_13_div_15_button_16_ion_spinner_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "ion-spinner", 70);
  }
}
function WorkstreamAdminComponent_div_13_div_15_button_16_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "button", 68);
    i0.\u0275\u0275listener("click", function WorkstreamAdminComponent_div_13_div_15_button_16_Template_button_click_0_listener() {
      i0.\u0275\u0275restoreView(_r9);
      const ws_r8 = i0.\u0275\u0275nextContext().$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.toggleActive(ws_r8));
    });
    i0.\u0275\u0275template(1, WorkstreamAdminComponent_div_13_div_15_button_16_ion_spinner_1_Template, 1, 0, "ion-spinner", 69);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ws_r8 = i0.\u0275\u0275nextContext().$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275property("disabled", ctx_r1.togglingId === ws_r8.workstream_id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.togglingId === ws_r8.workstream_id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.togglingId === ws_r8.workstream_id ? "\u2026" : "Activate", " ");
  }
}
function WorkstreamAdminComponent_div_13_div_15_button_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "button", 71);
    i0.\u0275\u0275listener("click", function WorkstreamAdminComponent_div_13_div_15_button_17_Template_button_click_0_listener() {
      i0.\u0275\u0275restoreView(_r10);
      const ws_r8 = i0.\u0275\u0275nextContext().$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.startDeactivateConfirm(ws_r8));
    });
    i0.\u0275\u0275text(1, " Deactivate ");
    i0.\u0275\u0275elementEnd();
  }
}
function WorkstreamAdminComponent_div_13_div_15_span_18_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "span", 36)(1, "button", 72);
    i0.\u0275\u0275listener("click", function WorkstreamAdminComponent_div_13_div_15_span_18_Template_button_click_1_listener() {
      i0.\u0275\u0275restoreView(_r11);
      const ctx_r1 = i0.\u0275\u0275nextContext(3);
      return i0.\u0275\u0275resetView(ctx_r1.confirmDeactivateWsId = null);
    });
    i0.\u0275\u0275text(2, "Cancel");
    i0.\u0275\u0275elementEnd()();
  }
}
function WorkstreamAdminComponent_div_13_div_15_div_19_span_5_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ws_r8 = i0.\u0275\u0275nextContext(2).$implicit;
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate2(" ", ws_r8.active_cycle_count, " open cycle", ws_r8.active_cycle_count === 1 ? "" : "s", " affected. ");
  }
}
function WorkstreamAdminComponent_div_13_div_15_div_19_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 73)(1, "span", 74);
    i0.\u0275\u0275text(2, "Inactive");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "span", 38);
    i0.\u0275\u0275text(4, " Gate review is blocked for all cycles on this Workstream. ");
    i0.\u0275\u0275template(5, WorkstreamAdminComponent_div_13_div_15_div_19_span_5_Template, 2, 2, "span", 6);
    i0.\u0275\u0275text(6, " Reactivate to restore gate clearance. ");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_4_0;
    const ws_r8 = i0.\u0275\u0275nextContext().$implicit;
    i0.\u0275\u0275advance(5);
    i0.\u0275\u0275property("ngIf", ((tmp_4_0 = ws_r8.active_cycle_count) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : 0) > 0);
  }
}
function WorkstreamAdminComponent_div_13_div_15_div_20_ion_spinner_10_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "ion-spinner", 82);
  }
}
function WorkstreamAdminComponent_div_13_div_15_div_20_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 75)(1, "div", 76);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 77);
    i0.\u0275\u0275text(4, " Gate review will be blocked for ");
    i0.\u0275\u0275elementStart(5, "strong");
    i0.\u0275\u0275text(6);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275text(7, " on this Workstream. They cannot advance past any gate until this Workstream is reactivated. This action is reversible \u2014 use Activate to restore gate clearance. ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(8, "div", 78)(9, "button", 79);
    i0.\u0275\u0275listener("click", function WorkstreamAdminComponent_div_13_div_15_div_20_Template_button_click_9_listener() {
      i0.\u0275\u0275restoreView(_r12);
      const ws_r8 = i0.\u0275\u0275nextContext().$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.toggleActive(ws_r8));
    });
    i0.\u0275\u0275template(10, WorkstreamAdminComponent_div_13_div_15_div_20_ion_spinner_10_Template, 1, 0, "ion-spinner", 80);
    i0.\u0275\u0275text(11);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(12, "button", 81);
    i0.\u0275\u0275listener("click", function WorkstreamAdminComponent_div_13_div_15_div_20_Template_button_click_12_listener() {
      i0.\u0275\u0275restoreView(_r12);
      const ctx_r1 = i0.\u0275\u0275nextContext(3);
      return i0.\u0275\u0275resetView(ctx_r1.confirmDeactivateWsId = null);
    });
    i0.\u0275\u0275text(13, " Cancel ");
    i0.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_5_0;
    const ws_r8 = i0.\u0275\u0275nextContext().$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" Deactivate ", ws_r8.workstream_name, "? ");
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275textInterpolate2("", (tmp_5_0 = ws_r8.active_cycle_count) !== null && tmp_5_0 !== void 0 ? tmp_5_0 : 0, " Delivery Cycle", ((tmp_5_0 = ws_r8.active_cycle_count) !== null && tmp_5_0 !== void 0 ? tmp_5_0 : 0) === 1 ? "" : "s", "");
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275property("disabled", ctx_r1.togglingId === ws_r8.workstream_id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.togglingId === ws_r8.workstream_id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.togglingId === ws_r8.workstream_id ? "Deactivating\u2026" : "Confirm Deactivate", " ");
  }
}
function WorkstreamAdminComponent_div_13_div_15_div_21_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 75)(1, "div", 76);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 59);
    i0.\u0275\u0275text(4, " Open cycles on this Workstream cannot clear gates until it is reactivated. Reactivate this Workstream to restore gate review for its cycles. ");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(3);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate(ctx_r1.toggleWarning);
  }
}
function WorkstreamAdminComponent_div_13_div_15_div_22_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 83)(1, "div", 84);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 85);
    i0.\u0275\u0275text(4, " Check your admin permissions and try again. Contact your System Admin if the problem persists. ");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(3);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate(ctx_r1.toggleError);
  }
}
function WorkstreamAdminComponent_div_13_div_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div")(1, "div", 56);
    i0.\u0275\u0275listener("click", function WorkstreamAdminComponent_div_13_div_15_Template_div_click_1_listener() {
      const ws_r8 = i0.\u0275\u0275restoreView(_r7).$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.selectWorkstream(ws_r8));
    });
    i0.\u0275\u0275elementStart(2, "span", 57);
    i0.\u0275\u0275text(3);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(4, "span", 58);
    i0.\u0275\u0275text(5);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(6, "span", 59);
    i0.\u0275\u0275text(7);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(8, "span", 59);
    i0.\u0275\u0275text(9);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(10, "span", 60);
    i0.\u0275\u0275text(11);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(12, "span")(13, "span", 61);
    i0.\u0275\u0275text(14);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(15, "span", 62);
    i0.\u0275\u0275listener("click", function WorkstreamAdminComponent_div_13_div_15_Template_span_click_15_listener($event) {
      i0.\u0275\u0275restoreView(_r7);
      return i0.\u0275\u0275resetView($event.stopPropagation());
    });
    i0.\u0275\u0275template(16, WorkstreamAdminComponent_div_13_div_15_button_16_Template, 3, 3, "button", 63)(17, WorkstreamAdminComponent_div_13_div_15_button_17_Template, 2, 0, "button", 64)(18, WorkstreamAdminComponent_div_13_div_15_span_18_Template, 3, 0, "span", 31);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275template(19, WorkstreamAdminComponent_div_13_div_15_div_19_Template, 7, 1, "div", 65)(20, WorkstreamAdminComponent_div_13_div_15_div_20_Template, 14, 6, "div", 66)(21, WorkstreamAdminComponent_div_13_div_15_div_21_Template, 5, 1, "div", 66)(22, WorkstreamAdminComponent_div_13_div_15_div_22_Template, 5, 1, "div", 67);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_6_0;
    let tmp_7_0;
    let tmp_8_0;
    const ws_r8 = ctx.$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("background", (ctx_r1.selectedWs == null ? null : ctx_r1.selectedWs.workstream_id) === ws_r8.workstream_id ? "var(--triarq-color-background-subtle)" : ws_r8.active_status ? "transparent" : "#fff8f8");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.wsInitials(ws_r8.workstream_name), " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", ws_r8.workstream_name, " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", (tmp_6_0 = ws_r8.home_division_name) !== null && tmp_6_0 !== void 0 ? tmp_6_0 : ctx_r1.divisionName(ws_r8.home_division_id), " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", (tmp_7_0 = ws_r8.lead_display_name) !== null && tmp_7_0 !== void 0 ? tmp_7_0 : ctx_r1.leadName(ws_r8.workstream_lead_user_id), " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", (tmp_8_0 = ws_r8.active_cycle_count) !== null && tmp_8_0 !== void 0 ? tmp_8_0 : "\u2014", " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275styleProp("background", ws_r8.active_status ? "var(--triarq-color-background-subtle)" : "var(--triarq-color-error-light,#fdecea)")("color", ws_r8.active_status ? "var(--triarq-color-text-secondary)" : "var(--triarq-color-error)");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ws_r8.active_status ? "Active" : "Inactive", " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngIf", !ws_r8.active_status);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ws_r8.active_status && ctx_r1.confirmDeactivateWsId !== ws_r8.workstream_id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ws_r8.active_status && ctx_r1.confirmDeactivateWsId === ws_r8.workstream_id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", !ws_r8.active_status);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.confirmDeactivateWsId === ws_r8.workstream_id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.toggleWarning && ctx_r1.toggleWarningWsId === ws_r8.workstream_id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.toggleError && ctx_r1.toggleErrorWsId === ws_r8.workstream_id);
  }
}
function WorkstreamAdminComponent_div_13_div_16_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 86);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" No ", ctx_r1.activeFilter, " workstreams. Use the filter above to switch views. ");
  }
}
function WorkstreamAdminComponent_div_13_div_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 87)(1, "div", 88)(2, "span", 89);
    i0.\u0275\u0275text(3, "Workstream Details");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(4, "button", 90);
    i0.\u0275\u0275listener("click", function WorkstreamAdminComponent_div_13_div_17_Template_button_click_4_listener() {
      i0.\u0275\u0275restoreView(_r13);
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.selectedWs = null);
    });
    i0.\u0275\u0275text(5, "\u2715");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(6, "div", 91)(7, "div")(8, "div", 92);
    i0.\u0275\u0275text(9, "Name");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(10, "div", 74);
    i0.\u0275\u0275text(11);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(12, "div")(13, "div", 92);
    i0.\u0275\u0275text(14, "Home Division");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(15, "div");
    i0.\u0275\u0275text(16);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(17, "div")(18, "div", 93);
    i0.\u0275\u0275text(19, "Workstream Lead");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(20, "span", 94);
    i0.\u0275\u0275text(21);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(22, "div")(23, "div", 92);
    i0.\u0275\u0275text(24, "Members");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(25, "div", 95);
    i0.\u0275\u0275text(26);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(27, "div")(28, "div", 92);
    i0.\u0275\u0275text(29, "Status");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(30, "span", 61);
    i0.\u0275\u0275text(31);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(32, "div")(33, "div", 92);
    i0.\u0275\u0275text(34, "Active Cycles");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(35, "div");
    i0.\u0275\u0275text(36);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(37, "div", 96)(38, "a", 97);
    i0.\u0275\u0275text(39, " View cycles \u2192 ");
    i0.\u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_4_0;
    let tmp_5_0;
    let tmp_9_0;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(11);
    i0.\u0275\u0275textInterpolate(ctx_r1.selectedWs.workstream_name);
    i0.\u0275\u0275advance(5);
    i0.\u0275\u0275textInterpolate((tmp_3_0 = ctx_r1.selectedWs.home_division_name) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : ctx_r1.divisionName(ctx_r1.selectedWs.home_division_id));
    i0.\u0275\u0275advance(5);
    i0.\u0275\u0275textInterpolate1(" ", (tmp_4_0 = ctx_r1.selectedWs.lead_display_name) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : ctx_r1.leadName(ctx_r1.selectedWs.workstream_lead_user_id), " ");
    i0.\u0275\u0275advance(5);
    i0.\u0275\u0275textInterpolate1(" All members of ", (tmp_5_0 = ctx_r1.selectedWs.home_division_name) !== null && tmp_5_0 !== void 0 ? tmp_5_0 : ctx_r1.divisionName(ctx_r1.selectedWs.home_division_id), " have access. Manage membership in Division Admin. ");
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275styleProp("background", ctx_r1.selectedWs.active_status ? "var(--triarq-color-background-subtle)" : "var(--triarq-color-error-light,#fdecea)")("color", ctx_r1.selectedWs.active_status ? "var(--triarq-color-text-secondary)" : "var(--triarq-color-error)");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.selectedWs.active_status ? "Active" : "Inactive", " ");
    i0.\u0275\u0275advance(5);
    i0.\u0275\u0275textInterpolate((tmp_9_0 = ctx_r1.selectedWs.active_cycle_count) !== null && tmp_9_0 !== void 0 ? tmp_9_0 : "\u2014");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("routerLink", i0.\u0275\u0275pureFunction0(12, _c1))("queryParams", i0.\u0275\u0275pureFunction1(13, _c2, ctx_r1.selectedWs.workstream_id));
  }
}
function WorkstreamAdminComponent_div_13_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 49)(1, "div", 50)(2, "div", 51);
    i0.\u0275\u0275element(3, "span");
    i0.\u0275\u0275elementStart(4, "span");
    i0.\u0275\u0275text(5, "Workstream Name");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(6, "span");
    i0.\u0275\u0275text(7, "Home Division");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(8, "span");
    i0.\u0275\u0275text(9, "Workstream Lead");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(10, "span", 52);
    i0.\u0275\u0275text(11, "Active Cycles");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(12, "span");
    i0.\u0275\u0275text(13, "Status");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(14, "span");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(15, WorkstreamAdminComponent_div_13_div_15_Template, 23, 19, "div", 53)(16, WorkstreamAdminComponent_div_13_div_16_Template, 2, 1, "div", 54);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(17, WorkstreamAdminComponent_div_13_div_17_Template, 40, 15, "div", 55);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(15);
    i0.\u0275\u0275property("ngForOf", ctx_r1.filteredWorkstreams);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.filteredWorkstreams.length === 0 && ctx_r1.workstreams.length > 0);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.selectedWs);
  }
}
function WorkstreamAdminComponent_div_14_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 98)(1, "div", 99);
    i0.\u0275\u0275text(2, " No Workstreams yet ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 100);
    i0.\u0275\u0275text(4, ' Use "+ New Workstream" to create the first one. You need at least one active Workstream before a Delivery Cycle can be created. Workstreams are not deleted \u2014 use Deactivate to suspend a Workstream without removing its cycle history. ');
    i0.\u0275\u0275elementEnd()();
  }
}
var WorkstreamAdminComponent = class _WorkstreamAdminComponent {
  get filteredWorkstreams() {
    if (this.activeFilter === "active") {
      return this.workstreams.filter((w) => w.active_status);
    }
    if (this.activeFilter === "inactive") {
      return this.workstreams.filter((w) => !w.active_status);
    }
    return this.workstreams;
  }
  selectWorkstream(ws) {
    this.selectedWs = this.selectedWs?.workstream_id === ws.workstream_id ? null : ws;
    this.cdr.markForCheck();
  }
  /** P13 / D-183: open inline deactivation confirmation for a specific workstream */
  startDeactivateConfirm(ws) {
    this.confirmDeactivateWsId = ws.workstream_id;
    this.toggleWarning = "";
    this.toggleWarningWsId = null;
    this.toggleError = "";
    this.toggleErrorWsId = null;
    this.cdr.markForCheck();
  }
  constructor(delivery, mcp, fb, cdr) {
    this.delivery = delivery;
    this.mcp = mcp;
    this.fb = fb;
    this.cdr = cdr;
    this.workstreams = [];
    this.divisions = [];
    this.users = [];
    this.loading = false;
    this.loadError = "";
    this.loadingUsers = false;
    this.showCreateForm = false;
    this.creating = false;
    this.createError = "";
    this.togglingId = null;
    this.toggleWarning = "";
    this.toggleWarningWsId = null;
    this.toggleError = "";
    this.toggleErrorWsId = null;
    this.activeFilter = "active";
    this.selectedWs = null;
    this.confirmDeactivateWsId = null;
    this.skeletonRows = [1, 2, 3, 4, 5];
  }
  ngOnInit() {
    this.createForm = this.fb.group({
      workstream_name: ["", Validators.required],
      home_division_id: ["", Validators.required],
      workstream_lead_user_id: ["", Validators.required]
    });
    this.loadDivisions();
    this.loadUsers();
    this.loadWorkstreams();
  }
  loadDivisions() {
    this.mcp.call("division", "list_divisions", {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.divisions = Array.isArray(res.data) ? res.data : [];
          this.cdr.markForCheck();
        }
      },
      error: () => {
      }
    });
  }
  loadUsers() {
    this.loadingUsers = true;
    this.cdr.markForCheck();
    this.mcp.call("division", "list_users", {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.users = Array.isArray(res.data) ? res.data : [];
        }
        this.loadingUsers = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingUsers = false;
        this.cdr.markForCheck();
      }
    });
  }
  loadWorkstreams() {
    this.loading = true;
    this.loadError = "";
    this.cdr.markForCheck();
    this.delivery.listWorkstreams().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.workstreams = Array.isArray(res.data) ? res.data : [];
        } else {
          this.loadError = res.error ?? "Workstreams could not be loaded.";
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadError = err?.error ?? "Unable to reach the server. Check your connection and try again.";
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    this.createError = "";
    if (this.showCreateForm) {
      this.createForm.reset();
    }
    this.cdr.markForCheck();
  }
  submitCreate() {
    if (this.createForm.invalid) {
      return;
    }
    this.creating = true;
    this.createError = "";
    this.cdr.markForCheck();
    this.delivery.createWorkstream({
      workstream_name: this.createForm.value.workstream_name,
      home_division_id: this.createForm.value.home_division_id,
      workstream_lead_user_id: this.createForm.value.workstream_lead_user_id
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showCreateForm = false;
          this.createForm.reset();
          this.loadWorkstreams();
        } else {
          this.createError = res.error ?? "Create failed.";
        }
        this.creating = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.createError = err.error ?? "Create failed. Check permissions and try again.";
        this.creating = false;
        this.cdr.markForCheck();
      }
    });
  }
  toggleActive(ws) {
    this.togglingId = ws.workstream_id;
    this.toggleWarning = "";
    this.toggleWarningWsId = null;
    this.toggleError = "";
    this.toggleErrorWsId = null;
    this.confirmDeactivateWsId = null;
    this.cdr.markForCheck();
    this.delivery.updateWorkstreamActiveStatus({
      workstream_id: ws.workstream_id,
      active_status: !ws.active_status
    }).subscribe({
      next: (res) => {
        if (res.success) {
          if (res.message) {
            this.toggleWarning = res.message;
            this.toggleWarningWsId = ws.workstream_id;
          }
          this.loadWorkstreams();
        } else {
          this.toggleError = res.error ?? "Status change failed.";
          this.toggleErrorWsId = ws.workstream_id;
        }
        this.togglingId = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toggleError = err.error ?? "Status change failed. Check permissions and try again.";
        this.toggleErrorWsId = ws.workstream_id;
        this.togglingId = null;
        this.cdr.markForCheck();
      }
    });
  }
  divisionName(divisionId) {
    return this.divisions.find((d) => d.id === divisionId)?.division_name ?? divisionId;
  }
  leadName(userId) {
    return this.users.find((u) => u.id === userId)?.display_name ?? userId;
  }
  /** D-181: initials avatar from workstream name — first letter of first two words */
  wsInitials(name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  }
  static {
    this.\u0275fac = function WorkstreamAdminComponent_Factory(t) {
      return new (t || _WorkstreamAdminComponent)(i0.\u0275\u0275directiveInject(DeliveryService), i0.\u0275\u0275directiveInject(McpService), i0.\u0275\u0275directiveInject(i3.FormBuilder), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _WorkstreamAdminComponent, selectors: [["app-workstream-admin"]], standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 18, vars: 7, consts: [[1, "oi-card", 2, "max-width", "960px", "margin", "var(--triarq-space-2xl) auto"], [2, "display", "flex", "align-items", "flex-start", "justify-content", "space-between", "margin-bottom", "var(--triarq-space-md)", "gap", "var(--triarq-space-md)"], [2, "margin", "0 0 4px 0"], [2, "margin", "0", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "max-width", "560px"], [1, "oi-btn-primary", 2, "font-size", "var(--triarq-text-small)", "white-space", "nowrap", "flex-shrink", "0", 3, "click"], ["style", "position:relative;", 4, "ngIf"], [4, "ngIf"], ["style", "padding:var(--triarq-space-md);max-width:600px;", 4, "ngIf"], ["style", "display:flex;gap:4px;margin-bottom:var(--triarq-space-sm);", 4, "ngIf"], ["style", "display:flex;gap:var(--triarq-space-md);", 4, "ngIf"], ["style", "padding:var(--triarq-space-xl) 0;text-align:center;", 4, "ngIf"], [2, "margin-top", "var(--triarq-space-lg)", "padding-top", "var(--triarq-space-md)", "border-top", "1px solid var(--triarq-color-border)"], ["routerLink", "/delivery", 2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)"], [2, "position", "relative"], ["message", "Creating Workstream\u2026", 3, "visible"], [2, "background", "var(--triarq-color-background-subtle)", "border-radius", "8px", "padding", "var(--triarq-space-md)", "margin-bottom", "var(--triarq-space-md)"], [2, "margin", "0 0 4px 0", "font-size", "var(--triarq-text-body)"], [2, "margin", "0 0 var(--triarq-space-sm) 0", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], [3, "ngSubmit", "formGroup"], [2, "display", "grid", "gap", "var(--triarq-space-sm)", "grid-template-columns", "2fr 1fr 1fr"], [2, "display", "block", "font-size", "var(--triarq-text-small)", "margin-bottom", "4px"], ["formControlName", "workstream_name", "placeholder", "e.g. Clinical Operations Delivery", 1, "oi-input"], ["style", "color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;", 4, "ngIf"], ["formControlName", "home_division_id", 1, "oi-input"], ["value", ""], [3, "value", 4, "ngFor", "ngForOf"], ["formControlName", "workstream_lead_user_id", 1, "oi-input"], ["style", "color:var(--triarq-color-sunray,#f5a623);font-size:var(--triarq-text-small);margin-top:2px;", 4, "ngIf"], [2, "margin-top", "var(--triarq-space-sm)", "display", "flex", "gap", "var(--triarq-space-sm)", "align-items", "center"], ["type", "submit", 1, "oi-btn-primary", 3, "disabled"], ["name", "crescent", "style", "width:16px;height:16px;vertical-align:middle;margin-right:6px;", 4, "ngIf"], ["style", "font-size:var(--triarq-text-small);", 4, "ngIf"], [2, "color", "var(--triarq-color-error)", "font-size", "var(--triarq-text-small)", "margin-top", "2px"], [3, "value"], [2, "color", "var(--triarq-color-sunray,#f5a623)", "font-size", "var(--triarq-text-small)", "margin-top", "2px"], ["name", "crescent", 2, "width", "16px", "height", "16px", "vertical-align", "middle", "margin-right", "6px"], [2, "font-size", "var(--triarq-text-small)"], [2, "color", "var(--triarq-color-error)", "font-weight", "500"], [2, "color", "var(--triarq-color-text-secondary)", "margin-left", "6px"], ["style", "display:grid;grid-template-columns:3fr 2fr 2fr 80px 1fr 100px;\n                    gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);\n                    border-bottom:1px solid var(--triarq-color-border);align-items:center;", 4, "ngFor", "ngForOf"], [2, "display", "grid", "grid-template-columns", "3fr 2fr 2fr 80px 1fr 100px", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-sm)", "border-bottom", "1px solid var(--triarq-color-border)", "align-items", "center"], ["animated", "", 2, "height", "16px", "border-radius", "4px"], [2, "padding", "var(--triarq-space-md)", "max-width", "600px"], [2, "color", "var(--triarq-color-error)", "font-weight", "500", "margin-bottom", "4px"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], [2, "display", "flex", "gap", "4px", "margin-bottom", "var(--triarq-space-sm)"], ["style", "font-size:var(--triarq-text-small);background:none;\n                       border:1px solid;border-radius:5px;padding:3px 10px;cursor:pointer;", 3, "fontWeight", "color", "borderColor", "click", 4, "ngFor", "ngForOf"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "margin-left", "8px", "align-self", "center"], [2, "font-size", "var(--triarq-text-small)", "background", "none", "border", "1px solid", "border-radius", "5px", "padding", "3px 10px", "cursor", "pointer", 3, "click"], [2, "display", "flex", "gap", "var(--triarq-space-md)"], [2, "flex", "1", "min-width", "0"], [2, "display", "grid", "grid-template-columns", "32px 3fr 2fr 2fr 80px 1fr 100px", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "font-size", "var(--triarq-text-small)", "font-weight", "500", "color", "var(--triarq-color-text-secondary)", "border-bottom", "2px solid var(--triarq-color-border)"], [2, "text-align", "center"], [4, "ngFor", "ngForOf"], ["style", "padding:var(--triarq-space-md);font-size:var(--triarq-text-small);\n                      color:var(--triarq-color-text-secondary);", 4, "ngIf"], ["style", "width:260px;flex-shrink:0;border-left:1px solid var(--triarq-color-border);\n                    padding-left:var(--triarq-space-md);", 4, "ngIf"], [2, "display", "grid", "grid-template-columns", "32px 3fr 2fr 2fr 80px 1fr 100px", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-sm)", "border-bottom", "1px solid var(--triarq-color-border)", "font-size", "var(--triarq-text-small)", "align-items", "center", "cursor", "pointer", 3, "click"], [2, "display", "flex", "align-items", "center", "justify-content", "center", "width", "28px", "height", "28px", "border-radius", "50%", "background", "var(--triarq-color-primary,#257099)", "color", "#fff", "font-size", "10px", "font-weight", "600", "flex-shrink", "0"], [2, "font-weight", "500", "color", "var(--triarq-color-text-primary)"], [2, "color", "var(--triarq-color-text-secondary)"], [2, "text-align", "center", "color", "var(--triarq-color-text-secondary)"], [1, "oi-pill"], [2, "display", "flex", "justify-content", "flex-end", 3, "click"], ["style", "font-size:var(--triarq-text-small);color:var(--triarq-color-primary);\n                         background:none;border:none;cursor:pointer;padding:0;\n                         display:flex;align-items:center;gap:4px;", 3, "disabled", "click", 4, "ngIf"], ["style", "font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);\n                         background:none;border:none;cursor:pointer;padding:0;", 3, "click", 4, "ngIf"], ["style", "background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);\n                        padding:var(--triarq-space-xs) var(--triarq-space-md);\n                        font-size:var(--triarq-text-small);", 4, "ngIf"], ["style", "background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);\n                        padding:var(--triarq-space-sm) var(--triarq-space-md);\n                        font-size:var(--triarq-text-small);", 4, "ngIf"], ["style", "background:var(--triarq-color-error-light,#fdecea);\n                        border-left:4px solid var(--triarq-color-error);\n                        padding:var(--triarq-space-sm) var(--triarq-space-md);\n                        font-size:var(--triarq-text-small);", 4, "ngIf"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)", "background", "none", "border", "none", "cursor", "pointer", "padding", "0", "display", "flex", "align-items", "center", "gap", "4px", 3, "click", "disabled"], ["name", "crescent", "style", "width:14px;height:14px;vertical-align:middle;", 4, "ngIf"], ["name", "crescent", 2, "width", "14px", "height", "14px", "vertical-align", "middle"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "background", "none", "border", "none", "cursor", "pointer", "padding", "0", 3, "click"], [2, "background", "none", "border", "none", "cursor", "pointer", "color", "var(--triarq-color-text-secondary)", "font-size", "10px", "margin-right", "4px", 3, "click"], [2, "background", "#fff8e1", "border-left", "4px solid var(--triarq-color-sunray,#f5a623)", "padding", "var(--triarq-space-xs) var(--triarq-space-md)", "font-size", "var(--triarq-text-small)"], [2, "font-weight", "500"], [2, "background", "#fff8e1", "border-left", "4px solid var(--triarq-color-sunray,#f5a623)", "padding", "var(--triarq-space-sm) var(--triarq-space-md)", "font-size", "var(--triarq-text-small)"], [2, "font-weight", "500", "margin-bottom", "4px"], [2, "color", "var(--triarq-color-text-secondary)", "margin-bottom", "var(--triarq-space-sm)"], [2, "display", "flex", "gap", "var(--triarq-space-sm)", "align-items", "center"], [1, "oi-btn-primary", 2, "font-size", "var(--triarq-text-small)", "padding", "4px 14px", "display", "flex", "align-items", "center", "gap", "4px", "background", "var(--triarq-color-error)", 3, "click", "disabled"], ["name", "crescent", "style", "width:14px;height:14px;", 4, "ngIf"], [2, "background", "none", "border", "none", "cursor", "pointer", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", 3, "click"], ["name", "crescent", 2, "width", "14px", "height", "14px"], [2, "background", "var(--triarq-color-error-light,#fdecea)", "border-left", "4px solid var(--triarq-color-error)", "padding", "var(--triarq-space-sm) var(--triarq-space-md)", "font-size", "var(--triarq-text-small)"], [2, "font-weight", "500", "color", "var(--triarq-color-error)"], [2, "color", "var(--triarq-color-text-secondary)", "margin-top", "4px"], [2, "padding", "var(--triarq-space-md)", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], [2, "width", "260px", "flex-shrink", "0", "border-left", "1px solid var(--triarq-color-border)", "padding-left", "var(--triarq-space-md)"], [2, "display", "flex", "align-items", "center", "justify-content", "space-between", "margin-bottom", "var(--triarq-space-sm)"], [2, "font-weight", "500", "font-size", "var(--triarq-text-small)"], [2, "background", "none", "border", "none", "cursor", "pointer", "color", "var(--triarq-color-text-secondary)", "font-size", "14px", 3, "click"], [2, "font-size", "var(--triarq-text-small)", "display", "grid", "gap", "var(--triarq-space-xs)"], [2, "color", "var(--triarq-color-text-secondary)", "font-size", "10px", "margin-bottom", "2px"], [2, "color", "var(--triarq-color-text-secondary)", "font-size", "10px", "margin-bottom", "4px"], [1, "oi-pill", 2, "font-size", "11px", "cursor", "default", "background", "var(--triarq-color-fog,#f0f4f8)", "color", "var(--triarq-color-text-primary)"], [2, "font-size", "10px", "color", "var(--triarq-color-text-secondary)", "font-style", "italic"], [2, "margin-top", "var(--triarq-space-xs)"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)", "text-decoration", "none", 3, "routerLink", "queryParams"], [2, "padding", "var(--triarq-space-xl) 0", "text-align", "center"], [2, "font-weight", "500", "color", "var(--triarq-color-text-primary)", "margin-bottom", "8px"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "max-width", "440px", "margin", "0 auto"]], template: function WorkstreamAdminComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div")(3, "h3", 2);
        i0.\u0275\u0275text(4, "Delivery Workstream Registry");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(5, "p", 3);
        i0.\u0275\u0275text(6, " A Workstream is a persistent delivery team or domain \u2014 the organising unit that Delivery Cycles belong to. Each cycle is assigned to exactly one Workstream. Gate clearance is blocked on cycles belonging to an inactive Workstream. Activate a Workstream to re-enable gate review for its cycles. ");
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275elementStart(7, "button", 4);
        i0.\u0275\u0275listener("click", function WorkstreamAdminComponent_Template_button_click_7_listener() {
          return ctx.toggleCreateForm();
        });
        i0.\u0275\u0275text(8);
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275template(9, WorkstreamAdminComponent_div_9_Template, 36, 12, "div", 5)(10, WorkstreamAdminComponent_div_10_Template, 2, 1, "div", 6)(11, WorkstreamAdminComponent_div_11_Template, 5, 1, "div", 7)(12, WorkstreamAdminComponent_div_12_Template, 4, 4, "div", 8)(13, WorkstreamAdminComponent_div_13_Template, 18, 3, "div", 9)(14, WorkstreamAdminComponent_div_14_Template, 5, 0, "div", 10);
        i0.\u0275\u0275elementStart(15, "div", 11)(16, "a", 12);
        i0.\u0275\u0275text(17, " \u2190 Delivery Dashboard ");
        i0.\u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        i0.\u0275\u0275advance(8);
        i0.\u0275\u0275textInterpolate1(" ", ctx.showCreateForm ? "Cancel" : "+ New Workstream", " ");
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.showCreateForm);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.loadError && !ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && ctx.workstreams.length > 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && ctx.workstreams.length > 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && !ctx.loadError && ctx.workstreams.length === 0);
      }
    }, dependencies: [CommonModule, i4.NgForOf, i4.NgIf, i4.TitleCasePipe, RouterModule, i5.RouterLink, ReactiveFormsModule, i3.\u0275NgNoValidate, i3.NgSelectOption, i3.\u0275NgSelectMultipleOption, i3.DefaultValueAccessor, i3.SelectControlValueAccessor, i3.NgControlStatus, i3.NgControlStatusGroup, i3.FormGroupDirective, i3.FormControlName, IonicModule, IonSkeletonText, IonSpinner, RouterLinkWithHrefDelegateDirective, LoadingOverlayComponent], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(WorkstreamAdminComponent, { className: "WorkstreamAdminComponent", filePath: "src\\app\\features\\delivery\\workstream-admin\\workstream-admin.component.ts", lineNumber: 452 });
})();
export {
  WorkstreamAdminComponent
};
//# sourceMappingURL=workstream-admin.component-UDGZ5RWW.js.map
