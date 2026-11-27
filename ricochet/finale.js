// Pure cinematic logic. World-space units; elapsed time is wall-clock seconds.
export const prizes=[10000,25000,100000,25000,10000];
export function prizeIndex(x,w=768){return Math.max(0,Math.min(4,Math.floor(x/w*5)))}
export function newFinale(){return {phase:"idle",time:0,cooldown:0,zoom:1,cx:384,cy:288,rate:1,hitX:384,hitY:288,bonus:0,landings:0}}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function cameraStep(s,dt,target,balls,enabled=true){
 s.cooldown=Math.max(0,s.cooldown-dt);s.time+=dt;
 const nearest=target&&balls.length?balls.reduce((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)<Math.hypot(b.x-target.x,b.y-target.y)?a:b):null;
 if(s.phase==="idle"&&enabled&&s.cooldown===0&&nearest){
 const dx=target.x-nearest.x,dy=target.y-nearest.y,d=Math.hypot(dx,dy),approach=dx*nearest.vx+dy*nearest.vy;
 if(d<118&&(approach>0||d<35)){s.phase="approach";s.time=0;}
 }
 if(s.phase==="approach"&&(!nearest||!enabled||s.time>1.75||(s.time>.26&&Math.hypot(nearest.x-target.x,nearest.y-target.y)>125))){s.phase="recover";s.time=0;s.cooldown=.65;}
 if(s.phase==="hit"&&s.time>.70){s.phase="fever";s.time=0}
 if(s.phase==="recover"&&s.time>.38){s.phase="idle";s.time=0}
 const close=s.phase==="approach"&&nearest&&target, hit=s.phase==="hit";
 const z=enabled?(close?1.85:hit?1.65:1):1;
 const rate=enabled?(close?.22:hit?.18:1):1;
 const cx=close?(nearest.x+target.x)/2:hit?s.hitX:384;
 const cy=close?(nearest.y+target.y)/2:hit?s.hitY:288;
 const alpha=1-Math.exp(-dt*11);
 s.zoom+=(z-s.zoom)*alpha;s.rate+=(rate-s.rate)*alpha;
 s.cx+=(clamp(cx,384/z,768-384/z)-s.cx)*alpha;
 s.cy+=(clamp(cy,288/z,576-288/z)-s.cy)*alpha;
 if(!enabled){s.zoom=1;s.cx=384;s.cy=288;s.rate=1}
 return s
}
export function finalHit(s,x,y){if(s.phase==="hit"||s.phase==="fever")return;s.phase="hit";s.time=0;s.hitX=x;s.hitY=y}
export function finalActive(s){return s.phase==="hit"||s.phase==="fever"}
export function scoreLanding(s,x,w=768){const i=prizeIndex(x,w),amount=prizes[i];s.bonus+=amount;s.landings++;return {i,amount}}
