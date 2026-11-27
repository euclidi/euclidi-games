import {V,Q} from './geometry.js';import {clamp} from './math.js';import {legIK,armIK} from './rig.js?v=1.14';
// Local angular inertia persists between target poses. Re-solve contacts
// after spring integration, rather than separating independently blended bones.
export function angularStep(x,v,target,dt,frequency,damping=.82){
 const k=frequency*frequency,d=2*damping*frequency;
 const a=k*(target-x)-d*v;v+=a*dt;return [x+v*dt,v];
}
export function createCompliance(r){
 const list=[[r.pelvis,12],[r.spine,13],[r.thorax,10],[r.body,13],[r.neck,15],[r.atlas,12],[r.head,17],...r.arms.flatMap(a=>[[a.clavicle,11],[a.scapula,12],[a.a,13],[a.b,11],[a.twist,12],[a.h,10],...a.digits.flatMap(d=>[[d.base,17],...d.bones.map(b=>[b,19])])])];
 const states=list.map(([g,f])=>({g,f,q:g.quaternion.clone(),w:V()}));let initialized=false;
 const rest=list.map(([g])=>({g,p:g.position.clone()}));
 function reset(){initialized=false;for(const s of states){s.q.copy(s.g.quaternion);s.w.set(0,0,0)}}
 function restoreOffsets(){for(const p of rest)p.g.position.copy(p.p)}
 function update(dt,{lockHands=false,lockFeet=true,skip=false}={}){
  const ankles=lockFeet?r.legs.map(l=>({p:l.foot.position.clone(),q:l.foot.quaternion.clone(),toe:l.toe.rotation.x})):null;
  const hands=lockHands?r.arms.map(a=>({p:a.h.getWorldPosition(V()),q:a.h.getWorldQuaternion(Q())})):null;
  if(!initialized||skip){for(const s of states){s.q.copy(s.g.quaternion);s.w.set(0,0,0)}initialized=true;return}
  for(const s of states){
   const target=s.g.quaternion.clone(),err=s.q.clone().invert().multiply(target);if(err.w<0)err.set(-err.x,-err.y,-err.z,-err.w);
   const len=Math.hypot(err.x,err.y,err.z),a=2*Math.atan2(len,Math.max(0,err.w));
   const e=len>1e-7?V(err.x,err.y,err.z).multiplyScalar(a/len):V();
   const f=s.f;s.w.addScaledVector(e,f*f*dt).multiplyScalar(Math.exp(-2*.84*f*dt));if(s.w.length()>12)s.w.setLength(12);
   const d=s.w.length()*dt;if(d>1e-8)s.q.multiply(Q().setFromAxisAngle(s.w.clone().normalize(),d)).normalize();
   s.g.quaternion.copy(s.q);
  }
  r.root.updateMatrixWorld(true);
  if(ankles)for(let i=0;i<2;i++){legIK(r,i,ankles[i].p,0,ankles[i].q);r.legs[i].toe.rotation.x=ankles[i].toe}
  if(hands)for(let i=0;i<2;i++){armIK(r,i,hands[i].p,undefined,hands[i].q);for(const s of states){if([r.arms[i].a,r.arms[i].b,r.arms[i].h,r.arms[i].twist,r.arms[i].clavicle,r.arms[i].scapula].includes(s.g)){s.q.copy(s.g.quaternion);s.w.set(0,0,0)}}}
 }
 return {reset,restoreOffsets,update,get count(){return states.length}};
}
