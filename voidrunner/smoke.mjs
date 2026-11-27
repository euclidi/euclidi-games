import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.VOIDRUNNER_URL||'http://127.0.0.1:8765/voidrunner/';
const browser=await chromium.launch({args:['--disable-webgl']});
await mkdir('artifacts/voidrunner',{recursive:true});
try{
 for(const viewport of [{width:1280,height:800},{width:390,height:740}]){
  const p=await browser.newPage({viewport}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  assert((await p.goto(base)).ok());await p.waitForFunction(()=>document.querySelector('#vr21')?.inspect?.().atlasSource==='licensed-earth');
  const inspect=()=>p.evaluate(()=>document.querySelector('#vr21').inspect());
  assert.equal((await inspect()).version,'0.25.0-asset');assert.equal(await p.locator('a[data-catalog-return]').getAttribute('href'),'../');
  await p.locator('#vr21scene').screenshot({path:'artifacts/voidrunner/orbit-'+viewport.width+'.png'});
  await p.click('#vr21surface');await p.waitForTimeout(200);assert((await inspect()).onGround);
  const start=await inspect();await p.keyboard.down('w');await p.waitForTimeout(400);await p.keyboard.up('w');assert.notDeepEqual((await inspect()).position,start.position);
  await p.keyboard.down('Space');await p.waitForTimeout(900);await p.keyboard.up('Space');assert((await inspect()).alt>.003);
  await p.click('#vr21dive');await p.waitForTimeout(250);assert((await inspect()).alt<0);
  await p.keyboard.press('2');await p.keyboard.press('f');await p.waitForTimeout(250);assert((await inspect()).iceCount>0);
  await p.click('#vr21entry');await p.waitForTimeout(250);assert((await inspect()).plasma>.05);
  await p.click('#vr21surface');await p.click('#vr21character');await p.click('#vr24save');
  assert(await p.evaluate(()=>!!localStorage.getItem('voidrunner-world-v24')));
  await p.reload();await p.waitForFunction(()=>document.querySelector('#vr21')?.inspect?.().atlasSource==='licensed-earth');await p.click('#vr21character');await p.click('#vr24load');await p.click('#vr21pause');const state=await inspect();assert(state.alt<.02);await p.waitForTimeout(200);assert.deepEqual((await inspect()).position,state.position);
  assert.deepEqual(errors,[]);await p.close();
 }
}finally{await browser.close()}
