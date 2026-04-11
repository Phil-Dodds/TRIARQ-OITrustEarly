import {
  createColorClasses
} from "./chunk-4TKDMDPC.js";
import {
  getIonMode
} from "./chunk-DHRBUV2X.js";
import {
  Host,
  h,
  registerInstance
} from "./chunk-SII3QBXZ.js";
import "./chunk-DSWO3WHD.js";

// node_modules/@ionic/core/dist/esm/ion-text.entry.js
var textCss = ":host(.ion-color){color:var(--ion-color-base)}";
var IonTextStyle0 = textCss;
var Text = class {
  constructor(hostRef) {
    registerInstance(this, hostRef);
    this.color = void 0;
  }
  render() {
    const mode = getIonMode(this);
    return h(Host, { key: "4330b56cbc4e15953d9b3162fb40af728a8195dd", class: createColorClasses(this.color, {
      [mode]: true
    }) }, h("slot", { key: "ec674a71d8fbb04d537fd79d617d9db4a607c340" }));
  }
};
Text.style = IonTextStyle0;
export {
  Text as ion_text
};
/*! Bundled license information:

@ionic/core/dist/esm/ion-text.entry.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=ion-text.entry-MFRSXIVB.js.map
