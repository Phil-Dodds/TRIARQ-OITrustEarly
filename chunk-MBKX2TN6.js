import{c as o,h as l}from"./chunk-CUGAVX7F.js";var h=function(b,n){var r,t,i,m="40px",c="0px",s=n.direction==="back",p=n.enteringEl,d=n.leavingEl,v=l(p),f=v.querySelector("ion-toolbar"),a=o();if(a.addElement(v).fill("both").beforeRemoveClass("ion-page-invisible"),s?a.duration(((r=n.duration)!==null&&r!==void 0?r:0)||200).easing("cubic-bezier(0.47,0,0.745,0.715)"):a.duration(((t=n.duration)!==null&&t!==void 0?t:0)||280).easing("cubic-bezier(0.36,0.66,0.04,1)").fromTo("transform","translateY(".concat(m,")"),"translateY(".concat(c,")")).fromTo("opacity",.01,1),f){var u=o();u.addElement(f),a.addAnimation(u)}if(d&&s){a.duration(((i=n.duration)!==null&&i!==void 0?i:0)||200).easing("cubic-bezier(0.47,0,0.745,0.715)");var e=o();e.addElement(l(d)).onFinish(function(g){g===1&&e.elements.length>0&&e.elements[0].style.setProperty("display","none")}).fromTo("transform","translateY(".concat(c,")"),"translateY(".concat(m,")")).fromTo("opacity",1,0),a.addAnimation(e)}return a};export{h as a};
/*! Bundled license information:

@ionic/core/dist/esm-es5/md.transition-0da92976.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
