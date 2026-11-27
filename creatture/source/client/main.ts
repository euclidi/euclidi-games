import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import init,{Engine} from '../engine/pkg/creatture_core.js';
import './style.css';
import {HabitatAudio} from './audio';
import {groundMaterial,makeTerrain,skinTexture} from './terrain';
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const names=['Membrane','Nutrients','Water','Light','Minerals','Muscle','Nerves','Microbes','Spores','Heat','Catalyst','Resonance'];
const marks=['◉','❋','≈','✳','◇','≋','⋔','∴','⁕','♨','⊕','◌'];
const worlds=['Primordium','Abyss','Mycelium','Silica','Prosthesis','Communion'];
const colors=[0x9ba16e,0x6196a0,0xb8ab87,0x8293b6,0xa89370,0xaab980];
const grounds=[0x454a31,0x243d4d,0x504333,0x454657,0x55534c,0x394b35];
type State={morphology:{nodes:{id:number,parent:number,organ:number,pos:number[],radius:number,exterior:boolean,maturity:number}[],activator:number[],inhibitor:number[],regulation:number[]},ecology:{inhabitants:{id:number,genome:number[],parents:number[],generation:number,biomass:number,reserve:number,position:number[],age:number,relation:number,activity:number}[],births:number,deaths:number,interactions:number,recycled:number,charge:number},mechanics:{limbs:number[][][],enabled:boolean,contacts:boolean[],strain:number,volume_ratio:number,phase:number},network:{pools:number[],integrity:number[],flux:number[],regions:number[],activation:number[],association:number[],stimulus:number,habituation:number,action:number},world_id:number,environment:{name:string,water:number,light:number,temperature:number},seed:number,genome:number[],organs:number[],used:boolean[],history:number[],tissue:number[],nutrient:number,reserve:number,biomass:number,waste:number,input_mass:number,hydration:number,stress:number,learned:number,neural:number,generation:number,parents:number[],turn:number,tick:number,outcome:string,outcome_detail:string,outcome_palette:number,position:number[],velocity:number[]};
type Saved={id:number,name:string,json:string};
let engine:Engine,state:State,mode='puzzle',paused=false,inspection=false,seed=1731,archive:Saved[]=[],db:IDBDatabase|null=null;
const select=(id:string)=>el<HTMLSelectElement>(id);
worlds.forEach((n,i)=>select('world').add(new Option(n,String(i))));
const stage=el('viewport');
const assetBase=import.meta.env.BASE_URL+'rendered/';
const scene=new THREE.Scene();scene.background=new THREE.Color(0x242e28);scene.fog=new THREE.FogExp2(0x242e28,.035);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.14;stage.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(35,1,.1,60);camera.position.set(2.2,1.65,4.35);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,.64,0);orbit.enableDamping=true;orbit.enabled=false;orbit.minDistance=2.5;orbit.maxDistance=13;orbit.maxPolarAngle=Math.PI*.49;orbit.update();
const fill=new THREE.HemisphereLight(0xf0efe5,0x615347,1.4);scene.add(fill);
const key=new THREE.DirectionalLight(0xffebcf,2.9);key.position.set(-3,6,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.bias=-.0005;scene.add(key);
const rim=new THREE.DirectionalLight(0xc4d9ee,2.1);rim.position.set(3,2,-4);scene.add(rim);
const floor=new THREE.Mesh(new THREE.CylinderGeometry(3.3,3.45,.23,96),groundMaterial(0));floor.position.y=-.13;floor.receiveShadow=true;scene.add(floor);
const base=new THREE.Mesh(new THREE.CylinderGeometry(3.48,3.62,.42,96),new THREE.MeshStandardMaterial({color:0x242a27,metalness:.45,roughness:.48}));base.position.y=-.43;base.receiveShadow=true;scene.add(base);
const habitat=new THREE.Group();scene.add(habitat);
const panoramaLoader=new THREE.TextureLoader();const panoramas=new Map<number,THREE.Texture>();let requestedPanorama=-1;
function applyPanorama(id:number){requestedPanorama=id;const cached=panoramas.get(id);if(cached){scene.background=cached;return;}panoramaLoader.load(assetBase+'habitat-'+id+'.png',tex=>{tex.mapping=THREE.EquirectangularReflectionMapping;tex.colorSpace=THREE.SRGBColorSpace;panoramas.set(id,tex);if(requestedPanorama===id)scene.background=tex;},undefined,()=>{});}
const body=new THREE.Group();scene.add(body);
const colonies=new THREE.Group();scene.add(colonies);const companionMeshes=new Map<number,THREE.Mesh>();const companionGeometry=new THREE.SphereGeometry(1,40,28);
const skin=new THREE.MeshPhysicalMaterial({color:colors[0],roughness:.44,clearcoat:.22,clearcoatRoughness:.34,transparent:true,opacity:1,bumpMap:skinTexture(),bumpScale:.025});
const surface=new MarchingCubes(40,skin,true,false,24000);surface.isolation=72;surface.scale.setScalar(1.8);surface.castShadow=true;surface.receiveShadow=true;body.add(surface);
const eyes=new THREE.Group();body.add(eyes);
const iris=new THREE.MeshPhysicalMaterial({color:0xc7b77a,roughness:.28,clearcoat:.8});
const pupil=new THREE.MeshStandardMaterial({color:0x111811,roughness:.15});
const eyeLids:THREE.Mesh[]=[];const pupils:THREE.Mesh[]=[];const eyeAnchors=[new THREE.Vector3(),new THREE.Vector3()];
for(const side of [-1,1]){
 const eye=new THREE.Mesh(new THREE.SphereGeometry(.15,32,24),iris);eye.position.set(side*.22,.19,.47);eye.scale.set(1,.93,.8);eyes.add(eye);eyeLids.push(eye);
 const dot=new THREE.Mesh(new THREE.SphereGeometry(.072,24,16),pupil);dot.position.set(side*.22,.19,.57);dot.scale.z=.5;eyes.add(dot);pupils.push(dot);
}
const internal=new THREE.Group();body.add(internal);internal.visible=false;
const edges=[[0,1],[0,2],[0,4],[0,9],[1,5],[1,7],[1,10],[2,3],[2,5],[2,6],[4,5],[5,6],[6,10],[6,11],[7,8],[8,3],[9,10]];
const pipes=edges.map(()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,1,8),new THREE.MeshStandardMaterial({color:0x9b655b,transparent:true,opacity:.8}));internal.add(m);return m;});
const organMeshes=names.map((_,i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.09,18,12),new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(i/12,.52,.56),roughness:.48}));internal.add(m);return m;});
let finale=0;let lastOutcome='';let lastAction=-1,lastVoice=0;let tissueFrame=0;let pose=new Array(12).fill(0);let previousWorld=-1;
function makeHabitat(id:number){
 const materials=new Set<THREE.Material>();
 habitat.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>materials.add(x));else materials.add(m);}});
 habitat.clear();materials.forEach(m=>m.dispose());
 const old=floor.material;old.map?.dispose();old.dispose();floor.material=groundMaterial(id);
 const back=new THREE.Color(grounds[id]).multiplyScalar(.45);scene.background=back;scene.fog=new THREE.FogExp2(back,.07);skin.color.set(colors[id]);applyPanorama(id);
 key.color.setHex([0xffebcf,0xa5dfff,0xffd5a5,0xe5edff,0xffe1b7,0xffefd8][id]);rim.color.setHex([0xc4d9ee,0x72afd9,0xc8bd9b,0xc7b4ff,0xc4d9ee,0xd2dfb2][id]);
 makeTerrain(id,habitat);
}
function composedCamera(){
 const aspect=Math.max(.4,camera.aspect),d=aspect<.85?1.30:aspect<1.25?1.12:1;
 const center=body.position.clone();center.y=.67;
 orbit.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(1.65,.95,3.65).multiplyScalar(d));orbit.update();
}
function read(){state=JSON.parse(engine.snapshot());if(previousWorld!==state.world_id){previousWorld=state.world_id;makeHabitat(previousWorld);audio.setWorld(previousWorld);}return state}
function ui(){
 el('name').textContent=state.environment.name+' / '+String(state.seed).padStart(4,'0');
 el('status').textContent=state.outcome?state.outcome+' — '+state.outcome_detail: (state.turn?'Developing '+(state.stress>.45?'under stress':'stable tissue'):'Undifferentiated specimen');
 el('turn').textContent=String(state.turn).padStart(2,'0')+(mode==='puzzle'?' / 12':' introductions');
 el('log').textContent=state.history.length?'Last introduced: '+names[state.history.at(-1)!]:'Introduce an element to begin.';
 for(let i=0;i<12;i++){const b=el<HTMLButtonElement>('element-'+i);b.disabled=mode==='archive'||(mode==='puzzle'&&state.used[i]);b.title=names[i]+' · development '+state.organs[i].toFixed(2);}
 el('readout').textContent=['Genome '+state.seed+' · generation '+state.generation,'Parents: '+(state.parents.join(', ')||'none'),'Tick '+state.tick,'State hash '+engine.state_hash(),'Reserve '+state.reserve.toFixed(3),'Nutrients '+state.nutrient.toFixed(3),'Biomass '+state.biomass.toFixed(3),'Waste '+state.waste.toFixed(3),'Mass residual '+(state.input_mass-state.reserve-state.nutrient-state.biomass-state.waste-state.network.pools.reduce((a,b)=>a+b,0)-state.ecology.inhabitants.reduce((a,b)=>a+b.reserve+b.biomass,0)).toExponential(2),'Hydration '+state.hydration.toFixed(2),'Stress '+state.stress.toFixed(2),'Association '+state.learned.toFixed(3),'Neural activity '+state.neural.toFixed(3),'Cue response '+state.network.activation[2].toFixed(3),'Habituation '+state.network.habituation.toFixed(3),'Conditioning '+state.network.association[0].toFixed(3),'Behavior: '+['Feed','Withdraw','Investigate','Approach cue','Rest','Explore'][state.network.action],'Transport '+state.network.flux.reduce((a,b)=>a+Math.abs(b),0).toFixed(4),'Tissue peak '+Math.max(...state.tissue).toFixed(3),'Developmental nodes '+state.morphology.nodes.length,'Regulatory activity '+(state.morphology.regulation.reduce((a,b)=>a+b,0)/12).toFixed(3),'Morphogen inhibitor '+Math.max(...state.morphology.inhibitor).toFixed(3),'Appendage strain '+state.mechanics.strain.toFixed(3),'Tetra volume ratio '+state.mechanics.volume_ratio.toFixed(3),'Ground contacts '+state.mechanics.contacts.map(x=>x?'1':'0').join(' / '),'Population '+(state.ecology.inhabitants.length+1),'Births '+state.ecology.births+' / losses '+state.ecology.deaths,'Resource exchanges '+state.ecology.interactions,'Recycled '+state.ecology.recycled.toFixed(3),'Charge '+state.ecology.charge.toFixed(3),'',...names.map((n,i)=>n.padEnd(10)+' '+state.organs[i].toFixed(2)+' | supply '+state.network.pools[i].toFixed(3)+' | intact '+Math.round(state.network.integrity[i]*100)+'%')].join('\n');
}
function envUI(){for(const [id,key] of [['water','water'],['heat','temperature'],['light','light']] as const)el<HTMLInputElement>(id).value=String(state.environment[key]);}
function reset(id:number){engine?.free();engine=new Engine(id,seed++);read();pose.fill(0);envUI();ui();}
const audio=new HabitatAudio();
function tone(i:number){if(state)audio.event(i,state.world_id,state.position[0],state.position[2],.6);}
function introduce(i:number){
 if(mode==='archive')return;
 const dose=mode==='puzzle'?1:Number(el<HTMLInputElement>('dose').value);
 if(engine.introduce(i,dose,site,mode==='puzzle')){read();tone(i);ui();envUI();}
}
for(let i=0;i<12;i++){const b=document.createElement('button');b.id='element-'+i;b.innerHTML='<b aria-hidden="true">'+marks[i]+'</b><span>'+names[i]+'</span>';const img=new Image();img.alt='';img.src=assetBase+'element-'+String(i).padStart(2,'0')+'.png';img.onload=()=>{const mark=b.querySelector('b');if(mark)mark.replaceWith(img);};img.onerror=()=>{};b.onclick=()=>introduce(i);el('tray').append(b);}
let site=78;stage.addEventListener('pointerdown',e=>{const r=stage.getBoundingClientRect();site=Math.max(0,Math.min(143,Math.floor((e.clientY-r.top)/r.height*12)*12+Math.floor((e.clientX-r.left)/r.width*12)));});
el('reset').onclick=()=>{if(confirm('Begin a new specimen? Preserve the current one first if needed.'))reset(Number(select('world').value));};
select('world').onchange=()=>{if(mode==='archive')return;reset(Number(select('world').value));};
select('mode').onchange=()=>{mode=select('mode').value;el('experiment').hidden=mode!=='free';el('archive').hidden=mode!=='archive';ui();};
el('inspect').onclick=()=>{inspection=!inspection;internal.visible=inspection;skin.opacity=inspection?.27:1;skin.depthWrite=!inspection;el('panel').hidden=!inspection;el('inspect').setAttribute('aria-pressed',String(inspection));};
el('camera').onclick=()=>{orbit.enabled=!orbit.enabled;el('camera').textContent=orbit.enabled?'Return to composition':'Inspect camera';if(!orbit.enabled){composedCamera();}};
el('sound').onclick=async()=>{try{if(audio.ctx){await audio.disable();}else{await audio.enable(state.world_id);tone(0);}el('sound').textContent=audio.ctx?'Sound on':'Sound off';el('sound').setAttribute('aria-pressed',String(!!audio.ctx));}catch(e){el('log').textContent='Audio unavailable: '+String(e);}};
for(const id of ['music','effects'])el(id).oninput=()=>{audio.setLevels(Number(el<HTMLInputElement>('music').value),Number(el<HTMLInputElement>('effects').value));};
el('bud').onclick=()=>{if(mode==='free'){const ok=engine.bud(Number(select('relation').value));read();ui();el('log').textContent=ok?'Offspring established.':'Needs developed spores and sufficient reserve.';}};
el('cue').onclick=()=>{if(mode==='free'){engine.stimulate(1);read();ui();}};
el('damage').onclick=()=>{if(mode==='free'){engine.damage(site,.65);read();ui();}};
el('pause').onclick=()=>{paused=!paused;el('pause').textContent=paused?'Resume':'Pause';};
for(const id of ['water','light','heat'])el(id).oninput=()=>{if(mode==='free'){engine.environment(...(['water','light','heat'].map(x=>Number(el<HTMLInputElement>(x).value)) as [number,number,number]));read();ui();}};
function archiveUI(){const s=select('samples');s.replaceChildren();archive.forEach(a=>s.add(new Option(a.name,String(a.id))));}
function selected(){return archive.find(x=>x.id===Number(select('samples').value));}
function openDB():Promise<void>{return new Promise((resolve,reject)=>{const q=indexedDB.open('creatture-v1',1);q.onupgradeneeded=()=>q.result.createObjectStore('specimens',{keyPath:'id'});q.onerror=()=>reject(q.error);q.onsuccess=()=>{db=q.result;const r=db.transaction('specimens').objectStore('specimens').getAll();r.onerror=()=>reject(r.error);r.onsuccess=()=>{archive=r.result;archiveUI();resolve();};};});}
el('save').onclick=()=>{if(!db){el('log').textContent='Persistence unavailable.';return;}const item={id:Date.now(),name:state.environment.name+' / '+state.seed+' · G'+state.generation,json:engine.snapshot()};const tx=db.transaction('specimens','readwrite');tx.objectStore('specimens').put(item);tx.oncomplete=()=>{archive.push(item);archiveUI();el('log').textContent='Specimen preserved.';};tx.onerror=()=>el('log').textContent='Preservation failed.';};
el('restore').onclick=()=>{const s=selected();if(s&&engine.restore(s.json)){read();select('world').value=String(state.world_id);envUI();ui();}};
el('transfer').onclick=()=>{const s=selected();const id=Number(select('world').value);const before=engine.snapshot();if(s&&engine.restore(s.json)&&engine.transfer(id)){select('mode').value='free';select('mode').dispatchEvent(new Event('change'));read();envUI();ui();}else{engine.restore(before);read();ui();el('log').textContent='Transfer rejected: habitat tolerance or invalid specimen.';}};
el('breed').onclick=()=>{const s=selected();if(s&&engine.breed(s.json,seed++)){read();select('mode').value='free';select('mode').dispatchEvent(new Event('change'));envUI();ui();}};
document.addEventListener('keydown',e=>{if((e.target as HTMLElement).matches('input,select,button'))return;const keys='1234567890-=';const i=keys.indexOf(e.key);if(i>=0)introduce(i);});
let last=performance.now(),acc=0;let time=0;let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;el<HTMLInputElement>('reduced').checked=reduced;el('reduced').onchange=()=>{reduced=el<HTMLInputElement>('reduced').checked;};let padHeld=false,padFocus=0,padMoveAt=0;
el('settings').onclick=()=>{const panel=el('settings-panel');panel.hidden=!panel.hidden;el('settings').setAttribute('aria-expanded',String(!panel.hidden));};
el('quality').onchange=()=>resize();
el('export').onclick=()=>{if(!state)return;const blob=new Blob([engine.snapshot()],{type:'application/json'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='creatture-'+state.seed+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
el('verify-replay').onclick=()=>{if(mode!=='puzzle'){el('log').textContent='Replay verification requires puzzle mode.';return;}const result=engine.verify_puzzle_replay();el('log').textContent=result?'Deterministic replay matched.':'Replay does not match current experiment.';};
function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;const scale=Math.min(1,Number(select('quality').value)/w);renderer.setSize(Math.round(w*scale),Math.round(h*scale),false);camera.aspect=w/h;camera.updateProjectionMatrix();if(!orbit.enabled)composedCamera();}
new ResizeObserver(resize).observe(stage);resize();
function draw(now:number){
 const dt=Math.min(.1,(now-last)/1000);last=now;time+=dt;acc+=dt;
 const pad=Array.from(navigator.getGamepads?.()||[]).find(x=>x?.mapping==='standard');if(pad&&state){const dir=(pad.buttons[15]?.pressed||pad.axes[0]>.6)?1:(pad.buttons[14]?.pressed||pad.axes[0]<-.6)?-1:0;if(dir&&now-padMoveAt>180){padFocus=(padFocus+12+dir)%12;el('element-'+padFocus).focus();padMoveAt=now;}const down=!!pad.buttons[0]?.pressed;if(down&&!padHeld)introduce(padFocus);padHeld=down;}else padHeld=false;
 if(state){
  if(state.outcome!==lastOutcome){lastOutcome=state.outcome;finale=state.outcome?1:0;if(finale)tone(11);}
  finale=Math.max(0,finale-dt*.4);
  if(mode==='free'&&!paused&&acc>=.1){engine.advance(Math.floor(acc*10)*Number(select('speed').value));acc=0;read();ui();}else if(mode!=='free'||paused)acc=0;
  if(state.network.action!==lastAction&&time-lastVoice>1.2&&state.organs[11]>.12){lastAction=state.network.action;lastVoice=time;audio.event(6+lastAction,state.world_id,state.position[0],state.position[2],.23+state.organs[11]*.13);}
  const a=state.organs;for(let i=0;i<12;i++)pose[i]+=(a[i]-pose[i])*Math.min(1,dt*2.2);
  const t=reduced?0:time;const finalColor=new THREE.Color(colors[state.world_id]);if(state.outcome)finalColor.offsetHSL((state.outcome_palette-2.5)*.045,.04,.02);skin.color.lerp(finalColor,Math.min(1,dt*1.5));skin.emissive.set(finalColor);skin.emissiveIntensity=reduced?0:finale*.16;const breath=1+Math.sin(t*2.1)*.025*(1-state.stress);body.scale.set(breath,1/breath,breath);
  const target=mode==='free'?state.position:[0,.68,0];body.position.lerp(new THREE.Vector3(target[0],Math.max(.58,Math.min(1.7,target[1])),target[2]),Math.min(1,dt*4));
  body.rotation.y=mode==='free'&&state.mechanics.enabled?0:Math.sin(t*.6+state.genome[0]*3)*.16+state.neural*.18;
  if(++tissueFrame%2===0){
   surface.reset();
   const balls:{x:number,y:number,z:number,s:number}[]=[];
   const ball=(p:number[],r:number)=>{const x=.5+p[0]/3.6,y=.5+p[1]/3.6,z=.5+p[2]/3.6,s=Math.pow(r/3.6,2)*84;if(x>.025&&x<.975&&y>.025&&y<.975&&z>.025&&z<.975){surface.addBall(x,y,z,s,12);balls.push({x,y,z,s});}};
   const nodes=state.morphology.nodes;
   for(const n of nodes){
    if(!n.exterior||(n.organ===5&&mode==='free'&&state.mechanics.enabled))continue;
    const p=n.pos.slice();if(n.id!==0){p[1]+=Math.sin(t*1.6+n.id*.8)*.016*n.maturity;p[0]+=Math.sin(t*.9+n.id*.7)*.012*n.maturity;}
    const r=n.radius*(n.id===0?1:Math.min(1,.35+pose[n.organ]*.7));
    ball(p,r);
    if(n.id!==0){const par=nodes[n.parent];const distance=Math.hypot(...p.map((x,i)=>x-par.pos[i]));const count=Math.min(5,Math.max(1,Math.ceil(distance/Math.max(.09,r*.9))));for(let j=1;j<count;j++){const f=j/count;ball(p.map((x,i)=>par.pos[i]*(1-f)+x*f),Math.max(.035,r*(.75+.25*f)));}}
   }
   // Muscular appendages use physical node positions in free cultivation.
   if(mode==='free'&&state.mechanics.enabled&&pose[5]>.03)for(const chain of state.mechanics.limbs){
    let prev:number[]|null=null;for(let j=0;j<chain.length;j++){const p=chain[j].map((v,k)=>v-body.position.getComponent(k));const r=Math.max(.07,.13+pose[5]*.03-j*.009);ball(p,r);if(prev)ball(p.map((v,k)=>(v+prev![k])*.5),r*.87);prev=p;}
   }
   // Find the visible implicit surface at the eye locations, instead of hard-coded
   // offsets. The equation matches Three.js MarchingCubes.addBall.
   const field=(x:number,y:number,z:number)=>balls.reduce((sum,b)=>sum+Math.max(0,b.s/(.000001+(x-b.x)**2+(y-b.y)**2+(z-b.z)**2)-12),0);
   for(let i=0;i<2;i++){const sign=i===0?-1:1;const x=.5+sign*(.18+state.genome[0]*.045)/3.6;const y=.5+(.17+pose[6]*.025)/3.6;let z=.5;
    for(let q=.94;q>=.50;q-=.004){if(field(x,y,q)>=surface.isolation){z=q;break;}}
    eyeAnchors[i].set((x-.5)*3.6,(y-.5)*3.6,(z-.5)*3.6+.025);
   }
   surface.update();
  }
  eyes.visible=pose[6]>.09&&state.world_id!==2;eyes.scale.setScalar(1);
  const alert=state.network.action===1?1:state.network.action===2?.45:0;
  const sleepy=state.network.action===4?.55:0;
  const blink=reduced?0:Math.pow(Math.max(0,Math.cos(t*(.9+state.genome[2]*.6)+state.genome[2]*5)),42);
  const eyeSize=Math.min(1.15,.64+pose[6]*.19);
  eyeLids.forEach((e,i)=>{const anchor=eyeAnchors[i];const yScale=(1-.90*blink)*(1-.42*sleepy+.1*alert);e.position.copy(anchor);e.scale.set(eyeSize,eyeSize*.93*yScale,eyeSize*.8);
   const d=pupils[i];d.visible=blink<.72;d.position.copy(anchor);d.position.z+=.104*eyeSize;d.position.x+=Math.sin(t*.8+state.neural)*.023*eyeSize;d.position.y+=alert*.012;d.scale.set(eyeSize,eyeSize*yScale,eyeSize*.5);
  });
  organMeshes.forEach((m,i)=>{m.visible=a[i]>.03;m.scale.setScalar((.65+a[i]*.35)*(.6+.4*state.network.integrity[i]));const n=state.morphology.nodes.find(n=>n.organ===i);if(n)m.position.set(n.pos[0]*.67,n.pos[1]*.67,n.pos[2]*.67);else m.position.set(0,0,0);});
  pipes.forEach((m,i)=>{const [x,y]=edges[i],p=organMeshes[x].position,q=organMeshes[y].position,d=q.clone().sub(p);m.visible=a[x]>.03&&a[y]>.03;m.position.copy(p).add(q).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());m.scale.set(1+Math.abs(state.network.flux[i])*500,d.length(),1+Math.abs(state.network.flux[i])*500);m.material.color.setHex(state.network.flux[i]>=0?0xc58b6d:0x6399b1);});
  const alive=new Set(state.ecology.inhabitants.map(o=>o.id));for(const [id,m] of companionMeshes){if(!alive.has(id)){colonies.remove(m);(m.material as THREE.Material).dispose();companionMeshes.delete(id);}}
  for(const o of state.ecology.inhabitants){let m=companionMeshes.get(o.id);if(!m){const mat=new THREE.MeshPhysicalMaterial({color:new THREE.Color(colors[state.world_id]).offsetHSL((o.genome[0]-.5)*.18,0,.03),roughness:.5,clearcoat:.2});m=new THREE.Mesh(companionGeometry,mat);m.castShadow=true;colonies.add(m);companionMeshes.set(o.id,m);m.position.set(o.position[0],.2,o.position[1]);}
   const rad=Math.min(.48,.16+Math.cbrt(o.biomass)*.19);m.position.lerp(new THREE.Vector3(o.position[0],rad*.8,o.position[1]),Math.min(1,dt*6));m.scale.set(rad*(1+.06*Math.sin(t*2+o.id%100)),rad*.8,rad*(1+.09*o.activity));
  }
  if(!orbit.enabled&&mode==='free'){const target=body.position.clone();target.y=.67;const delta=target.sub(orbit.target).multiplyScalar(Math.min(1,dt*2.8));orbit.target.add(delta);camera.position.add(delta);}orbit.update();renderer.render(scene,camera);
 }requestAnimationFrame(draw);
}
async function start(){await init();reset(0);try{await openDB();}catch{el('log').textContent='Archive storage unavailable.';}requestAnimationFrame(draw);}
start().catch(e=>{el('status').textContent='Engine failed to initialize: '+String(e);console.error(e);});
