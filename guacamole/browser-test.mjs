import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GUAC_URL||'http://127.0.0.1:8765/guacamole/preview.html?test=1');
 await page.waitForFunction(()=>window.__guacTest||document.getElementById('boot').textContent.includes('failed'),{},{timeout:60000});
 assert.equal(await page.evaluate(()=>!!window.__guacTest),true,await page.locator('#boot').textContent());
 assert.equal(await page.evaluate(()=>window.__guacTest.models().length),14);
 assert.equal((await page.evaluate(()=>window.__guacTest.tests())).length,15);
 const choose=t=>page.locator('[data-tool="'+t+'"]').click();
 const snap=()=>page.evaluate(()=>window.__guacTest.snapshot()),summary=()=>page.evaluate(()=>window.__guacTest.summary());
 const pos=p=>page.evaluate(q=>window.__guacTest.project(q.x,q.z),p);
 async function tap(p){const q=await pos(p);await page.mouse.click(q.x,q.y)}
 async function drag(a,b){const p=await pos(a),q=await pos(b);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(q.x,q.y,{steps:12});await page.mouse.up()}
 const bowl={x:2.1,z:-.75},plate={x:2.25,z:2.15};
 for(const p of [{x:-3.6,z:-1.35},{x:-2.15,z:-1.35}]){await tap(p);await tap(p)}
 assert.deepEqual((await snap()).open,[2,2]);
 await choose('knife');const onion=(await snap()).food.find(f=>f.type==='onion');
 await drag({x:onion.x-.7,z:onion.z},{x:onion.x+.7,z:onion.z});
 assert.ok((await snap()).food.filter(f=>f.type==='onion').length>=2);
 await choose('spoon');
 for(let i=0;i<65;i++){const f=(await snap()).food.find(f=>['skin','board','counter'].includes(f.loc));if(!f)break;await drag(f,bowl)}
 assert.equal(Math.round((await summary()).bowl),408);
 await choose('mash');const av=(await snap()).food.find(f=>f.type==='avocado'&&f.loc==='bowl'),q=await pos(av);
 await page.mouse.move(q.x,q.y);await page.mouse.down();await page.waitForTimeout(1300);await page.mouse.up();
 assert.ok((await summary()).texture>0);
 await choose('fold');await drag({x:bowl.x-.5,z:bowl.z},{x:bowl.x+.5,z:bowl.z});
 const food=(await snap()).food.find(f=>f.loc==='bowl');await choose('lime');await tap(food);await choose('salt');await tap(food);assert.ok((await summary()).juice>0);assert.ok((await summary()).salt>0);
 await choose('spoon');for(let i=0;i<65;i++){const f=(await snap()).food.find(f=>f.loc==='bowl');if(!f)break;await drag(f,plate)}
 assert.equal((await summary()).bowl,0);assert.equal(Math.round((await summary()).plate),408);
 await page.locator('#save').click();await page.reload();await page.waitForFunction(()=>window.__guacTest,{},{timeout:60000});assert.equal(Math.round((await summary()).plate),408);
 await page.locator('#left').click();await page.locator('#zin').click();await page.screenshot({path:'guacamole-desktop.png'});
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(process.env.GUAC_URL||'http://127.0.0.1:8765/guacamole/preview.html?test=1');await mobile.waitForFunction(()=>window.__guacTest,{},{timeout:60000});
 const mp=await mobile.evaluate(()=>window.__guacTest.project(-3.6,-1.35));await mobile.touchscreen.tap(mp.x,mp.y);assert.equal(await mobile.evaluate(()=>window.__guacTest.snapshot().open[0]),1);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mobile.screenshot({path:'guacamole-mobile.png'});
 assert.deepEqual(errors,[]);console.log('Browser full recipe, save/reload and mobile touch smoke test passed.');
}finally{await browser.close()}
