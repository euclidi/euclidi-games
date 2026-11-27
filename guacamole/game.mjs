
import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import R from './vendor/rapier.es.js';
import {models as pilot} from './assets/pilot.mjs';
import {models as kitchen} from './assets/kitchen.mjs';
import {E} from './engine.mjs';
import {runTests} from './tests.mjs';
export async function boot(){return start()}

async function start(){
 const $=id=>document.getElementById(id),view=$("view"),note=$("note"),models={...pilot,...kitchen},library={},loader=new GLTFLoader();
 await R.init();
 for(const [key,data] of Object.entries(models)){const asset=await loader.loadAsync(data);library[key]=asset.scene}
 const scene=new T.Scene();scene.background=new T.Color(0x55483b);
 const camera=new T.OrthographicCamera(-6,6,4,-4,.1,100),renderer=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;view.prepend(renderer.domElement);const canvas=renderer.domElement;
 const light=new T.HemisphereLight(0xf7e1bb,0x524236,1.85);scene.add(light);
 const sun=new T.DirectionalLight(0xffe0b5,2.55);sun.position.set(-4,10,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.2,far:30});sun.shadow.bias=-.0004;sun.shadow.normalBias=.018;scene.add(sun);
 const fill=new T.DirectionalLight(0xc6d8d1,.8);fill.position.set(5,5,-6);scene.add(fill);
 const vec=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),mat=(c,rough=.8,metal=0)=>new T.MeshStandardMaterial({color:c,roughness:rough,metalness:metal,flatShading:true});
 function mesh(geo,m,parent=scene){const a=new T.Mesh(geo,m);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a}
 function asset(key,x,z,w,h,vertical=undefined){
  const raw=library[key];if(!raw)throw Error("Missing asset "+key);
  const g=new T.Group(),c=raw.clone(true);g.add(c);const b=new T.Box3().setFromObject(c),sz=b.getSize(vec()),mid=b.getCenter(vec());
  if(sz.x<1e-5||sz.z<1e-5||sz.y<1e-5)throw Error("Invalid model bounds "+key);
  let sx=w/Math.max(sz.x,sz.z),sy=vertical===undefined?sx:vertical/sz.y,ss=h===undefined?sx:h/sz.z;if(h!==undefined)sx=w/sz.x;
  c.scale.set(sx,sy,ss);c.position.set(-mid.x*sx,-b.min.y*sy,-mid.z*ss);c.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(Array.isArray(o.material))o.material=o.material.map(m=>m.clone());else o.material=o.material.clone()}});g.position.set(x,0,z);scene.add(g);return g;
 }
 const surface=mesh(new T.BoxGeometry(11.5,.23,8.4),mat(0x776657,.88));surface.position.y=-.16;
 const board=asset("cutting-board",E.board.x,E.board.z,E.board.w,E.board.h,.14);board.position.y=0;
 const bowl=asset("bowl",E.bowl.x,E.bowl.z,2.85,2.85,.66),plate=asset("plate",E.plate.x,E.plate.z,2.55,2.55,.16);
 const lime=asset("lemon-half",4.03,-2.2,.68);lime.traverse(o=>{if(o.isMesh){o.material.color.multiply(new T.Color(0x9dff8c));}});const salt=asset("shaker-salt",4.25,-.65,.53,undefined,1.05);
 const shells=E.skins.map((p,i)=>{
  const whole=asset("avocado",p.x,p.z,1.04,1.26,.7),half=asset("advocado-half",p.x,p.z,1.1,1.24,.55);
  whole.position.y=half.position.y=.15;
  // Shape-specific shell needed because the source model has fixed flesh.
  const points=[new T.Vector2(.05,0),new T.Vector2(.2,.025),new T.Vector2(.39,.08),new T.Vector2(.50,.19),new T.Vector2(.53,.30),new T.Vector2(.49,.32),new T.Vector2(.44,.27),new T.Vector2(.35,.15),new T.Vector2(.14,.06),new T.Vector2(.035,.06)];
  const shell=mesh(new T.LatheGeometry(points,40),mat(0x485327));shell.scale.set(1,1,1.18);shell.position.set(p.x,.14,p.z);shell.visible=false;
  return {whole,half,shell}
 });
 const palette={avocado:0xaac16a,onion:0xa77eaa,tomato:0xcf4e37,pepper:0x46803c,cilantro:0x476f31};
 const mats=Object.fromEntries(Object.entries(palette).map(([k,c])=>[k,mat(c,.62)]));
 const chipMat=mat(0xddb474,.8),chipEdge=mat(0xa27b44,.8);
 function chipMesh(parent=scene){const shape=new T.Shape();shape.moveTo(-.23,-.13);shape.lineTo(.04,.26);shape.lineTo(.28,-.15);shape.lineTo(.05,-.19);shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:.034,bevelEnabled:true,bevelThickness:.012,bevelSize:.011,bevelSegments:1,steps:1});g.rotateX(-Math.PI/2);return mesh(g,[chipMat,chipEdge],parent)}
 const chips=Array.from({length:7},(_,i)=>{const a=i*Math.PI*2/7,m=chipMesh();m.position.set(E.plate.x+Math.cos(a)*1.03,.15,E.plate.z+Math.sin(a)*1.03);m.rotation.y=a;return m});
 const toolNames=["prep","knife","spoon","mash","fold","lime","salt","dip"],tools={prep:asset("cooking-spoon",0,0,1.05),knife:asset("cooking-knife-chopping",0,0,1.4),spoon:asset("cooking-spoon",0,0,1.2),mash:asset("cooking-fork",0,0,1.05),fold:asset("cooking-spatula",0,0,1.35),lime:asset("lemon-half",0,0,.68),salt:asset("shaker-salt",0,0,.46,undefined,.9),dip:chipMesh()};
 for(const a of Object.values(tools))a.visible=false;
 let state=E.create(),tool="prep",paused=false,active=null,last={x:0,z:0},angle=0,zoom=1,sound=false,ac=null,dirty=true;
 const saveKey="euclidi.guacamole.r3";
 try{const raw=localStorage.getItem(saveKey);if(raw){const s=JSON.parse(raw);if(E.valid(s)){state=s;if(state.held.length)E.drop(state,E.board);angle=Number(state.camera?.angle)||0;zoom=Math.max(.7,Math.min(1.8,Number(state.camera?.zoom)||1));}}}catch{}
 $("mode").value=state.mode==="free"?"free":"guided";
 let world=new R.World({x:0,y:-9.81,z:0});world.timestep=1/60;
 world.createCollider(R.ColliderDesc.cuboid(5.75,.115,4.2).setTranslation(0,-.16,0).setFriction(.95));
 world.createCollider(R.ColliderDesc.cuboid(E.board.w/2,.07,E.board.h/2).setTranslation(E.board.x,.07,E.board.z).setFriction(.9));
 const objects=new Map(),bodies=new Map();
 const setpos=(f,x,z)=>{const dx=x-f.x,dz=z-f.z;f.x=x;f.z=z;for(const p of f.poly){p.x+=dx;p.z+=dz}};
 function clearBody(id){const b=bodies.get(id);if(b){world.removeRigidBody(b);bodies.delete(id)}}
 function syncPhysics(){
  const ids=new Set(state.food.map(f=>f.id));for(const id of bodies.keys())if(!ids.has(id))clearBody(id);
  for(const f of state.food){if(f.loc!=="board"&&f.loc!=="counter"){clearBody(f.id);continue}
   if(!bodies.has(f.id)){const h=Math.max(.03,Math.min(.22,f.r*.4)),y=(f.loc==="board"?.14:0)+h+.015,b=world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(f.x,y,f.z).setLinearDamping(2.5).setAngularDamping(4).setCcdEnabled(true));
    world.createCollider(R.ColliderDesc.cuboid(Math.max(.03,f.r*.65),h,Math.max(.03,f.r*.65)).setFriction(.85).setRestitution(.04).setDensity(.7),b);b.setLinvel({x:f.vx,y:0,z:f.vz},true);bodies.set(f.id,b)
   }
  }
 }
 function physicsStep(){syncPhysics();world.step();for(const f of state.food){const b=bodies.get(f.id);if(!b)continue;const p=b.translation();if(p.y<-.9||Math.abs(p.x)>5.4||Math.abs(p.z)>3.9){b.setTranslation({x:Math.max(-5,Math.min(5,p.x)),y:.4,z:Math.max(-3.7,Math.min(3.7,p.z))},true);b.setLinvel({x:0,y:0,z:0},true)}else setpos(f,p.x,p.z);f.vx=f.vz=0;}E.tick(state,1/60)}
 function parcelMesh(f){
  if(f.loc==="board"&&((f.type==="onion"&&f.m>57)||(f.type==="tomato"&&f.m>77)||(f.type==="pepper"&&f.m>19))){const key=f.type==="onion"?"onion-half":f.type;return {node:asset(key,f.x,f.z,f.r*2.1,undefined,f.r*.84),asset:true}}
  const s=new T.Shape();f.poly.forEach((p,i)=>{const x=p.x-f.x,z=-(p.z-f.z);if(i===0)s.moveTo(x,z);else s.lineTo(x,z)});s.closePath();
  const dep=Math.max(.035,Math.min(.35,f.r*.7)),geo=new T.ExtrudeGeometry(s,{depth:dep,bevelEnabled:true,bevelThickness:Math.min(.018,f.r*.12),bevelSize:Math.min(.018,f.r*.12),bevelSegments:1,steps:1});geo.rotateX(-Math.PI/2);const m=mesh(geo,mats[f.type]||mats.avocado);return {node:m,asset:false}
 }
 function deleteObject(o){scene.remove(o.node);if(!o.asset)o.node.geometry.dispose()}
 function renderFood(){
  const ids=new Set(state.food.map(f=>f.id));for(const [id,o] of objects)if(!ids.has(id)){deleteObject(o);objects.delete(id)}
  for(let i=0;i<shells.length;i++){const p=shells[i];p.whole.visible=state.open[i]===0;p.half.visible=state.open[i]===1;p.shell.visible=state.open[i]===2}
  for(const f of state.food){let o=objects.get(f.id);if(!o){o=parcelMesh(f);objects.set(f.id,o)}
   const n=o.node,hidden=f.loc==="skin"&&state.open[f.half]!==2;n.visible=!hidden;
   const b=bodies.get(f.id),h=b?b.translation().y-Math.max(.03,Math.min(.22,f.r*.4)):f.loc==="skin"?.25:f.loc==="bowl"?.33:f.loc==="plate"?.15:f.loc==="held"?.73:f.loc==="board"?.14:0;
   n.position.set(f.x,Math.max(.01,h),f.z);if(!o.asset){n.scale.set(1+f.crush*.29,Math.max(.22,1-f.crush*.76),1+f.crush*.29);if(f.loc==="bowl"&&f.crush>.6)n.position.y=.31}
  }
 }
 function cameraUpdate(){const a=angle,dist=10;camera.position.set(Math.sin(a)*dist,13,Math.cos(a)*dist);camera.lookAt(0,0,0);camera.zoom=zoom;camera.updateProjectionMatrix();state.camera={angle,zoom}}
 function resize(){const w=view.clientWidth,h=view.clientHeight;if(!w||!h)return;const ar=w/h,half=Math.max(4.35,6/ar);camera.left=-half*ar;camera.right=half*ar;camera.top=half;camera.bottom=-half;cameraUpdate();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1280/w,960/h));renderer.setSize(w,h,false)}
 new ResizeObserver(resize).observe(view);resize();
 const ray=new T.Raycaster(),plane=new T.Plane(vec(0,1,0),-.13);
 function point(x,y){const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),camera);const v=vec();if(!ray.ray.intersectPlane(plane,v))return null;return {x:v.x,z:v.z}}
 function say(x){note.textContent=x;dirty=true}
 function tone(kind){if(!sound)return;try{ac??=new AudioContext();if(ac.state==="suspended")ac.resume();const len=kind==="knife"?.055:.13,buf=ac.createBuffer(1,Math.ceil(ac.sampleRate*len),ac.sampleRate),arr=buf.getChannelData(0);let lp=0;for(let i=0;i<arr.length;i++){lp=lp*.65+(Math.random()*2-1)*.35;arr[i]=lp*Math.exp(-i/(arr.length*.22))*(kind==="knife"?.35:.17)}const src=ac.createBufferSource(),filter=ac.createBiquadFilter();filter.type="lowpass";filter.frequency.value=kind==="knife"?3200:650;src.buffer=buf;src.connect(filter);filter.connect(ac.destination);src.start()}catch{}}
 const hints={prep:"Click each avocado once to open, then again to remove its pit.",knife:"Draw a complete cut across the vegetables on the board.",spoon:"Drag from food to the bowl, board or serving plate.",mash:"Hold and press across the avocado in the bowl.",fold:"Sweep the spatula through the bowl to move individual pieces.",lime:"Hold over the mixture to squeeze lime juice.",salt:"Hold above the mixture to sprinkle salt.",dip:"Drag a bite from the bowl to the plate using a chip."};
 function select(t){if(!tools[t]||active)return;tool=t;document.querySelectorAll("[data-tool]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.tool===t)));say(hints[t])}
 document.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>select(b.dataset.tool));
 function startAt(p){if(!p||paused||active)return;active={from:p,last:p,elapsed:0,distance:0};last=p;
  if(tool==="prep"){say(E.open(state,p)?"Avocado prepared.":hints.prep);tone(tool)}
  if(tool==="spoon"||tool==="dip"){const q=E.pickup(state,p,tool==="dip"?.22:.44);say(q?Math.round(q)+" g picked up.":"No reachable food here.");if(q)tone(tool)}
  if(tool==="mash"){E.mash(state,p,.08);tone(tool)}
  if(tool==="lime"||tool==="salt"){const q=E.season(state,p,tool,tool==="lime"?.7:.12);if(q)tone(tool)}
  dirty=true
 }
 function moveAt(p){if(!p)return;last=p;if(!active)return;const a=active.last;const d=Math.hypot(p.x-a.x,p.z-a.z);active.distance+=d;if(d>2){active.last=p;return}
  if(tool==="spoon"||tool==="dip")E.carry(state,p);
  if(tool==="fold"&&d>.012)E.fold(state,a,p);
  if(tool==="mash"&&d>.01)E.mash(state,p,Math.min(.15,d*.4));
  active.last=p;dirty=true
 }
 function endAt(p){if(!active)return;const a=active;active=null;if(p)last=p;
  if(tool==="knife"){const n=E.cut(state,a.from,last);say(n?n+" piece"+(n===1?"":"s")+" divided.":"Cut must cross both edges of a piece.");if(n)tone(tool)}
  if(tool==="spoon"||tool==="dip"){const n=E.drop(state,last);if(n){say(Math.round(n)+" g transferred to "+E.zone(last)+".");tone(tool)}}
  if(tool==="fold"){tone(tool);say("Mixture moved by the spatula.")}
  if(tool==="mash")say("Avocado texture changed only where pressed.");
  if(tool==="lime"||tool==="salt")say(tool==="lime"?"Lime released locally.":"Salt distributed locally.");
  dirty=true;save(false)
 }
 let pointerId=null;canvas.addEventListener("pointerdown",e=>{if(pointerId!==null||paused)return;e.preventDefault();pointerId=e.pointerId;canvas.setPointerCapture(e.pointerId);startAt(point(e.clientX,e.clientY))});
 canvas.addEventListener("pointermove",e=>{if(pointerId!==null&&pointerId!==e.pointerId)return;moveAt(point(e.clientX,e.clientY))});
 canvas.addEventListener("pointerup",e=>{if(e.pointerId!==pointerId)return;moveAt(point(e.clientX,e.clientY));endAt(last);pointerId=null});
 function cancel(){if(active){if(state.held.length)E.drop(state,last);active=null;save(false)}pointerId=null;dirty=true}
 canvas.addEventListener("pointercancel",cancel);canvas.addEventListener("lostpointercapture",()=>{if(pointerId!==null)cancel()});window.addEventListener("blur",cancel);
 canvas.addEventListener("wheel",e=>{if(active)return;e.preventDefault();zoom=Math.max(.7,Math.min(1.8,zoom*Math.exp(-e.deltaY*.001)));cameraUpdate();dirty=true},{passive:false});
 function save(report=true){try{state.camera={angle,zoom};localStorage.setItem(saveKey,JSON.stringify(state));if(report)say("Kitchen saved.")}catch{if(report)say("Local saving is unavailable.")}}
 $("save").onclick=()=>save();$("reset").onclick=()=>{if(!confirm("Discard the current batch and start fresh?"))return;cancel();for(const id of [...bodies.keys()])clearBody(id);for(const o of objects.values())deleteObject(o);objects.clear();state=E.create();state.mode=$("mode").value;select("prep");save(false);dirty=true};
 $("mode").onchange=()=>{state.mode=$("mode").value;dirty=true;save(false)};
 $("left").onclick=()=>{if(!active){angle-=Math.PI/8;cameraUpdate();dirty=true}};$("right").onclick=()=>{if(!active){angle+=Math.PI/8;cameraUpdate();dirty=true}};
 $("zin").onclick=()=>{zoom=Math.min(1.8,zoom*1.14);cameraUpdate();dirty=true};$("zout").onclick=()=>{zoom=Math.max(.7,zoom/1.14);cameraUpdate();dirty=true};
 $("pause").onclick=()=>{if(active)cancel();paused=!paused;$("pause").textContent=paused?"Resume":"Pause";dirty=true};
 $("sound").onclick=()=>{sound=!sound;$("sound").textContent=sound?"Sound on":"Sound off";$("sound").setAttribute("aria-pressed",String(sound));if(sound)tone("knife")};
 const keys=new Set(),cursor={x:.5,y:.5},cursorEl=$("cursor");let virtualDown=false,lastPadButton=false,lastToolButton=false;
 window.addEventListener("keydown",e=>{if(/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName))return;if(/^[1-8]$/.test(e.key))select(toolNames[Number(e.key)-1]);if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)){e.preventDefault();keys.add(e.key)}});
 window.addEventListener("keyup",e=>keys.delete(e.key));window.addEventListener("blur",()=>keys.clear());
 function virtual(dt){const pads=navigator.getGamepads?.()||[],pad=Array.from(pads).find(Boolean),dx=(keys.has("ArrowRight")?1:0)-(keys.has("ArrowLeft")?1:0)+(Math.abs(pad?.axes?.[0]||0)>.17?pad.axes[0]:0),dy=(keys.has("ArrowDown")?1:0)-(keys.has("ArrowUp")?1:0)+(Math.abs(pad?.axes?.[1]||0)>.17?pad.axes[1]:0),down=keys.has(" ")||!!pad?.buttons?.[0]?.pressed,cycle=!!pad?.buttons?.[5]?.pressed;
  if(cycle&&!lastToolButton)select(toolNames[(toolNames.indexOf(tool)+1)%toolNames.length]);lastToolButton=cycle;
  if(pointerId!==null)return;if(!dx&&!dy&&!down&&!virtualDown)return;
  cursor.x=Math.max(.02,Math.min(.98,cursor.x+dx*dt*.65));cursor.y=Math.max(.02,Math.min(.98,cursor.y+dy*dt*.65));cursorEl.style.display="block";cursorEl.style.left=cursor.x*100+"%";cursorEl.style.top=cursor.y*100+"%";const r=canvas.getBoundingClientRect(),p=point(r.left+r.width*cursor.x,r.top+r.height*cursor.y);
  if(down&&!virtualDown)startAt(p);else if(down)moveAt(p);if(!down&&virtualDown)endAt(p);virtualDown=down
 }
 function metrics(){const s=E.summary(state),texture=s.texture<.25?"coarse":s.texture<.65?"chunky":"creamy";$("metrics").innerHTML="<span>BOWL <b>"+Math.round(s.bowl)+" g</b></span><span>PLATE <b>"+Math.round(s.plate)+" g</b></span><span>TEXTURE <b>"+texture+"</b></span><span>LIME <b>"+s.juice.toFixed(1)+" g</b></span><span>SALT <b>"+s.salt.toFixed(1)+" g</b></span><span>INGREDIENTS <b>"+s.types.length+"/5</b></span>";
  let guide=state.mode==="free"?"Free cooking · no prescribed quantities":state.open.some(v=>v<2)?"Open and remove both avocado pits":state.food.some(f=>f.loc==="skin")?"Scoop avocado into bowl":s.types.length<5?"Chop and add vegetables":s.texture<.42?"Mash and fold to preferred consistency":s.juice<2||s.salt<.5?"Season to taste":s.plate<1?"Serve onto plate":"Batch plated · continue or start another";
  $("status").textContent=(paused?"PAUSED · ":"")+guide+" · Rapier "+(typeof R.version==="function"?R.version():"WASM")+" · local GLBs"
 }
 $("test").onclick=()=>{try{$("tests").textContent=runTests().map(x=>"PASS "+x).join("\\n")}catch(e){$("tests").textContent="FAIL "+e.message}};
 let prev=performance.now(),acc=0,saveAt=prev,uiAt=0;
 function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-prev)/1000);prev=now;virtual(dt);if(!paused){
  if(active){active.elapsed+=dt;if(tool==="mash")E.mash(state,last,dt*.8);if(tool==="lime"||tool==="salt")E.season(state,last,tool,dt*(tool==="lime"?4:.6))}
  acc+=dt;while(acc>=1/60){physicsStep();acc-=1/60}
 }else acc=0;
 renderFood();for(const [k,t] of Object.entries(tools)){t.visible=!!active&&k===tool;if(t.visible){t.position.set(last.x,E.zone(last)==="bowl"?.72:.33,last.z);if(active)t.rotation.y=-Math.atan2(active.last.z-active.from.z,active.last.x-active.from.x)}}
 renderer.render(scene,camera);if(dirty||now-uiAt>300){metrics();dirty=false;uiAt=now}if(now-saveAt>5000&&!active){save(false);saveAt=now}
 }
 if(new URLSearchParams(location.search).has("test"))Object.defineProperty(window,"__guacTest",{value:Object.freeze({
  snapshot:()=>JSON.parse(JSON.stringify(state)),summary:()=>E.summary(state),models:()=>Object.keys(library),
  project:(x,z)=>{const q=vec(x,.13,z).project(camera),r=canvas.getBoundingClientRect();return {x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2}},
  tests:()=>runTests()
 })});
 $("boot").hidden=true;metrics();requestAnimationFrame(loop)
}
