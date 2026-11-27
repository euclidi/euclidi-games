import * as T from 'three';import {V,Q,UP,DOWN,mesh,box,ball,loft,group,material,label} from './geometry.js';import {triangle,clamp,UPPER,LOWER,THIGH,SHIN,WRIST} from './math.js';
export function makeRig(scene,human=false){
const shell=material(human?[192,146,119]:[184,150,77],.65,0,16),joint=material([36,39,35],.8),coat=human?material([217,218,207],.88):shell,pants=human?material([69,76,80]):shell,shoes=human?material([38,43,43]):joint;
const root=group(scene),body=group(root);const spine=group(body,0,.17);loft(root,coat,[[.15,.17,.11],[.20,.183,.116],[.255,.205,.125],[.30,.22,.13]],0,0);loft(spine,coat,[[.10,.211,.126],[.13,.22,.13],[.3,.245,.14],[.42,.28,.145],[.49,.23,.13],[.53,.12,.08],[.55,0,0]]);loft(root,pants,[[0,0,0],[.03,.15,.12],[.12,.235,.135],[.22,.22,.13],[.25,.12,.1],[.26,0,0]],0,-.06);ball(body,joint,.075,0,.70);const neck=group(body,0,.66),head=group(neck,0,.05);loft(head,shell,[[0,0,0],[.025,.09,.08,.015],[.075,.128,.111,.015],[.17,.145,.124],[.25,.127,.115,-.005],[.30,.075,.07,-.009],[.31,0,0]]);loft(head,shell,[[0,0,0],[.02,.054,.024],[.052,.04,.052],[.09,.021,.018],[.105,0,0]],0,.084,.111);
for(let s of [-1,1])ball(head,shell,.039,s*.139,.155,-.01).scale.set(.5,1,1);
if(human){loft(body,coat,[[-.31,.25,.145],[-.24,.26,.15],[.03,.245,.15],[.23,.235,.15],[.43,.27,.16],[.59,.29,.16],[.67,.13,.095]],0,0);const dark=material([38,43,44]),shirt=material([83,111,115]);box(body,shirt,.16,.31,.009,0,.42,.165);box(body,dark,.042,.25,.01,0,.45,.175);for(let s of [-1,1]){const rim=mesh(head,new T.TorusGeometry(.043,.005,6,20),dark,s*.055,.164,.126);rim.scale.y=.8;box(head,dark,.007,.007,.095,s*.107,.165,.077);box(body,coat,.10,.34,.013,s*.075,.47,.17).rotation.z=s*.23;}box(head,dark,.028,.006,.008,0,.17,.128);}else{label(body,'001',.15,.055,0,.32,.147,'#c7a959','#272822');const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');for(let i=0;i<4;i++){x.fillStyle=i%2?'#d5b961':'#29291f';x.beginPath();x.moveTo(64,64);x.arc(64,64,61,i*Math.PI/2,(i+1)*Math.PI/2);x.fill();}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const m=new T.MeshStandardMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});mesh(head,new T.PlaneGeometry(.115,.115),m,0,.21,.126);mesh(body,new T.PlaneGeometry(.13,.13),m,0,.51,.149);}
const arms=[],legs=[];
for(let s of [-1,1]){ball(body,joint,.08,s*.29,.60);const a=group(body,s*.29,.58);loft(a,coat,[[-.29,0,0],[-.27,.055,.055],[-.18,.081,.074],[-.06,.094,.08],[.025,.065,.058],[.045,0,0]]);ball(a,joint,.057,0,-.30);const b=group(a,0,-UPPER);loft(b,coat,[[-.255,0,0],[-.24,.046,.046],[-.17,.058,.062],[-.04,.069,.068],[.018,.05,.052],[.03,0,0]]);ball(b,joint,.043,0,-WRIST);const h=group(b,0,-WRIST);loft(h,shell,[[-.092,.054,.030,.006],[-.084,.064,.035,.003],[-.061,.071,.038,0],[-.033,.060,.039,-.002],[-.008,.043,.039,0],[.018,.038,.035],[.026,0,0]]);
const digits=[];function digit(x,y,z,lengths,r,thumb=false){const base=group(h,x,y,z);if(thumb){base.rotation.z=s*.72;base.rotation.x=-.18;}let parent=base,bones=[];for(let j=0;j<lengths.length;j++){const len=lengths[j],rr=r-j*.00165,k=group(parent);ball(k,shell,rr*.92);loft(k,shell,[[-len-.003,0,0],[-len*.98,rr*.81,rr*.83],[-len*.62,rr*.91,rr*.88],[-len*.25,rr,rr*.94],[.004,rr*.86,rr*.88],[.009,0,0]],0,0,0,12);bones.push(k);parent=group(k,0,-len);}digits.push({base,bones,thumb});}
const lengths=[[.043,.028,.023],[.051,.032,.024],[.048,.029,.022],[.038,.023,.019]],xs=[.046,.015,-.017,-.046];for(let i=0;i<4;i++)digit(s*xs[i],-.083+(i===3?.008:0),.006,lengths[i],i===3?.0128:.0155);digit(s*.052,-.030,.016,[.044,.032],.020,true);arms.push({a,b,h,digits,s});
const thigh=group(scene),shin=group(scene),foot=group(scene),toe=group(foot,0,-.042,.108);loft(thigh,pants,[[0,0,0],[.035,.085,.08],[.13,.105,.095],[.31,.09,.08],[.395,.072,.07],[.42,0,0]]);ball(thigh,joint,.075,0,.02);loft(shin,pants,[[0,0,0],[.025,.063,.06],[.16,.085,.08],[.33,.078,.072],[.405,.06,.06],[.42,0,0]]);ball(shin,joint,.07,0,.42);loft(foot,shoes,[[0,0,0],[.006,.079,.102,.006],[.048,.083,.102,.006],[.09,.063,.087,.008],[.12,.05,.06],[.125,0,0]],0,-.075);loft(toe,shoes,[[-.033,0,0],[-.027,.079,.071,.021],[.002,.081,.073,.022],[.025,.061,.057,.017],[.031,0,0]],0,0,0,16);legs.push({s,thigh,shin,foot,toe});}
return {root,body,spine,neck,head,arms,legs};}
// +Z is the palm's flexion direction, -Y is the long finger axis.
// Finger order is index -> little on BOTH hands. The thumb is on the
// radial (+side) edge; with palms inward this places thumbs forward.
export function curl(a,amount=.30,spread=.028){
 const flex=clamp(amount,0,1.2),open=1-clamp(flex/.95,0,1);
 a.digits.forEach((d,i)=>{
  if(d.thumb){
   d.base.rotation.set(-.14-.34*flex,0,a.s*(.66-.30*flex),'XYZ');
   d.bones.forEach((b,j)=>b.rotation.set(-flex*[.40,.72][j],0,0));
  }else{
   d.base.rotation.set(0,0,-a.s*(i-1.5)*spread*open);
   const bias=[.78,.94,1.10,1.23][i];
   d.bones.forEach((b,j)=>b.rotation.set(-flex*bias*[.85,1.14,.73][j],0,0));
  }
 });
}
// Relaxed elbows; forearm rotation carries pronation instead of an
// unnatural ninety-degree twist concentrated in the wrist.
export function neutralArm(a,clock=0,swing=0,activity=0){
 const s=a.s,k=clamp(activity,0,1),drift=Math.sin(clock*1.22+s*.8);
 a.a.rotation.set(-.055+swing+.012*drift,0,s*(.065+.025*k),'XYZ');
 a.b.rotation.set(-.21-.08*k-.025*drift,-s*(1.27-.12*k),0,'XYZ');
 a.h.rotation.set(.045+.022*drift,-s*.12,s*.028,'XYZ');
 curl(a,.31+.035*drift+.06*k,.032);
}
function forearmFrame(direction,palm){
 const y=direction.clone().normalize().negate(),z=palm.clone().addScaledVector(y,-palm.dot(y));
 if(z.lengthSq()<1e-7){z.copy(V(0,0,1)).addScaledVector(y,-y.z);if(z.lengthSq()<1e-7)z.copy(V(1,0,0)).addScaledVector(y,-y.x);}
 z.normalize();const x=y.clone().cross(z).normalize();
 return Q().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));
}
function bendAxis(axis,pole){let p=pole.clone().addScaledVector(axis,-pole.dot(axis));if(p.lengthSq()<1e-7)p=V(1,0,0).addScaledVector(axis,-axis.x);if(p.lengthSq()<1e-7)p=V(0,0,1).addScaledVector(axis,-axis.z);return p.normalize();}
export function armIK(r,i,target,pole=V(r.arms[i].s,0,-.6),handWorld=null){const a=r.arms[i],local=r.body.worldToLocal(target.clone()),s=a.a.position.clone(),d=local.clone().sub(s),len=d.length(),axis=d.normalize(),t=triangle(UPPER,LOWER,len),end=s.clone().addScaledVector(axis,t.distance),el=s.clone().addScaledVector(axis,t.along).addScaledVector(bendAxis(axis,pole),t.height);a.a.quaternion.setFromUnitVectors(DOWN,el.clone().sub(s).normalize());const bq=r.body.getWorldQuaternion(Q()),localHand=handWorld?bq.clone().invert().multiply(handWorld):null;
const palm=localHand?V(0,0,1).applyQuaternion(localHand):V(-a.s,0,.32);
const low=forearmFrame(end.clone().sub(el),palm);
a.b.quaternion.copy(a.a.quaternion.clone().invert().multiply(low));
if(localHand)a.h.quaternion.copy(low.clone().invert().multiply(localHand));else a.h.rotation.set(.035,0,a.s*.02);return Math.max(0,len-UPPER-LOWER);}
export function legIK(r,i,ank,heading,footQ=null){const l=r.legs[i],hip=r.root.localToWorld(V(l.s*.137,0,0)),d=hip.clone().sub(ank),len=d.length(),axis=d.normalize(),t=triangle(SHIN,THIGH,len),knee=ank.clone().addScaledVector(axis,t.along).addScaledVector(bendAxis(axis,V(0,0,1).applyQuaternion(r.root.quaternion)),t.height);l.thigh.position.copy(knee);l.thigh.quaternion.setFromUnitVectors(UP,hip.clone().sub(knee).normalize());l.shin.position.copy(ank);l.shin.quaternion.setFromUnitVectors(UP,knee.clone().sub(ank).normalize());l.foot.position.copy(ank);l.foot.quaternion.copy(footQ||Q().setFromAxisAngle(UP,heading));l.toe.rotation.x=0;return Math.max(0,len-THIGH-SHIN);}
export function handFrame(normal,finger){const y=finger.clone().normalize().negate(),z=normal.clone().negate().addScaledVector(y,normal.dot(y)).normalize(),x=y.clone().cross(z).normalize();return Q().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));}
export function contact(r,i,surface,normal,finger,pole){const a=r.arms[i],q=handFrame(normal,finger);r.root.updateMatrixWorld(true);const inv=a.h.matrixWorld.clone().invert();let support=Infinity;a.h.traverse(o=>{if(!o.isMesh)return;const attr=o.geometry.attributes.position;for(let j=0;j<attr.count;j++){const p=V().fromBufferAttribute(attr,j).applyMatrix4(o.matrixWorld).applyMatrix4(inv).applyQuaternion(q);support=Math.min(support,p.dot(normal));}});const wrist=surface.clone().addScaledVector(normal,-support+.002);return armIK(r,i,wrist,pole,q);}

// A sole contact pivot, not a rotation around the ankle in midair.
export function rolledLeg(r,i,plant,heading,roll,airborne=false){
 const base=Q().setFromAxisAngle(UP,heading),q=base.clone().multiply(Q().setFromAxisAngle(V(1,0,0),roll));
 const pivot=V(0,-.075,roll>=0?.108:-.087),ank=plant.clone();
 if(!airborne)ank.add(pivot.clone().applyQuaternion(base)).sub(pivot.clone().applyQuaternion(q));
 const error=legIK(r,i,ank,heading,q);r.legs[i].toe.rotation.x=roll>0&&!airborne?-roll:0;return error;
}
