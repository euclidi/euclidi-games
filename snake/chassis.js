function orientationTarget(beta,gamma,baseBeta,baseGamma,angle=0){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),d=(a,b)=>((a-b+540)%360)-180;
 let x=d(beta,baseBeta),y=d(gamma,baseGamma);
 if(angle===90)[x,y]=[y,-x];else if(angle===-90||angle===270)[x,y]=[-y,x];else if(Math.abs(angle)===180)[x,y]=[-x,-y];
 return {x:clamp(x*.16,-2.5,2.5),y:clamp(y*.16,-2.5,2.5)};
}
function isMobileLayout(coarse,touch,width,height){return !!(coarse||(touch>0&&Math.min(width,height)<=850));}
(function bootChassis(){
 const root=document.documentElement,device=document.getElementById("device"),button=document.getElementById("tilt"),label=document.getElementById("layoutLabel");
 const coarse=matchMedia("(pointer: coarse)"),reduced=matchMedia("(prefers-reduced-motion: reduce)");
 let mobile=false,active=false,requested=false,baseline=null,target={x:0,y:0},shown={x:0,y:0},raf=0,lastSensor=0;
 const supports=typeof window.DeviceOrientationEvent!=="undefined";
 let preferred=true;try{preferred=localStorage.getItem("snake-shell-tilt")!=="off"}catch{}
 const save=()=>{try{localStorage.setItem("snake-shell-tilt",preferred?"on":"off")}catch{}};
 function draw(){raf=0;shown.x+=(target.x-shown.x)*.16;shown.y+=(target.y-shown.y)*.16;if(Math.abs(shown.x-target.x)<.015)shown.x=target.x;if(Math.abs(shown.y-target.y)<.015)shown.y=target.y;
 device.style.setProperty("--tiltx",shown.x.toFixed(3)+"deg");device.style.setProperty("--tilty",shown.y.toFixed(3)+"deg");device.style.setProperty("--lightx",(50-shown.y*13).toFixed(1)+"%");device.style.setProperty("--lighty",(18+shown.x*12).toFixed(1)+"%");device.style.setProperty("--shadowx",(-shown.y*2).toFixed(1)+"px");device.style.setProperty("--shadowy",(12+shown.x*1.7).toFixed(1)+"px");
 if(shown.x!==target.x||shown.y!==target.y)raf=requestAnimationFrame(draw);}
 function schedule(){if(!raf)raf=requestAnimationFrame(draw)}
 function reset(){baseline=null;target={x:0,y:0};schedule()}
 function updateButton(){button.hidden=!mobile;button.disabled=!supports||reduced.matches;button.setAttribute("aria-pressed",String(active));button.textContent=reduced.matches?"MOTION OFF":!supports?"TILT N/A":active?"TILT ON":preferred&&!requested?"ENABLE TILT":"TILT OFF";}
 function onOrientation(e){if(!mobile||!active||reduced.matches||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;let angle=screen.orientation?.angle??window.orientation??0;lastSensor=performance.now();if(!baseline||baseline.angle!==angle){baseline={beta:e.beta,gamma:e.gamma,angle};target={x:0,y:0}}else target=orientationTarget(e.beta,e.gamma,baseline.beta,baseline.gamma,angle);schedule()}
 function turnOn(){if(active||!mobile||!supports||reduced.matches)return;active=true;window.addEventListener("deviceorientation",onOrientation,{passive:true});reset();updateButton()}
 function turnOff(){active=false;window.removeEventListener("deviceorientation",onOrientation);reset();updateButton()}
 function layout(){const w=window.innerWidth,h=window.innerHeight,next=isMobileLayout(coarse.matches,navigator.maxTouchPoints||0,w,h);if(next!==mobile){mobile=next;reset()}root.dataset.layout=mobile?"mobile":"desktop";root.dataset.orientation=w>h?"landscape":"portrait";label.textContent=mobile?"MOBILE / "+(w>h?"LAND":"PORT"):"DESKTOP / KB";
 if(!mobile||reduced.matches||!preferred)turnOff();else if(supports&&(typeof DeviceOrientationEvent.requestPermission!=="function"||requested))turnOn();updateButton()}
 button.addEventListener("click",async()=>{if(active){preferred=false;save();turnOff();return}preferred=true;save();if(typeof DeviceOrientationEvent.requestPermission==="function"){try{const result=await DeviceOrientationEvent.requestPermission();if(result!=="granted"){preferred=false;save();button.textContent="TILT DENIED";return}requested=true}catch{preferred=false;save();button.textContent="TILT N/A";return}}turnOn()});
 for(const m of [coarse,reduced]){if(m.addEventListener)m.addEventListener("change",layout);else m.addListener?.(layout)}
 addEventListener("resize",layout,{passive:true});addEventListener("orientationchange",()=>{reset();layout()},{passive:true});screen.orientation?.addEventListener?.("change",()=>{reset();layout()});document.addEventListener("visibilitychange",()=>{if(document.hidden)reset()});
 layout();window.__snakeChassis={get layout(){return root.dataset.layout},get orientation(){return root.dataset.orientation},get tilt(){return{...shown}},get sensorSeen(){return lastSensor>0}};
})();
