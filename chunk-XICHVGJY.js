import {
  menuController
} from "./chunk-A2SZYZK4.js";
import {
  getTimeGivenProgression
} from "./chunk-ZNWM5CSD.js";
import {
  setupConfig
} from "./chunk-FBLRPVXF.js";
import {
  createAnimation
} from "./chunk-D6LV3SEQ.js";
import {
  actionSheetController,
  alertController,
  loadingController,
  modalController,
  pickerController,
  popoverController,
  toastController
} from "./chunk-ENFSYKZQ.js";
import {
  createGesture
} from "./chunk-6SMHFLGE.js";
import {
  initialize
} from "./chunk-DHRBUV2X.js";
import {
  bootstrapLazy
} from "./chunk-SII3QBXZ.js";
import {
  __async,
  __spreadProps,
  __spreadValues
} from "./chunk-DSWO3WHD.js";

// node_modules/@ionic/angular/fesm2020/ionic-angular.mjs
import * as i0 from "@angular/core";
import { Directive, HostListener, Component, ChangeDetectionStrategy, Attribute, Optional, SkipSelf, ViewChild, ContentChild, ContentChildren, forwardRef, Injectable, inject, Injector as Injector2, EnvironmentInjector as EnvironmentInjector2, APP_INITIALIZER, NgZone as NgZone2, NgModule } from "@angular/core";
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, MaxValidator, MinValidator } from "@angular/forms";
import * as i2$1 from "@ionic/angular/common";
import { ValueAccessor, setIonicClasses, IonRouterOutlet as IonRouterOutlet$1, IonTabs as IonTabs$1, IonBackButton as IonBackButton$1, IonNav as IonNav$1, RouterLinkDelegateDirective as RouterLinkDelegateDirective$1, RouterLinkWithHrefDelegateDirective as RouterLinkWithHrefDelegateDirective$1, IonModal as IonModal$1, IonPopover as IonPopover$1, OverlayBaseController, MenuController as MenuController$1, AngularDelegate as AngularDelegate2, raf, ConfigToken, provideComponentInputBinding } from "@ionic/angular/common";
import { AngularDelegate as AngularDelegate3, Config as Config2, DomController, IonicRouteStrategy, NavController as NavController2, NavParams, Platform } from "@ionic/angular/common";

// node_modules/tslib/tslib.es6.mjs
function __decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}

// node_modules/@ionic/angular/fesm2020/ionic-angular.mjs
import { fromEvent } from "rxjs";
import * as i1 from "@angular/common";
import { DOCUMENT, CommonModule } from "@angular/common";
import * as i2 from "@angular/router";

// node_modules/@ionic/core/dist/esm/polyfills/index.js
function applyPolyfills() {
  var promises = [];
  if (typeof window !== "undefined") {
    var win = window;
    if (!win.customElements || win.Element && (!win.Element.prototype.closest || !win.Element.prototype.matches || !win.Element.prototype.remove || !win.Element.prototype.getRootNode)) {
      promises.push(import(
        /* webpackChunkName: "polyfills-dom" */
        "./dom-FJRTVDTP.js"
      ));
    }
    var checkIfURLIsSupported = function() {
      try {
        var u = new URL("b", "http://a");
        u.pathname = "c%20d";
        return u.href === "http://a/c%20d" && u.searchParams;
      } catch (e) {
        return false;
      }
    };
    if ("function" !== typeof Object.assign || !Object.entries || !Array.prototype.find || !Array.prototype.includes || !String.prototype.startsWith || !String.prototype.endsWith || win.NodeList && !win.NodeList.prototype.forEach || !win.fetch || !checkIfURLIsSupported() || typeof WeakMap == "undefined") {
      promises.push(import(
        /* webpackChunkName: "polyfills-core-js" */
        "./core-js-FCZCLJ26.js"
      ));
    }
  }
  return Promise.all(promises);
}

// node_modules/@ionic/core/dist/esm/app-globals-318eef52.js
var globalScripts = initialize;

// node_modules/@ionic/core/dist/esm/loader.js
var defineCustomElements = (win, options) => __async(void 0, null, function* () {
  if (typeof window === "undefined")
    return void 0;
  yield globalScripts();
  return bootstrapLazy(JSON.parse('[["ion-menu_3",[[33,"ion-menu-button",{"color":[513],"disabled":[4],"menu":[1],"autoHide":[4,"auto-hide"],"type":[1],"visible":[32]},[[16,"ionMenuChange","visibilityChanged"],[16,"ionSplitPaneVisible","visibilityChanged"]]],[33,"ion-menu",{"contentId":[513,"content-id"],"menuId":[513,"menu-id"],"type":[1025],"disabled":[1028],"side":[513],"swipeGesture":[4,"swipe-gesture"],"maxEdgeStart":[2,"max-edge-start"],"isPaneVisible":[32],"isEndSide":[32],"isOpen":[64],"isActive":[64],"open":[64],"close":[64],"toggle":[64],"setOpen":[64]},[[16,"ionSplitPaneVisible","onSplitPaneChanged"],[2,"click","onBackdropClick"]],{"type":["typeChanged"],"disabled":["disabledChanged"],"side":["sideChanged"],"swipeGesture":["swipeGestureChanged"]}],[1,"ion-menu-toggle",{"menu":[1],"autoHide":[4,"auto-hide"],"visible":[32]},[[16,"ionMenuChange","visibilityChanged"],[16,"ionSplitPaneVisible","visibilityChanged"]]]]],["ion-fab_3",[[33,"ion-fab-button",{"color":[513],"activated":[4],"disabled":[4],"download":[1],"href":[1],"rel":[1],"routerDirection":[1,"router-direction"],"routerAnimation":[16],"target":[1],"show":[4],"translucent":[4],"type":[1],"size":[1],"closeIcon":[1,"close-icon"]}],[1,"ion-fab",{"horizontal":[1],"vertical":[1],"edge":[4],"activated":[1028],"close":[64],"toggle":[64]},null,{"activated":["activatedChanged"]}],[1,"ion-fab-list",{"activated":[4],"side":[1]},null,{"activated":["activatedChanged"]}]]],["ion-refresher_2",[[0,"ion-refresher-content",{"pullingIcon":[1025,"pulling-icon"],"pullingText":[1,"pulling-text"],"refreshingSpinner":[1025,"refreshing-spinner"],"refreshingText":[1,"refreshing-text"]}],[32,"ion-refresher",{"pullMin":[2,"pull-min"],"pullMax":[2,"pull-max"],"closeDuration":[1,"close-duration"],"snapbackDuration":[1,"snapback-duration"],"pullFactor":[2,"pull-factor"],"disabled":[4],"nativeRefresher":[32],"state":[32],"complete":[64],"cancel":[64],"getProgress":[64]},null,{"disabled":["disabledChanged"]}]]],["ion-back-button",[[33,"ion-back-button",{"color":[513],"defaultHref":[1025,"default-href"],"disabled":[516],"icon":[1],"text":[1],"type":[1],"routerAnimation":[16]}]]],["ion-toast",[[33,"ion-toast",{"overlayIndex":[2,"overlay-index"],"delegate":[16],"hasController":[4,"has-controller"],"color":[513],"enterAnimation":[16],"leaveAnimation":[16],"cssClass":[1,"css-class"],"duration":[2],"header":[1],"layout":[1],"message":[1],"keyboardClose":[4,"keyboard-close"],"position":[1],"positionAnchor":[1,"position-anchor"],"buttons":[16],"translucent":[4],"animated":[4],"icon":[1],"htmlAttributes":[16],"swipeGesture":[1,"swipe-gesture"],"isOpen":[4,"is-open"],"trigger":[1],"revealContentToScreenReader":[32],"present":[64],"dismiss":[64],"onDidDismiss":[64],"onWillDismiss":[64]},null,{"swipeGesture":["swipeGestureChanged"],"isOpen":["onIsOpenChange"],"trigger":["triggerChanged"]}]]],["ion-card_5",[[33,"ion-card",{"color":[513],"button":[4],"type":[1],"disabled":[4],"download":[1],"href":[1],"rel":[1],"routerDirection":[1,"router-direction"],"routerAnimation":[16],"target":[1]}],[32,"ion-card-content"],[33,"ion-card-header",{"color":[513],"translucent":[4]}],[33,"ion-card-subtitle",{"color":[513]}],[33,"ion-card-title",{"color":[513]}]]],["ion-item-option_3",[[33,"ion-item-option",{"color":[513],"disabled":[4],"download":[1],"expandable":[4],"href":[1],"rel":[1],"target":[1],"type":[1]}],[32,"ion-item-options",{"side":[1],"fireSwipeEvent":[64]}],[0,"ion-item-sliding",{"disabled":[4],"state":[32],"getOpenAmount":[64],"getSlidingRatio":[64],"open":[64],"close":[64],"closeOpened":[64]},null,{"disabled":["disabledChanged"]}]]],["ion-accordion_2",[[49,"ion-accordion",{"value":[1],"disabled":[4],"readonly":[4],"toggleIcon":[1,"toggle-icon"],"toggleIconSlot":[1,"toggle-icon-slot"],"state":[32],"isNext":[32],"isPrevious":[32]},null,{"value":["valueChanged"]}],[33,"ion-accordion-group",{"animated":[4],"multiple":[4],"value":[1025],"disabled":[4],"readonly":[4],"expand":[1],"requestAccordionToggle":[64],"getAccordions":[64]},[[0,"keydown","onKeydown"]],{"value":["valueChanged"],"disabled":["disabledChanged"],"readonly":["readonlyChanged"]}]]],["ion-infinite-scroll_2",[[32,"ion-infinite-scroll-content",{"loadingSpinner":[1025,"loading-spinner"],"loadingText":[1,"loading-text"]}],[0,"ion-infinite-scroll",{"threshold":[1],"disabled":[4],"position":[1],"isLoading":[32],"complete":[64]},null,{"threshold":["thresholdChanged"],"disabled":["disabledChanged"]}]]],["ion-reorder_2",[[33,"ion-reorder",null,[[2,"click","onClick"]]],[0,"ion-reorder-group",{"disabled":[4],"state":[32],"complete":[64]},null,{"disabled":["disabledChanged"]}]]],["ion-segment_2",[[33,"ion-segment-button",{"disabled":[1028],"layout":[1],"type":[1],"value":[8],"checked":[32],"setFocus":[64]},null,{"value":["valueChanged"]}],[33,"ion-segment",{"color":[513],"disabled":[4],"scrollable":[4],"swipeGesture":[4,"swipe-gesture"],"value":[1032],"selectOnFocus":[4,"select-on-focus"],"activated":[32]},[[0,"keydown","onKeyDown"]],{"color":["colorChanged"],"swipeGesture":["swipeGestureChanged"],"value":["valueChanged"],"disabled":["disabledChanged"]}]]],["ion-tab-bar_2",[[33,"ion-tab-button",{"disabled":[4],"download":[1],"href":[1],"rel":[1],"layout":[1025],"selected":[1028],"tab":[1],"target":[1]},[[8,"ionTabBarChanged","onTabBarChanged"]]],[33,"ion-tab-bar",{"color":[513],"selectedTab":[1,"selected-tab"],"translucent":[4],"keyboardVisible":[32]},null,{"selectedTab":["selectedTabChanged"]}]]],["ion-chip",[[33,"ion-chip",{"color":[513],"outline":[4],"disabled":[4]}]]],["ion-datetime-button",[[33,"ion-datetime-button",{"color":[513],"disabled":[516],"datetime":[1],"datetimePresentation":[32],"dateText":[32],"timeText":[32],"datetimeActive":[32],"selectedButton":[32]}]]],["ion-input",[[38,"ion-input",{"color":[513],"accept":[1],"autocapitalize":[1],"autocomplete":[1],"autocorrect":[1],"autofocus":[4],"clearInput":[4,"clear-input"],"clearOnEdit":[4,"clear-on-edit"],"counter":[4],"counterFormatter":[16],"debounce":[2],"disabled":[4],"enterkeyhint":[1],"errorText":[1,"error-text"],"fill":[1],"inputmode":[1],"helperText":[1,"helper-text"],"label":[1],"labelPlacement":[1,"label-placement"],"legacy":[4],"max":[8],"maxlength":[2],"min":[8],"minlength":[2],"multiple":[4],"name":[1],"pattern":[1],"placeholder":[1],"readonly":[4],"required":[4],"shape":[1],"spellcheck":[4],"step":[1],"size":[2],"type":[1],"value":[1032],"hasFocus":[32],"setFocus":[64],"getInputElement":[64]},null,{"debounce":["debounceChanged"],"disabled":["disabledChanged"],"placeholder":["placeholderChanged"],"value":["valueChanged"]}]]],["ion-searchbar",[[34,"ion-searchbar",{"color":[513],"animated":[4],"autocapitalize":[1],"autocomplete":[1],"autocorrect":[1],"cancelButtonIcon":[1,"cancel-button-icon"],"cancelButtonText":[1,"cancel-button-text"],"clearIcon":[1,"clear-icon"],"debounce":[2],"disabled":[4],"inputmode":[1],"enterkeyhint":[1],"maxlength":[2],"minlength":[2],"name":[1],"placeholder":[1],"searchIcon":[1,"search-icon"],"showCancelButton":[1,"show-cancel-button"],"showClearButton":[1,"show-clear-button"],"spellcheck":[4],"type":[1],"value":[1025],"focused":[32],"noAnimate":[32],"setFocus":[64],"getInputElement":[64]},null,{"lang":["onLangChanged"],"dir":["onDirChanged"],"debounce":["debounceChanged"],"value":["valueChanged"],"showCancelButton":["showCancelButtonChanged"]}]]],["ion-toggle",[[33,"ion-toggle",{"color":[513],"name":[1],"checked":[1028],"disabled":[4],"value":[1],"enableOnOffLabels":[4,"enable-on-off-labels"],"labelPlacement":[1,"label-placement"],"legacy":[4],"justify":[1],"alignment":[1],"activated":[32]},null,{"disabled":["disabledChanged"]}]]],["ion-nav_2",[[1,"ion-nav",{"delegate":[16],"swipeGesture":[1028,"swipe-gesture"],"animated":[4],"animation":[16],"rootParams":[16],"root":[1],"push":[64],"insert":[64],"insertPages":[64],"pop":[64],"popTo":[64],"popToRoot":[64],"removeIndex":[64],"setRoot":[64],"setPages":[64],"setRouteId":[64],"getRouteId":[64],"getActive":[64],"getByIndex":[64],"canGoBack":[64],"getPrevious":[64]},null,{"swipeGesture":["swipeGestureChanged"],"root":["rootChanged"]}],[0,"ion-nav-link",{"component":[1],"componentProps":[16],"routerDirection":[1,"router-direction"],"routerAnimation":[16]}]]],["ion-textarea",[[38,"ion-textarea",{"color":[513],"autocapitalize":[1],"autofocus":[4],"clearOnEdit":[4,"clear-on-edit"],"debounce":[2],"disabled":[4],"fill":[1],"inputmode":[1],"enterkeyhint":[1],"maxlength":[2],"minlength":[2],"name":[1],"placeholder":[1],"readonly":[4],"required":[4],"spellcheck":[4],"cols":[514],"rows":[2],"wrap":[1],"autoGrow":[516,"auto-grow"],"value":[1025],"counter":[4],"counterFormatter":[16],"errorText":[1,"error-text"],"helperText":[1,"helper-text"],"label":[1],"labelPlacement":[1,"label-placement"],"legacy":[4],"shape":[1],"hasFocus":[32],"setFocus":[64],"getInputElement":[64]},null,{"debounce":["debounceChanged"],"disabled":["disabledChanged"],"value":["valueChanged"]}]]],["ion-backdrop",[[33,"ion-backdrop",{"visible":[4],"tappable":[4],"stopPropagation":[4,"stop-propagation"]},[[2,"click","onMouseDown"]]]]],["ion-loading",[[34,"ion-loading",{"overlayIndex":[2,"overlay-index"],"delegate":[16],"hasController":[4,"has-controller"],"keyboardClose":[4,"keyboard-close"],"enterAnimation":[16],"leaveAnimation":[16],"message":[1],"cssClass":[1,"css-class"],"duration":[2],"backdropDismiss":[4,"backdrop-dismiss"],"showBackdrop":[4,"show-backdrop"],"spinner":[1025],"translucent":[4],"animated":[4],"htmlAttributes":[16],"isOpen":[4,"is-open"],"trigger":[1],"present":[64],"dismiss":[64],"onDidDismiss":[64],"onWillDismiss":[64]},null,{"isOpen":["onIsOpenChange"],"trigger":["triggerChanged"]}]]],["ion-breadcrumb_2",[[33,"ion-breadcrumb",{"collapsed":[4],"last":[4],"showCollapsedIndicator":[4,"show-collapsed-indicator"],"color":[1],"active":[4],"disabled":[4],"download":[1],"href":[1],"rel":[1],"separator":[4],"target":[1],"routerDirection":[1,"router-direction"],"routerAnimation":[16]}],[33,"ion-breadcrumbs",{"color":[513],"maxItems":[2,"max-items"],"itemsBeforeCollapse":[2,"items-before-collapse"],"itemsAfterCollapse":[2,"items-after-collapse"],"collapsed":[32],"activeChanged":[32]},[[0,"collapsedClick","onCollapsedClick"]],{"maxItems":["maxItemsChanged"],"itemsBeforeCollapse":["maxItemsChanged"],"itemsAfterCollapse":["maxItemsChanged"]}]]],["ion-modal",[[33,"ion-modal",{"hasController":[4,"has-controller"],"overlayIndex":[2,"overlay-index"],"delegate":[16],"keyboardClose":[4,"keyboard-close"],"enterAnimation":[16],"leaveAnimation":[16],"breakpoints":[16],"initialBreakpoint":[2,"initial-breakpoint"],"backdropBreakpoint":[2,"backdrop-breakpoint"],"handle":[4],"handleBehavior":[1,"handle-behavior"],"component":[1],"componentProps":[16],"cssClass":[1,"css-class"],"backdropDismiss":[4,"backdrop-dismiss"],"showBackdrop":[4,"show-backdrop"],"animated":[4],"presentingElement":[16],"htmlAttributes":[16],"isOpen":[4,"is-open"],"trigger":[1],"keepContentsMounted":[4,"keep-contents-mounted"],"canDismiss":[4,"can-dismiss"],"presented":[32],"present":[64],"dismiss":[64],"onDidDismiss":[64],"onWillDismiss":[64],"setCurrentBreakpoint":[64],"getCurrentBreakpoint":[64]},null,{"isOpen":["onIsOpenChange"],"trigger":["triggerChanged"]}]]],["ion-route_4",[[0,"ion-route",{"url":[1],"component":[1],"componentProps":[16],"beforeLeave":[16],"beforeEnter":[16]},null,{"url":["onUpdate"],"component":["onUpdate"],"componentProps":["onComponentProps"]}],[0,"ion-route-redirect",{"from":[1],"to":[1]},null,{"from":["propDidChange"],"to":["propDidChange"]}],[0,"ion-router",{"root":[1],"useHash":[4,"use-hash"],"canTransition":[64],"push":[64],"back":[64],"printDebug":[64],"navChanged":[64]},[[8,"popstate","onPopState"],[4,"ionBackButton","onBackButton"]]],[1,"ion-router-link",{"color":[513],"href":[1],"rel":[1],"routerDirection":[1,"router-direction"],"routerAnimation":[16],"target":[1]}]]],["ion-avatar_3",[[33,"ion-avatar"],[33,"ion-badge",{"color":[513]}],[1,"ion-thumbnail"]]],["ion-col_3",[[1,"ion-col",{"offset":[1],"offsetXs":[1,"offset-xs"],"offsetSm":[1,"offset-sm"],"offsetMd":[1,"offset-md"],"offsetLg":[1,"offset-lg"],"offsetXl":[1,"offset-xl"],"pull":[1],"pullXs":[1,"pull-xs"],"pullSm":[1,"pull-sm"],"pullMd":[1,"pull-md"],"pullLg":[1,"pull-lg"],"pullXl":[1,"pull-xl"],"push":[1],"pushXs":[1,"push-xs"],"pushSm":[1,"push-sm"],"pushMd":[1,"push-md"],"pushLg":[1,"push-lg"],"pushXl":[1,"push-xl"],"size":[1],"sizeXs":[1,"size-xs"],"sizeSm":[1,"size-sm"],"sizeMd":[1,"size-md"],"sizeLg":[1,"size-lg"],"sizeXl":[1,"size-xl"]},[[9,"resize","onResize"]]],[1,"ion-grid",{"fixed":[4]}],[1,"ion-row"]]],["ion-tab_2",[[1,"ion-tab",{"active":[1028],"delegate":[16],"tab":[1],"component":[1],"setActive":[64]},null,{"active":["changeActive"]}],[1,"ion-tabs",{"useRouter":[1028,"use-router"],"selectedTab":[32],"select":[64],"getTab":[64],"getSelected":[64],"setRouteId":[64],"getRouteId":[64]}]]],["ion-img",[[1,"ion-img",{"alt":[1],"src":[1],"loadSrc":[32],"loadError":[32]},null,{"src":["srcChanged"]}]]],["ion-progress-bar",[[33,"ion-progress-bar",{"type":[1],"reversed":[4],"value":[2],"buffer":[2],"color":[513]}]]],["ion-range",[[33,"ion-range",{"color":[513],"debounce":[2],"name":[1],"label":[1],"dualKnobs":[4,"dual-knobs"],"min":[2],"max":[2],"pin":[4],"pinFormatter":[16],"snaps":[4],"step":[2],"ticks":[4],"activeBarStart":[1026,"active-bar-start"],"disabled":[4],"value":[1026],"labelPlacement":[1,"label-placement"],"legacy":[4],"ratioA":[32],"ratioB":[32],"pressedKnob":[32]},null,{"debounce":["debounceChanged"],"min":["minChanged"],"max":["maxChanged"],"activeBarStart":["activeBarStartChanged"],"disabled":["disabledChanged"],"value":["valueChanged"]}]]],["ion-split-pane",[[33,"ion-split-pane",{"contentId":[513,"content-id"],"disabled":[4],"when":[8],"visible":[32]},null,{"visible":["visibleChanged"],"disabled":["updateState"],"when":["updateState"]}]]],["ion-text",[[1,"ion-text",{"color":[513]}]]],["ion-item_8",[[33,"ion-item-divider",{"color":[513],"sticky":[4]}],[32,"ion-item-group"],[1,"ion-skeleton-text",{"animated":[4]}],[32,"ion-list",{"lines":[1],"inset":[4],"closeSlidingItems":[64]}],[33,"ion-list-header",{"color":[513],"lines":[1]}],[49,"ion-item",{"color":[513],"button":[4],"detail":[4],"detailIcon":[1,"detail-icon"],"disabled":[4],"download":[1],"fill":[1],"shape":[1],"href":[1],"rel":[1],"lines":[1],"counter":[4],"routerAnimation":[16],"routerDirection":[1,"router-direction"],"target":[1],"type":[1],"counterFormatter":[16],"multipleInputs":[32],"focusable":[32],"counterString":[32]},[[0,"ionInput","handleIonInput"],[0,"ionColor","labelColorChanged"],[0,"ionStyle","itemStyle"]],{"button":["buttonChanged"],"counterFormatter":["counterFormatterChanged"]}],[34,"ion-label",{"color":[513],"position":[1],"noAnimate":[32]},null,{"color":["colorChanged"],"position":["positionChanged"]}],[33,"ion-note",{"color":[513]}]]],["ion-select_3",[[33,"ion-select",{"cancelText":[1,"cancel-text"],"color":[513],"compareWith":[1,"compare-with"],"disabled":[4],"fill":[1],"interface":[1],"interfaceOptions":[8,"interface-options"],"justify":[1],"label":[1],"labelPlacement":[1,"label-placement"],"legacy":[4],"multiple":[4],"name":[1],"okText":[1,"ok-text"],"placeholder":[1],"selectedText":[1,"selected-text"],"toggleIcon":[1,"toggle-icon"],"expandedIcon":[1,"expanded-icon"],"shape":[1],"value":[1032],"isExpanded":[32],"open":[64]},null,{"disabled":["styleChanged"],"isExpanded":["styleChanged"],"placeholder":["styleChanged"],"value":["styleChanged"]}],[1,"ion-select-option",{"disabled":[4],"value":[8]}],[34,"ion-select-popover",{"header":[1],"subHeader":[1,"sub-header"],"message":[1],"multiple":[4],"options":[16]}]]],["ion-picker-internal",[[33,"ion-picker-internal",{"exitInputMode":[64]},[[1,"touchstart","preventTouchStartPropagation"]]]]],["ion-datetime_3",[[33,"ion-datetime",{"color":[1],"name":[1],"disabled":[4],"formatOptions":[16],"readonly":[4],"isDateEnabled":[16],"min":[1025],"max":[1025],"presentation":[1],"cancelText":[1,"cancel-text"],"doneText":[1,"done-text"],"clearText":[1,"clear-text"],"yearValues":[8,"year-values"],"monthValues":[8,"month-values"],"dayValues":[8,"day-values"],"hourValues":[8,"hour-values"],"minuteValues":[8,"minute-values"],"locale":[1],"firstDayOfWeek":[2,"first-day-of-week"],"titleSelectedDatesFormatter":[16],"multiple":[4],"highlightedDates":[16],"value":[1025],"showDefaultTitle":[4,"show-default-title"],"showDefaultButtons":[4,"show-default-buttons"],"showClearButton":[4,"show-clear-button"],"showDefaultTimeLabel":[4,"show-default-time-label"],"hourCycle":[1,"hour-cycle"],"size":[1],"preferWheel":[4,"prefer-wheel"],"showMonthAndYear":[32],"activeParts":[32],"workingParts":[32],"isTimePopoverOpen":[32],"forceRenderDate":[32],"confirm":[64],"reset":[64],"cancel":[64]},null,{"formatOptions":["formatOptionsChanged"],"disabled":["disabledChanged"],"min":["minChanged"],"max":["maxChanged"],"presentation":["presentationChanged"],"yearValues":["yearValuesChanged"],"monthValues":["monthValuesChanged"],"dayValues":["dayValuesChanged"],"hourValues":["hourValuesChanged"],"minuteValues":["minuteValuesChanged"],"value":["valueChanged"]}],[34,"ion-picker",{"overlayIndex":[2,"overlay-index"],"delegate":[16],"hasController":[4,"has-controller"],"keyboardClose":[4,"keyboard-close"],"enterAnimation":[16],"leaveAnimation":[16],"buttons":[16],"columns":[16],"cssClass":[1,"css-class"],"duration":[2],"showBackdrop":[4,"show-backdrop"],"backdropDismiss":[4,"backdrop-dismiss"],"animated":[4],"htmlAttributes":[16],"isOpen":[4,"is-open"],"trigger":[1],"presented":[32],"present":[64],"dismiss":[64],"onDidDismiss":[64],"onWillDismiss":[64],"getColumn":[64]},null,{"isOpen":["onIsOpenChange"],"trigger":["triggerChanged"]}],[32,"ion-picker-column",{"col":[16]},null,{"col":["colChanged"]}]]],["ion-radio_2",[[33,"ion-radio",{"color":[513],"name":[1],"disabled":[4],"value":[8],"labelPlacement":[1,"label-placement"],"legacy":[4],"justify":[1],"alignment":[1],"checked":[32],"buttonTabindex":[32],"setFocus":[64],"setButtonTabindex":[64]},null,{"value":["valueChanged"],"checked":["styleChanged"],"color":["styleChanged"],"disabled":["styleChanged"]}],[0,"ion-radio-group",{"allowEmptySelection":[4,"allow-empty-selection"],"compareWith":[1,"compare-with"],"name":[1],"value":[1032]},[[4,"keydown","onKeydown"]],{"value":["valueChanged"]}]]],["ion-ripple-effect",[[1,"ion-ripple-effect",{"type":[1],"addRipple":[64]}]]],["ion-button_2",[[33,"ion-button",{"color":[513],"buttonType":[1025,"button-type"],"disabled":[516],"expand":[513],"fill":[1537],"routerDirection":[1,"router-direction"],"routerAnimation":[16],"download":[1],"href":[1],"rel":[1],"shape":[513],"size":[513],"strong":[4],"target":[1],"type":[1],"form":[1]},null,{"disabled":["disabledChanged"]}],[1,"ion-icon",{"mode":[1025],"color":[1],"ios":[1],"md":[1],"flipRtl":[4,"flip-rtl"],"name":[513],"src":[1],"icon":[8],"size":[1],"lazy":[4],"sanitize":[4],"svgContent":[32],"isVisible":[32]},null,{"name":["loadIcon"],"src":["loadIcon"],"icon":["loadIcon"],"ios":["loadIcon"],"md":["loadIcon"]}]]],["ion-action-sheet",[[34,"ion-action-sheet",{"overlayIndex":[2,"overlay-index"],"delegate":[16],"hasController":[4,"has-controller"],"keyboardClose":[4,"keyboard-close"],"enterAnimation":[16],"leaveAnimation":[16],"buttons":[16],"cssClass":[1,"css-class"],"backdropDismiss":[4,"backdrop-dismiss"],"header":[1],"subHeader":[1,"sub-header"],"translucent":[4],"animated":[4],"htmlAttributes":[16],"isOpen":[4,"is-open"],"trigger":[1],"present":[64],"dismiss":[64],"onDidDismiss":[64],"onWillDismiss":[64]},null,{"isOpen":["onIsOpenChange"],"trigger":["triggerChanged"]}]]],["ion-alert",[[34,"ion-alert",{"overlayIndex":[2,"overlay-index"],"delegate":[16],"hasController":[4,"has-controller"],"keyboardClose":[4,"keyboard-close"],"enterAnimation":[16],"leaveAnimation":[16],"cssClass":[1,"css-class"],"header":[1],"subHeader":[1,"sub-header"],"message":[1],"buttons":[16],"inputs":[1040],"backdropDismiss":[4,"backdrop-dismiss"],"translucent":[4],"animated":[4],"htmlAttributes":[16],"isOpen":[4,"is-open"],"trigger":[1],"present":[64],"dismiss":[64],"onDidDismiss":[64],"onWillDismiss":[64]},[[4,"keydown","onKeydown"]],{"isOpen":["onIsOpenChange"],"trigger":["triggerChanged"],"buttons":["buttonsChanged"],"inputs":["inputsChanged"]}]]],["ion-app_8",[[0,"ion-app",{"setFocus":[64]}],[1,"ion-content",{"color":[513],"fullscreen":[4],"forceOverscroll":[1028,"force-overscroll"],"scrollX":[4,"scroll-x"],"scrollY":[4,"scroll-y"],"scrollEvents":[4,"scroll-events"],"getScrollElement":[64],"getBackgroundElement":[64],"scrollToTop":[64],"scrollToBottom":[64],"scrollByPoint":[64],"scrollToPoint":[64]},[[9,"resize","onResize"]]],[36,"ion-footer",{"collapse":[1],"translucent":[4],"keyboardVisible":[32]}],[36,"ion-header",{"collapse":[1],"translucent":[4]}],[1,"ion-router-outlet",{"mode":[1025],"delegate":[16],"animated":[4],"animation":[16],"swipeHandler":[16],"commit":[64],"setRouteId":[64],"getRouteId":[64]},null,{"swipeHandler":["swipeHandlerChanged"]}],[33,"ion-title",{"color":[513],"size":[1]},null,{"size":["sizeChanged"]}],[33,"ion-toolbar",{"color":[513]},[[0,"ionStyle","childrenStyle"]]],[34,"ion-buttons",{"collapse":[4]}]]],["ion-picker-column-internal",[[33,"ion-picker-column-internal",{"disabled":[4],"items":[16],"value":[1032],"color":[513],"numericInput":[4,"numeric-input"],"isActive":[32],"scrollActiveItemIntoView":[64],"setValue":[64]},null,{"value":["valueChange"]}]]],["ion-popover",[[33,"ion-popover",{"hasController":[4,"has-controller"],"delegate":[16],"overlayIndex":[2,"overlay-index"],"enterAnimation":[16],"leaveAnimation":[16],"component":[1],"componentProps":[16],"keyboardClose":[4,"keyboard-close"],"cssClass":[1,"css-class"],"backdropDismiss":[4,"backdrop-dismiss"],"event":[8],"showBackdrop":[4,"show-backdrop"],"translucent":[4],"animated":[4],"htmlAttributes":[16],"triggerAction":[1,"trigger-action"],"trigger":[1],"size":[1],"dismissOnSelect":[4,"dismiss-on-select"],"reference":[1],"side":[1],"alignment":[1025],"arrow":[4],"isOpen":[4,"is-open"],"keyboardEvents":[4,"keyboard-events"],"keepContentsMounted":[4,"keep-contents-mounted"],"presented":[32],"presentFromTrigger":[64],"present":[64],"dismiss":[64],"getParentPopover":[64],"onDidDismiss":[64],"onWillDismiss":[64]},null,{"trigger":["onTriggerChange"],"triggerAction":["onTriggerChange"],"isOpen":["onIsOpenChange"]}]]],["ion-checkbox",[[33,"ion-checkbox",{"color":[513],"name":[1],"checked":[1028],"indeterminate":[1028],"disabled":[4],"value":[8],"labelPlacement":[1,"label-placement"],"justify":[1],"alignment":[1],"legacy":[4]},null,{"checked":["styleChanged"],"disabled":["styleChanged"]}]]],["ion-spinner",[[1,"ion-spinner",{"color":[513],"duration":[2],"name":[1],"paused":[4]}]]]]'), options);
});

// node_modules/@ionic/angular/fesm2020/ionic-angular.mjs
var _c0 = ["*"];
var _c1 = ["outlet"];
var _c2 = [[["", "slot", "top"]], "*"];
var _c3 = ["[slot=top]", "*"];
function IonModal_div_0_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "div", 1);
    i0.\u0275\u0275elementContainer(1, 2);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275property("ngTemplateOutlet", ctx_r0.template);
  }
}
function IonPopover_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementContainer(0, 1);
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275property("ngTemplateOutlet", ctx_r0.template);
  }
}
var BooleanValueAccessorDirective = class extends ValueAccessor {
  constructor(injector, el) {
    super(injector, el);
  }
  writeValue(value) {
    this.elementRef.nativeElement.checked = this.lastValue = value;
    setIonicClasses(this.elementRef);
  }
  _handleIonChange(el) {
    this.handleValueChange(el, el.checked);
  }
};
BooleanValueAccessorDirective.\u0275fac = function BooleanValueAccessorDirective_Factory(t) {
  return new (t || BooleanValueAccessorDirective)(i0.\u0275\u0275directiveInject(i0.Injector), i0.\u0275\u0275directiveInject(i0.ElementRef));
};
BooleanValueAccessorDirective.\u0275dir = /* @__PURE__ */ i0.\u0275\u0275defineDirective({
  type: BooleanValueAccessorDirective,
  selectors: [["ion-checkbox"], ["ion-toggle"]],
  hostBindings: function BooleanValueAccessorDirective_HostBindings(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275listener("ionChange", function BooleanValueAccessorDirective_ionChange_HostBindingHandler($event) {
        return ctx._handleIonChange($event.target);
      });
    }
  },
  features: [i0.\u0275\u0275ProvidersFeature([{
    provide: NG_VALUE_ACCESSOR,
    useExisting: BooleanValueAccessorDirective,
    multi: true
  }]), i0.\u0275\u0275InheritDefinitionFeature]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(BooleanValueAccessorDirective, [{
    type: Directive,
    args: [{
      selector: "ion-checkbox,ion-toggle",
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: BooleanValueAccessorDirective,
        multi: true
      }]
    }]
  }], function() {
    return [{
      type: i0.Injector
    }, {
      type: i0.ElementRef
    }];
  }, {
    _handleIonChange: [{
      type: HostListener,
      args: ["ionChange", ["$event.target"]]
    }]
  });
})();
var NumericValueAccessorDirective = class extends ValueAccessor {
  constructor(injector, el) {
    super(injector, el);
  }
  handleInputEvent(el) {
    this.handleValueChange(el, el.value);
  }
  registerOnChange(fn) {
    super.registerOnChange((value) => {
      fn(value === "" ? null : parseFloat(value));
    });
  }
};
NumericValueAccessorDirective.\u0275fac = function NumericValueAccessorDirective_Factory(t) {
  return new (t || NumericValueAccessorDirective)(i0.\u0275\u0275directiveInject(i0.Injector), i0.\u0275\u0275directiveInject(i0.ElementRef));
};
NumericValueAccessorDirective.\u0275dir = /* @__PURE__ */ i0.\u0275\u0275defineDirective({
  type: NumericValueAccessorDirective,
  selectors: [["ion-input", "type", "number"]],
  hostBindings: function NumericValueAccessorDirective_HostBindings(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275listener("ionInput", function NumericValueAccessorDirective_ionInput_HostBindingHandler($event) {
        return ctx.handleInputEvent($event.target);
      });
    }
  },
  features: [i0.\u0275\u0275ProvidersFeature([{
    provide: NG_VALUE_ACCESSOR,
    useExisting: NumericValueAccessorDirective,
    multi: true
  }]), i0.\u0275\u0275InheritDefinitionFeature]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(NumericValueAccessorDirective, [{
    type: Directive,
    args: [{
      selector: "ion-input[type=number]",
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: NumericValueAccessorDirective,
        multi: true
      }]
    }]
  }], function() {
    return [{
      type: i0.Injector
    }, {
      type: i0.ElementRef
    }];
  }, {
    handleInputEvent: [{
      type: HostListener,
      args: ["ionInput", ["$event.target"]]
    }]
  });
})();
var RadioValueAccessorDirective = class extends ValueAccessor {
  constructor(injector, el) {
    super(injector, el);
  }
  _handleIonSelect(el) {
    this.handleValueChange(el, el.checked);
  }
};
RadioValueAccessorDirective.\u0275fac = function RadioValueAccessorDirective_Factory(t) {
  return new (t || RadioValueAccessorDirective)(i0.\u0275\u0275directiveInject(i0.Injector), i0.\u0275\u0275directiveInject(i0.ElementRef));
};
RadioValueAccessorDirective.\u0275dir = /* @__PURE__ */ i0.\u0275\u0275defineDirective({
  type: RadioValueAccessorDirective,
  selectors: [["ion-radio"]],
  hostBindings: function RadioValueAccessorDirective_HostBindings(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275listener("ionSelect", function RadioValueAccessorDirective_ionSelect_HostBindingHandler($event) {
        return ctx._handleIonSelect($event.target);
      });
    }
  },
  features: [i0.\u0275\u0275ProvidersFeature([{
    provide: NG_VALUE_ACCESSOR,
    useExisting: RadioValueAccessorDirective,
    multi: true
  }]), i0.\u0275\u0275InheritDefinitionFeature]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(RadioValueAccessorDirective, [{
    type: Directive,
    args: [{
      /* tslint:disable-next-line:directive-selector */
      selector: "ion-radio",
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: RadioValueAccessorDirective,
        multi: true
      }]
    }]
  }], function() {
    return [{
      type: i0.Injector
    }, {
      type: i0.ElementRef
    }];
  }, {
    _handleIonSelect: [{
      type: HostListener,
      args: ["ionSelect", ["$event.target"]]
    }]
  });
})();
var SelectValueAccessorDirective = class extends ValueAccessor {
  constructor(injector, el) {
    super(injector, el);
  }
  _handleChangeEvent(el) {
    this.handleValueChange(el, el.value);
  }
};
SelectValueAccessorDirective.\u0275fac = function SelectValueAccessorDirective_Factory(t) {
  return new (t || SelectValueAccessorDirective)(i0.\u0275\u0275directiveInject(i0.Injector), i0.\u0275\u0275directiveInject(i0.ElementRef));
};
SelectValueAccessorDirective.\u0275dir = /* @__PURE__ */ i0.\u0275\u0275defineDirective({
  type: SelectValueAccessorDirective,
  selectors: [["ion-select"], ["ion-radio-group"], ["ion-segment"], ["ion-datetime"]],
  hostBindings: function SelectValueAccessorDirective_HostBindings(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275listener("ionChange", function SelectValueAccessorDirective_ionChange_HostBindingHandler($event) {
        return ctx._handleChangeEvent($event.target);
      });
    }
  },
  features: [i0.\u0275\u0275ProvidersFeature([{
    provide: NG_VALUE_ACCESSOR,
    useExisting: SelectValueAccessorDirective,
    multi: true
  }]), i0.\u0275\u0275InheritDefinitionFeature]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(SelectValueAccessorDirective, [{
    type: Directive,
    args: [{
      /* tslint:disable-next-line:directive-selector */
      selector: "ion-select, ion-radio-group, ion-segment, ion-datetime",
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: SelectValueAccessorDirective,
        multi: true
      }]
    }]
  }], function() {
    return [{
      type: i0.Injector
    }, {
      type: i0.ElementRef
    }];
  }, {
    _handleChangeEvent: [{
      type: HostListener,
      args: ["ionChange", ["$event.target"]]
    }]
  });
})();
var TextValueAccessorDirective = class extends ValueAccessor {
  constructor(injector, el) {
    super(injector, el);
  }
  _handleInputEvent(el) {
    this.handleValueChange(el, el.value);
  }
};
TextValueAccessorDirective.\u0275fac = function TextValueAccessorDirective_Factory(t) {
  return new (t || TextValueAccessorDirective)(i0.\u0275\u0275directiveInject(i0.Injector), i0.\u0275\u0275directiveInject(i0.ElementRef));
};
TextValueAccessorDirective.\u0275dir = /* @__PURE__ */ i0.\u0275\u0275defineDirective({
  type: TextValueAccessorDirective,
  selectors: [["ion-input", 3, "type", "number"], ["ion-textarea"], ["ion-searchbar"], ["ion-range"]],
  hostBindings: function TextValueAccessorDirective_HostBindings(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275listener("ionInput", function TextValueAccessorDirective_ionInput_HostBindingHandler($event) {
        return ctx._handleInputEvent($event.target);
      });
    }
  },
  features: [i0.\u0275\u0275ProvidersFeature([{
    provide: NG_VALUE_ACCESSOR,
    useExisting: TextValueAccessorDirective,
    multi: true
  }]), i0.\u0275\u0275InheritDefinitionFeature]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(TextValueAccessorDirective, [{
    type: Directive,
    args: [{
      selector: "ion-input:not([type=number]),ion-textarea,ion-searchbar,ion-range",
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: TextValueAccessorDirective,
        multi: true
      }]
    }]
  }], function() {
    return [{
      type: i0.Injector
    }, {
      type: i0.ElementRef
    }];
  }, {
    _handleInputEvent: [{
      type: HostListener,
      args: ["ionInput", ["$event.target"]]
    }]
  });
})();
var proxyInputs = (Cmp, inputs) => {
  const Prototype = Cmp.prototype;
  inputs.forEach((item) => {
    Object.defineProperty(Prototype, item, {
      get() {
        return this.el[item];
      },
      set(val) {
        this.z.runOutsideAngular(() => this.el[item] = val);
      },
      /**
       * In the event that proxyInputs is called
       * multiple times re-defining these inputs
       * will cause an error to be thrown. As a result
       * we set configurable: true to indicate these
       * properties can be changed.
       */
      configurable: true
    });
  });
};
var proxyMethods = (Cmp, methods) => {
  const Prototype = Cmp.prototype;
  methods.forEach((methodName) => {
    Prototype[methodName] = function() {
      const args = arguments;
      return this.z.runOutsideAngular(() => this.el[methodName].apply(this.el, args));
    };
  });
};
var proxyOutputs = (instance, el, events) => {
  events.forEach((eventName) => instance[eventName] = fromEvent(el, eventName));
};
function ProxyCmp(opts) {
  const decorator = function(cls) {
    const {
      defineCustomElementFn,
      inputs,
      methods
    } = opts;
    if (defineCustomElementFn !== void 0) {
      defineCustomElementFn();
    }
    if (inputs) {
      proxyInputs(cls, inputs);
    }
    if (methods) {
      proxyMethods(cls, methods);
    }
    return cls;
  };
  return decorator;
}
var IonAccordion = class IonAccordion2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonAccordion.\u0275fac = function IonAccordion_Factory(t) {
  return new (t || IonAccordion)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonAccordion.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonAccordion,
  selectors: [["ion-accordion"]],
  inputs: {
    disabled: "disabled",
    mode: "mode",
    readonly: "readonly",
    toggleIcon: "toggleIcon",
    toggleIconSlot: "toggleIconSlot",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonAccordion_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonAccordion = __decorate([ProxyCmp({
  inputs: ["disabled", "mode", "readonly", "toggleIcon", "toggleIconSlot", "value"]
})], IonAccordion);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonAccordion, [{
    type: Component,
    args: [{
      selector: "ion-accordion",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["disabled", "mode", "readonly", "toggleIcon", "toggleIconSlot", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonAccordionGroup = class IonAccordionGroup2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionChange"]);
  }
};
IonAccordionGroup.\u0275fac = function IonAccordionGroup_Factory(t) {
  return new (t || IonAccordionGroup)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonAccordionGroup.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonAccordionGroup,
  selectors: [["ion-accordion-group"]],
  inputs: {
    animated: "animated",
    disabled: "disabled",
    expand: "expand",
    mode: "mode",
    multiple: "multiple",
    readonly: "readonly",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonAccordionGroup_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonAccordionGroup = __decorate([ProxyCmp({
  inputs: ["animated", "disabled", "expand", "mode", "multiple", "readonly", "value"]
})], IonAccordionGroup);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonAccordionGroup, [{
    type: Component,
    args: [{
      selector: "ion-accordion-group",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["animated", "disabled", "expand", "mode", "multiple", "readonly", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonActionSheet = class IonActionSheet2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionActionSheetDidPresent", "ionActionSheetWillPresent", "ionActionSheetWillDismiss", "ionActionSheetDidDismiss", "didPresent", "willPresent", "willDismiss", "didDismiss"]);
  }
};
IonActionSheet.\u0275fac = function IonActionSheet_Factory(t) {
  return new (t || IonActionSheet)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonActionSheet.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonActionSheet,
  selectors: [["ion-action-sheet"]],
  inputs: {
    animated: "animated",
    backdropDismiss: "backdropDismiss",
    buttons: "buttons",
    cssClass: "cssClass",
    enterAnimation: "enterAnimation",
    header: "header",
    htmlAttributes: "htmlAttributes",
    isOpen: "isOpen",
    keyboardClose: "keyboardClose",
    leaveAnimation: "leaveAnimation",
    mode: "mode",
    subHeader: "subHeader",
    translucent: "translucent",
    trigger: "trigger"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonActionSheet_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonActionSheet = __decorate([ProxyCmp({
  inputs: ["animated", "backdropDismiss", "buttons", "cssClass", "enterAnimation", "header", "htmlAttributes", "isOpen", "keyboardClose", "leaveAnimation", "mode", "subHeader", "translucent", "trigger"],
  methods: ["present", "dismiss", "onDidDismiss", "onWillDismiss"]
})], IonActionSheet);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonActionSheet, [{
    type: Component,
    args: [{
      selector: "ion-action-sheet",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["animated", "backdropDismiss", "buttons", "cssClass", "enterAnimation", "header", "htmlAttributes", "isOpen", "keyboardClose", "leaveAnimation", "mode", "subHeader", "translucent", "trigger"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonAlert = class IonAlert2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionAlertDidPresent", "ionAlertWillPresent", "ionAlertWillDismiss", "ionAlertDidDismiss", "didPresent", "willPresent", "willDismiss", "didDismiss"]);
  }
};
IonAlert.\u0275fac = function IonAlert_Factory(t) {
  return new (t || IonAlert)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonAlert.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonAlert,
  selectors: [["ion-alert"]],
  inputs: {
    animated: "animated",
    backdropDismiss: "backdropDismiss",
    buttons: "buttons",
    cssClass: "cssClass",
    enterAnimation: "enterAnimation",
    header: "header",
    htmlAttributes: "htmlAttributes",
    inputs: "inputs",
    isOpen: "isOpen",
    keyboardClose: "keyboardClose",
    leaveAnimation: "leaveAnimation",
    message: "message",
    mode: "mode",
    subHeader: "subHeader",
    translucent: "translucent",
    trigger: "trigger"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonAlert_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonAlert = __decorate([ProxyCmp({
  inputs: ["animated", "backdropDismiss", "buttons", "cssClass", "enterAnimation", "header", "htmlAttributes", "inputs", "isOpen", "keyboardClose", "leaveAnimation", "message", "mode", "subHeader", "translucent", "trigger"],
  methods: ["present", "dismiss", "onDidDismiss", "onWillDismiss"]
})], IonAlert);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonAlert, [{
    type: Component,
    args: [{
      selector: "ion-alert",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["animated", "backdropDismiss", "buttons", "cssClass", "enterAnimation", "header", "htmlAttributes", "inputs", "isOpen", "keyboardClose", "leaveAnimation", "message", "mode", "subHeader", "translucent", "trigger"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonApp = class IonApp2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonApp.\u0275fac = function IonApp_Factory(t) {
  return new (t || IonApp)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonApp.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonApp,
  selectors: [["ion-app"]],
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonApp_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonApp = __decorate([ProxyCmp({})], IonApp);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonApp, [{
    type: Component,
    args: [{
      selector: "ion-app",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: []
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonAvatar = class IonAvatar2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonAvatar.\u0275fac = function IonAvatar_Factory(t) {
  return new (t || IonAvatar)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonAvatar.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonAvatar,
  selectors: [["ion-avatar"]],
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonAvatar_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonAvatar = __decorate([ProxyCmp({})], IonAvatar);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonAvatar, [{
    type: Component,
    args: [{
      selector: "ion-avatar",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: []
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonBackdrop = class IonBackdrop2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionBackdropTap"]);
  }
};
IonBackdrop.\u0275fac = function IonBackdrop_Factory(t) {
  return new (t || IonBackdrop)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonBackdrop.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonBackdrop,
  selectors: [["ion-backdrop"]],
  inputs: {
    stopPropagation: "stopPropagation",
    tappable: "tappable",
    visible: "visible"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonBackdrop_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonBackdrop = __decorate([ProxyCmp({
  inputs: ["stopPropagation", "tappable", "visible"]
})], IonBackdrop);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonBackdrop, [{
    type: Component,
    args: [{
      selector: "ion-backdrop",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["stopPropagation", "tappable", "visible"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonBadge = class IonBadge2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonBadge.\u0275fac = function IonBadge_Factory(t) {
  return new (t || IonBadge)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonBadge.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonBadge,
  selectors: [["ion-badge"]],
  inputs: {
    color: "color",
    mode: "mode"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonBadge_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonBadge = __decorate([ProxyCmp({
  inputs: ["color", "mode"]
})], IonBadge);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonBadge, [{
    type: Component,
    args: [{
      selector: "ion-badge",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "mode"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonBreadcrumb = class IonBreadcrumb2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionFocus", "ionBlur"]);
  }
};
IonBreadcrumb.\u0275fac = function IonBreadcrumb_Factory(t) {
  return new (t || IonBreadcrumb)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonBreadcrumb.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonBreadcrumb,
  selectors: [["ion-breadcrumb"]],
  inputs: {
    active: "active",
    color: "color",
    disabled: "disabled",
    download: "download",
    href: "href",
    mode: "mode",
    rel: "rel",
    routerAnimation: "routerAnimation",
    routerDirection: "routerDirection",
    separator: "separator",
    target: "target"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonBreadcrumb_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonBreadcrumb = __decorate([ProxyCmp({
  inputs: ["active", "color", "disabled", "download", "href", "mode", "rel", "routerAnimation", "routerDirection", "separator", "target"]
})], IonBreadcrumb);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonBreadcrumb, [{
    type: Component,
    args: [{
      selector: "ion-breadcrumb",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["active", "color", "disabled", "download", "href", "mode", "rel", "routerAnimation", "routerDirection", "separator", "target"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonBreadcrumbs = class IonBreadcrumbs2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionCollapsedClick"]);
  }
};
IonBreadcrumbs.\u0275fac = function IonBreadcrumbs_Factory(t) {
  return new (t || IonBreadcrumbs)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonBreadcrumbs.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonBreadcrumbs,
  selectors: [["ion-breadcrumbs"]],
  inputs: {
    color: "color",
    itemsAfterCollapse: "itemsAfterCollapse",
    itemsBeforeCollapse: "itemsBeforeCollapse",
    maxItems: "maxItems",
    mode: "mode"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonBreadcrumbs_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonBreadcrumbs = __decorate([ProxyCmp({
  inputs: ["color", "itemsAfterCollapse", "itemsBeforeCollapse", "maxItems", "mode"]
})], IonBreadcrumbs);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonBreadcrumbs, [{
    type: Component,
    args: [{
      selector: "ion-breadcrumbs",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "itemsAfterCollapse", "itemsBeforeCollapse", "maxItems", "mode"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonButton = class IonButton2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionFocus", "ionBlur"]);
  }
};
IonButton.\u0275fac = function IonButton_Factory(t) {
  return new (t || IonButton)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonButton.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonButton,
  selectors: [["ion-button"]],
  inputs: {
    buttonType: "buttonType",
    color: "color",
    disabled: "disabled",
    download: "download",
    expand: "expand",
    fill: "fill",
    form: "form",
    href: "href",
    mode: "mode",
    rel: "rel",
    routerAnimation: "routerAnimation",
    routerDirection: "routerDirection",
    shape: "shape",
    size: "size",
    strong: "strong",
    target: "target",
    type: "type"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonButton_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonButton = __decorate([ProxyCmp({
  inputs: ["buttonType", "color", "disabled", "download", "expand", "fill", "form", "href", "mode", "rel", "routerAnimation", "routerDirection", "shape", "size", "strong", "target", "type"]
})], IonButton);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonButton, [{
    type: Component,
    args: [{
      selector: "ion-button",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["buttonType", "color", "disabled", "download", "expand", "fill", "form", "href", "mode", "rel", "routerAnimation", "routerDirection", "shape", "size", "strong", "target", "type"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonButtons = class IonButtons2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonButtons.\u0275fac = function IonButtons_Factory(t) {
  return new (t || IonButtons)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonButtons.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonButtons,
  selectors: [["ion-buttons"]],
  inputs: {
    collapse: "collapse"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonButtons_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonButtons = __decorate([ProxyCmp({
  inputs: ["collapse"]
})], IonButtons);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonButtons, [{
    type: Component,
    args: [{
      selector: "ion-buttons",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["collapse"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonCard = class IonCard2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonCard.\u0275fac = function IonCard_Factory(t) {
  return new (t || IonCard)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonCard.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonCard,
  selectors: [["ion-card"]],
  inputs: {
    button: "button",
    color: "color",
    disabled: "disabled",
    download: "download",
    href: "href",
    mode: "mode",
    rel: "rel",
    routerAnimation: "routerAnimation",
    routerDirection: "routerDirection",
    target: "target",
    type: "type"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonCard_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonCard = __decorate([ProxyCmp({
  inputs: ["button", "color", "disabled", "download", "href", "mode", "rel", "routerAnimation", "routerDirection", "target", "type"]
})], IonCard);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonCard, [{
    type: Component,
    args: [{
      selector: "ion-card",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["button", "color", "disabled", "download", "href", "mode", "rel", "routerAnimation", "routerDirection", "target", "type"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonCardContent = class IonCardContent2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonCardContent.\u0275fac = function IonCardContent_Factory(t) {
  return new (t || IonCardContent)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonCardContent.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonCardContent,
  selectors: [["ion-card-content"]],
  inputs: {
    mode: "mode"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonCardContent_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonCardContent = __decorate([ProxyCmp({
  inputs: ["mode"]
})], IonCardContent);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonCardContent, [{
    type: Component,
    args: [{
      selector: "ion-card-content",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["mode"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonCardHeader = class IonCardHeader2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonCardHeader.\u0275fac = function IonCardHeader_Factory(t) {
  return new (t || IonCardHeader)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonCardHeader.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonCardHeader,
  selectors: [["ion-card-header"]],
  inputs: {
    color: "color",
    mode: "mode",
    translucent: "translucent"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonCardHeader_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonCardHeader = __decorate([ProxyCmp({
  inputs: ["color", "mode", "translucent"]
})], IonCardHeader);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonCardHeader, [{
    type: Component,
    args: [{
      selector: "ion-card-header",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "mode", "translucent"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonCardSubtitle = class IonCardSubtitle2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonCardSubtitle.\u0275fac = function IonCardSubtitle_Factory(t) {
  return new (t || IonCardSubtitle)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonCardSubtitle.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonCardSubtitle,
  selectors: [["ion-card-subtitle"]],
  inputs: {
    color: "color",
    mode: "mode"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonCardSubtitle_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonCardSubtitle = __decorate([ProxyCmp({
  inputs: ["color", "mode"]
})], IonCardSubtitle);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonCardSubtitle, [{
    type: Component,
    args: [{
      selector: "ion-card-subtitle",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "mode"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonCardTitle = class IonCardTitle2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonCardTitle.\u0275fac = function IonCardTitle_Factory(t) {
  return new (t || IonCardTitle)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonCardTitle.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonCardTitle,
  selectors: [["ion-card-title"]],
  inputs: {
    color: "color",
    mode: "mode"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonCardTitle_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonCardTitle = __decorate([ProxyCmp({
  inputs: ["color", "mode"]
})], IonCardTitle);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonCardTitle, [{
    type: Component,
    args: [{
      selector: "ion-card-title",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "mode"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonCheckbox = class IonCheckbox2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionChange", "ionFocus", "ionBlur"]);
  }
};
IonCheckbox.\u0275fac = function IonCheckbox_Factory(t) {
  return new (t || IonCheckbox)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonCheckbox.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonCheckbox,
  selectors: [["ion-checkbox"]],
  inputs: {
    alignment: "alignment",
    checked: "checked",
    color: "color",
    disabled: "disabled",
    indeterminate: "indeterminate",
    justify: "justify",
    labelPlacement: "labelPlacement",
    legacy: "legacy",
    mode: "mode",
    name: "name",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonCheckbox_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonCheckbox = __decorate([ProxyCmp({
  inputs: ["alignment", "checked", "color", "disabled", "indeterminate", "justify", "labelPlacement", "legacy", "mode", "name", "value"]
})], IonCheckbox);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonCheckbox, [{
    type: Component,
    args: [{
      selector: "ion-checkbox",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["alignment", "checked", "color", "disabled", "indeterminate", "justify", "labelPlacement", "legacy", "mode", "name", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonChip = class IonChip2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonChip.\u0275fac = function IonChip_Factory(t) {
  return new (t || IonChip)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonChip.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonChip,
  selectors: [["ion-chip"]],
  inputs: {
    color: "color",
    disabled: "disabled",
    mode: "mode",
    outline: "outline"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonChip_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonChip = __decorate([ProxyCmp({
  inputs: ["color", "disabled", "mode", "outline"]
})], IonChip);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonChip, [{
    type: Component,
    args: [{
      selector: "ion-chip",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "disabled", "mode", "outline"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonCol = class IonCol2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonCol.\u0275fac = function IonCol_Factory(t) {
  return new (t || IonCol)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonCol.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonCol,
  selectors: [["ion-col"]],
  inputs: {
    offset: "offset",
    offsetLg: "offsetLg",
    offsetMd: "offsetMd",
    offsetSm: "offsetSm",
    offsetXl: "offsetXl",
    offsetXs: "offsetXs",
    pull: "pull",
    pullLg: "pullLg",
    pullMd: "pullMd",
    pullSm: "pullSm",
    pullXl: "pullXl",
    pullXs: "pullXs",
    push: "push",
    pushLg: "pushLg",
    pushMd: "pushMd",
    pushSm: "pushSm",
    pushXl: "pushXl",
    pushXs: "pushXs",
    size: "size",
    sizeLg: "sizeLg",
    sizeMd: "sizeMd",
    sizeSm: "sizeSm",
    sizeXl: "sizeXl",
    sizeXs: "sizeXs"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonCol_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonCol = __decorate([ProxyCmp({
  inputs: ["offset", "offsetLg", "offsetMd", "offsetSm", "offsetXl", "offsetXs", "pull", "pullLg", "pullMd", "pullSm", "pullXl", "pullXs", "push", "pushLg", "pushMd", "pushSm", "pushXl", "pushXs", "size", "sizeLg", "sizeMd", "sizeSm", "sizeXl", "sizeXs"]
})], IonCol);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonCol, [{
    type: Component,
    args: [{
      selector: "ion-col",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["offset", "offsetLg", "offsetMd", "offsetSm", "offsetXl", "offsetXs", "pull", "pullLg", "pullMd", "pullSm", "pullXl", "pullXs", "push", "pushLg", "pushMd", "pushSm", "pushXl", "pushXs", "size", "sizeLg", "sizeMd", "sizeSm", "sizeXl", "sizeXs"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonContent = class IonContent2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionScrollStart", "ionScroll", "ionScrollEnd"]);
  }
};
IonContent.\u0275fac = function IonContent_Factory(t) {
  return new (t || IonContent)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonContent.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonContent,
  selectors: [["ion-content"]],
  inputs: {
    color: "color",
    forceOverscroll: "forceOverscroll",
    fullscreen: "fullscreen",
    scrollEvents: "scrollEvents",
    scrollX: "scrollX",
    scrollY: "scrollY"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonContent_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonContent = __decorate([ProxyCmp({
  inputs: ["color", "forceOverscroll", "fullscreen", "scrollEvents", "scrollX", "scrollY"],
  methods: ["getScrollElement", "scrollToTop", "scrollToBottom", "scrollByPoint", "scrollToPoint"]
})], IonContent);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonContent, [{
    type: Component,
    args: [{
      selector: "ion-content",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "forceOverscroll", "fullscreen", "scrollEvents", "scrollX", "scrollY"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonDatetime = class IonDatetime2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionCancel", "ionChange", "ionFocus", "ionBlur"]);
  }
};
IonDatetime.\u0275fac = function IonDatetime_Factory(t) {
  return new (t || IonDatetime)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonDatetime.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonDatetime,
  selectors: [["ion-datetime"]],
  inputs: {
    cancelText: "cancelText",
    clearText: "clearText",
    color: "color",
    dayValues: "dayValues",
    disabled: "disabled",
    doneText: "doneText",
    firstDayOfWeek: "firstDayOfWeek",
    formatOptions: "formatOptions",
    highlightedDates: "highlightedDates",
    hourCycle: "hourCycle",
    hourValues: "hourValues",
    isDateEnabled: "isDateEnabled",
    locale: "locale",
    max: "max",
    min: "min",
    minuteValues: "minuteValues",
    mode: "mode",
    monthValues: "monthValues",
    multiple: "multiple",
    name: "name",
    preferWheel: "preferWheel",
    presentation: "presentation",
    readonly: "readonly",
    showClearButton: "showClearButton",
    showDefaultButtons: "showDefaultButtons",
    showDefaultTimeLabel: "showDefaultTimeLabel",
    showDefaultTitle: "showDefaultTitle",
    size: "size",
    titleSelectedDatesFormatter: "titleSelectedDatesFormatter",
    value: "value",
    yearValues: "yearValues"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonDatetime_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonDatetime = __decorate([ProxyCmp({
  inputs: ["cancelText", "clearText", "color", "dayValues", "disabled", "doneText", "firstDayOfWeek", "formatOptions", "highlightedDates", "hourCycle", "hourValues", "isDateEnabled", "locale", "max", "min", "minuteValues", "mode", "monthValues", "multiple", "name", "preferWheel", "presentation", "readonly", "showClearButton", "showDefaultButtons", "showDefaultTimeLabel", "showDefaultTitle", "size", "titleSelectedDatesFormatter", "value", "yearValues"],
  methods: ["confirm", "reset", "cancel"]
})], IonDatetime);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonDatetime, [{
    type: Component,
    args: [{
      selector: "ion-datetime",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["cancelText", "clearText", "color", "dayValues", "disabled", "doneText", "firstDayOfWeek", "formatOptions", "highlightedDates", "hourCycle", "hourValues", "isDateEnabled", "locale", "max", "min", "minuteValues", "mode", "monthValues", "multiple", "name", "preferWheel", "presentation", "readonly", "showClearButton", "showDefaultButtons", "showDefaultTimeLabel", "showDefaultTitle", "size", "titleSelectedDatesFormatter", "value", "yearValues"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonDatetimeButton = class IonDatetimeButton2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonDatetimeButton.\u0275fac = function IonDatetimeButton_Factory(t) {
  return new (t || IonDatetimeButton)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonDatetimeButton.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonDatetimeButton,
  selectors: [["ion-datetime-button"]],
  inputs: {
    color: "color",
    datetime: "datetime",
    disabled: "disabled",
    mode: "mode"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonDatetimeButton_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonDatetimeButton = __decorate([ProxyCmp({
  inputs: ["color", "datetime", "disabled", "mode"]
})], IonDatetimeButton);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonDatetimeButton, [{
    type: Component,
    args: [{
      selector: "ion-datetime-button",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "datetime", "disabled", "mode"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonFab = class IonFab2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonFab.\u0275fac = function IonFab_Factory(t) {
  return new (t || IonFab)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonFab.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonFab,
  selectors: [["ion-fab"]],
  inputs: {
    activated: "activated",
    edge: "edge",
    horizontal: "horizontal",
    vertical: "vertical"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonFab_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonFab = __decorate([ProxyCmp({
  inputs: ["activated", "edge", "horizontal", "vertical"],
  methods: ["close"]
})], IonFab);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonFab, [{
    type: Component,
    args: [{
      selector: "ion-fab",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["activated", "edge", "horizontal", "vertical"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonFabButton = class IonFabButton2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionFocus", "ionBlur"]);
  }
};
IonFabButton.\u0275fac = function IonFabButton_Factory(t) {
  return new (t || IonFabButton)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonFabButton.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonFabButton,
  selectors: [["ion-fab-button"]],
  inputs: {
    activated: "activated",
    closeIcon: "closeIcon",
    color: "color",
    disabled: "disabled",
    download: "download",
    href: "href",
    mode: "mode",
    rel: "rel",
    routerAnimation: "routerAnimation",
    routerDirection: "routerDirection",
    show: "show",
    size: "size",
    target: "target",
    translucent: "translucent",
    type: "type"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonFabButton_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonFabButton = __decorate([ProxyCmp({
  inputs: ["activated", "closeIcon", "color", "disabled", "download", "href", "mode", "rel", "routerAnimation", "routerDirection", "show", "size", "target", "translucent", "type"]
})], IonFabButton);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonFabButton, [{
    type: Component,
    args: [{
      selector: "ion-fab-button",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["activated", "closeIcon", "color", "disabled", "download", "href", "mode", "rel", "routerAnimation", "routerDirection", "show", "size", "target", "translucent", "type"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonFabList = class IonFabList2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonFabList.\u0275fac = function IonFabList_Factory(t) {
  return new (t || IonFabList)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonFabList.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonFabList,
  selectors: [["ion-fab-list"]],
  inputs: {
    activated: "activated",
    side: "side"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonFabList_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonFabList = __decorate([ProxyCmp({
  inputs: ["activated", "side"]
})], IonFabList);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonFabList, [{
    type: Component,
    args: [{
      selector: "ion-fab-list",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["activated", "side"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonFooter = class IonFooter2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonFooter.\u0275fac = function IonFooter_Factory(t) {
  return new (t || IonFooter)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonFooter.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonFooter,
  selectors: [["ion-footer"]],
  inputs: {
    collapse: "collapse",
    mode: "mode",
    translucent: "translucent"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonFooter_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonFooter = __decorate([ProxyCmp({
  inputs: ["collapse", "mode", "translucent"]
})], IonFooter);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonFooter, [{
    type: Component,
    args: [{
      selector: "ion-footer",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["collapse", "mode", "translucent"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonGrid = class IonGrid2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonGrid.\u0275fac = function IonGrid_Factory(t) {
  return new (t || IonGrid)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonGrid.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonGrid,
  selectors: [["ion-grid"]],
  inputs: {
    fixed: "fixed"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonGrid_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonGrid = __decorate([ProxyCmp({
  inputs: ["fixed"]
})], IonGrid);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonGrid, [{
    type: Component,
    args: [{
      selector: "ion-grid",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["fixed"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonHeader = class IonHeader2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonHeader.\u0275fac = function IonHeader_Factory(t) {
  return new (t || IonHeader)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonHeader.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonHeader,
  selectors: [["ion-header"]],
  inputs: {
    collapse: "collapse",
    mode: "mode",
    translucent: "translucent"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonHeader_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonHeader = __decorate([ProxyCmp({
  inputs: ["collapse", "mode", "translucent"]
})], IonHeader);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonHeader, [{
    type: Component,
    args: [{
      selector: "ion-header",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["collapse", "mode", "translucent"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonIcon = class IonIcon2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonIcon.\u0275fac = function IonIcon_Factory(t) {
  return new (t || IonIcon)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonIcon.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonIcon,
  selectors: [["ion-icon"]],
  inputs: {
    color: "color",
    flipRtl: "flipRtl",
    icon: "icon",
    ios: "ios",
    lazy: "lazy",
    md: "md",
    mode: "mode",
    name: "name",
    sanitize: "sanitize",
    size: "size",
    src: "src"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonIcon_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonIcon = __decorate([ProxyCmp({
  inputs: ["color", "flipRtl", "icon", "ios", "lazy", "md", "mode", "name", "sanitize", "size", "src"]
})], IonIcon);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonIcon, [{
    type: Component,
    args: [{
      selector: "ion-icon",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "flipRtl", "icon", "ios", "lazy", "md", "mode", "name", "sanitize", "size", "src"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonImg = class IonImg2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionImgWillLoad", "ionImgDidLoad", "ionError"]);
  }
};
IonImg.\u0275fac = function IonImg_Factory(t) {
  return new (t || IonImg)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonImg.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonImg,
  selectors: [["ion-img"]],
  inputs: {
    alt: "alt",
    src: "src"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonImg_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonImg = __decorate([ProxyCmp({
  inputs: ["alt", "src"]
})], IonImg);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonImg, [{
    type: Component,
    args: [{
      selector: "ion-img",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["alt", "src"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonInfiniteScroll = class IonInfiniteScroll2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionInfinite"]);
  }
};
IonInfiniteScroll.\u0275fac = function IonInfiniteScroll_Factory(t) {
  return new (t || IonInfiniteScroll)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonInfiniteScroll.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonInfiniteScroll,
  selectors: [["ion-infinite-scroll"]],
  inputs: {
    disabled: "disabled",
    position: "position",
    threshold: "threshold"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonInfiniteScroll_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonInfiniteScroll = __decorate([ProxyCmp({
  inputs: ["disabled", "position", "threshold"],
  methods: ["complete"]
})], IonInfiniteScroll);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonInfiniteScroll, [{
    type: Component,
    args: [{
      selector: "ion-infinite-scroll",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["disabled", "position", "threshold"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonInfiniteScrollContent = class IonInfiniteScrollContent2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonInfiniteScrollContent.\u0275fac = function IonInfiniteScrollContent_Factory(t) {
  return new (t || IonInfiniteScrollContent)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonInfiniteScrollContent.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonInfiniteScrollContent,
  selectors: [["ion-infinite-scroll-content"]],
  inputs: {
    loadingSpinner: "loadingSpinner",
    loadingText: "loadingText"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonInfiniteScrollContent_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonInfiniteScrollContent = __decorate([ProxyCmp({
  inputs: ["loadingSpinner", "loadingText"]
})], IonInfiniteScrollContent);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonInfiniteScrollContent, [{
    type: Component,
    args: [{
      selector: "ion-infinite-scroll-content",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["loadingSpinner", "loadingText"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonInput = class IonInput2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionInput", "ionChange", "ionBlur", "ionFocus"]);
  }
};
IonInput.\u0275fac = function IonInput_Factory(t) {
  return new (t || IonInput)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonInput.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonInput,
  selectors: [["ion-input"]],
  inputs: {
    accept: "accept",
    autocapitalize: "autocapitalize",
    autocomplete: "autocomplete",
    autocorrect: "autocorrect",
    autofocus: "autofocus",
    clearInput: "clearInput",
    clearOnEdit: "clearOnEdit",
    color: "color",
    counter: "counter",
    counterFormatter: "counterFormatter",
    debounce: "debounce",
    disabled: "disabled",
    enterkeyhint: "enterkeyhint",
    errorText: "errorText",
    fill: "fill",
    helperText: "helperText",
    inputmode: "inputmode",
    label: "label",
    labelPlacement: "labelPlacement",
    legacy: "legacy",
    max: "max",
    maxlength: "maxlength",
    min: "min",
    minlength: "minlength",
    mode: "mode",
    multiple: "multiple",
    name: "name",
    pattern: "pattern",
    placeholder: "placeholder",
    readonly: "readonly",
    required: "required",
    shape: "shape",
    size: "size",
    spellcheck: "spellcheck",
    step: "step",
    type: "type",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonInput_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonInput = __decorate([ProxyCmp({
  inputs: ["accept", "autocapitalize", "autocomplete", "autocorrect", "autofocus", "clearInput", "clearOnEdit", "color", "counter", "counterFormatter", "debounce", "disabled", "enterkeyhint", "errorText", "fill", "helperText", "inputmode", "label", "labelPlacement", "legacy", "max", "maxlength", "min", "minlength", "mode", "multiple", "name", "pattern", "placeholder", "readonly", "required", "shape", "size", "spellcheck", "step", "type", "value"],
  methods: ["setFocus", "getInputElement"]
})], IonInput);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonInput, [{
    type: Component,
    args: [{
      selector: "ion-input",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["accept", "autocapitalize", "autocomplete", "autocorrect", "autofocus", "clearInput", "clearOnEdit", "color", "counter", "counterFormatter", "debounce", "disabled", "enterkeyhint", "errorText", "fill", "helperText", "inputmode", "label", "labelPlacement", "legacy", "max", "maxlength", "min", "minlength", "mode", "multiple", "name", "pattern", "placeholder", "readonly", "required", "shape", "size", "spellcheck", "step", "type", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonItem = class IonItem2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonItem.\u0275fac = function IonItem_Factory(t) {
  return new (t || IonItem)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonItem.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonItem,
  selectors: [["ion-item"]],
  inputs: {
    button: "button",
    color: "color",
    counter: "counter",
    counterFormatter: "counterFormatter",
    detail: "detail",
    detailIcon: "detailIcon",
    disabled: "disabled",
    download: "download",
    fill: "fill",
    href: "href",
    lines: "lines",
    mode: "mode",
    rel: "rel",
    routerAnimation: "routerAnimation",
    routerDirection: "routerDirection",
    shape: "shape",
    target: "target",
    type: "type"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonItem_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonItem = __decorate([ProxyCmp({
  inputs: ["button", "color", "counter", "counterFormatter", "detail", "detailIcon", "disabled", "download", "fill", "href", "lines", "mode", "rel", "routerAnimation", "routerDirection", "shape", "target", "type"]
})], IonItem);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonItem, [{
    type: Component,
    args: [{
      selector: "ion-item",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["button", "color", "counter", "counterFormatter", "detail", "detailIcon", "disabled", "download", "fill", "href", "lines", "mode", "rel", "routerAnimation", "routerDirection", "shape", "target", "type"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonItemDivider = class IonItemDivider2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonItemDivider.\u0275fac = function IonItemDivider_Factory(t) {
  return new (t || IonItemDivider)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonItemDivider.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonItemDivider,
  selectors: [["ion-item-divider"]],
  inputs: {
    color: "color",
    mode: "mode",
    sticky: "sticky"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonItemDivider_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonItemDivider = __decorate([ProxyCmp({
  inputs: ["color", "mode", "sticky"]
})], IonItemDivider);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonItemDivider, [{
    type: Component,
    args: [{
      selector: "ion-item-divider",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "mode", "sticky"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonItemGroup = class IonItemGroup2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonItemGroup.\u0275fac = function IonItemGroup_Factory(t) {
  return new (t || IonItemGroup)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonItemGroup.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonItemGroup,
  selectors: [["ion-item-group"]],
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonItemGroup_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonItemGroup = __decorate([ProxyCmp({})], IonItemGroup);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonItemGroup, [{
    type: Component,
    args: [{
      selector: "ion-item-group",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: []
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonItemOption = class IonItemOption2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonItemOption.\u0275fac = function IonItemOption_Factory(t) {
  return new (t || IonItemOption)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonItemOption.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonItemOption,
  selectors: [["ion-item-option"]],
  inputs: {
    color: "color",
    disabled: "disabled",
    download: "download",
    expandable: "expandable",
    href: "href",
    mode: "mode",
    rel: "rel",
    target: "target",
    type: "type"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonItemOption_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonItemOption = __decorate([ProxyCmp({
  inputs: ["color", "disabled", "download", "expandable", "href", "mode", "rel", "target", "type"]
})], IonItemOption);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonItemOption, [{
    type: Component,
    args: [{
      selector: "ion-item-option",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "disabled", "download", "expandable", "href", "mode", "rel", "target", "type"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonItemOptions = class IonItemOptions2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionSwipe"]);
  }
};
IonItemOptions.\u0275fac = function IonItemOptions_Factory(t) {
  return new (t || IonItemOptions)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonItemOptions.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonItemOptions,
  selectors: [["ion-item-options"]],
  inputs: {
    side: "side"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonItemOptions_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonItemOptions = __decorate([ProxyCmp({
  inputs: ["side"]
})], IonItemOptions);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonItemOptions, [{
    type: Component,
    args: [{
      selector: "ion-item-options",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["side"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonItemSliding = class IonItemSliding2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionDrag"]);
  }
};
IonItemSliding.\u0275fac = function IonItemSliding_Factory(t) {
  return new (t || IonItemSliding)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonItemSliding.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonItemSliding,
  selectors: [["ion-item-sliding"]],
  inputs: {
    disabled: "disabled"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonItemSliding_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonItemSliding = __decorate([ProxyCmp({
  inputs: ["disabled"],
  methods: ["getOpenAmount", "getSlidingRatio", "open", "close", "closeOpened"]
})], IonItemSliding);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonItemSliding, [{
    type: Component,
    args: [{
      selector: "ion-item-sliding",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["disabled"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonLabel = class IonLabel2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonLabel.\u0275fac = function IonLabel_Factory(t) {
  return new (t || IonLabel)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonLabel.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonLabel,
  selectors: [["ion-label"]],
  inputs: {
    color: "color",
    mode: "mode",
    position: "position"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonLabel_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonLabel = __decorate([ProxyCmp({
  inputs: ["color", "mode", "position"]
})], IonLabel);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonLabel, [{
    type: Component,
    args: [{
      selector: "ion-label",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "mode", "position"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonList = class IonList2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonList.\u0275fac = function IonList_Factory(t) {
  return new (t || IonList)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonList.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonList,
  selectors: [["ion-list"]],
  inputs: {
    inset: "inset",
    lines: "lines",
    mode: "mode"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonList_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonList = __decorate([ProxyCmp({
  inputs: ["inset", "lines", "mode"],
  methods: ["closeSlidingItems"]
})], IonList);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonList, [{
    type: Component,
    args: [{
      selector: "ion-list",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["inset", "lines", "mode"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonListHeader = class IonListHeader2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonListHeader.\u0275fac = function IonListHeader_Factory(t) {
  return new (t || IonListHeader)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonListHeader.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonListHeader,
  selectors: [["ion-list-header"]],
  inputs: {
    color: "color",
    lines: "lines",
    mode: "mode"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonListHeader_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonListHeader = __decorate([ProxyCmp({
  inputs: ["color", "lines", "mode"]
})], IonListHeader);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonListHeader, [{
    type: Component,
    args: [{
      selector: "ion-list-header",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "lines", "mode"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonLoading = class IonLoading2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionLoadingDidPresent", "ionLoadingWillPresent", "ionLoadingWillDismiss", "ionLoadingDidDismiss", "didPresent", "willPresent", "willDismiss", "didDismiss"]);
  }
};
IonLoading.\u0275fac = function IonLoading_Factory(t) {
  return new (t || IonLoading)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonLoading.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonLoading,
  selectors: [["ion-loading"]],
  inputs: {
    animated: "animated",
    backdropDismiss: "backdropDismiss",
    cssClass: "cssClass",
    duration: "duration",
    enterAnimation: "enterAnimation",
    htmlAttributes: "htmlAttributes",
    isOpen: "isOpen",
    keyboardClose: "keyboardClose",
    leaveAnimation: "leaveAnimation",
    message: "message",
    mode: "mode",
    showBackdrop: "showBackdrop",
    spinner: "spinner",
    translucent: "translucent",
    trigger: "trigger"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonLoading_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonLoading = __decorate([ProxyCmp({
  inputs: ["animated", "backdropDismiss", "cssClass", "duration", "enterAnimation", "htmlAttributes", "isOpen", "keyboardClose", "leaveAnimation", "message", "mode", "showBackdrop", "spinner", "translucent", "trigger"],
  methods: ["present", "dismiss", "onDidDismiss", "onWillDismiss"]
})], IonLoading);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonLoading, [{
    type: Component,
    args: [{
      selector: "ion-loading",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["animated", "backdropDismiss", "cssClass", "duration", "enterAnimation", "htmlAttributes", "isOpen", "keyboardClose", "leaveAnimation", "message", "mode", "showBackdrop", "spinner", "translucent", "trigger"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonMenu = class IonMenu2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionWillOpen", "ionWillClose", "ionDidOpen", "ionDidClose"]);
  }
};
IonMenu.\u0275fac = function IonMenu_Factory(t) {
  return new (t || IonMenu)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonMenu.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonMenu,
  selectors: [["ion-menu"]],
  inputs: {
    contentId: "contentId",
    disabled: "disabled",
    maxEdgeStart: "maxEdgeStart",
    menuId: "menuId",
    side: "side",
    swipeGesture: "swipeGesture",
    type: "type"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonMenu_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonMenu = __decorate([ProxyCmp({
  inputs: ["contentId", "disabled", "maxEdgeStart", "menuId", "side", "swipeGesture", "type"],
  methods: ["isOpen", "isActive", "open", "close", "toggle", "setOpen"]
})], IonMenu);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonMenu, [{
    type: Component,
    args: [{
      selector: "ion-menu",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["contentId", "disabled", "maxEdgeStart", "menuId", "side", "swipeGesture", "type"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonMenuButton = class IonMenuButton2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonMenuButton.\u0275fac = function IonMenuButton_Factory(t) {
  return new (t || IonMenuButton)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonMenuButton.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonMenuButton,
  selectors: [["ion-menu-button"]],
  inputs: {
    autoHide: "autoHide",
    color: "color",
    disabled: "disabled",
    menu: "menu",
    mode: "mode",
    type: "type"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonMenuButton_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonMenuButton = __decorate([ProxyCmp({
  inputs: ["autoHide", "color", "disabled", "menu", "mode", "type"]
})], IonMenuButton);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonMenuButton, [{
    type: Component,
    args: [{
      selector: "ion-menu-button",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["autoHide", "color", "disabled", "menu", "mode", "type"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonMenuToggle = class IonMenuToggle2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonMenuToggle.\u0275fac = function IonMenuToggle_Factory(t) {
  return new (t || IonMenuToggle)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonMenuToggle.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonMenuToggle,
  selectors: [["ion-menu-toggle"]],
  inputs: {
    autoHide: "autoHide",
    menu: "menu"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonMenuToggle_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonMenuToggle = __decorate([ProxyCmp({
  inputs: ["autoHide", "menu"]
})], IonMenuToggle);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonMenuToggle, [{
    type: Component,
    args: [{
      selector: "ion-menu-toggle",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["autoHide", "menu"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonNavLink = class IonNavLink2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonNavLink.\u0275fac = function IonNavLink_Factory(t) {
  return new (t || IonNavLink)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonNavLink.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonNavLink,
  selectors: [["ion-nav-link"]],
  inputs: {
    component: "component",
    componentProps: "componentProps",
    routerAnimation: "routerAnimation",
    routerDirection: "routerDirection"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonNavLink_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonNavLink = __decorate([ProxyCmp({
  inputs: ["component", "componentProps", "routerAnimation", "routerDirection"]
})], IonNavLink);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonNavLink, [{
    type: Component,
    args: [{
      selector: "ion-nav-link",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["component", "componentProps", "routerAnimation", "routerDirection"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonNote = class IonNote2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonNote.\u0275fac = function IonNote_Factory(t) {
  return new (t || IonNote)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonNote.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonNote,
  selectors: [["ion-note"]],
  inputs: {
    color: "color",
    mode: "mode"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonNote_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonNote = __decorate([ProxyCmp({
  inputs: ["color", "mode"]
})], IonNote);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonNote, [{
    type: Component,
    args: [{
      selector: "ion-note",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "mode"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonPicker = class IonPicker2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionPickerDidPresent", "ionPickerWillPresent", "ionPickerWillDismiss", "ionPickerDidDismiss", "didPresent", "willPresent", "willDismiss", "didDismiss"]);
  }
};
IonPicker.\u0275fac = function IonPicker_Factory(t) {
  return new (t || IonPicker)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonPicker.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonPicker,
  selectors: [["ion-picker"]],
  inputs: {
    animated: "animated",
    backdropDismiss: "backdropDismiss",
    buttons: "buttons",
    columns: "columns",
    cssClass: "cssClass",
    duration: "duration",
    enterAnimation: "enterAnimation",
    htmlAttributes: "htmlAttributes",
    isOpen: "isOpen",
    keyboardClose: "keyboardClose",
    leaveAnimation: "leaveAnimation",
    mode: "mode",
    showBackdrop: "showBackdrop",
    trigger: "trigger"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonPicker_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonPicker = __decorate([ProxyCmp({
  inputs: ["animated", "backdropDismiss", "buttons", "columns", "cssClass", "duration", "enterAnimation", "htmlAttributes", "isOpen", "keyboardClose", "leaveAnimation", "mode", "showBackdrop", "trigger"],
  methods: ["present", "dismiss", "onDidDismiss", "onWillDismiss", "getColumn"]
})], IonPicker);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonPicker, [{
    type: Component,
    args: [{
      selector: "ion-picker",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["animated", "backdropDismiss", "buttons", "columns", "cssClass", "duration", "enterAnimation", "htmlAttributes", "isOpen", "keyboardClose", "leaveAnimation", "mode", "showBackdrop", "trigger"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonProgressBar = class IonProgressBar2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonProgressBar.\u0275fac = function IonProgressBar_Factory(t) {
  return new (t || IonProgressBar)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonProgressBar.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonProgressBar,
  selectors: [["ion-progress-bar"]],
  inputs: {
    buffer: "buffer",
    color: "color",
    mode: "mode",
    reversed: "reversed",
    type: "type",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonProgressBar_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonProgressBar = __decorate([ProxyCmp({
  inputs: ["buffer", "color", "mode", "reversed", "type", "value"]
})], IonProgressBar);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonProgressBar, [{
    type: Component,
    args: [{
      selector: "ion-progress-bar",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["buffer", "color", "mode", "reversed", "type", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonRadio = class IonRadio2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionFocus", "ionBlur"]);
  }
};
IonRadio.\u0275fac = function IonRadio_Factory(t) {
  return new (t || IonRadio)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonRadio.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonRadio,
  selectors: [["ion-radio"]],
  inputs: {
    alignment: "alignment",
    color: "color",
    disabled: "disabled",
    justify: "justify",
    labelPlacement: "labelPlacement",
    legacy: "legacy",
    mode: "mode",
    name: "name",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonRadio_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonRadio = __decorate([ProxyCmp({
  inputs: ["alignment", "color", "disabled", "justify", "labelPlacement", "legacy", "mode", "name", "value"]
})], IonRadio);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonRadio, [{
    type: Component,
    args: [{
      selector: "ion-radio",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["alignment", "color", "disabled", "justify", "labelPlacement", "legacy", "mode", "name", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonRadioGroup = class IonRadioGroup2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionChange"]);
  }
};
IonRadioGroup.\u0275fac = function IonRadioGroup_Factory(t) {
  return new (t || IonRadioGroup)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonRadioGroup.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonRadioGroup,
  selectors: [["ion-radio-group"]],
  inputs: {
    allowEmptySelection: "allowEmptySelection",
    compareWith: "compareWith",
    name: "name",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonRadioGroup_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonRadioGroup = __decorate([ProxyCmp({
  inputs: ["allowEmptySelection", "compareWith", "name", "value"]
})], IonRadioGroup);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonRadioGroup, [{
    type: Component,
    args: [{
      selector: "ion-radio-group",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["allowEmptySelection", "compareWith", "name", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonRange = class IonRange2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionChange", "ionInput", "ionFocus", "ionBlur", "ionKnobMoveStart", "ionKnobMoveEnd"]);
  }
};
IonRange.\u0275fac = function IonRange_Factory(t) {
  return new (t || IonRange)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonRange.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonRange,
  selectors: [["ion-range"]],
  inputs: {
    activeBarStart: "activeBarStart",
    color: "color",
    debounce: "debounce",
    disabled: "disabled",
    dualKnobs: "dualKnobs",
    label: "label",
    labelPlacement: "labelPlacement",
    legacy: "legacy",
    max: "max",
    min: "min",
    mode: "mode",
    name: "name",
    pin: "pin",
    pinFormatter: "pinFormatter",
    snaps: "snaps",
    step: "step",
    ticks: "ticks",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonRange_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonRange = __decorate([ProxyCmp({
  inputs: ["activeBarStart", "color", "debounce", "disabled", "dualKnobs", "label", "labelPlacement", "legacy", "max", "min", "mode", "name", "pin", "pinFormatter", "snaps", "step", "ticks", "value"]
})], IonRange);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonRange, [{
    type: Component,
    args: [{
      selector: "ion-range",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["activeBarStart", "color", "debounce", "disabled", "dualKnobs", "label", "labelPlacement", "legacy", "max", "min", "mode", "name", "pin", "pinFormatter", "snaps", "step", "ticks", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonRefresher = class IonRefresher2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionRefresh", "ionPull", "ionStart"]);
  }
};
IonRefresher.\u0275fac = function IonRefresher_Factory(t) {
  return new (t || IonRefresher)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonRefresher.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonRefresher,
  selectors: [["ion-refresher"]],
  inputs: {
    closeDuration: "closeDuration",
    disabled: "disabled",
    mode: "mode",
    pullFactor: "pullFactor",
    pullMax: "pullMax",
    pullMin: "pullMin",
    snapbackDuration: "snapbackDuration"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonRefresher_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonRefresher = __decorate([ProxyCmp({
  inputs: ["closeDuration", "disabled", "mode", "pullFactor", "pullMax", "pullMin", "snapbackDuration"],
  methods: ["complete", "cancel", "getProgress"]
})], IonRefresher);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonRefresher, [{
    type: Component,
    args: [{
      selector: "ion-refresher",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["closeDuration", "disabled", "mode", "pullFactor", "pullMax", "pullMin", "snapbackDuration"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonRefresherContent = class IonRefresherContent2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonRefresherContent.\u0275fac = function IonRefresherContent_Factory(t) {
  return new (t || IonRefresherContent)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonRefresherContent.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonRefresherContent,
  selectors: [["ion-refresher-content"]],
  inputs: {
    pullingIcon: "pullingIcon",
    pullingText: "pullingText",
    refreshingSpinner: "refreshingSpinner",
    refreshingText: "refreshingText"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonRefresherContent_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonRefresherContent = __decorate([ProxyCmp({
  inputs: ["pullingIcon", "pullingText", "refreshingSpinner", "refreshingText"]
})], IonRefresherContent);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonRefresherContent, [{
    type: Component,
    args: [{
      selector: "ion-refresher-content",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["pullingIcon", "pullingText", "refreshingSpinner", "refreshingText"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonReorder = class IonReorder2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonReorder.\u0275fac = function IonReorder_Factory(t) {
  return new (t || IonReorder)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonReorder.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonReorder,
  selectors: [["ion-reorder"]],
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonReorder_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonReorder = __decorate([ProxyCmp({})], IonReorder);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonReorder, [{
    type: Component,
    args: [{
      selector: "ion-reorder",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: []
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonReorderGroup = class IonReorderGroup2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionItemReorder"]);
  }
};
IonReorderGroup.\u0275fac = function IonReorderGroup_Factory(t) {
  return new (t || IonReorderGroup)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonReorderGroup.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonReorderGroup,
  selectors: [["ion-reorder-group"]],
  inputs: {
    disabled: "disabled"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonReorderGroup_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonReorderGroup = __decorate([ProxyCmp({
  inputs: ["disabled"],
  methods: ["complete"]
})], IonReorderGroup);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonReorderGroup, [{
    type: Component,
    args: [{
      selector: "ion-reorder-group",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["disabled"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonRippleEffect = class IonRippleEffect2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonRippleEffect.\u0275fac = function IonRippleEffect_Factory(t) {
  return new (t || IonRippleEffect)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonRippleEffect.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonRippleEffect,
  selectors: [["ion-ripple-effect"]],
  inputs: {
    type: "type"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonRippleEffect_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonRippleEffect = __decorate([ProxyCmp({
  inputs: ["type"],
  methods: ["addRipple"]
})], IonRippleEffect);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonRippleEffect, [{
    type: Component,
    args: [{
      selector: "ion-ripple-effect",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["type"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonRow = class IonRow2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonRow.\u0275fac = function IonRow_Factory(t) {
  return new (t || IonRow)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonRow.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonRow,
  selectors: [["ion-row"]],
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonRow_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonRow = __decorate([ProxyCmp({})], IonRow);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonRow, [{
    type: Component,
    args: [{
      selector: "ion-row",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: []
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonSearchbar = class IonSearchbar2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionInput", "ionChange", "ionCancel", "ionClear", "ionBlur", "ionFocus"]);
  }
};
IonSearchbar.\u0275fac = function IonSearchbar_Factory(t) {
  return new (t || IonSearchbar)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonSearchbar.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonSearchbar,
  selectors: [["ion-searchbar"]],
  inputs: {
    animated: "animated",
    autocapitalize: "autocapitalize",
    autocomplete: "autocomplete",
    autocorrect: "autocorrect",
    cancelButtonIcon: "cancelButtonIcon",
    cancelButtonText: "cancelButtonText",
    clearIcon: "clearIcon",
    color: "color",
    debounce: "debounce",
    disabled: "disabled",
    enterkeyhint: "enterkeyhint",
    inputmode: "inputmode",
    maxlength: "maxlength",
    minlength: "minlength",
    mode: "mode",
    name: "name",
    placeholder: "placeholder",
    searchIcon: "searchIcon",
    showCancelButton: "showCancelButton",
    showClearButton: "showClearButton",
    spellcheck: "spellcheck",
    type: "type",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonSearchbar_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonSearchbar = __decorate([ProxyCmp({
  inputs: ["animated", "autocapitalize", "autocomplete", "autocorrect", "cancelButtonIcon", "cancelButtonText", "clearIcon", "color", "debounce", "disabled", "enterkeyhint", "inputmode", "maxlength", "minlength", "mode", "name", "placeholder", "searchIcon", "showCancelButton", "showClearButton", "spellcheck", "type", "value"],
  methods: ["setFocus", "getInputElement"]
})], IonSearchbar);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonSearchbar, [{
    type: Component,
    args: [{
      selector: "ion-searchbar",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["animated", "autocapitalize", "autocomplete", "autocorrect", "cancelButtonIcon", "cancelButtonText", "clearIcon", "color", "debounce", "disabled", "enterkeyhint", "inputmode", "maxlength", "minlength", "mode", "name", "placeholder", "searchIcon", "showCancelButton", "showClearButton", "spellcheck", "type", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonSegment = class IonSegment2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionChange"]);
  }
};
IonSegment.\u0275fac = function IonSegment_Factory(t) {
  return new (t || IonSegment)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonSegment.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonSegment,
  selectors: [["ion-segment"]],
  inputs: {
    color: "color",
    disabled: "disabled",
    mode: "mode",
    scrollable: "scrollable",
    selectOnFocus: "selectOnFocus",
    swipeGesture: "swipeGesture",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonSegment_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonSegment = __decorate([ProxyCmp({
  inputs: ["color", "disabled", "mode", "scrollable", "selectOnFocus", "swipeGesture", "value"]
})], IonSegment);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonSegment, [{
    type: Component,
    args: [{
      selector: "ion-segment",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "disabled", "mode", "scrollable", "selectOnFocus", "swipeGesture", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonSegmentButton = class IonSegmentButton2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonSegmentButton.\u0275fac = function IonSegmentButton_Factory(t) {
  return new (t || IonSegmentButton)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonSegmentButton.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonSegmentButton,
  selectors: [["ion-segment-button"]],
  inputs: {
    disabled: "disabled",
    layout: "layout",
    mode: "mode",
    type: "type",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonSegmentButton_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonSegmentButton = __decorate([ProxyCmp({
  inputs: ["disabled", "layout", "mode", "type", "value"]
})], IonSegmentButton);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonSegmentButton, [{
    type: Component,
    args: [{
      selector: "ion-segment-button",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["disabled", "layout", "mode", "type", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonSelect = class IonSelect2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionChange", "ionCancel", "ionDismiss", "ionFocus", "ionBlur"]);
  }
};
IonSelect.\u0275fac = function IonSelect_Factory(t) {
  return new (t || IonSelect)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonSelect.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonSelect,
  selectors: [["ion-select"]],
  inputs: {
    cancelText: "cancelText",
    color: "color",
    compareWith: "compareWith",
    disabled: "disabled",
    expandedIcon: "expandedIcon",
    fill: "fill",
    interface: "interface",
    interfaceOptions: "interfaceOptions",
    justify: "justify",
    label: "label",
    labelPlacement: "labelPlacement",
    legacy: "legacy",
    mode: "mode",
    multiple: "multiple",
    name: "name",
    okText: "okText",
    placeholder: "placeholder",
    selectedText: "selectedText",
    shape: "shape",
    toggleIcon: "toggleIcon",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonSelect_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonSelect = __decorate([ProxyCmp({
  inputs: ["cancelText", "color", "compareWith", "disabled", "expandedIcon", "fill", "interface", "interfaceOptions", "justify", "label", "labelPlacement", "legacy", "mode", "multiple", "name", "okText", "placeholder", "selectedText", "shape", "toggleIcon", "value"],
  methods: ["open"]
})], IonSelect);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonSelect, [{
    type: Component,
    args: [{
      selector: "ion-select",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["cancelText", "color", "compareWith", "disabled", "expandedIcon", "fill", "interface", "interfaceOptions", "justify", "label", "labelPlacement", "legacy", "mode", "multiple", "name", "okText", "placeholder", "selectedText", "shape", "toggleIcon", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonSelectOption = class IonSelectOption2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonSelectOption.\u0275fac = function IonSelectOption_Factory(t) {
  return new (t || IonSelectOption)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonSelectOption.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonSelectOption,
  selectors: [["ion-select-option"]],
  inputs: {
    disabled: "disabled",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonSelectOption_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonSelectOption = __decorate([ProxyCmp({
  inputs: ["disabled", "value"]
})], IonSelectOption);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonSelectOption, [{
    type: Component,
    args: [{
      selector: "ion-select-option",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["disabled", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonSkeletonText = class IonSkeletonText2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonSkeletonText.\u0275fac = function IonSkeletonText_Factory(t) {
  return new (t || IonSkeletonText)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonSkeletonText.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonSkeletonText,
  selectors: [["ion-skeleton-text"]],
  inputs: {
    animated: "animated"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonSkeletonText_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonSkeletonText = __decorate([ProxyCmp({
  inputs: ["animated"]
})], IonSkeletonText);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonSkeletonText, [{
    type: Component,
    args: [{
      selector: "ion-skeleton-text",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["animated"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonSpinner = class IonSpinner2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonSpinner.\u0275fac = function IonSpinner_Factory(t) {
  return new (t || IonSpinner)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonSpinner.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonSpinner,
  selectors: [["ion-spinner"]],
  inputs: {
    color: "color",
    duration: "duration",
    name: "name",
    paused: "paused"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonSpinner_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonSpinner = __decorate([ProxyCmp({
  inputs: ["color", "duration", "name", "paused"]
})], IonSpinner);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonSpinner, [{
    type: Component,
    args: [{
      selector: "ion-spinner",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "duration", "name", "paused"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonSplitPane = class IonSplitPane2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionSplitPaneVisible"]);
  }
};
IonSplitPane.\u0275fac = function IonSplitPane_Factory(t) {
  return new (t || IonSplitPane)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonSplitPane.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonSplitPane,
  selectors: [["ion-split-pane"]],
  inputs: {
    contentId: "contentId",
    disabled: "disabled",
    when: "when"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonSplitPane_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonSplitPane = __decorate([ProxyCmp({
  inputs: ["contentId", "disabled", "when"]
})], IonSplitPane);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonSplitPane, [{
    type: Component,
    args: [{
      selector: "ion-split-pane",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["contentId", "disabled", "when"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonTabBar = class IonTabBar2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonTabBar.\u0275fac = function IonTabBar_Factory(t) {
  return new (t || IonTabBar)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonTabBar.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonTabBar,
  selectors: [["ion-tab-bar"]],
  inputs: {
    color: "color",
    mode: "mode",
    selectedTab: "selectedTab",
    translucent: "translucent"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonTabBar_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonTabBar = __decorate([ProxyCmp({
  inputs: ["color", "mode", "selectedTab", "translucent"]
})], IonTabBar);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonTabBar, [{
    type: Component,
    args: [{
      selector: "ion-tab-bar",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "mode", "selectedTab", "translucent"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonTabButton = class IonTabButton2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonTabButton.\u0275fac = function IonTabButton_Factory(t) {
  return new (t || IonTabButton)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonTabButton.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonTabButton,
  selectors: [["ion-tab-button"]],
  inputs: {
    disabled: "disabled",
    download: "download",
    href: "href",
    layout: "layout",
    mode: "mode",
    rel: "rel",
    selected: "selected",
    tab: "tab",
    target: "target"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonTabButton_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonTabButton = __decorate([ProxyCmp({
  inputs: ["disabled", "download", "href", "layout", "mode", "rel", "selected", "tab", "target"]
})], IonTabButton);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonTabButton, [{
    type: Component,
    args: [{
      selector: "ion-tab-button",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["disabled", "download", "href", "layout", "mode", "rel", "selected", "tab", "target"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonText = class IonText2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonText.\u0275fac = function IonText_Factory(t) {
  return new (t || IonText)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonText.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonText,
  selectors: [["ion-text"]],
  inputs: {
    color: "color",
    mode: "mode"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonText_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonText = __decorate([ProxyCmp({
  inputs: ["color", "mode"]
})], IonText);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonText, [{
    type: Component,
    args: [{
      selector: "ion-text",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "mode"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonTextarea = class IonTextarea2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionChange", "ionInput", "ionBlur", "ionFocus"]);
  }
};
IonTextarea.\u0275fac = function IonTextarea_Factory(t) {
  return new (t || IonTextarea)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonTextarea.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonTextarea,
  selectors: [["ion-textarea"]],
  inputs: {
    autoGrow: "autoGrow",
    autocapitalize: "autocapitalize",
    autofocus: "autofocus",
    clearOnEdit: "clearOnEdit",
    color: "color",
    cols: "cols",
    counter: "counter",
    counterFormatter: "counterFormatter",
    debounce: "debounce",
    disabled: "disabled",
    enterkeyhint: "enterkeyhint",
    errorText: "errorText",
    fill: "fill",
    helperText: "helperText",
    inputmode: "inputmode",
    label: "label",
    labelPlacement: "labelPlacement",
    legacy: "legacy",
    maxlength: "maxlength",
    minlength: "minlength",
    mode: "mode",
    name: "name",
    placeholder: "placeholder",
    readonly: "readonly",
    required: "required",
    rows: "rows",
    shape: "shape",
    spellcheck: "spellcheck",
    value: "value",
    wrap: "wrap"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonTextarea_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonTextarea = __decorate([ProxyCmp({
  inputs: ["autoGrow", "autocapitalize", "autofocus", "clearOnEdit", "color", "cols", "counter", "counterFormatter", "debounce", "disabled", "enterkeyhint", "errorText", "fill", "helperText", "inputmode", "label", "labelPlacement", "legacy", "maxlength", "minlength", "mode", "name", "placeholder", "readonly", "required", "rows", "shape", "spellcheck", "value", "wrap"],
  methods: ["setFocus", "getInputElement"]
})], IonTextarea);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonTextarea, [{
    type: Component,
    args: [{
      selector: "ion-textarea",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["autoGrow", "autocapitalize", "autofocus", "clearOnEdit", "color", "cols", "counter", "counterFormatter", "debounce", "disabled", "enterkeyhint", "errorText", "fill", "helperText", "inputmode", "label", "labelPlacement", "legacy", "maxlength", "minlength", "mode", "name", "placeholder", "readonly", "required", "rows", "shape", "spellcheck", "value", "wrap"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonThumbnail = class IonThumbnail2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonThumbnail.\u0275fac = function IonThumbnail_Factory(t) {
  return new (t || IonThumbnail)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonThumbnail.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonThumbnail,
  selectors: [["ion-thumbnail"]],
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonThumbnail_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonThumbnail = __decorate([ProxyCmp({})], IonThumbnail);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonThumbnail, [{
    type: Component,
    args: [{
      selector: "ion-thumbnail",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: []
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonTitle = class IonTitle2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonTitle.\u0275fac = function IonTitle_Factory(t) {
  return new (t || IonTitle)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonTitle.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonTitle,
  selectors: [["ion-title"]],
  inputs: {
    color: "color",
    size: "size"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonTitle_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonTitle = __decorate([ProxyCmp({
  inputs: ["color", "size"]
})], IonTitle);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonTitle, [{
    type: Component,
    args: [{
      selector: "ion-title",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "size"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonToast = class IonToast2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionToastDidPresent", "ionToastWillPresent", "ionToastWillDismiss", "ionToastDidDismiss", "didPresent", "willPresent", "willDismiss", "didDismiss"]);
  }
};
IonToast.\u0275fac = function IonToast_Factory(t) {
  return new (t || IonToast)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonToast.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonToast,
  selectors: [["ion-toast"]],
  inputs: {
    animated: "animated",
    buttons: "buttons",
    color: "color",
    cssClass: "cssClass",
    duration: "duration",
    enterAnimation: "enterAnimation",
    header: "header",
    htmlAttributes: "htmlAttributes",
    icon: "icon",
    isOpen: "isOpen",
    keyboardClose: "keyboardClose",
    layout: "layout",
    leaveAnimation: "leaveAnimation",
    message: "message",
    mode: "mode",
    position: "position",
    positionAnchor: "positionAnchor",
    swipeGesture: "swipeGesture",
    translucent: "translucent",
    trigger: "trigger"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonToast_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonToast = __decorate([ProxyCmp({
  inputs: ["animated", "buttons", "color", "cssClass", "duration", "enterAnimation", "header", "htmlAttributes", "icon", "isOpen", "keyboardClose", "layout", "leaveAnimation", "message", "mode", "position", "positionAnchor", "swipeGesture", "translucent", "trigger"],
  methods: ["present", "dismiss", "onDidDismiss", "onWillDismiss"]
})], IonToast);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonToast, [{
    type: Component,
    args: [{
      selector: "ion-toast",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["animated", "buttons", "color", "cssClass", "duration", "enterAnimation", "header", "htmlAttributes", "icon", "isOpen", "keyboardClose", "layout", "leaveAnimation", "message", "mode", "position", "positionAnchor", "swipeGesture", "translucent", "trigger"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonToggle = class IonToggle2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ["ionChange", "ionFocus", "ionBlur"]);
  }
};
IonToggle.\u0275fac = function IonToggle_Factory(t) {
  return new (t || IonToggle)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonToggle.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonToggle,
  selectors: [["ion-toggle"]],
  inputs: {
    alignment: "alignment",
    checked: "checked",
    color: "color",
    disabled: "disabled",
    enableOnOffLabels: "enableOnOffLabels",
    justify: "justify",
    labelPlacement: "labelPlacement",
    legacy: "legacy",
    mode: "mode",
    name: "name",
    value: "value"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonToggle_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonToggle = __decorate([ProxyCmp({
  inputs: ["alignment", "checked", "color", "disabled", "enableOnOffLabels", "justify", "labelPlacement", "legacy", "mode", "name", "value"]
})], IonToggle);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonToggle, [{
    type: Component,
    args: [{
      selector: "ion-toggle",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["alignment", "checked", "color", "disabled", "enableOnOffLabels", "justify", "labelPlacement", "legacy", "mode", "name", "value"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonToolbar = class IonToolbar2 {
  constructor(c, r, z) {
    this.z = z;
    c.detach();
    this.el = r.nativeElement;
  }
};
IonToolbar.\u0275fac = function IonToolbar_Factory(t) {
  return new (t || IonToolbar)(i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone));
};
IonToolbar.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonToolbar,
  selectors: [["ion-toolbar"]],
  inputs: {
    color: "color",
    mode: "mode"
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonToolbar_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
IonToolbar = __decorate([ProxyCmp({
  inputs: ["color", "mode"]
})], IonToolbar);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonToolbar, [{
    type: Component,
    args: [{
      selector: "ion-toolbar",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: "<ng-content></ng-content>",
      // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
      inputs: ["color", "mode"]
    }]
  }], function() {
    return [{
      type: i0.ChangeDetectorRef
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }];
  }, null);
})();
var IonRouterOutlet = class extends IonRouterOutlet$1 {
  /**
   * We need to pass in the correct instance of IonRouterOutlet
   * otherwise parentOutlet will be null in a nested outlet context.
   * This results in APIs such as NavController.pop not working
   * in nested outlets because the parent outlet cannot be found.
   */
  constructor(name, tabs, commonLocation, elementRef, router, zone, activatedRoute, parentOutlet) {
    super(name, tabs, commonLocation, elementRef, router, zone, activatedRoute, parentOutlet);
    this.parentOutlet = parentOutlet;
  }
};
IonRouterOutlet.\u0275fac = function IonRouterOutlet_Factory(t) {
  return new (t || IonRouterOutlet)(i0.\u0275\u0275injectAttribute("name"), i0.\u0275\u0275injectAttribute("tabs"), i0.\u0275\u0275directiveInject(i1.Location), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i2.Router), i0.\u0275\u0275directiveInject(i0.NgZone), i0.\u0275\u0275directiveInject(i2.ActivatedRoute), i0.\u0275\u0275directiveInject(IonRouterOutlet, 12));
};
IonRouterOutlet.\u0275dir = /* @__PURE__ */ i0.\u0275\u0275defineDirective({
  type: IonRouterOutlet,
  selectors: [["ion-router-outlet"]],
  features: [i0.\u0275\u0275InheritDefinitionFeature]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonRouterOutlet, [{
    type: Directive,
    args: [{
      selector: "ion-router-outlet"
    }]
  }], function() {
    return [{
      type: void 0,
      decorators: [{
        type: Attribute,
        args: ["name"]
      }]
    }, {
      type: void 0,
      decorators: [{
        type: Optional
      }, {
        type: Attribute,
        args: ["tabs"]
      }]
    }, {
      type: i1.Location
    }, {
      type: i0.ElementRef
    }, {
      type: i2.Router
    }, {
      type: i0.NgZone
    }, {
      type: i2.ActivatedRoute
    }, {
      type: IonRouterOutlet,
      decorators: [{
        type: SkipSelf
      }, {
        type: Optional
      }]
    }];
  }, null);
})();
var IonTabs = class extends IonTabs$1 {
};
IonTabs.\u0275fac = /* @__PURE__ */ (() => {
  let \u0275IonTabs_BaseFactory;
  return function IonTabs_Factory(t) {
    return (\u0275IonTabs_BaseFactory || (\u0275IonTabs_BaseFactory = i0.\u0275\u0275getInheritedFactory(IonTabs)))(t || IonTabs);
  };
})();
IonTabs.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonTabs,
  selectors: [["ion-tabs"]],
  contentQueries: function IonTabs_ContentQueries(rf, ctx, dirIndex) {
    if (rf & 1) {
      i0.\u0275\u0275contentQuery(dirIndex, IonTabBar, 5);
      i0.\u0275\u0275contentQuery(dirIndex, IonTabBar, 4);
    }
    if (rf & 2) {
      let _t;
      i0.\u0275\u0275queryRefresh(_t = i0.\u0275\u0275loadQuery()) && (ctx.tabBar = _t.first);
      i0.\u0275\u0275queryRefresh(_t = i0.\u0275\u0275loadQuery()) && (ctx.tabBars = _t);
    }
  },
  viewQuery: function IonTabs_Query(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275viewQuery(_c1, 5, IonRouterOutlet);
    }
    if (rf & 2) {
      let _t;
      i0.\u0275\u0275queryRefresh(_t = i0.\u0275\u0275loadQuery()) && (ctx.outlet = _t.first);
    }
  },
  features: [i0.\u0275\u0275InheritDefinitionFeature],
  ngContentSelectors: _c3,
  decls: 6,
  vars: 0,
  consts: [["tabsInner", ""], ["outlet", ""], [1, "tabs-inner"], ["tabs", "true", 3, "stackWillChange", "stackDidChange"]],
  template: function IonTabs_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = i0.\u0275\u0275getCurrentView();
      i0.\u0275\u0275projectionDef(_c2);
      i0.\u0275\u0275projection(0);
      i0.\u0275\u0275elementStart(1, "div", 2, 0)(3, "ion-router-outlet", 3, 1);
      i0.\u0275\u0275listener("stackWillChange", function IonTabs_Template_ion_router_outlet_stackWillChange_3_listener($event) {
        i0.\u0275\u0275restoreView(_r1);
        return i0.\u0275\u0275resetView(ctx.onStackWillChange($event));
      })("stackDidChange", function IonTabs_Template_ion_router_outlet_stackDidChange_3_listener($event) {
        i0.\u0275\u0275restoreView(_r1);
        return i0.\u0275\u0275resetView(ctx.onStackDidChange($event));
      });
      i0.\u0275\u0275elementEnd()();
      i0.\u0275\u0275projection(5, 1);
    }
  },
  dependencies: [IonRouterOutlet],
  styles: ["[_nghost-%COMP%]{display:flex;position:absolute;inset:0;flex-direction:column;width:100%;height:100%;contain:layout size style}.tabs-inner[_ngcontent-%COMP%]{position:relative;flex:1;contain:layout size style}"]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonTabs, [{
    type: Component,
    args: [{
      selector: "ion-tabs",
      template: `
    <ng-content select="[slot=top]"></ng-content>
    <div class="tabs-inner" #tabsInner>
      <ion-router-outlet
        #outlet
        tabs="true"
        (stackWillChange)="onStackWillChange($event)"
        (stackDidChange)="onStackDidChange($event)"
      ></ion-router-outlet>
    </div>
    <ng-content></ng-content>
  `,
      styles: [":host{display:flex;position:absolute;inset:0;flex-direction:column;width:100%;height:100%;contain:layout size style}.tabs-inner{position:relative;flex:1;contain:layout size style}\n"]
    }]
  }], null, {
    outlet: [{
      type: ViewChild,
      args: ["outlet", {
        read: IonRouterOutlet,
        static: false
      }]
    }],
    tabBar: [{
      type: ContentChild,
      args: [IonTabBar, {
        static: false
      }]
    }],
    tabBars: [{
      type: ContentChildren,
      args: [IonTabBar]
    }]
  });
})();
var IonBackButton = class extends IonBackButton$1 {
  constructor(routerOutlet, navCtrl, config, r, z, c) {
    super(routerOutlet, navCtrl, config, r, z, c);
  }
};
IonBackButton.\u0275fac = function IonBackButton_Factory(t) {
  return new (t || IonBackButton)(i0.\u0275\u0275directiveInject(IonRouterOutlet, 8), i0.\u0275\u0275directiveInject(i2$1.NavController), i0.\u0275\u0275directiveInject(i2$1.Config), i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.NgZone), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
};
IonBackButton.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonBackButton,
  selectors: [["ion-back-button"]],
  features: [i0.\u0275\u0275InheritDefinitionFeature],
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonBackButton_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonBackButton, [{
    type: Component,
    args: [{
      selector: "ion-back-button",
      template: "<ng-content></ng-content>",
      changeDetection: ChangeDetectionStrategy.OnPush
    }]
  }], function() {
    return [{
      type: IonRouterOutlet,
      decorators: [{
        type: Optional
      }]
    }, {
      type: i2$1.NavController
    }, {
      type: i2$1.Config
    }, {
      type: i0.ElementRef
    }, {
      type: i0.NgZone
    }, {
      type: i0.ChangeDetectorRef
    }];
  }, null);
})();
var IonNav = class extends IonNav$1 {
  constructor(ref, environmentInjector, injector, angularDelegate, z, c) {
    super(ref, environmentInjector, injector, angularDelegate, z, c);
  }
};
IonNav.\u0275fac = function IonNav_Factory(t) {
  return new (t || IonNav)(i0.\u0275\u0275directiveInject(i0.ElementRef), i0.\u0275\u0275directiveInject(i0.EnvironmentInjector), i0.\u0275\u0275directiveInject(i0.Injector), i0.\u0275\u0275directiveInject(i2$1.AngularDelegate), i0.\u0275\u0275directiveInject(i0.NgZone), i0.\u0275\u0275directiveInject(i0.ChangeDetectorRef));
};
IonNav.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonNav,
  selectors: [["ion-nav"]],
  features: [i0.\u0275\u0275InheritDefinitionFeature],
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function IonNav_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275projectionDef();
      i0.\u0275\u0275projection(0);
    }
  },
  encapsulation: 2,
  changeDetection: 0
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonNav, [{
    type: Component,
    args: [{
      selector: "ion-nav",
      template: "<ng-content></ng-content>",
      changeDetection: ChangeDetectionStrategy.OnPush
    }]
  }], function() {
    return [{
      type: i0.ElementRef
    }, {
      type: i0.EnvironmentInjector
    }, {
      type: i0.Injector
    }, {
      type: i2$1.AngularDelegate
    }, {
      type: i0.NgZone
    }, {
      type: i0.ChangeDetectorRef
    }];
  }, null);
})();
var RouterLinkDelegateDirective = class extends RouterLinkDelegateDirective$1 {
};
RouterLinkDelegateDirective.\u0275fac = /* @__PURE__ */ (() => {
  let \u0275RouterLinkDelegateDirective_BaseFactory;
  return function RouterLinkDelegateDirective_Factory(t) {
    return (\u0275RouterLinkDelegateDirective_BaseFactory || (\u0275RouterLinkDelegateDirective_BaseFactory = i0.\u0275\u0275getInheritedFactory(RouterLinkDelegateDirective)))(t || RouterLinkDelegateDirective);
  };
})();
RouterLinkDelegateDirective.\u0275dir = /* @__PURE__ */ i0.\u0275\u0275defineDirective({
  type: RouterLinkDelegateDirective,
  selectors: [["", "routerLink", "", 5, "a", 5, "area"]],
  features: [i0.\u0275\u0275InheritDefinitionFeature]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(RouterLinkDelegateDirective, [{
    type: Directive,
    args: [{
      selector: ":not(a):not(area)[routerLink]"
    }]
  }], null, null);
})();
var RouterLinkWithHrefDelegateDirective = class extends RouterLinkWithHrefDelegateDirective$1 {
};
RouterLinkWithHrefDelegateDirective.\u0275fac = /* @__PURE__ */ (() => {
  let \u0275RouterLinkWithHrefDelegateDirective_BaseFactory;
  return function RouterLinkWithHrefDelegateDirective_Factory(t) {
    return (\u0275RouterLinkWithHrefDelegateDirective_BaseFactory || (\u0275RouterLinkWithHrefDelegateDirective_BaseFactory = i0.\u0275\u0275getInheritedFactory(RouterLinkWithHrefDelegateDirective)))(t || RouterLinkWithHrefDelegateDirective);
  };
})();
RouterLinkWithHrefDelegateDirective.\u0275dir = /* @__PURE__ */ i0.\u0275\u0275defineDirective({
  type: RouterLinkWithHrefDelegateDirective,
  selectors: [["a", "routerLink", ""], ["area", "routerLink", ""]],
  features: [i0.\u0275\u0275InheritDefinitionFeature]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(RouterLinkWithHrefDelegateDirective, [{
    type: Directive,
    args: [{
      selector: "a[routerLink],area[routerLink]"
    }]
  }], null, null);
})();
var IonModal = class extends IonModal$1 {
};
IonModal.\u0275fac = /* @__PURE__ */ (() => {
  let \u0275IonModal_BaseFactory;
  return function IonModal_Factory(t) {
    return (\u0275IonModal_BaseFactory || (\u0275IonModal_BaseFactory = i0.\u0275\u0275getInheritedFactory(IonModal)))(t || IonModal);
  };
})();
IonModal.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonModal,
  selectors: [["ion-modal"]],
  features: [i0.\u0275\u0275InheritDefinitionFeature],
  decls: 1,
  vars: 1,
  consts: [["class", "ion-delegate-host ion-page", 4, "ngIf"], [1, "ion-delegate-host", "ion-page"], [3, "ngTemplateOutlet"]],
  template: function IonModal_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275template(0, IonModal_div_0_Template, 2, 1, "div", 0);
    }
    if (rf & 2) {
      i0.\u0275\u0275property("ngIf", ctx.isCmpOpen || ctx.keepContentsMounted);
    }
  },
  dependencies: [i1.NgIf, i1.NgTemplateOutlet],
  encapsulation: 2,
  changeDetection: 0
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonModal, [{
    type: Component,
    args: [{
      selector: "ion-modal",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<div class="ion-delegate-host ion-page" *ngIf="isCmpOpen || keepContentsMounted">
    <ng-container [ngTemplateOutlet]="template"></ng-container>
  </div>`
    }]
  }], null, null);
})();
var IonPopover = class extends IonPopover$1 {
};
IonPopover.\u0275fac = /* @__PURE__ */ (() => {
  let \u0275IonPopover_BaseFactory;
  return function IonPopover_Factory(t) {
    return (\u0275IonPopover_BaseFactory || (\u0275IonPopover_BaseFactory = i0.\u0275\u0275getInheritedFactory(IonPopover)))(t || IonPopover);
  };
})();
IonPopover.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({
  type: IonPopover,
  selectors: [["ion-popover"]],
  features: [i0.\u0275\u0275InheritDefinitionFeature],
  decls: 1,
  vars: 1,
  consts: [[3, "ngTemplateOutlet", 4, "ngIf"], [3, "ngTemplateOutlet"]],
  template: function IonPopover_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275template(0, IonPopover_ng_container_0_Template, 1, 1, "ng-container", 0);
    }
    if (rf & 2) {
      i0.\u0275\u0275property("ngIf", ctx.isCmpOpen || ctx.keepContentsMounted);
    }
  },
  dependencies: [i1.NgIf, i1.NgTemplateOutlet],
  encapsulation: 2,
  changeDetection: 0
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonPopover, [{
    type: Component,
    args: [{
      selector: "ion-popover",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<ng-container [ngTemplateOutlet]="template" *ngIf="isCmpOpen || keepContentsMounted"></ng-container>`
    }]
  }], null, null);
})();
var ION_MAX_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => IonMaxValidator),
  multi: true
};
var IonMaxValidator = class extends MaxValidator {
};
IonMaxValidator.\u0275fac = /* @__PURE__ */ (() => {
  let \u0275IonMaxValidator_BaseFactory;
  return function IonMaxValidator_Factory(t) {
    return (\u0275IonMaxValidator_BaseFactory || (\u0275IonMaxValidator_BaseFactory = i0.\u0275\u0275getInheritedFactory(IonMaxValidator)))(t || IonMaxValidator);
  };
})();
IonMaxValidator.\u0275dir = /* @__PURE__ */ i0.\u0275\u0275defineDirective({
  type: IonMaxValidator,
  selectors: [["ion-input", "type", "number", "max", "", "formControlName", ""], ["ion-input", "type", "number", "max", "", "formControl", ""], ["ion-input", "type", "number", "max", "", "ngModel", ""]],
  hostVars: 1,
  hostBindings: function IonMaxValidator_HostBindings(rf, ctx) {
    if (rf & 2) {
      i0.\u0275\u0275attribute("max", ctx._enabled ? ctx.max : null);
    }
  },
  features: [i0.\u0275\u0275ProvidersFeature([ION_MAX_VALIDATOR]), i0.\u0275\u0275InheritDefinitionFeature]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonMaxValidator, [{
    type: Directive,
    args: [{
      selector: "ion-input[type=number][max][formControlName],ion-input[type=number][max][formControl],ion-input[type=number][max][ngModel]",
      providers: [ION_MAX_VALIDATOR],
      // eslint-disable-next-line @angular-eslint/no-host-metadata-property
      host: {
        "[attr.max]": "_enabled ? max : null"
      }
    }]
  }], null, null);
})();
var ION_MIN_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => IonMinValidator),
  multi: true
};
var IonMinValidator = class extends MinValidator {
};
IonMinValidator.\u0275fac = /* @__PURE__ */ (() => {
  let \u0275IonMinValidator_BaseFactory;
  return function IonMinValidator_Factory(t) {
    return (\u0275IonMinValidator_BaseFactory || (\u0275IonMinValidator_BaseFactory = i0.\u0275\u0275getInheritedFactory(IonMinValidator)))(t || IonMinValidator);
  };
})();
IonMinValidator.\u0275dir = /* @__PURE__ */ i0.\u0275\u0275defineDirective({
  type: IonMinValidator,
  selectors: [["ion-input", "type", "number", "min", "", "formControlName", ""], ["ion-input", "type", "number", "min", "", "formControl", ""], ["ion-input", "type", "number", "min", "", "ngModel", ""]],
  hostVars: 1,
  hostBindings: function IonMinValidator_HostBindings(rf, ctx) {
    if (rf & 2) {
      i0.\u0275\u0275attribute("min", ctx._enabled ? ctx.min : null);
    }
  },
  features: [i0.\u0275\u0275ProvidersFeature([ION_MIN_VALIDATOR]), i0.\u0275\u0275InheritDefinitionFeature]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonMinValidator, [{
    type: Directive,
    args: [{
      selector: "ion-input[type=number][min][formControlName],ion-input[type=number][min][formControl],ion-input[type=number][min][ngModel]",
      providers: [ION_MIN_VALIDATOR],
      // eslint-disable-next-line @angular-eslint/no-host-metadata-property
      host: {
        "[attr.min]": "_enabled ? min : null"
      }
    }]
  }], null, null);
})();
var AlertController = class extends OverlayBaseController {
  constructor() {
    super(alertController);
  }
};
AlertController.\u0275fac = function AlertController_Factory(t) {
  return new (t || AlertController)();
};
AlertController.\u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({
  token: AlertController,
  factory: AlertController.\u0275fac,
  providedIn: "root"
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(AlertController, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], function() {
    return [];
  }, null);
})();
var AnimationController = class {
  /**
   * Create a new animation
   */
  create(animationId) {
    return createAnimation(animationId);
  }
  /**
   * EXPERIMENTAL
   *
   * Given a progression and a cubic bezier function,
   * this utility returns the time value(s) at which the
   * cubic bezier reaches the given time progression.
   *
   * If the cubic bezier never reaches the progression
   * the result will be an empty array.
   *
   * This is most useful for switching between easing curves
   * when doing a gesture animation (i.e. going from linear easing
   * during a drag, to another easing when `progressEnd` is called)
   */
  easingTime(p0, p1, p2, p3, progression) {
    return getTimeGivenProgression(p0, p1, p2, p3, progression);
  }
};
AnimationController.\u0275fac = function AnimationController_Factory(t) {
  return new (t || AnimationController)();
};
AnimationController.\u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({
  token: AnimationController,
  factory: AnimationController.\u0275fac,
  providedIn: "root"
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(AnimationController, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var ActionSheetController = class extends OverlayBaseController {
  constructor() {
    super(actionSheetController);
  }
};
ActionSheetController.\u0275fac = function ActionSheetController_Factory(t) {
  return new (t || ActionSheetController)();
};
ActionSheetController.\u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({
  token: ActionSheetController,
  factory: ActionSheetController.\u0275fac,
  providedIn: "root"
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(ActionSheetController, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], function() {
    return [];
  }, null);
})();
var GestureController = class {
  constructor(zone) {
    this.zone = zone;
  }
  /**
   * Create a new gesture
   */
  create(opts, runInsideAngularZone = false) {
    if (runInsideAngularZone) {
      Object.getOwnPropertyNames(opts).forEach((key) => {
        if (typeof opts[key] === "function") {
          const fn = opts[key];
          opts[key] = (...props) => this.zone.run(() => fn(...props));
        }
      });
    }
    return createGesture(opts);
  }
};
GestureController.\u0275fac = function GestureController_Factory(t) {
  return new (t || GestureController)(i0.\u0275\u0275inject(i0.NgZone));
};
GestureController.\u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({
  token: GestureController,
  factory: GestureController.\u0275fac,
  providedIn: "root"
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(GestureController, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], function() {
    return [{
      type: i0.NgZone
    }];
  }, null);
})();
var LoadingController = class extends OverlayBaseController {
  constructor() {
    super(loadingController);
  }
};
LoadingController.\u0275fac = function LoadingController_Factory(t) {
  return new (t || LoadingController)();
};
LoadingController.\u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({
  token: LoadingController,
  factory: LoadingController.\u0275fac,
  providedIn: "root"
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(LoadingController, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], function() {
    return [];
  }, null);
})();
var MenuController = class extends MenuController$1 {
  constructor() {
    super(menuController);
  }
};
MenuController.\u0275fac = function MenuController_Factory(t) {
  return new (t || MenuController)();
};
MenuController.\u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({
  token: MenuController,
  factory: MenuController.\u0275fac,
  providedIn: "root"
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(MenuController, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], function() {
    return [];
  }, null);
})();
var ModalController = class extends OverlayBaseController {
  constructor() {
    super(modalController);
    this.angularDelegate = inject(AngularDelegate2);
    this.injector = inject(Injector2);
    this.environmentInjector = inject(EnvironmentInjector2);
  }
  create(opts) {
    return super.create(__spreadProps(__spreadValues({}, opts), {
      delegate: this.angularDelegate.create(this.environmentInjector, this.injector, "modal")
    }));
  }
};
ModalController.\u0275fac = function ModalController_Factory(t) {
  return new (t || ModalController)();
};
ModalController.\u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({
  token: ModalController,
  factory: ModalController.\u0275fac
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(ModalController, [{
    type: Injectable
  }], function() {
    return [];
  }, null);
})();
var PickerController = class extends OverlayBaseController {
  constructor() {
    super(pickerController);
  }
};
PickerController.\u0275fac = function PickerController_Factory(t) {
  return new (t || PickerController)();
};
PickerController.\u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({
  token: PickerController,
  factory: PickerController.\u0275fac,
  providedIn: "root"
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(PickerController, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], function() {
    return [];
  }, null);
})();
var PopoverController = class extends OverlayBaseController {
  constructor() {
    super(popoverController);
    this.angularDelegate = inject(AngularDelegate2);
    this.injector = inject(Injector2);
    this.environmentInjector = inject(EnvironmentInjector2);
  }
  create(opts) {
    return super.create(__spreadProps(__spreadValues({}, opts), {
      delegate: this.angularDelegate.create(this.environmentInjector, this.injector, "popover")
    }));
  }
};
var ToastController = class extends OverlayBaseController {
  constructor() {
    super(toastController);
  }
};
ToastController.\u0275fac = function ToastController_Factory(t) {
  return new (t || ToastController)();
};
ToastController.\u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({
  token: ToastController,
  factory: ToastController.\u0275fac,
  providedIn: "root"
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(ToastController, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], function() {
    return [];
  }, null);
})();
var appInitialize = (config, doc, zone) => {
  return () => {
    const win = doc.defaultView;
    if (win && typeof window !== "undefined") {
      setupConfig(__spreadProps(__spreadValues({}, config), {
        _zoneGate: (h) => zone.run(h)
      }));
      const aelFn = "__zone_symbol__addEventListener" in doc.body ? "__zone_symbol__addEventListener" : "addEventListener";
      return applyPolyfills().then(() => {
        return defineCustomElements(win, {
          exclude: ["ion-tabs", "ion-tab"],
          syncQueue: true,
          raf,
          jmp: (h) => zone.runOutsideAngular(h),
          ael(elm, eventName, cb, opts) {
            elm[aelFn](eventName, cb, opts);
          },
          rel(elm, eventName, cb, opts) {
            elm.removeEventListener(eventName, cb, opts);
          }
        });
      });
    }
  };
};
var DIRECTIVES = [IonAccordion, IonAccordionGroup, IonActionSheet, IonAlert, IonApp, IonAvatar, IonBackdrop, IonBadge, IonBreadcrumb, IonBreadcrumbs, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCheckbox, IonChip, IonCol, IonContent, IonDatetime, IonDatetimeButton, IonFab, IonFabButton, IonFabList, IonFooter, IonGrid, IonHeader, IonIcon, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonInput, IonItem, IonItemDivider, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonListHeader, IonLoading, IonMenu, IonMenuButton, IonMenuToggle, IonNavLink, IonNote, IonPicker, IonProgressBar, IonRadio, IonRadioGroup, IonRange, IonRefresher, IonRefresherContent, IonReorder, IonReorderGroup, IonRippleEffect, IonRow, IonSearchbar, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonSkeletonText, IonSpinner, IonSplitPane, IonTabBar, IonTabButton, IonText, IonTextarea, IonThumbnail, IonTitle, IonToast, IonToggle, IonToolbar];
var DECLARATIONS = [
  // generated proxies
  ...DIRECTIVES,
  // manual proxies
  IonModal,
  IonPopover,
  // ngModel accessors
  BooleanValueAccessorDirective,
  NumericValueAccessorDirective,
  RadioValueAccessorDirective,
  SelectValueAccessorDirective,
  TextValueAccessorDirective,
  // navigation
  IonTabs,
  IonRouterOutlet,
  IonBackButton,
  IonNav,
  RouterLinkDelegateDirective,
  RouterLinkWithHrefDelegateDirective,
  // validators
  IonMinValidator,
  IonMaxValidator
];
var IonicModule = class _IonicModule {
  static forRoot(config) {
    return {
      ngModule: _IonicModule,
      providers: [{
        provide: ConfigToken,
        useValue: config
      }, {
        provide: APP_INITIALIZER,
        useFactory: appInitialize,
        multi: true,
        deps: [ConfigToken, DOCUMENT, NgZone2]
      }, provideComponentInputBinding()]
    };
  }
};
IonicModule.\u0275fac = function IonicModule_Factory(t) {
  return new (t || IonicModule)();
};
IonicModule.\u0275mod = /* @__PURE__ */ i0.\u0275\u0275defineNgModule({
  type: IonicModule
});
IonicModule.\u0275inj = /* @__PURE__ */ i0.\u0275\u0275defineInjector({
  providers: [AngularDelegate2, ModalController, PopoverController],
  imports: [CommonModule]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(IonicModule, [{
    type: NgModule,
    args: [{
      declarations: DECLARATIONS,
      exports: DECLARATIONS,
      providers: [AngularDelegate2, ModalController, PopoverController],
      imports: [CommonModule]
    }]
  }], null, null);
})();

export {
  IonSkeletonText,
  IonSpinner,
  RouterLinkDelegateDirective,
  RouterLinkWithHrefDelegateDirective,
  IonicModule
};
/*! Bundled license information:

@ionic/core/dist/esm/index.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)

@ionic/core/dist/esm/app-globals-318eef52.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)

@ionic/core/dist/esm/loader.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)

@ionic/core/loader/index.es2017.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=chunk-XICHVGJY.js.map
