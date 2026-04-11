import {
  LoadingOverlayComponent
} from "./chunk-CPG53S23.js";
import {
  UserProfileService
} from "./chunk-G46Y23DK.js";
import {
  BlockedActionComponent
} from "./chunk-QFRGV5EL.js";
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

// src/app/features/admin/users/users.component.ts
import { Component, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ReactiveFormsModule, FormControl, Validators } from "@angular/forms";
import * as i0 from "@angular/core";
import * as i3 from "@angular/forms";
import * as i4 from "@angular/common";
import * as i5 from "@angular/router";
function UsersComponent_app_blocked_action_6_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "app-blocked-action", 12);
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275property("primaryMessage", ctx_r0.blockedMessage)("secondaryMessage", ctx_r0.blockedHint);
  }
}
function UsersComponent_div_7_div_11_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 34);
    i0.\u0275\u0275text(1, "Valid email is required.");
    i0.\u0275\u0275elementEnd();
  }
}
function UsersComponent_div_7_div_16_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 34);
    i0.\u0275\u0275text(1, "Display name is required.");
    i0.\u0275\u0275elementEnd();
  }
}
function UsersComponent_div_7_div_31_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 34);
    i0.\u0275\u0275text(1, "Role is required.");
    i0.\u0275\u0275elementEnd();
  }
}
function UsersComponent_div_7_ion_spinner_34_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "ion-spinner", 35);
  }
}
function UsersComponent_div_7_span_36_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 36);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r0.inviteError);
  }
}
function UsersComponent_div_7_span_37_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 37);
    i0.\u0275\u0275text(1, "User created. They can sign in now with their @triarqhealth.com email.");
    i0.\u0275\u0275elementEnd();
  }
}
function UsersComponent_div_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 13);
    i0.\u0275\u0275element(1, "app-loading-overlay", 14);
    i0.\u0275\u0275elementStart(2, "div", 15)(3, "h4", 16);
    i0.\u0275\u0275text(4, " Add New User ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "form", 17);
    i0.\u0275\u0275listener("ngSubmit", function UsersComponent_div_7_Template_form_ngSubmit_5_listener() {
      i0.\u0275\u0275restoreView(_r2);
      const ctx_r0 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r0.submitInvite());
    });
    i0.\u0275\u0275elementStart(6, "div", 18)(7, "div")(8, "label", 19);
    i0.\u0275\u0275text(9, " Email Address * ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(10, "input", 20);
    i0.\u0275\u0275template(11, UsersComponent_div_7_div_11_Template, 2, 0, "div", 21);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(12, "div")(13, "label", 19);
    i0.\u0275\u0275text(14, " Display Name * ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(15, "input", 22);
    i0.\u0275\u0275template(16, UsersComponent_div_7_div_16_Template, 2, 0, "div", 21);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(17, "div")(18, "label", 19);
    i0.\u0275\u0275text(19, " System Role * ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(20, "select", 23)(21, "option", 24);
    i0.\u0275\u0275text(22, "\u2014 Select role \u2014");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(23, "option", 25);
    i0.\u0275\u0275text(24, "DS \u2014 Domain Strategist");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(25, "option", 26);
    i0.\u0275\u0275text(26, "CB \u2014 Capability Builder");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(27, "option", 27);
    i0.\u0275\u0275text(28, "CE \u2014 Context Engineer");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(29, "option", 28);
    i0.\u0275\u0275text(30, "Admin");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275template(31, UsersComponent_div_7_div_31_Template, 2, 0, "div", 21);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(32, "div", 29)(33, "button", 30);
    i0.\u0275\u0275template(34, UsersComponent_div_7_ion_spinner_34_Template, 1, 0, "ion-spinner", 31);
    i0.\u0275\u0275text(35);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(36, UsersComponent_div_7_span_36_Template, 2, 1, "span", 32)(37, UsersComponent_div_7_span_37_Template, 2, 0, "span", 33);
    i0.\u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_4_0;
    let tmp_5_0;
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("visible", ctx_r0.inviting);
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275property("formGroup", ctx_r0.inviteForm);
    i0.\u0275\u0275advance(6);
    i0.\u0275\u0275property("ngIf", ((tmp_3_0 = ctx_r0.inviteForm.get("email")) == null ? null : tmp_3_0.invalid) && ((tmp_3_0 = ctx_r0.inviteForm.get("email")) == null ? null : tmp_3_0.touched));
    i0.\u0275\u0275advance(5);
    i0.\u0275\u0275property("ngIf", ((tmp_4_0 = ctx_r0.inviteForm.get("display_name")) == null ? null : tmp_4_0.invalid) && ((tmp_4_0 = ctx_r0.inviteForm.get("display_name")) == null ? null : tmp_4_0.touched));
    i0.\u0275\u0275advance(15);
    i0.\u0275\u0275property("ngIf", ((tmp_5_0 = ctx_r0.inviteForm.get("system_role")) == null ? null : tmp_5_0.invalid) && ((tmp_5_0 = ctx_r0.inviteForm.get("system_role")) == null ? null : tmp_5_0.touched));
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("disabled", ctx_r0.inviteForm.invalid || ctx_r0.inviting);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.inviting);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r0.inviting ? "Creating\u2026" : "Create User", " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.inviteError);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.inviteSuccess);
  }
}
function UsersComponent_div_8_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 39);
    i0.\u0275\u0275element(1, "ion-skeleton-text", 40)(2, "ion-skeleton-text", 40)(3, "ion-skeleton-text", 41)(4, "ion-skeleton-text", 42)(5, "ion-skeleton-text", 40);
    i0.\u0275\u0275elementEnd();
  }
}
function UsersComponent_div_8_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div");
    i0.\u0275\u0275template(1, UsersComponent_div_8_div_1_Template, 6, 0, "div", 38);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r0.skeletonRows);
  }
}
function UsersComponent_div_9_span_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "span", 46);
    i0.\u0275\u0275listener("click", function UsersComponent_div_9_span_3_Template_span_click_0_listener() {
      const f_r4 = i0.\u0275\u0275restoreView(_r3).$implicit;
      const ctx_r0 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r0.setRoleFilter(f_r4.value));
    });
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const f_r4 = ctx.$implicit;
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275styleProp("background", ctx_r0.roleFilter === f_r4.value ? "var(--triarq-color-primary)" : "var(--triarq-color-background-subtle)")("color", ctx_r0.roleFilter === f_r4.value ? "#fff" : "var(--triarq-color-text-secondary)");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(f_r4.label);
  }
}
function UsersComponent_div_9_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 43)(1, "span", 44);
    i0.\u0275\u0275text(2, "Role:");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(3, UsersComponent_div_9_span_3_Template, 2, 5, "span", 45);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275property("ngForOf", ctx_r0.roleFilters);
  }
}
function UsersComponent_div_10_div_11_div_17_ion_spinner_33_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "ion-spinner", 68);
  }
}
function UsersComponent_div_10_div_11_div_17_div_35_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 69);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(4);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r0.editError);
  }
}
function UsersComponent_div_10_div_11_div_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 13);
    i0.\u0275\u0275element(1, "app-loading-overlay", 58);
    i0.\u0275\u0275elementStart(2, "div", 59)(3, "form", 17);
    i0.\u0275\u0275listener("ngSubmit", function UsersComponent_div_10_div_11_div_17_Template_form_ngSubmit_3_listener() {
      i0.\u0275\u0275restoreView(_r8);
      const ctx_r0 = i0.\u0275\u0275nextContext(3);
      return i0.\u0275\u0275resetView(ctx_r0.submitEdit());
    });
    i0.\u0275\u0275elementStart(4, "div", 60)(5, "div")(6, "label", 19);
    i0.\u0275\u0275text(7, " Display Name * ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(8, "input", 61);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(9, "div")(10, "label", 19);
    i0.\u0275\u0275text(11, " Role * ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(12, "select", 23)(13, "option", 25);
    i0.\u0275\u0275text(14, "DS \u2014 Domain Strategist");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(15, "option", 26);
    i0.\u0275\u0275text(16, "CB \u2014 Capability Builder");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(17, "option", 27);
    i0.\u0275\u0275text(18, "CE \u2014 Context Engineer");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(19, "option", 28);
    i0.\u0275\u0275text(20, "Admin");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(21, "option", 62);
    i0.\u0275\u0275text(22, "Phil");
    i0.\u0275\u0275elementEnd()()();
    i0.\u0275\u0275elementStart(23, "div")(24, "label", 19);
    i0.\u0275\u0275text(25, " Status ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(26, "select", 63)(27, "option", 64);
    i0.\u0275\u0275text(28, "Active");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(29, "option", 64);
    i0.\u0275\u0275text(30, "Inactive");
    i0.\u0275\u0275elementEnd()()();
    i0.\u0275\u0275elementStart(31, "div")(32, "button", 65);
    i0.\u0275\u0275template(33, UsersComponent_div_10_div_11_div_17_ion_spinner_33_Template, 1, 0, "ion-spinner", 66);
    i0.\u0275\u0275text(34);
    i0.\u0275\u0275elementEnd()()();
    i0.\u0275\u0275template(35, UsersComponent_div_10_div_11_div_17_div_35_Template, 2, 1, "div", 67);
    i0.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(3);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("visible", ctx_r0.saving);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("formGroup", ctx_r0.editForm);
    i0.\u0275\u0275advance(24);
    i0.\u0275\u0275property("ngValue", true);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngValue", false);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275property("disabled", ctx_r0.editForm.invalid || ctx_r0.saving);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.saving);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r0.saving ? "Saving\u2026" : "Save", " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.editError);
  }
}
function UsersComponent_div_10_div_11_div_18_div_3_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 72);
    i0.\u0275\u0275text(1, "Loading\u2026");
    i0.\u0275\u0275elementEnd();
  }
}
function UsersComponent_div_10_div_11_div_18_div_4_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 77);
    i0.\u0275\u0275text(1, "Not assigned to any Division.");
    i0.\u0275\u0275elementEnd();
  }
}
function UsersComponent_div_10_div_11_div_18_div_4_div_2_span_1_ion_spinner_3_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "ion-spinner", 83);
  }
}
function UsersComponent_div_10_div_11_div_18_div_4_div_2_span_1_span_4_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1, "\xD7");
    i0.\u0275\u0275elementEnd();
  }
}
function UsersComponent_div_10_div_11_div_18_div_4_div_2_span_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "span", 80);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementStart(2, "button", 81);
    i0.\u0275\u0275listener("click", function UsersComponent_div_10_div_11_div_18_div_4_div_2_span_1_Template_button_click_2_listener() {
      const div_r10 = i0.\u0275\u0275restoreView(_r9).$implicit;
      const ctx_r0 = i0.\u0275\u0275nextContext(6);
      return i0.\u0275\u0275resetView(ctx_r0.revokeAssignment(div_r10.id));
    });
    i0.\u0275\u0275template(3, UsersComponent_div_10_div_11_div_18_div_4_div_2_span_1_ion_spinner_3_Template, 1, 0, "ion-spinner", 82)(4, UsersComponent_div_10_div_11_div_18_div_4_div_2_span_1_span_4_Template, 2, 0, "span", 6);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const div_r10 = ctx.$implicit;
    const ctx_r0 = i0.\u0275\u0275nextContext(6);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", div_r10.division_name, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("disabled", ctx_r0.revokingDivisionId === div_r10.id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.revokingDivisionId === div_r10.id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.revokingDivisionId !== div_r10.id);
  }
}
function UsersComponent_div_10_div_11_div_18_div_4_div_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 78);
    i0.\u0275\u0275template(1, UsersComponent_div_10_div_11_div_18_div_4_div_2_span_1_Template, 5, 4, "span", 79);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(5);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r0.userDirectDivisions);
  }
}
function UsersComponent_div_10_div_11_div_18_div_4_div_3_option_4_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "option", 88);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const t_r12 = ctx.$implicit;
    i0.\u0275\u0275property("value", t_r12.id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", t_r12.division_name, " ");
  }
}
function UsersComponent_div_10_div_11_div_18_div_4_div_3_ion_spinner_6_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "ion-spinner", 68);
  }
}
function UsersComponent_div_10_div_11_div_18_div_4_div_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 84)(1, "select", 85)(2, "option", 24);
    i0.\u0275\u0275text(3, "\u2014 Assign a Trust \u2014");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(4, UsersComponent_div_10_div_11_div_18_div_4_div_3_option_4_Template, 2, 2, "option", 86);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "button", 87);
    i0.\u0275\u0275listener("click", function UsersComponent_div_10_div_11_div_18_div_4_div_3_Template_button_click_5_listener() {
      i0.\u0275\u0275restoreView(_r11);
      const ctx_r0 = i0.\u0275\u0275nextContext(5);
      return i0.\u0275\u0275resetView(ctx_r0.submitAssign());
    });
    i0.\u0275\u0275template(6, UsersComponent_div_10_div_11_div_18_div_4_div_3_ion_spinner_6_Template, 1, 0, "ion-spinner", 66);
    i0.\u0275\u0275text(7);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(5);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("formControl", ctx_r0.trustPickerControl);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275property("ngForOf", ctx_r0.availableTrusts);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("disabled", !ctx_r0.trustPickerControl.value || ctx_r0.assigning);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.assigning);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r0.assigning ? "Assigning\u2026" : "Assign", " ");
  }
}
function UsersComponent_div_10_div_11_div_18_div_4_div_4_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 72);
    i0.\u0275\u0275text(1, "Assigned to all available Trusts.");
    i0.\u0275\u0275elementEnd();
  }
}
function UsersComponent_div_10_div_11_div_18_div_4_div_5_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 69);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(5);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r0.assignError);
  }
}
function UsersComponent_div_10_div_11_div_18_div_4_div_6_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 69);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(5);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r0.membershipsError);
  }
}
function UsersComponent_div_10_div_11_div_18_div_4_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div");
    i0.\u0275\u0275template(1, UsersComponent_div_10_div_11_div_18_div_4_div_1_Template, 2, 0, "div", 73)(2, UsersComponent_div_10_div_11_div_18_div_4_div_2_Template, 2, 1, "div", 74)(3, UsersComponent_div_10_div_11_div_18_div_4_div_3_Template, 8, 5, "div", 75)(4, UsersComponent_div_10_div_11_div_18_div_4_div_4_Template, 2, 0, "div", 71)(5, UsersComponent_div_10_div_11_div_18_div_4_div_5_Template, 2, 1, "div", 76)(6, UsersComponent_div_10_div_11_div_18_div_4_div_6_Template, 2, 1, "div", 76);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(4);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.userDirectDivisions.length === 0);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.userDirectDivisions.length > 0);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.availableTrusts.length > 0);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.availableTrusts.length === 0 && !ctx_r0.loadingMemberships);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.assignError);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.membershipsError);
  }
}
function UsersComponent_div_10_div_11_div_18_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 59)(1, "div", 70);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(3, UsersComponent_div_10_div_11_div_18_div_3_Template, 2, 0, "div", 71)(4, UsersComponent_div_10_div_11_div_18_div_4_Template, 7, 6, "div", 6);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const user_r7 = i0.\u0275\u0275nextContext().$implicit;
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" Division Assignments \u2014 ", user_r7.display_name, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.loadingMemberships);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", !ctx_r0.loadingMemberships);
  }
}
function UsersComponent_div_10_div_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div")(1, "div", 51)(2, "span", 52);
    i0.\u0275\u0275text(3);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(4, "span", 53);
    i0.\u0275\u0275text(5);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(6, "span")(7, "span", 54);
    i0.\u0275\u0275text(8);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(9, "span")(10, "span", 54);
    i0.\u0275\u0275text(11);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(12, "span", 55)(13, "button", 56);
    i0.\u0275\u0275listener("click", function UsersComponent_div_10_div_11_Template_button_click_13_listener() {
      const user_r7 = i0.\u0275\u0275restoreView(_r6).$implicit;
      const ctx_r0 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r0.editingUserId === user_r7.id ? ctx_r0.cancelEdit() : ctx_r0.startEdit(user_r7));
    });
    i0.\u0275\u0275text(14);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(15, "button", 56);
    i0.\u0275\u0275listener("click", function UsersComponent_div_10_div_11_Template_button_click_15_listener() {
      const user_r7 = i0.\u0275\u0275restoreView(_r6).$implicit;
      const ctx_r0 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r0.divisionsUserId === user_r7.id ? ctx_r0.closeDivisions() : ctx_r0.openDivisions(user_r7));
    });
    i0.\u0275\u0275text(16);
    i0.\u0275\u0275elementEnd()()();
    i0.\u0275\u0275template(17, UsersComponent_div_10_div_11_div_17_Template, 36, 8, "div", 5)(18, UsersComponent_div_10_div_11_div_18_Template, 5, 3, "div", 57);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const user_r7 = ctx.$implicit;
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1(" ", user_r7.display_name, " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate(user_r7.email);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275styleProp("background", ctx_r0.rolePillBg(user_r7.system_role))("color", ctx_r0.rolePillColor(user_r7.system_role));
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(user_r7.system_role.toUpperCase());
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275styleProp("background", user_r7.is_active ? "var(--triarq-color-background-subtle)" : "var(--triarq-color-error-light,#fdecea)")("color", user_r7.is_active ? "var(--triarq-color-text-secondary)" : "var(--triarq-color-error)");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(user_r7.is_active ? "Active" : "Inactive");
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate(ctx_r0.editingUserId === user_r7.id ? "Cancel" : "Edit");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate(ctx_r0.divisionsUserId === user_r7.id ? "Close" : "Assign");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.editingUserId === user_r7.id);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.divisionsUserId === user_r7.id);
  }
}
function UsersComponent_div_10_div_12_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 89);
    i0.\u0275\u0275text(1, "No users match the selected role filter.");
    i0.\u0275\u0275elementEnd();
  }
}
function UsersComponent_div_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div")(1, "div", 47)(2, "span", 48);
    i0.\u0275\u0275listener("click", function UsersComponent_div_10_Template_span_click_2_listener() {
      i0.\u0275\u0275restoreView(_r5);
      const ctx_r0 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r0.toggleNameSort());
    });
    i0.\u0275\u0275text(3);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(4, "span");
    i0.\u0275\u0275text(5, "Email");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(6, "span");
    i0.\u0275\u0275text(7, "Role");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(8, "span");
    i0.\u0275\u0275text(9, "Status");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(10, "span");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(11, UsersComponent_div_10_div_11_Template, 19, 16, "div", 49)(12, UsersComponent_div_10_div_12_Template, 2, 0, "div", 50);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1("Name ", ctx_r0.nameSortDir === "asc" ? "\u2191" : "\u2193", "");
    i0.\u0275\u0275advance(8);
    i0.\u0275\u0275property("ngForOf", ctx_r0.filteredSortedUsers);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.filteredSortedUsers.length === 0);
  }
}
function UsersComponent_div_11_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 89);
    i0.\u0275\u0275text(1, 'No users found. Use "+ Add User" to add the first user.');
    i0.\u0275\u0275elementEnd();
  }
}
function UsersComponent_div_12_span_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1("of ", ctx_r0.users.length, "");
  }
}
function UsersComponent_div_12_span_4_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" \u2014 filtered by ", ctx_r0.roleFilter.toUpperCase(), "");
  }
}
function UsersComponent_div_12_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 90);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275template(2, UsersComponent_div_12_span_2_Template, 2, 1, "span", 6);
    i0.\u0275\u0275text(3);
    i0.\u0275\u0275template(4, UsersComponent_div_12_span_4_Template, 2, 1, "span", 6);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r0.filteredSortedUsers.length, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.roleFilter !== "all");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" user", ctx_r0.users.length === 1 ? "" : "s", " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.roleFilter !== "all");
  }
}
var UsersComponent = class _UsersComponent {
  constructor(mcp, profile, fb, cdr) {
    this.mcp = mcp;
    this.profile = profile;
    this.fb = fb;
    this.cdr = cdr;
    this.users = [];
    this.loading = false;
    this.showInviteForm = false;
    this.inviting = false;
    this.inviteError = "";
    this.inviteSuccess = false;
    this.blockedMessage = "";
    this.blockedHint = "";
    this.roleFilter = "all";
    this.nameSortDir = "asc";
    this.roleFilters = [
      { value: "all", label: "All" },
      { value: "ds", label: "DS" },
      { value: "cb", label: "CB" },
      { value: "ce", label: "CE" },
      { value: "admin", label: "Admin" },
      { value: "phil", label: "Phil" }
    ];
    this.editingUserId = null;
    this.saving = false;
    this.editError = "";
    this.divisionsUserId = null;
    this.userDirectDivisions = [];
    this.loadingMemberships = false;
    this.membershipsError = "";
    this.allTrusts = [];
    this.trustsLoaded = false;
    this.trustPickerControl = new FormControl("");
    this.assigning = false;
    this.assignError = "";
    this.revokingDivisionId = null;
    this.skeletonRows = [1, 2, 3, 4, 5];
  }
  ngOnInit() {
    this.inviteForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      display_name: ["", Validators.required],
      system_role: ["", Validators.required]
    });
    this.editForm = this.fb.group({
      display_name: ["", Validators.required],
      system_role: ["", Validators.required],
      is_active: [true]
    });
    this.loadUsers();
  }
  // ── Sort / Filter ──────────────────────────────────────────────────────────
  get filteredSortedUsers() {
    let result = [...this.users];
    if (this.roleFilter !== "all") {
      result = result.filter((u) => u.system_role === this.roleFilter);
    }
    result.sort((a, b) => {
      const cmp = a.display_name.localeCompare(b.display_name);
      return this.nameSortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }
  /** Trusts not yet directly assigned to the current divisions user. */
  get availableTrusts() {
    const assignedIds = new Set(this.userDirectDivisions.map((d) => d.id));
    return this.allTrusts.filter((t) => !assignedIds.has(t.id));
  }
  setRoleFilter(role) {
    this.roleFilter = role;
    this.cdr.markForCheck();
  }
  toggleNameSort() {
    this.nameSortDir = this.nameSortDir === "asc" ? "desc" : "asc";
    this.cdr.markForCheck();
  }
  // ── Data ───────────────────────────────────────────────────────────────────
  loadUsers() {
    this.loading = true;
    this.blockedMessage = "";
    this.cdr.markForCheck();
    this.mcp.call("division", "list_users", {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.users = Array.isArray(res.data) ? res.data : [];
        } else {
          this.setBlocked(res.error ?? "Could not load users.", "Ensure you have admin access and your session is active.");
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.setBlocked(err.error ?? "Could not load users.", "Ensure you have admin access and your session is active.");
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Add user ────────────────────────────────────────────────────────────────
  toggleInviteForm() {
    this.showInviteForm = !this.showInviteForm;
    this.inviteError = "";
    this.inviteSuccess = false;
    if (this.showInviteForm) {
      this.inviteForm.reset();
    }
  }
  submitInvite() {
    if (this.inviteForm.invalid) {
      return;
    }
    this.inviting = true;
    this.inviteError = "";
    this.inviteSuccess = false;
    this.cdr.markForCheck();
    this.mcp.call("division", "create_user", {
      email: this.inviteForm.value.email,
      display_name: this.inviteForm.value.display_name,
      system_role: this.inviteForm.value.system_role
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.inviteSuccess = true;
          this.showInviteForm = false;
          this.inviteForm.reset();
          this.loadUsers();
        } else {
          this.inviteError = res.error ?? "Create failed.";
        }
        this.inviting = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.inviteError = err.error ?? "Create failed. Check the email and try again.";
        this.inviting = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Edit user ───────────────────────────────────────────────────────────────
  startEdit(user) {
    this.editingUserId = user.id;
    this.editError = "";
    this.divisionsUserId = null;
    this.editForm.setValue({
      display_name: user.display_name,
      system_role: user.system_role,
      is_active: user.is_active
    });
    this.cdr.markForCheck();
  }
  cancelEdit() {
    this.editingUserId = null;
    this.editError = "";
    this.cdr.markForCheck();
  }
  submitEdit() {
    if (this.editForm.invalid || !this.editingUserId) {
      return;
    }
    this.saving = true;
    this.editError = "";
    this.cdr.markForCheck();
    this.mcp.call("division", "update_user", {
      user_id: this.editingUserId,
      updates: {
        display_name: this.editForm.value.display_name,
        system_role: this.editForm.value.system_role,
        is_active: this.editForm.value.is_active
      }
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.editingUserId = null;
          this.loadUsers();
        } else {
          this.editError = res.error ?? "Save failed.";
        }
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.editError = err.error ?? "Save failed. Check permissions and try again.";
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Division assignment ────────────────────────────────────────────────────
  openDivisions(user) {
    this.divisionsUserId = user.id;
    this.editingUserId = null;
    this.assignError = "";
    this.membershipsError = "";
    this.trustPickerControl.setValue("");
    this.userDirectDivisions = [];
    this.loadMemberships(user.id);
    this.loadTrustsOnce();
    this.cdr.markForCheck();
  }
  closeDivisions() {
    this.divisionsUserId = null;
    this.userDirectDivisions = [];
    this.assignError = "";
    this.membershipsError = "";
    this.trustPickerControl.setValue("");
    this.cdr.markForCheck();
  }
  loadMemberships(userId) {
    this.loadingMemberships = true;
    this.membershipsError = "";
    this.cdr.markForCheck();
    this.mcp.call("division", "get_user_divisions", { user_id: userId }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.userDirectDivisions = res.data.directly_assigned_divisions ?? [];
        } else {
          this.membershipsError = res.error ?? "Could not load Division assignments.";
        }
        this.loadingMemberships = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.membershipsError = err.error ?? "Could not load Division assignments.";
        this.loadingMemberships = false;
        this.cdr.markForCheck();
      }
    });
  }
  /** Loads the Trust list once per component lifetime — reused across all users. */
  loadTrustsOnce() {
    if (this.trustsLoaded) {
      return;
    }
    this.mcp.call("division", "list_divisions", { parent_division_id: null }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.allTrusts = Array.isArray(res.data) ? res.data : [];
          this.trustsLoaded = true;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }
  submitAssign() {
    const divisionId = this.trustPickerControl.value;
    if (!divisionId || !this.divisionsUserId) {
      return;
    }
    this.assigning = true;
    this.assignError = "";
    this.cdr.markForCheck();
    this.mcp.call("division", "assign_user_to_division", {
      user_id: this.divisionsUserId,
      division_id: divisionId
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.trustPickerControl.setValue("");
          this.loadMemberships(this.divisionsUserId);
        } else {
          this.assignError = res.error ?? "Assign failed.";
        }
        this.assigning = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.assignError = err.error ?? "Assign failed. Check permissions and try again.";
        this.assigning = false;
        this.cdr.markForCheck();
      }
    });
  }
  revokeAssignment(divisionId) {
    if (!this.divisionsUserId) {
      return;
    }
    this.revokingDivisionId = divisionId;
    this.assignError = "";
    this.cdr.markForCheck();
    this.mcp.call("division", "revoke_division_membership", {
      user_id: this.divisionsUserId,
      division_id: divisionId
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadMemberships(this.divisionsUserId);
        } else {
          this.assignError = res.error ?? "Remove failed.";
        }
        this.revokingDivisionId = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.assignError = err.error ?? "Remove failed. Check permissions and try again.";
        this.revokingDivisionId = null;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Presentation helpers ───────────────────────────────────────────────────
  rolePillBg(role) {
    const map = {
      phil: "var(--triarq-color-primary)",
      admin: "#e3f2fd",
      ds: "#f3e5f5",
      cb: "#e8f5e9",
      ce: "#fff3e0"
    };
    return map[role] ?? "var(--triarq-color-background-subtle)";
  }
  rolePillColor(role) {
    const map = {
      phil: "#ffffff",
      admin: "#1565c0",
      ds: "#6a1b9a",
      cb: "#2e7d32",
      ce: "#e65100"
    };
    return map[role] ?? "var(--triarq-color-text-secondary)";
  }
  setBlocked(primary, hint) {
    this.blockedMessage = primary;
    this.blockedHint = hint;
  }
  static {
    this.\u0275fac = function UsersComponent_Factory(t) {
      return new (t || _UsersComponent)(i0.\u0275\u0275directiveInject(McpService), i0.\u0275\u0275directiveInject(UserProfileService), i0.\u0275\u0275directiveInject(i3.FormBuilder), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _UsersComponent, selectors: [["app-users"]], standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 16, vars: 8, consts: [[1, "oi-card", 2, "max-width", "960px", "margin", "var(--triarq-space-2xl) auto"], [2, "display", "flex", "align-items", "center", "justify-content", "space-between", "margin-bottom", "var(--triarq-space-md)"], [2, "margin", "0"], [1, "oi-btn-primary", 2, "font-size", "var(--triarq-text-small)", 3, "click"], [3, "primaryMessage", "secondaryMessage", 4, "ngIf"], ["style", "position:relative;", 4, "ngIf"], [4, "ngIf"], ["style", "display:flex;gap:var(--triarq-space-xs);flex-wrap:wrap;\n               margin-bottom:var(--triarq-space-sm);align-items:center;", 4, "ngIf"], ["style", "color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);\n               padding:var(--triarq-space-lg) 0;text-align:center;", 4, "ngIf"], ["style", "margin-top:var(--triarq-space-sm);\n               font-size:var(--triarq-text-small);\n               color:var(--triarq-color-text-secondary);", 4, "ngIf"], [2, "margin-top", "var(--triarq-space-lg)", "padding-top", "var(--triarq-space-md)", "border-top", "1px solid var(--triarq-color-border)"], ["routerLink", "/admin/divisions", 2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)"], [3, "primaryMessage", "secondaryMessage"], [2, "position", "relative"], ["message", "Creating User\u2026", 3, "visible"], [2, "background", "var(--triarq-color-background-subtle)", "border-radius", "8px", "padding", "var(--triarq-space-md)", "margin-bottom", "var(--triarq-space-md)"], [2, "margin", "0 0 var(--triarq-space-sm) 0", "font-size", "var(--triarq-text-body)"], [3, "ngSubmit", "formGroup"], [2, "display", "grid", "gap", "var(--triarq-space-sm)", "grid-template-columns", "1fr 1fr 1fr"], [2, "display", "block", "font-size", "var(--triarq-text-small)", "margin-bottom", "4px"], ["formControlName", "email", "type", "email", "placeholder", "user@triarqhealth.com", 1, "oi-input"], ["style", "color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;", 4, "ngIf"], ["formControlName", "display_name", "placeholder", "First Last", 1, "oi-input"], ["formControlName", "system_role", 1, "oi-input"], ["value", ""], ["value", "ds"], ["value", "cb"], ["value", "ce"], ["value", "admin"], [2, "margin-top", "var(--triarq-space-sm)", "display", "flex", "gap", "var(--triarq-space-sm)", "align-items", "center"], ["type", "submit", 1, "oi-btn-primary", 3, "disabled"], ["name", "crescent", "style", "width:16px;height:16px;vertical-align:middle;margin-right:6px;", 4, "ngIf"], ["style", "color:var(--triarq-color-error);font-size:var(--triarq-text-small);", 4, "ngIf"], ["style", "color:var(--triarq-color-success,#2e7d32);font-size:var(--triarq-text-small);", 4, "ngIf"], [2, "color", "var(--triarq-color-error)", "font-size", "var(--triarq-text-small)", "margin-top", "2px"], ["name", "crescent", 2, "width", "16px", "height", "16px", "vertical-align", "middle", "margin-right", "6px"], [2, "color", "var(--triarq-color-error)", "font-size", "var(--triarq-text-small)"], [2, "color", "var(--triarq-color-success,#2e7d32)", "font-size", "var(--triarq-text-small)"], ["style", "display:grid;grid-template-columns:2fr 2fr 1fr 1fr 130px;\n                    gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);\n                    border-bottom:1px solid var(--triarq-color-border);align-items:center;", 4, "ngFor", "ngForOf"], [2, "display", "grid", "grid-template-columns", "2fr 2fr 1fr 1fr 130px", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-sm)", "border-bottom", "1px solid var(--triarq-color-border)", "align-items", "center"], ["animated", "", 2, "height", "16px", "border-radius", "4px"], ["animated", "", 2, "height", "20px", "border-radius", "999px", "width", "50px"], ["animated", "", 2, "height", "20px", "border-radius", "999px", "width", "60px"], [2, "display", "flex", "gap", "var(--triarq-space-xs)", "flex-wrap", "wrap", "margin-bottom", "var(--triarq-space-sm)", "align-items", "center"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "margin-right", "4px"], ["class", "oi-pill", "style", "cursor:pointer;", 3, "background", "color", "click", 4, "ngFor", "ngForOf"], [1, "oi-pill", 2, "cursor", "pointer", 3, "click"], [2, "display", "grid", "grid-template-columns", "2fr 2fr 1fr 1fr 130px", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "font-size", "var(--triarq-text-small)", "font-weight", "500", "color", "var(--triarq-color-text-secondary)", "border-bottom", "2px solid var(--triarq-color-border)"], [2, "cursor", "pointer", "user-select", "none", 3, "click"], [4, "ngFor", "ngForOf"], ["style", "color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);\n                 padding:var(--triarq-space-lg) 0;text-align:center;", 4, "ngIf"], [2, "display", "grid", "grid-template-columns", "2fr 2fr 1fr 1fr 130px", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-sm)", "border-bottom", "1px solid var(--triarq-color-border)", "font-size", "var(--triarq-text-small)", "align-items", "center"], [2, "font-weight", "500", "color", "var(--triarq-color-text-primary)"], [2, "color", "var(--triarq-color-text-secondary)"], [1, "oi-pill"], [2, "display", "flex", "gap", "var(--triarq-space-sm)", "justify-content", "flex-end"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)", "background", "none", "border", "none", "cursor", "pointer", "padding", "0", 3, "click"], ["style", "background:var(--triarq-color-background-subtle);\n                   padding:var(--triarq-space-sm) var(--triarq-space-md);\n                   border-bottom:1px solid var(--triarq-color-border);", 4, "ngIf"], ["message", "Saving\u2026", 3, "visible"], [2, "background", "var(--triarq-color-background-subtle)", "padding", "var(--triarq-space-sm) var(--triarq-space-md)", "border-bottom", "1px solid var(--triarq-color-border)"], [2, "display", "grid", "gap", "var(--triarq-space-sm)", "grid-template-columns", "2fr 1fr 1fr auto", "align-items", "end"], ["formControlName", "display_name", 1, "oi-input", 2, "width", "100%"], ["value", "phil"], ["formControlName", "is_active", 1, "oi-input"], [3, "ngValue"], ["type", "submit", 1, "oi-btn-primary", 2, "white-space", "nowrap", 3, "disabled"], ["name", "crescent", "style", "width:14px;height:14px;vertical-align:middle;margin-right:4px;", 4, "ngIf"], ["style", "color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:var(--triarq-space-xs);", 4, "ngIf"], ["name", "crescent", 2, "width", "14px", "height", "14px", "vertical-align", "middle", "margin-right", "4px"], [2, "color", "var(--triarq-color-error)", "font-size", "var(--triarq-text-small)", "margin-top", "var(--triarq-space-xs)"], [2, "font-size", "var(--triarq-text-small)", "font-weight", "500", "margin-bottom", "var(--triarq-space-xs)"], ["style", "font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);", 4, "ngIf"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], ["style", "font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);\n                       margin-bottom:var(--triarq-space-xs);", 4, "ngIf"], ["style", "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:var(--triarq-space-sm);", 4, "ngIf"], ["style", "display:flex;gap:var(--triarq-space-sm);align-items:center;", 4, "ngIf"], ["style", "color:var(--triarq-color-error);font-size:var(--triarq-text-small);\n                       margin-top:var(--triarq-space-xs);", 4, "ngIf"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "margin-bottom", "var(--triarq-space-xs)"], [2, "display", "flex", "flex-wrap", "wrap", "gap", "6px", "margin-bottom", "var(--triarq-space-sm)"], ["style", "display:inline-flex;align-items:center;gap:4px;\n                         background:var(--triarq-color-primary);color:#fff;\n                         border-radius:999px;padding:2px 10px 2px 12px;\n                         font-size:var(--triarq-text-small);", 4, "ngFor", "ngForOf"], [2, "display", "inline-flex", "align-items", "center", "gap", "4px", "background", "var(--triarq-color-primary)", "color", "#fff", "border-radius", "999px", "padding", "2px 10px 2px 12px", "font-size", "var(--triarq-text-small)"], ["title", "Remove", 2, "background", "none", "border", "none", "color", "#fff", "cursor", "pointer", "font-size", "14px", "line-height", "1", "padding", "0 0 0 2px", "opacity", "0.8", "display", "inline-flex", "align-items", "center", 3, "click", "disabled"], ["name", "crescent", "style", "width:12px;height:12px;color:#fff;", 4, "ngIf"], ["name", "crescent", 2, "width", "12px", "height", "12px", "color", "#fff"], [2, "display", "flex", "gap", "var(--triarq-space-sm)", "align-items", "center"], [1, "oi-input", 2, "max-width", "300px", 3, "formControl"], [3, "value", 4, "ngFor", "ngForOf"], [1, "oi-btn-primary", 2, "font-size", "var(--triarq-text-small)", "white-space", "nowrap", 3, "click", "disabled"], [3, "value"], [2, "color", "var(--triarq-color-text-secondary)", "font-size", "var(--triarq-text-small)", "padding", "var(--triarq-space-lg) 0", "text-align", "center"], [2, "margin-top", "var(--triarq-space-sm)", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"]], template: function UsersComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h3", 2);
        i0.\u0275\u0275text(3, "User Management");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(4, "button", 3);
        i0.\u0275\u0275listener("click", function UsersComponent_Template_button_click_4_listener() {
          return ctx.toggleInviteForm();
        });
        i0.\u0275\u0275text(5);
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275template(6, UsersComponent_app_blocked_action_6_Template, 1, 2, "app-blocked-action", 4)(7, UsersComponent_div_7_Template, 38, 10, "div", 5)(8, UsersComponent_div_8_Template, 2, 1, "div", 6)(9, UsersComponent_div_9_Template, 4, 1, "div", 7)(10, UsersComponent_div_10_Template, 13, 3, "div", 6)(11, UsersComponent_div_11_Template, 2, 0, "div", 8)(12, UsersComponent_div_12_Template, 5, 4, "div", 9);
        i0.\u0275\u0275elementStart(13, "div", 10)(14, "a", 11);
        i0.\u0275\u0275text(15, "\u2190 Division Hierarchy");
        i0.\u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        i0.\u0275\u0275advance(5);
        i0.\u0275\u0275textInterpolate(ctx.showInviteForm ? "Cancel" : "+ Add User");
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.blockedMessage);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.showInviteForm);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && ctx.users.length > 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && ctx.users.length > 0);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && ctx.users.length === 0 && !ctx.blockedMessage);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.users.length > 0);
      }
    }, dependencies: [
      CommonModule,
      i4.NgForOf,
      i4.NgIf,
      RouterModule,
      i5.RouterLink,
      ReactiveFormsModule,
      i3.\u0275NgNoValidate,
      i3.NgSelectOption,
      i3.\u0275NgSelectMultipleOption,
      i3.DefaultValueAccessor,
      i3.SelectControlValueAccessor,
      i3.NgControlStatus,
      i3.NgControlStatusGroup,
      i3.FormControlDirective,
      i3.FormGroupDirective,
      i3.FormControlName,
      IonicModule,
      IonSkeletonText,
      IonSpinner,
      RouterLinkWithHrefDelegateDirective,
      BlockedActionComponent,
      LoadingOverlayComponent
    ], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(UsersComponent, { className: "UsersComponent", filePath: "src\\app\\features\\admin\\users\\users.component.ts", lineNumber: 473 });
})();
export {
  UsersComponent
};
//# sourceMappingURL=users.component-HXK5ODVY.js.map
