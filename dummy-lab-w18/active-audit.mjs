import assert from 'node:assert/strict';
import * as T from 'three';
import R from '@dimforge/rapier3d-compat';
import {makeRig,legIK,neutralArm} from './rig.js';
import {createActiveRig} from './active.js';
import {V} from './geometry.js';
// Canvas stubs apply to labels/textures only; rigid bodies, colliders, joints,
// impulses and contact manifolds use the real pinned Rapier WASM library.
const context={fillRect(){},fillText(){},beginPath(){},moveTo(){},arc(){},fill(){},createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}};
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
await R.init();
const world=new R.World({x:0,y:-9.81,z:0});world.timestep=1/120;
const floor=world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0,-.15,0));
world.createCollider(R.ColliderDesc.cuboid(10,.15,10).setFriction(.9),floor);
const scene=new T.Scene(),rig=makeRig(scene),active=createActiveRig(R,world,rig);
function reference(x=0,z=0,phase=0,walking=false){
 rig.root.position.set(x,.875,z);rig.root.rotation.set(0,0,0);rig.pelvis.position.set(0,0,0);rig.pelvis.rotation.set(0,0,0);
 rig.spine.position.set(0,.17,0);rig.spine.rotation.set(0,0,0);rig.thorax.position.set(0,.17,0);rig.thorax.rotation.set(0,0,0);rig.body.position.set(0,-.34,0);rig.body.rotation.set(0,0,0);rig.neck.position.set(0,.66,0);rig.neck.rotation.set(0,0,0);rig.atlas.rotation.set(0,0,0);rig.head.position.set(0,.005,0);rig.head.rotation.set(0,0,0);
 for(let i=0;i<2;i++){const a=rig.arms[i],l=rig.legs[i];a.a.position.set(a.s*.075,0,0);a.b.position.set(0,-.30,0);a.h.position.set(0,-.13,0);neutralArm(a,phase,walking?.22*Math.sin(phase+i*Math.PI):0);const p=phase+i*Math.PI,ank=V(x+l.s*.137,.075+(walking?Math.max(0,Math.sin(p))*.085:0),z+(walking?Math.cos(p)*.16:0));legIK(rig,i,ank,0)}
 rig.root.updateMatrixWorld(true,true);
}
reference();active.start(V());assert.equal(active.stats.bodies,19);assert.equal(active.stats.joints,18);
let peakSupport=0,peakAnchor=0,standingTicks=0,walkingTicks=0,maxAssist=0,peakMotor=0,fallTicks=0;
function record(){const a=active.stats;assert(a.com.every(Number.isFinite));assert(Number.isFinite(a.anchorError));assert(a.groundN.every(Number.isFinite));peakSupport=Math.max(peakSupport,a.groundN.reduce((x,y)=>x+y,0));peakAnchor=Math.max(peakAnchor,a.anchorError);maxAssist=Math.max(maxAssist,a.assistN);peakMotor=Math.max(peakMotor,a.motorNm);}
for(let i=0;i<480;i++){world.step();if(active.mode==='active'){reference();active.drive(1/120,V());standingTicks++}else fallTicks++;active.sync();record()}
for(let i=0;i<720;i++){world.step();if(active.mode==='active'){reference(0,i/120*.42,i/120*6,true);active.drive(1/120,V(0,0,.42));walkingTicks++}else fallTicks++;active.sync();record()}
if(active.mode==='active'){active.nudge(1.9,V(1,0,0));for(let i=0;i<240;i++){world.step();if(active.mode==='active'){reference(0,2.52);active.drive(1/120,V())}active.sync();record()}}
const result={standingTicks,walkingTicks,fallTicks,peakSupport,peakAnchor,maxAssist,peakMotor,finalMode:active.mode,standingAcceptance:standingTicks===480,walkingAcceptance:walkingTicks===720};
console.log('ACTIVE_RIG_RESULT '+JSON.stringify(result));assert(peakSupport>20,'No meaningful measured ground contact');assert(peakAnchor<.30,'Joint anchors separated excessively');assert(peakMotor>0,'No motor impulse applied');active.stop();assert.equal(active.stats.bodies,0);world.free();
// Do not mark stability as passed if it falls before the prescribed interval.
assert(result.standingAcceptance&&result.walkingAcceptance,'Experimental controller did not sustain the standing/walking acceptance interval');
