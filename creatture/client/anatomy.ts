import * as T from 'three';
import type {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
type V=[number,number,number];
export type AnatomyNode={id:number,parent:number,organ:number,pos:number[],radius:number,exterior:boolean,maturity:number};
// Bounded smooth-union signed-distance field. Unlike summing metaball potentials,
// neighboring organs cannot inflate the whole torso into one featureless volume.
export class AnatomyField{
 private n:number;private half:number;private step:number;private f:Float32Array;private iso:number;
 constructor(private surface:MarchingCubes,private scale=1.8){this.n=surface.size;this.half=this.n/2;this.step=2*scale/this.n;this.f=surface.field;this.iso=surface.isolation;}
 clear(){this.surface.reset();this.f.fill(0);}
 private brush(center:V,axes:V,blend=.045){
  const n=this.n,h=this.half,step=this.step,iso=this.iso,f=this.f,k=blend*100;
  const low=center.map((x,i)=>Math.max(2,Math.floor((x-axes[i]-blend*1.8)/step+h)));
  const high=center.map((x,i)=>Math.min(n-3,Math.ceil((x+axes[i]+blend*1.8)/step+h)));
  const min=Math.min(...axes);
  for(let z=low[2];z<=high[2];z++)for(let y=low[1];y<=high[1];y++)for(let x=low[0];x<=high[0];x++){
   const dx=((x-h)*step-center[0])/axes[0],dy=((y-h)*step-center[1])/axes[1],dz=((z-h)*step-center[2])/axes[2];
   const value=iso-(Math.sqrt(dx*dx+dy*dy+dz*dz)-1)*min*100;
   const i=x+y*n+z*n*n,a=f[i],d=Math.max(0,k-Math.abs(a-value))/Math.max(k,1e-6);
   f[i]=Math.max(a,value)+d*d*k*.25;
  }
 }
 ellipsoid(center:number[],axes:number[],blend=.045){this.brush(center as V,axes.map(x=>Math.max(.025,x)) as V,blend);}
 link(a:number[],b:number[],ra:number,rb:number,shape:V=[1,1,1]){
  const dist=Math.hypot(...a.map((x,i)=>x-b[i]));const count=Math.max(1,Math.min(20,Math.ceil(dist/Math.max(.037,Math.min(ra,rb)*.54))));
  for(let j=0;j<=count;j++){const t=j/count,r=ra+(rb-ra)*t;this.ellipsoid(a.map((x,i)=>x+(b[i]-x)*t),shape.map(x=>r*x),.025);}
 }
 sample(x:number,y:number,z:number){
  const n=this.n,h=this.half,step=this.step,xx=x/step+h,yy=y/step+h,zz=z/step+h;
  const a=Math.floor(xx),b=Math.floor(yy),c=Math.floor(zz);if(a<0||b<0||c<0||a>=n-1||b>=n-1||c>=n-1)return 0;
  const fx=xx-a,fy=yy-b,fz=zz-c;let sum=0;
  for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++)sum+=this.f[(a+i)+(b+j)*n+(c+k)*n*n]*(i?fx:1-fx)*(j?fy:1-fy)*(k?fz:1-fz);
  return sum;
 }
 front(x:number,y:number){for(let z=1.48;z>=-.2;z-=.012)if(this.sample(x,y,z)>=this.iso)return z;return null;}
 finish(){this.surface.update();}
}
export function bodyProfile(world:number,r:number,g:number[]){
 const forms:V[]=[[.86,.73,1.06],[1.03,.56,1.18],[1.08,.68,.98],[.82,.91,.93],[.94,.69,1.03],[.89,.77,.97]];
 return forms[world%6].map((v,i)=>v*r*(.92+.16*g[i])) as V;
}
export function organProfile(organ:number,r:number,world:number):V{
 const shapes:V[]=[[1,1,1],[1,1,1],[1.45,.45,1.17],[1.20,.46,1.2],[.82,1.22,.78],[1.22,.72,1.16],[1.13,.85,1.03],[1,.69,1.22],[1.18,.83,1.12],[1,1,1],[1,1,1],[.60,1.30,.60]];
 const f=shapes[organ]||shapes[0];if(world===2&&organ===8)return [r*1.8,r*.53,r*1.5];if(world===1&&organ===2)return [r*2.1,r*.36,r*1.4];return f.map(x=>x*r) as V;
}
