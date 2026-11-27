import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
const base=process.env.VOIDRUNNER_URL||'http://127.0.0.1:8765/voidrunner/';
await mkdir('artifacts/voidrunner',{recursive:true});
for(const gpu of [false,true]){
 const browser=await chromium.launch({args:gpu?['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:['--disable-webgl']});
 try{for(const viewport of [{width:1280,height:800},{width:390,height:740}]){
 const p=await browser.newPage({viewport}),errors=[],fail=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/voidrunner/'))fail.push(r.url())});
 assert((await p.goto(base)).ok());
 const state=()=>p.evaluate(()=>document.querySelector('#vr21').inspect());
 await p.waitForFunction(()=>{const q=document.querySelector('#vr21')?.inspect?.();return q?.atlasSource==='licensed-earth'&&q.sourcedCloud},null,{timeout:30000});
 assert.equal((await state()).version,'0.25.0-asset');assert.deepEqual((await state()).atlasSize,[2048,1024]);if(gpu)assert.equal((await state()).render,'WebGL','Requested GPU failed; do not certify GPU');
 const capture=async id=>{await p.waitForTimeout(450);const buf=await p.locator('#vr21scene').screenshot({path:'artifacts/voidrunner/'+id+'-'+viewport.width+'-'+gpu+'.png'});if(!id.endsWith('-surface')){const filled=await p.evaluate(async data=>{const im=new Image();im.src='data:image/png;base64,'+data;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const px=g.getImageData(0,0,c.width,c.height).data;const occupancy=(a,b)=>{let hits=0,total=0;for(let y=Math.floor(c.height*.38);y<Math.floor(c.height*.62);y++)for(let x=Math.floor(c.width*a);x<Math.floor(c.width*b);x++){let k=(y*c.width+x)*4;total++;if(Math.max(px[k],px[k+1],px[k+2])>45)hits++}return hits/total};return [occupancy(.30,.46),occupancy(.54,.70)]},buf.toString('base64'));assert(filled.every(v=>v>.7),id+' incomplete planetary disk '+JSON.stringify(filled));console.log('DISK COVERAGE',id,viewport.width,gpu,filled.map(v=>v.toFixed(3)).join(' '))}};
 await capture('earth');
 await p.click('#vr21surface');await p.waitForTimeout(200);assert((await state()).onGround);
 await p.click('#vr21dive');await p.waitForTimeout(300);assert((await state()).alt<0);
 await p.click('#vr21character');
 const choose=async id=>{await p.selectOption('#vr25body',id);await p.waitForFunction(id=>{const q=document.querySelector('#vr21').inspect();return q.world===id&&!q.worldBusy&&q.atlasSource==='licensed-'+id},id,{timeout:30000})};
 for(const [id,r,g] of [['moon',1737.4,.00162],['mars',3389.5,.00371],['jupiter',69911,.02479]]){
 await choose(id);let q=await state();assert.equal(q.radius,r);assert.equal(q.gravity,g);assert(q.alt>0);await capture(id);
 assert(await p.locator('#vr21dive').isDisabled());assert(await p.locator('#vr21cloud').isDisabled());
 if(id==='jupiter'){assert(await p.locator('#vr21surface').isDisabled());assert(!q.onGround)}
 else{await p.click('#vr21surface');await p.waitForTimeout(300);assert((await state()).onGround);await capture(id+'-surface');if(id==='moon')assert(await p.locator('#vr21entry').isDisabled())}
 }
 await choose('earth');assert((await state()).alt<0,'Earth session not restored');assert(!(await p.locator('#vr21dive').isDisabled()));
 assert.deepEqual(errors,[]);assert.deepEqual(fail,[]);await p.close();
 }}finally{await browser.close()}
}
