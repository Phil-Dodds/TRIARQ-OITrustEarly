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
  inheritAttributes
} from "./chunk-FKQOC7QR.js";
import "./chunk-DSWO3WHD.js";

// node_modules/@ionic/core/dist/esm/ion-img.entry.js
var imgCss = ":host{display:block;-o-object-fit:contain;object-fit:contain}img{display:block;width:100%;height:100%;-o-object-fit:inherit;object-fit:inherit;-o-object-position:inherit;object-position:inherit}";
var IonImgStyle0 = imgCss;
var Img = class {
  constructor(hostRef) {
    registerInstance(this, hostRef);
    this.ionImgWillLoad = createEvent(this, "ionImgWillLoad", 7);
    this.ionImgDidLoad = createEvent(this, "ionImgDidLoad", 7);
    this.ionError = createEvent(this, "ionError", 7);
    this.inheritedAttributes = {};
    this.onLoad = () => {
      this.ionImgDidLoad.emit();
    };
    this.onError = () => {
      this.ionError.emit();
    };
    this.loadSrc = void 0;
    this.loadError = void 0;
    this.alt = void 0;
    this.src = void 0;
  }
  srcChanged() {
    this.addIO();
  }
  componentWillLoad() {
    this.inheritedAttributes = inheritAttributes(this.el, ["draggable"]);
  }
  componentDidLoad() {
    this.addIO();
  }
  addIO() {
    if (this.src === void 0) {
      return;
    }
    if (typeof window !== "undefined" && "IntersectionObserver" in window && "IntersectionObserverEntry" in window && "isIntersecting" in window.IntersectionObserverEntry.prototype) {
      this.removeIO();
      this.io = new IntersectionObserver((data) => {
        if (data[data.length - 1].isIntersecting) {
          this.load();
          this.removeIO();
        }
      });
      this.io.observe(this.el);
    } else {
      setTimeout(() => this.load(), 200);
    }
  }
  load() {
    this.loadError = this.onError;
    this.loadSrc = this.src;
    this.ionImgWillLoad.emit();
  }
  removeIO() {
    if (this.io) {
      this.io.disconnect();
      this.io = void 0;
    }
  }
  render() {
    const { loadSrc, alt, onLoad, loadError, inheritedAttributes } = this;
    const { draggable } = inheritedAttributes;
    return h(Host, { key: "efff4d1bd0e54dbeff140c137eb50b803a9f6f60", class: getIonMode(this) }, h("img", { key: "3a1e0276ae67a7e40ec8c4ecd0061634573b2094", decoding: "async", src: loadSrc, alt, onLoad, onError: loadError, part: "image", draggable: isDraggable(draggable) }));
  }
  get el() {
    return getElement(this);
  }
  static get watchers() {
    return {
      "src": ["srcChanged"]
    };
  }
};
var isDraggable = (draggable) => {
  switch (draggable) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return void 0;
  }
};
Img.style = IonImgStyle0;
export {
  Img as ion_img
};
/*! Bundled license information:

@ionic/core/dist/esm/ion-img.entry.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=ion-img.entry-6GQ4I6QN.js.map
