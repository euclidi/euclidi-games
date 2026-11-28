import assert from "node:assert/strict";
import {sim} from "../simulation.js";
const s=sim.fresh();const use=(item)=>sim.action(s,{type:"tool",item,x:15,y:16});assert.equal(use("hoe"),"Tilled soil.");assert.equal(use("turnipSeed"),"Planted turnip.");
for(let i=0;i<8;i++){use("water");sim.action(s,{type:"sleep"})}
assert(s.plots["15,16"].growth>=4);assert.match(use("harvest"),/Harvested/);const money=s.coins;sim.action(s,{type:"sell",item:"turnip"});sim.action(s,{type:"sleep"});assert(s.coins>money);
const world=sim.fresh("campaign");for(let i=0;i<365;i++)sim.daily(world);assert.equal(world.day,366);assert(world.campaignScore!==null);assert(world.unlocked.includes("meadow"));assert(Object.values(world.market).every(m=>Number.isFinite(m.price)&&m.price>0));assert.deepEqual(JSON.parse(JSON.stringify(world)),world);
console.log("World tests passed.");

const idle=sim.fresh();let start=idle.minute,x=idle.npcs[0].x,y=idle.npcs[0].y;for(let i=0;i<60;i++)sim.action(idle,{type:"tick",minutes:10});assert.equal(idle.minute,start+600);assert(idle.npcs[0].x!==x||idle.npcs[0].y!==y);assert.equal(idle.npcs[0].activity,"Working");assert(sim.blocked({...idle,zone:"lake"},20,12));const before=idle.coins;sim.action(idle,{type:"job",item:"farmer"});assert(idle.coins>before);console.log("Autonomous time, schedule, collision and wages passed.");
