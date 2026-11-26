// Sector Zero: urban fabric and transit. Keep the original simulation's 70-unit node grid.
const D=[[0,1],[1,0],[0,-1],[-1,0]], N=70, edge=210;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const roadRank=v=>v===0||Math.abs(v)===210?0:Math.abs(v)===140?1:2;
const congestion=new Map(),keyOf=(x,z,d)=>x+","+z+","+d;
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
 l.stops=l.nodes.map((p,i)=>{const d=D[direction(p,l.nodes[(i+1)%l.nodes.length])];return{x:p.x+d[0]*8+d[1]*6.5,z:p.z+d[1]*8-d[0]*6.5,dir:direction(p,l.nodes[(i+1)%l.nodes.length]),active:!l.express||i%2===0||p.x===0&&p.z===0}});
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
export function arrive(b){b.atStop=b.nextStop;b.nextStop=(b.nextStop+1)%lines[b.line].nodes.length;b.dwell=lines[b.line].stops[b.atStop].active?1.8:0;b.progress=b.dwell?8:0;}
export function gap(a,b){return a?.bus||b?.bus?10.5:5.8}
export function signal(x,z,time,dir){
 const arterialX=x===0||Math.abs(x)===210,arterialZ=z===0||Math.abs(z)===210;
 const cycle=((time+(x/70+z/70+6)*.85)%8+8)%8;
 const green=arterialX&&!arterialZ?5:arterialZ&&!arterialX?3:4;
 return cycle<green?0:1;
}
function walkTo(c,p){
 const gx=clamp(Math.round((c.x+210)/70),0,6)*70-210;
 const gz=clamp(Math.round((c.z+210)/70),0,6)*70-210;
 const px=clamp(Math.round((p.x+210)/70),0,6)*70-210;
 const pz=clamp(Math.round((p.z+210)/70),0,6)*70-210;
 const a=[{x:c.x,z:gz+7},{x:gx+7,z:gz+7},{x:gx+7,z:pz+7},{x:px+7,z:pz+7},{x:p.x,z:p.z}];
 return a.filter((v,i)=>i===0||dist(v,a[i-1])>.01);
}
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
 for(const c of w.citizens)if(c.transitMigration){delete c.transitMigration;if(c.id!==w.possessed)resume(w,c,api);}
 congestion.clear();
 for(const b of w.cars){const key=keyOf(b.x,b.z,b.dir);congestion.set(key,(congestion.get(key)||0)+1);if(!b.bus)b.speed=roadSpeed(b.x,b.z,b.dir)*(w.rain?.77:1)*(.86+(b.id%5)*.07);}
 for(const b of w.cars)if(b.bus){b.dwell=Math.max(0,b.dwell-dt);b.speed=b.dwell>0?0:Math.min(lines[b.line].speed,roadSpeed(b.x,b.z,b.dir)+2)*(w.rain?.82:1);
 b.passengers=b.passengers.filter(id=>{const c=w.citizens[id];if(!c||id===w.possessed||c.ride?.bus!==b.id){if(c?.ride?.bus===b.id)delete c.ride;return false}return true;});}
}
export function after(w,dt,api){
 const buses=w.cars.filter(b=>b.bus);
 for(const c of w.citizens){
 if(c.id===w.possessed){delete c.ride;continue}
 let r=c.ride;
 if(r&&r.goal!==c.goal){if(r.phase==="riding"){r.goal=c.goal;r.cancel=true}else{delete c.ride;r=null;}}
 if(!r&&c.inside<0&&c.route.length&&c.transitGoal!==c.goal){
 c.transitGoal=c.goal;
 if(c.id%4!==0&&w.buildings[c.goal]){r=itinerary(c,w.buildings[c.goal]);if(r){r.since=w.time;r.activity=c.activity;c.ride=r;c.route=walkTo(c,lines[r.line].stops[r.from]);}}
 }
 if(!r)continue;
 if(r.phase==="approach"){const p=lines[r.line].stops[r.from];if(dist(c,p)<1.5){r.phase="waiting";r.since=w.time;c.route=[];c.x=p.x;c.z=p.z;}else if(!c.route.length||dist(c.route[c.route.length-1],p)>.1)c.route=walkTo(c,p);}
 if(r.phase==="waiting"){const p=lines[r.line].stops[r.from],d=D[p.dir];const slot=(c.id%11)-5;const row=Math.floor(c.id/11)%3;c.x=p.x+d[0]*slot*.58+d[1]*row*.45;c.z=p.z+d[1]*slot*.58-d[0]*row*.45;c.inside=-1;c.route=[];if(w.time-r.since>110){w.transit.abandoned++;resume(w,c,api);}}
 if(r.phase==="riding"){const b=buses.find(x=>x.id===r.bus);if(!b){resume(w,c,api);continue}const p=api.carPosition(b);c.x=p.x;c.z=p.z;c.heading=p.a;c.inside=-1;c.route=[];}
 }
 for(const b of buses){
 w.transit.vehicleKm+=b.speed*dt/1000;
 if(b.dwell<=0||b.atStop<0)continue;
 const p=lines[b.line].stops[b.atStop];
 for(const id of [...b.passengers]){const c=w.citizens[id],r=c?.ride;if(!r||r.bus!==b.id){b.passengers=b.passengers.filter(x=>x!==id);continue;}
 if(r.to===b.atStop||r.cancel){b.passengers=b.passengers.filter(x=>x!==id);c.x=p.x;c.z=p.z;if(!r.cancel&&r.legs&&r.leg+1<r.legs.length){
 Object.assign(r,r.legs[++r.leg],{phase:"approach",since:w.time,bus:null});c.route=walkTo(c,lines[r.line].stops[r.from]);w.transit.transfers++;
 }else{if(r.cancel)w.transit.rerouted=(w.transit.rerouted||0)+1;else w.transit.completed++;resume(w,c,api);}}}
 for(const c of w.citizens.filter(c=>c.ride?.phase==="waiting"&&c.ride.line===b.line&&c.ride.from===b.atStop).sort((a,b)=>a.ride.since-b.ride.since)){if(b.passengers.length>=capacity(b))break;const r=c.ride;
 if(r?.phase==="waiting"&&r.line===b.line&&r.from===b.atStop&&c.id!==w.possessed){
 r.phase="riding";r.bus=b.id;b.passengers.push(c.id);c.route=[];w.transit.boardings++;api.note(w,c,"Boarded bus "+lines[b.line].name);}}
 }
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
 let html='<h2>TRANSIT CONTROL</h2><div class="stat"><span>ACTIVE BUSES</span><b>'+buses.length+'</b></div><div class="stat"><span>WAITING</span><b>'+waiting+'</b></div><div class="stat"><span>ON BOARD</span><b>'+buses.reduce((n,b)=>n+b.passengers.length,0)+'</b></div><div class="stat"><span>BOARDINGS</span><b>'+s.boardings+'</b></div><div class="stat"><span>COMPLETED RIDES</span><b>'+s.completed+'</b></div><div class="stat"><span>WAIT TIMEOUTS</span><b>'+s.abandoned+'</b></div><div class="stat"><span>INTERRUPTED RIDES</span><b>'+(s.rerouted||0)+'</b></div><div class="stat"><span>TRANSFERS</span><b>'+(s.transfers||0)+'</b></div><h3>ROUTE NETWORK</h3>'+networkMap();
 for(let i=0;i<lines.length;i++){const l=lines[i],v=buses.filter(b=>b.line===i);html+='<h3 style="color:#'+l.color.toString(16)+'">'+l.name+'</h3><div class="stat"><span>STOPS / BUSES</span><b>'+served(l)+' / '+v.length+'</b></div><div class="stat"><span>PASSENGERS</span><b>'+v.reduce((n,b)=>n+b.passengers.length,0)+' / '+v.reduce((n,b)=>n+capacity(b),0)+'</b></div>'+v.map(b=>'<button data-bus="'+b.id+'">BUS '+b.id+' · '+b.passengers.length+'/'+capacity(b)+' · '+(b.dwell>0?'STOP':'RUN')+'</button>').join('')}
 return html+'<p>Local loops and limited-stop express services support one transfer. Riders compare estimated trip time with walking and queue in arrival order. Select a bus to locate it.</p>';
}
export function citizen(c){const r=c.ride;return r?'<div class="stat"><span>TRANSIT</span><b>'+r.phase.toUpperCase()+' / '+lines[r.line].name+'</b></div>':'';}
const signalGroups=new Map();
export function updateSignals(time){for(const s of signalGroups.values()){const p=signal(s.x,s.z,time,0);s.phases[0].visible=p===0;s.phases[1].visible=p===1;}}
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
 for(const s of [-1,1])for(let k=-3;k<=3;k+=1.3){box(parent,.65,.026,1.8,v+k,.043,z+s*5,white);box(parent,1.8,.026,.65,v+s*5,.043,z+k,white);}
 const ax=v===0||Math.abs(v)===210,az=z===0||Math.abs(z)===210,key=(v+z)+":"+(ax&&!az?5:az&&!ax?3:4);
 let sig=signalGroups.get(key);if(!sig){sig={x:v,z,phases:[group(),group()]};signalGroups.set(key,sig);parent.add(...sig.phases);}
 for(const approach of [0,1]){const sx=v+(approach===0?7:-7),sz=z+(approach===0?7:-7);cyl(parent,.11,.14,4.4,sx,2.2,sz,steel);box(parent,approach===0?.55:.42,1.35,approach===0?.42:.55,sx,4.25,sz,dark);
 for(let phase=0;phase<2;phase++){const go=phase===approach,g=sig.phases[phase];
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
 const solid=(ww,hh,ll,xx=x,zz=z,y=0,m=f)=>{box(shell,ww,hh,ll,xx,y+hh/2+.5,zz,m);colliders.push({x:xx,z:zz,w:ww,l:ll,h:y+hh+.5});};
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
 for(let k=-Math.floor(ww/5);k<=Math.floor(ww/5);k++){const xx=x+k*2.3;if(Math.abs(xx-x)>ww/2-1.3)continue;box(shell,1.45,1.7,.13,xx,i*hh+2.8,zz-ll/2-.08,glass);}
 if(a!=="Micro flats")for(const side of [-1,1]){box(shell,ww*.68,.22,1.5,x,(i+1)*hh-.2,zz+side*(ll/2+.65),roof);box(shell,ww*.68,.7,.12,x,(i+1)*hh+.2,zz+side*(ll/2+1.3),steel);}
 }hvac(x,z,levels*hh+.9);
 }else if(a==="Duplex courts"){
 for(const side of [-1,1]){const xx=x+side*6.1,hh=side<0?8.5:10.5;solid(10.5,hh,l-6,xx,z+2,0,masonry);slab(11,l-5.5,hh+.65,xx,z+2);for(let j=0;j<2;j++)for(let k of [-2.8,2.8])box(shell,1.7,1.6,.13,xx+k,2.8+j*4,z-(l-6)/2+1.91,glass);}
 box(base,2.2,.12,l-4,x,.57,z,roof);
 }else if(a==="Night bazaar"||a==="Corner shops"){
 solid(w,5.5,10,x,z+10,0,masonry);slab(w+.5,11,6.2,x,z+10);
 for(let j=-1;j<=1;j++){const xx=x+j*7;box(shell,6.4,.23,11,xx,3.9,z-7,j===0?rust:trim);for(const k of [-2.7,2.7])box(shell,.15,3.7,.15,xx+k,2,z-12,steel);box(shell,5.1,.95,2.6,xx,1,z-8,roof);for(let k=-2;k<=2;k++)box(shell,.65,.35,.75,xx+k*.9,1.65,z-8,k%2?trim:rust);}
 }else if(a==="Department store"){
 solid(w,6,l,x,z,0,masonry);solid(w-4,7,l-5,x,z,6,steel);slab(w+.4,l+.5,6.7);slab(w-3,l-4,13.65);
 for(let k=-3;k<=3;k++){box(shell,2.5,3,.13,x+k*3,2.75,z-l/2-.1,glass);box(shell,2.1,4.8,.13,x+k*2.6,9.8,z-(l-5)/2-.1,glass);}
 hvac(x,z,14);
 }else if(a==="Apartment tower"||a==="Municipal hall"||a==="Hospital"){
 const low=6,high=Math.max(12,h+(a==="Apartment tower"?8:0));solid(w,low,l);slab(w+1,l+1,low+.6);
 solid(w-7,high-low,l-10,x,z+1,low,f);slab(w-6,l-9,high+.6,x,z+1);bands(w-7,l-10,low+4,high,x,z+1);hvac(x,z,high+1);
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
 box(shell,5,.24,2.1,xx,3.9,z-l/2-1,trim);box(shell,2.3,2.8,.14,xx,1.9,z-l/2-.13,door);}
 }
 }else if(a==="Covered market"){
 const height=5.5;solid(w,4,8,x,z+l/2-4,0,steel);slab(w+1,l+1,height,x,z,roof);
 for(const dx of [-10,10])for(const dz of [-15,-5,5,15]){box(shell,.38,5.2,.38,x+dx,2.9,z+dz,steel);colliders.push({x:x+dx,z:z+dz,w:.38,l:.38,h:5.2});}
 for(const dx of [-6,6])for(let dz=-12;dz<=8;dz+=6){box(shell,4,1.05,2.5,x+dx,1,z+dz,trim);box(shell,4.2,.12,2.7,x+dx,1.6,z+dz,white);box(shell,4.5,.15,3.4,x+dx,3.4,z+dz,((dz+12)/6)%2?rust:roof);colliders.push({x:x+dx,z:z+dz,w:4,l:2.5,h:1.6});}
 box(shell,w,1,.25,x,4.8,z-l/2-.1,steel);
 }else if(a==="Trading arcade"){
 solid(w,7,l);slab(w+1,l+1,7.6);for(let j=-1;j<=1;j++){const xx=x+j*6;const canopy=box(shell,5.5,.45,l-4,xx,8.6,z,glass);canopy.rotation.z=j*.15;}
 for(let j=-1;j<=1;j++){box(shell,6.7,2.3,.15,x+j*7,2.4,z-l/2-.15,glass);box(shell,7,.3,3.6,x+j*7,4.1,z-l/2-1.7,steel);}
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
 if(b.type==="Market"){for(let dx of [-7,0,7]){box(shell,6,1.1,.15,x+dx,2.3,z-l/2-.1,glass);box(shell,6.5,.22,a==="Canteen"?4:2,x+dx,4,z-l/2-1,dx===0?rust:trim);}
 if(a==="Canteen"){for(const dx of [-7,7]){box(base,3,.14,1.7,x+dx,.85,z-l/2-2,roof);for(const s of [-1,1])box(base,3,.15,.4,x+dx,.45,z-l/2-2+s*1.2,steel);}}
 if(a==="Grocery"){box(shell,6,3,.2,x+7,2.1,z+l/2+.15,steel);for(let j=0;j<5;j++)box(shell,5.8,.08,.25,x+7,1+j*.5,z+l/2+.25,dark);}
 }
 else if(a==="Police station"){for(const dx of [-7,7]){box(shell,5.2,3.6,.21,x+dx,2.3,z-l/2-.15,dark);box(shell,5.5,.3,.35,x+dx,4.2,z-l/2-.3,white);}box(shell,3,.3,3,x,height+1,z,steel);cyl(shell,.08,.08,6,x,height+4,z,steel);}
 else if(a==="Records office"){for(let j=-2;j<=2;j++)box(shell,.4,height+.2,.55,x+j*4.6,height/2+.5,z-l/2-.32,steel);}
 else if(a==="Workers' hostel"){for(const dx of [-5,5]){cyl(shell,2.3,2.3,2.5,x+dx,height+2,z+6,steel,12);cyl(shell,2.35,2.35,.2,x+dx,height+3.4,z+6,roof,12);}}
 else if(a==="Community clinic"||a==="Dispensary"){box(shell,4,.3,3.3,x,4.4,z-l/2-1.5,white);box(shell,1.8,.45,.16,x,3.8,z-l/2-3,trim);}
 else for(let y=4;y<height;y+=4){box(shell,8,.25,2,x-4,y,z-l/2-1,roof);box(shell,8,.65,.13,x-4,y+.43,z-l/2-1.9,steel);}
 }
 if(!["Covered market","Night bazaar","Corner shops","Duplex courts"].includes(a))box(shell,3.4,3.8,.22,x,2.35,z-l/2-.12,door);
 if(["Tenement","Workers' hostel","Records office","Police station","Community clinic","Dispensary"].includes(a)){
 for(let y=4;y<h-.7;y+=3.9)for(let k=-3;k<=3;k++){const xx=x+k*2.85;box(shell,1.65,1.9,.12,xx,y,z-l/2-.08,glass);box(shell,1.9,.16,.25,xx,y-1,z-l/2-.15,steel);}
 for(const side of [-1,1])for(let zz=z-l/2+4;zz<z+l/2-2;zz+=5.4)for(let y=4;y<h-.7;y+=4.1)box(shell,.12,1.75,2.25,x+side*(w/2+.08),y,zz,glass);
 }
 if(a==="Foundry"||a==="Fabrication yard"){const height=Math.max(7,h);for(let j=-1;j<=1;j++){const xx=x+j*6;box(shell,4.7,3.6,.16,xx,2.5,z-l/2-.15,dark);for(let k=0;k<5;k++)box(shell,4.5,.09,.22,xx,1+k*.65,z-l/2-.25,steel);}if(a==="Foundry")chimney(x-6,z+8,height+.5,15);else for(let k=-1;k<=1;k++)box(shell,3.2,1.5,6,x+k*6,height+1,z+7,rust);}

 sign(a.toUpperCase()+" "+String(b.id).padStart(2,"0"),x,z-l/2-.3,4.9,shell);
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
