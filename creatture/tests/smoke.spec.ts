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
