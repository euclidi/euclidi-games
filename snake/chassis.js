function orientationTarget(beta,gamma,baseBeta,baseGamma,angle=0,strength=1){
 const d=(a,b)=>((a-b+540)%360)-180;
 let x=d(beta,baseBeta),y=d(gamma,baseGamma);
 if(angle===90)[x,y]=[y,-x];else if(angle===-90||angle===270)[x,y]=[-y,x];else if(Math.abs(angle)===180)[x,y]=[-x,-y];
 const m=Math.hypot(x,y), dead=1.25, gain=.30*Math.max(.25,Math.min(1.5,strength));
 if(m<=dead)return{x:0,y:0};
 const magnitude=Math.min(7, (m-dead)*gain);
 return{x:x/m*magnitude,y:y/m*magnitude};
}
function unprojectQuad(q,x,y){
 // Projective transform from a unit square to the four viewport corners; invert it.
 const [a,b,c,d]=q,dx1=b.x-c.x,dx2=d.x-c.x,dx3=a.x-b.x+c.x-d.x,dy1=b.y-c.y,dy2=d.y-c.y,dy3=a.y-b.y+c.y-d.y,det=dx1*dy2-dx2*dy1;
 if(Math.abs(det)<1e-9)return null;
 const g=(dx3*dy2-dx2*dy3)/det,h=(dx1*dy3-dx3*dy1)/det,A=b.x-a.x+g*b.x,B=d.x-a.x+h*d.x,D=b.y-a.y+g*b.y,E=d.y-a.y+h*d.y;
 const aa=A-x*g,bb=B-x*h,dd=D-y*g,ee=E-y*h,k=aa*ee-bb*dd;
 if(Math.abs(k)<1e-9)return null;
 return {x:((x-a.x)*ee-bb*(y-a.y))/k,y:(aa*(y-a.y)-dd*(x-a.x))/k};
}
function isMobileLayout(coarse,touch,width,height){return !!(coarse||(touch>0&&Math.min(width,height)<=850));}
(function bootChassis(){
 const root=document.documentElement,device=document.getElementById("device"),button=document.getElementById("tilt"),label=document.getElementById("layoutLabel");
 const coarse=matchMedia("(pointer: coarse)"),reduced=matchMedia("(prefers-reduced-motion: reduce)");
 let mobile=false,active=false,requested=false,baseline=null,target={x:0,y:0},shown={x:0,y:0},raf=0,lastDraw=0,lastSensor=0,strength=1,appReduced=false;
 const supports=typeof window.DeviceOrientationEvent!=="undefined";
 let preferred=true;try{preferred=localStorage.getItem("snake-shell-tilt")!=="off"}catch{}
 const save=()=>{try{localStorage.setItem("snake-shell-tilt",preferred?"on":"off")}catch{}};
 function draw(now){raf=0;const dt=lastDraw?Math.min(40,Math.max(1,now-lastDraw)):16.67;lastDraw=now;const alpha=1-Math.exp(-dt/130);shown.x+=(target.x-shown.x)*alpha;shown.y+=(target.y-shown.y)*alpha;if(Math.abs(shown.x-target.x)<.015)shown.x=target.x;if(Math.abs(shown.y-target.y)<.015)shown.y=target.y;
 device.style.setProperty("--tiltx",shown.x.toFixed(3)+"deg");device.style.setProperty("--tilty",shown.y.toFixed(3)+"deg");device.style.setProperty("--lightx",(45-shown.y*2.6).toFixed(1)+"%");device.style.setProperty("--lighty",(22+shown.x*2.5).toFixed(1)+"%");device.style.setProperty("--edge-x",(-shown.y*.65).toFixed(1)+"px");device.style.setProperty("--edge-y",(7-shown.x*.36).toFixed(1)+"px");device.style.setProperty("--case-scale",String(1-Math.min(.035,Math.hypot(shown.x,shown.y)*.003)));
 if(shown.x!==target.x||shown.y!==target.y)raf=requestAnimationFrame(draw);else lastDraw=0;}
 function schedule(){if(!raf)raf=requestAnimationFrame(draw)}
 function reset(){baseline=null;target={x:0,y:0};schedule()}
 function updateButton(){button.hidden=!mobile;button.disabled=!supports||(reduced.matches||appReduced);button.setAttribute("aria-pressed",String(active));button.textContent=(reduced.matches||appReduced)?"MOTION OFF":!supports?"TILT N/A":active?"TILT ON":preferred&&!requested?"ENABLE TILT":"TILT OFF";}
 function onOrientation(e){if(!mobile||!active||(reduced.matches||appReduced)||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;let angle=screen.orientation?.angle??window.orientation??0;lastSensor=performance.now();if(!baseline||baseline.angle!==angle){baseline={beta:e.beta,gamma:e.gamma,angle};target={x:0,y:0}}else target=orientationTarget(e.beta,e.gamma,baseline.beta,baseline.gamma,angle,strength);schedule()}
 function turnOn(){if(active||!mobile||!supports||(reduced.matches||appReduced))return;active=true;window.addEventListener("deviceorientation",onOrientation,{passive:true});reset();updateButton()}
 function turnOff(){active=false;window.removeEventListener("deviceorientation",onOrientation);reset();updateButton()}
 function layout(){const w=window.innerWidth,h=window.innerHeight,next=isMobileLayout(coarse.matches,navigator.maxTouchPoints||0,w,h);if(next!==mobile){mobile=next;reset()}root.dataset.layout=mobile?"mobile":"desktop";root.dataset.orientation=w>h?"landscape":"portrait";label.textContent=mobile?"MOBILE / "+(w>h?"LAND":"PORT"):"DESKTOP / KB";
 if(!mobile||(reduced.matches||appReduced)||!preferred)turnOff();else if(supports&&(typeof DeviceOrientationEvent.requestPermission!=="function"||requested))turnOn();updateButton()}
 button.addEventListener("click",async()=>{if(active){preferred=false;save();turnOff();return}preferred=true;save();if(typeof DeviceOrientationEvent.requestPermission==="function"){try{const result=await DeviceOrientationEvent.requestPermission();if(result!=="granted"){preferred=false;save();button.textContent="TILT DENIED";return}requested=true}catch{preferred=false;save();button.textContent="TILT N/A";return}}turnOn()});
 for(const m of [coarse,reduced]){if(m.addEventListener)m.addEventListener("change",layout);else m.addListener?.(layout)}
 addEventListener("resize",layout,{passive:true});addEventListener("orientationchange",()=>{reset();layout()},{passive:true});screen.orientation?.addEventListener?.("change",()=>{reset();layout()});document.addEventListener("visibilitychange",()=>{if(document.hidden)reset()});
 layout();window.__snakeChassis={get layout(){return root.dataset.layout},get orientation(){return root.dataset.orientation},get tilt(){return{...shown}},get sensorSeen(){return lastSensor>0},setStrength(n){strength=Math.max(.25,Math.min(1.5,Number(n)||1));reset()},setReduced(n){appReduced=!!n;layout()},recenter:reset,map(element,x,y){const points=[...element.querySelectorAll(".map-point")].map(p=>{const r=p.getBoundingClientRect();return{x:r.x,y:r.y}});if(points.length===4){const v=unprojectQuad(points,x,y);if(v)return v}const r=element.getBoundingClientRect();return{x:(x-r.left)/r.width,y:(y-r.top)/r.height}}};
})();
