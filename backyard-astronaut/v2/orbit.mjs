// SI units in a miniature fictional system. Planet-centered translating frame.
export const R=1200, MU=7200000, MOON_R=95, MOON_D=6500, MOON_MU=180000, ATM=120;
export const add=(a,b)=>a.map((x,i)=>x+b[i]), sub=(a,b)=>a.map((x,i)=>x-b[i]), mul=(a,k)=>a.map(x=>x*k), dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0), norm=a=>Math.hypot(...a), unit=a=>mul(a,1/(norm(a)||1)), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const moon=t=>{let a=.65+t*Math.sqrt((MU+MOON_MU)/MOON_D**3);return [MOON_D*Math.sin(a),MOON_D*.12*Math.sin(a),MOON_D*Math.cos(a)]};
export function gravity(p,t,lunar=true){const d=norm(p),a=mul(p,-MU/Math.max(1,d)**3);if(!lunar)return a;const m=moon(t),r=sub(m,p);return add(a,sub(mul(r,MOON_MU/Math.max(1,norm(r))**3),mul(m,MOON_MU/norm(m)**3)))}
export const altitude=p=>norm(p)-R;
export function elements(p,v){let r=norm(p),h=cross(p,v),energy=dot(v,v)/2-MU/r,e=norm(sub(mul(cross(v,h),1/MU),unit(p))),a=-MU/(2*energy);return {energy,e,peri:dot(h,h)/MU/(1+e)-R,apo:energy>=0?Infinity:a*(1+e)-R,incl:Math.acos(Math.max(-1,Math.min(1,h[2]/(norm(h)||1))))*180/Math.PI}}
export function mass(parts,fuel){return parts.reduce((s,p)=>s+p.mass,0)+fuel}
export function deltaV(parts,fuel){let dry=mass(parts,0);return dry?300*Math.log((dry+fuel)/dry):0}
export function acceleration(p,v,t,force,m,area,lunar=true){let a=add(gravity(p,t,lunar),mul(force,1/Math.max(1,m)));let alt=altitude(p);if(alt<ATM&&area){let rho=.16*Math.exp(-Math.max(0,alt)/25)*(1-Math.max(0,alt)/ATM);a=add(a,mul(v,-.5*rho*area*norm(v)/Math.max(1,m)))}return a}
export function step(s,dt,force=[0,0,0],m=1,area=0,lunar=true){const A=(p,v,t)=>acceleration(p,v,t,force,m,area,lunar),p=s.p,v=s.v,t=s.t;const a=A(p,v,t),p2=add(p,mul(v,dt/2)),v2=add(v,mul(a,dt/2)),b=A(p2,v2,t+dt/2),p3=add(p,mul(v2,dt/2)),v3=add(v,mul(b,dt/2)),c=A(p3,v3,t+dt/2),p4=add(p,mul(v3,dt)),v4=add(v,mul(c,dt)),d=A(p4,v4,t+dt);const weighted=(a,b,c,d)=>a.map((x,i)=>(x+2*b[i]+2*c[i]+d[i])*dt/6);return {p:add(p,weighted(v,v2,v3,v4)),v:add(v,weighted(a,b,c,d)),t:t+dt}}
export function coast(s,seconds=600,dt=1){let q={p:[...s.p],v:[...s.v],t:s.t},points=[q.p];for(let i=0;i<seconds/dt;i++){q=step(q,dt,[0,0,0],1,0);if(i%3===0)points.push(q.p);if(altitude(q.p)<0||norm(sub(q.p,moon(q.t)))<MOON_R)break}return points}
