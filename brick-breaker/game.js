(()=>{"use strict";
const $=id=>document.getElementById(id),cv=$("field"),ctx=cv.getContext("2d",{alpha:false});ctx.imageSmoothingEnabled=false;
const P=window.planck;if(!P){$("message").innerHTML='<div class="error"><strong>PHYSICS ENGINE UNAVAILABLE</strong>Planck.js failed to load. Check the network and reload.</div>';return;}
const W=1280,H=720,S=40,DT=1/120,V=P.Vec2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const materials=[
{n:"Brick",c:[151,79,53],hp:2,den:2,fr:.7,rest:.25},
{n:"Stone",c:[105,113,111],hp:4,den:3,fr:.8,rest:.22},
{n:"Wood",c:[137,100,58],hp:2,den:.7,fr:.65,rest:.34},
{n:"Glass",c:[75,142,154],hp:1,den:1.3,fr:.25,rest:.4},
{n:"Metal",c:[141,152,160],hp:6,den:5,fr:.35,rest:.65},
{n:"Sand",c:[185,155,87],hp:1,den:1.2,fr:.9,rest:.12,cell:1},
{n:"Water",c:[56,110,165],hp:1,den:1,fr:.2,rest:.25,cell:2},
{n:"Rubber",c:[86,132,91],hp:3,den:1.1,fr:.8,rest:1},
{n:"Explosive",c:[181,106,45],hp:2,den:1.6,fr:.5,rest:.3,boom:true},
{n:"Lava",c:[213,76,27],hp:2,den:2,fr:.6,rest:.2,cell:4},
{n:"Acid",c:[122,167,48],hp:1,den:1.1,fr:.25,rest:.2,cell:5},
{n:"Ice",c:[119,172,190],hp:2,den:.9,fr:.08,rest:.4,cell:2}];
const zones=[["Foundry","Warm masonry, steel and combustion",[0,0,4,2,8,3]],["Quarry","Stone arches and loose sediment",[1,1,0,5,5,2]],["Floodworks","Glass tanks and reactive liquids",[3,6,6,7,4,10]],["Caldera","Molten reservoirs and brittle rock",[1,9,9,8,0,11]],["Reclamation","Mixed material stress chamber",[2,4,7,10,3,8]]];
let save={scrap:0,best:0,width:0,life:0,auto:0};try{let a=JSON.parse(localStorage.getItem("euclidi.brickbreaker.v2"));if(a)for(let k in save)if(Number.isFinite(a[k]))save[k]=Math.max(0,Math.floor(a[k]));}catch{}
save.width=clamp(save.width,0,8);save.life=clamp(save.life,0,3);save.auto=clamp(save.auto,0,1);
function persist(){try{localStorage.setItem("euclidi.brickbreaker.v2",JSON.stringify(save));}catch{}}
let aim=-.18,gamepadButton=false,shock=0,hitStop=0,impactRings=[],ballTracks=new Map(),lastPaddleHit=-10,assetCount=0;let world,paddle,bricks=[],balls=[],debris=[],hits=[],dust=[],floating=[],mode="campaign",wave=1,score=0,lives=3,combo=0,run={},state="ready",target=W/2,auto=false,muted=true,audio=null,zone=0,elapsed=0,frame=0,lastHit=0,seed=123,held=new Set(),lastTime=0,acc=0,stats={contacts:0,fractures:0,detached:0,cellMoves:0},width=146;
const vec=(x,y)=>V(x/S,y/S),px=b=>{const p=b.getPosition();return [p.x*S,p.y*S]},rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
function randat(x,y,k){let n=Math.imul(x+1,374761393)^Math.imul(y+3,668265263)^Math.imul(k+17,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
function sprite(m,k){let c=document.createElement("canvas");c.width=96;c.height=48;let q=c.getContext("2d"),im=q.createImageData(96,48);for(let y=0;y<48;y++)for(let x=0;x<96;x++){let edge=x<2||y<2||x>93||y>45,noise=randat(x,y,k),coarse=randat(x>>2,y>>2,k+60),d=(noise-.5)*26+(coarse-.5)*22;
if(k===0){let seam=y%24<2||(x+(y>=24?24:0))%48<2;d+=seam?-40:((y%24===2)?18:0);}
if(k===1)d+=(randat(x>>3,y>>3,9)-.5)*35;
if(k===2)d+=Math.sin(y*.72+Math.sin(x*.06)*1.8)*12+(y%13===0?-26:0);
if(k===3||k===11)d+=((x+y*2)%35<3?38:0)+(x<5?12:0);
if(k===4)d+=(y%12===0?15:0)+(x%32===0?-18:0);
if(k===5)d+=noise>.8?30:-7;if(k===6||k===9||k===10)d+=Math.sin(x*.12+Math.sin(y*.23)*2)*12+(y%7===0?8:0);
if(k===7)d+=((x+y)%8<2?-16:5);if(k===8)d+=((x+y)%22<8?-24:10);
d+=edge?(x<2||y<2?16:-32):0;let i=(y*96+x)*4;for(let j=0;j<3;j++)im.data[i+j]=clamp(m.c[j]+d,0,255);im.data[i+3]=255;}q.putImageData(im,0,0);return c;}
const tex=materials.map(sprite);
// Optional source artwork, derived from the CC0 material atlas acquired by the native project.
const assetNames=["Bricks","Stone","Planks","Glass","Iron","Sand","WaterF1","WoolSnow","CrateOver","LavaF1","Mud","Ice"];
const assetImgs=assetNames.map((name,k)=>{let im=new Image();im.onload=()=>{let q=tex[k].getContext("2d");q.imageSmoothingEnabled=false;if(k===8){q.drawImage(im,0,0,96,48);}else{q.clearRect(0,0,96,48);q.drawImage(im,0,0,96,48);q.fillStyle="rgba(17,19,24,.17)";q.fillRect(0,0,96,48);}q.fillStyle="rgba(255,239,195,.12)";q.fillRect(1,1,94,2);q.fillStyle="rgba(5,8,12,.5)";q.fillRect(0,45,96,3);assetCount++;};im.src="./assets/materials/"+name+".png";return im;});
const plans=[
{title:"THE HANGING FURNACE",subtitle:"Break the necks. Drop the load.",rows:["..MBBM..MBBM..","..M..M..M..M..",".BBEEBBMBBEEBB.",".BSSSSBBBSSSSB.",".BGGGBB.BBGGGB.","..BBBB...BBBB..","...GG.....GG..."]},
{title:"THE QUARRY GATE",subtitle:"Split the crown to release its columns.",rows:["..SSSSSSSSSS..","..S..SSSS..S..","..S..S..S..S..",".SSS.S..S.SSS.",".SDS.S..S.SDS.",".SDS.S..S.SDS.",".SSS......SSS."]},
{title:"PRESSURE VESSEL",subtitle:"Breach the glass jacket; drain the tanks.",rows:["..MMMM..MMMM..","..MWWM..MAAM..","..MWWM..MAAM..","..GWWG..GAAG..","..GWWG..GAAG..","..MGGM..MGGM..","...GG....GG..."]},
{title:"CALDERA CORE",subtitle:"Release the hot pockets before the shell.",rows:["....SSSSSS....","...SSLLLLSS...","..SSLLLLLLSS..","..SLLLEELLLS..","..SLLSSSSLLS..","...SSEESSSS...","....GGGGGG...."]},
{title:"RECLAIMED MACHINE",subtitle:"Cut through the frame and dismantle the chambers.",rows:[".MMM..MM..MMM.",".MBM..MM..MBM.",".MBMMMMMMMMBM.",".MBM..EE..MBM.",".MGM.GGGG.MGM.",".MMM.GAAG.MMM.",".....GGGG....."]},
{title:"SUSPENSION BRIDGE",subtitle:"Find the weak links on both sides.",rows:[".MM........MM.",".MB........BM.",".MB........BM.",".BBBBBBBBBBBB.",".BSSSSEESSSSB.",".BGGGG..GGGGB.",".MMMMM..MMMMM."]}];
const materialCodes={B:0,S:1,T:2,G:3,M:4,D:5,W:6,R:7,E:8,L:9,A:10,I:11};
let plan=plans[0];
const backdrop=document.createElement("canvas");backdrop.width=W;backdrop.height=H;let bg=backdrop.getContext("2d"),im=bg.createImageData(W,H);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){let seam=(x%160<2||y%120<2),n=randat(x>>1,y>>1,19)*7+(randat(x>>5,y>>5,22)-.5)*8,d=seam?-6:0,i=(y*W+x)*4;im.data[i]=22+n+d;im.data[i+1]=30+n+d;im.data[i+2]=27+n+d;im.data[i+3]=255;}bg.putImageData(im,0,0);
const GW=160,GH=90,CELL=8,grid=new Uint8Array(GW*GH),ages=new Uint8Array(GW*GH),occupied=new Uint8Array(GW*GH),owners=new Int32Array(GW*GH),cellColors=["","", "#477fb5","#dc9a4d","#d95222","#8eae39","#9ca9a5"];let materialCount=0,matTick=0;
function addCell(x,y,k){let i=clamp(y|0,1,GH-2)*GW+clamp(x|0,1,GW-2);if(!grid[i]&&!occupied[i]){grid[i]=k;ages[i]=0;materialCount++;}}
function spill(x,y,k,n){for(let i=0;i<n;i++)addCell((x+(rng()-.5)*86)/CELL,(y+(rng()-.5)*36)/CELL,k);}
function clearCell(i){if(grid[i]){grid[i]=0;ages[i]=0;materialCount--;}}
function moveCell(i,j){if(j<0||j>=grid.length||grid[j]||occupied[j])return false;grid[j]=grid[i];ages[j]=ages[i];grid[i]=0;ages[i]=0;stats.cellMoves++;return true;}
function raster(){occupied.fill(0);owners.fill(-1);for(let b of bricks)if(b.live){for(let y=Math.max(1,Math.floor((b.y-b.h/2)/CELL));y<=Math.min(GH-2,Math.floor((b.y+b.h/2)/CELL));y++)for(let x=Math.max(1,Math.floor((b.x-b.w/2)/CELL));x<=Math.min(GW-2,Math.floor((b.x+b.w/2)/CELL));x++){let i=y*GW+x;occupied[i]=1;owners[i]=b.id;}}}
function cells(){if(!materialCount)return;matTick++;let flip=matTick%2?1:-1;for(let y=GH-2;y>=1;y--)for(let xi=1;xi<GW-1;xi++){let x=flip===1?xi:GW-1-xi,i=y*GW+x,k=grid[i];if(!k)continue;let dir=rng()<.5?-1:1;let below=i+GW;ages[i]=Math.min(255,ages[i]+1);
if(k===3||k===6){if(ages[i]>70||y<3){clearCell(i);continue;}if(k===3){for(let j of [i+GW,i-GW,i-1,i+1])if(grid[j]===2){clearCell(i);clearCell(j);addCell(x,y,6);break;}if(!grid[i])continue;let b=bricks[owners[below]];if(b&&b.live&&b.m===2&&rng()<.08)hurt(b,1,0,-1);}moveCell(i,i-GW)||moveCell(i,i-GW+dir);continue;}
if(k===5&&occupied[below]&&rng()<.12){let b=bricks[owners[below]];if(b&&b.live&&b.m!==4){hurt(b,1,0,1);clearCell(i);continue;}}
if(k===4){let j=[below,i+dir,i-GW].find(j=>grid[j]===2);if(j!==undefined){clearCell(j);clearCell(i);addCell(x,y,6);continue;}if(rng()<.04){let b=bricks[owners[below]];if(b&&b.live&&b.m===2)hurt(b,1,0,1);addCell(x,y-1,3);}}
if(y>=GH-3){if(ages[i]>120||rng()<.02)clearCell(i);continue;}if(moveCell(i,below)||moveCell(i,below+dir)||moveCell(i,below-dir))continue;if(k!==1)moveCell(i,i+dir)||moveCell(i,i-dir);
}}
function bodyAt(x,y,type,shape,fd,data,extra={}){let b=world.createBody({type,position:vec(x,y),...extra});b.createFixture(shape,fd);b.setUserData(data);return b;}
function wall(x,y,w,h){bodyAt(x,y,"static",P.Box(w/2/S,h/2/S),{friction:.05,restitution:1},{kind:"wall"});}
function makePaddle(){width=174+save.width*12+run.width;return bodyAt(W/2,H-45,"kinematic",P.Box(width/2/S,9/S),{friction:.05,restitution:1},{kind:"paddle"});}
function spawnBall(x=W/2,y=H-65,vx=0,vy=0,launched=false){let b=bodyAt(x,y,"dynamic",P.Circle(9/S),{density:3.2,friction:0,restitution:1,filterCategoryBits:4,filterMaskBits:0xffff},{kind:"ball"},{bullet:true,gravityScale:0,fixedRotation:true,allowSleep:false});let a={body:b,launched};balls.push(a);b.setLinearVelocity(vec(vx,vy));return a;}
function addBrick(x,y,m,row,col,w=76,h=34){let mat=materials[m],b={id:bricks.length,x,y,w,h,m,row,col,hp:mat.hp,max:mat.hp,live:true,anchor:row===0,body:null};b.body=bodyAt(x,y,"static",P.Box(w/2/S,h/2/S),{density:mat.den,friction:mat.fr,restitution:mat.rest},{kind:"brick",brick:b});bricks.push(b);}
function buildWorld(){world=P.World(V(0,19));world.setContinuousPhysics(true);bricks=[];balls=[];debris=[];hits=[];dust=[];floating=[];grid.fill(0);ages.fill(0);occupied.fill(0);owners.fill(-1);materialCount=0;matTick=0;wall(-9,H/2,18,H+20);wall(W+9,H/2,18,H+20);wall(W/2,-10,W+40,20);paddle=makePaddle();target=W/2;
zone=(wave-1)%zones.length;seed=(mode==="campaign"?811:mode==="expedition"?5221:12881)+wave*818;plan=plans[(wave-1+(mode==="expedition"?2:0))%plans.length];let rows=plan.rows,cols=Math.max(...rows.map(r=>r.length)),dx=76,dy=43,startX=(W-(cols-1)*dx)/2,startY=106;
for(let r=0;r<rows.length;r++){let line=rows[r];for(let c=0;c<line.length;c++){let code=line[c];if(code===".")continue;let col=mode==="expedition"&&wave%2===0?cols-1-c:c;let m=materialCodes[code];if(wave>6&&code==="B"&&((c+r+wave)%7===0))m=7;if(wave>9&&code==="S"&&((c*3+r+wave)%8===0))m=4;addBrick(startX+col*dx,startY+r*dy,m,r,col,73,40);}}
impactRings=[];ballTracks.clear();shock=0;hitStop=0;lastPaddleHit=-10;aim=-.18;
raster();world.on("begin-contact",contact=>{let a=contact.getFixtureA().getBody(),b=contact.getFixtureB().getBody(),u=a.getUserData(),v=b.getUserData();if(!u||!v)return;if(u.kind==="ball"&&v.kind==="paddle")hits.push({paddle:a});if(v.kind==="ball"&&u.kind==="paddle")hits.push({paddle:b});});
world.on("post-solve",(contact,impulse)=>{let a=contact.getFixtureA().getBody(),b=contact.getFixtureB().getBody(),u=a.getUserData(),v=b.getUserData();if(!u||!v)return;let imp=0;for(let n of impulse.normalImpulses)imp=Math.max(imp,n);if(imp<.12)return;
let f=(u,v,other)=>{if(u.kind!=="brick"||!u.brick.live||!(v.kind==="ball"||v.kind==="debris"))return;if(v.kind==="debris"&&imp<1.5)return;let p=other.getLinearVelocity();hits.push({brick:u.brick,imp,dx:p.x,dy:p.y,ball:v.kind==="ball"});};f(u,v,b);f(v,u,a);});
spawnBall();state="ready";held.clear();acc=0;show("CHAMBER "+String(wave).padStart(2,"0")+" / "+plan.title,plan.subtitle+" · Adjust aim, then launch");ui();}
function show(title,desc){$("message").hidden=!title;$("message").innerHTML=title?"<div><strong>"+title+"</strong><span>"+desc+"</span></div>":"";}
function tone(m,impact=1){if(muted)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==="suspended")audio.resume();const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type=m===3?"triangle":m===4?"sine":"square";o.frequency.setValueAtTime(130+m*47,t);o.frequency.exponentialRampToValueAtTime(55+m*16,t+.075);g.gain.setValueAtTime(Math.min(.055,.015*impact),t);g.gain.exponentialRampToValueAtTime(.0001,t+.095);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.1);}catch{}}
function burst(x,y,m,n){for(let i=0;i<n&&dust.length<900;i++)dust.push({x,y,vx:(rng()-.5)*280,vy:(rng()-.7)*160,life:.18+rng()*.7,c:materials[m].c,s:1+(rng()*3|0)});}
function scrap(amount){save.scrap+=amount;score+=amount*10;save.best=Math.max(save.best,score);persist();}
function hurt(b,n,dx=0,dy=0){if(!b.live)return;b.hp-=n;impactRings.push({x:b.x,y:b.y,t:.19,max:.19,m:b.m});if(impactRings.length>32)impactRings.shift();shock=Math.min(6,shock+1.7);burst(b.x,b.y,b.m,12);if(b.hp<=0)breakBrick(b,dx,dy,false);}
function fragment(b,x,y,w,h,dx,dy,kind){if(debris.length>=180)return;let mat=materials[b.m],poly=null;
if(kind!=="whole"){let pts=[[-w*.49,-h*.35],[-w*.08,-h*.49],[w*.46,-h*.29],[w*.48,h*.16],[w*.13,h*.49],[-w*.43,h*.34]];if((b.id+Math.round(x))%2===0)pts=[[-w*.48,-h*.48],[w*.48,-h*.38],[w*.1,h*.48]];poly=pts;}
let piece=bodyAt(x,y,"dynamic",poly?P.Polygon(poly.map(p=>vec(p[0],p[1]))):P.Box(w/2/S,h/2/S),{density:mat.den,friction:mat.fr,restitution:mat.rest,filterCategoryBits:2,filterMaskBits:0xffff},{kind:"debris"},{linearDamping:.10,angularDamping:.12});piece.setLinearVelocity(vec(dx,dy));piece.setAngularVelocity((rng()-.5)*8);debris.push({body:piece,w,h,m:b.m,life:kind==="whole"?9:5,poly,tx:Math.floor(rng()*40),ty:Math.floor(rng()*20)});}
function breakBrick(b,dx,dy,detach){if(!b.live)return;b.live=false;world.destroyBody(b.body);stats.fractures++;shock=Math.min(9,shock+2.8);if(!detach)hitStop=Math.max(hitStop,.025);if(detach)stats.detached++;combo++;lastHit=elapsed;scrap((detach?2:3)+Math.floor(b.max/2)+(combo%5===0?2:0));let m=materials[b.m];burst(b.x,b.y,b.m,detach?14:22);tone(b.m,2);floating.push({x:b.x,y:b.y,t:0.7,text:"+"+((detach?2:3)+Math.floor(b.max/2))});
if(m.cell){raster();spill(b.x,b.y,m.cell,90);}
else if(detach)fragment(b,b.x,b.y,b.w,b.h,dx,dy,"whole");
else{let cols=b.m===3?4:3,rows=b.m===3?2:2;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){let w=b.w/cols,h=b.h/rows;fragment(b,b.x-b.w/2+w*(x+.5),b.y-b.h/2+h*(y+.5),w-1,h-1,clamp(dx*S,-220,220)*.25+(x-cols/2)*55+(rng()-.5)*55,clamp(dy*S,-220,220)*.2+(rng()-.6)*100,"shard");}}
if(m.boom){raster();spill(b.x,b.y,3,36);for(let other of bricks)if(other.live&&Math.hypot(other.x-b.x,other.y-b.y)<116)hurt(other,3,dx,dy);}
if(run.explosive&&combo%8===0)for(let other of bricks)if(other.live&&Math.hypot(other.x-b.x,other.y-b.y)<86)hurt(other,1,dx,dy);
}
function supports(){let live=bricks.filter(b=>b.live),map=new Map(live.map(b=>[b.row+","+b.col,b])),seen=new Set(),queue=live.filter(b=>b.anchor);for(let b of queue)seen.add(b.id);for(let i=0;i<queue.length;i++){let b=queue[i];for(let [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){let next=map.get((b.row+dr)+","+(b.col+dc));if(next&&!seen.has(next.id)){seen.add(next.id);queue.push(next);}}}for(let b of live)if(!seen.has(b.id))breakBrick(b,0,0,true);raster();}
function step(){if(state!=="ready"&&state!=="playing")return;elapsed+=DT;if(elapsed-lastHit>2.0)combo=0;
let [px0]=px(paddle);if(held.has("left"))target=px0-950*DT;if(held.has("right"))target=px0+1250*DT;if(held.has("left"))target=px0-1250*DT;if(state==="ready"){if(held.has("aimLeft"))aim=clamp(aim-DT*1.8,-1.05,1.05);if(held.has("aimRight"))aim=clamp(aim+DT*1.8,-1.05,1.05);}
if(auto&&save.auto&&state==="playing"&&!held.size){let a=balls.filter(a=>a.launched&&a.body.getLinearVelocity().y>0).sort((a,b)=>b.body.getPosition().y-a.body.getPosition().y)[0];if(a){let [x,y]=px(a.body),v=a.body.getLinearVelocity(),t=(H-60-y)/(v.y*S);let xx=x+v.x*S*clamp(t,0,2),period=2*(W-16);xx=((xx-8)%period+period)%period;target=8+(xx>W-16?period-xx:xx);}}
target=clamp(target,width/2+4,W-width/2-4);let velocity=clamp((target-px0)/DT,-1800,1800);paddle.setLinearVelocity(vec(velocity,0));
for(let a of balls)if(!a.launched){a.body.setTransform(vec(px0,H-65),0);a.body.setLinearVelocity(V(0,0));a.body.setActive(false);}
world.step(DT,8,3);
let old=stats.fractures,hitIds=new Set();for(let h of hits){if(h.paddle){let a=balls.find(a=>a.body===h.paddle);if(!a||!a.launched)continue;let [bx,by]=px(a.body),[xx]=px(paddle);if(by>H-39||elapsed-lastPaddleHit<.035)continue;lastPaddleHit=elapsed;let offset=clamp((bx-xx)/(width/2),-1,1),ang=clamp(offset*1.16+velocity*.00013,-1.24,1.24),speed=650+run.speed+Math.min(180,wave*12);a.body.setLinearVelocity(vec(Math.sin(ang)*speed,-Math.cos(ang)*speed));tone(4);continue;}if(hitIds.has(h.brick.id)||!h.brick.live)continue;hitIds.add(h.brick.id);stats.contacts++;hurt(h.brick,h.ball?run.power+Math.min(2,Math.floor(h.imp/8)):1,h.dx,h.dy);tone(h.brick.m);}
hits.length=0;if(stats.fractures!==old)supports();
if(++frame%4===0){let before=stats.fractures;cells();if(stats.fractures!==before)supports();}
for(let i=balls.length-1;i>=0;i--){let a=balls[i];if(!a.launched)continue;let [x,y]=px(a.body);if(y>H+30||!Number.isFinite(x+y)){ballTracks.delete(a.body);world.destroyBody(a.body);balls.splice(i,1);continue;}let v=a.body.getLinearVelocity(),speed=Math.hypot(v.x,v.y)*S,min=590+run.speed,max=880+run.speed;if(speed<min||speed>max){let scale=clamp(speed,min,max)/Math.max(1,speed);a.body.setLinearVelocity(speed<1?vec(120,-min):V(v.x*scale,v.y*scale));}if(Math.abs(v.y)<2.6&&Math.abs(v.x)>1)a.body.setLinearVelocity(V(v.x,v.y<0?-3.2:3.2));let trail=ballTracks.get(a.body)||[];trail.unshift([x,y]);if(trail.length>13)trail.pop();ballTracks.set(a.body,trail);}
for(let i=debris.length-1;i>=0;i--){let d=debris[i];d.life-=DT;let [x,y]=px(d.body);if(d.life<=0||y>H+60||x<-60||x>W+60){world.destroyBody(d.body);debris.splice(i,1);}}
for(let i=dust.length-1;i>=0;i--){let d=dust[i];d.life-=DT;d.x+=d.vx*DT;d.y+=d.vy*DT;d.vy+=240*DT;if(d.life<=0)dust.splice(i,1);}
for(let i=floating.length-1;i>=0;i--){let f=floating[i];f.t-=DT;f.y-=30*DT;if(f.t<=0)floating.splice(i,1);}
if(state==="playing"&&!bricks.some(b=>b.live)){complete();return;}
if(state==="playing"&&!balls.length){lives--;if(lives<=0){state="over";show("RUN ENDED","Score "+score+" · Scrap retained · New run to restart");}else{spawnBall(px(paddle)[0]);state="ready";show("BALL LOST","Launch again · "+lives+" lives remaining");}persist();}
}
const upgrades=[["Dense core","Each ball impact deals +1 damage",()=>run.power++],["Twin shot","Launch an additional ball each life",()=>run.mult=Math.min(4,run.mult+1)],["Wide deflector","Wider paddle for this run",()=>run.width+=30],["Velocity tuning","Higher projectile velocity",()=>run.speed+=60],["Fracture resonance","Every eighth break damages neighbors",()=>run.explosive=true],["Reserve ball","Recover one life",()=>lives++]];
function complete(){scrap(12+wave*2);if(mode==="campaign"&&wave>=12){state="won";show("CAMPAIGN CLEARED","Final score "+score+" · New run to continue");return;}state="upgrade";show("","");$("upgrade").hidden=false;let opts=[...upgrades].filter(a=>a[0]!=="Fracture resonance"||!run.explosive).filter(a=>a[0]!=="Twin shot"||run.mult<4);let pick=[];while(pick.length<3&&opts.length)pick.push(opts.splice(Math.floor(rng()*opts.length),1)[0]);$("choices").replaceChildren();for(let item of pick){let btn=document.createElement("button");btn.textContent=item[0];let small=document.createElement("small");small.textContent=item[1];btn.append(small);btn.onclick=()=>{item[2]();$("upgrade").hidden=true;wave++;buildWorld();};$("choices").append(btn);}}
function launch(){if(state!=="ready")return;state="playing";show("","");let a=balls[0],[x]=px(paddle);a.body.setActive(true);a.body.setTransform(vec(x,H-65),0);a.launched=true;let speed=650+run.speed,spread=run.mult;for(let i=0;i<spread;i++){let angle=clamp(aim+(i-(spread-1)/2)*.22,-1.15,1.15),b=i===0?a:spawnBall(x+(i*18),H-65,0,0,true);b.body.setLinearVelocity(vec(Math.sin(angle)*speed,-Math.cos(angle)*speed));}tone(4);}
function restart(){mode=$("mode").value;wave=1;score=0;lives=3+save.life;run={power:1,mult:1,width:0,speed:0,explosive:false};combo=0;elapsed=0;stats={contacts:0,fractures:0,detached:0,cellMoves:0};$("upgrade").hidden=true;buildWorld();}
function ui(){ $("score").textContent=score;$("wave").textContent=String(wave).padStart(2,"0");$("lives").textContent=lives;$("scrap").textContent=save.scrap;$("balls").textContent=balls.length;$("zone").textContent=plan.title+" — "+plan.subtitle+" · "+bricks.filter(b=>b.live).length+" attached objects";$("build").textContent="Damage "+run.power+" · "+run.mult+" balls · +"+run.width+" px paddle · +"+run.speed+" speed"+(run.explosive?" · resonance":"");$("best").textContent="BEST SCORE "+save.best;$("launch").disabled=state!=="ready";$("pause").textContent=state==="paused"?"Resume":"Pause";for(let [id,k,max,cost] of [["buyWidth","width",8,40+save.width*25],["buyLife","life",3,90+save.life*70],["buyAuto","auto",1,150]]){let b=$(id);b.disabled=save[k]>=max||save.scrap<cost;b.querySelector("span").textContent=save[k]>=max?"MAX":cost+" scrap";}$("auto").disabled=!save.auto;$("auto").textContent="Automation: "+(auto?"on":"off");}
// Deliberate pixel-workshop presentation; all scenery is pre-rasterized.
const chamberArt=document.createElement("canvas");chamberArt.width=W;chamberArt.height=H;
let artKey="";
function buildArt(){let key=zone+":"+plan.title;if(artKey===key)return;artKey=key;let q=chamberArt.getContext("2d");q.imageSmoothingEnabled=false;
const themes=[["#191918","#2a2823","#443c2c","#b47b40"],["#181c20","#282f35","#39424a","#a6a6a0"],["#111c23","#1d3038","#294a54","#65aab5"],["#201619","#382222","#543027","#ed7941"],["#1a1c20","#2c2b35","#3c3c46","#b2a1cf"]],t=themes[zone];
q.fillStyle=t[0];q.fillRect(0,0,W,H);
// Deep panels and ceiling infrastructure, behind the actual colliders.
for(let x=0;x<W;x+=160){q.fillStyle=t[1];q.fillRect(x+3,54,154,560);q.fillStyle=t[0];q.fillRect(x+6,58,148,552);q.fillStyle=t[1];q.fillRect(x+6,58,1,550);for(let y=74;y<610;y+=137){q.fillStyle=t[1];q.fillRect(x+10,y,138,1);q.fillRect(x+12,y+2,3,3);q.fillRect(x+145,y+2,3,3);}}
for(let y=52;y<620;y+=2)for(let x=18;x<W-18;x+=2){let n=randat(x,y,zone+20);if(n>.83){q.fillStyle=n>.96?"#ffffff06":"#00000013";q.fillRect(x,y,n>.98?4:2,2);}}
q.fillStyle="#0e1012";q.fillRect(0,0,W,64);q.fillRect(0,H-22,W,22);
for(let x=25;x<W;x+=110){q.fillStyle="#33332c";q.fillRect(x,48,86,12);q.fillStyle="#4d4d40";q.fillRect(x,48,86,2);q.fillStyle="#141615";q.fillRect(x+8,54,70,5);for(let i=0;i<3;i++){q.fillStyle="#777567";q.fillRect(x+8+i*30,50,2,2);}}
for(let x of [0,W-15]){q.fillStyle="#292c29";q.fillRect(x,64,15,H-86);q.fillStyle="#55564b";q.fillRect(x+2,65,2,H-90);for(let y=80;y<H-32;y+=48){q.fillStyle="#0f1513";q.fillRect(x+5,y,7,20);q.fillStyle=t[3];q.fillRect(x+7,y+3,3,7);}}
for(let x=30;x<W-20;x+=22){q.fillStyle=x%44===30?"#695635":"#24231c";q.fillRect(x,H-15,18,4);}
q.fillStyle=t[3];q.font="bold 11px monospace";q.fillText("E.G. / IMPACT WORKS",25,46);q.textAlign="right";q.fillText("MATERIAL RECLAMATION DIVISION",W-25,46);q.textAlign="left";
q.fillStyle="#ffffff08";q.font="bold 106px monospace";q.textAlign="center";q.fillText(String(wave).padStart(2,"0"),W/2,H-132);q.textAlign="left";
}
const ballSprite=document.createElement("canvas");ballSprite.width=ballSprite.height=24;{let q=ballSprite.getContext("2d"),palette=["#6f503b","#a3794f","#d6ab69","#f2d79a","#fff0bf"];for(let y=0;y<24;y++)for(let x=0;x<24;x++){let dx=x-11.5,dy=y-11.5,r=Math.hypot(dx,dy);if(r>10.5)continue;let l=clamp(Math.floor(3.1-(dx+dy)*.14-r*.12+randat(x,y,73)*.8),0,4);q.fillStyle=palette[l];q.fillRect(x,y,1,1);}q.fillStyle="#fff3d0";q.fillRect(6,5,4,2);}
function draw(){buildArt();ctx.drawImage(chamberArt,0,0);ctx.save();
const sh=shock;ctx.translate(sh>.2?Math.round(Math.sin(frame*2.31)*sh):0,sh>.2?Math.round(Math.cos(frame*3.4)*sh*.55):0);
ctx.fillStyle="#16191a";ctx.fillRect(19,66,W-38,3);
for(let b of bricks)if(b.live){let x=Math.round(b.x-b.w/2),y=Math.round(b.y-b.h/2);
// Cast short shadow under each suspended object, then draw native bitmap texture.
ctx.fillStyle="#080a0c99";ctx.fillRect(x+4,y+6,b.w,b.h);ctx.drawImage(tex[b.m],x,y,b.w,b.h);
ctx.fillStyle="#d2c5a226";ctx.fillRect(x+1,y+1,b.w-2,1);ctx.fillStyle="#080a0b9e";ctx.fillRect(x,y+b.h-3,b.w,3);
if(b.m===8){ctx.fillStyle="#171914";ctx.fillRect(x+5,y+11,b.w-10,18);for(let i=8;i<b.w-10;i+=12){ctx.fillStyle="#e5af54";ctx.fillRect(x+i,y+13,7,3);ctx.fillRect(x+i+3,y+16,7,3);ctx.fillRect(x+i+6,y+19,7,3);}ctx.fillStyle="#e96b37";ctx.fillRect(x+b.w/2-3,y+8,6,3);}
if(b.m===4){for(let i of [5,b.w-7])for(let j of [5,b.h-7]){ctx.fillStyle="#202122";ctx.fillRect(x+i,y+j,3,3);ctx.fillStyle="#e1d8b3";ctx.fillRect(x+i,y+j,1,1);}}
if(b.hp<b.max){let ratio=1-b.hp/b.max;ctx.fillStyle="#161614c8";for(let k=0;k<Math.ceil(ratio*4);k++){let xx=x+9+Math.floor(randat(b.id,k,8)*(b.w-19)),yy=y+2;for(let j=0;j<17;j++){ctx.fillRect(xx,yy+j*2,1+(k%2),2);xx+=(randat(j,k,b.id)>.5?2:-2);}}}
if(b.anchor){ctx.fillStyle="#887a55";ctx.fillRect(x+7,70,3,Math.max(0,y-70));ctx.fillRect(x+b.w-10,70,3,Math.max(0,y-70));ctx.fillStyle="#d0a65e";ctx.fillRect(x+5,y-4,7,4);ctx.fillRect(x+b.w-12,y-4,7,4);}}
for(let y=1;y<GH-1;y++)for(let x=1;x<GW-1;x++){let k=grid[y*GW+x];if(!k)continue;ctx.fillStyle=k===1?["#a48647","#bfa15e","#d2bb77"][(x+y)%3]:cellColors[k]||"#aaa";ctx.fillRect(x*CELL,y*CELL,CELL,CELL);ctx.fillStyle="#ffffff23";ctx.fillRect(x*CELL,y*CELL,Math.max(1,CELL/2),2);}
for(let d of debris){let [x,y]=px(d.body);ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(d.body.getAngle());if(d.poly){ctx.beginPath();d.poly.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.clip();}ctx.drawImage(tex[d.m],d.tx,d.ty,Math.min(96-d.tx,d.w),Math.min(48-d.ty,d.h),-d.w/2,-d.h/2,d.w,d.h);ctx.restore();}
for(let d of dust){ctx.fillStyle="rgba("+d.c.join(",")+","+clamp(d.life*2,0,1)+")";ctx.fillRect(d.x|0,d.y|0,d.s,d.s);}
for(let r of impactRings){let t=1-r.t/r.max;ctx.strokeStyle="rgba(255,211,127,"+(1-t)*.6+")";ctx.lineWidth=1;let rad=8+t*34;ctx.beginPath();ctx.arc(r.x,r.y,rad,0,Math.PI*2);ctx.stroke();}
let [x,y]=px(paddle),left=Math.round(x-width/2),top=Math.round(y-9);
ctx.fillStyle="#090b0e";ctx.fillRect(left-3,top+4,width+6,19);ctx.drawImage(tex[4],left,top,width,18);
ctx.fillStyle="#deae61";ctx.fillRect(left+5,top,width-10,3);ctx.fillStyle="#15191d";ctx.fillRect(left+12,top+5,width-24,8);
for(let i=left+17;i<left+width-17;i+=12){ctx.fillStyle="#727b7a";ctx.fillRect(i,top+6,7,2);ctx.fillStyle="#373d40";ctx.fillRect(i,top+9,7,3);}
ctx.fillStyle="#edbb61";ctx.fillRect(Math.round(x)-13,top+3,26,3);ctx.fillRect(Math.round(x)-2,top+5,4,8);
ctx.fillStyle="#757c7a";ctx.fillRect(left-2,top+3,5,12);ctx.fillRect(left+width-3,top+3,5,12);
for(let a of balls){let [bx,by]=px(a.body);let trail=ballTracks.get(a.body)||[];for(let i=trail.length-1;i>=0;i--){let [tx,ty]=trail[i],alpha=(1-i/trail.length)*.36,s=Math.max(2,Math.round(8*(1-i/trail.length)));ctx.fillStyle="rgba(242,184,99,"+alpha+")";ctx.fillRect(Math.round(tx-s/2),Math.round(ty-s/2),s,s);}ctx.drawImage(ballSprite,Math.round(bx)-12,Math.round(by)-12);}
if(state==="ready"){let bx=x,by=H-65,dx=Math.sin(aim),dy=-Math.cos(aim);for(let i=1;i<=20;i++){ctx.fillStyle="rgba(242,199,122,"+(1-i/23)*.85+")";ctx.fillRect(Math.round(bx+dx*i*11)-2,Math.round(by+dy*i*11)-2,4,4);}ctx.fillStyle="#c6a775";ctx.font="12px monospace";ctx.textAlign="center";ctx.fillText("Q / E  •  AIM",x,H-91);ctx.textAlign="left";}
ctx.font="bold 13px monospace";for(let f of floating){ctx.fillStyle="rgba(231,218,163,"+clamp(f.t*2,0,1)+")";ctx.fillText(f.text,f.x,f.y);}
ctx.restore();ctx.fillStyle="#d0bc91";ctx.font="bold 16px monospace";ctx.fillText(plan.title,25,25);ctx.textAlign="right";ctx.fillStyle="#a79e88";ctx.font="12px monospace";ctx.fillText(String(bricks.filter(b=>b.live).length).padStart(2,"0")+" ATTACHED  /  "+String(combo).padStart(2,"0")+" CHAIN",W-25,25);ctx.textAlign="left";
if(sh>3){ctx.fillStyle="rgba(239,184,89,"+Math.min(.10,sh*.008)+")";ctx.fillRect(0,0,W,H);}
}

let savedState="ready";function togglePause(){if(state==="paused"){state=savedState;show(state==="ready"?"READY":"",state==="ready"?"Launch to continue":"");}else if(state==="playing"||state==="ready"){savedState=state;state="paused";show("PAUSED","Press P or Resume");}ui();}
function buy(k,max,cost){if(save[k]>=max||save.scrap<cost)return;save.scrap-=cost;save[k]++;persist();if(k==="auto")auto=true;ui();}
function pointer(e){let r=cv.getBoundingClientRect();target=clamp((e.clientX-r.left)/r.width*W,0,W);}
cv.addEventListener("pointerdown",e=>{pointer(e);cv.setPointerCapture(e.pointerId);});cv.addEventListener("pointermove",e=>{if(e.pointerType==="mouse"||e.buttons)pointer(e);});
const keys={ArrowLeft:"left",a:"left",A:"left",ArrowRight:"right",d:"right",D:"right",q:"aimLeft",Q:"aimLeft",e:"aimRight",E:"aimRight"};window.addEventListener("keydown",e=>{if(e.target.matches("select,input,textarea"))return;if(keys[e.key]){held.add(keys[e.key]);e.preventDefault();}else if(e.code==="Space"&&!e.target.matches("button")){launch();e.preventDefault();}else if(e.key.toLowerCase()==="p"&&!e.repeat)togglePause();});window.addEventListener("keyup",e=>{if(keys[e.key])held.delete(keys[e.key]);});window.addEventListener("blur",()=>{held.clear();if(state==="playing")togglePause();});
for(let id of ["left","right","aimLeft","aimRight"]){let b=$(id);b.addEventListener("pointerdown",e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(id);});for(let event of ["pointerup","pointercancel","lostpointercapture"])b.addEventListener(event,()=>held.delete(id));}
$("launch").onclick=launch;$("pause").onclick=togglePause;$("new").onclick=restart;$("sound").onclick=()=>{muted=!muted;$("sound").textContent="Sound: "+(muted?"off":"on");if(!muted)tone(4);};$("buyWidth").onclick=()=>buy("width",8,40+save.width*25);$("buyLife").onclick=()=>buy("life",3,90+save.life*70);$("buyAuto").onclick=()=>buy("auto",1,150);$("auto").onclick=()=>{auto=!!save.auto&&!auto;ui();};
$("legend").innerHTML=materials.map(m=>'<span><i style="background:rgb('+m.c.join(",")+')"></i>'+m.n+'</span>').join("");
restart();window.BrickBreaker={snapshot:()=>({state,wave,score,lives,scrap:save.scrap,mode,balls:balls.length,bricks:bricks.filter(b=>b.live).length,stats:{...stats},aim,assetCount,plan:plan.title,backend:"Planck.js",resolution:[W,H],hz:120,paddle:px(paddle)[0]})};
if(new URLSearchParams(location.search).has("test"))window.BrickBreaker.test={advance:n=>{for(let i=0;i<n;i++)step();ui();draw();},aim:x=>target=x,hit:()=>{let b=bricks.find(b=>b.live&&!b.anchor);if(!b)return;let a=balls[0];a.launched=true;a.body.setActive(true);a.body.setTransform(vec(b.x,b.y+b.h/2+22),0);a.body.setLinearVelocity(vec(0,-500));state="playing";},clear:()=>{for(let b of bricks)if(b.live)breakBrick(b,0,0,false);supports();state="playing";step();ui();},lose:()=>{for(let a of balls){a.launched=true;a.body.setActive(true);a.body.setTransform(vec(W/2,H+100),0);}state="playing";step();ui();}};
function loop(t){let delta=Math.min(.1,(t-(lastTime||t))/1000);lastTime=t;shock*=Math.pow(.035,delta);for(let r of impactRings)r.t-=delta;impactRings=impactRings.filter(r=>r.t>0);let pad=navigator.getGamepads?.()[0];if(pad){let a=pad.axes[0]||0;if(Math.abs(a)>.17)target=px(paddle)[0]+a*1500*delta;if(state==="ready"&&Math.abs(pad.axes[2]||0)>.2)aim=clamp(aim+pad.axes[2]*delta*1.7,-1.05,1.05);let press=!!pad.buttons[0]?.pressed;if(press&&!gamepadButton)launch();gamepadButton=press;}if(hitStop>0&&state==="playing"){hitStop-=delta;delta*=.18;}acc+=delta;while(acc>=DT){step();acc-=DT;}draw();if(frame%8===0||state!=="playing")ui();requestAnimationFrame(loop);}requestAnimationFrame(loop);
})();