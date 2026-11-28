import assert from "node:assert/strict";
import {sim} from "../simulation.js";
const s=sim.fresh();const use=(item)=>sim.action(s,{type:"tool",item,x:15,y:16});assert.equal(use("hoe"),"Tilled soil.");assert.equal(use("turnipSeed"),"Planted turnip.");
for(let i=0;i<8;i++){use("water");sim.action(s,{type:"sleep"})}
assert(s.plots["15,16"].growth>=4);assert.match(use("harvest"),/Harvested/);const money=s.coins;sim.action(s,{type:"sell",item:"turnip"});sim.action(s,{type:"sleep"});assert(s.coins>money);
const world=sim.fresh("campaign");for(let i=0;i<365;i++)sim.daily(world);assert.equal(world.day,366);assert(world.campaignScore!==null);assert(world.unlocked.includes("meadow"));assert(Object.values(world.market).every(m=>Number.isFinite(m.price)&&m.price>0));assert.deepEqual(JSON.parse(JSON.stringify(world)),world);
console.log("World tests passed.");
