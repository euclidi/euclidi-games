import {test,expect} from '@playwright/test';
const base=process.env.CREATTURE_URL||'http://127.0.0.1:8765/euclidi-games/';
test('catalog launch, deployed build and complete puzzle',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/creatture/')&&!r.url().includes('favicon'))errors.push(r.status()+' '+r.url());});
 await page.goto(base);const link=page.locator('article[data-name="creatture"] a.play');await expect(link).toBeVisible();await link.click();await expect(page.locator('#name')).toContainText('Primordium',{timeout:60000});
 const build=await page.request.get(new URL('BUILD.json',page.url()).href);expect(build.ok()).toBeTruthy();expect((await build.json()).source_commit).toBe('879c19fdf1e1983aff017403b65d729a24bca6b6');
 for(const n of ['Membrane','Nutrients','Water','Light','Minerals','Muscle','Nerves','Microbes','Spores','Heat','Catalyst','Resonance'])await page.getByRole('button',{name:n,exact:true}).click();
 await expect(page.locator('#turn')).toContainText('12 / 12');await page.locator('#settings').click();await page.locator('#verify-replay').click();await expect(page.locator('#log')).toHaveText('Deterministic replay matched.');expect(errors).toEqual([]);
});
