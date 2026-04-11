import {
  findItemLabel
} from "./chunk-FKQOC7QR.js";

// node_modules/@ionic/core/dist/esm/form-controller-21dd62b1.js
var createLegacyFormController = (el) => {
  const controlEl = el;
  let legacyControl;
  const hasLegacyControl = () => {
    if (legacyControl === void 0) {
      const hasLabelProp = controlEl.label !== void 0 || hasLabelSlot(controlEl);
      const hasAriaLabelAttribute = controlEl.hasAttribute("aria-label") || // Shadow DOM form controls cannot use aria-labelledby
      controlEl.hasAttribute("aria-labelledby") && controlEl.shadowRoot === null;
      const legacyItemLabel = findItemLabel(controlEl);
      legacyControl = controlEl.legacy === true || !hasLabelProp && !hasAriaLabelAttribute && legacyItemLabel !== null;
    }
    return legacyControl;
  };
  return { hasLegacyControl };
};
var hasLabelSlot = (controlEl) => {
  if (NAMED_LABEL_SLOT_COMPONENTS.includes(controlEl.tagName) && controlEl.querySelector('[slot="label"]') !== null) {
    return true;
  }
  if (UNNAMED_LABEL_SLOT_COMPONENTS.includes(controlEl.tagName) && controlEl.textContent !== "") {
    return true;
  }
  return false;
};
var NAMED_LABEL_SLOT_COMPONENTS = ["ION-INPUT", "ION-TEXTAREA", "ION-SELECT", "ION-RANGE"];
var UNNAMED_LABEL_SLOT_COMPONENTS = ["ION-TOGGLE", "ION-CHECKBOX", "ION-RADIO"];

export {
  createLegacyFormController
};
/*! Bundled license information:

@ionic/core/dist/esm/form-controller-21dd62b1.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=chunk-5ARUZYFG.js.map
