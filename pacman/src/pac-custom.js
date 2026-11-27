// Native 16x16 pixel character painter. Cosmetics never change collision geometry.
export const PALETTES={classic:['#ffff00','#c5a900','#ffffad'],gold:['#ffb52b','#a6620c','#ffdf85'],mint:['#73ffa0','#239c56','#c5ffdd'],cyan:['#45dfff','#187eaf','#c2f7ff'],pink:['#ff80c7','#a94180','#ffd6ec'],violet:['#b89bff','#6d4fb5','#e9dbff'],white:['#f5f5f5','#92929b','#ffffff'],red:['#ff4d42','#b82226','#ffb4a1'],lime:['#b5ff38','#5d9d12','#e3ffa0'],orange:['#ff8133','#a74612','#ffc18b']};
export const PAC_OPTIONS=[
 {id:'color',label:'Color',values:Object.keys(PALETTES),names:['Classic yellow','Gold','Mint','Cyan','Pink','Violet','White','Red','Lime','Orange']},
 {id:'finish',label:'Finish',values:['flat','shaded','outline','stripe'],names:['Flat','Shaded','Outline','Racing stripe']},
 {id:'eyes',label:'Eyes',values:['none','dot','bright','visor','angry','glasses'],names:['Classic','Arcade eye','Bright','Cyber visor','Determined','Glasses']},
 {id:'accessory',label:'Accessory',values:['none','bow','cap','crown','band','wizard','headphones','helmet'],names:['None','Ribbon','Baseball cap','Royal crown','Headband','Wizard hat','Headphones','Space helmet']}
];
export function normalizePac(value){return Object.fromEntries(PAC_OPTIONS.map(o=>[o.id,o.values.includes(value?.[o.id])?value[o.id]:o.values[0]]))}
export function cyclePac(value,id,delta=1){let p=normalizePac(value),o=PAC_OPTIONS.find(o=>o.id===id);if(o)p[id]=o.values[((o.values.indexOf(p[id])+delta)%o.values.length+o.values.length)%o.values.length];return p}
// 40x40 canvas: 28px body = original 14 logical pixels. 2x raster density.
export const PAC_SIZE=40,PAC_LOGICAL=20;
export function pacTransform(x,y,d){return d===0?[y,39-x]:d===1?[39-x,y]:d===2?[39-y,x]:[x,y]}
const widths=[6,10,12,12,14,14,14,14,14,14,12,12,10,6];
export function pacBody(d=3,f=0){let cells=[];for(let y=0;y<14;y++)for(let x=0;x<14;x++){if(x<(14-widths[y])/2||x>=(14+widths[y])/2)continue;let a=x-6.5,b=y-6.5,k=Math.atan2(b,a)-[-Math.PI/2,Math.PI,Math.PI/2,0][d];k=Math.atan2(Math.sin(k),Math.cos(k));if(f===0||Math.abs(k)>[0,.32,.73][f])for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)cells.push([6+x*2+dx,6+y*2+dy])}return cells}
const rgb={k:'#171822',w:'#fff8e7',b:'#5ce4ff',B:'#268cb9',d:'#1e344d',r:'#a3224e',R:'#ee3c69',p:'#ffadc5',n:'#62213c',c:'#20396e',C:'#4774c9',L:'#a8d0f8',g:'#985219',G:'#e7a42c',Y:'#ffe58e',j:'#e63b62',v:'#45306f',V:'#8658c9',s:'#8b94aa',S:'#c4d0df',h:'#434d68',a:'#ff8f3e'};
const eyes={
 dot:[16,12,['.kkk.','kkkkk','kkkkk','.kkk.']],
 bright:[16,10,['..www..','.wwwww.','wwwwkkw','wwwkkkw','wwwkkkw','.wwkkw.','..www..']],
 visor:[12,11,['.dddddddd.','dBBBBBBBBd','dBbbBBBBBd','dBBBBBBBBd','.dddddddd.']],
 angry:[15,11,['kk.....','.kkk...','..kkkk.','..wwkkk','..wwkkk','...kkk.']],
 glasses:[12,11,['.kkkkkkkk.','kwwwkwwwkk','kwbwkwbwkk','kwwwkwwwkk','.kkk.kkk..']]
};
const wear={
 bow:[3,3,['...RRR......','..RppRR.....','..RRrRR.RR..','.rRRRrRRRpR.','RRRpRrRRRRR.','RppRRnRRrR..','RRRrR..rr...','.rrr........']],
 cap:[9,0,['.....cccccc.....','...ccCCCCCCcc...','..cCCCLCCCCCCc..','.cCCLLCCCCCCCCc.','.cCCCCCCCCCCCCC.','cccccccccccccccc','........cccccccccccc','.........cccccccccc.']],
 crown:[8,0,['Y.....Y.....Y','GY...YGY...YG','GGY..GGG..YGG','GGGY.GGG.YGGG','GGGGGGGGGGGGG','gGgjGGjGGjgGg','ggggggggggggg']],
 band:[8,7,['..rRRRRRRRRRRr..','.rRRppRRRRRRRRr.','rRRRRRRRRRRRRRRr','.rrrrrrrrrrrrrr.']],
 wizard:[5,0,['........vVv.........','.......vVVVv........','......vVVVVv........','.....vVVYVVVv.......','....vVVVVVVVv.......','...vVVVVVVVVVv......','..vvvvvvvvvvvvv.....','.vvvvvvvvvvvvvvvvvv.','vvvvvvvvvvvvvvvvvvvv']],
 headphones:[5,4,['.......hhhhhh.......','.....hhSSSSSShh.....','....hSS......SSh....','...hSS........SSh...','..hhS..........Shh..','..hhh..........hhh..','..hSh..........hSh..','..hSh..........hSh..','..hhh..........hhh..']],
 helmet:[6,1,['......hhhhhhhh......','....hhSSSSSSSShh....','...hSSSSSSSSSSSSh...','..hSSSLLSSSSSSSSSh..','.hSSSSSSSSSSSSSSSSh.','hSSSSSSSSSSSSSSSSSSh','hhhhhhhhhhhhhhhhhhhh','..hhhhhhhhhhhhhhhh..']]
};
// Each wearable is drawn as a real pixel cluster, with shared attachment landmarks.
const common=new Set(pacBody(3,2).map(([x,y])=>y*40+x));
export function pacLayers(value,d=3,f=0){
 const p=normalizePac(value),[base,dark,light]=PALETTES[p.color],body=pacBody(d,f),occupied=new Set(body.map(([x,y])=>y*40+x)),inside=(x,y)=>x>=0&&x<40&&y>=0&&y<40&&occupied.has(y*40+x),basePixels=[];
 for(let [x,y] of body){let col=base;if(p.finish==='shaded'){if(x+y>=46)col=dark;else if(x+y<=24)col=light}else if(p.finish==='outline'&&(!inside(x-1,y)||!inside(x+1,y)||!inside(x,y-1)||!inside(x,y+1)))col=dark;else if(p.finish==='stripe'&&Math.abs(x+y-27)<=1)col=light;basePixels.push([x,y,col])}
 const stamp=(spec,clip=false)=>{if(!spec)return [];const [ox,oy,rows]=spec,out=[];rows.forEach((row,dy)=>[...row].forEach((v,dx)=>{if(v==='.')return;let x=ox+dx,y=oy+dy;if(clip&&!common.has(y*40+x))return;let [a,b]=pacTransform(x,y,d);if(a>=0&&a<40&&b>=0&&b<40)out.push([a,b,rgb[v]])}));return out};
 let face=stamp(eyes[p.eyes],true),eyeSet=new Set(face.map(([x,y])=>y*40+x));
 return {body:basePixels,eyes:face,accessory:stamp(wear[p.accessory],p.accessory==='band').filter(([x,y])=>!eyeSet.has(y*40+x))}
}
export function pacPixels(value,d=3,f=0){let layers=pacLayers(value,d,f),cells=new Map();for(let layer of [layers.body,layers.accessory,layers.eyes])for(let [x,y,c] of layer)cells.set(y*40+x,c);return [...cells].map(([k,color])=>[k%40,k/40|0,color])}
export function paintPac(ctx,value,d,f){ctx.clearRect(0,0,40,40);for(let [x,y,color] of pacPixels(value,d,f)){ctx.fillStyle=color;ctx.fillRect(x,y,1,1)}}
