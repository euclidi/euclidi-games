import * as T from 'three';import {V,Q} from './geometry.js';import {angle,clamp} from './math.js';import {rolledLeg,neutralArm,armIK,curl} from './rig.js?v=1.11.1';import {predictFoot,swingCurve} from './locomotion-math.js?v=1.13';
// Inspired by Igor Santarek's MIT-licensed ProceduralWalk: predicted
// grounded foot targets, displacement-triggered steps, persistent anchors,
// and pelvis adjustment from foot spread. Original JS implementation.
export function groundProbe(R,world,p,base=0){
 const y=base+.28;const hit=world.castRay(new R.Ray({x:p.x,y,z:p.z},{x:0,y:-1,z:0}),.56,false,R.QueryFilterFlags.ONLY_FIXED);
 const t=hit?.timeOfImpact??hit?.toi;const ground=Number.isFinite(t)&&t>.025?y-t:base;
 return clamp(Number.isFinite(ground)?ground:base,base-.12,base+.24)+.075;
}
export function targetFoot(center,heading,s,vel,lead,ground,width=.135){
 const [x,z]=predictFoot(center.x,center.z,heading,s,vel.x,vel.z,lead,width);
 const p=V(x,0,z);p.y=ground(p);return p;
}
export function createPlayerGait(r,R,world){
 const feet=[V(),V()],headings=[0,0],roll=[0,0],weights=[.5,.5];let ready=false,step=null,next=0,clock=0,height=.875,last=V(),load=0,cycle=0;
 const ground=p=>groundProbe(R,world,p,0)+.026;
 function reset(pos,yaw){for(let i=0;i<2;i++){feet[i].copy(targetFoot(pos,yaw,r.legs[i].s,V(),0,ground));headings[i]=yaw;roll[i]=0}last.copy(pos);step=null;ready=true;height=.875;load=0}
 function update(dt,pos,yaw,pitch,velocity,tip=false){
  clock+=dt;const speed=Math.hypot(velocity.x,velocity.z),activity=clamp(speed/1.65,0,1);
  if(!ready||last.distanceTo(pos)>.8)reset(pos,yaw);last.copy(pos);
  const targets=r.legs.map(l=>targetFoot(pos,yaw,l.s,velocity,.13+.055*activity,ground));
  const errors=feet.map((f,i)=>Math.hypot(f.x-targets[i].x,f.z-targets[i].z));
  if(!step){
   let i=errors[0]>.03+errors[1]?0:errors[1]>.03+errors[0]?1:next;
   const threshold=.064+.070*activity;
   if(errors[i]>threshold||Math.abs(angle(headings[i],yaw))>.32){
    next=1-i;step={i,from:feet[i].clone(),to:targets[i].clone(),yaw0:headings[i],t:0,duration:clamp(.37-.10*activity,.24,.40)};
   }
  }
  let lift=0,sign=0,u=0;
  if(step){const st=step,i=st.i;st.t+=dt;u=clamp(st.t/st.duration,0,1);const p=swingCurve(u);sign=r.legs[i].s;
   if(u<.72){const target=targets[i];const delta=target.clone().sub(st.to);if(delta.length()>.18)delta.setLength(.18);st.to.addScaledVector(delta,1-Math.exp(-dt*9))}
   feet[i].copy(st.from).lerp(st.to,p.progress);lift=p.lift*(.055+.065*activity);feet[i].y+=lift;
   headings[i]=st.yaw0+angle(st.yaw0,yaw+sign*.055)*p.progress;
   roll[i]=tip?.34:.22*(1-u)-.14*Math.sin(Math.PI*u);roll[1-i]=tip?.42:.32*clamp((u-.55)/.45,0,1);
   weights[1-i]=.5+.5*Math.sin(Math.PI*u);weights[i]=1-weights[1-i];
   if(u>=1){feet[i].copy(st.to);step=null;cycle++;roll[i]=tip?.34:0}
  }else{for(let i=0;i<2;i++)roll[i]+=(Number(tip)*.42-roll[i])*(1-Math.exp(-dt*12));weights[0]=weights[1]=.5}
  const spread=Math.hypot(feet[0].x-feet[1].x,feet[0].z-feet[1].z),targetHeight=(tip?.925:.894)-clamp((spread-.27)*.14,0,.075)-.012*Math.sin(Math.PI*u);
  let h=targetHeight;
  for(let i=0;i<2;i++){const l=r.legs[i],hip=pos.clone().add(V(l.s*.137,0,0).applyAxisAngle(V(0,1,0),yaw));const p=feet[i],d=Math.hypot(p.x-hip.x,p.z-hip.z);h=Math.min(h,p.y+Math.sqrt(Math.max(.13,.833**2-d*d))+(roll[i]>0?.09*Math.sin(roll[i]):0))}
  height+=(h-height)*(1-Math.exp(-dt*14));load+=(-sign*.035*Math.sin(Math.PI*u)-load)*(1-Math.exp(-dt*12));
  r.root.position.copy(pos).add(V(load,height,0).applyAxisAngle(V(0,1,0),yaw));r.root.rotation.set(0,yaw,0);
  r.spine.rotation.set(0,sign*.045*Math.sin(Math.PI*u),0);r.body.rotation.set(.035*activity,-sign*.055*Math.sin(Math.PI*u),-load*.7);r.neck.rotation.set(0,-r.body.rotation.y*.5,0);r.head.rotation.set(clamp(pitch,-.45,.45),0,0);r.root.updateMatrixWorld(true);
  for(let i=0;i<2;i++){rolledLeg(r,i,feet[i],headings[i],roll[i],step?.i===i&&lift>.003);const swing=(r.legs[i].s===sign?1:-1)*.29*activity*Math.cos(Math.PI*u);neutralArm(r.arms[i],clock,step?swing:0,activity)}
  return {height,load,speed,steps:cycle,weights:weights.slice()};
 }
 return {reset,update,get state(){return {steps:cycle,feet:feet.map(f=>f.toArray()),support:weights.slice()}}};
}
