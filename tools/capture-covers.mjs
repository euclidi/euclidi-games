// Capture actual rendered game frames; never generate illustrations or alter game state via test APIs.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.COVER_BASE||'http://127.0.0.1:8765/euclidi-games/';
const out=process.env.COVER_OUTPUT||'cover-captures';
const source=process.env.GITHUB_SHA||'local';
const recipes={
  "innuendo town":{slug:"innuendo-town",selector:"#canvas canvas",prepare:async p=>{await p.locator('#boot').waitFor({state:'hidden',timeout:60000});}},
  "voidrunner":{slug:"voidrunner",selector:"#vr21scene",prepare:async p=>{await p.waitForFunction(()=>document.querySelector('#vr21')?.inspect?.().mapReady,null,{timeout:60000});for(let i=0;i<3;i++)await p.locator('#vr21quality').click();await p.waitForTimeout(1200);}},
  "creatture":{slug:"creatture",selector:"#stage",prepare:async p=>{await p.locator('#name').filter({hasText:'Primordium'}).waitFor({timeout:60000});for(const n of ['Membrane','Nutrients','Water','Light','Minerals','Muscle','Nerves','Microbes','Spores','Heat','Catalyst','Resonance'])await p.getByRole('button',{name:n,exact:true}).click();await p.waitForTimeout(1600);}},
  "sector zero":{slug:"sector-zero",selector:"#game canvas",prepare:async p=>{await p.locator('#boot').waitFor({state:'hidden',timeout:60000});await p.locator('#right').click();}},
  "dummy lab":{slug:"dummy-lab",selector:"canvas",prepare:async p=>{await p.locator('#load').waitFor({state:'hidden',timeout:60000});await p.waitForFunction(()=>document.querySelector('#state')?.textContent.includes('FPS'),null,{timeout:60000});}},
  "sanctuary":{slug:"sanctuary",selector:"#view",prepare:async p=>{await p.locator('#load').waitFor({state:'hidden',timeout:60000});await p.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('DAY'),null,{timeout:60000});}},
  "dojo x":{slug:"dojo",selector:"#c",prepare:async p=>{await p.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Persistent archive ready'),null,{timeout:60000});await p.locator('#play').click();await p.waitForTimeout(850);}},
  "pac-man":{slug:"pacman",selector:"#board canvas",prepare:async p=>{await p.waitForFunction(()=>document.documentElement.dataset.gameReady==='true');await p.locator('#start').click();await p.waitForTimeout(4600);await p.keyboard.press('ArrowLeft');}},
  "night watch shooter fps":{slug:"night-watch",selector:"#game",prepare:async p=>{await p.waitForFunction(()=>document.documentElement.dataset.gameReady==='true',null,{timeout:60000});await p.locator('#play').click();await p.locator('#overlay').waitFor({state:'hidden'});await p.keyboard.down('w');await p.waitForTimeout(600);await p.keyboard.up('w');}},
  "backyard astronaut":{slug:"backyard-astronaut",selector:"canvas",prepare:async p=>{await p.waitForFunction(()=>document.documentElement.dataset.gameReady==='true',null,{timeout:60000});}},
  "brick breaker":{slug:"brick-breaker",selector:"#field",prepare:async p=>{await p.waitForFunction(()=>window.BrickBreaker?.snapshot().state==='ready',null,{timeout:60000});await p.locator('#launch').click();await p.waitForFunction(()=>window.BrickBreaker?.snapshot().state==='playing');}},
  "the meeting seam":{slug:"meeting-seam",selector:"#cave",prepare:async p=>{await p.waitForFunction(()=>document.documentElement.dataset.gameReady==='true',null,{timeout:60000});await p.locator('[data-speed="12"]').click();await p.waitForFunction(()=>window.meetingSeam.state.removed>0,null,{timeout:60000});await p.locator('#pause').click();}},
  "snake lcd organic":{slug:"snake",selector:"#device",prepare:async p=>{await p.waitForFunction(()=>window.__snake?.renderer,null,{timeout:60000});await p.locator('#organic').click();await p.waitForFunction(()=>window.__snake?.running&&window.__snake.mode==='organic');}},
  "ricochet":{slug:"ricochet",selector:"#screen canvas",prepare:async p=>{await p.waitForFunction(()=>window.__ricochet,null,{timeout:90000});await p.getByRole('button',{name:'Quick Play',exact:true}).click();await p.locator('#modes button').filter({hasText:'Campaign'}).first().click();await p.locator('#fire').click();}},
  "lunar angler":{slug:"lunar-angler",selector:"#stage canvas",prepare:async p=>{await p.waitForFunction(()=>document.body.dataset.ready==='true'&&Number(document.body.dataset.frames)>2,null,{timeout:60000});}}
};
await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const records=[],failed=[];
try{
 const catalog=await browser.newPage({viewport:{width:1280,height:800}});
 assert((await catalog.goto(base,{waitUntil:'domcontentloaded'})).ok());
 const cards=await catalog.locator('article.game').evaluateAll(els=>els.map(e=>({name:e.dataset.name,title:e.querySelector('h2')?.textContent?.trim(),href:e.querySelector('a.play')?.getAttribute('href'),kind:e.querySelector('a.cover')?.dataset.coverKind,existing:e.querySelector('a.cover img')?.getAttribute('src')})));
 await catalog.close();
 for(const card of cards){
  if(card.kind==='box-art'&&card.existing)continue; // Never overwrite approved box art.
  if(card.kind==='gameplay'&&card.existing&&process.env.REFRESH_COVERS!=='true')continue;
  const r=recipes[card.name];if(!r){failed.push({name:card.name,error:'Missing capture recipe; add one or approved box art'});continue;}
  const p=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1,reducedMotion:'reduce'});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',res=>{if(res.url().startsWith(base)&&res.status()>=400&&!res.url().includes('favicon.ico'))errors.push('HTTP '+res.status()+' '+res.url())});
  try{
   const url=new URL(card.href,base);assert(url.href.startsWith(base),'Unexpected external launch path');
   assert((await p.goto(url.href,{waitUntil:'domcontentloaded',timeout:60000})).ok());
   await r.prepare(p);
   const view=p.locator(r.selector).first();await view.waitFor({state:'visible',timeout:30000});
   const box=await view.boundingBox();assert(box&&box.width>=100&&box.height>=100,'Game viewport missing or too small');
   await p.waitForTimeout(500);
   assert.equal(errors.length,0,errors.join('; '));
   const file=r.slug+'.png';
   await view.screenshot({path:out+'/'+file,timeout:15000,animations:'allow'});
   assert.equal(errors.length,0,errors.join('; '));
   records.push({name:card.name,title:card.title,route:card.href,slug:r.slug,file,selector:r.selector,source,viewport:[1280,800]});
   console.log('CAPTURED',card.name,card.href,Math.round(box.width)+'x'+Math.round(box.height));
  }catch(e){failed.push({name:card.name,error:String(e.message)+' '+errors.join('; ')});console.error('FAILED',card.name,e.message);}
  finally{await p.close();}
 }
}finally{await browser.close();}
await writeFile(out+'/captures.json',JSON.stringify({source,records,failed},null,2)+'\n');
console.log('Captured',records.length,'failed',failed.length);
