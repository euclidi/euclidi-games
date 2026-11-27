import * as T from 'three';import {V,Q,mesh,material,bevel} from './geometry.js';
const vec=p=>V(p.x,p.y,p.z);
const quat=q=>Q().set(q.x,q.y,q.z,q.w);
export function createPhysicalLab(scene,R,world){
 const objects=[];let held=null,lastGrip=null,gripVelocity=V(),counter=0;
 function spawn(type,point){
  if(objects.length>=12){const old=objects.find(o=>o!==held);if(!old)return;world.removeRigidBody(old.body);scene.remove(old.mesh);objects.splice(objects.indexOf(old),1);}
  const kind=type||['ball','block','cylinder'][counter++%3],radius=kind==='ball'?.085:kind==='block'?.074:.067;
  const m=material(kind==='ball'?[137,83,55]:kind==='block'?[112,120,111]:[82,112,135],.63,.08,18);
  const o=kind==='ball'?mesh(scene,new T.SphereGeometry(radius,20,14),m):kind==='block'?bevel(scene,m,.145,.145,.145,0,0,0,.012):mesh(scene,new T.CylinderGeometry(radius,radius,.16,18),m);
  const pos=V(Math.max(-4.9,Math.min(4.9,point.x)),Math.max(.4,point.y),Math.max(-7.7,Math.min(2.5,point.z)));
  o.position.copy(pos);const b=world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(pos.x,pos.y,pos.z).setCcdEnabled(true).setLinearDamping(.12).setAngularDamping(.18));
  const desc=kind==='ball'?R.ColliderDesc.ball(radius):kind==='block'?R.ColliderDesc.cuboid(.0725,.0725,.0725):R.ColliderDesc.cylinder(.08,radius);
  world.createCollider(desc.setDensity(kind==='block'?650:kind==='ball'?420:780).setFriction(.64).setRestitution(kind==='ball'?.56:.14),b);
  const item={kind,radius,body:b,mesh:o};objects.push(item);return item;
 }
 function nearest(pos){let result=null,best=Infinity;for(const o of objects){if(o===held)continue;const p=vec(o.body.translation());if(p.y>.9)continue;const d=p.distanceToSquared(pos);if(d<best){best=d;result=o}}return result}
 function gripPoint(hand){hand.updateWorldMatrix(true,false);return hand.localToWorld(V(0,-.090,.062))}
 function grab(o,hand){if(held||!objects.includes(o))return false;const p=gripPoint(hand);if(p.distanceTo(vec(o.body.translation()))>.115)return false;held=o;lastGrip=p.clone();gripVelocity.set(0,0,0);o.body.setBodyType(R.RigidBodyType.KinematicPositionBased,true);return true}
 function follow(hand,dt){if(!held)return;const p=gripPoint(hand),q=hand.getWorldQuaternion(Q());if(lastGrip){const v=p.clone().sub(lastGrip).multiplyScalar(1/Math.max(dt,1e-5));gripVelocity.lerp(v,.38)}lastGrip=p.clone();held.body.setNextKinematicTranslation(p);held.body.setNextKinematicRotation(q)}
 function release(throwing=false,forward=V(0,0,1)){if(!held)return null;const o=held;held=null;const v=gripVelocity.clone();if(throwing){v.addScaledVector(forward,1.3);v.y+=.7;if(v.length()>8)v.setLength(8)}else if(v.length()>2)v.setLength(2);
 o.body.setBodyType(R.RigidBodyType.Dynamic,true);o.body.setLinvel(v,true);o.body.setAngvel({x:throwing?3:0,y:throwing?1:0,z:0},true);lastGrip=null;return o}
 function sync(){for(const o of objects){o.mesh.position.copy(o.body.translation());o.mesh.quaternion.copy(o.body.rotation())}}
 function clear(){held=null;lastGrip=null;for(const o of objects){world.removeRigidBody(o.body);scene.remove(o.mesh);o.mesh.geometry.dispose();o.mesh.material.dispose()}objects.length=0}
 function obstacle(p){return objects.find(o=>o!==held&&o.body.translation().y<.35&&Math.hypot(o.body.translation().x-p.x,o.body.translation().z-p.z)<o.radius+.075)}
 return {spawn,nearest,grab,follow,release,sync,clear,obstacle,has:o=>objects.includes(o),get held(){return held},get count(){return objects.length}};
}
export function createFallRig(R,world,r){
 let parts=[],joints=[];
 const writeWorld=(g,p,q)=>{if(g.parent){g.parent.updateWorldMatrix(true,false);g.position.copy(g.parent.worldToLocal(p.clone()));g.quaternion.copy(g.parent.getWorldQuaternion(Q()).invert().multiply(q))}else{g.position.copy(p);g.quaternion.copy(q)}g.updateMatrixWorld(true)};
 function start(velocity,shove){
  if(parts.length)return;
  r.root.updateWorldMatrix(true,true);for(const l of r.legs)for(const g of [l.thigh,l.shin,l.foot])g.updateWorldMatrix(true,true);
  const add=(g,shape,offset,mass,parent=null,anchor=null)=>{const p=g.getWorldPosition(V()),q=g.getWorldQuaternion(Q());const b=world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(p.x,p.y,p.z).setRotation(q).setLinearDamping(.32).setAngularDamping(1.1).setCcdEnabled(true));
   const c=shape.setTranslation(offset.x,offset.y,offset.z).setMass(mass).setFriction(.68).setRestitution(.06).setCollisionGroups(0x0002fffd);world.createCollider(c,b);
   const part={g,b};parts.push(part);b.setLinvel(velocity,true);
   if(parent){const wp=anchor||p,pa=vec(parent.b.translation()),pb=vec(b.translation()),qa=quat(parent.b.rotation()).invert(),qb=quat(b.rotation()).invert();const joint=world.createImpulseJoint(R.JointData.spherical(wp.clone().sub(pa).applyQuaternion(qa),wp.clone().sub(pb).applyQuaternion(qb)),parent.b,b,true);joint.setContactsEnabled?.(false);joints.push(joint)}
   return part;
  };
  const cap=(h,rad)=>R.ColliderDesc.capsule(h,rad),box=(x,y,z)=>R.ColliderDesc.cuboid(x,y,z);
  const pelvis=add(r.root,box(.18,.115,.105),V(0,.075,0),9);
  const torso=add(r.body,box(.205,.235,.115),V(0,.42,0),18,pelvis,r.root.localToWorld(V(0,.19,0)));
  const head=add(r.head,R.ColliderDesc.ball(.127),V(0,.156,0),4.5,torso,r.head.getWorldPosition(V()));
  for(const a of r.arms){const upper=add(a.a,cap(.078,.065),V(0,-.145,0),2.4,torso,a.a.getWorldPosition(V()));const lower=add(a.b,cap(.064,.052),V(0,-.125,0),1.6,upper,a.b.getWorldPosition(V()));add(a.h,box(.060,.08,.032),V(0,-.075,0),.55,lower,a.h.getWorldPosition(V()))}
  for(const l of r.legs){const hip=r.root.localToWorld(V(l.s*.137,0,0)),thigh=add(l.thigh,cap(.118,.082),V(0,.21,0),6.4,pelvis,hip),shin=add(l.shin,cap(.123,.066),V(0,.21,0),3.5,thigh,l.thigh.getWorldPosition(V()));add(l.foot,box(.071,.045,.12),V(0,-.028,.034),1,shin,l.foot.getWorldPosition(V()))}
  torso.b.applyImpulse(shove,true);
 }
 function sync(){for(const p of parts)writeWorld(p.g,vec(p.b.translation()),quat(p.b.rotation()))}
 function stop(){sync();for(const p of parts)world.removeRigidBody(p.b);parts=[];joints=[]}
 return {start,sync,stop,get active(){return !!parts.length},get speed(){return parts[0]?vec(parts[0].b.linvel()).length():0},get count(){return parts.length}};
}
