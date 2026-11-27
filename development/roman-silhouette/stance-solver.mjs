// Candidate standing poses. Analytical leg IK, full-weight skinning, floor alignment. Not clinical biomechanics.
export function createStanceSolver(adapter,rig){
 const bones=rig.bones, ids=adapter.nameToIndex, B=n=>bones[ids.get(n)], add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,s)=>a.map(x=>x*s),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length=a=>Math.hypot(...a),unit=a=>{const l=length(a);if(l<1e-10)throw Error("Zero vector");return mul(a,1/l)},inv=q=>[-q[0],-q[1],-q[2],q[3]],qmul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]],rot=(q,v)=>{const t=mul(cross(q.slice(0,3),v),2);return add(add(v,mul(t,q[3])),cross(q.slice(0,3),t))};
 function align(a,b){a=unit(a);b=unit(b);let d=Math.max(-1,Math.min(1,dot(a,b)));if(d<-0.999999){let v=Math.abs(a[0])<.9?[1,0,0]:[0,1,0];return adapter.axisAngle(unit(cross(a,v)),Math.PI)}const q=[...cross(a,b),1+d],l=length(q);return q.map(x=>x/l)}
 const presets={neutral:{halfWidth:.115,shift:0,tilt:0,lower:.009},wide:{halfWidth:.23,shift:0,tilt:0,lower:.025},shift:{halfWidth:.15,shift:.065,tilt:-.045,lower:.038}};
 function solve(preset){
  const cfg=presets[preset];if(!cfg)throw Error("Unknown stance");
  const r={root:adapter.axisAngle([0,0,1],cfg.tilt),spine03:adapter.axisAngle([0,0,1],-cfg.tilt*.65),spine01:adapter.axisAngle([0,0,1],-cfg.tilt*.35)};
  const translation=[cfg.shift,-cfg.lower,0],diagnostics={}; 
  for(const side of ["L","R"]){
   const sign=side==="L"?1:-1,hip="upperleg01."+side,knee="lowerleg01."+side,foot="foot."+side;
   // Analytic two-link IK uses the actual hip, knee and ankle bind landmarks.
   let pose=adapter.evaluate(r,translation),H=pose.heads[ids.get(hip)],A=[sign*cfg.halfWidth,B(foot).head[1],B(foot).head[2]];
   const upper=sub(B(knee).head,B(hip).head),lower=sub(B(foot).head,B(knee).head),L1=length(upper),L2=length(lower),D=sub(A,H),d=length(D);
   if(d>L1+L2-1e-6||d<Math.abs(L1-L2)+1e-6)throw Error("Unreachable ankle "+side+" "+d);
   const dir=unit(D),pole=unit(sub([0,0,1],mul(dir,dot(dir,[0,0,1])))),along=(L1*L1-L2*L2+d*d)/(2*d),height=Math.sqrt(Math.max(0,L1*L1-along*along)),K=add(add(H,mul(dir,along)),mul(pole,height));
   const upperQ=align(upper,sub(K,H)),hp=pose.orientations[B(hip).parent];r[hip]=qmul(inv(hp),upperQ);
   pose=adapter.evaluate(r,translation);
   const lowerQ=align(lower,sub(A,K)),kp=pose.orientations[B(knee).parent];r[knee]=qmul(inv(kp),lowerQ);
   pose=adapter.evaluate(r,translation);r[foot]=inv(pose.orientations[B(foot).parent]); 
   // Bring arms toward the side without forcing hands through the torso.
   pose=adapter.evaluate(r,translation);const shoulder="upperarm01."+side,elbow="lowerarm01."+side,wrist="wrist."+side;
   const armQ=align(sub(B(elbow).head,B(shoulder).head),[sign*.20,-1,.015]);r[shoulder]=qmul(inv(pose.orientations[B(shoulder).parent]),armQ);
   pose=adapter.evaluate(r,translation);const foreQ=align(sub(B(wrist).head,B(elbow).head),[sign*.12,-1,.075]);r[elbow]=qmul(inv(pose.orientations[B(elbow).parent]),foreQ);
   diagnostics[side]={target:A,knee:K,hip:H,upperLength:L1,lowerLength:L2};
  }
  let posed=adapter.evaluate(r,translation);let minY=Infinity;for(let i=1;i<posed.positions.length;i+=3)minY=Math.min(minY,posed.positions[i]);translation[1]-=minY;posed=adapter.evaluate(r,translation);
  for(const side of ["L","R"]){const d=diagnostics[side],target=add(d.target,[0,-minY,0]);d.ankleError=length(sub(posed.heads[ids.get("foot."+side)],target));d.footRotation=posed.orientations[ids.get("foot."+side)];}
  return {preset,rotations:r,translation,posed,diagnostics,groundCorrection:-minY};
 }
 return {solve,presets:Object.keys(presets)};
}
