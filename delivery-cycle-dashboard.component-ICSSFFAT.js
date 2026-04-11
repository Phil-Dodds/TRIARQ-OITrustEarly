import {
  DeliveryCycleDetailComponent,
  StageTrackComponent,
  WorkstreamPickerComponent
} from "./chunk-FCHEB46F.js";
import {
  LoadingOverlayComponent
} from "./chunk-CPG53S23.js";
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
  __async,
  __spreadValues
} from "./chunk-DSWO3WHD.js";

// src/app/features/delivery/dashboard/delivery-cycle-dashboard.component.ts
import { Component, ChangeDetectionStrategy } from "@angular/core";
import { firstValueFrom, filter, take } from "rxjs";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ReactiveFormsModule, Validators } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import * as i0 from "@angular/core";
import * as i4 from "@angular/forms";
import * as i5 from "@angular/router";
import * as i7 from "@angular/common";
function DeliveryCycleDashboardComponent_button_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "button", 31);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_button_11_Template_button_click_0_listener() {
      i0.\u0275\u0275restoreView(_r1);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.toggleCreateForm());
    });
    i0.\u0275\u0275text(1, " + New Cycle ");
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_12_option_17_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "option", 77);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const d_r4 = ctx.$implicit;
    i0.\u0275\u0275property("value", d_r4.id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(d_r4.division_name);
  }
}
function DeliveryCycleDashboardComponent_div_12_div_18_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 78);
    i0.\u0275\u0275text(1, " Division is required. ");
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_12_div_23_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 78);
    i0.\u0275\u0275text(1, " Cycle title is required. ");
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_12_span_36_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 79);
    i0.\u0275\u0275text(1, " \u2014 Assign later \u2014 ");
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_12_span_37_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementStart(2, "span", 80);
    i0.\u0275\u0275text(3);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_3_0;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.createSelectedWorkstream.workstream_name, " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" (", (tmp_3_0 = ctx_r1.createSelectedWorkstream.home_division_name) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : "", ") ");
  }
}
function DeliveryCycleDashboardComponent_div_12_button_38_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "button", 81);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_12_button_38_Template_button_click_0_listener() {
      i0.\u0275\u0275restoreView(_r5);
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.clearCreateWorkstream());
    });
    i0.\u0275\u0275text(1, "\u2715");
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_12_div_53_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 78);
    i0.\u0275\u0275text(1, " Tier Classification is required. ");
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_12_div_57_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 82);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementStart(2, "span", 83);
    i0.\u0275\u0275text(3, " (pre-assigned \u2014 you) ");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.autoAssignedDsDisplayName, " ");
  }
}
function DeliveryCycleDashboardComponent_div_12_div_58_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 84);
    i0.\u0275\u0275text(1, " Assign after creation ");
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_12_div_64_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 82);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementStart(2, "span", 83);
    i0.\u0275\u0275text(3, " (pre-assigned \u2014 you) ");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.autoAssignedCbDisplayName, " ");
  }
}
function DeliveryCycleDashboardComponent_div_12_div_65_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 85);
    i0.\u0275\u0275text(1, " Assign after creation ");
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_12_ion_spinner_102_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "ion-spinner", 86);
  }
}
function DeliveryCycleDashboardComponent_div_12_div_104_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 87)(1, "span", 88);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "span", 89);
    i0.\u0275\u0275text(4, " Check that the Division is valid and you have the required role. ");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate(ctx_r1.createError);
  }
}
function DeliveryCycleDashboardComponent_div_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 32);
    i0.\u0275\u0275element(1, "app-loading-overlay", 33);
    i0.\u0275\u0275elementStart(2, "div", 34)(3, "div", 35)(4, "span", 36);
    i0.\u0275\u0275text(5, "New Delivery Cycle");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(6, "button", 37);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_12_Template_button_click_6_listener() {
      i0.\u0275\u0275restoreView(_r3);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.toggleCreateForm());
    });
    i0.\u0275\u0275text(7, "\xD7");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(8, "div", 38)(9, "form", 39);
    i0.\u0275\u0275listener("ngSubmit", function DeliveryCycleDashboardComponent_div_12_Template_form_ngSubmit_9_listener() {
      i0.\u0275\u0275restoreView(_r3);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.submitCreate());
    });
    i0.\u0275\u0275elementStart(10, "div", 40)(11, "div")(12, "label", 41);
    i0.\u0275\u0275text(13, " Owner Division * ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(14, "select", 42);
    i0.\u0275\u0275listener("change", function DeliveryCycleDashboardComponent_div_12_Template_select_change_14_listener() {
      i0.\u0275\u0275restoreView(_r3);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.onCreateDivisionChange());
    });
    i0.\u0275\u0275elementStart(15, "option", 43);
    i0.\u0275\u0275text(16, "\u2014 Select Division \u2014");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(17, DeliveryCycleDashboardComponent_div_12_option_17_Template, 2, 2, "option", 44);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(18, DeliveryCycleDashboardComponent_div_12_div_18_Template, 2, 0, "div", 45);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(19, "div")(20, "label", 41);
    i0.\u0275\u0275text(21, " Cycle Title * ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(22, "input", 46);
    i0.\u0275\u0275template(23, DeliveryCycleDashboardComponent_div_12_div_23_Template, 2, 0, "div", 45);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(24, "div", 4)(25, "label", 41);
    i0.\u0275\u0275text(26, " Outcome Statement ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(27, "textarea", 47);
    i0.\u0275\u0275text(28, "              ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(29, "div", 48);
    i0.\u0275\u0275text(30, " Recommended. Required before Brief Review Gate. You can add it now or after creation. ");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(31, "div", 4)(32, "label", 41);
    i0.\u0275\u0275text(33, " Delivery Workstream ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(34, "div", 49)(35, "button", 50);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_12_Template_button_click_35_listener() {
      i0.\u0275\u0275restoreView(_r3);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.openWorkstreamPicker());
    });
    i0.\u0275\u0275template(36, DeliveryCycleDashboardComponent_div_12_span_36_Template, 2, 0, "span", 51)(37, DeliveryCycleDashboardComponent_div_12_span_37_Template, 4, 2, "span", 24);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(38, DeliveryCycleDashboardComponent_div_12_button_38_Template, 2, 0, "button", 52);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(39, "div", 48);
    i0.\u0275\u0275text(40, " Recommended. Required before Brief Review Gate. ");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(41, "div", 53)(42, "label", 41);
    i0.\u0275\u0275text(43, " Tier Classification * ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(44, "select", 54)(45, "option", 43);
    i0.\u0275\u0275text(46, "Select tier classification");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(47, "option", 55);
    i0.\u0275\u0275text(48, "Tier 1 \u2014 Fast Lane: Workflow changes, config updates, no platform dependencies");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(49, "option", 56);
    i0.\u0275\u0275text(50, "Tier 2 \u2014 Structured: Platform changes, integrations, cross-domain dependencies");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(51, "option", 57);
    i0.\u0275\u0275text(52, "Tier 3 \u2014 Governed: Agent deployments, compliance scope changes, AI Governance Board required");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275template(53, DeliveryCycleDashboardComponent_div_12_div_53_Template, 2, 0, "div", 45);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(54, "div", 58)(55, "label", 41);
    i0.\u0275\u0275text(56, " Assigned Domain Strategist ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(57, DeliveryCycleDashboardComponent_div_12_div_57_Template, 4, 1, "div", 59)(58, DeliveryCycleDashboardComponent_div_12_div_58_Template, 2, 0, "div", 60);
    i0.\u0275\u0275elementStart(59, "div", 48);
    i0.\u0275\u0275text(60, " Required before Brief Review Gate. ");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(61, "div", 58)(62, "label", 41);
    i0.\u0275\u0275text(63, " Assigned Capability Builder ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(64, DeliveryCycleDashboardComponent_div_12_div_64_Template, 4, 1, "div", 59)(65, DeliveryCycleDashboardComponent_div_12_div_65_Template, 2, 0, "div", 61);
    i0.\u0275\u0275elementStart(66, "div", 48);
    i0.\u0275\u0275text(67, " Required before Go to Build Gate. ");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(68, "div", 62)(69, "label", 41);
    i0.\u0275\u0275text(70, " Jira Epic Link ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(71, "input", 63);
    i0.\u0275\u0275elementStart(72, "div", 48);
    i0.\u0275\u0275text(73, " Required before Go to Build Gate. ");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(74, "div", 4)(75, "div", 64);
    i0.\u0275\u0275text(76, " Target Dates ");
    i0.\u0275\u0275elementStart(77, "span", 65);
    i0.\u0275\u0275text(78, " \u2014 all optional at creation");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(79, "div", 66)(80, "div")(81, "label", 67);
    i0.\u0275\u0275text(82, " Brief Review ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(83, "input", 68);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(84, "div")(85, "label", 67);
    i0.\u0275\u0275text(86, " Go to Build ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(87, "input", 69);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(88, "div")(89, "label", 67);
    i0.\u0275\u0275text(90, " Pilot Start (Go to Deploy) ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(91, "input", 70);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(92, "div")(93, "label", 67);
    i0.\u0275\u0275text(94, " Production Release (Go to Release) ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(95, "input", 71);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(96, "div")(97, "label", 67);
    i0.\u0275\u0275text(98, " Close Review ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(99, "input", 72);
    i0.\u0275\u0275elementEnd()()();
    i0.\u0275\u0275elementStart(100, "div", 73)(101, "button", 74);
    i0.\u0275\u0275template(102, DeliveryCycleDashboardComponent_div_12_ion_spinner_102_Template, 1, 0, "ion-spinner", 75);
    i0.\u0275\u0275text(103);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(104, DeliveryCycleDashboardComponent_div_12_div_104_Template, 5, 1, "div", 76);
    i0.\u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    let tmp_4_0;
    let tmp_5_0;
    let tmp_9_0;
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("visible", ctx_r1.creating);
    i0.\u0275\u0275advance(8);
    i0.\u0275\u0275property("formGroup", ctx_r1.createForm);
    i0.\u0275\u0275advance(8);
    i0.\u0275\u0275property("ngForOf", ctx_r1.divisions);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ((tmp_4_0 = ctx_r1.createForm.get("division_id")) == null ? null : tmp_4_0.invalid) && ((tmp_4_0 = ctx_r1.createForm.get("division_id")) == null ? null : tmp_4_0.touched));
    i0.\u0275\u0275advance(5);
    i0.\u0275\u0275property("ngIf", ((tmp_5_0 = ctx_r1.createForm.get("cycle_title")) == null ? null : tmp_5_0.invalid) && ((tmp_5_0 = ctx_r1.createForm.get("cycle_title")) == null ? null : tmp_5_0.touched));
    i0.\u0275\u0275advance(13);
    i0.\u0275\u0275property("ngIf", !ctx_r1.createSelectedWorkstream);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.createSelectedWorkstream);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.createSelectedWorkstream);
    i0.\u0275\u0275advance(15);
    i0.\u0275\u0275property("ngIf", ((tmp_9_0 = ctx_r1.createForm.get("tier_classification")) == null ? null : tmp_9_0.invalid) && ((tmp_9_0 = ctx_r1.createForm.get("tier_classification")) == null ? null : tmp_9_0.touched));
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275property("ngIf", ctx_r1.autoAssignedDsDisplayName);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", !ctx_r1.autoAssignedDsDisplayName);
    i0.\u0275\u0275advance(6);
    i0.\u0275\u0275property("ngIf", ctx_r1.autoAssignedCbDisplayName);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", !ctx_r1.autoAssignedCbDisplayName);
    i0.\u0275\u0275advance(36);
    i0.\u0275\u0275property("disabled", ctx_r1.createForm.invalid || ctx_r1.creating);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.creating);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.creating ? "Creating\u2026" : "Create Delivery Cycle", " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.createError);
  }
}
function DeliveryCycleDashboardComponent_app_workstream_picker_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "app-workstream-picker", 90);
    i0.\u0275\u0275listener("workstreamSelected", function DeliveryCycleDashboardComponent_app_workstream_picker_13_Template_app_workstream_picker_workstreamSelected_0_listener($event) {
      i0.\u0275\u0275restoreView(_r6);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.onWorkstreamSelected($event));
    });
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_1_0;
    let tmp_3_0;
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275property("cycleDivisionId", ((tmp_1_0 = ctx_r1.createForm.get("division_id")) == null ? null : tmp_1_0.value) || null)("isTrustLevelDivision", ctx_r1.createDivisionIsTrustLevel)("currentWorkstreamId", (tmp_3_0 = ctx_r1.createSelectedWorkstream == null ? null : ctx_r1.createSelectedWorkstream.workstream_id) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : null);
  }
}
function DeliveryCycleDashboardComponent_div_20_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 91);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_20_Template_div_click_0_listener() {
      i0.\u0275\u0275restoreView(_r7);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.onMyCyclesTap());
    })("mouseenter", function DeliveryCycleDashboardComponent_div_20_Template_div_mouseenter_0_listener($event) {
      i0.\u0275\u0275restoreView(_r7);
      return i0.\u0275\u0275resetView($event.currentTarget.style.boxShadow = "0 2px 8px rgba(37,112,153,0.2)");
    })("mouseleave", function DeliveryCycleDashboardComponent_div_20_Template_div_mouseleave_0_listener($event) {
      i0.\u0275\u0275restoreView(_r7);
      return i0.\u0275\u0275resetView($event.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)");
    });
    i0.\u0275\u0275elementStart(1, "div", 14);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 15);
    i0.\u0275\u0275text(4, "My Cycles");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.myCyclesCount, " ");
  }
}
function DeliveryCycleDashboardComponent_div_21_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 91);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_21_Template_div_click_0_listener() {
      i0.\u0275\u0275restoreView(_r8);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.onOverdueGatesTap());
    })("mouseenter", function DeliveryCycleDashboardComponent_div_21_Template_div_mouseenter_0_listener($event) {
      i0.\u0275\u0275restoreView(_r8);
      return i0.\u0275\u0275resetView($event.currentTarget.style.boxShadow = "0 2px 8px rgba(233,97,39,0.2)");
    })("mouseleave", function DeliveryCycleDashboardComponent_div_21_Template_div_mouseleave_0_listener($event) {
      i0.\u0275\u0275restoreView(_r8);
      return i0.\u0275\u0275resetView($event.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)");
    });
    i0.\u0275\u0275elementStart(1, "div", 92);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 15);
    i0.\u0275\u0275text(4, "Overdue Gates");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.overdueGateCount, " ");
  }
}
function DeliveryCycleDashboardComponent_div_22_span_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "span", 97);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementStart(2, "button", 98);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_22_span_3_Template_button_click_2_listener() {
      i0.\u0275\u0275restoreView(_r10);
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.clearDrillDownWorkstream());
    });
    i0.\u0275\u0275text(3, "\u2715");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" Workstream: ", ctx_r1.drillDownWorkstreamLabel, " ");
  }
}
function DeliveryCycleDashboardComponent_div_22_span_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "span", 97);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementStart(2, "button", 98);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_22_span_4_Template_button_click_2_listener() {
      i0.\u0275\u0275restoreView(_r11);
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.clearDrillDownGate());
    });
    i0.\u0275\u0275text(3, "\u2715");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" Gate: ", ctx_r1.drillDownGateLabel, " ");
  }
}
function DeliveryCycleDashboardComponent_div_22_span_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "span", 97);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementStart(2, "button", 98);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_22_span_5_Template_button_click_2_listener() {
      i0.\u0275\u0275restoreView(_r12);
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.clearDrillDownDivision());
    });
    i0.\u0275\u0275text(3, "\u2715");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" Division: ", ctx_r1.drillDownDivisionLabel, " ");
  }
}
function DeliveryCycleDashboardComponent_div_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 93)(1, "span", 94);
    i0.\u0275\u0275text(2, "Filtered view:");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(3, DeliveryCycleDashboardComponent_div_22_span_3_Template, 4, 1, "span", 95)(4, DeliveryCycleDashboardComponent_div_22_span_4_Template, 4, 1, "span", 95)(5, DeliveryCycleDashboardComponent_div_22_span_5_Template, 4, 1, "span", 95);
    i0.\u0275\u0275elementStart(6, "button", 96);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_22_Template_button_click_6_listener() {
      i0.\u0275\u0275restoreView(_r9);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.clearDrillDown());
    });
    i0.\u0275\u0275text(7, " Remove all filters ");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275property("ngIf", ctx_r1.drillDownWorkstreamLabel);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.drillDownGateLabel);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.drillDownDivisionLabel);
  }
}
function DeliveryCycleDashboardComponent_span_26_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 99);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.activeFilterCount, " ");
  }
}
function DeliveryCycleDashboardComponent_span_27_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "span", 100);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementStart(2, "button", 101);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_span_27_Template_button_click_2_listener() {
      i0.\u0275\u0275restoreView(_r13);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      ctx_r1.filterStage = "";
      return i0.\u0275\u0275resetView(ctx_r1.applyFilters());
    });
    i0.\u0275\u0275text(3, "x");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.stageLabelFor(ctx_r1.filterStage), " ");
  }
}
function DeliveryCycleDashboardComponent_span_28_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "span", 100);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementStart(2, "button", 101);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_span_28_Template_button_click_2_listener() {
      i0.\u0275\u0275restoreView(_r14);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      ctx_r1.filterTier = "";
      return i0.\u0275\u0275resetView(ctx_r1.applyFilters());
    });
    i0.\u0275\u0275text(3, "x");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" Tier ", ctx_r1.tierLabel(ctx_r1.filterTier), " ");
  }
}
function DeliveryCycleDashboardComponent_span_29_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "span", 100);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementStart(2, "button", 101);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_span_29_Template_button_click_2_listener() {
      i0.\u0275\u0275restoreView(_r15);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      ctx_r1.filterWorkstream = "";
      return i0.\u0275\u0275resetView(ctx_r1.applyFilters());
    });
    i0.\u0275\u0275text(3, "x");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.filterWorkstream === "__none__" ? "No Workstream" : ctx_r1.workstreamName(ctx_r1.filterWorkstream), " ");
  }
}
function DeliveryCycleDashboardComponent_span_30_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "span", 100);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementStart(2, "button", 101);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_span_30_Template_button_click_2_listener() {
      i0.\u0275\u0275restoreView(_r16);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      ctx_r1.filterGateStatus = "";
      return i0.\u0275\u0275resetView(ctx_r1.applyFilters());
    });
    i0.\u0275\u0275text(3, "x");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" Gates: ", ctx_r1.filterGateStatus === "overdue" ? "Overdue" : ctx_r1.filterGateStatus === "pending" ? "Pending" : "Approved", " ");
  }
}
function DeliveryCycleDashboardComponent_span_31_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "span", 100);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementStart(2, "button", 101);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_span_31_Template_button_click_2_listener() {
      i0.\u0275\u0275restoreView(_r17);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      ctx_r1.filterAssignedPerson = "";
      return i0.\u0275\u0275resetView(ctx_r1.applyFilters());
    });
    i0.\u0275\u0275text(3, "x");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.filterAssignedPerson === "my_cycles" ? "My Cycles" : ctx_r1.filterAssignedPerson === "unassigned_ds" ? "Unassigned DS" : "Unassigned CB", " ");
  }
}
function DeliveryCycleDashboardComponent_div_32_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 102);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_32_Template_div_click_0_listener() {
      i0.\u0275\u0275restoreView(_r18);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.showFilterPanel = false);
    });
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_33_option_13_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "option", 77);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const d_r20 = ctx.$implicit;
    i0.\u0275\u0275property("value", d_r20.id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(d_r20.division_name);
  }
}
function DeliveryCycleDashboardComponent_div_33_label_21_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "label", 118)(1, "input", 132);
    i0.\u0275\u0275twoWayListener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_label_21_Template_input_ngModelChange_1_listener($event) {
      i0.\u0275\u0275restoreView(_r21);
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.filterAssignedPerson, $event) || (ctx_r1.filterAssignedPerson = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_label_21_Template_input_ngModelChange_1_listener() {
      i0.\u0275\u0275restoreView(_r21);
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.applyFilters());
    });
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const opt_r22 = ctx.$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("value", opt_r22.value);
    i0.\u0275\u0275twoWayProperty("ngModel", ctx_r1.filterAssignedPerson);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", opt_r22.label, " ");
  }
}
function DeliveryCycleDashboardComponent_div_33_option_28_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "option", 77);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_4_0;
    const s_r23 = ctx.$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275property("value", s_r23);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate((tmp_4_0 = ctx_r1.STAGE_LABEL_MAP[s_r23]) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : s_r23);
  }
}
function DeliveryCycleDashboardComponent_div_33_optgroup_68_option_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "option", 77);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ws_r24 = ctx.$implicit;
    i0.\u0275\u0275property("value", ws_r24.workstream_id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ws_r24.workstream_name);
  }
}
function DeliveryCycleDashboardComponent_div_33_optgroup_68_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "optgroup", 133);
    i0.\u0275\u0275template(1, DeliveryCycleDashboardComponent_div_33_optgroup_68_option_1_Template, 2, 2, "option", 44);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r1.activeWorkstreams);
  }
}
function DeliveryCycleDashboardComponent_div_33_optgroup_69_option_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "option", 77);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ws_r25 = ctx.$implicit;
    i0.\u0275\u0275property("value", ws_r25.workstream_id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1("", ws_r25.workstream_name, " (Inactive)");
  }
}
function DeliveryCycleDashboardComponent_div_33_optgroup_69_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "optgroup", 134);
    i0.\u0275\u0275template(1, DeliveryCycleDashboardComponent_div_33_optgroup_69_option_1_Template, 2, 2, "option", 44);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r1.inactiveWorkstreams);
  }
}
function DeliveryCycleDashboardComponent_div_33_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 103);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_33_Template_div_click_0_listener($event) {
      i0.\u0275\u0275restoreView(_r19);
      return i0.\u0275\u0275resetView($event.stopPropagation());
    });
    i0.\u0275\u0275elementStart(1, "div", 104)(2, "span", 105);
    i0.\u0275\u0275text(3, "Filters");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(4, "button", 106);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_33_Template_button_click_4_listener() {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.showFilterPanel = false);
    });
    i0.\u0275\u0275text(5, "x");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(6, "div", 107)(7, "div", 108)(8, "div", 109);
    i0.\u0275\u0275text(9, "Division");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(10, "select", 110);
    i0.\u0275\u0275twoWayListener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_select_ngModelChange_10_listener($event) {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.filterDivision, $event) || (ctx_r1.filterDivision = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_select_ngModelChange_10_listener() {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.onDivisionFilterChange());
    });
    i0.\u0275\u0275elementStart(11, "option", 43);
    i0.\u0275\u0275text(12, "My Divisions");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(13, DeliveryCycleDashboardComponent_div_33_option_13_Template, 2, 2, "option", 44);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(14, "label", 111)(15, "input", 112);
    i0.\u0275\u0275twoWayListener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_input_ngModelChange_15_listener($event) {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.includeChildDivisions, $event) || (ctx_r1.includeChildDivisions = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_input_ngModelChange_15_listener() {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.onDivisionFilterChange());
    });
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275text(16, " Include child divisions ");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(17, "div", 108)(18, "div", 109);
    i0.\u0275\u0275text(19, "Assigned Person");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(20, "div", 113);
    i0.\u0275\u0275template(21, DeliveryCycleDashboardComponent_div_33_label_21_Template, 3, 3, "label", 114);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(22, "div", 108)(23, "div", 109);
    i0.\u0275\u0275text(24, "Lifecycle Stage");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(25, "select", 110);
    i0.\u0275\u0275twoWayListener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_select_ngModelChange_25_listener($event) {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.filterStage, $event) || (ctx_r1.filterStage = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_select_ngModelChange_25_listener() {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.applyFilters());
    });
    i0.\u0275\u0275elementStart(26, "option", 43);
    i0.\u0275\u0275text(27, "All Stages");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(28, DeliveryCycleDashboardComponent_div_33_option_28_Template, 2, 2, "option", 44);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(29, "div", 108)(30, "div", 109);
    i0.\u0275\u0275text(31, "Gate Status");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(32, "select", 110);
    i0.\u0275\u0275twoWayListener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_select_ngModelChange_32_listener($event) {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.filterGateStatus, $event) || (ctx_r1.filterGateStatus = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_select_ngModelChange_32_listener() {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.applyFilters());
    });
    i0.\u0275\u0275elementStart(33, "option", 43);
    i0.\u0275\u0275text(34, "All");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(35, "option", 115);
    i0.\u0275\u0275text(36, "Overdue");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(37, "option", 116);
    i0.\u0275\u0275text(38, "Pending");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(39, "option", 117);
    i0.\u0275\u0275text(40, "Approved");
    i0.\u0275\u0275elementEnd()()();
    i0.\u0275\u0275elementStart(41, "div", 108)(42, "div", 109);
    i0.\u0275\u0275text(43, "Tier");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(44, "div", 113)(45, "label", 118)(46, "input", 119);
    i0.\u0275\u0275twoWayListener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_input_ngModelChange_46_listener($event) {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.filterTier, $event) || (ctx_r1.filterTier = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_input_ngModelChange_46_listener() {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.applyFilters());
    });
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275text(47, "All Tiers ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(48, "label", 118)(49, "input", 120);
    i0.\u0275\u0275twoWayListener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_input_ngModelChange_49_listener($event) {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.filterTier, $event) || (ctx_r1.filterTier = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_input_ngModelChange_49_listener() {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.applyFilters());
    });
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(50, "span", 121);
    i0.\u0275\u0275text(51, "Tier 1 - Fast Lane ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(52, "label", 118)(53, "input", 122);
    i0.\u0275\u0275twoWayListener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_input_ngModelChange_53_listener($event) {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.filterTier, $event) || (ctx_r1.filterTier = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_input_ngModelChange_53_listener() {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.applyFilters());
    });
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(54, "span", 123);
    i0.\u0275\u0275text(55, "Tier 2 - Structured ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(56, "label", 118)(57, "input", 124);
    i0.\u0275\u0275twoWayListener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_input_ngModelChange_57_listener($event) {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.filterTier, $event) || (ctx_r1.filterTier = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_input_ngModelChange_57_listener() {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.applyFilters());
    });
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(58, "span", 125);
    i0.\u0275\u0275text(59, "Tier 3 - Governed ");
    i0.\u0275\u0275elementEnd()()();
    i0.\u0275\u0275elementStart(60, "div", 108)(61, "div", 109);
    i0.\u0275\u0275text(62, "Workstream");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(63, "select", 110);
    i0.\u0275\u0275twoWayListener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_select_ngModelChange_63_listener($event) {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      i0.\u0275\u0275twoWayBindingSet(ctx_r1.filterWorkstream, $event) || (ctx_r1.filterWorkstream = $event);
      return i0.\u0275\u0275resetView($event);
    });
    i0.\u0275\u0275listener("ngModelChange", function DeliveryCycleDashboardComponent_div_33_Template_select_ngModelChange_63_listener() {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.applyFilters());
    });
    i0.\u0275\u0275elementStart(64, "option", 43);
    i0.\u0275\u0275text(65, "All Workstreams");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(66, "option", 126);
    i0.\u0275\u0275text(67, "No Workstream Assigned");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(68, DeliveryCycleDashboardComponent_div_33_optgroup_68_Template, 2, 1, "optgroup", 127)(69, DeliveryCycleDashboardComponent_div_33_optgroup_69_Template, 2, 1, "optgroup", 128);
    i0.\u0275\u0275elementEnd()()();
    i0.\u0275\u0275elementStart(70, "div", 129)(71, "button", 130);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_33_Template_button_click_71_listener() {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      ctx_r1.clearAllFilters();
      return i0.\u0275\u0275resetView(ctx_r1.showFilterPanel = false);
    });
    i0.\u0275\u0275text(72, "Clear All");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(73, "button", 131);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_33_Template_button_click_73_listener() {
      i0.\u0275\u0275restoreView(_r19);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.showFilterPanel = false);
    });
    i0.\u0275\u0275text(74, "Done");
    i0.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(10);
    i0.\u0275\u0275twoWayProperty("ngModel", ctx_r1.filterDivision);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275property("ngForOf", ctx_r1.filterDivisionOptions);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275twoWayProperty("ngModel", ctx_r1.includeChildDivisions);
    i0.\u0275\u0275advance(6);
    i0.\u0275\u0275property("ngForOf", ctx_r1.assignedPersonOptions);
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275twoWayProperty("ngModel", ctx_r1.filterStage);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275property("ngForOf", ctx_r1.stages);
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275twoWayProperty("ngModel", ctx_r1.filterGateStatus);
    i0.\u0275\u0275advance(14);
    i0.\u0275\u0275twoWayProperty("ngModel", ctx_r1.filterTier);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275twoWayProperty("ngModel", ctx_r1.filterTier);
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275twoWayProperty("ngModel", ctx_r1.filterTier);
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275twoWayProperty("ngModel", ctx_r1.filterTier);
    i0.\u0275\u0275advance(6);
    i0.\u0275\u0275twoWayProperty("ngModel", ctx_r1.filterWorkstream);
    i0.\u0275\u0275advance(5);
    i0.\u0275\u0275property("ngIf", ctx_r1.activeWorkstreams.length > 0);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.inactiveWorkstreams.length > 0);
  }
}
function DeliveryCycleDashboardComponent_div_34_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 136);
    i0.\u0275\u0275element(1, "ion-skeleton-text", 137)(2, "ion-skeleton-text", 138)(3, "ion-skeleton-text", 139)(4, "ion-skeleton-text", 139)(5, "ion-skeleton-text", 140)(6, "ion-skeleton-text", 141)(7, "ion-skeleton-text", 141);
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_34_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div");
    i0.\u0275\u0275template(1, DeliveryCycleDashboardComponent_div_34_div_1_Template, 8, 0, "div", 135);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r1.skeletonRows);
  }
}
function DeliveryCycleDashboardComponent_div_35_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 142)(1, "div", 143);
    i0.\u0275\u0275text(2, " Delivery Cycles could not load. ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 144);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.loadError, " ");
  }
}
function DeliveryCycleDashboardComponent_div_36_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 145);
    i0.\u0275\u0275element(1, "span");
    i0.\u0275\u0275elementStart(2, "span");
    i0.\u0275\u0275text(3, "Division");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(4, "span");
    i0.\u0275\u0275text(5, "Cycle Name");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(6, "span");
    i0.\u0275\u0275text(7, "Outcome");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(8, "span");
    i0.\u0275\u0275text(9, "Stage");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(10, "span");
    i0.\u0275\u0275text(11, "DS");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(12, "span");
    i0.\u0275\u0275text(13, "CB");
    i0.\u0275\u0275elementEnd()();
  }
}
function DeliveryCycleDashboardComponent_div_37_span_13_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "span", 162);
  }
}
function DeliveryCycleDashboardComponent_div_37_span_23_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 163);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cycle_r27 = i0.\u0275\u0275nextContext().$implicit;
    i0.\u0275\u0275propertyInterpolate("title", cycle_r27.assigned_ds_display_name);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", cycle_r27.assigned_ds_display_name, " ");
  }
}
function DeliveryCycleDashboardComponent_div_37_ng_template_24_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 164);
    i0.\u0275\u0275text(1, "\u2014");
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_37_span_27_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 163);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cycle_r27 = i0.\u0275\u0275nextContext().$implicit;
    i0.\u0275\u0275propertyInterpolate("title", cycle_r27.assigned_cb_display_name);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", cycle_r27.assigned_cb_display_name, " ");
  }
}
function DeliveryCycleDashboardComponent_div_37_ng_template_28_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 164);
    i0.\u0275\u0275text(1, "\u2014");
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_37_Template(rf, ctx) {
  if (rf & 1) {
    const _r26 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div")(1, "div", 146);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_37_Template_div_click_1_listener() {
      const cycle_r27 = i0.\u0275\u0275restoreView(_r26).$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.openCyclePanel(cycle_r27.delivery_cycle_id));
    })("mouseenter", function DeliveryCycleDashboardComponent_div_37_Template_div_mouseenter_1_listener($event) {
      const cycle_r27 = i0.\u0275\u0275restoreView(_r26).$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView($event.currentTarget.style.background = ctx_r1.selectedCycleId === cycle_r27.delivery_cycle_id ? "#E8F0FE" : "#F0F4F8");
    })("mouseleave", function DeliveryCycleDashboardComponent_div_37_Template_div_mouseleave_1_listener($event) {
      const cycle_r27 = i0.\u0275\u0275restoreView(_r26).$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView($event.currentTarget.style.background = ctx_r1.selectedCycleId === cycle_r27.delivery_cycle_id ? "#E8F0FE" : "");
    });
    i0.\u0275\u0275elementStart(2, "div", 147);
    i0.\u0275\u0275element(3, "div", 148);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(4, "div", 149)(5, "span", 150);
    i0.\u0275\u0275text(6);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(7, "div")(8, "div", 151);
    i0.\u0275\u0275text(9);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(10, "span", 152);
    i0.\u0275\u0275text(11);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(12, "div", 153);
    i0.\u0275\u0275template(13, DeliveryCycleDashboardComponent_div_37_span_13_Template, 1, 0, "span", 154);
    i0.\u0275\u0275elementStart(14, "span", 155);
    i0.\u0275\u0275text(15);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(16, "div", 156);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_37_Template_div_click_16_listener($event) {
      const cycle_r27 = i0.\u0275\u0275restoreView(_r26).$implicit;
      const ctx_r1 = i0.\u0275\u0275nextContext();
      $event.stopPropagation();
      return i0.\u0275\u0275resetView(ctx_r1.openCyclePanel(cycle_r27.delivery_cycle_id));
    });
    i0.\u0275\u0275elementStart(17, "div", 157);
    i0.\u0275\u0275text(18);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(19, "app-stage-track", 158);
    i0.\u0275\u0275elementStart(20, "div", 159);
    i0.\u0275\u0275text(21);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(22, "div", 160);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_37_Template_div_click_22_listener($event) {
      i0.\u0275\u0275restoreView(_r26);
      return i0.\u0275\u0275resetView($event.stopPropagation());
    });
    i0.\u0275\u0275template(23, DeliveryCycleDashboardComponent_div_37_span_23_Template, 2, 2, "span", 161)(24, DeliveryCycleDashboardComponent_div_37_ng_template_24_Template, 2, 0, "ng-template", null, 0, i0.\u0275\u0275templateRefExtractor);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(26, "div", 160);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_37_Template_div_click_26_listener($event) {
      i0.\u0275\u0275restoreView(_r26);
      return i0.\u0275\u0275resetView($event.stopPropagation());
    });
    i0.\u0275\u0275template(27, DeliveryCycleDashboardComponent_div_37_span_27_Template, 2, 2, "span", 161)(28, DeliveryCycleDashboardComponent_div_37_ng_template_28_Template, 2, 0, "ng-template", null, 1, i0.\u0275\u0275templateRefExtractor);
    i0.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_7_0;
    let tmp_8_0;
    let tmp_16_0;
    let tmp_18_0;
    const cycle_r27 = ctx.$implicit;
    const noDsCell_r28 = i0.\u0275\u0275reference(25);
    const noCbCell_r29 = i0.\u0275\u0275reference(29);
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("background", ctx_r1.selectedCycleId === cycle_r27.delivery_cycle_id ? "#E8F0FE" : "")("border-left", ctx_r1.selectedCycleId === cycle_r27.delivery_cycle_id ? "3px solid var(--triarq-color-primary,#257099)" : "3px solid transparent");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275styleProp("background", ctx_r1.tierDotColor(cycle_r27.tier_classification));
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275propertyInterpolate("title", (tmp_7_0 = cycle_r27.division_name) !== null && tmp_7_0 !== void 0 ? tmp_7_0 : "");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", (tmp_8_0 = cycle_r27.division_name) !== null && tmp_8_0 !== void 0 ? tmp_8_0 : "", " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275propertyInterpolate("title", cycle_r27.cycle_title);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", cycle_r27.cycle_title, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("background", ctx_r1.tierBadgeBg(cycle_r27.tier_classification))("color", ctx_r1.tierBadgeColor(cycle_r27.tier_classification));
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" Tier ", ctx_r1.tierLabel(cycle_r27.tier_classification), " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngIf", !cycle_r27.outcome_statement);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", cycle_r27.outcome_statement || "\u2014", " ");
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1(" ", (tmp_16_0 = ctx_r1.STAGE_LABEL_MAP[cycle_r27.current_lifecycle_stage]) !== null && tmp_16_0 !== void 0 ? tmp_16_0 : cycle_r27.current_lifecycle_stage, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("currentStageId", cycle_r27.current_lifecycle_stage)("gateStateMap", (tmp_18_0 = ctx_r1.gateStateMapsCache.get(cycle_r27.delivery_cycle_id)) !== null && tmp_18_0 !== void 0 ? tmp_18_0 : ctx_r1.buildGateStateMap(cycle_r27));
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("color", ctx_r1.headlineColor(cycle_r27));
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.headline(cycle_r27), " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngIf", cycle_r27.assigned_ds_display_name)("ngIfElse", noDsCell_r28);
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275property("ngIf", cycle_r27.assigned_cb_display_name)("ngIfElse", noCbCell_r29);
  }
}
function DeliveryCycleDashboardComponent_div_38_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementContainerStart(0);
    i0.\u0275\u0275elementStart(1, "div", 167);
    i0.\u0275\u0275text(2, "\u25EB");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 168);
    i0.\u0275\u0275text(4, " No Division assignment yet ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "div", 169);
    i0.\u0275\u0275text(6, " Contact your administrator to be assigned to a Division. ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementContainerEnd();
  }
}
function DeliveryCycleDashboardComponent_div_38_ng_container_3_span_4_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1, 'Use "+ New Cycle" above to create the first one.');
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_38_ng_container_3_span_5_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1, "No cycles have been created yet in your Divisions.");
    i0.\u0275\u0275elementEnd();
  }
}
function DeliveryCycleDashboardComponent_div_38_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementContainerStart(0);
    i0.\u0275\u0275elementStart(1, "div", 168);
    i0.\u0275\u0275text(2, " No active Delivery Cycles in your Divisions ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 169);
    i0.\u0275\u0275template(4, DeliveryCycleDashboardComponent_div_38_ng_container_3_span_4_Template, 2, 0, "span", 24)(5, DeliveryCycleDashboardComponent_div_38_ng_container_3_span_5_Template, 2, 0, "span", 24);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275property("ngIf", ctx_r1.canCreateCycle);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", !ctx_r1.canCreateCycle);
  }
}
function DeliveryCycleDashboardComponent_div_38_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r30 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementContainerStart(0);
    i0.\u0275\u0275elementStart(1, "div", 144);
    i0.\u0275\u0275text(2, " No cycles match the current filters. ");
    i0.\u0275\u0275elementStart(3, "span", 170);
    i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_div_38_ng_container_4_Template_span_click_3_listener() {
      i0.\u0275\u0275restoreView(_r30);
      const ctx_r1 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r1.clearFilters());
    });
    i0.\u0275\u0275text(4, " Clear filters ");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementContainerEnd();
  }
}
function DeliveryCycleDashboardComponent_div_38_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 165)(1, "div", 166);
    i0.\u0275\u0275template(2, DeliveryCycleDashboardComponent_div_38_ng_container_2_Template, 7, 0, "ng-container", 24)(3, DeliveryCycleDashboardComponent_div_38_ng_container_3_Template, 6, 2, "ng-container", 24)(4, DeliveryCycleDashboardComponent_div_38_ng_container_4_Template, 5, 0, "ng-container", 24);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngIf", ctx_r1.divisionChecked && !ctx_r1.hasDivision);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.hasDivision && ctx_r1.cycles.length === 0);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.hasDivision && ctx_r1.cycles.length > 0);
  }
}
function DeliveryCycleDashboardComponent_div_39_span_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" of ", ctx_r1.cycles.length, "");
  }
}
function DeliveryCycleDashboardComponent_div_39_span_4_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" \xB7 sorted by ", ctx_r1.sortLabel(), "");
  }
}
function DeliveryCycleDashboardComponent_div_39_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 171);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275template(2, DeliveryCycleDashboardComponent_div_39_span_2_Template, 2, 1, "span", 24);
    i0.\u0275\u0275text(3);
    i0.\u0275\u0275template(4, DeliveryCycleDashboardComponent_div_39_span_4_Template, 2, 1, "span", 24);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" Showing ", ctx_r1.filtered.length, "");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.filtered.length < ctx_r1.cycles.length);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" cycle", ctx_r1.cycles.length === 1 ? "" : "s", " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.sortField);
  }
}
function DeliveryCycleDashboardComponent_div_40_Template(rf, ctx) {
  if (rf & 1) {
    const _r31 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 172)(1, "app-delivery-cycle-detail", 173);
    i0.\u0275\u0275listener("close", function DeliveryCycleDashboardComponent_div_40_Template_app_delivery_cycle_detail_close_1_listener() {
      i0.\u0275\u0275restoreView(_r31);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.closePanel());
    });
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("cycleId", ctx_r1.selectedCycleId);
  }
}
var GATE_LABELS = {
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
  // COMPLETE, CANCELLED, ON_HOLD → no next gate (omitted = null)
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
var POST_DEPLOY_STAGES = ["PILOT", "UAT", "RELEASE", "OUTCOME"];
var DeliveryCycleDashboardComponent = class _DeliveryCycleDashboardComponent {
  constructor(delivery, mcp, profile, fb, route, router, screenState, cdr) {
    this.delivery = delivery;
    this.mcp = mcp;
    this.profile = profile;
    this.fb = fb;
    this.route = route;
    this.router = router;
    this.screenState = screenState;
    this.cdr = cdr;
    this.selectedCycleId = null;
    this.cycles = [];
    this.filtered = [];
    this.workstreams = [];
    this.activeWorkstreams = [];
    this.divisions = [];
    this.userDivisions = [];
    this.loading = false;
    this.loadError = "";
    this.hasDivision = true;
    this.divisionChecked = false;
    this.canCreateCycle = false;
    this.showCreateForm = false;
    this.creating = false;
    this.createError = "";
    this.showWorkstreamPicker = false;
    this.createSelectedWorkstream = null;
    this.autoAssignedDsUserId = null;
    this.autoAssignedDsDisplayName = null;
    this.autoAssignedCbUserId = null;
    this.autoAssignedCbDisplayName = null;
    this.activeWorkstreamTab = "";
    this.showFilterPanel = false;
    this.filterGateStatus = "";
    this.filterAssignedPerson = "";
    this.filterStage = "";
    this.filterTier = "";
    this.filterWorkstream = "";
    this.filterDivision = "";
    this.includeChildDivisions = false;
    this.filterNextGate = "";
    this.filterDs = "";
    this.filterCb = "";
    this.deliverySummary = null;
    this.drillDownFromQp = false;
    this.sortField = "cycle_title";
    this.sortDir = "asc";
    this.STAGE_LABEL_MAP = STAGE_LABEL_MAP;
    this.GATE_LABELS = GATE_LABELS;
    this.stages = [
      "BRIEF",
      "DESIGN",
      "SPEC",
      "BUILD",
      "VALIDATE",
      "PILOT",
      "UAT",
      "RELEASE",
      "OUTCOME",
      "COMPLETE",
      "ON_HOLD",
      "CANCELLED"
    ];
    this.gateNames = [
      "brief_review",
      "go_to_build",
      "go_to_deploy",
      "go_to_release",
      "close_review"
    ];
    this.skeletonRows = [1, 2, 3, 4, 5];
    this.gateStateMapsCache = /* @__PURE__ */ new Map();
    this.assignedPersonOptions = [
      { value: "", label: "Anyone" },
      { value: "my_cycles", label: "My Cycles" },
      { value: "unassigned_ds", label: "Unassigned DS" },
      { value: "unassigned_cb", label: "Unassigned CB" }
    ];
    this.TERMINAL_STAGES = ["COMPLETE", "CANCELLED"];
  }
  ngOnInit() {
    this.createForm = this.fb.group({
      division_id: ["", Validators.required],
      cycle_title: ["", Validators.required],
      tier_classification: ["", Validators.required],
      outcome_statement: [""],
      jira_epic_key: [""],
      milestone_brief_review: [""],
      milestone_go_to_build: [""],
      milestone_go_to_deploy: [""],
      milestone_go_to_release: [""],
      milestone_close_review: [""]
    });
    const qp = this.route.snapshot.queryParams;
    if (qp["workstream_id"]) {
      this.filterWorkstream = qp["workstream_id"];
      this.drillDownFromQp = true;
    }
    if (qp["next_gate"]) {
      this.filterNextGate = qp["next_gate"];
      this.drillDownFromQp = true;
    }
    if (qp["division_id"]) {
      this.filterDivision = qp["division_id"];
      this.drillDownFromQp = true;
    }
    this.restoreScreenState();
    this.loadWorkstreams();
    this.loadDivisions();
    this.loadCycles();
    this.loadDeliverySummary();
    this.profileSub = this.profile.profile$.pipe(filter((p) => p !== null), take(1)).subscribe(() => {
      const p = this.profile.getCurrentProfile();
      const role = p?.system_role;
      this.canCreateCycle = role === "ds" || role === "phil" || role === "admin" || role === "cb";
      if (role === "ds" && p?.id && p?.display_name) {
        this.autoAssignedDsUserId = p.id;
        this.autoAssignedDsDisplayName = p.display_name;
      }
      if (role === "cb" && p?.id && p?.display_name) {
        this.autoAssignedCbUserId = p.id;
        this.autoAssignedCbDisplayName = p.display_name;
      }
      this.checkUserDivisions();
      this.cdr.markForCheck();
    });
  }
  checkUserDivisions() {
    return __async(this, null, function* () {
      const currentProfile = this.profile.getCurrentProfile();
      const userId = currentProfile?.id;
      const role = currentProfile?.system_role;
      if (role === "phil" || role === "admin") {
        this.hasDivision = true;
        this.divisionChecked = true;
        this.profile.setHasDivision(true);
        this.cdr.markForCheck();
        return;
      }
      if (!userId) {
        this.hasDivision = false;
        this.divisionChecked = true;
        this.cdr.markForCheck();
        return;
      }
      if (this.profile.hasAnyDivision()) {
        this.hasDivision = true;
        this.divisionChecked = true;
        this.cdr.markForCheck();
        if (this.userDivisions.length > 0) {
          return;
        }
      }
      try {
        const res = yield firstValueFrom(this.mcp.call("division", "get_user_divisions", { user_id: userId }));
        const allDivisions = res.data?.all_accessible_divisions ?? [];
        this.hasDivision = allDivisions.length > 0;
        this.divisionChecked = true;
        this.profile.setHasDivision(this.hasDivision);
        this.userDivisions = res.data?.directly_assigned_divisions ?? [];
      } catch {
        this.hasDivision = false;
        this.divisionChecked = true;
      }
      this.cdr.markForCheck();
    });
  }
  // D-170: Phil and Admin use all loaded divisions for the filter (no assignment needed).
  // Other roles use only their directly-assigned divisions.
  get filterDivisionOptions() {
    const role = this.profile.getCurrentProfile()?.system_role;
    if (role === "phil" || role === "admin") {
      return this.divisions;
    }
    return this.userDivisions;
  }
  /** Card 1: count of non-terminal cycles across loaded result set */
  get activeCycleCount() {
    return this.cycles.filter((c) => !this.TERMINAL_STAGES.includes(c.current_lifecycle_stage)).length;
  }
  /** Card 1: sub-stat — stage breakdown in priority order */
  get activeStageSummary() {
    const active = this.cycles.filter((c) => !this.TERMINAL_STAGES.includes(c.current_lifecycle_stage));
    const counts = /* @__PURE__ */ new Map();
    for (const c of active) {
      const label = STAGE_LABEL_MAP[c.current_lifecycle_stage] ?? c.current_lifecycle_stage;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    if (counts.size === 0) {
      return "No active cycles";
    }
    return Array.from(counts.entries()).map(([l, n]) => `${n} in ${l}`).join(" \xB7 ");
  }
  /** Card 2: count of gate records where caller can approve and gate is pending */
  get awaitingActionCount() {
    let count = 0;
    for (const c of this.cycles) {
      for (const g of c.gate_records ?? []) {
        if (g.gate_status === "pending" && g.current_user_gate_authority?.can_approve) {
          count++;
        }
      }
    }
    return count;
  }
  /** Card 2: name of oldest awaiting gate */
  get oldestAwaitingGateName() {
    let oldest = null;
    for (const c of this.cycles) {
      for (const g of c.gate_records ?? []) {
        if (g.gate_status === "pending" && g.current_user_gate_authority?.can_approve) {
          if (!oldest || g.created_at < oldest.date) {
            oldest = { gate: g.gate_name, date: g.created_at };
          }
        }
      }
    }
    return oldest?.gate ?? null;
  }
  /** Card 2: days since oldest awaiting gate */
  get oldestAwaitingDays() {
    let oldest = null;
    for (const c of this.cycles) {
      for (const g of c.gate_records ?? []) {
        if (g.gate_status === "pending" && g.current_user_gate_authority?.can_approve) {
          if (!oldest || g.created_at < oldest) {
            oldest = g.created_at;
          }
        }
      }
    }
    if (!oldest) {
      return 0;
    }
    return Math.floor((Date.now() - new Date(oldest).getTime()) / 864e5);
  }
  /** Card 3: count of overdue gate records (target_date < today, no actual_date, not approved) */
  get overdueGateCount() {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    let count = 0;
    for (const c of this.cycles) {
      for (const m of c.milestone_dates ?? []) {
        if (m.target_date && !m.actual_date && m.target_date < today) {
          const gateRecord = c.gate_records?.find((g) => g.gate_name === m.gate_name);
          if (gateRecord?.gate_status !== "approved") {
            count++;
          }
        }
      }
    }
    return count;
  }
  /** Card 3: cycles with at least one overdue gate */
  get overdueCycleCount() {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    return this.cycles.filter((c) => (c.milestone_dates ?? []).some((m) => {
      if (!m.target_date || m.actual_date || m.target_date >= today) {
        return false;
      }
      const gateRecord = c.gate_records?.find((g) => g.gate_name === m.gate_name);
      return gateRecord?.gate_status !== "approved";
    })).length;
  }
  /** Card 4: active workstream count from summary or loaded list */
  get activeWorkstreamCount() {
    if (this.deliverySummary) {
      return this.deliverySummary.workstream_summaries.filter((w) => w.active_status).length;
    }
    return this.activeWorkstreams.length;
  }
  /** Card 4: total active cycle count across all workstreams */
  get totalWorkstreamCycleCount() {
    if (this.deliverySummary) {
      return this.deliverySummary.workstream_summaries.filter((w) => w.active_status).reduce((sum, w) => sum + w.total_active_cycles, 0);
    }
    return this.activeCycleCount;
  }
  // ── Item 5: Drill-down filter visual confirmation getters ──────────────────
  get drillDownActive() {
    return this.drillDownFromQp && !!(this.filterWorkstream || this.filterNextGate || this.filterDivision);
  }
  get drillDownWorkstreamLabel() {
    if (!this.filterWorkstream || !this.drillDownFromQp) {
      return null;
    }
    if (this.filterWorkstream === "__none__") {
      return "No Workstream assigned";
    }
    return this.workstreams.find((w) => w.workstream_id === this.filterWorkstream)?.workstream_name ?? this.filterWorkstream;
  }
  get drillDownGateLabel() {
    if (!this.filterNextGate || !this.drillDownFromQp) {
      return null;
    }
    return GATE_LABELS[this.filterNextGate] ?? this.filterNextGate;
  }
  get drillDownDivisionLabel() {
    if (!this.filterDivision || !this.drillDownFromQp) {
      return null;
    }
    return this.divisions.find((d) => d.id === this.filterDivision)?.division_name ?? this.filterDivision;
  }
  clearDrillDownWorkstream() {
    this.filterWorkstream = "";
    this.drillDownFromQp = !!this.filterNextGate || !!this.filterDivision;
    this.applyFilters();
  }
  clearDrillDownGate() {
    this.filterNextGate = "";
    this.drillDownFromQp = !!this.filterWorkstream || !!this.filterDivision;
    this.applyFilters();
  }
  clearDrillDownDivision() {
    this.filterDivision = "";
    this.drillDownFromQp = !!this.filterWorkstream || !!this.filterNextGate;
    this.onDivisionFilterChange();
  }
  clearDrillDown() {
    this.filterWorkstream = "";
    this.filterNextGate = "";
    this.filterDivision = "";
    this.drillDownFromQp = false;
    this.onDivisionFilterChange();
  }
  /** Card 2 tap: filter to cycles where user has gates awaiting action */
  filterToAwaitingAction() {
    this.filtered = this.cycles.filter((c) => (c.gate_records ?? []).some((g) => g.gate_status === "pending" && g.current_user_gate_authority?.can_approve));
    this.cdr.markForCheck();
  }
  /** Card 3 tap: filter to cycles with overdue gates */
  filterToOverdue() {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    this.filtered = this.cycles.filter((c) => (c.milestone_dates ?? []).some((m) => {
      if (!m.target_date || m.actual_date || m.target_date >= today) {
        return false;
      }
      const gateRecord = c.gate_records?.find((g) => g.gate_name === m.gate_name);
      return gateRecord?.gate_status !== "approved";
    }));
    this.cdr.markForCheck();
  }
  /** Card 4 tap: navigate to workstream registry (Admin) */
  navigateToWorkstreams() {
    this.router.navigate(["/admin/workstreams"]);
  }
  loadDeliverySummary() {
    this.delivery.getDeliverySummary().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.deliverySummary = res.data;
          this.cdr.markForCheck();
        }
      },
      error: () => {
      }
      // summary is supplemental — fail silently
    });
  }
  loadWorkstreams() {
    this.delivery.listWorkstreams().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.workstreams = Array.isArray(res.data) ? res.data : [];
          this.activeWorkstreams = this.workstreams.filter((w) => w.active_status);
          this.cdr.markForCheck();
        }
      },
      error: () => {
      }
    });
  }
  // D-167: inactive workstreams shown as a separate group in the workstream filter.
  // They are NOT merged with "no workstream" — different states require separate visibility.
  get inactiveWorkstreams() {
    return this.workstreams.filter((w) => !w.active_status);
  }
  // D-172: Unique DS options derived from loaded cycles — only show people who appear in current result set.
  get dsFilterOptions() {
    const seen = /* @__PURE__ */ new Map();
    for (const c of this.cycles) {
      if (c.assigned_ds_user_id && c.assigned_ds_display_name) {
        seen.set(c.assigned_ds_user_id, c.assigned_ds_display_name);
      }
    }
    return Array.from(seen.entries()).map(([user_id, display_name]) => ({ user_id, display_name })).sort((a, b) => a.display_name.localeCompare(b.display_name));
  }
  // D-172: Unique CB options derived from loaded cycles.
  get cbFilterOptions() {
    const seen = /* @__PURE__ */ new Map();
    for (const c of this.cycles) {
      if (c.assigned_cb_user_id && c.assigned_cb_display_name) {
        seen.set(c.assigned_cb_user_id, c.assigned_cb_display_name);
      }
    }
    return Array.from(seen.entries()).map(([user_id, display_name]) => ({ user_id, display_name })).sort((a, b) => a.display_name.localeCompare(b.display_name));
  }
  loadDivisions() {
    this.mcp.call("division", "list_divisions", { all_levels: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.divisions = Array.isArray(res.data) ? res.data : [];
        } else if (!res.success) {
          this.loadError = res.error ?? "Could not load Divisions.";
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadError = err?.error ?? "Could not load Divisions.";
        this.cdr.markForCheck();
      }
    });
  }
  loadCycles() {
    this.loading = true;
    this.cdr.markForCheck();
    const params = {};
    if (this.filterDivision) {
      params.division_id = this.filterDivision;
      params.include_child_divisions = this.includeChildDivisions;
    }
    this.delivery.listCycles(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycles = Array.isArray(res.data) ? res.data : [];
          this.loadError = "";
          this.applyFilters();
        } else {
          this.loadError = res.error ?? "Delivery Cycles could not be loaded.";
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
  // Called when division filter or include_child_divisions changes — reloads from server
  onDivisionFilterChange() {
    this.saveScreenState();
    this.loadCycles();
  }
  // ── Item 4 (Part 3): Screen state save/restore ──────────────────────────────
  // SCREEN_STATE_RECENCY_DAYS = 7. Search text is never persisted (Principle 4).
  // Save: filter dropdowns + sort field + sort dir + division scope.
  // Restore: only when no drill-down query params are active (D-175 takes priority).
  saveScreenState() {
    const userId = this.profile.getCurrentProfile()?.id;
    if (!userId) {
      return;
    }
    this.screenState.save(SCREEN_KEYS.DELIVERY_CYCLES, userId, {
      filterStage: this.filterStage,
      filterTier: this.filterTier,
      filterWorkstream: this.filterWorkstream,
      filterDivision: this.filterDivision,
      includeChildDivisions: this.includeChildDivisions,
      filterNextGate: this.filterNextGate,
      filterDs: this.filterDs,
      filterCb: this.filterCb,
      filterGateStatus: this.filterGateStatus,
      filterAssignedPerson: this.filterAssignedPerson,
      sortField: this.sortField,
      sortDir: this.sortDir
    });
  }
  restoreScreenState() {
    if (this.drillDownFromQp) {
      return;
    }
    const userId = this.profile.getCurrentProfile()?.id;
    if (!userId) {
      return;
    }
    const saved = this.screenState.restore(SCREEN_KEYS.DELIVERY_CYCLES, userId);
    if (!saved) {
      return;
    }
    if (typeof saved["filterStage"] === "string") {
      this.filterStage = saved["filterStage"];
    }
    if (typeof saved["filterTier"] === "string") {
      this.filterTier = saved["filterTier"];
    }
    if (typeof saved["filterWorkstream"] === "string") {
      this.filterWorkstream = saved["filterWorkstream"];
    }
    if (typeof saved["filterDivision"] === "string") {
      this.filterDivision = saved["filterDivision"];
    }
    if (typeof saved["filterNextGate"] === "string") {
      this.filterNextGate = saved["filterNextGate"];
    }
    if (typeof saved["filterDs"] === "string") {
      this.filterDs = saved["filterDs"];
    }
    if (typeof saved["filterCb"] === "string") {
      this.filterCb = saved["filterCb"];
    }
    if (typeof saved["filterGateStatus"] === "string") {
      this.filterGateStatus = saved["filterGateStatus"];
    }
    if (typeof saved["filterAssignedPerson"] === "string") {
      this.filterAssignedPerson = saved["filterAssignedPerson"];
    }
    if (typeof saved["sortField"] === "string") {
      this.sortField = saved["sortField"];
    }
    if (typeof saved["sortDir"] === "string") {
      this.sortDir = saved["sortDir"];
    }
    if (typeof saved["includeChildDivisions"] === "boolean") {
      this.includeChildDivisions = saved["includeChildDivisions"];
    }
  }
  // persist=false used by count card shortcuts — set filter without writing to memory. Source: D-HubCounts-2026-04-06.
  applyFilters(persist = true) {
    let result = this.cycles.filter((c) => {
      if (this.filterStage && c.current_lifecycle_stage !== this.filterStage) {
        return false;
      }
      if (this.filterTier && c.tier_classification !== this.filterTier) {
        return false;
      }
      if (this.filterWorkstream === "__none__") {
        if (c.workstream_id) {
          return false;
        }
      } else if (this.filterWorkstream) {
        if (c.workstream_id !== this.filterWorkstream) {
          return false;
        }
      }
      if (this.filterNextGate) {
        const nextGate = NEXT_GATE_BY_STAGE[c.current_lifecycle_stage] ?? null;
        if (nextGate !== this.filterNextGate) {
          return false;
        }
      }
      if (this.filterDs && c.assigned_ds_user_id !== this.filterDs) {
        return false;
      }
      if (this.filterCb && c.assigned_cb_user_id !== this.filterCb) {
        return false;
      }
      if (this.filterAssignedPerson) {
        const userId = this.profile.getCurrentProfile()?.id ?? "";
        if (this.filterAssignedPerson === "my_cycles") {
          if (c.assigned_ds_user_id !== userId && c.assigned_cb_user_id !== userId) {
            return false;
          }
        } else if (this.filterAssignedPerson === "unassigned_ds") {
          if (c.assigned_ds_user_id) {
            return false;
          }
        } else if (this.filterAssignedPerson === "unassigned_cb") {
          if (c.assigned_cb_user_id) {
            return false;
          }
        }
      }
      if (this.filterGateStatus) {
        const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        if (this.filterGateStatus === "overdue") {
          const hasOverdue = (c.milestone_dates ?? []).some((m) => m.target_date && !m.actual_date && m.target_date < today && c.gate_records?.find((g) => g.gate_name === m.gate_name)?.gate_status !== "approved");
          if (!hasOverdue) {
            return false;
          }
        } else if (this.filterGateStatus === "pending") {
          if (!c.gate_records?.some((g) => g.gate_status === "pending")) {
            return false;
          }
        } else if (this.filterGateStatus === "approved") {
          if (!c.gate_records?.some((g) => g.gate_status === "approved")) {
            return false;
          }
        }
      }
      return true;
    });
    result = result.slice().sort((a, b) => {
      let va = "", vb = "";
      switch (this.sortField) {
        case "cycle_title":
          va = a.cycle_title;
          vb = b.cycle_title;
          break;
        case "current_lifecycle_stage":
          va = a.current_lifecycle_stage;
          vb = b.current_lifecycle_stage;
          break;
        case "tier_classification":
          va = a.tier_classification;
          vb = b.tier_classification;
          break;
      }
      return this.sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    this.filtered = result;
    this.gateStateMapsCache = new Map(this.cycles.map((c) => [c.delivery_cycle_id, this.buildGateStateMap(c)]));
    if (persist) {
      this.saveScreenState();
    }
    this.cdr.markForCheck();
  }
  // D-193: Workstream tab strip — select a tab; '' = All Workstreams
  selectWorkstreamTab(wsId) {
    this.activeWorkstreamTab = wsId;
    this.filterWorkstream = wsId;
    this.applyFilters();
  }
  clearFilters() {
    this.filterStage = "";
    this.filterTier = "";
    this.filterWorkstream = "";
    this.activeWorkstreamTab = "";
    this.filterNextGate = "";
    this.filterDs = "";
    this.filterCb = "";
    this.applyFilters();
  }
  clearAllFilters() {
    this.filterStage = "";
    this.filterTier = "";
    this.filterWorkstream = "";
    this.filterNextGate = "";
    this.filterDs = "";
    this.filterCb = "";
    this.filterGateStatus = "";
    this.filterAssignedPerson = "";
    this.filterDivision = "";
    this.includeChildDivisions = false;
    this.loadCycles();
  }
  setSort(field) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDir = "asc";
    }
    this.applyFilters();
  }
  sortIcon(field) {
    if (this.sortField !== field) {
      return "\u2195";
    }
    return this.sortDir === "asc" ? "\u2191" : "\u2193";
  }
  sortLabel() {
    const labels = {
      cycle_title: "cycle title",
      current_lifecycle_stage: "stage",
      tier_classification: "tier"
    };
    return labels[this.sortField] ?? this.sortField;
  }
  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    this.createError = "";
    if (this.showCreateForm) {
      this.createForm.reset();
      this.createSelectedWorkstream = null;
      this.showWorkstreamPicker = false;
    }
    this.cdr.markForCheck();
  }
  // CC-002: Workstream picker — open/close/select/clear
  openWorkstreamPicker() {
    this.showWorkstreamPicker = true;
    this.cdr.markForCheck();
  }
  onWorkstreamSelected(ws) {
    this.showWorkstreamPicker = false;
    if (ws) {
      this.createSelectedWorkstream = ws;
    }
    this.cdr.markForCheck();
  }
  clearCreateWorkstream() {
    this.createSelectedWorkstream = null;
    this.cdr.markForCheck();
  }
  // Called when the Division dropdown changes in the create form.
  // Clears the workstream selection since it was scoped to the previous division.
  onCreateDivisionChange() {
    this.createSelectedWorkstream = null;
    this.cdr.markForCheck();
  }
  /**
   * D-195: Returns true when the selected create-form division is a Trust (depth=1).
   * Trust is identified by checking if the division has no parent — i.e., it IS the top of the tree.
   * Divisions loaded via list_divisions include a parent_division_id field.
   * When parent_division_id is null, the division is a Trust-level node.
   */
  get createDivisionIsTrustLevel() {
    const divId = this.createForm?.get("division_id")?.value;
    if (!divId) {
      return false;
    }
    const div = this.divisions.find((d) => d.id === divId);
    return div ? !div.parent_division_id : false;
  }
  submitCreate() {
    if (this.createForm.invalid) {
      return;
    }
    this.creating = true;
    this.createError = "";
    this.cdr.markForCheck();
    const v = this.createForm.value;
    const milestone_target_dates = {};
    if (v.milestone_brief_review) {
      milestone_target_dates["brief_review"] = v.milestone_brief_review;
    }
    if (v.milestone_go_to_build) {
      milestone_target_dates["go_to_build"] = v.milestone_go_to_build;
    }
    if (v.milestone_go_to_deploy) {
      milestone_target_dates["go_to_deploy"] = v.milestone_go_to_deploy;
    }
    if (v.milestone_go_to_release) {
      milestone_target_dates["go_to_release"] = v.milestone_go_to_release;
    }
    if (v.milestone_close_review) {
      milestone_target_dates["close_review"] = v.milestone_close_review;
    }
    this.delivery.createCycle(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
      cycle_title: v.cycle_title,
      tier_classification: v.tier_classification,
      division_id: v.division_id
    }, this.createSelectedWorkstream ? { workstream_id: this.createSelectedWorkstream.workstream_id } : {}), this.autoAssignedDsUserId ? { assigned_ds_user_id: this.autoAssignedDsUserId } : {}), this.autoAssignedCbUserId ? { assigned_cb_user_id: this.autoAssignedCbUserId } : {}), v.outcome_statement?.trim() ? { outcome_statement: v.outcome_statement.trim() } : {}), v.jira_epic_key?.trim() ? { jira_epic_key: v.jira_epic_key.trim() } : {}), Object.keys(milestone_target_dates).length > 0 ? { milestone_target_dates } : {})).subscribe({
      next: (res) => {
        if (res.success) {
          this.showCreateForm = false;
          this.createSelectedWorkstream = null;
          this.createForm.reset();
          this.loadCycles();
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
  // ── Presentation helpers ───────────────────────────────────────────────────
  workstreamName(wsId) {
    return this.workstreams.find((w) => w.workstream_id === wsId)?.workstream_name ?? wsId;
  }
  // ── Getters and helpers added in view correction session 2026-04-09-D ──────────────
  /** My Cycles count — active cycles where current user is DS or CB. Source: D-HubCounts-2026-04-06. */
  get myCyclesCount() {
    const userId = this.profile.getCurrentProfile()?.id;
    if (!userId) {
      return 0;
    }
    return this.cycles.filter((c) => !this.TERMINAL_STAGES.includes(c.current_lifecycle_stage) && (c.assigned_ds_user_id === userId || c.assigned_cb_user_id === userId)).length;
  }
  /** Active filter count — for the badge on the Filters button. */
  get activeFilterCount() {
    let n = 0;
    if (this.filterStage) {
      n++;
    }
    if (this.filterTier) {
      n++;
    }
    if (this.filterWorkstream) {
      n++;
    }
    if (this.filterGateStatus) {
      n++;
    }
    if (this.filterAssignedPerson) {
      n++;
    }
    if (this.filterDivision) {
      n++;
    }
    return n;
  }
  // assignedPersonOptions getter removed — replaced by readonly field. Source: CC-Decision-2026-04-11-A.
  /** Toggle filter panel open/close. Block 1 freeze fix: markForCheck() required for OnPush. Source: CC-Decision-2026-04-11-A. */
  toggleFilterPanel() {
    this.showFilterPanel = !this.showFilterPanel;
    this.cdr.markForCheck();
  }
  /** Count card tap: My Cycles — sets assigned person filter, does NOT persist to memory. Source: D-HubCounts-2026-04-06. */
  onMyCyclesTap() {
    this.filterAssignedPerson = "my_cycles";
    this.applyFilters(false);
  }
  /** Count card tap: Overdue Gates — sets gate status filter, does NOT persist to memory. Source: D-HubCounts-2026-04-06. */
  onOverdueGatesTap() {
    this.filterGateStatus = "overdue";
    this.applyFilters(false);
  }
  /** Tier badge background per Visual Layout Standards 1.7 (border-radius 4px, not pill). */
  tierBadgeBg(tier) {
    if (tier === "tier_1") {
      return "#E3F2FD";
    }
    if (tier === "tier_2") {
      return "#E0F2F1";
    }
    return "#FFF3E0";
  }
  /** Tier badge text color per Visual Layout Standards 1.7. */
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
    return tier === "tier_1" ? "1" : tier === "tier_2" ? "2" : "3";
  }
  /** Safe stage label lookup — accepts plain string for filter chip display. */
  stageLabelFor(stage) {
    return STAGE_LABEL_MAP[stage] ?? stage;
  }
  tierPillBg(tier) {
    return tier === "tier_1" ? "#e3f2fd" : tier === "tier_2" ? "#f3e5f5" : "#e8f5e9";
  }
  // D-197: Avatar dot color — Tier 1 green, Tier 2 amber, Tier 3 teal (primary)
  tierDotColor(tier) {
    if (tier === "tier_1") {
      return "#4CAF50";
    }
    if (tier === "tier_2") {
      return "var(--triarq-color-sunray, #f5a623)";
    }
    return "var(--triarq-color-primary, #257099)";
  }
  // D-197: Tier pill color for badge in cycle name column
  tierPillColor(tier) {
    if (tier === "tier_1") {
      return "#4CAF50";
    }
    if (tier === "tier_2") {
      return "var(--triarq-color-sunray, #f5a623)";
    }
    return "var(--triarq-color-primary, #257099)";
  }
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
  /** Headline text color per spec: amber for awaiting gate, red for overdue, body for in-progress */
  headlineColor(cycle) {
    const stage = cycle.current_lifecycle_stage;
    if (stage === "COMPLETE" || stage === "CANCELLED") {
      return "var(--triarq-color-text-secondary)";
    }
    const blockedGate = cycle.gate_records?.find((g) => g.gate_status === "blocked");
    if (blockedGate) {
      return "var(--triarq-color-sunray,#f5a623)";
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const overdueMilestone = cycle.milestone_dates?.find((m) => m.target_date && !m.actual_date && m.target_date < today);
    if (overdueMilestone) {
      return "var(--triarq-color-error,#d32f2f)";
    }
    const pendingGate = cycle.gate_records?.find((g) => g.gate_status === "pending");
    if (pendingGate) {
      return "var(--triarq-color-sunray,#f5a623)";
    }
    return "var(--triarq-color-text-secondary)";
  }
  /**
   * Intelligent cycle headline — Session 2026-03-24-C, 6-rule priority order:
   * 1. Terminal states (COMPLETE, CANCELLED, ON_HOLD)
   * 2. Blocked gate — Workstream inactive
   * 3. Milestone target date overdue — no actual_date, target_date in the past
   * 4. Gate awaiting approval — gate_status = pending
   * 5. Post-deploy context anchor — Pilot Start Date when in late stages
   * 6. Default — "In [Stage Label]"
   */
  headline(cycle) {
    const stage = cycle.current_lifecycle_stage;
    if (stage === "COMPLETE") {
      return "Cycle complete";
    }
    if (stage === "CANCELLED") {
      return "Cycle cancelled";
    }
    if (stage === "ON_HOLD") {
      return "On hold";
    }
    const blockedGate = cycle.gate_records?.find((g) => g.gate_status === "blocked");
    if (blockedGate) {
      return `Gate blocked \u2014 ${GATE_LABELS[blockedGate.gate_name]} \xB7 Reactivate Workstream to continue`;
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const overdueMilestone = cycle.milestone_dates?.find((m) => m.target_date && !m.actual_date && m.target_date < today);
    if (overdueMilestone) {
      return `Target date overdue \u2014 ${GATE_LABELS[overdueMilestone.gate_name]}`;
    }
    const pendingGate = cycle.gate_records?.find((g) => g.gate_status === "pending");
    if (pendingGate) {
      return `Awaiting approval \u2014 ${GATE_LABELS[pendingGate.gate_name]}`;
    }
    if (POST_DEPLOY_STAGES.includes(stage)) {
      const pilotMilestone = cycle.milestone_dates?.find((m) => m.gate_name === "go_to_deploy");
      if (pilotMilestone?.actual_date) {
        return `Pilot started ${pilotMilestone.actual_date} \xB7 ${STAGE_LABEL_MAP[stage] ?? stage}`;
      }
      if (pilotMilestone?.target_date) {
        return `Pilot target ${pilotMilestone.target_date} \xB7 ${STAGE_LABEL_MAP[stage] ?? stage}`;
      }
    }
    return `In ${STAGE_LABEL_MAP[stage] ?? stage}`;
  }
  /** Build gate display state map from cycle's gate records */
  buildGateStateMap(cycle) {
    const gates = ["brief_review", "go_to_build", "go_to_deploy", "go_to_release", "close_review"];
    const map = {};
    for (const gate of gates) {
      const record = cycle.gate_records?.find((g) => g.gate_name === gate);
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
      if (record.gate_status === "pending" || record.gate_status === "returned") {
        map[gate] = "pending";
      } else {
        map[gate] = "upcoming";
      }
    }
    return map;
  }
  /**
   * Date display — Session 2026-03-24-B.
   * Shows actual_date if set, else target_date if set, else blank (no placeholder).
   */
  dateDisplay(cycle, gate) {
    const milestone = cycle.milestone_dates?.find((m) => m.gate_name === gate);
    if (!milestone) {
      return "";
    }
    return milestone.actual_date ?? milestone.target_date ?? "";
  }
  dateColor(cycle, gate) {
    const terminal = ["COMPLETE", "CANCELLED"].includes(cycle.current_lifecycle_stage);
    if (terminal) {
      return "var(--triarq-color-text-secondary)";
    }
    const milestone = cycle.milestone_dates?.find((m) => m.gate_name === gate);
    if (!milestone?.target_date) {
      return "var(--triarq-color-text-secondary)";
    }
    if (milestone.actual_date) {
      return "var(--triarq-color-text-secondary)";
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const diff = Math.ceil((new Date(milestone.target_date).getTime() - new Date(today).getTime()) / 864e5);
    if (diff < 0) {
      return "var(--triarq-color-error, #d32f2f)";
    }
    if (diff <= 4) {
      return "var(--triarq-color-sunray, #f5a623)";
    }
    return "var(--triarq-color-text-secondary)";
  }
  // ── Right panel — S-005/S-006 push/pop navigation ──────────────────────────
  /** Open the detail right panel for the given cycle. S-008: parent re-queries on close. */
  openCyclePanel(cycleId) {
    this.selectedCycleId = cycleId;
    this.cdr.markForCheck();
  }
  /** Close the detail right panel. S-008: unconditionally re-query cycles on close. */
  closePanel() {
    this.selectedCycleId = null;
    this.loadCycles();
    this.cdr.markForCheck();
  }
  ngOnDestroy() {
    this.profileSub?.unsubscribe();
  }
  static {
    this.\u0275fac = function DeliveryCycleDashboardComponent_Factory(t) {
      return new (t || _DeliveryCycleDashboardComponent)(i0.\u0275\u0275directiveInject(DeliveryService), i0.\u0275\u0275directiveInject(McpService), i0.\u0275\u0275directiveInject(UserProfileService), i0.\u0275\u0275directiveInject(i4.FormBuilder), i0.\u0275\u0275directiveInject(i5.ActivatedRoute), i0.\u0275\u0275directiveInject(i5.Router), i0.\u0275\u0275directiveInject(ScreenStateService), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _DeliveryCycleDashboardComponent, selectors: [["app-delivery-cycle-dashboard"]], standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 41, vars: 22, consts: [["noDsCell", ""], ["noCbCell", ""], [2, "display", "flex", "align-items", "flex-start", "min-height", "100%"], [2, "flex", "1", "min-width", "0", "max-width", "1200px", "padding", "var(--triarq-space-2xl) var(--triarq-space-md)"], [2, "margin-bottom", "var(--triarq-space-sm)"], ["routerLink", "/delivery", 2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)", "text-decoration", "none"], [2, "display", "flex", "align-items", "flex-start", "justify-content", "space-between", "margin-bottom", "var(--triarq-space-md)", "gap", "var(--triarq-space-md)"], [2, "margin", "0 0 4px 0"], [2, "margin", "0", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "max-width", "600px"], ["class", "oi-btn-primary", "style", "font-size:var(--triarq-text-small);white-space:nowrap;flex-shrink:0;", 3, "click", 4, "ngIf"], ["style", "position:relative;", 4, "ngIf"], [3, "cycleDivisionId", "isTrustLevelDivision", "currentWorkstreamId", "workstreamSelected", 4, "ngIf"], [2, "display", "flex", "gap", "16px", "margin-bottom", "16px", "flex-wrap", "wrap", "align-items", "flex-start"], [2, "background", "#fff", "border-radius", "8px", "box-shadow", "0 1px 3px rgba(0,0,0,0.08)", "padding", "12px", "min-width", "110px", "flex", "0 0 auto"], [2, "font-size", "28px", "font-weight", "700", "color", "var(--triarq-color-primary)", "line-height", "1.1"], [2, "font-size", "13px", "color", "#5A5A5A"], ["style", "background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);\n                    padding:12px;min-width:110px;flex:0 0 auto;cursor:pointer;", 3, "click", "mouseenter", "mouseleave", 4, "ngIf"], ["style", "display:flex;align-items:center;gap:var(--triarq-space-sm);flex-wrap:wrap;\n                  margin-bottom:var(--triarq-space-sm);padding:var(--triarq-space-xs) var(--triarq-space-sm);\n                  background:#e3f2fd;border-radius:6px;font-size:var(--triarq-text-small);", 4, "ngIf"], [2, "display", "flex", "align-items", "center", "gap", "8px", "flex-wrap", "wrap", "margin-bottom", "12px"], [2, "position", "relative", "background", "var(--triarq-color-primary,#257099)", "color", "#fff", "font-size", "14px", "font-family", "Roboto,sans-serif", "font-weight", "500", "border", "none", "border-radius", "5px", "padding", "10px 20px", "cursor", "pointer", 3, "click"], ["style", "position:absolute;top:-7px;right:-7px;\n                       background:#E96127;color:#fff;font-size:11px;font-weight:700;\n                       border-radius:999px;padding:1px 6px;min-width:18px;text-align:center;line-height:16px;", 4, "ngIf"], ["style", "display:inline-flex;align-items:center;gap:4px;background:#fff;\n                     border:1.5px solid var(--triarq-color-primary,#257099);\n                     color:var(--triarq-color-primary,#257099);border-radius:999px;\n                     padding:4px 12px;font-size:13px;", 4, "ngIf"], ["style", "position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.15);", 3, "click", 4, "ngIf"], ["style", "position:fixed;top:0;right:0;bottom:0;width:360px;background:#fff;\n                  box-shadow:-4px 0 24px rgba(0,0,0,0.14);z-index:1001;\n                  display:flex;flex-direction:column;overflow:hidden;", 3, "click", 4, "ngIf"], [4, "ngIf"], ["style", "padding:var(--triarq-space-md);max-width:600px;", 4, "ngIf"], ["style", "display:grid;\n                  grid-template-columns:48px 88px 180px 1fr 118px 88px 88px;\n                  gap:8px;padding:8px 16px;\n                  font-size:13px;font-weight:500;color:#fff;text-transform:uppercase;\n                  background:#12274A;border-radius:6px 6px 0 0;letter-spacing:0.3px;", 4, "ngIf"], [4, "ngFor", "ngForOf"], ["style", "display:grid;\n                  grid-template-columns:48px 88px 180px 1fr 118px 88px 88px;\n                  border-bottom:1px solid #E8E8E8;", 4, "ngIf"], ["style", "margin-top:var(--triarq-space-sm);\n                  font-size:var(--triarq-text-small);\n                  color:var(--triarq-color-text-secondary);", 4, "ngIf"], ["style", "width:60%;border-left:1px solid #E0E0E0;background:#fff;\n                position:sticky;top:0;height:100vh;overflow-y:auto;flex-shrink:0;", 4, "ngIf"], [1, "oi-btn-primary", 2, "font-size", "var(--triarq-text-small)", "white-space", "nowrap", "flex-shrink", "0", 3, "click"], [2, "position", "relative"], ["message", "Creating Cycle\u2026", 3, "visible"], [1, "oi-card", 2, "margin-bottom", "var(--triarq-space-md)", "padding", "0", "overflow", "hidden"], [2, "display", "flex", "align-items", "center", "justify-content", "space-between", "padding", "var(--triarq-space-sm) var(--triarq-space-md)", "background", "var(--triarq-color-navy,#1a3a4f)", "color", "#fff"], [2, "font-weight", "600", "font-size", "var(--triarq-text-body)"], ["type", "button", "title", "Close", 2, "background", "none", "border", "none", "cursor", "pointer", "color", "#fff", "font-size", "18px", "line-height", "1", "padding", "0 4px", 3, "click"], [2, "padding", "var(--triarq-space-md)"], [3, "ngSubmit", "formGroup"], [2, "display", "grid", "gap", "var(--triarq-space-sm)", "grid-template-columns", "1fr 2fr", "margin-bottom", "var(--triarq-space-sm)"], [2, "display", "block", "font-size", "var(--triarq-text-small)", "margin-bottom", "4px"], ["formControlName", "division_id", 1, "oi-input", 3, "change"], ["value", ""], [3, "value", 4, "ngFor", "ngForOf"], ["style", "color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;", 4, "ngIf"], ["formControlName", "cycle_title", "placeholder", "e.g. Member Attribution Model \u2014 Q2 Build", 1, "oi-input"], ["formControlName", "outcome_statement", "rows", "2", "placeholder", "What measurable result will this cycle deliver?", 1, "oi-input", 2, "resize", "vertical"], [2, "font-size", "12px", "color", "var(--triarq-color-stone,#8a9ba8)", "margin-top", "3px"], [2, "display", "flex", "align-items", "center", "gap", "var(--triarq-space-sm)"], ["type", "button", 1, "oi-input", 2, "text-align", "left", "cursor", "pointer", "background", "#fff", "flex", "1", 3, "click"], ["style", "color:var(--triarq-color-text-secondary);", 4, "ngIf"], ["type", "button", "style", "background:none;border:none;cursor:pointer;\n                               color:var(--triarq-color-text-secondary);font-size:12px;", "title", "Remove Workstream", 3, "click", 4, "ngIf"], [2, "margin-bottom", "var(--triarq-space-sm)", "max-width", "480px"], ["formControlName", "tier_classification", 1, "oi-input"], ["value", "tier_1"], ["value", "tier_2"], ["value", "tier_3"], [2, "margin-bottom", "var(--triarq-space-sm)", "max-width", "400px"], ["style", "font-size:var(--triarq-text-small);padding:6px var(--triarq-space-sm);\n                          background:var(--triarq-color-background-subtle);border-radius:5px;\n                          border:1px solid var(--triarq-color-border);", 4, "ngIf"], ["style", "font-size:var(--triarq-text-caption);color:var(--triarq-color-text-secondary);\n                          padding:6px 0;border:1px solid var(--triarq-color-border);\n                          border-radius:5px;padding:6px var(--triarq-space-sm);\n                          background:var(--triarq-color-background-subtle);", 4, "ngIf"], ["style", "font-size:var(--triarq-text-caption);color:var(--triarq-color-text-secondary);\n                          border:1px solid var(--triarq-color-border);\n                          border-radius:5px;padding:6px var(--triarq-space-sm);\n                          background:var(--triarq-color-background-subtle);", 4, "ngIf"], [2, "margin-bottom", "var(--triarq-space-sm)", "max-width", "300px"], ["formControlName", "jira_epic_key", "placeholder", "e.g. PROJ-123", 1, "oi-input"], [2, "font-size", "var(--triarq-text-small)", "font-weight", "500", "margin-bottom", "var(--triarq-space-xs)"], [2, "font-weight", "400", "color", "var(--triarq-color-text-secondary)"], [2, "display", "grid", "gap", "var(--triarq-space-sm)", "grid-template-columns", "repeat(5,1fr)"], [2, "display", "block", "font-size", "var(--triarq-text-caption)", "margin-bottom", "3px", "color", "var(--triarq-color-text-secondary)"], ["type", "date", "formControlName", "milestone_brief_review", 1, "oi-input", 2, "font-size", "var(--triarq-text-small)"], ["type", "date", "formControlName", "milestone_go_to_build", 1, "oi-input", 2, "font-size", "var(--triarq-text-small)"], ["type", "date", "formControlName", "milestone_go_to_deploy", 1, "oi-input", 2, "font-size", "var(--triarq-text-small)"], ["type", "date", "formControlName", "milestone_go_to_release", 1, "oi-input", 2, "font-size", "var(--triarq-text-small)"], ["type", "date", "formControlName", "milestone_close_review", 1, "oi-input", 2, "font-size", "var(--triarq-text-small)"], [2, "display", "flex", "gap", "var(--triarq-space-sm)", "align-items", "center", "margin-top", "var(--triarq-space-sm)"], ["type", "submit", 1, "oi-btn-primary", 3, "disabled"], ["name", "crescent", "style", "width:16px;height:16px;vertical-align:middle;margin-right:6px;", 4, "ngIf"], ["style", "font-size:var(--triarq-text-small);", 4, "ngIf"], [3, "value"], [2, "color", "var(--triarq-color-error)", "font-size", "var(--triarq-text-small)", "margin-top", "2px"], [2, "color", "var(--triarq-color-text-secondary)"], [2, "font-size", "10px", "color", "var(--triarq-color-text-secondary)", "margin-left", "4px"], ["type", "button", "title", "Remove Workstream", 2, "background", "none", "border", "none", "cursor", "pointer", "color", "var(--triarq-color-text-secondary)", "font-size", "12px", 3, "click"], [2, "font-size", "var(--triarq-text-small)", "padding", "6px var(--triarq-space-sm)", "background", "var(--triarq-color-background-subtle)", "border-radius", "5px", "border", "1px solid var(--triarq-color-border)"], [2, "font-size", "var(--triarq-text-caption)", "color", "var(--triarq-color-text-secondary)", "margin-left", "6px"], [2, "font-size", "var(--triarq-text-caption)", "color", "var(--triarq-color-text-secondary)", "padding", "6px 0", "border", "1px solid var(--triarq-color-border)", "border-radius", "5px", "padding", "6px var(--triarq-space-sm)", "background", "var(--triarq-color-background-subtle)"], [2, "font-size", "var(--triarq-text-caption)", "color", "var(--triarq-color-text-secondary)", "border", "1px solid var(--triarq-color-border)", "border-radius", "5px", "padding", "6px var(--triarq-space-sm)", "background", "var(--triarq-color-background-subtle)"], ["name", "crescent", 2, "width", "16px", "height", "16px", "vertical-align", "middle", "margin-right", "6px"], [2, "font-size", "var(--triarq-text-small)"], [2, "color", "var(--triarq-color-error)", "font-weight", "500"], [2, "color", "var(--triarq-color-text-secondary)", "margin-left", "6px"], [3, "workstreamSelected", "cycleDivisionId", "isTrustLevelDivision", "currentWorkstreamId"], [2, "background", "#fff", "border-radius", "8px", "box-shadow", "0 1px 3px rgba(0,0,0,0.08)", "padding", "12px", "min-width", "110px", "flex", "0 0 auto", "cursor", "pointer", 3, "click", "mouseenter", "mouseleave"], [2, "font-size", "28px", "font-weight", "700", "color", "var(--triarq-color-sunray,#F2A620)", "line-height", "1.1"], [2, "display", "flex", "align-items", "center", "gap", "var(--triarq-space-sm)", "flex-wrap", "wrap", "margin-bottom", "var(--triarq-space-sm)", "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "background", "#e3f2fd", "border-radius", "6px", "font-size", "var(--triarq-text-small)"], [2, "color", "var(--triarq-color-primary)", "font-weight", "500"], ["style", "display:inline-flex;align-items:center;gap:4px;\n                     padding:2px 8px;border-radius:999px;\n                     background:rgba(37,112,153,0.12);color:var(--triarq-color-primary);", 4, "ngIf"], [2, "margin-left", "auto", "font-size", "var(--triarq-text-small)", "background", "none", "border", "none", "cursor", "pointer", "color", "var(--triarq-color-text-secondary)", "text-decoration", "underline", 3, "click"], [2, "display", "inline-flex", "align-items", "center", "gap", "4px", "padding", "2px 8px", "border-radius", "999px", "background", "rgba(37,112,153,0.12)", "color", "var(--triarq-color-primary)"], [2, "background", "none", "border", "none", "cursor", "pointer", "font-size", "12px", "color", "var(--triarq-color-primary)", "padding", "0", "line-height", "1", 3, "click"], [2, "position", "absolute", "top", "-7px", "right", "-7px", "background", "#E96127", "color", "#fff", "font-size", "11px", "font-weight", "700", "border-radius", "999px", "padding", "1px 6px", "min-width", "18px", "text-align", "center", "line-height", "16px"], [2, "display", "inline-flex", "align-items", "center", "gap", "4px", "background", "#fff", "border", "1.5px solid var(--triarq-color-primary,#257099)", "color", "var(--triarq-color-primary,#257099)", "border-radius", "999px", "padding", "4px 12px", "font-size", "13px"], [2, "background", "none", "border", "none", "cursor", "pointer", "color", "inherit", "padding", "0", "font-size", "16px", "line-height", "1", 3, "click"], [2, "position", "fixed", "inset", "0", "z-index", "1000", "background", "rgba(0,0,0,0.15)", 3, "click"], [2, "position", "fixed", "top", "0", "right", "0", "bottom", "0", "width", "360px", "background", "#fff", "box-shadow", "-4px 0 24px rgba(0,0,0,0.14)", "z-index", "1001", "display", "flex", "flex-direction", "column", "overflow", "hidden", 3, "click"], [2, "background", "#12274A", "color", "#fff", "padding", "16px 20px", "display", "flex", "align-items", "center", "justify-content", "space-between", "flex-shrink", "0"], [2, "font-size", "16px", "font-weight", "500"], [2, "background", "none", "border", "none", "color", "#fff", "font-size", "22px", "cursor", "pointer", "padding", "0", "line-height", "1", 3, "click"], [2, "flex", "1", "overflow-y", "auto", "padding", "16px 20px"], [2, "margin-bottom", "20px"], [2, "font-size", "13px", "font-weight", "500", "color", "#5A5A5A", "margin-bottom", "8px", "text-transform", "uppercase", "letter-spacing", "1px"], [1, "oi-input", 2, "width", "100%", 3, "ngModelChange", "ngModel"], [2, "display", "flex", "align-items", "center", "gap", "6px", "margin-top", "8px", "font-size", "13px", "color", "#5A5A5A", "cursor", "pointer"], ["type", "checkbox", 3, "ngModelChange", "ngModel"], [2, "display", "flex", "flex-direction", "column", "gap", "8px"], ["style", "display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#1E1E1E;", 4, "ngFor", "ngForOf"], ["value", "overdue"], ["value", "pending"], ["value", "approved"], [2, "display", "flex", "align-items", "center", "gap", "8px", "cursor", "pointer", "font-size", "14px", "color", "#1E1E1E"], ["type", "radio", "value", "", 3, "ngModelChange", "ngModel"], ["type", "radio", "value", "tier_1", 3, "ngModelChange", "ngModel"], [2, "display", "inline-block", "width", "10px", "height", "10px", "border-radius", "50%", "background", "#4CAF50", "flex-shrink", "0"], ["type", "radio", "value", "tier_2", 3, "ngModelChange", "ngModel"], [2, "display", "inline-block", "width", "10px", "height", "10px", "border-radius", "50%", "background", "var(--triarq-color-sunray,#F2A620)", "flex-shrink", "0"], ["type", "radio", "value", "tier_3", 3, "ngModelChange", "ngModel"], [2, "display", "inline-block", "width", "10px", "height", "10px", "border-radius", "50%", "background", "var(--triarq-color-primary,#257099)", "flex-shrink", "0"], ["value", "__none__"], ["label", "Active", 4, "ngIf"], ["label", "Inactive", 4, "ngIf"], [2, "padding", "12px 20px", "border-top", "1px solid #E8E8E8", "flex-shrink", "0", "display", "flex", "gap", "8px", "justify-content", "flex-end"], [2, "background", "#fff", "border", "1px solid #D0D0D0", "color", "#5A5A5A", "border-radius", "5px", "padding", "8px 16px", "cursor", "pointer", "font-size", "14px", 3, "click"], [2, "background", "var(--triarq-color-primary,#257099)", "color", "#fff", "border", "none", "border-radius", "5px", "padding", "8px 20px", "cursor", "pointer", "font-size", "14px", "font-weight", "500", 3, "click"], ["type", "radio", 3, "ngModelChange", "value", "ngModel"], ["label", "Active"], ["label", "Inactive"], ["style", "display:grid;grid-template-columns:48px 88px 180px 1fr 118px 88px 88px;\n                    gap:8px;padding:16px;\n                    border-bottom:1px solid var(--triarq-color-border);align-items:center;", 4, "ngFor", "ngForOf"], [2, "display", "grid", "grid-template-columns", "48px 88px 180px 1fr 118px 88px 88px", "gap", "8px", "padding", "16px", "border-bottom", "1px solid var(--triarq-color-border)", "align-items", "center"], ["animated", "", 2, "height", "40px", "border-radius", "50%", "width", "40px"], ["animated", "", 2, "height", "20px", "border-radius", "4px", "width", "70px"], ["animated", "", 2, "height", "16px", "border-radius", "4px"], ["animated", "", 2, "height", "40px", "border-radius", "4px"], ["animated", "", 2, "height", "20px", "border-radius", "4px"], [2, "padding", "var(--triarq-space-md)", "max-width", "600px"], [2, "color", "var(--triarq-color-error)", "font-weight", "500", "margin-bottom", "4px"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], [2, "display", "grid", "grid-template-columns", "48px 88px 180px 1fr 118px 88px 88px", "gap", "8px", "padding", "8px 16px", "font-size", "13px", "font-weight", "500", "color", "#fff", "text-transform", "uppercase", "background", "#12274A", "border-radius", "6px 6px 0 0", "letter-spacing", "0.3px"], [2, "display", "grid", "grid-template-columns", "48px 88px 180px 1fr 118px 88px 88px", "gap", "8px", "padding", "16px", "border-bottom", "1px solid #E8E8E8", "align-items", "start", "cursor", "pointer", "min-height", "88px", 3, "click", "mouseenter", "mouseleave"], [2, "display", "flex", "justify-content", "center", "align-items", "flex-start", "padding-top", "4px"], [2, "width", "48px", "height", "48px", "border-radius", "50%", "flex-shrink", "0"], [2, "overflow", "hidden", "padding-top", "6px"], [2, "display", "inline-block", "padding", "2px 6px", "border-radius", "4px", "background", "rgba(90,90,90,0.08)", "color", "#5A5A5A", "font-size", "11px", "white-space", "nowrap", "overflow", "hidden", "text-overflow", "ellipsis", "max-width", "80px", "cursor", "pointer", 3, "title"], [2, "font-size", "14px", "font-weight", "600", "color", "#1E1E1E", "margin-bottom", "4px", "display", "-webkit-box", "-webkit-line-clamp", "2", "-webkit-box-orient", "vertical", "overflow", "hidden", 3, "title"], [2, "display", "inline-block", "border-radius", "4px", "padding", "3px 8px", "font-size", "12px", "font-weight", "500"], [2, "display", "flex", "align-items", "flex-start", "gap", "4px", "overflow", "hidden", "padding-top", "2px"], ["style", "display:inline-block;width:8px;height:8px;flex-shrink:0;margin-top:4px;\n                         border-radius:50%;background:var(--triarq-color-sunray,#F2A620);", "title", "Outcome Statement not set", 4, "ngIf"], [2, "font-size", "13px", "color", "#5A5A5A", "white-space", "nowrap", "overflow", "hidden", "text-overflow", "ellipsis"], [2, "overflow", "hidden", 3, "click"], [2, "font-size", "13px", "color", "#5A5A5A", "margin-bottom", "2px", "white-space", "nowrap", "overflow", "hidden", "text-overflow", "ellipsis"], ["displayMode", "condensed", 3, "currentStageId", "gateStateMap"], [2, "font-size", "11px", "margin-top", "2px", "white-space", "nowrap", "overflow", "hidden", "text-overflow", "ellipsis"], [2, "overflow", "hidden", "padding-top", "6px", 3, "click"], ["style", "display:inline-block;padding:2px 6px;border-radius:4px;\n                         background:rgba(37,112,153,0.08);color:#257099;font-size:11px;\n                         white-space:nowrap;overflow:hidden;text-overflow:ellipsis;\n                         max-width:84px;cursor:default;", 3, "title", 4, "ngIf", "ngIfElse"], ["title", "Outcome Statement not set", 2, "display", "inline-block", "width", "8px", "height", "8px", "flex-shrink", "0", "margin-top", "4px", "border-radius", "50%", "background", "var(--triarq-color-sunray,#F2A620)"], [2, "display", "inline-block", "padding", "2px 6px", "border-radius", "4px", "background", "rgba(37,112,153,0.08)", "color", "#257099", "font-size", "11px", "white-space", "nowrap", "overflow", "hidden", "text-overflow", "ellipsis", "max-width", "84px", "cursor", "default", 3, "title"], [2, "color", "#9E9E9E", "font-style", "italic", "font-size", "11px"], [2, "display", "grid", "grid-template-columns", "48px 88px 180px 1fr 118px 88px 88px", "border-bottom", "1px solid #E8E8E8"], [2, "grid-column", "1/-1", "min-height", "200px", "display", "flex", "flex-direction", "column", "align-items", "center", "justify-content", "center", "padding", "var(--triarq-space-xl) var(--triarq-space-md)", "text-align", "center"], [2, "font-size", "40px", "margin-bottom", "var(--triarq-space-sm)"], [2, "font-weight", "500", "color", "var(--triarq-color-text-primary)", "margin-bottom", "6px"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "max-width", "400px", "line-height", "1.6"], [2, "color", "var(--triarq-color-primary)", "cursor", "pointer", "text-decoration", "underline", "margin-left", "4px", 3, "click"], [2, "margin-top", "var(--triarq-space-sm)", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], [2, "width", "60%", "border-left", "1px solid #E0E0E0", "background", "#fff", "position", "sticky", "top", "0", "height", "100vh", "overflow-y", "auto", "flex-shrink", "0"], [3, "close", "cycleId"]], template: function DeliveryCycleDashboardComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 2)(1, "div", 3)(2, "div", 4)(3, "a", 5);
        i0.\u0275\u0275text(4, " \u2190 Delivery Cycle Tracking ");
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275elementStart(5, "div", 6)(6, "div")(7, "h3", 7);
        i0.\u0275\u0275text(8, "Delivery Cycles");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(9, "p", 8);
        i0.\u0275\u0275text(10, " Each row is one active Delivery Cycle \u2014 a scoped unit of work moving through the 12-stage lifecycle. Click a row to open the full cycle record, set milestone dates, review gate decisions, and attach artifacts. ");
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275template(11, DeliveryCycleDashboardComponent_button_11_Template, 2, 0, "button", 9);
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275template(12, DeliveryCycleDashboardComponent_div_12_Template, 105, 17, "div", 10)(13, DeliveryCycleDashboardComponent_app_workstream_picker_13_Template, 1, 3, "app-workstream-picker", 11);
        i0.\u0275\u0275elementStart(14, "div", 12)(15, "div", 13)(16, "div", 14);
        i0.\u0275\u0275text(17);
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(18, "div", 15);
        i0.\u0275\u0275text(19, "Active Cycles");
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275template(20, DeliveryCycleDashboardComponent_div_20_Template, 5, 1, "div", 16)(21, DeliveryCycleDashboardComponent_div_21_Template, 5, 1, "div", 16);
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275template(22, DeliveryCycleDashboardComponent_div_22_Template, 8, 3, "div", 17);
        i0.\u0275\u0275elementStart(23, "div", 18)(24, "button", 19);
        i0.\u0275\u0275listener("click", function DeliveryCycleDashboardComponent_Template_button_click_24_listener() {
          return ctx.toggleFilterPanel();
        });
        i0.\u0275\u0275text(25, " Filters ");
        i0.\u0275\u0275template(26, DeliveryCycleDashboardComponent_span_26_Template, 2, 1, "span", 20);
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275template(27, DeliveryCycleDashboardComponent_span_27_Template, 4, 1, "span", 21)(28, DeliveryCycleDashboardComponent_span_28_Template, 4, 1, "span", 21)(29, DeliveryCycleDashboardComponent_span_29_Template, 4, 1, "span", 21)(30, DeliveryCycleDashboardComponent_span_30_Template, 4, 1, "span", 21)(31, DeliveryCycleDashboardComponent_span_31_Template, 4, 1, "span", 21);
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275template(32, DeliveryCycleDashboardComponent_div_32_Template, 1, 0, "div", 22)(33, DeliveryCycleDashboardComponent_div_33_Template, 75, 14, "div", 23)(34, DeliveryCycleDashboardComponent_div_34_Template, 2, 1, "div", 24)(35, DeliveryCycleDashboardComponent_div_35_Template, 5, 1, "div", 25)(36, DeliveryCycleDashboardComponent_div_36_Template, 14, 0, "div", 26)(37, DeliveryCycleDashboardComponent_div_37_Template, 30, 27, "div", 27)(38, DeliveryCycleDashboardComponent_div_38_Template, 5, 3, "div", 28)(39, DeliveryCycleDashboardComponent_div_39_Template, 5, 4, "div", 29);
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275template(40, DeliveryCycleDashboardComponent_div_40_Template, 2, 1, "div", 30);
        i0.\u0275\u0275elementEnd();
      }
      if (rf & 2) {
        i0.\u0275\u0275advance(11);
        i0.\u0275\u0275property("ngIf", ctx.canCreateCycle);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.showCreateForm);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.showWorkstreamPicker);
        i0.\u0275\u0275advance(4);
        i0.\u0275\u0275textInterpolate1(" ", ctx.activeCycleCount, " ");
        i0.\u0275\u0275advance(3);
        i0.\u0275\u0275property("ngIf", ctx.myCyclesCount > 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.overdueGateCount > 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.drillDownActive);
        i0.\u0275\u0275advance(4);
        i0.\u0275\u0275property("ngIf", ctx.activeFilterCount > 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.filterStage);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.filterTier);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.filterWorkstream);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.filterGateStatus);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.filterAssignedPerson);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.showFilterPanel);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.showFilterPanel);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.loadError && !ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngForOf", ctx.filtered);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && !ctx.loadError && ctx.filtered.length === 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && ctx.cycles.length > 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.selectedCycleId);
      }
    }, dependencies: [CommonModule, i7.NgForOf, i7.NgIf, RouterModule, i5.RouterLink, ReactiveFormsModule, i4.\u0275NgNoValidate, i4.NgSelectOption, i4.\u0275NgSelectMultipleOption, i4.DefaultValueAccessor, i4.CheckboxControlValueAccessor, i4.SelectControlValueAccessor, i4.RadioControlValueAccessor, i4.NgControlStatus, i4.NgControlStatusGroup, i4.FormGroupDirective, i4.FormControlName, FormsModule, i4.NgModel, IonicModule, IonSkeletonText, IonSpinner, RouterLinkWithHrefDelegateDirective, StageTrackComponent, LoadingOverlayComponent, WorkstreamPickerComponent, DeliveryCycleDetailComponent], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(DeliveryCycleDashboardComponent, { className: "DeliveryCycleDashboardComponent", filePath: "src\\app\\features\\delivery\\dashboard\\delivery-cycle-dashboard.component.ts", lineNumber: 892 });
})();
export {
  DeliveryCycleDashboardComponent
};
//# sourceMappingURL=delivery-cycle-dashboard.component-ICSSFFAT.js.map
