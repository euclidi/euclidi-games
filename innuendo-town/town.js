import {urbanAtlas} from './assets/urban-atlas.js';
import {facing,characterFrame} from './sprite-art.js?v=051';
import {ART_VERSION,installWorldBackdrop,installRoomBackdrop,installActor,actorPortrait,installVehicles,VEHICLES,installCrate,installEffects} from './presentation.js?v=070';
import {TownSound} from './town-sound.js?v=070';
import {FACADES,INTERIORS,MOOD_TINT} from './world-art.js';
import {ensureTownAI,advanceTownAI,townContacts,residentStatus} from './town-ai.js?v=060';
import {witnessIncident,spreadRumors,rumorText} from './social.js';
import {SHOPS,RESIDENTS,INCIDENTS,isOpen,moneyFor,pathfind} from './content.js';
const $=id=>document.getElementById(id),T=16,KEY='euclidi.innuendo.v3',defaultState={version:3,cash:40,rep:0,calm:100,minute:540,day:0,x:264,y:232,look:0,style:'Witty',owned:[],home:false,relations:{},lastTalk:{},rumors:[],news:['Welcome to town. Find a job or meet your neighbors.'],shifts:0};
let S={...defaultState};try{let s=JSON.parse(localStorage.getItem(KEY));if(s?.version===3&&Number.isFinite(s.cash)&&Array.isArray(s.owned))S={...defaultState,...s}}catch{}
S.townAI=ensureTownAI(S.townAI,S.day*1440+S.minute,SHOPS,RESIDENTS);
const soundscape=new TownSound();
let world,room=-1,job=null,dialogue=false,muted=true,run=false,held={},toastTimer,game,tab='directory',saveTimer=0,timeAcc=0,rumorTimer=0,bumpAt=0;
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),F=(x,y)=>y*27+x,door=b=>({x:(b.x+Math.floor(b.w/2)+.5)*T,y:(b.y+b.h+.5)*T});
const clock=()=>String(Math.floor(S.minute/60)).padStart(2,'0')+':'+String(S.minute%60).padStart(2,'0');
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}}
function log(t){S.news.unshift(clock()+'  '+t);S.news=S.news.slice(0,50);save();if(tab==='news')showTab('news')}
function syncTown(){
 const events=advanceTownAI(S.townAI,S.day*1440+S.minute+timeAcc,SHOPS,RESIDENTS,pathfind);
 for(const e of events){if(e.kind==='awkward')witnessIncident(S,e.actor,e.witness,'remark');log(e.text)}
}
function registerText(n){const a=S.townAI.agents[n.id];return n.mood+' · '+residentStatus(S.townAI,n.id,SHOPS)+' · $'+a.cash+' · Hunger '+Math.round(a.needs.hunger)+' / Fatigue '+Math.round(a.needs.fatigue)+' / Social '+Math.round(a.needs.social)}
function shopStatus(b){const a=S.townAI.shops[b.id];return (isOpen(b,S.minute)?'Open · '+b.owner:'Closed · '+clockAt(b.open))+' · Stock '+a.stock+' · Visits '+a.customers}
function refreshRegister(){for(const e of document.querySelectorAll('[data-resident-status]'))e.textContent=registerText(RESIDENTS[+e.dataset.residentStatus]);for(const e of document.querySelectorAll('[data-shop-status]'))e.textContent=shopStatus(SHOPS[+e.dataset.shopStatus])}
function beep(f=400){soundscape.cue(f)}

function toast(t){$('toast').textContent=t;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',4200)}
function hud(){ $('time').textContent=['MON','TUE','WED','THU','FRI','SAT','SUN'][S.day%7]+' '+clock();$('cash').textContent='$'+S.cash;$('reputation').textContent='REP '+S.rep+' / CALM '+Math.floor(S.calm)+'%'}
function node(tag,text,cls){let e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
function button(label,fn,disabled=false){let b=node('button',label);b.disabled=disabled;b.onclick=()=>{beep(320);fn()};return b}
function close(){dialogue=false;$('dialogue').hidden=true}
function modal(title,lines,options){dialogue=true;world?.stop();let box=$('dialogue');box.replaceChildren(node('h2',title));for(let line of lines)box.append(node('p',line));for(let op of options)box.append(button(...op));box.hidden=false}
function showTab(name){tab=name;for(const el of document.querySelectorAll('[data-tab]')){el.classList.toggle('selected',el.dataset.tab===name);el.setAttribute('aria-pressed',String(el.dataset.tab===name))}let p=$('panel');p.replaceChildren(node('h3',({directory:'TOWN DIRECTORY',contacts:'RESIDENT REGISTER',news:'LOCAL NEWS',style:'CHARACTER & PROPERTY'})[name]));
if(name==='directory')for(let b of SHOPS){let e=node('div',undefined,'entry'),v=node('div',b.name);let detail=node('small',shopStatus(b));detail.dataset.shopStatus=b.id;v.append(detail);e.append(v,button('Go',()=>{if(!world){toast('Wait for the town to load.');return}if(job){toast('Finish the shift first.');return}close();if(room!==-1){switchRoom(-1,()=>world.navigateDoor(b))}else world.navigateDoor(b)}));p.append(e)}
if(name==='contacts')for(let n of RESIDENTS){let e=node('div',undefined,'entry resident-entry'),v=node('div',n.name);let detail=node('small',registerText(n));detail.dataset.residentStatus=n.id;v.append(detail);if(world?.textures){let img=document.createElement('img');img.className='portrait';img.alt='';img.src=actorPortrait(world,n.look,n.id);e.append(img)}e.append(v,node('span',String(S.relations[n.id]||0)));p.append(e)}
if(name==='news')for(let n of S.news)p.append(node('div',n,'entry'));
if(name==='style'){p.append(node('p','Personality: '+S.style),button('Change personality',()=>{let a=['Witty','Deadpan','Outgoing','Reserved'];S.style=a[(a.indexOf(S.style)+1)%a.length];save();showTab(name)}),button('Next avatar',()=>{S.look=(S.look+1)%6;save()}),node('p','Owned: '+(S.owned.map(i=>SHOPS[i].product).join(', ')||'No outfits')),node('p',S.home?'Apartment owned.':'Apartment · $180'),S.home?button('Visit apartment',()=>{if(!job)switchRoom(8)}):button('Purchase',()=>{S.cash-=180;S.home=true;log('Purchased an apartment.');hud();showTab(name)},S.cash<180),node('p','Completed shifts: '+S.shifts))}
}
function clockAt(m){return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function talk(n){let r=S.relations[n.id]||0;modal(n.name+' / '+n.mood,[S.lastTalk[n.id]===S.day?n.reply:n.line,residentStatus(S.townAI,n.id,SHOPS),'Rapport '+r],[
['Take it literally',()=>reply(n,'literal')],['Make a double entendre',()=>reply(n,'pun')],['Compliment',()=>reply(n,'compliment')],['Ask for gossip',()=>reply(n,'gossip')],['Walk away',close]])}
function reply(n,type){let fresh=S.lastTalk[n.id]!==S.day,r=S.relations[n.id]||0,a=0,line='',rep=0,calm=0;
if(type==='literal'){a=2;line='Finally, someone who understands what I actually meant.';calm=3}
if(type==='pun'){let likes=['Mischievous','Shameless','Deadpan','Cheerful','Flirtatious','Competitive'].includes(n.mood);a=likes?4:-3;rep=likes?3:1;calm=likes?-2:-8;line=likes?'You have been here too long already.':'Please act your age.';if(S.style==='Deadpan')a++}
if(type==='compliment'){a=r>=8||n.mood==='Flirtatious'?4:r<0?-1:1;line=a<0?'I would prefer to keep things professional.':a>1?'I might start looking forward to seeing you.':'Well, thank you.'}
if(type==='gossip'){a=1;let rumor=(S.rumors||[]).find(r=>r.heard.includes(n.id));line=rumor?rumorText(rumor,rumor.actor===-1?'the new resident':RESIDENTS[rumor.actor]?.name||'a neighbor'):(S.townAI.events.slice().reverse().find(e=>e.actor===n.id||e.witness===n.id)?.text||'Nothing new to report yet.')}
if(!fresh){a=Math.min(0,a);rep=0;calm=Math.min(0,calm)}
S.relations[n.id]=clamp(r+a,-40,100);S.lastTalk[n.id]=S.day;S.rep+=rep;S.calm=clamp(S.calm+calm,0,100);
if(fresh)log('Spoke to '+n.name+' ('+(a>=0?'+':'')+a+' rapport).');if(type==='pun'&&fresh&&room===-1){let witness=world.people.find(q=>q.sprite.visible&&q.n.id!==n.id&&d(q.sprite,world.player)<55);if(witness){S.rep++;witnessIncident(S,-1,witness.n.id,'remark');log(witness.n.name+' overheard the conversation.');line+=' A bystander snickers.'}}
hud();save();modal(n.name,[line,'Rapport '+S.relations[n.id]],[['Keep talking',()=>talk(n)],['Walk away',close]])}
function shopMenu(){let b=SHOPS[room];if(!b)return;const store=S.townAI.shops[b.id],owner=S.townAI.agents[b.id],present=owner.place===b.id;modal(b.name,[present?b.line:b.owner+' is '+residentStatus(S.townAI,b.id,SHOPS).toLowerCase()+'. Service counter is available.',b.task+' · Earn up to $'+b.pay,'Stock '+store.stock+' · Customer visits '+store.customers],[['Start shift',()=>startJob(b)],['Talk to '+b.owner,()=>talk(RESIDENTS[b.id]),!present],['Buy '+b.product+' · $'+b.price,()=>{if(store.stock<1||S.cash<b.price)return shopMenu();S.cash-=b.price;store.stock--;store.cash+=b.price;store.revenue+=b.price;S.owned.push(b.id);S.look=(b.id+1)%6;save();hud();shopMenu()},S.cash<b.price||S.owned.includes(b.id)||store.stock<1],['Leave',()=>switchRoom(-1)],['Continue exploring',close]])}
function finishJob(score){if(!job)return;let b=job.b,pay=moneyFor(b,score);S.cash+=pay;S.rep+=score;S.shifts++;S.minute+=35;while(S.minute>=1440){S.minute-=1440;S.day++}job=null;world.clearCargo();soundscape.play('coins');syncTown();log('Finished '+b.task+' at '+b.name+'; earned $'+pay+'.');hud();modal('SHIFT COMPLETE',[score+'/3 objectives achieved. Wages: $'+pay],[['Back to shop',shopMenu],['Explore',close]])}
function startJob(b){job={b,step:0,score:0,pressure:40,dirty:[1,1,1,1,1,1],orders:Array.from({length:3},()=>b.items?b.items[Math.floor(Math.random()*b.items.length)]:null),start:performance.now()};if(b.kind==='cargo'){close();world.spawnCargo();toast('Move the three crates to the delivery bay. ACT picks up or drops.');return}jobUI()}
function cancelJob(){job=null;world.clearCargo();shopMenu()}
function jobUI(){let j=job;if(!j)return;let b=j.b;
if(b.kind==='sort'){modal(b.task,['Order '+(j.step+1)+' / 3','Requested: '+j.orders[j.step]],b.items.map(v=>[b.verb+' '+v,()=>{if(v===j.orders[j.step])j.score++;nextJob()}]).concat([['Cancel',cancelJob]]))}
if(b.kind==='timing'){j.start=performance.now();modal(b.task,['Attempt '+(j.step+1)+' / 3','Stop the pointer inside the marked zone.'],[['Perform',()=>{let v=(1-Math.cos((performance.now()-j.start)/400))/2;if(v>=.62&&v<=.8)j.score++;nextJob()}],['Cancel',cancelJob]]);let m=node('div',undefined,'meter'),z=node('div',undefined,'zone'),n=node('div',undefined,'needle');z.style.left='62%';z.style.width='18%';n.id='needle';m.append(z,n);$('dialogue').insertBefore(m,$('dialogue').querySelector('button'))}
if(b.kind==='pressure'){let target=[60,75,45][j.step];modal('PRESSURE TEST',['Test '+(j.step+1)+' / 3','Target '+target+' PSI · Gauge '+j.pressure+' PSI'],[['Increase +5',()=>{j.pressure=clamp(j.pressure+5,0,100);jobUI()}],['Decrease −5',()=>{j.pressure=clamp(j.pressure-5,0,100);jobUI()}],['Test',()=>{if(Math.abs(j.pressure-target)<=5)j.score++;nextJob()}],['Cancel',cancelJob]])}
if(b.kind==='wash'){let dirty=j.dirty.reduce((a,b)=>a+b,0);modal('DETAIL THE CAR',['Clean each of the six panels. Remaining: '+dirty],j.dirty.map((v,i)=>[['Hood','Roof','Left door','Right door','Trunk','Windshield'][i],()=>{j.dirty[i]=0;jobUI()},!v]).concat([['Finish',()=>finishJob(Math.floor((6-dirty)/2))],['Cancel',cancelJob]]))}
}
function nextJob(){job.step++;if(job.step===3)finishJob(job.score);else jobUI()}
function switchRoom(id,cb){if(job||!world)return;soundscape.play('door');close();if(room===-1&&world?.player){S.x=world.player.x;S.y=world.player.y}room=id;afterRoom=cb||null;world.scene.restart();save()}
let afterRoom=null;
function enter(b){if(!isOpen(b,S.minute)){toast(b.name+' opens at '+clockAt(b.open));return}switchRoom(b.id)}
function rest(){S.day++;S.minute=540;S.calm=100;syncTown();log('Rested at home.');hud();close()}
function loadScript(src){return new Promise((ok,no)=>{let el=node('script');el.src=src;el.onload=()=>window.Phaser?ok():no(Error('Engine unavailable'));el.onerror=()=>{el.remove();no(Error('Engine download failed'))};document.head.append(el)})}
async function boot(){try{if(!window.Phaser){try{await loadScript('./vendor/phaser.min.js')}catch{try{await loadScript('https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js')}catch{await loadScript('https://cdnjs.cloudflare.com/ajax/libs/phaser/3.90.0/phaser.min.js')}}}launch()}catch(e){$('boot').textContent='Could not start the game: '+e.message}}
function launch(){class Town extends Phaser.Scene{
constructor(){super('Town')}
preload(){if(!this.textures.exists('urban'))this.load.spritesheet('urban',urbanAtlas,{frameWidth:16,frameHeight:16});this.load.on('loaderror',()=>{$('boot').textContent='Local urban atlas failed to decode.'})}
create(){world=this;this.effects=installEffects(this);this.crateKey=installCrate(this);this.carKey=installVehicles(this);this.shadows=[];this.cols=room===-1?72:26;this.rows=room===-1?42:19;this.blocked=new Set();this.walls=this.physics.add.staticGroup();this.props=this.physics.add.group();this.people=[];this.route=[];this.arrive=null;this.cargo=[];this.carry=null;this.goal=null;this.vehicles=[];this.owner=null;this.marker=null;this.lastLabel=null;this.lastLabelId=null;this.bay=null;this.bayMark=null;this.bayLabel=null;
this.physics.world.setBounds(0,0,this.cols*T,this.rows*T);if(room===-1)this.buildTown();else this.buildRoom();
let x=room===-1?clamp(S.x,10,this.cols*T-10):216,y=room===-1?clamp(S.y,10,this.rows*T-10):272;
if(this.blocked.has(Math.floor(y/T)*this.cols+Math.floor(x/T))){x=264;y=232}
this.player=this.person(x,y,S.look);this.player.body.setMass(5);this.physics.add.collider(this.player,this.walls);this.physics.add.collider(this.player,this.props,(_,obj)=>{if(job||performance.now()-bumpAt<2500||Math.hypot(obj.body.velocity.x,obj.body.velocity.y)<10)return;let w=this.people.find(q=>q.sprite.visible&&d(q.sprite,obj)<42);if(w){bumpAt=performance.now();S.calm=Math.max(0,S.calm-4);witnessIncident(S,-1,w.n.id,'collision');log(w.n.name+' witnessed an awkward collision.');toast('Oops. '+w.n.name+' saw that.');hud()}});this.physics.add.collider(this.props,this.walls);this.physics.add.collider(this.props,this.props);
for(let n of this.people){this.physics.add.collider(n.sprite,this.walls)}
this.cam=this.cameras.main;this.cam.roundPixels=true;this.cam.setBackgroundColor('#292d30');const mobile=this.scale.width<600;if(room===-1){this.cam.setBounds(0,0,this.cols*T,this.rows*T);this.cam.setZoom(mobile?2:1.65);this.cam.startFollow(this.player,true,.18,.18)}else{this.cam.stopFollow();this.cam.removeBounds();this.cam.setZoom(Math.min(this.scale.width/(this.cols*T+12),this.scale.height/(this.rows*T+12)));this.cam.centerOn(this.cols*T/2,this.rows*T/2)}
this.tint=this.add.rectangle(0,0,this.cols*T,this.rows*T,0x24304f,0).setOrigin(0).setDepth(9999);this.lightMarks=[];if(room===-1){for(const b of SHOPS){let x=(b.x+Math.floor(b.w/2)+.5)*T,y=(b.y+b.h+.5)*T;let light=this.add.rectangle(x,y-5,25,13,0xd9ad64,0).setDepth(10001);this.lightMarks.push(light)}}
this.input.on('pointerdown',p=>{if(dialogue)return;let v=this.cam.getWorldPoint(p.x,p.y);if(room===-1){let b=SHOPS.find(b=>v.x>=b.x*T&&v.x<(b.x+b.w)*T&&v.y>=b.y*T&&v.y<(b.y+b.h)*T);if(b){this.navigateDoor(b);return}let n=this.people.find(n=>n.sprite.visible&&d(n.sprite,v)<11);if(n){this.navigate(n.sprite.x,n.sprite.y+17,()=>{if(d(n.sprite,this.player)<32)talk(n.n);else toast('They have moved. Try again.')});return}}this.navigate(v.x,v.y)});
$('district').textContent=room===-1?'MAIN STREET':room===8?'APARTMENT':SHOPS[room].name.toUpperCase();$('boot').hidden=true;soundscape.ambience(room===-1?(S.minute>=1200||S.minute<360?'night':'street'):'interior');if(new URLSearchParams(location.search).has('qa'))window.townQA=()=>({player:{x:this.player.x,y:this.player.y,dir:this.player.dir,frame:Number(this.player.frame.name),phase:this.player.phase,look:S.look},vehicles:this.vehicles.map(({v,dir,color})=>({frame:v.frame.name,width:v.frame.cutWidth,height:v.frame.cutHeight,angle:v.angle,x:v.x,y:v.y,dir,color,cutX:v.frame.cutX,cutY:v.frame.cutY})),room,art:{version:ART_VERSION,actorTexture:this.player.texture.key,actorWidth:this.player.frame.cutWidth,actorHeight:this.player.frame.cutHeight,backdrop:room===-1?'town-backdrop-'+ART_VERSION:'room-backdrop-'+ART_VERSION+'-'+room,sound:soundscape.info()},town:{time:S.townAI.time,decisions:S.townAI.decisions,trades:S.townAI.trades,conversations:S.townAI.conversations,agents:S.townAI.agents.map(a=>({id:a.id,x:a.x,y:a.y,activity:a.activity,place:a.place,cash:a.cash,visits:a.visits,decisions:a.decisionCount,needs:{...a.needs}})),shops:S.townAI.shops.map(s=>({...s}))}});if(new URLSearchParams(location.search).has('qa'))window.townArtPreview=()=>({player:this.textures.get(this.player.texture.key).getSourceImage().toDataURL('image/png'),cars:this.textures.get(this.carKey).getSourceImage().toDataURL('image/png'),residents:RESIDENTS.map(n=>this.textures.get(installActor(this,n.look,n.id)).getSourceImage().toDataURL('image/png'))});showTab(tab);hud();if(afterRoom){let cb=afterRoom;afterRoom=null;cb()}}
tile(x,y,c,r,z=0){return this.add.image(x*T+8,y*T+8,'urban',F(c,r)).setDepth(z)}
rect(x,y,w,h,col,z=0,a=1){return this.add.rectangle(x,y,w,h,col,a).setOrigin(0).setDepth(z)}
label(x,y,t,z=20){return this.add.text(x,y,t,{fontFamily:'monospace',fontSize:'7px',color:'#fff0cc',backgroundColor:'#242a2d',padding:{x:3,y:2}}).setOrigin(.5).setDepth(z)}
solid(x,y,w,h){let a=this.add.zone((x+w/2)*T,(y+h/2)*T,w*T,h*T);this.physics.add.existing(a,true);this.walls.add(a);for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)this.blocked.add(yy*this.cols+xx)}
// Composition uses the original atlas for roofs, props, actors and ground detail;
// custom pixel-aligned structural trims provide continuous walls and shopfronts.
buildTown(){
 installWorldBackdrop(this,SHOPS);
 for(let i=0;i<8;i++){
  const dir=i%2?-1:1,model=VEHICLES[i%VEHICLES.length],lane=(i<4?16:36)+(dir<0?.75:2.25),x=(5+Math.floor(i/2)*18+(i%2)*7)%this.cols;
  const v=this.add.image(x*T,lane*T,this.carKey,model+(dir<0?'-left':'-right')).setDepth(100+Math.floor(lane*T));
  const shadow=this.add.image(v.x+2,v.y+2,this.effects.carShadow).setDepth(v.depth-1);
  this.vehicles.push({v,shadow,lane:lane*T,speed:36+i%3*5,dir,color:model});
 }
 for(const n of RESIDENTS){const a=S.townAI.agents[n.id],sp=this.person(a.x,a.y,n.look,n.id);sp.body.enable=false;sp.setVisible(a.place===-1);sp.shadow.setVisible(sp.visible);this.people.push({n,sprite:sp})}
 for(const b of SHOPS.filter(b=>b.id%2===0)){let p=door(b);this.prop(p.x-39,p.y+13)}
}
buildRoom(){
 const b=SHOPS[room];installRoomBackdrop(this,room,SHOPS,INTERIORS);
 if(b){let n=RESIDENTS[b.id];this.owner=this.person(216,112,n.look,n.id);this.owner.body.enable=false;this.owner.setVisible(S.townAI.agents[b.id].place===room);this.owner.shadow.setVisible(this.owner.visible);this.people.push({n,sprite:this.owner,owner:true});
 for(const visitor of RESIDENTS.filter(v=>v.id!==b.id)){const x=152+(visitor.id%4)*32,y=150+Math.floor(visitor.id/4)*22,sp=this.person(x,y,visitor.look,visitor.id);sp.body.enable=false;sp.setVisible(S.townAI.agents[visitor.id].place===room);sp.shadow.setVisible(sp.visible);this.people.push({n:visitor,sprite:sp,interiorX:x,interiorY:y})}
 }
 this.label(216,287,'EXIT',9000)
}

person(x,y,look,id=null){const key=installActor(this,look,id);let p=this.physics.add.sprite(x,y,key,characterFrame(look,'down')).setOrigin(.5,22/28);p.body.setSize(8,8).setOffset(6,20);p.setCollideWorldBounds(true);p.dir='down';p.phase=0;p.look=look;p.actorId=id;p.previousX=x;p.previousY=y;p.shadow=this.add.image(x,y+5,this.effects.shadow).setDepth(100+Math.floor(y)-1);return p}
animate(p,dt,look=p.look){const dx=p.x-p.previousX,dy=p.y-p.previousY,distance=Math.hypot(dx,dy);p.previousX=p.x;p.previousY=p.y;if(distance>.08){p.dir=facing(dx,dy,p.dir);p.phase=(p.phase+distance/5.5)%4}else p.phase=0;if(p.look!==look){p.look=look;p.setTexture(installActor(this,look,p.actorId),characterFrame(look,p.dir,p.phase));p.body.setSize(8,8).setOffset(6,20)}else p.setFrame(characterFrame(look,p.dir,p.phase));p.setDepth(100+Math.floor(p.y));p.shadow.setVisible(p.visible).setPosition(p.x,p.y+5).setDepth(p.depth-1);if(p===this.player)soundscape.walk(distance)}
prop(x,y,frame){let p=this.props.create(x,y,this.crateKey);p.body.setSize(12,12).setOffset(2,4);p.setDrag(140).setMaxVelocity(90).setBounce(.15).setCollideWorldBounds(true);return p}
findPath(p,x,y){let a={x:clamp(Math.floor(p.x/T),0,this.cols-1),y:clamp(Math.floor(p.y/T),0,this.rows-1)},e={x:clamp(Math.floor(x/T),0,this.cols-1),y:clamp(Math.floor(y/T),0,this.rows-1)};if(this.blocked.has(e.y*this.cols+e.x)){let best=Infinity,found=null;for(let yy=Math.max(0,e.y-4);yy<Math.min(this.rows,e.y+5);yy++)for(let xx=Math.max(0,e.x-4);xx<Math.min(this.cols,e.x+5);xx++){let z=Math.hypot(xx-e.x,yy-e.y);if(z<best&&!this.blocked.has(yy*this.cols+xx)){best=z;found={x:xx,y:yy}}}if(!found)return [];e=found}
let route=pathfind(this.cols,this.rows,this.blocked,a,e).map(q=>({x:(q.x+.5)*T,y:(q.y+.5)*T}));if(!route.length&&a.x===e.x&&a.y===e.y)route.push({x:(e.x+.5)*T,y:(e.y+.5)*T});return route}
stop(){this.route=[];this.arrive=null;this.player?.setVelocity(0);if(this.marker){this.marker.destroy();this.marker=null}}
navigate(x,y,cb){this.stop();this.route=this.findPath(this.player,x,y);if(!this.route.length){toast('No route available.');return}this.arrive=cb;let t=this.route[this.route.length-1];this.marker=this.add.image(t.x,t.y,this.effects.mark).setDepth(8000).setAlpha(.85)}
navigateDoor(b){let p=door(b);this.navigate(p.x,p.y,()=>enter(b))}
follow(p,path,speed){if(!path.length){p.setVelocity(0);return}let a=path[0],len=d(p,a);if(len<3){path.shift();p.setVelocity(0)}else p.setVelocity((a.x-p.x)/len*speed,(a.y-p.y)/len*speed)}
spawnCargo(){this.clearCargo();this.bay={x:344,y:228};this.bayMark=this.add.rectangle(344,228,48,36,0x8bb767,.2).setStrokeStyle(1,0xbce594).setDepth(4);this.bayLabel=this.label(344,202,'DELIVERY BAY',25);for(let i=0;i<3;i++)this.cargo.push(this.prop(80+i*20,220,F(4,10)))}
clearCargo(){for(let c of this.cargo||[])if(c.active)c.destroy();this.cargo=[];this.carry=null;this.bayMark?.destroy();this.bayLabel?.destroy();this.bay=null}
nearest(){let p=this.player;if(job?.b.kind==='cargo'){if(this.carry)return {kind:'cargo',sprite:this.carry};let c=this.cargo.find(c=>c.active&&d(c,p)<25);if(c)return {kind:'cargo',sprite:c}}
if(room!==-1){if(p.y>257&&Math.abs(p.x-216)<34)return {kind:'exit'};if(room===8&&p.y<130)return {kind:'rest'};if(this.owner&&d(p,this.owner)<28)return {kind:'owner'};let visitor=this.people.find(n=>!n.owner&&n.sprite.visible&&d(n.sprite,p)<24);if(visitor)return {kind:'npc',n:visitor.n}}
else{let b=SHOPS.find(b=>d(p,door(b))<20);if(b)return {kind:'door',b};let n=this.people.find(n=>n.sprite.visible&&d(n.sprite,p)<24);if(n)return {kind:'npc',n:n.n}}
return null}
act(){if(dialogue)return;let n=this.nearest();if(job?.b.kind==='cargo'){if(n?.kind==='cargo'){if(this.carry){let c=this.carry;this.carry=null;c.body.enable=true;c.body.reset(this.player.x,this.player.y+14)}else{this.carry=n.sprite;this.carry.body.enable=false}return}toast('Deliver the crates to the marked bay.');return}if(n?.kind==='door')enter(n.b);else if(n?.kind==='npc')talk(n.n);else if(n?.kind==='owner')shopMenu();else if(n?.kind==='exit')switchRoom(-1);else if(n?.kind==='rest')modal('YOUR APARTMENT',['Rest to recover composure.'],[['Sleep until morning',rest],['Continue',close]]);else toast('Approach a resident or doorway.')}
updateResidents(dt){
 for(const q of this.people){const a=S.townAI.agents[q.n.id],sp=q.sprite,visible=room===-1?a.place===-1:a.place===room;const was=sp.visible;sp.setVisible(visible);sp.shadow.setVisible(visible);if(!visible)continue;
 if(room===-1)sp.setPosition(a.x,a.y);
 else if(!q.owner){if(!was)sp.setPosition(q.interiorX,q.interiorY);else if(a.activity==='Shopping'||a.activity==='Browsing'||a.activity==='Exercising'){const t=S.townAI.time*.24+q.n.id*1.7;sp.setPosition(q.interiorX+Math.sin(t)*7,q.interiorY)}}
 if(!was){sp.previousX=sp.x;sp.previousY=sp.y;sp.phase=0}
 this.animate(sp,dt);
 if(d(sp,this.player)<42&&q.n.id!==this.lastLabelId){this.lastLabelId=q.n.id;this.lastLabel?.destroy();this.lastLabel=this.label(sp.x,sp.y-25,q.n.name,9000)}
 }
}
update(t,dt){dt=Math.min(dt,50);let sec=dt/1000,p=this.player;if(!p)return;
let dx=(held.right?1:0)-(held.left?1:0),dy=(held.down?1:0)-(held.up?1:0),speed=run||held.shift?98:65;
if(dialogue)p.setVelocity(0);else if(dx||dy){this.stop();let a=Math.hypot(dx,dy);p.setVelocity(dx/a*speed,dy/a*speed)}else if(this.route.length){this.follow(p,this.route,speed);if(!this.route.length){let cb=this.arrive;this.stop();if(cb){cb();return}}}else p.setVelocity(0);
this.animate(p,dt,S.look);
timeAcc+=sec;saveTimer+=sec;if(timeAcc>=1){timeAcc-=1;S.minute++;if(S.minute>=1440){S.minute=0;S.day++}if(!job)S.calm=Math.min(100,S.calm+.15);hud();refreshRegister()}
syncTown();this.updateResidents(dt);
if(room===-1){S.x=p.x;S.y=p.y;
for(let v of this.vehicles){v.v.x+=v.speed*sec*v.dir;if(v.v.x>this.cols*T+40)v.v.x=-40;if(v.v.x< -40)v.v.x=this.cols*T+40;v.shadow.setPosition(v.v.x+2,v.v.y+2)}}
for(let obj of this.props.getChildren())if(obj.active)obj.setDepth(100+Math.floor(obj.y));
if(this.carry){this.carry.setPosition(p.x,p.y-7);this.carry.setDepth(p.depth+1)}
if(job?.b.kind==='cargo'&&this.bay){for(let c of this.cargo.slice()){if(c.active&&c!==this.carry&&d(c,this.bay)<19){this.cargo=this.cargo.filter(x=>x!==c);c.destroy();job.score++;beep(550);toast('Delivered '+job.score+'/3');if(job.score===3){finishJob(3);break}}}}
if(job?.b.kind==='timing'&&$('needle'))$('needle').style.left=((1-Math.cos((performance.now()-job.start)/400))*50)+'%';
rumorTimer+=sec;if(rumorTimer>=8){rumorTimer=0;let changed=spreadRumors(S,townContacts(S.townAI));for(let c of changed){let n=RESIDENTS[c.target];if(n){if(c.rumor.actor===-1){log(n.name+' heard a rumor about your public behavior.');S.rep++}else if(RESIDENTS[c.rumor.actor])log(n.name+' heard a rumor about '+RESIDENTS[c.rumor.actor].name+'.')}}}
if(saveTimer>=7){saveTimer=0;save()}
if(this.lastLabel){let q=this.people.find(q=>q.n.id===this.lastLabelId);if(!q||!q.sprite.visible||d(q.sprite,p)>48){this.lastLabel.destroy();this.lastLabel=null;this.lastLabelId=null}else this.lastLabel.setPosition(q.sprite.x,q.sprite.y-25)}
const darkness=S.minute<360||S.minute>=1200?.36:S.minute>=1080?.16:0;this.tint.setAlpha(room===-1?darkness:0);for(const light of this.lightMarks)light.setAlpha(darkness*.22);const ambient=room===-1?(darkness>=.3?'night':'street'):'interior';if(soundscape.desired!==ambient)soundscape.ambience(ambient);if(this.marker)this.marker.setAlpha(.72+Math.sin(t/190)*.12);
let n=this.nearest();$('prompt').textContent=job?.b.kind==='cargo'?'DELIVERY '+job.score+'/3':n?.kind==='door'?'ACT · '+n.b.name:n?.kind==='npc'?'ACT · '+n.n.name:n?.kind==='owner'?'ACT · Business menu':n?.kind==='exit'?'ACT · Exit':n?.kind==='rest'?'ACT · Rest':'Tap a destination';
}}
const compact=window.matchMedia('(max-width:800px)').matches;game=new Phaser.Game({type:Phaser.AUTO,width:compact?480:640,height:compact?360:400,parent:'canvas',pixelArt:true,antialias:false,roundPixels:true,backgroundColor:'#252e31',banner:false,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{x:0,y:0},debug:false}},scene:[Town]});
}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
document.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held[b.dataset.move]=true;world?.stop()};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>held[b.dataset.move]=false});
$('run').onclick=()=>{run=!run;$('run').textContent=run?'WALK':'RUN'};$('act').onclick=()=>world?.act();$('mute').onclick=async()=>{muted=!muted;await soundscape.enable(!muted);muted=!soundscape.enabled;$('mute').textContent=muted?'Sound off':'Sound on';$('mute').setAttribute('aria-pressed',String(!muted));if(!muted)soundscape.play('switch')};
let km={w:'up',a:'left',s:'down',d:'right',arrowup:'up',arrowdown:'down',arrowleft:'left',arrowright:'right'};
window.addEventListener('keydown',e=>{let k=e.key.toLowerCase();if(km[k]){held[km[k]]=true;e.preventDefault();world?.stop()}if(k==='shift')held.shift=true;if(k==='e'&&!e.repeat)world?.act();if(k==='escape'&&!job)close()});window.addEventListener('keyup',e=>{let k=e.key.toLowerCase();if(km[k])held[km[k]]=false;if(k==='shift')held.shift=false});window.addEventListener('blur',()=>held={});window.addEventListener('pagehide',save);
hud();showTab('directory');boot();
