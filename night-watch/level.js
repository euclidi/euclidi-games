// Mission 01: Relay Station. Rectangular rooms joined by deliberately placed doorways.
export const W=29,H=23;
export const rooms=[
 {name:'01 / INSERTION',x:1,y:1,w:5,h:5,material:1},
 {name:'02 / SECURITY CHECKPOINT',x:10,y:7,w:5,h:5,material:0},
 {name:'03 / ARMORY',x:10,y:1,w:5,h:5,material:3},
 {name:'04 / STORAGE HALL',x:17,y:6,w:9,h:7,material:2},
 {name:'05 / INFIRMARY',x:17,y:1,w:4,h:3,material:1},
 {name:'06 / RECORDS OFFICE',x:22,y:15,w:5,h:5,material:0},
 {name:'07 / EXTRACTION',x:14,y:17,w:5,h:4,material:1}
];
export const spawn={x:2.5,y:3.5,a:0},exit={x:15.5,y:18.5};
export const keyPosition={x:25.5,y:17.5};
export const guardPositions=[[13.5,9.5,0,Math.PI],[13.5,2.5,1,Math.PI/2],[19.5,7.5,0,Math.PI],[24.5,8.5,1,Math.PI],[23.5,11.5,2,Math.PI],[18.5,2.5,0,Math.PI/2],[25.5,15.5,1,Math.PI/2],[23.5,18.5,2,0]];
export const supplies=[[4.5,2.5,'light'],[4.5,4.5,'armor'],[10.5,10.5,'light'],[11.5,2.5,'shellgun'],[12.5,2.5,'shells'],[13.5,4.5,'shells'],[18.5,8.5,'light'],[24.5,6.5,'repeater'],[24.5,11.5,'armor'],[18.5,1.5,'med'],[19.5,1.5,'med'],[25.5,17.5,'key'],[16.5,19.5,'med']];
export const fixtures=[[3.5,3.5],[7.5,6.5],[11.5,8.5],[13.5,10.5],[12.5,3.5],[16.5,9.5],[18.5,8.5],[22.5,7.5],[24.5,11.5],[18.5,2.5],[24.5,14.5],[24.5,17.5],[20.5,18.5],[16.5,18.5]];
export const signs=[
 {x:6,y:3,side:0,label:['01','INSERTION','EXIT  >']},
 {x:8,y:6,side:0,label:['02','SECURITY','CONTINUE  >']},
 {x:15,y:8,side:0,label:['02','SECURITY','STORAGE  >']},
 {x:12,y:0,side:1,label:['03','ARMORY','AUTHORIZED ONLY']},
 {x:26,y:9,side:0,label:['04','STORAGE','RELAY STATION']},
 {x:18,y:0,side:1,label:['05','INFIRMARY','FIRST AID']},
 {x:27,y:17,side:0,label:['06','RECORDS','ACCESS CARD']},
 {x:14,y:16,side:1,label:['07','EXTRACTION','SERVICE EXIT']},
 {x:13,y:18,side:0,label:['07','EXIT','CARD REQUIRED']}
];
export function roomAt(x,y){return rooms.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)||{name:'SERVICE CORRIDOR',material:1}}
export function makeMap(){let a=Array.from({length:H},()=>Array(W).fill('#'));const carve=(x,y,w,h)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)a[j][i]='.'};
 for(const r of rooms)carve(r.x,r.y,r.w,r.h);
 carve(5,4,3,1);carve(7,4,1,5);carve(7,8,4,1);
 carve(12,5,1,3);carve(14,9,4,1);carve(18,3,1,4);
 carve(24,12,1,4);carve(18,18,5,1);
 for(const [x,y] of [[20,8],[22,10],[25,8]])a[y][x]='P';
 a[Math.floor(exit.y)][Math.floor(exit.x)]='X';
 return a.map(r=>r.join(''))
}
