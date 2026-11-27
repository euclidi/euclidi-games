import * as T from 'three';import {V,Q,UP} from './geometry.js';import {ACTIONS,GLASS,angle,clamp,smooth,nextAction} from './math.js';import {makeRig,legIK,armIK,curl,contact,neutralArm,rolledLeg} from './rig.js?v=1.11.1';
import {stepProfile,captureOffset,spring} from './dynamics.js?v=1.11';import {createFallRig} from './physical.js?v=1.11.1';
import {groundProbe,targetFoot} from './gait.js?v=1.13.1';
const forward=y=>V(Math.sin(y),0,Math.cos(y)),right=y=>V(Math.cos(y),0,-Math.sin(y)),durations={'wander':5,'jog':3,'backpedal':2.2,'sidestep':2.5,'tiptoe':3,'inspect':3,'stretch':3,'scratch head':3.5,'shrug':2,'wave':3,'inspect hands':3,'hands on hips':3,'dance':5,'crouch':3,'look at player':3,'approach player':4,'retreat':3,'startle':1,'brace':1.5,'duck':1.5,'avoid prop':2,'knock on glass':4,'head tilt':3,'hands on knees':4.5,'jump':2.2,'exercise':8,'wall push-ups':8,'handstand push-ups':10,'pick up item':5,'carry item':4,'throw item':2.6,'drop item':1.6,'recover':2.8,'stumble':1.5};
const moving=new Set(['wander','jog','backpedal','sidestep','tiptoe','dance','approach player','retreat','avoid prop']);
export function createDummy(scene,event,lab,R,world){const r=makeRig(scene),center=V(0,0,-1.2),plants=[V(-.15,.075,-1.2),V(.15,.075,-1.2)],goal=V(),history=[];let yaw=0,clock=0,age=0,seed=723,action='wander',phase='walk',step=null,next=0,manual=false,knocks=0,reach=0,cool=0,curiosity=.6,boredom=.3,wariness=.05,playfulness=.6;const fall=createFallRig(R,world,r),velocity=V(),disturbance=V(),lastVel=V();let pending=null,transition=null,fallAge=0,recovery=null,item=null,gripStart=null,gripStage=false,dropStage=false,stability=0,tripCooldown=0,stepRoll=[0,0],footHeading=[0,0],weight=[.5,.5],motionAge=0;
const nodes=[r.spine,r.body,r.neck,r.head,...r.arms.flatMap(a=>[a.a,a.b,a.h,...a.digits.flatMap(d=>[d.base,...d.bones])])];const snapshot=(list=nodes)=>list.map(g=>({g,p:g.position.clone(),q:g.quaternion.clone()}));function blendPose(data,t){for(const a of data){a.g.position.lerp(a.p,1-t);a.g.quaternion.slerp(a.q,1-t)}}
function emit(type,data={}){const row={type,clock,action,...data};history.push(row);if(history.length>240)history.shift();event?.(row);}
function random(){seed=nextAction(seed);return seed/4294967296;}
function choose(ctx){if(lab.held&&random()<.40)return random()<.65?'throw item':'drop item';if(!lab.held&&lab.count&&random()<.35)return 'pick up item';if(ctx.noise&&cool<=0){cool=3;wariness=clamp(wariness+.25,0,1);return 'startle';}if(ctx.distance<1.15&&cool<=0){cool=3;wariness=clamp(wariness+.16,0,1);return 'retreat';}const pool=['wander','wander','inspect','stretch','scratch head','head tilt','wave','dance','hands on knees','jump','exercise','wall push-ups','handstand push-ups','knock on glass','look at player','inspect hands','shrug','hands on hips','tiptoe','jog'];return pool[Math.floor(random()*pool.length)];}
function request(a,ctx={},m=true){if(!ACTIONS.includes(a))return false;if(fall.active){if(a==='recover'){beginRecovery();return true}pending={a,ctx,m};return true}if(step&&phase==='walk'){pending={a,ctx,m};return true}transition={data:snapshot(),t:0,span:.46};manual=m;action=a;age=0;step=null;knocks=0;item=null;gripStart=null;gripStage=false;dropStage=false;motionAge=0;phase=moving.has(a)||a==='knock on glass'||a==='wall push-ups'?'walk':'act';if(a==='pick up item'&&!lab.held){item=lab.nearest(center);if(item){const p=V().copy(item.body.translation()),d=p.clone().sub(center);d.y=0;if(d.length()<.02)d.copy(forward(yaw));d.normalize();goal.copy(p).addScaledVector(d,-.47);goal.y=0;phase='walk'}else phase='act'}else if(a==='carry item'&&lab.held){goal.copy(center).addScaledVector(forward(yaw),1.4);phase='walk'}else if(a==='stumble'){disturbance.addScaledVector(right(yaw),.72);goal.copy(center).addScaledVector(forward(yaw),.65);phase='walk'}else if(a==='knock on glass')goal.set(clamp(center.x,-3.6,3.6),0,GLASS-.57);else if(a==='wall push-ups')goal.set(clamp(center.x,-3.8,3.8),0,-7.73);else if(a==='approach player')goal.set(clamp(ctx.point?.x||0,-3.6,3.6),0,GLASS-.7);else if(a==='retreat'||a==='backpedal'||a==='avoid prop')goal.copy(center).addScaledVector(forward(yaw),-1.3);else if(a==='sidestep')goal.copy(center).addScaledVector(right(yaw),1.2);else goal.set((random()-.5)*6.6,0,-6+random()*7.8);goal.x=clamp(goal.x,-4.3,4.3);goal.z=clamp(goal.z,-7.7,2.55);emit('begin');return true;}
// Neutral standing: softly unlocked knees, a planted staggered stance,
// modest lateral loading and opposite torso compensation. Contact actions
// deliberately keep their original pelvis/foot targets.
const relaxedActions=new Set(['inspect','head tilt','look at player','inspect hands','scratch head','wave','shrug','hands on hips']);
function pose(h=.83,relaxed=false){
 const sway=relaxed?.026+.009*Math.sin(clock*.78):0,breath=relaxed?.002*Math.sin(clock*1.72):0;
 r.root.position.set(center.x,h+breath,center.z).addScaledVector(right(yaw),sway);
 r.root.rotation.set(0,yaw,0);
 r.body.rotation.set(relaxed?.016:0,relaxed?.018*Math.sin(clock*.61):0,relaxed?.036:0);
 r.spine.rotation.set(0,0,0);r.neck.rotation.set(0,0,0);r.head.rotation.set(0,0,relaxed?-.018:0);r.root.updateMatrixWorld(true);
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
 const desired=distance<.19&&final!==null?final:Math.atan2(d.x,d.z),back=action==='backpedal'||action==='retreat',side=action==='sidestep',tip=action==='tiptoe',jog=action==='jog';
 const face=back?desired+Math.PI:side?yaw:desired,err=angle(yaw,face);
 if(!step){
  if(distance<.19&&(final===null||Math.abs(angle(yaw,final))<.18)&&velocity.length()<.32){stepRoll=[0,0];return true}
  const sy=yaw+clamp(err,-.44,.44),period=jog?.33:tip?.56:.49,ground=p=>groundProbe(R,world,p);const planned=forward(desired).multiplyScalar(Math.min(jog?1.42:tip?.47:.80,distance/Math.max(.2,period))*clamp(1-Math.abs(err)*.45,.15,1));const prediction=velocity.clone().lerp(planned,.65);const ideals=r.legs.map(l=>targetFoot(center,sy,l.s,prediction,period*.75,ground));const drift=ideals.map((p,i)=>Math.hypot(p.x-plants[i].x,p.z-plants[i].z));const i=drift[next]>.06||drift[next]>=drift[1-next]-.05?next:1-next;next=1-i;const other=plants[1-i],sign=r.legs[i].s;
  const stride=distance<.19?0:Math.min(jog?.49:tip?.24:.34,distance)*clamp(1-Math.abs(err)*.55,.08,1);
  const end=ideals[i].clone();if(distance>.19){const advance=forward(desired);const gap=end.clone().sub(other).dot(advance);if(gap<stride*.65)end.addScaledVector(advance,stride*.65-gap)}
  if(side)end.copy(other).addScaledVector(right(sy),sign*.27+(sign===Math.sign(d.dot(right(sy)))?Math.sign(d.dot(right(sy)))*stride:0));
  // Place the foot under the extrapolated COM when a disturbance arrives.
  end.addScaledVector(disturbance,.24);
  end.x=clamp(end.x,-4.9,4.9);end.z=clamp(end.z,-8.0,2.82);end.y=ground(end);
  const mid=end.clone().add(other).multiplyScalar(.5);mid.y=0;step={i,from:plants[i].clone(),end,fromC:center.clone(),mid,y0:yaw,y1:sy,t:0,dt:period,oldHeading:footHeading[i],hit:false};
 }
 const s=step;s.t+=dt;const u=clamp(s.t/s.dt,0,1),p=stepProfile(u),stance=1-s.i,sign=r.legs[s.i].s;
 yaw=s.y0+angle(s.y0,s.y1)*smooth(u);
 // Transfer load to the support foot before toe-off. The pelvis is an
 // integrated, damped COM proxy; position and velocity survive step boundaries.
 const reference=s.fromC.clone().lerp(s.mid,smooth(u)),support=plants[stance];
 reference.addScaledVector(right(yaw),-sign*.075*(2*p.load-1));
 const desiredV=s.mid.clone().sub(s.fromC).multiplyScalar(6*u*(1-u)/s.dt);
 for(const k of ['x','z']){const [x,v]=spring(center[k],velocity[k],reference[k],desiredV[k]+disturbance[k],dt,48,13,9);center[k]=x;velocity[k]=v}
 center.x=clamp(center.x,-4.7,4.7);center.z=clamp(center.z,-7.9,2.65);disturbance.multiplyScalar(Math.exp(-dt*2.7));
 plants[s.i].copy(s.from).lerp(s.end,p.swing);const obstacle=lab.obstacle(plants[s.i]);const lift=(jog?.18:tip?.07:.115)+(obstacle?.radius||0)*.7;
 plants[s.i].y=s.from.y+(s.end.y-s.from.y)*p.swing+lift*p.lift;footHeading[s.i]=s.oldHeading+angle(s.oldHeading,s.y1+sign*.07)*p.swing;
 stepRoll[stance]=tip?.43:.39*smooth((u-.60)/.4);
 stepRoll[s.i]=tip?.34:.37*(1-smooth(u/.25))-.17*smooth((u-.67)/.19)*(1-smooth((u-.86)/.14));
 weight[stance]=p.load;weight[s.i]=1-p.load;
 const cap=center.clone().add(V(captureOffset(velocity.x),0,captureOffset(velocity.z)));
 const supportCenter=support.clone();supportCenter.y=0;stability=cap.distanceTo(supportCenter);
 // Swing-foot collision is inferred from the actual live rigid-body position.
 if(obstacle&&!s.hit&&u>.20&&u<.78&&plants[s.i].y-.075<obstacle.radius*1.65){
  s.hit=true;disturbance.addScaledVector(forward(yaw),.78);disturbance.addScaledVector(right(yaw),sign*.25);obstacle.body.applyImpulse(forward(yaw).multiplyScalar(.24),true);emit('trip',{kind:obstacle.kind});tripCooldown=.65;
 }
 if(stability>.76&&disturbance.length()>.55&&tripCooldown>0){startFall(velocity.clone().add(disturbance));return false}
 let h=tip?.925:jog?.87:.882;const spread=Math.hypot(plants[0].x-plants[1].x,plants[0].z-plants[1].z);h-=clamp((spread-.27)*.13,0,.06)+.015*Math.sin(Math.PI*u)**2;
 for(let i=0;i<2;i++){const hip=center.clone().addScaledVector(right(yaw),r.legs[i].s*.137),f=plants[i],dx=hip.x-f.x,dz=hip.z-f.z;h=Math.min(h,f.y+(stepRoll[i]>0?.085*Math.sin(stepRoll[i]):0)+Math.sqrt(Math.max(.12,.835**2-dx*dx-dz*dz)))}
 pose(h);const acceleration=velocity.clone().sub(lastVel).multiplyScalar(1/Math.max(dt,.001));lastVel.copy(velocity);
 const localA=acceleration.dot(forward(yaw)),localSide=acceleration.dot(right(yaw));
 r.body.rotation.set(clamp(.035+localA*.014,-.10,.17),-sign*.085*Math.sin(Math.PI*u),clamp(-localSide*.018+sign*.035*(2*p.load-1),-.12,.12));
 r.spine.rotation.y=sign*.055*Math.sin(Math.PI*u);r.neck.rotation.y=-r.body.rotation.y*.55;
 for(let i=0;i<2;i++){const a=r.arms[i],stride=(i===s.i?1:-1),swing=stride*(jog?.48:tip?.16:.30)*Math.cos(Math.PI*p.swing);neutralArm(a,clock,swing,jog?1:.4);if(lab.held&&i===1)armIK(r,i,r.body.localToWorld(V(.30,.30,.27)))}
 r.head.rotation.y=.09*Math.sin(clock*.9);if(u>=1){plants[s.i].copy(s.end);step=null;stepRoll[s.i]=0}
 return false;
}
function act(dt,ctx){const t=age,span=durations[action],f=smooth(t/.35)*smooth((span-t)/.35),w=Math.sin(t*3),rep=(1-Math.cos(t*3))/2;const relaxed=relaxedActions.has(action);for(const p of plants)p.y=groundProbe(R,world,p);velocity.multiplyScalar(Math.exp(-dt*8));center.x+=(velocity.x+disturbance.x)*dt;center.z+=(velocity.z+disturbance.z)*dt;disturbance.multiplyScalar(Math.exp(-dt*2.7));pose(relaxed?.895:.83,relaxed);const world=(x,y,z)=>r.body.localToWorld(V(x,y,z));const hand=(i,x,y,z)=>armIK(r,i,world(x,y,z));const both=(y,z,x=.28)=>{for(let i=0;i<2;i++)hand(i,r.arms[i].s*x,y,z);};const flex=(v)=>r.arms.forEach(a=>curl(a,v,.04));
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
 if(fall.active)return;lab.release(false);transition=null;step=null;fallAge=0;fall.start(v,V(v.x*5,0,v.z*5));emit('fall');phase='fallen';
}
function beginRecovery(){
 if(!fall.active)return;fall.stop();const data=snapshot([r.root,...nodes,...r.legs.flatMap(l=>[l.thigh,l.shin,l.foot,l.toe])]);
 center.set(clamp(r.root.position.x,-4.4,4.4),0,clamp(r.root.position.z,-7.6,2.4));velocity.set(0,0,0);disturbance.set(0,0,0);stepRoll=[0,0];stand(true);footHeading=[yaw,yaw];action='recover';phase='act';age=0;recovery={data,t:0};emit('recover');
}
function perturb(strength=.85){
 if(fall.active){beginRecovery();return}const d=right(yaw).multiplyScalar(strength);disturbance.add(d);tripCooldown=1.2;
 if(strength>1.65){startFall(velocity.clone().add(d));return}
 if(phase!=='walk'){request('stumble',{},false)}emit('balance disturbance',{strength});
}
function update(dt,ctx={}){
 clock+=dt;cool=Math.max(0,cool-dt);tripCooldown=Math.max(0,tripCooldown-dt);wariness=Math.max(0,wariness-dt*.025);boredom=clamp(boredom+dt*.018,0,1);curiosity=clamp(curiosity+dt*.008,0,1);
 if(fall.active){fall.sync();fallAge+=dt;if(fallAge>3.2&&fall.speed<.28||fallAge>7)beginRecovery();return}
 if(ctx.noise&&cool<=0&&!recovery){cool=3;wariness=clamp(wariness+.2,0,1);request('startle',ctx,false)}
 age+=dt;motionAge+=dt;
 if(phase==='walk'){
  const finished=walk(dt);if(fall.active)return;
  if(!step&&pending){const q=pending;pending=null;request(q.a,q.ctx,q.m)}
  else if(finished||age>45){step=null;stepRoll=[0,0];if(['knock on glass','wall push-ups','dance','pick up item'].includes(action)){phase='act';age=0;transition={data:snapshot(),t:0,span:.45}}else{emit('end');request(manual?'inspect':choose(ctx),ctx,manual)}}
 }else{
  act(dt,ctx);
  if(age>=durations[action]){recovery=null;emit('end');const p=pending;pending=null;request(p?.a||(manual?'inspect':choose(ctx)),p?.ctx||ctx,p?.m??manual)}
 }
 if(transition){transition.t+=dt;blendPose(transition.data,smooth(transition.t/transition.span));if(transition.t>=transition.span)transition=null}
 if(recovery){recovery.t+=dt;blendPose(recovery.data,smooth(recovery.t/1.9));if(recovery.t>=1.9)recovery=null}
 if(lab.held){if(!['throw item','drop item','pick up item'].includes(action)){r.root.updateMatrixWorld(true);armIK(r,1,r.body.localToWorld(V(.30,.34,.27)));curl(r.arms[1],.77,.015)}lab.follow(r.arms[1].h,dt)}
}
function reset(){if(fall.active)fall.stop();lab.clear();pending=null;transition=null;recovery=null;velocity.set(0,0,0);disturbance.set(0,0,0);lastVel.set(0,0,0);stepRoll=[0,0];footHeading=[0,0];step=null;phase='act';center.set(0,0,-1.2);yaw=clock=0;seed=723;next=0;reach=0;history.length=0;stand(true);request('inspect',{},false);pose(.895,true);}
reset();return {r,update,request,reset,perturb,history,get action(){return action+' / '+phase},get stats(){return {curiosity,boredom,wariness,playfulness,reach,events:history.length,weight:weight.map(x=>+x.toFixed(2)),captureDistance:+stability.toFixed(3),speed:+velocity.length().toFixed(2),fallBodies:fall.count,items:lab.count,holding:lab.held?.kind||null}},setAuto(ctx){request('wander',ctx,false);}};}
