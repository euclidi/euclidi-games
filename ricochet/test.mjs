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

import {newFinale,cameraStep,finalHit,finalActive,scoreLanding,prizeIndex,prizes} from "./finale.js";
import {arrangement} from "./music.js";
let s=newFinale();for(let i=0;i<30;i++)cameraStep(s,1/60,{x:380,y:270},[{x:330,y:250,vx:100,vy:50}]);assert.equal(s.phase,"approach");assert.ok(s.zoom>1.5&&s.rate<.4);for(let i=0;i<90;i++)cameraStep(s,1/60,{x:380,y:270},[{x:620,y:470,vx:100,vy:100}]);assert.equal(s.phase,"idle");assert.ok(s.zoom<1.01&&s.rate>.99);finalHit(s,380,270);assert.ok(finalActive(s));for(let i=0;i<100;i++)cameraStep(s,1/60,null,[]);assert.equal(s.phase,"fever");assert.ok(s.rate>.99);for(let i=0;i<5;i++){assert.equal(prizeIndex((i+.5)*768/5),i);assert.equal(scoreLanding(s,(i+.5)*768/5).amount,prizes[i])}assert.equal(s.bonus,170000);assert.equal(campaign.filter(b=>b.boss).length,5);assert.ok(campaign.filter(b=>b.boss).every(b=>b.pegs.filter(p=>p.bossCore).length===3));assert.equal(new Set(campaign.map((b,i)=>arrangement(b,i).signature)).size,50);assert.equal(new Set(campaign.map((b,i)=>JSON.stringify(arrangement(b,i).pattern))).size,50);console.log("PASS finale, boss and soundtrack logic");

import {roster,available,clearedCount,selectedCharacter,chooseCharacter} from "./characters.js";
assert.equal(roster.length,7);assert.equal(available(0).length,2);assert.equal(available(10).length,3);assert.equal(available(50).length,7);let profile={level:0,records:{}};assert.equal(chooseCharacter(profile,"orion"),false);assert.equal(chooseCharacter(profile,"moss"),true);assert.equal(selectedCharacter(profile).power,"Wide Bucket");profile.records["Campaign:49"]={shots:5};assert.equal(clearedCount(profile),50);assert.equal(chooseCharacter(profile,"orion"),true);console.log("PASS roster, selection, persistence migration and last-boss unlock");

import {classifyLayout,boardFit} from "./layout.js";
const cases=[[{width:390,height:844,coarse:true,hover:false,touch:true},"mobile-portrait"],[{width:844,height:390,coarse:true,hover:false,touch:true},"mobile-landscape"],[{width:1280,height:800},"desktop"],[{width:820,height:1180,coarse:true,hover:false,touch:true},"tablet"],[{width:520,height:900},"mobile-portrait"],[{width:1440,height:900,touch:true},"desktop"]];for(const [input,expected] of cases){assert.equal(classifyLayout(input),expected);const fit=boardFit({...input,layout:expected});assert.ok(fit.width<=input.width);assert.ok(Math.abs(fit.height-fit.width*.75)<1)}console.log("PASS adaptive layout classifier and board fit");
