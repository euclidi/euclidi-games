
import * as T from './three/three.module.min.js';
import {GLTFLoader} from './three/loaders/GLTFLoader.js';
import cans from './can-models.js';
import melon from './live-models/melon.js';
import toaster from './live-models/toaster.js';
import tv from './live-models/tv.js';
import r0 from './live-models/robot-0.js';import r1 from './live-models/robot-1.js';import r2 from './live-models/robot-2.js';import r3 from './live-models/robot-3.js';import r4 from './live-models/robot-4.js';
import d0 from './live-models/duck-0.js';import d1 from './live-models/duck-1.js';
const data=[cans['soda-can'],null,melon,toaster,r0+r1+r2+r3+r4,tv,d0+d1,cans['soda-can-crushed']];
const mats={};const vec=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
function standard(color,roughness=.52,metalness=.15){return new T.MeshStandardMaterial({color,roughness,metalness});}
function mesh(g,m,parent,x=0,y=0,z=0){let o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function lathe(profile,m,parent,x=0,y=0,z=0){return mesh(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),48),m,parent,x,y,z);}
function tube(points,r,m,parent,segments=40){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,r,8,false),m,parent);}
function helix(radius,y0,height,turns){let a=[];for(let i=0;i<=turns*30;i++){let f=i/(turns*30),angle=f*turns*Math.PI*2;a.push(vec(Math.cos(angle)*radius,y0+f*height,Math.sin(angle)*radius));}return a;}
function bulb(){
  const g=new T.Group(),metal=standard(0xa4a5a2,.27,.82),brass=standard(0xb59a65,.32,.78),ins=standard(0x21282b,.45,0);
  lathe([[0,0],[12,0],[15,3],[15,8],[10,12],[0,12]],brass,g);
  lathe([[0,8],[17,8],[24,14],[25,22],[22,24],[0,24]],ins,g);
  lathe([[0,20],[26,20],[28,25],[28,60],[24,64],[0,64]],metal,g);
  tube(helix(28.2,25,32,5.5),2.1,brass,g,170);
  lathe([[0,60],[25,60],[26,65],[22,72],[17,83],[0,86]],standard(0x8b9697,.35,.4),g);
  const glass=new T.MeshPhysicalMaterial({color:0xd5e6eb,metalness:0,roughness:.14,transparent:true,opacity:.27,clearcoat:1,clearcoatRoughness:.12,side:T.DoubleSide,depthWrite:false});
  const profile=[[0,68],[21,68],[25,73],[27,83],[34,95],[45,107],[58,124],[66,143],[69,159],[66,178],[57,194],[43,207],[25,216],[10,219],[0,220]];
  const shell=lathe(profile,glass,g);shell.castShadow=false;shell.renderOrder=4;
  const support=standard(0x8a9a9c,.45,.5);
  for(const s of [-1,1])tube([vec(s*9,68,0),vec(s*10,98,0),vec(s*24,135,0),vec(s*21,153,0)],1.2,support,g,36);
  let coil=[];for(let i=0;i<=180;i++){let u=i/180,a=u*Math.PI*24;coil.push(vec(-21+42*u,153+3*Math.cos(a),3*Math.sin(a)));}
  const fm=new T.MeshStandardMaterial({color:0x746451,metalness:.7,roughness:.45,emissive:0xff8a31,emissiveIntensity:0});
  const filament=tube(coil,1.25,fm,g,180);g.userData.filament=filament;
  return g;
}
function chamfered(w,h,d,r,mat,parent){
  let shape=new T.Shape();let x=-w/2,y=-h/2;
  shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
  let g=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelThickness:Math.min(r*.3,3),bevelSize:Math.min(r*.3,3),bevelSegments:2,steps:1,curveSegments:6});g.translate(0,0,-d/2);return mesh(g,mat,parent);
}
function makeProbe(color){
  const g=new T.Group(),steel=standard(0xb9c5c7,.2,.85),grip=standard(color,.48,.04),dark=standard(0x1c2225,.56,.1);
  lathe([[0,0],[1.1,0],[2.2,7],[3.4,15],[3.5,22],[0,22]],steel,g);
  lathe([[0,18],[5.5,18],[7.7,20],[7.7,24],[6.1,27],[6.2,51],[5.4,55],[0,55]],grip,g);
  for(let y=29;y<48;y+=3.5)lathe([[5.7,y],[6.6,y],[6.6,y+1.4],[5.7,y+1.4]],dark,g);
  lathe([[0,53],[4.6,53],[4.6,58],[3.5,61],[0,61]],dark,g);
  return g;
}
async function modelFrom(b64){let bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));return (await new GLTFLoader().parseAsync(bytes.buffer,'')).scene;}
const fit=[[132,179],[138,220],[196,180],[182,164],[178,220],[222,176],[206,168],[158,100]];
const yaw=[.16,0,.32,.24,.10,.22,-Math.PI/2,.16];
const smoothColor=new T.Color();
export async function createLiveLab(stage,overlay,onStatus){
  const renderer=new T.WebGLRenderer({alpha:false,antialias:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block';
  const scene=new T.Scene();scene.background=new T.Color(0x111a20);
  const camera=new T.OrthographicCamera(-400,400,220,-220,1,2400);camera.position.set(0,0,1000);camera.lookAt(0,0,0);
  const hemi=new T.HemisphereLight(0xdcebf4,0x64635a,1.6);scene.add(hemi);
  const key=new T.DirectionalLight(0xffe7cf,3.1);key.position.set(-230,370,420);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-330;key.shadow.camera.right=330;key.shadow.camera.top=330;key.shadow.camera.bottom=-330;key.shadow.camera.near=5;key.shadow.camera.far=1200;key.shadow.bias=-.0005;scene.add(key);
  const rim=new T.DirectionalLight(0x9dc8e5,1.7);rim.position.set(260,150,-110);scene.add(rim);
  const sparksLight=new T.PointLight(0x71d9ff,0,230,1.7);scene.add(sparksLight);
  const lamp=new T.PointLight(0xffa447,0,230,1.5);scene.add(lamp);
  const models=[];const chamber=new T.Group();scene.add(chamber);
  const modelGroup=new T.Group();scene.add(modelGroup);
  const probeGroup=new T.Group();scene.add(probeGroup);
  const debrisGroup=new T.Group();scene.add(debrisGroup);
  const effectsGroup=new T.Group();scene.add(effectsGroup);
  const cables=[null,null],probeMeshes=[makeProbe(0xa43c35),makeProbe(0x356b9b)];probeMeshes.forEach(p=>probeGroup.add(p));
  const cableMats=[standard(0x81332d,.62,.05),standard(0x275376,.62,.05)];
  const grey=standard(0x465155,.59,.45),wall=standard(0x263238,.74,.18),dark=standard(0x131d24,.63,.25),edge=standard(0x68767b,.34,.6),hazard=standard(0xd4a842,.58,.12);
  const debrisMap=new Map(),ray=new T.Raycaster(),contactCache=new Map();let W=800,H=440,S=1,active=-1,activeObj=null,dead=false,closed=false,layoutKey='',cableKeys=['',''],anchor={x:400,y:250},lastState=null;
  const pos=(x,y,z=0)=>vec(x-W/2,H/2-y,z);
  function removeChildren(g){for(const o of [...g.children]){g.remove(o);o.traverse(n=>{if(n.isMesh&&n.geometry)n.geometry.dispose();});}}
  function setupChamber(){
    removeChildren(chamber);
    const floor=H*.78;
    const back=chamfered(W+60,H+60,18,6,wall,chamber);back.position.set(0,0,-180);
    for(let i=0;i<5;i++){
      let panel=chamfered(W/5-7,H*.72,8,4,i%2===0?wall:grey,chamber);panel.position.copy(pos((i+.5)*W/5,H*.39,-166));
      for(let x of [-1,1])for(let y of [-1,1])mesh(new T.CylinderGeometry(2.5*S,2.5*S,3*S,12),edge,panel,x*(W/10-13),y*(H*.36-11),5).rotation.x=Math.PI/2;
    }
    const rail=chamfered(W+40,12*S,10*S,2,edge,chamber);rail.position.copy(pos(W/2,H*.26,-145));
    const bottom=chamfered(W+20,H*.25,100*S,6,grey,chamber);bottom.position.copy(pos(W/2,floor+H*.125,-26*S));
    const surface=chamfered(W+20,14*S,150*S,4,edge,chamber);surface.position.copy(pos(W/2,floor+2*S,-12*S));surface.rotation.x=-.08;
    const tray=chamfered(290*S,14*S,130*S,4,dark,chamber);tray.position.copy(pos(W/2,floor-8*S,4*S));tray.rotation.x=-.1;
    for(let i=0;i<15;i++){let strip=mesh(new T.BoxGeometry(9*S,4*S,1.5*S),i%2?dark:hazard,chamber);strip.position.copy(pos(W/2-72*S+i*10*S,floor+8*S,69*S));strip.rotation.z=.16;}
    for(let side of [-1,1]){
      const plate=chamfered(39*S,45*S,12*S,4,dark,chamber);plate.position.copy(pos(side<0?W*.06:W*.94,floor+20*S,62*S));
      const port=lathe([[0,0],[6,0],[8,2],[8,5],[4,7],[0,7]],edge,plate);port.rotation.x=Math.PI/2;port.position.z=10*S;port.scale.setScalar(S);
    }
    const topLight=chamfered(160*S,9*S,12*S,3,standard(0xe5e4d7,.3,.08),chamber);topLight.material.emissive.setHex(0xc8edff);topLight.material.emissiveIntensity=.9;topLight.position.copy(pos(W*.5,20*S,-96*S));
  }
  function resize(w,h,s){
    const k=[w,h,s].join('|');if(k===layoutKey)return;
    layoutKey=k;W=w;H=h;S=s;renderer.setSize(w,h,false);camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();setupChamber();active=-1;contactCache.clear();cableKeys=['',''];
  }
  function normalize(obj,i){
    // Preserve authored proportions; align projected silhouette to the existing bench coordinate system.
    const g=new T.Group();g.add(obj);obj.rotation.y+=yaw[i];
    obj.updateMatrixWorld(true);let box=new T.Box3().setFromObject(obj),size=box.getSize(vec()),ctr=box.getCenter(vec());if(!size.x||!size.y)throw Error('Invalid specimen bounds '+i);
    obj.position.sub(vec(ctr.x,box.min.y,ctr.z));
    const factor=Math.min(fit[i][0]/size.x,fit[i][1]/size.y);
    const holder=new T.Group();holder.add(g);g.scale.setScalar(factor);
    obj.traverse(o=>{if(!o.isMesh)return;o.castShadow=!o.material?.transparent;o.receiveShadow=true;
      for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m||!m.isMeshStandardMaterial)continue;
        if(i!==1){m.roughness=T.MathUtils.clamp(m.roughness??.5,.36,.78);m.metalness=T.MathUtils.clamp(m.metalness??0,0,.55);}m.needsUpdate=true;}
    });
    holder.userData.height=size.y*factor;holder.userData.width=size.x*factor;
    holder.userData.bulb=obj.userData.filament;
    return holder;
  }
  try{
    for(let i=0;i<data.length;i++){onStatus?.('LOADING SPECIMENS '+(i+1)+' / '+data.length);let raw=i===1?bulb():await modelFrom(data[i]);let g=normalize(raw,i);models.push(g);g.visible=false;modelGroup.add(g);}
  }catch(e){renderer.dispose();throw e;}
  stage.insertBefore(renderer.domElement,overlay);
  overlay.style.position='relative';overlay.style.zIndex='1';
  function prepare(state){
    resize(state.W,state.H,state.S);anchor=state.center;lastState=state;const k=state.idx===0&&state.buckled?7:state.idx;
    if(active!==k){if(activeObj)activeObj.visible=false;active=k;activeObj=models[k];contactCache.clear();}
    dead=state.dead;activeObj.visible=!dead;
    const p=pos(anchor.x,anchor.y+88*S,0);activeObj.position.copy(p);activeObj.scale.setScalar(S);activeObj.updateMatrixWorld(true);
    if(activeObj.userData.bulb){const f=activeObj.userData.bulb;f.material.emissiveIntensity=state.filamentFailed?0:Math.max(0,(state.temp-30)/70);f.visible=!state.filamentFailed;}
  }
  function rayHit(x,y){
    if(!activeObj||dead)return null;
    ray.set(pos(x,y,900),vec(0,0,-1));const hits=ray.intersectObject(activeObj,true).filter(h=>h.object.visible&&h.object.isMesh);
    return hits.length?hits[0].point:null;
  }
  function contact(x,y,maxGap=18){
    if(dead||!activeObj)return null;
    const key=[active,Math.round(x*4),Math.round(y*4),Math.round(maxGap*4)].join(':');
    if(contactCache.has(key))return contactCache.get(key);
    let hit=rayHit(x,y),gap=0,sx=x,sy=y;
    if(!hit){for(let r of [2,5,9,13,maxGap].filter(r=>r<=maxGap+.01)){for(let i=0;i<8;i++){let a=i*Math.PI/4;let xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r;hit=rayHit(xx,yy);if(hit){gap=r/S;sx=xx;sy=yy;break;}}if(hit)break;}}
    const v=hit?{gap,z:hit.z,x:sx,y:sy}:null;if(contactCache.size>500)contactCache.clear();contactCache.set(key,v);return v;
  }
  function autoProbes(){
    if(!activeObj)return null;
    if(lastState.idx===1)return [{x:anchor.x-21*S,y:anchor.y+55*S},{x:anchor.x,y:anchor.y+82*S}];
    const b=activeObj.userData,cy=anchor.y+88*S-b.height*S*.49,hw=b.width*S*.5;
    const out=[];for(let sign of [-1,1]){
      let found=null;for(let yoff of [0,.16,-.16,.3,-.3]){for(let f of [.83,.67,.48,.3,.12]){const x=anchor.x+sign*hw*f,y=cy+b.height*S*yoff;if(rayHit(x,y)){found={x,y};break}}if(found)break;}
      out.push(found||{x:anchor.x+sign*hw*.45,y:cy});
    }return out;
  }
  function updateProbe(i,p,c){
    const g=probeMeshes[i];const z=c?.z??(activeObj?.userData.width||100)*S*.4+15*S;
    const tip=pos(p.x,p.y,z+1.3*S);g.position.copy(tip);g.scale.setScalar(S);g.rotation.z=i===0?Math.PI/2+.15:-Math.PI/2-.15;g.updateMatrixWorld(true);
    const end=g.localToWorld(vec(0,61,0));const start=pos(i===0?W*.06:W*.94,H*.78+20*S,75*S);
    const k=[W,H,S,Math.round(end.x*2),Math.round(end.y*2),Math.round(end.z*2)].join('|');if(k===cableKeys[i])return;cableKeys[i]=k;
    if(cables[i]){probeGroup.remove(cables[i]);cables[i].geometry.dispose();}
    const bend=i===0?-1:1;
    const curve=new T.CubicBezierCurve3(start,start.clone().add(vec(bend*8*S,-70*S,55*S)),end.clone().add(vec(bend*70*S,-25*S,30*S)),end);
    cables[i]=mesh(new T.TubeGeometry(curve,32,3.2*S,10,false),cableMats[i],probeGroup);
  }
  function updateDebris(fragments){
    const live=new Set(fragments);for(const [f,o] of debrisMap)if(!live.has(f)){debrisGroup.remove(o);o.geometry.dispose();o.material.dispose();debrisMap.delete(f);}
    for(const f of fragments){let o=debrisMap.get(f);
      if(!o){const a=new T.Shape();a.moveTo(-f.w*.65,f.size*.5);a.lineTo(f.w*.7,f.size*.4);a.lineTo(f.w*.15,-f.size*.7);a.lineTo(-f.w*.4,-f.size*.2);a.closePath();let geom=new T.ExtrudeGeometry(a,{depth:Math.max(1,f.size*.22),bevelEnabled:false});o=mesh(geom,standard(f.color,.58,.26),debrisGroup);debrisMap.set(f,o);}
      o.position.copy(pos(f.x,f.y,8*S));o.rotation.z=-f.rot;o.rotation.x=.15*Math.sin(f.rot);
    }
  }
  const maxParticles=350,pointsGeom=new T.BufferGeometry(),particlePositions=new Float32Array(maxParticles*3),particleColors=new Float32Array(maxParticles*3);
  pointsGeom.setAttribute('position',new T.BufferAttribute(particlePositions,3).setUsage(T.DynamicDrawUsage));pointsGeom.setAttribute('color',new T.BufferAttribute(particleColors,3).setUsage(T.DynamicDrawUsage));
  const points=new T.Points(pointsGeom,new T.PointsMaterial({size:2.6,vertexColors:true,transparent:true,opacity:.94,depthWrite:false}));points.frustumCulled=false;effectsGroup.add(points);
  let smokeMap=null;try{const url=window.VoltageLabVFX?.smoke_01;if(url)smokeMap=new T.TextureLoader().load(url);}catch(e){}
  const smokePool=[];for(let i=0;i<36;i++){let o=new T.Sprite(new T.SpriteMaterial({map:smokeMap,color:0x91999c,transparent:true,opacity:0,depthWrite:false}));o.visible=false;effectsGroup.add(o);smokePool.push(o);}
  const arcGeo=new T.BufferGeometry(),arcPositions=new Float32Array(2*16*6);arcGeo.setAttribute('position',new T.BufferAttribute(arcPositions,3).setUsage(T.DynamicDrawUsage));
  const arcLine=new T.LineSegments(arcGeo,new T.LineBasicMaterial({color:0xc7f4ff,transparent:true,opacity:.95,blending:T.AdditiveBlending,depthWrite:false}));arcLine.frustumCulled=false;effectsGroup.add(arcLine);
  function updateEffects(st,hits){
    let n=0,sm=0;
    for(const p of st.parts){let fade=Math.max(0,p.life/p.max);
      if(p.type==='smoke'){if(sm>=smokePool.length||!smokeMap)continue;const o=smokePool[sm++];o.visible=true;o.position.copy(pos(p.x,p.y,45*S));o.scale.setScalar(p.r*7);o.material.opacity=fade*.24;o.material.rotation=p.rotation*.18;continue;}
      if(n>=maxParticles)continue;let v=pos(p.x,p.y,45*S);particlePositions.set([v.x,v.y,v.z],n*3);smoothColor.set(p.type==='water'?0x64c4dd:p.color||0xffe1a2);smoothColor.multiplyScalar(fade);particleColors.set([smoothColor.r,smoothColor.g,smoothColor.b],n*3);n++;
    }
    for(let j=sm;j<smokePool.length;j++)smokePool[j].visible=false;
    points.material.size=2.6*S;pointsGeom.setDrawRange(0,n);pointsGeom.attributes.position.needsUpdate=true;pointsGeom.attributes.color.needsUpdate=true;
    let j=0;function segment(a,b){if(j+6>arcPositions.length)return;arcPositions.set([a.x,a.y,a.z,b.x,b.y,b.z],j);j+=6;}
    if(st.activePulse>0){for(let i=0;i<2;i++){const c=hits[i];if(!c||!st.contacts[i]?.conducting)continue;
      const p=st.probes[i],a=pos(p.x,p.y,c.z+4*S),b=pos(c.x,c.y,c.z+2*S);if(a.distanceTo(b)<2*S)b.x+=2*S;
      let old=a;for(let k=1;k<=5;k++){let v=a.clone().lerp(b,k/5);if(k<5)v.add(vec((Math.random()-.5)*3*S,(Math.random()-.5)*4*S,Math.random()*2*S));segment(old,v);old=v;}
      if(Math.random()>.55){const q=b.clone().add(vec((Math.random()-.5)*18*S,(Math.random()-.5)*15*S,7*S));segment(b,q);}
    }}
    arcGeo.setDrawRange(0,j/3);arcGeo.attributes.position.needsUpdate=true;
    const first=hits.find(Boolean);sparksLight.position.copy(first?pos(first.x,first.y,first.z+20*S):pos(anchor.x,anchor.y,80*S));sparksLight.intensity=st.activePulse*800*S*S;
    lamp.position.copy(pos(anchor.x,anchor.y-60*S,45*S));lamp.intensity=st.idx===1&&!st.filamentFailed?Math.max(0,st.temp-65)*8*S*S:0;
  }
  function render(state){
    prepare(state);
    const hits=state.probes.map(p=>contact(p.x,p.y,Math.max(2,state.maxArc*S)));
    state.probes.forEach((p,i)=>updateProbe(i,p,hits[i]));
    updateDebris(state.fragments);updateEffects(state,hits);
    renderer.render(scene,camera);
  }
  function dispose(){renderer.domElement.remove();renderer.dispose();}
  return {prepare,contact,autoProbes,render,dispose};
}
