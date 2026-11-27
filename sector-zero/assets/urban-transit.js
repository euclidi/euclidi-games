// Sector Zero: urban fabric and transit. Keep the original simulation's 70-unit node grid.
const D=[[0,1],[1,0],[0,-1],[-1,0]], N=70, edge=210;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const roadRank=v=>v===0||Math.abs(v)===210?0:Math.abs(v)===140?1:2;
const congestion=new Map(),keyOf=(x,z,d)=>x+","+z+","+d;
const SIDE=9,PERSON=.82,STOP=20,CAR_LINE=2.5;
const nearestGrid=v=>clamp(Math.round(v/70)*70,-210,210);
const roadHalf=v=>[6.5,5.75,4.25][roadRank(v)];
const phaseLocks=new Set();
const nodeKey=(x,z)=>x+","+z;
const solids=[];
const walkState=new WeakMap();
let currentWorld=null;
function walking(c){return c.inside<0&&c.ride?.phase!=="riding";}
const coord=[];for(let v=-210;v<=210;v+=70)coord.push(v-SIDE,v+SIDE);
const nearIndex=v=>coord.reduce((best,p,i)=>Math.abs(p-v)<Math.abs(coord[best]-v)?i:best,0);
function crossing(a,b){
 const horizontal=Math.abs(a.z-b.z)<.01;
 if(horizontal&&Math.abs(a.x-b.x)>17.9&&Math.abs(a.x-b.x)<18.1&&nearestGrid(a.x)===nearestGrid(b.x))return{x:nearestGrid(a.x),z:nearestGrid(a.z),axis:0,a,b};
 if(!horizontal&&Math.abs(a.x-b.x)<.01&&Math.abs(a.z-b.z)>17.9&&Math.abs(a.z-b.z)<18.1&&nearestGrid(a.z)===nearestGrid(b.z))return{x:nearestGrid(a.x),z:nearestGrid(a.z),axis:1,a,b};
 return null;
}
function cornerOptions(p){
 const x=clamp(p.x,-219,219),z=clamp(p.z,-219,219);
 const gx=nearestGrid(x),gz=nearestGrid(z);
 // Select the sidewalk on the same side of the road, never cross a road to reach one.
 const sx=gx+(x<gx?-SIDE:SIDE),sz=gz+(z<gz?-SIDE:SIDE);
 const vertical=Math.abs(x-sx)<=Math.abs(z-sz);
 const fixed=vertical?sx:sz,axis=vertical?z:x;
 let lo=0;while(lo+1<coord.length&&coord[lo+1]<=axis)lo++;
 let hi=Math.min(coord.length-1,lo+1);
 if(nearestGrid(coord[lo])===nearestGrid(coord[hi])){
  lo=hi=axis<(coord[lo]+coord[hi])/2?lo:hi;
 }
 const ix=nearIndex(fixed);
 return [...new Set([lo,hi])].map(i=>{
  const projected=vertical?{x:fixed,z:clamp(axis,coord[lo],coord[hi])}:{x:clamp(axis,coord[lo],coord[hi]),z:fixed};
  const corner=vertical?{x:fixed,z:coord[i],ix,iz:i}:{x:coord[i],z:fixed,ix:i,iz:ix};
  return {projected,corner,cost:dist(p,projected)+dist(projected,corner)};
 });
}
const trees=new Map();
function tree(goal){
 const target=goal.iz*14+goal.ix;if(trees.has(target))return trees.get(target);
 const n=196,cost=Array(n).fill(Infinity),next=Array(n).fill(-1),used=new Uint8Array(n);cost[target]=0;
 for(let j=0;j<n;j++){let v=-1;for(let i=0;i<n;i++)if(!used[i]&&(v<0||cost[i]<cost[v]))v=i;if(v<0)break;used[v]=1;const x=v%14,z=Math.floor(v/14);
 for(const [dx,dz] of D){const a=x+dx,b=z+dz;if(a<0||a>13||b<0||b>13)continue;const k=b*14+a,step=Math.abs(coord[x]-coord[a])+Math.abs(coord[z]-coord[b]);const c=cost[v]+step+(step===18?9:0);if(c<cost[k]){cost[k]=c;next[k]=v;}}}
 const result={cost,next};trees.set(target,result);return result;
}
function pedestrianPath(from,to){
 let best=null;
 for(const a of cornerOptions(from))for(const b of cornerOptions(to)){const t=tree(b.corner),start=a.corner.iz*14+a.corner.ix,cost=a.cost+b.cost+t.cost[start];if(!best||cost<best.cost)best={a,b,t,start,cost};}
 const {a,b,t,start}=best,route=[a.projected,a.corner];let k=start;
 for(let j=0;j<196&&t.next[k]>=0;j++){k=t.next[k];route.push({x:coord[k%14],z:coord[Math.floor(k/14)]});}
 route.push(b.projected,{x:to.x,z:to.z});
 const out=[];let prev={x:from.x,z:from.z};
 for(const p of route){if(dist(prev,p)<.001)continue;const cross=crossing(prev,p);out.push({x:p.x,z:p.z,...(cross?{cross}: {})});prev=p;}
 return out;
}
function carRect(b,progress=b.progress){
 const d=D[b.dir],x=b.x+d[0]*progress+d[1]*CAR_LINE,z=b.z+d[1]*progress-d[0]*CAR_LINE;
 return {x,z,hx:d[0]?(b.bus?4.4:2.35):1.3,hz:d[1]?(b.bus?4.4:2.35):1.3};
}
function intersects(p,r,pad=PERSON/2){return Math.abs(p.x-r.x)<r.hx+pad&&Math.abs(p.z-r.z)<r.hz+pad;}
function crossClear(w,cross){
 const a=cross.a,b=cross.b,x=(a.x+b.x)/2,z=(a.z+b.z)/2,hx=Math.abs(a.x-b.x)/2+.55,hz=Math.abs(a.z-b.z)/2+.55;
 return !w.cars.some(v=>{const r=carRect(v);return Math.abs(r.x-x)<r.hx+hx&&Math.abs(r.z-z)<r.hz+hz;});
}
function avoidCar(b,w,dt){
 if(b.speed<=0)return;
 const d=D[b.dir],tx=b.x+d[0]*70,tz=b.z+d[1]*70;
 // Stop before the marked crossing, not at the middle of the intersection.
 const stop=70-SIDE-(b.bus?4.4:2.35)-1.2;
 const locked=phaseLocks.has(nodeKey(tx,tz));
 if((locked||signal(tx,tz,w.time+dt,b.dir)!==b.dir%2)&&b.progress<=stop+.02)b.speed=Math.min(b.speed,Math.max(0,(stop-b.progress)/dt));
 // A vehicle already past the stop line may clear the crosswalk, but cannot enter a locked junction.
 if(locked&&b.progress>stop+.02&&b.progress<70)b.speed=Math.min(b.speed,Math.max(0,(70-b.progress-.1)/dt));
 if(phaseLocks.has(nodeKey(b.x,b.z))&&b.progress<SIDE+5)b.speed=0;
 // Hold short of any pedestrian physically in the lane, including player-controlled citizens.
 const next=carRect(b,b.progress+b.speed*dt),now=carRect(b);
 const sweep={x:(now.x+next.x)/2,z:(now.z+next.z)/2,hx:now.hx+Math.abs(now.x-next.x)/2,hz:now.hz+Math.abs(now.z-next.z)/2};
 for(const c of w.citizens){if(!walking(c)||!intersects(c,sweep,.55))continue;
 const along=(c.x-now.x)*d[0]+(c.z-now.z)*d[1],half=b.bus?4.4:2.35;
 if(along>=-half)b.speed=Math.min(b.speed,Math.max(0,(along-half-.65)/dt));
 }
}
const cellKey=(x,z)=>Math.floor(x/2)+","+Math.floor(z/2);
function occupancy(w){
 const bins=new Map(),pos=new Map();
 function add(c){const k=cellKey(c.x,c.z);if(!bins.has(k))bins.set(k,new Set());bins.get(k).add(c);pos.set(c,k);}
 function remove(c){const k=pos.get(c);if(k!==undefined){bins.get(k)?.delete(c);pos.delete(c);}}
 function free(c,x,z){const ix=Math.floor(x/2),iz=Math.floor(z/2);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(const p of bins.get((ix+i)+","+(iz+j))||[])if(p!==c&&Math.hypot(p.x-x,p.z-z)<PERSON)return false;return true;}
 for(const c of w.citizens)if(walking(c)&&!walkState.get(c)?.departing)add(c);
 return{add,remove,free};
}
function offRoad(x,z){return Math.abs(x-nearestGrid(x))>=roadHalf(nearestGrid(x))+.42&&Math.abs(z-nearestGrid(z))>=roadHalf(nearestGrid(z))+.42;}
function inSolid(x,z){return solids.some(o=>Math.abs(x-o.x)<o.w/2+.25&&Math.abs(z-o.z)<o.l/2+.25);}
function destination(w,c){return c.ride?.phase==="approach"?(c.ride.queue||lines[c.ride.line].stops[c.ride.from]):w.buildings[c.goal]?.door;}
function moveCrowd(w,dt,api){
 const occ=occupancy(w),cars=w.cars.map(b=>carRect(b)),list=w.citizens.filter(c=>c.id!==w.possessed&&c.ride?.phase!=="waiting"&&c.ride?.phase!=="riding");
 // Crossing pedestrians have priority; otherwise rotate order so one ID never monopolizes a doorway.
 const n=w.citizens.length||1,shift=Math.floor(w.time*4)%n;
 list.sort((a,b)=>Number(!!walkState.get(b)?.cross)-Number(!!walkState.get(a)?.cross)||((a.id+n-shift)%n)-((b.id+n-shift)%n));
 for(const c of list){
  const st=walkState.get(c)||{};walkState.set(c,st);
  const target=destination(w,c);if(!target)continue;
  if(c.inside===c.goal&&!c.ride&&!c.route.length){st.cross=null;continue;}
  if(!c.route.length&&!st.cross&&c.inside>=0&&!st.departing)continue;
  if(st.departing||c.inside>=0){if(!occ.free(c,c.x,c.z)){c.inside=st.origin>=0?st.origin:c.inside;continue;}c.inside=-1;st.departing=false;occ.add(c);}
  const key=target.x+","+target.z;
  if(st.ref!==c.route||st.key!==key||!c.route.length){
   if(st.cross){const end=st.cross.b;c.route=[{x:end.x,z:end.z,cross:st.cross},...pedestrianPath(end,target)];}
   else c.route=pedestrianPath(c,target);
   st.ref=c.route;st.key=key;
  }
  let budget=Math.min(1.25,c.speed*dt),loops=0;c.walkStatus="";
  while(budget>.001&&c.route.length&&loops++<8){
   const p=c.route[0],dx=p.x-c.x,dz=p.z-c.z,len=Math.hypot(dx,dz);
   if(len<.025){c.route.shift();if(st.cross&&Math.hypot(c.x-st.cross.b.x,c.z-st.cross.b.z)<.05)st.cross=null;continue;}
   if(p.cross&&!st.cross){
    if(signal(p.cross.x,p.cross.z,w.time,0)===p.cross.axis||!crossClear(w,p.cross)){c.walkStatus="WAITING FOR CROSSWALK";break;}
    st.cross=p.cross;phaseLocks.add(nodeKey(p.cross.x,p.cross.z));
   }
   const step=Math.min(.32,budget,len),ux=dx/len,uz=dz/len;
   const can=(x,z)=>occ.free(c,x,z)&&!cars.some(r=>intersects({x,z},r,.45))&&(!inSolid(x,z)||Math.hypot(x-target.x,z-target.z)<1);
   let x=c.x+ux*step,z=c.z+uz*step;
   if(!can(x,z)){
    let found=false;
    if(st.cross||offRoad(c.x,c.z))for(const side of [1,-1]){const xx=c.x+uz*step*side+ux*step*.2,zz=c.z-ux*step*side+uz*step*.2;
     const permitted=st.cross?(st.cross.axis===0?Math.abs(zz-st.cross.a.z)<=.88:Math.abs(xx-st.cross.a.x)<=.88):offRoad(xx,zz);
     if(permitted&&can(xx,zz)&&Math.hypot(xx-p.x,zz-p.z)<len+1.0){x=xx;z=zz;found=true;break;}}
    if(!found){c.walkStatus="YIELDING";break;}
   }
   occ.remove(c);c.heading=Math.atan2(x-c.x,z-c.z);c.x=x;c.z=z;occ.add(c);budget-=step;
   if(Math.hypot(p.x-c.x,p.z-c.z)<.03){c.route.shift();if(st.cross&&Math.hypot(c.x-st.cross.b.x,c.z-st.cross.b.z)<.05)st.cross=null;}
  }
  if(!c.route.length&&!c.ride&&Math.hypot(c.x-target.x,c.z-target.z)<.1){occ.remove(c);c.inside=c.goal;st.cross=null;}
 }
}
function queueSlot(w,c,p){
 const d=D[p.dir],occupied=w.citizens.filter(q=>q!==c&&walking(q));
 for(let i=0;i<32;i++){const along=(i%16)*.94-5,side=Math.floor(i/16)*.96;
 const q={x:p.x+d[0]*along+d[1]*side,z:p.z+d[1]*along-d[0]*side};
 if(offRoad(q.x,q.z)&&!inSolid(q.x,q.z)&&!occupied.some(o=>Math.hypot(o.x-q.x,o.z-q.z)<PERSON||o.ride?.queue&&Math.hypot(o.ride.queue.x-q.x,o.ride.queue.z-q.z)<PERSON))return q;}
 return null;
}

const linkCost=(x,z,dir)=>[.62,.94,1.55][roadRank(dir%2===0?x:z)];
const roadSpeed=(x,z,dir)=>[14,11,7.5][roadRank(dir%2===0?x:z)];
const nodeIndex=(x,z)=>(z+210)/70*7+(x+210)/70;
const potentials=new Map();
function distances(dx,dz){
 const key=dx+","+dz;if(potentials.has(key))return potentials.get(key);
 const cost=Array(49).fill(Infinity),done=new Set();cost[nodeIndex(dx,dz)]=0;
 for(let step=0;step<49;step++){let n=-1;for(let j=0;j<49;j++)if(!done.has(j)&&(n<0||cost[j]<cost[n]))n=j;if(n<0||!Number.isFinite(cost[n]))break;done.add(n);let x=n%7*70-210,z=Math.floor(n/7)*70-210;
 for(let d=0;d<4;d++){const a=x+D[d][0]*70,b=z+D[d][1]*70;if(Math.abs(a)>210||Math.abs(b)>210)continue;const j=nodeIndex(a,b);cost[j]=Math.min(cost[j],cost[n]+linkCost(a,b,d));}}
 potentials.set(key,cost);return cost;
}
export function carScore(x,z,dir,dx,dz,prev){const a=x+D[dir][0]*70,b=z+D[dir][1]*70;return distances(dx,dz)[nodeIndex(a,b)]+linkCost(x,z,dir)+(dir===(prev+2)%4?1.5:dir===prev?0:.17)+(congestion.get(keyOf(x,z,dir))||0)*.14;}

const direction=(a,b)=>D.findIndex(d=>a.x+d[0]*N===b.x&&a.z+d[1]*N===b.z);
function rectangle(x0,z0,x1,z1,reverse=false){
 const p=[];for(let x=x0;x<x1;x+=N)p.push({x,z:z0});
 for(let z=z0;z<z1;z+=N)p.push({x:x1,z});
 for(let x=x1;x>x0;x-=N)p.push({x,z:z1});
 for(let z=z1;z>z0;z-=N)p.push({x:x0,z});
 return reverse?p.reverse():p;
}
export const lines=[
 {name:"A / NORTH",color:0xc6a04f,nodes:rectangle(-210,-210,210,0)},
 {name:"B / SOUTH",color:0x8ab9a1,nodes:rectangle(-210,0,210,210,true)},
 {name:"C / WEST",color:0xb68d9e,nodes:rectangle(-210,-140,0,140)},
 {name:"D / EAST",color:0x86a9c7,nodes:rectangle(0,-140,210,140,true)},
 {name:"E / CENTRAL EXPRESS",color:0xd49d66,nodes:rectangle(-70,-210,0,210),express:true},
 {name:"F / CROSSTOWN EXPRESS",color:0xb4b0d9,nodes:rectangle(-210,0,210,70,true),express:true}
];
for(const l of lines){
 l.stops=l.nodes.map((p,i)=>{const d=D[direction(p,l.nodes[(i+1)%l.nodes.length])];return{x:p.x+d[0]*STOP+d[1]*SIDE,z:p.z+d[1]*STOP-d[0]*SIDE,dir:direction(p,l.nodes[(i+1)%l.nodes.length]),active:!l.express||i%2===0||p.x===0&&p.z===0}});
 l.speed=l.express?14:11;
}
const capacity=b=>b.line>=4?40:28;
const served=l=>l.stops.filter(p=>p.active).length;
const travel=(l,a,b)=>{let count=(b-a+l.nodes.length)%l.nodes.length,n=0;for(let k=1;k<=count;k++)if(l.stops[(a+k)%l.nodes.length].active)n++;return count*70/l.speed+n*1.8;};
const transfers=lines.map((l,i)=>lines.map((m,j)=>i===j?[]:l.stops.flatMap((p,a)=>p.active?m.stops.flatMap((q,b)=>q.active&&dist(p,q)<=39?[{a,b,d:dist(p,q)}]:[]):[])));
const variants={
 Housing:["Tenement","Row residences","Apartment tower","Workers' hostel","Courtyard flats","Brutalist terrace","Micro flats","Duplex courts","Stacked maisonettes"],
 Market:["Covered market","Grocery","Fuel station","Canteen","Trading arcade","Night bazaar","Corner shops","Department store"],
 Factory:["Machine works","Processing plant","Power works","Assembly hall","Foundry","Fabrication yard"],
 Warehouse:["Freight depot","Cold store","Distribution centre"],
 Authority:["Municipal hall","Police station","Records office"],
 Clinic:["Hospital","Community clinic","Dispensary"]
};
export function prepare(w){
 if(w.transit?.revision===3&&w.architectureRevision===3)return w;
 // Use a rolling subtype counter per functional category, with a deterministic offset.
 const count={};
 for(const b of w.buildings){const v=variants[b.type]||[b.type];const i=count[b.type]||0;b.architecture=v[i%v.length];count[b.type]=i+1;}
 w.architectureRevision=3;
 if(w.transit?.revision===3)return w;
 const prev=w.transit||{};
 w.transit={revision:3,boardings:prev.boardings||0,completed:prev.completed||0,abandoned:prev.abandoned||0,vehicleKm:prev.vehicleKm||0,rerouted:prev.rerouted||0,transfers:0};
 for(const c of w.citizens){if(c.ride)c.transitMigration=true;delete c.ride;delete c.transitGoal;}
 const fleet=Math.min(18,w.cars.length);
 for(let k=0;k<fleet;k++){
 const b=w.cars[w.cars.length-fleet+k],line=k%lines.length,l=lines[line],i=Math.floor(Math.floor(k/lines.length)*l.nodes.length/3),p=l.nodes[i],j=(i+1)%l.nodes.length;
 Object.assign(b,{bus:true,line,nextStop:j,x:p.x,z:p.z,dir:direction(p,l.nodes[j]),progress:16,destX:l.nodes[j].x,destZ:l.nodes[j].z,speed:l.speed,wait:0,dwell:0,atStop:-1,passengers:[],trips:0});
 }
 return w;
}
export function nextNode(b){const l=lines[b.line];return l.nodes[(b.nextStop+1)%l.nodes.length]}
export function arrive(b){b.atStop=b.nextStop;b.nextStop=(b.nextStop+1)%lines[b.line].nodes.length;b.pendingStop=lines[b.line].stops[b.atStop].active;b.dwell=0;b.progress=0;}
export function gap(a,b){return a?.bus||b?.bus?10.5:5.8}
export function signal(x,z,time,dir){
 if(phaseLocks.has(nodeKey(x,z)))return -1;
 const arterialX=x===0||Math.abs(x)===210,arterialZ=z===0||Math.abs(z)===210;
 const cycle=((time+(x/70+z/70+6)*.85)%8+8)%8;
 const green=arterialX&&!arterialZ?5:arterialZ&&!arterialX?3:4;
 return cycle<green?0:1;
}
function legacyWalkTo(c,p){
 const gx=clamp(Math.round((c.x+210)/70),0,6)*70-210;
 const gz=clamp(Math.round((c.z+210)/70),0,6)*70-210;
 const px=clamp(Math.round((p.x+210)/70),0,6)*70-210;
 const pz=clamp(Math.round((p.z+210)/70),0,6)*70-210;
 const a=[{x:c.x,z:gz+7},{x:gx+7,z:gz+7},{x:gx+7,z:pz+7},{x:px+7,z:pz+7},{x:p.x,z:p.z}];
 return a.filter((v,i)=>i===0||dist(v,a[i-1])>.01);
}
function walkTo(c,p){return pedestrianPath(c,p);}
function itinerary(c,b){
 const end=b.door,direct=dist(c,end);if(direct<110)return null;
 const speed=Math.max(3,c.speed),near=(l,p)=>l.stops.map((q,i)=>({i,d:dist(p,q),active:q.active})).filter(q=>q.active&&q.d<110).sort((a,b)=>a.d-b.d).slice(0,2);
 const starts=lines.map(l=>near(l,c)),ends=lines.map(l=>near(l,end));
 let best=null,score=direct/speed-2;
 const wait=l=>l.nodes.length*70/l.speed/6+served(l)*.3;
 const consider=(cost,legs)=>{if(cost<score){score=cost;best={...legs[0],legs,leg:0,goal:c.goal,phase:"approach",since:0};}};
 for(let i=0;i<lines.length;i++)for(const a of starts[i])for(let j=0;j<lines.length;j++)for(const z of ends[j]){
 const l=lines[i],m=lines[j],walking=(a.d+z.d)/speed;
 if(i===j){if(a.i!==z.i)consider(walking+wait(l)+travel(l,a.i,z.i),[{line:i,from:a.i,to:z.i}]);continue;}
 for(const t of transfers[i][j]){if(a.i===t.a||t.b===z.i)continue;
 const cost=walking+wait(l)+travel(l,a.i,t.a)+t.d/speed+wait(m)+travel(m,t.b,z.i)+2;
 consider(cost,[{line:i,from:a.i,to:t.a},{line:j,from:t.b,to:z.i}]);}
 }
 return best;
}
function resume(w,c,api){const r=c.ride;delete c.ride;c.transitGoal=c.goal;
 if(!w.buildings[c.goal]){c.goal=c.home;c.activity="Resting"}
 c.inside=-1;c.route=api.path(c,w.buildings[c.goal]);if(r?.phase==="riding"&&c.activity==="On bus")c.activity=r.activity;
}
export function before(w,dt,api){
 prepare(w);
 currentWorld=w;phaseLocks.clear();
 for(const c of w.citizens){const st=walkState.get(c)||{};walkState.set(c,st);if(st.cross&&walking(c))phaseLocks.add(nodeKey(st.cross.x,st.cross.z));}
 for(const c of w.citizens)if(c.transitMigration){delete c.transitMigration;if(c.id!==w.possessed)resume(w,c,api);}
 congestion.clear();
 for(const b of w.cars){const key=keyOf(b.x,b.z,b.dir);congestion.set(key,(congestion.get(key)||0)+1);if(!b.bus)b.speed=roadSpeed(b.x,b.z,b.dir)*(w.rain?.77:1)*(.86+(b.id%5)*.07);}
 for(const b of w.cars)if(b.bus){b.dwell=Math.max(0,b.dwell-dt);b.speed=b.dwell>0?0:Math.min(lines[b.line].speed,roadSpeed(b.x,b.z,b.dir)+2)*(w.rain?.82:1);
 b.passengers=b.passengers.filter(id=>{const c=w.citizens[id];if(!c||id===w.possessed||c.ride?.bus!==b.id){if(c?.ride?.bus===b.id)delete c.ride;return false}return true;});}
 for(const b of w.cars){if(b.bus&&b.pendingStop)b.speed=Math.min(b.speed,Math.max(0,(STOP-b.progress)/dt));avoidCar(b,w,dt);}
 // Original simulation remains responsible for intent, economy and needs, not motion.
 for(const c of w.citizens){if(c.id===w.possessed)continue;const st=walkState.get(c);st.speed=c.speed;st.origin=c.inside;c.speed=0;if(c.ride?.phase==="waiting"||c.ride?.phase==="riding")c.route=[{x:c.x,z:c.z}];}
}
export function after(w,dt,api){
 const buses=w.cars.filter(b=>b.bus);
 for(const b of buses)if(b.pendingStop&&b.progress>=STOP-.025){b.pendingStop=false;b.dwell=1.8;}
 for(const c of w.citizens){const st=walkState.get(c);if(st&&st.speed!==undefined){c.speed=st.speed;delete st.speed;if(st.origin>=0&&c.inside<0)st.departing=true;}if(c.id===w.possessed&&st)st.cross=null;}
 for(const c of w.citizens){
 if(c.id===w.possessed){delete c.ride;continue}
 let r=c.ride;
 if(r&&r.goal!==c.goal){if(r.phase==="riding"){r.goal=c.goal;r.cancel=true}else{delete c.ride;r=null;}}
 if(!r&&c.inside<0&&c.route.length&&c.transitGoal!==c.goal){
 c.transitGoal=c.goal;
 if(c.id%4!==0&&w.buildings[c.goal]){r=itinerary(c,w.buildings[c.goal]);if(r){r.since=w.time;r.activity=c.activity;const p=lines[r.line].stops[r.from];r.queue=queueSlot(w,c,p);if(r.queue){c.ride=r;c.route=walkTo(c,r.queue);}else r=null;}}
 }
 if(!r)continue;
 if(r.phase==="approach"){const p=r.queue||lines[r.line].stops[r.from];if(Math.hypot(c.x-p.x,c.z-p.z)<.13){r.phase="waiting";r.since=w.time;c.route=[];}else if(!c.route.length||dist(c.route[c.route.length-1],p)>.1)c.route=walkTo(c,p);}
 if(r.phase==="waiting"){c.inside=-1;c.route=[];c.walkStatus="WAITING FOR BUS";if(w.time-r.since>110){w.transit.abandoned++;resume(w,c,api);}}
 if(r.phase==="riding"){const b=buses.find(x=>x.id===r.bus);if(!b){resume(w,c,api);continue}const p=api.carPosition(b);c.x=p.x;c.z=p.z;c.heading=p.a;c.inside=-1;c.route=[];}
 }
 for(const b of buses){
 w.transit.vehicleKm+=b.speed*dt/1000;
 if(b.dwell<=0||b.atStop<0)continue;
 const p=lines[b.line].stops[b.atStop];
 for(const id of [...b.passengers]){const c=w.citizens[id],r=c?.ride;if(!r||r.bus!==b.id){b.passengers=b.passengers.filter(x=>x!==id);continue;}
 if(r.to===b.atStop||r.cancel){const exit=queueSlot(w,c,p);if(!exit){b.dwell=Math.max(b.dwell,.5);continue;}b.passengers=b.passengers.filter(x=>x!==id);c.x=exit.x;c.z=exit.z;if(!r.cancel&&r.legs&&r.leg+1<r.legs.length){
 Object.assign(r,r.legs[++r.leg],{phase:"approach",since:w.time,bus:null,queue:null});r.queue=queueSlot(w,c,lines[r.line].stops[r.from]);if(r.queue){c.route=walkTo(c,r.queue);w.transit.transfers++;}else resume(w,c,api);
 }else{if(r.cancel)w.transit.rerouted=(w.transit.rerouted||0)+1;else w.transit.completed++;resume(w,c,api);}}}
 for(const c of w.citizens.filter(c=>c.ride?.phase==="waiting"&&c.ride.line===b.line&&c.ride.from===b.atStop).sort((a,b)=>a.ride.since-b.ride.since)){if(b.passengers.length>=capacity(b))break;const r=c.ride;
 if(r?.phase==="waiting"&&r.line===b.line&&r.from===b.atStop&&c.id!==w.possessed){
 r.phase="riding";r.bus=b.id;r.queue=null;b.passengers.push(c.id);c.route=[];w.transit.boardings++;api.note(w,c,"Boarded bus "+lines[b.line].name);}}
 }
 moveCrowd(w,dt,api);
}
export function networkMap(){
 // Schematic based on the actual graph. Each shared route has its own colored track.
 let html='<div style="position:relative;aspect-ratio:1;max-width:285px;margin:12px auto;background:#0d1412;border:1px solid #394c43" aria-label="Six bus routes across the seven by seven street network">';
 const p=(v)=>8+(v+210)/420*84;
 for(let j=0;j<7;j++){const v=8+j*14;html+='<i style="position:absolute;left:'+v+'%;top:8%;height:84%;width:1px;background:#415048"></i><i style="position:absolute;top:'+v+'%;left:8%;width:84%;height:1px;background:#415048"></i>';}
 for(let li=0;li<lines.length;li++){const l=lines[li],color="#"+l.color.toString(16).padStart(6,"0"),off=(li-2.5)*.78;
 for(let i=0;i<l.nodes.length;i++){const a=l.nodes[i],b=l.nodes[(i+1)%l.nodes.length],horizontal=a.z===b.z;
 const left=Math.min(p(a.x),p(b.x))+(horizontal?0:off),top=Math.min(p(a.z),p(b.z))+(horizontal?off:0);
 html+='<i style="position:absolute;left:'+left+'%;top:'+top+'%;width:'+(horizontal?14:0.7)+'%;height:'+(horizontal?0.7:14)+'%;background:'+color+'"></i>';
 if(l.stops[i].active)html+='<i style="position:absolute;width:4px;height:4px;background:'+color+';left:calc('+(p(a.x)+off)+'% - 2px);top:calc('+(p(a.z)+off)+'% - 2px)"></i>';
 }}
 return html+'</div>';
}
export function panel(w){
 const s=w.transit,buses=w.cars.filter(b=>b.bus),waiting=w.citizens.filter(c=>c.ride?.phase==="waiting").length;
 let html='<h2>TRANSIT CONTROL</h2><div class="stat"><span>CROSSWALK WAIT</span><b>'+w.citizens.filter(c=>c.walkStatus==="WAITING FOR CROSSWALK").length+'</b></div><div class="stat"><span>PEDESTRIAN YIELD</span><b>'+w.citizens.filter(c=>c.walkStatus==="YIELDING").length+'</b></div><div class="stat"><span>ACTIVE BUSES</span><b>'+buses.length+'</b></div><div class="stat"><span>WAITING</span><b>'+waiting+'</b></div><div class="stat"><span>ON BOARD</span><b>'+buses.reduce((n,b)=>n+b.passengers.length,0)+'</b></div><div class="stat"><span>BOARDINGS</span><b>'+s.boardings+'</b></div><div class="stat"><span>COMPLETED RIDES</span><b>'+s.completed+'</b></div><div class="stat"><span>WAIT TIMEOUTS</span><b>'+s.abandoned+'</b></div><div class="stat"><span>INTERRUPTED RIDES</span><b>'+(s.rerouted||0)+'</b></div><div class="stat"><span>TRANSFERS</span><b>'+(s.transfers||0)+'</b></div><h3>ROUTE NETWORK</h3>'+networkMap();
 for(let i=0;i<lines.length;i++){const l=lines[i],v=buses.filter(b=>b.line===i);html+='<h3 style="color:#'+l.color.toString(16)+'">'+l.name+'</h3><div class="stat"><span>STOPS / BUSES</span><b>'+served(l)+' / '+v.length+'</b></div><div class="stat"><span>PASSENGERS</span><b>'+v.reduce((n,b)=>n+b.passengers.length,0)+' / '+v.reduce((n,b)=>n+capacity(b),0)+'</b></div>'+v.map(b=>'<button data-bus="'+b.id+'">BUS '+b.id+' · '+b.passengers.length+'/'+capacity(b)+' · '+(b.dwell>0?'STOP':'RUN')+'</button>').join('')}
 return html+'<p>Local loops and limited-stop express services support one transfer. Riders compare estimated trip time with walking and queue in arrival order. Select a bus to locate it.</p>';
}
export function citizen(c){const r=c.ride;return r?'<div class="stat"><span>TRANSIT</span><b>'+r.phase.toUpperCase()+' / '+lines[r.line].name+'</b></div>':c.walkStatus?'<div class="stat"><span>MOVEMENT</span><b>'+c.walkStatus+'</b></div>':'';}
const signalGroups=new Map();
export function updateSignals(time){for(const s of signalGroups.values()){const p=signal(s.x,s.z,time,0);s.phases[0].visible=p===0;s.phases[1].visible=p===1;s.phases[2].visible=p===-1;}}
export function drawRoads(parent,{box,cyl,merge,mat,group}){
 const asphalt=mat(0x373c3b),local=mat(0x454744),edgeMat=mat(0x76786c),white=mat(0xb9b7a2),yellow=mat(0xc6a662),dark=mat(0x28322f),glass=mat(0x576b65),steel=mat(0x68756d),green=mat(0x75946f),red=mat(0xa74c3d);
 const kind=v=>v===0?"avenue":Math.abs(v)===210?"ring":Math.abs(v)===140?"collector":"local";
 const width=v=>kind(v)==="avenue"?13:kind(v)==="ring"?13:kind(v)==="collector"?11.5:8.5;
 for(let v=-210;v<=210;v+=70){const w=width(v),major=kind(v)!=="local";
 for(let p=-175;p<=175;p+=70){box(parent,w,.03,57,v,.005,p,major?asphalt:local);box(parent,57,.03,w,p,.006,v,major?asphalt:local);
 for(const side of [-1,1]){box(parent,.13,.025,56,v+side*(w/2-.25),.032,p,edgeMat);box(parent,56,.025,.13,p,.032,v+side*(w/2-.25),edgeMat);}
 for(let j=-22;j<=22;j+=8){box(parent,.15,.02,3.8,v,.04,p+j,major?yellow:white);box(parent,3.8,.02,.15,p+j,.04,v,major?yellow:white);}
 if(kind(v)==="avenue"||kind(v)==="ring"){for(let j=-20;j<=20;j+=10){box(parent,.22,.025,5,v-.35,.041,p+j,yellow);box(parent,5,.025,.22,p+j,.041,v-.35,yellow);}}
 if(kind(v)==="local"){for(const side of [-1,1])for(let j=-18;j<=18;j+=12){box(parent,.09,.025,5.2,v+side*3.8,.043,p+j,white);box(parent,5.2,.025,.09,p+j,.043,v+side*3.8,white);}}
 if(major){for(const side of [-1,1]){box(parent,.12,.025,42,v+side*4.4,.036,p,white);box(parent,42,.025,.12,p,.036,v+side*4.4,white);}}
 }
 for(let z=-210;z<=210;z+=70){box(parent,13,.03,13,v,.006,z,asphalt);
 for(const s of [-1,1]){for(let k=-roadHalf(v)+.5;k<roadHalf(v);k+=1.2)box(parent,.58,.026,2,v+k,.043,z+s*SIDE,white);for(let k=-roadHalf(z)+.5;k<roadHalf(z);k+=1.2)box(parent,2,.026,.58,v+s*SIDE,.043,z+k,white);}
 const ax=v===0||Math.abs(v)===210,az=z===0||Math.abs(z)===210,key=nodeKey(v,z);
 let sig=signalGroups.get(key);if(!sig){sig={x:v,z,phases:[group(),group(),group()]};signalGroups.set(key,sig);parent.add(...sig.phases);}
 for(const approach of [0,1]){const sx=v+(approach===0?7:-7),sz=z+(approach===0?7:-7);cyl(parent,.11,.14,4.4,sx,2.2,sz,steel);box(parent,approach===0?.55:.42,1.35,approach===0?.42:.55,sx,4.25,sz,dark);
 for(let phase=0;phase<3;phase++){const go=phase===approach,g=sig.phases[phase];
 for(const side of [-1,1]){const xx=sx+(approach===1?side*.23:0),zz=sz+(approach===0?side*.23:0);
 box(g,approach===0?.28:.08,.28,approach===0?.08:.28,xx,go?4:4.6,zz,go?green:red);}}}

 }}
 const seen=new Set();
 for(let li=0;li<lines.length;li++){const l=lines[li],color=mat(l.color);for(const p of l.stops){const d=D[p.dir],key=p.x+","+p.z;
 if(!p.active||seen.has(key))continue;seen.add(key);
 // Shelter is on the sidewalk; it never intrudes into the traffic lane.
 const x=p.x+d[1]*1.4,z=p.z-d[0]*1.4,h=d[0]!==0;
 box(parent,h?6:2.1,.12,h?2.1:6,x,.12,z,dark);
 box(parent,h?6:2.1,.2,h?2.1:6,x,2.75,z,steel);
 for(const a of [-2.6,2.6]){box(parent,.13,2.6,.13,x+d[0]*a+d[1]*.75,1.4,z+d[1]*a-d[0]*.75,steel);}
 box(parent,h?5.2:.12,1.65,h?.12:5.2,x+d[1]*.85,1.65,z-d[0]*.85,glass);
 box(parent,h?3.7:.4,.16,h?.4:3.7,x,.65,z,dark);
 cyl(parent,.08,.1,3.2,p.x+d[0]*3,1.65,p.z+d[1]*3,steel);
 box(parent,h?.22:.8,.55,h?.8:.22,p.x+d[0]*3,3.05,p.z+d[1]*3,color);
 // Paint the stop zone along the curb rather than over the moving lane.
 box(parent,h?10:.25,.027,h?.25:10,p.x-d[1]*1.6,.048,p.z+d[0]*1.6,color);
 }}
 merge(parent);for(const s of signalGroups.values())for(const phase of s.phases)merge(phase);updateSignals(420);
}
export function build(b,parent,{group,box,cyl,merge,sign,materials,colliders,registry}){
 const [facades,roof,steel,walk,dark,white,trim,glass,rust,black,door]=materials;
 const base=group(),shell=group(),inside=group();parent.add(base,shell,inside);
 const {x,z,w,l,h}=b, a=b.architecture;
 const f=facades[(b.i*3+b.j*5+b.k+b.id)%facades.length];
 const masonry=b.id%3===0?rust:b.id%3===1?f:steel;
 const walls=[];
 const solid=(ww,hh,ll,xx=x,zz=z,y=0,m=f)=>{box(shell,ww,hh,ll,xx,y+hh/2+.5,zz,m);colliders.push({x:xx,z:zz,w:ww,l:ll,h:y+hh+.5});if(y===0)solids.push({x:xx,z:zz,w:ww,l:ll});walls.push({x:xx,z:zz,w:ww,l:ll,bottom:y+.5,top:y+hh+.5});};
 // Recess the frame into the actual wall face and keep the glass inside its perimeter.
 const frontWindow=(ww,hh,xx,yy,front)=>{
  box(shell,ww+.18,hh+.18,.16,xx,yy,front-.025,steel);
  box(shell,ww,hh,.055,xx,yy,front-.115,glass);
 };
 const sideWindow=(ww,hh,zz,yy,face,side)=>{
  box(shell,.16,hh+.18,ww+.18,face+side*.025,yy,zz,steel);
  box(shell,.055,hh,ww,face+side*.115,yy,zz,glass);
 };
 const wallDoor=(xx,front,ww=2.6)=>{box(shell,ww+.22,3.6,.2,xx,2.3,front-.035,steel);box(shell,ww,3.35,.08,xx,2.3,front-.15,door);};
 const slab=(ww,ll,yy,xx=x,zz=z,m=roof)=>box(shell,ww,.38,ll,xx,yy,zz,m);
 const bands=(ww,ll,low,high,xx=x,zz=z)=>{for(let y=low;y<high;y+=4){for(const s of [-1,1]){box(shell,ww+.15,.15,.22,xx,y,zz+s*ll/2,steel);box(shell,.22,.15,ll+.15,xx+s*ww/2,y,zz,steel);}}};
 const hvac=(xx,zz,y)=>{box(shell,3,1.3,3,xx,y+.7,zz,steel);box(shell,3.3,.2,3.3,xx,y+1.45,zz,dark)};
 const chimney=(xx,zz,y,height)=>{cyl(shell,.65,1,height,xx,y+height/2,zz,rust);cyl(shell,.75,.75,.3,xx,y+height,zz,black)};
 box(base,w+.7,.5,l+.7,x,.25,z,walk);
 if(a==="Fuel station"){
 solid(w,5,12,x,z-l/2+6,0,steel);slab(w+1,13,5.6,x,z-l/2+6);
 const zz=z+7;slab(w-1,22,5.6,x,zz,white);
 for(const dx of [-9,9])for(const dz of [-8,8])box(shell,.35,5.1,.35,x+dx,2.8,zz+dz,steel);
 for(const dx of [-5,5]){box(shell,1.2,1.5,2,x+dx,1,zz,trim);box(shell,1.3,.45,2.1,x+dx,1.9,zz,glass);colliders.push({x:x+dx,z:zz,w:1.2,l:2,h:2});}
 }else if(a==="Brutalist terrace"||a==="Stacked maisonettes"||a==="Micro flats"){
 const levels=a==="Micro flats"?5:a==="Brutalist terrace"?3:4,hh=4.1;
 for(let i=0;i<levels;i++){const ww=w-i*(a==="Brutalist terrace"?3:1),ll=l-i*2.3,zz=z+i*.8;
 solid(ww,hh,ll,x,zz,i*hh,i%2?f:masonry);slab(ww+.7,ll+.7,(i+1)*hh+.5,x,zz);
 for(let k=-Math.floor(ww/5);k<=Math.floor(ww/5);k++){const xx=x+k*2.3;if(Math.abs(xx-x)>ww/2-1.3)continue;if(i!==0||Math.abs(xx-x)>2)frontWindow(1.45,1.7,xx,i*hh+2.8,zz-ll/2);}
 if(a!=="Micro flats")for(const side of [-1,1]){box(shell,ww*.68,.22,1.5,x,(i+1)*hh-.2,zz+side*(ll/2+.65),roof);box(shell,ww*.68,.7,.12,x,(i+1)*hh+.2,zz+side*(ll/2+1.3),steel);}
 }hvac(x,z,levels*hh+.9);
 }else if(a==="Duplex courts"){
 for(const side of [-1,1]){const xx=x+side*6.1,hh=side<0?8.5:10.5;solid(10.5,hh,l-6,xx,z+2,0,masonry);slab(11,l-5.5,hh+.65,xx,z+2);for(let j=0;j<2;j++)for(let k of [-2.8,2.8])frontWindow(1.7,1.6,xx+k,2.8+j*4,z+2-(l-6)/2);wallDoor(xx,z+2-(l-6)/2,1.7);}
 box(base,2.2,.12,l-4,x,.57,z,roof);
 }else if(a==="Night bazaar"||a==="Corner shops"){
 solid(w,5.5,10,x,z+10,0,masonry);slab(w+.5,11,6.2,x,z+10);
 for(let j=-1;j<=1;j++){const xx=x+j*7;box(shell,6.4,.23,11,xx,3.9,z-7,j===0?rust:trim);for(const k of [-2.7,2.7])for(const dz of [-12,-2])box(shell,.15,3.55,.15,xx+k,2.125,z+dz,steel);box(shell,5.1,.95,2.6,xx,1,z-8,roof);for(let k=-2;k<=2;k++)box(shell,.65,.35,.75,xx+k*.9,1.65,z-8,k%2?trim:rust);}
 }else if(a==="Department store"){
 solid(w,6,l,x,z,0,masonry);solid(w-4,7,l-5,x,z,6,steel);slab(w+.4,l+.5,6.7);slab(w-3,l-4,13.65);
 for(let k=-3;k<=3;k++){if(k!==0)frontWindow(2.5,3,x+k*3,2.75,z-l/2);frontWindow(2.1,4.8,x+k*2.6,9.8,z-(l-5)/2); }
 hvac(x,z,14);
 }else if(a==="Apartment tower"||a==="Municipal hall"||a==="Hospital"){
 const low=6,high=Math.max(12,h+(a==="Apartment tower"?8:0));solid(w,low,l);slab(w+1,l+1,low+.6);
 solid(w-7,high-low,l-10,x,z+1,low,f);slab(w-6,l-9,high+.6,x,z+1);bands(w-7,l-10,low+4,high,x,z+1);hvac(x,z,high+1);
 for(let yy=low+2.5;yy+1.15<high+.5;yy+=4){for(let j=-2;j<=2;j++)frontWindow(1.8,1.9,x+j*2.85,yy,z+1-(l-10)/2);for(let side of [-1,1])for(let zz=z+1-(l-10)/2+3;zz<z+1+(l-10)/2-2;zz+=4.7)sideWindow(2.1,1.9,zz,yy,x+side*(w-7)/2,side);}
 for(const dx of [-7,7])frontWindow(3.8,2.3,x+dx,2.8,z-l/2);
 if(a==="Hospital") {box(shell,5,.25,14,x,high+1,z,white);box(shell,14,.26,5,x,high+1,z,white);}
 }else if(a==="Row residences"||a==="Courtyard flats"){
 const height=Math.max(8,h*.65);
 if(a==="Courtyard flats"){
 solid(w,height,12,x,z-l/2+6);slab(w+.6,12.6,height+.6,x,z-l/2+6);
 for(const s of [-1,1]){solid(7,height,l-12,x+s*(w-7)/2,z+6);slab(7.5,l-11.5,height+.6,x+s*(w-7)/2,z+6);}
 box(base,w-15,.13,l-15,x,.56,z+7,roof);for(let dz=-3;dz<13;dz+=8)box(base,3,.6,1.3,x,.8,z+dz,trim);
 }else{
 for(let j=-1;j<=1;j++){const xx=x+j*7.5,hh=height+(j===0?2:0),ll=l-(j===1?3:0);solid(7.15,hh,ll,xx,z+(l-ll)/2);
 const top=box(shell,7.5,1.2,ll+.4,xx,hh+1,z+(l-ll)/2,roof);top.rotation.z=j===0?.12:-.12;
 const front=z+l/2-ll;box(shell,5,.24,2.1,xx,4.05,front-.99,trim);wallDoor(xx,front,2.1);for(let yy=6;yy+1<hh+.5;yy+=4)for(const dx of [-1.7,1.7])frontWindow(1.2,1.6,xx+dx,yy,front);}
 }
 }else if(a==="Covered market"){
 const height=5.5;solid(w,4,8,x,z+l/2-4,0,steel);slab(w+1,l+1,height,x,z,roof);
 for(const dx of [-10,10])for(const dz of [-15,-5,5,15]){box(shell,.38,5.2,.38,x+dx,2.9,z+dz,steel);colliders.push({x:x+dx,z:z+dz,w:.38,l:.38,h:5.2});}
 for(const dx of [-6,6])for(let dz=-12;dz<=8;dz+=6){box(shell,4,1.05,2.5,x+dx,1,z+dz,trim);box(shell,4.2,.12,2.7,x+dx,1.6,z+dz,white);box(shell,4.5,.15,3.4,x+dx,3.4,z+dz,((dz+12)/6)%2?rust:roof);colliders.push({x:x+dx,z:z+dz,w:4,l:2.5,h:1.6});}
 box(shell,w,1,.25,x,4.85,z-l/2-.1,steel);
 }else if(a==="Trading arcade"){
 solid(w,7,l);slab(w+1,l+1,7.6);for(let j=-1;j<=1;j++){const xx=x+j*6;const canopy=box(shell,5.5,.45,l-4,xx,7.87,z,glass);canopy.rotation.z=j*.04;}
 for(let j=-1;j<=1;j++){if(j!==0)frontWindow(6.2,2.3,x+j*7,2.4,z-l/2);box(shell,7,.3,3.6,x+j*7,4.1,z-l/2-1.65,steel);}
 }else if(b.type==="Factory"||b.type==="Warehouse"){
 const height=a==="Freight depot"?7:a==="Power works"?10:Math.max(7,h);
 solid(w,height,l,x,z,0,steel);slab(w+1,l+1,height+.6);
 if(b.type==="Factory"){for(let j=-1;j<=1;j++){const zz=z+j*10;const top=box(shell,w-2,2.5,5,x,height+1.5,zz,roof);top.rotation.x=-.24;}chimney(x+7,z+9,height+.5,a==="Power works"?20:10);if(a==="Processing plant"){chimney(x-7,z+9,height+.5,8);for(const dx of [-6,6]){cyl(shell,3,3,5,x+dx,height+3,z-6,steel,12);cyl(shell,2.95,3,.5,x+dx,height+5.7,z-6,roof,12);}}
 if(a==="Power works"){for(const dx of [-6,0,6]){cyl(shell,1.6,1.8,4,x+dx,height+2.5,z-9,steel);box(shell,4,.5,1,x+dx,height+4.7,z-9,trim);}}
 if(a==="Assembly hall")for(let j=-1;j<=1;j++)box(shell,4,.35,8,x+j*6,height+2.8,z,glass);}
 else for(let dx of [-7,0,7]){box(shell,5,4,.3,x+dx,2.4,z-l/2-.15,dark);for(let y=1;y<4;y+=.6)box(shell,4.7,.08,.35,x+dx,y,z-l/2-.3,steel);}
 if(a==="Cold store"){for(const dx of [-6,0,6]){box(shell,4,2.2,3,x+dx,height+1.6,z-6,steel);for(let j=-1;j<=1;j++)box(shell,.25,.18,2.8,x+dx+j,height+2.8,z-6,dark);}}
 hvac(x-5,z-8,height+1);
 }else{
 const height=b.type==="Market"?Math.max(6,h*.7):h;
 solid(w,height,l,x,z,0,f);slab(w+1,l+1,height+.6);bands(w,l,4,height);hvac(x-5,z+5,height+1);
 if(b.type==="Market"){for(let dx of [-7,0,7]){if(dx!==0)frontWindow(6,1.6,x+dx,2.5,z-l/2);box(shell,6.5,.22,a==="Canteen"?4:2,x+dx,4,z-l/2-1,dx===0?rust:trim);}
 if(a==="Canteen"){for(const dx of [-7,7]){box(base,3,.14,1.7,x+dx,.85,z-l/2-2,roof);for(const s of [-1,1])box(base,3,.15,.4,x+dx,.45,z-l/2-2+s*1.2,steel);}}
 if(a==="Grocery"){box(shell,6,3,.2,x+7,2.1,z+l/2+.15,steel);for(let j=0;j<5;j++)box(shell,5.8,.08,.25,x+7,1+j*.5,z+l/2+.25,dark);}
 }
 else if(a==="Police station"){for(const dx of [-7,7]){box(shell,5.2,3.6,.21,x+dx,2.3,z-l/2-.15,dark);box(shell,5.5,.3,.35,x+dx,4.2,z-l/2-.3,white);}box(shell,3,.3,3,x,height+1,z,steel);cyl(shell,.08,.08,6,x,height+4,z,steel);}
 else if(a==="Records office"){for(let j of [-2,-1,1,2])box(shell,.4,height+.2,.55,x+j*4.6,height/2+.5,z-l/2-.22,steel);}
 else if(a==="Workers' hostel"){for(const dx of [-5,5]){cyl(shell,2.3,2.3,2.5,x+dx,height+2,z+6,steel,12);cyl(shell,2.35,2.35,.2,x+dx,height+3.4,z+6,roof,12);}}
 else if(a==="Community clinic"||a==="Dispensary"){box(shell,4,.3,3.3,x,4.4,z-l/2-1.5,white);box(shell,1.8,.45,.16,x,3.8,z-l/2-3,trim);}
 else for(let y=4;y<height;y+=4){box(shell,8,.25,2,x-4,y,z-l/2-1,roof);box(shell,8,.65,.13,x-4,y+.43,z-l/2-1.9,steel);}
 }
 // Choose a real facade, not the nominal parcel edge. Multi-volume buildings have
 // different frontages, and open structures use their actual canopy fascia.
 const frontage=walls.slice().sort((p,q)=>(p.z-p.l/2)-(q.z-q.l/2)||Math.abs(p.x-x)-Math.abs(q.x-x))[0];
 const front=frontage.z-frontage.l/2;
 if(!["Covered market","Duplex courts","Row residences","Night bazaar","Corner shops"].includes(a)&&b.type!=="Warehouse")wallDoor(frontage.x,front,2.6);
 if(["Tenement","Workers' hostel","Records office","Police station","Community clinic","Dispensary","Courtyard flats"].includes(a)){
 const wall=frontage;
 for(let y=6.5;y+1.15<wall.top;y+=4){
  const xs=a==="Records office"?[-6.9,-2.3,2.3,6.9]:[-8.55,-5.7,-2.85,0,2.85,5.7,8.55];
  for(const dx of xs)if(Math.abs(dx)+1<wall.w/2)frontWindow(1.6,1.75,wall.x+dx,y,front);
  for(const side of [-1,1])for(let zz=wall.z-wall.l/2+3;zz<wall.z+wall.l/2-2;zz+=5.4)sideWindow(2.1,1.75,zz,y,wall.x+side*wall.w/2,side);
 }
 }
 if(a==="Foundry"||a==="Fabrication yard"){const height=Math.max(7,h);for(let j=-1;j<=1;j++){const xx=x+j*6;box(shell,4.7,3.6,.16,xx,2.5,z-l/2-.15,dark);for(let k=0;k<5;k++)box(shell,4.5,.09,.22,xx,1+k*.65,z-l/2-.25,steel);}if(a==="Foundry")chimney(x-6,z+8,height+.5,15);else for(let k=-1;k<=1;k++)box(shell,3.2,1.5,6,x+k*6,height+1,z+7,rust);}
 // Small, physically mounted signs. The backing plate intersects the facade,
 // the lettering plane sits just beyond the plate; no detached parcel labels.
 const open=a==="Covered market";
 const residential=b.type==="Housing";
 const signX=open?x:frontage.x+(residential?Math.min(2.55,frontage.w/2-1.05):0),face=open?z-l/2-.225:front;
 const signW=Math.min(open?w-2:frontage.w-1.1,residential?1.65:a==="Records office"?7.7:9.4);
 const signH=residential?.62:open?.72:.84;
 const signY=residential?1.3:open?4.85:Math.min(frontage.top-signH/2-.12,a==="Community clinic"||a==="Dispensary"?5.25:4.85);
 const label=(b.type==="Housing"?String(b.id).padStart(2,"0"):a.toUpperCase()+" "+String(b.id).padStart(2,"0"));
 box(shell,signW+.16,signH+.12,.18,signX,signY,face-.035,dark);
 sign(label,signX,face-.14,signY,shell);
 const lettering=shell.children[shell.children.length-1],texture=lettering?.material?.map,canvas=texture?.image;
 if(lettering?.scale&&canvas?.getContext){
  lettering.scale.set(signW/12,signH/3,1);
  canvas.width=1024;canvas.height=Math.max(96,Math.round(1024*signH/signW));
  const ctx=canvas.getContext("2d");ctx.fillStyle="#17221e";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle="#829382";ctx.lineWidth=3;ctx.strokeRect(2,2,canvas.width-4,canvas.height-4);
  let size=Math.floor(canvas.height*.72);ctx.font="bold "+size+"px monospace";
  while(size>10&&ctx.measureText(label).width>canvas.width-30){size--;ctx.font="bold "+size+"px monospace";}
  ctx.fillStyle="#f1ead3";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(label,canvas.width/2,canvas.height/2);
  texture.magFilter=1003;texture.minFilter=1008;texture.generateMipmaps=true;texture.anisotropy=8;texture.needsUpdate=true;
 }
 box(inside,w,.15,l,x,.55,z,roof);for(const dx of [-1,1])box(inside,.3,.8,l,x+dx*w/2,.95,z,f);
 box(inside,w,.8,.3,x,.95,z+l/2,f);
 for(let j=-1;j<=1;j++){box(inside,5,.8,2,x-6,1,z+j*9,steel);box(inside,4,.18,1.8,x-6,1.5,z+j*9,white);box(inside,1.8,1.2,1.8,x+6,1.2,z+j*9,dark);}
 inside.visible=false;merge(base);merge(inside);const labels=shell.children.filter(o=>o.material?.isMeshBasicMaterial);for(const o of labels)shell.remove(o);merge(shell);for(const o of labels)shell.add(o);
 registry.push({b,r:shell,interior:inside});
}
const busMeshes=new Map();
export function drawBuses(cars,position,parent,{group,box,cyl,mat}){
 for(const b of cars){if(!b.bus)continue;let m=busMeshes.get(b.id);if(!m){m=group();const paint=mat(lines[b.line].color),body=mat(0x9b9c87),window=mat(0x344d51),rubber=mat(0x222722),lights=mat(0xe8dec1),tail=mat(0xa74b40);
 box(m,2.35,1.75,8.1,0,1.48,0,body);box(m,2.42,.4,8.2,0,.78,0,paint);box(m,2.3,.18,8.1,0,2.43,0,paint);if(b.line>=4){box(m,1.8,.3,4,0,2.68,-.5,window);box(m,2.03,.33,.09,0,2.33,4.14,paint);}
 box(m,2.05,.75,.08,0,1.94,4.08,window);box(m,2.05,.7,.08,0,1.94,-4.08,window);
 for(const s of [-1,1]){for(let z=-2.9;z<=2.9;z+=1.16)box(m,.055,.73,.96,s*1.185,1.95,z,window);
 for(const z of [-2.7,2.65]){const wheel=cyl(m,.48,.48,.33,s*1.12,.5,z,rubber,12);wheel.rotation.z=Math.PI/2;}
 box(m,.55,.2,.08,s*.72,.98,4.12,lights);box(m,.45,.2,.08,s*.72,.98,-4.12,tail);}
 box(m,.07,1.55,1.1,1.19,1.42,2.45,window);parent.add(m);busMeshes.set(b.id,m);}
 const p=position(b);m.position.set(p.x,0,p.z);m.rotation.y=p.a;
 }}
