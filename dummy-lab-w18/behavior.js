import * as T from 'three';import {V,Q,UP} from './geometry.js';import {ACTIONS,GLASS,angle,clamp,smooth,nextAction} from './math.js';import {makeRig,legIK,armIK,curl,contact,neutralArm} from './rig.js?v=1.9';
const forward=y=>V(Math.sin(y),0,Math.cos(y)),right=y=>V(Math.cos(y),0,-Math.sin(y)),durations={'wander':5,'jog':3,'backpedal':2.2,'sidestep':2.5,'tiptoe':3,'inspect':3,'stretch':3,'scratch head':3.5,'shrug':2,'wave':3,'inspect hands':3,'hands on hips':3,'dance':5,'crouch':3,'look at player':3,'approach player':4,'retreat':3,'startle':1,'brace':1.5,'duck':1.5,'avoid prop':2,'knock on glass':4,'head tilt':3,'hands on knees':4.5,'jump':2.2,'exercise':8,'wall push-ups':8,'handstand push-ups':10};
const moving=new Set(['wander','jog','backpedal','sidestep','tiptoe','dance','approach player','retreat','avoid prop']);
export function createDummy(scene,event){const r=makeRig(scene),center=V(0,0,-1.2),plants=[V(-.15,.075,-1.2),V(.15,.075,-1.2)],goal=V(),history=[];let yaw=0,clock=0,age=0,seed=723,action='wander',phase='walk',step=null,next=0,manual=false,knocks=0,reach=0,cool=0,curiosity=.6,boredom=.3,wariness=.05,playfulness=.6;
function emit(type,data={}){const row={type,clock,action,...data};history.push(row);if(history.length>240)history.shift();event?.(row);}
function random(){seed=nextAction(seed);return seed/4294967296;}
function choose(ctx){if(ctx.noise&&cool<=0){cool=3;wariness=clamp(wariness+.25,0,1);return 'startle';}if(ctx.distance<1.15&&cool<=0){cool=3;wariness=clamp(wariness+.16,0,1);return 'retreat';}const pool=['wander','wander','inspect','stretch','scratch head','head tilt','wave','dance','hands on knees','jump','exercise','wall push-ups','handstand push-ups','knock on glass','look at player','inspect hands','shrug','hands on hips','tiptoe','jog'];return pool[Math.floor(random()*pool.length)];}
function request(a,ctx={},m=true){if(!ACTIONS.includes(a))return false;manual=m;action=a;age=0;step=null;knocks=0;phase=moving.has(a)||a==='knock on glass'||a==='wall push-ups'?'walk':'act';if(a==='knock on glass')goal.set(clamp(center.x,-3.6,3.6),0,GLASS-.57);else if(a==='wall push-ups')goal.set(clamp(center.x,-3.8,3.8),0,-7.73);else if(a==='approach player')goal.set(clamp(ctx.point?.x||0,-3.6,3.6),0,GLASS-.7);else if(a==='retreat'||a==='backpedal'||a==='avoid prop')goal.copy(center).addScaledVector(forward(yaw),-1.3);else if(a==='sidestep')goal.copy(center).addScaledVector(right(yaw),1.2);else goal.set((random()-.5)*6.6,0,-6+random()*7.8);goal.x=clamp(goal.x,-4.3,4.3);goal.z=clamp(goal.z,-7.7,2.55);emit('begin');return true;}
// Neutral standing: softly unlocked knees, a planted staggered stance,
// modest lateral loading and opposite torso compensation. Contact actions
// deliberately keep their original pelvis/foot targets.
const relaxedActions=new Set(['inspect','head tilt','look at player','inspect hands','scratch head','wave','shrug','hands on hips']);
function pose(h=.83,relaxed=false){
 const sway=relaxed?.026+.009*Math.sin(clock*.78):0,breath=relaxed?.002*Math.sin(clock*1.72):0;
 r.root.position.set(center.x,h+breath,center.z).addScaledVector(right(yaw),sway);
 r.root.rotation.set(0,yaw,0);
 r.body.rotation.set(relaxed?.016:0,relaxed?.018*Math.sin(clock*.61):0,relaxed?.036:0);
 r.head.rotation.set(0,0,relaxed?-.018:0);r.root.updateMatrixWorld(true);
 for(let i=0;i<2;i++){
  const s=r.legs[i].s,heading=yaw+s*(relaxed?.085:0);
  reach=Math.max(reach,legIK(r,i,plants[i],heading));
  neutralArm(r.arms[i],clock);
 }
}
function stand(relaxed=false){for(let i=0;i<2;i++){
 const s=r.legs[i].s;
 plants[i].copy(center).addScaledVector(right(yaw),s*(relaxed?.135:.15));
 if(relaxed)plants[i].addScaledVector(forward(yaw),s*.045);
 plants[i].y=.075;
}}
function walk(dt){const d=goal.clone().sub(center),distance=d.length(),final=action==='knock on glass'?0:action==='wall push-ups'?Math.PI:null,desired=distance<.18&&final!==null?final:Math.atan2(d.x,d.z);const backward=action==='backpedal'||action==='retreat',sideways=action==='sidestep';let facing=backward?desired+Math.PI:sideways?yaw:desired,err=angle(yaw,facing);if(!step){if(distance<.18&&(final===null||Math.abs(angle(yaw,final))<.15)){stand();return true;}const i=next;next=1-next;const sy=yaw+clamp(err,-.56,.56),sign=r.legs[i].s,other=plants[1-i],speed=action==='jog'?.48:action==='tiptoe'?.22:.36;const stride=distance<.18?0:Math.min(speed,distance)*clamp(1-Math.abs(err)*.45,.08,1);let end=other.clone().addScaledVector(right(sy),sign*.30).addScaledVector(forward(desired),stride);if(sideways){end=other.clone().addScaledVector(right(sy),sign*.30+(sign===Math.sign(d.dot(right(sy)))?Math.sign(d.dot(right(sy)))*stride:0));}end.y=.075;const mid=end.clone().add(other).multiplyScalar(.5);mid.y=0;step={i,from:plants[i].clone(),end,fromC:center.clone(),mid,y0:yaw,y1:sy,t:0,dt:action==='jog'?.30:.48};}const s=step;s.t+=dt;const u=clamp(s.t/s.dt,0,1);center.copy(s.fromC).lerp(s.mid,u);yaw=s.y0+angle(s.y0,s.y1)*smooth(u);plants[s.i].copy(s.from).lerp(s.end,smooth(u));plants[s.i].y=.075+.11*Math.sin(Math.PI*u);let h=.875;for(let i=0;i<2;i++){const hip=center.clone().addScaledVector(right(yaw),r.legs[i].s*.137),p=plants[i],dx=hip.x-p.x,dz=hip.z-p.z;h=Math.min(h,p.y+Math.sqrt(Math.max(.1,.826**2-dx*dx-dz*dz)));}pose(h);for(let i=0;i<2;i++)neutralArm(r.arms[i],clock,(i===s.i?-1:1)*.30*Math.cos(Math.PI*u),action==='jog'?1:.45);r.head.rotation.y=.15*Math.sin(clock*1.4);if(action==='tiptoe')r.legs[s.i].foot.rotation.x=.16*Math.sin(Math.PI*u);if(u>=1)step=null;return false;}
function act(dt,ctx){const t=age,span=durations[action],f=smooth(t/.35)*smooth((span-t)/.35),w=Math.sin(t*3),rep=(1-Math.cos(t*3))/2;const relaxed=relaxedActions.has(action);stand(relaxed);pose(relaxed?.895:.83,relaxed);const world=(x,y,z)=>r.body.localToWorld(V(x,y,z));const hand=(i,x,y,z)=>armIK(r,i,world(x,y,z));const both=(y,z,x=.28)=>{for(let i=0;i<2;i++)hand(i,r.arms[i].s*x,y,z);};const flex=(v)=>r.arms.forEach(a=>curl(a,v,.04));
switch(action){
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
function update(dt,ctx={}){clock+=dt;cool=Math.max(0,cool-dt);wariness=Math.max(0,wariness-dt*.025);boredom=clamp(boredom+dt*.018,0,1);curiosity=clamp(curiosity+dt*.008,0,1);if(ctx.noise&&cool<=0){cool=3;wariness=clamp(wariness+.2,0,1);request('startle',ctx,false);}age+=dt;if(phase==='walk'){if(walk(dt)||age>45){if(action==='knock on glass'||action==='wall push-ups'){yaw=action==='knock on glass'?0:Math.PI;phase='act';age=0;}else if(action==='dance'){phase='act';age=0;}else{emit('end');request(manual?'inspect':choose(ctx),ctx,manual);}}}else{act(dt,ctx);if(age>=durations[action]){emit('end');request(manual?'inspect':choose(ctx),ctx,manual);}}}
function reset(){center.set(0,0,-1.2);yaw=clock=0;seed=723;next=0;reach=0;history.length=0;stand(true);request('inspect',{},false);pose(.895,true);}
reset();return {r,update,request,reset,history,get action(){return action+' / '+phase},get stats(){return {curiosity,boredom,wariness,playfulness,reach,events:history.length}},setAuto(ctx){request('wander',ctx,false);}};}
