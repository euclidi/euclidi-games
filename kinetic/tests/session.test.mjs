import {sessionFactory} from '../src/session.mjs';
import {createCore} from '../src/core.mjs';
import {worldFactory} from '../src/world.mjs';
function testSession(factory,core,world){
 const results=[],check=(name,fn)=>{if(!fn())throw Error("FAIL "+name);results.push(name)};
 const start=(origin="commoner",profile="standard")=>{const s=factory(core,world);s.begin(origin,profile);return s};
 const field={ground:-100,targets:[{id:"target",center:[5,1.3,0],radius:1,score:true}]};
 const fire=(s,uid,practiceOnly=false)=>{const shot=s.aimShot({uid,position:[0,1,0],velocity:[10,3,0],practiceOnly});if(!shot)return null;let done=[];for(let i=0;i<200&&!done.length;i++)done=s.update(1/60,field);return done[0]};
 check("one wallet across wages and gear purchases",()=>{const s=start();s.work("delivery");s.advance(60);return s.acquire("shortbow")&&s.view().world.coins===10&&s.view().character.coins===10});
 check("unarmed origin can acquire and practice stones",()=>{const s=start();return s.acquire("stone")&&!!fire(s,s.view().character.inventory[0].uid)?.xp?.specialization});
 check("real launch consumes ammunition exactly once",()=>{const s=start("hunter"),before=s.view().world.items.arrow;return !!fire(s,"origin-0")&&s.view().world.items.arrow===before-1});
 check("isolated practice costs no ammunition or XP",()=>{const s=start("hunter"),before=s.view().world.items.arrow;const r=fire(s,"origin-0",true);return r?.xp===null&&s.view().world.items.arrow===before&&!s.view().character.skills.shortbow});
 check("unowned equipment cannot launch",()=>{const s=start();return s.aimShot({uid:"bogus",position:[0,0,0],velocity:[1,1,0]})===null});
 check("no duplicate progression after completed shot",()=>{const s=start("hunter");const r=fire(s,"origin-0"),xp=s.view().character.skills.shortbow.xp;s.update(.1,field);return r.xp.specialization===xp&&s.view().character.skills.shortbow.xp===xp});
 check("thrown gear unavailable until recovered",()=>{const s=start("wanderer");fire(s,"origin-0");return !fire(s,"origin-0")&&s.recoverGear("origin-0")&&!!fire(s,"origin-0")});
 check("active flight prevents partial snapshot",()=>{const s=start("hunter");s.aimShot({uid:"origin-0",position:[0,1,0],velocity:[10,3,0]});try{s.snapshot();return false}catch{return true}});
 check("snapshot preserves progression and unified finances",()=>{const s=start("hunter");fire(s,"origin-0");const t=factory(core,world),v=t.restore(s.snapshot());return v.character.skills.shortbow.xp===s.view().character.skills.shortbow.xp&&v.world.coins===v.character.coins&&v.lastReplay.samples.length>1});
 check("ironman defeat prevents new launches",()=>{const s=start("hunter","ironman");s.defeat();return s.view().world.dead&&fire(s,"origin-0")===null});
 check("fictional reactions stored on character",()=>{const s=start();return s.reaction("amber","mist")==="binding-foam"&&s.view().character.journal.length===1});
 check("public view is detached from authoritative state",()=>{const s=start();const v=s.view();v.world.coins=10000;return s.view().world.coins===12});
 return results
}
for(const name of testSession(sessionFactory,createCore,worldFactory))console.log('PASS',name);
