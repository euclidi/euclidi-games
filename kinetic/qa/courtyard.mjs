import {Engine,Scene,Vector3,Color3,Color4,UniversalCamera,HemisphericLight,DirectionalLight,MeshBuilder,StandardMaterial,PhysicsAggregate,PhysicsShapeType,HavokPlugin,ImportMeshAsync,TransformNode,Quaternion,ShadowGenerator} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import HavokPhysics from '@babylonjs/havok';
import {createSession} from '../src/session.mjs';
import {saveSession,loadSession} from '../src/storage.mjs';
const $=id=>document.getElementById(id), canvas=$('view'), state={phase:'loading',errors:[],shots:0,hit:0,position:[0,0,0],camera:'first',assets:[]};window.kineticPlay=state;
const lib='/assets/resource-library/foundations-3d/', models='/kinetic/qa/generated/models/';
const vec=(a)=>new Vector3(...a), arr=p=>[p.x,p.y,p.z], limit=(n,a,b)=>Math.max(a,Math.min(b,n));
const session=createSession(), keys=new Set(), shots=new Map(), recoveries=new Map();
let engine,scene,cam,actor,body,bow,arrowTemplate,rockTemplate,heldStone,shadow,selected=null,origin='hunter',started=false,first=true,yaw=0,pitch=0,charge=0,charging=false,look=null,clock=0,notice='',noticeUntil=0;
const targets=[], obstacles=[];
function tell(message){notice=message;noticeUntil=performance.now()+4500;$('notice').textContent=message}
function material(name,color){const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=new Color3(.06,.06,.06);return m}
function bounds(meshes){let min=new Vector3(Infinity,Infinity,Infinity),max=new Vector3(-Infinity,-Infinity,-Infinity);for(const m of meshes){if(!m.getTotalVertices())continue;m.computeWorldMatrix(true);const b=m.getBoundingInfo().boundingBox;min=Vector3.Minimize(min,b.minimumWorld);max=Vector3.Maximize(max,b.maximumWorld)}return {min,max,size:max.subtract(min),center:min.add(max).scale(.5)}}
async function model(name,url,height,{centered=false,axisFit=false}={}){
 const data=await ImportMeshAsync(url,scene);const root=data.meshes[0],pivot=new TransformNode(name,scene);
 root.parent=pivot;const b=bounds(data.meshes);const span=axisFit?Math.max(b.size.x,b.size.y,b.size.z):b.size.y;if(!Number.isFinite(span)||span<1e-5)throw Error('Invalid geometry '+name);
 const scale=height/span;root.scaling.scaleInPlace(scale);root.position.subtractInPlace(new Vector3(b.center.x,centered?b.center.y:b.min.y,b.center.z).scale(scale));pivot.computeWorldMatrix(true);
 const mesh=data.meshes.filter(m=>m.getTotalVertices()>0);const ext=bounds(mesh);for(const m of mesh){m.receiveShadows=true;shadow?.addShadowCaster(m)}
 state.assets.push({name,vertices:mesh.reduce((n,m)=>n+m.getTotalVertices(),0)});
 const axis=b.size.x>=b.size.y&&b.size.x>=b.size.z?new Vector3(1,0,0):b.size.y>=b.size.z?new Vector3(0,1,0):new Vector3(0,0,1);
 return {pivot,mesh,animations:data.animationGroups||[],size:ext.size,axis};
}
function place(m,x,z,y=0,rotation=0){m.pivot.position.set(x,y,z);m.pivot.rotation.y=rotation;m.pivot.computeWorldMatrix(true);return m}
function physicalObstacle(m,{bounce=.15,score=false,id=m.pivot.name}={}){
 const b=bounds(m.mesh);const radius=score?Math.min(b.size.x,b.size.z)*.5:Math.max(b.size.x,b.size.z)*.5;
 const target={id,center:arr(b.center),radius:Math.max(.12,radius),material:'wood',score,bounce};
 (score?targets:obstacles).push(target);for(const mesh of m.mesh)mesh.checkCollisions=true;return target
}
function fromAxis(a,b){const dot=limit(Vector3.Dot(a,b),-1,1);if(dot>0.99999)return Quaternion.Identity();if(dot<-.99999){const x=Vector3.Cross(a,Math.abs(a.x)<.8?Vector3.Right():Vector3.Up()).normalize();return Quaternion.RotationAxis(x,Math.PI)}return Quaternion.RotationAxis(Vector3.Cross(a,b).normalize(),Math.acos(dot))}
function cloneVisual(template,name){const p=template.pivot.clone(name,null,false);if(!p)throw Error('Model clone failed');p.setEnabled(true);return p}
function direction(){return new Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch))}
function choose(type){
 const v=session.view();let gear=v.character.inventory.find(x=>x.type===type&&x.available!==false);
 if(!gear&&type==='stone'&&!v.character.inventory.some(x=>x.type==='stone')){if(session.acquire('stone'))gear=session.view().character.inventory.find(x=>x.type==='stone')}
 if(!gear&&type==='shortbow'&&!v.character.inventory.some(x=>x.type==='shortbow')){if(session.acquire('shortbow'))gear=session.view().character.inventory.find(x=>x.type==='shortbow')}
 if(!gear){tell('Equipment unavailable. Recover a thrown item or obtain supplies.');return false}
 selected=gear.uid;charging=false;charge=0;refresh();return true
}
function refresh(){if(!started)return;const v=session.view(),item=v.character.inventory.find(x=>x.uid===selected),id=item?.type;
 $('gear').textContent=(id||'Unarmed')+' · Arrows '+(v.world.items.arrow||0)+' · Coins '+v.world.coins;
 const skill=id?v.character.skills[id]:null;$('progress').textContent=(id?'Level '+session.core.xpLevel(skill?.xp||0)+' · XP '+(skill?.xp||0):'Acquire a weapon to practice')+' · Hits '+state.hit;
 state.ammo=v.world.items.arrow||0;state.xp=v.character.skills.shortbow?.xp||0;state.stoneXP=v.character.skills.stone?.xp||0;state.selected=id||null;
 $('draw').value=charge;bow?.pivot.setEnabled(id==='shortbow'&&item.available!==false);heldStone?.setEnabled(id==='stone'&&item.available!==false)
}
function startCharge(){if(!started||!selected||charging)return;charge=0;charging=true;}
function release(){if(!charging)return;charging=false;const power=charge;charge=0;
 const item=session.view().character.inventory.find(x=>x.uid===selected);
 if(!item||power<.08){refresh();return}
 const d=direction(),p=actor.position.add(new Vector3(0,.68,0)).add(d.scale(.55));
 // Fictional game tuning, not physical equipment specifications. No aim correction.
 const speed=item.type==='shortbow'?8+16*power:4+11*power;
 const id=session.aimShot({uid:selected,position:arr(p),velocity:arr(d.scale(speed))});
 if(!id){tell('Cannot release: check equipment or ammunition.');refresh();return}
 const temp=item.type==='shortbow'?arrowTemplate:rockTemplate;const visual=cloneVisual(temp,id);visual.position.copyFrom(p);
 if(item.type==='shortbow')visual.rotationQuaternion=fromAxis(temp.axis,d);
 shots.set(id,{visual,item:item.uid,kind:item.type,axis:temp.axis});state.shots++;refresh();
}
function recover(){const near=[...recoveries].filter(([,p])=>Vector3.Distance(p.visual.position,actor.position)<2.4).sort((a,b)=>Vector3.Distance(a[1].visual.position,actor.position)-Vector3.Distance(b[1].visual.position,actor.position))[0];
 if(!near){tell('Move closer to a recoverable thrown stone.');return}
 if(session.recoverGear(near[1].item)){near[1].visual.dispose();recoveries.delete(near[0]);tell('Stone recovered');refresh()}
}
function switchCamera(){first=!first;state.camera=first?'first':'third';$('perspective').textContent=first?'Third person':'First person'}
function update(dt){
 if(!started)return;
 const speed=3.4,forward=new Vector3(Math.sin(yaw),0,Math.cos(yaw)),right=new Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 let move=forward.scale((keys.has('w')?1:0)-(keys.has('s')?1:0)).add(right.scale((keys.has('d')?1:0)-(keys.has('a')?1:0)));
 const pad=navigator.getGamepads?.()[0];if(pad){move.addInPlace(right.scale(Math.abs(pad.axes[0])>.18?pad.axes[0]:0));move.addInPlace(forward.scale(Math.abs(pad.axes[1])>.18?-pad.axes[1]:0));yaw+=(Math.abs(pad.axes[2])>.18?pad.axes[2]:0)*dt*1.9;pitch=limit(pitch-(Math.abs(pad.axes[3])>.18?pad.axes[3]:0)*dt*1.5,-1.3,1.3);const trigger=(pad.buttons[7]?.value||0)>.25;if(trigger&&!state.trigger)startCharge();if(!trigger&&state.trigger)release();state.trigger=trigger;}
 if(move.lengthSquared()>1)move.normalize();
 actor.moveWithCollisions(move.scale(speed*dt));actor.position.y=.86;actor.position.x=limit(actor.position.x,-8.5,8.5);actor.position.z=limit(actor.position.z,-4.5,17.5);
 body.pivot.position.copyFrom(actor.position.subtract(new Vector3(0,.86,0)));body.pivot.rotation.y=yaw;body.pivot.setEnabled(!first);
 const eye=actor.position.add(new Vector3(0,.68,0)),d=direction();
 const desired=first?eye:eye.subtract(d.scale(3.4)).add(new Vector3(0,.5,0));cam.position.copyFrom(desired);cam.setTarget(eye.add(d.scale(18)));
 const side=new Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 bow.pivot.position.copyFrom(eye.add(d.scale(.65)).add(side.scale(.28)).add(new Vector3(0,-.31,0)));bow.pivot.rotation.set(-pitch,yaw+Math.PI/2,0);
 heldStone.position.copyFrom(eye.add(d.scale(.55)).add(side.scale(.28)).add(new Vector3(0,-.3,0)));
 if(charging){charge=limit(charge+dt/1.0,0,1);$('draw').value=charge}
 const completed=session.update(dt,{ground:0,targets:[...targets,...obstacles]});
 for(const p of session.liveShots()){const a=shots.get(p.id);if(a){a.visual.position.copyFrom(vec(p.position));if(a.kind==='shortbow')a.visual.rotationQuaternion=fromAxis(a.axis,vec(p.velocity).normalize())}}
 for(const r of completed){const a=shots.get(r.id),sample=r.samples.at(-1);if(a&&sample){a.visual.position.copyFrom(vec(sample.p));if(a.kind==='stone')recoveries.set(r.id,a);else{a.visual.dispose()}}shots.delete(r.id);const hit=r.events.find(e=>e.kind==='target');if(hit){state.hit++;tell('Target struck · +'+(r.xp?.specialization||0)+' XP')}else tell('Miss · adjust aim and timing');state.lastImpact=hit?.target||'miss';refresh()}
 if(performance.now()>noticeUntil&&notice){notice='';$('notice').textContent='Aim freely. No automatic hit correction.'}
 state.position=arr(actor.position);
}
async function init(){
 engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true});scene=new Scene(engine);scene.clearColor=new Color4(.64,.72,.76,1);scene.ambientColor=new Color3(.24,.22,.18);scene.collisionsEnabled=true;
 cam=new UniversalCamera('player-camera',new Vector3(0,1.54,0),scene);cam.minZ=.05;cam.maxZ=120;cam.fov=1.05;scene.activeCamera=cam;
 new HemisphericLight('sky',new Vector3(0,1,0),scene).intensity=.8;const sun=new DirectionalLight('sun',new Vector3(-.4,-1,.5),scene);sun.position.set(8,15,-8);sun.intensity=1.8;
 shadow=new ShadowGenerator(1024,sun);shadow.useBlurExponentialShadowMap=true;shadow.blurKernel=16;
 const hk=await HavokPhysics({locateFile:()=>new URL('./generated/HavokPhysics.wasm',import.meta.url).href});scene.enablePhysics(new Vector3(0,-9.81,0),new HavokPlugin(true,hk));
 const ground=MeshBuilder.CreateGround('courtyard surface',{width:22,height:26},scene);ground.position.z=6;ground.material=material('packed earth','#82755d');ground.receiveShadows=true;ground.checkCollisions=true;new PhysicsAggregate(ground,PhysicsShapeType.BOX,{mass:0},scene);
 actor=MeshBuilder.CreateBox('hidden collision hull',{width:.65,height:1.72,depth:.65},scene);actor.isVisible=false;actor.position.set(0,.86,0);actor.ellipsoid=new Vector3(.325,.86,.325);actor.ellipsoidOffset=Vector3.Zero();
 body=await model('ranger',lib+'fps-and-archery/kaykit/Characters/gltf/Ranger.glb',1.72);
 bow=await model('bow',lib+'fps-and-archery/kaykit/Assets/gltf/bow_withString.gltf',1.05,{centered:true});
 arrowTemplate=await model('arrow-template',lib+'fps-and-archery/kaykit/Assets/gltf/arrow_bow.gltf',.65,{centered:true,axisFit:true});arrowTemplate.pivot.setEnabled(false);
 rockTemplate=await model('stone-template',models+'nature-kit/rock-smalla.glb',.18,{centered:true,axisFit:true});rockTemplate.pivot.setEnabled(false);heldStone=cloneVisual(rockTemplate,'held-stone');heldStone.setEnabled(false);
 // Checked-in model assets, not generated substitutes. The courtyard is an integration environment, not the final town.
 const barrel=await model('practice-barrel',models+'food-kit/barrel.glb',1.7);place(barrel,0,6);physicalObstacle(barrel,{score:true,bounce:0,id:'practice-barrel'});
 for(const [x,z,h] of [[-4,10,1.4],[4,12,1.4]]){const m=await model('barrel-'+x,models+'food-kit/barrel.glb',h);place(m,x,z);physicalObstacle(m,{score:true,bounce:0,id:'barrel-'+x})}
 for(const [x,z,rot] of [[-7,10,Math.PI/2],[7,10,Math.PI/2],[-3.2,15,0],[3.2,15,0]]){const m=await model('castle-wall-'+x+'-'+z,models+'castle-kit/wall.glb',3.7);place(m,x,z,0,rot);for(const mesh of m.mesh)mesh.checkCollisions=true;}
 for(const [x,z] of [[-7,-2],[7,-2],[-7,15],[7,16]]){const m=await model('tree-'+x+'-'+z,models+'nature-kit/tree-default.glb',4.2);place(m,x,z)}
 for(const [x,z] of [[-6,16],[6,16]]){const m=await model('tower-'+x,models+'castle-kit/tower-square.glb',5);place(m,x,z)}
 state.phase='ready';$('start').showModal();engine.runRenderLoop(()=>{const dt=Math.min(.05,engine.getDeltaTime()/1000);update(dt);scene.render()});addEventListener('resize',()=>engine.resize());
}
$('begin').onclick=()=>{origin=$('origin').value;session.begin(origin);started=true;selected=null;const firstGear=session.view().character.inventory[0];if(firstGear)choose(firstGear.type);else refresh();$('start').close();state.phase='playing';tell('Training courtyard — internal build');canvas.focus()};
$('bow').onclick=()=>choose('shortbow');$('stone').onclick=()=>choose('stone');$('perspective').onclick=switchCamera;$('recover').onclick=recover;
$('save').onclick=async()=>{try{await saveSession('courtyard',session);tell('Character saved')}catch(e){tell(e.message)}};
$('load').onclick=async()=>{try{if(shots.size){tell('Finish the current shot first');return}const v=await loadSession('courtyard',session);if(!v){tell('No save');return}for(const r of recoveries.values())r.visual.dispose();recoveries.clear();selected=v.character.inventory.find(x=>x.available!==false)?.uid||null;refresh();tell('Character loaded')}catch(e){tell(e.message)}};
addEventListener('keydown',e=>{if(!started||e.target?.tagName==='SELECT')return;const k=e.key.toLowerCase();if(['w','a','s','d',' ','v','e'].includes(k))e.preventDefault();keys.add(k);if(k===' '&&!e.repeat)startCharge();if(k==='v'&&!e.repeat)switchCamera();if(k==='e'&&!e.repeat)recover()});
addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());if(e.key===' ')release()});addEventListener('blur',()=>{keys.clear();charging=false;charge=0});
canvas.addEventListener('pointerdown',e=>{look={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!look||look.id!==e.pointerId)return;yaw+=(e.clientX-look.x)*.004;pitch=limit(pitch-(e.clientY-look.y)*.004,-1.3,1.3);look.x=e.clientX;look.y=e.clientY});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>look=null);
for(const b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key)});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.key))}
$('fire').addEventListener('pointerdown',e=>{e.preventDefault();$('fire').setPointerCapture(e.pointerId);startCharge()});$('fire').addEventListener('pointerup',release);$('fire').addEventListener('pointercancel',()=>{charging=false;charge=0});
init().catch(e=>{state.phase='failed';state.errors.push(String(e.stack||e));tell(String(e));console.error(e)});
