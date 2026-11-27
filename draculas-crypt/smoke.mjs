import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
try {
 await mkdir('artifacts/draculas-crypt',{recursive:true});
 for(const [mode,width,height] of [['webgl',1280,800],['software',390,844]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(mode==='webgl') await page.route('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js',r=>r.fulfill({path:'node_modules/three/build/three.module.js',contentType:'text/javascript',headers:{'access-control-allow-origin':'*'}}));
  await page.goto('http://127.0.0.1:8765/draculas-crypt/'+(mode==='software'?'?renderer=software':''));
  await page.locator('[data-renderer="'+mode+'"]').waitFor({timeout:60000});
  if(mode==='webgl'&&process.env.CRYPT_REQUIRE_ASSETS!=='1') {
   await page.waitForFunction(()=>['partial','scanned'].includes(document.querySelector('#cpr8').dataset.assetState));
   const count=Number(await page.locator('#cpr8').getAttribute('data-asset-families'));
   assert(count>=2,'Locally committed stone and wood must load');
  }
  if(mode==='webgl'&&process.env.CRYPT_REQUIRE_ASSETS==='1') { await page.locator('[data-asset-state="scanned"][data-asset-families="3"]').waitFor({timeout:60000}); assert.equal(await page.locator('#cpr8').getAttribute('data-version'),'0.13.1'); }
  for(const v of ['tomb','priest','cloth','gate','wide']){await page.locator('[data-v='+v+']').click();assert(await page.locator('[data-v='+v+']').evaluate(e=>e.classList.contains('sel')));}
  for(const [key,on,off] of [['pause','RESUME','PAUSE'],['fire','FLAMES OFF','FLAMES ON'],['mist','MIST OFF','MIST ON'],['follow','FOLLOW ON','FOLLOW OFF'],['sound','SOUND ON','SOUND OFF']]){
   const s='[data-'+key+']';await page.locator(s).click();await page.waitForFunction(([s,t])=>document.querySelector(s).textContent===t,[s,on],{timeout:10000});await page.locator(s).click();await page.waitForFunction(([s,t])=>document.querySelector(s).textContent===t,[s,off],{timeout:10000});
  }
  assert.equal(await page.locator('[data-catalog-return]').getAttribute('href'),'../');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
  await page.locator('[data-v=wide]').click();await page.waitForTimeout(1800);
  await page.screenshot({path:'artifacts/draculas-crypt/'+mode+'.png'});
  assert.deepEqual(errors,[]);await page.close();console.log(mode+' smoke passed');
 }
}finally{await browser.close();}
