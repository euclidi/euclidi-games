import assert from "node:assert/strict";
import {campaign,makeBoard,validate,dateSeed,scoreFor} from "./levels.js";
assert.equal(campaign.length,50);
assert.equal(new Set(campaign.map(b=>b.name)).size,50);
for(const b of campaign){assert.ok(b.pegs.length>=36);assert.ok(b.pegs.some(p=>p.type==="orange"));validate(b)}
assert.deepEqual(makeBoard(7,123),makeBoard(7,123));
assert.equal(dateSeed(new Date("2026-11-27T12:00:00Z")),20261127);
assert.throws(()=>validate({version:1,name:"bad",pegs:[]}));
assert.throws(()=>validate({version:1,name:"bad",pegs:[{x:NaN,y:100,type:"orange"}]}));
assert.ok(scoreFor("purple",10,12)>scoreFor("blue",10,12));
console.log("PASS 50 board structures, seeds, validation and scoring");
