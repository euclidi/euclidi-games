export function engine(){
 const crops={turnip:{days:4,season:[0],value:55,seed:15},potato:{days:6,season:[0,2],value:85,seed:25},corn:{days:9,season:[1],value:110,seed:35},tomato:{days:7,season:[1],value:95,seed:30},pumpkin:{days:10,season:[2],value:160,seed:50},cabbage:{days:8,season:[0,2],value:125,seed:40}};
 const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
 const names=["Mara","Tomas","Lina","Elias","Iris","Robin","Ada","Hugo","Nora","Felix","Milo","June"];
 const jobs=["merchant","carpenter","rancher","fisher","farmer","baker"];
 function rnd(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296}
 function fresh(mode="sandbox"){
  let s={version:1,mode,rng:24562096,day:1,minute:360,coins:500,energy:100,hunger:10,health:100,zone:"farm",x:15,y:16,dir:"down",inventory:{turnipSeed:12,potatoSeed:6,feed:12,wood:0,stone:0},skills:{farming:0,fishing:0,husbandry:0,crafting:0,commerce:0},plots:{},animals:[{id:1,type:"chicken",age:40,hunger:15,health:90,bond:40,gene:.8,pregnancy:0}],npcs:[],market:{},weather:{kind:"clear",temp:17,humidity:55,wind:5},ecology:{fish:120,trees:200,pollinators:80,water:90,deer:30,predators:8},buildings:[],ship:{},log:["Your grandfather's farm is yours to restore."],unlocked:["farm","village","woods","house","barn"],campaignScore:null};
  for(let i=0;i<names.length;i++)s.npcs.push({id:i,name:names[i],job:jobs[i%6],age:20+i*3,coins:200+i*20,hunger:10,bond:0,partner:null,children:0,x:5+(i%6)*5,y:9+Math.floor(i/6)*10,homeX:5+(i%6)*5,homeY:8+Math.floor(i/6)*10});
  for(const [k,c] of Object.entries(crops))s.market[k]={supply:40,demand:40,price:c.value};
  for(const [k,p] of Object.entries({egg:45,milk:90,fish:60,wood:15,stone:20,berry:35,wool:105,honey:70,bread:60}))s.market[k]={supply:40,demand:40,price:p};
  return s;
 }
 const season=s=>Math.floor((s.day-1)/30)%4;
 const add=(s,k,n)=>s.inventory[k]=(s.inventory[k]||0)+n;
 const note=(s,m)=>{s.log.unshift(m);s.log=s.log.slice(0,12);return m};
 function schedules(s){
  const hour=s.minute/60;
  for(const n of s.npcs){
    const work=hour>=8&&hour<17, evening=hour>=17&&hour<21;
    const goal=work?{x:6+(n.id%3)*11,y:8+Math.floor(n.id/6)*2}:evening?{x:12+(n.id%6)*2,y:18+Math.floor(n.id/6)*2}:{x:n.homeX,y:n.homeY};
    n.activity=work?"Working":evening?"Socializing":"At home";
    const dx=goal.x-n.x,dy=goal.y-n.y;
    if(dx)n.x+=Math.sign(dx);else if(dy)n.y+=Math.sign(dy);
  }
 }
 function advance(s,n=10){let remaining=Math.max(0,Math.min(1440,n));while(remaining>0){const step=Math.min(remaining,10,1440-s.minute);s.minute+=step;s.hunger=clamp(s.hunger+step/180);remaining-=step;if(s.minute>=1440){s.minute=0;daily(s)}if(s.minute%10===0)schedules(s)}}
 function daily(s){
  s.day++; const se=season(s),r=rnd(s);
  s.weather={kind:r<.13?(se===3?"snow":"storm"):r<.38?(se===3?"snow":"rain"):r>.95?"drought":"clear",temp:[17,28,14,-3][se]+Math.round(rnd(s)*12-6),humidity:Math.round(40+rnd(s)*45),wind:Math.round(rnd(s)*24)};
  let rain=["rain","storm","snow"].includes(s.weather.kind);
  s.ecology.water=clamp(s.ecology.water+(rain?8:-4));s.ecology.trees=clamp(s.ecology.trees+Math.max(0,s.ecology.water/100)*2,0,240);s.ecology.fish=clamp(s.ecology.fish+(s.ecology.water-40)/12,0,180);s.ecology.pollinators=clamp(s.ecology.pollinators+(se===3?-4:2));s.ecology.deer=clamp(s.ecology.deer+s.ecology.trees/160-s.ecology.predators/14,0,60);s.ecology.predators=clamp(s.ecology.predators+(s.ecology.deer-20)/25,0,15);
  for(const p of Object.values(s.plots)){p.moisture=clamp(p.moisture+(rain?65:-35)-(s.weather.kind==="drought"?20:0)); if(!p.crop){p.fertility=clamp(p.fertility+2);continue}const c=crops[p.crop];p.pest=clamp(p.pest+(rnd(s)<.2?12:-5));p.disease=clamp((p.disease||0)+(p.moisture>80&&s.weather.humidity>70?8:-3));if(c.season.includes(se)&&p.moisture>=25&&s.weather.temp>1){p.growth+=clamp((p.fertility+30)/100*(1-p.pest/150)*(1-p.disease/150),.2,1.15);p.fertility=clamp(p.fertility-2);p.quality=clamp(p.quality+(p.moisture>45?2:-3)-p.pest*.06-p.disease*.04)}else p.quality=clamp(p.quality-12);if(p.quality<=0){p.crop=null;p.growth=0}}
  for(const a of s.animals){a.age++;a.hunger=clamp(a.hunger+32);a.health=clamp(a.health+(a.hunger>65?-12:2));if(a.pregnancy>0&&--a.pregnancy===0&&s.animals.length<40)s.animals.push({id:Math.max(...s.animals.map(v=>v.id))+1,type:a.type,age:0,hunger:10,health:100,bond:20,gene:clamp(a.gene+(rnd(s)-.5)*.2,.5,1.2),pregnancy:0});if(a.health>65&&a.hunger<65&&a.age>20&&a.age<({chicken:500,cow:1000,sheep:850}[a.type]||500)){const k={chicken:"egg",cow:"milk",sheep:"wool"}[a.type];if(k)a.product=(a.product||0)+1;}if(a.health===0)note(s,"An animal is seriously ill; feed and care for it.");}
  for(const n of s.npcs){n.hunger=clamp(n.hunger+20);let k={farmer:"turnip",rancher:"egg",fisher:"fish",carpenter:"wood",baker:"bread",merchant:"potato"}[n.job];let m=s.market[k];m.supply+=2+Math.floor(rnd(s)*4);n.coins+=m.price;let food=s.market.bread;if(n.coins>=food.price){n.coins-=food.price;food.demand+=2;n.hunger=clamp(n.hunger-45)}if(s.day%120===0)n.age++;if(n.partner===null&&s.day%30===0&&rnd(s)<.35){let mate=s.npcs.find(v=>v.id!==n.id&&v.partner===null);if(mate){n.partner=mate.id;mate.partner=n.id;note(s,n.name+" and "+mate.name+" formed a household.")}}}
  let pay=0;for(const [k,v] of Object.entries(s.ship)){if(s.market[k]){pay+=s.market[k].price*v;s.market[k].supply+=v}}s.ship={};s.coins+=pay;
  for(const [k,m] of Object.entries(s.market)){let base=crops[k]?.value||{egg:45,milk:90,fish:60,wood:15,stone:20,berry:35,wool:105,honey:70,bread:60}[k];let sold=Math.min(m.supply,Math.max(1,Math.round(m.demand/10)));m.supply=clamp(m.supply-sold,0,300);m.demand=clamp(m.demand+Math.round(rnd(s)*8)-4,10,120);m.price=Math.round(base*clamp((m.demand+20)/(m.supply+20),.55,2.6));}
  s.energy=100;s.hunger=clamp(s.hunger-20);s.health=clamp(s.health+(s.hunger>80?-5:1));if(s.day>=15&&!s.unlocked.includes("lake")){s.unlocked.push("lake");note(s,"The mountain lake trail is now open.")}if(s.day>=35&&!s.unlocked.includes("meadow")){s.unlocked.push("meadow");note(s,"The northern meadow trail is now open.")}
  if(s.mode==="campaign"&&s.day>=301&&s.campaignScore===null){s.campaignScore=Math.round(s.coins+Object.keys(s.plots).length*25+s.animals.length*200+s.buildings.length*500+s.npcs.reduce((a,n)=>a+n.bond*5,0));note(s,"Campaign evaluation: "+s.campaignScore+" points. Continue living here.")}
  if(pay)note(s,"Shipping earnings: "+pay+" G.");
 }
 function blocked(s,x,y){if(x<1||y<1||x>38||y>28)return true;if(s.zone==="farm"){if(x>=5&&x<=7&&y>=4&&y<=7)return !(x===6&&y===7);if(x>=27&&x<=29&&y>=4&&y<=7)return !(x===28&&y===7);if(x>=31&&y>=21)return true}if(s.zone==="village"&&y>=4&&y<=7&&((x>=5&&x<=7)||(x>=16&&x<=18)||(x>=27&&x<=29)))return true;if(s.zone==="lake"&&x>=19&&y>=10)return true;if(s.zone==="farm"&&s.buildings.some(b=>x>=b.x&&x<b.x+3&&y>=b.y&&y<b.y+4))return true;return false}
 function action(s,c){
  let msg="",p=s.plots[c.x+","+c.y],k=c.item;
  if(c.type==="tick"){advance(s,Math.min(10,Math.max(1,c.minutes||1)));return ""}
  if(c.type==="move"){let dx=clamp(c.dx,-1,1),dy=clamp(c.dy,-1,1);if(dx&&dy)dy=0;s.dir=dx<0?"left":dx>0?"right":dy<0?"up":"down";let x=s.x+dx,y=s.y+dy;if(!blocked(s,x,y)){s.x=x;s.y=y;advance(s,1)}return ""}
  if(c.type==="travel"){if(!s.unlocked.includes(c.zone))return "That trail is closed.";s.zone=c.zone;s.x=15;s.y=16;advance(s,15);return note(s,"Entered "+c.zone+".")}
  if(c.type==="sleep"){daily(s);s.minute=360;schedules(s);return note(s,"A new day begins.")}
  if(c.type==="wait"){advance(s,60);return note(s,"An hour passes.")}
  if(c.type==="eat"){let food=["bread","berry","turnip","potato","fish","egg"].find(k=>s.inventory[k]>0);if(!food)return "No food in bag.";add(s,food,-1);s.hunger=clamp(s.hunger-35);s.energy=clamp(s.energy+18);return note(s,"Ate "+food+".")}
  if(c.type==="buy"){let price=k==="feed"?12:k.endsWith("Seed")?crops[k.slice(0,-4)]?.seed:s.market[k]?.price;if(!price||s.coins<price)return "Not enough gold.";s.coins-=price;add(s,k,1);return note(s,"Bought "+k+".")}
  if(c.type==="sell"){if(!s.market[k]||!(s.inventory[k]>0))return "Nothing to ship.";add(s,k,-1);s.ship[k]=(s.ship[k]||0)+1;s.skills.commerce++;return note(s,"Packed "+k+" for shipping.")}
  if(c.type==="animalBuy"){let price={chicken:250,cow:800,sheep:600}[k];if(!price||s.coins<price)return "Not enough gold.";if(s.animals.length>=40)return "The barn is full.";s.coins-=price;s.animals.push({id:Math.max(0,...s.animals.map(v=>v.id))+1,type:k,age:30,hunger:10,health:100,bond:20,gene:.8+rnd(s)*.4,pregnancy:0});return note(s,"Welcome, "+k+".")}
  if(c.type==="animal"){let a=s.animals.find(a=>a.id===c.id);if(!a)return "No animal.";if(c.op==="feed"){if(!s.inventory.feed)return "No feed.";add(s,"feed",-1);a.hunger=clamp(a.hunger-55);a.health=clamp(a.health+4);a.bond=clamp(a.bond+2)}else if(c.op==="pet"){a.bond=clamp(a.bond+3);advance(s,5)}else if(c.op==="collect"){if(!a.product)return "No product today.";add(s,{chicken:"egg",cow:"milk",sheep:"wool"}[a.type],a.product);a.product=0}else if(c.op==="breed"){if(a.age<25||a.pregnancy||a.health<75||!s.animals.some(v=>v.id!==a.id&&v.type===a.type))return "Requires two healthy adult animals.";a.pregnancy={chicken:5,cow:18,sheep:12}[a.type]}s.skills.husbandry++;return note(s,"Animal care: "+c.op+".")}
  if(c.type==="talk"){let n=s.npcs.find(n=>n.id===c.id);if(!n)return "Nobody nearby.";n.bond=clamp(n.bond+2);advance(s,10);return note(s,n.name+": "+(s.weather.kind==="rain"?"The fields needed that rain.":"The "+n.job+"'s work never ends."))}
  if(c.type==="job"){let n=s.npcs.find(n=>n.job===k);if(!n)return "No employer.";if(s.mode==="campaign"&&s.day<301)return "Restore the farm first; other jobs unlock after evaluation.";if(n.coins<35+s.skills.commerce)return "Employer cannot pay today.";if(s.energy<20)return "Too tired.";let wage=35+s.skills.commerce;s.coins+=wage;n.coins=clamp(n.coins-wage,0,99999);s.energy-=20;advance(s,120);return note(s,"Worked as "+k+" for "+wage+" G.")}
  if(c.type==="build"){if(s.inventory.wood<8||s.inventory.stone<4||s.coins<150)return "Need 8 wood, 4 stone and 150 G.";if(s.zone!=="farm"||!Number.isInteger(c.x)||!Number.isInteger(c.y)||blocked(s,c.x,c.y)||s.buildings.some(b=>b.x===c.x&&b.y===c.y)||p)return "Choose open farm ground.";s.coins-=150;add(s,"wood",-8);add(s,"stone",-4);s.buildings.push({kind:"shed",x:c.x,y:c.y});s.skills.crafting++;return note(s,"Built a storage shed.")}
  if(c.type!=="tool")return "Unknown action.";
  if(s.energy<3)return "Too tired; eat or sleep.";
  if(Math.abs(c.x-s.x)+Math.abs(c.y-s.y)>1)return "Move closer.";
  if(k==="hoe"&&s.zone==="farm"&&!blocked(s,c.x,c.y)&&c.x>=3&&c.x<30&&c.y>=10&&c.y<26&&!p){s.plots[c.x+","+c.y]={crop:null,growth:0,moisture:40,fertility:85,quality:75,pest:0,last:null};msg="Tilled soil."}
  else if(k.endsWith("Seed")&&s.zone==="farm"&&p&&!p.crop&&s.inventory[k]>0){let crop=k.slice(0,-4),def=crops[crop];if(!def||!def.season.includes(season(s)))return "Wrong planting season.";p.crop=crop;p.growth=0;p.quality=75;if(p.last===crop)p.fertility=clamp(p.fertility-8);else p.fertility=clamp(p.fertility+3);add(s,k,-1);msg="Planted "+crop+"."}
  else if(k==="water"&&p&&s.zone==="farm"){p.moisture=100;msg="Watered soil."}
  else if(k==="harvest"&&p?.crop&&s.zone==="farm"&&p.growth>=crops[p.crop].days){let crop=p.crop;add(s,crop,p.quality>=85?2:1);p.last=crop;p.crop=null;p.growth=0;msg="Harvested "+crop+"."}
  else if(k==="treat"&&p?.crop&&s.zone==="farm"){if(s.coins<5)return "Treatment costs 5 G.";s.coins-=5;p.pest=clamp(p.pest-40);p.disease=clamp((p.disease||0)-35);s.ecology.pollinators=clamp(s.ecology.pollinators-1);msg="Treated crop."}
  else if(k==="compost"&&p&&s.zone==="farm"){if(!s.inventory.feed)return "Need organic material (feed).";add(s,"feed",-1);p.fertility=clamp(p.fertility+25);msg="Enriched soil."}
  else if(k==="fish"&&["woods","lake","farm"].includes(s.zone)&&((s.zone==="farm"&&s.x>=29&&s.y>=20)||s.zone==="lake"||s.zone==="woods")&&s.ecology.fish>1){s.ecology.fish-=1;add(s,"fish",1);s.skills.fishing++;msg="Caught a fish."}
  else if(k==="axe"&&["woods","meadow"].includes(s.zone)&&s.ecology.trees>2){s.ecology.trees-=2;add(s,"wood",2);msg="Gathered wood."}
  else if(k==="pick"&&["woods","meadow"].includes(s.zone)){add(s,"stone",2);msg="Gathered stone."}
  else if(k==="forage"&&["woods","meadow"].includes(s.zone)){add(s,"berry",1);msg="Gathered berries."}
  else return "Nothing to do here.";
  s.energy=clamp(s.energy-3);s.skills.farming+=k==="fish"?0:1;advance(s,8);return note(s,msg)
 }
 return {fresh,action,daily,advance,season,crops,blocked};
}
export const sim=engine();
