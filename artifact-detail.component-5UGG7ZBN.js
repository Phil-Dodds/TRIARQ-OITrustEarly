import {
  BlockedActionComponent
} from "./chunk-QFRGV5EL.js";
import {
  McpService
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
import "./chunk-DSWO3WHD.js";

// src/app/features/oi-library/artifact-detail.component.ts
import { Component, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import * as i0 from "@angular/core";
import * as i1 from "@angular/router";
import * as i3 from "@angular/common";
function ArtifactDetailComponent_app_blocked_action_3_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275element(0, "app-blocked-action", 5);
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275property("primaryMessage", ctx_r0.blockedMessage)("secondaryMessage", ctx_r0.blockedHint);
  }
}
function ArtifactDetailComponent_div_4_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 6);
    i0.\u0275\u0275text(1, "Loading artifact\u2026");
    i0.\u0275\u0275elementEnd();
  }
}
function ArtifactDetailComponent_div_5_span_8_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 20);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r0.artifact.artifact_types.type_name);
  }
}
function ArtifactDetailComponent_div_5_span_9_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 20);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r0.artifact.divisions.division_name);
  }
}
function ArtifactDetailComponent_div_5_a_10_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "a", 21);
    i0.\u0275\u0275text(1, "\u2193 Download");
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275property("href", ctx_r0.downloadUrl, i0.\u0275\u0275sanitizeUrl);
  }
}
function ArtifactDetailComponent_div_5_div_18_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div")(1, "div", 15);
    i0.\u0275\u0275text(2, " Type Description ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(3, "div", 22);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_2_0;
    const ctx_r0 = i0.\u0275\u0275nextContext(2);
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275textInterpolate1(" ", (tmp_2_0 = ctx_r0.artifact.artifact_types.type_description) !== null && tmp_2_0 !== void 0 ? tmp_2_0 : "\u2014", " ");
  }
}
function ArtifactDetailComponent_div_5_div_22_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 15);
    i0.\u0275\u0275text(1, "Loading versions\u2026");
    i0.\u0275\u0275elementEnd();
  }
}
function ArtifactDetailComponent_div_5_div_23_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 15);
    i0.\u0275\u0275text(1, "No version history available.");
    i0.\u0275\u0275elementEnd();
  }
}
function ArtifactDetailComponent_div_5_div_24_span_7_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "span", 29);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const v_r2 = i0.\u0275\u0275nextContext().$implicit;
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate1(" ", v_r2.change_note, " ");
  }
}
function ArtifactDetailComponent_div_5_div_24_div_8_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 26);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const v_r2 = i0.\u0275\u0275nextContext().$implicit;
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate2(" ", v_r2.document_files.original_filename, " \xB7 ", (v_r2.document_files.file_size_bytes / 1024 / 1024).toFixed(1), "MB ");
  }
}
function ArtifactDetailComponent_div_5_div_24_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 23)(1, "div", 24)(2, "span", 25);
    i0.\u0275\u0275text(3);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(4, "span", 26);
    i0.\u0275\u0275text(5);
    i0.\u0275\u0275pipe(6, "date");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(7, ArtifactDetailComponent_div_5_div_24_span_7_Template, 2, 1, "span", 27);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(8, ArtifactDetailComponent_div_5_div_24_div_8_Template, 2, 2, "div", 28);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const v_r2 = ctx.$implicit;
    i0.\u0275\u0275advance(3);
    i0.\u0275\u0275textInterpolate1("v", v_r2.version_number, "");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275textInterpolate1(" ", i0.\u0275\u0275pipeBind2(6, 4, v_r2.created_at, "mediumDate"), " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngIf", v_r2.change_note);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", v_r2.document_files);
  }
}
function ArtifactDetailComponent_div_5_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div")(1, "div", 7)(2, "div", 8)(3, "h3", 9);
    i0.\u0275\u0275text(4);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(5, "div", 10)(6, "span", 11);
    i0.\u0275\u0275text(7);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(8, ArtifactDetailComponent_div_5_span_8_Template, 2, 1, "span", 12)(9, ArtifactDetailComponent_div_5_span_9_Template, 2, 1, "span", 12);
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275template(10, ArtifactDetailComponent_div_5_a_10_Template, 2, 1, "a", 13);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(11, "div", 14)(12, "div")(13, "div", 15);
    i0.\u0275\u0275text(14, " Submitted ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(15, "div", 16);
    i0.\u0275\u0275text(16);
    i0.\u0275\u0275pipe(17, "date");
    i0.\u0275\u0275elementEnd()();
    i0.\u0275\u0275template(18, ArtifactDetailComponent_div_5_div_18_Template, 5, 1, "div", 4);
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275elementStart(19, "div")(20, "h4", 17);
    i0.\u0275\u0275text(21, " Version History ");
    i0.\u0275\u0275elementEnd();
    i0.\u0275\u0275template(22, ArtifactDetailComponent_div_5_div_22_Template, 2, 0, "div", 18)(23, ArtifactDetailComponent_div_5_div_23_Template, 2, 0, "div", 18)(24, ArtifactDetailComponent_div_5_div_24_Template, 9, 7, "div", 19);
    i0.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275textInterpolate1(" ", ctx_r0.artifact.artifact_title, " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275styleProp("background", ctx_r0.statusBg(ctx_r0.artifact.lifecycle_status))("color", ctx_r0.statusColor(ctx_r0.artifact.lifecycle_status));
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r0.artifact.lifecycle_status);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.artifact.artifact_types);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.artifact.divisions);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", ctx_r0.downloadUrl);
    i0.\u0275\u0275advance(6);
    i0.\u0275\u0275textInterpolate1(" ", i0.\u0275\u0275pipeBind2(17, 14, ctx_r0.artifact.submitted_at, "mediumDate"), " ");
    i0.\u0275\u0275advance(2);
    i0.\u0275\u0275property("ngIf", ctx_r0.artifact.artifact_types);
    i0.\u0275\u0275advance(4);
    i0.\u0275\u0275property("ngIf", ctx_r0.versionsLoading);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngIf", !ctx_r0.versionsLoading && ctx_r0.versions.length === 0);
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngForOf", ctx_r0.versions);
  }
}
var ArtifactDetailComponent = class _ArtifactDetailComponent {
  constructor(route, mcp, cdr) {
    this.route = route;
    this.mcp = mcp;
    this.cdr = cdr;
    this.artifact = null;
    this.downloadUrl = null;
    this.versions = [];
    this.loading = false;
    this.versionsLoading = false;
    this.blockedMessage = "";
    this.blockedHint = "";
    this.artifactId = "";
  }
  ngOnInit() {
    this.artifactId = this.route.snapshot.paramMap.get("id") ?? "";
    if (!this.artifactId) {
      this.setBlocked("No artifact ID provided.", "Navigate to this page from the OI Library list.");
      return;
    }
    this.loadArtifact();
    this.loadVersions();
  }
  // ── Data ───────────────────────────────────────────────────────────────────
  loadArtifact() {
    this.loading = true;
    this.blockedMessage = "";
    this.cdr.markForCheck();
    this.mcp.call("document", "get_document", { artifact_id: this.artifactId }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.artifact = res.data.artifact;
          this.downloadUrl = res.data.download_url;
        } else {
          this.setBlocked(res.error ?? "Could not load artifact.", "Ensure you have access to this artifact's Division.");
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.setBlocked(err.error ?? "Could not load artifact.", "Ensure you have Division access and your session is active.");
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  loadVersions() {
    this.versionsLoading = true;
    this.cdr.markForCheck();
    this.mcp.call("document", "get_document_versions", { artifact_id: this.artifactId }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.versions = res.data.versions;
        }
        this.versionsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.versionsLoading = false;
        this.cdr.markForCheck();
      }
    });
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
    this.\u0275fac = function ArtifactDetailComponent_Factory(t) {
      return new (t || _ArtifactDetailComponent)(i0.\u0275\u0275directiveInject(i1.ActivatedRoute), i0.\u0275\u0275directiveInject(McpService), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _ArtifactDetailComponent, selectors: [["app-artifact-detail"]], standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 6, vars: 3, consts: [[1, "oi-card", 2, "max-width", "800px", "margin", "var(--triarq-space-2xl) auto"], ["routerLink", "/library", 2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-primary)", "display", "inline-block", "margin-bottom", "var(--triarq-space-md)"], [3, "primaryMessage", "secondaryMessage", 4, "ngIf"], ["style", "text-align:center;padding:var(--triarq-space-xl);\n               color:var(--triarq-color-text-secondary);", 4, "ngIf"], [4, "ngIf"], [3, "primaryMessage", "secondaryMessage"], [2, "text-align", "center", "padding", "var(--triarq-space-xl)", "color", "var(--triarq-color-text-secondary)"], [2, "display", "flex", "align-items", "flex-start", "justify-content", "space-between", "margin-bottom", "var(--triarq-space-md)"], [2, "flex", "1", "min-width", "0"], [2, "margin", "0 0 6px 0", "color", "var(--triarq-color-text-primary)"], [2, "display", "flex", "gap", "var(--triarq-space-sm)", "flex-wrap", "wrap", "align-items", "center"], [1, "oi-pill"], ["class", "oi-pill", "style", "background:var(--triarq-color-background-subtle);\n                       color:var(--triarq-color-text-secondary);", 4, "ngIf"], ["target", "_blank", "rel", "noopener", "class", "oi-btn-primary", "style", "margin-left:var(--triarq-space-md);white-space:nowrap;\n                   font-size:var(--triarq-text-small);text-decoration:none;", 3, "href", 4, "ngIf"], [2, "background", "var(--triarq-color-background-subtle)", "border-radius", "8px", "padding", "var(--triarq-space-md)", "margin-bottom", "var(--triarq-space-md)", "display", "grid", "grid-template-columns", "1fr 1fr", "gap", "var(--triarq-space-sm)"], [2, "font-size", "var(--triarq-text-small)", "color", "var(--triarq-color-text-secondary)"], [2, "font-size", "var(--triarq-text-small)", "font-weight", "500"], [2, "margin", "0 0 var(--triarq-space-sm) 0", "font-size", "var(--triarq-text-body)"], ["style", "font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);", 4, "ngIf"], ["style", "display:flex;align-items:center;justify-content:space-between;\n                   padding:var(--triarq-space-xs) var(--triarq-space-sm);\n                   border-bottom:1px solid var(--triarq-color-border);\n                   font-size:var(--triarq-text-small);", 4, "ngFor", "ngForOf"], [1, "oi-pill", 2, "background", "var(--triarq-color-background-subtle)", "color", "var(--triarq-color-text-secondary)"], ["target", "_blank", "rel", "noopener", 1, "oi-btn-primary", 2, "margin-left", "var(--triarq-space-md)", "white-space", "nowrap", "font-size", "var(--triarq-text-small)", "text-decoration", "none", 3, "href"], [2, "font-size", "var(--triarq-text-small)"], [2, "display", "flex", "align-items", "center", "justify-content", "space-between", "padding", "var(--triarq-space-xs) var(--triarq-space-sm)", "border-bottom", "1px solid var(--triarq-color-border)", "font-size", "var(--triarq-text-small)"], [2, "display", "flex", "align-items", "center", "gap", "var(--triarq-space-sm)"], [1, "oi-pill", 2, "background", "var(--triarq-color-background-subtle)", "color", "var(--triarq-color-text-secondary)", "font-size", "11px", "min-width", "28px", "text-align", "center"], [2, "color", "var(--triarq-color-text-secondary)"], ["style", "color:var(--triarq-color-text-primary);", 4, "ngIf"], ["style", "color:var(--triarq-color-text-secondary);", 4, "ngIf"], [2, "color", "var(--triarq-color-text-primary)"]], template: function ArtifactDetailComponent_Template(rf, ctx) {
      if (rf & 1) {
        i0.\u0275\u0275elementStart(0, "div", 0)(1, "a", 1);
        i0.\u0275\u0275text(2, "\u2190 OI Library");
        i0.\u0275\u0275elementEnd();
        i0.\u0275\u0275template(3, ArtifactDetailComponent_app_blocked_action_3_Template, 1, 2, "app-blocked-action", 2)(4, ArtifactDetailComponent_div_4_Template, 2, 0, "div", 3)(5, ArtifactDetailComponent_div_5_Template, 25, 17, "div", 4);
        i0.\u0275\u0275elementEnd();
      }
      if (rf & 2) {
        i0.\u0275\u0275advance(3);
        i0.\u0275\u0275property("ngIf", ctx.blockedMessage);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", ctx.loading);
        i0.\u0275\u0275advance();
        i0.\u0275\u0275property("ngIf", !ctx.loading && ctx.artifact);
      }
    }, dependencies: [CommonModule, i3.NgForOf, i3.NgIf, i3.DatePipe, RouterModule, i1.RouterLink, IonicModule, RouterLinkWithHrefDelegateDirective, BlockedActionComponent], encapsulation: 2, changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(ArtifactDetailComponent, { className: "ArtifactDetailComponent", filePath: "src\\app\\features\\oi-library\\artifact-detail.component.ts", lineNumber: 167 });
})();
export {
  ArtifactDetailComponent
};
//# sourceMappingURL=artifact-detail.component-5UGG7ZBN.js.map
