import * as T from 'three';import {V,mesh,group,box,bevel,material,label} from './geometry.js';import {smooth} from './math.js';
const drinks=[{name:'COLA',color:[142,43,36],stripe:'#eee0c0'},{name:'LEMON',color:[171,149,49],stripe:'#f0e6a4'},{name:'TONIC',color:[58,115,104],stripe:'#d1e4ce'},{name:'WATER',color:[65,103,153],stripe:'#e2edf0'}];
export function createVending(scene,x,z,yaw){
 const g=group(scene,x,0,z,yaw),red=material([109,45,38],.62,.12,15),dark=material([34,38,39],.73,.1),silver=material([167,173,171],.33,.7,10),ivory=material([207,202,183],.7),rack=material([82,86,81],.48,.35);
 const glass=new T.MeshPhysicalMaterial({color:0xe1e8e5,transparent:true,opacity:.12,roughness:.08,metalness:0,depthWrite:false});
 const colors=drinks.map(d=>material(d.color,.32,.38,7)),stock=[4,4,4,4],columns=drinks.map(()=>[]),lights=[];
 // Open-front cabinet: recessed stock, real shelf depth, separate delivery pocket.
 bevel(g,red,.98,1.98,.12,0,1.04,-.32,.025);for(const sign of [-1,1])bevel(g,red,.10,1.98,.76,sign*.44,1.04,.04,.019);
 bevel(g,red,.98,.14,.76,0,1.96,.04,.025);bevel(g,red,.98,.10,.76,0,.10,.04,.02);
 bevel(g,dark,.78,.17,.52,0,.22,.12,.02);box(g,dark,.66,.33,.22,-.105,.37,-.04);
 bevel(g,red,.98,.12,.73,0,.62,.04,.015);bevel(g,red,.98,.10,.73,0,1.80,.04,.015);
 box(g,dark,.68,1.11,.045,-.10,1.22,-.22);
 for(let j=0;j<4;j++){const y=.79+j*.24;box(g,rack,.66,.035,.49,-.10,y,.038);box(g,silver,.66,.026,.022,-.10,y+.026,.28)}
 function can(parent,i,x=0,y=0,z=0){const q=group(parent,x,y,z),mat=colors[i];mesh(q,new T.CylinderGeometry(.040,.041,.126,24),mat);for(const sy of [-1,1]){mesh(q,new T.CylinderGeometry(.037,.037,.005,24),silver,0,sy*.064,0);const ring=mesh(q,new T.TorusGeometry(.0345,.002,6,24),silver,0,sy*.066,0);ring.rotation.x=Math.PI/2}const tab=bevel(q,silver,.017,.003,.027,0,.068,.005,.003);label(q,drinks[i].name,.059,.031,0,.009,.042,drinks[i].stripe,'#292d29');return q}
 for(let i=0;i<4;i++)for(let j=0;j<4;j++){const y=.79+j*.24+.084;columns[i].push(can(g,i,-.345+i*.16,y,.11))}
 const pane=box(g,glass,.66,1.13,.012,-.10,1.215,.337);pane.castShadow=false;pane.renderOrder=6;
 for(const sx of [-.438,.239])box(g,silver,.025,1.19,.024,sx,1.215,.35);
 label(g,'REFRESHMENTS',.75,.087,0,1.904,.432,'#7b3027','#e7ddcb');
 // Recessed keypad and small change/payment panel.
 bevel(g,dark,.20,1.13,.12,.34,1.22,.335,.012);const cv=document.createElement('canvas');cv.width=384;cv.height=128;const ctx=cv.getContext('2d'),tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;
 mesh(g,new T.PlaneGeometry(.164,.069),new T.MeshBasicMaterial({map:tex}),.34,1.63,.401).castShadow=false;
 for(let i=0;i<4;i++){const y=1.47-i*.125;bevel(g,ivory,.137,.082,.017,.337,y,.405,.008);label(g,drinks[i].name,.105,.038,.337,y,.416,'#d0cbbb','#282b28');const l=new T.MeshBasicMaterial({color:0x393d35});mesh(g,new T.SphereGeometry(.008,8,6),l,.415,y,.421);lights.push(l)}
 box(g,silver,.12,.033,.012,.34,.89,.409);box(g,dark,.058,.008,.014,.34,.89,.418);bevel(g,dark,.10,.057,.02,.34,.78,.406,.008);
 // Dispenser tray with moving flap and actual animated can inside it.
 for(const sx of [-.421,.216])box(g,red,.045,.33,.53,sx,.40,.085);box(g,rack,.65,.035,.40,-.102,.235,.13);box(g,silver,.65,.035,.025,-.102,.25,.345);
 const flap=group(g,-.103,.555,.345);bevel(flap,dark,.62,.28,.028,0,-.14,0,.01);label(flap,'PUSH / COLLECT',.36,.06,0,-.13,.018,'#262b2a','#b0b5a8');
 const lamp=new T.PointLight(0xece4c7,.50,1.1,2);lamp.position.set(-.1,1.68,.23);g.add(lamp);
 let selected=0,state='ready',timer=0,delivery=null,carried=null,flapAngle=0;
 function display(){ctx.fillStyle='#111b13';ctx.fillRect(0,0,384,128);ctx.fillStyle='#c7d98b';ctx.font='bold 36px monospace';ctx.fillText(state==='dispensing'?'DISPENSING':state==='collect'?'COLLECT DRINK':drinks[selected].name,12,45);ctx.font='25px monospace';ctx.fillText(state==='ready'?(stock[selected]?'AVAILABLE  '+stock[selected]:'SOLD OUT'):'PLEASE WAIT',12,101);tex.needsUpdate=true;lights.forEach((l,i)=>l.color.set(i===selected?0xaac76c:0x393d35))}
 function cycle(){if(state!=='ready')return;selected=(selected+1)%4;display()}
 function use(hand){if(state==='dispensing')return false;if(state==='collect'){if(carried){carried.parent?.remove(carried);carried=null}carried=delivery;delivery=null;hand.add(carried);carried.position.set(0,-.087,.072);carried.rotation.set(0,0,Math.PI/2);state='ready';display();return true}if(!stock[selected]){display();return false}
  stock[selected]--;columns[selected][stock[selected]].visible=false;delivery=can(g,selected,-.345+selected*.16,.79+stock[selected]*.24+.084,.11);timer=0;state='dispensing';display();return true
 }
 function update(dt){if(state==='dispensing'){timer+=dt;const u= Math.min(1,timer/1.25);delivery.position.x=(-.345+selected*.16)*(1-smooth(u))-.10*smooth(u);delivery.position.y=.29+(.79+stock[selected]*.24+.084-.29)*(1-smooth(u));delivery.position.z=.11+.11*smooth(u);delivery.rotation.z=Math.sin(Math.PI*u)*2.7;if(u>=1){state='collect';delivery.rotation.set(0,0,Math.PI/2);display()}}const target=state==='collect'?-1.05:state==='dispensing'?-.28:0;flapAngle+=(target-flapAngle)*(1-Math.exp(-dt*9));flap.rotation.x=flapAngle}
 function reset(){if(delivery)delivery.parent?.remove(delivery);if(carried)carried.parent?.remove(carried);delivery=carried=null;stock.fill(4);for(const col of columns)for(const q of col)q.visible=true;selected=0;state='ready';timer=0;flapAngle=0;flap.rotation.x=0;display()}
 display();return {g,position:V(x,0,z),cycle,use,update,reset,get carrying(){return !!carried},get state(){return {mode:state,selected:drinks[selected].name,stock:stock.slice()}},get prompt(){return state==='collect'?'COLLECT '+drinks[selected].name:state==='dispensing'?'DISPENSING…':'VEND '+drinks[selected].name+(stock[selected]?'':' / SOLD OUT')}};
}
