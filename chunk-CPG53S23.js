import {
  IonSpinner,
  IonicModule
} from "./chunk-XICHVGJY.js";

// src/app/shared/components/loading-overlay/loading-overlay.component.ts
import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
function LoadingOverlayComponent_div_0_div_2_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 4);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", ctx_r0.message, " ");
  }
}
function LoadingOverlayComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 1);
    i0.\u0275\u0275element(1, "ion-spinner", 2);
    i0.\u0275\u0275template(2, LoadingOverlayComponent_div_0_div_2_Template, 2, 1, "div", 3);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngIf", ctx_r0.message);
  }
}
var LoadingOverlayComponent = class _LoadingOverlayComponent {
  constructor() {
    this.visible = false;
    this.message = "";
  }
  static {
    this.\u0275fac = function LoadingOverlayComponent_Factory(t) {
      return new (t || _LoadingOverlayComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _LoadingOverlayComponent, selectors: [["app-loading-overlay"]], inputs: { visible: "visible", message: "message" }, standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 1, vars: 1, consts: [["style", "position:absolute;\n                inset:0;\n                background:rgba(255,255,255,0.82);\n                z-index:20;\n                display:flex;\n                flex-direction:column;\n                align-items:center;\n                justify-content:center;\n                border-radius:10px;", 4, "ngIf"], [2, "position", "absolute", "inset", "0", "background", "rgba(255,255,255,0.82)", "z-index", "20", "display", "flex", "flex-direction", "column", "align-items", "center", "justify-content", "center", "border-radius", "10px"], ["name", "crescent", 2, "color", "var(--triarq-color-primary)", "width", "32px", "height", "32px"], ["style", "margin-top:var(--triarq-space-sm);\n                  font-size:var(--triarq-text-small);\n                  color:var(--triarq-color-text-secondary);\n                  text-align:center;", 4, "ngIf"], [2, "margin-top", "var(--triarq-space-sm)", "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)", "text-align", "center"]], template: function LoadingOverlayComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275template(0, LoadingOverlayComponent_div_0_Template, 3, 1, "div", 0);
      }
      if (rf & 2) {
        i0.\u0275\u0275property("ngIf", ctx.visible);
      }
    }, dependencies: [CommonModule, i1.NgIf, IonicModule, IonSpinner], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(LoadingOverlayComponent, { className: "LoadingOverlayComponent", filePath: "src\\app\\shared\\components\\loading-overlay\\loading-overlay.component.ts", lineNumber: 54 });
})();

export {
  LoadingOverlayComponent
};
//# sourceMappingURL=chunk-CPG53S23.js.map
