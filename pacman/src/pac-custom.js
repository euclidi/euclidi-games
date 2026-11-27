// Native 16x16 pixel character painter. Cosmetics never change collision geometry.
export const PALETTES={classic:['#ffff00','#c5a900','#ffffad'],gold:['#ffb52b','#a6620c','#ffdf85'],mint:['#73ffa0','#239c56','#c5ffdd'],cyan:['#45dfff','#187eaf','#c2f7ff'],pink:['#ff80c7','#a94180','#ffd6ec'],violet:['#b89bff','#6d4fb5','#e9dbff'],white:['#f5f5f5','#92929b','#ffffff'],red:['#ff4d42','#b82226','#ffb4a1'],lime:['#b5ff38','#5d9d12','#e3ffa0'],orange:['#ff8133','#a74612','#ffc18b']};
export const PAC_OPTIONS=[
 {id:'color',label:'Color',values:Object.keys(PALETTES),names:['Classic yellow','Gold','Mint','Cyan','Pink','Violet','White','Red','Lime','Orange']},
 {id:'finish',label:'Finish',values:['flat','shaded','outline','stripe'],names:['Flat','Shaded','Outline','Racing stripe']},
 {id:'eyes',label:'Eyes',values:['none','dot','bright','visor'],names:['Classic','Dot','Bright','Visor']},
 {id:'accessory',label:'Accessory',values:['none','bow','cap','crown','band'],names:['None','Bow','Cap','Crown','Headband']}
];
export function normalizePac(value){return Object.fromEntries(PAC_OPTIONS.map(o=>[o.id,o.values.includes(value?.[o.id])?value[o.id]:o.values[0]]))}
export function cyclePac(value,id,delta=1){let p=normalizePac(value),o=PAC_OPTIONS.find(o=>o.id===id);if(o)p[id]=o.values[((o.values.indexOf(p[id])+delta)%o.values.length+o.values.length)%o.values.length];return p}
export function pacPixels(value,d=3,f=0){
 const p=normalizePac(value),[base,dark,light]=PALETTES[p.color],cells=new Map(),widths=[6,10,12,12,14,14,14,14,14,14,12,12,10,6];
 for(let y=0;y<14;y++)for(let x=0;x<14;x++){
  if(x<(14-widths[y])/2||x>=(14+widths[y])/2)continue;let a=x-6.5,b=y-6.5,k=Math.atan2(b,a)-[-Math.PI/2,Math.PI,Math.PI/2,0][d];k=Math.atan2(Math.sin(k),Math.cos(k));
  if(f===0||Math.abs(k)>[0,.32,.73][f])cells.set((y+1)*16+x+1,base)
 }
 const body=new Set(cells.keys()),inside=(x,y)=>x>=0&&x<16&&y>=0&&y<16&&body.has(y*16+x);
 for(let k of body){let x=k%16,y=k>>4;if(p.finish==='shaded'){if(x+y>=19)cells.set(k,dark);else if(x+y<=10)cells.set(k,light)}else if(p.finish==='outline'&&(!inside(x-1,y)||!inside(x+1,y)||!inside(x,y-1)||!inside(x,y+1)))cells.set(k,dark);else if(p.finish==='stripe'&&Math.abs(x+y-11)<=.5)cells.set(k,light)}
 const overlay=(x,y,col,clip=true)=>{if(x>=0&&x<16&&y>=0&&y<16&&(!clip||inside(x,y)))cells.set(y*16+x,col)};
 const eyeX=d===1?5:d===3?10:8,eyeY=d===0?5:d===2?5:5;
 // Place the eye away from the mouth opening in each direction.
 const ex=d===0?5:eyeX,ey=d===0?6:eyeY;
 if(p.eyes==='dot'||p.eyes==='bright'){for(let y=ey;y<ey+2;y++)for(let x=ex;x<ex+2;x++)overlay(x,y,p.eyes==='dot'?'#111122':'#ffffff');if(p.eyes==='bright')overlay(ex+(d===3?1:0),ey+1,'#111122')}
 if(p.eyes==='visor'){for(let x=ex-2;x<=ex+2;x++){overlay(x,ey,'#13172b');overlay(x,ey+1,'#13172b')}overlay(ex-1,ey,'#86eaff')}
 // Small wearable pixel sprites within the existing 16x16 texture.
 if(p.accessory==='bow'){for(let [x,y] of [[3,1],[4,1],[3,2],[4,2],[5,2],[6,1],[7,1],[6,2],[7,2],[3,3],[7,3]])overlay(x,y,'#ed3181',false);overlay(5,2,'#ffb5d9',false)}
 if(p.accessory==='cap'){for(let y=0;y<3;y++)for(let x=5;x<=10;x++)overlay(x,y,y===0?'#dfdfef':'#4b75df',false);for(let x=3;x<=12;x++)overlay(x,3,'#3249a6',false)}
 if(p.accessory==='crown'){for(let x=4;x<=11;x++)overlay(x,3,'#f4a827',false);for(let x of [4,7,8,11]){overlay(x,1,'#ffe291',false);overlay(x,2,'#ffce45',false)}overlay(7,3,'#d83b53',false);overlay(8,3,'#d83b53',false)}
 if(p.accessory==='band'){for(let x=1;x<15;x++)overlay(x,4,'#e33a3c');for(let x=5;x<11;x++)overlay(x,5,'#ff9995')}
 return [...cells].map(([k,color])=>[k%16,k>>4,color])
}
export function paintPac(ctx,value,d,f){ctx.clearRect(0,0,16,16);for(let [x,y,color] of pacPixels(value,d,f)){ctx.fillStyle=color;ctx.fillRect(x,y,1,1)}}
