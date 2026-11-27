import {E} from './engine.mjs';
export function runTests(){
 const s=E.create(),base=E.totals(s),checks=[],test=(n,c)=>{if(!c)throw Error(n);checks.push(n)},b=E.bowl,p=E.plate;
 test("empty-space stroke rejected",E.cut(s,{x:0,z:4},{x:1,z:4})===0);
 test("finite swipe splits onion only",E.cut(s,{x:-4.3,z:.35},{x:-2.95,z:.35})===1);
 test("onion mass preserved",Math.abs(E.totals(s).onion-base.onion)<1e-8);
 test("pit prevents premature pickup",E.pickup(s,E.skins[0])===0);
 for(const skin of E.skins){E.open(s,skin);E.open(s,skin)}
 let guard=0;while(s.food.some(f=>f.loc==="skin")&&guard++<50){const f=s.food.find(f=>f.loc==="skin");E.pickup(s,f,.24);E.drop(s,{x:b.x+(f.half?-.42:.42),z:b.z})}
 test("both avocado halves emptied",!s.food.some(f=>f.loc==="skin")&&Math.abs(E.summary(s).bowl-240)<1e-8);
 const av=s.food.filter(f=>f.loc==="bowl"),a=av[0],far=av.find(f=>Math.hypot(f.x-a.x,f.z-a.z)>.55);
 E.mash(s,a,.8);test("local compression",a.crush>0&&!!far&&far.crush===0);
 for(const f of [...s.food].filter(f=>f.loc==="bowl"))E.mash(s,f,.7);
 test("texture reflects compression",E.summary(s).texture>.3);
 guard=0;while(s.food.some(f=>f.loc==="board")&&guard++<60){const f=s.food.find(f=>f.loc==="board");E.pickup(s,f,.30);E.drop(s,{x:b.x-.4,z:b.z+.2})}
 test("all five ingredient identities carried into bowl",E.summary(s).types.length===5);
 const f=s.food.find(f=>f.loc==="bowl"),start={x:f.x,z:f.z};E.fold(s,{x:f.x-.3,z:f.z},{x:f.x+.4,z:f.z});E.tick(s,1/60);test("fold actually displaces particles",Math.hypot(f.x-start.x,f.z-start.z)>1e-5);
 const target=s.food.find(f=>f.loc==="bowl");test("finite local lime",E.season(s,target,"lime",3)===3&&s.lime===45);test("finite local salt",E.season(s,target,"salt",1.5)===1.5&&s.salt===10.5);
 for(let i=0;i<90;i++)E.tick(s,1/60);
 test("seasoning conserved through mixing",Math.abs(E.summary(s).juice-3)<1e-7&&Math.abs(E.summary(s).salt-1.5)<1e-7);
 guard=0;while(E.summary(s).bowl>0&&guard++<80){const f=s.food.find(f=>f.loc==="bowl");E.pickup(s,f,.3);E.drop(s,p)}
 test("full serving empties bowl",E.summary(s).bowl===0&&Math.abs(E.summary(s).plate-408)<1e-7);
 test("no ingredient mass lost",Object.keys(base).every(k=>Math.abs(base[k]-E.totals(s)[k])<1e-7));
 test("save roundtrip",E.valid(JSON.parse(JSON.stringify(s))));
 return checks
}
