import {urbanAtlas} from './assets/urban-atlas.js';
import {FACADES,INTERIORS,MOOD_TINT,destinationFor} from './world-art.js';
import {witnessIncident,spreadRumors,rumorText} from './social.js';
import {SHOPS,RESIDENTS,INCIDENTS,isOpen,moneyFor,pathfind} from './content.js';
const $=id=>document.getElementById(id),T=16,KEY='euclidi.innuendo.v3',defaultState={version:3,cash:40,rep:0,calm:100,minute:540,day:0,x:264,y:232,look:0,style:'Witty',owned:[],home:false,relations:{},lastTalk:{},rumors:[],news:['Welcome to town. Find a job or meet your neighbors.'],shifts:0};
let S={...defaultState};try{let s=JSON.parse(localStorage.getItem(KEY));if(s?.version===3&&Number.isFinite(s.cash)&&Array.isArray(s.owned))S={...defaultState,...s}}catch{}
let world,room=-1,job=null,dialogue=false,muted=true,audio,run=false,held={},toastTimer,game,tab='directory',nextIncident=35,saveTimer=0,timeAcc=0,rumorTimer=0,bumpAt=0;
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),F=(x,y)=>y*27+x,door=b=>({x:(b.x+Math.floor(b.w/2)+.5)*T,y:(b.y+b.h+.5)*T});
const clock=()=>String(Math.floor(S.minute/60)).padStart(2,'0')+':'+String(S.minute%60).padStart(2,'0');
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}}
function log(t){S.news.unshift(clock()+'  '+t);S.news=S.news.slice(0,50);save();if(tab==='news')showTab('news')}
function beep(f=400){if(muted)return;try{audio=audio||new AudioContext();audio.resume();let o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.13)}catch{}}
function toast(t){$('toast').textContent=t;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',4200)}
function hud(){ $('time').textContent=['MON','TUE','WED','THU','FRI','SAT','SUN'][S.day%7]+' '+clock();$('cash').textContent='$'+S.cash;$('reputation').textContent='REP '+S.rep+' / CALM '+Math.floor(S.calm)+'%'}
function node(tag,text,cls){let e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
function button(label,fn,disabled=false){let b=node('button',label);b.disabled=disabled;b.onclick=()=>{beep(320);fn()};return b}
function close(){dialogue=false;$('dialogue').hidden=true}
function modal(title,lines,options){dialogue=true;world?.stop();let box=$('dialogue');box.replaceChildren(node('h2',title));for(let line of lines)box.append(node('p',line));for(let op of options)box.append(button(...op));box.hidden=false}
function showTab(name){tab=name;let p=$('panel');p.replaceChildren(node('h3',({directory:'TOWN DIRECTORY',contacts:'RESIDENT REGISTER',news:'LOCAL NEWS',style:'CHARACTER & PROPERTY'})[name]));
if(name==='directory')for(let b of SHOPS){let e=node('div',undefined,'entry'),v=node('div',b.name);v.append(node('small',isOpen(b,S.minute)?'Open · '+b.owner:'Closed · '+clockAt(b.open)));e.append(v,button('Go',()=>{if(!world){toast('Wait for the town to load.');return}if(job){toast('Finish the shift first.');return}close();if(room!==-1){switchRoom(-1,()=>world.navigateDoor(b))}else world.navigateDoor(b)}));p.append(e)}
if(name==='contacts')for(let n of RESIDENTS){let e=node('div',undefined,'entry'),v=node('div',n.name);v.append(node('small',n.mood));e.append(v,node('span',String(S.relations[n.id]||0)));p.append(e)}
if(name==='news')for(let n of S.news)p.append(node('div',n,'entry'));
if(name==='style'){p.append(node('p','Personality: '+S.style),button('Change personality',()=>{let a=['Witty','Deadpan','Outgoing','Reserved'];S.style=a[(a.indexOf(S.style)+1)%a.length];save();showTab(name)}),button('Next avatar',()=>{S.look=(S.look+1)%6;save()}),node('p','Owned: '+(S.owned.map(i=>SHOPS[i].product).join(', ')||'No outfits')),node('p',S.home?'Apartment owned.':'Apartment · $180'),S.home?button('Visit apartment',()=>{if(!job)switchRoom(8)}):button('Purchase',()=>{S.cash-=180;S.home=true;log('Purchased an apartment.');hud();showTab(name)},S.cash<180),node('p','Completed shifts: '+S.shifts))}
}
function clockAt(m){return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function talk(n){let r=S.relations[n.id]||0;modal(n.name+' / '+n.mood,[S.lastTalk[n.id]===S.day?n.reply:n.line,'Rapport '+r],[
['Take it literally',()=>reply(n,'literal')],['Make a double entendre',()=>reply(n,'pun')],['Compliment',()=>reply(n,'compliment')],['Ask for gossip',()=>reply(n,'gossip')],['Walk away',close]])}
function reply(n,type){let fresh=S.lastTalk[n.id]!==S.day,r=S.relations[n.id]||0,a=0,line='',rep=0,calm=0;
if(type==='literal'){a=2;line='Finally, someone who understands what I actually meant.';calm=3}
if(type==='pun'){let likes=['Mischievous','Shameless','Deadpan','Cheerful','Flirtatious','Competitive'].includes(n.mood);a=likes?4:-3;rep=likes?3:1;calm=likes?-2:-8;line=likes?'You have been here too long already.':'Please act your age.';if(S.style==='Deadpan')a++}
if(type==='compliment'){a=r>=8||n.mood==='Flirtatious'?4:r<0?-1:1;line=a<0?'I would prefer to keep things professional.':a>1?'I might start looking forward to seeing you.':'Well, thank you.'}
if(type==='gossip'){a=1;let rumor=(S.rumors||[]).find(r=>r.heard.includes(n.id));line=rumor?rumorText(rumor,'the new resident'):INCIDENTS[(n.id+S.day)%INCIDENTS.length][1]}
if(!fresh){a=Math.min(0,a);rep=0;calm=Math.min(0,calm)}
S.relations[n.id]=clamp(r+a,-40,100);S.lastTalk[n.id]=S.day;S.rep+=rep;S.calm=clamp(S.calm+calm,0,100);
if(fresh)log('Spoke to '+n.name+' ('+(a>=0?'+':'')+a+' rapport).');if(type==='pun'&&fresh&&room===-1){let witness=world.people.find(q=>q.n.id!==n.id&&d(q.sprite,world.player)<55);if(witness){S.rep++;witnessIncident(S,-1,witness.n.id,'remark');log(witness.n.name+' overheard the conversation.');line+=' A bystander snickers.'}}
hud();save();modal(n.name,[line,'Rapport '+S.relations[n.id]],[['Keep talking',()=>talk(n)],['Walk away',close]])}
function shopMenu(){let b=SHOPS[room];if(!b)return;modal(b.name,[b.line,b.task+' · Earn up to $'+b.pay],[['Start shift',()=>startJob(b)],['Talk to '+b.owner,()=>talk(RESIDENTS[b.id])],['Buy '+b.product+' · $'+b.price,()=>{S.cash-=b.price;S.owned.push(b.id);S.look=(b.id+1)%6;save();hud();shopMenu()},S.cash<b.price||S.owned.includes(b.id)],['Leave',()=>switchRoom(-1)],['Continue exploring',close]])}
function finishJob(score){if(!job)return;let b=job.b,pay=moneyFor(b,score);S.cash+=pay;S.rep+=score;S.shifts++;S.minute+=35;while(S.minute>=1440){S.minute-=1440;S.day++}job=null;world.clearCargo();log('Finished '+b.task+' at '+b.name+'; earned $'+pay+'.');hud();modal('SHIFT COMPLETE',[score+'/3 objectives achieved. Wages: $'+pay],[['Back to shop',shopMenu],['Explore',close]])}
function startJob(b){job={b,step:0,score:0,pressure:40,dirty:[1,1,1,1,1,1],orders:Array.from({length:3},()=>b.items?b.items[Math.floor(Math.random()*b.items.length)]:null),start:performance.now()};if(b.kind==='cargo'){close();world.spawnCargo();toast('Move the three crates to the delivery bay. ACT picks up or drops.');return}jobUI()}
function cancelJob(){job=null;world.clearCargo();shopMenu()}
function jobUI(){let j=job;if(!j)return;let b=j.b;
if(b.kind==='sort'){modal(b.task,['Order '+(j.step+1)+' / 3','Requested: '+j.orders[j.step]],b.items.map(v=>[b.verb+' '+v,()=>{if(v===j.orders[j.step])j.score++;nextJob()}]).concat([['Cancel',cancelJob]]))}
if(b.kind==='timing'){j.start=performance.now();modal(b.task,['Attempt '+(j.step+1)+' / 3','Stop the pointer inside the marked zone.'],[['Perform',()=>{let v=(1-Math.cos((performance.now()-j.start)/400))/2;if(v>=.62&&v<=.8)j.score++;nextJob()}],['Cancel',cancelJob]]);let m=node('div',undefined,'meter'),z=node('div',undefined,'zone'),n=node('div',undefined,'needle');z.style.left='62%';z.style.width='18%';n.id='needle';m.append(z,n);$('dialogue').insertBefore(m,$('dialogue').querySelector('button'))}
if(b.kind==='pressure'){let target=[60,75,45][j.step];modal('PRESSURE TEST',['Test '+(j.step+1)+' / 3','Target '+target+' PSI · Gauge '+j.pressure+' PSI'],[['Increase +5',()=>{j.pressure=clamp(j.pressure+5,0,100);jobUI()}],['Decrease −5',()=>{j.pressure=clamp(j.pressure-5,0,100);jobUI()}],['Test',()=>{if(Math.abs(j.pressure-target)<=5)j.score++;nextJob()}],['Cancel',cancelJob]])}
if(b.kind==='wash'){let dirty=j.dirty.reduce((a,b)=>a+b,0);modal('DETAIL THE CAR',['Clean each of the six panels. Remaining: '+dirty],j.dirty.map((v,i)=>[['Hood','Roof','Left door','Right door','Trunk','Windshield'][i],()=>{j.dirty[i]=0;jobUI()},!v]).concat([['Finish',()=>finishJob(Math.floor((6-dirty)/2))],['Cancel',cancelJob]]))}
}
function nextJob(){job.step++;if(job.step===3)finishJob(job.score);else jobUI()}
function switchRoom(id,cb){if(job||!world)return;close();if(room===-1&&world?.player){S.x=world.player.x;S.y=world.player.y}room=id;afterRoom=cb||null;world.scene.restart();save()}
let afterRoom=null;
function enter(b){if(!isOpen(b,S.minute)){toast(b.name+' opens at '+clockAt(b.open));return}switchRoom(b.id)}
function rest(){S.day++;S.minute=540;S.calm=100;log('Rested at home.');hud();close()}
function loadScript(src){return new Promise((ok,no)=>{let el=node('script');el.src=src;el.onload=()=>window.Phaser?ok():no(Error('Engine unavailable'));el.onerror=()=>{el.remove();no(Error('Engine download failed'))};document.head.append(el)})}
async function boot(){try{if(!window.Phaser){try{await loadScript('./vendor/phaser.min.js')}catch{try{await loadScript('https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js')}catch{await loadScript('https://cdnjs.cloudflare.com/ajax/libs/phaser/3.90.0/phaser.min.js')}}}launch()}catch(e){$('boot').textContent='Could not start the game: '+e.message}}
function launch(){class Town extends Phaser.Scene{
constructor(){super('Town')}
preload(){if(!this.textures.exists('urban'))this.load.spritesheet('urban',urbanAtlas,{frameWidth:16,frameHeight:16});this.load.on('loaderror',()=>{$('boot').textContent='Local urban atlas failed to decode.'})}
create(){world=this;this.cols=room===-1?72:26;this.rows=room===-1?42:19;this.blocked=new Set();this.walls=this.physics.add.staticGroup();this.props=this.physics.add.group();this.people=[];this.route=[];this.arrive=null;this.cargo=[];this.carry=null;this.goal=null;this.vehicles=[];this.owner=null;this.marker=null;this.lastLabel=null;this.lastLabelId=null;this.bay=null;this.bayMark=null;this.bayLabel=null;
this.physics.world.setBounds(0,0,this.cols*T,this.rows*T);if(room===-1)this.buildTown();else this.buildRoom();
let x=room===-1?clamp(S.x,10,this.cols*T-10):216,y=room===-1?clamp(S.y,10,this.rows*T-10):272;
if(this.blocked.has(Math.floor(y/T)*this.cols+Math.floor(x/T))){x=264;y=232}
this.player=this.person(x,y,S.look);this.player.body.setMass(5);this.physics.add.collider(this.player,this.walls);this.physics.add.collider(this.player,this.props,(_,obj)=>{if(job||performance.now()-bumpAt<2500||Math.hypot(obj.body.velocity.x,obj.body.velocity.y)<10)return;let w=this.people.find(q=>q.sprite.visible&&d(q.sprite,obj)<42);if(w){bumpAt=performance.now();S.calm=Math.max(0,S.calm-4);witnessIncident(S,-1,w.n.id,'collision');log(w.n.name+' witnessed an awkward collision.');toast('Oops. '+w.n.name+' saw that.');hud()}});this.physics.add.collider(this.props,this.walls);this.physics.add.collider(this.props,this.props);
for(let n of this.people){this.physics.add.collider(n.sprite,this.walls)}
this.cam=this.cameras.main;this.cam.setBounds(0,0,this.cols*T,this.rows*T);this.cam.setZoom(2);this.cam.roundPixels=true;this.cam.startFollow(this.player,true,.18,.18);
this.tint=this.add.rectangle(0,0,this.cols*T,this.rows*T,0x142844,0).setOrigin(0).setDepth(9999);
this.input.on('pointerdown',p=>{if(dialogue)return;let v=this.cam.getWorldPoint(p.x,p.y);if(room===-1){let b=SHOPS.find(b=>v.x>=b.x*T&&v.x<(b.x+b.w)*T&&v.y>=b.y*T&&v.y<(b.y+b.h)*T);if(b){this.navigateDoor(b);return}let n=this.people.find(n=>n.sprite.visible&&d(n.sprite,v)<11);if(n){this.navigate(n.sprite.x,n.sprite.y+17,()=>{if(d(n.sprite,this.player)<32)talk(n.n);else toast('They have moved. Try again.')});return}}this.navigate(v.x,v.y)});
$('district').textContent=room===-1?'MAIN STREET':room===8?'APARTMENT':SHOPS[room].name.toUpperCase();$('boot').hidden=true;showTab(tab);hud();if(afterRoom){let cb=afterRoom;afterRoom=null;cb()}}
tile(x,y,c,r,z=0){return this.add.image(x*T+8,y*T+8,'urban',F(c,r)).setDepth(z)}
rect(x,y,w,h,col,z=0,a=1){return this.add.rectangle(x,y,w,h,col,a).setOrigin(0).setDepth(z)}
label(x,y,t,z=20){return this.add.text(x,y,t,{fontFamily:'monospace',fontSize:'7px',color:'#fff0cc',backgroundColor:'#242a2d',padding:{x:3,y:2}}).setOrigin(.5).setDepth(z)}
solid(x,y,w,h){let a=this.add.zone((x+w/2)*T,(y+h/2)*T,w*T,h*T);this.physics.add.existing(a,true);this.walls.add(a);for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)this.blocked.add(yy*this.cols+xx)}
buildTown(){for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++){
let road=(y>=15&&y<=19)||(y>=35&&y<=39)||[17,18,19,35,36,37,53,54,55].includes(x);
let walk=(y>=11&&y<=14)||(y>=20&&y<=22)||(y>=32&&y<=34)||y>=40||[16,20,34,38,52,56].includes(x);
if(road){this.tile(x,y,1,16);if((y===17||y===37)&&x%3===0)this.rect(x*T+2,y*T+7,10,1,0xd7c69c,1);if([18,36,54].includes(x)&&y%3===0)this.rect(x*T+7,y*T+2,1,10,0xd7c69c,1)}
else if(walk)this.tile(x,y,9,1);else this.tile(x,y,1,1)}
for(let b of SHOPS){for(let yy=0;yy<b.h-2;yy++)for(let xx=0;xx<b.w;xx++){
let f=FACADES[b.id],c=f.roof[0]+(xx===0?0:xx===b.w-1?2:1),r=f.roof[1]+(yy===0?0:yy===b.h-3?2:1);
this.tile(b.x+xx,b.y+yy,c,r,4)}
let f=FACADES[b.id];for(let xx=0;xx<b.w;xx++){let c=xx===Math.floor(b.w/2)?12:xx%3===0?13:f.wall[0];this.tile(b.x+xx,b.y+b.h-2,c,4,5);this.tile(b.x+xx,b.y+b.h-1,c,5,5)}
this.rect(b.x*T,(b.y+b.h-2)*T,b.w*T,5,f.accent,6);for(let a=0;a<b.w*T;a+=12)this.rect(b.x*T+a,(b.y+b.h-2)*T+5,6,3,f.awning,6);this.label((b.x+b.w/2)*T,(b.y+b.h-3)*T-3,f.text,12);
this.solid(b.x,b.y,b.w,b.h);this.label((b.x+b.w/2)*T,(b.y+b.h-2)*T,b.sign,10);
let p=door(b);this.add.circle(p.x,p.y+4,2,0xc4d99d).setDepth(10);
for(let xx of [b.x,b.x+b.w-1]){this.tile(xx,b.y+b.h,16,8,10);this.tile(xx,b.y+b.h+1,16,9,10)}
}
for(let x of [1,15,33,51,70])for(let y of [2,12,23,33,40]){this.tile(x,y,18,8,5);this.tile(x,y+1,18,9,6)}
for(let i=0;i<6;i++){let x=5+i*11,y=i%2?38:16;let v=this.add.container(x*T,y*T).setDepth(8);v.add(this.add.image(0,0,'urban',F(15+i%4,15)));v.add(this.add.image(0,16,'urban',F(15+i%4,16)));this.vehicles.push({v,lane:y*T,speed:28+i*3,dir:i%2?-1:1})}
for(let n of RESIDENTS){let b=SHOPS[n.id%8],p=door(b),sp=this.person(p.x+(n.id<8?-26:26),p.y+18,n.look);sp.setTint(MOOD_TINT[n.id%MOOD_TINT.length]);this.people.push({n,sprite:sp,path:[],next:1+n.id*.2,destination:n.id%8})}
for(let b of SHOPS.filter(b=>b.id%2===0)){let p=door(b);this.prop(p.x-39,p.y+13,F(4,10))}
}
buildRoom(){let b=SHOPS[room];for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++){this.tile(x,y,b?.kind==='wash'?9:1,b?.kind==='wash'?1:4);if(x===0||x===this.cols-1||y===0||y===this.rows-1)this.tile(x,y,1,3,1)}
this.solid(0,0,26,2);this.solid(0,2,1,16);this.solid(25,2,1,16);this.solid(0,18,26,1);this.label(208,26,b?b.sign:'PRIVATE RESIDENCE',50);
let layout=INTERIORS[room]||INTERIORS[8];for(let [x,y,c,r,w,h] of layout){for(let j=0;j<w;j++)for(let k=0;k<h;k++)this.tile(x+j,y+k,c+j,r+k,4);this.solid(x,y,w,h)}
if(b){this.rect(32,38,352,4,FACADES[b.id].accent,8);this.label(208,47,b.task.toUpperCase(),20);}
if(b){for(let x=10;x<16;x++)this.tile(x,4,9+x%2,13,5);this.solid(10,4,6,1);let n=RESIDENTS[b.id];this.owner=this.person(216,112,n.look);this.people.push({n,sprite:this.owner,path:[]});this.label(216,97,n.name,20)}
this.label(216,287,'EXIT',20)}
person(x,y,look){let p=this.physics.add.sprite(x,y,'urban',F(23,look*3));p.body.setSize(8,8).setOffset(4,8);p.setCollideWorldBounds(true);p.dir=23;p.phase=0;p.look=look;return p}
animate(p,dt,look=p.look){let v=p.body.velocity;if(Math.abs(v.x)+Math.abs(v.y)>1){p.dir=Math.abs(v.x)>Math.abs(v.y)?v.x<0?24:26:v.y<0?25:23;p.phase+=dt*.009}else p.phase=0;p.setFrame(F(p.dir,look*3+[0,1,0,2][Math.floor(p.phase)%4]));p.setDepth(100+Math.floor(p.y))}
prop(x,y,frame){let p=this.props.create(x,y,'urban',frame);p.body.setSize(12,12).setOffset(2,4);p.setDrag(140).setMaxVelocity(90).setBounce(.15).setCollideWorldBounds(true);return p}
findPath(p,x,y){let a={x:clamp(Math.floor(p.x/T),0,this.cols-1),y:clamp(Math.floor(p.y/T),0,this.rows-1)},e={x:clamp(Math.floor(x/T),0,this.cols-1),y:clamp(Math.floor(y/T),0,this.rows-1)};if(this.blocked.has(e.y*this.cols+e.x)){let best=Infinity,found=null;for(let yy=Math.max(0,e.y-4);yy<Math.min(this.rows,e.y+5);yy++)for(let xx=Math.max(0,e.x-4);xx<Math.min(this.cols,e.x+5);xx++){let z=Math.hypot(xx-e.x,yy-e.y);if(z<best&&!this.blocked.has(yy*this.cols+xx)){best=z;found={x:xx,y:yy}}}if(!found)return [];e=found}
let route=pathfind(this.cols,this.rows,this.blocked,a,e).map(q=>({x:(q.x+.5)*T,y:(q.y+.5)*T}));if(!route.length&&a.x===e.x&&a.y===e.y)route.push({x:(e.x+.5)*T,y:(e.y+.5)*T});return route}
stop(){this.route=[];this.arrive=null;this.player?.setVelocity(0);if(this.marker){this.marker.destroy();this.marker=null}}
navigate(x,y,cb){this.stop();this.route=this.findPath(this.player,x,y);if(!this.route.length){toast('No route available.');return}this.arrive=cb;let t=this.route[this.route.length-1];this.marker=this.add.rectangle(t.x,t.y,8,8).setStrokeStyle(1,0xffd879).setDepth(8000)}
navigateDoor(b){let p=door(b);this.navigate(p.x,p.y,()=>enter(b))}
follow(p,path,speed){if(!path.length){p.setVelocity(0);return}let a=path[0],len=d(p,a);if(len<3){path.shift();p.setVelocity(0)}else p.setVelocity((a.x-p.x)/len*speed,(a.y-p.y)/len*speed)}
spawnCargo(){this.clearCargo();this.bay={x:344,y:228};this.bayMark=this.add.rectangle(344,228,48,36,0x8bb767,.2).setStrokeStyle(1,0xbce594).setDepth(4);this.bayLabel=this.label(344,202,'DELIVERY BAY',25);for(let i=0;i<3;i++)this.cargo.push(this.prop(80+i*20,220,F(4,10)))}
clearCargo(){for(let c of this.cargo||[])if(c.active)c.destroy();this.cargo=[];this.carry=null;this.bayMark?.destroy();this.bayLabel?.destroy();this.bay=null}
nearest(){let p=this.player;if(job?.b.kind==='cargo'){if(this.carry)return {kind:'cargo',sprite:this.carry};let c=this.cargo.find(c=>c.active&&d(c,p)<25);if(c)return {kind:'cargo',sprite:c}}
if(room!==-1){if(p.y>257&&Math.abs(p.x-216)<34)return {kind:'exit'};if(room===8&&p.y<130)return {kind:'rest'};if(this.owner&&d(p,this.owner)<28)return {kind:'owner'}}
else{let b=SHOPS.find(b=>d(p,door(b))<20);if(b)return {kind:'door',b};let n=this.people.find(n=>n.sprite.visible&&d(n.sprite,p)<24);if(n)return {kind:'npc',n:n.n}}
return null}
act(){if(dialogue)return;let n=this.nearest();if(job?.b.kind==='cargo'){if(n?.kind==='cargo'){if(this.carry){let c=this.carry;this.carry=null;c.body.enable=true;c.body.reset(this.player.x,this.player.y+14)}else{this.carry=n.sprite;this.carry.body.enable=false}return}toast('Deliver the crates to the marked bay.');return}if(n?.kind==='door')enter(n.b);else if(n?.kind==='npc')talk(n.n);else if(n?.kind==='owner')shopMenu();else if(n?.kind==='exit')switchRoom(-1);else if(n?.kind==='rest')modal('YOUR APARTMENT',['Rest to recover composure.'],[['Sleep until morning',rest],['Continue',close]]);else toast('Approach a resident or doorway.')}
update(t,dt){dt=Math.min(dt,50);let sec=dt/1000,p=this.player;if(!p)return;
let dx=(held.right?1:0)-(held.left?1:0),dy=(held.down?1:0)-(held.up?1:0),speed=run||held.shift?98:65;
if(dialogue)p.setVelocity(0);else if(dx||dy){this.stop();let a=Math.hypot(dx,dy);p.setVelocity(dx/a*speed,dy/a*speed)}else if(this.route.length){this.follow(p,this.route,speed);if(!this.route.length){let cb=this.arrive;this.stop();if(cb){cb();return}}}else p.setVelocity(0);
this.animate(p,dt,S.look);
if(room===-1){S.x=p.x;S.y=p.y;for(let q of this.people){let visible=q.n.work===undefined||!isOpen(SHOPS[q.n.work],S.minute);q.sprite.setVisible(visible);q.sprite.body.enable=visible;if(!visible)continue;if(d(q.sprite,p)<20){q.sprite.setVelocity(0);continue}q.next-=sec;if(!q.path.length&&q.next<=0){q.destination=destinationFor(q.n,S.minute,S.day,q.destination);let dest=door(SHOPS[q.destination]);q.path=this.findPath(q.sprite,dest.x+(q.n.id%3-1)*16,dest.y+24);q.next=2+q.n.id%4}this.follow(q.sprite,q.path,25+q.n.id%4*4);this.animate(q.sprite,dt);if(q.sprite.visible&&d(q.sprite,p)<42&&q.n.id!==this.lastLabelId){this.lastLabelId=q.n.id;this.lastLabel?.destroy();this.lastLabel=this.label(q.sprite.x,q.sprite.y-16,q.n.name,9000)}}
for(let v of this.vehicles){v.v.x+=v.speed*sec*v.dir;if(v.v.x>this.cols*T+32)v.v.x=-32;if(v.v.x< -32)v.v.x=this.cols*T+32}}
for(let obj of this.props.getChildren())if(obj.active)obj.setDepth(100+Math.floor(obj.y));
if(this.carry){this.carry.setPosition(p.x,p.y-7);this.carry.setDepth(p.depth+1)}
if(job?.b.kind==='cargo'&&this.bay){for(let c of this.cargo.slice()){if(c.active&&c!==this.carry&&d(c,this.bay)<19){this.cargo=this.cargo.filter(x=>x!==c);c.destroy();job.score++;beep(550);toast('Delivered '+job.score+'/3');if(job.score===3){finishJob(3);break}}}}
if(job?.b.kind==='timing'&&$('needle'))$('needle').style.left=((1-Math.cos((performance.now()-job.start)/400))*50)+'%';
rumorTimer+=sec;if(room===-1&&rumorTimer>=8){rumorTimer=0;let contacts=[];for(let i=0;i<this.people.length;i++)for(let j=i+1;j<this.people.length;j++){let a=this.people[i],b=this.people[j];if(a.sprite.visible&&b.sprite.visible&&d(a.sprite,b.sprite)<36)contacts.push([a.n.id,b.n.id])}let changed=spreadRumors(S,contacts);for(let c of changed){let n=RESIDENTS[c.target];if(n){log(n.name+' heard a rumor about your public behavior.');S.rep++}}}
timeAcc+=sec;saveTimer+=sec;nextIncident-=sec;if(timeAcc>=1){timeAcc-=1;S.minute++;if(S.minute>=1440){S.minute=0;S.day++}if(!job)S.calm=Math.min(100,S.calm+.15);hud()}
if(nextIncident<=0){nextIncident=48;let e=INCIDENTS[(Math.floor(Math.random()*INCIDENTS.length))];log(e[1]);toast(e[0]+' — see local news')}
if(saveTimer>=7){saveTimer=0;save()}
if(this.lastLabel){let q=this.people.find(q=>q.n.id===this.lastLabelId);if(!q||!q.sprite.visible||d(q.sprite,p)>48){this.lastLabel.destroy();this.lastLabel=null;this.lastLabelId=null}else this.lastLabel.setPosition(q.sprite.x,q.sprite.y-16)}
this.tint.setAlpha(room===-1?(S.minute<360||S.minute>=1200?.32:S.minute>=1080?.14:0):0);
let n=this.nearest();$('prompt').textContent=job?.b.kind==='cargo'?'DELIVERY '+job.score+'/3':n?.kind==='door'?'ACT · '+n.b.name:n?.kind==='npc'?'ACT · '+n.n.name:n?.kind==='owner'?'ACT · Business menu':n?.kind==='exit'?'ACT · Exit':n?.kind==='rest'?'ACT · Rest':'Tap a destination';
}}
game=new Phaser.Game({type:Phaser.AUTO,width:640,height:400,parent:'canvas',pixelArt:true,antialias:false,roundPixels:true,backgroundColor:'#252e31',banner:false,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{x:0,y:0},debug:false}},scene:[Town]});
}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
document.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held[b.dataset.move]=true;world?.stop()};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>held[b.dataset.move]=false});
$('run').onclick=()=>{run=!run;$('run').textContent=run?'WALK':'RUN'};$('act').onclick=()=>world?.act();$('mute').onclick=()=>{muted=!muted;$('mute').textContent=muted?'SOUND OFF':'SOUND ON';beep()};
let km={w:'up',a:'left',s:'down',d:'right',arrowup:'up',arrowdown:'down',arrowleft:'left',arrowright:'right'};
window.addEventListener('keydown',e=>{let k=e.key.toLowerCase();if(km[k]){held[km[k]]=true;e.preventDefault();world?.stop()}if(k==='shift')held.shift=true;if(k==='e'&&!e.repeat)world?.act();if(k==='escape'&&!job)close()});window.addEventListener('keyup',e=>{let k=e.key.toLowerCase();if(km[k])held[km[k]]=false;if(k==='shift')held.shift=false});window.addEventListener('blur',()=>held={});window.addEventListener('pagehide',save);
hud();showTab('directory');boot();
