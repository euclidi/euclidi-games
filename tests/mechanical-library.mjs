import {chromium,firefox} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.CATALOG_URL||'http://127.0.0.1:8765/euclidi-games/';
await mkdir('audit-artifacts',{recursive:true});
for(const [engine,name] of [[chromium,'chromium'],[firefox,'firefox']]){
 const browser=await engine.launch(name==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{firefoxUserPrefs:{'webgl.force-enabled':true,'webgl.disabled':false}});
 try{for(const [width,height] of [[1280,800],[390,844]]){
 const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')console.log('browser error',m.text())});
 await p.goto(base+'?view=classic');const count=await p.locator('article.game').count();assert(count>0);
 await p.goto(base+'library/');await p.waitForFunction(()=>['true','error'].includes(document.body.dataset.ready),null,{timeout:60000});
 assert.equal(await p.locator('body').getAttribute('data-ready'),'true',await p.locator('#loading').textContent());
 assert.equal(Number(await p.locator('body').getAttribute('data-inventory')),count);
 assert.equal(await p.locator('#motion').inputValue(),'on');assert.equal(await p.locator('canvas').count(),2);
 assert(await p.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await p.waitForFunction(()=>Number(document.body.dataset.frames)>0);
 await p.screenshot({path:'audit-artifacts/'+name+'-'+width+'-initial.png',fullPage:true});
 console.log('INITIAL RENDER',name,width,count);
 const a=await p.locator('body').getAttribute('data-drum');await p.locator('[data-cat="Arcade"]').click();
 await p.waitForFunction(()=>!document.getElementById('retrieve').disabled);
 await p.waitForFunction(a=>document.body.dataset.drum!==a,a);
 await p.locator('#search').fill('PAC-MAN');await p.waitForFunction(()=>document.querySelectorAll('#titles button').length===1&&document.getElementById('name').textContent==='PAC-MAN'&&!document.getElementById('retrieve').disabled);
 await p.locator('#inspection').scrollIntoViewIfNeeded();const ib=await p.locator('#inspection').boundingBox();const r=await p.locator('body').getAttribute('data-inspect');await p.mouse.move(ib.x+ib.width/2,ib.y+ib.height/2);await p.mouse.down();await p.mouse.move(ib.x+ib.width*.85,ib.y+ib.height*.65,{steps:10});await p.mouse.up();await p.waitForFunction(r=>document.body.dataset.inspect!==r,r);
 await p.screenshot({path:'audit-artifacts/'+name+'-'+width+'-selection.png',fullPage:true});
 await p.locator('#retrieve').click();await p.waitForFunction(()=>document.body.dataset.delivery==='ready',null,{timeout:30000});assert(await p.locator('#play').isVisible());assert((await p.locator('#play').getAttribute('href')).includes('/pacman/'));assert.equal(await p.locator('#docs a').count(),4);assert(await p.locator('#launch').isVisible());await p.waitForFunction(()=>Number(document.body.dataset.lift)<.3);
 await p.screenshot({path:'audit-artifacts/'+name+'-'+width+'-delivered.png',fullPage:true});
 assert(await p.locator('#search').isDisabled());assert(await p.locator('[data-cat="Arcade"]').isDisabled());
 await p.locator('#return').click();await p.waitForFunction(()=>document.body.dataset.delivery==='empty'&&!document.getElementById('retrieve').disabled);
 await p.locator('#motion').selectOption('off');await p.locator('#retrieve').click();await p.waitForFunction(()=>document.body.dataset.delivery==='ready');
 assert.equal(errs.length,0,errs.join('\n'));console.log('PASS mechanical',name,width,count);await p.close();
 }}finally{await browser.close();}
}
