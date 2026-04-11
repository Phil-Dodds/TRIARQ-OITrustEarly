import {
  Host,
  createEvent,
  getElement,
  h,
  registerInstance
} from "./chunk-SII3QBXZ.js";
import {
  getElementRoot
} from "./chunk-FKQOC7QR.js";
import {
  __async
} from "./chunk-DSWO3WHD.js";

// node_modules/@ionic/core/dist/esm/ion-picker-internal.entry.js
var pickerInternalIosCss = ":host{display:-ms-flexbox;display:flex;position:relative;-ms-flex-align:center;align-items:center;-ms-flex-pack:center;justify-content:center;width:100%;height:200px;direction:ltr;z-index:0}:host .picker-before,:host .picker-after{position:absolute;width:100%;-webkit-transform:translateZ(0);transform:translateZ(0);z-index:1;pointer-events:none}:host .picker-before{top:0;height:83px}@supports (inset-inline-start: 0){:host .picker-before{inset-inline-start:0}}@supports not (inset-inline-start: 0){:host .picker-before{left:0}:host-context([dir=rtl]) .picker-before{left:unset;right:unset;right:0}@supports selector(:dir(rtl)){:host(:dir(rtl)) .picker-before{left:unset;right:unset;right:0}}}:host .picker-after{top:116px;height:84px}@supports (inset-inline-start: 0){:host .picker-after{inset-inline-start:0}}@supports not (inset-inline-start: 0){:host .picker-after{left:0}:host-context([dir=rtl]) .picker-after{left:unset;right:unset;right:0}@supports selector(:dir(rtl)){:host(:dir(rtl)) .picker-after{left:unset;right:unset;right:0}}}:host .picker-highlight{border-radius:8px;left:0;right:0;top:50%;bottom:0;-webkit-margin-start:auto;margin-inline-start:auto;-webkit-margin-end:auto;margin-inline-end:auto;margin-top:0;margin-bottom:0;position:absolute;width:calc(100% - 16px);height:34px;-webkit-transform:translateY(-50%);transform:translateY(-50%);background:var(--wheel-highlight-background);z-index:-1}:host input{position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;margin:0;padding:0;border:0;outline:0;clip:rect(0 0 0 0);opacity:0;overflow:hidden;-webkit-appearance:none;-moz-appearance:none}:host ::slotted(ion-picker-column-internal:first-of-type){text-align:start}:host ::slotted(ion-picker-column-internal:last-of-type){text-align:end}:host ::slotted(ion-picker-column-internal:only-child){text-align:center}:host .picker-before{background:-webkit-gradient(linear, left top, left bottom, color-stop(20%, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 1)), to(rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 0.8)));background:linear-gradient(to bottom, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 1) 20%, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 0.8) 100%)}:host .picker-after{background:-webkit-gradient(linear, left bottom, left top, color-stop(20%, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 1)), to(rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 0.8)));background:linear-gradient(to top, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 1) 20%, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 0.8) 100%)}:host .picker-highlight{background:var(--wheel-highlight-background, var(--ion-color-step-150, #eeeeef))}";
var IonPickerInternalIosStyle0 = pickerInternalIosCss;
var pickerInternalMdCss = ":host{display:-ms-flexbox;display:flex;position:relative;-ms-flex-align:center;align-items:center;-ms-flex-pack:center;justify-content:center;width:100%;height:200px;direction:ltr;z-index:0}:host .picker-before,:host .picker-after{position:absolute;width:100%;-webkit-transform:translateZ(0);transform:translateZ(0);z-index:1;pointer-events:none}:host .picker-before{top:0;height:83px}@supports (inset-inline-start: 0){:host .picker-before{inset-inline-start:0}}@supports not (inset-inline-start: 0){:host .picker-before{left:0}:host-context([dir=rtl]) .picker-before{left:unset;right:unset;right:0}@supports selector(:dir(rtl)){:host(:dir(rtl)) .picker-before{left:unset;right:unset;right:0}}}:host .picker-after{top:116px;height:84px}@supports (inset-inline-start: 0){:host .picker-after{inset-inline-start:0}}@supports not (inset-inline-start: 0){:host .picker-after{left:0}:host-context([dir=rtl]) .picker-after{left:unset;right:unset;right:0}@supports selector(:dir(rtl)){:host(:dir(rtl)) .picker-after{left:unset;right:unset;right:0}}}:host .picker-highlight{border-radius:8px;left:0;right:0;top:50%;bottom:0;-webkit-margin-start:auto;margin-inline-start:auto;-webkit-margin-end:auto;margin-inline-end:auto;margin-top:0;margin-bottom:0;position:absolute;width:calc(100% - 16px);height:34px;-webkit-transform:translateY(-50%);transform:translateY(-50%);background:var(--wheel-highlight-background);z-index:-1}:host input{position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;margin:0;padding:0;border:0;outline:0;clip:rect(0 0 0 0);opacity:0;overflow:hidden;-webkit-appearance:none;-moz-appearance:none}:host ::slotted(ion-picker-column-internal:first-of-type){text-align:start}:host ::slotted(ion-picker-column-internal:last-of-type){text-align:end}:host ::slotted(ion-picker-column-internal:only-child){text-align:center}:host .picker-before{background:-webkit-gradient(linear, left top, left bottom, color-stop(20%, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 1)), color-stop(90%, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 0)));background:linear-gradient(to bottom, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 1) 20%, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 0) 90%)}:host .picker-after{background:-webkit-gradient(linear, left bottom, left top, color-stop(30%, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 1)), color-stop(90%, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 0)));background:linear-gradient(to top, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 1) 30%, rgba(var(--wheel-fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb, 255, 255, 255))), 0) 90%)}";
var IonPickerInternalMdStyle0 = pickerInternalMdCss;
var PickerInternal = class {
  constructor(hostRef) {
    registerInstance(this, hostRef);
    this.ionInputModeChange = createEvent(this, "ionInputModeChange", 7);
    this.useInputMode = false;
    this.isInHighlightBounds = (ev) => {
      const { highlightEl } = this;
      if (!highlightEl) {
        return false;
      }
      const bbox = highlightEl.getBoundingClientRect();
      const outsideX = ev.clientX < bbox.left || ev.clientX > bbox.right;
      const outsideY = ev.clientY < bbox.top || ev.clientY > bbox.bottom;
      if (outsideX || outsideY) {
        return false;
      }
      return true;
    };
    this.onFocusOut = (ev) => {
      const { relatedTarget } = ev;
      if (!relatedTarget || relatedTarget.tagName !== "ION-PICKER-COLUMN-INTERNAL" && relatedTarget !== this.inputEl) {
        this.exitInputMode();
      }
    };
    this.onFocusIn = (ev) => {
      const { target } = ev;
      if (target.tagName !== "ION-PICKER-COLUMN-INTERNAL") {
        return;
      }
      if (!this.actionOnClick) {
        const columnEl = target;
        const allowInput = columnEl.numericInput;
        if (allowInput) {
          this.enterInputMode(columnEl, false);
        } else {
          this.exitInputMode();
        }
      }
    };
    this.onClick = () => {
      const { actionOnClick } = this;
      if (actionOnClick) {
        actionOnClick();
        this.actionOnClick = void 0;
      }
    };
    this.onPointerDown = (ev) => {
      const { useInputMode, inputModeColumn, el } = this;
      if (this.isInHighlightBounds(ev)) {
        if (useInputMode) {
          if (ev.target.tagName === "ION-PICKER-COLUMN-INTERNAL") {
            if (inputModeColumn && inputModeColumn === ev.target) {
              this.actionOnClick = () => {
                this.enterInputMode();
              };
            } else {
              this.actionOnClick = () => {
                this.enterInputMode(ev.target);
              };
            }
          } else {
            this.actionOnClick = () => {
              this.exitInputMode();
            };
          }
        } else {
          const columns = el.querySelectorAll("ion-picker-column-internal.picker-column-numeric-input");
          const columnEl = columns.length === 1 ? ev.target : void 0;
          this.actionOnClick = () => {
            this.enterInputMode(columnEl);
          };
        }
        return;
      }
      this.actionOnClick = () => {
        this.exitInputMode();
      };
    };
    this.enterInputMode = (columnEl, focusInput = true) => {
      const { inputEl, el } = this;
      if (!inputEl) {
        return;
      }
      const hasInputColumn = el.querySelector("ion-picker-column-internal.picker-column-numeric-input");
      if (!hasInputColumn) {
        return;
      }
      this.useInputMode = true;
      this.inputModeColumn = columnEl;
      if (focusInput) {
        if (this.destroyKeypressListener) {
          this.destroyKeypressListener();
          this.destroyKeypressListener = void 0;
        }
        inputEl.focus();
      } else {
        el.addEventListener("keypress", this.onKeyPress);
        this.destroyKeypressListener = () => {
          el.removeEventListener("keypress", this.onKeyPress);
        };
      }
      this.emitInputModeChange();
    };
    this.onKeyPress = (ev) => {
      const { inputEl } = this;
      if (!inputEl) {
        return;
      }
      const parsedValue = parseInt(ev.key, 10);
      if (!Number.isNaN(parsedValue)) {
        inputEl.value += ev.key;
        this.onInputChange();
      }
    };
    this.selectSingleColumn = () => {
      const { inputEl, inputModeColumn, singleColumnSearchTimeout } = this;
      if (!inputEl || !inputModeColumn) {
        return;
      }
      const values = inputModeColumn.items.filter((item) => item.disabled !== true);
      if (singleColumnSearchTimeout) {
        clearTimeout(singleColumnSearchTimeout);
      }
      this.singleColumnSearchTimeout = setTimeout(() => {
        inputEl.value = "";
        this.singleColumnSearchTimeout = void 0;
      }, 1e3);
      if (inputEl.value.length >= 3) {
        const startIndex = inputEl.value.length - 2;
        const newString = inputEl.value.substring(startIndex);
        inputEl.value = newString;
        this.selectSingleColumn();
        return;
      }
      const findItemFromCompleteValue = values.find(({ text }) => {
        const parsedText = text.replace(/^0+(?=[1-9])|0+(?=0$)/, "");
        return parsedText === inputEl.value;
      });
      if (findItemFromCompleteValue) {
        inputModeColumn.setValue(findItemFromCompleteValue.value);
        return;
      }
      if (inputEl.value.length === 2) {
        const changedCharacter = inputEl.value.substring(inputEl.value.length - 1);
        inputEl.value = changedCharacter;
        this.selectSingleColumn();
      }
    };
    this.searchColumn = (colEl, value, zeroBehavior = "start") => {
      const behavior = zeroBehavior === "start" ? /^0+/ : /0$/;
      const item = colEl.items.find(({ text, disabled }) => disabled !== true && text.replace(behavior, "") === value);
      if (item) {
        colEl.setValue(item.value);
      }
    };
    this.selectMultiColumn = () => {
      const { inputEl, el } = this;
      if (!inputEl) {
        return;
      }
      const numericPickers = Array.from(el.querySelectorAll("ion-picker-column-internal")).filter((col) => col.numericInput);
      const firstColumn = numericPickers[0];
      const lastColumn = numericPickers[1];
      let value = inputEl.value;
      let minuteValue;
      switch (value.length) {
        case 1:
          this.searchColumn(firstColumn, value);
          break;
        case 2:
          const firstCharacter = inputEl.value.substring(0, 1);
          value = firstCharacter === "0" || firstCharacter === "1" ? inputEl.value : firstCharacter;
          this.searchColumn(firstColumn, value);
          if (value.length === 1) {
            minuteValue = inputEl.value.substring(inputEl.value.length - 1);
            this.searchColumn(lastColumn, minuteValue, "end");
          }
          break;
        case 3:
          const firstCharacterAgain = inputEl.value.substring(0, 1);
          value = firstCharacterAgain === "0" || firstCharacterAgain === "1" ? inputEl.value.substring(0, 2) : firstCharacterAgain;
          this.searchColumn(firstColumn, value);
          minuteValue = value.length === 1 ? inputEl.value.substring(1) : inputEl.value.substring(2);
          this.searchColumn(lastColumn, minuteValue, "end");
          break;
        case 4:
          const firstCharacterAgainAgain = inputEl.value.substring(0, 1);
          value = firstCharacterAgainAgain === "0" || firstCharacterAgainAgain === "1" ? inputEl.value.substring(0, 2) : firstCharacterAgainAgain;
          this.searchColumn(firstColumn, value);
          const minuteValueAgain = value.length === 1 ? inputEl.value.substring(1, inputEl.value.length) : inputEl.value.substring(2, inputEl.value.length);
          this.searchColumn(lastColumn, minuteValueAgain, "end");
          break;
        default:
          const startIndex = inputEl.value.length - 4;
          const newString = inputEl.value.substring(startIndex);
          inputEl.value = newString;
          this.selectMultiColumn();
          break;
      }
    };
    this.onInputChange = () => {
      const { useInputMode, inputEl, inputModeColumn } = this;
      if (!useInputMode || !inputEl) {
        return;
      }
      if (inputModeColumn) {
        this.selectSingleColumn();
      } else {
        this.selectMultiColumn();
      }
    };
    this.emitInputModeChange = () => {
      const { useInputMode, inputModeColumn } = this;
      this.ionInputModeChange.emit({
        useInputMode,
        inputModeColumn
      });
    };
  }
  /**
   * When the picker is interacted with
   * we need to prevent touchstart so other
   * gestures do not fire. For example,
   * scrolling on the wheel picker
   * in ion-datetime should not cause
   * a card modal to swipe to close.
   */
  preventTouchStartPropagation(ev) {
    ev.stopPropagation();
  }
  componentWillLoad() {
    getElementRoot(this.el).addEventListener("focusin", this.onFocusIn);
    getElementRoot(this.el).addEventListener("focusout", this.onFocusOut);
  }
  /**
   * @internal
   * Exits text entry mode for the picker
   * This method blurs the hidden input
   * and cause the keyboard to dismiss.
   */
  exitInputMode() {
    return __async(this, null, function* () {
      const { inputEl, useInputMode } = this;
      if (!useInputMode || !inputEl) {
        return;
      }
      this.useInputMode = false;
      this.inputModeColumn = void 0;
      inputEl.blur();
      inputEl.value = "";
      if (this.destroyKeypressListener) {
        this.destroyKeypressListener();
        this.destroyKeypressListener = void 0;
      }
      this.emitInputModeChange();
    });
  }
  render() {
    return h(Host, { key: "01cbd466787242ad070b01909714089570b4d67f", onPointerDown: (ev) => this.onPointerDown(ev), onClick: () => this.onClick() }, h("input", { key: "7ff8c0a74c107610a6f0dd9fbc2fc7a4a6dc2468", "aria-hidden": "true", tabindex: -1, inputmode: "numeric", type: "number", onKeyDown: (ev) => {
      var _a;
      if (ev.key === "Enter") {
        (_a = this.inputEl) === null || _a === void 0 ? void 0 : _a.blur();
      }
    }, ref: (el) => this.inputEl = el, onInput: () => this.onInputChange(), onBlur: () => this.exitInputMode() }), h("div", { key: "4700c9d877f54ae8f3fb173122193c27637f70a4", class: "picker-before" }), h("div", { key: "7ceae834b15d559f3819ec2116f83669cf6665fc", class: "picker-after" }), h("div", { key: "2d3bfda76279c2ee14edc067c53651be23b8b525", class: "picker-highlight", ref: (el) => this.highlightEl = el }), h("slot", { key: "4797def7a3882a8a911ad47949b76f58a9f448d1" }));
  }
  get el() {
    return getElement(this);
  }
};
PickerInternal.style = {
  ios: IonPickerInternalIosStyle0,
  md: IonPickerInternalMdStyle0
};
export {
  PickerInternal as ion_picker_internal
};
/*! Bundled license information:

@ionic/core/dist/esm/ion-picker-internal.entry.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=ion-picker-internal.entry-AB7QV6JD.js.map
