// Node 22+; run from repository root: node exohostile/tools/prepare-assets.mjs
import {mkdir,writeFile,readFile,rm,rename,stat} from 'node:fs/promises';
import {join,resolve,dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('exohostile/assets'), temp=root+'.staging';
const textures={'metal_plate':['diff','nor_gl','rough','metal'],'metal_plate_02':['diff','nor_gl','rough','metal'],'blue_metal_plate':['diff','nor_gl','rough']};
const models=['worn_metal_rack','plastic_crate_02','classic_laptop','metal_toolbox','metal_tool_chest','utility_box_01'];
const hdri='small_workshop', ledger=[], budget=90*1024*1024;
let total=0;
const agent='EuclidiGames-EXOHOSTILE/0.3 (+https://github.com/euclidi/euclidi-games)';
const safeURL=url=>{const u=new URL(url);if(u.protocol!=='https:'||!['api.polyhaven.com','dl.polyhaven.org','cdn.polyhaven.com'].includes(u.hostname))throw Error('Unexpected asset host '+u.hostname);return u.href};
async function request(url){let error;for(let i=0;i<3;i++){try{const r=await fetch(safeURL(url),{headers:{'User-Agent':agent},signal:AbortSignal.timeout(90000),redirect:'error'});if(!r.ok)throw Error('HTTP '+r.status+' '+url);return r}catch(e){error=e;if(i<2)await new Promise(r=>setTimeout(r,1500*(i+1)))}}throw error}
function destination(id,path){const base=resolve(temp,id),target=resolve(base,path);if(target===base||!target.startsWith(base+'/'))throw Error('Unsafe asset path '+path);return target}
async function download(id,path,rec){if(!rec?.url||!Number.isSafeInteger(rec.size)||rec.size<=0||!/^[0-9a-f]{32}$/i.test(rec.md5||''))throw Error('Incomplete provider file record: '+id+'/'+path);if(total+rec.size>budget)throw Error('Asset pack exceeds 90 MiB budget');const target=destination(id,path),b=Buffer.from(await (await request(rec.url)).arrayBuffer());if(b.length!==rec.size||createHash('md5').update(b).digest('hex')!==rec.md5.toLowerCase())throw Error('Size/hash mismatch '+id+'/'+path);await mkdir(dirname(target),{recursive:true});await writeFile(target,b);total+=b.length;ledger.push({path:relative(temp,target),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),source:rec.url,license:'CC0-1.0',asset:'https://polyhaven.com/a/'+id});return b}
async function metadata(id){return (await request('https://api.polyhaven.com/files/'+id)).json()}
await rm(temp,{recursive:true,force:true});await mkdir(temp,{recursive:true});
try{
for(const [id,channels] of Object.entries(textures)){
 const f=await metadata(id);
 for(const ch of channels){const options=f[ch]?.['1k'];const rec=options?.jpg||options?.png;if(!rec)throw Error('Required channel missing '+id+'/'+ch);const ext=options.jpg?'jpg':'png';const b=await download(id,id+'_'+ch+'_1k.'+ext,rec);if(ext==='jpg'?(b[0]!==255||b[1]!==216):b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Invalid image '+id+'/'+ch)}
}
for(const id of models){
 const f=await metadata(id),rec=f.gltf?.['1k']?.gltf;if(!rec)throw Error('Missing glTF '+id);
 const b=await download(id,id+'_1k.gltf',rec),g=JSON.parse(b.toString('utf8'));
 if(g.asset?.version!=='2.0'||!g.meshes?.length)throw Error('Invalid glTF '+id);
 const dependencies=new Set([...g.buffers||[],...g.images||[]].map(x=>x.uri).filter(x=>x&&!x.startsWith('data:')));
 for(const uri of dependencies){if(/^[a-z]+:|^\/|[?#]/i.test(uri))throw Error('Non-local glTF dependency '+uri);const path=decodeURIComponent(uri),dep=rec.include?.[uri]||rec.include?.[path];if(!dep)throw Error('Unlisted glTF dependency '+id+'/'+uri);await download(id,path,dep)}
}
const hdr=(await metadata(hdri)).hdri?.['1k']?.hdr;
const b=await download(hdri,hdri+'_1k.hdr',hdr);
if(!b.subarray(0,64).toString().match(/^#\?(RADIANCE|RGBE)/))throw Error('Invalid HDRI');
const manifest={version:1,source:'Poly Haven',license:'CC0-1.0',totalBytes:total,files:ledger};
await writeFile(join(temp,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(join(temp,'LICENSE.txt'),'Artwork sourced from Poly Haven under CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/ . Individual source URLs and checksums are in manifest.json.\n');
// Publish only after ALL required assets and dependencies pass integrity checks.
await mkdir(root,{recursive:true});
for(const id of [...Object.keys(textures),...models,hdri]){await rm(join(root,id),{recursive:true,force:true});await rename(join(temp,id),join(root,id))}
for(const file of ['manifest.json','LICENSE.txt'])await rename(join(temp,file),join(root,file));
console.log('Validated '+ledger.length+' files / '+total+' bytes');
}finally{await rm(temp,{recursive:true,force:true})}
