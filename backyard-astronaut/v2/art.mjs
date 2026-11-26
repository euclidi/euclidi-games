import * as T from 'three';
// Original raster cross-section models. Each slice is a material-indexed bitmap.
// Generate exposed faces from the volume, including vertical sides; no gaps.
const colors=['#000000','#202b2d','#354342','#52605b','#73837b','#a1ab9b','#c8cbb8','#e0d7b7','#33434b','#46646d','#71969c','#bdd5ce','#4c3f33','#785b44','#ab754b','#cf985e','#e6c58a','#57413b','#8f5849','#ba805e','#dfaa83','#2c4943','#4f7368','#83a18a','#b3bda2','#35482e','#4e683b','#6e8646','#8fa253','#b2b675','#453a30','#76634b','#a28a65','#c4b28c','#423b38','#74483b','#a96349','#d39763','#d8ba62','#535d64','#7e8a89','#b9beb0','#e0dfcb','#783f32','#ba5741'];
function hash(x,y,z,s=0){let n=Math.imul(x+13,73856093)^Math.imul(y+29,19349663)^Math.imul(z+7,83492791)^Math.imul(s+3,2654435761);return ((n^(n>>>13))>>>0)/4294967296}
const sq=x=>x*x, band=(x,c,r)=>Math.abs(x-c)<r, rect=(x,z,a,b)=>Math.abs(x)<a&&Math.abs(z)<b, ell=(x,y,z,a,b,c,rx,ry,rz)=>sq((x-a)/rx)+sq((y-b)/ry)+sq((z-c)/rz)<1;
function voxel(k,x,y,z,N){const u=(x+.5)/N*2-1,v=(z+.5)/N*2-1,h=(y+.5)/N,r=Math.hypot(u,v),a=(Math.atan2(v,u)+Math.PI)/(2*Math.PI),sector=Math.floor(a*12),seam=a*12%1<.04,wear=hash(x>>1,y>>1,z>>1)<.09?1:0;
if(k==='capsule'){
let rad=h<.13?.77:h<.27?.77+(h-.13):h<.72?.91:h<.94?.91-(h-.72)*2.15:.40;
if(h>.16&&h<.73&&band(Math.abs(u),.81,.09)&&Math.abs(v)<.28)return band(h,.22,.025)||band(h,.65,.025)?6:3;
if(h>.24&&h<.29&&r<.97&&r>.82)return 3;
if(r>=rad)return 0;if(h<.075)return 1;if(h<.13||band(h,.28,.024)||band(h,.73,.021))return r>rad-.13?3:4;
if(h>.39&&h<.71&&v<-.32&&r>rad-.18&&Math.abs(u)<.57){let p=sq(u/.57)+sq((h-.55)/.16);if(p<1){if(p>.76)return 1;if(p>.60)return 6;return u<-.21&&h>.53||h>.64&&u<.22?11:h<.47?8:9}}
if(v>.34&&r>rad-.13&&Math.abs(u)<.45&&h>.31&&h<.66){if(band(h,.33,.022)||band(h,.64,.022)||band(Math.abs(u),.43,.05))return 2;if(band(u,.28,.055)&&band(h,.47,.025))return 7;return 4}
if(r>rad-.10){if(seam)return 3;if((band(h,.31,.018)||band(h,.69,.018))&&a*24%1<.15)return 7;if(sector===5&&h<.36)return 14;return (sector===2||sector===8?4:5)+wear}return 4}
if(k==='engine'){
let rad=h<.32?.94-h*.95:h<.55?.62:h<.79?.75:.87;
if(h>.26&&h<.82&&band(Math.abs(u),.68,.11)&&Math.abs(v)<.13)return band(h,.40,.03)||band(h,.72,.03)?16:13;
if(h>.40&&h<.76&&band(Math.abs(v),.70,.10)&&Math.abs(u)<.10)return 15;
if(r>=rad||h<.35&&r<Math.max(.18,rad-.19))return 0;
if(h<.055)return 2;if(band(h,.11,.018)||band(h,.28,.022)||band(h,.56,.028)||band(h,.82,.035))return 6;
if(h>.85&&h<.96&&r>rad-.19&&a*8%1<.24)return 7;if(h>.58&&h<.78&&r>rad-.19&&a*16%1<.23)return 3;
return r>rad-.11&&h<.28?h<.13?17:18:h>.85?3:4+wear}
if(k==='tank'){
let rad=.84*Math.sqrt(Math.max(0,1-sq(Math.max(0,Math.abs(h-.48)-.31)/.18)));
if(h>.82&&h<.94&&rect(u,v,.26,.23))return h>.90?6:3;if(h>.92&&h<.99&&rect(u,v-.02,.42,.10))return 44;
if(band(Math.abs(u),.77,.12)&&Math.abs(v)<.36&&h>.20&&h<.73)return band(h,.22,.025)||band(h,.70,.025)?6:3;
if(r>=rad)return 0;if(h<.10)return 3;if(band(h,.19,.025)||band(h,.73,.025))return r>rad-.20?3:4;
if(r>rad-.12&&v<-.4&&Math.abs(u)<.46&&h>.35&&h<.60){if(h<.39||h>.56)return 3;if(h>.47&&h<.52)return x%6<3?38:2;return 42}
return r>rad-.12&&(seam||band(h,.78,.018))?13:(sector===3?13:14)+wear}
if(k==='battery'){if(h>.84){if(ell(u,h,v,-.52,.9,-.36,.18,.09,.20))return 44;if(ell(u,h,v,.52,.9,-.36,.18,.09,.20))return 6;if(h>.90&&h<.94&&Math.abs(u)<.48&&Math.abs(v-.46)<.12)return 3;return 0}if(!rect(u,v,.91,.87)||Math.abs(u)+Math.abs(v)>1.66)return 0;if(h<.1||h>.73)return 2;if(band(h,.17,.018))return 6;if(v<-.73&&Math.abs(u)<.66&&h>.30&&h<.61)return h>.49&&h<.54?1:38;return Math.abs(v)>.75&&x%7===0?21:22+wear}
if(k==='fin'){let l=-.82+.45*h,b=.93-.95*h;if(h>.92||u<l||u>b||Math.abs(v)>.12+(1-h)*.15)return 0;if(h<.15||band(u,l,.08)||band(u,b,.065))return 3;return band(h,.25,.018)||band(h,.61,.018)||band(u,(l+b)/2,.045)?5:h>.70&&u>0?14:6+wear}
if(k==='antenna'){if(h<.12&&r<.55)return h<.04?2:4;if(h<.67&&r<.13)return h<.23||band(h,.54,.025)?3:5;if(r<.89&&Math.abs(h-(.59+sq(r)*.23))<.037)return r>.79?3:a*8%1<.10?4:6;if(h>.62&&h<.92&&r<.07)return 5;return ell(u,h,v,0,.94,0,.15,.035,.15)?16:0}
if(k==='torso'){let shoulder=.90-.40*Math.max(0,(h-.74)/.26),waist=.64+.24*h;if(Math.abs(u)>Math.min(shoulder,waist)||Math.abs(v)>.66||Math.abs(u)+Math.abs(v)>1.35)return 0;if(h<.12)return 12;if(v<-.45&&band(u,-.32,.12)&&h>.46&&h<.67)return 23;if(v<-.45&&band(u,.04,.05))return 21;if(v>.45&&h>.18&&h<.79)return Math.abs(u)<.46?13:21;if(h>.86&&Math.abs(u)<.24)return 19;return 22+wear}
if(k==='head'){if(!ell(u,h,v,0,.50,0,.88,.51,.85))return 0;if(h>.74||v>.30&&h>.26||Math.abs(u)>.70&&h>.42)return 12;if(v<-.40&&h>.45&&h<.56&&band(Math.abs(u),.37,.12))return 1;if(v<-.46&&h>.20&&h<.25&&Math.abs(u)<.27)return 18;if(v<-.50&&h>.32&&h<.45&&Math.abs(u)<.13)return 20;return h>.60?20:19}
if(k==='arm')return ell(u,h,v,0,.51,0,.78,.56,.75)?h<.22?19:h<.35?21:22+wear:0;
if(k==='leg'){if(h<.18&&Math.abs(u)<.87&&v>-.92&&v<.61)return h<.05?1:12;if(!rect(u,v,.71,.66))return 0;return h<.23?12:h>.60&&v<-.45&&band(h,.72,.07)?39:8+wear}
if(k.startsWith('tree')){let s=+k.slice(4)||0,sx=.13*Math.sin(h*7+s),sz=.09*Math.sin(h*8+s*2),trunk=Math.hypot(u-sx,v-sz)<.12-.05*h&&h<.76;for(let j=0;j<5;j++){let t=(h-.29-j*.045)/.28,aa=j*2.399+s;if(t>0&&t<1&&Math.hypot(u-sx-Math.cos(aa)*t*.45,v-sz-Math.sin(aa)*t*.45)<.045)trunk=true}let f=0;for(let j=0;j<13;j++){let aa=j*2.399+s*.9,cy=.55+.36*j/12,rr=j>8?.24:.46;f=Math.max(f,1-sq((u-Math.cos(aa)*rr)/(.31+(j%3)*.035))-sq((v-Math.sin(aa)*rr)/(.32+(j%2)*.045))-sq((h-cy)/(.15+(j%4)*.012)))}if(f>.06+hash(x>>1,y>>1,z>>1,s)*.15)return (h>.80?28:h>.62?27:26)+(hash(x>>2,y>>2,z>>2,s)<.23?1:0);return trunk?31+wear:0}
if(k==='shrub')return ell(u,h,v,-.4,.36,.1,.52,.36,.65)||ell(u,h,v,.4,.48,-.12,.57,.47,.66)||ell(u,h,v,0,.72,.1,.56,.25,.55)?h>.6?27+wear:26+wear:0;
if(k==='crate'){if(!rect(u,v,.94,.94)||h>.95)return 0;if(h<.1||h>.84||Math.abs(u)>.78&&Math.abs(v)>.78)return 31;if(band(h,.33,.018)||band(h,.65,.018))return 30;return Math.abs(u)>.83||Math.abs(v)>.83?32+wear:31}
if(k==='toolbox'){if(h>.80)return h<.97&&Math.abs(u)<.45&&Math.abs(v)<.17&&(h>.91||Math.abs(u)>.31)?3:0;if(!rect(u,v,.94,.82))return 0;if(h<.12||h>.73)return 2;if(v<-.7&&band(Math.abs(u),.55,.12)&&h>.62)return 6;return 43+wear}
if(k==='tire')return r>.94||r<.48||h<.10||h>.85?0:r<.58?39:r>.82&&Math.floor(a*36+h*5)%3===0?2:1;
return 0}
export function volume(kind,N=44){const data=new Uint8Array(N*N*N);for(let y=0;y<N;y++)for(let z=0;z<N;z++)for(let x=0;x<N;x++)data[(y*N+z)*N+x]=voxel(kind,x,y,z,N);return {data,N}}
const cache=new Map(),mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.88});
function surface(kind,N){const {data}=volume(kind,N),at=(x,y,z)=>x<0||y<0||z<0||x>=N||y>=N||z>=N?0:data[(y*N+z)*N+x],pos=[],norm=[],cols=[],idx=[],pal=colors.map(c=>new T.Color(c));let faces=0;
for(let a=0;a<3;a++){let b=(a+1)%3,c=(a+2)%3;for(let sign of [-1,1])for(let k=0;k<N;k++){let mask=new Uint8Array(N*N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){let p=[0,0,0];p[a]=k;p[b]=i;p[c]=j;let color=at(...p);p[a]+=sign;if(color&&!at(...p))mask[j*N+i]=color}
for(let j=0;j<N;j++)for(let i=0;i<N;){let color=mask[j*N+i];if(!color){i++;continue}let w=1,h=1;while(i+w<N&&mask[j*N+i+w]===color)w++;outer:while(j+h<N){for(let x=0;x<w;x++)if(mask[(j+h)*N+i+x]!==color)break outer;h++}for(let y=0;y<h;y++)mask.fill(0,(j+y)*N+i,(j+y)*N+i+w);let o=pos.length/3,n=[0,0,0];n[a]=sign;let col=pal[color];for(let [db,dc] of [[0,0],[w,0],[w,h],[0,h]]){let p=[0,0,0];p[a]=k+(sign>0?1:0);p[b]=i+db;p[c]=j+dc;pos.push(p[0]/N-.5,p[1]/N,p[2]/N-.5);norm.push(...n);cols.push(col.r,col.g,col.b)}if(sign>0)idx.push(o,o+1,o+2,o,o+2,o+3);else idx.push(o,o+2,o+1,o,o+3,o+2);faces++;i+=w}}}
const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));g.setAttribute('color',new T.Float32BufferAttribute(cols,3));g.setIndex(idx);g.computeBoundingSphere();g.userData={kind,N,faces,occupied:data.reduce((n,v)=>n+(v?1:0),0)};return g}
function shape(k,w,h,d){let N=k.startsWith('tree')?48:['head','arm','leg','shrub'].includes(k)?32:44,key=k+':'+N;if(!cache.has(key))cache.set(key,surface(k,N));let m=new T.Mesh(cache.get(key),mat);m.scale.set(w,h,d);m.castShadow=m.receiveShadow=true;return m}
export function stack(k,w,h,d){let g=new T.Group();if(k!=='person'){g.add(shape(k,w,h,d));return g}const p={};function limb(n,k,x,y,z,sx,sy,sz,pivot){let joint=new T.Group();joint.position.set(x*w,y*h,z*d);let m=shape(k,sx*w,sy*h,sz*d);m.position.y=-pivot*sy*h;joint.add(m);g.add(joint);p[n]=joint}limb('body','torso',0,.43,0,.68,.35,.66,0);limb('head','head',0,.76,0,.53,.24,.75,0);limb('ll','leg',-.17,.45,0,.30,.45,.58,1);limb('rl','leg',.17,.45,0,.30,.45,.58,1);limb('la','arm',-.42,.73,0,.25,.37,.42,1);limb('ra','arm',.42,.73,0,.25,.37,.42,1);g.userData.limbs=p;return g}
export function animatePerson(g,phase,speed,carrying){let p=g.userData.limbs;if(!p)return;let a=Math.sin(phase)*Math.min(.56,speed*.12);p.ll.rotation.x=a;p.rl.rotation.x=-a;p.la.rotation.x=carrying?-1.15:-a*.65;p.ra.rotation.x=carrying?-1.15:a*.65;p.body.rotation.z=Math.sin(phase)*Math.min(.035,speed*.006)}
export function artStats(){return [...cache.values()].map(g=>g.userData)}
export function texture(w,h,fn){let c=document.createElement('canvas');c.width=w;c.height=h;let g=c.getContext('2d');for(let y=0;y<h;y++)for(let x=0;x<w;x++){g.fillStyle=fn(x,y);g.fillRect(x,y,1,1)}let t=new T.CanvasTexture(c);t.magFilter=T.NearestFilter;t.minFilter=T.NearestMipmapNearestFilter;t.colorSpace=T.SRGBColorSpace;return t}
export function material(tex){return new T.MeshStandardMaterial({map:tex,roughness:.94})}
export function groundTexture(){return texture(128,128,(x,y)=>{let a=hash(x>>3,y>>3,0),b=hash(x,y,3);return a<.10?'#80774e':a<.26?'#657643':b<.13?'#a0a36a':b<.26?'#576c3f':a<.66?'#829259':'#71864e'})}
export function woodTexture(){return texture(64,64,(x,y)=>{let p=y>>3,n=hash(x>>3,y,8);return y%8===0?'#5f5944':y%8===1?'#b4a280':(x+p%3*19)%64===0?'#76674e':n<.14?'#877a5b':n>.86?'#b8a17d':'#a49672'})}
export function roofTexture(){return texture(64,64,(x,y)=>{let z=(x+((y>>3)%2)*8)%16,n=hash(x>>2,y>>1,1);return y%8===0||z===0?'#423a36':y%8===1||z===1?'#8d7764':n<.22?'#5f5049':n>.8?'#897361':'#716056'})}
export function roadTexture(){return texture(128,128,(x,y)=>{let n=hash(x,y,2);return n<.07?'#424747':n>.92?'#898982':n>.65?'#696d69':'#575d59'})}
export function planetTexture(){return texture(512,256,(x,y)=>{let lat=(y/256-.5)*Math.PI,lon=x/512*Math.PI*2,n=Math.sin(lon*3+Math.cos(lat*5))*Math.cos(lat*4)+.5*Math.sin(lon*9-lat*6)+.18*Math.cos(lon*21+lat*19)+.07*Math.sin(lon*53+lat*31);return Math.abs(lat)>1.30-.05*Math.cos(lon*8)?'#dae1cb':n>.27?Math.abs(lat)<.35&&n>.67?'#b0a16b':n>.93?'#91907e':n>.63?'#536e48':'#778c56':n>.13?'#51909b':n>-.2?'#3c7286':'#2f5c78'})}
