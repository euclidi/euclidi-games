import {worldFactory} from '../src/world.mjs';
function testWorld(factory){
 const a=factory(),out=[];const check=(n,f)=>{if(!f())throw Error(n);out.push(n)};
 check("day transition updates NPC schedules",()=>{const w=a.newWorld();a.tick(w,800);return w.npcs.every(n=>n.location===n.home)});
 check("purchase and consumption conserve inventory",()=>{const w=a.newWorld();w.hunger=40;return a.purchase(w,"food",2,3)&&w.coins===6&&a.eat(w)&&w.items.food===1&&w.hunger===5});
 check("cannot purchase in forest",()=>{const w=a.newWorld();a.travel(w,"forest");return !a.purchase(w,"food",1,1)});
 check("jobs require membership and correct location",()=>{const w=a.newWorld();a.travel(w,"forest");return !a.startJob(w,"hunt")&&a.join(w,"hunters")&&a.startJob(w,"hunt")});
 check("job completion pays exactly once",()=>{const w=a.newWorld();a.startJob(w,"delivery");a.tick(w,60);a.tick(w,60);return w.coins===18&&w.completed.length===1});
 check("rent and sleep",()=>{const w=a.newWorld();a.travel(w,"lodging");w.fatigue=80;return a.rent(w)&&a.sleep(w)&&w.fatigue<30});
 check("rent expires",()=>{const w=a.newWorld();a.travel(w,"lodging");a.rent(w);a.tick(w,1440);return w.accommodation===null});
 check("crime without witnesses not reported",()=>{const w=a.newWorld();return a.witness(w,{id:"1",kind:"theft",location:"forest",witnesses:["mara"]})&&w.wanted===0});
 check("actual witness produces reputation change and rumor",()=>{const w=a.newWorld();return a.witness(w,{id:"1",kind:"theft",location:"market",witnesses:["mara","mara"]})&&w.wanted===2&&w.relations.mara===-2&&w.rumors.length===1});
 check("fine clears wanted and costs funds",()=>{const w=a.newWorld();w.wanted=2;return a.fine(w)&&w.coins===2&&w.wanted===0});
 check("prison prevents travel until time served",()=>{const w=a.newWorld();w.wanted=1;return a.surrender(w)&&!a.travel(w,"forest")&&(a.tick(w,180),a.travel(w,"forest"))});
 check("ironman defeat persists through serialization",()=>{const w=a.newWorld("commoner","ironman");a.defeat(w);const r=a.restore(a.serialize(w));return r.dead&&r.health===0});
 check("standard defeat causes injury and loss",()=>{const w=a.newWorld();a.defeat(w);return w.coins===10&&w.health===80});
 check("snapshot roundtrip",()=>{const w=a.newWorld();a.addItem(w,"food",3);return a.serialize(a.restore(a.serialize(w)))===a.serialize(w)});
 return out;
}
for(const t of testWorld(worldFactory))console.log('PASS',t);
