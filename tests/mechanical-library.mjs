import {chromium,firefox} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.CATALOG_URL||'http://127.0.0.1:8765/euclidi-games/';
const prefix=process.env.CATALOG_URL?'live':'local';
await mkdir('audit-artifacts',{recursive:true});
async function fit(p,phase){
 const info=await p.evaluate(()=>{const h=document.documentElement,ids=['stage','categories','search-open','prev','next','lcd','titles','name','details-open'];for(const id of ['retrieve','launch','play','return','inspect-open'])if(document.getElementById(id).getClientRects().length)ids.push(id);const bounds=ids.map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}});return {w:innerWidth,h:innerHeight,scrollW:h.scrollWidth,scrollH:h.scrollHeight,scrollX,scrollY,bounds}});
 assert(info.scrollW<=info.w+1&&info.scrollH<=info.h+1,phase+' document overflows '+JSON.stringify(info));
 assert(info.scrollX===0&&info.scrollY===0,phase+' page moved');
 for(const r of info.bounds)assert(r.x>=-1&&r.y>=-1&&r.right<=info.w+1&&r.bottom<=info.h+1&&r.width>0&&r.height>0,phase+' off-screen '+JSON.stringify(r));
 assert(info.bounds.find(r=>r.id==='stage').height>=70,phase+' machine too short');
}
for(const [engine,name] of [[chromium,'chromium'],[firefox,'firefox']]){
 const browser=await engine.launch(name==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{headless:!process.env.DISPLAY,firefoxUserPrefs:{'webgl.force-enabled':true,'webgl.disabled':false,'webgl.enable-webgl2':true,'gfx.webrender.software':true}});
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});p.setDefaultTimeout(60000);const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')console.log('browser error',m.text())});
 await p.goto(base+'?view=classic');const count=await p.locator('article.game').count();assert(count>0);
 await p.goto(base+'library/');await p.waitForFunction(()=>['true','error'].includes(document.body.dataset.ready),null,{timeout:90000});const ready=await p.locator('body').getAttribute('data-ready');
 if(ready==='error'){
  const canWebGL=await p.evaluate(()=>{try{return !!document.createElement('canvas').getContext('webgl2')}catch{return false}});
  assert.equal(canWebGL,false,'Renderer failed despite available WebGL2');
  assert(await p.locator('#loading a').isVisible());await p.locator('#loading a').click();assert.equal(await p.locator('article.game').count(),count);
  console.log('UNSUPPORTED WEBGL2 ENVIRONMENT:',name,'Classic fallback verified; mechanical rendering NOT tested');await p.close();
  if(name==='chromium')throw new Error('Required Chromium WebGL2 unavailable');continue;
 }
 assert.equal(Number(await p.locator('body').getAttribute('data-inventory')),count);assert.equal(await p.locator('#motion').inputValue(),'on');
 await p.waitForFunction(()=>Number(document.body.dataset.frames)>0);
 for(const [width,height] of [[320,568],[360,640],[390,844],[412,915],[667,375],[844,390],[768,1024],[1280,720],[1920,1080]]){
  await p.setViewportSize({width,height});await p.waitForFunction(()=>document.body.dataset.viewport===innerWidth+'x'+innerHeight);await fit(p,name+' '+width+'x'+height);await p.screenshot({path:'audit-artifacts/'+prefix+'-'+name+'-'+width+'x'+height+'.png'});console.log('FIT',name,width,height);
 }
 await p.setViewportSize({width:390,height:844});await p.waitForFunction(()=>document.body.dataset.viewport==='390x844');
 await p.locator('#categories').selectOption('Arcade');await p.waitForFunction(()=>document.body.dataset.busy==='false'&&!document.getElementById('retrieve').disabled);await fit(p,'category');
 await p.locator('#search-open').click();await p.locator('#search').fill('PAC-MAN');await p.locator('#search-form button[type=submit]').click();await p.waitForFunction(()=>document.querySelectorAll('#titles button').length===1&&document.getElementById('name').textContent==='PAC-MAN'&&!document.getElementById('retrieve').disabled);
 await p.locator('#titles button').first().click();await p.waitForFunction(()=>document.body.dataset.held==='true'&&document.body.dataset.heldSame==='true'&&document.body.dataset.busy==='false');assert(await p.locator('#inspection').isVisible());assert.equal(await p.locator('canvas').count(),1);await fit(p,'inspection mode');const ib=await p.locator('#stage').boundingBox();await p.mouse.move(ib.x+ib.width/2,ib.y+ib.height/2);await p.mouse.down();await p.mouse.move(ib.x+ib.width*.85,ib.y+ib.height*.65,{steps:6});await p.mouse.up();await p.waitForFunction(()=>Math.abs(Number(document.body.dataset.inspect)+.18)>.1);await p.screenshot({path:'audit-artifacts/'+prefix+'-'+name+'-inspection.png'});await p.locator('#inspect-close').click();await p.waitForFunction(()=>document.body.dataset.held==='false'&&document.body.dataset.busy==='false');
 await p.locator('#inspect-open').click();await p.waitForFunction(()=>document.body.dataset.held==='true'&&document.body.dataset.busy==='false');await p.locator('#inspect-open').click();await p.waitForFunction(()=>document.body.dataset.held==='false'&&document.body.dataset.busy==='false');
 await p.locator('#details-open').click();assert.equal(await p.locator('#docs a').count(),4);await p.locator('#details-dialog [data-close]').click();await fit(p,'before retrieval');
 await p.locator('#retrieve').click();await fit(p,'during retrieval');await p.waitForFunction(()=>document.body.dataset.delivery==='ready',null,{timeout:60000});assert(await p.locator('#play').isVisible());assert((await p.locator('#play').getAttribute('href')).includes('/pacman/'));await fit(p,'delivered');await p.setViewportSize({width:320,height:568});await p.waitForFunction(()=>document.body.dataset.viewport==='320x568');await fit(p,'small screen delivered');await p.setViewportSize({width:844,height:390});await p.waitForFunction(()=>document.body.dataset.viewport==='844x390');await fit(p,'landscape delivered');await p.setViewportSize({width:390,height:844});await p.waitForFunction(()=>document.body.dataset.viewport==='390x844');await p.screenshot({path:'audit-artifacts/'+prefix+'-'+name+'-delivered.png'});
 await p.locator('#return').click();await p.waitForFunction(()=>document.body.dataset.delivery==='empty'&&!document.getElementById('retrieve').disabled);await fit(p,'returned');
 await p.locator('#settings-open').click();await p.locator('#motion').selectOption('off');await p.locator('#settings-dialog [data-close]').click();await p.locator('#retrieve').click();await p.waitForFunction(()=>document.body.dataset.delivery==='ready',null,{timeout:60000});await fit(p,'motion off delivery');
 assert.equal(errs.length,0,errs.join('\n'));console.log('PASS mechanical',name,count);await p.close();
 }finally{await browser.close();}
}
