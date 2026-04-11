import{a as L}from"./chunk-FMDD3XSY.js";import{a as P}from"./chunk-3HM4YA6W.js";import{b as u}from"./chunk-42LOQ4C6.js";import{a as T,b as k,d as _,e as C}from"./chunk-52SL2LPB.js";import"./chunk-CDLZCBFH.js";import"./chunk-MBKX2TN6.js";import"./chunk-CUGAVX7F.js";import{c as v}from"./chunk-POLL2CVR.js";import"@angular/core";import{CommonModule as ot}from"@angular/common";import{RouterModule as rt}from"@angular/router";import"@angular/core";import{firstValueFrom as Xe}from"rxjs";import*as s from"@angular/core";import*as W from"@angular/common";import"@angular/core";import{CommonModule as J}from"@angular/common";import{RouterModule as K}from"@angular/router";import*as i from"@angular/core";import*as I from"@angular/common";import*as F from"@angular/router";var Z=()=>[1,2,3],ee=e=>["/delivery",e];function te(e,p){e&1&&(i.\u0275\u0275elementStart(0,"div",9),i.\u0275\u0275element(1,"ion-skeleton-text",10)(2,"ion-skeleton-text",11),i.\u0275\u0275elementEnd())}function ie(e,p){e&1&&(i.\u0275\u0275elementStart(0,"div"),i.\u0275\u0275template(1,te,3,0,"div",8),i.\u0275\u0275elementEnd()),e&2&&(i.\u0275\u0275advance(),i.\u0275\u0275property("ngForOf",i.\u0275\u0275pureFunction0(1,Z)))}function ne(e,p){if(e&1&&(i.\u0275\u0275elementStart(0,"div",12),i.\u0275\u0275text(1),i.\u0275\u0275elementEnd()),e&2){let t=i.\u0275\u0275nextContext();i.\u0275\u0275advance(),i.\u0275\u0275textInterpolate3(" \u26A0 ",t.attentionCount," cycle",t.attentionCount===1?"":"s"," need",t.attentionCount===1?"s":""," attention ")}}function oe(e,p){e&1&&(i.\u0275\u0275elementStart(0,"span",21),i.\u0275\u0275text(1,"\u26A0"),i.\u0275\u0275elementEnd())}function re(e,p){if(e&1&&(i.\u0275\u0275elementStart(0,"span"),i.\u0275\u0275text(1),i.\u0275\u0275elementEnd()),e&2){let t=i.\u0275\u0275nextContext(2).$implicit,n=i.\u0275\u0275nextContext(2);i.\u0275\u0275styleProp("color",n.nextGateDateColor(t)),i.\u0275\u0275advance(),i.\u0275\u0275textInterpolate1(" \xB7 ",n.nextGateTargetDate(t)," ")}}function ae(e,p){e&1&&(i.\u0275\u0275elementStart(0,"span",25),i.\u0275\u0275text(1,"\u2014 no target date set"),i.\u0275\u0275elementEnd())}function se(e,p){if(e&1&&(i.\u0275\u0275elementStart(0,"span",22)(1,"span",23),i.\u0275\u0275text(2),i.\u0275\u0275elementEnd(),i.\u0275\u0275template(3,re,2,3,"span",24)(4,ae,2,0,"span",20),i.\u0275\u0275elementEnd()),e&2){let t=i.\u0275\u0275nextContext().$implicit,n=i.\u0275\u0275nextContext(2);i.\u0275\u0275advance(2),i.\u0275\u0275textInterpolate1(" ",n.nextGateLabel(t)," "),i.\u0275\u0275advance(),i.\u0275\u0275property("ngIf",n.nextGateTargetDate(t)),i.\u0275\u0275advance(),i.\u0275\u0275property("ngIf",!n.nextGateTargetDate(t))}}function ce(e,p){if(e&1&&(i.\u0275\u0275elementStart(0,"span",25),i.\u0275\u0275text(1),i.\u0275\u0275elementEnd()),e&2){let t,n=i.\u0275\u0275nextContext().$implicit,o=i.\u0275\u0275nextContext(2);i.\u0275\u0275advance(),i.\u0275\u0275textInterpolate1(" ",(t=o.STAGE_LABEL[n.current_lifecycle_stage])!==null&&t!==void 0?t:n.current_lifecycle_stage," ")}}function le(e,p){if(e&1&&(i.\u0275\u0275elementStart(0,"div",9)(1,"div",13)(2,"a",14),i.\u0275\u0275text(3),i.\u0275\u0275elementEnd(),i.\u0275\u0275elementStart(4,"span",15),i.\u0275\u0275text(5),i.\u0275\u0275elementEnd(),i.\u0275\u0275elementStart(6,"span",16),i.\u0275\u0275text(7),i.\u0275\u0275elementEnd(),i.\u0275\u0275template(8,oe,2,0,"span",17),i.\u0275\u0275elementEnd(),i.\u0275\u0275elementStart(9,"div",18),i.\u0275\u0275template(10,se,5,3,"span",19)(11,ce,2,1,"span",20),i.\u0275\u0275elementEnd()()),e&2){let t,n=p.$implicit,o=i.\u0275\u0275nextContext(2);i.\u0275\u0275advance(2),i.\u0275\u0275property("routerLink",i.\u0275\u0275pureFunction1(10,ee,n.delivery_cycle_id))("title",n.cycle_title),i.\u0275\u0275advance(),i.\u0275\u0275textInterpolate1(" ",n.cycle_title," "),i.\u0275\u0275advance(2),i.\u0275\u0275textInterpolate1(" ",(t=o.STAGE_LABEL[n.current_lifecycle_stage])!==null&&t!==void 0?t:n.current_lifecycle_stage," "),i.\u0275\u0275advance(),i.\u0275\u0275styleProp("background",o.tierPillBg(n.tier_classification)),i.\u0275\u0275advance(),i.\u0275\u0275textInterpolate1(" T",o.tierShort(n.tier_classification)," "),i.\u0275\u0275advance(),i.\u0275\u0275property("ngIf",o.needsAttention(n)),i.\u0275\u0275advance(2),i.\u0275\u0275property("ngIf",o.nextGateLabel(n)),i.\u0275\u0275advance(),i.\u0275\u0275property("ngIf",!o.nextGateLabel(n))}}function de(e,p){if(e&1&&(i.\u0275\u0275elementStart(0,"div"),i.\u0275\u0275template(1,le,12,12,"div",8),i.\u0275\u0275elementEnd()),e&2){let t=i.\u0275\u0275nextContext();i.\u0275\u0275advance(),i.\u0275\u0275property("ngForOf",t.activeCycles)}}function pe(e,p){e&1&&(i.\u0275\u0275elementStart(0,"div",26),i.\u0275\u0275text(1," No active cycles assigned to you. "),i.\u0275\u0275elementStart(2,"a",27),i.\u0275\u0275text(3," + Start a Delivery Cycle "),i.\u0275\u0275elementEnd()())}var me={BRIEF:"Brief",DESIGN:"Design",SPEC:"Spec",BUILD:"Build",VALIDATE:"Validate",PILOT:"Pilot",UAT:"UAT",RELEASE:"Release",OUTCOME:"Outcome",COMPLETE:"Complete",CANCELLED:"Cancelled",ON_HOLD:"On Hold"},fe={brief_review:"Brief Review",go_to_build:"Go to Build",go_to_deploy:"Go to Deploy",go_to_release:"Go to Release",close_review:"Close Review"},A={BRIEF:"brief_review",DESIGN:"go_to_build",SPEC:"go_to_build",BUILD:"go_to_deploy",VALIDATE:"go_to_deploy",PILOT:"go_to_release",UAT:"go_to_release",RELEASE:"close_review",OUTCOME:"close_review"},ge=["COMPLETE","CANCELLED"],M=(()=>{class e{constructor(t,n){this.delivery=t,this.cdr=n,this.userId="",this.loading=!0,this.activeCycles=[],this.totalActive=0,this.STAGE_LABEL=me,this.MAX_SHOWN=3,this.TODAY=new Date().toISOString().slice(0,10)}ngOnInit(){this.delivery.listCycles({assigned_to_current_user:!0}).subscribe({next:t=>{if(t.success&&t.data){let o=(Array.isArray(t.data)?t.data:[]).filter(g=>!ge.includes(g.current_lifecycle_stage));this.totalActive=o.length,this.activeCycles=o.slice(0,this.MAX_SHOWN)}this.loading=!1,this.cdr.markForCheck()},error:()=>{this.loading=!1,this.cdr.markForCheck()}})}get attentionCount(){return this.activeCycles.filter(t=>this.needsAttention(t)).length}needsAttention(t){return!!(t.gate_records?.some(n=>n.gate_status==="blocked")||t.milestone_dates?.some(n=>n.target_date&&!n.actual_date&&n.target_date<this.TODAY))}nextGateLabel(t){let n=A[t.current_lifecycle_stage];return n?fe[n]:null}nextGateTargetDate(t){let n=A[t.current_lifecycle_stage];return n?t.milestone_dates?.find(o=>o.gate_name===n)?.target_date??null:null}nextGateDateColor(t){let n=this.nextGateTargetDate(t);return n?n<this.TODAY?"var(--triarq-color-error)":(new Date(n).getTime()-new Date(this.TODAY).getTime())/864e5<=7?"var(--triarq-color-sunray,#f5a623)":"var(--triarq-color-text-secondary)":"var(--triarq-color-text-secondary)"}tierPillBg(t){return t==="tier_1"?"#e8f5e9":t==="tier_2"?"#fff8e1":"#fce4ec"}tierShort(t){return t.replace("tier_","")}static{this.\u0275fac=function(n){return new(n||e)(i.\u0275\u0275directiveInject(L),i.\u0275\u0275directiveInject(i.ChangeDetectorRef))}}static{this.\u0275cmp=i.\u0275\u0275defineComponent({type:e,selectors:[["app-my-delivery-cycles-card"]],inputs:{userId:"userId"},standalone:!0,features:[i.\u0275\u0275StandaloneFeature],decls:11,vars:6,consts:[[1,"oi-card","oi-home-card"],[2,"display","flex","align-items","center","justify-content","space-between","margin-bottom","var(--triarq-space-md)"],[2,"margin","0","font-size","var(--triarq-text-h4)"],[4,"ngIf"],["style",`background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);
                  border-radius:0 6px 6px 0;padding:var(--triarq-space-xs) var(--triarq-space-sm);
                  font-size:var(--triarq-text-small);font-weight:500;
                  margin-bottom:var(--triarq-space-sm);`,4,"ngIf"],["style","font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);",4,"ngIf"],[2,"margin-top","var(--triarq-space-sm)","padding-top","var(--triarq-space-xs)","border-top","1px solid var(--triarq-color-border)"],["routerLink","/delivery",2,"font-size","var(--triarq-text-small)","color","var(--triarq-color-primary)","text-decoration","none"],["style",`padding:var(--triarq-space-xs) 0;
                    border-bottom:1px solid var(--triarq-color-border);`,4,"ngFor","ngForOf"],[2,"padding","var(--triarq-space-xs) 0","border-bottom","1px solid var(--triarq-color-border)"],["animated","",2,"width","60%","height","14px","border-radius","4px","margin-bottom","4px"],["animated","",2,"width","40%","height","11px","border-radius","4px"],[2,"background","#fff8e1","border-left","4px solid var(--triarq-color-sunray,#f5a623)","border-radius","0 6px 6px 0","padding","var(--triarq-space-xs) var(--triarq-space-sm)","font-size","var(--triarq-text-small)","font-weight","500","margin-bottom","var(--triarq-space-sm)"],[2,"display","flex","align-items","center","gap","var(--triarq-space-xs)","margin-bottom","2px","flex-wrap","wrap"],[2,"color","var(--triarq-color-text-primary)","text-decoration","none","font-weight","500","font-size","var(--triarq-text-small)","flex","1","min-width","0","overflow","hidden","text-overflow","ellipsis","white-space","nowrap",3,"routerLink","title"],[1,"oi-pill",2,"font-size","9px","flex-shrink","0","background","var(--triarq-color-background-subtle)"],[1,"oi-pill",2,"font-size","9px","flex-shrink","0"],["style","color:var(--triarq-color-sunray,#f5a623);flex-shrink:0;font-size:12px;","title","Needs attention",4,"ngIf"],[2,"font-size","10px","color","var(--triarq-color-text-secondary)","display","flex","align-items","center","gap","var(--triarq-space-xs)"],["style","display:flex;align-items:center;gap:4px;",4,"ngIf"],["style","font-style:italic;",4,"ngIf"],["title","Needs attention",2,"color","var(--triarq-color-sunray,#f5a623)","flex-shrink","0","font-size","12px"],[2,"display","flex","align-items","center","gap","4px"],[2,"font-weight","500","color","var(--triarq-color-text-primary)"],[3,"color",4,"ngIf"],[2,"font-style","italic"],[2,"font-size","var(--triarq-text-small)","color","var(--triarq-color-text-secondary)"],["routerLink","/delivery/cycles",2,"display","block","margin-top","var(--triarq-space-xs)","color","var(--triarq-color-primary)","text-decoration","none"]],template:function(n,o){n&1&&(i.\u0275\u0275elementStart(0,"div",0)(1,"div",1)(2,"h4",2),i.\u0275\u0275text(3,"My Delivery Cycles"),i.\u0275\u0275elementEnd()(),i.\u0275\u0275template(4,ie,2,2,"div",3)(5,ne,2,3,"div",4)(6,de,2,1,"div",3)(7,pe,4,0,"div",5),i.\u0275\u0275elementStart(8,"div",6)(9,"a",7),i.\u0275\u0275text(10),i.\u0275\u0275elementEnd()()()),n&2&&(i.\u0275\u0275advance(4),i.\u0275\u0275property("ngIf",o.loading),i.\u0275\u0275advance(),i.\u0275\u0275property("ngIf",!o.loading&&o.attentionCount>0),i.\u0275\u0275advance(),i.\u0275\u0275property("ngIf",!o.loading&&o.activeCycles.length>0),i.\u0275\u0275advance(),i.\u0275\u0275property("ngIf",!o.loading&&o.activeCycles.length===0),i.\u0275\u0275advance(3),i.\u0275\u0275textInterpolate2(" View all ",o.totalActive>0?o.totalActive+" ":"","cycle",o.totalActive===1?"":"s"," \u2192 "))},dependencies:[J,I.NgForOf,I.NgIf,K,F.RouterLink,C,T,_],styles:[`

h4[_ngcontent-%COMP%] {
  margin: 0 0 var(--triarq-space-md) 0;
}
/*# sourceMappingURL=my-delivery-cycles-card.component.css.map */`],changeDetection:0})}}return e})();import"@angular/core";import*as c from"@angular/core";import*as b from"@angular/common";function ue(e,p){if(e&1&&(c.\u0275\u0275elementStart(0,"span",6),c.\u0275\u0275text(1),c.\u0275\u0275elementEnd()),e&2){let t=c.\u0275\u0275nextContext();c.\u0275\u0275advance(),c.\u0275\u0275textInterpolate(t.items.length)}}function ye(e,p){e&1&&(c.\u0275\u0275elementStart(0,"p",7),c.\u0275\u0275text(1,"Loading\u2026"),c.\u0275\u0275elementEnd())}function _e(e,p){e&1&&(c.\u0275\u0275elementStart(0,"p",8),c.\u0275\u0275text(1," No pending actions. You're all caught up. "),c.\u0275\u0275elementEnd())}function he(e,p){if(e&1&&(c.\u0275\u0275elementStart(0,"li",11)(1,"span",12),c.\u0275\u0275text(2),c.\u0275\u0275elementEnd(),c.\u0275\u0275elementStart(3,"span",13),c.\u0275\u0275text(4),c.\u0275\u0275elementEnd()()),e&2){let t=p.$implicit;c.\u0275\u0275advance(2),c.\u0275\u0275textInterpolate(t.artifact_title),c.\u0275\u0275advance(2),c.\u0275\u0275textInterpolate(t.raci_role)}}function Ce(e,p){if(e&1&&(c.\u0275\u0275elementStart(0,"ul",9),c.\u0275\u0275template(1,he,5,2,"li",10),c.\u0275\u0275elementEnd()),e&2){let t=c.\u0275\u0275nextContext();c.\u0275\u0275advance(),c.\u0275\u0275property("ngForOf",t.items)}}var N=(()=>{class e{constructor(t,n){this.mcp=t,this.cdr=n,this.userId="",this.items=[],this.loading=!0}ngOnInit(){return v(this,null,function*(){this.loading=!1,this.cdr.markForCheck()})}static{this.\u0275fac=function(n){return new(n||e)(c.\u0275\u0275directiveInject(u),c.\u0275\u0275directiveInject(c.ChangeDetectorRef))}}static{this.\u0275cmp=c.\u0275\u0275defineComponent({type:e,selectors:[["app-my-action-queue-card"]],inputs:{userId:"userId"},decls:8,vars:4,consts:[[1,"oi-card","oi-home-card"],[1,"oi-card-header"],["class","oi-badge",4,"ngIf"],["class","oi-card-loading",4,"ngIf"],["class","oi-card-empty",4,"ngIf"],["class","oi-action-list",4,"ngIf"],[1,"oi-badge"],[1,"oi-card-loading"],[1,"oi-card-empty"],[1,"oi-action-list"],["class","oi-action-item",4,"ngFor","ngForOf"],[1,"oi-action-item"],[1,"oi-action-title"],[1,"oi-action-role"]],template:function(n,o){n&1&&(c.\u0275\u0275elementStart(0,"div",0)(1,"div",1)(2,"h4"),c.\u0275\u0275text(3,"My Action Queue"),c.\u0275\u0275elementEnd(),c.\u0275\u0275template(4,ue,2,1,"span",2),c.\u0275\u0275elementEnd(),c.\u0275\u0275template(5,ye,2,0,"p",3)(6,_e,2,0,"p",4)(7,Ce,2,1,"ul",5),c.\u0275\u0275elementEnd()),n&2&&(c.\u0275\u0275advance(4),c.\u0275\u0275property("ngIf",o.items.length>0),c.\u0275\u0275advance(),c.\u0275\u0275property("ngIf",o.loading),c.\u0275\u0275advance(),c.\u0275\u0275property("ngIf",!o.loading&&o.items.length===0),c.\u0275\u0275advance(),c.\u0275\u0275property("ngIf",!o.loading&&o.items.length>0))},dependencies:[b.NgForOf,b.NgIf],styles:[`

.oi-card-header[_ngcontent-%COMP%] {
  display: flex;
  align-items: center;
  gap: var(--triarq-space-sm);
  margin-bottom: var(--triarq-space-md);
}
h4[_ngcontent-%COMP%] {
  margin: 0;
  font-size: var(--triarq-text-h4);
}
.oi-badge[_ngcontent-%COMP%] {
  background: var(--triarq-color-primary);
  color: #fff;
  border-radius: var(--triarq-radius-pill);
  padding: 2px 8px;
  font-size: var(--triarq-text-caption);
  font-weight: var(--triarq-font-weight-bold);
}
.oi-card-empty[_ngcontent-%COMP%], .oi-card-loading[_ngcontent-%COMP%] {
  color: var(--triarq-color-text-secondary);
  font-size: var(--triarq-text-small);
}
.oi-action-list[_ngcontent-%COMP%] {
  list-style: none;
  padding: 0;
  margin: 0;
}
.oi-action-item[_ngcontent-%COMP%] {
  display: flex;
  justify-content: space-between;
  padding: var(--triarq-space-sm) 0;
  border-bottom: 1px solid var(--triarq-color-border);
  font-size: var(--triarq-text-small);
}
.oi-action-role[_ngcontent-%COMP%] {
  color: var(--triarq-color-primary);
  font-weight: var(--triarq-font-weight-medium);
}
/*# sourceMappingURL=my-action-queue-card.component.css.map */`],changeDetection:0})}}return e})();import"@angular/core";import*as r from"@angular/core";import*as q from"@angular/common";function Ie(e,p){if(e&1&&(r.\u0275\u0275elementStart(0,"span",5),r.\u0275\u0275text(1),r.\u0275\u0275elementEnd()),e&2){let t=r.\u0275\u0275nextContext();r.\u0275\u0275advance(),r.\u0275\u0275textInterpolate(t.notifications.length)}}function Me(e,p){e&1&&(r.\u0275\u0275elementStart(0,"p",6),r.\u0275\u0275text(1,"Loading\u2026"),r.\u0275\u0275elementEnd())}function be(e,p){e&1&&(r.\u0275\u0275elementStart(0,"p",6),r.\u0275\u0275text(1," No new notifications. "),r.\u0275\u0275elementEnd())}function qe(e,p){if(e&1){let t=r.\u0275\u0275getCurrentView();r.\u0275\u0275elementStart(0,"li",9)(1,"span",10),r.\u0275\u0275text(2),r.\u0275\u0275elementEnd(),r.\u0275\u0275elementStart(3,"button",11),r.\u0275\u0275listener("click",function(){let o=r.\u0275\u0275restoreView(t).$implicit,g=r.\u0275\u0275nextContext(2);return r.\u0275\u0275resetView(g.dismiss(o.id))}),r.\u0275\u0275text(4,"\u2715"),r.\u0275\u0275elementEnd()()}if(e&2){let t=p.$implicit;r.\u0275\u0275advance(2),r.\u0275\u0275textInterpolate(t.notification_body)}}function De(e,p){if(e&1&&(r.\u0275\u0275elementStart(0,"ul",7),r.\u0275\u0275template(1,qe,5,1,"li",8),r.\u0275\u0275elementEnd()),e&2){let t=r.\u0275\u0275nextContext();r.\u0275\u0275advance(),r.\u0275\u0275property("ngForOf",t.notifications)}}var z=(()=>{class e{constructor(t,n){this.mcp=t,this.cdr=n,this.userId="",this.notifications=[],this.loading=!0}ngOnInit(){return v(this,null,function*(){this.loading=!1,this.cdr.markForCheck()})}dismiss(t){return v(this,null,function*(){this.notifications=this.notifications.filter(n=>n.id!==t),this.cdr.markForCheck()})}static{this.\u0275fac=function(n){return new(n||e)(r.\u0275\u0275directiveInject(u),r.\u0275\u0275directiveInject(r.ChangeDetectorRef))}}static{this.\u0275cmp=r.\u0275\u0275defineComponent({type:e,selectors:[["app-my-notifications-card"]],inputs:{userId:"userId"},decls:8,vars:4,consts:[[1,"oi-card","oi-home-card"],[1,"oi-card-header"],["class","oi-badge",4,"ngIf"],["class","oi-card-empty",4,"ngIf"],["class","oi-notif-list",4,"ngIf"],[1,"oi-badge"],[1,"oi-card-empty"],[1,"oi-notif-list"],["class","oi-notif-item",4,"ngFor","ngForOf"],[1,"oi-notif-item"],[1,"oi-notif-body"],["aria-label","Dismiss",1,"oi-dismiss-btn",3,"click"]],template:function(n,o){n&1&&(r.\u0275\u0275elementStart(0,"div",0)(1,"div",1)(2,"h4"),r.\u0275\u0275text(3,"Notifications"),r.\u0275\u0275elementEnd(),r.\u0275\u0275template(4,Ie,2,1,"span",2),r.\u0275\u0275elementEnd(),r.\u0275\u0275template(5,Me,2,0,"p",3)(6,be,2,0,"p",3)(7,De,2,1,"ul",4),r.\u0275\u0275elementEnd()),n&2&&(r.\u0275\u0275advance(4),r.\u0275\u0275property("ngIf",o.notifications.length>0),r.\u0275\u0275advance(),r.\u0275\u0275property("ngIf",o.loading),r.\u0275\u0275advance(),r.\u0275\u0275property("ngIf",!o.loading&&o.notifications.length===0),r.\u0275\u0275advance(),r.\u0275\u0275property("ngIf",!o.loading&&o.notifications.length>0))},dependencies:[q.NgForOf,q.NgIf],styles:[`

.oi-card-header[_ngcontent-%COMP%] {
  display: flex;
  align-items: center;
  gap: var(--triarq-space-sm);
  margin-bottom: var(--triarq-space-md);
}
h4[_ngcontent-%COMP%] {
  margin: 0;
  font-size: var(--triarq-text-h4);
}
.oi-badge[_ngcontent-%COMP%] {
  background: var(--triarq-color-accent);
  color: #fff;
  border-radius: var(--triarq-radius-pill);
  padding: 2px 8px;
  font-size: var(--triarq-text-caption);
  font-weight: var(--triarq-font-weight-bold);
}
.oi-card-empty[_ngcontent-%COMP%] {
  color: var(--triarq-color-text-secondary);
  font-size: var(--triarq-text-small);
}
.oi-notif-list[_ngcontent-%COMP%] {
  list-style: none;
  padding: 0;
  margin: 0;
}
.oi-notif-item[_ngcontent-%COMP%] {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--triarq-space-sm) 0;
  border-bottom: 1px solid var(--triarq-color-border);
  gap: var(--triarq-space-sm);
}
.oi-notif-body[_ngcontent-%COMP%] {
  font-size: var(--triarq-text-small);
  flex: 1;
}
.oi-dismiss-btn[_ngcontent-%COMP%] {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--triarq-color-text-disabled);
  flex-shrink: 0;
  padding: 0;
  font-size: 12px;
}
.oi-dismiss-btn[_ngcontent-%COMP%]:hover {
  color: var(--triarq-color-text-secondary);
}
/*# sourceMappingURL=my-notifications-card.component.css.map */`],changeDetection:0})}}return e})();import"@angular/core";import{firstValueFrom as w}from"rxjs";import*as d from"@angular/core";import*as R from"@angular/common";function Ee(e,p){e&1&&(d.\u0275\u0275elementStart(0,"p",3),d.\u0275\u0275text(1,"Loading\u2026"),d.\u0275\u0275elementEnd())}function Oe(e,p){if(e&1&&(d.\u0275\u0275elementStart(0,"div",4)(1,"div",5)(2,"span",6),d.\u0275\u0275text(3),d.\u0275\u0275elementEnd(),d.\u0275\u0275elementStart(4,"span",7),d.\u0275\u0275text(5,"Divisions"),d.\u0275\u0275elementEnd()(),d.\u0275\u0275elementStart(6,"div",5)(7,"span",6),d.\u0275\u0275text(8),d.\u0275\u0275elementEnd(),d.\u0275\u0275elementStart(9,"span",7),d.\u0275\u0275text(10,"Users"),d.\u0275\u0275elementEnd()(),d.\u0275\u0275elementStart(11,"div",5)(12,"span",6),d.\u0275\u0275text(13),d.\u0275\u0275elementEnd(),d.\u0275\u0275elementStart(14,"span",7),d.\u0275\u0275text(15,"Artifacts"),d.\u0275\u0275elementEnd()()()),e&2){let t=d.\u0275\u0275nextContext();d.\u0275\u0275advance(3),d.\u0275\u0275textInterpolate(t.stats.divisionCount),d.\u0275\u0275advance(5),d.\u0275\u0275textInterpolate(t.stats.userCount),d.\u0275\u0275advance(5),d.\u0275\u0275textInterpolate(t.stats.artifactCount)}}var U=(()=>{class e{constructor(t,n){this.mcp=t,this.cdr=n,this.stats={divisionCount:0,userCount:0,artifactCount:0},this.loading=!0}ngOnInit(){return v(this,null,function*(){try{let[t,n,o]=yield Promise.all([w(this.mcp.call("division","list_divisions",{})),w(this.mcp.call("division","list_users",{})),w(this.mcp.call("document","list_documents",{limit:1}))]);this.stats={divisionCount:t.data?.length??0,userCount:n.data?.length??0,artifactCount:o.data?.total??0}}catch{}finally{this.loading=!1,this.cdr.markForCheck()}})}static{this.\u0275fac=function(n){return new(n||e)(d.\u0275\u0275directiveInject(u),d.\u0275\u0275directiveInject(d.ChangeDetectorRef))}}static{this.\u0275cmp=d.\u0275\u0275defineComponent({type:e,selectors:[["app-system-health-card"]],decls:5,vars:2,consts:[[1,"oi-card","oi-home-card"],["class","oi-card-empty",4,"ngIf"],["class","oi-health-stats",4,"ngIf"],[1,"oi-card-empty"],[1,"oi-health-stats"],[1,"oi-stat"],[1,"oi-stat-value"],[1,"oi-stat-label"]],template:function(n,o){n&1&&(d.\u0275\u0275elementStart(0,"div",0)(1,"h4"),d.\u0275\u0275text(2,"System Health"),d.\u0275\u0275elementEnd(),d.\u0275\u0275template(3,Ee,2,0,"p",1)(4,Oe,16,3,"div",2),d.\u0275\u0275elementEnd()),n&2&&(d.\u0275\u0275advance(3),d.\u0275\u0275property("ngIf",o.loading),d.\u0275\u0275advance(),d.\u0275\u0275property("ngIf",!o.loading))},dependencies:[R.NgIf],styles:[`

h4[_ngcontent-%COMP%] {
  margin: 0 0 var(--triarq-space-md) 0;
  font-size: var(--triarq-text-h4);
}
.oi-health-stats[_ngcontent-%COMP%] {
  display: flex;
  gap: var(--triarq-space-lg);
}
.oi-stat[_ngcontent-%COMP%] {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.oi-stat-value[_ngcontent-%COMP%] {
  font-size: var(--triarq-text-h3);
  font-weight: var(--triarq-font-weight-bold);
  color: var(--triarq-color-primary);
}
.oi-stat-label[_ngcontent-%COMP%] {
  font-size: var(--triarq-text-caption);
  color: var(--triarq-color-text-secondary);
}
.oi-card-empty[_ngcontent-%COMP%] {
  color: var(--triarq-color-text-secondary);
  font-size: var(--triarq-text-small);
}
/*# sourceMappingURL=system-health-card.component.css.map */`],changeDetection:0})}}return e})();import"@angular/core";import{firstValueFrom as Te}from"rxjs";import*as a from"@angular/core";import*as D from"@angular/router";import*as S from"@angular/common";function ke(e,p){e&1&&(a.\u0275\u0275elementStart(0,"p",5),a.\u0275\u0275text(1,"Loading\u2026"),a.\u0275\u0275elementEnd())}function Pe(e,p){e&1&&(a.\u0275\u0275elementStart(0,"p",5),a.\u0275\u0275text(1," No canonical documents yet. "),a.\u0275\u0275elementEnd())}function Le(e,p){if(e&1){let t=a.\u0275\u0275getCurrentView();a.\u0275\u0275elementStart(0,"li",8),a.\u0275\u0275listener("click",function(){let o=a.\u0275\u0275restoreView(t).$implicit,g=a.\u0275\u0275nextContext(2);return a.\u0275\u0275resetView(g.openArtifact(o.id))}),a.\u0275\u0275elementStart(1,"span",9),a.\u0275\u0275text(2),a.\u0275\u0275elementEnd(),a.\u0275\u0275elementStart(3,"span"),a.\u0275\u0275text(4),a.\u0275\u0275elementEnd()()}if(e&2){let t=p.$implicit;a.\u0275\u0275advance(2),a.\u0275\u0275textInterpolate(t.artifact_title),a.\u0275\u0275advance(),a.\u0275\u0275classMapInterpolate1("oi-status-pill status-",t.lifecycle_status,""),a.\u0275\u0275advance(),a.\u0275\u0275textInterpolate(t.lifecycle_status)}}function Ae(e,p){if(e&1&&(a.\u0275\u0275elementStart(0,"ul",6),a.\u0275\u0275template(1,Le,5,5,"li",7),a.\u0275\u0275elementEnd()),e&2){let t=a.\u0275\u0275nextContext();a.\u0275\u0275advance(),a.\u0275\u0275property("ngForOf",t.artifacts)}}var H=(()=>{class e{constructor(t,n,o){this.mcp=t,this.router=n,this.cdr=o,this.userId="",this.artifacts=[],this.loading=!0}ngOnInit(){return v(this,null,function*(){try{let t=yield Te(this.mcp.call("document","list_documents",{lifecycle_status:"canon",limit:5}));this.artifacts=t.data?.artifacts??[]}catch{this.artifacts=[]}finally{this.loading=!1,this.cdr.markForCheck()}})}openArtifact(t){this.router.navigate(["/library",t])}static{this.\u0275fac=function(n){return new(n||e)(a.\u0275\u0275directiveInject(u),a.\u0275\u0275directiveInject(D.Router),a.\u0275\u0275directiveInject(a.ChangeDetectorRef))}}static{this.\u0275cmp=a.\u0275\u0275defineComponent({type:e,selectors:[["app-oi-library-card"]],inputs:{userId:"userId"},decls:9,vars:3,consts:[[1,"oi-card","oi-home-card"],[1,"oi-card-header"],["routerLink","/library",1,"oi-card-link"],["class","oi-card-empty",4,"ngIf"],["class","oi-artifact-list",4,"ngIf"],[1,"oi-card-empty"],[1,"oi-artifact-list"],["class","oi-artifact-item",3,"click",4,"ngFor","ngForOf"],[1,"oi-artifact-item",3,"click"],[1,"oi-artifact-title"]],template:function(n,o){n&1&&(a.\u0275\u0275elementStart(0,"div",0)(1,"div",1)(2,"h4"),a.\u0275\u0275text(3,"OI Library"),a.\u0275\u0275elementEnd(),a.\u0275\u0275elementStart(4,"a",2),a.\u0275\u0275text(5,"View all \u2192"),a.\u0275\u0275elementEnd()(),a.\u0275\u0275template(6,ke,2,0,"p",3)(7,Pe,2,0,"p",3)(8,Ae,2,1,"ul",4),a.\u0275\u0275elementEnd()),n&2&&(a.\u0275\u0275advance(6),a.\u0275\u0275property("ngIf",o.loading),a.\u0275\u0275advance(),a.\u0275\u0275property("ngIf",!o.loading&&o.artifacts.length===0),a.\u0275\u0275advance(),a.\u0275\u0275property("ngIf",!o.loading&&o.artifacts.length>0))},dependencies:[S.NgForOf,S.NgIf,_,D.RouterLink],styles:[`

.oi-card-header[_ngcontent-%COMP%] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--triarq-space-md);
}
h4[_ngcontent-%COMP%] {
  margin: 0;
  font-size: var(--triarq-text-h4);
}
.oi-card-link[_ngcontent-%COMP%] {
  font-size: var(--triarq-text-small);
  color: var(--triarq-color-primary);
  text-decoration: none;
}
.oi-card-empty[_ngcontent-%COMP%] {
  color: var(--triarq-color-text-secondary);
  font-size: var(--triarq-text-small);
}
.oi-artifact-list[_ngcontent-%COMP%] {
  list-style: none;
  padding: 0;
  margin: 0;
}
.oi-artifact-item[_ngcontent-%COMP%] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--triarq-space-sm) 0;
  border-bottom: 1px solid var(--triarq-color-border);
  cursor: pointer;
}
.oi-artifact-item[_ngcontent-%COMP%]:hover {
  background: rgba(37, 112, 153, 0.04);
}
.oi-artifact-title[_ngcontent-%COMP%] {
  font-size: var(--triarq-text-small);
  flex: 1;
}
/*# sourceMappingURL=oi-library-card.component.css.map */`],changeDetection:0})}}return e})();import"@angular/core";import{firstValueFrom as Ne}from"rxjs";import*as l from"@angular/core";import*as E from"@angular/common";import*as j from"@angular/router";function ze(e,p){e&1&&(l.\u0275\u0275elementStart(0,"p",5),l.\u0275\u0275text(1,"Loading\u2026"),l.\u0275\u0275elementEnd())}function Re(e,p){e&1&&(l.\u0275\u0275elementStart(0,"p",5),l.\u0275\u0275text(1," No Divisions created yet. Go to Manage to create the nine Trust Divisions. "),l.\u0275\u0275elementEnd())}function Ue(e,p){if(e&1&&(l.\u0275\u0275elementStart(0,"span",11),l.\u0275\u0275text(1),l.\u0275\u0275elementEnd()),e&2){let t=l.\u0275\u0275nextContext().$implicit;l.\u0275\u0275advance(),l.\u0275\u0275textInterpolate(t.division_type_label)}}function He(e,p){if(e&1&&(l.\u0275\u0275elementStart(0,"li",8)(1,"span",9),l.\u0275\u0275text(2),l.\u0275\u0275elementEnd(),l.\u0275\u0275template(3,Ue,2,1,"span",10),l.\u0275\u0275elementEnd()),e&2){let t=p.$implicit;l.\u0275\u0275advance(2),l.\u0275\u0275textInterpolate(t.division_name),l.\u0275\u0275advance(),l.\u0275\u0275property("ngIf",t.division_type_label)}}function je(e,p){if(e&1&&(l.\u0275\u0275elementStart(0,"ul",6),l.\u0275\u0275template(1,He,4,2,"li",7),l.\u0275\u0275elementEnd()),e&2){let t=l.\u0275\u0275nextContext();l.\u0275\u0275advance(),l.\u0275\u0275property("ngForOf",t.divisions)}}var G=(()=>{class e{constructor(t,n){this.mcp=t,this.cdr=n,this.divisions=[],this.loading=!0}ngOnInit(){return v(this,null,function*(){try{let t=yield Ne(this.mcp.call("division","list_divisions",{}));this.divisions=t.data??[]}catch{this.divisions=[]}finally{this.loading=!1,this.cdr.markForCheck()}})}static{this.\u0275fac=function(n){return new(n||e)(l.\u0275\u0275directiveInject(u),l.\u0275\u0275directiveInject(l.ChangeDetectorRef))}}static{this.\u0275cmp=l.\u0275\u0275defineComponent({type:e,selectors:[["app-divisions-card"]],decls:9,vars:3,consts:[[1,"oi-card","oi-home-card"],[1,"oi-card-header"],["routerLink","/admin/divisions",1,"oi-card-link"],["class","oi-card-empty",4,"ngIf"],["class","oi-division-list",4,"ngIf"],[1,"oi-card-empty"],[1,"oi-division-list"],["class","oi-division-item",4,"ngFor","ngForOf"],[1,"oi-division-item"],[1,"oi-division-name"],["class","oi-division-label",4,"ngIf"],[1,"oi-division-label"]],template:function(n,o){n&1&&(l.\u0275\u0275elementStart(0,"div",0)(1,"div",1)(2,"h4"),l.\u0275\u0275text(3,"Divisions"),l.\u0275\u0275elementEnd(),l.\u0275\u0275elementStart(4,"a",2),l.\u0275\u0275text(5,"Manage \u2192"),l.\u0275\u0275elementEnd()(),l.\u0275\u0275template(6,ze,2,0,"p",3)(7,Re,2,0,"p",3)(8,je,2,1,"ul",4),l.\u0275\u0275elementEnd()),n&2&&(l.\u0275\u0275advance(6),l.\u0275\u0275property("ngIf",o.loading),l.\u0275\u0275advance(),l.\u0275\u0275property("ngIf",!o.loading&&o.divisions.length===0),l.\u0275\u0275advance(),l.\u0275\u0275property("ngIf",!o.loading&&o.divisions.length>0))},dependencies:[E.NgForOf,E.NgIf,_,j.RouterLink],styles:[`

.oi-card-header[_ngcontent-%COMP%] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--triarq-space-md);
}
h4[_ngcontent-%COMP%] {
  margin: 0;
  font-size: var(--triarq-text-h4);
}
.oi-card-link[_ngcontent-%COMP%] {
  font-size: var(--triarq-text-small);
  color: var(--triarq-color-primary);
  text-decoration: none;
}
.oi-card-empty[_ngcontent-%COMP%] {
  color: var(--triarq-color-text-secondary);
  font-size: var(--triarq-text-small);
}
.oi-division-list[_ngcontent-%COMP%] {
  list-style: none;
  padding: 0;
  margin: 0;
}
.oi-division-item[_ngcontent-%COMP%] {
  display: flex;
  justify-content: space-between;
  padding: var(--triarq-space-xs) 0;
  border-bottom: 1px solid var(--triarq-color-border);
  font-size: var(--triarq-text-small);
}
.oi-division-label[_ngcontent-%COMP%] {
  color: var(--triarq-color-text-secondary);
  font-size: var(--triarq-text-caption);
}
/*# sourceMappingURL=divisions-card.component.css.map */`],changeDetection:0})}}return e})();import"@angular/core";import{firstValueFrom as Be}from"rxjs";import*as m from"@angular/core";import*as B from"@angular/common";import*as V from"@angular/router";function Ve(e,p){e&1&&(m.\u0275\u0275elementStart(0,"p",5),m.\u0275\u0275text(1,"Loading\u2026"),m.\u0275\u0275elementEnd())}function $e(e,p){if(e&1&&(m.\u0275\u0275elementStart(0,"div",6)(1,"span",7),m.\u0275\u0275text(2),m.\u0275\u0275elementEnd(),m.\u0275\u0275elementStart(3,"span",8),m.\u0275\u0275text(4,"total users"),m.\u0275\u0275elementEnd()()),e&2){let t=m.\u0275\u0275nextContext();m.\u0275\u0275advance(2),m.\u0275\u0275textInterpolate(t.totalUsers)}}var $=(()=>{class e{constructor(t,n){this.mcp=t,this.cdr=n,this.totalUsers=0,this.loading=!0}ngOnInit(){return v(this,null,function*(){try{let t=yield Be(this.mcp.call("division","list_users",{}));this.totalUsers=t.data?.length??0}catch{this.totalUsers=0}finally{this.loading=!1,this.cdr.markForCheck()}})}static{this.\u0275fac=function(n){return new(n||e)(m.\u0275\u0275directiveInject(u),m.\u0275\u0275directiveInject(m.ChangeDetectorRef))}}static{this.\u0275cmp=m.\u0275\u0275defineComponent({type:e,selectors:[["app-user-management-card"]],decls:8,vars:2,consts:[[1,"oi-card","oi-home-card"],[1,"oi-card-header"],["routerLink","/admin/users",1,"oi-card-link"],["class","oi-card-empty",4,"ngIf"],["class","oi-user-stats",4,"ngIf"],[1,"oi-card-empty"],[1,"oi-user-stats"],[1,"oi-stat-value"],[1,"oi-stat-label"]],template:function(n,o){n&1&&(m.\u0275\u0275elementStart(0,"div",0)(1,"div",1)(2,"h4"),m.\u0275\u0275text(3,"User Management"),m.\u0275\u0275elementEnd(),m.\u0275\u0275elementStart(4,"a",2),m.\u0275\u0275text(5,"Manage \u2192"),m.\u0275\u0275elementEnd()(),m.\u0275\u0275template(6,Ve,2,0,"p",3)(7,$e,5,1,"div",4),m.\u0275\u0275elementEnd()),n&2&&(m.\u0275\u0275advance(6),m.\u0275\u0275property("ngIf",o.loading),m.\u0275\u0275advance(),m.\u0275\u0275property("ngIf",!o.loading))},dependencies:[B.NgIf,_,V.RouterLink],styles:[`

.oi-card-header[_ngcontent-%COMP%] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--triarq-space-md);
}
h4[_ngcontent-%COMP%] {
  margin: 0;
  font-size: var(--triarq-text-h4);
}
.oi-card-link[_ngcontent-%COMP%] {
  font-size: var(--triarq-text-small);
  color: var(--triarq-color-primary);
  text-decoration: none;
}
.oi-card-empty[_ngcontent-%COMP%] {
  color: var(--triarq-color-text-secondary);
  font-size: var(--triarq-text-small);
}
.oi-user-stats[_ngcontent-%COMP%] {
  display: flex;
  align-items: baseline;
  gap: var(--triarq-space-sm);
}
.oi-stat-value[_ngcontent-%COMP%] {
  font-size: var(--triarq-text-h3);
  font-weight: var(--triarq-font-weight-bold);
  color: var(--triarq-color-primary);
}
.oi-stat-label[_ngcontent-%COMP%] {
  font-size: var(--triarq-text-small);
  color: var(--triarq-color-text-secondary);
}
/*# sourceMappingURL=user-management-card.component.css.map */`],changeDetection:0})}}return e})();import"@angular/core";import*as y from"@angular/core";var Q=(()=>{class e{static{this.\u0275fac=function(n){return new(n||e)}}static{this.\u0275cmp=y.\u0275\u0275defineComponent({type:e,selectors:[["app-embedded-chat-card"]],decls:7,vars:0,consts:[[1,"oi-card","oi-home-card","oi-card-shell"],[1,"oi-shell-message"],[1,"oi-shell-sub"]],template:function(n,o){n&1&&(y.\u0275\u0275elementStart(0,"div",0)(1,"h4"),y.\u0275\u0275text(2,"OI Assistant"),y.\u0275\u0275elementEnd(),y.\u0275\u0275elementStart(3,"p",1),y.\u0275\u0275text(4," AI-powered knowledge chat is coming in Build B. "),y.\u0275\u0275elementEnd(),y.\u0275\u0275elementStart(5,"p",2),y.\u0275\u0275text(6," You'll be able to ask questions across your Division's knowledge library and receive cited, source-linked answers. "),y.\u0275\u0275elementEnd()())},styles:[`

h4[_ngcontent-%COMP%] {
  margin: 0 0 var(--triarq-space-sm) 0;
  font-size: var(--triarq-text-h4);
}
.oi-card-shell[_ngcontent-%COMP%] {
  border: 1px dashed var(--triarq-color-border);
}
.oi-shell-message[_ngcontent-%COMP%] {
  color: var(--triarq-color-text-secondary);
  font-size: var(--triarq-text-small);
  margin: 0 0 var(--triarq-space-xs) 0;
}
.oi-shell-sub[_ngcontent-%COMP%] {
  color: var(--triarq-color-text-disabled);
  font-size: var(--triarq-text-caption);
  margin: 0;
}
/*# sourceMappingURL=embedded-chat-card.component.css.map */`],changeDetection:0})}}return e})();import"@angular/core";import*as f from"@angular/core";var Y=(()=>{class e{constructor(){this.displayName=""}static{this.\u0275fac=function(n){return new(n||e)}}static{this.\u0275cmp=f.\u0275\u0275defineComponent({type:e,selectors:[["app-onboarding-message-card"]],inputs:{displayName:"displayName"},decls:7,vars:1,consts:[[1,"oi-card","oi-onboarding-card"],[1,"oi-onboarding-primary"],[1,"oi-onboarding-secondary"]],template:function(n,o){n&1&&(f.\u0275\u0275elementStart(0,"div",0)(1,"h3"),f.\u0275\u0275text(2),f.\u0275\u0275elementEnd(),f.\u0275\u0275elementStart(3,"p",1),f.\u0275\u0275text(4," You're not assigned to any Division yet. "),f.\u0275\u0275elementEnd(),f.\u0275\u0275elementStart(5,"p",2),f.\u0275\u0275text(6," Contact your System Admin to be assigned to a Division. Once assigned, your home screen will show your workspace cards. "),f.\u0275\u0275elementEnd()()),n&2&&(f.\u0275\u0275advance(2),f.\u0275\u0275textInterpolate1("Welcome, ",o.displayName,""))},styles:[`

.oi-onboarding-card[_ngcontent-%COMP%] {
  max-width: 520px;
  margin: 64px auto;
  text-align: center;
  padding: var(--triarq-space-2xl);
}
h3[_ngcontent-%COMP%] {
  color: var(--triarq-color-primary);
  margin-bottom: var(--triarq-space-md);
}
.oi-onboarding-primary[_ngcontent-%COMP%] {
  font-size: var(--triarq-text-body);
  font-weight: var(--triarq-font-weight-medium);
}
.oi-onboarding-secondary[_ngcontent-%COMP%] {
  font-size: var(--triarq-text-small);
  color: var(--triarq-color-text-secondary);
}
/*# sourceMappingURL=onboarding-message-card.component.css.map */`],changeDetection:0})}}return e})();function Je(e,p){e&1&&(s.\u0275\u0275elementStart(0,"div",4),s.\u0275\u0275element(1,"ion-spinner",5),s.\u0275\u0275elementStart(2,"p"),s.\u0275\u0275text(3,"Loading your workspace\u2026"),s.\u0275\u0275elementEnd()())}function Ke(e,p){if(e&1&&s.\u0275\u0275element(0,"app-onboarding-message-card",6),e&2){let t,n=s.\u0275\u0275nextContext();s.\u0275\u0275property("displayName",(t=n.profile==null?null:n.profile.display_name)!==null&&t!==void 0?t:"")}}function Ze(e,p){e&1&&s.\u0275\u0275element(0,"app-system-health-card")}function et(e,p){e&1&&s.\u0275\u0275element(0,"app-divisions-card")}function tt(e,p){e&1&&s.\u0275\u0275element(0,"app-user-management-card")}function it(e,p){if(e&1&&s.\u0275\u0275element(0,"app-my-delivery-cycles-card",8),e&2){let t,n=s.\u0275\u0275nextContext(2);s.\u0275\u0275property("userId",(t=n.profile==null?null:n.profile.id)!==null&&t!==void 0?t:"")}}function nt(e,p){if(e&1&&(s.\u0275\u0275elementStart(0,"div",7),s.\u0275\u0275element(1,"app-my-action-queue-card",8)(2,"app-my-notifications-card",8),s.\u0275\u0275template(3,Ze,1,0,"app-system-health-card",9),s.\u0275\u0275element(4,"app-oi-library-card",8),s.\u0275\u0275template(5,et,1,0,"app-divisions-card",9)(6,tt,1,0,"app-user-management-card",9)(7,it,1,1,"app-my-delivery-cycles-card",10),s.\u0275\u0275element(8,"app-embedded-chat-card"),s.\u0275\u0275elementEnd()),e&2){let t,n,o,g=s.\u0275\u0275nextContext();s.\u0275\u0275advance(),s.\u0275\u0275property("userId",(t=g.profile==null?null:g.profile.id)!==null&&t!==void 0?t:""),s.\u0275\u0275advance(),s.\u0275\u0275property("userId",(n=g.profile==null?null:g.profile.id)!==null&&n!==void 0?n:""),s.\u0275\u0275advance(),s.\u0275\u0275property("ngIf",g.showSystemHealth),s.\u0275\u0275advance(),s.\u0275\u0275property("userId",(o=g.profile==null?null:g.profile.id)!==null&&o!==void 0?o:""),s.\u0275\u0275advance(),s.\u0275\u0275property("ngIf",g.showDivisions),s.\u0275\u0275advance(),s.\u0275\u0275property("ngIf",g.showUserManagement),s.\u0275\u0275advance(),s.\u0275\u0275property("ngIf",g.showDeliveryCycles)}}var X=(()=>{class e{constructor(t,n,o){this.profileService=t,this.mcp=n,this.cdr=o,this.profile=null,this.role=null,this.hasDivision=!1,this.loading=!0}ngOnInit(){return v(this,null,function*(){this.profile=yield this.profileService.loadProfile(),this.role=this.profile?.system_role??null,this.profile&&(yield this.checkDivisionMembership()),this.loading=!1,this.cdr.markForCheck()})}checkDivisionMembership(){return v(this,null,function*(){if(this.role==="phil"||this.role==="admin"){this.hasDivision=!0,this.profileService.setHasDivision(!0);return}try{let n=(yield Xe(this.mcp.call("division","get_user_divisions",{user_id:this.profile.id}))).data?.all_accessible_divisions??[];this.hasDivision=n.length>0,this.profileService.setHasDivision(this.hasDivision)}catch{this.hasDivision=!1}})}get isPhil(){return this.role==="phil"}get isDS(){return this.role==="ds"}get isCB(){return this.role==="cb"}get isCE(){return this.role==="ce"}get isAdmin(){return this.role==="admin"}get showSystemHealth(){return this.isPhil}get showDivisions(){return this.isPhil||this.isAdmin}get showUserManagement(){return this.isAdmin}get showDeliveryCycles(){return this.isDS||this.isCB}get showOnboarding(){return!this.hasDivision&&!this.loading&&!this.isPhil&&!this.isAdmin}get showMainCards(){return this.loading?!1:this.isPhil||this.isAdmin?!0:this.hasDivision}static{this.\u0275fac=function(n){return new(n||e)(s.\u0275\u0275directiveInject(P),s.\u0275\u0275directiveInject(u),s.\u0275\u0275directiveInject(s.ChangeDetectorRef))}}static{this.\u0275cmp=s.\u0275\u0275defineComponent({type:e,selectors:[["app-home"]],decls:4,vars:3,consts:[[1,"oi-home-screen"],["class","oi-home-loading",4,"ngIf"],[3,"displayName",4,"ngIf"],["class","oi-card-grid",4,"ngIf"],[1,"oi-home-loading"],["name","crescent","color","primary"],[3,"displayName"],[1,"oi-card-grid"],[3,"userId"],[4,"ngIf"],[3,"userId",4,"ngIf"]],template:function(n,o){n&1&&(s.\u0275\u0275elementStart(0,"div",0),s.\u0275\u0275template(1,Je,4,0,"div",1)(2,Ke,1,1,"app-onboarding-message-card",2)(3,nt,9,7,"div",3),s.\u0275\u0275elementEnd()),n&2&&(s.\u0275\u0275advance(),s.\u0275\u0275property("ngIf",o.loading),s.\u0275\u0275advance(),s.\u0275\u0275property("ngIf",o.showOnboarding),s.\u0275\u0275advance(),s.\u0275\u0275property("ngIf",o.showMainCards))},dependencies:[W.NgIf,k,M,N,z,U,H,G,$,Q,Y],encapsulation:2,changeDetection:0})}}return e})();import*as O from"@angular/core";var Ei=(()=>{class e{static{this.\u0275fac=function(n){return new(n||e)}}static{this.\u0275mod=O.\u0275\u0275defineNgModule({type:e})}static{this.\u0275inj=O.\u0275\u0275defineInjector({imports:[ot,C,M,rt.forChild([{path:"",component:X}])]})}}return e})();export{Ei as HomeModule};
