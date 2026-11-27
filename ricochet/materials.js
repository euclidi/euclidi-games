// Analytic orthographic surface renderer. Each ellipsoid has real normals, diffuse
// lighting, specular response and environment reflection. Rendered into cached textures.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const norm=(a)=>{let l=Math.hypot(...a)||1;return a.map(x=>x/l)};
const rgb=h=>typeof h==="string"?[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]:h;
const dots=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const lights=[[-.65,-.78,1],[.35,-.85,1],[-.85,-.2,1],[.75,-.65,1],[.2,-.95,1]].map(norm);
export function model(w,h,objects,{light=lights[0],ambient=.32,glass=false}={}){
 const pixels=new Uint8ClampedArray(w*h*4),depth=new Float32Array(w*h).fill(-Infinity),half=norm([light[0],light[1],light[2]+1]);
 for(const ob of objects){let [cx,cy,cz,rx,ry,rz,color,metal=0]=ob;let base=rgb(color);
 for(let y=Math.max(0,Math.floor(cy-ry));y<Math.min(h,Math.ceil(cy+ry));y++)for(let x=Math.max(0,Math.floor(cx-rx));x<Math.min(w,Math.ceil(cx+rx));x++){
 let u=(x+.5-cx)/rx,v=(y+.5-cy)/ry,r2=u*u+v*v;if(r2>=1)continue;let k=Math.sqrt(1-r2),z=cz+rz*k,i=y*w+x;if(z<depth[i])continue;depth[i]=z;
 let n=norm([u/rx,v/ry,k/rz]),d=Math.max(0,dots(n,light)),spec=Math.pow(Math.max(0,dots(n,half)),metal>.5?68:30),rim=Math.pow(1-k,2.5),reflect=.5+.5*Math.sin(10*n[0]+6*n[1]),edge=Math.pow(Math.max(0,n[1]*.5+.5),3),window=Math.pow(Math.max(0,1-Math.abs(n[0]+.27)*7),2)*Math.pow(Math.max(0,1-Math.abs(n[1]+.32)*4),2);
 let shade=ambient+d*.75+edge*.10;let idx=i*4;for(let c=0;c<3;c++){let b=base[c],env=[198,220,237][c];let value=b*shade+(metal*.38+ (glass?.15:0))*reflect*(env-b*.45)+rim*(glass?70:25)+spec*(metal?225:160)+window*(metal?110:glass?125:20);if(glass)value+=Math.pow(Math.max(0,1-Math.abs(u+.15)-Math.abs(v-.35)),3)*b*.35;pixels[idx+c]=clamp(value,0,255)}pixels[idx+3]=255;
 }}
 return pixels
}
export function canvasModel(w,h,objects,opt){let c=document.createElement("canvas");c.width=w;c.height=h;let g=c.getContext("2d"),id=g.createImageData(w,h);id.data.set(model(w,h,objects,opt));g.putImageData(id,0,0);return c}
export const jewelColors={orange:"#e59028",blue:"#358fc4",green:"#4bab69",purple:"#ac65b8",hit:"#f2c77a"};
export function jewel(name,world=0,mark=false){let base=jewelColors[name],c=canvasModel(256,256,[[128,128,0,124,124,75,"#49382e",.72],[128,128,12,113,113,75,"#c2a575",.85],[128,128,40,104,104,97,base,.18]],{light:lights[world],glass:true});if(mark){let g=c.getContext("2d");g.font="bold 100px serif";g.textAlign="center";g.textBaseline="middle";g.strokeStyle="#25242d";g.lineWidth=9;g.fillStyle="#fff9df";let s={orange:"+",blue:"−",green:"I",purple:"✦"}[name]||"·";g.strokeText(s,128,135);g.fillText(s,128,135)}return c}
export function portrait(c){let o=[],add=(x,y,z,rx,ry,rz,col,m=0)=>o.push([x,y,z,rx,ry,rz,col,m]);let fur=c.color,skin=c.id==="opal"?"#d5a17e":fur;add(256,405,10,151,130,67,c.id==="cog"?"#b59459":"#344951",.2);add(256,336,30,83,52,40,"#d6bc81",.55);
 if(c.id==="finch"){add(150,126,3,50,103,35,fur);add(361,126,3,50,103,35,fur);add(150,125,13,27,69,18,"#e8b6a1");add(361,125,13,27,69,18,"#e8b6a1")}
 if(c.id==="moss"){add(146,154,20,55,56,35,fur);add(366,154,20,55,56,35,fur)}
 if(c.id==="pearl")for(let side of [-1,1])for(let j=0;j<3;j++)add(256+side*(122+j*15),150+j*50,8,45,22,19,"#c9779e");
 if(c.id==="ember")for(let i=0;i<5;i++)add(159+i*48,103+(i%2)*30,9,31,73,28,"#d87b38",.12);
 if(c.id==="orion"){add(160,109,5,48,62,24,fur);add(352,109,5,48,62,24,fur)}
 if(c.id==="cog"){add(256,93,9,15,67,14,"#9c7849",.8);add(256,42,18,24,24,22,"#88d1d4",.6);for(let x of [120,392])add(x,215,20,34,53,29,"#b49a60",.8)}
 if(c.id==="opal"){add(256,202,5,146,147,58,"#716d86");add(146,225,7,45,130,31,"#716d86");add(366,225,7,45,130,31,"#716d86")}
 add(256,221,25,134,124,91,skin,c.id==="cog"?.75:0);
 if(c.id==="finch"){add(205,269,95,55,48,37,"#e6c8a5");add(307,269,95,55,48,37,"#e6c8a5");add(256,277,129,22,16,14,"#302b30",.22)}
 if(c.id==="orion"){add(193,212,97,61,72,22,"#d6c8ac");add(319,212,97,61,72,22,"#d6c8ac");add(256,275,121,23,37,27,"#ce9955",.35)}
 for(let x of [202,310]){add(x,207,110,33,37,20,c.id==="cog"?"#81cccf":"#eee2cd",.15);add(x+3,210,128,16,23,12,"#29333c",.1);add(x-3,201,140,6,7,5,"#fff6dd",.4)}
 if(c.id!=="orion"&&c.id!=="finch")add(256,253,108,19,13,13,c.id==="cog"?"#927445":c.id==="opal"?"#c88c74":"#9f7168");
 add(256,354,84,31,27,12,"#d8b16b",.75);add(256,354,98,15,14,8,c.color,.4);
 return canvasModel(512,512,o,{light:lights[0],ambient:.41})
}
