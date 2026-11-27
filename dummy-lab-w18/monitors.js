import * as T from 'three';
// Security cameras see the actual scene, excluding the monitor surfaces (layer 1).
// This prevents recursive sampling of a render target while it is being written.
export function createLiveMonitors(renderer,scene,monitors,dummy){
 const poses=[{p:[-3.9,2.85,2.65],look:[0,1.0,-2.1],fov:72},{p:[4.0,2.85,-6.9],look:[-.6,1.05,-1.4],fov:74},{p:[3.9,2.75,2.5],look:[0,1,-1],fov:62,track:true}];
 const feeds=monitors.map(({screen,title},i)=>{
  const pose=poses[i%poses.length],camera=new T.PerspectiveCamera(pose.fov,4/3,.08,40);
  camera.position.fromArray(pose.p);camera.lookAt(new T.Vector3(...pose.look));
  const target=new T.WebGLRenderTarget(640,480,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true,stencilBuffer:false});
  target.texture.generateMipmaps=false;
  screen.material.map=target.texture;screen.material.needsUpdate=true;
  return {camera,target,pose,title,frames:0};
 });
 let next=0,last=-Infinity;
 const aim=new T.Vector3();
 function update(now,mobile){
  if(!feeds.length||now-last<(mobile?60:30))return;
  last=now;const f=feeds[next];next=(next+1)%feeds.length;
  if(f.pose.track){aim.copy(dummy.r.root.position);aim.y=1.0;f.camera.lookAt(aim);}
  const saved=renderer.getRenderTarget(),auto=renderer.shadowMap.autoUpdate;
  try{renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(f.target);renderer.render(scene,f.camera);f.frames++;}
  finally{renderer.setRenderTarget(saved);renderer.shadowMap.autoUpdate=auto;}
 }
 function snapshot(pixels=false){
  return feeds.map(f=>{
   const state={title:f.title,frames:f.frames,width:f.target.width,height:f.target.height,position:f.camera.position.toArray()};
   if(pixels&&f.frames){
    const buf=new Uint8Array(f.target.width*f.target.height*4);renderer.readRenderTargetPixels(f.target,0,0,f.target.width,f.target.height,buf);
    let min=255,max=0,hash=2166136261;for(let i=0;i<buf.length;i+=16){const v=buf[i];min=Math.min(min,v);max=Math.max(max,v);hash=Math.imul(hash^v,16777619)>>>0;}
    Object.assign(state,{range:max-min,hash});
   }
   return state;
  });
 }
 return {update,snapshot};
}
