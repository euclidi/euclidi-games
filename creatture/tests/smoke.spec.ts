import {test,expect} from '@playwright/test';
for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
 test('puzzle and archive '+viewport.width,async({page})=>{
  await page.setViewportSize(viewport);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('#name')).toContainText('Primordium');
  await page.getByRole('button',{name:'Membrane',exact:true}).click();await expect(page.locator('#turn')).toHaveText('01 / 12');
  await expect(page.getByRole('button',{name:'Membrane',exact:true})).toBeDisabled();
  await page.locator('#inspect').click();await expect(page.locator('#readout')).toContainText('Mass residual');
  await page.locator('#save').click();await expect(page.locator('#log')).toHaveText('Specimen preserved.');
  await page.locator('#mode').selectOption('archive');await expect(page.locator('#samples option')).toHaveCount(1);
  await page.locator('#world').selectOption('1');await page.locator('#transfer').click();await expect(page.locator('#name')).toContainText('Abyss');
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBeTruthy();expect(errors).toEqual([]);
 });
}
test('all six world selectors',async({page})=>{await page.goto('/');await expect(page.locator('#name')).toContainText('Primordium');for(const [i,n] of ['Primordium','Abyss','Mycelium','Silica','Prosthesis','Communion'].entries()){await page.locator('#world').selectOption(String(i));await expect(page.locator('#name')).toContainText(n);}});

test('regional biology inspection and stimulation',async({page})=>{await page.goto('/');await expect(page.locator('#name')).toContainText('Primordium');await page.locator('#mode').selectOption('free');for(const n of ['Membrane','Nutrients','Nerves','Muscle'])await page.getByRole('button',{name:n,exact:true}).click();await page.locator('#inspect').click();await page.locator('#cue').click();await page.locator('#damage').click();await expect(page.locator('#readout')).toContainText('Habituation');await expect(page.locator('#readout')).toContainText('Transport');await page.screenshot({path:'test-results/creatture-inspection.png'});});

test('audio settings, resolution and puzzle replay',async({page})=>{await page.goto('/');await expect(page.locator('#name')).toContainText('Primordium');await page.getByRole('button',{name:'Membrane',exact:true}).click();await page.locator('#settings').click();await page.locator('#verify-replay').click();await expect(page.locator('#log')).toHaveText('Deterministic replay matched.');await page.locator('#quality').selectOption('960');expect(await page.locator('canvas').evaluate(c=>(c as HTMLCanvasElement).width)).toBeLessThanOrEqual(960);await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveText('Sound on');await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveText('Sound off');});

test('all twelve elements produce a completed puzzle',async({page})=>{await page.setViewportSize({width:1280,height:800});await page.goto('/');await expect(page.locator('#name')).toContainText('Primordium');await page.screenshot({path:'test-results/creatture-start.png'});for(const n of ['Membrane','Nutrients','Water','Light','Minerals','Muscle','Nerves','Microbes','Spores','Heat','Catalyst','Resonance']){await page.getByRole('button',{name:n,exact:true}).click();}await expect(page.locator('#turn')).toContainText('12 / 12');await expect(page.locator('#status')).not.toContainText('Undifferentiated');await page.waitForTimeout(1200);await page.screenshot({path:'test-results/creatture-grown.png'});await page.locator('#settings').click();await page.locator('#verify-replay').click();await expect(page.locator('#log')).toHaveText('Deterministic replay matched.');});

test('mature creature remains rendered across inspection and world transitions',async({page})=>{await page.goto('/');await expect(page.locator('#name')).toContainText('Primordium');for(const n of ['Membrane','Nutrients','Water','Light','Minerals','Muscle','Nerves','Microbes','Spores','Heat','Catalyst','Resonance'])await page.getByRole('button',{name:n,exact:true}).click();await page.waitForTimeout(1200);await page.locator('#viewport').screenshot({path:'test-results/creatture-anatomy-preview.png'});await page.locator('#inspect').click();await expect(page.locator('#readout')).toContainText('Developmental nodes');await page.locator('#world').selectOption('2');await expect(page.locator('#name')).toContainText('Mycelium');});
