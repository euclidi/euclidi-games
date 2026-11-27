// Hand-rasterized sprite clusters; all materials are local bitmap textures.
const C={'.':null,k:'#11131a',o:'#242732',d:'#343b46',m:'#4d5963',l:'#657780',h:'#8c9999',b:'#332b26',B:'#514237',t:'#8c7764',T:'#b3a08a',e:'#d2c9ae',r:'#ae423d',R:'#ef7952',g:'#556448',G:'#819369',s:'#858c8f',S:'#c0c7bf',n:'#182028',N:'#394850',w:'#ffe0a1'};
const hood=[
'........kkkkkkkk........','......kkooddddookk......','.....kodmmmmmmmmdok.....','....kodmllllllmmdook....','...kodmllhllllmmdook....','...kodmllhllllmmdook....','...kodmllmddddmmdook....','..kodmllmkkkkmmdmook....','..kodmlmkkttkkmdmook....','..kodmlmkTeeTkmdmook....','..kodmlmkbttbkmdmook....','..kodmmdkbbbkmmdoook....','...kodmmkkkkmmmdoook....','...kodmmdddddmmdoook....','....kodmmmmmmmdook......','.....kkodddddookk.......'];
const coat=[
'.......kkkddkkk.........','.....kkoddddddo kk......'.replace(' ',''),'....kodmmmmmmmmmdok.....','...kodmllmmmmllmmdok....','..kodmllmddddmllmdook...','..kodmmmdgGGgdmmmdook...','..kodmmmdgGGgdmmmdook...','..kodmmmdggGgdmmmdook...','..kodmmmdggggdmmmdook...','..kodmmmmddddmmmdook....','...kodmmmbbbbmmmdook....','...kodmmmbBBbmmmdook....','...kodmmmmmmmmmdook.....','...kodmmddddmmmdook.....','....koddddddddoook......','....kkkddkkddkkkk.......'];
const leg=['kkooddkk','kodmmdok','kodmmdok','kodmmdok','kodmmdok','kodmmdok','kodddook','kodddook','kbbbbbok','kBBBBBbk','kkkkkkkk'];
function stamp(c,rows,x,y,tint={}){for(let j=0;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){let v=rows[j][i],col=tint[v]||C[v];if(col){c.fillStyle=col;c.fillRect(x+i,y+j,1,1)}}}
function sprite(w,h,fn){let a=document.createElement('canvas');a.width=w;a.height=h;let c=a.getContext('2d');c.imageSmoothingEnabled=false;fn(c);return a}
export function soldierArt(type,pose=0){return sprite(32,48,c=>{let tint=type===1?{d:'#564449',m:'#736063',l:'#90777a',h:'#b19b9a'}:type===2?{d:'#3b4742',m:'#566758',l:'#72846a',h:'#a1aa84'}:{};let walking=pose===1?1:pose===2?-1:0;stamp(c,leg,7,30+walking,tint);stamp(c,leg,17,30-walking,tint);stamp(c,coat,4,15,tint);stamp(c,hood,4,0,tint);stamp(c,['..kk........kk..','..bB........Bb..','..bB........Bb..','..bB........Bb..'],8,19);stamp(c,['kkkkkkkkkkkk','bBBBBBBBBBBb','kbkbbkbbkbkk'],10,28);
 // Fold highlights and webbing, leather gloves and abstract service weapon across torso.
 stamp(c,['kkk','bBk','bBk','kBk','kkk'],5,23);stamp(c,['kkkkkkkkkkkk','ksSSssssssnk','knNNNNNNNNnk','kkkkkkkkkkkk','....kbbk....','....kkkk....'],12,23);
 stamp(c,['.kkk.','kbBBk','kbBBk','.kkk.'],23,25);
 if(pose===3){stamp(c,['..w..','.wRw.','wRrRw','.wRw.','..w..'],27,22)}
 grainLayer(c,32,48,18+type);if(pose===4){c.globalCompositeOperation='source-atop';c.fillStyle='#a74735aa';c.fillRect(0,0,32,48);c.globalCompositeOperation='source-over'}
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
function legacyWeaponArt(i){return sprite(28,24,c=>stamp(c,i===0?pist:longGun,2,1,i===1?{N:'#75624e',n:'#493b31',s:'#5e6465',S:'#929c9c'}:i===2?{N:'#3e5156',n:'#202b30'}:{}))}

// Original indexed-look, multi-layer weapon raster artwork. All geometry is rasterized
// once at native sprite resolution; material scratches and hardware remain fixed.
function poly(c,col,pts){c.fillStyle=col;c.beginPath();c.moveTo(...pts[0]);for(let p of pts.slice(1))c.lineTo(...p);c.closePath();c.fill()}
function box(c,x,y,w,h,base,hi,lo){c.fillStyle=base;c.fillRect(x,y,w,h);c.fillStyle=hi;c.fillRect(x,y,w,1);c.fillRect(x,y,1,h);c.fillStyle=lo;c.fillRect(x,y+h-1,w,1);c.fillRect(x+w-1,y,1,h)}
function grainLayer(c,w,h,seed){let d=c.getImageData(0,0,w,h),a=d.data;for(let y=0;y<h;y++)for(let x=0;x<w;x++){let k=(y*w+x)*4;if(a[k+3]===0)continue;let n=(Math.imul(x+seed,73856093)^Math.imul(y+11,19349663))>>>0,delta=(n%13)-6;for(let j=0;j<3;j++)a[k+j]=Math.max(0,Math.min(255,a[k+j]+delta))}c.putImageData(d,0,0)}
export function weaponArt(i){return sprite(144,108,c=>{
 let pistol=i===0,shot=i===1,top=pistol?22:12,wide=pistol?12:shot?10:13,metal=shot?'#646865':'#535e61',dark='#242b2d',black='#14191a';
 // Sleeves, wrists and gloved hands are distinct layers with seams and knuckle folds.
 for(let side of [-1,1]){let flip=side===1;c.save();if(flip){c.translate(144,0);c.scale(-1,1)}
 poly(c,'#171e1e',[[0,108],[0,98],[28,75],[44,69],[61,86],[68,108]]);
 poly(c,'#35423c',[[0,108],[0,102],[32,79],[45,74],[58,87],[62,108]]);
 poly(c,'#4c5a50',[[4,105],[32,81],[40,78],[43,82],[20,104],[17,108]]);
 poly(c,'#262d28',[[32,83],[39,78],[50,91],[44,96]]);
 poly(c,'#171b1a',[[43,77],[47,62],[56,56],[66,63],[71,77],[67,96],[54,97]]);
 poly(c,'#524b3d',[[46,76],[50,65],[56,61],[64,66],[67,78],[64,91],[55,92]]);
 for(let j=0;j<4;j++){box(c,48+j*4,72+j%2*2,4,13,'#655c4b','#827662','#363329')}
 c.restore()}
 // Barrel and receiver taper away from the eye, with asymmetric controls.
 poly(c,black,[[72-wide,top],[72+wide,top],[95,79],[91,108],[51,108],[49,79]]);
 poly(c,dark,[[73-wide,top+2],[71+wide,top+2],[88,74],[86,104],[56,104],[55,74]]);
 poly(c,metal,[[74-wide,top+3],[70+wide,top+3],[83,70],[61,70]]);
 poly(c,'#858e89',[[74-wide,top+3],[76-wide,top+3],[65,66],[61,70]]);
 poly(c,'#303b3e',[[70+wide,top+4],[72+wide,top+5],[88,74],[83,70]]);
 box(c,69,top-4,6,8,'#242e30','#a1a8a0','#171b1c');
 if(pistol){box(c,64,47,16,12,'#323a3c','#8d9690','#171c1d');box(c,67,50,10,5,'#161d20','#626d6e','#0e1214');for(let j=0;j<5;j++){box(c,60+j*4,62,2,9,'#303b3b','#717a75','#141a1b')}}
 else if(shot){poly(c,'#72563d',[[61,47],[83,47],[87,73],[57,73]]);for(let j=0;j<6;j++){c.fillStyle=j%2?'#493c2e':'#937457';c.fillRect(60,49+j*4,24,2)}box(c,69,15,6,30,'#373f3e','#7c8780','#161a1b')}
 else{for(let j=0;j<7;j++){box(c,60,27+j*5,24,3,'#222a2c','#65716e','#14191a')}box(c,67,44,10,20,'#3a4745','#7c8880','#182020');box(c,85,71,8,5,'#353d3b','#91988b','#101719')}
 box(c,59,77,26,16,'#333b3a','#7b8681','#151b1b');box(c,63,80,18,8,'#4b5754','#8a958c','#202829');
 box(c,60,89,24,19,'#222b2b','#535e59','#111717');box(c,66,94,12,14,'#303b38','#606c62','#151b1a');
 for(let x of [62,81]){box(c,x,79,3,3,'#737b73','#b0b5a9','#252b2a')}
 grainLayer(c,144,108,41+i)
})}
export function corpseArt(type){return sprite(48,16,c=>{let coat=['#444f55','#625154','#46564c'][type];poly(c,'#15191a',[[1,10],[8,5],[17,5],[23,2],[34,3],[39,5],[46,8],[45,12],[32,14],[16,13],[5,14]]);poly(c,coat,[[9,7],[22,4],[34,5],[39,8],[32,12],[16,11]]);poly(c,'#293333',[[17,7],[26,6],[32,9],[23,11]]);box(c,3,9,12,4,'#352e28','#635442','#171b1b');box(c,35,7,9,6,coat,'#68756c','#222a29');box(c,39,8,4,3,'#9a8875','#b3a48d','#3d3830');box(c,20,9,12,3,'#303638','#727a76','#171c1d');grainLayer(c,48,16,type+9)})}
