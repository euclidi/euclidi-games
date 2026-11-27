export function predictFoot(x,z,yaw,side,vx,vz,lead=.22,width=.135){return [x+Math.cos(yaw)*side*width+vx*lead,z-Math.sin(yaw)*side*width+vz*lead]}
export function swingCurve(u){u=Math.max(0,Math.min(1,u));return {progress:u*u*u*(u*(u*6-15)+10),lift:16*u*u*(1-u)*(1-u)}}
export function swivel(v,input,dt){return v+(input*2.4-v)*(1-Math.exp(-dt*(input===0?3.8:6)))}