// Sector Zero: urban fabric and transit. Keep the original simulation's 70-unit node grid.
const D=[[0,1],[1,0],[0,-1],[-1,0]], N=70, edge=210;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const roadRank=v=>v===0||Math.abs(v)===210?0:Math.abs(v)===140?1:2;
const congestion=new Map(),keyOf=(x,z,d)=>x+","+z+","+d;
const SIDE=8,PERSON=.72,STOP=20,CAR_LINE=2.5;
const nearestGrid=v=>clamp(Math.round(v/70)*70,-210,210);
const roadHalf=v=>[6.5,5.75,4.25][roadRank(v)];
const phaseLocks=new Set(),junctions=new Map();
const nodeKey=(x,z)=>x+","+z;
const solids=[],streetSolids=[];
const stopControlled=(x,z)=>roadRank(x)===2&&roadRank(z)===2;
const streetLabels=[];let streetLabelGroup=null;
const inventory={};
const walkState=new WeakMap();
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
const trees=new Map();
function tree(goal){
 const target=goal.iz*14+goal.ix;if(trees.has(target))return trees.get(target);
 const n=196,cost=Array(n).fill(Infinity),next=Array(n).fill(-1),used=new Uint8Array(n);cost[target]=0;
 for(let j=0;j<n;j++){let v=-1;for(let i=0;i<n;i++)if(!used[i]&&(v<0||cost[i]<cost[v]))v=i;if(v<0)break;used[v]=1;const x=v%14,z=Math.floor(v/14);
 for(const [dx,dz] of D){const a=x+dx,b=z+dz;if(a<0||a>13||b<0||b>13)continue;const k=b*14+a,step=Math.abs(coord[x]-coord[a])+Math.abs(coord[z]-coord[b]);const c=cost[v]+step+(step===SIDE*2?9:0);if(c<cost[k]){cost[k]=c;next[k]=v;}}}
 const result={cost,next};trees.set(target,result);return result;
}
function pedestrianPath(from,to){
 let best=null;
 for(const a of cornerOptions(from))for(const b of cornerOptions(to)){const t=tree(b.corner),start=a.corner.iz*14+a.corner.ix,cost=a.cost+b.cost+t.cost[start];if(!best||cost<best.cost)best={a,b,t,start,cost};}
 const {a,b,t,start}=best,route=[a.projected,a.corner];let k=start;
 for(let j=0;j<196&&t.next[k]>=0;j++){k=t.next[k];route.push({x:coord[k%14],z:coord[Math.floor(k/14)]});}
 route.push(b.projected,{x:to.x,z:to.z});
 const out=[];let prev={x:from.x,z:from.z},last=prev;
 const push=(p,metadata)=>{if(dist(last,p)<.001)return;out.push({x:p.x,z:p.z,...(metadata?{cross:metadata}:{})});last=p;};
 for(const p of route){if(dist(prev,p)<.001)continue;
  const dx=p.x-prev.x,dz=p.z-prev.z,horizontal=Math.abs(dz)<.001,vertical=Math.abs(dx)<.001;
  const cross=crossing(prev,p),lane=.62;
  const sidewalk=horizontal&&coord.some(v=>Math.abs(v-p.z)<.001)||vertical&&coord.some(v=>Math.abs(v-p.x)<.001);
  if(sidewalk&&Math.abs(dx)+Math.abs(dz)>2.5){
   const ox=vertical?Math.sign(dz)*lane:0,oz=horizontal?-Math.sign(dx)*lane:0;
   const a={x:prev.x+ox,z:prev.z+oz},b={x:p.x+ox,z:p.z+oz};
   push(a);push(b,cross?{...cross,a,b}:null);
  }else push(p,cross);
  prev=p;
 }
 push({x:to.x,z:to.z});return out;
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
 const dirs=[0,1,2,3].filter(d=>Math.abs(x+D[d][0]*70)<=210&&Math.abs(z+D[d][1]*70)<=210&&(!b.bus||x+D[d][0]*70===dest.x&&z+D[d][1]*70===dest.z));
 dirs.sort((a,c)=>carScore(x,z,a,dest.x,dest.z,b.dir)-carScore(x,z,c,dest.x,dest.z,b.dir));
 return {dirs,dest,arrived};
}
function driveTraffic(w,dt){
 const cars=w.cars,lanes=new Map(),ped=w.citizens.filter(walking);
 const key=b=>keyOf(b.x,b.z,b.dir);
 const add=b=>{const k=key(b);if(!lanes.has(k))lanes.set(k,[]);lanes.get(k).push(b);};
 for(const b of cars)add(b);
 for(const [k,b] of junctions)if(!cars.includes(b)||!((nodeKey(b.x,b.z)===k&&b.progress<14)||(nodeKey(b.x+D[b.dir][0]*70,b.z+D[b.dir][1]*70)===k&&b.progress>stopLine(b))))junctions.delete(k);
 const list=cars.slice().sort((a,b)=>Number(!!b.junction)-Number(!!a.junction)||b.progress-a.progress||(b.stopWait||0)-(a.stopWait||0)||a.id-b.id);
 for(const b of list){
  const old=b.progress, d=D[b.dir],tx=b.x+d[0]*70,tz=b.z+d[1]*70,k=nodeKey(tx,tz),origin=nodeKey(b.x,b.z),line=stopLine(b);
  const prev=junctions.get(origin);if(prev===b&&b.progress>=14){junctions.delete(origin);delete b.junction;}
  let limit=70,reason="";
  const lane=lanes.get(key(b))||[];
  if(busBay(b)&&b.pendingStop&&b.progress<=STOP+.01&&!b.bay)b.bay="enter";
  if(b.bay==="parked"&&b.dwell<=0&&b.progress>=STOP-.025&&!lane.some(q=>q!==b&&Math.abs(q.progress-b.progress)<gap(q,b)+3))b.bay="merge";
  for(const q of lane)if(q!==b&&q.progress>b.progress&&!(q.bay==="parked"&&!b.bay)&&!(b.bay==="parked"&&!q.bay))limit=Math.min(limit,q.progress-gap(q,b));
  if(limit<70)reason="FOLLOWING";
  let owner=junctions.get(k),committed=owner===b;
  const stopSign=stopControlled(tx,tz);if(stopSign&&b.progress>=line-.05&&!committed)b.stopWait=(b.stopWait||0)+dt;else if(!committed)b.stopWait=0;
  const plan=plannedDir(b,tx,tz);
  const space=dir=>!(lanes.get(keyOf(tx,tz,dir))||[]).some(v=>v!==b&&!(v.bay==="parked"&&!b.bus)&&v.progress<14+gap(v,b)+3);
  const clear=dir=>!ped.some(p=>intersects(p,carRect({x:tx,z:tz,dir,bus:b.bus},0),.5));
  if(!committed&&b.progress>=line-.05&&b.progress<70&&limit>=70){
   const dir=plan.dirs.find(d=>space(d)&&clear(d));
   if(!owner&&!phaseLocks.has(k)&&(stopSign?b.stopWait>=.5:signal(tx,tz,w.time,b.dir)===b.dir%2)&&dir!==undefined){
    junctions.set(k,b);b.junction=k;b.turnDir=dir;committed=true;
   }
  }
  if(!committed){limit=Math.min(limit,line);if(!reason)reason=phaseLocks.has(k)?"PEDESTRIAN CROSSING":owner?"JUNCTION OCCUPIED":stopSign&&b.stopWait<.5?"STOP SIGN":!stopSign&&signal(tx,tz,w.time,b.dir)!==b.dir%2?"RED SIGNAL":"EXIT BLOCKED";}
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
  b.wait=moved?0:(b.wait||0)+dt;b.trafficStatus=moved?"MOVING":reason||"WAITING";
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
function inSolid(x,z){const hit=o=>Math.abs(x-o.x)<o.w/2+.25&&Math.abs(z-o.z)<o.l/2+.25;return solids.some(hit)||streetSolids.some(hit);}
function destination(w,c){const r=c.ride;return r?.phase==="approach"?(r.queue||(r.mode==="metro"?metroLines[r.line].stops[r.from]:lines[r.line].stops[r.from])):w.buildings[c.goal]?.door;}
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
   const tolerance=(p.cross||c.route[1]?.cross)?0.28:c.route.length===1?0.08:0.70;
   if(len<tolerance){c.route.shift();if(st.cross&&Math.hypot(c.x-st.cross.b.x,c.z-st.cross.b.z)<.35)st.cross=null;continue;}
   if(p.cross&&!st.cross){
    if(signal(p.cross.x,p.cross.z,w.time,0)===p.cross.axis||!crossClear(w,p.cross)||!occ.free(c,p.x,p.z)){c.walkStatus="WAITING FOR CROSSWALK";break;}
    st.cross=p.cross;phaseLocks.add(nodeKey(p.cross.x,p.cross.z));
   }
   const step=Math.min(.32,budget,len),ux=dx/len,uz=dz/len;
   const legal=(x,z)=>offRoad(x,z)||st.cross&&(st.cross.axis===0?Math.abs(z-st.cross.a.z)<=1.25&&x>=Math.min(st.cross.a.x,st.cross.b.x)-.4&&x<=Math.max(st.cross.a.x,st.cross.b.x)+.4:Math.abs(x-st.cross.a.x)<=1.25&&z>=Math.min(st.cross.a.z,st.cross.b.z)-.4&&z<=Math.max(st.cross.a.z,st.cross.b.z)+.4);
   const can=(x,z)=>legal(x,z)&&occ.free(c,x,z)&&!cars.some(r=>intersects({x,z},r,.45))&&(!inSolid(x,z)||Math.hypot(x-target.x,z-target.z)<1);
   let x=c.x+ux*step,z=c.z+uz*step;
   if(!can(x,z)){
    let found=false;
    if(st.cross||offRoad(c.x,c.z))for(const [angle,side] of [[.6,1],[.6,-1],[1.1,1],[1.1,-1],[1.55,1],[1.55,-1]]){const xx=c.x+(ux*Math.cos(angle)+uz*Math.sin(angle)*side)*step,zz=c.z+(uz*Math.cos(angle)-ux*Math.sin(angle)*side)*step;
     const permitted=st.cross?(st.cross.axis===0?Math.abs(zz-(nearestGrid(st.cross.a.z)+(st.cross.a.z<nearestGrid(st.cross.a.z)?-SIDE:SIDE)))<=.96:Math.abs(xx-(nearestGrid(st.cross.a.x)+(st.cross.a.x<nearestGrid(st.cross.a.x)?-SIDE:SIDE)))<=.96):offRoad(xx,zz);
     if(permitted&&can(xx,zz)&&Math.hypot(xx-p.x,zz-p.z)<len+.06){x=xx;z=zz;found=true;break;}}
    if(!found&&!st.cross&&offRoad(c.x,c.z)&&(st.stall||0)>12){
     for(const angle of [2.1,-2.1,2.7,-2.7,Math.PI]){const xx=c.x+(ux*Math.cos(angle)+uz*Math.sin(angle))*step,zz=c.z+(uz*Math.cos(angle)-ux*Math.sin(angle))*step;
      if(offRoad(xx,zz)&&can(xx,zz)){x=xx;z=zz;found=true;st.stall=5;break;}}
    }
    if(!found){c.walkStatus="YIELDING";st.stall=(st.stall||0)+dt;break;}
   }
   if(Math.hypot(x-p.x,z-p.z)<len-.05)st.stall=Math.max(0,(st.stall||0)-dt);occ.remove(c);c.heading=Math.atan2(x-c.x,z-c.z);c.x=x;c.z=z;occ.add(c);budget-=step;
   if(Math.hypot(p.x-c.x,p.z-c.z)<tolerance){c.route.shift();if(st.cross&&Math.hypot(c.x-st.cross.b.x,c.z-st.cross.b.z)<.35)st.cross=null;}
  }
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
// Two underground shuttle corridors, sharing an interchange at Central.
const metroStations=new Map();
function station(x,z,name){
 const key=nodeKey(x,z);if(!metroStations.has(key))metroStations.set(key,{key,name,nx:x,nz:z,x:x+15,z:z+10.5,dir:3});
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
  if(t.dwell===0)t.remaining=2.65;
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
 initMetro(w);
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
function resume(w,c,api){const r=c.ride;delete c.ride;c.transitGoal=c.goal;
 if(!w.buildings[c.goal]){c.goal=c.home;c.activity="Resting"}
 c.inside=-1;c.route=api.path(c,w.buildings[c.goal]);if(r?.phase==="riding"&&c.activity==="On bus")c.activity=r.activity;
}
export function before(w,dt,api){
 prepare(w);
 currentWorld=w;phaseLocks.clear();
 for(const c of w.citizens){const st=walkState.get(c)||{};walkState.set(c,st);if(st.cross&&walking(c)){const a=st.cross.a,b=st.cross.b,done=(c.x-(a.x+b.x)/2)*(b.x-a.x)+(c.z-(a.z+b.z)/2)*(b.z-a.z)>0;if(offRoad(c.x,c.z)&&done){if(c.route[0]?.cross)c.route.shift();st.cross=null;}else if(offRoad(c.x,c.z)&&Math.hypot(c.x-a.x,c.z-a.z)<1.4)st.cross=null;else phaseLocks.add(nodeKey(st.cross.x,st.cross.z));}}
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
 for(const b of buses)if(b.pendingStop&&b.progress>=STOP-.025){b.pendingStop=false;b.dwell=1.8;if(b.bay==="enter")b.bay="parked";}
 for(const c of w.citizens){const st=walkState.get(c);if(st&&st.speed!==undefined){c.speed=st.speed;delete st.speed;if(st.origin>=0&&c.inside<0)st.departing=true;}if(c.id===w.possessed&&st)st.cross=null;}
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
 if(r.to===b.atStop||r.cancel){const exit=queueSlot(w,c,p);if(!exit){b.dwell=Math.max(b.dwell,.5);continue;}b.passengers=b.passengers.filter(x=>x!==id);c.x=exit.x;c.z=exit.z;if(!r.cancel&&r.legs&&r.leg+1<r.legs.length){
 Object.assign(r,r.legs[++r.leg],{phase:"approach",since:w.time,bus:null,queue:null});r.queue=queueSlot(w,c,lines[r.line].stops[r.from]);if(r.queue){c.route=walkTo(c,r.queue);w.transit.transfers++;}else resume(w,c,api);
 }else{if(r.cancel)w.transit.rerouted=(w.transit.rerouted||0)+1;else w.transit.completed++;resume(w,c,api);}}}
 for(const c of w.citizens.filter(c=>c.ride?.mode!=="metro"&&c.ride?.phase==="waiting"&&c.ride.line===b.line&&c.ride.from===b.atStop).sort((a,b)=>a.ride.since-b.ride.since)){if(b.passengers.length>=capacity(b))break;const r=c.ride;
 if(r?.phase==="waiting"&&r.line===b.line&&r.from===b.atStop&&c.id!==w.possessed){
 r.phase="riding";r.bus=b.id;r.queue=null;b.passengers.push(c.id);c.route=[];w.transit.boardings++;api.note(w,c,"Boarded bus "+lines[b.line].name);}}
 }
 metroStep(w,dt,api);
 moveCrowd(w,dt,api);
}
export function networkMap(w){
 // Schematic based on the actual graph. Each shared route has its own colored track.
 let html='<div style="position:relative;aspect-ratio:1;max-width:285px;margin:12px auto;background:#0d1412;border:1px solid #394c43" aria-label="Bus and subway route network">';
 const p=(v)=>8+(v+210)/420*84;
 for(let j=0;j<7;j++){const v=8+j*14;html+='<i style="position:absolute;left:'+v+'%;top:8%;height:84%;width:1px;background:#415048"></i><i style="position:absolute;top:'+v+'%;left:8%;width:84%;height:1px;background:#415048"></i>';}
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
 let html='<h2>TRANSIT CONTROL</h2><h3>TRAFFIC FLOW</h3>'+["MOVING","RED SIGNAL","STOP SIGN","FOLLOWING","JUNCTION OCCUPIED","EXIT BLOCKED","PEDESTRIAN CROSSING","PEDESTRIAN AHEAD","BUS STOP","WAIT TO MERGE"].map(reason=>'<div class="stat"><span>'+reason+'</span><b>'+w.cars.filter(c=>c.trafficStatus===reason).length+'</b></div>').join("")+'<div class="stat"><span>LONG WAIT (20+ MIN)</span><b>'+w.cars.filter(c=>c.wait>20).length+'</b></div><h3>PEDESTRIANS</h3><div class="stat"><span>CROSSWALK WAIT</span><b>'+w.citizens.filter(c=>c.walkStatus==="WAITING FOR CROSSWALK").length+'</b></div><div class="stat"><span>PEDESTRIAN YIELD</span><b>'+w.citizens.filter(c=>c.walkStatus==="YIELDING").length+'</b></div><div class="stat"><span>ACTIVE BUSES</span><b>'+buses.length+'</b></div><div class="stat"><span>WAITING</span><b>'+waiting+'</b></div><div class="stat"><span>ON BOARD</span><b>'+buses.reduce((n,b)=>n+b.passengers.length,0)+'</b></div><div class="stat"><span>BOARDINGS</span><b>'+s.boardings+'</b></div><div class="stat"><span>COMPLETED RIDES</span><b>'+s.completed+'</b></div><div class="stat"><span>WAIT TIMEOUTS</span><b>'+s.abandoned+'</b></div><div class="stat"><span>INTERRUPTED RIDES</span><b>'+(s.rerouted||0)+'</b></div><div class="stat"><span>TRANSFERS</span><b>'+(s.transfers||0)+'</b></div><h3>ROUTE NETWORK</h3>'+networkMap(w);
 for(let i=0;i<lines.length;i++){const l=lines[i],v=buses.filter(b=>b.line===i);html+='<h3 style="color:#'+l.color.toString(16)+'">'+l.name+'</h3><div class="stat"><span>STOPS / BUSES</span><b>'+served(l)+' / '+v.length+'</b></div><div class="stat"><span>PASSENGERS</span><b>'+v.reduce((n,b)=>n+b.passengers.length,0)+' / '+v.reduce((n,b)=>n+capacity(b),0)+'</b></div>'+v.map(b=>'<button data-bus="'+b.id+'">BUS '+b.id+' · '+b.passengers.length+'/'+capacity(b)+' · '+(b.dwell>0?'STOP':'RUN')+'</button>').join('')}
 html+='<h3>STREET INFRASTRUCTURE</h3>'+Object.entries(inventory).map(([name,n])=>'<div class="stat"><span>'+name.toUpperCase()+'</span><b>'+n+'</b></div>').join('');
 html+='<h3>UNDERGROUND METRO</h3><div class="stat"><span>STATIONS / TRAINS</span><b>'+metroStations.size+' / '+w.metro.trains.length+'</b></div><div class="stat"><span>WAITING</span><b>'+w.citizens.filter(c=>c.ride?.mode==="metro"&&c.ride.phase==="waiting").length+'</b></div><div class="stat"><span>ON BOARD</span><b>'+w.metro.trains.reduce((n,t)=>n+t.passengers.length,0)+'</b></div><div class="stat"><span>BOARDINGS / COMPLETED</span><b>'+w.metro.boardings+' / '+w.metro.completed+'</b></div>';
 for(const t of w.metro.trains)html+='<div class="stat"><span>TRAIN '+(t.id+1)+' · '+(t.remaining>0?"IN TUNNEL":metroLines[t.line].stops[t.at].name.toUpperCase())+'</span><b>'+t.passengers.length+' / '+metroCapacity+'</b></div>';
 for(const l of metroLines){html+='<h3 style="color:'+l.color+'">'+l.name+'</h3><p>'+l.stops.map(p=>p.name).join(' · ')+'</p>';}
 return html+'<p>Local loops and limited-stop express services support one transfer. Riders compare estimated trip time with walking and queue in arrival order. Select a bus to locate it.</p>';
}
export function citizen(c){const r=c.ride;return r?'<div class="stat"><span>TRANSIT</span><b>'+r.phase.toUpperCase()+' / '+(r.mode==="metro"?metroLines[r.line].name:lines[r.line].name)+'</b></div>':c.walkStatus?'<div class="stat"><span>MOVEMENT</span><b>'+c.walkStatus+'</b></div>':'';}
const signalGroups=new Map();
export function updateSignals(time){for(const s of signalGroups.values()){const p=signal(s.x,s.z,time,0);s.phases[0].visible=p===0;s.phases[1].visible=p===1;s.phases[2].visible=p===-1;}}
// Roadside assets are laid out against curb coordinates; collision footprints stay
// out of the two sidewalk lanes. Sign planes are generated once using the existing
// Three.js sign factory, then attached to their physical backing plates.
function drawInfrastructure(parent,{box,cyl,merge,mat,group}){
 streetLabels.length=0;streetSolids.length=0;for(const k of Object.keys(inventory))delete inventory[k];
 const g=group();parent.add(g);streetLabelGroup=group();parent.add(streetLabelGroup);
 const m={iron:mat(0x535e59),black:mat(0x292e2c),wood:mat(0x77634d),concrete:mat(0x969487),stone:mat(0x797c71),red:mat(0xa73c32),yellow:mat(0xb7a35f),white:mat(0xd7d5c4),blue:mat(0x465d78),green:mat(0x3b6855),copper:mat(0x78654a),wire:mat(0x252925),glass:mat(0x586d70),lamp:mat(0xe3d9ad),rail:mat(0x86928f)};
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
    const p0=oriented(axis,v,p,q,roadHalf(v)+.18),p1=oriented(axis,v,p,q,8.0);
    B(axis===0?.29:54,.13,axis===0?54:.29,p0.x,.065,p0.z,m.concrete);
    B(axis===0?2.0:54,.07,axis===0?54:2.0,p1.x,.035,p1.z,m.stone);
    for(let k=-24;k<=24;k+=6){const a=oriented(axis,v,p+k,q,8);B(axis===0?1.94:.025,.012,axis===0?.025:1.94,a.x,.077,a.z,m.concrete);}
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
  const x=p.x,z=p.nz+13.2;
  B(7.8,.14,3.7,x,.08,z,m.concrete);B(6.9,.05,2.8,x,.16,z,m.black);
  for(let i=0;i<11;i++){const xx=x-3.1+i*.56;B(.58,.12,2.25,xx,.16-i*.14,z,m.stone);}
  for(const side of [-1,1]){const zz=z+side*1.55;B(7.3,.25,.16,x,.23,zz,m.concrete);for(let k=-3;k<=3;k+=1.5)pole(x+k,zz,1.12,.055,m.rail);B(7.2,.07,.075,x,1.1,zz,m.rail);footprint(x,zz,7.2,.19);}
  B(.2,1.1,2.85,x+3.5,.58,z,m.iron);footprint(x+3.5,z,.24,2.85);
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
 for(const s of [-1,1]){for(let k=-roadHalf(v)+.5;k<roadHalf(v);k+=1.2)box(parent,.58,.026,2,v+k,.043,z+s*SIDE,white);for(let k=-roadHalf(z)+.5;k<roadHalf(z);k+=1.2)box(parent,2,.026,.58,v+s*SIDE,.043,z+k,white);
 // Right-hand traffic: a stop bar covers only the incoming lane.
 if(Math.abs(z+s*70)<=210)box(parent,roadHalf(v)-.3,.026,.22,v-s*roadHalf(v)/2,.044,z+s*(SIDE+1.2),white);
 if(Math.abs(v+s*70)<=210)box(parent,.22,.026,roadHalf(z)-.3,v+s*(SIDE+1.2),.044,z+s*roadHalf(z)/2,white);
 }
 if(stopControlled(v,z))continue;
 const ax=v===0||Math.abs(v)===210,az=z===0||Math.abs(z)===210,key=nodeKey(v,z);
 let sig=signalGroups.get(key);if(!sig){sig={x:v,z,phases:[group(),group(),group()]};signalGroups.set(key,sig);parent.add(...sig.phases);}
 for(const approach of [0,1]){const sx=v+(approach===0?7:-7),sz=z+(approach===0?7:-7);cyl(parent,.11,.14,4.4,sx,2.2,sz,steel);box(parent,approach===0?.55:.42,1.35,approach===0?.42:.55,sx,4.25,sz,dark);
 for(let phase=0;phase<3;phase++){const go=phase===approach,g=sig.phases[phase];
 for(const side of [-1,1]){const xx=sx+(approach===1?side*.23:0),zz=sz+(approach===0?side*.23:0);
 box(g,approach===0?.28:.08,.28,approach===0?.08:.28,xx,go?4:4.6,zz,go?green:red);}}}

 }}
 drawInfrastructure(parent,{box,cyl,merge,mat,group});
 const seen=new Set(),hRoad=p=>p.dir%2===0?nearestGrid(p.x):nearestGrid(p.z);
 for(let li=0;li<lines.length;li++){const l=lines[li],color=mat(l.color);for(const p of l.stops){const d=D[p.dir],key=p.x+","+p.z;
 if(!p.active||seen.has(key))continue;seen.add(key);
 // Shelter is on the sidewalk; it never intrudes into the traffic lane.
 const rank=roadHalf(hRoad(p)),offset=rank+.52-SIDE,x=p.x+d[1]*offset,z=p.z-d[0]*offset,h=d[0]!==0;
 box(parent,h?6:1.1,.12,h?1.1:6,x,.12,z,dark);
 box(parent,h?6:1.4,.2,h?1.4:6,x,2.75,z,steel);
 for(const a of [-2.6,2.6]){box(parent,.13,2.6,.13,x+d[0]*a-d[1]*.27,1.4,z+d[1]*a+d[0]*.27,steel);}
 box(parent,h?5.2:.12,1.65,h?.12:5.2,x-d[1]*.28,1.65,z+d[0]*.28,glass);
 box(parent,h?3.7:.38,.16,h?.38:3.7,x,.65,z,dark);for(const a of [-1.35,1.35])box(parent,.14,.55,.14,x+d[0]*a,.34,z+d[1]*a,steel);
 const px=x+d[0]*3.2,pz=z+d[1]*3.2;cyl(parent,.08,.1,3.2,px,1.6,pz,steel);
 box(parent,h?.95:.14,.78,h?.14:.95,px,3.05,pz,color);
 const names=lines.filter(l=>l.stops.some(q=>q.active&&q.x===p.x&&q.z===p.z)).map(l=>l.name[0]).join(" ");const face=(p.dir+1)%4,normal=D[face];streetLabels.push({text:"BUS "+names,x:px+normal[0]*.08,y:3.05,z:pz+normal[1]*.08,w:.86,h:.64,dir:face,bg:"#334c50",fg:"#f2e9d3"});inventory["bus shelters"]=(inventory["bus shelters"]||0)+1;
 // Paint the stop zone along the curb rather than over the moving lane.
 box(parent,h?10:.25,.027,h?.25:10,p.x-d[1]*1.6,.048,p.z+d[0]*1.6,color);
 if(roadRank(hRoad(p))===0){const xx=p.x-d[1]*(SIDE-5.2),zz=p.z+d[0]*(SIDE-5.2);box(parent,h?14:2.4,.019,h?2.4:14,xx,.028,zz,mat(0x4e5551));for(const k of [-6.8,6.8])box(parent,h?.18:2.4,.024,h?2.4:.18,xx+d[0]*k,.051,zz+d[1]*k,white);inventory["bus pullouts"]=(inventory["bus pullouts"]||0)+1;}
 }}
 merge(parent);for(const s of signalGroups.values())for(const phase of s.phases)merge(phase);updateSignals(420);
}
export function build(b,parent,{group,box,cyl,merge,sign,materials,colliders,registry}){
 attachStreetLabels(sign);
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
 const p=position(b),r=carRect(b);m.position.set(r.x,0,r.z);m.rotation.y=p.a;
 }}
