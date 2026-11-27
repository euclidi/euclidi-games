import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
const page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[],failed=[],provider=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('requestfailed',r=>{if(r.url().includes('/assets/'))failed.push(r.url()+' '+r.failure()?.errorText)});
page.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)failed.push(r.status()+' '+r.url())});
page.on('request',r=>{if(/polyhaven\.(org|com)/.test(new URL(r.url()).hostname))provider.push(r.url())});
await page.goto('http://127.0.0.1:8765/exohostile/',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>document.getElementById('boot')?.textContent.includes('SYSTEMS READY'),{},{timeout:120000});
await page.waitForFunction(()=>window.exoAssetState?.().pending.length===0,{},{timeout:120000});
const state=await page.evaluate(()=>window.exoAssetState());
if(!state.pack||state.loaded.length!==10||state.failed.length||state.partial.length||failed.length||provider.length)throw Error(JSON.stringify({state,failed,provider}));
await page.locator('[data-mode=sandbox]').click();
await page.waitForSelector('#hud.show');
await page.keyboard.down('KeyW');await page.waitForTimeout(750);await page.keyboard.up('KeyW');
await page.keyboard.press('Digit2');await page.waitForTimeout(250);
if(!(await page.locator('#weapon').textContent()).includes('ARC'))throw Error('Weapon selection failed');
await page.keyboard.press('Tab');await page.waitForSelector('#panel.show');
await page.locator('[data-op=boards]').click();await page.locator('#panel [data-op=close]').click();
await page.waitForTimeout(400);
await page.screenshot({path:'exohostile-smoke.png'});
if(errors.length)throw Error(JSON.stringify(errors));
console.log('Browser startup, all ten assets, sandbox, movement input, weapon selection and terminal smoke test passed',state);
}finally{await browser.close()}
