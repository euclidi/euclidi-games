// Independent domain model; merge with authoritative character state before gameplay integration.
export function worldFactory(){
 const places={market:["merchant","food","trade"],barracks:["recruit","train"],forest:["hunt","gather"],workshop:["craft","apprentice"],lodging:["sleep","rent"],range:["practice"],farm:["work","gather"],poor:["trade"],walls:["patrol"]};
 const profiles={casual:{loss:0,injury:0},standard:{loss:.15,injury:20},hardcore:{loss:.5,injury:70},ironman:{loss:1,injury:100}};
 const jobs={delivery:{minutes:60,pay:6,place:"market"},farm:{minutes:120,pay:8,place:"farm"},patrol:{minutes:90,pay:10,place:"walls",faction:"military"},hunt:{minutes:120,pay:12,place:"forest",faction:"hunters"},apprentice:{minutes:90,pay:5,place:"workshop",faction:"artisans"}};
 const residents=[{id:"mara",role:"merchant",home:"lodging",work:"market",faction:"merchants"},{id:"iren",role:"guard",home:"barracks",work:"walls",faction:"military"},{id:"tavin",role:"hunter",home:"lodging",work:"forest",faction:"hunters"},{id:"sona",role:"artisan",home:"lodging",work:"workshop",faction:"artisans"},{id:"pell",role:"farmer",home:"farm",work:"farm",faction:"farmers"}];
 const clamp=(n,l,h)=>Math.max(l,Math.min(h,n));
 const newWorld=(origin="commoner",profile="standard")=>{if(!profiles[profile])throw Error("Bad consequence profile");return {version:1,origin,profile,minute:480,coins:origin==="noble"?100:12,place:"market",hunger:0,fatigue:0,health:100,dead:false,accommodation:null,rentPaidThrough:0,items:{},factions:{},relations:{},crime:[],rumors:[],wanted:0,prisonUntil:0,completed:[],job:null,npcs:residents.map(n=>({...n,location:n.work,possessions:{coins:10},mood:"normal"}))}};
 const day=w=>Math.floor(w.minute/1440);
 function schedule(n,t){let h=(t%1440)/60;return h<6||h>=21?n.home:h>=18?"market":n.work}
 function tick(w,minutes){if(!Number.isSafeInteger(minutes)||minutes<0||minutes>10080)throw Error("Invalid elapsed time");if(w.dead)return;const before=day(w);w.minute+=minutes;w.hunger=clamp(w.hunger+minutes*.025,0,100);w.fatigue=clamp(w.fatigue+minutes*.02,0,100);if(w.hunger>=100)w.health=clamp(w.health-minutes*.015,0,100);for(const n of w.npcs)n.location=schedule(n,w.minute);if(w.accommodation&&w.minute>=w.rentPaidThrough)w.accommodation=null;if(w.job&&w.minute>=w.job.end){w.coins+=jobs[w.job.id].pay;w.completed.push(w.job.id);w.job=null}if(w.prisonUntil&&w.minute>=w.prisonUntil){w.prisonUntil=0;w.wanted=0;w.place="market"}if(w.health<=0)defeat(w);return day(w)-before}
 function travel(w,p){if(!places[p]||w.dead||w.prisonUntil||w.job)return false;w.place=p;tick(w,10);return true}
 function addItem(w,id,n=1){if(!Number.isSafeInteger(n)||n<1)throw Error("Invalid quantity");w.items[id]=(w.items[id]||0)+n}
 function consume(w,id,n=1){if(!Number.isSafeInteger(n)||n<1||(w.items[id]||0)<n)return false;w.items[id]-=n;return true}
 function purchase(w,id,n,unit){if(w.dead||!["market","workshop","poor"].includes(w.place)||!Number.isSafeInteger(n)||!Number.isSafeInteger(unit)||n<1||unit<1||w.coins<n*unit)return false;w.coins-=n*unit;addItem(w,id,n);return true}
 function eat(w){if(!consume(w,"food"))return false;w.hunger=Math.max(0,w.hunger-35);return true}
 function rent(w){if(w.place!=="lodging"||w.coins<4)return false;w.coins-=4;w.accommodation="lodging";w.rentPaidThrough=Math.max(w.minute,w.rentPaidThrough)+1440;return true}
 function sleep(w){if(w.place!==w.accommodation||!w.accommodation||w.dead)return false;tick(w,480);w.fatigue=Math.max(0,w.fatigue-70);w.health=Math.min(100,w.health+10);return true}
 function join(w,faction){const loc={military:"barracks",hunters:"forest",artisans:"workshop",merchants:"market"}[faction];if(!loc||w.place!==loc||w.wanted||w.dead)return false;w.factions[faction]=w.factions[faction]||1;return true}
 function startJob(w,id){const j=jobs[id];if(!j||w.dead||w.prisonUntil||w.job||w.place!==j.place||(j.faction&&!w.factions[j.faction]))return false;w.job={id,end:w.minute+j.minutes};return true}
 function witness(w,{id,kind,location,witnesses}){if(w.dead||!id||w.crime.some(c=>c.id===id)||!["theft","trespass","poach","assault"].includes(kind)||!places[location])return false;const seen=[...new Set(witnesses)].filter(id=>w.npcs.some(n=>n.id===id&&n.location===location));const severity={theft:2,trespass:1,poach:2,assault:4}[kind];w.crime.push({id,kind,location,witnesses:seen,time:w.minute});if(seen.length){w.wanted+=severity;for(const id of seen)w.relations[id]=(w.relations[id]||0)-severity;w.rumors.push({kind,location,time:w.minute})}return true}
 function fine(w){const cost=w.wanted*5;if(!cost||w.coins<cost)return false;w.coins-=cost;w.wanted=0;return true}
 function surrender(w){if(!w.wanted||w.dead)return false;w.prisonUntil=w.minute+w.wanted*180;w.place="barracks";w.job=null;return true}
 function defeat(w){if(w.dead)return;const p=profiles[w.profile];if(w.profile==="ironman"){w.dead=true;w.health=0;return}w.coins=Math.floor(w.coins*(1-p.loss));w.health=100-p.injury;w.fatigue=30;w.place=w.accommodation||"lodging";w.job=null}
 function serialize(w){return JSON.stringify(w)}
 function restore(s){const w=JSON.parse(s);if(w.version!==1||!places[w.place]||!profiles[w.profile]||!Number.isFinite(w.minute)||!Array.isArray(w.npcs)||!w.items)throw Error("Invalid world snapshot");return w}
 return {places,jobs,newWorld,day,tick,travel,addItem,consume,purchase,eat,rent,sleep,join,startJob,witness,fine,surrender,defeat,serialize,restore};
}
