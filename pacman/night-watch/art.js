// Hand-rasterized sprite clusters; all materials are local bitmap textures.
const C={'.':null,k:'#11131a',o:'#242732',d:'#343b46',m:'#4d5963',l:'#657780',h:'#8c9999',b:'#332b26',B:'#514237',t:'#8c7764',T:'#b3a08a',e:'#d2c9ae',r:'#ae423d',R:'#ef7952',g:'#556448',G:'#819369',s:'#858c8f',S:'#c0c7bf',n:'#182028',N:'#394850',w:'#ffe0a1'};
const hood=[
'........kkkkkkkk........','......kkooddddookk......','.....kodmmmmmmmmdok.....','....kodmllllllmmdook....','...kodmllhllllmmdook....','...kodmllhllllmmdook....','...kodmllmddddmmdook....','..kodmllmkkkkmmdmook....','..kodmlmkkttkkmdmook....','..kodmlmkTeeTkmdmook....','..kodmlmkbttbkmdmook....','..kodmmdkbbbkmmdoook....','...kodmmkkkkmmmdoook....','...kodmmdddddmmdoook....','....kodmmmmmmmdook......','.....kkodddddookk.......'];
const coat=[
'.......kkkddkkk.........','.....kkoddddddo kk......'.replace(' ',''),'....kodmmmmmmmmmdok.....','...kodmllmmmmllmmdok....','..kodmllmddddmllmdook...','..kodmmmdgGGgdmmmdook...','..kodmmmdgGGgdmmmdook...','..kodmmmdggGgdmmmdook...','..kodmmmdggggdmmmdook...','..kodmmmmddddmmmdook....','...kodmmmbbbbmmmdook....','...kodmmmbBBbmmmdook....','...kodmmmmmmmmmdook.....','...kodmmddddmmmdook.....','....koddddddddoook......','....kkkddkkddkkkk.......'];
const leg=['kkooddkk','kodmmdok','kodmmdok','kodmmdok','kodmmdok','kodmmdok','kodddook','kodddook','kbbbbbok','kBBBBBbk','kkkkkkkk'];
function stamp(c,rows,x,y,tint={}){for(let j=0;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){let v=rows[j][i],col=tint[v]||C[v];if(col){c.fillStyle=col;c.fillRect(x+i,y+j,1,1)}}}
function sprite(w,h,fn){let a=document.createElement('canvas');a.width=w;a.height=h;let c=a.getContext('2d');c.imageSmoothingEnabled=false;fn(c);return a}
export function soldierArt(type,pose=0){return sprite(32,48,c=>{let tint=type===1?{d:'#564449',m:'#736063',l:'#90777a',h:'#b19b9a'}:type===2?{d:'#3b4742',m:'#566758',l:'#72846a',h:'#a1aa84'}:{};let walking=pose===1?1:pose===2?-1:0;stamp(c,leg,7,34+walking,tint);stamp(c,leg,17,34-walking,tint);stamp(c,coat,4,17,tint);stamp(c,hood,4,1,tint);
 // Fold highlights and webbing, leather gloves and abstract service weapon across torso.
 stamp(c,['kkk','bBk','bBk','kBk','kkk'],5,23);stamp(c,['kkkkkkkkkkkk','ksSSssssssnk','knNNNNNNNNnk','kkkkkkkkkkkk','....kbbk....','....kkkk....'],12,23);
 stamp(c,['.kkk.','kbBBk','kbBBk','.kkk.'],23,25);
 if(pose===3){stamp(c,['..w..','.wRw.','wRrRw','.wRw.','..w..'],27,22)}
 if(pose===4){c.globalCompositeOperation='source-atop';c.fillStyle='#a74735aa';c.fillRect(0,0,32,48);c.globalCompositeOperation='source-over'}
})}
const itemArt={
 light:['...kkkkkkkk...','..kBBBBBBBBk..','.kBSSSSSSSSBk.','.kBsSsSsSsSBk.','.kBsSsSsSsSBk.','.kBBBBBBBBBBk.','..kkkkkkkkkk..'],
 shells:['..kkkkkkkk....','.kRRRRRRRRk...','.krRrRrRrRk...','.krRrRrRrRk...','.kSSSSSSSSk...','..kkkkkkkk....'],
 med:['.kkkkkkkkkkkk.','kSSSSSSSSSSSSk','kSllwlllllllSk','kSllrrrlllllSk','kSrrrrrrrlllSk','kSllrrrlllllSk','kSSSSSSSSSSSSk','.kkkkkkkkkkkk.'],
 armor:['...kk....kk...','..kGGkkkkGGk..','.kGggGGGGggGk.','.kGggGGGGggGk.','.kGggGGGGggGk.','..kGGGGGGGGk..','...kkkkkkkk...'],
 key:['.kkkkkkkkkkkk.','kGSSSSSSSSSSGk','kGSwweeeSSSSGk','kGSSSSSSnnnSGk','kGGGGGGGGGGGGk','.kkkkkkkkkkkk.'],
 shellgun:['........kkkkkk','...kkkkksSSSsk','..kbBBBsSSSsk.','.kbBBbkkkkkk..','kBBbkk........','kkk...........'],
 repeater:['.......kkkkkkk','..kkkkksSSSSsk','.kbNNNNNNNNNkk','kbkkkNkkk.....','kk..kNk.......','....kkk.......'],
 exit:['.kkkkkkkkkkkk.','kGGGGGGGGGGGGk','kGkGGGGGGGGkGk','kGkGGGGGGGGkGk','kGGGGGGGGGGGGk','.kkkkkkkkkkkk.']
};
export function pickupArt(type){return sprite(16,12,c=>stamp(c,itemArt[type]||itemArt.light,1,2))}
const pist=[
'........kkkkkkkk........','.......ksSSSSssk........','.......ksSSSSssk........','.......ksSSSSssk........','.......ksSSSSssk........','.......knNNNNNnk........','......knNNNNNNNnk.......','......knNNNNNNNnk.......','......knNNNNNNNnk.......','.....kkkNNNNNNkkkk......','....kbBBkNNNNkBBbkk.....','...kbTTBbkkkkbBTTbkk....','..kbTTTTBbkkbBTTTTbkk...','..kbTTTTTBbbBTTTTTbkk...','.kbTTTTTTBBBBTTTTTTbkk..','.kbTTTTTTBBBBTTTTTTbkk..','kbTTTTTTBBBBBBTTTTTTbkk.','kbTTTTTBBBBBBBBTTTTTbkk.','kBBBBBBBBBBBBBBBBBBBBkk.','kkkkkkkkkkkkkkkkkkkkkkk.'];
const longGun=[
'..........kkkk...........','.........ksSSsk..........','.........ksSSsk..........','.........ksSSsk..........','........kssSSssk.........','........kssSSssk.........','........knNNNNnk.........','........knNNNNnk.........','.......knNNNNNNnk........','.......knNNNNNNnk........','......knNNNNNNNNnk.......','......knNNNNNNNNnk.......','.....kkknNNNNNNkkk.......','....kbBBknNNNNkBBbkk.....','...kbTTTBkNNNkBTTTbkk....','..kbTTTTTBkkkBTTTTTbkk...','..kbTTTTTTBBBTTTTTTbkk...','.kbTTTTTTTBBBTTTTTTTbkk..','kbTTTTTTTBBBBBTTTTTTTbkk.','kBBBBBBBBBBBBBBBBBBBBBkk.','kkkkkkkkkkkkkkkkkkkkkkkk.'];
export function weaponArt(i){return sprite(28,24,c=>stamp(c,i===0?pist:longGun,2,1,i===1?{N:'#75624e',n:'#493b31',s:'#5e6465',S:'#929c9c'}:i===2?{N:'#3e5156',n:'#202b30'}:{}))}
