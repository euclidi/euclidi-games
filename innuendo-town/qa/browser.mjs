import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/innuendo-town/');
 await page.locator('#boot').waitFor({state:'hidden',timeout:30000});
 assert.equal(await page.locator('#canvas canvas').count(),1);
 await page.screenshot({path:'town-desktop.png'});
 await page.locator('#canvas canvas').screenshot({path:'town-cover.png'});
 await page.keyboard.down('d');await page.waitForTimeout(450);await page.keyboard.up('d');
 await page.locator('[data-tab=contacts]').click();
 assert.equal(await page.locator('#panel .entry').count(),16);
 await page.locator('[data-tab=directory]').click();
 assert.equal(await page.locator('#panel .entry').count(),8);
 await page.locator('#panel .entry').first().getByRole('button',{name:'Go'}).click();
 await page.waitForFunction(()=>document.querySelector('#district').textContent==='THE MEAT MARKET',{},{timeout:30000});
 await page.screenshot({path:'town-interior.png'});
 await page.keyboard.down('w');await page.waitForTimeout(2200);await page.keyboard.up('w');await page.keyboard.press('e');
 assert.equal(await page.locator('#dialogue').isVisible(),true);
 await page.getByRole('button',{name:'Start shift'}).click();
 for(let i=0;i<3;i++){let order=(await page.locator('#dialogue p').nth(1).innerText()).replace('Requested: ','');await page.getByRole('button',{name:'Sort '+order,exact:true}).click()}
 assert.match(await page.locator('#dialogue').innerText(),/SHIFT COMPLETE/);
 assert.equal(await page.locator('#cash').innerText(),'$68');
 await page.reload();await page.locator('#boot').waitFor({state:'hidden',timeout:30000});
 assert.equal(await page.locator('#cash').innerText(),'$68');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.goto('http://127.0.0.1:8080/innuendo-town/');await mobile.locator('#boot').waitFor({state:'hidden',timeout:30000});await mobile.screenshot({path:'town-mobile.png'});
 assert.deepEqual(errors,[]);console.log('Browser smoke checks passed');
}finally{await browser.close()}
