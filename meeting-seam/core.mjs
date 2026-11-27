export function createMine(seed=2401){
 const W=800,H=220,F=166,Q=2,C=W/Q,R=H/Q;
 let rng=seed;const rnd=()=>((rng=Math.imul(rng,1664525)+1013904223|0)>>>0)/4294967296;
 const density=new Uint8Array(C*R),material=new Uint8Array(C*R);
 const posts=[{x:30,d:1},{x:90,d:1},{x:710,d:-1},{x:770,d:-1}],lamps=[40,95,705,760],rail=new Uint8Array(50),piles=[],chips=[],risk=new Float32Array(100);
 const miners=[{name:"Arthur",d:1,x:85,cart:40,job:"plan",load:0,earned:0,stamina:100,phase:0,travel:0,level:1,cap:10},{name:"Elias",d:-1,x:715,cart:760,job:"plan",load:0,earned:0,stamina:100,phase:0,travel:0,level:1,cap:7}];
 const m={W,H,F,Q,C,R,density,material,posts,lamps,rail,piles,chips,risk,miners,time:0,credits:0,falls:0,removed:0,revision:1,linked:false,log:"Two miners begin work."};
 const idx=(x,y)=>Math.floor(y/Q)*C+Math.floor(x/Q);
 const solid=(x,y)=>x<0||x>=W||y<0||y>=H||density[idx(x,y)]>0;
 const open=x=>x>8&&x<W-8&&[12,32,52].every(v=>!solid(x,F-v));
 const roof=x=>{for(let y=F-10;y>24;y-=2)if(solid(x,y))return y+2;return 24};
 for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){let i=idx(x,y),v=Math.sin(y*.11+Math.sin(x*.021)*2)+.42*Math.cos(x*.046);material[i]=v>.65?1:v<-.6?2:0;let edge=120+5*Math.sin(y*.31)+3*Math.cos(y*.13);density[i]=(x<edge||x>W-edge)&&y>F-68+3*Math.sin(x*.08)&&y<F?0:255}
 for(let i=0;i<7;i++){rail[i]=2;rail[49-i]=2}
 const addPile=(x,n,v=n)=>{let p=piles.find(p=>Math.abs(p.x-x)<12);if(p){p.n+=n;p.v+=v}else piles.push({x,n,v})};
 function dig(x,y,d,power=340,collapse=false){
 let n=0,v=0;for(let Y=Math.max(26,Math.floor((y-10)/2)*2);Y<Math.min(F,y+11);Y+=2)for(let X=Math.max(2,Math.floor((x-11)/2)*2);X<Math.min(W-2,x+12);X+=2){if(((X-x)/11)**2+((Y-y)/10)**2> .84+.28*Math.sin(X*1.7+Y*.8))continue;let i=idx(X,Y);if(!density[i])continue;let mat=material[i];density[i]=Math.max(0,density[i]-power/[1,1.5,.78][mat]);if(!density[i]){n++;v+=[1,2,3][mat];if(chips.length<400&&rnd()<.22)chips.push({x:X,y:Y,vx:-d*(8+rnd()*65),vy:-rnd()*70,s:1+rnd()*3,life:2+rnd()*2,mat})}}
 if(n){m.removed+=n;addPile(Math.max(8,Math.min(W-8,x-d*9)),n*.055,v*.055)}m.revision++;return n
 }
 function face(a){let best=null;for(let y=F-58;y<=F-4;y+=6){for(let x=a.d>0?6:W-6;x>0&&x<W;x+=2*a.d){if(solid(x,y)){if(!best||a.d*(x-best.x)<0)best={x,y};break}}}return best}
 function span(x){if(!open(x))return 0;let L=x,R=x;for(let z=x;z>=Math.max(8,x-135);z-=3){L=z;if(!open(z)||posts.some(p=>Math.abs(p.x-z)<4))break}for(let z=x;z<=Math.min(W-8,x+135);z+=3){R=z;if(!open(z)||posts.some(p=>Math.abs(p.x-z)<4))break}return (R-L)/[.85,1.25,.72][material[idx(x,Math.max(0,roof(x)-4))]]}
 const side=(a,x)=>a.d*(x-W/2)<=12;
 const base=a=>a.d>0?40:W-40;
 function set(a,job,goal,data){a.job=job;a.goal=goal;a.data=data;a.phase=0;a.moving=false}
 function plan(a){
 const f=face(a),front=f?f.x:W/2;
 if(a.stamina<15){set(a,"rest",a.x);return}
 if(a.load>.01){set(a,"haul",base(a)+a.d*15);return}
 const pp=posts.filter(p=>a.d*(front-p.x)>0&&side(a,p.x)).sort((p,q)=>a.d*(q.x-p.x))[0];
 let last=pp?pp.x:base(a),goal=front-a.d*27;
 if(a.d*(front-last)>(a.d>0?64:76)&&open(goal)&&!posts.some(p=>Math.abs(p.x-goal)<16)){set(a,"support",goal);return}
 const loose=piles.filter(p=>p.n>.1&&side(a,p.x)&&a.d*(front-p.x)>-10).sort((p,q)=>Math.abs(p.x-a.x)-Math.abs(q.x-a.x));
 const total=loose.reduce((n,p)=>n+p.n,0);
 const gaps=[];for(let x=base(a);a.d*(front-x)>27;x+=a.d*16){let i=Math.floor(x/16);if(rail[i]<2&&open(i*16+8))gaps.push(i)}
 if(gaps.length&&(a.d>0||gaps.length>=3||!f)){set(a,"rail",gaps[0]*16+8,gaps[0]);return}
 if(loose.length&&(total>=a.cap*.75||!f)){set(a,"fetch",a.cart+a.d*17,loose[0]);return}
 if(open(goal)&&!lamps.some(x=>Math.abs(x-goal)<80)){set(a,"lamp",goal);return}
 if(!f){set(a,"idle",a.x);return}
 set(a,"mine",Math.max(12,Math.min(W-12,front-a.d*25)),f)
 }
 function move(a,dt){let dx=a.goal-a.x,sgn=Math.sign(dx)||a.d,step=Math.min(Math.abs(dx),dt*(a.d>0?32:37)*(a.job==="haul"?.72:1)/(1+Math.min(12,piles.filter(p=>Math.abs(p.x-a.x)<12).reduce((n,p)=>n+p.n,0))*.04));a.x+=sgn*step;a.dir=sgn;a.travel+=step;a.moving=step>.001;return Math.abs(a.goal-a.x)<.05}
 function agent(a,dt){
 if(a.job==="plan"||a.job==="idle"){plan(a);return}
 if(a.job==="rest"){a.stamina=Math.min(100,a.stamina+dt*22);if(a.stamina>=95)set(a,"plan",a.x);return}
 if(a.job==="mine"&&!solid(a.data.x,a.data.y)){set(a,"plan",a.x);return}
 if(a.job==="haul"&&a.d>0){const i=Math.floor((a.x-a.d*12)/16);if(rail[i]<2&&open(i*16+8)){a.phase+=dt;if(a.phase>.7){rail[i]=2;a.phase=0}return}}
 const arrived=move(a,dt);
 if(a.job==="push"||a.job==="haul"){let target=a.x-a.dir*18;a.cart+=Math.max(-dt*55,Math.min(dt*55,target-a.cart))}
 if(!arrived)return;a.moving=false;a.phase+=dt;
 let dur=({mine:a.d>0?1.05:.28,support:a.d>0?2.7:2.2,rail:.9,lamp:.8,fetch:.1,push:.65,haul:1,retreat:.1})[a.job]||1;
 if(a.phase<dur)return;
 switch(a.job){
 case "mine":dig(a.data.x,a.data.y,a.d,(a.d>0?340:195)*(1+(a.level-1)*.24));a.stamina-=a.d>0?2.5:1.4;break;
 case "support":posts.push({x:a.x,d:a.d});m.log=a.name+" installed a support.";break;
 case "rail":rail[a.data]=a.d>0?2:Math.min(2,rail[a.data]+1);break;
 case "lamp":lamps.push(a.x);break;
 case "fetch":set(a,"push",Math.max(12,Math.min(W-12,a.data.x-a.d*17)),a.data);return;
 case "push":{let p=a.data,n=Math.min(a.cap,p.n);a.value=p.v*n/Math.max(.001,p.n);a.load=n;p.v-=a.value;p.n-=n;break}
 case "haul":m.credits+=Math.round(a.value||0);a.earned+=a.load;a.load=0;a.cart=base(a);break;
 }
 set(a,"plan",a.x)
 }
 let structural=0;
 function step(dt){m.time+=dt;miners.forEach(a=>agent(a,dt));for(let i=chips.length-1;i>=0;i--){let p=chips[i];p.life-=dt;p.vy+=190*dt;let X=p.x+p.vx*dt,Y=p.y+p.vy*dt;if(solid(X,p.y)&&!solid(p.x,p.y)){p.vx*=-.35;X=p.x}if(Y>=F-p.s){Y=F-p.s;p.vy=-Math.abs(p.vy)*.27;p.vx*=.68}p.x=X;p.y=Y;if(p.life<=0)chips.splice(i,1)}structural+=dt;if(structural>.6){structural=0;for(let i=1;i<99;i++){let x=i*8,s=span(x);risk[i]=Math.max(0,risk[i]+(s>100?(s-100)*.015:-.2));if(risk[i]>1.5){risk[i]=0;if(dig(x,roof(x)-3,x<W/2?1:-1,650,true)){m.falls++;rail[Math.floor(x/16)]=0;m.log="Roof failure damaged the track.";for(let a of miners)if(Math.abs(a.x-x)<26)set(a,"retreat",Math.max(15,Math.min(W-15,a.x-a.d*25)));break}}}}
 m.linked=!face(miners[0]);}
 function act(tool,x,y){if(tool==="dig")dig(x,y,x<W/2?1:-1,430);if(tool==="support"){let i=posts.findIndex(p=>Math.abs(p.x-x)<11);if(i>=0)posts.splice(i,1);else if(open(x))posts.push({x,d:x<W/2?1:-1})}if(tool==="rail"&&open(x)){let i=Math.floor(x/16);rail[i]=rail[i]===2?0:2}if(tool==="lamp"&&open(x)){let i=lamps.findIndex(p=>Math.abs(p-x)<12);if(i>=0)lamps.splice(i,1);else lamps.push(x)}if(tool==="rubble"&&open(x))addPile(x,8,0);if(tool==="clear")for(let p of piles)if(Math.abs(p.x-x)<20)p.n=p.v=0;if(tool==="inspect")m.log=solid(x,y)?["Shale","Granite","Coal"][material[idx(x,y)]]:"Roof span index "+span(x).toFixed(1)}
 function upgrade(i){let a=miners[i],cost=a.level*12;if(m.credits>=cost){m.credits-=cost;a.level++;a.cap+=2}}
 return Object.assign(m,{step,act,upgrade,solid,open,roof,span,idx,face})
}
