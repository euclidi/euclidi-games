import {createCore} from './core.mjs';
import {worldFactory} from './world.mjs';
function sessionFactory(makeCore,makeWorld){
  const core=makeCore(),worldAPI=makeWorld(),version=1;
  const prices={shortbow:8,longbow:14,"light-crossbow":12,stone:0,flask:4,sling:5,boomerang:7};
  const ammoFor={bow:"arrow",loaded:"bolt",elastic:"pellet",rhythm:"pellet",breath:"dart"};
  let character,world,active=new Map(),lastReplay=null,sequence=0,revision=0;
  function begin(origin="commoner",profile="standard"){
    character=core.newState(origin);world=worldAPI.newWorld(origin,profile);
    active.clear();lastReplay=null;sequence=0;revision=0;
    for(const item of character.inventory){const ammunition=ammoFor[core.registry[item.type]?.handling];if(ammunition)worldAPI.addItem(world,ammunition,8);}
    return view();
  }
  function ready(){if(!character||!world)throw Error("No character session")}
  function sync(){character.coins=world.coins;character.consequence=world.profile;revision++}
  function transact(fn){ready();if(world.dead||world.prisonUntil)return false;sync();const result=fn();sync();return result}
  const copy=x=>JSON.parse(JSON.stringify(x));
  function view(){ready();return copy({version,revision,sequence,character:{...character,coins:world.coins},world,activeShots:active.size,lastReplay})}
  function acquire(type){return transact(()=>{
    const price=prices[type];if(price===undefined||!["market","workshop","poor"].includes(world.place))return false;
    const uid="gear-"+(++sequence);
    const ok=core.buy(character,{type,price,uid});if(ok){world.coins=character.coins;const ammo=ammoFor[core.registry[type].handling];if(ammo)worldAPI.addItem(world,ammo,5)}return ok
  })}
  function move(place){return transact(()=>worldAPI.travel(world,place))}
  function advance(minutes){ready();const result=worldAPI.tick(world,minutes);sync();return result}
  function work(id){return transact(()=>worldAPI.startJob(world,id))}
  function join(faction){return transact(()=>worldAPI.join(world,faction))}
  function buySupply(id,quantity){const units={arrow:1,bolt:1,pellet:1,dart:1,food:2};return transact(()=>units[id]?worldAPI.purchase(world,id,quantity,units[id]):false)}
  function recoverGear(uid){return transact(()=>{const item=character.inventory.find(x=>x.uid===uid);if(!item||item.available!==false||item.type==="flask")return false;item.available=true;return true})}
  function aimShot({uid,position,velocity,spin=[0,0,0],practiceOnly=false,compound=null}){
    ready();if(world.dead||world.prisonUntil||active.size>=12)return null;
    const item=character.inventory.find(x=>x.uid===uid);
    if(!item||item.available===false||item.condition<=0)return null;
    const weapon=core.registry[item.type],ammo=ammoFor[weapon.handling];
    if(ammo&&(world.items[ammo]||0)<1&&!practiceOnly)return null;
    const launched=core.launch({id:item.type,uid:"shot-"+(++sequence),position,velocity,spin,drag:.01,practiceOnly,compound});
    if(!practiceOnly){if(ammo)worldAPI.consume(world,ammo);else item.available=false;item.condition=Math.max(0,item.condition-.002);item.familiarity++;}
    active.set(launched.uid,{p:launched,item:uid,elapsed:0});sync();return launched.uid
  }
  function update(elapsed,scene){ready();if(!Number.isFinite(elapsed)||elapsed<0||elapsed>.25)throw Error("Invalid simulation elapsed");
    const completed=[];
    for(const [id,a] of active){a.elapsed+=elapsed;while(a.elapsed+1e-10>=core.DT&&a.p.active){core.step(a.p,scene);a.elapsed-=core.DT}
      if(!a.p.active){const xp=core.score(character,a.p);lastReplay={id,weapon:a.p.id,item:a.item,samples:a.p.samples,events:a.p.events,xp};
        completed.push(copy(lastReplay));active.delete(id);sync();}}
    return completed
  }
  function liveShots(){return Array.from(active.values(),a=>({id:a.p.uid,weapon:a.p.id,position:[...a.p.position],velocity:[...a.p.velocity]}))}
  function learn(key,node){return transact(()=>core.unlock(character,key,node))}
  function reaction(a,b){return transact(()=>core.recordReaction(character,a,b))}
  function defeat(){ready();worldAPI.defeat(world);active.clear();sync();return view()}
  function snapshot(){ready();if(active.size)throw Error("Cannot save mid-flight");sync();return JSON.stringify({version,revision,sequence,character,world,lastReplay})}
  function restore(raw){const parsed=JSON.parse(raw);
    if(parsed.version!==version||!Number.isSafeInteger(parsed.sequence)||!parsed.character||parsed.character.version!==1||!Array.isArray(parsed.character.inventory))throw Error("Unsupported character snapshot");
    const w=worldAPI.restore(JSON.stringify(parsed.world));
    if(parsed.character.origin!==w.origin||parsed.character.inventory.some(i=>!core.registry[i.type]))throw Error("Invalid character snapshot");
    world=w;character=parsed.character;sequence=parsed.sequence;revision=parsed.revision;lastReplay=parsed.lastReplay||null;active.clear();sync();return view()
  }
  return {begin,view,acquire,move,advance,work,join,buySupply,recoverGear,aimShot,update,liveShots,learn,reaction,defeat,snapshot,restore,core};
}
export {sessionFactory};
export const createSession=()=>sessionFactory(createCore,worldFactory);
