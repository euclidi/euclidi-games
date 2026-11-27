// Layout follows usable screen geometry and input capability, not device UA.
export function classifyLayout({width,height,coarse=false,hover=true,touch=false}){
 const landscape=width>height;
 const handheld=(coarse||(!hover&&touch))&&Math.min(width,height)<650;
 if(handheld||width<680)return landscape?"mobile-landscape":"mobile-portrait";
 if(width<1000||coarse)return "tablet";
 return "desktop"
}
export function boardFit({width,height,layout,boss=false,editing=false}){
 const compact=layout==="mobile-landscape",pad=compact?6:12;
 const chrome=compact?(boss?88:62):layout==="mobile-portrait"? (boss?236:203):layout==="tablet"? (boss?230:198):(boss?205:173);
 const availW=Math.max(1,width-2*pad-(compact?190:layout==="desktop"?228:0));
 const availH=editing?Infinity:Math.max(compact?110:150,height-chrome);
 const w=Math.floor(Math.min(768,availW,availH*4/3));
 return {width:w,height:Math.floor(w*3/4)}
}
export function installLayout(win=window,doc=document){
 const mq=win.matchMedia("(pointer: coarse)"),hover=win.matchMedia("(hover: hover)");
 let pending=0,active=true,lastInput=mq.matches?"touch":"mouse";
 const root=doc.documentElement;
 function update(){pending=0;if(!active)return;let viewport=win.visualViewport;
 const width=Math.round(Math.min(win.innerWidth,viewport?.width||win.innerWidth)),height=Math.round(Math.min(win.innerHeight,viewport?.height||win.innerHeight));
 const layout=classifyLayout({width,height,coarse:mq.matches,hover:hover.matches,touch:win.navigator.maxTouchPoints>0});
 root.dataset.layout=layout;root.dataset.input=lastInput;
 const boss=!!doc.getElementById("boss-panel")&&!doc.getElementById("boss-panel").hidden;
 const editing=!!doc.getElementById("editor")&&!doc.getElementById("editor").hidden;
 const fit=boardFit({width,height,layout,boss,editing});
 root.style.setProperty("--fit-board",fit.width+"px");root.style.setProperty("--viewport-height",height+"px");
 }
 function schedule(){if(!pending)pending=win.requestAnimationFrame(update)}
 function pointer(e){if(e.pointerType==="touch"||e.pointerType==="mouse"||e.pointerType==="pen"){lastInput=e.pointerType;root.dataset.input=lastInput}}
 const listeners=[[win,"resize",schedule],[win,"orientationchange",schedule],[win.visualViewport,"resize",schedule],[mq,"change",schedule],[hover,"change",schedule],[doc,"pointerdown",pointer]];
 for(const [t,e,fn] of listeners)t?.addEventListener?.(e,fn,{passive:true});
 const observer=new MutationObserver(schedule);for(const id of ["boss-panel","editor","game"]) {let e=doc.getElementById(id);if(e)observer.observe(e,{attributes:true,attributeFilter:["hidden"]})}
 update();return {refresh:schedule,dispose(){active=false;observer.disconnect();if(pending)win.cancelAnimationFrame(pending);for(const [t,e,fn] of listeners)t?.removeEventListener?.(e,fn)}}
}
