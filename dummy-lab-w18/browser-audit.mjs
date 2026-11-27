import {chromium} from 'playwright';import assert from 'node:assert/strict';
const base=process.env.DUMMY_URL||'http://127.0.0.1:8765/dummy-lab-w18/';
const browser=await chromium.launch({headless:false,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.waitForFunction(()=>window.dummyLabAudit?.snapshot().feeds.every(f=>f.frames>=2),null,{timeout:90000});
 let s=await page.evaluate(()=>window.dummyLabAudit.snapshot(true));
 assert.equal(s.revision,'W1.12');assert.equal(s.retro,false);assert.deepEqual(s.buffer,[1280,800]);assert.equal(s.feeds.length,3);assert(s.feeds.every(f=>f.range>12&&f.width===640&&f.height===480));assert.equal(new Set(s.feeds.map(f=>f.hash)).size,3);
 await page.mouse.click(640,400);
 await page.waitForFunction(()=>document.pointerLockElement===document.querySelector('body>canvas'),null,{timeout:10000});
 const yaw=await page.evaluate(()=>window.dummyLabAudit.snapshot().yaw);
 await page.mouse.move(710,400,{steps:5});await page.waitForFunction(y=>Math.abs(window.dummyLabAudit.snapshot().yaw-y)>.005,yaw,{timeout:5000});
 await page.evaluate(()=>document.exitPointerLock());await page.waitForFunction(()=>!document.pointerLockElement);
 await page.locator('#resolution').click();assert.equal(await page.locator('#resolution').textContent(),'480P');assert((await page.evaluate(()=>window.dummyLabAudit.snapshot().buffer[1]))<=480);
 await page.locator('#resolution').click();assert.equal(await page.locator('#resolution').textContent(),'NATIVE');
 await page.locator('#actions').click();await page.locator('#choice').selectOption('wave');await page.locator('#play').click();await page.locator('#close-actions').click();
 const before=await page.evaluate(()=>window.dummyLabAudit.snapshot(true));await page.waitForFunction(f=>window.dummyLabAudit.snapshot().feeds.every((x,i)=>x.frames>f[i].frames+1),before.feeds,{timeout:30000});const after=await page.evaluate(()=>window.dummyLabAudit.snapshot(true));assert(after.feeds.some((f,i)=>f.hash!==before.feeds[i].hash),'live feed did not change');
 assert.deepEqual(errors,[]);await page.screenshot({path:'dummy-w112-desktop.png'});await page.close();
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 await mobile.goto(base);await mobile.waitForFunction(()=>window.dummyLabAudit?.snapshot().feeds.every(f=>f.frames>0),null,{timeout:90000});assert(await mobile.locator('#pad').isVisible());assert(await mobile.evaluate(()=>!document.pointerLockElement));await mobile.screenshot({path:'dummy-w112-mobile.png'});await mobile.close();
 console.log('PASS native buffer, real pointer lock and mouse motion, release, live render targets and mobile initialization');
}finally{await browser.close();}
