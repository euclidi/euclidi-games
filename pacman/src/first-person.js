// Local grid-raycast renderer: same maze geometry, per-column depth, bitmap sprite billboards.
export const FP_W=320,FP_H=240;
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
 let lateral=-dx*sn+dy*cs,focal=w/(2*Math.tan(41*Math.PI/180)),cx=w/2+lateral*focal/depth,top=h/2-(z+height-camera.eye)*focal/depth;
 return {depth,x:cx-width*focal/depth/2,y:top,w:width*focal/depth,h:height*focal/depth}
}
export function visibleColumns(depth,rect,w=depth.length){let spans=[];let lo=Math.max(0,Math.floor(rect.x)),hi=Math.min(w,Math.ceil(rect.x+rect.w));for(let x=lo;x<hi;x++)if(rect.depth<depth[x]-.015)spans.push(x);return spans}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const shade=d=>Math.max(.16,1/(1+d*.12+d*d*.009));
const frac=v=>v-Math.floor(v);
// Raster material: navy ceramic wall blocks with inset cobalt enamel rails, black grout.
function wallPixel(u,v,side,d,fright){
 let x=clamp(Math.floor(u*64),0,63),y=clamp(Math.floor(v*64),0,63),seam=x===0||x===63,band=y===7||y===8||y===54||y===55,bevel=x===1||x===62||y===0||y===63,inner=y===10||y===52,grain=((x*17+y*11)^(x*y))&3;
 let rgb=seam?[5,7,20]:band?[57,80,246]:bevel?[25,32,96]:inner?[24,38,144]:[11+grain,17+grain,61+grain*2];if(fright&&band)rgb=[68,108,255];let l=shade(d)*(side===1?.76:1);return [rgb[0]*l,rgb[1]*l,rgb[2]*l]
}
export function createFirstPerson(canvas,rows){
 const ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;let frame=ctx.createImageData(FP_W,FP_H),depth=new Float32Array(FP_W),angle=null,lastActor=null,lastPhase=null;
 const focal=FP_W/(2*Math.tan(41*Math.PI/180)),wallHeight=1.48,eye=.69;
 function reset(){angle=null;lastActor=null;lastPhase=null}
 function draw(run,view,dt){
  const s=run.s,actor=s.ghostRole===null?s.player:s.ghosts[s.ghostRole];if(!actor)return;let [ax,ay]=run.position(actor),target=ANGLE[actor.d];
  if(angle===null||lastActor!==actor||lastPhase==='dead'&&s.phase==='ready')angle=target;else angle=turnAngle(angle,target,Math.min(dt,70));lastActor=actor;lastPhase=s.phase;
  const camera={x:wrappedX(ax+.5),y:ay+.5,angle,eye},cs=Math.cos(angle),sn=Math.sin(angle),plane=Math.tan(41*Math.PI/180),pixels=frame.data,W=FP_W,H=FP_H;
  // Perspective floor and ceiling, tile-aligned grout and muted distance lighting.
  for(let y=0;y<H;y++){let down=y>=H/2,dist=(down?eye:wallHeight-eye)*focal/Math.max(.5,Math.abs(y+.5-H/2)),lx=camera.x+dist*(cs+sn*plane),ly=camera.y+dist*(sn-cs*plane),sx=-2*dist*sn*plane/W,sy=2*dist*cs*plane/W,l=shade(dist),base=down?23:12;
   for(let x=0;x<W;x++){let u=frac(lx),v=frac(ly),joint=u<.025||v<.025||u>.975||v>.975,checker=(Math.floor(lx)+Math.floor(ly))&1,detail=joint?.42:1,light=(base+checker*4)*l*detail,k=(y*W+x)*4;pixels[k]=light*.65;pixels[k+1]=light*.79;pixels[k+2]=light*(down?1.22:1.7);pixels[k+3]=255;lx+=sx;ly+=sy}
  }
  for(let x=0;x<W;x++){let lateral=(2*(x+.5)/W-1)*plane,hit=castRay(rows,camera.x,camera.y,cs-sn*lateral,sn+cs*lateral),d=hit.depth;depth[x]=d;let top=H/2-(wallHeight-eye)*focal/d,bottom=H/2+eye*focal/d,span=bottom-top;
   for(let y=Math.max(0,Math.floor(top));y<Math.min(H,Math.ceil(bottom));y++){let [r,g,b]=wallPixel(hit.u,(y+.5-top)/span,hit.side,d,s.fright>0),k=(y*W+x)*4;pixels[k]=r;pixels[k+1]=g;pixels[k+2]=b;pixels[k+3]=255}
  }
  ctx.putImageData(frame,0,0);
  const list=[];
  function place(x,y,z,height,width,img){
   // Periodic copies across the side tunnel; only the closest visible projection survives the wall depth test.
   for(let offset of [-28,0,28]){let q=projectPoint(camera,wrappedX(x)+offset,y,z,height,width);if(q&&q.depth<32&&q.x+q.w>0&&q.x<W&&q.y+q.h>0&&q.y<H)list.push({...q,img})}
  }
  for(let [k,v] of s.pellets){if(v==='o'&&view.blink&&(s.frame/12|0)%2!==0)continue;let large=v==='o';place(k%28+.5,(k/28|0)+.5,.035,large?.30:.12,large?.30:.12,view.texture(large?'power':'dot'))}
  if(s.fruit>0&&s.phase==='play')place(14,17.5,.03,.65,.65,view.texture('fruit'+Math.min(5,s.level-1)));
  if(s.phase!=='intermission'){let actors=[s.player,...s.ghosts];for(let i=0;i<actors.length;i++){let a=actors[i];if(a===actor||!view.actors[i]?.visible)continue;let [x,y]=run.position(a),key=view.actors[i].key;place(x+.5,y+.5,.04,1.02,1.02,view.texture(key))}}
  list.sort((a,b)=>b.depth-a.depth);for(let q of list){let im=q.img;if(!im)continue;ctx.globalAlpha=Math.max(.35,shade(q.depth));for(let x of visibleColumns(depth,q)){let u=clamp(Math.floor((x+.5-q.x)/q.w*im.width),0,im.width-1);ctx.drawImage(im,u,0,1,im.height,x,q.y,1,q.h)}}ctx.globalAlpha=1;
  // Subtle role-specific status border and compact bitmap HUD, independent of projection.
  ctx.fillStyle='#000c';ctx.fillRect(0,0,W,22);view.word(ctx,view.roleName,6,3,view.roleColor);view.word(ctx,String(s.score).padStart(5,'0'),6,13,'#fff');view.word(ctx,'PAC '+s.lives, W-62,3,'#fff');view.word(ctx,'DOT '+s.pellets.size,W-78,13,'#ffb897');
  let status=view.paused?'PAUSED':s.phase==='ready'?'READY!':s.phase==='over'?(s.ghostRole!==null?s.result==='win'?'YOU WIN':'PAC WINS':'GAME OVER'):s.phase==='dead'?(s.ghostRole!==null?'PAC CAUGHT':'CAUGHT'):s.phase==='clear'?'STAGE CLEAR':s.phase==='intermission'?'INTERMISSION':actor.state==='eyes'?'RETURNING':actor.state==='fright'?'VULNERABLE':'';
  if(status){ctx.fillStyle='#000d';ctx.fillRect(0,H/2-10,W,20);view.word(ctx,status,Math.round((W-status.length*8)/2),H/2-4,status==='VULNERABLE'?'#8dbaff':'#ffff00')}
  if(view.map){let z=2,ox=W-28*z-5,oy=H-31*z-5;ctx.fillStyle='#000d';ctx.fillRect(ox-3,oy-3,28*z+6,31*z+6);for(let y=0;y<31;y++)for(let x=0;x<28;x++){if(tileSolid(rows,x,y)){ctx.fillStyle='#252b86';ctx.fillRect(ox+x*z,oy+y*z,z,z)}else if(s.pellets.has(y*28+x)){ctx.fillStyle='#8c6c65';ctx.fillRect(ox+x*z,oy+y*z,1,1)}}let mark=(a,c)=>{let [x,y]=run.position(a);ctx.fillStyle=c;ctx.fillRect(ox+wrappedX(x)*z,oy+y*z,3,3)};mark(actor,'#fff');ctx.fillStyle=view.roleColor;let mx=ox+wrappedX(ax)*z+1,my=oy+ay*z+1;ctx.fillRect(mx+Math.round(Math.cos(angle)*3),my+Math.round(Math.sin(angle)*3),2,2)}
  ctx.fillStyle='#000a';ctx.fillRect(4,H-15,view.map?215:W-8,11);view.word(ctx,'LEFT RIGHT TURN',8,H-13,'#ccc');
  return {camera,depth}
 }
 return {draw,reset,depth}
}
