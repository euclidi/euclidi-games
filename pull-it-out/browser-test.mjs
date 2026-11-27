import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const p=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8765/pull-it-out/');
 await p.waitForFunction(()=>window.PullItOut?.snapshot().ready,null,{timeout:60000});const s=()=>p.evaluate(()=>window.PullItOut.snapshot()),until=(expr)=>p.waitForFunction(expr,null,{timeout:30000});
 await p.locator('#stage').screenshot({path:'pull-it-out-gameplay.png'});assert.equal((await s()).objects.length,6);
 await p.keyboard.down('q');await until(()=>window.PullItOut.snapshot().position.y<1.05);await p.keyboard.up('q');await p.locator('#grip').click();assert((await s()).held,'Claw must acquire starting object');
 await p.keyboard.down('e');await until(()=>window.PullItOut.snapshot().objects[0].free);await p.keyboard.up('e');assert((await s()).objects[0].free);
 await p.keyboard.down('s');await until(()=>window.PullItOut.snapshot().position.z>2.53);await p.keyboard.up('s');
 await p.locator('#grip').click();await until(()=>window.PullItOut.snapshot().count===1);assert((await s()).score>0);
 await p.locator('#mode').click();assert((await s()).challenge);await p.locator('#reset').click();assert.equal((await s()).count,0);assert.equal(errors.length,0,errors.join('\n'));
 await p.reload();await p.waitForFunction(()=>window.PullItOut?.snapshot().ready,null,{timeout:60000});assert((await p.locator('#record').textContent()).includes('1/6'));
 const m=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await m.goto('http://127.0.0.1:8765/pull-it-out/');await m.waitForFunction(()=>window.PullItOut?.snapshot().ready,null,{timeout:60000});assert(await m.locator('#grip').isVisible());await m.screenshot({path:'pull-it-out-mobile.png'});console.log('Desktop extraction, tray scoring, persistence and mobile boot pass');
}finally{await browser.close()}