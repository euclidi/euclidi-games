// Kinetic∆ — renderer-independent core; see STATUS.md for limitations.
export function createCore(){
  // SI world coordinates; tuning constants are fictional game parameters, not equipment specifications.
  const DT=1/120, G=9.81, v=(x=0,y=0,z=0)=>[x,y,z], add=(a,b)=>a.map((n,i)=>n+b[i]), sub=(a,b)=>a.map((n,i)=>n-b[i]), mul=(a,k)=>a.map(n=>n*k), dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0), len=a=>Math.sqrt(dot(a,a)), norm=a=>mul(a,1/(len(a)||1)), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const defs=[
  ["shortbow","archery","bow","arrow"],["longbow","archery","bow","arrow"],["recurve","archery","bow","arrow"],["composite","archery","bow","arrow"],
  ["light-crossbow","crossbow","loaded","bolt"],["heavy-crossbow","crossbow","loaded","bolt"],["repeating-crossbow","crossbow","loaded","bolt"],
  ["stone","improvised","throw","solid"],["fruit","improvised","throw","solid"],["pottery","improvised","throw","fragile"],["stick","improvised","throw","solid"],
  ["knife","thrown","spin","blade"],["axe","thrown","spin","blade"],["javelin","thrown","throw","shaft"],["throwing-spear","thrown","throw","shaft"],["dart","thrown","throw","shaft"],["chakram","thrown","spin","disc"],
  ["sling","rotational","rhythm","solid"],["staff-sling","rotational","rhythm","solid"],["bolas","rotational","rhythm","cord"],
  ["boomerang","aerodynamic","spin","returning"],["throwing-stick","aerodynamic","spin","disc"],
  ["slingshot","alternative","elastic","solid"],["blowgun","alternative","breath","dart"],["experimental-launcher","alternative","loaded","solid"],
  ["flask","alchemy","throw","fragile"],["powder-vial","alchemy","throw","fragile"],["compound-vial","alchemy","throw","fragile"]];
  const registry=Object.fromEntries(defs.map(([id,family,handling,flight])=>[id,{id,family,handling,flight}]));
  const familyTrees={
  archery:["steady-anchor","power-draw","quick-nock","focused-vision","quick-draw","slow-motion","triple-shot","bowcraft"],
  crossbow:["stable-hold","efficient-loading","focused-vision","quick-reload","mechanism-knowledge","boltcraft"],
  improvised:["object-familiarity","controlled-lob","rapid-throw","ricochet-record","material-selection"],
  thrown:["consistent-release","rotation-control","focused-vision","rapid-throw","craft-throwables"],
  rotational:["rhythm","release-consistency","focus","cord-craft"],
  aerodynamic:["flight-observation","controlled-return","recovery","shape-knowledge"],
  alternative:["handling","focus","loading","prototype-knowledge"],
  alchemy:["container-handling","reaction-observation","journal","compound-knowledge","special-container"]};
  const specialTrees={shortbow:["shortbow-handling","shortbow-craft"],longbow:["longbow-handling","longbow-craft"],stone:["stone-selection","stone-shaping","stone-record"],boomerang:["return-record","boomerang-shaping"],flask:["flask-recovery","flask-recipe"],knife:["knife-familiarity","knife-craft"]};
  const nodes=(ids)=>ids.map((id,i)=>({id,level:1+i*5,cost:1,requires:i?[ids[i-1]]:[],knowledge:/craft|recipe|knowledge|shaping/.test(id)?id:null}));
  const treeFor=key=>key==="general"?nodes(["coordination","distance-judgment","focus","conditioning"]):nodes(familyTrees[key]||specialTrees[key]||(registry[key]?["familiarity","specialized-handling",key+"-craft"]:[]));
  const xpLevel=x=>1+Math.floor(Math.sqrt(Math.max(0,x)/50));
  function newState(origin="commoner"){
    const starts={commoner:[],hunter:["shortbow"],recruit:["light-crossbow"],shepherd:["sling"],wanderer:["stone"],apprentice:[],noble:["shortbow"],fisher:["javelin"]};
    if(!Object.hasOwn(starts,origin))throw Error("Unknown origin");
    return {version:1,origin,coins:origin==="noble"?100:12,skills:{},known:[...starts[origin],"stone"],knowledge:[],recipes:[],inventory:starts[origin].map((id,i)=>({uid:"origin-"+i,type:id,condition:1,quality:.5,history:["origin"],familiarity:0})),seenShots:[],records:{},practice:{},journal:[],consequence:"standard"};
  }
  const skill=(state,key)=>state.skills[key]??(state.skills[key]={xp:0,points:0,unlocked:[]});
  function award(state,key,xp){const s=skill(state,key),old=xpLevel(s.xp);s.xp+=xp;s.points+=Math.max(0,Math.min(100,xpLevel(s.xp))-Math.min(100,old));return xp}
  function discover(state,id){if(!registry[id])return false;if(!state.known.includes(id))state.known.push(id);return true}
  function unlock(state,key,id){const n=treeFor(key).find(x=>x.id===id);if(!n)return false;if(key!=="general"&&!Object.hasOwn(familyTrees,key)&&!state.known.includes(key))return false;const s=skill(state,key);if(s.unlocked.includes(id)||xpLevel(s.xp)<n.level||s.points<n.cost||n.requires.some(r=>!s.unlocked.includes(r))||(n.knowledge&&!state.knowledge.includes(n.knowledge)))return false;s.points-=n.cost;s.unlocked.push(id);if(n.knowledge&&!state.recipes.includes(id))state.recipes.push(id);return true}
  function segmentSphere(a,b,c,r){const d=sub(b,a),m=sub(a,c),A=dot(d,d),B=dot(m,d),C=dot(m,m)-r*r;if(C<=0)return 0;if(A<1e-12)return null;const q=B*B-A*C;if(q<0)return null;const t=(-B-Math.sqrt(q))/A;return t>=0&&t<=1?t:null}
  function launch({id,uid,position,velocity,spin=v(),wind=v(),drag=.02,lift=0,radius=.02,compound=null,practiceOnly=false}){
    if(!registry[id]||!uid||![position,velocity,spin,wind].every(a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite))||![drag,lift,radius].every(Number.isFinite)||drag<0||radius<0)throw Error("Invalid launch");
    return {id,uid,position:[...position],origin:[...position],velocity:[...velocity],spin:[...spin],wind:[...wind],drag,lift,radius,compound,practiceOnly,time:0,distance:0,active:true,events:[],samples:[{t:0,p:[...position],v:[...velocity],spin:[...spin]}]};
  }
  function step(p,world={targets:[],ground:0},dt=DT){
    if(!p.active)return;if(!Number.isFinite(dt)||dt<=0||dt>DT+1e-9)throw Error("Use fixed substeps");
    const a=p.position.slice(),rel=sub(p.velocity,p.wind),force=add(v(0,-G,0),mul(rel,-p.drag*len(rel)));
    const acc=add(force,mul(cross(p.spin,rel),p.lift));
    const b=add(a,add(mul(p.velocity,dt),mul(acc,dt*dt/2)));
    p.velocity=add(p.velocity,mul(acc,dt));
    let hit=null;const floor=(world.ground??0)+p.radius;
    if(a[1]>=floor&&b[1]<floor)hit={fraction:(a[1]-floor)/(a[1]-b[1]),id:"ground",material:"earth",normal:v(0,1,0),score:false,bounce:.2};
    for(const target of world.targets||[]){
      const center=add(target.center,mul(target.velocity||v(),p.time));
      const relativeEnd=sub(b,mul(target.velocity||v(),dt));
      const fraction=segmentSphere(a,relativeEnd,center,target.radius+p.radius);
      if(fraction!==null&&(!hit||fraction<hit.fraction)){
        const at=add(a,mul(sub(b,a),fraction)),c=add(center,mul(target.velocity||v(),fraction*dt));
        hit={fraction,id:target.id,material:target.material||"wood",normal:norm(sub(at,c)),score:!!target.score,moving:len(target.velocity||v())>0.05,bounce:clamp(target.bounce||0,0,.95)};
      }
    }
    if(hit){
      const at=add(a,mul(sub(b,a),hit.fraction));
      p.distance+=len(sub(at,a));p.position=at;
      const event={kind:hit.score?"target":"impact",target:hit.id,material:hit.material,position:at.slice(),speed:len(p.velocity),moving:!!hit.moving,time:p.time+dt*hit.fraction,range:len(sub(at,p.origin))};
      p.events.push(event);
      if(registry[p.id].flight==="fragile"){p.events.push({kind:"break",position:at.slice(),compound:p.compound,time:event.time});p.active=false}
      else if(hit.bounce>0&&dot(p.velocity,hit.normal)<0&&len(p.velocity)>1&&!hit.score){p.velocity=sub(p.velocity,mul(hit.normal,(1+hit.bounce)*dot(p.velocity,hit.normal)));p.position=add(p.position,mul(hit.normal,1e-4));p.events.push({kind:"bounce",target:hit.id,time:event.time})}
      else p.active=false;
    }else {p.position=b;p.distance+=len(sub(b,a))}
    p.time+=dt;if(p.time>=20||len(sub(p.position,p.origin))>500)p.active=false;
    if(!p.active||Math.round(p.time/DT)%4===0)p.samples.push({t:p.time,p:p.position.slice(),v:p.velocity.slice(),spin:p.spin.slice()});
  }
  function fixedRunner(p,world){let remainder=0;return elapsed=>{remainder+=Math.max(0,elapsed);while(remainder+1e-10>=DT&&p.active){step(p,world);remainder-=DT}return p}}
  function score(state,p){
    if(p.active||p.practiceOnly||state.seenShots.includes(p.uid))return null;
    state.seenShots.push(p.uid);
    const hit=p.events.find(e=>e.kind==="target");if(!hit)return {specialization:0,family:0,general:0};
    discover(state,p.id);
    const bounces=p.events.filter(e=>e.kind==="bounce"&&e.time<=hit.time).length;
    const key=p.id+"|"+hit.target;const repeats=state.practice[key]||0;state.practice[key]=repeats+1;
    const base=Math.max(1,Math.round((5+Math.min(30,hit.range*.4))*(hit.moving?1.5:1)*(1+Math.min(3,bounces)*.5)/(1+repeats*.15)));
    const f=registry[p.id].family;
    state.records[p.id]={longest:Math.max(state.records[p.id]?.longest||0,hit.range),bounces:Math.max(state.records[p.id]?.bounces||0,bounces)};
    return {specialization:award(state,p.id,base),family:award(state,f,Math.round(base*.45)),general:award(state,"general",Math.round(base*.2))};
  }
  // Fictional reaction vocabulary, not real chemistry.
  const reactions={"amber+mist":"binding-foam","frost+mist":"chill-cloud","gleam+amber":"luminous-gel"};
  function react(a,b){return reactions[[a,b].sort().join("+")]||null}
  function recordReaction(state,a,b){const r=react(a,b);if(r&&!state.journal.includes(r)){state.journal.push(r);state.knowledge.push(r)}return r}
  function buy(state,{type,price,uid}){if(!registry[type]||!Number.isSafeInteger(price)||price<0||state.coins<price||!uid||state.inventory.some(x=>x.uid===uid))return false;state.coins-=price;discover(state,type);state.inventory.push({uid,type,condition:1,quality:.5,history:["purchase"],familiarity:0});return true}
  return {DT,G,registry,treeFor,xpLevel,newState,skill,award,discover,unlock,launch,step,fixedRunner,score,react,recordReaction,buy};
}
