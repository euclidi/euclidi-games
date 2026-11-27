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
// Canonical right-facing attachment coordinates, mirrored left and rotated vertically.
export function pacTransform(x,y,d){return d===0?[y,15-x]:d===1?[15-x,y]:d===2?[15-y,x]:[x,y]}
const widths=[6,10,12,12,14,14,14,14,14,14,12,12,10,6];
export function pacBody(d=3,f=0){let cells=[];for(let y=0;y<14;y++)for(let x=0;x<14;x++){if(x<(14-widths[y])/2||x>=(14+widths[y])/2)continue;let a=x-6.5,b=y-6.5,k=Math.atan2(b,a)-[-Math.PI/2,Math.PI,Math.PI/2,0][d];k=Math.atan2(Math.sin(k),Math.cos(k));if(f===0||Math.abs(k)>[0,.32,.73][f])cells.push([x+1,y+1])}return cells}
const common=new Set(pacBody(3,0).map(([x,y])=>y*16+x).filter(k=>[0,1,2,3].every(d=>{let [x,y]=pacTransform(k%16,k>>4,d);return pacBody(d,2).some(([a,b])=>a===x&&b===y)})));
const rgb={k:'#18202a',w:'#f6f8ff',b:'#76dfff',r:'#b91b48',R:'#f23f68',p:'#ffafbd',n:'#64203d',c:'#254b95',C:'#537cce',L:'#a1b9eb',g:'#ba6a16',G:'#f7bc38',Y:'#ffe8a0',j:'#df3151'};
const stamps={
 eyes:{
  dot:{x:7,y:5,rows:['kk','kk']},
  bright:{x:6,y:4,rows:['.ww.','wwkk','.wk.']},
  visor:{x:5,y:5,rows:['kkkkk','kbkkk']}
 },
 accessory:{
  bow:{x:1,y:1,rows:['...RR.','..rRrp','.rRrRn','RRRn..','pRn...']},
  cap:{x:3,y:0,rows:['...CCC...','..CLCCC..','..CCCCCC.','.cccccccc','.......c.']},
  crown:{x:3,y:0,rows:['Y..Y..Y..','GY.GY.GY.','GGGGGGGG.','.gGjgGg..']},
  band:{x:2,y:2,rows:['..RRRRRRR..','.rRRRRRRRr.']}
 }
};
export function pacLayers(value,d=3,f=0){
 const p=normalizePac(value),[base,dark,light]=PALETTES[p.color],body=pacBody(d,f),occupied=new Set(body.map(([x,y])=>y*16+x)),inside=(x,y)=>x>=0&&x<16&&y>=0&&y<16&&occupied.has(y*16+x),basePixels=[];
 for(let [x,y] of body){let col=base;if(p.finish==='shaded'){if(x+y>=19)col=dark;else if(x+y<=10)col=light}else if(p.finish==='outline'&&(!inside(x-1,y)||!inside(x+1,y)||!inside(x,y-1)||!inside(x,y+1)))col=dark;else if(p.finish==='stripe'&&Math.abs(x+y-11)<=.5)col=light;basePixels.push([x,y,col])}
 const apply=(stamp,clip=false)=>{if(!stamp)return [];let out=[];stamp.rows.forEach((row,dy)=>[...row].forEach((v,dx)=>{if(v==='.')return;let x=stamp.x+dx,y=stamp.y+dy;if(clip&&!common.has(y*16+x))return;let [a,b]=pacTransform(x,y,d);out.push([a,b,rgb[v]])}));return out};
 return {body:basePixels,eyes:apply(stamps.eyes[p.eyes],true),accessory:apply(stamps.accessory[p.accessory],p.accessory==='band')}
}
export function pacPixels(value,d=3,f=0){let layers=pacLayers(value,d,f),cells=new Map();for(let layer of [layers.body,layers.accessory,layers.eyes])for(let [x,y,c] of layer)cells.set(y*16+x,c);return [...cells].map(([k,color])=>[k%16,k>>4,color])}
export function paintPac(ctx,value,d,f){ctx.clearRect(0,0,16,16);for(let [x,y,color] of pacPixels(value,d,f)){ctx.fillStyle=color;ctx.fillRect(x,y,1,1)}}
