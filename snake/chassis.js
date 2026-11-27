function fitLCD(width,height){let u=Math.max(0,Math.floor(Math.min(width/3,height/2)));return{width:3*u,height:2*u}}
function fitChassis(width,height,mobile,portrait){
 const W=Math.floor(width),H=Math.floor(height),clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 // All values match the fixed box model in the final CSS.
 const sideRail=clamp(Math.round(W*.13),112,164),bottomRail=clamp(Math.round(Math.min(W,H)*.22),94,132);
 function candidate(side){const rail=side?sideRail:bottomRail,extraW=28+(side?rail+8:0),extraH=120+(side?0:rail+4),lcd=fitLCD(W-extraW,H-extraH);return{side,rail,lcdWidth:lcd.width,lcdHeight:lcd.height,width:lcd.width+extraW,height:lcd.height+extraH}}
 const s=candidate(true),b=candidate(false);
 let chosen=mobile?(portrait?b:s):(s.lcdWidth>=b.lcdWidth?s:b);
 if(chosen.lcdWidth===0)chosen=s.lcdWidth>=b.lcdWidth?s:b;
 return chosen;
}
(function(){
const root=document.documentElement,label=document.getElementById("layoutLabel"),coarse=matchMedia("(pointer: coarse)"),area=document.querySelector(".console"),device=document.getElementById("device");
let raf=0,last=null;
function layout(){raf=0;const w=area.clientWidth,h=area.clientHeight;if(!w||!h)return;const mobile=coarse.matches||(navigator.maxTouchPoints>0&&Math.min(innerWidth,innerHeight)<=850),portrait=innerHeight>innerWidth;root.dataset.layout=mobile?"mobile":"desktop";root.dataset.orientation=portrait?"portrait":"landscape";const p=fitChassis(w,h,mobile,portrait);last=p;root.dataset.controls=p.side?"side":"bottom";for(const [k,n] of Object.entries({"device-width":p.width,"device-height":p.height,"lcd-width":p.lcdWidth,"lcd-height":p.lcdHeight,"control-rail":p.rail}))device.style.setProperty("--"+k,n+"px");label.textContent=mobile?"MOBILE / "+(portrait?"PORT":"LAND"):"DESKTOP / KB";}
function schedule(){if(!raf)raf=requestAnimationFrame(layout)}
addEventListener("resize",schedule,{passive:true});window.visualViewport?.addEventListener("resize",schedule,{passive:true});if(coarse.addEventListener)coarse.addEventListener("change",schedule);if(typeof ResizeObserver!=="undefined")new ResizeObserver(schedule).observe(area);layout();
window.__snakeChassis={get layout(){return root.dataset.layout},get orientation(){return root.dataset.orientation},get fit(){return last},map(element,x,y){const r=element.getBoundingClientRect();return{x:(x-r.left)/r.width,y:(y-r.top)/r.height}}};
})();