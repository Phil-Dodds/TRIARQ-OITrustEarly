import {
  findClosestIonContent,
  scrollToTop
} from "./chunk-XQVZGRLQ.js";
import "./chunk-CIYO67CO.js";
import {
  readTask,
  writeTask
} from "./chunk-SII3QBXZ.js";
import {
  componentOnReady
} from "./chunk-FKQOC7QR.js";
import {
  __async
} from "./chunk-DSWO3WHD.js";

// node_modules/@ionic/core/dist/esm/status-tap-dfea3607.js
var startStatusTap = () => {
  const win = window;
  win.addEventListener("statusTap", () => {
    readTask(() => {
      const width = win.innerWidth;
      const height = win.innerHeight;
      const el = document.elementFromPoint(width / 2, height / 2);
      if (!el) {
        return;
      }
      const contentEl = findClosestIonContent(el);
      if (contentEl) {
        new Promise((resolve) => componentOnReady(contentEl, resolve)).then(() => {
          writeTask(() => __async(void 0, null, function* () {
            contentEl.style.setProperty("--overflow", "hidden");
            yield scrollToTop(contentEl, 300);
            contentEl.style.removeProperty("--overflow");
          }));
        });
      }
    });
  });
};
export {
  startStatusTap
};
/*! Bundled license information:

@ionic/core/dist/esm/status-tap-dfea3607.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=status-tap-dfea3607-RFFVX2D2.js.map
