// Asset selections audited in the original 57×31, 16px + 1px gutter atlas.
// Use complete cells; recolour source pixels once per tile/palette to harmonize
// with the town's subdued colours. No stretch or generated replacement icons.
const cache=new Map();
const ramps={warm:[.95,.92,.86],steel:[.80,.89,.92],green:[.72,.86,.70],cloth:[.91,.80,.87],wood:[.91,.85,.76]};
export function shipmentTile(c,atlas,col,row,x,y,palette='warm'){
 const key=col+':'+row+':'+palette;let tile=cache.get(key);
 if(!tile){tile=document.createElement('canvas');tile.width=tile.height=16;let t=tile.getContext('2d',{willReadFrequently:true});t.imageSmoothingEnabled=false;t.drawImage(atlas,col*17,row*17,16,16,0,0,16,16);
 const image=t.getImageData(0,0,16,16),p=image.data,ramp=ramps[palette]||ramps.warm;
 for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const lum=(p[i]*.3+p[i+1]*.55+p[i+2]*.15);for(let k=0;k<3;k++)p[i+k]=Math.round((p[i+k]*.72+lum*.28)*ramp[k]);}
 t.putImageData(image,0,0);cache.set(key,tile)}
 c.drawImage(tile,Math.round(x),Math.round(y));
}
export function shipmentPlant(c,atlas,x,y,i=0){c.fillStyle='#655f50';c.fillRect(x+3,y+11,10,7);c.fillStyle='#a48a69';c.fillRect(x+4,y+12,8,5);shipmentTile(c,atlas,[19,21,25][i%3],9,x,y,'green')}
export function shipmentRug(c,atlas,x,y,w,h,room){
 // Native nine-tile border pattern: neutral floor, wood or warm textile.
 const col=room===7?12:room===2||room===8?0:room===6?6:3,palette=room===7?'cloth':room===1||room===5?'steel':'warm';
 for(let j=0;j<h;j++)for(let i=0;i<w;i++)shipmentTile(c,atlas,col+(i===0?0:i===w-1?2:1),25+(j===0?0:j===h-1?2:1),x+i*16,y+j*16,palette);
}
export function shipmentFixture(c,atlas,x,y,w,h,room,index){
 // Different departments use whole cabinet, shelf, seat and stock cells.
 const tile=(col,row,xx,yy,p='warm')=>shipmentTile(c,atlas,col,row,x+xx*16,y+yy*16,p);
 if(room===2){for(let i=0;i<w;i++)tile(i%2?31:29,i%2?1:2,i,0,'wood')}
 else if(room===3){for(let i=0;i<w;i++)tile(i%2?28:30,0,i,0,'steel')}
 else if(room===4){for(let i=0;i<w;i++)tile(i%2?23:24,0,i,0,'wood')}
 else if(room===7){for(let i=0;i<w;i++)tile(i%2?21:19,2,i,0,'cloth')}
 else if(room===6){for(let i=0;i<w;i++)tile(29+(index+i)%3,10,i,0,'warm')}
 else if(room===8){for(let i=0;i<w;i++)tile(i%2?24:23,5,i,0,'wood')}
 else if(room===0){for(let i=0;i<w;i++)tile(i%2?28:29,0,i,0,'steel')}
 // Gym and carwash retain their modern custom equipment: medieval stock would
 // conflict with the setting. Use the source grey cabinet only on spare bay.
 else if(room===1&&index===4)tile(30,0,0,0,'steel');
 else if(room===5&&index>=2)tile(28,0,0,0,'steel');
}
