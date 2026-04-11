import {
  LoadingOverlayComponent
} from "./chunk-CPG53S23.js";
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

// src/app/features/admin/divisions/divisions.component.ts
import { Component, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ReactiveFormsModule, Validators } from "@angular/forms";
import * as i0 from "@angular/core";
import * as i2 from "@angular/forms";
import * as i3 from "@angular/common";
import * as i4 from "@angular/router";
function DivisionsComponent_span_6_span_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "span", 14);
    i0.\u0275\u0275listener("click", function DivisionsComponent_span_6_span_1_Template_span_click_0_listener() {
      i0.\u0275\u0275restoreView(_r1);
      const i_r2 = i0.\u0275\u0275nextContext().index;
      const ctx_r2 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r2.navigateBreadcrumb(i_r2));
    });
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const crumb_r4 = i0.\u0275\u0275nextContext().$implicit;
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(crumb_r4.name);
  }
}
function DivisionsComponent_span_6_span_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const crumb_r4 = i0.\u0275\u0275nextContext().$implicit;
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(crumb_r4.name);
  }
}
function DivisionsComponent_span_6_span_3_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1, " \u203A ");
    i0.\u0275\u0275elementEnd();
  }
}
function DivisionsComponent_span_6_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275template(1, DivisionsComponent_span_6_span_1_Template, 2, 1, "span", 13)(2, DivisionsComponent_span_6_span_2_Template, 2, 1, "span", 10)(3, DivisionsComponent_span_6_span_3_Template, 2, 0, "span", 10);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const last_r5 = ctx.last;
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", !last_r5);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", last_r5);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", !last_r5);
  }
}
function DivisionsComponent_button_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "button", 15);
    i0.\u0275\u0275listener("click", function DivisionsComponent_button_8_Template_button_click_0_listener() {
      i0.\u0275\u0275restoreView(_r6);
      const ctx_r2 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r2.toggleEditForm());
    });
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r2.showEditForm ? "Cancel Edit" : "Edit " + ctx_r2.editLabel);
  }
}
function DivisionsComponent_button_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "button", 16);
    i0.\u0275\u0275listener("click", function DivisionsComponent_button_9_Template_button_click_0_listener() {
      i0.\u0275\u0275restoreView(_r7);
      const ctx_r2 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r2.toggleCreateForm());
    });
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r2.showCreateForm ? "Cancel" : "+ New " + ctx_r2.levelLabel);
  }
}
function DivisionsComponent_app_blocked_action_10_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "app-blocked-action", 17);
  }
  if (rf & 2) {
    const ctx_r2 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275property("primaryMessage", ctx_r2.blockedMessage)("secondaryMessage", ctx_r2.blockedHint);
  }
}
function DivisionsComponent_div_11_div_10_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 30);
    i0.\u0275\u0275text(1, "Name is required.");
    i0.\u0275\u0275elementEnd();
  }
}
function DivisionsComponent_div_11_ion_spinner_13_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "ion-spinner", 31);
  }
}
function DivisionsComponent_div_11_span_15_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 32);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r2.editDivisionError);
  }
}
function DivisionsComponent_div_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 18);
    i0.\u0275\u0275element(1, "app-loading-overlay", 19);
    i0.\u0275\u0275elementStart(2, "div", 20)(3, "h4", 21);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "form", 22);
    i0.\u0275\u0275listener("ngSubmit", function DivisionsComponent_div_11_Template_form_ngSubmit_5_listener() {
      i0.\u0275\u0275restoreView(_r8);
      const ctx_r2 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r2.submitEditDivision());
    });
    i0.\u0275\u0275elementStart(6, "div")(7, "label", 23);
    i0.\u0275\u0275text(8);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(9, "input", 24);
    i0.\u0275\u0275template(10, DivisionsComponent_div_11_div_10_Template, 2, 0, "div", 25);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(11, "div", 26)(12, "button", 27);
    i0.\u0275\u0275template(13, DivisionsComponent_div_11_ion_spinner_13_Template, 1, 0, "ion-spinner", 28);
    i0.\u0275\u0275text(14);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(15, DivisionsComponent_div_11_span_15_Template, 2, 1, "span", 29);
    i0.\u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    let tmp_5_0;
    const ctx_r2 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("visible", ctx_r2.savingDivision);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1(" Rename ", ctx_r2.editLabel, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("formGroup", ctx_r2.editDivisionForm);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r2.editLabel, " Name * ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngIf", ((tmp_5_0 = ctx_r2.editDivisionForm.get("division_name")) == null ? null : tmp_5_0.invalid) && ((tmp_5_0 = ctx_r2.editDivisionForm.get("division_name")) == null ? null : tmp_5_0.touched));
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("disabled", ctx_r2.editDivisionForm.invalid || ctx_r2.savingDivision);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r2.savingDivision);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r2.savingDivision ? "Saving\u2026" : "Save", " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r2.editDivisionError);
  }
}
function DivisionsComponent_div_12_div_10_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 30);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1("", ctx_r2.levelLabel, " name is required.");
  }
}
function DivisionsComponent_div_12_ion_spinner_13_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "ion-spinner", 31);
  }
}
function DivisionsComponent_div_12_span_15_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 32);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r2.createError);
  }
}
function DivisionsComponent_div_12_span_16_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 36);
    i0.\u0275\u0275text(1, "Created successfully.");
    i0.\u0275\u0275elementEnd();
  }
}
function DivisionsComponent_div_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 18);
    i0.\u0275\u0275element(1, "app-loading-overlay", 33);
    i0.\u0275\u0275elementStart(2, "div", 20)(3, "h4", 21);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "form", 22);
    i0.\u0275\u0275listener("ngSubmit", function DivisionsComponent_div_12_Template_form_ngSubmit_5_listener() {
      i0.\u0275\u0275restoreView(_r9);
      const ctx_r2 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r2.submitCreate());
    });
    i0.\u0275\u0275elementStart(6, "div")(7, "label", 23);
    i0.\u0275\u0275text(8);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(9, "input", 34);
    i0.\u0275\u0275template(10, DivisionsComponent_div_12_div_10_Template, 2, 1, "div", 25);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(11, "div", 26)(12, "button", 27);
    i0.\u0275\u0275template(13, DivisionsComponent_div_12_ion_spinner_13_Template, 1, 0, "ion-spinner", 28);
    i0.\u0275\u0275text(14);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(15, DivisionsComponent_div_12_span_15_Template, 2, 1, "span", 29)(16, DivisionsComponent_div_12_span_16_Template, 2, 0, "span", 35);
    i0.\u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    let tmp_7_0;
    const ctx_r2 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275propertyInterpolate1("message", "Creating ", ctx_r2.levelLabel, "\u2026");
    i0.\u0275\u0275property("visible", ctx_r2.creating);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate2(" Create ", ctx_r2.levelLabel, "", ctx_r2.isAtRoot ? "" : ' under "' + ctx_r2.currentParentName + '"', " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("formGroup", ctx_r2.createForm);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r2.levelLabel, " Name * ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("placeholder", ctx_r2.namePlaceholder);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ((tmp_7_0 = ctx_r2.createForm.get("division_name")) == null ? null : tmp_7_0.invalid) && ((tmp_7_0 = ctx_r2.createForm.get("division_name")) == null ? null : tmp_7_0.touched));
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("disabled", ctx_r2.createForm.invalid || ctx_r2.creating);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r2.creating);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r2.creating ? "Creating\u2026" : "Create", " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r2.createError);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r2.createSuccess);
  }
}
function DivisionsComponent_div_13_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 38);
    i0.\u0275\u0275element(1, "ion-skeleton-text", 39)(2, "ion-skeleton-text", 40);
    i0.\u0275\u0275elementEnd();
  }
}
function DivisionsComponent_div_13_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div");
    i0.\u0275\u0275template(1, DivisionsComponent_div_13_div_1_Template, 3, 0, "div", 37);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r2.skeletonRows);
  }
}
function DivisionsComponent_div_14_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 43);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r2.emptyMessage);
  }
}
function DivisionsComponent_div_14_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 44);
    i0.\u0275\u0275listener("click", function DivisionsComponent_div_14_div_2_Template_div_click_0_listener() {
      const div_r11 = i0.\u0275\u0275restoreView(_r10).$implicit;
      const ctx_r2 = i0.\u0275\u0275nextContext(2);
      return i0.\u0275\u0275resetView(ctx_r2.navigateTo(div_r11));
    });
    i0.\u0275\u0275elementStart(1, "div", 45);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 46)(4, "span", 47);
    i0.\u0275\u0275text(5);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(6, "span", 48);
    i0.\u0275\u0275text(7, "\u203A");
    i0.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const div_r11 = ctx.$implicit;
    const ctx_r2 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", div_r11.division_name, " ");
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate(ctx_r2.getLevelLabel(div_r11.division_level));
  }
}
function DivisionsComponent_div_14_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div");
    i0.\u0275\u0275template(1, DivisionsComponent_div_14_div_1_Template, 2, 1, "div", 41)(2, DivisionsComponent_div_14_div_2_Template, 8, 2, "div", 42);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r2.currentDivisions.length === 0 && !ctx_r2.blockedMessage);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r2.currentDivisions);
  }
}
var LEVEL_LABELS = {
  0: "Trust",
  1: "Service Line",
  2: "Function"
};
var TYPE_LABELS = {
  0: "Trust",
  1: "Service Line Division",
  2: "Function Division"
};
var DivisionsComponent = class _DivisionsComponent {
  constructor(mcp, fb, cdr) {
    this.mcp = mcp;
    this.fb = fb;
    this.cdr = cdr;
    this.breadcrumb = [{ id: null, name: "All Trusts" }];
    this.currentDivisions = [];
    this.loading = false;
    this.showCreateForm = false;
    this.creating = false;
    this.createError = "";
    this.createSuccess = false;
    this.showEditForm = false;
    this.editDivisionError = "";
    this.savingDivision = false;
    this.blockedMessage = "";
    this.blockedHint = "";
    this.skeletonRows = [1, 2, 3, 4, 5];
  }
  ngOnInit() {
    this.createForm = this.fb.group({
      division_name: ["", [Validators.required, Validators.maxLength(120)]]
    });
    this.editDivisionForm = this.fb.group({
      division_name: ["", [Validators.required, Validators.maxLength(120)]]
    });
    this.loadDivisions(null);
  }
  // ── Computed ───────────────────────────────────────────────────────────────
  get isAtRoot() {
    return this.breadcrumb.length === 1;
  }
  /** DB level of the items currently displayed (0=Trust, 1=Service Line, 2=Function). */
  get currentLevel() {
    return this.breadcrumb.length - 1;
  }
  /** Short label for what is being created at the current level (interim: D-L2/L3). */
  get levelLabel() {
    return LEVEL_LABELS[this.currentLevel] ?? "Division";
  }
  /** Short label for the division we navigated into (one level above items being displayed). */
  get editLabel() {
    return LEVEL_LABELS[this.currentLevel - 1] ?? "Division";
  }
  /** True when the current level supports creating children (Trust/Service Line/Function only). */
  get canCreate() {
    return this.currentLevel <= 2;
  }
  get currentParentName() {
    return this.breadcrumb[this.breadcrumb.length - 1]?.name ?? "";
  }
  get currentParentId() {
    return this.breadcrumb[this.breadcrumb.length - 1]?.id ?? null;
  }
  get namePlaceholder() {
    switch (this.currentLevel) {
      case 0:
        return "e.g. Practice Services Trust";
      case 1:
        return "e.g. Revenue Cycle Management";
      case 2:
        return "e.g. Coding & Billing";
      default:
        return "";
    }
  }
  get emptyMessage() {
    if (this.isAtRoot) {
      return 'No Trusts yet. Use "+ New Trust" to create the first one.';
    }
    if (!this.canCreate) {
      return `${this.currentParentName} has no child Divisions.`;
    }
    return `No ${this.levelLabel}s yet. Use "+ New ${this.levelLabel}" to add one.`;
  }
  /** Returns the short display label for a Division row's level. */
  getLevelLabel(level) {
    return LEVEL_LABELS[level] ?? "Division";
  }
  // ── Navigation ─────────────────────────────────────────────────────────────
  navigateTo(division) {
    this.breadcrumb.push({ id: division.id, name: division.division_name });
    this.showCreateForm = false;
    this.showEditForm = false;
    this.createSuccess = false;
    this.editDivisionError = "";
    this.loadDivisions(division.id);
  }
  navigateBreadcrumb(index) {
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);
    this.showCreateForm = false;
    this.showEditForm = false;
    this.editDivisionError = "";
    this.loadDivisions(this.breadcrumb[index].id);
  }
  // ── Data ───────────────────────────────────────────────────────────────────
  loadDivisions(parentId) {
    this.loading = true;
    this.blockedMessage = "";
    this.cdr.markForCheck();
    this.mcp.call("division", "list_divisions", { parent_division_id: parentId }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.currentDivisions = Array.isArray(res.data) ? res.data : [];
        } else {
          this.setBlocked(res.error ?? "Could not load divisions.", "Ensure you have admin access and your session is active.");
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.setBlocked(err.error ?? "Could not load divisions.", "Ensure you have admin access and your session is active.");
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Create ─────────────────────────────────────────────────────────────────
  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    this.createError = "";
    this.createSuccess = false;
    if (this.showCreateForm) {
      this.showEditForm = false;
      this.createForm.reset();
    }
  }
  submitCreate() {
    if (this.createForm.invalid) {
      return;
    }
    this.creating = true;
    this.createError = "";
    this.createSuccess = false;
    this.cdr.markForCheck();
    const params = {
      division_name: this.createForm.value.division_name,
      parent_division_id: this.currentParentId,
      // Auto-set type label from level — no manual selection needed (D-L2/L3 interim).
      division_type_label: TYPE_LABELS[this.currentLevel] ?? ""
    };
    this.mcp.call("division", "create_division", params).subscribe({
      next: (res) => {
        if (res.success) {
          this.createSuccess = true;
          this.showCreateForm = false;
          this.createForm.reset();
          this.loadDivisions(this.currentParentId);
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
  // ── Edit ───────────────────────────────────────────────────────────────────
  toggleEditForm() {
    this.showEditForm = !this.showEditForm;
    this.editDivisionError = "";
    if (this.showEditForm) {
      this.showCreateForm = false;
      this.editDivisionForm.setValue({ division_name: this.currentParentName });
    }
  }
  submitEditDivision() {
    if (this.editDivisionForm.invalid || !this.currentParentId) {
      return;
    }
    this.savingDivision = true;
    this.editDivisionError = "";
    this.cdr.markForCheck();
    this.mcp.call("division", "update_division", {
      division_id: this.currentParentId,
      updates: { division_name: this.editDivisionForm.value.division_name }
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.breadcrumb[this.breadcrumb.length - 1].name = this.editDivisionForm.value.division_name;
          this.showEditForm = false;
          this.editDivisionForm.reset();
        } else {
          this.editDivisionError = res.error ?? "Save failed.";
        }
        this.savingDivision = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.editDivisionError = err.error ?? "Save failed. Check permissions and try again.";
        this.savingDivision = false;
        this.cdr.markForCheck();
      }
    });
  }
  setBlocked(primary, hint) {
    this.blockedMessage = primary;
    this.blockedHint = hint;
  }
  static {
    this.\u0275fac = function DivisionsComponent_Factory(t) {
      return new (t || _DivisionsComponent)(i0.\u0275\u0275directiveInject(McpService), i0.\u0275\u0275directiveInject(i2.FormBuilder), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _DivisionsComponent, selectors: [["app-divisions"]], standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 18, vars: 8, consts: [[1, "oi-card", 2, "max-width", "900px", "margin", "var(--triarq-space-2xl) auto"], [2, "display", "flex", "align-items", "flex-start", "justify-content", "space-between", "margin-bottom", "var(--triarq-space-md)"], [2, "margin", "0 0 4px 0"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], [4, "ngFor", "ngForOf"], [2, "display", "flex", "gap", "var(--triarq-space-sm)", "align-items", "center"], ["style", "font-size:var(--triarq-text-small);white-space:nowrap;\n                   background:none;border:1px solid var(--triarq-color-border);\n                   border-radius:5px;padding:6px 12px;cursor:pointer;\n                   color:var(--triarq-color-text-primary);", 3, "click", 4, "ngIf"], ["class", "oi-btn-primary", "style", "font-size:var(--triarq-text-small);white-space:nowrap;", 3, "click", 4, "ngIf"], [3, "primaryMessage", "secondaryMessage", 4, "ngIf"], ["style", "position:relative;", 4, "ngIf"], [4, "ngIf"], [2, "margin-top", "var(--triarq-space-lg)", "padding-top", "var(--triarq-space-md)", "border-top", "1px solid var(--triarq-color-border)", "display", "flex", "gap", "var(--triarq-space-lg)"], ["routerLink", "/admin/users", 2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)"], ["style", "cursor:pointer;color:var(--triarq-color-primary);text-decoration:underline;", 3, "click", 4, "ngIf"], [2, "cursor", "pointer", "color", "var(--triarq-color-primary)", "text-decoration", "underline", 3, "click"], [2, "font-size", "var(--triarq-text-small)", "white-space", "nowrap", "background", "none", "border", "1px solid var(--triarq-color-border)", "border-radius", "5px", "padding", "6px 12px", "cursor", "pointer", "color", "var(--triarq-color-text-primary)", 3, "click"], [1, "oi-btn-primary", 2, "font-size", "var(--triarq-text-small)", "white-space", "nowrap", 3, "click"], [3, "primaryMessage", "secondaryMessage"], [2, "position", "relative"], ["message", "Saving\u2026", 3, "visible"], [2, "background", "var(--triarq-color-background-subtle)", "border-radius", "8px", "padding", "var(--triarq-space-md)", "margin-bottom", "var(--triarq-space-md)"], [2, "margin", "0 0 var(--triarq-space-sm) 0", "font-size", "var(--triarq-text-body)"], [3, "ngSubmit", "formGroup"], [2, "display", "block", "font-size", "var(--triarq-text-small)", "margin-bottom", "4px"], ["formControlName", "division_name", 1, "oi-input", 2, "width", "100%", "max-width", "420px"], ["style", "color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;", 4, "ngIf"], [2, "margin-top", "var(--triarq-space-sm)", "display", "flex", "gap", "var(--triarq-space-sm)", "align-items", "center"], ["type", "submit", 1, "oi-btn-primary", 3, "disabled"], ["name", "crescent", "style", "width:16px;height:16px;vertical-align:middle;margin-right:6px;", 4, "ngIf"], ["style", "color:var(--triarq-color-error);font-size:var(--triarq-text-small);", 4, "ngIf"], [2, "color", "var(--triarq-color-error)", "font-size", "var(--triarq-text-small)", "margin-top", "2px"], ["name", "crescent", 2, "width", "16px", "height", "16px", "vertical-align", "middle", "margin-right", "6px"], [2, "color", "var(--triarq-color-error)", "font-size", "var(--triarq-text-small)"], [3, "visible", "message"], ["formControlName", "division_name", 1, "oi-input", 2, "width", "100%", "max-width", "420px", 3, "placeholder"], ["style", "color:var(--triarq-color-success,#2e7d32);font-size:var(--triarq-text-small);", 4, "ngIf"], [2, "color", "var(--triarq-color-success,#2e7d32)", "font-size", "var(--triarq-text-small)"], ["style", "display:flex;align-items:center;justify-content:space-between;\n                    padding:var(--triarq-space-sm) var(--triarq-space-md);\n                    border-radius:6px;margin-bottom:6px;\n                    border:1px solid var(--triarq-color-border);gap:var(--triarq-space-sm);", 4, "ngFor", "ngForOf"], [2, "display", "flex", "align-items", "center", "justify-content", "space-between", "padding", "var(--triarq-space-sm) var(--triarq-space-md)", "border-radius", "6px", "margin-bottom", "6px", "border", "1px solid var(--triarq-color-border)", "gap", "var(--triarq-space-sm)"], ["animated", "", 2, "height", "16px", "border-radius", "4px", "flex", "1"], ["animated", "", 2, "height", "20px", "width", "80px", "border-radius", "999px"], ["style", "color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);\n                 padding:var(--triarq-space-lg) 0;text-align:center;", 4, "ngIf"], ["style", "display:flex;align-items:center;justify-content:space-between;\n                 padding:var(--triarq-space-sm) var(--triarq-space-md);\n                 border-radius:6px;margin-bottom:6px;cursor:pointer;\n                 border:1px solid var(--triarq-color-border);\n                 transition:background 0.15s;", "onmouseenter", "this.style.background='var(--triarq-color-background-subtle)'", "onmouseleave", "this.style.background=''", 3, "click", 4, "ngFor", "ngForOf"], [2, "color", "var(--triarq-color-text-secondary)", "font-size", "var(--triarq-text-small)", "padding", "var(--triarq-space-lg) 0", "text-align", "center"], ["onmouseenter", "this.style.background='var(--triarq-color-background-subtle)'", "onmouseleave", "this.style.background=''", 2, "display", "flex", "align-items", "center", "justify-content", "space-between", "padding", "var(--triarq-space-sm) var(--triarq-space-md)", "border-radius", "6px", "margin-bottom", "6px", "cursor", "pointer", "border", "1px solid var(--triarq-color-border)", "transition", "background 0.15s", 3, "click"], [2, "font-weight", "500", "color", "var(--triarq-color-text-primary)"], [2, "display", "flex", "align-items", "center", "gap", "var(--triarq-space-sm)"], [1, "oi-pill", 2, "background", "var(--triarq-color-background-subtle)", "color", "var(--triarq-color-text-secondary)"], [2, "color", "var(--triarq-color-text-tertiary)", "font-size", "20px"]], template: function DivisionsComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div")(3, "h3", 2);
        i0.\u0275\u0275text(4, "Division Hierarchy");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(5, "nav", 3);
        i0.\u0275\u0275template(6, DivisionsComponent_span_6_Template, 4, 3, "span", 4);
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275elementStart(7, "div", 5);
        i0.\u0275\u0275template(8, DivisionsComponent_button_8_Template, 2, 1, "button", 6)(9, DivisionsComponent_button_9_Template, 2, 1, "button", 7);
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275template(10, DivisionsComponent_app_blocked_action_10_Template, 1, 2, "app-blocked-action", 8)(11, DivisionsComponent_div_11_Template, 16, 9, "div", 9)(12, DivisionsComponent_div_12_Template, 17, 14, "div", 9)(13, DivisionsComponent_div_13_Template, 2, 1, "div", 10)(14, DivisionsComponent_div_14_Template, 3, 2, "div", 10);
        i0.\u0275\u0275elementStart(15, "div", 11)(16, "a", 12);
        i0.\u0275\u0275text(17, "Manage Users \u2192");
        i0.\u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        i0.\u0275\u0275advance(6);
        i0.\u0275\u0275property("ngForOf", ctx.breadcrumb);
        i0.\u0275\u0275advance(2);
        i0.\u0275\u0275property("ngIf", !ctx.isAtRoot);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.showCreateForm || ctx.canCreate);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.blockedMessage);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.showEditForm);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.showCreateForm);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading);
      }
    }, dependencies: [
      CommonModule,
      i3.NgForOf,
      i3.NgIf,
      RouterModule,
      i4.RouterLink,
      ReactiveFormsModule,
      i2.\u0275NgNoValidate,
      i2.DefaultValueAccessor,
      i2.NgControlStatus,
      i2.NgControlStatusGroup,
      i2.FormGroupDirective,
      i2.FormControlName,
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
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(DivisionsComponent, { className: "DivisionsComponent", filePath: "src\\app\\features\\admin\\divisions\\divisions.component.ts", lineNumber: 257 });
})();
export {
  DivisionsComponent
};
//# sourceMappingURL=divisions.component-YVLM4ZSL.js.map
