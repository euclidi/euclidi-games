import {MAP,W,H,solid,ray,GUNS} from './core.js';
import {soldierArt,pickupArt,weaponArt,corpseArt} from './art.js';
import {atlas,SIZE,illumination,isFixture} from './materials.js';
import {projectPoint,visibleColumns} from './projection.js';
const WIDTH=640,HEIGHT=400,plane=Math.tan(41*Math.PI/180),focal=WIDTH/(2*plane),eye=.80,wallH=1.8;
const frac=v=>v-Math.floor(v),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),shade=d=>Math.max(.23,1/(1+d*.055+d*d*.008));
export function createRenderer(canvas){const c=canvas.getContext('2d',{alpha:false});canvas.width=WIDTH;canvas.height=HEIGHT;c.imageSmoothingEnabled=false;let img=c.createImageData(WIDTH,HEIGHT),depth=new Float32Array(WIDTH),soldiers=Array.from({length:3},(_,i)=>Array.from({length:5},(_,p)=>soldierArt(i,p))),items=Object.fromEntries(['light','shells','med','armor','key','shellgun','repeater','exit'].map(t=>[t,pickupArt(t)])),guns=[0,1,2].map(weaponArt),corpses=[0,1,2].map(corpseArt);
 function draw(s,opts={}){let p=s.p,cs=Math.cos(p.a),sn=Math.sin(p.a),data=img.data,hor=HEIGHT/2+Math.sin(p.bob)*1.5;
 // Perspective-correct floor/ceiling mapping; shared world-space illumination.
 for(let y=0;y<HEIGHT;y++){let floor=y>=hor,d=(floor?eye:wallH-eye)*focal/Math.max(.5,Math.abs(y+.5-hor)),xx=p.x+d*(cs+sn*plane),yy=p.y+d*(sn-cs*plane),dx=-2*d*sn*plane/WIDTH,dy=2*d*cs*plane/WIDTH,l=shade(d),flash=p.flash*5/(1+d*d*.4);
 for(let x=0;x<WIDTH;x++){let ix=Math.floor(xx),iy=Math.floor(yy),u=(frac(xx)*SIZE)|0,v=(frac(yy)*SIZE)|0,k=(y*WIDTH+x)*4,t=(v*SIZE+u)*3,variant=(ix*17+iy*31)&3,fixture=!floor&&isFixture(ix,iy),tex=floor?atlas.floor[variant]:fixture?atlas.lamp:atlas.ceiling,lit=illumination(xx,yy)*l+flash;if(fixture&&tex[t]>150)lit=Math.max(lit,.8*l);data[k]=tex[t]*lit*.93;data[k+1]=tex[t+1]*lit;data[k+2]=tex[t+2]*lit*1.05;data[k+3]=255;xx+=dx;yy+=dy}}
 for(let x=0;x<WIDTH;x++){let q=(2*(x+.5)/WIDTH-1)*plane,rx=cs-sn*q,ry=sn+cs*q,hit=ray(p.x,p.y,rx,ry),d=hit.d;depth[x]=d;let top=hor-(wallH-eye)*focal/d,bottom=hor+eye*focal/d,wx=p.x+rx*(d-.045),wy=p.y+ry*(d-.045),variant=(Math.floor(p.x+rx*(d+.01))*17+Math.floor(p.y+ry*(d+.01))*31)&3,l=shade(d)*(illumination(wx,wy)+p.flash*6/(1+d*d*.4))*(hit.side?.83:1),tx=clamp(Math.floor(hit.u*SIZE),0,SIZE-1),tex=hit.cell==='P'?atlas.steel:atlas.wall[variant];for(let y=Math.max(0,Math.floor(top));y<Math.min(HEIGHT,Math.ceil(bottom));y++){let ty=clamp(Math.floor((y-top)/(bottom-top)*SIZE),0,SIZE-1),t=(ty*SIZE+tx)*3,k=(y*WIDTH+x)*4,ao=.68+.32*Math.min(1,Math.min(ty,SIZE-1-ty)/13);data[k]=tex[t]*l*ao*.94;data[k+1]=tex[t+1]*l*ao;data[k+2]=tex[t+2]*l*ao*1.04}}
 c.putImageData(img,0,0);let cam={x:p.x,y:p.y,angle:p.a,eye,horizon:hor},list=[];
 function place(x,y,z,h,w,sprite,corpse=false){let q=projectPoint(cam,x,y,z,h,w,WIDTH,HEIGHT);if(q&&q.x+q.w>0&&q.x<WIDTH)list.push({...q,sprite,corpse,light:illumination(x,y)})}
 for(let e of s.enemies){let pose=e.pain>0?4:e.wind>0?3:e.state==='alert'?1+(Math.floor(e.walk)%2):0;if(e.hp<=0){place(e.x,e.y,.02,.24+.95*(1-e.death),.88,corpses[e.type],true)}else place(e.x,e.y,.02,1.55,.98,soldiers[e.type][pose])}
 for(let i of s.pickups)if(!i.taken)place(i.x,i.y,.04+Math.sin(s.time*2+i.x)*.025,.29,.43,items[i.type]);place(17.5,12.5,.2,.65,.85,items.exit);
 list.sort((a,b)=>b.depth-a.depth);for(let q of list){let im=q.sprite,top=Math.max(0,q.y),bottom=Math.min(HEIGHT,q.y+q.h);if(bottom<=top)continue;let sy=(top-q.y)/q.h*im.height,sh=(bottom-top)/q.h*im.height;c.globalAlpha=1;c.filter='brightness('+Math.max(.30,Math.min(1.15,q.light*shade(q.depth)))+')';for(let x of visibleColumns(depth,q)){let u=clamp(Math.floor((x+.5-q.x)/q.w*im.width),0,im.width-1);c.drawImage(im,u,sy,1,sh,x,top,1,bottom-top)}}c.globalAlpha=1;c.filter='none';
 let bob=Math.sin(p.bob)*4,recoil=p.flash>0?15*p.flash/.095:0,lower=p.reload>0?Math.sin(Math.min(1,p.reload/GUNS[p.gun].reload)*Math.PI)*78:0,gun=guns[p.gun],gw=288,gh=216;
 c.filter='brightness('+Math.max(.52,Math.min(1.18,illumination(p.x,p.y)+p.flash*5))+')';c.drawImage(gun,WIDTH/2-gw/2+bob,HEIGHT-gh+recoil+lower,gw,gh);c.filter='none';
 if(p.flash>0){let x=WIDTH/2+bob,y=HEIGHT-gh+27+recoil;for(let i=0;i<11;i++){let a=i*2.399,power=(i%3+1)*7;c.fillStyle=i%2?'#e8a34c':'#fff1ba';c.fillRect(Math.round(x+Math.cos(a)*power),Math.round(y+Math.sin(a)*power*.8),3+(i%3)*3,3+(i%2)*4)}c.fillStyle='#fff5d2';c.fillRect(x-5,y-7,10,14)}
 if(p.hit>0){c.fillStyle='rgba(170,24,20,'+(p.hit*.55)+')';c.fillRect(0,0,WIDTH,HEIGHT)}
 c.fillStyle='#d2d2bd';c.fillRect(WIDTH/2-7,HEIGHT/2,5,1);c.fillRect(WIDTH/2+3,HEIGHT/2,5,1);c.fillRect(WIDTH/2,HEIGHT/2-7,1,5);c.fillRect(WIDTH/2,HEIGHT/2+3,1,5);
 if(opts.map){let z=5,ox=WIDTH-W*z-8,oy=8;c.fillStyle='#0a1018dd';c.fillRect(ox-4,oy-4,W*z+8,H*z+8);for(let y=0;y<H;y++)for(let x=0;x<W;x++){c.fillStyle=solid(x,y)?'#46545c':'#18242b';c.fillRect(ox+x*z,oy+y*z,z-1,z-1)}for(let e of s.enemies)if(e.hp>0){c.fillStyle='#c0524b';c.fillRect(ox+e.x*z-1,oy+e.y*z-1,3,3)}for(let i of s.pickups)if(!i.taken){c.fillStyle=i.type==='key'?'#e8bc60':'#748d79';c.fillRect(ox+i.x*z,oy+i.y*z,2,2)}c.fillStyle='#91d8a8';c.fillRect(ox+p.x*z-1,oy+p.y*z-1,3,3);c.fillRect(ox+(p.x+Math.cos(p.a))*z,oy+(p.y+Math.sin(p.a))*z,2,2)}
 }
 return {draw,depth};
}
