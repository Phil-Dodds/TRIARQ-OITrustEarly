import "./chunk-DSWO3WHD.js";

// src/app/features/delivery/hub/delivery-hub.component.ts
import { Component, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular/router";
function DeliveryHubComponent_a_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = i0.\u0275\u0275getCurrentView();
    i0.\u0275\u0275elementStart(0, "a", 6);
    i0.\u0275\u0275listener("mouseenter", function DeliveryHubComponent_a_7_Template_a_mouseenter_0_listener($event) {
      i0.\u0275\u0275restoreView(_r1);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.onCardEnter($event));
    })("mouseleave", function DeliveryHubComponent_a_7_Template_a_mouseleave_0_listener($event) {
      i0.\u0275\u0275restoreView(_r1);
      const ctx_r1 = i0.\u0275\u0275nextContext();
      return i0.\u0275\u0275resetView(ctx_r1.onCardLeave($event));
    });
    i0.\u0275\u0275elementStart(1, "div", 7);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 8);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "div", 9);
    i0.\u0275\u0275text(6);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(7, "div", 10);
    i0.\u0275\u0275text(8, " Open view \u2192 ");
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const card_r3 = ctx.$implicit;
    i0.\u0275\u0275property("routerLink", card_r3.route);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", card_r3.icon, " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", card_r3.title, " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", card_r3.description, " ");
  }
}
var HUB_CARDS = [
  {
    title: "All Delivery Cycles",
    route: "/delivery/cycles",
    icon: "\u2261",
    description: "The full list of active cycles with filtering by stage, tier, workstream, division, and next gate. Use this when you know the cycle you are looking for, or want to apply a combination of filters."
  },
  {
    title: "Workstream Summary",
    route: "/delivery/workstreams",
    icon: "\u27F3",
    description: "WIP counts per workstream across Prep, Build, and Outcome stages. Identify workstreams over the 4-cycle WIP limit and see how many cycles are queued at each gate. Click a count to see the matching cycles."
  },
  {
    title: "Gate Schedule",
    route: "/delivery/gates",
    icon: "\u25B7",
    description: "Gates coming up in the next 7 days and gates with overdue target dates. Use this to prioritize approval actions and identify stalled cycles. Click a gate row to see the Delivery Cycles waiting on it."
  },
  {
    title: "Deploy Gate by Quarter",
    route: "/delivery/deploy-schedule",
    icon: "\u25EB",
    description: "Go to Release gates grouped by quarter. See which cycles are scheduled to reach production each quarter and track commitment against target dates. Use this for release planning and capacity conversations."
  }
];
var DeliveryHubComponent = class _DeliveryHubComponent {
  constructor() {
    this.cards = HUB_CARDS;
  }
  onCardEnter(event) {
    const el = event.currentTarget;
    el.style.borderColor = "var(--triarq-color-primary)";
    el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
  }
  onCardLeave(event) {
    const el = event.currentTarget;
    el.style.borderColor = "var(--triarq-color-border)";
    el.style.boxShadow = "";
  }
  static {
    this.\u0275fac = function DeliveryHubComponent_Factory(t) {
      return new (t || _DeliveryHubComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _DeliveryHubComponent, selectors: [["app-delivery-hub"]], standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 8, vars: 1, consts: [[2, "max-width", "880px", "margin", "var(--triarq-space-2xl) auto", "padding", "0 var(--triarq-space-md)"], [2, "margin-bottom", "var(--triarq-space-lg)"], [2, "margin", "0 0 4px 0"], [2, "margin", "0", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "max-width", "620px"], [2, "display", "grid", "grid-template-columns", "1fr 1fr", "gap", "var(--triarq-space-md)"], ["style", "display:block;padding:var(--triarq-space-lg);\n                  text-decoration:none;cursor:pointer;\n                  border:1px solid var(--triarq-color-border);\n                  border-radius:10px;\n                  background:var(--triarq-color-background-subtle, #fff);\n                  transition:border-color 0.15s, box-shadow 0.15s;", 3, "routerLink", "mouseenter", "mouseleave", 4, "ngFor", "ngForOf"], [2, "display", "block", "padding", "var(--triarq-space-lg)", "text-decoration", "none", "cursor", "pointer", "border", "1px solid var(--triarq-color-border)", "border-radius", "10px", "background", "var(--triarq-color-background-subtle, #fff)", "transition", "border-color 0.15s, box-shadow 0.15s", 3, "mouseenter", "mouseleave", "routerLink"], [2, "font-size", "28px", "margin-bottom", "var(--triarq-space-xs)", "color", "var(--triarq-color-primary)"], [2, "font-weight", "600", "color", "var(--triarq-color-text-primary)", "margin-bottom", "var(--triarq-space-xs)", "font-size", "var(--triarq-text-body)"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "line-height", "1.55"], [2, "margin-top", "var(--triarq-space-sm)", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)", "font-weight", "500"]], template: function DeliveryHubComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h3", 2);
        i0.\u0275\u0275text(3, "Delivery Cycle Tracking");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(4, "p", 3);
        i0.\u0275\u0275text(5, " Select a view to explore active delivery cycles across your divisions. Each view groups and filters cycles differently \u2014 choose the one that matches your current question. ");
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275elementStart(6, "div", 4);
        i0.\u0275\u0275template(7, DeliveryHubComponent_a_7_Template, 9, 4, "a", 5);
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
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(DeliveryHubComponent, { className: "DeliveryHubComponent", filePath: "src\\app\\features\\delivery\\hub\\delivery-hub.component.ts", lineNumber: 118 });
})();
export {
  DeliveryHubComponent
};
//# sourceMappingURL=delivery-hub.component-3DT4ZKPF.js.map
