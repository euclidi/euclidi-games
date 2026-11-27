import {MAP,W,H,solid,ray,GUNS} from './core.js';
import {soldierArt,pickupArt,weaponArt,corpseArt} from './art.js';
import {atlas as fallbackAtlas,SIZE,illumination,isFixture} from './materials.js';
import {exit,roomAt} from './level.js';
import {projectPoint,visibleColumns} from './projection.js';
const WIDTH=640,HEIGHT=400,plane=Math.tan(41*Math.PI/180),focal=WIDTH/(2*plane),eye=.80,wallH=1.8;
const frac=v=>v-Math.floor(v),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),shade=d=>Math.max(.23,1/(1+d*.055+d*d*.008));
export function createRenderer(canvas,authored){const atlas=authored?.atlas||fallbackAtlas;const c=canvas.getContext('2d',{alpha:false});canvas.width=WIDTH;canvas.height=HEIGHT;c.imageSmoothingEnabled=false;let img=c.createImageData(WIDTH,HEIGHT),depth=new Float32Array(WIDTH),soldiers=Array.from({length:3},(_,i)=>Array.from({length:5},(_,p)=>soldierArt(i,p))),items=Object.fromEntries(['light','shells','med','armor','key','shellgun','repeater','exit'].map(t=>[t,pickupArt(t)])),guns=authored?.guns||[0,1,2].map(weaponArt),corpses=[0,1,2].map(corpseArt);
 if(authored)Object.assign(items,authored.items);
 const zones=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)zones[y*W+x]=roomAt(x+.5,y+.5).material;
 function zone(x,y){x=Math.floor(x);y=Math.floor(y);return x>=0&&y>=0&&x<W&&y<H?zones[y*W+x]:1}
 function draw(s,opts={}){let p=s.p,cs=Math.cos(p.a),sn=Math.sin(p.a),data=img.data,hor=HEIGHT/2+Math.sin(p.bob)*1.5;
 // Perspective-correct floor/ceiling mapping; shared world-space illumination.
 for(let y=0;y<HEIGHT;y++){let floor=y>=hor,d=(floor?eye:wallH-eye)*focal/Math.max(.5,Math.abs(y+.5-hor)),xx=p.x+d*(cs+sn*plane),yy=p.y+d*(sn-cs*plane),dx=-2*d*sn*plane/WIDTH,dy=2*d*cs*plane/WIDTH,l=shade(d),flash=p.flash*5/(1+d*d*.4);
 for(let x=0;x<WIDTH;x++){let ix=Math.floor(xx),iy=Math.floor(yy),u=(frac(xx)*SIZE)|0,v=(frac(yy)*SIZE)|0,k=(y*WIDTH+x)*4,t=(v*SIZE+u)*3,variant=zone(ix,iy),fixture=!floor&&isFixture(ix,iy),tex=floor?atlas.floor[variant]:fixture?atlas.lamp:atlas.ceiling,lit=(.24+.85*illumination(xx,yy))*l+flash;if(fixture&&tex[t]>150)lit=Math.max(lit,.8*l);data[k]=tex[t]*lit*.93;data[k+1]=tex[t+1]*lit;data[k+2]=tex[t+2]*lit*1.05;data[k+3]=255;xx+=dx;yy+=dy}}
 for(let x=0;x<WIDTH;x++){let q=(2*(x+.5)/WIDTH-1)*plane,rx=cs-sn*q,ry=sn+cs*q,hit=ray(p.x,p.y,rx,ry),d=hit.d;depth[x]=d;let top=hor-(wallH-eye)*focal/d,bottom=hor+eye*focal/d,wx=p.x+rx*(d-.045),wy=p.y+ry*(d-.045),variant=zone(wx,wy),l=shade(d)*(.22+.9*illumination(wx,wy)+p.flash*6/(1+d*d*.4))*(hit.side?.83:1),tx=clamp(Math.floor((hit.side===0&&rx<0||hit.side===1&&ry>0?1-hit.u:hit.u)*SIZE),0,SIZE-1),tex=authored?.signage[hit.ix+','+hit.iy+','+hit.side]||(hit.cell==='P'?atlas.steel:atlas.wall[variant]);for(let y=Math.max(0,Math.floor(top));y<Math.min(HEIGHT,Math.ceil(bottom));y++){let ty=clamp(Math.floor((y-top)/(bottom-top)*SIZE),0,SIZE-1),t=(ty*SIZE+tx)*3,k=(y*WIDTH+x)*4,ao=.68+.32*Math.min(1,Math.min(ty,SIZE-1-ty)/13);data[k]=tex[t]*l*ao*.94;data[k+1]=tex[t+1]*l*ao;data[k+2]=tex[t+2]*l*ao*1.04}}
 c.putImageData(img,0,0);let cam={x:p.x,y:p.y,angle:p.a,eye,horizon:hor},list=[];
 function place(x,y,z,h,w,sprite,corpse=false){let q=projectPoint(cam,x,y,z,h,w,WIDTH,HEIGHT);if(q&&q.x+q.w>0&&q.x<WIDTH)list.push({...q,sprite,corpse,light:illumination(x,y)})}
 for(let e of s.enemies){
  if(authored){let view=Math.atan2(p.y-e.y,p.x-e.x),dir=((Math.round((e.a-view)/(Math.PI/4))%8+8)%8)+1,phase='abcd'[Math.floor(e.walk)%4],g=authored.guards;
   let name=e.hp<=0?(e.death<.3?'guard-death':'guard-dead'):e.pain>0?'guard-pain':e.flash>0?'guard-fire':e.wind>0?'guard-aim':'guard-'+(e.state==='idle'?'a':phase)+dir;
   let a=g[name]||g['guard-a'+dir]||g['guard-a1'],h=e.hp<=0?(e.death<.3?.85:.23):1.55;
   place(e.x,e.y,.02,h,h*a.width/a.height,a,e.hp<=0);
  }else{let pose=e.pain>0?4:e.wind>0?3:e.state==='alert'?1+(Math.floor(e.walk)%2):0;if(e.hp<=0)place(e.x,e.y,.02,.24,.88,corpses[e.type],true);else place(e.x,e.y,.02,1.55,.98,soldiers[e.type][pose])}
 }
 const itemWidth={light:.52,shells:.55,med:.52,armor:.7,key:.28,shellgun:.95,repeater:.9};
 for(let i of s.pickups)if(!i.taken){let a=items[i.type],w=itemWidth[i.type]||.45,h=w*a.height/a.width;place(i.x,i.y,.03,h,w,a)}
 if(authored){for(let [x,y] of [[17.5,6.5],[25.5,12.5],[17.5,12.5]]){let a=authored.props.barrel;place(x,y,.02,.72,.72*a.width/a.height,a)}for(let [x,y] of [[25.5,16.5],[1.5,1.5]]){let a=authored.props.terminal;place(x,y,.02,1.45,1.45*a.width/a.height,a)}}
 place(exit.x,exit.y,.18,.55,.82,items.exit);
 list.sort((a,b)=>b.depth-a.depth);for(let q of list){let im=q.sprite,top=Math.max(0,q.y),bottom=Math.min(HEIGHT,q.y+q.h);if(bottom<=top)continue;let sy=(top-q.y)/q.h*im.height,sh=(bottom-top)/q.h*im.height;c.globalAlpha=1;c.filter='brightness('+Math.max(.48,Math.min(1.18,(.3+q.light)*shade(q.depth)))+')';for(let x of visibleColumns(depth,q)){let u=clamp(Math.floor((x+.5-q.x)/q.w*im.width),0,im.width-1);c.drawImage(im,u,sy,1,sh,x,top,1,bottom-top)}}c.globalAlpha=1;c.filter='none';
 let bob=Math.sin(p.bob)*4,recoil=p.flash>0?13*p.flash/.095:0,progress=p.reload>0?1-p.reload/GUNS[p.gun].reload:0,lower=p.reload>0?Math.sin(progress*Math.PI)*52:0;
 let gun=p.flash>0&&authored?authored.firing[p.gun]:guns[p.gun];if(authored&&p.gun===1&&p.reload>0&&progress>.22&&progress<.78)gun=authored.reload;
 const scale=authored?2.35:2,gw=gun.width*scale,gh=gun.height*scale,gunX=WIDTH/2-gw/2+bob,gunY=HEIGHT-gh+recoil+lower;
 c.filter='brightness('+Math.max(.73,Math.min(1.25,.3+illumination(p.x,p.y)+p.flash*4))+')';c.drawImage(gun,gunX,gunY,gw,gh);c.filter='none';
 if(p.flash>0){let x=WIDTH/2+bob,y=gunY+9;for(let i=0;i<7;i++){let a=i*2.399,power=(i%3+1)*6;c.fillStyle=i%2?'#d28d40':'#ffe5a0';c.fillRect(Math.round(x+Math.cos(a)*power),Math.round(y+Math.sin(a)*power*.8),3+(i%3)*3,3+(i%2)*4)}c.fillStyle='#fff5d2';c.fillRect(x-4,y-6,8,12)}
 if(p.hit>0){c.fillStyle='rgba(170,24,20,'+(p.hit*.55)+')';c.fillRect(0,0,WIDTH,HEIGHT)}
 c.fillStyle='#d2d2bd';c.fillRect(WIDTH/2-7,HEIGHT/2,5,1);c.fillRect(WIDTH/2+3,HEIGHT/2,5,1);c.fillRect(WIDTH/2,HEIGHT/2-7,1,5);c.fillRect(WIDTH/2,HEIGHT/2+3,1,5);
 if(opts.map){let z=4,ox=WIDTH-W*z-8,oy=8;c.fillStyle='#0a1018dd';c.fillRect(ox-4,oy-4,W*z+8,H*z+8);for(let y=0;y<H;y++)for(let x=0;x<W;x++){c.fillStyle=solid(x,y)?'#46545c':'#18242b';c.fillRect(ox+x*z,oy+y*z,z-1,z-1)}for(let e of s.enemies)if(e.hp>0){c.fillStyle='#c0524b';c.fillRect(ox+e.x*z-1,oy+e.y*z-1,3,3)}for(let i of s.pickups)if(!i.taken){c.fillStyle=i.type==='key'?'#e8bc60':'#748d79';c.fillRect(ox+i.x*z,oy+i.y*z,2,2)}c.fillStyle='#91d8a8';c.fillRect(ox+p.x*z-1,oy+p.y*z-1,3,3);c.fillRect(ox+(p.x+Math.cos(p.a))*z,oy+(p.y+Math.sin(p.a))*z,2,2)}
 }
 return {draw,depth};
}
