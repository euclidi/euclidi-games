export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const types=[
{name:'Twisty',color:0xff639d,height:1.45,radius:.31,profile:0,hold:12,mass:.48},
{name:'Wobble',color:0x8c66ef,height:1.65,radius:.35,profile:1,hold:18,mass:.6},
{name:'Popper',color:0x4ed6b7,height:1.2,radius:.41,profile:2,hold:15,mass:.55},
{name:'Long John',color:0xffc447,height:1.85,radius:.25,profile:3,hold:20,mass:.45},
{name:'Bumpy',color:0x65afff,height:1.48,radius:.36,profile:4,hold:24,mass:.7},
{name:'Big Squeeze',color:0xff8654,height:1.5,radius:.45,profile:5,hold:29,mass:.85}
];
export function pullStep(o,force,twist,rock,pressure,friction,suction,dt){
const hold=o.hold*(.30+.40*friction+.30*suction)*(1-.62*o.loose);
const work=Math.abs(twist)*.35+Math.abs(rock)*.28;
o.loose=clamp(o.loose+(work*(.35+pressure*.65)-.016)*dt,0,1);
const capacity=12+pressure*45;
const transmitted=Math.min(force,capacity);
o.progress=clamp(o.progress+(Math.max(0,transmitted-hold)*.085-Math.max(0,hold-transmitted)*.012)*dt,0,1);
return {hold,transmitted,slip:force>capacity*1.38,free:o.progress>=1};
}
export function pointsFor(t,seconds,challenge){return Math.round(t.hold*10+(challenge?Math.max(0,80-seconds)*2:0))}
export function safeSave(storage,key,value){try{storage.setItem(key,JSON.stringify(value))}catch{}}
export function safeLoad(storage,key,defaultValue){try{return JSON.parse(storage.getItem(key))??defaultValue}catch{return defaultValue}}

// Missing controller inputs are false, never NaN.
export const digitalAxis=(positive,negative)=>Number(!!positive)-Number(!!negative);
