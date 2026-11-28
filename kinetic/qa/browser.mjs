import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const output=new URL('./results/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
try{
for(const viewport of [{width:1280,height:720},{width:412,height:915}]){
const page=await browser.newPage({viewport});const errors=[],requests=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)requests.push(r.status()+' '+r.url())});
try{await page.goto('http://127.0.0.1:8765/kinetic/qa/runtime.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>['ready','failed'].includes(window.kineticQA?.phase),{},{timeout:120000});}finally{
const result=await page.evaluate(()=>window.kineticQA||null).catch(()=>null);
await writeFile(new URL('report-'+viewport.width+'.json',output),JSON.stringify({result,errors,requests},null,2));
await page.screenshot({path:new URL('capture-'+viewport.width+'.png',output).pathname}).catch(()=>{});
if(!result||result.phase!=='ready'||!result.physics||result.assets.length!==4||errors.length||requests.length)throw Error(JSON.stringify({result,errors,requests}));}
await page.close();
}
}finally{await browser.close();}
