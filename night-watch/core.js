// NIGHT WATCH: independent arcade shooter simulation, fixed-step, deterministic.
import {W,H,makeMap,spawn,exit,guardPositions,supplies,roomAt} from './level.js';
export {W,H,makeMap};
export const MAP=makeMap();
export const GUNS=[
 {name:'PISTOL',ammo:'light',capacity:12,damage:28,delay:.32,reload:1.05,range:10,spread:.022,pellets:1},
 {name:'SCATTERGUN',ammo:'shell',capacity:5,damage:17,delay:.72,reload:1.4,range:7.5,spread:.19,pellets:7},
 {name:'REPEATER',ammo:'light',capacity:24,damage:19,delay:.115,reload:1.35,range:10,spread:.048,pellets:1}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function solid(x,y,map=MAP){let r=map[Math.floor(y)],c=r?.[Math.floor(x)];return !c||c==='#'||c==='P'}
export function fits(x,y,r=.23,map=MAP){return [[-r,-r],[r,-r],[-r,r],[r,r]].every(([a,b])=>!solid(x+a,y+b,map))}
export function ray(x,y,dx,dy,map=MAP){let ix=Math.floor(x),iy=Math.floor(y),sx=dx<0?-1:1,sy=dy<0?-1:1,tx=dx===0?Infinity:Math.abs(1/dx),ty=dy===0?Infinity:Math.abs(1/dy),ax=dx===0?Infinity:(dx<0?x-ix:ix+1-x)*tx,ay=dy===0?Infinity:(dy<0?y-iy:iy+1-y)*ty;
 for(let i=0;i<64;i++){let d,side;if(ax<ay){d=ax;ax+=tx;ix+=sx;side=0}else{d=ay;ay+=ty;iy+=sy;side=1}if(solid(ix,iy,map)){let u=(side===0?y+dy*d:x+dx*d);return {d:Math.max(.025,d),u:u-Math.floor(u),side,ix,iy,cell:map[iy]?.[ix]||'#'}}}return {d:30,u:0,side:0,cell:'#'}}
export function clearSight(x,y,a,b,map=MAP){let d=Math.hypot(a-x,b-y);return d<.01||ray(x,y,(a-x)/d,(b-y)/d,map).d>=d-.04}
export function field(x,y,map=MAP){let q=[[Math.floor(x),Math.floor(y)]],dist=new Map([[q[0].join(','),0]]);for(let i=0;i<q.length;i++){let [a,b]=q[i],n=dist.get(a+','+b)+1;for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let xx=a+dx,yy=b+dy,k=xx+','+yy;if(!solid(xx,yy,map)&&!dist.has(k)){dist.set(k,n);q.push([xx,yy])}}}return dist}
export function createRun(emit=()=>{},difficulty='normal'){
 let seed=41293;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const p={...spawn,hp:100,armor:0,gun:0,owned:[true,false,false],mag:[12,0,0],reserve:{light:48,shell:0},cool:0,reload:0,flash:0,hit:0,bob:0,key:false};
 const enemies=guardPositions.map(([x,y,type,a],i)=>({x,y,type,id:i,hp:type===2?95:64,state:'idle',a,t:1.2+i*.16,wind:0,pain:0,walk:0,death:0,flash:0,seen:0}));
 const pickups=supplies.map(([x,y,type])=>({x,y,type,taken:false}));
 const s={p,enemies,pickups,time:0,kills:0,score:0,phase:'play',notice:'CHECK EQUIPMENT. FOLLOW THE SERVICE CORRIDOR.',noticeTime:5,shots:0,area:roomAt(p.x,p.y).name};
 let nav=field(p.x,p.y),navTimer=0,attackGap=0;
 function notice(t){s.notice=t;s.noticeTime=2.2}
 function select(i){if(s.phase==='play'&&p.owned[i]&&i!==p.gun){p.gun=i;p.reload=0;p.cool=.14;emit('switch')}}
 function reload(){let g=GUNS[p.gun];if(p.reload<=0&&p.mag[p.gun]<g.capacity&&p.reserve[g.ammo]>0){p.reload=g.reload;emit('reload')}}
 function cycle(d=1){for(let i=1;i<=3;i++){let j=(p.gun+d*i+6)%3;if(p.owned[j]){select(j);break}}}
 function hurt(n){let absorbed=Math.min(p.armor,Math.ceil(n*.55));p.armor-=absorbed;p.hp=Math.max(0,p.hp-(n-absorbed));p.hit=.28;emit('hurt');if(!p.hp){s.phase='dead';emit('dead')}}
 function shoot(){if(p.cool>0||p.reload>0)return;let g=GUNS[p.gun];if(!p.mag[p.gun]){reload();p.cool=.2;if(!p.reload)emit('empty');return}p.mag[p.gun]--;p.cool=g.delay;p.flash=.095;s.shots++;emit('fire'+p.gun);
  let hit=false;for(let i=0;i<g.pellets;i++){let a=p.a+(g.pellets===1?(rng()-.5)*g.spread:(i-(g.pellets-1)/2)*g.spread/(g.pellets-1)+(rng()-.5)*.018),dx=Math.cos(a),dy=Math.sin(a),wall=ray(p.x,p.y,dx,dy).d,best=null,depth=Math.min(wall,g.range);
   for(let e of enemies){if(e.hp<=0)continue;let xx=e.x-p.x,yy=e.y-p.y,t=xx*dx+yy*dy,off=Math.abs(xx*dy-yy*dx);if(t>0&&t<depth&&off<.30){best=e;depth=t}}
   if(best){hit=true;best.hp-=g.damage;best.pain=.15;best.state='alert';best.wind=0;if(best.hp<=0){best.hp=0;best.state='down';best.death=0;s.kills++;s.score+=100;emit('enemy-down')} }
  }if(hit)emit('hit')
 }
 function move(o,dx,dy,r){const free=(x,y)=>fits(x,y,r)&&(o===p?!enemies.some(e=>e.hp>0&&Math.hypot(e.x-x,e.y-y)<.43):Math.hypot(p.x-x,p.y-y)>=.43);if(free(o.x+dx,o.y))o.x+=dx;if(free(o.x,o.y+dy))o.y+=dy}
 function step(dt,input={}){
  if(s.phase!=='play')return;dt=clamp(dt,0,.05);s.time+=dt;s.noticeTime=Math.max(0,s.noticeTime-dt);p.cool=Math.max(0,p.cool-dt);p.flash=Math.max(0,p.flash-dt);p.hit=Math.max(0,p.hit-dt);if(p.reload>0){p.reload-=dt;if(p.reload<=0){let g=GUNS[p.gun],n=Math.min(g.capacity-p.mag[p.gun],p.reserve[g.ammo]);p.mag[p.gun]+=n;p.reserve[g.ammo]-=n;p.reload=0;emit('loaded')}}
  p.a+=input.look||0;p.a+=(input.turn||0)*dt*2.25;let forward=clamp(input.forward||0,-1,1),strafe=clamp(input.strafe||0,-1,1),len=Math.max(1,Math.hypot(forward,strafe)),speed=input.run?3.7:2.8,dx=(Math.cos(p.a)*forward-Math.sin(p.a)*strafe)*speed*dt/len,dy=(Math.sin(p.a)*forward+Math.cos(p.a)*strafe)*speed*dt/len,oldX=p.x,oldY=p.y;move(p,dx,dy,.24);p.bob+=Math.hypot(p.x-oldX,p.y-oldY)*8;
  let area=roomAt(p.x,p.y).name;if(area!==s.area){s.area=area;notice(area)}if(input.fire)shoot();attackGap=Math.max(0,attackGap-dt);navTimer-=dt;if(navTimer<=0){nav=field(p.x,p.y);navTimer=.25}
  for(let e of enemies){if(e.hp<=0){e.death=Math.min(1,e.death+dt*2.5);continue}e.pain=Math.max(0,e.pain-dt);e.flash=Math.max(0,e.flash-dt);e.t=Math.max(0,e.t-dt);let dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy),visible=d<7.5&&clearSight(e.x,e.y,p.x,p.y),facing=(Math.cos(e.a)*dx+Math.sin(e.a)*dy)/Math.max(.01,d);if(e.state==='idle'){e.seen=visible&&(facing>.15||d<1.8)?e.seen+dt:Math.max(0,e.seen-dt);if(e.seen>=.32){e.state='alert';e.t=Math.max(e.t,1.05+e.id*.12);emit('enemy-ready')}else continue}if(visible)e.a=Math.atan2(dy,dx);
   if(e.wind>0){e.wind-=dt;if(e.wind<=0){if(visible&&d<6.5){e.flash=.13;if(rng()<Math.max(.32,.92-d*.07))hurt(difficulty==='easy'?5:e.type===2?10:7);emit('enemy-fire')}e.t=1.35+rng()*.75}continue}
   if(visible&&d<5.6&&e.t<=0&&attackGap<=0){e.wind=.8;attackGap=.65;emit('enemy-ready');continue}
   if(d<1.3&&visible||e.pain>0)continue;
   let tx=p.x,ty=p.y;if(!visible){let x=Math.floor(e.x),y=Math.floor(e.y),best=nav.get(x+','+y)??999;for(let [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){let n=nav.get((x+a)+','+(y+b));if(n!==undefined&&n<best){best=n;tx=x+a+.5;ty=y+b+.5}}}
   let ax=tx-e.x,ay=ty-e.y,n=Math.hypot(ax,ay)||1;e.a=Math.atan2(ay,ax);let v=(e.type===2?.88:1.18)*(difficulty==='easy'?.85:1),mx=ax/n*v*dt,my=ay/n*v*dt;
   if(enemies.some(o=>o!==e&&o.hp>0&&Math.hypot(o.x-e.x-mx,o.y-e.y-my)<.46))continue;move(e,mx,my,.22);e.walk+=dt*v*7;
  }
  for(let item of pickups){if(item.taken||Math.hypot(p.x-item.x,p.y-item.y)>.48)continue;let t=item.type;if(t==='med'&&p.hp===100||t==='armor'&&p.armor===100)continue;item.taken=true;
   if(t==='shellgun'){p.owned[1]=true;p.mag[1]=5;p.reserve.shell+=10;select(1);notice('SCATTERGUN ACQUIRED')}else if(t==='repeater'){p.owned[2]=true;p.mag[2]=24;p.reserve.light+=48;select(2);notice('REPEATER ACQUIRED')}else if(t==='shells'){p.reserve.shell+=8;notice('SHELLS +8')}else if(t==='light'){p.reserve.light+=24;notice('AMMO +24')}else if(t==='med'){p.hp=Math.min(100,p.hp+35);notice('HEALTH +35')}else if(t==='armor'){p.armor=Math.min(100,p.armor+50);notice('ARMOR +50')}else if(t==='key'){p.key=true;notice('KEYCARD - EXIT UNLOCKED');s.score+=250}emit('pickup')}
  if(Math.hypot(p.x-exit.x,p.y-exit.y)<.65){if(p.key){s.phase='won';s.score+=500;emit('win')}else if(s.noticeTime<=0)notice('EXIT REQUIRES KEYCARD')}
 }
 return {s,step,select,cycle,reload,shoot};
}
