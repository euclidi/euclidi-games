import { chromium, firefox } from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.CATALOG_URL||'http://127.0.0.1:8765/euclidi-games/';
await mkdir('audit-artifacts',{recursive:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function sampled(page,sel,property,pseudo,ms=1800){
  const values=await page.evaluate(async({sel,property,pseudo,ms})=>{
    const el=document.querySelector(sel),vals=new Set(),start=performance.now();
    while(performance.now()-start<ms){vals.add(getComputedStyle(el,pseudo||null)[property]);await new Promise(r=>setTimeout(r,65));}
    return [...vals];
  },{sel,property,pseudo,ms});
  assert(values.length>1,sel+' '+property+' never changed: '+JSON.stringify(values));return values;
}
for(const [name,engine] of [['chromium',chromium],['firefox',firefox]]){
 const browser=await engine.launch({headless:true});
 try{
 for(const [width,height,mobile] of [[1280,800,false],[768,900,false],[390,844,true],[320,740,true]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:width===1280?'reduce':'no-preference',...(name==='chromium'&&mobile?{isMobile:true,hasTouch:true}:{})});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
   assert((await page.goto(base+'?design-audit='+Date.now(),{waitUntil:'networkidle'})).ok());
   await page.locator('#crt-replay').waitFor();
   const palette=await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return Object.fromEntries(['--bg','--panel','--line','--fg','--muted','--accent'].map(k=>[k,s.getPropertyValue(k).trim()]))});
   assert.deepEqual(palette,{'--bg':'#111111','--panel':'#191919','--line':'#353535','--fg':'#eeeeee','--muted':'#a6a6a6','--accent':'#dddddd'});
   assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(17, 17, 17)');
   assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'),'#111111');
   assert.equal(await page.locator('body').getAttribute('data-motion'),'on');
   assert.equal(await page.locator('#motion-mode').inputValue(),'on');
   assert.equal(await page.locator('#motion-status').textContent(),'On (default)');
   console.log('motion environment',name,width,await page.evaluate(()=>({hover:matchMedia('(hover:hover)').matches,fine:matchMedia('(pointer:fine)').matches,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,mode:document.body.dataset.motion})));
   await page.waitForFunction(()=>!document.querySelector('.eg-crt').classList.contains('is-playing'));
   const layout=await page.evaluate(async()=>{
     const font=(await document.fonts.load('400 16px "Sinistre"')).length>0;
     const selectors='.brand,.top nav a,.intro h1,.intro p,.eyebrow,.meta span,.count,.foot,.catalog-heading h2,.info h2,.info p,.cover-title,.cover-top,.cover-bottom,.play,.actions a,.project-docs a,.filters button,.search input';
     const items=[...document.querySelectorAll(selectors)].map(el=>{const s=getComputedStyle(el);return {text:el.textContent.trim().slice(0,55),className:el.className,display:el.matches(".intro h1,.info h2,.cover-title"),font:s.fontFamily,weight:s.fontWeight,size:parseFloat(s.fontSize),tracking:s.letterSpacing,overflow:el.clientWidth>0&&el.scrollWidth>el.clientWidth+2&&el.tagName!=='INPUT'};});
     const clipped=[...document.querySelectorAll('.cover')].flatMap(cover=>{const r=cover.getBoundingClientRect();return [...cover.querySelectorAll('.cover-title,.cover-top,.cover-bottom')].filter(e=>{const t=e.getBoundingClientRect();return t.left<r.left-1||t.right>r.right+1||t.top<r.top-1||t.bottom>r.bottom+1;}).map(e=>e.textContent);});
     return {revision:document.body.dataset.designRevision,font,logo:document.querySelector('.mark').naturalWidth,overflow:document.documentElement.scrollWidth>innerWidth,items,clipped};
   });
   assert.equal(layout.revision,'8');assert(layout.font);assert(layout.logo>0);assert(!layout.overflow);
   assert.equal(layout.clipped.length,0,JSON.stringify(layout.clipped));
   for(const i of layout.items){assert.equal(i.font.includes('Sinistre'),i.display,JSON.stringify(i));if(!i.display)assert(i.font.includes('system-ui'),JSON.stringify(i));assert(['400','600'].includes(i.weight),JSON.stringify(i));assert.equal(i.tracking,'0px',JSON.stringify(i));assert(i.size>=11.9&&i.size<=42.1,JSON.stringify(i));assert(!i.overflow,JSON.stringify(i));}

   assert.equal(await page.locator('a[href="./library/"]').count(),0);
   assert.equal(await page.locator('header a[href="https://euclidi.github.io/euclidi-labs/"]').count(),1);
   assert.equal(await page.locator('header a[href="https://github.com/euclidi/euclidi-games"]').count(),1);
   assert.equal(await page.locator('footer a[href="https://github.com/euclidi/euclidi-labs"]').count(),1);
   const n=await page.locator('.game').count();assert(n>0);
   await page.screenshot({path:'audit-artifacts/'+name+'-'+width+'-layout.png',fullPage:true});
   await page.locator('#crt-replay').click();
   const shutter=await sampled(page,'.eg-crt','transform','::before',850);
   assert(shutter.some(x=>x!=='none'));console.log('CRT frames',name,width,shutter);
   await page.waitForFunction(()=>!document.querySelector('.eg-crt').classList.contains('is-playing'));
   const cursor=await sampled(page,'.intro h1','opacity','::after',1400);assert(cursor.includes('0')&&cursor.includes('1'));
   if(!mobile){
     const brand=page.locator('.brand'),mark=page.locator('.mark');
     const brandBox=await brand.boundingBox();
     await page.mouse.move(brandBox.x+brandBox.width*.2,brandBox.y+brandBox.height*.25);await delay(250);
     const logoA=await mark.evaluate(e=>getComputedStyle(e).transform);
     await page.mouse.move(brandBox.x+brandBox.width*.8,brandBox.y+brandBox.height*.75);await delay(250);
     const logoB=await mark.evaluate(e=>getComputedStyle(e).transform);
     assert(logoA.startsWith('matrix3d')&&logoB.startsWith('matrix3d')&&logoA!==logoB,'Logo must tilt with cursor in 3D');
     await delay(450);
     assert.equal(await mark.evaluate(e=>getComputedStyle(e).transform),logoB,'Logo must not spin while pointer is stationary');
     assert.equal(await mark.evaluate(e=>getComputedStyle(e).animationName),'none','No continuous logo animation');
     await page.mouse.move(0,0);await delay(250);
     assert.equal(await mark.evaluate(e=>getComputedStyle(e).transform),'none','Logo must return to rest');
     const card=page.locator('.game').first();await card.scrollIntoViewIfNeeded();
     const b=await card.boundingBox();await page.mouse.move(b.x+b.width*.25,b.y+b.height*.4);await delay(250);
     const a=await card.evaluate(e=>getComputedStyle(e).transform);
     const b2=await card.boundingBox();await page.mouse.move(b2.x+b2.width*.75,b2.y+b2.height*.6);await delay(250);
     const c=await card.evaluate(e=>getComputedStyle(e).transform);assert(a!=='none'&&c!=='none'&&a!==c,'Card tilt did not follow pointer');
     await page.locator('.play').first().hover();await sampled(page,'.play','backgroundColor',null,1300);
     await page.mouse.move(0,0);
   }
   await page.locator('#search').fill('no-result-xyz');assert.equal(await page.locator('.game:visible').count(),0);
   await page.locator('#search').fill('');assert.equal(await page.locator('.game:visible').count(),n);
   await page.locator('[data-filter="Arcade"]').click();assert.equal(await page.locator('.game:visible:not([data-category="Arcade"])').count(),0);
   await page.locator('[data-filter="All"]').click();assert.equal(await page.locator('.game:visible').count(),n);
   await page.emulateMedia({reducedMotion:'reduce'});await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.locator('body').getAttribute('data-motion'),'on','Default must remain on under reduced motion');
   assert(!(await page.locator('#crt-replay').isDisabled()));
   await page.locator('#motion-mode').selectOption('auto');
   assert(await page.locator('#crt-replay').isDisabled());assert.equal(await page.locator('.intro h1').evaluate(e=>getComputedStyle(e,'::after').animationName),'none');
   assert.equal(await page.locator('.eg-crt').evaluate(e=>getComputedStyle(e).display),'none');
   assert.equal(await page.locator('body').getAttribute('data-motion'),'off');
   await page.locator('#motion-mode').selectOption('on');
   assert.equal(await page.locator('body').getAttribute('data-motion'),'on');
   await sampled(page,'.intro h1','opacity','::after',1400);
   await page.locator('#motion-mode').selectOption('off');
   assert.equal(await page.locator('body').getAttribute('data-motion'),'off');
   await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.locator('#motion-mode').inputValue(),'off','Explicit Off must persist');
   assert.equal(await page.locator('body').getAttribute('data-motion'),'off');
   await page.locator('#motion-mode').selectOption('auto');
   assert.equal(await page.locator('body').getAttribute('data-motion'),'off');
   await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.locator('#motion-mode').inputValue(),'auto','Explicit Auto must persist');
   assert.equal(await page.locator('body').getAttribute('data-motion'),'off');
   assert.equal(errors.length,0,errors.join('\n'));console.log('PASS actual motion and layout',name,width,height);await page.close();
 }
 }finally{await browser.close();}
}
