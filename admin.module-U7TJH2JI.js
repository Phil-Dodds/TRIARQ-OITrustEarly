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

// src/app/features/admin/admin.module.ts
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import * as i0 from "@angular/core";
var AdminModule = class _AdminModule {
  static {
    this.\u0275fac = function AdminModule_Factory(t) {
      return new (t || _AdminModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ i0.\u0275\u0275defineNgModule({ type: _AdminModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ i0.\u0275\u0275defineInjector({ imports: [
      CommonModule,
      ReactiveFormsModule,
      IonicModule,
      RouterModule.forChild([
        { path: "", loadComponent: () => import("./admin-hub.component-7MQ7FOMX.js").then((c) => c.AdminHubComponent) },
        { path: "divisions", loadComponent: () => import("./divisions.component-YVLM4ZSL.js").then((c) => c.DivisionsComponent) },
        { path: "users", loadComponent: () => import("./users.component-HXK5ODVY.js").then((c) => c.UsersComponent) },
        { path: "workstreams", loadComponent: () => import("./workstream-admin.component-UDGZ5RWW.js").then((c) => c.WorkstreamAdminComponent) }
      ])
    ] });
  }
};
export {
  AdminModule
};
//# sourceMappingURL=admin.module-U7TJH2JI.js.map
