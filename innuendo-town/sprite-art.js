// Verified against enlarged original Kenney Urban atlas (432x288, CC0).
// Each character uses three rows: standing, step A, step B.
// Columns 23..26 are LEFT, FRONT (down), BACK (up), RIGHT.
export const DIR_COL=Object.freeze({left:23,down:24,up:25,right:26});
export const WALK_ROWS=Object.freeze([0,1,0,2]);
export function facing(dx,dy,previous='down'){
 if(Math.abs(dx)+Math.abs(dy)<.08)return previous;
 return Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
}
export function characterFrame(look,dir,phase=0){
 const base=Math.max(0,Math.min(5,Math.trunc(look)||0))*3;
 return (base+WALK_ROWS[Math.floor(Math.max(0,phase))%4])*27+DIR_COL[dir];
}
// Whole native sprites, not neighboring tiles. The yellow/red vertical
// overhead cars occupy 16x22 pixels; green horizontal variants occupy 32x16.
export const CAR_FRAMES=Object.freeze({
 'yellow-down':{x:272,y:234,w:16,h:22},
 'red-down':{x:272,y:266,w:16,h:22},
 'green-left':{x:336,y:256,w:32,h:16},
 'green-right':{x:336,y:272,w:32,h:16}
});
export function vehiclePose(color,dir){
 if(color==='green')return {frame:dir<0?'green-left':'green-right',angle:0};
 return {frame:color+'-down',angle:dir<0?90:-90};
}
