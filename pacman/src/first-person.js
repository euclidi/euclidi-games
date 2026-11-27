// Local grid-raycast renderer: same maze geometry, per-column depth, bitmap sprite billboards.
export const FP_W=480,FP_H=360;
export const TAU=Math.PI*2,ANGLE=[-Math.PI/2,Math.PI,Math.PI/2,0];
export function relativeDir(facing,input){return (facing+input)%4}
export function wrappedX(x){return ((x%28)+28)%28}
export function tileSolid(rows,x,y){x=wrappedX(x);return y<0||y>=31||rows[y][x]==='#'||(y>=9&&y<=19&&y!==14&&(x<5||x>22))}
export function turnAngle(a,b,dt){let diff=Math.atan2(Math.sin(b-a),Math.cos(b-a));return a+Math.sign(diff)*Math.min(Math.abs(diff),Math.max(0,dt)*.013)}
export function castRay(rows,x,y,dx,dy){
 let tx=Math.floor(x),ty=Math.floor(y),sx=dx<0?-1:1,sy=dy<0?-1:1,ix=dx===0?Infinity:Math.abs(1/dx),iy=dy===0?Infinity:Math.abs(1/dy),ax=dx===0?Infinity:(dx<0?x-tx:tx+1-x)*ix,ay=dy===0?Infinity:(dy<0?y-ty:ty+1-y)*iy;
 for(let i=0;i<80;i++){let side,dist;if(ax<ay){dist=ax;ax+=ix;tx+=sx;side=0}else{dist=ay;ay+=iy;ty+=sy;side=1}if(tileSolid(rows,tx,ty)){let u=side===0?y+dist*dy:x+dist*dx;u-=Math.floor(u);if(side===0&&dx>0||side===1&&dy<0)u=1-u;return {depth:Math.max(.035,dist),u,side,x:wrappedX(tx),y:ty}}}
 return {depth:60,u:0,side:0,x:wrappedX(tx),y:ty}
}
export function projectPoint(camera,x,y,z,height,width=height,w=FP_W,h=FP_H){
 let dx=x-camera.x,dy=y-camera.y,cs=Math.cos(camera.angle),sn=Math.sin(camera.angle),depth=dx*cs+dy*sn;if(depth<=.075)return null;
 let lateral=-dx*sn+dy*cs,focal=w/(2*Math.tan(41*Math.PI/180)),cx=w/2+lateral*focal/depth,top=(camera.horizon??h/2)-(z+height-camera.eye)*focal/depth;
 return {depth,x:cx-width*focal/depth/2,y:top,w:width*focal/depth,h:height*focal/depth}
}
export function visibleColumns(depth,rect,w=depth.length){let spans=[];let lo=Math.max(0,Math.floor(rect.x)),hi=Math.min(w,Math.ceil(rect.x+rect.w));for(let x=lo;x<hi;x++)if(rect.depth<depth[x]-.015)spans.push(x);return spans}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const shade=d=>Math.max(.16,1/(1+d*.12+d*d*.009));
const frac=v=>v-Math.floor(v);
// Shared world-space skid curves. The paired tracks stay on the path already travelled.
export function skidPoints(mark){let a=ANGLE[mark.from],b=ANGLE[mark.to],out=[];for(let side of [-1,1])for(let i=0;i<9;i++){let t=i/8,back=.62*(1-t),turn=mark.to===(mark.from+2)%4?0:.12*t*t;out.push({x:mark.x-Math.cos(a)*back+Math.cos(b)*turn-Math.sin(a)*side*.115,y:mark.y-Math.sin(a)*back+Math.sin(b)*turn+Math.cos(a)*side*.115,t})}return out}
export function rearThreat(run,rows,range=7){let s=run.s;if(s.ghostRole!==null||s.phase!=='play'||s.fright>0)return null;let p=s.player,[px,py]=run.position(p),a=ANGLE[p.d],fx=Math.cos(a),fy=Math.sin(a),best=null;
 for(let g of s.ghosts){if(g.state!=='normal')continue;let [gx,gy]=run.position(g),dx=gx-px,dy=gy-py;if(Math.abs(py-14)<.55&&Math.abs(gy-14)<.55)dx=((dx+42)%28)-14;let dist=Math.hypot(dx,dy);if(dist<.1||dist>range||(dx*fx+dy*fy)>-dist*.65)continue;
  let heading=ANGLE[g.d],toward=-(Math.cos(heading)*dx+Math.sin(heading)*dy)/dist;if(toward<.45)continue;
  if(castRay(rows,wrappedX(px+.5),py+.5,dx/dist,dy/dist).depth<dist-.12)continue;
  if(!best||dist<best.distance)best={id:g.id,distance:dist}
 }return best}
export function mapActors(run,customColor){const s=run.s;let colors=['#ff3333','#ffb8ff','#24e6ff','#ffb851'];return [{actor:s.player,color:'#ffff00',controlled:s.ghostRole===null},...s.ghosts.map(g=>({actor:g,color:g.state==='fright'?'#526bff':g.state==='eyes'?'#f4f4ff':s.ghostRole===g.id&&customColor?customColor:colors[g.id],controlled:s.ghostRole===g.id}))]}
const WALL=Array.from({length:64*64},(_,i)=>{let x=i%64,y=i>>6,edge=Math.min(x,63-x),band=y>=6&&y<=10||y>=53&&y<=57,grain=((x*17+y*11)^(x*y))&7;
 if(edge===0||y===0||y===63)return [5,7,18];if(edge===1||y===1||y===62)return [43,55,113];if(band)return y===6||y===53?[101,142,255]:y===10||y===57?[22,42,125]:[37,79,236];
 let inset=x>=5&&x<=58&&y>=14&&y<=49;let r=inset?15:24,g=inset?22:32,b=inset?49:77;
 if(y===14||x===5){r+=14;g+=17;b+=25}if(y===49||x===58){r-=7;g-=8;b-=15}
 if(inset&&y%8===0){r-=3;g-=3;b-=6}return [r+grain*.35,g+grain*.5,b+grain]});
export function createFirstPerson(canvas,rows){
 const ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;
 const main={w:FP_W,h:FP_H,frame:ctx.createImageData(FP_W,FP_H),depth:new Float32Array(FP_W)};
 const mirror={w:176,h:82,frame:ctx.createImageData(176,82),depth:new Float32Array(176)};
 let angle=null,lastActor=null,lastPhase=null,lastTurn=-1,kick=0,hold=0;
 const wallHeight=1.65,eye=.73;
 function reset(){angle=null;lastActor=null;lastPhase=null;lastTurn=-1;kick=hold=0}
 function render(run,view,camera,pass,ox=0,oy=0,reverse=false){
  const {w:W,h:H,frame,depth}=pass,s=run.s,cs=Math.cos(camera.angle),sn=Math.sin(camera.angle),plane=Math.tan(41*Math.PI/180),focal=W/(2*plane),pixels=frame.data,horizon=camera.horizon??H/2;
  for(let y=0;y<H;y++){let down=y+.5>=horizon,dist=(down?camera.eye:wallHeight-camera.eye)*focal/Math.max(.5,Math.abs(y+.5-horizon)),lx=camera.x+dist*(cs+sn*plane),ly=camera.y+dist*(sn-cs*plane),sx=-2*dist*sn*plane/W,sy=2*dist*cs*plane/W,l=shade(dist),base=down?42:25;
   for(let x=0;x<W;x++){let u=frac(lx),v=frac(ly),joint=u<.028||v<.028||u>.972||v>.972,bevel=u<.05||v<.05,checker=(Math.floor(lx)+Math.floor(ly))&1,detail=joint?.34:bevel?1.27:1,center=1-.16*Math.abs(2*x/W-1),light=(base+checker*8)*l*detail*center,k=(y*W+x)*4;pixels[k]=light*.65;pixels[k+1]=light*.81;pixels[k+2]=light*(down?1.17:1.52);pixels[k+3]=255;lx+=sx;ly+=sy}
  }
  for(let x=0;x<W;x++){let lateral=(2*(x+.5)/W-1)*plane,hit=castRay(rows,camera.x,camera.y,cs-sn*lateral,sn+cs*lateral),d=hit.depth;depth[x]=d;let top=horizon-(wallHeight-camera.eye)*focal/d,bottom=horizon+camera.eye*focal/d,span=bottom-top,tx=clamp(Math.floor(hit.u*64),0,63),light=shade(d)*(hit.side===1?.68:1);
   for(let y=Math.max(0,Math.floor(top));y<Math.min(H,Math.ceil(bottom));y++){let ty=clamp(Math.floor((y+.5-top)/span*64),0,63),rgb=WALL[ty*64+tx],ao=.70+.30*Math.min(1,Math.min(ty,63-ty)/10),k=(y*W+x)*4,l=light*ao;pixels[k]=rgb[0]*l;pixels[k+1]=rgb[1]*l;pixels[k+2]=rgb[2]*l}
  }
  if(reverse){for(let y=0;y<H;y++)for(let x=0;x<W/2;x++){let i=(y*W+x)*4,j=(y*W+W-1-x)*4;for(let k=0;k<3;k++){let v=pixels[i+k];pixels[i+k]=pixels[j+k];pixels[j+k]=v}}}ctx.putImageData(frame,ox,oy);
  const list=[],actor=s.ghostRole===null?s.player:s.ghosts[s.ghostRole];
  function place(x,y,z,height,width,img,kind='sprite'){for(let offset of [-28,0,28]){let q=projectPoint(camera,wrappedX(x)+offset,y,z,height,width,W,H);if(q&&q.depth<32&&q.x+q.w>0&&q.x<W&&q.y+q.h>0&&q.y<H)list.push({...q,img,kind})}}
  // Decals are floor-aligned, use real world position and wall depth.
  for(let mark of s.skids||[]){let fade=Math.max(0,1-(s.frame-mark.frame)/48);for(let pt of skidPoints(mark)){for(let off of [-28,0,28]){let q=projectPoint(camera,wrappedX(pt.x+.5)+off,pt.y+.5,.002,.01,.075,W,H);if(!q||q.depth>10)continue;let yy=q.y+q.h;if(yy<0||yy>=H)continue;ctx.globalAlpha=fade*.7;ctx.fillStyle='#090811';for(let x of visibleColumns(depth,q)){let xx=reverse?W-1-x:x;ctx.fillRect(ox+xx,oy+yy,1,Math.max(1,.045*focal/q.depth))}}}}ctx.globalAlpha=1;
  for(let [k,v] of s.pellets){if(v==='o'&&view.blink&&(s.frame/12|0)%2!==0)continue;let large=v==='o';place(k%28+.5,(k/28|0)+.5,.035,large?.30:.12,large?.30:.12,view.texture(large?'power':'dot'))}
  if(s.fruit>0&&s.phase==='play')place(14,17.5,.03,.65,.65,view.texture('fruit'+Math.min(5,s.level-1)));
  if(s.phase!=='intermission'){let actors=[s.player,...s.ghosts];for(let i=0;i<actors.length;i++){let a=actors[i];if(a===actor||!view.actors[i]?.visible)continue;let [x,y]=run.position(a),key=view.actors[i].key;place(x+.5,y+.5,.04,1.02,1.02,view.texture(key),'actor')}}
  list.sort((a,b)=>b.depth-a.depth);for(let q of list){let im=q.img;if(!im)continue;let top=Math.max(0,q.y),bottom=Math.min(H,q.y+q.h);if(bottom<=top)continue;let sy=(top-q.y)/q.h*im.height,sh=(bottom-top)/q.h*im.height;ctx.globalAlpha=q.kind==='actor'?Math.max(.6,shade(q.depth)):Math.max(.44,shade(q.depth));for(let x of visibleColumns(depth,q)){let u=clamp(Math.floor((x+.5-q.x)/q.w*im.width),0,im.width-1);ctx.drawImage(im,u,sy,1,sh,ox+(reverse?W-1-x:x),oy+top,1,bottom-top)}}ctx.globalAlpha=1;
  // Mirror is a separate rear projection; flip its complete raster before compositing.
  return depth
 }
 function draw(run,view,dt){
  let s=run.s,actor=s.ghostRole===null?s.player:s.ghosts[s.ghostRole];if(!actor)return;let [ax,ay]=run.position(actor),target=ANGLE[actor.d],elapsed=view.paused?0:Math.min(70,Math.max(0,dt)),W=main.w,H=main.h;
  if(angle===null||lastActor!==actor||lastPhase==='dead'&&s.phase==='ready'){angle=target;kick=hold=0;lastTurn=-1}else{let diff=Math.atan2(Math.sin(target-angle),Math.cos(target-angle));angle+=diff*(1-Math.exp(-elapsed/31));if(Math.abs(diff)<.002)angle=target}
  let mark=s.skids?.at(-1);if(mark&&mark.frame!==lastTurn){lastTurn=mark.frame;if(s.frame-mark.frame<4)kick=mark.to===(mark.from+2)%4?1:.68}kick*=Math.exp(-elapsed/82);lastActor=actor;lastPhase=s.phase;
  let camera={x:wrappedX(ax+.5),y:ay+.5,angle,eye:eye-.035*kick,horizon:H/2+5*kick};
  render(run,view,camera,main);
  let threat=rearThreat(run,rows);if(threat)hold=480;else hold=Math.max(0,hold-elapsed);if(s.phase!=='play'||s.ghostRole!==null||s.fright>0)hold=0;
  let mirrorVisible=hold>0;
  if(mirrorVisible){let ox=(W-mirror.w)/2,oy=32;ctx.fillStyle='#080a13';ctx.fillRect(ox-4,oy-4,mirror.w+8,mirror.h+8);ctx.fillStyle='#b4bed3';ctx.fillRect(ox-2,oy-2,mirror.w+4,mirror.h+4);
   // Use the opposite heading and reflect the finished wall raster as well as the sprites.
   render(run,view,{...camera,angle:camera.angle+Math.PI,horizon:mirror.h/2},mirror,ox,oy,true);
   ctx.fillStyle='#080a13';ctx.fillRect(ox,oy,mirror.w,11);view.word(ctx,'REAR VIEW',ox+52,oy+2,'#ffce73');if(threat){ctx.fillStyle='#ff5146';ctx.fillRect(ox+mirror.w-7,oy+3,4,4)}
  }
  ctx.fillStyle='#000c';ctx.fillRect(0,0,W,24);view.word(ctx,view.roleName,7,4,view.roleColor);view.word(ctx,String(s.score).padStart(5,'0'),7,14,'#fff');view.word(ctx,(s.ghostRole===null?'LIVES ':'PAC ')+s.lives,W-86,4,'#fff');view.word(ctx,'DOT '+s.pellets.size,W-86,14,'#ffb897');
  let status=view.paused?'PAUSED':s.phase==='ready'?'READY!':s.phase==='over'?(s.ghostRole!==null?s.result==='win'?'YOU WIN':'PAC WINS':'GAME OVER'):s.phase==='dead'?(s.ghostRole!==null?'PAC CAUGHT':'CAUGHT'):s.phase==='clear'?'STAGE CLEAR':s.phase==='intermission'?'INTERMISSION':actor.state==='eyes'?'RETURNING':actor.state==='fright'?'VULNERABLE':'';
  if(status){ctx.fillStyle='#000d';ctx.fillRect(0,H/2-10,W,20);view.word(ctx,status,Math.round((W-status.length*8)/2),H/2-4,status==='VULNERABLE'?'#8dbaff':'#ffff00')}
  if(view.map){let z=3,ox=W-28*z-7,oy=H-31*z-7;ctx.fillStyle='#070914';ctx.fillRect(ox-4,oy-4,28*z+8,31*z+8);ctx.fillStyle='#303e79';ctx.fillRect(ox-3,oy-3,28*z+6,1);
   for(let y=0;y<31;y++)for(let x=0;x<28;x++){if(tileSolid(rows,x,y)){ctx.fillStyle='#314aa1';ctx.fillRect(ox+x*z,oy+y*z,z,z)}else if(s.pellets.has(y*28+x)){ctx.fillStyle='#ad8a76';ctx.fillRect(ox+x*z+1,oy+y*z+1,1,1)}}
   let markers=mapActors(run,view.customColor);for(let entry of markers.sort((a,b)=>Number(a.controlled)-Number(b.controlled))){let [x,y]=run.position(entry.actor),mx=Math.round(ox+(wrappedX(x)+.5)*z),my=Math.round(oy+(y+.5)*z);ctx.fillStyle='#080912';ctx.fillRect(mx-3,my-3,6,6);ctx.fillStyle=entry.color;ctx.fillRect(mx-2,my-2,4,4);if(entry.controlled){ctx.fillStyle='#fff';ctx.fillRect(mx-1,my-1,2,2);ctx.fillRect(mx+Math.round(Math.cos(angle)*4)-1,my+Math.round(Math.sin(angle)*4)-1,2,2)}}
  }
  if(kick>.04){ctx.globalAlpha=kick*.55;ctx.fillStyle='#c2c8d3';for(let i=0;i<3;i++){ctx.fillRect(10+i*8,H-34+i*5,14,1);ctx.fillRect(W-24-i*8,H-34+i*5,14,1)}ctx.globalAlpha=1}
  ctx.fillStyle='#000a';ctx.fillRect(4,H-16,view.map?W-110:W-8,12);view.word(ctx,'LEFT RIGHT TURN',8,H-13,'#ccc');
  return {camera,depth:main.depth,mirrorVisible,threat}
 }
 return {draw,reset,depth:main.depth}
}
