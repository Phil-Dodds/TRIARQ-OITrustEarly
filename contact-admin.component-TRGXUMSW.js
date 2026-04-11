import {
  UserProfileService
} from "./chunk-G46Y23DK.js";
import "./chunk-SQSDYRWS.js";
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
import "./chunk-DSWO3WHD.js";

// src/app/features/contact-admin/contact-admin.component.ts
import { Component, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import * as i0 from "@angular/core";
import * as i2 from "@angular/common";
import * as i3 from "@angular/router";
var _c0 = () => [1, 2, 3];
function ContactAdminComponent_div_5_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 9);
    i0.\u0275\u0275element(1, "ion-skeleton-text", 10)(2, "ion-skeleton-text", 10);
    i0.\u0275\u0275elementEnd();
  }
}
function ContactAdminComponent_div_5_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 7);
    i0.\u0275\u0275template(1, ContactAdminComponent_div_5_div_1_Template, 3, 0, "div", 8);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", i0.\u0275\u0275pureFunction0(1, _c0));
  }
}
function ContactAdminComponent_div_6_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 7)(1, "div", 11);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 12);
    i0.\u0275\u0275text(4, " Try refreshing the page. If the problem persists, contact your IT team directly. ");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r0.loadError, " ");
  }
}
function ContactAdminComponent_div_7_div_1_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 16);
    i0.\u0275\u0275text(1, " No Admins are currently configured. Contact your IT team directly. ");
    i0.\u0275\u0275elementEnd();
  }
}
function ContactAdminComponent_div_7_div_2_a_7_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "a", 22)(1, "span", 23);
    i0.\u0275\u0275text(2, "\u2709");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275text(3);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const admin_r2 = i0.\u0275\u0275nextContext().$implicit;
    i0.\u0275\u0275property("href", "mailto:" + admin_r2.email, i0.\u0275\u0275sanitizeUrl);
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1(" ", admin_r2.email, " ");
  }
}
function ContactAdminComponent_div_7_div_2_span_8_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 24);
    i0.\u0275\u0275text(1, " No email on record ");
    i0.\u0275\u0275elementEnd();
  }
}
function ContactAdminComponent_div_7_div_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 17)(1, "div")(2, "div", 18);
    i0.\u0275\u0275text(3);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(4, "span", 19);
    i0.\u0275\u0275text(5);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(6, "div");
    i0.\u0275\u0275template(7, ContactAdminComponent_div_7_div_2_a_7_Template, 4, 2, "a", 20)(8, ContactAdminComponent_div_7_div_2_span_8_Template, 2, 0, "span", 21);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const admin_r2 = ctx.$implicit;
    const last_r3 = ctx.last;
    i0.\u0275\u0275styleProp("border-bottom", last_r3 ? "none" : "1px solid var(--triarq-color-border)");
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1(" ", admin_r2.display_name, " ");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275styleProp("background", admin_r2.system_role === "phil" ? "var(--triarq-color-primary)" : "var(--triarq-color-background-subtle)")("color", admin_r2.system_role === "phil" ? "#fff" : "var(--triarq-color-text-secondary)");
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", admin_r2.system_role === "phil" ? "System Owner" : "Admin", " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngIf", admin_r2.email);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", !admin_r2.email);
  }
}
function ContactAdminComponent_div_7_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 13);
    i0.\u0275\u0275template(1, ContactAdminComponent_div_7_div_1_Template, 2, 0, "div", 14)(2, ContactAdminComponent_div_7_div_2_Template, 9, 10, "div", 15);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.admins.length === 0);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r0.admins);
  }
}
var ContactAdminComponent = class _ContactAdminComponent {
  constructor(profileService, cdr) {
    this.profileService = profileService;
    this.cdr = cdr;
    this.admins = [];
    this.loading = true;
    this.loadError = "";
  }
  ngOnInit() {
    this.profileService.listAdmins().subscribe({
      next: (admins) => {
        this.admins = admins;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadError = "Could not load the Admin list.";
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  static {
    this.\u0275fac = function ContactAdminComponent_Factory(t) {
      return new (t || _ContactAdminComponent)(i0.\u0275\u0275directiveInject(UserProfileService), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _ContactAdminComponent, selectors: [["app-contact-admin"]], standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 11, vars: 3, consts: [[2, "max-width", "640px", "margin", "var(--triarq-space-2xl) auto", "padding", "0 var(--triarq-space-md)"], [2, "font-size", "var(--triarq-text-h3,24px)", "font-weight", "600", "margin", "0 0 var(--triarq-space-xs) 0", "color", "var(--triarq-color-text-primary)"], [2, "margin", "0 0 var(--triarq-space-lg) 0", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], ["class", "oi-card", 4, "ngIf"], ["class", "oi-card", "style", "padding:0;", 4, "ngIf"], [2, "margin-top", "var(--triarq-space-lg)"], ["routerLink", "/home", 2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)", "text-decoration", "none"], [1, "oi-card"], ["style", "display:grid;grid-template-columns:1fr 2fr;gap:var(--triarq-space-sm);\n                    padding:var(--triarq-space-sm) 0;\n                    border-bottom:1px solid var(--triarq-color-border);", 4, "ngFor", "ngForOf"], [2, "display", "grid", "grid-template-columns", "1fr 2fr", "gap", "var(--triarq-space-sm)", "padding", "var(--triarq-space-sm) 0", "border-bottom", "1px solid var(--triarq-color-border)"], ["animated", "", 2, "height", "15px", "border-radius", "4px"], [2, "color", "var(--triarq-color-error)", "font-weight", "500", "margin-bottom", "6px"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], [1, "oi-card", 2, "padding", "0"], ["style", "padding:var(--triarq-space-lg);font-size:var(--triarq-text-small);\n                    color:var(--triarq-color-text-secondary);", 4, "ngIf"], ["style", "display:grid;grid-template-columns:1fr 2fr;gap:var(--triarq-space-md);\n                    align-items:center;padding:var(--triarq-space-md) var(--triarq-space-lg);", 3, "border-bottom", 4, "ngFor", "ngForOf"], [2, "padding", "var(--triarq-space-lg)", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], [2, "display", "grid", "grid-template-columns", "1fr 2fr", "gap", "var(--triarq-space-md)", "align-items", "center", "padding", "var(--triarq-space-md) var(--triarq-space-lg)"], [2, "font-weight", "500", "color", "var(--triarq-color-text-primary)", "margin-bottom", "3px"], [1, "oi-pill", 2, "font-size", "10px"], ["style", "color:var(--triarq-color-primary);font-size:var(--triarq-text-small);\n                      text-decoration:none;display:inline-flex;align-items:center;gap:6px;", 3, "href", 4, "ngIf"], ["style", "font-size:var(--triarq-text-small);\n                         color:var(--triarq-color-text-secondary);font-style:italic;", 4, "ngIf"], [2, "color", "var(--triarq-color-primary)", "font-size", "var(--triarq-text-small)", "text-decoration", "none", "display", "inline-flex", "align-items", "center", "gap", "6px", 3, "href"], [2, "font-size", "14px"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "font-style", "italic"]], template: function ContactAdminComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "h2", 1);
        i0.\u0275\u0275text(2, " Contact an Admin ");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(3, "p", 2);
        i0.\u0275\u0275text(4, " The following Admins have full system access and can help with access requests, account issues, or any question about Pathways OI Trust. Click an email address to send a message directly. ");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275template(5, ContactAdminComponent_div_5_Template, 2, 2, "div", 3)(6, ContactAdminComponent_div_6_Template, 5, 1, "div", 3)(7, ContactAdminComponent_div_7_Template, 3, 2, "div", 4);
        i0.\u0275\u0275elementStart(8, "div", 5)(9, "a", 6);
        i0.\u0275\u0275text(10, " \u2190 Back to Home ");
        i0.\u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        i0.\u0275\u0275advance(5);
        i0.\u0275\u0275property("ngIf", ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && ctx.loadError);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && !ctx.loadError);
      }
    }, dependencies: [CommonModule, i2.NgForOf, i2.NgIf, RouterModule, i3.RouterLink, IonicModule, IonSkeletonText, RouterLinkWithHrefDelegateDirective], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(ContactAdminComponent, { className: "ContactAdminComponent", filePath: "src\\app\\features\\contact-admin\\contact-admin.component.ts", lineNumber: 127 });
})();
export {
  ContactAdminComponent
};
//# sourceMappingURL=contact-admin.component-TRGXUMSW.js.map
