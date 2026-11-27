// Node dependency-free numerical checks for the W1.9 neutral pose.
import assert from 'node:assert/strict';
import {THIGH,SHIN,triangle} from './math.js';
function rotY(x,y,z,a){return [x*Math.cos(a)+z*Math.sin(a),y,z*Math.cos(a)-x*Math.sin(a)]}
for(const s of [-1,1]){
 const thumb=rotY(s*.052,-.030,.016,-s*1.39);
 const palm=rotY(0,0,1,-s*1.39);
 assert(thumb[2]>0,'thumb should point forward');
 assert(palm[0]*s<-.9,'palm should point inward');
}
let min=180,max=0,count=0;
for(let k=0;k<1200;k++){
 const t=k/120,sway=.026+.009*Math.sin(t*.78),h=.895+.002*Math.sin(t*1.72);
 for(const s of [-1,1]){
  const d=Math.hypot(h-.075,sway+s*.137-s*.135,s*.045);
  assert(d<THIGH+SHIN,'leg target reachable');
  const a=180-Math.acos((THIGH**2+SHIN**2-d*d)/(2*THIGH*SHIN))*180/Math.PI;
  assert(a>0&&a<35,'standing knee should be unlocked, not crouched');
  min=Math.min(a,min);max=Math.max(a,max);count++;
 }
}
console.log(JSON.stringify({test:'neutral geometry',samples:count,kneeFlexionDegrees:[min,max],palmsInward:true,thumbsForward:true,renderVerified:false}));
