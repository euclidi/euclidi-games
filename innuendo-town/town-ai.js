// World simulation is independent of the rendered Phaser scene.
// One game minute = one second of normal play. Saved state contains every
// resident's position, goal, route, needs, cash, shift and social history.
const T=16,COLS=72,ROWS=42,VERSION=1;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const open=(s,m)=>s.open<s.close?m>=s.open&&m<s.close:m>=s.open||m<s.close;
const minute=t=>((Math.floor(t)%1440)+1440)%1440;
const day=t=>Math.floor(t/1440);
const door=(b,id)=>({x:(b.x+Math.floor(b.w/2)+.5)*T+(id%3-1)*16,y:(b.y+b.h+1.5)*T});
const home=id=>({x:(3+id*4+.5)*T,y:40.5*T});
const bondKey=(a,b)=>[a,b].sort((x,y)=>x-y).join(':');
const moodLikes=new Set(['Mischievous','Shameless','Deadpan','Cheerful','Flirtatious','Competitive']);
function blockedCells(shops){
 const blocked=new Set();
 for(const s of shops)for(let y=s.y;y<s.y+s.h;y++)for(let x=s.x;x<s.x+s.w;x++)blocked.add(y*COLS+x);
 return blocked;
}
export function ensureTownAI(old,now,shops,residents){
 if(old?.version===VERSION&&Number.isFinite(old.time)&&old.time<=now+2&&Array.isArray(old.agents)&&old.agents.length===residents.length&&Array.isArray(old.shops)&&old.shops.length===shops.length&&old.agents.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)&&Array.isArray(a.route)&&a.needs&&Number.isFinite(a.cash)))return old;
 return {version:VERSION,time:now,decisions:0,trades:0,conversations:0,completedShifts:0,bonds:{},events:[],pairCooldown:{},
  shops:shops.map(s=>({id:s.id,stock:18+s.id%4*3,cash:180,revenue:0,customers:0,restocks:0,ordersFulfilled:0,contractRevenue:0})),
  agents:residents.map(n=>{const working=n.work!==undefined&&open(shops[n.work],minute(now));const place=working?n.work:-1;
    const p=door(shops[n.id%shops.length],n.id);
    return {id:n.id,x:p.x,y:p.y,place,activity:working?'Working':'Out walking',goal:null,route:[],until:now+(working?25:1+n.id%4),
      needs:{hunger:18+(n.id*13)%50,fatigue:12+(n.id*7)%35,social:24+(n.id*17)%58},
      cash:32+(n.id*19)%76,workMinutes:0,visits:0,shiftDay:-1,decisionCount:0,lastSocial:now-20,breakUntil:0,workVisits:0};
  })};
}
function event(ai,e,out){let item={...e,time:Math.floor(ai.time)};ai.events.push(item);if(ai.events.length>50)ai.events.shift();out.push(item)}
function routeTo(a,p,shops,pathfind){
 const tile=v=>({x:clamp(Math.floor(v.x/T),0,COLS-1),y:clamp(Math.floor(v.y/T),0,ROWS-1)});
 const from=tile(a),to=tile(p),blocked=blockedCells(shops);
 if(blocked.has(to.y*COLS+to.x))return null;
 const cells=pathfind(COLS,ROWS,blocked,from,to);
 if(!cells.length&&(from.x!==to.x||from.y!==to.y))return null;
 return [...cells.map(c=>({x:(c.x+.5)*T,y:(c.y+.5)*T})),p];
}
function arrive(ai,a,g,shops,residents,out){
 a.place=g.place;a.activity=g.activity;a.until=ai.time+g.duration;a.route=[];a.goal=null;
 if(g.activity==='Working'){a.workVisits=(a.workVisits||0)+1;return}
 if(g.place>=0){
  const store=ai.shops[g.place];const price=g.activity==='Eating'?6:g.activity==='Exercising'?5:8+(g.place%3);
  a.visits++;store.customers++;
  if(store.stock>0&&a.cash>=price){a.cash-=price;store.cash+=price;store.revenue+=price;store.stock--;ai.trades++;
   if(store.stock===0)event(ai,{kind:'business',text:shops[g.place].name+' sold its last available item.'},out);
  }else if(g.activity!=='Socializing'){a.activity='Browsing';a.until=ai.time+8}
 }
}
function choose(ai,a,shops,residents){
 const n=residents[a.id],m=minute(ai.time),h=m/60,needs=a.needs;
 const available=shops.filter(s=>open(s,m));
 const goal=(activity,place,duration)=>({activity,place,duration,...(place===-2?home(a.id):place===-1?door(shops[(a.id+day(ai.time))%shops.length],a.id):door(shops[place],a.id))});
 const pick=(ids)=>ids.map(i=>shops[i]).find(s=>s&&open(s,m)&&ai.shops[s.id].stock>0);
 const onDuty=n.work!==undefined&&open(shops[n.work],m);
 if(onDuty&&ai.time>=(a.breakUntil||0)){
  if(needs.hunger>=68){a.breakUntil=ai.time+60;let s=a.cash>=6?pick([0,7,2]):null;return s?goal('Eating',s.id,25):goal('Eating at home',-2,25)}
  if(needs.fatigue>=78){a.breakUntil=ai.time+75;return goal('Resting',-2,45)}
  return goal('Working',n.work,30);
 }
 if(needs.fatigue>79||h<5.5||(h>=23&&a.id%3!==0))return goal('Resting',-2,45);
 if(needs.hunger>48){let s=a.cash>=6?pick([0,7,2]):null;return s?goal('Eating',s.id,25):goal('Eating at home',-2,25)}
 if(n.work===undefined&&h>=8&&h<18&&(a.shiftDay!==day(ai.time)||a.cash<10)){
  let s=shops[a.id%shops.length];if(open(s,m)){a.shiftDay=day(ai.time);return goal('Working',s.id,150)}
 }
 if(needs.social>40){
  const friends=ai.agents.filter(b=>b.id!==a.id&&b.place>=0&&(ai.bonds[bondKey(a.id,b.id)]||0)>=4&&open(shops[b.place],m)).sort((b,c)=>(ai.bonds[bondKey(a.id,c.id)]||0)-(ai.bonds[bondKey(a.id,b.id)]||0));
  let s=friends.length?shops[friends[0].place]:pick(a.id%2?[7,2,1,0]:[2,1,7,0]);if(s)return goal('Socializing',s.id,35)
 }
 if(needs.fatigue>55)return goal('Resting',-2,35);
 if(available.length&&a.cash>=22){const preferences=n.mood==='Competitive'?[1,4,5]:n.mood==='Reserved'?[2,6,0]:n.mood==='Flirtatious'||n.mood==='Gossip'?[7,2,6]:[(a.id+Math.floor(ai.time/35))%shops.length,2,0];let s=pick(preferences)||available[(a.id+Math.floor(ai.time/35))%available.length];return goal(s.id===1?'Exercising':'Shopping',s.id,18+(a.id%3)*5)}
 return goal('Out walking',-1,15+a.id%4*5);
}
function plan(ai,a,shops,residents,pathfind,out){
 const g=choose(ai,a,shops,residents);ai.decisions++;a.decisionCount++;
 if(a.place===g.place&&a.activity===g.activity&&g.place!==-1){a.until=ai.time+g.duration;return}
 if(a.place===g.place&&g.place>=0){arrive(ai,a,g,shops,residents,out);return}
 const route=routeTo(a,g,shops,pathfind);
 if(!route){a.until=ai.time+5;return}
 a.place=-1;a.activity='Traveling';a.goal=g;a.route=route;a.until=ai.time+2880;
}
function move(ai,a,dt,shops,residents,out){
 if(!a.goal)return;let remaining=dt*(28+a.id%4*3);
 while(a.route.length&&remaining>0){const p=a.route[0],length=dist(a,p);if(length<=remaining+.001){a.x=p.x;a.y=p.y;a.route.shift();remaining-=length}else{a.x+=(p.x-a.x)*remaining/length;a.y+=(p.y-a.y)*remaining/length;remaining=0}}
 if(!a.route.length)arrive(ai,a,a.goal,shops,residents,out);
}
export function townContacts(ai){
 const result=[];
 for(let i=0;i<ai.agents.length;i++)for(let j=i+1;j<ai.agents.length;j++){
  const a=ai.agents[i],b=ai.agents[j];
  if(a.place>=0&&a.place===b.place||a.place===-1&&b.place===-1&&dist(a,b)<32)result.push([a.id,b.id]);
 }
 return result;
}
function tick(ai,shops,residents,pathfind,out){
 for(const a of ai.agents){
  const n=residents[a.id],need=a.needs;
  need.hunger=clamp(need.hunger+((a.activity==='Eating'||a.activity==='Eating at home')?-3.4:.23),0,100);
  need.fatigue=clamp(need.fatigue+(a.activity==='Resting'?-1.8:a.activity==='Exercising'?.7:.18),0,100);
  need.social=clamp(need.social+(a.activity==='Socializing'?-1.4:.28),0,100);
  if(a.activity==='Working'&&a.place>=0){
   const s=ai.shops[a.place];a.workMinutes++;
   if(a.workMinutes>=60){
    // Productive work completes a regional order, bringing money into the
    // small town from customers outside the simulated resident population.
    const order=Math.ceil(shops[a.place].pay*.55);s.cash+=order;s.revenue+=order;s.contractRevenue=(s.contractRevenue||0)+order;s.ordersFulfilled=(s.ordersFulfilled||0)+1;
    const wage=Math.min(s.cash,Math.max(3,Math.floor(shops[a.place].pay/2)));a.cash+=wage;s.cash-=wage;a.workMinutes-=60;ai.completedShifts++;
   }
   if(n.work===a.place&&s.stock<=6&&s.cash>=24){s.cash-=24;s.stock+=18;s.restocks++;event(ai,{kind:'business',text:n.name+' restocked '+shops[a.place].name+'.'},out)}
  }
  if(!a.goal&&(a.until<=ai.time||a.activity==='Working'&&!open(shops[a.place],minute(ai.time))||n.work!==undefined&&open(shops[n.work],minute(ai.time))&&ai.time>=(a.breakUntil||0)&&(a.activity!=='Working'||need.hunger>=68||need.fatigue>=78)))plan(ai,a,shops,residents,pathfind,out);
 }
 if(Math.floor(ai.time)%5!==0)return;
 const pairs=townContacts(ai);
 for(const [i,j] of pairs){const a=ai.agents[i],b=ai.agents[j],key=bondKey(i,j);
  if(ai.time-a.lastSocial<15||ai.time-b.lastSocial<15||ai.time-(ai.pairCooldown[key]??-1e6)<25)continue;
  if(a.activity==='Traveling'||b.activity==='Traveling')continue;
  a.lastSocial=b.lastSocial=ai.time;ai.pairCooldown[key]=ai.time;ai.conversations++;
  a.needs.social=clamp(a.needs.social-12,0,100);b.needs.social=clamp(b.needs.social-12,0,100);
  const awkward=moodLikes.has(residents[i].mood)!==moodLikes.has(residents[j].mood)&&(i+j+Math.floor(ai.time/5))%3===0;
  ai.bonds[key]=clamp((ai.bonds[key]||0)+(awkward?-3:2),-40,100);
  const place=a.place>=0?shops[a.place].name:'the street';
  if(awkward||ai.conversations%5===1)event(ai,{kind:awkward?'awkward':'social',actor:i,witness:j,text:awkward?residents[i].name+' made a questionable joke to '+residents[j].name+' at '+place+'. The conversation got awkward.':residents[i].name+' and '+residents[j].name+' caught up at '+place+'.'},out);
  break;
 }
}
// Advance using actual game clock, including while the player is indoors.
// Each integer minute drives decisions; fractional movement avoids teleporting.
export function advanceTownAI(ai,target,shops,residents,pathfind){
 const out=[];if(!Number.isFinite(target)||target<=ai.time)return out;
 // Work through time skips in bounded minute slices, preserving the same rules.
 target=Math.min(target,ai.time+2880);
 while(ai.time<target-.00001){
  const next=Math.min(target,Math.floor(ai.time+1e-7)+1);
  const dt=next-ai.time;ai.time=next;
  for(const a of ai.agents)move(ai,a,dt,shops,residents,out);
  if(Math.abs(ai.time-Math.round(ai.time))<1e-7)tick(ai,shops,residents,pathfind,out);
 }
 return out;
}
export function residentStatus(ai,id,shops){
 const a=ai.agents[id];if(!a)return 'Unknown';
 const where=a.goal?(a.goal.place===-2?'home':a.goal.place>=0?shops[a.goal.place].name:'the street'):a.place===-2?'home':a.place>=0?shops[a.place].name:'the street';
 return a.activity+(a.goal?' to ':' · ')+where;
}
