
export const DEATH_DURATION=2,DEATH_HOLD=.35,DEATH_STEP=.09;
export function deathFrame(timer){let elapsed=DEATH_DURATION-timer;return elapsed<DEATH_HOLD?-1:Math.min(12,Math.floor((elapsed-DEATH_HOLD)/DEATH_STEP))}
// Three flowing scallops. Only the bottom three scanlines change; the upper body never shifts.
export const skirts=[["11111111111111","11011100111011","10001100110001"],["11111111111111","11001110111001","11001100011000"],["11111111111111","11101110011100","11000110001000"],["11111111111111","11100111001110","01100110001100"],["11111111111111","01110111101110","01100011000110"],["11111111111111","01110011100111","00110001100110"],["11111111111111","00111001110111","00010001100011"],["11111111111111","10011101110011","00011000110011"]];
export const GHOST_CYCLE_TILES=2.4;
export function ghostFrame(distance=0,phase=0){let n=Math.floor((distance/GHOST_CYCLE_TILES+phase)*skirts.length+1e-9);return ((n%skirts.length)+skirts.length)%skirts.length}
export function skirtRow(y,frame){return y>=11&&y<14?skirts[((frame%skirts.length)+skirts.length)%skirts.length][y-11]:null}
export function deathPixels(frame){let pixels=[];if(frame>=12)return pixels;if(frame<=9){let spread=(frame+1)*Math.PI/10;for(let y=1;y<=14;y++)for(let x=1;x<=14;x++){let a=x-7.5,b=y-7.5,angle=Math.atan2(a,-b);if(a*a+b*b<49&&Math.abs(angle)>=spread)pixels.push([x,y])}}else{let r=frame===10?4:6;for(let k=0;k<8;k++)for(let j=0;j<2;j++){let t=k*Math.PI/4,x=Math.round(7.5+Math.cos(t)*(r+j)),y=Math.round(7.5+Math.sin(t)*(r+j));if(x>=0&&x<16&&y>=0&&y<16)pixels.push([x,y])}}return pixels}
