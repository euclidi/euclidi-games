import {createMine} from './core.mjs';
import {createArt} from './art.mjs';
const $=s=>document.querySelector(s),cv=$('#cave'),c=cv.getContext('2d');
let m=createMine(),rate=1,view='both',tool='inspect',paused=false,stress=false,sound=false,ac,views=[],lastRev=-1;
const layer=()=>Object.assign(document.createElement('canvas'),{width:m.W,height:m.H}),terrain=layer(),world=layer(),shade=layer(),r=terrain.getContext('2d'),g=world.getContext('2d'),l=shade.getContext('2d');
const art=createArt();
function box(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
function hash(x,y){let h=Math.imul(x+123,374761393)^Math.imul(y+17,668265263);return ((h^(h>>>13))>>>0)%1000/1000}
const colors=[[89,87,81],[112,108,100],[53,61,62]];
function redraw(){let im=r.createImageData(m.W,m.H);for(let y=0;y<m.H;y++)for(let x=0;x<m.W;x++){let i=(y*m.W+x)*4,k=m.idx(x,y),p=colors[m.material[k]],s=m.density[k]?1:.35,h=(hash(x,y)-.5)*22+Math.sin(y*.4+Math.sin(x*.05)*4)*6,e=m.density[k]&&!m.solid(x,y+2)?-22:m.density[k]&&!m.solid(x-2,y)?18:0;for(let j=0;j<3;j++)im.data[i+j]=(p[j]+h+e)*s;im.data[i+3]=255}r.putImageData(im,0,0);lastRev=m.revision}
function lamp(x,y,rad,d=0){l.save();l.beginPath();let a=d<0?Math.PI:0,span=d?.75:Math.PI;if(d)l.moveTo(x,y);for(let i=0;i<=32;i++){let ang=a-span+2*span*i/32,X=x,Y=y;for(let t=3;t<=rad;t+=3){X=x+Math.cos(ang)*t;Y=y+Math.sin(ang)*t;if(m.solid(X,Y))break}if(!d&&i===0)l.moveTo(X,Y);else l.lineTo(X,Y)}l.closePath();l.clip();l.globalCompositeOperation='destination-out';let gr=l.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'#000');gr.addColorStop(.45,'rgba(0,0,0,.92)');gr.addColorStop(1,'rgba(0,0,0,0)');l.fillStyle=gr;l.fillRect(x-rad,y-rad,rad*2,rad*2);l.restore()}
function sprite(img,x,y,w=img.width,h=img.height){g.drawImage(img,Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function part(img,x,y,angle,ax,ay,w,h){g.save();g.translate(Math.round(x),Math.round(y));g.rotate(angle);sprite(img,-ax,-ay,w,h);g.restore()}
function person(a,i){
 let d=a.moving?a.dir:a.d,x=Math.round(a.x),F=m.F,phase=a.travel/31,work=a.job==='mine'&&!a.moving,working=!a.moving&&['support','rail','lamp','push'].includes(a.job);
 let bob=a.moving?Math.round(Math.abs(Math.sin(phase*Math.PI*2))*1.6):0, crouch=working?5:work?Math.round(Math.max(0,(a.data?.y-(F-30))*.12)):0;
 g.save();g.translate(x,F);g.scale(d,1);g.imageSmoothingEnabled=false;
 function leg(j){let p=(phase+j*.5)%1,st=.62,off=a.moving?(p<st?31*(st/2-p):31*(-st/2+st*(p-st)/(1-st))):j?4:-4;
 let lift=a.moving&&p>st?Math.sin((p-st)/(1-st)*Math.PI)*6:0,angle=Math.atan2(-off,19);
 part(art.legs[i],j?2:-2,-21+crouch-bob,angle,5,1,10,21-lift*.4)}
 leg(1);
 let sway=a.moving?Math.sin(phase*Math.PI*2)*.35:0;
 part(art.arms[i],-5,-38+crouch-bob,-sway,4,2,10,15);
 sprite(art.bodies[i],-13,-43+crouch-bob,26,23);
 leg(0);
 sprite(art.heads[i],-13,-62+crouch-bob,26,22);
 let shoulderX=6,shoulderY=-39+crouch-bob;
 if(work&&i===0){let p=Math.min(1,a.phase/1.05),theta=p<.55?-.5-p*2.1:-1.655+(p-.55)*5.8;
 part(art.arms[i],shoulderX,shoulderY,theta,4,2,10,15);
 let hx=shoulderX-Math.sin(theta)*11,hy=shoulderY+Math.cos(theta)*11;
 part(art.pick,hx,hy,theta+.6,6,29,36,34);
 }else if(work){part(art.arms[i],shoulderX,shoulderY,-1.03,4,2,10,15);sprite(art.drill,5,-36+crouch,39,14)}
 else if(a.moving&&['push','haul'].includes(a.job)){part(art.arms[i],shoulderX,shoulderY,.85,4,2,10,15)}
 else if(working){part(art.arms[i],shoulderX,shoulderY,-.8+Math.sin(a.phase*12)*.4,4,2,10,15)}
 else part(art.arms[i],shoulderX,shoulderY,sway,4,2,10,15);
 g.restore();return [x+d*9,F-54+crouch-bob,d]
}
function wallFixtures(){for(let x of m.lamps){let y=m.roof(x)+20;sprite(art.fixture,x-10,y-10,20,22)}}
function props(){
 let F=m.F;
 for(let p of m.posts){let y=m.roof(p.x),a=p.d>0?art.timber:art.steel;for(let j=y;j<F;j+=12){let h=Math.min(12,F-j);g.drawImage(a,0,0,a.width,h,Math.round(p.x-5),Math.round(j),10,h)}g.save();g.translate(p.x,y);g.rotate(Math.PI/2);sprite(a,-3,-15,7,30);g.restore()}
 for(let p of m.piles)for(let i=0;i<Math.min(35,p.n*4);i++){let x=p.x+(hash(i,p.x|0)-.5)*25,y=F-3-hash(i,7)*Math.min(19,p.n*2);sprite(art.rocks[i%3],x-3,y-3,6+hash(i,9)*4,5+hash(i,10)*3)}
 for(let a of m.miners){let x=a.cart,img=a.d>0?art.cart:art.barrow;g.save();g.translate(Math.round(x),F);g.scale(a.d,1);for(let i=0;i<a.load*2;i++)sprite(art.rocks[i%3],-15+hash(i,8)*25,-22-hash(i,6)*10,8,6);sprite(img,-23,-22,46,22);g.restore()}
 for(let p of m.chips)sprite(art.rocks[p.mat%3],p.x,p.y,Math.max(2,p.s*1.8),Math.max(2,p.s*1.4))
}
function draw(){if(lastRev!==m.revision)redraw();let F=m.F;g.drawImage(terrain,0,0);g.imageSmoothingEnabled=false;
for(let i=0;i<m.rail.length;i++)if(m.rail[i]){let x=i*16;for(let z=2;z<16;z+=8){box(g,x+z,F-1,5,7,'#76583c');box(g,x+z,F-1,5,1,'#bc945f')}if(m.rail[i]===2){box(g,x,F-3,16,2,'#b1b9b0');box(g,x,F+4,16,2,'#6e817c')}}
// Depth order: mounted fixtures and structure are behind all foreground actors.
// Illumination is composited separately; it never redraws the fixture geometry.
wallFixtures();props();
let lights=m.miners.map(person);l.clearRect(0,0,m.W,m.H);box(l,0,0,m.W,m.H,'rgba(8,12,15,.56)');for(let x of m.lamps){let y=m.roof(x)+16;lamp(x,y,83)}for(let [x,y,d] of lights){lamp(x,y,135,d);lamp(x,y,29)}g.drawImage(shade,0,0);
if(stress)for(let x=8;x<m.W-8;x+=8)if(m.open(x)){let v=m.span(x);box(g,x,m.roof(x),8,3,v>100?'#d16b55':v>75?'#d6b56a':'#79ad8c')}
c.fillStyle='#111514';c.fillRect(0,0,800,340);c.imageSmoothingEnabled=false;views=[];
function vp(dx,dw,x,z,label){let sw=dw/z,sh=340/z,sx=Math.max(0,Math.min(m.W-sw,x-sw/2)),sy=Math.max(0,Math.min(m.H-sh,F-sh*.77));c.drawImage(world,sx,sy,sw,sh,dx,0,dw,340);views.push({dx,dw,sx,sy,sw,sh,dh:340});box(c,dx+8,8,label.length*8+12,22,'#252923');c.fillStyle='#e3d7b9';c.font='12px monospace';c.fillText(label,dx+14,23)}
if(view==='both'){vp(0,399,m.miners[0].x+20,2,'WEST');vp(401,399,m.miners[1].x-20,2,'EAST')}else if(view==='map'){c.drawImage(world,0,0);views.push({dx:0,dw:800,sx:0,sy:0,sw:800,sh:220,dh:220})}else{let a=m.miners[view==='west'?0:1];vp(0,800,a.x+a.d*30,2.6,a.name.toUpperCase())}
}
function hud(){$('#crew').textContent=m.miners.map(a=>a.name+' / '+a.job.toUpperCase()+'\nDelivered '+Math.floor(a.earned)+' · Load '+a.load.toFixed(1)+'/'+a.cap+' · Stamina '+Math.max(0,Math.round(a.stamina))+'%').join('\n');$('#stats').textContent='Credits '+m.credits+' | Supports '+m.posts.length+' | Roof falls '+m.falls+' | Excavated '+m.removed+' | '+Math.floor(m.time)+' s'+(m.linked?' | BREAKTHROUGH':'');$('#log').textContent=m.log;m.miners.forEach((a,i)=>$('#up'+i).textContent='Upgrade '+a.name+' · '+a.level*12)}
for(let attr of ['view','speed','tool'])document.querySelectorAll('[data-'+attr+']').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-'+attr+']').forEach(q=>q.classList.toggle('active',q===b));if(attr==='view')view=b.dataset.view;if(attr==='tool')tool=b.dataset.tool;if(attr==='speed')rate=+b.dataset.speed;draw()});
$('#pause').onclick=()=>{paused=!paused;$('#pause').textContent=paused?'Resume':'Pause'};$('#reset').onclick=()=>{m=createMine(Date.now());lastRev=-1;draw();hud()};$('#stress').onclick=()=>{stress=!stress;$('#stress').classList.toggle('active',stress);draw()};
$('#up0').onclick=()=>m.upgrade(0);$('#up1').onclick=()=>m.upgrade(1);
$('#sound').onclick=()=>{sound=!sound;try{if(sound){ac=ac||new AudioContext();ac.resume()}}catch(e){sound=false}$('#sound').textContent=sound?'Sound on':'Sound off'};
function impact(){if(!sound||!ac)return;let n=Math.floor(ac.sampleRate*.11),b=ac.createBuffer(1,n,ac.sampleRate),v=b.getChannelData(0);for(let i=0;i<n;i++)v[i]=(Math.random()*2-1)*Math.exp(-i/n*6)*.12;let s=ac.createBufferSource();s.buffer=b;s.connect(ac.destination);s.start()}
cv.addEventListener('pointerdown',e=>{e.preventDefault();let b=cv.getBoundingClientRect(),X=(e.clientX-b.left)*800/b.width,Y=(e.clientY-b.top)*340/b.height,v=views.find(v=>X>=v.dx&&X<v.dx+v.dw&&Y<v.dh);if(v){m.act(tool,v.sx+(X-v.dx)/v.dw*v.sw,v.sy+Y/v.dh*v.sh);draw();hud()}});
window.meetingSeam={get state(){return m},get paused(){return paused},render:draw,art,layerOrder:['terrain','rail','wallFixtures','props','miners','lighting','overlay']};draw();hud();document.documentElement.dataset.gameReady='true';let last=performance.now(),acc=0,render=0,old=0;
function loop(now){let dt=Math.min(.08,(now-last)/1000);last=now;if(!paused){acc+=dt*rate;while(acc>=1/30){m.step(1/30);acc-=1/30}}if(now-render>40){draw();hud();if(m.removed!==old){impact();old=m.removed}render=now}requestAnimationFrame(loop)}requestAnimationFrame(loop);
