import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.CATALOG_URL||'http://127.0.0.1:8765/euclidi-games/';
const browser=await chromium.launch({headless:true});
try {
  for(const [width,height,mobile] of [[1280,800,false],[768,900,false],[390,844,true],[320,740,true]]) {
    const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
    assert((await page.goto(base,{waitUntil:'networkidle'})).ok());
    const style=await page.evaluate(async()=>{
      await document.fonts.ready;
      const h=document.querySelector('.intro h1'), p=document.querySelector('.intro p'), m=document.querySelector('.meta');
      return {fontLoaded:await document.fonts.load('400 16px "Press Start 2P"').then(x=>x.length>0),
        font:[h,p,m].map(x=>getComputedStyle(x).fontFamily),weight:getComputedStyle(h).fontWeight,
        tracking:getComputedStyle(h).letterSpacing,overflow:document.documentElement.scrollWidth>innerWidth,
        logo:document.querySelector('.mark').naturalWidth,
        cursor:getComputedStyle(h,'::after').content,
        cardColumns:getComputedStyle(document.querySelector('.games')).gridTemplateColumns};
    });
    assert(style.fontLoaded,'Local font failed to load');
    assert(style.font.every(x=>x.includes('Press Start 2P')));
    assert.equal(style.weight,'400');assert.equal(style.tracking,'1px');
    assert(!style.overflow,JSON.stringify(style));assert(style.logo>0);assert.notEqual(style.cursor,'none');
    const n=await page.locator('.game').count();assert(n>0);
    await page.locator('#search').fill('no-result-xyz');assert.equal(await page.locator('.game:visible').count(),0);
    await page.locator('#search').fill('');assert.equal(await page.locator('.game:visible').count(),n);
    await page.locator('[data-filter="Arcade"]').click();
    assert.equal(await page.locator('.game:visible:not([data-category="Arcade"])').count(),0);
    await page.locator('[data-filter="All"]').click();assert.equal(await page.locator('.game:visible').count(),n);
    if(!mobile){
      await page.locator('.brand').hover();assert.equal(await page.locator('.mark').evaluate(x=>getComputedStyle(x).animationName),'eg-logo-turn');
      await page.locator('.game').first().hover();await page.waitForTimeout(280);
      assert.notEqual(await page.locator('.game').first().evaluate(x=>getComputedStyle(x).transform),'none');
      await page.locator('.play').first().hover();assert.equal(await page.locator('.play').first().evaluate(x=>getComputedStyle(x).animationName),'eg-pixel-blink');
    }
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('main').evaluate(x=>getComputedStyle(x).animationName),'none');
    assert.equal(await page.locator('.intro h1').evaluate(x=>getComputedStyle(x,'::after').animationName),'none');
    assert.equal(errors.length,0,errors.join('\n'));
    await page.screenshot({path:'audit-artifacts/catalog-'+width+'.png',fullPage:true,animations:'disabled'});
    console.log('PASS',width,height,style);await page.close();
  }
} finally {await browser.close();}
