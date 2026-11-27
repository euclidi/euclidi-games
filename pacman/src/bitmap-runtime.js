// Local 224x288 bitmap compositor; no CDN, WebGL or build dependency.
export class Scene {}
export const Scale={NONE:0};
export const CANVAS=0;
function canvas(w,h){let c=document.createElement('canvas');c.width=w;c.height=h;let g=c.getContext('2d',{alpha:true});if(!g)throw Error('Canvas 2D unavailable');g.imageSmoothingEnabled=false;return [c,g]}
export function reportError(error){const el=document.getElementById('boot');if(el){el.hidden=false;el.textContent='GAME ERROR: '+String(error?.message||error)+' — reload or report this message.'}console.error(error)}
export class Game{
 constructor(config){
  try{
   let [surface,ctx]=canvas(config.width,config.height),root=document.getElementById(config.parent);surface.setAttribute('aria-label','PAC-MAN game screen');root.appendChild(surface);
   let scene=new config.scene(),textures=new Map(),objects=[],handlers=new Map(),counter=0;
   scene.textures={createCanvas(name,w,h){let [c,g]=canvas(w,h),t={context:g,refresh(){},getSourceImage(){return c}};textures.set(name,t);return t},get(name){let t=textures.get(name);if(!t)throw Error('Missing texture '+name);return t}};
   scene.add={image(x,y,key){let o={x,y,key,depth:0,visible:true,order:counter++,setDepth(v){this.depth=v;return this},setPosition(x,y){this.x=x;this.y=y;return this},setTexture(k){this.key=k;return this},setVisible(v){this.visible=!!v;return this},destroy(){let i=objects.indexOf(this);if(i>=0)objects.splice(i,1)}};objects.push(o);return o}};
   const on=(type,fn)=>{let list=handlers.get(type)||[];list.push(fn);handlers.set(type,list)},emit=(type,e)=>{for(let fn of handlers.get(type)||[])fn(e)};
   scene.input={on,keyboard:{on(type,fn){window.addEventListener(type,fn)}}};
   let active=null;
   function point(e){let r=surface.getBoundingClientRect();return{x:(e.clientX-r.left)*config.width/Math.max(1,r.width),y:(e.clientY-r.top)*config.height/Math.max(1,r.height),isDown:active===e.pointerId}}
   surface.addEventListener('pointerdown',e=>{active=e.pointerId;surface.setPointerCapture?.(active);emit('pointerdown',point(e))});
   surface.addEventListener('pointermove',e=>emit('pointermove',point(e)));
   for(let name of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(name,e=>{if(active===e.pointerId)active=null});
   scene.create();config.callbacks?.postBoot?.(this);
   function paint(){ctx.fillStyle='#000';ctx.fillRect(0,0,surface.width,surface.height);for(let o of [...objects].sort((a,b)=>a.depth-b.depth||a.order-b.order)){if(!o.visible)continue;let image=scene.textures.get(o.key).getSourceImage();ctx.drawImage(image,Math.round(o.x-image.width/2),Math.round(o.y-image.height/2))}}
   scene.update(0,0);paint();document.getElementById('boot')?.setAttribute('hidden','');document.documentElement.dataset.gameReady='true';
   let last=performance.now();function frame(now){try{scene.update(now,Math.min(100,Math.max(0,now-last)));last=now;paint();requestAnimationFrame(frame)}catch(e){reportError(e)}}requestAnimationFrame(frame);
  }catch(e){reportError(e)}
 }
}
