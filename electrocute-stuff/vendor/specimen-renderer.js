import * as THREE from './three/three.module.min.js';
import { GLTFLoader } from './three/loaders/GLTFLoader.js';
import models from './can-models.js';
/* Render authored models to an alpha sprite; never run a second animation loop. */
let renderer,scene,camera,root=null; const sprites=new Map();
function initialize(){
  if(renderer)return;
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(384,384,false);renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,20);
  scene.add(new THREE.HemisphereLight(0xddeaff,0x7b7b6d,2.0));
  const key=new THREE.DirectionalLight(0xffefda,3);key.position.set(-2,4,4);scene.add(key);
  const fill=new THREE.DirectionalLight(0xc7e7ff,1.7);fill.position.set(3,1,-2);scene.add(fill);
}
async function raster(name){
  const binary=Uint8Array.from(atob(models[name]),c=>c.charCodeAt(0));
  const gltf=await new GLTFLoader().parseAsync(binary.buffer,'');
  root=gltf.scene;scene.add(root);
  const box=new THREE.Box3().setFromObject(root),center=box.getCenter(new THREE.Vector3());
  root.position.sub(center);root.updateMatrixWorld(true);
  const dims=box.getSize(new THREE.Vector3()),size=Math.max(dims.x,dims.y,dims.z);
  camera.position.set(size*.30,size*.25,size*3.4);camera.lookAt(0,0,0);
  const half=size*.68;camera.left=-half;camera.right=half;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
  renderer.render(scene,camera);
  const frame=document.createElement('canvas');frame.width=384;frame.height=384;
  const c=frame.getContext('2d',{willReadFrequently:true});c.drawImage(renderer.domElement,0,0);
  const data=c.getImageData(0,0,384,384).data;let l=384,t=384,r=-1,b=-1;
  for(let y=0;y<384;y++)for(let x=0;x<384;x++)if(data[(y*384+x)*4+3]>12){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
  scene.remove(root);root.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}}});root=null;
  if(r<l||b<t)throw new Error('Empty model raster');
  const cropped=document.createElement('canvas');cropped.width=r-l+1;cropped.height=b-t+1;cropped.getContext('2d').drawImage(frame,l,t,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
  sprites.set(name,cropped);
}
let loading;
export function loadCanSprites(){if(!loading)loading=(async()=>{initialize();try{await raster('soda-can');await raster('soda-can-crushed');return sprites;}finally{renderer?.dispose();renderer=null;}})();return loading;}
