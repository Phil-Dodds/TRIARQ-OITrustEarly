import {
  getCapacitor
} from "./chunk-MJ2KCXPI.js";

// node_modules/@ionic/core/dist/esm/haptic-554688a5.js
var ImpactStyle;
(function(ImpactStyle2) {
  ImpactStyle2["Heavy"] = "HEAVY";
  ImpactStyle2["Medium"] = "MEDIUM";
  ImpactStyle2["Light"] = "LIGHT";
})(ImpactStyle || (ImpactStyle = {}));
var NotificationType;
(function(NotificationType2) {
  NotificationType2["Success"] = "SUCCESS";
  NotificationType2["Warning"] = "WARNING";
  NotificationType2["Error"] = "ERROR";
})(NotificationType || (NotificationType = {}));
var HapticEngine = {
  getEngine() {
    const tapticEngine = window.TapticEngine;
    if (tapticEngine) {
      return tapticEngine;
    }
    const capacitor = getCapacitor();
    if (capacitor === null || capacitor === void 0 ? void 0 : capacitor.isPluginAvailable("Haptics")) {
      return capacitor.Plugins.Haptics;
    }
    return void 0;
  },
  available() {
    const engine = this.getEngine();
    if (!engine) {
      return false;
    }
    const capacitor = getCapacitor();
    if ((capacitor === null || capacitor === void 0 ? void 0 : capacitor.getPlatform()) === "web") {
      return typeof navigator !== "undefined" && navigator.vibrate !== void 0;
    }
    return true;
  },
  isCordova() {
    return window.TapticEngine !== void 0;
  },
  isCapacitor() {
    return getCapacitor() !== void 0;
  },
  impact(options) {
    const engine = this.getEngine();
    if (!engine) {
      return;
    }
    const style = this.isCapacitor() ? options.style : options.style.toLowerCase();
    engine.impact({ style });
  },
  notification(options) {
    const engine = this.getEngine();
    if (!engine) {
      return;
    }
    const type = this.isCapacitor() ? options.type : options.type.toLowerCase();
    engine.notification({ type });
  },
  selection() {
    const style = this.isCapacitor() ? ImpactStyle.Light : "light";
    this.impact({ style });
  },
  selectionStart() {
    const engine = this.getEngine();
    if (!engine) {
      return;
    }
    if (this.isCapacitor()) {
      engine.selectionStart();
    } else {
      engine.gestureSelectionStart();
    }
  },
  selectionChanged() {
    const engine = this.getEngine();
    if (!engine) {
      return;
    }
    if (this.isCapacitor()) {
      engine.selectionChanged();
    } else {
      engine.gestureSelectionChanged();
    }
  },
  selectionEnd() {
    const engine = this.getEngine();
    if (!engine) {
      return;
    }
    if (this.isCapacitor()) {
      engine.selectionEnd();
    } else {
      engine.gestureSelectionEnd();
    }
  }
};
var hapticAvailable = () => {
  return HapticEngine.available();
};
var hapticSelection = () => {
  hapticAvailable() && HapticEngine.selection();
};
var hapticSelectionStart = () => {
  hapticAvailable() && HapticEngine.selectionStart();
};
var hapticSelectionChanged = () => {
  hapticAvailable() && HapticEngine.selectionChanged();
};
var hapticSelectionEnd = () => {
  hapticAvailable() && HapticEngine.selectionEnd();
};
var hapticImpact = (options) => {
  hapticAvailable() && HapticEngine.impact(options);
};

export {
  ImpactStyle,
  hapticSelection,
  hapticSelectionStart,
  hapticSelectionChanged,
  hapticSelectionEnd,
  hapticImpact
};
/*! Bundled license information:

@ionic/core/dist/esm/haptic-554688a5.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=chunk-KDR5FLWR.js.map
