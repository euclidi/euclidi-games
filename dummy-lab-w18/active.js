import * as T from 'three';
import {V,Q} from './geometry.js';
import {clamp} from './math.js';
// Physics-driven tracking: dynamic articulated bodies, local joint PD impulses,
// measured ground support, and bounded external balance assistance. No body
// teleportation, kinematic followers, or direct rotation assignments in drive().
const v=p=>V(p.x,p.y,p.z),q=p=>Q().set(p.x,p.y,p.z,p.w);
function rotvec(a,b){const d=a.clone().invert().multiply(b);if(d.w<0)d.set(-d.x,-d.y,-d.z,-d.w);const l=Math.hypot(d.x,d.y,d.z);return l<1e-8?V():V(d.x,d.y,d.z).multiplyScalar(2*Math.atan2(l,Math.max(0,d.w))/l)}
function bounded(x,max){if(x.length()>max)x.setLength(max);return x}
export function createActiveRig(R,world,r){
 let parts=[],links=[],feet=[],pelvis=null,torso=null,mode='off',fallAge=0,age=0,badTime=0,totalMass=0,contact=[0,0],com=V(),support=V(),supportCount=0,effort=0,assist=0,maxAnchorError=0,velocity=V();
 const nodes=[r.root,r.pelvis,r.spine,r.thorax,r.body,r.neck,r.atlas,r.head,...r.arms.flatMap(a=>[a.clavicle,a.scapula,a.a,a.b,a.twist,a.h]),...r.legs.flatMap(l=>[l.thigh,l.shin,l.foot,l.toe])];
 const write=(g,p,rot)=>{g.parent.updateWorldMatrix(true,false);g.position.copy(g.parent.worldToLocal(p.clone()));g.quaternion.copy(g.parent.getWorldQuaternion(Q()).invert().multiply(rot));g.updateMatrixWorld(true)};
 function start(initial=V()){
  if(parts.length)return;
  r.root.updateWorldMatrix(true,true);totalMass=0;contact=[0,0];age=badTime=fallAge=0;effort=assist=maxAnchorError=0;
  const box=(x,y,z)=>R.ColliderDesc.cuboid(x,y,z),cap=(h,r)=>R.ColliderDesc.capsule(h,r);
  function add(g,shape,offset,mass,parent=null,anchor=null,k=55,d=7,limit=.65,capTorque=70){
   const p=g.getWorldPosition(V()),rot=g.getWorldQuaternion(Q());
   const bd=R.RigidBodyDesc.dynamic().setTranslation(p.x,p.y,p.z).setRotation(rot).setLinearDamping(.10).setAngularDamping(.30).setCcdEnabled(true);
   if(bd.setAdditionalSolverIterations)bd.setAdditionalSolverIterations(6);
   const b=world.createRigidBody(bd),c=world.createCollider(shape.setTranslation(offset.x,offset.y,offset.z).setMass(mass).setFriction(.9).setRestitution(.02).setCollisionGroups(0x0002fffd),b);
   const part={g,b,c,mass,targetP:p.clone(),targetQ:rot.clone()};parts.push(part);totalMass+=mass;b.setLinvel(initial,true);
   if(parent){const at=anchor||p,pa=at.clone().sub(v(parent.b.translation())).applyQuaternion(q(parent.b.rotation()).invert()),pb=at.clone().sub(p).applyQuaternion(rot.clone().invert());
    const j=world.createImpulseJoint(R.JointData.spherical(pa,pb),parent.b,b,true);j.setContactsEnabled?.(false);
    links.push({parent,child:part,j,pa,pb,k,d,limit,capTorque});
   }return part;
  }
  pelvis=add(r.pelvis,box(.17,.105,.10),V(0,.075,0),10);
  const lumbar=add(r.spine,box(.155,.09,.10),V(0,.065,0),5,pelvis,r.spine.getWorldPosition(V()),120,12,.30,100);
  torso=add(r.body,box(.205,.18,.113),V(0,.49,0),17,lumbar,r.thorax.getWorldPosition(V()),155,15,.34,135);
  const neck=add(r.neck,cap(.018,.052),V(0,.025,0),1.1,torso,r.neck.getWorldPosition(V()),36,4,.45,25);
  add(r.head,R.ColliderDesc.ball(.123),V(0,.155,0),4.4,neck,r.head.getWorldPosition(V()),28,3,.52,21);
  for(const a of r.arms){
   const upper=add(a.a,cap(.08,.064),V(0,-.145,0),2.2,torso,a.a.getWorldPosition(V()),45,5,.83,48);
   const lower=add(a.b,cap(.065,.052),V(0,-.125,0),1.5,upper,a.b.getWorldPosition(V()),38,4,.42,38);
   add(a.h,box(.058,.075,.030),V(0,-.068,0),.48,lower,a.h.getWorldPosition(V()),14,1.8,.42,15);
  }
  for(const l of r.legs){
   const hip=r.pelvis.localToWorld(V(l.s*.137,0,0));
   const thigh=add(l.thigh,cap(.117,.078),V(0,.21,0),7,pelvis,hip,210,17,.55,190);
   const shin=add(l.shin,cap(.12,.064),V(0,.21,0),3.6,thigh,l.thigh.getWorldPosition(V()),170,13,.32,155);
   const foot=add(l.foot,box(.069,.038,.092),V(0,-.037,.002),.95,shin,l.foot.getWorldPosition(V()),100,8,.35,100);
   const toe=add(l.toe,box(.068,.022,.064),V(0,-.011,.023),.18,foot,l.toe.getWorldPosition(V()),20,2,.30,20);
   feet.push({foot,toe});
  }
  mode='active';
 }
 function measure(dt){
  com.set(0,0,0);velocity.set(0,0,0);support.set(0,0,0);supportCount=0;let sum=0;
  for(const p of parts){const c=p.b.worldCom?.()||p.b.translation();com.addScaledVector(v(c),p.mass);velocity.addScaledVector(v(p.b.linvel()),p.mass)}
  com.multiplyScalar(1/totalMass);velocity.multiplyScalar(1/totalMass);
  for(let i=0;i<2;i++){
   let impulse=0;const sample=V();
   for(const p of [feet[i].foot,feet[i].toe]){
    world.contactPairsWith(p.c,other=>{if(parts.some(x=>x.c.handle===other.handle))return;
     world.contactPair(p.c,other,m=>{const n=m.normal();if(Math.abs(n.y)<.55)return;for(let k=0;k<m.numContacts();k++){const j=Math.max(0,m.contactImpulse(k));if(j>0){impulse+=j;sample.addScaledVector(v(p.b.translation()),j)}}});
    });
   }
   contact[i]=impulse/Math.max(dt,.0001);if(impulse>.05){supportCount++;support.add(sample);sum+=impulse}
  }
  if(sum>0)support.multiplyScalar(1/sum);else support.copy(com);
  maxAnchorError=0;for(const l of links){const a=l.pa.clone().applyQuaternion(q(l.parent.b.rotation())).add(v(l.parent.b.translation())),b=l.pb.clone().applyQuaternion(q(l.child.b.rotation())).add(v(l.child.b.translation()));maxAnchorError=Math.max(maxAnchorError,a.distanceTo(b))}
 }
 function drive(dt,plannedVelocity=V()){
  if(mode!=='active')return;
  age+=dt;measure(dt);effort=assist=0;
  r.root.updateWorldMatrix(true,true);
  for(const p of parts){p.targetP.copy(p.g.getWorldPosition(V()));p.targetQ.copy(p.g.getWorldQuaternion(Q()))}
  for(const l of links){
   const parentQ=q(l.parent.b.rotation()),childQ=q(l.child.b.rotation()),actual=parentQ.clone().invert().multiply(childQ),target=l.parent.targetQ.clone().invert().multiply(l.child.targetQ);
   const err=rotvec(actual,target).applyQuaternion(childQ),rel=v(l.child.b.angvel()).sub(v(l.parent.b.angvel()));
   // Soft excursion stop around the requested anatomical joint frame.
   const excess=Math.max(0,err.length()-l.limit);
   const torque=err.clone().multiplyScalar(l.k).addScaledVector(rel,-l.d);
   if(excess>0)torque.addScaledVector(err.clone().normalize(),excess*l.k*1.8);
   bounded(torque,l.capTorque);effort+=torque.length();
   const impulse=torque.multiplyScalar(dt);l.child.b.applyTorqueImpulse(impulse,true);l.parent.b.applyTorqueImpulse(impulse.clone().negate(),true);
  }
  // Correct swing foot placement with internal equal/opposite linear impulses.
  // Stance feet receive no target-position pull; friction/normal contacts carry them.
  for(let i=0;i<2;i++){
   const p=feet[i].foot;if(contact[i]>35)continue;
   const desired=p.targetP.clone().sub(pelvis.targetP).add(v(pelvis.b.translation()));
   const relativeV=v(p.b.linvel()).sub(v(pelvis.b.linvel()));
   const force=desired.sub(v(p.b.translation())).multiplyScalar(220).addScaledVector(relativeV,-15);bounded(force,65);
   const j=force.multiplyScalar(dt);p.b.applyImpulse(j,true);pelvis.b.applyImpulse(j.clone().negate(),true);
  }
  // A bounded balance harness assists, not replaces, physical support.
  // Its magnitude is exposed so users can distinguish assisted vs passive motion.
  const pv=v(pelvis.b.linvel()),pp=v(pelvis.b.translation()),want=pelvis.targetP;
  const cp=com.clone().addScaledVector(velocity,Math.sqrt(Math.max(.40,com.y)/9.81));
  const correction=support.clone().sub(cp);correction.y=0;
  const gravity=totalMass*9.81;
  const h=V(want.x-pp.x,0,want.z-pp.z).multiplyScalar(115).addScaledVector(plannedVelocity.clone().sub(pv).setY(0),totalMass*3.5);
  if(supportCount)h.addScaledVector(bounded(correction,.30),totalMass*4.5);
  bounded(h,gravity*.17);
  h.y=clamp((want.y-pp.y)*1300-pv.y*150,-gravity*.05,gravity*.32);
  if(!supportCount){h.x*=.25;h.z*=.25;h.y=Math.min(0,h.y)}
  const up=rotvec(q(pelvis.b.rotation()),pelvis.targetQ).applyQuaternion(q(pelvis.b.rotation())).multiplyScalar(150).addScaledVector(v(pelvis.b.angvel()),-19);bounded(up,85);
  pelvis.b.applyImpulse(h.clone().multiplyScalar(dt),true);pelvis.b.applyTorqueImpulse(up.multiplyScalar(dt),true);assist=h.length();
  const upright=V(0,1,0).applyQuaternion(q(torso.b.rotation())).y;
  if(pp.y<.48||upright<.48||maxAnchorError>.22)badTime+=dt;else badTime=Math.max(0,badTime-dt*2);
  if(age>.35&&badTime>.18)release();
 }
 function sync(){for(const p of parts)write(p.g,v(p.b.translation()),q(p.b.rotation()))}
 function release(){if(mode==='active'){mode='falling';fallAge=0;effort=assist=0}}
 function tickFall(dt){fallAge+=dt;measure(dt);sync();return fallAge>2.5&&velocity.length()<.35||fallAge>7}
 function nudge(strength,dir){if(mode!=='active')return;torso.b.applyImpulse(dir.clone().multiplyScalar(totalMass*strength*.45),true)}
 function stop(){for(const p of parts)world.removeRigidBody(p.b);parts=[];links=[];feet=[];pelvis=torso=null;mode='off';contact=[0,0];supportCount=0}
 return {start,drive,sync,release,tickFall,nudge,stop,get mode(){return mode},get live(){return parts.length>0},get position(){return pelvis?v(pelvis.b.translation()):r.root.position.clone()},get stats(){return {mode,bodies:parts.length,joints:links.length,groundN:contact.map(n=>Math.round(n)),supportCount,com:com.toArray().map(n=>+n.toFixed(3)),motorNm:Math.round(effort),assistN:Math.round(assist),anchorError:+maxAnchorError.toFixed(3)}}};
}
