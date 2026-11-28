import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../content.js',import.meta.url),'utf8');
const m=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
assert.equal(m.SHOPS.length,8);assert.equal(m.RESIDENTS.length,16);
assert.equal(m.isOpen(m.SHOPS[7],0),true);assert.equal(m.isOpen(m.SHOPS[7],720),false);
assert.equal(m.moneyFor(m.SHOPS[0],3),28);
assert.equal(m.pathfind(3,3,new Set([1]),{x:0,y:0},{x:2,y:0}).length,4);
assert.equal(m.pathfind(3,3,new Set([1,3]),{x:0,y:0},{x:2,y:2}).length,0);
const load=async file=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(new URL(file,import.meta.url),'utf8')).toString('base64'));
const social=await load('../social.js'), art=await load('../world-art.js');
const state={day:1,minute:540,rumors:[]};
assert.ok(social.witnessIncident(state,-1,0,'remark'));
assert.equal(social.spreadRumors(state,[[0,3]]).length,1);
assert.equal(social.spreadRumors(state,[[0,3]]).length,0);
state.minute=800;assert.equal(social.spreadRumors(state,[[3,4]]).length,0);
assert.equal(art.FACADES.length,8);assert.equal(art.INTERIORS.length,9);
assert.equal(art.destinationFor({id:1,work:1},720,1,0),1);
for(const f of art.FACADES){assert.ok(f.roof[0]+2<27);assert.ok(f.roof[1]+2<18)}
for(const layout of art.INTERIORS)for(const [x,y,c,r,w,h] of layout){assert.ok(c+w<=27&&r+h<=18&&x+w<=26&&y+h<=19)}
console.log('Logic, social propagation and atlas coordinate checks passed');

const sprites=await load('../sprite-art.js');
assert.deepEqual(sprites.DIR_COL,{left:23,down:24,up:25,right:26});
for(const [dx,dy,dir,col] of [[-1,0,'left',23],[0,1,'down',24],[0,-1,'up',25],[1,0,'right',26]]){
 assert.equal(sprites.facing(dx,dy),dir);
 for(let look=0;look<6;look++)for(let phase=0;phase<4;phase++)assert.equal(sprites.characterFrame(look,dir,phase)%27,col);
}
for(const r of Object.values(sprites.CAR_FRAMES)){assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=432&&r.y+r.h<=288);assert.ok(r.w!==16||r.h>16)}
assert.equal(sprites.vehiclePose('green',-1).frame,'green-left');
assert.equal(sprites.vehiclePose('green',1).frame,'green-right');
console.log('Character direction, walk-frame and complete-car bounds checks passed');

const town=await load('../town-ai.js');
let sim=town.ensureTownAI(null,540,m.SHOPS,m.RESIDENTS);
const start=JSON.stringify(sim);
assert.equal(sim.agents.length,16);assert.equal(sim.shops.length,8);
town.advanceTownAI(sim,570,m.SHOPS,m.RESIDENTS,m.pathfind);
assert.ok(sim.decisions>0);assert.notEqual(JSON.stringify(sim),start);
for(let i=1;i<=7;i++){
 town.advanceTownAI(sim,540+i*1440,m.SHOPS,m.RESIDENTS,m.pathfind);
 for(const a of sim.agents){
  assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>=0&&a.y>=0&&a.x<1152&&a.y<672);
  assert.ok(Number.isFinite(a.cash)&&a.cash>=0);
  for(const v of Object.values(a.needs))assert.ok(Number.isFinite(v)&&v>=0&&v<=100);
 }
 for(const s of sim.shops){assert.ok(s.stock>=0&&s.cash>=0&&s.revenue>=0)}
 sim=JSON.parse(JSON.stringify(sim));
 assert.equal(town.ensureTownAI(sim,540+i*1440,m.SHOPS,m.RESIDENTS),sim);
}
assert.ok(sim.decisions>500&&sim.trades>100&&sim.conversations>100&&sim.completedShifts>100);
assert.ok(Object.keys(sim.bonds).length>10);
assert.ok(sim.shops.every(s=>s.ordersFulfilled>0&&s.cash>0));
assert.ok(sim.shops.some(s=>s.restocks>0));
assert.ok(sim.agents.every(a=>a.decisionCount>10));
console.log('Seven-day autonomous town, route bounds, trade, wages, relationships and persistence checks passed:',sim.decisions,sim.trades,sim.conversations);
