import * as T from 'three';import {V,Q,UP} from './geometry.js';import {ACTIONS,GLASS,angle,clamp,smooth,nextAction} from './math.js';import {makeRig,legIK,armIK,curl,contact,neutralArm,rolledLeg} from './rig.js?v=1.14';
import {stepProfile,captureOffset,spring} from './dynamics.js?v=1.11';import {createFallRig} from './physical.js?v=1.14';
import {groundProbe,targetFoot} from './gait.js?v=1.14';
import {createCompliance,angularStep} from './motion.js?v=1.14';import {swingCurve} from './locomotion-math.js?v=1.13';
import {createActiveRig} from './active.js?v=1.15';
const forward=y=>V(Math.sin(y),0,Math.cos(y)),right=y=>V(Math.cos(y),0,-Math.sin(y)),durations={'wander':5,'jog':3,'backpedal':2.2,'sidestep':2.5,'tiptoe':3,'inspect':3,'stretch':3,'scratch head':3.5,'shrug':2,'wave':3,'inspect hands':3,'hands on hips':3,'dance':5,'crouch':3,'look at player':3,'approach player':4,'retreat':3,'startle':1,'brace':1.5,'duck':1.5,'avoid prop':2,'knock on glass':4,'head tilt':3,'hands on knees':4.5,'jump':2.2,'exercise':8,'wall push-ups':8,'handstand push-ups':10,'pick up item':5,'carry item':4,'throw item':2.6,'drop item':1.6,'recover':2.8,'stumble':1.5};
const moving=new Set(['wander','jog','backpedal','sidestep','tiptoe','dance','approach player','retreat','avoid prop']);
export function createDummy(scene,event,lab,R,world){const r=makeRig(scene),center=V(0,0,-1.2),plants=[V(-.15,.075,-1.2),V(.15,.075,-1.2)],goal=V(),history=[];let yaw=0,clock=0,age=0,seed=723,action='wander',phase='walk',step=null,next=0,manual=false,knocks=0,reach=0,cool=0,curiosity=.6,boredom=.3,wariness=.05,playfulness=.6;const fall=createFallRig(R,world,r),active=createActiveRig(R,world,r),compliance=createCompliance(r),velocity=V(),disturbance=V(),lastVel=V(),acceleration=V();let pelvisY=.89,pelvisV=0,hipShift=0,hipShiftV=0,strideSign=0,stepCount=0;let pending=null,transition=null,fallAge=0,recovery=null,item=null,gripStart=null,gripStage=false,dropStage=false,stability=0,tripCooldown=0,stepRoll=[0,0],footHeading=[0,0],weight=[.5,.5],motionAge=0;
const nodes=[r.pelvis,r.spine,r.thorax,r.body,r.neck,r.atlas,r.head,...r.arms.flatMap(a=>[a.clavicle,a.scapula,a.a,a.b,a.twist,a.h,...a.digits.flatMap(d=>[d.base,...d.bones])])];const snapshot=(list=nodes)=>list.map(g=>({g,p:g.position.clone(),q:g.quaternion.clone()}));function blendPose(data,t){for(const a of data){a.g.position.lerp(a.p,1-t);a.g.quaternion.slerp(a.q,1-t)}}
function emit(type,data={}){const row={type,clock,action,...data};history.push(row);if(history.length>240)history.shift();event?.(row);}
function random(){seed=nextAction(seed);return seed/4294967296;}
function choose(ctx){if(lab.held&&random()<.40)return random()<.65?'throw item':'drop item';if(!lab.held&&lab.count&&random()<.35)return 'pick up item';if(ctx.noise&&cool<=0){cool=3;wariness=clamp(wariness+.25,0,1);return 'startle';}if(ctx.distance<1.15&&cool<=0){cool=3;wariness=clamp(wariness+.16,0,1);return 'retreat';}const pool=['wander','wander','inspect','stretch','scratch head','head tilt','wave','dance','hands on knees','jump','exercise','wall push-ups','handstand push-ups','knock on glass','look at player','inspect hands','shrug','hands on hips','tiptoe','jog'];return pool[Math.floor(random()*pool.length)];}
function request(a,ctx={},m=true){if(!ACTIONS.includes(a))return false;if(fall.active||active.mode==='falling'){if(a==='recover'){beginRecovery();return true}pending={a,ctx,m};return true}if(step&&phase==='walk'){pending={a,ctx,m};return true}transition={data:snapshot(),t:0,span:.46};manual=m;action=a;age=0;step=null;knocks=0;item=null;gripStart=null;gripStage=false;dropStage=false;motionAge=0;phase=moving.has(a)||a==='knock on glass'||a==='wall push-ups'?'walk':'act';if(a==='pick up item'&&!lab.held){item=lab.nearest(center);if(item){const p=V().copy(item.body.translation()),d=p.clone().sub(center);d.y=0;if(d.length()<.02)d.copy(forward(yaw));d.normalize();goal.copy(p).addScaledVector(d,-.47);goal.y=0;phase='walk'}else phase='act'}else if(a==='carry item'&&lab.held){goal.copy(center).addScaledVector(forward(yaw),1.4);phase='walk'}else if(a==='stumble'){disturbance.addScaledVector(right(yaw),.72);goal.copy(center).addScaledVector(forward(yaw),.65);phase='walk'}else if(a==='knock on glass')goal.set(clamp(center.x,-3.6,3.6),0,GLASS-.57);else if(a==='wall push-ups')goal.set(clamp(center.x,-3.8,3.8),0,-7.73);else if(a==='approach player')goal.set(clamp(ctx.point?.x||0,-3.6,3.6),0,GLASS-.7);else if(a==='retreat'||a==='backpedal'||a==='avoid prop')goal.copy(center).addScaledVector(forward(yaw),-1.3);else if(a==='sidestep')goal.copy(center).addScaledVector(right(yaw),1.2);else goal.set((random()-.5)*6.6,0,-6+random()*7.8);goal.x=clamp(goal.x,-4.3,4.3);goal.z=clamp(goal.z,-7.7,2.55);emit('begin');return true;}
// Neutral standing: softly unlocked knees, a planted staggered stance,
// modest lateral loading and opposite torso compensation. Contact actions
// deliberately keep their original pelvis/foot targets.
const relaxedActions=new Set(['inspect','head tilt','look at player','inspect hands','scratch head','wave','shrug','hands on hips']);
function pose(h=.83,relaxed=false){
 const sway=relaxed?.026+.009*Math.sin(clock*.78):0,breath=relaxed?.002*Math.sin(clock*1.72):0;
 r.root.position.set(center.x,h+breath,center.z).addScaledVector(right(yaw),sway);
 r.root.rotation.set(0,yaw,0);
 r.body.rotation.set(relaxed?.016:0,relaxed?.018*Math.sin(clock*.61):0,relaxed?.036:0);
 compliance.restoreOffsets();r.pelvis.rotation.set(0,0,0);r.spine.rotation.set(0,0,0);r.thorax.rotation.set(0,0,0);r.atlas.rotation.set(0,0,0);r.neck.rotation.set(0,0,0);r.head.rotation.set(0,0,relaxed?-.018:0);r.root.updateMatrixWorld(true);
 for(let i=0;i<2;i++){
  const s=r.legs[i].s,heading=yaw+s*(relaxed?.085:0);
  reach=Math.max(reach,rolledLeg(r,i,plants[i],phase==='walk'?footHeading[i]:heading,phase==='walk'?stepRoll[i]:0,phase==='walk'&&step?.i===i&&plants[i].y>groundProbe(R,world,plants[i])+.006));
  neutralArm(r.arms[i],clock);
 }
}
function stand(relaxed=false){for(let i=0;i<2;i++){
 const s=r.legs[i].s;
 plants[i].copy(center).addScaledVector(right(yaw),s*(relaxed?.135:.15));
 if(relaxed)plants[i].addScaledVector(forward(yaw),s*.045);
 plants[i].y=.075;
}}
function walk(dt){
 const d=goal.clone().sub(center),distance=d.length();let final=action==='knock on glass'?0:action==='wall push-ups'?Math.PI:null;
 if(action==='pick up item'&&item&&lab.has(item)){const p=item.body.translation();final=Math.atan2(p.x-center.x,p.z-center.z)}
 const moveHeading=distance>.045?Math.atan2(d.x,d.z):yaw,back=action==='backpedal'||action==='retreat',side=action==='sidestep',tip=action==='tiptoe',jog=action==='jog',stopping=!!pending;
 const face=distance<.21&&final!==null?final:distance<.12?yaw:back?moveHeading+Math.PI:side?yaw:moveHeading;
 const err=angle(yaw,face);yaw+=clamp(err*5.2,-2.4,2.4)*dt;
 // Acceleration-limited continuous momentum, independent of foot phase.
 const maxSpeed=jog?1.55:tip?.58:action==='stumble'?.80:1.02;
 const desiredSpeed=stopping?0:Math.min(maxSpeed,Math.max(0,(distance-.09)*2.8),Math.sqrt(2*2.2*Math.max(0,distance-.08)))*clamp(1-Math.abs(err)*.48,.08,1);
 const desired=forward(moveHeading).multiplyScalar(desiredSpeed).add(disturbance);
 const dv=desired.clone().sub(velocity);if(dv.length()>dt*3.3)dv.setLength(dt*3.3);velocity.add(dv);
 const old=center.clone();center.addScaledVector(velocity,dt);center.x=clamp(center.x,-4.55,4.55);center.z=clamp(center.z,-7.85,2.67);velocity.copy(center.clone().sub(old).multiplyScalar(1/Math.max(dt,.00001)));
 acceleration.lerp(velocity.clone().sub(lastVel).multiplyScalar(1/Math.max(dt,.00001)),1-Math.exp(-dt*9));lastVel.copy(velocity);disturbance.multiplyScalar(Math.exp(-dt*2.2));
 const speed=velocity.length(),activity=clamp(speed/1.15,0,1),period=clamp(.44-.13*activity+(tip?.10:0),.30,.55),ground=p=>groundProbe(R,world,p);
 const targets=r.legs.map(l=>targetFoot(center,yaw,l.s,velocity,period*.68,ground,.126+.016*activity));
 const drift=targets.map((p,i)=>Math.hypot(p.x-plants[i].x,p.z-plants[i].z));
 const threshold=.075+.07*activity;
 if(!step){
  const turning=Math.abs(err)>.16;
  if((stopping||distance<.17)&&speed<.10&&!turning&&Math.max(...drift)<.14){
   for(let i=0;i<2;i++)stepRoll[i]*=Math.exp(-dt*12);weight=[.5,.5];return true;
  }
  const i=drift[next]>=drift[1-next]-.07?next:1-next;
  if(drift[i]>threshold||turning||speed>.14){
   next=1-i;const other=plants[1-i],sign=r.legs[i].s,end=targets[i].clone();
   const lateral=end.clone().sub(other).dot(right(yaw))*sign;if(lateral<.16)end.addScaledVector(right(yaw),sign*(.16-lateral));
   end.x=clamp(end.x,-4.9,4.9);end.z=clamp(end.z,-8,2.82);end.y=ground(end);
   step={i,from:plants[i].clone(),end,t:0,dt:period,oldHeading:footHeading[i],hit:false};strideSign=sign;
  }
 }
 let u=0,lift=0,stance=-1,sign=strideSign;
 if(step){
  const s=step,i=s.i;stance=1-i;sign=r.legs[i].s;s.t+=dt;u=clamp(s.t/s.dt,0,1);
  const v=clamp((u-.12)/.78,0,1),p=swingCurve(v);
  if(u<.62){const target=targets[i].clone(),other=plants[stance],lat=target.clone().sub(other).dot(right(yaw))*sign;if(lat<.16)target.addScaledVector(right(yaw),sign*(.16-lat));target.x=clamp(target.x,-4.9,4.9);target.z=clamp(target.z,-8,2.82);target.y=ground(target);const delta=target.sub(s.end);if(delta.length()>.12)delta.setLength(.12);s.end.addScaledVector(delta,1-Math.exp(-dt*7))}
  plants[i].copy(s.from).lerp(s.end,p.progress);const obstacle=lab.obstacle(plants[i]);lift=p.lift*(.065+.083*activity+(jog?.035:0)+(obstacle?.radius||0)*.65);plants[i].y+=lift;
  footHeading[i]=s.oldHeading+angle(s.oldHeading,yaw+sign*.06)*p.progress;
  const load=.5+.5*Math.sin(Math.PI*u)**.75;weight[stance]=load;weight[i]=1-load;
  const supportRoll=tip?.48:.39*smooth((u-.55)/.45),swingRoll=tip?.34:.28*(1-smooth(u/.22))-.16*Math.sin(Math.PI*v);
  stepRoll[stance]+=(supportRoll-stepRoll[stance])*(1-Math.exp(-dt*17));stepRoll[i]+=(swingRoll-stepRoll[i])*(1-Math.exp(-dt*17));
  if(obstacle&&!s.hit&&u>.2&&u<.80&&lift<obstacle.radius*1.65){s.hit=true;disturbance.addScaledVector(forward(yaw),.8);disturbance.addScaledVector(right(yaw),sign*.26);obstacle.body.applyImpulse(forward(yaw).multiplyScalar(.24),true);tripCooldown=.8;emit('trip',{kind:obstacle.kind})}
  if(u>=1){plants[i].copy(s.end);step=null;stepCount++}
 }else{weight=[.5,.5];for(let i=0;i<2;i++)stepRoll[i]+=(Number(tip)*.42-stepRoll[i])*(1-Math.exp(-dt*12))}
 const support=plants[0].clone().multiplyScalar(weight[0]).addScaledVector(plants[1],weight[1]);support.y=0;
 stability=center.clone().add(V(captureOffset(velocity.x),0,captureOffset(velocity.z))).distanceTo(support);
 if(stability>.66&&disturbance.length()>.40&&tripCooldown>0){startFall(velocity.clone().add(disturbance));return false}
 const targetShift=clamp(support.clone().sub(center).dot(right(yaw))*.58,-.09,.09);
 [hipShift,hipShiftV]=angularStep(hipShift,hipShiftV,targetShift,dt,11,.88);
 const spread=Math.hypot(plants[0].x-plants[1].x,plants[0].z-plants[1].z);
 let height=(tip?.928:jog?.879:.897)-clamp((spread-.25)*.15,0,.082)-.016*Math.sin(Math.PI*u)**2;
 const pelvisCenter=center.clone().addScaledVector(right(yaw),hipShift);
 for(let i=0;i<2;i++){const hip=pelvisCenter.clone().addScaledVector(right(yaw),r.legs[i].s*.137),f=plants[i],dx=hip.x-f.x,dz=hip.z-f.z;height=Math.min(height,f.y+.095*Math.max(0,Math.sin(stepRoll[i]))+Math.sqrt(Math.max(.10,.83**2-dx*dx-dz*dz)))}
 [pelvisY,pelvisV]=angularStep(pelvisY,pelvisV,height,dt,14,.86);pelvisY=Math.min(pelvisY,height+.025);
 pose(pelvisY);r.root.position.addScaledVector(right(yaw),hipShift);
 const aF=acceleration.dot(forward(yaw)),aS=acceleration.dot(right(yaw)),osc=step?sign*Math.cos(Math.PI*u):0,twist=osc*.105*activity;
 r.pelvis.rotation.set(clamp(-.025-aF*.012,-.09,.10),twist,-hipShift*.85);
 r.spine.rotation.set(.035+clamp(aF*.022,-.11,.14),-twist*.65,hipShift*.46-clamp(aS*.012,-.065,.065));
 r.thorax.rotation.set(.02+activity*.026,-twist*.70,hipShift*.28);
 r.body.rotation.set(clamp(aF*.012,-.06,.09),-twist*.24,0);
 r.neck.rotation.set(-r.spine.rotation.x*.36,twist*.48,0);r.atlas.rotation.set(-.025,twist*.22,0);
 r.head.rotation.y=.06*Math.sin(clock*.83);r.root.updateMatrixWorld(true);
 for(let i=0;i<2;i++){rolledLeg(r,i,plants[i],footHeading[i],stepRoll[i],step?.i===i&&lift>.003);const a=r.arms[i],dir=r.legs[i].s===sign?1:-1;const swing=step?dir*(tip?.18:jog?.52:.39)*Math.cos(Math.PI*u)*activity:0;neutralArm(a,clock,swing,activity);if(tripCooldown>.25&&disturbance.length()>.35){a.a.rotation.x-=.42;a.a.rotation.z=a.s*.28}}
 return false;
}
function act(dt,ctx){const t=age,span=durations[action],f=smooth(t/.35)*smooth((span-t)/.35),w=Math.sin(t*3),rep=(1-Math.cos(t*3))/2;const relaxed=relaxedActions.has(action);for(const p of plants)p.y=groundProbe(R,world,p);velocity.multiplyScalar(Math.exp(-dt*8));center.x+=(velocity.x+disturbance.x)*dt;center.z+=(velocity.z+disturbance.z)*dt;disturbance.multiplyScalar(Math.exp(-dt*2.7));pose(relaxed?.895:.83,relaxed);pelvisY=r.root.position.y;pelvisV*=Math.exp(-dt*7);const load=clamp(.032*Math.sin(clock*.68)+.02*Math.sin(clock*.21),-.055,.055);r.pelvis.rotation.z=load;r.spine.rotation.z=-load*.72;r.thorax.rotation.y=.025*Math.sin(clock*.93);r.atlas.rotation.z=-load*.22;r.root.updateMatrixWorld(true);const bodyPoint=(x,y,z)=>r.body.localToWorld(V(x,y,z));const hand=(i,x,y,z)=>armIK(r,i,bodyPoint(x,y,z));const both=(y,z,x=.28)=>{for(let i=0;i<2;i++)hand(i,r.arms[i].s*x,y,z);};const flex=(v)=>r.arms.forEach(a=>curl(a,v,.04));
switch(action){
case 'pick up item':{
 if(!item||!lab.has(item)||(lab.held&&!gripStage)){if(lab.held)hand(1,.30,.35,.27);break}
 const p=gripStart||V().copy(item.body.translation()),bend=smooth(t/.85)*smooth((4.7-t)/.95),rise=gripStage?smooth((t-2.05)/1.2):0;
 pose(.895-.46*bend*(1-rise),false);r.body.rotation.x=.87*bend*(1-rise);r.neck.rotation.x=-.25*bend;r.root.updateMatrixWorld(true);
 const q=Q().setFromAxisAngle(UP,yaw),target=p.clone().sub(V(0,-.09,.062).applyQuaternion(q));curl(r.arms[1],gripStage?.78:.12,.04);
 if(!gripStage){armIK(r,1,target,V(.5,0,-1),q);r.root.updateMatrixWorld(true);if(t>.85&&t<2.8&&lab.grab(item,r.arms[1].h)){gripStage=true;gripStart=p.clone();emit('grasp',{kind:item.kind})}}
 if(gripStage){curl(r.arms[1],.78,.015);const wrist=target.clone().lerp(r.body.localToWorld(V(.30,.36,.27)),rise);armIK(r,1,wrist,V(.6,0,-.7),q)}break;}
case 'carry item':if(lab.held){hand(1,.31,.35,.27);curl(r.arms[1],.76,.015)}break;
case 'throw item':if(lab.held||dropStage){const wind=smooth(t/.7),swing=smooth((t-.7)/.42),follow=smooth((t-1.12)/1.0);r.body.rotation.y=-.32*wind+.69*swing-.37*follow;r.body.rotation.x=.08*swing;r.root.updateMatrixWorld(true);const target=V(.36,.40,.24).lerp(V(.38,.68,-.24),wind).lerp(V(.21,.71,.51),swing).lerp(V(.32,.15,.12),follow);hand(1,target.x,target.y,target.z);curl(r.arms[1],dropStage?.10:.75,.03);if(t>1.06&&!dropStage&&lab.held){lab.release(true,forward(yaw));dropStage=true;emit('throw')}}break;
case 'drop item':if(lab.held){hand(1,.34,.17,.24);curl(r.arms[1],.75*(1-smooth(t/.7)),.035);if(t>.75&&!dropStage){lab.release(false);dropStage=true;emit('drop')}}break;
case 'recover':pose(.61+.284*smooth(t/2.8),false);r.body.rotation.x=.43*(1-smooth(t/2.8));break;
case 'inspect':case 'head tilt':case 'look at player':r.head.rotation.z=.27*f*Math.sin(t*1.8);r.head.rotation.y=action==='look at player'&&ctx.point?clamp(angle(yaw,Math.atan2(ctx.point.x-center.x,ctx.point.z-center.z)),-.9,.9):.5*f*Math.sin(t*1.4);break;
case 'stretch':both(.99*f+.08,.10,.34);break;
case 'scratch head':hand(1,.14,.87,.09);r.arms[1].h.rotation.x=.13*w;flex(.45);r.head.rotation.z=-.15*f;break;
case 'shrug':both(.32+.15*f,.28,.56);r.body.rotation.z=.06*w*f;break;
case 'wave':hand(1,.44,.72+.12*w,.20);r.arms[1].h.rotation.z=.45*w;break;
case 'inspect hands':both(.45,.37,.20);r.head.rotation.x=.25*f;break;
case 'hands on hips':both(.10,.03,.21);break;
case 'dance':r.body.rotation.z=.17*w*f;r.body.rotation.y=.22*Math.cos(t*3)*f;both(.35+.20*w,.26,.39);break;
case 'crouch':case 'duck':case 'hands on knees':case 'exercise':{const b=action==='exercise'?rep*f:f;pose(.83-(action==='hands on knees'?.29:.23)*b);r.body.rotation.x=.34*b;r.head.rotation.x=-.16*b;r.root.updateMatrixWorld(true);if(action==='hands on knees'){for(let i=0;i<2;i++){const k=r.legs[i].thigh.position.clone();k.y+=.09;armIK(r,i,k);}}else both(.32,.33,.32);break;}
case 'jump':{let height=0,compression=0;if(t<.55)compression=.22*smooth(t/.55);else if(t<1.18){const u=(t-.55)/.63;height=.48*4*u*(1-u);}else if(t<1.65)compression=.22*Math.sin(Math.PI*clamp((t-1.18)/.47,0,1));for(let p of plants)p.y+=height;pose(.83+height-compression);both(.45+.42*Math.sin(Math.PI*clamp((t-.35)/1.2,0,1)),.25);if(t>=1.18&&t-dt<1.18)emit('landing');break;}
case 'startle':both(.65,.23,.40);r.head.rotation.x=-.18*f;flex(.55);break;
case 'brace':both(.54,.31,.22);flex(.60);break;
case 'knock on glass':{r.head.rotation.z=.12*Math.sin(t*1.8);const beat=t>.6&&t<3.5?Math.pow(Math.max(0,Math.cos((t-.6)*Math.PI*2/.58)),3):0;curl(r.arms[1],.95,0);contact(r,1,V(center.x+.26,1.38,GLASS-.018-.12*(1-beat)),V(0,0,-1),UP,V(.5,0,-1));if(beat>.9&&Math.floor((t-.6+.18)/.58)>knocks){knocks++;emit('glass_knock',{index:knocks});}break;}
case 'wall push-ups':{r.root.position.addScaledVector(forward(yaw),.14*rep*f);r.body.rotation.x=.14+.27*rep*f;r.root.updateMatrixWorld(true);for(let i=0;i<2;i++){legIK(r,i,plants[i],yaw);curl(r.arms[i],.02,.07);contact(r,i,V(center.x-r.arms[i].s*.26,1.39,-8.38),V(0,0,1),UP,V(r.arms[i].s,0,-.7));}break;}
case 'handstand push-ups':{const invert=smooth(t/1.7)*smooth((span-t)/1.7),rr=(1-Math.cos(Math.max(0,t-1.7)*3))/2;r.root.position.y=T.MathUtils.lerp(.83,.93-.12*rr,invert);r.root.quaternion.setFromEuler(new T.Euler(Math.PI*invert,yaw,0,'YXZ'));r.root.updateMatrixWorld(true);for(let i=0;i<2;i++){const s=r.legs[i].s;const ankle=r.root.localToWorld(V(s*.15,-.75,0));legIK(r,i,ankle,yaw,r.root.quaternion.clone());curl(r.arms[i],.02,.08);if(invert>.85){const spot=center.clone().addScaledVector(right(yaw),s*.27).addScaledVector(forward(yaw),.03);spot.y=.005;contact(r,i,spot,UP,forward(yaw),V(s,0,.5));}else hand(i,s*.34,.12,.18);}break;}
}}
function startFall(v){
 if(fall.active||active.mode==='falling')return;lab.release(false);if(active.live){active.release();transition=null;step=null;phase='fallen';emit('fall',{active:true});return}compliance.reset();transition=null;step=null;fallAge=0;fall.start(v,V(v.x*5,0,v.z*5));emit('fall');phase='fallen';
}
function beginRecovery(){
 if(!fall.active&&active.mode!=='falling')return;if(active.live){active.sync();active.stop()}else fall.stop();const data=snapshot([r.root,...nodes,...r.legs.flatMap(l=>[l.thigh,l.shin,l.foot,l.toe])]);
 compliance.restoreOffsets();compliance.reset();center.set(clamp(r.root.position.x,-4.4,4.4),0,clamp(r.root.position.z,-7.6,2.4));velocity.set(0,0,0);disturbance.set(0,0,0);stepRoll=[0,0];stand(true);footHeading=[yaw,yaw];action='recover';phase='act';age=0;recovery={data,t:0};emit('recover');
}
function perturb(strength=.85){
 if(fall.active||active.mode==='falling'){beginRecovery();return}if(active.live){active.nudge(strength,right(yaw));emit('physical impulse',{strength});return}const d=right(yaw).multiplyScalar(strength);disturbance.add(d);tripCooldown=1.2;
 if(strength>1.65){startFall(velocity.clone().add(d));return}
 if(phase!=='walk'){request('stumble',{},false)}emit('balance disturbance',{strength});
}
function update(dt,ctx={}){
 clock+=dt;cool=Math.max(0,cool-dt);tripCooldown=Math.max(0,tripCooldown-dt);wariness=Math.max(0,wariness-dt*.025);boredom=clamp(boredom+dt*.018,0,1);curiosity=clamp(curiosity+dt*.008,0,1);
 if(active.mode==='falling'){if(active.tickFall(dt))beginRecovery();return}
 if(fall.active){fall.sync();fallAge+=dt;if(fallAge>3.2&&fall.speed<.28||fallAge>7)beginRecovery();return}
 if(ctx.noise&&cool<=0&&!recovery){cool=3;wariness=clamp(wariness+.2,0,1);request('startle',ctx,false)}
 age+=dt;motionAge+=dt;
 if(phase==='walk'){
  const finished=walk(dt);if(fall.active||active.mode==='falling')return;
  if(!step&&pending&&velocity.length()<.15){const q=pending;pending=null;request(q.a,q.ctx,q.m)}
  else if(finished||age>45){step=null;stepRoll=[0,0];if(['knock on glass','wall push-ups','dance','pick up item'].includes(action)){phase='act';age=0;transition={data:snapshot(),t:0,span:.45}}else{emit('end');request(manual?'inspect':choose(ctx),ctx,manual)}}
 }else{
  act(dt,ctx);
  if(age>=durations[action]){recovery=null;emit('end');const p=pending;pending=null;request(p?.a||(manual?'inspect':choose(ctx)),p?.ctx||ctx,p?.m??manual)}
 }
 if(transition){transition.t+=dt;blendPose(transition.data,smooth(transition.t/transition.span));if(transition.t>=transition.span)transition=null}
 if(recovery){recovery.t+=dt;blendPose(recovery.data,smooth(recovery.t/1.9));if(recovery.t>=1.9)recovery=null}
 compliance.update(dt,{lockHands:!!lab.held||['knock on glass','wall push-ups','handstand push-ups','pick up item','throw item','drop item','hands on knees'].includes(action),skip:!!recovery});
 if(lab.held){if(!['throw item','drop item','pick up item'].includes(action)){r.root.updateMatrixWorld(true);armIK(r,1,r.body.localToWorld(V(.30,.34,.27)));curl(r.arms[1],.77,.015)}}
 if(active.live){active.drive(dt,velocity);active.sync();if(active.mode==='falling'){lab.release(false);phase='fallen';emit('fall',{active:true})}}
 if(lab.held)lab.follow(r.arms[1].h,dt);
}
function setActive(on){if(on){if(active.live)return true;if(fall.active||recovery)return false;active.start(velocity);emit('active physics enabled');return true}else{if(!active.live)return true;const p=active.position;active.stop();compliance.restoreOffsets();compliance.reset();center.set(clamp(p.x,-4.4,4.4),0,clamp(p.z,-7.6,2.4));velocity.set(0,0,0);disturbance.set(0,0,0);step=null;pending=null;phase='act';stand(true);request('inspect',{},true);pose(.895,true);emit('active physics disabled');return true}}
function reset(){if(active.live)active.stop();if(fall.active)fall.stop();lab.clear();pending=null;transition=null;recovery=null;velocity.set(0,0,0);disturbance.set(0,0,0);lastVel.set(0,0,0);acceleration.set(0,0,0);pelvisY=.89;pelvisV=hipShift=hipShiftV=0;stepCount=0;compliance.reset();stepRoll=[0,0];footHeading=[0,0];step=null;phase='act';center.set(0,0,-1.2);yaw=clock=0;seed=723;next=0;reach=0;history.length=0;stand(true);request('inspect',{},false);pose(.895,true);}
reset();return {r,update,request,reset,perturb,setActive,history,get action(){return action+' / '+phase},get stats(){return {curiosity,boredom,wariness,playfulness,reach,events:history.length,weight:weight.map(x=>+x.toFixed(2)),captureDistance:+stability.toFixed(3),speed:+velocity.length().toFixed(2),fallBodies:fall.count,steps:stepCount,compliantJoints:compliance.count,activePhysics:active.stats,items:lab.count,holding:lab.held?.kind||null}},setAuto(ctx){request('wander',ctx,false);}};}
