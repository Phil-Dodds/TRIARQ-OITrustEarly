import {
  win
} from "./chunk-KA4VJ47T.js";
import {
  printIonError
} from "./chunk-CIYO67CO.js";
import {
  raf
} from "./chunk-FKQOC7QR.js";

// node_modules/@ionic/core/dist/esm/input.utils-a445f677.js
var createSlotMutationController = (el, slotName, mutationCallback) => {
  let hostMutationObserver;
  let slottedContentMutationObserver;
  if (win !== void 0 && "MutationObserver" in win) {
    const slots = Array.isArray(slotName) ? slotName : [slotName];
    hostMutationObserver = new MutationObserver((entries) => {
      for (const entry of entries) {
        for (const node of entry.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && slots.includes(node.slot)) {
            mutationCallback();
            raf(() => watchForSlotChange(node));
            return;
          }
        }
      }
    });
    hostMutationObserver.observe(el, {
      childList: true
    });
  }
  const watchForSlotChange = (slottedEl) => {
    var _a;
    if (slottedContentMutationObserver) {
      slottedContentMutationObserver.disconnect();
      slottedContentMutationObserver = void 0;
    }
    slottedContentMutationObserver = new MutationObserver((entries) => {
      mutationCallback();
      for (const entry of entries) {
        for (const node of entry.removedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && node.slot === slotName) {
            destroySlottedContentObserver();
          }
        }
      }
    });
    slottedContentMutationObserver.observe((_a = slottedEl.parentElement) !== null && _a !== void 0 ? _a : slottedEl, { subtree: true, childList: true });
  };
  const destroy = () => {
    if (hostMutationObserver) {
      hostMutationObserver.disconnect();
      hostMutationObserver = void 0;
    }
    destroySlottedContentObserver();
  };
  const destroySlottedContentObserver = () => {
    if (slottedContentMutationObserver) {
      slottedContentMutationObserver.disconnect();
      slottedContentMutationObserver = void 0;
    }
  };
  return {
    destroy
  };
};
var getCounterText = (value, maxLength, counterFormatter) => {
  const valueLength = value == null ? 0 : value.toString().length;
  const defaultCounterText = defaultCounterFormatter(valueLength, maxLength);
  if (counterFormatter === void 0) {
    return defaultCounterText;
  }
  try {
    return counterFormatter(valueLength, maxLength);
  } catch (e) {
    printIonError("Exception in provided `counterFormatter`.", e);
    return defaultCounterText;
  }
};
var defaultCounterFormatter = (length, maxlength) => {
  return `${length} / ${maxlength}`;
};

export {
  createSlotMutationController,
  getCounterText
};
/*! Bundled license information:

@ionic/core/dist/esm/input.utils-a445f677.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=chunk-FO6RANTC.js.map
