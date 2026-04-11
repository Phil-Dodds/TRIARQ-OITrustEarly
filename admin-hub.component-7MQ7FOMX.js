import "./chunk-DSWO3WHD.js";

// src/app/features/admin/admin-hub.component.ts
import { Component, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular/router";
function AdminHubComponent_a_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "a", 6)(1, "div", 7);
    i0.\u0275\u0275listener("mouseenter", function AdminHubComponent_a_7_Template_div_mouseenter_1_listener($event) {
      i0.\u0275\u0275restoreView(_r1);
      return i0.\u0275\u0275resetView($event.currentTarget.style.boxShadow = "0 2px 12px rgba(37,112,153,0.12)");
    })("mouseleave", function AdminHubComponent_a_7_Template_div_mouseleave_1_listener($event) {
      i0.\u0275\u0275restoreView(_r1);
      return i0.\u0275\u0275resetView($event.currentTarget.style.boxShadow = "");
    });
    i0.\u0275\u0275elementStart(2, "div", 8)(3, "span", 9);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "span", 10);
    i0.\u0275\u0275text(6);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275elementStart(7, "p", 11);
    i0.\u0275\u0275text(8);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(9, "div", 12)(10, "span");
    i0.\u0275\u0275text(11);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(12, "span");
    i0.\u0275\u0275text(13, "\u2192");
    i0.\u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const card_r2 = ctx.$implicit;
    i0.\u0275\u0275property("routerLink", card_r2.route);
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275textInterpolate1(" ", card_r2.icon, " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", card_r2.title, " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", card_r2.description, " ");
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1("Open ", card_r2.title, "");
  }
}
var ADMIN_CARDS = [
  {
    title: "Delivery Workstreams",
    description: "Create and manage Workstreams \u2014 the persistent delivery teams that Delivery Cycles are assigned to. Activating or deactivating a Workstream directly controls whether its cycles can clear gates.",
    who: "Phil and Admin",
    route: "workstreams",
    icon: "\u2B21"
  },
  {
    title: "Divisions",
    description: "View and manage the Division hierarchy. Divisions scope which users can see which cycles, artifacts, and library content. Changes here affect access across the entire system.",
    who: "Phil and Admin",
    route: "divisions",
    icon: "\u25EB"
  },
  {
    title: "Users",
    description: "View all user accounts, system roles, and active status. Assign roles and manage user access. A user without a Division assignment sees an onboarding message until assigned.",
    who: "Phil and Admin",
    route: "users",
    icon: "\u25CE"
  }
];
var AdminHubComponent = class _AdminHubComponent {
  constructor() {
    this.cards = ADMIN_CARDS;
  }
  static {
    this.\u0275fac = function AdminHubComponent_Factory(t) {
      return new (t || _AdminHubComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _AdminHubComponent, selectors: [["app-admin-hub"]], standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 8, vars: 1, consts: [[2, "max-width", "900px", "margin", "var(--triarq-space-2xl) auto", "padding", "0 var(--triarq-space-md)"], [2, "margin-bottom", "var(--triarq-space-xl)"], [2, "margin", "0 0 6px 0"], [2, "margin", "0", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "max-width", "560px"], [2, "display", "grid", "grid-template-columns", "1fr 1fr", "gap", "var(--triarq-space-md)"], ["style", "display:block;text-decoration:none;color:inherit;", 3, "routerLink", 4, "ngFor", "ngForOf"], [2, "display", "block", "text-decoration", "none", "color", "inherit", 3, "routerLink"], [1, "oi-card", 2, "height", "100%", "box-sizing", "border-box", "transition", "box-shadow 0.15s", "cursor", "pointer", 3, "mouseenter", "mouseleave"], [2, "display", "flex", "align-items", "center", "gap", "var(--triarq-space-sm)", "margin-bottom", "var(--triarq-space-sm)"], [2, "font-size", "24px", "line-height", "1", "color", "var(--triarq-color-primary)"], [2, "font-weight", "600", "font-size", "var(--triarq-text-body)", "color", "var(--triarq-color-text-primary)"], [2, "margin", "0 0 var(--triarq-space-sm) 0", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "line-height", "1.5"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)", "display", "flex", "align-items", "center", "gap", "4px"]], template: function AdminHubComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h3", 2);
        i0.\u0275\u0275text(3, "Administration");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(4, "p", 3);
        i0.\u0275\u0275text(5, " System configuration and governance management. Changes made here affect access, workflow, and data visibility across all Divisions. Proceed deliberately \u2014 most actions are not reversible without admin intervention. ");
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275elementStart(6, "div", 4);
        i0.\u0275\u0275template(7, AdminHubComponent_a_7_Template, 14, 5, "a", 5);
        i0.\u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        i0.\u0275\u0275advance(7);
        i0.\u0275\u0275property("ngForOf", ctx.cards);
      }
    }, dependencies: [CommonModule, i1.NgForOf, RouterModule, i2.RouterLink], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(AdminHubComponent, { className: "AdminHubComponent", filePath: "src\\app\\features\\admin\\admin-hub.component.ts", lineNumber: 100 });
})();
export {
  AdminHubComponent
};
//# sourceMappingURL=admin-hub.component-7MQ7FOMX.js.map
