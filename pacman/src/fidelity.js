
export const DEATH_DURATION=2,DEATH_HOLD=.35,DEATH_STEP=.09;
export function deathFrame(timer){let elapsed=DEATH_DURATION-timer;return elapsed<DEATH_HOLD?-1:Math.min(12,Math.floor((elapsed-DEATH_HOLD)/DEATH_STEP))}
// Two centered, hand-rasterized arcade-style poses. The head and face stay fixed.
export const ghostMasks=[["0000000000000000","0000001111000000","0000111111110000","0001111111111000","0011111111111100","0011111111111100","0011111111111100","0111111111111110","0111111111111110","0111111111111110","0111111111111110","0111111111111110","0111111111111110","0110111001110110","0100011001100010","0000000000000000"],["0000000000000000","0000001111000000","0000111111110000","0001111111111000","0011111111111100","0011111111111100","0011111111111100","0111111111111110","0111111111111110","0111111111111110","0111111111111110","0111111111111110","0111111111111110","0111101111011110","0011000110001100","0000000000000000"]];
export const GHOST_FRAME_TICKS=8;
export function ghostFrame(ticks=0){return Math.floor(Math.max(0,ticks)/GHOST_FRAME_TICKS)%2}
export function ghostBodyRow(y,frame){return ghostMasks[((frame%2)+2)%2][y]??null}
export function deathPixels(frame){let pixels=[];if(frame>=12)return pixels;if(frame<=9){let spread=(frame+1)*Math.PI/10;for(let y=1;y<=14;y++)for(let x=1;x<=14;x++){let a=x-7.5,b=y-7.5,angle=Math.atan2(a,-b);if(a*a+b*b<49&&Math.abs(angle)>=spread)pixels.push([x,y])}}else{let r=frame===10?4:6;for(let k=0;k<8;k++)for(let j=0;j<2;j++){let t=k*Math.PI/4,x=Math.round(7.5+Math.cos(t)*(r+j)),y=Math.round(7.5+Math.sin(t)*(r+j));if(x>=0&&x<16&&y>=0&&y<16)pixels.push([x,y])}}return pixels}
