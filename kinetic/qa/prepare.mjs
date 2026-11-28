import {readdir, mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../node_modules/@babylonjs/havok/',import.meta.url));
async function find(dir){for(const ent of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory()){const match=await find(p);if(match)return match}else if(ent.name==='HavokPhysics.wasm')return p;}}
const wasm=await find(root);if(!wasm)throw Error('Havok WASM missing');
const target=fileURLToPath(new URL('./generated/',import.meta.url));await mkdir(target,{recursive:true});await copyFile(wasm,path.join(target,'HavokPhysics.wasm'));
console.log('Copied pinned Havok WASM for local QA');