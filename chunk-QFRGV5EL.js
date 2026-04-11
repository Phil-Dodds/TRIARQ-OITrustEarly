// src/app/shared/components/blocked-action/blocked-action.component.ts
import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
function BlockedActionComponent_p_3_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "p", 3);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r0.secondaryMessage);
  }
}
var BlockedActionComponent = class _BlockedActionComponent {
  constructor() {
    this.primaryMessage = "";
    this.secondaryMessage = "";
  }
  static {
    this.\u0275fac = function BlockedActionComponent_Factory(t) {
      return new (t || _BlockedActionComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _BlockedActionComponent, selectors: [["app-blocked-action"]], inputs: { primaryMessage: "primaryMessage", secondaryMessage: "secondaryMessage" }, standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 4, vars: 2, consts: [["role", "alert", 1, "oi-blocked-action"], [1, "oi-blocked-primary"], ["class", "oi-blocked-secondary", 4, "ngIf"], [1, "oi-blocked-secondary"]], template: function BlockedActionComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "p", 1);
        i0.\u0275\u0275text(2);
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275template(3, BlockedActionComponent_p_3_Template, 2, 1, "p", 2);
        i0.\u0275\u0275elementEnd();
      }
      if (rf & 2) {
        i0.\u0275\u0275advance(2);
        i0.\u0275\u0275textInterpolate(ctx.primaryMessage);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.secondaryMessage);
      }
    }, dependencies: [CommonModule, i1.NgIf], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(BlockedActionComponent, { className: "BlockedActionComponent", filePath: "src\\app\\shared\\components\\blocked-action\\blocked-action.component.ts", lineNumber: 22 });
})();

export {
  BlockedActionComponent
};
//# sourceMappingURL=chunk-QFRGV5EL.js.map
