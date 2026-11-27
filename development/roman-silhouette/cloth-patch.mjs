// XPBD test module on official helper surfaces. Point contact only; no self-collision or full garment construction.
export function createClothPatch({positions,indices,anchors=[],density=.23,stretchCompliance=3e-7,bendCompliance=8e-5,clearance=.003,collider}){
 // Experimental XPBD reference-surface cloth. Fixed pose collider. No self collision, friction or CCD.
 const rest=new Float64Array(positions),x=rest.slice(),prev=x.slice(),N=x.length/3,invMass=new Float64Array(N),mass=new Float64Array(N),pins=new Map(),edgeMap=new Map(),bendKeys=new Set(),constraints=[];
 if(!Number.isInteger(N)||!rest.every(Number.isFinite)||!(density>0)||!indices.every(i=>Number.isInteger(i)&&i>=0&&i<N)||indices.length%3)throw Error("Invalid cloth patch");
 const diff=(a,b,src=rest)=>[src[3*a]-src[3*b],src[3*a+1]-src[3*b+1],src[3*a+2]-src[3*b+2]],length=(a,b)=>Math.hypot(...diff(a,b)),key=(a,b)=>Math.min(a,b)+":"+Math.max(a,b);
 for(let i=0;i<indices.length;i+=3){const a=indices[i],b=indices[i+1],c=indices[i+2],u=diff(b,a),v=diff(c,a),area=.5*Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);for(const j of [a,b,c])mass[j]+=density*area/3;
 for(const [m,n,o] of [[a,b,c],[b,c,a],[c,a,b]]){const k=key(m,n);if(!edgeMap.has(k))edgeMap.set(k,{a:m,b:n,opposite:[]});edgeMap.get(k).opposite.push(o);}}
 for(let i=0;i<N;i++)invMass[i]=1/Math.max(mass[i],1e-6);
 for(const i of anchors){if(!Number.isInteger(i)||i<0||i>=N)throw Error("Invalid anchor");pins.set(i,Array.from(rest.slice(i*3,i*3+3)));invMass[i]=0;}
 for(const e of edgeMap.values()){constraints.push({a:e.a,b:e.b,rest:length(e.a,e.b),compliance:stretchCompliance,lambda:0,type:"stretch"});if(e.opposite.length===2){let [a,b]=e.opposite,k=key(a,b);if(!edgeMap.has(k)&&!bendKeys.has(k)&&a!==b){bendKeys.add(k);constraints.push({a,b,rest:length(a,b),compliance:bendCompliance,lambda:0,type:"bend"});}}}
 function pinAll(){for(const [i,p] of pins){x.set(p,i*3);prev.set(p,i*3);}}
 function projectAll(){let collisions=0,failed=0;for(let i=0;i<N;i++){if(!invMass[i])continue;let p=Array.from(x.slice(i*3,i*3+3));let q=collider.query(p);if(q.distance>=clearance-1e-7)continue;const r=collider.project(p,clearance);if(r.moved){x.set(r.point,i*3); // remove inward velocity after contact
  const d=r.point.map((a,k)=>a-p[k]),l=Math.hypot(...d);if(l>1e-10){const normal=d.map(a=>a/l),v=r.point.map((a,k)=>a-prev[i*3+k]),vn=v.reduce((a,b,k)=>a+b*normal[k],0);if(vn<0)for(let k=0;k<3;k++)prev[i*3+k]=r.point[k]-v[k]+vn*normal[k];}
  collisions++;}if(!r.converged)failed++;}
 return{collisions,failed};}
 function constrain(c,dt){const a=c.a,b=c.b,wa=invMass[a],wb=invMass[b],d=diff(a,b,x),len=Math.hypot(...d);if(len<1e-12||wa+wb===0)return;const alpha=c.compliance/(dt*dt),dl=(-(len-c.rest)-alpha*c.lambda)/(wa+wb+alpha);c.lambda+=dl;for(let k=0;k<3;k++){const g=d[k]/len;x[3*a+k]+=wa*dl*g;x[3*b+k]-=wb*dl*g;}}
 function step({dt=1/120,iterations=5,gravity=[0,-9.81,0],air=[0,0,0],damping=.985}={}){if(!(dt>0&&dt<=1/30)||!Number.isInteger(iterations)||iterations<1||iterations>20||!gravity.every(Number.isFinite)||!air.every(Number.isFinite))throw Error("Invalid cloth timestep");for(let i=0;i<N;i++){if(!invMass[i])continue;for(let k=0;k<3;k++){let j=3*i+k,q=x[j],v=Math.max(-.03,Math.min(.03,(q-prev[j])*damping));x[j]=q+v+(gravity[k]+air[k])*dt*dt;prev[j]=q;}}for(const c of constraints)c.lambda=0;
 let contacts=0,failures=0;for(let j=0;j<iterations;j++){for(const c of constraints)constrain(c,dt);pinAll();if(j===iterations-1||j%3===2){let r=projectAll();contacts+=r.collisions;failures+=r.failed;}}pinAll();if(!x.every(Number.isFinite))throw Error("Nonfinite cloth state");return{contacts,failures};}
 function reset(){x.set(rest);prev.set(rest);for(const c of constraints)c.lambda=0;}
 function stats(){let maxStretch=0,mean=0,count=0,anchorError=0;for(const c of constraints)if(c.type==="stretch"&&c.rest>1e-8){const e=Math.abs(Math.hypot(...diff(c.a,c.b,x))/c.rest-1);maxStretch=Math.max(maxStretch,e);mean+=e;count++;}for(const [i,p] of pins)anchorError=Math.max(anchorError,Math.hypot(...p.map((v,k)=>v-x[i*3+k])));return{vertices:N,anchors:pins.size,stretchConstraints:count,bendConstraints:bendKeys.size,maxRelativeStretch:maxStretch,meanRelativeStretch:mean/Math.max(1,count),anchorError,finite:x.every(Number.isFinite)};}
 return{positions:x,rest,step,reset,stats,projectAll};
}
