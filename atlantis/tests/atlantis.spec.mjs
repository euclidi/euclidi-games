// Release acceptance smoke test. Run with @playwright/test and a real HTTP server.
import {test,expect} from '@playwright/test';
const base=process.env.ATLANTIS_CATALOG_URL||'http://127.0.0.1:8765/euclidi-games/';
const url=new URL('atlantis/',base).href;
async function boot(page){
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const response=await page.goto(url);
 expect(response?.ok()).toBeTruthy();
 const root=page.locator('#atl2');
 await expect(root).toBeVisible();
 await expect(root.locator('canvas')).toBeVisible({timeout:60000});
 // Release must expose cumulative diagnostics; a canvas alone is not proof of rendering.
 await expect.poll(()=>root.evaluate(e=>e.atlantisDiagnostics?.()?.renderedFrames||0),{timeout:60000}).toBeGreaterThan(2);
 await expect(root.locator('#al2-load')).toHaveCount(0);
 return {root,errors};
}
test('desktop startup, mode transition, motion settings and catalog return',async({page})=>{
 const {root,errors}=await boot(page);
 const diag=()=>root.evaluate(e=>e.atlantisDiagnostics());
 expect((await diag()).mode).toBe('observe');
 await root.locator('#al2-swim').click();
 expect((await diag()).mode).toBe('swim');
 await page.keyboard.down('KeyW');await page.waitForTimeout(500);await page.keyboard.up('KeyW');
 await root.locator('#al2-observe').click();
 expect((await diag()).mode).toBe('observe');
 await root.locator('#al2-settingsButton').click();
 await expect(root.locator('#al2-panel')).toBeVisible();
 await root.locator('#al2-optics').selectOption('off');
 expect((await diag()).opticsMode).toBe('off');
 await root.locator('#al2-optics').selectOption('auto');
 const back=page.locator('a[data-catalog-return][aria-label="Back to game catalog"]');
 await expect(back).toBeVisible();
 expect(await back.evaluate(e=>e.href)).toBe(base);
 expect(errors).toEqual([]);
});
test.describe('touch viewport',()=>{
 test.use({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 test('scene fits and swimming controls appear',async({page})=>{
  const {root,errors}=await boot(page);
  await root.locator('#al2-swim').tap();
  await expect(root.locator('#al2-stick')).toBeVisible();
  await expect(root.locator('#al2-rise')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
 });
});
test('public catalog release route (only after publication)',async({page})=>{
 test.skip(process.env.ATLANTIS_PUBLIC_RELEASE!=='1','Migration not published');
 await page.goto(base);
 const play=page.locator('article[data-name="atlantis"] a.play');
 await expect(play).toBeVisible();
 await play.click();
 await expect.poll(()=>page.locator('#atl2').evaluate(e=>e.atlantisDiagnostics?.()?.renderedFrames||0),{timeout:60000}).toBeGreaterThan(2);
 expect(page.url()).toBe(url);
});
