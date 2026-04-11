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
  RouterLinkDelegateDirective
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

// src/app/features/oi-library/oi-library.component.ts
import { Component, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import * as i0 from "@angular/core";
import * as i2 from "@angular/forms";
import * as i3 from "@angular/common";
import * as i4 from "@angular/router";
var _c0 = (a0) => ["/library", a0];
function OILibraryComponent_ion_spinner_10_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "ion-spinner", 13);
  }
}
function OILibraryComponent_button_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "button", 14);
    i0.\u0275\u0275listener("click", function OILibraryComponent_button_12_Template_button_click_0_listener() {
      i0.\u0275\u0275restoreView(_r1);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.clearSearch());
    });
    i0.\u0275\u0275text(1, "Clear");
    i0.\u0275\u0275elementEnd();
  }
}
function OILibraryComponent_app_blocked_action_13_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "app-blocked-action", 15);
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275property("primaryMessage", ctx_r1.blockedMessage)("secondaryMessage", ctx_r1.blockedHint);
  }
}
function OILibraryComponent_div_14_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 17)(1, "div", 18);
    i0.\u0275\u0275element(2, "ion-skeleton-text", 19)(3, "ion-skeleton-text", 20);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275element(4, "ion-skeleton-text", 21);
    i0.\u0275\u0275elementEnd();
  }
}
function OILibraryComponent_div_14_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div");
    i0.\u0275\u0275template(1, OILibraryComponent_div_14_div_1_Template, 5, 0, "div", 16);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r1.skeletonRows);
  }
}
function OILibraryComponent_div_15_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 24);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r1.isSearching ? 'No results for "' + ctx_r1.lastQuery + '".' : "No artifacts in the library yet.", " ");
  }
}
function OILibraryComponent_div_15_div_2_span_5_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const a_r3 = i0.\u0275\u0275nextContext().$implicit;
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(a_r3.artifact_types.type_name);
  }
}
function OILibraryComponent_div_15_div_2_span_6_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1, " \xB7 ");
    i0.\u0275\u0275elementEnd();
  }
}
function OILibraryComponent_div_15_div_2_span_7_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span");
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const a_r3 = i0.\u0275\u0275nextContext().$implicit;
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(a_r3.divisions.division_name);
  }
}
function OILibraryComponent_div_15_div_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 25)(1, "div", 18)(2, "div", 26);
    i0.\u0275\u0275text(3);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(4, "div", 27);
    i0.\u0275\u0275template(5, OILibraryComponent_div_15_div_2_span_5_Template, 2, 1, "span", 11)(6, OILibraryComponent_div_15_div_2_span_6_Template, 2, 0, "span", 11)(7, OILibraryComponent_div_15_div_2_span_7_Template, 2, 1, "span", 11);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(8, "div", 28)(9, "span", 29);
    i0.\u0275\u0275text(10);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(11, "span", 30);
    i0.\u0275\u0275text(12, "\u203A");
    i0.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const a_r3 = ctx.$implicit;
    const ctx_r1 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275property("routerLink", i0.\u0275\u0275pureFunction1(10, _c0, a_r3.id));
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1(" ", a_r3.artifact_title, " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngIf", a_r3.artifact_types);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", a_r3.artifact_types && a_r3.divisions);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", a_r3.divisions);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275styleProp("background", ctx_r1.statusBg(a_r3.lifecycle_status))("color", ctx_r1.statusColor(a_r3.lifecycle_status));
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(a_r3.lifecycle_status);
  }
}
function OILibraryComponent_div_15_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div");
    i0.\u0275\u0275template(1, OILibraryComponent_div_15_div_1_Template, 2, 1, "div", 22)(2, OILibraryComponent_div_15_div_2_Template, 13, 12, "div", 23);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r1.artifacts.length === 0 && !ctx_r1.blockedMessage);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r1.artifacts);
  }
}
function OILibraryComponent_div_16_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "div", 31)(1, "button", 32);
    i0.\u0275\u0275listener("click", function OILibraryComponent_div_16_Template_button_click_1_listener() {
      i0.\u0275\u0275restoreView(_r4);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.prevPage());
    });
    i0.\u0275\u0275text(2, "\u2190 Prev");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "span", 33);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "button", 32);
    i0.\u0275\u0275listener("click", function OILibraryComponent_div_16_Template_button_click_5_listener() {
      i0.\u0275\u0275restoreView(_r4);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.nextPage());
    });
    i0.\u0275\u0275text(6, "Next \u2192");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("disabled", ctx_r1.page === 1);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1(" Page ", ctx_r1.page, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("disabled", ctx_r1.artifacts.length < ctx_r1.pageSize);
  }
}
var OILibraryComponent = class _OILibraryComponent {
  constructor(mcp, fb, cdr) {
    this.mcp = mcp;
    this.fb = fb;
    this.cdr = cdr;
    this.artifacts = [];
    this.loading = false;
    this.searching = false;
    this.isSearching = false;
    this.lastQuery = "";
    this.totalCount = 0;
    this.page = 1;
    this.pageSize = 20;
    this.blockedMessage = "";
    this.blockedHint = "";
    this.skeletonRows = [1, 2, 3, 4];
  }
  ngOnInit() {
    this.searchForm = this.fb.group({ query: [""] });
    this.loadPage(1);
  }
  // ── Data ───────────────────────────────────────────────────────────────────
  loadPage(page) {
    this.loading = true;
    this.isSearching = false;
    this.blockedMessage = "";
    this.cdr.markForCheck();
    this.mcp.call("document", "list_documents", { page_number: page, page_size: this.pageSize }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.artifacts = res.data.artifacts;
          this.totalCount = res.data.total_count;
          this.page = res.data.page_number;
        } else {
          this.setBlocked(res.error ?? "Could not load the library.", "Ensure you have Division membership and your session is active.");
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.setBlocked(err.error ?? "Could not load the library.", "Ensure you have Division membership and your session is active.");
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ── Search ─────────────────────────────────────────────────────────────────
  search() {
    const query = (this.searchForm.value.query ?? "").trim();
    if (!query) {
      this.clearSearch();
      return;
    }
    this.searching = true;
    this.lastQuery = query;
    this.blockedMessage = "";
    this.cdr.markForCheck();
    this.mcp.call("document", "search_documents", { query }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.artifacts = res.data.results;
          this.totalCount = res.data.total_count;
          this.isSearching = true;
        } else {
          this.setBlocked(res.error ?? "Search failed.", "");
        }
        this.searching = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.setBlocked(err.error ?? "Search failed.", "Try a different search term.");
        this.searching = false;
        this.cdr.markForCheck();
      }
    });
  }
  clearSearch() {
    this.searchForm.reset();
    this.isSearching = false;
    this.lastQuery = "";
    this.blockedMessage = "";
    this.loadPage(1);
  }
  // ── Pagination ─────────────────────────────────────────────────────────────
  nextPage() {
    this.loadPage(this.page + 1);
  }
  prevPage() {
    if (this.page > 1) {
      this.loadPage(this.page - 1);
    }
  }
  // ── Presentation helpers ───────────────────────────────────────────────────
  statusBg(status) {
    const map = {
      canon: "var(--triarq-color-primary)",
      candidate: "#e3f2fd",
      seed_review: "#fff3e0",
      draft: "var(--triarq-color-background-subtle)",
      superseded: "#f5f5f5",
      archived: "#f5f5f5"
    };
    return map[status] ?? "var(--triarq-color-background-subtle)";
  }
  statusColor(status) {
    const map = {
      canon: "#ffffff",
      candidate: "#1565c0",
      seed_review: "#e65100",
      draft: "var(--triarq-color-text-secondary)",
      superseded: "#9e9e9e",
      archived: "#9e9e9e"
    };
    return map[status] ?? "var(--triarq-color-text-secondary)";
  }
  setBlocked(primary, hint) {
    this.blockedMessage = primary;
    this.blockedHint = hint;
  }
  static {
    this.\u0275fac = function OILibraryComponent_Factory(t) {
      return new (t || _OILibraryComponent)(i0.\u0275\u0275directiveInject(McpService), i0.\u0275\u0275directiveInject(i2.FormBuilder), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _OILibraryComponent, selectors: [["app-oi-library"]], standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 17, vars: 11, consts: [[1, "oi-card", 2, "max-width", "960px", "margin", "var(--triarq-space-2xl) auto"], [2, "display", "flex", "align-items", "center", "justify-content", "space-between", "margin-bottom", "var(--triarq-space-md)"], [2, "margin", "0"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], [2, "margin-bottom", "var(--triarq-space-md)", 3, "ngSubmit", "formGroup"], [2, "display", "flex", "gap", "var(--triarq-space-sm)"], ["formControlName", "query", "placeholder", "Search by title\u2026", 1, "oi-input", 2, "flex", "1"], ["type", "submit", 1, "oi-btn-primary", 3, "disabled"], ["name", "crescent", "style", "width:16px;height:16px;vertical-align:middle;margin-right:6px;", 4, "ngIf"], ["type", "button", "class", "oi-btn-secondary", 3, "click", 4, "ngIf"], [3, "primaryMessage", "secondaryMessage", 4, "ngIf"], [4, "ngIf"], ["style", "margin-top:var(--triarq-space-md);display:flex;\n               justify-content:center;gap:var(--triarq-space-sm);", 4, "ngIf"], ["name", "crescent", 2, "width", "16px", "height", "16px", "vertical-align", "middle", "margin-right", "6px"], ["type", "button", 1, "oi-btn-secondary", 3, "click"], [3, "primaryMessage", "secondaryMessage"], ["style", "display:flex;align-items:flex-start;justify-content:space-between;\n                    padding:var(--triarq-space-sm) var(--triarq-space-md);\n                    border-radius:6px;margin-bottom:6px;\n                    border:1px solid var(--triarq-color-border);gap:var(--triarq-space-md);", 4, "ngFor", "ngForOf"], [2, "display", "flex", "align-items", "flex-start", "justify-content", "space-between", "padding", "var(--triarq-space-sm) var(--triarq-space-md)", "border-radius", "6px", "margin-bottom", "6px", "border", "1px solid var(--triarq-color-border)", "gap", "var(--triarq-space-md)"], [2, "flex", "1", "min-width", "0"], ["animated", "", 2, "height", "16px", "border-radius", "4px", "margin-bottom", "6px"], ["animated", "", 2, "height", "12px", "border-radius", "4px", "width", "60%"], ["animated", "", 2, "height", "20px", "width", "70px", "border-radius", "999px", "flex-shrink", "0"], ["style", "text-align:center;padding:var(--triarq-space-xl);\n                 color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);", 4, "ngIf"], ["style", "display:flex;align-items:flex-start;justify-content:space-between;\n                 padding:var(--triarq-space-sm) var(--triarq-space-md);\n                 border-radius:6px;margin-bottom:6px;cursor:pointer;\n                 border:1px solid var(--triarq-color-border);transition:background 0.15s;", "onmouseenter", "this.style.background='var(--triarq-color-background-subtle)'", "onmouseleave", "this.style.background=''", 3, "routerLink", 4, "ngFor", "ngForOf"], [2, "text-align", "center", "padding", "var(--triarq-space-xl)", "color", "var(--triarq-color-text-secondary)", "font-size", "var(--triarq-text-small)"], ["onmouseenter", "this.style.background='var(--triarq-color-background-subtle)'", "onmouseleave", "this.style.background=''", 2, "display", "flex", "align-items", "flex-start", "justify-content", "space-between", "padding", "var(--triarq-space-sm) var(--triarq-space-md)", "border-radius", "6px", "margin-bottom", "6px", "cursor", "pointer", "border", "1px solid var(--triarq-color-border)", "transition", "background 0.15s", 3, "routerLink"], [2, "font-weight", "500", "color", "var(--triarq-color-text-primary)", "white-space", "nowrap", "overflow", "hidden", "text-overflow", "ellipsis"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "margin-top", "2px"], [2, "display", "flex", "align-items", "center", "gap", "var(--triarq-space-sm)", "margin-left", "var(--triarq-space-md)"], [1, "oi-pill"], [2, "color", "var(--triarq-color-text-tertiary)", "font-size", "20px"], [2, "margin-top", "var(--triarq-space-md)", "display", "flex", "justify-content", "center", "gap", "var(--triarq-space-sm)"], [1, "oi-btn-secondary", 2, "font-size", "var(--triarq-text-small)", 3, "click", "disabled"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "align-self", "center"]], template: function OILibraryComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h3", 2);
        i0.\u0275\u0275text(3, "OI Library");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(4, "span", 3);
        i0.\u0275\u0275text(5);
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275elementStart(6, "form", 4);
        i0.\u0275\u0275listener("ngSubmit", function OILibraryComponent_Template_form_ngSubmit_6_listener() {
          return ctx.search();
        });
        i0.\u0275\u0275elementStart(7, "div", 5);
        i0.\u0275\u0275element(8, "input", 6);
        i0.\u0275\u0275elementStart(9, "button", 7);
        i0.\u0275\u0275template(10, OILibraryComponent_ion_spinner_10_Template, 1, 0, "ion-spinner", 8);
        i0.\u0275\u0275text(11);
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275template(12, OILibraryComponent_button_12_Template, 2, 0, "button", 9);
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275template(13, OILibraryComponent_app_blocked_action_13_Template, 1, 2, "app-blocked-action", 10)(14, OILibraryComponent_div_14_Template, 2, 1, "div", 11)(15, OILibraryComponent_div_15_Template, 3, 2, "div", 11)(16, OILibraryComponent_div_16_Template, 7, 3, "div", 12);
        i0.\u0275\u0275elementEnd();
      }
      if (rf & 2) {
        i0.\u0275\u0275advance(5);
        i0.\u0275\u0275textInterpolate2(" ", ctx.totalCount, " artifact", ctx.totalCount === 1 ? "" : "s", " ");
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("formGroup", ctx.searchForm);
        i0.\u0275\u0275advance(3);
        i0.\u0275\u0275property("disabled", ctx.searching);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.searching);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275textInterpolate1(" ", ctx.searching ? "Searching\u2026" : "Search", " ");
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.isSearching);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.blockedMessage);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && !ctx.isSearching && ctx.artifacts.length > 0);
      }
    }, dependencies: [CommonModule, i3.NgForOf, i3.NgIf, RouterModule, i4.RouterLink, ReactiveFormsModule, i2.\u0275NgNoValidate, i2.DefaultValueAccessor, i2.NgControlStatus, i2.NgControlStatusGroup, i2.FormGroupDirective, i2.FormControlName, IonicModule, IonSkeletonText, IonSpinner, RouterLinkDelegateDirective, BlockedActionComponent], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(OILibraryComponent, { className: "OILibraryComponent", filePath: "src\\app\\features\\oi-library\\oi-library.component.ts", lineNumber: 166 });
})();
export {
  OILibraryComponent
};
//# sourceMappingURL=oi-library.component-ZBFHL54B.js.map
