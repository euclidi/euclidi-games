/* SNAKE LCD Organic v0.1 — deterministic simulation, no browser dependencies. */
function createGame(cfg, seed=123456, saved=null) {
  const W=480,H=320,C=16, TAU=Math.PI*2, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  let s=saved?JSON.parse(JSON.stringify(saved)):{seed:seed>>>0,mode:cfg.mode,head:{x:168,y:168,a:0},dir:{x:1,y:0},queue:[],target:0,cells:[{x:10,y:10},{x:9,y:10},{x:8,y:10},{x:7,y:10},{x:6,y:10}],trail:[],body:[],length:80,goal:80,pending:0,food:[],rocks:[],plants:[],score:0,hunger:100,health:100,age:0,acc:0,bolus:[],event:"",dead:"",caught:0,prevCells:[]};
  const classic=cfg.mode==="classic"||(cfg.mode==="custom"&&cfg.movement==="grid");
  const rand=()=>{s.seed=(Math.imul(1664525,s.seed)+1013904223)>>>0;return s.seed/4294967296};
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const solid=(x,y,pad=0)=>s.rocks.some(r=>x>r.x-pad&&x<r.x+r.w+pad&&y>r.y-pad&&y<r.y+r.h+pad);
  const wrap=(x,max)=>(x%max+max)%max;
  const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  function position(){for(let i=0;i<600;i++){let x=(Math.floor(rand()*28)+1)*C+8,y=(Math.floor(rand()*18)+1)*C+8;if(!solid(x,y,10)&&distance({x,y},s.head)>54&&!s.food.some(f=>distance(f,{x,y})<18)&&!s.body.some(p=>distance(p,{x,y})<13)&&!s.cells.some(p=>distance({x:p.x*C+8,y:p.y*C+8},{x,y})<14))return{x,y};}return null}
  function newFood(){let p=position();if(!p)return;let type=cfg.food==="pellets"?"pellet":cfg.food==="prey"?(cfg.habitat==="wetlands"?"frog":cfg.habitat==="desert"?"lizard":"mouse"):rand()<.42?"pellet":cfg.habitat==="wetlands"?"frog":cfg.habitat==="desert"?"lizard":"mouse";s.food.push({...p,type,a:rand()*TAU,t:rand()*2,panic:0,frame:0})}
  function seedWorld(){
    let n=cfg.habitat==="arcade"?Number(cfg.obstacles):Number(cfg.obstacles)+5;
    for(let i=0;i<n*5&&s.rocks.length<n;i++){let x=(2+Math.floor(rand()*26))*C,y=(2+Math.floor(rand()*16))*C,w=(1+Math.floor(rand()*2))*C,h=C;if(x<255&&x+w>55&&y<210&&y+h>110)continue;if(s.rocks.some(r=>x<r.x+r.w+16&&x+w+16>r.x&&y<r.y+r.h+16&&y+h+16>r.y))continue;s.rocks.push({x,y,w,h})}
    if(cfg.habitat!=="arcade")for(let i=0;i<110;i++){let x=8+rand()*464,y=8+rand()*304;if(!solid(x,y,5))s.plants.push({x,y,v:Math.floor(rand()*4),size:3+rand()*8})}
    for(let i=0;i<260;i++)s.trail.push({x:s.head.x-i*2,y:s.head.y,a:0});
    for(let i=0;i<14;i++)s.body.push({x:s.head.x-i*6,y:s.head.y});
    s.prevCells=s.cells.map(p=>({...p}));
    for(let i=0;i<(classic&&cfg.food==="pellets"?1:classic?3:7);i++)newFood();
  }
  if(!saved)seedWorld();
  function emit(e){s.event=e}
  function die(reason){s.dead=reason;emit("death")}
  function eat(i){let f=s.food[i];if(!f)return;s.food.splice(i,1);const prey=f.type!=="pellet",amount=prey?2:1;s.score+=prey?25:10;s.caught++;s.hunger=clamp(s.hunger+(prey?30:12),0,100);s.bolus.push({age:0,size:prey?1:.35});if(classic)s.pending+=amount;else s.goal+=amount*12;if(cfg.growth==="instant"&&!classic)s.length=s.goal;emit(prey?"prey":"eat");newFood()}
  function steer(x,y){if(Math.hypot(x,y)<.15)return;if(classic){let d=Math.abs(x)>Math.abs(y)?{x:Math.sign(x),y:0}:{x:0,y:Math.sign(y)},last=s.queue.at(-1)||s.dir;if(d.x===-last.x&&d.y===-last.y||d.x===last.x&&d.y===last.y)return;if(s.queue.length<2)s.queue.push(d)}else{s.target=Math.atan2(y,x)}}
  function preyStep(dt){
    for(const f of s.food){if(f.type==="pellet")continue;f.t-=dt;const d=distance(f,s.head), fear=d<(cfg.difficulty==="hard"?120:cfg.difficulty==="easy"?55:85);f.panic=fear?1:Math.max(0,f.panic-dt);if(fear){let a=Math.atan2(f.y-s.head.y,f.x-s.head.x);let cover=s.plants.filter(p=>distance(p,f)<48&&distance(p,s.head)>d).sort((a,b)=>distance(a,f)-distance(b,f))[0];if(cover)a=Math.atan2(cover.y-f.y,cover.x-f.x);f.a+=delta(a,f.a)*Math.min(1,dt*8)}else if(f.t<=0){f.a+= (rand()-.5)*2.8;f.t=.6+rand()*2.6}let speed=(fear?53:13)*(cfg.difficulty==="easy"?.75:cfg.difficulty==="hard"?1.25:1);
      if(classic){f.frame+=dt;if(f.frame< (fear?.22:.65))continue;f.frame=0;let x=f.x+(Math.abs(Math.cos(f.a))>Math.abs(Math.sin(f.a))?Math.sign(Math.cos(f.a))*C:0),y=f.y+(Math.abs(Math.cos(f.a))<=Math.abs(Math.sin(f.a))?Math.sign(Math.sin(f.a))*C:0);if(x>=8&&x<W&&y>=8&&y<H&&!solid(x,y,4)&&!s.food.some(q=>q!==f&&q.x===x&&q.y===y)){f.x=x;f.y=y}else f.a+=Math.PI*.7;continue}
      let x=f.x+Math.cos(f.a)*speed*dt,y=f.y+Math.sin(f.a)*speed*dt;if(x<8||x>W-8||y<8||y>H-8||solid(x,y,4)){f.a+=Math.PI*.7+rand();continue}f.x=x;f.y=y;f.frame+=dt*speed/8;
    }
  }
  function gridStep(){
    s.prevCells=s.cells.map(p=>({...p}));if(s.queue.length)s.dir=s.queue.shift();let x=s.cells[0].x+s.dir.x,y=s.cells[0].y+s.dir.y;
    if(cfg.boundary==="wrap"){x=wrap(x,W/C);y=wrap(y,H/C)}else if(x<0||x>=W/C||y<0||y>=H/C){die("Boundary collision");return}
    if(solid(x*C+8,y*C+8,1)){die("Obstacle collision");return}
    const fi=s.food.findIndex(f=>Math.floor(f.x/C)===x&&Math.floor(f.y/C)===y),grow=s.pending>0||fi>=0;
    if(s.cells.slice(0,grow?undefined:-1).some(p=>p.x===x&&p.y===y)){die("Self collision");return}
    s.cells.unshift({x,y});s.head={x:x*C+8,y:y*C+8,a:Math.atan2(s.dir.y,s.dir.x)};if(fi>=0)eat(fi);if(s.pending>0)s.pending--;else s.cells.pop();
    if(s.cells.length>=W*H/(C*C)-s.rocks.length*2)die("Arena complete");
  }
  function organicStep(dt){
    const speed=Number(cfg.speed)*(s.hunger<15?.65:1),h=s.head,turn=(cfg.species==="viper"?4.7:cfg.species==="python"?2.9:3.8)*Number(cfg.sensitivity);
    h.a+=clamp(delta(s.target,h.a),-turn*dt,turn*dt);
    const wave=cfg.reduced?0:Math.sin(s.age*7)*.10;
    let nx=h.x+Math.cos(h.a+wave)*speed*dt,ny=h.y+Math.sin(h.a+wave)*speed*dt;
    if(cfg.boundary==="wrap"){nx=wrap(nx,W);ny=wrap(ny,H)}else if(nx<6||ny<6||nx>W-6||ny>H-6){die("Boundary collision");return}
    if(solid(nx,ny,5)){die("Obstacle collision");return}
    h.x=nx;h.y=ny;
    let first=s.trail[0],dist=distance(h,first);if(dist>150){s.trail.unshift({x:h.x,y:h.y,a:h.a,break:true})}else if(dist>=1.6)s.trail.unshift({x:h.x,y:h.y,a:h.a});
    while(s.trail.length>Math.ceil(s.goal/1.5)+160)s.trail.pop();
    if(cfg.growth==="biological")s.length=Math.min(s.goal,s.length+dt*4.5);
    const count=Math.min(150,Math.floor(s.length/5)+1),body=[{x:h.x,y:h.y}];let idx=0,along=0,last={x:h.x,y:h.y},want=5;
    for(let i=0;i<s.trail.length&&body.length<count;i++){let p=s.trail[i],d=distance(p,last);if(d>150){along=want;last=p;continue}while(d>0&&along+d>=want&&body.length<count){let t=(want-along)/d,px=last.x+(p.x-last.x)*t,py=last.y+(p.y-last.y)*t,w=cfg.reduced?0:Math.sin(s.age*7-body.length*.42)*Math.min(2.5,body.length*.22);let a=Math.atan2(p.y-last.y,p.x-last.x);body.push({x:px+Math.sin(a)*w,y:py-Math.cos(a)*w});want+=5}along+=d;last=p}
    // Project adjacent points to the nominal spacing; a continuous arc-length guide provides propulsion.
    for(let iter=0;iter<3;iter++)for(let i=1;i<body.length;i++){let a=body[i-1],b=body[i],d=distance(a,b);if(d>.01&&d<20){let q=(d-5)/d;b.x-=(b.x-a.x)*q*.72;b.y-=(b.y-a.y)*q*.72}}
    s.body=body;
    if(body.slice(7).some(p=>distance(p,h)<9)){die("Self collision");return}
    if(body.slice(2).some(p=>solid(p.x,p.y,2))){s.health-=dt*14;if(s.health<=0){die("Body injury");return}}
    const fi=s.food.findIndex(f=>distance(f,h)<(f.type==="pellet"?8:10));if(fi>=0)eat(fi);
    if(cfg.mode!=="classic"){s.hunger=Math.max(0,s.hunger-dt*(cfg.difficulty==="hard"?2.1:cfg.difficulty==="easy"?.65:1.15));if(s.hunger===0){s.health-=dt*5;if(s.health<=0)die("Starvation")}}
  }
  function step(dt){if(s.dead)return;s.age+=dt;s.bolus=s.bolus.filter(b=>(b.age+=dt)<15);preyStep(dt);if(classic){s.acc+=dt;let period=gridPeriod();while(s.acc>=period&&!s.dead){s.acc-=period;gridStep()}if(!s.dead){let fi=s.food.findIndex(f=>Math.floor(f.x/C)===s.cells[0].x&&Math.floor(f.y/C)===s.cells[0].y);if(fi>=0)eat(fi)}}else organicStep(dt)}
  function gridPeriod(){return Math.max(.065,16/(Number(cfg.speed)+Math.min(85,s.score*.11)))}
  function visualBody(){if(!classic)return s.body;let t=clamp(s.acc/gridPeriod(),0,1);return s.cells.map((p,i)=>{let old=s.prevCells[i]||p,dx=p.x-old.x,dy=p.y-old.y;if(Math.abs(dx)>1||Math.abs(dy)>1)return{x:p.x*C+8,y:p.y*C+8};return{x:(old.x+dx*t)*C+8,y:(old.y+dy*t)*C+8}})}
  return {s,cfg,classic,step,steer,visualBody,gridPeriod,consume:()=>{let e=s.event;s.event="";return e},serialize:()=>JSON.parse(JSON.stringify(s))};
}
