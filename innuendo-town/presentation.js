// Innuendo Town: native-resolution bitmap presentation.
// Original pixel artwork for the town's architectural and actor gaps.
// Reuses the licensed Kenney atlas for vegetation and decorative sprites.
// Never scale or rotate independently cropped vehicle fragments.
import {characterFrame} from './sprite-art.js?v=051';
export const ART_VERSION='070';
const T=16;
const C={ink:'#25292f',road:'#42464d',roadEdge:'#353a42',roadLit:'#4c5158',roadGrain:'#565a60',curb:'#a6a69b',curbLit:'#c5c0ac',curbShade:'#6c716c',pave:'#9a9788',paveShade:'#858376',paveLit:'#ada99a',grass:'#596c51',grass2:'#667957',grass3:'#4c604b',soil:'#665c49',shadow:'#293337',window:'#263d46',glass:'#506a70',glint:'#94b1ac',light:'#f4d2a0',steel:'#738181',steel2:'#49575a',wood:'#91694d',wood2:'#624a3e'};
const B=[
 {wall:'#aa7764',shade:'#80574e',roof:'#76504e',roofHi:'#94665b',trim:'#d0b697',accent:'#93494b',sign:'#f2dfbd',type:'deli',awning:true},
 {wall:'#8e9490',shade:'#646d70',roof:'#535f69',roofHi:'#687781',trim:'#b0b8ac',accent:'#385964',sign:'#d6e5d5',type:'gym'},
 {wall:'#b69d76',shade:'#8e795e',roof:'#826f55',roofHi:'#a08a67',trim:'#d1bca0',accent:'#535e4a',sign:'#ead5a9',type:'book',awning:true},
 {wall:'#939b8b',shade:'#66766e',roof:'#5b6b63',roofHi:'#73867a',trim:'#b4b8a2',accent:'#406d73',sign:'#dfdfc5',type:'pipe'},
 {wall:'#a58a65',shade:'#76654d',roof:'#725846',roofHi:'#907258',trim:'#c9b598',accent:'#785c3a',sign:'#e9d0a2',type:'wood'},
 {wall:'#9aa7a1',shade:'#667b7b',roof:'#506c74',roofHi:'#729399',trim:'#c9d1bb',accent:'#416e6d',sign:'#e3e7c8',type:'wash'},
 {wall:'#b0a298',shade:'#84766d',roof:'#6d6268',roofHi:'#92818a',trim:'#d6c4ae',accent:'#755367',sign:'#eddbc5',type:'gallery',awning:true},
 {wall:'#8a818b',shade:'#615965',roof:'#4c4857',roofHi:'#6e6175',trim:'#b2a6a1',accent:'#674451',sign:'#f1c8a3',type:'club'}
];
const FONT={
 A:['01110','11011','11011','11111','11011','11011','11011'],B:['11110','11011','11011','11110','11011','11011','11110'],C:['01111','11000','11000','11000','11000','11000','01111'],D:['11110','11011','11011','11011','11011','11011','11110'],E:['11111','11000','11000','11110','11000','11000','11111'],F:['11111','11000','11000','11110','11000','11000','11000'],G:['01111','11000','11000','11011','11011','11011','01111'],H:['11011','11011','11011','11111','11011','11011','11011'],I:['111','010','010','010','010','010','111'],J:['00111','00011','00011','00011','11011','11011','01110'],K:['11011','11011','11110','11100','11110','11011','11011'],L:['11000','11000','11000','11000','11000','11000','11111'],M:['11011','11111','11111','11011','11011','11011','11011'],N:['11011','11111','11111','11111','11011','11011','11011'],O:['01110','11011','11011','11011','11011','11011','01110'],P:['11110','11011','11011','11110','11000','11000','11000'],Q:['01110','11011','11011','11011','11011','01110','00011'],R:['11110','11011','11011','11110','11100','11010','11011'],S:['01111','11000','11000','01110','00011','00011','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['11011','11011','11011','11011','11011','11011','01110'],V:['11011','11011','11011','11011','11011','01010','00100'],W:['11011','11011','11011','11011','11111','11111','01010'],X:['11011','11011','01010','00100','01010','11011','11011'],Y:['11011','11011','01010','00100','00100','00100','00100'],Z:['11111','00011','00110','01100','11000','11000','11111'],'&':['01100','10010','10100','01000','10101','10010','01101'],'.':['0','0','0','0','0','0','1'],' ':['000','000','000','000','000','000','000'],'-':['000','000','000','111','000','000','000'],'1':['010','110','010','010','010','010','111'],'2':['01110','10001','00001','00110','01000','10000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'4':['10010','10010','10010','11111','00010','00010','00010'],'5':['11111','10000','10000','11110','00001','00001','11110'],'6':['01111','10000','10000','11110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],'8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00001','11110'],'0':['01110','10001','10011','10101','11001','10001','01110']};
function rect(c,x,y,w,h,col){if(w<=0||h<=0)return;c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function seed(x,y=0,k=0){let a=Math.imul(x+137,374761393)^Math.imul(y+17,668265263)^Math.imul(k+1,144664877);a=Math.imul(a^(a>>>13),1274126177);return ((a^(a>>>16))>>>0)/4294967296}
function width(s){return [...s.toUpperCase()].reduce((n,ch)=>n+(FONT[ch]||FONT[' '])[0].length+1,-1)}
function text(c,s,x,y,col,center=true){s=s.toUpperCase();if(center)x-=Math.floor(width(s)/2);for(const ch of s){const a=FONT[ch]||FONT[' '];a.forEach((row,j)=>{for(let i=0;i<row.length;i++)if(row[i]==='1')rect(c,x+i,y+j,1,1,col)});x+=a[0].length+1}}
function cluster(c,x,y,rows,pal,flip=false){for(let j=0;j<rows.length;j++){const row=rows[j];for(let i=0;i<row.length;i++){const color=pal[row[i]];if(color)rect(c,x+(flip?row.length-1-i:i),y+j,1,1,color)}}}
function texture(scene,key,w,h,paint){const old=scene.textures.get(key);if(old&&old.key===key)return old;let tex=scene.textures.createCanvas(key,w,h),c=tex.getContext();c.imageSmoothingEnabled=false;paint(c);tex.refresh();tex.setFilter(Phaser.Textures.FilterMode.NEAREST);return tex}
function noise(c,x,y,w,h,colors,count,k=0){for(let i=0;i<count;i++){let xx=x+Math.floor(seed(i,k,7)*w),yy=y+Math.floor(seed(i,k,19)*h);rect(c,xx,yy,1+(i%13===0?1:0),1,colors[i%colors.length])}}
function glass(c,x,y,w,h,lit=false){
 rect(c,x-2,y-2,w+4,h+4,'#393b3d');rect(c,x-1,y-1,w+2,h+2,'#a49b85');rect(c,x,y,w,h,lit?'#8e7257':C.window);
 rect(c,x+1,y+1,w-2,h-2,lit?'#b59a69':C.glass);
 rect(c,x+1,y+1,w-2,2,lit?'#e6c891':'#89a4a2');
 rect(c,x+w-3,y+3,1,h-5,lit?'#957753':'#799195');
 rect(c,x+Math.floor(w/2),y,2,h,'#3c4a4d');rect(c,x,y+h-3,w,2,'#3a494e');
 rect(c,x-2,y+h+1,w+4,2,'#d1bea0');rect(c,x-1,y+h+3,w+2,1,'#666457');
}
function vent(c,x,y,w=18,h=11){
 rect(c,x+3,y+3,w,h,'#393d3b');rect(c,x,y,w,h,'#353f43');rect(c,x+1,y+1,w-2,h-2,'#87908a');
 for(let yy=2;yy<h-1;yy+=2){rect(c,x+3,y+yy,w-6,1,'#4c5c5b');rect(c,x+3,y+yy+1,w-6,1,'#a3a99d')}
 rect(c,x+1,y+1,w-2,1,'#c0bdb0');
}
function planter(c,x,y,w=28){
 rect(c,x+2,y+5,w,10,'#6d7064');rect(c,x,y,w,10,'#857d6d');rect(c,x+1,y+1,w-2,7,'#554f42');
 for(let i=2;i<w-2;i+=3){let j=Math.floor(seed(i,x,y)*3);rect(c,x+i,y+1+j,3,4,['#576d4e','#82946b','#a6ad78'][i%3]);rect(c,x+i+1,y+j,1,1,i%2?'#b1a36f':'#c6956e')}
 rect(c,x,y+8,w,2,'#b3a88f');rect(c,x+1,y+10,w-2,2,'#716d5c')
}
function manhole(c,x,y){cluster(c,x,y,['..oooo..','.osssso.','osdssdso','osssdsso','osdssdso','.osssso.','..oooo..'],{o:'#30383d',s:'#727777',d:'#4e5559'})}
function lamp(c,x,y){
 rect(c,x+1,y+16,17,3,'#6b6b5e');rect(c,x+1,y+4,3,14,'#383f40');rect(c,x+2,y+5,1,12,'#81877d');
 cluster(c,x-3,y-2,['..oooo..','.ohhhho.','ohhhhhoo','ooooooo.','..oo....'],{o:'#3b4241',h:'#e7d5a2'});rect(c,x-1,y+18,7,2,'#505b58');
}
function bench(c,x,y){rect(c,x+1,y+7,29,4,'#777565');rect(c,x+2,y,25,3,'#54483b');rect(c,x+3,y+1,23,1,'#b38b60');rect(c,x+2,y+4,25,4,'#785b42');rect(c,x+3,y+4,23,1,'#c6a06d');rect(c,x+3,y+8,2,3,'#3f4946');rect(c,x+24,y+8,2,3,'#3f4946')}
function hydrant(c,x,y){cluster(c,x,y,['..ooo..','.orhro.','orhhHro','.orhro.','oorhroo','orhhhro','.orrro.','.ooooo.'],{o:'#53413b',r:'#9b4f48',h:'#c46e58',H:'#dca579'})}
function tree(c,atlas,x,y,variant=0){
 // Recolour the whole original two-tile tree, retaining all silhouette pixels.
 const temp=document.createElement('canvas');temp.width=16;temp.height=32;const tc=temp.getContext('2d',{willReadFrequently:true});tc.imageSmoothingEnabled=false;
 tc.drawImage(atlas,16*16,8*16,16,32,0,0,16,32);let im=tc.getImageData(0,0,16,32),a=im.data;
 for(let i=0;i<a.length;i+=4){if(!a[i+3])continue;let r=a[i],g=a[i+1],b=a[i+2];if(g>r*1.1&&g>b*.83){const l=Math.max(r,g,b);a[i]=Math.round(l*.52);a[i+1]=Math.round(l*.69);a[i+2]=Math.round(l*.43)}else if(b>r*1.35&&g>r*1.3){const l=Math.max(g,b);a[i]=Math.round(l*.47);a[i+1]=Math.round(l*.68);a[i+2]=Math.round(l*.44)}else{a[i]=Math.round(r*.84);a[i+1]=Math.round(g*.82);a[i+2]=Math.round(b*.8)}}
 tc.putImageData(im,0,0);rect(c,x+3,y+24,15,4,'#55614e');rect(c,x+6,y+27,8,2,'#4a5848');c.drawImage(temp,x,y);
}
function sign(c,x,y,w,name,f){
 const tw=Math.min(w-12,width(name)+12),left=Math.floor(x+(w-tw)/2);
 rect(c,left-1,y-1,tw+2,13,'#3e3d38');rect(c,left,y,tw,11,f.accent);rect(c,left+1,y+1,tw-2,1,f.trim);
 rect(c,left+1,y+10,tw-2,1,f.shade);text(c,name,x+w/2,y+2,f.sign)
}
function roof(c,x,y,w,h,f,id){
 rect(c,x+4,y+5,w,h,'#3c4744');rect(c,x,y,w,h,C.ink);rect(c,x+2,y+2,w-4,h-4,f.roof);
 const metal=f.type==='gym'||f.type==='wash'||f.type==='pipe';
 if(metal){for(let xx=x+5;xx<x+w-4;xx+=11){rect(c,xx,y+5,1,h-10,f.roofHi);rect(c,xx+1,y+5,1,h-10,'#4d5558')}}else{
 for(let yy=y+5;yy<y+h-5;yy+=7){rect(c,x+4,yy,w-8,1,f.shade);for(let xx=x+5+((yy-y)%14?7:0);xx<x+w-6;xx+=15){rect(c,xx,yy+1,1,6,f.shade);rect(c,xx+1,yy+1,Math.min(11,x+w-5-xx),1,f.roofHi)}}}
 noise(c,x+5,y+4,w-10,h-8,[f.roofHi,f.shade],Math.floor(w*h/210),id+100);
 rect(c,x+1,y+1,w-2,3,f.trim);rect(c,x+1,y+4,w-2,1,f.shade);rect(c,x+1,y+4,3,h-5,f.trim);rect(c,x+w-4,y+4,3,h-5,f.shade);
 rect(c,x+4,y+h-5,w-8,3,f.shade);rect(c,x+3,y+h-3,w-6,2,'#353c3d');
 if(id%3!==2){vent(c,x+14,y+12,22,14);if(w>145)vent(c,x+w-41,y+14,23,13)}else{rect(c,x+12,y+11,22,18,'#4b4f4e');rect(c,x+14,y+13,18,14,'#6e8586');rect(c,x+15,y+14,16,2,'#abbab0');rect(c,x+22,y+13,2,14,'#465b5b')}
 if(id===5){vent(c,x+w-42,y+36,28,18)}
 if(id===4||id===0){rect(c,x+w-18,y+7,9,18,'#483b34');rect(c,x+w-17,y+7,7,5,'#92725a');rect(c,x+w-17,y+13,3,10,'#b79b75')}
}
function building(c,b){
 const f=B[b.id],x=b.x*T,y=b.y*T,w=b.w*T,h=b.h*T,face=y+h-39,roofH=h-39;
 rect(c,x+5,y+9,w+4,h+8,'#667068');rect(c,x+6,y+h,w,7,'#74786e');
 roof(c,x,y,w,roofH,f,b.id);
 rect(c,x,y+roofH,w,39,C.ink);rect(c,x+1,face+1,w-2,37,f.wall);
 for(let yy=face+5;yy<face+37;yy+=6){
  rect(c,x+2,yy,w-4,1,f.shade);if(f.type!=='gym'&&f.type!=='wash')for(let xx=x+3+((yy-face)%12?8:0);xx<x+w-3;xx+=17)rect(c,xx,yy+1,1,5,f.shade)
 }
 rect(c,x+2,face+2,w-4,2,f.trim);rect(c,x+2,face+34,w-4,3,f.shade);rect(c,x+2,face+37,w-4,1,f.trim);
 let center=x+Math.floor(b.w/2)*T+8;
 if(f.type==='wash'||f.type==='wood'||f.type==='pipe'){
  let bw=35,xx=x+9;for(;xx<x+w-45;xx+=47){if(Math.abs(xx+bw/2-center)<24)continue;
   rect(c,xx-2,face+12,bw+4,25,'#414a4a');rect(c,xx,face+13,bw,22,'#747f7b');for(let yy=face+14;yy<face+34;yy+=4){rect(c,xx,yy,bw,1,'#9ca49a');rect(c,xx,yy+1,bw,1,'#565f5d')}rect(c,xx+5,face+17,bw-10,4,'#354c54')
  }
 }else{
  const ww=f.type==='gym'?31:f.type==='club'?24:25;
  for(let xx=x+9;xx<x+w-ww-7;xx+=ww+12){if(Math.abs(xx+ww/2-center)<25)continue;glass(c,xx,face+14,ww,18,b.id===7)}
 }
 rect(c,center-11,face+11,22,27,'#3b4142');rect(c,center-9,face+13,18,25,f.trim);rect(c,center-7,face+14,14,19,'#34484d');rect(c,center-6,face+15,12,15,'#627c80');rect(c,center-6,face+15,12,2,'#8ea5a2');rect(c,center+4,face+26,2,2,'#ead7a4');rect(c,center-7,face+33,14,4,f.accent);
 rect(c,center-13,face+38,26,3,'#c3b5a0');rect(c,center-14,face+41,28,2,'#77796d');
 if(f.awning){const ay=face+8;rect(c,x+4,ay+6,w-8,3,'#594c45');for(let xx=x+4;xx<x+w-4;xx+=12){rect(c,xx,ay,Math.min(12,x+w-4-xx),6,((xx-x-4)/12)%2?f.trim:f.accent);rect(c,xx,ay,Math.min(12,x+w-4-xx),1,f.trim);rect(c,xx,ay+5,Math.min(12,x+w-4-xx),1,f.shade)}}else{rect(c,x+3,face+5,w-6,5,f.accent);rect(c,x+3,face+9,w-6,1,f.trim)}
 const name=b.sign;sign(c,x,face-7,w,name,f);
 if(f.type==='club'){rect(c,x+5,face+16,2,16,'#d9a27e');rect(c,x+w-7,face+16,2,16,'#d9a27e')}
 if(f.type==='book'||f.type==='gallery'){planter(c,x+10,y+h+6,23);planter(c,x+w-36,y+h+6,23)}
 else if(f.type==='deli'||f.type==='gym'){hydrant(c,x+8,y+h+8);planter(c,x+w-33,y+h+6,22)}
}
export function installWorldBackdrop(scene,shops){
 const key='town-backdrop-'+ART_VERSION,atlas=scene.textures.get('urban').getSourceImage(),w=72*T,h=42*T;
 const tex=texture(scene,key,w,h,c=>{
 for(let y=0;y<42;y++)for(let x=0;x<72;x++){
  const X=x*T,Y=y*T,v=[17,18,19,35,36,37,53,54,55].includes(x),r=[16,17,18,36,37,38].includes(y);
  const curb=[16,20,34,38,52,56].includes(x)||[15,19,35,39].includes(y),pave=(y>=11&&y<=15)||(y>=19&&y<=23)||(y>=32&&y<=35)||y>=39||curb;
  if(v||r){rect(c,X,Y,T,T,C.road);noise(c,X,Y,T,T,[C.roadLit,C.roadEdge],3,x*43+y);
   if((y===17||y===37)&&!v&&x%3===0){rect(c,X+2,Y+7,12,2,'#b8ae8e');rect(c,X+2,Y+8,12,1,'#a29b81')}
   if([18,36,54].includes(x)&&!r&&y%3===0)rect(c,X+7,Y+2,2,12,'#b8ae8e');
   if((x*7+y*11)%41===0)manhole(c,X+4,Y+4);
  }else if(pave){let p=seed(x,y,4);rect(c,X,Y,T,T,p<.18?C.paveLit:p>.85?C.paveShade:C.pave);rect(c,X,Y,T,1,C.paveShade);rect(c,X,Y+1,T,1,'#aaa898');rect(c,X+(y%2?8:0),Y,1,T,C.paveShade);noise(c,X+2,Y+2,12,12,['#a5a193','#8e8b7e'],2,x*71+y);
   if(curb){rect(c,X,Y+13,T,2,C.curb);rect(c,X,Y+13,T,1,C.curbLit);rect(c,X,Y+15,T,1,C.curbShade)}
  }else{rect(c,X,Y,T,T,C.grass);noise(c,X,Y,T,T,[C.grass2,C.grass3],8,x*23+y)}
 }
 for(let cx of [18,36,54])for(let cy of [17,37]){
  const X=cx*T,Y=cy*T;
  for(let i=0;i<6;i++){rect(c,X-24+i*8,Y-23,5,10,'#b8b8a4');rect(c,X-24+i*8,Y+21,5,10,'#b8b8a4')}
  for(let i=0;i<5;i++){rect(c,X-30,Y-14+i*8,9,5,'#b8b8a4');rect(c,X+22,Y-14+i*8,9,5,'#b8b8a4')}
 }
 // Street furniture along the pedestrian edge, not pasted randomly over roads.
 for(const b of shops){building(c,b);const x=b.x*T,y=(b.y+b.h)*T,w=b.w*T;
  if(b.id%2===0)bench(c,x+19,y+26);else planter(c,x+12,y+24,34);
  lamp(c,x+w-12,y+20);if(b.id%3===0)hydrant(c,x+w-22,y+38);
  if(b.id===4){rect(c,x+35,y+27,37,3,'#726d58');for(let j=0;j<3;j++){rect(c,x+37,y+24-j*3,32,3,'#866949');rect(c,x+38,y+24-j*3,30,1,'#c19e6a')}}
  if(b.id===5){for(let j=0;j<2;j++){rect(c,x+16+j*44,y+18,35,1,'#d1c7a7');rect(c,x+16+j*44,y+18,1,24,'#d1c7a7')}}
 }
 for(let x of [2,14,33,51,69])for(let y of [1,12,23,32,39]){tree(c,atlas,x*T,y*T-9,x+y)}
 for(let x of [3,13,23,33,43,53,63]){let y=20*T;rect(c,x*T,y,21,1,'#c4bda5');rect(c,x*T,y+1,1,14,'#c4bda5');rect(c,x*T+20,y+1,1,14,'#c4bda5')}
 for(let x of [12,28,44,60]){manhole(c,x*T+5,17*T+4);manhole(c,x*T+5,37*T+4)}
 });
 scene.add.image(0,0,tex.key).setOrigin(0).setDepth(0);
 for(const b of shops)scene.solid(b.x,b.y,b.w,b.h);
}
function cabinet(c,x,y,w,h,p='#86664e'){rect(c,x+2,y+4,w,h,'#716d5b');rect(c,x,y,w,h,'#3c3835');rect(c,x+1,y+1,w-2,h-2,p);rect(c,x+1,y+1,w-2,3,'#bda381');rect(c,x+1,y+h-4,w-2,3,'#5f493b');for(let xx=x+5;xx<x+w-3;xx+=12){rect(c,xx,y+5,1,h-10,'#59493d');rect(c,xx+2,y+6,5,1,'#d0b99a')}}
function shelf(c,x,y,w,h,kind){cabinet(c,x,y,w,h);for(let xx=x+4;xx<x+w-4;xx+=5){
 const col=['#a56353','#bd9a62','#657c70','#687b99','#a7888c'][Math.floor(seed(xx,y,kind)*5)];
 if(kind===2){rect(c,xx,y+4,3,Math.max(5,h-9),col);rect(c,xx,y+5,3,1,'#c9bca2')}
 else if(kind===0){rect(c,xx,y+5,4,5,'#9b514c');rect(c,xx+1,y+5,3,1,'#d3a090')}
 else if(kind===3){rect(c,xx,y+4,2,7,'#9caaa5');rect(c,xx+1,y+4,3,2,'#b8c1b2')}
 else if(kind===4){rect(c,xx,y+4,3,8,'#a37c51');rect(c,xx,y+4,1,8,'#d0ad78')}
 else{rect(c,xx,y+5,4,4,col);rect(c,xx,y+5,4,1,'#cabca1')}
}}
function gym(c,x,y,w,h){rect(c,x+2,y+4,w,h,'#696b60');rect(c,x+3,y+3,w-6,h-5,'#444c4d');rect(c,x+5,y+4,w-10,h-7,'#758b8a');rect(c,x+7,y+5,w-14,1,'#a0b0a5');for(let i=0;i<2;i++){let xx=x+4+i*(w-10);rect(c,xx,y+2,4,h-3,'#282f33');rect(c,xx,y+4,4,2,'#8c9690')}rect(c,x+4,y+3,w-8,2,'#b6b9a5')}
function booth(c,x,y,w,h){rect(c,x+2,y+4,w,h,'#71695d');rect(c,x,y,w,h,'#493e42');rect(c,x+1,y+1,w-2,h-2,'#865565');rect(c,x+3,y+2,w-6,3,'#b67d83');for(let xx=x+6;xx<x+w-3;xx+=11)rect(c,xx,y+3,1,h-6,'#634653');rect(c,x+2,y+h-3,w-4,2,'#523e48')}
function gallery(c,x,y,w,h){rect(c,x+3,y+3,w,h,'#746b5f');rect(c,x,y,w,h,'#6f5343');rect(c,x+1,y+1,w-2,h-2,'#c4a275');rect(c,x+3,y+3,w-6,h-6,'#484f4c');rect(c,x+4,y+4,w-8,h-8,'#78939a');rect(c,x+5,y+5,w-10,2,'#d7c49e');for(let xx=x+5;xx<x+w-5;xx+=5)rect(c,xx,y+h-6,4,3,'#586e60')}
function fixture(c,x,y,w,h,room,i){
 if(room===1){gym(c,x,y,w,h);return}
 if(room===6){gallery(c,x,y,w,h);return}
 if(room===7||room===8&&i===0){booth(c,x,y,w,h);return}
 if(room===5&&h>16){rect(c,x+1,y+1,w-2,h-2,'#677a7d');rect(c,x+2,y+2,w-4,h-4,'#a4b3ad');rect(c,x+4,y+4,w-8,h-8,'#4f6266');for(let yy=y+5;yy<y+h-4;yy+=5)rect(c,x+5,yy,w-10,2,'#82999a');return}
 shelf(c,x,y,w,h,room);
}
export function installRoomBackdrop(scene,room,shops,layouts){
 const key='room-backdrop-'+ART_VERSION+'-'+room,w=26*T,h=19*T,b=shops[room],f=B[room]||B[2];
 const tex=texture(scene,key,w,h,c=>{
  let floor=room===7?'#776a72':room===5?'#8d9993':room===1?'#828b87':room===2||room===8?'#a88b69':'#a5a08c';
  rect(c,0,0,w,h,'#393e40');
  for(let y=32;y<h-16;y+=16)for(let x=16;x<w-16;x+=16){
   rect(c,x,y,16,16,floor);
   if(room===2||room===8||room===4){for(let j=0;j<16;j+=5)rect(c,x,y+j,16,1,'#8b7359');rect(c,x+(y%32?5:12),y,1,16,'#8b7359')}
   else{rect(c,x,y,16,1,'#86877c');rect(c,x,y,1,16,'#86877c');if(room===5||room===1)rect(c,x+1,y+1,14,1,'#b3b9aa')}
   noise(c,x+2,y+2,12,12,[room===7?'#847782':'#b3ad98'],2,x+y);
  }
  rect(c,0,0,w,8,'#333a3b');rect(c,16,8,w-32,24,f.wall);rect(c,16,8,w-32,2,f.trim);rect(c,16,28,w-32,4,f.shade);
  for(let x=32;x<w-36;x+=72){glass(c,x,12,32,11,room===7)}
  rect(c,0,0,16,h,'#575c57');rect(c,w-16,0,16,h,'#575c57');rect(c,13,32,3,h-48,f.trim);rect(c,w-16,32,3,h-48,f.shade);
  rect(c,0,h-16,w,16,'#4f5754');rect(c,16,h-18,w-32,2,'#b3a791');
  rect(c,185,h-20,62,4,'#86775e');rect(c,193,h-17,46,17,'#666c63');rect(c,193,h-16,46,2,'#b5b6a3');
  if(room===2||room===7||room===8){rect(c,141,139,135,92,'#79655a');rect(c,144,142,129,86,f.accent);rect(c,148,146,121,78,'#9d8776');rect(c,151,149,115,72,f.accent);for(let i=0;i<4;i++){rect(c,151+i*30,150,1,70,'#b4a18a')}}
  if(b){const name=b.sign;sign(c,110,38,196,name,f);cabinet(c,160,64,96,16,f.accent);rect(c,162,64,92,9,'#c2a989');rect(c,164,66,22,5,'#566c6e');rect(c,167,67,16,2,'#9fb9ae');rect(c,234,66,12,6,'#5d6057');rect(c,235,67,10,1,'#b8b49c')}
  (layouts[room]||layouts[8]).forEach(([x,y,cc,r,ww,hh],i)=>fixture(c,x*T,y*T,ww*T,hh*T,room,i));
  if(room===5){for(let x of [42,330]){rect(c,x,194,40,47,'#7d8b87');rect(c,x,194,40,2,'#c0c5b1');rect(c,x,238,40,2,'#c0c5b1')}}
  if(room===1){for(let x of [45,326]){rect(c,x,189,34,37,'#616d68');rect(c,x+2,191,30,33,'#89958a');rect(c,x+2,191,30,1,'#afb4a1')}}
 });
 scene.add.image(0,0,tex.key).setOrigin(0).setDepth(0);scene.solid(0,0,26,2);scene.solid(0,2,1,16);scene.solid(25,2,1,16);scene.solid(0,18,26,1);
 for(const [x,y,cc,r,ww,hh] of layouts[room]||layouts[8])scene.solid(x,y,ww,hh);
 if(b)scene.solid(10,4,6,1);
}
const SKIN=[
 ['#815746','#ab785a','#d7a77c'],['#6f473c','#a26c52','#d09d78'],['#b78065','#d9a68c','#f2c6a5'],['#533c37','#815446','#b77e60'],['#a37054','#c99470','#e7b28a'],['#ad8069','#d9ac91','#f4d2b0']
];
const LOOKS=[
 ['#352b2b','#684d3d','#886449','#52716a','#75958a','#32474c','#52636b',0],['#3d3330','#594237','#916f4e','#74524e','#a17569','#323b45','#53606b',1],['#453a35','#a77c46','#d2a565','#586c8b','#7899ae','#414958','#61728b',2],['#25292d','#3a3230','#614c3f','#86574b','#b88066','#35424b','#62727a',0],['#3a3033','#554337','#887050','#7f7652','#a9a16d','#424a40','#686b57',1],['#383239','#6b5550','#a48674','#756080','#a28caa','#414151','#707184',2],
 ['#312b2d','#9b7a58','#c9ab7f','#62634d','#959270','#493e3b','#756252',0],['#332b31','#513b38','#876762','#494d6b','#767b9b','#332f40','#5c5872',2],
 ['#45403a','#77726a','#b1aa96','#6c6376','#9b8e9d','#47424a','#6d656d',1],['#2e3033','#393a3c','#64676a','#8b6a4f','#b69d73','#3f4651','#65707a',0],
 ['#4a3730','#7d5c43','#b18b62','#5f7460','#8c9a75','#454e4f','#687d79',0],['#3d323b','#69505b','#a78683','#875c66','#c18d90','#494353','#746b7e',2],
 ['#333336','#595d60','#90918a','#60697a','#8e9bad','#373d47','#5f6675',0],['#3f302c','#96694a','#be9c73','#90594e','#c2836a','#46514d','#728278',1],
 ['#332c35','#4b3c4d','#796678','#627782','#90a6a3','#3f4558','#687183',2],['#3f3934','#776044','#b08c64','#746b51','#aaa07b','#453f39','#74665a',1]
];
const PLY=[0,2,3,5,9,13];
function actor(c,ox,oy,id,dir,step){
 const L=LOOKS[id%LOOKS.length],sk=SKIN[id%SKIN.length],flip=dir==='left',side=dir==='left'||dir==='right',back=dir==='up';
 const pal={o:'#2d3034',h:L[0],H:L[1],j:L[2],s:sk[0],S:sk[1],f:sk[2],t:L[3],T:L[4],p:L[5],P:L[6],b:'#3a3b3e',B:'#66665c',e:'#302e32',w:'#e0cfb4'};
 const put=(x,y,rows)=>cluster(c,ox+(flip?20-x-rows[0].length:x),oy+y,rows,pal,flip);
 // Anatomical gait: feet move independently, torso stays over the supporting foot.
 const swing=step===1?-1:step===2?1:0;
 if(side){
  put(6+swing,19,['.ppp.','opPpo','opPpo','opppo','.obb.','.oBbo']);
  put(9-swing,19,['.ppp.','opPpo','opPpo','opppo','.obb.','.oBbo']);
  put(5,9,['..oooo..','.ottTto.','otTTTtto','otTTttto','otTtttto','otttttto','otttttto','.oppppo.','.oppppo.','.oppppo.']);
  put(10+swing,11,['.oo.','otTo','otTo','oSSo','osSo','.oo.']);
  put(6,2,['..hhhh..','.hHHHho.','hHHHHHho','hHHHSSso','hHHSSfso','hHHSeSso','.hSSfsso','..osSso.','...oo...']);
  if(L[7]===2)put(5,6,['hh..','hHh.','hHh.','hhho','hho.','oo..']);
 }else{
  put(5,19+(swing===1?1:0),['.ppp.','opPpo','opPpo','opppo','obBbo','oBBbo','.ooo.']);
  put(10,19+(swing===-1?1:0),['.ppp.','opPpo','opPpo','opppo','obBbo','oBBbo','.ooo.']);
  put(4,10,['..oooooo..','.otTTTTto.','otTTTTTtto','otTTTTTtto','otTTTTttto','otTTTtttto','otttttttto','.oppppppo.','.opPPpppo.','.oppppppo.']);
  put(2,11+(swing===1?1:0),['.oo.','otTo','otTo','oSSo','osSo','.oo.']);
  put(14,11+(swing===-1?1:0),['.oo.','otTo','otTo','oSSo','osSo','.oo.']);
  if(back)put(5,2,['..hhhh..','.hHHHhh.','hHHHHHho','hHjjHHho','hHHHHHho','hHHHHHho','.hHHHho.','..hhhh..','...oo...']);
  else put(5,2,['..hhhh..','.hHHHhh.','hHHHHHho','hHSSSHho','hSffSfso','oSefeso.','oSSfSso.','.osSSo..','..ooo...']);
  if(L[7]===1){put(4,5,['hh.','hHh','hHh','hho','oo.']);put(13,5,['.hh','hHh','hHh','ohh','.oo'])}
  if(L[7]===2){put(4,5,['hh.','hHh','hHh','hHh','hho','oo.']);put(13,5,['.hh','hHh','hHh','hHh','ohh','.oo'])}
  if(!back){rect(c,ox+9,oy+11,2,4,L[3]);rect(c,ox+9,oy+12,1,1,L[4])}
 }
}
export function actorKey(look,id=null){return 'adult-'+(id===null?'player-'+look:'npc-'+id)+'-'+ART_VERSION}
export function installActor(scene,look,id=null){
 const key=actorKey(look,id),style=id===null?PLY[look%PLY.length]:id,dirs=['left','down','up','right'];
 let tex=texture(scene,key,80,84,c=>{for(let row=0;row<3;row++)dirs.forEach((dir,i)=>actor(c,i*20,row*28,style,dir,row))});
 for(let row=0;row<3;row++)dirs.forEach((dir,i)=>{let frame=characterFrame(look,dir,row===2?3:row);if(!tex.has(frame))tex.add(frame,0,i*20,row*28,20,28)});
 return key;
}
export function actorPortrait(scene,look,id){const key=installActor(scene,look,id),source=scene.textures.get(key).getSourceImage(),c=document.createElement('canvas');c.width=20;c.height=28;c.getContext('2d').drawImage(source,20,0,20,28,0,0,20,28);return c.toDataURL('image/png')}
const CARCOL=[
 ['#405f61','#608a86','#9ab0a1'],['#986b3b','#c6a063','#e2c48b'],['#8b4b4b','#ba6b5f','#df9a83'],['#6e727b','#9fa6a5','#d1d1b9'],['#47586d','#647c9a','#9cacc0'],['#767d65','#a7ad87','#d4d4b3']
];
export const VEHICLES=['sedan','taxi','hatch','wagon','coupe','van'];
function car(c,ox,oy,i,dir){
 const p=CARCOL[i],van=i===5,hatch=i===2,flip=dir<0;
 const map={o:'#2e3338',b:'#31363b',B:'#575d60',s:p[0],S:p[1],H:p[2],g:'#334851',G:'#5e7d89',j:'#a2b8b4',r:'#b75b4a',R:'#ed9278',l:'#e9d9ad',w:'#c0c7b7',k:'#474a46'};
 const rows=[
 '......................................',
 '.......ooooo.............ooooo........',
 '......obBBbo.............obBBbo.......',
 '...ooooobboooooooooooooooobbooooooo...',
 '..osSSSSSSSSSSSSSSSSSSSSSSSSSSSSSo..',
 '.oSSHHHHHHHHHHHHHHHHHHHHHHHHHHHSSSo.',
 '.oSrSSSSSSSggggggGGGGGGggggSSSSSllo.',
 'oSSrSSSSSSgGGGGGGGGGGGGGGGgSSSSSlSso',
 'oSSSSSSSSSgGjjGGGGGGGGGGGGgSSSSSSSso',
 'oSSSSSSSSSgGGGGGGGGGGGGGGGgSSSSSSSso',
 '.oSrSSSSSSSggggggGGGGGGggggSSSSSllo.',
 '.oSSssssssssssssssssssssssssssssSSo.',
 '..osSSSSSSSSSSSSSSSSSSSSSSSSSSSSSo..',
 '...ooooobboooooooooooooooobbooooooo...',
 '......obBBbo.............obBBbo.......',
 '.......ooooo.............ooooo........',
 '......................................',
 '......................................'
 ];
 // Normalize each hand-authored row to the native 38-pixel frame.
 let a=rows.map(r=>r.padEnd(38,'.').slice(0,38));
 cluster(c,ox,oy,a,map,flip);
 const R=(x,y,w,h,col)=>rect(c,ox+(flip?38-x-w:x),oy+y,w,h,col);
 R(1,6,2,6,'#5e6464');R(35,6,2,6,'#b2bbb0');R(10,5,1,8,p[0]);R(27,5,1,8,p[0]);R(15,5,1,8,'#526a6c');R(23,5,1,8,'#526a6c');R(14,6,10,1,'#879b9c');
 if(i===1){R(16,7,6,4,'#c8a06a');R(17,7,4,1,'#eed2a1');R(18,8,2,2,'#5a5548')}
 if(van){R(7,5,18,8,p[1]);R(8,6,16,1,p[2]);R(24,5,1,8,p[0]);R(25,6,5,6,'#557482')}
 if(hatch){R(6,6,5,6,p[1]);R(7,6,4,1,p[2]);R(11,6,2,6,'#4b656b')}
}
export function installVehicles(scene){
 const key='traffic-'+ART_VERSION,tex=texture(scene,key,38*VEHICLES.length,36,c=>{VEHICLES.forEach((_,i)=>{car(c,i*38,0,i,1);car(c,i*38,18,i,-1)})});
 VEHICLES.forEach((name,i)=>{for(let j=0;j<2;j++){let f=name+(j?'-left':'-right');if(!tex.has(f))tex.add(f,0,i*38,j*18,38,18)}});
 return key;
}
export function installCrate(scene){
 const key='crate-'+ART_VERSION;texture(scene,key,16,16,c=>{cluster(c,0,0,['..oooooooooooo..','.oHHHHHHHHHHHHo.','oHHHHHHHHHHHHHHo','oHhHHHHHHHHHhHHo','oHhHHHHHHHHHhHHo','oHHHHHHHHHHHHHHo','oooooooooooooooo','oshhhhshhhhshhso','oshhhhshhhhshhso','oshhHHshhHHshhso','oshhhhshhhhshhso','oshhhhshhhhshhso','oshhhhshhhhshhso','osssssssssssssso','.oooooooooooooo.','................'],{o:'#443d34',H:'#c4a16e',h:'#9e7b51',s:'#72563d'})});return key;
}
export function installEffects(scene){
 const key='shadow-'+ART_VERSION;texture(scene,key,20,7,c=>{cluster(c,0,0,['.....aaaaaaaaaa.....','...abbbbbbbbbbbba...','..abbbbbbbbbbbbbba..','..abbbbbbbbbbbbbba..','...abbbbbbbbbbbba...','.....aaaaaaaaaa.....','....................'],{a:'rgba(38,43,42,.13)',b:'rgba(35,41,41,.25)'})});
 const carKey='car-shadow-'+ART_VERSION;texture(scene,carKey,40,19,c=>{rect(c,4,3,32,13,'rgba(23,29,33,.17)');rect(c,2,6,36,8,'rgba(23,29,33,.2)')});
 const mark='route-'+ART_VERSION;texture(scene,mark,12,12,c=>{cluster(c,0,0,['.###....###.','#..........#','#..........#','#..........#','............','.....##.....','.....##.....','............','#..........#','#..........#','#..........#','.###....###.'],{'#':'#e2d6a7'})});const light='lamp-pool-'+ART_VERSION;texture(scene,light,48,30,c=>{for(let y=0;y<30;y++)for(let x=0;x<48;x++){const d=Math.sqrt(((x-23.5)/23.5)**2+((y-14.5)/14.5)**2);if(d>=1)continue;const a=d<.45?.23:d<.7?.13:.055;if(d>.75&&((x+y)%2))continue;rect(c,x,y,1,1,'rgba(234,187,106,'+a+')')}});
 const beam='car-light-'+ART_VERSION;texture(scene,beam,22,16,c=>{for(let y=0;y<16;y++)for(let x=0;x<22;x++){const edge=3+x*.21,dy=Math.abs(y-7.5);if(dy>edge)continue;const a=(1-x/22)*.19*(dy<edge-2?1:.45);if(a>.015)rect(c,x,y,1,1,'rgba(241,210,142,'+a+')')}});
 return {shadow:key,carShadow:carKey,mark,light,beam};
}
