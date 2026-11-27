import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import init,{Engine} from '../engine/pkg/creatture_core.js';
import './style.css';
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const names=['Membrane','Nutrients','Water','Light','Minerals','Muscle','Nerves','Microbes','Spores','Heat','Catalyst','Resonance'];
const marks=['◉','❋','≈','✳','◇','≋','⋔','∴','⁕','♨','⊕','◌'];
const worlds=['Primordium','Abyss','Mycelium','Silica','Prosthesis','Communion'];
const colors=[0x9ba16e,0x6196a0,0xb8ab87,0x8293b6,0xa89370,0xaab980];
const grounds=[0x454a31,0x243d4d,0x504333,0x454657,0x55534c,0x394b35];
type State={world_id:number,environment:{name:string,water:number,light:number,temperature:number},seed:number,genome:number[],organs:number[],used:boolean[],history:number[],tissue:number[],nutrient:number,reserve:number,biomass:number,waste:number,input_mass:number,hydration:number,stress:number,learned:number,neural:number,generation:number,parents:number[],turn:number,tick:number,outcome:string,position:number[],velocity:number[]};
type Saved={id:number,name:string,json:string};
let engine:Engine,state:State,mode='puzzle',paused=false,inspection=false,seed=1731,archive:Saved[]=[],db:IDBDatabase|null=null;
const select=(id:string)=>el<HTMLSelectElement>(id);
worlds.forEach((n,i)=>select('world').add(new Option(n,String(i))));
const stage=el('viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x242e28);scene.fog=new THREE.FogExp2(0x242e28,.035);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.14;stage.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(37,1,.1,60);camera.position.set(4.5,3.3,7.5);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,0.85,0);orbit.enableDamping=true;orbit.enabled=false;orbit.minDistance=2.5;orbit.maxDistance=13;orbit.maxPolarAngle=Math.PI*.49;orbit.update();
scene.add(new THREE.HemisphereLight(0xe1e9cf,0x302219,2.0));
const key=new THREE.DirectionalLight(0xffe3b1,3.2);key.position.set(-3,6,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.bias=-.0005;scene.add(key);
const rim=new THREE.DirectionalLight(0xa5c7d9,1.9);rim.position.set(3,2,-4);scene.add(rim);
const floor=new THREE.Mesh(new THREE.CylinderGeometry(3.3,3.45,.23,96),new THREE.MeshStandardMaterial({color:grounds[0],roughness:.82}));floor.position.y=-.13;floor.receiveShadow=true;scene.add(floor);
const base=new THREE.Mesh(new THREE.CylinderGeometry(3.48,3.62,.42,96),new THREE.MeshStandardMaterial({color:0x242a27,metalness:.45,roughness:.48}));base.position.y=-.43;base.receiveShadow=true;scene.add(base);
const habitat=new THREE.Group();scene.add(habitat);
const body=new THREE.Group();scene.add(body);
const skin=new THREE.MeshPhysicalMaterial({color:colors[0],roughness:.43,clearcoat:.19,clearcoatRoughness:.3,transparent:true,opacity:1});
const surface=new MarchingCubes(34,skin,false,false,16000);surface.isolation=72;surface.scale.setScalar(1.8);surface.castShadow=true;surface.receiveShadow=true;body.add(surface);
const eyes=new THREE.Group();body.add(eyes);
const iris=new THREE.MeshPhysicalMaterial({color:0xc7b77a,roughness:.22,clearcoat:1});
const pupil=new THREE.MeshStandardMaterial({color:0x111811,roughness:.15});
const eyeLids:THREE.Mesh[]=[];const pupils:THREE.Mesh[]=[];
for(const side of [-1,1]){
 const eye=new THREE.Mesh(new THREE.SphereGeometry(.15,32,24),iris);eye.position.set(side*.22,.19,.47);eye.scale.set(1,.93,.8);eyes.add(eye);eyeLids.push(eye);
 const dot=new THREE.Mesh(new THREE.SphereGeometry(.072,24,16),pupil);dot.position.set(side*.22,.19,.57);dot.scale.z=.5;eyes.add(dot);pupils.push(dot);
}
const internal=new THREE.Group();body.add(internal);internal.visible=false;
const organMeshes=names.map((_,i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.09,18,12),new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(i/12,.52,.56),roughness:.48}));internal.add(m);return m;});
let tissueFrame=0;let pose=new Array(12).fill(0);let previousWorld=-1;
function makeHabitat(id:number){
 while(habitat.children.length){const o=habitat.children[0] as THREE.Mesh;habitat.remove(o);o.geometry?.dispose();(o.material as THREE.Material)?.dispose();}
 floor.material.color.set(grounds[id]);const back=new THREE.Color(grounds[id]).multiplyScalar(.45);scene.background=back;scene.fog=new THREE.FogExp2(back,.045);skin.color.set(colors[id]);
 for(let i=0;i<30;i++){
  const angle=i*2.39996;const r=1.8+(i%7)*.19;const h=.12+(i%5)*.1;
  let geom:THREE.BufferGeometry;
  if(id===3)geom=new THREE.ConeGeometry(.16,h*2.3,5);
  else if(id===4)geom=new THREE.CylinderGeometry(.08,.14,h*2,12);
  else if(id===2)geom=new THREE.LatheGeometry([new THREE.Vector2(0,0),new THREE.Vector2(.05,0),new THREE.Vector2(.035,h),new THREE.Vector2(.18,h+.02),new THREE.Vector2(.14,h+.1),new THREE.Vector2(0,h+.14)],20);
  else geom=new THREE.DodecahedronGeometry(.18+h*.23,1);
  const mesh=new THREE.Mesh(geom,new THREE.MeshStandardMaterial({color:new THREE.Color(colors[id]).multiplyScalar(.32+(i%4)*.13),roughness:id===3?.31:.83,metalness:id===4?.55:0}));mesh.position.set(Math.cos(angle)*r,h*.45,Math.sin(angle)*r);mesh.rotation.y=angle;mesh.castShadow=true;mesh.receiveShadow=true;habitat.add(mesh);
 }
}
function read(){state=JSON.parse(engine.snapshot());if(previousWorld!==state.world_id){previousWorld=state.world_id;makeHabitat(previousWorld);}return state}
function ui(){
 el('name').textContent=state.environment.name+' / '+String(state.seed).padStart(4,'0');
 el('status').textContent=state.outcome|| (state.turn?'Developing '+(state.stress>.45?'under stress':'stable tissue'):'Undifferentiated specimen');
 el('turn').textContent=String(state.turn).padStart(2,'0')+(mode==='puzzle'?' / 12':' introductions');
 el('log').textContent=state.history.length?'Last introduced: '+names[state.history.at(-1)!]:'Introduce an element to begin.';
 for(let i=0;i<12;i++){const b=el<HTMLButtonElement>('element-'+i);b.disabled=mode==='archive'||(mode==='puzzle'&&state.used[i]);b.title=names[i]+' · development '+state.organs[i].toFixed(2);}
 el('readout').textContent=['Genome '+state.seed+' · generation '+state.generation,'Parents: '+(state.parents.join(', ')||'none'),'Tick '+state.tick,'Reserve '+state.reserve.toFixed(3),'Nutrients '+state.nutrient.toFixed(3),'Biomass '+state.biomass.toFixed(3),'Waste '+state.waste.toFixed(3),'Mass residual '+(state.input_mass-state.reserve-state.nutrient-state.biomass-state.waste).toExponential(2),'Hydration '+state.hydration.toFixed(2),'Stress '+state.stress.toFixed(2),'Association '+state.learned.toFixed(3),'Neural activity '+state.neural.toFixed(3),'Tissue peak '+Math.max(...state.tissue).toFixed(3),'',...names.map((n,i)=>n.padEnd(10)+' '+state.organs[i].toFixed(2))].join('\n');
}
function envUI(){for(const [id,key] of [['water','water'],['heat','temperature'],['light','light']] as const)el<HTMLInputElement>(id).value=String(state.environment[key]);}
function reset(id:number){engine?.free();engine=new Engine(id,seed++);read();pose.fill(0);envUI();ui();}
let audio:AudioContext|null=null;
function tone(i:number){if(!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(130*Math.pow(2,(i+state.world_id*2)/12),audio.currentTime);g.gain.setValueAtTime(.001,audio.currentTime);g.gain.exponentialRampToValueAtTime(.045,audio.currentTime+.045);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.6);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.65);}
function introduce(i:number){
 if(mode==='archive')return;
 const dose=mode==='puzzle'?1:Number(el<HTMLInputElement>('dose').value);
 if(engine.introduce(i,dose,site,mode==='puzzle')){read();tone(i);ui();envUI();}
}
for(let i=0;i<12;i++){const b=document.createElement('button');b.id='element-'+i;b.innerHTML='<b aria-hidden="true">'+marks[i]+'</b>'+names[i];b.onclick=()=>introduce(i);el('tray').append(b);}
let site=78;stage.addEventListener('pointerdown',e=>{const r=stage.getBoundingClientRect();site=Math.max(0,Math.min(143,Math.floor((e.clientY-r.top)/r.height*12)*12+Math.floor((e.clientX-r.left)/r.width*12)));});
el('reset').onclick=()=>{if(confirm('Begin a new specimen? Preserve the current one first if needed.'))reset(Number(select('world').value));};
select('world').onchange=()=>{if(mode==='archive')return;reset(Number(select('world').value));};
select('mode').onchange=()=>{mode=select('mode').value;el('experiment').hidden=mode!=='free';el('archive').hidden=mode!=='archive';ui();};
el('inspect').onclick=()=>{inspection=!inspection;internal.visible=inspection;skin.opacity=inspection?.27:1;skin.depthWrite=!inspection;el('panel').hidden=!inspection;el('inspect').setAttribute('aria-pressed',String(inspection));};
el('camera').onclick=()=>{orbit.enabled=!orbit.enabled;el('camera').textContent=orbit.enabled?'Return to composition':'Inspect camera';if(!orbit.enabled){camera.position.set(4.5,3.3,7.5);orbit.target.set(0,.85,0);orbit.update();}};
el('sound').onclick=async()=>{if(audio){await audio.close();audio=null;}else{audio=new AudioContext();await audio.resume();tone(0);}el('sound').textContent=audio?'Sound on':'Sound off';el('sound').setAttribute('aria-pressed',String(!!audio));};
el('pause').onclick=()=>{paused=!paused;el('pause').textContent=paused?'Resume':'Pause';};
for(const id of ['water','light','heat'])el(id).oninput=()=>{if(mode==='free'){engine.environment(...(['water','light','heat'].map(x=>Number(el<HTMLInputElement>(x).value)) as [number,number,number]));read();ui();}};
function archiveUI(){const s=select('samples');s.replaceChildren();archive.forEach(a=>s.add(new Option(a.name,String(a.id))));}
function selected(){return archive.find(x=>x.id===Number(select('samples').value));}
function openDB():Promise<void>{return new Promise((resolve,reject)=>{const q=indexedDB.open('creatture-v1',1);q.onupgradeneeded=()=>q.result.createObjectStore('specimens',{keyPath:'id'});q.onerror=()=>reject(q.error);q.onsuccess=()=>{db=q.result;const r=db.transaction('specimens').objectStore('specimens').getAll();r.onerror=()=>reject(r.error);r.onsuccess=()=>{archive=r.result;archiveUI();resolve();};};});}
el('save').onclick=()=>{if(!db){el('log').textContent='Persistence unavailable.';return;}const item={id:Date.now(),name:state.environment.name+' / '+state.seed+' · G'+state.generation,json:engine.snapshot()};const tx=db.transaction('specimens','readwrite');tx.objectStore('specimens').put(item);tx.oncomplete=()=>{archive.push(item);archiveUI();el('log').textContent='Specimen preserved.';};tx.onerror=()=>el('log').textContent='Preservation failed.';};
el('restore').onclick=()=>{const s=selected();if(s&&engine.restore(s.json)){read();select('world').value=String(state.world_id);envUI();ui();}};
el('transfer').onclick=()=>{const s=selected();const id=Number(select('world').value);if(s&&engine.restore(s.json)&&engine.transfer(id)){select('mode').value='free';select('mode').dispatchEvent(new Event('change'));read();envUI();ui();}};
el('breed').onclick=()=>{const s=selected();if(s&&engine.breed(s.json,seed++)){read();select('mode').value='free';select('mode').dispatchEvent(new Event('change'));envUI();ui();}};
document.addEventListener('keydown',e=>{if((e.target as HTMLElement).matches('input,select,button'))return;const keys='1234567890-=';const i=keys.indexOf(e.key);if(i>=0)introduce(i);});
let last=performance.now(),acc=0;let time=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;const scale=Math.min(1,1280/w);renderer.setSize(Math.round(w*scale),Math.round(h*scale),false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();
function draw(now:number){
 const dt=Math.min(.1,(now-last)/1000);last=now;time+=dt;acc+=dt;
 if(state){
  if(mode==='free'&&!paused&&acc>=.1){engine.advance(Math.floor(acc*10));acc=0;read();ui();}else if(mode!=='free'||paused)acc=0;
  const a=state.organs;for(let i=0;i<12;i++)pose[i]+=(a[i]-pose[i])*Math.min(1,dt*2.2);
  const t=reduced?0:time;const breath=1+Math.sin(t*2.1)*.025*(1-state.stress);body.scale.set(breath,1/breath,breath);
  const target=mode==='free'?state.position:[0,.68,0];body.position.lerp(new THREE.Vector3(target[0],Math.max(.58,Math.min(1.7,target[1])),target[2]),Math.min(1,dt*4));
  body.rotation.y=Math.sin(t*.6+state.genome[0]*3)*.16+state.neural*.18;
  if(++tissueFrame%2===0){
   surface.reset();const add=(x:number,y:number,z:number,s:number)=>surface.addBall(x,y,z,s,12);
   add(.5,.48,.5,.72+pose[0]*.09+pose[1]*.09);add(.5,.57,.58,.22+pose[6]*.05);
   for(const side of [-1,1]){
    if(pose[5]>.03){for(let j=0;j<3;j++)add(.5+side*(.1+j*.045),.42-j*.025+Math.sin(t*3+j+side)*.013,.5-j*.025,Math.max(.03,pose[5]*.085));}
    if(pose[11]>.1){for(let j=0;j<3;j++)add(.5+side*(.055+j*.024),.6+j*.04,.52,pose[11]*.04);}
    if(pose[2]>.2)add(.5+side*.15,.49,.46,pose[2]*.12);
   }
   if(pose[8]>.15)for(let j=0;j<6;j++)add(.5+Math.cos(j)*.1,.5+Math.sin(j)*.1,.4,pose[8]*.04);
   if(pose[4]>.15)add(.5,.5,.37,pose[4]*.11);
   surface.update();
  }
  eyes.visible=pose[6]>.09;eyes.scale.setScalar(Math.min(1.3,.55+pose[6]*.32));const blink=!reduced&&Math.pow(Math.max(0,Math.cos(t*1.16+state.genome[2]*5)),42);eyeLids.forEach((e,i)=>{e.scale.y=.93*(1-.92*Number(blink));pupils[i].visible=Number(blink)<.7;pupils[i].position.x=(i?1:-1)*.22+Math.sin(t*.8)*.018;});
  organMeshes.forEach((m,i)=>{m.visible=a[i]>.03;m.scale.setScalar(.65+a[i]*.35);m.position.set(Math.cos(i*2.4)*.26,Math.sin(i*1.2)*.22,Math.sin(i*2.4)*.23);});
  orbit.update();renderer.render(scene,camera);
 }requestAnimationFrame(draw);
}
async function start(){await init();reset(0);try{await openDB();}catch{el('log').textContent='Archive storage unavailable.';}requestAnimationFrame(draw);}
start().catch(e=>{el('status').textContent='Engine failed to initialize: '+String(e);console.error(e);});
