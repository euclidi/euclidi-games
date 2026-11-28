import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/innuendo-town/?qa=1');
 await page.locator('#boot').waitFor({state:'hidden',timeout:30000});
 assert.equal(await page.locator('#canvas canvas').count(),1);
 await page.screenshot({path:'town-desktop.png'});
 await page.locator('#canvas canvas').screenshot({path:'town-cover.png'});
 const state=()=>page.evaluate(()=>window.townQA());
 const first=await state();
 assert.equal(first.town.agents.length,16);
 await page.waitForFunction(()=>window.townQA().town.decisions>0,null,{timeout:12000});
 const autonomous=await state();assert.ok(autonomous.town.time>first.town.time);assert.equal(autonomous.player.x,first.player.x);assert.equal(autonomous.player.y,first.player.y);
 assert.equal(first.vehicles.length,8);
 const frames={'yellow-down':[272,234,16,22],'red-down':[272,266,16,22],'green-left':[336,256,32,16],'green-right':[336,272,32,16]};
 for(const c of first.vehicles){assert.deepEqual([c.cutX,c.cutY,c.width,c.height],frames[c.frame]);assert.equal(c.angle,c.color==='green'?0:c.dir<0?90:-90)}
 for(const [key,dir,col,axis,sign] of [['s','down',24,'y',1],['w','up',25,'y',-1],['a','left',23,'x',-1],['d','right',26,'x',1]]){
  const before=await state();await page.keyboard.down(key);
  await page.waitForFunction(({dir,col,axis,sign,before})=>{const p=window.townQA().player;return p.dir===dir&&p.frame%27===col&&(p[axis]-before[axis])*sign>5},{dir,col,axis,sign,before:before.player},{timeout:4000});
  await page.screenshot({path:'town-facing-'+dir+'.png'});
  await page.keyboard.up(key);await page.waitForTimeout(180);
  const idle=(await state()).player;assert.equal(idle.dir,dir);assert.equal(idle.frame, idle.look*81+col);
 }
 const after=await state();assert.ok(after.vehicles.some((c,i)=>Math.abs(c.x-first.vehicles[i].x)>10));
 await page.locator('#canvas canvas').screenshot({path:'town-cover.png'});
 await page.locator('[data-tab=contacts]').click();
 assert.equal(await page.locator('#panel .entry').count(),16);
 await page.locator('[data-tab=directory]').click();
 assert.equal(await page.locator('#panel .entry').count(),8);
 await page.locator('#panel .entry').first().getByRole('button',{name:'Go'}).click();
 await page.waitForFunction(()=>document.querySelector('#district').textContent==='THE MEAT MARKET',{},{timeout:30000});
 const indoorStart=(await state()).town;
 await page.waitForFunction(t=>window.townQA().town.time>t+1,indoorStart.time,{timeout:5000});
 await page.screenshot({path:'town-interior.png'});
 await page.keyboard.down('w');await page.waitForTimeout(2200);await page.keyboard.up('w');await page.keyboard.press('e');
 assert.equal(await page.locator('#dialogue').isVisible(),true);
 await page.getByRole('button',{name:'Start shift'}).click();
 for(let i=0;i<3;i++){let order=(await page.locator('#dialogue p').nth(1).innerText()).replace('Requested: ','');await page.getByRole('button',{name:'Sort '+order,exact:true}).click()}
 assert.match(await page.locator('#dialogue').innerText(),/SHIFT COMPLETE/);
 assert.equal(await page.locator('#cash').innerText(),'$68');
 const savedTown=await page.evaluate(()=>JSON.parse(localStorage.getItem('euclidi.innuendo.v3')).townAI);
 assert.ok(savedTown.decisions>0);
 await page.reload();await page.locator('#boot').waitFor({state:'hidden',timeout:30000});
 const resumed=(await state()).town;assert.ok(resumed.decisions>=savedTown.decisions&&resumed.trades>=savedTown.trades&&resumed.time>=savedTown.time-0.01);
 assert.equal(await page.locator('#cash').innerText(),'$68');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.goto('http://127.0.0.1:8080/innuendo-town/');await mobile.locator('#boot').waitFor({state:'hidden',timeout:30000});await mobile.screenshot({path:'town-mobile.png'});
 assert.deepEqual(errors,[]);console.log('Browser smoke checks passed');
}finally{await browser.close()}
