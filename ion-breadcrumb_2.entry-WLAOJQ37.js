import {
  chevronForwardOutline,
  ellipsisHorizontal
} from "./chunk-C2ANH24F.js";
import {
  createColorClasses,
  hostContext,
  openURL
} from "./chunk-4TKDMDPC.js";
import {
  getIonMode
} from "./chunk-DHRBUV2X.js";
import {
  Host,
  createEvent,
  getElement,
  h,
  registerInstance
} from "./chunk-SII3QBXZ.js";
import {
  inheritAriaAttributes
} from "./chunk-FKQOC7QR.js";
import "./chunk-DSWO3WHD.js";

// node_modules/@ionic/core/dist/esm/ion-breadcrumb_2.entry.js
var breadcrumbIosCss = ":host{display:-ms-flexbox;display:flex;-ms-flex:0 0 auto;flex:0 0 auto;-ms-flex-align:center;align-items:center;color:var(--color);font-size:1rem;font-weight:400;line-height:1.5}.breadcrumb-native{font-family:inherit;font-size:inherit;font-style:inherit;font-weight:inherit;letter-spacing:inherit;text-decoration:inherit;text-indent:inherit;text-overflow:inherit;text-transform:inherit;text-align:inherit;white-space:inherit;color:inherit;padding-left:0;padding-right:0;padding-top:0;padding-bottom:0;margin-left:0;margin-right:0;margin-top:0;margin-bottom:0;display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;width:100%;outline:none;background:inherit}:host(.breadcrumb-disabled){cursor:default;opacity:0.5;pointer-events:none}:host(.breadcrumb-active){color:var(--color-active)}:host(.ion-focused){color:var(--color-focused)}:host(.ion-focused) .breadcrumb-native{background:var(--background-focused)}@media (any-hover: hover){:host(.ion-activatable:hover){color:var(--color-hover)}:host(.ion-activatable.in-breadcrumbs-color:hover),:host(.ion-activatable.ion-color:hover){color:var(--ion-color-shade)}}.breadcrumb-separator{display:-ms-inline-flexbox;display:inline-flex}:host(.breadcrumb-collapsed) .breadcrumb-native{display:none}:host(.in-breadcrumbs-color),:host(.in-breadcrumbs-color.breadcrumb-active){color:var(--ion-color-base)}:host(.in-breadcrumbs-color) .breadcrumb-separator{color:var(--ion-color-base)}:host(.ion-color){color:var(--ion-color-base)}:host(.in-toolbar-color),:host(.in-toolbar-color) .breadcrumb-separator{color:rgba(var(--ion-color-contrast-rgb), 0.8)}:host(.in-toolbar-color.breadcrumb-active){color:var(--ion-color-contrast)}.breadcrumbs-collapsed-indicator{padding-left:0;padding-right:0;padding-top:0;padding-bottom:0;-webkit-margin-start:14px;margin-inline-start:14px;-webkit-margin-end:14px;margin-inline-end:14px;margin-top:0;margin-bottom:0;display:-ms-flexbox;display:flex;-ms-flex:1 1 100%;flex:1 1 100%;-ms-flex-align:center;align-items:center;-ms-flex-pack:center;justify-content:center;width:32px;height:18px;border:0;outline:none;cursor:pointer;-webkit-appearance:none;-moz-appearance:none;appearance:none}.breadcrumbs-collapsed-indicator ion-icon{margin-top:1px;font-size:1.375rem}:host{--color:var(--ion-color-step-850, #2d4665);--color-active:var(--ion-text-color, #03060b);--color-hover:var(--ion-text-color, #03060b);--color-focused:var(--color-active);--background-focused:var(--ion-color-step-50, rgba(233, 237, 243, 0.7));font-size:clamp(16px, 1rem, 22px)}:host(.breadcrumb-active){font-weight:600}.breadcrumb-native{border-radius:4px;-webkit-padding-start:12px;padding-inline-start:12px;-webkit-padding-end:12px;padding-inline-end:12px;padding-top:5px;padding-bottom:5px;border:1px solid transparent}:host(.ion-focused) .breadcrumb-native{border-radius:8px}:host(.in-breadcrumbs-color.ion-focused) .breadcrumb-native,:host(.ion-color.ion-focused) .breadcrumb-native{background:rgba(var(--ion-color-base-rgb), 0.1);color:var(--ion-color-base)}:host(.ion-focused) ::slotted(ion-icon),:host(.in-breadcrumbs-color.ion-focused) ::slotted(ion-icon),:host(.ion-color.ion-focused) ::slotted(ion-icon){color:var(--ion-color-step-750, #445b78)}.breadcrumb-separator{color:var(--ion-color-step-550, #73849a)}::slotted(ion-icon){color:var(--ion-color-step-400, #92a0b3);font-size:min(1.125rem, 21.6px)}::slotted(ion-icon[slot=start]){-webkit-margin-end:8px;margin-inline-end:8px}::slotted(ion-icon[slot=end]){-webkit-margin-start:8px;margin-inline-start:8px}:host(.breadcrumb-active) ::slotted(ion-icon){color:var(--ion-color-step-850, #242d39)}.breadcrumbs-collapsed-indicator{border-radius:4px;background:var(--ion-color-step-100, #e9edf3);color:var(--ion-color-step-550, #73849a)}.breadcrumbs-collapsed-indicator:hover{opacity:0.45}.breadcrumbs-collapsed-indicator:focus{background:var(--ion-color-step-150, #d9e0ea)}.breadcrumbs-collapsed-indicator ion-icon{font-size:min(1.375rem, 22px)}";
var IonBreadcrumbIosStyle0 = breadcrumbIosCss;
var breadcrumbMdCss = ":host{display:-ms-flexbox;display:flex;-ms-flex:0 0 auto;flex:0 0 auto;-ms-flex-align:center;align-items:center;color:var(--color);font-size:1rem;font-weight:400;line-height:1.5}.breadcrumb-native{font-family:inherit;font-size:inherit;font-style:inherit;font-weight:inherit;letter-spacing:inherit;text-decoration:inherit;text-indent:inherit;text-overflow:inherit;text-transform:inherit;text-align:inherit;white-space:inherit;color:inherit;padding-left:0;padding-right:0;padding-top:0;padding-bottom:0;margin-left:0;margin-right:0;margin-top:0;margin-bottom:0;display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;width:100%;outline:none;background:inherit}:host(.breadcrumb-disabled){cursor:default;opacity:0.5;pointer-events:none}:host(.breadcrumb-active){color:var(--color-active)}:host(.ion-focused){color:var(--color-focused)}:host(.ion-focused) .breadcrumb-native{background:var(--background-focused)}@media (any-hover: hover){:host(.ion-activatable:hover){color:var(--color-hover)}:host(.ion-activatable.in-breadcrumbs-color:hover),:host(.ion-activatable.ion-color:hover){color:var(--ion-color-shade)}}.breadcrumb-separator{display:-ms-inline-flexbox;display:inline-flex}:host(.breadcrumb-collapsed) .breadcrumb-native{display:none}:host(.in-breadcrumbs-color),:host(.in-breadcrumbs-color.breadcrumb-active){color:var(--ion-color-base)}:host(.in-breadcrumbs-color) .breadcrumb-separator{color:var(--ion-color-base)}:host(.ion-color){color:var(--ion-color-base)}:host(.in-toolbar-color),:host(.in-toolbar-color) .breadcrumb-separator{color:rgba(var(--ion-color-contrast-rgb), 0.8)}:host(.in-toolbar-color.breadcrumb-active){color:var(--ion-color-contrast)}.breadcrumbs-collapsed-indicator{padding-left:0;padding-right:0;padding-top:0;padding-bottom:0;-webkit-margin-start:14px;margin-inline-start:14px;-webkit-margin-end:14px;margin-inline-end:14px;margin-top:0;margin-bottom:0;display:-ms-flexbox;display:flex;-ms-flex:1 1 100%;flex:1 1 100%;-ms-flex-align:center;align-items:center;-ms-flex-pack:center;justify-content:center;width:32px;height:18px;border:0;outline:none;cursor:pointer;-webkit-appearance:none;-moz-appearance:none;appearance:none}.breadcrumbs-collapsed-indicator ion-icon{margin-top:1px;font-size:1.375rem}:host{--color:var(--ion-color-step-600, #677483);--color-active:var(--ion-text-color, #03060b);--color-hover:var(--ion-text-color, #03060b);--color-focused:var(--ion-color-step-800, #35404e);--background-focused:var(--ion-color-step-50, #fff)}:host(.breadcrumb-active){font-weight:500}.breadcrumb-native{-webkit-padding-start:12px;padding-inline-start:12px;-webkit-padding-end:12px;padding-inline-end:12px;padding-top:6px;padding-bottom:6px}.breadcrumb-separator{-webkit-margin-start:10px;margin-inline-start:10px;-webkit-margin-end:10px;margin-inline-end:10px;margin-top:-1px}:host(.ion-focused) .breadcrumb-native{border-radius:4px;-webkit-box-shadow:0px 1px 2px rgba(0, 0, 0, 0.2), 0px 2px 8px rgba(0, 0, 0, 0.12);box-shadow:0px 1px 2px rgba(0, 0, 0, 0.2), 0px 2px 8px rgba(0, 0, 0, 0.12)}.breadcrumb-separator{color:var(--ion-color-step-550, #73849a)}::slotted(ion-icon){color:var(--ion-color-step-550, #7d8894);font-size:1.125rem}::slotted(ion-icon[slot=start]){-webkit-margin-end:8px;margin-inline-end:8px}::slotted(ion-icon[slot=end]){-webkit-margin-start:8px;margin-inline-start:8px}:host(.breadcrumb-active) ::slotted(ion-icon){color:var(--ion-color-step-850, #222d3a)}.breadcrumbs-collapsed-indicator{border-radius:2px;background:var(--ion-color-step-100, #eef1f3);color:var(--ion-color-step-550, #73849a)}.breadcrumbs-collapsed-indicator:hover{opacity:0.7}.breadcrumbs-collapsed-indicator:focus{background:var(--ion-color-step-150, #dfe5e8)}";
var IonBreadcrumbMdStyle0 = breadcrumbMdCss;
var Breadcrumb = class {
  constructor(hostRef) {
    registerInstance(this, hostRef);
    this.ionFocus = createEvent(this, "ionFocus", 7);
    this.ionBlur = createEvent(this, "ionBlur", 7);
    this.collapsedClick = createEvent(this, "collapsedClick", 7);
    this.inheritedAttributes = {};
    this.onFocus = () => {
      this.ionFocus.emit();
    };
    this.onBlur = () => {
      this.ionBlur.emit();
    };
    this.collapsedIndicatorClick = () => {
      this.collapsedClick.emit({ ionShadowTarget: this.collapsedRef });
    };
    this.collapsed = false;
    this.last = void 0;
    this.showCollapsedIndicator = void 0;
    this.color = void 0;
    this.active = false;
    this.disabled = false;
    this.download = void 0;
    this.href = void 0;
    this.rel = void 0;
    this.separator = void 0;
    this.target = void 0;
    this.routerDirection = "forward";
    this.routerAnimation = void 0;
  }
  componentWillLoad() {
    this.inheritedAttributes = inheritAriaAttributes(this.el);
  }
  isClickable() {
    return this.href !== void 0;
  }
  render() {
    const { color, active, collapsed, disabled, download, el, inheritedAttributes, last, routerAnimation, routerDirection, separator, showCollapsedIndicator, target } = this;
    const clickable = this.isClickable();
    const TagType = this.href === void 0 ? "span" : "a";
    const href = disabled ? void 0 : this.href;
    const mode = getIonMode(this);
    const attrs = TagType === "span" ? {} : {
      download,
      href,
      target
    };
    const showSeparator = last ? false : collapsed ? showCollapsedIndicator && !last ? true : false : separator;
    return h(Host, { key: "6d354439f90ec3cfab9fbf93cb17a67fb9ca6034", onClick: (ev) => openURL(href, ev, routerDirection, routerAnimation), "aria-disabled": disabled ? "true" : null, class: createColorClasses(color, {
      [mode]: true,
      "breadcrumb-active": active,
      "breadcrumb-collapsed": collapsed,
      "breadcrumb-disabled": disabled,
      "in-breadcrumbs-color": hostContext("ion-breadcrumbs[color]", el),
      "in-toolbar": hostContext("ion-toolbar", this.el),
      "in-toolbar-color": hostContext("ion-toolbar[color]", this.el),
      "ion-activatable": clickable,
      "ion-focusable": clickable
    }) }, h(TagType, Object.assign({ key: "4782977969bd84af02b1834573a6e51069b798ae" }, attrs, { class: "breadcrumb-native", part: "native", disabled, onFocus: this.onFocus, onBlur: this.onBlur }, inheritedAttributes), h("slot", { key: "7d5fb845e463b8195142099773e7f258fc8ed31d", name: "start" }), h("slot", { key: "6b642ccb9101c12f72124fed5dd0f6362345fb41" }), h("slot", { key: "9fb0841fed712e21d1e84b187e1bc9159cf80b56", name: "end" })), showCollapsedIndicator && h("button", { key: "4b64544d879224d491447a79da8f8672b994af0b", part: "collapsed-indicator", "aria-label": "Show more breadcrumbs", onClick: () => this.collapsedIndicatorClick(), ref: (collapsedEl) => this.collapsedRef = collapsedEl, class: {
      "breadcrumbs-collapsed-indicator": true
    } }, h("ion-icon", { key: "5a2511b237aa8c401f416e967a831f8315423949", "aria-hidden": "true", icon: ellipsisHorizontal, lazy: false })), showSeparator && /**
     * Separators should not be announced by narrators.
     * We add aria-hidden on the span so that this applies
     * to any custom separators too.
     */
    h("span", { key: "348952855dd79eb92f8d370e5839a8d09aff4097", class: "breadcrumb-separator", part: "separator", "aria-hidden": "true" }, h("slot", { key: "0120f416edb1d776fa6900b5986b2b57eef554b3", name: "separator" }, mode === "ios" ? h("ion-icon", { icon: chevronForwardOutline, lazy: false, "flip-rtl": true }) : h("span", null, "/"))));
  }
  get el() {
    return getElement(this);
  }
};
Breadcrumb.style = {
  ios: IonBreadcrumbIosStyle0,
  md: IonBreadcrumbMdStyle0
};
var breadcrumbsIosCss = ":host{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;display:-ms-flexbox;display:flex;-ms-flex-wrap:wrap;flex-wrap:wrap;-ms-flex-align:center;align-items:center}:host(.in-toolbar-color),:host(.in-toolbar-color) .breadcrumbs-collapsed-indicator ion-icon{color:var(--ion-color-contrast)}:host(.in-toolbar-color) .breadcrumbs-collapsed-indicator{background:rgba(var(--ion-color-contrast-rgb), 0.11)}:host(.in-toolbar){-webkit-padding-start:20px;padding-inline-start:20px;-webkit-padding-end:20px;padding-inline-end:20px;padding-top:0;padding-bottom:0;-ms-flex-pack:center;justify-content:center}";
var IonBreadcrumbsIosStyle0 = breadcrumbsIosCss;
var breadcrumbsMdCss = ":host{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;display:-ms-flexbox;display:flex;-ms-flex-wrap:wrap;flex-wrap:wrap;-ms-flex-align:center;align-items:center}:host(.in-toolbar-color),:host(.in-toolbar-color) .breadcrumbs-collapsed-indicator ion-icon{color:var(--ion-color-contrast)}:host(.in-toolbar-color) .breadcrumbs-collapsed-indicator{background:rgba(var(--ion-color-contrast-rgb), 0.11)}:host(.in-toolbar){-webkit-padding-start:8px;padding-inline-start:8px;-webkit-padding-end:8px;padding-inline-end:8px;padding-top:0;padding-bottom:0}";
var IonBreadcrumbsMdStyle0 = breadcrumbsMdCss;
var Breadcrumbs = class {
  constructor(hostRef) {
    registerInstance(this, hostRef);
    this.ionCollapsedClick = createEvent(this, "ionCollapsedClick", 7);
    this.breadcrumbsInit = () => {
      this.setBreadcrumbSeparator();
      this.setMaxItems();
    };
    this.resetActiveBreadcrumb = () => {
      const breadcrumbs = this.getBreadcrumbs();
      const activeBreadcrumb = breadcrumbs.find((breadcrumb) => breadcrumb.active);
      if (activeBreadcrumb && this.activeChanged) {
        activeBreadcrumb.active = false;
      }
    };
    this.setMaxItems = () => {
      const { itemsAfterCollapse, itemsBeforeCollapse, maxItems } = this;
      const breadcrumbs = this.getBreadcrumbs();
      for (const breadcrumb of breadcrumbs) {
        breadcrumb.showCollapsedIndicator = false;
        breadcrumb.collapsed = false;
      }
      const shouldCollapse = maxItems !== void 0 && breadcrumbs.length > maxItems && itemsBeforeCollapse + itemsAfterCollapse <= maxItems;
      if (shouldCollapse) {
        breadcrumbs.forEach((breadcrumb, index) => {
          if (index === itemsBeforeCollapse) {
            breadcrumb.showCollapsedIndicator = true;
          }
          if (index >= itemsBeforeCollapse && index < breadcrumbs.length - itemsAfterCollapse) {
            breadcrumb.collapsed = true;
          }
        });
      }
    };
    this.setBreadcrumbSeparator = () => {
      const { itemsAfterCollapse, itemsBeforeCollapse, maxItems } = this;
      const breadcrumbs = this.getBreadcrumbs();
      const active = breadcrumbs.find((breadcrumb) => breadcrumb.active);
      for (const breadcrumb of breadcrumbs) {
        const last = maxItems !== void 0 && itemsAfterCollapse === 0 ? breadcrumb === breadcrumbs[itemsBeforeCollapse] : breadcrumb === breadcrumbs[breadcrumbs.length - 1];
        breadcrumb.last = last;
        const separator = breadcrumb.separator !== void 0 ? breadcrumb.separator : last ? void 0 : true;
        breadcrumb.separator = separator;
        if (!active && last) {
          breadcrumb.active = true;
          this.activeChanged = true;
        }
      }
    };
    this.getBreadcrumbs = () => {
      return Array.from(this.el.querySelectorAll("ion-breadcrumb"));
    };
    this.slotChanged = () => {
      this.resetActiveBreadcrumb();
      this.breadcrumbsInit();
    };
    this.collapsed = void 0;
    this.activeChanged = void 0;
    this.color = void 0;
    this.maxItems = void 0;
    this.itemsBeforeCollapse = 1;
    this.itemsAfterCollapse = 1;
  }
  onCollapsedClick(ev) {
    const breadcrumbs = this.getBreadcrumbs();
    const collapsedBreadcrumbs = breadcrumbs.filter((breadcrumb) => breadcrumb.collapsed);
    this.ionCollapsedClick.emit(Object.assign(Object.assign({}, ev.detail), { collapsedBreadcrumbs }));
  }
  maxItemsChanged() {
    this.resetActiveBreadcrumb();
    this.breadcrumbsInit();
  }
  componentWillLoad() {
    this.breadcrumbsInit();
  }
  render() {
    const { color, collapsed } = this;
    const mode = getIonMode(this);
    return h(Host, { key: "cd288d4bf5498f86d086eb999b506993818642f3", class: createColorClasses(color, {
      [mode]: true,
      "in-toolbar": hostContext("ion-toolbar", this.el),
      "in-toolbar-color": hostContext("ion-toolbar[color]", this.el),
      "breadcrumbs-collapsed": collapsed
    }) }, h("slot", { key: "73c802065511dbebef3867b01ce929313d24cba2", onSlotchange: this.slotChanged }));
  }
  get el() {
    return getElement(this);
  }
  static get watchers() {
    return {
      "maxItems": ["maxItemsChanged"],
      "itemsBeforeCollapse": ["maxItemsChanged"],
      "itemsAfterCollapse": ["maxItemsChanged"]
    };
  }
};
Breadcrumbs.style = {
  ios: IonBreadcrumbsIosStyle0,
  md: IonBreadcrumbsMdStyle0
};
export {
  Breadcrumb as ion_breadcrumb,
  Breadcrumbs as ion_breadcrumbs
};
/*! Bundled license information:

@ionic/core/dist/esm/ion-breadcrumb_2.entry.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=ion-breadcrumb_2.entry-WLAOJQ37.js.map
