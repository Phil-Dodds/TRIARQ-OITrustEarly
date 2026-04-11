import {
  IonicModule
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

// src/app/features/delivery/delivery.module.ts
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import * as i0 from "@angular/core";
var DeliveryModule = class _DeliveryModule {
  static {
    this.\u0275fac = function DeliveryModule_Factory(t) {
      return new (t || _DeliveryModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ i0.\u0275\u0275defineNgModule({ type: _DeliveryModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ i0.\u0275\u0275defineInjector({ imports: [
      CommonModule,
      IonicModule,
      RouterModule.forChild([
        // ── Hub (D-171) ───────────────────────────────────────────────────────
        {
          path: "",
          loadComponent: () => import("./delivery-hub.component-3DT4ZKPF.js").then((c) => c.DeliveryHubComponent)
        },
        // ── Summary views ─────────────────────────────────────────────────────
        {
          path: "workstreams",
          loadComponent: () => import("./workstream-summary.component-U3RSAVRH.js").then((c) => c.WorkstreamSummaryComponent)
        },
        {
          path: "divisions",
          loadComponent: () => import("./division-summary.component-MLQBDQPK.js").then((c) => c.DivisionSummaryComponent)
        },
        {
          path: "gates",
          loadComponent: () => import("./gates-summary.component-UH6JRAXO.js").then((c) => c.GatesSummaryComponent)
        },
        // ── Full cycle list (moved from '' to 'cycles' — D-188) ───────────────
        {
          path: "cycles",
          loadComponent: () => import("./delivery-cycle-dashboard.component-ICSSFFAT.js").then((c) => c.DeliveryCycleDashboardComponent)
        },
        // ── Cycle detail — must be last (param route) ─────────────────────────
        {
          path: ":cycle_id",
          loadComponent: () => import("./delivery-cycle-detail.component-4LUUKPHT.js").then((c) => c.DeliveryCycleDetailComponent)
        }
      ])
    ] });
  }
};
export {
  DeliveryModule
};
//# sourceMappingURL=delivery.module-CH3CQDTO.js.map
