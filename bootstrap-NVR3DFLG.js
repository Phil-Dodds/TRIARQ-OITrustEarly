import {
  UserProfileService
} from "./chunk-G46Y23DK.js";
import {
  BlockedActionComponent
} from "./chunk-QFRGV5EL.js";
import {
  AuthService
} from "./chunk-SQSDYRWS.js";
import {
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
import {
  __async
} from "./chunk-DSWO3WHD.js";

// src/bootstrap.ts
import * as __NgCli_bootstrap_1 from "@angular/platform-browser";

// src/app/app.module.ts
import { NgModule as NgModule2 } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { ReactiveFormsModule } from "@angular/forms";

// src/app/app-routing.module.ts
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

// src/app/features/login/login.component.ts
import { Component, ChangeDetectionStrategy } from "@angular/core";
import { Validators } from "@angular/forms";
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
import * as i3 from "@angular/router";
import * as i4 from "@angular/common";
function LoginComponent_div_11_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 30)(1, "p", 31);
    i0.\u0275\u0275text(2);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "p", 32);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate(ctx_r0.callbackErrorPrimary);
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate(ctx_r0.callbackErrorSecondary);
  }
}
function LoginComponent_p_17_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "p", 33);
    i0.\u0275\u0275text(1, "Enter a valid email address.");
    i0.\u0275\u0275elementEnd();
  }
}
function LoginComponent_app_blocked_action_18_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "app-blocked-action", 34);
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275property("primaryMessage", ctx_r0.errorMessage)("secondaryMessage", "");
  }
}
var LoginComponent = class _LoginComponent {
  constructor(fb, auth, router, cdr) {
    this.fb = fb;
    this.auth = auth;
    this.router = router;
    this.cdr = cdr;
    this.state = "idle";
    this.errorMessage = "";
    this.callbackErrorPrimary = "";
    this.callbackErrorSecondary = "";
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]]
    });
  }
  ngOnInit() {
    const navState = history.state;
    if (navState?.callbackError) {
      const code = navState.callbackError;
      if (code === "otp_expired") {
        this.callbackErrorPrimary = "Your sign-in link has expired.";
        this.callbackErrorSecondary = "Links are valid for 1 hour. Request a new one below.";
      } else if (code === "otp_disabled") {
        this.callbackErrorPrimary = "Sign-in links are not enabled for this account.";
        this.callbackErrorSecondary = "Contact your System Admin.";
      } else {
        this.callbackErrorPrimary = "Your sign-in link is invalid.";
        this.callbackErrorSecondary = "This can happen if the link was already used. Request a new one below.";
      }
    }
  }
  get emailInvalid() {
    const ctrl = this.loginForm.get("email");
    return !!(ctrl?.invalid && ctrl?.touched);
  }
  onSubmit() {
    return __async(this, null, function* () {
      this.loginForm.markAllAsTouched();
      if (this.loginForm.invalid)
        return;
      this.state = "signing-in";
      this.cdr.markForCheck();
      const { error } = this.auth.devSignIn(this.loginForm.value.email);
      if (error) {
        this.state = "error";
        this.errorMessage = error;
        this.cdr.markForCheck();
        return;
      }
      yield this.router.navigate(["/home"], { replaceUrl: true });
    });
  }
  static {
    this.\u0275fac = function LoginComponent_Factory(t) {
      return new (t || _LoginComponent)(i0.\u0275\u0275directiveInject(i1.FormBuilder), i0.\u0275\u0275directiveInject(AuthService), i0.\u0275\u0275directiveInject(i3.Router), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _LoginComponent, selectors: [["app-login"]], decls: 69, vars: 8, consts: [[1, "login-wrapper"], [1, "login-left"], [1, "logo-block"], ["src", "assets/images/TRIARQ_Logo_rgb.svg", "alt", "TRIARQ Health", 2, "width", "180px", "height", "auto", "display", "block"], [1, "logo-sub"], [1, "product-block"], [1, "product-name"], [1, "product-description"], ["class", "oi-callback-notice", 4, "ngIf"], ["novalidate", "", 3, "ngSubmit", "formGroup"], [1, "oi-field"], ["for", "email", 1, "field-label"], ["id", "email", "type", "email", "formControlName", "email", "autocomplete", "email", "placeholder", "you@triarqhealth.com", 1, "email-input"], ["class", "oi-field-error", 4, "ngIf"], [3, "primaryMessage", "secondaryMessage", 4, "ngIf"], ["type", "submit", 1, "signin-button", 3, "disabled"], [1, "tagline-footer"], [1, "tagline-text"], [1, "login-right"], [1, "rp-headline"], [1, "feature-list"], [1, "feature-item"], [1, "feature-icon"], ["width", "13", "height", "13", "viewBox", "0 0 13 13", "fill", "none"], ["points", "2,7 5,10 11,3", "stroke", "#E96127", "stroke-width", "1.8", "stroke-linecap", "round", "stroke-linejoin", "round"], [1, "feature-label"], [1, "feature-description"], [1, "coming-soon"], [1, "coming-soon-label"], [1, "coming-soon-items"], [1, "oi-callback-notice"], [1, "oi-notice-primary"], [1, "oi-notice-secondary"], [1, "oi-field-error"], [3, "primaryMessage", "secondaryMessage"]], template: function LoginComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2);
        i0.\u0275\u0275element(3, "img", 3);
        i0.\u0275\u0275elementStart(4, "p", 4);
        i0.\u0275\u0275text(5, "Pathways Operating System");
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275elementStart(6, "div", 5)(7, "h1", 6);
        i0.\u0275\u0275text(8, "Pathways OI Trust");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(9, "p", 7);
        i0.\u0275\u0275text(10, " TRIARQ's platform for delivery workflows, organizational intelligence, and governance. ");
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275template(11, LoginComponent_div_11_Template, 5, 2, "div", 8);
        i0.\u0275\u0275elementStart(12, "form", 9);
        i0.\u0275\u0275listener("ngSubmit", function LoginComponent_Template_form_ngSubmit_12_listener() {
          return ctx.onSubmit();
        });
        i0.\u0275\u0275elementStart(13, "div", 10)(14, "label", 11);
        i0.\u0275\u0275text(15, "Work Email");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275element(16, "input", 12);
        i0.\u0275\u0275template(17, LoginComponent_p_17_Template, 2, 0, "p", 13);
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275template(18, LoginComponent_app_blocked_action_18_Template, 1, 2, "app-blocked-action", 14);
        i0.\u0275\u0275elementStart(19, "button", 15);
        i0.\u0275\u0275text(20);
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275elementStart(21, "div", 16)(22, "p", 17);
        i0.\u0275\u0275text(23, "Empower \xB7 Optimize \xB7 Partner");
        i0.\u0275\u0275elementEnd()()();
        i0.\u0275\u0275elementStart(24, "div", 18)(25, "h2", 19);
        i0.\u0275\u0275text(26, "Delivery Cycle management");
        i0.\u0275\u0275element(27, "br");
        i0.\u0275\u0275text(28, "is in UAT.");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(29, "div", 20)(30, "div", 21)(31, "div", 22);
        i0.\u0275\u0275namespaceSVG();
        i0.\u0275\u0275elementStart(32, "svg", 23);
        i0.\u0275\u0275element(33, "polyline", 24);
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275namespaceHTML();
        i0.\u0275\u0275elementStart(34, "div")(35, "p", 25);
        i0.\u0275\u0275text(36, 'Developed 100% "AI-First" using Claude Code');
        i0.\u0275\u0275elementEnd()()();
        i0.\u0275\u0275elementStart(37, "div", 21)(38, "div", 22);
        i0.\u0275\u0275namespaceSVG();
        i0.\u0275\u0275elementStart(39, "svg", 23);
        i0.\u0275\u0275element(40, "polyline", 24);
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275namespaceHTML();
        i0.\u0275\u0275elementStart(41, "div")(42, "p", 25);
        i0.\u0275\u0275text(43, "Delivery Cycle Tracking");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(44, "p", 26);
        i0.\u0275\u0275text(45, "Create and track delivery cycles from Context Brief through production release \u2014 with named gates, milestone dates, and role-based visibility for DSs and CBs.");
        i0.\u0275\u0275elementEnd()()();
        i0.\u0275\u0275elementStart(46, "div", 21)(47, "div", 22);
        i0.\u0275\u0275namespaceSVG();
        i0.\u0275\u0275elementStart(48, "svg", 23);
        i0.\u0275\u0275element(49, "polyline", 24);
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275namespaceHTML();
        i0.\u0275\u0275elementStart(50, "div")(51, "p", 25);
        i0.\u0275\u0275text(52, "100% MCP architecture");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(53, "p", 26);
        i0.\u0275\u0275text(54, "Every data operation runs through a governed MCP layer \u2014 fully portable to the production AI.TRIARQPathways environment at launch.");
        i0.\u0275\u0275elementEnd()()();
        i0.\u0275\u0275elementStart(55, "div", 21)(56, "div", 22);
        i0.\u0275\u0275namespaceSVG();
        i0.\u0275\u0275elementStart(57, "svg", 23);
        i0.\u0275\u0275element(58, "polyline", 24);
        i0.\u0275\u0275elementEnd()();
        i0.\u0275\u0275namespaceHTML();
        i0.\u0275\u0275elementStart(59, "div")(60, "p", 25);
        i0.\u0275\u0275text(61, "Angular 19 platform foundation");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(62, "p", 26);
        i0.\u0275\u0275text(63, "Built on the same design tokens and component architecture that will power the full Pathways OS \u2014 not a prototype, a production foundation.");
        i0.\u0275\u0275elementEnd()()()();
        i0.\u0275\u0275elementStart(64, "div", 27)(65, "p", 28);
        i0.\u0275\u0275text(66, "Coming soon");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275elementStart(67, "p", 29);
        i0.\u0275\u0275text(68, " OI Library \xB7 Embedded AI chat \xB7 Analytics capability \xB7 Engineering governance ");
        i0.\u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        i0.\u0275\u0275advance(11);
        i0.\u0275\u0275property("ngIf", ctx.callbackErrorPrimary);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("formGroup", ctx.loginForm);
        i0.\u0275\u0275advance(4);
        i0.\u0275\u0275classProp("oi-input-error", ctx.emailInvalid);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.emailInvalid);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.state === "error");
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("disabled", ctx.state === "signing-in");
        i0.\u0275\u0275advance();
        i0.\u0275\u0275textInterpolate1(" ", ctx.state === "signing-in" ? "Signing in\u2026" : "Sign in", " ");
      }
    }, dependencies: [i4.NgIf, i1.\u0275NgNoValidate, i1.DefaultValueAccessor, i1.NgControlStatus, i1.NgControlStatusGroup, i1.FormGroupDirective, i1.FormControlName, BlockedActionComponent], styles: ["\n\n.login-wrapper[_ngcontent-%COMP%] {\n  display: flex;\n  min-height: 100vh;\n  width: 100%;\n  font-family: Arial, sans-serif;\n}\n.login-left[_ngcontent-%COMP%] {\n  flex: 1;\n  background: #ffffff;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  padding: 3rem 3.5rem;\n}\n.login-right[_ngcontent-%COMP%] {\n  flex: 1;\n  background: #12274A;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  padding: 3rem 3rem;\n}\n.logo-block[_ngcontent-%COMP%] {\n  margin-bottom: 2.5rem;\n}\n.logo-sub[_ngcontent-%COMP%] {\n  font-size: 10px;\n  color: #5A5A5A;\n  letter-spacing: 0.6px;\n  text-transform: uppercase;\n  margin-top: 6px;\n  margin-bottom: 0;\n}\n.product-block[_ngcontent-%COMP%] {\n  margin-bottom: 2rem;\n}\n.product-name[_ngcontent-%COMP%] {\n  font-size: 26px;\n  font-weight: 700;\n  color: #12274A;\n  line-height: 1.2;\n  margin: 0 0 10px 0;\n}\n.product-description[_ngcontent-%COMP%] {\n  font-size: 14px;\n  color: #5A5A5A;\n  line-height: 1.6;\n  max-width: 320px;\n  margin: 0;\n}\n.oi-field[_ngcontent-%COMP%] {\n  margin-bottom: 0;\n}\n.field-label[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 12px;\n  font-weight: 600;\n  color: #12274A;\n  letter-spacing: 0.3px;\n  text-transform: uppercase;\n  margin-bottom: 6px;\n}\n.email-input[_ngcontent-%COMP%] {\n  width: 100%;\n  box-sizing: border-box;\n  padding: 12px 14px;\n  border: 1.5px solid #d0d4da;\n  border-radius: 8px;\n  font-size: 14px;\n  color: #12274A;\n  background: #fafafa;\n  outline: none;\n  margin-bottom: 1.5rem;\n}\n.email-input[_ngcontent-%COMP%]:focus {\n  border-color: #0071AF;\n}\n.oi-input-error[_ngcontent-%COMP%] {\n  border-color: var(--triarq-color-error) !important;\n}\n.oi-field-error[_ngcontent-%COMP%] {\n  color: var(--triarq-color-error);\n  font-size: 12px;\n  margin: -1rem 0 1rem 0;\n}\n.signin-button[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 13px;\n  background: #E96127;\n  color: #ffffff;\n  border: none;\n  border-radius: 8px;\n  font-size: 14px;\n  font-weight: 600;\n  letter-spacing: 0.3px;\n  cursor: pointer;\n}\n.signin-button[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: #c94f1e;\n}\n.signin-button[_ngcontent-%COMP%]:disabled {\n  opacity: 0.6;\n  cursor: not-allowed;\n}\n.tagline-footer[_ngcontent-%COMP%] {\n  margin-top: 3rem;\n  padding-top: 1.5rem;\n  border-top: 0.5px solid #e8eaed;\n}\n.tagline-text[_ngcontent-%COMP%] {\n  font-size: 11px;\n  color: #A6A6A6;\n  letter-spacing: 0.3px;\n  margin: 0;\n}\n.oi-callback-notice[_ngcontent-%COMP%] {\n  background: #fff8e1;\n  border: 1px solid #ffe082;\n  border-radius: 10px;\n  padding: 10px 14px;\n  margin-bottom: 1rem;\n}\n.oi-notice-primary[_ngcontent-%COMP%] {\n  font-size: 13px;\n  font-weight: 600;\n  margin: 0 0 4px 0;\n  color: #12274A;\n}\n.oi-notice-secondary[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: #5A5A5A;\n  margin: 0;\n}\n.rp-headline[_ngcontent-%COMP%] {\n  font-size: 22px;\n  font-weight: 700;\n  color: #ffffff;\n  line-height: 1.3;\n  margin: 0 0 1.75rem 0;\n}\n.feature-list[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n  margin-bottom: 2rem;\n}\n.feature-item[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 14px;\n  align-items: flex-start;\n}\n.feature-icon[_ngcontent-%COMP%] {\n  width: 28px;\n  height: 28px;\n  border-radius: 50%;\n  background: rgba(233, 97, 39, 0.2);\n  border: 1px solid #E96127;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex-shrink: 0;\n  margin-top: 1px;\n}\n.feature-label[_ngcontent-%COMP%] {\n  font-size: 13px;\n  font-weight: 600;\n  color: #ffffff;\n  margin: 0 0 2px 0;\n}\n.feature-description[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: #A6A6A6;\n  line-height: 1.5;\n  margin: 0;\n}\n.coming-soon[_ngcontent-%COMP%] {\n  border-top: 0.5px solid rgba(255, 255, 255, 0.12);\n  padding-top: 1.25rem;\n}\n.coming-soon-label[_ngcontent-%COMP%] {\n  font-size: 11px;\n  color: #F2A620;\n  font-weight: 600;\n  letter-spacing: 1px;\n  text-transform: uppercase;\n  margin: 0 0 6px 0;\n}\n.coming-soon-items[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: #A6A6A6;\n  line-height: 1.6;\n  margin: 0;\n}\n/*# sourceMappingURL=login.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(LoginComponent, { className: "LoginComponent", filePath: "src\\app\\features\\login\\login.component.ts", lineNumber: 356 });
})();

// src/app/features/login/auth-callback.component.ts
import { Component as Component2, ChangeDetectionStrategy as ChangeDetectionStrategy2 } from "@angular/core";
import * as i02 from "@angular/core";
import * as i2 from "@angular/router";
var AuthCallbackComponent = class _AuthCallbackComponent {
  constructor(auth, router) {
    this.auth = auth;
    this.router = router;
  }
  ngOnInit() {
    return __async(this, null, function* () {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const error = params.get("error");
      const errorCode = params.get("error_code");
      const errorDesc = params.get("error_description");
      if (error) {
        console.error("[OI Trust] Auth callback error:", error, errorCode, errorDesc);
        this.router.navigate(["/login"], {
          replaceUrl: true,
          state: { callbackError: errorCode ?? error }
        });
        return;
      }
      yield this.auth.waitForInit();
      console.log("[OI Trust] Auth callback \u2014 authenticated:", this.auth.isAuthenticated());
      if (this.auth.isAuthenticated()) {
        this.router.navigate(["/home"], { replaceUrl: true });
      } else {
        this.router.navigate(["/login"], { replaceUrl: true });
      }
    });
  }
  static {
    this.\u0275fac = function AuthCallbackComponent_Factory(t) {
      return new (t || _AuthCallbackComponent)(i02.\u0275\u0275directiveInject(AuthService), i02.\u0275\u0275directiveInject(i2.Router));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i02.\u0275\u0275defineComponent({ type: _AuthCallbackComponent, selectors: [["app-auth-callback"]], decls: 3, vars: 0, consts: [[1, "oi-callback-shell"], [1, "oi-callback-message"]], template: function AuthCallbackComponent_Template(rf, ctx) {
      if (rf & 1) {
        i02.\u0275\u0275elementStart(0, "div", 0)(1, "p", 1);
        i02.\u0275\u0275text(2, "Signing you in\u2026");
        i02.\u0275\u0275elementEnd()();
      }
    }, styles: ["\n\n.oi-callback-shell[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: var(--triarq-color-background);\n}\n.oi-callback-message[_ngcontent-%COMP%] {\n  color: var(--triarq-color-text-secondary);\n  font-family: var(--triarq-font-family);\n  font-size: var(--triarq-text-body);\n}\n/*# sourceMappingURL=auth-callback.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i02.\u0275setClassDebugInfo(AuthCallbackComponent, { className: "AuthCallbackComponent", filePath: "src\\app\\features\\login\\auth-callback.component.ts", lineNumber: 43 });
})();

// src/app/core/guards/auth.guard.ts
import { inject } from "@angular/core";
import { Router as Router3 } from "@angular/router";
var authGuard = () => __async(void 0, null, function* () {
  const auth = inject(AuthService);
  const router = inject(Router3);
  yield auth.waitForInit();
  if (auth.isAuthenticated())
    return true;
  router.navigate(["/login"]);
  return false;
});

// src/app/app-routing.module.ts
import * as i03 from "@angular/core";
var routes = [
  { path: "login", component: LoginComponent },
  // No authGuard — Supabase redirects here with tokens in the URL hash.
  // AuthCallbackComponent waits for session then navigates to /home or /login.
  { path: "auth/callback", component: AuthCallbackComponent },
  {
    path: "home",
    canActivate: [authGuard],
    loadChildren: () => import("./home.module-KDCYTHHN.js").then((m) => m.HomeModule)
  },
  {
    path: "library",
    canActivate: [authGuard],
    loadChildren: () => import("./oi-library.module-7CYOECCJ.js").then((m) => m.OILibraryModule)
  },
  {
    path: "admin",
    canActivate: [authGuard],
    loadChildren: () => import("./admin.module-U7TJH2JI.js").then((m) => m.AdminModule)
  },
  {
    path: "chat",
    canActivate: [authGuard],
    loadChildren: () => import("./chat.module-R4DMZBII.js").then((m) => m.ChatModule)
  },
  {
    path: "delivery",
    canActivate: [authGuard],
    loadChildren: () => import("./delivery.module-CH3CQDTO.js").then((m) => m.DeliveryModule)
  },
  {
    path: "contact-admin",
    canActivate: [authGuard],
    loadComponent: () => import("./contact-admin.component-TRGXUMSW.js").then((m) => m.ContactAdminComponent)
  },
  { path: "", redirectTo: "home", pathMatch: "full" },
  { path: "**", redirectTo: "home" }
];
var AppRoutingModule = class _AppRoutingModule {
  static {
    this.\u0275fac = function AppRoutingModule_Factory(t) {
      return new (t || _AppRoutingModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ i03.\u0275\u0275defineNgModule({ type: _AppRoutingModule });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ i03.\u0275\u0275defineInjector({ imports: [RouterModule.forRoot(routes), RouterModule] });
  }
};

// src/app/app.component.ts
import { Component as Component4, ChangeDetectionStrategy as ChangeDetectionStrategy4 } from "@angular/core";
import { NavigationEnd } from "@angular/router";
import { filter, map } from "rxjs/operators";
import * as i05 from "@angular/core";
import * as i12 from "@angular/router";
import * as i43 from "@angular/common";

// src/app/shared/components/sidebar/sidebar.component.ts
import { Component as Component3, ChangeDetectionStrategy as ChangeDetectionStrategy3 } from "@angular/core";
import { Subscription } from "rxjs";
import * as i04 from "@angular/core";
import * as i32 from "@angular/router";
import * as i42 from "@angular/common";
function SidebarComponent_li_5_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "li")(1, "a", 8)(2, "span", 9);
    i04.\u0275\u0275text(3);
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(4, "span", 10);
    i04.\u0275\u0275text(5);
    i04.\u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const item_r1 = ctx.$implicit;
    const ctx_r1 = i04.\u0275\u0275nextContext();
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("routerLink", item_r1.route);
    i04.\u0275\u0275attribute("aria-label", item_r1.label);
    i04.\u0275\u0275advance(2);
    i04.\u0275\u0275textInterpolate(item_r1.label);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275property("ngClass", "status-" + item_r1.devStatus);
    i04.\u0275\u0275advance();
    i04.\u0275\u0275textInterpolate1(" ", ctx_r1.statusLabel(item_r1.devStatus), " ");
  }
}
var NAV_ITEMS = [
  { label: "Home", route: "/home", roles: "all", devStatus: "uat" },
  { label: "OI Library", route: "/library", roles: "all", devStatus: "not-started" },
  { label: "Delivery Cycle Tracking", route: "/delivery", roles: "all", devStatus: "uat" },
  { label: "Chat", route: "/chat", roles: "all", devStatus: "not-started" },
  { label: "Contact an Admin", route: "/contact-admin", roles: "all", devStatus: "uat" },
  { label: "Admin", route: "/admin", roles: ["phil", "admin"], devStatus: "uat" }
];
var SidebarComponent = class _SidebarComponent {
  constructor(profileService, auth, router, cdr) {
    this.profileService = profileService;
    this.auth = auth;
    this.router = router;
    this.cdr = cdr;
    this.visibleItems = [];
    this.displayName = "";
    this.sub = new Subscription();
  }
  ngOnInit() {
    this.sub.add(this.profileService.profile$.subscribe((profile) => {
      this.displayName = profile?.display_name ?? "";
      const role = profile?.system_role ?? null;
      this.visibleItems = NAV_ITEMS.filter((item) => item.roles === "all" || role && item.roles.includes(role));
      this.cdr.markForCheck();
    }));
  }
  ngOnDestroy() {
    this.sub.unsubscribe();
  }
  statusLabel(status) {
    switch (status) {
      case "new":
        return "** New";
      case "uat":
        return "** UAT";
      case "pilot":
        return "** Pilot";
      case "not-started":
        return "** Not Started";
    }
  }
  signOut() {
    return __async(this, null, function* () {
      this.profileService.clearProfile();
      yield this.auth.signOut();
      this.router.navigate(["/login"]);
    });
  }
  static {
    this.\u0275fac = function SidebarComponent_Factory(t) {
      return new (t || _SidebarComponent)(i04.\u0275\u0275directiveInject(UserProfileService), i04.\u0275\u0275directiveInject(AuthService), i04.\u0275\u0275directiveInject(i32.Router), i04.\u0275\u0275directiveInject(i04.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i04.\u0275\u0275defineComponent({ type: _SidebarComponent, selectors: [["app-sidebar"]], decls: 11, vars: 2, consts: [["aria-label", "Main navigation", 1, "oi-sidebar"], [1, "oi-sidebar-brand"], [1, "oi-brand-name"], [1, "oi-nav-list"], [4, "ngFor", "ngForOf"], [1, "oi-sidebar-footer"], [1, "oi-sidebar-user"], [1, "oi-signout-btn", 3, "click"], ["routerLinkActive", "active", 1, "oi-nav-item", 3, "routerLink"], [1, "oi-nav-label"], [1, "oi-dev-status", 3, "ngClass"]], template: function SidebarComponent_Template(rf, ctx) {
      if (rf & 1) {
        i04.\u0275\u0275elementStart(0, "nav", 0)(1, "div", 1)(2, "span", 2);
        i04.\u0275\u0275text(3, "Pathways OI Trust");
        i04.\u0275\u0275elementEnd()();
        i04.\u0275\u0275elementStart(4, "ul", 3);
        i04.\u0275\u0275template(5, SidebarComponent_li_5_Template, 6, 5, "li", 4);
        i04.\u0275\u0275elementEnd();
        i04.\u0275\u0275elementStart(6, "div", 5)(7, "span", 6);
        i04.\u0275\u0275text(8);
        i04.\u0275\u0275elementEnd();
        i04.\u0275\u0275elementStart(9, "button", 7);
        i04.\u0275\u0275listener("click", function SidebarComponent_Template_button_click_9_listener() {
          return ctx.signOut();
        });
        i04.\u0275\u0275text(10, "Sign out");
        i04.\u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        i04.\u0275\u0275advance(5);
        i04.\u0275\u0275property("ngForOf", ctx.visibleItems);
        i04.\u0275\u0275advance(3);
        i04.\u0275\u0275textInterpolate(ctx.displayName);
      }
    }, dependencies: [i42.NgClass, i42.NgForOf, RouterLinkWithHrefDelegateDirective, i32.RouterLink, i32.RouterLinkActive], styles: ["\n\n.oi-sidebar[_ngcontent-%COMP%] {\n  height: 100vh;\n  display: flex;\n  flex-direction: column;\n}\n.oi-sidebar-brand[_ngcontent-%COMP%] {\n  padding: var(--triarq-space-lg) var(--triarq-space-md);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n}\n.oi-brand-name[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-small);\n  font-weight: var(--triarq-font-weight-bold);\n  color: #fff;\n  letter-spacing: 0.5px;\n}\n.oi-nav-list[_ngcontent-%COMP%] {\n  list-style: none;\n  padding: var(--triarq-space-sm) 0;\n  margin: 0;\n  flex: 1;\n}\n.oi-nav-item[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  justify-content: space-between;\n  gap: 6px;\n}\n.oi-nav-label[_ngcontent-%COMP%] {\n  flex: 1;\n}\n.oi-dev-status[_ngcontent-%COMP%] {\n  display: inline;\n  font-size: 10px;\n  letter-spacing: 0.3px;\n  white-space: nowrap;\n  flex-shrink: 0;\n  opacity: 0.85;\n}\n.status-new[_ngcontent-%COMP%] {\n  color: #6fcf97;\n}\n.status-uat[_ngcontent-%COMP%] {\n  color: var(--triarq-color-sunray, #f5a623);\n}\n.status-pilot[_ngcontent-%COMP%] {\n  color: #56ccf2;\n}\n.status-not-started[_ngcontent-%COMP%] {\n  color: rgba(255, 255, 255, 0.35);\n}\n.oi-sidebar-footer[_ngcontent-%COMP%] {\n  padding: var(--triarq-space-md);\n  border-top: 1px solid rgba(255, 255, 255, 0.1);\n  display: flex;\n  flex-direction: column;\n  gap: var(--triarq-space-xs);\n}\n.oi-sidebar-user[_ngcontent-%COMP%] {\n  font-size: var(--triarq-text-caption);\n  color: var(--triarq-color-sidebar-text);\n}\n.oi-signout-btn[_ngcontent-%COMP%] {\n  background: none;\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  color: var(--triarq-color-sidebar-text);\n  border-radius: var(--triarq-radius-button);\n  padding: var(--triarq-space-xs) var(--triarq-space-sm);\n  cursor: pointer;\n  font-size: var(--triarq-text-caption);\n}\n.oi-signout-btn[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.08);\n}\n/*# sourceMappingURL=sidebar.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i04.\u0275setClassDebugInfo(SidebarComponent, { className: "SidebarComponent", filePath: "src\\app\\shared\\components\\sidebar\\sidebar.component.ts", lineNumber: 93 });
})();

// src/app/app.component.ts
function AppComponent_app_sidebar_1_Template(rf, ctx) {
  if (rf & 1) {
    i05.\u0275\u0275element(0, "app-sidebar");
  }
}
var AppComponent = class _AppComponent {
  constructor(router, auth, profileService) {
    this.router = router;
    this.auth = auth;
    this.profileService = profileService;
  }
  ngOnInit() {
    this.showSidebar$ = this.router.events.pipe(filter((e) => e instanceof NavigationEnd), map((e) => this.auth.isAuthenticated() && !e.urlAfterRedirects.startsWith("/login")));
    if (this.auth.isAuthenticated()) {
      this.profileService.loadProfile();
    }
  }
  static {
    this.\u0275fac = function AppComponent_Factory(t) {
      return new (t || _AppComponent)(i05.\u0275\u0275directiveInject(i12.Router), i05.\u0275\u0275directiveInject(AuthService), i05.\u0275\u0275directiveInject(UserProfileService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i05.\u0275\u0275defineComponent({ type: _AppComponent, selectors: [["app-root"]], decls: 5, vars: 3, consts: [[1, "oi-app-shell"], [4, "ngIf"], [1, "oi-main-content"]], template: function AppComponent_Template(rf, ctx) {
      if (rf & 1) {
        i05.\u0275\u0275elementStart(0, "div", 0);
        i05.\u0275\u0275template(1, AppComponent_app_sidebar_1_Template, 1, 0, "app-sidebar", 1);
        i05.\u0275\u0275pipe(2, "async");
        i05.\u0275\u0275elementStart(3, "main", 2);
        i05.\u0275\u0275element(4, "router-outlet");
        i05.\u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        i05.\u0275\u0275advance();
        i05.\u0275\u0275property("ngIf", i05.\u0275\u0275pipeBind1(2, 1, ctx.showSidebar$));
      }
    }, dependencies: [i43.NgIf, i12.RouterOutlet, SidebarComponent, i43.AsyncPipe], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i05.\u0275setClassDebugInfo(AppComponent, { className: "AppComponent", filePath: "src\\app\\app.component.ts", lineNumber: 26 });
})();

// src/app/app.module.ts
import * as i06 from "@angular/core";
var AppModule = class _AppModule {
  static {
    this.\u0275fac = function AppModule_Factory(t) {
      return new (t || _AppModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ i06.\u0275\u0275defineNgModule({ type: _AppModule, bootstrap: [AppComponent] });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ i06.\u0275\u0275defineInjector({ imports: [
      BrowserModule,
      HttpClientModule,
      ReactiveFormsModule,
      IonicModule.forRoot(),
      AppRoutingModule,
      BlockedActionComponent
      // standalone — imported, not declared
    ] });
  }
};

// src/bootstrap.ts
__NgCli_bootstrap_1.platformBrowser().bootstrapModule(AppModule).catch((err) => console.error("[OI Trust] Module bootstrap error:", err));
//# sourceMappingURL=bootstrap-NVR3DFLG.js.map
