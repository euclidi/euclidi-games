
export const DEATH_DURATION=2,DEATH_HOLD=.35,DEATH_STEP=.09;
export function deathFrame(timer){let elapsed=DEATH_DURATION-timer;return elapsed<DEATH_HOLD?-1:Math.min(12,Math.floor((elapsed-DEATH_HOLD)/DEATH_STEP))}
// Material-space ghost silhouette. The three scallops are fixed in the fabric;
// one coherent deformation carries the head, face, shoulders and hem together.
export const GHOST_BASE=["0000000000000000","0000011111100000","0001111111111000","0011111111111100","0011111111111100","0111111111111110","0111111111111110","0111111111111110","0111111111111110","0111111111111110","0111111111111110","0111111111111110","0111111111111110","0111101111011110","0011000110001100","0000000000000000"];
export const GHOST_OFFSETS=[[0,0,0,0,0,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,0,0,0,0,0,0,0,0,0,0,0,-1,-1,-1,-1],[1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],[1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],[-1,-1,-1,-1,0,0,0,0,0,0,0,0,0,0,0,0],[-1,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0,0,0],[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,0,0,0],[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]];
export const GHOST_CYCLE_TILES=6.4;
export function ghostFrame(distance=0,phase=0){let n=Math.floor((distance/GHOST_CYCLE_TILES+phase)*GHOST_OFFSETS.length+1e-9);return ((n%GHOST_OFFSETS.length)+GHOST_OFFSETS.length)%GHOST_OFFSETS.length}
export function ghostShift(y,frame){return GHOST_OFFSETS[((frame%GHOST_OFFSETS.length)+GHOST_OFFSETS.length)%GHOST_OFFSETS.length][y]??0}
export const ghostMasks=GHOST_OFFSETS.map((offsets)=>GHOST_BASE.map((row,y)=>Array.from({length:16},(_,x)=>row[x-offsets[y]]??'0').join('')));
export function ghostBodyRow(y,frame){return ghostMasks[((frame%ghostMasks.length)+ghostMasks.length)%ghostMasks.length][y]??null}
export function deathPixels(frame){let pixels=[];if(frame>=12)return pixels;if(frame<=9){let spread=(frame+1)*Math.PI/10;for(let y=1;y<=14;y++)for(let x=1;x<=14;x++){let a=x-7.5,b=y-7.5,angle=Math.atan2(a,-b);if(a*a+b*b<49&&Math.abs(angle)>=spread)pixels.push([x,y])}}else{let r=frame===10?4:6;for(let k=0;k<8;k++)for(let j=0;j<2;j++){let t=k*Math.PI/4,x=Math.round(7.5+Math.cos(t)*(r+j)),y=Math.round(7.5+Math.sin(t)*(r+j));if(x>=0&&x<16&&y>=0&&y<16)pixels.push([x,y])}}return pixels}
