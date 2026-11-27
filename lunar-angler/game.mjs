import * as T from '../library/vendor/three.module.min.js';
import {observatory,createSea,makeCreature} from './visuals.mjs';
const $=id=>document.getElementById(id),stage=$('stage'),labels=$('labels'),names=['Sol','Home moon','Aster','Nereid','Amber mere'],species=['Silver trout','Moon dace','Glass eel','Ribbon ray','Blue lanternfish','Pearl medusa','Amber eel','Cinder skate','Gilded tetra','Veil squid','Copperfin','Saffron bell'];let state=null,view='surface',seed=1,reeling=false,paused=true,started=false,mode='Expedition',seen=0,fishLog={},sound=false,audio=null,angle=0,power=1,oldWet=0,lastT=0,credits=0,forecastId=0,forecastTimer=0,prediction=null,lastForecast=0,pendingCast=false;
try{const s=JSON.parse(localStorage.getItem('lunar-angler.v1')||'{}');fishLog=s.fishLog||{};credits=s.credits||0;mode=s.mode||'Expedition';}catch{}$('mode').value=mode;
function save(){try{localStorage.setItem('lunar-angler.v1',JSON.stringify({fishLog,credits,mode}));}catch{}}
function message(s){$('message').textContent=s;}
function tone(f=200,d=.14){if(!sound||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(f*.6,audio.currentTime+d);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d);}
const worker=new Worker('./worker.js?v=0.2',{type:'module'});const send=(type,extra={})=>worker.postMessage({type,...extra});worker.onerror=e=>message('Physics worker failed: '+e.message);worker.onmessage=({data:m})=>{if(m.type==='forecast'){if(m.id===forecastId){prediction=m;$('forecast').textContent=m.wet?'Forecast: '+names[m.wet]+' · '+m.hitTime.toFixed(1)+'s to water':'Forecast: no water entry in 8s';}return;}if(m.type==='forecast-error'){if(m.id===forecastId)$('forecast').textContent='Forecast unavailable';return;}if(m.type==='error'){message(m.message);document.body.dataset.ready='error';return;}const first=!state,wasActive=state?.[1];state=m.data;pendingCast=false;if(first||wasActive&&!state[1])requestForecast();document.body.dataset.ready='true';document.body.dataset.active=String(state[1]);document.body.dataset.wet=String(state[2]);document.body.dataset.attached=String(state[3]);document.body.dataset.caught=String(state[4]);$('cast').disabled=!!state[1];$('reel').disabled=!state[1];if(state[4]&&!seen){const name=species[state[4]-1];fishLog[name]=(fishLog[name]||0)+1;credits+=10;save();message('Recovered: '+name+' · specimen recorded');tone(620,.4);}else if(state[5])message('Line severed. Reset cast to recalibrate.');else if(state[1]){if(state[3]>=0)message('Hooked '+species[state[3]]+' — reel with care');else if(state[2])message('Submerged in '+names[state[2]]+' — wait for a bite');else message(reeling?'Retrieving tether…':'Hook in flight · gravity and tether active');}else if(!started)message('Draw back and release, or use Cast. Chart a course in the inset atlas.');else if(!state[4]&&!state[5])message('Hook recovered. Cast again or choose a new system.');if(oldWet!==state[2]&&state[2])tone(120,.3);oldWet=state[2];seen=state[4];if(!state[1]&&reeling){reeling=false;send('reel',{value:false});$('reel').textContent='Reel in';}if(state[1])$('forecast').textContent=state[3]>=0?'Fish on line · retrieve':state[2]?'Water contact · watch the hook':'In flight · live tether'; $('length').textContent=state[6].toFixed(1);$('tension').textContent=state[7].toFixed(1);$('strain').value=state[7];$('depth').textContent=state[2]?Math.max(0,state[12+4*state[2]]-Math.hypot(state[126]-state[10+4*state[2]],state[127]-state[11+4*state[2]])).toFixed(1):'—';$('count').textContent=Object.values(fishLog).reduce((a,b)=>a+b,0);};
$('pause').textContent='Run clock';let renderer;try{renderer=new T.WebGLRenderer({antialias:false,powerPreference:'high-performance'});}catch(e){document.body.dataset.ready='error';message('WebGL renderer unavailable: '+e.message);throw e;}renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;stage.prepend(renderer.domElement);const scene=new T.Scene();scene.background=new T.Color(0x090e17);const ortho=new T.OrthographicCamera(-160,160,115,-115,.1,900);ortho.up.set(0,0,-1);const perspective=new T.PerspectiveCamera(60,1,.05,900);let camera=ortho;const star=new T.PointLight(0xffe0a9,76000,0,2);scene.add(star);scene.add(new T.AmbientLight(0x6688aa,.10));
const rand=n=>()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
function texture(i){
 const c=document.createElement('canvas');c.width=768;c.height=384;const ctx=c.getContext('2d'),r=rand(293+i*83),im=ctx.createImageData(c.width,c.height);
 const hash=(x,y,z)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,1274126177)^Math.imul(i+2,1597334677);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};
 const mix=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
 function noise(x,y,z){const a=Math.floor(x),b=Math.floor(y),d=Math.floor(z),u=smooth(x-a),v=smooth(y-b),w=smooth(z-d);return mix(mix(mix(hash(a,b,d),hash(a+1,b,d),u),mix(hash(a,b+1,d),hash(a+1,b+1,d),u),v),mix(mix(hash(a,b,d+1),hash(a+1,b,d+1),u),mix(hash(a,b+1,d+1),hash(a+1,b+1,d+1),u),v),w);}
 const palette=[[230,152,56],[107,103,92],[139,99,63],[22,82,109],[91,77,39]][i];
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
  const u=x/c.width*Math.PI*2,v=y/c.height*Math.PI,xx=Math.cos(u)*Math.sin(v),yy=Math.cos(v),zz=Math.sin(u)*Math.sin(v);
  let n=0,f=3.4,amp=.5;for(let j=0;j<5;j++){n+=(noise(xx*f+17,yy*f+31,zz*f+9)-.5)*amp;f*=2.04;amp*=.53;}
  const ridge=Math.abs(noise(xx*17+11,yy*17+8,zz*17+5)-.5),g=(r()-.5)*10+n*(i>=3?84:142),k=(y*c.width+x)*4;
  const wave=i>=3?Math.sin((yy+n*.14)*88+noise(xx*9,yy*9,zz*9)*4)*2.5+ridge*12:0;
  for(let j=0;j<3;j++)im.data[k+j]=palette[j]+g+wave*(j===0?.8:1.4);im.data[k+3]=255;
 }
 ctx.putImageData(im,0,0);
 if(i===1||i===2)for(let j=0;j<190;j++){const x=r()*768,y=r()*384,rad=2+Math.pow(r(),2)*26;const gr=ctx.createRadialGradient(x-rad*.25,y-rad*.28,0,x,y,rad);gr.addColorStop(0,'rgba(25,22,18,.47)');gr.addColorStop(.65,'rgba(41,37,29,.22)');gr.addColorStop(.84,'rgba(224,209,179,.18)');gr.addColorStop(.95,'rgba(7,9,10,.13)');gr.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;
}
const bodies=[],cores=[],labelNodes=[];for(let i=0;i<5;i++){const tex=texture(i),mat=i===0?new T.MeshBasicMaterial({map:tex,color:0xffcf80}):new T.MeshStandardMaterial({map:tex,bumpMap:tex,bumpScale:i<3?.6:.2,roughness:i>=3?.26:.9,metalness:i>=3?.18:0});const mesh=new T.Mesh(new T.SphereGeometry(1,64,40),mat);scene.add(mesh);bodies.push(mesh);const core=new T.Mesh(new T.SphereGeometry(1,40,24),new T.MeshStandardMaterial({map:tex,roughness:.9}));scene.add(core);core.visible=false;cores.push(core);const label=document.createElement('div');label.className='planet-label';label.textContent=names[i];labels.append(label);labelNodes.push(label);}
const points=[],rng=rand(993);for(let i=0;i<1700;i++){const a=rng()*6.283,b=rng()*2-1,r=420;points.push(r*Math.sqrt(1-b*b)*Math.cos(a),r*b,r*Math.sqrt(1-b*b)*Math.sin(a));}const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(points,3));scene.add(new T.Points(sg,new T.PointsMaterial({color:0xd5d9d8,size:1.15,sizeAttenuation:false})));
const brass=new T.MeshStandardMaterial({color:0xb59255,metalness:.48,roughness:.33}),dark=new T.MeshStandardMaterial({color:0x413325,roughness:.7}),ivory=new T.MeshStandardMaterial({color:0xd4c5a5,roughness:.54});
const instrument=observatory(scene),camp=instrument.root,sea=createSea(scene);
function part(g,m,x,y,z,parent=camp){const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
const hookLight=new T.PointLight(0xb4d7df,5,14,2);hookLight.visible=false;scene.add(hookLight);
const lineGeom=new T.BufferGeometry();const lineArray=new Float32Array(48*3);lineGeom.setAttribute('position',new T.BufferAttribute(lineArray,3));const rope=new T.Line(lineGeom,new T.LineBasicMaterial({color:0xf3d69c,depthTest:false}));rope.frustumCulled=false;rope.renderOrder=4;scene.add(rope);const hook=new T.Group();scene.add(hook);const hookCurve=new T.CatmullRomCurve3([new T.Vector3(0,.5,0),new T.Vector3(0,-.3,0),new T.Vector3(.18,-.55,0),new T.Vector3(.43,-.4,0),new T.Vector3(.46,-.12,0)]);part(new T.TubeGeometry(hookCurve,24,.045,8,false),brass,0,0,0,hook);part(new T.ConeGeometry(.09,.22,8),ivory,.46,-.03,0,hook);const aimGeom=new T.BufferGeometry(),forecastBuffer=new Float32Array(3*132);aimGeom.setAttribute('position',new T.BufferAttribute(forecastBuffer,3));const aim=new T.Line(aimGeom,new T.LineBasicMaterial({color:0x81cbbf,transparent:true,opacity:.85,depthTest:false}));aim.frustumCulled=false;aim.renderOrder=5;scene.add(aim);const cursor=new T.Mesh(new T.RingGeometry(1.15,1.45,32),new T.MeshBasicMaterial({color:0xffdf96,side:T.DoubleSide,depthTest:false}));cursor.rotation.x=-Math.PI/2;cursor.renderOrder=6;scene.add(cursor);
const fishMeshes=Array.from({length:12},(_,i)=>makeCreature(scene,i));
function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;const internal=1280;renderer.setSize(internal,Math.max(1,Math.round(internal*h/w)),false);perspective.aspect=w/h;perspective.updateProjectionMatrix();}new ResizeObserver(resize).observe(stage);resize();
const v3=(x,y,z)=>new T.Vector3(x,y,z);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),atlasHit=$('atlas-hit');let skyLook=false,skyMix=0;
function requestForecast(){
 if(!state||state[1]||pendingCast)return;
 prediction=null;$('forecast').textContent='Calculating physical flight…';const id=++forecastId;clearTimeout(forecastTimer);
 forecastTimer=setTimeout(()=>{forecastTimer=0;if(!state||state[1]||pendingCast||id!==forecastId)return;lastForecast=performance.now();send('forecast',{id,x:Math.cos(angle*Math.PI/180),y:Math.sin(angle*Math.PI/180),power,rod:Number($('rod').value)});},130);
}
function bounds(s,ratio){
 const hx=s[126],hz=s[127],minx=Math.min(...bodies.map(b=>b.position.x-b.scale.x),s[1]?hx:0),maxx=Math.max(...bodies.map(b=>b.position.x+b.scale.x),s[1]?hx:0),minz=Math.min(...bodies.map(b=>b.position.z-b.scale.x),s[1]?hz:0),maxz=Math.max(...bodies.map(b=>b.position.z+b.scale.x),s[1]?hz:0);
 const cx=(minx+maxx)/2,cz=(minz+maxz)/2,half=Math.max((maxz-minz)/2+12,((maxx-minx)/2+12)/Math.max(.1,ratio));
 ortho.left=-half*ratio;ortho.right=half*ratio;ortho.top=half;ortho.bottom=-half;ortho.updateProjectionMatrix();ortho.position.set(cx,330,cz);ortho.lookAt(cx,0,cz);ortho.updateMatrixWorld();
}
function labelAtlas(rect){for(let i=0;i<5;i++){const p=bodies[i].position.clone().add(v3(0,0,bodies[i].scale.x+2)).project(ortho);const el=labelNodes[i];el.style.display='block';el.style.left=(rect.x+(p.x*.5+.5)*rect.w)+'px';el.style.top=(rect.y+(-p.y*.5+.5)*rect.h)+'px';el.classList.toggle('mini',view!=='orbit');}}
function frame(now){
 requestAnimationFrame(frame);if(!state)return;
 const s=state,t=s[0],w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
 if(!paused&&!s[1]&&!pendingCast&&now-lastForecast>1800&&!forecastTimer)requestForecast();
 for(let i=0;i<5;i++){const x=s[10+4*i],z=s[11+4*i],r=s[12+4*i];bodies[i].position.set(x,0,z);bodies[i].scale.setScalar(r);bodies[i].rotation.y=t*.018*(i+1);cores[i].position.copy(bodies[i].position);cores[i].scale.setScalar(r*.47);cores[i].visible=false;bodies[i].visible=true;}
 star.position.copy(bodies[0].position);camp.position.set(s[14]+s[16],0,s[15]);camp.updateMatrixWorld(true);instrument.update({angle,power,rod:Number($('rod').value),active:!!s[1],length:s[6],tension:s[7]});
 const hx=s[126],hz=s[127];hook.visible=rope.visible=!!s[1];hook.position.set(hx,-.5,hz);
 for(let i=0;i<48;i++){lineArray[i*3]=s[32+2*i];lineArray[i*3+1]=0;lineArray[i*3+2]=s[33+2*i];}lineGeom.attributes.position.needsUpdate=true;
 for(let i=0;i<12;i++){const f=fishMeshes[i];const x=s[128+2*i],z=s[129+2*i],dx=x-f.g.position.x,dz=z-f.g.position.z;if(Math.hypot(dx,dz)>.001)f.g.rotation.y=-Math.atan2(dz,dx);f.g.position.set(x,0,z);if(view==='hook'&&s[2]||s[3]===i)f.animate(t);f.g.visible=(view==='hook'&&!!s[2]&&3+Math.floor(i/6)===s[2])||s[3]===i;}
 let np=0;const origin=v3(s[14]+s[16]+.8,0,s[15]);forecastBuffer.set([origin.x,0,origin.z],0);np=1;
 if(prediction?.points?.length){for(let i=0;i<prediction.points.length&&np<132;i+=2){forecastBuffer.set([prediction.points[i],0,prediction.points[i+1]],np++*3);}}
 else{const a=angle*Math.PI/180;forecastBuffer.set([origin.x+Math.cos(a)*power*12,0,origin.z+Math.sin(a)*power*12],3);np=2;}
 aimGeom.setDrawRange(0,np);aimGeom.attributes.position.needsUpdate=true;aim.visible=!s[1];aim.material.color.set(prediction?.wet?0x91d6b7:0xd4ab71);
 cursor.visible=!!s[1];cursor.position.set(hx,0,hz);hookLight.visible=false;sea.group.visible=false;scene.fog=null;scene.background.set(0x090e17);
 if(view==='orbit'){
  camera=ortho;bounds(s,w/h);camp.visible=true;rope.material.depthTest=false;cursor.visible=!!s[1];
 }else if(view==='surface'){
  camera=perspective;camp.visible=true;rope.material.depthTest=true;aim.material.depthTest=true;cursor.visible=false;
  skyMix+=(Number(skyLook)-skyMix)*.12;perspective.position.copy(camp.localToWorld(v3(2.6,2.05,-3.65)));perspective.up.set(1,0,0);perspective.lookAt(camp.localToWorld(v3(0,2.6+skyMix*15.4,.45)));
 }else{
  camera=perspective;rope.material.depthTest=true;cursor.visible=false;const target=s[1]?v3(hx,0,hz):origin;
  if(s[1]&&s[2]){
   const j=s[2],body=bodies[j],r=s[12+4*j],n=target.clone().sub(body.position).normalize(),tangent=v3(-n.z,0,n.x);if(n.lengthSq()<.01)n.set(1,0,0);
   const offset=clamp(target.distanceTo(body.position)-2,r*.47+1.3,r-1.5);
   perspective.position.copy(body.position).addScaledVector(n,offset).addScaledVector(tangent,3).add(v3(0,1.7,0));
   const camRad=perspective.position.clone().sub(body.position);if(camRad.length()>r-0.6)perspective.position.copy(body.position).add(camRad.setLength(r-.6));
   perspective.up.copy(n);perspective.lookAt(target);bodies[j].visible=false;cores[j].visible=true;sea.group.visible=true;sea.update(body,r,j===4,t);
   scene.fog=new T.FogExp2(j===3?0x164457:0x51462d,.075);scene.background.set(j===3?0x164457:0x51462d);hookLight.visible=true;hookLight.position.copy(target).add(v3(0,2,0));
  }else{
   const direction=s[1]?target.clone().sub(v3(s[124],0,s[125])).normalize():v3(1,0,0);if(direction.lengthSq()<.01)direction.set(1,0,0);
   perspective.position.copy(target).addScaledVector(direction,-3.2).add(v3(0,1.7,0));perspective.up.set(0,1,0);perspective.lookAt(target.clone().addScaledVector(direction,.7));
  }
 }
 aim.material.depthTest=view!=='orbit';const iw=renderer.domElement.width,ih=renderer.domElement.height;
 renderer.setScissorTest(false);renderer.setViewport(0,0,iw,ih);renderer.render(scene,camera);
 atlasHit.hidden=view==='orbit';if(view==='orbit')labelAtlas({x:0,y:0,w,h});
 else{
  const r=atlasHit.getBoundingClientRect(),sr=stage.getBoundingClientRect(),rect={x:r.left-sr.left,y:r.top-sr.top,w:r.width,h:r.height};
  if(rect.w>0&&rect.h>0){
   // Same world and snapshot, different viewport. Restore exterior geometry for atlas.
   for(let i=0;i<5;i++){bodies[i].visible=true;cores[i].visible=false;}sea.group.visible=false;hookLight.visible=false;scene.fog=null;scene.background.set(0x090e17);camp.visible=true;rope.material.depthTest=false;aim.material.depthTest=false;cursor.visible=!!s[1];fishMeshes.forEach(f=>f.g.visible=false);
   bounds(s,rect.w/rect.h);const sx=Math.round(rect.x/w*iw),sy=Math.round((h-rect.y-rect.h)/h*ih),sw=Math.round(rect.w/w*iw),sh=Math.round(rect.h/h*ih);
   renderer.setViewport(sx,sy,sw,sh);renderer.setScissor(sx,sy,sw,sh);renderer.setScissorTest(true);renderer.render(scene,ortho);renderer.setScissorTest(false);renderer.setViewport(0,0,iw,ih);labelAtlas(rect);
  }
 }
 if(reeling&&t-lastT>.16){tone(75,.06);lastT=t;}document.body.dataset.frames=String((Number(document.body.dataset.frames)||0)+1);
}
requestAnimationFrame(frame);
function cast(){if(!state||state[1]||pendingCast)return;pendingCast=true;clearTimeout(forecastTimer);forecastTimer=0;prediction=null;forecastId++;started=true;paused=false;seen=0;reeling=false;$('pause').textContent='Pause';$('reel').textContent='Reel in';send('cast',{x:Math.cos(angle*Math.PI/180),y:Math.sin(angle*Math.PI/180),power,rod:Number($('rod').value)});tone(320,.2);}
function reel(){if(!state?.[1])return;reeling=!reeling;send('reel',{value:reeling});$('reel').textContent=reeling?'Stop reel':'Reel in';tone(100);}
function pause(){paused=!paused;send('pause',{value:paused});$('pause').textContent=paused?'Run clock':'Pause clock';if(paused)requestForecast();}
function reset(n=seed){seed=n;started=false;paused=true;reeling=false;seen=0;pendingCast=false;prediction=null;forecastId++;send('reset',{seed});$('pause').textContent='Run clock';setTimeout(requestForecast,150);$('reel').textContent='Reel in';$('legend').textContent=seed===1?'I · THE FIRST WATER':'SYSTEM '+seed;}
$('cast').onclick=cast;$('reel').onclick=reel;$('pause').onclick=pause;$('reset').onclick=()=>reset();$('drag').oninput=e=>{send('drag',{value:Number(e.target.value)});requestForecast();};$('rod').onchange=requestForecast;$('angle').oninput=e=>{angle=Number(e.target.value);$('angleOut').textContent=angle+'°';requestForecast();};$('power').oninput=e=>{power=Number(e.target.value);$('powerOut').textContent=Math.round(power*100)+'%';requestForecast();};
$('look').onclick=()=>{skyLook=!skyLook;$('look').textContent=skyLook?'Look at gear':'Look skyward';$('look').setAttribute('aria-pressed',String(skyLook));};
function setView(v){view=v;$('look').hidden=v!=='surface';document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));}document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
let gesture=null;
function setAim(a,p){angle=clamp(a,-65,65);power=clamp(p,.2,1);$('angle').value=angle;$('power').value=power;$('angleOut').textContent=Math.round(angle)+'°';$('powerOut').textContent=Math.round(power*100)+'%';requestForecast();}
function atlasAim(e,r){const p=new T.Vector3((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1,0).unproject(ortho);return Math.atan2(p.z-state[15],p.x-state[14]-state[16]-.8)*180/Math.PI;}
stage.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button')||!state||state[1]||pendingCast)return;const isAtlas=view==='orbit'||e.target===atlasHit||atlasHit.contains(e.target);const r=isAtlas?(view==='orbit'?stage:atlasHit).getBoundingClientRect():null;if(isAtlas){setAim(atlasAim(e,r),power);return;}if(view!=='surface')return;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,angle,dist:0};stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture.dist=Math.hypot(dx,dy);if(gesture.dist>8)setAim(gesture.angle-dx*.45,.2+gesture.dist/Math.max(85,Math.min(stage.clientWidth,stage.clientHeight)*.42));});
stage.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;const release=gesture.dist>24;gesture=null;if(release)cast();});stage.addEventListener('pointercancel',()=>gesture=null);
addEventListener('keydown',e=>{if(e.repeat||e.target.matches('input,select,button')||$('book').open)return;if(e.code==='Space'){e.preventDefault();cast();}if(e.key.toLowerCase()==='r')reel();if(e.key.toLowerCase()==='p')pause();if(['1','2','3'].includes(e.key))setView(['orbit','surface','hook'][Number(e.key)-1]);});
$('sound').onclick=async()=>{sound=!sound;if(sound){try{audio ||=new AudioContext();await audio.resume();}catch{sound=false;}}$('sound').textContent=sound?'Sound on':'Sound off';tone(300);};
function book(help){$('bookTitle').textContent=help?'Operating instructions':'Naturalist’s journal';$('bookBody').replaceChildren();const add=s=>{const p=document.createElement('div');p.className='entry';p.textContent=s;$('bookBody').append(p);};if(help){add('At the lunar seat, drag backward to draw the launcher and release to cast. The atlas inset is interactive: tap a direction or use the azimuth and draw controls. The predicted course uses the same physics as the hook. Start at 0°, full draw, elastic launcher for Nereid; wait for a bite, then reel.');add('The clock is held initially so you can chart a cast. Casting starts the clock. Use Atlas for the full-system view or Hook to inspect flight and water entry. Reset system restores the initial configuration. The current physics are planar with approximate tether and water forces; scientific accuracy is not certified.');}else{add('Specimen credits: '+credits+'. Discovered species: '+Object.keys(fishLog).length+' / 12.');for(const n of species)add((fishLog[n]?n+' · '+fishLog[n]+' recovered':'Undocumented specimen'));} $('book').showModal();}
$('journal').onclick=()=>book(false);$('help').onclick=()=>book(true);$('home').onclick=()=>{$('book').close();reset(1);};$('next').onclick=()=>{if(mode==='Expedition'&&credits<seed*10){$('bookBody').prepend(Object.assign(document.createElement('p'),{textContent:'Recover '+seed+' specimens to unlock the next system, or choose Sandbox.'}));return;}$('book').close();reset(seed+1);};$('mode').onchange=e=>{mode=e.target.value;save();};
let prev=[];setInterval(()=>{const g=navigator.getGamepads?.()[0];if(!g)return;const buttons=g.buttons.map(x=>x.pressed);if(buttons[0]&&!prev[0])cast();if(buttons[1]&&!prev[1])reel();if(buttons[3]&&!prev[3])setView(view==='orbit'?'surface':view==='surface'?'hook':'orbit');if(Math.abs(g.axes[0])>.2){angle=Math.max(-65,Math.min(65,angle+g.axes[0]*2));$('angle').value=angle;$('angleOut').textContent=Math.round(angle)+'°';requestForecast();}prev=buttons;},50);
