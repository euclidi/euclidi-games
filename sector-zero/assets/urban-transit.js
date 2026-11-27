// Sector Zero: urban fabric and transit. Keep the original simulation's 70-unit node grid.
const D=[[0,1],[1,0],[0,-1],[-1,0]], N=70, edge=210;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const roadRank=v=>v===0||Math.abs(v)===210?0:Math.abs(v)===140?1:2;
const congestion=new Map(),keyOf=(x,z,d)=>x+","+z+","+d;
const closedEdges=new Set(),plazas=[];
const edgeOpen=(x,z,dir)=>{const d=D[dir];return Math.abs(x+d[0]*70)<=210&&Math.abs(z+d[1]*70)<=210&&!closedEdges.has(keyOf(x,z,dir));};
const SIDE=8,PERSON=.76,STOP=20,CAR_LINE=2.5;
const nearestGrid=v=>clamp(Math.round(v/70)*70,-210,210);
const roadHalf=v=>[6.5,5.75,4.25][roadRank(v)];
const phaseLocks=new Set(),junctions=new Map(),transitPriority=new Map();
// Bounded pedestrian admission independent of occupied crossing locks. Time is in simulation minutes.
function phaseAt(x,z,time){const t=((time+(x/70+z/70+6)*.85)%16+16)%16;return t<5?0:t<10?1:t<14?2:3;}
function crossingAdmission(cross,time){return phaseAt(cross.x,cross.z,time)===2;}
const trafficDependencies=new Map();
const nodeKey=(x,z)=>x+","+z;
const solids=[],streetSolids=[],entranceAnchors=new Map();
const stopControlled=(x,z)=>roadRank(x)===2&&roadRank(z)===2;
const streetLabels=[];let streetLabelGroup=null,streetLampMaterial=null;
let surfaceRoot=null,lowerRoot=null,streetKit=null;const rebuiltBlocks=new WeakSet();
const inventory={};
const walkState=new WeakMap();
let crowdStats={};
let currentWorld=null;
function walking(c){return c.inside<0&&c.ride?.phase!=="riding";}
const coord=[];for(let v=-210;v<=210;v+=70)coord.push(v-SIDE,v+SIDE);
const nearIndex=v=>coord.reduce((best,p,i)=>Math.abs(p-v)<Math.abs(coord[best]-v)?i:best,0);
function crossing(a,b){
 const horizontal=Math.abs(a.z-b.z)<.01;
 if(horizontal&&Math.abs(Math.abs(a.x-b.x)-SIDE*2)<.1&&nearestGrid(a.x)===nearestGrid(b.x))return{x:nearestGrid(a.x),z:nearestGrid(a.z),axis:0,a,b};
 if(!horizontal&&Math.abs(a.x-b.x)<.01&&Math.abs(Math.abs(a.z-b.z)-SIDE*2)<.1&&nearestGrid(a.z)===nearestGrid(b.z))return{x:nearestGrid(a.x),z:nearestGrid(a.z),axis:1,a,b};
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
const trees=new Map(),cornerLoad=new Float32Array(196);let crowdEpoch=-1;
function refreshCrowdRoutes(w){const epoch=Math.floor(w.time/2);if(epoch===crowdEpoch)return;crowdEpoch=epoch;trees.clear();cornerLoad.fill(0);for(const c of w.citizens){if(!walking(c))continue;const ix=nearIndex(c.x),iz=nearIndex(c.z),dx=coord[ix]-c.x,dz=coord[iz]-c.z;if(Math.hypot(dx,dz)<11)cornerLoad[iz*14+ix]++;}}
function tree(goal){
 const target=goal.iz*14+goal.ix;if(trees.has(target))return trees.get(target);
 const n=196,cost=Array(n).fill(Infinity),next=Array(n).fill(-1),used=new Uint8Array(n);cost[target]=0;
 for(let j=0;j<n;j++){let v=-1;for(let i=0;i<n;i++)if(!used[i]&&(v<0||cost[i]<cost[v]))v=i;if(v<0)break;used[v]=1;const x=v%14,z=Math.floor(v/14);
 for(const [dx,dz] of D){const a=x+dx,b=z+dz;if(a<0||a>13||b<0||b>13)continue;const k=b*14+a,step=Math.abs(coord[x]-coord[a])+Math.abs(coord[z]-coord[b]);const c=cost[v]+step+(step===SIDE*2?9:0)+Math.min(130,cornerLoad[v]*4.2);if(c<cost[k]){cost[k]=c;next[k]=v;}}}
 const result={cost,next};trees.set(target,result);return result;
}
// Parcel-level visibility routing with clearance around actual building and fixture footprints.
const parcelCache=new Map();
function parcel(p){
 const x=Math.floor(p.x/70)*70,z=Math.floor(p.z/70)*70;
 return {x0:x+roadHalf(x)+.43,x1:x+70-roadHalf(x+70)-.43,z0:z+roadHalf(z)+.43,z1:z+70-roadHalf(z+70)-.43,key:x+","+z};
}
function segmentHits(a,b,r){
 let low=0,high=1;
 for(const [p,d,min,max] of [[a.x,b.x-a.x,r.x0,r.x1],[a.z,b.z-a.z,r.z0,r.z1]]){
  if(Math.abs(d)<1e-9){if(p<=min||p>=max)return false;continue;}
  const t1=(min-p)/d,t2=(max-p)/d;low=Math.max(low,Math.min(t1,t2));high=Math.min(high,Math.max(t1,t2));if(high-low<1e-7)return false;
 }
 return high-low>1e-7;
}
function parcelData(bounds){
 const stamp=solids.length+":"+streetSolids.length,old=parcelCache.get(bounds.key);
 if(old?.stamp===stamp)return old;
 const rects=[...solids,...streetSolids].map(r=>({x0:r.x-r.w/2-.58,x1:r.x+r.w/2+.58,z0:r.z-r.l/2-.58,z1:r.z+r.l/2+.58})).filter(r=>r.x0<bounds.x1&&r.x1>bounds.x0&&r.z0<bounds.z1&&r.z1>bounds.z0);
 const inside=p=>p.x>=bounds.x0&&p.x<=bounds.x1&&p.z>=bounds.z0&&p.z<=bounds.z1&&!rects.some(r=>p.x>r.x0&&p.x<r.x1&&p.z>r.z0&&p.z<r.z1);
 const clear=(a,b)=>inside(a)&&inside(b)&&!rects.some(r=>segmentHits(a,b,r));
 const nodes=[];
 for(const r of rects)for(const x of [r.x0-.035,r.x1+.035])for(const z of [r.z0-.035,r.z1+.035]){
  const p={x:clamp(x,bounds.x0,bounds.x1),z:clamp(z,bounds.z0,bounds.z1)};
  if(inside(p)&&!nodes.some(q=>dist(p,q)<.05))nodes.push(p);
 }
 for(const x of [bounds.x0,bounds.x1])for(const z of [bounds.z0,bounds.z1])if(inside({x,z}))nodes.push({x,z});
 const adj=nodes.map(()=>[]);
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(clear(nodes[i],nodes[j])){const d=Math.hypot(nodes[i].x-nodes[j].x,nodes[i].z-nodes[j].z);adj[i].push([j,d]);adj[j].push([i,d]);}
 const data={stamp,inside,clear,nodes,adj};parcelCache.set(bounds.key,data);return data;
}
function localDetour(a,b){
 const bounds=parcel(a);if(parcel(b).key!==bounds.key)return [b];
 const {inside,clear,nodes,adj}=parcelData(bounds);
 if(!inside(a)||!inside(b)||clear(a,b))return [b];
 const n=nodes.length,start=n,goal=n+1,points=[...nodes,a,b],cost=Array(n+2).fill(Infinity),prev=Array(n+2).fill(-1),done=new Uint8Array(n+2);
 const distance=(i,j)=>Math.hypot(points[i].x-points[j].x,points[i].z-points[j].z);
 const endLinks=nodes.map(p=>clear(p,b));cost[start]=0;
 for(let step=0;step<n+2;step++){
  let i=-1;for(let j=0;j<n+2;j++)if(!done[j]&&Number.isFinite(cost[j])&&(i<0||cost[j]+distance(j,goal)<cost[i]+distance(i,goal)))i=j;
  if(i<0)break;if(i===goal){const out=[];for(let k=goal;k!==start;k=prev[k])out.push({...points[k],precise:true});return out.reverse();}
  done[i]=1;const links=i===start?nodes.flatMap((p,j)=>clear(a,p)?[[j,distance(start,j)]]:[]):[...adj[i],...(endLinks[i]?[[goal,distance(i,goal)]]:[])];
  for(const [j,d] of links)if(cost[i]+d<cost[j]){cost[j]=cost[i]+d;prev[j]=i;}
 }
 return [b]; // No teleportation if a parcel is physically disconnected.
}
function routeAroundParcels(from,route){
 const out=[];let last=from;
 for(const p of route){if(p.cross)out.push(p);else out.push(...localDetour(last,p));last=p;}
 return out;
}
function pedestrianPath(from,to){
 if(parcel(from).key===parcel(to).key){const d=parcelData(parcel(from));if(d.inside(from)&&d.inside(to)){const r=localDetour(from,to);let p=from;if(r.every(q=>{const ok=d.clear(p,q);p=q;return ok;}))return r;}}

 let best=null;
 for(const a of cornerOptions(from))for(const b of cornerOptions(to)){const t=tree(b.corner),start=a.corner.iz*14+a.corner.ix,cost=a.cost+b.cost+t.cost[start];if(!best||cost<best.cost)best={a,b,t,start,cost};}
 const {a,b,t,start}=best,route=[a.projected,a.corner];let k=start;
 for(let j=0;j<196&&t.next[k]>=0;j++){k=t.next[k];route.push({x:coord[k%14],z:coord[Math.floor(k/14)]});}
 route.push(b.projected,{x:to.x,z:to.z});
 const out=[];let prev={x:from.x,z:from.z},last=prev;
 const push=(p,metadata)=>{if(dist(last,p)<.001)return;out.push({x:p.x,z:p.z,...(metadata?{cross:metadata}:{})});last=p;};
 for(const p of route){if(dist(prev,p)<.001)continue;
  const dx=p.x-prev.x,dz=p.z-prev.z,horizontal=Math.abs(dz)<.001,vertical=Math.abs(dx)<.001;
  const cross=crossing(prev,p),lane=.48+((from.id??0)%3)*.13;
  const sidewalk=horizontal&&coord.some(v=>Math.abs(v-p.z)<.001)||vertical&&coord.some(v=>Math.abs(v-p.x)<.001);
  if(sidewalk&&Math.abs(dx)+Math.abs(dz)>2.5){
   const ox=vertical?Math.sign(dz)*lane:0,oz=horizontal?-Math.sign(dx)*lane:0;
   const a={x:prev.x+ox,z:prev.z+oz},b={x:p.x+ox,z:p.z+oz};
   push(a);push(b,cross?{...cross,a,b}:null);
  }else push(p,cross);
  prev=p;
 }
 push({x:to.x,z:to.z});return routeAroundParcels(from,out);
}
function busBay(b){return b.bus&&roadRank(b.dir%2===0?b.x:b.z)===0;}
function bayOffset(b,progress){if(!b.bay)return 0;return 2.7*Math.min(clamp((progress-14)/6,0,1),clamp((28-progress)/8,0,1));}
function carRect(b,progress=b.progress){
 const d=D[b.dir],offset=CAR_LINE+bayOffset(b,progress),x=b.x+d[0]*progress+d[1]*offset,z=b.z+d[1]*progress-d[0]*offset;
 return {x,z,hx:d[0]?(b.bus?4.4:2.35):(b.bus?1.2:1.05),hz:d[1]?(b.bus?4.4:2.35):(b.bus?1.2:1.05)};
}
function intersects(p,r,pad=PERSON/2){return Math.abs(p.x-r.x)<r.hx+pad&&Math.abs(p.z-r.z)<r.hz+pad;}
function crossClear(w,cross){
 const a=cross.a,b=cross.b,x=(a.x+b.x)/2,z=(a.z+b.z)/2,hx=Math.abs(a.x-b.x)/2+.55,hz=Math.abs(a.z-b.z)/2+.55;
 return !junctions.has(nodeKey(cross.x,cross.z))&&!w.cars.some(v=>{const r=carRect(v);return Math.abs(r.x-x)<r.hx+hx&&Math.abs(r.z-z)<r.hz+hz;});
}
function stopLine(b){return 70-SIDE-(b.bus?4.4:2.35)-1.2;}
function plannedDir(b,x,z){
 const arrived=x===b.destX&&z===b.destZ;
 const dest=arrived?(b.bus?nextNode(b):{x:-210+(b.id+b.trips*3+1)%7*70,z:-210+(b.id*3+b.trips+2)%7*70}):{x:b.destX,z:b.destZ};
 const dirs=[0,1,2,3].filter(d=>edgeOpen(x,z,d)&&(!b.bus||x+D[d][0]*70===dest.x&&z+D[d][1]*70===dest.z));
 dirs.sort((a,c)=>carScore(x,z,a,dest.x,dest.z,b.dir)-carScore(x,z,c,dest.x,dest.z,b.dir));
 return {dirs,dest,arrived};
}
function driveTraffic(w,dt){
 const cars=w.cars,lanes=new Map(),ped=w.citizens.filter(walking);
 trafficDependencies.clear();
 const key=b=>keyOf(b.x,b.z,b.dir);
 const add=b=>{const k=key(b);if(!lanes.has(k))lanes.set(k,[]);lanes.get(k).push(b);};
 for(const b of cars)add(b);
 transitPriority.clear();for(const b of cars){if(!b.bus||b.wait<=8||b.progress<stopLine(b)-.05)continue;const d=D[b.dir],x=b.x+d[0]*70,z=b.z+d[1]*70,k=nodeKey(x,z),p=transitPriority.get(k);if(phaseAt(x,z,w.time)===b.dir%2&&!phaseLocks.has(k)&&!junctions.has(k)&&(!p||b.wait>p.wait))transitPriority.set(k,b);}
 for(const [k,b] of junctions)if(!cars.includes(b)||!((nodeKey(b.x,b.z)===k&&b.progress<14)||(nodeKey(b.x+D[b.dir][0]*70,b.z+D[b.dir][1]*70)===k&&b.progress>stopLine(b))))junctions.delete(k);
 const approach=b=>b.progress>=stopLine(b)-.05;
 const list=cars.slice().sort((a,b)=>{
  if(key(a)===key(b))return b.progress-a.progress||a.id-b.id;
  return Number(!!b.junction)-Number(!!a.junction)||Number(approach(b))-Number(approach(a))||
   (approach(a)&&approach(b)?(b.wait||0)+(b.bus?12:0)-(a.wait||0)-(a.bus?12:0):0)||b.progress-a.progress||a.id-b.id;
 });
 for(const b of list){
  const old=b.progress, d=D[b.dir],tx=b.x+d[0]*70,tz=b.z+d[1]*70,k=nodeKey(tx,tz),origin=nodeKey(b.x,b.z),line=stopLine(b);
  const prev=junctions.get(origin);if(prev===b&&b.progress>=14){junctions.delete(origin);delete b.junction;}
  let limit=70,reason="";
  const lane=lanes.get(key(b))||[];
  if(busBay(b)&&b.pendingStop&&b.progress<=STOP+.01&&!b.bay)b.bay="enter";
  if(b.bay==="parked"&&b.dwell<=0&&b.progress>=STOP-.025&&!lane.some(q=>q!==b&&q.bay!=="parked"&&Math.abs(q.progress-b.progress)<gap(q,b)))b.bay="merge";
  for(const q of lane)if(q!==b&&(q.progress>b.progress||(q.progress===b.progress&&q.id<b.id))&&!(q.bay==="parked"&&!b.bay&&q.dwell>0)&&!(b.bay==="parked"&&!q.bay)){const stop=q.progress-gap(q,b);if(stop<limit){limit=stop;trafficDependencies.set(b.id,q.id);}}
  if(limit<70)reason="FOLLOWING";
  let owner=junctions.get(k),committed=owner===b;
  const stopSign=stopControlled(tx,tz);if(stopSign&&b.progress>=line-.05&&!committed)b.stopWait=(b.stopWait||0)+dt;else if(!committed)b.stopWait=0;
  const plan=plannedDir(b,tx,tz);
  const space=dir=>!(lanes.get(keyOf(tx,tz,dir))||[]).some(v=>v!==b&&!(v.bay==="parked"&&!b.bus)&&v.progress<14+gap(v,b)+1);
  const clear=dir=>!ped.some(p=>intersects(p,carRect({x:tx,z:tz,dir,bus:b.bus},0),.5));
  if(!committed&&b.progress>=line-.05&&b.progress<70&&limit>=70){
   const dir=plan.dirs.find(d=>space(d)&&clear(d));
   if(!owner&&!phaseLocks.has(k)&&signal(tx,tz,w.time,b.dir)===b.dir%2&&(!stopSign||b.stopWait>=.5)&&dir!==undefined){
    junctions.set(k,b);b.junction=k;b.turnDir=dir;committed=true;
   }
  }
  if(!committed){limit=Math.min(limit,line);if(!reason)reason=phaseLocks.has(k)||phaseAt(tx,tz,w.time)>=2?"PEDESTRIAN CROSSING":owner?"JUNCTION OCCUPIED":stopSign&&b.stopWait<.5?"STOP SIGN":signal(tx,tz,w.time,b.dir)!==b.dir%2?"RED SIGNAL":"EXIT BLOCKED";if(owner&&owner!==b)trafficDependencies.set(b.id,owner.id);if(reason==="EXIT BLOCKED"){const blockers=plan.dirs.flatMap(d=>lanes.get(keyOf(tx,tz,d))||[]).filter(v=>v!==b&&v.progress<14+gap(v,b)+1);if(blockers.length)trafficDependencies.set(b.id,blockers.sort((a,c)=>a.progress-c.progress)[0].id);}}
  let speed=b.speed;
  if(b.bus&&b.pendingStop)speed=Math.min(speed,Math.max(0,(STOP-b.progress)/dt));
  if(b.bus&&b.dwell>0)reason="BUS STOP";
  if(b.bay==="parked"){speed=0;reason=b.dwell>0?"BUS STOP":"WAIT TO MERGE";}
  let next=Math.max(old,Math.min(limit,old+speed*dt));
  const now=carRect(b),to=carRect(b,next),sweep={x:(now.x+to.x)/2,z:(now.z+to.z)/2,hx:now.hx+Math.abs(now.x-to.x)/2,hz:now.hz+Math.abs(now.z-to.z)/2};
  for(const p of ped)if(intersects(p,sweep,.5)){const along=(p.x-now.x)*d[0]+(p.z-now.z)*d[1],half=b.bus?4.4:2.35;if(along>=-half){next=Math.min(next,Math.max(old,old+along-half-.65));reason="PEDESTRIAN AHEAD";}}
  b.progress=next;if(b.bay==="merge"&&b.progress>=28)delete b.bay;
  if(next>=70-.0001&&committed){
   const dir=b.turnDir;
   if(dir!==undefined&&space(dir)&&clear(dir)){
    lane.splice(lane.indexOf(b),1);Object.assign(b,{x:tx,z:tz,dir,progress:0});
    if(plan.arrived){b.destX=plan.dest.x;b.destZ=plan.dest.z;b.trips++;w.stats.trips++;if(b.bus)arrive(b);}
    add(b);delete b.turnDir;b.stopWait=0;
   }else reason="EXIT BLOCKED";
  }
  const moved=b.progress!==old||b.x===tx&&b.z===tz;
  b.wait=moved?0:(b.wait||0)+dt;b.trafficStatus=moved?"MOVING":reason||"WAITING";if(moved)trafficDependencies.delete(b.id);
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
function offRoad(x,z){return plazas.some(p=>Math.abs(x-p.x)<(p.dir===0?4.5:24)&&Math.abs(z-p.z)<(p.dir===0?24:4.5))||Math.abs(x-nearestGrid(x))>=roadHalf(nearestGrid(x))+.42&&Math.abs(z-nearestGrid(z))>=roadHalf(nearestGrid(z))+.42;}
export function streetCollisionShapes(){return streetSolids.map(o=>({...o,h:o.h||1.15}));}
export function manualCanMove(c,x,z){
 if(!currentWorld)return true;
 for(const b of currentWorld.cars){const r=carRect(b);if(intersects({x,z},r,.30)&&(!intersects(c,r,.30)||Math.hypot(x-r.x,z-r.z)<=Math.hypot(c.x-r.x,c.z-r.z)))return false;}
 for(const p of currentWorld.citizens){if(p===c||!walking(p)||walkState.get(p)?.departing)continue;const old=Math.hypot(c.x-p.x,c.z-p.z),next=Math.hypot(x-p.x,z-p.z);if(next<.68&&next<=old)return false;}
 return true;
}
function inSolid(x,z){const hit=o=>Math.abs(x-o.x)<o.w/2+.25&&Math.abs(z-o.z)<o.l/2+.25;return solids.some(hit)||streetSolids.some(hit);}
function destination(w,c){const r=c.ride;return r?.phase==="approach"?(r.queue||(r.mode==="metro"?metroLines[r.line].stops[r.from]:lines[r.line].stops[r.from])):w.buildings[c.goal]?.door;}
function moveCrowd(w,dt,api){
 refreshCrowdRoutes(w);
 const occ=occupancy(w),cars=w.cars.map(b=>carRect(b)),list=w.citizens.filter(c=>c.id!==w.possessed&&c.ride?.phase!=="waiting"&&c.ride?.phase!=="riding");
 const active=new Map();const corridor=p=>nodeKey(p.x,p.z)+":"+p.axis+":"+(p.axis===0?Math.sign(p.a.z-p.z):Math.sign(p.a.x-p.x));const directionOf=p=>p.axis===0?Math.sign(p.b.x-p.a.x):Math.sign(p.b.z-p.a.z);for(const c of list){const p=walkState.get(c)?.cross;if(p){const k=corridor(p);if(!active.has(k))active.set(k,[]);active.get(k).push(c);}}
 const activeCrosses=()=>[...active.values()].flat().filter(c=>walkState.get(c)?.cross);
 const landingFor=(c,p)=>{const dir=directionOf(p);return {x:p.b.x+(p.axis===0?dir*.8:0),z:p.b.z+(p.axis===1?dir*.8:0)};};
 const yieldToLanding=c=>{if(!offRoad(c.x,c.z))return false;const blocked=activeCrosses().map(q=>walkState.get(q).cross.b).find(p=>Math.hypot(c.x-p.x,c.z-p.z)<2.2);if(!blocked)return false;let best=null;const step=Math.min(.32,c.speed*dt);for(let i=0;i<16;i++){const a=i*Math.PI/8,x=c.x+Math.cos(a)*step,z=c.z+Math.sin(a)*step;if(offRoad(x,z)&&!inSolid(x,z)&&occ.free(c,x,z)&&!cars.some(r=>intersects({x,z},r,.45))&&Math.hypot(x-blocked.x,z-blocked.z)>Math.hypot(c.x-blocked.x,c.z-blocked.z)+.02&&(!best||Math.hypot(x-blocked.x,z-blocked.z)>best.d))best={x,z,d:Math.hypot(x-blocked.x,z-blocked.z)};}if(!best)return false;occ.remove(c);c.heading=Math.atan2(best.x-c.x,best.z-c.z);c.x=best.x;c.z=best.z;occ.add(c);c.walkingNow=true;c.walkStatus="CLEARING CROSSWALK EXIT";return true;};
 // Crossing pedestrians have priority; otherwise rotate order so one ID never monopolizes a doorway.
 const n=w.citizens.length||1,shift=Math.floor(w.time*4)%n;
 list.sort((a,b)=>Number(!!walkState.get(b)?.cross)-Number(!!walkState.get(a)?.cross)||((a.id+n-shift)%n)-((b.id+n-shift)%n));
 for(const c of w.citizens)c.walkingNow=false;
 for(const c of list){
  const st=walkState.get(c)||{};walkState.set(c,st);
  const target=destination(w,c);if(!target)continue;
  if(c.inside===c.goal&&!c.ride&&!c.route.length){st.cross=null;st.path=null;c.walkingNow=false;continue;}
  if(!c.route.length&&!st.cross&&c.inside>=0&&!st.departing){c.walkingNow=false;continue;}
  if(st.departing||c.inside>=0){const origin=st.origin>=0?st.origin:c.inside,door=w.buildings[origin]?.door;if(door){c.x=door.x;c.z=door.z;}if(!occ.free(c,c.x,c.z)||cars.some(r=>intersects(c,r,.45))){c.inside=origin;c.walkingNow=false;c.walkStatus="DOOR QUEUE";continue;}c.inside=-1;st.departing=false;st.path=null;occ.add(c);}
  if(!st.cross&&yieldToLanding(c)){st.path=null;continue;}
  const key=target.x+","+target.z;
  if(st.key!==key||!st.path||!st.path.length||(!st.cross&&(st.stall||0)>3&&w.time-(st.replanAt||0)>6+c.id%7)){st.replanAt=w.time;
   if(st.cross){const end=st.cross.b;c.route=[{x:end.x,z:end.z,cross:st.cross},...pedestrianPath(end,target)];}
   else c.route=pedestrianPath(c,target);
   st.path=c.route;st.key=key;
  }else c.route=st.path;
  let budget=Math.min(1.55,c.speed*dt),loops=0;c.walkStatus="";const oldX=c.x,oldZ=c.z;
  while(budget>.001&&c.route.length&&loops++<8){
   const p=c.route[0],dx=p.x-c.x,dz=p.z-c.z,len=Math.hypot(dx,dz);
   const tolerance=c.route.length===1?0.08:p.precise||c.route[1]?.precise?0.18:p.cross?0.40:c.route[1]?.cross?0.58:2.15;
   if(len<tolerance){c.route.shift();if(st.cross&&Math.hypot(c.x-st.cross.b.x,c.z-st.cross.b.z)<.35)st.cross=null;continue;}
   if(p.cross&&!st.cross){
    const k=corridor(p.cross),flow=(active.get(k)||[]).filter(q=>walkState.get(q)?.cross),landing=landingFor(c,p.cross),dir=directionOf(p.cross);const same=flow.every(q=>directionOf(walkState.get(q).cross)===dir),entryClear=flow.every(q=>Math.hypot(q.x-c.x,q.z-c.z)>2.1);if(!crossingAdmission(p.cross,w.time)||!crossClear(w,p.cross)||!same||flow.length>=2||!entryClear||!occ.free(c,landing.x,landing.z)){c.walkStatus="WAITING FOR CROSSWALK";break;}
    st.cross=p.cross;if(!active.has(k))active.set(k,[]);active.get(k).push(c);phaseLocks.add(nodeKey(p.cross.x,p.cross.z));
   }
   const step=Math.min(.32,budget,len),ux=dx/len,uz=dz/len;
   const legal=(x,z)=>offRoad(x,z)||st.cross&&(st.cross.axis===0?Math.abs(z-st.cross.a.z)<=1.25&&x>=Math.min(st.cross.a.x,st.cross.b.x)-.4&&x<=Math.max(st.cross.a.x,st.cross.b.x)+.4:Math.abs(x-st.cross.a.x)<=1.25&&z>=Math.min(st.cross.a.z,st.cross.b.z)-.4&&z<=Math.max(st.cross.a.z,st.cross.b.z)+.4);
   const can=(x,z)=>legal(x,z)&&occ.free(c,x,z)&&!cars.some(r=>intersects({x,z},r,.45))&&(!inSolid(x,z)||Math.hypot(x-target.x,z-target.z)<1);
   let x=c.x+ux*step,z=c.z+uz*step;
   if(!can(x,z)){
    let found=false;
    if(st.cross||offRoad(c.x,c.z))for(const [angle,side] of [[.6,1],[.6,-1],[1.1,1],[1.1,-1],[1.55,1],[1.55,-1],[1.9,1],[1.9,-1]]){const xx=c.x+(ux*Math.cos(angle)+uz*Math.sin(angle)*side)*step,zz=c.z+(uz*Math.cos(angle)-ux*Math.sin(angle)*side)*step;
     const permitted=st.cross?(st.cross.axis===0?Math.abs(zz-(nearestGrid(st.cross.a.z)+(st.cross.a.z<nearestGrid(st.cross.a.z)?-SIDE:SIDE)))<=.96:Math.abs(xx-(nearestGrid(st.cross.a.x)+(st.cross.a.x<nearestGrid(st.cross.a.x)?-SIDE:SIDE)))<=.96):offRoad(xx,zz);
     if(permitted&&can(xx,zz)&&Math.hypot(xx-p.x,zz-p.z)<len+.22){x=xx;z=zz;found=true;break;}}
    if(!found&&st.cross&&(st.stall||0)>2){for(const angle of [2.1,-2.1,2.7,-2.7,Math.PI]){const xx=c.x+(ux*Math.cos(angle)+uz*Math.sin(angle))*step,zz=c.z+(uz*Math.cos(angle)-ux*Math.sin(angle))*step;if(can(xx,zz)){x=xx;z=zz;found=true;break;}}}
    if(!found&&!st.cross&&offRoad(c.x,c.z)&&(st.stall||0)>2){
     for(const angle of [2.1,-2.1,2.7,-2.7,Math.PI]){const xx=c.x+(ux*Math.cos(angle)+uz*Math.sin(angle))*step,zz=c.z+(uz*Math.cos(angle)-ux*Math.sin(angle))*step;
      if(offRoad(xx,zz)&&can(xx,zz)){x=xx;z=zz;found=true;st.stall=1;break;}}
    }
    if(!found){c.walkStatus="YIELDING";st.stall=(st.stall||0)+dt;break;}
   }
   if(Math.hypot(x-p.x,z-p.z)<len-.05)st.stall=Math.max(0,(st.stall||0)-dt);occ.remove(c);c.heading=Math.atan2(x-c.x,z-c.z);c.x=x;c.z=z;occ.add(c);budget-=step;
   if(Math.hypot(p.x-c.x,p.z-c.z)<tolerance){c.route.shift();if(st.cross&&Math.hypot(c.x-st.cross.b.x,c.z-st.cross.b.z)<.35)st.cross=null;}
  }
  c.crossing=st.cross?{...st.cross}:null;c.walkingNow=Math.hypot(c.x-oldX,c.z-oldZ)>.025;c.walkDistance=(c.walkDistance||0)+Math.hypot(c.x-oldX,c.z-oldZ);
  if(!c.route.length&&!c.ride&&Math.hypot(c.x-target.x,c.z-target.z)<.1){occ.remove(c);c.inside=c.goal;st.cross=null;}
 }
}
function queueSlot(w,c,p){
 const d=D[p.dir],occupied=w.citizens.filter(q=>q!==c&&walking(q));
 for(let i=0;i<36;i++){const along=(i%12)*.94-4,side=2.0+Math.floor(i/12)*.96;
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
 for(let d=0;d<4;d++){const a=x+D[d][0]*70,b=z+D[d][1]*70;if(!edgeOpen(x,z,d))continue;const j=nodeIndex(a,b);cost[j]=Math.min(cost[j],cost[n]+linkCost(a,b,d));}}
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
// Convert selected non-transit local road links into connected public courtyards.
 // Closures are paired in both directions and preserve the complete road graph.
const transitEdges=new Set();
for(const l of lines)for(let i=0;i<l.nodes.length;i++){
 const a=l.nodes[i],b=l.nodes[(i+1)%l.nodes.length],d=direction(a,b);
 transitEdges.add(keyOf(a.x,a.z,d));transitEdges.add(keyOf(b.x,b.z,(d+2)%4));
}
function connectedRoads(){
 const todo=[{x:0,z:0}],seen=new Set(["0,0"]);
 for(let i=0;i<todo.length;i++){const a=todo[i];for(let d=0;d<4;d++){if(!edgeOpen(a.x,a.z,d))continue;const b={x:a.x+D[d][0]*70,z:a.z+D[d][1]*70},k=nodeKey(b.x,b.z);if(!seen.has(k)){seen.add(k);todo.push(b);}}}
 return seen.size===49;
}
for(const x of [-140,-70,0,70,140])for(const z of [-140,-70,0,70,140])for(const dir of [0,1]){
 if(plazas.length>=8||roadRank(dir===0?x:z)!==2||!edgeOpen(x,z,dir)||transitEdges.has(keyOf(x,z,dir)))continue;
 const d=D[dir],b={x:x+d[0]*70,z:z+d[1]*70};
 if([0,1,2,3].filter(k=>edgeOpen(x,z,k)).length<3||[0,1,2,3].filter(k=>edgeOpen(b.x,b.z,k)).length<3)continue;
 const aKey=keyOf(x,z,dir),bKey=keyOf(b.x,b.z,(dir+2)%4);
 closedEdges.add(aKey);closedEdges.add(bKey);
 if(!connectedRoads()){closedEdges.delete(aKey);closedEdges.delete(bKey);continue;}
 plazas.push({x:x+d[0]*35,z:z+d[1]*35,dir});
}
function migrateStreetNetwork(w){
 if(w.streetRevision===1)return;
 for(const b of w.cars){if(edgeOpen(b.x,b.z,b.dir))continue;
  if(b.bus)continue;const directions=[0,1,2,3].filter(d=>edgeOpen(b.x,b.z,d));
  const dir=directions.find(d=>!w.cars.some(q=>q!==b&&q.x===b.x&&q.z===b.z&&q.dir===d&&q.progress<12));
  if(dir!==undefined){b.dir=dir;b.progress=0;delete b.junction;delete b.turnDir;}
  else { // Park a migrated car at a free position on a legal segment.
   let placed=false;for(let x=-210;x<=210&&!placed;x+=70)for(let z=-210;z<=210&&!placed;z+=70)for(let d=0;d<4&&!placed;d++)if(edgeOpen(x,z,d))for(const progress of [15,32,49])if(!w.cars.some(q=>q!==b&&q.x===x&&q.z===z&&q.dir===d&&Math.abs(q.progress-progress)<12)){Object.assign(b,{x,z,dir:d,progress});delete b.junction;delete b.turnDir;placed=true;break;}
  }
 }
 w.streetRevision=1;
}
const capacity=b=>b.line>=4?40:28;
const served=l=>l.stops.filter(p=>p.active).length;
const travel=(l,a,b)=>{let count=(b-a+l.nodes.length)%l.nodes.length,n=0;for(let k=1;k<=count;k++)if(l.stops[(a+k)%l.nodes.length].active)n++;return count*70/l.speed+n*1.8;};
const transfers=lines.map((l,i)=>lines.map((m,j)=>i===j?[]:l.stops.flatMap((p,a)=>p.active?m.stops.flatMap((q,b)=>q.active&&dist(p,q)<=39?[{a,b,d:dist(p,q)}]:[]):[])));
// Two underground shuttle corridors, sharing an interchange at Central.
const metroStations=new Map();
function station(x,z,name){
 const key=nodeKey(x,z);if(!metroStations.has(key))metroStations.set(key,{key,name,nx:x,nz:z,x:x+15,z:z+10.5,dir:3,shaft:{x:x+15,z:z+13.2,w:7.0,l:2.65}});
 return metroStations.get(key);
}
const metroLines=[
 {name:"M1 / NORTH–SOUTH",color:"#82b9af",stops:[-140,-70,0,70,140].map((z,i)=>station(0,z,["North Works","North Quarter","Central","South Quarter","South Works"][i]))},
 {name:"M2 / EAST–WEST",color:"#cc9b64",stops:[-140,-70,0,70,140].map((x,i)=>station(x,0,["West Works","West Quarter","Central","East Quarter","East Works"][i]))}
];
const metroCapacity=72;
function initMetro(w){
 if(w.metro?.revision===1)return;
 w.metro={revision:1,boardings:0,completed:0,transfers:0,abandoned:0,trains:metroLines.flatMap((l,line)=>[0,1].map(i=>({id:line*2+i,line,at:i?l.stops.length-1:0,dir:i?-1:1,dwell:1.5,remaining:0,passengers:[]})))};
}
function metroPlan(c,b){
 const end=b.door,speed=Math.max(3,c.speed),walk=dist(c,end)/speed;
 let best=null,score=walk-3;if(dist(c,end)<120)return null;
 function offer(legs,cost){if(cost<score){score=cost;best={mode:"metro",...legs[0],legs,leg:0,goal:c.goal,phase:"approach",estimate:cost};}}
 const cost=(line,a,b)=>Math.abs(a-b)*4.15+5;
 for(let li=0;li<2;li++)for(let a=0;a<5;a++)for(let j=0;j<2;j++)for(let b=0;b<5;b++){
  const p=metroLines[li].stops[a],q=metroLines[j].stops[b],access=dist(c,p),egress=dist(q,end);
  if(access>110||egress>110)continue;
  if(li===j){if(a!==b)offer([{line:li,from:a,to:b}],(access+egress)/speed+cost(li,a,b));}
  else if(a!==2&&b!==2)offer([{line:li,from:a,to:2},{line:j,from:2,to:b}],(access+egress)/speed+cost(li,a,2)+cost(j,2,b)+1.5);
 }
 return best;
}
function metroSlot(w,c,p){
 for(let i=0;i<20;i++){
 const q={x:p.x-4.5+(i%10)*.94,z:p.z-.25+Math.floor(i/10)*.95};
 if(!offRoad(q.x,q.z)||inSolid(q.x,q.z))continue;
 if(!w.citizens.some(o=>o!==c&&walking(o)&&(Math.hypot(o.x-q.x,o.z-q.z)<PERSON||o.ride?.queue&&Math.hypot(o.ride.queue.x-q.x,o.ride.queue.z-q.z)<PERSON)))return q;
 }
 return null;
}
function metroStep(w,dt,api){
 for(const t of w.metro.trains){
  const l=metroLines[t.line];
  t.passengers=t.passengers.filter(id=>{const c=w.citizens[id];return c&&c.id!==w.possessed&&c.ride?.mode==="metro"&&c.ride.train===t.id});
  if(t.remaining>0){t.remaining=Math.max(0,t.remaining-dt);if(t.remaining>0)continue;t.at+=t.dir;t.dwell=1.5;}
  if(t.at===0)t.dir=1;if(t.at===l.stops.length-1)t.dir=-1;
  const p=l.stops[t.at];
  for(const id of [...t.passengers]){
   const c=w.citizens[id],r=c.ride;if(r.to!==t.at&&!r.cancel)continue;
   const slot=metroSlot(w,c,p);if(!slot){t.dwell=Math.max(t.dwell,.5);continue;}
   t.passengers=t.passengers.filter(i=>i!==id);c.x=slot.x;c.z=slot.z;
   if(!r.cancel&&r.leg+1<r.legs.length){Object.assign(r,r.legs[++r.leg],{phase:"approach",train:null,since:w.time,queue:slot});c.route=walkTo(c,slot);w.metro.transfers++;}
   else{if(!r.cancel)w.metro.completed++;resume(w,c,api);}
  }
  for(const c of w.citizens.filter(c=>c.ride?.mode==="metro"&&c.ride.phase==="waiting"&&c.ride.line===t.line&&c.ride.from===t.at&&Math.sign(c.ride.to-t.at)===t.dir).sort((a,b)=>a.ride.since-b.ride.since)){
   if(t.passengers.length>=metroCapacity)break;
   c.ride.phase="riding";c.ride.train=t.id;c.ride.queue=null;c.route=[];t.passengers.push(c.id);w.metro.boardings++;
  }
  t.dwell=Math.max(0,t.dwell-dt);
  if(t.dwell===0){const blocked=w.metro.trains.some(q=>q!==t&&q.line===t.line&&q.dir===t.dir&&q.at===t.at&&q.remaining>0);if(!blocked)t.remaining=2.65;else t.dwell=.25;}
 }
}
const variants={
 Housing:["Tenement","Row residences","Apartment tower","Workers' hostel","Courtyard flats","Brutalist terrace","Micro flats","Duplex courts","Stacked maisonettes"],
 Market:["Covered market","Grocery","Fuel station","Canteen","Trading arcade","Night bazaar","Corner shops","Department store"],
 Factory:["Machine works","Processing plant","Power works","Assembly hall","Foundry","Fabrication yard"],
 Warehouse:["Freight depot","Cold store","Distribution centre"],
 Authority:["Municipal hall","Police station","Records office"],
 Clinic:["Hospital","Community clinic","Dispensary"]
};
export function prepare(w){
 if(currentWorld!==w){
  junctions.clear();phaseLocks.clear();transitPriority.clear();trees.clear();crowdEpoch=-1;
  for(const b of w.buildings){const a=entranceAnchors.get(b.id);if(a&&b.door)Object.assign(b.door,a);}
  for(const c of w.citizens){const cross=c.crossing||c.route?.[0]?.cross;
   if(walking(c)&&cross?.a&&cross?.b&&Number.isFinite(cross.x)&&Number.isFinite(cross.z)&&!offRoad(c.x,c.z)){walkState.set(c,{cross,path:c.route,key:null});phaseLocks.add(nodeKey(cross.x,cross.z));}
  }
  currentWorld=w;
 }
 initMetro(w);
 if(w.transit?.revision===3&&w.architectureRevision===3){migrateStreetNetwork(w);return w;}
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
 migrateStreetNetwork(w);return w;
}
export function nextNode(b){const l=lines[b.line];return l.nodes[(b.nextStop+1)%l.nodes.length]}
export function arrive(b){b.atStop=b.nextStop;b.nextStop=(b.nextStop+1)%lines[b.line].nodes.length;b.pendingStop=lines[b.line].stops[b.atStop].active;b.dwell=0;b.progress=0;}
export function gap(a,b){return a?.bus||b?.bus?10.5:5.8}
export function signal(x,z,time,dir){
 const key=nodeKey(x,z),phase=phaseAt(x,z,time);if(phaseLocks.has(key)||phase>=2)return -1;
 return phase;
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
 const consider=(cost,legs)=>{if(cost<score){score=cost;best={...legs[0],legs,leg:0,goal:c.goal,phase:"approach",since:0,estimate:cost};}};
 for(let i=0;i<lines.length;i++)for(const a of starts[i])for(let j=0;j<lines.length;j++)for(const z of ends[j]){
 const l=lines[i],m=lines[j],walking=(a.d+z.d)/speed;
 if(i===j){if(a.i!==z.i)consider(walking+wait(l)+travel(l,a.i,z.i),[{line:i,from:a.i,to:z.i}]);continue;}
 for(const t of transfers[i][j]){if(a.i===t.a||t.b===z.i)continue;
 const cost=walking+wait(l)+travel(l,a.i,t.a)+t.d/speed+wait(m)+travel(m,t.b,z.i)+2;
 consider(cost,[{line:i,from:a.i,to:t.a},{line:j,from:t.b,to:z.i}]);}
 }
 return best;
}
function resume(w,c,api){const r=c.ride;delete c.ride;const st=walkState.get(c);if(st){st.path=null;st.key=null;}c.transitGoal=c.goal;
 if(!w.buildings[c.goal]){c.goal=c.home;c.activity="Resting"}
 c.inside=-1;c.route=api.path(c,w.buildings[c.goal]);if(r?.phase==="riding"&&c.activity==="On bus")c.activity=r.activity;
}
export function before(w,dt,api){
 prepare(w);
 currentWorld=w;phaseLocks.clear();
 for(const c of w.citizens){const st=walkState.get(c)||{};walkState.set(c,st);if(st.cross&&walking(c)){const a=st.cross.a,b=st.cross.b,done=(c.x-(a.x+b.x)/2)*(b.x-a.x)+(c.z-(a.z+b.z)/2)*(b.z-a.z)>0;if(offRoad(c.x,c.z)&&done){if(c.route[0]?.cross)c.route.shift();if(st.path!==c.route&&st.path?.[0]?.cross)st.path.shift();st.cross=null;}else if(offRoad(c.x,c.z)&&Math.hypot(c.x-a.x,c.z-a.z)<1.4)st.cross=null;else phaseLocks.add(nodeKey(st.cross.x,st.cross.z));}}
 for(const c of w.citizens)if(c.transitMigration){delete c.transitMigration;if(c.id!==w.possessed)resume(w,c,api);}
 congestion.clear();
 for(const b of w.cars){const key=keyOf(b.x,b.z,b.dir);congestion.set(key,(congestion.get(key)||0)+1);if(!b.bus)b.speed=roadSpeed(b.x,b.z,b.dir)*(w.rain?.77:1)*(.86+(b.id%5)*.07);}
 for(const b of w.cars)if(b.bus){b.dwell=Math.max(0,b.dwell-dt);b.speed=b.dwell>0?0:Math.min(lines[b.line].speed,roadSpeed(b.x,b.z,b.dir)+2)*(w.rain?.82:1);
 b.passengers=b.passengers.filter(id=>{const c=w.citizens[id];if(!c||id===w.possessed||c.ride?.bus!==b.id){if(c?.ride?.bus===b.id)delete c.ride;return false}return true;});}
 for(const b of w.cars){b.driveSpeed=b.speed;b.oldWait=b.wait;b.speed=0;b.progress=Math.min(b.progress,69.99);}
 // Original simulation remains responsible for intent, economy and needs, not motion.
 for(const c of w.citizens){if(c.id===w.possessed)continue;const st=walkState.get(c);st.speed=c.speed;st.origin=c.inside;c.speed=0;if(c.ride?.phase==="waiting"||c.ride?.phase==="riding")c.route=[{x:c.x,z:c.z}];}
}
export function after(w,dt,api){
 for(const b of w.cars){b.speed=b.driveSpeed;b.wait=b.oldWait;delete b.oldWait;delete b.driveSpeed;}driveTraffic(w,dt);
 const buses=w.cars.filter(b=>b.bus);
 for(const b of buses)if(b.pendingStop&&b.progress>=STOP-.025){b.pendingStop=false;b.dwell=1.8;b.stopDeadline=w.time+4;if(b.bay==="enter")b.bay="parked";}
 for(const c of w.citizens){const st=walkState.get(c);if(st&&st.speed!==undefined){c.speed=st.speed;delete st.speed;if(st.origin>=0&&c.inside<0)st.departing=true;}if(c.id===w.possessed&&st){st.cross=null;st.path=null;st.key=null;c.crossing=null;}}
 for(const c of w.citizens){
 if(c.id===w.possessed){delete c.ride;continue}
 let r=c.ride;
 if(r&&r.goal!==c.goal){if(r.phase==="riding"){r.goal=c.goal;r.cancel=true}else{delete c.ride;r=null;}}
 if(!r&&c.inside<0&&c.route.length&&c.transitGoal!==c.goal){
 c.transitGoal=c.goal;
 if(c.id%4!==0&&w.buildings[c.goal]){r=itinerary(c,w.buildings[c.goal]);const rail=metroPlan(c,w.buildings[c.goal]);if(rail&&(!r||rail.estimate<r.estimate))r=rail;if(r){r.since=w.time;r.activity=c.activity;const p=r.mode==="metro"?metroLines[r.line].stops[r.from]:lines[r.line].stops[r.from];r.queue=r.mode==="metro"?metroSlot(w,c,p):queueSlot(w,c,p);if(r.queue){c.ride=r;c.route=walkTo(c,r.queue);}else r=null;}}
 }
 if(!r)continue;
 if(r.mode==="metro"){
  if(r.phase==="approach"){const p=r.queue;if(p&&dist(c,p)<.17){r.phase="waiting";r.since=w.time;c.route=[];}else if(p&&(!c.route.length||dist(c.route[c.route.length-1],p)>.1))c.route=walkTo(c,p);}
  if(r.phase==="waiting"){c.inside=-1;c.route=[];c.walkStatus="WAITING FOR METRO";if(w.time-r.since>75){w.metro.abandoned++;resume(w,c,api);}}
  if(r.phase==="riding"){c.inside=-1;c.route=[];}
  continue;
 }
 if(r.phase==="approach"){const p=r.queue||lines[r.line].stops[r.from];if(Math.hypot(c.x-p.x,c.z-p.z)<.13){r.phase="waiting";r.since=w.time;c.route=[];}else if(!c.route.length||dist(c.route[c.route.length-1],p)>.1)c.route=walkTo(c,p);}
 if(r.phase==="waiting"){c.inside=-1;c.route=[];c.walkStatus="WAITING FOR BUS";if(w.time-r.since>110){w.transit.abandoned++;resume(w,c,api);}}
 if(r.phase==="riding"){const b=buses.find(x=>x.id===r.bus);if(!b){resume(w,c,api);continue}const p=api.carPosition(b);c.x=p.x;c.z=p.z;c.heading=p.a;c.inside=-1;c.route=[];}
 }
 for(const b of buses){
 w.transit.vehicleKm+=(b.trafficStatus==="MOVING"?b.speed*dt:0)/1000;
 if(b.dwell<=0||b.atStop<0)continue;
 const p=lines[b.line].stops[b.atStop];
 for(const id of [...b.passengers]){const c=w.citizens[id],r=c?.ride;if(!r||r.bus!==b.id){b.passengers=b.passengers.filter(x=>x!==id);continue;}
 if(r.to===b.atStop||r.cancel){const exit=queueSlot(w,c,p);if(!exit){if(w.time<(b.stopDeadline??w.time))b.dwell=Math.max(b.dwell,.5);continue;}b.passengers=b.passengers.filter(x=>x!==id);c.x=exit.x;c.z=exit.z;if(!r.cancel&&r.legs&&r.leg+1<r.legs.length){
 Object.assign(r,r.legs[++r.leg],{phase:"approach",since:w.time,bus:null,queue:null});r.queue=queueSlot(w,c,lines[r.line].stops[r.from]);if(r.queue){c.route=walkTo(c,r.queue);w.transit.transfers++;}else resume(w,c,api);
 }else{if(r.cancel)w.transit.rerouted=(w.transit.rerouted||0)+1;else w.transit.completed++;resume(w,c,api);}}}
 for(const c of w.citizens.filter(c=>c.ride?.mode!=="metro"&&c.ride?.phase==="waiting"&&c.ride.line===b.line&&c.ride.from===b.atStop).sort((a,b)=>a.ride.since-b.ride.since)){if(b.passengers.length>=capacity(b))break;const r=c.ride;
 if(r?.phase==="waiting"&&r.line===b.line&&r.from===b.atStop&&c.id!==w.possessed){
 r.phase="riding";r.bus=b.id;r.queue=null;b.passengers.push(c.id);c.route=[];w.transit.boardings++;api.note(w,c,"Boarded bus "+lines[b.line].name);}}
 }
 metroStep(w,dt,api);updateTrainMeshes(w);
 moveCrowd(w,dt,api);
 let cycles=0;const seen=new Set();for(const id of trafficDependencies.keys()){let v=id;const path=new Set();while(trafficDependencies.has(v)&&!seen.has(v)){if(path.has(v)){cycles++;break;}path.add(v);v=trafficDependencies.get(v);}for(const q of path)seen.add(q);}w.transit.deadlockCycles=cycles;
}
export function networkMap(w){
 // Schematic based on the actual graph. Each shared route has its own colored track.
 let html='<div style="position:relative;aspect-ratio:1;max-width:285px;margin:12px auto;background:#0d1412;border:1px solid #394c43" aria-label="Bus and subway route network">';
 const p=(v)=>8+(v+210)/420*84;
 for(let j=0;j<7;j++){const v=8+j*14;html+='<i style="position:absolute;left:'+v+'%;top:8%;height:84%;width:1px;background:#415048"></i><i style="position:absolute;top:'+v+'%;left:8%;width:84%;height:1px;background:#415048"></i>';}
 for(const q of plazas)html+='<i title="PEDESTRIAN PLAZA" style="position:absolute;left:'+ (p(q.x)-(q.dir===1?5.5:.75))+'%;top:'+(p(q.z)-(q.dir===0?5.5:.75))+'%;width:'+(q.dir===1?11:1.5)+'%;height:'+(q.dir===0?11:1.5)+'%;background:#82966c"></i>';
 for(let li=0;li<lines.length;li++){const l=lines[li],color="#"+l.color.toString(16).padStart(6,"0"),off=(li-2.5)*.78;
 for(let i=0;i<l.nodes.length;i++){const a=l.nodes[i],b=l.nodes[(i+1)%l.nodes.length],horizontal=a.z===b.z;
 const left=Math.min(p(a.x),p(b.x))+(horizontal?0:off),top=Math.min(p(a.z),p(b.z))+(horizontal?off:0);
 html+='<i style="position:absolute;left:'+left+'%;top:'+top+'%;width:'+(horizontal?14:0.7)+'%;height:'+(horizontal?0.7:14)+'%;background:'+color+'"></i>';
 if(l.stops[i].active)html+='<i style="position:absolute;width:4px;height:4px;background:'+color+';left:calc('+(p(a.x)+off)+'% - 2px);top:calc('+(p(a.z)+off)+'% - 2px)"></i>';
 }}
 for(const l of metroLines){const a=l.stops[0],b=l.stops.at(-1),h=a.nz===b.nz;html+='<i style="position:absolute;left:'+p(a.nx)+'%;top:'+p(a.nz)+'%;width:'+(h?56:1.1)+'%;height:'+(h?1.1:56)+'%;background:'+l.color+';opacity:.95"></i>';for(const q of l.stops)html+='<i style="position:absolute;left:calc('+p(q.nx)+'% - 3px);top:calc('+p(q.nz)+'% - 3px);width:6px;height:6px;border:1px solid #111;background:'+l.color+';border-radius:50%"></i>';}
 if(w?.metro)for(const t of w.metro.trains){const l=metroLines[t.line],a=l.stops[t.at],b=l.stops[t.at+t.dir]||a,ratio=t.remaining>0?clamp(1-t.remaining/2.65,0,1):0;html+='<i title="TRAIN '+t.id+'" style="position:absolute;left:calc('+p(a.nx+(b.nx-a.nx)*ratio)+'% - 3px);top:calc('+p(a.nz+(b.nz-a.nz)*ratio)+'% - 3px);width:6px;height:6px;transform:rotate(45deg);background:#fff3bd;border:1px solid #17221e"></i>';}
 return html+'</div>';
}
export function panel(w){
 const s=w.transit,buses=w.cars.filter(b=>b.bus),waiting=w.citizens.filter(c=>c.ride?.phase==="waiting").length;
 let html='<h2>TRANSIT CONTROL</h2><h3>TRAFFIC FLOW</h3>'+["MOVING","RED SIGNAL","STOP SIGN","FOLLOWING","JUNCTION OCCUPIED","EXIT BLOCKED","PEDESTRIAN CROSSING","PEDESTRIAN AHEAD","BUS STOP","WAIT TO MERGE"].map(reason=>'<div class="stat"><span>'+reason+'</span><b>'+w.cars.filter(c=>c.trafficStatus===reason).length+'</b></div>').join("")+'<div class="stat"><span>LONG WAIT (20+ MIN)</span><b>'+w.cars.filter(c=>c.wait>20).length+'</b></div><div class="stat"><span>WAIT-FOR CYCLES</span><b>'+(s.deadlockCycles||0)+'</b></div><h3>PEDESTRIANS</h3><div class="stat"><span>CROSSWALK WAIT</span><b>'+w.citizens.filter(c=>c.walkStatus==="WAITING FOR CROSSWALK").length+'</b></div><div class="stat"><span>PEDESTRIAN YIELD</span><b>'+w.citizens.filter(c=>c.walkStatus==="YIELDING").length+'</b></div><div class="stat"><span>ACTIVE BUSES</span><b>'+buses.length+'</b></div><div class="stat"><span>WAITING</span><b>'+waiting+'</b></div><div class="stat"><span>ON BOARD</span><b>'+buses.reduce((n,b)=>n+b.passengers.length,0)+'</b></div><div class="stat"><span>BOARDINGS</span><b>'+s.boardings+'</b></div><div class="stat"><span>COMPLETED RIDES</span><b>'+s.completed+'</b></div><div class="stat"><span>WAIT TIMEOUTS</span><b>'+s.abandoned+'</b></div><div class="stat"><span>INTERRUPTED RIDES</span><b>'+(s.rerouted||0)+'</b></div><div class="stat"><span>TRANSFERS</span><b>'+(s.transfers||0)+'</b></div><h3>ROUTE NETWORK</h3>'+networkMap(w);
 for(let i=0;i<lines.length;i++){const l=lines[i],v=buses.filter(b=>b.line===i);html+='<h3 style="color:#'+l.color.toString(16)+'">'+l.name+'</h3><div class="stat"><span>STOPS / BUSES</span><b>'+served(l)+' / '+v.length+'</b></div><div class="stat"><span>PASSENGERS</span><b>'+v.reduce((n,b)=>n+b.passengers.length,0)+' / '+v.reduce((n,b)=>n+capacity(b),0)+'</b></div>'+v.map(b=>'<button data-bus="'+b.id+'">BUS '+b.id+' · '+b.passengers.length+'/'+capacity(b)+' · '+(b.dwell>0?'STOP':'RUN')+'</button>').join('')}
 html+='<h3>STREET INFRASTRUCTURE</h3><div class="stat"><span>UTILITY GRID</span><b>'+(w.blackout?"BLACKOUT":"ONLINE")+'</b></div>'+Object.entries(inventory).map(([name,n])=>'<div class="stat"><span>'+name.toUpperCase()+'</span><b>'+n+'</b></div>').join('');
 html+='<h3>UNDERGROUND METRO</h3><div class="stat"><span>STATIONS / TRAINS</span><b>'+metroStations.size+' / '+w.metro.trains.length+'</b></div><div class="stat"><span>WAITING</span><b>'+w.citizens.filter(c=>c.ride?.mode==="metro"&&c.ride.phase==="waiting").length+'</b></div><div class="stat"><span>ON BOARD</span><b>'+w.metro.trains.reduce((n,t)=>n+t.passengers.length,0)+'</b></div><div class="stat"><span>BOARDINGS / COMPLETED</span><b>'+w.metro.boardings+' / '+w.metro.completed+'</b></div>';
 for(const t of w.metro.trains)html+='<div class="stat"><span>TRAIN '+(t.id+1)+' · '+(t.remaining>0?"IN TUNNEL":metroLines[t.line].stops[t.at].name.toUpperCase())+'</span><b>'+t.passengers.length+' / '+metroCapacity+'</b></div>';
 for(const l of metroLines){html+='<h3 style="color:'+l.color+'">'+l.name+'</h3><p>'+l.stops.map(p=>p.name).join(' · ')+'</p>';}
 return html+'<p>Local loops and limited-stop express services support one transfer. Riders compare estimated trip time with walking and queue in arrival order. Select a bus to locate it.</p>';
}
export function citizen(c){const r=c.ride;return r?'<div class="stat"><span>TRANSIT</span><b>'+r.phase.toUpperCase()+' / '+(r.mode==="metro"?metroLines[r.line].name:lines[r.line].name)+'</b></div>':c.walkStatus?'<div class="stat"><span>MOVEMENT</span><b>'+c.walkStatus+'</b></div>':'';}
const signalGroups=new Map();
export function updateSignals(time){const hour=((time%1440)+1440)%1440/60,night=hour<6||hour>=19;if(streetLampMaterial?.emissive){streetLampMaterial.emissive.setHex(night&&!currentWorld?.blackout?0xe6c98a:0x000000);streetLampMaterial.emissiveIntensity=night&&!currentWorld?.blackout?0.75:0;}for(const s of signalGroups.values()){const p=signal(s.x,s.z,time,0);s.phases[0].visible=p===0;s.phases[1].visible=p===1;s.phases[2].visible=p===-1;}}
// Split solid terrain around real shaft openings, rather than painting stairs on it.
function cutTiles(bounds,holes){
 let tiles=[bounds];
 for(const h of holes){const out=[];for(const a of tiles){
  const x0=Math.max(a.x0,h.x-h.w/2),x1=Math.min(a.x1,h.x+h.w/2),z0=Math.max(a.z0,h.z-h.l/2),z1=Math.min(a.z1,h.z+h.l/2);
  if(x1<=x0||z1<=z0){out.push(a);continue;}
  for(const q of [{x0:a.x0,x1:x0,z0:a.z0,z1:a.z1},{x0:x1,x1:a.x1,z0:a.z0,z1:a.z1},{x0,x1,z0:a.z0,z1:z0},{x0,x1,z0:z1,z1:a.z1}])if(q.x1-q.x0>.001&&q.z1-q.z0>.001)out.push(q);
 }tiles=out;}return tiles;
}
function tileTerrain(g,box,bounds,y,h,material,holes=[...metroStations.values()].map(p=>p.shaft)){
 for(const q of cutTiles(bounds,holes))box(g,q.x1-q.x0,h,q.z1-q.z0,(q.x0+q.x1)/2,y,(q.z0+q.z1)/2,material);
}
function replaceSurface(parent,kit){
 surfaceRoot=parent.parent;lowerRoot=surfaceRoot?.parent?.children.find(o=>o!==surfaceRoot&&o.isGroup&&o.visible===false);streetKit=kit;
 if(!surfaceRoot)return;
 const ground=surfaceRoot.children.find(o=>o.isMesh&&o.geometry?.parameters?.width===445);
 if(ground){surfaceRoot.remove(ground);const material=ground.material;ground.geometry.dispose();tileTerrain(surfaceRoot,kit.box,{x0:-222.5,x1:222.5,z0:-222.5,z1:222.5},-.17,.25,material);}
}
function replaceBlock(parent,b,box,group,merge,material){
 if(rebuiltBlocks.has(parent)||!parent.parent||parent.parent!==surfaceRoot)return;
 rebuiltBlocks.add(parent);const legacy=parent.children[0];if(!legacy?.isGroup)return;
 parent.remove(legacy);legacy.traverse?.(o=>{if(o.isMesh)o.geometry.dispose()});
 const block=group();parent.add(block);const x=-175+b.i*70,z=-175+b.j*70;
 tileTerrain(block,box,{x0:x-28.5,x1:x+28.5,z0:z-28.5,z1:z+28.5},.08,.22,material);
 merge(block);
}
// Roadside assets are laid out against curb coordinates; collision footprints stay
// out of the two sidewalk lanes. Sign planes are generated once using the existing
// Three.js sign factory, then attached to their physical backing plates.
function drawInfrastructure(parent,{box,cyl,merge,mat,group}){
 streetLabels.length=0;streetSolids.length=0;for(const k of Object.keys(inventory))delete inventory[k];
 const g=group();parent.add(g);streetLabelGroup=group();parent.add(streetLabelGroup);
 const m={iron:mat(0x535e59),black:mat(0x292e2c),wood:mat(0x77634d),concrete:mat(0x969487),stone:mat(0x797c71),red:mat(0xa73c32),yellow:mat(0xb7a35f),white:mat(0xd7d5c4),blue:mat(0x465d78),green:mat(0x3b6855),copper:mat(0x78654a),wire:mat(0x252925),glass:mat(0x586d70),lamp:mat(0xe3d9ad),rail:mat(0x86928f)};
 streetLampMaterial=m.lamp;
 const count=k=>inventory[k]=(inventory[k]||0)+1;
 const footprint=(x,z,w,l)=>streetSolids.push({x,z,w,l});
 const B=(w,h,l,x,y,z,material)=>box(g,w,h,l,x,y,z,material);
 const C=(a,b,h,x,y,z,material,n=12)=>cyl(g,a,b,h,x,y,z,material,n);
 const pole=(x,z,h=.0,r=.085,material=m.iron)=>C(r*.85,r,h,x,h/2,z,material);
 const plate=(text,x,y,z,w,h,dir,color,bg,fg="#f5f3de")=>{
  const alongX=dir%2===0;B(alongX?w:.1,h,alongX?.1:w,x,y,z,color);
  const d=D[dir];streetLabels.push({text,x:x+d[0]*.058,y,z:z+d[1]*.058,w:w-.08,h:h-.08,dir,bg,fg});
 };
 const wire=(a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,length=Math.hypot(dx,dy,dz);const o=B(.034,.034,length,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,m.wire);o.rotation.y=Math.atan2(dx,dz);o.rotation.x=-Math.atan2(dy,Math.hypot(dx,dz));o.rotation.order="YXZ";};
 const streetName=(v,axis)=>v===0?(axis===0?"CENTRAL AVE":"UNION BLVD"):Math.abs(v)===210?(axis===0?(v<0?"WEST":"EAST"):(v<0?"NORTH":"SOUTH"))+" RING":(axis===0?"AV ":"ST ")+String(v/70+4).padStart(2,"0");
 const oriented=(axis,v,p,side,offset)=>axis===0?{x:v+side*offset,z:p}:{x:p,z:v+side*offset};
 function bench(axis,x,z){
  const h=axis===1;for(let j=0;j<4;j++)B(h?2.35:.12,.11,h?.12:2.35,x+(h?0:(j-1.5)*.14),.48,z+(h?(j-1.5)*.14:0),m.wood);
  for(const a of [-.85,.85]){B(h?.11:.5,.46,h?.5:.11,x+(h?a:0),.25,z+(h?0:a),m.iron);B(h?.11:.1,.48,h?.1:.11,x+(h?a:-.22),.72,z+(h?-.22:a),m.iron);}
  for(const y of [.68,.85,1.02])B(h?2.35:.09,.12,h?.09:2.35,x+(h?0:-.23),y,z+(h?-.23:0),m.wood);
  footprint(x,z,h?2.4:.65,h?.65:2.4);count("benches");
 }
 function hydrant(x,z){C(.18,.24,.54,x,.33,z,m.red);C(.24,.2,.12,x,.65,z,m.red);C(.13,.24,.13,x,.77,z,m.red);C(.085,.085,.085,x,.88,z,m.yellow);const o=C(.095,.095,.52,x,.43,z,m.red);o.rotation.z=Math.PI/2;for(const side of [-1,1]){const cap=C(.13,.13,.075,x+side*.27,.43,z,m.yellow,8);cap.rotation.z=Math.PI/2;}footprint(x,z,.56,.44);count("hydrants");}
 function bin(x,z){C(.25,.22,.7,x,.36,z,m.green);C(.28,.28,.09,x,.74,z,m.iron);B(.25,.025,.14,x,.794,z,m.black);footprint(x,z,.56,.56);count("bins");}
 function cabinet(x,z){B(.54,.12,.55,x,.06,z,m.concrete);B(.44,.86,.45,x,.55,z,m.green);B(.03,.6,.32,x+.231,.55,z,m.iron);B(.045,.06,.08,x+.25,.54,z,m.black);for(let j=0;j<4;j++)B(.045,.027,.19,x+.25,.25+j*.06,z,m.black);footprint(x,z,.55,.55);count("utility cabinets");}
 function lamp(axis,x,z,side){pole(x,z,5.8,.10);C(.16,.21,.24,x,.12,z,m.concrete);const dx=axis===0?-side:0,dz=axis===1?-side:0;B(axis===0?1.35:.13,.13,axis===1?1.35:.13,x+dx*.62,5.76,z+dz*.62,m.iron);B(axis===0?.66:.36,.16,axis===1?.66:.36,x+dx*1.3,5.72,z+dz*1.3,m.iron);B(axis===0?.55:.27,.045,axis===1?.55:.27,x+dx*1.3,5.62,z+dz*1.3,m.lamp);footprint(x,z,.3,.3);count("streetlights");}
 for(let axis=0;axis<2;axis++)for(let v=-210;v<=210;v+=70){
  for(let p=-175;p<=175;p+=70){
   const side=axis===0?1:-1,curb=roadHalf(v)+.37,local=roadRank(v)===2;
   // Pavement is physically continuous between intersection aprons.
   for(const q of [-1,1]){
    const p0=oriented(axis,v,p,q,roadHalf(v)+.18),p1=oriented(axis,v,p,q,(roadHalf(v)+9.2)/2);
    B(axis===0?.29:54,.13,axis===0?54:.29,p0.x,.065,p0.z,m.concrete);
    const walkWidth=9.2-roadHalf(v);B(axis===0?walkWidth:54,.07,axis===0?54:walkWidth,p1.x,.035,p1.z,m.stone);
    for(let k=-24;k<=24;k+=6){const a=oriented(axis,v,p+k,q,(roadHalf(v)+9.2)/2);B(axis===0?walkWidth-.06:.025,.012,axis===0?.025:walkWidth-.06,a.x,.077,a.z,m.concrete);}
    const drain=oriented(axis,v,p-19,q,roadHalf(v)-.28);B(axis===0?.36:1.0,.025,axis===0?1:.36,drain.x,.045,drain.z,m.black);for(let j=-3;j<=3;j++)B(axis===0?.31:.035,.019,axis===0?.035:.31,drain.x+(axis===1?j*.13:0),.061,drain.z+(axis===0?j*.13:0),m.iron);count("storm drains");
   }
   const a=oriented(axis,v,p-12,side,curb);lamp(axis,a.x,a.z,side);
   const h=oriented(axis,v,p+13,-side,curb);hydrant(h.x,h.z);
   if(local){const a=oriented(axis,v,p+1,side,roadHalf(v)+1.05);bench(axis,a.x,a.z);const b=oriented(axis,v,p+3.8,side,roadHalf(v)+1.05);bin(b.x,b.z);
    const rack=oriented(axis,v,p+8,side,roadHalf(v)+1.0);
    for(const shift of [-.85,0,.85]){const x=rack.x+(axis===1?shift:0),z=rack.z+(axis===0?shift:0);for(const side of [-1,1])pole(x+(axis===0?side*.24:0),z+(axis===1?side*.24:0),.76,.045,m.rail);B(axis===0?.56:.09,.09,axis===1?.56:.09,x,.76,z,m.rail);}
    footprint(rack.x,rack.z,axis===0?.62:2,axis===0?2:.62);count("bike racks");
   }
   if((p+175)/70%2===0){const a=oriented(axis,v,p-5,-side,curb);cabinet(a.x,a.z);}
   const man=oriented(axis,v,p+4,1,1.05);C(.46,.46,.025,man.x,.046,man.z,m.iron,16);C(.37,.37,.019,man.x,.066,man.z,m.black,16);for(const k of [-.18,0,.18])B(.47,.016,.04,man.x,.081,man.z+k,m.iron);count("manholes");
   if(p===-105||p===105){const a=oriented(axis,v,p+17,-side,curb);pole(a.x,a.z,2.8);plate(roadRank(v)===0?"SPEED 35":local?"SPEED 20":"SPEED 25",a.x,2.5,a.z,1.05,.88,axis===0?0:1,m.white,"#d4d8cd","#202622");footprint(a.x,a.z,.18,.18);count("speed signs");}
  }
  // Overhead distribution lines: wood poles, crossarms, insulators, sagging conductors, transformer cans.
  if(roadRank(v)!==0){
   const side=axis===0?-1:1,offset=roadHalf(v)+.4,height=axis===0?10.0:11.4,anchors=[];
   for(let p=-190;p<=190;p+=38){
    const a=oriented(axis,v,p,side,offset);
    // Keep pole feet outside intersection crosswalks and maintain a clear walking lane.
    if(Math.abs(p-nearestGrid(p))<12)continue;
    pole(a.x,a.z,height,.18,m.wood);B(axis===0?2.1:.18,.19,axis===0?.18:2.1,a.x,height-.55,a.z,m.wood);
    for(const shift of [-.8,0,.8]){const xx=a.x+(axis===0?shift:0),zz=a.z+(axis===1?shift:0);C(.085,.095,.18,xx,height-.33,zz,m.concrete,8);C(.13,.13,.07,xx,height-.26,zz,m.iron,8);}
    if(anchors.length%3===0){const dx=axis===0?side*.38:0,dz=axis===1?side*.38:0;C(.28,.28,1.1,a.x+dx,height-2,a.z+dz,m.iron);C(.31,.31,.12,a.x+dx,height-1.43,a.z+dz,m.black);B(.5,.11,.5,a.x,height-2.5,a.z,m.iron);count("transformers");}
    footprint(a.x,a.z,.4,.4);anchors.push(a);count("utility poles");
   }
   for(let j=1;j<anchors.length;j++)for(const shift of [-.8,0,.8]){
    const a=anchors[j-1],b=anchors[j];let prev=null;for(let k=0;k<=8;k++){const t=k/8,q={x:a.x+(b.x-a.x)*t+(axis===0?shift:0),z:a.z+(b.z-a.z)*t+(axis===1?shift:0),y:height-.21-1.25*4*t*(1-t)};if(prev)wire(prev,q);prev=q;}count("wire spans");
   }
  }
 }
 for(let x=-210;x<=210;x+=70)for(let z=-210;z<=210;z+=70){
  for(const a of [-1,1])for(const b of [-1,1])B(2.1,.07,2.1,x+a*8,.035,z+b*8,m.stone);
  const sx=x+(x===210?-1:1)*(roadHalf(x)+.4),sz=z+(z===210?-1:1)*11.6;
  pole(sx,sz,3.2);plate(streetName(x,0),sx,3.18,sz,2.1,.39,0,m.green,"#315b49");plate(streetName(z,1),sx,2.75,sz,2.1,.39,1,m.green,"#315b49");footprint(sx,sz,.2,.2);count("street name posts");
  if(stopControlled(x,z)){
   for(let dir=0;dir<4;dir++){
    const d=D[dir],a={x:x-d[0]*11.5+d[1]*(roadHalf(dir%2===0?x:z)+.4),z:z-d[1]*11.5-d[0]*(roadHalf(dir%2===0?x:z)+.4)};
    pole(a.x,a.z,2.65);const border=C(.69,.69,.065,a.x,2.68,a.z,m.white,8),o=C(.62,.62,.085,a.x,2.68,a.z,m.red,8);for(const mesh of [border,o]){mesh.rotation.x=Math.PI/2;mesh.rotation.y=dir%2?Math.PI/2:0;mesh.rotation.order="YXZ";}const n=D[(dir+2)%4];streetLabels.push({text:"STOP",x:a.x+n[0]*.045,y:2.68,z:a.z+n[1]*.045,w:.86,h:.35,dir:(dir+2)%4,bg:"#a73c32",fg:"#ffffff"});plate("ALL WAY",a.x,1.95,a.z,.8,.32,(dir+2)%4,m.white,"#e7e3d8","#252525");footprint(a.x,a.z,.19,.19);count("stop signs");
   }
  }
  // Crossing request posts and bollards are placed on the curb, not the walking path.
  if(!stopControlled(x,z)){const px=x+(x===210?-1:1)*(roadHalf(x)+.4),pz=z+(z===210?-1:1)*13.8;pole(px,pz,1.35,.06);B(.19,.24,.16,px,1.22,pz,m.yellow);B(.12,.12,.19,px,1.22,pz,m.black);footprint(px,pz,.2,.2);count("crossing posts");
  if((x+z)%140===0){const ax=x-(x===-210?-1:1)*(roadHalf(x)+.42),az=z+(z===210?-1:1)*17.6;pole(ax,az,2.9);plate("PED XING",ax,2.7,az,1.3,.8,0,m.yellow,"#d0b760","#292e2c");footprint(ax,az,.2,.2);count("pedestrian signs");}}
 }
 // Subway entrance stair shafts are placed in the open setback at block corners.
 for(const p of metroStations.values()){
  const {x,z,w,l}=p.shaft,depth=3.2;
  for(const side of [-1,1]){
   B(w+.6,.24,.35,x,.16,z+side*(l/2+.175),m.concrete);
   B(w+.1,depth,.17,x,-depth/2,z+side*(l/2+.08),m.stone);
   for(let k=-3;k<=3;k+=1.5)pole(x+k,z+side*(l/2+.23),1.12,.055,m.rail);
   B(w+.5,.07,.075,x,1.1,z+side*(l/2+.23),m.rail);footprint(x,z+side*(l/2+.23),w+.5,.19);
  }
  for(let i=0;i<16;i++){const run=w/16,top=-i*depth/16;B(run+.015,.18,l-.12,x-w/2+run*(i+.5),top-.09,z,m.stone);B(.035,.024,l-.18,x-w/2+run*(i+.05),top+.013,z,m.yellow);}
  B(.18,depth,l+.3,x+w/2+.09,-depth/2,z,m.black);B(.2,1.1,l+.3,x+w/2+.1,.58,z,m.iron);footprint(x+w/2+.1,z,.24,l+.3);
  B(1.5,.2,l,x+w/2-.75,-depth-.1,z,m.stone);
  footprint(x,z,w-.15,l-.12); // surface navigation goes around open shaft
  const px=x-3.45,pz=z+1.55;pole(px,pz,3.2,.11,m.green);B(.52,.52,.52,px,3.15,pz,m.lamp);
  plate("METRO",x,2.9,z+1.55,3.8,.58,0,m.green,"#315b49");for(const xx of [x-1.85,x+1.85])pole(xx,z+1.55,2.9,.07,m.iron);
  plate(p.name.toUpperCase(),x,2.2,z+1.55,3.8,.42,0,m.black,"#252d2b");plate(metroLines.map((l,i)=>l.stops.includes(p)?"M"+(i+1):"").filter(Boolean).join(" / "),x,1.57,z+1.55,1.7,.38,0,m.blue,"#465d78");count("subway entrances");
 }
 merge(g);
}
function attachStreetLabels(sign){
 if(!streetLabelGroup||!streetLabels.length)return;
 for(const p of streetLabels){
  sign(p.text,p.x,p.z,p.y,streetLabelGroup);
  const o=streetLabelGroup.children.at(-1),tex=o?.material?.map,canvas=tex?.image;
  if(!o?.scale||!canvas?.getContext)continue;
  o.scale.set(p.w/12,p.h/3,1);o.rotation.y=[0,Math.PI/2,Math.PI,-Math.PI/2][p.dir];
  canvas.width=512;canvas.height=Math.max(64,Math.round(512*p.h/p.w));const ctx=canvas.getContext("2d");ctx.fillStyle=p.bg;ctx.fillRect(0,0,canvas.width,canvas.height);let size=Math.floor(canvas.height*.73);ctx.font="bold "+size+"px monospace";while(size>10&&ctx.measureText(p.text).width>canvas.width-14){size--;ctx.font="bold "+size+"px monospace";}ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=p.fg;ctx.fillText(p.text,canvas.width/2,canvas.height/2);tex.magFilter=1003;tex.minFilter=1008;tex.generateMipmaps=true;tex.anisotropy=8;tex.needsUpdate=true;
 }
 streetLabels.length=0;
}
export function drawRoads(parent,{box,cyl,merge,mat,group}){
 signalGroups.clear();
 replaceSurface(parent,{box,cyl,merge,mat,group});
 const asphalt=mat(0x373c3b),local=mat(0x454744),edgeMat=mat(0x76786c),white=mat(0xb9b7a2),yellow=mat(0xc6a662),dark=mat(0x28322f),glass=mat(0x576b65),steel=mat(0x68756d),green=mat(0x75946f),red=mat(0xa74c3d);
 const kind=v=>v===0?"avenue":Math.abs(v)===210?"ring":Math.abs(v)===140?"collector":"local";
 const width=v=>kind(v)==="avenue"?13:kind(v)==="ring"?13:kind(v)==="collector"?11.5:8.5;
 for(let v=-210;v<=210;v+=70){const w=width(v),major=kind(v)!=="local";
 for(let p=-175;p<=175;p+=70){box(parent,w,.03,70,v,.005,p,major?asphalt:local);box(parent,70,.03,w,p,.006,v,major?asphalt:local);
 for(const side of [-1,1]){box(parent,.13,.025,56,v+side*(w/2-.25),.032,p,edgeMat);box(parent,56,.025,.13,p,.032,v+side*(w/2-.25),edgeMat);}
 for(let j=-20;j<=20;j+=8){if(kind(v)!=="avenue"&&kind(v)!=="ring"){box(parent,.15,.02,3.8,v,.04,p+j,yellow);box(parent,3.8,.02,.15,p+j,.04,v,yellow);}}
 if(kind(v)==="avenue"||kind(v)==="ring"){for(const q of [-.18,.18]){box(parent,.12,.025,44,v+q,.041,p,yellow);box(parent,44,.025,.12,p,.041,v+q,yellow);}}
 if(kind(v)==="local"){for(const side of [-1,1])for(let j=-18;j<=18;j+=12){box(parent,.09,.025,5.2,v+side*3.8,.043,p+j,white);box(parent,5.2,.025,.09,p+j,.043,v+side*3.8,white);}}
 
 }
 for(let z=-210;z<=210;z+=70){box(parent,roadHalf(v)*2,.031,roadHalf(z)*2,v,.007,z,asphalt);
 for(const s of [-1,1]){for(let k=-roadHalf(v)+.5;k<roadHalf(v);k+=1.2)box(parent,.58,.026,2,v+k,.043,z+s*SIDE,white);for(let k=-roadHalf(z)+.5;k<roadHalf(z);k+=1.2)box(parent,2,.026,.58,v+s*SIDE,.043,z+k,white);
 // Right-hand traffic: a stop bar covers only the incoming lane.
 if(Math.abs(z+s*70)<=210)box(parent,roadHalf(v)-.3,.026,.22,v-s*CAR_LINE,.044,z+s*(SIDE+1.2),white);
 if(Math.abs(v+s*70)<=210)box(parent,.22,.026,roadHalf(z)-.3,v+s*(SIDE+1.2),.044,z+s*CAR_LINE,white);
 }
 if(stopControlled(v,z))continue;
 const ax=v===0||Math.abs(v)===210,az=z===0||Math.abs(z)===210,key=nodeKey(v,z);
 let sig=signalGroups.get(key);if(!sig){sig={x:v,z,phases:[group(),group(),group()]};signalGroups.set(key,sig);parent.add(...sig.phases);}
 // Four approach-facing suspended heads, each on an anchored cantilever mast.
 for(let dir=0;dir<4;dir++){
  const d=D[dir],right={x:d[1],z:-d[0]},start={x:v-d[0]*70,z:z-d[1]*70};if(Math.abs(start.x)>210||Math.abs(start.z)>210)continue;
  const half=roadHalf(dir%2===0?v:z),base={x:v-d[0]*11.2+right.x*(half+.55),z:z-d[1]*11.2+right.z*(half+.55)};
  const head={x:v-d[0]*6.25+right.x*CAR_LINE,z:z-d[1]*6.25+right.z*CAR_LINE};
  const top=7.1,armStart={x:base.x+d[0]*4.95,z:base.z+d[1]*4.95};
  cyl(parent,.13,.21,.35,base.x,.175,base.z,steel);cyl(parent,.12,.17,top,base.x,top/2,base.z,steel,10);
  const arm=(a,b,y)=>{const dx=b.x-a.x,dz=b.z-a.z,o=box(parent,.18,.18,Math.hypot(dx,dz)+.12,(a.x+b.x)/2,y,(a.z+b.z)/2,steel);o.rotation.y=Math.atan2(dx,dz);};
  arm(base,armStart,top);arm(armStart,head,top);box(parent,.11,.52,.11,head.x,top-.26,head.z,steel);
  box(parent,dir%2===0?.55:.35,1.24,dir%2===0?.35:.55,head.x,6.02,head.z,dark);
  for(let lamp=0;lamp<3;lamp++){
   const y=6.43-lamp*.4,fx=head.x-d[0]*.20,fz=head.z-d[1]*.20;
   const rim=cyl(parent,.19,.19,.14,fx,y,fz,dark,12);rim.rotation.x=Math.PI/2;rim.rotation.y=dir%2?Math.PI/2:0;rim.rotation.order="YXZ";
   for(let phase=0;phase<3;phase++){const lit=phase===dir%2?lamp===2:lamp===0,material=lit?(lamp===0?red:green):dark;const lens=cyl(sig.phases[phase],.142,.142,.035,fx-d[0]*.084,y,fz-d[1]*.084,material,12);lens.rotation.x=Math.PI/2;lens.rotation.y=dir%2?Math.PI/2:0;lens.rotation.order="YXZ";}
  }
 }

 }}
 drawInfrastructure(parent,{box,cyl,merge,mat,group});
 // Remove the appearance of through lanes with a raised paved surface and access barriers.
 const pavers=mat(0x777b70),gravel=mat(0x64695d),planter=mat(0x555f54),foliage=mat(0x515c43);
 for(const p of plazas){
  const h=p.dir===1,B=(w,l,x,z,y,hh,m)=>box(parent,h?l:w,hh,h?w:l,p.x+(h?z:x),y,p.z+(h?x:z),m);
  B(8.6,54,0,0,.12,.20,pavers);
  for(let j=-24;j<=24;j+=3)B(8.5,.065,0,j,.226,.022,gravel);
  for(const end of [-25,25])for(const x of [-3,-1.5,0,1.5,3]){
   const xx=p.x+(h?end:x),zz=p.z+(h?x:end);
   cyl(parent,.12,.16,.95,xx,.55,zz,steel,8);streetSolids.push({x:xx,z:zz,w:.36,l:.36});
  }
  for(const side of [-1,1])for(const j of [-15,0,15]){
   const x=side*3.25,xx=p.x+(h?j:x),zz=p.z+(h?x:j);
   B(1.6,2.7,x,j,.43,.62,planter);B(1.35,2.45,x,j,.82,.22,foliage);
   streetSolids.push({x:xx,z:zz,w:h?2.7:1.6,l:h?1.6:2.7});
  }
 }
 inventory["pedestrian plazas"]=plazas.length;
 const seen=new Set(),hRoad=p=>p.dir%2===0?nearestGrid(p.x):nearestGrid(p.z);
 for(let li=0;li<lines.length;li++){const l=lines[li],color=mat(l.color);for(const p of l.stops){const d=D[p.dir],key=p.x+","+p.z;
 if(!p.active||seen.has(key))continue;seen.add(key);
 // Shelter is on the sidewalk; it never intrudes into the traffic lane.
 const rank=roadHalf(hRoad(p)),offset=rank+.75-SIDE,x=p.x+d[1]*offset,z=p.z-d[0]*offset,h=d[0]!==0;
 box(parent,h?6:1.1,.12,h?1.1:6,x,.12,z,dark);
 box(parent,h?6:1.4,.2,h?1.4:6,x,2.75,z,steel);
 for(const a of [-2.6,2.6]){box(parent,.13,2.6,.13,x+d[0]*a-d[1]*.27,1.4,z+d[1]*a+d[0]*.27,steel);}
 box(parent,h?5.2:.12,1.65,h?.12:5.2,x-d[1]*.28,1.65,z+d[0]*.28,glass);
 box(parent,h?3.7:.38,.16,h?.38:3.7,x,.65,z,dark);for(const a of [-1.35,1.35])box(parent,.14,.55,.14,x+d[0]*a,.34,z+d[1]*a,steel);
 for(const a of [-2.6,2.6])streetSolids.push({x:x+d[0]*a-d[1]*.27,z:z+d[1]*a+d[0]*.27,w:.13,l:.13});
 streetSolids.push({x:x-d[1]*.28,z:z+d[0]*.28,w:h?5.2:.12,l:h?.12:5.2},{x,z,w:h?3.7:.38,l:h?.38:3.7});
 const px=x+d[0]*3.2,pz=z+d[1]*3.2;cyl(parent,.08,.1,3.2,px,1.6,pz,steel);streetSolids.push({x:px,z:pz,w:.2,l:.2});
 box(parent,h?.95:.14,.78,h?.14:.95,px,3.05,pz,color);
 const names=lines.filter(l=>l.stops.some(q=>q.active&&q.x===p.x&&q.z===p.z)).map(l=>l.name[0]).join(" ");const face=p.dir%2===0?1:0,normal=D[face];streetLabels.push({text:"BUS "+names,x:px+normal[0]*.08,y:3.05,z:pz+normal[1]*.08,w:.86,h:.64,dir:face,bg:"#334c50",fg:"#f2e9d3"});inventory["bus shelters"]=(inventory["bus shelters"]||0)+1;
 // Paint the stop zone along the curb rather than over the moving lane.
 box(parent,h?10:.25,.027,h?.25:10,p.x-d[1]*1.6,.048,p.z+d[0]*1.6,color);
 if(roadRank(hRoad(p))===0){const xx=p.x-d[1]*(SIDE-5.2),zz=p.z+d[0]*(SIDE-5.2);box(parent,h?14:2.4,.019,h?2.4:14,xx,.028,zz,mat(0x4e5551));for(const k of [-6.8,6.8])box(parent,h?.18:2.4,.024,h?2.4:.18,xx+d[0]*k,.051,zz+d[1]*k,white);inventory["bus pullouts"]=(inventory["bus pullouts"]||0)+1;}
 }}
 merge(parent);for(const s of signalGroups.values())for(const phase of s.phases)merge(phase);updateSignals(420);
}
// Authored repeatable masonry/concrete texture: no painted windows competing with geometry.
const finishedFacade=new WeakSet();
function finishFacade(material,style){
 if(!material?.map?.image?.getContext||finishedFacade.has(material))return;
 finishedFacade.add(material);const texture=material.map,canvas=texture.image,ctx=canvas.getContext("2d");
 canvas.width=canvas.height=128;let seed=24617+style*7727;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const colors=[[119,119,106],[106,115,111],[129,113,100],[132,129,115]],rgb=colors[style%4],im=ctx.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const mortar=style===2&&(y%16<2||(x+(Math.floor(y/16)%2)*16)%32<2);
  const panel=style!==2&&(x%64<1||y%64<1),weather=(rand()-.5)*19+Math.sin(x*.12+y*.06)*3+(y%64>57?-8:0),n=(y*128+x)*4;
  for(let c=0;c<3;c++)im.data[n+c]=clamp(rgb[c]+weather-(mortar?28:panel?23:0),0,255);
  im.data[n+3]=255;
 }
 ctx.putImageData(im,0,0);texture.repeat?.set(1,1);texture.magFilter=1003;texture.minFilter=1008;texture.generateMipmaps=true;texture.anisotropy=4;texture.needsUpdate=true;
}
function worldUV(mesh,x,y,z){
 const a=mesh?.geometry?.attributes,p=a?.position,n=a?.normal,uv=a?.uv;if(!p||!n||!uv)return;
 for(let i=0;i<p.count;i++){
  const px=p.getX(i)+x,py=p.getY(i)+y,pz=p.getZ(i)+z;
  if(Math.abs(n.getY(i))>.5)uv.setXY(i,px/4,pz/4);else if(Math.abs(n.getX(i))>.5)uv.setXY(i,pz/4,py/4);else uv.setXY(i,px/4,py/4);
 }
 uv.needsUpdate=true;
}
function furnishInterior(b,inside,{box,cyl,roof,steel,white,dark,trim,glass,door}){
 const {x,z,w,l}=b;
 const B=(a,h,d,dx,y,dz,m)=>box(inside,a,h,d,x+dx,y,z+dz,m);
 const C=(a,bb,h,dx,y,dz,m)=>cyl(inside,a,bb,h,x+dx,y,z+dz,m,8);
 const table=(dx,dz,ww=3.1,ll=1.5)=>{B(ww,.15,ll,dx,1.38,dz,roof);for(const sx of [-1,1])for(const sz of [-1,1])B(.12,.8,.12,dx+sx*(ww/2-.22),.94,dz+sz*(ll/2-.2),steel);};
 const chair=(dx,dz)=>{B(.56,.12,.58,dx,1.0,dz,steel);B(.56,.5,.12,dx,1.3,dz+.24,steel);for(const sx of [-1,1])for(const sz of [-1,1])B(.07,.46,.07,dx+sx*.21,.76,dz+sz*.21,dark);};
 const shelf=(dx,dz,ww=3.2)=>{for(const side of [-1,1])B(.15,2.2,1.0,dx+side*ww/2,1.65,dz,steel);for(let y=.7;y<2.8;y+=.68){B(ww,.1,.95,dx,y,dz,steel);for(let j=0;j<5;j++)B(.35,.35,.45,dx-ww*.36+j*ww*.18,y+.23,dz,j%2?trim:dark);}};
 const bed=(dx,dz)=>{B(1.15,.32,2.1,dx,.72,dz,steel);B(1.07,.2,2.02,dx,.98,dz,white);B(.92,.11,.46,dx,1.14,dz-.69,white);B(1.07,.10,1.32,dx,1.12,dz+.33,trim);B(1.2,.85,.13,dx,.94,dz-1.07,roof);};
 if(b.type==="Housing"){
  for(const side of [-1,1]){bed(side*(w/2-2.1),-l/2+4.7);bed(side*(w/2-2.1),l/2-5);shelf(side*(w/2-2.2),0,2.4);}
  table(0,3.5,3,1.8);chair(0,5);chair(0,2);B(3.3,1.1,.88,-4,.99,-5,steel);B(3.3,.10,.94,-4,1.59,-5,white);B(.55,.09,.55,-4,1.66,-5,dark);C(.24,.24,.16,-3,1.71,-5,steel);
 }else if(b.type==="Clinic"){
  for(let dz=-l/2+6;dz<l/2-3;dz+=7){bed(-w/2+3,dz);B(.9,1.0,.6,-w/2+4.4,1,dz,white);B(.16,2.0,3.2,-w/2+5.2,1.55,dz,glass);}
  table(w/2-4,-6,4,2);chair(w/2-4,-4.5);shelf(w/2-3,5);
 }else if(b.type==="Factory"||b.type==="Warehouse"){
  for(let dz=-l/2+5;dz<l/2-3;dz+=7)for(const side of [-1,1]){
   const dx=side*(w/2-4);
   if(b.type==="Warehouse"){shelf(dx,dz,4.0);B(2.0,.17,1.5,dx,.61,dz+2,roof);for(let j=0;j<3;j++)B(.63,.72,.9,dx+(j-1)*.66,1.05,dz+2,trim);}
   else{B(3,1.45,2.8,dx,1.25,dz,steel);B(2.75,.16,2.65,dx,2.03,dz,dark);C(.68,.68,.25,dx,2.22,dz,trim);B(.68,.6,.15,dx+1.1,1.6,dz-1.48,glass);}
  }
 }else if(b.type==="Market"){
  for(let dz=-l/2+5;dz<l/2-3;dz+=6){shelf(-w/2+3.5,dz,4.6);shelf(w/2-3.5,dz,4.6);}
  table(0,-l/2+4,4,1.65);B(.48,.35,.40,.8,1.66,-l/2+4,dark);
 }else{
  for(let dz=-l/2+5;dz<l/2-3;dz+=7){for(const side of [-1,1]){const dx=side*(w/2-4);table(dx,dz,3.8,1.6);chair(dx,dz+1.2);B(.68,.48,.12,dx,1.70,dz-.32,glass);B(.25,.13,.26,dx,1.49,dz-.28,steel);}}
  shelf(0,l/2-3,4.2);
 }
}
export function build(b,parent,{group,box,cyl,merge,sign,materials,colliders,registry}){
 attachStreetLabels(sign);
 const [facades,roof,steel,walk,dark,white,trim,glass,rust,black,door]=materials;
 replaceBlock(parent,b,box,group,merge,walk);
 const base=group(),shell=group(),inside=group();parent.add(base,shell,inside);
 const {x,z,w,l,h}=b, a=b.architecture;
 const f=facades[(b.i*3+b.j*5+b.k+b.id)%facades.length];
 finishFacade(f,b.id%4);
 const masonry=b.id%3===0?rust:b.id%3===1?f:steel;
 const walls=[];
 const solid=(ww,hh,ll,xx=x,zz=z,y=0,m=f)=>{const mesh=box(shell,ww,hh,ll,xx,y+hh/2+.5,zz,m);if(m===f)worldUV(mesh,xx,y+hh/2+.5,zz);colliders.push({x:xx,z:zz,w:ww,l:ll,h:y+hh+.5});if(y===0)solids.push({x:xx,z:zz,w:ww,l:ll});walls.push({x:xx,z:zz,w:ww,l:ll,bottom:y+.5,top:y+hh+.5});};
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
 if(!["Covered market","Duplex courts","Row residences","Night bazaar","Corner shops"].includes(a)&&b.type!=="Warehouse"){
 wallDoor(frontage.x,front,2.6);
 const entrance={x:frontage.x,z:front-.75};
 if(b.door&&offRoad(entrance.x,entrance.z)&&!inSolid(entrance.x,entrance.z)){b.door.x=entrance.x;b.door.z=entrance.z;entranceAnchors.set(b.id,{...entrance});}
 }
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
 furnishInterior(b,inside,{box,cyl,roof,steel,white,dark,trim,glass,door});
 inside.visible=false;merge(base);merge(inside);const labels=shell.children.filter(o=>o.material?.isMeshBasicMaterial);for(const o of labels)shell.remove(o);merge(shell);for(const o of labels)shell.add(o);
 registry.push({b,r:shell,interior:inside});
}
// The existing LOWER view becomes a rail cutaway, not the legacy decorative grid.
let undergroundBuilt=false;const trainMeshes=new Map();
let explorer=null,explorerMesh=null;
function buildUnderground(){
 if(undergroundBuilt||!lowerRoot||!streetKit)return;
 undergroundBuilt=true;const {group,box,cyl,merge,mat}=streetKit;
 for(const child of [...lowerRoot.children]){lowerRoot.remove(child);child.traverse?.(o=>{if(o.isMesh)o.geometry.dispose()});}
 const shell=group();lowerRoot.add(shell);
 const concrete=mat(0x777d76),tile=mat(0x969b8c),bed=mat(0x313936),rail=mat(0x9baba7),sleeper=mat(0x514942),yellow=mat(0xc8a052),dark=mat(0x242b29),light=mat(0xd6dfcf);
 box(shell,438,.25,438,0,-5.4,0,dark);
 for(let li=0;li<2;li++){
  const horizontal=li===1,y=li===0?.12:-3.0;
  const put=(along,cross,h,w,hh,l,m)=>box(shell,horizontal?l:w,hh,horizontal?w:l,horizontal?along:cross,y+h,horizontal?cross:along,m);
  put(0,0,-.17,9,.34,310,bed);
  for(const lane of [-1,1]){
   for(const r of [-.66,.66])put(0,lane*1.55+r,.13,.085,.10,310,rail);
   for(let p=-154;p<=154;p+=1.65)put(p,lane*1.55,.01,2.05,.13,.24,sleeper);
   put(0,lane*4.6,.42,.28,1.25,310,concrete);
  }
  for(const p of metroLines[li].stops){
   const along=horizontal?p.nx:p.nz;
   for(const side of [-1,1]){
    put(along,side*5.5,.55,3.0,.65,23,tile);
    put(along,side*4.07,.9,.25,.045,23,yellow);
    for(let j=-9;j<=9;j+=6){put(along+j,side*6.2,1.65,.21,2.3,.21,concrete);put(along+j,side*5.4,2.85,2.1,.12,.25,light);}
    for(let j of [-6,6]){put(along+j,side*6.15,1.02,.48,.16,2.7,sleeper);put(along+j,side*6.36,1.37,.12,.6,2.7,concrete);}
   }
   // Stairs to the surface, shown as an open station concourse connection.
   put(along,8.4,.23,3,.4,6,tile);
   for(let i=0;i<10;i++)put(along-2.5+i*.5,8.5,.45+i*.15,2.6,.18,.52,tile);
  }
 }
 merge(shell);
 for(let i=0;i<4;i++){
  const g=group(),paint=mat(i<2?0x82b9af:0xcc9b64),body=mat(0xa6aaa0),glass=mat(0x344f52);
  for(const z of [-5.4,5.4]){
   box(g,2.45,1.85,10.3,0,1.24,z,body);box(g,2.47,.32,10.35,0,.72,z,paint);box(g,2.35,.16,10.15,0,2.23,z,paint);
   for(const side of [-1,1])for(let j=-4;j<=4;j+=2)box(g,.07,.68,1.32,side*1.23,1.65,z+j,glass);
   box(g,2.1,.69,.09,0,1.62,z+5.17,glass);box(g,2.1,.69,.09,0,1.62,z-5.17,glass);
   for(const side of [-1,1]){box(g,.36,.17,.09,side*.78,.74,z+5.23,light);box(g,.36,.17,.09,side*.78,.74,z-5.23,light);}
  }
  box(g,1.7,1.25,.55,0,1.1,0,dark);merge(g);lowerRoot.add(g);trainMeshes.set(i,g);
 }
}
// Independent station explorer. Navigation is bounded to real platform geometry,
 // and boarding uses the existing scheduled train rather than a parallel timetable.
export function metroChoices(){
 return metroLines.flatMap((l,line)=>l.stops.flatMap((p,stop)=>[-1,1].map(side=>({line,stop,side,label:l.name.slice(0,2)+" / "+p.name+" / "+(side<0?"A":"B")}))));
}
function platformPoint(line,stop,side,along=0,cross=5.5){
 const p=metroLines[line].stops[stop];return {x:p.nx+(line===0?side*cross:along),y:(line===0?.12:-3)+.875,z:p.nz+(line===0?along:side*cross)};
}
function ensureExplorer(){
 if(explorerMesh||!lowerRoot||!streetKit)return;
 const {group,box,cyl,mat}=streetKit;const g=group(),coat=mat(0x8c9b9b),skin=mat(0xcaa17f),hair=mat(0x35332e),pants=mat(0x414845),boots=mat(0x262d29);
 const body=cyl(g,.23,.32,.65,0,1.16,0,coat,7);cyl(g,.17,.19,.29,0,1.64,0,skin,8);cyl(g,.19,.185,.12,0,1.8,-.02,hair,8);
 const legs=[-1,1].map(i=>{const part=group();g.add(part);part.position.set(i*.15,.88,0);cyl(part,.11,.085,.38,0,-.19,0,pants,7);cyl(part,.085,.075,.34,0,-.54,0,pants,7);box(part,.18,.14,.32,0,-.73,.07,boots);return part;});
 const arms=[-1,1].map(i=>{const part=group();g.add(part);part.position.set(i*.31,1.38,0);cyl(part,.095,.075,.49,0,-.245,0,coat,7);cyl(part,.07,.07,.16,0,-.56,0,skin,7);return part;});
 lowerRoot.add(g);g.visible=false;explorerMesh={g,legs,arms};
}
export function metroEnter(line=0,stop=2,side=1){
 buildUnderground();ensureExplorer();if(!explorerMesh||!metroLines[line]?.stops[stop]||![1,-1].includes(side))return false;
 explorer={line,stop,side,along:0,cross:5.5,heading:0,distance:0,train:null};
 explorerMesh.g.visible=true;return true;
}
export function metroExit(){explorer=null;if(explorerMesh)explorerMesh.g.visible=false;}
export function metroExploreInfo(w){
 if(!explorer)return null;const e=explorer,t=e.train===null?null:w.metro.trains.find(t=>t.id===e.train);
 const docked=t&&t.remaining<=0;
 const candidate=e.train===null?w.metro.trains.find(t=>t.line===e.line&&t.at===e.stop&&t.remaining<=0&&t.dwell>0&&(e.line===0?t.dir:-t.dir)===e.side):null;
 return {label:metroLines[e.line].name+" / "+metroLines[e.line].stops[e.stop].name,train:t?.id??null,canBoard:!!candidate&&Math.abs(e.along)<7.5&&e.cross<5.05,canExit:!!docked,platform:e.side<0?"A":"B"};
}
export function metroBoard(w){
 if(!explorer)return false;const e=explorer,info=metroExploreInfo(w);
 if(e.train!==null){if(!info.canExit)return false;const t=w.metro.trains.find(t=>t.id===e.train);e.stop=t.at;e.side=e.line===0?t.dir:-t.dir;e.train=null;e.along=0;e.cross=4.35;return true;}
 if(!info.canBoard)return false;const t=w.metro.trains.find(t=>t.line===e.line&&t.at===e.stop&&t.remaining<=0&&t.dwell>0&&(e.line===0?t.dir:-t.dir)===e.side);
 e.train=t.id;return true;
}
export function metroExploreTick(w,dt,dx,dz){
 if(!explorer||!explorerMesh)return null;const e=explorer,{g,legs,arms}=explorerMesh;
 if(e.train!==null){
  const t=w.metro.trains.find(t=>t.id===e.train);if(!t){metroExit();return null;}e.stop=t.at;updateTrainMeshes(w);
  const train=trainMeshes.get(t.id);g.visible=false;
  if(train)return {x:train.position.x,y:train.position.y+1.3,z:train.position.z};return platformPoint(e.line,e.stop,e.side,e.along,e.cross);
 }
 const norm=Math.max(1,Math.hypot(dx,dz)),speed=3.1*clamp(dt,0,.06),da=(e.line===0?dz:dx)*speed/norm,dc=(e.line===0?dx:dz)*e.side*speed/norm;
 const old=platformPoint(e.line,e.stop,e.side,e.along,e.cross);
 // Account for body radius at the actual platform edges and furniture against rear wall.
 e.along=clamp(e.along+da,-10.95,10.95);e.cross=clamp(e.cross+dc,4.38,6.15);
 const p=platformPoint(e.line,e.stop,e.side,e.along,e.cross),travel=Math.hypot(p.x-old.x,p.z-old.z);e.distance+=travel;
 if(travel>.001)e.heading=Math.atan2(p.x-old.x,p.z-old.z);
 const stride=travel>.001?Math.sin(e.distance*6.2)*.42:0;
 g.visible=true;g.position.set(p.x,p.y,p.z);g.rotation.y=e.heading;
 for(let i=0;i<2;i++){legs[i].rotation.x=(i===0?1:-1)*stride;arms[i].rotation.x=(i===0?-1:1)*stride*.78;}
 return p;
}
function updateTrainMeshes(w){
 if(!undergroundBuilt)return;
 for(const t of w.metro.trains){const m=trainMeshes.get(t.id);if(!m)continue;const l=metroLines[t.line],a=l.stops[t.at],b=l.stops[t.at+t.dir]||a,r=t.remaining>0?clamp(1-t.remaining/2.65,0,1):0;
  const x=a.nx+(b.nx-a.nx)*r,z=a.nz+(b.nz-a.nz)*r;
  m.position.set(x+(t.line===0?t.dir*1.55:0),t.line===0?.2:-2.92,z+(t.line===1?-t.dir*1.55:0));m.rotation.y=t.line===0?(t.dir===1?0:Math.PI):(t.dir===1?Math.PI/2:-Math.PI/2);
 }
}
// Reuse the existing Three.js instancing pipeline, adding identity-stable proportions,
// clothing and accessories. Pose from real movement rather than the presence of a route.
let peopleRenderer=null;
function appearance(id){
 const rand=n=>{let v=Math.imul(id+1,0x9e3779b1)^Math.imul(n+11,0x85ebca6b);v^=v>>>16;v=Math.imul(v,0x7feb352d);v^=v>>>15;return (v>>>0)/4294967296;};
 const pick=(a,n)=>a[Math.floor(rand(n)*a.length)];
 return {height:.83+rand(1)*.32,width:.78+rand(2)*.34,skin:pick([0xe3bc98,0xc79572,0xa76d4c,0x704732,0x4d3128,0xf0cfb0],3),hair:pick([0x2d2421,0x4e3528,0x776347,0xb2a183,0x9a6946,0x302e2d],4),shirt:pick([0x82776b,0x3d6571,0x6d504c,0x7b835a,0xa29b83,0x484d65,0x343b36,0xc1b193,0x6d6b80,0x8f693d,0x567567,0x9a5554],5),pants:pick([0x393d3b,0x565949,0x424d5e,0x756553,0x272c32,0x81786a],6),shoes:pick([0x292725,0x544335,0x7c7565,0x3f4648],7),style:Math.floor(rand(8)*6),bag:rand(9)<.32,phase:rand(10)*Math.PI*2};
}
const profiles=Array.from({length:1000},(_,i)=>appearance(i));
// Low-poly body topology with tapered contours and connected two-segment limbs.
function bodyGeometry(template,rings,sides=8){
 const geometry=template.clone(),values=[];
 const point=(r,i)=>{const [y,x,z,offset=0]=r,t=2*Math.PI*i/sides;return [Math.sin(t)*x,y,Math.cos(t)*z+offset];};
 const tri=(a,b,c)=>values.push(...a,...b,...c);
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){
  const a=point(rings[j],i),b=point(rings[j],i+1),c=point(rings[j+1],i+1),d=point(rings[j+1],i);tri(a,b,c);tri(a,c,d);
 }
 for(const [r,top] of [[rings[0],false],[rings.at(-1),true]])for(let i=0;i<sides;i++){
  const a=point(r,i),b=point(r,i+1),c=[0,r[0],r[3]||0];if(top)tri(c,a,b);else tri(c,b,a);
 }
 const Attr=template.attributes.position.constructor;geometry.setIndex(null);
 for(const k of Object.keys(geometry.attributes))geometry.deleteAttribute(k);
 geometry.setAttribute("position",new Attr(new Float32Array(values),3));geometry.computeVertexNormals();geometry.clearGroups();geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
function installBodyGeometry(base,accessories,parent){
 if(!base[0]?.geometry?.attributes?.position)return null;
 const template=base[0].geometry,make=(r,n)=>bodyGeometry(template,r,n);
 const limb=(length,w0,w1,d)=>make([[-length/2,w0,d*.82],[-length*.34,w0*1.05,d],[length*.32,w1,d*1.02],[length/2,w1*.91,d*.91]],7);
 const torso=make([[-.32,.205,.132],[-.22,.25,.15],[-.02,.236,.16],[.18,.285,.145],[.26,.24,.12],[.32,.115,.10]],8);
 const head=make([[-.18,.075,.085,.035],[-.13,.125,.11,.028],[-.055,.166,.151,.018],[.045,.178,.157],[.13,.148,.132,-.008],[.178,.085,.075,-.01]],10);
 const shoe=make([[-.07,.101,.20,.045],[-.035,.105,.205,.045],[.03,.099,.18,.035],[.075,.075,.108,-.02]],8);
 for(let i=0;i<8;i++)base[i].geometry=i===0?torso:i===1?head:i===2||i===3?limb(.37,.103,.129,.104):i===4||i===5?limb(.29,.079,.105,.09):shoe;
 const mat=base[0].material.clone();mat.color.setHex(0xffffff);mat.map=null;
 const extra=geo=>{const m=new base[0].constructor(geo,mat,base[0].instanceMatrix.count);m.count=0;m.frustumCulled=false;parent.add(m);return m;};
 const calf=limb(.37,.068,.098,.091),forearm=limb(.27,.057,.078,.071),hand=make([[-.085,.035,.035],[-.055,.053,.044],[.038,.051,.038],[.08,.039,.034]],7);
 const neck=limb(.15,.083,.084,.076),ear=make([[-.055,.025,.024],[0,.045,.027],[.055,.023,.023]],6);
 const eye=make([[-.015,.025,.009],[.015,.025,.009]],6),mouth=make([[-.011,.039,.012],[.011,.039,.012]],6);
 accessories[0].geometry=make([[-.04,.177,.153,-.012],[.02,.182,.159,-.015],[.09,.155,.137,-.013],[.14,.091,.083,-.015]],10);
 return {calves:[extra(calf),extra(calf)],forearms:[extra(forearm),extra(forearm)],hands:[extra(hand),extra(hand)],neck:extra(neck),ears:[extra(ear),extra(ear)],eyes:[extra(eye),extra(eye)],mouth:extra(mouth)};
}
function kneeJoint(hip,ankle,L=.37){
 const dy=ankle.y-hip.y,dz=ankle.z-hip.z,d=Math.max(.001,Math.hypot(dy,dz)),bend=Math.sqrt(Math.max(0,L*L-d*d/4));
 return {y:(hip.y+ankle.y)/2+dz/d*bend,z:(hip.z+ankle.z)/2-dy/d*bend};
}
function renderPeople(parent,kit){
 if(!currentWorld||!parent?.children)return;
 if(!peopleRenderer){
  const base=parent.children.filter(o=>o.isInstancedMesh).slice(0,8);
  if(base.length!==8)return;
  const {group,box,cyl,mat}=kit,tmp=group();
  const accessories=[
   cyl(tmp,.19,.21,.13,0,0,0,mat(0xffffff),8),
   box(tmp,.43,.08,.31,0,0,0,mat(0xffffff)),
   box(tmp,.24,.34,.13,0,0,0,mat(0xffffff)),
   box(tmp,.07,.12,.07,0,0,0,mat(0xffffff)),
   box(tmp,.14,.18,.14,0,0,0,mat(0xffffff)),
   box(tmp,.38,.16,.12,0,0,0,mat(0xffffff))
  ].map(o=>{const m=new base[0].constructor(o.geometry,o.material,base[0].instanceMatrix.count);m.count=0;m.frustumCulled=false;parent.add(m);return m;});
  for(const i of [1,2,3,6,7]){base[i].material=base[i].material.clone();base[i].material.color.setHex(0xffffff);}
  const anatomy=installBodyGeometry(base,accessories,parent);
  peopleRenderer={base,accessories,anatomy,mat:base[0].matrix.clone(),pos:base[0].position.clone(),rot:base[0].rotation.clone(),quat:base[0].quaternion.clone(),scale:base[0].scale.clone(),color:base[0].material.color.clone()};
 }
 const {base,accessories,anatomy,mat:M,pos,rot,quat,scale,color}=peopleRenderer,w=currentWorld;
 const extra=anatomy?[...anatomy.calves,...anatomy.forearms,...anatomy.hands,anatomy.neck,...anatomy.ears,...anatomy.eyes,anatomy.mouth]:[];
 const bins=new Map();for(const c of w.citizens){if(!walking(c)&&c.id!==w.possessed)continue;const key=Math.round(c.x*100)+","+Math.round(c.z*100);bins.set(key,c);}
 const put=(mesh,i,x,y,z,heading,rx,sx,sy,sz,hex)=>{pos.set(x,y,z);rot.set(rx,heading,0,"YXZ");quat.setFromEuler(rot);scale.set(sx,sy,sz);M.compose(pos,quat,scale);mesh.setMatrixAt(i,M);color.setHex(hex);mesh.setColorAt(i,color);};
 const n=base[0].count,now=typeof performance!=="undefined"?performance.now()/1000:0;
 for(let i=0;i<n;i++){
  base[0].getMatrixAt(i,M);const x=M.elements[12],z=M.elements[14],c=bins.get(Math.round(x*100)+","+Math.round(z*100));if(!c){for(const a of [...accessories,...extra])put(a,i,x,-20,z,0,0,.001,.001,.001,0);continue;}
  const a=profiles[c.id]||appearance(c.id),h=a.height,wide=a.width,heading=c.heading||0,move=c.walkingNow,phase=(c.walkDistance||0)*5.8+a.phase,cycle=move?Math.sin(phase):0,step=cycle*.38,bob=0;
  const part=(mesh,side,y,front,rx,sx,sy,sz,col)=>put(mesh,i,x+Math.cos(heading)*side+Math.sin(heading)*front,y*h+bob,z-Math.sin(heading)*side+Math.cos(heading)*front,heading,rx,sx,sy,sz,col);
  part(base[0],0,1.08,0,0,wide,h,a.style===1?1.15:.96,a.shirt);
  part(base[1],0,1.59,0,0,.95,h,.96,a.skin);
  const segment=(mesh,side,a,b,length,w,col)=>{const dy=a.y-b.y,dz=a.z-b.z;part(mesh,side,(a.y+b.y)/2,(a.z+b.z)/2,Math.atan2(dz,dy),w,h*Math.hypot(dy,dz)/length,1,col);};
  for(const sign of [-1,1]){
   const j=sign<0?0:1,theta=phase+(j?Math.PI:0),swing=move?Math.sin(theta):0,lift=move?Math.max(0,Math.cos(theta))*.12:0;
   const hip={y:.82,z:0},ankle={y:.15+lift,z:.25*swing},knee=kneeJoint(hip,ankle);
   const side=sign*.145*wide;
   if(anatomy){
    segment(base[2+j],side,hip,knee,.37,wide,a.pants);segment(anatomy.calves[j],side,knee,ankle,.37,wide,a.pants);
    part(base[6+j],side,.075+lift,ankle.z,0,.94,h,.97,a.shoes);
    const shoulder={y:1.33,z:0},elbow={y:1.06,z:-swing*.14},wrist={y:.81,z:-swing*.24+.045},armSide=sign*.31*wide;
    segment(base[4+j],armSide,shoulder,elbow,.29,.94,a.shirt);segment(anatomy.forearms[j],armSide,elbow,wrist,.27,.94,a.style===0?a.skin:a.shirt);
    part(anatomy.hands[j],armSide,wrist.y-.06,wrist.z,0,1,h,1,a.skin);
    part(anatomy.ears[j],sign*.165,1.59,-.015,0,1,h,1,a.skin);
    part(anatomy.eyes[j],sign*.072,1.615,.151,0,1,h,1,0x292a25);
   }else {part(base[2+j],side,.48,swing*.1,swing*.38,wide,h,1,a.pants);part(base[4+j],sign*.30*wide,1.02,-swing*.1,-swing*.38,.88,h,.9,a.shirt);part(base[6+j],side,.12,swing*.16+.04,0,.9,h,.97,a.shoes);}
  }
  if(anatomy){part(anatomy.neck,0,1.42,0,0,1,h,1,a.skin);part(anatomy.mouth,0,1.51,.145,0,1,h,1,0x714a3d);}
  part(accessories[0],0,1.70,-.005,0,a.style===3?1.13:1.02,a.style===4?1.5:.85,1,a.hair);
  part(accessories[1],0,1.78,a.style===2?.06:0,0,a.style===2?1:0.001,a.style===2?1:.001,a.style===2?1:.001,a.shirt);
  part(accessories[2],0,1.1,-.29,0,a.bag?1:.001,a.bag?1:.001,a.bag?1:.001,a.style===4?0x6d543d:0x444e46);
  part(accessories[3],0,1.575,.16,0,.67,.52,.65,a.skin);
  part(accessories[4],a.style===5?.34:0,a.style===5?.8:-4,.06,0,a.style===5?1:.001,a.style===5?1:.001,a.style===5?1:.001,0x604c39);
  part(accessories[5],0,1.49,-.12,0,a.style===4?1:.001,a.style===4?1:.001,a.style===4?1:.001,a.hair);
 }
 for(const m of [...base,...accessories,...extra]){m.count=n;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}
}
const busMeshes=new Map();
export function drawBuses(cars,position,parent,{group,box,cyl,mat}){
 buildUnderground();if(currentWorld)updateTrainMeshes(currentWorld);renderPeople(parent,{group,box,cyl,mat});
 for(const b of cars){if(!b.bus)continue;let m=busMeshes.get(b.id);if(!m){m=group();const paint=mat(lines[b.line].color),body=mat(0x9b9c87),window=mat(0x344d51),rubber=mat(0x222722),lights=mat(0xe8dec1),tail=mat(0xa74b40);
 box(m,2.35,1.75,8.1,0,1.48,0,body);box(m,2.42,.4,8.2,0,.78,0,paint);box(m,2.3,.18,8.1,0,2.43,0,paint);if(b.line>=4){box(m,1.8,.3,4,0,2.68,-.5,window);box(m,2.03,.33,.09,0,2.33,4.14,paint);}
 box(m,2.05,.75,.08,0,1.94,4.08,window);box(m,2.05,.7,.08,0,1.94,-4.08,window);
 for(const s of [-1,1]){for(let z=-2.9;z<=2.9;z+=1.16)box(m,.055,.73,.96,s*1.185,1.95,z,window);
 for(const z of [-2.7,2.65]){const wheel=cyl(m,.48,.48,.33,s*1.12,.5,z,rubber,12);wheel.rotation.z=Math.PI/2;}
 box(m,.55,.2,.08,s*.72,.98,4.12,lights);box(m,.45,.2,.08,s*.72,.98,-4.12,tail);}
 box(m,.07,1.55,1.1,1.19,1.42,2.45,window);parent.add(m);busMeshes.set(b.id,m);}
 const p=position(b),r=carRect(b);m.position.set(r.x,0,r.z);m.rotation.y=p.a;
 }}
