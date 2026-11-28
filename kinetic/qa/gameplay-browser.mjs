import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=new URL('./results/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
try{
for(const viewport of [{width:1280,height:720},{width:412,height:915}]){
 const mobile=viewport.width<700,page=await browser.newPage({viewport,hasTouch:mobile});const errors=[],requests=[],checks=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)requests.push(r.status()+' '+r.url())});
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name)};
 try{
 await page.goto('http://127.0.0.1:8765/kinetic/qa/courtyard.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>['ready','failed'].includes(window.kineticPlay?.phase),{},{timeout:120000});
 check('scene initializes',(await page.evaluate(()=>window.kineticPlay.phase))==='ready');await page.locator('#begin').click();
 await page.waitForFunction(()=>window.kineticPlay.phase==='playing');
 check('starting bow and ammo',await page.evaluate(()=>window.kineticPlay.selected==='shortbow'&&window.kineticPlay.ammo===8));
 if(mobile){const b=await page.locator('#fire').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForTimeout(1250);await page.mouse.up()}else{await page.keyboard.down('Space');await page.waitForTimeout(1250);await page.keyboard.up('Space')}
 await page.waitForFunction(()=>window.kineticPlay.lastImpact!=null,{},{timeout:15000});
 check('manual release consumes ammunition',await page.evaluate(()=>window.kineticPlay.ammo===7&&window.kineticPlay.shots===1));
 check('physical target hit awards XP',await page.evaluate(()=>window.kineticPlay.hit===1&&window.kineticPlay.xp>0));
 await page.locator('#save').click();await page.waitForFunction(()=>document.querySelector('#notice').textContent==='Character saved');
 await page.locator('#load').click();await page.waitForFunction(()=>document.querySelector('#notice').textContent==='Character loaded');
 check('character XP survives reload',await page.evaluate(()=>window.kineticPlay.xp>0&&window.kineticPlay.ammo===7));
 const start=await page.evaluate(()=>window.kineticPlay.position[2]);
 if(mobile){const b=await page.locator('[data-key=w]').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForTimeout(500);await page.mouse.up()}else{await page.keyboard.down('w');await page.waitForTimeout(500);await page.keyboard.up('w')}
 check('movement changes player location',await page.evaluate(z=>window.kineticPlay.position[2]>z+.1,start));
 await page.locator('#perspective').click();check('camera toggle',await page.evaluate(()=>window.kineticPlay.camera==='third'));
 await page.screenshot({path:new URL('courtyard-third-'+viewport.width+'.png',out).pathname});
 await page.locator('#perspective').click();await page.locator('#stone').click();check('stone acquisition',await page.evaluate(()=>window.kineticPlay.selected==='stone'));
 check('no runtime errors',errors.length===0&&requests.length===0);
 }finally{const state=await page.evaluate(()=>window.kineticPlay||null).catch(()=>null);await writeFile(new URL('gameplay-'+viewport.width+'.json',out),JSON.stringify({state,checks,errors,requests},null,2));await page.screenshot({path:new URL('courtyard-'+viewport.width+'.png',out).pathname}).catch(()=>{});await page.close()}
}
}finally{await browser.close()}
