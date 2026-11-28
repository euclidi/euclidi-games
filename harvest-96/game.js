import {sim} from "./simulation.js";
const $=id=>document.getElementById(id),directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},seasons=["Spring","Summer","Autumn","Winter"];
let state=null,scene=null,tool="hoe",tab="Bag",lastMove=0,held=null,keys=new Set(),lastDraw="",pending=false;
const worker=new Worker("./worker.js",{type:"module"});
const db=await new Promise(resolve=>{try{let req=indexedDB.open("euclidi-harvest96",1);req.onupgradeneeded=()=>req.result.createObjectStore("saves");req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null)}catch{resolve(null)}});
const saved=await new Promise(resolve=>{if(!db)return resolve(null);const r=db.transaction("saves").objectStore("saves").get("current");r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null)});
function persist(){if(db&&state)db.transaction("saves","readwrite").objectStore("saves").put(state,"current")}
function send(c){if((c.type==="move"||c.type==="tick")&&pending)return;pending=true;worker.postMessage(c)}
worker.onmessage=e=>{pending=false;if(e.data.error){$("msg").textContent=e.data.error;return}state=e.data.state;if(e.data.message)$("msg").textContent=e.data.message;persist();updateUI();if(scene)render(scene)};
worker.onerror=e=>{$("msg").textContent="World worker error: "+e.message;pending=false};
function button(parent,label,fn,pressed){let b=document.createElement("button");b.textContent=label;b.onclick=fn;if(pressed!==undefined)b.setAttribute("aria-pressed",String(pressed));parent.append(b);return b}
function line(parent,text){const p=document.createElement("p");p.textContent=text;parent.append(p)}
function use(){if(!state)return;const [dx,dy]=directions[state.dir]||[0,1];send({type:"tool",item:tool,x:state.x+dx,y:state.y+dy})}
function updateUI(){
 if(!state)return;let s=state;const hh=Math.floor(s.minute/60),mm=s.minute%60;$("hud").textContent=seasons[sim.season(s)]+" "+((s.day-1)%30+1)+" · Year "+(Math.floor((s.day-1)/120)+1)+" | "+String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0")+" | "+s.weather.kind+" "+s.weather.temp+"°C | "+s.coins+" G | Energy "+Math.round(s.energy);
 const selected=JSON.stringify([tool,s.zone,s.unlocked,tab,s.inventory,s.animals,tab==="People"?s.npcs.map(({x,y,...n})=>n):null,s.market,s.ecology,s.ship,s.skills,s.health,Math.floor(s.hunger),s.campaignScore,tab==="Ledger"?[s.x,s.y,s.dir,s.plots]:null]);if(selected===lastDraw)return;lastDraw=selected;
 const t=$("tools");t.replaceChildren();for(const [k,l] of Object.entries({hoe:"Hoe",water:"Water",harvest:"Harvest",turnipSeed:"Turnip",potatoSeed:"Potato",cornSeed:"Corn",tomatoSeed:"Tomato",pumpkinSeed:"Pumpkin",cabbageSeed:"Cabbage",compost:"Compost",treat:"Treat",axe:"Axe",pick:"Pick",fish:"Rod",forage:"Forage"}))button(t,l,()=>{tool=k;lastDraw="";updateUI()},k===tool);
 const tr=$("travel");tr.replaceChildren();for(const z of s.unlocked)button(tr,z,()=>send({type:"travel",zone:z}),s.zone===z);
 const ts=$("tabs");ts.replaceChildren();for(const v of ["Bag","Market","Animals","People","Ledger","Build","Rest"])button(ts,v,()=>{tab=v;lastDraw="";updateUI()},tab===v);
 const p=$("details");p.replaceChildren();const h=document.createElement("h2");h.textContent=tab;p.append(h);
 if(tab==="Bag"){for(const [k,n] of Object.entries(s.inventory)){if(n<=0)continue;line(p,k+" × "+n);if(s.market[k])button(p,"Ship 1",()=>send({type:"sell",item:k}))}line(p,"Shipping: "+Object.values(s.ship).reduce((a,b)=>a+b,0)+" items")}
 if(tab==="Market"){for(const k of [...Object.keys(sim.crops).map(k=>k+"Seed"),"feed","bread"]){const price=k==="feed"?12:k.endsWith("Seed")?sim.crops[k.slice(0,-4)].seed:s.market[k].price;button(p,k+" · "+price+" G",()=>send({type:"buy",item:k}))}for(const [k,n] of Object.entries({chicken:250,cow:800,sheep:600}))button(p,k+" "+n+" G",()=>send({type:"animalBuy",item:k}));for(const [k,m] of Object.entries(s.market))line(p,k+" "+m.price+" G · stock "+m.supply)}
 if(tab==="Animals")for(const a of s.animals){line(p,a.type+" #"+a.id+" · health "+Math.round(a.health)+" · hunger "+Math.round(a.hunger)+" · affection "+a.bond+" · age "+a.age+"d");for(const op of ["feed","pet","collect","breed"])button(p,op,()=>send({type:"animal",id:a.id,op}))}
 if(tab==="People")for(const n of s.npcs){line(p,n.name+" · "+n.job+" · "+n.age+"y · "+(n.activity||"At home")+" · friendship "+n.bond+" · "+n.coins+"G");button(p,"Talk",()=>send({type:"talk",id:n.id}));button(p,"Work",()=>send({type:"job",item:n.job}))}
 if(tab==="Ledger"){for(const [k,v] of Object.entries(s.ecology))line(p,k+" "+Math.round(v));for(const [k,v] of Object.entries(s.skills))line(p,k+" XP "+v);line(p,"Fields: "+Object.keys(s.plots).length);const [dx,dy]=directions[s.dir]||[0,1],plot=s.plots[(s.x+dx)+","+(s.y+dy)];if(plot)line(p,"Facing plot: "+(plot.crop||"empty")+" · moisture "+Math.round(plot.moisture)+" · fertility "+Math.round(plot.fertility)+" · pests "+Math.round(plot.pest)+" · disease "+Math.round(plot.disease||0)+" · quality "+Math.round(plot.quality));if(s.campaignScore!==null)line(p,"Campaign score "+s.campaignScore);for(const m of s.log)line(p,m)}
 if(tab==="Build"){line(p,"Shed: 8 wood, 4 stone, 150 G. Built on your facing tile.");button(p,"Build shed",()=>{let [dx,dy]=directions[s.dir];send({type:"build",x:s.x+dx,y:s.y+dy})})}
 if(tab==="Rest"){line(p,"Health "+Math.round(s.health)+" · Hunger "+Math.round(s.hunger));button(p,"Eat",()=>send({type:"eat"}));button(p,"Sleep",()=>send({type:"sleep"}));button(p,"Wait 1 hour",()=>send({type:"wait"}));for(const mode of ["sandbox","campaign"])button(p,"New "+mode,()=>{if(confirm("Replace current save?"))send({type:"reset",mode})})}
}
const tile=16,W=40,H=30;let objects=[],drawKey="",people=[],previousZone="",lastTick=0;
const frame=(x,y)=>y*12+x;
function render(sc){
 if(!state||!sc.ready)return;let s=state;
 const key=JSON.stringify([s.zone,sim.season(s),s.plots,s.buildings,s.animals.map(a=>a.type),s.unlocked]);
 if(drawKey!==key){
  drawKey=key;objects.forEach(o=>o.destroy());objects=[];
  const put=(tex,x,y,f,depth=0,tint)=>{let im=sc.add.image(x*16,y*16,tex,f).setOrigin(0).setDepth(depth);if(tint)im.setTint(tint);objects.push(im);return im};
  const winter=sim.season(s)===3, autumn=sim.season(s)===2;
  const tint=winter?0xd5e4e6:autumn?0xdfbc83:0xffffff;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   let road=(x===14||x===15||y===8||y===9),inside=["house","barn"].includes(s.zone);
   if(inside){put("interior",x,y,frame(4,4));if(x===0||y===0||x===39||y===29)put("interior",x,y,frame(0,0),1);continue}
   if((s.zone==="farm"&&x>=31&&y>=21)||(s.zone==="lake"&&x>=19&&y>=10)){put("pond",x,y,undefined,0);continue}
   put("town",x,y,road?frame(1,2):frame((x*11+y*13)%17===0?2:1,0),0,tint);
   if(!road&&((x===0||y===0||x===39||y===29)||(["woods","meadow"].includes(s.zone)&&(x*13+y*7)%23===0))){put("town",x,y,frame(4+(x%2),0),2,tint)}
  }
  const house=(x,y)=>{for(let yy=0;yy<2;yy++)for(let xx=0;xx<3;xx++)put("town",x+xx,y+yy,frame(xx,4+yy),2);for(let xx=0;xx<3;xx++)put("town",x+xx,y+2,frame(3,6),2);put("town",x+1,y+2,frame(4,7),3);};
  if(s.zone==="farm"){house(5,4);house(27,4);for(let i=0;i<10;i++){put("town",4+i,26,frame(8,4),2)}for(const [k,p] of Object.entries(s.plots)){const [x,y]=k.split(",").map(Number);put("farm",x,y,frame(p.moisture>50?1:0,0),1);if(p.crop){let def=sim.crops[p.crop],stage=Math.min(3,Math.floor(p.growth/def.days*4));const cropRows={turnip:1,potato:2,corn:3,tomato:4,pumpkin:5,cabbage:1};put("farm",x,y,frame(4+stage,cropRows[p.crop]),3)}}for(const b of s.buildings)house(b.x,b.y)}
  if(s.zone==="village"){house(5,4);house(16,4);house(27,4);}
  if(s.zone==="barn")for(let i=0;i<s.animals.length;i++){let a=s.animals[i];put("farm",5+i%9*3,5+Math.floor(i/9)*4,frame(a.type==="chicken"?2:a.type==="cow"?0:1,10),4)}
  if(s.zone==="house"){put("interior",6,6,frame(3,6),2);put("interior",8,6,frame(4,6),2);put("interior",10,9,frame(6,6),2)}
 }
 if(previousZone!==s.zone){people.forEach(p=>p.destroy());people=[];previousZone=s.zone}if(s.zone==="village"){while(people.length<s.npcs.length){const i=people.length;people.push(sc.add.sprite(0,0,"interior",frame(i%7,7+Math.floor(i/7))).setDepth(5))}s.npcs.forEach((n,i)=>people[i].setPosition(n.x*16+8,n.y*16+8))}sc.player.setPosition(s.x*16+8,s.y*16+8).setFrame(frame(1,7)).setFlipX(s.dir==="left");
 sc.camera.centerOn(s.x*16+8,s.y*16+8);
}
if(globalThis.Phaser){
 class Rural extends Phaser.Scene{
  preload(){for(const k of ["farm","town","interior"])this.load.spritesheet(k,"./assets/"+k+".png",{frameWidth:16,frameHeight:16,spacing:1})}
  create(){scene=this;this.camera=this.cameras.main;this.camera.setBounds(0,0,W*16,H*16);const pond=this.textures.createCanvas("pond",16,16);const ctx=pond.getContext();ctx.fillStyle="#537f9b";ctx.fillRect(0,0,16,16);ctx.fillStyle="#6599b1";for(const [x,y,w] of [[2,3,4],[10,8,5],[4,13,3]])ctx.fillRect(x,y,w,1);ctx.fillStyle="#426d89";ctx.fillRect(7,5,3,1);pond.refresh();this.player=this.add.sprite(0,0,"interior",frame(1,7)).setDepth(10);this.ready=true;$("boot").hidden=true;render(this);this.input.on("pointerdown",pointer=>{if(!state)return;let w=this.camera.getWorldPoint(pointer.x,pointer.y),x=Math.floor(w.x/16),y=Math.floor(w.y/16);if(Math.abs(x-state.x)+Math.abs(y-state.y)<=1)send({type:"tool",item:tool,x,y});else{let dx=Math.sign(x-state.x),dy=Math.sign(y-state.y);if(Math.abs(x-state.x)>Math.abs(y-state.y))dy=0;else dx=0;send({type:"move",dx,dy})}})}
  update(t){if(state&&t-lastTick>=2000){lastTick=t;send({type:"tick",minutes:5})}if(!state||t-lastMove<125)return;let d=held||["up","down","left","right"].find(d=>keys.has(d));const gp=navigator.getGamepads?.()[0];if(!d&&gp){const [x,y]=gp.axes;if(Math.abs(x)>.4)d=x<0?"left":"right";else if(Math.abs(y)>.4)d=y<0?"up":"down";const pressed=gp.buttons[0]?.pressed;if(pressed&&!this.wasPressed)use();this.wasPressed=pressed}if(d){lastMove=t;let [dx,dy]=directions[d];send({type:"move",dx,dy})}}
 }
 new Phaser.Game({type:Phaser.AUTO,parent:"screen",width:256,height:224,pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:Rural,backgroundColor:"#46623e"});
}
const keymap={ArrowUp:"up",w:"up",ArrowDown:"down",s:"down",ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right"};
addEventListener("keydown",e=>{let d=keymap[e.key];if(d){e.preventDefault();keys.add(d)}if([" ","Enter"].includes(e.key)&&e.target.tagName!=="BUTTON"){e.preventDefault();if(!e.repeat)use()}});
addEventListener("keyup",e=>keys.delete(keymap[e.key]));addEventListener("blur",()=>{keys.clear();held=null});document.querySelectorAll("[data-move]").forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held=b.dataset.move};b.onpointerup=b.onpointercancel=()=>held=null});$("act").onclick=use;
send({type:"init",state:saved,mode:"sandbox"});