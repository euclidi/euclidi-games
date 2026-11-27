import * as T from 'three';
// Seeded surface textures and purpose-built terrain meshes. The central locomotion
// region remains planar to match the authoritative collider.
const rand=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const noise=(x:number,y:number,s:number)=>Math.sin(x*1.71+y*2.19+s)*.42+Math.sin(x*4.13-y*3.61+s*.71)*.22+Math.sin(x*11.3+y*8.7+s*.13)*.13;
const palettes=[[0x746d48,0xa99b67,0x3c472e],[0x203b48,0x42616a,0x121e2a],[0x61503e,0xad9570,0x39251e],[0x53596d,0xa5acba,0x242a40],[0x47443c,0x989285,0x262522],[0x596548,0x9e9e67,0x3c473b]];
export function groundMaterial(id:number){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!,im=ctx.createImageData(256,256),rng=rand(8301+id*71),a=new T.Color(palettes[id][0]),b=new T.Color(palettes[id][1]),d=new T.Color(palettes[id][2]),m=new T.Color();
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const q=noise(x/16,y/16,id*9)+.11*(rng()-.5);
  let p=q;
  if(id===4){const seam=(x%64<2||y%64<2);p=seam?-.8:.12*noise(x/5,y/5,id)+.17*Math.sin(x*.3);}
  if(id===3)p+=.14*Math.sin((x+y)*.27);
  m.copy(a).lerp(q>0?b:d,Math.min(.95,Math.abs(p)));
  const j=(y*256+x)*4;im.data[j]=Math.round(T.MathUtils.clamp(m.r,0,1)**(1/2.2)*255);im.data[j+1]=Math.round(T.MathUtils.clamp(m.g,0,1)**(1/2.2)*255);im.data[j+2]=Math.round(T.MathUtils.clamp(m.b,0,1)**(1/2.2)*255);im.data[j+3]=255;
 }
 ctx.putImageData(im,0,0);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(3,3);map.anisotropy=4;
 return new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:id===4?.018:.035,roughness:id===1?.48:id===4?.49:.82,metalness:id===4?.36:0});
}
function stone(seed:number,r:number,height:number){
 const g=new T.IcosahedronGeometry(1,3),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),v=1+.20*noise(x*3+z,y*3,seed);p.setXYZ(i,x*r*v,y*height*v,z*r*v*(.85+.13*Math.sin(seed)));}
 g.computeVertexNormals();return g;
}
function crystal(r:number,h:number,twist:number){
 const v:number[]=[],f:number[]=[],n=6;for(let j=0;j<3;j++){const rad=r*[.75,1,.7][j],y=h*[0,.18,.78][j];for(let i=0;i<n;i++){const a=i*Math.PI/3+j*.035+twist;v.push(rad*Math.cos(a),y,rad*Math.sin(a));}}
 v.push(r*.14,h,-r*.13);for(let j=0;j<2;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=(j+1)*n+(i+1)%n,d=(j+1)*n+i;f.push(a,b,d,b,c,d);}for(let i=0;i<n;i++)f.push(2*n+i,2*n+(i+1)%n,3*n);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();return g.toNonIndexed();
}
export function makeTerrain(id:number,group:T.Group){
 const rng=rand(1727+id*511),p=palettes[id];
 const material=(c:number,rough=.7,metal=0)=>new T.MeshStandardMaterial({color:c,roughness:rough,metalness:metal});
 const put=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;};
 const path=(pts:T.Vector3[],r:number,m:T.Material)=>put(new T.TubeGeometry(new T.CatmullRomCurve3(pts),Math.max(8,pts.length*5),r,7,false),m,0,0,0);
 const rock=material(p[2]),sand=material(p[1]),accent=material(p[0]),stem=material(id===2?0xbfae8b:id===1?0x597f86:0x778454);
 const rim=put(new T.TorusGeometry(3.34,.035,8,128),material(0x77756b,.38,.46),0,-.015,0);rim.rotation.x=-Math.PI/2;
 // Composed clusters leave the center and foreground clear for the creature.
 const clusters=[[-2.2,-1.75],[1.9,-2.0],[-2.7,.65],[2.65,.35],[.2,-2.9]];
 for(let k=0;k<clusters.length;k++){const [cx,cz]=clusters[k];
  if(id===4){
   const pad=put(new T.BoxGeometry(.75,.08,.62),material(0x474b4a,.38,.68),cx,.035,cz);pad.rotation.y=k*.72;
   for(let j=0;j<3;j++){const x=cx+(j-1)*.18,z=cz+.14*Math.sin(j);put(new T.CylinderGeometry(.085,.12,.17+j*.07,24),material(0x9e8e6f,.28,.74),x,.12+j*.03,z);put(new T.TorusGeometry(.083,.018,8,20),material(0x292a27,.55,.6),x,.22+j*.06,z).rotation.x=Math.PI/2;}
   path([new T.Vector3(cx,.08,cz),new T.Vector3(cx*.9,.09,cz*.95),new T.Vector3(cx*.75,.05,cz*.9)],.035,material(0x8e654b,.45,.5));
   continue;
  }
  for(let j=0;j<4;j++){const x=cx+(rng()-.5)*.55,z=cz+(rng()-.5)*.52;
   if(id===3){const h=.16+rng()*.48;const ob=put(crystal(.09+rng()*.15,h,rng()*6),material(j%2?0x9faebd:0x71829b,.26,.16),x,0,z);ob.rotation.z=(rng()-.5)*.25;}
   else{const rad=.10+rng()*.23,h=.07+rng()*.15;const ob=put(stone(k*11+j,rad,h),j%2?rock:accent,x,h*.4,z);ob.rotation.y=rng()*6;}
  }
  if(id===2||id===1||id===5){
   for(let j=0;j<5;j++){const x=cx+(rng()-.5)*.50,z=cz+(rng()-.5)*.46,h=.16+rng()*.38;
    const top=new T.Vector3(x+(rng()-.5)*.12,h,z+(rng()-.5)*.12);
    path([new T.Vector3(x,0,z),new T.Vector3(x+.03,h*.5,z),top],.018+(.012*rng()),stem);
    if(id===2){const g=new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.10,0),new T.Vector2(.14,.035),new T.Vector2(.11,.08),new T.Vector2(.05,.10),new T.Vector2(0,.102)],32);put(g,material(j%2?0xbe9465:0x886f4e,.63),top.x,top.y,top.z);}
    else if(id===1){const g=new T.LatheGeometry([new T.Vector2(.025,0),new T.Vector2(.027,.09),new T.Vector2(.07,.15),new T.Vector2(.045,.17)],24);put(g,material(0x789ba1,.36),top.x,top.y-.05,top.z);}
    else{for(let l=0;l<4;l++){const a=l*Math.PI/2+j;path([top,new T.Vector3(top.x+Math.cos(a)*.07,top.y+.03,top.z+Math.sin(a)*.07),new T.Vector3(top.x+Math.cos(a)*.12,top.y+.09,top.z+Math.sin(a)*.12)],.019,material(0xa68c65,.49));}}
   }
  }else if(id===0){
   for(let j=0;j<6;j++){const x=cx+(rng()-.5)*.65,z=cz+(rng()-.5)*.55;const h=.06+rng()*.18;const a=rng()*6.28;
    path([new T.Vector3(x,0,z),new T.Vector3(x+Math.cos(a)*h*.55,h*.6,z+Math.sin(a)*h*.55),new T.Vector3(x+Math.cos(a)*h,h*.86,z+Math.sin(a)*h)],.012,stem);}
  }
 }
 // Small flat sediment details have no misleading collision silhouettes.
 for(let j=0;j<80;j++){const a=rng()*Math.PI*2,r=1.45+rng()*1.77;const x=Math.cos(a)*r,z=Math.sin(a)*r;put(stone(j,.018+rng()*.043,.005+rng()*.011),j%3?sand:rock,x,.003,z);}
}
export function skinTexture(){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!,im=ctx.createImageData(256,256),rng=rand(117);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const k=(y*256+x)*4,v=Math.round(208+22*noise(x/13,y/13,9)+11*(rng()-.5));im.data[k]=im.data[k+1]=im.data[k+2]=v;im.data[k+3]=255;}
 ctx.putImageData(im,0,0);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);return t;
}
