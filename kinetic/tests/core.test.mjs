import { createCore } from '../src/core.mjs';
function runTests(createCore){
 const c=createCore(), results=[];function check(name,test){if(!test())throw Error("FAILED "+name);results.push(name)}
 const make=(id="stone",uid="a",velocity=[10,3,0],extra={})=>c.launch({id,uid,position:[0,1,0],velocity,drag:0,...extra});
 const world={ground:-100,targets:[{id:"t",center:[5,1.3,0],radius:1,score:true}]};
 check("registry has 28 independent disciplines",()=>Object.keys(c.registry).length===28);
 check("all discipline trees nonempty",()=>Object.keys(c.registry).every(k=>c.treeFor(k).length>=2));
 check("unarmed commoner origin",()=>c.newState().inventory.length===0);
 check("hunter begins with bow",()=>c.newState("hunter").inventory[0].type==="shortbow");
 check("fixed timestep independent of frame rate",()=>{let a=make(),b=make();let x=c.fixedRunner(a,{ground:-100}),y=c.fixedRunner(b,{ground:-100});for(let i=0;i<60;i++)x(1/60);for(let i=0;i<30;i++)y(1/30);return a.position.every((n,i)=>Math.abs(n-b.position[i])<1e-9)});
 check("vacuum gravity matches analytic displacement",()=>{const p=make();for(let i=0;i<120;i++)c.step(p,{ground:-100});return Math.abs(p.position[1]-(1+3-c.G/2))<1e-8});
 check("swept fast collision",()=>{const p=make("stone","fast",[400,0,0]);c.step(p,{ground:-100,targets:[{id:"thin",center:[2,1,0],radius:.03,score:true}]});return p.events[0]?.target==="thin"&&!p.active});
 check("miss cannot receive success XP",()=>{let p=make("stone","miss");p.active=false;return c.score(c.newState(),p).general===0});
 check("successful flight awards only matching hierarchy",()=>{let p=make(),s=c.newState();while(p.active)c.step(p,world);let a=c.score(s,p);return a.specialization>0&&s.skills.stone.xp>0&&s.skills.improvised.xp>0&&!s.skills.longbow});
 check("same shot cannot award twice",()=>{let p=make(),s=c.newState();while(p.active)c.step(p,world);c.score(s,p);return c.score(s,p)===null});
 check("sandbox shots excluded",()=>{let p=make("stone","sandbox",[10,3,0],{practiceOnly:true});while(p.active)c.step(p,world);return c.score(c.newState(),p)===null});
 check("craft skill requires knowledge and prerequisites",()=>{let s=c.newState("hunter");c.award(s,"shortbow",10000);return !c.unlock(s,"shortbow","shortbow-craft")&&c.unlock(s,"shortbow","shortbow-handling")&&!c.unlock(s,"shortbow","shortbow-craft")&&(s.knowledge.push("shortbow-craft"),c.unlock(s,"shortbow","shortbow-craft"))});
 check("fictional reactions symmetric and journal deduplicated",()=>{let s=c.newState();return c.recordReaction(s,"mist","amber")==="binding-foam"&&c.recordReaction(s,"amber","mist")==="binding-foam"&&s.journal.length===1});
 check("purchase updates coins and reveals discipline",()=>{let s=c.newState();return c.buy(s,{type:"boomerang",price:5,uid:"b"})&&s.coins===7&&s.known.includes("boomerang")&&!c.buy(s,{type:"stone",price:8,uid:"c"})});
 check("fragile projectile records break",()=>{let p=make("flask","glass",[400,0,0],{compound:"mist"});c.step(p,{ground:-100,targets:[{id:"wall",center:[2,1,0],radius:.1}]});return p.events.some(e=>e.kind==="break"&&e.compound==="mist")});
 check("replay records finite trajectory samples",()=>{let p=make();while(p.active)c.step(p,world);return p.samples.length>2&&p.samples.every(s=>s.p.every(Number.isFinite))});
 check("uncapped level calculation",()=>c.xpLevel(1000000)>100);
 return results;
}
const results=runTests(createCore);
for(const name of results) console.log('PASS',name);
console.log(results.length+' tests passed');
