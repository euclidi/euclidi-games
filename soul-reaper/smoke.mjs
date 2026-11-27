import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
try{
const page=await browser.newPage({viewport:{width:1280,height:800}});
page.on('pageerror',e=>errors.push(e.message));
page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
await page.goto('http://127.0.0.1:8765/soul-reaper/',{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.__soulReaperV8?.assetsLoaded===3,{},{timeout:30000});
assert.equal(await page.locator('canvas').count(),1);
await page.locator('#sr4-start').click();
await page.waitForFunction(()=>window.__soulReaperV8.G.mode==='play');
await page.keyboard.down('w');await page.waitForTimeout(600);await page.keyboard.up('w');
assert(await page.evaluate(()=>Math.hypot(__soulReaperV8.P.x,__soulReaperV8.P.z)>0.1),'keyboard movement');
const checks=await page.evaluate(()=>{
const d=__soulReaperV8;d.reset();d.G.muted=true;
const boss=d.spawn('warden',d.P.x+.2,d.P.z);boss.stun=1;d.executeOrDash();
const bossSafe=d.ghosts.includes(boss)&&boss.hp===18;
d.reset();d.G.muted=true;d.G.time=21.1;d.update(.016);
const relic=document.querySelector('#sr4-relic-grid button');if(!relic)throw Error('relic missing');relic.click();
const reach=d.G.up.reach===1&&d.bladeMount.scale.x>1;
d.reset();d.G.muted=true;d.reap([0,1]);const swing=d.G.slash>0;
return {bossSafe,reach,swing,assets:d.assetsLoaded,vertices:d.blade.geometry.attributes.position.count};
});
assert(checks.bossSafe,'boss execution bypass');assert(checks.reach,'reach relic');assert(checks.swing,'swing initiation');assert(checks.vertices>0,'blade mesh');assert.equal(checks.assets,3);
await fs.mkdir('artifacts/soul-reaper',{recursive:true});
await page.screenshot({path:'artifacts/soul-reaper/desktop.png'});
const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
mobile.on('pageerror',e=>errors.push(e.message));
await mobile.goto('http://127.0.0.1:8765/soul-reaper/',{waitUntil:'networkidle'});
await mobile.waitForFunction(()=>window.__soulReaperV8?.assetsLoaded===3);
await mobile.locator('#sr4-start').tap();
await mobile.locator('#sr4-reap').tap();
assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile horizontal overflow');
await mobile.screenshot({path:'artifacts/soul-reaper/mobile.png'});
assert.deepEqual(errors,[]);console.log('PASS',checks,'mobile boot and attack input');
}finally{await browser.close()}
