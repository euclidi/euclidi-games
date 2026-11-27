// Original deterministic 128px raster material atlas and baked, wall-occluded lighting.
import {W,H,solid,ray} from './core.js';
import {fixtures} from './level.js';
export {fixtures};
export const SIZE=128;
const hash=(x,y,s=0)=>{let n=Math.imul(x+17,374761393)^Math.imul(y+31,668265263)^Math.imul(s+3,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=t=>t*t*(3-2*t);
function noise(x,y,scale,seed){let a=x/scale,b=y/scale,i=Math.floor(a),j=Math.floor(b),u=smooth(a-i),v=smooth(b-j);return (hash(i,j,seed)*(1-u)+hash(i+1,j,seed)*u)*(1-v)+(hash(i,j+1,seed)*(1-u)+hash(i+1,j+1,seed)*u)*v}
function tex(fn){let a=new Uint8Array(SIZE*SIZE*3);for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){let k=(y*SIZE+x)*3,r=fn(x,y);for(let i=0;i<3;i++)a[k+i]=clamp(r[i],0,255)}return a}
const tone=(base,n)=>base.map(v=>v+n);
const grain=(x,y,s)=> (hash(x,y,s)-.5)*15+(noise(x,y,9,s)-.5)*24+(noise(x,y,34,s+1)-.5)*32;
function bolt(x,y,bx,by){let dx=x-bx,dy=y-by,d=dx*dx+dy*dy;return d<18?(d>10?20:dx+dy<0?145:76):null}
function masonry(x,y,seed){let row=y>>5,xx=(x+(row&1)*32)%64,yy=y%32,edge=Math.min(xx,63-xx,yy,31-yy),n=grain(x,y,seed),stain=noise(x,y,22,seed+4);if(edge<1)return tone([32,34,32],n*.3);let base=[92,99,97],bevel=edge===1?(yy===1||xx===1?17:-20):0,chip=hash(x,y,seed+3)>.97?-24:0;let crack=Math.abs(x-((y*.23+9+Math.sin(y*.22)*3)%128))<.7&&stain<.43?-25:0;return tone(base,n+bevel+chip+crack+(hash(Math.floor((x+(row&1)*32)/64),row,seed)-.5)*17-stain*14)}
function panel(x,y,seed){let n=grain(x,y,seed),ed=Math.min(x,127-x,y,127-y);for(let bx of [8,119])for(let by of [8,119]){let b=bolt(x,y,bx,by);if(b!==null)return tone([b,b+4,b+3],n*.2)}
if(ed<2)return [23,29,30];if(ed<4)return tone([65,74,72],x<5||y<5?24:-15);if(y>103&&y<116){let a=((x+y)>>3)&1;return tone(a?[142,118,57]:[37,41,39],n*.65)}
if(x>15&&x<113&&y>17&&y<98){let seam=x===16||x===112||y===18||y===97;if(seam)return [35,42,41];if(y>36&&y<82&&x>29&&x<98){let r=y%8;if(r<3)return tone([21,28,28],n*.25);if(r===3)return tone([119,126,117],n*.5);return tone([75,86,83],n*.65)}}return tone([83,94,91],n+(noise(x,y,14,seed+8)>.72?8:0))}
function slab(x,y,seed,ceil=false){let ed=Math.min(x,127-x,y,127-y),n=grain(x,y,seed);if(ed<2)return tone([25,30,29],n*.4);if(ed===2)return tone([66,71,67],n*.5);let base=ceil?[68,75,75]:[80,86,81];if(!ceil&&hash(x,y,seed+7)>.95)n-=16;return tone(base,n+(ceil&&((x%32===0)||(y%32===0))?-11:0))}
export const atlas={wall:[0,1,2,3].map(s=>tex((x,y)=>masonry(x,y,s))),steel:tex((x,y)=>panel(x,y,12)),floor:[0,1,2,3].map(s=>tex((x,y)=>slab(x,y,s+22))),ceiling:tex((x,y)=>slab(x,y,41,true)),lamp:tex((x,y)=>{let ed=Math.min(x,127-x,y,127-y);if(ed<8)return [37,44,43];if(ed<13)return [92,100,96];if(x>26&&x<102&&y>44&&y<84){return y%9<2?[127,137,126]:[207,222,199]}return [58,65,61]})};
const fixtureKeys=new Uint8Array(W*H);for(let [x,y] of fixtures)fixtureKeys[Math.floor(y)*W+Math.floor(x)]=1;
export function isFixture(x,y){return x>=0&&y>=0&&x<W&&y<H&&fixtureKeys[y*W+x]===1}
const R=4,LW=W*R+1,LH=H*R+1,light=new Float32Array(LW*LH);
for(let y=0;y<LH;y++)for(let x=0;x<LW;x++){let a=x/R,b=y/R,v=.24;for(let [lx,ly] of fixtures){let dx=lx-a,dy=ly-b,d=Math.hypot(dx,dy);if(d>5.5)continue;if(d<.01||ray(lx,ly,-dx/d,-dy/d).d>=d-.09)v+=.86/(1+d*d*.65)}light[y*LW+x]=Math.min(1.28,v)}
export function illumination(x,y){let a=clamp(x*R,0,LW-1.001),b=clamp(y*R,0,LH-1.001),i=a|0,j=b|0,u=a-i,v=b-j,k=j*LW+i;return (light[k]*(1-u)+light[k+1]*u)*(1-v)+(light[k+LW]*(1-u)+light[k+LW+1]*u)*v}
