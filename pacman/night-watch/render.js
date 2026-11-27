import {MAP,W,H,solid,ray,GUNS} from './core.js';
import {soldierArt,pickupArt,weaponArt} from './art.js';
import {projectPoint,visibleColumns} from '../src/first-person.js';
const WIDTH=480,HEIGHT=300,plane=Math.tan(41*Math.PI/180),focal=WIDTH/(2*plane),eye=.80,wallH=1.8;
const frac=v=>v-Math.floor(v),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),shade=d=>Math.max(.16,1/(1+d*.10+d*d*.015));
export function createRenderer(canvas){const c=canvas.getContext('2d',{alpha:false});c.imageSmoothingEnabled=false;let img=c.createImageData(WIDTH,HEIGHT),depth=new Float32Array(WIDTH),soldiers=Array.from({length:3},(_,i)=>Array.from({length:5},(_,p)=>soldierArt(i,p))),items=Object.fromEntries(['light','shells','med','armor','key','shellgun','repeater','exit'].map(t=>[t,pickupArt(t)])),guns=[0,1,2].map(weaponArt);
 const wall=Array.from({length:64*64},(_,i)=>{let x=i%64,y=i>>6,j=((x*17+y*13)^(x*y))&7,edge=x===0||y===0||x===63||y===63,block=(y%16===0)||(x+(Math.floor(y/16)%2)*16)%32===0;let base=edge?16:block?29:52+j;return [base*.83,base,base*1.12]});
 const steel=Array.from({length:64*64},(_,i)=>{let x=i%64,y=i>>6,edge=x<2||x>61||y<2||y>61,bolt=(x===5||x===58)&&(y===5||y===58),band=y>25&&y<39,strip=(x+y)%16<8;return bolt?[142,149,147]:edge?[18,21,25]:band?(strip?[105,81,36]:[25,27,29]):[57,65,70]});
 function draw(s,opts={}){let p=s.p,cs=Math.cos(p.a),sn=Math.sin(p.a),data=img.data,hor=HEIGHT/2+Math.sin(p.bob)*1.5;
 for(let y=0;y<HEIGHT;y++){let floor=y>=hor,d=(floor?eye:wallH-eye)*focal/Math.max(.5,Math.abs(y+.5-hor)),xx=p.x+d*(cs+sn*plane),yy=p.y+d*(sn-cs*plane),dx=-2*d*sn*plane/WIDTH,dy=2*d*cs*plane/WIDTH,l=shade(d);
 for(let x=0;x<WIDTH;x++){let u=frac(xx),v=frac(yy),joint=u<.035||v<.035,alt=(Math.floor(xx)+Math.floor(yy))&1,base=(floor?40:26)+(alt?7:0),light=base*l*(joint?.46:1),k=(y*WIDTH+x)*4;data[k]=light*.91;data[k+1]=light*.99;data[k+2]=light*1.04;data[k+3]=255;xx+=dx;yy+=dy}}
 for(let x=0;x<WIDTH;x++){let q=(2*(x+.5)/WIDTH-1)*plane,hit=ray(p.x,p.y,cs-sn*q,sn+cs*q),d=hit.d;depth[x]=d;let top=hor-(wallH-eye)*focal/d,bottom=hor+eye*focal/d,l=shade(d)*(hit.side?.72:1),tx=clamp(Math.floor(hit.u*64),0,63),tex=hit.cell==='P'?steel:wall;for(let y=Math.max(0,Math.floor(top));y<Math.min(HEIGHT,Math.ceil(bottom));y++){let ty=clamp(Math.floor((y-top)/(bottom-top)*64),0,63),rgb=tex[ty*64+tx],k=(y*WIDTH+x)*4,ao=.72+.28*Math.min(1,Math.min(ty,63-ty)/8);data[k]=rgb[0]*l*ao;data[k+1]=rgb[1]*l*ao;data[k+2]=rgb[2]*l*ao}}
 c.putImageData(img,0,0);let cam={x:p.x,y:p.y,angle:p.a,eye,horizon:hor},list=[];
 function place(x,y,z,h,w,sprite,corpse=false){let q=projectPoint(cam,x,y,z,h,w,WIDTH,HEIGHT);if(q&&q.x+q.w>0&&q.x<WIDTH)list.push({...q,sprite,corpse})}
 for(let e of s.enemies){let pose=e.pain>0?4:e.wind>0?3:e.state==='alert'?1+(Math.floor(e.walk)%2):0;if(e.hp<=0){place(e.x,e.y,.02,.22,.8,soldiers[e.type][0],true)}else place(e.x,e.y,.02,1.55,.98,soldiers[e.type][pose])}
 for(let i of s.pickups)if(!i.taken)place(i.x,i.y,.04+Math.sin(s.time*2+i.x)*.025,.29,.43,items[i.type]);place(17.5,12.5,.2,.65,.85,items.exit);
 list.sort((a,b)=>b.depth-a.depth);for(let q of list){let im=q.sprite,top=Math.max(0,q.y),bottom=Math.min(HEIGHT,q.y+q.h);if(bottom<=top)continue;let sy=(top-q.y)/q.h*im.height,sh=(bottom-top)/q.h*im.height;c.globalAlpha=Math.max(.44,shade(q.depth));for(let x of visibleColumns(depth,q)){let u=clamp(Math.floor((x+.5-q.x)/q.w*im.width),0,im.width-1);c.drawImage(im,u,sy,1,sh,x,top,1,bottom-top)}}c.globalAlpha=1;
 let bob=Math.sin(p.bob)*3,recoil=p.flash>0?9*p.flash/.095:0,lower=p.reload>0?Math.sin(Math.min(1,p.reload/GUNS[p.gun].reload)*Math.PI)*48:0,gun=guns[p.gun];c.drawImage(gun,WIDTH/2-70+bob,HEIGHT-120+recoil+lower,140,120);if(p.flash>0){c.fillStyle='#fff0b1';c.fillRect(WIDTH/2-4,HEIGHT-132+recoil,8,16);c.fillStyle='#df943f';c.fillRect(WIDTH/2-11,HEIGHT-125+recoil,22,5)}
 if(p.hit>0){c.fillStyle='rgba(170,24,20,'+(p.hit*.55)+')';c.fillRect(0,0,WIDTH,HEIGHT)}
 c.fillStyle='#d2d2bd';c.fillRect(WIDTH/2-7,HEIGHT/2,5,1);c.fillRect(WIDTH/2+3,HEIGHT/2,5,1);c.fillRect(WIDTH/2,HEIGHT/2-7,1,5);c.fillRect(WIDTH/2,HEIGHT/2+3,1,5);
 if(opts.map){let z=4,ox=WIDTH-W*z-8,oy=8;c.fillStyle='#0a1018dd';c.fillRect(ox-4,oy-4,W*z+8,H*z+8);for(let y=0;y<H;y++)for(let x=0;x<W;x++){c.fillStyle=solid(x,y)?'#46545c':'#18242b';c.fillRect(ox+x*z,oy+y*z,z-1,z-1)}for(let e of s.enemies)if(e.hp>0){c.fillStyle='#c0524b';c.fillRect(ox+e.x*z-1,oy+e.y*z-1,3,3)}for(let i of s.pickups)if(!i.taken){c.fillStyle=i.type==='key'?'#e8bc60':'#748d79';c.fillRect(ox+i.x*z,oy+i.y*z,2,2)}c.fillStyle='#91d8a8';c.fillRect(ox+p.x*z-1,oy+p.y*z-1,3,3);c.fillRect(ox+(p.x+Math.cos(p.a))*z,oy+(p.y+Math.sin(p.a))*z,2,2)}
 }
 return {draw,depth};
}
