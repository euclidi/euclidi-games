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

// Individually raster-authored headwear with shared 28px head and face landmarks.
const ink={K:'#18141d',W:'#fff7dc',R:'#df3155',r:'#8c183d',P:'#ff8e9e',p:'#ffcfba',C:'#31598d',c:'#182c50',L:'#81b9e5',l:'#c9e9f5',G:'#e8a02b',g:'#92501c',Y:'#ffe5a0',V:'#754ab0',v:'#3a285d',S:'#b6c6d2',s:'#68788b',H:'#333b4c',h:'#171d2d',T:'#4ac4ce',t:'#236f83',A:'#f4c55b'};
const eyes={
 dot:[18,12,['.KKK.','KKKKK','KKKKK','.KKK.']],
 bright:[15,12,['..KKK..','.KWWWK.','KWWWWKK','KWWWKKK','KWWKKKK','.KWWKK.','..KKK..']],
 visor:[13,12,['.hhhhhhhhhh.','hTTTTTTTTTTh','hTllTTTTTTTh','htttttttttth','.hhhhhhhhhh.']],
 angry:[14,12,['KK......','.KKK....','..KKKK..','..KWWKK.','..KWKKK.','...KKK..']],
 glasses:[13,12,['.KKKKKKKKKK.','KWlWKKWlWKKK','KWWWKKWWWKKK','KWWWKKWWWKKK','.KKKK.KKKK..']]
};
const wear={
 bow:[4,5,['...rrr.......','..rRRRr..rr..','.rRPRRRrrRRr.','rRPPPRRRRPRRr','rRRPRRPrRRRRr','.rRRRrrrRRRr.','..rrr...rrr..']],
 cap:[8,2,['.....cccccccc....','...ccCCCCCCCCcc..','..cCCCLLCCCCCCCc.','.cCCCLCCCCCCCCCCc','.cCCCCCCCCCCCCCCc','.cCCCCCCCCCCCCCCc','..ccccccccccccccc','.......cCCCCCCCCCCCCc','........cccccccccccc.']],
 crown:[11,2,['Yg...Yg...Yg...Yg','YGg..YGg..YGg..YG','YGGg.YGGg.YGGg.YG','YGGGGGGGGGGGGGGYG','YGGGGGGGGGGGGGGYG','gGGRGGRGGRGGRGGGg','gYYYYYYYYYYYYYYYg','ggggggggggggggggg']],
 band:[8,6,['.....rrrrrrrrrr.....','...rRRRRRRRRRRRRr...','..rRRPPPRRRRRRRRRr..','.rRRRRRRRRRRRRRRRRr.','..rrrrrrrrrrrrrrrr..']],
 wizard:[7,0,['.........vv..........','........vVVv.........','.......vVVVVv........','......vVVAVVVv.......','.....vVVVVVVVVv......','....vVVVVVVVVVVv.....','...vVVVVVVVVVVVVv....','..vGGGGGGGGGGGGGGv...','.vvvvvvvvvvvvvvvvvvv.','vvvvvvvvvvvvvvvvvvvvv','..vvvvvvvvvvvvvvvvv..']],
 headphones:[5,6,['.......hhhhhhh.......','.....hhSSSSSSShh.....','....hSS.......SSh....','...hSS.........SSh...','..hSS...........Sh...','..hS.................','..hS.................','.hhh.................','hSSSh................','hSLSh................','hSSSh................','hSSSh................','hSSSh................','.hhh.................']],
 helmet:[7,3,['.......hhhhhhhh.......','.....hhSSSSSSSShh.....','...hhSSSSSSSSSSSShh...','..hSSLLSSSSSSSSSSSSh..','.hSSLLSSSSSSSSSSSSSSh.','hSSSSSSSSSSSSSSSSSSSSh','hSSSSSSSSSSSSSSSSSSSSh','hssssssssssssssssssssh','.hhhhhhhhhhhhhhhhhhhh.']]
};
function customBody(d,f){let out=[];for(let y=6;y<34;y++)for(let x=6;x<34;x++){let a=x-19.5,b=y-19.5;if(a*a+b*b>196)continue;if(f&&Math.abs(Math.atan2(b,a))<[0,.37,.71][f])continue;out.push(pacTransform(x,y,d))}return out}
export function pacLayers(value,d=3,f=0){const p=normalizePac(value),[base,dark,light]=PALETTES[p.color],classic=p.eyes==='none'&&p.accessory==='none'&&p.finish==='flat',body=classic?pacBody(d,f):customBody(d,f),occupied=new Set(body.map(([x,y])=>y*40+x)),inside=(x,y)=>occupied.has(y*40+x)&&x>=0&&x<40&&y>=0&&y<40;
let basePixels=body.map(([x,y])=>{let c=base;if(p.finish==='shaded'){if(x+y>46)c=dark;else if(x+y<26)c=light}else if(p.finish==='outline'&&(!inside(x-1,y)||!inside(x+1,y)||!inside(x,y-1)||!inside(x,y+1)))c=dark;else if(p.finish==='stripe'&&Math.abs(x+y-29)<2)c=light;return [x,y,c]});
const stamp=(art)=>{if(!art)return [];let [ox,oy,rows]=art,out=[];for(let j=0;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){let c=ink[rows[j][i]];if(!c)continue;let [x,y]=pacTransform(ox+i,oy+j,d);if(x>=0&&x<40&&y>=0&&y<40)out.push([x,y,c])}return out};
const face=stamp(eyes[p.eyes]),accessory=stamp(wear[p.accessory]);return {body:basePixels,eyes:face,accessory}}
export function pacPixels(value,d=3,f=0){let l=pacLayers(value,d,f),cells=new Map();for(let layer of [l.body,l.accessory,l.eyes])for(let [x,y,c] of layer)cells.set(y*40+x,c);return [...cells].map(([k,c])=>[k%40,k/40|0,c])}
export function paintPac(ctx,value,d,f){ctx.clearRect(0,0,40,40);for(let [x,y,color] of pacPixels(value,d,f)){ctx.fillStyle=color;ctx.fillRect(x,y,1,1)}}
