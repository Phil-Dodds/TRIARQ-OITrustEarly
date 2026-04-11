import {
  hapticSelectionChanged,
  hapticSelectionEnd,
  hapticSelectionStart
} from "./chunk-KDR5FLWR.js";
import "./chunk-MJ2KCXPI.js";
import {
  createColorClasses
} from "./chunk-4TKDMDPC.js";
import {
  getIonMode,
  isPlatform
} from "./chunk-DHRBUV2X.js";
import "./chunk-KA4VJ47T.js";
import {
  Host,
  createEvent,
  getElement,
  h,
  registerInstance
} from "./chunk-SII3QBXZ.js";
import {
  getElementRoot,
  raf
} from "./chunk-FKQOC7QR.js";
import {
  __async
} from "./chunk-DSWO3WHD.js";

// node_modules/@ionic/core/dist/esm/ion-picker-column-internal.entry.js
var pickerColumnInternalIosCss = ":host{-webkit-padding-start:16px;padding-inline-start:16px;-webkit-padding-end:16px;padding-inline-end:16px;padding-top:0px;padding-bottom:0px;height:200px;outline:none;font-size:22px;-webkit-scroll-snap-type:y mandatory;-ms-scroll-snap-type:y mandatory;scroll-snap-type:y mandatory;overflow-x:hidden;overflow-y:scroll;scrollbar-width:none;text-align:center}:host::-webkit-scrollbar{display:none}:host .picker-item{padding-left:0;padding-right:0;padding-top:0;padding-bottom:0;margin-left:0;margin-right:0;margin-top:0;margin-bottom:0;display:block;width:100%;height:34px;border:0px;outline:none;background:transparent;color:inherit;font-family:var(--ion-font-family, inherit);font-size:inherit;line-height:34px;text-align:inherit;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;overflow:hidden;scroll-snap-align:center}:host .picker-item-empty,:host .picker-item[disabled]{cursor:default}:host .picker-item-empty,:host(:not([disabled])) .picker-item[disabled]{scroll-snap-align:none}:host([disabled]){overflow-y:hidden}:host .picker-item[disabled]{opacity:0.4}:host(.picker-column-active) .picker-item.picker-item-active{color:var(--ion-color-base)}@media (any-hover: hover){:host(:focus){outline:none;background:rgba(var(--ion-color-base-rgb), 0.2)}}";
var IonPickerColumnInternalIosStyle0 = pickerColumnInternalIosCss;
var pickerColumnInternalMdCss = ":host{-webkit-padding-start:16px;padding-inline-start:16px;-webkit-padding-end:16px;padding-inline-end:16px;padding-top:0px;padding-bottom:0px;height:200px;outline:none;font-size:22px;-webkit-scroll-snap-type:y mandatory;-ms-scroll-snap-type:y mandatory;scroll-snap-type:y mandatory;overflow-x:hidden;overflow-y:scroll;scrollbar-width:none;text-align:center}:host::-webkit-scrollbar{display:none}:host .picker-item{padding-left:0;padding-right:0;padding-top:0;padding-bottom:0;margin-left:0;margin-right:0;margin-top:0;margin-bottom:0;display:block;width:100%;height:34px;border:0px;outline:none;background:transparent;color:inherit;font-family:var(--ion-font-family, inherit);font-size:inherit;line-height:34px;text-align:inherit;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;overflow:hidden;scroll-snap-align:center}:host .picker-item-empty,:host .picker-item[disabled]{cursor:default}:host .picker-item-empty,:host(:not([disabled])) .picker-item[disabled]{scroll-snap-align:none}:host([disabled]){overflow-y:hidden}:host .picker-item[disabled]{opacity:0.4}:host(.picker-column-active) .picker-item.picker-item-active{color:var(--ion-color-base)}@media (any-hover: hover){:host(:focus){outline:none;background:rgba(var(--ion-color-base-rgb), 0.2)}}:host .picker-item-active{color:var(--ion-color-base)}";
var IonPickerColumnInternalMdStyle0 = pickerColumnInternalMdCss;
var PickerColumnInternal = class {
  constructor(hostRef) {
    registerInstance(this, hostRef);
    this.ionChange = createEvent(this, "ionChange", 7);
    this.isScrolling = false;
    this.isColumnVisible = false;
    this.canExitInputMode = true;
    this.centerPickerItemInView = (target, smooth = true, canExitInputMode = true) => {
      const { el, isColumnVisible } = this;
      if (isColumnVisible) {
        const top = target.offsetTop - 3 * target.clientHeight + target.clientHeight / 2;
        if (el.scrollTop !== top) {
          this.canExitInputMode = canExitInputMode;
          el.scroll({
            top,
            left: 0,
            behavior: smooth ? "smooth" : void 0
          });
        }
      }
    };
    this.setPickerItemActiveState = (item, isActive) => {
      if (isActive) {
        item.classList.add(PICKER_ITEM_ACTIVE_CLASS);
        item.part.add(PICKER_ITEM_ACTIVE_PART);
      } else {
        item.classList.remove(PICKER_ITEM_ACTIVE_CLASS);
        item.part.remove(PICKER_ITEM_ACTIVE_PART);
      }
    };
    this.inputModeChange = (ev) => {
      if (!this.numericInput) {
        return;
      }
      const { useInputMode, inputModeColumn } = ev.detail;
      const isColumnActive = inputModeColumn === void 0 || inputModeColumn === this.el;
      if (!useInputMode || !isColumnActive) {
        this.setInputModeActive(false);
        return;
      }
      this.setInputModeActive(true);
    };
    this.setInputModeActive = (state) => {
      if (this.isScrolling) {
        this.scrollEndCallback = () => {
          this.isActive = state;
        };
        return;
      }
      this.isActive = state;
    };
    this.initializeScrollListener = () => {
      const enableHaptics = isPlatform("ios");
      const { el } = this;
      let timeout;
      let activeEl = this.activeItem;
      const scrollCallback = () => {
        raf(() => {
          if (timeout) {
            clearTimeout(timeout);
            timeout = void 0;
          }
          if (!this.isScrolling) {
            enableHaptics && hapticSelectionStart();
            this.isScrolling = true;
          }
          const bbox = el.getBoundingClientRect();
          const centerX = bbox.x + bbox.width / 2;
          const centerY = bbox.y + bbox.height / 2;
          const activeElement = el.shadowRoot.elementFromPoint(centerX, centerY);
          if (activeEl !== null) {
            this.setPickerItemActiveState(activeEl, false);
          }
          if (activeElement === null || activeElement.disabled) {
            return;
          }
          if (activeElement !== activeEl) {
            enableHaptics && hapticSelectionChanged();
            if (this.canExitInputMode) {
              this.exitInputMode();
            }
          }
          activeEl = activeElement;
          this.setPickerItemActiveState(activeElement, true);
          timeout = setTimeout(() => {
            this.isScrolling = false;
            enableHaptics && hapticSelectionEnd();
            const { scrollEndCallback } = this;
            if (scrollEndCallback) {
              scrollEndCallback();
              this.scrollEndCallback = void 0;
            }
            this.canExitInputMode = true;
            const dataIndex = activeElement.getAttribute("data-index");
            if (dataIndex === null) {
              return;
            }
            const index = parseInt(dataIndex, 10);
            const selectedItem = this.items[index];
            if (selectedItem.value !== this.value) {
              this.setValue(selectedItem.value);
            }
          }, 250);
        });
      };
      raf(() => {
        el.addEventListener("scroll", scrollCallback);
        this.destroyScrollListener = () => {
          el.removeEventListener("scroll", scrollCallback);
        };
      });
    };
    this.exitInputMode = () => {
      const { parentEl } = this;
      if (parentEl == null)
        return;
      parentEl.exitInputMode();
      this.el.classList.remove("picker-column-active");
    };
    this.isActive = false;
    this.disabled = false;
    this.items = [];
    this.value = void 0;
    this.color = "primary";
    this.numericInput = false;
  }
  valueChange() {
    if (this.isColumnVisible) {
      this.scrollActiveItemIntoView();
    }
  }
  /**
   * Only setup scroll listeners
   * when the picker is visible, otherwise
   * the container will have a scroll
   * height of 0px.
   */
  componentWillLoad() {
    const visibleCallback = (entries) => {
      const ev = entries[entries.length - 1];
      if (ev.isIntersecting) {
        const { activeItem, el } = this;
        this.isColumnVisible = true;
        const oldActive = getElementRoot(el).querySelector(`.${PICKER_ITEM_ACTIVE_CLASS}`);
        if (oldActive) {
          this.setPickerItemActiveState(oldActive, false);
        }
        this.scrollActiveItemIntoView();
        if (activeItem) {
          this.setPickerItemActiveState(activeItem, true);
        }
        this.initializeScrollListener();
      } else {
        this.isColumnVisible = false;
        if (this.destroyScrollListener) {
          this.destroyScrollListener();
          this.destroyScrollListener = void 0;
        }
      }
    };
    new IntersectionObserver(visibleCallback, { threshold: 1e-3 }).observe(this.el);
    const parentEl = this.parentEl = this.el.closest("ion-picker-internal");
    if (parentEl !== null) {
      parentEl.addEventListener("ionInputModeChange", (ev) => this.inputModeChange(ev));
    }
  }
  componentDidRender() {
    var _a;
    const { activeItem, items, isColumnVisible, value } = this;
    if (isColumnVisible) {
      if (activeItem) {
        this.scrollActiveItemIntoView();
      } else if (((_a = items[0]) === null || _a === void 0 ? void 0 : _a.value) !== value) {
        this.setValue(items[0].value);
      }
    }
  }
  /** @internal  */
  scrollActiveItemIntoView() {
    return __async(this, null, function* () {
      const activeEl = this.activeItem;
      if (activeEl) {
        this.centerPickerItemInView(activeEl, false, false);
      }
    });
  }
  /**
   * Sets the value prop and fires the ionChange event.
   * This is used when we need to fire ionChange from
   * user-generated events that cannot be caught with normal
   * input/change event listeners.
   * @internal
   */
  setValue(value) {
    return __async(this, null, function* () {
      const { items } = this;
      this.value = value;
      const findItem = items.find((item) => item.value === value && item.disabled !== true);
      if (findItem) {
        this.ionChange.emit(findItem);
      }
    });
  }
  get activeItem() {
    const selector = `.picker-item[data-value="${this.value}"]${this.disabled ? "" : ":not([disabled])"}`;
    return getElementRoot(this.el).querySelector(selector);
  }
  render() {
    const { items, color, disabled: pickerDisabled, isActive, numericInput } = this;
    const mode = getIonMode(this);
    return h(Host, { key: "42a034f2533d30d19f96a121eb74d5f757e1c684", exportparts: `${PICKER_ITEM_PART}, ${PICKER_ITEM_ACTIVE_PART}`, disabled: pickerDisabled, tabindex: pickerDisabled ? null : 0, class: createColorClasses(color, {
      [mode]: true,
      ["picker-column-active"]: isActive,
      ["picker-column-numeric-input"]: numericInput
    }) }, h("div", { key: "85efccb40c87d473c06026b8041d57b40d2369c3", class: "picker-item picker-item-empty", "aria-hidden": "true" }, "\xA0"), h("div", { key: "9fae4dd6697f23acba18c218ba250ea77954b18d", class: "picker-item picker-item-empty", "aria-hidden": "true" }, "\xA0"), h("div", { key: "f117afeb204a4f6bb34a1cd0e1b786fa479d8b32", class: "picker-item picker-item-empty", "aria-hidden": "true" }, "\xA0"), items.map((item, index) => {
      const isItemDisabled = pickerDisabled || item.disabled || false;
      return h("button", { tabindex: "-1", class: {
        "picker-item": true
      }, "data-value": item.value, "data-index": index, onClick: (ev) => {
        this.centerPickerItemInView(ev.target, true);
      }, disabled: isItemDisabled, part: PICKER_ITEM_PART }, item.text);
    }), h("div", { key: "28aa37f9ce90e88b9c3a5b2c399e3066e9f339e1", class: "picker-item picker-item-empty", "aria-hidden": "true" }, "\xA0"), h("div", { key: "ef4ae6bee2b17918f0c2aba9d5c720c1d95987e4", class: "picker-item picker-item-empty", "aria-hidden": "true" }, "\xA0"), h("div", { key: "564967bc8e42a9018163850da3a967a933b3de7b", class: "picker-item picker-item-empty", "aria-hidden": "true" }, "\xA0"));
  }
  get el() {
    return getElement(this);
  }
  static get watchers() {
    return {
      "value": ["valueChange"]
    };
  }
};
var PICKER_ITEM_ACTIVE_CLASS = "picker-item-active";
var PICKER_ITEM_PART = "wheel-item";
var PICKER_ITEM_ACTIVE_PART = "active";
PickerColumnInternal.style = {
  ios: IonPickerColumnInternalIosStyle0,
  md: IonPickerColumnInternalMdStyle0
};
export {
  PickerColumnInternal as ion_picker_column_internal
};
/*! Bundled license information:

@ionic/core/dist/esm/ion-picker-column-internal.entry.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=ion-picker-column-internal.entry-ZU34VB5U.js.map
